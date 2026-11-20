# m07 The Architect's Gambit: puzzle-chains review, pass 5, cycle 2

Stage 2, `mission-puzzle-chains` rubric. Fresh reviewer, read-only. 2026-10-14.

Everything below was checked against `scenario.json.erb` (cited `erb:N`), the ink (`ink/<file>:N`) and the engine under `public/break_escape/js/`. I opened no SecGen XML and none of the four restricted field guides. I started no browser session (a Sonnet browser check runs alongside), and I edited no file except this one.

## Checks run (outputs in the session scratchpad, `m07-puzzle-c2-reviewer/`)

- **Route driver.** r1–r19 all pass ("all expectations met").
- **Probe routes** (scratch only, all pass; they cover states no checked-in route does):
  - `p1_clone_then_talk`: clone first, then come back with the handover sheet and talk. The record ends as `talked`, and the credits say "Talked", not "Evaded".
  - `p2_park_projection_before_visit2`: evade once, read the projection, then return. Visit 2 offers "Read this", HaX's hint stays quiet, and Park ends `talked` (the S2 check from cycle 1).
  - `p3_park_click_retalk`: after "Nothing. I was never here." the player stays in the vault and talks to Park again. That's a resume, with no start knot, so it isn't counted as a return. The next room entry plays "Second time", and `park_returns` is 1.
  - `p4_clone_then_ko`: clone, then "Walk at him" on the next sighting. The controls text fires, and the KO record wins ("Neutralised on shift").
  - `p5_badge_held_no_clone`: with a badge already held, the clone choice stays hidden after the stakes exchange.
  - `p6_hostile_hollis_walked_away`: Hollis turns hostile and the player walks away, as HaX's text advises. The credits print "RAY HOLLIS: Left at his post — still on their payroll" (F9).
- **dialoguelint**: 0 errors. transition 1, not-x-but-y 1, you-after-choice 2, blank-reentry 6, the same as after round 1.
- **Validator** (`--skip-ink --no-graph`): schema passes, as do geometry and doors. There are 11 duplicate-mapping notes, the same as round 1 and all deliberate (independent latches). There are also 4 person-chat cutscene warnings: Hollis's sight chat and Park's entry chat are repeatable on purpose.
- **Engine facts used below.**
  - The clone. `#clone_keycard` reads the NPC's `rfidCard` (`chat-helpers.js:312-380`). Save emits `card_cloned` with `cardName` before the chat resumes (`rfid-minigame.js:286-306`). The saved card is synced to the server (`rfid-data.js:368`, `game.rb:1504`). A matching clone opens the reader (`unlock-system.js:478-481`), and the server trusts the client for RFID (`game.rb:986-990`).
  - Conversations. A room-entry conversation restores the saved story and then jumps to `start`. A click resumes the saved story where it stopped (`person-chat-minigame.js:466-490`).
  - Combat.
    - NPCs don't attack while a minigame is open (`npc-combat.js:48-50`).
    - A hostile chase has no range limit (`npc-behavior.js:1332-1440`; `chaseRange` is unread, U10).
    - Q cycles interact → jab → cross → interact (`hud.js:369-377`, `:402`; `combat-config.js:34`; tutorial wording `tutorial-manager.js:246`).
    - In jab or cross mode a click punches rather than walks (`game.js:1588-1591`).
  - Reloads. After a reload the player spawns in the start room (`player.js:206-207`, regression m-14). Hostility is restored (`npc-hostile.js:63-110`). NPC positions are not saved, so a hostile Hollis is back on his patrol in that room.

## Confirmation of round-1 findings

