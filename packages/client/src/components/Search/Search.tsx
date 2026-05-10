import clsx from 'clsx';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input, TextField, type TextFieldProps } from 'react-aria-components';
import { useIntl } from 'react-intl';

import { IconButton } from '../IconButton';
import { icon, input, wrapper } from './search.css';

type Props = {
  label: string;
  value: string;
  onChange: (value: string) => void;
} & TextFieldProps;

export function Search({ label, className, ...rest }: Props) {
  const intl = useIntl();
  const { value, onChange } = rest;

  return (
    <TextField {...rest} className={clsx(wrapper, className)}>
      <SearchIcon className={icon} />
      <Input placeholder={label} className={input} />
      {!!value && (
        <IconButton
          aria-label={intl.formatMessage({ defaultMessage: 'Clear search input' })}
          variant="tertiary"
          onPress={() => onChange('')}
        >
          <X className={icon} />
        </IconButton>
      )}
    </TextField>
  );
}
