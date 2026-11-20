# Access model slice 9.3b plan: adversarial review, round 2

Reviewed: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md` (721 lines, marked
"build-ready") against the code in the `p-9-3b-plan` worktree, round 1's review
(`ACCESS_MODEL_SLICE_9_3B_PLAN_REVIEW_R1.md`), and the 9.3 / 9.2 designs it derives from.
This is a fresh read; R1 is used only to check whether its fixes hold and to avoid
re-raising closed points.

**What holds from R1.** Several R1 points are now fixed and verified:

- `link_item_for` is generalised to branch on `foothold['via']` (R1 M6's link-item half):
  5.3 names the jack / wifi / implant branches. The 9.3a method is jack-only
  (`network_access.rb:252-270`), so the branch is needed and the plan calls it out.
- The declared-grant path list (R1 M5): 4.5 and 5.5 drop the bogus `eventMapping` claim
  and list the real server-run paths, and the new enumerator lives in `NetworkModel`
  (`grant_foothold_actions`) reusing `DeclaredGrants.executed?` rather than editing
  `DeclaredGrants.for`. This is coherent: every action path `executed?` admits
  (`declared_grants.rb:96-112`) sinks into `applyActions` on the client
  (`interactions.js:1002,1017`; `esd-pushbutton-minigame.js:213,222`;
  `ui/scenario-timer-dispatcher.js`), so one `grant_foothold` case in `apply-actions.js`
  fires on all of them. **Good — this is the enumerator the task asked to scrutinise, and
  it is sound.**
- `truthy?` (R1 n5) is now pinned to the globals-relevant subset and tested against each
  falsy value (5.2).

**What does not hold.** R1's three blockers are all still open, and four of its majors.
Details below.

## Blockers

**B1. `player_reach` still seeds from `reach_from`, so a bare foothold reaches every linked
network (5.1; R1 B1 not fixed).** 5.1 defines `reach_from(network_id)` as "the set of
network ids reachable from `network_id` by following links through up networks only", and
then defines `player_reach` to "start with `reach_from(the foothold's own network)`". A jack
foothold on `office_lan` linked to `server_net` therefore has `server_net` in its reach with
no pivot session. This directly contradicts 4.1 ("A foothold gained at a jack still reaches
only its own network"), the no-exposure case in 7, and the plan's own beat N1 (section 11:
"The view lists the office network only; no row and no name from `server_net` … the leak
check finds no `server_net` string"). It is a secret-exposure defect: `network_view` would
emit the linked network's name, hosts and resources to a browser holding only a jack
foothold. **This is the identical fix R1 B1 asked for and it was not applied.** Fix:
`player_reach` seeds with `{ own network }` (when up); only a session the player holds at a
host on a network already in the set adds `reach_from(that host's network)`. `reach_from`
(which does cross links) is used only for the pivot-expansion step, never for the seed. Add
the unit test R1 named (a foothold with no session never lists a linked network), which is
also beat N1.

**B2. The session-shape implant (BadUSB) still has no named trigger surface, and the device
consumption races (5.5, 6, N12; R1 B2 not fixed).** The validator rule (9.2) requires a
`grant_foothold`'s `pc` to be a sign-in object, and a sign-in PC never runs
`triggerOnInteract` / the `requiresItem` branch: `interactions.js:925-936` returns into
`interactLoginPc` first and the comment states "It never runs the generic flow below (no
triggerOnInteract, no unlock, no pickup)". The dropped shape is fine (an NPC-used global
fires a timer's `grant_foothold` through `applyActions`). The session shape — "the player
plugs a device into a PC they already hold a session on" — has no path: the plan says only
"the client fires it from `apply-actions.js` … when the action runs", but names nothing that
*runs* the action for a player standing at a sign-in PC. The author cannot attach the trigger
to the PC itself. The plan must name the trigger surface (a desk-side prop object carrying
`triggerOnInteract`/`requiresItem` with the `grant_foothold` action, or a tray-item action,
or an action-menu entry offered while the session and `needsHeld` are both held), say which
file adds it and which stream owns it. It must also resolve the consumption: 5.5 precondition
3 has the server remove `needsHeld`, but if the trigger reuses `requiresItem`/`consumesItem`
the client's `removeFromInventory` fires first and the server's "inventory holds `needsHeld`"
check then fails. State that the session-shape trigger must *not* use `consumesItem` and that
the server removes the device. Without this, a builder cannot build N12.

**B3. The Wi-Fi key prompt rests on a password-minigame "key mode" that does not exist
(5.3, 12 C row; R1 B3 not fixed).** `password-minigame.js` has two modes: the plain password
form, which posts `POST /unlock` through `validatePasswordWithServer` (:619+), and sign-in
mode (`params.signIn`, :151). Neither posts to `/network/join`, and neither is a "key mode".
The plain form also keeps a client attempt counter (`maxAttempts`, default 3, :137), which
contradicts 5.3's "a wrong key is not counted". The 12 table still says "(Wi-Fi key mode,
already present for keys)", which is false against the code. The plan must design the new
mode: its params, a `POST /network/join` through a new `ApiClient.networkJoin`, no attempt
limit, the 422 `wrong_key` and `already` handling, and the `window.__test` state it exposes;
and it must list that work in stream C's steps, not assert it is already there.

