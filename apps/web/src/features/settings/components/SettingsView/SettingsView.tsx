import { trpc } from "@/api/trpc";
import {
  type PasswordInput,
  type ProfileInput,
  passwordSchema,
  profileSchema,
} from "@/features/shared/lib/schemas";
import { copyTextToClipboard } from "@/lib/clipboard";
import { getErrorMessage } from "@/lib/errors";
import { normalizeInputValue } from "@/lib/normalize";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/ui/Button";
import { InputBase } from "@/ui/InputBase";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as styles from "./SettingsView.css";

export const SettingsView = ({
  me,
}: {
  me: {
    id: string;
    email: string;
    displayName: string;
    collectionVisibility: "private" | "public";
  };
}) => {
  const qc = useQueryClient();
  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: me.displayName,
      collectionVisibility: me.collectionVisibility,
    },
  });

  const passwordForm = useForm<PasswordInput>({
    resolver: zodResolver(passwordSchema),
  });

  useEffect(() => {
    profileForm.reset({
      displayName: me.displayName,
      collectionVisibility: me.collectionVisibility,
    });
  }, [me.collectionVisibility, me.displayName, profileForm]);

  const saveProfile = useMutation({
    mutationFn: (input: ProfileInput) => trpc.library.updateProfile.mutate(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.me });
      setProfileSaveMessage("Profile saved.");
      window.setTimeout(() => setProfileSaveMessage(null), 1800);
    },
  });

  const changePassword = useMutation({
    mutationFn: (input: PasswordInput) =>
      trpc.auth.changePassword.mutate({
        currentPassword: input.currentPassword,
        newPassword: input.newPassword,
      }),
    onSuccess: () => {
      passwordForm.reset();
      setPasswordSaveMessage("Password updated.");
      window.setTimeout(() => setPasswordSaveMessage(null), 1800);
    },
  });

  const publicUrl = `${window.location.origin}/public/${me.id}`;
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState<string | null>(null);
  const [isCopyingPublicUrl, setIsCopyingPublicUrl] = useState(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);
  const [passwordSaveMessage, setPasswordSaveMessage] = useState<string | null>(null);

  const copyPublicUrl = async () => {
    setIsCopyingPublicUrl(true);
    const ok = await copyTextToClipboard(publicUrl);
    if (ok) {
      setCopiedPublicUrl(true);
      setCopyToastMessage("Public URL copied.");
      window.setTimeout(() => setCopiedPublicUrl(false), 1800);
      window.setTimeout(() => setCopyToastMessage(null), 1800);
    } else {
      setCopiedPublicUrl(false);
    }
    setIsCopyingPublicUrl(false);
  };

  return (
    <section className={styles.analyticsView}>
      <article className={styles.card}>
        <h3 className={styles.sectionTitle}>Profile</h3>
        <form
          className={styles.formStack}
          onSubmit={profileForm.handleSubmit((values) => saveProfile.mutate(values))}
        >
          <div className={styles.fieldStack}>
            <label className={styles.fieldLabel} htmlFor="settings-email">
              Email
            </label>
            <InputBase
              wrapperClassName={styles.inputWrapper}
              inputClassName={styles.inputField}
              id="settings-email"
              value={me.email}
              readOnly
            />
          </div>

          <div className={styles.fieldStack}>
            <label className={styles.fieldLabel} htmlFor="settings-display-name">
              Display Name
            </label>
            <InputBase
              wrapperClassName={styles.inputWrapper}
              inputClassName={styles.inputField}
              id="settings-display-name"
              value={profileForm.watch("displayName") ?? ""}
              onChange={(value) => {
                setProfileSaveMessage(null);
                profileForm.setValue("displayName", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {profileForm.formState.errors.displayName ? (
              <p className={styles.errorText}>{profileForm.formState.errors.displayName.message}</p>
            ) : null}
          </div>

          <div className={styles.fieldStack}>
            <label className={styles.fieldLabel} htmlFor="settings-visibility">
              Collection Visibility
            </label>
            <select
              id="settings-visibility"
              className={styles.nativeSelect}
              value={profileForm.watch("collectionVisibility")}
              onChange={(event) => {
                setProfileSaveMessage(null);
                profileForm.setValue(
                  "collectionVisibility",
                  event.target.value as "private" | "public",
                  {
                    shouldDirty: true,
                  },
                );
              }}
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <p className={styles.fieldLabel}>Public Profile Link</p>
            <div className={styles.headerActionRow}>
              <a className={styles.linkButton} href={publicUrl} target="_blank" rel="noreferrer">
                {publicUrl}
              </a>
              <Button
                className={styles.ghostButton}
                color="tertiary"
                type="button"
                isDisabled={isCopyingPublicUrl}
                onClick={() => void copyPublicUrl()}
              >
                {isCopyingPublicUrl ? "Copying..." : copiedPublicUrl ? "Copied" : "Copy"}
              </Button>
            </div>
          </div>

          {saveProfile.error ? (
            <p className={styles.errorText}>{getErrorMessage(saveProfile.error)}</p>
          ) : null}
          {profileSaveMessage ? (
            <p className={styles.successText} aria-live="polite">
              {profileSaveMessage}
            </p>
          ) : null}
          <div className={styles.actionRow}>
            <Button
              className={styles.primaryButton}
              color="tertiary"
              type="submit"
              isDisabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? "Saving..." : "Save profile"}
            </Button>
          </div>
        </form>
      </article>

      <article className={styles.card}>
        <h3 className={styles.sectionTitle}>Password</h3>
        <form
          className={styles.formStack}
          onSubmit={passwordForm.handleSubmit((values) => changePassword.mutate(values))}
        >
          <div className={styles.fieldStack}>
            <label className={styles.fieldLabel} htmlFor="current-password">
              Current Password
            </label>
            <InputBase
              wrapperClassName={styles.inputWrapper}
              inputClassName={styles.inputField}
              id="current-password"
              type="password"
              autoComplete="current-password"
              value={passwordForm.watch("currentPassword") ?? ""}
              onChange={(value) => {
                setPasswordSaveMessage(null);
                passwordForm.setValue("currentPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {passwordForm.formState.errors.currentPassword ? (
              <p className={styles.errorText}>
                {passwordForm.formState.errors.currentPassword.message}
              </p>
            ) : null}
          </div>

          <div className={styles.fieldStack}>
            <label className={styles.fieldLabel} htmlFor="new-password">
              New Password
            </label>
            <InputBase
              wrapperClassName={styles.inputWrapper}
              inputClassName={styles.inputField}
              id="new-password"
              type="password"
              autoComplete="new-password"
              value={passwordForm.watch("newPassword") ?? ""}
              onChange={(value) => {
                setPasswordSaveMessage(null);
                passwordForm.setValue("newPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {passwordForm.formState.errors.newPassword ? (
              <p className={styles.errorText}>
                {passwordForm.formState.errors.newPassword.message}
              </p>
            ) : null}
          </div>

          <div className={styles.fieldStack}>
            <label className={styles.fieldLabel} htmlFor="confirm-password">
              Confirm Password
            </label>
            <InputBase
              wrapperClassName={styles.inputWrapper}
              inputClassName={styles.inputField}
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              value={passwordForm.watch("confirmPassword") ?? ""}
              onChange={(value) => {
                setPasswordSaveMessage(null);
                passwordForm.setValue("confirmPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {passwordForm.formState.errors.confirmPassword ? (
              <p className={styles.errorText}>
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {changePassword.error ? (
            <p className={styles.errorText}>{getErrorMessage(changePassword.error)}</p>
          ) : null}
          {passwordSaveMessage ? (
            <p className={styles.successText} aria-live="polite">
              {passwordSaveMessage}
            </p>
          ) : null}

          <div className={styles.actionRow}>
            <Button
              className={styles.primaryButton}
              color="tertiary"
              type="submit"
              isDisabled={changePassword.isPending}
            >
              {changePassword.isPending ? "Updating..." : "Change password"}
            </Button>
          </div>
        </form>
      </article>
      {copyToastMessage ? <div className={styles.toast}>{copyToastMessage}</div> : null}
    </section>
  );
};
