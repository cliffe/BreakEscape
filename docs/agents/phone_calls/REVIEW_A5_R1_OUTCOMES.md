# A5 R1: outcomes of m1 to m3 and the nits

Fix round after `REVIEW_A5_R1.md` (M1 went to A6, m4 to the validator fixer). Commit `776293f99` and the proofs commit. Keyless :3025, headless, stopped. Proofs in `proofs/A5_r1/`, route `tools/phone_calls/routes/a5r1_live.sh`.

| Item | Result |
|---|---|
| m1 line-level `#ending_check` | `desk_contact` has a third hub choice ("Wrap up the line-tag way") that places `extract_line_call`, a copy of m01's `closing_debrief` shape: `[On my way]`, then `#ending_check` and `#set_global:end_go:true` on their own lines above the last line, `#exit_conversation`, `-> END`. Validator 0 errors, same warnings. Live, both answers (`line_end.log`, `line_keep.log`). **End the mission now**: `end_go` true, the closing line is requested from `/tts` (voiced), the call closes, the credits roll (`line_end_credits.png`), `conversation_closed:desk_contact` fires twice (the known double fire), the phone is closed. **Keep going**: `end_go` stays false, the line and tags are dropped, the call closes through the story-end branch, the thread is back on its hub with all three choices, the ringer is idle (`line_keep_kept_going.png`). No code change was needed: it works as the review read it. |
| m2 Call button | `PhoneChatMinigame._watchCallButton` listens to `global_variable_changed:*` while a thread is open (set once, removed in `cleanup`, ignores the contact list and a closing thread) and re-asks `callButtonFor`; `_pressCall` refreshes (hides) the button when `placeCall` dials nothing. New `test/js/phone-call-button-refresh.test.mjs` (3 tests, written first: 2 failed, the press test failed on its first assert). Live on `hidden_contact` (`button.log`): no button; `away_back` set through the engine's own `applyActions` `set_global` with the thread open, button appears; set false, it goes; stale button (flag cleared silently) pressed, it goes and nothing dials. |
| m3 dial caption | The dial screen keeps the caption `showConversation` sets (the call's `callLabel`, else the contact's, else "Voice call"); the bar says CALLING. `setCallStatus('calling')` no longer overwrites it with "Calling…". Test: `phone-outgoing-ui` caption order (entry label, contact label, default) and the old caption assertion changed. `desk_contact` got `callLabel: "Albion ops desk"`. `caption_calling.png` (label under the name, CALLING bar, End), `caption_connected.png`, `caption_calling_nolabel.png` ("Voice call"). Withheld never applies to an outgoing call; the terminal look has no call screen, so there is nothing to caption (unchanged, plan 2.5). |
| n1 | Comment moved to the `_callEndedPending` return. |
| n2 | Not changed. `ending_end.log`'s `credits=false` came from a selector that does not match the credits screen; this round's `line_end` route prints it too and the screenshot is the proof (credits up). Leave the A5 log as it is. |
| n3 | Decision: End during the dial leaves no row (no time on the line was known, same as an outgoing call cut by a reload, A6). Not changed. |
| n4 | Note for the writers: a `#place_call` choice's bracket text is kept as a sent message before the dial. |
| n5, n6 | No change. |

## Regression

- `bin/test-js -j 3` under the lock: `Files: 524 passed, 0 failed`.
- Lab SE: `sha256_noseed` `ffe4c083…` (`dev_service_desk`) and `52c50b7a…` (`ruth_phone`) after the reload equal A6's; `se_dev/se_phone_contacts.png` is byte-identical to `proofs/A6/se_dev/se_phone_contacts.png`; `/tts` lines the same four. DM list not retaken (untouched; `proofs/A3/dm_list.png` stands).
- `dungeon_graph.*` left alone.
