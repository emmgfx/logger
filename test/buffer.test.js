import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createLogger, loggerConfig } from "../src/index.js";
import { resetState, capture, ansiCodeOf } from "./helpers.js";

beforeEach(resetState);

test("a buffer groups its entries under the source label", () => {
  loggerConfig.enable();
  const buffer = createLogger("batched").createBuffer("Batch");

  const calls = capture(() => {
    buffer.add("first");
    buffer.add("second", { some: "data" });
    buffer.flush();
  });

  assert.deepEqual(
    calls.map((call) => call.method),
    ["group", "log", "log", "groupEnd"]
  );
  assert.deepEqual(calls[0].args, ["batched:", "Batch"]);
  assert.deepEqual(calls[1].args, ["first"]);
  assert.deepEqual(calls[2].args, ["second", { some: "data" }]);
});

test("flushing twice does not repeat the entries", () => {
  loggerConfig.enable();
  const buffer = createLogger("flushed-twice").createBuffer("Batch");

  capture(() => {
    buffer.add("once");
    buffer.flush();
  });

  assert.deepEqual(capture(() => buffer.flush()), []);
});

test("an empty buffer prints nothing", () => {
  loggerConfig.enable();
  const buffer = createLogger("empty").createBuffer("Batch");

  assert.deepEqual(capture(() => buffer.flush()), []);
});

test("entries added while disabled are not kept", () => {
  // They used to pile up: add() accumulated whatever the switch said, and
  // flush() returned before clearing. Anything referenced by a buffered
  // argument stayed reachable for as long as the buffer did.
  const buffer = createLogger("added-while-off").createBuffer("Batch");

  buffer.add("dropped", { big: "object" });
  buffer.flush();

  loggerConfig.enable();
  assert.deepEqual(capture(() => buffer.flush()), []);
});

test("flushing while disabled empties the buffer", () => {
  const buffer = createLogger("flushed-while-off").createBuffer("Batch");

  loggerConfig.enable();
  buffer.add("collected", { big: "object" });

  loggerConfig.disable();
  buffer.flush();

  loggerConfig.enable();
  assert.deepEqual(capture(() => buffer.flush()), []);
});

test("the group label is colored when serverColors is on", () => {
  loggerConfig.init({ enabled: true, serverColors: true });
  const buffer = createLogger("colored-group").createBuffer("Batch");

  const [group] = capture(() => {
    buffer.add("entry");
    buffer.flush();
  });

  assert.ok(ansiCodeOf(group.args[0]), "the group label carries no color");
  assert.equal(group.args[1], "Batch");
});

test("two buffers from one logger stay independent", () => {
  loggerConfig.enable();
  const logger = createLogger("two-buffers");
  const first = logger.createBuffer("First");
  const second = logger.createBuffer("Second");

  first.add("belongs to first");
  second.add("belongs to second");

  const calls = capture(() => first.flush());

  assert.deepEqual(calls[0].args, ["two-buffers:", "First"]);
  assert.deepEqual(calls[1].args, ["belongs to first"]);
  assert.equal(calls.length, 3, "the other buffer was flushed as well");

  const rest = capture(() => second.flush());
  assert.deepEqual(rest[1].args, ["belongs to second"]);
});

test("groups can be nested", () => {
  loggerConfig.enable();
  const logger = createLogger("nested");

  const calls = capture(() => {
    logger.group("outer");
    logger.group("inner");
    logger.log("deep");
    logger.groupEnd();
    logger.groupEnd();
  });

  assert.deepEqual(
    calls.map((call) => call.method),
    ["group", "group", "log", "groupEnd", "groupEnd"]
  );
});
