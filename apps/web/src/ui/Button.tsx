import { Button as GeneratedButton } from "@/generated/components/base/buttons/button";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Color =
  | "primary"
  | "secondary"
  | "tertiary"
  | "link-gray"
  | "link-color"
  | "primary-destructive"
  | "secondary-destructive"
  | "tertiary-destructive"
  | "link-destructive";

type Size = "sm" | "md" | "lg" | "xl";

export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "color"> & {
  color?: Color;
  size?: Size;
  isDisabled?: boolean;
  isLoading?: boolean;
  children?: ReactNode;
};

export const Button = ({ isDisabled, ...props }: ButtonProps) => {
  return <GeneratedButton {...(props as Record<string, unknown>)} isDisabled={isDisabled} />;
};
