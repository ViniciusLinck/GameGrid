import { useEffect, useMemo, useState } from "react";

export function useMotionPreferences() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobileMedia = window.matchMedia("(max-width: 768px)");
    const update = () => setReducedMotion(media.matches);
    const updateMobile = () => setIsMobile(mobileMedia.matches);

    update();
    updateMobile();
    media.addEventListener("change", update);
    mobileMedia.addEventListener("change", updateMobile);
    return () => {
      media.removeEventListener("change", update);
      mobileMedia.removeEventListener("change", updateMobile);
    };
  }, []);

  const shouldAnimate = useMemo(() => !reducedMotion && !isMobile, [isMobile, reducedMotion]);

  return {
    reducedMotion,
    isMobile,
    shouldAnimate,
  };
}
