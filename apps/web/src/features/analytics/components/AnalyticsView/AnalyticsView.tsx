import { trpc } from "@/api/trpc";
import { useBookDetailsByKeys } from "@/features/books/hooks/useBookDetailsByKeys";
import { LoadingObelus } from "@/features/shared/components/LoadingObelus/LoadingObelus";
import { queryKeys } from "@/lib/query-keys";
import type { DashboardReport } from "@obelus/shared";
import { useQuery } from "@tanstack/react-query";
import * as styles from "./AnalyticsView.css";

export const AnalyticsView = () => {
  const reading = useQuery({
    queryKey: queryKeys.reading,
    queryFn: () => trpc.library.listReading.query(),
  });

  const report = useQuery<DashboardReport>({
    queryKey: queryKeys.report,
    queryFn: () => trpc.reports.dashboard.query(),
  });

  const libraryKeys = [...new Set((reading.data ?? []).map((entry) => entry.bookKey))];

  const detailLookups = useBookDetailsByKeys(libraryKeys);

  const monthlyMax = !report.data?.monthly.length
    ? 1
    : Math.max(
        1,
        ...report.data.monthly.map((point) => Math.max(point.finishedBooks, point.startedBooks)),
      );

  const topAuthors = (() => {
    const counts = new Map<string, number>();
    for (const entry of reading.data ?? []) {
      const authors = detailLookups.data?.[entry.bookKey]?.authors ?? [];
      for (const author of authors) {
        counts.set(author, (counts.get(author) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([author, count]) => ({ author, count }));
  })();

  if (reading.isLoading || report.isLoading) {
    return <LoadingObelus label="Compiling reports..." />;
  }

  return (
    <section className={styles.analyticsView}>
      <div className={styles.statGrid}>
        <article className={styles.statCard}>
          <p className={styles.fieldLabel}>Books Completed</p>
          <p className={styles.statValue}>{report.data?.totalRead ?? 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.fieldLabel}>Accepted</p>
          <p className={styles.statValue}>{report.data?.accepted ?? 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.fieldLabel}>Rejected</p>
          <p className={styles.statValue}>{report.data?.rejected ?? 0}</p>
        </article>
      </div>

      <article className={styles.card}>
        <h3 className={styles.sectionTitle}>Reading timeline</h3>
        <div className={styles.chartArea}>
          {(report.data?.monthly ?? []).map((point) => (
            <div className={styles.chartColumn} key={point.month}>
              <div className={styles.chartBars}>
                {point.startedBooks === 0 ? (
                  <span className={styles.chartZeroTick} />
                ) : (
                  <span
                    className={styles.chartBarStarted}
                    style={{
                      height: `${Math.max(8, (point.startedBooks / monthlyMax) * 120)}px`,
                    }}
                  />
                )}
                {point.finishedBooks === 0 ? (
                  <span className={styles.chartZeroTick} />
                ) : (
                  <span
                    className={styles.chartBarFinished}
                    style={{
                      height: `${Math.max(8, (point.finishedBooks / monthlyMax) * 120)}px`,
                    }}
                  />
                )}
              </div>
              <span className={styles.chartLabel}>{point.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </article>

      <article className={styles.card}>
        <h3 className={styles.sectionTitle}>Most read authors</h3>
        <div className={styles.authorList}>
          {topAuthors.length ? (
            topAuthors.map((entry) => (
              <div className={styles.authorRow} key={entry.author}>
                <span className={styles.bookListAuthor}>{entry.author}</span>
                <span className={styles.metaText}>{entry.count}</span>
              </div>
            ))
          ) : (
            <p className={styles.mutedBody}>No author statistics available yet.</p>
          )}
        </div>
      </article>
    </section>
  );
};
