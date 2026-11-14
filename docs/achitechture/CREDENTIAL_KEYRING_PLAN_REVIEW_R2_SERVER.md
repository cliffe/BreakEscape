# Credential keyring plan: review round 2 (server and security)

Counts: B 0, M 2, m 4, n 3

Reviewed the plan (CREDENTIAL_KEYRING_PLAN.md) against the worktree code at
`60159ca52` (branch `plan/keyring`). Scope: forged proofs, registry leaks, route
forgery, missed session readers, the credentialEndGlobals cache, sync-merge
visibility, check order, reload/prune, concurrency, slice boundaries, validator.

Overall the server model holds up. `ItemIdentity.same_item?` exists and does what
the plan leans on (type plus shared identity, with a name fallback). The held/foothold
proofs read server-written state only, canonical_inventory_item stores the server's own
copy for every take route (grant, NPC itemsHeld, container, profile, start), so the
`credential` field on a stored item always comes from the server. `capture_proof_holds?`
already serves session/planted/dropped (capture_proofs.rb:58-72). player_state is not
sent to the client wholesale (the bootstrap attaches only named keys, games_controller.rb:308-371),
so credentialEndGlobals / endedCredentials stay server-only and do not grow a re-sent
payload. The sync merge sees globalVariables, sessions, credentialEndGlobals and
endedCredentials because SYNC_STATE_COLUMNS loads player_state whole
(games_controller.rb:2022, 819). GET /capture_secrets is untouched.

Two things the plan asserts are not upheld by the code it points at.

---

## M1 - A relay session DOES extend network reach, contradicting the plan's invariant

Plan sections 3.7, 3.8, 14, 7.6: "A relay session does not extend reach: the reach walk
counts any session only for networks a held foothold already reaches." The whole cheat
analysis for `assist_invite` rests on this.

Evidence: `reach_session_hosts` (network_access.rb:1115-1125) returns EVERY session that is
a Hash at a sign-in host, with no `via`/`relay` filter. `reach_walk_uncached`
(network_access.rb:1091-1107) then pivots from any such host whose network is already in
`reached`. A relay session is written to `player_state['sessions']` like any other
(plan 3.8), so it is counted as a pivot host.

Failure scenario: in `test_access_keyring` Jake's PC (HB-FIN-03) sits on office_lan, and
server_lan is "linked from office_lan" (plan 9.1). A player with a foothold reaching
office_lan and any office_lan session opens a relay session at Jake's PC using only the
assist code (no network foothold onto Jake's host). office_lan is already reached, so
reach_session_hosts now treats Jake's PC as a live pivot and the walk crosses office_lan's
links, pulling server_lan (and SV-OPS-01) into reach. The player reaches a network the
design gates behind a real session, through a credential the plan says cannot pivot. This
is "access honest play could never reach" if any scenario gates a deeper network behind a
non-relay session.

Fix: exclude relay (and, in K4, verify `from`) sessions from the reach walk. In
`reach_session_hosts` skip a session whose record carries `relay` (i.e. `session['relay']`
or `via == 'credential'` with a relay route), the same way the plan already keeps a relay
session out of `host_row`. Add a model test (relay at a pivot host does not cross its links)
to credential_sessions_test, and state the exclusion in plan 3.7/3.8. If relay-as-pivot is
actually wanted, drop the "does not extend reach" claim and redo the 7.6 cheat table.

---

## M2 - `credential` is a client-writable item field; the held-proof defence rests only on item type

Plan 3.4/3.5/6.7 security argument: "an always-allowed notepad posted with the .rdp's id
does not prove `held`, because its type differs from the definition's." That is the only
barrier, and the plan simultaneously tells authors to reuse an existing item type and icon
(3.4, 14: "Credential items keep an existing type and icon").

Evidence: `credential` is a new item field and is NOT in
`ItemIdentity::FORGEABLE_ITEM_FIELDS` (item_identity.rb:28-32), so it is not in
`CLIENT_ITEM_FORBIDDEN_FIELDS` either (games_controller.rb:2533-2537). For an always-allowed
type the add keeps the client's fields except the forbidden ones
(canonical_inventory_item, games_controller.rb:2544-2548; ALWAYS_ALLOWED_ITEMS = %w[notepad],
games_controller.rb:2507, 2591). A client-built notepad can therefore carry
`credential: "jake_assist"`.

Failure scenario: today only item `type` saves this - `notes`/`text_file` are not
always-allowed, so a forged notepad fails `same_item?` on type. But the plan invites type
reuse, and `notepad` is itself an always-allowed type with an icon an author might reuse for
a written code. The moment a credential is authored on an always-allowed type (or a new
always-allowed type is added), a client posts that type with the matching name/id and
`credential`, `same_item?` passes on type+name (item_identity.rb:63-73 falls through to the
name match even when ids differ), `client_forged?` is false (an /inventory add is never
marked clientAdded), and the held proof is forged - a saved-connection or invite sign-in
with no password.

Fix: add `credential` to `ItemIdentity::FORGEABLE_ITEM_FIELDS` so no client-built item can
ever carry it (defence in depth, closes it regardless of authoring), and add a validator
ERROR in check_credentials when a registry `held` item's definition type is in
ALWAYS_ALLOWED_ITEMS. Also specify in plan 3.5 that the held check reads the INVENTORY
item's own `credential` (not the definition's) and matches on identity, not the name
fallback.

