import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import type { Maybe } from '@obelus/shared/types';
import { mergeProps } from '@react-aria/utils';
import clsx from 'clsx';
import { Calendar as CalendarIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
  DatePicker as AriaDatePicker,
  DateField,
  DateInput,
  type DatePickerProps,
  DateSegment,
  Group,
} from 'react-aria-components';

import { Calendar } from '@/components/Calendar';
import { IconButton } from '@/components/IconButton';
import { Label } from '@/components/Label';
import { Popover } from '@/components/Popover';
import { ValidationErrorList } from '@/components/ValidationErrorList';
import { useFieldContext } from '@/form';

import { button, dateSegment, field as fieldCss, input } from './datePicker.css';

type Props = {
  label: ReactNode;
} & DatePickerProps<CalendarDate>;

export function DatePicker({ className, label, ...rest }: Props) {
  const tz = getLocalTimeZone();
  const field = useFieldContext<Date>();
  const value = dateToCalendarDate(field.state.value);
  const props = mergeProps(rest, {
    onBlur: field.handleBlur,
    onChange: (value: CalendarDate) => {
      field.handleChange(value.toDate(tz));
    },
    value,
  });
  const hasError = field.state.meta.isBlurred && !field.state.meta.isValid;

  return (
    <AriaDatePicker className={clsx(className)} {...props}>
      <Label>{label}</Label>
      <Group>
        <DateField className={fieldCss}>
          <DateInput className={input}>
            {(segment) => <DateSegment className={dateSegment} segment={segment} />}
          </DateInput>
          <IconButton className={button} variant="tertiary" aria-label="expand">
            <CalendarIcon />
          </IconButton>
          {hasError && <ValidationErrorList errors={field.state.meta.errors.map((error) => error.message)} />}
        </DateField>
      </Group>
      <Popover>
        <Calendar />
      </Popover>
    </AriaDatePicker>
  );
}

function dateToCalendarDate(date: Maybe<Date>): CalendarDate | null {
  if (!date) {
    return null;
  }

  return new CalendarDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}
