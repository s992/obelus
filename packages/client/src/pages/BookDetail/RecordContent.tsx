import type { Book, Note } from '@obelus/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import { TextArea } from 'react-aria-components';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { Button } from '../../components/Button';
import { toastQueue } from '../../components/Toast';
import { useFormatLongDate } from '../../hooks/useFormatLongDate';
import { judgment as judgmentCss, typography } from '../../style';
import {
  addNoteButton,
  entryCount,
  noteList,
  noteListItem,
  noteTextAreaContainer,
  recordContainer,
  renderedNote,
  sectionHeader,
  textArea,
} from './bookDetail.css';

type Props = {
  book: Book;
  notes?: Note[];
};

export function RecordContent({ book, notes }: Props) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const formatLongDate = useFormatLongDate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [noteContent, setNoteContent] = useState('');
  const { mutate: createNote, isPending: isCreatingNote } = useMutation(
    trpc.note.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.note.list.queryKey({ recordId: book.record?.id ?? '' }) });
        await queryClient.invalidateQueries({ queryKey: trpc.book.byId.queryKey({ id: book.id }) });
        setNoteContent('');
      },
      onError: () => {
        toastQueue.add({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Failed to create note' }),
          message: intl.formatMessage({ defaultMessage: 'Please refresh your browser window and try again.' }),
        });
      },
    }),
  );

  const { record } = book;
  const formattedUpdateDate = formatLongDate(record?.updatedAt);
  const judgmentHighlight = record?.judgment ? judgmentCss[record.judgment] : undefined;

  return (
    <div className={recordContainer}>
      <div>
        <div className={sectionHeader}>
          <h2 className={typography.labelLg}>
            <FormattedMessage defaultMessage="judgment" />
          </h2>
          <Button variant="underlined">
            <FormattedMessage defaultMessage="revise" />
          </Button>
        </div>
        <p className={typography.bodyLg}>
          <FormattedMessage
            defaultMessage="<highlight>{judgment}</highlight> as of {updatedAt}"
            values={{
              highlight: (chunks) => <span className={judgmentHighlight}>{chunks}</span>,
              judgment: record?.judgment ?? <FormattedMessage defaultMessage="unjudged" />,
              updatedAt: formattedUpdateDate,
            }}
          />
        </p>
      </div>
      <div>
        <div className={sectionHeader}>
          <h2 className={typography.labelLg}>
            <FormattedMessage defaultMessage="notes" />
          </h2>
          <span className={entryCount}>
            <FormattedMessage defaultMessage="0 entries" />
          </span>
        </div>
        <div className={noteTextAreaContainer} onClick={() => textAreaRef.current?.focus()}>
          <TextArea
            ref={textAreaRef}
            className={textArea}
            rows={3}
            placeholder="Add a note. It will not be edited; notes are appended below."
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            disabled={isCreatingNote}
          />
          <Button
            className={addNoteButton}
            onPress={() => createNote({ content: noteContent, recordId: book.record?.id ?? '' })}
            isProcessing={isCreatingNote}
          >
            <FormattedMessage defaultMessage="add note" />
          </Button>
        </div>
        <ol className={noteList}>
          {notes?.map((note) => (
            <li key={note.id} className={noteListItem}>
              <div>{formatLongDate(note.createdAt)}</div>
              <pre className={renderedNote}>{note.content}</pre>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
