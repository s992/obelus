import { type DocumentNode, print } from 'graphql';

import { config } from '../config';
import { logger } from '../log';
import { client as redis } from '../redis';
import { getSdk } from './graphql';

const CACHE_TIME = 24 * 60 * 60; // 24hr in seconds

async function gqlFetch<R, V>(doc: DocumentNode, variables: V): Promise<R> {
  const cacheKey = JSON.stringify({ query: print(doc), variables });
  const cached = await redis.get(cacheKey);

  if (cached) {
    try {
      logger.debug(`found cached data, trying to return it: ${cached}`);
      return JSON.parse(cached) as R;
    } catch (err) {
      logger.error(err, 'failed to parse cached redis data - proceeding with hardcover api request');
    }
  }

  const response = await fetch('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.OBELUS_HARDCOVER_API_TOKEN}`,
    },
    body: cacheKey,
  });

  const { data, errors } = (await response.json()) as { data: R; errors?: Array<{ message: string }> };

  if (errors?.length) {
    throw new Error(errors[0]!.message);
  }

  await redis.setEx(cacheKey, CACHE_TIME, JSON.stringify(data));

  return data;
}

export const client = getSdk(gqlFetch);
