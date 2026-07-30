import test from "node:test";
import assert from "node:assert/strict";

import {
  normalizeDecision,
  parseReviewIssue,
  validateTargetPath,
} from "../../scripts/decision/parse-issue.mjs";

const validBody = `## Revisão da creche

Comenta exatamente \`aceite\` ou \`rejeitado\`.

### target_path

\`fichas/trofa/exemplo.md\`

### ficha_markdown

\`\`\`markdown
# Creche Exemplo

- **Concelho/Freguesia:** Trofa

## Fontes consultadas

- Fonte
\`\`\`

### index_row

\`\`\`markdown
| Creche Exemplo | Trofa | ? | ? | Privado | ? | ? | Não | [ficha](fichas/trofa/exemplo.md) | |
\`\`\`
`;

test("normalizeDecision aceita apenas comandos exatos", () => {
  assert.equal(normalizeDecision(" ACEITE \n"), "aceite");
  assert.equal(normalizeDecision("ReJeItAdO"), "rejeitado");
  assert.equal(normalizeDecision("aceite porque sim"), null);
  assert.equal(normalizeDecision("não"), null);
});

test("validateTargetPath aceita apenas zonas e slugs canónicos", () => {
  assert.deepEqual(validateTargetPath("fichas/trofa/exemplo.md"), {
    zone: "trofa",
    slug: "exemplo",
  });
  assert.throws(
    () => validateTargetPath("fichas/trofa/../segredo.md"),
    /target_path inválido/,
  );
  assert.throws(
    () => validateTargetPath("README.md"),
    /target_path inválido/,
  );
  assert.throws(
    () => validateTargetPath("fichas/lisboa/exemplo.md"),
    /target_path inválido/,
  );
});

test("parseReviewIssue extrai os três campos marcados", () => {
  const parsed = parseReviewIssue(validBody);
  assert.equal(parsed.targetPath, "fichas/trofa/exemplo.md");
  assert.match(parsed.fichaMarkdown, /^# Creche Exemplo/m);
  assert.match(parsed.fichaMarkdown, /^## Fontes consultadas$/m);
  assert.match(parsed.indexRow, /\[ficha\]\(fichas\/trofa\/exemplo\.md\)/);
});

test("parseReviewIssue recusa headings ausentes ou duplicados", () => {
  assert.throws(
    () => parseReviewIssue(validBody.replace("### index_row", "### outro")),
    /index_row/,
  );
  assert.throws(
    () => parseReviewIssue(`${validBody}\n### target_path\n\n\`fichas/trofa/outro.md\``),
    /target_path.*uma vez/,
  );
});

test("parseReviewIssue recusa payload e linha de índice incoerentes", () => {
  assert.throws(
    () => parseReviewIssue(validBody.replace("## Fontes consultadas", "## Referências")),
    /Fontes consultadas/,
  );
  assert.throws(
    () => parseReviewIssue(validBody.replace(
      "[ficha](fichas/trofa/exemplo.md)",
      "[ficha](fichas/trofa/outra.md)",
    )),
    /mesmo target_path/,
  );
});
