import type { CalendarDate } from '@internationalized/date';
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

import { Calendar } from '../Calendar';
import { IconButton } from '../IconButton';
import { Label } from '../Label';
import { Popover } from '../Popover';
import { button, dateSegment, field, input } from './datePicker.css';

type Props = {
  label: ReactNode;
} & DatePickerProps<CalendarDate>;

export function DatePicker({ className, label, ...props }: Props) {
  return (
    <AriaDatePicker className={clsx(className)} {...props}>
      <Label>{label}</Label>
      <Group>
        <DateField className={field}>
          <DateInput className={input}>
            {(segment) => <DateSegment className={dateSegment} segment={segment} />}
          </DateInput>
          <IconButton className={button} variant="tertiary" aria-label="expand">
            <CalendarIcon />
          </IconButton>
        </DateField>
      </Group>
      <Popover>
        <Calendar />
      </Popover>
    </AriaDatePicker>
  );
}
