Counts: B 1, M 2, m 9, n 4

# Credential keyring plan: review round 11 (the parts added with the decisions)

## What I checked

The plan at 479099725 (`plan/keyring`), new parts only: slice K5 (section 10, with 3.3, 3.6, 3.7 and the 8.5 token lines), slice K3d and the four D8 options (8.7), the phase 2 sketch (11), section 12's `machineAccounts`, the invite timer (1.1 and 9.1), the slice order (section 1) and section 14. Each claim was checked against the code in the same worktree: `network_access.rb` (session readers, reach walk, prune, desktop judge, `host_row`), `game.rb` (`ACCESS_STATE_DEFAULTS`, `session_identity`, `session_admits?`, `SERVER_OWNED_GLOBAL_NAMES`), `games_controller.rb` (bootstrap, `render_login_desktop`), `npc_frustration.rb` (`server_now`), `capture_proofs.rb` (`record_capture!`), the capture log and page builder modules, `npc-lazy-loader.js`, `container-minigame.js`, and the scenario files of both labs, `test_capture_log` and `test_access_networks`. No game was run: each repro below is a trace through the code along the plan's own beats. No SecGen file or field guide was opened.

## Blocker

### B1. An expired token's session keeps its desktop, its pivot and its row in the network view

Evidence:
- K5 (section 10, Expiry) puts the whole expiry in `session_route_up?` and says "`prune_unreachable_sessions!` ends it when it next runs".
- `prune_unreachable_sessions!` (`network_access.rb:1150-1166`) never calls `session_route_up?`: it ends a footholded session only when its network leaves every held foothold's `structural_reach`. A token session sits on a network the drop box still reaches, so prune never ends it.
- `desktop_request_allowed?` (`network_access.rb:1183-1193`), foothold branch: reach, `remote_blocked?`, power and "not a claim". No `session_route_up?`. K2's change (3.8) adds only a relay or `from` refusal to that branch. `render_login_desktop` (`games_controller.rb:2447-2469`) then serves `login_desktop_contents(pc, npc)` in full.
- `reach_session_hosts` (`network_access.rb:1115-1125`) counts every held session as a pivot, and `reach_walk_uncached` (`:1081-1108`) never asks whether a pivot's route is up. So an expired token session at `lena_pc` still carries the drop box onward to `server_lan`.
- `host_row` (`network_access.rb:911`), widened in 3.8 to "any session that is neither a claim nor a relay", lists the expired session as held, so the view offers Open on it.
- `reach_cache_key` (`network_access.rb:1061-1073`) is built from session ids and power. Expiry changes with the clock, not with any of those, so a fix in the walk needs its own key term.

Repro (trace, Run E of 9.1): plant the drop box, sign in to HB-FIN-02 with `lena_token`, wait past `expiresMin`. The client timer closes the desktop (K5, Client). The server still holds `sessions.lena_pc`. In the network view HB-FIN-02 shows Lena's held session; Open sends GET /container with `foothold=jack_comms_port`, which passes `desktop_request_allowed?` and returns her desktop, readable files and all. From the drop box view, `server_lan` is still listed and SV-OPS-01 accepts Ian's typed password through the dead pivot. GET /keyring answers `sessionHeld: true` beside `expired: true`.

Problem: the brief's guarantee, "tokens expire server-side whatever the client clock says", holds only for the scoped requests that already go through `session_route_up?` (`game.rb:1972, 1979, 1996`; `network_access.rb:1251`). Honest play reaches the gap without tampering, through the view's Open. The K5 tests list only "a scoped request through an expired session answers 403", so the gap would ship green.

Suggested fix: one predicate, `credential_session_expired?(session)` (a token session whose `credentialClock` entry plus `expiresMin` is past `server_now`), read by:
1. `session_route_up?` (as planned);
2. every branch of `desktop_request_allowed?` and `desktop_refusal`, with a new refusal reason `expired` that the client maps to 8.5's "{label} has expired.";
3. `reach_session_hosts` (skip, like a relay or a locked session), with a `reach_cache_key` term listing expired session ids;
4. `host_row` and `sessions_for_client` (left out, so neither the view nor a reload offers it);
5. GET /keyring's `sessionHeld` (false once expired).
Then end the session for real on the next write: `prune_unreachable_sessions!` also drops expired token sessions (both the access and structural callers) and the ids go out as `endedPcIds` with reason `token_expired`, while GET requests stay side-effect free. Add tests for each reader: GET /container with `foothold=` after expiry answers 403 `expired`; the drop box's reach loses `server_lan`; `host_row` drops the session; the bootstrap `sessions` leaves it out; `sessionHeld` is false.