---

## m1 - `session_for_client` / `sessions_for_client` is a missed session reader for credential sessions

Plan 3.8 lists the readers K2 changes (session_route_up?, prune, host_row, reload) and says
"login_session_answer adds kind, label and the route", but does not touch
`session_for_client` (game.rb:2392-2398), which calls
`login_session_answer(npc, session['via'], pc_id:, foothold: session['foothold'])`.
A relay or `from` credential session has no `foothold` key, so login_session_answer returns
the LOCAL answer shape (game.rb:2904: `return answer unless foothold.present?`) with no
remote/host/route fields, even though the session is remote. In phase 1 this is masked
(saved_connection sessions carry `foothold` and pass through; relay sessions are ended on
reload), but a K4 `from` session survives reload and is reported to the client as a local
session. Fix: route session_for_client through the credential-aware login_session_answer,
passing the session's route field, and add it to the plan 3.8 reader list.

## m2 - credentialEndGlobals is populated only at bootstrap, never on the sync path

Plan 7.1: the cache is written "At bootstrap (where scenario_data is loaded)", and the sync
merge reads "only that cached map ... No scenario load on sync." sync_state loads
SYNC_STATE_COLUMNS without scenario_data (games_controller.rb:819, 2022), so if a client
reaches PUT /sync_state before the GET /scenario bootstrap ever ran for this game,
credentialEndGlobals is absent and the invite-ending step silently no-ops; an invite the NPC
ended would stay usable until the next bootstrap. Low risk (bootstrap runs first on every
page load), but the plan should either populate the cache in prepare_bootstrap_state!
(games_controller.rb:288, which the sync path does not call) and assert bootstrap precedes
sync, or note the dependency explicitly.

## m3 - host_row will show a relay credential session that a network-view click cannot open

Plan 3.8: host_row moves to "offer any session that is not a claim". host_row
(network_access.rb:911-936) gates the offered session on `remote = !remote_blocked?(pc)`.
A relay session on a non-remote-blocked PC would then appear as a remote row, but opening it
from the view sends the reaching foothold to desktop_request_allowed?
(network_access.rb:1183-1193), and a relay session has no foothold reaching the host, so the
open is refused. The plan intends relay re-entry via Connect only (8.2). Fix: keep relay
sessions out of host_row (filter on the route field), matching the Connect-only re-entry
path.

## m4 - desktop_request_allowed? needs a dedicated relay/from branch; the current blank-foothold path is the physical-keyboard rule

Plan 7.2 says desktop_request_allowed? "accepts relay=1 (and in K4 from=) when the session
at that PC carries that route and session_route_up? holds". Note for the implementer: a
relay request carries no foothold, so with the branch unwritten it falls into the else at
network_access.rb:1189-1192 (`login_pc_reachable?` - physical room reach), which is the
wrong test for a remote relay. The new branch must key on the request's route param AND
verify `session['relay']` (or `session['from']`) on the server's own record plus
session_route_up?, never trust the param alone. The plan wording is adequate; flag it so K2
does not regress into the keyboard branch.

## n1 - same_item? name fallback is laxer than the plan's "type and identity both"

item_identity.rb:63-73: when both items have ids that do not intersect, same_item? still
returns true on a shared name - unlike held_in?/addressed_by?, which short-circuit on
identity. Not exploitable here because the credential field (server-sourced) gates the held
proof, but the plan's phrase "(type and identity both)" (3.5) overstates what same_item?
guarantees. Specify identity-strict matching for the held check.

## n2 - "ink give_item" in the validator check means a declared grant, not raw ink

Plan 6.3 lists "ink give_item" among the grant sources a held item may have. The server only
honours DeclaredGrants (validate_item_collectible, games_controller.rb:2619-2624; validator
requires declared_grants, validate_scenario.rb:33, 836). A raw, undeclared ink give_item is
not grantable server-side, so check_credentials should look at declared grants only; wording
"ink give_item" could mislead the implementer into parsing compiled ink.

## n3 - the foundIn "text contains the password" warning is computable but fragile

Plan 6.3 warns when a `foundIn` item's text does not contain the account's password. The
password lives in creds and the item text in the scenario, so it is statically checkable, but
it is a substring heuristic (the password is "never quoted" elsewhere, 3.3) and will
false-warn on formatted or templated note text. Keep it a warning (as planned), not an error.
