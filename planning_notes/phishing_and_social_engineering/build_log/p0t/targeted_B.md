# P0-T targeted checks B (after the Phase 0 fix round)

Keyless :3001, headless (load average 3.3), `--speed fast`, Sonnet. Working tree as served on 2026-10-21 (about 12:05 to 12:25 UTC); no game file edited, nothing committed. Scratch: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-TB/`. Hook: `popup-console-hook.js` plus a log filter for the word "superseded", installed after bootstrap (no reload in either game, so it stayed in place).

Harness PIDs: 839525 (m03) and the m05 session, both stopped with `session-stop.sh`; no process of mine left. Two Chromium renderers from Oct 19 (pids 3653517, 3653666) are someone else's and were left alone.

## Earned-secrets table

No PIN, code, flag or password used; nothing set from the console; flags submitted 0 in both games. Everything below was reached by play.

## Check 1: m03 cloner beats (game 2849, mission 47)

Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-TB/m03-session.jsonl`. verify-run output: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-TB/verify-2849.out` (progress recorded, 3 rooms, tasks `clone_reception_badge`, `meet_victoria`, `clone_rfid_card` completed, `leave_until_dark` active, globals include `reception_badge_cloned` and `victoria_card_cloned`).

Route: bootstrap (unsettled as before; `mg close`, bootstrap again), Ffion chat, "Lean in by her lanyard...", Crack keys first, Dictionary Attack, Save. Then main hallway, emulate "Staff Access Badge" on the conference door, Victoria chat, six topic choices to "Skills are cheap. Knowing where to sell them isn't.", the cloner launches ("Card read. Now run Darkside on it."), Crack keys first, Darkside (about 30 s), Save. Then Victoria's test question ("Take the forty..." and "This is exactly the kind of work...") to the end of the meeting.

| Item | Ffion (chat open, MIFARE default keys, UID DB 7F A6 3A) | Victoria (MIFARE custom keys, Darkside) |
| --- | --- | --- |
| `complete() called on a superseded minigame instance` | not seen | not seen |
| Console warn/error around the save | none new. The only entry in the whole page was the old known `Cannot disable main game input` (at chat open, before the cloner) | none new. Only the known `Cannot disable main game input - no main game scene`, `Cannot update door pathfinding` (x4), `Tables object layer not found`, `No path to target`, all before the cloner opened and unchanged after Save. Error count 8 before Save, 8 after Save, 8 at the end |
| Chat returns correctly | yes: the person-chat reopened on its own after Save with "Sorry, I was miles away. Where were we?", hub choices "How's the building laid out?" / "Thanks. I'll head through."; Thanks gave "Go on, then. Shout if you need anything." and the chat ended | yes: reopened with Victoria's "Before you go. One question..." and ran to "...the meeting is over." No window error, no orphan container (`mg` reports no active minigame after the end) |
| Global set | `reception_badge_cloned` false to true | `victoria_card_cloned` false to true |
| Task | `clone_reception_badge` completed 12:12:40Z | `clone_rfid_card` completed 12:14:38Z |

Notes: the person-chat `title` reads `null` in `brief` after the chat returns from the cloner (it read "Ffion Rees" / "Victoria Sterling" before). The speaker name and text on screen are correct; I did not check whether the baseline also showed a null title, so treat it as an observation only. Influence popup count on this page: 10 after the Ffion chat, 13 before Victoria's Save, 15 at the end. Popup counts are not part of this check (the earlier P0-T run saw 10 and then 5 for Victoria; I did not separate Victoria's total).

## Check 2: m05 Patricia (game 2858, mission 49)

Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-TB/m05-session.jsonl`. verify-run output: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-TB/verify-2858.out` (progress recorded: patricia_office entered, 3 tasks completed).

Route: bootstrap, enter patricia_office, talk to Patricia (first meeting, choice 1 throughout), reopen her chat ("What now?" hub), choose "Who's on the suspect list?" and step each line.

| Step | Speaker string | npcId | Name label | Portrait section class |
| --- | --- | --- | --- | --- |
| "What now?" (hub) | Patricia Morgan | patricia_morgan | Patricia Morgan, `person-chat-speaker-name npc-speaker` | `person-chat-portrait-section speaker-npc` |
| player choice "Who's on the suspect list?" | demo_player | patricia_morgan | demo_player | `speaker-player` |
| "Hannah Leigh and Sanjay Rao. And two juniors..." | Patricia Morgan | patricia_morgan | Patricia Morgan | `speaker-npc` |
| "Halloran's been fighting the CEO..." | Patricia Morgan | patricia_morgan | Patricia Morgan | `speaker-npc` |
| "Angry, skint and distracted aren't evidence..." | Patricia Morgan | patricia_morgan | Patricia Morgan | `speaker-npc` |
| "Yes?" | Patricia Morgan | patricia_morgan | Patricia Morgan | `speaker-npc` |

The portrait is drawn on `CANVAS.person-chat-portrait` inside `.person-chat-portrait-canvas-container` (no img src to read). Screenshot `pat-02.png` shows the in-person pixel-art bust of Patricia (dark security jumper, hood-like dark top, grey light on the hair) over the office chat background, with the name "Patricia Morgan" in the label and the line below. Same layout in every Patricia line, no portrait or name swap between lines, and the player's own line switches to `speaker-player` as it should. Screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-TB/pat-00-whatnow.png`, `pat-01.png` (player line), `pat-02.png` to `pat-05.png` (Patricia lines).

Comparison: this matches `p0t/m05.md` (label Patricia Morgan, `speaker-npc`, `dialogue.speaker "Patricia Morgan"`, `npcId patricia_morgan`). The browser baseline (`baselines/browser/m05.md`) has no portrait, label or class record to compare against; it recorded popups only. So "exactly as before Phase 0" is shown by P0-T's m05 popup, transcript and global comparison plus this run, not by a pre-Phase-0 portrait capture. m05 console: only known kinds (`Cannot disable main game input` x2, `Cannot update door pathfinding`, `Tables object layer`, TTS 503s from the keyless server). No window error, no unhandled rejection, no `superseded` line.

## Not done

- Second run on the old commit to compare the pre-Phase-0 m05 portrait. Not requested; flagged above.
- The EM4100 / harness-induced F1 route was not repeated.
