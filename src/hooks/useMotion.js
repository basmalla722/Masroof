import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function systemPrefersReduced() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

// Motion is not configurable. The OS decides.
export function useMotion() {
  const [reduced, setReduced] = useState(systemPrefersReduced);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia(QUERY);
    const onChange = (event) => setReduced(event.matches);
    setReduced(media.matches);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return { reduced };
}
