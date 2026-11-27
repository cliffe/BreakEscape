# Ops layer plans: cross-plan delta check, round 8 (round 3 answers)

Scope: `git diff b793fd2fc 332e2f005 -- docs/achitechture/` (15 commits; CORE, CRACK, LOCK, PRIV,
SKIN changed; MFA and LOG unchanged) against the "# Round 3" section of
`docs/agents/ops_layer/USER_PICKS_2026-11-19.md` and brief rule 4. Short names as in R7. Line
numbers are at 332e2f005. No plan was edited.

Counts: 0 majors, 3 minors, 4 nits. Verdict: **settled**; the minors are wording or a rule
statement that disagrees with its own test, fix with the next edit of each plan.

## Round 3 answers, carried

- **R3-1 (catalog, `realism`, loader, index, real-id scope).** Carried consistently. CORE:359-365
  (field), :573-583 (finding `cli` from the catalog), :579-589 (loader, fails closed: warning plus
  empty map, never raises), :1285-1286 (exposure rows), :1373-1393 (9.1 summary), :1513-1514
  (effect on existing scenarios), :1583 (`realism_catalog_test.rb`), :1854 (step 6), :1914-1916
  (new files) agree with SKIN:339-470 (4.3), :483-490 (5.1), :1246-1290 (schema and the two
  validators), :1618-1625 (tests), :1764-1779 (shared files) and request 3 at :1792-1844. Both
  name `lib/break_escape/realism_catalog.rb` (core-owned, S2), `config/break_escape/realism_catalog/`,
  `test/fixtures/realism_catalog/`, `scripts/validate_realism_catalog.rb`,
  `docs/REALISM_CATALOG_INDEX.md`. Real-identifier scope (only scenarios that declare `services`)
  agrees: SKIN:1332, :1380-1383, CORE:1513, CORE part 2 (`ops-unchanged-validator`). No `cli` on a
  weakness or decoy remains in either plan; `cliFinding` survives only in SKIN:1861, which says it
  is gone. No scenario example holds a real id (SKIN:300-306; the catalog sketch uses made-up
  2031 ids, the training file year 0000).
- **R3-2 (no mark).** Carried. "(simulated)" appears only in SKIN:975 and :1410, both saying no
  template carries it; `Starting Nmap against` and `Metasploit Framework console` are bare; the "in
  this simulation" local answers stay (SKIN:452, provenance test exception). SKIN 15(b) removed.
  CRACK:976 "simulated command-line output" is prose about the skin, not a mark.
- **R3-3 (salted wait, 60 s).** Carried. CRACK:46-51 (60 s default, reasons for (a)), :177, :458;
  `hard` raises the default to 120 s through the difficulty table, which the user's R3-4 reading
  allows. LOG:1158 and :1238 (S7 writes no rows) and MFA:529-531, :1145-1146 are untouched by the
  wait and still agree.
- **R3-4 (`common` recipe only; `crack.difficulty`; `passwordDifficulty`; record wins).**
  Carried. CRACK:210-215, :226-275, :328, :421, :582, :605, :660-673, :688-692, :741-770, :818-825
  agree with PRIV:281-286 (habit parameter, record overrides NPC, `common` recipe-only). See m3
  and n1-n3.
- **R3-5 (re-add wording).** Carried. LOCK:153 (G3 done-when), :756-757, :1313-1318 call re-adds
  known best-effort routes with the step never skipped; LOCK section 15 is "None open"; no
  `carriedGone` anywhere.
- **R3-8 (G4).** Carried in LOCK:1-3, :153-158, :716, :759-798, :928-934, :990-1011, :1085-1087,
  :1222-1225. LOG names the outline stage S8c only (LOG:231, :238, :1145, :1233), which still
  covers G1 to G4 (LOCK:156-158). G4's `ops_unchanged` claim (five scenarios) is a LOCK statement
  only; no other plan lists that set differently. See m1.

## Cross-references

- Refusal codes: round 3 adds none. CORE:1220 (twelve network codes, two from S7) is unchanged;
  `no_recipe` for an unknown difficulty reuses an existing S7 code. Nothing to fix.
