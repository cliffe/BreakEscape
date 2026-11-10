# Access model slice 9.2: work, frustration, workarounds, USB policy and social media

Status: **design for review, 2026-11-10.** Nothing here is built. This plan replaces the sketch in
section 9.2 of `ACCESS_MODEL_PLAN.md` (called "the first slice plan" below) and is checked against
the code on the access design branch and against the sibling plans
`ACCESS_MODEL_SLICE_9_1_PLAN.md` (awareness and habits), `ACCESS_MODEL_SLICE_9_3_PLAN.md`
(networks, in two parts: 9.3a, build-ready, and 9.3b, an ordered design) and
`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` (called "the engine plan" below) as they stand on the
same day. The build order is **9.3a, then 9.1, then this slice**; 9.3b comes after 9.3a at a time
the user chooses, and is expected after this slice. Section 15 says what changes if the order
differs.

How to read it: section 3 gives the six sub-slices and their order. Sections 4 to 8 are the
design. Section 9 lists every server route with its checks, what the browser receives, what a
tampered browser can still get, and what a saved game holds. Section 10 is the validator, schema
and dungeon graph. Sections 11 to 13 are the tests, the build steps and the parallel streams.
Section 15 gives the interfaces with the sibling plans and section 16 the decisions.

The game is a puzzle-solving simulation in which behaviours chain together. Everything below is
judged by one test: can a student **cause** something, **see** a person react, **understand** what
the reaction gave them, and **use** it for the next step?

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
| `player_state.currentRoom` is **not** a usable record of where the player is. The server accepts a reported room only if it is the start room or unlocked (`games_controller.rb:1581-1588`), but the browser always reports `window.currentRoom?.name` (`state-sync.js:198`), and `window.currentRoom` is set once, to `null` (`main.js:58`), and never again. The live room is `window.currentPlayerRoom` (`core/rooms.js:3101`). So the server's value stays the start room it was given (`game.rb:4091`). This plan never reads it | as listed |
| A state sync runs every 30 seconds (`state-sync.js:126`) and on demand through `window.stateSync.sync()` (`state-sync.js:411`) | as listed |
| `Game#room_unlocked?(room_id)` is "in `unlockedRooms` or the start room"; a room counts as open to the player when it is never locked or `room_unlocked?` holds, as `login_pc_reachable?` tests | `game.rb:116-118, 1272` |
| The needs adapter already answers whether a global holds: `world.globalHolds(cond)` | `npc-needs.js:1690` |
| `npc-needs.js` imports nothing; `interactions.js` imports the engine (`core/rooms.js`, `unlock-system.js` and others), so node tests cannot load it | `npc-needs.js` (no `import` line), `interactions.js:2-20` |
| A `requiresItem` check takes the first held item that matches (`find`) | `interactions.js:827-830` |
| Action conditions are tested one action at a time, in order, so "set true if false, then set false if true" flips twice | `apply-actions.js:91-94` |
| `npc_used` for a carry is asserted whole, with `deepEqual` | `test/js/npc-needs.test.mjs:130` |
| `Game.acl_admits?` answers false for a missing list | `game.rb:1160-1161` |
| A capture route today is a `usePayload` or an `eventMappings[].addCapture` (`Game.capture_route?`); `account_capture_passwords` serves an account holder's password against `se_captures` | `game.rb:957-976` |
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

**Faults found in the engine while checking this plan.** Outside this slice; logged for the user,
not repaired here.

1. **The state sync never reports the player's room.** `state-sync.js:198` reads
   `window.currentRoom`, which is always `null` (`main.js:58`); the live value is
   `window.currentPlayerRoom` (`core/rooms.js:3101`). So `player_state.currentRoom` is the start
   room for the whole game, and the server's "Cannot enter locked room" check
   (`games_controller.rb:1583-1586`) never runs. Repairing it switches that refusal on for every
   mission, which is an engine change with its own risk and its own regression runs, so it is not
   done inside this slice, and nothing here depends on it (6.5).

## 3. Sub-slices

Six sub-slices, in this order. Each ends playable and tested and has its own steps in section 12.

| Sub-slice | Contents | Feature scenario beats |
|---|---|---|
| **U. The USB policy** (first) | The `usb` policy field, `usbClass` on items, a refused NPC and a refused plant. No route, no saved state, no frustration | `test_access_work` U1 to U3 |
| **A. Work, outages and frustration** | Resources, work needs by role, the use verdict, failed uses and the retry wait, the check errand, the outage kick, frustration held on the server and shown on the NPC | W1 to W7 |
| **B. Workarounds, part one** | The server hands workarounds over as thresholds are crossed. `writes_down`, `prop_door`, `emit`. The dungeon graph. No session work | X1 to X4 |
| **H. Workarounds, part two: the hot desk and the shared login** | `borrow_session` with guest sessions; `share_login` | H1 to H5 |
| **L. Lockout as a cause** | A member of staff locked out at their own PC cannot work there | L1 |
| **C. Social media** | The `social_media` need, the phone, the `social` policy field, the feed served post by post with its facts, the browser merge | `test_access_social` F1 to F8 |

U is first because it depends on nothing else here and nothing depends on it; it shares only the
needs module with A. A comes before B because workarounds stand on the verdict and on frustration.
A is worth playing on its own: failed uses empty desks and send owners walking to broken things,
which already opens sessions. B is split from H because H changes the workstation and session
layers and B does not. L waits until the hot desk works, because the hot desk is what a locked-out
person does. L is the user's decision (16, decision 14), and being last but one it holds nothing
up: C does not depend on it. C stands on A and, for one beat, on H; it is last. None of the six
needs networks, and none needs anything of 9.3b: what this slice and 9.3b share (routes with
globals in them, a station "not responding" in the network view, the USB check on an implant)
is built by 9.3b (section 15).

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
| `resources.<id>` | top level | A | `name` (a display name: 9.3a shows it in the network view; this slice never sends it to the browser), `kind` (a free label; it picks the mutter pool, 5.5), `access` (an access list as in the first slice; absent: everyone), `downIf` (a global name; the resource is down while it is truthy), `object` (a room object the resource is tied to). Slice 9.3 owns `network`, `host`, `contents` and `observations` on the same entries; this slice reads `network` on the server only, through 9.3's `NetworkModel`, and requires none of them |
| `roles.<role>` | top level | A, B | Defaults for NPCs with that role. This slice owns `workNeeds` (A), `frustration` (A) and `workarounds` (B). Slice 9.1 owns `awareness` beside them. Never a grant: rights stay in access lists |
| `workNeeds` | room NPC | A | A list of resource ids. `"x"` or `"+x"` adds, `"-x"` removes, applied to the union of the NPC's roles' lists (roles in authored order, `staff` last) |
| `frustration` | room NPC, role | A | `perFail` (default 25, 1 to 100), `easePerSuccess` (default 10, 0 to 100), `retryMin` (default 1, 0.5 to 10, game minutes before a failed need is tried again; a game minute is 60 seconds of the needs clock), `breakDrain` (default 10, 0 to 50, points taken off every other need on a failure) |
| `workarounds` | room NPC, role | B, H | A list of `{ at, do, ... }` (section 6). The NPC's own list replaces the role's; it is not merged. Any entry may carry `setGlobal`, a declared global the server sets true when the workaround is done, and `noWarning: true`, which says the author means it to come on the first failure (it silences one validator warning, section 10) |
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
`workNeeds`, `roles` and `resources` do not reach it (section 9.2). The server resolves each room NPC's
plan and attaches it to the NPC in room data as `work`:

```jsonc
"work": { "retryMin": 1, "breakDrain": 10, "stationDownIf": "jake_pc_unplugged",
          "needs": [ { "id": "finance_share", "kind": "file_share",
                       "admitted": true, "downIf": "finance_share_down", "routes": [ [] ] },
                     { "id": "printer_2f", "kind": "printer",
                       "admitted": true, "downIf": "printer_jammed", "object": "office_printer" } ] }
```

It holds the server's answer to "is this person admitted", not the role or the access list, and it
holds **ids, kinds and global names, never a display name**. That keeps it inside slice 9.3a's
rule (its section 6): ids and global names are not secret, display names are. Nothing in the
browser needs a name: `missing` carries ids, mutters come from pools chosen by `kind` (5.5), the
icon is `blocked`, and the debug overlay prints ids. `stationDownIf` is the home workstation's
`downIf`, sent so the outage kick (5.6) can watch it. NPC records are built with `Object.assign`
(`npc-manager.js` `registerNPC`), so `work` arrives on the record the adapter reads.

**Admitted.** The server decides with 9.3a's `resource_acl_admits?(resource, npc)` (9.3's 4.5), in
which a missing list admits everyone. `Game.acl_admits?` is not used: it answers false for a
missing list (`game.rb:1160-1161`).

**Reach is composed on the server.** No network id, link or resource `network` is ever in the plan.
Where the scenario has `networks`, each need gains `routes`: the answer of 9.3's
`NetworkModel.reach_conditions(data, station_network, resource)` for the NPC's home workstation, a list
of routes, each a list of the `downIf` global names along it. The browser's test is one pure
function in `npc-work.js`, `reachable(need, globals)`: a need with no `routes` key is reachable; an
empty list of routes is never reachable; otherwise it is reachable when some route has no truthy
global. With 9.3a only two answers occur (its 4.2): `[[]]`, one route with no conditions, when the
resource has no `network` or is on the station's network, and `[]`, no route, otherwise. Routes
that carry globals arrive only with 9.3b's links and outages (its 12.1 and 12.2); the browser's
function already reads them, so nothing here changes then. With no `networks` in the scenario the
server sends no `routes` and every resource is reachable. A use at a PC that is neither the NPC's
home nor a borrowed PC is judged with the home station's routes; a borrowed PC's routes arrive with
the borrow (6.4).

**A met use.** `npc_used` gains `met` only for a judged use (`work` and `social_media`). A carry, a
coffee or any other use keeps today's payload exactly, so the whole-payload assertion in
`test/js/npc-needs.test.mjs:130` holds unchanged.

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
  `{ id, why }`; the station is `{ id: <objectId>, why: "station_down" }`). A met judged use
  carries `met: true`. Existing mappings are unaffected unless they choose to read the field.
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
  after 60 seconds of the needs clock. A workaround errand is dropped after 120, so it cannot block
  the queue; the needs system then emits `npc_errand_dropped:<npcId>` with `{ npcId, kind, at,
  data }`, which the workaround runner hears and reports as dropped (section 6).
- `reset()` clears the queue. After a reload the server sends undone workarounds again (section 9.4).

### 5.4 Frustration lives on the server

Frustration is one number per NPC, 0 to 100, kept in `player_state.npcFrustration` (section 9.4). The
browser reports and mirrors; the server decides. This is what lets `workarounds` stay withheld
until each one is due, and it makes the level survive a reload without any client state.

- **Reporting.** After a failed judged use the adapter calls `world.reportUse(npcId, { event:
  "fail", need, objectId, missing })`, and after a met judged use with frustration above 0,
  `{ event: "ease", need, objectId }`. A small client module, `systems/npc-reports.js` (new),
  queues reports and sends them together, at most one `POST /npc_frustration` every two seconds,
  at most 20 reports in one request (section 9.1). A failed use at a borrowed PC is not reported:
  it is the same episode as the failure that sent the NPC there (6.4).
- **Keeping the server's copy current.** When a global named anywhere in a loaded NPC's `work`
  plan (a `downIf`, a route global, `stationDownIf`) changes, `npc-reports.js` awaits one
  `window.stateSync.sync()` (`state-sync.js:411`) before it sends its next batch. Globals otherwise
  reach the server only every 30 seconds (`state-sync.js:126`), so without this the first report
  of nearly every outage would be stale.
