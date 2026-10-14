import "../src/index.js";

/**
 * The logger keeps its state on a global object so every copy of the package
 * shares one switch, which means it also survives between tests in the same
 * file. Reset it in place: the module captured that object by reference when
 * it was imported, so replacing it would leave the module on the old one.
 */
export const resetState = () => {
  const state = globalThis.__EMMGFX_LOGGER_STATE__;
  state.enabled = false;
  state.serverColors = false;
  state.instancesCounter = 0;
  state.sourcesIndexes = {};
};

const CONSOLE_METHODS = [
  "log",
  "warn",
  "error",
  "group",
  "groupCollapsed",
  "groupEnd",
];

/**
 * Runs `fn` with the console methods recorded instead of printed, and returns
 * what was called. Methods are read off the console when the logger's getters
 * run, so the swap has to be in place before the logged call, not before the
 * logger is created.
 */
export const capture = (fn) => {
  const originals = {};
  const calls = [];

  for (const method of CONSOLE_METHODS) {
    originals[method] = console[method];
    console[method] = (...args) => calls.push({ method, args });
  }

  try {
    fn();
  } finally {
    Object.assign(console, originals);
  }

  return calls;
};

/** The label branch depends on `window`, which createLogger reads per call. */
export const asBrowser = (fn) => {
  globalThis.window = globalThis;
  try {
    return fn();
  } finally {
    delete globalThis.window;
  }
};

/** Strips the ANSI escapes so a test can assert on the text itself. */
export const plain = (value) =>
  typeof value === "string" ? value.replace(/\x1b\[[0-9;]*m/g, "") : value;

/** The numeric ANSI code a server label was painted with, or null if plain. */
export const ansiCodeOf = (label) => {
  const match = /\x1b\[1;(\d+)m/.exec(label);
  return match ? match[1] : null;
};
