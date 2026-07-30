import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("o guia distingue tipo de critério e canal de verificação", async () => {
  const guide = await readFile("docs/criterios-pesquisa.md", "utf8");
  for (const term of [
    "Obrigação legal/documental",
    "Boa prática",
    "Experiência comunitária",
    "Documento/web",
    "Contacto humano",
    "Visita humana",
  ]) {
    assert.match(guide, new RegExp(term, "i"), `falta ${term}`);
  }
});

test("o guia cobre os novos grupos de avaliação", async () => {
  const guide = await readFile("docs/criterios-pesquisa.md", "utf8");
  for (const term of [
    "licença",
    "direção técnica",
    "adaptação",
    "plano individual",
    "medicação",
    "alergénios",
    "sono",
    "primeiros socorros",
    "controlo de acessos",
    "caução",
    "ecrãs",
  ]) {
    assert.match(guide, new RegExp(term, "i"), `falta ${term}`);
  }
});

test("a ficha mantém os novos critérios em secções compactas", async () => {
  const template = await readFile("templates/ficha-creche.md", "utf8");
  assert.match(template, /^## Conformidade e transparência$/m);
  assert.match(template, /^## Acolhimento, saúde e comunicação$/m);
  assert.match(template, /licença.*autorização provisória/i);
  assert.match(template, /adaptação.*pessoa de referência/i);
  assert.match(template, /medicação.*doença.*acidente/i);
});

test("o guião pergunta por práticas humanas recorrentes", async () => {
  const script = await readFile("templates/guiao-telefone.md", "utf8");
  for (const term of [
    "agrupadas",
    "pessoa de referência",
    "rotatividade",
    "adaptação",
    "sono",
    "doença",
    "medicação",
    "primeiros socorros",
    "fotografias",
    "caução",
    "reembolsável",
  ]) {
    assert.match(script, new RegExp(term, "i"), `falta ${term}`);
  }
});
