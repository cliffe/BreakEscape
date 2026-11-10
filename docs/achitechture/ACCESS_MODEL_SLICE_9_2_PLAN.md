# Access model slice 9.2: work, frustration, workarounds, USB policy and social media

Status: **design for review, 2026-11-10.** Nothing here is built. This plan replaces the sketch in
section 9.2 of `ACCESS_MODEL_PLAN.md` (called "the first slice plan" below) and is checked against
the code as it stands on the access design branch. Where it differs from the
sketch, section 2 says why and section 15 lists the change for the other slices.

How to read it: section 3 gives the three sub-slices and their order. Sections 4 to 8 are the
design. Section 9 lists every server route with its checks, what the browser receives and what a
saved game holds. Section 10 is the validator, schema and dungeon graph. Sections 11 to 13 are the
tests, the build steps and the parallel streams. Section 16 lists the decisions for the user.

## 1. Why

The first slice gave NPCs identities and made a captured identity work wherever the scenario's
access lists admit it. What it lacks is a reason for staff to behave insecurely that the player can
**cause and watch**. This slice adds that reason:

- Staff have **work to do**, and their work depends on **resources** (a file share, email, a
  printer) and on their own PC working.
- When work fails, **frustration** rises. A frustrated member of staff takes **workarounds**: works
  at a hot desk and walks off signed in, sticks the password on the monitor, props a door open,
  tells a colleague their login out loud.
- Every workaround is a visible act in the room and every one **opens something** the first slice
  already knows how to use: a claimable session, a password for a sign-in PC, a room, a capture.
- **Policy** (USB blocked, social media blocked) is a technical control the player can watch
  working, and watch staff route round.
- A **social media** need makes staff post. Posts are revealed one at a time into the existing
  social media browser, where a post can carry a fact the player notes and uses.

Chaining is the point (first slice plan, section 2). The intended shape of a puzzle built on this
slice is: the player causes an outage or a lockout, a named person gets frustrated, their
workaround opens a session or a door, and what is behind it holds the next credential.

What it teaches: usable security. A control that stops people working gets worked round, and the
workaround is usually worse than what the control prevented. Blocking social media on PCs moves it
to personal phones. Blocking USB storage stops a dropped memory stick and does not stop a device
that pretends to be a keyboard. An account lockout protects a password and can be used against the
account's owner.

## 2. What the code does today

Facts this plan builds on, each checked on 2026-11-10.

| Fact | Where |
|---|---|
| The needs system is pure logic over a `world` adapter, with no static imports. Needs, levels, jobs and the decision log all live in the browser; the server never sees an NPC move or use anything | `public/break_escape/js/systems/npc-needs.js` (`NPCNeedsSystem`, `createEngineWorld` at `:1434`) |
| A use completes in `_completeJob` (`:1047`): it adds the object's `restores` to the need, emits `npc_used:<objectId>` and applies the NPC's `onUse` hook. There is no notion of a use that fails once the NPC has arrived | `npc-needs.js:1047-1092` |
| The selector takes each urgent need in turn and asks `_useCandidate` (`:815`) for a free, permitted, reachable object whose `affordance.satisfies` names the need, preferring the NPC's own `needsHome` object. Every job targets an object; an NPC cannot satisfy a need where it stands | `npc-needs.js:788-847` |
| A carry job delivers a tagged item to an object whose `affordance.accepts` lists the tag (`_carryCandidate`, `:849`). Nothing reads a policy | `npc-needs.js:849-864` |
| The need name `social` is already in use: the water cooler preset satisfies `["thirst", "social"]`, and `test_needs_sims` gives two NPCs a `social` need. It means talking to colleagues | `public/break_escape/js/data/office-presets.json`, `scenarios/test_needs_sims/scenario.json.erb:385, 517` |
| Policies exist with four fields. `autoLockMin` and `maxAttempts` are read (client `policyFor`, `workstation-state.js:370`; server `effective_policy`, `game.rb:1373`). `usb` and `social` are accepted by the schema (`scripts/scenario-schema.json:190-191`, each `allowed` or `blocked`) and read by nothing | as listed |
| `withhold_npc_secrets!` already deletes `creds`, `awareness`, `habits`, `role` and `workarounds` from every room NPC (`WITHHELD_NPC_KEYS`, `game.rb:3968`). `needs`, `interests`, `needsHome`, `usePayload` (minus its secret) and every other NPC field ship | `game.rb:3961-3988` |
| The bootstrap ships every top-level key as authored except `flags` and `accountProfiles`; rooms are cut to an allow list | `filtered_scenario_for_bootstrap`, `game.rb:824-898` |
| A sign-in PC is a workstation. An unowned one answers `signin` to every click; a claim needs an owner (`screenOwner` or `needsHome`), on the client (`onInteract`, `workstation-state.js:314-332`) and on the server (`claim_login_session!`, `game.rb:1446-1475`) | as listed |
| A password on a sticky note is the object's own `postitNote`, which the sign-in screen shows. Nothing fills it from `creds` yet (that is the `writesDown` habit of slice 9.1) | `unlock-system.js:311-312`, first slice plan 5.6 |
| `/capture_secrets` serves an account holder's password only when that NPC has a capture route: a `usePayload`, or an `eventMappings[].addCapture` | `capture_route?`, `game.rb:971-976` |
| An NPC can unlock a room on the server through `NPCGameBridge.unlockDoor(roomId, npcId)` (`npc-game-bridge.js:77`), allowed when the NPC has an `unlockDoor` mapping or an `unlockable` entry (`game.rb:2021-2025, 2308-2343`). `unlockDoor(doorSprite, roomData)` in `doors.js:703` opens the door, and an opened door never closes again | as listed |
| The social media browser is the `osint-browser` minigame. Its data is `social.osint.sites[]`; a site of `type: "social"` has `profiles[]`, each `{ person, name, showIf, posts, blocks }`. A post is a block: with an `id` it is a button, and clicking it grants the post's `fact` through `grantFact` (`se_intel_<id>`, an evidence note, the readiness check). The whole `social` block ships in the bootstrap, so every authored post is in the browser from the start | `minigames/osint-browser/osint-model.js:57-68`, `osint-browser-minigame.js:378-397, 567-593, 648-690`, `systems/social-intel.js:184` |
| The browser is opened from an object of type `osint-workstation`, limited to `minigameData.siteIds` and started at `minigameData.start` | `systems/minigame-starters.js:1185-1203` |
| A `requiresItem` object fires its actions when the player holds the named item, with `consumesItem` leaving it there. A sign-in PC returns before this code runs | `systems/interactions.js:797-806, 818-850` |
| Mapping conditions support `===`, `!==`, `>=`, `<=`, `>`, `<` on `data.*` and `globalVars.*`, joined with `&&` | `npc-manager.js` `safeEvaluateCondition` |
| Art that exists: `assets/objects/notes_postit1.png`, `fire_extinguisher1.png`, `phone.png` to `phone5.png`, `usb_bowl1.png`; `assets/icons/npc-blocked.png`, `npc-social.png`, `npc-work.png`. There is no phone-in-hand pose in the standard animation set | `public/break_escape/assets/` |

**Where the sketch in 9.2 was out of date or would not work.**

- The feed was "kept distinct from the social media browser's `social.landingPages[].profiles[].posts`".
  There is no such path. Profiles live at `social.osint.sites[].profiles[]`, and the browser
  already renders posts and grants their facts, so this plan reveals NPC posts **into** that
  browser. A separate `social_feed` object type is not needed.
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
  failure that belongs to one PC (`downIf` on the PC, and optionally an account lockout), which is
  what gives the hot desk workaround a point before networks exist.

## 3. Sub-slices

The slice is too large for one build. Three sub-slices, in this order; each ends playable and
tested, and each has its own steps in section 12.

| Sub-slice | Contents | Feature scenario |
|---|---|---|
| **A. Work, outages, frustration and the USB policy** (first) | Resources, work needs by role, the use verdict, failed uses and the retry wait, the check errand, frustration held on the server, the `usb` policy field, events, the validator and schema for all of it | `test_access_work`, beats W1 to W8 |
| **B. Workarounds** | The server hands over workarounds as thresholds are crossed; `borrow_session` with guest sessions, `writes_down`, `prop_door`, `share_login`, `emit`; the dungeon graph | `test_access_work`, beats X1 to X6 |
| **C. Social media** | The `social_media` need, the phone, the `social` policy field, the feed served post by post, the browser merge | `test_access_social`, beats F1 to F7 |

A is first because B and C both stand on the use verdict and on frustration. B and C do not depend
on each other and could swap; B is second because it delivers the chains. None of the three needs
networks: the one place networks enter is a hook that answers "reachable" until slice 9.3 replaces
it (section 15).

## 4. Scenario fields

All new fields in one place. The sections after this say what each does.

