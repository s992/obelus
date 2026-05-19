import { FormattedMessage } from 'react-intl';

import {
  badUrl,
  card,
  cardFooter,
  cardFooterStrong,
  cardHeader,
  cardKey,
  cardRow,
  cardValue,
  cardValueEmphasis,
  cardValueStrike,
  container,
  copy,
  error,
  eyebrow,
  h1,
  h2,
  message,
  stage,
  stamp,
  strike,
} from './notFound.css';

export function NotFound() {
  const url = window.location.pathname;

  return (
    <div className={container}>
      <div className={stage}>
        <section className={copy}>
          <div className={eyebrow}>
            <span className={error}>
              <FormattedMessage defaultMessage="error 404" />
            </span>
            <span>
              <FormattedMessage defaultMessage="page not found" />
            </span>
          </div>
          <h1 className={h1}>
            4<span className={strike}>0</span>4
          </h1>
          <h2 className={h2}>
            <FormattedMessage defaultMessage="This page isn't in the record." />
          </h2>
          <p className={message}>
            <FormattedMessage
              defaultMessage="Either it was never logged, or it was filed under a different title and quietly reshelved. We checked the stacks — nothing under <code>{url}</code>"
              values={{ url, code: (chunks) => <code className={badUrl}>{chunks}</code> }}
            />
          </p>
        </section>
        <aside className={card}>
          <span className={stamp}>
            <FormattedMessage defaultMessage="discarded" />
          </span>
          <div className={cardHeader}>
            <span className={cardKey}>
              <FormattedMessage defaultMessage="catalog card" />
            </span>
            <span className={cardKey}>
              <FormattedMessage defaultMessage="no. 000-404" />
            </span>
          </div>
          <div className={cardRow}>
            <span className={cardKey}>
              <FormattedMessage defaultMessage="title" />
            </span>
            <span className={cardValueStrike}>{url}</span>
          </div>
          <div className={cardRow}>
            <span className={cardKey}>
              <FormattedMessage defaultMessage="author" />
            </span>
            <span className={cardValue}>
              <em className={cardValueEmphasis}>
                <FormattedMessage defaultMessage="unknown" />
              </em>
            </span>
          </div>
          <div className={cardRow}>
            <span className={cardKey}>
              <FormattedMessage defaultMessage="published" />
            </span>
            <span className={cardValue}>—</span>
          </div>
          <div className={cardRow}>
            <span className={cardKey}>
              <FormattedMessage defaultMessage="shelf" />
            </span>
            <span className={cardValue}>
              <FormattedMessage defaultMessage="none assigned" />
            </span>
          </div>
          <div className={cardRow}>
            <span className={cardKey}>
              <FormattedMessage defaultMessage="judgment" />
            </span>
            <span className={cardValue}>
              <em className={cardValueEmphasis}>
                <FormattedMessage defaultMessage="cannot be read" />
              </em>
            </span>
          </div>
          <div className={cardFooter}>
            <span>
              <FormattedMessage
                defaultMessage="last seen · <b>never</b>"
                values={{ b: (chunks) => <strong className={cardFooterStrong}>{chunks}</strong> }}
              />
            </span>
            <span>
              <FormattedMessage
                defaultMessage="filed by · <b>obelus</b>"
                values={{ b: (chunks) => <strong className={cardFooterStrong}>{chunks}</strong> }}
              />
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}
