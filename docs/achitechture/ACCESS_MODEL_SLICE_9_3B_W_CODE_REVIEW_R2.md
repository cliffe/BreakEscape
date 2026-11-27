# Slice 9.3b sub-slice W (Wi-Fi) - code review, round 2 (server and client)

Scope: the round 1 fixes in `c073703b2` (reachable APs/card, double-click guard,
whitespace-psk validator error, N9 `already` gate, scanner exemption test, join-header
escaping test), plus the one item the fixer flagged: the base minigame header renders
`params.title` as HTML and W feeds the author's access-point name as that title. Read-only.
Branch `build/9-3b-w`, head `22b3f2491` (main merged in); diff `main...build/9-3b-w`.

## What was verified

- **Reachable APs/card (M1 fix).** `room_reception.json`'s walls layer leaves the walkable
  interior at x=1..8, y=2..8. The three moved objects now sit at interior tiles:
  `guest_ap` (8,5), `guest_ap2` (8,8), `wifi_note` (6,3)
  (`scenario.json.erb:175,186,196`). Each has open floor neighbours (e.g. (7,5), (7,8),
  (5,3)) and none collides with the other reception objects (`kit_dropbox` 8,4;
  `lobby_vault` 2,6; `sam` 5,4; signs 2,3/4,3). Interaction needs player centre within
  `INTERACTION_RANGE` (1 tile) and `interactionLineClear` (`interactions.js:265`); from the
  adjacent interior tile both hold (the east wall is at x=9, beyond the object). The live
  proof (`scratchpad/wifi_proof_3024.png`) shows both AP racks inside the east wall with the
  player standing at the lower one. The moves block no path or other beat. Fix is sound.
- **Double-click guard (m1 fix).** `network-links.js:467-469` returns `busy` when
  `MinigameFramework.currentMinigame` is present and not `_ending`. Both property names are
  the real framework idiom (`minigame-manager.js:61`, `network-view-minigame.js:256`), so the
  guard fires. Test at `network-links.test.mjs:608` would fail without it (a second
  `interactWifiAp` would return `prompt` and `started.length` would reach 2).
- **Whitespace-psk validator error.** `validate_network.rb:192-195` errors on a psk that is
  non-empty but strips to empty, and `:201` changes the warning guard to `!psk.strip.empty?`
  so a whitespace psk is not also warned as short. This now agrees with the server, which
  treats a blank/whitespace psk as open (`network_access.rb:286`, `present_string?` strips).
  Test at `validator-network-model.test.mjs:303` fails without the fix and the empty-string
  case guards the `!empty?` predicate.
- **N9 `already` gate.** The emit now carries `already: !!body.already`
  (`network-links.js:503`) and the N9 mapping is gated on `data.apId === 'guest_ap2' &&
  data.already === true` (`scenario.json.erb:290`). Joining through `guest_ap2` first no
  longer completes N9 on a first join (N8 is onceOnly, `already` is false on any first join).
  Correct.
- **Scanner exemption test.** `access_leak_scanner_test.rb:211` asserts a network name on a
  `netlink_` held handle in an `/inventory` body raises no finding, and the same name under
  another holder is still reported. Fails without the `netlink_` exemption line.
- **Join-header escaping test (n1).** `password-join-mode.test.mjs:95` now loads the real
  `display-dashes.js` and asserts an AP name with `<script>`/`&`/`"` renders escaped in the
  join header with no element injected. Exercises the shipped `escapeHtml(displayDashes(...))`
  at `password-minigame.js:224`.

## Findings

### Minor

**1. Author access-point name reaches the unescaped `params.title` HTML sink.**
`public/break_escape/js/minigames/framework/base-minigame.js:25` assigns
`container.innerHTML` with `<h3>${displayDashes(this.params.title || 'Minigame')}</h3>` and
no `escapeHtml`. W's `_promptWifiKey` passes the author access-point name as that title:
`title: data?.name || 'Join Wi-Fi'` (`network-links.js:520`). `PasswordMinigame.init` calls
`super.init()` first, so the base template parses the AP name unescaped before the join
branch overrides `headerElement.innerHTML` with the escaped version (`password-minigame.js:224`).
Because `innerHTML` parses on assignment, an `<img src=x onerror=...>` in the name fires
during that first parse; the later override does not undo it. The author's own escaping test
sidesteps this by passing a benign `title='Join Wi-Fi'` (its comment: "A benign title keeps
the framework header clean").
Failure scenario: a scenario `wifiAp` object named `Guest <img src=x onerror=...>` runs that
markup when the player clicks the AP, before the visible header is replaced. The text is
author-controlled, not end-user/org input, so real exploitability is low (the author already
controls their own scenario), but it is a genuine HTML sink for engine-rendered text, which
the project's input-sanitisation rule forbids on principle (defence in depth).
Rating: Minor.
Where to fix: the sink itself is pre-existing and shared (the default password path at
`password-minigame.js:232` and the sign-in path render `params.title` the same way), so
escaping `params.title` at `base-minigame.js:25` is the correct central fix and benefits every
caller; that is **separate**, not W's to rework. W's own contribution is cheap and belongs in
W: `_promptWifiKey` need not feed the author name into `params.title` at all, since the join
branch builds and escapes its own visible header from `join.apName`. Pass a constant
(`title: 'Join Wi-Fi'`) and W stops feeding author text to the unescaped base template with no
change to shared code. Recommend the W-side one-liner now and the central `base-minigame`
escape as a separate follow-up.

### Nit

**2. The N9 `already` payload field is not unit-tested.**
`network-links.test.mjs:639` asserts `network_joined` fires twice for the second AP but does
not assert the emitted event carries `already: true`. The N9 gate (`data.already === true`)
and the emit field (`network-links.js:503`) are proven only by the live playtest; the
validator still warns on the onceOnly indices 11/12. A regression dropping `already` from the
emit payload, or flipping the gate, would fail no JS or Rails test. Fix: in the existing
second-AP test, assert `named('network_joined')[1]` (or the captured payload) has
`already === true`, and the first join has `already` falsey.

**3. Whitespace-psk error message spans the open-network case loosely.**
`validate_network.rb:193-194` - the message says "use '' for an open network", which is
correct, but the error only triggers for a non-empty all-whitespace string; a psk of a single
space is the degenerate authoring case the server already treats as open. No code issue; the
wording is fine. Noted only for completeness; no change needed.

## Test runs (changed files, alone)

- `node --test test/js/network-links.test.mjs`: 41 pass, 0 fail.
- `node --test test/js/password-join-mode.test.mjs`: 6 pass, 0 fail.
- `node --test test/js/validator-network-model.test.mjs`: 35 pass, 0 fail.
- `bin/rails test test/unit/access_leak_scanner_test.rb` (Ruby 2.7.8): 39 runs, 242
  assertions, 0 failures, 0 errors, 0 skips.

## Verdict

Approve. Every round 1 fix lands and is sound: the APs and key card are reachable by a
walking player (confirmed live and against the tilemap) and block no path or beat; the
double-click guard uses the real framework idiom and is tested; the whitespace-psk validator
error now matches the server's open-network handling; the N9 `already` gate closes the
first-join-through-the-second-AP hole; the scanner and escaping tests close their gaps and
each would fail without its fix. No Blocker or Major. The one HTML sink (Minor 1) is
author-controlled and low risk, but should be addressed: the W-side one-liner (stop passing
the author name as `params.title`) belongs in W, and escaping `params.title` at
`base-minigame.js:25` is a separate, shared follow-up. Nit 2 (assert the `already` payload
field) is worth adding while the test is open.
