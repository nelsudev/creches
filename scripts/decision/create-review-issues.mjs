import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseReviewIssue, validateTargetPath } from "./parse-issue.mjs";

export const LABELS = {
  "decisao:pendente": ["FBCA04", "A aguardar revisão humana"],
  "decisao:aceite": ["0E8A16", "Dados aceites e escritos no repositório"],
  "decisao:rejeitado": ["D93F0B", "Dados rejeitados e assinalados no repositório"],
  "decisao:erro": ["B60205", "A decisão não pôde ser processada"],
  "zona:trofa": ["1D76DB", "Creche da Trofa"],
  "zona:matosinhos": ["5319E7", "Creche de Matosinhos"],
  "zona:porto-ramalde": ["0052CC", "Creche de Porto/Ramalde"],
};

const ZONES = ["trofa", "matosinhos", "porto-ramalde"];

function normalizePath(value) {
  return value.replaceAll("\\", "/");
}

function parseIndexRows(indexMarkdown) {
  const rows = new Map();
  for (const line of indexMarkdown.split(/\r?\n/)) {
    if (!line.trimStart().startsWith("|")) continue;
    const link = line.match(/\[ficha\]\((fichas\/[^)]+\.md)\)/);
    if (!link) continue;
    const targetPath = link[1];
    if (rows.has(targetPath)) {
      throw new Error(`linha de índice duplicada: ${targetPath}`);
    }
    const name = line.slice(1, line.indexOf("|", 1)).trim();
    rows.set(targetPath, { name, indexRow: line.trim() });
  }
  return rows;
}

export async function readCanonicalEntries({ rootDir }) {
  const indexMarkdown = await readFile(path.join(rootDir, "creches.md"), "utf8");
  const indexRows = parseIndexRows(indexMarkdown);
  const filePaths = [];

  for (const zone of ZONES) {
    const zoneDir = path.join(rootDir, "fichas", zone);
    for (const fileName of await readdir(zoneDir)) {
      if (fileName.endsWith(".md")) {
        filePaths.push(`fichas/${zone}/${fileName}`);
      }
    }
  }

  filePaths.sort((left, right) => left.localeCompare(right, "pt"));
  if (filePaths.length !== indexRows.size) {
    throw new Error(
      `fichas e índice não coincidem: ${filePaths.length} ficheiros, ${indexRows.size} linhas`,
    );
  }

  const entries = [];
  for (const targetPath of filePaths) {
    const { zone } = validateTargetPath(targetPath);
    const indexed = indexRows.get(targetPath);
    if (!indexed) {
      throw new Error(`ficha sem linha no índice: ${targetPath}`);
    }
    const absolutePath = path.resolve(rootDir, ...targetPath.split("/"));
    if (!existsSync(absolutePath)) {
      throw new Error(`ficheiro inexistente: ${targetPath}`);
    }
    const fichaMarkdown = await readFile(absolutePath, "utf8");
    entries.push({
      name: indexed.name,
      zone,
      targetPath,
      fichaMarkdown: `${fichaMarkdown.trimEnd()}\n`,
      indexRow: indexed.indexRow,
    });
  }
  return entries;
}

export function renderReviewIssue(entry) {
  validateTargetPath(entry.targetPath);
  const body = `## Revisão da creche

Revê os dados pesquisados desta instituição e comenta exatamente \`aceite\` ou \`rejeitado\`.

- \`aceite\`: escreve os dados propostos no repositório.
- \`rejeitado\`: preserva a pesquisa e assinala a rejeição.

> Esta é uma revisão de dados. Não substitui contactos, visitas ou decisões humanas das fases reservadas.

### target_path

\`${entry.targetPath}\`

### ficha_markdown

\`\`\`markdown
${entry.fichaMarkdown.trimEnd()}
\`\`\`

### index_row

\`\`\`markdown
${entry.indexRow}
\`\`\`
`;

  return {
    title: `[Revisão] ${entry.name}`,
    body,
    labels: ["decisao:pendente", `zona:${entry.zone}`],
  };
}

function runGh(args, { input } = {}) {
  return execFileSync("gh", args, {
    encoding: "utf8",
    input,
    maxBuffer: 20 * 1024 * 1024,
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function repositoryName() {
  const result = JSON.parse(runGh(["repo", "view", "--json", "nameWithOwner"]));
  return result.nameWithOwner;
}

function ensureLabels(repo) {
  for (const [name, [color, description]] of Object.entries(LABELS)) {
    runGh([
      "label",
      "create",
      name,
      "--repo",
      repo,
      "--color",
      color,
      "--description",
      description,
      "--force",
    ]);
  }
}

function existingReviewIssues(repo) {
  const output = runGh([
    "issue",
    "list",
    "--repo",
    repo,
    "--state",
    "all",
    "--limit",
    "1000",
    "--json",
    "number,body,url",
  ]);
  const byTargetPath = new Map();
  for (const issue of JSON.parse(output)) {
    try {
      const parsed = parseReviewIssue(issue.body);
      if (byTargetPath.has(parsed.targetPath)) {
        throw new Error(`issues duplicadas para ${parsed.targetPath}`);
      }
      byTargetPath.set(parsed.targetPath, issue);
    } catch (error) {
      if (String(error.message).startsWith("issues duplicadas")) throw error;
    }
  }
  return byTargetPath;
}

function createIssue(repo, issue) {
  const response = runGh(
    ["api", "--method", "POST", `repos/${repo}/issues`, "--input", "-"],
    { input: JSON.stringify(issue) },
  );
  return JSON.parse(response);
}

function parseOptions(argv) {
  const dryRun = argv.includes("--dry-run");
  const limitIndex = argv.indexOf("--limit");
  let limit = Number.POSITIVE_INFINITY;
  if (limitIndex !== -1) {
    limit = Number.parseInt(argv[limitIndex + 1], 10);
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("--limit exige um inteiro positivo");
    }
  }
  return { dryRun, limit };
}

async function main() {
  const { dryRun, limit } = parseOptions(process.argv.slice(2));
  const entries = await readCanonicalEntries({ rootDir: process.cwd() });
  const repo = repositoryName();
  const existing = existingReviewIssues(repo);
  const missing = entries.filter((entry) => !existing.has(entry.targetPath));

  process.stdout.write(
    `Validação: ${entries.length} fichas, ${new Set(entries.map((entry) => entry.targetPath)).size} caminhos seguros, ${entries.length} linhas de índice.\n`,
  );
  process.stdout.write(
    `GitHub: ${existing.size} issues de revisão existentes; ${missing.length} por criar.\n`,
  );

  if (dryRun) {
    for (const entry of missing.slice(0, limit)) {
      process.stdout.write(`[dry-run] ${entry.targetPath}\n`);
    }
    return;
  }

  ensureLabels(repo);
  for (const entry of missing.slice(0, limit)) {
    const created = createIssue(repo, renderReviewIssue(entry));
    process.stdout.write(`#${created.number} ${normalizePath(created.html_url)}\n`);
  }
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
