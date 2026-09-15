import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createLogger, loggerConfig } from "../src/index.js";
import { resetState, capture, ansiCodeOf } from "./helpers.js";

beforeEach(resetState);

test("logging is off until it is enabled", () => {
  const logger = createLogger("off-by-default");
  const calls = capture(() => logger.log("nothing"));

  assert.deepEqual(calls, []);
  assert.equal(loggerConfig.status, false);
});

test("enable and disable take effect on loggers already created", () => {
  const logger = createLogger("toggled");

  loggerConfig.enable();
  assert.equal(capture(() => logger.log("on")).length, 1);

  loggerConfig.disable();
  assert.equal(capture(() => logger.log("off")).length, 0);

  loggerConfig.enable();
  assert.equal(capture(() => logger.log("on again")).length, 1);
});

test("a partial init leaves the options it was not given alone", () => {
  loggerConfig.init({ enabled: true, serverColors: true });
  loggerConfig.init({ enabled: false });

  const state = globalThis.__EMMGFX_LOGGER_STATE__;
  assert.equal(state.enabled, false);
  assert.equal(state.serverColors, true, "serverColors was reset");
});

test("init can be called with no argument", () => {
  assert.doesNotThrow(() => loggerConfig.init());
});

test("init colors loggers that were created before it ran", () => {
  const logger = createLogger("created-first");
  loggerConfig.init({ enabled: true, serverColors: true });

  const [call] = capture(() => logger.log("x"));
  assert.ok(ansiCodeOf(call.args[0]), "label carries no color");
});

test("serverColors can be turned off at runtime", () => {
  const logger = createLogger("hot-swap");
  loggerConfig.init({ enabled: true, serverColors: true });
  assert.ok(ansiCodeOf(capture(() => logger.log("x"))[0].args[0]));

  loggerConfig.init({ serverColors: false });
  assert.equal(ansiCodeOf(capture(() => logger.log("x"))[0].args[0]), null);
});

test("every method carries the source label", () => {
  const logger = createLogger("labelled");
  loggerConfig.enable();

  const calls = capture(() => {
    logger.log("a");
    logger.warn("b");
    logger.error("c");
    logger.group("d");
    logger.groupEnd();
  });

  assert.deepEqual(
    calls.map((call) => call.method),
    ["log", "warn", "error", "group", "groupEnd"]
  );
  for (const call of calls.slice(0, 4)) {
    assert.equal(call.args[0], "labelled:");
  }
});
