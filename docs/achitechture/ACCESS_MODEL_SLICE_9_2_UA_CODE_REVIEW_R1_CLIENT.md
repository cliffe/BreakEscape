# Access model slice 9.2, sub-slices U and A: code review round 1 (client)

Scope: the client half of `git diff claude/break-escape-access-design-090sjx build/9-2-u-a`
(`public/break_escape/js/**`, `test/js/**`, `scenarios/test_access_work`), read against
`ACCESS_MODEL_SLICE_9_2_PLAN.md` sections 5, 7, 9.1 and 11 and checked against the claims in
`ACCESS_MODEL_SLICE_9_2_BUILD_LOG.md`. The Ruby server side is reviewed separately; items the server
must not trust are listed at the end for that reviewer.

Line numbers are for the worktree at `d29d908da` (branch `build/9-2-u-a`).

Tests run, one file at a time with `node`: `npc-reports` (5 pass), `npc-work` (3), `npc-needs-work`
(19), `npc-needs-usb-policy` (7), `pc-policy` (7), `npc-condition-dotted-paths` (7), `npc-needs`
(60), `npc-action-icons`, `npc-needs-debug`, `test-bridge-access`, `npc-coffee-off`: all pass, no
failures. No browser run, no full suite.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 10 |
| Nit | 8 |
| For the server reviewer (not counted above) | 5 |

## What was checked and holds

- **Existing needs behaviour.** Every new rule is gated on `_judged`, which is true only for `work`
  with a server plan (`work` on the record) or for `social_media`. No scenario in the repository
  has a `social_media` need (grep), and the server attaches `work` only to NPCs with a work need and
  a resolved list, so `test_npc_needs`, `test_needs_leash`, `test_needs_sims` and the office-life
  scenarios take the old paths. The only new `TURN_BACK` row with `parks: true, fallback: false` is
  `failed`, so the new park branch in `_turnBack` (`npc-needs.js:1745`) cannot catch an existing
  reason. `_claims` skipping visit jobs only affects visits. `npc-needs.test.mjs` (60) still passes,
  including the whole-payload `npc_used` assertion. The build log's regression captures agree.
- **The verdict, wakes and kick** follow 5.2 and 5.6: `failures` collects every cause in plan order;
  `wakeOnFor` empties on any cause with no global; `causesClear` never clears `off` or `no_access`;
  `_wakeFailedFor` runs before the `_offSeen` early return; `_wakeStationFor` waits one use time;
  `_wakeParked` and `_wakeParkedFor` pass over failure and held parks; the kick skips parked needs,
  waits through a use of the same need and while the home is provisional.
- **Report queue pacing.** At most one request per 2 s, at most 20 reports per request, one resend
  for `stale`, the forced sync before a batch after a watched global changes, no fail for a settled
  NPC. A rejected request drops its batch and the `finally` reschedules, so a server error cannot
  wedge the queue or spin it. There is no unbounded retry, so no request spam.
- **The new right-hand operand** in mapping conditions (`npc-manager.js:95-104`). It resolves only
  `data.<path>` and `globalVars.<path>` through the same `resolveLHS` the left side already uses, so
  scenario data gains no reach it did not have. A quoted string, `value`, `name` and any bare word
  stay literals. The only condition in `scenarios/` with an operand on the right is W3's new one, so
  no existing condition changes meaning.
- **Listeners.** `installNpcReports` adds one `global_variable_changed:*` listener behind a
  `window.npcReports` guard, the same pattern as `installNpcNeeds`. The game has no in-page scene
  restart (no `scene.restart`/`scene.start` outside tests), so nothing doubles up.
- **USB plant** (`interactions.js:968-990`): uses the first matching item the policy accepts,
  refuses only when all are refused, runs no action and consumes nothing on a refusal; an
  ungoverned object keeps the old "first match" result.

## Minor