```jsonc
{
  // top level
  "resources": {
    "finance_share": { "name": "Finance share", "kind": "file_share",
                       "access": { "roles": ["finance"] }, "downIf": "finance_share_down",
                       "network": "server_net" },                    // network: read by 9.3 only
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
  }
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
    { "at": 50, "do": "borrow_session", "pc": "hot_desk" },
    { "at": 75, "do": "writes_down" },
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
| `resources.<id>` | top level | A | `name` (shown in events and the debug overlay), `kind` (a free label), `access` (an access list as in the first slice; absent: everyone), `downIf` (a global name; the resource is down while it is truthy), `object` (a room object the resource is tied to), `network` (accepted and carried through for 9.3) |
| `roles.<role>` | top level | A, B | Defaults for NPCs with that role: `workNeeds` (A), `frustration` (A), `workarounds` (B). 9.1 may add its own keys beside them. Never a grant: rights stay in access lists |
| `workNeeds` | room NPC | A | A list of resource ids. `"x"` or `"+x"` adds, `"-x"` removes, applied to the union of the NPC's roles' lists (roles in authored order, `staff` last) |
| `frustration` | room NPC, role | A | `perFail` (default 25, 1 to 100), `easePerSuccess` (default 10, 0 to 100), `retryMin` (default 1, game minutes before a failed need is tried again), `breakDrain` (default 10, points taken off every other need on a failure) |
| `workarounds` | room NPC, role | B | A list of `{ at, do, ... }` (section 6). The NPC's own list replaces the role's; it is not merged |
| `downIf` | workstation object | A | The PC does no work while the global is truthy |
| `usbClass` | item | A | `storage` or `hid`. Only items with it are subject to a `usb` policy |
| `policies.<id>.usb` | top level | A | `allowed` (default), `storage_blocked`, `blocked` (section 7). `storage_blocked` is new; see decision 3 |
| `policies.<id>.social` | top level | C | `allowed` (default) or `blocked` (section 8) |
| `needs.social_media` | room NPC | C | An ordinary need by a reserved name (section 8) |
| `phone` | room NPC | C | `false`: the NPC has no phone. Default true for an NPC with a `social_media` need |
| `socialUse` | room NPC | C | Optional `{ restores, useSeconds }` for a social media use (defaults 60 and 20) |
| `feed` | room NPC | C | `site` (a `social.osint.sites` id of type `social`), `person` (the profile's `person`), `posts` (blocks as the browser renders them: `id`, `text`, `fact`, `date`, `note`), and per post `deliberate: true` to silence the awareness warning |

`workNeeds`, `frustration`, `workarounds` and `feed` are allowed only on room NPCs, for the reason
`role` and `creds` are (first slice plan, section 3): every other NPC record reaches the browser
unfiltered.

## 5. Work, failed uses and frustration (sub-slice A)

### 5.1 The use verdict

When an NPC completes a use for the need `work` (the need name the office presets already give
desk PCs) or `social_media` (section 8), the use is judged. For `work` every failure is collected:

1. **The station.** The object used has a `downIf` whose global is truthy: `station_down`.
   Decision 5 adds a second station failure, `locked_out`.
2. **Each resource in the NPC's resolved work list**, in order:
   - its `access` does not admit the NPC: `no_access` (fixed for the whole mission);
   - its `downIf` global is truthy: `down`;
   - the station cannot reach the resource: `unreachable`. This asks one hook,
     `reaches(stationId, resource)`, which answers true until slice 9.3 supplies it.

No failures: the use is **met** and everything happens as today. An NPC with no resolved resources
at a station with no `downIf` is always met, so every existing scenario behaves as it does now.

The verdict is a pure function in a new module, `public/break_escape/js/systems/npc-work.js`
(`useVerdict(plan, need, station, env)`, no imports, so node tests load it directly).
`NPCNeedsSystem` reaches it through the world adapter: `world.useVerdict?.(npcId, need, obj)`. A
world without the method (every existing node test) treats each use as met, and the decision log
for a scenario without these fields stays byte for byte the same.

**The NPC's plan.** The client cannot work the verdict out from the scenario, because `role`,
`workNeeds`, `roles` and `resources` do not reach it (section 9.2). The server resolves each room
NPC's plan and attaches it to the NPC in room data as `work`:

```jsonc
"work": { "retryMin": 1, "breakDrain": 10,
          "needs": [ { "id": "finance_share", "name": "Finance share", "kind": "file_share",
                       "admitted": true, "downIf": "finance_share_down", "network": "server_net" },
                     { "id": "printer_2f", "name": "Second floor printer", "kind": "printer",
                       "admitted": true, "downIf": "printer_jammed", "object": "office_printer" } ] }
