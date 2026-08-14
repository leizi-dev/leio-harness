# Agent Note: Leio product namespace and application branding

Status: implemented

English | [中文](2026-08-14-leio-product-namespace-and-branding.zh.md)

## Problem

The shipped harness still exposed the former product namespace and application wordmark even though this checkout is being developed as Leio Harness.

## Decision

Workspace packages use the `@leio-ai/leio-*` scope, and the root project is named `leio-harness`. The web and desktop applications present `Leio Harness` and use the supplied Leio artwork for every application image: the sidebar brand icon, browser favicon, and PWA manifest use the original PNG, while the Electron window, Windows executable, installer, and shortcuts use a transparent circular crop aligned with the artwork's inner circle. DeepSeek provider names, model identifiers, API endpoints, and `DEEPSEEK_*` credential settings remain provider-specific and are not renamed by this product-brand change.

## Alternatives considered

- **Keep the former package scope and add Leio aliases** — this would preserve two public vocabularies and require compatibility behavior that has no external-consumer requirement before the first tagged release.
- **Replace only visible strings** — this would leave package metadata and workspace imports inconsistent with the product name.
- **Use the new image only as a favicon** — this would leave the primary in-app brand surface showing the old wordmark.

## Consequences

- All non-vendored, non-archived workspace references use the Leio package scope, so consumers must use the new names.
- The Web application loads `apps/web/public/leio-icon.png`; the desktop builder loads `apps/desktop/build/icon.png`, whose alpha mask follows the artwork's inner circle so Windows renders a circular application icon.
- DeepSeek remains an explicit provider identity, so existing key and endpoint configuration continues to describe the service it connects to.
- Vendored source and archived historical notes retain their original names as historical or upstream material.
