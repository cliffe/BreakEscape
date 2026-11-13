# sis02_energy: confirmation review, round 3

Fresh reviewer, 2026-10-09. Scope: the "Round 2 fixes" at the end of `IMPROVEMENT_LOG.md` and anything they touch. Read-only; no files changed apart from this one.

## Checks run

- `node scripts/ink_runtime_check/sis02_multicall.mjs`: **90 passed, 0 failed** (includes the 9 round-2 scenarios: dial-read-in-gas-alarm, gauge-debate-after-esd, evacuation-music-switches-once, evidence-scene-in-gas-alarm-aside, first-call-dial-in-gas-alarm-door-station-first, ot-monitoring-reoffered-after-session, after-evacuation-ncsc-already-there, thats-all-once-notified, one-rebuke-for-an-unagreed-cable).
- `node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json sis02_energy`: **Total problems: 0** (Tom: 1800 reopens, 336 re-runs, 0 replays of the opening).
- `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis02_energy/`: **Totals by rule: none**.
- `ruby scripts/validate_scenario.rb scenarios/sis02_energy/scenario.json.erb --skip-ink --no-graph`: no INVALID, schema passes, layout and doors OK. Warnings: the five intended onceOnly groups (Helen: historian_flatline_found, esd_activated, hydrogen_alarm, facility_evacuated, facility_safe_state) and "no conclusionScreen" (intended, SL5). No `anomaly_detected` overlap warning, so `mutuallyExclusiveGlobals` is read (validator `:250`, `:1291`).
- The four inks compiled with `bin/inklecate` into the scratch folder, no compiler warnings; parsed JSON is **identical** to the repo's `npc_helen_marsh.json`, `npc_marcus_webb.json`, `npc_priya_s.json`, `npc_tom_hadley.json`.

## Round-2 fixes, line by line

| Item | In the file | Verdict |
|---|---|---|
| R2-1 | `scenario.json.erb:684-711`: first dial radio needs `hydrogen_alarm !== true`; P7 radio on `esd_before_dial === true`; new silent mapping on `hydrogen_alarm === true`, same unlock and task. `mutuallyExclusiveGlobals` at `:55-57` with comment `:52-54`. | Confirmed (see focus 1) |
| R2-2 | `npc_helen_marsh.ink:164` and `:179`, inline variants on `esd_activated`; old text plays before the ESD. `esd_activated` is a declared VAR (`:22`). | Confirmed; minor R3-3 on the choices around it |
| R2-3 | `scenario.json.erb:501-505`: `value === true && (typeof oldValue === 'undefined' \|\| oldValue !== true)`. | Confirmed (focus 2) |
| R2-4 | `npc_marcus_webb.ink:203-205`: "With the gas up, only if you're already at OPS-01." on `hydrogen_alarm`. | Confirmed |
| R2-5 | `scenario.json.erb:714`: "Four radios (P4)". | Confirmed |
| G1 | `npc_marcus_webb.ink:98-102`. | Confirmed (focus 4) |
| N1 | `npc_marcus_webb.ink:133`: "Get me the dial, the historian or the jump server log, then I'll sign it." Gas-alarm variant at `:131` unchanged. | Confirmed |
| N2 | `npc_tom_hadley.ink:79-82` (hub), `:116-121` (ot_scope divert), `:128-132` (`ot_caught_after`). | Confirmed (focus 5) |
| N3 | No change claimed; no change found. | Accepted |
| N4 | `npc_marcus_webb.ink:258-263` (NCSC line on `priya_s_visible`, VAR at `:32`), `:421-422` (status line), `:459-462` (historian still connected). | Confirmed; minor R3-1 on a sibling text the fix missed |
| (a) | `npc_marcus_webb.ink:158-165`. | Confirmed; minor R3-2 on wording |
| (b) | `npc_marcus_webb.ink:239-250`. | Confirmed (focus 4) |
| Voiced lines | Only the two Helen variants are new voiced text. Neither prints a variable; both are fixed strings chosen by an inline conditional. No Priya or narrator text changed in round 2. | OK |

## Focus items

### 1. The three dial mappings and `mutuallyExclusiveGlobals`

The three `anomaly_detected` mappings are disjoint as long as `esd_before_dial` and `hydrogen_alarm` are never both true. Traced every setter:

