import { Navigate, Route, Routes } from "react-router-dom";
import PageFrame from "./components/PageFrame";
import HomePage from "./pages/HomePage";
import NotFoundPage from "./pages/NotFoundPage";
import PlayerPage from "./pages/PlayerPage";
import TeamPage from "./pages/TeamPage";

export default function App() {
  return (
    <Routes>
      <Route element={<PageFrame />}>
        <Route index element={<HomePage />} />
        <Route path="time/:teamName" element={<TeamPage />} />
        <Route path="jogador/:playerId" element={<PlayerPage />} />
        <Route path="home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
