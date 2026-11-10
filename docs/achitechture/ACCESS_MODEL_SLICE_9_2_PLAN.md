# Access model slice 9.2: work, frustration, workarounds, USB policy and social media

Status: **design for review, 2026-11-10.** Nothing here is built. This plan replaces the sketch in
section 9.2 of `ACCESS_MODEL_PLAN.md` (called "the first slice plan" below) and is checked against
the code on the access design branch and against the sibling plans
`ACCESS_MODEL_SLICE_9_1_PLAN.md` (awareness and habits) and `ACCESS_MODEL_SLICE_9_3_PLAN.md`
(networks) as they stand on the same day. The expected build order is 9.3, then 9.1, then this
slice; section 15 says what changes if the order differs.

How to read it: section 3 gives the six sub-slices and their order. Sections 4 to 8 are the
design. Section 9 lists every server route with its checks, what the browser receives, what a
tampered browser can still get, and what a saved game holds. Section 10 is the validator, schema
and dungeon graph. Sections 11 to 13 are the tests, the build steps and the parallel streams.
Section 16 lists the decisions.

## 1. Why

The first slice gave NPCs identities and made a captured identity work wherever the scenario's
access lists admit it. What it lacks is a reason for staff to behave insecurely that the player can
**cause and watch**. This slice adds that reason:

- Staff have **work to do**, and their work depends on **resources** (a file share, email, a
  printer) and on their own PC working.
- When work fails, **frustration** rises, and it shows. A frustrated member of staff takes
  **workarounds**: sticks the password on the monitor, props a door open, works at a hot desk and
  walks off signed in, tells a colleague their login out loud.
- Every workaround is a visible act in the room and every one **opens something** the first slice
  already knows how to use: a password for a sign-in PC, a room, a claimable session, a capture.
- **Policy** (USB blocked, social media blocked) is a technical control the player can watch
  working, and watch staff route round.
- A **social media** need makes staff post. Posts are revealed one at a time into the existing
  social media browser, where a post can carry a fact the player notes and uses.

Chaining is the point (first slice plan, section 2). The intended shape of a puzzle built on this
slice is: the player causes an outage or a lockout, a named person gets visibly frustrated, their
workaround opens a session or a door, and what is behind it holds the next credential.

What it teaches: usable security. A control that stops people working gets worked round, and the
workaround is usually worse than what the control prevented. Blocking social media on PCs moves it
to personal phones. Blocking USB storage stops a dropped memory stick and does not stop a device
that pretends to be a keyboard. A lockout that protects a password is also a way to deny its owner
their own PC.

## 2. What the code does today

Facts this plan builds on, each checked on 2026-11-10.

| Fact | Where |
|---|---|
| The needs system is pure logic over a `world` adapter, with no static imports. Needs, levels, jobs and the decision log all live in the browser; the server never sees an NPC move or use anything | `public/break_escape/js/systems/npc-needs.js` (`NPCNeedsSystem`, `createEngineWorld` at `:1434`) |
| A use completes in `_completeJob` (`:1047`): it adds the object's `restores` to the need when the object's `affordance.satisfies` lists it (`:1054`), emits `npc_used:<objectId>` and applies the NPC's `onUse` hook. There is no notion of a use that fails once the NPC has arrived | `npc-needs.js:1047-1092` |
| The selector takes each urgent need in turn and asks `_useCandidate` (`:815`) for a free, permitted, reachable object whose `affordance.satisfies` names the need, preferring the NPC's own `needsHome` object. Every job targets an object, and a target another NPC's job names counts as claimed (`_claims`, `_free`, `:723-754`). An NPC cannot satisfy a need where it stands | `npc-needs.js:723-847` |
| Needs state is created when an NPC's room loads (`register`, `:228-272`) and `reset()` clears it. Nothing about a needs NPC exists before its room is loaded | `npc-needs.js:228-302` |
| A carry job delivers a tagged item to an object whose `affordance.accepts` lists the tag (`_carryCandidate`, `:849`). Nothing reads a policy | `npc-needs.js:849-864` |
| World bubbles draw `getState().talking`, which `_talking` (`:1352`) reads from pair records in `_chats`. There is no line said by one NPC alone. `_pressing` (`:1388`) and `_blockedNeed` (`:1401`) feed the icons | `npc-needs.js:1352-1408`, `systems/npc-world-bubbles.js` |
| The need name `social` is already in use: the water cooler preset satisfies `["thirst", "social"]`, and `test_needs_sims` gives two NPCs a `social` need. It means talking to colleagues | `public/break_escape/js/data/office-presets.json:6`, `scenarios/test_needs_sims/scenario.json.erb:385, 517` |
| Policies exist with four fields. `autoLockMin` and `maxAttempts` are read (client `policyFor`, `workstation-state.js:370`; server `effective_policy`, `game.rb:1373`). `usb` and `social` are accepted by the schema (`scripts/scenario-schema.json:190-191`, each `allowed` or `blocked`) and read by nothing. A PC with no `policy` takes `defaultPolicy` | as listed |
| `withhold_npc_secrets!` already deletes `creds`, `awareness`, `habits`, `role` and `workarounds` from every room NPC (`WITHHELD_NPC_KEYS`, `game.rb:3968`). `needs`, `interests`, `needsHome`, `usePayload` (minus its secret) and every other NPC field ship | `game.rb:3961-3988` |
| The bootstrap ships every top-level key as authored except `flags` and `accountProfiles`; rooms are cut to an allow list. The whole `social` block ships with only capture secrets stripped (`:895`), so every `social.intelFacts` entry, with its text, is in the browser from the first request | `filtered_scenario_for_bootstrap`, `game.rb:824-898` |
| A sign-in PC is a workstation. A click with any session held opens that session's desktop before the workstation layer is asked (`unlock-system.js:219-222`). An unowned one answers `signin` to every click; a claim needs an owner, on the client (`onInteract`, `workstation-state.js:314-332`) and on the server (`claim_login_session!`, `game.rb:1446-1475`), and is refused while a session is held (`:1458`). `workstation_owner_returned` ends only a claimed session (`pc-sessions.js:249-254`) | as listed |
| `GET /login_accounts` checks that the PC exists and is reachable and returns the account tiles | `games_controller.rb:1106-1114` |
| `/capture_secrets` serves an account holder's password only when that NPC has a capture route (a `usePayload`, or an `eventMappings[].addCapture`), against `se_captures`, a global the browser writes | `game.rb:907-976` |
| A door unlock unlocks the room, composes its room data and records its NPCs as encountered (`track_npc_encounters`) before it answers | `games_controller.rb:918-930` |
| The server sets a task's declared `setGlobal` into `player_state.globalVariables` itself | `apply_task_set_globals!`, `game.rb:3755-3777` |
| `player_state.currentRoom` is the room the browser last reported in a state sync | `games_controller.rb:1581-1588` |
| `window.unlockDoor(doorSprite, roomData)` opens a door (`doors.js:703, 723`), `NPCGameBridge` finds every door sprite to a room (`npc-game-bridge.js:113, 183`), and an opened door never closes again | as listed |
| The social media browser is the `osint-browser` minigame. Its data is `social.osint.sites[]`; a site of `type: "social"` has `profiles[]`, each `{ person, name, showIf, posts, blocks }`. A post is a block: with an `id` it is a button, and clicking it grants the post's `fact` through `grantFact`, which refuses an id that `social.intelFacts` does not hold, writes `se_intel_<id>` and adds an evidence note with the fact's text | `minigames/osint-browser/osint-model.js:57-68`, `osint-browser-minigame.js:378-397, 567-593, 648-690`, `systems/social-intel.js:184-217` |
| The browser is opened from an object of type `osint-workstation`, limited to `minigameData.siteIds` and started at `minigameData.start` | `systems/minigame-starters.js:1185-1203` |
| A `requiresItem` object fires its actions when the player holds the named item, with `consumesItem` leaving it there. A sign-in PC returns before this code runs | `systems/interactions.js:797-806, 818-850` |
| Mapping conditions support `===`, `!==`, `>=`, `<=`, `>`, `<` on `data.*` and `globalVars.*`, joined with `&&`; text variant conditions support the same comparisons on globals | `npc-manager.js` `safeEvaluateCondition`, `utils/global-condition.js` |
| The test bridge's access functions live in `systems/test-bridge/access.js` | as listed |
| Art that exists: `assets/objects/notes_postit1.png`, `fire_extinguisher1.png`, `phone.png` to `phone5.png`, `usb_bowl1.png`; `assets/icons/npc-blocked.png`, `npc-social.png`, `npc-work.png`. There is no phone-in-hand pose in the standard animation set | `public/break_escape/assets/` |

