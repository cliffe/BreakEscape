# Access model plan: review, round 3

Reviewed: `docs/achitechture/ACCESS_MODEL_PLAN.md` as rewritten after round 2. Read-only adversarial
review by a fresh reviewer, checked against the working tree on 2026-11-09. Line numbers are the
current tree's. The plan's section 2 decisions (the user's and the orchestrator's) are not
relitigated.

## 1. Verdict

**Revise once more, then build the first slice.** Counts: 1 blocker, 2 major, 9 minor.

The round 2 rewrite closed almost everything it claimed to. The take request, the door `access`
plumbing, the capture route limits, the unlocked-session rules on `lockChance` /
`locksScreenOnLeave`, the profile lookups and the scope guard are now specified, and nearly every
file:line the plan cites checks out (section 4). The plan is still self-contained: no finding ids,
change notes or review references inside it.

Three things would still fail as written:

- Making every sign-in PC a workstation means `onInteract` answers `attended` for a PC with **no
  owner**, and for an owner who never leaves, so the plan's "owner present: opens nothing" rule
  locks the player out of those PCs for good, password or not. The proof scenario's profile-only
  PC is one of them (B1).
- The take path walks a PC's or profile's contents recursively but never checks that a locked
  folder on the way has been unlocked, so a file inside "a locked archive in Jake's files" can be
  taken without opening the archive (M1).
- `access` on an `rfid` **object** never reaches the client's lock check: the item path has its own
  fixed field list, which the plan does not name. This is the round 2 M1 failure, still open for
  objects (M2).

## 2. Severity table

| Severity | Count | Items |
|---|---|---|
| Blocker | 1 | B1 an unowned sign-in PC, or one whose owner never leaves, is "in use" for ever |
| Major | 2 | M1 the take path skips locked folders inside a PC or profile, M2 `access` on rfid objects never reaches the client |
| Minor | 9 | m1 the `/unlock` guard must sit before every early return, m2 where `pc_id` is actually sent, m3 sign-in has no event or task hook, m4 `/capture_secrets` returns early with no landing page, m5 server-recorded copies ignore the card copier's own rules, m6 permanent lockout and the minigame's own attempt limit, m7 `/clone_card` lock and claim room check, m8 portrait images, m9 the plan is harder to follow than it needs to be |

## 3. Findings

### Blocker

**B1. An unowned sign-in PC, or one whose owner never leaves, is "in use" for ever, so nobody can
sign in to it.**

*Issue.* Plan 5.2 says a `lockType: "login"` PC is a workstation by default (`isWorkstation`
learns it), and 5.4 says that when `onInteract` returns `attended` "the client shows 'Jake is using
this PC' and opens nothing". In the current code `onInteract` returns `attended` whenever the
owner's away record is not set:

- `const ownerId = ownerOf(data, ...)`; `const rec = this.away.get(ownerId)`;
  `if (!rec?.away) return 'attended'` (`workstation-state.js:167-171`).
- `ownerOf` returns `null` for a PC with no `screenOwner` and no NPC whose `needsHome` names it
  (`workstation-state.js:52-58`), so `this.away.get(null)` is undefined and every unowned
  sign-in PC reads `attended`.
- The away record is set only by the needs system's `npc_left_post:<id>` (`workstation-state.js:140-151`,
  emitted at `npc-needs.js:867`). An owner with no `needs`, one moved by a script (which suspends
  needs, `npc-needs.js:333-354`, without emitting `npc_left_post`), or one knocked out never
  leaves, so the PC is attended for the whole game.
