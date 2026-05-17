import { CalendarDate, getLocalTimeZone } from '@internationalized/date';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Calendar as AriaCalendar, CalendarCell, CalendarGrid, type CalendarProps } from 'react-aria-components';

import { IconButton } from '../IconButton';
import { calendar, calendarGrid, currentMonthYear, header, headerButtonsContainer, month, year } from './calendar.css';

type Props = {} & CalendarProps<CalendarDate>;

export function Calendar({ className, ...props }: Props) {
  const tz = getLocalTimeZone();

  return (
    <AriaCalendar className={clsx(calendar, className)} {...props}>
      {({ state }) => (
        <>
          <header className={header}>
            <div className={currentMonthYear}>
              <span className={month}>
                {state.visibleRange.start.toDate(tz).toLocaleDateString('en-US', { month: 'long' })}
              </span>
              <span className={year}>{state.visibleRange.start.year}</span>
            </div>
            <div className={headerButtonsContainer}>
              <IconButton slot="previous" aria-label="Previous month" variant="secondary">
                <ChevronLeft />
              </IconButton>
              <IconButton slot="next" aria-label="Next month" variant="secondary">
                <ChevronRight />
              </IconButton>
            </div>
          </header>
          <CalendarGrid className={calendarGrid} weekdayStyle="short">
            {(date) => <CalendarCell date={date} />}
          </CalendarGrid>
        </>
      )}
    </AriaCalendar>
  );
}
