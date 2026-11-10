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
