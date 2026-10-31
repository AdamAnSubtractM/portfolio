import { writeFile, mkdir } from 'fs/promises';
import { chromium } from 'playwright-chromium';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { PDFDocument } from 'pdf-lib';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function generateCoverLetterPdf(id: string) {
  if (!id) {
    console.error('No ID provided.');
    process.exit(1);
  }

  const coverLetterDir = join(__dirname, '../cover-letters'); // Ensure relative path
  const pdfSettings = {
    initSettings: {
      width: '8.5in',
      height: '11in',
      printBackground: true
    },
    path: join(coverLetterDir, `knee-cover-letter-${id}.pdf`),
    desiredPageCount: 1,
    defaultFontSize: 1.0,
    minFontSize: 0.5, // Ensure font size doesn't get too small
    fontSizeStep: 0.15,
    multiPageSpacerHeight: 12 // Spacer height in pixels
  };

  const browser = await chromium.launch();
  const page = await browser.newPage();

  const coverLetterUrl = `http://localhost:4321/cover-letter/${id}`;

  let fontSize = pdfSettings.defaultFontSize;
  let pageCount = 0;
  let finalPdfBuffer;

  do {
    console.log(`Attempting PDF generation with font-size: ${fontSize}em`);

    // Load dynamically rendered cover letter
    await page.goto(coverLetterUrl, { waitUntil: 'networkidle' });

    // Inject CSS for font size
    await page.evaluate((size) => {
      document.querySelector('#pdf')?.setAttribute('style', `font-size: ${size}em;`);
    }, fontSize);

    // Generate PDF in memory
    const pdfBuffer = await page.pdf(pdfSettings.initSettings);

    // Post-process the PDF for multi-page adjustments
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();

    for (let i = 1; i < pages.length; i++) {
      pages[i].translateContent(0, -pdfSettings.multiPageSpacerHeight);
    }

    // Save updated PDF buffer
    const updatedPdfBuffer = await pdfDoc.save();

    // Reload and count pages
    const adjustedPdfDoc = await PDFDocument.load(updatedPdfBuffer);
    pageCount = adjustedPdfDoc.getPageCount();

    console.log(`Generated PDF with ${pageCount} pages.`);

    // Decrease font size if needed
    if (pageCount > pdfSettings.desiredPageCount && fontSize > pdfSettings.minFontSize) {
      fontSize -= pdfSettings.fontSizeStep;
    }

    // Store the final buffer
    finalPdfBuffer = updatedPdfBuffer;
  } while (pageCount > pdfSettings.desiredPageCount && fontSize > pdfSettings.minFontSize);

  // Ensure output directory exists
  await mkdir(coverLetterDir, { recursive: true });

  // Save final PDF
  await writeFile(pdfSettings.path, finalPdfBuffer);
  await browser.close();

  console.log(`Final PDF saved at ${pdfSettings.path} with ${pageCount} pages.`);
}

// Get ID from command line arguments
const id = process.argv[2];

if (!id) {
  console.error('Please provide a cover letter ID.');
  process.exit(1);
}

generateCoverLetterPdf(id).catch((error) => {
  console.error('[Error]: Failed to generate PDF', error);
  process.exit(1);
});
