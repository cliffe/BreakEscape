# m02 Ransomed Trust — dialogue review and pass-4 edit

Script editor's pass, 2 October 2026. Scope: every ink file in `scenarios/m02_ransomed_trust/ink/` and the player-facing strings in `scenario.json.erb` (timed texts, object labels). No engine, shared-asset, or other-mission file touched. No commit.

Snapshot for comparison: `<scratchpad>/m02-dialogue/ink-before/` and `scenario-before.json.erb`.

## 1. npc-dialog-review findings (phase 1 + 2)

### Phase 1 — compile, validator, lint

- **Compile:** all 15 ink files compile, 0 failed (3 pre-existing `-> END` notices on briefing/debrief, legitimate endpoints).
- **Validator:** JSON valid, geometry and doors OK. The 8 objective-wiring warnings (agent_0x99 / ghost multiple `onceOnly` handlers on one event pair) and the `Status:` label suggestion in the press terminal are **pre-existing and structural** — this pass changed no eventMappings, tags or conditions, so they are unchanged. Recorded in the design log already.
- **Lint baseline (worst in the series):** line-len 154, phone-self-prefix 337, not-x-but-y 27, tag-on-narrator 8, blank-reentry 9, exit-no-reply 4, choice-len 19, text-len 33 (erb), stage-cue-density 7, plus cyber-security 3 and banned-word 2. Timed texts median 38 words, max 90.

### Phase 2 — dialogue craft