## Major

**M1. Signing out of a pivot host leaves the onward sessions behind with no cascade and no
greyed row (5.1, 6, 8, N4; R1 M1 not fixed).** `logout_session!` deletes one key and does
nothing else (`game.rb:1599-1605`); section 6 does not change `POST /logout`. When the player
signs out of the pivot host, the onward session on the far network survives in `sessions`,
`player_reach` no longer includes that network (the pivot is gone), so `network_view` drops
it — but because the network is not *down*, 5.2's greyed "no route" row does not apply, so the
onward session goes silently missing, which 5.2 says must never happen. N4's server record
("No `server_net` session") is then false. The same happens on every reload that ends a
*claimed* pivot (`end_claimed_sessions!`, `game.rb:1616`), since pivots may rest on claims
(5.1). Fix: define a cascade — when any session ends (logout, unplug, reload-claim-end),
recompute each foothold's `player_reach` and end every session whose network is no longer
reached, report them as `endedPcIds` (as `end_sessions_through!` already does,
`network_access.rb:240`), and handle them in `pc-sessions.js`. Say what happens to onward
desktops when a reload ends a claimed pivot.

**M2. The scoped-request route test trusts a foothold the browser sends, and its gate is too
narrow (5.2, 6; R1 M2 not fixed).** 5.2 and the `GET /container` / `POST /inventory` /
`POST /unlock` rows in 6 still ask the client to thread `foothold` onto scoped requests and
re-judge "in a scenario with any network `downIf`". A tampered client that omits `foothold`
falls back to 9.3a's "a session exists is enough" and is not re-judged — the secret behind a
down route then serves. The route is already on the server: `sessions[pc]['foothold']`
(`start_login_session!`, `game.rb:2010-2017`). Derive it there — a session with a `foothold`
is re-judged on `player_reach`, a local session (no `foothold`) is judged as today — and do
not read the request's `foothold`. The gate is also wrong: once links exist a pivot can
vanish with no outage (M1), so gate on "the session carries a foothold" (plus links or a
network `downIf` present), not on `downIf` alone.

**M3. The greyed "no route" block cannot be computed from the functions as defined, it
leaks a network name, and 5.2 / 7 / N5 disagree (5.2, 6, 7, N5; R1 M3 not fixed).**
`reach_from` and `player_reach` both skip down networks, so a down network that *would* be
reached through a pivot is never in the foothold's set — nothing then exists to draw greyed.
The plan needs a second walk ("reach if every network were up", over `reach_paths`) and must
say which one the view uses; it does not. Worse, the texts contradict on naming and it is a
leak: 5.2 shows "<name>: no route" (names the network); 7's `GET /network` row says "no new
name"; the no-exposure test says no response names a network the foothold does not reach;
and N5 (a network down from the start, reached by nobody) says "Its block shows 'no route'".
If a down-by-default network the player has no pivot session to is named "server_net: no
route", its name has leaked with no session — breaking the exact rule 9.3b exists to teach.
Decide: a never-reached down network is **not shown at all** (named only once a live-up pivot
reaches it); a down network the player *did* reach through a now-up pivot but whose own
`downIf` is true may show greyed with its name (the name already leaked legitimately). Make
5.2, 6, 7, N5 and the no-exposure test say one thing.

