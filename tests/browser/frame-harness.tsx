import { StrictMode, type CSSProperties } from "react";
import { createRoot } from "react-dom/client";

import {
  DEVICE_PRESETS,
  DeviceFrame,
  getDeviceFrameDimensions,
} from "../../src/index.js";
import "../../src/styles/index.css";
import "./frame-harness.css";

const search = new URLSearchParams(window.location.search);
const requestedId = search.get("device") ?? "iphone-17-pro";
const device =
  DEVICE_PRESETS.find(({ id }) => id === requestedId) ??
  DEVICE_PRESETS[0] ??
  (() => {
    throw new TypeError("The visual harness requires at least one device.");
  })();

const orientation =
  device.category === "tablet" ||
  device.category === "laptop" ||
  device.category === "desktop" ||
  device.category === "ultrawide"
    ? "landscape"
    : "portrait";
const frame = getDeviceFrameDimensions(device, orientation, true);
const scale = Math.min(1, 1020 / frame.width, 760 / frame.height);
const sampleSafeTop =
  device.frame.cutout === "dynamic-island"
    ? 34
    : device.frame.cutout === "traditional-notch"
      ? 25
      : device.frame.cutout === "punch-hole" ||
          device.frame.cutout === "tablet-notch" ||
          device.frame.cutout === "laptop-notch"
        ? 12
        : 0;
const sampleSafeLeft =
  device.frame.cutout === "cover-camera-pair" ? device.id.endsWith("-7-cover") ? 118 : 108 : 0;

function SampleApplication() {
  const style = {
    "--sample-safe-left": `${sampleSafeLeft}px`,
    "--sample-safe-top": `${sampleSafeTop}px`,
  } as CSSProperties;

  return (
    <div className="sample-app" style={style}>
      <header className="sample-app__header">
        <span className="sample-app__mark" aria-hidden="true">
          D
        </span>
        <div>
          <strong>Workspace</strong>
          <span>Responsive sample application</span>
        </div>
        <button type="button">New task</button>
      </header>
      <main className="sample-app__main">
        <section className="sample-app__hero">
          <p>Monday overview</p>
          <h1>Keep the week moving.</h1>
          <span>Three priorities are ready for review.</span>
        </section>
        <section className="sample-app__metrics" aria-label="Project metrics">
          <article>
            <span>Open</span>
            <strong>12</strong>
          </article>
          <article>
            <span>In review</span>
            <strong>4</strong>
          </article>
          <article>
            <span>Complete</span>
            <strong>28</strong>
          </article>
        </section>
        <section className="sample-app__tasks" aria-labelledby="tasks-title">
          <div className="sample-app__section-heading">
            <div>
              <p>Focus list</p>
              <h2 id="tasks-title">Today’s tasks</h2>
            </div>
            <span>3 items</span>
          </div>
          {[
            ["Review responsive navigation", "Design", "Today"],
            ["Prepare component notes", "Documentation", "Tomorrow"],
            ["Confirm release checklist", "Engineering", "Friday"],
          ].map(([title, label, due]) => (
            <article className="sample-app__task" key={title}>
              <span className="sample-app__check" aria-hidden="true" />
              <div>
                <strong>{title}</strong>
                <span>{label}</span>
              </div>
              <time>{due}</time>
            </article>
          ))}
        </section>
      </main>
      <nav className="sample-app__nav" aria-label="Sample navigation">
        <a href="#overview">Overview</a>
        <a href="#tasks">Tasks</a>
        <a href="#calendar">Calendar</a>
        <a href="#settings">Settings</a>
      </nav>
    </div>
  );
}

function FrameHarness() {
  return (
    <main className="frame-harness">
      <div
        className="frame-harness__stage"
        data-testid="frame-stage"
        style={{
          width: `${Math.ceil(frame.width * scale) + 48}px`,
          height: `${Math.ceil(frame.height * scale) + 48}px`,
        }}
      >
        <div
          className="frame-harness__scale-box"
          style={{
            width: `${frame.width * scale}px`,
            height: `${frame.height * scale}px`,
          }}
        >
          <div
            className="frame-harness__scaled-frame"
            style={{ transform: `scale(${scale})` }}
          >
            <DeviceFrame
              contentLabel={`${device.name} sample application`}
              device={device}
              orientation={orientation}
            >
              <SampleApplication />
            </DeviceFrame>
          </div>
        </div>
      </div>
    </main>
  );
}

createRoot(document.querySelector("#root")!).render(
  <StrictMode>
    <FrameHarness />
  </StrictMode>,
);
