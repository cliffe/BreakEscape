# Handover: realism skin plan, R3-1 (catalog) and R3-2 (no mark)

**Status 2026-11-19: all steps below done** (second agent). Banners and the default module path
were ruled on by the orchestrator and are written into the plan as design facts. Nothing open.

Worktree: `.claude/worktrees/ops-plan`. Nothing committed (brief says do not commit).
Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md`. Log: `docs/agents/ops_layer/reviews/OPS_REALISM_SKIN_DECISIONS.md`.
Rules: Edit tool only; plan stays standalone (no reviews/rounds/picks); no real advisory ids in
the plan (examples use made-up `CVE-2031-...`); do not open SecGen XML or exploit field guides.

## Design settled (already written into the plan)

- Catalog: `config/break_escape/realism_catalog/*.json` (gem ships `config/**`), outside
  `scenarios/` and `public/`. Schema `config/break_escape/realism_catalog.schema.json`.
  Loader `lib/break_escape/realism_catalog.rb` is the CORE's (request 3 below), frozen id map,
  refuses duplicate id/module, folder overridable in tests.
- Link: `realism: "<id>"` on weakness/decoy, id `^[a-z][a-z0-9_]{2,47}$`, no advisory pattern or
  nickname in it; linked at most once per scenario. Weakness/decoy no longer have `cli`.
- Entry: `title`, `module` (unique in catalog), `script` required; `advisories` (1-4; CVE, MS,
  GHSA, ZDI forms) and `output` (1-6 lines, 1-80 chars) optional; `_` notes; no kind field.
- Served: core resolves link server-side when building a checked finding, copies the entry's
  named keys into `cli` on the finding (check answer + GET /network once checked), same keys
  for weakness and decoy; link id and catalog never sent.
- Defaults (no link): title = label words; module =
  `auxiliary/scanner/<service word, - as _>/<class>_<alias>` (replaced `simulated/...`); script
  as before; no IDs/output lines.
- Indistinguishable: links all-or-none; optional fields all-or-none among linked entries; decoy
  advisory and output counts match some weakness's; module-form rules unchanged; telltale words
  over the whole catalog; falseBecause warning against the linked entry.
- VERSION agreement: banner names no real-product entry, version after own `product` = `version`;
  linked entry's title/output: same check against the linking service; real product names only
  inside module/script/advisories.
- Mark removed: sketch, `Starting Nmap against`, `Metasploit Framework console`, TEMPLATES note.
- Validators: two files (`validate_realism_catalog.rb`, `validate_realism_skin.rb`), table now
  has a "Runs in" column; messages never quote catalog text; "text string"/"prose string" defined.

Done sections: header 1.1, 1.3 rule 4, section 2 bullet, K3 row of section 3, 4.2 (rewritten),
new 4.3, 5.1, 5.3 (sketch, scanner, framework, info, layouts row, may-print, TERMINAL_ONLY_TEXT),
7 (table, link bullet, leak collector), 9 schema + catalog schema + validators intro + rows up to
"Range all or none".

## Still to do

1. Section 9 table rows after "Range all or none": add the "Runs in" cell to every row and
   rewrite: drop "`module` used twice / `simulated/`" (catalog uniqueness is Catalog); replace
   "Uneven authoring" with link all-or-none + optional-field all-or-none + decoy counts + banner
   all-or-none (Scenario); module form (Scenario, over linked modules); telltale words (Both:
   catalog strings, service `cli`); password rule (Scenario, over service cli and linked
   entries); payload/path/ASCII/blob/credential/real-host rows: say "text string", and
   "`banner` or `title`" becomes "prose string" (Both); add "no dotted quad at all in a catalog
   string" (Catalog); replace the "Depends on question 15(a)" row with (a) Scenario: advisory
   patterns, framework-path forms (a `/`-separated token whose first segment is `exploit`,
   `auxiliary`, `post` or `scanner`?) and `scripts/real_vuln_nicknames.txt` refused in every
   scenario `cli` string, `realism` id and the scenario's other text; (b) Catalog: real-product
   list in `title`/`output`; (c) Scenario: the VERSION agreement for banners and linked entries;
   add Scenario errors: unresolved link, link used twice. falseBecause warning row: linked entry.
   "`cli` object set where no services" warning: also `realism`.
2. Section 10 last paragraph: core ops scenarios declare no `cli` and no links.
3. Section 11.1: hostile test (served `cli` includes advisories/output); scanner/framework
   golden rows: "authored fields" -> "authored fields and linked catalog entries", cases with
   and without IDs/output; add an assertion that no generator line and no TEMPLATES entry holds
   `(simulated)` or the word `simulated` except the "in this simulation" local answers.
   Framework decoy/weakness sameness: entries of equal form.
4. Section 11.3 validator tests: replace option-1/2 fragments (`cve_2017_0144` etc. now fail in
   scenario cli and link ids, pass in catalog `advisories`/`module`); add catalog validator test
   (every catalog file passes; failing fragments: duplicate id/module, dotted quad, real product
   in title, URL, payload-ish); add a classifier-separation test: no file under `scenarios/`
   matches the advisory patterns (decide scope); leak collector row: link id never served.
5. Section 11.4 `test_ops_skin`: findings link entries in
   `config/break_escape/realism_catalog/training_fixtures.json` (invented text, made-up ids).
   11.6 K3 bullet: "authored `cli` fields and linked entries".
6. Section 12 step 6 and shared-files table: catalog files, schema, catalog validator and its
   Rails test, `scripts/real_vuln_nicknames.txt` (now unconditional), `realism` row instead of
   `definitions.cliFinding`; builders row: core resolves the link. "Not touched ... any server
   model or controller" still true (loader is core's).
7. Section 14 request 3: rewrite. Proposed wording:
   "3. Core: declare and serve the `cli` display fields and resolve the `realism` link, with
   the answers the player has earned. The skin declares the schema rows for the `cli` objects
   and for `realism` at K3 (section 9); until K3 the core's closed blocks refuse both. At S2,
   with the check route, the core adds the catalog loader `lib/break_escape/realism_catalog.rb`
   (reads `config/break_escape/realism_catalog/*.json` once, frozen map id to entry, refuses
   duplicate ids or modules, folder overridable in tests; no route serves it). Its row
   builders copy, by named keys only: [range, address, service cli bullets unchanged]; for a
   weakness or decoy with `realism`, the linked entry's `title`, `module`, `script`,
   `advisories` and `output` (those present) as `cli` on the finding in the check answer and
   in `GET /network`, only once the service has been checked, the same keys for both kinds; the
   link id is never copied. A link that does not resolve leaves the finding without `cli` and
   logs a server warning. Tests at S1 and S2 on test-only fixtures, S2's with a test-only
   catalog folder." Keep the "None of it is sent in the bootstrap..." paragraph and add the
   leak collector staging of linked entry strings.
   Request 5 (validator summary): the core's 9.1 summary needs a line that link use is all or
   none and that catalog checks are in `validate_realism_catalog.rb` - add as a request.
8. Section 15: delete questions a and b; leave "None open." then the clock sentence.
9. Decisions log: append under "## Round 3 decisions applied (2026-11-19)" one line per change.
10. Final grep: `simulated/`, `(simulated)`, `15(a)`, `question a`, `option 1`, `option 2`,
    `cliFinding`, `cli.module`; check line count.

## Open point for the user (report it)

Banners stay a scenario service field and may not name advisory ids or module paths, so the
catalog has no banner field (a banner is served at scan time, before the check, so one naming
an advisory would give the finding away early). The orchestrator's brief listed "banner text
naming them" among catalog contents; confirm this reading.
