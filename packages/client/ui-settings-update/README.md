# @leio-ai/leio-client-ui-settings-update

English | [中文](README.zh.md)

The desktop-only update row for General settings. It renders only when the Electron preload bridge is present, so browser deployments do not present a control that cannot work.

The row reads update state from the narrow preload bridge and offers manual metadata checks, installer downloads, and restart-to-install. It never receives a filesystem path, starts a process, or handles an update credential. The Electron main process owns manifest verification, download integrity, and installer launch.

## Model Experience

None, as this package renders application-maintenance UI; nothing here reaches a model request.

#### KV Cache effect

None.

## Known Limitations and Deferred Work

- The current release channel uses one signed stable manifest and a full NSIS installer. Differential packages and in-process plugin replacement are deferred until the installed-file layout is smaller and rollback behavior is proven.
- Existing installations without the updater code must receive one manually installed bootstrap release before they can self-update.
