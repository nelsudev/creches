import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  assertValidCalendarDocument,
} from "../../scripts/calendar/model.mjs";

const document = JSON.parse(
  await readFile(new URL("../../calendar/decisions.json", import.meta.url)),
);

test("mapeia exatamente as 34 issues de revisão", () => {
  const reviews = document.decisions.filter((item) => item.type === "review");
  assert.equal(reviews.length, 34);
  assert.deepEqual(
    reviews.map((item) => item.issueNumber).sort((a, b) => a - b),
    Array.from({ length: 34 }, (_, index) => index + 19),
  );
  assert.ok(reviews.every((item) => item.owner === "human"));
});

test("mapeia as fases humanas existentes", () => {
  const phaseIssues = document.decisions
    .map((item) => item.issueNumber)
    .filter((number) => Number.isInteger(number));
  for (let issue = 10; issue <= 16; issue += 1) {
    assert.ok(phaseIssues.includes(issue), `falta issue #${issue}`);
  }
});

test("representa a cadeia entre candidatura, matrícula e renovação", () => {
  const byId = new Map(document.decisions.map((item) => [item.id, item]));
  const required = [
    "choose-three-options",
    "submit-official-application",
    "save-application-number",
    "monitor-application",
    "respond-to-offer",
    "deliver-enrolment-documents",
    "confirm-payments",
    "start-adaptation",
    "renew-enrolment",
    "confirm-annual-closures",
  ];
  for (const id of required) {
    assert.ok(byId.has(id), `falta ${id}`);
  }

  assert.deepEqual(
    byId.get("submit-official-application").dependsOn,
    ["choose-three-options"],
  );
  assert.deepEqual(
    byId.get("save-application-number").dependsOn,
    ["submit-official-application"],
  );
  assert.deepEqual(
    byId.get("respond-to-offer").dependsOn,
    ["monitor-application"],
  );
  assert.deepEqual(
    byId.get("start-adaptation").dependsOn,
    ["deliver-enrolment-documents", "confirm-payments"],
  );
  assert.deepEqual(
    byId.get("renew-enrolment").dependsOn,
    ["start-adaptation"],
  );
});

test("começa sem inventar datas ou lembretes", () => {
  assert.equal(document.decisions.length, 51);
  assert.ok(
    document.decisions.every((item) => item.timing.kind === "unknown"),
  );
  assert.ok(document.decisions.every((item) => item.state === "unknown"));
  assert.ok(
    document.decisions.every((item) => item.remindersDays.length === 0),
  );
  assert.doesNotThrow(() => assertValidCalendarDocument(document));
});
