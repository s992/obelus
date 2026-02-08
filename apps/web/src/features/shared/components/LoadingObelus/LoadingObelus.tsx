import { loadingObelus, loadingState, loadingStateCompact, loadingText } from "./LoadingObelus.css";

export const LoadingObelus = ({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) => (
  <div className={compact ? loadingStateCompact : loadingState}>
    <p className={loadingObelus}>÷</p>
    <p className={loadingText}>{label}</p>
  </div>
);
