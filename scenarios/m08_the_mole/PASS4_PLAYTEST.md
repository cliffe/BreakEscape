# m08 The Mole: pass-4 design playtest script

Covers the parts the pass-4 design fixes changed (see `DESIGN_REVIEW.md`, "Changes made (pass 4 design)"). Sonnet, keyless server on :3001, per `.claude/skills/playtest-scenario/SKILL.md`:

```
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb m08_the_mole
```

Run it as two or three short sessions (10–15 minutes each), writing findings into the report as you go. `tools/playtest/verify-run.rb` must show progress at the end of each session. Keep an earned-secrets table: anything typed from this script (codes, flags) or set by console is "exercised, not earned". Codes: printer PIN 0311, safe 2407, suite 5386, archives TrustNoOne. Silent lines (TTS 503) are expected.

**Run A, the patient route (clone, print, held keycard).** Steps 1–9.
**Run B, the impatient route (badge printer) and the finale.** Steps 10–15, on a fresh game.

| # | Action | Expect | Evidence |
|---|---|---|---|
| 1 | Load; let ATHENA finish; go north and talk to Netherton. | Brief completes on his first line. He says he has run field operations for five years, and that Nightshade "taught your intake". | Screenshot of both lines. |
| 2 | Choose "[I'll need access.]" before any interview. | "Not yet. Talk to all three first…" then one line per suspect not yet seen (Cipher, Phantom, Nightshade). The option is still there afterwards. No keycard arrives. | Screenshot; inventory. |
| 3 | Interview Cipher. In his hub, pick "[Cipher. Same handle as the ENTROPY operative at the battery hall.]". Then interview Phantom and Nightshade. | Cipher: "I had it first. Eleven years first…". Phantom now has his own sprite (not the Director's). | Screenshots of Cipher's line and Phantom. |
| 4 | Back to Netherton: "[I'll need access.]". | He refuses to hand the card over, turns to the maps, lanyard in reach. "[Step up beside him and let the cloner read his card.]" appears. | Screenshot. |
| 5 | Choose the clone option. In the RFID minigame, **close it before Save**. | Back in the chat: "The cloner did not get a clean read." The clone option is still in his hub. No HaX text. | Screenshot; `window.gameState.globalVariables.netherton_card_taken` stays false. |
| 6 | Choose the clone option again and **Save** the card. | Netherton gives directions, "Whatever you are carrying, Agent, I did not see it", and the conversation closes. HaX texts about EM4100 and Nightshade's m03 line. Re-talk: neither access option shows. | Screenshots; `netherton_card_cloned` and `netherton_card_taken` true. |
| 7 | **Reload the page.** Walk east through the ops floor to the server room door. | The reader opens with the saved clone (no physical card in the inventory). `breach_server_room` ticks. HaX offers the recon guide. | Screenshot; `tools/playtest/verify-run.rb`. |
| 8 | Get Nightshade's locker open (picks, or his key after his audit or Okafor beat). Take the USB stick, then click it in the inventory. | Stick observation mentions a thumbprint and no longer names Base64/ROT13. The dusting panel opens (dark gloss surface). Lift the print and match it (the compare step narrows the candidates by pattern; it's Nightshade's). HaX: "A print off the stick…". "Use normally" reads the file. **This is a new engine path (a print on an inventory item): report exactly what happens.** | Screenshots of the panel and the alert; `nightshade_print_lifted` true. |
| 9 | Use the VM launcher once; submit flag 1. | Launcher text offers scanning and "why that flaw works" guides; flag 1's text offers the secrets-in-git-history guide; flag 2's offers none. Ask HaX for the guides list. | Screenshots of the three texts and the guides menu. |
| 10 | Fresh game. Talk to Netherton (brief only), then go straight to the break room: read the post-it, then use the reception printer with 0311 and take the badge. | Printer route works before any interview. HaX: "…Everything we tell clients not to do, in our own lobby." Netherton's hub no longer shows "[I'll need access.]"; HaX's server-room answer says you already have what the reader wants. | Screenshots. |
| 11 | Open the server room with the printed badge. Accuse Nightshade to his face before any flag. | HaX: "You told him. He knows now…" | Screenshot. |
| 12 | Read the door audit (archives, TrustNoOne), get one of the two confirmations, then start Netherton's audit check, answer step 1 correctly, and **End Conversation** at step 2. Re-talk. | The step-2 question ("Which of the three was behind that door at 10:38?") is asked again above its answers. Finish the check: he gives the suite code. | Screenshots before and after the re-talk. |
| 13 | Submit all four flags (console or solution guide; mark as exercised). | Flag 4 text: "…what your door audit said… You had him before the box did." After the fourth: "That's the whole chain…"; the task "Get the interrogation-suite code" appears already ticked. | Objectives panel screenshot. |
| 14 | Key 5386 into the suite. | Nightshade is visible at the table as the scene opens (check he isn't inside furniture). Lines: the door-log line, then "You said it to my face before you could prove it…". Ask "[Every mission, the PIN cracker stayed on your bench.]". | Screenshots of the room and the lines. |
| 15 | Choose a fate; play the debrief to the end. | Credits include "THE SERVER ROOM: A badge off SAFETYNET's own visitor printer" (and in Run A's game, if finished, the clone and USB-stick credits). The debrief's no-coordinate branch, if reached, says "a name from the vault". | Credits screenshot; `verify-run.rb`. |

Report per step: pass / fail / not reached, with the evidence. Note any layout problem with Nightshade's seat or Phantom's sprite.

## Round 2 confirmation run (short, one session)

Checks the round-2 fixes (`DESIGN_REVIEW.md`, "Round 2"). Fresh game on :3001. Read the credits from `#bv-credits-overlay` / `#bv-cr-label` **while they play** (about 3.45 s per line), and log every line.

| # | Action | Expect |
|---|---|---|
| C1 | Brief, then interview Cipher, Phantom and Nightshade without asking Netherton for access. | After the third: one HaX text, "That's all three. Now go and see the Director about the server room. Take the cloner." It doesn't repeat. Phantom wears shirt and tie; the break-room off-duty agent wears a hoodie. |
| C2 | Netherton: "[I'll need access.]", then clone and **Save**. | Refusal line about paperwork. After the save both sign-off lines show, ending "…I did not see it.", then "[Understood, Director.]" closes the chat. HaX's clone text ends "emulate it from the cloner's Saved list." |
| C3 | **Reload.** Ask HaX "How do I get into the server room?", then use the server-room reader. | HaX: "…pick his card from Saved, emulate it. EM4100 has no crypto…". At the reader: Saved → Director Netherton Keycard → Emulate opens the door. |
| C4 | Open the locker and take the USB stick. **Reload**, then click the stick in the inventory. | The dusting panel still opens after the reload. Lift the print but pick a **wrong** card: HaX's "A print off the stick…" arrives and `nightshade_print_lifted` stays false. Click again and match Nightshade: now it is true. |
| C5 | Submit flag 4 alone first (exercised), then flags 1–3. | Flag-4 text has no relay sentence; about 5 s later: "Put the rest of the box through the relay…". After the last flag: "That's the whole chain…", and no relay text. |
| C6 | HaX hub before any guide is offered, then after taking every offered guide. | "[I need a field guide.]" is absent both times. |
| C7 | Get the suite code (safe 2407 → card), enter the suite, choose triple agent, finish the debrief. | The opening narration says Nightshade **stands** at the table, which matches what's on screen. He says "And you printed the stick…" and "…the man who put me here fifteen years ago" if asked about The Architect. Credits read from the DOM include "THE USB STICK: His thumbprint on the casing…", "THE SERVER ROOM: The Director's card, cloned off his lanyard…" and "NIGHTSHADE: Left in place as a triple agent…", and no "Knocked down before he could answer" line. |

`verify-run.rb` must show progress. Record which secrets were earned and which only exercised, as before.
