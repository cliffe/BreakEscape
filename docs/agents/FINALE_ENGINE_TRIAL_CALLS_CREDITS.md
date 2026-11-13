# Finale engine trial: forced calls and closing credits (F14)

2026-10-21. Two small engine features for the Season 1 finale, approved as F14. Nothing committed. Scenario author docs are in `README_scenario_design.md`: "Forced phone calls that ring again" (under Phone NPCs) and "Closing card and credits" (under Music System).

## 1. A resumable forced phone call

### What existed

- `disableClose` on a phone call was passed through (event mappings with `conversationMode: "phone-chat"` already sent it), and the base minigame hid the x and the Close button. The phone has its own Esc handler and back arrow, and neither checked it: Esc went back to the contact list, a second Esc closed the phone, and the back arrow did the same. This was the "not honoured by Escape" report.
- `timedConversation.disableClose` was documented in the README but never read: `registerNPC` didn't copy it and `_deliverTimedConversation` didn't pass it, for person-chat or phone.
- Ink state between openings: phone-chat saves the story after every choice (`_saveStoryStateFor`) and on close (`_flushPendingMessages`). A reopen with no explicit knot restores it and shows the current choices (`showCurrentChoices`, with `reopenWithCurrentGlobals` for changed globals). reopencheck covers that path.
- Every event mapping that opens a phone-chat passed an explicit knot (`targetKnot`, or `npc.currentKnot` when none). An explicit knot restores the saved story and then jumps to the knot, so a re-ring restarted the call.
- `conversation_closed:<id>` is emitted by phone-chat (on the back arrow and on close). The README still said phone chats never emit it; corrected.
- A hit from a hostile NPC deliberately leaves the phone open (m07 U12) on the grounds that Esc closes it. On a forced call there is no Esc, so the player would have been stuck.
- `sendTimedMessage` / `timedMessages`: unchanged; they work during a call (below).

### What I added

| File | Lines | Change |
|---|---|---|
| `public/break_escape/js/minigames/phone-chat/phone-call-lock.js` | new, 27 lines | `phoneCloseLocked(params)`, `phoneEscapeAction(view, params)` ('back' / 'close' / 'none'), `FORCED_CALL_END_CLOSE_MS` (2000). No imports. |
| `public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js` | 19, 177-185, 233-247, 576, 680, 733, 921, 932, 939-950 | Import; back arrow hidden and its click ignored on a forced call; Esc does nothing on a forced call; `_releaseForcedCall()` closes a forced call 2 s after a story that ends without `#exit_conversation` (as person-chat already did), called at each of the five "story over" spots. |
| `public/break_escape/js/systems/npc-manager.js` | 330-331, 670, 1156-1159, 1505, 1524-1525, 1736-1746 | New mapping key `resume` (phone-chat only: open with no knot when a saved story exists, so the thread is restored at the unanswered choice; with no saved story it rings at `targetKnot`). `timedConversation.disableClose` copied through and passed to both phone-chat and person-chat. |
| `public/break_escape/js/systems/player-damage-interrupt.js` | 55-58 | A hit closes a forced (`disableClose`) phone call like any other minigame; an ordinary phone still stays open. |
| `public/break_escape/js/systems/npc-barks.js` | 13, 455-457 | Clicking a toast does nothing while a forced minigame is open, so another contact's text can't replace the call. |
| `scripts/validate_scenario.rb` | 296 | `resume` added to the known eventMapping fields (one word; the rest of this file's diff is other agents'). |

The re-ring itself is a documented pattern, not code: an event mapping with `conversationMode: "phone-chat"`, `resume: true`, `disableClose: true`, `cooldown: 0` and a condition on the call's globals. The trigger is the mapping's `eventPattern`: `conversation_closed:<id>` (immediately), `room_exited` with `data.roomId` in the condition (leaving a room), or any event. `delayMs` adds a pause.

### The two questions

- **Can a text arrive while a call is open?** Yes. A text from another contact goes into that contact's thread and shows as a toast over the phone; the screenshot shows the Director's text over HaX's forced call. Before this change, clicking that toast opened the other thread in place of the call; it now does nothing until the call ends (fixed, 3 lines). A text from the caller themselves is held as a toast until the phone closes and is in the thread on the next open (existing behaviour, m04 N1).
- **Does a second speaker in HaX's thread show under their own name?** It didn't. A line `Director Netherton: Put her on.` in HaX's thread was drawn as HaX's bubble with the prefix left in the text. Fixed (small): `otherSpeaker()` in `phone-chat-speaker.js` (163-188) matches a prefix against registered characters' display names (not the thread's own contact), and `phone-chat-ui.js` (13, 665-676, 703-708) draws the name over the bubble with the prefix dropped; CSS `.message-sender` and `.message-bubble.npc.other-speaker` in `phone-chat-minigame.css` (372-385). Only registered display names count, so `Note: ...` stays text. The stored history, notepad export and toast text are unchanged (they still carry the prefix).