```

It holds the server's answer to "is this person admitted", not the role or the access list. NPC
records are built with `Object.assign` (`npc-manager.js` `registerNPC`), so `work` arrives on the
record the adapter reads.

### 5.2 A failed use

`_completeJob` (`npc-needs.js:1047`) asks for the verdict before it restores anything. When the use
is not met:

- The need is **not restored** and `lastSatisfiedAt` does not move.
- Every other need of that NPC loses `breakDrain` points (not below 0). A person who cannot work
  goes for coffee sooner, so an outage empties desks: the distraction the sketch asked for, through
  the needs the NPC already has.
- The failed need waits: `s.needRetryAt[need] = clockMs + retryMin` game minutes. `_select`
  (`:788`), `_anyUrgent` (`:781`) and `_blockedNeed` skip a need that is waiting, so the NPC does
  not start the same use again on the next tick and does not wander off to a colleague's PC to try
  there.
- `onUse` hooks still apply, except `revealOutput` (nothing was produced).
- `npc_used:<objectId>` still fires, with two added fields: `met: false` and `missing` (a list of
  `{ id, why }`; the station is `{ id: <objectId>, why: "station_down" }`). A met use carries
  `met: true`. Existing mappings are unaffected unless they choose to read the field.
- `npc_use_failed:<npcId>` fires with `{ npcId, objectId, need, missing, station }`, where
  `station` is true when a station failure is among them.
- The decision log gains `use_failed` (`need`, `target`, `missing` as ids).
- The NPC mutters one line in a world bubble (the existing bubble renderer draws
  `getState().talking`; a mutter is an entry with no partner). Built-in pools `work_fail`
  ("Share's down again.", "Why is nothing working?", "Not today, of all days."), `station_fail`,
  `usb_refused` and `social_blocked` are added beside `coffee`, `cooler` and `greet`
  (`DEFAULT_CHATTER`, `npc-needs.js:51`); a scenario's `chatter` replaces a pool by name as it
  does now, lines are at most 40 characters, and the line is chosen with the seeded `roll`.
  Bubbles are text only, so nothing here is voiced.
- For 4 seconds of the needs clock `getState().failed` is `{ need, missing }`, and the action icon
  slot shows the existing `blocked` icon. Unlike the pressing-need icons this does not wait for
  `showPressingNeeds`: a scenario that declares resources has opted in.
- The use is reported to the server (5.4).
- A **check errand** is queued (5.3) when one of the failures is a resource that is `down` and has
  an `object`.

A met use restores as today and, when the NPC's frustration is above 0, is reported as an ease.

### 5.3 Errands

An errand is a use job the needs system is told to run instead of choosing it: walk to a named
object, stay a few seconds, come back. Two things queue them: the check errand above, and a
workaround handed over by the server (section 6).

- `NPCNeedsSystem.enqueueErrand(npcId, { kind, targetId, useSeconds, data })` appends to
  `s.errands`. In `_tickNpc` (`:597`), an idle or returning NPC with an errand whose target exists
  and is reachable starts it before the selector runs:
  `_startJob(s, { kind: 'use', need: null, targetId, errand })`. A running job is never
  interrupted.
- The job uses the machinery every use job has: the wind-up, `npc_left_post` (so the workstation
  layer rolls the screen as for any leave), the walk, the dwell (`errand.useSeconds`, else the
  target's `affordance.useSeconds`, else 8), the walk back and `npc_returned_post`. An errand whose
  target is the NPC's own `needsHome` object is an at-post job and never leaves the desk.
- The target needs no `affordance`: `world.getObject` describes any object and `approachCell`
  falls back to the nearest walkable cell (`npc-needs.js:1612-1627`).
- An errand honours the room leash and ignores `private`, as a delivery does.
- On completion an errand restores nothing, applies no `onUse` hook and does **not** emit
  `npc_used`. It emits `npc_errand_done:<npcId>` with `{ npcId, kind, targetId, data }` and logs
  `errand_done`. For a check errand it also emits `npc_checked:<objectId>`.
- A target that is not loaded or not reachable is retried once a second. A check errand is dropped
  after 60 seconds; a workaround errand waits.
- `reset()` clears the queue. After a reload the server sends undone workarounds again (9.3).

### 5.4 Frustration lives on the server

Frustration is one number per NPC, 0 to 100, kept in `player_state.npcFrustration` (9.3). The
browser reports and mirrors; the server decides. This is what lets `workarounds` stay withheld
until each one is due, and it makes the level survive a reload without any client state.

- After a failed use the adapter calls `world.reportUse(npcId, { event: 'fail', need, objectId,
  missing })`, and after a met use with frustration above 0, `{ event: 'ease', ... }`. Both go to
  `POST /npc_frustration` (9.1).
- The server answers `{ level, previous, run }`. At the next tick the needs system stores the level
  (`s.frustration`, in `getState()` and the debug overlay as an `F` bar), sets the global
  `<npcId>_frustration` to the number (so text variants can say "she looks close to giving up" on
  `globalVars.dana_frustration >= 50`), and emits `npc_frustration_changed:<npcId>` with
  `{ npcId, level, previous }`. `run`, when present, is a workaround to perform (section 6).
- The answer arrives a tick or more after the use. Nothing in the needs decision depends on it
  (the retry wait and the drain are applied at once from the plan), so the decision log stays a
  function of the seed and the player's actions. In node tests the stub answers at once.
- A lost request loses one step of frustration and nothing else: the next report carries on from
  the server's number.

### 5.5 Outages

An outage is a global. Any resource and any workstation can name one in `downIf`; the player sets
it through whatever the scenario gives them (a `triggerOnInteract` on a breaker, a `requiresItem`
plant on a printer, a flag reward, an ink tag). While it is truthy every use that depends on it
fails, the people who depend on it leave their desks more often, walk to the broken thing to look
at it, and grow frustrated. Clearing the global ends it; each met use then eases frustration.

## 6. Workarounds (sub-slice B)

```jsonc
"workarounds": [
  { "at": 50, "do": "borrow_session", "pc": "hot_desk" },
  { "at": 75, "do": "writes_down" },
  { "at": 75, "do": "share_login", "with": "dana" },
  { "at": 90, "do": "prop_door", "door": "finance_office", "prop": "finance_door_wedge" }
]
```

`at` is the frustration level, 1 to 100, at which the workaround comes into force. Any workaround
may carry `setGlobal` (a global set true when it is done) for the scenario's own text and reveals.

| `do` | Kind | What the player sees | What it opens |
|---|---|---|---|
| `borrow_session` | repeating | The NPC gets up, walks to the named PC, works there, and walks back leaving it signed in | A claim of that NPC's session at that PC, with their profile on its desktop |
| `writes_down` | lasting | The NPC writes for a few seconds at the desk; a yellow note appears on the monitor | Their username and password on their own PC's sticky note, from then on |
| `share_login` | repeating | The NPC walks to a named colleague and says their login out loud | A capture of their account, if the player was in earshot |
| `prop_door` | lasting | The NPC walks to a door, opens it and wedges it with the named prop | The room, for the rest of the mission |
| `emit` | lasting | Whatever the scenario maps to the event | Scenario-specific beats |

A **lasting** workaround is performed once. A **repeating** one is performed again after each later
failed use while the level is still at or above its `at`, so a player who missed it gets another
chance and no puzzle rests on being in the right place at one moment.

**Handing over.** After each failed use the server picks at most one workaround for the NPC to
perform now and returns it as `run`: the first lasting one in force that is not yet done; if there
is none, the next repeating one in force, taken in turn. `run` is a description with nothing
secret in it: `{ index, do, pc | with | door, prop, setGlobal, event }`. The client queues it as an
errand (5.3), emits `npc_workaround:<npcId>` with `{ npcId, index, do, phase: "started" }`, and when
the errand completes calls `POST /npc_workaround` (9.1), then emits the same event with
`phase: "done"`. The server applies whatever the workaround opens when it hears "done", so nothing
opens before the player could have seen it happen.

### 6.1 `borrow_session`: the hot desk

- **Authoring.** `pc` names a sign-in PC that has no owner, is not `private`, admits the NPC's
  account and is not under a policy with `autoLockMin: 0` (validator errors otherwise). The NPC
  must have an account.
- **The errand.** The handed-over workaround sets `s.borrow = { pc, need }` for the need that
  failed. The next time that need is selected, the borrowed PC is the candidate ahead of the home
  object; the job is an ordinary use job flagged `borrowed`, so the verdict runs there too. If the
  failure belonged to the NPC's own PC, work now succeeds and frustration eases. If the resource
  itself is down, it fails again there, which is true to life and moves the NPC on to its next
  workaround.
- **While the NPC sits there** the PC is in use. The workstation env gains `userOf(objectId)` (the
  NPC whose current job is `using` that object, from the needs system); `presence()` and
  `onInteract` (`workstation-state.js:142, 314`) treat a user as present, so a click shows
  "<displayName> is using this PC".
- **When the NPC leaves**, `_completeJob` emits `npc_borrowed_session:<pcId>` with `{ npcId,
  objectId }`. The workstation layer records the NPC as that PC's **guest** and treats the moment
  as a leave with the screen left open: `autoLockMin` above 0 sets `lockAt` as for an owner, the
  globals `<pcId>_owner_away` and `<pcId>_screen_locked` are published, and
  `workstation_owner_left:<pcId>` fires with `{ objectId, ownerId: <npcId>, screenLocked: false,
  reason: "guest" }`. The locked-screen look and the indicator dot follow those events as they do
  now.
- **The claim.** With a guest record and nobody at the PC, `onInteract` returns `accessed`, and the
  sign-in branch claims through `pc-sessions.js` with `claim: "guest"`. The server checks are in
  9.1. The desktop is the guest's: the PC's own contents and every profile that admits them.
- **It ends** when the screen's auto lock fires, when anybody next sits at that PC (the layer emits
  `workstation_owner_returned:<pcId>`, which already ends a claimed session), or on a reload (the
  first slice's rule for every claim).
- **With slice 9.1.** A guest leaves the session open unless their `locksScreen` habit resolves to
  `always`, in which case they sign out and nothing is left. Until 9.1 is built the session is
  always left open.

### 6.2 `writes_down`: the sticky note

- **Authoring.** The NPC has an account and its `needsHome` is a sign-in PC.
- **The errand.** An at-post job at the NPC's own PC (6 seconds), so they stay seated.
- **Done.** The server records it. From then on the room data for that PC carries `postitNote`
  ("<username> / <password>") and `showPostit: true`, filled on the server from `creds`. The "done"
  answer carries the same two fields so the client can update the loaded PC without refetching the
  room, and the client shows the `notes_postit1` picture at the top corner of the PC's sprite. The
  sign-in screen already shows a PC's `postitNote`.
- This is the same fill slice 9.1's `writesDown` habit needs. One server helper decides, and both
  slices call it (section 15).

### 6.3 `share_login`: said out loud

- **Authoring.** `with` names another room NPC whose `needsHome` is an object. The NPC has an
  account, and the scenario sets `social.captures.revealSecret` (the validator warns otherwise,
  with the warning the first slice already has for a capture route).
- **The errand.** A use job on the colleague's `needsHome` object (6 seconds). On arrival the NPC
  says one line from the pool `share_login` ("Can you run it on my login?", "Use mine, it's the
  usual one."). The line never contains the username or the password.
- **Done.** The client reports whether the player heard: in the same room, within the chat
  overhear radius (`OVERHEAR_RADIUS`, 160 px) with a clear line, the test `world.playerHears`
  already makes for chatter. Heard: the server marks the account shared and answers
  `{ capture: { targetId: <npcId>, kind: "credential", address: <username>, note } }`, which the
  client records through `window.recordSECapture`; the password is then served by
  `/capture_secrets` like any earned capture (9.2). Not heard: nothing is recorded, and the
  workaround comes round again after the next failed use.
- `npc_overheard_login:<npcId>` fires when a capture is recorded, for tasks and hints.

### 6.4 `prop_door`: the wedged door

- **Authoring.** `door` is a locked room. `prop` is an object in a room next to it (a
  `fire_extinguisher1`, say) that the scenario hides with `revealOnGlobal` on the workaround's
  `setGlobal`. The validator warns when the NPC's own card or role would not open that door (they
  are propping a door they cannot open).
- **The errand.** A use job on the prop (4 seconds).
- **Done.** The server unlocks the room and answers with its room data, exactly as a door unlock
  does. The client opens every loaded door sprite to that room with `unlockDoor(doorSprite,
  roomData)` (`doors.js:703`), marks the room unlocked in `gameScenario` and `rooms`, sets
  `setGlobal` (which shows the prop) and emits `door_propped:<roomId>` with `{ roomId, npcId }`.
- The door stays open for the rest of the mission. A door that shuts again needs gate behaviour on
  an ordinary door, which is left out (section 17).

### 6.5 `emit`

`{ "at": 90, "do": "emit", "event": "jake_gave_up" }`: the client emits the named event with
`{ npcId, level }` when it is handed over, with no errand, and the server marks it done at once.

## 7. The USB policy (sub-slice A)

| `policy.usb` | An item with `usbClass: "storage"` | An item with `usbClass: "hid"` |
|---|---|---|
| `allowed` or absent | accepted | accepted |
| `storage_blocked` | refused | accepted |
| `blocked` | refused | refused |

An item without `usbClass` is never refused: a hardware keylogger that sits between the keyboard
and the PC is not a USB device the policy can see, and the lab's `requiresItem` plant keeps
working on any PC. The classes exist to teach one thing: a device control policy that blocks
storage does not stop a device that presents itself as a keyboard.

One pure helper, `usbRefused(policy, usbClass)`, in a new module
`public/break_escape/js/systems/pc-policy.js`, which also exports `effectivePolicy(objectData,
scenario)` (the object's `policy`, else `defaultPolicy`, as `workstation-state.js:370` resolves it).

**An NPC who finds a device.** Selection is unchanged: an NPC with an interest in the item's tag
picks it up and carries it to its own post if that accepts the tag, else the nearest accepting
object (`_carryCandidate`, `npc-needs.js:849`). The policy bites when the use completes:

1. The target's policy refuses the item's class. The item is not consumed, `npc_used` does not fire
   (so no payoff mapped to it can run), `npc_use_refused:<objectId>` fires with `{ npcId, objectId,
   itemId, tag, usbClass }`, the log gains `use_refused`, and the NPC mutters from `usb_refused`
   ("USB's disabled. Typical.").
2. The NPC then looks for another object that accepts the tag, is free and reachable, and whose
   policy does not refuse the item. If there is one, the same job carries on to it: the person
   tries their own PC, is refused, and takes the stick to the machine nobody manages. That use
   completes as any delivery does and fires `npc_used:<thatObject>`.
3. If there is none, the NPC puts the item down where they stand (`world.dropHeld`, as an aborted
   carry does), remembers it (`s.refused`, so they do not pick it up again) and goes home. The
   player can pick it up again.

The adapter's object description (`describe`, `npc-needs.js:1466`) gains `usbClass` for items and
`policy` (the effective policy) for targets.

**The player's own plant.** In the `requiresItem` branch (`interactions.js:825`), when the held
item has a `usbClass` and the object's effective policy refuses it, the click shows "USB storage is
disabled on this PC." or "USB devices are disabled on this PC." for the time `hintToastMs` gives,
emits `usb_refused:<objectId>` with `{ objectId, itemId, usbClass }`, runs no action and consumes
nothing.

The server is not involved: device payoffs are globals the browser sets, as they are today, so the
policy is as strong as the payoff it guards.

## 8. Social media (sub-slice C)

### 8.1 The need

`social_media` is an ordinary need (decay, `urgentAt`, weight) with its own way of being met. For
an NPC with this need the candidates are, in order:

1. a PC borrowed for it (6.1), when one is in force;
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
  its post stays at its post, so its screen stays attended, as the sketch required. An NPC walking
  home stops, uses the phone, and walks on.
- `getState().job` is `{ kind: "self", need: "social_media", phase: "using", targetId: null }`.
  `_claims`, `_moveForPhase`, `_atOwnPost` and `_targetsOwnPost` are not asked about a `self` job.
- It shows the action icon for `social_media`. No pose is drawn: there is no phone-in-hand
  animation in the standard set (decision 6).
- On completion it restores the need and emits `npc_used_phone:<npcId>` with `{ npcId, need,
  playerNearby, playerDistance }`. It does not emit `npc_used` (there is no object).
- A conversation freezes it and a knock-out aborts it, as for any job.
- While the job runs `getState().distracted` is true. Decision 7 is whether the sight challenge
  should respect it.

### 8.3 The feed

Each met `social_media` use, at a PC or on the phone, asks the server for that NPC's next post
(`POST /feed_post`, 9.1). The server answers with the post or with nothing (no feed, all posts
out, or too soon), and records how many are out.

- A new client module, `public/break_escape/js/systems/social-feed.js`, keeps the revealed posts by
  NPC, filled from the route's answers and, on load, from `feedPosts` in the scenario response. It
  emits `npc_posted:<npcId>` with `{ npcId, postId, index, site, person }`.
- **Reading.** `_socialView` (`osint-browser-minigame.js:378-397`) lists a profile's posts. It now
  lists the revealed feed posts for that site and person first, newest at the top, then the
  authored `posts`. A feed post is an ordinary post block: with an `id` it is a button, and
  clicking it grants its `fact` through `grantFact`, with the same "Noted" feedback, evidence note
  and readiness check as any other post. Nothing else in the browser changes.
- **Where.** Any `osint-workstation` object whose `minigameData.siteIds` includes the feed's site.
  A scenario that wants a "new post" nudge maps `npc_posted:<npcId>` to a bark or a hint.
- **What a post is for.** A fact the player can use: the pet's name and the year for a password
  built from them, who somebody trusts, when they are out of the office. Slice 9.1's `password:
  "guessable"` check should count feed posts as sources (section 15).
- **Awareness.** When the NPC's `awareness` is `high` (a 9.1 field; the validator reads the
  authored string whether or not 9.1 is built) a post with a `fact` draws a warning unless it is
  marked `"deliberate": true`.
- **Pace.** A post comes out per met use, so the pace is the need's own: the validator's timing
  report for the need (first urgent at T1, then every P minutes) is also the posting schedule, and
  it prints the minute at which each post is expected.

## 9. Server

### 9.1 Routes

Every route this slice adds or changes, with its checks in the order they run. A failed check stops
the request. "Locked" means the action joins the `with_game_lock` list
(`games_controller.rb:88-89`).

**Shared check, "NPC known":** the id names a room NPC (`scenario_room_npc`, `game.rb:1211`) and is
in `encounteredNPCs`, which the server fills when the NPC's room is loaded
(`track_npc_encounters`, `games_controller.rb:1714`). The needs system only runs NPCs in loaded
rooms, so every honest report passes.

**"Can fail".** A report of a failed use is accepted only where the scenario makes a failure
possible for that NPC and need:

- `work`: a resource in the NPC's resolved list is not admitted or has a `downIf`; or the NPC's
  home PC, or a PC one of its `borrow_session` workarounds names, has a `downIf`. Decision 5 adds:
  or the home PC is under a policy with `maxAttempts`. Slice 9.3 adds: or the scenario has
  networks.
- `social_media`: the NPC has the need and `"phone": false`, and its home PC is under a policy
  that blocks social media or has a `downIf`.

| Route | Sub-slice | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|---|
| `POST /npc_frustration` (new, locked) | A | `npc_id`, `event` (`fail` or `ease`), `need`, `object_id`, `missing` | 1. NPC known. 2. For `fail`: can fail (above). 3. For `fail`: at least half the NPC's retry wait (`retryMin` x 30 seconds of server time) since its last counted fail. | `fail`: level up by `perFail`, at most 100; record the time. `ease`: level down by `easePerSuccess`, at least 0. Then choose `run` (section 6) and add its index to `handed`; an `emit` is marked done at once. Answer `{ level, previous, run }` (`run` null in sub-slice A, and whenever nothing is due). Check 2 fails: 422. Check 3 fails: nothing written, answer `{ level, previous: level, run: null, tooSoon: true }`. `need`, `object_id` and `missing` are logged, not trusted |
| `POST /npc_workaround` (new, locked) | B | `npc_id`, `index`, `heard` | 1. NPC known. 2. `index` is in that NPC's `handed` list. | Add `index` to `done` (for a repeating workaround this records that it has happened at least once; it stays in turn). `borrow_session`: `guestSessions[pc] = npcId`; answer `{}`. `writes_down`: answer `{ pcId, postitNote, showPostit: true }`. `share_login`: with `heard`, add the NPC to `sharedLogins`, answer `{ capture }` (6.3) and take it out of turn, since the capture is made; without `heard`, answer `{}` and leave it in turn. `prop_door`: `unlock_room!` and answer `{ roomId, roomData }` from `filtered_room_data`. Check 2 fails: 403 |
| `POST /login` with `claim: "guest"` (changed, locked) | B | `pc_id`, `claim` | 1. PC reachable (first slice). 2. No session is held at the PC. 3. `guestSessions[pcId]` names an NPC. 4. That NPC has an account. 5. The PC's `access` admits it. 6. The PC's policy is not `autoLockMin: 0`. | Success: `sessions[pcId] = { id, via: "claim" }`, add to `signedInPcs`; the answer a claim gives today. Failure: "Sign in required" |
| `POST /feed_post` (new, locked) | C | `npc_id` | 1. NPC known. 2. The NPC has a `feed` with posts and a valid `social_media` need. 3. A post is left. 4. For a second or later post: at least half the need's period since that NPC's last one (the period is `min(100 - urgentAt, restores) / decayPerMin` minutes, the validator's P). | `feedRevealed[npcId] = { n, at }`; answer `{ index, post, site, person }`. Checks 3 or 4 fail: `{ post: null }` |
| `GET /scenario` (changed) | A, B, C | as today | As today. | `filtered_scenario_for_bootstrap` also deletes `resources` and `roles`. The `scenario` action adds `npcFrustration` (per NPC: `level`, `pending`, the handed-over workarounds not yet done, as `run` descriptions, and `done`, likewise) and `feedPosts` (per NPC: `site`, `person` and the posts revealed so far). After answering it clears `guestSessions`, as it ends claimed sessions (`end_claimed_sessions!`, `game.rb:1495`), with the same row lock |
| `GET /room/:id` and the room data of a door unlock (changed) | A, B, C | as today | As today. | Through `filtered_room_data`: each room NPC gains `work` (5.1) and, with a feed, `hasFeed: true`; `workNeeds`, `frustration` and `feed` are deleted beside the keys withheld today; a sign-in PC whose owner's `writes_down` is done gains `postitNote` and `showPostit` |
| `GET /capture_secrets` (changed) | B | as today | As today. | An account holder in `sharedLogins` counts as having a capture route (`account_capture_passwords`, `game.rb:957`) |

No route is added for the USB policy (section 7).

With decision 5 two things are added in sub-slice B: the `scenario` action also returns
`lockedOutAccounts` (`[{ pcId, npcId }]`, for locked-out usernames that belong to an account), and
the client keeps the same list from each `lockedOut` sign-in answer whose username matches an
account tile, so the verdict can say `locked_out` for that person at that PC.

**What these checks prove.** As with a claimed session in the first slice, the server cannot see an
NPC use anything, so a report is a client claim honoured only where the scenario makes it
possible, and paced so it cannot outrun the game. A modified client can therefore walk an NPC it
has met up its frustration scale at the honest pace without causing an outage. It cannot make an
NPC do a workaround the scenario did not give it, cannot hurry it, and cannot read a password,
a post or a workaround before the server hands it over. A lock that must not be passable this way
should rest on something the server checks itself (first slice plan 4.2), and the validator says
which locks a workaround opens (section 10).

### 9.2 What the browser receives and what it does not

| Data | Reaches the browser | Withheld |
|---|---|---|
| `resources`, `roles` | Never as authored. Each NPC's own plan, as `work` (ids, names, kinds, `admitted`, `downIf`, `object`, `network`, `retryMin`, `breakDrain`) | Access lists on resources, role defaults, who has which role |
| `workNeeds`, `frustration` | No | Deleted from every room NPC |
| `workarounds` | One at a time, as `run`, when the server decides it is due; again in `npcFrustration` on a reload | The list, the thresholds, and every workaround not yet due |
| Frustration level | Yes, in each answer and on a reload | `perFail` and `easePerSuccess` stay on the server |
| A written-down password | In the home PC's `postitNote`, after the workaround is done | Before that |
| A shared login | The username in the capture, after the player heard it; the password from `/capture_secrets` once the capture is earned and `revealSecret` is on | Before that; and always, when the player did not hear |
| `feed` | Posts revealed so far, one per answer and all on a reload; `hasFeed: true` on the NPC | Every post not yet revealed, and how many there are |
| `policies` | As today (the bootstrap ships them); `usb` and `social` are not secret | Nothing |
| `phone`, `socialUse`, `needs`, `usbClass`, `downIf` | As authored | Nothing |

Where the code goes:

- `compile_npc_plan!(npc)` (new) runs in the NPC loop of `filter_requires_and_contents_recursive`
  (`game.rb:3947-3950`) just before `withhold_npc_secrets!`, because it needs `role`, which that
  method deletes. NPCs added by `update_room` are merged before the filter runs, so they are
  covered.
- `WITHHELD_NPC_KEYS` (`game.rb:3968`) gains `workNeeds`, `frustration` and `feed`. `workarounds`
  is there already.
- `filtered_scenario_for_bootstrap` (`game.rb:887`) deletes `resources` and `roles` beside
  `accountProfiles`.
- The validator keeps `workNeeds`, `frustration`, `workarounds` and `feed` off every NPC record
  that is not a room NPC (section 10), so they cannot ship through `npcs`, `phoneNPCs` or `social`.
- A mutter pool, a resource `name` and a post are text that ships, sooner or later. The validator
  errors when any NPC's password appears in one.

**The no-password test** of the first slice gains a fixture NPC with work needs, each kind of
workaround and a feed, and these assertions: before any report, no response holds the password, a
post's text, or the words `borrow_session`, `writes_down`, `share_login` or `prop_door`; after
`writes_down` is done the password is in that PC's `postitNote` and nowhere else; after a heard
`share_login` it is in `/capture_secrets` and nowhere else; after one `/feed_post` the first post
is in that answer and in `GET /scenario`, and the second is nowhere.

### 9.3 State and saved games

New `player_state` keys, added to `ACCESS_STATE_DEFAULTS` (`game.rb:1123`) so
`initialize_player_state` fills them, and left off `preserved_keys` (`game.rb:95`) so a reset
drops them:

| Key | Shape | Meaning |
|---|---|---|
| `npcFrustration` | `{ npcId: { level, failAt, handed: [index], done: [index], turn } }` | The level, the server time of the last counted fail, the workarounds handed over and those done, and whose turn it is among the repeating ones |
| `guestSessions` | `{ pcId: npcId }` | Who last left a borrowed session at each PC |
| `sharedLogins` | `[npcId]` | Accounts the player heard shared |
| `feedRevealed` | `{ npcId: { n, at } }` | How many of each NPC's posts are out, and when the last came out |

All four are bounded by the scenario (one entry per NPC or PC). A game saved before this build has
none of them: every reader goes through a helper that treats a missing key as empty, as
`access_sessions` does (`game.rb:1275`). A game's scenario data is fixed when the game is created,
so a game made before a scenario gained these fields plays on without them.

What a reload does:

| Thing | After a reload |
|---|---|
| Frustration level | Kept: `npcFrustration` in the scenario response; the client sets `s.frustration` and the `<npcId>_frustration` global from it |
| Need levels, retry waits, errand queues, the "refused" memory for a USB item | Reset, as all needs state is today |
| A workaround handed over and not done | Sent again as `pending`; the client queues its errand again |
| A lasting workaround that is done | Still in force: the room is in `unlockedRooms`, the sticky note is in room data, the capture is in `se_captures` |
| A guest session and its claim | Ended, as every claim is; the PC shows the sign-in screen until the NPC borrows it again |
| Revealed posts | Kept: `feedPosts`; the browser shows them at once |
| Outages | Kept: they are globals |

## 10. Validator, schema and dungeon graph

**One resolver.** A new pure module, `lib/break_escape/access_work.rb`, resolves an NPC's work list
(roles in order, `staff` last, then the NPC's own `+` and `-`), its frustration settings (role
defaults, then the NPC's own, field by field), its workarounds (the NPC's list, else the first of
its roles that has one) and the "can fail" rule. `game.rb` and the validator both call it, as both
call `BreakEscape::DeclaredGrants`, so the server and the validator cannot drift apart.

**Files.** `scripts/validate_scenario.rb`: the known-field lists (`:391-419`, `:487-512`) gain
`resources`, `roles`; NPC `workNeeds`, `frustration`, `workarounds`, `phone`, `socialUse`, `feed`;
item `usbClass` and `downIf`. The checks go in a new `scripts/validate_access_work.rb`
(`require_relative`, as `validate_npc_needs.rb` is). `scripts/validate_npc_needs.rb:481-483` skips
`social_media` (8.1). `scripts/scenario-schema.json` gains the same fields, inserted as text (the
file must not be re-serialised), with `usb` gaining `storage_blocked`.

Errors:

- a reference that resolves to nothing: a `workNeeds` entry (after its `+` or `-`), a resource's
  `object`, a person in a resource's `access`, a workaround's `pc`, `with`, `door` or `prop`, a
  feed's `site` (it must be a `social` site) or `person` (a profile on that site);
- `workNeeds`, `frustration`, `workarounds` or `feed` on an NPC record that is not a room NPC;
- a value out of bounds: `at` outside 1 to 100, a frustration field outside its range, an unknown
  `do`, an unknown `usbClass`, an unknown `usb` or `social` policy value;
- `borrow_session`: the NPC has no account; `pc` is not a sign-in PC, has an owner, is `private`,
  does not admit the NPC, or is under a policy with `autoLockMin: 0`;
- `writes_down`: the NPC has no account, or its `needsHome` is not a sign-in PC;
- `share_login`: the NPC has no account; `with` is the NPC itself or has no object for a home;
- `prop_door`: `door` is not a locked room, or is a gate door; `prop` is not in that room or a room
  connected to it;
- `emit` with no `event`;
- a feed post `id` shared with any other post or block id in `social.osint`, or with another feed
  post; a feed post `fact` that names no `social.intelFacts` entry;
- an NPC with a `social_media` need, `"phone": false`, no workstation for a home and no object
  that satisfies the need;
- any NPC's `creds.password` inside a feed post, a `chatter` pool or a resource `name`.

Warnings:

- a workaround on an NPC that can never be frustrated (the "can fail" rule is false for every need
  it has): it will never happen;
- an NPC with a resource it is not admitted to: its work never succeeds, so its workarounds happen
  without the player doing anything;
- a `downIf` global that `globalVariables` does not declare;
- a resource no NPC needs; a `roles` entry no NPC holds;
- `prop_door` by an NPC whose own card and role do not open that door;
- `share_login` in a scenario without `social.captures.revealSecret`;
- `lockChance` or `locksScreenOnLeave` on a PC named by `borrow_session` (a guest ignores them);
- a post with a `fact` on an NPC whose `awareness` is `high`, unless `"deliberate": true`;
- a `usb` policy other than `allowed` on a PC that accepts only tags whose items have no
  `usbClass` (the policy does nothing there);
- an errand target (a check errand's `object`, a workaround's target) in a room the NPC's leash
  forbids.

Report lines, in the style of the needs timing report:

- per NPC with work needs: the resolved list, each resource marked admitted or not, and what can
  take it down;
- per NPC with workarounds: how many failed uses reach each one and roughly how long an outage
  that is (failed uses times the retry wait), so an author can see that "prop the door" needs four
  minutes of outage, not forty;
- per NPC with a feed: the minute each post is expected;
- per workaround, **what it opens**: the account, PC or room. This is the list an author checks
  against section 9.1's caveat.

Tests: `test/js/validator-access-work.test.mjs` (new, in the pattern of
`validator-access-model.test.mjs`): one fixture per error and warning, a clean fixture that raises
none, and the three report lines.

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
3. **A scripted run of each**, by the tier `AGENTS.md` gives scripted browser playtests, on the
   keyless server on :3001 (never the server on :3000), headless, with `--capture-responses`, one
   numbered step per beat, at least one reload per run, 10 to 15 minutes each, and two checks after
   every beat: `verify-run.rb <game_id> --access` against the record `PLAYTEST.md` expects, and
   `access-leak-check.rb` over the responses so far. A "stuck" from that tier counts only once a
   run by the next tier up confirms it. These runs join the first slice's three as the access
   model's regression suite: after any fix to access model code, the run that found the bug and
   then every other suite run is repeated before the fix is committed.
4. **Needs regression**: `tools/playtest/needs-baseline-capture.js` on `test_needs_sims`,
   `test_npc_needs` and `test_needs_leash` before and after each sub-slice's needs changes,
   compared with `needs-baseline-compare.js`. None of the three has resources, a `usbClass` item,
   a policy or a `social_media` need, so the planned difference is **none**, apart from the added
   `met: true` on `npc_used` (the compare tool's fixed field list does not include it).
5. **A watch-it-happen run** at the end of sub-slices B and C, by the tier `AGENTS.md` gives
   persona playtests: a player who is told only "cause trouble and see what the staff do", judging
   whether each workaround is noticeable and understandable as it happens (did you see her get up,
   did you see the note appear, did you understand why), with every "I did not notice" listed.
   This is the check on the design aim that workarounds are openings the player can observe.

**Tooling changes** (step A7, extended in B and C):

- `tools/playtest/lib/access_leak_scanner.rb`: the secrets it reads from the game's scenario data
  gain every feed post's text and every authored workaround. It reports a feed post in any response
  before the server's `feedRevealed` count covers it; a workaround's `do` with its target in any
  response while the server has not handed it over; and it allows a password in a PC's
  `postitNote` only when that PC's owner has `writes_down` done. It still prints owners and ids,
  never values.
- `tools/playtest/verify-run.rb --access`: prints `npcFrustration` (level, handed, done per NPC),
  `guestSessions`, `sharedLogins` and `feedRevealed` (counts).
- `public/break_escape/js/systems/test-bridge/index.js`: `window.__test.needs.state(npcId)` already
  returns `getState()`, which gains `frustration`, `failed`, `errands` (kinds and targets) and
  `distracted`. `window.__test.access` gains `work(npcId)` (the plan, read only),
  `guest(pcId)` and `feed()` (revealed post ids by NPC). Documented in `docs/test-bridge.md`.
- Clock moves (`window.__test.needs.setManualClock`, `step`) are used only where a beat says so and
  are marked "exercised, not earned". Every password typed is read from its in-game source first.

### 11.1 `scenarios/test_access_work` (sub-slices A and B)

Shared set-up. Policies: `managed` (`usb: "storage_blocked"`, `autoLockMin: 5`), `locked_down`
(`usb: "blocked"`), `lax`. Resources: `email`; `finance_share` (`access` finance, `downIf:
"finance_share_down"`); `printer` (`object: "office_printer"`, `downIf: "printer_jammed"`).
`roles.staff.frustration` is `{ "perFail": 50, "retryMin": 0.5 }` so two failed uses reach 100 in
about a minute. Every owner's `work` need is fast (`decayPerMin: 40`, `urgentAt: 50`, `initial:
60`: urgent after about 15 seconds) and every PC's `useSeconds` is 5.

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| W1 Work that succeeds | `ok_room`: Amy Cole, role `staff` (email only), `amy_pc` | She works at her desk about every 15 seconds; `npc_used:amy_pc` carries `met: true`; no mutter | No `npcFrustration` entry for Amy |
| W2 An outage | `share_room`: Dana Reyes, role `finance`; a breaker object whose click toggles `finance_share_down`; a coffee station | After the breaker is thrown her next use fails: a mutter, the blocked icon, `npc_use_failed:dana` naming `finance_share` as `down`, and she leaves for coffee sooner than before | `npcFrustration.dana.level` 50, then 100 |
| W3 Recovery | Same room, breaker back | Her next use is met and the level eases by 10 for each met use | `level` 90, then 80 |
| W4 The printer, and a chain | `print_room`: Omar Haddad needs `printer`; `office_printer` is in the open `copy_room` next door, with a lever that sets `printer_jammed`. `omar_pc` is a sign-in PC with `lockChance: 0`; his profile holds a note | His use fails, he walks to the printer (`npc_checked:office_printer`), and while he is there a click on his PC claims his session and shows the note | `sessions.omar_pc` a claim; `npcFrustration.omar.level` 50 |
| W5 No access | `starter_room`: Kai Brennan, role `staff`, `workNeeds: ["+finance_share"]` | His work fails with `no_access` from his first use, with no player action | `npcFrustration.kai.level` rising from the start |
| W6 A PC out of order | `cable_room`: Ian Shaw; `ian_pc` has `downIf: "ian_pc_unplugged"`; a wall socket object sets it | `npc_use_failed:ian` with `station: true`; the mutter comes from `station_fail` | `npcFrustration.ian.level` 50 |
| W7 Storage refused, then the kiosk | `usb_room`: Lena Fox with interests in `dev_usb` and `dev_badusb`; `lena_pc` (her post, accepts both, under `managed`); `kiosk_pc` (accepts `dev_usb`, under `lax`). On the lobby table: `kit_usb` (`usbClass: "storage"`) and `kit_badusb` (`usbClass: "hid"`) | Drop the storage stick: she carries it to her PC, `npc_use_refused:lena_pc`, a mutter, then to the kiosk, `npc_used:kiosk_pc`. Drop the keyboard-type device: her PC takes it, `npc_used:lena_pc` | None (the beat's tasks complete from the two events) |
| W8 Refused outright, and the player's own plant | `vault_room`: Priya Nair; `priya_pc` under `locked_down` is the only object that accepts her tag; `priya_dock`, a `requiresItem` object under `locked_down` | A dropped storage stick is refused, put down by her PC and left there. Clicking the dock while holding the stick shows "USB devices are disabled on this PC." and the stick stays in the inventory | None |

Expected validator output: the "work never succeeds" warning for Kai. Scripted runs: W1 to W4 with
the reload after W4 (the level is kept, the claim ends, Dana's outage global is as it was left);
then W5 to W8.

Sub-slice B adds rooms to the same scenario:

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| X1 The sticky note | `note_room`: Mei Lin, an account; `mei_pc`, a sign-in PC with `lockChance: 1`; resource `rota` with a switch; `workarounds: [{ "at": 50, "do": "writes_down" }]` | Before the outage the sign-in screen shows no note. One failed use later she writes at her desk, a yellow note appears on the monitor, and `npc_workaround:mei` fires with `started`, then `done`. When she next leaves, the sign-in screen shows the note and its password signs in | `npcFrustration.mei.done` is `[0]`; `sessions.mei_pc` Mei by password |
| X2 The hot desk | `cable_room` again: Ian has `[{ "at": 50, "do": "borrow_session", "pc": "hot_desk" }]`; `hot_desk` is in the lobby, unowned, under `managed` | After the failure at his unplugged PC he walks to the hot desk and works there (met, so his level eases). A click while he sits there shows "Ian Shaw is using this PC". After he walks back a click opens his desktop. With the needs clock on manual, just past five game minutes it closes with "The screen locked" | `guestSessions.hot_desk` is `ian`; `sessions.hot_desk` a claim, then gone |
| X3 The propped door | `store_lobby`: Tom Fletcher, role `facilities`, with a card; `store_room` behind an `rfid` door that admits `facilities`; `store_wedge` (a fire extinguisher) hidden on `store_door_propped`; a workaround at 50 | Tom walks to the door, it opens, the extinguisher appears and `door_propped:store_room` fires. The player walks in | `unlockedRooms` has `store_room`; `npcFrustration.tom.done` is `[0]` |
| X4 Said out loud | `open_office`: Sam Okafor (an account) and Ruth Adeyemi at the far desk; `[{ "at": 50, "do": "share_login", "with": "ruth" }]`; a captures terminal; the scenario sets `social.captures.revealSecret` | With the player out of the room, Sam walks over and speaks; nothing is captured. On his next failed use, with the player beside Ruth's desk, the capture is added, `npc_overheard_login:sam` fires and the terminal shows his password, which then signs in as Sam at the hot desk | `sharedLogins` is empty after the first and `["sam"]` after the second |
| X5 Reload | After X1 and X2, in the middle of X3: the game is reloaded while Tom is still walking to the door | Mei's note is still shown, the levels are kept, the hot desk shows the sign-in screen, and Tom, whose workaround was handed over and not done, sets off again and props the door | As before the reload, without the claim and with `guestSessions` empty; then X3's record |
| X6 The lockout chain (decision 5) | `lock_room`: Jake Brooks; `jake_pc` under `strict` (`maxAttempts: 3`); a `borrow_session` to `hot_desk_2` at 50 | While Jake is at the coffee station the player types three wrong passwords on his tile. When he returns his next use fails with `locked_out`, he hot-desks, and his session there is claimed | `loginLockouts` holds Jake at `jake_pc`; `guestSessions.hot_desk_2` is `jake` |

Scripted runs: X1, X2, then X3 with X5's reload inside it; then X4 and X6. Then the W runs and the first slice's three suite
runs again.

### 11.2 `scenarios/test_access_social` (sub-slice C)

Shared set-up. `social.osint` has one `social` site, `friendface`, with a profile and one authored
post each for Jake, Lena and Omar, and `social.intelFacts` for the facts below. A "Friendface
terminal" (`osint-workstation`, `siteIds: ["friendface"]`) stands in the lobby. Policies:
`no_social` (`social: "blocked"`) and `lax`. Every `social_media` need is fast (`decayPerMin: 30`,
`urgentAt: 40`, `initial: 50`).

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| F1 Posts are withheld | Lobby, before entering any room | Each profile shows its one authored post and nothing else | `feedRevealed` empty; the leak check finds no feed post in any response |
| F2 The phone at the desk | `jake_room`: Jake Brooks, `jake_pc` under `no_social`, a phone, a feed of three posts | Jake uses his phone where he sits and never gets up; a click on his PC says he is using it; `npc_used_phone:jake` fires. The terminal now shows his first feed post above the authored one, and clicking it notes `jake_pet_name` | `feedRevealed.jake.n` is 1 |
| F3 The PC, where it is allowed | `lena_room`: Lena Fox, `lena_pc` under `lax` | She uses her PC for it (`npc_used:lena_pc` with need `social_media`, `met: true`); her first post appears | `feedRevealed.lena.n` is 1 |
| F4 Blocked and no phone | `omar_room`: Omar Haddad, `"phone": false`, `omar_pc` under `no_social`, a `borrow_session` to the lobby `kiosk` (under `lax`) at 50 | His attempt fails with `social_blocked` and a mutter. He walks to the kiosk, uses it (met; his first post appears) and walks back. A click on the kiosk opens his desktop | `npcFrustration.omar`; `guestSessions.kiosk` is `omar`; `feedRevealed.omar.n` is 1 |
| F5 The chain | Lobby: a poster ("IT reminder: your pet's name and a year is not a password") and `hot_desk`, a sign-in PC that admits Jake. Jake's second post gives the year | With both of Jake's facts noted, the password built from them signs in as Jake at the hot desk, and his desktop holds the beat's final note | `sessions.hot_desk` Jake by password |
| F6 The feed runs out | Needs clock on manual | Stepped on, Jake posts his third post; later uses reveal nothing and nothing breaks | `feedRevealed.jake.n` stays 3 |
| F7 Reload | After F2 to F4 | The terminal shows every revealed post at once; unrevealed posts are still in no response | Unchanged |
| F8 A distracted guard (decision 7) | `gate_room`: a guard with `los.challengeOnSight`, a `social_media` need and a phone | While he is on his phone, walking through his view fires no `player_in_view_near:guard`; once he puts it away it does | None |

The password in F5 is deduced from two posts and a poster, each read in the game first; the
earned-secrets table records the three sources. Scripted runs: F1 to F4 and F7; then F5, F6 and F8.

## 12. Build steps

Each step lists its files and its tests, and is done when its tests, the node and Rails suites,
the no-password test and every suite run built so far pass. Steps inside a sub-slice run in the
streams of section 13.

### Sub-slice A

**A1. The resolver and the fields.**
Files: `lib/break_escape/access_work.rb` (new); `scripts/scenario-schema.json`; the known-field
lists in `scripts/validate_scenario.rb`.
Work: resolve the work list, the frustration settings and "can fail" (section 10). Accept every
field in section 4 (B and C fields too, so later sub-slices add checks, not names).
Tests: `test/unit/access_work_test.rb` (new): role order with `staff` last; `+`, `-` and bare
entries; an NPC with no role; frustration merged field by field; "can fail" for each cause and for
none. The schema accepts a fixture using every field.

**A2. Withholding and the plan.**
Files: `app/models/break_escape/game.rb` (`compile_npc_plan!`, `WITHHELD_NPC_KEYS`,
`filtered_scenario_for_bootstrap`, `ACCESS_STATE_DEFAULTS`).
Tests (`test/models`): a room NPC's `work` holds the resolved list with `admitted` right for an
admitted and a refused resource; `workNeeds`, `frustration`, `workarounds`, `feed` and `role` are
gone from room data and from the room data of a door unlock; an NPC added by `update_room` is
treated the same; `GET /scenario` has no `resources` or `roles`; the no-password test with the new
fixture (9.2), over the routes that exist at this step.

**A3. The frustration route.**
Files: `config/routes.rb`; `games_controller.rb` (`npc_frustration`, the lock list, the `scenario`
action's `npcFrustration`); `game.rb` (`report_npc_use!`, the level helpers).
Tests (`test/controllers`): an unknown NPC, an NPC not yet met and an NPC that cannot fail are each
refused; a fail raises the level by the resolved `perFail` and stops at 100; a second fail inside
half the retry wait writes nothing and answers `tooSoon`; an ease lowers it and stops at 0; the
answer never holds a workaround in this sub-slice; the level is in `GET /scenario`; a reset clears
it; a game whose `player_state` lacks the key answers as an empty one.

**A4. Validator checks for A.**
Files: `scripts/validate_access_work.rb` (new), `scripts/validate_scenario.rb` (the call).
Tests: `test/js/validator-access-work.test.mjs` with the fixtures for the A errors, warnings and
the work report line; a clean fixture.

**A5. The needs core.**
Files: `public/break_escape/js/systems/npc-work.js` (new); `systems/npc-needs.js`
(`_completeJob`: the verdict and the failed-use path; `_select`, `_anyUrgent`, `_blockedNeed`: the
retry wait; `_tickNpc`: errands; `enqueueErrand`; the mutter in `_talking`; `getState`; the pools
in `DEFAULT_CHATTER`; in `createEngineWorld`: `useVerdict`, `reportUse`, and `usbClass`, `policy`
and `downIf` in `describe`).
Tests (`test/js`): `npc-work.test.mjs` (new): the verdict for each failure, several at once, the
`reaches` hook defaulting to true. `npc-needs-work.test.mjs` (new), on the stub world: a failed
use restores nothing, drains the other needs, waits `retryMin` before the same need is selected
again, emits `npc_used` with `met: false` and `npc_use_failed`, skips `revealOutput`, and reports
once; a met use with frustration reports an ease; the mutter shows for its time and is seeded; a
check errand walks to the object, emits `npc_checked` and `npc_errand_done`, emits no `npc_used`
and leaves the post like any trip; an errand waits for a running job; a late server answer changes
no decision. Every existing needs test passes unchanged, and the decision log of the
`needs-sims-world` fixture is byte for byte what it was.

**A6. The USB policy.**
Files: `systems/pc-policy.js` (new); `systems/npc-needs.js` (`_completeJob`: refusal, the move to
another target, the put-down and the memory); `systems/interactions.js` (the `requiresItem`
branch).
Tests: `pc-policy.test.mjs` (new): the table in section 7, and `effectivePolicy` with a PC's own
policy, the default and neither. `npc-needs-usb-policy.test.mjs` (new): storage refused at a
managed PC with no `npc_used`; then delivered to a permitted one; with none, put down and not
picked up again; a `hid` item accepted under `storage_blocked` and refused under `blocked`; an
item with no `usbClass` never refused. `usb-plant-refused.test.mjs` (new): the player's plant is
refused with the right line, runs no action and keeps the item.

**A7. Client surfaces and tooling.**
Files: `api-client.js` (`npcFrustration`); `core/game.js` (hand `npcFrustration` from the scenario
response to the needs system where `sessions` is handed to `pc-sessions.js`);
`systems/npc-action-icons.js` (the `failed` state shows `blocked`); `systems/npc-needs-debug.js`
(the `F` bar); the tooling in section 11.
Tests: `npc-frustration-restore.test.mjs` (new): levels from the scenario response set
`s.frustration` and the global. `npc-needs-debug.test.mjs`: the bar. The leak scanner's unit test
and `playtest-verify-run-access.test.mjs` gain the new keys; `test-bridge-access.test.mjs` gains
`work`.

**A8. `test_access_work`, beats W1 to W8.** The scenario, its `PLAYTEST.md`, static checks
(validator clean apart from the expected warning, dungeon graph regenerated, suites passing), the
two scripted runs, the needs regression captures, then the first slice's three suite runs.

### Sub-slice B

**B1. Server.**
Files: `game.rb` (choosing `run`, `complete_workaround!`, the guest claim beside
`claim_login_session!`, `account_capture_passwords`, the sticky note fill in `filtered_room_data`,
clearing `guestSessions`); `games_controller.rb` (`npc_workaround`, `login` passing `claim:
"guest"`, the `scenario` action's `pending` and `done`); `config/routes.rb`.
Tests: thresholds crossed one at a time and two at once; lasting before repeating; repeating ones
in turn, and a heard `share_login` leaving the turn; `run` never repeats a lasting one that is
done; "done" for an index never handed over is refused; each kind's answer; each guest claim
refusal (no guest, a session held, no account, not admitted, `autoLockMin: 0`); the sticky note in
room data only after "done"; `/capture_secrets` serving a shared login only after a heard "done"
and only with `revealSecret`; `prop_door` putting the room in `unlockedRooms`; a reload answer
with a pending workaround; `guestSessions` empty after `GET /scenario`; the rest of the
no-password test.

**B2. Validator and dungeon graph.** The B errors, warnings and report lines (section 10), and the
graph nodes. Tests: the fixtures; `dungeon-graph-workarounds.test.mjs`.

**B3. Needs hooks and the workaround runner.**
Files: `systems/npc-workarounds.js` (new: takes `run` from each frustration answer and `pending`
from a load, queues the errand, emits `npc_workaround`, calls "done", applies the answer: the
sticky note fields and picture, the door, the capture, `setGlobal`); `systems/npc-needs.js`
(`s.borrow` as the first candidate in `_useCandidate`, the `borrowed` flag, `npc_borrowed_session`,
`userOf(objectId)`).
Tests: `npc-workarounds.test.mjs` (new), with a stub API: each kind queues the right errand,
emits `started` then `done`, and applies its answer; `share_login` reports `heard` from
`playerHears`; a pending workaround from a load is queued once. `npc-needs-work.test.mjs`: a
borrowed PC is chosen ahead of the home object for the failing need only, for one use.

**B4. The workstation layer and sessions.**
Files: `systems/workstation-state.js` (guest records, `userOf` in presence and `onInteract`, the
guest leave and its auto lock); `systems/pc-sessions.js` (`claim(pcId, { as: "guest" })`);
`systems/unlock-system.js` (`interactLoginPc` chooses the claim kind); `api-client.js`
(`npcWorkaround`).
Tests: `workstation-state.test.mjs`: a PC in use by a non-owner answers `attended`; a guest leave
publishes the globals, emits `workstation_owner_left` with `reason: "guest"` and makes the next
click `accessed`; `autoLockMin` locks it and emits `workstation_auto_locked`; the next person to
sit down ends it; an env without `userOf` keeps today's answers. `pc-sessions.test.mjs`: a guest
claim emits `pc_signed_in` with `via: "claim"` and ends on the auto lock and on a reload.
`screen-states.test.mjs` passes unchanged.

**B5. `test_access_work`, beats X1 to X5** (and X6 with decision 5: `locked_out` in the verdict,
`pc-sessions.js` remembering a lockout the server reported, the "can fail" clause, and
`lockedOutAccounts` in the scenario response). The scripted runs, the watch-it-happen run, the W
runs and the first slice's suite.

### Sub-slice C

**C1. Server.**
Files: `game.rb` (`reveal_feed_post!`, `feed_posts_for_client`, `hasFeed` in `compile_npc_plan!`,
"can fail" for `social_media`); `games_controller.rb` (`feed_post`, the `scenario` action);
`config/routes.rb`.
Tests: posts come out in order, one per call; the pace check; nothing after the last; an NPC with
no feed or no need gets nothing; `feed` is in no room response and `feedPosts` holds exactly the
revealed ones; the no-password test's feed assertions.

**C2. Validator.** The C errors and warnings, the `social_media` exemption in
`validate_npc_needs.rb`, the posting schedule line. Tests: the fixtures.

**C3. The need in the needs core.**
Files: `systems/npc-needs.js` (the candidate order of 8.1; the `self` job in `_startJob`,
`_advanceJob`, `_completeJob`, `_tickNpc`'s freeze and block paths and `getState`; the
`social_media` verdict through `npc-work.js`; `distracted`); `systems/npc-sight-challenge.js` (with
decision 7).
Tests: `npc-needs-social-media.test.mjs` (new): each candidate in its order; a phone use at the
post emits no `npc_left_post` and keeps `atPost`; one on the walk home resumes the walk; a blocked
PC with no phone fails and raises frustration; a blocked PC with a phone never fails; a
conversation freezes a phone use and a knock-out aborts it; `npc_used_phone` and no `npc_used`.
The existing needs tests pass unchanged (the cooler's `social` need is untouched).

**C4. The feed and the browser.**
Files: `systems/social-feed.js` (new); `api-client.js` (`feedPost`); `core/game.js` (hand
`feedPosts` over on load; install the feed listener on `npc_used` and `npc_used_phone`);
`minigames/osint-browser/osint-browser-minigame.js` (`_socialView`);
`systems/npc-action-icons.js` (`social_media`).
Tests: `social-feed.test.mjs` (new): a met use asks once, a failed one does not; `npc_posted`;
restore on load. `social-osint-browser.test.mjs`: revealed posts are listed first, newest at the
top; clicking one grants its fact once; a profile with no revealed posts renders as today.

**C5. `test_access_social`.** The scenario, its `PLAYTEST.md`, static checks, the two scripted
runs, the watch-it-happen run, the needs regression captures and the whole suite.

## 13. Parallel streams

Inside each sub-slice the work splits into streams that own different files. The names that cross
between streams (route names and answers, adapter methods, events, `getState` fields) are fixed by
this plan, so the streams can start together. Each stream re-reads a shared file just before
editing it, and none commits another's files.

| Sub-slice | Stream | Steps | Files it owns |
|---|---|---|---|
| A | Server | A1 (resolver), A2, A3 | `lib/break_escape/access_work.rb`, `game.rb`, `games_controller.rb`, `config/routes.rb`, `test/models`, `test/controllers`, `test/unit/access_work_test.rb` |
| A | Validator | A1 (schema, field lists), A4 | `scripts/validate_scenario.rb`, `scripts/validate_access_work.rb`, `scripts/scenario-schema.json`, `test/js/validator-access-work.test.mjs` |
| A | Needs core | A5, A6 (the needs half) | `systems/npc-work.js`, `systems/npc-needs.js`, `systems/pc-policy.js` and their tests |
| A | Surfaces and tooling | A6 (the player's plant), A7 | `api-client.js`, `core/game.js`, `systems/interactions.js`, `systems/npc-action-icons.js`, `systems/npc-needs-debug.js`, `systems/test-bridge/index.js`, `tools/playtest/`, `docs/test-bridge.md` |
| A | Scenario | A8, after the four above | `scenarios/test_access_work/` |
| B | Server | B1 | as A's |
| B | Validator and graph | B2 | `scripts/validate_access_work.rb`, `scripts/generate_dungeon_graph.rb`, their tests |
| B | Needs and runner | B3 | `systems/npc-needs.js`, `systems/npc-workarounds.js`, their tests |
| B | Workstation and sessions | B4 | `systems/workstation-state.js`, `systems/pc-sessions.js`, `systems/unlock-system.js`, `api-client.js`, their tests |
| B | Scenario | B5, after the four above | `scenarios/test_access_work/` |
| C | Server | C1 | as A's |
| C | Validator | C2 | `scripts/validate_access_work.rb`, `scripts/validate_npc_needs.rb`, the schema |
| C | Needs core | C3 | `systems/npc-needs.js`, `systems/npc-work.js`, `systems/npc-sight-challenge.js` |
| C | Feed and browser | C4 | `systems/social-feed.js`, `api-client.js`, `core/game.js`, `osint-browser-minigame.js`, `systems/npc-action-icons.js` |
| C | Scenario | C5, after the four above | `scenarios/test_access_social/` |

The validator stream needs the resolver from the server stream; the server stream writes it first
(it is one small file with its own test) and the validator stream starts on the schema meanwhile.

**Against slices 9.1 and 9.3.** If either is being built at the same time, the files all three
touch are `game.rb` (`withhold_npc_secrets!`, `filtered_room_data`, the bootstrap filter),
`scripts/validate_scenario.rb` (the field lists), `scripts/scenario-schema.json`,
`systems/npc-needs.js` and `systems/workstation-state.js`. Build the slices one sub-slice at a
time on those files: this slice's additions are separate methods and separate validator files, so
the order does not matter, but two agents must not hold the same file at once.

## 14. Effects on existing scenarios

No existing scenario declares `resources`, `roles`, `workNeeds`, `workarounds`, `feed`, `usbClass`,
a workstation `downIf` or a `social_media` need, so none changes its behaviour. What each change
touches:

| Change | Who sees it |
|---|---|
| `npc_used` gains `met` (and `missing` on a failure) | Every scenario with needs NPCs: an added field, `true` everywhere today. No mapping reads it |
| The use verdict, the retry wait, the drain, errands | Only an NPC with a `work` plan or a PC with `downIf`: none today |
| New mutter pools | Never chosen without a failed or refused use. A scenario with `"chatter": false` gets no mutters |
| `usb` policy | `test_access_signin` and `test_access_sessions` set `usb: "allowed"`; `lab_physical_pentest` has no policies and its devices have no `usbClass`, so Sofia's finds and the keylogger plant are untouched |
| `social` policy | The same two test scenarios set `"allowed"`; nobody has the need |
| `social_media` need | `test_needs_sims` uses a need called `social` at the cooler; it is a different name and is untouched |
| The browser lists feed posts first | Every scenario with a `social` site (`lab_social_engineering`, the `ca` episodes, two test scenarios): no feed, so the list is as today |
| Room NPCs lose `workNeeds`, `frustration`, `feed` and gain `work`; the bootstrap loses `resources` and `roles` | Nobody authors them yet |
| A workstation used by a non-owner reads as in use | Only where an NPC's work job targets a workstation it does not own. With `private` PCs (`test_needs_sims`) that never happens; in `test_npc_needs` and the lab each PC has one user. The needs regression captures confirm it |
| Four new `player_state` keys | New games get empty ones; older saved games are read as empty |
| `validate_npc_needs.rb` no longer errors on a `social_media` need with no satisfying object | No scenario has one |

`lab_physical_pentest` is not edited by this slice. It teaches physical testing with unmanaged
PCs, and giving its PCs a USB policy would change the lesson it has been playtested on.

## 15. Interfaces with other slices

**What this slice needs changed in the sketch of section 9** (first slice plan):

| Sketch | This plan | Who is affected |
|---|---|---|
| A `social` need | The need is `social_media`; `social` stays the cooler's | 9.1, where it mentions the need |
| `feed` as a list on the NPC, each post with `intel`, shown in a `social_feed` object or phone app | `feed: { site, person, posts }`; a post's fact key is `fact`, as in the browser; posts appear in the existing browser | 9.1 (`password: "guessable"` should count a feed post's `fact` as a source that points at the password) |
| "distinct from `social.landingPages[].profiles[].posts`" | The path is `social.osint.sites[].profiles[].posts` | Wording only |
| `usb: "blocked"` makes `accepts` ignore USB-tagged items | Items carry `usbClass`; the policy has three values; a refused NPC tries the next machine | None |
| `borrow_session` picks another PC | It names one, an unowned sign-in PC, and leaves a guest session there | 9.1 (below), 9.3 (below) |
| `prop_door` until a global or timer closes it | Open for the mission; needs a `prop` object | None |
| `share_login` reveals an intel fact | It records a capture when heard; the password comes from `/capture_secrets` | None |
| Frustration and workarounds in the needs system | The level and the list live on the server; the needs system reports uses | 9.1 and 9.3 should not expect `workarounds` in the browser |
| "the PC's network reaches the resource's network; always true until networks exist" | Kept, as one hook: `reaches(stationId, resource)` in `npc-work.js`'s env, answering true | 9.3 supplies it |

**With 9.1 (awareness and habits).**

- **The sticky note fill.** 9.1's `writesDown` habit and this slice's `writes_down` workaround
  both make the server fill a sign-in PC's `postitNote` from `creds`. One helper in `game.rb`,
  `written_down?(npc)`, answers true for the habit or for a done workaround, and one fill in
  `filtered_room_data` uses it. Whichever slice is built first writes both with its own half of
  the test; the other adds its condition.
- **`locksScreen`.** A guest leaves a borrowed session open unless the habit resolves to `always`
  (6.1). This slice reads the resolved habit through whatever 9.1 exposes on the workstation env;
  until then, always open. 9.1's fill of `lockChance` applies to owned PCs only and never to a
  borrowed one.
- **`roles`.** The top-level `roles.<role>` object is shared: this slice owns `workNeeds`,
  `frustration` and `workarounds`; 9.1 may add `awareness` and `habits`. Whoever builds first adds
  `roles` to the validator's top-level list and the schema with `additionalProperties` left open
  for the other.
- **`awareness`.** This slice's validator reads the authored `awareness` string for one warning
  (a `high` NPC whose post carries a fact). It needs nothing built by 9.1.
- **Withheld keys.** `WITHHELD_NPC_KEYS` already holds 9.1's `awareness` and `habits`; this slice
  adds its three.
- **`holdsDoors`** (9.1) and `prop_door` are independent: one is a gate door behaviour, the other
  unlocks a room.

**With 9.3 (networks).**

- **Reach.** The verdict asks `reaches(stationId, resource)` for each resource. 9.3 replaces the
  default with its network test, including a network's own `downIf`, and its failure reason is
  `unreachable`. The server's "can fail" rule gains "the scenario has networks" in 9.3.
- **`network` on a resource** is accepted by this slice's schema and carried to the browser in the
  NPC's `work` plan, unread. This slice's validator does not resolve it; 9.3 adds the unresolved
  reference error once `networks` exists.
- **`resources` is withheld** from the bootstrap by this slice. If 9.3 lets the player's own reach
  unlock a resource (`requiresReach`), it must ship what the player's side needs itself, as this
  slice ships each NPC's plan.
- **The hot desk** gains its full meaning with networks: a hot desk on a network that reaches the
  resource lets the frustrated person work, and a claimed guest session there is a session on that
  network. Nothing in 6.1 needs changing for it.
- **Outages.** 9.3's "cut a network" is a `downIf` global, the same mechanism as 5.5.

## 16. Decisions for the user

Each has a recommendation; the plan above is written as if every recommendation is taken.

| # | Decision | Options | Recommendation |
|---|---|---|---|
| 1 | Where frustration and workarounds live | (a) On the server, handed over when due. (b) In the browser, with the whole list shipped | **(a).** It keeps "what will this person do under pressure" out of the browser until it happens, as `withhold_npc_secrets!` already intends, and the level survives a reload. The cost is one small request per failed use |
| 2 | The need's name | (a) `social_media`. (b) Keep `social` and rename the cooler's need in the presets and `test_needs_sims` | **(a).** No existing scenario or golden log changes |
| 3 | The USB policy | (a) Three values with `usbClass` (`storage`, `hid`), and a refused NPC takes the stick to the next machine. (b) One `blocked` value that refuses every tagged item, and the NPC gives up | **(a).** It costs one extra field and teaches two real points: storage blocking does not stop a keyboard-type device, and people carry a refused stick to the machine nobody manages |
| 4 | A propped door | (a) Stays open for the mission. (b) Build closable ordinary doors first | **(a).** Doors cannot close today; (b) is a door engine change of its own (backlog) |
| 5 | Account lockout as a cause of failure | (a) Yes, in sub-slice B (beat X6): a member of staff locked out at their own PC cannot work there. (b) No | **(a).** It is the one chain the player starts with nothing but a sign-in screen: lock Jake out, he hot-desks, his session is left open. It teaches that a lockout policy can be turned on its owner. The cost: after a reload the server tells the browser which locked-out usernames belong to real accounts at that PC, which the sign-in screen itself never reveals |
| 6 | Art | (a) Existing art only: `npc-blocked` for a failed use, `npc-social` for social media, `notes_postit1` for the note, `fire_extinguisher1` as the door prop, no phone pose. (b) New 16 px icons (a phone, a frustrated face) and a phone-in-hand pose | **(a) for the build**, then new icons one at a time once the behaviour is approved |
| 7 | A member of staff on their phone is distracted | (a) `los.challengeOnSight` does not fire while the NPC is on the phone (beat F8). (b) No effect | **(a).** A small hook, and a second opening the player can watch for. It affects only an NPC with both a sight challenge and the need, which no scenario has today |
| 8 | Order | A, then B, then C | **As listed.** B and C could swap; B first delivers the chains |
| 9 | First real use | (a) No existing scenario changes in this slice; the first lab or mission to use it is chosen separately. (b) Fold it into `lab_physical_pentest` | **(a).** The lab's lesson is physical and it is mid-playtest |

## 17. Left out, and why

- **Doors that close again** after being propped: needs gate behaviour on ordinary doors.
- **A helpdesk that clears a lockout** (also open from the first slice): with decision 5 a locked-out
  member of staff stays locked out at that PC for the mission, which is what makes them hot-desk.
- **A colleague signing in with a shared login**: `share_login` ends at the player's capture. An
  NPC acting on another NPC's account needs NPC sign-ins as events, which belongs with logs.
- **Logs** of failed uses and workarounds for investigator missions: the events are all emitted
  (`npc_use_failed`, `npc_workaround`, `npc_borrowed_session`, `door_propped`, `usb_refused`,
  `npc_use_refused`, `npc_posted`), ready for a log type later.
- **The player as defender**, setting policy and watching frustration as a cost: the model supports
  it, the mission type is in the backlog.
- **Frustration that fades with time alone**: it falls only when work succeeds, so an outage the
  player leaves in place keeps its effect.
- **Posts on the player's own phone**, and a phone-in-hand pose: see decision 6.
- **Reading the feed over someone's shoulder**, private messages and friend requests: the browser
  shows public posts only.
