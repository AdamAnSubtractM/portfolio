import { writeFile, mkdir } from 'fs/promises';
import { chromium } from 'playwright-chromium';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';
import { PDFDocument } from 'pdf-lib';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { readFile, stat } from 'node:fs/promises';

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

async function generatePdf() {
  const pubDir = './public';
  const distRoot = join(__dirname, '../dist/client');
  const name = 'adam-knee';
  const filename = `${name}-resume.pdf`;
  const settings = {
    initSettings: {
      width: '8.5in',
      height: '11in',
      printBackground: true
    },
    // Local-only: CI on Cloudflare Pages can't run headless Chromium (no GTK libs in the
    // sandbox). Run `pnpm build:withResume` locally and commit the resulting PDF; Astro's
    // build copies public/ -> dist/client/ on the next CI build.
    outputPath: join(pubDir, filename),
    routePath: '/resume/',
    desiredPageCount: 3,
    defaultFontSize: 1.0
  };

  const server = await startStaticServer(distRoot);
  const url = `${server.origin}${settings.routePath}`;
  console.log(`Loading resume from ${url}.`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Honor `@media print` rules in PDFLayout/global.css so the PDF picks up print styling.
  await page.emulateMedia({ media: 'print' });

  // Navigate once — only the font-size changes between iterations, so re-fetching the
  // HTML/CSS/fonts every loop wastes most of the wall time.
  await page.goto(url, { waitUntil: 'networkidle' });

  const renderAt = async (size: number) => {
    await page.evaluate((s) => {
      document.querySelector('#pdf')?.setAttribute('style', `font-size: ${s}em;`);
    }, size);
    const pdfBuffer = await page.pdf(settings.initSettings);
    const buffer = await (await PDFDocument.load(pdfBuffer)).save();
    const pageCount = (await PDFDocument.load(buffer)).getPageCount();
    console.log(`Rendered PDF at font-size ${size.toFixed(4)}em → ${pageCount} pages.`);
    return { buffer, pageCount };
  };

  let bestBuffer: Uint8Array | undefined;
  let bestPageCount = 0;
  let bestFontSize = 0;

  try {
    // Try the ideal size first — usually fits on its own.
    const initial = await renderAt(settings.defaultFontSize);
    if (initial.pageCount <= settings.desiredPageCount) {
      bestBuffer = initial.buffer;
      bestPageCount = initial.pageCount;
      bestFontSize = settings.defaultFontSize;
    } else {
      // Binary search for the largest font-size that still fits within the page budget.
      let low = 0.5;
      let high = settings.defaultFontSize;
      const tolerance = 0.01;
      while (high - low > tolerance) {
        const mid = (low + high) / 2;
        const result = await renderAt(mid);
        if (result.pageCount <= settings.desiredPageCount) {
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

    await mkdir(dirname(settings.outputPath), { recursive: true });
    await writeFile(settings.outputPath, bestBuffer);
    console.log(
      `Final PDF written to ${settings.outputPath} (${bestPageCount} pages at ${bestFontSize.toFixed(4)}em).`
    );
  } finally {
    await browser.close();
    await server.close();
  }
}

generatePdf().catch((error) => {
  console.error('[Node]: Failed to generate PDF', error);
  process.exit(1);
});
