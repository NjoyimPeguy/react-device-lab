import type {
  DeviceDataSource,
  DeviceFrameMetadata,
  DeviceInputProfile,
  DevicePreset,
} from "../types/device.js";

const IOS_VIEWPORT_SOURCE: DeviceDataSource = {
  kind: "platform",
  url: "https://developer.apple.com/design/human-interface-guidelines/layout",
  note: "CSS point viewport profile validated against the documented panel scale.",
};

const ANDROID_VIEWPORT_SOURCE: DeviceDataSource = {
  kind: "profile",
  url: "https://developer.android.com/reference/android/util/DisplayMetrics",
  note: "Package-selected browser profile with an explicit logical density; Android reports density independently from the physical panel density.",
};

const DESKTOP_VIEWPORT_SOURCE: DeviceDataSource = {
  kind: "profile",
  url: "https://www.w3.org/TR/cssom-view-1/",
  note: "Default CSS viewport profile selected for responsive application testing.",
};

const APPLE_IPHONE_17: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/iphone-17/specs/",
  note: "Manufacturer panel resolution for iPhone 17.",
};

const APPLE_IPHONE_AIR: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/iphone-air/specs/",
  note: "Manufacturer panel resolution for iPhone Air.",
};

const APPLE_IPHONE_17_PRO: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/iphone-17-pro/specs/",
  note: "Manufacturer panel resolution for iPhone 17 Pro and Pro Max.",
};

const APPLE_IPAD_10: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://support.apple.com/en-us/111840",
  note: "Manufacturer panel resolution for iPad (10th generation).",
};

const APPLE_IPAD_11: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/ipad-11/specs/",
  note: "Manufacturer panel resolution for iPad (A16).",
};

const APPLE_IPAD_MINI: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/ipad-mini/specs/",
  note: "Manufacturer panel resolution for iPad mini (A17 Pro).",
};

const APPLE_IPAD_AIR: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/ipad-air/specs/",
  note: "Manufacturer panel resolution for the current iPad Air sizes.",
};

const APPLE_IPAD_PRO: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/ipad-pro/specs/",
  note: "Manufacturer panel resolution for the current iPad Pro sizes.",
};

function appleSupportSource(
  articleId: string,
  model: string,
): DeviceDataSource {
  return {
    kind: "manufacturer",
    url: `https://support.apple.com/en-us/${articleId}`,
    note: `Manufacturer panel resolution for ${model}.`,
  };
}

const SAMSUNG_S9: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-s9/specs/",
  note: "Manufacturer main-display resolution for Galaxy S9+.",
};

const SAMSUNG_S21: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-s21-5g/specs/",
  note: "Manufacturer main-display resolution for Galaxy S21.",
};

const SAMSUNG_S22: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-s22/specs/",
  note: "Manufacturer main-display resolution for the Galaxy S22 family.",
};

const SAMSUNG_S23: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-s23/specs/",
  note: "Manufacturer main-display resolution for the Galaxy S23 family.",
};

const SAMSUNG_S24: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-s24/specs/",
  note: "Manufacturer main-display resolution for the Galaxy S24 family.",
};

const SAMSUNG_S25: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-s25/specs/",
  note: "Manufacturer main-display resolution for the Galaxy S25 family.",
};

const SAMSUNG_S25_EDGE: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/us/smartphones/galaxy-s/galaxy-s25-edge-silver-256gb-sm-s937uzsaxaa/",
  note: "Manufacturer main-display resolution for Galaxy S25 Edge.",
};

const SAMSUNG_S26: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://images.samsung.com/is/content/samsung/assets/global/ir/docs/2026_1Q_Interim_Report.pdf",
  note: "Manufacturer-reported main-display resolution for the Galaxy S26 family.",
};

const SAMSUNG_A55: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-a55-5g/specs/",
  note: "Manufacturer main-display resolution for Galaxy A55.",
};

const SAMSUNG_FLIP_6: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-z-flip6/specs/",
  note: "Manufacturer main-display resolution for Galaxy Z Flip 6.",
};

const SAMSUNG_FLIP_7: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-z-flip7/specs/",
  note: "Manufacturer main-display resolution for Galaxy Z Flip 7.",
};

const SAMSUNG_FOLD_6: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-z-fold6/specs/",
  note: "Manufacturer main- and cover-display resolutions for Galaxy Z Fold 6.",
};

const SAMSUNG_FOLD_7: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/us/smartphones/galaxy-z/galaxy-z-fold7-jetblack-512gb-sm-f966uzkexag/",
  note: "Manufacturer main- and cover-display resolutions for Galaxy Z Fold 7.",
};

const SAMSUNG_TAB_S9: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-tab-s9/specs/",
  note: "Manufacturer panel resolution for Galaxy Tab S9.",
};

