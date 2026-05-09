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
        <strong>That username is already taken.</strong>
        <p className={alertBody}>
          <span className={userNameHighlight}>{attemptedUserName}</span> belongs to another reader. Try a variation, or
          sign in if it's yours.
        </p>
      </Alert>
    );
  }

  if (code === 'UNAUTHORIZED') {
    return (
      <Alert variant="error">
        <strong>Failed to log in.</strong>
        <p className={alertBody}>Double check your user name and password, then try again.</p>
      </Alert>
    );
  }

  return (
    <Alert variant="error">
      <strong>An unexpected error occurred.</strong>
      <p className={alertBody}>Please refresh your browser window and try again.</p>
    </Alert>
  );
}
