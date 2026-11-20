# m10 Full Disclosure: alignment review, round 9 (finale five-phase loop, phase 1)

## Scope and checks run

2026-10-22. Fresh Opus reviewer, read-only for game files. I worked the `mission-alignment-plan` ten-row rubric as a single reviewer against `ALIGNMENT_PLAN.md`, R1 to R8 and CONTRACT §11 (rounds 1 to 8). The tree is HEAD 215b77a5. The R8 fixes are 210198d4..HEAD; for m10 they touch `m10_victoria.ink`, `m10_vos.ink`, `m10_gary.ink` (and their `.json`), `scenario.json.erb`, `CONTRACT.md`, `FINALE_DEV_LOG.md` and `FINALE_TTS_COUNT.md`. m10 has no uncommitted changes. No VM material was opened. Scratch files are in the session scratchpad's `m10_r9/`.

What I ran:
- **Validator** (`--skip-ink --no-graph`): 0 errors; the same 2 objective-wiring warnings (`aside_done`, `blast_tunnel`) and the cutscene `onceOnly` advisories as R8.
- **Ink freshness:** every `.json` is newer than its `.ink`.
- **dialoguelint:** blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1. The same backlog as R8; the R8 ink adds nothing to it.
- **Reopen simulation** (inkjs, the engine's own rule). person-chat-minigame.js:551-566 reopens a saved conversation by finding the knot that owns the saved choices (`sourcePath.split('.')[0]`) and calling `ChoosePathString` on that knot, not on `start` (also README_ink_best_practices.md:905, "Reopened chats resume at the hub, not at `start`"). I loaded each slot-holder's compiled ink, played to a resting choice point, saved the state, changed the globals that another scene writes, and re-entered the owner knot the way the engine does. A fresh `start` (what a page reload does) was run beside it for comparison.
- **Writer inventory, rebuilt.** A script read every global the close reads and listed every writer from the current files. Readers: `six_oclock`, `hearing` and `citadel` in full, every function they call (`close_compute()`, `season_line()`, `landed_count()`), the card and credits block (erb:494-1191) and `credits_sections.json`. Writers: ink `~` assignments and `#set_global` tags in every m10 ink, and every `setGlobal`, `setVariable` (object `onRead`), `globalVarOnKO` and `setGlobalOnStart` in the **rendered** scenario JSON (the ERB was rendered with the validator's own binding, so generated mappings and the raid copies' knock-out globals are counted too). Results in "State that changes after a decision".

## Counts and verdict

**0 blockers, 0 majors, 5 minors** (open).

R8-m2 and R8-m3 are closed, and their fixes bring nothing new. **R8-m1 is only half closed.** The new lock test sits in the entry knots (`recruited`, `gallery`), and the engine never runs those on a reopen within a session: it re-enters the menu knot. A player who has already spoken to recruited Victoria or Vos before the lock opens still gets the full deal menu afterwards. That is the most likely way to meet them, since both stand beside the lock. The same reopen rule breaks three other guards that R1 to R8 treated as safe, and the fix also removed the one m10 line that pays off an m03 knock-out:
- **R9-m1 (R8-m1, not closed).** After a pre-lock talk, recruited Victoria and Vos re-offer their lock deals after the lock opens. "[Open it.]" still sells the raid, and "[Deal.]" still turns `close_zero_day` to `trading`.
- **R9-m2.** Meeting Vos for the first time after the lock now skips his opener, and with it "You put Sterling in hospital. I sent flowers." That line is the only thing in m10 that answers an m03 knock-out of Victoria (her credits list has no `ko` row by design).
- **R9-m3.** Asante: if the player talked to her before telling Wendell, his call to the switchboard no longer silences her. The cost HaX warned of ("Their switchboard will hear it.") disappears, and her credit prints "Showed the schedule."
- **R9-m4.** Unprotected Imran: if he deferred to Gary ("Ask Gary. I go where he goes.") and the player then knocks Gary out, Imran keeps deferring to the man on the floor, and his own choice is never offered.
- **R9-m5.** Wendell: walking away from him (closing his menu) sets `cut_by_hand`, but his "told" option stays open. Telling him afterwards has him pull a breaker that may already be dead, and leaves Robert Vance or Elena credited with a cut Wendell made.

**Verdict: another round needed (phase not complete; 0 majors, 5 minors).** None needs the user. R9-m1, m3 and m4 are one-line guards at the top of the menu knot, with no new lines. R9-m2 reuses an existing voiced line. R9-m5 needs at most one short new voiced line (or none: see the fix). Outside these five, every save I traced lands each earlier choice at the close, and the season adds up from the player's side.

## R8 findings: closed or not

| R8 | Status | Where it is now | New problem from the fix |
|---|---|---|---|
| m1 lock deals after the lock | **not closed** (now R9-m1) | victoria.ink:30-33 and vos.ink:17-20 send a conversation that starts at `start` to the resting knot once `outer_lock_open`. Verified by inkjs: a first meeting after the lock gives Victoria "You found your own way in. I'll remember that." and Vos his resting line, each with only "Goodbye", and the outcome stays `refused` / `avoided`. **But a reopen re-enters `recruited_menu` (:50) or `vos_menu` (:46), which have no lock test.** Simulated: open Victoria, hear her opener, close the window (or pick "[Give me a minute.]", which parks the story at `recruited_menu` before it closes, :69-73), set `outer_lock_open`, reopen. The owner knot is `recruited_menu`, nothing prints, and the choices are all three deals. Vos is the same (owner `vos_menu`: "[Deal.]", "[No.]", "[Give me a minute.]"). A page reload fixes it, because the restart runs `start`. CONTRACT §11 R8's proof ran inkjs from `start`, which is why it passed | R9-m1; R9-m2 (the post-lock first meeting skips Vos's m03 line) |
| m2 Gary over a knocked-out Imran | closed | gary.ink:137-162. Each pick's `imran_outcome` write is inside `{imran_outcome != "ko"}`. The walk-out pick gives Gary "Right. Power room's open. I'll get Imran to the medics first." in place of "Imran, coat" and Imran's Farah line. With Imran down, Farah's hide (erb:3761), the empty-chair text (erb:3935) and the two "Where's Farah?" barks (erb:3719, 3741) all test `talked_round`, so none fires. Imran's credit is "Knocked out at his bench." (erb:650); Gary's is his own pick (erb:640-642). At 06:00 Gary is offered (`gary_here`, six_oclock.ink:50) and speaks for his own pick (:253-258). The guard is evaluated when the choice is taken, so a reopen can't bypass it | none. Gary's line reads well next to the knock-out the player chose |
| m3 escaped Voltage's knock-out | closed | erb:1680 writes `ko` only when `voltage_outcome` isn't `stood_down_print` or `talked_down`; erb:1681 writes `cut_by_hand` only while `!gallery_shutter_cut`. Both stand-downs run `stand_down`, which cuts the shutter first (voltage.ink:236), so a later knock-out leaves the outcome and `cut_by_hand` alone. A knock-out in a fight still writes `ko` over `fought` (`cut_by_hand` is already true from voltage.ink:248). A knock-out while he is `avoided` and the shutter is live writes `ko` and `cut_by_hand`, and the phone voice rings as before. Static's rows (erb:666-667) test `fought`/`ko`, so a stood-down Voltage who is then knocked out gets "Went where Voltage went." Nothing reads a Voltage knock-out global (he has no `globalVarOnKO`) | none |