const SAMSUNG_TAB_S10: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-tab-s10-ultra/specs/",
  note: "Manufacturer panel resolutions for Galaxy Tab S10+ and S10 Ultra.",
};

const SAMSUNG_TAB_S11: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.samsung.com/global/galaxy/galaxy-tab-s11-ultra/specs/",
  note: "Manufacturer panel resolution for Galaxy Tab S11 Ultra.",
};

const GOOGLE_PIXEL_8: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_8_specs",
  note: "Manufacturer panel resolution for Pixel 8.",
};

const GOOGLE_PIXEL_8_PRO: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_8_pro_specs",
  note: "Manufacturer panel resolution for Pixel 8 Pro.",
};

const GOOGLE_PIXEL_8A: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_8a_specs",
  note: "Manufacturer panel resolution for Pixel 8a.",
};

const GOOGLE_PIXEL_9: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_9_specs",
  note: "Manufacturer panel resolution for Pixel 9.",
};

const GOOGLE_PIXEL_9_PRO: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_9_pro_specs",
  note: "Manufacturer panel resolution for Pixel 9 Pro and Pro XL.",
};

const GOOGLE_PIXEL_9A: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_9a_specs",
  note: "Manufacturer panel resolution for Pixel 9a.",
};

const GOOGLE_PIXEL_10: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_10_specs",
  note: "Manufacturer panel resolution for Pixel 10.",
};

const GOOGLE_PIXEL_10_PRO: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_10_pro_specs",
  note: "Manufacturer panel resolution for Pixel 10 Pro and Pro XL.",
};

const GOOGLE_PIXEL_FOLD: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_9_pro_fold_specs",
  note: "Manufacturer inner- and outer-display resolutions for Pixel 9 Pro Fold.",
};

const GOOGLE_TABLET: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://store.google.com/product/pixel_tablet_specs",
  note: "Manufacturer panel resolution for Pixel Tablet.",
};

const APPLE_MACBOOK: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.apple.com/macbook-air/specs/",
  note: "Manufacturer native panel resolution; the logical workspace profile is independent.",
};

const MICROSOFT_SURFACE: DeviceDataSource = {
  kind: "manufacturer",
  url: "https://www.microsoft.com/surface/business/surface-pro-9",
  note: "Manufacturer native panel resolution for Surface Pro 9.",
};

const TOUCH_INPUT: DeviceInputProfile = {
  touch: true,
  pointer: "coarse",
  hover: false,
};

const DESKTOP_INPUT: DeviceInputProfile = {
  touch: false,
  pointer: "fine",
  hover: true,
};

const HYBRID_INPUT: DeviceInputProfile = {
  touch: true,
  pointer: "fine",
  hover: true,
};

const IPHONE_HOME_FRAME: DeviceFrameMetadata = {
  style: "phone-home-button",
  cutout: "earpiece",
  cornerProfile: "rounded",
  controls: ["mute", "volume", "power", "home"],
};

const IPHONE_NOTCH_FRAME: DeviceFrameMetadata = {
  style: "phone-notch",
  cutout: "traditional-notch",
  cornerProfile: "rounded-large",
  controls: ["mute", "volume", "power"],
};

const IPHONE_NOTCH_ACTION_FRAME: DeviceFrameMetadata = {
  style: "phone-notch",
  cutout: "traditional-notch",
  cornerProfile: "rounded-large",
  controls: ["action", "volume", "power"],
};

const IPHONE_ISLAND_FRAME: DeviceFrameMetadata = {
  style: "phone-island",
  cutout: "dynamic-island",
  cornerProfile: "rounded-large",
  controls: ["mute", "volume", "power"],
};

const IPHONE_ISLAND_ACTION_FRAME: DeviceFrameMetadata = {
  style: "phone-island",
  cutout: "dynamic-island",
  cornerProfile: "rounded-large",
  controls: ["action", "volume", "power"],
};

const IPHONE_ISLAND_CAMERA_FRAME: DeviceFrameMetadata = {
  style: "phone-island",
  cutout: "dynamic-island",
  cornerProfile: "rounded-large",
  controls: ["action", "camera-control", "volume", "power"],
};

const ANDROID_EARPIECE_FRAME: DeviceFrameMetadata = {
  style: "phone-earpiece",
  cutout: "earpiece",
  cornerProfile: "rounded",
  controls: ["volume", "power"],
};

const ANDROID_PHONE_FRAME: DeviceFrameMetadata = {
  style: "phone-punch-hole",
  cutout: "punch-hole",
  cornerProfile: "rounded",
  controls: ["volume", "power"],
};

const ANDROID_PHONE_SQUARE_FRAME: DeviceFrameMetadata = {
  style: "phone-punch-hole",
  cutout: "punch-hole",
  cornerProfile: "rounded-compact",
  controls: ["volume", "power"],
};

