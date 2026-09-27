import { forwardRef, useEffect, useState } from "react";
import Logo from "./Logo";

const TABS = [
  { key: "dashboard", label: "Dashboard" },
  { key: "expenses", label: "Expenses" },
  { key: "budgets", label: "Budgets" },
  { key: "insights", label: "Insights" },
];

const Header = forwardRef(function Header({ route, onNavigate, theme, onToggleTheme, onGoTop }, ref) {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 300);

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="site-head" ref={ref}>
      <div className="site-head-top">
        <a
          className="brand"
          href="#/dashboard"
          onClick={(event) => {
            event.preventDefault();
            onNavigate("dashboard");
          }}
        >
          <Logo />
          <span className="brand-text">
            <strong>Masroof</strong>
            <em>Track what you spend</em>
          </span>
        </a>

        <button
          className="icon-button"
          onClick={onToggleTheme}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          title={theme === "light" ? "Dark mode" : "Light mode"}
        >
          {theme === "light" ? "Dark" : "Light"}
        </button>
      </div>

      <nav className="tabs" aria-label="Sections">
        {TABS.map((tab) => (
          <a
            key={tab.key}
            href={`#/${tab.key}`}
            className={`tab${route === tab.key ? " active" : ""}`}
            aria-current={route === tab.key ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              onNavigate(tab.key);
            }}
          >
            {tab.label}
          </a>
        ))}
        <button
          className={`tab to-top${showTop ? " show" : ""}`}
          onClick={onGoTop}
          title="Back to top"
        >
          &uarr; Top
        </button>
      </nav>
    </header>
  );
});

export default Header;
