# m02 Ransomed Trust — Decision Weight & Enacted Consequence Plan (v2)

> Goal: make the player's choices act on the game world during play, not just get
> tallied in the closing debrief. Grounded in mechanics proven in `sis01_healthcare`.
>
> **v2 incorporates a technical review.** Corrections from that review are marked ⚠️.
> The headline change: the on-screen slow-path countdown is **not buildable on the
> current engine without a small patch** (`timerRef` is unimplemented; the countdown
> widget ignores `startOnGlobal`). Two viable options are documented in Phase 1 — this
> is the one decision that needs the author's call before implementation.

## Implementation complete (2026-08-18)

All phases shipped and validated (`ruby scripts/validate_scenario.rb` clean; ink compiles; critical
path unchanged at 4 hops). Two backward-compatible engine patches were required:

1. **`js/ui/scenario-timer.js`** — `ScenarioTimerUI` now honours per-timer `startOnGlobal` start
   times, so the Bed 4 slow-path countdown appears only after the offline recovery is chosen
   (previously the widget was `startOnGlobal`-blind). Single-start timers (all of sis01's) unchanged.

2. **`js/systems/npc-manager.js` `safeEvaluateCondition`** — now supports `&&` and `!` in NPC
   eventMapping conditions (previously single-comparison only). **This was a pre-existing engine bug**:
   compound conditions such as this scenario's Reeves press-terminal ambush
   (`!globalVars.insider_identified && !globalVars.insider_confronted`) and m01's KO-resilience
   cutscenes were silently evaluating to false and **never firing**. The fix mirrors the already-
   shipped timer/textVariant evaluators and is backward-compatible (single conditions evaluate
   identically; only previously-dead compound conditions now work as authored). Side effect worth
   noting to QA: the Reeves ambush now actually fires, and compound NPC-eventMapping conditions
   across other scenarios (m01/sis01/sis02/…) become live — this is the authors' intended behaviour,
   but is a cross-scenario behavioural change and should be spot-played.

**Phase notes / scope calls:**
- Manual save lives in Mr Pryce's ink (branch-gated on `patient_bed4_state`), so it can't be
  pre-empted by talking to him early. The nurse rush is cosmetic (no auto-save) — the save is the
  player's agency, or fast recovery.
- Debrief split combined (4 h, `ward_recovering`) from offline-only (12 h) — combined was previously
  mislabelled as a 6-fatality manual restore; also fixed the matching `final_reflection` line.
- Phase 5 kept as non-interrupting handler texts (four-way, mirroring the debrief) rather than a
  video-call, to avoid clobbering Ghost's `on_recovery_console` call. Exposure/Gary reactions left
  to the debrief (fires immediately after the press terminal; a live beat would collide with it and
  the ambush).
- Phase 6 low-risk: base evidence package + completion tag fixed; corroborating lines + tone scale
  with what was collected.

## Baseline established (2026-08-18)

`TESTING_WALKTHROUGH.md` was re-validated as the pre-implementation baseline. Validator passes;
critical path unchanged (4 hops). It now carries a **"Regression invariants"** checklist — the
load-bearing things this plan must not break (press-terminal gates, the `decide_hospital_exposure`
→ ambush trigger, Reeves `setVisible` only on the arrested path, the five `cover_restored` routes,
KO fallbacks, and the existing Ghost `on_recovery_console` call). Re-run the walkthrough skill after
implementation and diff against that baseline.

## Design constraints (from the brief)

1. **Never gate overall mission success on a timer.** Completion stays governed by the existing
   `restore_hospital_systems.requiresCompleted` list (task IDs only, `scenario.json.erb:438-446`).
   Verified: no timer or patient global feeds that list.
2. **Use timers sparingly.** No global session clock. Timers appear in only two forms:
   - **Invisible progress timers** (`showCountdown: false`) that quietly worsen the ward so the
     environment feels alive — cancelled the instant the recovery decision is logged.
   - **At most one short, visible pressure window** on the deliberately-slow recovery path — see
     Phase 1 for why this needs an engine decision.
3. **Losses, never game-over (sis01 model).** Timers only ever write `patient_bedX_state`. A patient
   can be lost on the slow path; the mission continues "with losses" and the debrief owns it.

## Reference mechanics — verified against sis01 + engine

| Mechanic | Status | Anchor |
|---|---|---|
| Top-level `timers` (`delayMs`, `condition`, `setGlobal`, `showCountdown`, `onceOnly`, `startOnGlobal`) | ✅ real; parser `js/ui/scenario-timer-dispatcher.js:20-97` | sis01 `:509-570` |
| `condition` cancels a timer at fire-time (no separate cancel field needed) | ✅ confirmed `scenario-timer-dispatcher.js:107-122` | sis01 `bed4_deterioration_1 :518` |
| `textVariants` / `observationVariants` keyed to `globalVars.*` — works on **any** readable (incl. `type:"notes"`) | ✅ real; `js/utils/conditional-text.js:110` | sis01 `:1328-1364` |
| Patient NPC `bark`/`barkDelay`/`targetKnot` on `global_variable_changed:<var>` (bark at distress, silent at critical) | ✅ real | sis01 `:874-897` |
| Roaming nurse `patrolOverride`/`setPatrolSpeed`/`setDwellMultiplier` | ✅ real; `js/systems/npc-manager.js:416-419, 572-619` | sis01 `:804-843` |
| Reaction scene `conversationMode: person/phone/video-chat` + `targetKnot` | ✅ real; m02 already uses `video-call` `:983` | sis01 `:653-682` |
| `setVisible:false` via eventMapping | ✅ honoured; `npc-manager.js:595-598` | sis01 `:2043` (true only, false branch implemented) |
| ⚠️ `timerRef` inside `minigameData` to surface a countdown in-object | ❌ **NOT implemented** — renders nothing. sis01 `:2366` is a "forward annotation" comment, not code. **Do not use.** | — |
| ⚠️ `startOnGlobal` + `showCountdown:true` (dormant visible timer) | ❌ **widget is `startOnGlobal`-blind** — `ScenarioTimerUI` counts from scene start (`js/ui/scenario-timer.js:25,213`). Leaks at mission start, reads `00:00` when wanted. Dispatcher fires correctly; only the *display* is broken. | — |
| ⚠️ `condition` grammar | supports `&&`, `===`/`!==`, `<`/`>`/`<=`/`>=`, single `!globalVars.X`. **No `||`, no `!(...)`.** Split any OR gate into separate timers/mappings. | `scenario-timer.js:128-194` |

---

## Decisions locked (v3)

1. **Visible slow-path window = YES (Option B).** Small `ScenarioTimerUI` patch for a real
   deferred-start on-screen countdown. See "Engine patch" below.
2. **Two patients involved**, with a division of roles:
   - **Bed 4 / Mr Pryce (ventilator)** = the *triggered-countdown + manual-intervention* patient.
     On the slow path a visible countdown opens; the player must **manually intervene** at the
     bedside to save him, or he is lost. This is the enacted-agency climax.
   - **Bed 2 / Mrs Hargreaves (ECMO)** = *ambient* deterioration — worsens visibly during play to
     make the ward feel alive, recovers when the incident resolves. No death state (keeps the loss
     surface legible: one savable life on the line, one visibly-suffering patient).
   - Ms Chen (Bed 5) = alert witness, dialogue only.
3. **Evidence (Phase 6) = low-risk:** fixed package + scale tone. No debrief rewrite for Phase 6.
4. **Nurse KO = keep shared `ward_nurse_ko`.** All nurse reactions guard on it; KO'ing either nurse
   reads as "ward nursing is down" and mutes both.

## New global variables

```
"patient_bed4_state": "stable",      // Mr Pryce (ventilator) — savable loss machine
"patient_bed4_deceased": false,
"bed4_critical": false,              // dedicated boolean: startOnGlobal for the critical->deceased chain
"bed4_manually_stabilised": false,   // set by the manual-intervention action; cancels the death chain
"patrol_nurse_at_bed4": false,       // bridge: nurse arrival -> patient_bed4_state:"attended" (sis01 pattern)
"patient_bed2_state": "stable",      // Mrs Hargreaves (ECMO) — ambient only, no death
"ward_recovering": false,            // set on backup_recovery_source -> ward flips crisis->recovering
"slow_path_window_open": false       // set ONLY on offline_keys_only branch; opens the visible window
```

⚠️ **Cut from v1:** `ward_first_entered` (never set — count drift from scene start like sis01) and
`reeves_escaped_visible` (redundant — use existing `insider_asset_escaped`). `patient_bed2_deceased`
is intentionally **not** added — Hargreaves never dies.

## Engine patch (Option B — additive, backward-compatible)

`js/ui/scenario-timer.js` currently sets `startTime = Date.now()` at scene construction (`:25`) and
ignores `startOnGlobal`, so a deferred visible timer leaks at mission start and clamps to `00:00`
when wanted. Patch: have `ScenarioTimerUI` read the **per-timer start time the dispatcher already
tracks** (`scenario-timer-dispatcher.js:35-52`) for timers that declare `startOnGlobal`, and exclude
such timers from the "next event" selection until their global has fired.
- **Backward-compatible:** timers without `startOnGlobal` (all of sis01's countdown timers) keep
  counting from scene start unchanged — no regression to sis01 or any shipped scenario.
- Only affects the display of `startOnGlobal + showCountdown:true` timers, which nothing ships today.

---

## Phase 1 — Time pressure, applied sparingly

**Intent:** give the recovery trilemma teeth without a session-long clock.

- **Invisible ambient drift (Bed 2, proven):** one top-level timer, `showCountdown: false`,
  counting from scene start (no `startOnGlobal`, per sis01 `bed4_deterioration_1`), long `delayMs`,
  `condition: "!globalVars.ward_recovering"`, `onceOnly: true`,
  `setGlobal: { patient_bed2_state: "distressed" }`. Mrs Hargreaves visibly worsens while the
  player works; recovery resolves her. Never fatal. Makes the ward feel alive without a clock.

- **The visible slow-path window (Bed 4, Option B — LOCKED):** the enacted-agency climax.
  1. On `offline_keys_only`, the recovery-console mapping sets `slow_path_window_open: true`.
  2. A **visible** timer (`startOnGlobal: slow_path_window_open`, `showCountdown: true`,
     `label: "Bed 4 — critical"`, `delayMs` ~90–120 s, `onceOnly: true`,
     `condition: "!globalVars.bed4_manually_stabilised"`,
     `setGlobal: { patient_bed4_state: "critical", bed4_critical: true }`) starts the countdown —
     rendered correctly by the engine patch above. The player sees a clock **only here**.
  3. ⚠️ **critical→deceased chain:** a second timer keyed off `bed4_critical` (dedicated boolean,
     **not** `patient_bed4_state`), short `delayMs`,
     `condition: "!globalVars.bed4_manually_stabilised && !globalVars.ward_recovering"`,
     `setGlobal: { patient_bed4_deceased: true }`.
  4. **Manual intervention (the save):** the bedside **Ventilator Panel** (net-new interactable,
     Phase 2) exposes a "switch to manual ventilation / stabilise" action that sets
     `bed4_manually_stabilised: true`. That flips the condition on both timers above, cancelling
     the critical/death escalation and moving Pryce to an `"attended"`/`"stabilised"` state. The
     player physically acts to save him inside the window — agency, not spectatorship.
     - Engine support confirmed: objects set globals on interaction (sis01 `onRead:{ setVariable }`
       `:1153`). MVP = an interactable action + `setGlobal`. Optional richer version = a short
       "manual ventilation" minigame; not required for v1.
  5. Fast paths (ransom / combined) never set `slow_path_window_open`, so no clock, no risk to Pryce.

- ⚠️ **Backup Power Indicator** (`:1631`): **drop the `timerRef` idea** (unimplemented). Give it
  `textVariants` on `ward_recovering` (static "12 h — critical load" → "recovering") and a plain
  text pointer to the on-screen window during the slow path. No live figure in-object.

- ⚠️ **`slow_path_window_open` setter:** add `"slow_path_window_open": true` to the existing
  `offline_keys_only` branch of the `backup_recovery_source` mappings (`:919-925`).

## Phase 2 — Patient deterioration visible on the ward

**Intent:** state changes are seen and heard in the bay, not reported 48 h later.

- **Bed 4 / Mr Pryce:** stable → distressed → critical → deceased, driven by the Phase 1 window,
  cancelled by `bed4_manually_stabilised` (the save) or `ward_recovering`.
- **Bed 2 / Mrs Hargreaves:** stable → distressed (ambient drift), recovered by `ward_recovering`.
  No critical/deceased states.
- ⚠️ **Ventilator Panel is net-new AND the intervention surface.** The ward has no ventilator/monitor
  object today (Pryce's screen is "dark"). Add an **interactable** Ventilator Panel at Bed 4:
  `textVariants` / `observationVariants` keyed to `patient_bed4_state` (alarm escalates; on
  `deceased` → "NO SPONTANEOUS EFFORT / VENTILATOR CONTINUES"), **plus** the manual-stabilise action
  (Phase 1.4) that sets `bed4_manually_stabilised`. Add a simpler ECMO readable at Bed 2 for the
  ambient state. No new art.
- Patient NPC `eventMappings` on `global_variable_changed:patient_bed4_state`: bark at distressed
  ("Nurse… the machine…"), **silent** at critical (targetKnot only), per sis01 convention.
- **Ms Chen** (alert witness) gets dialogue-only reaction knots as the beds around her worsen.

## Phase 3 — Nurses enact the crisis

**Intent:** staff visibly respond, so the ward reads as a live emergency.

- **Nurse Raval (roaming):** `patrolOverride` to Bed 4 on `patient_bed4_state` change
  (`targetTile`, `speed:150`, `stopOnArrival`) + `setPatrolSpeed`/`setDwellMultiplier` to hurry.
  Arrival sets `patrol_nurse_at_bed4:true` → an eventMapping flips `patient_bed4_state:"attended"`
  (sis01 bridge pattern, `:900-906`), softening the outcome when the player bought time.
- **Sister Doyle:** `person-chat` reactions on deterioration and on the recovery decision.
- ⚠️ **Shared KO global:** both nurses set `globalVarOnKO:"ward_nurse_ko"` (`:1115,:1149`). All
  nurse reactions must guard on `!globalVars.ward_nurse_ko`. **Decide deliberately:** as-is,
  KO'ing Doyle also mutes Raval's rush. If Raval should still respond when only Doyle is down,
  give them separate KO globals first.

## Phase 4 — Recovery choice flips the ward crisis → recovering

**Intent:** the biggest lever — the ward changes in front of the player at the decision.

- On the existing `backup_recovery_source` mappings (`:912`), also `setGlobal:{ ward_recovering:true }`
  and fan out: EHR terminal offline→online; ventilator readout normalises; patients' relieved
  dialogue; nurses stand down / patrol resumes; Emergency Ops Board (`:1273`) + Ward Board (`:2211`)
  flip to `RECOVERING — ETA {source}`.
- ⚠️ **Largest regression surface.** Every readable touched needs a `ward_recovering` variant or it
  reads stale after recovery. Emergency Ops Board and Backup Power Indicator are static `text`
  today → each needs `textVariants` added. Update them together; QA for stale text.
- Per-source flavour: ransom = instant green + funding sting; combined = "4 h, recovering";
  offline-only = slow, and any loss already incurred **persists visibly** (flatline / silent patient).
- Extend the existing post-decision Agent 0x99 message so the player is sent back through the ward.
- ✅ **Layout reinforces this for free (walkthrough finding).** The player enters the ward at the
  bottom-right, walks **up through every bed**, and the offline-keys safe (needed for the combined
  recovery) sits in Emergency Storage at the far east — reachable only by crossing the full ward.
  So both the deterioration (Phase 2) and the recovery flip are on the path the player already
  walks; a return trip past the beds after the decision is natural, not forced.

## Phase 5 — Decisions made in front of stakeholders

**Intent:** move the debrief's strongest beat (the "kept your word to Kim" cross-check) to the choice.

- ⚠️ **Reactions must be REMOTE, not `person-chat`.** The walkthrough confirms the decision terminals
  are **not co-located** with the people who react: the Recovery Console is in the **server room**,
  the Press Terminal is in the **boardroom**, Dr Kim is in the **CTO office**, Gary is in **IT**. So
  Kim's and Gary's reactions must be `phone-chat`/`video-call` (they call the player), never a
  `person-chat` cutscene that would imply they're standing there.
- **Ransom decision:** Dr Kim **calls** (`video-call`/`phone-chat`) after the console to
  `advised_board_pay`/`advised_board_refuse` vs actual `paid_ransom` — the four combinations already
  written for the debrief (`:696-707`), surfaced live. ⚠️ Guard on `!globalVars.dr_kim_ko` (`:2400`).
- ⚠️ **Collision at the console:** the Recovery Console **already** fires Ghost's `on_recovery_console`
  video-call on `objective_task_completed:initiate_backup_recovery` (`:981-984`). A new Kim call at the
  same moment would stack two video-calls. Sequence Kim's call **after** Ghost's (e.g. gate on
  `make_ransom_decision` completing rather than `initiate_backup_recovery`, and/or add a delay), or
  fold the word-kept line into an existing beat. This is the same "one keystroke, one conversation"
  discipline as the press-terminal ambush.
- **Exposure decision:** on `exposed_hospital`, conscious/protected **Gary** reacts by `phone-chat`;
  **Kim** reacts to public exposure. Guard on `gary_ko`/`gary_protected` (and `dr_kim_ko`).
- ⚠️ **Do not collide with the press-terminal ambush.** The exposure decision fires the Reeves
  ambush (Phase 7 note) on the same `decide_hospital_exposure` completion **when the insider was
  never identified**. In that case the moment is already a hostile confrontation — the Gary/Kim
  reactions must be **suppressed or deferred** while that plays out. Gate them on
  `insider_identified || insider_confronted` (i.e. only fire the calm exposure reactions when there
  is no ambush), or delay them until after the confrontation resolves. Never let three
  conversations stack on one keystroke.
- ⚠️ **Debrief reconciliation is in-scope:** these beats duplicate lines the debrief also renders.
  The live scene and debrief must read the same globals, or the player gets contradictory accounts.

## Phase 6 — Evidence reflects what you actually found

**Intent:** investigation depth changes the outcome, not just epilogue tone.

- ⚠️ **Recommended low-risk version:** keep the **hard evidence package fixed** (the debrief's
  exposed-path lines assume it went out, `:405-427`), and gate only **optional/flavour** transmit
  lines on their collection globals, scaling epilogue *tone*. Full per-line gating is possible but
  forces a matching debrief rewrite — do the full version only if that budget is taken.
- ⚠️ **Preserve the ambush trigger.** The press terminal must keep firing
  `#complete_task:decide_hospital_exposure` on transmit — the Reeves ambush (Phase 7 note) hangs off
  that task completing. Whatever gating is added to transmission, the completion tag and its timing
  must survive, or the insider thread never resolves for players who skipped `unmask_inside_asset`.

## Phase 7 — DROPPED (already implemented in-world)

⚠️ **This phase is a regression risk and is removed.** The insider escape is *already* staged as an
enacted event, not a debrief line. Graham Reeves (`night_security_supervisor`, boardroom, `:1942`)
runs a **press-terminal ambush**: if the player never identifies him (`unmask_inside_asset` skipped),
his eventMapping on `objective_task_completed:decide_hospital_exposure` (`:1960`) routes to
`press_terminal_ambush` (`ink/m02_npc_asset.ink:305`), where he reveals himself, **turns hostile**
(`#hostile`), and sets `insider_asset_escaped` — he escapes in the fight. Adding `setVisible:false`
on `insider_asset_escaped` (the v1/v2 idea) would make him **vanish the instant he turns hostile**,
deleting the combat beat. Do **not** do it. The existing `setVisible:false` on the *arrested* path
(`:1969`) is correct and stays.

**What must be protected instead (see Phases 5 & 6):** the ambush trigger is fragile — it hangs off
`decide_hospital_exposure` completing and off `insider_identified`/`insider_confronted` still being
false. Any change to the media-release flow must preserve both.

---

## ⚠️ Debrief reconciliation (new required workstream)

The premise "patient state feeds the debrief's losses tally" is **false today**:
`ink/m02_closing_debrief.ink` hardcodes fatality counts (ransom "2", manual "6", `:223,:252`) and its
VAR block (`:8-46`) never reads `patient_bed4_deceased`. To close the enacted-consequence loop the
debrief ink must be edited to read the new deceased global and reconcile its counts with what the
player actually witnessed. Treat this as its own task, prerequisite to Phases 2 and 5 feeling honest.

## Explicitly NOT gated on timers

Mission completion (`requiresCompleted` unchanged); room/door access; flag submission; safe cracking;
any aim unlock; reaching/using the recovery console or press terminal. Timers only change
`patient_bed4_state`.

## Art

Phases 1–5 need **no new art** — a loss is shown by a flatlined ventilator readable + the patient
going silent (sis01 does exactly this, no sprite swap). An explicit empty/covered-bed sprite is
**optional** and the only thing that would need PixelLab.

## New ink required

Bed 4 state knots (distressed/critical/attended/recovering); Ms Chen + Mrs Hargreaves witness knots;
Raval + Doyle reaction knots; Kim console-reaction knot (4 word-kept combinations); Gary
exposure-reaction phone knot; Reeves-escape message (may need no knot); **debrief edits** to read
`patient_bed4_deceased`.

## Validation & risks

- Run `ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust` after each phase.
- **Pacing:** invisible-drift `delayMs` long enough that a normal player decides before distress.
- **KO coherence:** every reaction guarded on the relevant `*_ko`; note the shared `ward_nurse_ko`.
- **Once-only:** all reaction eventMappings `onceOnly:true`; `onceOnly:true` on timers too (convention).
- **Stale text:** every readable flipped by `ward_recovering` needs its own variant — QA all together.
- **Scope honesty:** Phases 2–6 are substantial *authored content* (multi-NPC ink + eventMappings +
  new readables + recovery-console fan-out + debrief rewrite), not light config. Phase 4 is the
  riskiest for consistency; Phase 5/6 carry mandatory debrief reconciliation.

## Proposed build order

1. **Engine patch** to `ScenarioTimerUI` (deferred-start visible timer) + regression-check sis01's
   countdown timers still render.
2. **Phase 1 + 2 core:** globals, `timers` block, Ventilator Panel interactable + manual-stabilise,
   Bed 4/Bed 2 state machines + `textVariants`, patient barks. Validate + playtest the slow-path
   window and the save.
3. **Phase 3:** nurse `patrolOverride` + Doyle reactions (guard `ward_nurse_ko`).
4. **Phase 4:** `ward_recovering` fan-out across all readables (the big consistency pass).
5. **Debrief reconciliation:** edit `m02_closing_debrief.ink` to read `patient_bed4_deceased`.
6. **Phase 5:** Kim/Gary live reaction scenes (guard `*_ko`; suppress when the Reeves ambush owns
   the `decide_hospital_exposure` moment).
7. **Phase 6 (low-risk):** flavour-line gating + epilogue tone (preserve `#complete_task:decide_hospital_exposure`).
8. ~~Phase 7~~ **DROPPED** — insider escape is already enacted via the press-terminal ambush.

Validate (`ruby scripts/validate_scenario.rb scenarios/m02_ransomed_trust`) after each step.