- Today the return value is ignored (`interactions.js:792-795`: "the normal interaction below still
  runs"), so this only bites once step 4 makes `attended` block the interaction, as the plan asks.

*Evidence.* As above. The plan's own proof scenario (section 10, step 7) has "one [PC] holding
only profiles", which on the plan's wording has no owner.

*Why it matters.* Sign-in is the slice's main feature. Built as written, any shared, hot-desk or
kiosk PC with no owner can never be signed into, and an owned PC whose owner is knocked out or
scripted elsewhere is closed for the rest of the mission, with a "using this PC" line that names
nobody. It fails silently: no error, no validator warning.

*Recommended change.* In 5.2 and 5.4:

- `attended` blocks only when the PC **has an owner** and that owner is a needs NPC currently at
  its post (not knocked out, hidden or removed). A PC with no owner goes straight to the sign-in
  screen and never offers a claim.
- Knocking out the owner counts as leaving (the workstation layer listens for the KO as it does
  for `npc_left_post`), or say plainly that a knocked-out owner leaves the PC attended and have the
  validator warn about it.
- Validator warning (step 5): an owned sign-in PC whose owner has no `needs` (the PC would be "in
  use" for the whole game).
- Step 3 or 4 tests: an unowned sign-in PC opens the sign-in screen; an owned one does while the
  owner is away.

### Major

**M1. The take path walks into locked folders without checking they were unlocked.**

*Issue.* Plan 5.1 "The take request": with `source_pc_id`, `find_accessible_item` searches the PC's
own contents and every profile **recursively**, and `validate_item_collectible` accepts the item when
the PC is a sign-in PC, the session is set, `session_admits?` holds, the item is takeable and
`transfer` allows the choice. Nothing checks the folders between the PC or profile and the item.
Today the one container case checks its parent: `location[:type] == 'container'` requires
`unlockedObjects.include?(container_id)` (`games_controller.rb:1884-1890`), and only one level is
searched (`:2050-2054`). The new `login_pc` and `profile` locations replace that check.

Ids are predictable (`<parent>_content_<n>`, `game.rb:3070-3074`), and the add matches on id
(`find_accessible_item`, `games_controller.rb:1993-1995`), so a request does not need to have seen
the item.

*Evidence.* As above. Plan 5.3 itself uses "a locked archive in Jake's files" as the example of a
nested lock.

*Why it matters.* A password-locked archive inside a profile is the obvious next puzzle on a
sign-in desktop. A request naming a file inside it, sent while signed in, takes the file without
the archive's password. The plan's aim is that the server, not the client, decides what locked
content is released.

*Recommended change.* In 5.1, add to the `validate_item_collectible` conditions: every locked
container on the path from the PC or profile to the item is in `unlockedObjects`. `find_accessible_item`
returns that path with the location (it walks it anyway). Add a step 3 test: a file inside a
locked archive in a profile is refused before the archive is unlocked and accepted after.

**M2. `access` on an `rfid` object never reaches the client's lock check.**

*Issue.* Plan 4.1 names three fixed field lists for doors (bootstrap allow list, `doorProperties`,
`getLockRequirementsForDoor`) and says "Objects keep `access` in room data, because the room filter
does not strip it". That is true of room data, but the `rfid` branch reads the lock from
`lockRequirements`, which for objects comes from `getLockRequirementsForItem`, a fourth fixed list:
`locked`, `lockType`, `requires` (defaulted to `''`), `keyPins`, `difficulty`
(`unlock-system.js:681-691`, chosen at `:115-117`). So for an `access`-only `rfid` object the client
sees no `access` and an empty `requires`, and falls to today's "Requires RFID keycard" or card copier
flow (`unlock-system.js:502-593`), never sending `card_ids`.

*Evidence.* As above. Plan 4.2 says `access` applies to `rfid` "doors and objects", and plan 4.1's
server branch covers objects (`game.rb:1245-1248`).

*Why it matters.* The same silent refusal the round 2 M1 fix removed for doors, still present for
objects. The proof scenario has no `rfid` object, so it would not catch it.

*Recommended change.* In 4.1 and step 4, add `access` to `getLockRequirementsForItem`
(`unlock-system.js:681-691`), and add an `rfid` object with role-only `access` to the proof
scenario or a step 3 test.

### Minor

**m1. The `/unlock` scope guard must sit before every early return, and "a sign-in PC can never be
opened through `/unlock`" is not quite true.**
- `validate_unlock` returns `true` at once for an object already in `unlockedObjects`
  (`game.rb:1186-1189`), and the controller then returns its contents (`games_controller.rb:899-913`).
  A locked archive in a profile, unlocked once while signed in, would then be served by `/unlock`
  with no session if the guard sits inside the `unlocked` branch.
- `method: "npc"` (`game.rb:1210-1213`, NPC `unlockable`) and `method: "flag_reward"`
  (`:1223-1227`) return before the lock-type check, so they can open a `login` PC whose id an
  author lists in `unlockable` or in an `unlock_object` reward. That writes `unlockedObjects` and
  returns the PC's raw local `contents`.

State in 5.3 that `/unlock` refuses a `lockType: "login"` object for every method, and refuses an
object scoped to a sign-in PC or profile without an admitting session, before any other check.
Validator error: `unlockable` or an `unlock_object` reward naming a sign-in PC.

**m2. Where `pc_id` is actually sent.** Step 4 has `container-minigame.js` "passes `pc_id` for nested
folders". The container minigame only fetches `/container/:id` itself (`container-minigame.js:138-158`).
A nested folder is opened through the main object handler (`container-minigame.js:458-462`
delegates a locked one), whose `/unlock` call is `notifyServerUnlock` (`unlock-system.js:25-45`) or
the password minigame's server check. Name those in step 4, or drop `pc_id` from `/unlock`: the
server can admit an object when **any** current session admits its scope, which needs no new client
parameter. The take request still needs `source_pc_id` (it chooses the session).

**m3. Sign-in has no event or task hook.** The plan defines no event for a sign-in or sign-out,
and sign-in never writes `unlockedObjects`, so an `unlock_object` task on a sign-in PC can never
complete (`game.rb:1565-1568`) and `item_unlocked` (`objectives-manager.js:303-304`) never fires.
Authors will write "get into Jake's PC" as exactly that task. Emit `pc_signed_in:<pcId>` (and
`pc_signed_out:<pcId>`) with the identity, and have the validator error on an `unlock_object`
task whose target is a sign-in PC.

**m4. `/capture_secrets` returns early when there is no landing-page secret.**
`capture_secrets_for_client` returns `{}` when no landing page carries a secret
(`game.rb:896`). `lab_physical_pentest` has no `landingPages`, so the Pierce beat would get nothing
from the extension unless that return moves below the account-holder pass. Say so in 5.6. Also
say that an account holder can carry no other capture secret: the withholding deletes every
`addCapture.secret` on it and the validator errors on any, so a PIN capture like Len's
(`scenarios/lab_physical_pentest/scenario.json.erb`, the `addCapture` with `"secret": "4471"`)
cannot sit on an NPC who also has an account.

**m5. Server-recorded copies ignore the card copier's own rules.** On an `access` door, step 2 of
4.1 opens straight from the server's answer, skipping the minigame where the protocol rules live:
a MIFARE DESFire copy without the master key is refused by a reader that does not accept UID-only
emulation (`rfid-minigame.js:192-214`). A `serverClones` entry would open such a door anyway. Also
the copier holds at most 50 cards (`rfid-data.js:18`, `game.rb:1817`) while `serverClones` never
drops one, and 4.3 does not say whose `card_id` is recorded (the ink action can pass any id,
`chat-helpers.js:364-390`). Record the server's own `card_id` (the NPC's `creds.card` or the
object's), record whether the copy is UID-only, and have the ACL check honour `acceptsUIDOnly`.

**m6. A lockout lasts the whole mission, and the minigame keeps its own limit.** `maxAttempts`
locks an account out of a PC "for the mission" with no recovery short of a reset. On a route that
is the only way forward that is a soft lock. Separately, the password minigame defaults to its own
`maxAttempts || 3` (`unlock-system.js:340`), which would stop the player before a policy of 5, or
under a policy of `null`. Have the sign-in mode take its limit from the server's answer, and add a
validator warning for a sign-in PC with `maxAttempts` whose account the intended route needs.

**m7. `/clone_card` and the claim.** `/clone_card` writes `player_state` but is not named for
`with_game_lock` (5.3 names only `/login` and `/logout`; the list is `games_controller.rb:84`).
The claim's refusal list (5.4) leaves out the first `/login` check (the PC exists, is
`lockType: "login"`, and its room is reachable); apply it to claims too.

**m8. Portrait images.** A talk image can be a 2x2 sheet, and a derived path
(`<spriteSheet>_talk.png`) may not exist (`person-chat-portraits.js:111-113, 375-387`). The tile
needs the first frame of a sheet and a fallback when the image fails to load.

**m9. The plan is harder to follow than it needs to be.** It reads as one piece, but the rules for
one request are spread out: the take request is in 5.1, its session check in 5.3, the ACL door in
4.1, the copy record in 4.3, the claim in 5.4, and the withholding in 5.6. Sections 6 to 8 (later
slices) sit between the slice's sections and section 10. Two changes would help the builder most:
a single table of the new and changed server routes (route, parameters, every check in order, what
it writes) in section 5, and moving sections 6 to 8 after section 10 under "Later slices".
Section 10, step 3's file list is one long sentence; a bullet per file would be easier to tick off.

## 4. What checked out

- Inventory add carries only `action_type`, `item`, `source_npc_id` (`inventory.js:455-459`,
  `games_controller.rb:954-994`); `find_accessible_item` (`:1993`) cannot find a profile item and
  resolves a PC file to a container gated on `unlockedObjects` (`:1884-1890`, `:2050-2054`). The
  plan's `source_pc_id` and `transfer` additions are the right shape (apart from M1).
- `find_scenario_object` (`game.rb:1340`), `find_object_in_scenario` and
  `find_container_in_scenario` (`games_controller.rb:1655-1720`) walk rooms and held grants only;
  `find_container_in_scenario` needs `contents` (`:1676-1677`), so the `container` login branch
  using `find_object_in_scenario` (`:1688`) is right.
- `method: "unlocked"` on an unlocked nested object records and returns contents
  (`game.rb:1199-1203`, `games_controller.rb:899-913`); the guard the plan adds is needed (placement
  in m1).
- `login` is not in `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:1035-1044`) and a locked object with an
  unmatched method is refused (`:1229-1232`), apart from the `npc` and `flag_reward` methods (m1).
