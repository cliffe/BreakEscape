# m09 Digital Archaeology, Act 1 playtest R1-A

Scope: opening briefing, dock, HaX's first call, front desk (Noor), open stacks (Old Coyote), reading room, field laptop, one reload. Stopped at flag 1 (VM flags unavailable, no VM files opened).
Games: 2961 (abandoned, see env note), 2968 (main run), 2969 (briefing by hand, reload mid-call). Server: keyless :3001. Screenshots: `scenarios/m09_digital_archaeology/playtest_r1_a/`. Session logs: `tools/playtest/m09-r1a-session.jsonl`, `-session2.jsonl`, `-session3.jsonl`.
Counts: 0 blocker, 4 major, 6 minor.

## Setup notes (not game bugs)

- `m09_digital_archaeology` was not in the dev DB, so `new-game.rb` printed "No mission". I upserted that one Mission row (name, display_name, description, difficulty, secgen_scenario, collection, published) with a scratch runner script, not the full seed (the seed deletes missions not on disk). No game files touched.
- Local Node is 18, Playwright needs 20. I used the Node 22 in `~/.npm/_npx/52027bd8fc0022aa/node_modules/.bin`.
- Game 2961's session was contaminated by another playtester: its browser was navigated to game 2963 and foreign commands (`bootstrap`, `enter tape_room`, `field_kit_link`) landed in my pipe (visible in `m09-r1a-session.jsonl` seq 44-61). I stopped it and started over on 2968. Nothing from 2961 is used below.
- `bootstrap` auto-answers the briefing with choice 1 each time and closes the first HaX phone-chat, so in game 2968 I opened the phone by clicking the phone inventory item. Game 2969 I drove by hand.
- Console: 63 x 503 from `POST /games/N/tts` (keyless server, expected) and one 404 I could not attribute. No JS errors seen.

## Findings

### Major

**M1. Dock call lists its first three lines twice.** Seen in 2968 and 2969 (2969 with no bootstrap involved). When the dock thread first opens, "That noise is a cross-cut shredder", "Shutter's his round", "Night guard. Twenty-four..." appear at 9:35 and again at 10:36, an hour apart, before the choices. Looks like the intro preload plus the live scene both writing the knot. The history keeps both copies for the whole game. Shots: `03_dock_call.png`, `16_second_game_call.png`.

**M2. "Where do I stand?" is untrue once you are inside and have set up the laptop.** In `status`, the `else` branch ("Get inside, set up the laptop on a reading desk, and get into the catalogue.") also answers after `get_inside`, `meet_the_clerk` and `set_up_drop_terminal` are all done and before flag 1. Seen at the reading room with the laptop set up (`12_hax_laptop_text.png`: HaX says "field guide" then "Where do I stand?" repeats the old line). Needs a row between `else` and `flag1_submitted` (for example `set_up_drop_terminal` done: "The laptop's live. Get into the catalogue."). Right after the dock it was correct.

**M3. Reload mid-call: the unanswered dock call does not ring again.** In 2969 I reloaded with the dock thread open and the choice unanswered. After Resume and Enter on the title screen, the Mission Brief note, and declining the tutorial: no ring, no badge, nothing on screen. The pending choice is still in the thread, but only a player who thinks to open the phone finds it. `dock_rung` is already true so the `game_loaded` mapping is skipped. Nothing repeated wrongly (no briefing replay, no duplicate lines added), but the player is left without a prompt. Shots: `17_reload_midcall.png`, `19_reload_wait.png`.

**M4. Dock choice "The shutter. I'll time his round." goes nowhere.** HaX replies "His torch crosses the far end of the floor. Go when it's gone." The loading bay shutter is background art with no interactable (`room` lists only the incident log and two doors), so the choice has no mechanic and the only way in is the key-locked front desk door. I did not know what to do after picking it. Shot: `20_shutter_branch.png`. The "office door" branch also says "That puts you past the front desk", but the door it points to leads into the front desk room where Noor sits.

