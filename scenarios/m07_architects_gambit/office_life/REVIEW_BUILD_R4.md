# m07 office life: build review R4 (delta)

Counts: B0 M0 m2

Reviewed: branch build/ol-m07 at a43fce0b5. Delta 1 is `227a6710e..b6954fc26` (BUILD_LOG, HANDOVER, LIVE_SLICE3, LOG, PLAN: document fixes for R3 and the orchestrator handover). Delta 2 is the merge of main, `b6954fc26..a43fce0b5`, over scenarios/m07_architects_gambit and public/break_escape/js. Read only apart from this file. No server started, no audio, no db.

## Assumptions

- Assumption: the compiled-ink comparison is by parsed JSON equality (compiled to the scratchpad, repo file untouched), not byte equality.
- Assumption: em dashes, US spellings and model names in main's engine comments (merge content) are out of scope; only the build branch's own prose was checked for them.
- Assumption: the E1 attack probe warnings (validator items 13 and 14) are the known baseline and not a change.

## Static checks

- Validator (`--skip-ink --no-graph`): 0 errors, 31 warnings, unchanged from R3.
- Lock and key diff (`ruby scripts/lock_key_diff.rb scenario.json.erb office_life/baseline_locks.json`): empty.
- scenario.json.erb is not in the merge diff (`git diff --stat b6954fc26 a43fce0b5` on it is empty), so R3's scenario checks still hold.
- Ink: `bin/inklecate` on `ink/m07_phone_agent_0x99.ink` compiles with no errors, and the output equals the committed `.json` (parsed JSON equal).
- Delta 1 prose: 0 em or en dashes, no model names, no US spellings in added lines (the one `behavior`-like hit is the schema field list in HANDOVER, a code term). Added lines in main's engine files contain em dashes in comments (npc-manager.js reconcile comment, vm-launcher, objectives-manager); these are main's, not this build's.

## R3 findings

- m1 PLAN.md as-built: closed. The only `<...>` left are `<id>_ko` template forms in the hide mappings (PLAN.md:61 to :63), which are correct. No "Slice N" sentences, no "Open numbers", no fallback 2, header says "as built". Section 0 table matches the built state.
- m2 line numbers: closed for PLAN.md (spot-checked :1823 board, :1995 handover sheet, :2062 Elena, :2095, :2714 to :2720 global block; all match). HANDOVER.md:23 `:1995` is right. One refresh went wrong; see m1 below.
- m3 sign-off: closed. PLAN.md section 0 now says "wording yes conditional on a clean dialogue review and build review" and points at DIALOGUE_SAMPLE.md:3; LOG.md R2 m3 row matches.
- m4 trip timings: closed. BUILD_LOG.md relabelled as wall seconds, compares against 8239 only, says Adaeze's walk home is not shorter and the Gwen stall is "reduced in these runs, not shown to be gone".
- m5 frame time: closed. LIVE_SLICE3.md "Limits" and LOG.md R2 m1 row state only what was measured, say no operator-free reading exists, and drop "no measurable cost" and the "20 fps" claim.
- m6 stale statements: closed. BUILD_LOG.md:3, the `mount_stuck` note and "Not done: m5" each carry a "Resolved, see ..." line that points at real sections.

## Main merge (office-life rows and engine)

- Phone ink: main changed only `submenu_from_hub` handling: three sub-menu knots got a `= menu` stitch after `-> menu`, plus a comment. The office-life rows live in scenario.json.erb (`npc_attacked:adaeze_okafor`, `npc_attacked:gwen_pritchard` at :1417 and :1418, `npc_ko:*` at :1420 and :1427) and set `ops_staff_upset` / `hands_down_said` directly; they do not call any phone knot and none of the touched knots. The `ops_staff_upset`, `adaeze_ko`, `gwen_ko` globals are not referenced by the phone ink diff. No effect.
- npc-hostile.js `applyRestoredStats` and npc-behavior.js: applied once the behaviour has its config, for restored KO and calm NPCs. It sets attackDamage, attackCooldown, attackRange and maxHP only. The operators declare only `leash` and `chaseRange: 200` (scenario.json.erb:1888), so `chaseRange` is not touched and the leash is read from behaviour config as before. A reloaded KO operator gets default combat numbers, as before. No conflict with `globalVarOnKO` (set when KO happens, not at restore).
- npc-manager.js `_reconcile` early return: affects only the flag-task re-announce on game_loaded. The operators' mappings are npc_attacked / npc_ko / conversation_closed / room_entered, which are not flag-task re-announces. No effect.
- person-chat-minigame.js: speakers from rooms not yet loaded now resolve from the scenario, and a display-name tie goes to the conversation's own NPC for every conversation (was social characters only). The only duplicate displayName in m07 is "Director Magnus Netherton" on `opening_briefing_cutscene` and `closing_debrief`, which each now prefer themselves; the operators' names are unique. Display-name prefixes (`Adaeze Okafor:`, `Gwen Pritchard:`) still resolve.
- phone-chat, esd-pushbutton, vm-launcher, objectives-manager, test-bridge/state.js: nothing in the office-life setup uses them (no `seat: "stand"`, `useFrom`, `needs` or `globalVarOnKO` logic touched). Not run live.

## Findings

### m1 (minor): HANDOVER.md:57 line reference was "refreshed" to a wrong number

HANDOVER.md:57 now says HaX's `room_entered:server_room` mapping is at `~:1141`. The mapping that sets `server_hall_reached` is at scenario.json.erb:1134 to :1137 (`setGlobal` at :1136), which is what the text said before R3. `:2692` for the declaration is right. LOG.md R3 m2 says this reference was refreshed, so the log is also slightly off.
Fix: change `~:1141` to `~:1136`.

### m2 (minor): HANDOVER.md orchestrator state is behind the tree

HANDOVER.md "Orchestrator state, 18 Nov 2026" says "Main merged at 56930fb23" and lists "merge main again" as next; the tree is now at a43fce0b5 with that merge done (main 7ca2df60d), and R4 is this review.
Fix: update the tip, the main hash and the Next line when R4 is fixed.

## Checked and fine

- All six R3 closures read from the diff, with no new errors in the changed text; counts and ids quoted in LOG.md (R3 table, game ids 8239, 8247, 8260) agree with BUILD_LOG.md and LIVE_SLICE3.md.
- PLAN.md values spot-checked against the scenario (thirst 40 and 55, `chaseRange` 200, global block, board, Elena, hide mappings).
- Compiled phone JSON matches its ink after main's change.

## Not checked

- Live behaviour of the merged engine with the m07 operators (no server by brief); the restore, reconcile and person-chat changes were read, not run.
- The non-skipped validator ink phase and the full ink compile of the other m07 files (only the phone file changed in the merge).
- Audio: none exists.
