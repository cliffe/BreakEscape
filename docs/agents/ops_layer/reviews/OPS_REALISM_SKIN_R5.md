# OPS_REALISM_SKIN_PLAN review, round 5 (delta)

Plan at `a4217f2ed` (diffed against `923088f9f`). `core:` is `docs/achitechture/OPS_CORE_PLAN.md` in
the same worktree. Line numbers are the plan's unless prefixed.

## 1. Agreement with the core plan (check 1)

Every "core 5.3 / 5.4" citation points at text that exists. The key rule matches. Three small
disagreements and one gap, none of which makes the two plans build the same thing twice or leaves
something unbuilt.

| Plan claim | Core text | Result |
|---|---|---|
| One `perform` path for sweep, scan, check, confirm, use, unplug (98, 125, 282, 299-303) | `core:541-548` ("No doubled noise from one click", in 5.3); `core:1605-1608` (request 6) | Agrees. Core builds it in S1 to S3, with the old unplug guard folded in; the skin builds none (K1 row 143; 198; 975) |
| Key is action and target; `use` is card and finding together; Confirm and Probe are one key (302, 98) | `core:544-545` ("Confirm and Probe are one action with one key, the finding; the key for `use` is the card and the finding together"); `core:1606` | Agrees |
| Guard held from press until answer or error; a second press with the key in the set sends nothing (305-306) | `core:542-544` | Agrees (core says "answer"; "or an error" is the skin's addition and is the sane reading) |
| `sign-in`, `open`, `observe` unguarded (303-304) | Core lists six guarded actions and no others | Agrees |
| Messages an action leaves are drawn by the renderer; `unplugBox` touches no DOM (98, 125, 316-317) | `core:835-836`, `core:848-849` (5.5) say the renderer draws them and `perform` never writes the DOM | Agrees, but the plan cites 5.3, and the text is in 5.5. See R5-m2 |
| `network_only` never reaches a network-view renderer, no Terminal line, core shows none (423) | `core:679-697` (5.4): handler in `loadLoginDesktop`, "shows no line"; `core:937` thirteen codes, twelve on ops routes | Agrees on the substance. The route description is off. See R5-m3 |
| Thirteen codes in `ops_refusal_codes.json`, skin walks twelve (665, 741-744) | `core:937-940` | Agrees. The file holds thirteen; the skin skips `network_only` by name |
| `offers()` marks an offer `pending` "from the core's pending keys" (143, 198, 309, step 2 at 967) | Core says the control is disabled and a second press makes no call (`core:542-543`); it exposes no readable key set and gives no `perform` signature | Gap. See R5-m1 |

Nothing is built by both plans. One thing is built by neither unless the K1 builder does it: the
read access to the pending set (R5-m1).

## 2. Late answer after a skin switch (check 2)

Closed. 309-312 says the set lives in the scene, the answer goes to whichever renderer is mounted
through `showResult`, and the Terminal prints it with no echo line. Parity test 10 (811-821)
presses in one skin, switches while the answer is held, presses the same offer in the other skin,
then asserts the mounted skin's `showResult` receives the resolved answer once and the unmounted
one's is not called. It runs for all six guarded actions and both Confirm labels. One thing test 10
does not say: the late answer for a `use` that opens a desktop or changes the keyring is handled by
the scene, not `showResult`; this is the same in both skins and the live run (C switching after each
step) exercises it. Not a finding.

## 3. `LOCAL_ACTIONS` (check 3)

Consistent in the five places it appears: 99 (the core's hook list names both), 196 (defined in
`view-controls.js`), 253-258 (how a later control is picked up), 661 (controls test: every
`data-action` literal is a `CONTROLS` key or a `LOCAL_ACTIONS` entry, none in both), 716-718
(test 1 skips them for the call check and runs the `select` path with "no call recorded"). The
rule "a skin never adds, removes or changes a request" (62) still holds, because the rule is about
requests and a local selection sends none; 276-277 already says local state ends in one `perform`
with a complete offer, or in nothing. Test 8 (759-760) says selection is not carried across a
skin switch. No stale text. One residue: nobody says what the test snapshot's selector for
`select-finding` and `select-technique` is in the Terminal (R4-n7, still open; R5-n3).

## 4. `network_only` and counts (check 4)

Clean. All references are 423, 665, 741-744 and 1007. Test 5 and the format test both say twelve
and say why. No leftover "thirteen" used as a count of Terminal-covered codes. Line 1007 uses
"thirteen" for the agreed list, which is the core's count (R5-n1).

## 5. New contradictions, stale references, review wording (check 5)

No mention of reviews, rounds, reviewers or R-numbers anywhere in the plan (grep for `round`,
`review`, `R[0-9]` finds only the words "revision" in unrelated senses at 480, 839, 919, none a
review reference). No "every `use` offer shares one key" text remains; the controls test (661) and
test 10 use per-pair keys. No `_unplugging` or "replaces the core's per-button disabling" text
remains.

### Findings

**Blocker: none. Major: none.**

#### R5-m1 (minor). The skin needs to read the core's pending set, and nobody asks the core to expose it

Plan 143, 198, 309 ("`offers()` returns the offer under it with `pending: true`, and the scene
calls `render` when the set changes"), 967 (step 2: "`offers()` reading the core's pending keys").
Core `541-548` describes a guard that disables a control and refuses a second press; it names no
set the scene exposes, no key format, no re-render on change, and no signature for `perform`. The
plan's shared-file row at 979 says K1 leaves "the `perform` path and its pending guard as the core
built them", which conflicts with K1 adding a reader and a re-render hook to it (and with
`ctx.perform(offer)` wrapping it, 198, 282).

Why it matters: if the core builder closes the set over a private variable, K1 must edit the core's
code, against 979 and the brief's rule that K1 changes nothing visible. It is small, but it is the
one place where each plan assumes the other supplies something.

Fix: add cross-plan request 3 in section 14: "S1 to S3 keep the guard's set as a scene member the
scene can read (`this.pending`, a `Set` of string keys built from action and target, the `use` key
from card and finding), and call `render` when it changes; `perform` takes `(action, target)`."
Or reword 979 to "K1 reads the set and adds the render call; it changes no key and no request".
Name the key builder (one pure function) so `offers()` and the guard agree on keys; test 10 then
also checks that every guarded offer's key is the guard's.

#### R5-m2 (minor). Unplug message citation, and a tension inside the core

Plan 316 ("drawn by the renderer, as the core has them (core 5.3)"), and the agreed list at 1008
("from 5.3 ... renderer-drawn action messages"). Core: the sentence that the renderer draws these
messages is in 5.5 (`core:848-849`), and 5.3 (`core:546-548`) says the unplug guard is folded in
"with the button's pending label and its notice kept as they are", which reads as `unplugBox`
keeping its DOM writes. The two core passages disagree about where the label is written.

Fix: cite "core 5.5" at 316 and 1008, and add to request 3 (R5-m1): "the unplug's pending label and
notice are drawn by the renderer from the offer's `pending` and the result (core 5.5), not by
`unplugBox`". Ask the core reviser to reword `core:546-548` to match `core:848-849`. If the core
does keep the DOM writes in `unplugBox`, then K1 moves them (plan 316-317 already does) and the
K1 effect row (627) is still right.

#### R5-m3 (minor). `network_only` is described as an answer after an `open`

Plan 423: "it answers the desktop route after an `open` has handed over". Core `679-682`: it
answers a desktop request with no route at a PC whose session is a technique session (a keyboard
fetch), and `core:696` says a request that names a route is never answered `network_only`. An
`open` from the view hands over with a route, so it cannot meet it. The conclusion (no Terminal
form) holds either way.

Fix: "it answers a desktop request made at the PC's own keyboard, never one made from this view".

### Nits

- **R5-n1** (1007, 665). "the thirteen refusal codes with `REFUSAL_TEXT`": say "thirteen, twelve of
  them on the ops routes" so the count in the agreed list matches the twelve walked at 665.
- **R5-n2** (744). "no network-view renderer is given it (5.3)" reads as the core's 5.3 beside
  "core 5.3" elsewhere; write "(this plan's 5.3)" or "(423)".
- **R5-n3** (the four open nits). n3 (K3 JSON block) and n4 (`check` params) do not matter; the
  builder reads the routes from the core. n7 matters a little now that `LOCAL_ACTIONS` is explicit:
  the core's snapshot gives a selector for each of those actions and a core controller test finds
  controls "by their `data-action`" (`core:1279`); say in 5.3 or 11.5 that in the Terminal those
  selectors are null and the skin-blind test must not require them, and that the Terminal's quick
  command carries `data-quiet`. n8 matters on the first rerun: after K3 sets `defaultSkin: "cli"`
  on `test_ops_skin` (step 6, 969), beat W1 ("opens in Panels") fails; say W1 and W2 run on a copy
  with no default, or restate W1 as "opens in the scenario's default". Neither blocks building.

## Verdict

No blocker and no major. Round 4's findings are closed: M1 by the plan now routing through the
core's `perform` and guard, m1 by `LOCAL_ACTIONS`, m2 by dropping `network_only` from Terminal
coverage with no stale count, m3 to m5 by the earlier edits plus test 10's late-answer clause. The
three minors are citation and interface wording (R5-m1 is the only one a builder could trip on,
and only if the core's guard hides its set). They can go in as one small fix, with no further
round, since the plan is past round 5 and the remaining items are minors and nits. The plan can stop
review once R5-m1 to m3 are applied or deferred to the K1 builder with the request in section 14.