**M4. `reach_conditions` ignores the station's own-network outage (5.1; R1 M8 not fixed).**
5.1 keeps "a resource on the station's own network returns `[[]]`" unchanged
(`network_model.rb:177-178`) while a cross-network route carries every path network's
`downIf`. So when the station's own network has a `downIf` and goes down, the NPC-work
composer (9.2, the one consumer of this function) still reads the same-network resource as
always reachable — the commonest outage case, and the one 9.3b newly makes possible. State it
once: a same-network route is `[[station network downIf]]` when the station network has one,
`[[]]` only when it has none. Add the test. (This is a change to the shared `reach_conditions`
output, so coordinate with 9.2 per section 12.)

## Minor

**m1. No way to end a Wi-Fi or implant foothold, and the plan is silent (6, 8; R1 M6
remainder).** `unplug_device!` resolves through `find_jack`, which requires
`networkJack: true` (`network_access.rb:95-103, 212-214`), so `POST /network/unplug` 404s for
an AP or a PC; the link item's click only opens the view (`interactions.js:943-946`). The plan
fixes the link-item *name/sprite* (5.3) but never says whether a Wi-Fi join or an implant can
be ended. Either state explicitly that Wi-Fi and implant footholds are permanent for this
slice (acceptable, but say so in 5.3/5.5/8 and the open questions), or add a route/control and
own it in a stream.

**m2. The implant route is still underspecified (5.5, 6; R1 M11 partial).** (a) Params
"`pc_id`, `shape`, the action's own fields" do not pick one action when a PC has two
`grant_foothold`s of the same shape; name the action by its declared path and add a validator
error for duplicates. (b) 6's check order puts "already held" (check 4) after the
preconditions, so a repeated session-shape implant whose device the first call consumed
answers `not_ready`, not `already`; move the already-held check to just after check 1.
(c) A timer that fired is saved fired and does not re-run after reload
(`ui/scenario-timer-dispatcher.js`), and nothing retries a failed `POST /network/implant`, so
one dropped answer loses the foothold for good; await it with one retry.

