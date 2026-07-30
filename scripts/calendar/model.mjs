export const CALENDAR_TYPES = Object.freeze([
  "research",
  "review",
  "contact",
  "visit",
  "application",
  "decision",
  "document",
  "payment",
  "adaptation",
  "renewal",
  "closure",
]);

export const CALENDAR_STATES = Object.freeze([
  "unknown",
  "planned",
  "completed",
  "cancelled",
  "blocked",
]);

export const HUMAN_ONLY_TYPES = new Set([
  "contact",
  "visit",
  "application",
  "decision",
]);

const ROOT_KEYS = new Set([
  "version",
  "timezone",
  "defaultRemindersDays",
  "decisions",
]);

const DECISION_KEYS = new Set([
  "id",
  "title",
  "type",
  "owner",
  "timing",
  "state",
  "remindersDays",
  "dependsOn",
  "issueNumber",
  "source",
  "notes",
]);

const SOURCE_KEYS = new Set(["label", "url", "checkedAt"]);

const TIMING_KEYS = {
  date: new Set(["kind", "date"]),
  range: new Set(["kind", "start", "end"]),
  recurrence: new Set(["kind", "start", "rrule"]),
  unknown: new Set(["kind"]),
};

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function addUnknownKeyErrors(value, allowed, path, errors) {
  if (!isObject(value)) return;
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      errors.push(`${path ? `${path}.` : ""}${key}: propriedade desconhecida`);
    }
  }
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function validateReminderDays(value, path, errors) {
  if (!Array.isArray(value)) {
    errors.push(`${path}: deve ser uma lista`);
    return;
  }
  const seen = new Set();
  value.forEach((days, index) => {
    if (!Number.isInteger(days) || days < 0) {
      errors.push(`${path}[${index}]: deve ser um inteiro não negativo`);
    }
    if (seen.has(days)) {
      errors.push(`${path}[${index}]: lembrete duplicado`);
    }
    seen.add(days);
  });
}

function validateTiming(timing, path, state, remindersDays, errors) {
  if (!isObject(timing)) {
    errors.push(`${path}: deve ser um objeto`);
    return;
  }

  const allowed = TIMING_KEYS[timing.kind];
  if (!allowed) {
    errors.push(`${path}.kind: valor inválido`);
    return;
  }
  addUnknownKeyErrors(timing, allowed, path, errors);

  if (timing.kind === "date") {
    if (!validDate(timing.date)) {
      errors.push(`${path}.date: data inválida`);
    }
  } else if (timing.kind === "range") {
    if (!validDate(timing.start)) {
      errors.push(`${path}.start: data inválida`);
    }
    if (!validDate(timing.end)) {
      errors.push(`${path}.end: data inválida`);
    }
    if (
      validDate(timing.start)
      && validDate(timing.end)
      && timing.start > timing.end
    ) {
      errors.push(`${path}: início posterior ao fim`);
    }
  } else if (timing.kind === "recurrence") {
    if (!validDate(timing.start)) {
      errors.push(`${path}.start: data inválida`);
    }
    if (
      typeof timing.rrule !== "string"
      || !/^FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)(?:;[A-Z]+=[A-Z0-9,;-]+)*$/.test(
        timing.rrule,
      )
    ) {
      errors.push(`${path}.rrule: regra inválida`);
    }
  }

  if (timing.kind === "unknown") {
    if (!["unknown", "blocked"].includes(state)) {
      errors.push(`${path.replace(".timing", ".state")}: data desconhecida exige estado unknown ou blocked`);
    }
    if (Array.isArray(remindersDays) && remindersDays.length > 0) {
      errors.push(`${path.replace(".timing", ".remindersDays")}: data desconhecida não aceita lembretes`);
    }
  } else if (state === "unknown") {
    errors.push(`${path.replace(".timing", ".state")}: data conhecida não aceita estado unknown`);
  }
}

function validateSource(source, path, errors) {
  if (source === null) return;
  if (!isObject(source)) {
    errors.push(`${path}: deve ser null ou objeto`);
    return;
  }
  addUnknownKeyErrors(source, SOURCE_KEYS, path, errors);
  if (typeof source.label !== "string" || source.label.trim() === "") {
    errors.push(`${path}.label: deve ser texto não vazio`);
  }
  try {
    const url = new URL(source.url);
    if (!["http:", "https:"].includes(url.protocol)) throw new Error();
  } catch {
    errors.push(`${path}.url: deve ser URL HTTP(S) válida`);
  }
  if (!validDate(source.checkedAt)) {
    errors.push(`${path}.checkedAt: data inválida`);
  }
}

