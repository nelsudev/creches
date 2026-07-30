import { readFile } from "node:fs/promises";

import { assertValidCalendarDocument } from "./model.mjs";

const path = process.argv[2] ?? "calendar/decisions.json";

try {
  const document = JSON.parse(await readFile(path, "utf8"));
  assertValidCalendarDocument(document);
  console.log(`Calendário válido: ${document.decisions.length} decisões.`);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
