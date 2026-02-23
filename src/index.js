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
    sourcesColors: {},
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

const ANSI_COLORS = {
  "#f87171": "31", // Rojo
  "#4ade80": "32", // Verde
  "#f59e0b": "33", // Amarillo
  "#60a5fa": "34", // Azul
  "#a78bfa": "35", // Magenta
  "#2dd4bf": "36", // Cian
};

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
  if (!state.sourcesColors[source]) {
    state.sourcesColors[source] = COLORS[state.instancesCounter % COLORS.length];
    state.instancesCounter++;
  }

  const isBrowser = typeof window !== "undefined";
  const color = state.sourcesColors[source];
  let label;
  if (isBrowser) {
    label = [`%c${source}:`, `color: ${color}; font-weight:bold;`];
  } else {
    const useColors = state.serverColors;
    const ansiCode = ANSI_COLORS[color] || "37";
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
        add: (...args) => items.push(args),
        flush: () => {
          if (!loggerConfig.status || items.length === 0) return;
          console.group(...label, bufferLabel);
          items.forEach((args) => console.log(...args));
          console.groupEnd();
          items = [];
        },
      };
    },
  };
};
