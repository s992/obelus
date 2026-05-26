import { useEffect, useState } from 'react';

import { spinner } from './loadingSpinner.css';
import Spinner from './loadingSpinner.svg?react';

type Props = {
  size: keyof typeof spinner;
};

export function LoadingSpinner({ size = 'small' }: Props) {
  const [shouldDisplay, setShouldDisplay] = useState(false);

  // delay visibility so we don't flicker on fast connections
  useEffect(() => {
    const timer = setTimeout(() => {
      setShouldDisplay(true);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  return shouldDisplay ? <Spinner className={spinner[size]} /> : null;
}
