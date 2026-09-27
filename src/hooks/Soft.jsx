import { useEffect, useRef, useState } from "react";

const REVEAL_MS = 620;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function Soft({
  children,
  delay = 0,
  distance = 70,
  fadeTo = 0.65,
  gain = 0.18,
  className = "",
}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  const [settled, setSettled] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      setSettled(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.05, rootMargin: "0px 0px -4% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView) return;
    const timer = setTimeout(() => setSettled(true), REVEAL_MS + delay);
    return () => clearTimeout(timer);
  }, [inView, delay]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !settled) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    function update() {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;

      if (rect.bottom < -80 || rect.top > vh + 80) return;

      const delta = rect.top + rect.height / 2 - vh / 2;
      const shift = clamp(-delta * gain, -distance, distance);
      const opacity = 1 - (Math.abs(delta) / (vh / 2)) * (1 - fadeTo);

      node.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
      node.style.opacity = opacity.toFixed(3);
    }

    function onScroll() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      node.style.transform = "";
      node.style.opacity = "";
    };
  }, [settled, distance, fadeTo, gain]);

  const classes = [
    "soft",
    inView ? "in" : "",
    settled ? "ready" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={ref} className={classes} style={delay ? { "--d": `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}
