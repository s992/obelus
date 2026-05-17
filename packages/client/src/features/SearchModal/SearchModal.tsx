import { useIntl } from 'react-intl';

import { Modal } from '../../components/Modal';
import { BookSearch } from './BookSearch';

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
      label={intl.formatMessage({ defaultMessage: 'Search' })}
    >
      <BookSearch />
    </Modal>
  );
}
