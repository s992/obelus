import type { Maybe } from '@obelus/shared/types';
import dayjs from 'dayjs';
import { useIntl } from 'react-intl';

export function useFormatPublishYear() {
  const intl = useIntl();
  const placeholder = intl.formatMessage({ defaultMessage: 'N/A' });

  return (date: Maybe<string>) => {
    if (!date) {
      return placeholder;
    }

    const publishDate = dayjs(date, 'YYYY-MM-DD');

    return publishDate.isValid() ? publishDate.format('YYYY') : placeholder;
  };
}
