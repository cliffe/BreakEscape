# OPS_CORE_PLAN review, round 1

Reviewer: Opus 5.5, adversarial. Plan: `docs/achitechture/OPS_CORE_PLAN.md` at `bd350990a`.
Code read in the `ops-plan` worktree at the same commit. Plan lines are `P:<n>`; code short forms
as in the plan (NA, GM, GC, CK, CM, NV, VN, VS, SC, DG).

**Status: partial.** Stopped at the context limit. Done: checks 1, 2, 3, 4, 6, most of 7, and the
core of 8. **Remaining for round 2:** check 5 in detail (each route's idempotence and repeat answers
beyond the 403/404 order below), check 7's JSON examples against `SC` property by property, check 9
(the 15-section template, stage-alone shippability beyond M9, the playtest beat tables in 11.4,
the ten open questions and the twelve cross-plan requests).

Counts: blocker 0, major 4, minor 11, nit 4.

## Findings

### M1 (major). `host_row` has no foothold, so the view cannot apply `technique_session_through?`

P:389-394 says `host_row` (NA:1043) and the client's `hostAction` take "the same predicate so that
the view and the server agree". The predicate needs the foothold the request names
(`technique_session_through?(session, foothold_id)`, P:380). `host_row(pc)` takes no foothold, and
neither does its caller `network_rows(network_id)` (NA:873); both are called from `network_view`
(NA:770), `network_blocks` (NA:804) and `down_blocks` (NA:820). With the plan as written the row
must either list the technique session in every foothold's view or in none.
`NetworkView#act` opens a held session with the view's own foothold (`start(row.id, footholdId)`,
NV:879), so a player holding two footholds that both reach the blocked host sees Open in the second
foothold's view and gets 403 `unreachable`, the exact case P:405 lists as refused. The code's own
rule is that a block "advertises no action the server would refuse" (NA:817).
Fix: thread the foothold id through `network_rows(network_id, foothold_id)` and `host_row(pc,
foothold_id)` (all three callers have it), list a technique session on a `remote: "blocked"` host
only in the view of its own foothold, and have `hostAction` key on a server-set flag (for example
`session.route.foothold` equal to the view's foothold) rather than on `via` alone. Add a test row:
two footholds, blocked host, technique session through the first, second view offers no Open.

### M2 (major). The schema's top level and the item definition are open, not closed

P:146-149 rests "no field is reserved ahead of its stage" on the claim that "a service entry, a
`hosts` entry, a network entry and the scenario's top level are all closed blocks". In `SC` the
top level has no `additionalProperties` (keys: title, description, x-engineGlobals, type,
required, properties, definitions), and `definitions.item` has none either (177 properties, no
`additionalProperties`). An unknown top-level key is caught only by the corpus test
`test/js/validator-declared-top-level.test.mjs`; an unknown key on an object or item is only a
warning from `schema_unknown_key_warnings` (VS:790-800, "Unknown keys here stay warnings"). So a
scenario that writes `services` on a sign-in object or `technique` on an item before its stage
validates with a warning, and the engine of that stage ignores it silently.
Fix: correct P:146-149. For the item-level fields (`services`, `technique`) say they are added to
`definitions.item.properties` in their stage and that before then they produce the existing
unknown-key warning; for `hosts` and `techniques` say the declared-top-level corpus test is the
gate. If the plan wants an error, add a validator error for `services`/`technique` keys while the
stage's flag is not built (as `CM.kind_built?` does for keyring kinds, CM:46).

### M3 (major). 403 versus 404 on the scan route tells a real host or network id from an invented one

P:449-454: every route checks "the foothold is held (404), then the target exists (404)", and only
then "network in reach (403 `unreachable`)" and, for a host, "its network swept or open (404)". A
`hosts` id or a network id is server-only (withheld, P:466). A client that guesses ids (from a
prop's name, a document, a lab sheet, a printer's sticker) gets 403 for a real host on a network
it does not reach and 404 for a made-up one, so the route answers "does this host exist" before
any sweep. The same holds for a `network_id` sweep outside reach (403) against an invented id
(404). This breaks the standing rule that the browser never learns what it has not earned
(brief section 3) and the code's pattern that an unadmitted share "answers as an unknown id"
(GC:640-644, quoted at P:121).
Fix: for `/scan` with `host_id`, and for `/check` and `/confirm`, answer one 404 for "no such id",
"network not reached" and "network not swept"; for a sweep, answer 404 for any network id not in
`player_reach(foothold)`. Keep 403 `not_responding` only after the target is known to be listed for
the player. Add these to `network_ops_no_exposure_test.rb`.

### M4 (major). Confirm is free, so decoys teach nothing

P:86-91 says "decoys cost a confirm step, so checking before acting is the habit that pays". In the
plan the confirm step costs nothing: no game time (question 6 open), no risk, no log consequence
in this plan, no precondition (P:456: finding held, host reachable and responding). A player
confirms every finding on sight, so the loop is Sweep, Scan, Check, Confirm-all, then match: four
clicks that always succeed, with the only decision at the card. A wrong card is also free
(question 4), so with two or three cards trial and error beats reading.
Fix, as a recommendation for question 4/6 rather than a silent choice: give confirm a real cost or
a real input. Options: (a) confirm takes something the player must find (a version note on a
share, a manual, an NPC's remark), so a decoy is ruled out by evidence; (b) confirm and a wrong
card each write an S9 log row that a defender NPC or an alert can react to, so noise is the cost;
(c) a per-host budget of attempts before the host stops answering. (a) teaches verification best
and needs no clock. State in section 1 which one the plan takes.

### m1 (minor). A no-route folder request bypasses the own-foothold rule

`folder_route_allowed?` (GC:3185-3197) returns true for a no-route request at any non-relay
session; the folder is then judged by `session_admits?` (GM:3260-3270: session held, not locked,
route up). So under a technique session on a `remote: "blocked"` host, folders open with no
`foothold` param at all, from any foothold or none. P:394 ("Folders under the PC are judged by the
same method and follow") and the 11.2 test row "its folders through its own foothold and through no
other" (P:687) are not what the code does. The player did earn the session, so the harm is small,
but the table at P:396-408 is incomplete. Fix: either list the case as accepted, or make
`folder_route_allowed?` refuse a no-route request at a technique session unless the PC is
physically reachable.

### m2 (minor). Keyboard route and `from` source are missing from the "stays refused" table

A technique session at a PC the player can walk to is served at the keyboard
(`desktop_request_allowed?` keyboard branch, NA:1512-1516) with no password: the player sits down
and is the account. A technique session is also a valid `from` source for sign-in to other PCs
(`from_route_refusal` ignores the source's own `remote: "blocked"`, NA:1347-1349). The plan flags
the keyboard case as an unasked design call (P:353) but it is not in section 15. Fix: add it to
question 5 or 10 with options (serve; refuse at the keyboard and show the sign-in screen; serve but
end the technique session and start a keyboard one), and list both cases in the table.

### m3 (minor). Readers of session records the plan does not mention

- NPC borrow "done" deletes whatever session the player holds at that PC (`record_borrow_done!`,
  `npc_frustration.rb:391-396`), so an office-life NPC sitting down ends a technique session.
- `end_guest_session_at!` runs for every non-claim sign-in (GM:4392): a technique grant from across
  the network ends an NPC guest's session at a PC the NPC is sitting at.
- Client: `screen-states.js:38` `signedInVia` is `password || credential`, so the PC's screen in the
  world will not show signed-in for a technique session; `pc-sessions.js` `sessionLockable` (:176)
  agrees with the server (no Lock), `load` (:352-387) keeps the session but drops `access`.
- `signedInPcs` readers: `capture_proofs.rb:177` (capture `session` proofs), the keyring's
  `session` proofs, and `objectives-manager.js` sign-in tasks all count a technique session for
  good. Question 8 covers this; the plan should name these three readers.
Fix: add a "who reads a session" table to 5.4 with each reader and what a technique session does
there, and decide the two NPC cases (probably: both stand, and say so).

### m4 (minor). `access` is lost on reload and in `GET /scenario`

P:327-328 adds `access` to the technique answer, and P:392 to `host_row`. `session_for_client`
(GM:3778-3791) builds from `login_session_answer` (GM:4433), which has no `access`, and
`pc-sessions.js` `load` and `publicSession` (:186-207, :371-383) copy named fields only. After a
reload the client no longer knows the level, which S5a will need. Fix: pass `access` through
`login_session_answer` and `session_for_client` when present, and copy it in `pc-sessions.js`.

### m5 (minor). `GET /network` top-level `techniques` must be omitted when empty

P:479 puts `techniques: {}` at the top level of `GET /network`. Today the body is `{ footholds }`
(NA:773). If the key is always sent, every existing scenario's answer changes, against P:630 ("the
same bytes as today"). The golden test would catch it, but the plan should say: sent only when the
player holds at least one card.

### m6 (minor). Shares on an unswept discovery network are still served

`resource_admits_player?` (NA:1580-1625) admits an open share to any foothold whose `player_reach`
includes its network, with no discovery check. Resource ids are withheld, but share ids are often
guessable from in-world text. P:278-280 hides resource rows until the sweep but P:286-295 enforces
only hosts. Fix: add the same "open or swept" condition to `resource_admits_player?` for the
foothold branch (a session branch is a keyboard or earned session and can stay).

### m7 (minor). Read the card's `technique` from the authored definition, not the inventory copy

P:316 says "the item is held, not forged, and carries a technique in the registry", and 11.2 tests
"an item with a `technique` field the client added". The plan does not name the check. The
existing pattern is `credential_held_proof_holds?` (CK:42-64): inventory entry not
`client_forged?`, id and type equal to the authored definition, field compared on the definition.
`inventory_item_matching` (NA:454-463) is weaker: it also matches by `name`. Fix: name the
identity-strict pattern for the card and for `needs.item`, and say `needs.item` names an item id
or type, never a name.

### m8 (minor). `needs.global` is a soft gate the plan does not call one

`fixedIf` is flagged as soft (P:576), but `needs: { global: ... }` (P:41) is equally client-written
when the global is not server-owned, so a forged sync can meet it. A session grant is
credential-equivalent, which the cheat policy says the server hard-enforces. Fix: allow only
server-owned globals in `needs.global` (`server_owned_global_name?`, GM:187), or add the same
validator warning as `fixedIf` when a global is the only need besides the card.

### m9 (minor). Validator pointer VN:364 is the pivot-host rule; devices cannot pivot

P:548-549 says the VN:364 rule ("a network with no host to pivot through") takes `hosts` entries
into account through `hosts_on`. That rule's `host_on` (VN:362) asks whether a sign-in host stands
on the network, because only a session can pivot. A device from `hosts` has no session and is no
pivot. Fix: add devices to `carries` (VN:363, what a network holds) but not to `host_on`. VN:587
(two hosts with one label) can take both kinds.

### m10 (minor). `lock_key_diff.rb` classes nodes by `kind`, not by id prefix

P:605-607 says `lock_key_diff.rb` "treats `weak_*` as a lock and `tech_*` as a key". It reads
`n['kind'] == 'lock'` / `'key'` from the graph JSON (`scripts/lock_key_diff.rb:188-189`), so no
prefix rule is involved and no change to it may be needed. P:596-598 says "class `lock`"/"class
`key`". Fix: say the graph gives the new nodes `kind: "lock"` / `"key"` (check DG's field name), so
the diff picks them up as it does today, and drop `lock_key_diff.rb` from build step 12 unless a
change is found.

### m11 (minor). `technique` and `techniques` already mean pretext techniques in scenario files

Social engineering scenarios use `technique` on pretext lines and `tells.techniques` maps
(`scenarios/test_dm_social/scenario.json.erb:109-127`, `pretext-judge.js:187-241`, SC:3603). The
brief binds the word `technique`, so keep it, but authors and the README index will meet two
meanings. Fix: note the collision in section 4.3 and in the README feature index entry, and keep
the ops registry key distinct in prose ("technique card registry").

### n1 (nit). Card ids name the technique before pickup

A card item rides in room data with `technique: "<techniqueId>"` (P:532). An id like
`shareserve_3x` tells the player the product and versions before they hold it. Add the
telltale-word warning's idea: warn when a technique id contains a product word.

### n2 (nit). `hostAction` order

P:426: `open` for a technique session "before it reads `remoteSignIn`". Keep it after the
`responding === false` test (NV:216) so an off host still shows not responding, as the server
answers `not_responding` (P:390).

### n3 (nit). `ops: true` on an unswept block

P:468 accepts that `ops: true` says scanning is worth trying. On a discovery network it also says
the network has at least one host, which P:467 says is never told before a sweep. Small; say it.

### n4 (nit). `start_login_session!` keyword list

P:321-323 adds `access:` and `technique:`; `login_session_answer` and `session_for_client` need the
matching keyword (see m4), and the record key `technique` holds a finding id, not a technique id.
Rename the record key to `finding` to avoid the confusion in S5a and S9.

## Verified, no finding

- Sync cannot write sessions or the ops keys: `merge_last_write_wins_sections` and
  `merge_grow_only_sections` (GC:2745-2990) read only currentRoom, globalVariables,
  npcInkVariables, timedMessages, phoneState, mailState, npcVisibility, npcHostility, playerHealth,
  notes, scenarioBriefShown, triggeredEvents, scenarioClock, commandBoardLog, biometricSamples and
  captures. `start_login_session!` has four callers, none fed from a sync.
- Unplug ends a technique session everywhere: unplug is the only foothold delete
  (NA:302-303), followed by `end_sessions_through!` (NA:410-415) and the prune. Outages and host
  power never prune (NA:1437). An implant whose source PC is off reaches nothing, so the desktop is
  refused while the session is kept.
- `settle_session_at_keyboard!` (NA:1556-1565) can take the early return as described.
- Keyring: `PROOF_KINDS` (CM:36), `proof_kind` (CM:62-67), `credential_proof_holds?` (CK:21-36,
  unknown kind is false) and `credential_how` (CK:420-427, `else 'found'`) match the plan. The
  validator rules for `password` needing `foundIn` and `token` needing a foothold proof are at
  VS:7473-7510. A saved connection honours lockout and `remote: "blocked"` at sign-in
  (CM:23, `credential_login.rb:203-240`), so the printer-to-file-server example only works when the
  file server allows remote sign-in: worth one line in 4.3.
- State: the three keys go in `ACCESS_STATE_DEFAULTS` (GM:3021), filled with `dup` (GM:7576);
  the bootstrap uses a whitelist of player_state keys, so they are not sent.
