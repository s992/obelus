import 'dotenv/config';
import { DocumentNode, print } from 'graphql';

import { getSdk } from './graphql';

async function gqlFetch<R, V>(doc: DocumentNode, variables: V): Promise<R> {
  const response = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env['HARDCOVER_API_TOKEN']}`,
    },
    body: JSON.stringify({ query: print(doc), variables }),
  });

  const { data, errors } = await response.json();

  if (errors) {
    throw new Error(errors[0].message);
  }

  return data;
}

export const client = getSdk(gqlFetch);
