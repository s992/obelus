import { composeRenderProps, ListBoxItem as AriaListBoxItem, type ListBoxItemProps, Text } from 'react-aria-components';

import { listBoxItem } from './select.css';

type Props = {} & ListBoxItemProps;

export function ListBoxItem({ textValue, children, ...rest }: Props) {
  const actualTextValue = textValue || (typeof children === 'string' ? children : undefined);

  return (
    <AriaListBoxItem {...rest} textValue={actualTextValue} className={listBoxItem}>
      {composeRenderProps(children, () => (
        <>{typeof children === 'string' ? <Text slot="label">{children}</Text> : children}</>
      ))}
    </AriaListBoxItem>
  );
}
