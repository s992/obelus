import { mergeProps } from '@react-aria/utils';
import type { ReactNode } from 'react';
import {
  Radio as AriaRadio,
  RadioGroup as AriaRadioGroup,
  composeRenderProps,
  Label,
  type RadioGroupProps,
  type RadioProps,
} from 'react-aria-components';

import { ValidationErrorList } from '@/components/ValidationErrorList';
import { useFieldContext } from '@/form';
import { typography } from '@/style';

import { radio, radioGroup, radioLabel } from './radioGroup.css';

type Option = {
  value: string;
  label: ReactNode;
};

type Props = {
  label: string;
  options: Option[];
} & RadioGroupProps;

export function RadioGroup({ className, options, ...rest }: Props) {
  const { label } = rest;
  const field = useFieldContext<string>();
  const props = mergeProps(rest, {
    onChange: field.handleChange,
    value: field.state.value,
    defaultValue: field.state.value,
    name: field.name,
  });
  const hasError = field.state.meta.isBlurred && !field.state.meta.isValid;

  return (
    <AriaRadioGroup className={className} {...props}>
      <Label className={typography.uppercaseLabel}>{label}</Label>
      <div className={radioGroup}>
        {options.map((opt) => (
          <Radio key={opt.value} value={opt.value}>
            {opt.label}
          </Radio>
        ))}
      </div>
      {hasError && <ValidationErrorList errors={field.state.meta.errors.map((error) => error.message)} />}
    </AriaRadioGroup>
  );
}

function Radio(props: RadioProps) {
  return (
    <AriaRadio {...props} className={radioLabel}>
      {composeRenderProps(props.children, (children) => (
        <>
          <div className={radio} />
          {children}
        </>
      ))}
    </AriaRadio>
  );
}
