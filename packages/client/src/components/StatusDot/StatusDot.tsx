import { statusDot } from './statusDot.css';

type Props = {
  variant?: keyof typeof statusDot;
};

export function StatusDot({ variant = 'currentColor' }: Props) {
  return <span className={statusDot[variant]} />;
}
