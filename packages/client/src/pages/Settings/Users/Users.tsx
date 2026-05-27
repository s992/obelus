import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '@/client';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { Table } from '@/components/Table';
import { toastQueue } from '@/components/Toast';
import { typography } from '@/style';
import type { UserStatus, UserRole } from '@obelus/shared/types';

import { formSection } from '../settings.css';
import { UsersRow } from './UserRow';
import { emptyStateCell, filterBar, filterGroup, header } from './users.css';

export function Users() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
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
      onError: (err) => {
        toastQueue.add({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Failed to update user' }),
          message: err.message || intl.formatMessage({ defaultMessage: 'Please refresh the page and try again.' }),
        });
      },
    }),
  );
  const users = data?.pages.flatMap((page) => page.users).filter((user) => user !== undefined);

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
                <UsersRow
                  key={user.id}
                  user={user}
                  onRoleChange={(role) => {
                    updateUser({ id: user.id, role, status: user.status });
                  }}
                  onStatusChange={(status) => {
                    updateUser({ id: user.id, role: user.role, status });
                  }}
                />
              ))}
            </Table.Body>
          </Table>
        )}
      </Pagination>
    </div>
  );
}