## 2. Computed closing card and per-person credits

### What existed

Credits are a music event entry's `credits` array of `{ text, style, condition }`, filtered in `scenario-music-events.js` (conditions are JavaScript over `globalVars`, run at the trigger) and shown one line at a time by `_startCredits` in `bond-visualiser.js`. m08 already does per-person lines this way, with mutually exclusive conditions per person. Gaps: no card shown as a block, no teaser, a section heading prints even if nothing under it does (the validator's m05 Recruiter suggestion), and "one clause per person" needs every condition to exclude the others by hand.

### What I added

| File | Lines | Change |
|---|---|---|
| `public/break_escape/js/music/closing-sequence.js` | new, 122 lines | `buildEndSequence(entry, globals, test)`: card, teaser, then credits. `closingCardLines` (conditions, order, cap of 5), `teaserLines` (only while `globals[enabledBy]`, default `teaser_enabled`), `expandCredits` (`section` blocks with `people` and `lines`; heading dropped when nothing prints), `cardHoldMs`. No imports. |
| `public/break_escape/js/music/scenario-music-events.js` | 22, 89-92, 108-109, 131-139 | Uses `buildEndSequence` instead of the inline filter; an entry with only `closingCard` also counts as an ending. Plain lines come out exactly as before. |
| `public/break_escape/js/music/bond-visualiser.js` | 27, 1241-1243, 1278, 1304-1322 | `card` and `teaser` styles; an item with `lines` is drawn as rows together and held for `cardHoldMs(n)` (2.5 s + 1.5 s a line). |

### Scenario format

On a music event entry, next to `credits`:

```json
"closingCard": {
  "lines": [
    { "text": "The grid stayed up.", "condition": "globalVars.grid_saved" },
    { "text": "Nobody outside the room will hear about it." }
  ],
  "teaser": { "enabledBy": "teaser_enabled", "lines": [{ "text": "Somewhere, a phone rings." }] }
},
"credits": [
  { "text": "MISSION COMPLETE", "style": "title" },
  { "section": "IN THIS OPERATION", "people": [
    { "name": "AGENT HAX", "clauses": [
      { "text": "Put on the floor by her own agent.", "condition": "globalVars.hax_ko", "style": "warning" },
      { "text": "On the line to the end." } ] } ] },
  { "section": "ELSEWHERE", "lines": [
    { "text": "THE ARCHITECT: At large.", "condition": "!globalVars.architect_caught", "style": "warning" } ] }
]
```

Card: lines that hold, in order, first 5. Teaser: off unless the named global is truthy. People: `NAME: clause` from the first clause that holds. All strings fixed; conditions only choose between them.

## Tests

New: `test/js/finale-forced-call-and-closing-card.test.mjs` (17 tests) with fixture `test/js/fixtures/forced_call.ink` / `.json`. It covers Esc and the back arrow, the five end-of-story releases, the hit closing a forced call only, the toast guard, re-ring on `conversation_closed` (knot first, no knot once a story is saved, silent once done), re-ring on `room_exited`, a mapping without `resume` unchanged, `timedConversation.disableClose`, a real ink restore landing on the second question, `otherSpeaker`, the card cap and order, teaser on/off, people/lines/empty sections, plain lines identical to the old filter, and the wiring.

```
$ node --test test/js/finale-forced-call-and-closing-card.test.mjs
ok 1 - Esc on a forced call does nothing; otherwise back from a thread, close from the list
...
ok 17 - wiring: music events build the sequence; the visualiser draws card lines together
# pass 17
# fail 0

$ node --test test/js/        (Node 18.19.1)
not ok 23 - test/js/engine-fixes-round4.test.mjs
# tests 876
# pass 875
# fail 1
```

The one failure is the known Node 18 runner error ("Unable to deserialize cloned data") in a quarantined file (SE_BUILD_LOG P0-A); it passes alone (`# pass 4 # fail 0`). An earlier full run had `engine-fixes-pass3` fail the same way; it passes alone (6/6).

