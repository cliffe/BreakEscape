Counts: B 0, M 2, m 10, n 6
# Credential keyring plan: review round 10 (UX and game design)

Reviewed: the build plan as written (846 lines, cited as "plan line N"), against the worktree `p-keyring-plan` and, for the session lock, `20a8a83a7` read through `git show` only.

## What I checked

- Fit, measured in headless Chromium (Playwright from the main tree) with the game page's full stylesheet list from `show.html.erb`, the repo's GNF and Press Start 2P fonts (waited on `document.fonts`), and the real `PasswordMinigame` and `ContainerMinigame` mounted in the real PC monitor frame. Scripts and shots are in the scratchpad folder `r10ux/` (`harness.mjs`, `baseline.mjs`, `lines.mjs`, `states.mjs`, `row.mjs`, `desk.mjs`). Sizes 1400x1000, 390x844, 915x412, 800x600. Metrics match plan line 275: 560x350 at x2, 342x546, 488x306, 720x450.
- Today's states, as a check on the harness: the plain Other user form with a two-line refusal at x2 measures 363 of 350, the same figure as plan line 275. Switch user with Other user and a one-line message measures 390 of 350 at x2 (the plan says 383) and 534 of 450 at 800x600.
- The plan's K0 and K3a layouts, approximated by injected CSS and DOM: merged signed-in slab, label slabs hidden at x2 and in the short window, 4px gaps at x2, tile row folded at every size on a remote screen, found-password lines and credential buttons as `pc-os-btn` and slab rows.
- Every K0 line, remote error line, credential refusal and chosen-line string in the real message box at all four sizes (line counts from client rects), with the longest sign-in hosts (HB-KIOSK-01, LW-OPEN-07, SV-OPS-01).
- The tile row before a choice: eight tiles, three with tags (two Press Start 2P 8px lines, or a 12px badge in the short window), measured for one row's height and the room left.
- The desktop top bar with the planned second account line, and the relay bar, at four sizes, with four desktop icons.
- Beats R1 to R11 in run order against the engine: the reach walk (`network_access.rb:1075-1108`), the timer dispatcher (`ui/scenario-timer-dispatcher.js`), NPC mapping conditions (`systems/npc-manager.js:25-120`), `onRead`/`onPickup` hooks, the desktop transfer dialog, `pc-sessions.js` `signOut`/`linkDropped`, the objectives task types.
- Player-facing text in 5.2, 8.2 and 8.5 for one phrasing per state, fillable fields, pronouns and UK spelling; the UI rules; section 13's decisions and evidence; which tests need layout.

## B

None.

## M

### M1. The invite's end can strand the run's last task for good

Evidence:
- Plan line 651: HB-FIN-03 is reachable only by the relay ("the relay is the only way onto that PC"); its policy is `remote: "blocked"`; Jake's office stays locked for the whole test (plan line 663, key never given).
- Plan line 663: the run's last task is "Read the vendor contract on Jake's PC", and `vendor_contract.txt` is only on that desktop.
- Plan line 677: the timer arms on the first relay `pc_desktop_opened` and ends the invite 90 s later. Its only condition is `!globalVars.jake_ended_assist`. The dispatcher counts real time from the start global (`scenario-timer-dispatcher.js:86-96`, `delayMs` check at about line 197) whether or not the desktop is open.
- Plan line 678: the ink can end it "after the player has used the invite", so talking to Jake straight after the first Connect also ends it.
- Plan lines 437 and 439: `endedCredentials` is grow-only. Plan line 676: the code is given once. K4's `from` route refuses a `remote: "blocked"` target (plan line 197).

Problem: a player can Connect, close the desktop to look around (R6 itself has them close it and check the view), talk to Jake, or simply take longer than 90 s. Any of these ends the invite before `vendor_contract.txt` is opened. After that, no route onto HB-FIN-03 exists, and the last task can never complete. The README guidance the plan adds (plan line 651, "an invite should open something the player cannot otherwise reach") steers authors into the same trap. The picks-page evidence for the timer default (plan line 55) does not show this stranding case, though it does for the lockout (plan line 57).

Fix:
- Arm the end only once the payoff has happened: an `onRead.setVariable` on `vendor_contract.txt` sets the timer's `startOnGlobal` (or is a term in the timer's and the ink end's conditions). The invite still ends on its own, which keeps the lesson.
- Add the same rule to the README credentials section: an invite's end clock or end choice starts after its payoff, or the payoff stays reachable another way.
- Optionally add a validator warning for an `assist_invite` with `endsOnGlobal` whose `connectsTo` holds the only source of a task item.
- Show the stranding case beside the timer default on the picks page.

