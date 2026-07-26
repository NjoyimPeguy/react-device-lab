import type { DevicePreset } from "../types/device.js";

interface FrameFeaturesProps {
  readonly device: DevicePreset;
}

function Cutout({ device }: FrameFeaturesProps) {
  switch (device.frame.cutout) {
    case "dynamic-island":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--island"
          data-rdl-feature="dynamic-island"
        >
          <span className="rdl-frame__lens" />
        </span>
      );
    case "traditional-notch":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--notch"
          data-rdl-feature="traditional-notch"
        >
          <span className="rdl-frame__sensor" />
          <span className="rdl-frame__earpiece" />
          <span className="rdl-frame__lens" />
        </span>
      );
    case "earpiece":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--earpiece"
          data-rdl-feature="earpiece"
        />
      );
    case "punch-hole":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--punch"
          data-rdl-feature="punch-hole"
        >
          <span className="rdl-frame__lens" />
        </span>
      );
    case "cover-camera-pair":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--camera-pair"
          data-rdl-feature="cover-camera-pair"
        >
          <span className="rdl-frame__cover-lens" />
          <span className="rdl-frame__cover-lens" />
        </span>
      );
    case "tablet-camera":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--tablet-camera"
          data-rdl-feature="tablet-camera"
        >
          <span className="rdl-frame__lens" />
        </span>
      );
    case "tablet-notch":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--tablet-notch"
          data-rdl-feature="tablet-notch"
        >
          <span className="rdl-frame__lens" />
        </span>
      );
    case "laptop-notch":
      return (
        <span
          className="rdl-frame__cutout rdl-frame__cutout--laptop-notch"
          data-rdl-feature="laptop-notch"
        >
          <span className="rdl-frame__lens" />
        </span>
      );
    case "none":
      return null;
  }
}

function Control({
  control,
}: {
  readonly control: DevicePreset["frame"]["controls"][number];
}) {
  return (
    <span
      className={`rdl-frame__control rdl-frame__control--${control}`}
      data-rdl-feature={control}
    />
  );
}

export function FrameFeatures({ device }: FrameFeaturesProps) {
  const isLaptop =
    device.frame.style === "laptop" || device.frame.style === "laptop-notch";
  const isMonitor =
    device.frame.style === "monitor" ||
    device.frame.style === "monitor-ultrawide";

  return (
    <div className="rdl-frame__hardware" data-rdl-hardware aria-hidden="true">
      <Cutout device={device} />
      {device.frame.style === "phone-home-button" ? (
        <span
          className="rdl-frame__home-button"
          data-rdl-feature="home-button"
        />
      ) : null}
      {device.frame.style === "laptop" ? (
        <span
          className="rdl-frame__camera rdl-frame__camera--laptop"
          data-rdl-feature="laptop-camera"
        />
      ) : null}
      {isMonitor ? (
        <span
          className="rdl-frame__camera rdl-frame__camera--monitor"
          data-rdl-feature="monitor-camera"
        />
      ) : null}
      {device.fold?.crease ? (
        <span className="rdl-frame__crease" data-rdl-feature="fold-crease" />
      ) : null}
      <span className="rdl-frame__controls">
        {device.frame.controls.map((control) => (
          <Control control={control} key={control} />
        ))}
      </span>
      {isLaptop ? (
        <span className="rdl-frame__laptop-base" data-rdl-feature="laptop-base">
          <span className="rdl-frame__trackpad-mark" />
        </span>
      ) : null}
      {isMonitor ? (
        <span
          className="rdl-frame__monitor-stand"
          data-rdl-feature="monitor-stand"
        >
          <span className="rdl-frame__monitor-neck" />
          <span className="rdl-frame__monitor-foot" />
        </span>
      ) : null}
      {device.frame.style === "monitor-ultrawide" ? (
        <span className="rdl-frame__ultrawide-mark" data-rdl-feature="ultrawide" />
      ) : null}
    </div>
  );
}
