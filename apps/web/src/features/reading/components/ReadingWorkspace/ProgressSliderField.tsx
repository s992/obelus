import { useEffect, useState } from "react";
import * as styles from "./ProgressSliderField.css";

export type ProgressSliderFieldProps = {
  id: string;
  initialValue: number;
  errorId?: string;
  isInvalid: boolean;
  onCommit: (value: number) => void;
};

export const ProgressSliderField = ({
  id,
  initialValue,
  errorId,
  isInvalid,
  onCommit,
}: ProgressSliderFieldProps) => {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const commitValue = (nextValue: number) => {
    onCommit(nextValue);
  };

  return (
    <div className={styles.fieldStack}>
      <div className={styles.labelRow}>
        <label className={styles.fieldLabel} htmlFor={id}>
          Progress
        </label>
        <output className={styles.valueBadge} aria-live="off">
          {value}%
        </output>
      </div>
      <input
        className={styles.slider}
        id={id}
        type="range"
        aria-invalid={isInvalid}
        aria-describedby={errorId}
        aria-valuetext={`${value}%`}
        min={0}
        max={100}
        step={1}
        value={value}
        onChange={(event) => setValue(Number(event.currentTarget.value))}
        onPointerUp={() => commitValue(value)}
        onKeyUp={() => commitValue(value)}
        onBlur={() => commitValue(value)}
      />
    </div>
  );
};
