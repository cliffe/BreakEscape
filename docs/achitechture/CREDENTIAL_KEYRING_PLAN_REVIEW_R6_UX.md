Counts: B 0, M 4, m 9, n 5

# Credential keyring plan: review round 6 (UX and game design)

## What I checked

The plan up to section 14 (not Appendix A), against main 1ce7486c7 in this worktree:

- Every beat of `test_access_keyring` (9.1) and the run order, against the reach walk (`network_access.rb:1076-1108`), the README's pivot rule (`README_scenario_design.md:964`), timers (`ui/scenario-timer-dispatcher.js`, `ui/scenario-timer.js`), event mappings and their conditions (`systems/npc-manager.js:25-121, 1151-1190, 1442-1455`), the bark hold (`systems/npc-barks.js:170-200`, `minigames/framework/minigame-manager.js:197`), the ink gift (`minigames/helpers/chat-helpers.js:123-150`, README line 1185 for the `onPickup` gate), the pagehide flush (`state-sync.js:210, 698`) and the tray menu (`systems/inventory-menu.js:87-130, 171`).
- K0's changes to `test_access_networks` (roles at lines 349-420 with the implicit `staff` role, `game.rb:1833`; the `p3_see` mapping at line 363; host order is sorted by id, `network_model.rb:119`) and D1's lab table against `lab_physical_pentest` (lines 78, 187, 1698, 1893-1945, 2311).
- Player-facing text against the current strings (`password-minigame.js:345-363, 1731`, `network-links.js:65-68`, `network-view-minigame.js:59`, `game.rb:1811-1812`, `container-minigame.js:944-966`).
- Layout: `pcMonitorMetrics` run in node for the four sizes. 1400x1000 gives a 1120x700 screen at x2. 390x844 gives 342x546 at x1 (narrow). 915x412 gives 488x306 at x1 (short). 800x600 gives 720x450 at x1. CSS from `password-minigame.css:764-912, 1105-1341`. Line widths measured in headless Chromium with the repo's `gnf.woff2` (16px) and `PressStart2P-Regular.woff2` (8px).
- D1 to D7 for options, recommendation and evidence, the UI slice 6 dependency, and the UI rules.

Verified and fine (no finding): the mapping condition `data.relay === true && data.pcId === 'jake_pc' && !globalVars.jake_ended_assist` parses in `safeEvaluateCondition`. Mapping `setGlobal` emits `global_variable_changed:<name>`, so `startOnGlobal` starts the timer. The timer runs in `update()` while a minigame is open and resumes from `exportState().started` after a reload. The bark is held while the desktop is open. `'global_variable_changed:*'` works as a prefix listener for K3c's prompt sync. Taking files from a PC desktop and `text_file` tray slots exist (`assets/objects/text_file.png`). The D1 lab rows are true of the scenario: Pierce is the only account at LW-OPEN-07, the hot desk admits all three, LW-DOOR01 is headless with picker `false`. The tags fit tiles whole: "Captured" is 64px against 92px inside a full tile and 76px inside a compact one. The plan states the UI slice 6 dependency honestly.

## B

None.

## M

### M1. R2 claims `server_lan` appears "through Lena's session", but Sam's keyboard session from R1 already opens it

- Evidence: plan line 663 (R2: "the drop box view now lists `server_lan` through Lena's session"); line 626 (Sam's PC is on `office_lan`) and R1 (line 662: sign in at Sam's keyboard and take the .rdp, no sign-out). `reach_session_hosts` counts every session (`network_access.rb:1110-1125`: "Any session counts (a claim or a password sign-in, however opened)"). `reach_walk_uncached` opens every network linked to a reached session host's network (`network_access.rb:1088-1106`). README line 964: "any session at a sign-in host on a network already reached (... or a claim or sign-in at the keyboard) opens every network linked".
- Problem: after R1, Sam's session at HB-DESK-01 (`office_lan`) is still held, so the moment the drop box is planted the view shows a `server_lan` block bridged "via" HB-DESK-01, before Lena's sign-in. As written, R2's assertion is false and K3a's live proof (line 488 includes R2) cannot show it. R6 (line 668) also says the SV-OPS-01 session's reach "was through Lena's session". By then HB-FIN-02 holds Jake's session (R4's Switch user), and HB-DESK-01 bridges too. That is why R6 has to sign out of both.
- Fix: end R1 with "sign out at HB-DESK-01" and have R2 assert that the view shows only `office_lan` before the .rdp sign-in and gains `server_lan` "via HB-FIN-02" after it. Alternatively, keep Sam signed in and reword R2 to "lists `server_lan` (via HB-DESK-01)". In R6, say "its reach was through HB-DESK-01 and HB-FIN-02". If R1 signs out, R10 (K4) must sign in at Sam's keyboard again first, which it already does.

