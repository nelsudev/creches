# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is not a software project — it's a data/research repository for tracking creches (nurseries/daycare) in Portugal, initially covering Trofa, Matosinhos, and Porto (Ramalde area). There is no build, lint, or test tooling here beyond commit-message linting (see below).

## Commit conventions

Commit messages must follow [Conventional Commits](https://www.conventionalcommits.org/) and are enforced by **commitlint** (`@commitlint/config-conventional`) via a husky `commit-msg` hook.

- Run `npm install` once after cloning so husky installs the hook (`npm run prepare`, wired to the `prepare` script).
- Format: `type(scope): subject`, e.g. `feat(trofa): add ficha for Creche O Ninho`, `docs(claude): document issue workflow`, `chore(setup): add commitlint`.
- Common types here: `feat` (new creche entries/data), `docs` (README/CLAUDE.md/templates), `chore` (tooling), `fix` (correcting a previously recorded fact).
- The hook rejects non-conforming messages at commit time — there is no way to bypass it without `--no-verify`, which should not be used.

## Scope of data being tracked

For each creche, the target fields are: name, address, contacts, public/rede-solidária vs. private, whether it participates in the **Creche Feliz** program (free tuition), whether it has a berçário (nursery for infants), age range covered (target: 6 months–6 years), and whether the family has already visited it.

Note the structural split in the Portuguese system: "creche" officially covers ages 0–3; ages 3–6 fall under pré-escolar (public DGE network or private/solidária jardim de infância). No single institution type spans 0–6 — data for a full 0–6 profile must be cross-referenced between Carta Social (0–3) and the jardim de infância network (3–6).

## Authoritative sources to use when researching or verifying entries

- **[Carta Social](https://www.cartasocial.pt)** — official registry of all licensed social responses (creches, amas, solidária jardins de infância), searchable by district/concelho/freguesia. Primary source for confirming an entity is public/rede solidária vs. private, and its licensed capacity.
- **[Segurança Social — Crianças e Jovens](https://www.seg-social.pt/criancas-e-jovens)** / Segurança Social Direta — vacancy applications (online-only since April 2026) and the list of creches aderentes to Creche Feliz.
- **[Portal das Matrículas / DGEstE / DGE](https://www.dge.mec.pt)** — public pré-escolar network (ages 3–6), school groupings, enrollment rules.
- Government (portugal.gov.pt) communiqués on Programa Creche Feliz — for confirming free-tuition eligibility.
- Câmara Municipal sites for the target concelhos (cm-trofa.pt, cm-matosinhos.pt, cm-porto.pt) — municipal social bursaries and local social-response listings.
- CNIS and IPSS/Misericórdia union directories — for solidária institution listings.
- Google Maps/Reviews — practical, non-official source for contacts, hours, and first-hand family experiences.

Do not fabricate contact details or program affiliation (Creche Feliz, público/privado status) — verify against Carta Social or the Segurança Social portal before recording it.

## Structure

- `creches.md` — the index: one table per concelho (Trofa, Matosinhos, Porto/Ramalde) with columns Nome, Localização, Preço, Protocolos, Público/Privado, Berçário, Faixa Etária, Já Visitámos, Ficha, Notas.
- `templates/ficha-creche.md` — template for a per-creche detail file.
- `fichas/<concelho>/<nome-slug>.md` — one detail file per creche, copied from the template. `<concelho>` is `trofa`, `matosinhos`, or `porto-ramalde`; `<nome-slug>` is the name lowercased, unaccented, spaces replaced with hyphens.

## Guidelines agents must follow when adding or updating a creche entry

Use `docs/criterios-pesquisa.md` para priorizar os campos, escolher a fonte adequada e separar o que pode ser confirmado por pesquisa do que exige chamada ou visita.

1. **Never fabricate data.** Every field (price, protocol, público/privado status, berçário) must come from a source in the README's "Fontes fidedignas" list (Carta Social, Segurança Social, DGE/DGEstE, câmara municipal, or a direct call/visit). If a field can't be verified, write `?` rather than guessing.
2. **Always create both artifacts together:** a detail file at `fichas/<concelho>/<nome-slug>.md` (from `templates/ficha-creche.md`) AND a row in the matching table in `creches.md` that links to it. Don't add one without the other.
3. **Record sources per entry.** In the detail file's "Fontes consultadas" section, list every source used with the consultation date and what it confirmed. This lets a future pass re-verify stale data.
4. **Keep the index table terse.** Full address, phone, schedule, capacity, and visit history belong in the detail file, not the index. The index row should be scannable at a glance.
5. **Público/Privado vs. Rede Solidária:** don't collapse these — an IPSS/Misericórdia is legally private but non-profit and often has different eligibility (e.g., Creche Feliz access) than a for-profit private creche. Use the three-way distinction consistently.
6. **Visits go in the detail file's history table**, not just the index's "Já Visitámos" column — the index only needs Sim/Não + latest date; the detail file keeps the full log with impressions.
7. When splitting or reorganizing zones, keep column names identical across all tables in `creches.md` so entries stay comparable.

## Workflow: GitHub issues

The actual data-collection work is tracked in GitHub issues (`nelsudev/creches`), organized as a **phase × zona** matrix, with labels `fase:setup|enumerar|contactar|visitar|decidir` and `zona:trofa|matosinhos|porto-ramalde`, grouped under milestones **Levantamento → Contactos → Visitas → Inscrições** (target entry: September 2027).

Before collecting data for a creche, pick up the open issue for the current phase and zone — each zone issue depends on the previous phase's issue for that same zone (stated in its body). Don't jump ahead (e.g., don't contact a creche in Fase C before Fase A/B have created its ficha and cross-referenced Creche Feliz/contactos for that zone).

Reference facts to use when filling fichas (do not restate as fact without a source, but use as a sanity check against what an institution reports):

- **Legal ratios**: berçário 1 educador + 1 auxiliar per 8 infants (max 10/room); 1-year room 1+1 per 14; 2-year room up to 18; homogeneous 3-year group max 15.
- **Pricing by network**: público/municipal — subsidized by income bracket; IPSS/rede solidária — monthly fee as a % of per-capita household income (typically 14.8%–28.7%); privado — fixed institutional rate; Creche Feliz — free for children born on/after 2021-09-01 at participating institutions in any network.
- **Waitlist practice**: registering at 3–5 creches simultaneously is normal; annual re-registration is commonly required between January and April — missing it is a common cause of losing a spot.
- **Open question (see issue #1)**: whether vacancy applications go exclusively through the Segurança Social portal or remain per-institution is unconfirmed as of this writing — verify before relying on either method.
