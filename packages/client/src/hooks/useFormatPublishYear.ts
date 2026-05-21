import { useFormatDate } from './useFormatDate';

export function useFormatPublishYear() {
  return useFormatDate('YYYY', 'YYYY-MM-DD');
}
