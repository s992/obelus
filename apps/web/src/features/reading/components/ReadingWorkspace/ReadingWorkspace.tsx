import { trpc } from "@/api/trpc";
import { useBookDetailsByKeys } from "@/features/books/hooks/useBookDetailsByKeys";
import { BookMetadataDescription } from "@/features/reading/components/BookMetadataDescription/BookMetadataDescription";
import { ProgressSliderField } from "@/features/reading/components/ReadingWorkspace/ProgressSliderField";
import { ReadingListPane } from "@/features/reading/components/ReadingWorkspace/ReadingListPane";
import { ReadingSearchDropdown } from "@/features/reading/components/ReadingWorkspace/ReadingSearchDropdown";
import { BookCover } from "@/features/shared/components/BookCover/BookCover";
import { LoadingObelus } from "@/features/shared/components/LoadingObelus/LoadingObelus";
import {
  METADATA_DESCRIPTION_COLLAPSE_LENGTH,
  detailMetadataFromRaw,
} from "@/features/shared/lib/book-metadata";
import {
  type ReadingInput,
  type ReadingTab,
  type ToReadInput,
  readingSchema,
  toReadSchema,
} from "@/features/shared/lib/schemas";
import { getErrorMessage } from "@/lib/errors";
import { toDate, toDateInputValue, toIsoFromLocalDateInput } from "@/lib/format";
import { normalizeBookKeyFromParam, normalizeInputValue } from "@/lib/normalize";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/ui/Button";
import { InputBase } from "@/ui/InputBase";
import { TextAreaBase } from "@/ui/TextAreaBase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchLg } from "@untitledui/icons/SearchLg";
import { XClose } from "@untitledui/icons/XClose";
import { type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import * as styles from "./ReadingWorkspace.css";
import {
  REMOTE_SEARCH_MIN_QUERY_LENGTH,
  type RemoteSearchItem,
  type SearchFocusableItem,
  buildMyBookSearchItems,
  createAbortableCachedSearch,
  filterMyBookSearchItems,
  shouldShowRemoteSection,
  toFocusableItems,
} from "./readingSearch";

const toTimestamp = (value: string | null | undefined) => {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
};

const compareByNewestDate = (left: string | null | undefined, right: string | null | undefined) =>
  toTimestamp(right) - toTimestamp(left);

const comparePlannedEntries = (
  left: { priority: number | null; addedAt: string },
  right: { priority: number | null; addedAt: string },
) => {
  const leftPriority = left.priority ?? Number.POSITIVE_INFINITY;
  const rightPriority = right.priority ?? Number.POSITIVE_INFINITY;
  if (leftPriority !== rightPriority) {
    return leftPriority - rightPriority;
  }
  return compareByNewestDate(left.addedAt, right.addedAt);
};

const saveToastStorageKey = "obelus:save-success-toast";

export const ReadingWorkspace = () => {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const searchRootRef = useRef<HTMLDivElement | null>(null);
  const listboxId = "reading-search-listbox";

  const selectedBookKey = useMemo(() => normalizeBookKeyFromParam(params["*"]), [params]);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [focusedSearchIndex, setFocusedSearchIndex] = useState(-1);
  const [remoteSearchResults, setRemoteSearchResults] = useState<RemoteSearchItem[]>([]);
  const [isRemoteSearchLoading, setIsRemoteSearchLoading] = useState(false);
  const [hasRemoteSearchError, setHasRemoteSearchError] = useState(false);
  const [readingTab, setReadingTab] = useState<ReadingTab>("currently-reading");
  const [expandedMetadataBookKey, setExpandedMetadataBookKey] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isSearchMode = searchInput.trim().length > 0;
  const isSearchDropdownVisible = isSearchMode && isSearchDropdownOpen;
  const normalizeOptionalText = (value: string | null | undefined) => (value ?? "").trim();
  const remoteSearcherRef = useRef(
    createAbortableCachedSearch<RemoteSearchItem>((query, signal) =>
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
      window.sessionStorage.setItem(saveToastStorageKey, "Book record saved.");
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
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.reading }),
        qc.invalidateQueries({ queryKey: queryKeys.toRead }),
        qc.invalidateQueries({ queryKey: queryKeys.report }),
      ]);
      window.sessionStorage.setItem(saveToastStorageKey, "Queue record saved.");
      navigate("/");
    },
  });

  const deleteReadingRecord = useMutation({
    mutationFn: async () => {
      if (!selectedEntry?.id) {
        throw new Error("No reading record selected.");
      }
      await trpc.library.removeReading.mutate({ id: selectedEntry.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reading });
      qc.invalidateQueries({ queryKey: queryKeys.report });
      navigate("/");
    },
  });

  const deleteQueueRecord = useMutation({
    mutationFn: async () => {
      if (!selectedQueueEntry?.id) {
        throw new Error("No queue record selected.");
      }
      await trpc.library.removeFromToRead.mutate({ id: selectedQueueEntry.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.toRead });
      qc.invalidateQueries({ queryKey: queryKeys.report });
      navigate("/");
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
    () =>
      [...(reading.data ?? [])]
        .filter((entry) => !entry.finishedAt)
        .sort((left, right) => compareByNewestDate(left.startedAt, right.startedAt)),
    [reading.data],
  );

  const archiveReading = useMemo(
    () =>
      [...(reading.data ?? [])]
        .filter((entry) => Boolean(entry.finishedAt))
        .sort((left, right) => compareByNewestDate(left.finishedAt, right.finishedAt)),
    [reading.data],
  );

  const plannedReading = useMemo(
    () => [...(toRead.data ?? [])].sort(comparePlannedEntries),
    [toRead.data],
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
      progressPercent: selectedEntry?.progressPercent ?? 0,
      judgment: selectedEntry?.judgment ?? undefined,
      notes: selectedEntry?.notes ?? "",
    });

    toReadForm.reset({
      priority: selectedQueueEntry?.priority ?? undefined,
      notes: selectedQueueEntry?.notes ?? "",
    });
  }, [readingForm, selectedBookKey, selectedEntry, selectedQueueEntry, toReadForm]);

  const readingErrorStartedAt = readingForm.formState.errors.startedAt?.message;
  const readingErrorProgress = readingForm.formState.errors.progressPercent?.message;
  const readingSaveError = addReading.error ? getErrorMessage(addReading.error) : null;
  const queueErrorPriority = toReadForm.formState.errors.priority?.message;
  const queueSaveError = addQueue.error ? getErrorMessage(addQueue.error) : null;
  const readingDeleteError = deleteReadingRecord.error
    ? getErrorMessage(deleteReadingRecord.error)
    : null;
  const queueDeleteError = deleteQueueRecord.error
    ? getErrorMessage(deleteQueueRecord.error)
    : null;
  const actionReadingError = toggleReading.error ? getErrorMessage(toggleReading.error) : null;
  const actionQueueError = toggleQueue.error ? getErrorMessage(toggleQueue.error) : null;

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
    if (selectedBookKey || location.pathname !== "/") {
      return;
    }
    const toast = window.sessionStorage.getItem(saveToastStorageKey);
    if (!toast) {
      return;
    }
    window.sessionStorage.removeItem(saveToastStorageKey);
    setToastMessage(toast);
  }, [location.pathname, selectedBookKey]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timer = window.setTimeout(() => setToastMessage(null), 2500);
    return () => window.clearTimeout(timer);
  }, [toastMessage]);

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

  const navigateToBook = useCallback(
    (bookKey: string) => {
      navigate(`/books/${encodeURIComponent(bookKey)}`);
    },
    [navigate],
  );

  const selectMyBookFromSearch = (bookKey: string) => {
    navigateToBook(bookKey);
    setIsSearchDropdownOpen(false);
    setFocusedSearchIndex(-1);
  };

  const selectAddBookFromSearch = (book: RemoteSearchItem) => {
    navigateToBook(book.key);
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

  const readingJudgmentValue = useWatch({ control: readingForm.control, name: "judgment" });
  const readingStartedAtValue = useWatch({ control: readingForm.control, name: "startedAt" });
  const readingFinishedAtValue = useWatch({ control: readingForm.control, name: "finishedAt" });
  const readingNotesValue = useWatch({ control: readingForm.control, name: "notes" });
  const queuePriorityValue = useWatch({ control: toReadForm.control, name: "priority" });
  const queueNotesValue = useWatch({ control: toReadForm.control, name: "notes" });

  return (
    <section className={styles.readingWorkspace}>
      <article className={styles.listCard}>
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
        <ReadingListPane
          isSearchMode={isSearchMode}
          isLibraryLoading={isLibraryLoading}
          readingTab={readingTab}
          currentlyReading={currentlyReading}
          plannedReading={plannedReading}
          archiveReading={archiveReading}
          detailIndex={detailIndex}
          onReadingTabChange={setReadingTab}
          onNavigateToBook={navigateToBook}
        />
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
                  coverUrl={detail.data.coverUrl ?? detail.data.covers[0] ?? null}
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
                        readingJudgmentValue === "Accepted"
                          ? styles.judgmentAcceptedActive
                          : styles.judgmentAccepted
                      }
                      type="button"
                      color="tertiary"
                      aria-pressed={readingJudgmentValue === "Accepted"}
                      onClick={() => readingForm.setValue("judgment", "Accepted")}
                    >
                      Accepted
                    </Button>
                    <Button
                      className={
                        readingJudgmentValue === "Rejected"
                          ? styles.judgmentRejectedActive
                          : styles.judgmentRejected
                      }
                      type="button"
                      color="tertiary"
                      aria-pressed={readingJudgmentValue === "Rejected"}
                      onClick={() => readingForm.setValue("judgment", "Rejected")}
                    >
                      Rejected
                    </Button>
                    <Button
                      className={
                        readingJudgmentValue
                          ? styles.judgmentUnjudged
                          : styles.judgmentUnjudgedActive
                      }
                      type="button"
                      color="tertiary"
                      aria-pressed={!readingJudgmentValue}
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
                      value={readingStartedAtValue ?? ""}
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
                      value={readingFinishedAtValue ?? ""}
                      onChange={(value) =>
                        readingForm.setValue("finishedAt", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <ProgressSliderField
                    id="reading-progress"
                    initialValue={selectedEntry?.progressPercent ?? 0}
                    isInvalid={Boolean(readingErrorProgress)}
                    errorId={readingErrorProgress ? "reading-progress-error" : undefined}
                    onCommit={(value) =>
                      readingForm.setValue("progressPercent", value, {
                        shouldDirty: true,
                      })
                    }
                  />
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
                    value={readingNotesValue ?? ""}
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
                  {selectedEntry ? (
                    <Button
                      className={styles.dangerButton}
                      color="tertiary"
                      type="button"
                      isDisabled={deleteReadingRecord.isPending}
                      onClick={() => deleteReadingRecord.mutate()}
                    >
                      {deleteReadingRecord.isPending ? "Deleting..." : "Delete record"}
                    </Button>
                  ) : null}
                </div>
                {readingDeleteError ? (
                  <p className={styles.errorText} role="alert">
                    {readingDeleteError}
                  </p>
                ) : null}
              </form>
            )}

            {selectedQueueEntry ? (
              <section className={styles.queueSection}>
                <h3 className={styles.sectionTitle}>Planned Record</h3>
                <form
                  className={styles.formStack}
                  onSubmit={toReadForm.handleSubmit((values) => addQueue.mutate(values))}
                >
                  <fieldset
                    className={`${styles.fieldStack} ${styles.priorityFieldset}`}
                    aria-describedby={queueErrorPriority ? "queue-priority-error" : undefined}
                  >
                    <legend className={styles.fieldLabel}>Priority</legend>
                    <div className={styles.priorityGroup} role="radiogroup" aria-label="Priority">
                      {[null, 1, 2, 3, 4, 5].map((priorityValue) => {
                        const selected = (queuePriorityValue ?? null) === priorityValue;
                        const label = priorityValue === null ? "None" : `P${priorityValue}`;
                        return (
                          <label
                            className={selected ? styles.priorityPillActive : styles.priorityPill}
                            key={label}
                            htmlFor={`queue-priority-${label}`}
                          >
                            <input
                              className={styles.priorityInput}
                              id={`queue-priority-${label}`}
                              name="queue-priority"
                              type="radio"
                              value={label}
                              checked={selected}
                              onChange={() =>
                                toReadForm.setValue("priority", priorityValue ?? undefined, {
                                  shouldDirty: true,
                                })
                              }
                            />
                            <span>{label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>
                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="queue-note">
                      Note
                    </label>
                    <TextAreaBase
                      className={styles.compactTextArea}
                      id="queue-note"
                      rows={3}
                      value={queueNotesValue ?? ""}
                      onChange={(value: unknown) =>
                        toReadForm.setValue("notes", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
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
                  {queueDeleteError ? (
                    <p className={styles.errorText} role="alert">
                      {queueDeleteError}
                    </p>
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
                    <Button
                      className={styles.dangerButton}
                      color="tertiary"
                      type="button"
                      isDisabled={deleteQueueRecord.isPending}
                      onClick={() => deleteQueueRecord.mutate()}
                    >
                      {deleteQueueRecord.isPending ? "Deleting..." : "Delete record"}
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
      {toastMessage ? (
        <output className={styles.toast} aria-live="polite" aria-atomic="true">
          {toastMessage}
        </output>
      ) : null}
    </section>
  );
};
