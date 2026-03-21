import { useEffect, useRef } from "react";
import { useMotionPreferences } from "../hooks/useMotionPreferences";

export default function ProfileAuraCanvas({ className = "" }) {
  const canvasRef = useRef(null);
  const { shouldAnimate } = useMotionPreferences();

  useEffect(() => {
    if (!shouldAnimate) {
      return undefined;
    }

    let disposed = false;
    let cleanup = () => {};

    const setup = async () => {
      const canvas = canvasRef.current;
      const host = canvas?.parentElement;
      if (!canvas || !host) {
        return;
      }

      const isNarrowScreen = window.innerWidth < 900;
      const deviceMemory = navigator.deviceMemory ?? 8;
      const cpuCores = navigator.hardwareConcurrency ?? 8;
      const lowPowerMode = isNarrowScreen || deviceMemory <= 4 || cpuCores <= 4;
      if (lowPowerMode) {
        return;
      }

      const THREE = await import("three");
      if (disposed) {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 20);
      camera.position.z = 4.2;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: !lowPowerMode,
        powerPreference: lowPowerMode ? "low-power" : "high-performance",
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPowerMode ? 1 : 1.5));

      const ringMaterial = new THREE.MeshBasicMaterial({
        color: "#ffd061",
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });

      const innerRingMaterial = new THREE.MeshBasicMaterial({
        color: "#8dcfff",
        wireframe: true,
        transparent: true,
        opacity: 0.22,
      });

      const glowMaterial = new THREE.MeshBasicMaterial({
        color: "#f3f7ff",
        transparent: true,
        opacity: 0.08,
      });

      const outerRing = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.02, 14, lowPowerMode ? 36 : 52),
        ringMaterial
      );
      outerRing.rotation.x = Math.PI / 4.1;
      outerRing.rotation.y = Math.PI / 5.2;

      const innerRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.8, 0.02, 14, lowPowerMode ? 30 : 42),
        innerRingMaterial
      );
      innerRing.rotation.x = Math.PI / 2.15;
      innerRing.rotation.z = Math.PI / 7.5;

      const glow = new THREE.Mesh(
        new THREE.CircleGeometry(1.08, lowPowerMode ? 28 : 44),
        glowMaterial
      );
      glow.position.z = -0.2;

      const particleCount = lowPowerMode ? 42 : 78;
      const positions = new Float32Array(particleCount * 3);
      for (let index = 0; index < particleCount; index += 1) {
        const radius = 1.1 + Math.random() * 0.92;
        const angle = Math.random() * Math.PI * 2;
        positions[index * 3] = Math.cos(angle) * radius;
        positions[index * 3 + 1] = (Math.random() - 0.5) * 1.45;
        positions[index * 3 + 2] = Math.sin(angle) * radius * 0.34;
      }

      const particlesGeometry = new THREE.BufferGeometry();
      particlesGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const particlesMaterial = new THREE.PointsMaterial({
        color: "#d6ecff",
        size: lowPowerMode ? 0.022 : 0.028,
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const particles = new THREE.Points(particlesGeometry, particlesMaterial);

      scene.add(glow);
      scene.add(outerRing);
      scene.add(innerRing);
      scene.add(particles);

      const resize = () => {
        const rect = host.getBoundingClientRect();
        const width = Math.max(rect.width, 1);
        const height = Math.max(rect.height, 1);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      resize();

      let resizeObserver;
      if (typeof ResizeObserver !== "undefined") {
        resizeObserver = new ResizeObserver(() => resize());
        resizeObserver.observe(host);
      } else {
        window.addEventListener("resize", resize);
      }

      let animationFrame = 0;
      const clock = new THREE.Clock();

      const animate = () => {
        const elapsed = clock.getElapsedTime();

        outerRing.rotation.z += 0.0015;
        outerRing.rotation.y += 0.00085;
        innerRing.rotation.x -= 0.0018;
        innerRing.rotation.z += 0.0011;
        glow.scale.setScalar(1 + Math.sin(elapsed * 1.8) * 0.035);
        glowMaterial.opacity = 0.08 + Math.sin(elapsed * 1.4) * 0.018;
        particles.rotation.y += 0.001;
        particles.rotation.x = Math.sin(elapsed * 0.5) * 0.08;
        particlesMaterial.opacity = 0.72 + Math.sin(elapsed * 1.5) * 0.08;

        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      };

      animate();

      cleanup = () => {
        if (resizeObserver) {
          resizeObserver.disconnect();
        } else {
          window.removeEventListener("resize", resize);
        }

        window.cancelAnimationFrame(animationFrame);
        renderer.dispose();
        outerRing.geometry.dispose();
        ringMaterial.dispose();
        innerRing.geometry.dispose();
        innerRingMaterial.dispose();
        glow.geometry.dispose();
        glowMaterial.dispose();
        particlesGeometry.dispose();
        particlesMaterial.dispose();
      };
    };

    setup();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [shouldAnimate]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
