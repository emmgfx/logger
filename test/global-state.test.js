import test from "node:test";
import assert from "node:assert/strict";

/**
 * The switch lives on a global object so that every copy of the package in a
 * bundle answers to the same init(). The copy that loads second has to adopt
 * what is already there instead of starting its own.
 *
 * That is what is checked here, by planting the state before the module is
 * ever imported - the same branch the second copy takes. This file does not
 * import the logger at the top, and does not use the shared helpers, because
 * both would evaluate the module too early.
 */
const PLANTED = {
  enabled: true,
  serverColors: true,
  instancesCounter: 5,
  sourcesIndexes: { veteran: 2 },
};

globalThis.__EMMGFX_LOGGER_STATE__ = PLANTED;

const loaded = import("../src/index.js");

const capture = (fn) => {
  const original = console.log;
  const calls = [];
  console.log = (...args) => calls.push(args);
  try {
    fn();
  } finally {
    console.log = original;
  }
  return calls;
};

const ansiCodeOf = (label) => /\x1b\[1;(\d+)m/.exec(label)?.[1] ?? null;

test("state already on the global is adopted, not replaced", async () => {
  const { loggerConfig } = await loaded;

  assert.equal(loggerConfig.status, true, "the planted switch was ignored");
  assert.equal(globalThis.__EMMGFX_LOGGER_STATE__, PLANTED);
});

test("a source that was already assigned keeps its color", async () => {
  const { createLogger } = await loaded;
  const logger = createLogger("veteran");

  const [call] = capture(() => logger.log("x"));

  // Index 2 of the basic codes, and the counter must not have moved for it.
  assert.equal(ansiCodeOf(call[0]), "33");
  assert.equal(PLANTED.instancesCounter, 5);
});

test("a new source carries on from the counter it found", async () => {
  const { createLogger } = await loaded;
  createLogger("newcomer");

  assert.equal(PLANTED.sourcesIndexes.newcomer, 5);
  assert.equal(PLANTED.instancesCounter, 6);
});
