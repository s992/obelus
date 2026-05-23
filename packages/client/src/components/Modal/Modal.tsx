import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Modal as AriaModal, Dialog, type ModalOverlayProps } from 'react-aria-components';

import { modal } from './modal.css';

type Props = {
  children: ReactNode;
  label: string;
  className?: string;
} & ModalOverlayProps;

export function Modal({ children, label, className, ...props }: Props) {
  return (
    <AriaModal className={clsx(modal, className)} {...props}>
      <Dialog aria-label={label}>{children}</Dialog>
    </AriaModal>
  );
}
