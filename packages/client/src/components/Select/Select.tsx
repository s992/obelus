import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { type ReactNode } from 'react';
import { Select as AriaSelect, Button, SelectValue, type SelectProps } from 'react-aria-components';
import { mergeProps } from 'react-aria/mergeProps';

import { useFieldContext } from '@/form';

import { Label } from '../Label';
import { Popover } from '../Popover';
import { ValidationErrorList } from '../ValidationErrorList';
import { ListBox } from './ListBox';
import { button, chevron, popover } from './select.css';

type Props<T extends object> = {
  label: ReactNode;
  children: ReactNode | ((item: T) => ReactNode);
  items?: Iterable<T>;
} & Omit<SelectProps<T>, 'children'>;

export function Select<T extends object>({ label, className, items, children, ...rest }: Props<T>) {
  const field = useFieldContext<string>();
  const props = mergeProps(rest, {
    onBlur: field.handleBlur,
    onChange: field.handleChange,
    value: field.state.value,
  });
  const hasError = field.state.meta.isBlurred && !field.state.meta.isValid;

  return (
    <AriaSelect {...props} className={clsx(className)}>
      <Label hasError={hasError}>{label}</Label>
      <Button className={button}>
        <SelectValue />
        <ChevronDown className={chevron} />
      </Button>
      {hasError && <ValidationErrorList errors={field.state.meta.errors.map((error) => error.message)} />}
      <Popover className={popover}>
        <ListBox items={items}>{children}</ListBox>
      </Popover>
    </AriaSelect>
  );
}
