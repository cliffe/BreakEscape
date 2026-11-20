Counts: B 1, M 11, m 12, n 5

# Credential keyring plan: UX and game-design review, round 1

Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` (round 0, branch `plan/keyring`). Explainer: q92 (the scratchpad `explain/q92.html` the user decided from). Engine paths are under `public/break_escape/js/`. Line numbers are on main f956f5355 unless `2b0:` marks the `build/ux-slice2b0` branch.

Read: the plan in full, the explainer, `minigames/password/password-minigame.js` (main and 2b0), `systems/unlock-system.js` 330-690, `utils/pc-monitor.js`, `systems/pc-sessions.js`, `systems/network-links.js` (the trip and LANDINGS), `minigames/container/container-minigame.js` (account bar), `minigames/capture-log/`, `systems/inventory-menu.js`, the 2b0 build log and review R1, the 2a and 2c build logs, `scenarios/test_access_networks/` (scenario and PLAYTEST.md), and the README sections on networks and capture proofs. No SecGen file or field guide was opened.

## Blocker

### B1. A policy that refuses a kind can never be seen in honest play, so beat R5 and the "policy matrix" teaching are unreachable

Plan 6.2 (`usable`), 7.2.1 ("Entries not usable here are not shown"), 7.2.2 (Connect always targets `connectsTo`), 7.1 steps 4 and 5, 8.1 beat R5.

`usable` needs both "the policy accepts the kind" and "`connectsTo` is this PC". Connect only ever opens `connectsTo`. So:
- At SV-OPS-01 (R5), `lena_rdp` is not usable (its `connectsTo` is Lena's PC), so it is not on the screen, and Connect never goes there. The only way to see "This PC does not allow saved passwords" is a tampered POST.
- Even a saved connection whose own `connectsTo` refuses the kind is hidden on its target's screen (not usable), while Connect opens that same screen "with the entry chosen". The plan contradicts itself there.
- Jake's PC (`no_saved`) is in the scenario but no honest beat uses it.

The explainer sells exactly this ("A policy without saved_connection in accepts refuses it with 'This PC does not allow saved passwords'. Teaches: a saved password is a password on disk"; "a policy matrix becomes a puzzle in itself"). Section 13 already argues that account admission is not pre-judged "so the refusal teaches it"; kind refusal deserves the same.

Fix:
- Split `usable` into `forThisPc` (`connectsTo` is this PC, or a password entry) and `accepted` (policy). Show every `forThisPc` entry; one the policy refuses is a greyed tile whose line reads the kind's refused text ("This PC does not allow saved passwords") and offers no Sign in. Keep hiding entries for other PCs.
- In `test_access_keyring`, add a second saved connection whose `connectsTo` is a PC that refuses it (for example `ops_rdp`, "SV-OPS-01.rdp", held on Lena's desktop, `connectsTo` SV-OPS-01 under `pw_only`). R5 becomes: Connect from the tray, the screen opens with the greyed tile and the refused text; typing an ops password still works.
- Add a JS test for the greyed tile and a live shot of it at the four sizes.

## Major

### M1. The Keyring row brings back the duplication K0 removed, and nothing bounds the tile count on small screens

Plan 5.2 (K0 dedupe: a captured account that is also a PC tile shows once, with a tag), 7.2.1 third bullet (K3: the PC tile gets a tag "and the keyring entry stays available in the row"), 7.2.1 first bullet (one tile per entry, grouped by account). 2b0 `password-minigame.js:1414-1418` and `:1704-1706` (two separate tile rows, each with its own Other user tile). 2b0 review n3 (at 390x844 the Other user tile already wraps to four lines). UX_SLICE2A_BUILD_LOG.md:123 (84px tiles in the short window).

Under K3, Lena can appear as a PC tile (tagged) and again as one or more Keyring tiles (password, saved connection), under a second heading, with a second Other user tile. A finance PC with four admitted accounts and three keyring entries has nine or ten tiles before the form, which is three to four rows at 390x844 and a scroll at 915x412 before the player has chosen anything. The plan sets no layout rule, no cap and no "More below" cue, though the standing rules ask for one on every scroller.

Fix: one tile per account, never per entry. The PC's accounts first (by its picker), then keyring accounts the PC does not list, then one Other user. A tile carries small kind tags (pixel font, under the name; in the short window, where the username line is hidden, as a 2px corner badge). Choosing an account shows its ways in on the chosen line: the Password field (filled when served) and, for each usable credential, one button ("Use HB-FIN-02.rdp"). One way in acts directly; no one-item menus. State the worst case to prove (six accounts, three with keyring entries) and take it at 1400x1000, 390x844, 915x412 and 800x600 with the pixel scrollbar and "More below" cue. This also replaces the explainer's "Use from keyring" button and panel (see m9), so say so.

### M2. Connecting kinds at the keyboard teach the wrong model

Plan 3.7 route table ("keyboard: any kind"), 7.2.1 (Keyring row on keyboard screens, credential tile signs in "with the screen's own route (keyboard ...)").

A saved RDP file opens a connection to a machine from somewhere else; an assist invite lets a helper into the owner's live session from somewhere else. Neither is something you use at the target's own keyboard. Offering "Signs in with the saved connection HB-FIN-02.rdp" while standing at HB-FIN-02 tells students the file is a password substitute at the console, which is not why it works. It also lets R2 be skipped by walking to Lena's desk if the finance room is open (m11).

Fix: connecting kinds use only network routes (`foothold`, `from`) or `relay`. At the keyboard the Keyring row shows password entries only. POST /login with `credential` and no route answers the generic refusal. Add the case to `credential_login_test.rb` and to the JS screen tests.

### M3. Jake's file password reaches the keyring (and the toast, and maybe the field) before the player has opened the file

Plan 3.3 (`jake_pw_note`, proof `session: lena_pc`), 6.2 ("password ... from the account's creds once the registry proof holds"), 7.2.5 (toast after a successful sign-in), 8.1 R3 and R4. Same failure as the 2b0 review's M1 (unearned secret).

The session proof holds the moment the player signs in at Lena's PC, so the sign-in itself triggers "New on your keyring: Jake Brooks, password (from passwords.txt)" before passwords.txt has been seen. If the scenario sets `revealSecret`, the tile also fills Jake's password, and R4's "password typed from the file" never needs the file. The teaching ("credentials left in files") is spent by a toast.

Fix, either:
- (preferred) a proof the reading earns: make passwords.txt takeable and use `held`, or add a proof kind recorded when the server serves that file's text (if the server can tell). The toast then follows the find.
- keep `session`, but have registry password entries never carry a password (whatever `revealSecret` says) and suppress the toast for `foundIn` entries until the client has opened the `foundIn` item.
Either way, state that `test_access_keyring` has `revealSecret` off, and say in 6.2 exactly when a registry password entry carries `password`.

### M4. Connect overrides the inventory's own menu rule, and "observations on hover" fails on touch

Plan 3.4, 7.2.2 ("its tray click is Connect ... The item's observations still show on hover. One click is one action"). `systems/inventory-menu.js:1-30` and `:94-101` (an item with more than one thing to do opens a small menu; a non-droppable wearable with text gets its action plus Examine), `systems/interactions.js:1829` (a held `text_file` click opens the reader).

The .rdp is a `text_file` with observations. By the project's own precedent it has two things to do: Connect and Examine (and Drop here if droppable). Making the click Connect and putting the explanation in a hover leaves phone and tablet players (390x844, 915x412 with touch) with no way to read "A saved remote desktop shortcut. The password is stored in it.", which is the item's whole lesson. The plan also leaves the hook undecided ("interactions.js or the inventory click registry").

Fix: extend `inventoryMenuFor`: a held item with a connecting `credential` gets `[Connect, Examine]` (plus Drop here when droppable); with no observations, the click is Connect directly. Name the file and function. Add unit tests in the inventory-menu test file. Also decide the click on the file where it is found (Sam's desktop): today it is Take; the explainer's flow is "open it from Sam's desktop". With K4 that click should offer Connect beside Take; without K4, say plainly that the file must be taken first.

### M5. No player-facing explanation of why a credential worked, or of what stopped it

Plan 3.6 (`label`, `refused` only), 7.2.1 kind lines, 7.2.3 desktop header, 5.2 (`typed` screen). Explainer table "Real control the game can teach" and its stated risk: "risk of feeling like an inventory of jargon if kinds are not explained in the item text".

The plan gives each kind a two-word label and a refusal sentence. Nothing tells the player, on first use, that the .rdp worked because a password is stored inside it, that the invite worked because a person let them in, or (on a `typed` screen) why this PC shows no accounts. Item text is the only carrier, and M4 shows it is unreachable on touch.

Fix: add `teach` to each `KINDS` row (one plain sentence, for example saved connection: "The password is saved inside this file, so opening it signs you in as Lena."; assist invite: "Jake let you into his session. Nobody checked who was calling."), shown on the chosen line under the credential button, and once after the first successful use of that kind (a toast, not on later uses). Give each refusal a control sentence ("This PC's policy forbids saved passwords: the fix for this risk."). On a `typed` screen add one line under the form: "This PC asks who you are before it shows anything (Network Level Authentication)." These are on-screen text, not spoken lines, so they belong in the engine catalogue. Put the strings in the plan so the user can approve the wording.

### M6. K3 changes keyboard screens in a lab played on Hacktivity, with no decision

Plan 7.2.1 (the Keyring row on every sign-in screen, including the keyboard, fed by implicit capture entries), 1 (out of scope: "any change to lab_social_engineering"). `scenarios/lab_physical_pentest/scenario.json.erb:78` (`revealSecret: true`), three sign-in PCs (`staff_pc_2`, `hot_desk_pc`, `store_controller`).

Today the keyboard screen never shows captures; only the remote screen does (`unlock-system.js:558-572` keyboard path asks GET /login_accounts only). After K3, a captured password in lab_physical_pentest appears as a filled tile at the hot desk keyboard. That changes a lab played on Hacktivity, and the plan neither lists it nor asks. The project rule is to ask before changing Hacktivity-played content.

Fix: list every scenario whose keyboard screens gain entries under K3 (from `revealSecret` and capture routes: lab_physical_pentest, test_capture_log, test_access_work), add a decision (D6: Keyring row at the keyboard everywhere, or only where a scenario declares `credentials`), with before and after shots of the lab's hot desk. Recommend: only where the scenario declares `credentials` or opts in, so shipped labs are unchanged.

### M7. The relay route is not threaded through the client, and its way back and re-entry are undefined

Plan 7.2.2 ("remote screen in relay mode (header 'Remote assist', no network view trip)"), 7.2.3, 7.2.6. `systems/unlock-system.js:558` (a remote screen is chosen only when `remote.footholdId` is set), `:630` (`openRemoteSignInScreen` reads `data.remote.footholdId`), `minigames/container/container-minigame.js:944-947` (desktop header falls back to "Remote session through your link"), `systems/pc-sessions.js:1-25` (remote sessions carry `footholdId`), `systems/network-links.js:114-135` (LANDINGS need a trip).

As written, a relay lockable has no `footholdId`, so the opener takes the keyboard path, the desktop header (if it got that far) would read "Remote session through your link", and the desktop's GET /container would be judged at the keyboard. The plan names the files but not the shape. It also does not say how the player gets back to an open relay session after closing its desktop (relay sessions are on no network view), or what Connect does when a session is already held at `connectsTo` (relay or foothold).

Fix: define `remote: { relay: true }` beside `{ footholdId }` and list each reader that branches on it (opener, `openRemoteSignInScreen`, sign-in post, `pc-sessions` `remoteFields`, container header and request params). Header texts: sign-in screen "Remote assist (Jake Brooks)", desktop "Remote assist session". Connect with a session already held at `connectsTo` opens its desktop directly. Connect starts no network trip; closing the screen or desktop returns to where the player was (the world, or the capture log through `returnTo`). Say what a physical visit to Jake's PC shows during a relay session (recommend: the owner's desk rules apply, the relay session is not offered at the keyboard). Add JS tests for each.

### M8. K0's live proof and PLAYTEST beats cannot show what they claim in test_access_networks

Plan 5.4 scenario bullet, 5.5. `scenarios/test_access_networks/scenario.json.erb:335` (Sam, role `staff`), `:369` (Lena, `finance`), `:383` (Ian, `it`), sam_pc `access: staff` (around `:706`), lena_pc `loginPicker: false` (`:779`), door_box `access: it`, default picker; PLAYTEST.md:76 (the remote screen "has the username as field 0").

- "Read a capture card, reopen Sam's PC: the Captured tag on the matching tile". The cards capture Lena and Ian; neither is admitted on Sam's PC, so no Sam's-PC tile can carry the tag. Lena's PC lists no tiles. The tag and dedupe are never shown live.
- The `nla` PC is unnamed. The only other picker-`accounts`, remote-allowed office PC is HB-DOOR-01, which is also the one PC where Ian's tile could show the Captured tag.
- PLAYTEST.md's harness note and the P5 and P8 scripts type into field 0 on the remote screen. With tiles they open on tiles, so existing runs change.

Fix: show the tag on HB-DOOR-01 (Ian's card, Ian admitted there) and put `nla` on a PC that is not in any tag beat (add one small PC if needed, rather than repurposing a P-series host). Name both PCs in 5.4. Update PLAYTEST.md's harness note ("clickText('Other user') first on a tiles screen") and re-run P5 and P8 in K0's live proof.

### M9. Dropping K4 drops the explainer's worked pivot, and the plan does not tell the user

Plan 1 ("K4 can be dropped"), 8 ("Droppable"), 13 last bullets. Explainer: "Opening it from Sam's desktop (whose PC reaches HB-FIN-02) signs in as Lena", its sequence diagram ("Use lena_rdp (held), from Sam's desktop"), and the "Reach: ... from the PC whose desktop the item was opened on" check.

The user chose option 3 from a page whose headline example is the desktop pivot. In the plan that is K4, labelled droppable, and without it every saved connection needs a planted foothold, so the found-on-a-desktop chain becomes "find file, go plant a box, come back". That is a different game from the one shown.

Fix: add a decision (D6 or D7): keep K4 in phase 1 (recommended, since it is what the user saw and it is M), or drop it, with the explainer's diagram beside the K3-only flow so the user sees what goes. Also mention that `from` is the route that makes M4's "Connect on the desktop where it was found" work.

### M10. D4 is framed so that the recommendation is option (c) in practice, and it duplicates two existing sections

Plan 12 D4, 7.2.4. `minigames/capture-log/capture-log-minigame.js:1-8` (Captures, Sessions, Findings), `:245-251` (each new row writes a `SEEN_PREFIX` global).

Only `test_capture_log` carries a capture log (checked: no mission or lab does). So (a) means the Keyring view exists in one test scenario and everywhere else the keyring is visible only on sign-in screens, which is (c). The plan's own reason ("in most scenarios the sign-in screen is the keyring") argues for (c). Inside the log, a captured password would sit in Captures and again in Keyring, and a remote session it opened in Sessions; an .rdp filed with `storeIn` could also sit in Findings. Keyring rows would also write seen-row globals, which 7.2.5 says the keyring never does.

Fix: re-frame D4 with the real reach of each option: (a) as "(c) plus a section in test_capture_log", (b) a Keyring item (or the capture log given automatically) for scenarios that declare `credentials`, (c) screens only. Add (d): the log's Captures section becomes the Keyring section (one list, kind tags), so there is no duplicate. Show the duplicate state as evidence (a shot of the log with a captured password in both sections). Say whether Keyring rows count towards the badge and write seen globals, and bound that in the sync line.

### M11. The test scenario does not exercise the routes real content will use for the invite

Plan 8.1 (`jake_assist` granted by a lobby "Helpdesk phone" object's `triggerOnInteract`, ended by a "Jake hangs up" object), explainer ("Posing as the helpdesk, the player talks Jake into reading out a remote assist code ... his ink sets the global when he gets suspicious").

Missions will grant the code from ink (`give_item`) and end it from ink (`set_global` on suspicion). The `held` proof depends on the server holding a canonical, non-forged copy (3.5), and `endedCredentials` depends on the sync merge seeing the global. Neither the ink grant path nor the ink-set global is proved; the object path may pass while the conversation path fails, which is the known pattern of helper paths passing while the live path breaks.

Fix: make Jake an NPC at his desk with a short ink conversation: one choice gives the code (declared `give_item`), one later choice (or a second visit) sets `jake_ended_assist`. Keep the phone object only if a second grant route is wanted. R6 and R7 then prove the real path, and R7's toast can name him (m2).

## Minor

### m1. Keyring toasts double up, and the first one after a reload is lost

Plan 7.2.5. README_scenario_design.md:1146 (`share_login` already toasts "Overheard: <name>").
- A recorded capture already has its own notice; "New on your keyring: Chris, password" right after is a second toast for one event. Toast only registry entries; implicit capture entries stay silent.
- The baseline is "the first answer after a page load", fetched lazily on the first trigger. After a reload, the first credential earned is in the baseline and never toasted (R1 after a reload). Fetch the baseline at load, after bootstrap.
- Say the format for several new entries at once: one toast, at most two names, then "and N more".
- A successful sign-in already changes screens; delay the keyring toast until the desktop has opened so it is not hidden under the transition.

### m2. "This no longer works." and the no-route toast explain nothing

Plan 7.2.2. An ended invite and a dropped item give the same words. Have GET /keyring return ended registry entries the player still holds an item for, as `{ id, ended: true }` (no values), so Connect can say "Jake ended the remote assist." For no route, add the lesson: "HB-FIN-02 can't be reached from here. You need a way onto its network." Add both to `keyring-client.test.mjs`.

### m3. K0 shows two Other user tiles

Plan 5.2 ("the PC's tiles row, then Other user ... Captured accounts the PC does not list stay under the Captured sign-ins heading as in 2b0"). 2b0 `password-minigame.js:1414-1418` and `:1704-1706` each render an Other user tile. Say that the captured block loses its Other user tile whenever the PC row is shown. M1's single row removes the question.

### m4. Where the Captured tag goes in the short window

Plan 5.2 ("under the username"). In the short window the username line is hidden (UX_SLICE2A_BUILD_LOG.md:123). Specify the short-window form (a 2px corner badge, or the tag replaces nothing and sits under the name) and add it to the 915x412 shots.

### m5. Loading and failure of the third request

Plan 7.2.1 last bullet, 5.2. Say what happens when GET /keyring fails or the server is older: the screen leaves the loading state with no Keyring entries, as `remoteCapturedSignIns` does on error (`unlock-system.js:343-361`). Say that the keyboard screen, which today opens only after GET /login_accounts answers (`unlock-system.js:572`), now opens in the loading state too, and prove that state at the keyboard with a route delay.

### m6. Connect's way back for the foothold route

Plan 7.2.2. Opening a remote screen outside a trip means LANDINGS answers "none" on close (`network-links.js:114-120`), so the player lands in the world. That is fine, but write it down, including Connect from the capture log (which should come back to the log through `returnTo`, as `openSession` does), and test both.

### m7. Header texts and placement

Plan 5.2 quotes "Remote session through Drop box" for the sign-in screen; the screen says "Remote sign-in through ..." (2b0 `password-minigame.js:1426`) and the desktop says "Remote session through ..." (`container-minigame.js:947`). Plan 7.2.3 puts "Lena Fox (lfox), saved connection" "in the monitor bezel", but the bezel holds the PC name and the account sits in the desktop's account bar (`container-minigame.js:949-951`). Say which element changes, and keep "Signed in as Lena Fox (lfox)" with the kind as a second line ("with the saved connection HB-FIN-02.rdp").

### m8. Explainer content moved out of phase 1 without saying so

Explainer phase 1 row ends "New-game conversion of the labs' items"; the plan moves it to D5 without noting the change. D5 offers options only for lab_social_engineering, though its evidence cites lab_physical_pentest:586; give the physical lab its own option or say it stays as is. The explainer also listed "the loader accepts option 2's inline shape, so simple grants stay one item" as an author-effort advantage; section 13 drops it as a default. Since the user saw it as a pro, put it in D2's evidence as a dropped item with the reason.

### m9. The explainer's "Use from keyring" button is replaced without saying so

Explainer mocks 1, 2 and 4 show a "Use from keyring" button opening a list, with accounts "nothing yet". The plan uses a Keyring row. The row is better (one action, no menu), but tell the user, and show the new mock in K3's evidence.

### m10. K3 is too large for one review loop

Plan 7.2 (M to L): the screen row, credential sign-in, relay mode, Connect, desktop headers, the log section and toasts. Split into K3a (screen row, credential sign-in, desktop header; foothold route only) and K3b (Connect, relay mode, toasts, log section). Each still leaves a coherent experience: after K3a the .rdp works from the network view.

### m11. test_access_keyring leaves reach and admission open

Plan 8.1. Say which rooms are locked and how (if the finance room is open, the player walks to Lena's keyboard; see M2), that Jake is admitted on Lena's PC (R4's Switch user), that `revealSecret` is off (M3), which network SV-OPS-01 sits on and whether the drop box reaches it, and the starting inventory. Add the dungeon graph for the scenario to K1's evidence.

### m12. An invite survives a reload as a credential

Plan 3.6 (`ends_on_reload`), 7.1 ("an invite does not survive a reload"), R8. The relay session ends on reload but the held code still proves `held`, so Connect works again at once. If that is intended, change the wording to "a relay session ends on reload; the invite can be used again until ended" and add "Connect again after reload works" to R8. If not, add the credential to `endedCredentials` on reload.

## Nits

- **n1.** D3's top-level `accounts` collides in name with `social.mail.accounts` (`scripts/scenario-schema.json:573`, used by ca02 to ca10) and with the `loginPicker` value `"accounts"`. Offer `machineAccounts` in D3's options.
- **n2.** The .rdp as a plain `text_file` icon is indistinguishable from a note in the tray. Fine for phase 1; log a small connection icon in the ideas backlog.
- **n3.** K0 opens the remote screen and then closes it with a toast on 422 `remoteBlocked`. The view already knows the policy (its row offers no sign-in); say the refusal only covers a race, so the flash is rare.
- **n4.** K0 refusal toasts: reuse the existing `notRespondingMessage` and `unreachableMessage` strings from `network-links.js` rather than new literals, so the texts match the view.
- **n5.** D1's recommendation cites "the q92 pick"; add the teaching trade-off in one line (tiles teach enumeration on every remote screen and make typed-username puzzles easier), so the choice is weighed, not only matched.

## Decisions D1 to D5: framing summary

- D1: fair options; add n5's trade-off and the M8 shots.
- D2: fair.
- D3: fair; add n1.
- D4: misframed (M10).
- D5: incomplete for lab_physical_pentest (m8).
- Missing decisions: Keyring row at the keyboard in shipped labs (M6); keep or drop K4 (M9); whether refused kinds show greyed (B1, if the user should weigh it); the `teach` strings (M5).
