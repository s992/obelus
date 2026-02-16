import { trpc } from "@/api/trpc";
import { BookCover } from "@/features/shared/components/BookCover/BookCover";
import { LoadingObelus } from "@/features/shared/components/LoadingObelus/LoadingObelus";
import { statusClassName } from "@/features/shared/lib/status-class";
import { getErrorMessage } from "@/lib/errors";
import { toDate, toPublishedYear } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import type { SeriesDetail } from "@obelus/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Link, useParams } from "react-router-dom";
import * as styles from "./SeriesView.css";

const toSeriesId = (rawSeriesId: string | undefined): number | null => {
  if (!rawSeriesId) {
    return null;
  }
  const parsed = Number.parseInt(rawSeriesId, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const statusLabel = (status: SeriesDetail["books"][number]["userState"]["status"]): string => {
  if (status === "reading") return "Reading";
  if (status === "planned") return "Planned";
  if (status === "finished") return "Finished";
  return "Not in library";
};

const judgmentLabel = (judgment: SeriesDetail["books"][number]["userState"]["judgment"]) => {
  if (judgment === "Accepted") return "Accepted";
  if (judgment === "Rejected") return "Rejected";
  return "Unjudged";
};

export const SeriesView = () => {
  const qc = useQueryClient();
  const params = useParams();
  const seriesId = toSeriesId(params.seriesId);
  const [pendingAddKey, setPendingAddKey] = useState<string | null>(null);
  const [expandedDescriptionKeys, setExpandedDescriptionKeys] = useState<Set<string>>(new Set());

  const series = useQuery({
    queryKey: queryKeys.seriesDetail(seriesId),
    queryFn: () => {
      if (!seriesId) {
        throw new Error("No series selected.");
      }
      return trpc.books.seriesDetail.query({ seriesId });
    },
    enabled: seriesId != null,
  });

  const addToQueue = useMutation({
    mutationFn: async (bookKey: string) => {
      setPendingAddKey(bookKey);
      await trpc.library.addToRead.mutate({ bookKey, priority: null, notes: null });
      return bookKey;
    },
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.toRead }),
        qc.invalidateQueries({ queryKey: queryKeys.report }),
        seriesId != null
          ? qc.invalidateQueries({ queryKey: queryKeys.seriesDetail(seriesId) })
          : Promise.resolve(),
      ]);
    },
    onSettled: () => {
      setPendingAddKey(null);
    },
  });

  const headingMeta = useMemo(() => {
    if (!series.data) {
      return null;
    }

    const completed = series.data.isCompleted == null ? null : series.data.isCompleted;
    const completionText = completed == null ? null : completed ? "Completed" : "Ongoing";
    const countText =
      series.data.booksCount != null
        ? `${series.data.booksCount} books`
        : `${series.data.books.length} books`;

    return {
      completionText,
      countText,
    };
  }, [series.data]);

  if (!seriesId) {
    return (
      <section className={styles.card}>
        <h2 className={styles.title}>Series unavailable</h2>
        <p className={styles.mutedBody}>The requested series identifier is invalid.</p>
      </section>
    );
  }

  if (series.isLoading) {
    return (
      <section className={styles.card}>
        <LoadingObelus label="Loading series..." />
      </section>
    );
  }

  if (series.error) {
    return (
      <section className={styles.card}>
        <h2 className={styles.title}>Series unavailable</h2>
        <p className={styles.errorText}>{getErrorMessage(series.error)}</p>
      </section>
    );
  }

  if (!series.data) {
    return (
      <section className={styles.card}>
        <h2 className={styles.title}>Series unavailable</h2>
        <p className={styles.mutedBody}>No series data was returned for this title.</p>
      </section>
    );
  }

  return (
    <section className={styles.card}>
      <header className={styles.header}>
        <h2 className={styles.title}>{series.data.name}</h2>
        <p className={styles.metaText}>
          {headingMeta?.countText}
          {headingMeta?.completionText ? ` · ${headingMeta.completionText}` : ""}
        </p>
        {series.data.description ? (
          <p className={styles.mutedBody}>{series.data.description}</p>
        ) : null}
      </header>

      <div className={styles.listWrap}>
        {series.data.books.map((book) => {
          const isNotInLibrary = book.userState.status === "not-in-library";
          const isPending = addToQueue.isPending && pendingAddKey === book.key;
          const publishYear = toPublishedYear(book.publishDate);
          const releaseTimestamp = book.publishDate
            ? new Date(book.publishDate).getTime()
            : Number.NaN;
          const hasFutureReleaseDate =
            Number.isFinite(releaseTimestamp) && releaseTimestamp > Date.now();
          const releaseDateLabel = hasFutureReleaseDate
            ? `Releases ${toDate(book.publishDate)}`
            : null;
          const description = book.description?.trim() ?? "";
          const normalizedDescription = normalizeMarkdownReferences(description);
          const hasDescription = description.length > 0;
          const isLongDescription = description.length > 120;
          const isDescriptionExpanded = expandedDescriptionKeys.has(book.key);

          return (
            <article key={book.key} className={styles.row}>
              <div className={styles.rowMain}>
                <p className={styles.positionLabel}>
                  {book.position != null ? `#${book.position}` : "#-"}
                </p>
                <BookCover title={book.title} coverUrl={book.coverUrl} size="S" />
                <div className={styles.titleBlock}>
                  <Link className={styles.bookLink} to={`/books/${encodeURIComponent(book.key)}`}>
                    {book.title}
                  </Link>
                  <p className={styles.authorText}>
                    {book.authors.join(", ") || "Unknown author"}
                    {publishYear ? ` · ${publishYear}` : ""}
                  </p>
                  {releaseDateLabel ? <p className={styles.metaText}>{releaseDateLabel}</p> : null}
                  {hasDescription ? (
                    <div className={styles.descriptionBlock}>
                      <div
                        className={
                          isDescriptionExpanded
                            ? styles.descriptionExpanded
                            : styles.descriptionCollapsed
                        }
                      >
                        <ReactMarkdown
                          components={{
                            a: (props) => (
                              <a {...props} target="_blank" rel="noreferrer noopener" />
                            ),
                          }}
                        >
                          {normalizedDescription}
                        </ReactMarkdown>
                      </div>
                      {isLongDescription ? (
                        <button
                          className={styles.descriptionToggle}
                          type="button"
                          onClick={() => {
                            setExpandedDescriptionKeys((current) => {
                              const next = new Set(current);
                              if (next.has(book.key)) {
                                next.delete(book.key);
                              } else {
                                next.add(book.key);
                              }
                              return next;
                            });
                          }}
                        >
                          {isDescriptionExpanded ? "Hide" : "Show more"}
                        </button>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </div>

              <div className={styles.rowMeta}>
                <span className={styles.statusBadge}>{statusLabel(book.userState.status)}</span>
                <span className={statusClassName(judgmentLabel(book.userState.judgment))}>
                  {judgmentLabel(book.userState.judgment)}
                </span>
              </div>

              <div className={styles.rowAction}>
                {isNotInLibrary ? (
                  <button
                    type="button"
                    className={styles.queueActionButton}
                    disabled={isPending}
                    onClick={() => addToQueue.mutate(book.key)}
                  >
                    {isPending ? "Adding..." : "Add to planned"}
                  </button>
                ) : (
                  <span className={styles.queueActionText}>In your library</span>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {addToQueue.error ? (
        <p className={styles.errorText}>{getErrorMessage(addToQueue.error)}</p>
      ) : null}
    </section>
  );
};

const normalizeMarkdownReferences = (markdown: string): string => {
  const referenceTailMatch = markdown.match(/(\s+\[[^\]]+\]:\s*https?:\/\/\S+)+\s*$/);
  if (!referenceTailMatch || referenceTailMatch.index === undefined) {
    return markdown;
  }

  const referenceBlock = referenceTailMatch[0]
    .trim()
    .replace(/\s+(?=\[[^\]]+\]:\s*https?:\/\/\S+)/g, "\n");
  const content = markdown.slice(0, referenceTailMatch.index).trimEnd();
  if (!content) {
    return markdown;
  }
  return `${content}\n\n${referenceBlock}`;
};
