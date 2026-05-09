import { mergeProps } from '@react-aria/utils';
import clsx from 'clsx';
import type { ReactNode } from 'react';
import { TextField as AriaTextField, Input, type TextFieldProps } from 'react-aria-components';

import { useFieldContext } from '../../form';
import { formRow } from '../../style';
import { Label } from '../Label';
import { ValidationErrorList } from '../ValidationErrorList';
import { input } from './textField.css';

type Props = {
  label: ReactNode;
} & TextFieldProps;

export function TextField({ className, label, ...rest }: Props) {
  const field = useFieldContext<string>();
  const props = mergeProps(rest, {
    onBlur: field.handleBlur,
    onChange: field.handleChange,
    value: field.state.value,
  });
  const hasError = field.state.meta.isBlurred && !field.state.meta.isValid;

  return (
    <AriaTextField {...props} className={clsx(className, formRow)}>
      <Label hasError={hasError}>{label}</Label>
      <Input className={clsx({ [input.default]: !hasError, [input.error]: hasError })} />
      {hasError && <ValidationErrorList errors={field.state.meta.errors.map((error) => error.message)} />}
    </AriaTextField>
  );
}
