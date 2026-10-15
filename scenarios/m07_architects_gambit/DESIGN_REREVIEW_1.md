# m07 The Architect's Gambit — design re-review 1 (pass 4)

Reviewer: fresh adversarial re-review, 2026-10-02. Read-only apart from this file. Scope: the
"Changes made (pass 4 design)" section of `DESIGN_REVIEW.md` and `git diff HEAD` over the mission,
`story_design/` and `scripts/ink_runtime_check/missions.json`.

## Checks I ran (static; no browser test)

| Check | Result |
|---|---|
| `ruby scripts/validate_scenario.rb` | 0 errors. 6 wiring warnings, all co-firing `onceOnly` HaX rows (intended). No "same unlock target" warning (see F3 for why). Running it regenerated `dungeon_graph.*` (already modified in the tree; same 41/47 puzzle graph). |
| `python3 scripts/check_door_alignment.py` | All doors OK. |
| `tagdiff.mjs` | 47 structural differences, matching the implementer's list: new VARs, `bring_me_in`, `topic_teacher`, `revision_lesson` + 4 re-pointed diverts, Tomb Gamma condition, Mercer/Elena conditions, 2 `set_global`, 1 `exit_conversation`. Mercer, Hollis, Park, briefing: no structural change. |
| `dialoguelint.mjs` | line-len 109, text-len 11, choice-len 4, not-x-but-y 13, banned-word 1. New or worsened by this pass: flag-3 texts now 35/38 words (`erb:812`, `:820`), the Park pointer 33 (`erb:866`), the `topic_teacher` choice 16 (`m07_phone_agent_0x99.ink:224`). See F9. |
| `reopencheck.mjs … m07` | agent_0x99 1800 reopens, the_architect 1800 reopens, 0 problems. |
| Globals | `architect_echo_heard`, `debrief_requested`, `debrief_timer_fired`, `elena_met` declared (`erb:1776-1779`, `:1801`) and in the m07 block of `missions.json`. Each is a VAR in every ink that reads or sets it (HaX `:29-30`, Architect `:32`, Elena `:35`, debrief `:39`). `teacher_discussed` is local to HaX, which is right. |

## Fixes verified as done and sound

- **Fix 1, the debrief on request.** Every `closing_debrief` trigger now needs `debrief_requested`
  (`erb:1197-1210`). Routes I traced:
  - *All flags in, plant skipped, then done after the abort:* the sign-off sets `architect_signoff_done` (`m07_architect_comms.ink:299`), HaX texts "…now's the time. Call me…" (`erb:943-949`), the hub shows `[Bring me in.]` (`m07_phone_agent_0x99.ink:178`), and its exit closes the phone, so `minigame_completed` opens the debrief (`base-minigame.js:98`). The vault, Park and Mercer's post-abort lines are reachable now.
  - *A flag missing:* the nag now ends "then call me" (`erb:939`). `bring_me_in` says "Not until…" (`:272-276`), and the flag-station close after the last flag opens the debrief (flag-station is a `MinigameScene`).
  - *Player never calls:* `debrief_fallback` (`erb:651-661`) → `debrief_timer_fired` → HaX's mapping sets `debrief_requested` (`erb:950-956`).
  - *Reload:* the timer dispatcher restarts a `startOnGlobal` timer from reload time and cancels it if `debrief_requested` is already set (`scenario-timer-dispatcher.js:36-61`). The hub choice is the backstop for the "call me" text a reload drops.
  - *Re-navigation:* `bring_me_in` and `topic_teacher` own no choices, and the hub has no leading text (PASS3 phone rule, E13).
