# S5a client, validator and graph: review R1

Reviewer: read-only. Commits reviewed: "Ops S5a" 08 to 14 in 3034e2301..cc0f968d7.

## Findings

Line numbers are those at `cc0f968d7`. "Brief" is `S5A_BUILD_BRIEF.md`; "P" is the privilege plan.

### Check 1: the mirror (`pc-sessions.js`)

Case by case against `Game#session_access` / `keyboard_admin?` / `plant_admin?` (`game.rb:3300-3338`, `capture_proofs.rb:186-202`): keyboard admin, foothold, `from`, relay, technique, locked and token entries all give the same answer on the client as on the server, given the entry the server sent. `access` is dropped at the lock writer (`:970`), left out of a locked entry by `publicSession` (`:199`) and by the bootstrap adopt (`:388`), and `noteDesktopRefused` (`:487`) acts on `'off'` and `'not_responding'` only. Sign-out (`:914`), switch user (`_replace`, `:893`), a session ended by another sign-in (`_dropEnded` to `linkDropped`), a displaced session (`:860`), a token timer (`:428`) and a reload (`load` clears, `:363`) all delete or replace the whole entry, so none keeps admin. No path was found where the client SHOWS the marker after the server would say no: the marker is drawn only when a desktop opens, which needs a 200 from the server.

**C1-1 (major). The desktop answer's `access` never reaches the mirror, so a level the client dropped (or never had) does not come back.**
- Where: `public/break_escape/js/systems/pc-sessions.js:1074-1084` (`settle`), called from `container-minigame.js:1146` with `data.session`, which is `session_for_client(pc)` (`games_controller.rb:3366`) and so carries `access: "admin"` when the server says admin.
- Breaks: brief unit 09, "Every fresh server answer already replaces the entry, so an answer without `access` clears it: keep that so" (line 236); P681-683 "every fresh server answer replaces the entry"; P726 "The next room answer corrects the mirror" (no room answer feeds the mirror at all: `pcSessions.load` is called once, `core/game.js:1796`).
- What is wrong: `settle` copies only the remote fields. The only writers of `access` are a sign-in answer, a technique answer and the bootstrap. So:
  1. Admin signs in at a PC, the PC is switched off, the player clicks it (403 `off`, `noteDesktopRefused` deletes `access`), the PC is switched back on. The desktop opens (200, `session.access: "admin"`), but the mirror has no `access`: no Administrator marker, and `plantAdmin` is false, so `plantRefusal` refuses a blocked stick locally with "USB devices are disabled on this PC." although the server would take it. It stays so until a reload or a fresh sign-in. The same after a `not_responding` on a foothold or `from` desktop.
  2. A page reload while the PC is off or the route is down: the bootstrap entry has no `access` (the server sends none then), and nothing restores it when the PC or route comes back in the same page session.
  3. The other direction (the answer has no `access`, the mirror still has it) is also not cleared by a desktop answer; I found no live case, since a 200 desktop means the level has not changed, but the brief's sentence asks for it.
  This fails closed (the client refuses, the server is never asked), so it is not a safety hole; it is a feature that silently stops working in the brief's own "PC switched off" beat.
- Fix: in `settle`, after the relay guard, adopt the level from the answer: `if (session.access === 'admin' && s.locked !== true) s.access = 'admin'; else delete s.access;`. `mountTaskbar` reads the mirror after `settle` runs, so the marker follows. Add a test: `noteDesktopRefused(pc, 'off')` then `settle(pc, { access: 'admin' })` gives `sessionAdmin` true; `settle(pc, {})` on an admin entry gives false.

**C1-2 (minor). The relay test's title says the opposite of what its body asserts.**
- Where: `test/js/pc-sessions-admin.test.mjs:58-63`; code `pc-sessions.js:452-455`.
- Brief unit 09 tests: "`sessionAdmin` ... false for a relay entry". The test is titled "sessionAdmin is false for a relay entry" but sets a relay entry WITH `access: 'admin'` and asserts `sessionAdmin('rl') === true` (then `keyboardAdmin` false). The code has no relay term, which follows the plan (P703-704: "It covers remote, relay and technique entries alike, since only the server decides which carry `access`") and is right today because the server answers `'user'` for a relay (`game.rb:3308`) and so sends no `access`. So the code is the plan's; the brief's test line is not met as worded and the title misleads the next reader.
- Fix: retitle the test ("a relay entry is admin only if the server sent access; never keyboard admin") and add the case the brief meant: a relay entry as the server sends it (no `access`) is false. If the orchestrator prefers the brief's reading, add `s.relay !== true` to `sessionAdmin` (it matches the server's step 5) and flip the assertion.

