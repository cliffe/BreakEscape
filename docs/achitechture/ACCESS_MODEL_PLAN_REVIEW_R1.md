# Access model plan: review, round 1

Reviewed: `docs/achitechture/ACCESS_MODEL_PLAN.md`. Read-only adversarial review, checked against
the working tree on 2026-11-09. Line numbers are the current tree's. The plan's section 2
decisions are the user's and are not relitigated here; where a decision has a cost I say so and
propose how to meet it within the decision.

## 1. Verdict

**Revise, then build the first slice.** Counts: 2 blockers, 5 major, 7 minor.

The reading of the current code is accurate: RFID unlocks are trusted from the client, the
password minigame counts attempts only in the browser, a `text_file` always opens the viewer,
the workstation layer (`ownerOf`, `decideLocked`, `lockChance`, the `<id>_owner_away` /
`<id>_screen_locked` globals) exists as described, `NPCNeedsSystem.roll` exists, the social
engineering systems install only when `social.characters` is present, the capture store has a
closed key set and strips the authored secret from the bootstrap, and the validator field lists
sit exactly at the cited lines. The schema is reasonable and most of the first slice is
buildable as written.

Two things in the first slice would silently fail in the engine as the plan describes them, and
both are about where server state actually lives: the per-account content gate for login PCs
(the plan composes per-identity contents but does not say the gate must be session-based, not
`unlockedObjects`), and the `creds.password` strip (the obvious place, the bootstrap, already
drops NPCs entirely, so stripping only there protects nothing; the leak is the lazy room
endpoint). The majors are mostly under-specified client and server surfaces that the proof
scenario in section 10 exercises directly: the role-ACL RFID door, the account picker's data,
profile item identity, cloned-card resolution, and Copy semantics.

## 2. Severity table

| Severity | Count | Items |
|---|---|---|
| Blocker | 2 | B1 login content gate, B2 password leak via the room endpoint |
| Major | 5 | M1 role-ACL RFID on the client, M2 cloned-card identity is client-asserted, M3 profile item ids, M4 account picker data, M5 Copy and the already-held filters |
| Minor | 7 | m1 login method plumbing, m2 `profiles`/`posts` name overlap, m3 lockout state, m4 validator skip check feasibility, m5 unlocked-session trust, m6 two homes for a password, m7 postitNote on a login PC |

## 3. Findings

### Blockers

