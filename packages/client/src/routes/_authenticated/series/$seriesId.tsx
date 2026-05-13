import { createFileRoute } from '@tanstack/react-router';

import { SeriesDetail } from '../../../pages/SeriesDetail';

export const Route = createFileRoute('/_authenticated/series/$seriesId')({
  component: SeriesDetail,
});
