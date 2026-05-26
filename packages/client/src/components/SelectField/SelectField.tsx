import { type ReactNode } from 'react';
import { SelectValue, type SelectProps } from 'react-aria-components';
import { mergeProps } from 'react-aria/mergeProps';

import { Select } from '@/components/Select';
import { useFieldContext } from '@/form';

type Props<T extends object> = {
  label: ReactNode;
  children: ReactNode | ((item: T) => ReactNode);
  items?: Iterable<T>;
} & Omit<SelectProps<T>, 'children'>;

export function SelectField<T extends object>(props: Props<T>) {
  const field = useFieldContext<string>();
  const mergedProps = mergeProps(props, {
    onBlur: field.handleBlur,
    onChange: field.handleChange,
    value: field.state.value,
  });
  const hasError = field.state.meta.isBlurred && !field.state.meta.isValid;

  return (
    <Select
      {...mergedProps}
      buttonValue={<SelectValue />}
      hasError={hasError}
      errors={field.state.meta.errors.map((error) => error.message)}
    />
  );
}
