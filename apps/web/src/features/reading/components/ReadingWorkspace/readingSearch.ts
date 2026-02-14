import type { ReadingEntry, ToReadEntry } from "@obelus/shared";

export const REMOTE_SEARCH_MIN_QUERY_LENGTH = 2;

export type MyBookStatus = "currently-reading" | "planned" | "finished";

export type MyBookSearchItem = {
  bookKey: string;
  title: string;
  authors: string[];
  coverUrl: string | null;
  status: MyBookStatus;
};

export type RemoteSearchItem = {
  key: string;
  title: string;
  authorName: string[];
  firstPublishYear: number | null;
  coverUrl: string | null;
};

export type SearchFocusableItem =
  | {
      id: string;
      type: "my-book";
      item: MyBookSearchItem;
    }
  | {
      id: string;
      type: "add-book";
      item: RemoteSearchItem;
    };

type LibraryDetail = {
  title?: string;
  authors?: string[];
  covers?: string[];
  coverUrl?: string | null;
};

const normalizeQuery = (value: string) => value.trim().toLowerCase();

const titleFromKey = (bookKey: string) => {
  const normalized = bookKey.split("/").filter(Boolean).at(-1) ?? bookKey;
  return normalized.replaceAll("_", " ");
};

const getBookStatus = (
  readingEntry: ReadingEntry | undefined,
  queueEntry: ToReadEntry | undefined,
): MyBookStatus | null => {
  if (readingEntry) {
    return readingEntry.finishedAt ? "finished" : "currently-reading";
  }
  if (queueEntry) {
    return "planned";
  }
  return null;
};

export const buildMyBookSearchItems = (
  readingEntries: ReadingEntry[],
  queueEntries: ToReadEntry[],
  detailsByKey: Record<string, LibraryDetail>,
): MyBookSearchItem[] => {
  const readingIndex = new Map(readingEntries.map((entry) => [entry.bookKey, entry]));
  const queueIndex = new Map(queueEntries.map((entry) => [entry.bookKey, entry]));
  const allKeys = new Set<string>([
    ...readingEntries.map((entry) => entry.bookKey),
    ...queueEntries.map((entry) => entry.bookKey),
  ]);

  const items: MyBookSearchItem[] = [];
  for (const bookKey of allKeys) {
    const status = getBookStatus(readingIndex.get(bookKey), queueIndex.get(bookKey));
    if (!status) {
      continue;
    }
    const detail = detailsByKey[bookKey];
    items.push({
      bookKey,
      title: detail?.title?.trim() || titleFromKey(bookKey),
      authors: detail?.authors ?? [],
      coverUrl: detail?.coverUrl ?? detail?.covers?.[0] ?? null,
      status,
    });
  }

  return items;
};

export const filterMyBookSearchItems = (
  items: MyBookSearchItem[],
  query: string,
  maxResults = 8,
): MyBookSearchItem[] => {
  const normalizedQuery = normalizeQuery(query);
  if (!normalizedQuery) {
    return [];
  }

  const matches = items.filter((item) => {
    const authors = item.authors.join(" ").toLowerCase();
    return (
      item.title.toLowerCase().includes(normalizedQuery) ||
      authors.includes(normalizedQuery) ||
      item.bookKey.toLowerCase().includes(normalizedQuery)
    );
  });

  return matches.sort((a, b) => a.title.localeCompare(b.title)).slice(0, Math.max(0, maxResults));
};

export const toFocusableItems = (
  myBooks: MyBookSearchItem[],
  remoteBooks: RemoteSearchItem[],
): SearchFocusableItem[] => {
  const myBookItems: SearchFocusableItem[] = myBooks.map((item) => ({
    id: `my-book-${encodeURIComponent(item.bookKey)}`,
    type: "my-book",
    item,
  }));

  const addBookItems: SearchFocusableItem[] = remoteBooks.map((item) => ({
    id: `add-book-${encodeURIComponent(item.key)}`,
    type: "add-book",
    item,
  }));

  return [...myBookItems, ...addBookItems];
};

export const shouldShowRemoteSection = (query: string) =>
  normalizeQuery(query).length >= REMOTE_SEARCH_MIN_QUERY_LENGTH;

export const createAbortableCachedSearch = <TItem>(
  fetcher: (query: string, signal: AbortSignal) => Promise<TItem[]>,
) => {
  const cache = new Map<string, TItem[]>();
  let activeController: AbortController | null = null;

  return {
    async search(rawQuery: string): Promise<TItem[]> {
      const query = normalizeQuery(rawQuery);
      if (!query) {
        return [];
      }

      const cached = cache.get(query);
      if (cached) {
        return cached;
      }

      activeController?.abort();
      const controller = new AbortController();
      activeController = controller;

      try {
        const results = await fetcher(query, controller.signal);
        if (activeController === controller) {
          cache.set(query, results);
          return results;
        }
        return [];
      } finally {
        if (activeController === controller) {
          activeController = null;
        }
      }
    },
    abort() {
      activeController?.abort();
      activeController = null;
    },
    getCached(query: string): TItem[] | null {
      const normalized = normalizeQuery(query);
      return cache.get(normalized) ?? null;
    },
  };
};
