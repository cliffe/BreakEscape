# m09 stages 4–5: review round 3 (final check)

Fresh read-only reviewer, 2026-10-21. Read `../stage_4/objectives_tasks.md` ("S4", §17) and `room_layout.md` ("S5", §15) against `REVIEW_R2.md`, `docs/agents/FINALE_BRIEF.md`, both finale engine docs and `tools/playtest/README.md`, and checked the claims against the engine. No VM material opened. Severity scale as rounds 1–2.

## 1. Round 2 findings: confirmation

| ID | Status | Note |
|---|---|---|
| B-R2-1 | **in the text; carrier broken** | S4 §4 row 7, §6.6, §7.1 topic 5, §8; S5 §3.5 all say it. But the `#add_note` path the fix leans on writes a malformed note: N-R3-1 |
| M-R2-1 | **fixed** | Row 2b: `unlockDoor` only, `cage_opened` on `door_unlocked_by_npc` (emitted only on server success, `npc-game-bridge.js:108-141`), retry on `door_unlock_attempt` (emitted for any locked door before the outcome, `unlock-system.js:111-123`), `game_loaded` backstop. A failed unlock leaves topic 14 up; a reload re-issues |
| M-R2-2 | **fixed, but it caused a regression** | `cooldown: 0` on both setters. Dropping `!in_cage` from ring (a) reopens M1: N-R3-2 |
| M-R2-3 | **resolved by F20 in the text** | Voiced knots end `#exit_conversation` and never divert to the hub. `#exit_conversation` closes the call after the last line (`phone-chat-minigame.js:936-947`), so the client voices nothing past it even before F20 ships. F20 itself is not built: m-R3-1 |
| M-R2-4 | **fixed** | S6/S7 start in the 2×2 `tape_room`. The carried ids match S5 §3.1/§8. The hangar speakers are Netherton, Kowalczyk, HaX and the narrator (stage 1 L367, L517), so the S7 list is complete |
| m-R2-1 | **fixed** | Scene backstops are on `room_entered` only (§4 rows 9–11, §5). Two summary sentences still say "load and room-entry": m-R3-2 |
| m-R2-2 | **fixed** | §6.5 now says the debrief restarts and replays safely, and `debrief_notice_before` is in §5. S5 §10 item 27 still says "resumed": m-R3-2 |
| m-R2-3 | **fixed** | §6.1 re-rings 1–2 |
| m-R2-4 | **fixed** | S5 §3.6, §8 |
| m-R2-5 | **fixed** | S4 §7.1 topic 11 |
| m-R2-6 | **fixed** | S4 §4 rows 1, 2b, 5 |
| m-R2-7 | **fixed** | S4 §11; S5 §3.3 |
| m-R2-8 | **mostly fixed** | S5 §10 item 1 still has the `#unlock_door` fallback: m-R3-2 |

Stale-copy grep: `resumes at`, `working name`, `four phone scenes`, `two tiles apart`, `load and room-entry`, `#unlock_door`, `narrator`. The hits outside the outcome tables are listed in m-R3-2. Narrator hits in S4 §10 and R1 refer to person-chat (the hangar), where narration is voiced, so they are correct.

## 2. Break attempts

| Attempt | Result |
|---|---|
| Coded line, flag 1 then the screen | Catalogue variant plus `flag1_read`'s note. The note is malformed (N-R3-1); the screen read works (`interactions.js:1549`) |
| Flag 1, flag 2, then the screen | The ledger variant now repeats the line (S5 §3.5), so this holds |
| Flags 1–2 and the screen never read | The line depends on the `#add_note` note (broken) until topic 5 shows at `salvage_keypad_seen` and quotes it. Not a soft-lock, but N-R3-1 |
| `flag1_read` closed early | Tags are processed before the typeout (`phone-chat-minigame.js:902-922`), so a closing tag still runs if no choice comes before it |
| Victoria, unlock fails, then reload | Holds (M-R2-1) |
| Card route, crash after the gate opens and before sync | Nothing rebuilds `cage_opened`, and the Recruiter's call needs it: m-R3-3 |
| `in_cage`: out, then back in within 3 s | Ring (a) rings inside the cage: N-R3-2 |
| `in_cage`: reload inside the cage | Cleared on `game_loaded`, then set again by the start room's `room_entered`; (c) excludes the cage. Holds |
| Three voiced calls end | Each ends `#exit_conversation`, with no hub divert. Holds |
| Debrief after a reload | The `room_entered` backstop re-emits `start_debrief`, and the replay reads `debrief_notice_before`. Holds |
| S6/S7 starts | Parity is fine from `tape_room`, and the speakers are carried. S6's "scene due on entering the salvage cage" is wrong: the backstop rings on load, in the tape room (m-R3-2) |

## 3. Findings

### Majors

