import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { processDecision } from "../../scripts/decision/process.mjs";

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
const indexRow =
  "| Creche Exemplo | Trofa | ? | ? | Privado | ? | ? | Não | [ficha](fichas/trofa/exemplo.md) | Nota |";
const proposedRow =
  "| Creche Exemplo Atualizada | Bougado | ? | Creche Feliz | Rede Solidária | Sim | 0–3 | Não | [ficha](fichas/trofa/exemplo.md) | Nota |";

function issueBody() {
  return `## Revisão da creche

### target_path

\`${targetPath}\`

### ficha_markdown

\`\`\`markdown
${proposedFicha.trimEnd()}
\`\`\`

### index_row

\`\`\`markdown
${proposedRow}
\`\`\`
`;
}

async function fixture() {
  const rootDir = await mkdtemp(path.join(os.tmpdir(), "creches-decision-"));
  await mkdir(path.join(rootDir, "fichas", "trofa"), { recursive: true });
  await writeFile(path.join(rootDir, ...targetPath.split("/")), currentFicha);
  await writeFile(
    path.join(rootDir, "creches.md"),
    `# Índice\n\n## Trofa\n\n${indexRow}\n`,
  );
  return rootDir;
}

test("processDecision escreve uma aceitação validada", async () => {
  const rootDir = await fixture();
  const result = await processDecision({
    issue: { number: 42, body: issueBody(), labels: [] },
    decision: "aceite",
    date: "2026-07-30",
    rootDir,
  });
  assert.deepEqual(result, {
    ok: true,
    slug: "exemplo",
    decision: "aceite",
    commitMessage: "feat(decision): accept exemplo (#42)",
  });
  const ficha = await readFile(path.join(rootDir, ...targetPath.split("/")), "utf8");
  const index = await readFile(path.join(rootDir, "creches.md"), "utf8");
  assert.match(ficha, /^# Creche Exemplo Atualizada/m);
  assert.match(ficha, /Aceite \(2026-07-30, issue #42\)/);
  assert.match(index, /Aceite em 2026-07-30/);
});

test("processDecision não altera uma issue já terminal", async () => {
  const rootDir = await fixture();
  await assert.rejects(
    processDecision({
      issue: {
        number: 42,
        body: issueBody(),
        labels: [{ name: "decisao:rejeitado" }],
      },
      decision: "aceite",
      date: "2026-07-30",
      rootDir,
    }),
    /já tem decisão terminal/,
  );
  assert.equal(
    await readFile(path.join(rootDir, ...targetPath.split("/")), "utf8"),
    currentFicha,
  );
});

test("processDecision não escreve fora da raiz permitida", async () => {
  const rootDir = await fixture();
  await assert.rejects(
    processDecision({
      issue: {
        number: 42,
        body: issueBody().replace(targetPath, "fichas/trofa/../fora.md"),
        labels: [],
      },
      decision: "aceite",
      date: "2026-07-30",
      rootDir,
    }),
    /target_path inválido/,
  );
});
