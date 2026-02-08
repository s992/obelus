import { trpc } from "@/api/trpc";
import { useBookDetailsByKeys } from "@/features/books/hooks/useBookDetailsByKeys";
import { BookCover } from "@/features/shared/components/BookCover/BookCover";
import { LoadingObelus } from "@/features/shared/components/LoadingObelus/LoadingObelus";
import { statusLabel } from "@/features/shared/lib/book-metadata";
import { statusClassName } from "@/features/shared/lib/status-class";
import { fallbackTitle, toDate, toPublishedLabel } from "@/lib/format";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/ui/Button";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as styles from "./PublicCollectionView.css";

export const PublicCollectionView = () => {
  const navigate = useNavigate();
  const params = useParams();
  const userId = params.userId ?? "";

  const collection = useQuery({
    queryKey: queryKeys.publicCollection(userId),
    queryFn: () => trpc.library.publicCollection.query({ userId }),
    enabled: userId.length > 0,
    retry: false,
  });

  const allBookKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of collection.data?.reading ?? []) keys.add(entry.bookKey);
    for (const entry of collection.data?.toRead ?? []) keys.add(entry.bookKey);
    return [...keys];
  }, [collection.data]);

  const detailLookups = useBookDetailsByKeys(allBookKeys);
  const detailIndex = detailLookups.data ?? {};

  const publicReading = useMemo(
    () => (collection.data?.reading ?? []).filter((entry) => !entry.finishedAt),
    [collection.data?.reading],
  );
  const publicFinished = useMemo(
    () => (collection.data?.reading ?? []).filter((entry) => Boolean(entry.finishedAt)),
    [collection.data?.reading],
  );

  if (!collection.data) {
    if (collection.isLoading) {
      return (
        <main className={styles.page}>
          <div className={styles.container}>
            <LoadingObelus label="Loading public collection..." />
          </div>
        </main>
      );
    }

    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <article className={styles.card}>
            <h2 className={styles.pageTitle}>Public collection not available</h2>
            <p className={styles.mutedBody}>This collection is private or does not exist.</p>
            <div className={styles.actionRow}>
              <Button
                className={styles.ghostButton}
                type="button"
                color="tertiary"
                onClick={() => navigate("/")}
              >
                Go home
              </Button>
            </div>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.navigation}>
          <button className={styles.logoButton} onClick={() => navigate("/")} type="button">
            <span className={styles.logoSymbol}>÷</span>
            <span className={styles.logoText}>Obelus</span>
          </button>
        </header>

        <article className={styles.card}>
          <h2 className={styles.pageTitle}>{collection.data.profile.displayName}</h2>
          <p className={styles.mutedBody}>Public reading collection (read only)</p>

          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Reading</h3>
            {detailLookups.isLoading ? (
              <LoadingObelus label="Loading book metadata..." compact />
            ) : null}
            <div className={styles.listContainer}>
              {publicReading.length ? (
                publicReading.map((entry) => {
                  const meta = detailIndex[entry.bookKey];
                  const status = statusLabel(entry);
                  return (
                    <div key={entry.id} className={styles.bookListRowReadOnly}>
                      <div className={styles.bookRowContent}>
                        <BookCover
                          title={meta?.title ?? fallbackTitle(entry.bookKey)}
                          coverId={meta?.covers?.[0] ?? null}
                        />
                        <div className={styles.bookRowMain}>
                          <h3 className={styles.bookListTitle}>
                            {meta?.title ?? fallbackTitle(entry.bookKey)}
                          </h3>
                          <p className={styles.bookListAuthor}>
                            {meta?.authors.join(", ") || "Unknown author"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.bookMetaRow}>
                        <span>
                          {entry.finishedAt
                            ? `Finished ${toDate(entry.finishedAt)}`
                            : `Started ${toDate(entry.startedAt)}`}
                        </span>
                        {toPublishedLabel(meta?.publishDate ?? null) ? (
                          <span>{toPublishedLabel(meta?.publishDate ?? null)}</span>
                        ) : null}
                        <span className={statusClassName(status)}>{status}</span>
                      </div>
                      {entry.notes ? <p className={styles.mutedBody}>{entry.notes}</p> : null}
                    </div>
                  );
                })
              ) : (
                <p className={styles.mutedBody}>No reading entries published.</p>
              )}
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Finished</h3>
            <div className={styles.listContainer}>
              {publicFinished.length ? (
                publicFinished.map((entry) => {
                  const meta = detailIndex[entry.bookKey];
                  const status = statusLabel(entry);
                  return (
                    <div key={entry.id} className={styles.bookListRowReadOnly}>
                      <div className={styles.bookRowContent}>
                        <BookCover
                          title={meta?.title ?? fallbackTitle(entry.bookKey)}
                          coverId={meta?.covers?.[0] ?? null}
                        />
                        <div className={styles.bookRowMain}>
                          <h3 className={styles.bookListTitle}>
                            {meta?.title ?? fallbackTitle(entry.bookKey)}
                          </h3>
                          <p className={styles.bookListAuthor}>
                            {meta?.authors.join(", ") || "Unknown author"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.bookMetaRow}>
                        <span>Finished {toDate(entry.finishedAt ?? null)}</span>
                        {toPublishedLabel(meta?.publishDate ?? null) ? (
                          <span>{toPublishedLabel(meta?.publishDate ?? null)}</span>
                        ) : null}
                        <span className={statusClassName(status)}>{status}</span>
                      </div>
                      {entry.notes ? <p className={styles.mutedBody}>{entry.notes}</p> : null}
                    </div>
                  );
                })
              ) : (
                <p className={styles.mutedBody}>No finished entries published.</p>
              )}
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Planned</h3>
            <div className={styles.listContainer}>
              {collection.data.toRead.length ? (
                collection.data.toRead.map((entry) => {
                  const meta = detailIndex[entry.bookKey];
                  return (
                    <div key={entry.id} className={styles.bookListRowReadOnly}>
                      <div className={styles.bookRowContent}>
                        <BookCover
                          title={meta?.title ?? fallbackTitle(entry.bookKey)}
                          coverId={meta?.covers?.[0] ?? null}
                        />
                        <div className={styles.bookRowMain}>
                          <h3 className={styles.bookListTitle}>
                            {meta?.title ?? fallbackTitle(entry.bookKey)}
                          </h3>
                          <p className={styles.bookListAuthor}>
                            {meta?.authors.join(", ") || "Unknown author"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.bookMetaRow}>
                        <span>Added {toDate(entry.addedAt)}</span>
                        {toPublishedLabel(meta?.publishDate ?? null) ? (
                          <span>{toPublishedLabel(meta?.publishDate ?? null)}</span>
                        ) : null}
                        <span className={styles.readingBadge}>Planned</span>
                      </div>
                      {entry.notes ? <p className={styles.mutedBody}>{entry.notes}</p> : null}
                    </div>
                  );
                })
              ) : (
                <p className={styles.mutedBody}>No planned entries published.</p>
              )}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
};
