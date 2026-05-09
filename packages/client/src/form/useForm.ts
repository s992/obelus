import { createFormHook } from '@tanstack/react-form';

import { Form } from '../components/Form';
import { TextField } from '../components/TextField';
import { fieldContext, formContext } from './context';

export const { useAppForm: useForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField },
  formComponents: { Form },
});
