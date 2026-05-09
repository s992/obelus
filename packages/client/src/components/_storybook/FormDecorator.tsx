import type { ReactNode } from 'react';

import { useForm } from '../../form/useForm';

type Props = {
  defaultValues?: Record<string, unknown>;
  children: (form: ReturnType<typeof useForm>) => ReactNode;
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
