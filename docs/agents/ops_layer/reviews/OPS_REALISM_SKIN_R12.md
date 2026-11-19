# Realism skin plan: delta review R12 (realism catalog, no mark)

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` at `b0ccefae4` (1811 lines).
Delta read: `095f1fe02` (part 1, catalog design and no mark) and `1c927802d..b0ccefae4` (part 2,
validator split, tests, requests 3 and 5). The brief's range `1c927802d..HEAD` holds part 2 only,
since `095f1fe02` is the parent of `1c927802d`; both parts were read.
Decisions checked against: USER_PICKS_2026-11-19 Round 3 (R3-1, R3-2), OPS_LAYER_BRIEF section 2
rule 4, and the orchestrator's rulings (banners scenario-side with no real ids; default module
`auxiliary/scanner/...`). No SecGen XML or exploit-detail guide was opened.

## Findings

### Major

**M1. Nobody checks catalog text for attack steps (lines 106-110 against 429-435).**
Section 1.3 rule 4 says the "teaches no attack step" check "is checked by the scenario design
review and the lab-sheet step of every scenario that authors `cli` fields or links catalog
entries". Section 4.3 says those same review and fix agents never open the catalog. The pattern
rules of section 9 cannot see a procedure written in plain words.
*Failure:* a catalog task adds an entry whose six `output` lines describe, in plain prose, how to
trigger the flaw step by step. Every text rule passes (no path, flag, hex or credential). The
design review never sees it because it reads the scenario, which holds only the link id. The
lab-sheet step never sees it. The brief's "no working exploit content" limit then has no human
check at all.
*Fix:* move the content check to the catalog side. Section 4.3 "Who opens it": every task that
adds or changes entries ends with the catalog validator and a content check of each changed entry
against rule 4 (what a scanner reports about the flaw, never how to use it). State the scope of
`output` so the check has a test, for example "the state, a one-line description of what is wrong,
and the disclosure date; never a step, request form or trigger". Rule 4 at 106-110 then says the
scenario design review covers the scenario's own `cli` strings and the catalog task covers entries.

**M2. Linking an entry needs catalog knowledge that only the catalog holds (lines 265-279, 420-427,
429-435, 1244-1246).**
The plan says scenario agents never need to open the catalog. Review agents don't, but whoever
writes or fixes the links does. To pass the all-or-none rule, the count-pair rule, the
module-form rule and the `VERSION` agreement, the author has to know each entry's form (has
`advisories`? how many `output` lines? module first segment and segment count?) and the invented
product and version it names. Validator messages give only the scenario path, link id and rule.
*Failure:* a fix agent gets "Links all or none (3)" on decoy `old_banner` -> `share_old_build`.
The message names no form, so to find an entry with one advisory and one output line it must
open `file_sharing.json`. That is the read R3-1 set out to avoid (classifier false positives on
scenario work).
*Fix:* the catalog validator also writes a generated index (for example
`config/break_escape/realism_catalog/INDEX.md`, or `--index` output) that holds, per id, only: its
file, its form signature (advisory count, output-line count, module first segment and segment
count) and the invented product and version its text names, if any. It holds no catalog string.
The separation test also scans the index. Section 4.3 names the index as what scenario authors
and fixers read. Each link error quotes the form signatures involved, for example "decoy entry
form (1, 2, auxiliary/5); weakness forms: (1, 1, auxiliary/5)". Signatures are numbers and one
framework word, so this leaks no catalog text.

### Minor

**m1. A catalog edit after a game starts reopens the tell the validator closes (lines 357-361, 1768).**
A game row keeps the scenario copy from when the game was made. The catalog is read live. If an
id is renamed or removed, or a linked entry gains or loses `advisories` or `output`, an older
game's copy still links the old shape, and the validator never sees that copy.
*Failure:* `share_old_build` is renamed to `share_stale_build` and the shipped scenario is
updated. Games made before the change still link `share_old_build`, so their decoy prints
defaults (`auxiliary/scanner/...`) beside linked weakness modules. That tells the player which
finding is the decoy.
*Fix:* (a) section 4.3 rule: catalog ids are permanent and a linked entry's form signature never
changes; ids are only added. The catalog validator test compares against a committed list of ids
and signatures, where additions pass and removals or signature changes fail. (b) Request 3: when
any link of the game's scenario fails to resolve, the finding builder serves `cli` on no finding
of that game, so the game falls back to defaults evenly. It still logs the warning.

**m2. The loader raises inside a game move (lines 358, 1263, 1749).**
If the loader refuses to load (it raises, according to the core), the check and confirm routes
fail for every linked scenario. Panels players fail too, so a skin-only artefact removes a move
(brief rule 5). The suite catches duplicates before shipping, but a hand-edited `config/` on a
server does not pass through the suite. Separately, Ruby's `JSON.parse` quietly keeps the last of
two equal keys, so a duplicate id inside one file is never seen.
*Fix:* the loader logs and loads an empty map when it finds a duplicate. With all-or-none, every
finding then falls back evenly. The catalog validator stays the hard gate, and it parses with a
duplicate-key check. Add a same-file duplicate id fragment to the catalog validator test (1567).

**m3. Scoping the real-identifier rule by `services` holds today but fails as soon as a VM mission
gains an ops network (lines 345, 1280, 1329, 1568).**
It is sound for now: no scenario JSON or ERB under `scenarios/` has a `"services"` key (grep), so
every shipped scenario's validator output stays the same. The trouble comes when the ops layer is
brought into a campaign mission that teaches its VM part with real advisories. Declaring one
service turns every CVE line in its ink, hints and mails into an error, and the only fix is to
delete teaching text. "Declares `services`" is also keyed on the raw key in the separation test.
*Fix:* split the rule. Ops data (`cli` strings, `realism` ids, the names, labels, products,
versions, summaries and `falseBecause` of hosts, services and findings, and the built defaults)
gives an error in any ops scenario. General text (ink, objectives, hints, mails) gives an error
only when the scenario has no VM object, and a warning otherwise. Define "ops scenario" as one
with a top-level `hosts` entry or a `lockType: "login"` object carrying a `services` array, and
use the same definition in the separation test. If the narrower reading is meant, state it as a
decision so the mission-office-life and ops passes know about it.

**m4. Catalog ids are not checked for real identifiers (lines 375-377 against 1263-1281, 1567).**
Section 4.3 says an id is "never an advisory number or a vulnerability's nickname", but no
**Catalog** row enforces that. Only the scenario rule catches it, and only once a scenario links
the entry.
*Failure:* a catalog task adds the id `ms31_017_share`. It passes the catalog validator, appears
in the M2 index, and the first scenario to link it fails with an error naming a real-form id.
*Fix:* add a Catalog row: an id matching an advisory pattern, a nickname or the framework-path
form is an error. Add one fragment to 1567.

**m5. The "catalog does not validate" error lands on every scenario (lines 1237-1242).**
It is unclear whether `check_realism_skin` runs `check_realism_catalog` or only rescues the
loader, and it is unclear on which scenarios the error appears.
*Failure:* a broken catalog adds one error to the validator output of every VM mission and lab,
which have no links. Agents working on unrelated missions then chase a catalog problem they are
told not to open.
*Fix:* run `check_realism_catalog` (by name) only when the scenario has at least one `realism`
link. A scenario with no links never reads the catalog, as the core's loader note at core 582
already says for the server.

**m6. K3's catalog content is stated two ways (line 196 against 1586 and 1692).**
The K3 stage row says it adds "the realism catalog's JSON schema, its first entries". Step 6 and
section 11.4 add only `training_fixtures.json` of invented text.
*Failure:* the K3 builder reads "first entries" as real ones and writes real advisory ids and
module paths inside an engine stage, outside the separately briefed catalog task section 4.3
asks for.
*Fix:* line 196: "its schema, its validator and `training_fixtures.json` (invented entries for
`test_ops_skin`); real entries come in their own catalog task."

### Nits

- **n1** (line 1134): the section 7 table serves a linked entry "in the check answer and in
  `GET /network`" but leaves out the confirm answer's finding, which request 3 (1771-1773) and the
  link-serving test (1570) include.
- **n2** (line 1190): "Nothing is added ... to any server answer" is no longer true: `cli`
  fields and linked entries are added to network answers. Say "to any stored or synced state".
- **n3** (lines 391, 397, 1586): `training_fixtures.json` sits in the live catalog folder with
  real-form ids (`CVE-2031-...`) printed with no mark. Such ids can be assigned to real advisories
  in 2031, and any shipped scenario may link a training entry. Use an id that can never be
  assigned (year `0000`), or add a test that only `test_*` scenarios link entries of that file.
- **n4** (line 1280): the advisory patterns have no left boundary, so `ms\d\d[-_]\d{3}`,
  `kb\d{6,7}` and `usn-`/`dsa_` match inside longer ids. `\b` will not do, because `_` is a word
  character and `x_ms17_010` must still match. Specify "not preceded by a letter or digit".
- **n5** (line 1282): the falseBecause warning quotes nothing, but the shared word is also in
  the scenario's own `falseBecause`, which the real-identifier rule has already cleared. Quoting
  that one word leaks no catalog text and tells the fixer what to change.
- **n6** (lines 1569-1570): the link-id check names route answers. Name the bootstrap and the
  room answer for a linked finding on a sign-in object's service (`test_ops_skin`'s held-session
  PC) explicitly. The core deletes `services` from objects by name, so this is a test gap, not a
  leak.
- **n7** (lines 1796-1804): request 5 drops `definitions.cliFinding` from the core's 9.1
  summary. The core's shared-file table (core 1884) still names it, so the request should name
  that row too.
- **n8** (line 1264): the catalog default-form row copies "the core's five classes". Read them
  from the core's `class` enum so a sixth class cannot open a gap.
- **n9** (line 1568): the separation test runs the framework-path form over every file in an
  ops scenario's folder, but the validator exempts the default `auxiliary/scanner/<word>/<class>_f<n>`.
  A note or `PLAYTEST.md` line quoting a default module would fail the test and not the
  validator. Apply the same exemption, or say in the message that beats name actions.

## Checks with nothing to report

- **Separation.** The banner stays scenario-side, with no real id and no real product (347-351,
  1281). The link id is never copied (request 3, test 1570). The catalog is outside `public/` and
  `scenarios/`, the gem ships `config/**` (gemspec line 13), and no route serves it. Messages name
  file, id, field and rule and quote nothing (1244-1246, 1271, 1281). Services on room objects are
  deleted from the bootstrap by name (core 1265), so a link on a sign-in host never rides there.
  Form, key set and count are held even by rules (2) and (3) and the module-form row. Timing does
  not differ, since all-or-none means a check answer resolves every finding or none.
- **Defaults.** Core aliases are `f<n>` (core 37), and the catalog refuses
  `auxiliary/scanner/<word>/<class>_f<n>` (1264), so a default never equals a catalog module. The
  weakness and decoy defaults share one form. No advisory line or reference prints by default
  (253-254). `usn-default-creds` is caught by the pass over built defaults and has its own
  fragment in 1566.
- **No mark.** The started template (836), the console banner (869), the layout sketch (671) and
  the text table (935) are bare. The provenance test (1358) forbids `simulated`. The "in this
  simulation" answers remain (884, 893, 934, 1354). Golden tests cover linked entries with and
  without the optional fields (1356-1357).
- **Requests 3 and 5** can be built against the core as written: the S2 loader (core 217, 577),
  the early-write fields (core 227), the device-row builder (core 499) and the 9.1 summary (core
  1365-1378) all exist for the requests to land on.
- **Limits.** Entries have no options field, so `show options` stays `RHOSTS`, `RPORT` and
  `TECHNIQUE`. The catalog refuses any dotted quad, and scenario ranges are private only. The
  hostile test covers every catalog field (1349). Nothing new is synced (section 8). The plan
  holds no reference to plan reviews or rounds; "review" appears only as the product's own design
  review step.

## Verdict

Not ready. The realism catalog meets R3-1 and R3-2, and the split between the scenario
validator and the catalog validator is in the right places. M1 leaves the brief's
no-exploit-content limit with no human check on the catalog. M2 means anyone writing a link has
to open the catalog, which R3-1 set out to avoid. Fix M1 and M2 and the minors, then run a short
delta check of section 4.3, the section 9 table and request 3.
