# m06 Follow the Money: engine regression run, 2026-10-16

Question answered: **plumbing** (does the mission still work against this round's engine changes), plus a short off-path section (wrong slots on the console, a knockout and Restart, a reload). Not a solvability pass: standalone has no VMs.

- Game: **2591** (mission id 50), keyless server on :3001, headless, `--speed fast`. Only one game was created. Session stopped.
- Source for the route: `TESTING_WALKTHROUGH.md` (regression run, answers known, each secret fetched in-game before use).
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m06-regress-2026-10-16/session-2591.jsonl` (1836 commands).
- Screenshots and helper scripts: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m06-regress-2026-10-16/` (`01_lobby.png` to `34_credits.png`).
- Credits reached: **yes**. Game status `completed` at 19:50:57 UTC, 29 minutes of wall clock. The credits labels were read from `#bv-cr-label` with a MutationObserver (see "Credits" below).
- Page reloads: one, after meeting Irina and the data-centre work (Irina then opened "Back again."; all doors stayed open; inventory and tasks held; the Mission Brief note reopened on the title screen continue). One more reload happens on Restart after the knockout.
- Knockout and Restart: yes, by Kemal Aydin.

## Counts

0 blockers, 1 major, 6 minors. 19 checks passed (table below), 7 groups not exercised (listed below).

## Severity table

| #  | Severity | Finding | Repro |
| -- | -------- | ------- | ----- |
| R1 | major | After a knockout and Restart, `minder_hostile` stays true (`minder_fighting` and the NPC's hostile state are cleared). If the player then gets past Kemal peacefully, three places still describe a fight that never resolved: Satoshi opens "Somebody here rang the FCA tonight. You're not on their books." then "Kemal's still out there looking for you. Let's be quick." (Kemal had said "The door is open. I am going home. Do not look for me tonight."); the debrief says "His minder came at you and you went round him. He's in custody now, and furious."; the credits say "KEMAL AYDIN (MINDER): Went for you; you got past him anyway". Edge path, but a real player can take it. Whether `minder_hostile` is meant to survive Restart (as a "he did go for you" record) is the user's call; the walkthrough says it is a permanent credit latch, while the 7691fff1 commit note says stale hostility latches are cleared on Restart for m06. | Game 2591. Enter the executive wing, "Then step aside, or I'll move you." (hostile), take 3 HP hits until KNOCKED OUT, Restart. Walk back to the wing; Kemal patrols calm. Pick the CEO door in his sight ("A hand the size of a shovel closes over yours before the second pin sets."), choose "(Show him the casualty line on the fund.)": he leaves. Satoshi's opener, debrief and credits then carry the hostile wording. Globals after Restart: `minder_hostile` true, `minder_fighting` false. |
| R2 | minor | Satoshi's conversation bust is a faceless dark-hooded figure (blue hoodie, void where the face should be), while the narration reads "A man in his early forties leans against the front of an executive desk." Not known whether this predates this round. | `32_satoshi_chat.png`. Open Satoshi's conversation. |
| R3 | minor | The phone choice rows carry no number labels, so the new 1-9 keys cannot be discovered from the screen (person-chat shows "1." to "3."). Keys 1 and 6 both worked; the "more choices" cue shows. | `13_phone_choices.png`. Open HaX's hub (six choices), press 1, then 6. |
| R4 | minor | After fleeing Kemal I stood in the doorway gap of the data centre and `enter executive_wing` failed three times with `did-not-cross` (feet stuck at 316,-823). Walking away to (241,-762) and retrying crossed first time. Could be knockback leaving the feet in the frame, or the harness; not diagnosed. | Game 2591, log near the Kemal fight. `trace[].feetAfter` stayed 316,-823. |
| R5 | minor | The checkpoint guard's green vision cone is drawn across the adjacent trading floor (through the wall) while the player is in the trading floor. | `03_chair_push.png`, `04_chair2.png`. Stand in the trading floor with the guard patrolling. |
| R6 | minor | A hostile Kemal keeps his vision cone drawn while chasing. The new rule covers hidden and knocked-out NPCs only, so this may be intended. | `24_past_talking.png`, `27_fight2.png`. |
| R7 | minor | Conversation background art details: Priya's wall plaque reads as garbled glyphs, and Kemal's bust is framed tight (hair touches the top edge). Cosmetic. | `10_priya.png`, `23_kemal_chat1.png`. |

Not findings, but worth knowing for the next tester: the harness `lock` command returns `ok:false` on the custody console and the executive safe although the container opens (its `finalState` shows the container); the objectives panel covers the left of each room (already in `IDEAS_BACKLOG.md`); at 1400x1000 the credits visualiser's right-hand panel is cut off (not checked against an earlier run).

## What passed

| Check | Result |
| ----- | ------ |
| Opening briefing, `receive_briefing` | Passed; HaX caption wraps in a narrow column (`01_lobby.png`). |
| Checkpoint guard talk route ("Financial Conduct Authority…", "Dr Volkova. The CTO.") | Passed; credits "CHECKPOINT GUARD: Waved you through on the FCA cover". |
| Trading-floor chairs roll and collide | Passed. Pushing chair 31 sideways moved it from x=216 to x=159 and chair 30 from 184 to 135 (chain push); chairs show different rotation frames (`04_chair2.png`). Pushing straight into the desk edge moved a chair about 3 px and stopped. |
| Password keypad near miss | Passed: typing `Bitcoin2025` gave "Incorrect password. Passwords are case-sensitive. 2 attempts remaining." `bitcoin2025` opened the door. |
| PIN keypad titles name the lock | Passed: "Enter PIN: Data Centre", "Enter PIN: Custody Console", "Enter PIN: Executive Safe". |
| Rack LEDs | Passed. Two screenshots 0.6 s apart differ in the rack LED rows in both the server room and the data centre (pixel diff, `07_server_*.png`, `15_dc_*.png`). |
| Custody console one try per opening and lockout | Passed. Wrong slot 3815: pad closed, `minigame_failed` carried `maxAttemptsReached:true, attempts:1`, `console_warned` set, cover not strained. Wrong slot 6120 on a fresh opening: `cover_strained` and `console_tripped` set. 4471 opened the fund file. Credits "FOUND BY ELIMINATION ON THE CONSOLE", debrief "It logged every slot you tried". |
| RFID reader with an empty cloner | Passed: "Access Denied. Access denied. No keycard, and nothing saved on the cloner." No minigame opened. With the executive badge from Irina the door opened. |
| Phone number keys and "more choices" cue | Passed (keys 1 and 6; cue "more choices" under the third visible row). |
| Hostile attacks pause while the phone is open | Passed. With Kemal adjacent and HP at 10, HP stayed 10 across 8 s with the phone open and the phone stayed open; after closing it HP fell 10, 7, 4 at about 1.5 s steps. |
| Hostile damage as configured | Passed. Measured from the player's HP only until Kemal had turned hostile: drops of 3 per hit, matching `behavior.hostile.attackDamage: 3`. (State was read only after he turned hostile.) |
| Chase leash | Passed. Kemal chased me to his room's door, hit me, then went back and stood at x about 426 in his own room while I stood in the data centre (`25_fight.png`); he never entered the data centre in six polls. |
| Restart after knockout | Passed for the reset itself: Restart reloaded to the title screen (Continue), inventory and tasks kept, Kemal back to `isHostile:false`, HP 100, `minder_fighting` false, patrolling again (see R1 for `minder_hostile`). |
| Fists mode: a click on open floor walks | Passed (`moveTo` by pointer worked with fists equipped). Q toggles fists; a punch more than about 60 degrees off the facing missed, two within the cone landed for 10 each (Kemal 100 to 80). |
| Kemal Aydin: new bust, background, repeat sighting | Passed. Bust and the executive-wing background render (`23_kemal_chat1.png`); first sighting plays the narration, later sightings give "I told you once. This floor is closed." and "Back again. No." The pick in his sight opens "A hand the size of a shovel closes over yours before the second pin sets." (the owed N1 case, now browser-confirmed). Showing the casualty line sets him walking off. With the cover strained, his FCA line fails as designed ("The FCA has no file on you."). |
| Dani as he/him | Passed in what I saw: young man sprite and bust, narration "A young trader", no she/her anywhere in his chat, credits line neutral. |
| Conversation backgrounds seen | Trading floor (Irina, Dani), blockchain lab (Priya), executive wing (Kemal), Satoshi's office, HQ at four in the morning (debrief). All matched their rooms. No `background1` fallback seen. |
| Story-rate game clock | Phone timestamps run 7:23 to 8:32 over about 12 real minutes. |
| Reload keeps state | Passed: "Back again." from Irina, doors still open, `irina_exec_badge_given`, inventory intact. |
| Debrief and credits | Passed: debrief at HQ after "Bring me in.", FCA letter with three picks gave "Three for three.", credits rolled and the game record is `completed`. |

## Not exercised

- Kemal's visemes and blink: only still frames, so mouth movement and blinks were not judged (Priya's eyes were closed in one frame, which is a blink or a closed-eye bust).
- NPC HP saved with hostility over a reload (I reloaded only when no NPC was hostile or damaged).
- No vision cones on KO'd NPCs (I never knocked an NPC out).
- Dusting header variants, the print-kit route and the signing case (optional; skipped for time).
- "He's past talking." toast: I interacted with the hostile Kemal through the harness `interact` (event route) and the screenshot taken straight after showed no toast. Not confirmed either way.
- Consumables (coffee, energy drinks, first-aid kits), flag locks with no `requires`, dotted-path conditions and `delayMs` mappings (no player-visible surface in this mission that I met), fire effect, above-glow hues, trolleys.
- Nine conversation backgrounds: five seen (list above). Reception, server room, data centre and Irina's office have no conversation in the route, and the checkpoint guard's was not screenshotted.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
| ------ | ---------- | -------------- | ----------- | ------- |
| Server room passphrase | `bitcoin2025` | Irina's wordlist (top entry `bitcoin`) plus IT New Starter Checklist (Rev. January 2025) | read both before typing | yes |
| Flags 1 to 4 | `<flag:1>` to `<flag:4>` | none: standalone has no VM | submitted at the drop-site | **no, flag supplied** (exercised, not earned; prerequisite reached: the HashChain terminal opened, `access_hackme_vm` completed) |
| Data centre PIN | `3110` | Door Controller Export (flag-3 reward) line `DC-02` and the CEO note "31/10" | after flag 3 | yes, given the supplied flag |
| Fund slot | `4471` | Priya's write-up and mixing notes, `mixer_settlements.log`, `mixer_pool_config.yml` (1.5%, 6 h) | read all before the console; two deliberate wrong guesses (3815, 6120) first | yes |
| Executive badge | item | Irina, "Satoshi's wing. You've a badge for it." | after the fund file | yes |
| CEO door | opened by Kemal standing aside | the casualty line in The Architect's Fund Allocation | after a deliberate seen pick | yes |
| Executive safe | `2140` | Priya's margin line "Last coin due around 2140" | before the safe | yes |

Everything downstream of flags 1 to 4 was exercised, not tested against a real VM.

## Credits (read from `#bv-cr-label`, in order)

MISSION COMPLETE; FOLLOW THE MONEY; THE ARCHITECT'S FUND: $12.8M, FOUND BY ELIMINATION ON THE CONSOLE; ENTROPY FINANCIAL NETWORK: MAPPED; ASSETS: FROZEN, $12.8M moved into a SAFETYNET wallet; PERSONNEL: CHECKPOINT GUARD: Waved you through on the FCA cover; DR. IRINA VOLKOVA: Turned, gave up the mixer tonight; 'SATOSHI NAKAMOTO II': Detained, handed to the police; DANI OKONKWO (TRADER): Flagged the wallets first, left alone; PRIYA RAGHAVAN (ANALYST): Drew the graph, left alone; KEMAL AYDIN (MINDER): Went for you; you got past him anyway; FCA COVER: strained, somebody at HashChain rang the FCA; THE ARCHITECT: IDENTITY: 87% probability, Dr. Adrian Tesseract; "72 hours. Six cells. Some of them were already paid."

The cover line is right for this run (two wrong slots strained it on purpose).

## verify-run.rb output

```
game            2591  (mission 50)
created         2026-10-16 19:22:23 UTC
last write      2026-10-16 19:51:11 UTC
played for      1728s of wall clock
current room    "reception_lobby"
unlocked rooms  8: reception_lobby, security_checkpoint, trading_floor, server_room, blockchain_lab, data_center, executive_wing, satoshi_office
unlocked objs   3: transaction_server, cold_storage_console, executive_safe
inventory       17: Your Phone, Lock Pick Kit, RFID Cloner, Fingerprint Kit, Notepad, IT New Starter Checklist, Password Dictionary List, Door Controller Export, Cold Storage Recovery Keys, ENTROPY Transaction Network Analysis, Privacy Coin Mixing Analysis, mixer_settlements.log, mixer_pool_config.yml, custody_index.csv, The Architect's Fund Allocation, Executive Access Badge, The Architect's Identity File
NPCs met        11: opening_briefing_npc, director_netherton, agent_nightshade, agent_0x99_handler, closing_debrief_person, checkpoint_guard, irina_volkova, trader_npc, blockchain_analyst, satoshi_minder, satoshi_nakamoto
flags submitted 4: (four session-supplied flags, hackme_crack_me_lab 1 to 4)
globals set     53: ... minder_challenged, minder_hostile, minder_walked ... (full list in the verifier run; includes console_tripped, console_warned, cover_strained, debrief_played, irina_recruited, assets_seized)

VERDICT: progress recorded — 7 rooms beyond the first, 3 objects unlocked, 4 flags submitted.
```

Persisted game record: `status = "completed"`, `completed_at = 2026-10-16 19:50:57 UTC`.

## Decisions made on the run

- Cover was deliberately strained (two wrong console slots) so Kemal's FCA line fails and the fight, pick and evidence routes get exercised. The cover-held talk-past route ("The FCA. Mr Nakamoto's compliance file has my name on it.") was not run this round.
- Irina was recruited, the fund frozen. Detain, watch and the KO routes were not run.
- The reload was taken after Irina and the badge, before the executive wing, so the knockout was the second page load.