### M2. The message line's "fixed one-line slot" does not hold for the plan's own lines at 390x844 or for the lockout line at x2

- Evidence: plan line 253 ("each at most about 60 characters so it fits one line at x2") and line 257 ("The message line takes a fixed one-line slot under the form"). Lines are given at 253 and 578. `.signin-message` is GNF 16px with 12px side padding and a 2px border (`password-minigame.css:879-891`). It is a sibling of the form, not width-capped (`password-minigame.js:1476`), so its width is the screen minus 32px padding: about 500px of text at x2 (560 base), about 306px at 390x844 (342 screen, compact 8px padding, `css:1339`), and about 450px at 915x412. Measured widths: "HB-OPS-02 lists no accounts until you sign in (NLA)." 381px; "HB-DOOR-01's sign-in details could not be loaded." 366px; "Your captured sign-ins could not be loaded." 328px; "Jake Brooks is locked out on HB-FIN-02, so a saved password is refused too." 583px.
- Problem: at 390x844, three of K0's eight lines wrap to two lines. At x2, the lockout line (75 characters) wraps too. A fixed one-line slot either clips the second line or pushes the form, and the plan's frame test asserts fit only at "x1 and x2" on the 560x350 base, so the phone-portrait wrap is never caught. The 60-character rule is right only for x2 with short host names.
- Fix: size the slot from the measured text, not a line count: two lines at narrow widths, one at x2. Alternatively, cap each line at the narrowest width (306px, about 40 GNF glyphs): for example "{host}: no accounts listed before sign-in (NLA).", "{host}: sign-in details could not be loaded.", "{displayName} is locked out on {host}." (304px). Then add 390x844 and 915x412 cases to `pc-monitor-frame.test.mjs` with the longest host in each scenario (LW-OPEN-07, HB-DOOR-01).

### M3. The policy refusal under the greyed button is cut before the half that names the control, and the full text is only in a title

