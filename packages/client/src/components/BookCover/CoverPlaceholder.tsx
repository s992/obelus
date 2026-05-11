import clsx from 'clsx';

import { author as authorCss, cover, placeholderCover, title as titleCss } from './coverPlaceholder.css';

type Props = {
  title: string;
  author: string;
  size?: keyof typeof cover;
};

export function CoverPlaceholder({ title, author, size = 'medium' }: Props) {
  return (
    <div className={clsx(cover[size], placeholderCover)}>
      <div className={titleCss}>{title}</div>
      <div className={authorCss}>{author}</div>
    </div>
  );
}
