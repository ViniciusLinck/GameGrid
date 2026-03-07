import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageFrame from "./components/PageFrame";

const HomePage = lazy(() => import("./pages/HomePage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const PlayerPage = lazy(() => import("./pages/PlayerPage"));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

export default function App() {
  return (
    <Suspense fallback={<section className="page-card">Carregando pagina...</section>}>
      <Routes>
        <Route element={<PageFrame />}>
          <Route index element={<HomePage />} />
          <Route path="time/:teamName" element={<TeamPage />} />
          <Route path="jogador/:playerId" element={<PlayerPage />} />
          <Route path="home" element={<Navigate to="/" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
