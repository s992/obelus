import { InputBase as GeneratedInputBase } from "@/generated/components/base/input/input";
import type { InputHTMLAttributes } from "react";

export type InputBaseProps = InputHTMLAttributes<HTMLInputElement> & {
  wrapperClassName?: string;
  inputClassName?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
};

export const InputBase = (props: InputBaseProps) => {
  return <GeneratedInputBase {...(props as Record<string, unknown>)} />;
};
