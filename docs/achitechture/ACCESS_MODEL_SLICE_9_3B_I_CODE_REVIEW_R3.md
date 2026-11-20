# Access model slice 9.3b sub-slice I (implants): code review R3

Adversarial, fresh eyes. Scope: the implant sub-slice only, from `git diff main...build/9-3b-i`.
Earlier review files were not read. Main files: `app/models/break_escape/network_access.rb`,
`lib/break_escape/network_model.rb`, `public/break_escape/js/systems/network-links.js`,
`public/break_escape/js/systems/apply-actions.js`, `scripts/validate_network.rb`, and their tests.

## Verdict

No blockers, no majors. Two minors and two nits. Server authority, inventory reconciliation on
first success / lost response / retry, save-and-reload, plain-text output and validator correctness
all hold up. Tests touched by the slice are green.

Checks run:

- `bin/rails test test/controllers/break_escape/network_implants_test.rb test/unit/network_model_test.rb`
  -> 27 runs, 151 assertions, 0 failures, 0 errors.
- `node --test test/js/grant-foothold-action.test.mjs test/js/validator-network-model.test.mjs test/js/network-links.test.mjs`
  -> 111 pass, 0 fail.
- Validator over every `test_access_*` and every `lab_*` scenario: `test_access_networks` and all
  other access scenarios report **0** `❌` lines, including the feature scenario's real
  `grant_foothold` actions (dropped and session shapes). The `❌` lines in `lab_exploitation`,
  `lab_feeling_blu`, `lab_malware_metasploit`, `lab_post_exploitation`, `lab_vulnerabilities` and
  `lab_vulnerability_analysis` are all pre-existing ink parse issues (`//` comments and
  standalone `*emote*` lines) with no relation to this slice; they are present on `main`.

## Server authority (confirmed sound)

- No plant without a declared action: `implant_foothold!` calls `grant_foothold_action_for` first
  and returns 404 `no_action` when none matches (`network_access.rb:386-387`). `shape` and `pc` are
  both bound to the action, so a tampered client cannot pass `shape: 'dropped'` for a session-shape
  action (no match -> 404) or retarget another PC.
- No double plant: the already-held check runs before any precondition and writes nothing
  (`network_access.rb:408-414`).
- Footholds and item consumption are decided server-side from `droppedItems`, the session record
  and the inventory; the device is removed by object identity (`item.equal?(entry)`,
  `network_access.rb:437`) and the reach is the PC's own network only (test
  `network_implants_test.rb:171-179`).
- Nothing withheld leaks: refusals carry only `reason`/`error` and never a network name, host or
  content; the 404 `no_action` and 422 `not_ready`/`usb_refused` bodies expose nothing about the
  target.
- `consumedId` is present on every answer branch: `nil` for the dropped shape, the device id for the
  session shape, and the stored device id on the already-held replay (`network_access.rb:412`,
  `:425`), so a lost-response retry reconciles the tray exactly as the first success would.

## Minors

### M1. Implant does not re-emit `network_foothold_gained` on the `already` branch, unlike the sibling Wi-Fi join

`network-links.js:473-476`. On a lost first response the server grants the foothold, the retry
returns `already: true, first: false`, and the client takes the `already` return at line 473 before
`_emit('network_foothold_gained', ...)` at line 476 and before `if (body.first) this.open()` at
line 477. So the one-time `network_foothold_gained` event never fires and the view never auto-opens:
any objective or `eventMappings` entry keyed on `network_foothold_gained:<pcId>` silently never
completes after a transient network error on the first attempt. The sibling Wi-Fi path handles this
deliberately: `join()` emits `network_joined` at line 570, **before** its `already` return at line
571, exactly so a task on the access point completes (plan 5.3). The implant path should match.

Fix: move the `network_foothold_gained` emit above the `already` return, mirroring `join()`. Capture
whether the foothold is new before `this.footholds.set` (`const isNew = !this.footholds.has(foothold.id)`
at `network-links.js:470`) and emit when `isNew`, so a genuine repeat interaction does not double-fire
while a lost-response retry still fires once.

### M2. The dropped-shape fire-and-forget swallows a granted-but-unseen foothold's auto-open

`apply-actions.js:445-452` and `network-links.js:415-421`. For the dropped shape the auto-open
`if (body.first) this.open()` is skipped whenever the first POST's response is lost and the retry
returns `already` (M1's cause). Separately, `apply-actions.js` fires `links.implant(...)` without
awaiting, so a timer-driven dropped implant that fails its precondition (`not_ready`, item not yet on
the server drop record) is silently dropped and the timer, saved fired, never re-runs. The slice's
own note (`network-links.js` comment and plan 5.5) accepts the single retry for transient errors, but
a precondition `not_ready` is returned quietly with no path to recover. This is acceptable only if
scenario timing guarantees the drop is persisted before the timer fires.

Fix: none required in code if the feature scenario's `n11` beat proves the ordering holds live;
otherwise consider gating the dropped `grant_foothold` timer on a global the server sets when
`add_item_to_room!` records the drop, and document the ordering requirement in the plan's 5.5 so
authors do not place a `grant_foothold` timer that can fire before its `droppedItems` write lands.

## Nits

### N1. The `path` tie-break is inert in practice and reads as load-bearing

`network_access.rb:379` and `api-client.js` `networkImplant(pcId, shape, path = null)`:
`apply-actions.js:447` forwards `action.path`, but no engine code annotates an authored action with a
`.path` field, so `path` is `null` at runtime and selection always falls back to `[pc, shape]`. The
method doc already says it is "not load-bearing", and the validator forbids two actions sharing
`[pc, shape]`, so correctness holds. Fix: either drop the client `path` forwarding and the server's
`a[:path] == path.to_s` clause (keep selection on `[pc, shape]` alone, which the validator
guarantees unique), or add a one-line comment in `apply-actions.js` that `action.path` is reserved
and currently always absent, so a future reader does not assume client-side disambiguation works.

### N2. The USB-refused feature beat (N13) produces an intentional validator warning

`scenarios/test_access_networks/scenario.json.erb` kiosk `grant_foothold` with a USB-blocking
policy trips the validator warning "whose USB policy refuses the usbClass of ...". This is correct
behaviour for a beat that tests the refusal, but it leaves a standing warning in the clean feature
scenario that a future reviewer may mistake for a defect. Fix: none needed; optionally note in the
scenario's `PLAYTEST.md` that the N13 warning is expected.

## Test coverage

Good. Rails covers both shapes, the non-foothold-session requirement, the missing-device path, the
USB refusal, already-held idempotence for both shapes, reach to the PC's own network only, and the
forged/bad-shape/forged-view tamper cases. Node covers the apply-actions shape mapping and the
no-networkLinks / no-pc warning branches; the validator node suite covers every new error and the
USB warning. The id-less-device validator guard (R2 m1) and the timer/onConfirm host tracking
(R2 m2) both have fixtures and pass. One gap matching M1: there is no test that a lost-response retry
re-fires `network_foothold_gained` (because today it does not); add one with the fix.