- `hydrogen_alarm` has one setter: the `h2_advisory` timer (`scenario.json.erb:454`). No ink sets it.
- `esd_before_dial` is set only by the three ESD stations' `conditionalActions` (`:1454`, `:1483`, `:1727`). The minigame runs them in order before `completionActions` (`esd-pushbutton-minigame.js:210-222`), so a press in a gas alarm sets it and the last entry clears it again (`:1455`, `:1484`, `:1728`). A re-press is refused once `esd_activated` is true (`:63-66`, guard checks at the confirm steps), so the actions never run twice.
- A press with no gas alarm sets `esd_activated` in the same synchronous call, and `h2_advisory` has `cancelOnGlobal: esd_activated` (dispatcher `:107-117`). After a reload the timer is restored as cancelled from the saved state (`:57-61`) or cancelled at init because `esd_activated` is already true (`:67-69`). The two globals are saved together, so no reload order brings back the timer with `esd_before_dial` kept.
- The evacuation sets `esd_activated` by mapping (`:815`), not through a station, so it never sets `esd_before_dial`.

Order checks: dial before any ESD (mapping 1 or 3 by `hydrogen_alarm`); ESD then dial (mapping 2, timers cancelled, so mapping 3 can't match); gas alarm, ESD in the alarm, then dial (`esd_before_dial` cleared, mapping 3, silent); evacuation, then dial (mapping 3). Exactly one matches in each. The declaration is true.

### 2. Music `oldValue` guard

- Station press: `applyActions` `set_global` emits `{name, value}` with no `oldValue` (`apply-actions.js:33-40`), so `typeof oldValue === 'undefined'` holds and the music switches once.
- Evacuation: the SL4 mapping sets `esd_activated` through `npc-manager.js:704-713`, which emits `oldValue: false`, so the music switches there. In `evacuation_scene` (`npc_helen_marsh.ink:369-372`) the `~ esd_activated = true` goes through the ink observer, which returns early because gameState already holds true (`npc-conversation-state.js` observer, "Not a change" guard), and the `#set_global` tag emits `oldValue: true` (`chat-helpers.js:477`, `:493-497`), which the guard blocks. One switch.
- If the SL4 mapping somehow had not run first, the observer emits with no `oldValue` (one switch) and the tag then carries `oldValue: true` (blocked). Still one switch.
- `music/scenario-music-events.js:34-53` builds the condition scope from the event payload, so `oldValue` is in scope when present and `typeof` keeps it safe when absent.

### 3. Helen's two inline variants

`gauge_decision` is offered only when `not hydrogen_alarm and not esd_before_dial` (`:124`), so the `esd_activated` branch means "ESD pressed after the dial, before the alarm". "The ESD's in, but one of them was lying to us. Which did you go on?" fits that case; "It's off charge, so take your time." is true there (the press cancelled both hydrogen timers). Nothing printed, UK English, no banned words. The two player choices next to them still carry the pre-ESD framing (R3-3, minor).

### 4. Marcus G1, N1, N4, (a), (b)

- **G1** (`:98-102`): needs `hydrogen_alarm and not esd_activated and not facility_evacuated and (anomaly_detected or historian_flatline_found)`. The D3-4 gas option (`:89`) needs neither the dial nor the historian, so the two never both speak; the `esd_activated` line (`:103`) is exclusive by `esd_activated`. Reached from the dial and historian options only; the evacuation option is excluded by its own guard; the session option goes to `rdp_session_confirmed`, which already says "If the ESD's not in, get it in." Correct on every path.
- **N1** (`:127-135`): wording confirmed; the sign-off condition already accepts `jump_server_confirmed`, so the line now names every route that works.
- **N4**: `priya_s_visible` is true after the evacuation and on the safe state, and "The NCSC are with you already. Priya. Use her." fits both. The evacuated status line `:421-422` no longer overclaims; `:459-462` adds the historian line only when `marcus_rdp_briefed` (the only way to be offered the scope question) and no scope was chosen. Marcus's own evacuation text with `network_isolated` still says "they're off our network" (R3-1, minor).
- **(a)** (`:158-165`): fires only when isolated and notified; else "Don't be long." Wording minor (R3-2).
- **(b)** (`:239-250`): `cable_pull_agreed` is set only by Marcus's "cable" lines (`:248`, `:418`, `:443`) and the first evacuation mapping (`scenario.json.erb:1116-1122`); each of those is gated on the cable not yet being out, so it can't become true after an unagreed pull. "And the jump server cable's out. Good." therefore follows only an agreed pull, and "already out, I know" only follows the "Who pulled...?" text (`:1093-1095`). Matches the credits (`:550-551`) and Priya's cable question (`npc_priya_s.ink:248`).

### 5. Tom's `ot_caught_after` (S5, reopen)

- The hub option (`:81`) is sticky (`+`) but gated `not topic_ot_caught_heard`, and the knot sets that flag on its first line and returns to the hub, so it shows once. No sub-choices, so it can't run dry (S5 clear).
- Reached three ways: from `ot_scope` after the session (`:116-118`, which sets `topic_ot_scope_raised` first, so the hub option is then hidden by the flag); from the hub after the scope topic was used before the session; and from the hub after the scope topic was used after the session with a different sub-choice. One answer in each case.
- The hub keeps "Anything new your side?" and "That's all for now." as unconditional options, so a reopen always lands on a live hub; reopencheck agrees (0 problems, 0 replays).
- "From a print server" is shown wherever `jump_server_confirmed` is true (the session log text, `scenario.json.erb:2035`, and the flag body `:1951`), so Tom isn't told something the player hasn't seen. "Instead it took Helen not trusting a screen." works on routes where the dial was never read, which the old "till Helen read a dial" did not.

## Findings

No blocker, Must fix or major. No softlock (S1-S8) introduced: the new gates (G1, N1, N4, (a), (b)) are prose branches that set nothing new, the new dial mapping keeps the same unlock and task on the gas-alarm path, and Tom's new option is one-shot over a knot with no sub-choices.

**R3-1 (minor). Marcus's evacuation text still says "they're off our network" with the historian connected.** `scenario.json.erb:1135` ("Everyone out and counted? Good. At least they're off our network.") fires on `facility_evacuated` with `network_isolated`, whatever the scope. N4 removed this exact overclaim from his status line (`npc_marcus_webb.ink:421-422`), and on the same path his status now adds "The historian's still connected, mind." (`:459-462`), so the two texts contradict each other. Fix (unvoiced phone text): `"message": "Everyone out and counted? Good. At least the enterprise side's cut off."` Helen's safe-state radios (`:856-874`, voiced, "them out of our network") are left alone: Marcus answers her claim on purpose ("Helen's calling it contained... I'd call it watched", `:456-457`).

**R3-2 (minor). (a) wording.** `npc_marcus_webb.ink:162` "Right. I'll be on to Ofgem if they ring." In UK usage "I'll be on to them" means "I'll contact them", which sits badly with "if they ring". Fix: `Right. If Ofgem ring, I'll deal with them.` (unvoiced).

**R3-3 (minor). Helen's dial debate after an ESD: the player choices keep the pre-ESD framing.** With R2-2 she now asks "Which did you go on?", but the choice `npc_helen_marsh.ink:176` "[Neither yet. I want the historian first.]" answers a question about a decision already taken, and `:181` "[Let me think about it.]" gets "Don't think too long.", the urgency the new variant at `:179` has just dropped. Fix, no voiced text added: change `:176` to `+ [{esd_activated:Neither. I pressed it to be safe. Now I want the historian.|Neither yet. I want the historian first.}]` (choice text, unvoiced), and gate `:181` as `+ { not esd_activated } [Let me think about it.]` (the three answers remain, all of which set `gauge_verdict`).

**Note, lab sheet (not a finding; labsheet.md not read in depth, another agent is editing it).** The round-2 log already records that `labsheet.md:552`, `:956` (Q6, "bet the hall on") and `:755` (sign-off sources) are now incomplete. Pass to the lab-sheet editor.

## Verdict

**clean.** Every round-2 fix is in the files and correct on the paths traced; the `mutuallyExclusiveGlobals` declaration is true in every order; the music guard switches once on a station press and once in the evacuation. Three minors (R3-1 to R3-3), all unvoiced text or choice conditions, no TTS cost.
