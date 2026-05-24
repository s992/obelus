import { useIntl } from 'react-intl';

import { Modal } from '@/components/Modal';

import { BookSearch } from './BookSearch';
import { modal } from './searchModal.css';

type Props = {
  onClose?: () => void;
};

export function SearchModal({ onClose }: Props) {
  const intl = useIntl();

  return (
    <Modal
      className={modal}
      defaultOpen
      isDismissable
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose?.();
        }
      }}
      label={intl.formatMessage({ defaultMessage: 'Search' })}
    >
      <BookSearch />
    </Modal>
  );
}
