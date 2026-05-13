import type { Book } from '@obelus/shared/types';
import dayjs from 'dayjs';
import { useRef } from 'react';
import { usePress } from 'react-aria/usePress';
import { TextArea } from 'react-aria-components';
import { FormattedMessage } from 'react-intl';

import { Button } from '../../components/Button';
import { judgment as judgmentCss, typography } from '../../style';
import {
  addNoteButton,
  entryCount,
  noteTextAreaContainer,
  recordContainer,
  sectionHeader,
  textArea,
} from './bookDetail.css';

type Props = {
  book: Book;
};

export function RecordContent({ book }: Props) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { pressProps: textAreaContainerPressProps } = usePress({
    onPress: () => textAreaRef.current?.focus(),
  });
  const { record } = book;
  const updateDate = dayjs(record?.updatedAt);
  const formattedUpdateDate = updateDate.isValid() ? (
    updateDate.format('D MMM YYYY').toLocaleLowerCase()
  ) : (
    <FormattedMessage defaultMessage="N/A" />
  );
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
        <div className={noteTextAreaContainer} {...textAreaContainerPressProps}>
          <TextArea
            ref={textAreaRef}
            className={textArea}
            rows={3}
            placeholder="Add a note. It will not be edited; notes are appended below."
          />
          <Button className={addNoteButton}>add note</Button>
        </div>
      </div>
    </div>
  );
}
