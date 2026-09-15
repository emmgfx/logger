import test, { beforeEach } from "node:test";
import assert from "node:assert/strict";

import { createLogger, loggerConfig } from "../src/index.js";
import { resetState, capture, asBrowser, ansiCodeOf } from "./helpers.js";

/** The ANSI code each of `count` freshly created sources is painted with. */
const codesFor = (count, prefix) => {
  loggerConfig.init({ enabled: true, serverColors: true });
  return Array.from({ length: count }, (_, i) => {
    const logger = createLogger(`${prefix}-${i}`);
    return ansiCodeOf(capture(() => logger.log("x"))[0].args[0]);
  });
};

beforeEach(resetState);

test("no source falls back to white", () => {
  // White is the terminal's normal text color, so a source painted with it
  // has no highlight at all and collides with every other one that got it.
  assert.ok(!codesFor(12, "white").includes("37"));
});

test("only the basic codes are used", () => {
  const allowed = ["31", "32", "33", "34", "35", "36"];
  for (const code of codesFor(12, "basic")) {
    assert.ok(allowed.includes(code), `unexpected code ${code}`);
  }
});

test("codes cycle instead of piling onto the first few", () => {
  const counts = {};
  for (const code of codesFor(12, "spread")) {
    counts[code] = (counts[code] ?? 0) + 1;
  }

  // Twelve sources over six codes: each one exactly twice, none favoured.
  assert.deepEqual(Object.values(counts), [2, 2, 2, 2, 2, 2]);
});

test("a source keeps its color across createLogger calls", () => {
  loggerConfig.init({ enabled: true, serverColors: true });

  const first = createLogger("stable");
  const second = createLogger("stable");
  const codeOf = (logger) =>
    ansiCodeOf(capture(() => logger.log("x"))[0].args[0]);

  assert.equal(codeOf(first), codeOf(second));
});

test("the first source does not consume a new index on every call", () => {
  // Its index is 0, which is falsy: a truthiness check here would reassign it
  // every time and walk the counter forward.
  createLogger("first");
  createLogger("first");
  createLogger("first");

  assert.equal(globalThis.__EMMGFX_LOGGER_STATE__.instancesCounter, 1);
});

test("server labels are plain unless serverColors is on", () => {
  const logger = createLogger("plain");
  loggerConfig.init({ enabled: true });

  const [call] = capture(() => logger.log("x"));
  assert.equal(call.args[0], "plain:");
});

test("in the browser the label is a css directive", () => {
  asBrowser(() => {
    const logger = createLogger("styled");
    loggerConfig.enable();

    const [call] = capture(() => logger.log("x"));
    assert.equal(call.args[0], "%cstyled:");
    assert.match(call.args[1], /^color: #[0-9a-f]{6}; font-weight:bold;$/);
  });
});

test("browser colors cycle through the whole palette before repeating", () => {
  asBrowser(() => {
    loggerConfig.enable();
    const colors = Array.from({ length: 9 }, (_, i) => {
      const logger = createLogger(`hue-${i}`);
      return capture(() => logger.log("x"))[0].args[1];
    });

    assert.equal(new Set(colors).size, 9, "a color repeated too early");
  });
});
