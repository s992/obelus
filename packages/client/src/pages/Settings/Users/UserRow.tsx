import { useIntl } from 'react-intl';
import type z from 'zod';

import { Select } from '@/components/Select';
import { Table } from '@/components/Table';
import { useFormatDate } from '@/hooks/useFormatDate';
import { UserRoleSchema, UserStatusSchema, ListUsersUserJsonSchema } from '@obelus/shared/schema';
import type { UserStatus, UserRole } from '@obelus/shared/types';

import { actionContainer, dateCell, nameCell, roleCell, statusCell } from './users.css';

type Props = {
  user: z.infer<typeof ListUsersUserJsonSchema>;
  onRoleChange: (role: UserRole) => void;
  onStatusChange: (status: UserStatus) => void;
};

export function UsersRow({ user, onRoleChange, onStatusChange }: Props) {
  const intl = useIntl();
  const formatDate = useFormatDate('MMM DD, YYYY, h:mm a');
  const roleLabel = intl.formatMessage({ defaultMessage: 'change role' });
  const statusLabel = intl.formatMessage({ defaultMessage: 'change status' });

  return (
    <Table.Row key={user.id}>
      <Table.Cell className={nameCell}>{user.userName}</Table.Cell>
      <Table.Cell className={roleCell[user.role]}>
        <RoleI18n role={user.role} />
      </Table.Cell>
      <Table.Cell className={statusCell[user.status]}>
        <StatusI18n status={user.status} />
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

function StatusI18n({ status }: { status: UserStatus }) {
  const intl = useIntl();

  switch (status) {
    case 'active':
      return intl.formatMessage({ defaultMessage: 'active' });
    case 'disabled':
      return intl.formatMessage({ defaultMessage: 'disabled' });
    case 'pending_approval':
      return intl.formatMessage({ defaultMessage: 'pending' });
    default:
      return null;
  }
}

function RoleI18n({ role }: { role: UserRole }) {
  const intl = useIntl();

  switch (role) {
    case 'admin':
      return intl.formatMessage({ defaultMessage: 'admin' });
    case 'member':
      return intl.formatMessage({ defaultMessage: 'member' });
    default:
      return null;
  }
}
