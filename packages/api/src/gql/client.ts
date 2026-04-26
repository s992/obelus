import { DocumentNode, print } from 'graphql';

import { config } from '../config';
import { getSdk } from './graphql';

async function gqlFetch<R, V>(doc: DocumentNode, variables: V): Promise<R> {
  const response = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.HARDCOVER_API_TOKEN}`,
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