```
$ bin/rails test
675 runs, 2289 assertions, 0 failures, 0 errors, 1 skips

$ node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json
Total problems: 0

$ ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --skip-ink --no-graph
m01 exit 0, 0 errors, 13 warnings   m02 exit 0, 0 errors, 26 warnings
m03 exit 0, 0 errors,  3 warnings   m04 exit 0, 0 errors, 15 warnings
m05 exit 0, 0 errors, 15 warnings   m06 exit 0, 0 errors, 25 warnings
m07 exit 0, 0 errors, 19 warnings   m08 exit 0, 0 errors,  3 warnings
test_finale_calls_credits exit 0, 0 errors, 2 warnings (no conclusionScreen; timedConversation delay 2000, both deliberate)
```

The m01-m08 warning counts are the same before and after my changes (none of those files was touched).

## Browser checks

Keyless server on :3001, headless Chromium via the playtest harness, 1400x1000. Trial scenario `scenarios/test_finale_calls_credits/` (registered as mission 81). Screenshots in the session scratchpad, `.../scratchpad/f14/`; I looked at each.

- **Game 2831, forced call.** The call opens 2 s in. No x, no Close, no back arrow; Esc (keydown) twice and the bridge's `close()` leave it open on the conversation (`01-forced-call-after-esc.png`). The Director's line is drawn under his name in HaX's thread. A text from the Director arrives as a toast over the call; clicking it leaves HaX's call open (`03-bark-over-call.png`). After answering the first question, `playerHealth.damage(10)` closes the call ("You were attacked!"); 500 ms later it rings again with `startKnot: null` and `disableClose: true`, the thread shows the four earlier lines once each, and the only choice is "Roll the credits." (`04-reringed-resumed.png`).
- **Game 2832, teaser on** (`--set teaser_enabled=true`, "I trust you."). Sampled once a second: the card's five lines together (the sixth line that holds is dropped), then "Somewhere, a phone rings.", then MISSION COMPLETE, the subtitle, IN THIS OPERATION, the HaX clause, the Director's clause, ELSEWHERE, THE ARCHITECT. The NEVER SHOWN section did not print. Card screenshot `05-card.png`; teaser style `09-teaser.png`.
- **Game 2833, teaser off** ("Make it quick."). The card shows "You kept it short with HaX."; no teaser; HaX's line is "AGENT HAX: Kept at arm's length." in the warning style (`08-hax-clause-warning.png`).
- **m07 (game 2834) and m08 (game 2835) endings.** In the page, for each credits event, the new builder's output was compared with the old inline filter under the same globals: identical (m07 25 lines; m08 24 lines on both its triggers). Then the real path was run: the conclude POST stubbed as accepted (both missions have `concludeRequires` that a fresh game can't meet), the first credits trigger emitted, and the visualiser opened on MISSION COMPLETE with the usual overlay (`10-ending-2834.png`, `10-ending-2835.png`).

All five harness sessions were quit; no browsers left running. The :3000 server was not touched.

## Limits

- `resume` restores whatever HaX's saved story is. If the player has talked to the same contact about something else between the call and the re-ring, the restore puts them there, not in the call. In practice a forced call can't be left for the hub, but a non-forced call can.
- A re-ring, like every conversation mapping, ends whatever minigame is open when it fires. In the trial it replaced the Mission Brief popup that follows the opening call (the brief did not come back). Put the forced call after the brief, or trigger the re-ring on something other than the close when that matters.
- A forced call can still be left through the hit-close (deliberate) and a page reload. After a reload the mapping fires on its next event; there is nothing that re-rings on load by itself. A `game_loaded` mapping with the same condition would do that.
- The second-speaker label applies to the phone's drawn thread only. Toasts, the notepad export and stored history keep the `Name:` prefix. The toast for a contact's own timed text also still shows its own name prefix (existing behaviour, not touched).
- The card and credits are chosen once, when the event fires; nothing re-evaluates them. Conditions are JavaScript (`new Function`), as credits always were.
- The validator doesn't know `closingCard`, `section`, `people` or `lines` yet. It doesn't complain about them either (its credits checks skip items without `text`), so a typo in those keys goes unreported. Adding schema checks would mean editing `validate_scenario.rb`, which another agent is changing heavily; left for later.
- README lines I noticed but didn't change: the event-mapping `targetKnot` row and the phone rule "targetKnot in event mappings does not work after first conversation" look out of date (an explicit knot now restores the saved story and then jumps), but checking every mapping path for that claim was outside this task.