| # | Round-1 fix | Where checked | Confirmed? |
|---|---|---|---|
| F1 | `park_returns` counter, `last_chance` knot, `lunge`/`turned` stitches; HaX texts say to carry the projection back | `ink/m07_npc_thomas_park.ink:20-22`, `:104-119`, `:129-155`; erb:1009-1014; `ink/m07_phone_agent_0x99.ink:642-647`; routes r2, r13, r18; probes p2, p3 | **Yes.** A third visit with the projection gets one sentence; without it, Park swings. The counter survives a page reload (r18). Re-talking him by click inside the vault doesn't count as a return (p3). Visit 1 and visit 2 both still offer the projection when it's held (p2, S2) |
| F2 | `behavior.hostile` Hollis 100/4, Park 80/4, Mercer 70/3; three HaX controls texts keyed on `npc_hostile_state_changed` and `!restored` | erb:1291-1294, erb:1966-1969, erb:1799-1801; erb:1040-1058 | **Yes,** as specified. The wording carries a new error (F8) |
| N1 | Debrief Hollis "talked" lines | `ink/m07_closing_debrief.ink:448-452` | **Yes.** It now matches his `deal_take` (`ink/m07_npc_ray_hollis.ink:193-216`) |
| F3 | Hollis `rfidCard`, clone hub choice, `clone`/`clone_debrief`, HaX `card_cloned` mapping | erb:1284-1288, erb:1063-1069; `ink/m07_npc_ray_hollis.ink:96-97`, `:138-155`; r14; probes p1, p4, p5 | **Yes,** it works. The design gap is F7 |
| F4 | `vault_hint` checks the Hollis and Elena rule first | `ink/m07_phone_agent_0x99.ink:651-660` | **Yes** |
| F5 | Elena KO text: "How to read the vault code…" | erb:1031 | **Yes** |
| F6 | Stale comments | erb:328-342 (aim chain, U5), erb:1615 (Elena: "the rule for reading the vault code"), erb:275-279 (cloner) | **Yes** |
| C1 | Informed commit elsewhere with the window open | `ink/m07_closing_debrief.ink:244`, `:319`, `:340`, `:352`; r15 | **Yes** |
| C2 | `decode_before_commit` latch | erb:939, erb:2077; `ink/m07_closing_debrief.ink:46`, `:179`, `:268`; credits erb:203-204; `missions.json:1040`; r16, r17 | **Yes** |
| N3 | Praise after "Nobody put it next to the brief" | `ink/m07_closing_debrief.ink:604`, `:638`, `:656`; r8, r19 | **Yes** |

All ten round-1 findings are fixed as logged. I found no regression from them in the routes, the probes or the static checks.

## Severity table (new this cycle)

| # | Sev | Finding (short) |
|---|---|---|
| F7 | minor | The clone is on offer in the very first chat, before the player has seen the reader. It gives the same record as the printer route for less work, and a clone-first player is never offered the RFID guide |
| F8 | minor | HaX's three controls texts say "Q again stows them", but Q goes from jab to cross, so the next click punches. "Walk away" also promises more than the engine gives. The Q wording is shared with m05 and m06 |
| F9 | minor | A Hollis who turned hostile and was walked away from gets the credit "Left at his post". The debrief says "He went for our agent" |
| F10 | minor | The clone narration says "You ask how much again" when the player picked "No. It's exactly what you meant." (dialogue stage) |

**Counts: 0 blockers, 0 majors, 4 minors.**

There is no soft-lock on the ending's path. Every lock still has a route that can't be burnt. The badge has four (talk, printer, KO, clone), the plant door two (key or picks), the control room door two (Elena or flag 2), and the console one (flag 4). On optional content, I found no new dead end in the Park last-chance flow (r13, r18, p2, p3), the hostile tuning (r2, r3, r18, p4, p6) or the clone (r14, p1, p4, p5).

---

## Do four routes to the badge cost something different?

| Route | Needs | What it costs | What it teaches | Record |
|---|---|---|---|---|
| Talk | Handover sheet (ops floor, d1), then a return to d0 | The arrest: he walks out | Leverage from paperwork | `talked`; vault rule + Park tip |
| Printer | Handover sheet date (d1) → badge station PIN (d0) | Nothing on Hollis. You still have to get past him (back off) | A PIN set to a date that's on paper next door (erb HaX lesson text) | Hollis `evaded`, or "left at post" |
| KO | A fight at 100/4 | A man in hospital, "two children" (`ink/m07_closing_debrief.ink:443-447`) | Force has a cost | `ko` / `hollis_ko` |
| Clone | One stakes exchange, then one choice | Nothing beyond backing off | Spends the m03 cloner | `evaded` |

**Verdict: four is not too many,** because each route teaches a different lesson and three have different costs. The clone and the printer, though, give the same record (`evaded`, the same credit and the same debrief line). The clone needs no hunt, and as gated now it can be taken before the player has seen the lock. So for anyone who doesn't want the vault rule, it is the cheapest route, and it takes the shine off the printer route and the mission's first boss-key chain. That is F7. The fix keeps all four routes and gives the clone its own beat and its own record.

---

## Minor findings

