import { author as authorCss, cover, title as titleCss } from './coverPlaceholder.css';

type Props = {
  title: string;
  author: string;
  size?: keyof typeof cover;
};

export function CoverPlaceholder({ title, author, size = 'default' }: Props) {
  return (
    <div className={cover[size]}>
      <div className={titleCss}>{title}</div>
      <div className={authorCss}>{author}</div>
    </div>
  );
}
