import { zodResolver } from "@hookform/resolvers/zod";
import type { DashboardReport } from "@obelus/shared";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { SearchLg } from "@untitledui/icons/SearchLg";
import { XClose } from "@untitledui/icons/XClose";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Navigate, Route, Routes, useLocation, useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { trpc } from "./api/trpc";
import { Button as UiButton } from "./generated/components/base/buttons/button";
import { InputBase } from "./generated/components/base/input/input";
import { TextAreaBase } from "./generated/components/base/textarea/textarea";
import * as styles from "./styles/app.css";

const authSchema = z.object({
  email: z.string().min(1, "Email is required.").email("Email must be a valid email address."),
  password: z
    .string()
    .min(1, "Password is required.")
    .min(8, "Password must be at least 8 characters."),
  displayName: z.preprocess((value) => {
    if (typeof value !== "string") {
      return value;
    }
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : undefined;
  }, z.string().min(1).optional()),
});

const optionalNumberField = (minimum: number, maximum: number) =>
  z.preprocess((value) => {
    if (value === "" || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  }, z.number().min(minimum).max(maximum).optional());

const readingSchema = z.object({
  startedAt: z.string().min(1, "Start date is required."),
  finishedAt: z.string().optional(),
  progressPercent: optionalNumberField(0, 100),
  judgment: z.enum(["Accepted", "Rejected"]).optional(),
  notes: z.string().optional(),
});

const toReadSchema = z.object({
  priority: optionalNumberField(1, 5),
  notes: z.string().optional(),
});

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required.").max(120, "Display name is too long."),
  collectionVisibility: z.enum(["private", "public"]),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(8, "Current password must be at least 8 characters."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(8, "Confirm password must be at least 8 characters."),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "New password and confirmation must match.",
    path: ["confirmPassword"],
  });

type AuthInput = z.infer<typeof authSchema>;
type ReadingInput = z.infer<typeof readingSchema>;
type ToReadInput = z.infer<typeof toReadSchema>;
type ProfileInput = z.infer<typeof profileSchema>;
type PasswordInput = z.infer<typeof passwordSchema>;
type ReadingTab = "currently-reading" | "planned" | "finished";

const toDate = (value: string | null) => (value ? new Date(value).toLocaleDateString() : "-");
const toDateInputValue = (value: string | null | undefined) =>
  value ? new Date(value).toISOString().slice(0, 10) : "";
const toPublishedLabel = (value: string | null | undefined) =>
  value ? `Published ${value}` : null;
const toPublishedYearLabel = (value: number | null | undefined) =>
  value ? `Published ${value}` : null;
const fallbackTitle = (bookKey: string) => bookKey.split("/").filter(Boolean).pop() ?? bookKey;
const METADATA_DESCRIPTION_COLLAPSE_LENGTH = 280;

const normalizeOptionalString = (value: unknown): string | null => {
  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  if (value && typeof value === "object" && "value" in value && typeof value.value === "string") {
    const normalized = value.value.trim();
    return normalized.length > 0 ? normalized : null;
  }
  return null;
};

const normalizeOptionalNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const normalizeOptionalIsbn13 = (value: unknown): string | null => {
  if (Array.isArray(value)) {
    for (const candidate of value) {
      const normalized = normalizeOptionalString(candidate);
      if (normalized) {
        return normalized;
      }
    }
  }
  return normalizeOptionalString(value);
};

const copyTextToClipboard = async (text: string): Promise<boolean> => {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // fallback below
    }
  }

  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  textarea.style.pointerEvents = "none";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    textarea.remove();
  }
};

const normalizeInputValue = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") {
    if (
      "currentTarget" in value &&
      value.currentTarget &&
      typeof value.currentTarget === "object" &&
      "value" in value.currentTarget &&
      typeof value.currentTarget.value === "string"
    ) {
      return value.currentTarget.value;
    }
    if (
      "target" in value &&
      value.target &&
      typeof value.target === "object" &&
      "value" in value.target &&
      typeof value.target.value === "string"
    ) {
      return value.target.value;
    }
  }
  return "";
};

const normalizeBookKeyFromParam = (value: string | undefined): string | null => {
  if (!value) {
    return null;
  }
  const decoded = (() => {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  })();

  if (!decoded.trim()) {
    return null;
  }

  return decoded.startsWith("/") ? decoded : `/${decoded}`;
};

const coverUrl = (coverId: number | null | undefined, size: "S" | "M" | "L" = "M") => {
  if (!coverId) {
    return null;
  }
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
};

const statusLabel = (entry: {
  finishedAt: string | null;
  judgment: "Accepted" | "Rejected" | null;
}): "Accepted" | "Rejected" | "Reading" | "Unjudged" => {
  if (entry.judgment === "Accepted") return "Accepted";
  if (entry.judgment === "Rejected") return "Rejected";
  if (entry.finishedAt) return "Unjudged";
  return "Reading";
};

const statusClassName = (status: "Accepted" | "Rejected" | "Reading" | "Unjudged") => {
  if (status === "Accepted") return styles.acceptedBadge;
  if (status === "Rejected") return styles.rejectedBadge;
  if (status === "Unjudged") return styles.unjudgedBadge;
  return styles.readingBadge;
};

const BookCover = ({
  coverId,
  title,
  size = "S",
}: {
  coverId: number | null | undefined;
  title: string;
  size?: "S" | "M" | "L";
}) => {
  const src = coverUrl(coverId, size);
  if (!src) {
    return <div className={styles.coverFallback}>No cover</div>;
  }

  return (
    <img
      className={size === "L" ? styles.coverLarge : styles.coverThumb}
      src={src}
      alt={`Cover for ${title}`}
      loading="lazy"
    />
  );
};

const LoadingObelus = ({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) => (
  <div className={compact ? styles.loadingStateCompact : styles.loadingState}>
    <p className={styles.loadingObelus}>÷</p>
    <p className={styles.loadingText}>{label}</p>
  </div>
);

const AuthPage = () => {
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
      qc.invalidateQueries({ queryKey: ["me"] });
      registerForm.reset();
    },
  });

  const login = useMutation({
    mutationFn: (input: AuthInput) =>
      trpc.auth.loginWithPassword.mutate({ email: input.email, password: input.password }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["me"] });
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
              {register.error ? <p className={styles.errorText}>{register.error.message}</p> : null}

              <UiButton
                className={styles.primaryButton}
                color="tertiary"
                type="submit"
                isDisabled={register.isPending}
              >
                {register.isPending ? "Creating account..." : "Create account"}
              </UiButton>
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
              {login.error ? <p className={styles.errorText}>{login.error.message}</p> : null}

              <UiButton
                className={styles.primaryButton}
                color="tertiary"
                type="submit"
                isDisabled={login.isPending}
              >
                {login.isPending ? "Signing in..." : "Sign in"}
              </UiButton>
            </form>
          </article>
        </section>
      </div>
    </main>
  );
};

