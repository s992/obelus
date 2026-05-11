import { CodegenConfig } from '@graphql-codegen/cli';

import { config as appConfig } from './src/config';

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      'https://api.hardcover.app/v1/graphql': {
        headers: {
          Authorization: `Bearer ${appConfig.OBELUS_HARDCOVER_API_TOKEN}`,
        },
      },
    },
  ],
  documents: ['./src/gql/queries/*.graphql'],
  generates: {
    './src/gql/graphql.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-generic-sdk'],
      config: {
        defaultScalarType: 'unknown',
      },
    },
  },
};

export default config;