**Where the sketch in 9.2 was out of date or would not work.**

- The feed was "kept distinct from the social media browser's `social.landingPages[].profiles[].posts`".
  There is no such path. Profiles live at `social.osint.sites[].profiles[]`, and the browser
  already renders posts and grants their facts, so this plan reveals NPC posts **into** that
  browser. A separate `social_feed` object type is not needed.
- A post's value is the fact it carries, and facts ship in the bootstrap. Withholding the post
  alone would withhold nothing, so this plan withholds the fact with it.
- A need called `social` would collide with the cooler's. The social media need is `social_media`.
- "`work` is not restored and frustration rises" needs three things the needs system lacks: a use
  that can fail, a wait before the NPC tries again (without one the NPC would start the same use
  again on the next tick, for ever), and something for the NPC to do meanwhile.
- "The NPC's own phone, used where they stand" needs a job with no target object.
- `borrow_session` "picks another PC they may sign in to": the choice has to be authored (a named
  PC), because the claim the player then makes must be one the server can find in the scenario.
- `prop_door` "until a global or timer closes it": an opened door cannot close (only gate doors
  toggle), so a propped door stays open for the mission.
- Workarounds run in the browser, where the needs system is, yet `workarounds` is withheld. So the
  server has to hold the frustration level and hand each workaround over when it is due.
- A resource failing for everybody does not make working at another PC help. This plan adds a
  failure that belongs to one PC (`downIf` on the PC, and a lockout of its owner), which is what
  gives the hot desk workaround a point.
- `writes_down` "turns on `writesDown`": slice 9.1 serves a written-down password only from
  `GET /login_accounts`, never in room data. This plan uses that channel.
- "The PC's network reaches the resource's network": slice 9.3 never sends networks to the
  browser, so reach for an NPC's work is composed on the server.

## 3. Sub-slices

Six sub-slices, in this order. Each ends playable and tested and has its own steps in section 12.

| Sub-slice | Contents | Feature scenario beats |
|---|---|---|
| **U. The USB policy** (first) | The `usb` policy field, `usbClass` on items, a refused NPC and a refused plant. No route, no saved state, no frustration | `test_access_work` U1 to U3 |
| **A. Work, outages and frustration** | Resources, work needs by role, the use verdict, failed uses and the retry wait, the check errand, frustration held on the server and shown on the NPC | W1 to W6 |
| **B. Workarounds, part one** | The server hands workarounds over as thresholds are crossed. `writes_down`, `prop_door`, `emit`. The dungeon graph. No session work | X1 to X4 |
| **H. Workarounds, part two: the hot desk and the shared login** | `borrow_session` with guest sessions; `share_login` | H1 to H5 |
| **L. Lockout as a cause** | A member of staff locked out at their own PC cannot work there | L1 |
| **C. Social media** | The `social_media` need, the phone, the `social` policy field, the feed served post by post with its facts, the browser merge | `test_access_social` F1 to F8 |

U is first because it depends on nothing else here and nothing depends on it; it shares only the
needs module with A. A comes before B because workarounds stand on the verdict and on frustration.
A is worth playing on its own: failed uses empty desks and send owners walking to broken things,
which already opens sessions. B is split from H because H changes the workstation and session
layers and B does not. L waits until the hot desk works, because the hot desk is what a locked-out
person does. C stands on A and, for one beat, on H; it is last. None of the six needs networks.

## 4. Scenario fields

All new fields in one place. The sections after this say what each does.

```jsonc
{
  // top level
  "resources": {
    "finance_share": { "name": "Finance share", "kind": "file_share",
                       "access": { "roles": ["finance"] }, "downIf": "finance_share_down" },
    "email":         { "name": "Email", "kind": "email" },
    "printer_2f":    { "name": "Second floor printer", "kind": "printer",
                       "object": "office_printer", "downIf": "printer_jammed" }
  },
  "roles": {                                   // defaults for NPCs with that role, never grants
    "finance": { "workNeeds": ["finance_share", "email"] },
    "staff":   { "workNeeds": ["email"],
                 "frustration": { "perFail": 25, "easePerSuccess": 10, "retryMin": 1, "breakDrain": 10 } }
  },
  "policies": {
    "corp_default": { "autoLockMin": 5, "maxAttempts": 5, "usb": "storage_blocked", "social": "blocked" }
  },
  "globalVariables": { "finance_share_down": false, "printer_jammed": false,
                       "finance_door_propped": false }
}
```