**N-R3-1 (major). The `#add_note` that carries the coded line makes a note the notepad can't show.**
- *Location:* S4 §4 row 7, §6.6 (`flag1_read`), §8 legend row; S5 §3.5.
- *Evidence:*
  - `#add_note` calls `NPCGameBridge.addNote` (`chat-helpers.js:177-181`), which pushes `{title, content, timestamp, source}` with no `text` and no `id` (`npc-game-bridge.js:493-515`).
  - The notepad reads `note.text`: `parseNoteText(currentNote.text)` calls `text.match` (`notes-minigame.js:348, 416-418`), and search calls `note.text.toLowerCase()` (`:444`). Both throw on this note.
  - State sync sends `id: n.id, text: n.text` (`state-sync.js:122-129`), and the server merges by id (`games_controller.rb:1458-1467`). The note syncs empty, and every such note shares the id "".
  - No shipped scenario uses `#add_note`, so this path has never been run.
- *Problem:* B-R2-1's main carrier fails silently. The note shows up as a toast, then throws when it comes up in the notepad, which can stop the player browsing their other notes. "In the notepad on every route" is false. The other carriers (the screen variants and topic 5) mean this is not a soft-lock.
- *Fix:* Give the line as a notes item. Add a `notes` object to HaX's `itemsHeld` (name "Catalogue: salvage cage", `text` the coded line) and end `flag1_read` with `#give_item` of it. That goes through `_receiveNote` → `window.addNote` (`npc-game-bridge.js:20-28, 305`), which gives the note an id, a `text` field and de-duplication. Or make the engine fix (`NPCGameBridge.addNote` delegates to `window.addNote`) and tell the orchestrator, since other missions could hit the same bug.

**N-R3-2 (major). Ring (a) can now ring the Recruiter's call inside the cage.**
- *Location:* S4 §4 row 3 (a); §17 M-R2-2.
- *Evidence:*
  - A `delayMs` mapping re-checks its condition when the delay ends, using the **original** event data (`npc-manager.js:609-626, 778`).
  - (a)'s condition is now `data.roomId === 'restricted_cage' && ledger_read_heard && cage_opened && !recruiter_call_started`. Three seconds later, `data.roomId` still says the player left, wherever they are now.
- *Problem:* Cage → hub → back into the cage within 3 s (the doorway jitter M-R2-2 itself describes) rings the voiced call with Sorensen in the room. That is M1's case again. The `!in_cage` term R2 removed was what made the re-check safe.
- *Fix:* Restore `&& !globalVars.in_cage` on (a), and make the clearing setter run first. Listeners for one event fire in registration order (`npc-events.js:45-49`), so either put both `in_cage` setters on `recruiter` ahead of (a), or list `agent_0x99` before `recruiter` in `loading_dock.npcs` and say so in §4. Add "out and back in within 3 s" to R12.

### Minors

**m-R3-1. F20 is described as built, but the code doesn't have it.**
- *Where:* S4 §0 says it was "committed in 57d3d237"; S5 §10 item 4 says "works (F17, F20)".
- *Evidence:* The commit and the working tree have no knot boundary in `tts_line_extractor.rb` or `phone-call-voice.js`. The engine doc §7 still says the whole phone story is voiced (dev log L251: "started").
- *Fix:* Mark F20 as pending engine work. Don't run `batch_generate` for m09 until it lands, or the batch will include HaX's whole thread.

**m-R3-2. Stale wording.**
- S4 §0 item 3 and S5 §4.3 (S1) say "load and room-entry backstop". They should say room-entry only.
- S5 §10 item 1 still carries the `#unlock_door` fallback.
- S5 §10 item 27 says the debrief is "resumed if closed". It restarts (S4 §6.5).
- S4 §12.1 S6 says "scene due on entering the salvage cage". It rings on load, in the tape room.

**m-R3-3. On the card route nothing rebuilds `cage_opened` if a crash loses it.**
- *Problem:* The gate's unlock is saved on the server, but `cage_opened` is a client mapping global (the same class as §15 item 2). If a crash loses it, the call never rings and the reload backstops don't help.
- *Fix:* HaX on `room_entered:restricted_cage` with `!globalVars.cage_opened` → `setGlobal cage_opened`. Being in the cage proves the gate is open.

**m-R3-4. Stage 6 constraint on the coded line's characters.**
- *Problem:* `#add_note` splits on `|`. Ink strips `//…` as a comment and reads `#` as a tag and `{}` as logic, and topic 5 quotes the line in ink.
- *Fix:* Add to P20: the encoded string avoids `|`, `#`, `//`, `{` and `}` (or topic 5 escapes them).

## 4. Verdict

**Not clean: 0 blockers, 2 majors, 4 minors.**

All 13 round 2 findings are in the text, and the checks asked for hold: Victoria's gate with a failed unlock and a reload, the voiced calls ending without hub diverts, the debrief replay, and the S6/S7 parity and carried speakers.

Two fixes need a further change:
- B-R2-1's carrier: `#add_note` produces a note with no `text` or `id` (N-R3-1). A `#give_item` notes item fixes it.
- M-R2-2's change to ring (a): dropping `!in_cage` lets the delayed re-check ring inside the cage (N-R3-2). Restoring the term with a fixed listener order fixes it.

Both fixes are local. Neither changes a room, a lock or a choice.