const FOLDABLE_COVER_FRAME: DeviceFrameMetadata = {
  style: "foldable-cover",
  cutout: "punch-hole",
  cornerProfile: "rounded",
  controls: ["volume", "power"],
};

const FOLDABLE_FLIP_COVER_FRAME: DeviceFrameMetadata = {
  style: "foldable-cover",
  cutout: "cover-camera-pair",
  cornerProfile: "rounded",
  controls: ["volume", "power"],
};

const FOLDABLE_UNFOLDED_FRAME: DeviceFrameMetadata = {
  style: "foldable-unfolded",
  cutout: "punch-hole",
  cornerProfile: "rounded-compact",
  controls: ["volume", "power"],
};

const TABLET_FRAME: DeviceFrameMetadata = {
  style: "tablet",
  cutout: "tablet-camera",
  cornerProfile: "rounded-compact",
  controls: ["volume", "power"],
};

const TABLET_NOTCH_FRAME: DeviceFrameMetadata = {
  style: "tablet-notch",
  cutout: "tablet-notch",
  cornerProfile: "rounded-compact",
  controls: ["volume", "power"],
};

const LAPTOP_FRAME: DeviceFrameMetadata = {
  style: "laptop",
  cutout: "none",
  cornerProfile: "rounded-compact",
  controls: ["power"],
};

const LAPTOP_NOTCH_FRAME: DeviceFrameMetadata = {
  style: "laptop-notch",
  cutout: "laptop-notch",
  cornerProfile: "rounded-compact",
  controls: ["power"],
};

const MONITOR_FRAME: DeviceFrameMetadata = {
  style: "monitor",
  cutout: "none",
  cornerProfile: "squared",
  controls: ["power"],
};

const ULTRAWIDE_FRAME: DeviceFrameMetadata = {
  style: "monitor-ultrawide",
  cutout: "none",
  cornerProfile: "squared",
  controls: ["power"],
};

interface PresetDefinition
  extends Omit<
    DevicePreset,
    | "logicalViewport"
    | "physicalResolution"
    | "devicePixelRatio"
    | "input"
    | "fold"
  > {
  readonly logical: readonly [width: number, height: number];
  readonly physical: readonly [width: number, height: number] | null;
  readonly physicalSource?: DeviceDataSource;
  readonly ratio: number;
  readonly input?: DeviceInputProfile;
  readonly fold?: DevicePreset["fold"];
}

function createPreset(definition: PresetDefinition): DevicePreset {
  const baseLogicalSource =
    definition.platform === "ios"
      ? IOS_VIEWPORT_SOURCE
      : definition.platform === "android"
        ? ANDROID_VIEWPORT_SOURCE
        : DESKTOP_VIEWPORT_SOURCE;
  const profile =
    definition.platform === "ios"
      ? `iOS CSS point profile: ${definition.logical[0]} × ${definition.logical[1]} at ${definition.ratio}×`
      : definition.platform === "android"
        ? `Default Android browser profile: ${definition.logical[0]} × ${definition.logical[1]} CSS px at ${definition.ratio}×`
        : `Desktop CSS viewport profile: ${definition.logical[0]} × ${definition.logical[1]} at ${definition.ratio}×`;
  const androidProfile =
    definition.platform === "android"
      ? {
          browserChrome: "excluded" as const,
          densityDpi: definition.ratio * 160,
          displaySize: "default" as const,
        }
      : null;
  const logicalSource =
    definition.platform === "android"
      ? {
          ...baseLogicalSource,
          note: `${definition.name} uses the package-selected ${definition.logical[0]} × ${definition.logical[1]} CSS-pixel profile at ${androidProfile?.densityDpi} density DPI with the default display-size setting and browser chrome excluded.`,
        }
      : baseLogicalSource;
  const physicalResolution = definition.physical
    ? {
        width: definition.physical[0],
        height: definition.physical[1],
        source: (() => {
          const source =
            definition.physicalSource ??
            (() => {
              throw new TypeError(
                `Physical resolution source is missing for ${definition.id}.`,
              );
            })();
          return {
            ...source,
            note: `${source.note} Preset: ${definition.name}.`,
          };
        })(),
      }
    : null;

  return {
    id: definition.id,
    name: definition.name,
    platform: definition.platform,
    category: definition.category,
    family: definition.family,
    logicalViewport: {
      width: definition.logical[0],
      height: definition.logical[1],
      profile,
      source: logicalSource,
      androidProfile,
    },
    physicalResolution,
    devicePixelRatio: definition.ratio,
    input:
      definition.input ??
      (definition.platform === "desktop" ? DESKTOP_INPUT : TOUCH_INPUT),
    frame: definition.frame,
    fold: definition.fold ?? null,
  };
}

function deepFreeze<T>(value: T): T {
  if (typeof value !== "object" || value === null || Object.isFrozen(value)) {
    return value;
  }
  for (const nested of Object.values(value)) {
    deepFreeze(nested);
  }
  return Object.freeze(value);
}

