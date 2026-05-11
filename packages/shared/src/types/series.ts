import { Maybe } from './utility';

export type Series = {
  id: Maybe<number>;
  name: Maybe<string>;
  position: Maybe<number>;
  bookCount: Maybe<number>;
};
