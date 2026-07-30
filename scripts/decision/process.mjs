import { execFileSync } from "node:child_process";
import { readFile, rename, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  normalizeDecision,
  parseReviewIssue,
  validateTargetPath,
} from "./parse-issue.mjs";
import { applyDecision } from "./update-markdown.mjs";

const TERMINAL_LABELS = new Set([
  "decisao:aceite",
  "decisao:rejeitado",
]);

function labelNames(labels) {
  return (labels ?? []).map((label) =>
    typeof label === "string" ? label : label.name
  );
}

async function atomicWritePair(firstPath, firstContent, secondPath, secondContent) {
  const suffix = `.decision-${process.pid}-${Date.now()}.tmp`;
  const firstTemp = `${firstPath}${suffix}`;
  const secondTemp = `${secondPath}${suffix}`;
  try {
    await writeFile(firstTemp, firstContent, "utf8");
    await writeFile(secondTemp, secondContent, "utf8");
    await rename(firstTemp, firstPath);
    await rename(secondTemp, secondPath);
  } finally {
    await rm(firstTemp, { force: true });
    await rm(secondTemp, { force: true });
  }
}

export async function processDecision({
  issue,
  decision,
  date,
  rootDir,
}) {
  const normalizedDecision = normalizeDecision(decision);
  if (!normalizedDecision) {
    throw new Error("decisão inválida");
  }
  if (!Number.isInteger(issue?.number) || issue.number < 1) {
    throw new Error("número de issue inválido");
  }
  if (labelNames(issue.labels).some((label) => TERMINAL_LABELS.has(label))) {
    throw new Error("issue já tem decisão terminal");
  }

  const parsed = parseReviewIssue(issue.body);
  const { slug } = validateTargetPath(parsed.targetPath);
  const absoluteRoot = path.resolve(rootDir);
  const fichaPath = path.resolve(absoluteRoot, ...parsed.targetPath.split("/"));
  const fichasRoot = `${path.join(absoluteRoot, "fichas")}${path.sep}`;
  if (!fichaPath.startsWith(fichasRoot)) {
    throw new Error("target_path fora da raiz permitida");
  }
  const indexPath = path.join(absoluteRoot, "creches.md");
  const [currentFicha, currentIndex] = await Promise.all([
    readFile(fichaPath, "utf8"),
    readFile(indexPath, "utf8"),
  ]);
  const output = applyDecision({
    decision: normalizedDecision,
    issueNumber: issue.number,
    date,
    targetPath: parsed.targetPath,
    fichaMarkdown: parsed.fichaMarkdown,
    indexRow: parsed.indexRow,
    currentFicha,
    currentIndex,
  });

  await atomicWritePair(fichaPath, output.ficha, indexPath, output.index);
  const accepted = normalizedDecision === "aceite";
  return {
    ok: true,
    slug,
    decision: normalizedDecision,
    commitMessage: accepted
      ? `feat(decision): accept ${slug} (#${issue.number})`
      : `docs(decision): reject ${slug} (#${issue.number})`,
  };
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function loadIssue(number) {
  return JSON.parse(execFileSync(
    "gh",
    ["issue", "view", String(number), "--json", "number,body,labels"],
    { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 },
  ));
}

async function main() {
  const issueNumber = Number.parseInt(argument("--issue"), 10);
  const decision = argument("--decision");
  if (!Number.isInteger(issueNumber) || !decision) {
    throw new Error("uso: process.mjs --issue N --decision aceite|rejeitado");
  }
  const issue = loadIssue(issueNumber);
  const result = await processDecision({
    issue,
    decision,
    date: process.env.DECISION_DATE ?? new Date().toISOString().slice(0, 10),
    rootDir: process.cwd(),
  });
  process.stdout.write(`${JSON.stringify(result)}\n`);
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : "";
if (invokedPath === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
