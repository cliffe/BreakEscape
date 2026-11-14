Counts: B 0, M 2, m 8, n 7
# Credential keyring plan: review round 9 (UX and game design)

Reviewed: the plan body as written (cited as "plan line N"), against the worktree `p-keyring-plan` (HEAD 00dde34ed) and, for UI slice 6, `20a8a83a7` read with `git show`.

## What I checked

- **Monitor sizes.** `pcMonitorMetrics` run in node for the four windows: 1120x700 at x2 (the 560x350 base) at 1400x1000, 342x546 at 390x844, 488x306 at 915x412 (454x284 with a 60px post-it), 720x450 at 800x600.
- **A real-CSS fit harness.** Headless Chromium (the main tree's Playwright) loads every stylesheet `games/show.html.erb` loads, the repo's GNF and Press Start 2P fonts (forced to load before measuring), `data-ui-theme="general"`, and the real `mountPcMonitor`. It injects the sign-in markup `initSignIn` builds (`password-minigame.js:1415-1480`) plus a plain mock of the plan's new parts: 8px Press Start 2P tags, `pc-os-btn` credential buttons, a 2px-bordered found-password slab, and the plan's 4px gap and fold on the remote screen. It reproduces the plan's own figure for today's screen exactly: Other user plus a one-line refusal at x2 is 364px against 350 (plan line 81). Scripts and shots are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/r9ux/` (`fit*.mjs`, `lines*.mjs`, `desk.mjs`, `shot_*.png`).
- **Line counts.** Every line in 5.2 and 8.5, measured in the real `.signin-message` box at 390x844 (306px) with the longest hosts in play, counted by line boxes, not estimated.
- **Tag widths.** Tag widths in a compact tile (76px inside).
- **Remote desktop top bar.** The bar with K3a's second account line, at all four sizes.
- **Beats in run order.** The 9.1 beats against the engine: the timer dispatcher and its reload resume, the update loop during minigames, the mapping-condition grammar, the `give_item` tag parse, `onPickup` on a given item, role admission, the sign-in desktop's file dialog, how the network view opens, and the slice 6 branch's client changes.
- **Text and rules.** The player-facing text of 5.2, 8.2 and 8.5 for one phrasing per state, template fields, pronouns and UK English. The UI rules. Whether the section 13 decisions and the jsdom tests do what they say.

## B

None.

## M

### M1. R6 cannot teach what an invite is for: the player stands at HB-FIN-03 holding Jake's password

Evidence:
- Plan line 649 gives HB-FIN-03 `remote: "blocked"` so that "over the network, the invite is the only way onto HB-FIN-03 ... so R6 shows what an invite is for". It also says typing Jake's password at his own keyboard stays possible, and it has the README say "an invite should open something the player cannot otherwise reach from where they are".
- Plan line 660 puts `jake_pc` in the Finance room. Jake stands there, and the only way to get the code is to talk to him there (plan line 673). So at R6 the player is physically at HB-FIN-03.
- Plan line 690 runs R4 before R6. Plan lines 686 and 699 have the player already holding Jake's password from `passwords.txt` and having signed in with it once.
- Plan lines 278 and 489 make keyboard screens in a credentials scenario show password entries with their tags. Plan line 700 has the player click HB-FIN-03 at its keyboard during R6, and plan line 556 says that screen opens "by the desk rules". So the screen offers Jake's tile tagged "In file" right next to the relay, and a typed sign-in replaces the relay (plan line 231).
- What each route gives. A keyboard sign-in as Jake maps `finance_share` (plan line 651, Jake-only). The relay maps nothing (plan line 554) and the plan puts nothing on Jake's desktop.

Problem: the invite is optional and gives strictly less than what the player already has, at the spot where the player has to stand to get it. A blind player skips the helpdesk conversation, and the beat's own screen points at the bypass. The scenario breaks the README rule the plan writes for it. The relay invariant (no shares) then reads as "the invite is the weak option", not "the invite reaches what nothing else reaches".

Fix:
- **Keyboard out of reach.** Make HB-FIN-03's keyboard unreachable while keeping Jake talkable. For example, move `jake_pc` into a locked inner office with no key in the scenario and have Jake stand in Finance's outer room, or put Jake at reception and Lena at her desk. Either keeps `remote: "blocked"` as the only network bar.
- **Something only the relay shows.** Give Jake's desktop one file the relay shows, such as a note proving the session, and make a sign or task point at it, so the relay has a payoff of its own.
- **Run D.** Check that run D (no drop box) still has a reason to exist.
- **Keyboard tag.** If the password must stay usable at the keyboard, have R6 run before the player reads `passwords.txt` (a separate run), and drop the "In file" tag from HB-FIN-03's keyboard in that run.

### M2. The 560x350 base: the remote Switch user screen with Other user does not fit, and no K0 fixture covers it

Evidence:
- Plan line 265 sends Switch user on a remote desktop through the same remote screen.
- The screen shows "Signed in now" for a held session: `unlock-system.js:664` passes `current`, and `password-minigame.js:1436` draws it.
- Plan lines 296 and 302 re-run P6 ("Switch user, remotely ... Sam's details are refused", `test_access_networks/PLAYTEST.md:180`). They add Switch user on HB-DOOR-01 with the headless line.
- Plan line 275 promises that "the Password field, Sign in and the message line never scroll". It says the 4px gaps and the fold make "the Other user form plus a two-line refusal" fit at 1400x1000.

Measured in the calibrated harness (content height against the screen's height, plan's 4px gaps and fold applied):

| State | 1400x1000 (350) | 915x412 (306) | 800x600 (450) | 390x844 (546) |
|---|---|---|---|---|
| Today: Other user, one-line refusal (plan line 81 says 364) | 364 | 288 | 357 | 320 |
| K0: Other user, one-line refusal | 348 | 288 | 349 | 312 |
| K0: Other user, two-line refusal (the K0 fixture) | **363** | 302 | 341 | 322 |
| K0: Switch user ("Signed in now"), Other user, one-line refusal | **383** | **322** | 383 | 346 |
| K0: the same with no message yet | 341 | 288 | 341 | 298 |

Problem:
- **Switch user.** With "Signed in now" above the folded row, Other user plus any one-line message (a refusal, the headless line, a K0 state line) is 33px past the bottom at x2 and 16px past it at 915x412. Tiles are folded and there is no ways-in list, so nothing the plan lets scroll can absorb it. The message line goes below the fold in the frame's own scroller.
- **Fixtures.** K0's fixture list (plan line 276) has no Switch user screen. K3a's Switch user fixture (plan line 502) chooses Jake, whose ways-in list does scroll. So `signin-fit.mjs` as specified never catches this state.
- **The two-line fixture.** The plan's stated fix for "the Other user form plus a two-line refusal" leaves it 13px over at x2. No real Other-user refusal is two lines in the x2 box (about 500px), so the mandated fixture fails on a case no string produces.

Fix:
- **Add the fixtures.** Add "Switch user on a remote desktop, Other user chosen, one-line message" to K0's fixtures at the four sizes. Make the two-line fixture use the longest real refusal at each size: one line at x2 and 800x600, two at 390x844.
- **Find about 35px at x2 and about 20px at 915x412 on remote screens.** For example:
  - merge the remote line and "Signed in now" into one slab ("Lena Fox signed in, through Network drop box"; about 44 glyphs, two lines at 390x844, one at x2);
  - or hide "Signed in now" once Other user is chosen, since Change brings it back;
  - and/or drop the "Username:" and "Password:" label slabs on the remote screen at x2 and in the short window, keeping the placeholders and `aria-label`.
- **Measure it.** Show the result in the K0 build log.

## m

### m1. R4 at 1400x1000: the file name on the found-password line scrolls away

Evidence: plan line 699 (R4: Jake chosen on HB-FIN-02's Switch user screen, then a wrong password refused). Plan lines 494 and 502 say the file name stands on its own line and only the ways-in list scrolls. Measured: "Signed in now", the remote line, Jake chosen, the two found lines, Password, Sign in and the one-line refusal come to 358px of 350 at x2, and 305 of 306 at 915x412.

Problem: at the main desktop size, the 44px found-password box must shrink by 8px. With the "More below" cue inside it, only "Type the password from" stays readable, and the file name scrolls out during the beat that teaches it.

Fix: M2's height saving cures this as well. Add R4's exact state (Jake, one-line refusal, Signed in now) to K3a's worst cases, and assert the label line is fully in view at x2.

### m2. Lena's worst case: a kind-name line per button costs 40px at x2, and the clicked greyed button scrolls out

Evidence: plan line 494 ("each with its full kind name") and plan line 586 (full names on the chosen line). Measured with a one-line kind name above each of the two buttons: 377 of 350 at x2 and 325 of 306 at 915x412 with no message. After clicking the greyed button, the full reason goes to the message slot (two lines at x2): 434 of 350, so the 140px ways-in box drops to about 56px.

Problem: the first button stays in view, as promised. The greyed button the player just clicked is pushed out of view as its reason appears.

Fix: put the kind name in the tile tag and the title only, not as a line per button. Or scroll the clicked button back into view after writing the reason (`revealInFrame` exists, `password-minigame.js:338`).

### m3. The short-window badge has no rule for two groups

Evidence: plan line 274 ("one 12x12 CSS px corner badge (an 8x8 pixel glyph inside a 2px border), one glyph per group").

Problem: R5a's Ian (plan line 697: "Captured" and "Saved") and the worst case's Lena both hold a key-group and a plug-group credential at once. One 12x12 badge holds one 8x8 glyph.

Fix: say which glyph wins (the connecting kind, since it adds a button). Or allow two badges side by side; at 84px the tile has room for two 12px badges.

### m4. Two jsdom tests assert an ellipsis cut, which is layout

Evidence: plan line 290 ("a 32-character label cut with an ellipsis" in `password-signin-mode.test.mjs`) and plan line 511 ("the label cut keeping the fixed words whole" in `keyring-signin.test.mjs`). Plan line 273 makes the cut CSS ("text that does not fit is cut with an ellipsis"). Plan line 276 says jsdom has no layout.

Problem: in jsdom these can only check markup, so the names promise more than the tests can prove.

Fix: in jsdom, assert the structure (fixed words and label in separate spans, the full label in `title`). Move "the cut keeps 'Connect with' whole" and "the label is cut" into `signin-fit.mjs`.

### m5. K4's "Connect beside Take" does not match the sign-in desktop's file dialog

Evidence: plan line 637 and mock m6 (plan line 741). A takeable file on a sign-in desktop opens a dialog with Open, Copy to inventory, Move to inventory and Cancel (`container-minigame.js:36-44`, `:225-230`, `:1321-1342`). There is no Take. R1 (plan line 694) also says "take HB-FIN-02.rdp".

Problem: the mock would show a dialog the game does not have. Adding Connect to this dialog keeps its Cancel button, against the X-closes rule.

Fix: specify Connect as a fourth choice in `transferChoices` (and as the only one besides Open once held). Drop Cancel from that dialog in K4, or log it in the backlog. Draw m6 from the real dialog. Say "Copy or Move" in R1.

### m6. Tray Connect turns a keyboard session into a remote launch pad

Evidence: plan line 637 ("Connect from the tray ... among `from` sources, the most recently opened session"). Plan line 197 accepts a source session with no route field as up wherever the player stands.

Problem: after signing in at Sam's keyboard and walking away, the player can Connect "from HB-DESK-01" from anywhere in the building. That teaches that a desk session can be driven remotely, which is not the explainer's "open the .rdp from Sam's desktop".

Fix: limit tray Connect's `from` sources to sessions with a `foothold` or `from` route. Keep keyboard sessions as sources only for Connect started from that desktop's own file (plan line 637's desktop route), which R10 can use.

### m7. R5b runs while the player already holds a session at SV-OPS-01

Evidence: R5a ends "Sign in works" at SV-OPS-01 (plan line 697). R5b then Connects the .rdp, and on `kindRefused` the plan opens "the target's remote sign-in screen with the account and credential chosen" (plan line 529).

Problem: with a session held there, the plan does not say whether that screen is the Switch user layout (with "Signed in now", see M2) or whether the view's desktop rule opens instead.

Fix: have R5b sign out of SV-OPS-01 first, or define the screen for a held session and add it to the fit fixtures.

### m8. Slice 6's "start panel" is not on the slice 6 branch

Evidence: plan line 69 ("Its start panel also replaces the desktop's account bar"). Plan lines 504 and 554 place K3a's and K3c's lines in it if merged first. On `20a8a83a7`, `UX_SLICE6_LOCK_BUILD_LOG.md:66` says "Not touched: `pc-monitor.js`, the start panel UI, the taskbar", and the branch changes no container or desktop code.

Fix: say which branch or slice carries the start panel. Until it exists, state that the account bar is where the lines go.

## n

- **"Assist" tag.** "Assist" is listed as a tag (plan lines 27, 491 and 593), but an `assist_invite` never shows on a sign-in screen (plan line 492), so the tag is never drawn. Drop it from the tag table, or keep it as Examine text only.
- **GNF advance.** Plan line 271 says GNF advances about 9.4px a glyph (32 a line). With the font loaded it is about 7.8 to 8.2px: "Remote sign-in through Network drop box" is 305px for 39 glyphs. The estimate is safe but understates the room (about 37 glyphs).
- **NLA wording.** "{host} lists no accounts until you sign in (NLA)." suggests a list appears after sign-in. NLA asks for the password before any session. "{host} asks for the password first (NLA)." is shorter and two lines at most.
- **Decision timing.** D3 (phase 3 only) and D5 (blocks nothing in phase 1) are scheduled before K1 (plan line 739), which asks the user for calls nothing needs yet. D2's option (b) contradicts plan line 19's scope. Move D3 and D5 to their phases.
- **Early `foundIn` in GET /keyring.** GET /keyring sends `foundIn` and the label for `jake_pw_note` as soon as R2's sign-in proves the session, before `passwords.txt` is opened (plan lines 342-344 and 493). The tag waits, but the answer gives the find away to anyone reading the network tab. Since it is server-gated anyway, sending the entry only once the client reports the file opened is not possible. Note it as accepted in 6.7.
- **Keyboard frame at 915x412.** A keyboard screen with a post-it at 915x412 is 454x284, not 488x306 (`pcMonitorMetrics` with a 60px note). Phase 1 puts no keyring tag on a keyboard screen with a post-it (Sam has no keyring entries), but plan line 275's size list should name it for later content.
- **Run D.** Run D (plan line 690) needs Sam's keyboard session for R10, but R1 ends by signing out at HB-DESK-01. Say "sign in at HB-DESK-01 and stay signed in".

## Verified and fine

- **Frame sizes.** The four sizes in plan line 275 match `pcMonitorMetrics`. Remote screens never carry a post-it, so they keep 488x306 at 915x412.
- **Tags.** "Captured" (64px), "In file", "Saved", "Assist" and "+2" fit a compact tile's 76px; "Captured +1" (88px) does not, as plan line 273 says. Tags fit the 92px full tile.
- **Line limits at 306px with real GNF.** Every K0 line in 5.2 and every 8.5 line is within its limit. Two lines: the NLA line (399px with HB-KIOSK-01), "{host}'s sign-in details could not be loaded." (375), the full saved-connection refusal (513 with SV-OPS-01, 531 with HB-KIOSK-01), "Shared drives are not mapped over remote assist." (372). One line: "{host}: type the password." (246 with HB-KIOSK-01 or WS-BENCH-01), "Type the password from" (181), "Your found sign-ins could not be loaded." (305, at the edge). The D7 alternatives are also within their limits.
- **Remote desktop bar.** With K3a's second line ("with the saved connection HB-FIN-02.rdp") and the remote line, the bar keeps the first icon row in view at all four sizes (icon area 178px at 915x412 against a 120px icon row).
- **Lena's chosen line without kind-name lines.** Fits at every size (337 of 350 at x2, 285 of 306 at 915x412) with the first credential button in view.
- **Tile row at x2.** The one-row tile box is workable: a tile with two tags is 136px at x2 and 90px at 915x412.
- **Timer during the relay desktop.** Timers fire with a minigame open: `scenarioTimerDispatcher.update` runs from the game loop (`core/game.js:2661`), and nothing pauses the scene for a minigame. So R7a's timer fires with the relay desktop open.
- **Timer on reload.** The pagehide flush sends the timer state (`state-sync.js:332`, `:694-723`), so R8's resumed timer is close to 90 seconds of play.
- **Mapping condition.** `data.relay === true && data.pcId === 'jake_pc' && !globalVars.jake_ended_assist` is within the mapping grammar (`npc-manager.js:15-131`).
- **Ink gift.** `#give_item:text_file:jake_assist_code` parses as type and id (`chat-helpers.js:123-125`), and a given item's `onPickup` runs (`npc-game-bridge.js:30`).
- **P5b roles.** Every account holder gets the `staff` role (`access_identities.rb:63-64`), so P5b's three tiles on Sam's PC (plan line 297) are right.
- **The .rdp on a sign-in desktop.** It is offered by Copy or Move with the scenario id kept (`games_controller.rb:1265`, `validate_login_item_collectible`), so the identity-strict `held` proof can hold. Its Open shows the observations line, since it has no text.
- **Network view.** It opens from the link item anywhere, so R6's view checks do not need a walk back to Comms.
- **Text rules.** One phrasing per state holds across 5.2, 8.2 and 8.5. Every template field has a source (entry, PC answer, session or tray item). The engine text has no pronoun for the account holder, and the spelling is UK English.
- **New UI elements.** No new element uses Cancel, radius or a non-pixel font. The new art is two 8x8 glyphs under the pixel-art rule.
- **Layout tests.** They go to `signin-fit.mjs` in a real browser (plan line 276), apart from m4.
- **D1.** A real choice with real K0 shots and a per-answer lab table. D4 and D7 show both wordings side by side.
