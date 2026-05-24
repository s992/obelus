import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mockRedisGet = vi.fn();
const mockRedisSetex = vi.fn();

vi.mock('../../redis', () => ({
  client: {
    get: (...args: unknown[]) => mockRedisGet(...args),
    setex: (...args: unknown[]) => mockRedisSetex(...args),
  },
}));

vi.mock('../../config', () => ({
  config: { OBELUS_HARDCOVER_API_TOKEN: 'test-token' },
}));

vi.mock('../../log', () => ({
  logger: { error: vi.fn(), debug: vi.fn(), warn: vi.fn() },
}));

import { logger } from '../../log';

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function makeJsonResponse(data: unknown, errors?: Array<{ message: string }>) {
  return new Response(JSON.stringify({ data, errors }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

function make429Response(retryAfter?: string) {
  const headers = new Headers();
  if (retryAfter) {
    headers.set('Retry-After', retryAfter);
  }
  return new Response(null, { status: 429, headers });
}

async function loadClient() {
  const mod = await import('../client');
  return mod.client;
}

describe('gqlFetch (via client)', () => {
  let client: Awaited<ReturnType<typeof loadClient>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    client = await loadClient();
  });

  it('returns cached data without calling fetch', async () => {
    const cachedBooks = { books: [{ id: 1, title: 'Cached Book' }] };
    mockRedisGet.mockResolvedValue(JSON.stringify(cachedBooks));

    const result = await client.GetBooksByIds({ ids: [1] });

    expect(result).toEqual(cachedBooks);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches from API on cache miss and caches the result', async () => {
    mockRedisGet.mockResolvedValue(null);
    const apiData = { books: [{ id: 2, title: 'Fresh Book' }] };
    mockFetch.mockResolvedValue(makeJsonResponse(apiData));
    mockRedisSetex.mockResolvedValue('OK');

    const result = await client.GetBooksByIds({ ids: [2] });

    expect(result).toEqual(apiData);
    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockRedisSetex).toHaveBeenCalledWith(
      expect.stringMatching(/^gql:[a-f0-9]{64}$/),
      86400,
      JSON.stringify(apiData),
    );
  });

  it('falls through to fetch when redis.get throws', async () => {
    mockRedisGet.mockRejectedValue(new Error('redis connection refused'));
    const apiData = { books: [] };
    mockFetch.mockResolvedValue(makeJsonResponse(apiData));
    mockRedisSetex.mockResolvedValue('OK');

    const result = await client.GetBooksByIds({ ids: [3] });

    expect(result).toEqual(apiData);
    expect(vi.mocked(logger.error)).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('returns data even when redis.setex throws', async () => {
    mockRedisGet.mockResolvedValue(null);
    const apiData = { books: [{ id: 4 }] };
    mockFetch.mockResolvedValue(makeJsonResponse(apiData));
    mockRedisSetex.mockRejectedValue(new Error('redis write failed'));

    const result = await client.GetBooksByIds({ ids: [4] });

    expect(result).toEqual(apiData);
    expect(vi.mocked(logger.error)).toHaveBeenCalled();
  });

  it('falls through to fetch when cached value is malformed JSON', async () => {
    mockRedisGet.mockResolvedValue('not-valid-json{{{');
    const apiData = { books: [{ id: 5 }] };
    mockFetch.mockResolvedValue(makeJsonResponse(apiData));
    mockRedisSetex.mockResolvedValue('OK');

    const result = await client.GetBooksByIds({ ids: [5] });

    expect(result).toEqual(apiData);
    expect(vi.mocked(logger.error)).toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('throws when the GQL response contains errors', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockFetch.mockResolvedValue(makeJsonResponse(null, [{ message: 'Field "nonexistent" not found' }]));

    await expect(client.GetBooksByIds({ ids: [6] })).rejects.toThrow('Field "nonexistent" not found');
  });

  it('sends the auth token in the Authorization header', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockFetch.mockResolvedValue(makeJsonResponse({ books: [] }));
    mockRedisSetex.mockResolvedValue('OK');

    await client.GetBooksByIds({ ids: [7] });

    const fetchCall = mockFetch.mock.calls[0];
    const options = fetchCall?.[1] as RequestInit;
    expect((options.headers as Record<string, string>)['Authorization']).toBe('Bearer test-token');
  });
});

describe('fetchWithRetry (via client)', () => {
  let client: Awaited<ReturnType<typeof loadClient>>;

  beforeEach(async () => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.stubGlobal('fetch', mockFetch);
    vi.useFakeTimers();
    client = await loadClient();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retries on 429 and succeeds on the next attempt', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockRedisSetex.mockResolvedValue('OK');
    const apiData = { books: [{ id: 10 }] };

    mockFetch.mockResolvedValueOnce(make429Response()).mockResolvedValueOnce(makeJsonResponse(apiData));

    const promise = client.GetBooksByIds({ ids: [10] });
    await vi.advanceTimersByTimeAsync(2000);
    const result = await promise;

    expect(result).toEqual(apiData);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('uses Retry-After header when present', async () => {
    mockRedisGet.mockResolvedValue(null);
    mockRedisSetex.mockResolvedValue('OK');
    const apiData = { books: [] };

    mockFetch.mockResolvedValueOnce(make429Response('3')).mockResolvedValueOnce(makeJsonResponse(apiData));

    const promise = client.GetBooksByIds({ ids: [11] });

    await vi.advanceTimersByTimeAsync(2999);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(1);
    await promise;

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('stops retrying after maxRetries and returns the 429 response', async () => {
    mockRedisGet.mockResolvedValue(null);

    mockFetch.mockResolvedValue(
      new Response(JSON.stringify({ data: null, errors: [{ message: 'rate limited' }] }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      }),
    );

    const promise = client.GetBooksByIds({ ids: [12] });

    // Catch immediately to prevent unhandled rejection
    let caughtError: Error | undefined;
    promise.catch((e: Error) => {
      caughtError = e;
    });

    for (let i = 0; i < 15; i++) {
      await vi.advanceTimersByTimeAsync(600_000);
    }

    await vi.advanceTimersByTimeAsync(0);
    expect(caughtError?.message).toBe('rate limited');
    expect(mockFetch.mock.calls.length).toBeLessThanOrEqual(11);
  });
});
