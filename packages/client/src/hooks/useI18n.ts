import { useIntl, type IntlShape } from 'react-intl';

import type { InviteLinkStatus, Judgment, Maybe, Status, UserRole, UserStatus } from '@obelus/shared/types';

export function useJudgmentI18n() {
  const intl = useIntl();
  const mapping: Record<Judgment, string> = {
    accepted: intl.formatMessage({ defaultMessage: 'accepted' }),
    mixed: intl.formatMessage({ defaultMessage: 'mixed' }),
    rejected: intl.formatMessage({ defaultMessage: 'rejected' }),
  };

  return (value: Maybe<Judgment>) => mappingOrNull(intl, value, mapping);
}

export function useRecordStatusI18n() {
  const intl = useIntl();
  const mapping: Record<Status, string> = {
    finished: intl.formatMessage({ defaultMessage: 'finished' }),
    planned: intl.formatMessage({ defaultMessage: 'planned' }),
    reading: intl.formatMessage({ defaultMessage: 'reading' }),
  };

  return (value: Status) => mappingOrNull(intl, value, mapping);
}

export function useUserStatusI18n() {
  const intl = useIntl();
  const mapping: Record<UserStatus, string> = {
    active: intl.formatMessage({ defaultMessage: 'active' }),
    disabled: intl.formatMessage({ defaultMessage: 'disabled' }),
    pending_approval: intl.formatMessage({ defaultMessage: 'pending' }),
  };

  return (value: UserStatus) => mappingOrNull(intl, value, mapping);
}

export function useUserRoleI18n() {
  const intl = useIntl();
  const mapping: Record<UserRole, string> = {
    admin: intl.formatMessage({ defaultMessage: 'admin' }),
    member: intl.formatMessage({ defaultMessage: 'member' }),
  };

  return (value: UserRole) => mappingOrNull(intl, value, mapping);
}

export function useInviteLinkStatusI18n() {
  const intl = useIntl();
  const mapping: Record<InviteLinkStatus, string> = {
    active: intl.formatMessage({ defaultMessage: 'active' }),
    invalidated: intl.formatMessage({ defaultMessage: 'invalid' }),
    used: intl.formatMessage({ defaultMessage: 'used' }),
  };

  return (value: InviteLinkStatus) => mappingOrNull(intl, value, mapping);
}

function mappingOrNull<T extends string>(intl: IntlShape, value: Maybe<T>, mapping: Record<T, string>) {
  const na = intl.formatMessage({ defaultMessage: 'N/A' });

  if (!value) {
    return na;
  }

  return mapping[value] ?? na;
}
