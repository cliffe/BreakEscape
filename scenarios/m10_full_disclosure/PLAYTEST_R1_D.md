# m10 Full Disclosure: playtest R1, part D (Lethal, Executed, Scorched, Join)

Browser playtest, 2026-10-21, keyless :3001, headless Chromium, Node 24 (borrowed from the cursor-agent install, since the system Node is 18). Regression run, head-started at the core (flags 1-4 set, outer lock open). Machine load was 15-46 throughout (other playtests running), so timings are not representative. No game files edited, nothing committed.

Scratch, transcripts and session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10d/` (`g3.jsonl`/`g6.jsonl` etc. are session logs; `lethal_*.txt`, `g4*.txt`, `g5*.txt`, `g6*.txt`, `g7.txt`, `g8.txt` are dialogue transcripts; `*_credits.txt` the credits lines).

Games: Lethal 2994, Executed 3002, Scorched 3006, Join 3022; after-ending checks 3035 (Lethal) and 3038 (Join). Game 2993 was a discarded Lethal run (see tooling note T-2). `verify-run.rb` on 3022: "progress recorded: 1 room beyond the first, 3 flags submitted" (flag 2 is missing, see T-1; the other eight tasks completed).

## Verdict

All four endings reach their closing scene, card and credits. Counts: 0 blockers, 1 major, 7 minors, 3 tooling notes. The one major is the visualiser header on Join.

Earned-secrets table: not applicable. This run decided endings only; every flag and the outer lock were supplied by the head start (exercised, not earned). Everything upstream of the core is unproven by this run.

## Results by ending

| Ending | Route taken | Warned / confirmed | Last scene line before the card | Card lines fit | Credits once | After ending |
|---|---|---|---|---|---|---|
| Lethal | stop console, disclose, "[You're under arrest.]" then "[Fire.]" (his hand goes to the key first, so it is justified) | Fire has "[Hold fire.]" beside it | HaX: "There'll be a board. I'll be sitting next to you." | yes: "dead at his console, reaching for the key" | yes (one MISSION COMPLETE) | Netherton "Go and get warm. The paperwork can wait an hour."; HaX "It's done. Sit down a minute."; Arakawa "I'll open the road at seven." All closing-register |
| Executed | same, then "[Shoot him where he sits.]" | Yes. Narrator: "His hands are empty and in plain sight... it's an execution, and HaX is on the line." Menu "[Do it.]" / "[Lower the weapon.]" | Netherton: "Take 0x00 to the second van. Nobody discusses tonight with them until the board sits." | yes: "shot unarmed", "AGENT 0x00: IN CUSTODY" | yes | not run |
| Scorched | database "[Wipe both. Theirs and ours.]" | HaX warns first ("this room purges itself... you won't have him after"); the pick itself has no second prompt | HaX: "They'll ask me if I'd have stopped you. I'll tell them I wasn't asked." | yes ("gone, with everything he remembers", "gone, both copies"); hearing scene played, "AGENT 0x00: SUSPENDED" | yes | not run |
| Join | console "[Show me how it works.]" then three picks | Yes: three deliberate picks, each warned, each with a way back (see below) | Netherton: "Find 0x00. Bring them in, and bring them to me." | yes: "free", "everywhere", "Every cell has it"; title "MISSION FAILED" | yes (one MISSION FAILED) | Netherton, HaX and Arakawa give only narrator lines ("doesn't look at you", "doesn't look up"). Nothing from SAFETYNET people. |

Join's three picks:
1. "[Show me how it works.]" then narrator: "Pressing it publishes the database to everyone... Eleven hundred to twenty-six hundred people... You can still step back." Options: Give me the key / Step back / Stop it.
2. "[Give me the key.]" then HaX "0x00. Don't." and narrator "If you take it, the mission ends here, and you work for ENTROPY." Options: Put your hand on the key / Step away / Stop it.
3. "[Put your hand on the key.]" then "The key console asks once. Publish the database to everyone, now?" Options: Yes. Publish it. / No.

I did not click any of the back options (took the forward pick each time), so the ways back are present but untested.

Join header text: the visualiser's top bar reads "MISSION COMPLETE // AUDIO INTEL", right panel "OPERTN: FULL DISCLOSURE / STATUS: (blank) / THREAT: CRITICAL". Ticker "TOMB GAMMA: BREACHED · THE ARCHITECT: DR ADRIAN TESSERACT · THE GLOBAL..." (cut off). No "WELL PLAYED" or "ENTROPY CONTAINED" seen. The credit title itself is "MISSION FAILED". The other endings show the same bar with STATUS "MONITORING", THREAT "LOW".

HaX's Join credit: "AGENT HAX: Handler. Her last message to 0x00 went unanswered." Present as specified (SAFETYNET section). Her IN THIS OPERATION line is "Sent one word. Nobody answered."

Credits timing: card, then about 25-35 labels at roughly 3.5 s each, 2 to 2.5 minutes. The close button was back after the last label (Lethal checked).

Console errors: `console.error` and `window.error` hooks recorded nothing in any of the four ending runs (the forward-post checks had no hook). No overlaps seen in the screenshots taken (Netherton in the core, Citadel, Lethal credits end state, Join credits).

## Findings

### Blockers
None.

### Major

**M-1. Join: the visualiser header says MISSION COMPLETE.** Credit title "MISSION FAILED", but the fixed header bar reads "MISSION COMPLETE // AUDIO INTEL", with a blank STATUS and THREAT: CRITICAL. This is the R1 m-5 suspicion, confirmed: the theme does not override the header. The player reads two opposite verdicts on one screen. Fix in `bond-visualiser.js` (header text, `MISSION COMPLETE` near lines 140 and 244 per the R1 note) by taking a title from the credits entry, or from the scenario for the end playlist.

### Minor

**m-1. Hearing and Citadel: the scene-setting Narrator line was never visible to me.** Ink opens the hearing with "A hearing room at the Citadel, two days later..." and the Citadel with "The Citadel, an hour later. Netherton is on the wall screen from Montana. Beside him, HaX's channel is still open." In both runs the first line my reads saw was the next speaker's ("He still knows. But the map's gone." / "He told her it had to be one of ours..."). Six o'clock's opening Narrator line did show. Unverified whether it flashes past or is dropped; it should be checked by eye. As seen, the Citadel is a plain office background (hq1) with Netherton standing at the right and no wall screen, so "Netherton on the wall screen" is not shown unless that line appears.

**m-2. Second-speaker attribution depends on the speaker's NPC being loaded.** In the core, Netherton's lines in the database scene showed as "Dr Adrian Tesseract" with Tesseract's portrait and the text "Director Magnus Netherton: Half of these cannot be patched..." (screenshot `g1_neth.png`). In the closing scene, Imran's and Wendell's lines showed as "Director Magnus Netherton" with the text "Imran Siddiqui: Nobody asked me anything all night." Once I carried the closing NPCs into the core, Netherton resolved correctly. Imran, Wendell and Netherton live in rooms my head-start skipped, so this may be a head-start artefact. In a full run those rooms are loaded earlier, so it probably resolves; worth one full-route check.

**m-3. Credits contradict themselves when WREN is unsolved.** IN THIS OPERATION: "HALINA KOWALCZYK: Came through the service door for the key. Stopped. Never named." SAFETYNET section: "HALINA KOWALCZYK, 'WREN': Breaching lead... Stopped at the core with her hand out for his key." "Never named" then a named designation in quotation marks, and the same event told twice. Seen on Lethal, Executed and Scorched.

**m-4. Card line "Jennifer Walsh's people broken. That was all."** It sits between the database line and the Billings line on Lethal, Executed and Scorched cards. "That was all" reads like the end of a list that is not there. In the credits the same cell is "Jennifer Walsh's cell: stopped at Austin." Reword or check the arm that produces it.

**m-5. Credits: Quintero's line differs between sections.** "Took a shoulder wound at the core. Talking by six." then "Back on light duties in six weeks." Not untrue, just two different timelines in one roll.

**m-6. Stage directions show as literal asterisks in the dialogue text.** "[Agent HaX] Kowalczyk. *quietly* I sent her mum flowers." and "[Dr Adrian Tesseract] *quietly* Thank you, Agent." The text came from the dialogue state; I did not check whether the on-screen renderer strips them. Likely a TTS cue, so check the display.

**m-7. Empty first line on Join's HaX post.** After the ending on Join, talking to `hax_post` returned one blank-speaker, blank-text dialogue state ("[None]") before "She doesn't look up." Possibly a flash of an empty bubble.

### Could not confirm (head-start caveat)
The "IN THIS OPERATION" lines for Nightshade ("Said 'Door.' from the van"), Ghost ("Sold the head start. Clean exit, no trace."), Imran, Wendell, Asante, Fonoti, and "Zero Day: still trading. Its broker, Pieter Vos, named" are default arms in my runs, because I skipped the mission up to the core (no door scene, no Ghost call, no cut, no outer lock, no Vos). They appeared in all four runs unchanged, including Join. I can't say they are untrue, only that the run did not earn the state they describe. Run a full-route ending before signing them off.

## Tooling notes (not game defects)

- **T-1. `--submit-flag` head start is incomplete.** It does not set `flag1..4_submitted` (they stayed false, so Tesseract said "Finish on my box first"); I used `--set flagN_submitted=true` instead. The id given for flag 2 (`release_console:bunker_monitor-flag1`) did not register: `verify-run.rb` lists three flags (monitoring foothold, container escape, core host) and the flag 2 task stayed open, so the server refused the conclusion (client toast "Not finished yet", no card or credits) on game 2993. Adding `--complete-task submit_flag_1..4` fixed it.
- **T-2. The closing NPCs (`six_oclock`, `hearing`, `citadel`) live in the forward post.** Starting in the core without `--carry-npc six_oclock --carry-npc hearing --carry-npc citadel` means the closing scene never opens (game 2981, 2993). Also set `head_start_out=none`, or the card says "The cells kept what they took at four" while Netherton says nothing went at four (seen on Scorched with the unset value).
- **T-3. Title-screen and tutorial prompt.** The title closes on a synthetic Space keydown on `document`; the "Welcome to Hacktivity Games" modal's second button is `#tutorial-no`. `pressKey` and `mg clickText` do not reach the title.

## Not run
Join's three back options; the Executed and Scorched after-ending lines (only Lethal checked, and Join); the out-of-order and softlock cases; a full-route run with real state.
