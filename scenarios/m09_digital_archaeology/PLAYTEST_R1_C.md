# m09 Digital Archaeology: playtest R1-C (Act 3)

Question answered: plumbing, plus a few off-path checks. Keyless server :3001, headless (the harness needs Node 20+; the system Node is 18, so it ran on Playwright's bundled Node 24). Script sources: WALKTHROUGH_R1.md steps 13-20 and scenario.json.erb, no VM files opened.

Games and logs:

- Game 2963 (head start at end of Act 2, flags 1-2 submitted, office unlocked, cage open, `nightshade_file_held`, `deck_choice_made`): session log `tools/playtest/m09_r1_c-session.jsonl` (commands to seq 179 are this game; later lines were lost, see N-1), verifier output below.
- Game 2970 (second head start, flags 1-2, start room salvage cage, no flags 3-4): `tools/playtest/m09_r1_c-session2.jsonl`.
- Screenshots: `scenarios/m09_digital_archaeology/playtest_r1_c/` (01 after hour_read, 02 credits, 03 hour_read in game 2970).

Verifier, game 2963: `VERDICT: progress recorded — 6 rooms beyond the first, 1 objects unlocked, 4 flags submitted.` 23 of 23 tasks completed, score 90, `report_to_netherton` completed.
Verifier, game 2970: `VERDICT: progress recorded — 2 rooms beyond the first, 0 objects unlocked, 4 flags submitted.`

## Earned secrets

| Secret | Value used | In-game source | Earned? |
| --- | --- | --- | --- |
| Office safe PIN | `060216` | Rent Ledger header (06/02/16) read first, lease "June 2, 2016" read later | yes (ledger read before the PIN; pad showed six slots, `pinLength: 6`) |
| Salvage keypad | `LEWISANDCLARK` | Shelf Marks gives BONEYARD (read); the coded line came from HaX's flag-1 text, which the head start skipped, and I did not run the CyberChef decode | **no**: key found, ciphertext and decode not exercised. A wrong try with `BONEYARD` cost one of three attempts |
| Tape store card | item | Floor safe | yes |
| Flags 3 and 4 | `<flag:3>`, `<flag:4>` | no VM in standalone | no, flag supplied; nothing downstream of the VM work is proven |

## Findings

Counts: blocker 0, major 1, minor 6, notes 4.

### Major

**M-1. Reading the printer-tray objects before their flag removes them, so the memo, draft and Mirror Job printout can never be read.**
Repro (game 2970, no reload needed): in the salvage cage, before flag 3, `interact` Printed Folder VH-2017-0312 (reads "PRINTER READY. TRAY EMPTY."), close it. `room` no longer lists `albion_folder`. Submit flag 3, finish the identity scene: HaX says "There's more on his box. A memo and a draft. Read them." The folder is gone, and the notepad holds only the empty-tray page (notepad pages: 3, the third being "PRINTER READY. TRAY EMPTY."). The `textVariants` on `flag3_submitted` (ERB:2186-2189) never show. Same for `mirror_job_printout` read before flag 4 (gone from `room`, count 0). In game 2963 the same objects, plus the Property Label and the tape-room Annotation Sheets, were gone after a reload once read.
Why it matters: the empty tray is the first thing a player sees in the room that holds the flag terminal, and the debrief assumes it was read ("You've read his memo. Was he right?", "You read it. You decide."). A player who checks the tray early reaches the Albion decision without the memo, and "Send it" in HaX's hub says "Still on his box" with nothing to read.
Suspect: the engine removes a readable notes object once read (adds a page to the notepad); a state-variant object needs to stay. Screenshot: `playtest_r1_c/03-hourread-no-printouts.png`.

### Minor

**m-1. Reel Deck's first use opened nothing (game 2963, `deck_pulled = none`).** First `interact` on the Reel Deck set `alpha_deck_used` (event seen) and no person-chat opened; the next `interact` opened the recording ("Empty spools. Degaussed."). Not reproduced in game 2970 (the salvage-cage door route failed there, see N-3). Possible first-use miss on the mapping.

**m-2. Tomb Beta Drop Link lists the catalogue flags under SUBMITTED FLAGS** although it "accepts flags from tomb_beta_server" only. Both ticked entries are the Act 1-2 flags.

**m-3. The head-start phone scenes asked to be closed at load in game 2970** (bootstrap closed four phone-chats before the first command). Probably the head start (globals set, no mappings run), noted so it can be ruled out.

**m-4. Identity scene option 3 ("Afterwards. Not during.") is absent in game 2970, present in game 2963.** The difference between the two head starts is `afterwards_heard` (set in 2963 only), so it looks gated on that global. If it is, a player who never got the `afterwards` text loses that answer without any sign.

**m-5. HaX line "Then why build the key?" is drawn as an NPC bubble between two HaX lines** ("There's a key on here that sends it everywhere in the same minute." / "He'll call it full disclosure.") then the player's "Isn't it?". Reads as the player's question, or a HaX aside. Check the attribution in `m09_hax` hour_read.

**m-6. Debrief says "Miss Haddad went home and rang her father. She is still on a list, and she does not know it."** In this run the player never met Noor (head start), so the line states events the player did not see. Unclear whether a branch guards it; check against `noor_*` globals.

### Notes (no action asked)

- **N-1. Shared scratch script collision.** Another run overwrote `/tmp/claude-1000/c.sh` (a helper I had written there) with one that points at session 2961. For about ten commands (one `moveToNear`, `enter`, `interact`, a `bootstrap` and an `eval` that set `location.href` to game 2963) I drove that other session's browser. It has since ended. I moved my helpers into the scratchpad. Affected the session log only: the lines after seq 179 of `m09_r1_c-session.jsonl` are not in it, and that game-2963 stretch (flag 3 onwards) was driven through the scratchpad helper, so it is not logged.
- **N-2. Tesseract's call is not a separate ring.** After the hour_read hub closes, HaX's thread closes for about a second and reopens with the call (HaX's side only: "That's my other line. Withheld. Stay on, and don't say a word... I know it's you"). `tesseract_call_started` and `_done` set, `hear_the_mirror_job` completed, aim `take_tomb_beta` completed. Expected per the walkthrough if "voiced, forced" means the thread reopens; I did not hear it (no TTS on :3001).
- **N-3. Head-start side effects.** `get_inside` and `meet_the_clerk` stay open (not covered by the head start). The debrief person-chat only opened on entering the loading dock, because the head start leaves its NPC in the dock; the mapping fired on `room_entered` and played to the end. In a normal game it is loaded at boot. In game 2970 `enter tape_room` from the salvage cage did nothing after flag work (not diagnosed; I was in the middle of the HaX call state).
- **N-4. Flag-station / printer tray "Observations:" prefix.** Shelf Marks displays as "Shelf Marks Observations: MOUNTAIN STATES ..." (chart type engine text).

## What passed (game 2963, in order)

| Step | Result |
| --- | --- |
| Sorensen's office entry (unlocked, deck choice made) | ok |
| Floor Safe, six-slot pad, `060216` | opens; contents Reading 1-4, Last Page, master schedule, Tape Store card; all taken; `reading_found`, `take_the_reading`, `take_tape_room_card` completed |
| Lease file | taken, `find_the_deed` completed |
| Tape room (card on reader) | opens, `enter_tape_room` completed |
| Shelf Marks | readable; BONEYARD for bay 12 |
| Annotation Sheets (Alpha) | "Blank label stock." on this route |
| Salvage keypad | wrong code uses an attempt ("Attempts 1/3"); `LEWISANDCLARK` opens; `open_salvage_cage` completed; `tomb_beta_guide_offered` set |
| Property Label | reads "ASSET 0412 ... Issued to: Strategy Directorate. Returned: --"; `asset_tag_read` set |
| Flag 3 | accepted; `submit_owner_flag` completed; identity scene opened about 2.5 s later (voiced thread, no close button) |
| Identity scene, reload mid-scene (before answering) | after reload and Resume, the HaX thread reopened at the same three choices; one added line "Still here. Netherton too."; no repeated lines |
| Answer 2 | `identity_scene_done`, `hear_the_name` done, `send_the_notice` unlocked (m-05 from the walkthrough did not occur) |
| Flag 4 | accepted; `hour_read` thread ran, choices Isn't it? / Who gets it first? / Analysis had a guess / Her schedule; then the call; `submit_control_flag`, `hear_the_mirror_job`, aim completed |
| HaX hub | About the name, Where do I stand, The Reading ("All of it"), His notice (Not yet) all answer cleanly; no repeated lines |
| Bring me in | `start_debrief` set; debrief opened (N-3) and ran to the last line; "MISSION COMPLETE" credits label shown; verifier shows 23 of 23 |

No console errors were captured (the harness does not surface them; I did not check the browser console separately). No calls rang twice in either game; no overlapping dialogue seen (phone threads and person-chat never open together).
