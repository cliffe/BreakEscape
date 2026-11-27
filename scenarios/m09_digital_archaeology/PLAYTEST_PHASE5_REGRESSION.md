# m09 Digital Archaeology: phase 5 regression playtest (round 2), the careful returning player

Plumbing, regression and "do the choices land" run (questions 1 and 3). Keyless :3001, headless (load 9 to 20 during the run, so timings are loose except the ring check, which was repeated clean). Persona: knows the season, plays slowly, reads every document, tries every dialogue option.

Scratch, logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09-regress/`
(`run1-session.jsonl`, `run2-session.jsonl`, `run4-ring-session.jsonl`, import files `imp_rich.json` and `imp_mixed.json`, shots `deck_pre.png`, `deck2b.png`, `s1.png`).

## What was run, and on which commit

HEAD at the start: `f5be6c5b4`. The tree moved under the run (other builders committed), and I cannot pin a checkout (no stash/checkout/reset). HEAD at each game's creation:

| Run | Game | What | HEAD at creation |
|---|---|---|---|
| 1 | 3670 | rich m01-m08 save, triple-agent branch (m08 `nightshade_triple_agent`), staff-card route, hatch, letters bin, talked Sorensen down, Alpha tapes, notice sent, full debrief and credits | `f5be6c5b4` |
| 2 | 3716 | mixed save (m01 recruit, m05 warned late, m08 tidied, m03 Victoria recruited), shutter and stacks first, Victoria's door route, Derek's file, did not talk Sorensen down, her file pulled, notice held, no lease, full debrief and credits | `0d57ed76b` |
| 3 | 3736 | head-start ring check, abandoned (the `--start-room reading_room` spawn puts the player outside the room, harness artefact) | `588b5ae52` |
| 4 | 3738 | clean timing check for the Recruiter's ring (flag 1 head-started, `cage_opened` set, flag 2 played in) | `5a5a87329` |

Run 1 is on the old build: its drop-terminal screen has no "Staff sign in as…" line and the reading room has no login slip, so the F12 VM-gating edits (login slip, enrolment binder) were not in it. Run 2 includes them. I did not re-play run 1 on the later commits. Between 0d57ed76b and 5a5a87329 I did not diff m09 files.

Saves. Rich: `imp_rich.json` (m05 `found_pipeline_list` true, `torres_turned` true, `victoria_fate` recruited, m08 triple agent, all eight completed). Mixed: m01 recruit, m03 victoria recruited, m05 `found_pipeline_list` false and not accepted, m08 `nightshade_tidied` true, all eight completed. I read "warned late" as `found_pipeline_list` false (that is what Noor's ERB arms test).

Earned versus handed over:
- Flags: the four VM flags were typed from the `--flags` stand-ins at the stations ("exercised, not earned").
- Safe PIN 060216 and H&L file number HL2015-0477: earned in game (rent ledger header; HaX's WREN call).
- Salvage code LEWISANDCLARK: typed from the walkthrough, not decoded in CyberChef (exercised, not earned). BONEYARD was tried first at the pad (rejected, as intended).
- Stamp dusting: strokes and lift driven by the harness; the whorl was read from `debug.pattern` (assisted).
- Lockpicks: `completeLockpick` (PASS assisted).

Harness notes, none are game findings: a stray background `look.sh` closed the dusting minigame once (redone); `enter` on the dock when standing between the front-desk door and the stacks door opens the front-desk lockpick instead (step away and retry); `lock` types the code up to three times.

## Check list

| # | Check | Result | Evidence |
|---|---|---|---|
| 1 | Reel deck before the identity scene shows no Tesseract portrait or name | PASS | Run 2: Narrator line "Empty spools. Degaussed." sits over the empty tape-room background, no portrait, no name (`deck2b.png`). Run 1: same knot, Narrator then HaX. |
| 2 | HaX's "I know whose voice that is. After." shows HaX | PASS | Run 1, `deck_pre.png`: the hooded HaX sprite, label "Agent HaX". |
| 3 | HaX's Noor-bonus warning plays before the tell button | PASS | Run 2 (m05 not warned): Noor "Gave me a five-hundred-dollar filing bonus my first week." then HaX "Tell her what that bonus was and she goes home tonight. Anything you need from her, get it first." then the choices, with "That bonus wasn't for filing." third. Run 1 (warned in time): no bonus option, no HaX warning, she hands over the card at once. |
| 4 | Bring-in heads-up does not nag about a notice already sent | PASS | Run 1: hub "His notice" then "Send it." then "Bring me in." in the same call: only "That's Helena done. Once you're on the plane, the archive's closed to us." and no notice line (Tran line shown while Tran was still at his tapes, gone after I talked him out). Run 2 (notice unsent): the three heads-ups appear (lease, Tran, "The notice is still on his box. Netherton will ask."). |
| 5 | Turned-Torres briefing card | PASS | Run 1 briefing: "Quantum Dynamics. David Torres works for us now, from inside the Recruiter's network." Run 2 default: "stole for the Recruiter to pay for his wife's treatment. Arrested." |
| 6 | Cage Sorensen's "[It's over. Step away from the feed.]" asks once | PASS | Both runs. After one ask the reply is "When I've finished, dear. You'll want the list to be complete." and the option is gone, also on re-interacting ("Another box."). |
| 7 | Sorensen's conversation opens by itself when Nightshade's file is taken, after the plan cabinet closes | PASS | Both runs. Take file, close viewer (back to container), close container, and 1 to 4 s later person-chat opens: "Her eyes go to the file in your hand, and back to the feed." Choices "Your Architect kept his own papers off your list. Only yours burn." and "I'm done here." In run 2 I took "I'm done here" first, re-interacted and the same scene reopened with both options, so the talk-down is not lost. |
| 8 | Victoria's text on first entry to the restricted stacks | PASS (with a small catch, m-1) | Both runs. HaX thread: "First time we've used Victoria. Her people read this building's mail. Ask me about that gate." arrives about 3 s after entry. Hub row "Can Victoria's people get me through that gate?" then gives the maintenance-code line and the cage opens (run 2, `cage_opened` and `maintenance_code_used` true). |
| 9 | "[Bring me in.]" confirm and "Not yet" | PASS | Run 1: confirm shows, "Not yet. I want to finish something." gives "Go on. I'll be here." and the hub keeps "Bring me in." Second time through, the debrief opens. |
| 10 | Recruiter's ring timing, stacks-first route | PASS | Run 4: `enter open_stacks` returned at +1.4 s, the phone-chat was first seen at +17.3 s (polls every 0.8 s), so about 15 s after entry. Run 2: the ring was held while the H&L container was open and came about 1 s after I closed it (also right: the engine defers a forced call behind a minigame). |
| 11 | Coin-toss line when the H&L sheet is read | PASS | Run 2: sheet read at +11 s after entering the open stacks, call "Go on." gave HaX "We're down to two off that firm's sheet. She's selling you a coin toss." Run 1 (sheet read after the call): line correctly absent. |
| 12 | Netherton's Sun River line matches what I found | PASS | Run 1 (lease read in the office): "Mrs Sorensen's own file gave us the address." Run 2 (lease skipped, `m08_tomb_gamma_location_known` false): "Analysis found the lease an hour ago. It was in Mrs Sorensen's office all night." The middle arm (coordinate known, lease not found) was not played. |

Extra confirmations met on the way: round 1 m-4 (the Tomb Beta station lists only its own flags in run 2), "Owner first" when flag 4 goes before flag 3 (run 2), the hand-match nudges ("Read the notebook scan first", "Look at the loop on the g. Then look again."), Gary's call only on the protected save and HaX's cipher text instead on the mixed save, F12's login slip and enrolment binder both readable.

## Findings

### Blocker
None.

### Major
None.

### Minor

**m-1. Victoria's topic is hidden behind two unrelated choices after the flag-1 call.** Repro (rich or mixed save, Victoria recruited): submit flag 1, the HaX (or Nightshade) call ends with open choices ("Ledger or stacks first?" / "She's shredding Series R?" in run 2). Enter the restricted stacks; HaX's text says "Ask me about that gate." Open the phone and HaX: the menu is still those two choices, even after closing and reopening the phone. Only after answering one and "Got it." does a fresh open show the full hub with "Can Victoria's people get me through that gate?". A player who goes straight for the gate sees the text but not the button. Run 1 had the same shape (two choices from the call, then 7 rows).

**m-2. Victoria's route has no payoff past the gate.** Run 2 (victoria recruited, gate opened by her people): neither the debrief, the credits nor HaX afterwards mention her. The credits list HaX, Netherton, Kowalczyk, Sorensen, Noor, Old Coyote, Tran and the Recruiter. The m03 choice buys a shortcut and one HaX line. Not wrong, thin for "do earlier choices land".

### Nit

- Run 2 briefing, `m08_nightshade_tidied` only: the card says "He's in custody." (default arm), while Netherton's opening says "Nightshade cleared his locker before we reached it." If tidied should mean "got away", the card needs an arm. I do not know what m08 means by tidied, so this may be fine.
- Torres's call (rich save) ends on a lone reply button "Hello?" after "Safe enough. Please be quick." Reads as a dropped line, probably the intent, but the button looks like a placeholder.
- The identity-scene HaX line "Two cards on that wall. I had his name the night they died." is the same on both saves; fine for the rich save, a little abrupt on the mixed save where the m07 teacher thread was never played.
- Run 1 debrief never mentions Nightshade (triple-agent save, file sent); only the credits do ("Sent his own file. He knows what his teacher wrote."). It lands in the credits, so I count it as fine.
- The `Annotation Sheets, Series ALPHA` read as "Blank label stock" before the identity scene on the Alpha-tapes route (by design, per the ERB comment); worth a second look only if a player is expected to check them early.

## What landed

Run 1 (rich, triple agent, letters, talked down, Alpha tapes, notice sent). The briefing wall was built from the save (Torres working for us, Voltage in custody, fund frozen). Nightshade's call at flag 1 in his own voice, then "Send Nightshade his file" in the hub, then the credits line. Noor handed her card over because of October. The Recruiter's offer opened on "Last time I said the next one would cost me more." and I refused, then picked the Alpha tapes. Torres rang as a live placement and told me to read next-of-kin on the H&L sheet. Credits: "Saved from the bins: the Social Fabric letters. Teresa Villanueva was warned.", "Margaret Sorensen: Wrote down every box she destroyed.", "His vendor notice: sent tonight.", the Sun River order. Everything I did showed up somewhere.

Run 2 (mixed). The pretext and Noor choices cost something: I never told Noor, and the debrief says she went home and rang her father and does not know she is on a list. I let Sorensen burn the other bin and the credits say "Fed the shredder all night". I took the Recruiter's name (Kowalczyk, after the coin-toss warning), and Netherton's first line in the hangar is that Kowalczyk took a call on the apron and her phone was in a bin; the credits and the Montana line ("Her crate is still on the ramp") carry it. The held notice was put to me at the debrief as a real choice ("You read it. You decide. I will sign whichever."), and the credits say it stayed on his box. That is the strongest stretch of the mission.

## Narrative

**Briefing.** Still the best opening in the campaign. On the rich save it knows what I did; on the mixed one it is plainer but never wrong. I asked every question and nothing repeated. The team-choice buttons are clear and the reaction lines are short.

**Dock and front desk.** The call's two routes read clearly and the door pick is the old, gentle puzzle. Noor on the warned route is the right quiet scene. On the not-warned route HaX's warning arriving before the bonus option fixes the round 1 complaint: I knew what the button did before I could press it, and I chose to clone the card and leave her alone, which felt like a decision rather than a trap.

**Reading room and stacks.** Clear. The case file, notebook scan and drop-terminal screen all feed later lines. The F12 login slip is a good small find, though it gates nothing visible (flag 1 was accepted without reading it, which I would expect with a black-box VM). The hatch scene (run 1) and Victoria's door scene (run 2) are different enough that I would play both. The flipper and the stamp lift are fun; the dictionary miss is now shown.

**Cage.** The auto-opening conversation after the cabinet closes is exactly right: the file in my hand changes the room, and I did not have to hunt for the moment. Being able to walk away ("I'm done here") and still come back to talk her down is generous. Asking "It's over" once and not again fixes the loop.

**Ledger, Recruiter, office, tape store.** The ring after about 15 s in the open stacks feels natural: I was walking, not reading. The call held behind an open container and playing a second later is fine. The offer and HaX's two lines are clear about what each option costs. The rent ledger gives the PIN without a hint, which is how it should be. The Reading's last page ("They will save Lawson's file") is a good punch on the letters route because I had not.

**Late flags, identity scene, Tesseract.** The reel deck now behaves: room, then HaX. Flag 4 before flag 3 gets "Owner first." The identity scene differs by save and both versions work. The hour-read funnel is long and linear (each question replaces the last), with no way to ask everything.

**Debrief and credits.** Read in full on both runs; both are accurate to my choices. The notice question at the debrief is strong when unsent. Credits are the right length.

**Was it fun, did it teach?** Yes to both. The RFID, the lifted print, the file-number, the shelf-mark cipher and the rent-ledger PIN each teach a technique and each hands the answer back in a way I could check. The weaker teaching moments are the hub topics hidden by call choices (m-1).

## Not covered

Middle Sun River arm, the dock call "Old Coyote truth" button, Dillard (`m01_maya_ko`), the KO routes, Noor's tell path (checked only as a button), any reload mid-scene, and a CyberChef decode.
