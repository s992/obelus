import type { Status } from '@obelus/shared/types';

type Props = {
  status: Status;
};

export function PublicBookList({ status }: Props) {
  return <>{status}: TODO</>;
}
