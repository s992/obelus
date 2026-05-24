import { LoadingSpinner } from '@/components/LoadingSpinner';

import { container } from './fullPageSpinner.css';

export function FullPageSpinner() {
  return (
    <div className={container}>
      <LoadingSpinner size="xlarge" />
    </div>
  );
}
