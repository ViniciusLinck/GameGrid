import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useMotionPreferences } from "../hooks/useMotionPreferences";
import { motionTokens } from "../animations/motionTokens";

export default function IntroKickoff({ onFinish }) {
  const [hidden, setHidden] = useState(false);
  const overlayRef = useRef(null);
  const ballRef = useRef(null);
  const shadowRef = useRef(null);
  const streakRef = useRef(null);
  const titleRef = useRef(null);
  const timelineRef = useRef(null);
  const { shouldAnimate } = useMotionPreferences();

  useEffect(() => {
    const overlay = overlayRef.current;
    const ball = ballRef.current;
    const shadow = shadowRef.current;
    const streak = streakRef.current;
    const title = titleRef.current;

    if (!overlay || !ball || !shadow || !streak || !title) {
      return undefined;
    }

    if (!shouldAnimate) {
      setHidden(true);
      onFinish?.();
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const moveX = Math.min(window.innerWidth * 0.46, 520);

    const finishIntro = () => {
      document.body.style.overflow = previousOverflow;
      setHidden(true);
      onFinish?.();
    };

    const tl = gsap.timeline({
      defaults: { ease: motionTokens.ease.soft },
      onComplete: finishIntro,
    });

    timelineRef.current = tl;

    tl.fromTo(
      title,
      { autoAlpha: 0, y: 22 },
      { autoAlpha: 1, y: 0, duration: motionTokens.duration.fast }
    )
      .fromTo(
        ball,
        { scale: 0.22, autoAlpha: 0, rotation: -160 },
        {
          scale: 1,
          autoAlpha: 1,
          rotation: 0,
          duration: motionTokens.duration.medium,
          ease: motionTokens.ease.emphasis,
        },
        0.08
      )
      .fromTo(
        shadow,
        { autoAlpha: 0, scale: 0.65 },
        { autoAlpha: 0.45, scale: 1, duration: 0.5 },
        0.08
      )
      .to(ball, { y: -92, duration: 0.42, ease: motionTokens.ease.enter }, 0.74)
      .to(shadow, { scale: 0.52, autoAlpha: 0.16, duration: 0.42 }, 0.74)
      .to(ball, { y: 0, duration: 0.54, ease: "bounce.out" }, 1.16)
      .to(shadow, { scale: 1, autoAlpha: 0.45, duration: 0.4 }, 1.16)
      .fromTo(
        streak,
        { autoAlpha: 0, scaleX: 0.1 },
        { autoAlpha: 0.95, scaleX: 1, duration: 0.14, ease: "power4.out" },
        1.62
      )
      .to(
        ball,
        {
          x: moveX,
          y: -36,
          rotation: 700,
          duration: 0.5,
          ease: "power4.in",
        },
        1.62
      )
      .to(
        shadow,
        {
          x: moveX,
          scale: 0.2,
          autoAlpha: 0,
          duration: 0.5,
          ease: "power4.in",
        },
        1.62
      )
      .to(
        overlay,
        {
          clipPath: "circle(0% at 90% 50%)",
          autoAlpha: 0,
          duration: 0.82,
          ease: motionTokens.ease.exit,
        },
        1.84
      );

    return () => {
      document.body.style.overflow = previousOverflow;
      tl.kill();
    };
  }, [onFinish, shouldAnimate]);

  const skipIntro = () => {
    timelineRef.current?.progress(1);
  };

  if (hidden) {
    return null;
  }

  return (
    <div className="intro-overlay" ref={overlayRef}>
      <div className="intro-glow" />

      <p className="intro-title" ref={titleRef}>
        GameGrid 2026
      </p>

      <div className="intro-stage">
        <div className="intro-streak" ref={streakRef} />
        <div className="intro-ball" ref={ballRef} />
        <div className="intro-shadow" ref={shadowRef} />
      </div>

      <button className="intro-skip" onClick={skipIntro} type="button">
        Pular
      </button>
    </div>
  );
}
