import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '@/client';
import { Button } from '@/components/Button';
import { Pagination } from '@/components/Pagination';
import { Table } from '@/components/Table';
import { typography } from '@/style';
import type { InviteLinkStatus } from '@obelus/shared/types';

import { filterGroup } from '../Users/users.css';
import { InviteLinkRow } from './InviteLinkRow';
import { actionsColumn, filterBar } from './inviteLinks.css';

export function InviteLinks() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const [statusFilter, setStatusFilter] = useState<InviteLinkStatus | 'all'>('all');
  const { data, isFetching, fetchNextPage, hasNextPage } = useInfiniteQuery(
    trpc.inviteLinks.list.infiniteQueryOptions(
      {
        status: statusFilter === 'all' ? null : statusFilter,
      },
      {
        getNextPageParam: (data) => data.nextPageToken,
      },
    ),
  );
  const { mutate: createLink, isPending: isCreatingLink } = useMutation(
    trpc.inviteLinks.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.inviteLinks.list.infiniteQueryKey() });
      },
    }),
  );
  const { mutate: invalidateLink, isPending: isInvalidatingLink } = useMutation(
    trpc.inviteLinks.invalidate.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.inviteLinks.list.infiniteQueryKey() });
      },
    }),
  );

  const links = data?.pages.flatMap((page) => page.links).filter((link) => link !== undefined);

  return (
    <div>
      <div className={filterBar}>
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
          <Button variant="chip" onPress={() => setStatusFilter('used')} isSelected={statusFilter === 'used'}>
            <FormattedMessage defaultMessage="used" />
          </Button>
          <Button
            variant="chip"
            onPress={() => setStatusFilter('invalidated')}
            isSelected={statusFilter === 'invalidated'}
          >
            <FormattedMessage defaultMessage="invalidated" />
          </Button>
        </div>
        <Button variant="secondary" onPress={() => createLink()} isProcessing={isCreatingLink}>
          <FormattedMessage defaultMessage="Create invite link" />
        </Button>
      </div>
      <Pagination
        records={links ?? []}
        pageSize={data?.pages[0]?.pageSize ?? 0}
        totalRecords={data?.pages[0]?.totalCount ?? 0}
        hasNextPage={hasNextPage}
        onFetchNextPage={fetchNextPage}
      >
        {(records) => (
          <Table
            aria-label={intl.formatMessage({ defaultMessage: 'List of invite links' })}
            isLoading={isFetching || isInvalidatingLink}
          >
            <Table.Header>
              <Table.Column isRowHeader>
                <FormattedMessage defaultMessage="link" />
              </Table.Column>
              <Table.Column>
                <FormattedMessage defaultMessage="expires" />
              </Table.Column>
              <Table.Column>
                <FormattedMessage defaultMessage="status" />
              </Table.Column>
              <Table.Column className={actionsColumn}>
                <FormattedMessage defaultMessage="actions" />
              </Table.Column>
            </Table.Header>
            <Table.Body>
              {!records.length && !isFetching && (
                <Table.Row>
                  <Table.Cell colSpan={4}>
                    <FormattedMessage defaultMessage="No invite links found matching your filters." />
                  </Table.Cell>
                </Table.Row>
              )}
              {records.map((record) => (
                <InviteLinkRow key={record.id} link={record} onInvalidate={() => invalidateLink({ id: record.id })} />
              ))}
            </Table.Body>
          </Table>
        )}
      </Pagination>
    </div>
  );
}
