import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Copy, CopyCheck, CopyX } from 'lucide-react';
import { useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useCopyToClipboard } from 'usehooks-ts';

import { useTRPC } from '../../client';
import { Button } from '../../components/Button';
import { FullPageSpinner } from '../../components/FullPageSpinner';
import { IconButton } from '../../components/IconButton';
import { NotFound } from '../../components/NotFound';
import { toastQueue } from '../../components/Toast';
import { typography, vars } from '../../style';
import { Imports } from './Imports';
import { PasswordForm } from './PasswordForm';
import {
  container,
  importsSection,
  privacyButton,
  publicUrlSection,
  recordUrlContainer,
  section,
} from './settings.css';

type CopyState = 'pending' | 'success' | 'error';

export function Settings() {
  const intl = useIntl();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [copyState, setCopyState] = useState<CopyState>('pending');
  const { data: user, isLoading } = useQuery(trpc.user.me.queryOptions());
  const { mutate: changePassword, isPending: isChangingPassword } = useMutation(
    trpc.user.changePassword.mutationOptions({
      onSuccess: () => {
        toastQueue.add({
          title: intl.formatMessage({ defaultMessage: 'Success' }),
          message: intl.formatMessage({ defaultMessage: 'Your password has been updated.' }),
          variant: 'success',
        });
      },
    }),
  );
  const { mutate: updateUser } = useMutation(
    trpc.user.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.user.me.queryKey() });
      },
    }),
  );

  const [, copy] = useCopyToClipboard();
  const recordUrl = `${window.location.origin}/u/${user?.userName}`;

  const clearCopyState = () => {
    setTimeout(() => {
      setCopyState('pending');
    }, 2000);
  };
  const copyToClipboard = async () => {
    try {
      const success = await copy(recordUrl);

      setCopyState(success ? 'success' : 'error');
    } catch {
      setCopyState('error');
    }

    clearCopyState();
  };

  if (isLoading) {
    return <FullPageSpinner />;
  }

  if (!user) {
    return <NotFound />;
  }

  return (
    <div className={container}>
      <div className={section}>
        <h2 className={typography.h2}>
          <FormattedMessage defaultMessage="Change Password" />
        </h2>
        <div>
          <PasswordForm
            onSubmit={({ value: { currentPassword, newPassword } }) => changePassword({ currentPassword, newPassword })}
            isLoading={isChangingPassword}
          />
        </div>
      </div>
      <div className={publicUrlSection}>
        <h2 className={typography.h2}>
          <FormattedMessage defaultMessage="Privacy" />
        </h2>
        <span className={typography.body}>
          <FormattedMessage
            defaultMessage="Your record is currently {isPublic, select, true {public} other {private}}. <btn>Click here</btn> to make it {isPublic, select, true {private} other {public}}."
            values={{
              isPublic: user.public,
              btn: (chunks) => (
                <Button
                  variant="underlined"
                  className={privacyButton}
                  onPress={() => updateUser({ public: !user.public })}
                >
                  {chunks}
                </Button>
              ),
            }}
          />
        </span>
        <div className={recordUrlContainer}>
          <Link to="/u/$userName" params={{ userName: user.userName }} className={typography.label}>
            {recordUrl}
          </Link>
          <IconButton aria-label={intl.formatMessage({ defaultMessage: 'Copy record URL' })} onPress={copyToClipboard}>
            <CopyIcon state={copyState} />
          </IconButton>
        </div>
      </div>
      <div className={importsSection}>
        <h2 className={typography.h2}>
          <FormattedMessage defaultMessage="Imports" />
        </h2>
        <Imports />
      </div>
    </div>
  );
}

function CopyIcon({ state }: { state: CopyState }) {
  if (state === 'pending') {
    return <Copy />;
  }

  if (state === 'error') {
    return <CopyX color={vars.color.bad} />;
  }

  if (state === 'success') {
    return <CopyCheck color={vars.color.good} />;
  }

  return null;
}
