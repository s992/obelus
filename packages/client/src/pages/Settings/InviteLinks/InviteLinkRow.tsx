import dayjs from 'dayjs';
import { Copy } from 'lucide-react';
import type { ReactNode } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCopyToClipboard } from 'usehooks-ts';
import type z from 'zod';

import { Button } from '@/components/Button';
import { IconButton } from '@/components/IconButton';
import { Table } from '@/components/Table';
import { toastQueue } from '@/components/Toast';
import { useInviteLinkStatusI18n } from '@/hooks/useI18n';
import { flex, typography } from '@/style';
import type { InviteLinkJsonSchema } from '@obelus/shared/schema';
import type { InviteLinkStatus, Maybe } from '@obelus/shared/types';

import { statusDot } from '../Users/users.css';
import { getLinkStatus } from './getLinkStatus';
import { actionContainer, activeLinkToken, linkContainer, link as linkCss, statusCell } from './inviteLinks.css';

type Props = {
  link: z.infer<typeof InviteLinkJsonSchema>;
  onInvalidate: () => void;
};

export function InviteLinkRow({ link, onInvalidate }: Props) {
  const intl = useIntl();
  const statusI18n = useInviteLinkStatusI18n();
  const status = getLinkStatus(link.usedAt, link.usedBy);
  const [, copy] = useCopyToClipboard();
  const linkUrl = `${window.location.origin}/auth/register/${link.token}`;
  const queueCopyErrorToast = () => {
    toastQueue.add({
      variant: 'error',
      title: intl.formatMessage({ defaultMessage: 'Error' }),
      message: intl.formatMessage({
        defaultMessage: 'Failed to copy invite link to clipboard. Check your browser permissions and try again.',
      }),
    });
  };

  const onCopy = async () => {
    try {
      const success = await copy(linkUrl);

      if (!success) {
        queueCopyErrorToast();
      } else {
        toastQueue.add(
          {
            variant: 'success',
            title: intl.formatMessage({ defaultMessage: 'Success' }),
            message: intl.formatMessage({
              defaultMessage: 'Invite link copied to clipboard.',
            }),
          },
          { timeout: 5000 },
        );
      }
    } catch {
      queueCopyErrorToast();
    }
  };

  return (
    <Table.Row>
      <Table.Cell className={status === 'active' ? linkCss.default : linkCss.invalidated}>
        <div className={linkContainer}>
          <span>
            <span>{window.location.host}/auth/register/</span>
            <span className={status === 'active' ? activeLinkToken : undefined}>{link.token}</span>
          </span>
          <IconButton
            aria-label={intl.formatMessage({ defaultMessage: 'Copy invite link' })}
            size="small"
            onPress={onCopy}
          >
            <Copy />
          </IconButton>
        </div>
      </Table.Cell>
      <Table.Cell>
        <ExpiryCell expiry={link.expiresAt} usedBy={link.userName} status={status} />
      </Table.Cell>
      <Table.Cell className={statusCell[status]}>
        <span className={statusDot} />
        {statusI18n(status)}
      </Table.Cell>
      <Table.Cell>
        <div className={actionContainer}>
          {status === 'active' ? (
            <>
              <Button variant="link" onPress={onCopy}>
                <FormattedMessage defaultMessage="copy link" />
              </Button>
              <Button variant="link" onPress={onInvalidate}>
                <FormattedMessage defaultMessage="invalidate" />
              </Button>
            </>
          ) : (
            <Button variant="link" isDisabled>
              <FormattedMessage defaultMessage="no actions" />
            </Button>
          )}
        </div>
      </Table.Cell>
    </Table.Row>
  );
}

function ExpiryCell({ expiry, usedBy, status }: { expiry: string; usedBy: Maybe<string>; status: InviteLinkStatus }) {
  const parsed = dayjs(expiry);

  if (!parsed) {
    return <FormattedMessage defaultMessage="N/A" />;
  }

  const formatted = parsed.format('MMM DD, YYYY, h:mm a');
  let expirySubtext: ReactNode | null = null;

  switch (status) {
    case 'active':
      expirySubtext = (
        <FormattedMessage defaultMessage="in {relativeTime}" values={{ relativeTime: parsed.fromNow() }} />
      );
      break;
    case 'used':
      expirySubtext = <FormattedMessage defaultMessage="used by {userName}" values={{ userName: usedBy }} />;
      break;
  }

  return (
    <div className={flex.column}>
      <span className={typography.monoBody}>{formatted}</span>
      <span className={typography.uppercaseLabel}>{expirySubtext}</span>
    </div>
  );
}
