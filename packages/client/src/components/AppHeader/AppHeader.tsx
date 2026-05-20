import { Link } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { brand, headerContainer, obelusMark } from './appHeader.css';

type Props = {
  children?: ReactNode;
};

export function AppHeader({ children }: Props) {
  return (
    <header className={headerContainer}>
      <Link className={brand} to="/">
        <span className={obelusMark}>÷</span>
        <span>Obelus</span>
      </Link>
      {children}
    </header>
  );
}
