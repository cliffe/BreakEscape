# USB habit: a refused stick as a frustration cause (user decision q39)

An NPC sometimes copies a file to a USB stick at its own PC, to take home or hand to a colleague.
Where the PC's policy refuses USB storage, the copy is refused, the use counts as a failed work use,
and the refusal is recorded as the cause `usb_refused`. A C2 reactive post can then key on it
(`"when": { "cause": "usb_refused" }`), so the player reads "IT blocked my USB again" and learns
that the PC is locked down. The C2 plan parked this (its decision 1) because sub-slice U kept no
server state for a refusal; here the refusal is a recorded fail cause, so the predicate has state to
read.

## What already exists

- The PC policy field: `policies.<name>.usb` is `allowed` (default), `storage_blocked` or
  `blocked` (sub-slice U). `AccessWork.usb_policy_for` and `plant_refused?` decide it on the server,
  `pc-policy.js` and `usbRefusedBy` in `npc-needs.js` in the browser. Nothing new is needed there.
- Judged work uses: a work use at the NPC's station is checked when it ends (`npc-work.js`); a
  failure is reported as `{ event: 'fail', need: 'work', missing: [{ id, why }] }` and the server
  accepts it only when every cause belongs to the NPC and one holds on the server
  (`NpcFrustration#fail_report!`). The last fail's whys are stored in `failWhy[need]`, which the C2
  `cause` predicate reads.
- The `usb_refused` chatter pool and its barrier picture (the mutter for a carried device refused).

## Authoring

A new room-NPC field, beside `printHabit`:

```json
"usbHabit": { "every": 2, "setGlobal": "kim_emailed_file" }
```

- `every` (integer 1 to 10, default 2): every nth judged work use at the NPC's own station
  includes a copy to a USB stick. A counter in the needs state counts those uses; it restarts at 0
  on a reload (no save field), which only shifts which use carries the next attempt.
- `setGlobal` (optional, a declared global): the workaround. When the first refusal is recorded
  the NPC "emails the file to itself instead": the server sets the global true. An author can gate
  a mail, an ink line or a note on it. The browser sets it at the same moment, so the scene does not
  wait for a sync.
- The habit only acts on an NPC with a work plan (a `work` need and a non-empty work list), since
  only judged uses are checked and reported. The validator warns otherwise.
- Spoken lines come from the existing `usb_refused` chatter pool (scenario or NPC), at tell 2 from
  `work_fail_fed_up`, as for every other cause. No engine text is spoken.

`usbHabit` is withheld from the browser like `workNeeds`; the resolved plan carries what the browser
needs: `work.usb = { every, setGlobal }`.

## Browser (npc-needs.js)

At the end of a judged work use at the NPC's own station, not locked out there:

1. Add 1 to the counter. When it reaches a multiple of `every`, the use carries an attempt.
2. If the station's `usbPolicy` refuses class `storage` (`usbRefusedBy`), append
   `{ id: <station>, why: 'usb_refused' }` to the verdict's causes, so the use fails. Emit
   `npc_usb_refused:<npcId>` `{ npcId, objectId }`, and set `work.usb.setGlobal` if there is one.
3. If the policy allows it, emit `npc_usb_copied:<npcId>` and the use goes on as normal (a
   hook for missions where a lax PC is the lesson).

The failure then runs the normal path: no restore, the grumble from `_failTopic` (`usb_refused`
is its own pool), the park and retry, the fail report. The next use without an attempt succeeds
and sends the ease, so frustration rises and falls with the habit rather than sticking at 100.

## Server (how the failure is recorded)

`AccessWork`:

- `FAIL_CAUSES` gains `usb_refused`.
- `usb_habit_refused?(data, npc)`: the NPC has a `usbHabit`, a work plan and a station, and the
  station's policy refuses class `storage` (`plant_refused?`).
- `cause_belongs?`: `usb_refused` belongs for `work` only, and only at the station.
- `cause_holds?`, `cause_candidates`, `cause_why_reachable?`: `usb_refused` holds for `work` at the
  station while `usb_habit_refused?` (static: a policy does not change in play).
- `can_fail?('work')` is true when `usb_habit_refused?`.
- It is not an owned cause: most uses at the station succeed, so an ease there must not be refused
  (R5 n5) and the pace floors keep their usual gates.
- `plan` adds `usb`.

`NpcFrustration#fail_report!`: after an accepted fail whose causes include `usb_refused`, the
server sets `usbHabit.setGlobal` (when declared), the same rule as `set_workaround_global!`.
`failWhy.work` records `usb_refused`, so `cause: "usb_refused"` holds from then until another fail
replaces the whys. An honest client can send a usb fail only every `every` uses, and the pace floor
bounds a dishonest one, as for `social_blocked`.

`Game::WITHHELD_WORK_NPC_KEYS` gains `usbHabit`.

## Validator and schema

- Schema: `usbHabit` on the room NPC (`every` integer 1 to 10, `setGlobal` string, `_comment`).
- `validate_access_work.rb`: an error when `setGlobal` is not a declared global; a warning when
  the NPC has no work plan (the habit does nothing); `check_mutters` adds "its PC refusing its USB
  stick" with pool `usb_refused` (or `work_fail`). The reactive `cause` check and the dead-post
  warning follow `FAIL_CAUSES` and `cause_why_reachable?`, so a `usb_refused` post on an NPC whose
  PC allows USB is reported as unable to fire.

## Demo

`scenarios/test_access_social`, beat U1 in a new room east of F13: Kim works at a PC under a
policy with `usb: storage_blocked`, `usbHabit.every` 2. Her second work use fails with a
`usb_refused` mutter; her feed (`reactive_first`) then serves the post keyed on
`cause: "usb_refused"`. Tasks tick on `npc_usb_refused:kim` and on the post.

## Tests

- Ruby unit (`access_work_test.rb`): can fail, belongs, holds, reachable, plan, feed selection.
- Controller (`npc_frustration_test.rb`): a usb fail accepted and recorded with its global; refused
  where the policy allows USB; an ease at the station still accepted.
- JS (`npc-needs-work.test.mjs` or a new file): the counter, the cause, the event, the topic, no
  attempt when locked out, an allowed PC copies.
- Validator: the new warnings and the mutter.
- Live: the U1 beat on a keyless server, with the fail, the post and the global checked.
