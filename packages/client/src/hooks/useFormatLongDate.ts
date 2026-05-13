import type { Maybe } from '@obelus/shared/types';
import dayjs from 'dayjs';
import { useIntl } from 'react-intl';

export function useFormatLongDate() {
  const intl = useIntl();
  const placeholder = intl.formatMessage({ defaultMessage: 'N/A' });

  return (date: Maybe<string>) => {
    if (!date) {
      return placeholder;
    }

    const publishDate = dayjs(date);

    return publishDate.isValid() ? publishDate.format('D MMM YYYY').toLocaleLowerCase() : placeholder;
  };
}
