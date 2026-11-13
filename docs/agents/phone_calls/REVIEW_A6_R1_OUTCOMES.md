# Review A6 R1: outcomes

Fixer: Sonnet, 2026-11-12. Review: `REVIEW_A6_R1.md`. Commit `a2f44896c` (engine, tests, plan), proofs commit after it. Proofs: `proofs/A6_r1/`. Server keyless :3024, headless, stopped.

## Fixed

| Item | What changed | Test, and how it failed first |
|---|---|---|
| **M1** | `NPCManager.runVoicemail` holds the run while the contact's thread is the open phone-chat (`_threadOpenOn`: `phone-chat`, same `currentNPCId`, not `_ending`, `isConversationActive !== false`) until `conversation_closed:<npcId>` (`_whileThreadOpen`). `PhoneChatConversation.runVoicemail` takes `opts.isBlocked`, asked after the story loads and before anything is written; a blocked result goes back to wait and runs afresh (at most 20 tries). Holding was possible on every path, so the reviewer's fallback (write VARs into the open story) is not used. A held voicemail is saved in the slot (`ringer.holdVoicemail` / `releaseVoicemail`, `live: { state: "missed", onMissed: "voicemail", voicemailKnot, withheld }`), so a reload delivers it after the load, quietly, with no second "Missed call" row (`_resumePendingCall`). Plan 2.6 has the rule. | `phone-voicemail-hold.test.mjs` (11 tests, 8 failed on the unfixed code, output in `tests_before_fix.txt`): held until close; another contact's close does not release; thread opening during the load drops the result and runs once; two held voicemails run in order; slot while held; reload while held; the ringer path (Decline with the thread open). Rails: `game_phone_calls_state_test` keeps the held record whole. |
| **m1** | Dead code: with the hold, nothing can run while the thread is open, so `_drawVoicemailLive` (the `slice(-0)` path) could never fire. Removed rather than guarded. | Failed first with its guard test against the old function; the replacement test asserts the function is gone and that an empty voicemail writes only its row. |
| **m2** | `_voicemailDeps()` seam so the node harness can run the real conversation. Tests: toast named, withheld ("New voicemail"), quiet; unknown contact, empty knot, missing knot. | `phone-voicemail-hold.test.mjs`. Mutations killed (below). |
| **m3** | `_resumePendingCall` now returns true only for a restored forced entry that is on the line (`state !== 'queued'`) and on the knot the thread is on. | 3 tests in `phone-callback-dom.test.mjs` (queued forced; forced on another knot; forced on the thread's own knot still skips). 2 failed on the unfixed code. |
| **m4** | The "resume that leaves nothing" test uses a withheld ring with no voicemail; the voicemail-after-reload assertions moved to their own test. | Mutation "refreshSave removed" is killed. |
| **n1** | M7 asserts `knot === 'call_b'`. | `phone-ringer.test.mjs`. |
| **n2** | `resetToHome` read `saved` after the load, so its "thread moved on" check could never be false; it now reads `saved` at the call. Late-registered contact test asserts exactly one reset. | n2 test in `phone-voicemail-run.test.mjs`; mutation killed. |
| **n3** | Test: a voicemail miss clears an older callback and empties the slot. | `phone-callback-ringer.test.mjs`; mutation killed. |
| **n4** | Tests: a `#set_global` is mirrored into the story for the next line (new fixture knot `mirror_vm`); `recordInkVariables` is called after the save. | `phone-voicemail-run.test.mjs`; both mutations killed. |
| **n5** | `miss()` suppresses the "rang off" toast only when there is a voicemail knot to leave. | n5 test failed first (0 toasts). |
| **n6** | Plan row 32 now says a cut callback dial leaves the callback again. | none (docs). |
| Plan 9.1 | One line: an outgoing call cut by a reload leaves no row (A5 R1 n3, A6 R1 item 4). | |

## Mutations (`proofs/A6_r1/mutations.txt`)

20 mutations across all `phone-*.test.mjs`: 19 killed. One survives, `_midCallChecked` removed (n2), and it is equivalent: the reset moves `currentKnot` home before a second call can look, so the second call returns at the home check either way. The review's other survivors (m2 x3, m4, n2 resetToHome, n3, n4 x2) are killed. "Live draw removed" no longer exists.

## Not done or changed
- n5's validator side is A7's. `_midCallChecked` stays as a cheap guard.
- A held voicemail is lost on a reload if a newer offer for the same contact is in the slot (the newer offer outranks it). Rare, noted.
- The held voicemail's toast after a reload is not shown (quiet, as for any reload). The unread badge and the thread carry it.

## Proofs
- `bin/test-js -j 3` (flock): 561 files, 0 failed. Rails TTS, phone-state and reload tests (flock): 359 runs, 0 failures.
- Live (`tools/phone_calls/routes/a6_live.sh voicemail_open`, `voicemail_held_reload`, logs and shots in `proofs/A6_r1/`): the reviewer's reproduction. With `caller_voicemail`'s thread open and the in-phone Decline pressed: the "Missed call: No caller ID" row at once, no voicemail, no toast, slot holds the voicemail, `heard_vm` false. After choosing "Anything new?" in the open thread (its own save): `heard_vm` still false, nothing lost. After the thread closes: "Voicemail" row, two voice lines, toast "New voicemail", `heard_vm` true in the story and the saved ink variables, slot empty. Reopened thread reads "Unknown number. You listened to my message. Good.", and still after one more choice. Reload while held: voicemail delivered after the load (client and server `pendingCall: null`), one "Missed call" row, home line correct.
- Regression routes rerun on :3024: `voicemail`, `midcall_in`, `reload_forced` (forced call resumes connected on its choice).
- TTS key identity (`keys_vs_merge.txt`): this commit changes no Ruby app file and no scenario, so keys are identical to its parent. Against the merge commit `111b0b094` the dumps differ only in `m06_follow_the_money`, `m08_the_mole`, `m09_digital_archaeology` (and `_index`), which are the M10 and M1 commits other agents landed on this branch since the merge (`5024fe152`, `f883591d8`). `test_phone_calls` is excluded as asked. `compare_tts_keys.rb` against `keys_allow_a1.txt` flags those (and `lab_physical_pentest` as an allowance mismatch) because that file predates them.
- Lab SE (`se_dev/`): `sha256_noseed` `ffe4c083…` (`dev_service_desk`) and `52c50b7a…` (`ruth_phone`) after the call and after the reload, equal to `merge_main_1`; `se_phone_contacts.png` shows Dev and Ruth as before; four Dev `/tts` lines unchanged.
