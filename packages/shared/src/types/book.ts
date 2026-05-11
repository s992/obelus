import type { Series } from './series';
import type { Maybe } from './utility';

export type Book = {
  id: Maybe<number>;
  author: Maybe<string>;
  coverImage: Maybe<string>;
  description: Maybe<string>;
  pages: Maybe<number>;
  releaseDate: Maybe<string>;
  series: Maybe<Series>;
  subTitle: Maybe<string>;
  title: Maybe<string>;
};
