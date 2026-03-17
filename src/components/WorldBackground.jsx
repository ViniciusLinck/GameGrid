import { useEffect, useRef } from "react";
import { useMotionPreferences } from "../hooks/useMotionPreferences";

const MOOD_PRESETS = {
  idle: { speed: 0.0022, glow: 0.28, starOpacity: 0.78, cometChance: 0.0011 },
  focus: { speed: 0.0036, glow: 0.38, starOpacity: 0.9, cometChance: 0.0021 },
  transition: { speed: 0.0056, glow: 0.48, starOpacity: 0.98, cometChance: 0.0036 },
};

export default function WorldBackground({ mood = "idle" }) {
  const canvasRef = useRef(null);
  const moodRef = useRef(mood);
  const { shouldAnimate } = useMotionPreferences();

  useEffect(() => {
    moodRef.current = mood;
  }, [mood]);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    const setup = async () => {
      const THREE = await import("three");
      if (disposed) {
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const isNarrowScreen = window.innerWidth < 900;
      const deviceMemory = navigator.deviceMemory ?? 8;
      const cpuCores = navigator.hardwareConcurrency ?? 8;
      const isLowEndDevice = deviceMemory <= 4 || cpuCores <= 4;
      const lowPowerMode = !shouldAnimate || isNarrowScreen || isLowEndDevice;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        220
      );
      camera.position.z = 9;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: !lowPowerMode,
        alpha: true,
        powerPreference: lowPowerMode ? "low-power" : "high-performance",
      });
      const maxPixelRatio = lowPowerMode ? 1.1 : 1.6;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const globeMaterial = new THREE.MeshBasicMaterial({
        color: "#1ab3c6",
        wireframe: true,
        transparent: true,
        opacity: 0.3,
      });

      const globeSegments = lowPowerMode ? 26 : 40;
      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, globeSegments, globeSegments),
        globeMaterial
      );

      const starCount = lowPowerMode ? 260 : 720;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i += 1) {
        const radius = 5.4 + Math.random() * 2.8;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = radius * Math.cos(phi);
      }

      const starsGeometry = new THREE.BufferGeometry();
      starsGeometry.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
      const starsMaterial = new THREE.PointsMaterial({
        color: "#f5d061",
        size: lowPowerMode ? 0.03 : 0.034,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const stars = new THREE.Points(starsGeometry, starsMaterial);

      const cometGeometry = new THREE.SphereGeometry(0.05, 8, 8);
      const cometMaterial = new THREE.MeshBasicMaterial({ color: "#fde68a", transparent: true, opacity: 0 });
      const comet = new THREE.Mesh(cometGeometry, cometMaterial);
      comet.position.set(-20, -20, -20);

      scene.add(globe);
      scene.add(stars);
      scene.add(comet);

      const pointer = { x: 0, y: 0 };
      const scrollDrift = { y: 0 };
      let isScrolling = false;
      let scrollTimeoutId = 0;
      let cometActive = false;
      let cometLife = 0;
      let cometVelocity = { x: 0.1, y: -0.045, z: 0.015 };
      let isHidden = false;
      const clock = new THREE.Clock();

      const spawnComet = () => {
        comet.position.set(-4 + Math.random() * 8, 2.6 + Math.random() * 2.2, -2.5 + Math.random() * 1.5);
        cometVelocity = {
          x: 0.09 + Math.random() * 0.05,
          y: -0.04 - Math.random() * 0.04,
          z: 0.008 + Math.random() * 0.02,
        };
        cometLife = 1.2;
        cometActive = true;
      };

      const onPointerMove = (event) => {
        pointer.x = (event.clientX / window.innerWidth - 0.5) * 2;
        pointer.y = (event.clientY / window.innerHeight - 0.5) * 2;
      };

      const onScroll = () => {
        scrollDrift.y = Math.min(window.scrollY / 1200, 1.2);
        isScrolling = true;
        if (scrollTimeoutId) {
          window.clearTimeout(scrollTimeoutId);
        }
        scrollTimeoutId = window.setTimeout(() => {
          isScrolling = false;
          scrollTimeoutId = 0;
        }, 150);
      };

      const onVisibility = () => {
        isHidden = document.hidden;
      };

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxPixelRatio));
      };

      window.addEventListener("resize", onResize);
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      window.addEventListener("scroll", onScroll, { passive: true });
      document.addEventListener("visibilitychange", onVisibility);

      let animationFrame = 0;
      const baseFps = lowPowerMode ? 30 : 60;
      const frameInterval = 1000 / baseFps;
      let lastFrame = 0;

      const animate = (time) => {
        if (isHidden) {
          animationFrame = window.requestAnimationFrame(animate);
          return;
        }

        const currentTime = typeof time === "number" ? time : 0;

        if (isScrolling) {
          animationFrame = window.requestAnimationFrame(animate);
          return;
        }

        if (currentTime - lastFrame < frameInterval) {
          animationFrame = window.requestAnimationFrame(animate);
          return;
        }

        lastFrame = currentTime;

        const moodConfig = MOOD_PRESETS[moodRef.current] ?? MOOD_PRESETS.idle;
        const elapsed = clock.getElapsedTime();

        globe.rotation.y += moodConfig.speed;
        globe.rotation.x = pointer.y * 0.035;
        globeMaterial.opacity = moodConfig.glow + Math.sin(elapsed * 1.4) * 0.03;

        stars.rotation.y -= moodConfig.speed * 0.33;
        stars.rotation.x += 0.00035 + scrollDrift.y * 0.00045;
        stars.position.x += (pointer.x * 0.16 - stars.position.x) * 0.03;
        stars.position.y += (-pointer.y * 0.12 - stars.position.y) * 0.03;
        starsMaterial.opacity += (moodConfig.starOpacity - starsMaterial.opacity) * 0.08;

        if (!cometActive && Math.random() < moodConfig.cometChance && !lowPowerMode && !isScrolling) {
          spawnComet();
        }

        if (cometActive) {
          comet.position.x += cometVelocity.x;
          comet.position.y += cometVelocity.y;
          comet.position.z += cometVelocity.z;
          cometLife -= 0.009;
          cometMaterial.opacity = Math.max(0, cometLife * 0.75);

          if (cometLife <= 0 || comet.position.x > 7) {
            cometActive = false;
            comet.position.set(-20, -20, -20);
            cometMaterial.opacity = 0;
          }
        }

        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      };

      animate(0);

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        window.removeEventListener("pointermove", onPointerMove);
        window.removeEventListener("scroll", onScroll);
        document.removeEventListener("visibilitychange", onVisibility);
        if (scrollTimeoutId) {
          window.clearTimeout(scrollTimeoutId);
        }
        window.cancelAnimationFrame(animationFrame);
        renderer.dispose();
        globe.geometry.dispose();
        globeMaterial.dispose();
        starsGeometry.dispose();
        starsMaterial.dispose();
        cometGeometry.dispose();
        cometMaterial.dispose();
      };
    };

    setup();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [shouldAnimate]);

  return <canvas className="world-bg-canvas" ref={canvasRef} />;
}
