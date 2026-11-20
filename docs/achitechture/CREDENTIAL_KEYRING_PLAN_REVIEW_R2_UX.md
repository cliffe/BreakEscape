Counts: B 2, M 8, m 12, n 5

# Credential keyring plan: UX and game-design review, round 2

Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` at 60159ca52. Engine paths are under `public/break_escape/js/`. `2b0:` marks branch `build/ux-slice2b0` (f07908cf2). Scenario line numbers for `test_access_networks` are on 2b0, which is K0's base.

Checked: the plan in full; the q92 explainer; `systems/unlock-system.js:540-690`; `2b0:minigames/password/password-minigame.js` (sign-in mode, 1400-1780); `systems/inventory-menu.js`; `systems/inventory.js:935-955`; `systems/interactions.js:1000-1040, 1890-1915`; `systems/pc-sessions.js` (header and readers); `systems/network-links.js:60-70, 655-664`; `minigames/container/container-minigame.js:20-30, 940-960`; `minigames/network-view/network-view-minigame.js:300-315`; `games_controller.rb:1359-1387`; `game.rb:2079, 2408`; `lib/break_escape/access_identities.rb:64`; `2b0:scenarios/test_access_networks/scenario.json.erb` and `PLAYTEST.md`; `scenarios/lab_physical_pentest/scenario.json.erb` (networks and sign-in PCs only); `README_scenario_design.md` on networks, captures, declared grants and ink `#give_item`. The explainer's five open questions are all carried (Q1 to D1, Q2 to D2, Q3 to D3, Q4 to D4, Q5 to D5).

## Blockers

### B1. K0 closes every remote screen on a headless host, so P8 and the physical lab's door controller break (5.1 step 2, 5.2)

Evidence: plan 5.1 step 2 "Headless: 403" in the new foothold branch; plan 5.2 "A 403 or 422 closes the screen with the view's own strings". Today's keyboard branch already 403s a headless PC (`games_controller.rb:1369-1372`). Headless hosts are signed in to only over the network: `door_box` (`2b0:test_access_networks/scenario.json.erb:903`, beat P8) and `LW-DOOR01` in `lab_physical_pentest/scenario.json.erb:2309-2311`, the lab's door-controller chain.

Problem: as written, opening HB-DOOR-01 from the view fetches `/login_accounts?foothold=`, gets 403 and the screen closes with "can't be reached". P8 and the lab's chain become dead ends. The live proof's "Re-run P5 and P8" would catch it, but the plan text tells the builder to build it this way.

Fix: for a headless host with a held, reaching foothold, answer 200 `{ pc_id, remoteScreen: "typed", loginAccounts: [] }` (a headless host shows no tiles, README 951), and keep 403 only for the no-foothold case. Add "headless over a foothold: 200, no tiles" to `network_remote_tiles_test.rb` and to `access-remote-signin.test.mjs`, and name HB-DOOR-01 in 5.5's live proof.

### B2. The assist code as a `notes` item never reaches the tray, so Connect, relay, R6, R7 and R8 cannot be played (3.4, 8.2, 9.1)

Evidence: plan 3.4 "`notes` for a written assist code"; 8.2 Connect is a tray action (`inventoryMenuFor`). `systems/inventory.js:946-951`: notes-family items "belong in the notepad, not the inventory UI" and return before a slot is made; `systems/interactions.js:1910-1913` says the same ("never to inventory UI").

Problem: Jake's code goes into the Notepad, not the tray. There is nothing to click Connect on, so the whole `assist_invite` kind has no entry point in phase 1. The validator check "a `held` item that is not takeable and is given by no declared grant..." passes, so nothing flags it.

Fix: give credential items a type that takes a tray slot (`text_file`, as for the .rdp, named "Remote assist code (Jake)" with observations). Add a K1 validator error: an item with `credential` whose type is notes-family. Add a K3b unit test that the code's tray slot exists and offers Connect.

## Major

### M1. K0's two new PCs in `test_access_networks`: no IT room, P3 breaks, the `nla` policy is missing, P5b is wrong (5.4)

Evidence: 2b0's rooms are lobby, comms_room, server_room, workshop, desk_room, finance_office, kiosk_room and store; there is no IT room (Ian stands in the lobby, `scenario.json.erb:401-418`). P3 completes on an exact host list, `data.hostList === 'door_box,kiosk_pc,lena_pc,sam_pc'` (`:339`), and PLAYTEST P3 says "all four hosts"; `hostList` is every office_lan host id joined (`network-view-minigame.js:304-306`), so `it_pc` and `ops_pc` stop `p3_see` completing. `policies` holds only `hardened`, `counted` and `kiosk_locked` (`:142-146`). Sam's PC is `access: { roles: ["staff"] }` (`:738`), and every account holder has the implicit staff role (`access_identities.rb:64`), so over the network it lists Sam, Lena and Ian, and after the lobby cards Lena and Ian are tagged; P5b's "no tag" holds only before the cards.

