import { ListBox as AriaListBox, type ListBoxProps } from 'react-aria-components';

type Props<T extends object> = {} & ListBoxProps<T>;

export function ListBox<T extends object>({ children, ...rest }: Props<T>) {
  return <AriaListBox {...rest}>{children}</AriaListBox>;
}
