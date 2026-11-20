# Phone-chat tag-processing fix — verification report

Verifies the uncommitted change to
`public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js`
(hoisting `processGameActionTags(...)` above the typing-animation loop in both
the continue path and the choice path, ~line 697 and ~line 827). **No source
file was modified during this run** — this is playtest verification only.

Session log: `tools/playtest/tagfix-session.jsonl` (both m01 and m02 runs
logged to the same file — cite the line ranges below, not the embedded
per-drain `seq`, which resets each session and each `drain`).

Games: m01 GAME_ID=1018 (http://127.0.0.1:3000/break_escape/games/1018),
m02 GAME_ID=1020 (http://127.0.0.1:3000/break_escape/games/1020). Both fresh,
`resume:"new"`. Driven with `--speed fast --headless`.

## How mid-typeout close was achieved

`mg action:"chooseMatching"` (or `pressKey`) returns as soon as the click/key
lands — it does not wait for the phone-chat typing animation to finish.
`mg action:"close"` sent as the very next command therefore races the
animation. Per `phone-chat-minigame.js`, each accumulated NPC message costs
`TYPING_DELAY_MS` (1000ms) + `INTER_MESSAGE_MS` (400ms) before the next
message starts, so a two-message knot's typing loop runs ~2.4-2.8s. In both
runs below, `give_item`'s effect (an `item_picked_up:*` event) landed within
~50-100ms of the choice — i.e. immediately, before the typing loop had even
displayed the first message — and the `close` action's own completion was
recorded ~2.5-2.7s later, i.e. while that loop was still in flight. So the
close in each case genuinely lands mid-typeout; it just no longer matters,
because the fix has already applied the tag by the time close is possible.

This is the reliable technique for future runs: **send the choice, then
send `close` as the immediate next command; do not wait or poll in between.**

## 1. Tags land on early close

### m01 (Agent 0x99 / "Agent HaX") — session log lines 88-107

- Earned `lockpicking_guide_offered` in-game first: talked to Sarah O'Brien
  (reception) → got Main Office Key; found Kevin's "Out of Office Note" in
  `kevin_office` (states PIN 2468) → unlocked `it_room` with that PIN →
  talked to Kevin Park, who gave the Lock Pick Kit, which fires
  `item_picked_up:lockpick` → sets `lockpicking_guide_offered = true`
  (confirmed via `waitFor global lockpicking_guide_offered` → `true`).
- Opened phone (`interactInventory("phone")`), selected Agent HaX contact,
  chose **"Send me the lockpicking field guide"** (line 88), then
  **immediately** sent `mg close` (line 90).
- `drain` (lines 94-95) shows: choice registered → `lockpicking_guide_hint_given`
  set → **`item_picked_up:lab-workstation` fires** (the field guide) →
  `minigame_failed` (the close) recorded ~2.5s later. Post-hoc `eval` of
  `getState().inventory` (line 96 onward, result at line 107) confirms
  `"SAFETYNET Field Guide: Lockpicking"` present.
- **PASS.** Under the old code (tags processed after the animation loop,
  behind the `!isConversationActive` early return) this item would never
  have been given.

### m02 (Agent 0x99 / "Agent HaX") — session log lines 141-154

- `lockpicking_guide_offered` is set true automatically on
  `conversation_closed:opening_briefing_cutscene` in m02, so no extra setup
  was needed beyond bootstrap.
- Opened phone, reached the support hub, chose **"Can you send me the
  lockpicking field guide?"** (line 147), then **immediately** `mg close`
  (line 149).
- `drain` (lines 153-154) shows the same shape as m01: choice → almost
  immediate `item_picked_up:lab-workstation` → close recorded ~2.6s later.
  Post-close inventory (confirmed at line 164 drain, and directly via `eval`)
  includes `"SAFETYNET Field Guide: Lockpicking"`.
- **PASS.**

## 2. No double-fire on reopen (the most important check)

For both m01 (lines 96-107) and m02 (lines 155-164) the same conversation was
reopened immediately after the early close described above.

Observed in both: the **transcript visually duplicates** the give_item
knot's two messages ("I've uploaded the lockpicking field guide..." /
"Covers pin tumbler..." in m01; "Lockpicking guide uploaded..." / "Light
tension..." in m02) — this is the pre-existing transcript-duplication
behaviour the task description flagged as a risk.

Despite that, in both cases:
- `getState().inventory` still shows exactly **one** `lab-workstation` item
  (m01: confirmed at line 107 area; m02: confirmed at line 164 area,
  `.filter(i=>i.type==="lab-workstation").length === 1`).
- `drain` after the reopen (m01 lines 106-107; m02 lines 163-164) shows
  **no second `item_picked_up:lab-workstation` event** — only a batch of
  `global_variable_changed:*` resync events (Ink variable resync on
  conversation reopen) and, in m02, `lockpicking_guide_requested:true`
  changing `oldValue:true → true` (a no-op re-write, not a re-fire).

**No double-fire in either mission.** The visual transcript duplication is a
separate, pre-existing display bug and does not re-run `give_item`.

## 3. Farewell text after `#exit_conversation` still plays

### m01 — support_hub "I'm good for now" (line 133-134 of the ink)

Chose "I'm good for now" (line 114), `mg getState` polled immediately after
returned `no-active-minigame` — the short one-line farewell typed out and
auto-closed within the round-trip. Reopening the conversation and reading
the transcript (lines 122 onward) shows **"Copy that. Call anytime."**
present in full. **Not cut off. PASS.**

### m02 — support_hub "I'm good for now" (`m02_phone_agent0x99.ink` line
200-202, tag *after* the text here rather than before, but same knot shape)

Chose "I'm good for now" (line 171); reading state immediately after showed
the minigame still open with the line not yet rendered (`dialogue.ended:true`
but no farewell text yet) — this is genuinely mid-typeout. Waited for
`minigameClosed` (line 173), then reopened the conversation and read the
transcript: **"Agent HaX: Copy that. Call anytime, Agent."** present in full
(line 181 area). **PASS.**

## 4. Normal play (full conversation to completion) — no regression

m02, Bernie Nwosu (`receptionist`) at reception: ran `converse` to full
exhaustion (57 turns, `exhaustedBranches:false` only because it hit the
sensible per-branch cap, not an error — see session log around line 187 and
onward). No `ok:false`, no stuck minigame, no missing tag effects — Bernie's
dialogue reward (IT Department Override Key) landed in inventory normally.
Conversation closed cleanly (`closed.alreadyClosed:true`). **PASS — normal
play is unaffected by the fix.**

## Verifier output

```
$ BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 1018
game            1018  (mission 32)
created         2026-09-10 00:25:14 UTC
last write      2026-09-10 00:33:20 UTC
played for      486s of wall clock
current room    "reception_area"
unlocked rooms  5: reception_area, main_office_area, hallway_west, kevin_office, it_room
unlocked objs   0:
inventory       9: Your Phone, Notepad, Visitor Badge, Main Office Key, Out of Office Note, Lock Pick Kit, Server Room Keycard, Lock Pick Instructions, SAFETYNET Field Guide: Lockpicking
NPCs met        5: briefing_cutscene, sarah_martinez, agent_0x99, closing_debrief_person, kevin_park
flags submitted 0:
globals set     12: briefing_played, confrontation_approach, current_task, final_choice, kevin_choice, lockpicking_guide_hint_given, lockpicking_guide_offered, lockpicking_guide_requested:true, maya_identity_protected, player_name, security_audit_completed, talked_to_kevin

VERDICT: progress recorded — 4 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

```
$ BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 1020
game            1020  (mission 46)
created         2026-09-10 00:25:32 UTC
last write      2026-09-10 00:38:57 UTC
played for      805s of wall clock
current room    "reception_lobby"
unlocked rooms  1: reception_lobby
unlocked objs   0:
inventory       5: Your Phone, Lock Pick Kit, Notepad, SAFETYNET Field Guide: Lockpicking, IT Department Override Key
NPCs met        7: opening_briefing_cutscene, director_netherton, agent_nightshade, receptionist, agent_0x99, ghost, closing_debrief_trigger
flags submitted 0:
globals set     10: backup_recovery_source, bernie_gave_key, bernie_trusts_player, briefing_played, lockpicking_guide_offered, lockpicking_guide_requested:true, patient_bed2_state, patient_bed4_state, player_name, ransomware_deployed

VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted.
Nothing here could only have come from playing: the player never left
the starting room, opened anything, or submitted a flag. Globals and
encountered NPCs are set by mission setup and the opening cutscene, so
they are not evidence. A report claiming steps is unsupported.
```

**Read the m02 verdict plainly: BOOTSTRAP ONLY, by the verifier's own
room/object/flag heuristic.** The m02 run never left `reception_lobby` — all
of the tag-fix evidence for m02 (item given, no double-fire, farewell text)
came from phone conversations and one NPC conversation, none of which the
verifier's heuristic counts as progress. That heuristic exists to catch
reports that never actually played; it is not wrong here, but it doesn't
capture what this run was testing. The actual evidence for m02 is the session
log lines cited above (`item_picked_up:lab-workstation`, `bernie_gave_key`,
the "IT Department Override Key" in the verifier's own inventory listing)
and the `getState()`/`drain()` reads taken during the session — not the
verdict line. The m01 run separately clears the verifier's own bar
(4 rooms beyond the first).

## Summary

| Check | m01 | m02 |
|---|---|---|
| Tags land on early close | PASS | PASS |
| No double-fire on reopen | PASS | PASS |
| Farewell text after `#exit_conversation` survives | PASS | PASS |
| Normal play unaffected | not separately re-run (m01 already exercised many normal give_item/complete_task tags via Kevin conversation without early closes) | PASS (Bernie conversation run to full exhaustion) |

No blocked/assisted steps were needed for this test (no lockpicking or
combat was exercised on the critical path here). No `debugKO` was used.

Game IDs: **1018** (m01, verdict: progress recorded) and **1020** (m02,
verdict: BOOTSTRAP ONLY by room-count heuristic, but see above — the
tag-fix-specific evidence for m02 is real and cited by session-log line).