Fix: name the room (`desk_room`, or a new room with its connection and sign); change `p3_see` to the six-host list and PLAYTEST P3 to match; add `"nla": { "remote": "allowed", "remoteScreen": "typed" }`; reword P5b to "Sam's PC lists Sam, Lena and Ian; untagged before the cards, Lena and Ian tagged after".

### M2. K0 changes the shipped `lab_physical_pentest`, which the plan says it leaves alone (1, 4, 9.2, D1)

Evidence: plan 1 "Out of scope: any change to ... `lab_physical_pentest`"; 4 "Shipped scenarios unchanged"; 9.2 "Networks scenarios on main: the test scenarios with `networks`". `lab_physical_pentest/scenario.json.erb:92-94` declares `office_lan`; LW-OPEN-07 (`:1895`, default picker, `access: { people: ["pierce"] }`) and LW-HOT-01 (`:1939`, three people) are on it; jacks at `:2497` and `:2526`; `revealSecret: true` at `:78`.

Problem: under the D1 default, the lab's remote screens gain Melanie Pierce's tile on LW-OPEN-07 and three tiles on the hot desk, with captured passwords filling. The lab is played on Hacktivity, and the user has not been asked. D1's evidence ("the list of networks scenarios") would omit it as the plan stands.

Fix: name `lab_physical_pentest` in 9.2 and in D1's evidence with before and after shots of both PCs over the drop box, and put a lab-specific sub-question on D1 ("keep the lab as today with `remoteScreen: "typed"` on its policy, or take the tiles"). Correct section 4's claim.

### M3. `test_access_keyring` as specified cannot be played: missing accounts, connections and earned secrets (9.1)

Evidence: 9.1 names Sam's PC (`access staff`), SV-OPS-01 (`access it`) and "Ian's password, if captured" (R5), but the only people listed are Lena and Jake. R1 and R10 need a session at Sam's keyboard; no Sam account or source for his password is given. `ops_rdp` needs an `account`; with no IT account holder K1's own validator errors ("`account` not an account holder"). No capture route for Ian exists. Rooms have no connections. Finance is "locked with a key found in the comms room, so Lena's keyboard is reachable only after R2", but Comms is unlocked from the start, so the key is reachable before R2. Lena's placement (at her desk or not, `needsHome`) is not stated, which decides whether her PC is "in use" and whether a sitting NPC displaces the player.

Fix: give 9.1 a cast table (Sam, staff, sticky note on his PC; Lena; Jake; Ian, it, with a capture route and proof), a room map with connections, and an "Earned secrets" table as `test_access_networks/PLAYTEST.md:350-358` has. Either gate the finance key on R2 or drop "only after R2".

### M4. The ink path names a declared grant, which is claimable from the first second (9.1, 7.6)

Evidence: 9.1 "one choice gets the code (declared `give_item` of `jake_assist_code`)". README 881: a declared grant is a `give_item` action on a server-run path, "there is no trigger check: a declared grant can be claimed from the first second"; the ink path is the separate `#give_item:<type>:<id>` tag out of the speaking NPC's `itemsHeld`. 7.6 calls every kind "secret-class and hard-enforced".

Problem: an ink choice cannot fire a declared grant, so the builder must pick one. A declared grant makes the `held` proof free to a tampered client, so the invite skips the social engineering beat, against 7.6's table.

Fix: put `jake_assist_code` in Jake's `itemsHeld` and give it with `#give_item:<type>:jake_assist_code` from the helpdesk choice, gated once-only on a global set from the item's `onPickup` (README 1184). Say in 7.6 that the invite's proof is ink-gated and so best-effort under the cheat policy, with the NPC sanity check, and make K1's `held` matcher read the definition from `itemsHeld`.

### M5. Relay mode is a sign-in screen and a desktop built for passwords (8.2, 7)

Evidence: 8.2 Connect opens "the target's remote sign-in screen with the account and the credential chosen" in relay mode; under `remoteScreen: "tiles"` that screen has the PC's tiles, Other user and the Password field (8.1). K2 defines `relay` only on the credential branch (step 4); a typed POST carrying `relay: 1` and no foothold is judged by today's keyboard rules. The desktop's account bar says "Signed in as" and has Switch user and Sign out (`container-minigame.js:951-960`), and its remote line falls back to "Remote session through your link" with no foothold (`:944-947`). `pc-sessions.js` header: when an NPC sits down at a PC, `displaced` ends any player session there.

