import { errorMessage, list } from './validationErrorList.css';

type Props = {
  errors: string[];
};

export function ValidationErrorList({ errors }: Props) {
  return (
    <ul className={list}>
      {errors.map((error) => (
        <li className={errorMessage} key={error}>
          {error}
        </li>
      ))}
    </ul>
  );
}
