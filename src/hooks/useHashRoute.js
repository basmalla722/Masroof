import { useEffect, useState } from "react";

const ROUTES = ["dashboard", "expenses", "budgets", "insights"];

function readHash() {
  const raw = window.location.hash.replace(/^#\/?/, "");
  return ROUTES.includes(raw) ? raw : ROUTES[0];
}

export default function useHashRoute() {
  const [route, setRoute] = useState(readHash);

  useEffect(() => {
    function onChange() {
      setRoute(readHash());
    }
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  function go(next) {
    if (!ROUTES.includes(next)) return;
    window.location.hash = `/${next}`;
    setRoute(next);
  }

  return [route, go];
}

export { ROUTES };
