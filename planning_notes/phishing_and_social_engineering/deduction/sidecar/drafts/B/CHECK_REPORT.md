# Fixture B draft: check report

Checked 2026-10-22. The plan was 3327 lines at the start of this check and 3357 by the end (another
workflow is editing it), so plan line numbers below are approximate. Sections are given as well. The
plan was read, not edited.

## 1. Compile

`bin/inklecate -o drafts/B/compiled/<name>.json ink/<name>.ink` for all six files (the same call
`scripts/compile-ink.sh` makes; the script itself only walks `scenarios/`, so it was not run).

| File | Result |
|---|---|
| ded_b_haddad.ink | ok, no warnings |
| ded_b_lindqvist.ink | ok |
| ded_b_morgan.ink | ok |
| ded_b_okoro.ink | ok |
| ded_b_security_manager.ink | ok |
| ded_b_tomas.ink | ok |

No `-> END` lines (the compile-ink.sh hub-convention check passes). No fixes needed; the draft ink was
not changed.

## 2. Lints

**dialoguelint** (`node scripts/ink_runtime_check/dialoguelint.mjs drafts/B`): no findings in any file.
Two things limit what it saw:

- `ded_b_tomas.ink` reports `lines=0`. The SPEAKER regex (`[A-Z][\w.'’()-]*`, dialoguelint.mjs:128)
  does not match "Tomás", so no rule runs on his lines. A de-accented scratch copy (scratchpad, not kept)
  lints clean: 15 lines, max 19 words, no findings.
- `ded_b_haddad.ink` is linted as **phone** (cap 25). `scenarioInfo` (dialoguelint.mjs:688-703) picks the
  nearest `"npcType"` by character distance, and Nair's `"npcType": "phone"` after Haddad's `storyPath` is
  closer than Haddad's own before it. Harmless here (max 23 words), but it is a lint bug: a person NPC
  listed just before a phone NPC gets the phone cap and phone rules.

**inklint** (`node scripts/ink_runtime_check/inklint.mjs drafts/B --all --phone`): no findings.

## 3. JSON and cross-references (by hand)

`scenario.json.erb` has only an ERB comment; with it removed, it parses as JSON.

