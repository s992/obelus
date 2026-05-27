import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FormattedMessage, useIntl } from 'react-intl';

import { useTRPC } from '@/client';
import { FullContainerSpinner } from '@/components/FullContainerSpinner';
import { toastQueue } from '@/components/Toast';
import { typography } from '@/style';

import { formSection } from '../settings.css';
import { ConfigForm } from './ConfigForm';
import { formContainer } from './obelusConfig.css';

export function ObelusConfig() {
  const intl = useIntl();
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  const { data: config, isLoading } = useQuery(trpc.config.get.queryOptions());
  const { mutate: updateConfig, isPending } = useMutation(
    trpc.config.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.config.get.queryKey() });
        toastQueue.add(
          {
            variant: 'success',
            title: intl.formatMessage({ defaultMessage: 'Config saved' }),
            message: intl.formatMessage({ defaultMessage: 'Saved Obelus config successfully.' }),
          },
          {
            timeout: 5000,
          },
        );
      },
      onError: async () => {
        await queryClient.invalidateQueries({ queryKey: trpc.config.get.queryKey() });
        toastQueue.add({
          variant: 'error',
          title: intl.formatMessage({ defaultMessage: 'Failed to save config' }),
          message: intl.formatMessage({ defaultMessage: 'Reload your browswer window and try again.' }),
        });
      },
    }),
  );

  return (
    <div className={formSection}>
      <h2 className={typography.h2}>
        <FormattedMessage defaultMessage="Obelus Config" />
      </h2>
      <div className={formContainer}>
        {isLoading || !config ? (
          <FullContainerSpinner />
        ) : (
          <ConfigForm defaultValues={config} onSubmit={({ value }) => updateConfig(value)} isLoading={isPending} />
        )}
      </div>
    </div>
  );
}
