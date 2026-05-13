import { Dialog, Modal } from 'react-aria-components';
import { useIntl } from 'react-intl';

import { BookSearch } from './BookSearch';
import { modal } from './searchModal.css';

type Props = {
  onClose?: () => void;
};

export function SearchModal({ onClose }: Props) {
  const intl = useIntl();

  return (
    <Modal
      defaultOpen
      isDismissable
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose?.();
        }
      }}
      className={modal}
    >
      <Dialog aria-label={intl.formatMessage({ defaultMessage: 'Search' })}>
        <BookSearch />
      </Dialog>
    </Modal>
  );
}
