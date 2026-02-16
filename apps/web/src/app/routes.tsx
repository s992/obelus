import { SsoCallbackPage } from "@/features/auth/components/SsoCallbackPage/SsoCallbackPage";
import { AuthenticatedApp } from "@/features/authenticated/components/AuthenticatedApp/AuthenticatedApp";
import { PublicCollectionView } from "@/features/public/components/PublicCollectionView/PublicCollectionView";
import { Route, Routes } from "react-router-dom";

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/public/:userId" element={<PublicCollectionView />} />
      <Route path="/auth/sso/callback" element={<SsoCallbackPage />} />
      <Route path="*" element={<AuthenticatedApp />} />
    </Routes>
  );
};