- Evidence: plan line 472 ("A refused reason shows as one line under the greyed button, cut with an ellipsis if needed, its full text in the title") and line 576 ("{host} always asks for the password, so a saved one is ignored. That setting is the fix."). Section 1.1 line 38 makes naming the control the point. R5a and R5b (lines 665-666) prove this state. Measured: the line is 682px for SV-OPS-01, and the form column is at most 360px (`password-minigame.css:852`), about 330px of text, so it reads "SV-OPS-01 always asks for the passw…". A `title` attribute does not show on touch, and the 390x844 and 915x412 sizes in the proof are phone sizes.
- Problem: honest play meets this refusal precisely to learn the control (D7's recommendation, line 788). On every size the player sees half a sentence. On a phone the rest is unreachable, so the line that teaches the fix is the line that is lost.
- Fix: let the reason line wrap to two lines inside the chosen line's own scroll box (8.1 already allows that box to scroll), or shorten it to one line that carries the control: "{host} always asks for the password." (313px for SV-OPS-01). Put "That setting is the fix" in the teaching toast for the kind instead. Decide this in D7 and mock it in m2 at 390x844.

### M4. K0's remote "host-named lines for not permitted and lockout" have no text for a typed password, and the only lockout line names a saved password

- Evidence: plan line 254 (K0 replaces the server's text with "host-named lines for not permitted and lockout" on every remote screen, shipped scenarios included). Section 8.5 (lines 578-579) has one lockout line, "{displayName} is locked out on {host}, so a saved password is refused too.", and one not-permitted line, "{displayName} can't sign in on {host}.". The server texts are "This account is locked on this PC" and "This account can't sign in on this PC" (`game.rb:1811-1812`), and the client today only adds the attempts (`password-minigame.js:345-350`). With Other user, the player types a username that matches no tile, so the client has no `displayName`.
- Problem: a K0 builder has no lockout text for a typed password on a remote screen (the shipped lab's LW-OPEN-07 and hot desk count attempts). Using the 8.5 line would tell a player who typed passwords that "a saved password is refused too". The not-permitted template has no name to fill for a typed username. This contradicts "one phrasing per state": two states (typed lockout and saved-connection lockout) share no stated line, and K0 ships before D7's table is approved.
- Fix: add K0 rows to 8.5: typed lockout remote "{account} is locked out on {host}." and not permitted "{account} can't sign in on {host}.", where `{account}` is the tile's `displayName`, else the typed username. Keep the saved-connection variant for K3a only. List both in D1's evidence, since D7 says the K0 lines belong to D1 (line 789).

## m

### m1. Connect's step 8 does not map a 403 or 422 race answer, so it falls into "could not reach the game server"

- Evidence: plan line 504 lists the refusals handled (`kindRefused`, lockout, `LOGIN_NOT_PERMITTED`, ended) and says "On a network failure, the toast of step 1". K2's step 4 (line 400) can answer 403 unreachable, 403 `not_responding` or 422 `remoteBlocked` when the PC is switched off or the link drops between the GET and the POST.
- Problem: a builder treating any non-200 that is not a listed refusal as a failure shows "Connect could not reach the game server. Try again." for a PC that has simply gone off.
- Fix: in step 8, map 403 `not_responding` to `notRespondingMessage(host)`, 403 unreachable to the tray's unreachable line, and 422 `remoteBlocked` to the remote-off sentence, as steps 4, 6 and 7 do.

### m2. "{label} no longer works." has no label when the entry is missing

- Evidence: plan line 498 (step 2: "the entry is missing: toast '{label} no longer works.'"); line 549 says labels are filled "from the entry".
- Problem: the entry that would carry `label` is the one that is missing.
- Fix: say the label comes from the tray item's `name` in that case.

### m3. The assist teaching line uses a pronoun for the account holder, against the plan's own rule

- Evidence: plan line 549 and line 798 ("the engine text uses no pronoun for the account holder"); line 575, both columns: "{displayName} let you into their session."
- Problem: "their" is a pronoun for the account holder, in both the recommended text and the alternative.
- Fix: "{displayName} let you into the session. Check who is asking before you share access." Alternatively, drop the rule and say that "their" is the accepted neutral form.

### m4. Long labels on the chosen line and the shortest screen are outside the worst cases

- Evidence: plan line 478 (first credential button in view "at x1 and at the x2 560x350 layout and at 800x600"); line 477 covers a 32-character file name only in the tile row. Measured: "Connect with " plus a 32-character .rdp name is 366px, and "Password in " plus a 32-character name plus ": type it from the file." is 515px, both against a form at most 360px wide (`css:852`). The tightest screen is 915x412 at 488x306 (`pcMonitorMetrics`), which is not the 560x350 base.
- Problem: no rule says whether the Connect button label and the found-password line wrap or cut, and the first-button rule does not name the shortest screen.
- Fix: state that the button label and the found-password line cut the label with an ellipsis, keeping "Connect with" and ": type it from the file" whole. Add 915x412 and 390x844 to the line 478 requirement and to the fixture screens.

### m5. K3a's live proof leaves out the beat that proves the "In file" wait

- Evidence: plan line 488 (K3a proof: R2, R4, R5a); line 664 (R3 proves the tag appears "only after it is opened", slices K1, K3a, K3b); line 470 (the wait is K3a's).
- Problem: R4 starts after the file is open, so K3a's proof never shows the tag absent before the file is opened and present after.
- Fix: add R3's sign-in screen half (Jake's tile untagged before passwords.txt is opened, tagged after) to K3a's live proof.

### m6. The keyboard screen's combined failure line uses `{host}`, against the keyboard's "This PC" rule

- Evidence: plan line 475 (at the keyboard, two or more failed lists give "K0's single combined line", which line 253 gives as "{host}'s sign-in details could not be loaded."); lines 223 and 254 ("The keyboard keeps its own 'This PC ...' lines").
- Fix: at the keyboard, "This PC's sign-in details could not be loaded.", and list it in 8.5.

### m7. The short-window badge glyphs have no art source

- Evidence: plan line 256 ("an 8x8 pixel glyph ... a key for a password kind, a plug for a connecting kind"); `public/break_escape/assets/icons/` has `keyway.png` but no 8x8 key or plug glyph; 1.1 line 42 says "No new art".
- Problem: K0 needs the key glyph and K3a the plug. The plan does not say who draws them or where they go, and they fall under the pixel-art rule.
- Fix: name the two files (for example `assets/icons/badge-key.png`, `badge-plug.png`), hand-drawn at 8x8. Note that this is new art, beside the backlog's connection icon.

### m8. Section 1.1's "Default" rows have no evidence on the picks page

- Evidence: plan line 23 ("Each is shown on the picks page ... the user can overturn them"); D1 to D7 (lines 711-790) give evidence for their own options only. Defaults such as the 90-second timer (line 33), the typed screen still showing captures (line 30), lockout refusing a saved connection (line 39) and the relay sink (line 35) have no named shot, mock or JSON.
- Problem: a picks-page builder has to invent how to show each default and its alternative, which the explainer behaviour gives only in parentheses.
- Fix: for each Default row, name the evidence (a mock from the m-list, a K0 shot or a beat) and the alternative in one line, or fold them into D-items.

### m9. The K3a desktop top bar grows to three lines, and no worst case covers it

- Evidence: plan line 479 adds "with the saved connection HB-FIN-02.rdp" under "Signed in as". A remote desktop already draws "Remote session through {link}" above the bar (`container-minigame.js:949-951`). Lines 476-478 list only sign-in screen worst cases.
- Fix: add the remote .rdp desktop's top bar at 915x412 and 390x844 to K3a's worst cases, with the frame test asserting that the desktop area keeps its icons in view.

## n

### n1. R8's timing wording runs the wrong way

- Evidence: plan line 671 ("about 90 seconds after the first Connect, less the time the reload took"). The dispatcher resumes from the running time saved at the pagehide flush (`scenario-timer-dispatcher.js:86-96`, `state-sync.js:210`), so the reload's own time is not counted.
- Fix: "about 90 seconds of play after the first Connect; the reload's own time does not count".

### n2. The file path for state sync is wrong

- Evidence: plan line 535 (`systems/state-sync.js`). The module is `public/break_escape/js/state-sync.js`.
- Fix: correct the path, so the harness copy list check looks at the right file.

### n3. The D4 example differs from the 8.2 template

- Evidence: plan line 508 ("Saved connection found: {label}, for {displayName} on {host}.") against line 757 ("...HB-FIN-02.rdp for Lena Fox on HB-FIN-02.", no comma).
- Fix: make them identical, since m9 is captured from the template.

### n4. The invite timer's countdown visibility is unstated

- Evidence: plan line 642 gives the timer's fields. `ui/scenario-timer.js:178-180` shows a HUD countdown only for `showCountdown: true`.
- Fix: state `showCountdown` (false keeps the end a surprise; true teaches "short-lived" on screen), and add it to the 1.1 timer row.

### n5. The gift produces two toasts at once

- Evidence: `chat-helpers.js:140` shows "Received: {name}" (with the emoji the plan logs, line 513); K3b's find toast (line 509) fires on the same inventory add, while the conversation is still open.
- Fix: skip the find toast when the add came from an NPC give, or hold it until the conversation closes. Mock both in m9.
