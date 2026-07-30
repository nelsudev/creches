# Research Criteria Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Atualizar critérios e candidatura Creche Feliz, sincronizar propostas pendentes e executar a pesquisa documental das issues #54 e #55.

**Architecture:** A documentação distingue obrigação, boa prática e experiência comunitária, sempre com canal de verificação. O gerador de issues ganha sincronização opt-in e testável, enquanto as fichas continuam a ser a fonte canónica.

**Tech Stack:** Markdown, Node.js 24, `node:test`, GitHub CLI, GitHub Issues.

## Global Constraints

- Issues `fase:contactar`, `fase:visitar` e `fase:decidir` continuam exclusivamente humanas.
- Ausência de publicação mantém `?`; nunca prova incumprimento.
- A sincronização só altera o corpo de issues abertas com `decisao:pendente`.
- Issues terminais, fechadas, duplicadas ou malformadas são recusadas.
- A pesquisa usa fontes oficiais primeiro e marca opiniões comunitárias como opiniões.
- A criação normal de issues permanece create-only; sincronização exige `--sync`.

---

### Task 1: Critérios, template e guião

**Files:**
- Create: `test/docs/research-guidance.test.mjs`
- Modify: `docs/criterios-pesquisa.md`
- Modify: `templates/ficha-creche.md`
- Modify: `templates/guiao-telefone.md`

**Interfaces:**
- Produces: guia com tipo de critério e canal `documento`, `contacto humano` ou `visita humana`.
- Produces: ficha compacta com secções `Conformidade e transparência` e `Acolhimento, saúde e comunicação`.

- [ ] **Step 1: Escrever teste documental**

```js
test("guia distingue evidência, contacto e visita", async () => {
  const guide = await readFile("docs/criterios-pesquisa.md", "utf8");
  for (const term of [
    "Obrigação legal/documental",
    "Boa prática",
    "Experiência comunitária",
    "Documento/web",
    "Contacto humano",
    "Visita humana",
  ]) assert.match(guide, new RegExp(term, "i"));
});
```

- [ ] **Step 2: Executar `node --test test/docs/research-guidance.test.mjs` e confirmar falha por termos ausentes**

- [ ] **Step 3: Atualizar o guia com matriz de conformidade, equipa, adaptação, saúde, sono, alimentação, segurança, comunicação e logística**

- [ ] **Step 4: Expandir o template sem alterar automaticamente as 34 fichas**

- [ ] **Step 5: Reorganizar o guião para conter só perguntas que beneficiam de resposta humana**

- [ ] **Step 6: Executar `npm test`**

- [ ] **Step 7: Commit e push**

```powershell
git add docs/criterios-pesquisa.md templates/ficha-creche.md templates/guiao-telefone.md test/docs/research-guidance.test.mjs
git commit -m "docs(research): expand creche evaluation criteria"
git push origin main
```

### Task 2: Processo Creche Feliz 2026

**Files:**
- Modify: `test/docs/research-guidance.test.mjs`
- Modify: `README.md`
- Modify: `creches.md`
- Modify: `templates/guiao-telefone.md`

**Interfaces:**
- Produces: instruções oficiais com Segurança Social Direta, máximo de três estabelecimentos e separação de estados.

- [ ] **Step 1: Adicionar teste que exige terminologia atual e recusa referências operacionais à aplicação antiga**

```js
test("documenta a candidatura Creche Feliz atual", async () => {
  const readme = await readFile("README.md", "utf8");
  assert.match(readme, /Segurança Social Direta/);
  assert.match(readme, /máximo de três estabelecimentos/i);
  assert.match(readme, /candidatura.*lista de espera.*vaga atribuída/is);
  assert.doesNotMatch(readme, /app Creche Feliz/i);
});
```

- [ ] **Step 2: Executar o teste e confirmar falha pela referência antiga**

- [ ] **Step 3: Substituir fontes secundárias e referências obsoletas pelas FAQ oficiais da Segurança Social**

- [ ] **Step 4: Corrigir a nota AMDS e o guião, distinguindo portal autenticado de confirmação direta**

- [ ] **Step 5: Executar `npm test` e `rg -n -i "app Creche Feliz|aplicação Creche Feliz" README.md creches.md templates fichas`**

- [ ] **Step 6: Commit e push**

```powershell
git add README.md creches.md templates/guiao-telefone.md test/docs/research-guidance.test.mjs
git commit -m "docs(creche-feliz): update 2026 candidature process"
git push origin main
```

