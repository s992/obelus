import type { Maybe } from '@obelus/shared/types';

import { logger } from '../log';
import { server } from '../server';
import type { JWTPayload } from '../types';

export async function parseJwt(tokenCookie: Maybe<string>) {
  if (!tokenCookie) {
    return null;
  }

  const unsigned = server.unsignCookie(tokenCookie);

  if (!unsigned.valid) {
    logger.debug('bailing because cookie is invalid');
    return null;
  }

  try {
    return server.jwt.verify<JWTPayload>(unsigned.value);
  } catch (err) {
    logger.error(err, 'failed to verify jwt');
  }

  return null;
}
