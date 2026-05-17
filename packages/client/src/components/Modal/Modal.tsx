import type { ReactNode } from 'react';
import { Modal as AriaModal, Dialog, type ModalOverlayProps } from 'react-aria-components';

import { modal } from './modal.css';

type Props = {
  children: ReactNode;
  label: string;
} & ModalOverlayProps;

export function Modal({ children, label, ...props }: Props) {
  return (
    <AriaModal className={modal} {...props}>
      <Dialog aria-label={label}>{children}</Dialog>
    </AriaModal>
  );
}
