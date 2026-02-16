import type { BookDetail } from "@obelus/shared";

export type SeriesLinkData = {
  seriesId: number;
  text: string;
};

export const buildSeriesLinkData = (
  detail: BookDetail | null | undefined,
): SeriesLinkData | null => {
  if (!detail) {
    return null;
  }

  if (!detail.seriesId || !detail.seriesName || detail.seriesPosition == null) {
    return null;
  }

  const totalBooks = detail.seriesTotalBooks ?? detail.seriesBooks.length;
  if (!totalBooks) {
    return null;
  }

  return {
    seriesId: detail.seriesId,
    text: `${detail.seriesPosition} of ${totalBooks} in ${detail.seriesName}`,
  };
};