- **The answer**, per report: `{ npcId, level, previous, tell, settled, run }`. The reporter hands
  each batch of answers to `NPCNeedsSystem.applyFrustration(answers)`. At the next tick the
  needs system stores the level (`s.frustration`, in `getState()` and the debug overlay as an `F`
  bar), sets the global `<npcId>_frustration` to the number (so text variants can say "she looks
  close to giving up" on `globalVars.dana_frustration >= 50`), and emits
  `npc_frustration_changed:<npcId>` with `{ npcId, level, previous, tell }`. `run`, when present,
  is a workaround to perform (section 6); it is null throughout sub-slice A. When an answer
  carries `run`, `applyFrustration` emits `npc_workaround_due:<npcId>` with it, and the workaround
  runner (section 6) starts it from that event.
- **Stopping.** `settled: true` means another failure can change nothing: the level is 100,
  nothing is handed over and waiting, and no repeating workaround is in force. The client then
  sends no more fail reports for that NPC until it has sent an ease. An NPC with a resource it is
  never admitted to therefore reports a handful of times and then falls silent.
- **Stale reports.** The server compares each reported cause with its own view (section 9.1). Its copy of a
  global can be a few seconds behind the browser's. A report none of whose causes holds on the
  server is answered `{ stale: true }` with nothing written; the client runs a state sync and
  sends the report once more. With the forced sync above this is rare.
- **Reload.** The scenario response carries `npcFrustration`. `core/game.js` hands it to
  `NPCNeedsSystem.restoreFrustration(map)` where it hands `sessions` to `pc-sessions.js`
  (`core/game.js:1663`). No needs state exists at that point, so the system keeps the map and
  applies each NPC's entry in `register`, when the NPC's room loads: the level, the global, `tell`,
  and (from sub-slice B) the pending workarounds, emitted as `npc_workaround_due:<npcId>`.
- **Determinism.** In sub-slice A nothing in the needs decision depends on an answer (the retry
  wait, the drain and the outage kick of 5.6 are applied at once, from the plan and the globals),
  so the decision log stays a function of the seed and the player's actions. From sub-slice B an answer starts an errand, so when a
  workaround begins depends on how soon the answer arrives; needs tests for B onward assert the
  order of events, never tick numbers. In node tests the stub answers at once.
- A lost request loses one step of frustration and nothing else: the next report carries on from
  the server's number.

### 5.5 What the player sees

A workaround is only an opening if the player can see it coming. All of this uses existing art.

- **`tell`**, sent with every answer and on a reload, is 0, 1 or 2. It is 0 at level 0. It is 2
  when a workaround is in force, or when one more failure (the level plus `perFail`) would bring a
  workaround into force, or, for an NPC with no workaround still to come, would bring the level to
  100. Otherwise it is 1. It says "getting closer" without sending a threshold or naming a
  workaround. A workaround whose `at` is at or below `perFail` comes on the first failure, from
  tell 0, with no warning before it; the validator reports such a workaround as "no warning"
  (section 10), so an author uses it on purpose or lowers `perFail` so the player sees tell 1 and
  then tell 2 first.
- **The icon.** For 4 seconds of the needs clock after a failed use `getState().failed` is
  `{ need, missing }`. While `tell` is 1 or 2 the action icon slot shows the existing `blocked`
  icon whenever the NPC has no job; at `tell` 2 it pulses, with the slow pulse the pressing-need
  bubble already has (off under reduced motion). This does not wait for `showPressingNeeds`: a
  scenario that declares resources has opted in. The icon stays up between failures, so "one more
  and she gives up" looks different from "just started", and it works with `"chatter": false`.
- **The mutter.** One line in a world bubble on each failed or refused use, and one when a
  workaround starts. A mutter is a state of its own (`s.mutter = { line, topic, until }`), set
  through `NPCNeedsSystem.mutter(npcId, topic)` and returned by `getState().talking` with
  `partnerId: null` when the NPC is not in a pair chat, so the bubble renderer draws it as it draws
  a chat line. A scenario's `chatter` replaces a pool by name as it does now; the line is chosen
  with the seeded `roll`; every pool line is at most 40 characters, held by the validator's
  existing pool check. Bubbles are text only, so nothing here is voiced.
- **Which pool, on a failure.** The pool is chosen at the moment of the failure, from the `tell`
  the NPC holds then (the answer to the previous report), and the line is held for its time; the
  answer that arrives afterwards changes the icon, never the line already said. In order:
  1. `tell` 2: `work_fail_fed_up` ("That's it. I've had enough.", "I am not waiting any longer.");
  2. otherwise the cause's own pool: a station failure `station_fail` ("This PC is useless.");
     `social_blocked` ("Blocked. Of course."); a `no_access` failure `work_fail_no_access` ("Still
     no access. Nobody listens."); a resource that is down or unreachable `work_fail_<kind>` by the
     first missing resource's `kind`: `work_fail_file_share` ("Share's down again."),
     `work_fail_email` ("Email's not sending."), `work_fail_printer` ("Printer's jammed again.");
  3. `work_fail` ("Why is nothing working?") for a kind with no pool of its own.

  So a student hears the thing they broke named, and hears the tone change before the person acts.
  A refused USB device says `usb_refused` ("USB's disabled. Typical."), whatever the `tell`.
- **Which pool, when a workaround starts.** Each workaround says a line from its own pool as the
  hand-over starts its errand, so the act is tied to the outage in words: `wk_writes_down` ("I'll
  never remember this one."), `wk_prop_door` ("I'm not badging in every time."), `wk_borrow`
  ("I'll use the spare PC."), `wk_share_login` ("I'll get someone to run it."), and none for `emit`.
  The line's timing depends on the answer's arrival; its choice stays seeded. On arrival at the
  colleague, `share_login` says its spoken line from `login_aloud` (6.5).
- **The action icon for an errand.** While a workaround errand runs, the action icon slot shows
  the existing `npc-work` picture, so a person walking somewhere for a reason looks different from
  one wandering for coffee.

### 5.6 Outages

An outage is a global. Any resource and any workstation can name one in `downIf`; the player sets
it through whatever the scenario gives them (a `triggerOnInteract` on a breaker, a `requiresItem`
plant on a printer, a flag reward, an ink tag). While it is truthy every use that depends on it
fails, the people who depend on it leave their desks more often, walk to the broken thing to look
at it, and grow visibly frustrated. Clearing the global ends it; each met use then eases
frustration. The global is written by the browser, so an outage is pacing and display, not
protection (section 9.3).

**The outage bites at once.** A use is judged only when it completes, and a use starts only when
the need is at or below `urgentAt` (`npc-needs.js:788-803`). Left alone, a person who has just
worked sits at the desk until the need next turns urgent: with a desk preset's `restores: 60`
(`office-presets.json:4`) and a work need of `decayPerMin: 6, urgentAt: 50`, that is about eight
minutes before the first sign that anything is wrong. The lesson is causal ("I broke it, she
noticed"), so the gap is closed by one client rule:

- each tick, the needs system checks, for each registered NPC with a `work` plan, the globals that
  plan names (each need's `downIf` and route globals, and `stationDownIf`) through
  `world.globalHolds(name)` (`npc-needs.js:1690`);
- when one of them turns truthy, or is truthy when the NPC registers, the NPC's `work` level is
  lowered to `urgentAt` (never raised) and its retry wait for `work` is cleared, once per change;
- the NPC therefore tries to work at the next selection: within about one use time when idle, or
  as soon as a running job (a coffee, a chat) ends.

It is what a person at a desk does when the share drops: they notice the next time they press
save. It is driven by the player's own act, so the decision log stays a function of the seed and
the player's actions. `social_media` gets the same rule for its station's `downIf` only; a
`social: "blocked"` policy is not an event and has no kick.

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
description with nothing secret in it: `{ index, hand, do, pc | with | door, prop, event, dwell }`,
where `hand` is the server's count of hand-overs for that NPC, so each hand-over has its own
number. The runner (`systems/npc-workarounds.js`, new) hears `npc_workaround_due:<npcId>` (5.4),
starts the workaround (an errand through `enqueueErrand`, or `NPCNeedsSystem.setBorrow(npcId, run)`
for a borrow, 6.4), has the NPC say its start line (5.5), emits `npc_workaround:<npcId>` with
`{ npcId, index, do, phase: "started" }`, and when it has been performed calls
`POST /npc_workaround` (section 9.1) with `index` and `hand`, then emits the same event with
`phase: "done"`. The server applies whatever the workaround opens when it hears "done", and each
hand-over is spent by one "done".

**"Done" is safe to send twice.** A request can be lost on the way back. The runner retries a
failed request, and a "done" for a hand-over the server has already spent as done is answered with
the same body again, recomposed from the scenario, with nothing written. Only the last spent hand
per workaround is remembered (`lastSpent`, 9.4), so the record stays bounded.

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
  unlocked). `prop` is an object in a room connected to it, never inside the locked room itself (a
  `fire_extinguisher1`, say), that the scenario hides with `revealOnGlobal` on the workaround's
  `setGlobal`; the NPC has to be able to walk to it while the door is still shut. The validator warns when
  the NPC's own card or role would not open that door, and prints that a propped door stays open
  for the mission.
- **The errand.** A walk to the prop (4 seconds).
- **Done.** The server unlocks the room and answers `{ roomId, roomData }` through the same helper
  a door unlock uses, which also records the room's NPCs as encountered (section 9.1). The client updates
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

- **Authoring.** `pc` names a sign-in PC that has no owner, is not `private`, is not `headless`
  (9.3a: a PC with no screen cannot be sat at), admits the NPC's account, is not under a policy
  with `autoLockMin: 0`, and satisfies the need (an `affordance`, or an office preset, whose
  `satisfies` lists `work`, or `social_media` for an NPC who borrows for that; without it the use
  would restore nothing). The validator errors on each. The NPC must have an account.
- **One mechanism.** A borrow is an ordinary use job chosen by the selector, not an errand. The
  runner calls `NPCNeedsSystem.setBorrow(npcId, run)`, which sets `s.borrow = { index, hand, pc,
  need, routes, startBy }` for the need that failed and clears that need's retry wait, so the NPC
  gets up at once. While `s.borrow` is set, the borrowed PC is that need's candidate ahead of the
  home object; the job is flagged `borrowed`, and the verdict runs there with the borrowed PC's
  `routes` (sent in `run` when the scenario has `networks`).
- **If it cannot start.** A borrowed PC that is in use, unreachable or not loaded is waited for.
  If the job has not started 60 seconds of the needs clock after the hand-over, the borrow is
  dropped and reported (section 6), and comes round again after a later failure.
- **Sitting down.** When the job reaches the PC, `npc_sat_at:<pcId>` fires with `{ npcId,
  objectId }`. The workstation env gains `userOf(objectId)`: the NPC whose current job is `using`
  that object and is not an errand. `presence()` and `onInteract`
  (`workstation-state.js:142, 314`) treat a user as present, so a click shows "<displayName> is
  using this PC".
- **A session the player holds there is ended.** One screen holds one session. If the player is
  signed in at that PC, by password, by a claim, or through a 9.3a remote session, the NPC signing
  in ends it, on `npc_sat_at`: `pc-sessions.js` (`displaced(pcId, name)`) drops the session, emits
  `pc_signed_out` with `reason: "displaced"`, closes an open desktop with "<displayName> has
  signed in at this PC", and sends `POST /logout`. A guest session the player had claimed there
  ends the same way, with the same message; `workstation_owner_returned` is never emitted for a
  guest, so the owner's "<name> is back at the desk" (`pc-sessions.js:52, 253`) is never shown for
  a different person. 9.3a lets a remote sign-in start while someone is seated (its 4.4), so the
  same displacement runs again on `npc_borrowed_session`, before the guest is recorded, and the
  server clears `sessions[pcId]` when it records the borrow as done. This
  is the choice that is clearest to a student: it is what happens on a real shared PC when someone
  else sits down and signs in, the message says who and why, and it means the session the NPC then
  leaves behind is always the one a click reaches. The alternative, leaving the player's session
  in place, would show the player's old desktop at a PC an NPC has just used and hide the opening.
- **The use.** The verdict runs as anywhere. If the failure belonged to the NPC's own PC, work now
  succeeds and frustration eases. If the resource itself is down, it fails there too; that failure
  gets its mutter and its `npc_use_failed` but is **not reported** to the server, because it is
  the same episode as the failure that sent the NPC there and would otherwise meet the pace floor
  seconds after it.
- **Leaving.** Whether or not the use was met, the NPC signed in before finding out, so a session
  is left. `_completeJob` emits `npc_borrowed_session:<pcId>` with `{ npcId, objectId, met }`, and
  the runner posts "done" then. When the answer arrives, the workstation layer records the NPC as
  that PC's **guest** (the client and the server record it at the same moment, so a click in
  between is never refused by the server) and
  treats the moment as a leave with the screen left open: `autoLockMin` above 0 sets `lockAt` as
  for an owner, the globals `<pcId>_owner_away` and `<pcId>_screen_locked` are published, and
  `workstation_owner_left:<pcId>` fires with `{ objectId, ownerId: <npcId>, screenLocked: false,
  reason: "guest" }`. The locked-screen look and the indicator dot follow those events as now.
  `s.borrow` is cleared; a later hand-over sets it again.
- **A careful guest.** Where slice 9.1 is built and the NPC's `locksScreen` habit is `always`
  (`Game#npc_habit(npc, "locksScreen")`), the server sends `leavesOpen: false` in `run`: the NPC
  works at the hot desk and signs out, no guest record is made, and the server's guest claim
  refuses on the same test. `sometimes` counts as leaving open, with no roll at a borrowed PC (9.1's
  14.2). No habit reaches the browser. The validator warns that such a workaround opens nothing.
- **The claim.** With a guest record and nobody at the PC, `onInteract` returns `accessed`, and
  `interactLoginPc` (`unlock-system.js`) claims through `pc-sessions.js` with `claim: "guest"`.
  The server's checks are in section 9.1. The desktop is the guest's: the PC's own contents and every
  profile that admits them.
- **It ends** when the screen's auto lock fires, when anybody next sits at that PC (by
  displacement, above), or on a reload (the first slice's rule for every claim).

### 6.5 `share_login`: said out loud (H)

- **Authoring.** `with` names another room NPC. The NPC has an account.
- **The errand.** A walk to a cell beside the colleague (6 seconds). On arrival the NPC says one
  line from the pool `login_aloud` ("Can you run it on my login?", "Use mine. It's the usual
  one."). Pool lines ship, so they never hold a username or a password.
- **Heard.** During the dwell the runner asks, each tick, whether the player hears: in the same
  room, within the chat overhear radius (`OVERHEAR_RADIUS`, 160 px), with a clear line, the test
  `world.playerHears` (`npc-needs.js:1674`) already makes for chatter. At the first tick that
  hears, it notes the player's room, `window.currentPlayerRoom` (`core/rooms.js:3101`). At the
  end it posts "done" with `heard` true or false and, when heard, that `room_id`.
- **What the server checks.** The server cannot see where the player stands, and its own
  `player_state.currentRoom` is never updated by the browser (section 2, faults found). So "heard"
  is a client claim, bounded as `GET /login_accounts` is: it counts only when `room_id` is a room
  the `with` NPC can be in (its own room, plus its `needsRooms` leash when it has one) and that room
  is open to the player: never locked, or unlocked (`Game#room_unlocked?`, `game.rb:116-118`), the
  test `login_pc_reachable?` makes for a room (`game.rb:1272`). Otherwise it is taken as not heard. The bound is "a room the player has opened where the share can happen"; it is not
  proof that the player was there.
- **A heard answer explains itself.** The server answers `{ capture, line, note }`. `line` is the
  sentence the player overheard, composed on the server from `creds`: "It's jbrooks. Password's
  ...". The client shows it as a toast titled "Overheard: <displayName>", adds an evidence note
  with `note` ("Jake Brooks told Dana Reyes his login out loud: jbrooks / ..."), records the
  capture through `window.recordSECapture` (`{ targetId, kind: "credential", address: <username>,
  note }`), and emits `npc_overheard_login:<npcId>`. The player sees who said what to whom and
  holds the password in their notes, whether or not the scenario has a captures terminal. Where
  `social.captures.revealSecret` is on, the terminal (or, where the engine plan is built, the
  capture log's Credentials section) also shows it, through `/capture_secrets` (section 9.1).
- **A heard share stays in turn.** It comes round again after a later failure, like any repeating
  workaround. Hearing it twice is harmless (captures are first-wins), and it means a heard answer
  lost with a closed page is never lost for good.
- **Not heard:** the answer is empty, nothing is recorded, and the workaround comes round again
  after the next failed use.

### 6.6 Lockout as a cause (L)

A member of staff who is locked out at their own PC cannot work there. This is the one cause of
failure the server can check for itself, and the one chain a player can start with nothing but a
sign-in screen.

- **When it applies.** The first slice locks a username out per PC (`loginLockouts`). An owner
  finds out only when they have to type their password: on `workstation_owner_returned:<pcId>`
  with `wasLocked: true`, at a PC under a policy with `maxAttempts`, the client sends a `check`
  report for that owner and PC (section 9.1), but **only for a PC where this browser has had a
  lockout answer from `POST /login`** (at the keyboard or, with 9.3a, through the drop box), or
  where the scenario response's `npcFrustration` already lists the owner as locked out there. In
  any other case a check could only answer no, so none is sent, and a mission with no lockout
  sends no check at all. The server answers `lockedOut: true` when `loginLockouts` holds the
  owner's username at that PC, and records it (`lockedOut` in 9.4), so a reload can restore it.
- **The first use waits for the answer.** The owner's first use after the return holds its verdict
  until the check is answered (the use's dwell is longer than one request in practice; if not, the
  use waits at the desk), so a slow answer never lets one use through as met.
- **While locked out**, that NPC's uses of that PC fail with `locked_out` (a station failure), the
  mutter comes from `station_fail`, and frustration rises as for any failure. Whenever the owner
  leaves that PC the screen locks, whatever its `lockChance`, and the server refuses an owner claim
  there while `loginLockouts` holds the owner's username at it: a person who cannot sign in cannot
  leave a session open. An owner whose screen never locks never types a password and is never
  affected.
- **After a reload** the owner's flag comes back from `npcFrustration` when their room loads, so
  they do not sit back down and work until their next locked return.
- **What the browser learns, and when.** That this owner is locked out at this PC, at the moment
  the owner comes back to the locked screen, which is the moment the game shows it anyway. The
  sign-in screen's answers do not change, and no list of locked-out accounts is ever sent. What it
  does reveal, the question for the user in decision 14: the player who locked out a guessed
  username learns, when the owner returns, whether that username was the owner's.
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

One pure module, `public/break_escape/js/systems/pc-policy.js` (new), with no imports, so node
tests load it directly:

- `effectivePolicy(objectData, scenario)`: the object's `policy`, else `defaultPolicy`, as
  `workstation-state.js:370` resolves it;
- `usbGoverned(objectData)`: the rule above;
- `usbRefused(policy, usbClass)`: the table;
- `usbPolicyFor(objectData, scenario)`: the effective `usb` value, or null when the object is not
  governed;
- `plantRefusal(heldItems, objectData, scenario)`: the player's plant decision (below), returning
  `{ item, refusal }`, where `item` is the held item to use and `refusal` is null or the refusal
  line.

The module also sets `window.pcPolicy` to the same functions when `window` exists. `npc-needs.js`
keeps its rule of no imports: the live adapter in `createEngineWorld` reads
`window.pcPolicy?.usbPolicyFor(...)` in `describe`, and answers null without it (nothing is
refused). `interactions.js` imports the module, which loads it at engine start; node tests of the
needs core describe objects through their stub world and never need it.

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

**The player's own plant.** In the `requiresItem` branch (`interactions.js:825`), the branch
gathers every held item that matches `requiresItem` (today it takes the first, `:827-830`) and
asks `pcPolicy.plantRefusal`. It uses the first matching item the object's policy accepts, so a
player holding both a storage stick and a keyboard-type device is never refused when one of them
would work. Only when every matching item is refused does the click show "USB storage is disabled
on this PC." or "USB devices are disabled on this PC." for the time `hintToastMs` gives, emit
`usb_refused:<objectId>` with `{ objectId, itemId, usbClass }`, run no action and consume nothing. This branch is never reached on a sign-in PC, which returns earlier
(`interactions.js:797-806`), and policies mostly sit on sign-in PCs. So a plant the policy should
govern goes on a separate object beside the PC that names the same `policy` (a dock, a USB hub),
which is the shape the author docs already give for plants at sign-in PCs.

**Any other path that plants a USB device asks the same question.** Slice 9.3b's implant (a
`grant_foothold` from a device an NPC uses at a PC, its 12.5) is one. Its `POST /network/implant`
refuses when the PC is governed and the device's `usbClass` is refused; both are scenario facts, so
that check is the server's own. The implant is 9.3b's, so the check is built with it: in the
expected order 9.3b comes after this slice and adds a Ruby `usb_refused?(pc, item)` beside
`effective_policy` (`game.rb:1373`), reading the same table as `pc-policy.js`, with a validator
warning for a `grant_foothold` whose PC refuses its device. Sub-slice U has no route. If the user
schedules 9.3b before this slice, U-2 adds that one check instead.

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
(`POST /feed_post`, section 9.1). The server answers with the post, or with nothing, and says when the
feed has run out so the client stops asking.

**A post and its fact are withheld together.** A feed post's `fact` names a `social.intelFacts`
entry, and that block ships in the bootstrap. So:

- A **feed fact** is a fact named by a feed post. The server deletes every feed fact's entry from
  `social.intelFacts` in the bootstrap, and never the key itself: an empty `intelFacts` must stay
  an object, because `grantFact` grants any id when the block is absent (`social-intel.js:191-196`). The entry (its `text`, `label`, `subject`, `provides`)
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
- emits `npc_posted:<npcId>` with `{ npcId, postId, index, site, person }`; an osint browser that
  is open on that profile re-renders on the event, so a post made while the player is reading
  appears without closing the browser;
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
it prints the minute at which each post is expected. The server's post floor uses the same
period, computed in `access_work.rb` as `min(restores, 100 - urgentAt) / decayPerMin` game
minutes, with the need's own `urgentAt` and `decayPerMin` and the smallest `restores` among the
NPC's options (`socialUse`, default 60, for the phone and its PC, and each object whose
`affordance.satisfies` lists `social_media`). A larger `restores` only lengthens the real period,
so the floor never refuses an honest post; the floor is 0.9 of this period (section 9.1).

## 9. Server

### 9.1 Routes

Every route this slice adds or changes, with its checks in the order they run. "Locked" means the
action joins the `with_game_lock` list (`games_controller.rb:88-89`).

**"NPC known":** the id names a room NPC (`scenario_room_npc`, `game.rb:1211`) and is in
`encounteredNPCs`, which the server fills when the NPC's room is loaded (`track_npc_encounters`,
`games_controller.rb:1714`). The needs system only runs NPCs in loaded rooms, so every honest
report passes. It means "the NPC's room has loaded", not "the player is near".

**"Can fail".** A fail report is accepted only where the scenario makes a failure possible for
that NPC and need:

- `work`: a resource in the NPC's resolved list is not admitted or has a `downIf`; or the NPC's
  home PC, or a PC one of its `borrow_session` workarounds names, has a `downIf`; or (sub-slice L)
  the home PC is under a policy with `maxAttempts`; or a need's `routes` (9.3) are empty or carry
  a global.
- `social_media`: the NPC has the need and `"phone": false`, and its home PC is under a policy
  that blocks social media or has a `downIf`.

**"A cause holds".** Each fail report lists its causes. The server checks each against its own
view: `no_access` and `social_blocked` from the scenario; `down`, `station_down` and `unreachable`
from the server's copy of the globals (`player_state.globalVariables`, else the scenario default,
with 9.3's `NetworkModel` for reach); `locked_out` from `loginLockouts`. At least one must hold.
Globals are written by the browser, so for those three causes this is consistency and honest logs,
not protection; `no_access`, `social_blocked` and `locked_out` are the server's own facts.

**Pace floors.** All in server time and all at 0.9 of the honest client's shortest interval; the
tenth is slack for clock rounding and for the two second batch window (which is why `retryMin` is
at least 0.5). The needs clock follows frame time, which never runs faster than server time.

- **The first fail** for an NPC and need is counted no sooner than 0.9 of the station's use time
  after the NPC was first met (`metAt`, written by `track_npc_encounters` for an NPC with a `work`
  plan or a feed, 9.4). The outage kick (5.6) means an honest NPC can fail within one use of being
  met, so no longer floor is possible here.
- **A later fail** is counted at most once per 0.9 of the retry wait plus the use time
  (`0.9 x (retryMin x 60 + useSeconds)` seconds).
- **An ease** is counted at most once per 0.9 of the station's use time: met uses are spaced by
  the need's period, which can be shorter than the retry wait, so tying eases to `retryMin` would
  lose honest eases.
- Fails and eases are floored per NPC **and per need**, so an NPC failing at both work and social
  media loses neither report. The price is stated, not hidden: such an NPC can be walked up at up
  to twice the rate of one need (9.3).
- **A "done"** is accepted no sooner than the workaround's dwell after its hand-over.
- **A post** is served no sooner than 0.9 of the need's period (8.3) after that NPC's last one.

Every case where an honest client could meet a floor is designed out above: a failed borrowed use
is not reported (6.4), an ease floor follows the use time, and the batch window is inside the
slack.

**Ceilings.** A request carries at most 20 reports; more is a 422. The client sends at most one
report request every two seconds, sends no fail for a settled NPC, and stops asking for posts when
told the feed is done. Each scripted run checks the number of requests against a budget (section
11).

| Route | Sub-slice | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|---|
| `POST /npc_frustration` (new, locked) | A; `run` from B; `check` in L | `reports`: a list of `{ npc_id, event, need, object_id, missing }`, `event` being `fail`, `ease` or `check` | Per report. 1. NPC known. 2. `fail`: can fail. 3. `fail`: a cause holds. 4. `fail` and `ease`: the pace floor for that NPC and need. `check`: the object is a sign-in PC this NPC owns, under a policy with `maxAttempts` | One answer per report, in order. `fail`: level up by `perFail`, at most 100; then choose `run` (section 6), record the hand-over, its number and its time. `ease`: level down by `easePerSuccess`, at least 0; never a `run`. Both answer `{ npcId, level, previous, tell, settled, run }`. `check`: `{ npcId, lockedOut }`; a true answer records the PC in that NPC's `lockedOut` list (9.4), and nothing else is written. Check 1 or 2 fails: `{ npcId, refused: true }`. Check 3 fails: `{ npcId, stale: true }`. Check 4 fails: the current `{ level, tell, settled }` with `tooSoon: true`. A refused, stale or too-soon report writes nothing |
| `POST /npc_workaround` (new, locked) | B, H | `npc_id`, `index`, `hand`, `heard`, `room_id`, `dropped` | 1. NPC known. 2. `hand` is that workaround's last spent hand-over and was spent as done: answer the same body again, recomposed, and write nothing. 3. Otherwise `hand` is handed over and not yet spent. 4. Unless `dropped`: at least the workaround's dwell since the hand-over. 5. `share_login` with `heard`: `room_id` is a room the `with` NPC can be in (its own, plus its `needsRooms`) and is open to the player (never locked, or `room_unlocked?`); otherwise it is taken as not heard | The hand-over is spent and recorded in `lastSpent`. `dropped`: nothing else; answer `{}`. Otherwise add `index` to `done` (lasting ones), set a declared `setGlobal` true, and by kind: `writes_down`: answer `{ pcId, hasPostit: true }`. `prop_door`: unlock the room and answer `{ roomId, roomData }` through `serve_opened_room` (below). `emit`: `{}`. `borrow_session`: `guestSessions[pc] = npcId`, clear `sessions[pc]`; `{}`. `share_login` heard: add the NPC to `sharedLogins` once, keep it in turn, answer `{ capture, line, note }`; not heard: `{}`. Check 3 fails: 403. Check 4 fails: 425, and the client sends it again after the dwell |
| `POST /login` with `claim: "guest"` (changed, locked) | H | `pc_id`, `claim` | 1. PC reachable (first slice). 2. No session is held at the PC. 3. `guestSessions[pcId]` names an NPC. 4. That NPC has an account. 5. The PC's `access` admits it. 6. The PC's policy is not `autoLockMin: 0`. 7. Where 9.1 is built: that NPC's `locksScreen` is not `always` | Success: `sessions[pcId] = { id, via: "claim" }`, add to `signedInPcs`; the answer a claim gives today. Failure: "Sign in required" |
| `POST /login` with `claim: "owner"` (changed, locked) | L | as today | As today, plus: refused when `loginLockouts` holds the owner's username at that PC | As today; refusal "Sign in required" |
| `GET /login_accounts` (changed by 9.1; extended here) | B | as today | As today. | `postitNote` when `login_postit_for(pc)` returns one, which now includes an owner whose `writes_down` is done; `no-store` |
| `GET /capture_secrets` (changed) | H | as today | As today. | An account holder in `sharedLogins` counts as having a capture route whose proof holds (`account_capture_passwords`, `game.rb:957`; the engine plan's `proof` rule, section 15). The proof is the server's own record of a heard "done", as strong as that client claim (6.5) |
| `POST /feed_post` (new, locked) | C | `npc_id` | 1. NPC known. 2. The NPC has a `feed` with posts and a valid `social_media` need. 3. A post is left. 4. For a second or later post: the pace floor. | `feedRevealed[npcId] = { n, at }`; answer `{ index, post, fact, site, person, done }`, where `fact` is `{ id, entry }` for a post with a feed fact and `done` is true when that was the last post. Check 3 fails: `{ post: null, done: true }`. Check 4 fails: `{ post: null, done: false }` |
| `GET /scenario` (changed) | A, B, H, C | as today | As today. | `filtered_scenario_for_bootstrap` also deletes `resources` and `roles` (where 9.3 or 9.1 already delete them or part of them, nothing more is needed) and, in C, every feed fact from `social.intelFacts`. The `scenario` action adds `npcFrustration` (per NPC: `level`, `tell`, `settled`, `pending`, the handed-over workarounds not yet spent, as `run` descriptions, `done`, likewise, each with its `setGlobal`, and `lockedOut`, the PCs a true `check` recorded) and `feedPosts` (per NPC: `site`, `person`, the posts revealed so far with their fact entries, and `done`). After answering it clears `guestSessions`, as it ends claimed sessions (`end_claimed_sessions!`, `game.rb:1495`), with the same row lock |
| `GET /room/:id` and the room data of a door unlock (changed) | A, C | as today | As today. | Through `filtered_room_data`: each room NPC gains `work` (5.1) and, with a feed, `hasFeed: true`; `workNeeds`, `frustration` and `feed` are deleted beside the keys withheld today. `hasPostit` on a PC is 9.1's and follows `written_down?` |
**`serve_opened_room(room_id)`.** The tail of the door unlock (`games_controller.rb:918-930`) is
factored into one controller helper: unlock the room, compose `filtered_room_data`, record the
room's NPCs as encountered, return the room data. The door unlock and `prop_door` both call it, so
NPCs in a propped room are "known" from that moment.

**A station that is down, seen from the network.** 9.3a's host row has three states (Sign in,
Open, remote sign-in off) and none is "not responding"; outages for the player are 9.3b's (its
12.2). So this slice changes nothing in 9.3's view or in its `desktop_request_allowed?`. A sign-in
PC whose own `downIf` is truthy still accepts a remote sign-in through 9.3a. Showing such a host as
"not responding" and refusing it remotely is listed for 9.3b (section 15).

No route is added for the USB policy (section 7).

### 9.2 What the browser receives and what it does not

| Data | Reaches the browser | Withheld |
|---|---|---|
| `resources`, `roles` | Never as authored. Each NPC's own plan, as `work`: resource ids and kinds, `admitted`, `downIf` names, `object`, `routes` (lists of `downIf` global names), `stationDownIf`, `retryMin`, `breakDrain` | Every resource display name (`name`), access lists on resources, role defaults, who has which role, every network id and link, a resource's `network`, `host`, `contents` and `observations` |
| `workNeeds`, `frustration` | No | Deleted from every room NPC |
| `workarounds` | One at a time, as `run`, when the server decides it is due; again in `npcFrustration` on a load | The list, the thresholds, and every workaround not yet due |
| Frustration | The level and `tell`, in each answer and on a load | `perFail` and `easePerSuccess` |
| A written-down password | Only in a `GET /login_accounts` answer for the owner's own reachable PC, after the workaround is done (9.1's channel), and afterwards in the player's own saved notes if they press "add to notebook" | Before that. Never in room data, the bootstrap, a `/npc_workaround` answer or a door unlock |
| A shared login | In the `/npc_workaround` answer to a heard `share_login` (`line`, `note`, and the username in `capture`), then in the player's saved notes; from `/capture_secrets` once the capture is recorded and `revealSecret` is on | Before that; and always, when the player did not hear |
| A lockout of an owner | `lockedOut` in the answer to a `check` report, sent when the owner returns to the locked screen | A list of locked-out accounts is never sent; sign-in answers are unchanged |
| `feed` posts | Posts revealed so far, one per answer and all on a load; `hasFeed: true` on the NPC; `done` once the last is out | Every post not yet revealed, and how many there are |
| Feed facts | The entry of each revealed post's fact, with the post; afterwards in the evidence note the player's own click adds | The entry of every unrevealed post's fact. Its id may appear in a readiness slot; its text never |
| `policies` | As today (the bootstrap ships them); `usb` and `social` are not secret | Nothing |
| `phone`, `socialUse`, `needs`, `usbClass`, `downIf` | As authored | Nothing |

