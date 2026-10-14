# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0]

### Added

- `createBuffer(label, { collapsed: true })` flushes the buffer with
  `console.groupCollapsed`, so detail that only matters when something fails
  stays folded in the browser console. Without the option, buffers flush
  expanded as before.
- `logger.groupCollapsed(...)` opens a collapsed group with the same label and
  colors as `logger.group`, and is closed with the existing `groupEnd`.

Both respect `enabled` like the other methods. In Node, a collapsed group
prints the same as an expanded one.

## [1.3.0]

### Added

- `logger.expensive(build)` takes a function and calls it only if logging is
  enabled, so a message that costs real work to build is not paid for while
  the logger is off. A misused call or a throwing callback is reported and
  swallowed rather than propagated.

### Fixed

- Messages report the caller's line in devtools instead of `src/index.js`.
  Every method wrapped `console.*` in an arrow function, and that
  intermediate frame was what the source link pointed at. Methods are now
  bound functions handed out through getters.

## [1.2.0]

### Added

- `loggerConfig.init()` can now be called with no argument, and only assigns
  the keys it actually receives. A partial call such as
  `init({ enabled: true })` no longer resets `serverColors` to `false`.
- `serverColors` can be changed at runtime. Labels are now built when a
  message is printed rather than when the logger is created.

### Fixed

- Buffers no longer retain their entries while the logger is disabled.
  `add()` was accumulating unconditionally and `flush()` returned before
  clearing, so buffered arguments — and anything they referenced — stayed
  alive indefinitely. Since the logger ships disabled, this was the common
  path.
- Sources created before `loggerConfig.init()` now get a colored label.
  The label used to be built inside `createLogger()`, reading the config at
  that moment; loggers declared at module top level run on import, before
  the application calls `init()`, and stayed uncolored forever.
- No source falls back to white on the server. The ANSI table only mapped 6
  of the 9 palette colors, so the 2nd, 4th and 9th source created fell
  through to code 37 — the terminal's normal text color — with no highlight
  and indistinguishable from each other.

### Changed

- Server labels are colored by palette index instead of by hex lookup, which
  evens out how often each ANSI code is reused. Most sources get a different
  terminal color than in 1.1.0. Browser colors are unchanged.
- Only the 6 basic ANSI codes are used, so the terminal theme still
  guarantees contrast against its own background. Sources 6 apart share a
  color; the source name remains the identifier.

## [1.1.0]

Earlier releases predate this changelog.

## [1.0.1]

## [1.0.0]

[1.4.0]: https://github.com/emmgfx/logger/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/emmgfx/logger/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/emmgfx/logger/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/emmgfx/logger/compare/v1.0.1...v1.1.0
[1.0.1]: https://github.com/emmgfx/logger/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/emmgfx/logger/releases/tag/v1.0.0
