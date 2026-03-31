import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageFrame from "./components/PageFrame";
import { useLanguage } from "./context/LanguageContext";

const HomePage = lazy(() => import("./pages/HomePage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
const PrivacyPage = lazy(() => import("./pages/PrivacyPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  const { uiText } = useLanguage();

  return (
    <Suspense fallback={<section className="page-card">{uiText.common.loadingPage}</section>}>
      <Routes>
        <Route element={<PageFrame />}>
          <Route index element={<HomePage />} />
          <Route path="time/:teamName" element={<TeamPage />} />
          <Route path="jogador/:playerId" element={<PlayerPage />} />
          <Route path="privacidade" element={<PrivacyPage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
