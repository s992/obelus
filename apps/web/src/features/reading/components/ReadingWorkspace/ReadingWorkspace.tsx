import { trpc } from "@/api/trpc";
import { useBookDetailsByKeys } from "@/features/books/hooks/useBookDetailsByKeys";
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
  toPublishedLabel,
  toPublishedYearLabel,
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
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import * as styles from "./ReadingWorkspace.css";

export const ReadingWorkspace = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams();

  const selectedBookKey = useMemo(() => normalizeBookKeyFromParam(params["*"]), [params]);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [readingTab, setReadingTab] = useState<ReadingTab>("currently-reading");
  const [expandedMetadataBookKey, setExpandedMetadataBookKey] = useState<string | null>(null);
  const isSearchMode = searchInput.trim().length > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const searchResults = useQuery({
    queryKey: queryKeys.bookSearch(debouncedSearch),
    queryFn: () => trpc.books.search.query({ query: debouncedSearch }),
    enabled: debouncedSearch.length > 1,
    staleTime: 5 * 60 * 1000,
  });

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
        startedAt: new Date(input.startedAt).toISOString(),
        finishedAt: input.finishedAt ? new Date(input.finishedAt).toISOString() : null,
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
      await trpc.library.addToRead.mutate({
        bookKey: selectedBookKey,
        priority: Number.isFinite(input.priority) ? (input.priority ?? null) : null,
        notes: input.notes ?? null,
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
          return;
        }
        await trpc.library.upsertReading.mutate({
          bookKey: selectedBookKey,
          startedAt: selectedEntry.startedAt,
          finishedAt: new Date().toISOString(),
          progressPercent: selectedEntry.progressPercent ?? 100,
          judgment: selectedEntry.judgment,
          notes: selectedEntry.notes,
        });
        return;
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
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.reading });
      qc.invalidateQueries({ queryKey: queryKeys.toRead });
      qc.invalidateQueries({ queryKey: queryKeys.report });
    },
  });

  const normalizedSearch = useMemo(
    () => searchResults.data?.slice(0, 16) ?? [],
    [searchResults.data],
  );
  const isSearchLoading = isSearchMode && debouncedSearch.length > 1 && searchResults.isFetching;
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

  const readingIndex = useMemo(() => {
    const index = new Map<
      string,
      { finishedAt: string | null; judgment: "Accepted" | "Rejected" | null }
    >();
    for (const entry of reading.data ?? []) {
      index.set(entry.bookKey, { finishedAt: entry.finishedAt, judgment: entry.judgment });
    }
    return index;
  }, [reading.data]);

  const plannedSet = useMemo(
    () => new Set((toRead.data ?? []).map((entry) => entry.bookKey)),
    [toRead.data],
  );
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

  const metadataDescriptionPreview = useMemo(() => {
    const description = detailMetadata.descriptionText;
    if (!description) {
      return {
        value: null as string | null,
        isLong: false,
      };
    }
    const isLong = description.length > METADATA_DESCRIPTION_COLLAPSE_LENGTH;
    if (!isLong || isMetadataDescriptionExpanded) {
      return {
        value: description,
        isLong,
      };
    }
    return {
      value: `${description.slice(0, METADATA_DESCRIPTION_COLLAPSE_LENGTH).trimEnd()}...`,
      isLong,
    };
  }, [detailMetadata.descriptionText, isMetadataDescriptionExpanded]);

  const hasMetadataRows = Boolean(
    detailMetadata.firstPublished || detailMetadata.pages || detailMetadata.isbn,
  );
  const hasMetadataDescription = Boolean(metadataDescriptionPreview.value);
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
  }, [readingForm, selectedBookKey, selectedEntry, selectedQueueEntry, toReadForm]);

  const listTabs: { id: ReadingTab; label: string }[] = [
    { id: "currently-reading", label: "Currently Reading" },
    { id: "planned", label: "Planned" },
    { id: "finished", label: "Finished" },
  ];

  return (
    <section className={styles.readingWorkspace}>
      <article className={styles.card}>
        <div className={styles.headerActionRow}>
          <div className={styles.searchInputWrap}>
            <SearchLg size={18} className={styles.searchIcon} />
            <InputBase
              wrapperClassName={styles.searchInputWrapper}
              inputClassName={styles.searchInputField}
              id="book-search"
              value={searchInput}
              onChange={(value) => setSearchInput(normalizeInputValue(value))}
              placeholder="Search for books..."
            />
            {isSearchMode ? (
              <button
                className={styles.searchClearButton}
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                }}
              >
                <XClose size={16} />
              </button>
            ) : null}
          </div>
        </div>
        {!isSearchMode ? (
          <div className={styles.tabRow}>
            {listTabs.map((tab) => (
              <Button
                key={tab.id}
                type="button"
                color="tertiary"
                className={readingTab === tab.id ? styles.tabButtonActive : styles.tabButton}
                onClick={() => setReadingTab(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div className={styles.listContainer}>
          {isSearchLoading ? <LoadingObelus label="Searching catalog..." compact /> : null}

          {isSearchMode
            ? normalizedSearch.map((book) => {
                const tracked = readingIndex.get(book.key);
                const status = tracked
                  ? statusLabel(tracked)
                  : plannedSet.has(book.key)
                    ? "Planned"
                    : null;
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={book.key}
                    onClick={() => navigate(`/books/${encodeURIComponent(book.key)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover title={book.title} coverId={book.coverId} />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>{book.title}</h3>
                        <p className={styles.bookListAuthor}>
                          {book.authorName.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      {toPublishedYearLabel(book.firstPublishYear) ? (
                        <span>{toPublishedYearLabel(book.firstPublishYear)}</span>
                      ) : null}
                      {status ? (
                        <span
                          className={
                            status === "Planned" ? styles.readingBadge : statusClassName(status)
                          }
                        >
                          {status}
                        </span>
                      ) : (
                        <span className={styles.readingBadge}>Search</span>
                      )}
                    </div>
                  </button>
                );
              })
            : null}

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

          {isSearchMode && !isSearchLoading && debouncedSearch.length <= 1 ? (
            <p className={styles.mutedBody}>Type at least 2 characters to search.</p>
          ) : null}
          {isSearchMode &&
          !isSearchLoading &&
          debouncedSearch.length > 1 &&
          normalizedSearch.length === 0 ? (
            <p className={styles.mutedBody}>No matching books.</p>
          ) : null}

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
          <p className={styles.mutedBody}>Select a book to view and update record details.</p>
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
                          <p className={styles.metadataBody}>{metadataDescriptionPreview.value}</p>
                          {metadataDescriptionPreview.isLong ? (
                            <button
                              className={styles.metadataExpandButton}
                              type="button"
                              onClick={() => {
                                if (!selectedBookKey) return;
                                setExpandedMetadataBookKey((currentValue) =>
                                  currentValue === selectedBookKey ? null : selectedBookKey,
                                );
                              }}
                            >
                              {isMetadataDescriptionExpanded ? "Show less" : "Show more"}
                            </button>
                          ) : null}
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
                  isDisabled={isQuickActionPending}
                  onClick={() => toggleQueue.mutate()}
                >
                  {toggleQueue.isPending ? "Updating..." : "Planned"}
                </Button>
              </div>
              {toggleReading.error ? (
                <p className={styles.errorText}>{getErrorMessage(toggleReading.error)}</p>
              ) : null}
              {toggleQueue.error ? (
                <p className={styles.errorText}>{getErrorMessage(toggleQueue.error)}</p>
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

                {readingForm.formState.errors.startedAt ? (
                  <p className={styles.errorText}>
                    {readingForm.formState.errors.startedAt.message}
                  </p>
                ) : null}
                {addReading.error ? (
                  <p className={styles.errorText}>{getErrorMessage(addReading.error)}</p>
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
                      placeholder="1-5"
                      value={toReadForm.watch("priority")?.toString() ?? ""}
                      onChange={(value) =>
                        toReadForm.setValue(
                          "priority",
                          normalizeInputValue(value) === ""
                            ? undefined
                            : Number(normalizeInputValue(value)),
                          { shouldDirty: true },
                        )
                      }
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
                      onChange={(value: unknown) =>
                        toReadForm.setValue("notes", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                  {addQueue.error ? (
                    <p className={styles.errorText}>{getErrorMessage(addQueue.error)}</p>
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
