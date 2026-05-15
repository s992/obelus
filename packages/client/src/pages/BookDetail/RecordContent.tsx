import type { Book, Judgment, Maybe, NoteJson, Status } from '@obelus/shared/types';
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

type Props = {
  book: Book;
  notes?: Maybe<NoteJson[]>;
};

export function RecordContent({ book, notes }: Props) {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const formatLongDate = useFormatLongDate();
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
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
        toastQueue.add({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Failed to create note' }),
          message: intl.formatMessage({ defaultMessage: 'Please refresh your browser window and try again.' }),
        });
      },
    }),
  );
  const { mutate: updateRecord, isPending: isUpdatingRecord } = useMutation(
    trpc.record.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.book.byId.queryKey({ id: book.id }) });
        setIsRevising(false);
      },
      onError: () => {
        toastQueue.add({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Failed to revise judgment' }),
          message: intl.formatMessage({ defaultMessage: 'Please refresh your browser window and try again.' }),
        });
      },
    }),
  );

  const { record } = book;
  const formattedUpdateDate = formatLongDate(record?.updatedAt);
  const judgmentHighlight = record?.judgment ? judgmentCss[record.judgment] : undefined;
  const updateJudgment = (judgment: Judgment) => () => {
    if (!record) {
      return;
    }

    updateRecord({ id: record.id, status: 'finished', judgment });
  };
  const updateStatus = (status: Status) => () => {
    if (!record) {
      return;
    }

    updateRecord({ id: record.id, status });
  };

  return (
    <div className={recordContainer}>
      <div>
        <div className={sectionHeader}>
          <h2 className={typography.labelLg}>
            <FormattedMessage defaultMessage="judgment" />
          </h2>
          <Button variant="underlined" onPress={() => setIsRevising((current) => !current)}>
            <FormattedMessage defaultMessage="revise" />
          </Button>
        </div>
        <p className={typography.bodyLg}>
          <FormattedMessage
            defaultMessage="<highlight>{judgment}</highlight> as of {updatedAt}"
            values={{
              highlight: (chunks) => <span className={judgmentHighlight}>{chunks}</span>,
              judgment: record?.judgment ?? record?.status ?? <FormattedMessage defaultMessage="unjudged" />,
              updatedAt: formattedUpdateDate,
            }}
          />
        </p>
        {isRevising && !isUpdatingRecord && (
          <div className={revisionContainer}>
            <Button variant="secondary" onPress={updateJudgment('accepted')}>
              <FormattedMessage defaultMessage="accepted" />
            </Button>
            <Button variant="secondary" onPress={updateJudgment('rejected')}>
              <FormattedMessage defaultMessage="rejected" />
            </Button>
            <Button variant="secondary" onPress={updateJudgment('mixed')}>
              <FormattedMessage defaultMessage="mixed" />
            </Button>
            <Button variant="secondary" onPress={updateStatus('reading')}>
              <FormattedMessage defaultMessage="reading" />
            </Button>
            <Button variant="secondary" onPress={updateStatus('planned')}>
              <FormattedMessage defaultMessage="planned" />
            </Button>
          </div>
        )}
      </div>
      <div>
        <div className={sectionHeader}>
          <h2 className={typography.labelLg}>
            <FormattedMessage defaultMessage="notes" />
          </h2>
          <span className={entryCount}>
            <FormattedMessage
              defaultMessage="{count} {count, plural, =1 {entry} other {entries}}"
              values={{ count: notes?.length ?? 0 }}
            />
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
            onPress={() => createNote({ content: noteContent, id: book.record?.id ?? '' })}
            isProcessing={isCreatingNote}
          >
            <FormattedMessage defaultMessage="add note" />
          </Button>
        </div>
        <ol className={noteList}>
          {notes?.map((note) => (
            <li key={note.id} className={noteListItem}>
              <div className={noteDate}>{formatLongDate(note.createdAt)}</div>
              <pre className={renderedNote}>{note.content}</pre>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
