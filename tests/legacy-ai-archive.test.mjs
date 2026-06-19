import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const historyPageSource = readFileSync(
  new URL("../app/(app)/ai/history/page.tsx", import.meta.url),
  "utf8"
);
const historyListSource = readFileSync(
  new URL("../src/components/recommendation-history-list.tsx", import.meta.url),
  "utf8"
);
const detailSource = readFileSync(
  new URL("../src/components/recommendation-detail.tsx", import.meta.url),
  "utf8"
);
const deleteControlsSource = readFileSync(
  new URL("../src/components/recommendation-delete-controls.tsx", import.meta.url),
  "utf8"
);

test("legacy recommendation history uses archive wording and routes new work to plan", () => {
  assert.match(historyPageSource, /過去の記録/);
  assert.match(historyPageSource, /過去の推薦履歴/);
  assert.match(historyPageSource, /href="\/plan"/);
  assert.match(historyPageSource, /山行計画を作成/);

  assert.match(historyListSource, /過去の推薦履歴はまだありません/);
  assert.match(historyListSource, /現在は山行計画のチェックリストを主に利用してください/);
  assert.match(historyListSource, /href="\/plan"/);
  assert.match(historyListSource, /山行計画を作成/);

  assert.doesNotMatch(`${historyPageSource}\n${historyListSource}`, /AI推薦履歴/);
  assert.doesNotMatch(`${historyPageSource}\n${historyListSource}`, /AI推薦へ/);
  assert.doesNotMatch(`${historyPageSource}\n${historyListSource}`, /最初の装備推薦/);
  assert.doesNotMatch(`${historyPageSource}\n${historyListSource}`, /href="\/ai"/);
});

test("legacy recommendation detail is framed as an old record", () => {
  assert.match(detailSource, /過去の記録/);
  assert.match(detailSource, /旧推薦の詳細/);
  assert.match(detailSource, /現在は山行計画のチェックリストを主に利用してください/);
  assert.match(detailSource, /山行計画を作成/);
  assert.match(detailSource, /href="\/plan"/);
  assert.match(detailSource, /過去の履歴へ/);
  assert.match(detailSource, /当時の判断メモ/);
  assert.match(detailSource, /当時の所持装備照合/);

  assert.doesNotMatch(detailSource, /推薦結果/);
  assert.doesNotMatch(detailSource, /推薦項目/);
  assert.doesNotMatch(detailSource, /新しく作成/);
  assert.doesNotMatch(detailSource, /href="\/ai"/);
});

test("legacy recommendation delete actions require confirmation", () => {
  assert.match(deleteControlsSource, /window\.confirm/);
  assert.match(deleteControlsSource, /この旧推薦履歴を削除しますか？/);
  assert.match(deleteControlsSource, /旧推薦履歴をすべて削除しますか？/);
  assert.match(deleteControlsSource, /return;/);
});
