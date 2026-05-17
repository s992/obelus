import type { Maybe } from '@obelus/shared/types';
import dayjs from 'dayjs';
import { useIntl } from 'react-intl';

export function useFormatDate(format: string) {
  const intl = useIntl();
  const placeholder = intl.formatMessage({ defaultMessage: 'N/A' });

  return (date: Maybe<string>) => {
    if (!date) {
      return placeholder;
    }

    const parsed = dayjs(date);

    return parsed.isValid() ? parsed.format(format).toLocaleLowerCase() : placeholder;
  };
}