```jsonc
// a room NPC
{ "id": "jake", "role": "finance", "creds": { "username": "jbrooks", "password": "..." },
  "needsHome": "jake_pc",
  "needs": { "work":         { "decayPerMin": 6, "urgentAt": 50, "initial": 80 },
             "social_media": { "decayPerMin": 4, "urgentAt": 40 } },
  "workNeeds": ["+printer_2f", "-email"],      // changes to the role defaults
  "frustration": { "perFail": 50 },            // overrides the role defaults field by field
  "workarounds": [
    { "at": 50, "do": "writes_down" },
    { "at": 50, "do": "borrow_session", "pc": "hot_desk" },
    { "at": 75, "do": "share_login", "with": "dana" },
    { "at": 90, "do": "prop_door", "door": "finance_office", "prop": "finance_door_wedge",
      "setGlobal": "finance_door_propped" },
    { "at": 90, "do": "emit", "event": "jake_gave_up" }
  ],
  "phone": true,                               // default true; false: no phone
  "feed": { "site": "friendface", "person": "jake", "posts": [
    { "id": "jake_post_biscuit", "text": "Biscuit turns 5 today! Best boy.", "fact": "jake_pet_name" },
    { "id": "jake_post_crete", "text": "Back from Crete, 300 emails waiting..." } ] } }
```

```jsonc
// objects
{ "id": "jake_pc", "type": "pc", "lockType": "login", "locked": true, "policy": "corp_default",
  "downIf": "jake_pc_unplugged" }              // a workstation that is out of order while true
{ "id": "kit_usb", "type": "usb", "needsTag": "dev_usb", "droppable": true,
  "usbClass": "storage" }                      // "storage" | "hid"
```