| Check | Result |
|---|---|
| `se_intel_*` declared for all 12 intel facts | ok |
| `deduction_state` `{}`, `deduction_closed`, `deduction_verdict_*` and `deduction_outcome_*` for the 4 suspects, `scenario_triggers_fired` `{}` | ok |
| Fixture globals: `b_badge_log_done`, `b_heard_alarm`, `b_insider_named`, `b_wrong_name`, `ded_b_tomas_influence`, `ded_b_tomas_latched`, `ded_b_tomas_wary`, `ded_b_tomas_reported` | ok (`b_heard_alarm` added by the draft; §4.9's list omits it) |
| Ink VARs that name globals match declared globals | ok in all six files. Ink-only VARs (`*_met`, `hub_quiet`, `tomas_thanked`, `ded_b_tomas_questions`, `names_given`, `briefed`, `complaint_given`, `code_given`) are not declared, as intended |
| Every `#grant_fact:<id>` names a fact, and the fact lists that NPC as an `npc` route | ok (Tomás: b_okoro_grievance, b_okoro_device, b_lindqvist_grievance) |
| Every `npc` route has a matching `#grant_fact` in that NPC's ink | ok |
| `object` route `dhcp_printout` exists and its `triggerOnInteract` grants the four device facts | ok |
| `trigger` routes name real trigger ids | ok |
| Fact `source` ids (`badge_log_terminal`, `dhcp_printout`, `hr_cabinet`) exist | ok |
| `subject` == `deduction.suspect`; clue counts (2 each) match the cells | ok |
| Solution unique: Okoro all three; Lindqvist no device; Haddad in-role access and no grievance; Morgan none | ok |
| Trigger events exist with the payload fields used: `global_variable_changed:<g>` → `{name, value}` (global-writer.js); `item_picked_up:notes` → `itemId` from world notes (interactions.js ~1689), container notes (container-minigame.js delegates to the same handler) and NPC gifts (npc-game-bridge.js:40) | ok |
| `#give_item:notes:b_overtime_complaint` uses the `type:id` form (as ruth.ink) and the item is in Lindqvist's `itemsHeld` | ok |
| Stakes and completion action types (`set_global`, `complete_task`) are known applyActions cases | ok |
| `solvedTask` `b_case_solved` and `onClose` `b_case_closed` exist as tasks | ok |
| `channels.person` `ded_b_tomas` is a person NPC | ok |
| Phone NPC id in the start phone's `npcIds` | ok |
| Brief contains the profile text and `briefText` verbatim; no guilty count | ok |

Drift since drafting (the plan moved on while this check ran, not a draft error):

- §4.2 now requires `place` on every `object`, `trigger` and `timer` route (DL18), with B's four places
  listed under §4.9. The draft's routes have no `place`.
- §4.9 now names the aim "Night shift" and the task `b_case_closed` "Send the shift report"; the draft
  says "The night shift case" and "Send the shift report to Priya".

## 4. Validator

`validate_scenario.rb` takes any path (`erb_path = ARGV[0]`), so it was run on copies under
`validate_copy/` with `--no-graph --skip-ink`. Raw output is saved beside the copies.

**Run A: the draft as written** (`validate_copy/test_social_deduction_b`,
`validator_output.txt`). Schema validation stops the run, so the later checks never happen:

- schema: `triggerOnInteract[4].type` "hint" is not in the enum (the DHCP printout). **Not expected.**
- unknown field `triggers` at top level (expected).
- `_note` keys: one error (`minigameData._note` on the log filter, closed minigame schema) and three
  warnings. Draft-only; P10-K-B moves notes into ERB comments.

**Run B: `_note` keys and the `hint` action removed** (`validate_copy/stripped/`,
`validator_output_stripped.txt`). Schema passes. Then:

- 13 `❌ SOCIAL: schema` errors: `deduction` on each of the 12 intel facts and `social.deduction`
  (expected until S16).
- `triggers` unknown at top level (expected until S16 adds it to `known_top_level`).
- Only generic suggestions otherwise (no VM, no music, one lock type, no hostile NPC, no
  `timedConversation`). Nothing else.

**Run C: deduction keys and `triggers` also removed, `--strict-social`**
(`validate_copy/no_deduction/`, `validator_output_no_deduction.txt`): exit 0, no social errors or
warnings. The 06 influence/threshold block, people, intel facts and Tomás's channel all pass the existing
lints.

**Run D: Run C's copy with ink checks on** (`validator_output_with_ink.txt`): six "ink file does not
exist" errors, because every `storyPath` must start `scenarios/` and the draft lives elsewhere. The ink
cross-checks (dead VARs, undeclared `set_global`) cannot run without a folder under `scenarios/`, which
this task may not create.

## 5. Issues that point at the plan

Ranked; "Major" means a packet built to the plan as written will fail a check or ship a broken piece.

1. **Major: `hint` is not a valid `triggerOnInteract` action in `scripts/scenario-schema.json`**
   (enum ends `... lighting_dip, grant_fact`). §9.1 ("The DHCP printout's `triggerOnInteract` grants its
   four facts and shows the printout as a `hint`") depends on it, applyActions supports it
   (apply-actions.js:124) and DL16's known list includes it, but §5.10 (S16) lists no change to that
   enum. As planned, fixture B fails schema validation on every run (schema errors stop the validator,
   and they are not under `#/social`). S16 needs "add `hint` to the `triggerOnInteract` type enum", or
   §9.1 shows the printout another way.
2. **Major: no log type fits a door/badge log.** §9.1 makes the badge log a `log_filter_terminal` but
   never says which `logType`. The minigame has two, `vpn` and `ics_rdp`, with hard-coded filter menus
   (log-filter-minigame.js:65-71: STATUS ACTIVE/CLOSED/FAILED, ACCESS_LEVEL ENGINEER/CONTRACTOR/ADMIN).
   A door log under `ics_rdp` gets filters that match none of its rows. Fixtures A and C also use a
   `log_filter_terminal` door log, so this affects three fixtures. The plan needs either an engine item
   (a `badge` log type with door columns and filters, or `filterCategories` from `minigameData`) or an
   explicit acceptance of the mismatch.
3. **Major: the plan never says what the badge log's flaggable anomaly is.** The log filter completes
   only when the one anomaly row is flagged, and that row is highlighted (`lf-anomaly-row`). If the
   anomaly is a suspect's badge-in, the highlight and the flag accuse that suspect before the board does.
   The draft flags the door-held-open alarm row, which names nobody. §9.1 should say so (and the same for
   A's and C's door logs).
4. **Minor: §7 sample ink breaks the house ink rules it tells authors to follow.**
   - §7.1/§7.2 prefix lines `Tomás:` while §4.9's name is "Tomás Rivera". A prefix must match
     `displayName` or the id (README_ink_best_practices).
   - §7.5 prefixes Nair's lines `Nair:` in a **phone** ink; dialoguelint's phone-self-prefix rule flags
     that, and m01's phone ink uses none.
   - §7.5's `name_okoro` line "You give Nair a name: Ngozi Okoro." is unprefixed narration in a phone
     chat, so it shows in Nair's bubble as her speech.
   - §7.2 and §7.5 end on `-> END` (`[Leave it there] -> END`, `send ... -> END`); compile-ink.sh warns
     on this and the house exit is a reply plus `#exit_conversation` back to the hub. §7.4 also ends `-> END`.
   - §7.2's choices are bracketed stage directions ("[Ask who has been unhappy on nights]", "[Thank him
     for the coffee]"); player choices should be what the player says. §9.1 itself words them as speech.
   P10-K packets that copy these samples will fail dialoguelint or the house rules.
5. **Minor: dialoguelint cannot read speaker names with accents.** Its SPEAKER regex uses `\w`, so every
   `Tomás Rivera:` line is skipped and his file lints as empty. The plan keeps the accent in
   `social.people` and the bridges, and §7 tells packets to run dialoguelint. Either a P10 lint item makes
   the regex Unicode-aware (`\p{L}` with the `u` flag), or the plan tells B to drop the accent from
   `displayName`.
6. **Minor: §4.9's declared-globals list omits `b_heard_alarm`**, which §9.1 relies on (Tomás's alarm
   topic sets it; Lindqvist's code choice reads it). DL13 is supposed to cover "as listed".
7. **Minor: §9.1 does not say how the player reaches Nair.** A phone NPC needs a phone in
   `startItemsInInventory` with `npcIds` (as lab_social_engineering does for Ruth). The bridges' B6 "call
   Nair" step assumes it.
8. **Minor: Tomás's thresholds `refuses` (−40) and `reports` (−60) cannot fire in B.** With the first
   question free, 15 per later question, and wary questions costing nothing, the floor is −30. DL12
   requires the `reports` threshold, but no bridge can reach it, so the `reports` band and Morgan's
   reaction to it go untested in B. Either say B carries them only to satisfy DL12, or make a wary
   question cost something.
9. **Minor: the alarm topic's behaviour while wary is undefined, and it is on the critical path.** §7.2
   says a wary witness "gives a vaguer answer that grants nothing". "Anything odd" grants no fact but sets
   `b_heard_alarm`, which is the only way to the server code. Read strictly, a player who asks the three
   clue topics first (to −30, wary) gets the vague line and is blocked until the kind word lifts them back
   to −10. That works only because −30 + 20 lands exactly on the default rearm point (−20 + 10), and only
   while the kind word is unspent. DL6's budget counts clue topics only. The plan should say that a
   progress-gating topic always answers (the draft does this, D5), or count such topics in DL6.
10. **Minor: Tomás's line in §9.1 contradicts the evidence.** §9.1 has Tomás say "Lindqvist went in" at
    the 02:00 alarm, but `b_lindqvist_access` puts Lindqvist in the server room at 23:40 and nothing puts
    him there at two. Either the log needs a 02:xx Lindqvist entry (which strengthens a false lead the
    debrief never addresses) or the line should be "Erik came to sort it", as in the draft.
11. **Minor: the DHCP printout exists only as a toast.** The `hint` action is a `gameAlert` toast that
    fires alongside four "Noted" grant toasts and is not saved to the notepad. The player can't reread
    which device belongs to whom, which weakens the "check the record" lesson. Worth a line in §9.1: use
    a `notes` item with `addToNotes`, or accept the toast.
12. **Note, `briefText`:** "Name the wrong people, or miss someone" reads as if there is at least one
    person to miss. That is true in B, but if the same wording is reused for a case with no guilty party,
    DL10's "no implied count" rule would want "...or miss anyone who fits".

## 6. Files

- Compiled ink: `drafts/B/compiled/*.json`
- Validator copies and raw output: `drafts/B/validate_copy/` (`validator_output.txt`,
  `validator_output_stripped.txt`, `validator_output_no_deduction.txt`, `validator_output_with_ink.txt`)
