// Internal state:
let isEnabled = typeof process !== "undefined" && process.env.LOGGER_ENABLED === "true";
let instancesCounter = 0;
const sourcesColors = {};
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

// Config:
export const loggerConfig = {
  enable: () => {
    isEnabled = true;
  },
  disable: () => {
    isEnabled = false;
  },
  get status() {
    return isEnabled;
  },
};

// Logger:
export const createLogger = (source) => {
  if (!isEnabled) {
    const empty = () => {};
    return {
      log: empty,
      warn: empty,
      error: empty,
      group: empty,
      groupEnd: empty,
      createBuffer: () => ({ add: empty, flush: empty }),
    };
  }

  if (!sourcesColors[source]) {
    sourcesColors[source] = COLORS[instancesCounter % COLORS.length];
    instancesCounter++;
  }

  const color = sourcesColors[source];
  const label = [`%c${source}:`, `color: ${color}; font-weight:bold;`];

  return {
    log: (...args) => console.log(...label, ...args),
    warn: (...args) => console.warn(...label, ...args),
    error: (...args) => console.error(...label, ...args),
    group: (...args) => console.group(...label, ...args),
    groupEnd: () => console.groupEnd(),
    createBuffer: (bufferLabel) => {
      let items = [];
      return {
        add: (...args) => items.push(args),
        flush: () => {
          if (items.length === 0) return;
          console.group(...label, bufferLabel);
          items.forEach((args) => console.log(...args));
          console.groupEnd();
          items = [];
        },
      };
    },
  };
};
