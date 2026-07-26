---
name: maintain-device-catalog
description: Reviews and updates react-device-lab device presets with explicit logical viewports, physical resolutions, pixel ratios, frame metadata, and provenance. Use when adding, changing, validating, or researching entries in the device catalog; skip for component-only or documentation-only work that does not change preset facts.
---

# Maintain Device Catalog

Keep device facts explicit and distinguish hardware specifications from chosen
browser viewport profiles.

## Procedure

1. Read `docs/device-data.md`, `src/types/device.ts`, the catalog tests, and the
   current preset being changed.
2. Use the manufacturer's official specification page for physical resolution.
   Record the URL and a concise source note; do not infer physical pixels from
   logical dimensions when an official value exists.
3. Verify logical CSS/point/dp dimensions independently. For Android, label the
   selected density/display-scaling profile rather than presenting it as fixed
   hardware truth.
4. Add or update every required field: stable id, unique name, platform,
   category/family, logical and physical dimensions, pixel ratio, pointer/touch,
   frame, cutout, corners, safe areas, and fold/crease metadata where applicable.
5. Represent unknown facts as `null` or an explicit qualifier. Never fabricate a
   value to satisfy an invariant.
6. Add the failing catalog test first, then update the preset and run:

   ```bash
   npm test -- --run tests/catalog
   npm run neutrality:check
   ```

7. Review the diff for unrelated preset churn and confirm ids remain stable.

## Common mistakes

- Treating pixel ratio as display zoom.
- Deriving manufacturer resolution from rounded logical dimensions.
- Duplicating portrait and landscape as separate devices.
- Copying product artwork or marketing images.
- Renaming a stable id because the display label changed.
