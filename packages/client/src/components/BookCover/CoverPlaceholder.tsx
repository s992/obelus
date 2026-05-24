import clsx from 'clsx';
import { useIntl } from 'react-intl';

import { author as authorCss, cover, placeholderCover, title as titleCss } from './bookCover.css';

type Props = {
  title: string;
  author: string;
  size?: keyof typeof cover;
};

export function CoverPlaceholder({ title, author, size = 'medium' }: Props) {
  const intl = useIntl();

  return (
    <div
      className={clsx(cover[size], placeholderCover)}
      aria-label={intl.formatMessage({ defaultMessage: 'Placeholder book cover for {title}' }, { title })}
      role="img"
    >
      <div className={titleCss[size]}>{title}</div>
      <div className={authorCss[size]}>{author}</div>
    </div>
  );
}
