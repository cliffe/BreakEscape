# Access model plan: review, round 5 (final)

Reviewed: `docs/achitechture/ACCESS_MODEL_PLAN.md` as rewritten after round 4. Read-only adversarial
review by a fresh reviewer, checked against the working tree on 2026-11-09. Line numbers are the
current tree's; "plan:NNN" is a line of the plan. The plan's section 2 decisions (the user's and the
orchestrator's) are not relitigated.

## 1. Verdict

**Build the first slice.** Counts: 0 blockers, 0 majors, 9 minors. This is round 5, the last, so
the minors are not sent back for another plan revision: they are listed in section 7 for the
implementer to fold in as each step is built.

Every round 4 finding is closed in the plan, and so is round 3 B1 (section 5). The plan reads as one
fresh document: no finding ids, change notes or review references, and the routes table and steps 1
to 7 are complete and in a buildable order. Nearly every file:line the plan cites checks out
(section 4).

What is left is plumbing the build would trip over, none of it a design question:

- the shared availability test changes `_tickNpc` for an NPC whose sprite is not loaded, as the
  test is worded (m1);
- the client tracks an owner who has only `interests`, but the server's claim check asks for
  `needs` (m2);
- the sign-in and claim answers carry nothing the `pc_signed_in` event needs for `npcId`, and the
  claim answer carries no account name for the desktop header (m3);
- the 200-entry bound drops "the oldest" entry of a hash stored in Postgres `jsonb`, which keeps no
  insertion order (m4);
- the "unlock-mode read" copy source does not exist in the code (m5);
- the converted Pierce beat in `lab_physical_pentest` loses its teaching text and opens an empty
  desktop (m7).

## 2. Severity table

| Severity | Count | Items |
|---|---|---|
| Blocker | 0 | |
| Major | 0 | |
| Minor | 9 | m1 `isAvailable` and `_tickNpc`'s no-sprite branch, m2 an owner with `interests` only, m3 the answers lack `npcId` and the claim's account, m4 "oldest entry" in a `jsonb` hash, m5 no unlock-mode save path, m6 `isWorkstation` and `onInteract` plumbing, m7 the Pierce conversion, m8 `/unlock` refusal reason and `autoLockMin` wording, m9 proof scenario and loader tests |

## 3. Findings

### Minor

**m1. `isAvailable` and `_tickNpc`'s no-sprite branch.**

*Issue.* Plan 5.4 (plan:428-431) moves "the test `_tickNpc` applies (`npc-needs.js:559-571`)" into
`NPCNeedsSystem.isAvailable(npcId)`, and step 4's test (plan:741-742) says "`_tickNpc` blocks
exactly when it is false". Today `_tickNpc` has two separate early returns:

- no sprite (`npc-needs.js:560-561`): decay only and return. It does not set `blocked`, does not
  abort a job, and the home lookup at `:562` runs only once a sprite exists;
- `ko`, `hostile` or `hidden` (`:564-572`): abort the job, set `blocked`, and on recovery
  (`:574-578`) unblock and `_goHome`.

If `_tickNpc` blocks whenever `isAvailable` is false, an NPC in a room the player has not loaded yet
becomes `blocked`, and the first tick after its room loads unblocks it and calls `_goHome` before
`_updateHome` has run (`s.home` is still null, so `_goHome` sets the mode to idle and returns,
`:1125`). That is a behaviour change for every needs NPC in every mission, not only owners.

*Evidence.* `npc-needs.js:557-578, 1089-1097, 1120-1126`; plan:428-431, 741-742.

*Why it matters.* The needs system is in every office mission; the refactor is meant to be neutral.

*Recommended change.* `isAvailable(id)` = sprite exists **and** status clear, for the workstation
layer. `_tickNpc` keeps its no-sprite "decay only" return where it is and calls the status half
(or `isAvailable`, which is then equivalent at that point) where it checks status today. Reword
the test: `isAvailable` is false with no sprite and for `ko`, `hostile` and `hidden`; `_tickNpc`
blocks exactly for the status cases and only decays with no sprite, as today.

**m2. An owner with `interests` only is tracked on the client but refused by the server.**

*Issue.* The needs system registers an NPC that has `needs` **or** `interests`
(`npc-needs.js:225-228`, `register`), so `getState(ownerId)` is
non-null for an interests-only owner, the owner can leave its post for an interest, and `onInteract`
returns `accessed`. Claim check 3 (plan:560) refuses an owner without `needs`, and the step 5
warning (plan:771) is worded on `needs` alone. The player then sees `workstation_accessed` fire (and
any capture mapped to it) followed by "Sign in required".

*Evidence.* `npc-needs.js:225-228` (`register` returns false only when the NPC has neither valid
`needs` nor valid `interests`, and again at `:241`); plan:458-460, 560, 771.

*Why it matters.* Client and server must agree on when a claim is possible, or the event the
scenario maps fires without the session it announces.

*Recommended change.* Use the needs system's own rule in all three places: the owner has at least
one valid `needs` or `interests` entry. Claim check 3 and the step 5 warning say so.

**m3. The answers lack `npcId`, and the claim answer lacks the account.**

*Issue.* `pc-sessions.js` emits `pc_signed_in` with `{ pcId, npcId, username, via }` and
`pc_signed_out` with `{ pcId, npcId }` (plan:399-401), and the desktop header shows the signed-in
account (plan:415-416). But:

- a password sign-in answers `{ username, displayName }` only (plan:559);
- a claim's success answer is not specified (plan:560), and on a `loginPicker: false` PC the
  client may not know the owner's username or display name;
- the scenario response's `sessions` carries `{ username, displayName, via }` (plan:410), so after
  a reload the module cannot fill `npcId` for the reload sign-out's `pc_signed_out`.

*Evidence.* plan:359-416, 559-560.

*Why it matters.* Scenarios map these events; an event without `npcId` cannot drive an NPC's
reaction, and the header would be blank after a claim.

*Recommended change.* Both `/login` success answers and each `sessions` entry carry
`{ npcId, username, displayName, via }`. An NPC id is not secret (it already appears in `access`
lists the client receives).

**m4. "Oldest entry" cannot be found in a `jsonb` hash.**

*Issue.* Section 6 bounds `loginFailures` and `loginLockouts` at 200 non-account entries each,
"dropping the oldest such entry first" (plan:553-555). `player_state` is a Postgres `jsonb` column
(`db/migrate/20251120155358_create_break_escape_games.rb:24`; the test database is PostgreSQL,
`test/dummy/config/database.yml:13`). `jsonb` does not keep object key order, so after a save and
reload `loginFailures` (a hash) has no "oldest" key. `loginLockouts` is an array and keeps order.

*Evidence.* As above; plan:338, 553-555.

*Why it matters.* The implementation would evict an arbitrary entry, and a test written against
insertion order would pass in memory and fail after `reload`.

*Recommended change.* Store an order with the hash: either each failure entry is
`{ n, at }` with a monotonically increasing counter, or keep a separate array of non-account keys in
insertion order and evict from its head. The spam test in step 3 should `reload` the game between
attempts.

**m5. The "unlock-mode read" copy source does not exist.**

*Issue.* Section 4.2 lists three ways to open the card copier's read screen, the third being the
minigame's unlock mode, "which lists held keycards and saved copies (`availableCards`) and can read
one", and step 4 passes the keycard's object id "on an unlock-mode read" (plan:198-203, 724-726).
In the code, unlock mode's **Read** (`rfid-ui.js:124-130`) opens the tap screen, and tapping a held
card calls `handleCardTap` (`rfid-minigame.js:101-122`), which emulates it at the reader and
completes or denies. The read screen and its **Save** button (`rfid-ui.js:572-583, 681, 767`) read
only `cardToClone`, which is set only in clone mode (`rfid-minigame.js:45, 272`). Clone mode is
started only by the `clone_keycard` ink action (`chat-helpers.js:398-402`) and the held-keycard click
(`interactions.js:870-896`).

*Evidence.* As above; `unlock-system.js:557-566` passes `availableCards` for tapping, not reading.

*Why it matters.* The implementer would look for a save path to instrument and find none; and if one
is added later it must pass a source.

*Recommended change.* 4.2 lists two sources, the ink action and the keycard click. Drop the
unlock-mode clause from 4.2 and step 4 (or say: a later unlock-mode read added to the copier must
pass the keycard's object id).

**m6. `isWorkstation`, `onInteract`'s other results, and the reach of the workstation changes.**

- Step 4 says `isWorkstation` "accepts a `lockType: "login"` PC with an owner" and the test says
  "an unowned sign-in PC is not a workstation" (plan:710, 733). `isWorkstation(data)` takes no NPC
  list (`workstation-state.js:46-49`), and `lighting.js:620` calls it with the object alone. Either
  give it an optional `npcs` argument (and pass it at `lighting.js:620`), or let it accept every
  `login` PC and have `onInteract` return `signin` when `ownerOf` is null; say which, and word the
  test to match.
- The interaction steps (plan:466-473) handle `accessed`, `locked` and `signin`. `onInteract` can
  also return `null` (object not found, `workstation-state.js:168-169`) or, in a race,
  `attended`. Say "anything else opens the sign-in screen".
- The presence test and the `npc_ko` listener live in `workstation-state.js`, which serves every
  workstation, not only sign-in PCs (plan:421-422 says 5.4 applies only to sign-in PCs). Plain
  workstations (`lab_physical_pentest`, `test_needs_sims`, `test_npc_needs`) would gain
  "knocked out at the desk counts as leaving". `lab_physical_pentest` sets `disableAttacks: true`
  (`scenario.json.erb:8`), so no shipped mission changes today; state the scope either way.

**m7. The converted Pierce beat loses its teaching text and opens an empty desktop.**

*Issue.* Step 7 (plan:800-805) makes `staff_pc_2` a sign-in PC. Today it is `locked: false`,
`workstation: true` (`lab_physical_pentest/scenario.json.erb:925-950`) and has no `text` or
`contents`, so a click falls through to the examine view, which shows its `observationVariants`:
"Melanie walked off without locking her screen (no Win+L) ... the clean-desk / lock-screen rule is
the whole fix" (`:941-944`) and the "already lifted her credential" line (`:945-948`). The sign-in
branch returns before that flow (plan:462-465), so after the conversion the player claims a session
and sees an empty desktop: the lesson text never appears, and nothing on the desktop shows the
"saved logins" the capture note describes (`:835`).

*Evidence.* As above; `interactions.js:1866-1883` (the examine fallthrough the branch now skips).

*Why it matters.* `lab_physical_pentest` is a finished lab; the conversion is meant to prove the
model without losing the beat it rides on.

*Recommended change.* Step 7 says what the converted PC holds: a personal profile for `pierce` with
a short desktop file carrying the lesson (the unlocked session, the saved logins, the lock-screen
control), so the claim opens something worth seeing; and the `observationVariants` are kept for
hover/examine only or rewritten for the sign-in flow. Add a playtest of that beat to step 7.

**m8. `/unlock` refusal reason, and `autoLockMin` wording.**

- The `uid_only` refusal reason (plan:178-179, 564) needs a channel: `validate_unlock` returns a
  boolean (`game.rb:1107`) and the controller answers a fixed
  `{ success: false, message: 'Invalid attempt' }` (`games_controller.rb:868-881`). Step 3 lists
  "`unlock` passes `card_ids`" only; add "and returns `reason: "uid_only"` on that refusal" (for
  example by having the `access` branch record the reason on the game for the controller to read,
  as `pin_cracker_feedback` and `password_case_mismatch?` are computed beside it today).
- 5.4 (plan:475-477) and 5.5 (plan:499) end a claimed session "after `autoLockMin` game minutes away
  from that PC". It is not clear whose absence counts: the owner's (the screen's own auto lock) or
  the player's. Say it plainly; the simplest rule is that a claimed session ends when the screen's
  `autoLockMin` timer fires, which runs from the owner's leave.
- `autoLockMin: 0` "locks at once" (plan:499) must be applied when the owner leaves (in the leave
  roll), not by a timer that fires on a later tick, or a click in between returns `accessed`, fires
  `workstation_accessed`, and then the server refuses the claim (check 7).

**m9. Proof scenario and loader tests.**

- The proof scenario (plan:790-798) has "one cloneable card" but no card copier; `/clone_card`
  check 1 and the ACL door test need an `rfid_cloner` the player can pick up. Add one.
- `generate_scenario_data` returns at once when `scenario_data` is already set, which is how tests
  build games (`game.rb:3023-3024`). Step 1's tests must call `normalise_access_model!` themselves
  (or create the game through a mission); otherwise every model test with a hand-written scenario
  runs without the loader, and the step 2 and 3 tests that rely on `usePayload` being filled from
  `creds` pass or fail for the wrong reason.

## 4. What checked out

- **Presence.** `getState` with `atPost` (`npc-needs.js:1346-1352`); `atPost: true` at registration
  (`:264`); script moves clear it with no `npc_left_post` (`:333-344`); `npcPos` null without a live
  sprite (`:1510-1516`); `npcStatus` `ko`, `hostile`, `hidden` (`:1517-1524`). Seated NPCs keep their
  physics body enabled (`seating.js:842-872` changes `checkCollision` only), so an owner sitting at
  the desk is not read as hidden; KO and hidden set `body.enable = false` (`npc-sprites.js:186-237`,
  `npc-hostile.js:334`).
- **Knock-outs.** `npc_ko` and `npc_ko:<id>` (`npc-hostile.js:350-354`, `combat-events.js:6`);
  `onLeft` increments `leaves` and re-rolls (`workstation-state.js:141-151`), so the "only when not
  already away" guard is needed and is in the plan.
- **`onInteract`** (`workstation-state.js:166-182`): the new `signin` result emits nothing, unlike
  `locked` at `:175-177`. The generic flow ignores the return value today (`interactions.js:792-795`),
  so a new branch there is the right place.
- **Server claim refusal.** Check 3 is now in the table (plan:560), matching the client in the plan
  apart from m2.
- **Sign-in answers.** Normalised usernames, failures for any typed username, `lockedOut: true` on
  every attempt at a locked username, the 200-entry bound with accounts never dropped (order aside,
  m4), and "This account can't sign in on this PC" after a correct password leaving the count
  unchanged (orchestrator decision, plan:75). The check order (lockout, then password, then
  `access`) means the distinct answer is only ever given after a correct password, so it reveals
  nothing a wrong guess could.
- **`pc-sessions.js`** as the one place that signs in and out and emits the events (plan:362-369);
  sessions record `via`; claimed sessions are signed out on reload because the away map resets
  (`workstation-state.js:93-116`). `core/game.js:1652-1654` merges `savedGlobalVariables` before
  `objectivesManager.initialize` (`core/game.js:1786`), whose reconcile runs at init
  (`objectives-manager.js:86-90, 246-252`), so handing `signedInPcs` over at `:1652` is early enough.
- **Click order** at a sign-in PC (plan:466-473): presence, session, claim, sign-in; the generic flow
  is skipped, so `triggerOnInteract` would never run, and step 5 makes it a validator error.
- **`signedInPcs`** for tasks: `complete_task!`'s `unlock_object` (`game.rb:1565-1568`) and the
  client's `item_unlocked` handler (`objectives-manager.js:303-306`).
- **Card copies.** Save point `handleSaveCard` (`rfid-minigame.js:280-300`) to `saveCardToCloner`
  (`rfid-data.js:286`); the ink action's placeholder card (`chat-helpers.js:381-389`); DESFire
  `masterKeyKnown` false (`rfid-data.js:63`) and the minigame's UID-only refusal
  (`rfid-minigame.js:190-214`); the 50-card limits (`rfid-data.js:18`, `game.rb:1817`). Recording only
  the source's own card, and counting a copy only while an `rfid_cloner` is held, are both in the
  routes table. The object source covers held and reachable keycards. (The third source is m5.)
- **`acceptsUIDOnly`** is plumbed through the bootstrap allow list (`game.rb:819-821`),
  `doorProperties` (`doors.js:518-544`) and both requirement builders (`unlock-system.js:602-615,
  681-691`); the `rfid` branch already reads it (`:514`) and passes it to the minigame (`:562`).
- **Usernames and shared cards.** No existing room NPC, top-level NPC, phone NPC or `emailRecord`
  carries `role` or `creds` in any of the 161 scenarios that render (checked by rendering each
  `scenario.json.erb` with the validator's `render_erb_to_json`), so the new "room NPCs only" error
  breaks nothing. The only shared card is `tg_power_room_card` in `m10_full_disclosure` (`imran`,
  `gary_tech`), as the plan says.
- **Loader placement.** `generate_scenario_data` (`game.rb:3022`) calls `stamp_scenario_object_ids!`
  at `:3051` (defined at `:3059`); the loader goes just before it. `creds.card || rfidCard` covers
  games created earlier.
- **State keys** stay off `preserved_keys` (`game.rb:95-97`); `initialize_player_state` is at
  `:3076`.
- **Account tiles in `filtered_room_data`** (`game.rb:909-920`), which the room action
  (`games_controller.rb:479`) and the door unlock (`:888`) both use.
- **Scenario action** (`games_controller.rb:267`, `savedGlobalVariables` at `:298`) is the right
  place for `sessions` and `signedInPcs`.
- **`/unlock`**: the object "already unlocked" return (`game.rb:1186-1189`), `unlocked`
  (`:1199-1208`), `npc` (`:1210-1213`) and `flag_reward` (`:1223-1227`) all precede the lock-type
  check, so the guard must come first, as the routes table says; `rfid` is trusted at
  `:1156-1161` and `:1245-1248`.
- **Containers**: `find_object_in_scenario` (`games_controller.rb:1688-1703`) finds a PC with no
  `contents`, where `find_container_recursive` would not (`:1672-1680`); `check_container_unlocked`
  (`:1727-1734`); `filter_container_contents` (`:1736-1762`); the take path's one-level check
  (`:1884-1890`).
- **Withholding**: the NPC loop of `filter_requires_and_contents_recursive` (`game.rb:3011`);
  `update_room` NPC overlays carry only `isKO`, `currentHP`, `isVisible`
  (`games_controller.rb:2314-2320`), so a client cannot write `creds` or `role` onto an NPC.
- **Captures**: the early return at `game.rb:896`; the `kind` filter (`:901`) admits the Pierce
  capture (`"kind": "credential"`, `lab_physical_pentest/scenario.json.erb:835`); the capture overlay
  (`npc-manager.js:1169-1177`).
- **Validator field lists** at `validate_scenario.rb:389-394, 404-409, 412-419, 484-510`.
- **Routes table and steps.** Every route the slice adds or changes is listed with its checks in
  order; step 2's tests use only routes that exist then and step 3 adds the rest; step 4 names the
  client tests R4 asked for (`workstation-state.test.mjs`, `npc-needs.test.mjs`, a new
  `pc-sessions.test.mjs`, an objectives test), and the first two files exist in `test/js/`.
- **Self-contained.** No finding ids, review references, change notes, em dashes or en dashes in the
  plan.

## 5. Earlier findings: closed or not

| Finding | Round 5 check |
|---|---|
| R4 M1 removed, hidden or hostile owner leaves the PC "in use" for ever | **Closed.** Presence needs `isAvailable` (plan:428-437); an absent owner with no away record returns `signin` and emits nothing (plan:452-456). The refactor's effect on `_tickNpc` is m1. |
| R4 m1 claim checks and client presence rules disagree | **Closed** for knock-outs (plan:447-451) and owners without needs (claim check 3). The interests-only gap is m2. |
| R4 m2 `attemptsLeft` and lockout answers give accounts away | **Closed** (plan:550-555, 559). The bound's ordering is m4. |
| R4 m3 client sign-in plumbing | **Closed**: `pc-sessions.js`, `core/game.js` hand-over, no `unlockTarget`, the interaction waits for the claim, `via`, claimed sessions signed out on reload, `signedInPcs` reconcile. The missing `npcId` is m3. |
| R4 m4 `/clone_card` sources and the copier | **Closed** for held and reachable keycards, matching the source's own card, and the copier being held. The unlock-mode source is m5. |
| R4 m5 `acceptsUIDOnly` never reaches the client | **Closed** (plan:161-170, 701-703). |
| R4 m6 identity by value needs uniqueness rules | **Closed** (plan:116-122, 757-762, 777, 800-802). |
| R4 m7 build order and reset wording | **Closed** (plan:330-332, 575-580, 604-611). |
| R4 m8 small inaccuracies | **Closed** (plan:73, 521-523, 386-388, 564). |
| R3 B1 unowned or never-leaving owner reads "in use" for ever | **Closed**: unowned PCs go straight to sign-in; untracked, script-moved, removed, hidden and hostile owners read as not present and return `signin`; a knocked-out owner counts as leaving. |

Nothing from rounds 1 to 4 is still open. R1 m4 (the skip check needs lock-order data) stays
deferred, rightly, as round 4 said.

## 6. Open questions for the user

None. All nine minors have engineering fixes within the decisions in plan section 2. On cost: the
orchestrator decision to answer "This account can't sign in on this PC" (plan:75) costs nothing in
secrecy, because the check order gives that answer only after a correct password.

## 7. Open items for implementation

Round 5 is the last review round, so these go to the implementer as a checklist rather than back to
the planner.

1. **`isAvailable` (m1).** Keep `_tickNpc`'s no-sprite "decay only" return before `_updateHome`;
   only the status half blocks. Word the `npc-needs.test.mjs` case to match, and run the whole
   needs suite (`npc-needs*.test.mjs`, `npc-pressing-needs.test.mjs`) unchanged.
2. **Tracked means `needs` or `interests` (m2)**, in claim check 3 and the step 5 warning.
3. **`npcId` in every sign-in answer and in `sessions` (m3)**, and the claim answer carries
   `{ npcId, username, displayName }`.
4. **Ordered eviction (m4).** `jsonb` keeps no key order; keep an explicit order for the 200-entry
   bound, and reload the game inside the spam test.
5. **Two copy sources, not three (m5)**: the ink action and the held-keycard click. Call
   `/clone_card` only after `saveCardToCloner` reports success.
6. **Workstation plumbing (m6).** Decide how `isWorkstation` learns the owner (and update
   `lighting.js:620` if it gains an argument); treat any `onInteract` result other than `accessed`
   as "open the sign-in screen"; state whether the presence test and the knock-out rule apply to
   plain workstations too.
7. **The Pierce beat (m7).** Give `staff_pc_2` a personal profile file with the lesson, keep or
   rewrite its `observationVariants`, and playtest the beat after the conversion.
8. **`/unlock` reason and `autoLockMin` (m8).** Plumb `reason: "uid_only"` to the controller; end a
   claimed session when the screen's auto lock fires; apply `autoLockMin: 0` in the leave roll.
9. **Proof scenario and tests (m9).** Add an `rfid_cloner` to `test_access_model`; call
   `normalise_access_model!` explicitly in model tests that hand-build `scenario_data`.
10. **Owners who start away from their desk.** The needs system registers every NPC with
    `atPost: true` (`npc-needs.js:264`), so an owner who spawns elsewhere in a loaded room reads as
    "using this PC" until its first leave. Author owners at their desk, or have the validator warn
    when an owner's `position` is not in the room of its `needsHome` PC.
11. **"Known" tiles on first entry.** `filtered_room_data` runs before `track_npc_encounters` in
    both the room action (`games_controller.rb:479, 488`) and the door unlock (`:888-892`), so a
    `loginPicker: "known"` PC's tiles in that first response omit NPCs in the same room. The
    `GET /login_accounts` refresh when the screen opens covers it; keep that refresh.
12. **No case hint at `/login`.** `/unlock` answers `caseMismatch` for a password that is right
    apart from letter case (`games_controller.rb:878-880`). Do not copy that into `/login`: it would
    tell the player which usernames are real accounts.
13. **Lighting indicators.** An owner who is removed, hidden or hostile at the desk has no away
    record, so the desk's indicator shows "attended" (`lighting.js:116-122`). Cosmetic; leave it
    unless a playtest finds it misleading.
14. **No-password test.** Keep it on a scenario without a `writesDown` habit (a later slice ships the
    password on purpose) and run it after every step that touches what the server sends.
