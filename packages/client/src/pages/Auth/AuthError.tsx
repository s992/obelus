import { FormattedMessage } from 'react-intl';

import { Alert } from '../../components/Alert';
import { alertBody, userNameHighlight } from './auth.css';

type Props = {
  code: string;
  attemptedUserName: string;
};

export function AuthError({ code, attemptedUserName }: Props) {
  if (code === 'CONFLICT') {
    return (
      <Alert variant="error">
        <strong>
          <FormattedMessage defaultMessage="That username is already taken." />
        </strong>
        <p className={alertBody}>
          <FormattedMessage
            defaultMessage="<highlight>{userName}</highlight> belongs to another reader. Try a variation, or sign in if it's yours."
            values={{
              userName: attemptedUserName,
              highlight: (chunks) => <span className={userNameHighlight}>{chunks}</span>,
            }}
          />
        </p>
      </Alert>
    );
  }

  if (code === 'UNAUTHORIZED') {
    return (
      <Alert variant="error">
        <strong>
          <FormattedMessage defaultMessage="Failed to log in." />
        </strong>
        <p className={alertBody}>
          <FormattedMessage defaultMessage="Double check your user name and password, then try again." />
        </p>
      </Alert>
    );
  }

  return (
    <Alert variant="error">
      <strong>
        <FormattedMessage defaultMessage="An unexpected error occurred." />
      </strong>
      <p className={alertBody}>
        <FormattedMessage defaultMessage="Please refresh your browser window and try again." />
      </p>
    </Alert>
  );
}
