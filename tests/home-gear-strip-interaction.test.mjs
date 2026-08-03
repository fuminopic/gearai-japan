import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { ModuleKind, ScriptTarget, transpileModule } from "typescript";

const source = readFileSync(
  new URL("../src/lib/home-gear-strip-interaction.ts", import.meta.url),
  "utf8"
);
const compiled = transpileModule(source, {
  compilerOptions: {
    module: ModuleKind.ESNext,
    target: ScriptTarget.ES2022
  }
}).outputText;
const { HOME_GEAR_DRAG_THRESHOLD_PX, movedBeyondHomeGearTapThreshold } = await import(
  `data:text/javascript,${encodeURIComponent(compiled)}`
);

test("home gear cards keep taps but suppress clicks after meaningful pointer movement", () => {
  assert.equal(HOME_GEAR_DRAG_THRESHOLD_PX, 8);
  assert.equal(movedBeyondHomeGearTapThreshold(20, 20, 26, 22), false);
  assert.equal(movedBeyondHomeGearTapThreshold(20, 20, 29, 20), true);
  assert.equal(movedBeyondHomeGearTapThreshold(20, 20, 20, 29), true);
});
