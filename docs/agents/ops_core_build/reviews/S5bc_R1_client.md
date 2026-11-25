# S5b/S5c stage review, round 1: client, scenario, playtest script and docs

Scope: every commit from `git merge-base main ops-priv2` (`2d9e963c8`) to `449556f1c`, for this area only: `cached-accounts-panel.js` and its mount in `container-minigame.js`, the test bridge readers in `test-bridge/access.js`, the sign-in screen's "Domain:" line (`unlock-system.js`, `password-minigame.js`, CSS), the account-only session display, `scenarios/test_ops_privilege/` (`PLAYTEST.md`, `mission.json`, the graph), the JS tests and `privilege-answers.mjs`, and the unit 26 docs (`README_scenario_design.md` A18 to A20, `docs/ACCESS_AND_NETWORKS.md`). Nothing was fixed. No server was started; no beat was clicked in this round (browser facts below come from the builder's own log of game 167, `tools/playtest/pipes-167/out`).

Result: 0 blockers, 3 major, 8 minor.

## How it was checked

- Node tests, `PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH node --test test/js/*.test.mjs`: 15008 tests, 14999 pass. The failures are the three named in the hand-on as already failing on main (`capture-log` test 2, `lockpick-mode-switch-roundtrip`, `lab-ux-ui`) and four whole-file "Unable to deserialize cloned data" runner errors (`engine-fixes-pass3`, `tap-pick` pass alone; `npc-needs-return-standing-npc`, `rfid-door-screen` give the same runner error alone; none is touched by the stage). No test fails for a missing `cached-accounts-panel.js` in a harness copy list.
- Validator: `LANG=C.UTF-8 ruby scripts/validate_scenario.rb --no-graph scenarios/test_ops_privilege/scenario.json.erb` gives `0 errors (0 known), 3 warnings`, the three warnings and the `deskadmin` info line that `PLAYTEST.md` lists.
- Graph: `generate_dungeon_graph.rb` on a copy of the one scenario file (in `/data/tmp/scratch/s5bc-r1-client/`) gives `dungeon_graph.html`, `.md` and `.json` byte-identical to the committed ones (`cmp`).
- Scratch probes (outside the repo, `/tmp/claude-1002/-home-deploy-Hacktivity/bddb8e5b-5baf-4f12-89a2-9673325353c9/scratchpad/s5bc-r1-client/`): `probe.test.mjs` (the panel through the real `ContainerMinigame`, with the harness of `cached-accounts-panel.test.mjs`; output `probe_out.txt`) and `dom2.test.mjs` (the remote sign-in screen through the real `unlock-system.js`).
- One slip of mine, no effect: a `grep` opened the named pipe `tools/playtest/pipes-167/in` for reading and hung. Session 167 was already closed (its holder process is gone); I killed my own `grep`. Nothing was read from or written to a live session.

## Findings

### R1-CLIENT1 (major): beats 12, 18 and 25 cannot be played as written, because a session the script leaves open is still there

`scenarios/test_ops_privilege/PLAYTEST.md`.

- Line 197 says beats 12 to 21 "use the same game" as beats 1 to 11; line 200 says they were clicked in a fresh game (165). In the same game Adel's keyboard session at `bay_pc` is still open after beat 8 (line 173: "the desktop opens at once with the 'Administrator' marker and no sign-in screen"), and beats 9 to 11 never sign out of `bay_pc`. Beat 12 (line 202) says "click `bay_pc`; click the 'Uma Quayle' tile": no tile is shown, Adel's desktop opens.
- Beat 13 (line 203) signs Adel in at `bay_pc`; beat 14 (line 204) only closes the desktop with x (line 136 of the same file: closing does not end the session). Beats 15 to 17 are elsewhere. Beat 18 (line 208) then says "with no session at `bay_pc`" and expects the refusal toast and no question, but nothing has signed Adel out. With that session open the client lets the stick through: `public/break_escape/js/systems/pc-sessions.js:502-506` (`plantAdmin`: `sessionAdmin(portPc)`), and the server does the same (beat 19). So beat 18 as written shows beat 19's question, not the refusal.
- Beat 19 (line 209) signs Adel in at `bay_pc` again and does not sign out. Beat 25 (line 220) expects the sign-in screen at `bay_pc` with a Ravi tile, and warns about an open session only for `desk_a`.
- Not verified, to check while re-clicking: in the same game the player also holds `kit_stick_a` from beat 3 (a second `usb` item), and `bay_usb_port` removes `"item": "usb"` (`scenario.json.erb:590`); beat 19 says `survey_stick` leaves the tray.

