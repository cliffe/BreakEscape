# S5a server side, review R1

Scope: the server commits "Ops S5a" 01 to 07 in `3034e2301..cc0f968d7`, the orchestrator's test edits `5361d49a6`, `9c1ef409e`, `f9c0145a6`, and the merge resolution of `cc0f968d7` in `lib/break_escape/ops_log_events.rb` and `test/models/break_escape/ops_log_test.rb`. Read-only review; committed code only.

Findings are appended below as each check is finished.

## Check 1: `session_access` and its readers (unit 02)

Read at `app/models/break_escape/game.rb:3300-3338` (helper, `account_admin_at?`, `session_admin?`, `keyboard_admin?`), `:4796-4798` (`client_access_level`), `:4777` (sign-in answer), `:3963-3975` (`session_for_client`), `network_access.rb:1104` (host row), `network_access.rb:1201-1230` (`session_route_up?`), `credential_keyring.rb:183` (expiry), `network_access.rb:1581-1590` (relay and remote-route predicates), `network_access.rb:1607-1618` (`settle_session_at_keyboard!`).

Answer per session kind, by the code, against plan P336-343:

| Session | Code answers | Plan | OK |
|---|---|---|---|
| no record | nil (`:3302`) | nil | yes |
| expired token (`via: credential`, token run out) | nil (`:3303`) | nil | yes |
| locked (any kind) | nil (`session_identity` nil, `:3305-3306`) | nil | yes |
| account NPC gone | nil (same line) | nil | yes |
| PC service off | nil (`session_route_up?` false at `network_access.rb:1208`) | nil | yes |
| route down (foothold unplugged, outage, `from` source lost, relay invite ended) | nil (`:3307`) | nil | yes |
| relay (stored `relay: true`, `via: credential`, even of a `creds.admin` account) | `user` (`:3308`, before the `credential` branch) | user | yes |
| claim (owner or guest) | `user` (`:3308`) | user | yes |
| technique | `admin` only when stored `access == 'admin'`, else `user` (`:3311-3312`) | same | yes |
| keyboard password, foothold password, `from` password, keyring credential (foothold or `from`), token | `admin` only when `creds.admin == true` and `pc_admits_account?`, else `user` (`:3313-3315`) | same | yes |
| unknown or missing `via` | `user` | user | yes |

