# m10 Full Disclosure: playtest R1, part C (outer lock, core, Tesseract, endings)

Run on :3001 (keyless, no TTS), headless (load average was 29), Node 24 from the Playwright cache, browser session tag `m10c`. Question answered: plumbing, with one reload and one off-path poke (raid team after each ending). Source for steps: WALKTHROUGH_R1.md section 2 steps 13-16 and CONTRACT.md. Scratch and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m10c/`.

I classify nothing as a game bug here; "suspect" means a human should rule on it.

## Games and evidence

| Game | Start | Ending | Session log | Verifier |
|---|---|---|---|---|
| 2990 | head start (see tooling note T1) | reached the arrest choice; 06:00 scene never opened (T2) | `.../m10c/session-g1.jsonl` | not run |
| 2999 | head start + carried NPCs | ARREST (seated, "Hold fire"), full 06:00, card, credits | `.../m10c/session-g1b.jsonl` | `.../m10c/verify-2999.txt`: progress recorded, 3 rooms beyond the first, 4 flags, 21 tasks |
| 3005 | same | SURRENDER ("Then cooperate"), full 06:00, card, credits | `.../m10c/session-g2.jsonl` | `.../m10c/verify-3005.txt`: progress recorded, 4 flags |

Transcripts: `t1.txt` (2990), `t1b.txt` (2999), `t2.txt` (3005) in the same folder. The game 1 request ("end on ARREST, with the 06:00 scene") was met by 2999, because 2990 could not open the closing scene.

Head start used: `--start-room gallery --unlock server_hall`, flags 1-3, nine earlier tasks completed, `door_scene_done`/`split_started`/`gallery_shutter_cut`/`flag1..3_submitted` set; for 2999 and 3005 also `--carry-npc` for director_netherton, six_oclock, hearing, citadel, hax_post, kowalczyk_van, nightshade_van.

## Earned secrets

| Secret | Source in this run | Earned? |
|---|---|---|
| Outer lock 6083 | Dusted the keypad plate (fingerprint kit: found, black granular powder, lift, loop, "Gallery Shift"); `keypad_dusted` set; plate text gives 0, 3, 6, 8. PIN cracker on 0368 gave 0 right place, 4 right digit. Then typed 6083. | Digits yes. The order was my knowledge, narrowed by one cracker result, not solved by elimination. |
| Fonoti's card, Vos's card, Ghost's code | Not used | n/a |
| Flags 1-3 | Head start, never played | **no** (exercised, not earned) |
| Flag 4 `core_host_terminal` | `<flag:1>` from `--flags` (session policy), typed at the station | flag supplied; its prerequisite (the box) not played |

Everything before the gallery is unproven by this run.

## Results by step

| # | Step | Result |
|---|---|---|
| 13 | Outer lock open | PASS. `outer_lock_open`, `head_start_out = zero_day`, `open_the_outer_lock` done, Quintero appears at the lock. |
| 13b | Lock guard challenge | Fired once (2990), after the PIN screen closed and blocked `enter` with `minigame-active`; "Shift change" let me through. Did not fire in 2999 or 3005 at all. See F9. |
| 14 | Core, Tesseract arrival | PASS. Four head-start arms: this one read "Zero Day has it. You didn't stop that one." with HaX "Confirmed. Zero Day's share went." |
| 14 | Flag 4 at the terminal, conversation reopens | PASS in 2999 and 3005 (closing the station opens HaX's flag 4 lines). In 2990 it said "Finish on my box first" because of T1. |
| 14 | Case, three exchanges | PASS. 2999: miss, rebuttal, miss. 3005: rebuttal x3. |
| 15 | Console "Stop it", Kowalczyk beat, Netherton on the line, database | PASS. The WREN beat plays as narration (service door, Kowalczyk pinned, HaX "I sent her mum flowers"); the player gets no choice in it. Database "Secure it" taken in both. |
| 15 | ARREST | PASS via "You're under arrest" then "Hold fire" (two or fewer points, seated). |
| 15 | SURRENDER | Reachable on a cold start: the three rebuttals (`Someone corrected your sheet...`, `Only a shock?...`, `Better you?...`) gave a standing menu with "Then cooperate. All of it." |
| 16 | 06:00 scene, ARREST | PASS. Last line ("I said no. It took me till morning.") shows at 205.1 s; credits label empties and overlay opens at 210.8 s; the card text appears at 211.3 s (5.7 s after the last line). |
| 16 | 06:00 scene, SURRENDER | PASS. Last line ("He asked who taught you. I said I did.") at 158.7 s; overlay at 163.5 s; card 164.0 s (4.8 s later). |
| 16 | Card, then credits, once | PASS both. The overlay opened once and closed once (about 130 s of credits, ARREST 210.8-340.8 s, SURRENDER 163.5-300.2 s). Nothing from the 06:00 scene was on screen under it (no dialogue after the last line). |
| - | Reload mid-Tesseract (2990, at the exchange 1 menu) | PASS with caveats. `sync`, reload, Resume, Enter on the title: the conversation resumed at exactly the exchange 1 line with the same three choices. See F3 for what else the reload did. |
| - | Raid team after ARREST and SURRENDER | PASS for the carried NPCs. Netherton: "Go and get warm. The paperwork can wait an hour." HaX: "It's done. Sit down a minute." Both end with one leave option only. The core copies (Quintero, Kowalczyk, Tesseract) are hidden after both endings. Vos is not (F1). |

Console errors: a hook (`console.error` plus `window.error`) was installed in 3005 only, after bootstrap: none caught. 2990 and 2999 not hooked. Also: `npc_hostile_state_changed` events fire for the hidden reinforcement_a/b at load; they never appeared in any run.

## Findings

Counts: 3 suspect (need a ruling), 8 minor/wording, 3 tooling notes.

### Suspect

**F1. Vos is back on the gallery walkway after the night has closed (2999).** After ARREST and the credits, entering the gallery shows `vos` visible, and talking to him plays his ordinary pre-ending conversation ("I don't do philosophy. I do delivery dates. That guard has the code card... My name stays off whatever you write tonight." with Deal / No / Give me a minute). The credits just said "PIETER VOS: Named. Arrested on the walkway, waiting for a delivery." In scenario.json.erb his `after_end_json` hide comes first in his mappings, and a later `room_entered:gallery` mapping (`m03_victoria_fate !== 'recruited' && !== 'escaped'`) does `setVisible: true`, so on room entry the later one may win. Fonoti, the guards and the core copies were hidden. Victoria's gallery mappings have the same shape (not tested: she is not placed on this path).

**F2. Second-speaker prefix not parsed for some speakers: Imran at 06:00 (both games).** The line shows as speaker "Director Magnus Netherton", text "Imran Siddiqui: Nobody asked me anything all night. Same as the board." Netherton's own lines in the Tesseract conversation showed the same fault once (2990, after a reload): speaker "Dr Adrian Tesseract", text "Director Magnus Netherton: Half of these cannot be patched this year..." (screenshot `g1_neth_prefix.png`). In 2999 and 3005 (Netherton carried, no reload) his prefix parsed fine. Both look like "speaker's NPC not loaded in a head-start run", so Netherton may not happen in a real run; but Imran lives in another room too, and I can't say whether he is loaded by then in a real game. Needs a check from a real run.

**F3. After a reload at the core (2990).** (a) The player came back in the gallery spawn (head start rewrites the start room, so possibly an artefact). (b) The mission brief reopened, then a HaX phone-chat popped over it with a stale text: "Fifteen minutes to their head start. That console's your last chance at it." at a point where `head_start_out` was already `zero_day`, so it is untrue. (c) `enter core` failed (`did-not-cross`, three tries): the gallery side was open but the core side's "Gallery Stair" door was shut again. `interact door:core->gallery` then walking right worked. A real player would click it; it only breaks the harness.

### Minor and wording

- **F4.** Stage directions show on screen as text: "Got it. Feed's dead. Hold. *breath* He's done." and "Kowalczyk. *quietly* I sent her mum flowers." (read from the dialogue DOM and a screenshot). If they are TTS cues, they should be stripped for display.
- **F5.** Credits section "IN THIS OPERATION" says Kowalczyk was "Never named"; the SAFETYNET section of the same roll names her "HALINA KOWALCZYK, 'WREN'". Tesseract also says "Not you, Halina." in the core.
- **F6.** Claims about branches the head start skipped, so I can't call them true or false: credits "ASANTE: Arrested at the release console she wrote", "WENDELL: Never told", "GHOST: Sold the head start" (while `head_start_out` was `zero_day`, `ghost_gift` unset), "VOS: Named" (never spoke to him), "SIONE FONOTI: Swept up". Worth a check against a full-play game.
- **F7.** Quintero at 06:00: "You backed me. I'll remember who did." Nothing in either run had the player back her. Cold-start default line, possibly.
- **F8.** Tesseract's cold-start fallbacks assert missions that were not played: "Albion. A site left open...", "You handed Derek over. He kept his promise to me", "Two of yours died at the sites nobody covered", then "Since your first day." which follows the last of these oddly. They are the intended defaults (`else` arms) but read as fact.
- **F9.** Lock guard challenge is timing dependent: appeared only in 2990, after the PIN minigame closed. 2999 and 3005 never triggered it (and it did not matter). Not checked what the cone looked like in each.
- **F10.** Exchange menu wording: the bridge option "And the last one?" does not say what the last one is; first-time reads as a continuation of "No. I didn't send it."
- **F11.** In 06:00 the hub offered Quintero, Kowalczyk, Imran, Wendell, "That's everyone". Choosing Imran then immediately plays Netherton's arrival and the Wendell option is gone (both games). Intended or not, the player never gets Wendell.
- **F12.** Fingerprint candidates on the keypad plate are "the gallery shift" and "Gallery Shift": the same label twice, only one is correct. Nothing a player can compare.
- **F13.** The core host terminal's SUBMITTED FLAGS list also shows flags 1-3 ("Accepts flags from: core_host").

### Tooling notes (for whoever sets up the next run)

- **T1.** The head-start recipe given for flag 2 (`release_console:bunker_monitor-flag1`) collides with flag 1 ("Flag already submitted"). `--submit-flag bunker_monitor-flag2` works (station release_console). `--submit-flag` also queues `flag_N_in` events that never fire here, so `flag1_submitted`..`flag3_submitted` stay false and Tesseract answers "Finish on my box first" to a submitted flag 4. Add `--set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true`.
- **T2.** Starting in the gallery leaves forward_post's NPCs unloaded. The closing scene (`six_oclock`, `hearing`, `citadel`) never opened in 2990. Carry them (`--carry-npc six_oclock` etc.); carried NPCs appear in the gallery, and the cutscene replays at bootstrap.
- **T3.** `lock` with a wrong PIN retried the same code 12 times (harness). The dusting minigame needs a short wait after "found" before the powder step; `__test.minigame.drag` on `.dusting-canvas` drives it.

## Top five

1. F1: Vos is visible and talks again after the night is over, contradicting the credits.
2. F2: Imran's 06:00 line is labelled as Netherton (and Netherton's as Tesseract's after a reload); confirm in a real run.
3. F3: reload at the core leaves a stale "Fifteen minutes to their head start" HaX text and a shut door the harness cannot cross.
4. F4: `*breath*` and `*quietly*` show on screen.
5. F5/F6: credits contradict themselves on Kowalczyk, and several credit lines describe branches the player never saw.

What passed: the outer lock via dusting and PIN, flag 4 reopening the conversation, three exchanges, the console and database choices, reload resume at exchange 1, ARREST and SURRENDER both reachable and closing correctly, last line before card, card then credits exactly once, closing-line-only raid team.
