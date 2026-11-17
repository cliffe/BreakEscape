# Review: A5 round 1 (outgoing calls and the post-call thread)

Reviewer: Opus, 2026-11-12. Commits d31b55ce0, 83e92eae0, 589ad5e77, f74018e63, 53ca95679 on `build/phone-calls`. Read against plan 2.3 row 31, 2.5, 2.11, 3.2, 3.3, 4.2, 6 "A5", 8; `HANDOVER_A5.md`, `proofs/A5/README.md`. Live probes on a keyless :3025 server from a detached temp worktree at 53ca95679 (removed; server stopped).

**Verdict: fix round.** One major (a reload during a call leaves the thread on the call's choices, as silent text), four minor, six nits. The engine path the writers' ink depends on works by reading for both traced beats. Tests catch regressions (20 of 20 mutations killed), key identity holds, and the lab is unchanged.

## Major

**M1. A reload during a call leaves the thread inside the call.** The call's minigame saves `npc.storyState` on every step (`_saveStoryStateFor` after `makeChoice`, and at the end of `_presentOutput`), and the open on the entry's knot moves `npc.currentKnot` to the call knot (`phone-chat-conversation.js:202`). Both are synced. The only place the story goes back home is `_resetAfterRingerCall`, which runs when the call ends in the page, so a reload skips it. `syncSave` never saves an outgoing call, so nothing after the reload knows a call was on.

Live probe (`test_phone_calls`, game 1854): open `desk_contact`, press Call, connect (choices "Keep talking." / "Goodbye."), `stateSync.sync()`, reload. Result after the reload: `currentKnot: "desk_call"`, no row, and opening the thread shows "Desk line. Go ahead." as a text with **"1. Keep talking." / "2. Goodbye."** as silent text choices. In a mission this means m01's `[On my way]` (with `#ending_check` and `start_debrief_cutscene`) offered as a text, m05 Patricia's whole call (naming Torres, the authorisations) played on as silent text, and m08's door-audit read with no voice.

The same happens for an **incoming** call (A4 row 27, checked for the fix scope only; game 1856): `caller_thread` answered, reload, "Missed call" row written, but `currentKnot: "ring_call"` and the thread shows the call's "Keep talking." / "Goodbye.". A4's `reload_connected` proof did not open the thread afterwards. Tell the A4 reviewer; one fix should cover both.

Fix (one of): (a) while a ringer call is open, keep the thread's saved position as it was at the dial or answer (the home state `_pressCall` and `_placeCallFromTags` already save) and don't write the call's mid-call state or `currentKnot` to what is synced; or (b) on load, when the restored story's current choices come from the contact's call-knot set (`voicedCallKnots(..., callStartKnots(npc), callHomeKnot(npc))`) and no forced call is being resumed for that contact, move it to the home knot as `_resetAfterRingerCall` does, and put `currentKnot` back to `homeKnot`. A forced call resumed with `resume` (row 26/27) must keep its position, so (b) has to skip contacts with a restored forced slot. Proof: this probe for an outgoing call and for an incoming one, the thread after the reload on its hub with no call choices; plus a reload during a forced call that still resumes on its choice. Decide whether an outgoing call cut by a reload leaves a row (today: none).

## Minor

**m1. m01's line-level `#ending_check` has not been run inside a ringer call.** Every A5 proof and test uses the bracket form (`[Yes, close it. #ending_check]`, `desk_contact.ink:44`). m01's `closing_debrief` (writing branch `m01_phone_agent0x99.ink:989-994`) puts `#ending_check` and `#set_global:start_debrief_cutscene:true` on their own lines above the last line, so they ride the text line through `_applyLineTags` (asynchronous `processGameActionTags`, which skips `set_global` on "Keep going"), while `handleChoice` awaits the same question in `_endingKeptGoing`. By reading it works: on "End the mission now" the `set_global` continuation runs first, the debrief mapping queues behind the call (busy rule), the line types and `#exit_conversation` closes; on "Keep going" the line and tags are dropped, the story is at `-> END`, and the call closes through the story-end branch with the hub choice still there (plan M8). But the order depends on two awaits on one promise. Add a line-level variant to `test_phone_calls` (a second choice on `extract_call`) and prove both answers live now, not first in M8.

**m2. The header button is drawn only when a thread opens.** `_refreshCallButton` runs in `openConversation` only. With m03's `{ knot: "m2_revelation_call", when: ..., unavailable: "hidden" }`, the button does not appear when `flag_distcc_submitted` turns true while HaX's thread is open. The reverse case: a button whose entry has since become hidden still shows, and pressing it calls `placeCall`, which picks nothing and returns false, so nothing happens and nothing is shown. Refresh on `global_variable_changed` while a thread is open (or at least on press, hiding the button when nothing applies).

**m3. The dial screen has no caption.** Plan 2.5: "The call screen shows 'Calling…', the caption and End". `placed_ringout_calling.png` shows the name, "Calling..." and End, no "Voice call" / `callLabel` (m04 Vance's "Albion ops desk"). The connected screen has it.

**m4. Nothing yet checks `#place_call:<knot>` against the contact's `call` entries.** The validator has no `place_call` rule (A7 is not done). If the writers' ink merges without its config, `_placeCallFromTags` finds no entry, `placeCall` returns false, and the "could not dial" branch puts the same hub back. The bring-in choice then does nothing, with no warning, and it is the only way out of m01 and m03–m06. Until A7 lands, each M slice should check by hand that every `#place_call:<knot>` in the mission names a `call` entry (list in "Writers' ink" below), or A7's rule should come before the first M merge.

## Nits

- **n1.** `phone-chat-minigame.js` `closeConversation()`: the comment "a second End or Esc during the 'Call ended' beat" now trails the `_stopDial` line; it belongs to the `_callEndedPending` return above.
- **n2.** `proofs/A5/ending_end.log` prints `credits=false` while `ending_end_credits.png` shows the credits. The check runs before the screen comes up; wait for it, or drop the field.
- **n3.** End during the dial (before the connect) leaves no row. The plan is silent on this. A real handset logs a cancelled or outgoing call; decide and note it.
- **n4.** The `#place_call` choice text goes into the thread as a sent message before the dial ("Place the call from here." in `placed_ringout_thread_on_hub.png`). For m01 that is "Operation Shatter resolved — I'm ready for debrief" as a text, then the call. That's acceptable, but writers should know the bracket text is kept.
- **n5.** A step with `#place_call` that cannot dial (inside a call, locked phone, no ringer) and no lines skips the early branch and ends through the later story-end branch. The only difference is the missing "Conversation ended" toast.
- **n6.** `HANDOVER_A5.md` "Gotchas" is right about the double `conversation_closed`; the README's wording "the thread's follows at its real close" is right too. No change needed, listed so the validator rule (item 3) cites it.

## 1. Work and accept list

| Item | Code | Proof | Result |
|---|---|---|---|
| `call` entries, one or a list; button picks (callback, first `button` not false whose `when` holds, ring-out, hidden) | `phone-ring-config.js` `pickButtonCall` / `pickPlacedCall` | unit; `away` (hidden_contact has no button until `lever_back`) | holds |
| Header button, not for `callId`, `disableClose`, a call screen, another phone | `phone-ringer-dom.js` `callButtonFor` | unit; `desk`, lab contact list unchanged | holds (m2) |
| `#place_call` / `#place_call:<knot>` after the lines, before exit and story-end, both paths | `_presentOutput` `:943`, `handleChoice` `:1305`; early branch `:882` | unit (incl. real paths, test 800); `placed_ringout` | holds |
| Dial, connect, no answer, "No answer" row, back to the thread | `_runDial`, `_ringOut`, ringer `finishCall` outgoing branch | `desk`, `away`, `placed_ringout` | holds |
| Ring-back through master × notifications volume | `phone-dial.js` | unit | holds |
| "Call ended", return to the phone, End mid-choice then reopen | A2b paths, `_stopDial` | `desk` (rows "Outgoing call, 0:03"/"0:04", hub on reopen, VAR carried to the second call) | holds |
| Terminal-look endings | `_runDial` no screen | unit only | see item 5 |
| Row 31 | `outgoingConnected` | `row31` (q 1 then 0, no row, no event, no second ring) | holds; forced (`keep`) offers are kept, which the plan does not say; reasonable |
| `callStartKnots` / `call_start_knots` | `phone-chat-speaker.js`, `tts_line_extractor.rb` | parity test, key dump | holds |
| Placed `caller_debrief` hand-off | busy rule + reopen blocked | `debrief` | holds |
| `#ending_check` in a placed call, both answers | | `ending_keep`, `ending_end` | holds for the bracket form (m1) |
| Key identity, lab SE screenshots | | rerun below | holds |

**The early story-end change is safe for every existing phone chat.** It only matters for a step whose tags include `place_call` (regex `^place_call(?:\s*:\s*(\S+))?$`, case-insensitive). At 53ca95679 the only inks carrying it are `test_phone_calls` `away_contact`, `caller_debrief` and `desk_contact`; no mission, lab or sis ink does. If the tag is there but the dial is refused, the step falls to the later story-end branch, which does the same apart from the toast (n5).

## 2. Writers' ink against the engine

The `#place_call` users on `build/phone-calls-writing` are HaX only: m01 `:146` `closing_debrief`, m03 `:116`/`:121`, m04 `:146`/`:150`, m05 `:186`/`:220`, m06 `:162`/`:174`, m07 `:229`, m08 `:93`. **Vance (m04), the Recruiter and Patricia (m05) do not use `#place_call`.** They are header-button contacts; Vance's and Patricia's inks only mention the tag in comments. Every use is the one form (tag on its own line, then `-> DONE`), and every knot named matches a `call` entry in `WRITER_HAX_CALLS.md`'s config list.

**m01 `closing_debrief`** (config: `agent_0x99` `call: [{ knot: "closing_debrief", button: false }]`; home knot is the scenario's `currentKnot` `first_call`).
1. Hub choice `[Operation Shatter resolved — I'm ready for debrief]` → after-choice path. `makeChoice` gives no text, tags `[place_call:closing_debrief]`, story ended (`-> DONE`). Nothing is typed; the choice text goes into the thread as the player's bubble (n4).
2. `_placeCallFromTags`: the story has ended, so it moves to `first_call` (a tag line and `-> support_hub`, no text) and settles. It is saved, then `placeCall(knot)` → `pickPlacedCall` → `connect` (no `when`) → `dial`: the phone is put aside with `_closingForCall`, and the call opens with `startKnot: closing_debrief`.
3. After `DIAL_MS` it connects, restores the story and goes to `closing_debrief`: the outcome opener (V), then `[On my way]`. `callStartKnots` includes `closing_debrief`; the voiced walk is `closing_debrief` → END.
4. `[On my way]`: line-level `#ending_check` / `#set_global` on "Walk out the way you came in…" (V), then `#exit_conversation`, `-> END`. "End the mission now": `start_debrief_cutscene` set; the person-chat mapping (`scenario.json.erb:1116-1124`, `onceOnly`, `disableClose`) queues behind the call; the line is typed and voiced; `_exitRingerCall` resets to `first_call`; row 25 sees the queue and doesn't reopen; `dropDisplaced` owes `conversation_closed:agent_0x99` (second fire; no mapping listens); the debrief opens. "Keep going": the line and tags are dropped, the story is ended, and the call closes through the story-end branch after the forced-call gap with "Call ended". It is back on `first_call`, so the hub choice is there again. This matches plan M8; m1 asks for it to be run.
5. No mismatch found. `-> END` (not `-> DONE`) is what the 7.2 m01 row asks for and is handled by the reset (`ended` covers both).

**m05 Patricia** (config: `patricia_phone` `call: { knot: "phone_call", when: "globalVars.patricia_phone_available && !globalVars.patricia_ko", unavailable: "no_answer" }`; home `start`).
1. Thread by hand: `start` is a silent stub with `[(Close.)]` (`#exit_conversation -> start`), so nothing is preloaded and the text intro shows. `callButtonFor` shows "Call" whenever she has the entry (no_answer keeps it visible).
2. Press: `when` false gives "Calling…", ring-out, "No answer", a row, and back to the thread. `when` true: connect on `phone_call` → state opener (V) → `-> hub` (choices only). The voiced walk covers `phone_call`, `hub`, `not_yet`, `no_answer` and every `phone_*` knot; nothing diverts to `start`.
3. Topic choices loop back to `hub` mid-call. Every ending (`[Just checking in.]`, `[That's all for now.]`, wrong names and reasons, Halloran, `[On my way.]`, `[Understood.]`) is `#exit_conversation` then `-> DONE`: `_exitRingerCall`, reset to `start`, and the phone reopens on her thread.
4. `{patricia_ko: -> no_answer}` / `{not patricia_phone_available: -> not_yet}` mid-call give a step with no lines and `#exit_conversation`. That takes the early story-end branch and the call closes after the gap with "Call ended" and no line. It can only happen if she becomes unreachable mid-call, so it's acceptable.
5. `#speaker:patricia_morgan` is not a speaker change on either side (the server's `speaker_from_tags` and the client's `phoneLineVoice` both voice as `patricia_phone`), so the lines use her phone voice. No mismatch.
6. Exposed by M1: a reload mid-call gives her hub as silent text.

**Other forms checked by reading.** m03–m06 use the bracket `[On my way. #ending_check]` (proven form). m05 `extract_call`'s `{not all_flags_in(): … #exit_conversation -> DONE}` guard is a step with lines and an exit, which closes on the continue path at once. m07 `bring_me_in` has no ending check. `#ending_check` inside a placed call is fine in both forms by reading (m1 for the line-level one). The hand-off to an in-person debrief works through the busy rule (plan 2.9), as `debrief` proves.

## 3. `conversation_closed` twice

The second fire happens only when the call's contact is the thread the phone was on and the phone is not reopened. No m01–m10 mission has `call` or `ring` config on either branch yet, so the list below covers every mapping on a contact that 7.2 will give `call` or `ring` (m01/m03/m04/m07/m08 `agent_0x99`, m04 `robert_vance_phone`, m05 `recruiter`/`patricia_phone`/`agent_0x99_handler`, m06 `agent_0x99_handler`, m07 `the_architect`, m09 `nightshade_phone`/`torres_phone`/`gary_phone`), from `eventPattern`, music `trigger` and `waitForEvent`:

| Mission | Mapping | Guard | Runs twice? |
|---|---|---|---|
| m05 (both branches) | Recruiter's `conversation_closed:patricia_phone` (`scenario.json.erb:1522-1530`, ERB loop) | `onceOnly`, condition `recruiter_texted !== true`, `setGlobal recruiter_texted` | no |
| m05 (both branches) | Recruiter's `conversation_closed:agent_0x99_handler` (same loop) | same | no |

Nothing else. m01, m03, m04, m06, m07 and m08 have no mapping on those contacts (m04's are on the in-person `robert_vance`). m09's `conversation_closed:agent_0x99` (re-ring `call_map`s with `cooldown: 0`, and a `text_map` with `onceOnly`) and m10's `conversation_closed:agent_0x99` (`:2411`, `onceOnly`) are on contacts that keep their legacy calls. They never see the double fire, so the proposed validator warning would flag none of them. The only one it could ever flag is the M5 config that turns the Recruiter's three text mappings into `ring` mappings (`WRITER_CALLERS.md` M5). It must keep `onceOnly` and the `recruiter_texted` guard. Separately for M5: the HaX bring-in call's close is one of those triggers, so the Recruiter's first ring can be offered at the debrief hand-off. Consider adding `!globalVars.mission_complete` (or the debrief global) to its condition.

## 4. TTS

- Parity: `callStartKnots` and `call_start_knots` both add every entry's knot, `button: false` included, trimmed and stitch-stripped; one entry or a list. `phone-call-knots-parity.test.mjs` passes (9); mutation M19 (client skips `call` entries) is caught.
- Key identity, rerun: `tools/phone_calls/dump_tts_keys.rb` with `TTS_DUMP_CHATTER=1 TTS_DUMP_LABELS=1` at 56a9e74b2 (A5 start) and at 53ca95679. Every scenario's keys match byte for byte except `test_phone_calls`: +8, −0 (`desk_contact` 6, `away_contact` 1, `hidden_contact` 1). Against `keys_baseline_a1/`, only `m09` and `m10` (and `_index`) differ, from the M3 commits, as the README says.

## 5. Tests and live coverage

Tests at 53ca95679: `phone-outgoing-call` 50, `phone-outgoing-ringer` 14, `phone-outgoing-dom` 11, `phone-outgoing-ui` 6, `phone-call-knots-parity` 9, all pass. Mutations, one at a time, across those five files: **20 of 20 killed.** They were: early story-end branch ignores `place_call`; after-choice and continue paths each drop the check; the ended story not moved home; `#place_call` allowed inside a call; dial ignores `when`; ring-out without `_noAnswer`; could-not-dial leaves no choices; button entries include `button: false`; placed callback match ignored; row 31 drops other knots' offers, or nothing; outgoing call saved as pending; `no_answer` row lost; outgoing reopens when not own; ringing offer not requeued at dial; `callId` contact callable; outgoing moves `currentKnot` at open; `callStartKnots` skips `call`; button on a `disableClose` phone. The Rails extractor test was not rerun (the key dump covers the same output).

Not shown live:
- **Terminal-look dial**: no live proof needed now. No planned contact with a terminal theme gets a `call` entry (m07's Architect only rings), and the unit test covers connect-or-give-up at once. Require a live run if one ever does.
- **Bare `#place_call`**: no live proof needed. No writer ink uses it (all name a knot), and the unit tests cover it through `pickButtonCall`. If A7 keeps the form, its validator rule needs a test.
- What does need live proof: the line-level `#ending_check` (m1) and the M1 fix.

## 6. Lab SE

Unchanged. `proofs/A5/se_dev/`: `sha256_noseed` for `dev_service_desk` and `ruth_phone` after the reload equal A3's (the seeded hash differs, as expected). `/tts` texts are the same. `se_phone_contacts.png` and `se_dev_thread.png` are 0 pixels different from A0, and `dm_list.png` is 0 different from A3. In the code, the lab has no `place_call`, Dev has `callId` (`callButtonFor` and `placeCall` refuse), and Ruth has no `call` entry, so no button is shown.
