import clsx from 'clsx';
import { Form as AriaForm, type FormProps } from 'react-aria-components';

import { useFormContext } from '../../form';
import { form } from './form.css';

type Props = {
  variant?: keyof typeof form;
} & Omit<FormProps, 'action'>;

export function Form({ className, variant = 'stacked', ...rest }: Props) {
  const formCtx = useFormContext();

  return (
    <AriaForm
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        formCtx.handleSubmit();
      }}
      className={clsx(form[variant], className)}
      {...rest}
    />
  );
}
