# Fixture D draft: check report

Plan `DEDUCTION_IMPLEMENTATION_PLAN.md` was 3401 lines when this check started and 3551 when it ended,
because another workflow is editing it. §9.4 (fixture D) did not change between the two reads. The §7.2
example quoted below is at lines 1681-1713 of the 3551-line version. No file outside `drafts/D/` was
touched, and nothing in the draft ink needed fixing.

Scratch outputs in this folder: `compiled_check/` (a fresh compile of every `.ink`) and `validate_copy/`
(the copy the validator ran on). The cross-reference script is outside the repo, at
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/f343dc8a-c9f7-426c-b0b8-fbe5002f3392/scratchpad/tools/xref.py`.

## 1. Ink compile

`scripts/compile-ink.sh` works only on `scenarios/<name>/`, so I ran its two steps by hand: the END grep
(no hits) and `bin/inklecate -o compiled_check/<x>.json ink/<x>.ink`. All eight files (chen, conductor,
devries, guard, mensah, sato, steward, volkov) compiled with no errors and no warnings. Each output matches
the author's `ink/<x>.json`. I made no fixes.

`loopcheck.js <file> start`: all eight ran 200 steps under 6 strategies with no runtime errors. Each hub
loops forever, which is what a hub should do.

## 2. Lints

- `dialoguelint.mjs drafts/D`: no rule hits. The longest line is 23 words (steward), so every line is
  under its cap. The phone ink (guard) is detected as phone.
- `inklint.mjs drafts/D --all --phone`: no findings.

## 3. Cross-references (by hand plus `xref.py`)

These all resolve:
- Every `se_intel_*` for the 18 facts.
- `deduction_verdict_*` and `deduction_outcome_*` for all five suspects.
- `deduction_faded_*` for exactly the three tampered facts.
- `deduction_state`, `deduction_closed`, `mission_failed`, `scenario_triggers_fired` and `d_last_stop`.
- Every trigger's `on` global, `room_entered` room and `itemId`/`objectId`.
- The `item_picked_up:<type>` events: each type matches the item's `type`.
- Every timer's `startOnGlobal`.
- Every action type (all are in DL16's list).
- Every `set_global` key, `grant_fact` id, `complete_task` id, `unlockDoor` room and route id.
- Every route grants its fact.
- Clue counts equal the cells, and `subject` equals `suspect` on every fact.
- Each profile's `text` and the `briefText` appear verbatim in the brief.
- Every `storyPath` has a file.

All the event payloads the triggers use exist in the engine with the fields named in `where`:
- `item_picked_up:<type>.itemId` (`inventory.js`, `interactions.js`, `container-minigame.js`)
- `fingerprint_identified:<ownerSlug>.objectId` (`biometrics.js`)
- `room_entered:<room>`
- `global_variable_changed:<g>.value`

A KO drop keeps the item's `id` (`npc-hostile.js dropNPCItems`), so `t_d_key_drop` can match. The server
lets the guard unlock doors through `npc_mapping_unlocks_door?` (`game.rb`).

Draft-level findings (fix in P10-K-D, not the plan):
- **D1. Every `object` and `trigger` route has no `place`** (12 routes). §4.2 and DL18 require one, so the
  real fixture would fail DL18.
- D2. `ded_d_steward_questions` and `ded_d_conductor_questions` are ink-only VARs. They are not declared
  globals. The plan now calls B's counterpart a "synced variable" (§8 stub-set text), so D should
  probably declare them too.
- D3. The guard's "stays shut" mapping uses `||` and parentheses. The validator reports it as INVALID:
  `safeEvaluateCondition` handles only `&&`, so the mapping never fires. Split it into four mappings.
- D4. The shredder object uses `content` and `stripCount`. The engine supports both.
- D5. No `spriteTalk` on the seven person NPCs (placeholder sprites).
- D6. The brief uses "Miskatonic Halt". That is a Lovecraft name and an *Arkham Horror* place, in the same
  family as the `arkham` warning in §3.11.

## 4. Validator (`--no-graph --skip-ink` on `validate_copy/`)

The script accepts a path outside `scenarios/`. Exit 0. As expected, `social.deduction`, the `deduction`
field on facts and the `triggers` key fail (18 + 1 SOCIAL schema errors and the unknown top-level
`triggers` key). Every other issue:

1. ❌ `case-file` `minigameData.allowSubmit` is undeclared (both boards). Expected: §4.7 adds it in P10-C1.
2. ⚠️ `shredder` has `minigameData` but `minigame-data-schemas.json` has no schema for it. This gap is
   already in the repo, and the plan's file list for P10-C1 does not cover it.
3. ⚠️ An rfid lock requires `d_door_release`, which no item declares (the carriage doors).
4. ❌ The guard's eventMapping `||` condition (D3 above).
5. ⚠️ No `spriteTalk` on 7 NPCs, plus viseme suggestions.
6. ⚠️ The lockpick has no `puzzle_graph_unlocks`. The phone NPC has no `avatar`.
7. ⚠️ The `_note` and `_draft` keys are unknown fields. They are draft notes only.
8. Generic suggestions (VM, PIN, password, patrols, briefing cutscene). These do not apply to a fixture.

Room geometry, door alignment and objective wiring all pass.

## 5. Issues that point at the PLAN

**P1 (major): `se_influence` is not bound in an ordinary person chat, so §7.2's witness costs do nothing.**
- In `person-chat-minigame.js`, `bindInfluenceExternals` is called only from `attachPretext`, which runs
  only when `params.pretextCallId` is set (`:589-595`). `_beginSocialRun` (`:917-922`) starts the ledger
  and binds nothing. Phone chat is the same (`phone-chat-minigame.js:458-466`).
- `ink-engine.js:17` sets `allowExternalFunctionFallbacks = true`, so a plain witness talk calls the ink
  fallback, which returns 0.
- Result: no −15 per question, `wary` never fires, and the kind word does nothing. The witness budget that
  DL6, §9.1 and §9.4 assume never happens in play.
- Person-chat influence today goes through tags (`#influence_lost:15:pressed`, `#influence_gained:20`,
  `chat-helpers.js:603-606`).