**Victoria and Vos after the lock, the rest of the brief's checks.**
- **Escaped and threat Victoria still behave.** Their knots are unchanged. The new `refused` arm in `gallery_rest` (victoria.ink:200-201) can only match recruited Victoria: escaped writes `avoided`, `walked`, `arrested_here` or `ko`, and threat writes `avoided`, `talked_down` or `ko`. After four, "[Go.]", the arrest and the talk-down still write their outcomes, and the share mappings (erb:1737) leave the share alone because `head_start_out` is set. Their order lines stay in the phase 4 list.
- **Vos's `avoided` default after the lock.** It is right in every state I could reach. Never spoken to: walking into the core is a gallery exit, so erb:1746 writes `avoided`. Spoken to first after the lock: vos.ink:14-16 writes it before the lock test. Knocked out: `ko` (erb:1742). Not spoken to with Victoria's secret in hand: `avoided`, which is fair (he never stood aside). Each `avoided` save prints one IN THIS OPERATION row (erb:713, 715, 717 or 719, by share and ending) and one ELSEWHERE row naming him (`close_zero_day` is `vos_named` unless `bought`, carryover_vars.ink:475). His resting line matches the share: a stopped share gives "My delivery was cancelled. I am waiting for a flight." (vos.ink:91), as the credit's "waiting for a flight" does. A traced or released share gives "I am waiting for a delivery." That line is on the phase 4 list, as the brief asked.

