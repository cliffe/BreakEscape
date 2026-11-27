# Exchange heard on the first line: round 1 outcomes

- **Major 1 (event lost after a reload).** Fixed. `npc_exchange_heard:<knot>` now goes out with `heard_<knot>`, once, at the first overheard line (`npc-needs.js`, in `_tickChats` after the line's `npc_chatted` and `npc_overheard`); the emit at the finish is gone. I grepped every consumer: no scenario condition, validator rule or engine code reads `complete` (two playtest tools only print it), so the field is dropped; the finish still logs `exchange_heard { complete }` and `exchange_cut`. The reviewer's re-emit-on-load option needs a load hook and a `restored` flag and still depends on `onceOnly` guards; matching the event to the flag needs neither. Docs updated (5.6a, the events list, the scenario schema text, which also told authors to bind `data.complete`). A task bound to the event now completes at the first heard line. Live check on test_needs_sims was NOT completed: no exchange played in 240 s in my fresh game, so the probe aborted (needs the Neil setup the staff-room playtest tool does). Open.
- **minor 1 (flag visible to ink and mappings earlier).** Fixed in the docs: the needs system reads the flag only when choosing; ink, `requireGlobal` and mapping conditions see it from the first heard line. The untested `room_entered:staff_room` ordering was not tested.
- **minor 2 ("the flag is saved").** Fixed: it goes up with the next sync or the page-hide flush.
- **minor 3 (validator comment).** Fixed at `scripts/validate_npc_needs.rb:838`.
- **nit 1 ("the gap").** Fixed in the doc and the test title ("while the last line is still showing").
- **nit 2 (phone calls).** Fixed: `_finishCall` now uses `_markExchangeHeard`; 5.6a says calls keep the heard-to-the-end rule.
- **nit 3 (cut-path single write).** Added a test: a heard cut writes `heard_<knot>` once and emits one event.
- **nit 4 (live note).** Left in place; a line now says the proof ran on m04.
