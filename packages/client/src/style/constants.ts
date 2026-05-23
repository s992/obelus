export const BOOK_COVER_SMALL_WIDTH = '56px';
export const BOOK_COVER_MEDIUM_WIDTH = '72px';
export const BOOK_COVER_LARGE_WIDTH = '132px';
export const BOOK_COVER_XLARGE_WIDTH = '180px';

const BREAKPOINT_MOBILE = 640;
const BREAKPOINT_TABLET = 800;
const BREAKPOINT_SEARCH = 900;

export const mediaQuery = {
  mobile: `(max-width: ${BREAKPOINT_MOBILE}px)`,
  mobileUp: `(min-width: ${BREAKPOINT_MOBILE + 1}px)`,
  tablet: `(max-width: ${BREAKPOINT_TABLET}px)`,
  search: `(max-width: ${BREAKPOINT_SEARCH}px)`,
} as const;