## Severity table (new findings)

### Minors

| # | Finding | Where | Fix |
|---|---|---|---|
| R9-m1 | **R8-m1 reopened: the lock deals come back on a reopen.** R8 moved the lock test into the entry knots, but within a session the engine reopens at the knot that owns the saved choices (person-chat-minigame.js:551-566), so the test never runs for anyone who spoke to Victoria or Vos before the lock. Both stand at the lock, so most players will have. Simulated on the compiled ink (above):<br>• **Recruited Victoria:** opener, close (or "[Give me a minute.]"), crack the keypad or use Fonoti's card, talk to her again. `recruited_menu` offers all three deals. "[Open it.]" on a released or traced share runs `trusted_sells` (victoria.ink:77-83): she "sells the raid", the two reinforcements appear (erb:3780-3781), her credit becomes "Sold the raid. Gone down the gallery stair." (erb:698), `close_secure_cell` loses `zd_uk` (carryover_vars.ink:385), and on a secured save Netherton's "Sterling's watch paid out at five" (six_oclock.ink:410) and THE CELLS' "Zero Day's UK desk: rolled up." (erb:733) give way to another cell. On a disclosed save "Sterling's line went dead at five." (six_oclock.ink:428-430) is lost the same way. "[Before you touch that lock…]" writes `confronted` and prints "Held, and opened the lock." (erb:696) for a lock she never touched.<br>• **Vos:** opener, close (or "[Give me a minute.]"), open the lock, talk again. `vos_menu` offers "[Deal.]" for a card to an open door. It writes `bought`, which turns `close_zero_day` from `vos_named` to `trading` (carryover_vars.ink:474-479) and drops his credit row and "Its broker, Pieter Vos, named." With Victoria's secret, "[Your second buyer…]" writes `stood_aside`: "Withdrew Zero Day's order. Stood aside." (erb:709) beside a card that says Zero Day has it.<br>These are exactly R8-m1's outcomes, on the commoner route | victoria.ink:50; vos.ink:46 (the R8 tests at victoria.ink:30-33 and vos.ink:17-20 cover only `start`) | Put the same test at the top of each menu knot, ahead of its choices:<br>• `=== recruited_menu ===` then `{outer_lock_open: -> gallery_rest}`;<br>• `=== vos_menu ===` then `{outer_lock_open: -> vos_rest}`.<br>Keep the entry-knot tests for first meetings and reloads. The quiet flags are already spent when the story parks at a menu, so the resting knot prints its line ("You found your own way in. I'll remember that." / Vos's resting line). Nothing new is voiced. Check (inkjs and browser): talk to each before the lock, close, open the lock, reopen. Only the resting line and "Goodbye" are offered; `victoria_gallery` stays `refused`, `vos_outcome` stays `avoided`, and no reinforcements appear |
| R9-m2 | **The R8 fix drops Vos's m03 line.** On a first meeting after the lock, vos.ink:17-20 jumps to `vos_rest` before the opener, so "You put Sterling in hospital. I sent flowers. Business is business." (:37-39) never plays. That line is the only place m10 answers an m03 knock-out of Victoria: her credits deliberately have no `ko` row (stage 6 lore_fragments.md:1020, "only on recruited, escaped and arrested"), nothing else in the ink tests `m03_victoria_fate == "ko"`, and her other paths don't run on that save. Before R8 a post-lock first meeting played it. A player who walks past Vos, cracks the keypad and then turns to him is the case R8 was written for, so on an m03-knock-out save the season's answer to that choice now goes missing on the route the fix targets | vos.ink:17-20, 37-39 | In the lock branch, play the m03 line once before resting: `{outer_lock_open: {not vos_l_seen and m03_victoria_fate == "ko": ~ vos_l_seen = true` + the existing flowers line `}` `-> vos_rest}`. That reuses a line already in the script (no new audio). `vos_rest` then adds his resting line. Check: m03 `ko`, open the lock first, then talk to Vos: the flowers line, then "I am waiting for a delivery…" or the cancelled form |
| R9-m3 | **Wendell's warning stops reaching Asante after a reopen.** On `server_hall_warned` (Wendell's call, wendell.ink:47) Asante "won't talk" (asante.ink:4, 15-17): that is the whole cost of telling Wendell, the one HaX warns about at the power-room door ("Tell him, and he'll want to warn somebody. Their switchboard will hear it.", erb:1690). The test sits in `hall`, not in `hall_menu`. The power room opens straight onto the server hall, and the gallery stair needs the shutter cut, so "see Asante, find the stair shut, go back and tell Wendell" is an ordinary route. Simulated: talk to Asante ("That's all." parks the story at `hall_menu`), set `server_hall_warned`, reopen. The owner knot is `hall_menu`, so "Show me the schedule." is still offered. It writes `asante_outcome = "talked"`, and the credit prints "Showed the schedule. Confirmed her own sums." (erb:687). A reload would give "Somebody rang the switchboard about a raid. I've nothing to say to you." The moral choice's cost doesn't land on that route | asante.ink:30 | `=== hall_menu ===` then `{server_hall_warned: -> warned}`. No new line. Check: talk to Asante, close, tell Wendell, reopen Asante: "Somebody rang the switchboard…" and only "Suit yourself."; `asante_outcome` stays `untouched` |
| R9-m4 | **Unprotected Imran keeps deferring to a knocked-out Gary.** imran.ink:16-18 sends Imran to `follows_gary` only while Gary is standing (`not gary_ko and gary_outcome != "ko"`). Once Gary is down, the design gives Imran his own scene and choice (the sheet, "Go home. Keep your phone." / "I'm taking you in."). That test is in `workshop`; a reopen re-enters `follows_gary` (owner knot of "[All right.]"). Simulated: talk to Imran first ("Ask Gary. I go where he goes."), knock Gary out, reopen. Imran says "They sacked the whole team and kept the board… Ask Gary. I go where he goes." with Gary on the floor, and only "[All right.]" is offered. Imran's decision is lost for the rest of the session: `imran_outcome` goes to `avoided` on leaving (erb:1672), and his credit is "Never asked. Still at his bench at six, under his own sheet." (erb:652) for a player who tried to ask him. (At 06:00 the walkabout offers Gary, not Imran, because `gary_here` holds for a knocked-out Gary, six_oclock.ink:50, 69-72, so no spoken line contradicts it.) | imran.ink:137 | At the top of `follows_gary`, before its quiet test: `{gary_ko or gary_outcome == "ko": -> workshop}`. `workshop` then skips its own Gary test and runs Imran's scene (no loop: each divert needs the opposite of the other's test). No new line. Check: talk to Imran, knock Gary out, reopen Imran: his opener and the sheet choices; each pick reaches the credit |
| R9-m5 | **Walking away from Wendell sets the by-hand cut, but "told" stays open.** Closing Wendell's menu without "told" sets `cut_by_hand` (erb:1682), and the phone voice rings to talk the player through the cut (erb:1687, 2271, 2287). But `wendell_outcome` stays `avoided`, and `wendell_menu` still offers "[Those servers are set to shut down hospitals at six.]" (wendell.ink:45-56; also on a reopen). Picking it later gives two wrong results:<br>• **After the phone cut:** Wendell says "Which switch do you want." and "There. Key's turned, breaker's down. That door won't move again tonight." about a shutter that is already dead.<br>• **Before the phone cut is finished:** Wendell makes the cut, but `cut_by_hand` stays true, so the credits print "ROBERT VANCE: Talked 0x00 through 1960s switchgear from Teesside." (erb:678) or Elena's "On the line for the switching." (erb:681) beside "Rang his mate Dale." for a cut Wendell made. This is the same class as R8-m3. (Vance's own call already handles a dead shutter: "Shutter's dead already. You don't need me for that.", vance_phone.ink:17-19.)<br>Telling Wendell after walking away is still a real choice (Dale stays home, Asante goes quiet), so the option should stay. Only the cut beat is wrong | wendell.ink:45-52; erb:678, 681, 1682 | In the "told" choice:<br>• `{not gallery_shutter_cut:` keep the switch beat (the sub-choice and "There. Key's turned…"), set `~ gallery_shutter_cut = true` there, and add `~ cut_by_hand = false` (Wendell made the cut, so no phone voice is credited) `}`;<br>• on a dead shutter, skip to "Dale's on the next shift. I'm calling him. He's got grandkids.", after a short opener. The present opener "*pause* Well. Which switch do you want." has to change. Either split it ("*pause* Well." stands alone; **one new short voiced line**) or open on the Dale line directly (no new line).<br>Nothing else reads `cut_by_hand` at the close except the two credit rows (inventory below), and the phone call already exits on a dead shutter. Check: close Wendell's menu, let the phone ring, then (a) finish the cut and tell Wendell: no switch beat; (b) tell Wendell before finishing: Wendell cuts, and no Vance or Elena row prints |

No blockers or majors.

## State that changes after a decision (re-verified)

**The list, rebuilt from the current files.** The close reads **110 globals**: 55 imports (`m01_`…`m09_`, written only by `importGlobals`) and 55 of m10's own. If Tesseract's console, database and ending knots, the closing music cues (erb:1208-1252) and the end-of-night mappings (erb:1758-1776) are counted as well, it is **138**. R8's "120" lies between the two scopes. Every own global R8's table named is in the set. R8's table missed these, all checked here:

| Global (missed by R8's table) | Writers (current files) | Later overwrite? |
|---|---|---|
| `nightshade_tethered` | director_netherton.ink:316, 323, both in `tether`, each with `door_scene_done = true`, then `-> hub` | No. A reopen of an undecided `tether` asks the same question, which is fine |
| `vector_on_team`, `phantom_on_team` | erb:1555-1558, `game_loaded` from m08 imports only | No |
| `clue_bench_log` | the bench log's `onRead.setVariable` (rendered JSON; R8's scan of ERB `setGlobal` couldn't see it), phantom.ink:36 | No (one-way true) |
| `arakawa_ko`, `kowalczyk_ko`, `quintero_ko`, `vector_ko`, `phantom_ko`, `mercer_ko`, `fonoti_ko`, `gary_ko`, `asante_ko` | `globalVarOnKO` on every copy (6 Arakawa, 4 Kowalczyk, 6 Quintero, 2 Vector, 1 Phantom; rendered JSON) | No (one-way true; R5-R6 settled the recall/accusation interplay) |
| `close_human`, `close_secure_cell`, `close_zero_day` | `close_compute()` only, run at the top of each closing scene | No, but they inherit any overwrite of `victoria_gallery` or `vos_outcome` (R9-m1) |
| `six_open`, `six_done`, `hearing_open`, `citadel_open`, `closing_done` | the closing scenes themselves | No (scene flags, not choices) |

**Writers R8 listed that the scan corrects or adds:**
- `cut_by_hand`: also **wendell.ink:59** ("Never mind" → `worked_round`), as well as erb:1678, 1681, 1682 and voltage.ink:248. erb:1682 (closing Wendell's menu) is the writer behind R9-m5.
- `asante_outcome`: asante.ink:37, 44 and erb:1714. **Indirect writer:** `server_hall_warned` (wendell.ink:47) decides whether Asante can be asked at all. The close never reads `server_hall_warned` directly, but it decides `asante_outcome` (R9-m3).
- `imran_outcome`: gary.ink:139, 151, 161 (now each inside the R8-m2 guard), gary.ink:71, imran.ink:20, 77, 89, erb:1667, 1669, 1670, 1672.
- `voltage_outcome`: erb:1680 (R8-m3 guard), 1684, 1685, voltage.ink:42, 66, 80, 182, 205, 219, 247.

**A writer class R1-R8 didn't look for: the reopen.** Every overwrite question in R6-R8 assumed a conversation re-enters through `start`, so a guard in the entry knot was taken to protect the menu below it. Within a session it doesn't (person-chat-minigame.js:551-566). I swept every person-chat ink for entry-knot guards on a global that **another scene** can change while the conversation is parked at the menu:

| Ink | Entry guard | Menu it should protect | Another scene changes it? | Result |
|---|---|---|---|---|
| victoria (recruited) | `outer_lock_open` (:31) | `recruited_menu` | yes (the lock) | **R9-m1** |
| vos | `outer_lock_open` (:18) | `vos_menu` | yes (the lock) | **R9-m1** |
| asante | `server_hall_warned` (:15) | `hall_menu` | yes (Wendell) | **R9-m3** |
| imran | `gary_ko` / `gary_outcome` (:16) | the `follows_gary` rest | yes (a knock-out) | **R9-m4** |
| wendell | none on the shutter | `wendell_menu` | yes (the phone cut) | **R9-m5** (it fails on a fresh start too) |
| gary (tech) | `gary_outcome` (:73, :118) | `tech_menu` | only by Gary's own knock-out, after which he can't talk | safe |
| imran | `imran_outcome` (:22, :60) | `imran_menu` | `card_cloned` (erb:1667) by cloning his card | fair: sending him home afterwards is a new choice, and the credit tells it |
| voltage | `voltage_outcome`, `gallery_shutter_cut` | `captured_menu`, `escaped_menu` | only in his own conversation, or a knock-out (captured is `koImmune`) | safe |
| nightshade | `door_scene_done` (:34, :94) | `shown_menu`, `unshown_menu` | the tether writes it on the silent branch only, where the table isn't used | safe |
| victoria (escaped, threat) | own outcomes | `escaped_menu`, `threat_menu` | only in her own conversation | safe; post-four lines stay in phase 4 |
| guards | `hall_guards_stood_down` | `hall_a`/`hall_b` | not read at the close | out of scope |

The rest of R8's table stands as written. The share globals (`share_zero_day`, `share_resale`, `head_start_out`, `head_start_killed`) are only written by guarded mappings and HaX's console. The core's globals (`ending`, `database_outcome`, `console_choice`, `exchange_1..3`, `partial_release`, `media_story_ran`, `points_landed`, `quintero_wounded`, `wren_at_core`, `quintero_enters_core`, `hax_asked_database`) are written once each through `core_router`. `ghost_*`, `victoria_line_deal`, `quintero_stance`, `nightshade_taken_in`/`nightshade_deal`, `kowalczyk_answer`, `accused`/`officer_out`/recalls are as R8 found them.

## The six endings on rich, cold and mixed saves

Static traces through the ink and the card and credits source on HEAD, with the reopen rule applied. The user's test is whether every earlier choice lands at the close and the season ends well.

### Save by save

| Save | Close in the scene | Card and credits | Lands? |
|---|---|---|---|
| **Rich surrender** (m01-m09; Gary protected, Imran sent home; Victoria recruited and confronted before the lock; Voltage captured, his hands; m04 full; m05 arrest, list kept, funded; m06 watched; m07 Trojan Horse; Nightshade shown the file and taken in; Recruiter named; told; disclosed) | Walkabout (Quintero, Kowalczyk, Voltage, Gary "Imran texted from the bus."); Ghost's word; the numbers; "Sterling's line went dead at five."; the van with Nightshade at the window; the season line and the memo line; "He asked who taught you. I said I did." | "Took his surrender. Kept his protocol."; "Ten operations…"; Victoria "Held, and opened the lock…"; Lawson, Torres, Sorensen, Noor, the forty-seven, Elena | **Yes** |
| **Cold lethal** (no imports; both shares out; secured) | Walkabout: Quintero, Imran, Wendell; "Two cells have it."; the order book's buyer at five; no season line; "There'll be a board. I'll be sitting next to you." | "Fired when his hand was on the key."; Vos "Named. Arrested on the walkway, waiting for a delivery."; "Zero Day: still trading. Its broker, Pieter Vos, named." | **Yes** |
| **Mixed arrest, unprotected Gary, Imran knocked out first, then "Walk out with us"** | Walkabout offers Gary: "St. Catherine's sacked me for being right…"; Farah stays at her post, no "Where's Farah?" | Gary "Walked out with the team. A witness."; Imran "Knocked out at his bench." | **Yes** (R8-m2 closed) |
| **Mixed arrest, escaped Voltage stood down on the print, then knocked out, Vance an ally** | "You lifted my thumb at Albion and kept it for tonight." | "Stood down on his own thumbprint."; no Vance row | **Yes** (R8-m3 closed) |
| **Mixed secured arrest, recruited Victoria never spoken to, lock cracked, then talk** | "Sterling's watch paid out at five." | "Never handed anything. Still ours, for now."; THE CELLS "Zero Day's UK desk: rolled up." | **Yes** (R8-m1's first-meeting half) |
| **Mixed secured arrest, recruited Victoria spoken to before the lock, lock cracked, then "[Open it.]"** | Reinforcements in the gallery; at five, another cell in place of Sterling's watch | "Sold the raid. Gone down the gallery stair."; THE CELLS loses "Zero Day's UK desk" | **No** (R9-m1) |
| **Join, Vos spoken to before the lock, lock opened with Fonoti's card, then "[Deal.]"** | Citadel: Netherton's line by Gary, Voltage or Nightshade | No Vos row; ELSEWHERE "Zero Day: still trading." in place of "…Pieter Vos, named." | **No** (R9-m1) |
| **Mixed arrest, m03 Victoria knocked out, lock cracked before meeting Vos** | Vos rests ("I am waiting for a delivery…"); the m03 knock-out is never mentioned | Victoria has no row (by design); Vos "Named. Arrested on the walkway…" | **Partly** (R9-m2) |
| **Mixed arrest, Asante seen first, then Wendell told** | Asante answers and shows the schedule | "Showed the schedule. Confirmed her own sums."; Wendell "Rang his mate Dale." | **No** (R9-m3) |
| **Mixed arrest, unprotected, Imran spoken to first, Gary knocked out** | Imran "Ask Gary." over Gary on the floor, and his own choice never offered; at 06:00 Gary "I'd have come quietly, you know." | Gary "Knocked down in a technician's fleece."; Imran "Never asked. Still at his bench…" | **No** (R9-m4) |
| **Mixed scorched, Wendell walked away from, told mid-call, Vance an ally** | The hearing as R6 | Wendell "Rang his mate Dale."; "ROBERT VANCE: Talked 0x00 through 1960s switchgear…" for Wendell's cut | **No** (R9-m5) |
| **Rich scorched, cold executed** (R6's saves) | As R6 | As R6 | **Yes** |

### Ending by ending

| Ending | Last in-scene beat | Season line | 0x00 credit | Open |
|---|---|---|---|---|
| Arrest (incl. hold fire) | "I said no. It took me till morning." | in `the_rest` | "Brought him out alive, in front of a court." | R9-m1 to m5 on those saves |
| Surrender | "He asked who taught you. I said I did." | as arrest | "Took his surrender. Kept his protocol." | as arrest |
| Lethal | "There'll be a board. I'll be sitting next to you." | as arrest | "Fired when his hand was on the key." | as arrest |
| Executed | HaX's message read in the van | none (by design) | "Fired when his hands were empty." | credits and the 06:00 numbers only |
| Scorched | The hearing: HaX on whether she was asked | after the map line, before the suspension | "Wiped both copies. Suspended." | as arrest |
| Join | Netherton: "Find 0x00…" | none (by design) | "Pressed the key." | R9-m1 (Vos and Victoria rows), m3, m4, m5 |

Taken as a whole, the close does what the user asked. On a rich save the 06:00 walkabout, Netherton's numbers and season line, the van and HaX's "the rest" pay off m01 to m09 inside the scenes, and the credits finish the job person by person. On a cold save the scenes stay short and true. Join and executed end hard and on purpose. What is left is the same kind of thing R6 to R8 found: a choice made in the bunker that a later step can quietly reverse. This round's five all come through one engine rule (a reopen re-enters the menu, not `start`) or one missing guard (Wendell). They are local and cheap to fix.

## Rubric (ten rows)

| # | Dimension | R8 gap | Now | Open |
|---|---|---|---|---|
| 1 | Canon and stakes | none | none | none |
| 2 | Aims and objective staging | none | none | none |
| 3 | HaX's hub | none | none | none |
| 4 | Ink craft | none | minor | R9-m4 (Imran speaks to a man on the floor), R9-m5 (a dead breaker pulled again); filed under row 5 |
| 5 | Moral choices and consequences | minor | minor | R9-m1, m2, m3, m4, m5 |
| 6 | Music | none | none | none |
| 7 | Rooms and layout | none | none | none |
| 8 | Mechanics and field guides | none (deferred) | none (deferred) | `labUrl`s with the lab sheets, as before |
| 9 | KO resilience | minor | minor | R9-m4 (a knock-out that strands a choice); R8-m3 closed |
| 10 | Bookends | none | none | none |

## Deferred to phase 4

Not findings; noted for the dialogue phase.
- **Vos's post-four "I am waiting for a delivery. You are in the way of it."** (vos.ink:93) on a traced or released share, when the delivery has already gone out. Voiced polish, as the brief asked.
- **Escaped and threat Victoria's order lines after four** (victoria.ink:108, 160) and escaped "[Go.]" naming Fonoti's card for an open lock (:117), as R7 and R8 left them.
- **Fonoti after the lock** still hands over his card or says "Go on through" (fonoti.ink:28-46). Harmless: nothing the close reads changes.
- **First meetings after the lock** are a single resting line (Victoria "You found your own way in.", Vos's resting line). They work, and phase 4 may want one more beat for a recruited Victoria the player ignored.
- **dialoguelint backlog** unchanged: blank re-entry 5, stage cue on an information line 5, crowded hub 1, "not X, Y" 2, US spelling 1.

## Withdrawn, not raised, and browser checks

- **Withdrawn after checking:**
  - I suspected the new `refused` arm in `gallery_rest` could catch escaped or threat Victoria. It can't: neither branch ever writes `refused`.
  - I suspected R8-m2's guard could be bypassed on a reopen. It can't: it is tested when the choice is taken, not on entry.
  - I suspected a knocked-out stood-down Voltage would still print Static's "Went down beside Voltage." He doesn't: those rows test `fought`/`ko`, which now stay unwritten.
  - I suspected the Nightshade table could be re-decided on a reopen after Netherton's tether wrote `door_scene_done`. It can't: the tether only runs on the silent branch, where the table conversation isn't used.
  - I first wrote that R9-m4's Imran says "Nobody asked me anything all night." at 06:00. He doesn't: a knocked-out Gary still counts as `gary_here`, so Gary takes the walkabout slot.
- **Not raised:**
  - **Victoria has no credit row on an m03 knock-out save.** That is stage 6's choice (lore_fragments.md:1020). I raise only R9-m2, the line the R8 fix removed. If the fixer wants a belt-and-braces answer, a warning-style row such as `m03_victoria_fate === 'ko'` → "Taken down at WhiteHat. Still in hospital, then charged." would carry the m03 choice into the credits. It is optional, not voiced, and not a finding.
  - **Sending Imran home after cloning his card** (reopen of `imran_menu` after erb:1667) is a fresh choice, and the credit then describes it.
  - **A knock-out of a stood-down Voltage** leaves "Stood down on his own thumbprint." and his 06:00 line unchanged. That is R8-m3's intended rule (as Wendell's `told`), and the knock-out of a cuffed man is the player's to own; no line goes false.
- **For the orchestrator (not a finding):** R9-m1, m3 and m4 add no voiced lines. R9-m2 reuses an existing line. R9-m5 adds one short voiced line ("*pause* Well.") only if the fixer splits Wendell's opener; opening on the Dale line avoids it. Record any change in `FINALE_TTS_COUNT.md`. The reopen class is worth a lint rule (an entry-knot `{global: -> rest}` with no matching test in the menu knot it falls into); that is tooling, so it goes to `docs/IDEAS_BACKLOG.md` rather than this mission.
- **Static proof for the fixer:** drive each fix the way the engine reopens, not from `start`. Play to the menu, save the state, change the global, `ChoosePathString` on the owner knot of the first choice (`sourcePath.split('.')[0]`), and check the choices. The scratch harness for this round is the session scratchpad's `m10_r9/reopen_sim.cjs` and `reopen2.cjs`.
- **Browser checks for the fixer** (keyless :3001, all in one session, with no reload between the two talks):
  - recruited Victoria: talk, close, crack the keypad, talk again. Only her resting line; `victoria_gallery` stays `refused`; no reinforcements;
  - Vos: talk, "[Give me a minute.]", open the lock with Fonoti's card, talk again. Only `vos_rest`; `vos_outcome` stays `avoided`. Then a fresh save with m03 `ko`: open the lock first, talk to Vos, hear the flowers line;
  - Asante: talk, "That's all.", go back and tell Wendell, talk to Asante. "Somebody rang the switchboard…";
  - unprotected Imran: talk ("Ask Gary."), knock Gary out, talk to Imran. His own scene and choices;
  - Wendell: open his menu and close it, let the phone ring, tell Wendell (a) after finishing the cut, (b) before. No switch beat on (a); on (b) Wendell cuts and no Vance or Elena row prints.