### Minor

**m1. Dock thread ends before the Tran warning is seen.** After "Who else is inside?" the phone closes right after "A clerk's on tonight, and an IT contractor, Jesse Tran." The next line ("Viral Dynamics' staff files have a Tran in them.") only appears when you reopen the phone, with no badge. Then the hub's "Tran." answer repeats that same line.

**m2. Reload does not return the player to where they were.** After the 2968 reload from the reading room, Resume put the player back at the dock start (160,144). Tasks, globals, unlocked front desk door and the phone thread were all kept. May be engine behaviour, not m09.

**m3. Reload needs two manual steps the harness cannot do.** After a plain `location.reload()` the resume overlay returns (bootstrap refuses its "Load session" buttons and looped on `minigame.close`), then a title screen ("Continue?"), then the Mission Brief note, then the tutorial modal. A leftover "OTHER SESSIONS" div stayed on screen until I clicked Resume by DOM. Real players see the same overlay, so check it is not stuck on top of a resumed game.

**m4. Phone and RFID cloner share one inventory icon.** Two identical blue icons in the hotbar (`01_start.png`, `06_after_pick.png`). Inventory order also changes between loads (notepad/phone/lockpick order differs between 2968 first load and after reload).

**m5. Noor's "Which boxes are next on that list?" stays on the menu after the RFID read.** It opens the RFID cloner every time, and the hub opener "Still here? Peg's going to notice." replaces "What now?" once the card is saved. The same applies to HaX's "The catalogue. What am I looking for?", which never retires (the other hub topics do). Shots: `08_rfid_noor.png`, `09_after_noor.png`.

**m6. Reading room dressing.** A radio sits half behind a bookshelf and the corkboard overlaps the lower edge of another shelf (`10_reading_room.png`). The player spawns on the east door frame on entry, which is normal door-gap placement, not a wall clip. No sprites in walls elsewhere.

## What I did and saw

1. Briefing (2968 auto, choice 1 each: "Who are the last two?", all three hub topics, "Let's go.", "Quintero's right"). Read by hand in 2969 with the cold-start path: all lines attributed, no overlap, the answer "Thank you. For the cracker." gets Lantern's reply. "Say nothing." not played. Quintero's HaX line ("Quintero's going to hate that she was right") appears only on the quintero answer, correctly.
2. Dock: HaX's first call is a text thread that opens by itself after the briefing (no ring). Choices: office door (answered, then "Who else is inside?"), shutter (see M4). Hub topics checked: "The catalogue", "Tran", "Where do I stand?" (correct at the dock: "Get inside, set up the laptop..."), "That's all for now" ("Line's open.").
3. Incident Log read ("NOBODY READS THIS", consistent with Old Coyote later). Picked the front desk lock (`completeLockpick`), entered. Run sheet "48 boxes" matches HaX's R-114 to R-161.
4. Noor: all branches. "How long have you worked for Sorensen?", "That bonus wasn't for filing", "Not tonight. Not from here." (Noor leaves, `noor_told`). RFID card cloned. HaX's in-ear lines inside Noor's chat read fine. `get_inside` and `meet_the_clerk` completed.
5. Open stacks: Old Coyote, all four branches. His "It's on my desk by the dock" fits the log. Reading room: case file, notebook scan, field laptop (vm-launcher panel opens, `set_up_drop_terminal` completes, `catalogue_guide_offered` fires, HaX texts "There's a field guide for the catalogue server if you want it"). Did not open the field guide or go past flag 1.
6. Reload (2968, thread idle): tasks, globals, inventory, thread kept; no briefing replay, no duplicate HaX lines, nothing rang (correct, nothing pending). Reload (2969, call unanswered): see M3.

## Top five

1. M3 reload mid-call: no ring, no prompt.
2. M2 "Where do I stand?" wrong after laptop setup.
3. M1 dock lines doubled in the thread.
4. M4 shutter branch has no mechanic.
5. m1 Tran warning arrives after the phone has closed.
