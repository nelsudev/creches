# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Purpose

This is not a software project — it's a data/research repository for tracking creches (nurseries/daycare) in Portugal, initially covering Trofa, Matosinhos, and Porto (Ramalde area). There is no build, lint, or test tooling here.

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

Data collection has not started yet. When adding a data file (e.g., a table per concelho), keep the field set above consistent across zones so entries are comparable.