**C1-3 (minor). After `noteDesktopRefused`, a repeat technique grant is no longer "the same copy".**
- Where: `pc-sessions.js:667` (`now.access === held.access`).
- Once `access` was deleted from a technique admin entry (403 `not_responding`), a repeat grant of the same technique compares `undefined` with `'admin'`, so `_replace` runs and `pc_signed_out` (reason `switch`) and `pc_signed_in` fire for what the comment at `:665` calls a repeat that "changes nothing". A scenario event mapping on `pc_signed_in` could fire again. It does restore `access`, which is good; C1-1's fix would make this case rare (the desktop answer restores it first).
- Fix: when only `access` differs, set `now.access` in place and return, without `_replace`.

### Check 2: the plant, the gated remove and the in-flight sets

`plantRefusal` overrides only on `admin === true` (`pc-policy.js:75`); `interactions.js:1113` passes `window.pcSessions?.plantAdmin?.(data) === true`, a strict boolean. Traced `sendGatedRemove` (`apply-actions.js:92-110`):
- success (200): resolves true; the caller removes the item, then runs the actions. Right.
- 422 `usb_refused`: the server's `error` is shown, `usb_refused:<objectId>` is emitted, resolves false; item stays, nothing fires. Right.
- 4xx with no `error`: generic line, resolves false. Right (see check 5).
- network failure: `sendInventoryRemove` retries once and answers false; generic line. A 5xx body never reaches the toast (`:60`, `resp.status < 500`). Right.
- The two sets are cleared in a `finally` (`:100-103`) before any toast, so a throw from `sendInventoryRemove`, from `resp.json()`, or later from `gameAlert` or an event listener cannot leave an entry behind. Confirmed.

**C2-1 (major). A `remove_item` for an object in flight is skipped, but the REST of its list still runs.**
- Where: `public/break_escape/js/systems/apply-actions.js:336-339` (the `plantsInFlight` guard `break`s out of the `switch` only; `stopped` is not set).
- Breaks: P527-529 "A further interact with that object, and a `remove_item` for it, does nothing (a console line only)"; P513-514 "On anything other than success the item stays in the tray and nothing after it runs"; the review aim "never fires an interaction trigger for an action the server refused".
- What is wrong: with `[remove_item, X]` on a governed object, a second pass while the first remove is awaiting its answer logs the console line and then runs `X` (a `set_global`, a `grant_foothold`, a `give_item`) at once, with nothing removed and no server answer. Proved with the unit's own harness (scratch file `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5a-client-review/repro.test.mjs`): two `applyActions([remove_item, set_global after], { objectId: 'sock', objectData: sock })` calls with the first POST held, then answered 422 `usb_refused`: one POST, `after === true` BEFORE the answer, item still held after it. If the first answer is a success, `X` runs twice.
- Reach in the game: `interactions.js` stops a second interact only inside the `requiresItem` branch (`:1097-1100`). An object with `triggerOnInteract` and no `requiresItem` goes to `:1172` with no in-flight check, so a second click (top-level list), or a second click and a second confirm (`confirm_action`), while the first request is out (a slow link, or the built-in retry after a network error) reaches the guard. The window is one request long, so it takes a slow answer or a fast double click, but the outcome is exactly the one the gate exists to prevent, and the server cannot undo a client `set_global`.
- Fix: in the guard, set `stopped = true` before the `break`, so the whole remaining list is dropped, as on a refusal. Also give the plain branch at `interactions.js:1172` the same `plantsInFlight` check the `requiresItem` branch has, so a confirm is not even offered. Test: the repro above, asserting `after` is not set and one POST.
- Note, not a new fault: when the ITEM is in flight for another object, the second object's `remove_item` takes "not held, no-op" and its later actions run. That is today's rule for an item not held (`apply-actions.js:347-350` before S5a), so the plan's "one server plant never runs two objects' actions" (P531) is only true for `requiresItem` objects. Worth one line in the docs (unit 17) or a validator note; no code change asked.

