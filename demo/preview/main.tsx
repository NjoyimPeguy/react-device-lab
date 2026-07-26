import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";

type View = "overview" | "components" | "activity";

const VIEWS: readonly View[] = ["overview", "components", "activity"];

function currentView(): View {
  const candidate = new URLSearchParams(window.location.search).get("view");
  return VIEWS.includes(candidate as View) ? (candidate as View) : "overview";
}

function navigate(view: View) {
  const next = view === "overview" ? "/preview/" : `/preview/?view=${view}`;
  window.history.pushState({}, "", next);
  window.dispatchEvent(new PopStateEvent("popstate"));
}

function Metric({
  label,
  value,
  trend,
}: {
  readonly label: string;
  readonly value: string;
  readonly trend: string;
}) {
  return (
    <article className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{trend}</small>
    </article>
  );
}

function Overview() {
  return (
    <>
      <section className="hero">
        <span className="eyebrow">Monday overview</span>
        <h2>Keep the week moving.</h2>
        <p>Three priorities are ready for review.</p>
      </section>
      <section aria-label="Workspace metrics" className="metrics">
        <Metric label="Open" trend="+2 today" value="12" />
        <Metric label="In review" trend="On track" value="4" />
        <Metric label="Complete" trend="This week" value="28" />
      </section>
      <section className="card task-card">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Focus list</span>
            <h2>Today’s tasks</h2>
          </div>
          <span className="count">3 items</span>
        </div>
        <ul>
          <li>
            <span className="check" />
            <span><strong>Review responsive navigation</strong><small>Design systems</small></span>
            <time>Today</time>
          </li>
          <li>
            <span className="check" />
            <span><strong>Prepare component notes</strong><small>Documentation</small></span>
            <time>Tomorrow</time>
          </li>
          <li>
            <span className="check" />
            <span><strong>Confirm release checklist</strong><small>Engineering</small></span>
            <time>Friday</time>
          </li>
        </ul>
      </section>
    </>
  );
}

function Components() {
  return (
    <section className="card gallery">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Component gallery</span>
          <h2>Interface building blocks</h2>
        </div>
      </div>
      <div className="swatches">
        <button type="button">Primary action</button>
        <button className="secondary" type="button">Secondary</button>
        <label>
          Project name
          <input defaultValue="Responsive audit" />
        </label>
        <div className="notice">A neutral status message with a clear next step.</div>
      </div>
    </section>
  );
}

function Activity() {
  return (
    <section className="card activity">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Recent activity</span>
          <h2>Workspace updates</h2>
        </div>
      </div>
      <ol>
        <li><span>09:42</span><strong>Viewport review completed</strong><small>Desktop and tablet checks passed.</small></li>
        <li><span>09:18</span><strong>Component notes updated</strong><small>Keyboard behavior documented.</small></li>
        <li><span>08:55</span><strong>New task assigned</strong><small>Verify the compact layout.</small></li>
      </ol>
    </section>
  );
}

function App() {
  const [view, setView] = useState(currentView);

  useEffect(() => {
    const update = () => setView(currentView());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);

  return (
    <div className="app-shell">
      <header>
        <a aria-label="Northstar overview" className="brand" href="/preview/">
          <span>N</span>
          <strong>Northstar</strong>
        </a>
        <button type="button">New task</button>
      </header>
      <main>
        {view === "overview" ? <Overview /> : null}
        {view === "components" ? <Components /> : null}
        {view === "activity" ? <Activity /> : null}
      </main>
      <nav aria-label="Primary">
        <div className="nav-actions">
          {VIEWS.map((item) => (
            <button
              aria-current={view === item ? "page" : undefined}
              key={item}
              onClick={() => navigate(item)}
              type="button"
            >
              <span aria-hidden="true">
                {item === "overview" ? "⌂" : item === "components" ? "◇" : "↻"}
              </span>
              {item[0]?.toLocaleUpperCase("en")}{item.slice(1)}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