- A stored `access` key is read only in the `technique` branch; a password, credential or claim record carrying `access: 'admin'` is `user`. Confirmed.
- `creds['admin'] == true` is a literal comparison (`:3324`); `"true"` and `1` are user.
- Readers: `session_admin?` is `== 'admin'`; `keyboard_admin?` returns false first unless `session_admin?`, then needs a blank `foothold` and not `remote_route_session?`; `client_access_level` is the helper; all three callers of `client_access_level` (`game.rb:4777`, `network_access.rb:1104`; `network_ops.rb` no longer calls it) compare `== 'admin'`. No negated test and no truthiness test on a level anywhere in `app/` or `lib/` (grep of every reader: `network_ops.rb:393` is the one `.nil?` test, used as "has a level", which is the brief's unit 03 rule).
- **O1 (relay never feeds a step up): confirmed.** `ops_need_session` (`network_ops.rb:391`) keeps `!relay_session?(session)`; a relay record of an administrator account is `user` by step 5; a relay record is never `keyboard_admin?` (`remote_route_session?`); the implant path answers `needs_console` or `not_ready` for it; `plant_admin?` for it is false. The only writer of a technique record is `ops_technique_grant!` (`network_ops.rb:624`), reached after `ops_unmet_need`. No path found where a relay record yields admin.
- A technique record cannot become a keyboard session: `settle_session_at_keyboard!` returns for `via: 'technique'` (`network_access.rb:1614`) and for `via: 'credential'` (`:1612`); the technique writer always passes the route's `foothold_id` (`network_ops.rb:624`). A foothold PASSWORD admin session does become a keyboard admin session when its desktop is fetched with no route at a reachable PC (`:1616`); that is the existing "settled at the keyboard" rule and the plan's P367 wording, not a finding.

No blocker or major in check 1.

**F1 (minor). `keyboard_admin?` depends on call order for nil safety.** `game.rb:3333-3337`: `session['foothold']` is read after `session_admin?`; safe today because `session_admin?` true implies a Hash record. No fix needed; note only (a comment would do).

## Check 2: admin profile read (units 05 and 07)

Read at `game.rb:3349-3378` (`session_admits?` on `session_admitting`), `:3402-3423` (`scope_admitted_by_session?`), `:3454-3486` (`admin_profiles_at`, `admin_session_opens_profile?`, `admin_profile_reader`), `:3490-3508` (`login_desktop_contents`), `:3511-3521` (`find_login_item`), `:3543-3546` (`admin_present_accounts`), `games_controller.rb:627-651` (`#container`), `:3240-3266` (`container_reach_refusal`), `:3268-3290` (`record_admin_profile_read`), `:3335-3364` (`render_login_desktop`), `:3697-3709` (`validate_login_item_collectible`).

**Every caller, and what each now gets:**

| Caller | Asks | With S5a |
|---|---|---|
| `games_controller.rb:3250` `container_reach_refusal`, share branch | `session_admits?` of a `resource` scope | unchanged (the `resource` branch was not edited) |
| `games_controller.rb:3259` `container_reach_refusal`, PC and profile branch (`GET /container`, and `GET /log_rows` through `log_reader_reached?` `:3306`) | `session_admits?(scope)` and `path_unlocked?` | a folder or reader inside a profile also opens when SOME held PC P has `session_admin?(P)` and the profile's `for` admits `owner` of P. Refusal for anything else is the same `:locked` (403 "Container not unlocked") as before |
| `game.rb:4505` `unlock_scope_refused?` (`/unlock`, and the keypad feedback helpers) | `session_admits?(scope)` and `path_unlocked?` | the same widening: a locked folder in the owner's profile may be attempted (its own lock still has to be met) |
| `games_controller.rb:3709` `validate_login_item_collectible` (inventory add with `source_pc_id`) | `find_login_item(pc)` then `scope_admitted_by_session?(scope, pc['id'])` | a profile item is admitted only when the session AT THAT PC is admin and that PC's owner is admitted by the profile. An admin session at another PC does not help |
| `games_controller.rb:3363` `render_login_desktop` | `login_desktop_contents(pc, npc)` | lists the extra profiles only when `session_admin?(pc['id'])`, that PC's owner only |
| `game.rb:3395` `ops_share_as` | `session_admitting` of a share | unchanged |

- `find_login_item` (`game.rb:3511`) searches every profile; its one caller (`games_controller.rb:3705`) always runs `scope_admitted_by_session?` on the result at `:3709`. No caller uses its result without the scope check.
- Live, unlocked, at that PC, route up: all four readers reach the admin term only through `admin_session_opens_profile?` (`game.rb:3464`), whose first line is `session_admin?(pc_id)`, so locked, expired, PC off, route down and account gone all end it (check 1 table). The profile set is `admin_profiles_at(pc)` of the same `pc_id`, never another PC's.
- Another PC's owner's profile: not reachable. With an admin session at P only, `admin_profiles_at(P)` holds only profiles whose `for` admits `owner(P)`; an account that owns no PC the player holds admin on is never in the set. A role profile opens when the owner has the role (plan P392).
- Reach check before the row: `record_admin_profile_read` is called at `games_controller.rb:643`, after `container_reach_refusal` returned nil at `:640-641`. The profile id it reads is `located[:scope][:id]`, a key of the scenario's `accountProfiles`, never a request value: a client cannot send a malformed profile id. An unknown container id still answers 404 "Container not found", an unadmitted profile folder still answers 403 "Container not unlocked" (the code path of both is untouched).
- **PC off and expired token ending the read: right by the code** (`session_access` steps 2 and 4). A test is needed only because the brief lists both for unit 05; see F5.

**F2 (minor). `admin_profile_reader` does not use the session order the rest of the file uses.** `game.rb:3484`: `access_sessions.keys.find { ... }`. The brief (unit 05) says "the first PC, in session order"; `session_admitting` (`:3372`) uses `sessions_oldest_first` because, as its comment at `:3381` says, "the stored state keeps no key order". When two held admin sessions (two PCs with the same owner, or a role profile) could both claim a profile, the row's `where` can differ between reads, and since `where` is part of the `once` digest (`ops_log.rb:675`) the same read can store one row per such PC rather than one. Bounded (one per PC), no secret. Fix: `sessions_oldest_first.map(&:first).find { ... }` in both lines of `admin_profile_reader` that walk the sessions.

**F3 (minor, note). A sign-in-PC-typed object authored inside a profile skips the reach check before the row.** `games_controller.rb:3257` returns nil for a `login_pc?` object before `session_admits?`; `:643` then calls `record_admin_profile_read`. The row is still written only when `admin_profile_reader` finds a live admin session that opens that profile, so nothing unearned is stored; the desktop is then judged by `render_login_desktop`. Authoring nonsense rather than an attack. Fix if wanted: call `record_admin_profile_read` inside the `elsif located && located[:scope]` branch (`:650`), which is "the scoped branch" the brief names.

**F4 (minor, note). `find_login_item` answers the first match in `accountProfiles` order, so a same-named item in an earlier profile the session is not admitted to hides the admin-opened one** (`game.rb:3515-3518`, then refused at `games_controller.rb:3709`). The listing shows the item, the add is refused "Not available to this session". This existed for role profiles; S5a makes it more likely, and unit 13's warning (a) is the plan's answer. No server change asked; record it for unit 17's docs.

## Check 3: USB override and `needs_console` (units 06 and 07)

Read at `access_work.rb:1200-1207`, `network_access.rb:503-536` and `:656-658`, `capture_proofs.rb:26-60` and `:153-211`, `games_controller.rb:1449-1464`.

- `plant_refused?(…, admin:)` returns false only for `admin == true` (`access_work.rb:1201`). The keyword is passed at two sites: `network_access.rb:526` (`keyboard_admin?(pc_id)`, a strict Boolean) and `capture_proofs.rb:34` (`plant_admin?`, a strict Boolean). The remove check (`capture_proofs.rb:54-56`) calls the default and then asks `plant_admin?` itself, which is the same rule. `access_work.rb:1269` (NPC side), `validate_access_work.rb:333` and `validate_network.rb:761` pass nothing.
- Implant path: no record → `not_ready`; a record with a `foothold` or a relay or `from` route and a level → `needs_console`, before the device is looked up or copied; the same record with no level (locked, expired, route down, PC off) → `not_ready` as before; a keyboard or claim record goes on as before. The keyboard-only rule is not widened: nothing new reaches `:519` onward.
- `plant_policy_refusal` writes nothing (reads only; `plant_target_for` is the old early-return block moved unchanged into a private method, compared line by line with the removed text).
- Inventory remove: the 422 returns at `games_controller.rb:1458-1461`, before `record_planted_item!` and `remove_inventory_item!`. Nothing is removed or recorded on a refusal. A plant can be recorded against a refusing policy only when `plant_admin?` is true at that moment (same request, same loaded state as the check).
- `plant_admin?` is false for a governed object that is neither a sign-in PC nor a `needsSession` object (`plant_admin_pc` nil, `capture_proofs.rb:186-191`).
- **`network_implants_test.rb:116` left at `not_ready`: right.** Its session (`:113`) names foothold `jack_comms_port`, which the game does not hold, so `session_route_up?` is false (`network_access.rb:1227`), `session_access` is nil and the brief's own rule (unit 06 "only where the test's session is live", open item 3) keeps `not_ready`. The live cases are pinned in `admin_usb_test.rb:155-188` and by the two changed assertions. Confirmed by running the file at `cc0f968d7` (passes).

**F5 (minor). `plant_policy_refusal` answers before the room check, so the `remove` action now tells a client about an object in a room it has not opened.** `capture_proofs.rb:51-59` (no `room_unlocked?`); `record_planted_item!` checks the room at `:35`, after the policy. Request: `POST /inventory { action_type: "remove", item: { id: "<held stick>" }, used_on: "<id of a PC in a locked room>" }` with a held item that object's `requiresItem` names and a class its policy refuses. Before S5a: 200 `{ success: true }` whatever the object (the item was removed, nothing recorded). Now: 422 `usb_refused` with the policy's line, which confirms that the object exists, takes that item and what its USB policy is, for a room never unlocked. Breaks the spirit of section 5 point 6 ("cannot be used to probe objects"). Low value (it needs a matching held device) and nothing is granted. Fix: in `plant_policy_refusal`, `return nil unless room_unlocked?(found[:room_id])` before the policy line, so such a remove answers exactly as it did before S5a; add one test.

Note, not a finding: under a live non-keyboard session with NO device held the implant now answers `needs_console` (the check at `network_access.rb:509` precedes the device lookup at `:519`). That is the brief's build text ("every other case of those two returns stays `implant_not_ready`"), and the client shows the toast only after its own confirm, so nothing is wrong; it is not pinned by a test.

## Check 4: the two log rows

- `usb_install_overridden` is written at `network_access.rb:532-536` after every refusal of the session branch has returned and before the path's one `save!` (`:556`), and at `capture_proofs.rb:37` after the policy and room checks and before that method's `save!`. Neither is reached on a refusal; `plant_policy_refusal` writes none. `as` is the admin session's account (`ops_account_as`), `where` the PC that judged the override, detail `device` is the item's `usbClass`, which `plant_refused?` true guarantees is `storage` or `hid`. No `once` and no `save_limit`, as the brief asks: each write rides a save the action makes anyway, and each needs a held device that the same request consumes.
- `admin_profile_read` is written at `games_controller.rb:3285-3289` after the reach check; `once: true`; `save!` only when `row&.stored?`. The `once` digest is event, `as`, `where`, result, detail (`ops_log.rb:675`), all taken from server state, so a repeating client gets no further save (test counts UPDATEs: 1, then 0, then 0 for five more). Distinct digests are bounded by profiles x admin PCs x accounts of the scenario. `as` is the admin account's username, `where` the admin PC, detail the profile id: no password, no item text, no id the player has not just used. In a scenario without `logSources` the helper answers nil and nothing is saved.
- The id-pattern guard (`games_controller.rb:3277`) is right: a profile id over 40 characters or outside `[A-Za-z0-9_.:-]` leaves no row and the read still answers 200 (in production the helper would only warn; in test and development it would raise and fail a read the player has earned).
- `GET /log_rows` calls `container_reach_refusal` only, which writes nothing.

**F6 (minor). The log validator does not check `accountProfiles` keys; the brief (unit 07 tests) said it did.** `scripts/validate_log_rows.rb:484-499` (`log_stored_id_names`): map keys of `rooms`, `networks`, `resources` and every `id` under `rooms` and `resources` only, although `LOG_ID_MAPS` (`:26`) already lists `accountProfiles` for the name set. What the validator should do: add the keys of `accountProfiles` to `log_stored_id_names` (one more entry in the list at `:486`), so that a scenario with `logSources` and a profile id over 40 characters or with a character outside the stored-id pattern gets the existing error line of `log_check_stored_ids` (`:507`, `:509`). Add one fixture to the validator's JS test, and run `node test/js/ops-unchanged-validator.test.mjs` first: if a shipped scenario gains a line, report it rather than re-record. Keep the controller guard either way (a snapshot game is not re-validated).

## Check 5: `ops_need_session` and the repeat row (unit 03)

`network_ops.rb:388-396`: the three old terms are kept verbatim; the level term is `!session_access(host_id).nil? && (level == 'user' || (level == 'admin' && session_admin?(host_id)))`. A level outside `user`/`admin` meets nothing. A relay record still fails at `!relay_session?`. `:606-607`: the repeat row's `access` is read from the stored record that `ops_technique_repeat` (`:590-596`) has just proved to be the technique record for this finding and foothold, `'admin'` only on the exact string. It can no longer be nil. The answer's `session` still comes from `login_session_answer`, so it carries `access` only while the session is live admin. No finding.

## Check 6: unchanged scenarios (unit 01)

Captured at `0a66faed5`, whose only non-doc files are the cases file and the four fixtures (`git show --stat`); the first engine edit is the next commit. The four cases replay sign-in (typed, wrong, refused account), lock, unlock, Switch user, owner and guest claims, a borrow done, desktops (live, locked, after sign-out), a file and a folder in a profile (with `/unlock` wrong and right), `GET /keyring` three times, a keyboard implant and its repeat, a keyring sign-in through a foothold with its desktop, an ungoverned plant and its retry, and the bootstrap before and after. With the eight `core_*` fixtures (which hold `GET /network` host rows and the keyboard implants of `test_access_networks`) that is a fair proof of section 4's "nothing else" list for the sign-in answer, the mirror, the desktop, the keyring and tile lists.

**Answer: enough for the main surfaces, with three holes (F7). The inlined objects are acceptable.** The fixture stores the whole scenario it replays, so the comparison is "same scenario in, same bytes out" before and after the engine edits; adding four objects takes nothing away from that and adds the only golden cover of the keyboard implant and the inventory `remove` with `used_on` in a keyring scenario. It does mean the keyring fixture is not the shipped scenario; the shipped sockets (`sam_dock`, `kiosk_dock`) are still pinned by `core_test_access_networks`.

**F7 (minor). Three things section 4 says do not change have no before/after capture.**
1. An inventory add from a desktop (`POST /inventory` with `source_pc_id`), the one caller of `scope_admitted_by_session?`, whose profile branch unit 05 rewrote (`game.rb:3412-3416`). No privilege or core case sends one. Unit tests cover it (`admin_profiles_test.rb:157`, and the unmodified access-model tests), so the risk is low.
2. `stick_dock` in the keyring case has no `policy` and is not a workstation, so `usb_governed?` is false (`access_work.rb:1181-1187`): the "plant the USB policy ALLOWS" step never reaches a policy. The governed-and-allowed case is covered only by `privilege_inventory_remove_test.rb` ("a plant the policy accepts is removed and recorded as today"), written after the change.
3. `test_ops_access`, the one shipped scenario with a technique admin session (section 4 item 3, "no answer changes"), has no golden fixture; the claim rests on `ops_access_scenario_test.rb` passing unmodified.
Fix: not a re-record. If the orchestrator wants the proof, check out `0a66faed5` in a throwaway worktree, add cases for 1 to 3 there, capture, and replay them at the head.

**F8 (minor). Section 4 does not list one real change for `test_ops_access`.** Before S5a `client_access_level` read the stored key, so a technique admin session whose route was down, whose PC was off or whose account was gone still sent `access: "admin"` on the mirror entry and host row; now it sends none (`game.rb:3303-3307`). This is the plan's P849 and the brief's M21, and it is the very case commit `5361d49a6` met, but section 4 item 3 says "no answer changes". Fix: add the line to section 4 (and to unit 17's plan-corrections list); check `scenarios/test_ops_access/PLAYTEST.md` and the leak scanner's `admin:<pc>` step for a beat that expects `access` on an unreachable session.

## Check 7: the orchestrator's test edits

- **`5361d49a6`: the reading is right.** The test at `technique_session_record_test.rb:69` calls `with_foothold` (a plant through the route, saved by the request) and then the helper, which wrote the session on the stale `@game` and saved it, overwriting `footholds` with the stale empty value. The record then named a foothold the game did not hold. Before S5a the mirror's `access` came from the stored key and never asked the route, so the wipe went unseen; now the route is down and no `access` is sent, which is what plan P849 and brief M21 ask. The test's stated subject is "access admin only for an admin record", not "access survives a lost foothold", and its own `with_foothold` call shows it meant the foothold to be held. The old test did not pin a behaviour S5a broke; it leaned on one S5a removes by design (F8 asks for that to be written down). The reload is the smallest correct edit. The file passes at the head.
- **`f9c0145a6`: right.** Section 4 item 2 makes the refused plant a 422; the helper's `status:` keyword keeps every other call at 200. Small gap: the second refused remove (`capture_proofs_test.rb:245`) asserts the status but not `reason`, and neither asserts the item is still held (that is pinned in `privilege_inventory_remove_test.rb`).
- **`9c1ef409e`: right.** Both events write `as: { account: }`; the hand-kept list is the place for them.
- **Merge `cc0f968d7`:** `lib/break_escape/ops_log_events.rb` against the main parent differs only by the two S5a events, the `profile` kind and `profile_named`; against the ops-build parent only by main's L3 lines. `ops_log_test.rb` against main differs only by the two event names in `OPS_AS_ACCOUNT_EVENTS`, with main's `share_folder_opened` and the three `net_*` names kept. Both sides are whole. `game.rb`: main rewrote `session_admits?` on `session_admitting`; the admin term is present in the merged profile branch (`:3374-3375`).

Run at `cc0f968d7` under the lock: `ops_log_test`, `privilege_lib_test`, `admin_usb_test`, `admin_profiles_test`, `session_access_test`, `ops_need_session_level_test`, `privilege_inventory_remove_test`, `privilege_profile_read_test`, `technique_session_record_test`, `capture_proofs_test`, `network_implants_test`: 219 runs, 1705 assertions, 0 failures.

## Check 8: tests

Each behaviour the brief lists per unit has a test that would fail if it broke, except the following.

**F9 (minor). Unit 05: two listed cases have no test, and the cross-PC cases are thin.** `admin_profiles_test.rb:130-155` covers locked, gone and route down; the brief also lists expired and PC off (the builder's note says so). Also missing: `session_admits?` of the owner's profile is false, and `GET /container` of `jake_archive` refused, when the only admin session is at a PC the owner does not own (`:100` checks the listing alone); an inventory add of the owner's item through a USER session at another PC while admin is held at the owner's PC is refused; and `:107-116` compares the admin and user refusals by status only, where the brief says "refused exactly as today" (compare the bodies too). Add these five assertions.

**F10 (minor). Unit 06: `admin_usb_test.rb` gaps.** `:174` is named "a live relay session and a live from session" and tests the relay only: add a `from` record with a live source and assert `needs_console`. `:126-141` proves "service off" on two predicates and never sends the implant or the plant proof for an off PC under admin: add both, each refused with the device held. A locked or expired REMOTE session keeping `not_ready` (open item 3) is pinned nowhere: add it, since that one term is what a later reviewer may be asked to change.

**F11 (minor). Unit 07: `privilege_profile_read_test.rb:124` ("GET /log_rows writes none") cannot fail for the reason it names.** The scenario has no `ops_log_terminal` object, so `GET /log_rows/audit` answers 404 at `games_controller.rb:1965-1968` before any reach check, and the test asserts no status. Fix: put a reader inside a folder of `jake_files`, read it under dana's admin session, assert 200 and no `admin_profile_read` row and no save. Also in that file, `:131` "the refusal is unchanged" asserts the status only.

**F12 (minor). Unit 07: the "route an outage drops" case is a PC switched off.** `privilege_inventory_remove_test.rb:138-144` sets `JAKE_OFF_GLOBAL` on a keyboard session. It is a lapsed override, and the test is worth keeping, but the brief's third case (a remote admin session whose network an outage takes down) is not sent through `remove`. Add it if `KeyringLoginScenario` has an `offWhen` network; else say so in the handover.

Tests that cannot fail: F11 only. `session_access_test.rb`, `ops_need_session_level_test.rb` and `privilege_lib_test.rb` were read against their unit lists and match them (hand-set records are used where no route makes the record, and the test names say so).

## Check 9: what reaches the browser

Diff of the server commits read in full. New in any answer: `access: "admin"` on the sign-in answer, the mirror entry and the host row for a password or credential admin session (before: technique only); the owner's profile items in an admin session's desktop listing and its profile folders; the 422 `usb_refused` body of the `remove` action (three keys); the 422 `needs_console` body; the two log rows through `GET /log_rows`, where the profile is shown by its id (M25). All are on the brief's list. `creds` is still deleted whole from every NPC sent (`game.rb:7679`, `:7723`), so `creds.admin` never leaves. No tile list, bootstrap key, sync section or `ACCESS_STATE_DEFAULTS` key was added (`game.rb:3056` unchanged in the diff). `config/routes.rb` and `app/policies` have no diff in `3034e2301..cc0f968d7`.

## Section 5, point by point

1. **Pass.** Profiles are those whose `for` admits `owner` of the admin session's own PC (`game.rb:3454-3469`, `:3543`). All four readers go through `admin_session_opens_profile?` or `admin_profiles_at` of the same PC. `find_login_item`'s only caller checks the scope (`games_controller.rb:3705-3709`). Test gaps in F9.
2. **Pass.** The admin term needs `session_admin?`, which needs `session_route_up?` plus not locked, not expired and the account present: no less than the own-identity term beside it (`game.rb:3374`). A technique admin session on a `remote: "blocked"` host is reached through its own foothold by `technique_session_through?` for its desktop; the profile branch asks the same `session_route_up?`. Nothing more is reached than that session's desktop.
3. **Pass.** Every writer of `player_state['sessions']` is server code (grep: `game.rb`, `network_access.rb`, `credential_keyring.rb`, `npc_frustration.rb`). The stored `access` is read only in the technique branch (`game.rb:3312`); `creds.admin == true` literal (`:3324`). The forged-sync test is unit 15's and was not in scope.
4. **Pass.** nil for no session, locked, expired, route down, PC off, account gone; `user` for an unknown `via`; every reader compares `== 'admin'`. No negated or truthiness test found.
5. **Pass.** Default false; passed at two sites, with the third (the remove check) using the default plus `plant_admin?`; NPC reader and both validators pass nothing; `plant_admin?` false for a governed object that is neither a sign-in PC nor a `needsSession` object.
6. **Pass, with F5.** Token expiry, an unplugged foothold and a switched-off PC each refuse before anything is removed or recorded; a retry answers 200 and changes nothing. But the check answers for an object in an unopened room, which lets `remove` be used as a probe (F5).
7. **Pass.** Keyboard-only is unchanged; `needs_console` needs a held record with a foothold or remote route and a level; a locked admin session takes an allowed implant and gets no override (`admin_usb_test.rb:126`, `:144`).
8. **Pass.** Relay never meets a need; locked and expired never do; a claim does and the result is a technique record with the foothold that cannot be settled at the keyboard; technique `user` for a `creds.admin` account stays user; a password sign-in over a technique admin record takes the account's level; the borrow case is tested at `session_access_test.rb:257`.
9. **Pass.** See check 9.
10. **Pass, with F6.** No secret in either row; a refused plant writes none; `GET /log_rows` writes none (but its test is F11). An over-long profile id cannot come from a request; from a scenario it is stopped by the controller guard, and the validator should catch it (F6). An over-long PC id is already a validator error and, in test and development, raises before either path saves.
11. **Pass.** No route, policy or controller entry for a collect route; `config/routes.rb` and `app/policies` untouched.
12. **Pass.** No state key, no sync section, no list re-sent whole; the rows live in the server-owned `opsLog` under its existing caps, `opsLogOnce` under `MAX_ONCE_KEYS`.

No section 5 point fails.

## Check 10 (added by the coordinator): can a refused stick be planted under admin in real play?

Claim, from unit 15's handover (`HANDOVER_S5a_15.md:22-23`, commit `344aad0c0`): in a validator-clean scenario a storage stick the PC's USB policy refuses can never be accepted under an admin override.

**The claim is right from the code.** Each link was checked:
- (a) `capture_proofs.rb:186-191` (`plant_admin_pc`): the override is judged at the PC of the object's first `needsSession` grant, else at the object itself when it is a sign-in PC (`lockType == 'login'`, `game.rb:3135`), else nowhere. A governed port or workstation with neither is never overridable.
- (b) For the server to record any plant, the target must take the item, and `CaptureModel.object_takes_item?` needs `triggerOnInteract` to be an Array (`capture_model.rb:461`). `scripts/validate_scenario.rb:8301-8304` makes `triggerOnInteract` on a sign-in PC an error ("its interaction is the sign-in flow"), and the client agrees: a `lockType: login` object goes to the sign-in flow at `interactions.js:998`, before the `requiresItem` branch at `:1085`. So a sign-in PC can never be the plant target, and the `session_admin?` arm of `plant_admin?` (the only arm a REMOTE admin session can meet) has no object to act on.
- (c) The `needsSession` arm needs a grant naming the PC, and `validate_network.rb:731` refuses two `grant_foothold` actions for one PC and shape, so that grant is the BadUSB socket's. That arm is also keyboard-only (`keyboard_or_session_admin?`, `capture_proofs.rb:195`), so it could never serve the remote-admin beats in any case.

What IS reachable in play: the HID implant at the BadUSB socket under a keyboard admin session on a `usb: "blocked"` PC (implant path, `network_access.rb:525`), with its `usb_install_overridden` row; and `needs_console` under a remote session.

**The plan does intend a stick plant under admin to be reachable.** P405-406 gives the plant proof and the remove check `session_admin?(found[:object]['id'])` "when the target is a sign-in PC"; P466-471 ("Any other plant takes the override from any admin session ... a foothold with admin disarms that PC's USB lesson for non-session devices") is a statement about play and the reason for the author's note of P454-459; the S5a playtest beats (P1149-1158) have the player "plant a refused stick at the keyboard under admin", "walk to it and plant a second refused stick, which is accepted" under a remote session, and plant "through a confirm's `remove_item`" after a token admin session expires; and the whole of P461-541 (the lapsed-override remove check, units 07, 10 and 11) exists only for that last case. The plan did not notice the validator rule at `:8301`, nor that its own "governed port that takes a stick" (P1136-1137) is tied to no PC by anything in its design: its client rule `plantAdmin(objectData)` falls back to `sessionAdmin(objectData.id)`, and a port's id is not a PC's. So the plan contradicts itself, and the brief repeated it (unit 15's object list, section 5 point 6).

**F13 (major). The stick override, the remote-admin override and the lapsed-override refusal have no path in a validator-clean scenario.** Nothing is unsafe: every such request is refused, and section 5 holds. But a signed-off behaviour is not deliverable in play, three units of code (07's remove check, 10, 11) run only under tests on an altered scenario, the scripted playtest cannot do beats 3, 5 and 8, and unit 17 would document a power no author can use. This needs the owner's ruling, not a reviewer's fix.

Three ways out, smallest first:

1. **Reword the plan's beats and the docs (no code).** Say that under S5a the override is reachable only for a session-shaped device at the keyboard; drop or mark as "Rails test only" beats 3, 5 and 8; correct P454-459 and P466-471 in unit 17's plan-corrections list. Risk: none to safety or to existing scenarios. Cost: the remote-admin override and the gated-remove machinery ship unreachable, and "a foothold with admin disarms the USB lesson" is simply not true of the game.
2. **Let a governed port name the PC that judges it (a new optional field, for example `usbPc: "<pcId>"`, on an object that is not a sign-in PC).** `plant_admin_pc` gains a third source after the `needsSession` grant (that field, judged by `session_admin?`); `plantAdmin` in the client gains the same line; the schema gains the field; `check_privilege` errors when it names something that is not a sign-in PC or sits on a sign-in PC; `usb_policy_for` is left alone (the port keeps its own `policy`). This is exactly the plan's "governed port" made real, and it makes beats 3, 5 and 8 playable as "plant at the port beside the PC". Risk: moderate and contained. It is a new access widening (a fourth entry for section 2b: an admin session at P overrides the policy of every object that names P), it touches server, client, schema and validator together so the two walks can drift, and it needs its own tests and a line in section 5. No shipped scenario has the field, so no existing answer changes and the golden fixtures stand.
3. **Relax the validator rule so a sign-in PC may carry `requiresItem` and `triggerOnInteract`.** Risk: high, not recommended. The rule guards the client's dispatch: a sign-in PC's interaction is the sign-in flow (`interactions.js:998`), so the client would need a new rule for "holding the item means plant, otherwise sign in", on the most used object in every access scenario; `requiresItem` would also gate the PC behind the item unless that branch is reordered; and every shipped sign-in PC goes through the changed code.

Recommendation: option 1 now, so S5a can close with honest docs and a PLAYTEST that lists only reachable beats; option 2 as a small unit of its own (before S5b, or with it) if the owner wants the stick lesson; never option 3. Whichever is chosen, unit 15's PLAYTEST and unit 17's docs must say which.

## Count and verdict

- Blockers: 0
- Majors: 1 (F13: the stick override has no play path in a validator-clean scenario; a plan and validator contradiction for the owner to rule on, not a safety flaw)
- Minors: 12 (F1 note; F2 session order in `admin_profile_reader`; F3 note; F4 note; F5 probe through `remove`; F6 validator; F7 golden holes; F8 section 4 omission; F9, F10, F11, F12 tests)

Checks not completed: none. Not in scope and not read: units 08 to 17 (except unit 15's handover finding, check 10), and unit 15's forged-sync test.

**Verdict: pass for R1 on safety and on code against the brief; one major (F13) open for the owner.** The server does what the plan and the brief say; no path was found that answers admin where the plan gives user or nil, opens a profile, records a plant or keeps a grant that was not earned, puts a secret in an answer or a row, or saves without bound. Fix F5 (one line and a test), F2 (one line) and F6 (one list entry and a fixture) in code; F9 to F12 are test additions; F7, F8 and F13 are for the orchestrator and owner to rule on.

## Outcomes (fix round)

| Finding | Outcome | Commit |
|---|---|---|
| F1 | Comment added at `keyboard_admin?` (nil safety). | b3b352b3f |
| F2 | `admin_profile_reader` walks `sessions_oldest_first`; test with two admin PCs (jake_pc then it_pc, one row, `where` jake_pc). | b3b352b3f |
| F3 | `record_admin_profile_read` moved into the scoped branch of `#container`. | b3b352b3f |
| F4 | Declined: record only; unit 13's warning (a) is the answer, for unit 17's docs. | none |
| F5 | `plant_policy_refusal` returns nil when the object's room is not unlocked; test in `privilege_inventory_remove_test.rb`. | b3b352b3f |
| F6 | `accountProfiles` keys in `log_stored_id_names`; node test (41 characters, odd characters, a clean id); controller guard kept. | b3b352b3f |
| F7 | Declined: both cases need before-captures from pre-S5a code (throwaway worktree at `0a66faed5`), not a cheap addition to the case builder. No golden fixture changed; none for `test_ops_access`. | none |
| F8 | Section 4 of the brief gains item 5 (technique admin session with route down or PC off sends no `access`; P849, M21), accepted by ruling. | this commit |
| F9 | Added: expired token and PC off for `session_admits?` and the reader; admin at another PC opens no folder or add; admin and user refusal bodies compared. Declined: a user session at another PC while admin is held at the owner's PC (the fixture has only two accounts, the owner and the admin, so no third user exists). | b3b352b3f |
| F10 | Added: a `from` case and a locked or expired remote session keeping `not_ready`; PC off refuses implant and plant under admin. | b3b352b3f |
| F11 | The test now has a reader and asserts 200, no save and no row; a second test reads through the shipped scenario's `audit_log_pc`. | b3b352b3f, dc2860603 |
| F12 | Outage case added on a remote admin session (`office_lan` `offWhen`); the old case renamed to "PC switched off". | b3b352b3f |
| F13 | Option 1: `PLAYTEST.md` and the brief say plainly there is no path; open question numbered O3 (O2 was taken by M29). No engine or validator change. | dc2860603 (PLAYTEST), this commit (brief) |
| Coordinator 1 | Card key renamed `field_release_notes`; scanner real-run test uses the shipped scenario. | dc2860603 |
| Coordinator 2 | `audit_log_pc` reader in the lobby, PLAYTEST beat 2b, graph files regenerated, scanner test reads `/log_rows` through it. | dc2860603 |
| Coordinator 3 | `session_grant_pc` skips a blank or non-string `pc`; case in `privilege_lib_test.rb`. | b3b352b3f |