**C2-2 (minor). The item can leave the tray by another route while its gated remove is out.**
- Where: `apply-actions.js:95-96` (`itemsInFlight` is read only by `heldMatches` `:116` and `interactions.js:1106`).
- Plan P527-531 names only the `requiresItem` match and the `remove_item` pick, and that is what was built. Other spenders of a held item (drop, hand to an NPC, the hide action, another minigame's use) do not look at `itemsInFlight`. In the window of one request the player could drop the stick; on success `removeFromInventory(held)` then acts on an item no longer in the tray while the server has removed it, leaving a dropped copy the server does not hold. Narrow; listed so it is a known limit rather than a surprise.
- Fix: none required for S5a; state it under the plan's "Known limit", or have the inventory menu refuse an item id in `itemsInFlight`.

**C2-3 (minor). The callers of `sendGatedRemove` have no `catch`.**
- Where: `apply-actions.js:358-363`, `interactions.js:1161-1167`.
- `sendGatedRemove` can reject after its `finally` if `window.gameAlert` or a `usb_refused:*` listener throws (`:106-109`), and the `.then` body can throw from `applyActions(rest)`. Either is an unhandled rejection. The sets are already empty and the item state is right, so nothing is lost but a console error.
- Fix: wrap the toast and the emit in `try`/`catch` inside the helper, or add `.catch(err => console.warn(...))` at both callers.

**C2-4 (minor, observation for the docs). A governed object that neither consumes nor `remove_item`s its item has no server gate.**
- Where: `interactions.js:1141-1146` (`gatedPlant` needs `consumesItem`).
- With an admin mirror entry, `plantRefusal` lets the stick through and `triggerOnInteract` fires at once when the object keeps the item (no `consumesItem`, no `remove_item`): nothing is sent, so a lapsed override is never judged by the server. This was already so before S5a (the policy refusal for such an object was client-only), and the plan gates removes only (P485-490), so it is within the plan. No shipped scenario has such an object under an admin path.
- Fix: none in code; unit 17's author note should say the override is server-checked only where the item is consumed (`consumesItem` or a `remove_item`).

### Check 3: `window.pcPolicy` and `window.pcSessions` in place of static imports

- Load order in the real game: `interactions.js:22` statically imports `plantRefusal` from `./pc-policy.js`, so `pc-policy.js` is evaluated (and sets `window.pcPolicy`, `pc-policy.js:115`) before any line of `interactions.js` runs. `apply-actions.js` makes a gated remove only when it is handed `objectData`, and the only callers that pass it are the three in `interactions.js` (`:1146`, `:1167`, `:1172`); the timer dispatcher, wearables, the ESD and flag minigames, and `interactions.js:794/799/2233` pass none. `core/game.js:67` statically imports `pc-sessions.js` (as does `utils/pc-taskbar.js:28`), which sets `window.pcSessions` at module evaluation (`pc-sessions.js:1156`), long before the scene accepts a click. So both are always set before the first interaction.
- If `window.pcSessions` were absent: `admin` is false, the client refuses a blocked stick locally. Fails closed; nothing lost.
- If `window.pcPolicy` were absent where `apply-actions.js` reads it (`:343-345`, `:352`): no pick, `gatedRemove` is not true, so the remove takes the old path: the item leaves the tray at once and the send is fire-and-forget. Since unit 07 the server answers 422 to such a remove, so the player would be left without an item the server still holds until a reload. That is the bad direction, but it cannot happen in the game for the reason above; it can happen only in a harness that loads `apply-actions.js` alone. Same for `interactions.js:1143` if a harness stubs `apply-actions.js` without `sendGatedRemove` (the plant falls back to remove-then-send).
- The namespace import (`interactions.js:15`, `import * as applyActionsModule from './apply-actions.js'` beside the named import at `:12`) is sound: both resolve to the one module record, a namespace object answers `undefined` for a name the module does not export (a named import of a missing export would be a link-time SyntaxError), and the same pattern is already used at `:18-20` for `requires-item-hint.js`. No cycle is added (`apply-actions.js` does not import `interactions.js`).

**C3-1 (minor). "Nothing is gated when absent" is the unsafe default for `pcPolicy`, and nothing says so at run time.**
- Where: `apply-actions.js:343-352`; `interactions.js:1141-1143`.
- Brief unit 10/11 handover: "does nothing gated when they are absent". Safe today by load order only.
- Fix: one `console.warn` (once) when `objectData` is given and `window.pcPolicy?.gatedRemove` is not a function, so a future caller or a broken load is seen; or import `gatedRemove`/`plantRefusal` statically in `apply-actions.js` and pay the copy-list edits once. Not needed to land S5a.

### Check 4: `needs_console` in `network-links.js`

Read `network-links.js:496-502`: a 422 with `reason: 'needs_console'` toasts `b.error` or the fallback "Nobody is signed in at this keyboard." (the brief's line, word for word), emits `network_device_refused` `{ pcId, reason: 'needs_console' }` keyed by the PC id, and returns `{ action: 'refused', reason: 'needs_console' }`. It sits after the `usb_refused` branch and before the `not_ready` retry loop, so it cannot retry or end quietly. `usb_refused` and `not_ready` are byte-for-byte as before (the diff adds eight lines and removes none). The doc comment at `:31` lists the pc-id form. No finding.

### Check 5: the builder's own calls in unit 10

- "That did not go through. Try again." for a 4xx with no `error`: acceptable. The plan gives a line for `usb_refused`, for "another refusal ... when there is one" and for a network failure (P515-519), and is silent on a refusal with no `error`; showing nothing would leave a click with no feedback, and the route's other refusals carry `message`, which the plan forbids showing. The item stays and nothing runs, which is the behaviour the plan asks for. One wording caveat, minor, no change asked: for a refusal that can never succeed (a 403 from the policy, a 404) "Try again" is not true; a neutral "That did not go through." would be safer if the owner cares.
- The `noteDesktopRefused` call in the relay branch (`container-minigame.js:1103`): the builder's handover says an earlier relay 403 branch makes it unreachable. **That is not so.** The branch at `:1101` (`this.relay` and reason `off` or `not_responding`) comes BEFORE the general relay 403 branch (`:1108`), and a relay desktop has neither `this.remote` nor `this.fromRoute` (`:758-764`), so it is reached for a relay desktop at a switched-off PC. The call is still a no-op in practice, because a relay entry never carries `access` (the server answers `'user'` for a relay). **Keep it** (it costs nothing and holds if a relay entry ever carried a level); correct the handover sentence. Recorded as C5-1 (minor, a wrong note, no code change).

### Check 6: the taskbar marker

Text only: the marker is the constant `ADMIN_TAG_TEXT` (`pc-taskbar.js:55`) in the template at `:249`, with no author or server text in it (the brief said `textContent`; a constant in the template is as safe). Shown only when the model has `account.admin`, which needs `session.access === 'admin'` and not `locked` (`:173`), and the session is the mirror's entry for that PC (`container-minigame.js:1745`). For any other session the template adds an empty string, so the markup is byte-identical to before. The CSS rule is scoped (`.pc-monitor .pc-taskbar-admin`, `pc-monitor.css:498-503`): 2px border, font inherited from `.pc-taskbar` (GNF 16px, `white-space: nowrap`).

**C6-1 (minor). Nothing is done for the marker at phone width.**
- Where: `public/break_escape/css/pc-monitor.css:498-503`, against the narrow rules at `:555-558`.
- Brief unit 09: the marker in the pixel-art rule; review aim "readable at phone width".
- What is wrong: on a narrow screen the taskbar hides `.pc-taskbar-name` and `.pc-taskbar-remote` to make room. The marker is `flex: 0 0 auto` inside `.pc-taskbar-account`, which is `flex: 0 1 auto; min-width: 32px; overflow: hidden` (`:448-455`). "Administrator" at 16px plus padding and border is about 110px wide; when the bar is tight the account box shrinks and the word is cut off with no ellipsis, or it holds its width and squeezes the window tab. Not checked in a browser (a reviewer starts none): the live playtest should look at an admin desktop at 360px with a window open and a takeable container.
- Fix: a narrow form, for example `.pc-monitor[data-narrow] .pc-taskbar-admin { ... }` showing a short "Admin", or hide the word and put a 2px `#c0392b` border on the headshot. Also add the level to the account's `title` (`pc-taskbar.js:247`) so it is not lost when clipped.

### Check 7: the validator and the schema

Read `scripts/validate_privilege.rb` in full; ran `validator-privilege` (17 pass) and the unmodified `ops-unchanged-validator` (pass: no shipped scenario gains a line). Ran the real `validate_scenario.rb` on a scratch scenario holding every later-stage field: each of the seven "not built yet" errors fires with its fixed line (`cachedAccounts`, `domain` on a sign-in PC, `creds.accountKind`, `creds.localTo`, `creds.domain`, `accountOnly`; `harvested` by the unit's test). The schema gained only `creds.admin` (boolean); `creds` stays closed (the three S5c creds keys also fail the schema as "unknown key"). `validate_scenario.rb` gained one `require_relative` and one `run.call`.
- (a) fires when the owner is admitted by profile A and not B, the admin account by B and not A, and A and B share a trimmed, case-folded top-level name; admin accounts are `creds.admin == true` accounts the PC admits plus the account of an `access: "admin"` grant on a weakness whose host is that PC. Matches the brief. The extra admission term on the grant's account agrees with `validate_network_ops.rb:532`, which already refuses a grant whose account the host does not admit.
- (b) fires once per list (top level and each `onConfirm`) holding a `remove_item` at index 1 or later on an `AccessWork.usb_governed?` object. Matches the brief.
- (c) fires when the object's `needsSession` grants name more than one distinct PC. Matches the brief.

**V-1 (minor). Three hand-written copies of the `needsSession` walk, which already differ on odd data.**
- Where: `lib/break_escape/capture_model.rb:408-422` (server), `public/break_escape/js/systems/pc-policy.js:89-102` (client), `scripts/validate_privilege.rb:160-170` (validator, warning (c)).
- Brief unit 13: "found by `CaptureModel.session_grant_pc`'s walk"; unit 08: "the same walk as the server's".
- Same rule for a well-formed scenario: depth-first, list order, into `confirm_action` `onConfirm`, a `condition` ignored; the validator's "first" is the server's first. They differ when a `needsSession` grant has no usable `pc`: the server returns `action['pc']` as it stands (nil ends the search of that list, and at a nested depth the outer list then carries on), the client skips a grant whose `pc` is not a non-empty string and looks further, and the validator drops empty PCs before counting. So for `[grant(needsSession, no pc), grant(needsSession, pc: X)]` the server judges no grant PC (falls back to the object) and the client judges X. They also differ on truthiness (`needsSession: 0` or `""` counts in Ruby, not in JS). The network validator refuses such a grant for other reasons, so no valid scenario shows it; the risk is drift when S5b or S5c touches one copy.
- Fix: add `CaptureModel.session_grant_pcs(obj)` (every grant PC, in order, skipping a blank `pc`), make `session_grant_pc` its `.first`, and have warning (c) call it; make the client skip rule the same and say so in both comments. A shared fixture of four or five odd shapes run by both a Ruby and a node test would pin the three together.

### Check 8: the dungeon graph

Read the new block (`generate_dungeon_graph.rb:1814-1858`) and the Mermaid id change (`:2014-2018`). The node `admin@<pcId>` is made only when it has at least one edge; edges come from the `signin_<npc>` node of each `creds.admin == true` account for each LOGIN lock in `AccessIdentities.reach(...)[:accounts][].opens` (so a PC whose access list refuses the account gets none; test 1 pins it), and from each drawn weakness whose `grants.session.access` is `admin` on a sign-in host (the `grants session` edge to the lock is kept). That is the engine's rule (`account_admin_at?`, and a technique record's stored `access`). Labels are the PC's name or id plus "Administrator session", and the sign-in node's label is display name and username; no password in either (test 5). The raw PC id in `admin@<pcId>` follows the existing `lock_<objId>` convention.

Regenerated into `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5a-client-review/scenarios/` from a `git archive` copy at `cc0f968d7` (nothing written in the tree):
- `test_ops_access`: `.json`, `.md` and `.html` are byte-identical to the committed files. The committed diff is exactly one node (`admin@vault01`) and one edge (`weak_vault01_archive_old_release_admin` to it, label `administrator`), 37/60 to 38/61.
- `test_access_networks` and `m01_first_contact`: the regenerated files differ from the committed ones, but no differing line mentions `admin`; the differences are older drift (see G-2).

**G-1 (minor). The Mermaid id `admin_at_<pcId>` is not checked against the other ids.**
- Where: `scripts/generate_dungeon_graph.rb:2014-2018`.
- The JSON id cannot collide (no other id form holds `@`). In Mermaid text the `@` becomes `_at_`, and room nodes use the raw room id, so a room (or any raw-id node) named `admin_at_<pcId>` would be drawn as the same Mermaid node as the admin node, merging their edges; `hide_id`'s own `$nodes.key?` guard does not cover this mapping. No other generated form (`lock_`, `signin_`, `weak_`, `cred_`, `tech_`, `device_`, `host_`, `pivot_`, `net_`, `jack_`, `implant_`, `door_`, `aim_`) can start with `admin_at_`. No shipped scenario has such a room. The mapping also rewrites ANY id holding `@`, not only the admin one, which is harmless today.
- Fix: in `hid`, abort (or add a suffix) when the mapped id is already a key of `nodes`; one test with a room called `admin_at_pc1`.

**G-2 (minor, not S5a's; for the orchestrator). Two committed graphs are stale against the current scenario files.**
- Where: `scenarios/test_access_networks/dungeon_graph.*` (regeneration adds `lock_bench_pc`, `lock_bench_logs`, `lock_it_pc`, `lock_ops_pc` and renames the implant label) and `scenarios/m01_first_contact/dungeon_graph.*` (two task labels changed).
- Not caused by units 08 to 14 (no `admin` line in either diff; the unchanged-graph snapshot test passes). Listed only because the check asked for the comparison. No action in S5a.

### Check 9: tests

Ran: the eight new files, `dungeon-graph-ops`, `ops-unchanged-validator`, `pc-policy`, `pc-sessions`, `pc-taskbar`, `network-links`: all pass. Then every test file that names `interactions.js`, `apply-actions.js`, `pc-sessions.js`, `pc-policy.js`, `pc-taskbar.js` or `network-links.js` (113 files): 111 pass; `capture-log` and `lab-ux-ui` fail, both known on this machine. No new static import of a NEW module was added by units 08 to 12 (the second import in `interactions.js` is of a module its harnesses already swap, and all 56 harnesses that load `interactions.js` pass), so no copy list is missing an entry.

Each behaviour in the brief's test lists for units 08, 10, 11, 12, 13 and 14 has a test that would fail if it broke, with the exceptions below. The tests read real modules (the interactions test runs the real `apply-actions.js`, `pc-policy.js` and `PcSessions`), and none was found that cannot fail apart from C1-2's title.

**T-1 (minor; goes with the two majors). The tests that should have caught C1-1 and C2-1 do not look where the fault is.**
- `test/js/apply-actions-gated-remove.test.mjs:144-158` ("a second remove_item for an object in flight sends nothing") uses one-action lists and asserts only the POST count, so it cannot see the rest of a list running. Add a marker action after the `remove_item` and assert it has not run, before and after a 422.
- `test/js/pc-sessions-admin.test.mjs:76-85` proves "a later answer without `access` clears it" for a sign-in answer only. Nothing covers the desktop answer (`settle`). Add the two `settle` cases given under C1-1.
- `test/js/interactions-admin-plant.test.mjs:179` covers a second interact for a `requiresItem` object only; add one for an object with `triggerOnInteract` and no `requiresItem` (the `:1172` path).

**T-2 (minor). Smaller gaps.**
- `network-links-needs-console.test.mjs`: the fallback line (a `needs_console` body with no `error`) is not tested; one assertion.
- `validator-privilege.test.mjs`: nothing asserts "the schema stays closed" (for example `creds.accountKind` fails `validate_json`); `accountOnly` and the creds fields are tested on a room NPC only, not on top-level `npcs` or `phoneNPCs`; (a) has no case for owner and admin being the same account (the `next if` at `validate_privilege.rb:124`).
- `pc-taskbar-admin.test.mjs`: nothing covers the narrow layout (C6-1); that is for the browser proof, not a node test.
- `apply-actions-gated-remove.test.mjs:199-214` checks the container desktop calls `noteDesktopRefused` "on every branch that keeps the session" with a stubbed mirror; fine, but it sits in the apply-actions file where a reader of the container tests will not find it. Move or cross-reference when the file is next touched.

## Count

- Blockers: 0
- Majors: 2 (C1-1, C2-1)
- Minors: 13 (C1-2, C1-3, C2-2, C2-3, C2-4, C3-1, C5-1, C6-1, V-1, G-1, G-2, T-1, T-2)

## Answers the prompt asked for

- Check 3: both globals are always set before the first interaction (static imports at `interactions.js:22` and `core/game.js:67`). A missing `pcSessions` fails closed. A missing `pcPolicy` would fail the wrong way (item removed locally, server keeps it) but is not reachable in the game. The namespace import is sound.
- Check 5: the generic line for a 4xx with no `error` is acceptable. The relay-branch `noteDesktopRefused` call IS reachable (the handover is wrong) and is a harmless no-op; keep it.
- Check 8: the regenerated `test_ops_access` graph equals the committed one; the Mermaid id can collide only with a raw room id of the same spelling (G-1).

## Checks not completed

None skipped. Limits: no browser was started, so C6-1 (phone width) and the Mermaid rendering of `admin_at_<pc>` are from reading the CSS and the generated text only. The old generator could not be run from an archive copy for a before/after comparison of the other two scenarios (it exited 1 outside the tree), so "no S5a change to other scenarios' graphs" rests on the unmodified `ops-unchanged-validator` snapshot test passing and on the diffs holding no `admin` line.

## Verdict

Not ready to land as it stands: fix C1-1 (the desktop answer must feed `access` to the mirror) and C2-1 (an in-flight `remove_item` must stop its list) with their tests (T-1), then a delta review. Neither lets a client gain anything from the server, which re-checks every plant; C2-1 lets client-side actions run for a plant the server refused, and C1-1 makes the admin override vanish after a power-off or a reload with the route down. The validator, the schema, `needs_console`, the policy helpers and the graph do what the brief says. The minors can go in the same fix pass or be ruled out by the orchestrator.

## Fix outcomes (client fixer)

| Finding | Outcome |
|---|---|
| C1-1 major | Fixed. `PcSessions.settle` takes `access` from the desktop answer only: `admin` and not locked sets it, anything else deletes it. Tests: off then on, reload while off then on, locked never gains it, technique after `not_responding` (`pc-sessions-admin`). |
| C2-1 major | Fixed. The in-flight guard in `apply-actions.js` sets `stopped = true`; `interactions.js` checks `plantsInFlight` on the no-`requiresItem` branch. Tests: the repro as a committed test (one POST, nothing after the remove before the answer; a refusal runs none, a success runs the rest once), and an interactions test for the plain branch. |
| C1-2 | Fixed: test retitled, the no-`access` relay case added. |
| C1-3 | Fixed: a repeat technique grant differing only in `access` sets it in place, no events. `pc-sessions-access` m2 updated to expect that. |
| C2-2, C2-4 | Declined: no code asked; docs lines belong to unit 17. |
| C2-3 | Fixed: `.catch` on both `sendGatedRemove` callers; test with a throwing `gameAlert`. |
| C3-1 | Declined: not needed to land; load order guarantees both globals. |
| C5-1 | Declined: a wrong sentence in the handover, no code; the review records it. |
| C6-1 | Partly: the account `title` names the level (test). No narrow-width CSS: the review gives no rule it could verify, and no browser was used; left for the live proof. |
| V-1 | Partly. Client (`pc-policy.js`) and validator (`validate_privilege.rb`, now stripped) agree: a grant with no usable `pc` is skipped; test added. The server copy `CaptureModel.session_grant_pc` is in `lib/` (the server fixer's files) and still returns a blank `pc`; it needs the same skip. No shared fixture. |
| G-1 | Fixed: the Mermaid id of `admin@<pc>` gets `_` appended until free; test with a room called `admin_at_desk_pc`. |
| G-2 | `test_access_networks` graph regenerated and committed: its diff holds no `admin` line and is the generator drift the review describes (four `lock_*` sign-in/PIN nodes, `pivot_*` nodes, `exposes` edges, implant labels). `m01_first_contact` regenerated too (two task labels) but NOT committed: the brief forbids editing campaign missions; the files are left as committed. |
| T-1 | Done with the tests above. |
| T-2 | The `needs_console` fallback line is tested. Declined: the schema-closed, top-level `npcs`/`phoneNPCs` and same-account validator cases (not a one-place change), the move of the container test. |
