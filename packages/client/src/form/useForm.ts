import { createFormHook } from '@tanstack/react-form';

import { DatePicker } from '@/components/DatePicker';
import { Form } from '@/components/Form';
import { RadioGroup } from '@/components/RadioGroup';
import { SelectField } from '@/components/SelectField';
import { TextField } from '@/components/TextField';

import { fieldContext, formContext } from './context';

export const { useAppForm: useForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, DatePicker, RadioGroup, Select: SelectField },
  formComponents: { Form },
});