- The room filter keeps `access` (it deletes only `requires`, locked `contents`, flags,
  `hintOnlyFlags`, `game.rb:2947-3017`); a profile-only PC needs `hasContents` for the container
  route (`interactions.js:1524-1534`); the container minigame header still shows the PC's
  `observations` and variants (`container-minigame.js:84-87`), so the lab's teaching text survives
  the conversion.
- Door `access` plumbing: bootstrap allow list `game.rb:819-821`, `doorProperties` `doors.js:518-544`,
  `getLockRequirementsForDoor` `unlock-system.js:602-615`. The three-step client order is sound:
  step 1 is today's code unchanged, and an `access`-only door reaches step 2 because
  `evaluateRfidCredential(undefined)` matches nothing (`unlock-system.js:69-94`).
- Card copy save point: `handleSaveCard` → `saveCardToCloner` is the only save
  (`rfid-minigame.js:280-292`, `rfid-data.js:286`); the ink action and keycard object only open the
  minigame (`chat-helpers.js:398-405`, `interactions.js:889-896`).
- `encounteredNPCs` is filled for every NPC in a room on load (`games_controller.rb:1608-1650`).
- Capture overlay: the mapping's `addCapture` template overlaid with `eventData.payload`
  (`npc-manager.js:1169-1177`). `workstation_accessed` carries no payload, so the Pierce capture
  keeps its authored `address` (`m.pierce`) once the inline secret goes, and the server can match it.
