import { trpc } from "@/api/trpc";
import { redirectToUrl } from "@/features/auth/lib/sso";
import { type AuthInput, authSchema } from "@/features/shared/lib/schemas";
import { getErrorMessage } from "@/lib/errors";
import { normalizeInputValue } from "@/lib/normalize";
import { queryKeys } from "@/lib/query-keys";
import * as a11yStyles from "@/styles/a11y.css";
import { Button } from "@/ui/Button";
import { InputBase } from "@/ui/InputBase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as styles from "./AuthPage.css";

export const AuthPage = () => {
  const qc = useQueryClient();
  const registerForm = useForm<AuthInput>({ resolver: zodResolver(authSchema) });
  const loginForm = useForm<AuthInput>({
    resolver: zodResolver(authSchema.pick({ email: true, password: true })),
  });
  const ssoConfig = useQuery({
    queryKey: queryKeys.ssoConfig,
    queryFn: () => trpc.auth.ssoConfig.query(),
    retry: false,
  });

  const register = useMutation({
    mutationFn: (input: AuthInput) =>
      trpc.auth.registerWithPassword.mutate({
        email: input.email,
        password: input.password,
        displayName: input.displayName ?? input.email,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.me });
      registerForm.reset();
    },
  });

  const login = useMutation({
    mutationFn: (input: AuthInput) =>
      trpc.auth.loginWithPassword.mutate({ email: input.email, password: input.password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.me });
      loginForm.reset();
    },
  });
  const ssoBegin = useMutation({
    mutationFn: () => trpc.auth.ssoBegin.query(),
    onSuccess: (payload) => {
      redirectToUrl(payload.authorizeUrl);
    },
  });

  const loginErrorMessage =
    login.error &&
    "data" in login.error &&
    login.error.data &&
    typeof login.error.data === "object" &&
    "code" in login.error.data &&
    login.error.data.code === "UNAUTHORIZED"
      ? "Invalid email or password."
      : login.error
        ? getErrorMessage(login.error)
        : null;
  const registerEmailError = registerForm.formState.errors.email?.message;
  const registerPasswordError = registerForm.formState.errors.password?.message;
  const registerErrorMessage = register.error ? getErrorMessage(register.error) : null;
  const loginEmailError = loginForm.formState.errors.email?.message;
  const loginPasswordError = loginForm.formState.errors.password?.message;
  const showSsoAction = ssoConfig.data?.enabled === true;
  const ssoErrorMessage = ssoBegin.error ? getErrorMessage(ssoBegin.error) : null;

  return (
    <main className={styles.page} id="main-content" tabIndex={-1}>
      <div className={styles.container}>
        <h1 className={a11yStyles.srOnly}>Obelus authentication</h1>
        <header className={styles.authHeader}>
          <div className={styles.logo}>
            <span className={styles.logoSymbol}>÷</span>
            <span className={styles.logoText}>Obelus</span>
          </div>
          <p className={styles.headerMetaText}>Private reading record</p>
        </header>

        <section className={styles.authGrid}>
          <article className={styles.card}>
            <h2 className={styles.pageTitle}>Create account</h2>
            <p className={styles.mutedBody}>Establish your private editorial record.</p>
            <form
              onSubmit={registerForm.handleSubmit((values) => register.mutate(values))}
              className={styles.formStack}
            >
              <label className={styles.fieldLabel} htmlFor="register-email">
                Email
              </label>
              <InputBase
                wrapperClassName={styles.inputWrapper}
                inputClassName={styles.inputField}
                id="register-email"
                autoComplete="email"
                aria-invalid={Boolean(registerEmailError)}
                aria-describedby={registerEmailError ? "register-email-error" : undefined}
                value={registerForm.watch("email") ?? ""}
                onChange={(value) =>
                  registerForm.setValue("email", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {registerEmailError ? (
                <p id="register-email-error" className={styles.errorText} role="alert">
                  {registerEmailError}
                </p>
              ) : null}

              <label className={styles.fieldLabel} htmlFor="register-display-name">
                Display Name (Optional)
              </label>
              <InputBase
                wrapperClassName={styles.inputWrapper}
                inputClassName={styles.inputField}
                id="register-display-name"
                autoComplete="name"
                value={registerForm.watch("displayName") ?? ""}
                onChange={(value) =>
                  registerForm.setValue("displayName", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />

              <label className={styles.fieldLabel} htmlFor="register-password">
                Password
              </label>
              <InputBase
                wrapperClassName={styles.inputWrapper}
                inputClassName={styles.inputField}
                id="register-password"
                type="password"
                autoComplete="new-password"
                aria-invalid={Boolean(registerPasswordError)}
                aria-describedby={registerPasswordError ? "register-password-error" : undefined}
                value={registerForm.watch("password") ?? ""}
                onChange={(value) =>
                  registerForm.setValue("password", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {registerPasswordError ? (
                <p id="register-password-error" className={styles.errorText} role="alert">
                  {registerPasswordError}
                </p>
              ) : null}
              {registerErrorMessage ? (
                <p className={styles.errorText} role="alert">
                  {registerErrorMessage}
                </p>
              ) : null}

              <Button
                className={styles.primaryButton}
                color="tertiary"
                type="submit"
                isDisabled={register.isPending}
              >
                {register.isPending ? "Creating account..." : "Create account"}
              </Button>
            </form>
          </article>

          <article className={styles.card}>
            <h2 className={styles.pageTitle}>Sign in</h2>
            <p className={styles.mutedBody}>Return to your existing record.</p>
            <form
              onSubmit={loginForm.handleSubmit((values) => login.mutate(values))}
              className={styles.formStack}
            >
              <label className={styles.fieldLabel} htmlFor="login-email">
                Email
              </label>
              <InputBase
                wrapperClassName={styles.inputWrapper}
                inputClassName={styles.inputField}
                id="login-email"
                autoComplete="email"
                aria-invalid={Boolean(loginEmailError)}
                aria-describedby={loginEmailError ? "login-email-error" : undefined}
                value={loginForm.watch("email") ?? ""}
                onChange={(value) =>
                  loginForm.setValue("email", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {loginEmailError ? (
                <p id="login-email-error" className={styles.errorText} role="alert">
                  {loginEmailError}
                </p>
              ) : null}

              <label className={styles.fieldLabel} htmlFor="login-password">
                Password
              </label>
              <InputBase
                wrapperClassName={styles.inputWrapper}
                inputClassName={styles.inputField}
                id="login-password"
                type="password"
                autoComplete="current-password"
                aria-invalid={Boolean(loginPasswordError)}
                aria-describedby={loginPasswordError ? "login-password-error" : undefined}
                value={loginForm.watch("password") ?? ""}
                onChange={(value) =>
                  loginForm.setValue("password", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {loginPasswordError ? (
                <p id="login-password-error" className={styles.errorText} role="alert">
                  {loginPasswordError}
                </p>
              ) : null}
              {loginErrorMessage ? (
                <p className={styles.errorText} role="alert">
                  {loginErrorMessage}
                </p>
              ) : null}

              <Button
                className={styles.primaryButton}
                color="tertiary"
                type="submit"
                isDisabled={login.isPending}
              >
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>

              {showSsoAction ? (
                <>
                  <div className={styles.ssoDivider} aria-hidden="true">
                    <span className={styles.ssoDividerLine} />
                    <span className={styles.ssoDividerLabel}>or</span>
                    <span className={styles.ssoDividerLine} />
                  </div>
                  <Button
                    className={styles.secondaryButton}
                    color="tertiary"
                    type="button"
                    isDisabled={ssoBegin.isPending}
                    onClick={() => ssoBegin.mutate()}
                  >
                    {ssoBegin.isPending ? "Redirecting..." : "Continue with single sign-on"}
                  </Button>
                  {ssoErrorMessage ? (
                    <p className={styles.errorText} role="alert">
                      {ssoErrorMessage}
                    </p>
                  ) : null}
                </>
              ) : null}
            </form>
          </article>
        </section>
      </div>
    </main>
  );
};