**What is not secret, and ships.** Ids, kinds, global names and event names: a resource id, a
`downIf` global, a workaround's `setGlobal`, a pool name such as `login_aloud`, a mapping on
`npc_workaround:<id>` or on an `emit` event, and a prop hidden on a workaround's global. 9.3a takes
the same line (its section 6): an id names nothing the player can use, and what is protected is
display names, host labels, contents, passwords, and the list and thresholds of workarounds. A
player who reads traffic can infer that "something may happen to Jake" from a hidden wedge or a
mapping; they cannot learn what, when, or what it will open (decision 12). So 9.3a's no-exposure
test, which allows no resource name in any `/room` response, holds unchanged with this slice
built.

Where the code goes:

- `compile_npc_plan!(npc)` (new) runs in the NPC loop of `filter_requires_and_contents_recursive`
  (`game.rb:3947-3950`) just before `withhold_npc_secrets!`, because it needs `role`, which that
  method deletes. NPCs added by `update_room` are merged before the filter runs, so they are
  covered. In a scenario with `networks` it calls 9.3's `NetworkModel.reach_conditions` here for
  `routes`, and 9.3a's `resource_acl_admits?` for `admitted`.
- `WITHHELD_NPC_KEYS` (`game.rb:3968`) gains `workNeeds`, `frustration` and `feed`. `workarounds`
  is there already.
- `filtered_scenario_for_bootstrap` (`game.rb:887`) deletes `resources` and `roles` beside
  `accountProfiles`, and feed facts from `social.intelFacts`.
- The validator keeps `workNeeds`, `frustration`, `workarounds` and `feed` off every NPC record
  that is not a room NPC (section 10), so they cannot ship through `npcs`, `phoneNPCs` or `social`.
- A mutter pool is text that ships. The validator errors when any NPC's password appears in one, or
  in a feed post or a feed fact. (A resource `name` never ships from this slice; 9.3a's validator
  already errors on a password in it.)

**The no-exposure test.** The first slice's no-password test gains a fixture NPC with work needs,
each kind of workaround and a feed with a feed fact, and these assertions over every route. Every
check can fail on a wrong build and pass on a right one; none is a loose substring search over
short strings:

- before any report: no response holds the password; no response holds a workaround's `do` value
  beside its target (`"do": "prop_door"` with its `door`, and so on), which is how the scanner reads
  it too; and no response holds an authored resource `name`;
- before its post is out, **structurally**: no response holds an object keyed by a feed fact's id
  with a `text` key, and the bootstrap's `social.intelFacts` has no feed fact key (and is still an
  object);
- before its post is out, **textually**: no response holds the whole `text` of a feed post or the
  whole `text` of a feed fact, each matched whole. A fact's `label` and `provides` values are not
  searched for: real ones are words such as "Finance" or "Melanie"
  (`scenarios/lab_social_engineering/scenario.json.erb:466-469`), which occur in room ids, NPC
  names and other facts in every response. The validator warns about a feed fact or feed post whose
  `text` is under 12 characters or occurs inside another string that ships, because the textual
  check cannot protect it;
- after `writes_down` is done: the password is in the `/login_accounts` answer for that PC and in
  no other response, the `/npc_workaround` answer included;
- after a heard `share_login`: it is in the `/npc_workaround` answers to heard shares and in
  `/capture_secrets`, and nowhere else; after an unheard one, nowhere;
- after one `/feed_post`: the first post and its fact entry are in that answer and in
  `GET /scenario`, and the second post and its fact are nowhere.

### 9.3 What these checks prove, and what a tampered browser still gets

The server cannot see an NPC use anything, and outages are globals the browser writes. So, as with
a claimed session in the first slice and with every hand-over the engine already takes from the
browser (captures, globals, a card copy), a report is a client claim: honoured only where the
scenario makes it possible, checked against the server's own copy of the cause, and held to a pace
in server time.

A browser that has been modified can, for any NPC whose room has loaded, with no outage caused in
play and without the player standing anywhere in particular:

- set the outage global itself and report failures at the pace floors, so reach a workaround after
  `(ceil(at / perFail) - 1) x 0.9 x (retryMin x 60 + useSeconds)` seconds of server time from the
  first counted fail, which can itself come one use time after the room loads; plus the
  workaround's dwell. When `at` is at or below `perFail` that is **at once**: the workaround is
  handed over on the first report. With the defaults (`perFail` 25, `retryMin` 1, a 10 second
  desk use) a workaround at 50 is about 63 seconds away. Floors are per need, so for an NPC with
  two needs that can fail the figure is about halved;
