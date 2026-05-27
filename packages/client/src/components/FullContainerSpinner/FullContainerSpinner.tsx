import { LoadingSpinner } from '@/components/LoadingSpinner';

import { container } from './fullContainerSpinner.css';

export function FullContainerSpinner() {
  return (
    <div className={container}>
      <LoadingSpinner size="xlarge" />
    </div>
  );
}