- Section 14 requests: SKIN requests 4 and 5 are marked taken and match CORE 5.3 and 9.1. SKIN
  request 3 is taken in substance (CORE:579-589, :2039-2045) but its text is stale (m2). CRACK
  request 4 is taken in PRIV, with the wrong section number (n1).
- Build stages: CORE S2 builds the loader before SKIN K3 creates the folder; both plans say a
  missing folder loads as an empty map (CORE:587-588, SKIN step 6). CRACK C1 builds
  `crack_difficulty.rb` (CRACK:163, :869, :913). LOCK G4 lands last (LOCK:156-158).
- Test fixture folders: `test/fixtures/realism_catalog/` is core-owned and shared by the skin's
  validator test (SKIN:1618, broken folders in subfolders the loader does not read; CORE:1583
  "a second folder"). Consistent.

## Findings

### Minor

**m1. LOCK:928-934, the G4 id-less warning does not cover the carrier it cites.** The warning
reads "a plain carried container (an NPC `itemsHeld` entry or a start item ...) that has no `id`",
and is a warning rather than an error "because the shipped `ceo_exfil` tablet is one". The tablet
is a `takeable` room object in `reception` (LOCK:791-793), so the rule as written never fires on
it, and an id-less takeable room container gets no warning. The test row at LOCK:1049-1050 has
the same two homes. Fix (LOCK): widen the warning to every plain carrier home of 5.5 (`npc`,
`start`, `grant`, `room` takeable) and add a takeable room object to the spec, or drop the tablet
as the reason.

**m2. SKIN:1800-1806, request 3 still says the core's loader raises.** "Changed from the core's
current text, where the loader raises" and "the core's loader test changes its two refusing
folders" describe the pre-332e2f005 core. CORE:579-589 and :1583 now fail closed with an empty map
and a warning, which is what the request asks. Request 3 is also the only skin request not marked
taken. Fix (SKIN): mark request 3 "taken by the core (5.3, 11.1)" and drop the two "changed from"
sentences.

**m3. CRACK:660-661, the `crackSeconds` rule ignores the NPC grade.** The rule allows
`crackSeconds` "only on a record that resolves salted (its own `salted: true`, or a `medium` or
`hard` difficulty with no `salted: false`)", which reads as the record's `crack.difficulty`. The
resolution at :243-246 and the test at :767-768 ("`crackSeconds` on a record with no `difficulty`
whose NPC has `passwordDifficulty: "hard"` and no `salted` key is clean") take the grade from the
NPC too. A validator built from the rule text would refuse what the test expects to pass. Fix
(CRACK): "a record that `CrackDifficulty.resolve` gives as salted (its own `salted: true`, or a
`medium` or `hard` grade from the record or its NPC, with no `salted: false`)".

### Nit

**n1. CRACK:942 and :953, request 4's status and pointer.** The lead-in says "a fourth for its
next edit", the item says "taken by the privilege plan, section 6". PRIV took it at :283-286, in
section 4 (Scenario fields). Fix (CRACK): "Four requests, all taken"; "(taken: PRIV section 4,
L283-286)", and update the L280-296 range if it moved.

**n2. CRACK:669, "the band warning above".** The band warning is the next bullet, :670-673. Fix
(CRACK): "below".

**n3. CRACK:19-21, overview names only the record grade.** "An author can grade a hash record"
leaves out `passwordDifficulty`, which the section it points to makes the second place. Fix
(CRACK): add "or, for every record of a person's account, through the NPC's `passwordDifficulty`;
the record's grade wins".

**n4. SKIN:1641-1643, `test_ops_skin` defaults beside "every finding linked".** "The printer and
the sign-in hosts keep the defaults ... every finding in the scenario is linked, as the
all-or-none rule requires." If the printer or a sign-in host has a weakness or decoy, the two
halves conflict. Fix (SKIN): say those hosts keep default service and address output and hold
no findings.

## Not raised

- `hard` defaulting to 120 s rather than 60 s: within the user's R3-4 reading (the plan designs
  the difficulty), and every default with no grade is 60 s.
- MFA and LOG: no round 3 text; their crack and S8c references still hold.
