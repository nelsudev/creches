# Calendar Inventory Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preencher `calendar/decisions.json` com todas as revisões, fases humanas e decisões familiares atualmente conhecidas na issue #60.

**Architecture:** O inventário é dados versionados, não código gerador. Um teste de integração lê o documento real, aplica o validador da #59 e comprova cobertura de issues, tipos, responsáveis e dependências essenciais.

**Tech Stack:** JSON, Node.js 24, `node:test`.

## Global Constraints

- Não inventar datas: todas as entradas iniciais usam `timing.kind = "unknown"`.
- Entradas sem data usam `state = "unknown"` e `remindersDays = []`.
- Issues #19–#52 correspondem exatamente a 34 decisões humanas de revisão.
- Issues #10–#16 correspondem às fases humanas de contacto, visita e decisão.
- Issues técnicas #58–#64 não entram no calendário familiar.
- Nenhuma entrada executa automaticamente contacto, visita, candidatura, pagamento ou decisão.
- Não guardar dados pessoais da criança ou família.

---

### Task 1: Teste de cobertura do inventário

**Files:**
- Create: `test/calendar/inventory.test.mjs`
- Modify: `calendar/decisions.json`

**Interfaces:**
- Consumes: `assertValidCalendarDocument(document): void`
- Produces: inventário canónico com IDs estáveis e dependências

- [ ] **Step 1: Escrever teste falhante para as 34 revisões**

```js
test("mapeia exatamente as 34 issues de revisão", () => {
  const reviews = document.decisions.filter((item) => item.type === "review");
  assert.equal(reviews.length, 34);
  assert.deepEqual(
    reviews.map((item) => item.issueNumber).sort((a, b) => a - b),
    Array.from({ length: 34 }, (_, index) => index + 19),
  );
  assert.ok(reviews.every((item) => item.owner === "human"));
});
```

- [ ] **Step 2: Escrever teste falhante para as fases #10–#16**

```js
test("mapeia as fases humanas existentes", () => {
  const phaseIssues = document.decisions
    .map((item) => item.issueNumber)
    .filter((number) => Number.isInteger(number));
  for (let issue = 10; issue <= 16; issue += 1) {
    assert.ok(phaseIssues.includes(issue), `falta issue #${issue}`);
  }
});
```

- [ ] **Step 3: Escrever teste falhante para a cadeia final**

Exigir estes IDs e dependências:

```js
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
```

Comprovar:

- `submit-official-application` depende de `choose-three-options`;
- `save-application-number` depende de `submit-official-application`;
- `respond-to-offer` depende de `monitor-application`;
- `start-adaptation` depende de documentos e pagamentos;
- `renew-enrolment` depende de `start-adaptation`.

- [ ] **Step 4: Executar os testes e confirmar falha por inventário vazio**

Run: `node --test test/calendar/inventory.test.mjs`

Expected: FAIL com `0 !== 34`.

- [ ] **Step 5: Preencher as revisões por zona**

Adicionar 34 objetos:

- Matosinhos: issues #19–#33, IDs derivados do caminho após `fichas/matosinhos/`;
- Porto/Ramalde: issues #34–#47;
- Trofa: issues #48–#52.

Cada objeto usa:

```json
{
  "id": "review-matosinhos-aba-associacao-baptista-agape",
  "title": "Rever: ABA - Associação Baptista Ágape",
  "type": "review",
  "owner": "human",
  "timing": { "kind": "unknown" },
  "state": "unknown",
  "remindersDays": [],
  "dependsOn": [],
  "issueNumber": 19,
  "source": null,
  "notes": "Revisão dos dados pesquisados; comentar aceite ou rejeitado na issue."
}
```

- [ ] **Step 6: Adicionar as sete fases existentes**

IDs e issues:

- `contact-trofa` → #10;
- `contact-matosinhos` → #11;
- `contact-porto-ramalde` → #12;
- `visit-trofa` → #13, depende de `contact-trofa`;
- `visit-matosinhos` → #14, depende de `contact-matosinhos`;
- `visit-porto-ramalde` → #15, depende de `contact-porto-ramalde`;
- `final-shortlist` → #16, depende das três visitas.

- [ ] **Step 7: Adicionar a cadeia familiar sem issue**

Criar os dez IDs do Step 3 com `issueNumber: null`, responsável humano e dependências explícitas. `confirm-annual-closures` pode existir sem dependência para ser pesquisada em paralelo; as restantes formam a cadeia candidatura, proposta, matrícula e renovação.

- [ ] **Step 8: Executar teste focado e validador**

Run:

```powershell
node --test test/calendar/inventory.test.mjs
npm run calendar:validate
```

Expected:

- testes do inventário passam;
- `Calendário válido: 51 decisões.`

- [ ] **Step 9: Executar suite completa**

Run: `npm test`

Expected: todos os testes passam.

- [ ] **Step 10: Commit e push**

```powershell
git add calendar/decisions.json test/calendar/inventory.test.mjs
git commit -m "feat(calendar): inventory family decisions"
git push origin main
```

---

### Task 2: Verificação e fecho da #60

**Files:**
- No repository changes expected.

**Interfaces:**
- Produces: issue #60 fechada e checklist #58 atualizada

- [ ] **Step 1: Executar verificação fresca**

```powershell
npm run calendar:validate
npm test
git diff --check
git status --short --branch
git fetch origin
git rev-parse HEAD
git rev-parse origin/main
```

- [ ] **Step 2: Comentar #60**

Publicar contagens:

- 34 revisões;
- 7 fases existentes;
- 10 decisões finais;
- 51 entradas totais;
- entradas com data conhecida e desconhecida;
- testes e commit.

- [ ] **Step 3: Fechar #60 e marcar a respetiva linha na #58**

Usar um here-string Unicode escalar em `gh issue edit`; não encaminhar o corpo pelo pipe do PowerShell.
