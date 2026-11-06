# m08 The Mole: pass-4 dialogue playtest

Game 1425 on keyless :3001, headless, speed fast. Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/129f788c-d240-4d67-b97d-c380ab27daf1/scratchpad/m08-dlg-playtest/session.jsonl`. Source of steps: brief plus `PASS4_PLAYTEST.md` route. Dialogue read from the DOM via `brief` (every line), screenshots at selected points.

## Findings as I go

### Opening, interviews (pass)
- ATHENA cutscene, Netherton intro, hub, "[I'll need access.]" before interviews: all read cleanly. No "Name:" prefixes in the person-chat view, narration is centred grey italic with no speaker label (s05.png). Narration sits over the sprite torso and is a little hard to read there (minor).
- Tutorial prompt modal appears after the opening cutscene (bootstrap normally dismisses it); had to dismiss manually before movement.
- Phantom: "Same three as yours, minus me." (two suspects remain, arithmetic reads odd). "...when the evidence backs me -- tell the Director" shows a literal double hyphen.
- Doors back out of rooms are not in `room` output (harness quirk, walked with keys).
- Break room (off-duty agent, HaX in person, post-it, timeline, locker): clean. Print hook works (`nightshade_print_lifted` true after matching Nightshade in the compare step; locker opened with assisted lockpick, so locker access is exercised, not earned).
- Phone (HaX texts): no "Name:" prefixes in bubbles (s11.png). HaX hub options clear.

### Findings so far
1. **Player echo bubble on exit choices (the "You:" bubble in disguise).** Choices that exit with no NPC reply render the chosen text as a bubble spoken by `demo_player` (the player's handle) with a player sprite/name caption. Seen: Off-Duty Agent "[I'll leave you to it.]" (s06.png) and Netherton "[Understood, Director.]" after the clone. Cipher, Phantom, Nightshade and HaX exits all give an NPC line first, so this is the odd one out.
2. **Re-talk opens on a bare hub, no line, no speaker caption.** Netherton ("Agent. What do you need?" is skipped) and the Off-Duty Agent ("Still here. Still not reading this." skipped): choices appear over an empty panel (s07.png, s12.png). Likely engine reopen resuming at the hub; reads like a blank screen for a beat.
3. Reload after clone: inventory, globals and `netherton_card_cloned` persisted; opening briefing did not replay. Title screen needed bootstrap to clear.

### Mid-run (before the confrontation)
- Door-audit check (4 questions, 4 clicks, one End Conversation + re-talk): fair and clear. Step 1 needs the plan-opened time from the timeline or auth log (read both), step 2 and 3 are answerable from the printout. Re-talk re-asks "Which of the three was behind that door at 10:38?" cleanly. Arithmetic in his closing speech checks (23 min before, 18 after).
- Netherton's closing "The code card is in my safe, with Dr Okafor's evaluation. Read her evaluation before you face him." gave a clear next step. Safe (2407, earned from the ops-floor printout) holds the card and the Okafor evaluation.
- Flags 1-4 submitted at the relay (exercised, not earned: VM work impossible standalone). All HaX texts arrived in order, read cleanly, no prefixes. Flag 4: "Root. Logs agree with your door audit... You had him first." Final: "Whole chain's in. He's been walked down to the interrogation room... Finish it." Clear instruction.
- HaX hub "How do I get into the server room?" after all three interviews still says "See all three suspects, then clone the Director's card" (not state-aware, minor).
- Cipher/Nightshade exit lines are the same whatever you asked ("You'll clear me on the evidence..." / "Come back when you can prove something...").


## Confrontation timing and clicks (fate: triple agent; path below)
Path: the_case "[It's over, Nightshade. Tell me why.]" then hub topics why, Montana flight (go-bag read), recruit, PIN cracker, "Netherton told me", database, Architect, "[Enough...]", fate "[No cell. A leash...]".
- The scene **auto-advances about every 5 s per line** (4.9 to 5.6 s observed, whatever the line length), and a chosen option is echoed as a player bubble for about 1.2 s first. So at idle pace it plays itself.
- Natural pace, room entry to the end of the confrontation: about 4 min 50 s (opening and candle about 95 s, each hub topic 12 to 27 s, fate and aftermath about 45 s). Debrief with three optional questions: about 2 min.
- Counted from the ink and my polls: about 45 spoken lines, 10 choice clicks on this path. A player who clicks every line is at about 55 inputs; the review's "about 30" holds only if the click is per reply rather than per line.
- I did not capture the very first two lines (the polls lagged a screenshot while the scene auto-played); the opening lines are quoted from the ink and one stale screenshot (s15.png, "The name they stripped off that intercept in the cable vault was mine.").
- Pace verdict: tense in the opening (eight short lines, no player input) and in the candle speech; it sags in the hub because every reply holds 5 s even for six-word lines ("Yes. The attacks were the noise.") and the player's own line costs a beat each time. Keeping the PIN cracker and "Netherton told me" topics after the database topic would keep the dread; as built they sit mid-hub and let the air out. The fate choice and aftermath are well paced. About 5 minutes is fine for a finale; I would not shorten the content, I would shorten the auto-advance on short lines.
- "[It's over, Nightshade. Tell me why.]" leads cleanly into the candle: "Order is a candle in a hurricane, Agent 0x00..." (three lines), then "God help me, it felt like honesty." and the seven-option hub. One option click, no dead air. Good.
- "And 0x00. Let it hurt afterwards, not during." lands without explanation: it is followed straight away by the narration "You hold his eye a moment longer than you mean to. Then you go." and then the debrief opens on Netherton. Nothing explains it.
- The debrief's last lines (hook) were NOT read on screen: my watcher crashed at "Netherton stops at the door." and the rest auto-played while I recovered. Evidence it ran: `mission_complete` set (it is set after "Go home"), credits played, `asked_next` was never set. The inkjs run of knot `close` with `tomb_gamma_location_known` true and `asked_next` false prints: "Montana in seventy-two hours, Agent. Tomb Gamma." then "Go home, Agent 0x00. Sleep if the building will let you." So the hook plays by simulation, not by eye.

## Credits (read from #bv-cr-label while they played, some of the first lines missed)
TOMB GAMMA: Coordinates given up in the interrogation room -- Montana / CIPHER: Cleared on the evidence. His post-quantum work goes on. / PHANTOM: Cleared. His off-book hunt pointed the right way. / THE CASE: Named from the door audit, before the root logs / RECOVERED: SEALED PSYCH EVALUATION: Read. The warning was in writing a year ago. / 'DEEP STATE' RECRUITMENT BRIEF: Recovered from his locker / GO-BAG: Packed nine days ago. Never used. / THE USB STICK: His thumbprint on the casing. Nobody planted the mail. / THE SERVER ROOM: The Director's card, cloned off his lanyard while he studied the maps / GLOBAL THREAT DATABASE: Confirmed stolen during the four-site night / ON THE RECORD: AGENT 0x00 TO THE DIRECTOR: He's the crime, not you / THE ARCHITECT: At large, with every weakness SAFETYNET ever catalogued. / ENTROPY: Still operational.

## Hooks
All fired: clone (`netherton_card_cloned`, `netherton_card_taken`; cancel path gave "The cloner did not get a clean read. He has not moved." and no HaX text), emulate from Saved after a reload (door opened, `server_room_entered`, `breach_server_room` ticked), print (`nightshade_print_lifted` true on matching Nightshade; HaX "A print off the stick..."), safe 2407 (earned from the ops-floor personnel printout; card and Okafor evaluation inside, `found_nightshade_profile`), suite code 5386 (earned from Netherton and the card), `named_on_evidence`, guide offers (scanning, vuln-analysis, git-secrets, privesc, recon, CyberChef), `all_flags_submitted`, `confront_nightshade`, `decide_the_fate`, `debrief_played`, `mission_complete`, `tomb_gamma_location_known`. No hook failures found.

## Earned-secrets table
| Secret | Value | In-game source | Obtained | Earned? |
|---|---|---|---|---|
| Archives password | TrustNoOne | Break-room post-it on the coffee machine | before archives | yes |
| Badge printer PIN | 0311 | same post-it (read, not used) | n/a | not used |
| Netherton card | clone | Netherton hub after three interviews, cloner | after interviews | yes |
| Nightshade locker | (picks) | lockpick minigame, `completeLockpick` assisted | before print | no, exercised (dexterity cannot be driven) |
| Safe PIN | 2407 | Ops-floor personnel printout ("svc no. 2407") | before safe | yes |
| Suite code | 5386 | Netherton after the audit check, and the code card | before suite | yes |
| Print match | Nightshade | locker ownership (0x47), compare step | at print | yes (deduced; the compare offers Netherton or Nightshade only) |
| Flags 1 to 4 | `<flag:1..4>` | none: no VM in standalone | relay | **no, exercised**. Everything downstream of the relay (flag-text, `mole_identified`) is proven for plumbing only, not solvability |

## Session
Log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/129f788c-d240-4d67-b97d-c380ab27daf1/scratchpad/m08-dlg-playtest/session.jsonl` (2859 commands). One reload (after the clone, before the server-room reader). Screenshots in the same folder (s01 to s17). verify-run: progress recorded, 8 rooms beyond the first, 2 objects unlocked, 4 flags submitted, 59 globals.

## Remaining findings (details in the hand-back)
- Phone and in-person text: no stray "Name:" prefixes anywhere; narration is centred grey italic with no label (s05, s16, s17); no empty lines except the bare-hub on re-talk (finding 2).
- Typography: literal " -- " shows in Phantom's exit ("evidence backs me -- tell the Director"), Netherton's "regardless -- but thank you", the Tomb Gamma credit ("interrogation room -- Montana") and the broken-in notes. Pick an en or em dash, or a comma.
- Echo bubble: every chosen option is echoed as a bubble spoken by `demo_player` (the standalone player handle). Mid-hub it flashes for about 1.2 s; on exit choices with no NPC reply (Off-Duty Agent "I'll leave you to it", Netherton "Understood, Director") it is the only line and waits for a click.