**m1. A visit to the NPC's own `needsHome` object leaves the post.** Plan 5.3: "A visit at the
NPC's own `needsHome` object is an at-post job and never leaves the desk." `_atOwnPost`
(`npc-needs.js:2321-2324`) is true only for `kind === 'use'`, so for a visit job `_leavePost`
(`:2333-2346`) emits `npc_left_post` (the workstation layer rolls the screen) and `_moveForPhase`
stands the seated NPC up and walks it to the approach cell. Not reached in A (check visits go to a
resource's `object`, a printer), but B's `writes_down` and similar workaround visits will hit it.
Fix: treat `job.kind === 'visit' && job.targetId === s.home?.objectId` as at-post in `_atOwnPost`
(or a dedicated check in `_leavePost` and `_moveForPhase`), and add a node test.

**m2. The report queue and the restore load after the needs system has started.** `core/game.js:1990-1996`
installs the needs system, then dynamically imports `npc-reports.js` and only then calls
`restoreFrustration`. In that gap a start-room NPC can register, be kicked (a global already on)
and fail: `world.reportUse` (`npc-needs.js:4138`) calls `window.npcReports?.queue`, which does not
exist yet, so the report is silently lost, and the reload's `held` park has not been applied, so
the client fails before the server would accept it (the server answers `tooSoon`, so this is a lost
step, not a cheat). Fix: import `npc-reports.js` statically, as `npc-work.js` already is, and call
`restoreFrustration` before `installNpcNeeds` returns control to the tick loop (or have
`restoreFrustration` stored on the system before the first register, and buffer `reportUse` until
the reporter exists).

**m3. An ease is skipped while the mirror says 0.** `_completeJob` reports an ease only when
`s.frustration > 0` (`npc-needs.js:2629`). The mirror lags the server by one answer, and
`reset()` (`:505-530`) re-registers every NPC with frustration 0 and no restore (the restored
entries were deleted on first use, `:2100`). After a reset, or a met use that lands before the first
fail's answer arrives, the server keeps a level the client never eases, and the blocked icon is off
while the server's `tell` is up. Fix: also report an ease when a fail for that need is pending or
was sent since the last answer (a per-need flag cleared by the answer), and have `reset()` keep the
mirror (frustration, tell, settled) or re-apply the last known server values.

**m4. `npc_frustration_changed.previous` comes from the client mirror, not the answer.**
`_setFrustration` (`npc-needs.js:2075-2083`) emits `previous: s.frustration` and ignores the answer's
own `previous`, which the server sends (`npc_frustration.rb:246-247`). After a reload the restore
emits `previous: 0`; after a `reset()` (m3) an ease 100 to 90 emits `previous: 0`, so W3's
`data.level < data.previous` does not tick. Fix: use `a.previous` when it is a finite number, else
the mirror.

**m5. An `off` park on a non-station source is counted and always refused.** `_select` counts any
`off` give-up on a judged need (`npc-needs.js:1455`). `_giveUpReason` puts the dead own station
first, but when the own station is not dead and the nearest unusable source is an off non-desk
object (a kiosk with `offWhen`), the park is still counted: drain, `station_fail` line (the
`_failTopic` mapping at `:1868` names the station even when the target is a kiosk) and a fail
report the server refuses (an `off` cause must name the NPC's own station, plan 9.1), once per park.
The plan's own counting rule (5.2, "One failure, one count") does not make this distinction, so it
is a plan gap as much as a code one. Fix: count an `off` park only when `targetId` is the NPC's own
station (or a borrowed PC in H); otherwise park as office life always did.

**m6. Settled can be re-set after an ease was queued.** `queue` clears `settled` when an ease is
queued (`npc-reports.js:45`); a fail already in flight whose answer says `settled` re-adds it
(`:100`) after that ease, so later fails are dropped until the next ease. Self-healing (the next
met use sends another ease) but it can lose a step during W2/W3-style toggling. Fix: record a
per-NPC sequence number on queue and ignore a `settled` answer for a request sent before the last
queued ease.

**m7. The blocked icon outlasts the outage by minutes (builder's observation).** `stateIconEntry`
(`npc-action-icons.js:122-129`) shows `blocked` whenever `tell >= 1`, and `tell` is 1 for any level
above 0. With `easePerSuccess: 10` a level of 100 needs ten met uses to reach 0, so the icon stays
long after the share or printer is back. The code does what plan 5.5 says ("the icon stays up
between failures"); the persona run found it confusing. Options for the user: show the icon only
while a failure park is held or within N seconds of the last counted failure, and use the pulse
alone for `tell` 2; or have the server send `tell` 0 below a low level. A decision, not a code fix.

**m8. W4 and W7 share one printer global.** Both levers set `printer_jammed`
(`scenario.json.erb:1052-1069` and `:1444-1462`), so the W7 lever clears a jam left from W4 and the
W7 sign's "jam the printer" can read "Clear the printer jam?". Fix: give W7 its own resource and
global (for example `printer_w7_jammed` on a second printer object) or make the W7 lever's
confirm text and sign say it is the same printer.

**m9. Test gaps that would not catch a regression.**
- `installNpcReports` and `watchedGlobal` (`npc-reports.js:113-145`) have no test: wildcard name
  parsing, a station `offWhen` given as a string and as an object, an NPC with no `work`, and the
  idempotent install.
- No test sends through a rejecting `send` to prove the queue keeps going (the `finally` path).
- The kick waiting while the home is provisional (plan 5.6) is implemented but untested (no test
  mentions `provisional`).
- R5 n3 (the hold less the time since the response, `npc-needs.js:2087-2108`) is untested: the
  fixture world has no `elapsedMs`, so `elapsed` is always 0.
- The `requiresItem` refusal branch in `interactions.js` (toast, `usb_refused:<id>` event, no
  action, no consume) is covered only through the pure `plantRefusal`; the four harnesses that
  inline `pc-policy.js` do not exercise a refusal.
- A visit to an NPC (`at: { npcId }`, `cellBeside`) is untested; the stub falls back to `x + 32`.
Fix: one focused test each; they are small.

**m10. A tempted job that fails is neither parked nor counted.** `_turnBack` skips the park when the
job is tempted (`npc-needs.js:1745`) and `failed` has no fallback, so the NPC goes home with the
need unrestored and unparked, and can retry at once. Unlikely for `work` today (temptation is a
magnet rule), but `social_media` in C may be tempted. Fix: for `failed`, park regardless of
`tempted`, or record the rule and its reason in a comment and a test.

## Nits

- n1. `npc_visit_dropped` is emitted for check visits too (`npc-needs.js:2032`); plan 5.3 names it
  for workaround visits. Harmless, but say so in the plan or emit it only for `kind !== 'check'`.
- n2. The breakDrain default (10 when no plan, for `social_media`) and its cap of 50
  (`npc-needs.js:1896`) are not in the plan. Document them in `NPC_NEEDS_SYSTEM.md` 5.9.
- n3. The debug F bar shows for any NPC with a `social_media` need even at level 0
  (`npc-needs-debug.js:175`); fine for feature scenarios, worth knowing for C.
- n4. `describe` calls `pcPolicy.usbPolicyFor` for every object on every describe
  (`npc-needs.js:3831`); cheap now, but it sits in the hot path. Cache per object id with the rest
  of the describe cache if profiling ever points here.
- n5. `PARKED_BADGE` has no entry for `failed`, so a failure park shows the `closed` badge. Probably
  intended; one line in the action-icons doc would settle it.
- n6. The determinism test ("a late answer changes no decision") uses `tell: 1`, which cannot change
  the pool; a `tell: 2` answer does change the grumble topic, by design (5.5). Name that limit in the
  test.
- n7. Beat signs (`scenario.json.erb`, for example `sign_w6` at `:1201-1212`) state the expected
  outcome and `needsDebugOverlay` is on (`:11`), so a watch-it-happen persona is told the answer.
  Fine for scripted runs; for persona runs add a URL toggle that hides signs and the overlay, or a
  second room set with neutral signs.
- n8. The W6 wall socket (`ian_socket`, `ups_cabinet1` at 3,6, `:1266-1300`) was reported under a
  chair. Not verified here (no browser). Move it to a wall tile clear of every PC's seat and
  approach cell and check with a render; a socket-like sprite would read better than a UPS cabinet.

## For the server reviewer

Everything below is client-supplied or client-decided; none is a client bug.

1. **Plant records bypass the USB policy.** After an accepted plant the client calls
   `sendInventoryRemove(id, { usedOn })` (`interactions.js:1001`). The refusal is decided only in
   the browser (`interactions.js:977`), so a tampered client can record a plant of a `storage`
   device on a PC whose policy refuses it. If `used_on` feeds capture proofs (engine plan section 6),
   the server should check `usbClass` against the PC's effective policy there too, as plan 7 already
   intends for 9.3b's implant.
2. **Report fields.** `npc_id`, `need`, `object_id`, `missing` and `rearmed`
   (`npc-reports.js:46-48`) are all client claims; `rearmed` is set by the client after every met
   use (`npc-needs.js:2627`), so it is nearly always true on a later fail. The server must apply the
   "belongs to the NPC", "a cause holds" and "no server-owned cause" rules of 9.1 itself.
3. **`<npcId>_frustration` globals** are written by the browser (`npc-needs.js:2081`) and reach the
   server through state sync. The server must never read them as the level (its own
   `npcFrustration` is the record) and should consider refusing client writes to keys ending in
   `_frustration` (the validator already forbids authoring one).
4. **The reload `hold`** is honoured only by the client (`npc-needs.js:2104-2108`); the pace floors
   are the real control.
5. **Tasks driven by needs events** (`npc_frustration_changed`, `npc_use_failed`, `npc_checked` in
   `test_access_work`, for example `scenario.json.erb:912-926`) complete from client events, as every
   mapped task does. Nothing new, but no capture or access decision should rest on them.

## Verdict

No blockers or majors on the client side. The needs-core changes are well gated, match the plan
closely, and leave the existing needs scenarios on their old paths. The report queue is bounded and
cannot spam. Ready to merge once m1, m2 and m4 are fixed (each is small) and m9's tests are added;
m3, m5, m6 and m10 can go in the same round or be logged for B. m7 and m8 need a decision from the
user, and the server reviewer should pick up item 1 of the list above.
