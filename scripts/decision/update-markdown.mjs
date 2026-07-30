import { validateTargetPath } from "./parse-issue.mjs";

const STATE_PATTERN = /^\*\*Estado da decisão:\*\* .+\r?\n?/gm;
const TERMINAL_NOTE_PATTERN = /^(?:Aceite|Rejeitado) em \d{4}-\d{2}-\d{2}$/;

function parseRow(row) {
  const trimmed = row.trim();
  if (!trimmed.startsWith("|") || !trimmed.endsWith("|")) {
    throw new Error("linha de índice inválida");
  }
  const cells = trimmed.slice(1, -1).split("|").map((cell) => cell.trim());
  if (cells.length !== 10) {
    throw new Error("linha de índice deve ter 10 colunas");
  }
  return cells;
}

function renderRow(cells) {
  return `| ${cells.join(" | ")} |`;
}

function mergeNotes(...noteValues) {
  const notes = [];
  for (const value of noteValues) {
    for (const note of String(value ?? "").split(";").map((item) => item.trim())) {
      if (note && !TERMINAL_NOTE_PATTERN.test(note) && !notes.includes(note)) {
        notes.push(note);
      }
    }
  }
  return notes;
}

function findIndexRow(indexMarkdown, targetPath) {
  const matching = indexMarkdown
    .split(/\r?\n/)
    .filter((line) => line.includes(`[ficha](${targetPath})`));
  if (matching.length !== 1) {
    throw new Error(`esperada uma linha de índice para ${targetPath}`);
  }
  return matching[0];
}

export function upsertDecisionState(markdown, stateLine) {
  const withoutState = markdown.replace(STATE_PATTERN, "").replace(/\n{3,}/g, "\n\n");
  const marker = "## Fontes consultadas";
  const markerIndex = withoutState.indexOf(marker);
  if (markerIndex === -1) {
    throw new Error("ficha sem secção Fontes consultadas");
  }
  const before = withoutState.slice(0, markerIndex).trimEnd();
  const after = withoutState.slice(markerIndex).trimStart();
  return `${before}\n\n${stateLine}\n\n${after.trimEnd()}\n`;
}

export function upsertIndexRow(
  indexMarkdown,
  targetPath,
  proposedRow,
  decisionNote,
) {
  validateTargetPath(targetPath);
  const currentRow = findIndexRow(indexMarkdown, targetPath);
  const currentCells = parseRow(currentRow);
  const proposedCells = parseRow(proposedRow);
  if (!proposedCells[8].includes(`[ficha](${targetPath})`)) {
    throw new Error("linha proposta aponta para outra ficha");
  }

  const notes = mergeNotes(currentCells[9], proposedCells[9]);
  notes.push(decisionNote);
  proposedCells[9] = notes.join("; ");
  const replacement = renderRow(proposedCells);
  return indexMarkdown.replace(currentRow, replacement);
}

export function applyDecision({
  decision,
  issueNumber,
  date,
  targetPath,
  fichaMarkdown,
  indexRow,
  currentFicha,
  currentIndex,
}) {
  validateTargetPath(targetPath);
  if (decision !== "aceite" && decision !== "rejeitado") {
    throw new Error("decisão inválida");
  }
  if (!Number.isInteger(issueNumber) || issueNumber < 1) {
    throw new Error("número de issue inválido");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    throw new Error("data inválida");
  }

  const accepted = decision === "aceite";
  const state = accepted ? "Aceite" : "Rejeitado";
  const sourceFicha = accepted ? fichaMarkdown : currentFicha;
  const sourceRow = accepted
    ? indexRow
    : findIndexRow(currentIndex, targetPath);

  return {
    ficha: upsertDecisionState(
      sourceFicha,
      `**Estado da decisão:** ${state} (${date}, issue #${issueNumber})`,
    ),
    index: upsertIndexRow(
      currentIndex,
      targetPath,
      sourceRow,
      `${state} em ${date}`,
    ),
  };
}