**m3. The implant foothold record stores no `name`, but `link_item_for` reads one (5.5, 5.3;
R1 m10 not fixed).** 5.5's success writes `footholds["implant_<pc>"] = { via, network,
source, device, seq }` — no `name` — yet 5.3's implant branch builds the link item "name from
the action's `name`". After a reload the action is not in hand. Store `name` on the foothold
record (and the sprite source), or say `link_item_for` re-derives it from
`grant_foothold_actions` by `pc` and shape.

**m4. Section 2 understates what is already on `main` (2, 5.5, 12).** The client USB policy
(`systems/pc-policy.js`: `usbRefused`, `plantRefusal`, `usbClass`) is present in this
worktree, and `interactions.js:985` calls `plantRefusal`, while the *server* side
(`access_work.rb`) is absent. So 2's "9.2's sub-slice U … is not assumed present in `main`" is
half-wrong. The "whichever lands second installs `usb_refused?`" hook is still a safe default
(no USB check until the server piece lands), but say plainly that only the client half is
present, so the builder is not surprised. If the implant route answers every failed
precondition `not_ready`, keep a distinct `reason: "usb_refused"` (R1 M4) once the hook is
live, so the authored refusal line is not lost.

**m5. Un-reserving must be per field, per sub-slice, not "the five refusals" (9.1, 3; R1 m2
not fixed).** `NETWORK_RESERVED_OBJECT_FIELDS` groups `wifiAp`, `portSecurity`,
`portSecurityMessage` and `NETWORK_RESERVED_NETWORK_FIELDS` groups `downIf`, `wifi`
(`validate_network.rb:15-17`). In the K→O→W→P→I order each sub-slice must remove only its own
names from these constants, or a field is accepted before its code exists. "Removes the five
refusals" also miscounts — there are four guard blocks over seven names. Say which names each
sub-slice un-reserves.

**m6. Schema: `grant_foothold` is not in the `triggerOnInteract` type enum, and the schema
tracks no routes (9.1; R1 m7 not fixed).** `grant_foothold` must be added to the action type
enum at `scenario-schema.json:5168` (and wherever else an action's `type` is enumerated), or a
clean fixture fails schema validation. 9.1's "adds `network/join` and `network/implant` to the
routes list where the schema tracks them" is a no-op — the schema has no routes list; drop
that clause.

**m7. Determinism gaps in the pivot view (5.1; R1 m6/m11 carry-over).** `reach_paths` is
"shortest first, capped at eight", but ties between equal-length paths have no order — sort
ties by the joined id list so 9.2's `routes` and the tests are stable. The view's `via` label,
when one network is reached through two pivot hosts, has no fixed rule — pick the lowest `seq`
(or by id) and say so.

**m8. Section 10's early-return claim is wrong (10; R1 n2 not fixed).** The table says
`check_network_model` "returns early when the scenario has no networks". It returns early only
for a non-Hash (`validate_network.rb:25`); it must keep checking so a stray `networkLinks`
with no `networks` is still caught. Reword, and keep the reserved/link checks outside any
no-networks short-circuit.

**m9. The 9.2 hand-off "a station that is down, seen from the network" is dropped (5.2, 6,
11; R1 M10 not re-addressed).** The `affordance.offWhen` "not responding" host row and its
desktop refusal that 9.2 assigned to 9.3b (its section 15) appears in no behaviour, route
check, row field or beat here. Add it to sub-slice O with a beat, or record it as left out
with 9.2's written agreement.

## Nit

- **n1.** Section 4's example timer uses `"triggerEvent"` (line ~160); timers start on
  `startOnGlobal`. Fix the example so a builder does not copy a dead key.
- **n2.** `scenario-timer-dispatcher.js` lives under `public/break_escape/js/ui/`, not
  `systems/`; section 12's and R1's path should match.
- **n3.** 5.2 derives `truthy?` from "JavaScript's truthiness, the string `"false"` included";
  specify it as matching `npc-work.js`'s `truthy`, not JS in general (which also makes `NaN`
  falsy, irrelevant to globals but a wrong spec to copy).
- **n4.** Join check 3 (6) says the server "emit[s] `network_joined`"; events are emitted by
  the client from the answer, as 9.3a's plant does (`network-links.js:406-407`). Reword to
  "the client emits".
- **n5.** The port-security refusal body uses `message` (5.4, 6) while every 9.3a plant
  refusal uses `error` (`network_access.rb:172-185`). Keep one key, or the new `plant()`
  branch must read the other.

## Verdict

Not build-ready. The plan is marked "build-ready" but all three of R1's blockers are still
open, including the one that matters most for the security model: B1 lets a bare jack foothold
read a linked network's name, hosts and resources with no pivot, which is the exact leak this
slice exists to prevent and which its own beat N1 asserts cannot happen. B2 leaves a whole
sub-slice beat (the session-shape implant) with no trigger a builder could implement, and B3
rests client Wi-Fi entry on a minigame mode that does not exist. The majors (silent onward
sessions on sign-out, a client-trusted route foothold, an uncomputable and name-leaking "no
route" block, and the own-network outage the NPC model never sees) each need a decision and a
test before build. The enumerator work the task flagged (`grant_foothold_actions` reusing
`DeclaredGrants.executed?`) is, by contrast, correct and well-grounded. Fix B1–B3, answer
M1–M4, and fold the minors, then a third round.

Counts: 3 Blocker, 4 Major, 9 Minor, 5 Nit.
