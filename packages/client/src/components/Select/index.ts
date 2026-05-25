import { ListBoxItem } from './ListBoxItem';
import { Select as BaseSelect } from './Select';

export const Select = Object.assign(BaseSelect, {
  Item: ListBoxItem,
});
