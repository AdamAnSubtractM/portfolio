import { defineCliConfig } from 'sanity/cli';

export default defineCliConfig({
  api: {
    projectId: process.env.SANITY_STUDIO_PROJECT_ID || 'missing-sanity-project-id',
    dataset: process.env.SANITY_STUDIO_DATASET || 'production'
  },
  deployment: {
    autoUpdates: true,
    appId: 'pfnae1abx6l9fa7vn38he9tu'
  },
  studioHost: process.env.SANITY_STUDIO_HOST,
  // `overloadClientMethods: false` keeps sanity.types.ts free of client module
  // augmentation, which is what makes it publishable to JSR.
  typegen: {
    path: './**/*.{ts,tsx,js,jsx}',
    schema: './schema.json',
    generates: './sanity.types.ts',
    overloadClientMethods: false
  }
});