Fix (`PLAYTEST.md`): decide and state one of "same game after beat 11" or "fresh game" at line 197, then make each beat name its starting session: beat 12 "if a session is open at `bay_pc`, Start, Switch user"; beat 18 "Start, Sign out at `bay_pc` first" (and say which stick leaves if two are held); beat 25 "sign out of `bay_pc` (Adel, from beat 19) and of `hot_desk` first". Re-click beats 12, 18, 19 and 25 in the order written and correct the text to what the screen shows.

### R1-CLIENT2 (major): beat 16 as written contradicts beats 19 and 20, and its "only Priya before the borrow" half has still not been clicked

`PLAYTEST.md` line 206 (beat 16) makes the first collect at `hot_desk` after Sam's borrow, so that press adds two pairs (Priya and Sam). But:

- Beat 19 (line 209) expects the audit row `CRED_COLLECT adelwick Hot desk PC OK count: 1`. `count` is the number of pairs a press adds: the recorded run has `count: 2` for the bay press that added two (`ops_privilege_answers.json`, `audit_rows_after_override`: `{'event': 'CRED_COLLECT', 'result': 'OK', 'detail': 'count: 2'}`) and `OK x2`, `count: 1` for the hot desk, where the Rails beat collects once before and once after the borrow. Played as written, beat 19 reads `count: 2` for the hot desk.
- Beat 20 (line 210) says the relay press "kept Priya's row" and "(Priya already collected at this PC)". After beat 16 the PC holds two rows (recorded `collect_hot_desk_after_borrow`: `held` is priya, sam).

Both lines are left over from game 165, which had no borrow. Beat 16 itself is playable: the builder's log of game 167 shows the switch path working (`tools/playtest/pipes-167/out` lines 11 and 12: `borrow_set` at t=414, `using` at `hot_desk`, `borrow_done` with `met: true, leftOpen: true` at t=518). Its timing sentence is not stated truly, though: "about two minutes later (browser game 167: 70 to 100 s)" gives two different figures, and the log has 104 s between `borrow_set` and `borrow_done` alone.

Fix (`PLAYTEST.md`): start beat 16 with the missing half: before touching `sam_breaker`, sign in at `hot_desk` as Adel, press "Cached accounts", read one row (Priya), sign out. Then the switch, the borrow, the collect that adds Sam. Replace the timing sentence with "wait until the need log shows `borrow_done` for `hot_desk` (game 167: N s after the switch)", with the figure measured from the switch click. Click the whole beat, then correct beats 19 and 20 to what that run shows (the audit row for the hot desk, and both rows on the relay press). Remove the sentence that hands the first half to the Rails test.

### R1-CLIENT3 (major): "a remote sign-in screen names the domain too" is not true; the test that says so never goes through the remote path

`test/js/signin-domain.test.mjs:137` renders `PasswordMinigame` with a hand-written `signIn` block that already holds `domain`. The real remote screen is opened by `openRemoteSignInScreen` (`public/break_escape/js/systems/unlock-system.js:896`, `domain: domainOf(data)`), whose `data` is the lockable built by `remoteLockable` (`unlock-system.js:363-370`): a closed list of keys with no `domain`. `GET /network` host rows carry no domain either (no `domain` key anywhere in `ops_privilege_answers.json`).

Evidence (`dom2.test.mjs`, the real `unlock-system.js`, a host row that even carries `domain: 'northwind'`):

```
# LOCKABLE {"id":"bay_pc","name":"Bay desk PC","host":"BAY01","type":"pc","sprite":"pc_desktop","lockType":"login","locked":true,"loginPicker":false,"remote":{"footholdId":"jack_office_port"}}
# REMOTE signIn.domain=null remote={"footholdId":"jack_office_port","linkName":"L"}
```

So line 896 can never show a domain, the test name claims a behaviour the game does not have, and `docs/ACCESS_AND_NETWORKS.md` A20 ("A PC with a `domain` shows 'Domain: <name>' on its sign-in screen") is true at the keyboard only.

Fix: remove the dead line at `unlock-system.js:896` and the test at `signin-domain.test.mjs:137`; add a test through `remoteLockable` and `openLoginSignIn` that the remote screen has no domain line; say "at the keyboard" in A20's "What the player sees". (Showing it remotely is the owner's call, below.)

### R1-CLIENT4 (minor): `PLAYTEST.md` still describes the S5a scenario in its header, setup and layout

