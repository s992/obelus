import clsx from 'clsx';
import { Moon, Sun } from 'lucide-react';
import { Switch } from 'react-aria-components';
import { useIntl } from 'react-intl';

import { darkPosition, thumb, toggle, track } from './themeToggle.css';

export type Theme = 'light' | 'dark';

type Props = {
  currentTheme: Theme;
  onChange: (theme: Theme) => void;
};

const ICON_PROPS = {
  size: 14,
  strokeWidth: 2.5,
};

export function ThemeToggle({ currentTheme, onChange }: Props) {
  const intl = useIntl();
  const isDark = currentTheme === 'dark';

  return (
    <Switch
      className={toggle}
      isSelected={isDark}
      onChange={(selected) => onChange(selected ? 'dark' : 'light')}
      aria-label={intl.formatMessage({ defaultMessage: 'Toggle theme' })}
    >
      <div className={track}>
        <div className={clsx(thumb, { [darkPosition]: isDark })}>
          {isDark ? <Moon {...ICON_PROPS} /> : <Sun {...ICON_PROPS} />}
        </div>
      </div>
    </Switch>
  );
}
