# S5b/S5c stage review, round 2: client (delta)

Scope: the client part of `git log a9dbb0588..HEAD`: c18d6c40e, 40353a92d and 415f5a1e7 (the small fixer's remote domain commit). Files: `cached-accounts-panel.js`, `password-minigame.js` (`setRemoteAccounts`), `unlock-system.js`, `remote-host-text.js`, `scenarios/test_ops_privilege/PLAYTEST.md`, `mission.json`, the JS tests, the docs. No server was started and no beat was clicked: the PLAYTEST trace below is static (every label and prompt checked against `scenario.json.erb` and the client source), so it cannot prove a beat plays, only that no beat is known not to. Nothing was fixed.

Result: 0 blockers, 0 major, 4 minor.

## How it was checked

- `node --test test/js/cached-accounts-panel.test.mjs cached-accounts-toast.test.mjs signin-domain.test.mjs account-only-session.test.mjs` (node 22.11): 32 tests, 32 pass, 0 todo.
- The remote domain test (`signin-domain.test.mjs`, "a remote sign-in screen names the domain too") goes through `remoteLockable` and `openLoginSignIn` and the real `PasswordMinigame`, with the recorded answer `remote_lockable_bay_pc`: it checks `mg.signIn.domain` and the `.signin-domain` text.
- Labels in beats 12 to 25 grepped in `scenario.json.erb` (Switch Sam's PC off?/Switch off/back on/Switch on, the survey stick question and its "Leave it", Survey port on the bay desk, both assist codes, IT rota poster, Sam's PC power, Desk PC A, Audit log terminal, Ravi's domain login) and in `public/break_escape/js` (Switch user, Signed in now, Nothing new is cached here, Other user, the left-open screen line, Remote assist session / Using ...'s session). All found. "This account can't sign in on this PC" is server text (`game.rb:3151`).

## Round 1 table

| Finding | Status | Evidence |
|---|---|---|
| R1-CLIENT1 beats 12, 18, 25 left sessions open | closed | PLAYTEST.md lines 197 to 241: a "Where each session is after beat 11" paragraph, then **Needs** / **Get there** / **Leaves** on each beat; beat 12 signs Adel out first (line 200), beat 18 signs out of `bay_pc` (219), beat 25 signs out of `hot_desk`, `bay_pc`, `desk_a` (240). Static trace: every Leaves matches the next Needs. |
| R1-CLIENT2 beat 16 vs 19, 20 | closed | Beat 16 (212 to 215) now collects Priya before the borrow, then the borrow, then Sam; beat 19 reads `x2 count: 1` (221); beat 20 lists both rows (224); timing sentence gives measured figures (104 s, 106 s). Server's audit merge ("x2") is not judged here: needs Opus. |
| R1-CLIENT3 remote domain (owner ruling: show it) | closed | `unlock-system.js:940` `domain: domainOf(answer)`, `:980` carries it into the screen; `password-minigame.js:2210-2224` draws or updates `.signin-domain`; test passes through the real path (see above). Server side (`network_access.rb:1003-1004`): needs Opus, not judged. |
| R1-CLIENT4 stale PLAYTEST header, layout | closed | Title and intro name S5a to S5c (lines 1 to 4), "Three things" list, sign-in PC names (62), Layout lists `hot_desk`, `sam_pc`, `sam_breaker`, `it_room` (87), End of run after beat 25 (243). |
| R1-CLIENT5 hand-written PC objects | closed | `signin-domain.test.mjs` takes PCs from recorded `room_lobby`, `room_bay`, `room_it_room`; asserts `bay_pc` and `hot_desk` carry the domain. |
| R1-CLIENT6 composed desktop answers | closed | `cached-accounts-panel.test.mjs:77` uses `desktop_admin_desk_a`, `desktop_deskadmin_desk_b`; account-only test uses recorded answers. |
| R1-CLIENT7 cracked row reads "hash" | closed, with a limit | `markCracked` (`cached-accounts-panel.js:139-149`) after each press; tests at `cached-accounts-panel.test.mjs:284` and `:299` on recorded keyring answers. Limit: see R2-CLIENT2. |
| R1-CLIENT8 late collect not told to keyring | closed | `cached-accounts-panel.js:178-186` refreshes before the `gone` check; test at `:315` ("answered after the desktop closed still tells the keyring and draws nothing"). |
| R1-CLIENT9 foothold/from untested | closed | `:334-345` pure `cachedAccountsQuery` cases and two desktop cases reading the request URL. |
| R1-CLIENT10 doc line numbers, A19, plan vs code | partly closed | Line numbers now match (`game.rb:3329`, `:3352`); A19 reworded. A20 text went stale again after 415f5a1e7: R2-CLIENT3. |
| R1-CLIENT11 mission.json | closed | One "Nothing to solve." (count 1), S5b and S5c named in description and objective, duration 75 (PLAYTEST says about 75). |

## New findings

### R2-CLIENT1 (minor): beat 13 describes a toast the code no longer shows

`PLAYTEST.md:203` says the toast reads "Hash collected" "twice on two lines, one per hash". The same fix commit changed `findToastText` (`remote-host-text.js:208-217`) to merge equal lines, and `cached-accounts-toast.test.mjs:70-73` asserts one toast, text `Hash collected (2)`. Beat 13 as written does not match what the screen shows; beat 16 ("Cached accounts" adds one pair, so plain "Hash collected") and beat 23 are unaffected.

Fix (`PLAYTEST.md` beat 13): "A toast reads 'Hash collected (2)' (one line, the two hashes counted)".

### R2-CLIENT2 (minor): a row's "cracked" state is read only at the next press; beats 17 and 20 do not say so

`markCracked` runs only inside the collect press (`cached-accounts-panel.js:186`). Beat 17 cracks Sam's hash from the panel's own "Crack" button, closes the cracker, and the row stays "hash" / "Crack" until "Cached accounts" is pressed again; then it reads "cracked" / "Open". Beat 20's relay press (line 224) will therefore show Sam's row as "cracked" / "Open" (the keyring lists `hotdesk_sam` cracked in the recorded `keyring_after_collect_desk_b`) and Priya's as "hash"; the beat says nothing of it. Display only; the server still decides.

Fix: either in `cached-accounts-panel.js` re-run `markCracked(window.keyring?.latest)` when the cracker closes (the `open` callback is the one place that knows), or in `PLAYTEST.md` beat 17 add "the row still reads hash until the next press" and beat 20 "Sam's row reads cracked / Open (beat 17), Priya's hash / Crack".

### R2-CLIENT3 (minor): docs contradict each other and the code on the remote domain line

- `docs/ACCESS_AND_NETWORKS.md:781` ("Plan vs code") still says the Domain line is built "at the keyboard only"; line 776 says the remote screen shows it.
- `:776` says the remote screen reads it "from the `domain` the server puts on the host row (... the server part is landing separately)". The server part landed, and on the remote sign-in tile answer (`network_access.rb:1003-1004`, recorded as `remote_lockable_bay_pc`), not the host row; `remoteLockable` still copies `row.domain` (`unlock-system.js:368`) that a host row never carries (dead, harmless). Whether that answer is the right carrier is the server's call: needs Opus.

Fix (`docs/ACCESS_AND_NETWORKS.md`): delete "(at the keyboard only)" at 781; at 776 say "from the `domain` in the server's remote sign-in answer for that PC". Optionally drop the `row.domain` spread at `unlock-system.js:368`.

### R2-CLIENT4 (minor): two beats name screen states the browser has not shown since the fix

PLAYTEST.md says it was played in game 173 "the commit before this one", but two statements were written after it and no browser was run: beat 5's "Domain: northwind" under "Bay desk PC (BAY01)" arriving a moment after the screen opens (line 146, 415f5a1e7), and beat 23's "reads 'cracked' with the button 'Open'" at `desk_b` with "Open shows the Cracker already reading Cracked ... Crack disabled" (line 236). Both rest on jsdom tests with recorded answers, not a clicked run.

Fix (`PLAYTEST.md`): mark the two lines "not yet seen in a browser" until the playtester runs them, or let the playtester's run replace the wording.

## Static trace of beats 1 to 25 (click path to request)

Each beat's clicks reach the request its Needs implies: sign-in tile or Other user -> `POST /login`; Start, Switch user and Sign out -> `/login` and `/logout`; "Cached accounts" -> `POST harvest_credentials` (route none, `relay=1`, `foothold`, `from` per the desktop); Crack -> the cracker scene (`ops-cracker`, keyring crack); drop box and USB sockets -> the confirm and `/network/implant` or inventory `remove`; breaker switches -> the object's action; assist codes -> `inventoryAct` Connect -> relay login. No beat needs a forged request. Session carry between beats 11 to 25 was walked in order (Leaves vs next Needs) and holds, including `store_pc` Uma relay in beat 21 and Adel's relay at `hot_desk` in beat 20 being signed out in beat 25. No beat found unplayable by clicking; this is a static result.

## Recorded limits

- No browser run; beats 5 and 23 as above. The leak-check `--signin` numbering in "End of run" (line 247) is the scanner side's.
- Server facts not judged (needs Opus): the audit "x2 count: 1" merge, `domain` on the remote answer, "the same token serves both desks" (the recorded keyring does list `desk_b_deskadmin` cracked after the `desk_a` crack).
- Not tested: a remote sign-in for a PC with no domain shows no line (no negative case in `signin-domain.test.mjs`); the code path draws it only for a non-blank string.

## Checked and found sound

- `setRemoteAccounts` updates one `.signin-domain` node or inserts one after `.signin-title`, uses `textContent` (hostile text stays text), and a later full redraw reads `s.domain` (`password-minigame.js:1664`), so no duplicate line.
- A collect answered after cleanup draws nothing and still refreshes the keyring (`:178-186`); `markCracked` is skipped when gone.
- `crackedHashIds` takes only `kind: 'hash'` entries with `status: 'cracked'`; the panel test pins `hash`/`Crack` for an uncracked row.

Verdict: clean