const ReadingWorkspace = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const params = useParams();

  const selectedBookKey = useMemo(() => normalizeBookKeyFromParam(params["*"]), [params]);

  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [readingTab, setReadingTab] = useState<ReadingTab>("currently-reading");
  const [expandedMetadataBookKey, setExpandedMetadataBookKey] = useState<string | null>(null);
  const isSearchMode = searchInput.trim().length > 0;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const searchResults = useQuery({
    queryKey: ["book-search", debouncedSearch],
    queryFn: () => trpc.books.search.query({ query: debouncedSearch }),
    enabled: debouncedSearch.length > 1,
    staleTime: 5 * 60 * 1000,
  });

  const detail = useQuery({
    queryKey: ["book-detail", selectedBookKey],
    queryFn: async () => {
      if (!selectedBookKey) {
        throw new Error("No book selected.");
      }
      return trpc.books.detail.query({ key: selectedBookKey });
    },
    enabled: Boolean(selectedBookKey),
    staleTime: 5 * 60 * 1000,
  });

  const reading = useQuery({
    queryKey: ["reading"],
    queryFn: () => trpc.library.listReading.query(),
  });

  const toRead = useQuery({
    queryKey: ["to-read"],
    queryFn: () => trpc.library.listToRead.query(),
  });

  const readingForm = useForm<ReadingInput>({ resolver: zodResolver(readingSchema) });
  const toReadForm = useForm<ToReadInput>({ resolver: zodResolver(toReadSchema) });

  const selectedEntry = useMemo(() => {
    if (!selectedBookKey || !reading.data) {
      return null;
    }
    return reading.data.find((entry) => entry.bookKey === selectedBookKey) ?? null;
  }, [reading.data, selectedBookKey]);

  const selectedQueueEntry = useMemo(() => {
    if (!selectedBookKey || !toRead.data) {
      return null;
    }
    return toRead.data.find((entry) => entry.bookKey === selectedBookKey) ?? null;
  }, [toRead.data, selectedBookKey]);

  const addReading = useMutation({
    mutationFn: async (input: ReadingInput) => {
      if (!selectedBookKey) {
        throw new Error("Select a book before saving a reading record.");
      }
      await trpc.library.upsertReading.mutate({
        bookKey: selectedBookKey,
        startedAt: new Date(input.startedAt).toISOString(),
        finishedAt: input.finishedAt ? new Date(input.finishedAt).toISOString() : null,
        progressPercent: Number.isFinite(input.progressPercent)
          ? (input.progressPercent ?? null)
          : null,
        judgment: input.judgment ?? null,
        notes: input.notes ?? null,
      });
      if (selectedQueueEntry?.id) {
        await trpc.library.removeFromToRead.mutate({ id: selectedQueueEntry.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading"] });
      qc.invalidateQueries({ queryKey: ["to-read"] });
      qc.invalidateQueries({ queryKey: ["report"] });
      navigate("/");
    },
  });

  const addQueue = useMutation({
    mutationFn: async (input: ToReadInput) => {
      if (!selectedBookKey) {
        throw new Error("Select a book before adding to planned.");
      }
      await trpc.library.addToRead.mutate({
        bookKey: selectedBookKey,
        priority: Number.isFinite(input.priority) ? (input.priority ?? null) : null,
        notes: input.notes ?? null,
      });
      if (selectedEntry?.id) {
        await trpc.library.removeReading.mutate({ id: selectedEntry.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading"] });
      qc.invalidateQueries({ queryKey: ["to-read"] });
      qc.invalidateQueries({ queryKey: ["report"] });
    },
  });

  const toggleQueue = useMutation({
    mutationFn: async () => {
      if (selectedQueueEntry?.id) {
        await trpc.library.removeFromToRead.mutate({ id: selectedQueueEntry.id });
        return;
      }
      if (!selectedBookKey) {
        throw new Error("Select a book before updating planned status.");
      }
      await trpc.library.addToRead.mutate({
        bookKey: selectedBookKey,
        priority: null,
        notes: null,
      });
      if (selectedEntry?.id) {
        await trpc.library.removeReading.mutate({ id: selectedEntry.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading"] });
      qc.invalidateQueries({ queryKey: ["to-read"] });
      qc.invalidateQueries({ queryKey: ["report"] });
    },
  });

  const toggleReading = useMutation({
    mutationFn: async () => {
      if (!selectedBookKey) {
        throw new Error("Select a book before updating reading status.");
      }
      if (selectedEntry?.id) {
        if (selectedEntry.finishedAt) {
          return;
        }
        await trpc.library.upsertReading.mutate({
          bookKey: selectedBookKey,
          startedAt: selectedEntry.startedAt,
          finishedAt: new Date().toISOString(),
          progressPercent: selectedEntry.progressPercent ?? 100,
          judgment: selectedEntry.judgment,
          notes: selectedEntry.notes,
        });
        return;
      }
      const now = new Date().toISOString();
      await trpc.library.upsertReading.mutate({
        bookKey: selectedBookKey,
        startedAt: now,
        finishedAt: null,
        progressPercent: null,
        judgment: null,
        notes: null,
      });
      if (selectedQueueEntry?.id) {
        await trpc.library.removeFromToRead.mutate({ id: selectedQueueEntry.id });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reading"] });
      qc.invalidateQueries({ queryKey: ["to-read"] });
      qc.invalidateQueries({ queryKey: ["report"] });
    },
  });

  const normalizedSearch = useMemo(
    () => searchResults.data?.slice(0, 16) ?? [],
    [searchResults.data],
  );
  const isSearchLoading = isSearchMode && debouncedSearch.length > 1 && searchResults.isFetching;
  const isLibraryLoading = reading.isLoading || toRead.isLoading;
  const isBookDetailLoading = Boolean(selectedBookKey) && detail.isLoading;

  const libraryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of reading.data ?? []) keys.add(entry.bookKey);
    for (const entry of toRead.data ?? []) keys.add(entry.bookKey);
    return [...keys];
  }, [reading.data, toRead.data]);

  const detailLookups = useQueries({
    queries: libraryKeys.map((key) => ({
      queryKey: ["book-detail-lookup", key],
      queryFn: () => trpc.books.detail.query({ key }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const detailIndex = useMemo(() => {
    const index = new Map<
      string,
      { title: string; authors: string[]; coverId: number | null; publishDate: string | null }
    >();
    for (let i = 0; i < libraryKeys.length; i += 1) {
      const data = detailLookups[i]?.data;
      const key = libraryKeys[i];
      if (data && key) {
        index.set(key, {
          title: data.title,
          authors: data.authors,
          coverId: data.covers[0] ?? null,
          publishDate: data.publishDate,
        });
      }
    }
    return index;
  }, [detailLookups, libraryKeys]);

  const currentlyReading = useMemo(
    () => (reading.data ?? []).filter((entry) => !entry.finishedAt),
    [reading.data],
  );

  const archiveReading = useMemo(
    () => (reading.data ?? []).filter((entry) => Boolean(entry.finishedAt)),
    [reading.data],
  );

  const readingIndex = useMemo(() => {
    const index = new Map<
      string,
      { finishedAt: string | null; judgment: "Accepted" | "Rejected" | null }
    >();
    for (const entry of reading.data ?? []) {
      index.set(entry.bookKey, { finishedAt: entry.finishedAt, judgment: entry.judgment });
    }
    return index;
  }, [reading.data]);

  const plannedSet = useMemo(
    () => new Set((toRead.data ?? []).map((entry) => entry.bookKey)),
    [toRead.data],
  );
  const isQuickActionPending = toggleReading.isPending || toggleQueue.isPending;
  const isMetadataDescriptionExpanded = expandedMetadataBookKey === selectedBookKey;
  const detailMetadata = useMemo(() => {
    if (!detail.data) {
      return {
        firstPublished: null as string | null,
        pages: null as string | null,
        isbn: null as string | null,
        descriptionText: null as string | null,
      };
    }

    const raw = detail.data as Record<string, unknown>;
    const firstPublished =
      normalizeOptionalString(raw.first_publish_date) ??
      normalizeOptionalString(raw.first_publish_year) ??
      normalizeOptionalString(detail.data.publishDate);
    const pagesNumber = normalizeOptionalNumber(raw.number_of_pages);
    const pages = pagesNumber ? `${pagesNumber}` : null;
    const isbn = normalizeOptionalIsbn13(raw.isbn_13);
    const description =
      normalizeOptionalString(detail.data.description) ??
      normalizeOptionalString(raw.description) ??
      normalizeOptionalString(raw.first_sentence);

    return {
      firstPublished,
      pages,
      isbn,
      descriptionText: description,
    };
  }, [detail.data]);
  const metadataDescriptionPreview = useMemo(() => {
    const description = detailMetadata.descriptionText;
    if (!description) {
      return {
        value: null as string | null,
        isLong: false,
      };
    }
    const isLong = description.length > METADATA_DESCRIPTION_COLLAPSE_LENGTH;
    if (!isLong || isMetadataDescriptionExpanded) {
      return {
        value: description,
        isLong,
      };
    }
    return {
      value: `${description.slice(0, METADATA_DESCRIPTION_COLLAPSE_LENGTH).trimEnd()}...`,
      isLong,
    };
  }, [detailMetadata.descriptionText, isMetadataDescriptionExpanded]);
  const hasMetadataRows = Boolean(
    detailMetadata.firstPublished || detailMetadata.pages || detailMetadata.isbn,
  );
  const hasMetadataDescription = Boolean(metadataDescriptionPreview.value);
  const hasRenderableMetadata = hasMetadataRows || hasMetadataDescription;

  useEffect(() => {
    if (!selectedBookKey) {
      return;
    }

    readingForm.reset({
      startedAt: toDateInputValue(selectedEntry?.startedAt ?? null),
      finishedAt: toDateInputValue(selectedEntry?.finishedAt ?? null),
      progressPercent: selectedEntry?.progressPercent ?? undefined,
      judgment: selectedEntry?.judgment ?? undefined,
      notes: selectedEntry?.notes ?? "",
    });

    toReadForm.reset({
      priority: selectedQueueEntry?.priority ?? undefined,
      notes: selectedQueueEntry?.notes ?? "",
    });
  }, [readingForm, selectedBookKey, selectedEntry, selectedQueueEntry, toReadForm]);

  const listTabs: { id: ReadingTab; label: string }[] = [
    { id: "currently-reading", label: "Currently Reading" },
    { id: "planned", label: "Planned" },
    { id: "finished", label: "Finished" },
  ];

  return (
    <section className={styles.readingWorkspace}>
      <article className={styles.card}>
        <div className={styles.headerActionRow}>
          <div className={styles.searchInputWrap}>
            <SearchLg size={18} className={styles.searchIcon} />
            <InputBase
              wrapperClassName={styles.searchInputWrapper}
              inputClassName={styles.searchInputField}
              id="book-search"
              value={searchInput}
              onChange={(value) => setSearchInput(normalizeInputValue(value))}
              placeholder="Search for books..."
            />
            {isSearchMode ? (
              <button
                className={styles.searchClearButton}
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setSearchInput("");
                  setDebouncedSearch("");
                }}
              >
                <XClose size={16} />
              </button>
            ) : null}
          </div>
        </div>
        {!isSearchMode ? (
          <div className={styles.tabRow}>
            {listTabs.map((tab) => (
              <UiButton
                key={tab.id}
                type="button"
                color="tertiary"
                className={readingTab === tab.id ? styles.tabButtonActive : styles.tabButton}
                onClick={() => setReadingTab(tab.id)}
              >
                {tab.label}
              </UiButton>
            ))}
          </div>
        ) : null}

        <div className={styles.listContainer}>
          {isSearchLoading ? <LoadingObelus label="Searching catalog..." compact /> : null}

          {isSearchMode
            ? normalizedSearch.map((book) => {
                const tracked = readingIndex.get(book.key);
                const status = tracked
                  ? statusLabel(tracked)
                  : plannedSet.has(book.key)
                    ? "Planned"
                    : null;
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={book.key}
                    onClick={() => navigate(`/books/${encodeURIComponent(book.key)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover title={book.title} coverId={book.coverId} />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>{book.title}</h3>
                        <p className={styles.bookListAuthor}>
                          {book.authorName.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      {toPublishedYearLabel(book.firstPublishYear) ? (
                        <span>{toPublishedYearLabel(book.firstPublishYear)}</span>
                      ) : null}
                      {status ? (
                        <span
                          className={
                            status === "Planned" ? styles.readingBadge : statusClassName(status)
                          }
                        >
                          {status}
                        </span>
                      ) : (
                        <span className={styles.readingBadge}>Search</span>
                      )}
                    </div>
                  </button>
                );
              })
            : null}

          {!isSearchMode && readingTab === "currently-reading"
            ? currentlyReading.map((entry) => {
                const bookMeta = detailIndex.get(entry.bookKey);
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={entry.id}
                    onClick={() => navigate(`/books/${encodeURIComponent(entry.bookKey)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover
                        title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        coverId={bookMeta?.coverId ?? null}
                      />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>
                          {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        </h3>
                        <p className={styles.bookListAuthor}>
                          {bookMeta?.authors.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      <span>Started {toDate(entry.startedAt)}</span>
                      {toPublishedLabel(bookMeta?.publishDate ?? null) ? (
                        <span>{toPublishedLabel(bookMeta?.publishDate ?? null)}</span>
                      ) : null}
                      <span className={styles.readingBadge}>Reading</span>
                    </div>
                  </button>
                );
              })
            : null}

          {!isSearchMode && readingTab === "planned"
            ? (toRead.data ?? []).map((entry) => {
                const bookMeta = detailIndex.get(entry.bookKey);
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={entry.id}
                    onClick={() => navigate(`/books/${encodeURIComponent(entry.bookKey)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover
                        title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        coverId={bookMeta?.coverId ?? null}
                      />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>
                          {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        </h3>
                        <p className={styles.bookListAuthor}>
                          {bookMeta?.authors.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      <span>Added {toDate(entry.addedAt)}</span>
                      {toPublishedLabel(bookMeta?.publishDate ?? null) ? (
                        <span>{toPublishedLabel(bookMeta?.publishDate ?? null)}</span>
                      ) : null}
                      <span className={styles.readingBadge}>Planned</span>
                    </div>
                  </button>
                );
              })
            : null}

          {!isSearchMode && readingTab === "finished"
            ? archiveReading.map((entry) => {
                const bookMeta = detailIndex.get(entry.bookKey);
                const status = statusLabel(entry);
                return (
                  <button
                    className={styles.bookListRow}
                    type="button"
                    key={entry.id}
                    onClick={() => navigate(`/books/${encodeURIComponent(entry.bookKey)}`)}
                  >
                    <div className={styles.bookRowContent}>
                      <BookCover
                        title={bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        coverId={bookMeta?.coverId ?? null}
                      />
                      <div className={styles.bookRowMain}>
                        <h3 className={styles.bookListTitle}>
                          {bookMeta?.title ?? fallbackTitle(entry.bookKey)}
                        </h3>
                        <p className={styles.bookListAuthor}>
                          {bookMeta?.authors.join(", ") || "Unknown author"}
                        </p>
                      </div>
                    </div>
                    <div className={styles.bookMetaRow}>
                      <span>Finished {toDate(entry.finishedAt ?? null)}</span>
                      {toPublishedLabel(bookMeta?.publishDate ?? null) ? (
                        <span>{toPublishedLabel(bookMeta?.publishDate ?? null)}</span>
                      ) : null}
                      <span className={statusClassName(status)}>{status}</span>
                    </div>
                  </button>
                );
              })
            : null}

          {isSearchMode && !isSearchLoading && debouncedSearch.length <= 1 ? (
            <p className={styles.mutedBody}>Type at least 2 characters to search.</p>
          ) : null}
          {isSearchMode &&
          !isSearchLoading &&
          debouncedSearch.length > 1 &&
          normalizedSearch.length === 0 ? (
            <p className={styles.mutedBody}>No matching books.</p>
          ) : null}

          {!isSearchMode &&
          !isLibraryLoading &&
          ((readingTab === "currently-reading" && currentlyReading.length === 0) ||
            (readingTab === "planned" && (toRead.data?.length ?? 0) === 0) ||
            (readingTab === "finished" && archiveReading.length === 0)) ? (
            <p className={styles.mutedBody}>No entries in this section.</p>
          ) : null}
          {isLibraryLoading && !isSearchMode ? (
            <LoadingObelus label="Loading collection..." compact />
          ) : null}
        </div>
      </article>

      <article className={styles.detailCard}>
        {!selectedBookKey ? (
          <p className={styles.mutedBody}>Select a book to view and update record details.</p>
        ) : isBookDetailLoading ? (
          <LoadingObelus label="Loading book record..." />
        ) : detail.data ? (
          <>
            <header className={styles.bookHeader}>
              <div className={styles.bookHeaderTop}>
                <BookCover
                  title={detail.data.title}
                  coverId={detail.data.covers[0] ?? null}
                  size="L"
                />
                <div className={styles.bookHeaderContent}>
                  <h2 className={styles.bookTitle}>{detail.data.title}</h2>
                  <p className={styles.bookAuthor}>
                    {detail.data.authors.join(", ") || "Unknown author"}
                  </p>
                  {hasRenderableMetadata ? (
                    <section className={styles.metadataInline}>
                      {hasMetadataRows ? <h3 className={styles.metadataTitle}>Metadata</h3> : null}
                      {hasMetadataRows ? (
                        <div className={styles.metadataList}>
                          {detailMetadata.firstPublished ? (
                            <p className={styles.metadataLine}>
                              <span className={styles.metadataLabel}>First published:</span>{" "}
                              <span className={styles.metadataValue}>
                                {detailMetadata.firstPublished}
                              </span>
                            </p>
                          ) : null}
                          {detailMetadata.pages ? (
                            <p className={styles.metadataLine}>
                              <span className={styles.metadataLabel}>Pages:</span>{" "}
                              <span className={styles.metadataValue}>{detailMetadata.pages}</span>
                            </p>
                          ) : null}
                          {detailMetadata.isbn ? (
                            <p className={styles.metadataLine}>
                              <span className={styles.metadataLabel}>ISBN:</span>{" "}
                              <span className={styles.metadataValue}>{detailMetadata.isbn}</span>
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {hasMetadataDescription ? (
                        <div className={styles.metadataDescriptionGroup}>
                          <p className={styles.metadataDescriptionTitle}>Description</p>
                          <p className={styles.metadataBody}>{metadataDescriptionPreview.value}</p>
                          {metadataDescriptionPreview.isLong ? (
                            <button
                              className={styles.metadataExpandButton}
                              type="button"
                              onClick={() => {
                                if (!selectedBookKey) return;
                                setExpandedMetadataBookKey((currentValue) =>
                                  currentValue === selectedBookKey ? null : selectedBookKey,
                                );
                              }}
                            >
                              {isMetadataDescriptionExpanded ? "Show less" : "Show more"}
                            </button>
                          ) : null}
                        </div>
                      ) : null}
                    </section>
                  ) : null}
                </div>
              </div>
            </header>

            <section className={styles.sectionBlock}>
              <p className={styles.fieldLabel}>Actions</p>
              <div className={styles.actionRow}>
                <UiButton
                  className={selectedEntry ? styles.actionToggleActive : styles.actionToggle}
                  color="tertiary"
                  type="button"
                  isDisabled={Boolean(selectedEntry?.finishedAt) || isQuickActionPending}
                  onClick={() => toggleReading.mutate()}
                >
                  {toggleReading.isPending
                    ? "Updating..."
                    : selectedEntry?.finishedAt
                      ? "Finished"
                      : selectedEntry
                        ? "Finish now"
                        : "Reading"}
                </UiButton>
                <UiButton
                  className={selectedQueueEntry ? styles.actionToggleActive : styles.actionToggle}
                  color="tertiary"
                  type="button"
                  isDisabled={isQuickActionPending}
                  onClick={() => toggleQueue.mutate()}
                >
                  {toggleQueue.isPending ? "Updating..." : "Planned"}
                </UiButton>
              </div>
              {toggleReading.error ? (
                <p className={styles.errorText}>{toggleReading.error.message}</p>
              ) : null}
              {toggleQueue.error ? (
                <p className={styles.errorText}>{toggleQueue.error.message}</p>
              ) : null}
            </section>

            {selectedQueueEntry && !selectedEntry ? (
              <section className={styles.queueSection}>
                <h3 className={styles.sectionTitle}>Planned Details</h3>
                <div className={styles.fieldStack}>
                  <p className={styles.fieldLabel}>Added</p>
                  <p className={styles.mutedBody}>{toDate(selectedQueueEntry.addedAt)}</p>
                </div>
                <p className={styles.mutedBody}>This title is planned and not started.</p>
              </section>
            ) : (
              <form
                className={styles.formStack}
                onSubmit={readingForm.handleSubmit((values) => addReading.mutate(values))}
              >
                <section className={styles.sectionBlock}>
                  <p className={styles.fieldLabel}>Judgment</p>
                  <div className={styles.judgmentRow}>
                    <UiButton
                      className={
                        readingForm.watch("judgment") === "Accepted"
                          ? styles.judgmentAcceptedActive
                          : styles.judgmentAccepted
                      }
                      type="button"
                      color="tertiary"
                      onClick={() => readingForm.setValue("judgment", "Accepted")}
                    >
                      Accepted
                    </UiButton>
                    <UiButton
                      className={
                        readingForm.watch("judgment") === "Rejected"
                          ? styles.judgmentRejectedActive
                          : styles.judgmentRejected
                      }
                      type="button"
                      color="tertiary"
                      onClick={() => readingForm.setValue("judgment", "Rejected")}
                    >
                      Rejected
                    </UiButton>
                    <UiButton
                      className={
                        readingForm.watch("judgment")
                          ? styles.judgmentUnjudged
                          : styles.judgmentUnjudgedActive
                      }
                      type="button"
                      color="tertiary"
                      onClick={() =>
                        readingForm.setValue("judgment", undefined, { shouldDirty: true })
                      }
                    >
                      Unjudged
                    </UiButton>
                  </div>
                </section>

                <section className={styles.sectionGridTwo}>
                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="reading-started-at">
                      Start Date
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="reading-started-at"
                      type="date"
                      value={readingForm.watch("startedAt") ?? ""}
                      onChange={(value) =>
                        readingForm.setValue("startedAt", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="reading-finished-at">
                      End Date
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="reading-finished-at"
                      type="date"
                      value={readingForm.watch("finishedAt") ?? ""}
                      onChange={(value) =>
                        readingForm.setValue("finishedAt", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>

                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="reading-progress">
                      Progress
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="reading-progress"
                      type="number"
                      placeholder="Progress %"
                      value={readingForm.watch("progressPercent")?.toString() ?? ""}
                      onChange={(value) =>
                        readingForm.setValue(
                          "progressPercent",
                          normalizeInputValue(value) === ""
                            ? undefined
                            : Number(normalizeInputValue(value)),
                          { shouldDirty: true },
                        )
                      }
                    />
                  </div>
                </section>

                <section className={styles.sectionBlock}>
                  <label className={styles.fieldLabel} htmlFor="reading-notes">
                    Notes
                  </label>
                  <TextAreaBase
                    className={styles.notesArea}
                    id="reading-notes"
                    rows={10}
                    placeholder="Record your notes..."
                    value={readingForm.watch("notes") ?? ""}
                    onChange={(value: unknown) =>
                      readingForm.setValue("notes", normalizeInputValue(value), {
                        shouldDirty: true,
                      })
                    }
                  />
                </section>

                {readingForm.formState.errors.startedAt ? (
                  <p className={styles.errorText}>
                    {readingForm.formState.errors.startedAt.message}
                  </p>
                ) : null}
                {addReading.error ? (
                  <p className={styles.errorText}>{addReading.error.message}</p>
                ) : null}

                <div className={styles.actionRow}>
                  <UiButton
                    className={styles.primaryButton}
                    color="tertiary"
                    type="submit"
                    isDisabled={addReading.isPending}
                  >
                    {addReading.isPending ? "Saving..." : "Save record"}
                  </UiButton>
                  <UiButton
                    className={styles.ghostButton}
                    color="tertiary"
                    type="button"
                    onClick={() => navigate("/")}
                  >
                    Close
                  </UiButton>
                </div>
              </form>
            )}

            {selectedQueueEntry ? (
              <section className={styles.queueSection}>
                <h3 className={styles.sectionTitle}>Planned Record</h3>
                <form
                  className={styles.formStack}
                  onSubmit={toReadForm.handleSubmit((values) => addQueue.mutate(values))}
                >
                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="queue-priority">
                      Priority
                    </label>
                    <InputBase
                      wrapperClassName={styles.inputWrapper}
                      inputClassName={styles.inputField}
                      id="queue-priority"
                      type="number"
                      placeholder="1-5"
                      value={toReadForm.watch("priority")?.toString() ?? ""}
                      onChange={(value) =>
                        toReadForm.setValue(
                          "priority",
                          normalizeInputValue(value) === ""
                            ? undefined
                            : Number(normalizeInputValue(value)),
                          { shouldDirty: true },
                        )
                      }
                    />
                  </div>
                  <div className={styles.fieldStack}>
                    <label className={styles.fieldLabel} htmlFor="queue-note">
                      Note
                    </label>
                    <TextAreaBase
                      className={styles.compactTextArea}
                      id="queue-note"
                      rows={3}
                      placeholder="Reason for planning"
                      value={toReadForm.watch("notes") ?? ""}
                      onChange={(value: unknown) =>
                        toReadForm.setValue("notes", normalizeInputValue(value), {
                          shouldDirty: true,
                        })
                      }
                    />
                  </div>
                  {addQueue.error ? (
                    <p className={styles.errorText}>{addQueue.error.message}</p>
                  ) : null}
                  <div className={styles.actionRow}>
                    <UiButton
                      className={styles.primaryButton}
                      color="tertiary"
                      type="submit"
                      isDisabled={addQueue.isPending}
                    >
                      {addQueue.isPending ? "Saving..." : "Save queue record"}
                    </UiButton>
                    <UiButton
                      className={styles.ghostButton}
                      color="tertiary"
                      type="button"
                      onClick={() => navigate("/")}
                    >
                      Close
                    </UiButton>
                  </div>
                </form>
              </section>
            ) : null}
          </>
        ) : (
          <p className={styles.mutedBody}>Unable to load this book right now.</p>
        )}
      </article>
    </section>
  );
};

const AnalyticsView = () => {
  const reading = useQuery({
    queryKey: ["reading"],
    queryFn: () => trpc.library.listReading.query(),
  });

  const report = useQuery<DashboardReport>({
    queryKey: ["report"],
    queryFn: () => trpc.reports.dashboard.query(),
  });

  const libraryKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of reading.data ?? []) keys.add(entry.bookKey);
    return [...keys];
  }, [reading.data]);

  const detailLookups = useQueries({
    queries: libraryKeys.map((key) => ({
      queryKey: ["book-detail-lookup", key],
      queryFn: () => trpc.books.detail.query({ key }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const detailIndex = useMemo(() => {
    const index = new Map<string, { title: string; authors: string[] }>();
    for (let i = 0; i < libraryKeys.length; i += 1) {
      const data = detailLookups[i]?.data;
      const key = libraryKeys[i];
      if (data && key) {
        index.set(key, { title: data.title, authors: data.authors });
      }
    }
    return index;
  }, [detailLookups, libraryKeys]);

  const monthlyMax = useMemo(() => {
    if (!report.data?.monthly.length) return 1;
    return Math.max(
      1,
      ...report.data.monthly.map((point) => Math.max(point.finishedBooks, point.startedBooks)),
    );
  }, [report.data]);

  const topAuthors = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of reading.data ?? []) {
      const authors = detailIndex.get(entry.bookKey)?.authors ?? [];
      for (const author of authors) {
        counts.set(author, (counts.get(author) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([author, count]) => ({ author, count }));
  }, [reading.data, detailIndex]);

  if (reading.isLoading || report.isLoading) {
    return <LoadingObelus label="Compiling reports..." />;
  }

  return (
    <section className={styles.analyticsView}>
      <div className={styles.statGrid}>
        <article className={styles.statCard}>
          <p className={styles.fieldLabel}>Books Completed</p>
          <p className={styles.statValue}>{report.data?.totalRead ?? 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.fieldLabel}>Accepted</p>
          <p className={styles.statValue}>{report.data?.accepted ?? 0}</p>
        </article>
        <article className={styles.statCard}>
          <p className={styles.fieldLabel}>Rejected</p>
          <p className={styles.statValue}>{report.data?.rejected ?? 0}</p>
        </article>
      </div>

      <article className={styles.card}>
        <h3 className={styles.sectionTitle}>Reading timeline</h3>
        <div className={styles.chartArea}>
          {(report.data?.monthly ?? []).map((point) => (
            <div className={styles.chartColumn} key={point.month}>
              <div className={styles.chartBars}>
                <span
                  className={styles.chartBarStarted}
                  style={{
                    height: `${Math.max(8, (point.startedBooks / monthlyMax) * 120)}px`,
                  }}
                />
                <span
                  className={styles.chartBarFinished}
                  style={{
                    height: `${Math.max(8, (point.finishedBooks / monthlyMax) * 120)}px`,
                  }}
                />
              </div>
              <span className={styles.chartLabel}>{point.month.slice(5)}</span>
            </div>
          ))}
        </div>
      </article>

      <article className={styles.card}>
        <h3 className={styles.sectionTitle}>Most read authors</h3>
        <div className={styles.authorList}>
          {topAuthors.length ? (
            topAuthors.map((entry) => (
              <div className={styles.authorRow} key={entry.author}>
                <span className={styles.bookListAuthor}>{entry.author}</span>
                <span className={styles.metaText}>{entry.count}</span>
              </div>
            ))
          ) : (
            <p className={styles.mutedBody}>No author statistics available yet.</p>
          )}
        </div>
      </article>
    </section>
  );
};

const SettingsView = ({
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
      qc.invalidateQueries({ queryKey: ["me"] });
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
    },
  });

  const publicUrl = `${window.location.origin}/public/${me.id}`;
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [copyToastMessage, setCopyToastMessage] = useState<string | null>(null);
  const [isCopyingPublicUrl, setIsCopyingPublicUrl] = useState(false);

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
              isDisabled
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
              onChange={(value) =>
                profileForm.setValue("displayName", normalizeInputValue(value), {
                  shouldDirty: true,
                })
              }
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
              onChange={(event) =>
                profileForm.setValue(
                  "collectionVisibility",
                  event.target.value as "private" | "public",
                  {
                    shouldDirty: true,
                  },
                )
              }
            >
              <option value="private">Private</option>
              <option value="public">Public</option>
            </select>
            <p className={styles.fieldLabel}>Public Profile Link</p>
            <div className={styles.headerActionRow}>
              <a className={styles.linkButton} href={publicUrl} target="_blank" rel="noreferrer">
                {publicUrl}
              </a>
              <UiButton
                className={styles.ghostButton}
                color="tertiary"
                type="button"
                isDisabled={isCopyingPublicUrl}
                onClick={() => void copyPublicUrl()}
              >
                {isCopyingPublicUrl ? "Copying..." : copiedPublicUrl ? "Copied" : "Copy"}
              </UiButton>
            </div>
          </div>

          {saveProfile.error ? (
            <p className={styles.errorText}>{saveProfile.error.message}</p>
          ) : null}
          <div className={styles.actionRow}>
            <UiButton
              className={styles.primaryButton}
              color="tertiary"
              type="submit"
              isDisabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? "Saving..." : "Save profile"}
            </UiButton>
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
              value={passwordForm.watch("currentPassword") ?? ""}
              onChange={(value) =>
                passwordForm.setValue("currentPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                })
              }
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
              value={passwordForm.watch("newPassword") ?? ""}
              onChange={(value) =>
                passwordForm.setValue("newPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                })
              }
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
              value={passwordForm.watch("confirmPassword") ?? ""}
              onChange={(value) =>
                passwordForm.setValue("confirmPassword", normalizeInputValue(value), {
                  shouldDirty: true,
                })
              }
            />
            {passwordForm.formState.errors.confirmPassword ? (
              <p className={styles.errorText}>
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {changePassword.error ? (
            <p className={styles.errorText}>{changePassword.error.message}</p>
          ) : null}

          <div className={styles.actionRow}>
            <UiButton
              className={styles.primaryButton}
              color="tertiary"
              type="submit"
              isDisabled={changePassword.isPending}
            >
              {changePassword.isPending ? "Updating..." : "Change password"}
            </UiButton>
          </div>
        </form>
      </article>
      {copyToastMessage ? <div className={styles.toast}>{copyToastMessage}</div> : null}
    </section>
  );
};

const PublicCollectionView = () => {
  const navigate = useNavigate();
  const params = useParams();
  const userId = params.userId ?? "";

  const collection = useQuery({
    queryKey: ["public-collection", userId],
    queryFn: () => trpc.library.publicCollection.query({ userId }),
    enabled: userId.length > 0,
    retry: false,
  });

  const allBookKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const entry of collection.data?.reading ?? []) keys.add(entry.bookKey);
    for (const entry of collection.data?.toRead ?? []) keys.add(entry.bookKey);
    return [...keys];
  }, [collection.data]);

  const detailLookups = useQueries({
    queries: allBookKeys.map((key) => ({
      queryKey: ["public-detail-lookup", key],
      queryFn: () => trpc.books.detail.query({ key }),
      staleTime: 5 * 60 * 1000,
    })),
  });

  const detailIndex = useMemo(() => {
    const index = new Map<
      string,
      { title: string; authors: string[]; coverId: number | null; publishDate: string | null }
    >();
    for (let i = 0; i < allBookKeys.length; i += 1) {
      const detail = detailLookups[i]?.data;
      const key = allBookKeys[i];
      if (detail && key) {
        index.set(key, {
          title: detail.title,
          authors: detail.authors,
          coverId: detail.covers[0] ?? null,
          publishDate: detail.publishDate,
        });
      }
    }
    return index;
  }, [allBookKeys, detailLookups]);

  const publicReading = useMemo(
    () => (collection.data?.reading ?? []).filter((entry) => !entry.finishedAt),
    [collection.data?.reading],
  );
  const publicFinished = useMemo(
    () => (collection.data?.reading ?? []).filter((entry) => Boolean(entry.finishedAt)),
    [collection.data?.reading],
  );

  if (!collection.data) {
    if (collection.isLoading) {
      return (
        <main className={styles.page}>
          <div className={styles.container}>
            <LoadingObelus label="Loading public collection..." />
          </div>
        </main>
      );
    }

    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <article className={styles.card}>
            <h2 className={styles.pageTitle}>Public collection not available</h2>
            <p className={styles.mutedBody}>This collection is private or does not exist.</p>
            <div className={styles.actionRow}>
              <UiButton
                className={styles.ghostButton}
                type="button"
                color="tertiary"
                onClick={() => navigate("/")}
              >
                Go home
              </UiButton>
            </div>
          </article>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.navigation}>
          <button className={styles.logoButton} onClick={() => navigate("/")} type="button">
            <span className={styles.logoSymbol}>÷</span>
            <span className={styles.logoText}>Obelus</span>
          </button>
        </header>

        <article className={styles.card}>
          <h2 className={styles.pageTitle}>{collection.data.profile.displayName}</h2>
          <p className={styles.mutedBody}>Public reading collection (read only)</p>

          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Reading</h3>
            {detailLookups.some((lookup) => lookup.isLoading) ? (
              <LoadingObelus label="Loading book metadata..." compact />
            ) : null}
            <div className={styles.listContainer}>
              {publicReading.length ? (
                publicReading.map((entry) => {
                  const meta = detailIndex.get(entry.bookKey);
                  const status = statusLabel(entry);
                  return (
                    <div key={entry.id} className={styles.bookListRowReadOnly}>
                      <div className={styles.bookRowContent}>
                        <BookCover
                          title={meta?.title ?? fallbackTitle(entry.bookKey)}
                          coverId={meta?.coverId ?? null}
                        />
                        <div className={styles.bookRowMain}>
                          <h3 className={styles.bookListTitle}>
                            {meta?.title ?? fallbackTitle(entry.bookKey)}
                          </h3>
                          <p className={styles.bookListAuthor}>
                            {meta?.authors.join(", ") || "Unknown author"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.bookMetaRow}>
                        <span>
                          {entry.finishedAt
                            ? `Finished ${toDate(entry.finishedAt)}`
                            : `Started ${toDate(entry.startedAt)}`}
                        </span>
                        {toPublishedLabel(meta?.publishDate ?? null) ? (
                          <span>{toPublishedLabel(meta?.publishDate ?? null)}</span>
                        ) : null}
                        <span className={statusClassName(status)}>{status}</span>
                      </div>
                      {entry.notes ? <p className={styles.mutedBody}>{entry.notes}</p> : null}
                    </div>
                  );
                })
              ) : (
                <p className={styles.mutedBody}>No reading entries published.</p>
              )}
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Finished</h3>
            <div className={styles.listContainer}>
              {publicFinished.length ? (
                publicFinished.map((entry) => {
                  const meta = detailIndex.get(entry.bookKey);
                  const status = statusLabel(entry);
                  return (
                    <div key={entry.id} className={styles.bookListRowReadOnly}>
                      <div className={styles.bookRowContent}>
                        <BookCover
                          title={meta?.title ?? fallbackTitle(entry.bookKey)}
                          coverId={meta?.coverId ?? null}
                        />
                        <div className={styles.bookRowMain}>
                          <h3 className={styles.bookListTitle}>
                            {meta?.title ?? fallbackTitle(entry.bookKey)}
                          </h3>
                          <p className={styles.bookListAuthor}>
                            {meta?.authors.join(", ") || "Unknown author"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.bookMetaRow}>
                        <span>Finished {toDate(entry.finishedAt ?? null)}</span>
                        {toPublishedLabel(meta?.publishDate ?? null) ? (
                          <span>{toPublishedLabel(meta?.publishDate ?? null)}</span>
                        ) : null}
                        <span className={statusClassName(status)}>{status}</span>
                      </div>
                      {entry.notes ? <p className={styles.mutedBody}>{entry.notes}</p> : null}
                    </div>
                  );
                })
              ) : (
                <p className={styles.mutedBody}>No finished entries published.</p>
              )}
            </div>
          </section>

          <section className={styles.sectionBlock}>
            <h3 className={styles.sectionTitle}>Planned</h3>
            <div className={styles.listContainer}>
              {collection.data.toRead.length ? (
                collection.data.toRead.map((entry) => {
                  const meta = detailIndex.get(entry.bookKey);
                  return (
                    <div key={entry.id} className={styles.bookListRowReadOnly}>
                      <div className={styles.bookRowContent}>
                        <BookCover
                          title={meta?.title ?? fallbackTitle(entry.bookKey)}
                          coverId={meta?.coverId ?? null}
                        />
                        <div className={styles.bookRowMain}>
                          <h3 className={styles.bookListTitle}>
                            {meta?.title ?? fallbackTitle(entry.bookKey)}
                          </h3>
                          <p className={styles.bookListAuthor}>
                            {meta?.authors.join(", ") || "Unknown author"}
                          </p>
                        </div>
                      </div>
                      <div className={styles.bookMetaRow}>
                        <span>Added {toDate(entry.addedAt)}</span>
                        {toPublishedLabel(meta?.publishDate ?? null) ? (
                          <span>{toPublishedLabel(meta?.publishDate ?? null)}</span>
                        ) : null}
                        <span className={styles.readingBadge}>Planned</span>
                      </div>
                      {entry.notes ? <p className={styles.mutedBody}>{entry.notes}</p> : null}
                    </div>
                  );
                })
              ) : (
                <p className={styles.mutedBody}>No planned entries published.</p>
              )}
            </div>
          </section>
        </article>
      </div>
    </main>
  );
};

const AuthenticatedApp = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const me = useQuery({ queryKey: ["me"], queryFn: () => trpc.auth.me.query(), retry: false });

  const logout = useMutation({
    mutationFn: () => trpc.auth.logout.mutate(),
    onSuccess: () => {
      qc.setQueryData(["me"], null);
      qc.invalidateQueries({ queryKey: ["me"] });
      navigate("/");
    },
  });

  const reading = useQuery({
    queryKey: ["reading"],
    queryFn: () => trpc.library.listReading.query(),
    enabled: Boolean(me.data),
  });

  const toRead = useQuery({
    queryKey: ["to-read"],
    queryFn: () => trpc.library.listToRead.query(),
    enabled: Boolean(me.data),
  });

  if (me.isLoading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <LoadingObelus label="Opening your record..." />
        </div>
      </main>
    );
  }

  if (!me.data) {
    return <AuthPage />;
  }

  const navLinks = [
    { label: "Reading", path: "/" },
    { label: "Reports", path: "/analytics" },
    { label: "Settings", path: "/settings" },
  ];

  const readingCount = (reading.data ?? []).filter((entry) => !entry.finishedAt).length;
  const toReadCount = (toRead.data ?? []).length;
  const readCount = (reading.data ?? []).filter((entry) => Boolean(entry.finishedAt)).length;

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <header className={styles.navigation}>
          <button className={styles.logoButton} onClick={() => navigate("/")} type="button">
            <span className={styles.logoSymbol}>÷</span>
            <span className={styles.logoText}>Obelus</span>
          </button>
          <nav className={styles.navLinks}>
            {navLinks.map((link) => {
              const isActive =
                link.path === "/"
                  ? location.pathname === "/" || location.pathname.startsWith("/books/")
                  : location.pathname.startsWith(link.path);
              return (
                <UiButton
                  className={isActive ? styles.navLinkActive : styles.navLink}
                  type="button"
                  key={link.path}
                  color="tertiary"
                  onClick={() => navigate(link.path)}
                >
                  {link.label}
                </UiButton>
              );
            })}
            <UiButton
              className={styles.navLink}
              type="button"
              color="tertiary"
              isDisabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Logging out..." : "Log out"}
            </UiButton>
          </nav>
        </header>

        <section className={styles.profileBar}>
          <p className={styles.metaText}>{me.data.email}</p>
          <p className={styles.metaText}>
            {readingCount} reading / {toReadCount} planned / {readCount} finished
          </p>
        </section>

        <Routes>
          <Route path="/" element={<ReadingWorkspace />} />
          <Route path="/books/*" element={<ReadingWorkspace />} />
          <Route path="/analytics" element={<AnalyticsView />} />
          <Route path="/settings" element={<SettingsView me={me.data} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </main>
  );
};

export const App = () => {
  return (
    <Routes>
      <Route path="/public/:userId" element={<PublicCollectionView />} />
      <Route path="*" element={<AuthenticatedApp />} />
    </Routes>
  );
};
