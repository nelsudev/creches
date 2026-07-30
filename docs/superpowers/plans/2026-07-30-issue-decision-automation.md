# Issue Decision Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Criar uma issue de revisão por ficha de creche e automatizar decisões `aceite`/`rejeitado` que atualizam o Markdown do repositório.

**Architecture:** Módulos ECMAScript independentes tratam parsing, validação, atualização de ficheiros e geração de issues. GitHub Actions chama esses módulos com permissões mínimas; um comando local idempotente cria as labels e as 34 issues atuais usando `gh`.

**Tech Stack:** Node.js 20, módulos ECMAScript, `node:test`, GitHub Actions, GitHub CLI.

## Global Constraints

- Issues `fase:contactar`, `fase:visitar` e `fase:decidir` continuam reservadas a humanos.
- Só comentários exatamente iguais a `aceite` ou `rejeitado`, ignorando maiúsculas e espaços exteriores, acionam decisões.
- Só `OWNER`, `MEMBER` ou `COLLABORATOR` podem decidir.
- O destino tem de corresponder a `fichas/(trofa|matosinhos|porto-ramalde)/<slug>.md`.
- A criação usa o caminho canónico como chave estável e nunca duplica uma issue existente.
- Uma issue já terminal não pode originar outro commit.
- A execução usa apenas módulos nativos do Node.js e `gh`; não acrescenta dependências de produção.

---

### Task 1: Parser e validação do corpo da issue

**Files:**
- Create: `scripts/decision/parse-issue.mjs`
- Create: `test/decision/parse-issue.test.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `normalizeDecision(value): "aceite" | "rejeitado" | null`
- Produces: `parseReviewIssue(body): { targetPath, fichaMarkdown, indexRow }`
- Produces: `validateTargetPath(targetPath): { zone, slug }`

- [ ] **Step 1: Escrever testes que cubram comando, campos válidos, campos ausentes/duplicados e caminhos inseguros**

```js
import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeDecision,
  parseReviewIssue,
  validateTargetPath,
} from "../../scripts/decision/parse-issue.mjs";

test("normaliza apenas decisões exatas", () => {
  assert.equal(normalizeDecision(" ACEITE \n"), "aceite");
  assert.equal(normalizeDecision("rejeitado"), "rejeitado");
  assert.equal(normalizeDecision("aceite porque sim"), null);
});

test("recusa travessia de diretórios", () => {
  assert.throws(
    () => validateTargetPath("fichas/trofa/../segredo.md"),
    /target_path inválido/,
  );
});
```

- [ ] **Step 2: Executar `node --test test/decision/parse-issue.test.mjs` e confirmar que falha por módulo inexistente**

- [ ] **Step 3: Implementar extração determinística destes marcadores**

````markdown
### target_path

`fichas/trofa/exemplo.md`

### ficha_markdown

```markdown
# Exemplo
...
```

### index_row

```markdown
| Exemplo | ... | [ficha](fichas/trofa/exemplo.md) | ... |
```
````

O parser deve exigir uma ocorrência de cada heading, um único caminho inline e um único bloco cercado para cada payload.

- [ ] **Step 4: Validar título da ficha, heading `## Fontes consultadas`, metadados não vazios e correspondência do link da linha com `target_path`**

- [ ] **Step 5: Adicionar scripts a `package.json`**

```json
{
  "scripts": {
    "prepare": "husky",
    "test": "node --test",
    "decision:dry-run": "node scripts/decision/create-review-issues.mjs --dry-run"
  }
}
```

- [ ] **Step 6: Executar `npm test` e confirmar todos os testes verdes**

- [ ] **Step 7: Commit**

```powershell
git add package.json scripts/decision/parse-issue.mjs test/decision/parse-issue.test.mjs
git commit -m "feat(decision): validate review issue payloads"
git push origin main
```

### Task 2: Atualização idempotente das fichas e do índice

**Files:**
- Create: `scripts/decision/update-markdown.mjs`
- Create: `test/decision/update-markdown.test.mjs`

