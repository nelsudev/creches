# Research criteria refresh design

## Objective

Resolve issues #53 and #56 by updating the repository's research criteria,
creche template, telephone guide, and Creche Feliz instructions. Then make
pending review issues safely refreshable so issues #54 and #55 can improve the
34 canonical fichas without later decisions restoring stale content.

The work remains split by authority:

- agents may research public documents, update templates, and prepare questions;
- humans perform contacts, visits, registrations, and family decisions;
- only repository collaborators decide review issues with `aceite` or
  `rejeitado`.

## Delivery order

1. Update the criteria and Creche Feliz documentation (#53 and #56).
2. Add safe synchronization for pending review issues.
3. Research missing identity and source data (#54).
4. Research publicly available operational data (#55).
5. Synchronize changed canonical fichas into their pending review issues.

This order prevents an old issue payload from overwriting newer research.

## Criteria model

`docs/criterios-pesquisa.md` will distinguish three kinds of criteria:

- **legal or documentary requirement:** supported by current legislation or an
  official licensing source;
- **quality practice:** supported by the Segurança Social quality manuals, DGS
  guidance, or another authoritative professional source;
- **family observation:** a recurring question or warning found in community
  discussions, never treated as proof about an institution.

Every criterion will also identify its verification channel:

- **document/web:** can be researched by an agent;
- **human contact:** requires a real reply from the institution;
- **human visit:** requires direct observation at the site.

Missing publication does not mean non-compliance. If no reliable evidence is
available, the value remains `?` and becomes a contact or visit question.

## Documentation changes

### Research guide

The guide will add compact groups for:

- licence and authorization status;
- mandatory public information and internal regulations;
- technical direction, staff qualifications, stability, and coverage;
- adaptation, key person, individual plan, and family communication;
- medication, illness, accidents, allergies, and emergency contacts;
- infant feeding, safe sleep, movement, screen use, and outdoor time;
- access control, emergency evacuation, insurance, and complaints;
- closures, entry limits, supplies, deposits, refunds, and total cost;
- evidence freshness, conflicts between sources, and community-source limits.

It will include a practical matrix showing criterion type, preferred evidence,
and verification channel.

### Creche template

`templates/ficha-creche.md` will remain usable rather than becoming a legal
checklist. It will add focused sections:

- `Conformidade e transparência`;
- `Acolhimento, saúde e comunicação`;
- expanded `Qualidade e adequação`.

Fields that are not researched stay `?`. Existing 34 fichas are not
mechanically expanded as part of #53.

### Telephone guide

`templates/guiao-telefone.md` will contain only questions that benefit from a
real institutional reply. It will:

- distinguish official candidature from local expression of interest;
- ask about actual staffing through opening/closing periods and room merging;
- cover adaptation, feeding, sleep, illness, medication, incidents, privacy,
  supplies, closures, deposits, and refunds;
- avoid asking humans for facts already available in official documents.

### Creche Feliz instructions

`README.md` and related notes will use the current Segurança Social
Direta/app da Segurança Social terminology. They will document:

- search and candidature in the current service;
- a maximum of three establishments per request;
- the candidature confirmation and number;
- the official priority criteria by direct link, without inventing a simplified
  ordering;
- the distinction between official candidature, local pre-registration or
  expression of interest, waiting list, and assigned place;
- the difference between the solidarity network and a for-profit establishment
  that joined the participating-creche pool.

Obsolete links and references to the discontinued standalone Creche Feliz app
will be removed.

## Pending review synchronization

The existing issue generator will gain a `--sync` mode.

For every canonical target path it will:

1. locate exactly one existing review issue;
2. require the issue to be open and labelled `decisao:pendente`;
3. refuse issues with `decisao:aceite` or `decisao:rejeitado`;
4. regenerate the machine-readable proposal from the current ficha and index;
5. update the existing issue body while preserving its number, title,
   comments, assignees, and labels;
6. skip the API write when the body is already identical.

The default command remains create-only. `--dry-run --sync` reports
`unchanged`, `would update`, and `refused` counts without writing.

Synchronization never adds `fase:contactar`, never closes issues, and never
changes human evidence.

## Research execution

Issue #54 prioritizes official identity sources for the 11 unknown addresses
and the 17 fichas that currently rely on a secondary directory. A secondary
source may remain as a discovery trail but not as sole evidence for sensitive
facts.

Issue #55 researches the current unknown baseline:

- 27 berçário fields;
- 23 operating-hour fields;
- 22 capacity fields;
- 8 protocol fields.

Capacity, historical occupancy, and current vacancy remain separate concepts.
Current vacancy and waiting-list position are always human-contact data.

Research changes are committed in reviewable zone-sized batches. After each
batch, pending issue proposals are synchronized and audited.

## Testing and validation

Automated tests will cover:

- current Creche Feliz wording and removal of old app references;
- presence of criterion type and verification-channel guidance;
- the expanded template and telephone topics;
- `--sync` updating an open pending issue;
- no-op behavior for identical bodies;
- refusal of terminal, closed, duplicated, or malformed review issues;
- preservation of comments and labels by only patching the body;
- dry-run counts and zero writes.

Before closing #53 and #56:

- all Node tests must pass;
- documentation links must resolve to the intended official pages;
- repository search must find no operational references to the old standalone
  Creche Feliz app;
- review-issue dry-run must still find 34 unique canonical target paths.

Issues #54 and #55 close only after their before/after counts and unresolved
human-contact fields are posted in readable comments.