## Major

### M1. The test scenario's own policy refuses the token, so R12 cannot pass as written

Evidence: 3.2 gives `finance` an explicit `accepts: ["password", "saved_connection", "assist_invite"]`. 9.1 puts `finance_desk` ("`finance` without `maxAttempts`") on Lena's PC. `lena_token` has `connectsTo: lena_pc`. A token reaches a PC's default `accepts` only when the policy sets none (3.2, 10 Catalogue), and `finance_desk` sets one.

Repro (trace): Run E, R12. K2 step 5 answers 422 `{ kindRefused: "token" }`. K3a shows a refused credential as a greyed button with a reason, but 8.5 has refused lines for `saved_connection` and `assist_invite` only, so a refused token has no text. R2's "Saved" and "Token" two-tag case still draws, but with the token greyed. K1's validator warning ("a credential no machine accepts") fires on `lena_token`, which 9.1's expected-warnings list does not name.

Problem: K5's only live beat fails on the scenario's own data, and a token refused by policy has no text.

Suggested fix: in K5, add `token` to `finance` and `finance_desk` (or give `finance_desk` no `accepts`, so it takes the defaults). Add a token refused line to 8.5 (for example "{host} does not accept session tokens.", plus a short form for under a greyed button), and a validator fixture for a token at a PC whose explicit `accepts` leaves it out.

### M2. Option A heads the labs' captures view "Sign-ins", but most of its rows are physical findings, and a keypad PIN is labelled a password

Evidence:
- `lab_physical_pentest/scenario.json.erb` has 19 `addCapture` entries; 15 have `kind: "foothold"` and are physical findings: `propped_post_room` (a wedged door), `clean_desk`, `reception_pretext`, `scope_respected`, `scope_breached`, `archive_safe`, `comms_card_cloned`, among others (lines 752 to 897). Its credential capture `len` (line 945) is the records door keypad PIN, `"secret": "4471"`.
- 8.7 calls a foothold row "an opened document or executable" and tags every capture "Captured" ("Captured password") or "Foothold", with the source tag "Recorded" for everything that is not a phish.
- The page builder's captures view is headed "Captures" (`landing-page-builder-minigame.js:445`), with the banner "Passwords and PINs this engagement has recorded..." (`capture-rows.js:24`), and that lab's PLAYTEST sends the player to it by name (`lab_physical_pentest/PLAYTEST.md:488, 525, 548, 638, 642`).
- Section 4 says "From K1 on, every new screen element appears only in a scenario that declares `credentials`"; neither lab declares any. 9.2 records option A's lab change, but section 4 is not amended.

Repro (trace): option A, a new `lab_physical_pentest` game. Prop the post room door, read Len's PIN from the ledger shelves and open the tablet. The heading reads "Sign-ins". The post room row carries the tag "Foothold" and the source "Recorded", though nobody signed in and nothing was recorded. Len's row is tagged "Captured" and titled "Captured password", but it holds a door PIN.

Problem: under the recommended option, two shipped labs get a heading and tags that are wrong for most of their rows, and the plan breaks its own section 4 invariant without saying so. The cost line "no content change" is true, but the labs' teaching wording changes anyway.

Suggested fix: under option A, keep the heading "Captures" in the captures view (or let the heading follow the content: "Sign-ins" only when every row is a credential or a registry entry). Tag a non-sign-in foothold capture by what it is ("Finding"), or give it no kind tag. Take the kind tag from the secret type, so a PIN reads "PIN" and not "Captured password". Amend section 4 to name option A's lab change, and add a fit fixture for the page builder view, since `signin-fit.mjs` checks only the capture log. If that is too much for phase 1, the cheaper honest choice is D (keep the sources apart) until phase 2 gives the labs real registry rows.

## Minor

### m1. The token clock starts at first use, which is not how a real token behaves, and the teaching line promises controls the game does not model

Evidence: K5 Expiry: "since then [first accepted sign-in] ... game open or not, as a real token would." 8.5 token teach: "Short session lifetimes and signing out limit it." Lena stands at reception the whole test (9.1 Rooms), and nothing in K5 ends a token when its holder signs out. The label "HB-FIN-02 session cookie" names a web artefact for a desktop sign-in.

