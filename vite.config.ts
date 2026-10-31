import { defineConfig } from 'vite-plus';

export default defineConfig({
  lint: {
    ignorePatterns: [
      '**/dist/**',
      '**/.astro/**',
      '**/.wrangler/**',
      '**/node_modules/**',
      '**/public/**',
      '**/cover-letters/**',
      // The studio keeps its own ESLint and Prettier setup.
      'apps/studio/**'
    ]
  },
  fmt: {
    ignorePatterns: [
      '**/dist/**',
      '**/.astro/**',
      '**/.wrangler/**',
      '**/public/**',
      '**/cover-letters/**',
      '**/*.astro',
      'apps/studio/**'
    ],
    singleQuote: true,
    semi: true,
    tabWidth: 2,
    trailingComma: 'none',
    printWidth: 120
  },
  test: {}
});
