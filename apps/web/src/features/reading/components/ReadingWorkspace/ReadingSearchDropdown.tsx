import { BookCover } from "@/features/shared/components/BookCover/BookCover";
import { cx } from "@/generated/utils/cx";
import { toPublishedYearLabel } from "@/lib/format";
import * as styles from "./ReadingSearchDropdown.css";
import type { MyBookSearchItem, RemoteSearchItem } from "./readingSearch";

type Props = {
  query: string;
  listboxId: string;
  myBooks: MyBookSearchItem[];
  addBooks: RemoteSearchItem[];
  focusedItemId: string | null;
  showRemoteSection: boolean;
  isRemoteLoading: boolean;
  remoteError: boolean;
  onSelectMyBook: (bookKey: string) => void;
  onSelectAddBook: (book: RemoteSearchItem) => void;
  onHoverItem: (id: string) => void;
};

const myBookStatusLabel = (status: MyBookSearchItem["status"]) => {
  if (status === "currently-reading") {
    return "Reading";
  }
  if (status === "finished") {
    return "Finished";
  }
  return "Planned";
};

export const ReadingSearchDropdown = ({
  query,
  listboxId,
  myBooks,
  addBooks,
  focusedItemId,
  showRemoteSection,
  isRemoteLoading,
  remoteError,
  onSelectMyBook,
  onSelectAddBook,
  onHoverItem,
}: Props) => {
  const showMyBooksEmpty = query.length >= 2 && myBooks.length === 0;

  return (
    <div
      className={styles.dropdown}
      id={listboxId}
      // biome-ignore lint/a11y/useSemanticElements: Rich interactive rows require custom listbox semantics.
      role="listbox"
      aria-label="Search results"
      tabIndex={-1}
    >
      <section className={styles.section} aria-label="My books">
        <p className={styles.sectionHeader}>My books</p>
        {myBooks.map((book) => {
          const optionId = `my-book-${encodeURIComponent(book.bookKey)}`;
          const isActive = focusedItemId === optionId;

          return (
            <button
              key={book.bookKey}
              id={optionId}
              type="button"
              // biome-ignore lint/a11y/useSemanticElements: Option role is needed for combobox active descendant behavior.
              role="option"
              aria-selected={isActive}
              className={cx(styles.optionRow, isActive && styles.optionRowActive)}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => onHoverItem(optionId)}
              onClick={() => onSelectMyBook(book.bookKey)}
            >
              {book.coverUrl ? (
                <BookCover title={book.title} coverUrl={book.coverUrl} size="S" />
              ) : (
                <div className={styles.placeholderCover} aria-hidden="true" />
              )}
              <div className={styles.rowMain}>
                <p className={styles.title}>{book.title}</p>
                <p className={styles.subtitle}>{book.authors.join(", ") || "Unknown author"}</p>
              </div>
              <span className={styles.statusPill}>{myBookStatusLabel(book.status)}</span>
            </button>
          );
        })}
        {showMyBooksEmpty ? (
          <p className={styles.statusRow} role="note">
            No matches in your books
          </p>
        ) : null}
      </section>

      {showRemoteSection ? (
        <section className={styles.section} aria-label="Add new books">
          <p className={styles.sectionHeader}>Add new books</p>
          {!remoteError && (isRemoteLoading || addBooks.length === 0) ? (
            <div className={styles.collapsedRemoteRow} role="note">
              Search Hardcover for “{query}” -&gt;
              <span className={styles.collapsedRemoteHint}>
                {isRemoteLoading ? "Searching..." : "Keep typing to find titles"}
              </span>
            </div>
          ) : null}
          {remoteError ? (
            <p className={styles.statusRow} role="note">
              Unable to search Hardcover right now
            </p>
          ) : null}
          {!isRemoteLoading && !remoteError
            ? addBooks.map((book) => {
                const optionId = `add-book-${encodeURIComponent(book.key)}`;
                const isActive = focusedItemId === optionId;
                return (
                  <button
                    key={book.key}
                    id={optionId}
                    type="button"
                    // biome-ignore lint/a11y/useSemanticElements: Option role is needed for combobox active descendant behavior.
                    role="option"
                    aria-selected={isActive}
                    className={cx(styles.optionRow, isActive && styles.optionRowActive)}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => onHoverItem(optionId)}
                    onClick={() => onSelectAddBook(book)}
                  >
                    {book.coverUrl ? (
                      <BookCover title={book.title} coverUrl={book.coverUrl} size="S" />
                    ) : (
                      <div className={styles.placeholderCover} aria-hidden="true" />
                    )}
                    <div className={styles.rowMain}>
                      <p className={styles.title}>{book.title}</p>
                      <p className={styles.subtitle}>
                        {book.authorName.join(", ") || "Unknown author"}
                      </p>
                    </div>
                    <div className={styles.meta}>
                      {toPublishedYearLabel(book.firstPublishYear) ? (
                        <span>{toPublishedYearLabel(book.firstPublishYear)}</span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            : null}
        </section>
      ) : null}
    </div>
  );
};
