import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '@/client';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { Select } from '@/components/Select';
import { Table } from '@/components/Table';
import { toastQueue } from '@/components/Toast';
import { useFormatDate } from '@/hooks/useFormatDate';
import { typography } from '@/style';
import { UserRoleSchema, UserStatusSchema } from '@obelus/shared/schema';
import type { UserStatus, UserRole } from '@obelus/shared/types';

import { formSection } from '../settings.css';
import {
  actionContainer,
  dateCell,
  emptyStateCell,
  filterBar,
  filterGroup,
  header,
  nameCell,
  roleCell,
  statusCell,
} from './users.css';

export function Users() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const formatDate = useFormatDate('MMM DD, YYYY, h:mm a');
  const [statusFilter, setStatusFilter] = useState<UserStatus | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const statusParam = statusFilter === 'all' ? null : statusFilter;
  const roleParam = roleFilter === 'all' ? null : roleFilter;
  const { data, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery(
    trpc.user.list.infiniteQueryOptions(
      {
        role: roleParam,
        status: statusParam,
      },
      {
        getNextPageParam: (data) => data.nextPageToken,
      },
    ),
  );
  const { mutate: updateUser, isPending } = useMutation(
    trpc.user.adminUpdateUser.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.user.list.infiniteQueryKey({ role: roleParam, status: statusParam }),
        });
      },
      onError: () => {
        toastQueue.add({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Failed to update user' }),
          message: intl.formatMessage({ defaultMessage: 'Please refresh the page and try again.' }),
        });
      },
    }),
  );
  const users = data?.pages.flatMap((page) => page.users).filter((user) => user !== undefined);

  const roleLabel = intl.formatMessage({ defaultMessage: 'change role' });
  const statusLabel = intl.formatMessage({ defaultMessage: 'change status' });

  return (
    <div className={formSection}>
      <div className={filterBar}>
        <div className={filterGroup}>
          <span className={typography.uppercaseLabel}>
            <FormattedMessage defaultMessage="role" />
          </span>
          <Button variant="chip" onPress={() => setRoleFilter('all')} isSelected={roleFilter === 'all'}>
            <FormattedMessage defaultMessage="all" />
          </Button>
          <Button variant="chip" onPress={() => setRoleFilter('admin')} isSelected={roleFilter === 'admin'}>
            <FormattedMessage defaultMessage="admin" />
          </Button>
          <Button variant="chip" onPress={() => setRoleFilter('member')} isSelected={roleFilter === 'member'}>
            <FormattedMessage defaultMessage="member" />
          </Button>
        </div>
        <div className={filterGroup}>
          <span className={typography.uppercaseLabel}>
            <FormattedMessage defaultMessage="status" />
          </span>
          <Button variant="chip" onPress={() => setStatusFilter('all')} isSelected={statusFilter === 'all'}>
            <FormattedMessage defaultMessage="all" />
          </Button>
          <Button variant="chip" onPress={() => setStatusFilter('active')} isSelected={statusFilter === 'active'}>
            <FormattedMessage defaultMessage="active" />
          </Button>
          <Button
            variant="chip"
            onPress={() => setStatusFilter('pending_approval')}
            isSelected={statusFilter === 'pending_approval'}
          >
            <FormattedMessage defaultMessage="pending" />
          </Button>
          <Button variant="chip" onPress={() => setStatusFilter('disabled')} isSelected={statusFilter === 'disabled'}>
            <FormattedMessage defaultMessage="disabled" />
          </Button>
        </div>
      </div>
      <Pagination
        records={users ?? []}
        pageSize={data?.pages[0]?.pageSize ?? 0}
        totalRecords={data?.pages[0]?.totalCount ?? 0}
        hasNextPage={hasNextPage}
        onFetchNextPage={fetchNextPage}
      >
        {(records) => (
          <Table
            aria-label={intl.formatMessage({ defaultMessage: 'List of users' })}
            isLoading={isPending || isFetching}
          >
            <Table.Header>
              <Table.Column isRowHeader className={header.userName}>
                <FormattedMessage defaultMessage="user name" />
              </Table.Column>
              <Table.Column className={header.role}>
                <FormattedMessage defaultMessage="role" />
              </Table.Column>
              <Table.Column className={header.status}>
                <FormattedMessage defaultMessage="status" />
              </Table.Column>
              <Table.Column className={header.joined}>
                <FormattedMessage defaultMessage="joined" />
              </Table.Column>
              <Table.Column className={header.action}>
                <FormattedMessage defaultMessage="actions" />
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {!records.length && (
                <Table.Row>
                  <Table.Cell colSpan={5} className={emptyStateCell}>
                    <FormattedMessage defaultMessage="No users found matching your filters." />
                  </Table.Cell>
                </Table.Row>
              )}
              {records.map((user) => (
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
                        defaultValue={user.role}
                        onChange={(role) => {
                          const parsed = UserRoleSchema.safeParse(role);

                          if (!parsed.success) {
                            return;
                          }

                          updateUser({ id: user.id, status: user.status, role: parsed.data });
                        }}
                      >
                        <Select.Item id="admin">
                          <FormattedMessage defaultMessage="admin" />
                        </Select.Item>
                        <Select.Item id="member">
                          <FormattedMessage defaultMessage="member" />
                        </Select.Item>
                      </Select>
                      <Select
                        variant="muted"
                        aria-label={statusLabel}
                        buttonValue={statusLabel}
                        defaultValue={user.status}
                        onChange={(status) => {
                          const parsed = UserStatusSchema.safeParse(status);

                          if (!parsed.success) {
                            return;
                          }

                          updateUser({ id: user.id, role: user.role, status: parsed.data });
                        }}
                      >
                        <Select.Item id="active">
                          <FormattedMessage defaultMessage="active" />
                        </Select.Item>
                        <Select.Item id="pending_approval">
                          <FormattedMessage defaultMessage="pending" />
                        </Select.Item>
                        <Select.Item id="disabled">
                          <FormattedMessage defaultMessage="disabled" />
                        </Select.Item>
                      </Select>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        )}
      </Pagination>
    </div>
  );
}

function StatusI18n({ status }: { status: UserStatus }) {
  switch (status) {
    case 'active':
      return <FormattedMessage defaultMessage="active" />;
    case 'disabled':
      return <FormattedMessage defaultMessage="disabled" />;
    case 'pending_approval':
      return <FormattedMessage defaultMessage="pending" />;
    default:
      return null;
  }
}

function RoleI18n({ role }: { role: UserRole }) {
  switch (role) {
    case 'admin':
      return <FormattedMessage defaultMessage="admin" />;
    case 'member':
      return <FormattedMessage defaultMessage="member" />;
    default:
      return null;
  }
}