| Field | On | Sub-slice | Meaning |
|---|---|---|---|
| `resources.<id>` | top level | A | `name` (shown in events and the debug overlay), `kind` (a free label), `access` (an access list as in the first slice; absent: everyone), `downIf` (a global name; the resource is down while it is truthy), `object` (a room object the resource is tied to). Slice 9.3 owns `network`, `host`, `contents` and `observations` on the same entries; this slice neither reads nor requires them |
| `roles.<role>` | top level | A, B | Defaults for NPCs with that role. This slice owns `workNeeds` (A), `frustration` (A) and `workarounds` (B). Slice 9.1 owns `awareness` beside them. Never a grant: rights stay in access lists |
| `workNeeds` | room NPC | A | A list of resource ids. `"x"` or `"+x"` adds, `"-x"` removes, applied to the union of the NPC's roles' lists (roles in authored order, `staff` last) |
| `frustration` | room NPC, role | A | `perFail` (default 25, 1 to 100), `easePerSuccess` (default 10, 0 to 100), `retryMin` (default 1, 0.25 to 10, game minutes before a failed need is tried again), `breakDrain` (default 10, 0 to 50, points taken off every other need on a failure) |
| `workarounds` | room NPC, role | B, H | A list of `{ at, do, ... }` (section 6). The NPC's own list replaces the role's; it is not merged. Any entry may carry `setGlobal`, a declared global the server sets true when the workaround is done |
| `downIf` | workstation object | A | The PC does no work while the global is truthy |
| `usbClass` | item | U | `storage` or `hid`. Only items with it are subject to a `usb` policy |
| `policies.<id>.usb` | top level | U | `allowed` (default), `storage_blocked`, `blocked` (section 7) |
| `policies.<id>.social` | top level | C | `allowed` (default) or `blocked` (section 8) |
| `needs.social_media` | room NPC | C | An ordinary need by a reserved name (section 8) |
| `phone` | room NPC | C | `false`: the NPC has no phone. Default true for an NPC with a `social_media` need |
| `socialUse` | room NPC | C | Optional `{ restores, useSeconds }` for a social media use (defaults 60 and 20) |
| `feed` | room NPC | C | `site` (a `social.osint.sites` id of type `social`), `person` (the profile's `person`), `posts` (blocks as the browser renders them: `id`, `text`, `fact`, `date`, `note`), and per post `deliberate: true` to silence the awareness warning. The shape is `feed.posts[]`, not a bare list |

`workNeeds`, `frustration`, `workarounds` and `feed` are allowed only on room NPCs, for the reason
`role` and `creds` are (first slice plan, section 3): every other NPC record reaches the browser
unfiltered.

Engine-owned globals: `<npcId>_frustration` (a number, 5.4). The validator treats the suffix as
reserved and known, so a condition that reads one is not reported as undeclared, and an authored
global may not end in it.

## 5. Work, failed uses and frustration (sub-slice A)

### 5.1 The use verdict

When an NPC completes a use for the need `work` (the need name the office presets already give
desk PCs) or `social_media` (section 8), the use is **judged**. No other need is judged. For `work`
every failure is collected:

1. **The station.** The object used has a `downIf` whose global is truthy: `station_down`.
   Sub-slice L adds a second station failure, `locked_out` (6.6).
2. **Each resource in the NPC's resolved work list**, in order:
   - its `access` does not admit the NPC: `no_access` (fixed for the whole mission);
   - its `downIf` global is truthy: `down`;
   - the station cannot reach it: `unreachable` (below).

No failures: the use is **met** and everything happens as today. An NPC with no resolved resources
at a station with no `downIf` is always met, so every existing scenario behaves as it does now.

The verdict is a pure function in a new module, `public/break_escape/js/systems/npc-work.js`
(`useVerdict(plan, need, station, globals)`, no imports, so node tests load it directly).
`NPCNeedsSystem` reaches it through the world adapter: `world.useVerdict?.(npcId, need, obj)`. A
world without the method (every existing node test) treats each use as met, and the decision log
for a scenario without these fields stays byte for byte the same.

**The NPC's plan.** The client cannot work the verdict out from the scenario, because `role`,
`workNeeds`, `roles` and `resources` do not reach it (9.2). The server resolves each room NPC's
plan and attaches it to the NPC in room data as `work`:

```jsonc
"work": { "retryMin": 1, "breakDrain": 10,
          "needs": [ { "id": "finance_share", "name": "Finance share", "kind": "file_share",
                       "admitted": true, "downIf": "finance_share_down",
                       "routes": [ ["server_net_down"], ["backup_link_down", "server_net_down"] ] },
                     { "id": "printer_2f", "name": "Second floor printer", "kind": "printer",
                       "admitted": true, "downIf": "printer_jammed", "object": "office_printer" } ] }
```

It holds the server's answer to "is this person admitted", not the role or the access list. NPC
records are built with `Object.assign` (`npc-manager.js` `registerNPC`), so `work` arrives on the
record the adapter reads.

**Reach is composed on the server.** No network id, link or resource `network` is ever in the plan.
Where slice 9.3 is built and the scenario has `networks`, each need gains `routes`: the answer of
9.3's `NetworkModel.reach_conditions(station_network, resource)` for the NPC's home workstation, a
list of routes, each a list of the `downIf` global names along it. The browser's test is one pure
function in `npc-work.js`, `reachable(need, globals)`: a need with no `routes` key is reachable; an
empty list of routes is never reachable; otherwise it is reachable when some route has no truthy
global. Where 9.3 is not built, or the scenario has no `networks`, the server sends no `routes` and
every resource is reachable. A use at a PC that is neither the NPC's home nor a borrowed PC is
judged with the home station's routes; a borrowed PC's routes arrive with the borrow (6.4).

### 5.2 A failed use

`_completeJob` (`npc-needs.js:1047`) asks for the verdict before it restores anything. When the use
is not met:

- The need is **not restored** and `lastSatisfiedAt` does not move.
- Every other need of that NPC loses `breakDrain` points (not below 0). A person who cannot work
  goes for coffee sooner, so an outage empties desks through the needs the NPC already has.
- The failed need waits: `s.needRetryAt[need] = clockMs + retryMin` game minutes. `_select`
  (`:788`), `_anyUrgent` (`:781`), `_pressing` (`:1388`) and `_blockedNeed` (`:1401`) skip a need
  that is waiting, so the NPC does not start the same use again on the next tick, does not wander
  to a colleague's PC to try there, and shows no pressing-need bubble for it.
- `onUse` hooks still apply, except `revealOutput` (nothing was produced).
- `npc_used:<objectId>` still fires, with two added fields: `met: false` and `missing` (a list of
  `{ id, why }`; the station is `{ id: <objectId>, why: "station_down" }`). A met use carries
  `met: true`. Existing mappings are unaffected unless they choose to read the field.
- `npc_use_failed:<npcId>` fires with `{ npcId, objectId, need, missing, station }`, where
  `station` is true when a station failure is among them.
- The decision log gains `use_failed` (`need`, `target`, `missing` as ids).
- The NPC **mutters** (5.5).
- The use is reported to the server (5.4).
- A **check errand** is queued (5.3) for the first failure that is a resource which is `down` and
  has an `object`, once per outage: the needs state remembers the resource as checked until that
  need is next met, so the NPC walks to the printer once, not every minute.

A met judged use restores as today and, when the NPC's frustration is above 0, is reported as an
ease. A met coffee or cooler use is not judged and eases nothing.

### 5.3 Errands

An errand is a walk the needs system is told to make instead of choosing it: go to a named place,
stay a few seconds, come back. Two things queue them: the check errand above, and a workaround
handed over by the server (section 6).

- `NPCNeedsSystem.enqueueErrand(npcId, { kind, at, useSeconds, data })` appends to `s.errands`.
  `at` is `{ objectId }` or `{ npcId }`. In `_tickNpc` (`:597`), an idle or returning NPC with an
  errand whose place exists and is reachable starts it before the selector runs. A running job is
  never interrupted.
- The job uses the machinery every use job has: the wind-up, `npc_left_post` (so the workstation
  layer rolls the screen as for any leave), the walk, the dwell (`errand.useSeconds`, else 8), the
  walk back and `npc_returned_post`. An errand at the NPC's own `needsHome` object is an at-post
  job and never leaves the desk.
- An errand to an object stands at its approach cell; the object needs no `affordance`
  (`world.getObject` describes any object and `approachCell` falls back to the nearest walkable
  cell, `npc-needs.js:1612-1627`). An errand to an NPC stands in a free cell beside where that NPC
  is when the errand starts (a new adapter method, `cellBeside(npcId)`, on the pattern of
  `besideCell`, `:1692`).
- **An errand claims nothing.** `_claims` (`:723`) and the workstation layer's "who is using this"
  (6.4) both skip errand jobs, so a colleague standing at a desk to talk, or a person looking at
  the printer, never blocks or counts as its user.
- An errand honours the room leash and ignores `private`, as a delivery does.
- On completion an errand restores nothing, applies no `onUse` hook and does **not** emit
  `npc_used`. It emits `npc_errand_done:<npcId>` with `{ npcId, kind, at, data }` and logs
  `errand_done`. A check errand also emits `npc_checked:<objectId>`.
- A place that is not loaded or not reachable is retried once a second. A check errand is dropped
  after 60 seconds of the needs clock. A workaround errand is dropped after 120 and reported as
  dropped (section 6), so it cannot block the queue.
- `reset()` clears the queue. After a reload the server sends undone workarounds again (9.4).

### 5.4 Frustration lives on the server

Frustration is one number per NPC, 0 to 100, kept in `player_state.npcFrustration` (9.4). The
browser reports and mirrors; the server decides. This is what lets `workarounds` stay withheld
until each one is due, and it makes the level survive a reload without any client state.

- **Reporting.** After a failed judged use the adapter calls `world.reportUse(npcId, { event:
  "fail", need, objectId, missing })`, and after a met judged use with frustration above 0,
  `{ event: "ease", need, objectId }`. A small client module, `systems/npc-reports.js` (new),
  queues reports and sends them together, at most one `POST /npc_frustration` every two seconds,
  at most 20 reports in one request (9.1).
- **The answer**, per report: `{ npcId, level, previous, tell, settled, run }`. At the next tick the
  needs system stores the level (`s.frustration`, in `getState()` and the debug overlay as an `F`
  bar), sets the global `<npcId>_frustration` to the number (so text variants can say "she looks
  close to giving up" on `globalVars.dana_frustration >= 50`), and emits
  `npc_frustration_changed:<npcId>` with `{ npcId, level, previous, tell }`. `run`, when present,
  is a workaround to perform (section 6); it is null throughout sub-slice A.
- **Stopping.** `settled: true` means another failure can change nothing: the level is 100,
  nothing is handed over and waiting, and no repeating workaround is in force. The client then
  sends no more fail reports for that NPC until it has sent an ease. An NPC with a resource it is
  never admitted to therefore reports a handful of times and then falls silent.
- **Stale reports.** The server compares each reported cause with its own view (9.1). Its copy of a
  global can be a few seconds behind the browser's. A report none of whose causes holds on the
  server is answered `{ stale: true }` with nothing written; the client runs a state sync and
  sends the report once more.
- **Reload.** The scenario response carries `npcFrustration`. `core/game.js` hands it to the needs
  system where it hands `sessions` to `pc-sessions.js` (`core/game.js:1663`). No needs state exists
  at that point, so the system keeps the map and applies each NPC's entry in `register`, when the
  NPC's room loads: the level, the global, `tell`, and (from sub-slice B) the pending errands.
- **Determinism.** In sub-slice A nothing in the needs decision depends on an answer (the retry
  wait and the drain are applied at once from the plan), so the decision log stays a function of
  the seed and the player's actions. From sub-slice B an answer starts an errand, so when a
  workaround begins depends on how soon the answer arrives; needs tests for B onward assert the
  order of events, never tick numbers. In node tests the stub answers at once.
- A lost request loses one step of frustration and nothing else: the next report carries on from
  the server's number.

### 5.5 What the player sees

A workaround is only an opening if the player can see it coming. All of this uses existing art.

- **`tell`**, sent with every answer and on a reload, is 0, 1 or 2. It is 0 at level 0; 1 once any
  failure has been counted; 2 when one more failure would bring a workaround into force, or one is
  already in force (for an NPC with no workarounds, at level 67 or above). It says "getting
  closer" without sending a threshold or naming a workaround.
- **The icon.** For 4 seconds of the needs clock after a failed use `getState().failed` is
  `{ need, missing }`. While `tell` is 1 or 2 the action icon slot shows the existing `blocked`
  icon whenever the NPC has no job; at `tell` 2 it pulses, with the slow pulse the pressing-need
  bubble already has (off under reduced motion). This does not wait for `showPressingNeeds`: a
  scenario that declares resources has opted in. The icon stays up between failures, so "one more
  and she gives up" looks different from "just started", and it works with `"chatter": false`.
- **The mutter.** One line in a world bubble on each failed or refused use. A mutter is a state of
  its own (`s.mutter = { line, topic, until }`), returned by `getState().talking` with
  `partnerId: null` when the NPC is not in a pair chat, so the bubble renderer draws it as it
  draws a chat line. Built-in pools beside `coffee`, `cooler` and `greet` (`DEFAULT_CHATTER`,
  `npc-needs.js:51`): `work_fail` ("Share's down again.", "Why is nothing working?"),
  `work_fail_fed_up` ("That's it. I've had enough.", "I am not waiting any longer."), used when
  `tell` is 2, `station_fail`, `usb_refused`, `social_blocked` and `share_login`. A scenario's
  `chatter` replaces a pool by name as it does now; the line is chosen with the seeded `roll`;
  every pool line is at most 40 characters, held by the validator's existing pool check. Bubbles
  are text only, so nothing here is voiced.

### 5.6 Outages

An outage is a global. Any resource and any workstation can name one in `downIf`; the player sets
it through whatever the scenario gives them (a `triggerOnInteract` on a breaker, a `requiresItem`
plant on a printer, a flag reward, an ink tag). While it is truthy every use that depends on it
fails, the people who depend on it leave their desks more often, walk to the broken thing to look
at it, and grow visibly frustrated. Clearing the global ends it; each met use then eases
frustration. The global is written by the browser, so an outage is pacing and display, not
protection (9.3).

## 6. Workarounds (sub-slices B, H and L)

```jsonc
"workarounds": [
  { "at": 50, "do": "writes_down" },
  { "at": 50, "do": "borrow_session", "pc": "hot_desk" },
  { "at": 75, "do": "share_login", "with": "dana" },
  { "at": 90, "do": "prop_door", "door": "finance_office", "prop": "finance_door_wedge",
    "setGlobal": "finance_door_propped" }
]
```

`at` is the frustration level, 1 to 100, at which the workaround comes into force.

| `do` | Sub-slice | Kind | What the player sees | What it opens |
|---|---|---|---|---|
| `writes_down` | B | lasting | The NPC writes for a few seconds at the desk; a yellow note appears on the monitor | Their username and password on their own PC's sign-in screen, from then on |
| `prop_door` | B | lasting | The NPC walks to a door, opens it and wedges it with the named prop | The room, for the rest of the mission |
| `emit` | B | lasting | Whatever the scenario maps to the event | Scenario-specific beats |
| `borrow_session` | H | repeating | The NPC gets up, walks to the named PC, signs in and works there, and walks back leaving it signed in | A claim of that NPC's session at that PC, with their profile on its desktop |
| `share_login` | H | repeating | The NPC walks to a named colleague and says their login out loud | Their username and password, heard and noted, if the player was in earshot |

A **lasting** workaround is performed once. A **repeating** one is performed again after each later
failed use while the level is still at or above its `at`, so a player who missed it gets another
chance and no puzzle rests on being in the right place at one moment.

**Handing over.** After each counted failure the server picks at most one workaround for the NPC to
perform now and returns it as `run`: the first lasting one in force that is neither done nor handed
over and waiting; if there is none, the next repeating one in force, taken in turn. `run` is a
description with nothing secret in it: `{ index, do, pc | with | door, prop, event, dwell }`. The
runner (`systems/npc-workarounds.js`, new) starts it, emits `npc_workaround:<npcId>` with
`{ npcId, index, do, phase: "started" }`, and when it has been performed calls
`POST /npc_workaround` (9.1), then emits the same event with `phase: "done"`. The server applies
whatever the workaround opens when it hears "done", and each hand-over is spent by one "done".

**A hand-over that cannot be performed** (the errand was dropped, 5.3, or a borrow could not start,
6.4) is reported with `dropped: true`. The server takes it out of the handed list, so a lasting one
can be handed over again after a later failure and a repeating one comes round in its turn.

**`setGlobal`.** A workaround's `setGlobal` must be declared in `globalVariables`. The server sets
it true in `player_state.globalVariables` when it records "done", as it does for a task's
`setGlobal`, and the client sets it at the same moment from the answer. On a load the client sets
it again for every done workaround the scenario response lists, so a reload between the "done" and
the next state sync loses nothing.

### 6.1 `writes_down`: the sticky note (B)

This uses slice 9.1's sticky note, unchanged, so one channel carries a written-down password
whatever put it there.

- **Authoring.** The NPC has an account and its `needsHome` is a sign-in PC. The validator warns
  when that PC authors its own `postitNote` or sets `showPostit: false`, because either wins over
  the generated note (9.1's rule) and the workaround then shows nothing new.
- **The errand.** An at-post job at the NPC's own PC (6 seconds), so they stay seated.
- **Done.** The server records it and answers `{ pcId, hasPostit: true }`. No password is in the
  answer. From then on `Game#written_down?(npc)` is true for that NPC. That helper is 9.1's ("the
  `writesDown` habit is on"); this slice adds "or a `writes_down` workaround of theirs is done".
  Everything else follows from 9.1 with no further code here:
  - `Game#login_postit_for(pc)` returns `"<username> / <password>"` for the owner's PC, and
    `GET /login_accounts` adds it to its answer as `postitNote`, sent `no-store`. The sign-in
    screen asks that route every time it opens, so the note is on the next sign-in screen.
  - `filtered_room_data` sets `hasPostit: true` on the PC, never the text.
  - The client calls `window.postitMarks.mark(pcId, true)` (9.1's `systems/postit-marks.js`), which
    draws `notes_postit1` at the top corner of the PC's sprite. After a reload the mark comes from
    `hasPostit` in room data.
- **If this slice is built before 9.1**, sub-slice B builds `written_down?`, `login_postit_for`,
  the `postitNote` in the `/login_accounts` answer, `hasPostit` in room data and `postit-marks.js`
  exactly as 9.1's section 5.3 describes them, with only the workaround condition; 9.1 then adds
  the habit to `written_down?`.

### 6.2 `prop_door`: the wedged door (B)

- **Authoring.** `door` is a locked room that is not behind a gate door, and not the NPC's own
  home room (an NPC behind a locked door is never simulated, because a room loads only once it is
  unlocked). `prop` is an object in a room next to it (a `fire_extinguisher1`, say) that the
  scenario hides with `revealOnGlobal` on the workaround's `setGlobal`. The validator warns when
  the NPC's own card or role would not open that door, and prints that a propped door stays open
  for the mission.
- **The errand.** A walk to the prop (4 seconds).
- **Done.** The server unlocks the room and answers `{ roomId, roomData }` through the same helper
  a door unlock uses, which also records the room's NPCs as encountered (9.1). The client updates
  every loaded door sprite to that room as `NPCGameBridge.unlockDoor` does
  (`npc-game-bridge.js:110-133`: mark the sprites, `gameScenario` and `rooms` unlocked), opens each
  with `window.unlockDoor(doorSprite, roomData)`, sets `setGlobal` (which shows the prop) and
  emits `door_propped:<roomId>` with `{ roomId, npcId }`.

### 6.3 `emit` (B)

`{ "at": 90, "do": "emit", "event": "jake_gave_up" }`: when it is handed over the client emits the
named event with `{ npcId, level }`, with no errand, and then confirms through
`POST /npc_workaround`. The server marks it done only on that confirmation, so an answer lost on
the way, or a page closed before the event fired, leaves it pending and it is sent again on the
next load.

### 6.4 `borrow_session`: the hot desk (H)

- **Authoring.** `pc` names a sign-in PC that has no owner, is not `private`, admits the NPC's
  account, is not under a policy with `autoLockMin: 0`, and satisfies the need (an `affordance`, or
  an office preset, whose `satisfies` lists `work`, or `social_media` for an NPC who borrows for
  that; without it the use would restore nothing). The validator errors on each. The NPC must have
  an account.
- **One mechanism.** A borrow is an ordinary use job chosen by the selector, not an errand. The
  hand-over sets `s.borrow = { index, pc, need, routes, startBy }` for the need that failed and
  clears that need's retry wait, so the NPC gets up at once. While `s.borrow` is set, the borrowed
  PC is that need's candidate ahead of the home object; the job is flagged `borrowed`, and the
  verdict runs there with the borrowed PC's `routes` (which arrive in `run` when 9.3 is built).
- **If it cannot start.** A borrowed PC that is in use, unreachable or not loaded is waited for.
  If the job has not started 60 seconds of the needs clock after the hand-over, the borrow is
  dropped and reported (section 6), and comes round again after a later failure.
- **Sitting down.** When the job reaches the PC, `npc_sat_at:<pcId>` fires with `{ npcId,
  objectId }`. The workstation env gains `userOf(objectId)`: the NPC whose current job is `using`
  that object and is not an errand. `presence()` and `onInteract`
  (`workstation-state.js:142, 314`) treat a user as present, so a click shows "<displayName> is
  using this PC".
- **A session the player holds there is ended.** One screen holds one session. If the player is
  signed in at that PC, by password, by a claim, or through a 9.3 remote session, the NPC signing
  in ends it: `pc-sessions.js` drops the session, emits `pc_signed_out` with `reason:
  "displaced"`, closes an open desktop with "<displayName> has signed in at this PC", and sends
  `POST /logout`. The server also clears `sessions[pcId]` when it records the borrow as done. This
  is the choice that is clearest to a student: it is what happens on a real shared PC when someone
  else sits down and signs in, the message says who and why, and it means the session the NPC then
  leaves behind is always the one a click reaches. The alternative, leaving the player's session
  in place, would show the player's old desktop at a PC an NPC has just used and hide the opening.
- **The use.** The verdict runs as anywhere. If the failure belonged to the NPC's own PC, work now
  succeeds and frustration eases. If the resource itself is down, it fails there too.
- **Leaving.** Whether or not the use was met, the NPC signed in before finding out, so a session
  is left. `_completeJob` emits `npc_borrowed_session:<pcId>` with `{ npcId, objectId, met }`, and
  the runner posts "done" then. The workstation layer records the NPC as that PC's **guest** and
  treats the moment as a leave with the screen left open: `autoLockMin` above 0 sets `lockAt` as
  for an owner, the globals `<pcId>_owner_away` and `<pcId>_screen_locked` are published, and
  `workstation_owner_left:<pcId>` fires with `{ objectId, ownerId: <npcId>, screenLocked: false,
  reason: "guest" }`. The locked-screen look and the indicator dot follow those events as now.
  `s.borrow` is cleared; a later hand-over sets it again.
- **A careful guest.** Where slice 9.1 is built and the NPC's `locksScreen` habit is `always`
  (`Game#npc_habit(npc, "locksScreen")`), the server sends `leavesOpen: false` in `run`: the NPC
  works at the hot desk and signs out, no guest record is made, and the server's guest claim
  refuses on the same test. No habit reaches the browser. The validator warns that such a
  workaround opens nothing.
- **The claim.** With a guest record and nobody at the PC, `onInteract` returns `accessed`, and
  `interactLoginPc` (`unlock-system.js`) claims through `pc-sessions.js` with `claim: "guest"`.
  The server's checks are in 9.1. The desktop is the guest's: the PC's own contents and every
  profile that admits them.
- **It ends** when the screen's auto lock fires, when anybody next sits at that PC (the layer
  emits `workstation_owner_returned:<pcId>`, which already ends a claimed session), or on a reload
  (the first slice's rule for every claim).

### 6.5 `share_login`: said out loud (H)

- **Authoring.** `with` names another room NPC. The NPC has an account.
- **The errand.** A walk to a cell beside the colleague (6 seconds). On arrival the NPC says one
  line from the pool `share_login` ("Can you run it on my login?", "Use mine. It's the usual
  one."). Pool lines ship, so they never hold a username or a password.
- **Heard.** During the dwell the runner asks, each tick, whether the player hears: in the same
  room, within the chat overhear radius (`OVERHEAR_RADIUS`, 160 px), with a clear line, the test
  `world.playerHears` (`npc-needs.js:1674`) already makes for chatter. At the end it posts "done"
  with `heard` true or false.
- **A heard answer explains itself.** The server answers `{ capture, line, note }`. `line` is the
  sentence the player overheard, composed on the server from `creds`: "It's jbrooks. Password's
  ...". The client shows it as a toast titled "Overheard: <displayName>", adds an evidence note
  with `note` ("Jake Brooks told Dana Reyes his login out loud: jbrooks / ..."), records the
  capture through `window.recordSECapture` (`{ targetId, kind: "credential", address: <username>,
  note }`), and emits `npc_overheard_login:<npcId>`. The player sees who said what to whom and
  holds the password in their notes, whether or not the scenario has a captures terminal. Where
  `social.captures.revealSecret` is on, the terminal also shows it, through `/capture_secrets`
  (9.1). A heard share leaves the turn: the capture is made.
- **Not heard:** the answer is empty, nothing is recorded, and the workaround comes round again
  after the next failed use.

### 6.6 Lockout as a cause (L)

A member of staff who is locked out at their own PC cannot work there. This is the one cause of
failure the server can check for itself, and the one chain a player can start with nothing but a
sign-in screen.

- **When it applies.** The first slice locks a username out per PC (`loginLockouts`). An owner
  finds out only when they have to type their password: on `workstation_owner_returned:<pcId>`
  with `wasLocked: true`, at a PC under a policy with `maxAttempts`, the client sends a `check`
  report for that owner and PC (9.1). The server answers `lockedOut: true` when `loginLockouts`
  holds the owner's username at that PC. From then on that NPC's uses of that PC fail with
  `locked_out` (a station failure), the mutter comes from `station_fail`, and frustration rises as
  for any failure. An owner whose screen never locks never types a password and is never affected.
- **What the browser learns, and when.** That this owner is locked out at this PC, at the moment
  the owner comes back to the locked screen, which is the moment the game shows it anyway. The
  sign-in screen's answers do not change, and no list of locked-out accounts is ever sent.
- **What it teaches.** A lockout policy is a denial of service anyone at the keyboard can cause.
  The game's lockout is per PC, so the owner can still sign in elsewhere, which is why they
  hot-desk; the author docs say that a real directory lockout usually follows the account, and
  that the lesson here is the denial of service, not the scope.
- The lockout lasts the mission (the first slice's rule), so the owner keeps hot-desking.

## 7. The USB policy (sub-slice U)

| `policy.usb` | An item with `usbClass: "storage"` | An item with `usbClass: "hid"` |
|---|---|---|
| `allowed` or absent | accepted | accepted |
| `storage_blocked` | refused | accepted |
| `blocked` | refused | refused |

An item without `usbClass` is never refused: a hardware keylogger that sits between the keyboard
and the PC is not a USB device the policy can see, and the lab's `requiresItem` plant keeps
working on any PC. The classes exist to teach one thing: a device control policy that blocks
storage does not stop a device that presents itself as a keyboard.

**Which objects a `usb` policy governs.** Only an object that is a workstation by its own fields
(`isWorkstation`, `workstation-state.js:72-76`) or that names a `policy` itself. A `defaultPolicy`
therefore never makes a lost property tray, a shredder or a printer "refuse" a memory stick.

One pure module, `public/break_escape/js/systems/pc-policy.js` (new): `effectivePolicy(objectData,
scenario)` (the object's `policy`, else `defaultPolicy`, as `workstation-state.js:370` resolves
it), `usbGoverned(objectData)` (the rule above) and `usbRefused(policy, usbClass)` (the table).

**An NPC who finds a device.** Selection is unchanged: an NPC with an interest in the item's tag
picks it up and carries it to its own post if that accepts the tag, else the nearest accepting
object (`_carryCandidate`, `npc-needs.js:849`). The policy bites when the use completes:

1. The target's policy refuses the item's class. The item is not consumed, `npc_used` does not fire
   (so no payoff mapped to it can run), `npc_use_refused:<objectId>` fires with `{ npcId, objectId,
   itemId, tag, usbClass }`, the log gains `use_refused`, and the NPC mutters from `usb_refused`
   ("USB's disabled. Typical."). The mutter state of 5.5 is built in this sub-slice.
2. The NPC then looks for another object that accepts the tag, is free and reachable, and does not
   refuse the item. If there is one, the same job carries on to it: the person tries their own PC,
   is refused, and takes the stick to the machine nobody manages. That use completes as any
   delivery does and fires `npc_used:<thatObject>`.
3. If there is none, the NPC puts the item down where they stand (`world.dropHeld`, as an aborted
   carry does), remembers it (`s.refused`, so they do not pick it up again) and goes home. The
   player can pick it up again.

The adapter's object description (`describe`, `npc-needs.js:1466`) gains `usbClass` for items and
`usbPolicy` (the effective `usb` value, or null when the object is not governed) for targets.

**The player's own plant.** In the `requiresItem` branch (`interactions.js:825`), when the held
item has a `usbClass` and the object is governed and refuses it, the click shows "USB storage is
disabled on this PC." or "USB devices are disabled on this PC." for the time `hintToastMs` gives,
emits `usb_refused:<objectId>` with `{ objectId, itemId, usbClass }`, runs no action and consumes
nothing. This branch is never reached on a sign-in PC, which returns earlier
(`interactions.js:797-806`), and policies mostly sit on sign-in PCs. So a plant the policy should
govern goes on a separate object beside the PC that names the same `policy` (a dock, a USB hub),
which is the shape the author docs already give for plants at sign-in PCs.

**Any other path that plants a USB device asks the same question.** Slice 9.3's implant (a
`grant_foothold` from a device used at a PC) is one. Where both slices are built, 9.3's
`POST /network/implant` refuses when the PC is governed and `usbRefused` holds for the device's
`usbClass`; both are scenario facts, so that check is the server's own. The slice that lands
second adds it, with a validator warning for a `grant_foothold` whose PC refuses its device.

Apart from that, the server is not involved: device payoffs are globals the browser sets, as they
are today, so the policy is as strong as the payoff it guards.

## 8. Social media (sub-slice C)

### 8.1 The need

`social_media` is an ordinary need (decay, `urgentAt`, weight) with its own way of being met. For
an NPC with this need the candidates are, in order:

1. a PC borrowed for it (6.4), when one is in force;
2. the NPC's own `needsHome` object, when it is a workstation whose policy allows social media and
   which is not out of order;
3. any object whose `affordance.satisfies` lists `social_media` (a break room tablet), by the usual
   nearest-reachable rule;
4. the NPC's **phone**, unless `"phone": false`;
5. the NPC's own workstation even though its policy blocks social media or it is out of order: an
   attempt that fails.

With none of these the need has no option and the NPC holds still, as for any need. The validator
errors on an NPC with the need, no phone and no workstation home, and
`validate_npc_needs.rb:481-483` ("has no object whose affordance.satisfies it") no longer applies
to `social_media`.

**The verdict at a PC** (5.1) for `social_media`: `social_blocked` when the PC's effective policy
has `social: "blocked"`, `station_down` when the PC is out of order. A failed attempt goes through
5.2 unchanged: the mutter comes from `social_blocked` ("Blocked. Of course."), frustration rises,
and the NPC's workarounds apply. A `borrow_session` to a PC under a laxer policy is the natural
one: the member of staff signs in at the kiosk to check Friendface and walks off.

**A use at a PC** is an at-post job at the NPC's own desk (they never get up), with `restores` and
`useSeconds` from the NPC's `socialUse` (defaults 60 and 20). It does not count as work.

### 8.2 The phone

A phone use is a job with no target, a new job kind `self`:

- It starts without a wind-up and without `npc_left_post`: the NPC stays where it is, and an NPC at
  its post stays at its post, so its screen stays attended. An NPC walking home stops, uses the
  phone, and walks on.
- `getState().job` is `{ kind: "self", need: "social_media", phase: "using", targetId: null }`.
  `_claims`, `_moveForPhase`, `_atOwnPost` and `_targetsOwnPost` are not asked about a `self` job.
- It shows the action icon for `social_media` (the existing `npc-social` picture). No pose is
  drawn: there is no phone-in-hand animation in the standard set.
- On completion it restores the need and emits `npc_used_phone:<npcId>` with `{ npcId, need,
  playerNearby, playerDistance }`. It does not emit `npc_used` (there is no object).
- A conversation freezes it and a knock-out aborts it, as for any job.
- While the job runs `getState().distracted` is true, and an NPC with `los.challengeOnSight` does
  not challenge (`systems/npc-sight-challenge.js`). The validator prints, for such an NPC, that it
  can be walked past once every period of the need.

### 8.3 The feed

Each met `social_media` use, at a PC or on the phone, asks the server for that NPC's next post
(`POST /feed_post`, 9.1). The server answers with the post, or with nothing, and says when the
feed has run out so the client stops asking.

**A post and its fact are withheld together.** A feed post's `fact` names a `social.intelFacts`
entry, and that block ships in the bootstrap. So:

- A **feed fact** is a fact named by a feed post. The server deletes every feed fact from
  `social.intelFacts` in the bootstrap. The entry (its `text`, `label`, `subject`, `provides`)
  travels with its post: in the `/feed_post` answer, and in `feedPosts` on a load.
- A feed fact may be granted only by its feed post. The validator errors when a feed fact is also
  the `fact` of any authored block, document field or tool result, or the target of a `grant_fact`
  action or a call grant: any of those would need its text in the browser from the start. Naming a
  feed fact in a readiness slot (`needsIntel`) or as a phishing factor is fine, because those hold
  the id, not the text.
- Until the post is out, `grantFact` refuses the fact, because it refuses an id `social.intelFacts`
  does not hold (`social-intel.js:193-196`).

A new client module, `public/break_escape/js/systems/social-feed.js`:

- keeps the revealed posts by NPC, filled from the route's answers and, on a load, from
  `feedPosts`;
- merges each post's fact entry into the live `gameScenario.social.intelFacts` **before** the post
  is listed, so the browser, the intel board and the evidence note read it as any other fact;
- emits `npc_posted:<npcId>` with `{ npcId, postId, index, site, person }`;
- shows a toast, "<name> posted on <site name>", when the player has opened that site in the
  browser before (the browser's saved state lists visited sites, `se_osint_state`). This is on by
  default, because a post made on a phone is otherwise invisible; a scenario turns it off with
  `social.osint.postToasts: false`.

**Reading.** `_socialView` (`osint-browser-minigame.js:378-397`) lists a profile's posts. It now
lists the revealed feed posts for that site and person first, newest at the top, then the
authored `posts`. A feed post is an ordinary post block: with an `id` it is a button, and clicking
it grants its `fact` through `grantFact`, with the same "Noted" feedback, evidence note and
readiness check as any other post. Nothing else in the browser changes. Any `osint-workstation`
object whose `minigameData.siteIds` includes the feed's site shows it.

**What a post is for.** A fact the player can use: the pet's name and the year for a password
built from them, who somebody trusts, when they are out of the office.

**Awareness.** When the NPC's awareness level is `high`, a post with a `fact` draws a validator
warning unless it is marked `"deliberate": true`. The level is slice 9.1's
`NpcHabits.level_of(npc, scenario)`, which counts a level that came from a role; where 9.1 is not
built, the authored `awareness` string is read and the warning says so.

**Pace.** A post comes out per met use, so the pace is the need's own: the validator's timing
report for the need (first urgent at T1, then every P minutes) is also the posting schedule, and
it prints the minute at which each post is expected.