### M2. Sessions ended by a prune are reported as "Unplugged", in R6 and in every new prune the plan adds

Evidence:
- `pc-sessions.js:421-436`: `signOut` hands POST /logout's `endedPcIds` to `linkDropped`.
- `pc-sessions.js:460-480`: `linkDropped` closes an open desktop with "The link dropped" (`LINK_DROPPED_MESSAGE`, `:81`) and otherwise toasts `unplugEndedMessage`, which reads "Unplugged. Your session on {host} ended." (`:88-93`).
- Plan line 704 (R6): "Sign out at HB-FIN-02: the SV-OPS-01 session ends with its "has ended" notice". On today's code that notice reads "Unplugged. Your session on SV-OPS-01 ended." Nothing was unplugged; the drop box is still in the port.
- Plan line 216 sends every sign-in that replaces a session through `endedPcIds` to `linkDropped`: a relay replacing a pivot, a typed or claim sign-in replacing a relay, a credential sign-in replacing a password session.
- Plan line 633 adds the borrow end and `displaced()` to the same path. Plan line 558 handles `endedRelayPcIds` "as `linkDropped` handles `endedPcIds`". Built literally, an invite that ends while its desktop is closed toasts "Unplugged. Your session on HB-FIN-03 ended."
- Plan line 241 and 8.5 promise one phrasing per state. Neither 8.5 table has a line for "a session ended because its route went".

Problem: a builder following the plan ships a false cause on R6's own teaching beat (the player is learning that reach goes through the pivot session) and on every new prune path. The relay case is worse still, because the plan gives the relay end its own line ("{displayName} ended the remote assist.") but routes it through a function that prints another.

