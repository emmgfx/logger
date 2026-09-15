import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createLogger, loggerConfig } from "../src/index.js";
import { resetState, capture } from "./helpers.js";

beforeEach(resetState);

test("the callback is not run while logging is off", () => {
  // The whole point: an argument handed to log() is built at the call site
  // whether or not anything is printed. A callback is not.
  const logger = createLogger("not-built");
  let built = 0;

  const calls = capture(() => logger.expensive(() => ++built));

  assert.equal(built, 0);
  assert.deepEqual(calls, []);
});

test("the callback runs once and its return value is logged", () => {
  const logger = createLogger("built");
  loggerConfig.enable();
  let built = 0;

  const calls = capture(() =>
    logger.expensive(() => {
      built++;
      return "the message";
    })
  );

  assert.equal(built, 1);
  assert.deepEqual(calls, [
    { method: "log", args: ["built:", "the message"] },
  ]);
});

test("the return value is logged as a single argument", () => {
  const logger = createLogger("single-arg");
  loggerConfig.enable();

  const [call] = capture(() => logger.expensive(() => ["a", "b"]));

  assert.deepEqual(call.args, ["single-arg:", ["a", "b"]]);
});

test("a function can still be logged by returning it", () => {
  const logger = createLogger("returns-function");
  loggerConfig.enable();
  const handler = () => {};

  const [call] = capture(() => logger.expensive(() => handler));

  assert.equal(call.args[1], handler);
});

test("being given something other than a function is reported, not thrown", () => {
  const logger = createLogger("misused");
  loggerConfig.enable();

  let calls;
  assert.doesNotThrow(() => {
    calls = capture(() => logger.expensive("not a function"));
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "error");
  assert.match(calls[0].args[1], /expects a function, received string/);
  assert.equal(calls[0].args[2], "not a function");
});

test("a callback that throws is reported, not propagated", () => {
  // Turning the logger on must never break what works with it off.
  const logger = createLogger("throwing");
  loggerConfig.enable();
  const failure = new Error("the callback failed");

  let calls;
  assert.doesNotThrow(() => {
    calls = capture(() =>
      logger.expensive(() => {
        throw failure;
      })
    );
  });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].method, "error");
  assert.equal(calls[0].args[2], failure);
});

test("a misused call while logging is off stays silent", () => {
  const logger = createLogger("misused-while-off");

  assert.deepEqual(capture(() => logger.expensive("not a function")), []);
});
