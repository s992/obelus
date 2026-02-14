import { trpc } from "@/api/trpc";
import {
  type GoodreadsImportLiveConnectionState,
  type GoodreadsImportSnapshot,
  createGoodreadsImport,
  getGoodreadsImport,
  listGoodreadsImports,
  subscribeToGoodreadsImportEvents,
} from "@/features/settings/lib/goodreads-import-client";
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
import type { GoodreadsImportRecord, JudgmentWithUnjudged } from "@obelus/shared";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import * as styles from "./SettingsView.css";

const isImportActive = (status: string | undefined): boolean => {
  return status === "queued" || status === "processing";
};

const upsertImportRecord = (
  records: GoodreadsImportRecord[] | undefined,
  incoming: GoodreadsImportSnapshot,
) => {
  const next = [...(records ?? [])];
  const index = next.findIndex((entry) => entry.id === incoming.id);
  if (index >= 0) {
    next[index] = incoming;
  } else {
    next.unshift(incoming);
  }

  next.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  return next;
};

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

  const [selectedImportFile, setSelectedImportFile] = useState<File | null>(null);
  const [mapRatings, setMapRatings] = useState(true);
  const [ratingStar1, setRatingStar1] = useState<JudgmentWithUnjudged>("Rejected");
  const [ratingStar2, setRatingStar2] = useState<JudgmentWithUnjudged>("Rejected");
  const [ratingStar3, setRatingStar3] = useState<JudgmentWithUnjudged>("Unjudged");
  const [ratingStar4, setRatingStar4] = useState<JudgmentWithUnjudged>("Accepted");
  const [ratingStar5, setRatingStar5] = useState<JudgmentWithUnjudged>("Accepted");
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedImportId, setSelectedImportId] = useState<string | null>(null);
  const [importLiveConnectionState, setImportLiveConnectionState] =
    useState<GoodreadsImportLiveConnectionState>("idle");

  const importsQuery = useQuery({
    queryKey: queryKeys.goodreadsImports,
    queryFn: () => listGoodreadsImports(),
  });

  useEffect(() => {
    if (!selectedImportId && importsQuery.data && importsQuery.data.length > 0) {
      setSelectedImportId(importsQuery.data[0]?.id ?? null);
    }
  }, [selectedImportId, importsQuery.data]);

  const selectedImportQuery = useQuery({
    queryKey: queryKeys.goodreadsImport(selectedImportId),
    queryFn: () => {
      if (!selectedImportId) {
        throw new Error("No import selected.");
      }
      return getGoodreadsImport(selectedImportId);
    },
    enabled: Boolean(selectedImportId),
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) {
        return selectedImportId ? 2500 : false;
      }

      if (!isImportActive(data.status)) {
        return false;
      }

      return importLiveConnectionState === "connected" ? 15_000 : 2_500;
    },
  });

  useEffect(() => {
    if (!selectedImportId) {
      setImportLiveConnectionState("idle");
      return;
    }

    const status = selectedImportQuery.data?.status;
    if (status && !isImportActive(status)) {
      setImportLiveConnectionState("idle");
      return;
    }

    return subscribeToGoodreadsImportEvents({
      importId: selectedImportId,
      onConnectionStateChange: (state) => {
        setImportLiveConnectionState(state);
      },
      onSnapshot: (snapshot) => {
        qc.setQueryData(queryKeys.goodreadsImport(snapshot.id), snapshot);
        qc.setQueryData(
          queryKeys.goodreadsImports,
          (existing: GoodreadsImportRecord[] | undefined) => upsertImportRecord(existing, snapshot),
        );
      },
      onError: () => {
        // Polling remains active while stream is degraded.
      },
    });
  }, [qc, selectedImportId, selectedImportQuery.data?.status]);

  const uploadImport = useMutation({
    mutationFn: async () => {
      if (!selectedImportFile) {
        throw new Error("Choose a Goodreads CSV file before importing.");
      }

      const { importId } = await createGoodreadsImport({
        file: selectedImportFile,
        options: {
          mapRatings,
          ratings: {
            star1: ratingStar1,
            star2: ratingStar2,
            star3: ratingStar3,
            star4: ratingStar4,
            star5: ratingStar5,
          },
        },
      });

      return importId;
    },
    onSuccess: async (importId) => {
      setImportError(null);
      setImportMessage("Import queued. You can leave this page and return to review results.");
      setSelectedImportId(importId);
      await Promise.all([
        qc.invalidateQueries({ queryKey: queryKeys.goodreadsImports }),
        qc.invalidateQueries({ queryKey: queryKeys.goodreadsImport(importId) }),
      ]);
    },
    onError: (error) => {
      setImportMessage(null);
      setImportError(getErrorMessage(error));
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
  const displayNameError = profileForm.formState.errors.displayName?.message;
  const currentPasswordError = passwordForm.formState.errors.currentPassword?.message;
  const newPasswordError = passwordForm.formState.errors.newPassword?.message;
  const confirmPasswordError = passwordForm.formState.errors.confirmPassword?.message;
  const saveProfileError = saveProfile.error ? getErrorMessage(saveProfile.error) : null;
  const changePasswordError = changePassword.error ? getErrorMessage(changePassword.error) : null;

  const currentImport = selectedImportQuery.data ?? null;
  const allIssues = currentImport?.issues ?? [];
  const warningIssues = allIssues.filter((issue) => issue.severity === "warning");
  const errorIssues = allIssues.filter((issue) => issue.severity === "error");

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
              aria-invalid={Boolean(displayNameError)}
              aria-describedby={displayNameError ? "settings-display-name-error" : undefined}
              value={profileForm.watch("displayName") ?? ""}
              onChange={(value) => {
                setProfileSaveMessage(null);
                profileForm.setValue("displayName", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {displayNameError ? (
              <p id="settings-display-name-error" className={styles.errorText} role="alert">
                {displayNameError}
              </p>
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

          {saveProfileError ? (
            <p className={styles.errorText} role="alert">
              {saveProfileError}
            </p>
          ) : null}
          {profileSaveMessage ? (
            <output className={styles.successText} aria-live="polite">
              {profileSaveMessage}
            </output>
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
              aria-invalid={Boolean(currentPasswordError)}
              aria-describedby={
                currentPasswordError ? "settings-current-password-error" : undefined
              }
              value={passwordForm.watch("currentPassword") ?? ""}
              onChange={(value) => {
                setPasswordSaveMessage(null);
                passwordForm.setValue("currentPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {currentPasswordError ? (
              <p id="settings-current-password-error" className={styles.errorText} role="alert">
                {currentPasswordError}
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
              aria-invalid={Boolean(newPasswordError)}
              aria-describedby={newPasswordError ? "settings-new-password-error" : undefined}
              value={passwordForm.watch("newPassword") ?? ""}
              onChange={(value) => {
                setPasswordSaveMessage(null);
                passwordForm.setValue("newPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {newPasswordError ? (
              <p id="settings-new-password-error" className={styles.errorText} role="alert">
                {newPasswordError}
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
              aria-invalid={Boolean(confirmPasswordError)}
              aria-describedby={
                confirmPasswordError ? "settings-confirm-password-error" : undefined
              }
              value={passwordForm.watch("confirmPassword") ?? ""}
              onChange={(value) => {
                setPasswordSaveMessage(null);
                passwordForm.setValue("confirmPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                });
              }}
            />
            {confirmPasswordError ? (
              <p id="settings-confirm-password-error" className={styles.errorText} role="alert">
                {confirmPasswordError}
              </p>
            ) : null}
          </div>

          {changePasswordError ? (
            <p className={styles.errorText} role="alert">
              {changePasswordError}
            </p>
          ) : null}
          {passwordSaveMessage ? (
            <output className={styles.successText} aria-live="polite">
              {passwordSaveMessage}
            </output>
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

      <article className={styles.card}>
        <h3 className={styles.sectionTitle}>Import Goodreads Library</h3>
        <p className={styles.hintText}>
          Upload your Goodreads CSV export. Import progress and history are tracked below.
        </p>
        <div className={styles.noticeBox}>
          <p className={styles.noticeTitle}>Import limitations and assumptions</p>
          <ul className={styles.noticeList}>
            <li>Books are matched using Hardcover metadata and may not always resolve.</li>
            <li>
              When dates or shelf data are incomplete, inferred values are used and logged as
              warnings.
            </li>
            <li>Import continues even if some books fail.</li>
          </ul>
        </div>

        <div className={styles.formStack}>
          <div className={styles.fieldStack}>
            <label className={styles.fieldLabel} htmlFor="goodreads-csv-upload">
              Goodreads CSV File
            </label>
            <input
              id="goodreads-csv-upload"
              className={styles.fileInput}
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedImportFile(file);
                setImportError(null);
                setImportMessage(null);
              }}
            />
          </div>

          <div className={styles.fieldStack}>
            <label className={styles.checkboxRow} htmlFor="goodreads-map-ratings">
              <input
                id="goodreads-map-ratings"
                type="checkbox"
                checked={mapRatings}
                onChange={(event) => setMapRatings(event.target.checked)}
              />
              <span>Map Goodreads star ratings to Obelus judgment</span>
            </label>
          </div>

          <div className={styles.ratingGrid}>
            {[
              { star: 1, value: ratingStar1, set: setRatingStar1 },
              { star: 2, value: ratingStar2, set: setRatingStar2 },
              { star: 3, value: ratingStar3, set: setRatingStar3 },
              { star: 4, value: ratingStar4, set: setRatingStar4 },
              { star: 5, value: ratingStar5, set: setRatingStar5 },
            ].map((entry) => (
              <div className={styles.fieldStack} key={entry.star}>
                <label className={styles.fieldLabel} htmlFor={`rating-map-${entry.star}`}>
                  {entry.star} star{entry.star > 1 ? "s" : ""}
                </label>
                <select
                  id={`rating-map-${entry.star}`}
                  className={styles.nativeSelect}
                  disabled={!mapRatings}
                  value={entry.value}
                  onChange={(event) => entry.set(event.target.value as JudgmentWithUnjudged)}
                >
                  <option value="Rejected">Rejected</option>
                  <option value="Unjudged">Unjudged</option>
                  <option value="Accepted">Accepted</option>
                </select>
              </div>
            ))}
          </div>

          <p className={styles.hintText}>Unrated books (0 stars) always import as Unjudged.</p>

          {importError ? (
            <p className={styles.errorText} role="alert">
              {importError}
            </p>
          ) : null}
          {importMessage ? (
            <output className={styles.successText} aria-live="polite">
              {importMessage}
            </output>
          ) : null}

          <div className={styles.actionRow}>
            <Button
              className={styles.primaryButton}
              color="tertiary"
              type="button"
              isDisabled={!selectedImportFile || uploadImport.isPending}
              onClick={() => uploadImport.mutate()}
            >
              {uploadImport.isPending ? "Queueing import..." : "Import Goodreads CSV"}
            </Button>
          </div>
        </div>

        <section className={styles.importHistory}>
          <h4 className={styles.sectionSubTitle}>Import history</h4>
          {importsQuery.data && importsQuery.data.length > 0 ? (
            <table className={styles.issueTable}>
              <thead>
                <tr>
                  <th scope="col">Created</th>
                  <th scope="col">File</th>
                  <th scope="col">Status</th>
                  <th scope="col">Action</th>
                </tr>
              </thead>
              <tbody>
                {importsQuery.data.map((entry) => (
                  <tr key={entry.id}>
                    <td>{new Date(entry.createdAt).toLocaleString()}</td>
                    <td>{entry.filename}</td>
                    <td>{entry.status.replaceAll("_", " ")}</td>
                    <td>
                      <Button
                        className={styles.ghostButton}
                        color="tertiary"
                        type="button"
                        onClick={() => {
                          setSelectedImportId(entry.id);
                          setImportMessage(null);
                          setImportError(null);
                        }}
                      >
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className={styles.hintText}>No imports yet.</p>
          )}
        </section>

        {currentImport ? (
          <section className={styles.importSummary}>
            <h4 className={styles.sectionSubTitle}>Selected import details</h4>
            <p className={styles.hintText}>Status: {currentImport.status.replaceAll("_", " ")}</p>
            {isImportActive(currentImport.status) ? (
              <p className={styles.hintText}>
                Live updates:{" "}
                {importLiveConnectionState === "connected"
                  ? "connected"
                  : importLiveConnectionState === "connecting"
                    ? "connecting..."
                    : importLiveConnectionState === "degraded"
                      ? "reconnecting (polling fallback active)"
                      : "idle"}
              </p>
            ) : null}
            <div className={styles.summaryGrid}>
              <p className={styles.summaryChip}>Total: {currentImport.summary.totalRows}</p>
              <p className={styles.summaryChip}>Processed: {currentImport.summary.processedRows}</p>
              <p className={styles.summaryChip}>Imported: {currentImport.summary.importedRows}</p>
              <p className={styles.summaryChip}>Failed: {currentImport.summary.failedRows}</p>
              <p className={styles.summaryChip}>Warnings: {currentImport.summary.warningRows}</p>
            </div>

            {warningIssues.length > 0 ? (
              <div className={styles.issueTableWrap}>
                <p className={styles.noticeTitle}>Warnings</p>
                <table className={styles.issueTable}>
                  <thead>
                    <tr>
                      <th scope="col">Row</th>
                      <th scope="col">Book</th>
                      <th scope="col">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warningIssues.map((issue) => (
                      <tr key={issue.id}>
                        <td>{issue.rowNumber}</td>
                        <td>
                          {issue.bookTitle} - {issue.author}
                        </td>
                        <td>{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {errorIssues.length > 0 ? (
              <div className={styles.issueTableWrap}>
                <p className={styles.noticeTitle}>Failed rows</p>
                <table className={styles.issueTable}>
                  <thead>
                    <tr>
                      <th scope="col">Row</th>
                      <th scope="col">Book</th>
                      <th scope="col">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {errorIssues.map((issue) => (
                      <tr key={issue.id}>
                        <td>{issue.rowNumber}</td>
                        <td>
                          {issue.bookTitle} - {issue.author}
                        </td>
                        <td>{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}
      </article>
      {copyToastMessage ? (
        <output className={styles.toast} aria-live="polite" aria-atomic="true">
          {copyToastMessage}
        </output>
      ) : null}
    </section>
  );
};
