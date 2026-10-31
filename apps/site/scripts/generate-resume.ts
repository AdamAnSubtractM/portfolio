import { writeFile, mkdir } from 'fs/promises';
import { chromium, type Browser } from 'playwright-chromium';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { PDFDocument } from 'pdf-lib';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile, readdir, stat } from 'node:fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.ico': 'image/x-icon'
};

// Astro absolute paths like `/_astro/foo.css` only resolve under an HTTP origin, not file://.
// Spin up a tiny static server over `dist/client` so external stylesheets/fonts/scripts load
// the same way the deployed site serves them.
async function startStaticServer(rootDir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      let target = join(rootDir, decodeURIComponent(url.pathname));
      const info = await stat(target).catch(() => null);
      if (info?.isDirectory()) target = join(target, 'index.html');
      const body = await readFile(target);
      res.writeHead(200, { 'Content-Type': MIME[extname(target)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = (server.address() as AddressInfo).port;
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve()))
  };
}

const distRoot = join(__dirname, '../dist/client');
const DEFAULT_RESUME_SLUG = 'portfolio';
const DESIRED_PAGE_COUNT = 3;
const DEFAULT_FONT_SIZE = 1.0;
const MIN_FONT_SIZE = 0.5;
const TOLERANCE = 0.01;
const PDF_OPTIONS = { width: '8.5in', height: '11in', printBackground: true } as const;

// Local-only: CI on Cloudflare can't run headless Chromium (no GTK libs in the sandbox).
// The deploy workflow and `pnpm deploy:local` run this after the build. Every PDF goes only to
// dist/client/ and is never committed.
type Target = { route: string; outputPath: string };

const baseTarget: Target = { route: '/resume/', outputPath: join(distRoot, 'adam-knee-resume.pdf') };
const variantTarget = (slug: string): Target => ({
  route: `/resume/${slug}/`,
  outputPath: join(distRoot, `adam-knee-${slug}.pdf`)
});

// The base resume is /resume/ and gets adam-knee-resume.pdf. Each variant is /resume/<slug>/ and gets
// adam-knee-<slug>.pdf. PrintResumeButton links to these names. With no argument, make every PDF.
async function findTargets(slug: string | undefined): Promise<Target[]> {
  if (slug) return [slug === DEFAULT_RESUME_SLUG ? baseTarget : variantTarget(slug)];
  const entries = await readdir(join(distRoot, 'resume'), { withFileTypes: true });
  return [baseTarget, ...entries.filter((entry) => entry.isDirectory()).map((entry) => variantTarget(entry.name))];
}

async function renderTarget(browser: Browser, origin: string, target: Target): Promise<void> {
  const url = `${origin}${target.route}`;
  console.log(`Loading resume from ${url}.`);
  const page = await browser.newPage();
  try {
    // Honor `@media print` rules in PDFLayout/global.css so the PDF picks up print styling.
    await page.emulateMedia({ media: 'print' });

    // Navigate once. Only the font-size changes between iterations, so re-fetching the
    // HTML/CSS/fonts every loop wastes most of the wall time.
    const response = await page.goto(url, { waitUntil: 'networkidle' });
    if (!response?.ok()) throw new Error(`${url} returned ${response?.status() ?? 'no response'}.`);

    const renderAt = async (size: number) => {
      await page.evaluate((s) => {
        document.querySelector('#pdf')?.setAttribute('style', `font-size: ${s}em;`);
      }, size);
      const pdfBuffer = await page.pdf(PDF_OPTIONS);
      const buffer = await (await PDFDocument.load(pdfBuffer)).save();
      const pageCount = (await PDFDocument.load(buffer)).getPageCount();
      console.log(`Rendered PDF at font-size ${size.toFixed(4)}em → ${pageCount} pages.`);
      return { buffer, pageCount };
    };

    let bestBuffer: Uint8Array | undefined;
    let bestPageCount = 0;
    let bestFontSize = 0;

    // Try the ideal size first. It usually fits on its own.
    const initial = await renderAt(DEFAULT_FONT_SIZE);
    if (initial.pageCount <= DESIRED_PAGE_COUNT) {
      bestBuffer = initial.buffer;
      bestPageCount = initial.pageCount;
      bestFontSize = DEFAULT_FONT_SIZE;
    } else {
      // Binary search for the largest font-size that still fits within the page budget.
      let low = MIN_FONT_SIZE;
      let high = DEFAULT_FONT_SIZE;
      while (high - low > TOLERANCE) {
        const mid = (low + high) / 2;
        const result = await renderAt(mid);
        if (result.pageCount <= DESIRED_PAGE_COUNT) {
          bestBuffer = result.buffer;
          bestPageCount = result.pageCount;
          bestFontSize = mid;
          low = mid;
        } else {
          high = mid;
        }
      }
      // Fallback: nothing in the search range fit. Render once at the floor and ship it.
      if (!bestBuffer) {
        const floor = await renderAt(low);
        bestBuffer = floor.buffer;
        bestPageCount = floor.pageCount;
        bestFontSize = low;
      }
    }

    await mkdir(dirname(target.outputPath), { recursive: true });
    await writeFile(target.outputPath, bestBuffer);
    console.log(`Final PDF written to ${target.outputPath} (${bestPageCount} pages at ${bestFontSize.toFixed(4)}em).`);
  } finally {
    await page.close();
  }
}

async function generatePdfs(): Promise<void> {
  const targets = await findTargets(process.argv[2]);
  const server = await startStaticServer(distRoot);
  const browser = await chromium.launch();
  try {
    for (const target of targets) await renderTarget(browser, server.origin, target);
  } finally {
    await browser.close();
    await server.close();
  }
}

generatePdfs().catch((error) => {
  console.error('[Node]: Failed to generate PDF', error);
  process.exit(1);
});
