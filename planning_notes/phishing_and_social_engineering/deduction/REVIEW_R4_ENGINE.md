# Review R4: engine feasibility and code accuracy

Target: `DEDUCTION_IMPLEMENTATION_PLAN.md` after the round 3 edits (file dated 2026-10-22 17:56). Read-only
review, 2026-10-22. Paths are under `public/break_escape/js/` unless they start with `app/`, `scripts/`,
`test/`, `scenarios/` or `README`. Plan line numbers are from the file as it stands. Code line numbers are
from the working tree on the same date; other agents are editing it (`systems/inventory.js` has an
uncommitted hunk).

## Part A: round 3 engine findings, and a regression spot-check

| id | closed | evidence (plan line; code file:line) |
|---|---|---|
| R3E-1 | yes, one gap | §1 l.66-67, l.88-89; §3.9 l.325-338; §4.1 l.447-448; §6.3 l.1317; DL9(g) l.1760; §13.1 l.2791; §13.4 l.2847-2849. Matches `game.rb` `calculate_task_score` (`:54-61`), `raw_task_score` (`:64-71`), `mission.rb` `scoring_mode` (`:87-90`). D's 65 % is right for two tasks in one aim (`total_tasks` and `total_aims` at `game.rb:2954-2955`; a skipped task still lets the aim complete, `def skip_task!` comment `:1466-1472`). The gap: DL9(g) has no way to read `mission.json` from inside the social validator (R4E-3) |
| R3E-2 | partly | §5.4 l.970-982, §7.10 l.1660-1667, DL9(h), fixture D l.2302-2305 and l.2324-2329, AP-2. The header part is right: `handleMissionConcluded` opens the visualiser with `bondVisualiserOpts` (`systems/objectives-manager.js:1098-1121`), `nextCreditsText` keeps an open-without-credits header and drops it when credits arrive without one (`music/credits-theme.js:144-154`), so the loss entry's "MISSION FAILED" replaces "CASE CLOSED", and the reload shows "CASE CLOSED". But on the default theme the ticker still reads "MISSION COMPLETE … WELL PLAYED, AGENT" (R4E-1) |
| R3E-3 | partly | (a) l.1087-1090, l.1097-1100: tasks recorded as `t:<taskId>` by `taskIndex[id].status`, which matches `completeTask` reverting to `active` (`objectives-manager.js:551-596`) and `skipTask` reverting to the previous status (`:654-685`). (c) the `finishing` flag, l.1073-1074. (b) is not closed: `c:<sid>` is still recorded in step 2, before that suspect's collected `complete_task` entries run in step 3 (R4E-4) |
| R3E-4 | yes | §5.5 l.1069-1073, §6.7 l.1400-1401, §11.3 l.2643. `window.player.disableMovement` is read by `core/player.js:1008`. One interaction with the success screen is not covered (R4E-5) |
| R3E-5 | fixed, with a regression | l.1065-1067, §11.3 l.2646. The reload rule re-offers the panel to a player who already chose "See the debrief" (R4E-2) |
| R3E-6 | yes, one gap | §5.3 l.924-936, §10.1 P10-G, §10.3 l.2540, §11.2 l.2581-2585. The denylist is as cited (`minigames/person-chat/person-chat-pending-reply.js:10-18`), and the flush is called from `cleanup()` (`person-chat-minigame.js:1872`), the knot jump (`:1832`) and `beforeunload`/`pagehide` (`:1130-1137`). The gap: the "fast" batch is assumed to finish synchronously, and `#grant_fact` as specified awaits (R4E-6) |
| R3E-7 | yes | `game.rb` and validator pointers are now anchors (l.1084-1085, l.1136, l.1165, l.1222-1224, P10-C1). Each resolves: `def skip_task!` `game.rb:1473`, `def filtered_scenario_for_bootstrap` `:764`, `def conclude_mission!` `:3084`, `known_top_level = %w[` `validate_scenario.rb:282`, the strict-social line `:5560`, `return issues unless json['social']` `validate_social.rb:68`. The only remaining number (`game.rb:764-793`, l.2953) is round 2 history |

