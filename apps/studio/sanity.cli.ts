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
  // The queries and the generated types live in packages/sanity-queries, which the site imports.
  // `overloadClientMethods: false` keeps sanity.types.ts free of client module augmentation.
  typegen: {
    path: '../../packages/sanity-queries/queries.ts',
    schema: './schema.json',
    generates: '../../packages/sanity-queries/sanity.types.ts',
    overloadClientMethods: false
  }
});
