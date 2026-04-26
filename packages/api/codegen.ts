import 'dotenv/config';
import { CodegenConfig } from '@graphql-codegen/cli';

if (!process.env['HARDCOVER_API_TOKEN']) {
  process.stderr.write('failed to initialize: HARDCOVER_API_TOKEN is not defined');
  process.exit(1);
}

const config: CodegenConfig = {
  overwrite: true,
  schema: [
    {
      'https://api.hardcover.app/v1/graphql': {
        headers: {
          Authorization: `Bearer ${process.env['HARDCOVER_API_TOKEN']}`,
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
