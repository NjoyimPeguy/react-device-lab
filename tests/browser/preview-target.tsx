import { useState } from "react";
import { createRoot } from "react-dom/client";

import {
  PREVIEW_ROUTE_EVENT,
  installPreviewBridge,
} from "../../src/index.js";
import "./preview-target.css";

const search = new URLSearchParams(window.location.search);
const bridgeEnabled = search.get("bridge") === "true";
const parentOrigin = search.get("parent");

if (bridgeEnabled && parentOrigin) {
  installPreviewBridge({ allowedParentOrigins: [parentOrigin] });
}

function TargetApplication() {
  const [route, setRoute] = useState(
    `${window.location.pathname}${window.location.search}${window.location.hash}`,
  );

  const navigate = () => {
    const next = new URL(window.location.href);
    next.searchParams.set("screen", "tasks");
    next.hash = "today";
    window.history.pushState({}, "", next);
    setRoute(`${next.pathname}${next.search}${next.hash}`);
    document.dispatchEvent(new Event(PREVIEW_ROUTE_EVENT));
  };

  const navigateAcrossOrigins = () => {
    const oppositeOrigin =
      window.location.origin === "http://127.0.0.1:4173"
        ? "http://127.0.0.1:4174"
        : "http://127.0.0.1:4173";
    window.location.href = new URL(
      "/tests/browser/preview-target.html?arrived=cross-origin",
      oppositeOrigin,
    ).href;
  };

  return (
    <main className="target-application">
      <header>
        <span aria-hidden="true">R</span>
        <div>
          <h1>Responsive task board</h1>
          <p>Generic embedded application</p>
        </div>
      </header>
      <section>
        <p className="target-application__eyebrow">Current destination</p>
        <output aria-label="Target application route">{route}</output>
        <button onClick={navigate} type="button">
          Open tasks
        </button>
        <button onClick={navigateAcrossOrigins} type="button">
          Navigate across origins
        </button>
        <a href="/tests/browser/preview-target.html?document=next">
          Open full document
        </a>
      </section>
      <div className="target-application__scroll-proof">
        <h2>Scrollable activity</h2>
        {Array.from({ length: 18 }, (_, index) => (
          <article key={index}>
            <strong>Activity {index + 1}</strong>
            <span>Neutral browser-preview test content</span>
          </article>
        ))}
      </div>
    </main>
  );
}

createRoot(document.querySelector("#root")!).render(<TargetApplication />);