**B1. Login PCs need a session-based content gate; the described path silently cannot log out,
switch accounts, or serve per-identity contents.** (USER DECISION not required; engineering.)
Plan 5.3 says "On success the server records `player_state.sessions[pcId] = identityId` and the
container endpoint composes contents for that identity", and 5.3 also says logging out clears the
session and logging in as someone else replaces it. But the container endpoint gates on
`unlockedObjects`, not on sessions: `check_container_unlocked` only checks
`unlockedObjects.include?(container_id)` (`games_controller.rb:1727-1734`), and an object unlock
records the id permanently with `unlock_object!` (`games_controller.rb:901`, gate at `:527-531`).
If the login reuses the generic unlock path, the PC id goes into `unlockedObjects` for good, so
(a) logging out cannot re-lock it, (b) a second account at the same PC cannot force a fresh
password, and (c) the container keeps serving its static `container_data['contents']`, not a
composition for the current `sessions[pcId]`. The plan names the compose step but not the gate,
and getting the gate wrong fails silently (the player sees the first identity's desktop for ever).
*Change:* state in 5.3 that a login PC's container is gated on `sessions[pcId]` being set, that
the login flow records the session **without** calling `unlock_object!` (so it is not a permanent
unlock), that logout deletes `sessions[pcId]`, and that the container endpoint for a `type: pc`
with `lockType: login` branches to compose from the session identity (PC `contents` plus admitted
profiles, 5.1) and returns 403 when no session is set. Add the slice-1 server task "session gate
and per-identity compose in `container`" to 10.2.

**B2. `creds.password` leaks through the lazy room endpoint unless the strip is added there, not
at the bootstrap.** Plan 10.2 says "strip `creds.password` and profile contents from the client
payload", and section 3 marks the password "stripped from the client payload". The obvious target,
`filtered_scenario_for_bootstrap`, already removes every NPC from the bootstrap (it keeps only a
short room-field allow list and drops `objects`/`npcs`, `game.rb:803-842`), so stripping there
protects nothing. NPC `creds` actually reach the client through the lazy room endpoint:
`filtered_room_data` (`game.rb:909-921`) deep-dups the room and runs
`filter_requires_and_contents_recursive`, which recurses into `npcs` (`game.rb:3011`) but strips
only lock fields (`requires`, locked `contents`, `flags`) and **no** NPC-specific field. So an NPC
shipped to the client in its room payload carries `creds.password` verbatim unless a new NPC strip
is added in that path. (Note also that `usePayload` already rides to the client on every
`npc_used` event and on the NPC record via `Object.assign`; keep authored secrets out of
`creds.password` and `usePayload` alike, see m6.)
*Change:* put the strip inside the NPC branch of `filter_requires_and_contents_recursive` (delete
`creds.password`, and any other secret-bearing cred field) so every route that ships an NPC
inherits it, and add a test that `GET /room/<id>` for a room with a cred-bearing NPC contains no
password. Reword 10.2 to name `filtered_room_data` / the NPC recursion, not "the bootstrap".

### Major

**M1. The role-ACL RFID door (the proof scenario's finance door) is not reachable by the current
client RFID path.** The whole client RFID flow is `requires`-driven: `evaluateRfidCredential`
matches held keycards and cloner `saved_cards` by `card_id` against `lockRequirements.requires`
(`unlock-system.js:69-94`), and the unlock branch decides "direct unlock / open the cloner /
access denied" from that result (`unlock-system.js:502-593`). An `access`-only door (10.6 asks for
"a finance door with a role ACL") has no `requires`, so `requiredCardIds` is `[undefined]`, no card
matches, and the door silently refuses with "Requires RFID keycard". Resolving a held card to a
role needs card_id → owner NPC → roles, which the client can only do for NPCs in loaded rooms, and
the admitted NPC may be elsewhere. Plan 10.3 lists only "RFID unlock sends the `card_id` it used",
which does not cover how the client decides it holds a satisfying card or which card to offer.
*Change:* for the first slice, have the client send every held `card_id` (keycards plus cloner
`saved_cards`) for an `access`-bearing door and let the server resolve each against NPC `creds.card`
and the door `access`; the server already has all NPC data. Extend `evaluateRfidCredential` /
`playerHoldsRfidCredentialFor` to treat a card as valid when its id is in `requires` **or** resolves
to an admitted identity (the server is the authority; the client result only drives UI). Say this
in 4.1 and 10.3.

**M2. Server-side identity resolution for cloned cards rests on a client-asserted store, so it is
not an authentication boundary.** (USER DECISION: accept as client-trusted, or add a stronger
path.) Plan 4.1 says the server "checks the player holds it (a keycard in inventory or a
`saved_cards` entry on a held `rfid_cloner`) and resolves it against NPC `creds.card`. This is
tighter than today at no extra authoring cost." It is tighter than today (today `rfid` is trusted
blind with no `card_id`, `game.rb:1156-1161, 1245-1248`). But the cloner's `saved_cards` are
written by the client: the RFID minigame POSTs them (`rfid-data.js:369-370`) and the server stores
the client's array verbatim (`games_controller.rb:1000-1003`, `game.rb:1825-1835`). A modified
client can save any NPC's `card_id` and open its ACL door. Keycards in inventory are stronger,
since M6 stores the server's canonical copy. So there is an asymmetry the plan should not paper
over: cloned-card identity is as forgeable as today's blind trust.
*Change:* keep the mechanism (it is a real tightening and fits the game's client-trust model) but
do not present cloned-card resolution as security. If a puzzle must not be bypassable, gate it on a
server-established fact (a keycard physically held, a capture earned), not on a cloned-card
identity. State this limit beside the 4.1 claim.

**M3. Profile item ids are not stamped and are not checked for collision.** Item ids are global and
the "already held" filters and all three container lookups key on them, but `stamp_scenario_object_ids!`
walks only room objects and their nested `contents` (`game.rb:3059-3074`). Top-level `profiles`
(5.1) sit outside rooms, so their item ids are never stamped: a profile file with no `id` gets
none, and two profiles (or a profile and a room object) that reuse an id collide in `held_in?`,
`find_container_in_scenario` and `find_object_in_scenario`. "A takeable file taken from a profile
is gone from that profile on every PC (the server's existing already-held filter does this)"
(5.1) only holds if every profile item has a unique, stable id.
*Change:* stamp ids onto profile contents at create (extend `stamp_scenario_object_ids!` to walk
`profiles`), and add a validator error for a profile item with no id and for an id shared between
any two profile items or between a profile item and a room object. Add this to 10.4.

**M4. The default account picker needs server-composed data the client cannot build.** Plan 5.3
makes `loginPicker: "accounts"` (the default) show "Tiles for every account the PC's `access`
admits", with the NPC's portrait and username. With a role ACL (e.g. `{roles:[staff]}`) that is
every NPC with `creds`, in any room; the client at the PC only holds loaded-room NPCs, so it cannot
enumerate them, and it must not receive passwords. The plan does not say how the tiles arrive.
*Change:* compose the picker server-side (a field on the login PC payload, or a small endpoint):
for each admitted identity, `{ npcId, username, portrait }` and nothing else. Note in 5.3 that the
"accounts" list is server-built from `access`, that `"known"` additionally filters by
`encounteredNPCs`, and that no password or `creds` field is ever in it. Add "account tiles" to the
10.2 server tasks and 10.3 client tasks.

**M5. Copy must be honoured in every already-held filter, not "the already held filter".** Plan
5.1 Copy says the server records the file in `player_state.copiedItems` "so the already held filter
does not hide the original". There is more than one such filter, and all use `ItemIdentity.held_in?`:
`filter_container_contents` rejects inventory matches (`games_controller.rb:1736-1762`),
`apply_room_state_changes!` rejects inventory matches from room objects (`game.rb:976-978`), and the
inventory add short-cut returns "already held" before any add (`inventory_includes?`,
`games_controller.rb:973`). A Copy puts the file in the inventory, so without `copiedItems` consulted
in the container filter the original vanishes from the PC on the next open, and the short-cut may
mishandle a re-Copy. The per-identity compose path in B1 is a fourth site.
*Change:* define `copiedItems` as a set of item identities and have the login PC's compose/filter
skip the already-held rejection for a copied id (while still filtering genuinely taken Move items).
List every filter the rule touches in 5.1, and test "Copy a profile file, reopen the PC, the
original still shows".

### Minor

**m1. The `login` lock type and its two values need plumbing.** `UNLOCK_METHODS_BY_LOCK_TYPE` has
no `login` entry (`game.rb:1035-1044`) and `validate_unlock` carries a single `attempt`
(`game.rb:1107`, controller `:863`), but a login needs a username and a password together. Decide
whether login rides the unlock endpoint with a packed `attempt` or gets its own route, and add
`login` to the method table (or handle it before the table, as `npc`/`unlocked` are). Say so in
5.3 / 10.2.

**m2. `profiles` and `posts` already name different concepts.** The osint browser reads
`social.landingPages[].profiles[].posts` (social-media profiles with posts; `osint-model.js:63`,
e.g. `lab_social_engineering/scenario.json.erb:742`). The plan's top-level `profiles` (roaming
desktop contents) and NPC-level `posts` (7.3 social-media feed) reuse both words for unrelated
things. No hard JSON collision (different nesting), but it will confuse authors, especially once
7.3 lands. Consider `accountProfiles` / `desktopProfiles` for the top-level block, or at least call
out the distinction in the schema docs.

**m3. Server-counted lockout is new state; say where it lives and that reset clears it.** 5.5
`maxAttempts` "locks that account out on that PC for the mission". That is a new per-(account, PC)
counter in `player_state`; name the key, and confirm `reset_player_state!` drops it (it keeps only
an allow list, `game.rb` reset). Otherwise a reset leaves an account locked out.

**m4. The "card skips a lock" validator check needs lock-order data the walk may not have.** 10.4
wants a warning when a card opens a door "earlier than the dungeon graph's intended route". That
needs per-lock ordering/depth, which the field-list validator does not compute today; confirm the
dungeon-graph tooling exposes a reachable order the validator can read, or scope this to "lists the
doors each identity opens" (no ordering) for slice 1 and defer the earlier-than warning.

**m5. Unlocked sessions are a client-trusted bypass of "contents only after a password"; bring the
section-9 warning into slice 1.** (Cost of a decided design.) The decision to honour unlocked-session
claims "only where the scenario makes one possible" (2, 5.4) is the user's. The cost: the
screen-locked outcome is a client-side seeded roll (`decideLocked`, `workstation-state.js:65-73`),
so on a `locksScreen: sometimes` PC a modified client can always claim the session regardless of the
roll, and the server cannot tell. Within the decision, the mitigation is the section-9 validator
warning (no puzzle-critical opening may rest on a `sometimes` session). Since unlocked sessions ship
in slice 1, move that warning into the slice-1 validator work (10.4), not section 9's later bucket,
so a scenario cannot gate progress on a client coin-flip from day one.

**m6. Two homes for a password invite drift.** `creds.password` (new) and `usePayload.secret` (the
capture beats, `lab_physical_pentest` beat 1) can both hold an NPC's password. A scenario that both
logs in and captures the same NPC must keep them equal by hand. Add a validator cross-check (when an
NPC has both `creds.password` and a `usePayload.secret`, warn if they differ) so a capture view and
a login prompt never disagree.

**m7. Confirm the writesDown sticky note reaches the login minigame.** `postitNote` / `showPostit`
are known item fields (`validate_scenario.rb:492`) and survive the room filter (they are not lock
fields), so a login PC object can carry the note. But today the password minigame reads `postitNote`
from room fields for door locks (kept at `game.rb:820-821`); confirm the login mode passes the
**object's** `postitNote` through, and that the server fills it from `creds.password` only when the
`writesDown` habit is on. A quick note in 6.2 that the fill is server-side on the object payload
avoids a silent empty note.

## 4. What checked out

- RFID trusted from the client, no `card_id` sent: `game.rb:1156-1161, 1245-1248`;
  `unlock-system.js:38` (`apiClient.unlock(type, targetId, null, method)`).
- `rfidCard` is already client-visible and drives the clone flow, so reading it as `creds.card`
  keeps `clone_keycard` and the RFID minigame working: `npc-conversation-state.js:675-698`,
  `chat-helpers.js:370-375`, `unlock-system.js:72-82`.
- Attempts counted only client-side: `password-minigame.js:36, 458`.
- `text_file` always opens the viewer: `container-minigame.js:454-456`.
- Workstation layer as described: `ownerOf` `workstation-state.js:52`, `decideLocked` `:65-73`,
  globals `:106-114, 136-138`.
- `NPCNeedsSystem.roll` / `seededRoll`: `npc-needs.js:113, 220`.
- SE systems install only with `social.characters`: `social-influence.js:804`; `pretextNpcs`,
  `phishTargets`, influence bands all real (`interactions.js:665`, `mail-runner.js:101`).
- Capture store closed key set and bootstrap secret strip: `captures.js:21`, `game.rb:851-857`.
- Validator field lists at the cited lines: rooms `validate_scenario.rb:405-409`, NPC `:412-419`,
  items `:484-510`, top level `:390-394`. None of `role`, `creds`, `awareness`, `habits`,
  `access`, `profiles`, `policies`, `loginPicker`, `transfer` is used yet, so they are free to add
  (`needsHome` is already present, `:417`).
- `saved_cards` is persisted server-side (so the held-cloner check in 4.1 can run), via
  `update_cloner_saved_cards!` `game.rb:1825-1835` — but client-written, see M2.

## 5. Open questions for the user

- **M2:** accept cloned-card identity as client-trusted (consistent with today), or require a
  stronger path for any door whose bypass must be prevented?
- **M4 / 5.3:** is the default login prompt the portrait `accounts` picker, given it must list
  every admitted NPC across rooms (server-composed), or should the default be `known` (met NPCs
  only) to keep the list small and the leak minimal?
