# Calendar Schema Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a fonte canónica e a validação automática do modelo de decisões definido na issue #59.

**Architecture:** `calendar/decisions.json` é o documento versionado que os restantes geradores vão consumir. `scripts/calendar/model.mjs` contém validação pura, sem dependências externas, e `scripts/calendar/validate.mjs` fornece o comando de CI; `calendar/schema.json` documenta o mesmo contrato em JSON Schema.

**Tech Stack:** Node.js 24, JavaScript ESM, JSON, JSON Schema 2020-12, `node:test`.

## Global Constraints

- Fuso obrigatório: `Europe/Lisbon`.
- Datas desconhecidas usam `timing.kind = "unknown"` e não têm lembretes.
- Tipos humanos `contact`, `visit`, `application` e `decision` exigem `owner = "human"`.
- Identificadores usam kebab-case e são únicos.
- Dependências referem identificadores existentes.
- O documento não aceita propriedades desconhecidas nem dados pessoais.
- Não adicionar dependências npm.

---

### Task 1: Contrato e testes do modelo

**Files:**
- Create: `test/calendar/model.test.mjs`
- Create: `scripts/calendar/model.mjs`

**Interfaces:**
- Produces: `validateCalendarDocument(document): string[]`
- Produces: `assertValidCalendarDocument(document): void`
- Produces: `CALENDAR_TYPES`, `CALENDAR_STATES` e `HUMAN_ONLY_TYPES`

- [ ] **Step 1: Escrever testes falhantes para um documento mínimo e para os quatro tipos de timing**

```js
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

test("aceita documento mínimo", () => {
  assert.doesNotThrow(() => assertValidCalendarDocument(base));
});

test("aceita data, intervalo, recorrência e data desconhecida", () => {
  const timings = [
    { kind: "date", date: "2026-09-01" },
    { kind: "range", start: "2026-01-01", end: "2026-04-30" },
    {
      kind: "recurrence",
      start: "2026-01-15",
      rrule: "FREQ=YEARLY;BYMONTH=1;BYMONTHDAY=15",
    },
    { kind: "unknown" },
  ];
  for (const [index, timing] of timings.entries()) {
    const state = timing.kind === "unknown" ? "unknown" : "planned";
    const remindersDays = timing.kind === "unknown" ? [] : [7];
    const document = {
      ...base,
      decisions: [{
        id: `example-${index}`,
        title: `Exemplo ${index}`,
        type: "research",
        owner: "agent",
        timing,
        state,
        remindersDays,
        dependsOn: [],
        issueNumber: 59,
        source: null,
        notes: "",
      }],
    };
    assert.deepEqual(validateCalendarDocument(document), []);
  }
});
```

- [ ] **Step 2: Executar o teste e confirmar falha por módulo inexistente**

Run: `node --test test/calendar/model.test.mjs`

Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar validação mínima da raiz, decisões e timings**

```js
export const CALENDAR_TYPES = Object.freeze([
  "research", "review", "contact", "visit", "application", "decision",
  "document", "payment", "adaptation", "renewal", "closure",
]);
export const CALENDAR_STATES = Object.freeze([
  "unknown", "planned", "completed", "cancelled", "blocked",
]);
export const HUMAN_ONLY_TYPES = new Set([
  "contact", "visit", "application", "decision",
]);

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function validateCalendarDocument(document) {
  const errors = [];
  if (document?.version !== 1) errors.push("version: deve ser 1");
  if (document?.timezone !== "Europe/Lisbon") {
    errors.push("timezone: deve ser Europe/Lisbon");
  }
  if (!Array.isArray(document?.defaultRemindersDays)) {
    errors.push("defaultRemindersDays: deve ser array");
  }
  if (!Array.isArray(document?.decisions)) {
    errors.push("decisions: deve ser array");
    return errors;
  }
  document.decisions.forEach((decision, index) => {
    const path = `decisions[${index}]`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(decision.id ?? "")) {
      errors.push(`${path}.id: deve usar kebab-case`);
    }
    if (!CALENDAR_TYPES.includes(decision.type)) {
      errors.push(`${path}.type: valor inválido`);
    }
    if (!CALENDAR_STATES.includes(decision.state)) {
      errors.push(`${path}.state: valor inválido`);
    }
    if (HUMAN_ONLY_TYPES.has(decision.type) && decision.owner !== "human") {
      errors.push(`${path}.owner: ${decision.type} exige human`);
    }
    const timing = decision.timing;
    if (timing?.kind === "date" && !validDate(timing.date)) {
      errors.push(`${path}.timing.date: data inválida`);
    } else if (
      timing?.kind === "range"
      && (!validDate(timing.start) || !validDate(timing.end))
    ) {
      errors.push(`${path}.timing: intervalo inválido`);
    } else if (
      timing?.kind === "recurrence"
      && (!validDate(timing.start) || !/^FREQ=/.test(timing.rrule ?? ""))
    ) {
      errors.push(`${path}.timing: recorrência inválida`);
    } else if (!["date", "range", "recurrence", "unknown"].includes(timing?.kind)) {
      errors.push(`${path}.timing.kind: valor inválido`);
    }
  });
  return errors;
}

export function assertValidCalendarDocument(document) {
  const errors = validateCalendarDocument(document);
  if (errors.length) throw new Error(`Calendário inválido:\n- ${errors.join("\n- ")}`);
}
```

- [ ] **Step 4: Acrescentar testes de rejeição com mensagens acionáveis**

Cobrir:

```js
[
  ["timezone", { ...base, timezone: "UTC" }],
  ["identificador", decision({ id: "Não válido" })],
  ["owner", decision({ type: "contact", owner: "agent" })],
  ["data", decision({ timing: { kind: "date", date: "2026-02-30" } })],
  ["intervalo", decision({
    timing: { kind: "range", start: "2026-04-30", end: "2026-01-01" },
  })],
  ["lembretes", decision({
    timing: { kind: "unknown" }, state: "unknown", remindersDays: [7],
  })],
  ["estado", decision({
    timing: { kind: "unknown" }, state: "planned", remindersDays: [],
  })],
]
```

- [ ] **Step 5: Implementar unicidade, dependências, propriedades permitidas e mensagens por caminho**

Validar exatamente:

- raiz com `version`, `timezone`, `defaultRemindersDays`, `decisions`;
- decisão com `id`, `title`, `type`, `owner`, `timing`, `state`, `remindersDays`, `dependsOn`, `issueNumber`, `source`, `notes`;
- `source` nulo ou `{ label, url, checkedAt }`;
- dias inteiros não negativos e sem duplicados;
- dependências existentes, diferentes do próprio ID e sem duplicados;
- propriedades adicionais rejeitadas.

- [ ] **Step 6: Executar teste focado**

Run: `node --test test/calendar/model.test.mjs`

Expected: todos os testes passam.

- [ ] **Step 7: Commit**

```powershell
git add scripts/calendar/model.mjs test/calendar/model.test.mjs
git commit -m "feat(calendar): validate decision model"
git push origin main
```

---

### Task 2: Fonte canónica, JSON Schema e CLI

**Files:**
- Create: `calendar/decisions.json`
- Create: `calendar/schema.json`
- Create: `calendar/README.md`
- Create: `scripts/calendar/validate.mjs`
- Modify: `package.json`
- Test: `test/calendar/model.test.mjs`

**Interfaces:**
- Consumes: `assertValidCalendarDocument(document): void`
- Produces: `npm run calendar:validate`
- Produces: contrato JSON Schema para ferramentas externas

- [ ] **Step 1: Escrever teste falhante que carrega a fonte canónica e compara o schema com as enumerações**

```js
test("fonte canónica e JSON Schema correspondem ao validador", async () => {
  const document = JSON.parse(
    await readFile(new URL("../../calendar/decisions.json", import.meta.url)),
  );
  const schema = JSON.parse(
    await readFile(new URL("../../calendar/schema.json", import.meta.url)),
  );
  assert.doesNotThrow(() => assertValidCalendarDocument(document));
  assert.deepEqual(schema.$defs.decision.properties.type.enum, CALENDAR_TYPES);
  assert.deepEqual(schema.$defs.decision.properties.state.enum, CALENDAR_STATES);
  assert.equal(schema.additionalProperties, false);
});
```

- [ ] **Step 2: Executar o teste e confirmar falha por ficheiros inexistentes**

Run: `node --test test/calendar/model.test.mjs`

Expected: FAIL com `ENOENT` para `calendar/decisions.json`.

- [ ] **Step 3: Criar a fonte canónica vazia e o JSON Schema 2020-12 completo**

`calendar/decisions.json`:

```json
{
  "version": 1,
  "timezone": "Europe/Lisbon",
  "defaultRemindersDays": [30, 14, 7, 2],
  "decisions": []
}
```

O schema deve usar `oneOf` para `date`, `range`, `recurrence` e `unknown`, `additionalProperties: false` em cada objeto e os mesmos enums do módulo.

- [ ] **Step 4: Criar CLI de validação**

```js
import { readFile } from "node:fs/promises";
import { assertValidCalendarDocument } from "./model.mjs";

const path = process.argv[2] ?? "calendar/decisions.json";
const document = JSON.parse(await readFile(path, "utf8"));
assertValidCalendarDocument(document);
console.log(`Calendário válido: ${document.decisions.length} decisões.`);
```

- [ ] **Step 5: Adicionar scripts npm**

```json
"calendar:validate": "node scripts/calendar/validate.mjs",
"test": "node --test"
```

- [ ] **Step 6: Documentar edição e exemplos**

`calendar/README.md` deve incluir exemplos completos para:

- data exata;
- intervalo;
- recorrência;
- data desconhecida;
- decisão humana;
- fonte com `checkedAt`.

Explicar que `calendar:validate` é obrigatório antes do commit e que não se guardam nomes, documentos ou outros dados pessoais.

- [ ] **Step 7: Executar validação e suite completa**

Run:

```powershell
npm run calendar:validate
npm test
git diff --check
```

Expected:

- `Calendário válido: 0 decisões.`
- todos os testes passam;
- `git diff --check` sem output.

- [ ] **Step 8: Commit e push**

```powershell
git add calendar scripts/calendar/validate.mjs package.json test/calendar/model.test.mjs
git commit -m "feat(calendar): add canonical decision schema"
git push origin main
```

---

### Task 3: Fechar #59 e desbloquear dependências

**Files:**
- No repository changes expected.

**Interfaces:**
- Consumes: `npm run calendar:validate`
- Produces: issue #59 fechada com evidência e referências para #60–#64

- [ ] **Step 1: Executar verificação fresca**

Run:

```powershell
npm run calendar:validate
npm test
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```

Expected: validação e testes passam, árvore limpa e hashes iguais.

- [ ] **Step 2: Comentar #59 com contrato, comandos e commits**

O comentário deve enumerar:

- fonte canónica;
- quatro tipos de timing;
- invariantes humanas;
- exemplos e documentação;
- contagem de testes;
- hash publicado.

- [ ] **Step 3: Fechar #59**

Run: `gh issue close 59`