- then read a `writes_down` password from `/login_accounts`;
- open a `prop_door` room;
- claim a guest session at a hot desk;
- report a `share_login` as heard, naming a room the player has opened where the colleague can be,
  and read that login;
- ask `/feed_post` for every post and its fact at the post floor, with the NPC never touching a
  phone or a PC, whatever the `social` policy (the route checks only "NPC known", the feed and the
  floor);
- send a `check` for any owner at any time, not only at the owner's return: after three wrong
  passwords for a guessed username at a PC, that answers whether the username is the owner's
  (decision 14);
- set `se_intel_<id>` itself, which satisfies a readiness slot or a phishing factor that names a
  feed fact, without ever having the fact's text.

It cannot: make an NPC do a workaround the scenario did not give it; go faster than the floors;
spend one hand-over twice; fake a lockout (the server owns `loginLockouts`); or read a password, a
workaround, a post or a feed fact before the server has handed it over.

This residual is accepted (decision 5). What keeps it small in practice: the validator prints, for
every workaround, what it opens and the earliest it can be reached, and warns when what it opens
holds a flag station or a VM launcher, so an author puts anything that must not be passable this
way behind something the server checks itself (first slice plan 4.2): a password typed at a
sign-in PC, a PIN, a keycard picked up from a room the server knows is open.

### 9.4 State and saved games

New `player_state` keys, added to `ACCESS_STATE_DEFAULTS` (`game.rb:1123`) so
`initialize_player_state` fills them, and left off `preserved_keys` (`game.rb:95`) so a reset
drops them:

| Key | Sub-slice | Shape | Meaning |
|---|---|---|---|
| `npcFrustration` | A, B, L | `{ npcId: { level, metAt, failAt: { need: time }, easeAt: { need: time }, hands, handed: { index: { hand, time } }, lastSpent: { index: { hand, done } }, done: [index], turn, lockedOut: [pcId] } }` | The level; when the NPC was first met (for the first fail floor); the server time of the last counted fail and ease for each need; the count of hand-overs; the hand-overs not yet spent and when each was made; the last spent hand-over of each workaround and whether it was done (so a resent "done" is answered again); the lasting workarounds done; whose turn it is among the repeating ones; the PCs where a `check` found the owner locked out |
| `guestSessions` | H | `{ pcId: npcId }` | Who last left a borrowed session at each PC |
| `sharedLogins` | H | `[npcId]` | Accounts the player heard shared |
| `feedRevealed` | C | `{ npcId: { n, at } }` | How many of each NPC's posts are out, and when the last came out |

All four are bounded by the scenario (one entry per NPC or PC). A game saved before this build has
none of them: every reader goes through a helper that treats a missing key as empty, as
`access_sessions` does (`game.rb:1275`). A game's scenario data is fixed when the game is created,
so a game made before a scenario gained these fields plays on without them.

What a load does:

| Thing | After a reload |
|---|---|
| Frustration level and `tell` | Kept: `npcFrustration` in the scenario response; applied when the NPC's room loads and its needs state is made (5.4) |
| Need levels, retry waits, errand queues, `s.borrow`, the "checked" and "refused" memories | Reset, as all needs state is today. Needs restart at `initial`, so the outage kick (5.6) is what brings an NPC back to a failing desk at once after a reload |
| An owner's `locked_out` flag | Kept: `lockedOut` in `npcFrustration`, applied when the owner's room loads |
| A workaround handed over and not spent | Sent again as `pending`; the runner starts it again when the NPC is registered |
| A pending borrow | Set again, with its 60 second start limit from the load. Needs restart at `initial`, so the borrow starts only if the need is urgent: when the outage that caused it still holds, the kick (5.6) makes `work` urgent at once and the NPC goes; otherwise (a lockout, which has no global) the borrow lapses, is dropped, and comes round after the next failure |
| A done workaround's `setGlobal` | Kept on the server, and set again by the client from the `done` list |
| A lasting workaround that is done | Still in force: the room is in `unlockedRooms`, `hasPostit` is in room data and the note in `/login_accounts`, an `emit` is not sent again |
| A guest session and its claim | Ended, as every claim is; the PC shows the sign-in screen until the NPC borrows it again |
| A session of the player's that an NPC displaced | Gone on both sides |
| A heard login | Kept: the capture is in `se_captures`, the evidence note in the saved notes |
| Revealed posts and their facts | Kept: `feedPosts`; merged before the browser can open |
| Outages | Kept: they are globals |

## 10. Validator, schema and dungeon graph

**One resolver.** A new pure module, `lib/break_escape/access_work.rb`, resolves an NPC's work list
(roles in order, `staff` last, then the NPC's own `+` and `-`), its frustration settings (role
defaults, then the NPC's own, field by field), its workarounds (the NPC's list, else the first of
its roles that has one), the "can fail" rule, the list of feed facts, an object's use time (its
`affordance.useSeconds`, else its office preset's, read from `office-presets.json` as
`validate_npc_needs.rb` reads it) and the post period of 8.3. `game.rb` and the validator both
call it, as both call `BreakEscape::DeclaredGrants`, so the server and the validator cannot drift
apart. Like 9.1's library it is plain Ruby with no Rails methods. It walks roles with 9.1's
`identity_roles(npc)` order (9.1's 14.2).

**Files.** `scripts/validate_scenario.rb`: the known-field lists (`:391-419`, `:487-512`) gain
`resources` and `roles` (each is added only if a sibling slice has not added it already); NPC
`workNeeds`, `frustration`, `workarounds`, `phone`, `socialUse`, `feed`; item `usbClass` and
`downIf`. The checks go in a new `scripts/validate_access_work.rb` (`require_relative`, as
`validate_npc_needs.rb` is). `scripts/validate_npc_needs.rb` skips `social_media` in its "no
object satisfies it" error (`:481-483`) and applies its pool line check to the new pools.
`scripts/scenario-schema.json` gains the same fields, inserted as text (the file must not be
re-serialised), with `usb` gaining `storage_blocked`; under `roles.<role>` this slice adds its
three properties and leaves `additionalProperties` open for 9.1's `awareness`.

Errors:

- a reference that resolves to nothing: a `workNeeds` entry (after its `+` or `-`), a resource's
  `object`, a person in a resource's `access`, a workaround's `pc`, `with`, `door` or `prop`, a
  feed's `site` (it must be a `social` site) or `person` (a profile on that site);
- `workNeeds`, `frustration`, `workarounds` or `feed` on an NPC record that is not a room NPC;
- a value out of bounds: `at` outside 1 to 100, a frustration field outside its range, an unknown
  `do`, an unknown `usbClass`, an unknown `usb` or `social` policy value;
- a workaround `setGlobal` that `globalVariables` does not declare; an authored global whose name
  ends in `_frustration`;
- `writes_down`: the NPC has no account, or its `needsHome` is not a sign-in PC;
- `prop_door`: `door` is not a locked room, is behind a gate door, or is the NPC's own home room;
  `prop` is not in a room connected to `door`, or is in `door` itself;
- `emit` with no `event`;
- `borrow_session`: the NPC has no account; `pc` is not a sign-in PC, has an owner, is `private`,
  is `headless`, does not admit the NPC, is under a policy with `autoLockMin: 0`, or does not
  satisfy the need the NPC would borrow it for;
- `share_login`: the NPC has no account; `with` is the NPC itself or names no room NPC;
- a feed post `id` shared with any other post or block id in `social.osint`, or with another feed
  post; a feed post `fact` that names no `social.intelFacts` entry;
- a feed fact that is also the `fact` of an authored block, document field or tool result, or the
  target of a `grant_fact` action or a call grant (8.3);
- an NPC with a `social_media` need, `"phone": false`, no workstation for a home and no object
  that satisfies the need;
- any NPC's `creds.password` inside a feed post, a feed fact or a `chatter` pool.

Warnings:

- a workaround on an NPC that can never be frustrated (the "can fail" rule is false for every need
  it has): it will never happen;
- an NPC with a resource it is not admitted to: its work never succeeds, so its workarounds happen
  without the player doing anything;
- an NPC with a resource its station can never reach (the server's `routes` for it are `[]`, for
  example a share on a network the NPC's PC is not on, or a PC on no network): its work fails from
  the first use, with no player action;
- a workaround whose hand-over needs more than five minutes of outage by the honest figure below:
  the player stands and watches for that long;
- a workaround whose `at` is at or below its NPC's `perFail` ("no warning": it comes on the first
  failure, with no `tell` 1 or 2 before it), unless it is marked `"noWarning": true`;
- a feed post or feed fact whose `text` is under 12 characters, or occurs inside another string
  that ships: the leak checks cannot protect it (9.2);
- `share_login` whose `with` NPC has a `needsRooms` leash: the share can happen in any of those
  rooms, and is heard only in one the player has opened;
- what a workaround opens (a `prop_door` room, a `writes_down` or `share_login` account's PCs, a
  `borrow_session` PC) holds a flag station or a VM launcher (section 9.3);
- a `downIf` global that `globalVariables` does not declare;
- a resource no NPC needs that also has no `contents` and no `host` (slice 9.3 authors resources
  that exist only for the player; those have one or the other and are not reported);
- `prop_door` by an NPC whose own card and role do not open that door;
- `writes_down` where the home PC authors a `postitNote` or sets `showPostit: false`;
- `borrow_session` by an NPC whose `locksScreen` is `always` (where 9.1 is built): it opens
  nothing;
- `lockChance` or `locksScreenOnLeave` on a PC named by `borrow_session` (a guest ignores them);
- a post with a `fact` on an NPC whose awareness level is `high`, unless `"deliberate": true`;
- a `usb` policy other than `allowed` that governs only objects accepting tags whose items have no
  `usbClass` (the policy does nothing there); an item with `usbClass` accepted by an object the
  policy does not govern while the scenario's `defaultPolicy` blocks its class (the author may
  have expected a refusal);
- an errand place (a check errand's `object`, a workaround's `prop` or `with`) in a room the NPC's
  leash forbids;
- an NPC with `los.challengeOnSight`, a `social_media` need and a phone: it can be walked past
  once every period of the need.

Report lines, in the style of the needs timing report:

- per NPC with work needs: the resolved list, each resource marked admitted or not, reachable or
  "never reachable from its station", and what can take it down;
