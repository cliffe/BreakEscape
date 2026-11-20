# m10 Full Disclosure: phase 5 playtest, struggling player

Browser run, 2026-10-22, keyless :3001, headless Chromium (load average was about 16), Node 24 from the Playwright cache. Persona: a struggling player who misses hints, tries wrong codes, wanders and backtracks. Skill: playtest-scenario. No repo files edited except this report; nothing committed; :3000 untouched.

Commits: the two long runs (R, C) started on the tree at HEAD 3e2bad5d plus uncommitted work, then HEAD moved under me. The coordinator's mid-run message named 87dbe9db (an ancestor of what I tested next). Games N1, N2, N3, V, V2, G1, G2 were created at HEAD 48e7ba1cd (contains 87dbe9db); HEAD was 622feebf2 when I finished. Games R and C were created before that message, so they ran on the older scenario copy; the "phone starts with only HaX" and "Not yet" checks were done on fresh games on the newer commit.

Scratch, helper scripts, screenshots, credits dumps: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10_struggle/` (call it `$S`). Session logs `$S/<label>.jsonl`.

## Games and evidence

| Label | Game | What | Log | Verifier |
|---|---|---|---|---|
| R | 3600 | Rich save (imports file `$S/rich.json`: m01-m09 completed, Gary protected, Victoria escaped, Voltage escaped with Static, Nightshade triple agent, m05 pipeline list found, no recruiter deal, m09 Noor not told) played from the briefing to ARREST, credits read in full | `$S/R.jsonl` (2335 commands) | `$S/verify_R.txt`: progress recorded, 7 rooms beyond the first, 1 object unlocked, 4 flags submitted, 25 tasks |
| C | 3641 | Cold start (`--imports=none`) as the struggler to the JOIN ending, credits read | `$S/C.jsonl` | `$S/verify_C.txt`: progress recorded, 7 rooms, 2 objects, 4 flags, 20 tasks |
| N1 | 3660 | Start in security office: Ghost handset, phone contacts | `$S/N1.jsonl` | none (short check) |
| N2 | 3661 | Core head start: "Not yet" | `$S/N2.jsonl` | none |
| N3 | 3662 | Forward post: contacts at the gate | `$S/N3.jsonl` | none |
| V, V2 | 3664, 3665 | Power room, Voltage escaped, Static left: fight | `$S/V.jsonl`, `$S/V2.jsonl` | none |
| G1 | 3667 | Gallery, Victoria recruited, share traced | `$S/G1.jsonl` | none |
| G2 | 3668 | Gallery, Victoria arrested, Vos secret known, share traced | `$S/G2.jsonl` | none |

Head starts used on the short games only (`--start-room`, `--set`, `--complete-task`, `--submit-flag`). On R and C I typed the four stand-in flags (`flag{m10_...}` from the erb's dev fallback block, not VM content) into the real stations, because `--submit-flag` skips the station events that drive the breach, the split and the stair. Flags are "exercised, not earned"; no VM was touched, no VM document opened. KOs were done with `debugKO` (combat not played). Lockpicks used `completeLockpick` (assisted). All sessions stopped.

Counts: 0 blockers, 1 major, 9 minors, 5 nits.

## Earned-secrets table (R and C)

| Secret | Value | In-game source | Earned? |
|---|---|---|---|
| Flags 1 to 4 | stand-in `flag{m10_*}` | none in game (VM) | Exercised, not earned. Station hints were good: a flag at the wrong station says where it goes |
| Outer lock PIN | 6083 | PIN cracker lights, 8-9 guesses (I opened with wrong guesses 1234, 0000, 1111 first) | Earned by the cracker in both games |
| Records cupboard PIN (C, optional) | solved by cracker | cracker | Earned; contents not taken |
| Power room | spare card from the fitter's locker | locker (pick assisted) | Exercised; the route works with Imran knocked out |
| Door log and bench log | not read in R's WREN run | n/a | The WREN accusation in R went through the stonewall path |

## Check list

| # | Check | Result | Evidence |
|---|---|---|---|
| 1a | Trace Zero Day, open the outer lock, "[Go.]" to Victoria: share stays traced | PASS | R: console "Let it run. Trace who gets it." gave `share_zero_day=traced`; PIN 6083 gave `head_start_out=both`; Victoria (escaped) "[Go.]" gave `victoria_gallery=walked`, `share_zero_day=traced`. Credits: "Zero Day's share: four buyers followed." |
| 1b | Same with Vos's secret | FAIL (arguably by design, see M-1) | G2: traced share, `vos_secret_known=true`, picked "Your second buyer": `vos_secret_used=true`, `share_zero_day=stopped`, `head_start_out=none`. His pick opens the lock itself, so the secret lands before `head_start_out` is written and turns the trace into a stop. After a PIN-opened lock his menu is gone, so the secret cannot be used after four at all |
| 2 | Victoria and Vos at rest after the lock; reopen after "Give me a minute" | PASS | G1 (recruited Victoria): "Give me a minute", lock opened by PIN, reopen: "You found your own way in. I'll remember that." with only "Goodbye, Victoria." C (Vos, cold): same sequence, reopen: "My delivery came at four. Now I am waiting for a flight..." with only "Goodbye, Mr Vos." |
| 3 | Gary with Imran knocked out first | PASS with a minor (m-3) | R: Imran KO'd, then protected Gary. First talk still plays "That's Imran at the far bench... talk him round or take him in, but talk to him first." Reopen: "You put him on the floor. I'll sit with him till someone comes." No error. Power room still reached via the fitter's locker spare card |
| 4 | Escaped Voltage knocked out after he stood down | PASS | R: sums talk-down gave `voltage_outcome=talked_down`, `gallery_shutter_cut=true`; `debugKO voltage_power`: outcome stays `talked_down`, `cut_by_hand=false`, no phone call. Credits: "Voltage: Checked the sums. Stood down." |
| 5 | Voltage fight: Esc on his first reply line, both hostile | PASS | V2: "Step away from the board. Now.", Esc straight after the pick: `voltage_power` and `static_power` both `isHostile=true` (read after turning hostile), `voltage_outcome=fought`, HaX cut call opened, HP dropped to 86 |
| 6 | Tesseract: Esc during a record, reopen, pick: no error | PASS | R: Esc at the Albion record, reopen: "Where was I. Your record." then the record; picked; went on to Derek. `window.__errs` has only a room-init message (m-7) |
| 7 | Accuse an officer, Esc at "Sure?", name WREN elsewhere, reopen: no "[I'm sure.]" | PASS | R: Quintero "You're WREN" then Esc at "Sure?"; reopen showed "Sure?" (right, WREN not yet named); named Kowalczyk face to face (stonewall path, `accused=kowalczyk`); reopen Quintero: "I'm here. What is it?" with only "Keep moving." |
| 8 | Noor credit row on the m05 good path | PASS | R credits: "Noor Haddad: warned in October. Back at the archive." (`$S/R_credits.txt`) |
| 9 | Reload at Tesseract's second record | PASS with a minor (m-5) | R: reloaded at the Derek record. Spawned at the forward post (m-4), walked back, Tesseract reopened at "Where was I. Your record." replaying the Albion record once, then Derek. No error |
| 10 | Join ending's single "(Keep driving.)" beat | PASS | C: one "(Keep driving.)" menu, then Netherton's "Find 0x00..." and the visualiser. Header "MISSION FAILED // AUDIO INTEL"; credits title MISSION FAILED |
| 11 | Duty handset opens Ghost's call; each contact appears on first ring (phone starts with only HaX) | PASS | N1: fresh phone lists only Agent HaX. After ringing the duty handset the call opens, and the list then has HaX and Ghost. N3: at the gate the Arakawa call is a person-chat, not a phone contact; the list still had only HaX after the HaX breach call |
| 12 | "[Not yet. I want to finish something.]" at Tesseract exits cleanly and lets you return | PASS | N2: pick, "I'll be here.", conversation closed, player free, no error; reinteract: "All four. Good. Now it's my turn." with the same three options |

## Findings

### Major

**M-1. Using Vos's secret (or Victoria's lock-opening picks) wipes out a traced Zero Day.** Repro: G2 setup (traced share, `vos_secret_known`), talk to Vos, "Your second buyer. The one you skim from." Result `share_zero_day=stopped`, `head_start_out=none`. The player who chose "Let it run. Trace who gets it." at the release console loses the trace the moment the secret opens the lock, with no line saying so, and the credits then say Zero Day was shut out. The R7-m1 fix only protects the trace when the lock is opened another way first. Either let Vos's and Victoria's lock-opening picks keep a traced share, or have HaX or the reply say the order withdrawal killed the trace. Evidence: G2 globals read after the pick.

### Minor

**m-1. The ending warning, WREN and Ghost payoff are clear, but "Wrong, and Kowalczyk's off the raid till you can clear her. Sure?" reads as a verdict.** HaX says the same words for every officer so the check gives nothing away, but "Wrong" is stated flat, so a player who has got the right officer is told they are wrong and may back out. R (Quintero, then Kowalczyk): both show the same line. Reword to "If that's wrong...".

**m-2. After the outer lock is open, Victoria (escaped) still offers a card deal that no longer matters.** R: opener "I tell you which of these two has the code card. Or cuff me to that rail, and find the card yourself." then "[Go.]" / "[You're under arrest.]" with the lock already open. The R8-m1 lock test is not in the `escaped` and `threat` entries.

**m-3. Protected Gary's first talk ignores a knocked-out Imran.** See check 3. The pointer to Imran ("talk to him first") plays unconditionally, then the reopen line is correct. Make `consultant_imran` read `imran_outcome`.

**m-4. A reload drops the player at the forward post.** R, check 9: after a reload at the core the spawn is (160,144) in the forward post, the Mission Brief note reopens, the objective list shows only "Hear him out", and nothing points back down. Seven `enter` calls get the player back, no scene replays, doors stay open. Same as the earlier full-route finding m-1. The coordinator's note says resume points at the core landed in 87dbe9db; R ran on the older copy, so this needs a re-test on a game made at current HEAD.

**m-5. Reloading in the record sequence replays the first record.** R: reload at Derek (second record), reopen: Albion again, then Derek. The tess_* ink variables are not in the saved globals (`tess_rec_albion` read nil after sync). Harmless but repeats two lines.

**m-6. 06:00 hub: choosing Kowalczyk ends the hub and skips Gary.** R: hub offered Quintero, Kowalczyk, Voltage, Gary, "That's everyone"; after Voltage, Quintero and Kowalczyk the scene moved to Netherton without offering Gary. The credits then say Gary "Came down after the breach in a new lanyard" with no scene for it.

**m-7. Console error "Room core failed to fully initialize after 1000ms / Room state: undefined"** in `window.__errs` on R after entering the core (also logged on an earlier full run). The room worked.

**m-8. Phone timestamps still show the real clock.** HaX thread shows 6:28, 6:34, 7:01 in a 01:45 to 02:30 raid (earlier finding m-2, unchanged).

**m-9. HaX at the core does not acknowledge a trace.** R: after tracing, arrival says "Confirmed. Both shares went at the lock." The payoff lands at 06:00 (Netherton: "We followed Zero Day's share. Four buyers, and one of them was careless.") and in the credits, which is fine, but nothing at the core tells the player it worked.

### Nits

- **n-1.** Two success toasts per lock pick ("Lockpicking" and "Lock Picked"), and the "Note Added" and "Task Complete" toasts at the table scene arrived twice in R.
- **n-2.** "Kowalczyk ... Badge returned." in R's credits reads as given back; "handed in" would be clearer.
- **n-3.** Credits on R say both "Zero Day: still trading." and "One cell broken: Zero Day's buyers." Technically consistent, reads oddly.
- **n-4.** The outer-lock doorway: after a reload the door is a shut (unlocked) sprite and `enter` crosses it; before a reload the opened door needed the player's feet at about y=343 to pass, and `enter` failed with `did-not-cross` until I walked it by hand.
- **n-5.** Choosing "Move." to the hall guard makes him hostile (he took 77 HP in about 15 s while the harness did not fight back). Expected from the ink, not a bug; a struggler who cannot fight is badly hurt.

## As a player

**Was it fun and clear?** Mostly, in the first half. The out-of-order cases I tried were handled: flag 1 typed at the terminal before the table or the console still cascaded (split, Arakawa's call, blast door opened); the door's "Access denied" gave no pointer, but the objective list ("Finish the business at the table") and HaX's thread did ("Not the terminal yet. The field console beside it."). The tripwire, with the ladder, is well signposted ("Up and round"). Wrong codes were cheap because the cracker lights make the PIN a deduction rather than a guess. The hatch hint when a flag goes into the wrong station is a good touch. The clunky spot for a struggler is the first act-two stretch with no pointer after a reload (m-4) and Wendell: "Never mind. Carry on, Mr Briggs." quietly forces the hand-cut, which HaX narrates well ("It's falling to us, then").

**Did the finale make earlier choices matter?** Yes, in R. Kowalczyk's "You took my side in Helena, in front of Quintero" (my m09 answer), Albion's notice ("I sent your notice from Helena"), Ghost's text ("You watched who bought it"), the trace paid off by Netherton at 06:00, Noor in the credits, Gary and Voltage rows, the backdoor I left open reappearing as "Seattle's first batch went out through the backdoor". On the cold start much less carries, as expected, but the cold run still reacted to my small picks ("You walked past his sheet. It's worth the minute.", Wendell's "Never told. Dale walked into the raid", Imran "Knocked out at his bench").

**Was the ending satisfying?** Arrest: yes. Tesseract holding out his wrists, HaX's "I said no. It took me till morning." and the credits fit. Join: effective and nasty ("CORRECTED: 2,100 TO 3,600", "Walked out with 0x00", HaX's unanswered message), with exactly one "(Keep driving.)" beat. The game's warning at the point of no return ("If you take it, the mission ends here, and you work for ENTROPY.", then "asks once") is clear. "Not yet" is a good out for a lost player, and it worked.

**What I learned:** the finale's reactivity is in the credits and the 06:00 lines, so a struggler who skips optional rooms still gets accurate rows, but a pre-lock pick can silently undo an earlier decision (M-1).

**Best lines:** "Cuffed in front. Somebody thinks I'll need my hands tonight." (Voltage); "I'd rather it was you." (Tesseract, arrival); "That's worse. That means I was good." (Kowalczyk); "Nobody asked who for." (Netherton, the county road); "It's afterwards." (HaX).
**Worst lines:** the "Wrong, and ... Sure?" check (m-1); Victoria's moot card deal (m-2); Gary's "talk to him first" over a body (m-3); the phone clock (m-8); "There's a third way." answered by "There is. Wipe both copies." (reads as the writer's third way, not the player's).

Scores (1-5): fun 4, pacing 4 (the server hall to core run is quick; the reload walk-back drags), clarity of goals 4, openness of decisions 4, teaching 4.
