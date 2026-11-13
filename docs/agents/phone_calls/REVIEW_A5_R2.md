# Review: A5 round 2 (the R1 fixes)

Reviewer: Opus, 2026-11-12. Reviewed at `2f2065eea`. Read against `REVIEW_A5_R1.md`, `REVIEW_A5_R1_OUTCOMES.md`, `HANDOVER_A5.md`, `HANDOVER_A6.md` (A5 R1 M1), and commits `776293f99` (m1 to m3, n1) and `9ca867ac2` (proofs, outcomes). No live run: the R1 outcomes carry live proofs for m1 to m3 (`proofs/A5_r1/`) and A6 carries the M1 ones, and nothing here needed a browser.

**Verdict: accept.** Nothing above a nit. M1 and m1 to m4 are fixed, and the fixes broke nothing I could find. Two nits, both test gaps.

## Checks

### M1: a reload during a call leaves the thread inside the call (fixed in A6)

- `NPCManager._resumeCallState` runs `_resumePendingCall`, then `_resumeMidCallStory` unless a forced call that was on the line (not `queued`) sits on the thread's own knot (A6 R1 m3). `_resumeMidCallStory` puts `currentKnot` and `lastEnteredKnot` back to `homeKnot` when `currentKnot` is one of `_ringerCallKnots` (`call` entries, `ring` mappings, a `ring` timed conversation; never a legacy voiced or video call), and `PhoneChatConversation.resetToHome` moves the saved story home. That is option (b) from R1, with the forced-call skip R1 asked for. It runs once per contact (`_midCallChecked`), including contacts registered after `game_loaded`.
- **Beside a held voicemail on the same reload:** both are asynchronous and both write `npc.storyState`. `currentKnot` is set home synchronously before either loads. If the voicemail writes first, `resetToHome` sees `storyState` changed and stops, and the voicemail's own `goToKnot(home)` has already left the story home. If the reset writes first, the voicemail restores the homed story. Either order ends on the home knot with the voicemail's VARs.
- Decision recorded in plan 9.1 (A6 R1 outcomes): an outgoing call cut by a reload leaves no row. An incoming one keeps "Missed call".
- Tests: the five M1 and three m3 tests in `phone-callback-dom` pass. Mutations K11 (the mid-call reset skipped) and K12 (the reset ignores whether the knot is a call knot) are killed.

### m1: line-level `#ending_check`

`desk_contact` gained `extract_line_call` (m01's `closing_debrief` shape: `#ending_check` and `#set_global:end_go:true` on their own lines above the last line, `#exit_conversation`, `-> END`), listed as a `call` entry with `button: false`, and compiled into `desk_contact.json`. Both answers are proven live in `proofs/A5_r1/line_end*` and `line_keep*`. No engine change, so nothing else can have moved.

### m2: the Call button follows the entries

- `_watchCallButton` adds one `global_variable_changed:*` listener per phone instance (the dispatcher supports prefix wildcards: `npc-events.js` `emit`). It skips the contact list (`currentNPCId` null), a closing thread, an inactive phone and a phone with no conversation, and is removed in `cleanup`. `when` conditions can only read `globalVars.*` (`safeEvaluateCondition`), so a global change is the only thing that can turn an entry on or off. A pending callback changing is refreshed separately by `phone-ringer-dom.js:418`.
- On a call screen (`ringerCall`) the watcher still runs, but `_refreshCallButton` passes null, so it only re-hides a button that is not drawn. During a dial (`conversation` null) it does nothing.
- `_pressCall` now refreshes when `placeCall` returns false, so a stale button goes. `placeCall` returns a boolean (`result === 'dialling'`), never a promise, so the check is sound.
- K9 (no refresh on a failed press) is killed. K7 and K8 survive: see n-1.

### m3: dial caption

`setCallStatus('calling')` no longer writes "Calling…" into the caption, so the label `showConversation` set (entry's `callLabel`, the contact's, else "Voice call") stays and the bar reads CALLING. `noanswer` still writes "No answer". An incoming call never goes through `calling`. K10 (the old overwrite back) is killed by `phone-outgoing-ui`.

### m4: `#place_call` against `call` entries

Not in these commits, but landed: `scripts/validate_phone_calls.rb` `place_call_checks`.

### n1 to n6

n1 (comment moved) is right. n2, n3, n5 and n6 are decisions or no-change items, recorded in the outcomes. n4 is a note for the writers.

## Tests and mutations

At `2f2065eea`: `phone-call-button-refresh` 3/3, `phone-outgoing-ui` 7/7, `phone-outgoing-call` 50/50, `phone-outgoing-ringer` 14/14, `phone-outgoing-dom` 11/11, `phone-callback-dom` 20/20.

Mutations were run on a copy of `public/break_escape/js` and `test/js` in the scratchpad, not in the shared tree (script `mut_a6r4.py`, not committed). For this round: K7 to K12. Four killed, two survive (n-1).

## Nits

- **n-1. The m2 cleanup test does not prove the listener is removed.** "After cleanup nothing listens" emits after `inst.cleanup()`, but `cleanup` nulls `this.conversation`, and the watcher's `!this.conversation` guard returns early. Removing the `off` call (K8) therefore survives, and so does removing the `!this.conversation` clause (K7), since no test emits with an id set and no conversation. Today this is harmless: `off` is there, and a watcher left behind would still do nothing. Asserting on the dispatcher's `global_variable_changed:*` listener count after cleanup would pin K8.
- **n-2. A press that is refused while the entry still applies does nothing and shows nothing.** `ringer.dial` refuses when a call is connected or held, in a paused scene, or after a knockout. `_pressCall` then redraws the same button. With a thread open, those states are rare (a held call is the likeliest). A short "Can't call now" toast would close it, but nothing in the plan asks for one.
