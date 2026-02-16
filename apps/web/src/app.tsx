import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AppRoutes } from "./app/routes";
import * as a11yStyles from "./styles/a11y.css";

const routeLabelFromPath = (pathname: string) => {
  if (pathname.startsWith("/analytics")) return "Reports";
  if (pathname.startsWith("/settings")) return "Settings";
  if (pathname.startsWith("/public/")) return "Public collection";
  if (pathname.startsWith("/series/")) return "Series";
  if (pathname.startsWith("/books/")) return "Book details";
  if (pathname.startsWith("/auth/")) return "Sign in";
  return "Reading";
};

export const App = () => {
  const location = useLocation();
  const [routeAnnouncement, setRouteAnnouncement] = useState("");

  useEffect(() => {
    const mainRegion = document.getElementById("main-content");
    if (!mainRegion) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      mainRegion.focus();
      setRouteAnnouncement(`${routeLabelFromPath(location.pathname)} page loaded`);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <>
      <a className={a11yStyles.skipLink} href="#main-content">
        Skip to main content
      </a>
      <div className={a11yStyles.srOnly} aria-live="polite" aria-atomic="true">
        {routeAnnouncement}
      </div>
      <AppRoutes />
    </>
  );
};
