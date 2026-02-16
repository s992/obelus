import { trpc } from "@/api/trpc";
import { getErrorMessage } from "@/lib/errors";
import { normalizeInputValue } from "@/lib/normalize";
import { queryKeys } from "@/lib/query-keys";
import * as a11yStyles from "@/styles/a11y.css";
import { Button } from "@/ui/Button";
import { InputBase } from "@/ui/InputBase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import * as styles from "./SsoCallbackPage.css";

const confirmSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type ConfirmInput = z.infer<typeof confirmSchema>;

type LinkPrompt = {
  linkToken: string;
  email: string;
};

export const SsoCallbackPage = () => {
  const qc = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [linkPrompt, setLinkPrompt] = useState<LinkPrompt | null>(null);
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const confirmForm = useForm<ConfirmInput>({
    resolver: zodResolver(confirmSchema),
  });

  const finishSignIn = () => {
    qc.invalidateQueries({ queryKey: queryKeys.me });
    navigate("/", { replace: true });
  };

  const confirmLink = useMutation({
    mutationFn: (input: ConfirmInput & { linkToken: string }) =>
      trpc.auth.confirmSsoLink.mutate({
        linkToken: input.linkToken,
        password: input.password,
      }),
    onSuccess: () => {
      confirmForm.reset();
      finishSignIn();
    },
  });

  const ssoCallback = useMutation({
    mutationFn: (input: { code: string; state: string }) => trpc.auth.ssoCallback.mutate(input),
    onSuccess: (result) => {
      if ("requiresLinkConfirmation" in result && result.requiresLinkConfirmation) {
        setLinkPrompt({ linkToken: result.linkToken, email: result.email });
        return;
      }
      finishSignIn();
    },
    onError: (error) => {
      setCallbackError(getErrorMessage(error));
    },
  });

  useEffect(() => {
    if (startedRef.current) {
      return;
    }

    startedRef.current = true;
    const params = new URLSearchParams(location.search);
    const providerError = params.get("error");
    const providerErrorDescription = params.get("error_description");
    if (providerError) {
      setCallbackError(providerErrorDescription ?? "Single sign-on failed.");
      return;
    }

    const code = params.get("code");
    const state = params.get("state");
    if (!code || !state) {
      setCallbackError("Invalid single sign-on response.");
      return;
    }

    ssoCallback.mutate({ code, state });
  }, [location.search, ssoCallback]);

  const confirmPasswordError = confirmForm.formState.errors.password?.message;
  const confirmErrorMessage = confirmLink.error ? getErrorMessage(confirmLink.error) : null;

  return (
    <main className={styles.page} id="main-content" tabIndex={-1}>
      <div className={styles.container}>
        <h1 className={a11yStyles.srOnly}>Single sign-on callback</h1>
        <section className={styles.card}>
          <h2 className={styles.title}>Sign in</h2>

          {linkPrompt ? (
            <>
              <p className={styles.bodyText}>
                Confirm your existing account password to link single sign-on for {linkPrompt.email}
                .
              </p>
              <form
                className={styles.formStack}
                onSubmit={confirmForm.handleSubmit((values) =>
                  confirmLink.mutate({
                    linkToken: linkPrompt.linkToken,
                    password: values.password,
                  }),
                )}
              >
                <label className={styles.fieldLabel} htmlFor="sso-confirm-password">
                  Password
                </label>
                <InputBase
                  wrapperClassName={styles.inputWrapper}
                  inputClassName={styles.inputField}
                  id="sso-confirm-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(confirmPasswordError)}
                  aria-describedby={confirmPasswordError ? "sso-confirm-password-error" : undefined}
                  value={confirmForm.watch("password") ?? ""}
                  onChange={(value) =>
                    confirmForm.setValue("password", normalizeInputValue(value), {
                      shouldDirty: true,
                    })
                  }
                />
                {confirmPasswordError ? (
                  <p id="sso-confirm-password-error" className={styles.errorText} role="alert">
                    {confirmPasswordError}
                  </p>
                ) : null}
                {confirmErrorMessage ? (
                  <p className={styles.errorText} role="alert">
                    {confirmErrorMessage}
                  </p>
                ) : null}
                <Button
                  className={styles.primaryButton}
                  color="tertiary"
                  type="submit"
                  isDisabled={confirmLink.isPending}
                >
                  {confirmLink.isPending ? "Confirming..." : "Confirm and continue"}
                </Button>
              </form>
            </>
          ) : callbackError ? (
            <>
              <p className={styles.errorText} role="alert">
                {callbackError}
              </p>
              <Link className={styles.link} to="/">
                Return to sign in
              </Link>
            </>
          ) : (
            <p className={styles.bodyText}>Completing single sign-on...</p>
          )}
        </section>
      </div>
    </main>
  );
};
