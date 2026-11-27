# Realism skin plan: delta review R13 (R12 fixes)

Plan: `docs/achitechture/OPS_REALISM_SKIN_PLAN.md` and `OPS_CORE_PLAN.md` at `332e2f005`. Delta read:
`git diff 8f5641e50 332e2f005` over both plans, against `OPS_REALISM_SKIN_R12.md` and the "R12 fixes"
block of the decisions file. Line numbers are the skin plan's unless marked "core". No SecGen XML
or exploit-detail guide was opened.

## R12 findings: resolved?

M1 resolved (106-112 and 429-435 agree; `output` scope in the table at 392). M2 resolved in design
(index at 439-448; link messages in index terms at 1292-1297), with the gaps in m1 and m3 below.
Minors m1 to m6 and nits n1 to n9 are resolved as worded; m1's test is weaker than it reads (M-none,
see m1 here). Core gaps (a) to (c) agree with the core plan.

## Findings

### Major

None.

### Minor

**m1. Append-only is bypassed by the normal regenerate step (lines 452-459, 1277-1280, 1619).**
The comparison reads "the committed index", which is the file on disk, and the command line
rewrites that same file. An author who removes or renames an id and reruns the validator
overwrites the baseline, so the test then passes. The unit fixtures (an index naming a missing id)
test the comparison function, not this workflow.
*Fix:* the command line compares before it writes and refuses to write when the comparison fails
(a removal needs an explicit `--retire` flag that a review must approve), and the test also reads
the index from the base branch (`git show origin/main:docs/REALISM_CATALOG_INDEX.md`) when it can.

**m2. The index's "first segment is one framework word" is not enforced (lines 443-446, 380-382).**
The `module` pattern allows any first segment (`^[a-z][a-z0-9_]*/...`). The index prints that
segment, so a catalog task could put a product word or any text there and it would reach the
agents who read the index. Only the `auxiliary/4` examples make it look closed.
*Fix:* add a Catalog row: the first segment of a `module` is one of `auxiliary`, `exploit`, `post`
(the framework's own list), and the index test fails on any other word.

**m3. A scenario link edit makes the index stale, and nothing says who regenerates it (lines 441-442, 1277-1280, 1619).**
The index holds a "linked by" column and the test requires equality with a fresh write. A scenario
task that adds or removes a `realism` link changes that column and breaks the catalog test, yet
section 4.3 only ends catalog tasks with the validator run. A link author is told to read the
index, not to rewrite it.
*Fix:* every task that adds or changes a `realism` link also runs `scripts/validate_realism_catalog.rb` and
commits the index; say so beside "Who opens it".

**m4. Row 1313 says the loader detects a same-file duplicate id; it cannot (lines 363-366, 1313; core 577-584, 1583).**
The loader reads with a plain parse, which keeps the last of two equal keys and raises no fault;
only the validator's duplicate-key parse sees it. The core test lists three faults (cross-file id,
shared `module`, unparseable file) and none for a same-file duplicate, and the core's "its two
refusing folders" count does not match the three listed.
*Fix:* reword 1313 to "across files; a duplicate inside one file is the validator's alone", and say
"three refusing folders" in request 3 (skin 1808-1809).

**m5. A catalog rule error blocks every linked scenario's validation with an error the scenario fixer cannot clear (lines 1285-1289).**
"Does not validate" covers any catalog row, so one bad entry (a telltale word, an index mismatch)
gives every linking scenario the same single error. The fixer is told to run the catalog validator,
which is a catalog task, and a nearby agent may open the catalog to fix it.
*Fix:* the message says "this is a catalog problem; hand it to a catalog task, do not edit scenarios
or open the catalog", and the index-mismatch and append-only faults stay out of what the scenario
validator treats as blocking (they are test failures only).

### Nits

**n1. Ids are not checked against the telltale and real-product lists (lines 392-396, 1316-1318, 1329).**
Row 1329's "every catalog string of every entry" reads values, not ids, but ids appear in the
index and in link messages. *Fix:* add ids to the strings the telltale and `real_product_names.txt`
rows read.

**n2. Index separation scan needs its exemption stated (line 1620).**
`auxiliary/4` is not a path form but `docs/...` scenario paths in the "linked by" column must also
pass the `public/` check; one clause in the test row says the scan treats the index as a scenario
file and expects zero hits.

**n3. Core request 3 still says "the core's current text, where the loader raises" (skin 1800-1802).**
Once the core plan is changed this reads as stale history. *Fix:* drop the "Changed from..." clause
after the core plan carries the new text, which it now does (core 577-584).

## Checks asked

- Contradictions: none between the index, append-only, the fail-closed loader and the
  `check_realism_skin` rule that reads the catalog only for linking scenarios (1285-1289). The
  two validators read in opposite directions (the catalog one reads scenarios only to fill the
  "linked by" column), so there is no cycle.
- Index leaks: ids (plain words by rule), counts, the first segment (see m2) and scenario paths.
  No title, output, script or advisory text. Closed once m2 is applied.
- Append-only testable: the comparison is, the workflow is not (m1).

Ready after m1 to m3 are folded in; no further round needed on the rest.