**Interfaces:**
- Consumes: `validateTargetPath(targetPath)`
- Produces: `applyDecision({ decision, issueNumber, date, targetPath, fichaMarkdown, indexRow, currentFicha, currentIndex }): { ficha, index }`
- Produces: `upsertDecisionState(markdown, stateLine): string`
- Produces: `upsertIndexRow(indexMarkdown, targetPath, proposedRow, decisionNote): string`

- [ ] **Step 1: Escrever testes de aceitação que confirmem substituição da ficha proposta, linha de estado e nota de índice**

```js
const result = applyDecision({
  decision: "aceite",
  issueNumber: 42,
  date: "2026-07-30",
  targetPath: "fichas/trofa/exemplo.md",
  fichaMarkdown: validFicha,
  indexRow: validRow,
  currentFicha: oldFicha,
  currentIndex: index,
});
assert.match(result.ficha, /\*\*Estado da decisão:\*\* Aceite \(2026-07-30, issue #42\)/);
assert.match(result.index, /Aceite em 2026-07-30/);
```

- [ ] **Step 2: Escrever testes de rejeição, preservação dos dados atuais, notas existentes e repetição sem duplicados**

- [ ] **Step 3: Executar `node --test test/decision/update-markdown.test.mjs` e confirmar falha esperada**

- [ ] **Step 4: Implementar atualização de estado antes de `## Fontes consultadas` e substituição exata da linha cujo link aponta para `targetPath`**

- [ ] **Step 5: Fazer `rejeitado` ignorar os restantes campos da proposta e alterar apenas estado e nota**

- [ ] **Step 6: Executar `npm test` e confirmar parser e atualização verdes**

- [ ] **Step 7: Commit**

```powershell
git add scripts/decision/update-markdown.mjs test/decision/update-markdown.test.mjs
git commit -m "feat(decision): apply review decisions to markdown"
git push origin main
```

### Task 3: Gerador idempotente e Issue Form

**Files:**
- Create: `.github/ISSUE_TEMPLATE/revisao-creche.yml`
- Create: `scripts/decision/create-review-issues.mjs`
- Create: `test/decision/create-review-issues.test.mjs`

**Interfaces:**
- Consumes: `parseReviewIssue(body)` e `validateTargetPath(targetPath)`
- Produces: `readCanonicalEntries({ rootDir }): Promise<Array<{ name, zone, targetPath, fichaMarkdown, indexRow }>>`
- Produces: `renderReviewIssue(entry): { title, body, labels }`
- CLI: `node scripts/decision/create-review-issues.mjs [--dry-run] [--limit N]`

- [ ] **Step 1: Escrever teste que carrega o repositório e exige 34 caminhos únicos e exatamente uma linha de índice por ficha**

```js
test("descobre as 34 fichas canónicas sem duplicados", async () => {
  const entries = await readCanonicalEntries({ rootDir: process.cwd() });
  assert.equal(entries.length, 34);
  assert.equal(new Set(entries.map((entry) => entry.targetPath)).size, 34);
});
```

- [ ] **Step 2: Escrever testes para título, headings, blocos Markdown, label de zona e `decisao:pendente`**

- [ ] **Step 3: Executar os testes e confirmar falha esperada**

- [ ] **Step 4: Implementar leitura das três pastas canónicas e associação pelo link existente em `creches.md`**

- [ ] **Step 5: Implementar corpo legível e machine-readable**

````markdown
## Revisão da creche

Revê os dados abaixo e comenta exatamente `aceite` ou `rejeitado`.

### target_path

`fichas/trofa/exemplo.md`

### ficha_markdown

```markdown
# Exemplo
```

### index_row

```markdown
| Exemplo | ... |
```
````

- [ ] **Step 6: Implementar pesquisa de issues abertas e fechadas por `target_path`, criando apenas quando a chave ainda não existe**

- [ ] **Step 7: Criar labels em falta com cores estáveis**

```js
const LABELS = {
  "decisao:pendente": ["FBCA04", "A aguardar revisão humana"],
  "decisao:aceite": ["0E8A16", "Dados aceites e escritos no repositório"],
  "decisao:rejeitado": ["D93F0B", "Dados rejeitados e assinalados no repositório"],
  "decisao:erro": ["B60205", "A decisão não pôde ser processada"],
  "zona:trofa": ["1D76DB", "Creche da Trofa"],
  "zona:matosinhos": ["5319E7", "Creche de Matosinhos"],
  "zona:porto-ramalde": ["0052CC", "Creche de Porto/Ramalde"],
};
```

