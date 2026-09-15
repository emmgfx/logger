import test, { beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { createLogger, loggerConfig } from "../src/index.js";
import { resetState, capture } from "./helpers.js";

const CSS = /^color: #[0-9a-f]{6}; font-weight:bold;$/;

beforeEach(() => {
  resetState();
  globalThis.window = globalThis;
});

afterEach(() => {
  delete globalThis.window;
});

test("every method that prints a label styles it with %c", () => {
  const logger = createLogger("styled");
  loggerConfig.enable();

  const calls = capture(() => {
    logger.log("a");
    logger.warn("b");
    logger.error("c");
    logger.group("d");
  });

  for (const call of calls) {
    assert.equal(call.args[0], "%cstyled:");
    assert.match(call.args[1], CSS);
  }
});

test("expensive styles its label too", () => {
  const logger = createLogger("styled-expensive");
  loggerConfig.enable();

  const [call] = capture(() => logger.expensive(() => "built"));

  assert.equal(call.args[0], "%cstyled-expensive:");
  assert.match(call.args[1], CSS);
  assert.equal(call.args[2], "built");
});

test("a buffer styles the label of its group", () => {
  const buffer = createLogger("styled-buffer").createBuffer("Batch");
  loggerConfig.enable();

  const calls = capture(() => {
    buffer.add("entry");
    buffer.flush();
  });

  assert.equal(calls[0].method, "group");
  assert.deepEqual(calls[0].args, [
    "%cstyled-buffer:",
    calls[0].args[1],
    "Batch",
  ]);
  assert.match(calls[0].args[1], CSS);
});

test("serverColors does not leak into the browser label", () => {
  const logger = createLogger("unaffected");
  loggerConfig.init({ enabled: true, serverColors: true });

  const [call] = capture(() => logger.log("x"));

  assert.equal(call.args[0], "%cunaffected:");
  assert.doesNotMatch(call.args[1], /\x1b/);
});
