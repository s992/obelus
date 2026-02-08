import { TextAreaBase as GeneratedTextAreaBase } from "@/generated/components/base/textarea/textarea";
import type { TextareaHTMLAttributes } from "react";

export type TextAreaBaseProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  className?: string;
};

export const TextAreaBase = (props: TextAreaBaseProps) => {
  return <GeneratedTextAreaBase {...(props as Record<string, unknown>)} />;
};