- per workaround: **what it opens** (the account, PC or room); how many failed uses reach it
  (`n = ceil(at / perFail)`); whether the player sees a warning first ("tell 1, tell 2, then the
  workaround", or "no warning"); the **honest time** an outage takes to bring it, in real seconds:
  about one use time to the first failure (the outage kick, 5.6), plus
  `(n - 1) x (retryMin x 60 + useSeconds)`; and the earliest a modified browser can reach it,
  `(n - 1) x 0.9 x (retryMin x 60 + useSeconds)` seconds after the first counted fail, printed
  "at once" when `n` is 1 and halved where the NPC has two needs that can fail (9.3). `prop_door`
  adds "stays open for the mission";
- per NPC with a feed: the minute each post is expected.

Tests: `test/js/validator-access-work.test.mjs` (new, in the pattern of
`validator-access-model.test.mjs`): one fixture per error and warning, a clean fixture that raises
none, and the report lines.

**Clue sources (with 9.1 and 9.3b).** Slice 9.1's `password: "guessable"` check reads the list
`NpcHabits::Clues.readable_texts`. In the expected order this slice lands after 9.1, so sub-slice
C adds two sources to that list: each feed post's `text` (`feed.posts[].text`) and the `text` of
each feed post's fact. 9.3b's "the key appears nowhere" warning for a Wi-Fi key reads the same
list where 9.1 is built (9.3's 12.3), so it gains both with no further line. If this slice lands
before 9.1, 9.1 adds the lines when it lands.

**Dungeon graph.** `scripts/generate_dungeon_graph.rb`: each workaround is a node ("Jake: writes
it down, at 75") with an edge to what it opens: the account's sign-in node for `writes_down` and
`share_login`, the PC for `borrow_session`, the door for `prop_door`. A resource or workstation
`downIf` is a node with an edge to each workaround of each NPC it can frustrate. So a chain reads
left to right: outage, person, workaround, the thing opened. Test:
`test/js/dungeon-graph-workarounds.test.mjs` (new, beside `dungeon-graph-identities.test.mjs`).

## 11. How the slice is tested

The first slice's approach, unchanged in kind (its plan, section 8, "How the slice is tested"):

1. **Unit tests in every step**: Rails tests for each route, for the plan the server attaches and
   for what responses leave out (hand-written scenarios through `create_access_game`,
   `test/test_helper.rb`); node tests (`bin/test-js`) for the verdict, the needs hooks, the
   workstation layer, the feed and the browser merge.
2. **Two feature scenarios** built for testing, not play, under the first slice's rules for
   feature scenarios (folder with `mission.json` in `test_scenarios`, a lobby with one room per
   beat, a sign at each beat that never holds a password, `npcNeedsSeed` set to the scenario name,
   `npcWindupMs: 0`, `needsDebugOverlay: true`, one task per beat completed by the beat's own
   event, `PLAYTEST.md` with the script and the server record expected after each beat).
3. **A scripted run of each group of beats**, by the tier `AGENTS.md` gives scripted browser
   playtests, on the keyless server on :3001 (never the server on :3000), headless, with
   `--capture-responses`, one numbered step per beat, at least one reload per run, 10 to 15
   minutes each, and three checks after every beat: `verify-run.rb <game_id> --access` against the
   record `PLAYTEST.md` expects; `access-leak-check.rb` over the responses so far; and the count of
   `/npc_frustration`, `/npc_workaround` and `/feed_post` requests so far against the budget
   `PLAYTEST.md` gives for that beat. A "stuck" from that tier counts only once a run by the next
   tier up confirms it. These runs join the first slice's three as the access model's regression
   suite. Scripted runs are made at the last step of each sub-slice, not after every step (unit
   suites run at every step); after a fix to access model code, the run that found the bug is
   repeated, and the whole suite is repeated at the end of the sub-slice before it is committed.
   Request budgets count the one forced state sync per outage change (5.4) as part of the beat.
4. **Paced beats are earned in real time.** The server's pace floors measure server time, so a
   beat that needs a frustration level or a post is never reached by stepping the needs clock: the
   server would refuse the reports. The feature scenarios use short retry waits and fast needs so
   each such beat takes one to four minutes of waiting. The needs clock is stepped only for the
   auto lock (a client rule), and such moves are marked "exercised, not earned".
5. **Needs regression**: `tools/playtest/needs-baseline-capture.js` on `test_needs_sims`,
   `test_npc_needs` and `test_needs_leash` before and after each sub-slice's needs changes,
   compared with `needs-baseline-compare.js`. None of the three has resources, a `usbClass` item,
   a policy or a `social_media` need, and none of their uses is judged (`npc_used` gains `met` only
   for an NPC with a `work` plan or a `social_media` need, 5.1), so the planned difference is
   **none**.
6. **A watch-it-happen run** at the end of sub-slices A, B, H and C, by the tier `AGENTS.md` gives
   persona playtests: a player who is told only "cause trouble and see what the staff do". It
   answers, for each beat: did you see something was wrong with her; could you tell she was
   getting closer to giving up; did you see what she then did; did you understand what it gave
   you and why. Every "I did not notice" is listed. This is the check on the design aim that
   workarounds are openings the player can observe.

Every password typed in a run is read from its in-game source first, and the report carries the
earned-secrets table.

**Tooling**, each change in the sub-slice that needs it and owned by that sub-slice's surfaces and
tooling stream (section 13):

- `tools/playtest/lib/access_leak_scanner.rb`. Its secrets, read from the game's scenario data on
  the server, gain: every authored workaround (B); every feed post's whole `text` and every feed
  fact's whole `text`, and each feed fact id (C). It reports a workaround's `do` with its target in
  any response while the server has not handed it over; before the server's `feedRevealed` count
  covers its post, a feed post's or feed fact's whole text in any response, or any object keyed by
  a feed fact id with a `text` key (the structural check of 9.2); a fact's `label` and `provides`
  values are not searched for, for the reason given in 9.2; a password in a
  `/npc_workaround` answer other than a heard `share_login`. It allows a password in a
  `/login_accounts` answer when the PC's owner has a done `writes_down` (beside 9.1's habit
  rule), and a shared login or a revealed fact in `savedNotes` only after the answer that served
  it. It prints how many secrets of each kind it checked, so a run that checked none is visible,
  and still prints owners and ids, never values.
- `tools/playtest/verify-run.rb --access`: prints `npcFrustration` (level, handed, done per NPC),
  `guestSessions`, `sharedLogins` and `feedRevealed` (counts).
- `public/break_escape/js/systems/test-bridge/access.js`: `work(npcId)` (the plan, read only, and
  the level and `tell`), `guest(pcId)`, `feed()` (revealed post ids by NPC) and `reports()` (how
  many report requests were sent). `window.__test.needs.state(npcId)` already returns
  `getState()`, which gains `frustration`, `tell`, `failed`, `errands` and `distracted`.
  Documented in `docs/test-bridge.md`.

### 11.1 `scenarios/test_access_work` (sub-slices U, A, B, H and L)

Shared set-up. Policies: `managed` (`usb: "storage_blocked"`, `autoLockMin: 5`), `locked_down`
(`usb: "blocked"`), `lax`, `strict` (`maxAttempts: 3`); `defaultPolicy: "managed"`. Resources:
`email`; `finance_share` (`access` finance, `downIf: "finance_share_down"`); `printer` (`object:
"office_printer"`, `downIf: "printer_jammed"`). `roles.staff.frustration` is `{ "perFail": 20,
"retryMin": 0.5 }`, and every workaround in the beats is at 50 unless the beat says otherwise, so a
student sees the warning build before the act: the first failure gives `tell` 1 (level 20), the
second `tell` 2 and the pulse (level 40), and the third, about 70 seconds after the outage, brings
the workaround with its start line (level 60). Every owner's `work` need is fast
(`decayPerMin: 40`, `urgentAt: 50`, `initial: 60`: urgent after about 15 seconds) unless the beat
says otherwise, and every PC's `useSeconds` is 5. Outages are thrown with two plain switch
objects per global, one whose `triggerOnInteract` sets it true and one that sets it false; a single
object that toggles cannot be written with today's actions, because conditions are tested one
action at a time and the second would undo the first (`apply-actions.js:91-94`).

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| U1 Storage refused, then the kiosk | `usb_room`: Lena Fox with interests in `dev_usb` and `dev_badusb`; `lena_pc` (her post, accepts both, under `managed`); `kiosk_pc` (accepts `dev_usb`, under `lax`). On the lobby table: `kit_usb` (`usbClass: "storage"`) and `kit_badusb` (`usbClass: "hid"`) | Drop the storage stick: she carries it to her PC, `npc_use_refused:lena_pc`, a mutter, then to the kiosk, `npc_used:kiosk_pc`. Drop the keyboard-type device: her PC takes it, `npc_used:lena_pc` | None (the beat's tasks complete from the two events) |
| U2 Refused outright, and the player's own plant | `vault_room`: Priya Nair; `priya_pc` under `locked_down` is the only object that accepts her tag; `priya_dock`, a `requiresItem` object that names `locked_down` | A dropped storage stick is refused, put down by her PC and left there. Clicking the dock while holding the stick shows "USB devices are disabled on this PC." and the stick stays in the inventory | None |
| U3 A default policy does not reach a tray | `post_room`: Kofi Mensah with an interest in `dev_usb`; `lost_property_tray`, not a workstation and with no `policy`, accepts the tag | He carries a dropped stick to the tray and leaves it there with no refusal and no mutter, although the scenario's default policy blocks storage | None |
| W1 Work that succeeds | `ok_room`: Amy Cole, role `staff` (email only), `amy_pc` | She works at her desk about every 15 seconds; `npc_used:amy_pc` carries `met: true`; no mutter, no icon | No `npcFrustration` entry for Amy |
| W2 An outage you can read | `share_room`: Dana Reyes, role `finance`, `frustration: { perFail: 34 }`, no workarounds; the breaker switches for `finance_share_down`; a coffee station | Within one use of the breaker being thrown she fails: the mutter names the share ("Share's down again."), `npc_use_failed:dana` names `finance_share` as `down`, and the blocked icon stays over her between failures. After the second failure the icon pulses (`tell` 2). On her third failure her mutter comes from the fed-up pool. Her `npc_use_failed` events are followed by a coffee `npc_used` sooner than her outage-free schedule gives (asserted by event order, not by time) | `npcFrustration.dana.level` 34, 68, then 100 |
| W3 Recovery | Same room, breaker reset | Her next use is met, the level eases by 10 for each met use, and the icon goes when it reaches 0 | `level` 90, then 80 |
| W4 The printer, and a chain | `print_room`: Omar Haddad needs `printer`; `office_printer` is in the open `copy_room` next door, with a lever that sets `printer_jammed`. `omar_pc` is a sign-in PC with `lockChance: 0`; his profile holds a note with the code for `copy_cupboard`, a PIN-locked cupboard in the copy room | His use fails and he walks to the printer once (`npc_checked:office_printer`); on his later failures he stays put. While he is away a click on his PC claims his session, the note gives the code, and the code opens the cupboard. The `PLAYTEST.md` script says how to re-arm the beat if the claim window is missed: reset the lever, wait for one met use, throw it again (a new outage, so a new check errand) | `sessions.omar_pc` a claim; the cupboard in `unlockedObjects`; `npcFrustration.omar.level` 20 |
| W5 No access, and silence | `starter_room`: Kai Brennan, role `staff`, `workNeeds: ["+finance_share"]` | His work fails with `no_access` from his first use, with no player action. After the level reaches 100 the answer says `settled` and no further report is sent for him | `npcFrustration.kai.level` 100; the request count stops rising |
| W6 A PC out of order | `cable_room`: Ian Shaw; `ian_pc` has `downIf: "ian_pc_unplugged"`; a wall socket object sets it, a second one clears it | `npc_use_failed:ian` with `station: true`; the mutter comes from `station_fail` | `npcFrustration.ian.level` 20 |
| W7 The outage bites at once | `slow_room`: Nia Patel, role `staff`, a slow work need (`decayPerMin: 1`, `urgentAt: 50`, `initial: 100`: left alone, first urgent after 50 minutes), the switches for `printer_jammed` and `workNeeds: ["+printer"]` | The player watches her work once (the room's sign says to wait for it), then jams the printer. Within about one use time she tries to work, fails and mutters about the printer, without waiting for her need to run down | `npcFrustration.nia.level` 20 |
| X1 The sticky note, and a second link | `note_room`: Mei Lin, an account; `mei_pc`, a sign-in PC with `lockChance: 1`; resource `rota` with a switch; `workarounds: [{ "at": 50, "do": "writes_down" }]`; her profile holds the door code for `records_nook` | Before the outage the sign-in screen shows no note. After the outage she fails three times: the icon appears after the first and pulses after the second. At the third she says "I'll never remember this one.", writes at her desk, a yellow note appears on the monitor, and `npc_workaround:mei` fires with `started`, then `done`. When she next leaves, the sign-in screen shows "<username> / <password>", it signs in, her desktop gives the door code, and the code opens the nook | `npcFrustration.mei.done` is `[0]`; `sessions.mei_pc` Mei by password; `unlockedRooms` has `records_nook` |
| X2 The propped door | `store_lobby`: Tom Fletcher, role `facilities`, with a card; `store_room` behind an `rfid` door that admits `facilities`, with Una Walsh inside; `store_wedge` (a fire extinguisher) hidden on `store_door_propped`; a workaround at 50 | Tom walks to the door, it opens, the extinguisher appears and `door_propped:store_room` fires. The player walks in | `unlockedRooms` has `store_room`; `encounteredNPCs` has `una`; the global is true on the server; `npcFrustration.tom.done` is `[0]` |
| X3 An event, with no warning by design | `ok_room`: Amy gains a second resource with a switch, `frustration: { perFail: 50 }` and `[{ "at": 50, "do": "emit", "event": "amy_gave_up", "noWarning": true }]`, mapped to a task | One failed use completes the task, with no `tell` 1 or 2 before it; the validator's report says "no warning" for it | `npcFrustration.amy.done` is `[0]` |
| X4 Reload in the middle | During X2: as `npc_workaround:tom` fires with `phase: "started"`, the run sets the needs clock to manual, so Tom stops where he is, then reloads; later, again just after the door opens | After the first reload Tom, whose workaround was handed over and not spent, sets off again and props the door. After the second, the door is open and the extinguisher is shown | As X2 |
| H1 The hot desk, and a second link | `cable_room` again: Ian has `[{ "at": 50, "do": "borrow_session", "pc": "hot_desk" }]`; `hot_desk` is in the lobby, unowned, satisfies `work`, under `managed`; Ian's profile holds a note with the PIN of `comms_cabinet` in the lobby | At his third failure at his unplugged PC he says "I'll use the spare PC.", gets up at once, walks to the hot desk and works there (met, so his level eases). A click while he sits there shows "Ian Shaw is using this PC". After he walks back a click opens his desktop, and the note's PIN opens the cabinet. The run then plugs his PC back in and, once his next use is met, steps the needs clock just past five game minutes: the desktop closes with "The screen locked" (exercised, not earned) | `guestSessions.hot_desk` is `ian`; `sessions.hot_desk` a claim, then gone; the cabinet in `unlockedObjects` |
| H2 Signed in when he arrives | The H run's own source: a readable note in an unlocked lobby drawer (a clue item, not a beat sign) gives the password of `temp_user`, an account the hot desk admits. The player signs in at `hot_desk` as that account and leaves the desktop open. Then Ian's PC is unplugged again | When Ian sits down the desktop closes with "Ian Shaw has signed in at this PC" and `pc_signed_out` fires with `reason: "displaced"`. After he leaves, a click opens Ian's desktop, not the temporary account's | `sessions.hot_desk` `temp_user` by password, then absent, then a claim for Ian |
| H3 The hot desk does not help | `share_room`: Dana gains a `borrow_session` to `hot_desk` at 50; the breaker is thrown | She walks to the hot desk, her use fails there too (`npc_borrowed_session:hot_desk` with `met: false`), and she still leaves a session that can be claimed | `guestSessions.hot_desk` is `dana`; her level still rising |
| H4 Said out loud | `open_office`: Sam Okafor (an account) and Ruth Adeyemi at the far desk; `[{ "at": 50, "do": "share_login", "with": "ruth" }]` | With the player out of the room, Sam walks over and speaks; nothing is noted. On his next failed use, with the player beside Ruth's desk, a toast reads "Overheard: Sam Okafor" with his login, an evidence note is added, and `npc_overheard_login:sam` fires. The noted password then signs in as Sam at the hot desk | `sharedLogins` is empty after the first and `["sam"]` after the second |
| H5 Reload | After H1 and H4 | The hot desk shows the sign-in screen, the levels are kept, the evidence note is still in the notebook | `guestSessions` empty; `sharedLogins` kept |
| L1 The lockout chain | `lock_room`: Jake Brooks; `jake_pc` under `strict`, `lockChance: 1`; a `borrow_session` to `hot_desk_2` at 50 | While Jake is at the coffee station the player types three wrong passwords on his tile. When he returns to his locked screen his next use fails with `locked_out`, he hot-desks, and his session there is claimed. A second owner in the room whose screen never locks is locked out the same way and carries on working | `loginLockouts` holds Jake at `jake_pc`; `guestSessions.hot_desk_2` is `jake` |

`temp_user` is a plain account holder with no NPC behaviour (an NPC record in a closed side room
with `creds` and no needs), so H2 needs nothing from another run.

Expected validator output: the "work never succeeds" warning for Kai, and nothing else. Scripted
runs, each with its own new game: U1 to U3; W1 to W4 with a reload after W4 (the level is kept,
the claim ends, the outage global is as it was left); W5 to W7; X1 to X4; H1 to H3; H4 and H5;
L1. Request budgets: no beat may send more than one report request every two seconds, and W5's
count must be flat after `settled`.

### 11.2 `scenarios/test_access_social` (sub-slice C)

Shared set-up. `social.osint` has one `social` site, `friendface`, with a profile and one authored
post each for Jake, Lena and Omar. `social.intelFacts` holds one ordinary fact (on an authored
post) and the feed facts below. A "Friendface terminal" (`osint-workstation`, `siteIds:
["friendface"]`) stands in the lobby. Policies: `no_social` (`social: "blocked"`) and `lax`. Every
`social_media` need is fast (`decayPerMin: 60`, `urgentAt: 40`, `initial: 50`: first urgent after
about 10 seconds, then about once a minute).

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| F1 Posts and their facts are withheld | Lobby, before entering any room | Each profile shows its one authored post and nothing else | `feedRevealed` empty; the leak check reports that it checked every feed post and feed fact and found none in any response |
| F2 The phone at the desk | `jake_room`: Jake Brooks, `jake_pc` under `no_social`, a phone, a feed of three posts | Jake uses his phone where he sits and never gets up; a click on his PC says he is using it; `npc_used_phone:jake` fires. With the terminal opened once before, a toast says he posted. The terminal now shows his first feed post above the authored one, and clicking it notes `jake_pet_name` with its text | `feedRevealed.jake.n` is 1 |
| F3 The PC, where it is allowed | `lena_room`: Lena Fox, `lena_pc` under `lax` | She uses her PC for it (`npc_used:lena_pc` with need `social_media`, `met: true`); her first post appears | `feedRevealed.lena.n` is 1 |
| F4 Blocked and no phone | `omar_room`: Omar Haddad, `"phone": false`, `omar_pc` under `no_social`, a `borrow_session` to the lobby `kiosk` (under `lax`, satisfies `social_media`) at 50 | His attempt fails with `social_blocked` and "Blocked. Of course."; at his second failure (default `perFail` 25) he says "I'll use the spare PC." and walks to the kiosk, uses it (met; his first post appears) and walks back. A click on the kiosk opens his desktop | `npcFrustration.omar`; `guestSessions.kiosk` is `omar`; `feedRevealed.omar.n` is 1 |
| F5 The chain | Lobby: a poster ("IT reminder: your pet's name and a year is not a password") and `hot_desk`, a sign-in PC that admits Jake. Jake's second post gives the year | With both of Jake's facts noted, the password built from them signs in as Jake at the hot desk, and his desktop holds the beat's final note | `sessions.hot_desk` Jake by password |
| F6 The feed runs out | Waited in real time, about three minutes | Jake posts his third post; the answer says the feed is done and no further `/feed_post` is sent for him | `feedRevealed.jake.n` stays 3; the request count for Jake is flat |
| F7 Reload | After F2 to F4 | The terminal shows every revealed post at once, and a revealed fact that was noted before the reload still reads correctly on the intel board; unrevealed posts and facts are still in no response | Unchanged |
| F8 A distracted guard | `gate_room`: a guard with `los.challengeOnSight`, a `social_media` need and a phone | While he is on his phone, walking through his view fires no `player_in_view_near:guard`; once he puts it away it does | None |

The password in F5 is deduced from two posts and a poster, each read in the game first; the
earned-secrets table records the three sources, and the validator's clue check (section 10) must
find them. Scripted runs: F1 to F4 and F7; then F5, F6 and F8.

## 12. Build steps

Each step lists its files and its tests, and is done when its tests, the node and Rails suites and
the no-exposure test pass. The scripted runs are made at the last step of each sub-slice, with the
whole suite built so far (11, point 3). Steps inside a sub-slice run in the streams of section 13.
Each sub-slice ends with a documents step that updates the author and tester documents for what
it built, in the slice's own sections: `README_scenario_design.md` (a section "Work, frustration
and workarounds", with "USB policy" and "Social media feeds" beneath it), `docs/achitechture/NPC_NEEDS_SYSTEM.md`
(the judged use, the retry wait, errands, the outage kick, mutters, the `self` job) and
`docs/test-bridge.md` (the `access` functions and the new `getState` fields).

### Sub-slice U: the USB policy

**U-1. Policy module, needs refusal and the mutter.**
Files: `systems/pc-policy.js` (new, with `window.pcPolicy`); `systems/npc-needs.js`
(`_completeJob`: refusal, the move to another target, the put-down and the memory; the mutter state,
`mutter(npcId, topic)` and the `usb_refused` pool; `usbClass`, and `usbPolicy` through
`window.pcPolicy`, in `describe`); `systems/npc-world-bubbles.js` if a line with no partner needs
it (after engine E2's commit, section 13).
Tests: `pc-policy.test.mjs` (new): the table in section 7; `effectivePolicy` with a PC's own
policy, the default and neither; `usbGoverned` true for a workstation and for an object naming a
policy, false for a tray under a blocking default; `plantRefusal` uses the first held item the
policy accepts, refuses only when every matching item is refused, and gives the right line for
`storage_blocked` and `blocked`. `npc-needs-usb-policy.test.mjs` (new): storage
refused at a managed PC with no `npc_used`; then delivered to a permitted one; with none, put down
and not picked up again; a `hid` item accepted under `storage_blocked` and refused under
`blocked`; an item with no `usbClass` never refused; a tray under a blocking default accepts; the
mutter shows for its time, is seeded and does not disturb a pair chat. Existing needs tests pass
unchanged.

**U-2. The player's plant, schema and validator.**
Files: `systems/interactions.js` (the `requiresItem` branch, a thin call to `plantRefusal`, after
U-1's module exists and after engine E3's edits to the file, section 13);
`scripts/scenario-schema.json` (`usbClass`, `storage_blocked`); `scripts/validate_access_work.rb`
(new, with the USB checks) and its call and field names in `scripts/validate_scenario.rb`. Only if
the user has scheduled 9.3b before this slice: the check in `POST /network/implant` and its
validator warning (section 7).
Tests: the decision is tested in `pc-policy.test.mjs` (U-1), because `interactions.js` imports the
engine and cannot load in node (section 2); the branch itself is checked in the U2 scripted beat:
refused with the right line, no action, the item kept; a non-governed object under a blocking
default is not refused. `validator-access-work.test.mjs` (new): the USB fixtures.

**U-3. `test_access_work`, beats U1 to U3**: the scenario, `PLAYTEST.md`, static checks, the
scripted run, the needs regression captures.

**U-4. Documents**: the "USB policy" section of `README_scenario_design.md` (the three values, the
two lessons, a plant at a sign-in PC goes on a dock beside it).

### Sub-slice A: work, outages and frustration

**A-1. The resolver and the fields.**
Files: `lib/break_escape/access_work.rb` (new); the schema; the known-field lists.
Work: resolve the work list, the frustration settings, "can fail", use times and the post period.
Accept every remaining field in section 4 (B, H and C fields too, so later sub-slices add checks,
not names). `resources` and `roles` are added to the schema and the top-level list only where 9.3a
and 9.1 have not added them (in the expected order both have).
Tests: `test/unit/access_work_test.rb` (new): role order with `staff` last; `+`, `-` and bare
entries; an NPC with no role; frustration merged field by field; "can fail" for each cause and for
none; a use time from an affordance and from a preset.

**A-2. Withholding and the plan.**
Files: `game.rb` (`compile_npc_plan!`, with `routes` from 9.3's `NetworkModel` and `admitted` from
`resource_acl_admits?`; `WITHHELD_NPC_KEYS`; `filtered_scenario_for_bootstrap`;
`ACCESS_STATE_DEFAULTS`).
Tests (`test/models`): a room NPC's `work` holds the resolved list with `admitted` right for an
admitted resource, a refused one and one with no `access` (admitted); no `name` and no `network`
key anywhere in it; `routes` present only for a scenario with `networks`, `[[]]` for a resource on
the station's network or on none and `[]` for one on another network; `workNeeds`, `frustration`, `workarounds`, `feed`
and `role` are gone from room data and from the room data of a door unlock; an NPC added by
`update_room` is treated the same; `GET /scenario` has no `resources` or `roles`; the no-exposure
test with the new fixture, over the routes that exist at this step.

**A-3. The frustration route.**
Files: `config/routes.rb`; `games_controller.rb` (`npc_frustration`, the lock list, the `scenario`
action's `npcFrustration`; `metAt` in `track_npc_encounters`); `game.rb` (`report_npc_uses!`, the
level, `tell`, `settled`, cause and pace helpers).
Tests (`test/controllers`): an unknown NPC, an NPC not yet met and an NPC that cannot fail are each
refused; a fail whose cause does not hold on the server answers `stale` and writes nothing, and is
accepted once the server's copy of the global is true; a first fail sooner than 0.9 of the use
time after `metAt` answers `tooSoon`; a fail raises the level by the resolved `perFail` and stops
at 100; a second fail for the same need inside the floor answers `tooSoon`, and one for the NPC's
other need is counted; an ease is floored at the use time, stops at 0 and never returns `run`;
`tell` is 0, 1 and 2 at the right levels for an NPC with workarounds, with none, and with one whose
`at` is at or below `perFail` (straight from 0 to the workaround);
`settled` at 100; 21 reports in one request are refused; the level is in `GET /scenario`; a reset
clears it; a game whose `player_state` lacks the key answers as an empty one.

**A-4. Validator checks for A.**
Files: `scripts/validate_access_work.rb`.
Tests: the A errors, warnings and the work report line; a clean fixture.

**A-5. The needs core.**
Files: `systems/npc-work.js` (new: `useVerdict`, `reachable`); `systems/npc-needs.js`
(`_completeJob`: the verdict and the failed-use path; `_select`, `_anyUrgent`, `_pressing`,
`_blockedNeed`: the retry wait; `_tickNpc`: errands and the outage kick; `enqueueErrand` and
`npc_errand_dropped`; `_claims` skipping errands; the pools and their order; `mutter`;
`applyFrustration`; `restoreFrustration`, applied in `register`; `getState`; in
`createEngineWorld`: `useVerdict`, `reportUse`, `downIf` in `describe`).
Tests (`test/js`): `npc-work.test.mjs` (new): the verdict for each failure and several at once; a
need with no `routes` is reachable, `[]` is not, `[[]]` is, a route with no truthy global is.
`npc-needs-work.test.mjs` (new), on the stub world: a failed use restores nothing, drains the
other needs, waits `retryMin` before the same need is selected again, shows no pressing bubble for
it, emits `npc_used` with `met: false` and `npc_use_failed`, skips `revealOutput`, and reports
once; a met judged use with frustration reports an ease and a met coffee use does not, and a
coffee or carry use's `npc_used` payload has no `met`; the outage kick: a need at 90 drops to
`urgentAt` when its `downIf` global turns true, once per change, and the NPC fails within one use
time; a global already true at `register` kicks too; the pool is chosen from the `tell` held at the
failure (fed-up at 2, the cause's own pool below it, `work_fail_<kind>` falling back to
`work_fail`); a check
errand walks to the object once per outage, emits `npc_checked` and `npc_errand_done`, emits no
`npc_used`, claims nothing and leaves the post like any trip; an errand waits for a running job; a
late answer changes no decision; a level handed over before the NPC is registered is applied when
it registers. Every existing needs test passes unchanged (including the whole-payload assertion at
`test/js/npc-needs.test.mjs:130`), and the decision log of the `needs-sims-world` fixture is byte
for byte what it was.

**A-6. Client surfaces and tooling.**
Files: `systems/npc-reports.js` (new: the queue, one request every two seconds, `settled`, the
forced sync on a plan global's change, the `stale` resend, answers to `applyFrustration`);
`api-client.js` (`npcFrustration`); `core/game.js` (install the reporter; hand `npcFrustration` to
`restoreFrustration`); `systems/npc-action-icons.js` (the `blocked` icon by `tell` and its pulse;
`npc-work` during an errand); `systems/npc-needs-debug.js` (the `F` bar); the tooling in section 11.
Tests: `npc-reports.test.mjs` (new): reports are sent together, never more often than every two
seconds and never more than 20; no fail is sent for a settled NPC until an ease has been; a change
of a plan global forces one state sync before the next batch; a stale answer triggers one state
sync and one resend. `npc-action-icons` and `npc-needs-debug` tests: the
icon at each `tell`, the bar. The leak scanner's unit test, `playtest-verify-run-access.test.mjs`
and `test-bridge-access.test.mjs` gain the new keys.

**A-7. `test_access_work`, beats W1 to W7.** The scenario's new rooms, `PLAYTEST.md`, static
checks, the scripted runs, the watch-it-happen run, the needs regression captures, then U's run
and the first slice's three suite runs.

**A-8. Documents**: "Work, frustration and workarounds" in `README_scenario_design.md` (resources,
work needs, outages and the kick, what the student sees, the timing report);
`docs/achitechture/NPC_NEEDS_SYSTEM.md` (the judged use, the retry wait, errands, the kick,
mutters); `docs/test-bridge.md` (`work`, `reports`, the new `getState` fields).

### Sub-slice B: workarounds, part one

**B-1. Server.**
Files: `game.rb` (choosing `run`, `complete_workaround!` for `writes_down`, `prop_door` and
`emit`, the server-side `setGlobal`, `written_down?` gaining the workaround); `games_controller.rb`
(`npc_workaround`, `serve_opened_room` with the door unlock calling it, the `scenario` action's
`pending` and `done`); `config/routes.rb`.
Tests: thresholds crossed one at a time and two at once; a lasting workaround handed over and not
spent is not handed over again, and after `dropped` it is; `run` never repeats one that is done;
"done" for a hand-over never made is refused; a second "done" for one hand-over is answered with
the same body and writes nothing; "done" before the dwell answers 425; `writes_down`: the answer holds no password,
`/login_accounts` for the owner's PC holds "<username> / <password>" only after "done", room data
holds `hasPostit` and never the text, an authored `postitNote` still wins; `prop_door`: the room
is in `unlockedRooms`, its NPCs are in `encounteredNPCs`, and a fail report for one of them is
then accepted; the declared `setGlobal` is true in `player_state.globalVariables`; `emit` is done
only after the confirmation and is `pending` in `GET /scenario` before it; the rest of the
no-exposure test.

**B-2. Validator and dungeon graph.** The B errors, warnings and report lines, and the graph
nodes. Tests: the fixtures; `dungeon-graph-workarounds.test.mjs`.

**B-3. The workaround runner.**
Files: `systems/npc-workarounds.js` (new: hears `npc_workaround_due` and `npc_errand_dropped`,
starts the errand or the event, has the NPC say its start line through `mutter`, emits
`npc_workaround`, calls "done" or "dropped" through `window.ApiClient.npcWorkaround` with `index`
and `hand`, retries a failed request, applies the answer: the note mark, the door, `setGlobal`;
sets every done `setGlobal` again on a load); `systems/npc-needs.js` (the `wk_` pools only).
Tests: `npc-workarounds.test.mjs` (new), with a stub API: each kind starts the right errand, says
its start line, emits `started` then `done`, and applies its answer; `npc_errand_dropped` is
reported as dropped; a failed "done" is resent and the same answer applied once; a 425 is retried
after the dwell; a pending workaround from a load is started once, when its NPC registers;
`setGlobal` from the `done` list is applied on a load; `emit` fires its event and then confirms.

**B-4. Surfaces, tooling and the scenario.**
Files: `api-client.js` (`npcWorkaround`); `core/game.js` (install the runner; hand it `pending` and
`done`); the leak scanner's workaround rules and `verify-run.rb`; `scenarios/test_access_work`
beats X1 to X4. If 9.1 is not built: `systems/postit-marks.js` and the `/login_accounts` note, as
6.1 says.
Then the scripted run, the watch-it-happen run and the whole suite.

**B-5. Documents**: the workarounds part of "Work, frustration and workarounds" (each kind, what
it opens, `tell` and "no warning", the dungeon graph's nodes); the runner's events in
`docs/achitechture/NPC_NEEDS_SYSTEM.md`.

### Sub-slice H: the hot desk and the shared login

**H-1. Server.**
Files: `game.rb` (`complete_workaround!` for `borrow_session` and `share_login`, the guest claim
beside `claim_login_session!`, `account_capture_passwords`, clearing `guestSessions`, `leavesOpen`
from `npc_habit`); `games_controller.rb` (`login` passing `claim: "guest"`). These edits come after
engine E4's edits to `capture_secrets_for_client`, `account_capture_passwords` and
`capture_route?` (section 13), and `sharedLogins` is read there as a proof that holds.
Tests: repeating workarounds in turn, a heard `share_login` staying in turn and `sharedLogins`
growing once; `borrow_session` done writes `guestSessions` and clears a held session at that PC;
each guest claim refusal (no guest, a session held, no account, not admitted, `autoLockMin: 0`, a
`locksScreen: always` guest where 9.1 is built); `share_login`: heard with a `room_id` that is the
colleague's room and unlocked answers the capture, the line and the note; heard with another room,
or with the colleague's room still locked, is taken as not heard; `player_state.currentRoom` is
not read; `/capture_secrets` serves it only after a heard "done", with E4's proof rule in force;
`guestSessions` empty after `GET /scenario`; the rest of the no-exposure test.

**H-2. Validator.** The H errors and warnings. Tests: the fixtures.

**H-3. Needs and runner.**
Files: `systems/npc-needs.js` (`setBorrow`, `s.borrow` as the first candidate in `_useCandidate`,
clearing the retry wait, the 60 second start limit, the `borrowed` flag, a failed borrowed use not
reported, `npc_sat_at`, `npc_borrowed_session` with `met`, `userOf(objectId)` skipping errands,
`cellBeside` in the adapter and errands to an NPC); `systems/npc-workarounds.js` (the borrow, the
share with its heard test and `room_id`, the toast, the evidence note and the capture).
Tests: `npc-needs-work.test.mjs`: a borrowed PC is chosen ahead of the home object for the failing
need only; the NPC gets up without waiting out the retry; a borrow that cannot start in 60 seconds
is dropped; a failed borrowed use still emits `npc_borrowed_session` and sends no report;
`leavesOpen: false` emits none; an errand to an NPC stands beside them and is not that PC's user.
`npc-workarounds.test.mjs`: `share_login` reports `heard` with the room of the first tick that
heard when the player was in earshot at any tick of the dwell; a heard answer shows the toast, adds
the note and records the capture; an unheard one does nothing.

**H-4. The workstation layer, sessions, tooling and the scenario.**
Files: `systems/workstation-state.js` (guest records, `userOf` in presence and `onInteract`, the
guest leave and its auto lock); `systems/pc-sessions.js` (`claim(pcId, { as: "guest" })`,
`displaced(pcId, name)`); `systems/unlock-system.js` (`interactLoginPc` chooses the claim kind,
after engine E1's and 9.1's edits to the file); `systems/test-bridge/access.js` (`guest`); the
leak scanner's share rule; beats H1 to H5.
Tests: `workstation-state.test.mjs`: a PC in use by a non-owner answers `attended`; a guest is
recorded when the "done" answer arrives; a guest leave publishes the globals, emits
`workstation_owner_left` with `reason: "guest"` and makes the next click `accessed`; `autoLockMin`
locks it and emits `workstation_auto_locked`; the next person to sit down ends it by displacement
and no `workstation_owner_returned` is emitted for a guest; an env without `userOf` keeps today's
answers. `pc-sessions.test.mjs`: a guest claim emits `pc_signed_in` with `via: "claim"` and ends on
the auto lock and on a reload; `npc_sat_at` at a PC with a password session, a claimed one, a guest
claim and a 9.3a remote one emits `pc_signed_out` with `reason: "displaced"`, closes the desktop
with "<name> has signed in at this PC" and sends one `/logout`; a remote session started while the
NPC sat there is displaced again on `npc_borrowed_session`. `screen-states.test.mjs` passes
unchanged.
Then the scripted runs, the watch-it-happen run and the whole suite.

**H-5. Documents**: the hot desk and the shared login in `README_scenario_design.md` (what each
opens, why a share is heard only in an opened room, the careful guest); `guest` in
`docs/test-bridge.md`.

### Sub-slice L: lockout as a cause

**L-1. Engine.**
Files: `lib/break_escape/access_work.rb` (the `maxAttempts` clause of "can fail"); `game.rb` (the
`check` report and its `lockedOut` record, `locked_out` in "a cause holds", the owner claim refused
while locked out); `systems/npc-work.js` (`locked_out` in the verdict); `systems/npc-reports.js`
(the `check` on `workstation_owner_returned` with `wasLocked` under a `maxAttempts` policy, only
for a PC with a lockout answer seen or a `lockedOut` entry from a load, and the flag it sets on the
needs state); `systems/npc-needs.js` (the first use's verdict held until the answer);
`systems/workstation-state.js` (a flagged owner's screen always locks on a leave); author docs
(`README_scenario_design.md`: the lesson and its limit, 6.6).
Tests: the `check` answers true only for the owner's username in `loginLockouts` at that PC, and
records only that; a fail with `locked_out` is accepted only then; the client sends no `check` for a
PC where it has seen no lockout answer, and none at all in a mission with no lockout; it sends one
on a locked return to a PC where it has; an owner whose screen stayed open is never flagged; the
first use after the return waits for the answer; the flag makes uses of that PC fail and uses of
another PC not; a flagged owner's screen locks on every leave and the owner claim is refused; the
flag is restored after a reload.

**L-2. Beat L1**, its scripted run, and the whole suite.

### Sub-slice C: social media

**C-1. Server.**
Files: `game.rb` (`reveal_feed_post!`, `feed_posts_for_client`, feed facts deleted from the
bootstrap's `social.intelFacts`, `hasFeed` in `compile_npc_plan!`, "can fail" for `social_media`);
`lib/break_escape/access_work.rb` (the feed fact list); `games_controller.rb` (`feed_post`, the
`scenario` action); `config/routes.rb`.
Tests: posts come out in order, one per call, each with its fact entry; the pace floor; `done`
with the last post and after it; an NPC with no feed or no need gets nothing; `feed` is in no room
response; the bootstrap's `social.intelFacts` holds every ordinary fact and no feed fact;
`feedPosts` holds exactly the revealed posts and their facts; the no-exposure test's feed
assertions.

**C-2. Validator and clue sources.** The C errors and warnings, the `social_media` exemption in
`validate_npc_needs.rb`, the posting schedule line, and the two clue sources of section 10 in
9.1's `lib/break_escape/npc_habits/clues.rb` (9.3b's key warning reads the same list).
Tests: the fixtures; a `guessable` password whose parts are sourced only by a feed post's text and
a feed fact's text passes 9.1's check; the short-text warning for a feed fact of under 12
characters and for one inside another shipped string.

**C-3. The need in the needs core.**
Files: `systems/npc-needs.js` (the candidate order of 8.1; the `self` job in `_startJob`,
`_advanceJob`, `_completeJob`, `_tickNpc`'s freeze and block paths and `getState`; `distracted`);
`systems/npc-work.js` (the `social_media` verdict); `systems/npc-sight-challenge.js`.
Tests: `npc-needs-social-media.test.mjs` (new): each candidate in its order; a phone use at the
post emits no `npc_left_post` and keeps `atPost`; one on the walk home resumes the walk; a blocked
PC with no phone fails and raises frustration; a blocked PC with a phone never fails; a
conversation freezes a phone use and a knock-out aborts it; `npc_used_phone` and no `npc_used`; no
sight challenge while distracted. The existing needs tests pass unchanged (the cooler's `social`
need is untouched).

**C-4. The feed and the browser.**
Files: `systems/social-feed.js` (new); `api-client.js` (`feedPost`); `core/game.js` (hand
`feedPosts` over on load, before the browser can open; install the feed listener on `npc_used`
and `npc_used_phone`); `minigames/osint-browser/osint-browser-minigame.js` (`_socialView`);
`systems/npc-action-icons.js` (`social_media` shown with `npc-social`).
Tests: `social-feed.test.mjs` (new): a met use asks once, a failed one does not; nothing is asked
after `done`; the fact entry is in `social.intelFacts` before `npc_posted` fires; the toast only
for a site already visited, and not with `postToasts: false`; restore on load; an open profile
re-renders on `npc_posted`.
`social-osint-browser.test.mjs`: revealed posts are listed first, newest at the top; clicking one
grants its fact once, with its text in the evidence note; an unrevealed feed fact cannot be
granted; a profile with no revealed posts renders as today.

**C-5. Tooling and `test_access_social`.** The leak scanner's feed rules, with unit tests in which
a feed fact's text planted in a bootstrap fixture is reported, an object keyed by a feed fact id
with a `text` key is reported, and a correct bootstrap whose room ids and NPC names share words
with a fact's labels is not (the scanner must be able both to fail and to pass); `feed()` on the
test bridge; the scenario, its `PLAYTEST.md`, static checks, the two scripted runs, the
watch-it-happen run, the needs regression captures and the whole suite.

**C-6. Documents**: "Social media feeds" in `README_scenario_design.md` (the need, the phone, the
`social` policy, feed facts withheld with their posts, the short-text warning, the distracted
guard); the `self` job in `docs/achitechture/NPC_NEEDS_SYSTEM.md`; `feed()` in
`docs/test-bridge.md`.

## 13. Parallel streams

Inside each sub-slice the work splits into streams that own different files. The names that cross
between streams (route names and answers, adapter methods, `window.ApiClient` method names,
events, `getState` fields) are fixed by this plan, and node tests stub the other side, so streams
marked "at once" can start together. Each stream re-reads a shared file just before editing it,
commits with explicit paths, and never commits another's files.

| Sub-slice | Stream | Steps | Files it owns | Starts |
|---|---|---|---|---|
| U | Needs core | U-1 | `systems/pc-policy.js`, `systems/npc-needs.js`, `systems/npc-world-bubbles.js`, their tests | At once |
| U | Surfaces and authoring | U-2 | `systems/interactions.js`, the schema, `scripts/validate_access_work.rb`, `scripts/validate_scenario.rb`, their tests | The schema and validator at once; the plant when `pc-policy.js` is committed and engine E3 has committed `interactions.js` |
| U | Scenario and documents | U-3, U-4 | `scenarios/test_access_work/`, this slice's section of `README_scenario_design.md` | After both |
| A | Server | A-1 (resolver), A-2, A-3 | `lib/break_escape/access_work.rb`, `game.rb`, `games_controller.rb`, `config/routes.rb`, `test/models`, `test/controllers`, `test/unit/access_work_test.rb` | At once |
| A | Validator | A-1 (schema, field lists), A-4 | `scripts/validate_scenario.rb`, `scripts/validate_access_work.rb`, the schema, `test/js/validator-access-work.test.mjs` | The schema at once; the checks when the resolver is committed |
| A | Needs core | A-5 | `systems/npc-work.js`, `systems/npc-needs.js`, their tests | At once |
| A | Surfaces and tooling | A-6 | `systems/npc-reports.js`, `api-client.js`, `core/game.js`, `systems/npc-action-icons.js`, `systems/npc-needs-debug.js`, `systems/test-bridge/access.js`, `tools/playtest/`, `docs/test-bridge.md` | At once |
| A | Scenario and documents | A-7, A-8 | `scenarios/test_access_work/`, this slice's section of `README_scenario_design.md`, `docs/achitechture/NPC_NEEDS_SYSTEM.md` | After the four above |
| B | Server | B-1 | as A's | At once |
| B | Validator and graph | B-2 | `scripts/validate_access_work.rb`, `scripts/generate_dungeon_graph.rb`, their tests | At once |
| B | Runner | B-3 | `systems/npc-workarounds.js`, its test | At once |
| B | Surfaces, tooling, scenario and documents | B-4, B-5 | `api-client.js`, `core/game.js`, `tools/playtest/`, `scenarios/test_access_work/`, the documents (and `postit-marks.js` if 9.1 is not built) | The two client files and the tooling at once; the scenario after the others |
| H | Server | H-1 | as A's | At once |
| H | Validator | H-2 | `scripts/validate_access_work.rb` | At once |
| H | Needs and runner | H-3 | `systems/npc-needs.js`, `systems/npc-workarounds.js`, their tests | At once |
| H | Workstation, sessions, tooling, scenario and documents | H-4, H-5 | `systems/workstation-state.js`, `systems/pc-sessions.js`, `systems/unlock-system.js`, `systems/test-bridge/access.js`, `tools/playtest/`, `scenarios/test_access_work/`, the documents | The three client files and tooling at once; the scenario after the others |
| L | One builder | L-1, L-2 | `lib/break_escape/access_work.rb`, `game.rb`, `systems/npc-work.js`, `systems/npc-reports.js`, `systems/npc-needs.js`, `systems/workstation-state.js`, `README_scenario_design.md`, the scenario | After H's runs pass, and only on the user's yes (decision 14) |
| C | Server | C-1 | as A's | At once |
| C | Validator | C-2 | `scripts/validate_access_work.rb`, `scripts/validate_npc_needs.rb`, the schema, `lib/break_escape/npc_habits/clues.rb` (two lines) | At once |
| C | Needs core | C-3 | `systems/npc-needs.js`, `systems/npc-work.js`, `systems/npc-sight-challenge.js` | At once |
| C | Feed and browser | C-4 | `systems/social-feed.js`, `api-client.js`, `core/game.js`, `osint-browser-minigame.js`, `systems/npc-action-icons.js` | At once |
| C | Tooling, scenario and documents | C-5, C-6 | `tools/playtest/`, `systems/test-bridge/access.js`, `scenarios/test_access_social/`, the documents | The tooling at once; the scenario after the others |

Each stream is one builder with review rounds after it (`AGENTS.md`: at least two, at most five).
Scripted runs are split from building: the scenario's builder writes the scenario and
`PLAYTEST.md`, and a separate tester runs it.

**Against the sibling plans.** The build order is 9.3a, then 9.1, then this slice, one slice at a
time on the shared files. The engine plan's streams (E1 to E5, its section 10) are a separate
build that may run at any time; on every file they share with this slice, **the engine streams
come first**, and its inventory stream E3 is the first holder of `systems/inventory.js` and
`systems/interactions.js`. A builder re-reads the file just before editing, edits only its own
block, never reformats, and commits with explicit paths. The files this slice shares, with the
order on each:

| File | Also edited by | Order |
|---|---|---|
| `app/models/break_escape/game.rb` | 9.3a S; 9.1 F and A; engine E3 (`add_item_to_room!`), E4 (`capture_secrets_for_client`, `account_capture_passwords`, `capture_route?`, a line in `add_item_to_room!` and in `attempt_login!`), E2b (`generate_scenario_data`, held) | 9.3a, then 9.1, then this slice; E3 and E4 before this slice. On the three capture methods, **E4 before H-1**: H-1 adds `sharedLogins` as a proof that holds in E4's rule. Different methods otherwise |
| `app/controllers/break_escape/games_controller.rb`, `config/routes.rb` | 9.3a S; 9.1 A (`login_accounts`); engine E3 (`CLIENT_ITEM_FORBIDDEN_FIELDS`, `item_add_params`) | 9.3a, then E3, then 9.1, then this slice |
| `scripts/validate_scenario.rb`, `scripts/scenario-schema.json` | 9.3a T; engine E1, E3, E4; 9.1 F and B | 9.3a T, then E1, E3, E4 one at a time, then 9.1, then this slice; each adds its own block |
| `scripts/generate_dungeon_graph.rb` | 9.3a T; 9.1 B and D | 9.3a, then 9.1, then this slice |
| `systems/npc-world-bubbles.js` | Engine E2 (a rising icon helper) | **E2 before U-1**; U-1 edits the line-with-no-partner path only, if it needs one |
| `systems/interactions.js` | Engine E3 (the first two branches for a held item, `examineHeldItem`, `inventoryMenuFor`); 9.3a C1 (the jack branch) | **E3 first** (it is the file's first holder), then 9.3a C1, then U-2, whose edit is the `requiresItem` branch, a later branch than both |
| `systems/inventory.js` | Engine E3; 9.3a C1 or C2 | Not edited by this slice |
| `systems/unlock-system.js` | Engine E1 (the RFID branch and refusal lines); 9.3a C2 (remote sign-in); 9.1 A (the desk branch of `openLoginSignIn`) | E1, then 9.3a, then 9.1, then H-4 (`interactLoginPc`'s claim kind only) |
| `systems/pc-sessions.js`, `api-client.js` | 9.3a C1 and C2; 9.1 A | 9.3a, then 9.1, then this slice |
| `core/game.js` | Engine E2 (two preload lines); 9.3a C1; 9.1 A | E2, 9.3a and 9.1 first; one or two lines each |
| `systems/apply-actions.js` | Engine E3 (`set_costume`, `clear_costume`); 9.3b (its implant case) | Not edited by this slice: outage switches are two objects (11.1), not a new action |
| `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`, `tools/playtest/access-leak-check.rb` | 9.3a T; engine E4 (the scanner, and the device DOM in `access-leak-check.rb`); 9.1 E | 9.3a T, then E4, then 9.1 E, then this slice; own checks only |
| `systems/test-bridge/access.js`, `docs/test-bridge.md`, the playtest harness | 9.3a T (`access.js`); engine E3 (inventory commands, `docs/test-bridge.md`, the harness) | 9.3a and E3 first; this slice adds its own functions to `access.js` and its own paragraph |
| `README_scenario_design.md` | 9.3a T; engine E1, E3, E4, E5; 9.1 D and Docs | Each owns its own section; this slice adds "Work, frustration and workarounds" |
| The no-password test, `access_model_withholding_test.rb` | 9.1 | 9.1, then this slice |

`systems/npc-needs.js`, `systems/workstation-state.js`, `systems/npc-work.js`, `pc-policy.js` and
the osint browser are edited by this slice only. If any two builds run at the same time, no two
builders hold one of the files in the table at once. The engine plan's own shared-files table
does not yet list this slice; the orchestrator adds it there with the order above.

## 14. Effects on existing scenarios

No existing scenario declares `resources`, `roles`, `workNeeds`, `workarounds`, `feed`, `usbClass`,
a workstation `downIf` or a `social_media` need, so none changes its behaviour. What each change
touches:

| Change | Who sees it |
|---|---|
| `npc_used` gains `met` (and `missing` on a failure) | Only judged uses: an NPC with a `work` plan or a `social_media` need. No existing scenario has one, so every existing `npc_used` payload is unchanged |
| The outage kick | Only an NPC with a `work` plan: none today |
| The use verdict, the retry wait, the drain, errands | Only an NPC with a `work` plan or a PC with `downIf`: none today |
| Mutters and the new pools | Never chosen without a failed or refused use. A scenario with `"chatter": false` gets no mutters and still gets the icon |
| `usb` policy | `test_access_signin` and `test_access_sessions` set `usb: "allowed"`; `lab_physical_pentest` has no policies and its devices have no `usbClass`, so Sofia's finds and the keylogger plant are untouched |
| `social` policy | The same two test scenarios set `"allowed"`; nobody has the need |
| `social_media` need | `test_needs_sims` uses a need called `social` at the cooler; it is a different name and is untouched |
| The browser lists feed posts first; feed facts leave the bootstrap | Every scenario with a `social` site (`lab_social_engineering`, the `ca` episodes, two test scenarios): no feed, so the list and `social.intelFacts` are as today |
| Room NPCs lose `workNeeds`, `frustration`, `feed` and gain `work`; the bootstrap loses `resources` and `roles` | Nobody authors them yet (9.3 and 9.1 scenarios aside, which never read them in the browser) |
| A workstation used by a non-owner reads as in use, and an NPC signing in at a PC ends the player's session there | From sub-slice H, and only where an NPC's use job targets a sign-in PC it does not own. With `private` PCs (`test_needs_sims`) that never happens; in `test_npc_needs` and the lab each PC has one user. The needs regression captures confirm it |
| The door unlock's tail becomes `serve_opened_room` | Every door unlock: the same steps in the same order |
| Four new `player_state` keys | New games get empty ones; older saved games are read as empty |
| `track_npc_encounters` writes `metAt` | Only for an NPC with a `work` plan or a feed: none today |
| An owner claim is refused while the owner is locked out at that PC (sub-slice L) | Every scenario with `maxAttempts` and owned sign-in PCs (`test_access_signin`, `test_access_sessions`): a claim of a locked-out owner's session is refused where today it succeeds. The first slice's scripted runs are repeated at L-2 |
| `validate_npc_needs.rb` no longer errors on a `social_media` need with no satisfying object | No scenario has one |

`lab_physical_pentest` is not edited by this slice. Slices 9.1 and 9.3 each plan an edit to it, so
it already has two editors queued, and giving its PCs a USB policy would change a lesson it has
been playtested on.

## 15. Interfaces with other slices

**What this plan changes in the sketch of section 9** (first slice plan):

| Sketch | This plan |
|---|---|
| A `social` need | The need is `social_media`; `social` stays the cooler's |
| `feed` as a list on the NPC, each post with `intel`, shown in a `social_feed` object or phone app | `feed: { site, person, posts: [] }`; a post's fact key is `fact`, as in the browser; posts and their facts are served together and appear in the existing browser |
| "distinct from `social.landingPages[].profiles[].posts`" | The path is `social.osint.sites[].profiles[].posts` |
| `usb: "blocked"` makes `accepts` ignore USB-tagged items | Items carry `usbClass`; the policy has three values and governs workstations and objects that name a policy; a refused NPC tries the next machine |
| `borrow_session` picks another PC | It names one, an unowned sign-in PC, and leaves a guest session there |
| `writes_down` turns on `writesDown` | It makes 9.1's `written_down?` true for that person; the note is served as 9.1 serves it |
| `prop_door` until a global or timer closes it | Open for the mission; needs a `prop` object |
| `share_login` reveals an intel fact | The player hears the login, with a toast, an evidence note and a capture |
| Frustration and workarounds in the needs system | The level and the list live on the server; the needs system reports uses |
| "the PC's network reaches the resource's network; always true until networks exist" | The server composes `routes` into each NPC's plan; with no `routes` a resource is reachable |

**With 9.1 (awareness and habits).** Each point has one answer, and 9.1's section 14.2 says the
same.

| Topic | Settled as |
|---|---|
| The sticky note | 9.1's channel and helpers, exactly: `written_down?(npc)` decides; `login_postit_for(pc)` is the only source of the text, "<username> / <password>"; `GET /login_accounts` carries it, `no-store`; room data carries `hasPostit` only; an authored `postitNote` or `showPostit: false` wins; the picture is `postit-marks.js` with `mark(pcId, on)`. This slice adds one clause to `written_down?` and answers `{ pcId, hasPostit: true }` from its workaround route. It writes nothing into room data and adds no habit overlay |
| Who builds the note | 9.1, in the expected order. If this slice is first, sub-slice B builds the same pieces from 9.1's section 5.3 and 9.1 adds the habit clause |
| `roles` | Shared. 9.1 builds and reads `roles.<role>.awareness`, and deletes the whole top-level `roles` key from the bootstrap. This slice owns `workNeeds`, `frustration` and `workarounds` under the same key; its own deletion of `roles` is then already done, and it keeps the line only for the case where it lands first. Whichever lands first adds `roles` to the schema (with `additionalProperties` open) and the validator's top-level list; in the expected order that is 9.1. Both walk roles in `identity_roles(npc)` order, authored roles first and `staff` last. `roles.<role>.habits` does not exist |
| The awareness warning on a post | It reads `NpcHabits.level_of(npc, scenario)` where 9.1 is built, so a level from a role counts; the authored string otherwise |
| A guest and `locksScreen` | The server decides: `leavesOpen: false` in the `borrow_session` hand-over when `npc_habit(npc, "locksScreen")` is `always`, and the guest claim refuses on the same test; `sometimes` counts as leaving open, with no roll at a borrowed PC. The boolean is in the hand-over, not in the standing plan. No habit reaches the browser. 9.1's fill of `lockChance` applies to owned PCs and never to a borrowed one, and this slice changes no habit mid-game |
| What `borrow_session` is | A guest session at an unowned sign-in PC. It never changes how an owner leaves their own PC, so it needs no per-leave override and no change to `pc_always_locks?` |
| Feed posts as password clues | The shape is `feed.posts[].text`. This slice adds feed post texts and feed fact texts to `NpcHabits::Clues.readable_texts` in step C-2 |
| Build order | 9.3a, then 9.1, then this slice; 9.1 states the same |
| A remote sign-in and the note | 9.3a's remote screen never calls `/login_accounts`, so a note written by a `writes_down` workaround is never shown remotely; the password it gives signs in remotely as it does at the desk |
| Withheld keys | `WITHHELD_NPC_KEYS` already holds 9.1's `awareness` and `habits`; this slice adds its three |
| `holdsDoors` and `prop_door` | Independent: one is a gate door behaviour, the other unlocks a room |

**With 9.3a (networks, build-ready).** This slice is built after 9.3a and uses only what 9.3a
builds.

| Topic | Settled as |
|---|---|
| Reach | Taken from the server, as 9.3 asks (its 13.2). `compile_npc_plan!` adds `routes` per need from `NetworkModel.reach_conditions(data, station_network, resource)`; the browser's `reachable(need, globals)` reads only that. With 9.3a the answer is `[[]]` or `[]` (its 4.2). No network id, link or resource `network` reaches the browser from this slice. In a scenario with no `networks` there are no `routes` and everything is reachable. The failure reason is `unreachable` |
| Admitted | `resource_acl_admits?(resource, npc)` (9.3's 4.5): a missing list admits everyone, as both plans read `access` |
| `resources` | Shared. 9.3 owns `network`, `host`, `contents`, `observations`; this slice owns `object`, the work lists and, for NPC work, `downIf`; both read `name`, `kind` and `access` the same way. Neither makes the other's fields required; both delete `resources` from the bootstrap. 9.3a adds the key to the schema and the validator's top-level list; this slice extends it |
| The `work` plan and 9.3a's secrecy rule | The plan ships ids, kinds and global names and **no display name** (5.1, decision 12), which is inside 9.3a's rule (its section 6). So 9.3a's no-exposure test and leak rule need no exception for an NPC's `work` block |
| "A resource no NPC needs" | Not reported when the resource has `contents` or a `host` |
| Sessions at a hot desk | A guest session is an ordinary session at a PC, claimed at the screen, so its desktop carries 9.3a's mapped shares with no extra work. 9.3a refuses any claim that carries a foothold or targets a headless host, so this slice's `guest` claim needs no change there, and this slice's validator refuses a headless borrow PC |
| A session displaced | An NPC signing in at a PC ends any session the player holds there, a 9.3a remote session included, with `pc_signed_out` reason `displaced`; 9.3a's client treats it as any other end. Because 9.3a lets a remote sign-in start while someone sits there, the displacement runs again on `npc_borrowed_session` (6.4) |
| Lockout from the drop box | Remote and local attempts share one counter (9.3's 4.4), so a lockout caused from the drop box stops the owner's work under sub-slice L as one caused at the keyboard. A lockout answer from a remote `POST /login` counts as "seen" for the `check` rule (6.6) |
| A station that is down | 9.3a has no outages for the player and no "not responding" row. This slice changes nothing in 9.3's view or `desktop_request_allowed?` (this plan's section 9.1) |
| Server-set globals | A workaround's `setGlobal` is the one global the server sets itself; 9.3 allows for it (its 13.2) |
| Validator layout | Each slice keeps its checks in its own file (`validate_network.rb`, `validate_access_work.rb`) and touches `validate_scenario.rb` only for a `require`, a call and the known-field lists |
| `requiresReach` | Not used by either slice |
| Build order | 9.3a, then 9.1, then this slice |

**With 9.3b (links, outages, Wi-Fi, port security, implants: an ordered design, built later).**
Everything this slice and 9.3b share is built by 9.3b, so nothing here waits for it:

| Topic | Built by 9.3b |
|---|---|
| Routes with globals in them | `reach_conditions` returns the `downIf` globals of every network on each route (its 12.1, 12.2); this slice's `reachable` already reads them, and its kick (5.6) and forced sync (5.4) already watch every route global. No change here |
| A station that is down, seen from the network | A sign-in host whose own `downIf` is truthy listed "not responding" in `network_view`, and `desktop_request_allowed?` refusing it. 9.3b owns outages for the player (its 12.2), so it adds both lines when it adds "no route" |
| The USB check on an implant | `POST /network/implant` refuses a device whose `usbClass` the PC's policy refuses (its 12.5), through a Ruby `usb_refused?` beside `effective_policy` (`game.rb:1373`) that reads this slice's table; with a validator warning for a `grant_foothold` whose PC refuses its device. The refusal is at the use, never at the drop. If the user schedules 9.3b before this slice, U-2 adds it |
| Feed posts as a place a Wi-Fi key can be learned | 9.3b's "the key appears nowhere" warning reads `Clues.readable_texts`, to which this slice adds feed texts (C-2) |
| Outages | `downIf` means the same in both: the global truthy, by JavaScript's rule, means down. This slice owns what an outage does to NPCs; 9.3b what it does to the player's reach |

**With the engine plan (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`).**

| Topic | Settled as |
|---|---|
| Shared files | Section 13: the engine streams come first on every shared file; E3 is the first holder of `inventory.js` and `interactions.js`; E2 before U-1 on the bubble renderer; E4 before H-1 on the three capture methods |
| A heard login is a capture | `share_login` records its capture through `window.recordSECapture`, so it lands in `se_captures` and is a row in the capture log's Credentials section (its section 6) with no further work, beside the evidence note |
| `sharedLogins` and the proof rule | E4 serves an account's captured password only when the capture route's `proof` holds (its section 6). An account holder in `sharedLogins` is a route whose proof holds: the server's own record of a heard "done". It is as strong as that client claim (6.5), the same strength as E4's `planted` and `dropped` proofs (the server's record, not sight of the act). H-1 adds this as one case in E4's check, after E4 |
| Server-made items | This slice makes no inventory item. The note mark, the guest session and the feed are not items, so E4's holder rules are untouched |
| `apply-actions.js` | Not edited by this slice (11.1); E3 and 9.3b hold it |

**For the siblings' own text.** Settled above; the wording in the sibling plans needs bringing into
line, and none of it blocks this plan:

1. 9.3's 13.2, row "A station that is down", has this slice adding two lines to `network_view` and
   `desktop_request_allowed?` in A-3. Those lines need 9.3b's outages and belong with 9.3b (above).
2. 9.3's 13.2, row "Resource names and `downIf` global names", and its decision 11 say this slice
   ships resource names and that 9.3's no-exposure test leaves an NPC's `work` block out. This
   slice ships no display name, so no exception is needed.
3. 9.3's 14 lists this slice as an editor of `systems/inventory.js`. It is not.
4. The engine plan's shared-files table does not list this slice (section 13 gives the rows).

Settled and already matching: 9.1 gives the build order as 9.3a, 9.1, 9.2, and names the guest
boolean `leavesOpen`, sent in the hand-over (its 14.2); 9.3 writes the feed as
`feed.posts[].text`, puts the USB refusal at the use, not the drop (its 12.5), and names
`displaced` as a way a remote session ends (its 13.2).

## 16. Decisions

**Decided** (orchestrator, under the user's latitude; the user can overrule any):

| # | Decision | Taken |
|---|---|---|
| 1 | Where a written-down password is served | Slice 9.1's channel: `hasPostit` in room data, the text only from `GET /login_accounts`, `written_down?(npc)` deciding, the workaround answering `{ pcId, hasPostit: true }` |
| 2 | Feed secrecy | A feed post and the fact it carries are withheld together until the post is served; the leak scanner checks both and is tested to fail |
| 3 | Reach | Composed on the server from 9.3; no topology and no resource `network` in the browser; "reachable" when the scenario has no `networks` |
| 4 | The cut | USB policy first, on its own; then work, outages and frustration; then workarounds in two parts (note, door and event; then hot desk and shared login); then lockout as a cause; social media last |
| 5 | A tampered browser | The residual in 9.3 is accepted, as it is for the engine's other client-reported hand-overs, and reduced by server-time pace floors, request ceilings, spent-once hand-overs, the server's own check of each cause, and the opened-room bound on a heard login |
| 6 | Visible frustration, and a shared login that explains itself | Required, from existing art: the `blocked` icon by `tell`, the mutter pools by cause and kind with the fed-up tier, a start line for each workaround, the "Overheard" toast and evidence note |
| 7 | `roles` | 9.1 builds `roles.<role>.awareness`; this slice owns `workNeeds`, `frustration` and `workarounds` |
| 12 | What room data says about resources | An NPC's `work` plan carries resource ids, `kind` and global names, never display names. Nothing in the browser needs a name, and it keeps the plan inside 9.3a's secrecy rule with no exception |
| 13 | The USB policy's values | Three values with `usbClass` (`storage`, `hid`), and a refused NPC takes the stick to the next machine. One extra field, and two real lessons: storage blocking does not stop a keyboard-type device, and a refused stick travels to the machine nobody manages |
| 15 | Art | Existing art only for the build (`npc-blocked`, `npc-social`, `npc-work`, `notes_postit1`, `fire_extinguisher1`, no phone pose). New 16 px icons or a phone-in-hand pose cost money and are proposed to the user one at a time once the behaviour is approved |
| 16 | A member of staff on their phone is distracted | `los.challengeOnSight` does not fire while on the phone (beat F8). Opt-in per guard, last step of C, and the validator says the guard can be walked past every period of the need |
| 17 | First real use | No existing scenario changes in this slice. The lab's lesson is physical and it already has edits queued from the content plan, 9.3a and 9.1 |
| 18 | When an outage is caused | The NPC's `work` need drops to urgent at once (the outage kick, 5.6), so the student sees cause and effect within one use, not up to a need's whole period later |
| 19 | Where 9.3b's contacts with this slice are built | In 9.3b: routes with globals, a station "not responding" in the network view, and the USB check on an implant (section 15). This slice builds nothing that needs 9.3b |

**Planner decisions** (the user can overrule any):

| # | Decision | Taken, and why |
|---|---|---|
| 8 | An NPC sitting down at a hot desk where the player holds a session | The NPC's sign-in ends the player's session, with "<name> has signed in at this PC". It is what a shared PC does, the message explains it, and it keeps the session the NPC then leaves behind reachable. Leaving the player's session in place would hide the opening behind the player's own old desktop |
| 9 | Where frustration and workarounds live | On the server, handed over when due. It keeps "what will this person do under pressure" out of the browser until it happens, and the level survives a reload. The cost is a batched report request, at most one every two seconds while something is failing, and none once an NPC is settled |
| 10 | The need's name | `social_media`. No existing scenario or stored needs capture changes |
| 11 | A propped door | Stays open for the mission. Doors cannot close today; closable ordinary doors are a door engine change of its own |

**For the user.** One question. The plan is written as if the recommendation is taken, and the
sub-slice it governs is last but one in the build order, so it holds nothing up: U, A, B, H and C
do not depend on it.

| # | Question | Options | Recommendation |
|---|---|---|---|
| 14 | Lockout as a cause (sub-slice L) | Build it; or leave it out | **Build it.** It is the one chain started from a sign-in screen, the one cause the server verifies, and it teaches that a lockout policy is a denial of service anyone at the keyboard can cause. It needs the user's explicit yes because it tells the browser something about an account: when the owner returns to a locked screen at a PC where the player has caused a lockout, the player learns whether the username they locked out was the owner's. A modified browser can ask that at any time after the lockout, not only at the owner's return (9.3). The sign-in screen itself never says which usernames are real, no list of locked-out accounts is sent, and a browser that has caused no lockout never asks |

## 17. Declined

Suggestions considered and not taken, with the reason.

- **A switch on the test server that turns the pace floors off**, so beats could step the needs
  clock. Not taken: a switch that removes a server check is one to leave on by mistake, and the
  paced beats are sized to take one to four minutes in real time (section 11).
- **A validator warning when a workaround is the only route to a lock guarding a flag.** The
  validator does not compute routes or their order (first slice plan, step 4). It warns instead
  when what a workaround opens holds a flag station or a VM launcher, which needs no route.
- **Keying the note picture on a separate flag so authored notes gain no picture.** Not
  applicable: room data holds no generated note, and the picture follows 9.1's `hasPostit` and its
  own rule for authored notes.
- **A feed made of authored posts shown by a counter global, with no route.** Smaller, but every
  post and fact would be in the browser from the first request, which the withholding rule
  forbids.
- **`roles.<role>.habits`.** 9.1 does not take the key; a role sets a level and an exception is
  written on the person.
- **Repairing the state sync's room field inside this slice**, so the server could check where the
  player stood when a login was heard. It would switch on the "Cannot enter locked room" refusal
  for every mission, an engine change with its own risk; it is logged as a fault (section 2) and
  the heard check is bounded by opened rooms instead (6.5).
- **Resource display names in the `work` plan**, for mutters that name the share. Mutters come
  from pools chosen by `kind`, which names the kind of thing that broke without a display name; a
  name in a mutter would be a request to 9.3 to change its secrecy rule.
- **A single toggling switch for an outage**, through a new `toggle_global` action. Two switch
  objects do the same with today's actions and leave `apply-actions.js` to its other editors.
- **A longer first-fail floor**, tied to the need's decay from `initial`. The outage kick means an
  honest NPC can fail within one use of being met, so such a floor would refuse honest play; the
  floor is the use time, and "at once" is printed where it applies (9.3, section 10).

## 18. Left out, and why

- **Doors that close again** after being propped: needs gate behaviour on ordinary doors.
- **A helpdesk that clears a lockout** (also open from the first slice): a locked-out member of
  staff stays locked out at that PC for the mission, which is what makes them hot-desk.
- **A colleague signing in with a shared login**: `share_login` ends at what the player overhears.
  An NPC acting on another NPC's account needs NPC sign-ins as events, which belongs with logs.
- **Logs** of failed uses and workarounds for investigator missions: the events are all emitted
  (`npc_use_failed`, `npc_workaround`, `npc_sat_at`, `npc_borrowed_session`, `door_propped`,
  `usb_refused`, `npc_use_refused`, `npc_posted`), ready for a log type later.
- **The player as defender**, setting policy and watching frustration as a cost: the model supports
  it, the mission type is in the backlog.
- **Frustration that fades with time alone**: it falls only when work succeeds, so an outage the
  player leaves in place keeps its effect.
- **A phone-in-hand pose, and posts on the player's own phone**: see decision 15. Until a pose
  exists, the default toast on a post ("<name> posted on <site name>") is what makes a phone post
  visible, and it stays even once art comes.
- **Anything of 9.3b's** (routes with globals, a station "not responding" to the drop box, the
  implant check): built by 9.3b (section 15).
- **Reading the feed over someone's shoulder**, private messages and friend requests: the browser
  shows public posts only.