Problem: a real token's lifetime runs from when it was issued, not from the attacker's first replay. Here an unused token never expires, so a player can hold it indefinitely, which undercuts the lesson. "Signing out limits it" is never shown. The drop box records a session for an account whose holder is not at her PC. Calling a desktop sign-in a "session cookie" is inaccurate for a Cyber Security teaching game.

Suggested fix: drop "as a real token would", or start the clock when the proof first holds (the server writes `gainedFootholds` itself, so it can stamp `credentialClock` at the same moment). Cut "and signing out" from the teaching line unless a holder's sign-out ends the token. Relabel the token (for example "Lena's sign-in ticket"), or point the test token at a web sign-in host such as HB-DOOR-01, where a session cookie is the right word. Add a line of fiction for when Lena signed in.

### m2. An unused token, an expired token on a sign-in screen and a reload each leave the client with no text or data

Evidence: K5 GET /keyring: `expiresInS` only "once first used". 8.7 token use line: "About {n} min left." 8.1 defines a greyed button only for a policy refusal. K5 Client says the bar and the close timer run from `expiresInS`, but `session_for_client` and `login_session_answer` (3.8) are not said to carry it after a reload.

Problem: before first use the Sign-ins row has no `{n}`. Once expired, a sign-in screen through the proof foothold still gets the entry (with `expired: true`), and no rule says whether the button is hidden, greyed or live, though R12 expects "Connect again: ... has expired." After a reload the desktop bar and the close timer have no number until some later GET /keyring.

Suggested fix: an unused row reads "Lasts {expiresMin} min once used."; an expired token shows a greyed button with the short line "{label} has expired." (its click posts nothing); `session_for_client` adds `expiresInS` for a token session, so the bar and timer resume after a reload.

### m3. `expiresInS` makes the GET /keyring digest change on every request while a token is in use

Evidence: 6.2 `rev` is "a short digest of the answer"; K5 adds `expiresInS`, a whole-second countdown. Every K3a, K3b and K3d site says the answer is "usually `unchanged`".

Problem: while a token runs, every screen open, find-toast trigger and Sign-ins open returns the full answer. The repeat stops costing "a few bytes", and every answer counts as a change for the find-toast diff (8.2).

Suggested fix: leave `expiresInS` out of the digest (send it beside `unchanged`), or round it to whole minutes for the digest.

### m4. Neither K3d nor K5 owns the token row, and K5 lists no files

Evidence: section 1: "K3d, K4 and K5 in any order". 8.7 lists the token row "(K5)" among K3d's rows; K5's Client bullet says "the Sign-ins list (K3d) says where to use it". Section 10 has no Files line, and its tests name only `keyring-signin.test.mjs` and `keyring-client.test.mjs`.

Problem: if K3d lands first, nothing in K5 says that it extends `signin-rows.js` and its tests. If K5 lands first, a token has only its toast to say where it is used. The token desktop bar line is in no `signin-fit.mjs` fixture.

Suggested fix: give K5 a Files line (`signin-rows.js` and its test when K3d is on main, `container-minigame.js` for the bar, `signin-fit.mjs` with the token bar at 390x844 and 915x412). Or fix the order as K3d before K5.

### m5. The Sign-ins merge has no stated join key and can still duplicate an account

Evidence: 8.7: "the capture row takes the entry's account fields", and a captured plus in-file password share the row `capture:<targetId>`. The server joins a capture to an account by the capture's `address` against the normalised username (`network_access.rb:1395-1406`). `se_captures` is keyed by target id, so two routes that capture one account (a phish and a keylogger) give two entries.

Problem: the client needs the same normalised-address join, or the rows will not merge. Two captures of one account give two capture rows, against "one row per credential". When the in-file entry is found before the capture, its row key changes from `cred:<id>` to `capture:<targetId>`, so the row moves, is marked New again, and leaves an orphan `__capture_log_seen:` global.

Suggested fix: name the join (`normalise_username(capture.address) == entry.account.username`, mirrored on the client), say which capture wins when two match (the oldest, by `at`), and key an account's merged row by account (`account:<npcId>`) so the key does not change as sources arrive.

### m6. The merged row carries four tags; the fit fixture tests three

Evidence: 8.7, a captured and found password: kind tags "Captured" and "In file", plus both source tags ("Recorded" or "Phished", and "Found"). The `signin-fit.mjs` line for K3d tests "a row with three tags".

Suggested fix: test the four-tag row at 390x844, or apply K0's "+N" rule to the source tags in the list.

