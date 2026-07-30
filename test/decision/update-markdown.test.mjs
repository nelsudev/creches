import test from "node:test";
import assert from "node:assert/strict";

import {
  applyDecision,
  upsertDecisionState,
  upsertIndexRow,
} from "../../scripts/decision/update-markdown.mjs";

const targetPath = "fichas/trofa/exemplo.md";
const currentFicha = `# Creche Exemplo

- **Concelho/Freguesia:** Trofa

## Fontes consultadas

- Fonte antiga
`;
const proposedFicha = `# Creche Exemplo Atualizada

- **Concelho/Freguesia:** Trofa / Bougado

## Fontes consultadas

- Fonte atual
`;
const currentRow =
  "| Creche Exemplo | Trofa | ? | ? | Privado | ? | ? | Não | [ficha](fichas/trofa/exemplo.md) | Nota original |";
const proposedRow =
  "| Creche Exemplo Atualizada | Bougado | ? | Creche Feliz | Rede Solidária | Sim | 0–3 | Não | [ficha](fichas/trofa/exemplo.md) | Nota proposta |";
const currentIndex = `# Índice

## Trofa

| Nome | Localização | Preço | Protocolos | Tipo | Berçário | Idade | Visitámos | Ficha | Notas |
|---|---|---|---|---|---|---|---|---|---|
${currentRow}
`;

test("upsertDecisionState substitui estado anterior sem o duplicar", () => {
  const once = upsertDecisionState(
    currentFicha,
    "**Estado da decisão:** Aceite (2026-07-30, issue #42)",
  );
  const twice = upsertDecisionState(
    once,
    "**Estado da decisão:** Rejeitado (2026-07-31, issue #42)",
  );
  assert.equal((twice.match(/\*\*Estado da decisão:\*\*/g) ?? []).length, 1);
  assert.match(twice, /Rejeitado \(2026-07-31, issue #42\)/);
  assert.ok(twice.indexOf("Estado da decisão") < twice.indexOf("## Fontes consultadas"));
});

test("upsertIndexRow aceita a proposta e preserva as notas existentes", () => {
  const result = upsertIndexRow(
    currentIndex,
    targetPath,
    proposedRow,
    "Aceite em 2026-07-30",
  );
  assert.match(result, /Creche Exemplo Atualizada/);
  assert.match(result, /Nota original/);
  assert.match(result, /Nota proposta/);
  assert.equal((result.match(/Aceite em 2026-07-30/g) ?? []).length, 1);
});

test("applyDecision aceite escreve a proposta e o estado", () => {
  const result = applyDecision({
    decision: "aceite",
    issueNumber: 42,
    date: "2026-07-30",
    targetPath,
    fichaMarkdown: proposedFicha,
    indexRow: proposedRow,
    currentFicha,
    currentIndex,
  });
  assert.match(result.ficha, /^# Creche Exemplo Atualizada/m);
  assert.match(
    result.ficha,
    /\*\*Estado da decisão:\*\* Aceite \(2026-07-30, issue #42\)/,
  );
  assert.match(result.index, /Aceite em 2026-07-30/);
});

test("applyDecision rejeitado preserva os dados atuais", () => {
  const result = applyDecision({
    decision: "rejeitado",
    issueNumber: 43,
    date: "2026-07-30",
    targetPath,
    fichaMarkdown: proposedFicha,
    indexRow: proposedRow,
    currentFicha,
    currentIndex,
  });
  assert.match(result.ficha, /^# Creche Exemplo$/m);
  assert.doesNotMatch(result.ficha, /Atualizada/);
  assert.match(
    result.ficha,
    /\*\*Estado da decisão:\*\* Rejeitado \(2026-07-30, issue #43\)/,
  );
  assert.doesNotMatch(result.index, /Creche Exemplo Atualizada/);
  assert.match(result.index, /Nota original; Rejeitado em 2026-07-30/);
});
