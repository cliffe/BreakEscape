# A6 round 2: outcomes

Fix commit `adc5169de`, proofs and this note in the commit after it. Review: `REVIEW_A6_R2.md`. Proofs: `proofs/A6_r2/`.

## M1: the slot keeps every held voicemail and the callback (fixed)
- Slot is now `{ forced, live, voicemails: [{ knot, withheld }], callback }`, every key optional. `syncSave` (`phone-ringer.js`) writes `voicemails` whenever any are held, whatever `live` holds. A lone callback still rides in `live` as `state: "missed"` (existing tests and old readers); beside a live offer or a held voicemail it is saved as `callback`.
- `_resumePendingCall` (`npc-manager.js`) runs the list quietly in order (`runVoicemail` chains them per contact), hands `callback` to `restoreCallback`, then handles `live`. A slot from before (one held voicemail in `live`) still loads and delivers (test).
- Server: `Game#clean_phone_pending_call` keeps `voicemails` (cap `MAX_PHONE_VOICEMAILS` = 10, bad entries skipped, only `knot` and a boolean `withheld`) and `callback` (call-record cleaner). Hostile-input Rails tests added (types, sizes, cap, control characters, markup, non-list). No migration.
- Tests: P1, P2, P3 from the reviewer's probe are committed in `test/js/phone-voicemail-hold.test.mjs` and fail on the previous head (`proofs/A6_r2/tests_fail_first_on_head.txt`: 10 of 20 fail there, 20 of 20 pass now). P2 also reloads twice and checks nothing is delivered twice.
- Live (`a6_live.sh voicemail_held_newer`, `voicemail_held_two`, :3024): one held plus a newer offer ringing, then reload: server slot held both (`live` + `voicemails`); after the reload two "Voicemail" rows and four voice bubbles, slot cleared, server slot null. Two held, reload: same, both delivered once.

## m1: thread-open check (fixed)
`_threadOpenOn` no longer asks `isConversationActive`: the thread holds whenever the open phone-chat is on that contact and not `_ending`. Tests: still-loading thread, ended thread, another contact, a second window opened at the first one's close.

## Nits
- n1: sentence in plan 2.6. Checked `taunt_t1_vm` on `build/phone-calls-writing` (`m07_architect_comms.ink`): it has a `countdown_expired` "Late" branch and sets only `heard_*`, `late_first_contact` and `t1_first_contact`, so a voicemail that runs after the contact's next call reads correctly. No ink change needed (not touched).
- n2: no change.
- n3: a held voicemail released after the ringer is closed or suspended (the ending) shows no toast (`ringer.isSuspended` added). Test uses `ringer.close()`; not seen live.
- n4: after 20 blocked tries `runVoicemail` now `console.warn`s the knot and contact (test). The hold still releases, as before; 20 blocked tries is not a reachable path.

## Docs
Plan 2.6 (hold rule, n1, n3, n4) and 2.7 (slot shape); `A2a_NOTES.md` (slot shape superseding `{ forced, live }`).

## Checks
`bin/test-js`: 561 files, 0 failed. Rails (phone state, message, reload persistence, all TTS tests): 322 runs, 0 failures. Lab SE `sha256_noseed` after the call and after a reload: Dev `ffe4c083...`, Ruth `52c50b7a...`, identical to A6 R1 and merge_main_1; contacts screenshot `proofs/A6_r2/se_dev/se_phone_contacts.png`. Server :3024 stopped.

## Left alone
`dungeon_graph.*` and `README_scenario_design.md` (uncommitted changes from other work). The new JS tests were written in the same pass as the fix; the fail-first run is against a clean archive of the previous head.
