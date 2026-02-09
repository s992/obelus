import { trpc } from "@/api/trpc";
import { useBookDetailsByKeys } from "@/features/books/hooks/useBookDetailsByKeys";
import { BookMetadataDescription } from "@/features/reading/components/BookMetadataDescription/BookMetadataDescription";
import { ReadingSearchDropdown } from "@/features/reading/components/ReadingWorkspace/ReadingSearchDropdown";
import { BookCover } from "@/features/shared/components/BookCover/BookCover";
import { LoadingObelus } from "@/features/shared/components/LoadingObelus/LoadingObelus";
import {
  METADATA_DESCRIPTION_COLLAPSE_LENGTH,
  detailMetadataFromRaw,
  statusLabel,
} from "@/features/shared/lib/book-metadata";
import {
  type ReadingInput,
  type ReadingTab,
  type ToReadInput,
  readingSchema,
  toReadSchema,
} from "@/features/shared/lib/schemas";
import { statusClassName } from "@/features/shared/lib/status-class";
import { getErrorMessage } from "@/lib/errors";
import {
  fallbackTitle,
  toDate,
  toDateInputValue,
  toIsoFromLocalDateInput,
  toPublishedLabel,
} from "@/lib/format";
import { normalizeBookKeyFromParam, normalizeInputValue } from "@/lib/normalize";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/ui/Button";
import { InputBase } from "@/ui/InputBase";
import { TextAreaBase } from "@/ui/TextAreaBase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchLg } from "@untitledui/icons/SearchLg";
import { XClose } from "@untitledui/icons/XClose";
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import * as styles from "./ReadingWorkspace.css";
import {
  type OpenLibrarySearchItem,
  REMOTE_SEARCH_MIN_QUERY_LENGTH,
  type SearchFocusableItem,
  buildMyBookSearchItems,
  createAbortableCachedSearch,
  filterMyBookSearchItems,
  shouldShowRemoteSection,
  toFocusableItems,
} from "./readingSearch";

