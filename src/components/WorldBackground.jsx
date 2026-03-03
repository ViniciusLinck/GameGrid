import { useEffect, useRef } from "react";

export default function WorldBackground() {
  const canvasRef = useRef(null);

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

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        200
      );
      camera.position.z = 9;

      const renderer = new THREE.WebGLRenderer({
        canvas,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);

      const globe = new THREE.Mesh(
        new THREE.SphereGeometry(2.6, 40, 40),
        new THREE.MeshBasicMaterial({
          color: "#16a6b6",
          wireframe: true,
          transparent: true,
          opacity: 0.26,
        })
      );

      const starCount = 750;
      const starPositions = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i += 1) {
        const radius = 5.4 + Math.random() * 2.6;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
        starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
        starPositions[i * 3 + 2] = radius * Math.cos(phi);
      }

      const starsGeometry = new THREE.BufferGeometry();
      starsGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(starPositions, 3)
      );
      const stars = new THREE.Points(
        starsGeometry,
        new THREE.PointsMaterial({
          color: "#f5d061",
          size: 0.03,
          transparent: true,
          opacity: 0.8,
        })
      );

      scene.add(globe);
      scene.add(stars);

      const onResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      };

      window.addEventListener("resize", onResize);

      let animationFrame = 0;
      const animate = () => {
        globe.rotation.y += 0.0024;
        stars.rotation.y -= 0.0008;
        stars.rotation.x += 0.0004;
        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
      };

      animate();

      cleanup = () => {
        window.removeEventListener("resize", onResize);
        window.cancelAnimationFrame(animationFrame);
        renderer.dispose();
        globe.geometry.dispose();
        globe.material.dispose();
        starsGeometry.dispose();
        stars.material.dispose();
      };
    };

    setup();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  return <canvas className="world-bg-canvas" ref={canvasRef} />;
}
