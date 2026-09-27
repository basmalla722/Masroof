import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function systemPrefersReduced() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
}

export function useMotion() {
  // "system" follows the OS, "full" and "calm" override it.
  const [preference, setPreference] = useState(() => {
    try {
      return localStorage.getItem("masroof-motion") || "system";
    } catch {
      return "system";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("masroof-motion", preference);
    } catch {
      /* storage blocked, the app still works */
    }
  }, [preference]);

  const reduced = preference === "system" && systemPrefersReduced();

  useEffect(() => {
    const root = document.documentElement;
    if (preference === "calm") root.setAttribute("data-motion", "calm");
    else root.removeAttribute("data-motion");
  }, [preference]);

  return { reduced, preference, setPreference };
}