- `lab_physical_pentest`: Pierce's `usePayload.secret` and `addCapture.secret` are at `:829` and
  `:835`; `staff_pc_2` is owned by `screenOwner: "pierce"` with `locksScreenOnLeave: false` (`:925-935`),
  so the claim rules allow its session. The password appears in no ink file of the scenario.
- No existing scenario puts `role`, `creds`, `access`, `policy`, `transfer` or `cloneable` on a room
  NPC, room or object, and none puts `role` on a top-level NPC, phone NPC or email record (all 161
  scenarios rendered and checked). `role` exists elsewhere (`social.awarenessEpisode.role`, mail
  `contacts[].role`), so the validator's "outside room NPCs" error must be limited to NPC records,
  as the plan words it.
- `rfidCard` is read only on the client (no server use), so deriving it in the withholding is safe.
- `update_room` cannot write `contents`, `locked` or `lockType` into object state
  (`games_controller.rb:2307-2312`).
- Reset allow list `game.rb:89-107`; `initialize_player_state` `:3076`; validator field lists at the
  cited lines (`validate_scenario.rb:390-394, 405-409, 412-419, 484-510`).
- Section 10's order is buildable: step 2's tests can run against the generic `container` route
  (a sign-in PC is never in `unlockedObjects`, so it returns 403), and each later step depends only
  on earlier ones. Missing from it: the items in B1, M1, M2, m1 and m3.
- The plan is self-contained: no finding ids, change notes or review references.

## 5. Earlier findings: closed or not

| Finding | Round 3 check |
|---|---|
| R2 B1 take from sign-in PC or profile | **Closed** for the lookup, session, `transfer` and Copy record. The recursive walk opens a new gap (M1). |
| R2 M1 client cannot see `access` | **Closed for doors. Not closed for objects** (M2). |
| R2 M2 capture lookup, inline `addCapture.secret` | **Closed** in design. The early return in `capture_secrets_for_client` needs moving (m4). |
| R2 M3 slice 1 relied on `locksScreen` and workstation state | **Closed.** Making every sign-in PC a workstation exposed B1. |
| R2 m1 container lookup | Closed. |
| R2 m2 copies from keycard objects, mixed doors | Closed. Whose `card_id` is recorded is in m5. |
| R2 m3 gate doors | Closed. |
| R2 m4 creds outside room NPCs | Closed. |
| R2 m5 nested containers bypass the session | Closed in intent; guard placement and the `npc` / `flag_reward` methods in m1, `pc_id` plumbing in m2. |
| R2 m6 card-only NPCs, derived `rfidCard` | Closed. |
| R2 m7 sticky note slice, ink wording | Closed. |
| R2 m8 `known` picker sources | Closed. Image handling in m8. |
| R2 m9 small inaccuracies | Closed. |
| R1 B1, B2, M1 to M5, m1 to m7 (as marked fixed in the R2 response) | Closed, except R1 M1 (role-ACL RFID on the client), which stays open for objects through M2 here. R1 m4 stays deferred, justified. |

## 6. Open questions for the user

None. Every finding has an engineering fix within the decisions in plan section 2.
