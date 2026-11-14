Counts: B 2, M 8, m 13, n 3

# Credential keyring plan: review round 3 (UX and game design)

Reviewer: fresh, UX and game design side. Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` at 71323e381 (sections 1 to 14; Appendix A and the earlier reviews not read). Design baseline: the q92 explainer (option 3). K0 base: `build/ux-slice2b0` at c0c274522.

## What I checked

- Every beat of `test_access_keyring` (9.1, R1 to R11) against the rooms, connections, locks, accounts, access lists, earned secrets, NPC placement and the ink gift path, and against the engine's account and capture rules (`game.rb` `account_npcs`, `login_account_tiles`; `revealSecret`; the pivot rule in `README_scenario_design.md`).
- K0's effect on `test_access_networks` (its scenario and PLAYTEST.md at c0c274522) and on `lab_physical_pentest` (LW-OPEN-07, LW-HOT-01, LW-DOOR01), plus which other shipped scenarios have footholds.
- The 2b0 sign-in screen code (`password-minigame.js` sign-in mode, `password-minigame.css`, `unlock-system.js` `openRemoteSignInScreen`, `utils/pc-monitor.js` sizing) against K0 and K3a's layout claims at 1400x1000, 390x844, 915x412 and 800x600.
- Every player-facing state and string in 5.2, 8.1 to 8.3 and 8.5 against the strings the engine already shows for the same state (`network-links.js`, `container-minigame.js`).
- Connect, the relay and the find toasts from the tray, the network view and a desktop.
- Section 1.1 against the explainer, and D1 to D7 for options, a recommendation and buildable evidence.
- The standing UI rules (pixel-art UI, X closes, the frame wraps content, one look per concept, headshots, NPC speech in scenario files).

## B: a beat cannot be played, or the plan cannot be built as written

### B1. R5: Ian's password has no source in `test_access_keyring`

Evidence: plan 9.1 line 534 ("`revealSecret` off"); line 571 (Earned secrets: "Ian's password | capture card plus drop box | SV-OPS-01 over the network (R5)"); line 580 (R5: "Ian's captured password still works"). In 2b0 a captured tile fills the password only when the server served it (`password-minigame.js` c0c274522 lines 1758-1772, `fillCapturedSignIn`), and the server serves it only under `revealSecret` (plan 6.2 line 298). The capture card text in the scenario this copies gives no password (`test_access_networks/scenario.json.erb` c0c274522 lines 301-307), and that scenario's PLAYTEST says so (PLAYTEST.md line 59 onwards: "this scenario does not reveal captured secrets, so the password is still typed from its earned source"). There, Ian's password came from the handover note in the finance share; `test_access_keyring` has no such note.

Problem: with `revealSecret` off, the Ian tile on SV-OPS-01 picks the account and leaves the password blank, and nothing in the scenario holds Ian's password. The second half of R5 ("Ian's captured password still works", the proof that `password` is always accepted beside a refused kind) cannot be played.

Fix: either set `social.captures.revealSecret: true` in `test_access_keyring` (it then also proves the "fills when served" path K3a describes on line 428), or add an earned source for Ian's password (a file on Lena's desktop or in a share Lena's account maps) and list it in the Earned secrets table. The first is smaller and exercises more of K3a.

### B2. R7: Jake cannot end the invite while the relay desktop is open

Evidence: plan 9.1 line 560 ("A later visit, after the player has used the invite, lets him grow suspicious and sets `jake_ended_assist`"); line 582 (R7: "Jake grows suspicious while the relay desktop is open: it closes with 'Jake ended the remote assist.'"); 8.3 line 483 (an open relay desktop closes on `endedRelayPcIds`).

Problem: a "visit" is a person-chat conversation, which is itself a minigame. The relay desktop is a minigame too, and only one is open at a time, so by the time Jake's ink sets the global the desktop has already been closed by the player walking up to talk. The path R7 and K3c's live proof name (an open relay desktop closed by the sync answer) cannot be reached in play, only "Connect says the same" afterwards.

Fix: make the end independent of a conversation. For example, Jake's `eventMappings` on `pc_desktop_opened` for `jake_pc` with the relay route arm a short timer (an NPC `timers` entry, as implants use) that sets `jake_ended_assist`, with a bark line in Jake's NPC JSON ("Hang on, the helpdesk never calls me back..."), so the sync that carries the global arrives while the desktop is open. Keep the ink visit as the second way to end it, and write R7 as two beats: R7a, the timer while the desktop is open; R7b, the ink end and then Connect's "ended" toast.

## M: a real gap the builder or player would hit, or a rule broken

### M1. K0 leaves the remote screen's empty, slow and failed states undefined once the heading goes

Evidence: plan 5.2 line 216 ("stays in 2b0's loading state ... until both answer"); line 217 ("The 'Captured sign-ins' heading goes"); line 220 (typed line: "This PC lists no accounts until you sign in. Your captured sign-ins are above."). At c0c274522: `unlock-system.js` line 369 `REMOTE_CAPTURES_WAIT_MS = 3000` and the cap in `openRemoteSignInScreen` (it calls `setCapturedSignIns([], { pending: true })` after 3 s); `password-minigame.js` lines 1712-1720, three lines that start with the heading: "Captured sign-ins: still checking.", "Captured sign-ins could not be loaded.", "Captured sign-ins: none yet.", placed below the form by `placeCapturedBlock` (lines 1584-1596).

Problem: the plan removes the heading but not the three lines that begin with it, and does not say what happens to the 3 s cap now that two requests are pending. Then:
- With the cap, the screen leaves "Checking..." after 3 s while `/login_accounts` may still be pending, so a tiles screen can show the typed form and then redraw with tiles under the player's cursor. 2b0's R1 M2 fixed exactly this for one request.
- On a tiles screen with no captures, "Captured sign-ins: none yet." under the form describes a heading that no longer exists.
- On a typed or headless screen with no captures, the new line says "Your captured sign-ins are above" when nothing is above.
- A failed `/login_accounts` with a working `/capture_secrets` shows captured tiles on a `tiles` PC with no PC tiles and no message, so it looks like a typed screen.

Fix: in 5.2, state one rule for both requests: one cap for the pair, and after it a single "still checking" line that the late answer replaces in place without moving focus (2b0's `quiet` redraw). Give one string per state, with no heading prefix: loading "Checking..."; no captures on a tiles screen, no line; typed with captures, the NLA line; typed with none, "This PC lists no accounts until you sign in." alone; `/login_accounts` failed, "This PC's account list could not be loaded. Choose Other user to type a name."; `/capture_secrets` failed, "Your captured sign-ins could not be loaded." Add each to 8.5's table and to K0's JS tests (line 235 tests only "the loading state with both requests pending; a failed `/login_accounts`").

### M2. The plan misstates what K0 changes in `lab_physical_pentest`, and the NLA line misteaches on its door controller

Evidence: plan 9.2 line 592 ("under D1's lab answer (ii), a policy ... keeps today's look. LW-DOOR01 (headless) is unchanged either way"); D1 line 625 (recommend (ii) because the lab "was playtested with typed screens"); 5.2 lines 217 and 220 (the heading goes everywhere; the typed line goes on every typed and headless screen). Lab: `lab_physical_pentest/scenario.json.erb` lines 2296-2311 (`store_controller`, LW-DOOR01, `headless: true`, "no screen and no keyboard. It is run from its web page"); line 858 (the beat signs in there with Chris's captured password).

Problem: under both (i) and (ii), K0 changes every remote screen in the lab. The "Captured sign-ins" heading goes, captured tiles gain a "Captured" tag, and the typed line appears. So (ii) does not keep today's look, and LW-DOOR01 is not unchanged. On LW-DOOR01 the line "This PC lists no accounts until you sign in" is wrong twice over: it is a door controller's web page, not a PC, and it lists nothing because it is a web sign-in, not because of Network Level Authentication. A student on a physical pentest lab would learn a control the lab never set up. The user is deciding D1's lab question on the claim that (ii) changes nothing, and the lab is played on Hacktivity.

Fix: correct 9.2 and D1 to say what changes in the lab under each answer, and add the K0 before and after shots of LW-DOOR01 to D1's lab evidence (line 629). Show the NLA line only under an explicit `remoteScreen: "typed"` policy. A headless host (and a PC whose picker is `false`) gets a neutral line, or none: "Type the account's name and password." Name the device by its host ("LW-DOOR01"), not "This PC".

### M3. The layout proofs leave out the tightest screen, and tags have no size rules

Evidence: plan 8.1 lines 432-434 (worst cases: the tile row at the four sizes; the chosen line "at 915x412 and 800x600"); 8.1 line 426 (tags under the name); 5.2 line 221 (badge only at 915x412). `utils/pc-monitor.js` c0c274522 lines 15-17, 37 and 133: the content is drawn on a 560x350 base at a whole scale, x2 once the screen has room, which 1400x1000 has (screen 1120x700). `password-minigame.css` c0c274522 lines 1270-1279: "At x2 too: the screen is then a 560x350 layout, where the tiles, the form and a message ran 47px past the bottom (R2 M1, nothing scrolls at x2)". Tile widths: `.signin-tile` 104px (line 778), 84px compact (lines 1069 and 1312).

Problem:
- At 1400x1000 the screen is the same 560x350 layout as the smallest landscape case. K3a's chosen line adds a credential button, its teaching line, a greyed refused button and its reason, and the error line on top of the field, Sign in and Change. The plan proves that line only at 915x412 and 800x600, and not at 1400x1000 or 390x844.
- Tags are text under the name in a 84 or 104px tile. "Saved connection" or a `foundIn` file name (author text with no length limit; the example is "passwords.txt", a real mission might use "Q3_reconciliation_passwords.xlsx") does not fit one line. The plan does not say how tags wrap or truncate, how many one tile may carry (Lena in R2 to R5 carries "Captured" and "Saved connection"), or the font and size. Taller tiles change the row height the 2b0 fold rules were measured for.

Fix: name all four sizes for both worst cases, and for 1400x1000 state that the x2 layout must show the first credential button and Sign in without scrolling. Specify tags: pixel font at its grid size (Press Start 2P 8px, or GNF), at most two per tile and then "+1"; file names cut to the tile width with an ellipsis, the full name in the title and on the chosen line. Add a fixture with a 32-character file name to `pc-monitor-frame.test.mjs`.

### M4. One state, several phrasings: off, unreachable and remote sign-in off

Evidence: plan 8.2 lines 455-457 and 8.5 lines 512-514 ("HB-FIN-03 is off.", "Remote sign-in is off on HB-FIN-02.", "HB-FIN-02 can't be reached. You need a way onto its network."); 5.2 line 216 (K0 uses "the view's own strings ... and 'Remote sign-in is off on this PC'"). The engine today: `network-links.js` c0c274522 lines 66-68 (`"<host> can't be reached over this link."`; `"<host> is not responding."`, commented "the same words as its row in the view"); line 59 `REMOTE_OFF_TEXT = 'Remote sign-in off'`; `container-minigame.js` lines 116 and 610-611 ("This PC is off." at the keyboard, "not responding" remotely, by design).

Problem: over the network the engine deliberately says "not responding", because a remote player cannot see that the machine is off. Connect is also a network action, but says "is off", which tells the player more than the view does and gives the same state a second name. Unreachable gets a second sentence, and remote sign-in off has three forms ("Remote sign-in off", "Remote sign-in is off on this PC", "Remote sign-in is off on HB-FIN-02."). This breaks the one-look-per-concept rule and the brief's "one phrasing per state".

Fix: in 8.5, reuse the engine's helpers for Connect and K0: `notRespondingMessage(host)` for off on every remote route (the relay included), `unreachableMessage(host)` for no route (adding the teaching half if wanted, but in the helper so the view gets it too), and one remote-off sentence built on `REMOTE_OFF_TEXT`. Drop "This PC is off." from Connect.

### M5. Decisions D2, D4, D6 and D7 cite evidence that only exists after the slices they gate

Evidence: plan 13 line 618 ("Shots are taken from the slice's live proof"); D2 lines 637 and 641 (blocks K1 and K2; shots from K3a and K3c); D4 lines 656 and 658 (blocks K3b's wording; shots include "the tray item's `[Connect, Examine]` menu", which is K3b); D6 lines 676 and 680 (blocks K4; shots of R10, which is K4); D7 lines 686-687 ("from the K3a to K3c live proofs, or mocks before they exist"); D5 line 670 (dungeon graph "as credential nodes", which the graph draws only after K1).

Problem: the picks page has to be built before K1, but four decisions point at screenshots from K3a, K3b, K3c or K4. Only D7 mentions mocks, and it does not say who makes them or from what. A picks-page builder cannot produce D2's, D4's or D6's evidence as listed.

Fix: add a line to 13 saying that before K1, every K3 or K4 shot is a static mock built from the K0 screen's real CSS (one HTML file per state, captured at the named sizes), and list the mocks: the chosen line with each kind's tag and button, the greyed refused credential, the tray menu, the relay desktop bar, R10's "Remote sign-in from HB-DESK-01" header and the desktop's Connect beside Take. For D5, a hand-drawn Mermaid diagram of the credential nodes in place of the K1 graph.

### M6. Section 1.1 misses several changes from the explainer

Evidence: the explainer, against plan 1.1 lines 24-38:
- The explainer says every route after sign-in, reach included, is unchanged for a credential session (section 5, and the flowchart's "S -->|networkLinks| V"). The plan's relay session never extends reach, is not in the network view and ends on reload (3.7 line 169, 14 line 701). Not in 1.1.
- The explainer gives the invite through "a declared grant" (`give_item` action, section 4). The plan uses the ink `#give_item` from Jake's `itemsHeld` and warns against a grant (6.3 line 324, 9.1 line 560). Not in 1.1.
- The explainer lists "Jake Brooks: password (from passwords.txt)" as soon as the session proof holds. The plan holds the tag back until the file is opened (8.1 line 427). Not in 1.1.
- The explainer's refusal wording "This PC does not allow saved passwords" becomes 8.5 line 507. Only covered by D7.
- The explainer sends keyring changes "as deltas in the answers that change it". The plan uses a separate GET /keyring with a `rev` digest, asked after triggers (6.2, 8.2 line 460). Not in 1.1.
- The explainer's worked pivot switches user on HB-FIN-02 to Jake. The plan's scenario uses Jake's password at his own keyboard (R4), so the second half of the pivot (Jake's shares through HB-FIN-02) is never played. Not in 1.1, and D6's evidence (line 678) cites "the explainer's pivot sequence" as if the scenario carried it.

