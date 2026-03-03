import { useState } from "react";
import { Outlet } from "react-router-dom";
import IntroKickoff from "./IntroKickoff";
import WorldBackground from "./WorldBackground";

export default function PageFrame() {
  const [showIntro, setShowIntro] = useState(true);

  return (
    <div className="app-shell">
      <WorldBackground />
      <div className="grain-layer" />
      {showIntro ? <IntroKickoff onFinish={() => setShowIntro(false)} /> : null}
      <div className="page-content">
        <Outlet />
      </div>
    </div>
  );
}