**Regression spot-check of R1E and R2E fixes after the round 3 edits.** No regression found. Checked:
`chat-helpers.js` `processGameActionTags` still `async` at `:27`, `#report` at `:607`,
`applySocialInfluenceTag` at `:642`, report branch at `:660`, `npc_became_hostile` emit at `:279` (R1E-1,
R2E-12); triggers armed on `game_loaded` (`core/game.js:2242`, inventory restore `:2201`, R2E-2); the
ending global last (step 4, R2E-3); tasks awaited one at a time and not through `applyActions`, whose
`complete_task` does not wait (`apply-actions.js:76-84`, R2E-5); the debrief not waiting for the sync
(R2E-6); retry clearing `deduction_closed` and the outcome globals (R2E-7); the runtime's static import of
`social-intel.js` (R2E-11); both installers idempotent (R2E-10); `evaluateGlobalCondition` at
`utils/global-condition.js:58` (R1E-15); `npc_ko` after `dropNPCItems` (`npc-hostile.js:338`, emits
`:348-352`, R1E-9/R2E-4); hidden NPCs skipped by combat (`player-combat.js:419-421`); intel-board anchors
(`:53`, `:112`, `:139`, `:754`, `:765`, `:772`); starter (`minigame-starters.js:1145`, `:1155`); the
case-file branch (`interactions.js:1068-1070`); `syncConfirmed` (`state-sync.js:472`, at the js root,
not under `systems/`, which the plan does not claim); `room_entered:<room>` (`core/rooms.js:3015`).
Citation drift in `systems/inventory.js` only (R4E-9).

## Part B: fresh pass

These checks confirmed the plan and raise no finding:

- Scoring: `calculate_score` falls through to `calculate_task_score` unless the Hacktivity listing says
  `flags` (`game.rb:74-90`); `conclude_mission!` recomputes the score at conclusion (`:3109`); a skipped
  task never satisfies `concludeRequires.tasksCompleted` (`:1470`, `:3136-3139`), which DL22 covers.
- `stakes.scoreLine` is author-stated because the client never reads `mission.json` (no client code reads
  `scoring`); B's `completion`, A/C/D's default `tasks` and the §9.5 row agree.
- The credits path: an entry with `credits` suppresses the victory auto-open and opens only after
  `/conclude` agrees (`music/scenario-music-events.js:108-113`, `:159-180`); `/conclude` on an already
  concluded game returns `already: true` and never refuses (`game.rb:3088-3099`), so step 4's credits
  still roll after a step-3 conclusion. A second `BondVisualiser.open` with credits injects them into the
  open overlay (`music/bond-visualiser.js:1629-1633`).
- `creditsTheme` (enum `safetynet`, `cyber`) and `bondVisualiserOpts` (open object) are in the schema
  (`scripts/scenario-schema.json:41-45`, `:2339-2343`), so DL9(h)'s data is expressible.
- The spike scenario: `db/seeds.rb` picks up any directory with `scenario.json.erb` and takes
  `collection` from `mission.json` (`:27-71`); removing the directory later leaves an orphan row that
  seeding only prunes on a typed confirmation or `BREAK_ESCAPE_PRUNE=1` (`:110-138`), which matches "the
  seed row removed" by the orchestrator. `tools/playtest/new-game.rb` exists.
- F3's success-screen half: `awareness_e1_invoice_fraud` has a `success` conclusion screen and a
  `concludeRequires` block, so the gate and the idle wait can be exercised there.