### Task 3: Sincronização segura das review issues

**Files:**
- Modify: `scripts/decision/create-review-issues.mjs`
- Modify: `test/decision/create-review-issues.test.mjs`

**Interfaces:**
- Produces: `planIssueSync(entries, issues): { updates, unchanged, refused }`
- CLI: `node scripts/decision/create-review-issues.mjs --sync [--dry-run]`

- [ ] **Step 1: Escrever testes para issue pendente alterada, no-op idêntico, terminal e fechada**

```js
const plan = planIssueSync([entry], [{
  number: 19,
  state: "OPEN",
  body: "antigo",
  labels: [{ name: "decisao:pendente" }],
}]);
assert.equal(plan.updates.length, 1);
```

- [ ] **Step 2: Executar o teste e confirmar falha porque `planIssueSync` não existe**

- [ ] **Step 3: Implementar planeamento puro, exigindo exatamente uma issue por `target_path`**

- [ ] **Step 4: Implementar PATCH apenas do campo `body` via GitHub API**

- [ ] **Step 5: Implementar `--dry-run --sync` com contagens `would update`, `unchanged` e `refused`**

- [ ] **Step 6: Executar `npm test` e dry-run; exigir 34 issues sem recusas**

- [ ] **Step 7: Commit e push**

```powershell
git add scripts/decision/create-review-issues.mjs test/decision/create-review-issues.test.mjs
git commit -m "feat(decision): sync pending review proposals"
git push origin main
```

### Task 4: Pesquisa de identidade e fontes (#54)

**Files:**
- Modify: `fichas/<zona>/*.md` apenas quando uma fonte primária acrescenta ou corrige dados.
- Modify: `creches.md` em conjunto com cada ficha.

**Interfaces:**
- Consumes: hierarquia de fontes de `docs/criterios-pesquisa.md`.

- [ ] **Step 1: Gerar lista verificável das 11 moradas desconhecidas e 17 fichas com fontes secundárias**

- [ ] **Step 2: Pesquisar por zona em Carta Social, municípios, Segurança Social e sites institucionais**

- [ ] **Step 3: Atualizar Trofa, executar validação ficha/índice, commit e push**

- [ ] **Step 4: Atualizar Matosinhos, executar validação ficha/índice, commit e push**

- [ ] **Step 5: Atualizar Porto/Ramalde, executar validação ficha/índice, commit e push**

- [ ] **Step 6: Publicar comentário em #54 com confirmado/não encontrado/contacto humano**

### Task 5: Pesquisa operacional pública (#55)

**Files:**
- Modify: `fichas/<zona>/*.md` quando berçário, horário, capacidade ou protocolo tiver confirmação pública.
- Modify: `creches.md` com os mesmos valores.

**Interfaces:**
- Consumes: 27 berçários, 23 horários, 22 capacidades e 8 protocolos como baseline.

- [ ] **Step 1: Distinguir em cada fonte capacidade licenciada, ocupação histórica e vaga atual**

- [ ] **Step 2: Atualizar apenas valores publicamente confirmados, mantendo `?` nos restantes**

- [ ] **Step 3: Rever explicitamente os dados de 2018 do Sininho**

- [ ] **Step 4: Executar testes e auditoria antes/depois por campo**

- [ ] **Step 5: Commit e push por zona**

- [ ] **Step 6: Publicar resumo em #55 e remeter lacunas humanas para #10–#12**

### Task 6: Sincronizar, verificar e fechar

**Files:**
- No repository changes expected beyond fixes revealed by verification.

**Interfaces:**
- Consumes: `node scripts/decision/create-review-issues.mjs --sync`.

- [ ] **Step 1: Executar `npm test` e `git diff --check`**

- [ ] **Step 2: Executar `npm run decision:dry-run` e exigir 34 caminhos únicos**

- [ ] **Step 3: Executar `node scripts/decision/create-review-issues.mjs --sync --dry-run`**

- [ ] **Step 4: Sincronizar e repetir dry-run até obter zero updates**

- [ ] **Step 5: Verificar que nenhuma review issue tem `fase:contactar` ou decisão terminal alterada**

- [ ] **Step 6: Comentar e fechar #53, #54, #55 e #56 apenas se os respetivos critérios de aceitação estiverem cumpridos**

- [ ] **Step 7: Confirmar árvore limpa e `HEAD == origin/main`**
