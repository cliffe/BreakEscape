# sis02_energy: review round 2 (confirmation), 2026-10-09

Fresh reviewer, read-only. Skills: `scenario-design-review` and `npc-dialog-review`, plus `docs/agents/SOFTLOCK_PATTERNS.md`. Working tree of 2026-10-09 (`git diff HEAD -- scenarios/sis02_energy`). Kind of game: Security-Informed Safety serious game, education first.

## Verdict

**Clean** (no blocker, no Must fix). Every round-1 and round-1b fix claimed in IMPROVEMENT_LOG phase 10 is in the files and correct on the paths I traced. The checks pass: multicall 81/0, reopencheck 0, dialoguelint 0, validator no INVALID.

Two things should be fixed before the confirmation playtest. Both are small and unvoiced:
- **R2-1 (major):** a regression from D3-2. Helen's dial radio asks "which one you believe" in a gas alarm or a burning hall, where her hub no longer offers the question.
- **R2-3 (minor):** the SL4 mapping makes the evacuation cutscene's music skip a track mid-scene.

R2-2, R2-4 and R2-5 are optional polish. P1 and P8 don't make a sis02 path unplayable, and P8 can't fire away from the hall doorway (§6).

## 1. Checks run

| Check | Result |
|---|---|
| `node scripts/ink_runtime_check/sis02_multicall.mjs` | **81 passed, 0 failed** |
| `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json sis02_energy` | Marcus 1800 reopens / 669 re-runs, Tom 1800 / 335, **0 problems**. Held-back lines only (`nis_scene`, `isolation_scope_scene`, `shutdown_argument_scene`, `evidence_scene`, Tom `ot_scope`). |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis02_energy/` | **0 findings, every rule.** Helen max 25 words, Marcus 24, Priya 30, Tom 23, 31 timed texts max 28. |
| `ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb --skip-ink --no-graph` | Schema passes, ERB renders, no unknown fields, layout and doors OK, **no INVALID**. 5 onceOnly-overlap warnings, all intended (Helen `historian_flatline_found` idx 4–8 = one unlock mapping + four disjoint radios; `esd_activated` idx 10–14,18; `hydrogen_alarm` 15,30; `facility_evacuated` 16,17 = the SL4 pair; `facility_safe_state` 20–24). No `conclusionScreen` (as sis01/sis03). Credit-section and VM/PIN/hostile suggestions don't apply (checked in R1). |
| Compiled ink matches source | All four `.ink` compiled to scratch with `bin/inklecate`: identical to the repo `.json`. |
| House-style grep over every added line of the four inks and the ERB (205 lines) | No banned words, no "It's not X, it's Y", no printed variables, no US spellings. The only em dash is the SIS panel's `"modifiedBy": "—"` field (UI placeholder, not dialogue). |

Not run: browser playtests (others are running on :3001), loopcheck/inkcheck (multicall and reopencheck cover the changed knots).

## 2. Round-1 fixes: verified in the files

Every claim in IMPROVEMENT_LOG phase 10 ("Round 1 fixes", "Round 1b fixes") was checked against the diff and the current lines. All are present. Line numbers are the current working tree.

| Item | In the files | Correct on every path? |
|---|---|---|
| SL1 = D3-1 | Marcus `npc_marcus_webb.ink:116` adds `and not bms_registers_saved` | Yes |
| SL2 | `marcus_webb_contacted` mapping has no `unlockAim` (`scenario.json.erb:1036-1042`); Helen's `jump_server_confirmed` mapping unlocks `["investigate_sis", "isolate_network"]` (`:732-740`); graph action has no `unlocks_aim` (`:1031`); `dungeon_graph.md` edge removed; `#complete_task:call_marcus_initial` moved inside `{ not marcus_called: }` (`npc_marcus_webb.ink:61-62`) | Yes. Validator accepts the tag position. |
| SL3 + MF1 | NIS option on `historian_flatline_found or jump_server_confirmed or sis_tamper_confirmed or facility_evacuated or network_isolated or marcus_rdp_briefed` (`npc_marcus_webb.ink:140`); `incident_aware` declared (`scenario.json.erb:116`), set at `:702` (historian), `:737` (session), `:794` (evacuation), `:930` (SIS), `:1168` (CastleTech); timer `startOnGlobal: incident_aware` (`:428`); `nis_send` branches (`npc_marcus_webb.ink:309-328`) | Yes. The two gates have the same sources (`marcus_rdp_briefed` implies the session; `network_isolated` comes only from the CastleTech mapping, which sets `incident_aware`). Every NIS pointer (Helen `next_steps`, the safe-state and isolation radios, Marcus's status lines, the `nis_deadline_missed` bark) is only reachable once one source is true. The timer's start listener only starts a dormant timer, so repeated `incident_aware` emits don't restart it (`scenario-timer-dispatcher.js:94-101`). Each `nis_send` line claims only what the player has seen. |
| SL4 | Mapping `scenario.json.erb:786-796` before the cutscene `:797-808` | Yes, with one side effect (R2-3 below). See §3.1 for the full trace. |
| mn10 | Cutscene `"background": "assets/backgrounds/albion_energy.png"` (`:806`); `_buildMappingConfig` passes `background` (`npc-manager.js:576`, `:967`). Art file is tracked. | Yes. D5 (containers vs halls) stays with the user. |
| SL5 = mn13 | `#complete_task:talk_to_priya_s` after `#set_global:debrief_complete:true` (`npc_priya_s.ink:398-400`); `"concludeRequires": {}` (`scenario.json.erb:391`) | Yes. The server trusts an aim with no requirements (`game.rb:1871-1887`); a task POST after `/conclude` is harmless (it just reports `missionConcluded: false`). |
| MJ1 | `npc_marcus_webb.ink:121-134` | Yes. Option stays sticky; with no dial, historian, session, SIS or evacuation it refuses and returns to the hub. See §3.2. |
| MJ2 = D3-6 | Tom `npc_tom_hadley.ink:111-118` | Yes |
| MJ3 / D3-5 / D3-9 | Narrator `npc_helen_marsh.ink:65-68` | Yes. Matches the ruling ("Two battery halls…", "got in at quarter past six"). |
| D3-2 | Helen `:124` (`not hydrogen_alarm and not esd_before_dial`), `:130` (`not hydrogen_alarm`) | Yes, but it leaves Helen's dial radio inviting a debate she no longer offers (R2-1). |
| D3-3 | Marcus `:114` | Yes |
| D3-4 | Marcus `:87-93` | Yes; `first_call`'s six options still cover every state. |
| D3-8 | Helen `:324` | Yes |
| D3-11 | Tom `:43-50`; timed text `scenario.json.erb:1160` | Yes |
| D3-12 | Tom `:56-58` | Yes |
| D3-13 | Marcus `:271` | Yes |
| mn1 | Credits: "CELLS SAFE…" and "never read" lines gone, comment `:512-514` | Yes |
| mn2 | Credits `:525`; Priya `:132-134` | Yes |
| mn3 | Lamp multiState `:1372-1384`; globals `:126-130`; mappings `:945-966` | Yes. The alarm panel supports `multiState` with a variable-less fallback state (`alarm-panel-minigame.js:104-111`) and subscribes to every listed variable (`:132-138`). |
| mn4 | SIS row `:2083-2084` | Yes |
| mn11 | Comments by each group | Yes, except one stale word: `:693` still says "Two radios" for a group that now has four (R2-6). |
| mn15 | Marcus `:255`, `:261-263` | Yes |
| mn16 | Priya `:255` | Yes |
| P2 | Marcus status lines set `cable_pull_agreed` (`:391-397`, `:415-421`); evacuation texts split three ways, first one sets it (`scenario.json.erb:1094-1115`) | Yes |
| P3 | Tom `:166-172` | Yes |
| P4 | Four flat-line radios `:705-730` | Yes: disjoint and complete on `esd_activated` × `marcus_webb_contacted`, exactly one fires. |
| P5 | Four cable go-ahead texts `:1044-1068` | Yes: disjoint and complete on `network_isolated` and `isolation_scope` (all gated on `cable_pull_agreed`; the PRI-8 text covers `!cable_pull_agreed`). |
| P6 | Marcus `:232-237` | Yes |
| P7 | Split dial radios `:674-691`; Helen VAR `esd_before_dial` (`:37`) gates the gauge debate; choice text `:235` | Yes. Disjoint and complete on `esd_before_dial`. `esd_before_dial` and `hydrogen_alarm` can't both be true (the station clears it in a gas alarm, `:1434`; an ESD cancels both hydrogen timers), so the P7 radio never plays in a gas alarm. |
| Not done, as ruled | mn5 done in the lab sheet (`labsheet.md:114`); **mn6 still open** (Q8 "If you messaged Marcus before pressing it…", currently `labsheet.md:384`; the sheet is being edited by another agent as I write). mn7–mn9 pack items, mn12 (engine change now committed with the art), mn14, mn17 (CONSISTENCY_PLAN marked superseded, D4 resolved). | n/a |

Also changed but not in the fix list: `mission.json` now has `"secgen_scenario": null` and a `lab_sheet_url`, the same shape as sis01. Fine for a no-VM SIS game; presumably the lab-sheet stage.

## 3. Regressions and new problems

### 3.1 SL4: what the evacuation tick now fires

`h2_evacuation` writes `facility_evacuated` into `gameState` and then emits (`scenario-timer-dispatcher.js:244-258`). Mapping `setGlobal` emits synchronously and nested (`npc-manager.js:703-716`), so Helen's SL4 mapping (`scenario.json.erb:786-796`) runs every `esd_activated` and `priya_s_visible` listener before the cutscene mapping (`:797-808`) even starts its 500 ms timer. Traced one by one:

- **Helen's five `esd_activated` radios** (`:747-778`): every one has `facility_evacuated !== true`, and the global is already true when they're evaluated. None fires. Correct.
- **Safe-state mapping** (`:813-817`): fires only if `network_isolated` was already true. Then `facility_safe_state` → `priya_s_visible` (already about to be set; Priya's mapping is onceOnly) and the four safe-state radios, which all need `facility_evacuated !== true` (`:833-851`). Nothing spoken. Correct.
- **Marcus and Tom**: no mappings on `esd_activated` or `priya_s_visible`. Marcus's three evacuation texts (`:1094-1115`) are disjoint on `jump_server_isolated`/`network_isolated`, which the SL4 mapping doesn't touch. Correct.
- **Timers**: `h2_evacuation`'s own `cancelOnGlobal: esd_activated` fires while it is firing, so the timer ends in both the fired and cancelled sets. Harmless: both mean "skip", and on reload `cancelOnGlobal already set at init` cancels it again.
- **Priya's arrival**: `setVisible` and `unlockAim: post_incident_debrief` happen at once (she is placed in the control room behind the cutscene, and the debrief aim shows in the objectives panel during the scene). The bark has `barkDelay: 1500` and the cutscene opens at +500 ms, so the bark is held behind the minigame and released when it closes (`bark-release-policy.js`). Correct, but a browser check is still owed (§4).
- **Music**: the `esd_activated` music event (`:493-498`) now switches to `cutscene` at the start of the evacuation, which suits it. **But** Helen's `evacuation_scene` still runs `#set_global:esd_activated:true` (`npc_helen_marsh.ink:371`), and that tag always emits (`chat-helpers.js:450-497`), so the music event fires a second time, two lines into the scene. `switchPlaylist` to the playlist already playing calls `_nextTrack(fade)` (`music-controller.js:366-383`), so the cutscene track cuts to another one mid-scene. Before the fix there was one switch. **R2-3, minor.**
- **Reload mid-scene**: all three globals are written in one synchronous tick, so a state sync (or the pagehide flush) can't land between them. The SL4 handler is not a conversation, so it is marked `persist` at once (`npc-manager.js:697`). The cutscene isn't replayed (nothing re-emits `facility_evacuated`), Priya is visible and the ESD stations show active. Correct.

### 3.2 MJ1: can "Isolate on what?" strand Tom's isolation?

No. Tom acts only on `network_isolation_authorised`. Its two setters are `rdp_session_confirmed` (sticky hub option on `jump_server_confirmed and not marcus_rdp_briefed`) and the sticky hub sign-off, which now needs one of dial, historian, session, SIS change or evacuation. Every one of those stays reachable in every state:
- the historian is in the start room and is never gated;
- the session needs the workshop key, which is in the unlocked duty desk in the start room;
- in a gas alarm, the refusal points at "the historian or the jump server log", not the dial (`:125-126`);
- after an evacuation, `facility_evacuated` itself counts.

An ESD pressed with no other evidence is not in the list. That's right: the dial is still readable afterwards, and the refusal names it. The multicall scenarios `marcus/sign-off-no-evidence-then-historian` and `…-in-gas-alarm-no-dial-pointer` cover both branches.

### 3.3 Radios: disjoint and complete

- **Flat-line** (`:705-730`): `esd_activated` {true, not true} × `marcus_webb_contacted` {true, not true}, written as `=== true` / `!== true` pairs. Exactly one fires. The unlock mapping (`:697-704`) fires with it by design.
- **Dial** (`:675-691`): `esd_before_dial` `!== true` / `=== true`. Exactly one fires, but see R2-1: the first one also fires in a gas alarm and after the evacuation.
- **Marcus cable go-ahead** (`:1044-1068`) and **PRI-8** (`:1070-1075`): `cable_pull_agreed` false → PRI-8; true → split on `network_isolated`, then scope 'historian' / 'scada' / anything else. Exactly one fires.
- **Marcus evacuation** (`:1094-1115`): (no cable, no isolation) / (cable, no isolation) / (isolation). Exactly one fires.

### 3.4 `cable_pull_agreed` from status lines

Set only on the branches whose text says "Cable, then Tom." (`npc_marcus_webb.ink:394-396`, `:418-420`), and only when the cable is still in. No listener exists on `cable_pull_agreed` (grep: no `eventPattern` on it), so re-setting it on every "Where are we?" does nothing else. The reopen logic never runs `current_status` by itself: it re-enters at `start` (reopencheck: 0 problems). Correct.

### 3.5 NETWORK STATUS lamp, credits, `concludeRequires`, moved tags

- **Lamp:** precedence SCADA MANUAL MODE > HISTORIAN ALSO CUT > ENTERPRISE CUT OFF > NORMAL. `scada_manual_mode` is set the moment the scope is chosen, which matches Marcus's "I'll ring the shift in". `historian_leg_cut` is set in either order (`:953-966`). Correct.
- **Credits:** the two titles cover every route that reaches Priya (safe state or evacuation). The dial line `:524` now excludes `esd_before_dial`, matching the hidden gauge debate. The PHYSICAL SAFETY section still prints at least one line on every route (`:530`, `:531` or `:532`, one of which always holds once Priya is visible). Correct.
- **`concludeRequires: {}`** and the tag order in `closing_end`: correct (§2).
- **`call_marcus_initial`** inside the first-message block: the phone preload defers tags to the first open, so it completes on first contact as before and no longer re-fires later. Correct.

### 3.6 Problems found

**R2-1 (major, regression from D3-2; voiced). Helen's dial radio invites a gauge debate she no longer offers, and does it in a gas alarm or a burning hall.**
- The badge opens Hall 1 in a gas alarm, and the dial can be read there. Its observation variants allow for this (`scenario.json.erb:1645-1652`).
- Reading it sets `anomaly_detected`, and the first dial mapping (`:675-681`) only tests `esd_before_dial !== true`. So 3 s after Helen's "Out of that hall. Now." bark (`:873-879`), she radios "Fifty-one on that dial? Come and tell me which one you believe."
- Her hub can't answer that. Since D3-2 the gauge option needs `not hydrogen_alarm` (`npc_helen_marsh.ink:124`), and "About that dial again." needs a verdict.
- After the evacuation it is worse. The dial shows "needle hard against the stop" (`:1647`), not 51, and Helen asks for a verdict on a hall that is alight.
- Not a softlock, but a voiced line that is wrong on a reachable path and contradicts the line before it.
- **Fix (`scenario.json.erb:675-681`, no new voiced text):** add `&& globalVars.hydrogen_alarm !== true` to the first dial mapping's condition. Add a third mapping straight after the P7 one, with the same unlock and task and no text, because the entry bark has already told the player to get out:

  ```json
  {
    // Dial read in a gas alarm or after the evacuation: the entry bark has said "Out of that hall";
    // no gauge debate (D3-2), so no radio. esd_before_dial is never true in a gas alarm.
    "eventPattern": "global_variable_changed:anomaly_detected",
    "condition": "value === true && globalVars.hydrogen_alarm === true",
    "onceOnly": true,
    "unlockAim": ["verify_anomaly", "initiate_esd"],
    "completeTask": "check_thermometer"
  },
  ```

  The three conditions are then disjoint and complete: no alarm and no early ESD; early ESD (never in an alarm); alarm. If a spoken acknowledgement is wanted, give the gas mapping `"sendTimedMessage": { "delay": 3000, "message": "Fifty-one, then. Now get out of that hall." }`, but only on `facility_evacuated !== true`, because the burnt dial doesn't read 51. That is one new voiced Helen line.
- Multicall scenario that would catch it: `helen/dial-read-in-gas-alarm`. Set `hydrogen_alarm`, fire `room_entered:battery_hall_1` from the control room, then set `anomaly_detected`. Assert that no delivered text matches `/which one you believe/`, and that Helen's hub then offers no option the text points to. Repeat with `facility_evacuated` and assert that no text matches `/Fifty-one/`. It fails on the current files.

**R2-2 (minor, pre-existing, same family as P7). The gauge debate is still offered after an ESD pressed once the dial was read.**
- With the dial read, no verdict yet and the ESD pressed (no gas), Helen's hub still offers "[That dial in the hall. Which do we believe?]" (`npc_helen_marsh.ink:124`).
- `gauge_decision` then asks "Which would you bet the hall on?" and answers "If the dial's right, every minute counts" (`:163`, `:178`).
- P7 fixed this only for `esd_before_dial`.
- Fix options:
  - gate `:124` on `not esd_activated` instead of `not esd_before_dial`, and drop `not esd_before_dial` from the credits line `:524` in favour of `!globalVars.esd_activated`. This loses the dial-or-screen reflection for players who pressed straight after the dial;
  - or, better for teaching, keep the option and branch the opening line: `Helen Marsh: Fifty-one on the dial. Twenty-eight on my screen. {esd_activated: The ESD's in, but one of them was lying to us. Which did you go on?|One of them's lying to us. Which would you bet the hall on?}`. That is one new voiced Helen variant. Also make `:178` `{esd_activated: Fair enough. It's off charge, so take your time.|Fair enough. Be quick, mind. If the dial's right, every minute counts.}`.
- I'd take the second.

**R2-3 (minor, introduced by SL4). The evacuation cutscene's music skips a track two lines in.** See §3.1.
- **Fix (`scenario.json.erb:493-498`, unvoiced):** `"condition": "value === true && (typeof oldValue === 'undefined' || oldValue !== true)"`. This is the credits event's guard (`:506`). A real ESD press still switches the music: the station's `set_global` goes through `apply-actions.js:33-40`, which sends no `oldValue`. The ink tag's re-set of an already-true value is ignored.
- Alternatively, delete `~ esd_activated = true` and `#set_global:esd_activated:true` (and the `priya_s_visible` pair and `#skip_task`) from `evacuation_scene` (`npc_helen_marsh.ink:368-375`), since the SL4 mapping now does all of it. That is a structural ink change, so the guard is the smaller fix.
- Playtest check: listen for a track change after Helen's second evacuation line.

**R2-4 (minor, pre-existing). Marcus asks for ten seconds of evidence during a gas alarm.** If the shutdown was argued before the alarm, "[We're pressing the ESD now.]" (`npc_marcus_webb.ink:116`, no `hydrogen_alarm` gate) leads to `evidence_scene`: "Got ten seconds? Export the BMS register table on OPS-01 first."
- It is arguable. The export is at the desk, nobody goes into the hall, and "If not, press it anyway" leaves the call with the player. So it is not D3-3's unsafe advice.
- Optional (unvoiced): add `{ hydrogen_alarm: With the gas up, only if you're already at OPS-01. }` after `:192`.

**R2-5 (minor, housekeeping). Stale comment.** `scenario.json.erb:693` says "Two radios, disjoint on esd_activated", but the group now has four, on `esd_activated` × `marcus_webb_contacted` (the P4 comment at `:706-707` is right). Change it to "Four radios (P4)…". No behaviour change.

Considered and withdrawn:
- After an evacuation with CastleTech's isolation already done and the cable still in, Helen says "Get on to Marcus, and get that jump server cable pulled". Marcus's evacuation text then sets no `cable_pull_agreed`, so pulling it earns "Tell me next time".
- That is consistent, not a P2 repeat: Helen told the player to go to Marcus first. Priya's "before Marcus knew about the session" is true on that route (if Marcus had heard about the session, `rdp_session_confirmed` would already have set `cable_pull_agreed`).

## 4. Softlock patterns S1–S8 on the changed areas

- **S1 (burnt first-call gate):** clean.
  - Marcus's new gas-alarm first option and the gated "Nothing solid yet" are both sticky, and together with the other four options they cover every state.
  - The sign-off refusal returns to the hub with the option still there.
  - The NIS option is a sticky hub option.
  - Tom's new Trent option sits in `first_call`, but the Trent topic also has a sticky hub route.
- **S2 (order dependence):** clean.
  - NIS accepts any incident evidence in any order.
  - The sign-off accepts any of five kinds of evidence.
  - The flat-line radios, the cable texts and the evacuation texts each follow what is already done.
- **S3 (said but not set):** clean.
  - Each "Cable, then Tom" now sets `cable_pull_agreed`.
  - "Signed off" still sets the authorisation, and "Isolate on what?" sets nothing and promises nothing.
  - Every NIS pointer has a route.
  - "I'll ring Tom and get him to add it" is followed by the `historian_leg_cut` mapping.
- **S4 (premature completion):** clean.
  - `call_marcus_initial` completes on first contact, which is what the task is ("Message Marcus Webb"), and it no longer reveals "Isolate the Attacker".
  - `talk_to_priya_s` completes after `debrief_complete`.
- **S5 (sticky option over exhausted content):** clean. "We're pressing the ESD now." hides once the registers are saved. The new options all lead to knots with a sticky way back.
- **S6 (setter only on one branch):** clean.
  - `esd_activated` and `priya_s_visible` are now set on the evacuation branch by the mapping, as well as by the cutscene.
  - `incident_aware` has five setters, one on every route that reaches Priya.
- **S7 (event that can't recur):** SL4 is closed: the outcomes no longer depend on the cutscene finishing. `nis_deadline` uses `startOnGlobal` with an "already set at init" check (`scenario-timer-dispatcher.js:85-90`), so a reload after `incident_aware` resumes the clock. mn14 (Tom's nudge after a reload) is unchanged, a nudge only.
- **S8 (advice that hides a bug):** the lab sheet carries no "don't do X first" warnings. Q8 still says "If you messaged Marcus before pressing it" (mn6, lab-sheet stage), which is inaccurate but not a workaround.

The multicall script covers every round-1 fix, but not R2-1 or R2-3: it models the timed texts without the hall-entry plus dial-in-alarm order, and it doesn't model music. Scenarios that would catch them: `helen/dial-read-in-gas-alarm` (R2-1, above), and `flow/evacuation-music-switches-once` (count the music events on `esd_activated` from the evacuation tick through the end of `evacuation_scene`; expect 1, currently 2).

**For the browser playtest** (short, targeted, after the R2-1 and R2-3 fixes):
1. Gas alarm (fast-forward `h2_advisory`), no ESD: badge into Hall 1, read the dial. Expect the entry bark only, no "which one you believe".
2. Let `h2_evacuation` fire with the phone closed. Watch for: the cutscene over the exterior, one music change at the start and none mid-scene, no Helen ESD radio, Priya's bark after the scene closes (not over it), the debrief aim present afterwards, and the ESD stations showing active.
3. The same, with a reload while Helen's second evacuation line is on screen: no replay, Priya present, isolation then possible, debrief reachable.
4. Off-path: ask Tom to isolate, then message Marcus with no evidence. Expect "Isolate on what?". Read the historian, ask again, and he signs.

## 5. Dialogue: new and changed lines

Voiced: Narrator, Helen (including her radio texts), Priya. Marcus and Tom are phone texts. None of the voiced lines below prints a variable: the only inline conditionals choose between fixed strings.

**Voiced (TTS cost):**

| Line | Verdict |
|---|---|
| Narrator `npc_helen_marsh.ink:65` "Albion Energy Storage, on the Trent near Newark. Saturday, half past six." | Good. Matches pack :681, :783. |
| Narrator `:66` "Two battery halls holding two hundred megawatt-hours of lithium-ion cells, charging off the grid overnight while the county sleeps." | Good. 200 MWh, two halls (pack :681, :839). "While the county sleeps" is the one flourish, and it is fine in a scene-setter. The art still shows containers (D5, user). |
| Narrator `:67` "The site's SCADA engineer got in at quarter past six. She hasn't taken her eyes off the control room screens since." | Good. 06:15 (pack :781), and it hands over cleanly to Helen's "Morning. Helen Marsh, SCADA." |
| Helen `:324` "Not the hall, not now. Press the station by the door." (+ " The dial can wait." only when unread) | Good. One new variant. |
| Helen radio "Dead flat since twelve minutes past eleven. Somebody's writing it. Get that ESD in." | Good. New. |
| Helen radio "Dead flat since twelve minutes past eleven. Somebody's writing it." | Good. New. |
| Helen radio "Fifty-one on that dial? Then we needed that ESD." | Good. Dry, in her voice, and it closes her own "Go and see if we needed it." New. |
| Priya `npc_priya_s.ink:255` "…You pulled the jump server cable before Marcus knew about the session. My view is he should have been told first." | Good, and true on every route that reaches it (§3.6 withdrawn note). |

Fixes proposed here add at most two Helen variants (R2-1's optional line and R2-2's). Both are optional, and R2-1 has a fix with no new text.

**Unvoiced (Marcus, Tom, player choices):** all checked for voice, facts and house style. All fine:
- Marcus: "Isolate on what? I'm not cutting the enterprise side off on a hunch." / "Get me the historian or the jump server log, then I'll sign it." / "Get me the dial or the historian, then I'll sign it." / "Then leave the dial. Door station, now. We'll find the cause after." / "And CastleTech have the enterprise side shut already. Good." / the three new `nis_send` openings and "Everyone out, nobody hurt." / "I'll ring Tom and get him to add it." / "I'll ask Tom to flag anything that comes off it." / "They're still in our network." / "Tom, for the enterprise side." (two status lines) / the four cable texts / the three evacuation texts. Short, direct, an OT manager on his phone. The `nis_send` wordings are the right register for an initial notification ("cause unknown, an attack not ruled out").
- Tom: the OT-monitoring answer in both branches; the scope confirmations "Marcus says the historian's enterprise leg goes too. That's cut as well." and "Marcus says the historian's left connected and you're watching it. I'll flag anything that comes off it."; the shared-server text ending "Message me when you can." Fine. "Quarter to two" against the 01:47 login is close enough for a text.
- Player: "[Hall 1's in gas alarm. Nobody's read the dial yet.]", "[Your message about the shared server and Trent Water.]", "[What has/does pressing it cost us?]". Fine.

Facts: nothing new contradicts `information_pack.md`. The SIS row "No change in HMI-ENG-02 history" / "—" now agrees with the pack's "no change log" (:769, :846).

House style: clean (§1). UK English throughout.

## 6. Engine items P1 and P8 (for the user)

### P1: globals only reach the server every 30 s

**Doesn't make sis02 unplayable, and in practice rarely bites.**
- `StateSync` also flushes on `pagehide` with a keepalive request (`state-sync.js:17-23`, `:139-163`), and that covers a reload, a tab close and navigating away. If the payload is oversized it falls back to globals, fired handlers, timed texts and the clock.
- What loses the last 30 s is a crash, a killed browser process, or a harness `browser.close()` (game 1890).
- Timer state, fired handlers and globals travel in the same payload, so after such a loss the world is consistent at the last sync. Only task completions (immediate POSTs) can run ahead of their globals.

In sis02 every gate has a sticky or repeatable setter, so the cost is a repeat:
- Helen briefs again;
- an ESD may need pressing again (the station reads `esd_activated`);
- Tom may need asking again.

Wrong blame is possible but narrow. If the player saved the registers, then the browser crashed within 30 s, then they pressed the ESD before re-exporting, Marcus, Priya and the credits say the registers weren't saved. The same goes for any decision global set just before a crash. Not worth a mission-side change. The proposed engine fix (sync on `conversation_closed`) would close most of it.

### P8: hall detection at the control room's north wall

**Can the feet get into y 0–64 in the control room? Only through the hall doorway.**
- `createWallCollisionBoxes` gives every north-wall tile (rows 0–1) an 8 px solid strip on its south edge (`collision.js:59-70`). Row 1's strip spans y 56–64, so a player walking north stops with the body's top at y 64.
- `updatePlayerRoom` tests the feet (`body.y + body.height`, `rooms.js:2927-2929`), so away from the door the feet can't go below 64 + body height. That is outside the hall's floor band (−192 to 64).
- The bridge log agrees. At the hall door the player stopped with feet at (65, 84) (`sis02-playtest-r1b/session-1889.jsonl` seq 25-29, `startFeet`). The doorway gap is x 32–64, with feet 41–55 on the x axis.
- So the band can only be reached in the doorway itself (no wall tiles, so no strip), and only once the door is open. While it is locked (rfid, badge), the door blocks it.

**Does it wrongly blame the player in practice?** Rarely, and arguably not at all:
- Stepping into the open doorway in a gas alarm is entering the hall's threshold. "Out of that hall" is a fair response, and Priya's line is about someone who "walked into Hall 1".
- The one realistic accident: the hall-door ESD station is on the west wall next to the door (`scenario.json.erb:1408-1415`, engine-placed). A player who pushes up and right towards it in a gas alarm, with the door already opened earlier, could slide into the gap.
- The workshop case keeps its `previousRoom !== 'engineering_workshop'` guard. The `null` gap state isn't reachable between these three rooms: they tile x 0–640 with no gaps along the shared walls.

**What a playtest should check** (Run J step 9 already asks most of this):
1. Gas alarm, door already unlocked and opened once. Walk up the north wall at x 100–280 as far as it goes, and record `__test` state's room and feet each step. Expect `scada_control_room` throughout, no bark, `entered_hall_in_gas_alarm` false.
2. Approach the hall-door ESD station from the south and from the east, press it, and record room and feet at the press. Expect the control room.
3. Step one tile north into the open doorway and record where the room flips to `battery_hall_1` (expected: about feet y < 64), and whether the bark fires. That is the real threshold. Say whether it feels like "entering the hall".
4. In the workshop, stand at the SIS panel and noticeboard on the north wall and record room and feet. If the room reads `battery_hall_1` with feet ≥ 64, the r1b report came from a different cause than the one modelled.

## 7. Findings list

| Id | Level | Where | Fix | Voiced? |
|---|---|---|---|---|
| R2-1 | major (regression from D3-2) | `scenario.json.erb:675-681` | Add `&& globalVars.hydrogen_alarm !== true` to the first dial mapping; add a third mapping on `hydrogen_alarm === true` with the same unlock and task and no text | No new text (optional one Helen line, not after the evacuation) |
| R2-2 | minor (pre-existing; P7 left half done) | `npc_helen_marsh.ink:124`, `:163`, `:178` | Branch the gauge question and the "every minute counts" answer on `esd_activated` | Yes, two Helen variants |
| R2-3 | minor (introduced by SL4) | `scenario.json.erb:493-498` | Music condition `value === true && (typeof oldValue === 'undefined' || oldValue !== true)` | No |
| R2-4 | minor (pre-existing, optional) | `npc_marcus_webb.ink:192` | `{ hydrogen_alarm: With the gas up, only if you're already at OPS-01. }` | No (Marcus) |
| R2-5 | minor (comment) | `scenario.json.erb:693` | "Two radios" → "Four radios (P4)" | No |
| carry-over | minor (lab-sheet stage) | `labsheet.md` Q8 (mn6) | "If you told Marcus you were shutting down…" | No |

No blockers. No Must fix.