Problem: the user decided from the explainer, and 1.1 says each change "is shown on the picks page". These would reach the user only by reading the whole plan.

Fix: add a row to 1.1 for each, with its reason. For the pivot, either give `lena_pc` an access list that admits Jake (so R4 can be Switch user on HB-FIN-02, as in the explainer's mock 4), or add the row and say why the scenario differs.

### M7. R6's "no pivot from the relay" check proves nothing as sequenced

Evidence: plan 9.1 line 581 (R6: "the network view gains no host from it"); 7.4 line 392 ("a relay at Jake's PC with the network view open (no pivot to `server_lan` from it)"); README_scenario_design.md line 964 ("any session at a sign-in host on a network already reached (a remote sign-in through the foothold, or a claim or sign-in at the keyboard) opens every network linked to that host's network"). By R6 the player holds Sam's keyboard session (R1) and Lena's .rdp session (R2), both on `office_lan`, which is linked to `server_lan` (9.1 line 536). Finance, where Jake stands, opens only with the PIN from Lena's desktop (line 547).

Problem: `server_lan` is already in the view through Sam's or Lena's session before the relay starts, so "gains no host" passes whether or not `reach_session_hosts` skips relay sessions. The only beat meant to show that a relay grants no reach does not test it.

Fix: in R6, before Connect, sign out at HB-DESK-01 and HB-FIN-02 (Finance is already open) and check the drop box view lists `office_lan` only. Then Connect the invite and check it still lists `office_lan` only. Put the same order in 7.4's tampered-client call and in K3c's live proof.

### M8. Sam and Lena are "not placed", but an account must be a room NPC

Evidence: plan 3.1 line 64 ("Unchanged: a room NPC with `creds`"); 9.1 lines 553-554 (Sam "not placed (his PC only)", Lena "away, not placed"). `game.rb` c0c274522 lines 1896-1897 (`account_npcs` reads `scenario_room_npcs`) and lines 1594-1600 (only `rooms.*.npcs`). Plan 4 line 192 requires "authored headshots for every account".

Problem: read literally, Sam and Lena have no accounts. Sam's sticky note would not sign in (R1), and the validator would refuse `lena_rdp` ("`account` not an account holder", 6.3 line 312). Read loosely, the builder has to invent a way to have an account holder who is absent from the map, and the plan names none.

Fix: put both in a room's `npcs` with a sprite and talk portrait (the cast-diversity rule applies). Sam in the Office at his desk is the simplest. For Lena "away", place her in a side room the player cannot enter (a locked "Meeting room" off Finance with no way in) and say so, so her PC is free and her tile has a headshot.

## m: smaller issues

### m1. K0's PLAYTEST updates for `test_access_networks` are incomplete

Evidence: plan 5.4 line 240 ("P5, P8 and the P3 script updated"). PLAYTEST.md c0c274522: line 59 (selector `.signin-captured-tile[data-target-id="lena"]`, which K0's single row removes); line 104 (Run 0 step 5 lists four hosts in order); lines 363-371 (expected validator output: identity reach and "Reachable without a foothold" both change with two new PCs in the open desk room); P3 line 147 (HB-DESK-01 shows **Open** after P1, so P5b's remote screen of Sam's PC needs Run B or C, or Switch user from the opened desktop).

Fix: list these four in 5.4. Give the new tile selector (for example `.signin-tile[data-npc-id="lena"] .signin-tag`). Say P5b runs in Run B, or goes through Open and then Switch user in Run A.

### m2. The `foundIn` tag after a reload contradicts its own rule

Evidence: plan 8.1 line 427 ("after a reload the tag shows at once (the player has played past the find)"); `jake_pw_note`'s proof is `session: lena_pc` (9.1 line 558), which holds from R2, before the file is opened.

Problem: reload between R2 and R3 and Jake's tile shows "passwords.txt" before the player has opened the file. Because the baseline after bootstrap gives no toast, the toast never comes either. The player has not "played past the find".

Fix: either accept it and say so plainly in 8.1 ("a reload shows the tag; the toast is skipped"), or make the tag wait on a server record of the file being opened if one exists (a read event the server keeps), and name it.

### m3. The short-window badge is too small to read and merges all kinds

Evidence: plan 5.2 line 221 ("an 8x8 CSS px pixel glyph with a 2px border"); 8.1 line 426 ("In the short window, the K0 badge").

Problem: an 8x8 box with a 2px border leaves 4x4 px for the glyph. At 915x412 the player cannot tell a captured account from one with a saved connection, or an account with nothing, until they choose it.

Fix: a 12x12 badge (8x8 glyph inside a 2px border) at the tile's corner, one glyph per kind group (key for a password, plug for a connecting kind), with the full tag text as the tile's title and on the chosen line.

### m4. The refusal reason in the short window, and twice on Connect's refusal screen

Evidence: plan 8.1 lines 428-429 (greyed button "with the refused text under it"; "In the short window the line is not shown on the screen"); 8.2 line 458 (Connect's refusal opens the screen "with the refusal in its error line").

Problem: it is unclear whether the refused text counts as "the line" hidden in the short window. If so, the greyed button has no reason. When Connect opens the screen for `kindRefused`, the same sentence shows under the greyed button and again in the error line.

Fix: the refused reason always shows (it replaces the teaching line in the short window), and Connect's refusal screen leaves the error line empty when the reason is already under the button.

### m5. Two verbs for one action

Evidence: plan 8.2 line 451 ("Connect" in the tray); 8.1 line 428 ("Use HB-FIN-02.rdp" on the screen); K4 line 526 ("Connect beside Take").

Fix: one verb everywhere. "Connect" suits a saved connection and an invite and matches the tray and desktop, so the screen button would be "Connect with HB-FIN-02.rdp".

### m6. Tags mix kinds and file names, and do not share a casing

Evidence: plan 1.1 line 26 and 8.1 line 426 ("per-kind tags ... one casing: 'Captured', 'passwords.txt', 'Saved connection', 'Remote assist'").

Problem: "passwords.txt" is a file name, not a kind, and lower case. The others are kinds in sentence case. A second found file for another account produces a different tag for the same kind.

Fix: tag by kind ("Found in a file"), with the file name on the chosen line ("Password in passwords.txt: type it from the file").

### m7. Connect opens a held session's desktop before checking power

Evidence: plan 8.2 lines 454-455 (step 3 `sessionHeld` opens the desktop; step 4 `targetOff` after).

Problem: with a held .rdp session and the PC switched off, Connect opens a desktop that the server refuses (403), not the off message.

Fix: check `targetOff` before `sessionHeld`, as the view greys a held row when its host is off.

### m8. Connect from the tray while another screen is open is not specified

Evidence: plan 8.2 line 459 ("Connect starts no network-view trip, so closing ... returns to the world, or to the opener given as `returnTo`"); `inventory-menu.js` line 184 (the tray menu already checks `MinigameFramework.currentMinigame`); K4 line 526 (Connect from a desktop).

Problem: the plan does not say whether the tray's Connect works while the network view or a desktop is open, or where the X on the opened desktop returns to when Connect came from Sam's desktop (K4).

Fix: state it: from the tray, Connect only with no minigame open (otherwise a toast saying to close the screen first, or the menu entry disabled with a reason). From a desktop, `returnTo` is that desktop, so the X on Lena's desktop goes back to Sam's.

### m9. The holder-displacement rule cannot be shown in play

Evidence: plan 8.3 line 484 and 7.2 line 382 (Jake sitting down does not end the relay); 9.1 line 555 (Jake "never sits").

Fix: let Jake sit at his PC during the relay window in one beat, or say the rule is proved by unit test only (8.3 line 488) and drop it from the live proof wording.

### m10. The helpdesk pretext is face to face, but the lesson is about calls

Evidence: plan 9.1 lines 547 and 560 (Jake standing in Finance; "Posing as the helpdesk"); 8.5 line 506 ("Helpdesks call back on a known number first").

Problem: a stranger in the finance room claiming to be the helpdesk, with Jake reading out a code face to face, does not match the call-back control the teaching line names.

Fix: run Jake's invite conversation as a phone contact (the phone NPC path), or change the teaching line to fit an in-person pretext ("Check a visitor's badge with the helpdesk before you hand over access").

### m11. D7 has no options and D4's alternative wording is not written

Evidence: plan D7 lines 682-687 ("Approve or reword"); D4 line 660 ("the find toasts as worded under (c) and as worded under (a), (b) or (d)"); 8.2 line 465 (only "New on your keyring" and "name the view").

Fix: give D7 at least one alternative wording for each line a reviewer could dispute (the three teaching lines and the refused lines), and write D4's toast wording out in full for (a), (b) and (d), so the picks page can show both side by side.

### m12. Captured accounts look different at the keyboard depending on the scenario

Evidence: plan 5.2 line 223 (keyboard screens show no captures "in any later slice of a scenario without `credentials`"); 8.1 line 424 (in a scenario with `credentials`, the keyboard screen shows password entries, which include captured ones); 14 line 691.

Problem: the same captured account carries a "Captured" tag at HB-FIN-03's keyboard in `test_access_keyring` and none at HB-DESK-01's keyboard in `test_access_networks`.

Fix: decide one rule (I would show captured tags at the keyboard only once a scenario opts in, and say so in 14 and the README), and show it on the picks page under D1 or D4.

### m13. D1 (i) for the lab: one-click sign-in to Melanie's own PC

Evidence: `lab_physical_pentest/scenario.json.erb` lines 1905-1908 (comment: the beat at LW-OPEN-07 "stays her unlocked session; captured passwords are used at hot_desk_pc") and line 187 (scope: her password "may be used at the hot desk"); plan 9.2 line 592 (under (i) LW-OPEN-07 shows her tile "with captured passwords filling").

Problem: under (i), the drop box view offers Melanie's tile on LW-OPEN-07 with her password already filled. That is a one-click remote sign-in to her own PC, which the lab's scope text points away from.

Fix: add this to D1's trade-off and evidence, so the user weighs it when answering the lab sub-question.

## n: nits

### n1. Unaffected scenarios are not named

Evidence: plan 9.2 lines 590-595. Only `test_access_networks` and `lab_physical_pentest` have jacks or implants (`grep networkJack|wifiAp|grant_foothold` over `scenarios/*/scenario.json.erb`).

Fix: one line saying m01 to m10, `lab_social_engineering` and the other test scenarios have no foothold, so K0 changes nothing there.

### n2. The assist code goes by three names

Evidence: plan 3.4 line 121 (item "Remote assist code (Jake)"); 8.2 line 462 (toast "Jake's remote assist code"); `chat-helpers.js` line 141 (the gift toast "📦 Received: <item name>", with an emoji, outside pixel-font rules).

Fix: use the item's name in the find toast, and note the gift toast's emoji in the backlog or strip it while K3b touches toasts.

### n3. Teaching lines name Lena and Jake directly

Evidence: plan 8.5 lines 505-506 ("signs you in as Lena", "Jake let you into his session") against line 500 ("Names and hosts come from the entry, never from free text").

Fix: write them as templates (`{displayName}`, `{host}`, `{label}`) in the table, so the builder does not copy the test names.
