# Access model slice 9.2: work, frustration, workarounds, USB policy and social media

Status: **design for review, 2026-11-10.** Nothing here is built. This plan replaces the sketch in
section 9.2 of `ACCESS_MODEL_PLAN.md` (called "the first slice plan" below) and is checked against
the code as it stands on `claude/break-escape-access-design-090sjx`. Where it differs from the
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
5. the NPC's own workstation even though its policy blocks social media: an attempt that fails.

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
| `POST /npc_workaround` (new, locked) | B | `npc_id`, `index`, `heard` | 1. NPC known. 2. `index` is in that NPC's `handed` list. | Add `index` to `done`. `borrow_session`: `guestSessions[pc] = npcId`; answer `{}`. `writes_down`: answer `{ pcId, postitNote, showPostit: true }`. `share_login`: with `heard`, add the NPC to `sharedLogins` and answer `{ capture }` (6.3); without it `{}`, and the index is taken off `done` so it comes round again. `prop_door`: `unlock_room!` and answer `{ roomId, roomData }` from `filtered_room_data`. Check 2 fails: 403 |
| `POST /login` with `claim: "guest"` (changed, locked) | B | `pc_id`, `claim` | 1. PC reachable (first slice). 2. No session is held at the PC. 3. `guestSessions[pcId]` names an NPC. 4. That NPC has an account. 5. The PC's `access` admits it. 6. The PC's policy is not `autoLockMin: 0`. | Success: `sessions[pcId] = { id, via: "claim" }`, add to `signedInPcs`; the answer a claim gives today. Failure: "Sign in required" |
| `POST /feed_post` (new, locked) | C | `npc_id` | 1. NPC known. 2. The NPC has a `feed` with posts and a valid `social_media` need. 3. A post is left. 4. For a second or later post: at least half the need's period since that NPC's last one (the period is `min(100 - urgentAt, restores) / decayPerMin` minutes, the validator's P). | `feedRevealed[npcId] = { n, at }`; answer `{ index, post, site, person }`. Checks 3 or 4 fail: `{ post: null }` |
| `GET /scenario` (changed) | A, B, C | as today | As today. | `filtered_scenario_for_bootstrap` also deletes `resources` and `roles`. The `scenario` action adds `npcFrustration` (per NPC: `level`, `pending`, the handed-over workarounds not yet done, as `run` descriptions, and `done`, likewise) and `feedPosts` (per NPC: `site`, `person` and the posts revealed so far). After answering it clears `guestSessions`, as it ends claimed sessions (`end_claimed_sessions!`, `game.rb:1495`), with the same row lock |
| `GET /room/:id` and the room data of a door unlock (changed) | A, B, C | as today | As today. | Through `filtered_room_data`: each room NPC gains `work` (5.1) and, with a feed, `hasFeed: true`; `workNeeds`, `frustration` and `feed` are deleted beside the keys withheld today; a sign-in PC whose owner's `writes_down` is done gains `postitNote` and `showPostit` |
| `GET /capture_secrets` (changed) | B | as today | As today. | An account holder in `sharedLogins` counts as having a capture route (`account_capture_passwords`, `game.rb:957`) |

No route is added for the USB policy (section 7).

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
