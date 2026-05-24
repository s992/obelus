import { useEvent } from '@react-aria/utils';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useCallback, useRef, useState } from 'react';
import { type Options, useHotkeys } from 'react-hotkeys-hook';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDebounceValue, useEventListener } from 'usehooks-ts';

import { useTRPC } from '@/client';
import { BookCover } from '@/components/BookCover';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Search } from '@/components/Search';
import { useFormatPublishYear } from '@/hooks/useFormatPublishYear';
import { flex, typography } from '@/style';

import { BookPreview } from './BookPreview';
import {
  authorPublished,
  footer,
  footerCount,
  keyboard,
  preview,
  resultContainer,
  row,
  rowBar,
  scrollContainer,
  shortcutSegment,
  shortcuts,
  status,
  title,
  titleAuthorStack,
} from './bookSearch.css';
import { StatusCell } from './StatusCell';

export function BookSearch() {
  const intl = useIntl();
  const trpc = useTRPC();
  const routerNavigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
  const [modality, setModality] = useState<'mouse' | 'keyboard'>('mouse');
  const [query, setQuery] = useState('');
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [debouncedQuery] = useDebounceValue(query, 500);
  const actualQuery = debouncedQuery.trim();
  const { data: results, isLoading } = useQuery(
    trpc.book.search.queryOptions({ query: actualQuery }, { enabled: actualQuery.length > 0 }),
  );
  const formatPublishDate = useFormatPublishYear();

  const setRowRef = useCallback(
    (index: number) => (el: HTMLElement | null) => {
      if (el) {
        rowRefs.current.set(index, el);
      } else {
        rowRefs.current.delete(index);
      }
    },
    [],
  );

  const goToBook = (id: number) => {
    routerNavigate({ to: '/book/$bookId', params: { bookId: id.toString() } });
  };

  const navigate = (direction: number, indexOverride?: number) => {
    const navIndex = focusedIdx;
    let boundedOverride = indexOverride;

    if (boundedOverride !== undefined && boundedOverride !== -1) {
      boundedOverride =
        direction === 1 ? Math.min(boundedOverride, rowRefs.current.size - 1) : Math.max(boundedOverride, 0);
    }

    const next = boundedOverride ?? Math.min(navIndex + direction, rowRefs.current.size - 1);

    if (next === navIndex) {
      return;
    }

    const nextEl = next === -1 ? inputRef.current : rowRefs.current.get(next);

    if (!nextEl) {
      return;
    }

    setFocusedIdx(next);
    nextEl.scrollIntoView({ block: 'nearest' });
    nextEl.focus();
  };

  const hotkeyOpts = { enableOnFormTags: true, preventDefault: true } satisfies Options;

  useHotkeys(
    'ArrowDown',
    () => {
      navigate(1);
    },
    hotkeyOpts,
  );
  useHotkeys(
    'ArrowUp',
    () => {
      navigate(-1);
    },
    hotkeyOpts,
  );
  useHotkeys('Home', () => navigate(-1, 0), hotkeyOpts);
  useHotkeys('End', () => navigate(1, rowRefs.current.size - 1), hotkeyOpts);
  useHotkeys('PageUp', () => navigate(-1, focusedIdx - 5), hotkeyOpts);
  useHotkeys('PageDown', () => navigate(1, focusedIdx + 5), hotkeyOpts);
  useHotkeys(
    'Enter',
    () => {
      if (focusedIdx === -1) {
        return;
      }

      const book = results?.[focusedIdx];

      if (!book) {
        return;
      }

      goToBook(book.id);
    },
    hotkeyOpts,
  );

  useEventListener('mousemove', () => setModality('mouse'));
  useEventListener('keydown', () => setModality('keyboard'));

  useEvent(inputRef, 'focusin', () => {
    navigate(-1, -1);
  });

  return (
    <div data-modality={modality}>
      <Search
        label={intl.formatMessage({ defaultMessage: 'search by title or author' })}
        value={query}
        onChange={setQuery}
        ref={searchRef}
        inputRef={inputRef}
        // as far as i understand it, autofocus in a modal is valid and not
        // an actual accessibility concern.
        // oxlint-disable-next-line jsx_a11y/no-autofocus
        autoFocus
      />
      {isLoading && (
        <div className={flex.center}>
          <LoadingSpinner size="large" />
        </div>
      )}
      {!isLoading && results && query && (
        <div className={resultContainer}>
          <div className={scrollContainer}>
            {results.map((book, idx) => {
              const isFocused = focusedIdx === idx;

              return (
                <button
                  key={book.id}
                  className={row}
                  ref={setRowRef(idx)}
                  onMouseEnter={() => setFocusedIdx(idx)}
                  onFocus={() => setFocusedIdx(idx)}
                  data-selected={isFocused}
                  onClick={() => goToBook(book.id)}
                >
                  {isFocused && <div className={rowBar} />}
                  <BookCover book={book} />
                  <div className={titleAuthorStack}>
                    <div className={title}>{book.title}</div>
                    <div className={authorPublished}>
                      <span>{book.author}</span>
                      <span className={typography.uppercaseLabel}>· {formatPublishDate(book.releaseDate)}</span>
                    </div>
                  </div>
                  <div className={status}>
                    <StatusCell record={book.record} />
                  </div>
                </button>
              );
            })}
          </div>
          <div className={preview}>{results[focusedIdx] && <BookPreview book={results[focusedIdx]} />}</div>
        </div>
      )}
      <div className={footer}>
        <div className={shortcuts}>
          {results && (
            <>
              <span className={shortcutSegment}>
                <kbd className={keyboard}>&uarr;</kbd>
                <kbd className={keyboard}>&darr;</kbd>
                <FormattedMessage defaultMessage="navigate" />
              </span>
              <span className={shortcutSegment}>
                <kbd className={keyboard}>&crarr;</kbd>
                <FormattedMessage defaultMessage="open" />
              </span>
            </>
          )}
          <span className={shortcutSegment}>
            <kbd className={keyboard}>ESC</kbd>
            <FormattedMessage defaultMessage="close" />
          </span>
        </div>
        {results && (
          <span className={footerCount}>
            <FormattedMessage defaultMessage="{count} matches" values={{ count: results.length }} />
          </span>
        )}
      </div>
    </div>
  );
}
