import { trpc } from "@/api/trpc";
import { AnalyticsView } from "@/features/analytics/components/AnalyticsView/AnalyticsView";
import { AuthPage } from "@/features/auth/components/AuthPage/AuthPage";
import { ReadingWorkspace } from "@/features/reading/components/ReadingWorkspace/ReadingWorkspace";
import { SettingsView } from "@/features/settings/components/SettingsView/SettingsView";
import { LoadingObelus } from "@/features/shared/components/LoadingObelus/LoadingObelus";
import { getErrorMessage } from "@/lib/errors";
import { queryKeys } from "@/lib/query-keys";
import { Button } from "@/ui/Button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import * as styles from "./AuthenticatedApp.css";

export const AuthenticatedApp = () => {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  const me = useQuery({
    queryKey: queryKeys.me,
    queryFn: () => trpc.auth.me.query(),
    retry: false,
  });

  const logout = useMutation({
    mutationFn: () => trpc.auth.logout.mutate(),
    onSuccess: () => {
      qc.setQueryData(queryKeys.me, null);
      qc.invalidateQueries({ queryKey: queryKeys.me });
      navigate("/");
    },
  });

  const reading = useQuery({
    queryKey: queryKeys.reading,
    queryFn: () => trpc.library.listReading.query(),
    enabled: Boolean(me.data),
  });

  const toRead = useQuery({
    queryKey: queryKeys.toRead,
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
                <Button
                  className={isActive ? styles.navLinkActive : styles.navLink}
                  type="button"
                  key={link.path}
                  color="tertiary"
                  onClick={() => navigate(link.path)}
                >
                  {link.label}
                </Button>
              );
            })}
            <Button
              className={styles.navLink}
              type="button"
              color="tertiary"
              isDisabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? "Logging out..." : "Log out"}
            </Button>
          </nav>
        </header>

        {logout.error ? <p className={styles.errorText}>{getErrorMessage(logout.error)}</p> : null}

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
