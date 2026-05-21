import type { Book, Maybe, NoteJson } from '@obelus/shared/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { DialogTrigger, Heading, TextArea } from 'react-aria-components';
import { useHotkeys } from 'react-hotkeys-hook';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '../../client';
import { Button } from '../../components/Button';
import { Modal } from '../../components/Modal';
import { showMutationError } from '../../components/Toast';
import { useFormatLongDate } from '../../hooks/useFormatLongDate';
import { judgment as judgmentCss, typography } from '../../style';
import {
  addNoteButton,
  confirmModalButtons,
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
  const invalidate = async () => {
    await queryClient.invalidateQueries({ queryKey: trpc.note.list.queryKey({ id: book.record?.id ?? '' }) });
    await queryClient.invalidateQueries({ queryKey: trpc.book.byId.queryKey({ id: book.id }) });
  };
  const { mutate: createNote, isPending: isCreatingNote } = useMutation(
    trpc.note.create.mutationOptions({
      onSuccess: async () => {
        await invalidate();
        setNoteContent('');
      },
      onError: () => {
        showMutationError(intl, intl.formatMessage({ defaultMessage: 'Failed to create note' }));
      },
    }),
  );
  const { mutate: deleteRecord, isPending: isDeleting } = useMutation(
    trpc.record.delete.mutationOptions({
      onSuccess: async () => {
        await invalidate();
      },
      onError: () => {
        showMutationError(intl, intl.formatMessage({ defaultMessage: 'Failed to delete record' }));
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

  if (!record) {
    return null;
  }

  return (
    <div className={recordContainer}>
      <div>
        <div className={sectionHeader}>
          <h2 className={typography.uppercaseLabel}>
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
          <h2 className={typography.uppercaseLabel}>
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
      <div>
        <div className={sectionHeader}>
          <h2 className={typography.uppercaseLabel}>
            <FormattedMessage defaultMessage="danger" />
          </h2>
          <AlertCircle height={16} />
        </div>
        <DialogTrigger>
          <Button isProcessing={isDeleting}>
            <FormattedMessage defaultMessage="Delete Record" />
          </Button>
          <Modal label={intl.formatMessage({ defaultMessage: 'Delete record confirmation' })}>
            <Heading slot="title" className={typography.h1}>
              <FormattedMessage defaultMessage="Delete Record" />
            </Heading>
            <p className={typography.body}>
              <FormattedMessage
                defaultMessage="Are you sure you want to permanently delete your reading record for {title}? All notes will also be permanently deleted."
                values={{ title: book.title }}
              />
            </p>
            <div className={confirmModalButtons}>
              <Button slot="close" variant="secondary">
                <FormattedMessage defaultMessage="Cancel" />
              </Button>
              <Button slot="close" onPress={() => deleteRecord({ id: record.id })}>
                <FormattedMessage defaultMessage="Delete Record" />
              </Button>
            </div>
          </Modal>
        </DialogTrigger>
      </div>
    </div>
  );
}