| id | severity | plan line | finding | evidence | fix |
|---|---|---|---|---|---|
| R4E-1 | major | §5.4 l.973-977; §7.10 l.1664-1667; DL9(h) l.1760; fixture D l.2302-2305, D-fail bridge l.2326-2329; §12 risk 15 l.2776; also A l.2026 and C l.2169 | A neutral `headerText` does not stop a lost case showing "MISSION COMPLETE" on the default theme. The `safetynet` theme's `overlay()` returns null, so the visualiser keeps its built-in footer ticker, "██ MISSION COMPLETE ██ … ENTROPY CONTAINED … WELL PLAYED, AGENT ██", on the conclusion screen, under the loss credits and again on reload. Only a scenario-level `creditsOverlay.ticker` replaces it, and a credits entry cannot. DL9(h) passes D as written, and the D-fail bridge's "no MISSION COMPLETE at any point" fails as soon as it reads the overlay text. That breaks the user's Q4 ("no MISSION COMPLETE … on a loss"). The same applies to A and C, which are also on the default theme. A smaller wrinkle: the `cyber` theme that DL9(h) accepts sets the STATUS row to "COMPLETE", the word the header check bans. That reads as neutral ("review complete"), but the rule should say why one is allowed and the other is not | `music/bond-visualiser.js:244` (built ticker), `:140` (built header); `music/credits-theme.js:56` (`safetynet` `overlay: () => null`), `:84`, `:89` (`cyber` heading and `status: 'COMPLETE'`), `:117-133` (`scenarioCreditsOverlay`); `music/bond-visualiser.js:1506-1531` (`_applyTheme`, `_applyScenarioOverlay` replaces the ticker only when given); `README_scenario_design.md:216` (`creditsOverlay`) | Extend DL9(h): on `safetynet` (the default), a strict or costly case also needs `creditsOverlay.ticker` with none of "COMPLETE", "SUCCESS", "WELL PLAYED" (`creditsOverlay.operation` is optional). State that `cyber`'s fixed "COMPLETE" STATUS is accepted. Add the ticker to A, C and D's data (for example `["CASE CLOSED", "<mission name>"]`), to §7.10's rule, to the D-fail bridge's checks (header, ticker, and no victory playlist), to P10-F3's list ("the ticker under both themes"), and to the DL9 bad-case list in §11.5 |
| R4E-2 | major | §5.5 Retry l.1058-1067; unsettled Finish l.1097-1100; §4.5 l.597-598; §11.3 l.2644-2647 | The round 3 reload rule re-offers the retry after the player has seen the truth. "See the debrief" writes nothing. `debriefSeen` is set only in Finish step 5, and `retryUsed` only by "Try again". So if the player picks "See the debrief" and then reloads before Finish, the board reopens on the retry panel ("if those same retry conditions still hold") with the answers already shown. The same happens without a reload when Finish stops on an unsettled task (`debriefPending` stays true): the next load offers the retry. That reverses the R2D-3 settlement ("A retry after the answers are shown is no test", §13.3) | plan l.1065-1067 (reload rule), l.1095 (`debriefSeen` set only in step 5), l.1062-1064 (`retryUsed` set only by "Try again"); `retryCall` is the only writer named | "See the debrief" sets `retryUsed: true` (or a new `retryDeclined`) in `deduction_state`, then syncs, **before** the debrief view renders. The load rule then checks it. Add a §11.3 case: "See the debrief", reload: the debrief reopens, never the panel; and the same after a stopped Finish. Note it in §6.7 |
| R4E-3 | minor | DL9(g) l.1760; §11.5 l.2697-2698; P10-C1 and P10-C2b rows (§10.1), §10.3 | DL9(g) reads "`mission.json` beside the scenario", but the social validator is never told where the scenario is. `ValidateSocial.check(json, repo_root:, valid_item_types:, imports:, raw:)` builds a `Context` with no path, and `validate_scenario.rb` calls it with the rendered JSON only. The validator test pattern the plan names (`validator-social-pretext.test.mjs:48-68`) calls `ValidateSocial.check` through `ruby -e` with a JSON string, so "a `mission.json` beside the temp scenario" has nothing to sit beside. P10-C2b owns DL9 but may not edit `validate_scenario.rb`, and P10-C1 may edit only its two places there | `scripts/validate_social.rb:22` (`Context` fields), `:58-60` (`check` signature); `scripts/validate_scenario.rb:5483-5484` (the call); `:5404-5406` (where the scoring check already reads `mission.json` from `File.dirname(erb_path)`) | Add a `scoring:` (or `mission:`) keyword to `ValidateSocial.check` and the `Context`, default `nil` meaning `tasks`. Pass it from the call at `validate_scenario.rb:5483` using the `mission.json` already parsed for `check_mission_scoring`. Give that call-site line to P10-C1 as a third place, and have the DL9(g) tests pass `scoring:` directly |
| R4E-4 | minor | §5.5 Endings steps 1-3 l.1076-1090, l.1100 | R3E-3(b) is only partly closed. Step 1 skips any suspect already marked `c:<sid>`, and step 2 writes `c:<sid>` as soon as that suspect's **non-task** actions have run. Its collected `complete_task` entries run later, in step 3. So after a reload in step 3, or after a Finish stopped by an unsettled task, the next run never collects that suspect's tasks again. They are never called and never counted as unsettled, so Finish goes on to step 4 with them missing. Escalation steps (`e:<n>`) holding a task have the same problem. Separately, the settled check `objectivesManager.taskIndex[id].status` throws for an unknown task id | plan l.1076-1080 (collection gated on `c:<sid>`), l.1079-1080 (`c:` written in step 2), l.1100 ("skips every suspect … already recorded"); `objectives-manager.js:551-553` (`completeTask` returns silently for an unknown id) | In step 1, always collect task actions, filtered only by `t:<taskId>`, and let `c:<sid>` / `e:<n>` gate the non-task actions alone. Use `taskIndex[id]?.status`, and treat a missing task as a validator error (DL14 already checks task ids) rather than as unsettled. Add a §11.3 case: a per-suspect `complete_task`, a reload between step 2 and step 3, and the task runs on the next Finish |
| R4E-5 | minor | §5.5 l.1071-1073, l.1095, l.1098; §11.3 l.2641-2642 | Giving movement back can race the success screen and leave the player frozen. For a training case (fixture B), step 3's conclusion task makes the server report `missionConcluded`, and `showSuccessScreen` opens after 1 s idle. When it opens it saves `movementBefore = !!player.disableMovement`, and it restores that value on Close. If step 5 hands movement back only after its awaited sync, and that takes longer than the idle second, the screen saves `true`. The runtime then sets `false` under the screen, and Close puts it back to `true`, so a player who closes the screen to look round cannot move | `ui/success-screen.js:34` (`IDLE_MS = 1000`), `:60-80` (idle wait), `:192-195` (saves and disables), `:94` (restores on Close) | Give movement back synchronously, straight after step 4's `applyActions` and before any await in step 5. The unsettled path does the same before its toast. Restore only if the runtime set the flag itself (remember the previous value, as the success screen does). Add a §11.3 case with a stub success screen and a slow sync |
| R4E-6 | minor | §5.3 tag table l.904-908; flush note l.930-936; §11.2 l.2571-2585 | `#grant_fact` breaks the invariant that commit 4af6a328 depends on. Both the display path and the flush run a reply's "fast" tags in one `processGameActionTags` call and rely on it finishing synchronously. Only `give_item` and `remove_npc` are split out as slow, because the loop awaits each tag in turn. As specified, `#grant_fact` does `await import(...)`, so every tag after it in the same reply runs at least a microtask later. In a `beforeunload`/`pagehide` flush those tags can be lost while the saved ink position says they ran, which is the bug class that commit fixed (its R8 m3 and R10 m2 notes). If the `#deduction_favour` and `#verdict_close` cases await `doFavour()` or `close()`, they do the same. The plan's own note at l.931-934 states the risk but does not avoid it | `person-chat-minigame.js:1176-1199` ("the tags that never wait run first, in one call that finishes synchronously"), `:1229-1239` (display path); `person-chat-pending-reply.js:36-45` (`SLOW_TAGS`); `chat-helpers.js:27`, `:55` (awaits per tag) | Specify that none of the new cases awaits. `#grant_fact` calls `window.deductionRuntime.grantFact(id)` when the runtime is installed (it already imports `social-intel.js` statically), and otherwise `import(...).then(...)` without `await`. The verdict, close and favour cases call the runtime and do not await it. Add a §11.2 case: in `#grant_fact:x #set_global:y:true`, `y` is set in the same tick |
| R4E-7 | minor | P10-F3 row l.2442; spike scenario l.2427-2434 | P10-F3 cannot run its visualiser-reload check on the scenarios it names. `test_finale_calls_credits` has a `missionConclusion` aim but no `conclusionScreen` and no `concludeRequires`. A `conclusionScreen` added from the console is lost on reload, because the reload replays the server's copy (`main.js:157-166` reads `window.gameScenario`). So "a `bond_visualiser` conclusion screen with `bondVisualiserOpts.headerText` and with the `cyber` theme, then a reload" cannot be observed there. (The `concludeRequires.globals` gate is fine on `awareness_e1_invoice_fraud`.) | `grep conclusionScreen scenarios/test_finale_calls_credits/scenario.json.erb` (none); `main.js:157-166` | Add a conclusion aim with `conclusionScreen: bond_visualiser` plus `headerText`, and two credits music entries on one trigger (one on `mission_failed`), to the untracked spike scenario. F3 then waits for F1 and plays both themes there by switching `creditsTheme` between two seeded runs. Or name `lab_social_engineering` read-only, which has both a `bond_visualiser` screen and a `creditsTheme` |
| R4E-8 | minor | §5.5 l.1102-1104 ("On load with `debriefPending` true … reopens the debrief"); "The debrief, once" l.1106-1109 | On a reload between the step-3 conclusion and step 5, two things open on `game_loaded`. `main.js` replays the conclusion screen, and the runtime reopens the debrief. The visualiser is at z-index 200000 and pauses the Phaser scene, and it is not a minigame, so `busy()` lets the debrief open underneath it. The player sees "CASE CLOSED" first, and after closing it finds a debrief whose Finish then rolls the credits a second time. It works, but nobody has decided it | `main.js:157-166`; `music/bond-visualiser.js:1260` (z-index), `:1624-1626` (scene paused), `:1788` (`isOpen()`); `ui/success-screen.js:44-47` (`busy()` checks only `MinigameFramework.currentMinigame`) | In `openDebrief`, also wait while `window.BondVisualiser?.isOpen()`. Add one §11.3 line: reload with `debriefPending` and `missionConcludedAt` both set, and the debrief opens after the visualiser closes |
| R4E-9 | minor | §5.2 l.849, l.886-887; §5.4 l.952; §1 l.90 | Citation drift in `systems/inventory.js`, which another agent is editing: `item_picked_up` is at `:655`, not `:627`; `removeFromInventory` at `:926` (window export `:1004`), not `:898`; the key ring at `:699-720`, not `:668-692`; `processInitialInventoryItems` starts at `:119` but now holds a new notes-restore hunk (`:129-131`, `restoreNoteFromSave` `:262-278`, "no item_picked_up"). The behaviour the plan relies on is unchanged | as listed; `git diff HEAD -- public/break_escape/js/systems/inventory.js` | Cite by anchor (`export function removeFromInventory`, `addKeyToKeyRing` / `keyRing`, the `item_picked_up:${sprite.scenarioData.type}` emit), as R3E-7 did for `game.rb` |