export const ReadingWorkspace = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams();
  const searchRootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = "reading-search-listbox";

  const selectedBookKey = useMemo(() => normalizeBookKeyFromParam(params["*"]), [params]);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1);
  const [remoteSearchResults, setRemoteSearchResults] = useState<OpenLibrarySearchItem[]>([]);
  const [isRemoteSearchLoading, setIsRemoteSearchLoading] = useState(false);
  const [hasRemoteSearchError, setHasRemoteSearchError] = useState(false);
  const [readingTab, setReadingTab] = useState<ReadingTab>("currently-reading");
  const [expandedMetadataBookKey, setExpandedMetadataBookKey] = useState<string | null>(null);
  const [queueSaveState, setQueueSaveState] = useState<"idle" | "success" | "warning">("idle");
  const isSearchMode = searchInput.trim().length > 0;
  const isSearchDropdownVisible = isSearchMode && isSearchDropdownOpen;
  const normalizeOptionalText = (value: string | null | undefined) => (value ?? "").trim();
  const remoteSearcherRef = useRef(
    createAbortableCachedSearch<OpenLibrarySearchItem>((query, signal) =>
      trpc.books.search.query({ query }, { signal }),
    ),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const detail = useQuery({
    queryKey: queryKeys.bookDetail(selectedBookKey),
    queryFn: async () => {
      if (!selectedBookKey) {
        throw new Error("No book selected.");
      }
      return trpc.books.detail.query({ key: selectedBookKey });
    },
    enabled: Boolean(selectedBookKey),
    staleTime: 5 * 60 * 1000,
  });

  const reading = useQuery({
    queryKey: queryKeys.reading,
    queryFn: () => trpc.library.listReading.query(),
  });

  const toRead = useQuery({
    queryKey: queryKeys.toRead,
    queryFn: () => trpc.library.listToRead.query(),
  });

  const readingForm = useForm<ReadingInput>({ resolver: zodResolver(readingSchema) });
  const toReadForm = useForm<ToReadInput>({ resolver: zodResolver(toReadSchema) });

  const selectedEntry = useMemo(() => {
    if (!selectedBookKey || !reading.data) {
      return null;
    }
    return reading.data.find((entry) => entry.bookKey === selectedBookKey) ?? null;
  }, [reading.data, selectedBookKey]);

  const selectedQueueEntry = useMemo(() => {
    if (!selectedBookKey || !toRead.data) {
      return null;
    }
    return toRead.data.find((entry) => entry.bookKey === selectedBookKey) ?? null;
  }, [toRead.data, selectedBookKey]);

  const addReading = useMutation({
    mutationFn: async (input: ReadingInput) => {
      if (!selectedBookKey) {
        throw new Error("Select a book before saving a reading record.");
      }
      await trpc.library.upsertReading.mutate({
        bookKey: selectedBookKey,
        startedAt: toIsoFromLocalDateInput(input.startedAt),
        finishedAt: input.finishedAt ? toIsoFromLocalDateInput(input.finishedAt) : null,
        progressPercent: Number.isFinite(input.progressPercent)
          ? (input.progressPercent ?? null)
          : null,
        judgment: input.judgment ?? null,
        notes: input.notes ?? null,
      });
      if (selectedQueueEntry?.id) {
        await trpc.library.removeFromToRead.mutate({ id: selectedQueueEntry.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reading });
      qc.invalidateQueries({ queryKey: queryKeys.toRead });
      qc.invalidateQueries({ queryKey: queryKeys.report });
      navigate("/");
    },
  });

  const addQueue = useMutation({
    mutationFn: async (input: ToReadInput) => {
      if (!selectedBookKey) {
        throw new Error("Select a book before adding to planned.");
      }
      const normalizedPriority = Number.isFinite(input.priority) ? (input.priority ?? null) : null;
      const normalizedNotes = normalizeOptionalText(input.notes) || null;
      await trpc.library.addToRead.mutate({
        bookKey: selectedBookKey,
        priority: normalizedPriority,
        notes: normalizedNotes,
      });
      if (selectedEntry?.id) {
        await trpc.library.removeReading.mutate({ id: selectedEntry.id });
      }
      return { bookKey: selectedBookKey, priority: normalizedPriority, notes: normalizedNotes };
    },
    onSuccess: async (payload) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.reading }),
        qc.invalidateQueries({ queryKey: queryKeys.toRead }),
        qc.invalidateQueries({ queryKey: queryKeys.report }),
      ]);
      const latestQueue = await qc.fetchQuery({
        queryKey: queryKeys.toRead,
        queryFn: () => trpc.library.listToRead.query(),
      });
      const saved = latestQueue.find((entry) => entry.bookKey === payload.bookKey);
      const matches =
        Boolean(saved) &&
        (saved?.priority ?? null) === payload.priority &&
        normalizeOptionalText(saved?.notes) === normalizeOptionalText(payload.notes);
      setQueueSaveState(matches ? "success" : "warning");
    },
  });

  const toggleQueue = useMutation({
    mutationFn: async () => {
      if (selectedQueueEntry?.id) {
        await trpc.library.removeFromToRead.mutate({ id: selectedQueueEntry.id });
        return;
      }
      if (!selectedBookKey) {
        throw new Error("Select a book before updating planned status.");
      }
      await trpc.library.addToRead.mutate({
        bookKey: selectedBookKey,
        priority: null,
        notes: null,
      });
      if (selectedEntry?.id) {
        await trpc.library.removeReading.mutate({ id: selectedEntry.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reading });
      qc.invalidateQueries({ queryKey: queryKeys.toRead });
      qc.invalidateQueries({ queryKey: queryKeys.report });
    },
  });

  const toggleReading = useMutation({
    mutationFn: async () => {
      if (!selectedBookKey) {
        throw new Error("Select a book before updating reading status.");
      }
      if (selectedEntry?.id) {
        if (selectedEntry.finishedAt) {
          return { action: "noop" as const };
        }
        await trpc.library.upsertReading.mutate({
          bookKey: selectedBookKey,
          startedAt: selectedEntry.startedAt,
          finishedAt: new Date().toISOString(),
          progressPercent: selectedEntry.progressPercent ?? 100,
          judgment: readingForm.getValues("judgment") ?? selectedEntry.judgment,
          notes: selectedEntry.notes,
        });
        return { action: "finished" as const };
      }
      const now = new Date().toISOString();
      await trpc.library.upsertReading.mutate({
        bookKey: selectedBookKey,
        startedAt: now,
        finishedAt: null,
        progressPercent: null,
        judgment: null,
        notes: null,
      });
      if (selectedQueueEntry?.id) {
        await trpc.library.removeFromToRead.mutate({ id: selectedQueueEntry.id });
      }
      return { action: "started" as const };
    },
    onSuccess: (payload) => {
      qc.invalidateQueries({ queryKey: queryKeys.reading });
      qc.invalidateQueries({ queryKey: queryKeys.toRead });
      qc.invalidateQueries({ queryKey: queryKeys.report });
      if (payload?.action === "finished" && readingTab === "currently-reading") {
        setReadingTab("finished");
      }
    },
  });

  const isLibraryLoading = reading.isLoading || toRead.isLoading;
  const isBookDetailLoading = Boolean(selectedBookKey) && detail.isLoading;

  const libraryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of reading.data ?? []) keys.add(entry.bookKey);
    for (const entry of toRead.data ?? []) keys.add(entry.bookKey);
    return [...keys];
  }, [reading.data, toRead.data]);

  const detailLookups = useBookDetailsByKeys(libraryKeys);
  const detailIndex = detailLookups.data ?? {};

  const currentlyReading = useMemo(
    () => (reading.data ?? []).filter((entry) => !entry.finishedAt),
    [reading.data],
  );

  const archiveReading = useMemo(
    () => (reading.data ?? []).filter((entry) => Boolean(entry.finishedAt)),
    [reading.data],
  );

  const libraryBookKeySet = useMemo(
    () =>
      new Set([
        ...(reading.data ?? []).map((entry) => entry.bookKey),
        ...(toRead.data ?? []).map((entry) => entry.bookKey),
      ]),
    [reading.data, toRead.data],
  );
  const myBookSearchItems = useMemo(
    () => buildMyBookSearchItems(reading.data ?? [], toRead.data ?? [], detailIndex),
    [reading.data, toRead.data, detailIndex],
  );
  const myBookMatches = useMemo(
    () => filterMyBookSearchItems(myBookSearchItems, searchInput, 8),
    [myBookSearchItems, searchInput],
  );
  const addBookMatches = useMemo(
    () => remoteSearchResults.filter((book) => !libraryBookKeySet.has(book.key)).slice(0, 8),
    [remoteSearchResults, libraryBookKeySet],
  );
  const focusableSearchItems = useMemo(
    () => toFocusableItems(myBookMatches, addBookMatches),
    [myBookMatches, addBookMatches],
  );
  const focusedSearchItem: SearchFocusableItem | null =
    focusableSearchItems[focusedSearchIndex] ?? null;
  const focusedSearchItemId = focusedSearchItem?.id ?? null;
  const showAddSection = shouldShowRemoteSection(searchInput);
  const isQuickActionPending = toggleReading.isPending || toggleQueue.isPending;
  const isMetadataDescriptionExpanded = expandedMetadataBookKey === selectedBookKey;
  const detailMetadata = useMemo(() => {
    if (!detail.data) {
      return detailMetadataFromRaw(null);
    }

    const raw = detail.data as Record<string, unknown>;
    return detailMetadataFromRaw({
      ...raw,
      description: detail.data.description ?? raw.description,
      publishDate: detail.data.publishDate,
    });
  }, [detail.data]);

  const hasMetadataRows = Boolean(
    detailMetadata.firstPublished || detailMetadata.pages || detailMetadata.isbn,
  );
  const metadataDescription = detailMetadata.descriptionText;
  const hasMetadataDescription = Boolean(metadataDescription);
  const isMetadataDescriptionLong =
    (metadataDescription?.length ?? 0) > METADATA_DESCRIPTION_COLLAPSE_LENGTH;
  const hasRenderableMetadata = hasMetadataRows || hasMetadataDescription;

  useEffect(() => {
    if (!selectedBookKey) {
      return;
    }

    readingForm.reset({
      startedAt: toDateInputValue(selectedEntry?.startedAt ?? null),
      finishedAt: toDateInputValue(selectedEntry?.finishedAt ?? null),
      progressPercent: selectedEntry?.progressPercent ?? undefined,
      judgment: selectedEntry?.judgment ?? undefined,
      notes: selectedEntry?.notes ?? "",
    });

    toReadForm.reset({
      priority: selectedQueueEntry?.priority ?? undefined,
      notes: selectedQueueEntry?.notes ?? "",
    });
    setQueueSaveState("idle");
  }, [readingForm, selectedBookKey, selectedEntry, selectedQueueEntry, toReadForm]);

  const listTabs: { id: ReadingTab; label: string }[] = [
    { id: "currently-reading", label: "Currently Reading" },
    { id: "planned", label: "Planned" },
    { id: "finished", label: "Finished" },
  ];
  const readingPanelId = "reading-list-panel";
  const readingErrorStartedAt = readingForm.formState.errors.startedAt?.message;
  const readingErrorProgress = readingForm.formState.errors.progressPercent?.message;
  const readingSaveError = addReading.error ? getErrorMessage(addReading.error) : null;
  const queueErrorPriority = toReadForm.formState.errors.priority?.message;
  const queueSaveError = addQueue.error ? getErrorMessage(addQueue.error) : null;
  const actionReadingError = toggleReading.error ? getErrorMessage(toggleReading.error) : null;
  const actionQueueError = toggleQueue.error ? getErrorMessage(toggleQueue.error) : null;

  const onTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const key = event.key;
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) {
      return;
    }
    event.preventDefault();
    const lastIndex = listTabs.length - 1;
    const nextIndex =
      key === "Home"
        ? 0
        : key === "End"
          ? lastIndex
          : key === "ArrowRight"
            ? (index + 1) % listTabs.length
            : (index - 1 + listTabs.length) % listTabs.length;
    const nextTabId = listTabs[nextIndex]?.id;
    if (!nextTabId) {
      return;
    }
    setReadingTab(nextTabId);
    const nextTabElement = document.getElementById(`reading-tab-${nextTabId}`);
    nextTabElement?.focus();
  };

  useEffect(() => {
    if (!isSearchMode) {
      remoteSearcherRef.current.abort();
      setRemoteSearchResults([]);
      setHasRemoteSearchError(false);
      setIsRemoteSearchLoading(false);
      setIsSearchDropdownOpen(false);
      setFocusedSearchIndex(-1);
      return;
    }
    setIsSearchDropdownOpen(true);
  }, [isSearchMode]);

  useEffect(() => {
    if (!showAddSection) {
      remoteSearcherRef.current.abort();
      setRemoteSearchResults([]);
      setHasRemoteSearchError(false);
      setIsRemoteSearchLoading(false);
      return;
    }
    if (debouncedSearch.trim().length < REMOTE_SEARCH_MIN_QUERY_LENGTH) {
      setRemoteSearchResults([]);
      setHasRemoteSearchError(false);
      setIsRemoteSearchLoading(false);
      return;
    }

    let cancelled = false;
    setHasRemoteSearchError(false);
    setIsRemoteSearchLoading(true);

    remoteSearcherRef.current
      .search(debouncedSearch)
      .then((results) => {
        if (cancelled) {
          return;
        }
        setRemoteSearchResults(results);
      })
      .catch((error: unknown) => {
        if (cancelled) {
          return;
        }
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setRemoteSearchResults([]);
        setHasRemoteSearchError(true);
      })
      .finally(() => {
        if (!cancelled) {
          setIsRemoteSearchLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedSearch, showAddSection]);

  useEffect(() => {
    if (!isSearchDropdownVisible || focusableSearchItems.length === 0) {
      setFocusedSearchIndex(-1);
      return;
    }

    if (focusedSearchIndex >= focusableSearchItems.length) {
      setFocusedSearchIndex(0);
    }
  }, [focusedSearchIndex, focusableSearchItems.length, isSearchDropdownVisible]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const root = searchRootRef.current;
      if (!root) {
        return;
      }
      if (root.contains(event.target as Node)) {
        return;
      }
      setIsSearchDropdownOpen(false);
      setFocusedSearchIndex(-1);
    };

    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  const selectMyBookFromSearch = (bookKey: string) => {
    navigate(`/books/${encodeURIComponent(bookKey)}`);
    setIsSearchDropdownOpen(false);
    setFocusedSearchIndex(-1);
  };

  const selectAddBookFromSearch = (book: OpenLibrarySearchItem) => {
    navigate(`/books/${encodeURIComponent(book.key)}`);
    setIsSearchDropdownOpen(false);
    setFocusedSearchIndex(-1);
  };

  const onSearchInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isSearchMode) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setIsSearchDropdownOpen(false);
      setFocusedSearchIndex(-1);
      return;
    }

    if (focusableSearchItems.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsSearchDropdownOpen(true);
      setFocusedSearchIndex((current) =>
        current < 0 ? 0 : (current + 1) % focusableSearchItems.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setIsSearchDropdownOpen(true);
      setFocusedSearchIndex((current) =>
        current < 0
          ? focusableSearchItems.length - 1
          : (current - 1 + focusableSearchItems.length) % focusableSearchItems.length,
      );
      return;
    }

    if (event.key === "Enter" && focusedSearchItem) {
      event.preventDefault();
      if (focusedSearchItem.type === "my-book") {
        selectMyBookFromSearch(focusedSearchItem.item.bookKey);
      } else {
        selectAddBookFromSearch(focusedSearchItem.item);
      }
    }
  };

  const onSearchItemHover = (id: string) => {
    const nextIndex = focusableSearchItems.findIndex((item) => item.id === id);
    if (nextIndex >= 0) {
      setFocusedSearchIndex(nextIndex);
    }
  };

  return (
    <section className={styles.readingWorkspace}>
      <article className={styles.card}>
        <div className={styles.headerActionRow}>
          <div className={styles.searchInputWrap} ref={searchRootRef}>
            <SearchLg size={18} className={styles.searchIcon} />
            <InputBase
              wrapperClassName={styles.searchInputWrapper}
              inputClassName={styles.searchInputField}
              id="book-search"
              role="combobox"
              aria-label="Search your books or add new"
              aria-expanded={isSearchDropdownVisible}
              aria-controls={listboxId}
              aria-activedescendant={focusedSearchItemId ?? undefined}
              aria-autocomplete="list"
              value={searchInput}
              onChange={(value) => {
                setSearchInput(normalizeInputValue(value));
                setIsSearchDropdownOpen(true);
              }}
              onFocus={() => {
                if (isSearchMode) {
                  setIsSearchDropdownOpen(true);
                }
              }}
              onKeyDown={onSearchInputKeyDown}
              placeholder="Search your books or add new..."
            />
            {isSearchMode ? (
              <button
                className={styles.searchClearButton}
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                  setRemoteSearchResults([]);
                  setHasRemoteSearchError(false);
                  setIsSearchDropdownOpen(false);
                  setFocusedSearchIndex(-1);
                }}
              >
                <XClose size={16} />
              </button>
            ) : null}
            {isSearchDropdownVisible ? (
              <ReadingSearchDropdown
                query={searchInput.trim()}
                listboxId={listboxId}
                myBooks={myBookMatches}
                addBooks={addBookMatches}
                focusedItemId={focusedSearchItemId}
                showRemoteSection={showAddSection}
                isRemoteLoading={isRemoteSearchLoading}
                remoteError={hasRemoteSearchError}
                onSelectMyBook={selectMyBookFromSearch}
                onSelectAddBook={selectAddBookFromSearch}
                onHoverItem={onSearchItemHover}
              />
            ) : null}
          </div>
        </div>
        {!isSearchMode ? (
          <div className={styles.tabRow} role="tablist" aria-label="Reading sections">
            {listTabs.map((tab, index) => (
              <Button
                key={tab.id}
                type="button"
                color="tertiary"
                id={`reading-tab-${tab.id}`}
                role="tab"
                aria-selected={readingTab === tab.id}
                aria-controls={readingPanelId}
                tabIndex={readingTab === tab.id ? 0 : -1}
                className={readingTab === tab.id ? styles.tabButtonActive : styles.tabButton}
                onClick={() => setReadingTab(tab.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div
          className={styles.listContainer}
          id={!isSearchMode ? readingPanelId : undefined}
          role={!isSearchMode ? "tabpanel" : undefined}
          aria-labelledby={!isSearchMode ? `reading-tab-${readingTab}` : undefined}
          aria-live="polite"
          aria-busy={isLibraryLoading}
        >
          {!isSearchMode && readingTab === "currently-reading"
            ? currentlyReading.map((entry) => {
                const bookMeta = detailIndex[entry.bookKey];
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={entry.id}
                    onClick={() => navigate(`/books/${encodeURIComponent(entry.bookKey)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover
                        title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        coverId={bookMeta?.covers?.[0] ?? null}
                      />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>
                          {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        </h3>
                        <p className={styles.bookListAuthor}>
                          {bookMeta?.authors.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      <span>Started {toDate(entry.startedAt)}</span>
                      {toPublishedLabel(bookMeta?.publishDate ?? null) ? (
                        <span>{toPublishedLabel(bookMeta?.publishDate ?? null)}</span>
                      ) : null}
                      <span className={styles.readingBadge}>Reading</span>
                    </div>
                  </button>
                );
              })
            : null}

          {!isSearchMode && readingTab === "planned"
            ? (toRead.data ?? []).map((entry) => {
                const bookMeta = detailIndex[entry.bookKey];
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={entry.id}
                    onClick={() => navigate(`/books/${encodeURIComponent(entry.bookKey)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover
                        title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        coverId={bookMeta?.covers?.[0] ?? null}
                      />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>
                          {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        </h3>
                        <p className={styles.bookListAuthor}>
                          {bookMeta?.authors.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      <span>Added {toDate(entry.addedAt)}</span>
                      {toPublishedLabel(bookMeta?.publishDate ?? null) ? (
                        <span>{toPublishedLabel(bookMeta?.publishDate ?? null)}</span>
                      ) : null}
                      <span className={styles.readingBadge}>Planned</span>
                    </div>
                  </button>
                );
              })
            : null}

          {!isSearchMode && readingTab === "finished"
            ? archiveReading.map((entry) => {
                const bookMeta = detailIndex[entry.bookKey];
                const status = statusLabel(entry);
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={entry.id}
                    onClick={() => navigate(`/books/${encodeURIComponent(entry.bookKey)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover
                        title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        coverId={bookMeta?.covers?.[0] ?? null}
                      />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>
                          {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        </h3>
                        <p className={styles.bookListAuthor}>
                          {bookMeta?.authors.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      <span>Finished {toDate(entry.finishedAt ?? null)}</span>
                      {toPublishedLabel(bookMeta?.publishDate ?? null) ? (
                        <span>{toPublishedLabel(bookMeta?.publishDate ?? null)}</span>
                      ) : null}
                      <span className={statusClassName(status)}>{status}</span>
                    </div>
                  </button>
                );
              })
            : null}

          {!isSearchMode &&
          !isLibraryLoading &&
          ((readingTab === "currently-reading" && currentlyReading.length === 0) ||
            (readingTab === "planned" && (toRead.data?.length ?? 0) === 0) ||
            (readingTab === "finished" && archiveReading.length === 0)) ? (
            <p className={styles.mutedBody}>No entries in this section.</p>
          ) : null}
          {isLibraryLoading && !isSearchMode ? (
            <LoadingObelus label="Loading collection..." compact />
          ) : null}
        </div>
      </article>

      <article className={styles.detailCard}>
        {!selectedBookKey ? (
          <section className={styles.emptyDetailState}>
            <h3 className={styles.sectionTitle}>Choose a title to begin</h3>
            <p className={styles.mutedBody}>
              Select any book in Reading, Planned, Finished, or Search to edit dates, judgment,
              notes, and queue details.
            </p>
          </section>
        ) : isBookDetailLoading ? (
          <LoadingObelus label="Loading book record..." />
        ) : detail.data ? (
          <>
            <header className={styles.bookHeader}>
              <div className={styles.bookHeaderTop}>
                <BookCover
                  title={detail.data.title}
                  coverId={detail.data.covers[0] ?? null}
                  size="L"
                />
                <div className={styles.bookHeaderContent}>
                  <h2 className={styles.bookTitle}>{detail.data.title}</h2>
                  <p className={styles.bookAuthor}>
                    {detail.data.authors.join(", ") || "Unknown author"}
                  </p>
                  {hasRenderableMetadata ? (
                    <section className={styles.metadataInline}>
                      {hasMetadataRows ? <h3 className={styles.metadataTitle}>Metadata</h3> : null}
                      {hasMetadataRows ? (
                        <div className={styles.metadataList}>
                          {detailMetadata.firstPublished ? (
                            <p className={styles.metadataLine}>
                              <span className={styles.metadataLabel}>First published:</span>{" "}
                              <span className={styles.metadataValue}>
                                {detailMetadata.firstPublished}
                              </span>
                            </p>
                          ) : null}
                          {detailMetadata.pages ? (
                            <p className={styles.metadataLine}>
                              <span className={styles.metadataLabel}>Pages:</span>{" "}
                              <span className={styles.metadataValue}>{detailMetadata.pages}</span>
                            </p>
                          ) : null}
                          {detailMetadata.isbn ? (
                            <p className={styles.metadataLine}>
                              <span className={styles.metadataLabel}>ISBN:</span>{" "}
                              <span className={styles.metadataValue}>{detailMetadata.isbn}</span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {hasMetadataDescription ? (
                        <div className={styles.metadataDescriptionGroup}>
                          <p className={styles.metadataDescriptionTitle}>Description</p>
                          <BookMetadataDescription
                            description={metadataDescription ?? ""}
                            isExpanded={isMetadataDescriptionExpanded}
                            isLong={isMetadataDescriptionLong}
                            onToggleExpanded={() => {
                              if (!selectedBookKey) return;
                              setExpandedMetadataBookKey((currentValue) =>
                                currentValue === selectedBookKey ? null : selectedBookKey,
                              );
                            }}
                          />
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </div>
              </div>
            </header>

            <section className={styles.sectionBlock}>
              <p className={styles.fieldLabel}>Actions</p>
              <div className={styles.actionRow}>
                <Button
                  className={selectedEntry ? styles.actionToggleActive : styles.actionToggle}
                  color="tertiary"
                  type="button"
                  aria-pressed={Boolean(selectedEntry) && !selectedEntry?.finishedAt}
                  isDisabled={Boolean(selectedEntry?.finishedAt) || isQuickActionPending}
                  onClick={() => toggleReading.mutate()}
                >
                  {toggleReading.isPending
                    ? "Updating..."
                    : selectedEntry?.finishedAt
                      ? "Finished"
                      : selectedEntry
                        ? "Finish now"
                        : "Reading"}
                </Button>
                <Button
                  className={selectedQueueEntry ? styles.actionToggleActive : styles.actionToggle}
                  color="tertiary"
                  type="button"
                  aria-pressed={Boolean(selectedQueueEntry)}
                  isDisabled={isQuickActionPending}
                  onClick={() => toggleQueue.mutate()}
                >
                  {toggleQueue.isPending ? "Updating..." : "Planned"}
                </Button>
              </div>
              {actionReadingError ? (
                <p className={styles.errorText} role="alert">
                  {actionReadingError}
                </p>
              ) : null}
              {actionQueueError ? (
                <p className={styles.errorText} role="alert">
                  {actionQueueError}
                </p>
              ) : null}
            </section>

            {selectedQueueEntry && !selectedEntry ? (
              <section className={styles.queueSection}>
                <h3 className={styles.sectionTitle}>Planned Details</h3>
                <div className={styles.fieldStack}>
                  <p className={styles.fieldLabel}>Added</p>
                  <p className={styles.mutedBody}>{toDate(selectedQueueEntry.addedAt)}</p>
                </div>
                <p className={styles.mutedBody}>This title is planned and not started.</p>
              </section>
            ) : (
              <form
                className={styles.formStack}
                onSubmit={readingForm.handleSubmit((values) => addReading.mutate(values))}
              >
                <section className={styles.sectionBlock}>
                  <p className={styles.fieldLabel}>Judgment</p>
                  <div className={styles.judgmentRow}>
                    <Button
                      className={
                        readingForm.watch("judgment") === "Accepted"
                          ? styles.judgmentAcceptedActive
                          : styles.judgmentAccepted
                      }
                      type="button"
                      color="tertiary"
                      aria-pressed={readingForm.watch("judgment") === "Accepted"}
                      onClick={() => readingForm.setValue("judgment", "Accepted")}
                    >
                      Accepted
                    </Button>
                    <Button
                      className={
                        readingForm.watch("judgment") === "Rejected"
                          ? styles.judgmentRejectedActive
                          : styles.judgmentRejected
                      }
                      type="button"
                      color="tertiary"
                      aria-pressed={readingForm.watch("judgment") === "Rejected"}
                      onClick={() => readingForm.setValue("judgment", "Rejected")}
                    >
                      Rejected
                    </Button>
                    <Button
                      className={
                        readingForm.watch("judgment")
                          ? styles.judgmentUnjudged
                          : styles.judgmentUnjudgedActive
                      }
                      type="button"
                      color="tertiary"
                      aria-pressed={!readingForm.watch("judgment")}
                      onClick={() =>
                        readingForm.setValue("judgment", undefined, { shouldDirty: true })
                      }
                    >
                      Unjudged
                    </Button>
                  </div>
                </section>

                <section className={styles.sectionGridTwo}>
                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="reading-started-at">
                      Start Date
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="reading-started-at"
                      type="date"
                      aria-invalid={Boolean(readingErrorStartedAt)}
                      aria-describedby={
                        readingErrorStartedAt ? "reading-started-at-error" : undefined
                      }
                      value={readingForm.watch("startedAt") ?? ""}
                      onChange={(value) =>
                        readingForm.setValue("startedAt", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="reading-finished-at">
                      End Date
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="reading-finished-at"
                      type="date"
                      value={readingForm.watch("finishedAt") ?? ""}
                      onChange={(value) =>
                        readingForm.setValue("finishedAt", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="reading-progress">
                      Progress
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="reading-progress"
                      type="number"
                      aria-invalid={Boolean(readingErrorProgress)}
                      aria-describedby={readingErrorProgress ? "reading-progress-error" : undefined}
                      inputMode="numeric"
                      min={0}
                      max={100}
                      step={1}
                      placeholder="Progress %"
                      value={readingForm.watch("progressPercent")?.toString() ?? ""}
                      onChange={(value) =>
                        readingForm.setValue(
                          "progressPercent",
                          normalizeInputValue(value) === ""
                            ? undefined
                            : Number(normalizeInputValue(value)),
                          { shouldDirty: true },
                        )
                      }
                    />
                  </div>
                </section>

                <section className={styles.sectionBlock}>
                  <label className={styles.fieldLabel} htmlFor="reading-notes">
                    Notes
                  </label>
                  <TextAreaBase
                    className={styles.notesArea}
                    id="reading-notes"
                    rows={10}
                    placeholder="Record your notes..."
                    value={readingForm.watch("notes") ?? ""}
                    onChange={(value: unknown) =>
                      readingForm.setValue("notes", normalizeInputValue(value), {
                        shouldDirty: true,
                      })
                    }
                  />
                </section>

                {readingErrorStartedAt ? (
                  <p id="reading-started-at-error" className={styles.errorText} role="alert">
                    {readingErrorStartedAt}
                  </p>
                ) : null}
                {readingErrorProgress ? (
                  <p id="reading-progress-error" className={styles.errorText} role="alert">
                    {readingErrorProgress}
                  </p>
                ) : null}
                {readingSaveError ? (
                  <p className={styles.errorText} role="alert">
                    {readingSaveError}
                  </p>
                ) : null}

                <div className={styles.actionRow}>
                  <Button
                    className={styles.primaryButton}
                    color="tertiary"
                    type="submit"
                    isDisabled={addReading.isPending}
                  >
                    {addReading.isPending ? "Saving..." : "Save record"}
                  </Button>
                  <Button
                    className={styles.ghostButton}
                    color="tertiary"
                    type="button"
                    onClick={() => navigate("/")}
                  >
                    Close
                  </Button>
                </div>
              </form>
            )}

            {selectedQueueEntry ? (
              <section className={styles.queueSection}>
                <h3 className={styles.sectionTitle}>Planned Record</h3>
                <form
                  className={styles.formStack}
                  onSubmit={toReadForm.handleSubmit((values) => addQueue.mutate(values))}
                >
                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="queue-priority">
                      Priority
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="queue-priority"
                      type="number"
                      aria-invalid={Boolean(queueErrorPriority)}
                      aria-describedby={queueErrorPriority ? "queue-priority-error" : undefined}
                      inputMode="numeric"
                      min={1}
                      max={5}
                      step={1}
                      placeholder="1-5"
                      value={toReadForm.watch("priority")?.toString() ?? ""}
                      onChange={(value) => {
                        setQueueSaveState("idle");
                        toReadForm.setValue(
                          "priority",
                          normalizeInputValue(value) === ""
                            ? undefined
                            : Number(normalizeInputValue(value)),
                          { shouldDirty: true },
                        );
                      }}
                    />
                  </div>
                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="queue-note">
                      Note
                    </label>
                    <TextAreaBase
                      className={styles.compactTextArea}
                      id="queue-note"
                      rows={3}
                      placeholder="Reason for planning"
                      value={toReadForm.watch("notes") ?? ""}
                      onChange={(value: unknown) => {
                        setQueueSaveState("idle");
                        toReadForm.setValue("notes", normalizeInputValue(value), {
                          shouldDirty: true,
                        });
                      }}
                    />
                  </div>
                  {queueErrorPriority ? (
                    <p id="queue-priority-error" className={styles.errorText} role="alert">
                      {queueErrorPriority}
                    </p>
                  ) : null}
                  {queueSaveError ? (
                    <p className={styles.errorText} role="alert">
                      {queueSaveError}
                    </p>
                  ) : null}
                  {queueSaveState === "success" ? (
                    <output className={styles.successText} aria-live="polite">
                      Planned record saved.
                    </output>
                  ) : null}
                  {queueSaveState === "warning" ? (
                    <output className={styles.warningText} aria-live="polite">
                      Planned record saved, but the refreshed values did not match exactly. Re-open
                      this book to confirm saved details.
                    </output>
                  ) : null}
                  <div className={styles.actionRow}>
                    <Button
                      className={styles.primaryButton}
                      color="tertiary"
                      type="submit"
                      isDisabled={addQueue.isPending}
                    >
                      {addQueue.isPending ? "Saving..." : "Save queue record"}
                    </Button>
                    <Button
                      className={styles.ghostButton}
                      color="tertiary"
                      type="button"
                      onClick={() => navigate("/")}
                    >
                      Close
                    </Button>
                  </div>
                </form>
              </section>
            ) : null}
          </>
        ) : (
          <p className={styles.mutedBody}>Unable to load this book right now.</p>
        )}
      </article>
    </section>
  );
};
