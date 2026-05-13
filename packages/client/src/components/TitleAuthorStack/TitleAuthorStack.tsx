import type { Maybe } from '@obelus/shared/types';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';

import { typography } from '../../style';
import { text } from './titleAuthorStack.css';

type Props = {
  title: Maybe<string>;
  author: Maybe<string>;
};

export function TitleAuthorStack({ title, author }: Props) {
  const placeholder = <FormattedMessage defaultMessage="N/A" />;

  return (
    <>
      <span className={clsx(text, typography.bookTitle)}>{title || placeholder}</span>
      <span className={clsx(text, typography.author)}>{author || placeholder}</span>
    </>
  );
}
