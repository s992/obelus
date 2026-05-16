import { flex } from '../../style';
import { LoadingSpinner } from '../LoadingSpinner';

export function FullPageSpinner() {
  return (
    <div className={flex.center}>
      <LoadingSpinner size="xlarge" />
    </div>
  );
}
