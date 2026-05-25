import { FormattedMessage } from 'react-intl';

import { FormattedAlert } from '@/components/Alert';

import { userNameHighlight } from './auth.css';

type Props = {
  code: string;
  attemptedUserName: string;
};

export function AuthError({ code, attemptedUserName }: Props) {
  if (code === 'CONFLICT') {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="That username is already taken." />}
        message={
          <FormattedMessage
            defaultMessage="<highlight>{userName}</highlight> belongs to another reader. Try a variation, or sign in if it's yours."
            values={{
              userName: attemptedUserName,
              highlight: (chunks) => <span className={userNameHighlight}>{chunks}</span>,
            }}
          />
        }
      />
    );
  }

  if (code === 'UNAUTHORIZED') {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="Failed to log in." />}
        message={<FormattedMessage defaultMessage="Double check your user name and password, then try again." />}
      />
    );
  }

  if (code === 'TOO_MANY_REQUESTS') {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="Rate limit exceeded." />}
        message={<FormattedMessage defaultMessage="You've made too many attempts. Please try again later." />}
      />
    );
  }

  if (code === 'UNPROCESSABLE_CONTENT') {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="Failed to register." />}
        message={
          <FormattedMessage defaultMessage="Double check your invite link. You may need to reach out to your Obelus administrator for a new one." />
        }
      />
    );
  }

  if (code === 'FORBIDDEN') {
    return (
      <FormattedAlert
        variant="error"
        title={<FormattedMessage defaultMessage="Registration closed." />}
        message={<FormattedMessage defaultMessage="If this is unexpected, check with your Obelus administrator." />}
      />
    );
  }

  return (
    <FormattedAlert
      variant="error"
      title={<FormattedMessage defaultMessage="An unexpected error occurred." />}
      message={<FormattedMessage defaultMessage="Please refresh your browser window and try again." />}
    />
  );
}
