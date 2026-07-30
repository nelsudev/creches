import test from "node:test";
import assert from "node:assert/strict";

import {
  assertValidCalendarDocument,
  validateCalendarDocument,
} from "../../scripts/calendar/model.mjs";

const base = {
  version: 1,
  timezone: "Europe/Lisbon",
  defaultRemindersDays: [30, 14, 7, 2],
  decisions: [],
};

function decision(overrides = {}) {
  return {
    id: "example-decision",
    title: "Exemplo",
    type: "research",
    owner: "agent",
    timing: { kind: "date", date: "2026-09-01" },
    state: "planned",
    remindersDays: [7],
    dependsOn: [],
    issueNumber: 59,
    source: null,
    notes: "",
    ...overrides,
  };
}

test("aceita um documento mínimo", () => {
  assert.doesNotThrow(() => assertValidCalendarDocument(base));
});

test("aceita data, intervalo, recorrência e data desconhecida", () => {
  const cases = [
    {
      timing: { kind: "date", date: "2026-09-01" },
      state: "planned",
      remindersDays: [7],
    },
    {
      timing: { kind: "range", start: "2026-01-01", end: "2026-04-30" },
      state: "planned",
      remindersDays: [14],
    },
    {
      timing: {
        kind: "recurrence",
        start: "2026-01-15",
        rrule: "FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15",
      },
      state: "planned",
      remindersDays: [30],
    },
    {
      timing: { kind: "unknown" },
      state: "unknown",
      remindersDays: [],
    },
  ];

  for (const [index, item] of cases.entries()) {
    const document = {
      ...base,
      decisions: [decision({
        id: `example-${index}`,
        ...item,
      })],
    };
    assert.deepEqual(validateCalendarDocument(document), []);
  }
});

test("rejeita datas, estados e responsáveis semanticamente inválidos", () => {
  const cases = [
    {
      label: "timezone",
      document: { ...base, timezone: "UTC" },
    },
    {
      label: "id",
      document: { ...base, decisions: [decision({ id: "Não válido" })] },
    },
    {
      label: "owner",
      document: {
        ...base,
        decisions: [decision({ type: "contact", owner: "agent" })],
      },
    },
    {
      label: "timing.date",
      document: {
        ...base,
        decisions: [decision({
          timing: { kind: "date", date: "2026-02-30" },
        })],
      },
    },
    {
      label: "timing",
      document: {
        ...base,
        decisions: [decision({
          timing: {
            kind: "range",
            start: "2026-04-30",
            end: "2026-01-01",
          },
        })],
      },
    },
    {
      label: "remindersDays",
      document: {
        ...base,
        decisions: [decision({
          timing: { kind: "unknown" },
          state: "unknown",
          remindersDays: [7],
        })],
      },
    },
    {
      label: "state",
      document: {
        ...base,
        decisions: [decision({
          timing: { kind: "unknown" },
          state: "planned",
          remindersDays: [],
        })],
      },
    },
    {
      label: "rrule",
      document: {
        ...base,
        decisions: [decision({
          timing: {
            kind: "recurrence",
            start: "2026-01-15",
            rrule: "EVERY YEAR",
          },
        })],
      },
    },
  ];

  for (const { label, document } of cases) {
    const errors = validateCalendarDocument(document);
    assert.ok(
      errors.some((error) => error.includes(label)),
      `${label}: ${errors.join(" | ")}`,
    );
  }
});

test("rejeita estrutura desconhecida, duplicados e dependências inválidas", () => {
  const cases = [
    {
      label: "extra",
      document: { ...base, extra: true },
    },
    {
      label: "decisions[0].extra",
      document: {
        ...base,
        decisions: [decision({ extra: true })],
      },
    },
    {
      label: "duplicado",
      document: {
        ...base,
        decisions: [
          decision(),
          decision({ title: "Outro título" }),
        ],
      },
    },
    {
      label: "dependsOn[0]",
      document: {
        ...base,
        decisions: [decision({ dependsOn: ["missing-decision"] })],
      },
    },
    {
      label: "depender de si",
      document: {
        ...base,
        decisions: [decision({ dependsOn: ["example-decision"] })],
      },
    },
    {
      label: "defaultRemindersDays",
      document: {
        ...base,
        defaultRemindersDays: [7, 7, -1],
      },
    },
    {
      label: "source.url",
      document: {
        ...base,
        decisions: [decision({
          source: {
            label: "Fonte",
            url: "não é URL",
            checkedAt: "2026-07-30",
          },
        })],
      },
    },
  ];

  for (const { label, document } of cases) {
    const errors = validateCalendarDocument(document);
    assert.ok(
      errors.some((error) => error.includes(label)),
      `${label}: ${errors.join(" | ")}`,
    );
  }
});
