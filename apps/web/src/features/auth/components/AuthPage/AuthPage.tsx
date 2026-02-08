import { trpc } from "@/api/trpc";
import { type AuthInput, authSchema } from "@/features/shared/lib/schemas";
import { getErrorMessage } from "@/lib/errors";
import { normalizeInputValue } from "@/lib/normalize";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/ui/Button";
import { InputBase } from "@/ui/InputBase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import * as styles from "./AuthPage.css";

export const AuthPage = () => {
  const qc = useQueryClient();
  const registerForm = useForm<AuthInput>({ resolver: zodResolver(authSchema) });
  const loginForm = useForm<AuthInput>({
    resolver: zodResolver(authSchema.pick({ email: true, password: true })),
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

  return (
    <main className={styles.page}>
      <div className={styles.container}>
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
                value={registerForm.watch("email") ?? ""}
                onChange={(value) =>
                  registerForm.setValue("email", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {registerForm.formState.errors.email ? (
                <p className={styles.errorText}>{registerForm.formState.errors.email.message}</p>
              ) : null}

              <label className={styles.fieldLabel} htmlFor="register-display-name">
                Display Name (Optional)
              </label>
              <InputBase
                wrapperClassName={styles.inputWrapper}
                inputClassName={styles.inputField}
                id="register-display-name"
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
                value={registerForm.watch("password") ?? ""}
                onChange={(value) =>
                  registerForm.setValue("password", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {registerForm.formState.errors.password ? (
                <p className={styles.errorText}>{registerForm.formState.errors.password.message}</p>
              ) : null}
              {register.error ? (
                <p className={styles.errorText}>{getErrorMessage(register.error)}</p>
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
                value={loginForm.watch("email") ?? ""}
                onChange={(value) =>
                  loginForm.setValue("email", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {loginForm.formState.errors.email ? (
                <p className={styles.errorText}>{loginForm.formState.errors.email.message}</p>
              ) : null}

              <label className={styles.fieldLabel} htmlFor="login-password">
                Password
              </label>
              <InputBase
                wrapperClassName={styles.inputWrapper}
                inputClassName={styles.inputField}
                id="login-password"
                type="password"
                value={loginForm.watch("password") ?? ""}
                onChange={(value) =>
                  loginForm.setValue("password", normalizeInputValue(value), {
                    shouldDirty: true,
                  })
                }
              />
              {loginForm.formState.errors.password ? (
                <p className={styles.errorText}>{loginForm.formState.errors.password.message}</p>
              ) : null}
              {login.error ? (
                <p className={styles.errorText}>{getErrorMessage(login.error)}</p>
              ) : null}

              <Button
                className={styles.primaryButton}
                color="tertiary"
                type="submit"
                isDisabled={login.isPending}
              >
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
};
