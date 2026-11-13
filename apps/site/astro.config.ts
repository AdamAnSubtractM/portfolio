import { defineConfig, sharpImageService } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import solidJs from '@astrojs/solid-js';

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  integrations: [
    mdx(),
    // Resume variants are for one employer. Keep them out of the sitemap.
    sitemap({ filter: (page) => !/\/resume\/[^/]+/.test(new URL(page).pathname) }),
    solidJs()
  ],
  // Force sharp at build time. The Cloudflare adapter would otherwise route image transforms
  // through the /_image runtime endpoint (Worker invocation per unique URL). With sharp here,
  // prerendered <Image> / getImage() calls emit fingerprinted optimized files into dist/_astro
  // and the HTML references those directly — no Worker hop.
  image: {
    service: sharpImageService()
  },
  output: 'static',
  // Port 4321 is Astro's default, and other local projects use 4321 to 4323. A fixed port with
  // strictPort makes `pnpm dev` stop with an error instead of moving to a port nobody expects.
  // scripts/generate-cover-letter.ts loads pages from this port.
  server: { port: 4330 },
  vite: { server: { strictPort: true } },
  site: 'https://adamknee.dev',
  build: {
    // Astro's default. Small CSS gets inlined; larger sheets stay external so the browser can
    // cache them across view-transition navigations. Resume/cover-letter PDFs are unaffected
    // because the generation scripts now load HTML via file:// and emulate print media, which
    // resolves external <link rel="stylesheet"> assets correctly.
    inlineStylesheets: 'auto'
  }
});
