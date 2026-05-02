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
  const name = 'adam-knee';
  const settings = {
    initSettings: {
      width: '8.5in',
      height: '11in',
      printBackground: true
    },
    path: join(pubDir, `${name}-google-application.pdf`),
    routePath: '/google-application/',
    desiredPageCount: 3,
    defaultFontSize: 1.0
  };

  const distRoot = join(__dirname, '../dist/client');
  const server = await startStaticServer(distRoot);
  const url = `${server.origin}${settings.routePath}`;
  console.log(`Loading resume from ${url}.`);

  const browser = await chromium.launch();
  const page = await browser.newPage();
  // Honor `@media print` rules in PDFLayout/global.css so the PDF picks up print styling.
  await page.emulateMedia({ media: 'print' });

  let fontSize = settings.defaultFontSize;
  let pageCount = 0;
  let finalPdfBuffer: Uint8Array | undefined;

  try {
    do {
      await page.goto(url, { waitUntil: 'networkidle' });
      await page.evaluate((size) => {
        document.querySelector('#pdf')?.setAttribute('style', `font-size: ${size}em;`);
      }, fontSize);

      const pdfBuffer = await page.pdf(settings.initSettings);
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      finalPdfBuffer = await pdfDoc.save();
      pageCount = (await PDFDocument.load(finalPdfBuffer)).getPageCount();

      console.log(`Generated PDF with font-size ${fontSize}em and ${pageCount} pages.`);

      fontSize -= 0.0985;
    } while (pageCount > settings.desiredPageCount && fontSize > 0.5);

    await mkdir(pubDir, { recursive: true });
    if (!finalPdfBuffer) throw new Error('PDF generation produced no output.');
    await writeFile(settings.path, finalPdfBuffer);
    console.log(`Final PDF generated at ${settings.path} with ${pageCount} pages.`);
  } finally {
    await browser.close();
    await server.close();
  }
}

generatePdf().catch((error) => {
  console.error('[Node]: Failed to generate PDF', error);
  process.exit(1);
});
