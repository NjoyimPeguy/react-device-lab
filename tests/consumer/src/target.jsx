import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./target.css";

const LOAD_GENERATION_KEY = "react-device-lab-packed-consumer-load-generation";

function nextLoadGeneration() {
  const current = Number(sessionStorage.getItem(LOAD_GENERATION_KEY));
  const next = Number.isFinite(current) ? current + 1 : 1;
  sessionStorage.setItem(LOAD_GENERATION_KEY, String(next));
  return next;
}

const loadGeneration = nextLoadGeneration();

function classify(width) {
  if (width < 600) return "compact";
  if (width < 840) return "medium";
  return "expanded";
}

function TargetApplication() {
  const [layout, setLayout] = useState(() => classify(window.innerWidth));
  const [route, setRoute] = useState(
    () => `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );

  useEffect(() => {
    const updateLayout = () => setLayout(classify(window.innerWidth));
    const updateRoute = () =>
      setRoute(
        `${window.location.pathname}${window.location.search}${window.location.hash}`,
      );

    window.addEventListener("popstate", updateRoute);
    window.addEventListener("resize", updateLayout);
    return () => {
      window.removeEventListener("popstate", updateRoute);
      window.removeEventListener("resize", updateLayout);
    };
  }, []);

  const openReports = () => {
    window.history.pushState(null, "", "/target.html?view=reports#summary");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <main data-layout={layout}>
      <p className="eyebrow">Responsive target</p>
      <h1>Release dashboard</h1>
      <p>
        This neutral target proves that media queries run against the installed
        package iframe.
      </p>
      <output aria-label="Target route">{route}</output>
      <output aria-label="Target load generation">{loadGeneration}</output>
      <button onClick={openReports} type="button">
        Open reports
      </button>
      <section aria-label="Layout result">
        <strong>{layout}</strong>
        <span>application layout</span>
      </section>
    </main>
  );
}

createRoot(document.getElementById("target-root")).render(
  <TargetApplication />,
);
