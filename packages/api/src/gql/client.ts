import { createHash } from 'node:crypto';
import { type DocumentNode, print } from 'graphql';

import { config } from '../config';
import { logger } from '../log';
import { client as redis } from '../redis';
import { getSdk } from './graphql';

const CACHE_TIME = 24 * 60 * 60; // 24hr in seconds

async function gqlFetch<R, V>(doc: DocumentNode, variables: V): Promise<R> {
  const query = JSON.stringify({ query: print(doc), variables });
  const cacheKey = `gql:${createHash('sha256').update(query).digest('hex')}`;
  let cached;

  try {
    cached = await redis.get(cacheKey);
  } catch (err) {
    logger.error(err, 'failed to retrieve cached content');
  }

  if (cached) {
    try {
      logger.debug('found cached data, trying to return it');
      return JSON.parse(cached) as R;
    } catch (err) {
      logger.error(err, 'failed to parse cached redis data - proceeding with hardcover api request');
    }
  }

  const response = await fetchWithRetry('https://api.hardcover.app/v1/graphql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.OBELUS_HARDCOVER_API_TOKEN}`,
    },
    body: query,
  });

  const { data, errors } = (await response.json()) as { data: R; errors?: Array<{ message: string }> };

  if (errors?.length) {
    throw new Error(errors[0]!.message);
  }

  try {
    await redis.setex(cacheKey, CACHE_TIME, JSON.stringify(data));
  } catch (err) {
    logger.error(err, 'failed to store cached content');
  }

  return data;
}

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  attempt = 0,
  maxRetries = 10,
  baseDelay = 1000,
): Promise<Response> {
  const response = await fetch(url, options);

  if (response.status !== 429 || attempt >= maxRetries) {
    return response;
  }

  const retryAfter = response.headers.get('Retry-After');
  const delay = retryAfter ? parseInt(retryAfter) * 1000 : baseDelay * 2 ** attempt + Math.random() * 500;

  logger.warn(`rate limited, retrying in ${Math.round(delay)}ms (attempt ${attempt + 1}/${maxRetries}`);

  await new Promise((resolve) => setTimeout(resolve, delay));

  return fetchWithRetry(url, options, attempt + 1, maxRetries, baseDelay);
}

export const client = getSdk(gqlFetch);