### F7. The clone comes before the lock, and its record matches the printer's
- **Evidence.**
  - The hub choice is gated on `pressed_once and not hollis_cloned and not badge_obtained` (`ink/m07_npc_ray_hollis.ink:96`). `pressed_once` is set by the stakes exchange in the first sight-challenge chat (`:116-122`). r14 takes it there, before `operations_floor` is entered. So the badge is in the cloner before the player has seen the server-hall reader. That is key-before-lock, on the opening chain the cycle-1 audit rated ✅ boss-key for the talk and printer routes.
  - The clone mapping sets `badge_obtained` (erb:1067). The ops-floor RFID mapping needs `!badge_obtained` (erb:1086-1092), so a clone-first player never gets HaX's "Hollis has one… RFID guide?" text, or the cloning guide that would explain what they just did. r14 asserts `notSaid: "RFID guide?"`.
  - The record after a clone is `evaded` (erb:984-988), with the credit "Evaded — still on the checkpoint desk" (erb:228) and the debrief line "still at his post" (`ink/m07_closing_debrief.ink:453-454`). That is exactly what the printer-plus-back-off route records.
  - Robustness: `hollis_backed_off` is set only in `clone_debrief` (`ink/m07_npc_ray_hollis.ink:148-149`). Suppose the page reloads in the 1.5 s between Save (which syncs `hollis_cloned`) and the chat resuming. Then the clone is held, but the server-hall mapping never records `evaded`, and the debrief says "Nobody had asked him anything yet" (`:459`).
- **Why it matters.** It's the cheapest way through the mission's first real lock, and it gets past the lock without the player ever meeting it. It also spends the m03 capability without its guide.
- **Fix** (mission-local, three small edits).
  1. Gate the choice on having seen the reader. In `m07_npc_ray_hollis.ink`, declare `VAR inside_reached = false` (a synced global, set at erb:1017-1021). Change `:96` to `+ {pressed_once and inside_reached and not hollis_cloned and not badge_obtained} [Keep him on the money. Let the cloner read his belt.]`. The player then meets the reader, HaX texts "Hollis has one" and offers the guide, and the walk back to the checkpoint is the return beat. Add `inside_reached` to the `missions.json` m07 globals for reopencheck.
  2. Give the clone its own credit, ahead of the evaded line: `{ "text": "RAY HOLLIS: Badge copied off his belt — he never knew, still on their payroll", "style": "warning", "condition": "globalVars.hollis_cloned && globalVars.hollis_resolved === 'evaded' && !globalVars.hollis_ko" }`. Add `&& !globalVars.hollis_cloned` to erb:228. Optionally add a debrief clause under `hollis_resolved == "evaded"` in `ink/m07_closing_debrief.ink:453` for `hollis_cloned` (dialogue stage).
  3. Add `"hollis_backed_off": true` to the `card_cloned` mapping's `setGlobal` (erb:1067). Keep the ink set as well.
  - Routes: r14 needs `{"enter": "operations_floor"}` before the clone talk, and its `notSaid: "RFID guide?"` flips to `said`. Add a probe-style check that the choice is hidden before `inside_reached`.
  - S2: after the change, a player holding the printed badge still doesn't see the choice (p5). A player who took the stakes exchange on the first chat sees it on the next sighting, after the ops floor (`wary_again` → `back` → hub).

### F8. HaX's controls texts get Q wrong and promise too much from walking away
- **Evidence.**
  - erb:1045, erb:1051 and erb:1057 all end "Q again stows them, then click to walk."
  - Q cycles through three modes: interact → jab → cross (`combat-config.js:34`, `hud.js:402`). The tutorial says so: "cycle through Interact, Quick Jab, and Cross Punch" (`tutorial-manager.js:246`). A player who presses Q for fists and then Q "again" is in cross mode, and a click there punches (`game.js:1588-1591`). It takes two more presses to walk by clicking.
  - "Or walk away: he's slower than you" is true over the first few seconds: 100/80/70 against the player's 150. But the chase has no range limit (U10), so the NPC follows across rooms. The player is safe only inside a minigame (`npc-combat.js:48-50`), and the NPC is still standing there when it closes.
  - After a page reload, a hostile Hollis who wasn't knocked out is restored as hostile and back on his patrol in the start room, which is where the player respawns (m-14). This isn't a dead end at 4 damage a hit against 100 HP, but the text doesn't prepare the player for it.
  - m05 (erb:1303) and m06 (erb:1404) use the same "Q again stows them" wording, so this is a cross-mission note for the orchestrator.
- **Fix.** Reword all three texts within the 30-word cap. For example (Hollis): "He's coming for you. Q for fists, then E or click when he's in front. He's slower than you, but he keeps coming. Q twice more to walk by clicking." Use "Park's swinging." and "Mercer's coming at you." as the openers for the other two. Tell the orchestrator about m05/m06. Arrow keys and WASD walk in any mode, so "Or walk away" can stay if the dialogue stage prefers it.

