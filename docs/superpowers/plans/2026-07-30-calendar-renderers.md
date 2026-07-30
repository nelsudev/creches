# Calendar Renderers Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Gerar `calendario.md` e `calendario.ics` deterministicamente a partir de `calendar/decisions.json`, conforme a issue #62.

**Architecture:** `scripts/calendar/render.mjs` contém funções puras para Markdown e iCalendar. `scripts/calendar/generate.mjs` valida a fonte, chama os renderizadores e escreve os dois artefactos; entradas sem data são mostradas no Markdown e excluídas do ICS.

**Tech Stack:** Node.js 24, JavaScript ESM, Markdown, iCalendar RFC 5545, `node:test`.

## Global Constraints

- Sem relógio atual, UUID aleatório ou ordenação dependente do sistema.
- Fuso do calendário: `Europe/Lisbon`.
- IDs produzem UIDs estáveis `<id>@creches.nelsudev`.
- Eventos são de dia inteiro; `DTEND` é exclusivo.
- Intervalos incluem o último dia publicado, somando um dia ao `DTEND`.
- Recorrências preservam a RRULE validada.
- Datas desconhecidas não entram no ICS.
- Texto ICS escapa barra, vírgula, ponto e vírgula e linhas novas.
- Linhas ICS usam CRLF.

---

### Task 1: Renderizadores puros

**Files:**
- Create: `scripts/calendar/render.mjs`
- Create: `test/calendar/render.test.mjs`

**Interfaces:**
- Produces: `renderCalendarMarkdown(document): string`
- Produces: `renderCalendarIcs(document): string`

- [ ] **Step 1: Escrever teste falhante do Markdown**

Usar uma fixture literal com:

- uma data exata `2026-09-01`;
- um intervalo `2027-01-01` a `2027-04-30`;
- uma recorrência anual;
- uma entrada desconhecida;
- uma entrada concluída.

Exigir resumo, secções `Datas planeadas`, `Recorrências`, `Sem data confirmada` e `Concluídas ou canceladas`, issue e dependências.

- [ ] **Step 2: Confirmar RED**

Run: `node --test test/calendar/render.test.mjs`

Expected: FAIL com `ERR_MODULE_NOT_FOUND`.

- [ ] **Step 3: Implementar Markdown mínimo e ordenação estável**

Ordenar por:

1. grupo;
2. data inicial;
3. `id`.

Mostrar `?` apenas na secção sem data e usar links `[#59](https://github.com/nelsudev/creches/issues/59)` para issues.

- [ ] **Step 4: Escrever teste falhante do ICS**

Exigir literalmente:

```text
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//nelsudev//Creches decision calendar//PT
CALSCALE:GREGORIAN
X-WR-TIMEZONE:Europe/Lisbon
```

E comprovar:

- UID estável;
- `DTSTART;VALUE=DATE:20260901`;
- `DTEND;VALUE=DATE:20260902`;
- intervalo termina em `20270501`;
- RRULE preservada;
- entrada desconhecida ausente;
- lembrete `TRIGGER:-P7D`;
- CRLF e escapes.

- [ ] **Step 5: Implementar ICS**

Cada evento conhecido contém `UID`, `DTSTAMP` determinístico derivado da data inicial, `DTSTART`, `SUMMARY`, `DESCRIPTION`, `STATUS` e alarmes. Datas e intervalos contêm `DTEND`; recorrências contêm `RRULE`.

- [ ] **Step 6: Executar teste focado**

Run: `node --test test/calendar/render.test.mjs`

Expected: todos os testes passam.

- [ ] **Step 7: Commit e push**

```powershell
git add scripts/calendar/render.mjs test/calendar/render.test.mjs
git commit -m "feat(calendar): render Markdown and ICS"
git push origin main
```

---

### Task 2: CLI e artefactos

**Files:**
- Create: `scripts/calendar/generate.mjs`
- Create: `calendario.md`
- Create: `calendario.ics`
- Modify: `package.json`
- Modify: `test/calendar/render.test.mjs`

**Interfaces:**
- Consumes: `renderCalendarMarkdown(document)` e `renderCalendarIcs(document)`
- Produces: `npm run calendar:generate`

- [ ] **Step 1: Escrever teste falhante do CLI**

Executar o CLI com um diretório temporário e exigir os dois ficheiros com conteúdo igual às funções puras. O CLI aceita:

```text
node scripts/calendar/generate.mjs [source] [output-directory]
```

- [ ] **Step 2: Confirmar RED por CLI inexistente**

Run: `node --test test/calendar/render.test.mjs`

- [ ] **Step 3: Implementar CLI, script npm e geração**

Adicionar:

```json
"calendar:generate": "node scripts/calendar/generate.mjs"
```

O CLI valida antes de escrever e usa UTF-8.

- [ ] **Step 4: Gerar artefactos canónicos**

Run: `npm run calendar:generate`

Expected:

- `calendario.md` enumera 51 entradas sem data;
- `calendario.ics` é um VCALENDAR válido sem VEVENT.

- [ ] **Step 5: Verificar determinismo**

Executar duas vezes e exigir `git diff --exit-code -- calendario.md calendario.ics` depois da primeira geração.

- [ ] **Step 6: Suite completa, commit e push**

```powershell
npm run calendar:validate
npm run calendar:generate
npm test
git diff --check
git add scripts/calendar/generate.mjs package.json calendario.md calendario.ics test/calendar/render.test.mjs
git commit -m "feat(calendar): generate calendar artifacts"
git push origin main
```

---

### Task 3: Fechar #62

- [ ] **Step 1:** Repetir validação, geração, testes e comparação com `origin/main`.
- [ ] **Step 2:** Comentar #62 com eventos conhecidos/desconhecidos, testes e commits.
- [ ] **Step 3:** Fechar #62 e atualizar #58 usando here-string Unicode escalar.
