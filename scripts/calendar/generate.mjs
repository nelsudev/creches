import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { assertValidCalendarDocument } from "./model.mjs";
import {
  renderCalendarIcs,
  renderCalendarMarkdown,
} from "./render.mjs";

const sourcePath = process.argv[2] ?? "calendar/decisions.json";
const outputDirectory = process.argv[3] ?? ".";

try {
  const document = JSON.parse(await readFile(sourcePath, "utf8"));
  assertValidCalendarDocument(document);
  const markdown = renderCalendarMarkdown(document);
  const ics = renderCalendarIcs(document);

  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(outputDirectory, "calendario.md"),
      markdown,
      "utf8",
    ),
    writeFile(
      path.join(outputDirectory, "calendario.ics"),
      ics,
      "utf8",
    ),
  ]);

  const eventCount = document.decisions.filter(
    (decision) => decision.timing.kind !== "unknown",
  ).length;
  console.log(
    `Calendário gerado: ${document.decisions.length} decisões, ${eventCount} eventos ICS.`,
  );
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