### F9. The credit for a hostile Hollis who was left standing
- **Evidence.** Probe p6: Hollis goes hostile ("Walk at him" → "Put it down", `ink/m07_npc_ray_hollis.ink:228-247`, which sets `hollis_resolved = "ko"`), and the player walks away. The credit printed is erb:229, "RAY HOLLIS: Left at his post — still on their payroll". The debrief says "He went for our agent. We will be asking why." (`ink/m07_closing_debrief.ink:457-458`). Park has the matching line, "Fought off, not stopped" (erb:233). F2's text now tells players to walk away, so this state will come up more often.
- **Fix.** Add `{ "text": "RAY HOLLIS: Went for you, left standing — still on their payroll", "style": "warning", "condition": "globalVars.hollis_resolved === 'ko' && !globalVars.hollis_ko" }`. Add `&& globalVars.hollis_resolved !== 'ko'` to erb:229. Add p6 as a route.

### F10. "You ask how much again" when the player never asked (dialogue stage)
- **Evidence.** The stakes exchange offers "No. It's exactly what you meant." or "How much?" (`ink/m07_npc_ray_hollis.ink:128-133`). Both set `pressed_once`. The clone opens with "You ask how much again, and step in close…" (`:139`).
- **Fix.** "You ask how much it was, and step in close while he works out an answer." Leave it for the dialogue stage. It's one narrator line.

---

## Fresh review: other areas checked, no change recommended

- **The Park last-chance flow.**
  - Visit 1 hub; visit 2 "Second time", then the hub; visit 3 `last_chance` with the projection, or the swing without it.
  - Each path leaves the player somewhere sensible, and the HaX hint fires only on a room entry while Park is evaded and the projection unread (erb:1009-1014).
  - A click inside the vault resumes at the hub and doesn't advance `park_returns` (p3).
  - A reload respawns the player in the start room, so a reload can't count as a vault entry.
  - `last_chance` → "(Step back.)" → `lunge` → hostile is a deliberate second refusal. The text sends nobody into it.
- **The hostile tuning.**
  - 100/4, 80/4 and 70/3 against a player at 150 with 100 HP and 10–25 damage punches (`combat-config.js:13-38`). Each fight is short and survivable.
  - The music event (erb:142-146) correctly comes back with a restored hostile.
  - The controls texts don't repeat on a reload (`data.restored !== true`; `npc-hostile.js:103-108` emits `restored: true`).
- **Clone exploits.**
  - Cloning again after a success is hidden (`hollis_cloned`).
  - A cancelled read returns to the hub with the retry.
  - A clone followed by talk or a KO hands the record to the stronger outcome (p1, p4).
  - Reading the printed contractor badge in the reader's minigame can't trip the clone mapping, because the condition is on the card name (erb:1066).
- **Mercer.** He turns hostile only at the end of a confrontation (`ink/m07_npc_james_mercer.ink:355-366`). The console minigame protects the player while they work, and the ending never needs him. Browser check still owed for his controls text: no route turns him hostile through a mapping that the driver models.
- **The struggling player.**
  - At the badge: HaX's ops-floor text names Hollis and the station. After F7, a clone-first player gets it too.
  - At Park: visit 1 warns and visit 2 points to the projection. With the projection, visit 3 gets one sentence.
  - The ending: "Bring me in" plus the 9-minute fallback.
  - Nothing a struggling player can miss strands the ending.

## Verdict

Puzzle chains **can close** once the concurrent browser check comes back clean. This round found nothing above minor: 0 blockers, 0 majors, 4 minors. All ten round-1 findings are confirmed fixed, and r1–r19 plus six probes pass.

The four minors are cheap and mission-local. F7 needs one ink condition, one credit line and one `setGlobal` key. F8 and F9 are text and credit edits. F10 is one narrator line, which can go to the dialogue stage. Taking F7–F9 in the closing fix round is recommended, but they don't hold the stage open.

The browser check still owes everything listed at the end of round 1:
- Park's last chance and the step-back chase;
- the three chase speeds and their texts;
- the clone, the reader and the clone surviving a reload;
- the N1 line.

## Items for the user / orchestrator

- **Cross-mission:** "Q again stows them" is wrong in m05 (erb:1303) and m06 (erb:1404) as well (F8).
- **Engine (already pending):** U9 (cloner screen with nothing to emulate), U10 (`chaseRange` unread). Regression m-14 (respawn in the start room) makes F8's reload case possible.
- **Needs checking against SecGen by the user:** U3, unchanged. I opened none of the files.

*Reviewed against `scenario.json.erb`, the ink and the engine. Cycle 2 of the pass-5 puzzle-chains stage.*
