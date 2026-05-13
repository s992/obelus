import { useEvent } from '@react-aria/utils';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useRef, useState } from 'react';
import { GridList, GridListItem } from 'react-aria-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { useIntl } from 'react-intl';
import { useDebounceValue, useEventListener } from 'usehooks-ts';

import { useTRPC } from '../../client';
import { useFormatPublishYear } from '../../hooks/useFormatPublishYear';
import { flex } from '../../style';
import { BookCover } from '../BookCover';
import { LoadingSpinner } from '../LoadingSpinner';
import { Search } from '../Search';
import { TitleAuthorStack } from '../TitleAuthorStack';
import { container, gridRow, resultContainer, resultHeader } from './bookSearch.css';

export function BookSearch() {
  const intl = useIntl();
  const trpc = useTRPC();
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rowRefs = useRef<Map<number, HTMLElement>>(new Map());
  const navIndexRef = useRef(-1);
  const [modality, setModality] = useState<'mouse' | 'keyboard'>('mouse');
  const [query, setQuery] = useState('');
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

  useEvent(inputRef, 'focusin', () => {
    navigate(-1, -1);
  });

  const navigate = (direction: number, indexOverride?: number) => {
    const navIndex = navIndexRef.current;
    const next = indexOverride ?? Math.min(navIndex + direction, rowRefs.current.size - 1);

    if (next === navIndex) {
      return;
    }

    const nextEl = next === -1 ? inputRef.current : rowRefs.current.get(next);

    if (!nextEl) {
      return;
    }

    nextEl.scrollIntoView({ block: 'nearest' });
    nextEl.focus();
    navIndexRef.current = next;
  };

  useHotkeys(
    'ArrowDown',
    () => {
      navigate(1);
    },
    { enableOnFormTags: true, preventDefault: true },
  );

  useHotkeys(
    'ArrowUp',
    () => {
      navigate(-1);
    },
    { enableOnFormTags: true, preventDefault: true },
  );

  useEventListener('mousemove', () => setModality('mouse'));
  useEventListener('keydown', () => setModality('keyboard'));

  return (
    <div className={container} data-modality={modality}>
      <Search
        label={intl.formatMessage({ defaultMessage: 'search by title or author' })}
        value={query}
        onChange={setQuery}
        ref={searchRef}
        inputRef={inputRef}
        autoFocus
      />
      {isLoading && (
        <div className={flex.verticalCenter}>
          <LoadingSpinner size="large" />
        </div>
      )}
      {!isLoading && results && query && (
        <div className={resultContainer}>
          <div className={resultHeader}>
            <div />
            <div>title / author</div>
            <div>published</div>
            <div>judgment</div>
          </div>
          <GridList aria-label={intl.formatMessage({ defaultMessage: 'Search results for "{query}"' }, { query })}>
            {results?.map((book, idx) => {
              const formattedPublishDate = formatPublishDate(book.releaseDate);

              return (
                <GridListItem
                  textValue={intl.formatMessage(
                    { defaultMessage: '{title} by {author}, published {publishDate}, {judgment}' },
                    {
                      title: book.title,
                      author: book.author,
                      published: formattedPublishDate,
                      judgment: 'unread',
                    },
                  )}
                  ref={setRowRef(idx)}
                  key={book.id}
                  className={gridRow}
                  href={`/book/${book.id}`}
                >
                  <BookCover book={book} />
                  <div className={flex.verticalCenter}>
                    <TitleAuthorStack title={book.title} author={book.author} />
                  </div>
                  <div className={flex.verticalCenter}>{formattedPublishDate}</div>
                  <div className={flex.verticalCenter}>unread</div>
                </GridListItem>
              );
            })}
          </GridList>
        </div>
      )}
    </div>
  );
}
