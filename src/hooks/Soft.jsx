import { useEffect, useRef, useState } from "react";
import useInView from "./useInView";

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
  const [ref, inView] = useInView({ threshold: 0.05 });
  const [settled, setSettled] = useState(false);

  const nodeRef = useRef(null);
  const currentY = useRef(0);
  const currentOpacity = useRef(1);
  const targetY = useRef(0);
  const targetOpacity = useRef(1);
  const frameRef = useRef(0);

  useEffect(() => {
    nodeRef.current = ref.current;
  }, [ref, inView]);

  useEffect(() => {
    if (!inView) return;

    const timer = setTimeout(() => {
      setSettled(true);
    }, REVEAL_MS + delay);

    return () => clearTimeout(timer);
  }, [inView, delay]);

  useEffect(() => {
    const node = nodeRef.current;

    if (!node || !settled) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const updateTarget = () => {
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight;

      if (rect.bottom < -80 || rect.top > vh + 80) return;

      const delta = rect.top + rect.height / 2 - vh / 2;

      targetY.current = clamp(
        -delta * gain,
        -distance,
        distance
      );

      targetOpacity.current = clamp(
        1 - (Math.abs(delta) / (vh / 2)) * (1 - fadeTo),
        fadeTo,
        1
      );
    };

    const animate = () => {
      frameRef.current = 0;

      currentY.current +=
        (targetY.current - currentY.current) * 0.12;

      currentOpacity.current +=
        (targetOpacity.current - currentOpacity.current) * 0.12;

      node.style.transform = `translate3d(0, ${currentY.current.toFixed(
        2
      )}px, 0)`;

      node.style.opacity = currentOpacity.current.toFixed(3);

      if (
        Math.abs(targetY.current - currentY.current) > 0.05 ||
        Math.abs(targetOpacity.current - currentOpacity.current) > 0.005
      ) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    const onScroll = () => {
      updateTarget();

      if (!frameRef.current) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    updateTarget();
    frameRef.current = requestAnimationFrame(animate);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }

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
    <div
      ref={ref}
      className={classes}
      style={delay ? { "--d": `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}