import type { Maybe } from '@obelus/shared/types';
import dayjs from 'dayjs';
import { useIntl } from 'react-intl';

export function useFormatDateDistance() {
  const intl = useIntl();
  const placeholder = intl.formatMessage({ defaultMessage: 'N/A' });

  return (date: Maybe<string>) => {
    if (!date) {
      return placeholder;
    }

    const parsed = dayjs(date);

    if (!parsed.isValid()) {
      return placeholder;
    }

    const now = dayjs();
    const days = Math.abs(now.diff(parsed, 'day'));

    if (days <= 13) {
      return intl.formatMessage({ defaultMessage: '{days} days' }, { days });
    }

    const weeks = Math.round(days / 7);

    if (weeks <= 11) {
      return intl.formatMessage({ defaultMessage: '{weeks} wks' }, { weeks });
    }

    const months = Math.round(days / 30);

    if (months <= 11) {
      return intl.formatMessage({ defaultMessage: '{months} mos' }, { months });
    }

    const years = Math.round(days / 365);

    return intl.formatMessage({ defaultMessage: '{years} yrs' }, { years });
  };
}
