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

export const loggerConfig = {
  init: ({ enabled, serverColors }) => {
    state.enabled = !!enabled;
    state.serverColors = !!serverColors;
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
  let label;
  if (isBrowser) {
    const color = COLORS[index % COLORS.length];
    label = [`%c${source}:`, `color: ${color}; font-weight:bold;`];
  } else {
    const useColors = state.serverColors;
    const ansiCode = ANSI_CODES[index % ANSI_CODES.length];
    label = useColors ? [`\x1b[1;${ansiCode}m${source}:\x1b[0m`] : [`${source}:`];
  }

  const check =
    (fn) =>
    (...args) =>
      loggerConfig.status && fn(...args);

  return {
    log: check((...args) => console.log(...label, ...args)),
    warn: check((...args) => console.warn(...label, ...args)),
    error: check((...args) => console.error(...label, ...args)),
    group: check((...args) => console.group(...label, ...args)),
    groupEnd: check(() => console.groupEnd()),
    createBuffer: (bufferLabel) => {
      let items = [];
      return {
        add: check((...args) => items.push(args)),
        flush: () => {
          if (loggerConfig.status && items.length > 0) {
            console.group(...label, bufferLabel);
            items.forEach((args) => console.log(...args));
            console.groupEnd();
          }
          items = [];
        },
      };
    },
  };
};
