import type { Book, Maybe, NoteJson } from '@obelus/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { TextArea } from 'react-aria-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { Button } from '../../components/Button';
import { showMutationError } from '../../components/Toast';
import { useFormatLongDate } from '../../hooks/useFormatLongDate';
import { judgment as judgmentCss, typography } from '../../style';
import {
  addNoteButton,
  entryCount,
  metaLabel,
  noteDate,
  noteList,
  noteListItem,
  noteTextAreaContainer,
  recordContainer,
  renderedNote,
  revisionContainer,
  sectionHeader,
  textArea,
} from './bookDetail.css';
import { RevisionForm } from './RevisionForm';

type Props = {
  book: Book;
  notes?: Maybe<NoteJson[]>;
};

export function RecordContent({ book, notes }: Props) {
  const { record } = book;
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const formatLongDate = useFormatLongDate();
  const [noteContent, setNoteContent] = useState('');
  const [isRevising, setIsRevising] = useState(false);
  const { mutate: createNote, isPending: isCreatingNote } = useMutation(
    trpc.note.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.note.list.queryKey({ id: book.record?.id ?? '' }) });
        await queryClient.invalidateQueries({ queryKey: trpc.book.byId.queryKey({ id: book.id }) });
        setNoteContent('');
      },
      onError: () => {
        showMutationError(intl, intl.formatMessage({ defaultMessage: 'Failed to create note' }));
      },
    }),
  );

  const submitRef = useHotkeys('mod+enter', () => submitNote(), { enableOnFormTags: true });
  const formattedUpdateDate = formatLongDate(record?.updatedAt);
  const judgmentHighlight = record?.judgment ? judgmentCss[record.judgment] : undefined;
  const submitNote = () => {
    console.log('fired');
    if (!book.record || !noteContent.trim()) {
      return;
    }

    createNote({ content: noteContent, id: book.record.id });
  };

  return (
    <div className={recordContainer}>
      <div>
        <div className={sectionHeader}>
          <h2 className={clsx(typography.label, metaLabel)}>
            <FormattedMessage defaultMessage="judgment" />
          </h2>
          <Button variant="underlined" onPress={() => setIsRevising((current) => !current)}>
            <FormattedMessage defaultMessage="revise" />
          </Button>
        </div>
        <p className={typography.body}>
          <FormattedMessage
            defaultMessage="<highlight>{judgment}</highlight> as of {updatedAt}"
            values={{
              highlight: (chunks) => <span className={judgmentHighlight}>{chunks}</span>,
              judgment: record?.judgment ?? record?.status ?? <FormattedMessage defaultMessage="unjudged" />,
              updatedAt: formattedUpdateDate,
            }}
          />
        </p>
        {isRevising && record && (
          <div className={revisionContainer}>
            <RevisionForm bookId={book.id} record={record} />
          </div>
        )}
      </div>
      <div>
        <div className={sectionHeader}>
          <h2 className={clsx(typography.label, metaLabel)}>
            <FormattedMessage defaultMessage="notes" />
          </h2>
          <span className={entryCount}>
            <FormattedMessage
              defaultMessage="{count} {count, plural, =1 {entry} other {entries}}"
              values={{ count: notes?.length ?? 0 }}
            />
          </span>
        </div>
        <label className={noteTextAreaContainer}>
          <TextArea
            ref={submitRef}
            className={textArea}
            rows={3}
            placeholder={intl.formatMessage({
              defaultMessage: 'Add a note. It will not be edited; notes are appended below.',
            })}
            value={noteContent}
            onChange={(e) => setNoteContent(e.target.value)}
            disabled={isCreatingNote}
          />
          <Button
            className={addNoteButton}
            onPress={submitNote}
            isProcessing={isCreatingNote}
            isDisabled={!noteContent.trim().length}
          >
            <FormattedMessage defaultMessage="Add Note" />
          </Button>
        </label>
        <ol className={noteList}>
          {notes?.map((note) => (
            <li key={note.id} className={noteListItem}>
              <div className={noteDate}>{formatLongDate(note.createdAt)}</div>
              <div className={renderedNote}>{note.content}</div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