Fix:
- Give `linkDropped` a reason: `unplug` (today's text), `route` and `relay_ended`.
- Add two rows to 8.5. Route: "Your session on {host} ended: its route went through {pivotHost}." Two-line limit at 390x844; the `endedPcIds` answer would need the pivot host, or use the shorter "Your session on {host} ended: its route is gone." Relay end with no desktop open: "{displayName} ended the remote assist."
- Name the text in R6, and test each reason in `pc-sessions.test.mjs`.

## m

### m1. "Assist" is listed as a tile tag but is never drawn

Evidence: plan lines 27 and 491 list "Assist" among the account-tile tags, and 8.5 gives it a tag (plan line 593). Plan line 492 says an `assist_invite` "never shows on a sign-in screen", and under the recommended D4 (c) there is no other keyring view.
Problem: the plan contradicts itself, and the tag table invites a builder to add a fourth tile tag.
Fix: drop "Assist" from lines 27 and 491. In 8.5, mark the tag "only under D4 (a), (b) or (d)".

### m2. The short-window badge for an account with both groups is undefined

Evidence: plan line 274 says "tags become one 12x12 CSS px corner badge ... one glyph per group". In R5a (plan line 701), Ian's tile on SV-OPS-01 carries both a password kind (Captured) and a connecting kind (Saved).
Problem: one badge, or one per group? Two 12px badges in an 84px tile corner, or a combined glyph, are different art and layout.
Fix: state the case. For example, two badges side by side (12+2+12 px) at the top right, or a key badge with the plug drawn second. Add Ian's tile at 915x412 to `signin-fit.mjs`.

### m3. K0's "three tags" fixture cannot exist in K0

Evidence: plan line 276 includes "a row of tagged tiles, one of them with three tags" among K0's fixtures. In K0 the only tag is "Captured", and there is one tile per account (plan line 266).
Fix: move the three-tag fixture to K3a, and keep K0's row to one Captured tag per tile.

### m4. The ellipsis cut is tested in jsdom, and the fit script would flag the cut label

Evidence: plan line 273 says "text that does not fit is cut with an ellipsis", which is a layout result. Plan line 290 (`password-signin-mode.test.mjs`) and line 511 (`keyring-signin.test.mjs`) test the cut in jsdom, which has no layout (plan line 276 says so). Plan line 276's fit rule fails "when a line with fixed words has `scrollWidth` above its box". A CSS `text-overflow: ellipsis` span always has `scrollWidth` above its box when cut.
Fix: say whether the cut is CSS or a character count. If CSS, test only the markup in jsdom (the fixed words in their own span, the label in a cut span with the full text in `title`), and check the visible cut in `signin-fit.mjs`, with the cut span exempt from the `scrollWidth` rule. If a character count, give the count per size.

### m5. K4's "Connect beside Take" does not match the desktop's file dialog

Evidence: plan line 639 and mock m6 (plan line 745) say "the file's click offers Connect beside Take". A takeable file on a sign-in desktop opens the transfer dialog with Open, Copy to inventory, Move to inventory and Cancel (`container-minigame.js:36-41`, `:225-228`, `:1321-1337`); once the file is held it offers Open and Cancel. There is no "Take", and the dialog carries a Cancel.
Fix: describe Connect as a button in the transfer dialog, offered whether or not the file is held. Mock m6 on that dialog. Note the existing Cancel against the "X closes" rule, either removed in K4 or logged in the backlog.

### m6. The assist teaching line tells the attacker to check who is asking

Evidence: plan line 601: "{displayName} let you into the session. Check who is asking before you share access." The player is the person who asked, posing as the helpdesk (plan line 676).
Problem: the second "you" is the victim, so the advice is addressed to the wrong person.
Fix: take the alternative ("{displayName} let you in. Nobody checked who was asking.") or name the control: "{displayName} let you in. Staff should check who is asking before sharing a screen."

### m7. A `from` session has no merged signed-in slab, and two phrasings for one route

Evidence: plan line 275 merges Switch user's lines into "{displayName} signed in, through {link}". For K4, plan line 639 gives "Remote sign-in from HB-DESK-01", and plan line 232 the capture log's "Remote session from {host}". Switch user on a `from` desktop (plan line 639) has no slab text.
Fix: add the `from` forms to 8.5: "{displayName} signed in, from {host}" for the slab and "Remote session from {host}" for the desktop bar. Use "from" for every `from` screen and "through" only for a link.

### m8. Only one task, so R3 to R5 can be skipped and `verify-run.rb` shows no progress for them

Evidence: plan line 663 names one task (the vendor contract). R3's file, R4's Switch user to Jake and R5's SV-OPS-01 refusal unlock nothing the run needs: the PIN is in `door_code.txt`, and the contract is reached by the relay. Plan line 244 asks the live proof to show progress on the server with `verify-run.rb`.
Fix: add tasks that complete on the lesson. For example, read `q3_payroll.txt` on `finance_share` (R4, completed by `onRead`) and sign in to SV-OPS-01 (`unlock_object`, R5a). A missed beat then shows in the run's progress.

### m9. D4 option (a) has no mock

Evidence: plan line 789 offers (a) a Keyring section in the capture log, distinct from (d). The mocks list (plan line 745) has m7 for (d) and m8 for (b); D4's evidence (plan line 798) has none for (a).
Fix: add a mock of the capture log with a separate Sign-ins section beside Captures and Sessions, so the duplication the recommendation cites can be seen.

### m10. The merged slab reads as if the account holder came through the drop box, and loses the username

Evidence: plan line 275: "{displayName} signed in, through {link}" replaces "Signed in now: Lena Fox (lfox)" and "Remote sign-in through {link}" (`password-minigame.js:1434-1437`). Measured at x2: "Lena Fox signed in, through Drop box: Comms room" is one line; the merge and dropped labels bring Switch user from 390 to 350 of 350.
Problem: the sentence says Lena came through the drop box. The player did, and this screen is the player's remote sign-in. The username, which today's line shows and the chosen line still shows, is gone.
Fix: "Through {link}: {displayName} ({username}) signed in". In the same slab, "Through Drop box: Comms room: Lena Fox (lfox) signed in" measured one line at x2, 915x412 and 800x600 and two at 390x844, the same as the plan's wording. A long name and link ("Through Drop box: comms cupboard: Sophie Hampshire (shampshire) signed in") takes two lines at x2 and 915x412, so `signin-fit.mjs` should carry the longest pair in play.

## n

- n1. Plan line 271's "GNF advances about 9.4px a glyph ... about 32 characters a line" is conservative. Measured in the real message box at 390x844, 32 mixed lowercase glyphs are 273px, and the content box is 306px. The two-line limits hold (see below), so this changes nothing but the number.
- n2. Plan line 81 says the Other user form with "a refusal line" overflows by 14px at x2. Measured, a one-line refusal fits (350 of 350); a two-line refusal gives 363 of 350, as plan line 275 says. Make line 81 say two lines.
- n3. Plan line 275's 915x412 baseline (Switch user, Other user, one-line message, "322px of 306") did not reproduce: with "Drop box: Comms room" and a one-line refusal today's screen measured 306 of 306. The "20px at 915x412" target rests on that figure; K0's build log should record the fixture's exact link and message.
- n4. D3 (plan line 778) blocks phase 3 only but is asked before K1 (plan line 743). It can wait for phase 3 and keep the picks page shorter.
- n5. Jake hands over a live assist code while standing in Finance, away from a PC that sits in his locked office (plan lines 651, 663, 676). One ink line (he left the assist app open on his PC this morning) would explain the fiction.
- n6. "Your found sign-ins could not be loaded." (plan lines 498, 612) brings in "found sign-ins", a term the player meets nowhere else. "Your saved sign-ins..." is ruled out by the plan; "Your other sign-ins could not be loaded." avoids the new term.

## Verified and fine

- Two-line limits at 390x844 (306px GNF box): every K0 line, remote error line and refusal fits in two lines with HB-KIOSK-01, LW-OPEN-07 and SV-OPS-01. The NLA line is 399px (2 lines), headless 312px (2), both-failed 375px (2), not permitted 319px (2), unreachable 333px (2), off 283px (1), locked 283px (1), the full policy reason 513 to 531px (2). The short form "{host}: type the password." is 237 to 246px (1 line). At 800x600 every line measured is one line; at x2 and 915x412 only the full policy reason takes two.
- Tags: "Captured" is 64px of a compact tile's 76px content box (84px tile, 2px padding and border each side), so every phase 1 tag fits whole, and the "+N" rule is needed only for three tags.
- Fit of the planned chosen states, with the K0 changes approximated: Switch user with Other user and a one-line message, the plain form with the longest refusal, K3a's Switch user with Jake chosen, two found-password lines and a two-line refusal, and Lena chosen with the .rdp, a greyed button and its reason all fit `.pc-monitor-area` at all four sizes, with Password and Sign in in view (x2: 350 of 350 in each).
- Tile row before a choice: one row of tiles with two tag lines is 136px at x2 (93px to spare), 139px at 390x844, 80px at 915x412 with a badge (150px to spare) and 136px at 800x600. "At least one row" fits at every size.
- Desktop top bar with "with the saved connection HB-FIN-02.rdp" as a second line: 100px at x2, 114px at 390x844 (link line wraps), 96px at 915x412, 68px at 800x600. The first row of icons stays in view at all four. The relay bar (header, one bar line, Disconnect) fits likewise; `claimLineText` returns nothing for `via: "credential"`, so the claim's "they" line does not appear on the relay desktop.
- Reach: the walk crosses a link only from a network with a session host (`network_access.rb:1088-1105`), so R2's "server_lan through Lena's session" and R6's "office_lan only" after signing out hold on the engine as it is.
- The timer: `startOnGlobal`, `delayMs`, `condition` and `setGlobal` exist; a reload resumes from the saved running time, and the pagehide flush (`state-sync.js:332`, `:723`) saves it, so R8's "about 90 seconds of play" holds. README line 2753 does still say a reload restarts a timer.
- The arming mapping's condition (`data.relay === true && data.pcId === 'jake_pc' && !globalVars.jake_ended_assist`) is in the NPC mapping grammar (`npc-manager.js:25-120`); mappings support `setGlobal` and `onceOnly`.
- The last task can be built with what exists: `onRead.setVariable` on a desktop file (`container-minigame.js:1452-1459`) and a mapping with `completeTask`. The given code's `onPickup` runs for a `#give_item` gift (`npc-game-bridge.js:30`).
- Copy to inventory stores the server's own copy with the scenario id (`games_controller.rb:2566-2577`), so `held` matches whichever take the player picks.
- R5a and R5b: Ian's captured tile is admitted on SV-OPS-01 (`roles: ["it"]`); the .rdp shows greyed with its reason on a foothold screen and opens the screen from the tray on `kindRefused`, as 8.1 and 8.2 say.
- The Finance policy without `maxAttempts` keeps R4's wrong password from stranding the PIN.
- UI rules: no Cancel added, pixel fonts only (GNF and Press Start 2P at 8px), 2px borders on the new slabs and badges, X closes the relay desktop and Disconnect ends it, headshots on every account tile and bar. Player-facing strings use UK spelling, every template field is filled from the entry or PC, and the engine strings use no pronoun for the account holder (m6 is about who "you" is, not a pronoun for the holder).
- Section 13: D1, D2, D4, D5, D6 and D7 are real choices with alternatives and named evidence. Mocks are labelled and built from K0's real CSS. Layout checks other than m4 are kept out of jsdom (`pc-monitor-frame.test.mjs` is structure only; fit is in `signin-fit.mjs`).
