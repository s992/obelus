import { useIntl } from 'react-intl';
import type z from 'zod';

import { Select } from '@/components/Select';
import { Table } from '@/components/Table';
import { useFormatDate } from '@/hooks/useFormatDate';
import { useUserRoleI18n, useUserStatusI18n } from '@/hooks/useI18n';
import { UserRoleSchema, UserStatusSchema, ListUsersUserJsonSchema } from '@obelus/shared/schema';
import type { UserStatus, UserRole } from '@obelus/shared/types';

import { actionContainer, dateCell, nameCell, roleCell, statusCell, statusDot } from './users.css';

type Props = {
  user: z.infer<typeof ListUsersUserJsonSchema>;
  onRoleChange: (role: UserRole) => void;
  onStatusChange: (status: UserStatus) => void;
};

export function UsersRow({ user, onRoleChange, onStatusChange }: Props) {
  const intl = useIntl();
  const roleI18n = useUserRoleI18n();
  const statusI18n = useUserStatusI18n();
  const formatDate = useFormatDate('MMM DD, YYYY, h:mm a', undefined, false);
  const roleLabel = intl.formatMessage({ defaultMessage: 'change role' });
  const statusLabel = intl.formatMessage({ defaultMessage: 'change status' });

  return (
    <Table.Row key={user.id}>
      <Table.Cell className={nameCell}>{user.userName}</Table.Cell>
      <Table.Cell className={roleCell[user.role]}>{roleI18n(user.role)}</Table.Cell>
      <Table.Cell className={statusCell[user.status]}>
        <span className={statusDot} />
        {statusI18n(user.status)}
      </Table.Cell>
      <Table.Cell className={dateCell}>{formatDate(user.createdAt)}</Table.Cell>
      <Table.Cell>
        <div className={actionContainer}>
          <Select
            variant="muted"
            aria-label={roleLabel}
            buttonValue={roleLabel}
            value={user.role}
            onChange={(role) => {
              const parsed = UserRoleSchema.safeParse(role);

              if (!parsed.success) {
                return;
              }

              onRoleChange(parsed.data);
            }}
          >
            <Select.Item id="admin">{intl.formatMessage({ defaultMessage: 'admin' })}</Select.Item>
            <Select.Item id="member">{intl.formatMessage({ defaultMessage: 'member' })}</Select.Item>
          </Select>
          <Select
            variant="muted"
            aria-label={statusLabel}
            buttonValue={statusLabel}
            value={user.status}
            onChange={(status) => {
              const parsed = UserStatusSchema.safeParse(status);

              if (!parsed.success) {
                return;
              }

              onStatusChange(parsed.data);
            }}
          >
            <Select.Item id="active">{intl.formatMessage({ defaultMessage: 'active' })}</Select.Item>
            <Select.Item id="pending_approval">{intl.formatMessage({ defaultMessage: 'pending' })}</Select.Item>
            <Select.Item id="disabled">{intl.formatMessage({ defaultMessage: 'disabled' })}</Select.Item>
          </Select>
        </div>
      </Table.Cell>
    </Table.Row>
  );
}
