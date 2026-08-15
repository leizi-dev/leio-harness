# Agent Note: Replace legacy whale marks with the Leio brand image

Status: implemented

English | [中文](2026-08-15-leio-brand-marks.zh.md)

## Problem

The collapsed sidebar and empty-session hero still rendered the vendored DeepSeek whale mark while the surrounding application used the Leio brand image.

## Decision

Use the approved `/leio-icon.png` asset for both surfaces. Crop it with CSS to a circular mark and size it to the existing layout columns: 24×24 pixels in the collapsed rail and 34×34 pixels in the hero headline.

## Evidence

The sidebar and hero component tests assert the Leio image source. The focused UI test set passes, and `apps/web/dist/leio-icon.png` is present after the Web build.

## Alternatives considered

- **Keep the whale SVG and recolor it** — rejected because it preserves the old product identity.
- **Add a second logo asset** — rejected because the existing approved Leio image already serves the browser favicon, expanded sidebar, and packaged application icon.
- **Use the image at its intrinsic rectangular dimensions** — rejected because both target layouts require a circular mark aligned with their existing icon columns.

## Consequences

The two remaining whale placements now share one brand asset and retain their existing layout sizes and hover region. Changes to the approved Leio image will affect all of these consumers and must be checked in both browser and desktop builds.
