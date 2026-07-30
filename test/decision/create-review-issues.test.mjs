import test from "node:test";
import assert from "node:assert/strict";

import {
  LABELS,
  readCanonicalEntries,
  renderReviewIssue,
} from "../../scripts/decision/create-review-issues.mjs";
import { parseReviewIssue } from "../../scripts/decision/parse-issue.mjs";

test("descobre as 34 fichas canónicas sem duplicados", async () => {
  const entries = await readCanonicalEntries({ rootDir: process.cwd() });
  assert.equal(entries.length, 34);
  assert.equal(new Set(entries.map((entry) => entry.targetPath)).size, 34);
  assert.equal(entries.filter((entry) => entry.zone === "trofa").length, 5);
  assert.equal(entries.filter((entry) => entry.zone === "matosinhos").length, 15);
  assert.equal(entries.filter((entry) => entry.zone === "porto-ramalde").length, 14);
});

test("cada ficha tem exatamente uma linha correspondente no índice", async () => {
  const entries = await readCanonicalEntries({ rootDir: process.cwd() });
  for (const entry of entries) {
    assert.match(entry.indexRow, new RegExp(
      `\\[ficha\\]\\(${entry.targetPath.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\)`,
    ));
    assert.ok(entry.fichaMarkdown.startsWith("# "));
    assert.match(entry.fichaMarkdown, /^## Fontes consultadas$/m);
  }
});

test("renderReviewIssue produz payload legível e novamente analisável", async () => {
  const [entry] = await readCanonicalEntries({ rootDir: process.cwd() });
  const issue = renderReviewIssue(entry);
  assert.equal(issue.title, `[Revisão] ${entry.name}`);
  assert.deepEqual(issue.labels, [
    "decisao:pendente",
    `zona:${entry.zone}`,
  ]);
  assert.match(issue.body, /^## Revisão da creche/m);
  assert.match(issue.body, /comenta exatamente `aceite` ou `rejeitado`/i);
  assert.deepEqual(parseReviewIssue(issue.body), {
    targetPath: entry.targetPath,
    fichaMarkdown: entry.fichaMarkdown,
    indexRow: entry.indexRow,
  });
});

test("declara todas as labels de decisão e zona", () => {
  assert.deepEqual(Object.keys(LABELS).sort(), [
    "decisao:aceite",
    "decisao:erro",
    "decisao:pendente",
    "decisao:rejeitado",
    "zona:matosinhos",
    "zona:porto-ramalde",
    "zona:trofa",
  ]);
});
