import { gsap } from "gsap";

export function captureRects(container, selector) {
  const rects = new Map();
  if (!container) {
    return rects;
  }

  const nodes = container.querySelectorAll(selector);
  nodes.forEach((node) => {
    const key = node.getAttribute("data-flip-key");
    if (!key) {
      return;
    }
    rects.set(key, node.getBoundingClientRect());
  });

  return rects;
}

export function playFlip(container, selector, previousRects, options = {}) {
  if (!container) {
    return;
  }

  const duration = options.duration ?? 0.45;
  const ease = options.ease ?? "power2.out";
  const nodes = container.querySelectorAll(selector);

  nodes.forEach((node) => {
    const key = node.getAttribute("data-flip-key");
    if (!key || !previousRects.has(key)) {
      return;
    }

    const previous = previousRects.get(key);
    const current = node.getBoundingClientRect();
    const deltaX = previous.left - current.left;
    const deltaY = previous.top - current.top;

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      return;
    }

    gsap.fromTo(
      node,
      { x: deltaX, y: deltaY },
      {
        x: 0,
        y: 0,
        duration,
        ease,
        clearProps: "x,y",
      }
    );
  });
}
