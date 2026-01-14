# Changelog

## 2.1.1

- Guarded resolver object results to avoid crashes when `element` is missing or not an `HTMLElement`.

## 2.1.0

- Expanded resolver API to provide `areaId` and support optional cleanup callbacks for area teardown.
- Fixed declarative tag updates leaving stale DOM nodes behind.
- Added cleanup handling across node removal paths, with updated tests and documentation.

## 2.0.0

- Added stable area IDs to the serialized layout, preserving DOM nodes across updates and preventing context loss (WebGL/Teleport).
- Reworked rendering to reconcile existing wrappers instead of tearing down the DOM, improving incremental update performance.
- Introduced granular area lifecycle events (`area-added`, `area-removed`, `area-updated`) and wired them into the Vue wrapper.
- Updated documentation to cover IDs, new events, and usage patterns for incremental updates.
- Expanded test coverage to validate ID reconciliation, DOM reuse, and event emission behavior.

### Migration

- If you persist layouts, re-save them once after upgrading so each area has a stable `id` field; keep those ids in storage to preserve state across split/join/swap.
- If you generate layouts manually, keep `id` optional but prefer supplying it when you want deterministic area identity across sessions.

## 1.1.0

- Added an operations configuration for Sliced Areas to enable or disable interactive behaviors (resize, split, join, replace, swap, move, maximize, restore) across both the web component and the Vue wrapper.
