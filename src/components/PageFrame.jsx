import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import IntroKickoff from "./IntroKickoff";
import WorldBackground from "./WorldBackground";

export default function PageFrame() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(() => location.pathname === "/");
  const isHomeRoute = location.pathname === "/";

  return (
    <div className="app-shell">
      <WorldBackground />
      <div className="grain-layer" />
      {showIntro && isHomeRoute ? (
        <IntroKickoff onFinish={() => setShowIntro(false)} />
      ) : null}
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}