- Line 1 (title "privilege stage S5a, feature A18") and lines 3-4 ("nine beats", "about 40 minutes").
- Lines 12-17: "Four things have no browser beat": the first ("A stick the policy refuses, accepted under admin: no path in a validator-clean scenario today ... A later small unit may add a field ... brief O3") is false now: `portOf` exists and beat 19 plays it.
- Line 48 "(here both PCs admit every account)" and line 67 "(`bay_pc` or `store_pc`; the beats say where)": the scenario has eight sign-in PCs. The `--signin` example (lines 70-76) covers beats 1 to 11 only; nothing says how to name the keyboard sign-ins of beats 12 to 25 (`hot_desk`, `desk_a`, `desk_b`, `lab_pc`).
- Lines 85-97 ("Layout") list none of `hot_desk`, `sam_pc`, `sam_breaker`, `it_room`; line 93 "Both PCs admit every staff account."
- Beat 11 "End of run" (line 190) sits before beats 12 to 25.
- Beat 25 (line 220): "(the client does not show 'Domain: northwind' yet: that is a later unit)". Unit 25 built it (`password-minigame.js:1664`); the line has not been seen in a browser.

Fix (`PLAYTEST.md`): rewrite the title, intro, the "no browser beat" list (drop the first item), the sign-in naming text and Layout for the scenario as it is; move "End of run" after beat 25; in beat 25 click `hot_desk` and `bay_pc` and write the "Domain: northwind" line as shown, and that `desk_a` shows none.

### R1-CLIENT5 (minor): the domain test's PC objects are hand-written and wrong about the scenario

`test/js/signin-domain.test.mjs:54-58`: "PC objects as the scenario authors them (test_ops_privilege: hot_desk and desk_a carry a domain)". In the scenario the domain PCs are `hot_desk` and `bay_pc` (`scenario.json.erb:345`, `:465`; `ops_privilege_scenario_test.rb:496`); `desk_a` has none (beat 25 depends on that). No recorded answer holds a PC object with its `domain`: the fixture has no room answer.

Fix: in `ops_privilege_scenario_test.rb` record the room answers for `lobby`, `bay` and `it_room` into `ops_privilege_answers.json` (for example `room_bay`, `room_lobby`, `room_it_room`); in `signin-domain.test.mjs` take the PC objects from those answers through `privilegeAnswer` and drop the hand-written list.

### R1-CLIENT6 (minor): two tests compose or hand-write a desktop answer although a recorded admin desktop exists