Problem: on Jake's relay screen a player can pick Lena's tile and type her password; the result is undefined (a keyboard session judged by room reach, or a refusal that makes no sense). On the relay desktop, Switch user offers the same, Sign out reads as signing Jake out, and the account bar claims the player signed in, which contradicts the teaching ("Jake let you into his session"). If Jake sits down, the assist session is "displaced" by its own owner.

Fix: relay Connect goes straight to the desktop when the invite is accepted (one action), and opens a screen only to show a refusal. The relay desktop shows "Using Jake Brooks's session (remote assist)", one Disconnect in place of Switch user and Sign out, and no link line. The server refuses `relay` on the typed branch (test it). Exempt relay sessions from displacement by the account holder.

### M6. Ending the invite (R7) does not reach the client, so Connect opens a dead desktop (7.1, 8.2)

Evidence: 7.1 the sync merge deletes relay sessions server-side; `pc-sessions.js` mirrors sessions only from POST /login, the bootstrap and GET /container (header lines 9-11, 52-55), and nothing in the sync answer is named to update it. 8.2 Connect checks "a session is already held at `connectsTo` through a credential: open its desktop" before `ended`. The global set by Jake's ink reaches the server only at the next PUT /sync_state.

Problem: after R7 the client still holds the relay session; Connect opens Jake's desktop, GET /container answers 403 and the desktop closes with the generic no-session message. "Jake ended the remote assist." never shows. A Connect straight after the conversation may also still succeed, because the global has not synced yet.

Fix: Connect checks `ended` first and takes "session held" from the server (a `sessionHeld` flag on the keyring entry), not from the mirror. The sync answer carries the relay sessions it ended (`endedPcIds`), handled as `linkDropped` is, closing an open relay desktop with "Jake ended the remote assist.". Connect flushes a pending sync before its GET /keyring. Add both to R7's live proof.

### M7. "New on your keyring" names a thing the player can never open (8.2, D4)

Evidence: 8.2 toast "New on your keyring: Jake Brooks, passwords.txt"; D4 recommends (c), no keyring view in phase 1; the word appears nowhere else on screen (tile tags say "captured", "saved connection" and so on).

Problem: a player told something is "on your keyring" looks for a keyring in the inventory and the capture log, finds none and is left unsure what changed or where to use it. A toast should say what the player can now do.

Fix: under D4 (c), word the toast by use: "Saved connection found: HB-FIN-02.rdp signs in as Lena Fox on HB-FIN-02." and "Jake Brooks's password is in passwords.txt." Keep "keyring" only if D4 picks (a), (b) or (d). Put both wordings in D4's evidence so the user sees the dependency.

### M8. Changes from the explainer that the plan does not list (1, 6.2, 7, 8.1, 14)

Evidence and problem: the "Changes from the explainer" list (1) names four changes. These are also changes, and are not listed:
- A registry password is never filled: the player types it from the file (6.2, 14). The explainer's worked example says "Choosing it fills the screen", and its mock 4 shows the field filled.
- A lockout refuses a saved connection (3.6 `honours_lockout`, 7 step 7, 14). The explainer says only the password kind counts and "the other kinds are exact".
- The keyring view: the explainer put "the keyring view (the capture log grown)" in phase 1 scope. D4 adds two options and recommends (c), which is neither of the explainer's two answers to Q4.
- Keyboard screens offer password entries only (8.1, 14). The explainer has "Use from keyring" on every sign-in screen.
- Item type `remote_access` becomes existing types (3.4), and `DEFAULT_ACCEPTS` drops `token` (3.6).
- The first listed change misdescribes the design: there is no "Keyring tag", the tags are per kind, and the button sits on the chosen line, not on the tile.

Fix: add each to section 1 with its one-line reason, and correct the first entry. The first two are behaviour the player meets (type, not fill; a lockout stops a saved file), so show them on the picks page as settled defaults the user can overturn.

## Minor

### m1. The chosen line has no worst case at the short sizes (8.1)
8.1's worst case is six accounts with three tagged, a tile-row case. The taller state is the chosen line: name and Change, Password field, one or two credential buttons each with a teaching line, a greyed refusal with its text, Sign in and the message line. 2b0's R1 measured the plain form at 915x412 with "nothing to spare" (`2b0:docs/achitechture/UX_SLICE2B0_REVIEW_R1.md`, m1). Fix: add a chosen-line worst case (Lena with captured password, the .rdp and a refused kind) at 915x412 and 800x600, with Sign in and the first button in view without scrolling; in the short window put the teaching line after the buttons or leave it to the toast.

### m2. "With one way in, that way is the only control" can hide the Password field (8.1)
For an account whose only keyring entry is a connection, the rule hides the Password field, though `password` is always accepted (3.2) and the player may know it from elsewhere. Fix: always show the Password field and Sign in; the credential buttons sit above it.

