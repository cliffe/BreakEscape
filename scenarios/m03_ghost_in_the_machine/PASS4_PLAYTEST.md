# m03 pass-4 playtest: the design fixes

Covers only what pass 4 changed (`DESIGN_REVIEW.md`, "Changes made (pass 4 design)"). Keyless server on :3001 (`PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m03_ghost_in_the_machine`); follow `.claude/skills/playtest-scenario/SKILL.md`. Split into two runs of about 10-15 minutes: run A is steps 1-6, run B is steps 7-10 on a fresh game, with flags submitted at the drop-site as "exercised, not earned". `tools/playtest/verify-run.rb` must show progress for each run. Silent lines on :3001 are expected.

Record for every step: pass/fail, the exact line shown, and a screenshot where marked.

## Run A: the afternoon, the turn, and a reload

1. **Briefing.** Let it play. Check: the narration has HaX in the room ("has the file open in front of her"); Netherton's first line names "Operation Cyber Arsenal"; HaX opens "{name}. Zero Day Syndicate. You heard of them?" (no "thanks for picking up"). Ask "How do I clone her keycard?": HaX says "Your moment is at the whiteboard". Pick "That's murder with an invoice". Deployment line says "Callaghan Square, Cardiff". About 3 s after the briefing closes, HaX texts "Reception first. Lean in near her lanyard…". Screenshot the phone.

2. **Receptionist and conference room.** Sign in, clone and Save her badge: HaX texts "Reception badge is in the cloner…". Open the conference door with it. Talk to Victoria, build rapport, clone her card at the whiteboard and Save. Stay in the room and talk to her again: she still talks as in the afternoon (no phone call, no night lines).

3. **The turn.** Walk into the main hallway. Check: a narrated cutscene plays once ("…walk into the afternoon with the last of the visitors", "Eleven o'clock that night, you're back…", "…a guard's footsteps go round, and round again"), then HaX texts "You're in. Server room's at the north end of the main hallway: use Sterling's card at the reader. Mind the guard in the executive wing.". Screenshot the cutscene. No "sit tight" call anywhere in HaX's thread.

4. **RELOAD.** Reload the page. Walk from reception into the main hallway again: the cutscene must **not** replay, and the HaX first text must not be resent. Check the phone thread survives or, if history is lost on reload, that HaX's hub still works.

5. **Night, before the flags.** Go to the conference room and talk to Victoria: she is on the phone with her back to the door ("No. Not tonight. I said I'd deal with it myself."), you back out, and her talk option now reads "[Look in on Sterling]". Go to reception and talk to the receptionist: "Oh! You made me jump. I only came back for my charger." / "Is Ms. Sterling expecting you this late?"

6. **Guard and office.** In the executive wing, talk to the guard: work the excuse flow until "Be honest - SAFETYNET investigation" is offered and take it. Then pick Sterling's office door when his back is turned. Open her PC (`Sterling2010`), read the unsent email, then take the drive from the desk drawer and read it. HaX's call asks what it says: pick a wrong answer first ("You're still a layer down. Run it again."), then "I haven't got it to read yet". Check the hub now offers "[About the drive from her desk. I've decoded it.]". Open the hint menu and check every topic is offered, then read one twice.

## Run B: the flags, the confrontation and the debrief (fresh game)

7. **Receptionist KO.** In a fresh game, skip the clone and knock the receptionist out. Check: **no** "badge is in the cloner" text; HaX texts "The receptionist's down. Her staff badge will be on the floor…". Take the dropped badge, open the conference door. Victoria's opener includes "Our receptionist isn't at her desk. You didn't pass her on the way in?" and "[Play the eager recruit again]" appears in her hub. Clone her card, walk into the hallway: the cutscene uses the fire-stairs line.

8. **Flags.** In the server room, submit the scan, FTP and price-list flags one at a time (console flags are fine; mark them "exercised, not earned"). Each gets a one-line HaX text ("Scan's in…", "FTP's in…", "Price list's in…"). Submit distcc last: the revelation call says "Ghost's logs named Zero Day. This is Zero Day's own ledger saying it back…"; then the all-flags text says "Sterling hasn't left: she's in the conference room, off the phone now…". Take the CyberChef laptop, decode the drive from Sterling's desk (if you have it in this run) and give HaX the right answer ("Grid storage and substations first. Then hospitals, once they're running on generator. Winter."); her hub option disappears.

9. **Confrontation.** Talk to Victoria. Her night opener has "Nor do they leave my receptionist on her own floor…". Pick arrest or escape.

10. **Debrief and credits.** Check, in order: the receptionist line ("The receptionist's fine, before you ask…"); "Now we have the seller's own books saying it back."; the Phase 2 section (if you never opened the drive: "The search team pulled it out this morning…", then the Architect section plays; if you decoded it and told HaX: "took both layers off it yourself"); "For the report, here's what let you in." followed only by the lines that match what you did; credits include "WHITEHAT RECEPTION: KNOCKED OUT AT HER OWN DESK" (read it from `#bv-credits-overlay` while it plays). Screenshot the credits line.

## Earned-secrets table

| Secret | How obtained | Earned / exercised |
|---|---|---|
| Staff badge | | |
| Executive card | | |
| `Sterling2010` | | |
| Four flags | | |
| Directive answer | | |

## Round 2 confirmation run (after the re-review and the first playtest)

One short run on a fresh game, about 10 minutes. Flags and the decode answer may be console stand-ins; mark them "exercised, not earned".

1. **Night scene, presentation and mid-scene reload.** Clone Victoria's card, walk into the main hallway. While the first narrated line is on screen, reload. Walk into the main hallway again: the scene plays again from the start (it was not finished). Let it finish this time. Check: the portrait is the player character (hooded hacker), not HaX, and there is no circuit-board frame behind it. HaX's text ("…use Sterling's card at the reader. Mind the guard in the executive wing.") appears within about a second of the scene closing. Reload once more and re-enter the hallway: no replay. Screenshot the scene.
2. **Guard warning timing.** Walk into the executive wing: HaX's "Sterling's office is keyed, not carded…" toast appears on entry, before you reach the guard.
3. **Guard keeps his word.** Talk to him and take the honest route to "Just continue your normal patrol". Pick Sterling's door in his line of sight: no catch. (A second game, or the bribe route, is optional.)
4. **Flags, distcc last.** Submit scan, FTP and price list, then distcc. Read the revelation call live and make its choices: no "That's everything off their network" line inside the call. About 2 s after "Finish up, then Sterling…", the all-flags text arrives.
5. **Debrief.** Arrest or let her go. Check: "You told Sterling's own guard who you work for. He rang her." then "That's one reason she had her coat on…"; "The guard never logged you, because you'd talked your way past him."; no Perfect Stealth credit; the distcc recap line reads "the one box they knew was broken".

Static cover for what the browser couldn't reach (CyberChef decode): a scripted inkjs run in the round-2 implementation (results in `DESIGN_REVIEW.md` §7, round 2) drove the phone ink through the right answer (sets `directive_decoded`, the hub option disappears) and the debrief through "you read what was under both layers yourself".