function validateDecision(decision, index, errors) {
  const path = `decisions[${index}]`;
  if (!isObject(decision)) {
    errors.push(`${path}: deve ser um objeto`);
    return;
  }
  addUnknownKeyErrors(decision, DECISION_KEYS, path, errors);

  if (
    typeof decision.id !== "string"
    || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(decision.id)
  ) {
    errors.push(`${path}.id: deve usar kebab-case`);
  }
  if (typeof decision.title !== "string" || decision.title.trim() === "") {
    errors.push(`${path}.title: deve ser texto não vazio`);
  }
  if (!CALENDAR_TYPES.includes(decision.type)) {
    errors.push(`${path}.type: valor inválido`);
  }
  if (!["agent", "human"].includes(decision.owner)) {
    errors.push(`${path}.owner: valor inválido`);
  } else if (
    HUMAN_ONLY_TYPES.has(decision.type)
    && decision.owner !== "human"
  ) {
    errors.push(`${path}.owner: ${decision.type} exige human`);
  }
  if (!CALENDAR_STATES.includes(decision.state)) {
    errors.push(`${path}.state: valor inválido`);
  }

  validateReminderDays(decision.remindersDays, `${path}.remindersDays`, errors);
  validateTiming(
    decision.timing,
    `${path}.timing`,
    decision.state,
    decision.remindersDays,
    errors,
  );

  if (!Array.isArray(decision.dependsOn)) {
    errors.push(`${path}.dependsOn: deve ser uma lista`);
  } else {
    const seen = new Set();
    decision.dependsOn.forEach((dependency, dependencyIndex) => {
      if (
        typeof dependency !== "string"
        || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(dependency)
      ) {
        errors.push(`${path}.dependsOn[${dependencyIndex}]: identificador inválido`);
      }
      if (seen.has(dependency)) {
        errors.push(`${path}.dependsOn[${dependencyIndex}]: dependência duplicada`);
      }
      seen.add(dependency);
    });
  }

  if (
    decision.issueNumber !== null
    && (!Number.isInteger(decision.issueNumber) || decision.issueNumber <= 0)
  ) {
    errors.push(`${path}.issueNumber: deve ser null ou inteiro positivo`);
  }
  validateSource(decision.source, `${path}.source`, errors);
  if (typeof decision.notes !== "string") {
    errors.push(`${path}.notes: deve ser texto`);
  }
}

export function validateCalendarDocument(document) {
  const errors = [];
  if (!isObject(document)) {
    return ["root: deve ser um objeto"];
  }
  addUnknownKeyErrors(document, ROOT_KEYS, "", errors);

  if (document.version !== 1) {
    errors.push("version: deve ser 1");
  }
  if (document.timezone !== "Europe/Lisbon") {
    errors.push("timezone: deve ser Europe/Lisbon");
  }
  validateReminderDays(
    document.defaultRemindersDays,
    "defaultRemindersDays",
    errors,
  );
  if (!Array.isArray(document.decisions)) {
    errors.push("decisions: deve ser uma lista");
    return errors;
  }

  document.decisions.forEach((decision, index) => {
    validateDecision(decision, index, errors);
  });

  const idIndexes = new Map();
  document.decisions.forEach((decision, index) => {
    if (typeof decision?.id !== "string") return;
    if (idIndexes.has(decision.id)) {
      errors.push(`decisions[${index}].id: identificador duplicado`);
    } else {
      idIndexes.set(decision.id, index);
    }
  });

  document.decisions.forEach((decision, index) => {
    if (!Array.isArray(decision?.dependsOn)) return;
    decision.dependsOn.forEach((dependency, dependencyIndex) => {
      const path = `decisions[${index}].dependsOn[${dependencyIndex}]`;
      if (dependency === decision.id) {
        errors.push(`${path}: uma decisão não pode depender de si própria`);
      } else if (!idIndexes.has(dependency)) {
        errors.push(`${path}: decisão inexistente`);
      }
    });
  });

  return errors;
}

export function assertValidCalendarDocument(document) {
  const errors = validateCalendarDocument(document);
  if (errors.length > 0) {
    throw new Error(`Calendário inválido:\n- ${errors.join("\n- ")}`);
  }
}
