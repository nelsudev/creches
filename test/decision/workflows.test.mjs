import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("workflow de decisão restringe autoridade, permissões e concorrência", async () => {
  const workflow = await readFile(".github/workflows/decision.yml", "utf8");
  assert.match(workflow, /issue_comment:\s*\n\s+types: \[created\]/);
  assert.match(workflow, /contents: write/);
  assert.match(workflow, /issues: write/);
  assert.match(workflow, /group: creche-decision-writes/);
  assert.match(workflow, /cancel-in-progress: false/);
  assert.match(workflow, /OWNER/);
  assert.match(workflow, /MEMBER/);
  assert.match(workflow, /COLLABORATOR/);
  assert.match(workflow, /decisao:pendente/);
  assert.match(workflow, /process\.mjs/);
  assert.match(workflow, /gh issue close/);
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
});

test("workflow de validação reage à abertura e edição", async () => {
  const workflow = await readFile(
    ".github/workflows/validate-review-issue.yml",
    "utf8",
  );
  assert.match(workflow, /issues:\s*\n\s+types: \[opened, edited\]/);
  assert.match(workflow, /contents: read/);
  assert.match(workflow, /issues: write/);
  assert.doesNotMatch(workflow, /contents: write/);
  assert.match(workflow, /parseReviewIssue/);
  assert.match(workflow, /decisao:erro/);
  assert.match(workflow, /decisao:pendente/);
  assert.match(workflow, /actions\/checkout@v7/);
  assert.match(workflow, /actions\/setup-node@v7/);
});
