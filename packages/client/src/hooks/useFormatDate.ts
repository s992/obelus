import dayjs from 'dayjs';
import { useIntl } from 'react-intl';

import type { Maybe } from '@obelus/shared/types';

export function useFormatDate(format: string, parseFormat?: string) {
  const intl = useIntl();
  const placeholder = intl.formatMessage({ defaultMessage: 'N/A' });

  return (date: Maybe<string>) => {
    if (!date) {
      return placeholder;
    }

    const parsed = dayjs(date, parseFormat);

    return parsed.isValid() ? parsed.format(format).toLocaleLowerCase() : placeholder;
  };
}
