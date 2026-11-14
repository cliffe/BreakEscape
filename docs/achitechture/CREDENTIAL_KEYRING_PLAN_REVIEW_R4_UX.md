Counts: B 1, M 10, m 14, n 3

# Credential keyring plan: review round 4 (UX and game design)

Reviewer: fresh, UX and game design side. Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` at 66b998cf5 (Appendix A not read). Design source: the q92 explainer, option 3. Code: branch `build/ux-slice2b0` at c0c274522 (cited as `2b0:`), engine JS under `public/break_escape/js/`.

## What I checked

- Every beat of `test_access_keyring` (section 9.1) against rooms, connections, locks, who admits whom, where each secret comes from, NPC placement, the ink gift, the timer and event mapping, and tray slots. I also checked the K0 changes to `test_access_networks` against its 2b0 scenario and PLAYTEST.md, and the K0 effect on `lab_physical_pentest`.
- The player-facing states on the K0 and K3 screens, the tray, the network view and the desktop (loading, late, empty, failed, refusal, ended, off, blocked, reload), with their text, against the 2b0 strings in `password-minigame.js`, `network-links.js`, `network-view-minigame.js` and the server's `REMOTE_BLOCKED`.
- The sign-in tile and chosen-line layout against the 2b0 monitor frame (`utils/pc-monitor.js`, `css/password-minigame.css`, `css/pc-monitor.css`) at the four sizes.
- Connect from the tray (`systems/inventory-menu.js`), the relay, the find toasts, and the keyboard path (`unlock-system.js` `openLoginPc` flow).
- Section 1.1 against the explainer, and D1 to D7 for options, a recommendation and evidence exact enough to build a picks page.
- The UI rules (pixel art, X closes, frame wraps, one look per concept, headshots, diegetic frames, NPC speech in scenario files).

## B

### B1. K1's live proof signs in at Lena's PC, which no real route allows before K2

Evidence: plan 6.5 (line 357): "before and after each proof (sign in at Sam's PC and take the .rdp, sign in at Lena's PC, plant the drop box)". Plan 9.1 cast (line 574): Lena gets in only by `lena_rdp`. The earned-secrets table (lines 586-594) has no source for Lena's password. Lena's PC is in Finance behind a PIN whose code is on Lena's own desktop (line 567). Plan 7 (line 369): the credential branch arrives in K2.

Problem: in K1 the player cannot sign in at `lena_pc` by any honest route. Over the network it needs Lena's password, which the scenario never gives. At the keyboard the room is locked by a code that sits on her desktop. So the `session: lena_pc` proof (`jake_pw_note`) cannot be shown turning on in K1's live proof without typing a secret from the scenario file, which the project's earned-secrets rule forbids. As written, the slice cannot be live-proved.

Fix: in K1, prove the `session` proof on a PC the player can reach. Add a K1-only registry entry proved by `session: sam_pc` (Sam's sticky note), or move the `jake_pw_note` before-and-after check into K2's live proof, after a `POST /login` with the .rdp from the page. Say which in 6.5.

## M

### M1. The K0 answer gives the client neither the PC's picker nor whether the host is headless, yet the layout rules depend on both

Evidence: plan 5.1 step 5 (line 222): the answer is `{ pc_id, remoteScreen, loginAccounts }`. Plan 5.2 (lines 230-233) makes order and inclusion depend on picker `accounts` versus `known`/`false`, and picks a separate line for a headless host. `2b0:unlock-system.js:302-310` `remoteLockable` hard-codes `loginPicker: false` and drops the host row's `headless` (`2b0:network_access.rb:913` sends `headless`). A remote lockable built from a session (`remoteRowFor`, `2b0:unlock-system.js:314-320`) or from the desktop's Switch user (`2b0:container-minigame.js:1250`) has neither field. The plan also answers a headless host as `remoteScreen: "typed"` (line 216), the same value an NLA policy gives.

Problem: the client cannot tell picker `accounts` (leave unlisted captured accounts out) from `known`/`false` (show them). It also cannot tell a headless host (line "Type the account's name and password.") from an NLA PC (line "<host> lists no accounts until you sign in."). P5d and P8 would show the wrong line, and Switch user on HB-DOOR-01 would always be wrong.

Fix: add `loginPicker` (the PC's value or `"accounts"`) and `headless: true|false` to the K0 answer. Have the client read those two fields from the answer only, never from the lockable. Add both to the 5.4 Rails and JS tests.

### M2. A relay session opens the holder's desktop at his own keyboard, against section 8.3

Evidence: plan 8.3 (line 500): "At the holder's own keyboard during a relay session the desk rules apply and the relay session is not offered there." `2b0:unlock-system.js:482-485`: at the keyboard, `sessions.has(pcId)` opens the desktop at once. Plan 3.8 (line 191): a request with no `relay=1`/`from=` param falls to the keyboard rule. Line 192: `settle_session_at_keyboard!` leaves a `via: "credential"` session unchanged. Line 197: `screen-states.js:83` changes so that a credential session no longer paints locked. That line only sets the world sprite's look; it does not decide what opens.

Problem: nothing in the plan stops a click on `jake_pc` from opening Jake's desktop through the relay record, which skips the "person let you in" lesson. Jake stands at that desk in R6 (line 567), so a player will try it.

Fix: in K2, have `desktop_request_allowed?` refuse a no-route request when the session at that PC carries `relay`. In K3c, have the keyboard opener treat a relay record as no session (open the sign-in screen by the desk rules), and have `screen-states.js` paint a relay session as locked (the person's screen is shared, not unlocked at the desk). Add a test for each, and correct line 197's description of `screen-states.js:83`.

### M3. On a foothold screen, an assist invite shows a Connect button that always fails with "Incorrect username or password"

Evidence: plan 8.1 (line 445): "one button per keyring credential for this PC". Line 447: "Sign in with a credential posts `credential` with the screen's route". Plan 7 step 4 (line 376): a route the kind does not allow gets the generic refusal. Plan 3.6 (line 158): `assist_invite` allows only `relay`. HB-FIN-03 is on `office_lan`, so the drop box view lists it (line 567).

Problem: after R6, a player who opens HB-FIN-03 from the network view and chooses Jake sees "Connect with Remote assist code (Jake)". Pressing it posts the foothold route and returns the wrong-password text, which teaches the wrong thing and looks like a bug.

Fix: on a sign-in screen, show only credentials whose kind allows that screen's route (`foothold` or `from` for `saved_connection`; never `assist_invite` outside the relay screen). Or have that button run Connect (the relay route) rather than post the screen's route. Add the case to `keyring-signin.test.mjs`.

### M4. Jake's timed end uses a mechanism the engine does not have, and its reload and bark order are not worked out

Evidence: plan 9.1 (line 581): "an `eventMappings` entry on Jake ... arms an NPC `timers` entry (as implants use) that, about 40 game seconds later, sets `jake_ended_assist` and plays a bark from Jake's NPC JSON". `scripts/scenario-schema.json:785`: `timers` is a top-level scenario array. README 2754: a mapping arms a timer through `setGlobal` plus `startOnGlobal`. README 298: timers run in real time, not game time. Barks come from event mappings (`bark`, `barkDelay`, README 1650-1670), not from timer actions. README 2752: "a reload restarts any timer whose start global is true". README "Barks wait behind a minigame". `2b0:pc-sessions.js:49,545`: `pc_desktop_opened` carries `{ pcId, npcId, via, restored, remote, footholdId }`, with no relay field, so "condition on the relay route" has nothing to read. K3c's file list (line 504) does not add one.

Problem: the builder must invent the wiring. As built the obvious way, three things go wrong. (a) The bark is held behind the open relay desktop and plays after "Jake Brooks ended the remote assist.", so Jake says "I'm ending this" after it has ended. (b) After R8's reload the timer restarts from its true start global and ends the invite about 40 s later whether or not the player reconnects, and R8 does not say so. (c) The condition cannot see the relay.

Fix: specify it. Have K3c add `relay: true` (and `kind`) to `pc_desktop_opened` and `pc_signed_in` for relay sessions. Give Jake a mapping on `pc_desktop_opened` with `data.relay === true && !globalVars.jake_ended_assist`, `onceOnly`, that sets an arming global. Add a top-level `timers` entry with `startOnGlobal` on it, `delayMs: 40000`, a condition `!globalVars.jake_ended_assist`, and `setGlobal: { jake_ended_assist: true }`. Put the bark on a Jake mapping for `global_variable_changed:jake_ended_assist`, worded in the past tense ("I've ended that session. The helpdesk never calls me back."), or fire it from the timer a few seconds before the end. Write R8's expectation for the restarted timer.

### M5. R4's "Jake's shares map" has no share in the scenario

Evidence: plan 9.1 R4 (line 601): "Jake's shares map". The 9.1 spec (lines 554-594) declares networks, policies, rooms, cast and registry, but no `resources`. The explainer's pivot (q92, the sequence diagram) ends with "Jake's shares mapped, Servers block through HB-FIN-02".

Problem: the beat cannot be checked as written, and the builder has to invent a share, where it sits and who it admits.

Fix: declare one share in 9.1, for example `finance_jake` on `office_lan` or `server_lan` with `access: { people: ["jake"] }` and one file. Say what R4 expects on the desktop and in the view.

### M6. D1's case for the lab's answer (ii) is wrong: (ii) keeps Melanie Pierce's one-click tile, and (i) shows fewer accounts

Evidence: plan D1 (line 651): under (i), LW-OPEN-07 offers "Melanie Pierce's own tile ... with her captured password filled: a one-click remote sign-in to her PC". Line 652 recommends (ii). Plan 5.2 (line 232): under `typed`, "the captured tiles, tagged, then Other user". Line 230: under picker `accounts`, captured accounts the PC does not list are left out. `2b0:lab_physical_pentest/scenario.json.erb:1893-1913`: `staff_pc_2` has the default picker and `access: { people: ["pierce"] }`. The lab captures Hampshire (line 1449), Lord (1563) and Pierce (1728, `captureProof` session at `staff_pc_2`, line 1698), with `revealSecret: true` (line 78). The 2b0 remote screen already shows all captured accounts with served passwords filled (`2b0:password-minigame.js:1755-1775`).

Problem: under (ii), LW-OPEN-07 still shows Pierce's captured tile with her password filled, plus Hampshire and Lord, so the one-click sign-in the recommendation is meant to avoid is still there, as it is today. Under (i), the screen shows only Pierce, so Hampshire and Lord disappear from that PC. The user would be choosing on a false premise. It also differs from the explainer, where `typed` "asks first and shows nothing"; 1.1 does not list that change (see m8).

Fix: rewrite the D1 trade-off for the lab. Today, under (i) and under (ii), which tiles show on LW-OPEN-07 and the hot desk, and whether Pierce's password is filled in each. If the aim is to keep remote LW-OPEN-07 free of a filled password, the honest options are an `access`/`accepts` change or hiding captured tiles under `typed`. Add those as options, with the shots.

### M7. "One phrasing per state" is not met: the sign-in screen and server keep their own words for off, unreachable and remote blocked

Evidence: plan 8.5 (line 518): "States the view already names reuse its helpers ... so one state has one phrasing everywhere". Plan 5.2 (line 234): "The host is the PC's `host` label, never 'This PC'." `2b0:password-minigame.js:358-363` `signInErrorMessage`: "This PC is not responding.", "This PC can't be reached." `2b0:network_access.rb:951`: `REMOTE_BLOCKED = 'Remote sign-in is turned off on this PC'`, sent as `message` by POST /login (`2b0:game.rb:2155`) and shown by `signInRefusalMessage`. `2b0:network-view-minigame.js:59`: `REMOTE_OFF_TEXT = 'Remote sign-in off'`. Plan 8.5 adds "Remote sign-in is off on {host}." and its own saved_connection refusal opens "This PC always asks ..." (line 525).

Problem: the remote-blocked state now has three phrasings (view row, server refusal, new toast). Off and unreachable have two each (the view's helpers versus the sign-in error line). The plan's own refusal text uses "This PC", which its own rule bans. A player meets the K0 race close and a refused sign-in on the same host with different words.

Fix: list `signInErrorMessage` and the POST /login `REMOTE_BLOCKED` message in 8.5. On a remote screen, route them through `notRespondingMessage(host)`, `unreachableMessage(host)` and one remote-off sentence built from `REMOTE_OFF_TEXT`. Change the saved_connection refusal to "{host} always asks for the password, so a saved one is ignored. That setting is the fix."

### M8. Connect's "no route" toast says "over this link" when no link is in play

Evidence: plan 8.2 step 6 (line 474) and 8.5 (line 532): "{host} can't be reached over this link. You need a way onto its network." `2b0:network-links.js:66` `unreachableMessage`. Connect runs from the tray with no view and no link (line 476: "Connect starts no network-view trip").

Problem: a player who holds the .rdp and no drop box clicks Connect in the tray and is told the host can't be reached "over this link". They have no link, which is the whole point of the message. Adding "You need a way onto its network." to the shared helper also puts that line on the view's race and outage refusals (`network-links.js:128`), where the player does have a link and the network is down, not missing.

Fix: give the tray its own state: "{host} can't be reached from here. You need a way onto its network." Leave `unreachableMessage` unchanged for the view.

### M9. Connect has no text for its failed or in-flight states

Evidence: plan 8.2 (lines 468-476) lists seven outcomes of a GET /keyring that answered and a POST that returned a refusal. There is no outcome for a GET /keyring that fails (network error, 5xx), a POST /login that fails (network error, 5xx), or a second click while the first is in flight. The task brief and plan section 4 ask for every player-facing state.

Problem: on a dropped request, Connect either does nothing or throws. A double click can post twice and open two desktops or a refusal over a desktop.

Fix: add "Connect could not reach the game server. Try again." (one string, used for both requests), ignore clicks while a Connect is running (the menu entry or desktop button disabled until it settles), and add both to `keyring-client.test.mjs`.

### M10. The kind tags do not fit a tile: three of the four are cut on every screen

Evidence: plan 5.2 (line 235) and 8.1 (line 443): tags in Press Start 2P at 8px, one line, cut with an ellipsis; texts "Captured", "Found in a file", "Saved connection", "Remote assist". `2b0:password-minigame.css:779-780`: tile 104px wide, padding 4px each side, 2px border (border-box), so about 92px inside, which is 11 glyphs of 8px. The compact tile is 84px (`css:1067`), about 9 glyphs.

Problem: "Saved connection" (16), "Found in a file" (15) and "Remote assist" (13) always end in an ellipsis ("Saved conn...", "Found in ..."), so the label meant to teach the kind never shows whole, even at 1400x1000. The ellipsis rule was meant for the rare long label, not the normal case.

Fix: use tag texts that fit nine glyphs, for example "Captured", "In a file", "Saved", "Assist", with the full kind name in the tile's title and on the chosen line. Or let a tag wrap to two lines and size the tile row for that at x1 and x2. Put the chosen wording into D7.

## m

### m1. The PC tiles carry no NPC id, so the "no duplicate" merge and the new PLAYTEST selector have nothing to key on

Evidence: `2b0:game.rb:2416-2421`: a tile is `{ username, displayName, portrait, avatar }`. Captured tiles carry `targetId` (`2b0:password-minigame.js:1701`). Plan 5.4 (line 255): selector `.signin-tile[data-npc-id="lena"] .signin-tag`. P5c (line 256): "one tagged Ian tile, no duplicate".

Problem: the plan does not say how a captured account is matched to a PC tile, and no tile carries an NPC id for `data-npc-id`.

Fix: say the match key (the username, which both carry), and either add `npcId` to the remote answer's tiles or make the selector `[data-username="ishaw"]`.

### m2. "Close this screen first." can never show

Evidence: plan 8.2 (line 468): with a minigame open, the Connect entry "is greyed with 'Close this screen first.'". `2b0:inventory-menu.js:160-170, 184`: the tray is covered while a minigame or chat is open, and `openInventoryItemMenu` returns without opening a menu. 8.5 (line 538) gives the line a D7 row.

Problem: a state with text that no player can reach, plus a D7 row to approve for nothing.

Fix: drop the greyed entry and its row, and say Connect opens only from an uncovered tray, as the existing guard does.

### m3. The relay sign-in screen opens only to show a refusal, with nothing to do on it

Evidence: plan 8.3 (line 498): the relay screen "opens only to show a refusal, with ... no Other user, Switch user or Password field".

Problem: a whole screen with no action, which the player then has to close. For a saved connection the refusal screen is useful (the Password field is there), but for an invite it is a needless step.

Fix: for `assist_invite`, show the refusal as a toast from wherever Connect ran (`kindRefused`: "{host} does not allow remote assistance."; `ended`: as 8.5), and drop the relay sign-in screen.

### m4. The keyring failure line names only saved connections, the keyboard wait has no cap, and a double failure has no line

Evidence: plan 8.1 (line 448): "Your saved connections could not be loaded."; "the keyboard screen ... waits for `/login_accounts` and `/keyring`", with no cap named. Plan 5.2 (line 234) gives separate lines for a failed `/login_accounts` and a failed `/capture_secrets`, but none for both failing.

Problem: the keyring also holds found passwords and invites, and at the keyboard only password entries show, so "saved connections" names something the screen does not show. With no cap, a slow `/keyring` holds the keyboard screen shut. Two failures give two lines in a one-line message slot.

Fix: "Your keyring could not be loaded." Apply the 3 s cap and the late redraw at the keyboard too. When more than one list fails, show one line: "<host>'s sign-in details could not all be loaded. Choose Other user to type a name."

### m5. After R4's Switch user, R5a and R6 need Lena's desktop again, and the beats do not say how

Evidence: plan 9.1 R4 (line 601) replaces the HB-FIN-02 session with Jake's (one slot per PC, line 182). R5a "Take SV-OPS-01.rdp" and R6 "Read door_code.txt" (lines 602, 604) use files on Lena's desktop (line 567). `sessionHeld` (line 317) is false once Jake holds the slot.

Problem: a tester following the beats in order finds Jake's desktop, not Lena's.

Fix: state the run order (as `test_access_networks` does with Runs A to C), and add "Connect the .rdp again (Lena replaces Jake)" before R5a, or move R5a and the PIN read before R4.

### m6. `test_access_keyring` cannot be "validator-clean": `ops_rdp` warns by design

Evidence: plan 6.4 (line 353): "created here and validator-clean". Plan 6.3 (line 337): warning "a credential no machine accepts". `ops_rdp` targets `ops_pc` under `pw_only` (lines 566, 578).

Fix: say "no errors", and list the expected warnings (this one, and any lockout warning) as `test_access_networks`' PLAYTEST does.

### m7. A Connect refusal "with the account chosen" fails for `LOGIN_NOT_PERMITTED`, and `wrongPc` cannot come from Connect

Evidence: plan 8.2 step 7 (line 475) opens the target's screen "with the account and credential chosen" on `LOGIN_NOT_PERMITTED` or `wrongPc`. Line 230: under picker `accounts`, an account the PC does not list is left out. Connect always posts to `connectsTo`, so `wrongPc` cannot occur.

Fix: for `LOGIN_NOT_PERMITTED`, toast "{displayName} can't sign in on {host}." without opening the screen, and remove `wrongPc` from Connect's list.

### m8. Section 1.1 misses four changes from the explainer

Evidence: the explainer (q92) says `typed` "asks first and shows nothing"; plan 5.2 (line 232) shows captured tiles under `typed`. The explainer's flowchart refuses every failed check "as an unknown credential"; plan 7 steps 3 and 5 to 8 (lines 375-380) give specific refusals. The explainer's machine accounts are a top-level `accounts` block; D3 (line 672) renames it `machineAccounts`. The explainer ends the invite only through Jake's ink; plan 9.1 (line 581) adds a 40 s timer.

Fix: add the four rows to the 1.1 table with their reasons, so they reach the picks page.

### m9. The teaching lines do not all name the control, as D7 claims

Evidence: D7 (line 716): "The teaching lines name the control as well as the risk." 8.5 (lines 522-523): the password-in-a-file and saved_connection teach lines name only the risk. Plan 5.2 (line 234): the NLA line "<host> lists no accounts until you sign in." never names the control, though the explainer sells `typed` as teaching Network Level Authentication.

Fix: add the control to each: "... Keep passwords in a password manager, not a file."; "... A policy that always asks for the password stops it."; "<host> asks for a password before it shows any accounts (Network Level Authentication)."

### m10. The assist teaching line puts one scenario's pretext and pronoun into the engine's text table

Evidence: plan 8.5 (line 524): "{displayName} let you into his session because you said you were the helpdesk." The table is keyed by kind (line 518), with only `{displayName}`, `{host}` and `{label}` as fields. The relay alternative (line 537) is neutral.

Problem: any later invite from a woman, or won by another pretext, reads wrong, and the author cannot change it from the scenario.

Fix: use neutral engine text ("{displayName} let you into their session. Check who is asking before you share access.") and allow an optional `teach` string on the registry entry, sent on its keyring entry, for scenario-specific wording.

### m11. K0 leaves text that names the removed heading, and misses one changed screen in the re-runs

Evidence: `2b0:test_access_networks/scenario.json.erb:295`: the capture card reads "Her tile then shows under Captured sign-ins on a remote sign-in screen." `2b0:lab_physical_pentest/PLAYTEST.md:1028,1033` names the **Captured sign-ins** list. `2b0:test_access_networks/PLAYTEST.md:182` (P6): "the remote sign-in screen with no tiles". `bench_pc` (`2b0:...scenario.json.erb:643-650`, default picker, `staff`) gains three PC tiles over the network in N14. Plan 5.4 and 9.2 (lines 255, 616) list none of these; 5.5 re-runs only P5 and P8.

Fix: add the card text, the lab PLAYTEST lines, P6 and N14 to K0's update list, and re-run N14.

### m12. The x2 worst case asks for a scroller where the plan says nothing scrolls

Evidence: plan 8.1 (line 450): the six-account tile row "with the pixel scrollbar and 'More below' cue where the row scrolls". Line 451 and plan 2 (line 64): at 1400x1000 the screen is the x2 560x350 layout "where nothing scrolls". Seven tiles of 104px wrap to two rows, each about 125px with the tag line.

Fix: say what happens at x2. Either the row scrolls there (and the rule is relaxed for the tile row only), or tiles drop the username line at x2 when more than five show. Prove the chosen layout at 1400x1000.

### m13. K0 changes the shipped lab's screens on main before D1 is picked

Evidence: plan 1 (line 16): each slice is merged before the next starts. Plan 13 (line 643): decisions go on the picks page "before K1 starts". D1 (line 653): "K0 builds with (a) and can flip". 9.2 (line 616): the lab's remote screens change under either answer.

Fix: hold K0's merge until D1 (with its lab sub-question) is picked, or put the picks page between K0's live proof and its merge.

### m14. D4 and D7 evidence does not show every option and state the user is asked to approve

Evidence: D4 (lines 681, 690): option (b), a Keyring inventory item, has no mock; the mocks list (line 645) has none. D7 (line 718): evidence is mocks m1, m2 and m4, but the toasts (find, teaching, Connect's seven outcomes, ended) and the K3a failure line have no shot or mock.

Fix: add m8, the Keyring item in the tray with its toast, and m9, one sheet of each toast as drawn by `gameAlert` at 1400x1000 and 390x844, with the D7 alternative beside each.

## n

### n1. Wrong file cited for `REMOTE_OFF_TEXT`

Evidence: plan 2 (line 63) cites `network-links.js:59-68`. It is `network-view-minigame.js:59`; `network-links.js:64-68` holds the two message helpers.

Fix: cite both files.

### n2. "+1" is literal, and K0 tests a two-tag limit with one kind

Evidence: plan 5.2 (line 235) "at most two per tile and then '+1'"; four kinds exist (line 443). K0 has only "Captured" (line 229), yet 5.4 (line 250) tests the two-tag limit.

Fix: "+N", and move the two-tag test to K3a.

### n3. SV-OPS-01 stands in the Comms room, so its keyboard bypasses R5a's network path

Evidence: plan 9.1 (line 566): `ops_pc` "in a rack" in Comms, picker by default `accounts`, `roles: ["it"]`. With `credentials` declared, the keyboard shows Ian's captured password filled (line 238).

Fix: none needed for a test scenario. If R5a is meant to show the pivot, mark the rack `headless` or note that the keyboard path also works.
