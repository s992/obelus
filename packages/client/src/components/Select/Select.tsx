import clsx from 'clsx';
import { ChevronDown } from 'lucide-react';
import { type ReactNode } from 'react';
import { Select as AriaSelect, Button, type SelectProps } from 'react-aria-components';

import { Label } from '../Label';
import { Popover } from '../Popover';
import { ValidationErrorList } from '../ValidationErrorList';
import { ListBox } from './ListBox';
import { button, chevron, popover } from './select.css';

type Props<T extends object> = {
  children: ReactNode | ((item: T) => ReactNode);
  buttonValue: ReactNode;
  variant?: keyof typeof button;
  items?: Iterable<T>;
  label?: ReactNode;
  hasError?: boolean;
  errors?: string[];
} & Omit<SelectProps<T>, 'children'>;

export function Select<T extends object>({
  children,
  buttonValue,
  variant = 'default',
  items,
  label,
  hasError,
  errors,
  className,
  ...rest
}: Props<T>) {
  return (
    <AriaSelect {...rest} className={clsx(className)}>
      {label && <Label hasError={hasError}>{label}</Label>}
      <Button className={button[variant]}>
        {buttonValue}
        <ChevronDown className={chevron[variant]} />
      </Button>
      {hasError && errors && <ValidationErrorList errors={errors} />}
      <Popover className={popover}>
        <ListBox items={items}>{children}</ListBox>
      </Popover>
    </AriaSelect>
  );
}
