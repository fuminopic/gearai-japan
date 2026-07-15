import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const readSource = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const planReturnSource = readSource("../src/lib/plan-return-to.ts");
const gearActionSource = readSource("../src/lib/actions/gear.ts");
const gearFormSource = readSource("../src/components/gear-form.tsx");
const gearListSource = readSource("../src/components/gear-list.tsx");
const gearPageSource = readSource("../app/(app)/gear/page.tsx");
const newGearPageSource = readSource("../app/(app)/gear/new/page.tsx");
const gearDetailPageSource = readSource("../app/(app)/gear/[id]/page.tsx");
const editGearPageSource = readSource("../app/(app)/gear/[id]/edit/page.tsx");
const appNavSource = readSource("../src/components/app-nav.tsx");
const bottomNavSource = readSource("../src/components/app-bottom-nav.tsx");
const menuDrawerSource = readSource("../src/components/app-menu-drawer.tsx");
const planAwareGearLinkSource = readSource("../src/components/plan-aware-gear-link.tsx");
const tripPlanningSource = readSource("../src/components/trip-planning-ui.tsx");

test("gear changes return to a validated plan URL and force fresh plan rendering", () => {
  assert.match(planReturnSource, /!value \|\| !value\.startsWith\("\/"\)/);
  assert.match(planReturnSource, /url\.pathname !== "\/plan"/);
  assert.match(planReturnSource, /url\.origin !== INTERNAL_ORIGIN/);
  assert.match(planReturnSource, /url\.searchParams\.set\("returnTo", safeReturnTo\)/);
  assert.match(planReturnSource, /pathname !== "\/plan"/);

  assert.match(gearActionSource, /revalidatePath\("\/plan"\)/);
  assert.match(gearActionSource, /return \{ ok: true, redirectTo: returnTo \?\? "\/gear\?saved=created" \}/);
  assert.match(gearActionSource, /return \{ ok: true, redirectTo: returnTo \?\? "\/gear\?saved=updated" \}/);
  assert.match(gearActionSource, /async function deleteGear\(id: string, formData: FormData\)/);
  assert.match(gearActionSource, /redirect\(returnTo \?\? "\/gear\?saved=deleted"\)/);

  assert.match(gearFormSource, /name="returnTo" value=\{returnTo \?\? ""\}/);
  assert.match(gearFormSource, /window\.location\.assign\(returnTo\)/);
  assert.match(gearFormSource, /router\.push\(result\.redirectTo as Route\)/);
  assert.match(gearDetailPageSource, /name="returnTo" value=\{returnTo \?\? ""\}/);
});

test("plan-origin navigation keeps saved and unsaved plan URLs through every gear step", () => {
  assert.match(appNavSource, /PlanAwareGearLink/);

  for (const source of [planAwareGearLinkSource, bottomNavSource, menuDrawerSource]) {
    assert.match(source, /getCurrentPlanReturnTo/);
    assert.match(source, /buildGearHref/);
  }

  for (const source of [gearPageSource, newGearPageSource, gearDetailPageSource, editGearPageSource]) {
    assert.match(source, /returnTo\?: string/);
    assert.match(source, /getPlanReturnTo/);
  }

  assert.match(gearPageSource, /returnTo=\{returnTo\}/);
  assert.match(gearListSource, /returnTo\?: string \| null/);
  assert.match(gearListSource, /name="returnTo" value=\{returnTo \?\? ""\}/);
  assert.match(gearListSource, /buildGearHref\(`\/gear\/\$\{item\.id\}`, returnTo\)/);

  assert.match(tripPlanningSource, /readStoredCheckedSlots\(planId, currentPlanUserId\)/);
  assert.match(tripPlanningSource, /filterCheckedSlotsForPlan\(rawCurrentCheckedSlots, plan\)/);
  assert.doesNotMatch(gearActionSource, /checked_slots/);
});
