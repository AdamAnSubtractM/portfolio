import studioConfig from '@sanity/eslint-config-studio';

export default [...studioConfig, { ignores: ['dist/', '.sanity/', 'dataset-backups/', 'schema.json', 'sanity.types.ts'] }];
