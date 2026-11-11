# Access model slice 9.2: work, frustration, workarounds, USB policy and social media

Status: **design, 2026-11-10.** Nothing here is built. This plan replaces the sketch in section
9.2 of `ACCESS_MODEL_PLAN.md` (called "the first slice plan" below) and is checked against the code
at commit `0b1a457b8` (the access design branch, which holds the merge of `main`) and against the
sibling plans `ACCESS_MODEL_SLICE_9_1_PLAN.md` (awareness and habits),
`ACCESS_MODEL_SLICE_9_3_PLAN.md` (networks, in two parts: 9.3a, whose server steps are built, and
9.3b, an ordered design) and `PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md` (called "the engine plan"
below). On every shared file the order is **the engine plan's feedback streams first, then 9.3a,
then 9.1, then this slice**; 9.3b comes after 9.3a at a time the user chooses, and is expected
after this slice. Section 15 says what changes if the order differs.

This slice stands on office life (`OFFICE_LIFE_PLAN`, built on `main`): its switched-off objects
(`offWhen`), turn-backs, parked needs and grumbles are how an NPC already fails, waits and
complains, and this plan adds to them rather than beside them (5.1).

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

Facts this plan builds on, each checked against the code at commit `0b1a457b8` (the access design
branch, which holds the merge of `main`, `d9b910ac0`, and slice 9.3a's server steps 2 to 4). Line
numbers are for that commit; the plan names every method it means, so a builder re-finds a line
that has moved.
`npc-needs.js` means `public/break_escape/js/systems/npc-needs.js`; other JavaScript paths are under
`public/break_escape/js/`.

| Fact | Where |
|---|---|
| The needs system is pure logic over a `world` adapter, with no static imports. Needs, levels, jobs and the decision log all live in the browser; the server never sees an NPC move or use anything | `npc-needs.js` (`NPCNeedsSystem` from `:287`, `createEngineWorld` at `:3265`, no `import` line) |
| A use completes in `_completeJob` (`:2151-2211`): it adds the object's `restores` to the need when the object's `affordance.satisfies` lists it (`:2159-2163`), emits `npc_used:<objectId>` (`:2180-2185`) and applies the NPC's `onUse` hook. Nothing judges a use once the NPC has arrived | `npc-needs.js:2151-2211` |
| **A source can be switched off.** `affordance.offWhen` (a global name, or `{ name: value }`) makes an object no candidate while it holds (`_isOff`, `:569-575`; `_useCandidate`, `:1403-1467`, at `:1407`; `_queueCandidate`'s filter, `:3092`). An NPC walking to it or queued for it when it goes off **turns back** with the reason `off` (`_advanceJob`, `:2079-2084`); one already using it finishes (`:2078`) | `npc-needs.js:569-575, 2079-2084` |
| **Turn-backs** share one routine and one table. `_turnBack` (`:1627-1650`) logs `turned_back`, emits `npc_turned_back:<npcId>` with `{ npcId, need, targetId, reason }`, grumbles, aborts the job and, by the `TURN_BACK` table (`:99-105`), tries the next source for the same need and else parks it. Reasons: `avoid`, `off`, `gone`, and for a phone job with no need, `answered` and `rang_out` | `npc-needs.js:99-105, 1627-1650` |
| **A need can be parked.** `_park` (`:1560-1570`) holds the level at `urgentAt + 1` for `needsDeferMin` game minutes (default `NEEDS_DEFER_MIN`, 4, `:51`; `_deferMs`, `:1490-1493`), pausing decay and the unmet clock (`_decay`, `:1242-1267`), so the selector, `_anyUrgent` (`:1337-1342`) and `_pressing` (`:3213-3223`) pass over it. It emits `npc_need_parked:<npcId>` with `{ npcId, need, reason, targetId, untilMs }`. `_unpark` (`:1573-1580`) ends it. `_select` parks a need whose search found nothing acceptable, with the reason from `_giveUpReason` (`:1541-1557`: `avoid`, `queue` or `no_source`), and says nothing: a select-time park has no grumble (`:1384`). `s.parked[name]` holds `reason`, `until`, `since` and `avoidedId`, not the target | `npc-needs.js:1337-1342, 1384, 1490-1580` |
| **`_giveUpReason` can return null, and then nothing parks.** It returns null when every remaining source is outside the leash or is another owner's `private` object (`:1542-1543`), or when one of them is only busy (`:1555`); the NPC then stays urgent and retries on the select back-off, with no park and no event. `private` (`affordance.private: true`) limits a use to the object's owners (`_permitted`, `:1100-1104`; owners from `_owners`, `:1089-1097`) | `npc-needs.js:1089-1104, 1541-1557` |
| **Parked needs wake early.** A door opening or a room loading wakes every parked need, staggered (`_wakeParked`, `:1583-1596`, from `onDoorOpened`, `:541-544`, and `_onRoomsLoaded`, `:990-992`). A global change wakes them only when an object whose `offWhen` reads that global was last seen off and is now on (`onGlobalChanged`, `:551-566`, wired at `:3926-3930`), again through `_wakeParked`, so a switched-on coffee machine wakes every parked need of every NPC. `onGlobalChanged` returns at once when no `offWhen` object has been seen (`:552`). A targeted wake exists for one NPC's named needs (`_wakeParkedFor`, `:1599-1606`, slice 18b-ii). A woken park retries `WAKE_BASE_MS` (1 second) later, plus `WAKE_STEP_MS` (0.5 seconds) per NPC before it (`:53-54`) | `npc-needs.js:53-54, 541-606, 990-992` |
| The selector takes each urgent need in turn and asks `_useCandidate` for a free, permitted, reachable source, preferring the NPC's own `needsHome` object (`:1457-1460`). Every job targets an object, apart from a desk phone job, which targets the phone; a target another NPC's job names counts as claimed (`_claims`, `:1274-1281`; `_free`, `:1290-1310`). An NPC cannot satisfy a need where it stands | `npc-needs.js:1349-1467` |
| **"Errand" is taken.** A print fetch is a carry job flagged `errand` (`_dueErrand`, `:2369-2375`; `_errandCandidate`, `:2381-2394`), shown as `getState().job.errand` | `npc-needs.js:2369-2394, 3239` |
| Needs state is created when an NPC's room loads (`register`, `:372-446`) and `reset()` clears it (`:456`). Nothing about a needs NPC exists before its room is loaded | `npc-needs.js:372-494` |
| A carry job delivers a tagged item to an object whose `affordance.accepts` lists the tag (`_carryCandidate`, `:1813-1829`). Nothing reads a policy | `npc-needs.js:1813-1829` |
| **One NPC can speak alone.** A grumble on a turn-back is a one-off line or picture (`_grumble`, `:1656-1667`, which takes a chosen topic; `_showSaying`, `:1670-1683`, sets `s.saying`), and so is half a desk phone call (slice 19). `_talking` (`:2684-2702`) returns either with `partnerId: null`, `_buildSpeakers` (`:920-939`) lists both, and a line is voiced through the world's `speak` (`_speak`, `:1737-1744`), which `npc-needs-chatter.js` (`say`, `:237`) plays in the NPC's own voice for an NPC with a voice in the player's room. `_pickBark` (`:1721-1734`) gives a line when the pool has one, the NPC is off its chatter cooldown and the speech lock is free, and otherwise the topic's picture. `_grumbleTopic` (`:1686-1692`) chooses `grumble_<reason>` when that pool has lines, else `grumble`. `_turnBack` picks the topic before it grumbles and logs it as `grumble:` (`:1635-1639`). `_grumble` takes no options and calls `_pickBark` without `ignoreCooldown` (`:1656-1667`); for any reason but `avoid` its picture is the need's own icon when the need is in `NEED_ICONS` (`:91`, `:1663`), otherwise the topic's entry in `PICTURE_CHATTER` (`:70-87`) or the default `social` (`:88`) | `npc-needs.js:70-91, 920-939, 1627-1744, 2684-2702`, `systems/npc-needs-chatter.js` |
| **Office life ships no spoken text.** "The engine has no spoken text of its own" (`npc-needs.js:61-64`): every line lives in a scenario file. `chatterPool(topic, scenarioChatter, npcChatter)` returns the scenario's pool of that name **plus** the NPC's own (`:187-197`); nothing replaces a pool. With neither, a topic is picture chat only, and under `"chatter": false` it is silent. The validator holds every pool line to 40 characters, one line and no `{ }` (`validate_npc_needs.rb:664-692`) | `npc-needs.js:61-64, 182-197`; `scripts/validate_npc_needs.rb:664-692` |
| **Icons that exist** for picture chat and the action slot: `caffeine`, `thirst`, `hunger`, `rest`, `social`, `work`, `curiosity`, `post`, `printout`, `print`, `queue`, `file`, `blocked`, `noticed`, `avoid`, `closed`, and the desk phone | `systems/npc-action-icons.js:53-59` |
| **A sign-in PC never takes an office preset.** `presetIdFor` skips any object with a `lockType` (`office-presets.js:52`), and the validator does the same (`validate_npc_needs.rb:607`). The `desk_pc` preset (`satisfies: "work"`, `restores` 60, `useSeconds` 10, non-private) applies only to a plain PC with no `lockType` (`data/office-presets.json:4`). So a sign-in PC satisfies `work` only through an authored `affordance` | as listed |
| **The adapter does not say which objects are workstations.** `describe` (`npc-needs.js:3297-3316`) gives `id`, `roomId`, position, `affordance`, `needsTag`, `screenOwner` and a few slot and phone fields, never `lockType`, `workstation`, `lockChance` or `locksScreenOnLeave`. The workstation rule is `isWorkstation` (`workstation-state.js:89-93`: `workstation: true`, a `locksScreenOnLeave`, a `lockChance`, or `lockType: "login"`) | as listed |
| **An owner with no screen habit locks.** `decideLocked` (`workstation-state.js:119-139`): with no `lockChance` or `locksScreenOnLeave` on the object and no `screenHabit` on the owner, the screen locks (`:129`); a habit with no numeric `lockChance` locks too (`:134`). Leaving a screen open is always authored | `workstation-state.js:119-139` |
| **The test bridge can run the needs clock by hand.** `window.__test.needs.setManualClock(true)` and `step(ms)` move the needs clock without real time passing | `systems/test-bridge/index.js:1706-1720` |
| The need name `social` is already in use: the water cooler preset satisfies `["thirst", "social"]`, and `test_needs_sims` gives two NPCs a `social` need. It means talking to colleagues | `data/office-presets.json:7`, `scenarios/test_needs_sims/scenario.json.erb:599, 799` |
| Policies exist with four fields. `autoLockMin` and `maxAttempts` are read (client `policyFor`, `workstation-state.js:485-490`; server `effective_policy`, `game.rb:1400`). `usb` and `social` are accepted by the schema (`scripts/scenario-schema.json:194-195`, each `allowed` or `blocked`) and read by nothing. A PC with no `policy` takes `defaultPolicy` | as listed |
| `withhold_npc_secrets!` already deletes `creds`, `awareness`, `habits`, `role` and `workarounds` from every room NPC (`WITHHELD_NPC_KEYS`, `game.rb:4048`). `needs`, `interests`, `needsHome`, `needsDeferMin`, `usePayload` (minus its secret) and every other NPC field ship | `game.rb:4048-4068` |
| The bootstrap ships every top-level key as authored except `flags`, `accountProfiles` and, from 9.3a, `networks`, `networkLinks` and `resources` (`withhold_network_keys!`); rooms are cut to an allow list. The whole `social` block ships with only capture secrets stripped (`:903`), so every `social.intelFacts` entry, with its text, is in the browser from the first request | `filtered_scenario_for_bootstrap`, `game.rb:827-906` |
| A sign-in PC is a workstation. A click first asks whether the owner is present ("<name> is using this PC"), then opens the desktop of a session held there, and only then asks the workstation layer (`interactLoginPc`, `unlock-system.js:205-240`, at `:212` and `:225`). An unowned one answers `signin` to every click; a claim needs an owner, on the client (`onInteract`, `workstation-state.js:428-447`) and on the server (`claim_login_session!`, `game.rb:1489-1520`), and is refused while a session is held (`:1505`), through a foothold, or at a headless host. `workstation_owner_returned` ends only a claimed session (`pc-sessions.js:249-254`) | as listed |
| `GET /login_accounts` checks that the PC exists, is reachable and is not headless, and returns the account tiles | `games_controller.rb:1142-1153` |
| `/capture_secrets` serves an account holder's password only when that NPC has a capture route (a `usePayload`, or an `eventMappings[].addCapture`), against `se_captures`, a global the browser writes | `game.rb:915-984` |
| A door unlock unlocks the room, composes its room data and records its NPCs as encountered (`track_npc_encounters`) before it answers | `games_controller.rb:936-947` |
| The server sets a task's declared `setGlobal` into `player_state.globalVariables` itself | `apply_task_set_globals!`, `game.rb:3831-3855` |
| `player_state.currentRoom` is **not** a usable record of where the player is. The server accepts a reported room only if it is the start room or unlocked (`games_controller.rb:1661-1665`), but the browser always reports `window.currentRoom?.name` (`state-sync.js:198`), and `window.currentRoom` is set once, to `null` (`main.js:58`), and never again. The live room is `window.currentPlayerRoom` (`core/rooms.js:3165`). So the server's value stays the start room it was given (`game.rb:4174`). This plan never reads it | as listed |
| A state sync runs every 30 seconds (`state-sync.js:144`) and on demand through `window.stateSync.sync()` (`state-sync.js:411`) | as listed |
| `Game#room_unlocked?(room_id)` is "in `unlockedRooms` or the start room"; a room counts as open to the player when it is never locked or `room_unlocked?` holds, as `login_pc_reachable?` tests | `game.rb:117-119, 1287` |
| The needs adapter already answers whether a global holds: `world.globalHolds(cond)`, the `requiredGlobalsHold` rule (a name is truthy; `{ name: value }` matches every value) | `npc-needs.js:200-207, 3604` |
| `npc-needs.js` imports nothing; `interactions.js` imports the engine (`core/rooms.js`, `unlock-system.js` and others), so node tests cannot load it | `npc-needs.js` (no `import` line), `interactions.js:1-30` |
| A `requiresItem` check takes the first held item that matches (`find`) | `interactions.js:955-958` |
| Action conditions are tested one action at a time, in order, so "set true if false, then set false if true" flips twice. Two `confirm_action`s with opposite conditions are the safe toggle: both conditions are read at the click (the lab's carried vest, `26ce54f4c`) | `apply-actions.js`, `test/js/apply-actions-hint-give.test.mjs:171-209` |
| `npc_used` for a carry is asserted whole, with `deepEqual` | `test/js/npc-needs.test.mjs:130` |
| `Game.acl_admits?` answers false for a missing list | `game.rb:1181-1182` |
| A capture route today is a `usePayload` or an `eventMappings[].addCapture` (`Game.capture_route?`); `account_capture_passwords` serves an account holder's password against `se_captures` | `game.rb:965-984` |
| `window.unlockDoor(doorSprite, roomData)` opens a door, `NPCGameBridge` finds every door sprite to a room (`npc-game-bridge.js:77-133`), and an opened door never closes again | as listed |
| `isAvailable(npcId)` (`:957-961`) is the one presence test: the NPC's sprite exists and it is not knocked out, hostile or hidden. `_tickNpc` blocks on it (`:1137`), and the workstation layer's presence test uses it | `npc-needs.js:957-961`, `workstation-state.js:478-482` (`ownerPresent`) |
| The adapter runs the workstation auto lock after every tick (`world.afterTick`, `:902-905`), and `onTick(fn)` (`:945-950`) runs a listener at the end of every tick | `npc-needs.js:895-917, 945-950` |
| The social media browser is the `osint-browser` minigame. Its data is `social.osint.sites[]`; a site of `type: "social"` has `profiles[]`, each `{ person, name, showIf, posts, blocks }`. A post is a block: with an `id` it is a button, and clicking it grants the post's `fact` through `grantFact`, which refuses an id that `social.intelFacts` does not hold, writes `se_intel_<id>` and adds an evidence note with the fact's text | `minigames/osint-browser/osint-model.js`, `osint-browser-minigame.js` (`_socialView`), `systems/social-intel.js` (`grantFact`) |
| The browser is opened from an object of type `osint-workstation`, limited to `minigameData.siteIds` and started at `minigameData.start` | `systems/minigame-starters.js` |
| A `requiresItem` object fires its actions when the player holds the named item, with `consumesItem` removing it. A sign-in PC returns before this code runs. A plant can also remove the item with a `remove_item` action inside its actions and no `consumesItem` (the lab's drop box) | `systems/interactions.js:925-933, 946-990`; `apply-actions.js` (`remove_item`) |
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
- "`work` is not restored and frustration rises" needs three things: a use that can fail, a wait
  before the NPC tries again (without one the NPC would start the same use again on the next tick,
  for ever), and something for the NPC to do meanwhile. Office life already has the second and the
  third: a parked need waits `needsDeferMin` and the NPC's other needs carry on, and a switched-off
  object (`offWhen`) is already a failure the NPC reacts to. What it lacks is a use judged at its
  end, for a failure that belongs to the person and not to a thing (no access, a share that is
  down). This plan adds only that, as one more turn-back reason.
- "An errand" is already a word in the needs system (a print fetch). This plan's walks with no
  need are called **visits**.
- "The NPC's own phone, used where they stand" needs a job with no target object.
- `borrow_session` "picks another PC they may sign in to": the choice has to be authored (a named
  PC), because the claim the player then makes must be one the server can find in the scenario.
- `prop_door` "until a global or timer closes it": an opened door cannot close (only gate doors
  toggle), so a propped door stays open for the mission.
- Workarounds run in the browser, where the needs system is, yet `workarounds` is withheld. So the
  server has to hold the frustration level and hand each workaround over when it is due.
- A resource failing for everybody does not make working at another PC help. This plan uses a
  failure that belongs to one PC (office life's `affordance.offWhen` on the PC, and a lockout of its
  owner), which is what gives the hot desk workaround a point.
- `writes_down` "turns on `writesDown`": slice 9.1 serves a written-down password only from
  `GET /login_accounts`, never in room data. This plan uses that channel.
- "The PC's network reaches the resource's network": slice 9.3 never sends networks to the
  browser, so reach for an NPC's work is composed on the server.

**Faults found in the engine while checking this plan.** Outside this slice; logged for the user,
not repaired here.

1. **The state sync never reports the player's room.** `state-sync.js:198` reads
   `window.currentRoom`, which is always `null` (`main.js:58`); the live value is
   `window.currentPlayerRoom` (`core/rooms.js:3165`). So `player_state.currentRoom` is the start
   room for the whole game, and the server's "Cannot enter locked room" check
   (`games_controller.rb:1661-1665`) never runs. Repairing it switches that refusal on for every
   mission, which is an engine change with its own risk and its own regression runs, so it is not
   done inside this slice, and nothing here depends on it (6.5).

## 3. Sub-slices

Six sub-slices, in this order. Each ends playable and tested and has its own steps in section 12.

| Sub-slice | Contents | Feature scenario beats |
|---|---|---|
| **U. The USB policy** (first) | The `usb` policy field, `usbClass` on items, a refused NPC and a refused plant. No route, no saved state, no frustration | `test_access_work` U1 to U3 |
| **A. Work, outages and frustration** | Resources, work needs by role, the use verdict and the `failed` turn-back on office life's park, a switched-off station counted as a failure, the check visit, the outage kick, frustration held on the server and shown on the NPC | W1 to W7 |
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
                 "frustration": { "perFail": 25, "easePerSuccess": 10, "breakDrain": 10 } }
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
  "needsDeferMin": 1,                          // office life's: how long a failed need stays parked
  "screenHabit": { "lockChance": 0 },          // office life's: leaves a screen open, a borrowed one too (6.4)
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
  "lockChance": 1,                             // his own PC locks; the object wins over his habit
  "affordance": { "satisfies": "work", "useSeconds": 10,   // a sign-in PC takes no preset (section 2)
                  "offWhen": "jake_pc_unplugged" } }        // office life's field: out of order while true
{ "id": "kit_usb", "type": "usb", "needsTag": "dev_usb", "droppable": true,
  "usbClass": "storage" }                      // "storage" | "hid"
```

| Field | On | Sub-slice | Meaning |
|---|---|---|---|
| `resources.<id>` | top level | A | `name` (a display name: 9.3a shows it in the network view; this slice never sends it to the browser), `kind` (a free label; it picks the mutter pool, 5.5), `access` (an access list as in the first slice; absent: everyone), `downIf` (a global name; the resource is down while it is truthy), `object` (a room object the resource is tied to). Slice 9.3 owns `network`, `host`, `contents` and `observations` on the same entries; this slice reads `network` on the server only, through 9.3's `NetworkModel`, and requires none of them |
| `roles.<role>` | top level | A, B | Defaults for NPCs with that role. This slice owns `workNeeds` (A), `frustration` (A) and `workarounds` (B). Slice 9.1 owns `awareness` beside them. Never a grant: rights stay in access lists |
| `workNeeds` | room NPC | A | A list of resource ids. `"x"` or `"+x"` adds, `"-x"` removes, applied to the union of the NPC's roles' lists (roles in authored order, `staff` last) |
| `frustration` | room NPC, role | A | `perFail` (default 25, 1 to 100), `easePerSuccess` (default 10, 0 to 100), `breakDrain` (default 10, 0 to 50, points taken off every other need on a failure). How long a failed need waits is not here: it is the park, office life's `needsDeferMin` on the NPC (default 4 game minutes, 0.1 to 120; a game minute is 60 seconds of the needs clock) |
| `workarounds` | room NPC, role | B, H | A list of `{ at, do, ... }` (section 6). The NPC's own list replaces the role's; it is not merged. Any entry may carry `setGlobal`, a declared global the server sets true when the workaround is done, and `noWarning: true`, which says the author means it to come on the first failure (it silences one validator warning, section 10) |
| `affordance.offWhen` | workstation object | A (office life's field, read here) | The PC is out of order while the global holds: no source for `work` or `social_media`, as for any switched-off object (section 2). This slice adds no field of its own for a broken PC. A sign-in PC never takes an office preset, so one that an NPC works at authors `affordance.satisfies: "work"` itself (and a `useSeconds`) |
| `screenHabit` | room NPC | H (office life's field, read here) | How the person leaves a screen. For a guest at a borrowed PC it is the whole answer: a borrower leaves the hot desk signed in only when its habit says so, `{ "lockChance": 0 }` (or 9.1's `locksScreen: "never"`, which fills the same). No habit means a careful guest (6.4) |
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

### 5.1 Two kinds of failure

Office life already has one kind of failure, and this slice builds on it rather than beside it. A
failure belongs either to a **thing** or to the **person**.

- **A thing that is off.** A workstation that is out of order, a dead printer or a coffee machine
  with no power is an object with office life's `affordance.offWhen` (section 2). The needs system
  already treats it as no source, turns back an NPC walking to it (reason `off`), grumbles, tries
  the next source and else parks the need, and wakes the need when the object comes back on. For
  the needs this slice judges (5.2) it adds three things: the NPC's sources for that need are its
  own station and no other desk (5.2, "Where a judged need is met"), so a dead station cannot be
  quietly replaced by a colleague's PC; a judged need whose own station
  is off always parks, with the reason `off` (today it would say `no_source`, or not park at all,
  section 2); and such a park counts as a failure for frustration (5.4) and says a line (5.5). A
  use already under way when the station goes off finishes, as office life rules (`:2078`), and
  is judged on its resources; the outage kick (5.6), applied as that use ends, then brings the
  `off` park at the next selection.
- **A failure that belongs to the person.** The NPC reaches a working PC and sits down, but their
  work needs something that is not there: a file share they are not admitted to, a share that is
  down, one their PC cannot reach, or (sub-slice L) an account locked out at that PC. No object is
  off, so nothing in office life sees it. This is judged when the use ends (the **use verdict**,
  below), and a failed verdict ends the job as a turn-back with one new reason, `failed` (5.2).

So the wait before retrying is always office life's park, the line is always a grumble, and the
event is always `npc_turned_back` or `npc_need_parked`. The one thing this slice adds to the
needs core is the verdict.

### 5.2 The use verdict, and a failed use

**Judged** has one meaning throughout this plan: a use for the need `work` (the need name the
office presets already give desk PCs) by an NPC that has a `work` plan, or a use for the need
`social_media` (section 8) by any NPC. An NPC has a `work` plan when it has a `work` need in its
`needs` block **and** its resolved work list is not empty; `compile_npc_plan!` (section 9.2) omits
`work` from every other NPC, so that NPC's `work` uses (if any) are not judged and behave exactly as
today. (Most staff get a list from a role default such as `roles.staff.workNeeds: ["email"]`, which
reaches every NPC with that role; only those with a `work` need get a plan. An account holder with
no needs, such as a desk's absent owner, has no plan, no `metAt` and no validator warning about
work. An author who wants an NPC's dead PC or lockout to count gives it a `work` need and at least
one resource.) No other need, and no other NPC's `work`, is judged. Every rule and warning in this
plan that names "an NPC with a `work` plan" means this. When a
judged use completes, every failure is collected (for `work`):

1. **The station.** Sub-slice L's `locked_out` (6.6). A station that is out of order is not
   judged here: one that was off was never chosen, and one switched off during the use finishes
   it (office life's rule), after which the outage kick (5.6) brings the `off` park (below).
2. **Each resource in the NPC's resolved work list**, in order:
   - its `access` does not admit the NPC: `no_access` (fixed for the whole mission);
   - its `downIf` global is truthy: `down`;
   - the station cannot reach it: `unreachable` (below).

No failures: the use is **met** and everything happens as today. An NPC with no `work` need or no
resolved resources has no plan and is never judged, so every existing scenario behaves as it does
now.

The verdict is a pure function in a new module, `public/break_escape/js/systems/npc-work.js`
(`useVerdict(plan, need, station, globals)`, no imports, so node tests load it directly).
`NPCNeedsSystem` reaches it through the world adapter: `world.useVerdict?.(npcId, need, obj)`. A
world without the method (every existing node test) treats each use as met, and the decision log
for a scenario without these fields stays byte for byte the same.

**The NPC's plan.** The client cannot work the verdict out from the scenario, because `role`,
`workNeeds`, `roles` and `resources` do not reach it (section 9.2). The server resolves each room NPC's
plan and attaches it to the NPC in room data as `work`:

```jsonc
"work": { "breakDrain": 10,
          "needs": [ { "id": "finance_share", "kind": "file_share",
                       "admitted": true, "downIf": "finance_share_down", "routes": [ [] ] },
                     { "id": "printer_2f", "kind": "printer",
                       "admitted": true, "downIf": "printer_jammed", "object": "office_printer" } ] }
```

It holds the server's answer to "is this person admitted", not the role or the access list, and it
holds **ids, kinds and global names, never a display name**. That keeps it inside slice 9.3a's
rule (its section 6): ids and global names are not secret, display names are. Nothing in the
browser needs a name: `missing` carries ids, grumble pools are chosen by `kind` (5.5), the icon is
`blocked`, and the debug overlay prints ids. The home station's `offWhen` is not in the plan: the
station object ships with it, and the outage kick (5.6) reads it there. NPC records are built with
`Object.assign` (`npc-manager.js` `registerNPC`), so `work` arrives on the record the adapter reads.

**Admitted.** The server decides with 9.3a's `resource_acl_admits?(resource, npc)` (9.3's 4.5), in
which a missing list admits everyone. `Game.acl_admits?` is not used: it answers false for a
missing list (`game.rb:1181-1182`).

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
server sends no `routes` and every resource is reachable. A use at a borrowed PC is judged with the
routes that arrive with the borrow (6.4).

**Where a judged need is met.** For a judged need the candidates are exactly:

1. a PC borrowed for that need, while `s.borrow` is set (6.4);
2. the NPC's own `needsHome` object (its **own station**: throughout this plan "own" means the
   object the NPC's `needsHome` names, and only that. A PC an NPC owns through `screenOwner` while
   its `needsHome` is a coordinate or another object is a desk like any other here, so the
   validator warns about such an NPC, section 10, and the author makes that PC its `needsHome`);
3. any object that satisfies the need and is **not a desk**. A desk is an object that is a
   workstation by `isWorkstation`'s rule (`workstation-state.js:89-93`: `workstation: true`, a
   `locksScreenOnLeave`, a `lockChance`, or `lockType: "login"`), or one whose office preset is
   `desk_pc` (`presetIdFor`, `office-presets.js:49-58`: a plain `pc`, `pc3`, `pc10`, `laptop` or
   `workstation` in a scenario with `"officePresets": true`). So a break room tablet or a kiosk
   object with an authored `affordance` is a source; a colleague's PC is not.

Every other desk, plain or sign-in, owned or not, private or not, is filtered out in the candidate
list itself, beside `_isOff` in `_useCandidate`'s filter (`npc-needs.js:1407`) and in
`_queueCandidate`'s (`:3092`), not through `_permitted`. So it never reaches `_giveUpReason`, and a
colleague's `private` desk or a busy plain PC can neither silence a failure nor absorb it. For the
filter the adapter's `describe` (`:3297-3316`) gains `desk: true`, computed in `createEngineWorld`
from the object's scenario data with the `isWorkstation` rule (copied into `npc-needs.js`, as
`requiredGlobalsHold` is, because the file imports nothing) and `window.officePresets.presetIdFor`
(the module `core/game.js:1977-1978` installs, which `affordanceOf` already reads, `:3277-3282`).
With presets off, a plain PC that satisfies `work` through its own authored affordance is a desk
only when it is a workstation by its fields, so an author who means it as somebody's desk sets
`"workstation": true` on it. A stub world that never sets `desk` keeps today's choices. An NPC
whose uses are not judged (every NPC today, in `test_access_sessions`, `test_access_signin` and the
lab among them) chooses as it does now. Without the filter an NPC whose own PC is off would walk
to the nearest PC with a `work` affordance (a colleague's desk, or the hot desk with no sign-in and
no session), which is neither the workaround nor what a person does.

**A dead station always parks.** `_giveUpReason` (`npc-needs.js:1541-1557`) gains one rule, placed
before both of its null returns (`:1543`, every remaining source outside the leash or another
owner's `private` object; `:1555`, one of them busy): for a judged need whose own `needsHome`
object satisfies the need and is off, it returns `{ reason: "off", targetId: <that object's id> }`.
The rule reads the station's id from the NPC record's `needsHome` string and the object through
`world.getObject`, never from `s.home`, which is provisional for a start-room NPC until its room's
objects are registered (`_updateHome`, `:2450-2458`). For `social_media` the rule applies only to an
NPC with `"phone": false`: one with a phone uses it instead (8.1). So whatever else is in the room or in reach, an NPC whose own station is dead parks at once with
the reason `off`, and that park is counted (below). When a non-workstation source is free and
reachable the NPC uses it instead and `_giveUpReason` is never reached: the NPC worked elsewhere,
which is no failure.

**A met use.** `npc_used` gains `met: true` only for a judged use (`work` and `social_media`). A
carry, a coffee or any other use keeps today's payload exactly, so the whole-payload assertion in
`test/js/npc-needs.test.mjs:130` holds unchanged. A met judged use restores as today and, when the
NPC's frustration is above 0, is reported as an ease. A met coffee or cooler use is not judged and
eases nothing.

**A failed use is a turn-back.** `_completeJob` (`npc-needs.js:2151-2211`) asks for the verdict
before it restores anything (`:2158-2164`). When the use is not met:

- The need is **not restored**, `lastSatisfiedAt` does not move, and no `npc_used` fires (nothing
  was used), so no payoff mapped to it can run. `onUse` hooks do not apply.
- `npc_use_failed:<npcId>` fires with `{ npcId, objectId, need, missing, station }`, where
  `missing` is a list of `{ id, why }` (a station failure is `{ id: <objectId>, why: "locked_out" }`)
  and `station` is true when a station failure is among them.
- The job ends through `_turnBack(s, 'failed')`. `TURN_BACK` (`:99-105`) gains one row,
  `failed: { mindChanged: false, grumble: true, fallback: false, parks: true }`, and `_turnBack`
  (`:1627-1650`) gains one rule: a reason that parks and has no fallback parks the need itself
  (today `parks` only reaches `_park` through the fallback's `_select`). So the NPC logs
  `turned_back`, emits `npc_turned_back:<npcId>` with `reason: "failed"` and `missing`, says one
  line (5.5), goes home through `_goHome`, and the need parks for `needsDeferMin`. At its own desk
  the NPC stays where it is: `_goHome` within `HOME_EPS` only queues an arrival (`:2487-2489`), and
  `npc_returned_post` fires only for an NPC that had left its post (`:1192-1197`), so no walk and no
  false return happen. At a borrowed PC it walks back. The builder first proves that `_abortJob` (`:2425-2442`) from the `using` phase frees the station and
  leaves the NPC standing, as it does for an NPC knocked out mid-use.
- The park records `wakeOn`, the globals that made it fail (each failing resource's `downIf` and
  the truthy route globals), and `missing`. A failure that includes any cause with no global
  (`no_access`, `locked_out`, or an `unreachable` whose routes carry no global, which with 9.3a is
  every `unreachable`, since its routes are only `[]` or `[[]]`) has an empty `wakeOn`: it cannot
  clear while that cause holds, so it waits out its park. How a `wakeOn` wakes is below.
- Every other need of that NPC loses `breakDrain` points (not below 0). A person who cannot work
  goes for coffee sooner, so an outage empties desks through the needs the NPC already has. A
  counted `off` park (the NPC's own station dead) drains the same way, for the same reason.
- The use is reported to the server (5.4).
- A **check visit** is queued (5.3) for the first failure that is a resource which is `down` and
  has an `object`, once per outage: the needs state remembers the resource as checked until that
  need is next met, so the NPC walks to the printer once, not every few minutes.

**What wakes a failure's park, and what does not.** A park with the reason `off` or `failed` on a
judged need (a **failure park**) wakes only when its own cause clears, or when its time is up. A
door does not mend a share or a PC, and neither does someone else's coffee machine coming back on.
`_park` stores `targetId`, `wakeOn` and `missing` on `s.parked[name]` beside its present fields, and
the wakes are:

- **`_wakeParked()` skips failure parks and holds.** All three of its callers (a door opening,
  `:541-544`; a room loading, `:990-992`; an `offWhen` object switched back on, `:561-565`) wake
  every other park exactly as today, and none of them wakes a failure park or a reload's `held`
  park (5.4, "Reload"). Its loop simply passes over a parked need whose reason is `off`, `failed` or
  `held` on a judged need.
- **A targeted wake for a resource.** `onGlobalChanged(name)` (`:551-566`) gains a first clause,
  placed **before** the early return at `:552` (which returns when no `offWhen` object has been
  seen, as in a scenario whose only outages are resource `downIf`s): for each NPC, each `failed`
  park whose `wakeOn` names `name` and whose recorded causes would all pass now is woken, on the
  pattern of `_wakeParkedFor` (`:1599-1606`): `until` brought forward to `WAKE_BASE_MS` from now,
  `woken` set. "Would pass" is tested on the plan, cause by cause: a `down` resource's `downIf`
  no longer holds (`_globalHolds`), and an `unreachable` resource is `reachable(need, globals)`
  (`npc-work.js`), so a need with routes `[[a], [b]]` wakes when either route clears, not only when
  every global it ever named is off.
- **A targeted wake for a station.** In the existing switched-on clause, the ids of the objects
  that were off and are now on are collected; each `off` failure park whose `targetId` is one of
  them is woken the same way, with one difference: its retry comes one use time of that station
  after the switch-on (its `affordance.useSeconds`, never less than `WAKE_BASE_MS`), the PC starting
  up again. The general `_wakeParked()` call after it stays, for every other park.
- A woken failure park records `rearmed: true` on the need (5.4), so the next fail report says the
  cause cleared in between.

So an honest NPC never fails again within its park unless its cause cleared and came back, or a
met use came between, and a fail after a cleared cause or a met use always comes at least one use
time after the last fail (a woken `failed` park retries and then uses the station for a full use
before the verdict; a woken `off` park waits a use time first; a met use takes a use time, and a
station switched off during it parks `off` only as it ends). The server's pace floor rests on
these facts (9.1). Every park that
is not a failure park wakes as today.

**One failure, one count.** A failure counts once, as one park: a `failed` turn-back parks
directly; an `off` park (the NPC's own station off) is one count; an `off` turn-back that finds
another source on the fallback is no failure at all (the NPC worked elsewhere). So the client
counts a failure on `npc_need_parked:<npcId>` for a judged need with the reason `off` or `failed`,
and on nothing else. The park event gains `missing` for `failed`, and for `off` it carries the
station as `targetId`.

**Where the `off` park says its line.** A select-time park says nothing today (`_select`,
`:1384`). For a counted `off` park, `_select` calls `_grumble` right after `_park`, with the topic
from `_grumbleTopic` (5.5) and the station as the object, unless this need is the one a turn-back's
fallback is selecting for (`exclude?.need === name`): an `off` turn-back for that need has already
grumbled in `_turnBack` (`:1635-1639`), and one line per failure is the rule. A fallback select for
another need (a turn-back from the coffee machine that also evaluates an urgent `work` and parks it
`off`) still says the `off` park's line, since `_select` evaluates every need in that one call
(`:1356-1384`) and that failure has had no line. The decision log's `parked`
entry gains `grumble:` with the topic, as `turned_back` has it.

### 5.3 Visits

A visit is a walk the needs system is told to make instead of choosing it: go to a named place,
stay a few seconds, come back. Two things queue them: the check visit above, and a workaround
handed over by the server (section 6). It is not office life's print errand (section 2), which is
a carry job the selector chooses; the two share no state, and a visit job is flagged `visit`, not
`errand`.

- `NPCNeedsSystem.enqueueVisit(npcId, { kind, at, useSeconds, data })` appends to `s.visits`.
  `at` is `{ objectId }` or `{ npcId }`. In `_tickNpc` (`npc-needs.js:1128-1240`), an idle or
  returning NPC with a visit whose place exists and is reachable starts it before the selector runs. A running job is
  never interrupted.
- The job uses the machinery every use job has: the wind-up, `npc_left_post` (so the workstation
  layer rolls the screen as for any leave), the walk, the dwell (`visit.useSeconds`, else 8), the
  walk back and `npc_returned_post`. A visit at the NPC's own `needsHome` object is an at-post
  job and never leaves the desk.
- A visit to an object stands at its approach cell; the object needs no `affordance`
  (`world.getObject` describes any object and `approachCell` falls back to the nearest walkable
  cell, `npc-needs.js:3467-3488`). A visit to an NPC stands in a free cell beside where that NPC
  is when the visit starts (a new adapter method, `cellBeside(npcId)`, on the pattern of
  `besideCell`, `:3606`).
- **A visit claims nothing.** `_claims` (`:1274-1281`) and the workstation layer's "who is using this"
  (6.4) both skip visit jobs, so a colleague standing at a desk to talk, or a person looking at
  the printer, never blocks or counts as its user.
- A visit honours the room leash and ignores `private`, as a delivery does.
- On completion a visit restores nothing, applies no `onUse` hook and does **not** emit
  `npc_used`. It emits `npc_visit_done:<npcId>` with `{ npcId, kind, at, data }` and logs
  `visit_done`. A check visit also emits `npc_checked:<objectId>`.
- A place that is not loaded or not reachable is retried once a second. A check visit is dropped
  after 60 seconds of the needs clock. A workaround visit is dropped after 120, so it cannot block
  the queue; the needs system then emits `npc_visit_dropped:<npcId>` with `{ npcId, kind, at,
  data }`, which the workaround runner hears and reports as dropped (section 6). A dropped check
  visit emits it too; nothing listens for a check's, and a scenario may map it.
- A visit that starts and then ends without arriving (its walk deadline, a turn-back, any abort
  but a `reset()`) is dropped the same way, with a `reason` added to the payload, so the runner
  always hears `npc_visit_done` or `npc_visit_dropped`. A dropped check visit frees its resource,
  so the next failure in the same outage queues the check again (review R2 m5).
- `reset()` clears the queue. After a reload the server sends undone workarounds again (section 9.4).

### 5.4 Frustration lives on the server

Frustration is one number per NPC, 0 to 100, kept in `player_state.npcFrustration` (section 9.4). The
browser reports and mirrors; the server decides. This is what lets `workarounds` stay withheld
until each one is due, and it makes the level survive a reload without any client state.

- **Reporting.** On each counted failure (5.2: a park of a judged need with the reason `off` or
  `failed`) the adapter calls `world.reportUse(npcId, { event: "fail", need, objectId, missing })`,
  where an `off` park reports `missing: [{ id: <stationId>, why: "off" }]`, and after a met judged
  use with frustration above 0, `{ event: "ease", need, objectId }`. A fail report carries
  `rearmed: true` when, since that NPC's last counted failure of that need, its park was woken by
  its own cause clearing (5.2) or a met use of the need came in between; the needs state keeps the
  mark per need (`s.rearm[need]`) and clears it when the next fail is reported. It tells the
  server that this failure belongs to a new outage, not the old one (the floor in 9.1); the server
  honours it only where no cause it owns holds for that NPC and need. Every report also carries
  `objectId`, the object the use was at (the station for an `off` park; null for a phone use), and
  every cause in `missing` names one of that NPC's own resources or stations; the server refuses
  a report that names anything else (9.1, "Belongs to the NPC"). A small client module, `systems/npc-reports.js` (new),
  queues reports and sends them together, at most one `POST /npc_frustration` every two seconds,
  at most 20 reports in one request (section 9.1). A failed use at a borrowed PC is not reported:
  it is the same episode as the failure that sent the NPC there (6.4).
- **Keeping the server's copy current.** When a global named anywhere in a loaded NPC's `work`
  plan (a `downIf`, a route global) or in its home station's `offWhen` changes, `npc-reports.js`
  awaits one `window.stateSync.sync()` (`state-sync.js:411`) before it sends its next batch. Globals
  otherwise reach the server only every 30 seconds (`state-sync.js:144`), so without this the first report
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
  (`core/game.js:1677`). No needs state exists at that point, so the system keeps the map and
  applies each NPC's entry in `register`, when the NPC's room loads: the level, the global (written
  only when the saved one differs), `tell`, with no `npc_frustration_changed` event, since a reload
  is no rise or fall (review R2 m1), and (from sub-slice B) the pending workarounds, emitted as `npc_workaround_due:<npcId>`. Each
  entry also carries `hold`, per need, the seconds of server time until a fail with no `rearmed`
  mark would clear that need's floor (9.1), computed by the server when it answers. `register`
  parks each such need for that long with the reason `held` (uncounted, silent, no report, no
  drain); `_wakeParked` passes over it (5.2) and the outage kick skips it (5.6), so the first fail
  after a reload comes only once the server would accept it. The hold is measured from the
  response and applied at the later `register`, so it can only end later in server time, never
  sooner.
- **Determinism.** In sub-slice A nothing in the needs decision depends on an answer (the park,
  the drain and the outage kick of 5.6 are applied at once, from the plan and the globals),
  so the decision log stays a function of the seed and the player's actions. From sub-slice B an answer starts a visit, so when a
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
- **The icon.** For 4 seconds of the needs clock after a counted failure (counted from the end of
  the failure's line, which hides the action icon while it shows; user decision q27, 2026-11-11)
  `getState().failed` is `{ need, missing }`, and the action icon slot shows `npc-barrier` (a
  plain striped barrier), solid, ahead of the frustration icon below. The parked need's own greyed bubble with its badge (office life's
  `getState().parked`) shows as it does for any park. While `tell` is 1 or 2 the action icon slot shows the existing `blocked`
  icon whenever the NPC has no job; at `tell` 2 it pulses, with the slow pulse the pressing-need
  bubble already has (off under reduced motion). This does not wait for `showPressingNeeds`: a
  scenario that declares resources has opted in. The icon stays up between failures, so "one more
  and she gives up" looks different from "just started", and it works with `"chatter": false`.
  When the cause clears (user decision q17, 2026-11-11), the icon fades instead of staying solid:
  `getState().causeCleared` is true once, for every need with a counted failure, the causes of
  its last failure would all pass now (a resource back up, a route open, a station's `offWhen` no
  longer holding) or a judged use of it has been met since. The same `blocked` art is then drawn
  at alpha 0.6 (tell 2) or 0.4 (tell 1), with no pulse, and goes when the tell falls to 0. A new
  failure makes it solid again. After a reload the client seeds the causes from `failWhy` in
  `npcFrustration` (the whys of each need's last counted failure): a `down` or `unreachable` need
  records the resources failing a use now (none when the outage is over, so the icon fades at
  once); any other why is recorded against the station and clears with a met use, as live.
- **The mutter is a grumble.** One line on each counted failure or refused use, and one when a
  workaround starts. It is office life's grumble, not a new state: `_grumble(s, objectId, reason,
  topic, opts)` with the topic chosen below, which sets `s.saying` through `_showSaying`, so
  `getState().talking` returns it with `partnerId: null`, `_buildSpeakers` lists the speaker for
  seated colleagues to look round at, and the bubble renderer draws it as it draws any grumble.
  `_grumble` gains an options argument, `{ ignoreCooldown, icons }`, passed to `_pickBark`
  (`:1721`). A failure's grumble passes `ignoreCooldown: true`, so the cause is said in words
  whenever the speech lock allows, and it does **not** pass the need's own icon (today's `:1663`
  rule for `off` and `gone`): its picture is the topic's own, so a dead PC and a jammed printer
  look different even with no line (the pictures are below). `_turnBack` and the `off` park (5.2)
  call it this way for a judged need; every other grumble is unchanged. The workaround runner
  reaches it through one public method, `NPCNeedsSystem.mutter(npcId, topic)`, which calls the
  same two with `ignoreCooldown: true`. **A grumble is voiced** where the NPC has a voice and the
  player is in the room (`npc-needs-chatter.js`, `say`, `:237`), so a mutter line in a scenario
  with voiced NPCs is a line to voice (the `tts-audio` skill), and is silent (bubble only) until
  it has a clip. Under `"chatter": false` there is no line and no picture; the icon still shows.
- **Where the lines live: in the scenario.** Office life ships no spoken text, by design (section
  2), and this slice keeps that rule: every mutter line is authored in the scenario, in its
  top-level `chatter` (said by any NPC, which suits lines that name a kind of thing and no person)
  or in an NPC's own `chatter`. `chatterPool` **adds** the NPC's pool to the scenario's; nothing
  replaces a pool. Each line comes from the NPC's seeded bag and is held to the validator's
  existing pool check (40 characters, one line, no `{ }`). The slice ships a small default set in
  its feature scenarios, which an author copies: `test_access_work` carries every pool below
  except `social_blocked` (11.1), and `test_access_social` carries `social_blocked` (11.2). The
  author document lists every pool name, when it is said and what it should say. A student must
  hear what they broke, so the validator warns, for each NPC with a `work` plan or a
  `social_media` need, for each cause that NPC can meet (the "can fail" rule of 9.1, read cause by
  cause), when neither the cause's own pool nor `work_fail` has a line (the fed-up pool does not
  count: it is said only at `tell` 2); likewise for
  `usb_refused` on an NPC that can be refused a device, for each workaround's start pool, and for
  `login_aloud` on a `share_login`. The warning is skipped under `"chatter": false`.
- **Which pool, on a failure.** The pool is chosen at the moment of the failure, from the `tell`
  the NPC holds then (the answer to the previous report), and the line is held for its time; the
  answer that arrives afterwards changes the icon, never the line already said. `_grumbleTopic`
  (`:1686-1692`) gains this order for a judged need, so the decision log's `grumble:` names the
  pool that spoke. It takes the first pool in the order that has a line:
  1. `tell` 2: `work_fail_fed_up` (for example "That's it. I've had enough.");
  2. otherwise the cause's own pool: the NPC's own station off, or `locked_out`, `station_fail`
     ("This PC is useless."); `social_blocked` ("Blocked. Of course."); a `no_access` failure
     `work_fail_no_access` ("Still no access. Nobody listens."); a resource that is down or
     unreachable `work_fail_<kind>` by the first missing resource's `kind`:
     `work_fail_file_share` ("Share's down again."), `work_fail_email` ("Email's not sending."),
     `work_fail_printer` ("Printer's jammed again.");
  3. `work_fail` ("Why is nothing working?").

  With no line anywhere in the order, the topic is the cause's own pool (step 2), for its picture.
  `PICTURE_CHATTER` (`:70-87`) gains an entry per new pool: `station_fail`,
  `work_fail_no_access`, `work_fail_fed_up`, `social_blocked` and `usb_refused` show `barrier`
  (q27; they showed `blocked` until the new art); `work_fail_file_share` shows `file`;
  `work_fail_printer` shows `print`; `work_fail_email` and `work_fail` show `work`;
  `wk_writes_down`, `wk_prop_door`, `wk_borrow` and `wk_share_login` show `workaround` (q21;
  `work` until the new art); `login_aloud` shows `social`. A `work_fail_<kind>` with no
  entry of its own falls back to `work_fail`'s picture. So a student hears the thing they broke
  named, or at least sees its picture, and hears the tone change before the person acts. A refused
  USB device says `usb_refused` ("USB's disabled. Typical."), whatever the `tell`. The quoted
  lines are the feature scenarios' defaults, not engine text.
- **Which pool, when a workaround starts.** Each workaround says a line from its own pool as the
  hand-over starts its visit, so the act is tied to the outage in words: `wk_writes_down` ("I'll
  never remember this one."), `wk_prop_door` ("I'm not badging in every time."), `wk_borrow`
  ("I'll use the spare PC."), `wk_share_login` ("I'll get someone to run it."), and none for `emit`.
  The line's timing depends on the answer's arrival; its choice stays seeded. On arrival at the
  colleague, `share_login` says its spoken line from `login_aloud` (6.5). These pools are
  scenario-authored as well, with the same defaults in `test_access_work`.
- **The action icon for a workaround.** While a workaround visit runs (`writes_down`,
  `prop_door`, `share_login`), and while an NPC uses a PC it borrowed (`borrow_session`), the
  action icon slot shows `npc-workaround` (an arrow hopping a striped barrier; user decision q21,
  2026-11-11), so a person working round an outage looks different from one wandering for coffee
  or checking a printer (a check visit keeps `npc-work`). An `emit` has no visit: the runner calls
  `NPCNeedsSystem.showWorkaround(npcId)`, which shows the same icon for 4 s
  (`getState().workaround`), counted from the end of any line showing. A workaround visit calls it
  as well when it is done: the start line is shown from the hand-over and can hide the action
  icon for the whole of a short visit (Tom's 4 s at the wedge in the first live run); a borrowed PC's use calls it when done for the same reason. A new job clears it and the barrier; an `emit` that lands while the NPC has a job shows nothing. A queued check visit waits while it or the barrier shows; once the failure's causes pass again the barrier ends and a queued check visit to that resource is dropped. With no job the order is `noticed` (when it shows), `workaround`,
  `barrier`, the frustration `blocked`, the leashed `blocked`.

### 5.6 Outages

An outage is a global. A resource names one in `downIf`; a workstation, a printer or any other
object names one in office life's `affordance.offWhen`. The player sets it through whatever the
scenario gives them (a `triggerOnInteract` on a breaker, a `requiresItem` plant on a printer, a
flag reward, an ink tag). While it holds every use that depends on it fails or finds no source,
the people who depend on it leave their desks more often, walk to the broken thing to look at it,
and grow visibly frustrated. Clearing the global ends it; each met use then eases
frustration. The global is written by the browser, so an outage is pacing and display, not
protection (section 9.3).

**The outage bites at once.** A use is judged only when it completes, and a use starts only when
the need is at or below `urgentAt` (`_select`, `npc-needs.js:1349-1401`, at `:1364-1369`). Left
alone, a person who has just worked sits at the desk until the need next turns urgent: with a desk
preset's `restores: 60` (`office-presets.json:4`) and a work need of `decayPerMin: 6, urgentAt: 50`, that is about eight
minutes before the first sign that anything is wrong. The lesson is causal ("I broke it, she
noticed"), so the gap is closed by one client rule:

- each tick, the needs system checks, for each registered NPC with a `work` plan, the globals that
  plan names (each need's `downIf` and route globals) and its home station's `affordance.offWhen`,
  through `world.globalHolds(cond)` (`npc-needs.js:3604`);
- when one of them turns on, or is on when the NPC registers, the NPC's `work` level is lowered to
  `urgentAt` (never raised), once per change. A `work` need that is parked, for any reason, is
  left parked and its level is not touched: parked state is the held level (`_decay`,
  `npc-needs.js:1246-1250`) and `_select` reads levels only (`:1356-1366`), so lowering a parked
  need would select it while still in `s.parked` and park it over. A failure park needs no kick
  (the NPC already knows), a `held` park ends when the server would accept the fail, and any other
  park ends by its own rules at `urgentAt` (`_unpark`, `:1573-1580`), so the NPC tries then. A
  change that comes while the NPC is using a station for that need is applied when the use ends,
  after its restore, so a use that finishes on a station just switched off is followed at once by
  the `off` park. While the NPC's home is provisional (a start-room NPC registers before its
  room's objects, `_updateHome`, `:2450-2458`) the kick waits: a change seen then, or a global
  already on at `register`, is applied once the home resolves, so the first selection can see the
  station and park `off` (counted, with its line) rather than `no_source`;
- the NPC therefore tries to work at the next selection. `_select` runs only for an NPC that is
  idle or returning (`_tickNpc`, `:1128-1240`): not during a job, not while frozen in a
  conversation with the player (`inChatWith`), not on a desk-phone call (`s.call`). A pair chat
  between NPCs is not a job of its own (`_talking`, `:2684-2702`); it runs over a shared use or
  queue at a chatter object, so it is part of that job, and an NPC whose use ends mid-chat goes
  home when the chat ends (`:2827`). So the kick takes effect within about one use time for an NPC
  at its desk, and otherwise as soon as its current job, with any chat over it, is done and it is
  idle again.

It is what a person at a desk does when the share drops: they notice the next time they press
save. It is driven by the player's own act, so the decision log stays a function of the seed and
the player's actions. `social_media` gets the same rule for its station's `offWhen` only, and only
for an NPC with `"phone": false` (one with a phone just uses it, 8.1, so a dead PC is no failure
for it); a `social: "blocked"` policy is not an event and has no kick.

**Clearing it.** A resource coming back up wakes the `failed` parks it caused (`wakeOn`, 5.2); a
station switched back on wakes its owner's `off` park after one use time (5.2); a printer or any
other object switched back on wakes the parks office life already wakes (section 2). The NPC then
tries, and a met use eases frustration. A check visit is once per outage (5.2): an outage thrown,
cleared and thrown again with no met use in between is the same outage to the NPC, so it gives no
second check visit. That is intended; a re-armed beat waits for one met use between (W4).

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
over and waiting; if there is none, the next repeating one in force, taken in turn. A counted
failure that picks nothing new, and a failure answered `tooSoon`, carry the oldest unspent
hand-over again as `run`, with its stored `index` and `hand` and the dwell left since the server
handed it over, so a lost answer to the failure that made it does not strand it until a reload
(the runner starts a given `(npcId, index, hand)` once and ignores a copy). Every fail, too-soon
and ease answer also carries `pending`, every unspent hand-over oldest first in the same form, so
a lost answer that was the NPC's last failure, or a second lost hand-over, is picked up by the next
answer of any kind. `run` is a
description with nothing secret in it: `{ index, hand, do, pc | with | door, prop, event, dwell }`,
where `hand` is the server's count of hand-overs for that NPC, so each hand-over has its own
number. The runner (`systems/npc-workarounds.js`, new) hears `npc_workaround_due:<npcId>` (5.4),
starts the workaround (a visit through `enqueueVisit`, or `NPCNeedsSystem.setBorrow(npcId, run)`
for a borrow, 6.4), has the NPC say its start line (5.5), emits `npc_workaround:<npcId>` with
`{ npcId, index, do, phase: "started" }`, and when it has been performed calls
`POST /npc_workaround` (section 9.1) with `index` and `hand`, then emits the same event with
`phase: "done"`. The server applies whatever the workaround opens when it hears "done", and each
hand-over is spent by one "done".

**"Done" is safe to send twice.** A request can be lost on the way back. The runner resends a
failed request for as long as the page lives, after 2, 4, 8 and 16 s and then every 30 s, and never
gives up; a 425 (the dwell has not passed in server time) is resent after the `retryAfter` it
gives; only a 403 ends a hand-over. A "done" for a hand-over the server has already spent as done is
answered with the same body again, recomposed from the scenario, with nothing written; one spent
as dropped answers `{ "dropped": true }`.

**The start line.** A start line is said in words, after any line that holds the speech lock:
start lines wait in a queue, one per free lock, for up to 20 s (`MUTTER_WAIT_MS`), then show their
picture. One whose NPC is in conversation with the player, not placed or unavailable is held, and
dropped once it has waited 20 s, so it is never said late or over a conversation. Its bubble stays
up at least 6 s (`MUTTER_BUBBLE_MS`); the speech lock lasts only as long as the words, so other
lines on the floor are not held back by the floor. Only the last spent hand
per workaround is remembered (`lastSpent`, 9.4), so the record stays bounded.

**A hand-over that cannot be performed** (the visit was dropped, 5.3, or a borrow could not start,
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
- **The visit.** An at-post job at the NPC's own PC (6 seconds), so they stay seated.
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
- **The visit.** A walk to the prop (4 seconds).
- **Done.** The server unlocks the room and answers `{ roomId, roomData }` through the same helper
  a door unlock uses, which also records the room's NPCs as encountered (section 9.1). The client updates
  every loaded door sprite to that room as `NPCGameBridge.unlockDoor` does
  (`npc-game-bridge.js:110-133`: mark the sprites, `gameScenario` and `rooms` unlocked), opens each
  with `window.unlockDoor(doorSprite, roomData)`, sets `setGlobal` (which shows the prop) and
  emits `door_propped:<roomId>` with `{ roomId, npcId }`.

### 6.3 `emit` (B)

`{ "at": 90, "do": "emit", "event": "jake_gave_up" }`: when it is handed over the client emits the
named event with `{ npcId, level }`, with no visit, and then confirms through
`POST /npc_workaround`. The server marks it done only on that confirmation, so an answer lost on
the way, or a page closed before the event fired, leaves it pending and it is sent again on the
next load.

### 6.4 `borrow_session`: the hot desk (H)

- **Authoring.** `pc` names a sign-in PC that has no owner, is not `private`, is not `headless`
  (9.3a: a PC with no screen cannot be sat at), admits the NPC's account, is not under a policy
  with `autoLockMin: 0`, and satisfies the need through an authored `affordance` whose
  `satisfies` lists `work` (or `social_media` for an NPC who borrows for that); a sign-in PC never
  takes an office preset (section 2), and without the affordance the use would restore nothing.
  The validator errors on each. The NPC must have an account, and it leaves the hot desk open
  only with a `screenHabit` that says so (below).
- **One mechanism.** A borrow is an ordinary use job chosen by the selector, not a visit. The
  runner calls `NPCNeedsSystem.setBorrow(npcId, run)`, which sets `s.borrow = { index, hand, pc,
  need, routes, startBy }` for the need that failed and unparks it (`_unpark`), so the NPC
  gets up at once. While `s.borrow` is set, the borrowed PC is that need's candidate ahead of the
  home object; the job is flagged `borrowed`, and the verdict runs there with the borrowed PC's
  `routes` (sent in `run` when the scenario has `networks`).
- **If it cannot start.** A borrowed PC that is in use, unreachable or not loaded is waited for.
  If the job has not started 60 seconds of the needs clock after the hand-over, the borrow is
  dropped and reported (section 6), and comes round again after a later failure.
- **Sitting down.** When the job reaches the PC, `npc_sat_at:<pcId>` fires with `{ npcId,
  objectId }`. The workstation env gains `userOf(objectId)`: the NPC whose current job is `using`
  that object and is not a visit. `presence()` and `onInteract`
  (`workstation-state.js:207-213, 428-447`) treat a user as present, so a click shows "<displayName> is
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
  gets its mutter, its `npc_use_failed` and its `failed` turn-back and park, but is **not
  reported** to the server (the park of a `borrowed` job is not counted), because it is the same
  episode as the failure that sent the NPC there and would otherwise meet the pace floor seconds
  after it.
- **Leaving.** Whether or not the use was met, the NPC signed in before finding out, so a session
  is left. `_completeJob` emits `npc_borrowed_session:<pcId>` with `{ npcId, objectId, met }`
  before anything else, so before a failed verdict's turn-back, and the runner posts "done" then. When the answer arrives, the workstation layer records the NPC as
  that PC's **guest** (the client and the server record it at the same moment, so a click in
  between is never refused by the server) and
  treats the moment as a leave with the screen left open: `autoLockMin` above 0 sets `lockAt` as
  for an owner, the globals `<pcId>_owner_away` and `<pcId>_screen_locked` are published, and
  `workstation_owner_left:<pcId>` fires with `{ objectId, ownerId: <npcId>, screenLocked: false,
  reason: "guest" }`. The locked-screen look and the indicator dot follow those events as now.
  `s.borrow` is cleared; a later hand-over sets it again.
- **A careful guest, and the guest rule.** A borrower leaves the hot desk signed in only when it
  is meant to, and an NPC who is meant to leave a hot desk session open must say so. The rule is
  the owner rule of `decideLocked` (`workstation-state.js:129, 134`: no habit locks), applied to the
  guest with no PC field: a guest is **careful** when 9.1's `AccessIdentities.screen_always_locks?`
  with no PC field is true for it, which includes **no `screenHabit` at all**, a habit with no
  numeric `lockChance`, an authored `lockChance` of 1, and one filled from `locksScreen: always`.
  A guest **leaves the session open** only with an authored `screenHabit` whose `lockChance` is
  below 1, typically `{ "lockChance": 0 }`, or one filled from 9.1's `locksScreen: "never"` (or
  `sometimes`); a habit with a `lockIfAwayOverSeconds` counts as leaving open too, with no roll at
  a borrowed PC. For a careful guest the server sends `leavesOpen: false` in `run`: the NPC works
  at the hot desk and signs out, no guest record is made, and the server's guest claim refuses on
  the same test (its check 7, 9.1). The validator warns, on the same test, that such a workaround
  opens nothing. No habit reaches the browser. Where 9.1 is not built, sub-slice H builds
  `screen_always_locks?` as 9.1's section 5.2 defines it, and 9.1 then keeps it. The feature
  scenarios author the habit on every borrower (Ian, Rosa and Jake in 11.1, Omar in 11.2), with a
  `lockChance` on each one's own PC where the beat needs that PC to lock, because the object's
  field wins over the habit.
- **The claim.** With a guest record and nobody at the PC, `onInteract` returns `accessed`, and
  `interactLoginPc` (`unlock-system.js`) claims through `pc-sessions.js` with `claim: "guest"`.
  The server's checks are in section 9.1. The desktop is the guest's: the PC's own contents and every
  profile that admits them.
- **It ends** when the screen's auto lock fires, when anybody next sits at that PC (by
  displacement, above), or on a reload (the first slice's rule for every claim).

### 6.5 `share_login`: said out loud (H)

- **Authoring.** `with` names another room NPC. The NPC has an account.
- **The visit.** A walk to a cell beside the colleague (6 seconds). On arrival the NPC says one
  line from the pool `login_aloud` ("Can you run it on my login?", "Use mine. It's the usual
  one."). Pool lines ship, so they never hold a username or a password.
- **Heard.** During the dwell the runner asks, each tick, whether the player hears: in the same
  room, within the chat overhear radius (`OVERHEAR_RADIUS`, 160 px), with a clear line, the test
  `world.playerHears` (`npc-needs.js:3572`) already makes for chatter. At the first tick that
  hears, it notes the player's room, `window.currentPlayerRoom` (`core/rooms.js:3165`). At the
  end it posts "done" with `heard` true or false and, when heard, that `room_id`.
- **What the server checks.** The server cannot see where the player stands, and its own
  `player_state.currentRoom` is never updated by the browser (section 2, faults found). So "heard"
  is a client claim, bounded as `GET /login_accounts` is: it counts only when `room_id` is a room
  the `with` NPC can be in (its own room, plus its `needsRooms` leash when it has one) and that room
  is open to the player: never locked, or unlocked (`Game#room_unlocked?`, `game.rb:117-119`), the
  test `login_pc_reachable?` makes for a room (`game.rb:1290`). Otherwise it is taken as not heard. The bound is "a room the player has opened where the share can happen"; it is not
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
  does reveal, which the user accepted in decision 14: the player who locked out a guessed
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
(`isWorkstation`, `workstation-state.js:89-93`) or that names a `policy` itself. A `defaultPolicy`
therefore never makes a lost property tray, a shredder or a printer "refuse" a memory stick.

One pure module, `public/break_escape/js/systems/pc-policy.js` (new), with no imports, so node
tests load it directly:

- `effectivePolicy(objectData, scenario)`: the object's `policy`, else `defaultPolicy`, as
  `workstation-state.js:485-490` resolves it;
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
object (`_carryCandidate`, `npc-needs.js:1813-1829`). The policy bites when the use completes:

1. The target's policy refuses the item's class. The item is not consumed, `npc_used` does not fire
   (so no payoff mapped to it can run), `npc_use_refused:<objectId>` fires with `{ npcId, objectId,
   itemId, tag, usbClass }`, the log gains `use_refused`, and the NPC mutters from `usb_refused`
   ("USB's disabled. Typical."). The `mutter` method of 5.5, over the existing grumble path, is
   built in this sub-slice.
2. The NPC then looks for another object that accepts the tag, is free and reachable, and does not
   refuse the item. If there is one, the same job carries on to it: the person tries their own PC,
   is refused, and takes the stick to the machine nobody manages. That use completes as any
   delivery does and fires `npc_used:<thatObject>`.
3. If there is none, the NPC puts the item down where they stand (`world.dropHeld`, as an aborted
   carry does), remembers it (`s.refused`, so they do not pick it up again) and goes home. The
   player can pick it up again.

The adapter's object description (`describe`, `npc-needs.js:3297`) gains `usbClass` for items and
`usbPolicy` (the effective `usb` value, or null when the object is not governed) for targets.

**The player's own plant.** In the `requiresItem` branch (`interactions.js:953-990`), the branch
gathers every held item that matches `requiresItem` (today it takes the first, `:955-958`) and
asks `pcPolicy.plantRefusal`. It uses the first matching item the object's policy accepts, so a
player holding both a storage stick and a keyboard-type device is never refused when one of them
would work. Only when every matching item is refused does the click show "USB storage is disabled
on this PC." or "USB devices are disabled on this PC." for the time `hintToastMs` gives, emit
`usb_refused:<objectId>` with `{ objectId, itemId, usbClass }`, run no action and consume nothing. This branch is never reached on a sign-in PC, which returns earlier
(`interactions.js:925-933`), and policies mostly sit on sign-in PCs. So a plant the policy should
govern goes on a separate object beside the PC that names the same `policy` (a dock, a USB hub),
which is the shape the author docs already give for plants at sign-in PCs.

**Any other path that plants a USB device asks the same question.** Slice 9.3b's implant (a
`grant_foothold` from a device an NPC uses at a PC, its 12.5) is one. Its `POST /network/implant`
refuses when the PC is governed and the device's `usbClass` is refused; both are scenario facts, so
that check is the server's own. The implant is 9.3b's, so the check is built with it: in the
expected order 9.3b comes after this slice and adds a Ruby `usb_refused?(pc, item)` beside
`effective_policy` (`game.rb:1400`), reading the same table as `pc-policy.js`, with a validator
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
   which is not off (`affordance.offWhen`);
3. any object whose `affordance.satisfies` lists `social_media` and that is not a desk (5.2: a
   break room tablet), by the usual nearest-reachable rule;
4. the NPC's **phone**, unless `"phone": false`;
5. the NPC's own workstation even though its policy blocks social media: an attempt that fails. A
   workstation that is off is no source at all, as for work, and its park counts as a failure
   (5.2).

**Where the phone sits in the selector.** Items 1 to 3 are `_useCandidate`'s list. The phone is
tried after it and before any park: when `_useCandidate` returns nothing for `social_media` and the
NPC has a phone, `_select` takes the phone (a `self` job, 8.2) and clears `s.giveUp`, so the need
never parks for want of a source. The dead-station rule of 5.2 (`_giveUpReason` returns `off` for
an own station that is off) applies to `social_media` only for an NPC with `"phone": false`; for
one with a phone `_giveUpReason`'s answer is discarded when the phone is taken, so a dead PC sends
that NPC to its phone and counts nothing.

With none of these the need has no option and the NPC holds still, as for any need. The validator
errors on an NPC with the need, no phone and no workstation home, and
`validate_npc_needs.rb:1236` ("has no object whose affordance.satisfies it") no longer applies
to `social_media`.

**The verdict at a PC** (5.1) for `social_media`: `social_blocked` when the PC's effective policy
has `social: "blocked"`. A failed attempt goes through 5.2 unchanged, as a `failed` turn-back: the mutter comes from `social_blocked` ("Blocked. Of course."), frustration rises,
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
action joins the `with_game_lock` list (`games_controller.rb:89`).

**"NPC known":** the id names a room NPC (`scenario_room_npc`, `game.rb:1232`) and is in
`encounteredNPCs`, which the server fills when the NPC's room is loaded (`track_npc_encounters`,
`games_controller.rb:1794`). The needs system only runs NPCs in loaded rooms, so every honest
report passes. It means "the NPC's room has loaded", not "the player is near".

**"Can fail".** A fail report is accepted only where the scenario makes a failure possible for
that NPC and need:

- `work`: a resource in the NPC's resolved list is not admitted or has a `downIf`; or the NPC's
  home PC, or a PC a handed-over `borrow_session` names (sub-slice H; in A no borrow is handed
  over, so a borrow PC counts for nothing and a report naming one is answered as for any other
  PC), has an `affordance.offWhen`; or
  (sub-slice L)
  the home PC is under a policy with `maxAttempts`; or a need's `routes` (9.3) are empty or carry
  a global.
- `social_media`: the NPC has the need and `"phone": false`, and its home PC is under a policy
  that blocks social media or has an `affordance.offWhen`.

**"Belongs to the NPC".** A report names only that NPC's own things, read by the server from the
scenario, never from the report:

- a `down`, `unreachable` or `no_access` cause names a resource in the NPC's resolved work list
  (for `no_access`, one it is not admitted to);
- an `off`, `locked_out` or `social_blocked` cause names the NPC's own station (its `needsHome`
  object, 5.2) or a PC a handed-over `borrow_session` names;
- `object_id`, on a fail or an ease, is one of the NPC's **places** for that need: its own station,
  a PC a handed-over `borrow_session` names, or an object that satisfies the need and is
  not a desk (5.2, by the same rule, which `access_work.rb` applies from the object's fields and
  the office presets), in the start room or a room in `unlockedRooms` (an object in a room the
  server has not sent answers as an unknown id; review R2 m5); or null for a `social_media` ease
  from the phone.

A report that names anything else is refused (check 2). No honest client sends one: the browser's
plan holds only that NPC's resources (5.2), and its candidates for a judged need are filtered to
exactly these places (5.2, "Where a judged need is met"). So a tampered browser cannot borrow
another NPC's outage, or name an object with a short use time, to choose its own floor.

**"A cause holds".** Each fail report lists its causes. The server checks each against its own
view: `no_access` and `social_blocked` from the scenario; `down`, `off` and `unreachable` from the
server's copy of the globals (for `off`, the station's own `affordance.offWhen` read by the
`requiredGlobalsHold` rule) (`player_state.globalVariables`, else the scenario default,
with 9.3's `NetworkModel` for reach); `locked_out` from `loginLockouts`. At least one must hold.
Globals are written by the browser, so for those three causes this is consistency and honest logs,
not protection; `no_access`, `social_blocked` and `locked_out` are the server's own facts.

**Pace floors.** All in server time. Each is 0.9 of the honest client's shortest interval less an
**allowance of 3 seconds**: the tenth is slack for clock rounding, and the allowance covers what can
delay one report and not the next, so that two honest reports reach the server closer together
than the NPC made them: the two-second batch window, and the forced state sync awaited before the
first batch after a plan global changes (5.4), which can hold back the earlier of two reports only.
At the validator's minimum `needsDeferMin` of 0.5 (section 10) the park floor's slack is 6 seconds
(3 of rounding, 3 of allowance), which leaves the sync about 4 seconds. The needs clock follows
frame time, which never runs faster than server time in play; the test bridge's manual clock
(`setManualClock` and `step`, section 2) can, so a run never steps the needs clock while an outage
holds (11, point 4).

Two intervals are used. The **park floor** is `0.9 x needsDeferMin x 60 - 3` seconds,
`needsDeferMin` read from the NPC as authored, default 4. The **use floor** is `0.9 x u - 3`
seconds, not below 0, where `u` is the NPC's **shortest use time** for that need, worked out by the
server and never taken from the report: the shortest of the use times of the NPC's places for the
need ("Belongs to the NPC", above) and, for `social_media` with a phone, of the phone use. An
object's use time is its authored `affordance.useSeconds`, else its office preset's (in a scenario
with `"officePresets": true`), else the needs system's own default of 20 seconds
(`npc-needs.js:2139-2140`, `clamp(secs, 0, 600)` else 20); a `social_media` use at the NPC's own
PC and a phone use take `socialUse.useSeconds` (default 20, 8.1). `access_work.rb` resolves it
(section 10). No honest use of that need is shorter, so no honest report meets the floor through
`u`, and a tampered browser gets the same `u` whichever object it names.

- **The first fail** for an NPC and need has no floor beyond the NPC being known (`metAt`, written
  by `track_npc_encounters` for an NPC with a `work` plan or a feed, 9.4): with the outage kick
  (5.6) and a station that is off, an honest NPC fails at its first selection, which can be the
  moment its room loads.
- **A later fail** is measured from the last accepted **fail** for that NPC and need, and from
  nothing else. It is held to the park floor after that fail, unless a **gate** lies between the
  two, in which case it is held to the use floor after that same fail:
  1. **an accepted ease** for that NPC and need since that fail: the NPC worked, so this failure
     is a new episode. The ease opens the gate; it is not where the floor is measured from. A
     station switched off during a met use parks `off` as the use ends (5.6), so that fail can
     reach the server a tick after the ease, often in the same request; what lies between the
     two fails is the met use, at least one use time;
  2. **`rearmed: true`** on the report (5.4: the park was woken by its cause clearing, or a met use
     came between), when **no cause the server owns holds** for that NPC and need, whatever the
     report lists. The server works these out itself, from the scenario and its own state: a
     resource in the NPC's resolved list that it is not admitted to (`no_access`) or whose
     `routes` are `[]` (an `unreachable` with no global to clear); for `social_media`, its own
     station under a policy that blocks it (`social_blocked`); for either need, a `loginLockouts`
     entry for the NPC's account at its own station (`locked_out`). None of these can clear in
     play, so leaving one out of a report gains nothing. Only an outage the browser controls
     (`down`, `off`, or an `unreachable` whose routes carry a global) can be re-armed.

  This is what an honest client does. Inside one park a failure park is woken only by its own
  cause clearing (5.2), never by a door, a room or another object, and a failure with a cause the
  server owns has no `wakeOn` and is never woken. Whenever a gate lies between two honest fails,
  at least one use of the need lies between them too, so at least `u` has passed since the earlier
  fail: a woken `failed` park retries and uses the station for a full use before the verdict; a
  woken `off` park waits one use time of the station first (5.2); and a met use takes its use time
  before its ease is sent. So a player who throws an outage, clears it, waits for the NPC and
  throws it again (W4's re-arm), throws, clears and throws again before the NPC has worked, or
  pulls the plug while the NPC is working (W6, H1), gets every failure counted, and a borrowed
  PC's met use (an ease) lets the next failure at a locked-out owner's own PC count (L1).
- **An ease** is counted at most once per use floor after the last accepted ease for that NPC and
  need: met uses are spaced by the need's period, which can be shorter than the park, so tying
  eases to the park would lose honest eases. An ease for `work` from an NPC with a resource it is
  not admitted to, or one no route reaches from its station (a `[]` route; review R2 m3), is
  refused (answered `refused`, nothing written): that NPC's work is never met
  anywhere (5.2), so such an ease is never an honest report, and refusing it keeps the park floor
  binding on the one NPC whose failures come with no player action (W5).
- Fails and eases are floored per NPC **and per need**, so an NPC failing at both work and social
  media loses neither report. The price is stated, not hidden: such an NPC can be walked up at up
  to twice the rate of one need (9.3).
- **A "done"** is accepted no sooner than the workaround's dwell after its hand-over.
- **A post** is served no sooner than 0.9 of the need's period (8.3) after that NPC's last one.

Every case where an honest client could meet a floor is designed out above: a toggled outage is a
new episode (point 2); a met use between two failures is an ease (point 1), and the later fail is
measured from the earlier fail, so a fail sent with that ease is clear; a failed borrowed use is
not reported (6.4); after a reload each need is held until a fail would be accepted (`hold`, 5.4);
`u` is the shortest use the NPC has for the need; and the 3 second allowance covers the batch
window and the forced sync. A run that steps the needs clock by hand is not an honest client in
this sense; `PLAYTEST.md` says so (11.1).

**Ceilings.** A request carries at most 20 reports; more is a 422. The client sends at most one
report request every two seconds, sends no fail for a settled NPC, and stops asking for posts when
told the feed is done. Each scripted run checks the number of requests against a budget (section
11).

| Route | Sub-slice | Parameters | Checks, in order | Writes and answer |
|---|---|---|---|---|
| `POST /npc_frustration` (new, locked) | A; `run` from B; `check` in L | `reports`: a list of `{ npc_id, event, need, object_id, missing, rearmed }`, `event` being `fail`, `ease` or `check` | Per report. 1. NPC known. 2. `fail`: can fail, and every cause and `object_id` belong to the NPC; `ease`: `object_id` belongs to the NPC, and for `work` no resource in the NPC's resolved list is unadmitted. 3. `fail`: a cause holds. 4. `fail` and `ease`: the pace floor for that NPC and need, with `u` the NPC's shortest use time for it (a fail measured from the last accepted fail, its gate read from an ease since then or its `rearmed` flag and the server's own causes). `check`: the object is a sign-in PC this NPC owns, under a policy with `maxAttempts` | One answer per report, in order. `fail`: level up by `perFail`, at most 100; then choose `run` (section 6), record the hand-over, its number and its time. `ease`: level down by `easePerSuccess`, at least 0; never a `run`. Both answer `{ npcId, level, previous, tell, settled, run, pending }`, `pending` being every unspent hand-over, oldest first. `check`: `{ npcId, lockedOut }`; a true answer records the PC in that NPC's `lockedOut` list (9.4), and nothing else is written. Check 1 or 2 fails: `{ npcId, refused: true }`. Check 3 fails: `{ npcId, stale: true }`. Check 4 fails: the current `{ level, tell, settled, pending }` with `tooSoon: true`. A refused, stale or too-soon report writes nothing |
| `POST /npc_workaround` (new, locked) | B, H | `npc_id`, `index`, `hand`, `heard`, `room_id`, `dropped` | 1. NPC known. 2. `hand` is that workaround's last spent hand-over and was spent as done: answer the same body again, recomposed, and write nothing. 3. Otherwise `hand` is handed over and not yet spent. 4. Unless `dropped`: at least the workaround's dwell since the hand-over. 5. `share_login` with `heard`: `room_id` is a room the `with` NPC can be in (its own, plus its `needsRooms`) and is open to the player (never locked, or `room_unlocked?`); otherwise it is taken as not heard | The hand-over is spent and recorded in `lastSpent`. `dropped`: nothing else; answer `{}`. Otherwise add `index` to `done` (lasting ones), set a declared `setGlobal` true, and by kind: `writes_down`: answer `{ pcId, hasPostit: true }`. `prop_door`: unlock the room and answer `{ roomId, roomData }` through `serve_opened_room` (below). `emit`: `{}`. `borrow_session`: `guestSessions[pc] = npcId`, clear `sessions[pc]`; `{}`. `share_login` heard: add the NPC to `sharedLogins` once, keep it in turn, answer `{ capture, line, note }`; not heard: `{}`. Check 3 fails: 403. Check 4 fails: 425, and the client sends it again after the dwell |
| `POST /login` with `claim: "guest"` (changed, locked) | H | `pc_id`, `claim` | 1. PC reachable (first slice), not headless, and no foothold (9.3a). 2. No session is held at the PC. 3. `guestSessions[pcId]` names an NPC. 4. That NPC has an account. 5. The PC's `access` admits it. 6. The PC's policy is not `autoLockMin: 0`. 7. That NPC is not a careful guest: its saved `screenHabit` does not always lock by 9.1's `screen_always_locks?` with no PC field, where no habit at all always locks (6.4) | Success: `sessions[pcId] = { id, via: "claim" }`, add to `signedInPcs`; the answer a claim gives today. Failure: "Sign in required" |
| `POST /login` with `claim: "owner"` (changed, locked) | L | as today | As today, plus: refused when `loginLockouts` holds the owner's username at that PC | As today; refusal "Sign in required" |
| `GET /login_accounts` (changed by 9.1; extended here) | B | as today | As today. | `postitNote` when `login_postit_for(pc)` returns one, which now includes an owner whose `writes_down` is done; `no-store` |
| `GET /capture_secrets` (changed) | H | as today | As today. | An account holder in `sharedLogins` counts as having a capture route whose proof holds (`account_capture_passwords`, `game.rb:965`; the engine plan's `proof` rule, section 15). The proof is the server's own record of a heard "done", as strong as that client claim (6.5) |
| `POST /feed_post` (new, locked) | C | `npc_id` | 1. NPC known. 2. The NPC has a `feed` with posts and a valid `social_media` need. 3. A post is left. 4. For a second or later post: the pace floor. | `feedRevealed[npcId] = { n, at }`; answer `{ index, post, fact, site, person, done }`, where `fact` is `{ id, entry }` for a post with a feed fact and `done` is true when that was the last post. Check 3 fails: `{ post: null, done: true }`. Check 4 fails: `{ post: null, done: false }` |
| `GET /scenario` (changed) | A, B, H, C | as today | As today. | `filtered_scenario_for_bootstrap` also deletes `resources` and `roles` (where 9.3 or 9.1 already delete them or part of them, nothing more is needed) and, in C, every feed fact from `social.intelFacts`. The `scenario` action adds `npcFrustration` (per NPC: `level`, `tell`, `settled`, `hold`, per need the seconds until a fail with no `rearmed` mark would clear its floor, omitted when none is left (5.4), `pending`, the handed-over workarounds not yet spent, as `run` descriptions, `done`, likewise, each with its `setGlobal` (and, for a `prop_door`, `door` and the prop's room `from`), `failWhy`, per need the whys of its last counted failure, omitted when none, and `lockedOut`, the PCs a true `check` recorded) and `feedPosts` (per NPC: `site`, `person`, the posts revealed so far with their fact entries, and `done`). After answering it clears `guestSessions`, as it ends claimed sessions (`end_claimed_sessions!`, `game.rb:1542`), with the same row lock |
| `GET /room/:id` and the room data of a door unlock (changed) | A, C | as today | As today. | Through `filtered_room_data`: each room NPC gains `work` (5.1) and, with a feed, `hasFeed: true`; `workNeeds`, `frustration` and `feed` are deleted beside the keys withheld today. `hasPostit` on a PC is 9.1's and follows `written_down?` |
**`serve_opened_room(room_id)`.** The tail of the door unlock (`games_controller.rb:936-947`) is
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
| `resources`, `roles` | Never as authored. Each NPC's own plan, as `work`: resource ids and kinds, `admitted`, `downIf` names, `object`, `routes` (lists of `downIf` global names), `breakDrain` | Every resource display name (`name`), access lists on resources, role defaults, who has which role, every network id and link, a resource's `network`, `host`, `contents` and `observations` |
| `workNeeds`, `frustration` | No | Deleted from every room NPC |
| `workarounds` | One at a time, as `run`, when the server decides it is due; again in `npcFrustration` on a load | The list, the thresholds, and every workaround not yet due |
| Frustration | The level and `tell`, in each answer and on a load | `perFail` and `easePerSuccess` are not sent as fields; they can be inferred from the level steps (`level - previous`), which W3's mapping needs |
| A written-down password | Only in a `GET /login_accounts` answer for the owner's own reachable PC, after the workaround is done (9.1's channel), and afterwards in the player's own saved notes if they press "add to notebook" | Before that. Never in room data, the bootstrap, a `/npc_workaround` answer or a door unlock |
| A shared login | In the `/npc_workaround` answer to a heard `share_login` (`line`, `note`, and the username in `capture`), then in the player's saved notes; from `/capture_secrets` once the capture is recorded and `revealSecret` is on | Before that; and always, when the player did not hear |
| A lockout of an owner | `lockedOut` in the answer to a `check` report, sent when the owner returns to the locked screen | A list of locked-out accounts is never sent; sign-in answers are unchanged |
| `feed` posts | Posts revealed so far, one per answer and all on a load; `hasFeed: true` on the NPC; `done` once the last is out | Every post not yet revealed, and how many there are |
| Feed facts | The entry of each revealed post's fact, with the post; afterwards in the evidence note the player's own click adds | The entry of every unrevealed post's fact. Its id may appear in a readiness slot; its text never |
| `policies` | As today (the bootstrap ships them); `usb` and `social` are not secret | Nothing |
| `phone`, `socialUse`, `needs`, `needsDeferMin`, `usbClass`, an object's `affordance.offWhen` | As authored | Nothing |

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
  (`game.rb:4027-4030`) just before `withhold_npc_secrets!`, because it needs `role`, which that
  method deletes. It attaches `work` only when the NPC has a `work` need and its resolved work
  list is not empty (5.2, "judged"). NPCs added by `update_room` are merged before the filter runs, so they are
  covered. In a scenario with `networks` it calls 9.3's `NetworkModel.reach_conditions` here for
  `routes`, and 9.3a's `resource_acl_admits?` for `admitted`.
- `WITHHELD_NPC_KEYS` (`game.rb:4048`) gains `workNeeds`, `frustration` and `feed`. `workarounds`
  is there already.
- `filtered_scenario_for_bootstrap` (`game.rb:827-906`) deletes `roles` beside `accountProfiles`
  (`:890`; 9.3a's `withhold_network_keys!`, `:895`, already deletes `resources`), and feed facts
  from `social.intelFacts`.
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

- set the outage global itself and report failures marked `rearmed` (or alternate them with
  eases) at the use floor, so reach a workaround after `(ceil(at / perFail) - 1) x (0.9 x u - 3)`
  seconds of server time from the first counted fail, plus the workaround's dwell. `u` is the
  NPC's shortest use time for that need (9.1), which the server works out from the scenario: the
  report cannot lower it by naming another object, since every cause and `object_id` must belong
  to the NPC ("Belongs to the NPC"). The first counted fail can itself come as soon as the room
  loads. When `at` is at or below `perFail` that is **at once**: the workaround is handed over on
  the first report. With the defaults (`perFail` 25, a desk preset's 10 second use) a workaround
  at 50 is about 6 seconds away, and with the feature scenario's (`perFail` 20, 5 second uses)
  about 3. This applies only to an NPC for which no cause the server owns holds (9.1, point 2):
  for an outage the browser controls, the floors measure pacing only, since the browser writes
  that global and could clear and set it at will. Where a cause the server owns holds, the server
  sees it whatever the report lists, and the floors bind harder: an NPC with a resource it is not
  admitted to, or one no route reaches (W5's Kai, even when the report lists only his share's
  `down`) is held to the park
  floor, `(ceil(at / perFail) - 1) x (0.9 x needsDeferMin x 60 - 3)` seconds (about 213 with the
  defaults), because `rearmed` is ignored and its eases are refused; a `locked_out` or
  `social_blocked` NPC can be walked up only by alternating claimed eases and fails, one pair per
  use floor (each fail needs an accepted ease since the last fail, and eases are themselves a use
  floor apart), gaining `perFail - easePerSuccess` per pair (nothing when `easePerSuccess` is at
  least `perFail`), and only after the player has really locked the owner out or the policy
  really blocks. An NPC with a cause the server owns whose station also has an `offWhen` takes two
  counted fails per park floor (R5 n1: an `off` fail, then an owned-cause fail held only to the use
  floor, then `off` again at the park floor), so its park-floor figure is halved. Floors are per
  need, so for an NPC with two needs that can fail every figure is about halved;
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

It cannot: make an NPC do a workaround the scenario did not give it; name another NPC's resource
or station, or an object that is not one of the NPC's places, to choose its own floor; avoid the
park floor by leaving a cause the server owns out of a report; go faster than the floors;
spend one hand-over twice; fake a lockout (the server owns `loginLockouts`); or read a password, a
workaround, a post or a feed fact before the server has handed it over, except what the
scenario's own event mappings, reveal props (their `revealOnGlobal` and text) and global names
show, which are served from the start (the README tells authors to keep them neutral; sub-slice H
withholds them).

This residual is accepted (decision 5). What keeps it small in practice: the validator prints, for
every workaround, what it opens and the earliest it can be reached, and warns when what it opens
holds a flag station or a VM launcher, so an author puts anything that must not be passable this
way behind something the server checks itself (first slice plan 4.2): a password typed at a
sign-in PC, a PIN, a keycard picked up from a room the server knows is open.

### 9.4 State and saved games

New `player_state` keys, added to `ACCESS_STATE_DEFAULTS` (`game.rb:1142`) so
`initialize_player_state` fills them, and left off `preserved_keys` (`game.rb:96`) so a reset
drops them:

| Key | Sub-slice | Shape | Meaning |
|---|---|---|---|
| `npcFrustration` | A, B, L | `{ npcId: { level, metAt, failAt: { need: time }, easeAt: { need: time }, hands, handed: { index: { hand, time } }, lastSpent: { index: { hand, done } }, done: [index], turn, lockedOut: [pcId] } }` | The level; when the NPC was first met (for the first fail); the server time of the last counted fail and ease for each need; the count of hand-overs; the hand-overs not yet spent and when each was made; the last spent hand-over of each workaround and whether it was done (so a resent "done" is answered again); the lasting workarounds done; whose turn it is among the repeating ones; the PCs where a `check` found the owner locked out |
| `guestSessions` | H | `{ pcId: npcId }` | Who last left a borrowed session at each PC |
| `sharedLogins` | H | `[npcId]` | Accounts the player heard shared |
| `feedRevealed` | C | `{ npcId: { n, at } }` | How many of each NPC's posts are out, and when the last came out |

All four are bounded by the scenario (one entry per NPC or PC). A game saved before this build has
none of them: every reader goes through a helper that treats a missing key as empty, as
`access_sessions` does (`game.rb:1294`). A game's scenario data is fixed when the game is created,
so a game made before a scenario gained these fields plays on without them.

What a load does:

| Thing | After a reload |
|---|---|
| Frustration level and `tell` | Kept: `npcFrustration` in the scenario response; applied when the NPC's room loads and its needs state is made (5.4) |
| Need levels, parked needs, visit queues, `s.borrow`, the "checked" and "refused" memories, the `rearm` marks | Reset, as all needs state is today. Needs restart at `initial`, so the outage kick (5.6) is what brings an NPC back to a failing desk after a reload: at once, except that a need whose last fail is still inside its floor is first parked `held` for the rest of it (`hold`, 5.4), so no fail after a reload is refused as `tooSoon` |
| An owner's `locked_out` flag | Kept: `lockedOut` in `npcFrustration`, applied when the owner's room loads |
| A workaround handed over and not spent | Sent again as `pending`; the runner starts it again when the NPC is registered |
| A pending borrow | Set again, with its 60 second start limit from the load. Needs restart at `initial`, so the borrow starts only if the need is urgent: when the outage that caused it still holds, the kick (5.6) makes `work` urgent at once and the NPC goes; otherwise (a lockout, which has no global) the borrow lapses, is dropped, and comes round after the next failure |
| A done workaround's `setGlobal` | Kept on the server, and set again by the client from the `done` list. A state sync built before the client applied the "done" answer and landing after it can put `false` back on the server until the next sync (globals merge last-write-wins, as a task's `setGlobal` does today); the client resends `true` and a load re-applies it, so it heals, but a server check that reads the global in that window sees `false` |
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
`validate_npc_needs.rb` reads it, else the needs system's 20 seconds), whether an object is a desk
(5.2's rule), an NPC's places for a need and its shortest use time for it (9.1), the causes the
server owns that hold for an NPC and need given `loginLockouts` (9.1, point 2), and the post period
of 8.3. `game.rb` and the validator both
call it, as both call `BreakEscape::DeclaredGrants`, so the server and the validator cannot drift
apart. Like 9.1's library it is plain Ruby with no Rails methods. It walks roles with 9.1's
`identity_roles(npc)` order (9.1's 14.2).

**Files.** `scripts/validate_scenario.rb`: the known-field lists (`:391-424`, `:490-519`) gain
`resources` and `roles` (each is added only if a sibling slice has not added it already); NPC
`workNeeds`, `frustration`, `workarounds`, `phone`, `socialUse`, `feed`; item `usbClass`. A broken
PC is office life's `affordance.offWhen`, already known. The checks go in a new `scripts/validate_access_work.rb` (`require_relative`, as
`validate_npc_needs.rb` is). `scripts/validate_npc_needs.rb` skips `social_media` in its "no
object satisfies it" error (`:1236`) and applies its pool line check to the new pools.
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
- a resource `downIf` global that `globalVariables` does not declare (office life's validator
  already checks an `offWhen`);
- an NPC with a `work` plan, or with a `social_media` need and `"phone": false`, whose
  `needsDeferMin` is under 0.5 (the park is the retry wait for either need, and the server's park
  floor needs that much slack, 9.1);
- an NPC with a `work` plan whose `needsHome` is a coordinate, or an object that satisfies no
  `work` (a sign-in PC takes no office preset, so it needs an authored `affordance`): the NPC has
  no station, so its work goes to any non-desk source or nowhere, and a dead or locked PC never
  counts. When the NPC owns a PC through `screenOwner`, the warning names that PC and says to make
  it the NPC's `needsHome`, since a PC owned only through `screenOwner` is a desk like any other
  for its judged needs (5.2);
- an NPC with a `work` plan or a `social_media` need with no mutter line for a cause it can meet
  (5.5): for each cause the "can fail" rule allows that NPC (its station off or `locked_out`, each
  unadmitted resource, each resource with a `downIf` or routes that can fail, a blocking `social`
  policy), neither that cause's own pool (5.5) nor `work_fail` has a line in the scenario's
  `chatter` or the NPC's own (`social_blocked` alone for social media; the fed-up pool does not
  count). Likewise `usb_refused` for an NPC that can be refused a device, each workaround's
  start pool, and `login_aloud` for a `share_login`. The student would see only a picture. Not
  reported under `"chatter": false`;
- a resource no NPC needs that also has no `contents` and no `host` (slice 9.3 authors resources
  that exist only for the player; those have one or the other and are not reported);
- `prop_door` by an NPC whose own card and role do not open that door;
- `writes_down` where the home PC authors a `postitNote` or sets `showPostit: false`;
- `borrow_session` by a careful guest (6.4: `screen_always_locks?` with no PC field is true for
  the NPC, read on the expanded copy where 9.1 is built), which includes an NPC with **no**
  `screenHabit`: it opens nothing. The warning says to author `"screenHabit": { "lockChance": 0 }`
  or `locksScreen: "never"` on a borrower meant to leave the session open;
- `lockChance` or `locksScreenOnLeave` on a PC named by `borrow_session` (a guest ignores them);
- a post with a `fact` on an NPC whose awareness level is `high`, unless `"deliberate": true`;
- a `usb` policy other than `allowed` that governs only objects accepting tags whose items have no
  `usbClass` (the policy does nothing there); an item with `usbClass` accepted by an object the
  policy does not govern while the scenario's `defaultPolicy` blocks its class (the author may
  have expected a refusal);
- a visit place (a check visit's `object`, a workaround's `prop` or `with`) in a room the NPC's
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
  `(n - 1) x (needsDeferMin x 60 + useSeconds)`, `useSeconds` being its own station's; and the
  earliest a modified browser can reach it after the first counted fail, by the bounds of 9.3:
  `(n - 1) x (0.9 x needsDeferMin x 60 - 3)` seconds for an NPC with a resource it is not admitted
  to or that no route reaches (a cause the server owns that holds at every place, with its work
  eases refused; review R2 m3), else
  `(n - 1) x (0.9 x u - 3)` seconds (not below 0), `u` being the NPC's shortest use time for the
  need as the server works it out (9.1), with the note "only by alternating eases and fails" for
  an NPC whose only failures are causes the server owns (`social_blocked`, or `locked_out` once the
  player has locked it out); printed "at once" when `n` is 1 and halved where the NPC has two needs
  that can fail (9.3).
  `prop_door` adds "stays open for the mission";
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
`share_login`, the PC for `borrow_session`, the door for `prop_door`. A resource `downIf`, and a
workstation's `affordance.offWhen`, is a node with an edge to each workaround of each NPC it can frustrate. So a chain reads
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
   server would refuse the reports. The feature scenarios use short parks and fast needs so
   each such beat takes one to four minutes of waiting. The needs clock is stepped only for the
   auto lock (a client rule), and such moves are marked "exercised, not earned". It is never
   stepped while an outage holds or a failure park is running: a stepped clock outruns server time
   (section 2), the NPC's next failure comes sooner than the server's floor allows, and the report
   is refused as `tooSoon`. `PLAYTEST.md` says this at the top of its script.
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
  `getState()`, which gains `frustration`, `tell`, `failed`, `visits` and `distracted`.
  Documented in `docs/test-bridge.md`.

### 11.1 `scenarios/test_access_work` (sub-slices U, A, B, H and L)

Shared set-up. `"officePresets": true` (the coffee station and the plain PC in W6 take their
presets). Policies: `managed` (`usb: "storage_blocked"`, `autoLockMin: 5`), `locked_down`
(`usb: "blocked"`), `lax`, `strict` (`maxAttempts: 3`); `defaultPolicy: "managed"`. Resources:
`email`; `finance_share` (`access` finance, `downIf: "finance_share_down"`); `printer` (`object:
"office_printer"`, `downIf: "printer_jammed"`); `intranet` (`kind: "intranet"`, `downIf:
"intranet_down"`, declared in `globalVariables` like every outage global here, X3's alone; with no `work_fail_intranet` pool its mutter comes from
`work_fail`). Roles: `roles.staff` is `{ "workNeeds": ["email"],
"frustration": { "perFail": 20 } }` and `roles.finance` is `{ "workNeeds": ["finance_share"] }`, and
every desk owner has the role `staff` (finance staff `["finance", "staff"]`) and a `work` need,
so every desk owner that works has a `work` plan and its uses are judged (`temp_user`, below, has
the role and no needs, so no plan). Each beat's NPC is its own: no NPC record serves two beats
with different set-ups, because one scenario file holds them all. No NPC in the scenario has a `needsRooms` leash. Every
PC an NPC works at, sign-in or plain, authors `"affordance": { "satisfies": "work", "useSeconds":
5 }` (a sign-in PC takes no office preset), and the hot desks author the same. Every desk owner
has `"needsDeferMin": 0.5` (a failure's park is 30 seconds), and every workaround in the beats is at 50 unless the beat says otherwise, so a
student sees the warning build before the act: the first failure gives `tell` 1 (level 20), the
second `tell` 2 and the pulse (level 40), and the third, about 70 seconds after the outage, brings
the workaround with its start line (level 60). Every owner's `work` need is fast
(`decayPerMin: 40`, `urgentAt: 50`, `initial: 60`: urgent after about 15 seconds) unless the beat
says otherwise, and every PC's `useSeconds` is 5. Outages are thrown with one switch object per
global carrying two `confirm_action`s with opposite conditions on it ("Switch it off" while the
global is false, "Switch it back on" while it is true), the safe toggle the lab's carried vest uses
(section 2). Two plain conditional actions on one object would flip twice, because conditions are
tested one action at a time.

**The mutter lines.** The scenario's top-level `chatter` ships the default mutter set of 5.5, one
or two lines per pool, every line under 40 characters and naming no person: `work_fail_fed_up`,
`station_fail`, `work_fail_no_access`, `work_fail_file_share`, `work_fail_email`,
`work_fail_printer`, `work_fail`, `usb_refused`, `wk_writes_down`, `wk_prop_door`, `wk_borrow`,
`wk_share_login` and `login_aloud`, with the lines quoted in 5.5 and 6.5. This is the set an author
copies. Every beat's "the mutter" below is one of these lines, and the validator's mutter warning
(section 10) finds a line for every cause every NPC here can meet.

**The borrowers.** Every NPC with a `borrow_session` (Ian, Rosa, Jake) authors `"screenHabit": {
"lockChance": 0 }`, so each leaves the hot desk signed in (6.4), and each one's own PC carries
`"lockChance": 1`, which wins over the habit there.

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| U1 Storage refused, then the kiosk | `usb_room`: Lena Fox with interests in `dev_usb` and `dev_badusb`; `lena_pc` (her post, accepts both, under `managed`); `kiosk_pc` (accepts `dev_usb`, under `lax`). On the lobby table: `kit_usb` (`usbClass: "storage"`) and `kit_badusb` (`usbClass: "hid"`) | Drop the storage stick: she carries it to her PC, `npc_use_refused:lena_pc`, a mutter, then to the kiosk, `npc_used:kiosk_pc`. Drop the keyboard-type device: her PC takes it, `npc_used:lena_pc` | None (the beat's tasks complete from the two events) |
| U2 Refused outright, and the player's own plant | `vault_room`: Priya Nair; `priya_pc` under `locked_down` is the only object that accepts her tag; `priya_dock`, a `requiresItem` object that names `locked_down` | A dropped storage stick is refused, put down by her PC and left there. Clicking the dock while holding the stick shows "USB devices are disabled on this PC." and the stick stays in the inventory | None |
| U3 A default policy does not reach a tray | `post_room`: Kofi Mensah with an interest in `dev_usb`; `lost_property_tray`, not a workstation and with no `policy`, accepts the tag | He carries a dropped stick to the tray and leaves it there with no refusal and no mutter, although the scenario's default policy blocks storage | None |
| W1 Work that succeeds | `ok_room`: Amy Cole, role `staff` (so `workNeeds: ["email"]`, email only, from the shared set-up), `amy_pc` | She works at her desk about every 15 seconds; `npc_used:amy_pc` carries `met: true`; no mutter, no icon | No `npcFrustration` entry for Amy |
| W2 An outage you can read | `share_room`: Dana Reyes, roles `["finance", "staff"]`, `frustration: { perFail: 34 }`, no workarounds; the breaker switches for `finance_share_down`; a coffee station | Within one use of the breaker being thrown she fails: the mutter names the share ("Share's down again."), `npc_use_failed:dana` names `finance_share` as `down`, and the blocked icon stays over her between failures. After the second failure the icon pulses (`tell` 2). On her third failure her mutter comes from the fed-up pool. Her `npc_use_failed` events are followed by a coffee `npc_used` sooner than her outage-free schedule gives (asserted by event order, not by time) | `npcFrustration.dana.level` 34, 68, then 100 |
| W3 Recovery | Same room, breaker reset | Her next use is met, the level eases by 10 for each met use, and the icon goes when it reaches 0 | `level` 90, then 80 |
| W4 The printer, and a chain | `print_room`: Omar Haddad needs `printer`; `office_printer` is in the open `copy_room` next door, with a lever that sets `printer_jammed`. `omar_pc` is a sign-in PC with `lockChance: 0`; his profile holds a note with the code for `copy_cupboard`, a PIN-locked cupboard in the copy room | His use fails and he walks to the printer once (`npc_checked:office_printer`); on his later failures he stays put. While he is away a click on his PC claims his session, the note gives the code, and the code opens the cupboard. The `PLAYTEST.md` script says how to re-arm the beat if the claim window is missed: reset the lever, wait for one met use, throw it again (a new outage, so a new check visit). The re-armed failure is counted although it comes well inside 30 seconds of the last one (the met use between is an ease, 9.1) | `sessions.omar_pc` a claim; the cupboard in `unlockedObjects`; `npcFrustration.omar.level` 20 (after a re-arm: 20, 10, 30) |
| W5 No access, and silence | `starter_room`: Kai Brennan, role `staff`, `workNeeds: ["+finance_share"]` | His work fails with `no_access` from his first use, with no player action. After the level reaches 100 the answer says `settled` and no further report is sent for him | `npcFrustration.kai.level` 100; the request count stops rising |
| W6 A PC out of order | `cable_room`: Ian Shaw, role `staff` (so a `work` plan, email), no leash; `ian_pc`, a sign-in PC, has `"affordance": { "satisfies": "work", "useSeconds": 5, "offWhen": "ian_pc_unplugged" }`; the wall socket switch sets and clears it. Also in `cable_room`: `pat_pc`, a sign-in PC owned through `"screenOwner": "temp_user"` (the plain account holder of H2) and marked `"private": true` in its authored `work` affordance, and `spare_pc`, a plain PC (`type: "pc"`, no `lockType`, the `desk_pc` preset's non-private `work` source) that nobody owns. Every PC Ian could reach is a desk (5.2), so the candidate filter, not the layout, is what keeps him off them | He does not sit down at a dead PC, and he does not walk to `pat_pc` or `spare_pc`: within one selection `npc_need_parked:ian` fires with `need: "work"`, `reason: "off"` and `targetId: "ian_pc"`, the mutter comes from `station_fail`, and no `npc_use_failed` fires. A door opened elsewhere does not wake his park; plugging the PC back in does (after one use time), and his next use is met | `npcFrustration.ian.level` 20, then 10 |
| W7 The outage bites at once | `slow_room`: Nia Patel, role `staff`, a slow work need (`decayPerMin: 1`, `urgentAt: 50`, `initial: 100`: left alone, first urgent after 50 minutes), the switches for `printer_jammed` and `workNeeds: ["+printer"]` | The player watches her work once (the room's sign says to wait for it), then jams the printer. Within about one use time she tries to work, fails and mutters about the printer, without waiting for her need to run down | `npcFrustration.nia.level` 20 |
| X1 The sticky note, and a second link | `note_room`: Mei Lin, an account; `mei_pc`, a sign-in PC with `lockChance: 1`; resource `rota` with a switch; `workarounds: [{ "at": 50, "do": "writes_down" }]`; her profile holds the door code for `records_nook` | Before the outage the sign-in screen shows no note. After the outage she fails three times: the icon appears after the first and pulses after the second. At the third she says "I'll never remember this one.", writes at her desk, a yellow note appears on the monitor, and `npc_workaround:mei` fires with `started`, then `done`. When she next leaves, the sign-in screen shows "<username> / <password>", it signs in, her desktop gives the door code, and the code opens the nook | `npcFrustration.mei.done` is `[0]`; `sessions.mei_pc` Mei by password; `unlockedRooms` has `records_nook` |
| X2 The propped door | `store_lobby`: Tom Fletcher, role `facilities`, with a card; `store_room` behind an `rfid` door that admits `facilities`, with Una Walsh inside; `store_wedge` (a fire extinguisher) hidden on `store_door_propped`; a workaround at 50 | Tom walks to the door, it opens, the extinguisher appears and `door_propped:store_room` fires. The player walks in | `unlockedRooms` has `store_room`; `encounteredNPCs` has `una`; the global is true on the server; `npcFrustration.tom.done` is `[0]` |
| X3 An event, with no warning by design | `event_room`: Ellis Ward, role `staff`, `workNeeds: ["+intranet"]`, `ellis_pc`, the switch for `intranet_down`, `frustration: { perFail: 50 }` and `[{ "at": 50, "do": "emit", "event": "ellis_gave_up", "setGlobal": "ellis_out_of_office", "noWarning": true }]`, the event mapped to a task; `ellis_ooo_note`, a note by his PC hidden with `revealOnGlobal: "ellis_out_of_office"` (an emit has no visit, so Ellis stays at his desk and the note says he has given up, not that he has gone). Amy in W1 is untouched | One failed use completes the task, with no `tell` 1 or 2 before it; the note appears; the validator's report says "no warning" for it | `npcFrustration.ellis.done` is `[0]`; `ellis_out_of_office` true |
| X4 Reload in the middle | During X2: as `npc_workaround:tom` fires with `phase: "started"`, the run sets the needs clock to manual, so Tom stops where he is, then reloads; later, again just after the door opens | After the first reload Tom, whose workaround was handed over and not spent, sets off again and props the door. After the second, the door is open and the extinguisher is shown | As X2 |
| H1 The hot desk, and a second link | `cable_room` again: Ian has `[{ "at": 50, "do": "borrow_session", "pc": "hot_desk" }]` and the borrowers' `screenHabit` (shared set-up); `hot_desk` is a sign-in PC in the lobby, unowned, with an authored `affordance` that satisfies `work`, under `managed`; Ian's profile holds a note with the PIN of `comms_cabinet` in the lobby | At his third failure at his unplugged PC he says "I'll use the spare PC.", gets up at once, walks to the hot desk and works there (met, so his level eases). A click while he sits there shows "Ian Shaw is using this PC". After he walks back a click opens his desktop, and the note's PIN opens the cabinet. The run then plugs his PC back in and, once his next use is met, steps the needs clock just past five game minutes: the desktop closes with "The screen locked" (exercised, not earned) | `guestSessions.hot_desk` is `ian`; `sessions.hot_desk` a claim, then gone; the cabinet in `unlockedObjects` |
| H2 Signed in when he arrives | The H run's own source: a readable note in an unlocked lobby drawer (a clue item, not a beat sign) gives the password of `temp_user`, an account the hot desk admits. The player signs in at `hot_desk` as that account and leaves the desktop open. Then Ian's PC is unplugged again | When Ian sits down the desktop closes with "Ian Shaw has signed in at this PC" and `pc_signed_out` fires with `reason: "displaced"`. After he leaves, a click opens Ian's desktop, not the temporary account's | `sessions.hot_desk` `temp_user` by password, then absent, then a claim for Ian |
| H3 The hot desk does not help | `borrow_room`: Rosa Lane, roles `["finance", "staff"]`, `rosa_pc`, a `borrow_session` to `hot_desk` at 50, the borrowers' `screenHabit`, and a second breaker switch for `finance_share_down`, which is thrown (the H run never enters `share_room`, so Dana is not loaded; W2's Dana keeps no workarounds) | At her third failure she walks to the hot desk, her use fails there too (`npc_borrowed_session:hot_desk` with `met: false`), and she still leaves a session that can be claimed | `guestSessions.hot_desk` is `rosa`; her level still rising |
| H4 Said out loud | `open_office`: Sam Okafor (an account) and Ruth Adeyemi at the far desk; `[{ "at": 50, "do": "share_login", "with": "ruth" }]` | With the player out of the room, Sam walks over and speaks; nothing is noted. On his next failed use, with the player beside Ruth's desk, a toast reads "Overheard: Sam Okafor" with his login, an evidence note is added, and `npc_overheard_login:sam` fires. The noted password then signs in as Sam at the hot desk | `sharedLogins` is empty after the first and `["sam"]` after the second |
| H5 Reload | After H1 and H4 | The hot desk shows the sign-in screen, the levels are kept, the evidence note is still in the notebook | `guestSessions` empty; `sharedLogins` kept |
| L1 The lockout chain | `lock_room`: Jake Brooks, role `staff`, the borrowers' `screenHabit`; `jake_pc` under `strict`, `lockChance: 1`; a `borrow_session` to `hot_desk_2` (as `hot_desk`) at 50 | While Jake is at the coffee station the player types three wrong passwords on his tile. When he returns to his locked screen his next use fails with `locked_out`, he hot-desks, and his session there is claimed. A second owner in the room whose screen never locks is locked out the same way and carries on working | `loginLockouts` holds Jake at `jake_pc`; `guestSessions.hot_desk_2` is `jake` |

`temp_user` is a plain account holder with no NPC behaviour (an NPC record in a closed side room
with `creds`, the role `staff` and no needs, so it has no `work` plan, no `metAt` and no work
warning, 5.2), so H2 needs nothing from another run.

Expected validator output: the "work never succeeds" warning for Kai, and nothing else. In
particular no "opens nothing" warning for Ian, Rosa or Jake (each authors a habit that leaves the
hot desk open), no mutter warning (the shared pools cover every cause), and no "satisfies no
`work`" warning (every station authors its affordance). Scripted
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
about 10 seconds, then about once a minute). The top-level `chatter` ships `social_blocked` ("Blocked. Of course.") with the
work pools and `wk_borrow` of 11.1, so every cause here has a line.

| Beat | Room and set-up | What should happen | Server record afterwards |
|---|---|---|---|
| F1 Posts and their facts are withheld | Lobby, before entering any room | Each profile shows its one authored post and nothing else | `feedRevealed` empty; the leak check reports that it checked every feed post and feed fact and found none in any response |
| F2 The phone at the desk | `jake_room`: Jake Brooks, `jake_pc` under `no_social`, a phone, a feed of three posts | Jake uses his phone where he sits and never gets up; a click on his PC says he is using it; `npc_used_phone:jake` fires. With the terminal opened once before, a toast says he posted. The terminal now shows his first feed post above the authored one, and clicking it notes `jake_pet_name` with its text | `feedRevealed.jake.n` is 1 |
| F3 The PC, where it is allowed | `lena_room`: Lena Fox, `lena_pc` under `lax` | She uses her PC for it (`npc_used:lena_pc` with need `social_media`, `met: true`); her first post appears | `feedRevealed.lena.n` is 1 |
| F4 Blocked and no phone | `omar_room`: Omar Haddad, `"phone": false`, `"screenHabit": { "lockChance": 0 }` (a borrower who leaves the kiosk open, 6.4), `omar_pc` under `no_social` with `"lockChance": 1`, a `borrow_session` to the lobby `kiosk` (a sign-in PC under `lax`, with an authored `affordance` that satisfies `social_media`) at 50 | His attempt fails with `social_blocked` and "Blocked. Of course."; at his second failure (default `perFail` 25) he says "I'll use the spare PC." and walks to the kiosk, uses it (met; his first post appears) and walks back. A click on the kiosk opens his desktop | `npcFrustration.omar`; `guestSessions.kiosk` is `omar`; `feedRevealed.omar.n` is 1 |
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
(the judged use and the `failed` turn-back, the park as the retry wait, visits, the outage kick,
mutters as grumbles, the `self` job) and
`docs/test-bridge.md` (the `access` functions and the new `getState` fields).

### Sub-slice U: the USB policy

**U-1. Policy module, needs refusal and the mutter.**
Files: `systems/pc-policy.js` (new, with `window.pcPolicy`); `systems/npc-needs.js`
(`_completeJob`: refusal, the move to another target, the put-down and the memory; `mutter(npcId,
topic)` over the existing grumble path (`_pickBark`, `_showSaying`, with `_grumble`'s
`ignoreCooldown` option), and a `PICTURE_CHATTER` entry for `usb_refused` (`blocked`);
`usbClass`, and `usbPolicy` through `window.pcPolicy`, in `describe`). The world bubbles already
draw a line with no partner (a grumble), so `npc-world-bubbles.js` is not edited.
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

**U-3. `test_access_work`, beats U1 to U3**: the scenario (with its `usb_refused` pool in the
top-level `chatter`, 11.1), `PLAYTEST.md`, static checks, the scripted run, the needs regression
captures.

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
none; no plan for an NPC with a resolved list and no `work` need; a use time from an affordance,
from a preset and from the 20 second default; the desk rule (each `isWorkstation` field, and a
plain `pc` with presets on and off); an NPC's places for a need and its shortest use time, with a
non-desk object shorter than its station; the causes the server owns, each alone and none.

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
accepted once the server's copy of the global is true; a first fail at once after `metAt` is
accepted (a station already off when the NPC's room loads, W6); a fail raises the level by the
resolved `perFail` and stops at 100; a second fail for the same need inside the park floor answers
`tooSoon`, and one for the NPC's other need is counted; **W4's re-arm**: a `down` fail, an ease a
use time later and a second `down` fail a use time after that, all inside the park floor, are all
accepted (levels 20, 10, 30); **an unplug during a met use**: a fail, then, a use time later, an
ease and an `off` fail for the NPC's own station in the same request, all accepted (the later fail
is measured from the first fail, not from the ease); a second `down` fail marked `rearmed` a use
time after the first, with no ease, is accepted, and one sooner than the use floor answers
`tooSoon`; a `rearmed` fail that lists `no_access` (alone or beside `down`), or `locked_out`, keeps
the park floor; **the server's own causes**: W5's Kai, reporting only `[{ id: "finance_share",
why: "down" }]` with `rearmed: true` while the global is true, keeps the park floor; a fail
naming a resource outside the NPC's resolved list, or another NPC's station, is refused; a fail
whose `object_id` is not one of the NPC's places (a desk phone with `useSeconds` 0, another
NPC's PC) is refused, and twenty `rearmed` fails naming the NPC's own station in one request are
floored by that station's use time, not accepted together; an NPC whose places have no authored
or preset use time is floored by the 20 second default; the park floor is `0.9 x needsDeferMin x 60 - 3`
and the use floor `0.9 x u - 3`, each tested one second either side; `GET /scenario` carries `hold`
for a need whose last fail is inside its floor, with the seconds left, and none once it has
passed; an ease for `work` from an NPC with an unadmitted resource is refused and lifts nothing;
an ease is floored at the use floor, stops at 0 and never returns `run`;
`tell` is 0, 1 and 2 at the right levels for an NPC with workarounds, with none, and with one whose
`at` is at or below `perFail` (straight from 0 to the workaround);
`settled` at 100; 21 reports in one request are refused; the level is in `GET /scenario`; a reset
clears it; a game whose `player_state` lacks the key answers as an empty one.

**A-4. Validator checks for A.**
Files: `scripts/validate_access_work.rb`.
Tests: the A errors, warnings and the work report line, including the mutter warning (an NPC with
an unadmitted resource and no `work_fail_no_access` or `work_fail` line is warned, even with a
fed-up line; one whose
`work_fail_file_share` pool is empty but `work_fail` has a line is not; nothing under `"chatter":
false`) and the station warning (a sign-in `needsHome` with no authored `work` affordance; a
coordinate `needsHome` with a PC owned through `screenOwner`, named in the warning; none for an
account holder with the role and no `work` need); the `needsDeferMin` warning for a `work` plan
and for a `social_media` need with `"phone": false`, and none for one with a phone; the report
line's earliest time with the park floor for an NPC with an unadmitted resource and the use floor
from the NPC's shortest use time otherwise; a clean fixture.

**A-5. The needs core.**
Files: `systems/npc-work.js` (new: `useVerdict`, `reachable`); `systems/npc-needs.js`
(`_completeJob`: the verdict and `_turnBack(s, 'failed')`; `TURN_BACK`: the `failed` row;
`_turnBack`: a reason that parks with no fallback parks the need; `_park`: `wakeOn` and `missing`
on the event, and `targetId`, `wakeOn` and `missing` on `s.parked[name]`; `onGlobalChanged`:
the targeted `wakeOn` wake before the early return at `:552`, by whether the recorded causes would
pass now (`reachable` for an `unreachable` one), and the targeted wake of an `off` failure park whose
station came back on, after one use time; `_wakeParked`: skips failure parks
and `held` parks (5.2) for all three of its callers; the `rearm` mark per need; `_giveUpReason`:
`off` for a judged need whose own station is off, before both null returns, the station read from
the record's `needsHome`; `_useCandidate` and `_queueCandidate`:
no desk but the NPC's own is a source for a judged need, except through a borrow; `_select`: the
`off` park's grumble unless this need is the fallback's own (`exclude?.need === name`), and the
counted `off` park's drain;
`_grumble`: the `{ ignoreCooldown, icons }` options; `_grumbleTopic`: the judged-need pool order;
`PICTURE_CHATTER`: the new pools' pictures;
`_tickNpc`: visits and the outage kick (skipping every parked need, waiting while the home is
provisional); `enqueueVisit` and `npc_visit_dropped`; `_claims` skipping
visits; the pools and their order through `_grumble`; `mutter`; `applyFrustration`;
`restoreFrustration`, applied in `register`, with each need's `hold` as a `held` park; `getState`; in `createEngineWorld`: `useVerdict`,
`reportUse`, and `desk` in `describe`).
Tests (`test/js`): `npc-work.test.mjs` (new): the verdict for each failure and several at once; a
need with no `routes` is reachable, `[]` is not, `[[]]` is, a route with no truthy global is.
`npc-needs-work.test.mjs` (new), on the stub world: **the probe first**, that `_abortJob` from
the `using` phase frees the station and leaves the NPC standing; a failed use restores nothing,
emits no `npc_used`, emits `npc_use_failed` and `npc_turned_back` with `reason: "failed"`, grumbles,
skips `revealOutput`, drains the other needs, parks the need for `needsDeferMin` (no pressing
bubble, not selected), and reports once; **on one fixture**, the park wakes when its `downIf`
global clears (in a world where no `offWhen` object has ever been seen), does not wake when a door
opens, a room loads or an unrelated coffee machine comes back on, and a `no_access` park, or a park
whose failure lists `no_access` beside a `down` that clears, waits out its time; a park on a need
with routes `[["a"], ["b"]]`, both globals on, wakes when `a` alone clears; a station switched
off while the NPC sits at the desk gives one `off` park with the station as `targetId`, one report,
one `station_fail` grumble and the drain, is not woken by a door, and is woken by the station
coming back on, retrying one use time later; a station switched off during a use lets that use
finish and judges it on its resources; **the dead PC parks whatever is in reach**: own PC off, a
colleague's `private` PC and a busy plain PC (a desk by its preset) in reach, no leash, gives
exactly one `off` park, with no wait on the busy PC and no `private_skipped` silence; an `off`
turn-back that finds a non-desk source (a tablet) counts nothing and grumbles once; an unowned
sign-in PC and a free plain PC, each with a `work` affordance, are never chosen for a judged
`work`, and are chosen as today for an NPC with no plan; a fail after a wake or a met use carries
`rearmed`, and one after a timer expiry does not; a coffee machine switched off still parks with
`no_source` and wakes exactly as today; a met judged use with frustration reports an ease and a met coffee use does not, and a
coffee or carry use's `npc_used` payload has no `met`; the outage kick: a need at 90 drops to
`urgentAt` when its `downIf` global, or its station's `offWhen`, turns on, once per change, and the
NPC fails within one use time; a global already on at `register` kicks too, and for a start-room
NPC whose station registers after it the kick waits for the home to resolve and then gives a
counted `off` park with its line, never a `no_source` one; a parked need, whatever the park's
reason (`off`, `failed`, `no_source`, `avoid`, `held`), is not kicked, keeps its level and is
tried when its park ends; **the `off` line inside another need's fallback**: a coffee turn-back
whose fallback select parks an urgent `work` `off` says the `station_fail` line once, and an `off`
turn-back for `work` itself grumbles once, not twice; **a reload's hold**: an entry with `hold`
parks that need `held` for that long, uncounted and silent, a door or a room load does not wake
it, and the first fail comes after it ends; the pool is chosen from the `tell` held at the
failure (fed-up at 2, the cause's own pool below it, `work_fail_<kind>` falling back to
`work_fail`), each as a line when the scenario's pool has one (with the chatter cooldown not yet
run out) and as that pool's own picture when none does, and the decision log's `grumble:` names
it; a check
visit walks to the object once per outage, emits `npc_checked` and `npc_visit_done`, emits no
`npc_used`, claims nothing and leaves the post like any trip; a visit waits for a running job; a
late answer changes no decision; a level handed over before the NPC is registered is applied when
it registers. Every existing needs test passes unchanged (including the whole-payload assertion at
`test/js/npc-needs.test.mjs:130` and the slice 14 and 18a turn-back and park tests), and the decision log of the `needs-sims-world` fixture is byte
for byte what it was.

**A-6. Client surfaces and tooling.**
Files: `systems/npc-reports.js` (new: the queue, one request every two seconds, `settled`, the
forced sync on a plan global's change, the `stale` resend, `rearmed` passed through from the needs
state, answers to `applyFrustration`);
`api-client.js` (`npcFrustration`); `core/game.js` (install the reporter; hand `npcFrustration` to
`restoreFrustration`); `systems/npc-action-icons.js` (the `blocked` icon by `tell` and its pulse;
`npc-work` during a visit); `systems/npc-needs-debug.js` (the `F` bar); the tooling in section 11.
Tests: `npc-reports.test.mjs` (new): reports are sent together, never more often than every two
seconds and never more than 20; no fail is sent for a settled NPC until an ease has been; a change
of a plan global forces one state sync before the next batch; a stale answer triggers one state
sync and one resend. `npc-action-icons` and `npc-needs-debug` tests: the
icon at each `tell`, the bar. The leak scanner's unit test, `playtest-verify-run-access.test.mjs`
and `test-bridge-access.test.mjs` gain the new keys.

**A-7. `test_access_work`, beats W1 to W7.** The scenario's new rooms, its shared set-up (roles,
the stations' affordances, the default mutter pools of 5.5 in its top-level `chatter`),
`PLAYTEST.md` (with the rule that the needs clock is never stepped while an outage holds), static
checks, the scripted runs, the watch-it-happen run, the needs regression captures, then U's run
and the first slice's three suite runs.

**A-8. Documents**: "Work, frustration and workarounds" in `README_scenario_design.md` (resources,
work needs, outages and the kick, what the student sees, the timing report, that a sign-in PC
needs an authored `work` affordance, and the mutter pools: every pool name, when it is said, what
it should say, the default lines to copy from `test_access_work`, and that the engine says
nothing of its own);
`docs/achitechture/NPC_NEEDS_SYSTEM.md` (the judged use, the `failed` turn-back, the park as the
retry wait, visits, the kick, mutters as grumbles); `docs/test-bridge.md` (`work`, `reports`, the new `getState` fields).

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
Files: `systems/npc-workarounds.js` (new: hears `npc_workaround_due` and `npc_visit_dropped`,
starts the visit or the event, has the NPC say its start line through `mutter`, emits
`npc_workaround`, calls "done" or "dropped" through `window.ApiClient.npcWorkaround` with `index`
and `hand`, retries a failed request, applies the answer: the note mark, the door, `setGlobal`;
sets every done `setGlobal` again on a load); `systems/npc-needs.js` (the `wk_` pools only).
Tests: `npc-workarounds.test.mjs` (new), with a stub API: each kind starts the right visit, says
its start line, emits `started` then `done`, and applies its answer; `npc_visit_dropped` is
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
from `AccessIdentities.screen_always_locks?` on the guest's saved `screenHabit`, no habit
counting as careful, 6.4; the function itself as 9.1's section 5.2 defines it, if 9.1 is not
built); `games_controller.rb` (`login` passing `claim: "guest"`). These edits come after
engine E4's edits to `capture_secrets_for_client`, `account_capture_passwords` and
`capture_route?` (section 13), and `sharedLogins` is read there as a proof that holds.
Tests: repeating workarounds in turn, a heard `share_login` staying in turn and `sharedLogins`
growing once; `borrow_session` done writes `guestSessions` and clears a held session at that PC;
each guest claim refusal (no guest, a session held, no account, not admitted, `autoLockMin: 0`, a
careful guest: one with no `screenHabit`, one with `lockChance` 1, and a `locksScreen: always` guest
where 9.1 is built); `leavesOpen` is false in `run` for each careful guest and absent for a guest
with `{ "lockChance": 0 }`, a `locksScreen: "never"` one where 9.1 is built, and one with a
`lockIfAwayOverSeconds`; `share_login`: heard with a `room_id` that is the
colleague's room and unlocked answers the capture, the line and the note; heard with another room,
or with the colleague's room still locked, is taken as not heard; `player_state.currentRoom` is
not read; `/capture_secrets` serves it only after a heard "done", with E4's proof rule in force;
`guestSessions` empty after `GET /scenario`; the rest of the no-exposure test.

**H-2. Validator.** The H errors and warnings. Tests: the fixtures, including a borrower with no
`screenHabit` (warned: it opens nothing) and one with `{ "lockChance": 0 }` (not warned).

**H-3. Needs and runner.**
Files: `systems/npc-needs.js` (`setBorrow`, `s.borrow` as the first candidate in `_useCandidate`,
unparking the need, the 60 second start limit, the `borrowed` flag, a failed borrowed use not
reported, `npc_sat_at`, `npc_borrowed_session` with `met`, `userOf(objectId)` skipping visits,
`cellBeside` in the adapter and visits to an NPC); `systems/npc-workarounds.js` (the borrow, the
share with its heard test and `room_id`, the toast, the evidence note and the capture).
Tests: `npc-needs-work.test.mjs`: a borrowed PC is chosen ahead of the home object for the failing
need only; the NPC gets up without waiting out the retry; a borrow that cannot start in 60 seconds
is dropped; a failed borrowed use still emits `npc_borrowed_session` and sends no report;
`leavesOpen: false` emits none; a visit to an NPC stands beside them and is not that PC's user.
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
Tests: the fixtures, including the `needsDeferMin` warning for a `social_media` need with
`"phone": false` and none with a phone; a `guessable` password whose parts are sourced only by a feed post's text and
a feed fact's text passes 9.1's check; the short-text warning for a feed fact of under 12
characters and for one inside another shipped string.

**C-3. The need in the needs core.**
Files: `systems/npc-needs.js` (the candidate order of 8.1, with the phone taken in `_select` after
`_useCandidate` finds nothing and before any park; the dead-station rule and the outage kick for
`social_media` only with `"phone": false`; the `self` job in `_startJob`,
`_advanceJob`, `_completeJob`, `_tickNpc`'s freeze and block paths and `getState`; `distracted`);
`systems/npc-work.js` (the `social_media` verdict); `systems/npc-sight-challenge.js`.
Tests: `npc-needs-social-media.test.mjs` (new): each candidate in its order; a phone use at the
post emits no `npc_left_post` and keeps `atPost`; one on the walk home resumes the walk; a blocked
PC with no phone fails and raises frustration; a blocked PC with a phone never fails; an own PC
switched off sends an NPC with a phone to its phone (no park, no report, no kick) and parks one
with `"phone": false` `off`, counted, with its line; a
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
| U | Needs core | U-1 | `systems/pc-policy.js`, `systems/npc-needs.js`, their tests | At once |
| U | Surfaces and authoring | U-2 | `systems/interactions.js`, the schema, `scripts/validate_access_work.rb`, `scripts/validate_scenario.rb`, their tests | The schema and validator at once; the plant when `pc-policy.js` is committed and engine E3 and E4 have committed their `interactions.js` edits |
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
| L | One builder | L-1, L-2 | `lib/break_escape/access_work.rb`, `game.rb`, `systems/npc-work.js`, `systems/npc-reports.js`, `systems/npc-needs.js`, `systems/workstation-state.js`, `README_scenario_design.md`, the scenario | After H's runs pass (the user said yes to decision 14 on 2026-11-10) |
| C | Server | C-1 | as A's | At once |
| C | Validator | C-2 | `scripts/validate_access_work.rb`, `scripts/validate_npc_needs.rb`, the schema, `lib/break_escape/npc_habits/clues.rb` (two lines) | At once |
| C | Needs core | C-3 | `systems/npc-needs.js`, `systems/npc-work.js`, `systems/npc-sight-challenge.js` | At once |
| C | Feed and browser | C-4 | `systems/social-feed.js`, `api-client.js`, `core/game.js`, `osint-browser-minigame.js`, `systems/npc-action-icons.js` | At once |
| C | Tooling, scenario and documents | C-5, C-6 | `tools/playtest/`, `systems/test-bridge/access.js`, `scenarios/test_access_social/`, the documents | The tooling at once; the scenario after the others |

Each stream is one builder with review rounds after it (`AGENTS.md`: at least two, at most five).
Scripted runs are split from building: the scenario's builder writes the scenario and
`PLAYTEST.md`, and a separate tester runs it.

**Against the sibling plans.** The order on every shared file is fixed: **the engine plan's
feedback streams first, then 9.3a, then 9.1, then this slice**, one at a time. The engine plan's
streams (E1 to E5, its section 10) are a separate build; of them, E1's items 2 and 7, E3's
inventory menu and dropped sprites (5a, 5b) and E5 are built, E1's item 3 (the body rule), E3's
tray refresh and E4 are to build, E2 runs only on the user's word and E2b is held. 9.3a's server
steps 2 to 4 are built. A builder re-reads the file just before editing, edits only its own
block, never reformats, and commits with explicit paths. The files this slice shares, with the
order on each:

| File | Also edited by | Order |
|---|---|---|
| `app/models/break_escape/game.rb` | 9.3a S (built in part: `NetworkAccess`, withholding, remote sign-in); 9.1 F and A; engine E3 (`add_item_to_room!`), E4 (`capture_secrets_for_client`, `account_capture_passwords`, `capture_route?`, a line in `add_item_to_room!` and in `attempt_login!`), E2b (`generate_scenario_data`, held) | Engine streams, then 9.3a, then 9.1, then this slice. On the three capture methods, **E4 before H-1**: H-1 adds `sharedLogins` as a proof that holds in E4's rule. Different methods otherwise |
| `app/controllers/break_escape/games_controller.rb`, `config/routes.rb` | 9.3a S (its network routes); 9.1 A (`login_accounts`); engine E3 (`CLIENT_ITEM_FORBIDDEN_FIELDS`, `item_add_params`), E4 (the `remove` branch of `inventory`) | Engine streams, then 9.3a, then 9.1, then this slice |
| `scripts/validate_scenario.rb`, `scripts/scenario-schema.json` | Engine E1, E3, E4; 9.3a T; 9.1 F, B and D | Engine streams one at a time, then 9.3a T, then 9.1, then this slice; each adds its own block |
| `scripts/validate_npc_needs.rb` | Office life; 9.1 B (one keyword and one line in `check_lock_habits`) | 9.1, then this slice (C-2: `social_media` and the satisfies check) |
| `scripts/generate_dungeon_graph.rb` | 9.3a T; 9.1 B and D | 9.3a, then 9.1, then this slice |
| `systems/npc-needs.js`, `systems/npc-needs-chatter.js` | Office life's own later slices | This slice edits `npc-needs.js` in the methods sections 5 to 8 name and does not edit `npc-needs-chatter.js`: a mutter is spoken through the existing `world.speak`. Re-read both before A-5, H-3 and C-3 |
| `systems/interactions.js` | Engine E3 (built: the held-item menu through `inventory-menu.js`), E4 (the `consumesItem` block, the `objectId` on the two `triggerOnInteract` calls); 9.3a C1 (the jack and `network_link` branches) | Engine streams, then 9.3a C1, then U-2, whose edit is the `requiresItem` branch, a later branch than all of them |
| `systems/action-menu.js`, `ui/interaction-menu.js`, `systems/inventory-menu.js`, `systems/item-drop.js`, `systems/table-drop.js`, `systems/inventory.js` | Engine E3; 9.3a C1 or C2 | Not edited by this slice. A device an NPC finds is dropped through `item-drop.js` (which snaps it to a table, `table-drop.js`) and picked up by the needs system as today |
| `systems/unlock-system.js` | Engine E1 (built: the RFID door sound); 9.3a C2 (remote sign-in); 9.1 A (the desk branch of `openLoginSignIn`) | 9.3a, then 9.1, then H-4 (`interactLoginPc`'s claim kind only) |
| `systems/pc-sessions.js`, `api-client.js` | 9.3a C1 and C2; 9.1 A | 9.3a, then 9.1, then this slice |
| `core/game.js` | 9.3a C1; 9.1 A | 9.3a and 9.1 first; one or two lines each |
| `systems/npc-office-visuals.js`, `systems/npc-world-bubbles.js` | Office life; engine E2 (one constant or function, only on the user's word) | Not edited by this slice: a mutter is a grumble, which both already draw |
| `systems/apply-actions.js` | Engine E4 (the `objectId` option, `remove_item`'s `used_on`); 9.3b (its implant case) | Not edited by this slice: outage switches use `confirm_action` pairs (11.1), not a new action |
| `tools/playtest/lib/access_leak_scanner.rb`, `tools/playtest/verify-run.rb`, `tools/playtest/access-leak-check.rb` | 9.3a T; engine E4 (the device DOM in `access-leak-check.rb`); 9.1 E | E4, then 9.3a T, then 9.1 E, then this slice; own checks only |
| `systems/test-bridge/access.js`, `systems/test-bridge/index.js`, `docs/test-bridge.md`, the playtest harness | 9.3a T (`access.js`); engine E3 (built: `inventoryAct`, the harness, its paragraph) | E3 and 9.3a first; this slice adds its own functions to `access.js` and its own paragraph |
| `README_scenario_design.md` | Engine E1, E3, E4, E5; 9.3a T; 9.1 D and Docs | Each owns its own section; this slice adds "Work, frustration and workarounds" |
| The no-password test, `access_model_withholding_test.rb` | 9.1 | 9.1, then this slice |

`systems/workstation-state.js`, `systems/npc-work.js`, `pc-policy.js` and the osint browser are
edited by this slice only. If any two builds run at the same time, no two builders hold one of the
files in the table at once.

## 14. Effects on existing scenarios

No existing scenario declares `resources`, `roles`, `workNeeds`, `workarounds`, `feed`, `usbClass`
or a `social_media` need, so no NPC has a `work` plan, no use is judged, and none changes its
behaviour. (The only `offWhen`s are `test_needs_sims`' coffee machine and two copiers, none on a
workstation.) What each change
touches:

| Change | Who sees it |
|---|---|
| `npc_used` gains `met: true` on a met judged use | Only judged uses: an NPC with a `work` plan or a `social_media` need. No existing scenario has one, so every existing `npc_used` payload is unchanged |
| The outage kick | Only an NPC with a `work` plan: none today |
| The use verdict, the `failed` turn-back, the drain, visits | Only an NPC with a `work` plan: none today |
| An `off` park reason for a judged need's own station, its grumble and drain, and failure parks skipped by the general wake | Only an NPC whose own workstation has an `affordance.offWhen` and who has a `work` plan or a `social_media` need: none today. `test_needs_sims`' switched-off coffee machine and copiers park and wake exactly as they do now |
| No desk but the NPC's own is a judged-need source except through a borrow; a dead own station always parks `off` | Only an NPC with a `work` plan or a `social_media` need: none today. `describe` gains `desk`, which no existing choice reads |
| `_wakeParked` skips failure parks and `held` parks; the targeted wakes | Only failure parks and a reload's holds, which only judged needs have: none today. Every existing park wakes from the same three callers as now |
| The outage kick skips every parked need and waits while a home is provisional | Only an NPC with a `work` plan, or a `social_media` need and `"phone": false`: none today |
| `_grumble`'s options and the new `PICTURE_CHATTER` entries | Only a judged failure, a refused device or a workaround passes the options or uses the new topics; every existing grumble is called as now |
| Mutters and the new pools | Never chosen without a failed or refused use. Lines are scenario-authored, so no existing scenario gains a line. A scenario with `"chatter": false` gets no mutters and still gets the icon |
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
| Frustration and workarounds in the needs system | The level and the list live on the server; the needs system reports failures, which are office life's parks and one new turn-back reason |
| "the PC's network reaches the resource's network; always true until networks exist" | The server composes `routes` into each NPC's plan; with no `routes` a resource is reachable |

**With 9.1 (awareness and habits).** Each point has one answer, and 9.1's section 14.2 says the
same.

| Topic | Settled as |
|---|---|
| The sticky note | 9.1's channel and helpers: `written_down?(npc)` decides; `login_postit_for(pc)` is the only source of the text, "<username> / <password>"; `GET /login_accounts` carries it, `no-store`; room data carries `hasPostit` only; an authored `postitNote` or `showPostit: false` wins; the picture is `postit-marks.js` with `mark(pcId, on)`. This slice adds one clause to `written_down?` and answers `{ pcId, hasPostit: true }` from its workaround route. It writes nothing into room data and adds no habit overlay. One addition to 9.1's channel: the proximity label of a marked PC says it has a sticky note (`postitMarks.label`, keyed on the scenario id, never carrying the note's text) |
| Who builds the note | 9.1, in the expected order. If this slice is first, sub-slice B builds the same pieces from 9.1's section 5.3 and 9.1 adds the habit clause |
| `roles` | Shared. 9.1 builds and reads `roles.<role>.awareness`, and deletes the whole top-level `roles` key from the bootstrap. This slice owns `workNeeds`, `frustration` and `workarounds` under the same key; its own deletion of `roles` is then already done, and it keeps the line only for the case where it lands first. Whichever lands first adds `roles` to the schema (with `additionalProperties` open) and the validator's top-level list; in the expected order that is 9.1. Both walk roles in `identity_roles(npc)` order, authored roles first and `staff` last. `roles.<role>.habits` does not exist |
| The awareness warning on a post | It reads `NpcHabits.level_of(npc, scenario)` where 9.1 is built, so a level from a role counts; the authored string otherwise |
| A guest and `locksScreen` | **The guest rule: an NPC who is meant to leave a hot desk session open must say so.** A guest is careful when 9.1's `AccessIdentities.screen_always_locks?` with no PC field is true for it, and that includes a guest with **no `screenHabit` at all**, exactly as `decideLocked` locks for an owner with no habit (`workstation-state.js:129, 134`). A guest leaves the session open only with an authored `screenHabit` whose `lockChance` is below 1 (`{ "lockChance": 0 }` is the usual one) or one filled from `locksScreen: "never"` or `"sometimes"`; a habit with a `lockIfAwayOverSeconds` counts as leaving open, with no roll at a borrowed PC. The server sends `leavesOpen: false` in the `borrow_session` hand-over for a careful guest, its guest claim refuses on the same test (check 7, 9.1), and this slice's validator warns on the same test that the borrow opens nothing. The boolean is in the hand-over, not in the standing plan. No habit reaches the browser. 9.1's filled `screenHabit` decides how an owner leaves their own PCs, and the same habit decides how that person leaves a borrowed one; this slice changes no habit mid-game. 9.1's builder writes its section 14.2 row, its `screen_always_locks?` tests and any borrower in its own scenarios to this rule |
| What `borrow_session` is | A guest session at an unowned sign-in PC. It never changes how an owner leaves their own PC, so it needs no per-leave override and no change to `pc_always_locks?` |
| The claim check | 9.1 fixes `pc_always_locks?` to read the owner's `screenHabit` (its 5.2) before this slice. Sub-slice H's guest claim and L's owner claim rest on the fixed check |
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
| A station that is down | For NPC work, office life's `affordance.offWhen` on the workstation (5.1); this slice adds no `downIf` on objects. 9.3a has no outages for the player and no "not responding" row. This slice changes nothing in 9.3's view or `desktop_request_allowed?` (this plan's section 9.1) |
| Server-set globals | A workaround's `setGlobal` is the one global the server sets itself; 9.3 allows for it (its 13.2) |
| Validator layout | Each slice keeps its checks in its own file (`validate_network.rb`, `validate_access_work.rb`) and touches `validate_scenario.rb` only for a `require`, a call and the known-field lists |
| `requiresReach` | Not used by either slice |
| Build order | 9.3a, then 9.1, then this slice |

**With 9.3b (links, outages, Wi-Fi, port security, implants: an ordered design, built later).**
Everything this slice and 9.3b share is built by 9.3b, so nothing here waits for it:

| Topic | Built by 9.3b |
|---|---|
| Routes with globals in them | `reach_conditions` returns the `downIf` globals of every network on each route (its 12.1, 12.2); this slice's `reachable` already reads them, and its kick (5.6) and forced sync (5.4) already watch every route global. No change here |
| A station that is down, seen from the network | A sign-in host whose `affordance.offWhen` holds listed "not responding" in `network_view`, and `desktop_request_allowed?` refusing it. 9.3b owns outages for the player (its 12.2), so it adds both lines when it adds "no route" |
| The USB check on an implant | `POST /network/implant` refuses a device whose `usbClass` the PC's policy refuses (its 12.5), through a Ruby `usb_refused?` beside `effective_policy` (`game.rb:1400`) that reads this slice's table; with a validator warning for a `grant_foothold` whose PC refuses its device. The refusal is at the use, never at the drop. If the user schedules 9.3b before this slice, U-2 adds it |
| Feed posts as a place a Wi-Fi key can be learned | 9.3b's "the key appears nowhere" warning reads `Clues.readable_texts`, to which this slice adds feed texts (C-2) |
| Outages | A `downIf` (on a network or a resource) means the same in both: the global truthy, by JavaScript's rule, means down. An object's outage is office life's `affordance.offWhen` in both. This slice owns what an outage does to NPCs; 9.3b what it does to the player's reach |

**With the engine plan (`PHYSICAL_PENTEST_FEEDBACK_PLAN_ENGINE.md`).**

| Topic | Settled as |
|---|---|
| Shared files | Section 13: the engine streams come first on every shared file; E3 and E4 before U-2 in `interactions.js`; E4 before H-1 on the three capture methods. This slice edits neither the bubble renderer nor `npc-office-visuals.js` |
| A heard login is a capture | `share_login` records its capture through `window.recordSECapture`, so it lands in `se_captures` and is a row in the capture log's Credentials section (its section 6) with no further work, beside the evidence note |
| `sharedLogins` and the proof rule | E4 serves an account's captured password only when the capture route's `proof` holds (its section 6). An account holder in `sharedLogins` is a route whose proof holds: the server's own record of a heard "done". It is as strong as that client claim (6.5), the same strength as E4's `planted` and `dropped` proofs (the server's record, not sight of the act). H-1 adds this as one case in E4's check, after E4 |
| Server-made items | This slice makes no inventory item. The note mark, the guest session and the feed are not items, so E4's holder rules are untouched |
| `apply-actions.js` | Not edited by this slice (11.1); E4 and 9.3b hold it |
| A plant that removes the item | The lab's drop box removes its item with a `remove_item` action and no `consumesItem` (E4 records a plant from `remove_item`). Sub-slice U's player-plant check sits in the `requiresItem` branch before any action runs, so it governs both shapes |

**For the siblings' own text.** Settled above; the sibling plans say the same: 9.1 gives the
order (engine streams, 9.3a, 9.1, this slice), names the guest boolean `leavesOpen`, sent in the
hand-over, and fixes the claim check for `screenHabit` (its 5.2 and 14.2); 9.3 writes the feed as
`feed.posts[].text`, puts the USB refusal at the use, not the drop (its 12.5), names `displaced` as
a way a remote session ends (its 13.2), and leaves "not responding" and the station outage to
9.3b. The engine plan's shared-files table lists this slice only as "9.2 re-reads every file"; the
orchestrator adds the rows of section 13 there.

## 16. Decisions

**Decided** (orchestrator, under the user's latitude; the user can overrule any):

| # | Decision | Taken |
|---|---|---|
| 1 | Where a written-down password is served | Slice 9.1's channel: `hasPostit` in room data, the text only from `GET /login_accounts`, `written_down?(npc)` deciding, the workaround answering `{ pcId, hasPostit: true }` |
| 2 | Feed secrecy | A feed post and the fact it carries are withheld together until the post is served; the leak scanner checks both and is tested to fail |
| 3 | Reach | Composed on the server from 9.3; no topology and no resource `network` in the browser; "reachable" when the scenario has no `networks` |
| 4 | The cut | USB policy first, on its own; then work, outages and frustration; then workarounds in two parts (note, door and event; then hot desk and shared login); then lockout as a cause; social media last |
| 5 | A tampered browser | The residual in 9.3 is accepted, as it is for the engine's other client-reported hand-overs, and reduced by server-time pace floors, request ceilings, spent-once hand-overs, the server's own check of each cause, and the opened-room bound on a heard login |
| 6 | Visible frustration, and a shared login that explains itself | Required, from existing art: the `blocked` icon by `tell`, the mutter pools by cause and kind with the fed-up tier and a picture of their own, a start line for each workaround, the "Overheard" toast and evidence note |
| 7 | `roles` | 9.1 builds `roles.<role>.awareness`; this slice owns `workNeeds`, `frustration` and `workarounds` |
| 12 | What room data says about resources | An NPC's `work` plan carries resource ids, `kind` and global names, never display names. Nothing in the browser needs a name, and it keeps the plan inside 9.3a's secrecy rule with no exception |
| 13 | The USB policy's values | Three values with `usbClass` (`storage`, `hid`), and a refused NPC takes the stick to the next machine. One extra field, and two real lessons: storage blocking does not stop a keyboard-type device, and a refused stick travels to the machine nobody manages |
| 15 | Art | Existing art only for the build (`npc-blocked`, `npc-social`, `npc-work`, `notes_postit1`, `fire_extinguisher1`, no phone pose). New 16 px icons or a phone-in-hand pose cost money and are proposed to the user one at a time once the behaviour is approved |
| 16 | A member of staff on their phone is distracted | `los.challengeOnSight` does not fire while on the phone (beat F8). Opt-in per guard, last step of C, and the validator says the guard can be walked past every period of the need |
| 17 | First real use | No existing scenario changes in this slice. The lab's lesson is physical and it already has edits queued from the content plan, 9.3a and 9.1 |
| 18 | When an outage is caused | The NPC's `work` need drops to urgent at once (the outage kick, 5.6), so the student sees cause and effect within one use, not up to a need's whole period later |
| 19 | Where 9.3b's contacts with this slice are built | In 9.3b: routes with globals, a station "not responding" in the network view, and the USB check on an implant (section 15). This slice builds nothing that needs 9.3b |
| 22 | Where the mutter lines live | In the scenario's own pools, scenario-authored, as office life requires (it ships no spoken text). The slice ships a small default set in its feature scenarios (`test_access_work`, and `social_blocked` in `test_access_social`) for authors to copy, the author document lists every pool, and the validator warns when an NPC with a `work` plan or a `social_media` need has no line for a cause it can meet. The student must hear what they broke. Settled by the orchestrator, 2026-11-10 |
| 23 | A guest at a hot desk with no screen habit | Careful: it signs out. An NPC meant to leave a hot desk session open must say so, with an authored `screenHabit` of `lockChance` 0 or 9.1's `locksScreen: "never"`. It is the owner rule of `decideLocked`, so one rule covers owners and guests; the feature scenarios' borrowers author it and the validator's expected output follows. Settled by the orchestrator, 2026-11-10 |
| 24 | The pace floor after a cleared cause | A later fail is measured from the last accepted fail only. It is held to the park floor unless an accepted ease, or a re-arm while no cause the server owns holds for that NPC and need (the server works these out itself, whatever the report lists), lies between; then to the use floor, from the NPC's shortest use time for the need. Every cause and object a report names must belong to the NPC. A toggled outage and an unplug during a met use count every time, and the floors keep binding on causes the server owns. Taken by the orchestrator, 2026-11-10 |

**Planner decisions** (the user can overrule any):

| # | Decision | Taken, and why |
|---|---|---|
| 8 | An NPC sitting down at a hot desk where the player holds a session | The NPC's sign-in ends the player's session, with "<name> has signed in at this PC". It is what a shared PC does, the message explains it, and it keeps the session the NPC then leaves behind reachable. Leaving the player's session in place would hide the opening behind the player's own old desktop |
| 9 | Where frustration and workarounds live | On the server, handed over when due. It keeps "what will this person do under pressure" out of the browser until it happens, and the level survives a reload. The cost is a batched report request, at most one every two seconds while something is failing, and none once an NPC is settled |
| 10 | The need's name | `social_media`. No existing scenario or stored needs capture changes |
| 11 | A propped door | Stays open for the mission. Doors cannot close today; closable ordinary doors are a door engine change of its own |
| 20 | How a failed use is built | On office life's failure path: a broken PC or printer is its `affordance.offWhen`, the wait before retrying is its park (`needsDeferMin`), the line is its grumble, and a failure that belongs to the person (no access, a share that is down) is one new turn-back reason, `failed`, that parks. No second failure path, no retry field of this slice's own and no mutter state | One way for an NPC to fail, wait and complain, which office life already tests and the player already reads |
| 21 | Walks with no need | Called visits, so they are never confused with office life's print errands | The word "errand" already names a carry job in the needs system |

**For the user.** One question. The plan is written as if the recommendation is taken, and the
sub-slice it governs is last but one in the build order, so it holds nothing up: U, A, B, H and C
do not depend on it.

| # | Question | Options | Recommendation |
|---|---|---|---|
| 14 | Lockout as a cause (sub-slice L) | Build it; or leave it out | **Build it (the user said yes, 2026-11-10).** It is the one chain started from a sign-in screen, the one cause the server verifies, and it teaches that a lockout policy is a denial of service anyone at the keyboard can cause. It needs the user's explicit yes because it tells the browser something about an account: when the owner returns to a locked screen at a PC where the player has caused a lockout, the player learns whether the username they locked out was the owner's. A modified browser can ask that at any time after the lockout, not only at the owner's return (9.3). The sign-in screen itself never says which usernames are real, no list of locked-out accounts is sent, and a browser that has caused no lockout never asks |

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
- **A first-fail floor**, whether tied to the use time or to the need's decay from `initial`. The
  outage kick and a station already off when the room loads mean an honest NPC can fail at its
  first selection, so any such floor would refuse honest play; the first fail has no floor beyond
  the NPC being known, and "at once" is printed where it applies (9.3, section 10).
- **Engine default mutter lines** in `public/break_escape/js/data/`. It would reverse office life's
  rule that the engine has no spoken text, and the lines would then be voiced for every scenario
  whether the author wrote them or not. The lines are scenario-authored instead (decision 22).
- **"No screen habit leaves a borrowed PC open"**, so borrowers need no field. It would make a
  guest the one person whose silence means "open", against the owner rule every other screen
  follows, and a borrow that opens something should be visible in the scenario file (decision 23).

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
