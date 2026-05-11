import { spinner } from './loadingSpinner.css';
import Spinner from './loadingSpinner.svg?react';

type Props = {
  size: keyof typeof spinner;
};

export function LoadingSpinner({ size = 'small' }: Props) {
  return <Spinner className={spinner[size]} />;
}
