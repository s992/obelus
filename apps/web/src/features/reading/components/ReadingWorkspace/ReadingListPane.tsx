import { BookCover } from "@/features/shared/components/BookCover/BookCover";
import { LoadingObelus } from "@/features/shared/components/LoadingObelus/LoadingObelus";
import { statusLabel } from "@/features/shared/lib/book-metadata";
import { statusClassName } from "@/features/shared/lib/status-class";
import { fallbackTitle, toDate, toPublishedLabel } from "@/lib/format";
import { Button } from "@/ui/Button";
import type { ReadingEntry, ToReadEntry } from "@obelus/shared";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  type CSSProperties,
  type KeyboardEvent,
  memo,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as styles from "./ReadingWorkspace.css";

type DetailLookup = {
  title?: string;
  authors?: string[];
  covers?: string[];
  coverUrl?: string | null;
  publishDate?: string | null;
};

type ReadingTab = "currently-reading" | "planned" | "finished";

type Props = {
  isSearchMode: boolean;
  isLibraryLoading: boolean;
  readingTab: ReadingTab;
  currentlyReading: ReadingEntry[];
  plannedReading: ToReadEntry[];
  archiveReading: ReadingEntry[];
  detailIndex: Record<string, DetailLookup>;
  onReadingTabChange: (tab: ReadingTab) => void;
  onNavigateToBook: (bookKey: string) => void;
};

const ROW_ESTIMATE = 136;

const listTabs: Array<{ id: ReadingTab; label: string }> = [
  { id: "currently-reading", label: "Currently Reading" },
  { id: "planned", label: "Planned" },
  { id: "finished", label: "Finished" },
];

export const ReadingListPane = memo(
  ({
    isSearchMode,
    isLibraryLoading,
    readingTab,
    currentlyReading,
    plannedReading,
    archiveReading,
    detailIndex,
    onReadingTabChange,
    onNavigateToBook,
  }: Props) => {
    const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
    const previousTabRef = useRef<ReadingTab>(readingTab);

    const entriesForTab = useMemo(() => {
      if (readingTab === "currently-reading") {
        return currentlyReading;
      }
      if (readingTab === "planned") {
        return plannedReading;
      }
      return archiveReading;
    }, [archiveReading, currentlyReading, plannedReading, readingTab]);

    const rowVirtualizer = useVirtualizer({
      count: isSearchMode ? 0 : entriesForTab.length,
      getScrollElement: () => scrollElement,
      estimateSize: () => ROW_ESTIMATE,
      overscan: 8,
    });

    const virtualRows = rowVirtualizer.getVirtualItems();

    useEffect(() => {
      if (!isSearchMode && previousTabRef.current !== readingTab) {
        rowVirtualizer.scrollToOffset(0);
      }
      previousTabRef.current = readingTab;
    }, [isSearchMode, readingTab, rowVirtualizer]);

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
      onReadingTabChange(nextTabId);
      const nextTabElement = document.getElementById(`reading-tab-${nextTabId}`);
      nextTabElement?.focus();
    };

    const renderReadingRow = (entry: ReadingEntry) => {
      const bookMeta = detailIndex[entry.bookKey];
      return (
        <button
          className={styles.virtualizedBookListRow}
          type="button"
          key={entry.id}
          onClick={() => onNavigateToBook(entry.bookKey)}
        >
          <div className={styles.bookRowContent}>
            <BookCover
              title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
              coverUrl={bookMeta?.coverUrl ?? bookMeta?.covers?.[0] ?? null}
            />
            <div className={styles.bookRowMain}>
              <h3 className={styles.bookListTitle}>
                {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
              </h3>
              <p className={styles.bookListAuthor}>
                {bookMeta?.authors?.join(", ") || "Unknown author"}
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
    };

    const renderPlannedRow = (entry: ToReadEntry) => {
      const bookMeta = detailIndex[entry.bookKey];
      return (
        <button
          className={styles.virtualizedBookListRow}
          type="button"
          key={entry.id}
          onClick={() => onNavigateToBook(entry.bookKey)}
        >
          <div className={styles.bookRowContent}>
            <BookCover
              title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
              coverUrl={bookMeta?.coverUrl ?? bookMeta?.covers?.[0] ?? null}
            />
            <div className={styles.bookRowMain}>
              <h3 className={styles.bookListTitle}>
                {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
              </h3>
              <p className={styles.bookListAuthor}>
                {bookMeta?.authors?.join(", ") || "Unknown author"}
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
    };

    const renderFinishedRow = (entry: ReadingEntry) => {
      const bookMeta = detailIndex[entry.bookKey];
      const status = statusLabel(entry);
      return (
        <button
          className={styles.virtualizedBookListRow}
          type="button"
          key={entry.id}
          onClick={() => onNavigateToBook(entry.bookKey)}
        >
          <div className={styles.bookRowContent}>
            <BookCover
              title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
              coverUrl={bookMeta?.coverUrl ?? bookMeta?.covers?.[0] ?? null}
            />
            <div className={styles.bookRowMain}>
              <h3 className={styles.bookListTitle}>
                {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
              </h3>
              <p className={styles.bookListAuthor}>
                {bookMeta?.authors?.join(", ") || "Unknown author"}
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
    };

    const renderVirtualRow = (index: number) => {
      if (readingTab === "currently-reading") {
        const entry = currentlyReading[index];
        return entry ? renderReadingRow(entry) : null;
      }
      if (readingTab === "planned") {
        const entry = plannedReading[index];
        return entry ? renderPlannedRow(entry) : null;
      }
      const entry = archiveReading[index];
      return entry ? renderFinishedRow(entry) : null;
    };

    return (
      <>
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
                aria-controls="reading-list-panel"
                tabIndex={readingTab === tab.id ? 0 : -1}
                className={readingTab === tab.id ? styles.tabButtonActive : styles.tabButton}
                onClick={() => onReadingTabChange(tab.id)}
                onKeyDown={(event) => onTabKeyDown(event, index)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        ) : null}

        <div
          className={styles.listContainer}
          id={!isSearchMode ? "reading-list-panel" : undefined}
          role={!isSearchMode ? "tabpanel" : undefined}
          aria-labelledby={!isSearchMode ? `reading-tab-${readingTab}` : undefined}
          aria-live="polite"
          aria-busy={isLibraryLoading}
        >
          {!isSearchMode && entriesForTab.length > 0 ? (
            <div className={styles.virtualListViewport} ref={setScrollElement}>
              <div
                style={{
                  height: `${rowVirtualizer.getTotalSize()}px`,
                  position: "relative",
                  width: "100%",
                }}
              >
                {virtualRows.map((virtualRow) => {
                  const rowStyle: CSSProperties = {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                  };

                  return (
                    <div
                      key={`${readingTab}-${virtualRow.key}`}
                      data-index={virtualRow.index}
                      ref={rowVirtualizer.measureElement}
                      style={rowStyle}
                    >
                      {renderVirtualRow(virtualRow.index)}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}

          {!isSearchMode &&
          !isLibraryLoading &&
          ((readingTab === "currently-reading" && currentlyReading.length === 0) ||
            (readingTab === "planned" && plannedReading.length === 0) ||
            (readingTab === "finished" && archiveReading.length === 0)) ? (
            <p className={styles.mutedBody}>No entries in this section.</p>
          ) : null}
          {isLibraryLoading && !isSearchMode ? (
            <LoadingObelus label="Loading collection..." compact />
          ) : null}
        </div>
      </>
    );
  },
);

ReadingListPane.displayName = "ReadingListPane";
