import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createLogger, loggerConfig } from "../src/index.js";
import { resetState } from "./helpers.js";

/**
 * The file that called console.*, as devtools would resolve it for the source
 * link next to a message. A wrapper around console.* shows up here as an extra
 * frame, and the link points at the library instead of at the caller.
 */
const callerOf = (fn) => {
  const original = console.log;
  let frame;

  console.log = () => {
    frame = new Error().stack.split("\n")[2];
  };

  try {
    fn();
  } finally {
    console.log = original;
  }

  return frame;
};

beforeEach(resetState);

test("messages are attributed to the file that logged them", () => {
  const logger = createLogger("attributed");
  loggerConfig.enable();

  const frame = callerOf(() => logger.log("x"));

  assert.match(frame, /callsite\.test\.js/);
  assert.doesNotMatch(frame, /src[/\\]index\.js/);
});

test("a disabled logger hands back a noop rather than a bound console", () => {
  const logger = createLogger("noop");

  assert.equal(logger.log.name, "noop");
  assert.equal(logger.groupEnd.name, "noop");
});
