import test from "node:test";
import assert from "node:assert/strict";

import {
  renderCalendarIcs,
  renderCalendarMarkdown,
} from "../../scripts/calendar/render.mjs";

function item(overrides) {
  return {
    id: "example",
    title: "Exemplo",
    type: "research",
    owner: "agent",
    timing: { kind: "unknown" },
    state: "unknown",
    remindersDays: [],
    dependsOn: [],
    issueNumber: null,
    source: null,
    notes: "",
    ...overrides,
  };
}

const document = {
  version: 1,
  timezone: "Europe/Lisbon",
  defaultRemindersDays: [30, 14, 7, 2],
  decisions: [
    item({
      id: "exact-date",
      title: "Entregar documentos, confirmar tudo",
      type: "document",
      owner: "human",
      timing: { kind: "date", date: "2026-09-01" },
      state: "planned",
      remindersDays: [7],
      issueNumber: 59,
      notes: "Levar originais; guardar cópias.",
    }),
    item({
      id: "application-window",
      title: "Janela de candidatura",
      type: "application",
      owner: "human",
      timing: {
        kind: "range",
        start: "2027-01-01",
        end: "2027-04-30",
      },
      state: "planned",
      dependsOn: ["exact-date"],
    }),
    item({
      id: "annual-renewal",
      title: "Renovação anual",
      type: "renewal",
      owner: "human",
      timing: {
        kind: "recurrence",
        start: "2027-01-15",
        rrule: "FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15",
      },
      state: "planned",
      remindersDays: [30],
    }),
    item({
      id: "unknown-contact",
      title: "Confirmar encerramento",
      type: "contact",
      owner: "human",
      issueNumber: 10,
    }),
    item({
      id: "completed-review",
      title: "Revisão concluída",
      type: "review",
      owner: "human",
      timing: { kind: "date", date: "2026-07-30" },
      state: "completed",
    }),
  ],
};

test("Markdown separa datas, recorrências, desconhecidas e concluídas", () => {
  const markdown = renderCalendarMarkdown(document);

  assert.match(markdown, /^# Calendário de decisões$/m);
  assert.match(markdown, /Total: \*\*5\*\*/);
  assert.match(markdown, /^## Datas planeadas$/m);
  assert.match(markdown, /2026-09-01.*Entregar documentos, confirmar tudo/);
  assert.match(markdown, /2027-01-01.*2027-04-30.*Janela de candidatura/);
  assert.match(markdown, /Depende de: `exact-date`/);
  assert.match(markdown, /\[#59\]\(https:\/\/github\.com\/nelsudev\/creches\/issues\/59\)/);
  assert.match(markdown, /^## Recorrências$/m);
  assert.match(markdown, /FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15/);
  assert.match(markdown, /^## Sem data confirmada$/m);
  assert.match(markdown, /\*\*\?\*\* — Confirmar encerramento/);
  assert.match(markdown, /^## Concluídas ou canceladas$/m);
  assert.match(markdown, /2026-07-30.*Revisão concluída/);
});

test("ICS produz eventos determinísticos e exclui datas desconhecidas", () => {
  const ics = renderCalendarIcs(document);

  assert.ok(ics.startsWith([
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nelsudev//Creches decision calendar//PT",
    "CALSCALE:GREGORIAN",
    "X-WR-TIMEZONE:Europe/Lisbon",
  ].join("\r\n")));
  assert.match(ics, /UID:exact-date@creches\.nelsudev\r\n/);
  assert.match(ics, /DTSTAMP:20260901T000000Z\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20260901\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20260902\r\n/);
  assert.match(ics, /SUMMARY:Entregar documentos\\, confirmar tudo\r\n/);
  assert.match(ics, /Levar originais\\; guardar cópias\./);
  assert.match(ics, /TRIGGER:-P7D\r\n/);
  assert.match(ics, /DTSTART;VALUE=DATE:20270101\r\n/);
  assert.match(ics, /DTEND;VALUE=DATE:20270501\r\n/);
  assert.match(ics, /RRULE:FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15\r\n/);
  assert.doesNotMatch(ics, /unknown-contact/);
  assert.equal((ics.match(/BEGIN:VEVENT/g) ?? []).length, 4);
  assert.ok(ics.endsWith("END:VCALENDAR\r\n"));
  assert.doesNotMatch(ics, /(?<!\r)\n/);
});
