function startDate(decision) {
  if (decision.timing.kind === "date") return decision.timing.date;
  if (decision.timing.kind === "range") return decision.timing.start;
  if (decision.timing.kind === "recurrence") return decision.timing.start;
  return "";
}

function compareDecisions(left, right) {
  return startDate(left).localeCompare(startDate(right))
    || left.id.localeCompare(right.id);
}

function issueLink(issueNumber) {
  if (!issueNumber) return "";
  return ` · [#${issueNumber}](https://github.com/nelsudev/creches/issues/${issueNumber})`;
}

function timingLabel(decision) {
  if (decision.timing.kind === "date") return decision.timing.date;
  if (decision.timing.kind === "range") {
    return `${decision.timing.start} → ${decision.timing.end}`;
  }
  if (decision.timing.kind === "recurrence") {
    return `${decision.timing.start} · \`${decision.timing.rrule}\``;
  }
  return "?";
}

function renderDecision(decision) {
  const lines = [
    `- **${timingLabel(decision)}** — ${decision.title} \`${decision.id}\` (${decision.type}, ${decision.owner})${issueLink(decision.issueNumber)}`,
  ];
  if (decision.dependsOn.length > 0) {
    lines.push(`  - Depende de: ${decision.dependsOn.map((id) => `\`${id}\``).join(", ")}`);
  }
  if (decision.source) {
    lines.push(`  - Fonte: [${decision.source.label}](${decision.source.url}) · consultada em ${decision.source.checkedAt}`);
  }
  if (decision.notes) {
    lines.push(`  - ${decision.notes}`);
  }
  return lines.join("\n");
}

function renderSection(title, decisions) {
  const content = decisions.length > 0
    ? decisions.map(renderDecision).join("\n")
    : "_Nenhuma entrada._";
  return `## ${title}\n\n${content}`;
}

export function renderCalendarMarkdown(document) {
  const closed = document.decisions
    .filter((item) => ["completed", "cancelled"].includes(item.state))
    .sort(compareDecisions);
  const open = document.decisions.filter(
    (item) => !["completed", "cancelled"].includes(item.state),
  );
  const planned = open
    .filter((item) => ["date", "range"].includes(item.timing.kind))
    .sort(compareDecisions);
  const recurring = open
    .filter((item) => item.timing.kind === "recurrence")
    .sort(compareDecisions);
  const unknown = open
    .filter((item) => item.timing.kind === "unknown")
    .sort((left, right) => left.id.localeCompare(right.id));
  const knownCount = document.decisions.length - unknown.length;

  return [
    "# Calendário de decisões",
    "",
    `Total: **${document.decisions.length}** · Com data: **${knownCount}** · Sem data: **${unknown.length}**`,
    "",
    `Fuso: \`${document.timezone}\`. Fonte canónica: \`calendar/decisions.json\`.`,
    "",
    renderSection("Datas planeadas", planned),
    "",
    renderSection("Recorrências", recurring),
    "",
    renderSection("Sem data confirmada", unknown),
    "",
    renderSection("Concluídas ou canceladas", closed),
    "",
  ].join("\n");
}

function compactDate(value) {
  return value.replaceAll("-", "");
}

function followingDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + 1));
  return date.toISOString().slice(0, 10);
}

function escapeIcs(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("\n", "\\n")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,");
}

function eventDescription(decision) {
  const parts = [
    `Tipo: ${decision.type}`,
    `Responsável: ${decision.owner}`,
  ];
  if (decision.issueNumber) {
    parts.push(`Issue: https://github.com/nelsudev/creches/issues/${decision.issueNumber}`);
  }
  if (decision.dependsOn.length > 0) {
    parts.push(`Depende de: ${decision.dependsOn.join(", ")}`);
  }
  if (decision.notes) parts.push(decision.notes);
  return escapeIcs(parts.join("\n"));
}

function eventStatus(state) {
  if (state === "cancelled") return "CANCELLED";
  if (state === "blocked") return "TENTATIVE";
  return "CONFIRMED";
}

function renderAlarm(days, title) {
  return [
    "BEGIN:VALARM",
    `TRIGGER:-P${days}D`,
    "ACTION:DISPLAY",
    `DESCRIPTION:${escapeIcs(`Lembrete: ${title}`)}`,
    "END:VALARM",
  ];
}

function renderEvent(decision) {
  const start = startDate(decision);
  const lines = [
    "BEGIN:VEVENT",
    `UID:${decision.id}@creches.nelsudev`,
    `DTSTAMP:${compactDate(start)}T000000Z`,
    `DTSTART;VALUE=DATE:${compactDate(start)}`,
  ];

  if (decision.timing.kind === "date") {
    lines.push(
      `DTEND;VALUE=DATE:${compactDate(followingDate(decision.timing.date))}`,
    );
  } else if (decision.timing.kind === "range") {
    lines.push(
      `DTEND;VALUE=DATE:${compactDate(followingDate(decision.timing.end))}`,
    );
  } else if (decision.timing.kind === "recurrence") {
    lines.push(`RRULE:${decision.timing.rrule}`);
  }

  lines.push(
    `SUMMARY:${escapeIcs(decision.title)}`,
    `DESCRIPTION:${eventDescription(decision)}`,
    `STATUS:${eventStatus(decision.state)}`,
  );
  for (const days of decision.remindersDays) {
    lines.push(...renderAlarm(days, decision.title));
  }
  lines.push("END:VEVENT");
  return lines;
}

export function renderCalendarIcs(document) {
  const known = document.decisions
    .filter((decision) => decision.timing.kind !== "unknown")
    .sort(compareDecisions);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//nelsudev//Creches decision calendar//PT",
    "CALSCALE:GREGORIAN",
    `X-WR-TIMEZONE:${document.timezone}`,
  ];
  for (const decision of known) {
    lines.push(...renderEvent(decision));
  }
  lines.push("END:VCALENDAR");
  return `${lines.join("\r\n")}\r\n`;
}
