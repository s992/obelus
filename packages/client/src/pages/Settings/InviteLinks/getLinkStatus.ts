import type { InviteLinkStatus, Maybe } from '@obelus/shared/types';

export function getLinkStatus(usedAt: Maybe<string>, usedBy: Maybe<string>): InviteLinkStatus {
  if (usedAt && usedBy) {
    return 'used';
  }

  if (usedAt) {
    return 'invalidated';
  }

  return 'active';
}
