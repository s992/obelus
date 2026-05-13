import { FormattedMessage } from 'react-intl';

import { FormattedAlert } from '../../components/Alert';
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

  return (
    <FormattedAlert
      variant="error"
      title={<FormattedMessage defaultMessage="An unexpected error occurred." />}
      message={<FormattedMessage defaultMessage="Please refresh your browser window and try again." />}
    />
  );
}