- **Fix 2.** `threat_desk_summary` matches the briefing's figures (`m07_opening_briefing.ink:54`, brief knots). "02:41 PT / 10:41 UTC" is PST, so it agrees with December and with the intercept's 09:50 UTC (51 minutes). The nudge and the decode now point at it (`erb:740`, `:1464`).
- **Fix 3.** `elena_met` is set in `opening` (`m07_npc_elena_rodriguez.ink:70`). The debrief order is KO → turned → fled → met → else (`m07_closing_debrief.ink:318-333`), and "hospital column half put back" is true: it's what she is doing when you meet her (`:80`). The credits are disjoint (`erb:199-200`).
- **Fix 4.** The statement/transcript lines play only for `arrested and not mercer_ko` (`m07_closing_debrief.ink:294-313`).
- **Fixes 5, 6, 10, 13, 14 (win lock), 15, 16, 20.** Done as described. The badge lesson fires only for `printed_contractor_badge` (Hollis's badge is `hollis_server_badge`, `erb:1092`). Its "date's on a sheet in the next room" is true: station in the checkpoint, sheet on the ops floor (`erb:1311-1318`). The vault lesson keys on `objective_task_completed:recover_vault_pin`, which is the door.
- **Fix 9.** One server-hall text now. The vm-launcher row sets both guide latches (`erb:917-921`).
- **Fix 11.** The aphorism sits in the decode above "-- A." (`erb:1465`). No TTS cost.
- **Fix 12.** One calendar: survey 15 June, keypad reset 16 June, "six months" (matches Hollis), "in June", tonight December. For the new line, see S3.

## Findings

### F1. [major] `topic_teacher` tells some players they heard a line they never heard

`topic_teacher` branches on `moral_discussed` ("You've heard me say it.", `m07_phone_agent_0x99.ink:405-406`).
`moral_discussed` is set on *entering* `moral_soundingboard` (`:336`). HaX's line is in only one of its two
choices ("How do you carry that?", `:344-345`), and the hub entry disappears once `moral_discussed` is set
(`:198`), so only one of the two can ever be picked. A player who chose "Was there a right answer?" is told
"You've heard me say it", which is false. The plant is the one beat in this pass that has to be exactly right.

**Fix.** Add a local `hurt_line_heard`, set in the "How do you carry that?" branch, and branch `topic_teacher`
on it. Better, together with S1: give HaX the line where every player hears it, so the branch is not needed.

### F2. [minor] The fallback's warning arrives as the debrief arms, and can say the wrong thing

- The timer sets `debrief_timer_fired`, and HaX's mapping sets `debrief_requested` straight away while the text follows 0.5 s later (`erb:950-956`). From that moment any closed screen opens the debrief, including closing the phone to read the warning. "Bag what you've got" therefore gives no time to bag anything: a player halfway through the vault loses whatever isn't picked up yet.
  - **Fix:** a two-step fallback. Add a timer at about 6 minutes that only texts ("Netherton's getting restless. Couple of minutes, then he's on the link whether you're ready or not."), then the 8-minute one requests the debrief.
  - Or keep one timer and put the warning in the HaX text sent *on* `architect_signoff_done` ("…Call me when you're ready. If I don't hear from you in about eight minutes, he comes on anyway.").
- "Next door you go through, he's on the link" isn't true when a flag is still missing: the debrief waits for the last flag. Split the row on the four flag globals. The flags-missing variant: "Netherton's done waiting. The moment the last of it is through the relay, he's on."
- Edge case: a reload between `architect_signoff_started` (set by the mapping, `erb:1161`) and the `#set_global` at the top of `sign_off` leaves `architect_signoff_done` false. The timer and the "call me" text then never start, and the player gets no pointer to the hub choice. Starting `debrief_fallback` on `grid_saved` (8 min + roughly 1 min of sign-off is fine) closes that.

### F3. [minor] The validator's "two routes to cable_vault": no second route was intended. The graph now draws one

There is one way into the vault. The keypad code is the last four digits of the ATS-1 plate serial (`erb:1644`).
The rule that says so is only in the relay decode (`erb:1465`). HaX's vault hint points at the decode, never
at the plate (`m07_phone_agent_0x99.ink:468-479`). The player needs both: an AND, not an OR.

When the implementer put `puzzle_graph_unlocks: cable_vault` on the decode item, the validator correctly
flagged two OR sources (`validate_scenario.rb:2642`). Moving it to the task `recover_coordination_traffic`
(`erb:384`) only silenced the warning, because the validator doesn't collect task-level unlocks. The graph
still draws two independent edges into `door_cable_vault` (`dungeon_graph.md:146`, `:150`), which reads as two
routes.

**Fix.** Remove `puzzle_graph_unlocks` from the task. On the ATS-1 object add
`"puzzle_graph_and_with": "Coordination Schedule -- Relay Decode"`; the generator resolves it by `nid(name)`
(`generate_dungeon_graph.rb:193-199`, `:261-283`) and draws a `+` gate. Then re-run the validator.

### F4. [minor] The Park pointer can arrive after Park has gone for you

The condition is checked on `room_entered:cable_vault`, and the text is delivered 9 s later (`erb:862-867`). A
player who picks "Then finish it and see what happens" inside those 9 s (`m07_npc_thomas_park.ink:99-106`,
Park turns hostile) is then told to fetch a page "if you want him to read it". **Fix:** add
`"skipIfGlobal": "park_resolved"` (checked at delivery, `npc-manager.js:1428`). If 33 words is to come down
(F9), cut the delay to about 4 s as well.

### F5. [minor] The last task doesn't say how to get the debrief

`take_the_debrief` is still titled "Take the debrief" (`erb:562`). The only pointer to "call HaX" is a phone
text, and a reload drops it from history (PASS3 phone rule). **Fix:** retitle it "Call HaX when you're ready to
be brought in". The completion logic stays the same.

### F6. [minor] "Now's the time" plays to players who already did the plant

`erb:947` tells every player "If there's anything down in the plant you want bagged, now's the time". For a
player who already has the intercept, that's noise. **Fix:** add a `&& !globalVars.found_mole_evidence` row with
this text, plus a disjoint row with just "Grid's held. Netherton wants you on the link. Call me when you're
ready to come in."

### F7. [minor] The credits still say "MERCER ON RECORD" for a Mercer who isn't

Fix 4 cleaned up the debrief. The three stance credits (`erb:192-194`) still say "ON RECORD" for an escaped,
KO'd or walked-off Mercer. **Fix:** "MERCER, CONFRONTED: …", or add `&& globalVars.mercer_fate === 'arrested'`
and a neutral second set.

### F8. [minor] Threat desk summary wording

- "FRACTURE -- Washington" (`erb:277`): the same document says the grid serves Washington *state*, and so did the briefing. Write "Washington DC".
- "pushed to your phone" (`erb:276`): it's an inventory document. Write "pushed to your handset".

### F9. [minor, dialogue stage] Lint regressions this pass introduced

- Fix 8 took the flag-3 texts to 35/38 words (`erb:812`, `:820`).
- The Park pointer is 33 words (`erb:866`).
- The `topic_teacher` choice is 16 words (`m07_phone_agent_0x99.ink:224`); S1's label fixes it.
- `revision_lesson`'s "because he allowed it" (`m07_closing_debrief.ink:206`) has no clear antecedent on the Fracture, Meltdown and no-team paths. Write "because the Architect allowed it".
- `topic_teacher` opens "...Say that again." (`:403`), and `topic_mole` opens "Say that again slowly" (`:418`). A player who does both hears the same reaction twice.

### F10. [minor, docs/canon, for the log]

- `CONTRACT.md`'s pass-4 global list omits `architect_echo_heard`.
- The universe bible already has a "Tesseract Research Institute" founded by "Dr. Marcus Tesseract" (`story_design/universe_bible/06_locations/notable_locations.md:29`, `:44`). That's a name clash with the season's Dr. Adrian Tesseract. The orchestrator should log it; it isn't an m07 file.

## Story editor's notes

### S1. [minor, with F1] The Tesseract plant: his half is right, hers isn't earned yet

**The Architect's half works.** "Let it hurt afterwards, not during. I expect you've been told that."
(`m07_architect_comms.ink:116`) is in his voice: short, a little condescending, and it doesn't explain itself.
It also matches the voice bible's "once per mission, never explained" rule. Keep it.

**HaX's half is surfaced by the menu, not noticed by the player.** Almost nobody has heard HaX say the line
first: it's one of two exclusive answers inside an optional topic (`m07_phone_agent_0x99.ink:198`, `:344-345`).
For everyone else, the Architect says a line that means nothing to them. Then a new hub entry appears quoting it
back word for word, and HaX explains that it's hers. The UI has done the noticing, so the player is told the
connection rather than catching it.

**Fix.** Make it a plant every player can catch:
- Give HaX the line where every committed player hears it, before the ops floor. The lead text of the first call is the place: after "I'm not going to relitigate it with you." add "Let it hurt afterwards, not during." (`:101`; it's a text knot, so the re-navigation rule is safe). The Architect then says it a few minutes later, from the other side of the line.
- Shorten the hub label to "He used your line. 'Let it hurt afterwards.'" That fixes the choice length too.
- Drop the `moral_discussed` branch (fixes F1).
- Keep HaX's reply as written: "Somebody who taught a lot of us" and "keep it out of your notes" carry the m06 lead and the mole thread without naming anyone.

### S2. The debrief on request reads naturally

It reads well. "Netherton wants you on the link… Call me when you're ready to come in." is how a handler
would hand over, and "Bring me in." is a good player line. It also gives the player one quiet beat after the
Architect, which the old automatic cut didn't. The weak spots are mechanical: the warning timing in F2, the
task title in F5, and F6's line playing to players who don't need it.

### S3. [minor] Elena: "It's December. It's twenty-eight degrees outside."

- **Setting.** Consistent. Portland, Oregon. "02:41 PT = 10:41 UTC" is Pacific Standard Time, so the season is right. The ops-floor board reads "OUTSIDE TEMPERATURE: 28 F" (`erb:1299`), and an American grid engineer would say "twenty-eight degrees" and mean Fahrenheit. A cold Portland night at −2 °C is plausible.
- **Units.** This is a UK-English game, and the line will be spoken by TTS with no unit. Most players hear "twenty-eight degrees" as a hot day, which flips the meaning. Only someone who read the board catches it.
- **Why it matters.** It answers her own "when nobody's heating is load-bearing" two lines up (`m07_npc_elena_rodriguez.ink:132`): in December the heating is what keeps people alive, which is where Mercer's cold deaths come from (`m07_npc_james_mercer.ink:175`). It's a good beat, but it arrives late. After "It's on that laptop" it reads as a non sequitur.
- **Fix.** Move it up to sit straight after the September line. Lose the number: "It's December. It's below freezing out there." That also gives the dialogue stage a chance to replace "load-bearing" (lint banned-word, `:132`), e.g. "…in September, when nobody needs the heating."

## Verdict

**Another round needed.** The round can be short: fix F1 (best done with S1), then F2–F8. After that a
confirmation pass, and the mission is ready for the dialogue stage. Nothing found blocks play. Every route I
traced (abort-then-plant, missing flags, never calling, reload) reaches the debrief, and its branches match
what happened.