### m3. The "passwords.txt" tag shows before the file is opened (8.1, 8.2, R4)
`jake_pw_note`'s session proof holds as soon as the player signs in at Lena's PC, so Jake's tile is tagged "passwords.txt" before the player opens the file, while the toast waits for the open. The tag gives the find away. Fix: apply the same `foundIn` wait to the tag.

### m4. Captured accounts have two looks (5.2, 8.1)
Under `tiles` a capture is a tagged tile with no heading ("Captured"); under `typed` it is 2b0's headed block; K3a's tags are lower case ("captured"). Keyboard screens show captures only in scenarios with `credentials`. Fix: one look for a captured account on every screen (the tag, no heading), one casing, and say plainly that the keyboard screens of other scenarios keep no captures, or bring them in too.

### m5. Under picker `accounts`, extra captured tiles are known refusals (5.2)
"Captured accounts the PC does not list" on an `accounts` PC are accounts the PC does not admit, shown beside the PC's own list; the screen contradicts itself and every such tile is a refusal. Fix: add them only under picker `known` or `false`, or behind a divider headed "Also captured".

### m6. Connect lacks outcomes for an off PC and a blocked remote (8.2)
The keyring's routes ignore power and `remote: "blocked"`, so Connect opens a screen that closes at once on 403 not_responding or 422 remoteBlocked. Fix: carry `off` and `remoteBlocked` on the entry and toast "HB-FIN-03 is off." or "Remote sign-in is off on HB-FIN-02." without opening a screen; test seven outcomes, not five.

### m7. Connect then a one-button screen is a confirm step (8.2)
For an accepted credential with a route, Connect opens a screen whose only meaningful control is "Use HB-FIN-02.rdp", against the rule that one meaningful action acts directly. Fix: sign in directly and show the teaching toast; open the screen only for a refusal (R5) or when the player opens the host from the view.

### m8. K3a's live proof uses K3b features (8.1)
K3a's proof is "beats R1 to R5", but R1's and R3's toasts and R5's Connect arrive in K3b. Fix: K3a proves R2, R4 and the R5 refusal by opening SV-OPS-01 from the view; R1, R3 and R5-by-Connect move to K3b.

### m9. Teaching text gaps and wording (8.4)
No line teaches a password found in a file (the explainer's "credentials left in files"). The invite line names the risk but not the control. "That is the fix for this risk." is stiff. The typed line says the PC shows no accounts above a row of captured tiles. Suggested: found password "People save passwords in files. Anyone who reaches the file has the account."; invite "Jake let you into his session. Nobody checked who was asking. Helpdesks call back on a known number first."; refused "This PC always asks for the password, so a saved one is ignored. That setting is the fix."; typed "This PC lists no accounts until you sign in. Your captured sign-ins are below." Put 8.4 on the picks page as its own item, since it says "for the user to approve" but is not in section 13.

### m10. The short-window badge is undefined in size (5.2, 8.1)
"A 2px corner badge" reads as a 2px dot, invisible on a DPR 3 phone at 915x412. Fix: specify a pixel glyph (for example 8x8 CSS px with a 2px border) and test it at DPR 3.

### m11. Switch user and the view's Open for non-foothold routes (8.2, 9)
`openLoginSignIn` takes only `remote.footholdId` (`unlock-system.js:553-563`), and the view's Open on a host row assumes the foothold route (`network-links.js:660`). A `from` session's Switch user (K4) and the view's Open on a relay or `from` session are not specified. Fix: name both in K3b and K4: Switch user reuses the session's own route, and the view's Open opens the desktop by that route or is not offered.

### m12. README_scenario_design.md is in no slice (4, 5, 6)
README 949 says a host row has "no account tiles" and the view "never shows account names"; K0 changes that, and K1 adds `credentials`, `accepts` and item `credential`. Fix: add the README networks section to K0's files and a credentials section to K1's.

## Nits

- **n1.** Connect's "can't be reached from here. You need a way onto its network." differs from the view's "can't be reached over this link." (`network-links.js:66`). One phrasing for one state.
- **n2.** "This no longer works." names nothing; say "HB-FIN-02.rdp no longer works."
- **n3.** The explainer's "Later" kinds (an RFID card as a credential, a one-time code, a key file) are dropped without mention; log them in `docs/IDEAS_BACKLOG.md`.
- **n4.** `jake_pw_note`'s session proof is on a PC that admits Lena and Jake; README 1034 warns on such capture proofs. Say whether `check_credentials` warns the same way.
- **n5.** A saved connection refused for a lockout shows the generic lockout text; add a line: "This account is locked on this PC, so the saved password is refused too."
