import type { ReactNode } from 'react';
import { FormattedMessage } from 'react-intl';

import { typography } from '../../../style';
import { header, title as titleCss } from './listHeader.css';

type Props = {
  title: ReactNode;
  count: number;
  children?: ReactNode;
};

export function ListHeader({ title, count, children }: Props) {
  return (
    <header className={header}>
      <div className={titleCss}>
        <h1 className={typography.display}>{title}</h1>
        <span className={typography.uppercaseLabel}>
          <FormattedMessage defaultMessage="{count} entries" values={{ count }} />
        </span>
      </div>
      {children}
    </header>
  );
}