- **Attribution:** all speaker prefixes resolve. The phone inks (agent_0x99, ghost) carried the contact's own `Name:` prefix on every line (337 instances) — against the m01 convention and the phone-self-prefix rule.
- **Phone emote hazard:** several Ghost lines led with a stage cue (`*without any hurry at all* …`). Harmless while the `Ghost:` prefix sat in front of them, but stripping the prefix moved the `*` to line-start, where ink parses it as a phantom choice. Fixed by folding the cue mid-line or cutting it (see Ghost, below).
- **Economy:** the debrief ran to 71-word lines; the briefing median was 29; Sister Doyle, Kim, Bernie and the phones all carried 30–50-word lines. Timed texts were essays (one at 90 words).
- **Choices:** first-person already, no `You:` echoes to fold (only one allowed non-verbal `You: ...` after Ghost's "Say nothing"). Several choices ran past 15 words.
- **Re-entry:** person-chat hubs (Bernie, Doyle, Gary, Kim, Val, the three patients) parked on choices with no fresh line — the `blank-reentry` tell. Fixed with the m03 `hub_quiet` pattern.
- **AI tells:** 27 "not X, Y" shapes, mostly on HaX (hero) and the narrator; a run of three-adjective and rule-of-three beats; "Trust your training" (on HaX's never-say list); banned "valuable", "navigate"; "Cybersecurity" x3 (should be "Cyber Security").
- **Voice:** the cast is distinct and matches the voice bible (Bernie South-London dry, Doyle Belfast exhausted, Gary Black-Country bitter, Kim RP guilt-under-control, Val Scouse jokes-then-immovable, Reeves and Ghost the two precise villains, HaX clipped). The pass tightened without flattening: villains and Kim keep a few longer lines; patients stay in fragments.
- **Consequence wiring:** unchanged and intact — the naming/reason deduction, the duty-sheet/post-log clues, Ghost's deal and its foothold cost, the four restore routes and their death tolls all read as before, only shorter. No `#set_global` added or removed.

## 2. Changes made

Per file: what changed, why, and the tagdiff verdict. "Structural" differences are all the deliberate `hub_quiet` re-entry additions and the terminal resting-knot self-divert — no tag, knot name, VAR default, divert target, choice condition or sticky/once-only on an existing choice was altered.

### m02_phone_agent0x99.ink (HaX) — STRUCTURE UNCHANGED
Dropped 190 self-prefixes. Rewrote first-call, cover-burn advice, all hints and guide sends to the 25-word phone cap, fact-first. Cut "Trust your training" → "Go." (voice bible). "navigate the filesystem" → "work the filesystem". Median 15, max 50 → 25.

### m02_phone_ghost.ink (Ghost) — STRUCTURE UNCHANGED
Dropped 147 self-prefixes; fixed 10 emote-leading lines that the prefix-strip would have turned into phantom choices (folded the cue mid-line or cut it). Split the villain's long beats into phone-length lines while keeping Ghost precise and unhurried. Kept two signature "not X, Y" lines ("Not ignorant. Warned." / "Not the money. The lesson.") as the villain's one-per-scene allowance; reworded "That's not a threat. It's a capability demonstration." Median 14, max 51 → 25. The `You: ...` after "[Say nothing.]" is retained (allowed non-verbal).

### m02_closing_debrief.ink (HaX / Nightshade) — STRUCTURE UNCHANGED
Split every >30-word line (max 71 → 30) into short beats, keeping all casualty figures verbatim (2 / 1 / 2 / 6 by route, the Bed 4 lines, the "forty-five didn't"). Removed hero "not X, Y" ("That's not coincidence. That's a method." → "…a method, not a coincidence."; the consolation-prize, one-arrest and ravings lines reworded). "Cybersecurity" → "Cyber Security" (×3), "most valuable thing" → "best thing". Every choice-payoff line kept by name.

### m02_npc_receptionist.ink (Bernie) — structural (hub_quiet re-entry)
Tightened all three approaches, the struck-booking hook, the vouch and the Reeves breadcrumb to ≤30 words; trimmed stage directions to delivery cues. Added `hub_quiet` + `met_after_burn` so a re-talk gets a varied greeting and the cover-burn phone beat still fires once (the hub now re-checks `cover_burned_entry`). Fixed a gendered line ("four other men" → "four others").

### m02_npc_ward_nurse.ink (Sister Doyle) — structural (hub_quiet re-entry)
Shortened the ward tour and the fear speech, kept the four-minute/ECMO stakes and the founding-year PIN clue verbatim. Removed "Not the big thing. The small one." and "That's not a failing, that's arithmetic." The hub now carries the return greeting and the burned-cover entry; `hub_quiet` skips it once after a reply.

### m02_npc_gary_whitlock.ink (Gary) — structural (hub_quiet re-entry)
Tightened every topic (warnings, vulnerability at citation level, passwords, family, the board cover-up, the lanyard, the cabinet, the red-herring accusation) to ≤30 words; split the two longest lines at sentence breaks. Kept the credentials (Emma2018/Hospital1987/StCatherines), the ProFTPD 1.3.3c detail and the £85k/£3.2m figures. Added `hub_quiet` to `hub` and `defensive_hub`. Gave the "[Fine.]" exit a one-line reply (exit-no-reply).

### m02_npc_sarah_kim.ink (Dr Kim) — structural (hub_quiet re-entry)
Trimmed the access-control premise, the deferral, the board-vote and all topics to ≤30; kept the boardroom PIN (0417), the escrow founding-year clue and all three advise-the-board branches with their globals. Removed "it wasn't. It's…" and "that is not an apology. That's management." (reworded). `hub_quiet` carries the return/burn greeting.

### m02_npc_security_guard.ink (Val) — structural (hub_quiet re-entry)
Tightened the challenge, the three clearance routes, the Reeves thread and the lockpick catches; kept the `val_opens_office` tunnel, the catch wiring and the `val_met`/`val_caught_picking`/`cover_restored` logic untouched. Removed "He is not on my rota…" and "That's not a badge thing…" shapes. `hub_quiet` + the hub now re-checks `cover_challenge` / `open_after_vouch` on re-entry.

### m02_npc_asset.ink (Graham Reeves) — STRUCTURE UNCHANGED
Tightened the cover, the confrontation and the monologue to ≤30-word beats; folded 4 scripted `You:` lines into the scene (Reeves now works out the point himself). Kept the stance choices and all `insider_*` globals. One villain "not X, Y" retained ("That's not a counter-argument. That's my closing statement.").

### m02_npc_ward_nurse / patients / roaming_nurse
- **patient_bed2 (Mrs Hargreaves), patient_bed5 (Ms Chen):** trimmed to fragments; added `hub_quiet` re-entry so a re-talk shows a line, not a blank hub. Removed Ms Chen's "That's not watching out. That's just…".
- **patient_bed4 (Mr Pryce):** added `hub_quiet`; the `hub` knot now re-checks the deceased/emergency states (a player who spoke to him earlier can still reach the manual-ventilation save on a re-talk). The save, its globals and the deceased branch are unchanged.
- **roaming_nurse (Nurse Raval):** STRUCTURE UNCHANGED. Tightened her three brush-offs and the `bed4_assist` save; the save globals are intact.

### m02_opening_briefing.ink (Netherton / HaX) — STRUCTURE UNCHANGED
Opened on the situation, cut Netherton to a three-line hand-over in his formal register, shortened HaX's hub answers and objectives to ≤30. Removed the "not X, Y" shapes. Median 29 → 18. The knowledge-flag gating and the question hub are unchanged.

### m02_object_press_terminal.ink — structural (resting-knot rule)
The two locked screens now rest on their own choices-only knot (`-> relay_locked_investigation_choices` / `_incident_choices` instead of `-> start`), so stepping away no longer reprints the RELAY LOCKED text into the thread on every exit (confirm3 finding). Trimmed the screen prose. Decision logic unchanged.

### scenario.json.erb — timed texts and small items
- **All 48 timed texts** brought to ≤30 words (median 38 → 28, max 90 → 30), fact-first, keeping every credential, route, flag-chain step, badge number and PIN clue. Removed "That's not a clerical error, that's…", "That's not a drill. That's…", two "however" fake-transitions, "Cybersecurity".
- **Nurse Raval's interaction description** "…she hasn't noticed you yet" → "A second nurse moving bed to bed on manual obs rounds. Too busy to stop." (state-appropriate).
- **patient_bed4 `_comment`** rewritten: the pass-4b static-NPC reach fix now lets the player reach Mr Pryce from the north as well as the side and foot, so the bed-side save is reachable from every approach (Raval remains the second route).

## 3. Lint: before → after

| Rule | Before | After | Note |
|---|---|---|---|
| line-len (ink >cap) | 154 | 0 | |
| text-len (erb >30) | 33 | 0 | |
| phone-self-prefix | 337 | 0 | |
| not-x-but-y | 27 | 3 | all villains (Ghost ×2, Reeves ×1), one per scene — allowed |
| choice-len | 19 | 0 | |
| blank-reentry | 9 | 0 | hub_quiet pattern |
| tag-on-narrator | 8 | 0 | |
| exit-no-reply | 4 | 0 | |
| stage-cue-density | 7 | 0 | |
| cyber-security | 3 | 0 | "Cyber Security" |
| banned-word | 2 | 0 | |
| inflated | 1 | 0 | |
| stage-cue-in-info | 1 | 0 | |
| transition (erb) | 2 | 0 | |
| you-after-choice | 1 | 1 | allowed non-verbal (Ghost "[Say nothing.]") |

Spoken-line word length: debrief max 71→30, briefing median 29→18, phones max 50/51→25, Doyle/Kim/Gary/Val/Bernie all ≤30; timed texts median 38→28, max 90→30.

## 4. Mechanical checks

| Check | Result |
|---|---|
| `compile-ink.sh m02_ransomed_trust` | 15 compiled, 0 failed |
| `validate_scenario.rb` | JSON valid, geometry/doors OK; pre-existing objective-wiring warnings only |
| `check_door_alignment.py` | all OK |
| `tagdiff.mjs` (each file vs snapshot) | 6 files STRUCTURE UNCHANGED; 9 files structural-diff, every diff a deliberate `hub_quiet` re-entry / terminal resting-knot addition, listed above |
| `reopencheck.mjs … m02_ransomed_trust` | 0 problems |
| loopcheck (43-state matrix, every NPC entry knot × key globals) | 0 runtime errors |
| inkcheck (hubs) | 0 failing, 0 runaway |
| `dialoguelint.mjs` after | 0 errors; 3 villain not-x warnings + 1 allowed non-verbal, all justified |

## 5. Script edit round (after `DIALOGUE_EDIT_NOTES.md`, verdict "revise (light)")

Same scope and snapshot. Every must-fix and should-fix item applied; optional items applied where noted.

### Must-fix

- **M1** erb CyberChef text: the guide offer is back ("…Decode it on the CyberChef workstation. CyberChef guide on request.").
- **M2** erb cover-burn follow-up: opens on "Someone inside watched you reach IT." again, then Val, her office and the lanyard-or-vouch routes.
- **M3** erb drill-board text ends on "Signed N/S Supervisor. Who's that?"
- **M4 (deliberate structure change, orchestrator-approved).** Saving Mr Pryce now lowers the toll on the escrow-only route, the only route where the Bed 4 countdown runs. Debrief: three inline conditionals `{bed4_manually_stabilised:Five|Six}` (`manual_recovery_outcomes`, `manual_recovery_guilt`, `final_reflection`); "It would have been seven" became "six"; the choice became "[Ghost said those deaths would be on my conscience.]". Credits: the 6-death entry now needs `!globalVars.bed4_manually_stabilised`, and a new entry "PATIENT DEATHS: 5 (… Bed 4 saved by hand)" needs it set. Console and HaX state no count on that route, and the paid (2), Ghost's keys (1) and combined (2) tolls are unchanged, so all sources agree. A debrief probe across all four routes × Bed 4 none/saved/died confirms: escrow 6 / 5 / 6, the other routes unchanged.
- **M5** Ghost's "Call it a capability demonstration…" cut (it repeated the next line).
- **M6** "Not ignorant. Warned." cut. Ghost keeps one contrast per scene ("Not the money. The lesson."; "I'm invoicing" / "The interesting part isn't that I did" on the first call); Reeves keeps "That's not a counter-argument…".

### Should-fix (S1–S20)

- **HaX phone:** guide replies rewritten in her voice (no "enumerate services" or "attack surface"); the "[Thanks, I needed this]" choices became "[Got it.]"; the deal reaction line is plainer; hero contrasts cut ("That's not a hacker", "past negligence", "Not because…", "Not opportunistic criminals", the Ghost-isn't-wrong pivot); "Important distinction" and the ideology lecture line cut; "The first lock tonight is a person."
- **Post log, one name:** "duty sheet" became "post log" in HaX's choice and three of her lines, two timed texts, Reeves's deflection and the object's observation text, matching the in-world "Night Security Post Log".
- **Debrief:** the "Remember what I said about the injustice…" callback is cut from both Reeves outcomes (only one route had set it up); the closing summary is cut (the scene ends "Get some rest" then "We'll brief the next operation when you're ready."); `ghost_status` now opens "Ghost's gone. Clean exit. No trace, no leads." with no report language or rule of three; the restated "impossible dilemmas" line is cut; hero contrasts cut ("weren't victims", "method, not a coincidence", "We don't win this by…", "not a consolation prize"); tidy endings softened ("Because of you." and "and it isn't crime" cut, "consequential" became "mattered").
- **Player is gender-neutral:** Ghost's "a man who's telling me" became "someone who's"; the debrief's "unidentified man" became "unidentified stranger".
- **"Eleven years" is Bernie's alone:** Val now says "I've stood in a lot of corridors." and "I've had him in my notebook eight weeks."; Gary says "in all my time here". Val and HaX still cite Bernie's eleven years.
- **Val** says "Hospital pass" (it fits the agency, contractor or handover lanyard) and drops "love". **Bernie** says the crisis-protocol complaint in her own words.
- **Ms Chen:** "[Thank you for watching the others.]" / "I'm in the same room as them.", which works on both opening routes.
- **Briefing:** "A badge is a bit of card…"; the "[Who did this?]" reply is now "There's a name, and there's the part that matters. Ask me in that order."
- **Bed 4:** "Tonight the next reading waits for a nurse…"; "Narrator: He watches you read it." is restored before "Fourteen minutes."
- **Reeves:** "at ten to four" dropped from both lines (it clashed with the 04:10 arrival).
- **Ghost:** "We know everything that's happened…" cut; "Include Gary Whitlock's emails. All six months, in order."; "rather the point" became "That was the idea."; cues `*cooler now*` and `*no change in tone*` restored.
- **erb:** Kim's text now reads "That's a debt. Know it's there."

### Voice bible

`voice_bible.md`: the m02 cast heading reads "dialogue revised in pass 4; audio regenerated after it" (it said "frozen, audio cached"); the Netherton example quotes the current briefing line; the sources and costs notes now say only m01's audio is cached and frozen.

### Checks (round 2)

| Check | Result |
|---|---|
| Compile | 15 compiled, 0 failed |
| tagdiff vs snapshot | debrief now 3 structural differences (M4's three conditionals); every other file is as in round 1 (6 unchanged, 8 with the hub_quiet / resting-knot additions) |
| dialoguelint | 0 errors; `not-x-but-y=2` (Ghost and Reeves, one per scene, kept), `you-after-choice=1` (allowed) |
| reopencheck | 0 problems |
| loopcheck | 141 runs, 0 runtime errors. Debrief: 4 restore routes × 4 Bed 4 states × 2 outcome mixes. Every person-chat at `start` and its re-entry hub × 5 states. Bed 4 and Raval × 4 ventilator states. HaX knots, every Ghost event knot, the terminal's 4 gate states, the briefing |
| inkcheck | debrief 800 paths clean; Bed 4 hub, Ms Chen, Val, Bernie clean |
| Validator | JSON valid; only the pre-existing 8 wiring warnings and the `Status:` note |
| Door alignment | all OK |

About 70 spoken lines, choices and texts changed this round, plus one credits entry. m02 audio is generated after this pass.

## 6. Playtest round (after `tools/playtest/m02-pass4-dialogue-report.md`)

### Fixes

1. **False "Bernie's put her name against yours" text (hook, erb).** The mapping on `global_variable_changed:cover_restored` now also needs `globalVars.bernie_vouched === true`.
   - Bernie's own desk vouch sets `bernie_vouched` before `cover_restored`, so the text still fires there.
   - Val's three clearance knots set `cover_restored` first and open the door themselves, so the text no longer fires on the lanyard, ring-Bernie or earn-it routes, and "That'll hold" plays alone.
   - Checked in the engine: `set_global` tags are applied in order and `emit` is synchronous. No ink change.
2. **The ten worst lines and the runners-up:**
   - **Debrief:**
     - Opener: "Sit down. You've earned the chair." (the player was never down).
     - "trying to put it out" (was "carrying buckets").
     - The choice quoting Ghost is now "[Ghost built it so those deaths would land on me.]".
     - The duplicate "no transaction" line and the second "short of funds" line are cut.
     - "feeds every mission", "feeds both" and "That's all this job ever gives you" are cut.
     - "You named Derek the moment I raised it."
     - "[And the Architect? Who coordinates ENTROPY?]" (Ghost never mentions the Architect).
   - **Reeves:** the unexplained "two men in high-vis Bernie was never allowed to name" is cut.
   - **Val:**
     - The drill story now sets itself up ("There was. A fire drill nobody had scheduled… Two men in high-vis, 'facilities', went the other way."); the reference to "Bernie's lads" is gone.
     - Her Reeves speech plays once. A re-ask (`discuss_reeves > 1`) gets a one-line recap and the follow-up questions.
   - **HaX phone:**
     - The suspend/"can't act against you" contradiction now reads "they can cut your line to me for a few seconds… They can't stop you from there."
     - "Ghost also costed the dead first." replaces the "methods" hedge.
     - "Someone the night staff wave through without asking." replaces the receptionist line.
     - "…is the honest answer" and "Deep breath… not the first time" are cut.
   - **Ghost:** the flattery line is cut.
   - **Player lines that quoted things not yet said:** Val's and Kim's drill choices are now "[Anything odd on nights lately? Drills, alarms?]"; Gary's and Kim's accusations say "helped ENTROPY in" (not "the affiliate who confirmed ENTROPY's timing"); Gary's "[Seven times. I know.]" / "You know."
   - **Smaller fixes:**
     - Briefing: "Old-fashioned." replaces "Same way they did in 1987"; "Kim can authorise you all she likes".
     - Raval closes "Right you are." (Doyle keeps "Aye.").
     - "love" now belongs to Mrs Hargreaves only (cut from Bernie and Raval; Val's went last round).
     - Gary's double "Right." is fixed.
3. **HaX after a reload.**
   - The opening menu now rests in a choices-only knot, `first_call_choices`. It goes straight to the hub once the player is past the front desk (`dr_kim_met or cover_burned or flag_ssh_submitted`), so a reload no longer shows the three early buttons.
   - "[Understood.]" now gets "Copy. Call when you need me."
   - "Where do I start?" also retires on `cover_burned` / `flag_ssh_submitted`, so it no longer shows late in the mission.
   - **Directions agree:** Bernie says "Through Ward Three, along the link and up the main corridor. In the handover room, IT's the door on your right." HaX's text says "IT, the right-hand door in the handover room, top of the main corridor." Both match the connections (handover room = `staff_room`, north of the corridor; IT is its east door).
4. **Non-dialogue:**
   - The visitor log shows "… auth: DR S. KIM [struck through, different pen, no initials]" instead of the literal `~~`.
   - **Val's notebook is handed over once.** `reeves_notebook` now sets `#set_global:val_notebook_given:true`, declared in `globalVariables`, so the existing `{not val_notebook_given}` gates survive a conversation that is cut short or reloaded.
   - The recovery console's raw " -- " is left for the engine item, as instructed.

### Structure changes this round (deliberate)

- `m02_phone_agent0x99.ink`: new knot `first_call_choices` (the three opening choices moved into it, with a progress check that diverts to `support_hub`); `hint_start` choice condition extended with `and not cover_burned and not flag_ssh_submitted`.
- `m02_npc_security_guard.ink`: `discuss_reeves` re-ask branch (`{discuss_reeves > 1: … -> reeves_questions}`); new tag `#set_global:val_notebook_given:true` in `reeves_notebook`.
- `scenario.json.erb`: the hook condition gains `bernie_vouched`; new global `val_notebook_given: false`.
- Everything else is prose.

### Checks

| Check | Result |
|---|---|
| Compile | 15 compiled, 0 failed |
| tagdiff vs snapshot | debrief 3 (M4, last round); HaX 20 (`first_call_choices` move + `hint_start` condition); Val 27 (round-1 re-entry + re-ask branch + notebook tag); other files as before |
| dialoguelint | 0 errors; `not-x-but-y=2` (kept villain lines), `you-after-choice=1` (allowed) |
| reopencheck | 0 problems |
| loopcheck | 116 runs, 0 runtime errors (debrief 4 routes × 3 Bed 4 states; every person-chat at `start` and `hub` × 5 states; Val re-ask and notebook-given; HaX `first_call` / `first_call_choices` / `support_hub` × 4 progress states; every Ghost event knot; terminal gates; briefing) |
| inkcheck | HaX first call, Val, debrief (800 paths), Gary: clean |
| Death-toll probe | unchanged: escrow 6 / 5 saved / 6 died; paid 2; Ghost's keys 1; combined 2 |
| Validator | JSON valid; pre-existing warnings only. Door alignment OK |

About 40 spoken lines and choices changed this round, plus 3 erb strings and the visitor log.
