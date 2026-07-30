import test from "node:test";
import assert from "node:assert/strict";

import {
  LABELS,
  planIssueSync,
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

test("planeia atualização apenas para uma issue aberta e pendente", async () => {
  const [entry] = await readCanonicalEntries({ rootDir: process.cwd() });
  const desired = renderReviewIssue(entry);
  const staleBody = desired.body.replace(entry.indexRow, `${entry.indexRow} `);
  const plan = planIssueSync([entry], [{
    number: 19,
    state: "OPEN",
    body: staleBody,
    labels: [{ name: "decisao:pendente" }, { name: `zona:${entry.zone}` }],
  }]);
  assert.equal(plan.updates.length, 1);
  assert.equal(plan.updates[0].number, 19);
  assert.equal(plan.updates[0].body, desired.body);
  assert.equal(plan.unchanged.length, 0);
  assert.equal(plan.refused.length, 0);
});

test("planeamento é no-op para corpo idêntico", async () => {
  const [entry] = await readCanonicalEntries({ rootDir: process.cwd() });
  const desired = renderReviewIssue(entry);
  const plan = planIssueSync([entry], [{
    number: 19,
    state: "OPEN",
    body: desired.body,
    labels: [{ name: "decisao:pendente" }],
  }]);
  assert.equal(plan.updates.length, 0);
  assert.deepEqual(plan.unchanged, [{
    number: 19,
    targetPath: entry.targetPath,
  }]);
  assert.equal(plan.refused.length, 0);
});

test("recusa issue fechada ou com decisão terminal", async () => {
  const entries = await readCanonicalEntries({ rootDir: process.cwd() });
  const first = entries[0];
  const second = entries[1];
  const plan = planIssueSync([first, second], [
    {
      number: 19,
      state: "CLOSED",
      body: renderReviewIssue(first).body,
      labels: [{ name: "decisao:pendente" }],
    },
    {
      number: 20,
      state: "OPEN",
      body: renderReviewIssue(second).body,
      labels: [{ name: "decisao:aceite" }],
    },
  ]);
  assert.equal(plan.updates.length, 0);
  assert.equal(plan.unchanged.length, 0);
  assert.deepEqual(
    plan.refused.map((item) => item.reason),
    ["issue fechada", "decisão terminal"],
  );
});

test("recusa target_path com issues duplicadas", async () => {
  const [entry] = await readCanonicalEntries({ rootDir: process.cwd() });
  const issue = {
    state: "OPEN",
    body: renderReviewIssue(entry).body,
    labels: [{ name: "decisao:pendente" }],
  };
  const plan = planIssueSync([entry], [
    { ...issue, number: 19 },
    { ...issue, number: 20 },
  ]);
  assert.deepEqual(plan.refused, [{
    targetPath: entry.targetPath,
    reason: "issues duplicadas",
  }]);
});