- `test/js/cached-accounts-panel.test.mjs:78-81` builds the admin desktop by putting the session block of `signin_admin_bay` into the user's `desktop_user_bay`. The fixture has a real one: `signin_admin_desk_a`, `desktop_admin_desk_a`, `collect_desk_a_deskadmin`.
- `test/js/account-only-session.test.mjs:71-72` answers the desktop fetch with `{ contents: [] }` and a PC `{ name: 'Desk PC', host: 'DESK-B' }` (the scenario's host is `DESKB`). No desktop answer is recorded for the `deskadmin` session at `desk_b`.

Fix: move the admin cases of `cached-accounts-panel.test.mjs` to `desk_a` with the three recorded answers; record `desktop_deskadmin_desk_b` in `ops_privilege_scenario_test.rb` and use it (and the recorded room answer of R1-CLIENT5 for the PC object) in `account-only-session.test.mjs`.

### R1-CLIENT7 (minor): a row for a hash the player has already cracked still reads "hash" with a "Crack" button

`cached-accounts-panel.js:84-90` writes the tag "hash" and the Crack button for every row. Beat 23 (`PLAYTEST.md` line 218) records the result at `desk_b`: "the row does not read 'cracked'", and Crack opens a cracker that is already finished. The client already holds the fact: the keyring entry for the same id has `"status": "cracked"` (`ops_privilege_answers.json`, `keyring_after_collect_desk_b`, entry `baypc_olu`).

Fix (`cached-accounts-panel.js`): after the keyring refresh, for each row whose `hashId` matches a keyring hash entry with `status: "cracked"`, set the tag text to "cracked" and the button text to "Open" (display only, from data the browser already has; the server still decides the crack). Add a panel test with the recorded `collect_desk_b_deskadmin` and `keyring_after_collect_desk_b`, and correct beat 23.

### R1-CLIENT8 (minor): a collect that answers after the desktop is closed is never told to the keyring

`cached-accounts-panel.js:150` returns on `gone` before the refresh at line 157. Probe P4 (press, close the desktop while the request is in flight, then a 200 with two rows): `# P4 keyring refreshes after gone 0 rows 0`. The server has added the pairs and written the log row, but no "Hash collected" toast comes and the capture log is stale until something else refreshes it.

Fix (`cached-accounts-panel.js`): on a 200 with `success: true`, call the keyring refresh before the `gone` check (draw nothing when gone). Add the case to `cached-accounts-panel.test.mjs`.

### R1-CLIENT9 (minor): no test for the `foothold` and `from` route parameters

`cached-accounts-panel.test.mjs` tests the keyboard (no parameter) and `relay=1` (line 252) only. The code is right (probe P6: `harvest_credentials?foothold=jack%20office%261` and `?from=store%20pc`, each encoded), but nothing pins it.

Fix: add two cases to `cached-accounts-panel.test.mjs` that open the desktop with `remote: { footholdId }` and `remote: { fromPcId, fromHost }` and read the request URL, and a pure case for `cachedAccountsQuery`.

### R1-CLIENT10 (minor): doc statements that do not match the code

- `docs/ACCESS_AND_NETWORKS.md:715` (text unit 26 rewrote): `session_access`, `game.rb:3300` and `account_admin_at?`, `game.rb:3323`. They are at `game.rb:3329` and `game.rb:3352`.
- `README_scenario_design.md:1030` (A19): "An account can be cached only after its holder has borrowed the PC." reads as a rule for every account; only an `after: "borrow"` entry waits. `ACCESS_AND_NETWORKS.md` A19 says it correctly ("One account can be cached only after ...").
- `ACCESS_AND_NETWORKS.md` A20 "Plan vs code": "are built by the unit that follows the server work (unit 25)" is written as work to come; it is built.
- A20 "What the player sees": see R1-CLIENT3 (keyboard only).

Fix: correct the two line numbers; README A19: "An entry marked `after: \"borrow\"` is cached only after its holder has borrowed the PC."; A20: state both client parts as built.

### R1-CLIENT11 (minor): `mission.json` does not mention S5c and repeats a sentence

`scenarios/test_ops_privilege/mission.json`: `description` has "Nothing to solve." twice and neither field names the shared, hardened or domain accounts of beats 22 to 25; `estimated_duration_minutes` is 30 while `PLAYTEST.md` line 4 says about 40 minutes for beats 1 to 11 alone.

Fix: one "Nothing to solve." at the end; add the S5c proofs to `description` and `test_objective`; set the duration to the measured length of a full run.

## Checked and found sound

- The panel shows only what the server sent: rows come from `body.held` alone, a row with no `hashId` gets no Crack button (probe P5: `[false,true]`), a refusal lists nothing new and shows `refusalText(reason)` (`not_admin`, `locked`, `not_reachable` have lines; the 404 has the generic one).
- No control for a user session, a relayed user or a claim (mount returns null); the control goes with sign-out and with the desktop (probe P3: no button, no scene). When the level ends under an open desktop (PC off, lock) the button stays, as the "Administrator" marker does, and the press shows the server's refusal (P1: "That cannot be reached from here."; P2: "That is locked."): the server decides.
- In flight: the button is disabled and a second press sends nothing (P4 and the shipped test); an answer after cleanup draws nothing.
- Hostile display name, username and domain are drawn as text (`textContent`, `escapeHtml`); the shipped tests cover each and pass.
- The route sent is the desktop's own: keyboard none, relay `relay=1`, foothold and from encoded (P6); the body is `{ pc_id }` only.
- The bridge readers read and click the real DOM and send nothing themselves.
- Harness copy lists: no node test fails for the new import (full run above).
- `privilege-answers.mjs` reads by name and returns a deep copy; the panel and bridge tests take collect answers and statuses from it.
- Validator output and the committed graph for `test_ops_privilege` match what `PLAYTEST.md` and the generator say.
- Beat 16's switch path is real: labels in the scenario match the script (`scenario.json.erb:380-403`), and game 167's log shows the borrow completing.
- A19's collect answer shape, row keys and refusal list match the recorded answers; A20's account-only key list matches `PRIVILEGE_ACCOUNT_ONLY_KEYS` (`validate_privilege.rb:328`).

## For the owner

- Should a remote sign-in screen show the PC's domain? Today it cannot (R1-CLIENT3). Showing it means the server adds `domain` to a scanned host row in `GET /network`, a new thing sent to the browser. The fix above assumes no.

Verdict: not clean
