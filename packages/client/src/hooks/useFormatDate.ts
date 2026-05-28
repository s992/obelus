import dayjs from 'dayjs';
import { useIntl } from 'react-intl';

import type { Maybe } from '@obelus/shared/types';

export function useFormatDate(format: string, parseFormat?: string, lowercase: boolean = true) {
  const intl = useIntl();
  const placeholder = intl.formatMessage({ defaultMessage: 'N/A' });

  return (date: Maybe<string>) => {
    if (!date) {
      return placeholder;
    }

    const parsed = dayjs(date, parseFormat);

    if (parsed.isValid()) {
      const formatted = parsed.format(format);
      return lowercase ? formatted.toLocaleLowerCase() : formatted;
    }

    return placeholder;
  };
}