### m7. The timer arms through a mapping on Jake, but NPCs register only when their room loads

Evidence: 9.1: "a mapping on Jake for `global_variable_changed:jake_contract_read` ... sets `jake_assist_armed`". `NPCLazyLoader.loadNPCsForRoom` (`npc-lazy-loader.js:35-40`) registers a room's NPCs, and their `eventMappings` (`npc-manager.js:378`), only when that room loads. The relay is opened by Connect from the tray, from anywhere.

Repro (trace): get the code in Finance, walk to the lobby, reload, Connect from the tray, read `vendor_contract.txt`. Finance has not loaded since the reload, so Jake's mapping is not registered, `jake_assist_armed` is never set and the timer never starts. The bark mapping, also on Jake, is lost the same way.

Problem: 1.1's "the invite can also end on a timer" does not hold on that path. The invite still ends through the ink, and 7.1 accepts a long-lived invite, so this is minor.

Suggested fix: start the timer on `jake_contract_read` directly (`startOnGlobal: jake_contract_read`, the same condition) and drop `jake_assist_armed`. Timers are top-level and do not wait on an NPC. Move the bark to a top-level mapping too, or note that it plays only once Jake has loaded.

### m8. Phase 2's `capture:` proof would be best-effort, and expiry would put a clock on the labs' exploration

Evidence: 11 proposes a proof `capture: <targetId>` that "holds when the server's capture record has a proven foothold entry". `record_capture!` (`capture_proofs.rb:138-168`) takes a foothold capture from the client, checks only that the target id is declared and has a candidate, and marks a foothold "proven at once". `lab_physical_pentest`'s session is granted on `kp_usb_foothold`, a client `setGlobal` (line 1538). K5 makes `expiresMin` required, 1 to 240.

Problem: K5's cheat line ("the proof is a foothold the server holds") would not carry into phase 2, since a tampered client can post the capture at once. A required expiry also turns the labs' "explore it, record what the account reaches" (lab_physical line 596) into a timed task, which strands a slow student.

Suggested fix: record both points in the sketch. Class the lab tokens as best-effort under the cheat policy (or require evidence before the capture counts as proven). Let phase 2 allow a token with no `expiresMin`, or one long enough not to strand the lab, with the lab's teaching line in place of a real timeout.

### m9. Section 12's reader audit leaves out readers that resolve a session id to an NPC

Evidence: section 12 names `session_identity`, `session_for_client`, `host_row`, `login_session_answer`, `account_npcs`, `resource_admits_player?` and the profile checks. Also resolving `session['id']` through `scenario_room_npc`: `via_for`'s caller at `network_access.rb:836` (the view's bridge label), `login_desktop_contents(pc, npc)` (`games_controller.rb:2468`) and `sessions_for_client` (`game.rb:2390`). The registry's `account` field is validated as "an account holder" (6.3), which a machine account is not. The client mirror and the account bar take display names and headshots from NPC records.

Suggested fix: list these in the audit, add 6.3's `account` check and the client's account bar and headshot, and say what a machine account shows where an NPC has a headshot.

## Nits

### n1. K3d's cheat note calls `se_captures` client-written

8.7: "A forged `se_captures` entry (the global is written by the client)". It is a server-owned global (`game.rb`, `SERVER_OWNED_GLOBAL_NAMES`): PUT /sync_state intercepts it and records it through `record_capture!`, which refuses undeclared targets. The conclusion holds, but the premise should say the server validates the entry and the client copy is display only.

### n2. R1's toast text is stale once K3d lands

From K3d, `test_access_keyring` holds a capture log, so R1's toast becomes "New in your capture log: HB-FIN-02.rdp (saved connection for Lena Fox).". The R1 row still says "Saved connection found". Name both, by slice.

### n3. R13 checks something Run A has already passed

R13 expects "no row for `ops_rdp` until SV-OPS-01.rdp is taken", but Run A took it in R5a, before R13. Check it at R3 instead (open the capture log before R5a), or drop the clause.

### n4. Small K5 gaps

`credentialClock` is not said to go in `ACCESS_STATE_DEFAULTS`, as 7.1 says for its keys. The bar's "about {n} min left" needs a rounding rule, so it never shows "about 0 min left" (say "under a minute left"). The validator info line "a token that is the only route to something the mission needs" cannot be computed: word it like the lockout line, keyed on a fact the validator can see (any token), and leave "only route" to the README.