const definitions: readonly PresetDefinition[] = [
  {
    id: "iphone-se-3",
    name: "iPhone SE (3rd generation)",
    platform: "ios",
    category: "phone",
    family: "iPhone SE",
    logical: [375, 667],
    physical: [750, 1334],
    physicalSource: appleSupportSource(
      "111866",
      "iPhone SE (3rd generation)",
    ),
    ratio: 2,
    frame: IPHONE_HOME_FRAME,
  },
  {
    id: "iphone-13-mini",
    name: "iPhone 13 mini",
    platform: "ios",
    category: "phone",
    family: "iPhone 13",
    logical: [375, 812],
    physical: [1080, 2340],
    physicalSource: appleSupportSource("111873", "iPhone 13 mini"),
    ratio: 3,
    frame: IPHONE_NOTCH_FRAME,
  },
  {
    id: "iphone-14",
    name: "iPhone 14",
    platform: "ios",
    category: "phone",
    family: "iPhone 14",
    logical: [390, 844],
    physical: [1170, 2532],
    physicalSource: appleSupportSource("111850", "iPhone 14"),
    ratio: 3,
    frame: IPHONE_NOTCH_FRAME,
  },
  {
    id: "iphone-14-plus",
    name: "iPhone 14 Plus",
    platform: "ios",
    category: "phone",
    family: "iPhone 14",
    logical: [428, 926],
    physical: [1284, 2778],
    physicalSource: appleSupportSource("111854", "iPhone 14 Plus"),
    ratio: 3,
    frame: IPHONE_NOTCH_FRAME,
  },
  {
    id: "iphone-14-pro",
    name: "iPhone 14 Pro",
    platform: "ios",
    category: "phone",
    family: "iPhone 14 Pro",
    logical: [393, 852],
    physical: [1179, 2556],
    physicalSource: appleSupportSource("111849", "iPhone 14 Pro"),
    ratio: 3,
    frame: IPHONE_ISLAND_FRAME,
  },
  {
    id: "iphone-14-pro-max",
    name: "iPhone 14 Pro Max",
    platform: "ios",
    category: "phone",
    family: "iPhone 14 Pro",
    logical: [430, 932],
    physical: [1290, 2796],
    physicalSource: appleSupportSource("111846", "iPhone 14 Pro Max"),
    ratio: 3,
    frame: IPHONE_ISLAND_FRAME,
  },
  {
    id: "iphone-15",
    name: "iPhone 15",
    platform: "ios",
    category: "phone",
    family: "iPhone 15",
    logical: [393, 852],
    physical: [1179, 2556],
    physicalSource: appleSupportSource("111831", "iPhone 15"),
    ratio: 3,
    frame: IPHONE_ISLAND_FRAME,
  },
  {
    id: "iphone-15-plus",
    name: "iPhone 15 Plus",
    platform: "ios",
    category: "phone",
    family: "iPhone 15",
    logical: [430, 932],
    physical: [1290, 2796],
    physicalSource: appleSupportSource("111830", "iPhone 15 Plus"),
    ratio: 3,
    frame: IPHONE_ISLAND_FRAME,
  },
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    platform: "ios",
    category: "phone",
    family: "iPhone 15 Pro",
    logical: [393, 852],
    physical: [1179, 2556],
    physicalSource: appleSupportSource("111829", "iPhone 15 Pro"),
    ratio: 3,
    frame: IPHONE_ISLAND_ACTION_FRAME,
  },
  {
    id: "iphone-15-pro-max",
    name: "iPhone 15 Pro Max",
    platform: "ios",
    category: "phone",
    family: "iPhone 15 Pro",
    logical: [430, 932],
    physical: [1290, 2796],
    physicalSource: appleSupportSource("111828", "iPhone 15 Pro Max"),
    ratio: 3,
    frame: IPHONE_ISLAND_ACTION_FRAME,
  },
  {
    id: "iphone-16e",
    name: "iPhone 16e",
    platform: "ios",
    category: "phone",
    family: "iPhone 16",
    logical: [390, 844],
    physical: [1170, 2532],
    physicalSource: appleSupportSource("122208", "iPhone 16e"),
    ratio: 3,
    frame: IPHONE_NOTCH_ACTION_FRAME,
  },
  {
    id: "iphone-16",
    name: "iPhone 16",
    platform: "ios",
    category: "phone",
    family: "iPhone 16",
    logical: [393, 852],
    physical: [1179, 2556],
    physicalSource: appleSupportSource("121029", "iPhone 16"),
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "iphone-16-plus",
    name: "iPhone 16 Plus",
    platform: "ios",
    category: "phone",
    family: "iPhone 16",
    logical: [430, 932],
    physical: [1290, 2796],
    physicalSource: appleSupportSource("121030", "iPhone 16 Plus"),
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "iphone-16-pro",
    name: "iPhone 16 Pro",
    platform: "ios",
    category: "phone",
    family: "iPhone 16 Pro",
    logical: [402, 874],
    physical: [1206, 2622],
    physicalSource: appleSupportSource("121031", "iPhone 16 Pro"),
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "iphone-16-pro-max",
    name: "iPhone 16 Pro Max",
    platform: "ios",
    category: "phone",
    family: "iPhone 16 Pro",
    logical: [440, 956],
    physical: [1320, 2868],
    physicalSource: appleSupportSource("121032", "iPhone 16 Pro Max"),
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "iphone-17",
    name: "iPhone 17",
    platform: "ios",
    category: "phone",
    family: "iPhone 17",
    logical: [402, 874],
    physical: [1206, 2622],
    physicalSource: APPLE_IPHONE_17,
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "iphone-air",
    name: "iPhone Air",
    platform: "ios",
    category: "phone",
    family: "iPhone Air",
    logical: [420, 912],
    physical: [1260, 2736],
    physicalSource: APPLE_IPHONE_AIR,
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "iphone-17-pro",
    name: "iPhone 17 Pro",
    platform: "ios",
    category: "phone",
    family: "iPhone 17 Pro",
    logical: [402, 874],
    physical: [1206, 2622],
    physicalSource: APPLE_IPHONE_17_PRO,
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "iphone-17-pro-max",
    name: "iPhone 17 Pro Max",
    platform: "ios",
    category: "phone",
    family: "iPhone 17 Pro",
    logical: [440, 956],
    physical: [1320, 2868],
    physicalSource: APPLE_IPHONE_17_PRO,
    ratio: 3,
    frame: IPHONE_ISLAND_CAMERA_FRAME,
  },
  {
    id: "ipad-10",
    name: "iPad (10th generation)",
    platform: "ios",
    category: "tablet",
    family: "iPad",
    logical: [820, 1180],
    physical: [1640, 2360],
    physicalSource: APPLE_IPAD_10,
    ratio: 2,
    frame: TABLET_FRAME,
  },
  {
    id: "ipad-11",
    name: "iPad (A16)",
    platform: "ios",
    category: "tablet",
    family: "iPad",
    logical: [820, 1180],
    physical: [1640, 2360],
    physicalSource: APPLE_IPAD_11,
    ratio: 2,
    frame: TABLET_FRAME,
  },
  {
    id: "ipad-mini",
    name: "iPad mini (A17 Pro)",
    platform: "ios",
    category: "tablet",
    family: "iPad mini",
    logical: [744, 1133],
    physical: [1488, 2266],
    physicalSource: APPLE_IPAD_MINI,
    ratio: 2,
    frame: TABLET_FRAME,
  },
  {
    id: "ipad-air-11",
    name: "iPad Air 11-inch",
    platform: "ios",
    category: "tablet",
    family: "iPad Air",
    logical: [820, 1180],
    physical: [1640, 2360],
    physicalSource: APPLE_IPAD_AIR,
    ratio: 2,
    frame: TABLET_FRAME,
  },
  {
    id: "ipad-air-13",
    name: "iPad Air 13-inch",
    platform: "ios",
    category: "tablet",
    family: "iPad Air",
    logical: [1024, 1366],
    physical: [2048, 2732],
    physicalSource: APPLE_IPAD_AIR,
    ratio: 2,
    frame: TABLET_FRAME,
  },
  {
    id: "ipad-pro-11",
    name: "iPad Pro 11-inch",
    platform: "ios",
    category: "tablet",
    family: "iPad Pro",
    logical: [834, 1210],
    physical: [1668, 2420],
    physicalSource: APPLE_IPAD_PRO,
    ratio: 2,
    frame: TABLET_FRAME,
  },
  {
    id: "ipad-pro-13",
    name: "iPad Pro 13-inch",
    platform: "ios",
    category: "tablet",
    family: "iPad Pro",
    logical: [1032, 1376],
    physical: [2064, 2752],
    physicalSource: APPLE_IPAD_PRO,
    ratio: 2,
    frame: TABLET_FRAME,
  },
  {
    id: "galaxy-s9-plus",
    name: "Galaxy S9+",
    platform: "android",
    category: "phone",
    family: "Galaxy S",
    logical: [320, 658],
    physical: [1440, 2960],
    physicalSource: SAMSUNG_S9,
    ratio: 4.5,
    frame: ANDROID_EARPIECE_FRAME,
  },
  {
    id: "galaxy-s21",
    name: "Galaxy S21",
    platform: "android",
    category: "phone",
    family: "Galaxy S",
    logical: [360, 800],
    physical: [1080, 2400],
    physicalSource: SAMSUNG_S21,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s22",
    name: "Galaxy S22",
    platform: "android",
    category: "phone",
    family: "Galaxy S",
    logical: [360, 780],
    physical: [1080, 2340],
    physicalSource: SAMSUNG_S22,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s23",
    name: "Galaxy S23",
    platform: "android",
    category: "phone",
    family: "Galaxy S",
    logical: [360, 780],
    physical: [1080, 2340],
    physicalSource: SAMSUNG_S23,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    platform: "android",
    category: "phone",
    family: "Galaxy S24",
    logical: [360, 780],
    physical: [1080, 2340],
    physicalSource: SAMSUNG_S24,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s24-plus",
    name: "Galaxy S24+",
    platform: "android",
    category: "phone",
    family: "Galaxy S24",
    logical: [384, 832],
    physical: [1440, 3120],
    physicalSource: SAMSUNG_S24,
    ratio: 3.75,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s24-ultra",
    name: "Galaxy S24 Ultra",
    platform: "android",
    category: "phone",
    family: "Galaxy S24",
    logical: [384, 832],
    physical: [1440, 3120],
    physicalSource: SAMSUNG_S24,
    ratio: 3.75,
    frame: ANDROID_PHONE_SQUARE_FRAME,
  },
  {
    id: "galaxy-s25",
    name: "Galaxy S25",
    platform: "android",
    category: "phone",
    family: "Galaxy S25",
    logical: [360, 780],
    physical: [1080, 2340],
    physicalSource: SAMSUNG_S25,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s25-plus",
    name: "Galaxy S25+",
    platform: "android",
    category: "phone",
    family: "Galaxy S25",
    logical: [384, 832],
    physical: [1440, 3120],
    physicalSource: SAMSUNG_S25,
    ratio: 3.75,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s25-edge",
    name: "Galaxy S25 Edge",
    platform: "android",
    category: "phone",
    family: "Galaxy S25",
    logical: [384, 832],
    physical: [1440, 3120],
    physicalSource: SAMSUNG_S25_EDGE,
    ratio: 3.75,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s25-ultra",
    name: "Galaxy S25 Ultra",
    platform: "android",
    category: "phone",
    family: "Galaxy S25",
    logical: [384, 832],
    physical: [1440, 3120],
    physicalSource: SAMSUNG_S25,
    ratio: 3.75,
    frame: ANDROID_PHONE_SQUARE_FRAME,
  },
  {
    id: "galaxy-s26",
    name: "Galaxy S26",
    platform: "android",
    category: "phone",
    family: "Galaxy S26",
    logical: [360, 780],
    physical: [1080, 2340],
    physicalSource: SAMSUNG_S26,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s26-plus",
    name: "Galaxy S26+",
    platform: "android",
    category: "phone",
    family: "Galaxy S26",
    logical: [384, 832],
    physical: [1440, 3120],
    physicalSource: SAMSUNG_S26,
    ratio: 3.75,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-s26-ultra",
    name: "Galaxy S26 Ultra",
    platform: "android",
    category: "phone",
    family: "Galaxy S26",
    logical: [384, 832],
    physical: [1440, 3120],
    physicalSource: SAMSUNG_S26,
    ratio: 3.75,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-a55",
    name: "Galaxy A55",
    platform: "android",
    category: "phone",
    family: "Galaxy A",
    logical: [480, 1040],
    physical: [1080, 2340],
    physicalSource: SAMSUNG_A55,
    ratio: 2.25,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    platform: "android",
    category: "phone",
    family: "Pixel 8",
    logical: [360, 800],
    physical: [1080, 2400],
    physicalSource: GOOGLE_PIXEL_8,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-8-pro",
    name: "Pixel 8 Pro",
    platform: "android",
    category: "phone",
    family: "Pixel 8",
    logical: [448, 998],
    physical: [1344, 2992],
    physicalSource: GOOGLE_PIXEL_8_PRO,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-8a",
    name: "Pixel 8a",
    platform: "android",
    category: "phone",
    family: "Pixel 8",
    logical: [360, 800],
    physical: [1080, 2400],
    physicalSource: GOOGLE_PIXEL_8A,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-9",
    name: "Pixel 9",
    platform: "android",
    category: "phone",
    family: "Pixel 9",
    logical: [360, 808],
    physical: [1080, 2424],
    physicalSource: GOOGLE_PIXEL_9,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-9-pro",
    name: "Pixel 9 Pro",
    platform: "android",
    category: "phone",
    family: "Pixel 9",
    logical: [427, 952],
    physical: [1280, 2856],
    physicalSource: GOOGLE_PIXEL_9_PRO,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-9-pro-xl",
    name: "Pixel 9 Pro XL",
    platform: "android",
    category: "phone",
    family: "Pixel 9",
    logical: [448, 998],
    physical: [1344, 2992],
    physicalSource: GOOGLE_PIXEL_9_PRO,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-9a",
    name: "Pixel 9a",
    platform: "android",
    category: "phone",
    family: "Pixel 9",
    logical: [360, 808],
    physical: [1080, 2424],
    physicalSource: GOOGLE_PIXEL_9A,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-10",
    name: "Pixel 10",
    platform: "android",
    category: "phone",
    family: "Pixel 10",
    logical: [360, 808],
    physical: [1080, 2424],
    physicalSource: GOOGLE_PIXEL_10,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-10-pro",
    name: "Pixel 10 Pro",
    platform: "android",
    category: "phone",
    family: "Pixel 10",
    logical: [427, 952],
    physical: [1280, 2856],
    physicalSource: GOOGLE_PIXEL_10_PRO,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "pixel-10-pro-xl",
    name: "Pixel 10 Pro XL",
    platform: "android",
    category: "phone",
    family: "Pixel 10",
    logical: [448, 998],
    physical: [1344, 2992],
    physicalSource: GOOGLE_PIXEL_10_PRO,
    ratio: 3,
    frame: ANDROID_PHONE_FRAME,
  },
  {
    id: "galaxy-z-flip-6-cover",
    name: "Galaxy Z Flip 6 — cover",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Flip",
    logical: [360, 374],
    physical: [720, 748],
    physicalSource: SAMSUNG_FLIP_6,
    ratio: 2,
    frame: FOLDABLE_FLIP_COVER_FRAME,
    fold: {
      state: "cover",
      axis: "horizontal",
      crease: false,
      pairedDeviceId: "galaxy-z-flip-6",
    },
  },
  {
    id: "galaxy-z-flip-6",
    name: "Galaxy Z Flip 6 — unfolded",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Flip",
    logical: [360, 880],
    physical: [1080, 2640],
    physicalSource: SAMSUNG_FLIP_6,
    ratio: 3,
    frame: FOLDABLE_UNFOLDED_FRAME,
    fold: {
      state: "unfolded",
      axis: "horizontal",
      crease: true,
      pairedDeviceId: "galaxy-z-flip-6-cover",
    },
  },
  {
    id: "galaxy-z-flip-7-cover",
    name: "Galaxy Z Flip 7 — cover",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Flip",
    logical: [474, 524],
    physical: [948, 1048],
    physicalSource: SAMSUNG_FLIP_7,
    ratio: 2,
    frame: FOLDABLE_FLIP_COVER_FRAME,
    fold: {
      state: "cover",
      axis: "horizontal",
      crease: false,
      pairedDeviceId: "galaxy-z-flip-7",
    },
  },
  {
    id: "galaxy-z-flip-7",
    name: "Galaxy Z Flip 7 — unfolded",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Flip",
    logical: [360, 840],
    physical: [1080, 2520],
    physicalSource: SAMSUNG_FLIP_7,
    ratio: 3,
    frame: FOLDABLE_UNFOLDED_FRAME,
    fold: {
      state: "unfolded",
      axis: "horizontal",
      crease: true,
      pairedDeviceId: "galaxy-z-flip-7-cover",
    },
  },
  {
    id: "galaxy-z-fold-6-cover",
    name: "Galaxy Z Fold 6 — cover",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Fold",
    logical: [484, 1188],
    physical: [968, 2376],
    physicalSource: SAMSUNG_FOLD_6,
    ratio: 2,
    frame: FOLDABLE_COVER_FRAME,
    fold: {
      state: "cover",
      axis: "vertical",
      crease: false,
      pairedDeviceId: "galaxy-z-fold-6-unfolded",
    },
  },
  {
    id: "galaxy-z-fold-6-unfolded",
    name: "Galaxy Z Fold 6 — unfolded",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Fold",
    logical: [928, 1080],
    physical: [1856, 2160],
    physicalSource: SAMSUNG_FOLD_6,
    ratio: 2,
    frame: FOLDABLE_UNFOLDED_FRAME,
    fold: {
      state: "unfolded",
      axis: "vertical",
      crease: true,
      pairedDeviceId: "galaxy-z-fold-6-cover",
    },
  },
  {
    id: "galaxy-z-fold-7-cover",
    name: "Galaxy Z Fold 7 — cover",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Fold",
    logical: [360, 840],
    physical: [1080, 2520],
    physicalSource: SAMSUNG_FOLD_7,
    ratio: 3,
    frame: FOLDABLE_COVER_FRAME,
    fold: {
      state: "cover",
      axis: "vertical",
      crease: false,
      pairedDeviceId: "galaxy-z-fold-7-unfolded",
    },
  },
  {
    id: "galaxy-z-fold-7-unfolded",
    name: "Galaxy Z Fold 7 — unfolded",
    platform: "android",
    category: "foldable",
    family: "Galaxy Z Fold",
    logical: [884, 982],
    physical: [1968, 2184],
    physicalSource: SAMSUNG_FOLD_7,
    ratio: 2.25,
    frame: FOLDABLE_UNFOLDED_FRAME,
    fold: {
      state: "unfolded",
      axis: "vertical",
      crease: true,
      pairedDeviceId: "galaxy-z-fold-7-cover",
    },
  },
  {
    id: "pixel-9-pro-fold-cover",
    name: "Pixel 9 Pro Fold — cover",
    platform: "android",
    category: "foldable",
    family: "Pixel Fold",
    logical: [360, 808],
    physical: [1080, 2424],
    physicalSource: GOOGLE_PIXEL_FOLD,
    ratio: 3,
    frame: FOLDABLE_COVER_FRAME,
    fold: {
      state: "cover",
      axis: "vertical",
      crease: false,
      pairedDeviceId: "pixel-9-pro-fold-unfolded",
    },
  },
  {
    id: "pixel-9-pro-fold-unfolded",
    name: "Pixel 9 Pro Fold — unfolded",
    platform: "android",
    category: "foldable",
    family: "Pixel Fold",
    logical: [864, 896],
    physical: [2076, 2152],
    physicalSource: GOOGLE_PIXEL_FOLD,
    ratio: 2.5,
    frame: FOLDABLE_UNFOLDED_FRAME,
    fold: {
      state: "unfolded",
      axis: "vertical",
      crease: true,
      pairedDeviceId: "pixel-9-pro-fold-cover",
    },
  },
  {
    id: "galaxy-tab-s9",
    name: "Galaxy Tab S9",
    platform: "android",
    category: "tablet",
    family: "Galaxy Tab S",
    logical: [640, 1024],
    physical: [1600, 2560],
    physicalSource: SAMSUNG_TAB_S9,
    ratio: 2.5,
    frame: TABLET_FRAME,
  },
  {
    id: "galaxy-tab-s10-plus",
    name: "Galaxy Tab S10+",
    platform: "android",
    category: "tablet",
    family: "Galaxy Tab S",
    logical: [800, 1280],
    physical: [1752, 2800],
    physicalSource: SAMSUNG_TAB_S10,
    ratio: 2.25,
    frame: TABLET_FRAME,
  },
  {
    id: "galaxy-tab-s10-ultra",
    name: "Galaxy Tab S10 Ultra",
    platform: "android",
    category: "tablet",
    family: "Galaxy Tab S",
    logical: [924, 1480],
    physical: [1848, 2960],
    physicalSource: SAMSUNG_TAB_S10,
    ratio: 2,
    frame: TABLET_NOTCH_FRAME,
  },
  {
    id: "galaxy-tab-s11-ultra",
    name: "Galaxy Tab S11 Ultra",
    platform: "android",
    category: "tablet",
    family: "Galaxy Tab S",
    logical: [924, 1480],
    physical: [1848, 2960],
    physicalSource: SAMSUNG_TAB_S11,
    ratio: 2,
    frame: TABLET_NOTCH_FRAME,
  },
  {
    id: "pixel-tablet",
    name: "Pixel Tablet",
    platform: "android",
    category: "tablet",
    family: "Pixel Tablet",
    logical: [640, 1024],
    physical: [1600, 2560],
    physicalSource: GOOGLE_TABLET,
    ratio: 2.5,
    frame: TABLET_FRAME,
  },
  {
    id: "windows-laptop",
    name: "Windows laptop",
    platform: "desktop",
    category: "laptop",
    family: "Generic laptop",
    logical: [1366, 768],
    physical: null,
    ratio: 1,
    frame: LAPTOP_FRAME,
  },
  {
    id: "macbook-air-13",
    name: "MacBook Air 13-inch",
    platform: "desktop",
    category: "laptop",
    family: "MacBook Air",
    logical: [1440, 900],
    physical: [2560, 1664],
    physicalSource: APPLE_MACBOOK,
    ratio: 2,
    frame: LAPTOP_NOTCH_FRAME,
  },
  {
    id: "surface-pro-9",
    name: "Surface Pro 9",
    platform: "desktop",
    category: "laptop",
    family: "Surface Pro",
    logical: [1440, 960],
    physical: [2880, 1920],
    physicalSource: MICROSOFT_SURFACE,
    ratio: 2,
    input: HYBRID_INPUT,
    frame: LAPTOP_FRAME,
  },
  {
    id: "full-hd-desktop",
    name: "Full HD desktop",
    platform: "desktop",
    category: "desktop",
    family: "Desktop display",
    logical: [1920, 1080],
    physical: null,
    ratio: 1,
    frame: MONITOR_FRAME,
  },
  {
    id: "ultrawide-desktop",
    name: "Ultrawide desktop",
    platform: "desktop",
    category: "ultrawide",
    family: "Ultrawide display",
    logical: [2560, 1080],
    physical: null,
    ratio: 1,
    frame: ULTRAWIDE_FRAME,
  },
];

export const DEVICE_PRESETS: readonly DevicePreset[] = deepFreeze(
  definitions.map(createPreset),
);
