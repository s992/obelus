import type { ReactNode } from 'react';

import { useForm } from '../../form/useForm';

type Props = {
  defaultValues?: Record<string, unknown>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (form: any) => ReactNode;
};

export function FormDecorator({ defaultValues = {}, children }: Props) {
  const form = useForm({
    defaultValues,
    onSubmit: () => {
      // no-op for stories
    },
  });

  return <>{children(form)}</>;
}
