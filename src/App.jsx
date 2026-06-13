import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageFrame from "./components/PageFrame";
import { useLanguage } from "./context/LanguageContext";

const HomePage = lazy(() => import("./pages/HomePage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  const { uiText } = useLanguage();

  return (
    <Suspense fallback={<section className="page-card">{uiText.common.loadingPage}</section>}>
      <Routes>
        <Route element={<PageFrame />}>
          <Route index element={<LandingPage />} />
          <Route path="inicio" element={<Navigate to="/" replace />} />
          <Route path="partidas" element={<HomePage />} />
          <Route path="grupos" element={<GroupsPage />} />
          <Route path="time/:teamName" element={<Navigate to="/partidas" replace />} />
          <Route path="jogador/:playerId" element={<Navigate to="/partidas" replace />} />
          <Route path="privacidade" element={<PrivacyPage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
