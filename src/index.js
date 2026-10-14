const getGlobal = () => {
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  if (typeof self !== "undefined") return self;
  return {};
};

const _global = getGlobal();
const GLOBAL_KEY = "__EMMGFX_LOGGER_STATE__";

if (!_global[GLOBAL_KEY]) {
  _global[GLOBAL_KEY] = {
    enabled: false,
    serverColors: false,
    instancesCounter: 0,
    sourcesIndexes: {},
  };
}

const state = _global[GLOBAL_KEY];
const COLORS = [
  "#f87171",
  "#fb923c",
  "#f59e0b",
  "#84cc16",
  "#4ade80",
  "#2dd4bf",
  "#60a5fa",
  "#a78bfa",
  "#e879f9",
];

// Basic codes only: the terminal theme paints them, so contrast against
// its own background is guaranteed. Cycled by index, so growing COLORS
// can never leave a source uncolored.
const ANSI_CODES = ["31", "32", "33", "34", "35", "36"];

const noop = () => {};

export const loggerConfig = {
  // Only the keys actually passed are touched, so a partial init cannot
  // silently reset the other ones.
  init: ({ enabled, serverColors } = {}) => {
    if (enabled !== undefined) state.enabled = !!enabled;
    if (serverColors !== undefined) state.serverColors = !!serverColors;
  },
  enable: () => (state.enabled = true),
  disable: () => (state.enabled = false),
  get status() {
    return state.enabled;
  },
};

export const createLogger = (source) => {
  // Index 0 is falsy, so this has to be an explicit undefined check.
  if (state.sourcesIndexes[source] === undefined) {
    state.sourcesIndexes[source] = state.instancesCounter;
    state.instancesCounter++;
  }

  const isBrowser = typeof window !== "undefined";
  const index = state.sourcesIndexes[source];

  // Built on use, not on creation: loggers are usually created at module
  // top level, which runs before the app gets to call init(). Reading the
  // config here also lets serverColors be flipped at runtime. It never runs
  // while logging is off, since nothing gets bound in that case.
  const getLabel = () => {
    if (isBrowser) {
      const color = COLORS[index % COLORS.length];
      return [`%c${source}:`, `color: ${color}; font-weight:bold;`];
    }
    const ansiCode = ANSI_CODES[index % ANSI_CODES.length];
    return state.serverColors
      ? [`\x1b[1;${ansiCode}m${source}:\x1b[0m`]
      : [`${source}:`];
  };

  const check =
    (fn) =>
    (...args) =>
      loggerConfig.status && fn(...args);

  // Bound rather than wrapped, so devtools blames the caller's line instead
  // of this file. A wrapper would sit between the call and console.*, and
  // that intermediate frame is what the source link points at. Getters keep
  // enable() and disable() working: the decision is made when the method is
  // read, not when the logger was created.
  const bind = (method) =>
    state.enabled ? console[method].bind(console, ...getLabel()) : noop;

  return {
    get log() {
      return bind("log");
    },
    get warn() {
      return bind("warn");
    },
    get error() {
      return bind("error");
    },
    get group() {
      return bind("group");
    },
    get groupCollapsed() {
      return bind("groupCollapsed");
    },
    get groupEnd() {
      return state.enabled ? console.groupEnd.bind(console) : noop;
    },
    // Takes a function so the message is only built when it will be seen:
    // arguments are evaluated at the call site, so anything handed to log()
    // is paid for even while logging is off. Worth it only when building the
    // message costs real work.
    //
    // This one cannot be bound, since the returned value has to be unwrapped,
    // so it reports src/index.js as the source line instead of the caller.
    //
    // Neither a misuse nor a throwing callback may take the application down
    // with them: turning the logger on must never break what works with it
    // off. Both are reported and swallowed.
    expensive: (build) => {
      if (!state.enabled) return;
      if (typeof build !== "function") {
        console.error(
          ...getLabel(),
          `expensive() expects a function, received ${typeof build}:`,
          build
        );
        return;
      }
      try {
        console.log(...getLabel(), build());
      } catch (error) {
        console.error(...getLabel(), "expensive() callback threw:", error);
      }
    },
    // A collapsed buffer suits detail that only matters when something goes
    // wrong: it stays one line in the console until it is expanded.
    createBuffer: (bufferLabel, { collapsed = false } = {}) => {
      const openGroup = collapsed ? "groupCollapsed" : "group";
      let items = [];
      return {
        add: check((...args) => items.push(args)),
        flush: () => {
          if (loggerConfig.status && items.length > 0) {
            console[openGroup](...getLabel(), bufferLabel);
            items.forEach((args) => console.log(...args));
            console.groupEnd();
          }
          items = [];
        },
      };
    },
  };
};
