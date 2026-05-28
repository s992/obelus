import { FormattedMessage, useIntl } from 'react-intl';

import { Button } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { typography } from '@/style';

import { code, modalFooter } from './imports.css';

type Props = {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HelpModal({ isOpen, onOpenChange }: Props) {
  const intl = useIntl();

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      isDismissable
      label={intl.formatMessage({ defaultMessage: 'CSV Formatting/Import Help' })}
    >
      <p className={typography.body}>
        <FormattedMessage
          defaultMessage="The CSV columns Obelus looks for are: <code>Book Id</code>, <code>Title</code>, <code>Author</code>, <code>ISBN</code>, <code>ISBN13</code>, <code>My Rating</code>, <code>Date Added</code>, <code>Date Read</code>, and <code>Exclusive Shelf</code>. The only ones that are strictly required are <code>Book Id</code> and <code>Title</code>, but you'll have more success if an ISBN is provided."
          values={{
            code: (chunks) => <code className={code}>{chunks}</code>,
          }}
        />
      </p>
      <p className={typography.body}>
        <FormattedMessage
          defaultMessage="Book statuses are presumed to be finished unless the book's <code>Exclusive Shelf</code> is <code>currently-reading</code> or <code>to-read</code>, which are mapped to reading and planned statuses, respectively."
          values={{
            code: (chunks) => <code className={code}>{chunks}</code>,
          }}
        />
      </p>
      <p className={typography.body}>
        <FormattedMessage defaultMessage="Ratings are mapped to judgments like this:" />
      </p>
      <ul className={typography.body}>
        <li>
          <FormattedMessage defaultMessage="{rating}: accepted" values={{ rating: 5 }} />
        </li>
        <li>
          <FormattedMessage defaultMessage="{rating}: accepted" values={{ rating: 4 }} />
        </li>
        <li>
          <FormattedMessage defaultMessage="{rating}: mixed" values={{ rating: 3 }} />
        </li>
        <li>
          <FormattedMessage defaultMessage="{rating}: rejected" values={{ rating: 2 }} />
        </li>
        <li>
          <FormattedMessage defaultMessage="{rating}: rejected" values={{ rating: 1 }} />
        </li>
        <li>
          <FormattedMessage defaultMessage="No rating: unjudged" values={{ rating: 1 }} />
        </li>
      </ul>
      <div className={modalFooter}>
        <Button slot="close">
          <FormattedMessage defaultMessage="Close" />
        </Button>
      </div>
    </Modal>
  );
}
