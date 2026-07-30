const TARGET_PATTERN =
  /^fichas\/(trofa|matosinhos|porto-ramalde)\/([a-z0-9]+(?:-[a-z0-9]+)*)\.md$/;

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSection(body, heading) {
  const headingPattern = new RegExp(
    `^### ${escapeRegExp(heading)}\\s*$`,
    "gm",
  );
  const matches = [...body.matchAll(headingPattern)];
  if (matches.length !== 1) {
    throw new Error(`${heading} deve aparecer exatamente uma vez`);
  }

  const start = matches[0].index + matches[0][0].length;
  const rest = body.slice(start);
  const nextHeading = rest.search(/^###\s+/m);
  return (nextHeading === -1 ? rest : rest.slice(0, nextHeading)).trim();
}

function parseFencedMarkdown(section, fieldName) {
  const match = section.match(/^```markdown\r?\n([\s\S]*?)\r?\n```$/);
  if (!match) {
    throw new Error(`${fieldName} deve conter um único bloco \`\`\`markdown`);
  }
  return `${match[1].trimEnd()}\n`;
}

export function normalizeDecision(value) {
  const normalized = String(value ?? "").trim().toLocaleLowerCase("pt-PT");
  return normalized === "aceite" || normalized === "rejeitado"
    ? normalized
    : null;
}

export function validateTargetPath(targetPath) {
  const match = String(targetPath ?? "").match(TARGET_PATTERN);
  if (!match) {
    throw new Error("target_path inválido");
  }
  return { zone: match[1], slug: match[2] };
}

export function parseReviewIssue(body) {
  if (typeof body !== "string") {
    throw new Error("corpo da issue inválido");
  }

  const targetSection = extractSection(body, "target_path");
  const targetMatch = targetSection.match(/^`([^`\r\n]+)`$/);
  if (!targetMatch) {
    throw new Error("target_path deve ser um único caminho entre backticks");
  }

  const targetPath = targetMatch[1];
  validateTargetPath(targetPath);

  const fichaMarkdown = parseFencedMarkdown(
    extractSection(body, "ficha_markdown"),
    "ficha_markdown",
  );
  const indexRow = parseFencedMarkdown(
    extractSection(body, "index_row"),
    "index_row",
  ).trim();

  if (!/^# [^\r\n]+$/m.test(fichaMarkdown)) {
    throw new Error("ficha_markdown deve ter um título");
  }
  if (!/^## Fontes consultadas\s*$/m.test(fichaMarkdown)) {
    throw new Error("ficha_markdown deve ter a secção Fontes consultadas");
  }
  if (!indexRow.startsWith("|") || !indexRow.endsWith("|")) {
    throw new Error("index_row deve ser uma linha de tabela Markdown");
  }
  if (!indexRow.includes(`[ficha](${targetPath})`)) {
    throw new Error("index_row deve apontar para o mesmo target_path");
  }

  return { targetPath, fichaMarkdown, indexRow };
}