- [ ] **Step 8: Criar Issue Form com os mesmos headings e label automática `decisao:pendente`**

- [ ] **Step 9: Executar `npm test` e `npm run decision:dry-run`; exigir `34 fichas`, `34 caminhos seguros`, `34 linhas de índice`**

- [ ] **Step 10: Commit**

```powershell
git add .github/ISSUE_TEMPLATE/revisao-creche.yml scripts/decision/create-review-issues.mjs test/decision/create-review-issues.test.mjs
git commit -m "feat(decision): generate creche review issues"
git push origin main
```

### Task 4: Processador e workflows de GitHub Actions

**Files:**
- Create: `scripts/decision/process.mjs`
- Create: `test/decision/process.test.mjs`
- Create: `.github/workflows/decision.yml`
- Create: `.github/workflows/validate-review-issue.yml`

**Interfaces:**
- Consumes: `normalizeDecision`, `parseReviewIssue`, `applyDecision`
- CLI: `node scripts/decision/process.mjs --issue N --decision aceite|rejeitado`
- Produces no stdout exceto JSON `{ ok, slug, decision, commitMessage }`; erros saem em stderr e terminam com código não zero.

- [ ] **Step 1: Escrever testes com filesystem temporário para sucesso, decisão terminal repetida, path inseguro e ficha alheia**

- [ ] **Step 2: Executar o teste e confirmar falha esperada**

- [ ] **Step 3: Implementar orquestração com payload da issue fornecido por `gh issue view`, escrita atómica e mensagens estruturadas**

- [ ] **Step 4: Implementar `.github/workflows/decision.yml` com filtro de comentário exato, associação autorizada, permissões `contents: write`/`issues: write` e concorrência única**

```yaml
concurrency:
  group: creche-decision-writes
  cancel-in-progress: false
```

- [ ] **Step 5: No sucesso, fazer rebase de `origin/main`, commit convencional, push, troca de labels, comentário com SHA e fecho da issue**

- [ ] **Step 6: No erro, aplicar `decisao:erro`, remover `decisao:pendente`, comentar a causa e manter a issue aberta**

- [ ] **Step 7: Implementar validação ao abrir/editar uma issue de revisão, repondo `decisao:pendente` quando a correção fica válida**

- [ ] **Step 8: Executar `npm test` e analisar YAML com Ruby/Python disponível ou carregamento textual explícito de eventos, permissões e concorrência**

- [ ] **Step 9: Commit**

```powershell
git add scripts/decision/process.mjs test/decision/process.test.mjs .github/workflows/decision.yml .github/workflows/validate-review-issue.yml
git commit -m "feat(decision): automate accepted and rejected reviews"
git push origin main
```

### Task 5: Rollout das 34 issues

**Files:**
- Modify only if verification reveals defects in files from Tasks 1–4.

**Interfaces:**
- Consumes: `node scripts/decision/create-review-issues.mjs`

- [ ] **Step 1: Executar `npm test` e guardar a contagem de testes aprovados**

- [ ] **Step 2: Executar `npm run decision:dry-run` e confirmar as 34 fichas**

- [ ] **Step 3: Publicar uma issue piloto com `--limit 1`, verificar headings, labels e legibilidade no GitHub**

- [ ] **Step 4: Executar novamente o dry-run e confirmar que o piloto é detetado como existente**

- [ ] **Step 5: Criar as restantes issues com `node scripts/decision/create-review-issues.mjs`**

- [ ] **Step 6: Consultar todas as issues e confirmar 34 chaves `target_path` únicas e 34 labels `decisao:pendente`**

- [ ] **Step 7: Confirmar que nenhuma issue criada recebeu `fase:contactar`**

- [ ] **Step 8: Executar `git status --short`, `git log -1 --oneline` e `git rev-parse origin/main`; exigir árvore limpa e ramo publicado**