- Fix, either way:
  - Have P10 bind `bindInfluenceExternals` in person chat for social characters. This changes
    `person-chat-minigame.js`, which has no owner in §10.3.
  - Or rewrite §7.2 to use the influence tags on a content line (for example a narrator line in
    `charge`), and keep DL6's *recovery choice* (it already accepts the tags).

**P2 (major): §7.2's example breaks two README_ink_best_practices rules.**
- `* [Thank him for the coffee]` is the "once-only" kind word. README lines 201 and 304 say a `*` choice
  comes back after a reload, and once per conversation session. A player can therefore farm the +20 by
  reloading, which undoes "pushing stays a real choice" and DL6's budget.
- `+ [Leave it there] -> END` breaks the hub-return convention (README line 486). It should be
  `#exit_conversation` and `-> hub`.
- The D draft got round both with a VAR guard (`<w>_kind_given`). §7.2 and §9.1 should do the same.

**P3 (major): a faded clue's physical source stays in the room with the clue still in its text.**
- §5.6 and §7.6 gate only the grant (`condition: !deduction_faded_<f>`). After a stop, the rack label,
  Chen's coat and de Vries's phone can still be picked up and read. They still say "ARCHIVE READING ROOM",
  the ward charm and the unregistered SIM, while the board shows "Evidence destroyed".
- The engine already supports `textVariants` and `observationVariants` keyed on a global
  (`utils/conditional-text.js resolveObjectField`). §7.6 should require a variant on each closed source,
  keyed on `deduction_faded_<f>`, or another way to hide it.
- A DL7 ⚠️ could check that a `closedBy` trigger's item has such a variant.

**P4 (major): DL6 ignores knocking out a witness, which combat-on D allows.**
- `ko` is allowed and attacks are on, so the steward and the conductor can be knocked out.
- Without the conductor, D loses `d_sato_pass` (stop 1's only recovery) and `d_devries_pass`,
  `d_volkov_pass` and `d_volkov_want`. Sato then stays undetermined: Courier needs `has archive_pass`, with
  one archive copy unseen against two other hidden pass cells. A strict case can then no longer be solved.
- Without the steward, D loses both `wants_codex` cells and `d_mensah_want`.
- §9.4 does not set `koImmune` on either witness, and DL6, DL11 and the derived sets never treat an `npc`
  route as lost to a KO. The draft added `koImmune: true` as an invented fix.
- The plan should either require `koImmune` on any witness who holds a route in a case with attacks on, or
  make DL6 drop those routes. DL11 currently warns only on `koImmune` suspects.

**P5 (minor): the backup recovery object can later report the kiosk "reinfected".**
- `commitSelection` calls `scheduleDelayedReinfection()` unless `network_isolated === true`
  (`backup-recovery-minigame.js:340-345`). That would set `backup_reinfected` and show a toast on a night
  train.
- §9.4 should declare `network_isolated: true` in D, or say how the object avoids this.

**P6 (minor): §9.4 leaves the carriage door lock type unsaid.**
- A `key` lock can be picked with the starting lockpick. A `pin` or `password` lock needs a code.
- The draft's rfid lock, with no card anywhere, trips the validator's "nothing can open it" warning.
- §9.4 should name the lock and say the warning is expected, or give the validator an "opened by
  eventMappings" exemption to match DL8's rule that "doors opened by an NPC's eventMappings count as
  closed".

**P7 (minor): the "slowing" warning cannot be a field on the stop timer.**
- §9.4 says "each with a hint 30 s before", but the timer dispatcher has no warning field.
- It needs a separate 90 s timer per stop, with `condition: "!globalVars.d_stop_<n>"` so a stop the player
  brought forward does not still warn.
- The `hint` action's default title is "Intelligence Received" (`apply-actions.js:124-128`). That is
  SAFETYNET voice, so §9.4 should give a title.
- §7.6 should say all of this.

**P8 (minor): the door object after its stop is unspecified.** Once the trigger is `once`, a later
"Wait for the stop?" confirm does nothing. §9.4 should give the object an `observationVariants` entry
keyed on `d_stop_<n>`, or hide it.

**P9 (minor): §9.4 lists no `place` strings for D's 12 object and trigger routes.** DL18 requires them
(D1). §4.9 shows them for B, and §9.4's route table should list them for D in the same way.

**P10 (minor): the shredded document has no `minigame-data-schemas.json` entry.** The validator warns on
any scenario that gives one `minigameData`. The P10-C1 file list could add an entry for `shredder` /
`shredded_document` (`title`, `documentTitle`, `content`, `stripCount`, `strips`, `allowRotation`,
`successMessage`, `stateWrites`).

**P11 (note): the conductor's kind word clears `wary` by exactly the margin.**
- −30 + 20 = −10, which is `wary` (−20) plus the default `rearmMargin` of 10
  (`social-influence.js:218`, `>=`). It works with no slack at all.
- DL6's budget rule ("first free, then 15 a question against the `wary` threshold") does not mention
  `rearmMargin`. A scenario that sets a larger margin would pass DL6 but keep the witness wary.
- This only matters once P1 is fixed.

**P12 (note): a careful player never sees a clue destroyed.** Each stop's `deduction_tamper` lists one
fact, and only the first fact not yet held fades. This repeats the draft's own INVENTED.md B7, unchanged.