## Part C: integrity

- **§5.1–§5.11** are all present, in order and complete (l.790-1240), with no duplicated or cut-off
  paragraph. The new round 3 text (§5.3 "The pending-reply flush", §5.4 "The conclusion screen on a
  loss", §5.5's Retry reload rule and the Endings failure path) reads straight through. The cross-references
  §5.5 "Endings", "The debrief, once", "Knockouts" and "Pending foes", §5.7, and §5.10's `Triggers.check`
  placement all resolve.
- **§14** is complete and consistent. The round 3 count rows match the outcome rows: engine 0/2/5 =
  R3E-1 to 7; design 1/5/14 = R3D-1 to 20 (R3D-1 blocker, R3D-2 to 6 major, R3D-7 to 20 minor);
  integration 1/1/12 = R3I-1 to 14. Rounds 1 and 2 are unchanged, and the four "superseded" markers are in
  place (l.2893, l.2897, l.2902, l.2906). There are no duplicate ids outside the intended "reopened"
  table.
- **Stale or inconsistent lines a builder could trip on:**
  - P10-K-B's "After" column still says `P10-C2` (l.2485), but C2 was split into C2a and C2b (R3I-12). It
    should read `P10-C2b, P10-Q0`.
  - §12's closing line says "Spikes write findings to the build log … before wave 2 starts" (l.2780). §10.1
    now says the orchestrator writes them before **wave 1** starts (l.2421-2425, R3I-5).
  - §12's risk table runs 13, 15, 16, 14 (l.2774-2778). Move 14 up.
  - §4.1's comment on `retry` still calls the button "Try the call again" (l.450), but the panel's fixed
    string is "Try again" (§6.3 l.1332).
  - §14's round 3 prose (l.3041-3044) says `DECISIONS_PENDING.md` was left unchanged and still describes
    retry as a debrief button. The file now has the bold "Answered … §13.1 is authoritative" header (dated
    17:57), so that sentence is out of date. The file's first paragraph still says "The plan's §13.2
    holds the same list". That is the orchestrator's file, and a one-word change ("§13.1") would finish
    it.
  - §13.4 ends "There are no open questions for the user at this point" (l.2859), while AP-1 and AP-2 are
    `Pending` in `APPROVAL_LOG.md`. They are approvals, not questions, but a pointer ("two deferred
    approvals, AP-1 and AP-2") would stop a reader thinking nothing is waiting on the user.
  - The line that starts `#verdict_close\`` at l.2165 is a wrapped continuation inside fixture C's
    stakes paragraph, not a heading (no space after `#`). It renders as text.

## Verdict

Every round 3 engine finding was acted on, and four of the seven close cleanly against the code
(R3E-1 with one gap, R3E-4, R3E-6 with one gap, R3E-7). No R1E or R2E fix regressed. Three closures need
more work. R3E-2's neutral header leaves the default theme's "MISSION COMPLETE … WELL PLAYED, AGENT"
ticker on a lost case (R4E-1). R3E-5's reload rule re-offers the retry after the truth has been shown
(R4E-2). R3E-3(b) still loses a suspect's collected tasks after a partial Finish (R4E-4). The rest of the
new findings are mechanical: DL9(g) has no path to `mission.json` (R4E-3); movement and the success screen
race (R4E-5); `#grant_fact`'s await breaks the synchronous fast batch that the pending-reply flush depends
on (R4E-6); F3 cannot observe a reload of the conclusion screen (R4E-7); the reload between conclusion and
Finish opens two screens (R4E-8); and `inventory.js` citations have drifted (R4E-9). Each has a local fix
inside Phase 10's owners, except R4E-3, which needs one extra call-site line for P10-C1.

Counts: part A, 7 round 3 findings checked: 4 closed (two with gaps raised as new findings), 2 partly
closed (R3E-2, R3E-3), 1 closed with a regression (R3E-5); no R1E/R2E regression. Part B: 0 blocker,
2 major (R4E-1, R4E-2), 7 minor. Part C: §5 and §14 intact; 6 stale or inconsistent lines (K-B's `P10-C2`,
§12's wave, risk order, "Try the call again", the `DECISIONS_PENDING.md` sentence in §14, §13.4's "no
open questions").
