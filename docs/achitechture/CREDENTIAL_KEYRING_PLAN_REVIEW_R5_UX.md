Counts: B 2, M 7, m 11, n 5

# Credential keyring plan: review round 5 (UX and game design)

Plan: `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` at f95fa5e47 (sections 1 to 14; Appendix A and earlier reviews not read). Plan lines are written "plan:N".

## What I checked

- Every beat of `test_access_keyring` (9.1) and the four runs against the reach walk, pruning, the timer dispatcher, event mapping conditions, the sync cadence, the tray menu and the bark queue.
- K0's changes to `test_access_networks` (roles, `p3_see`, the capture card, P5b to P5d) and D1's lab table against `lab_physical_pentest/scenario.json.erb` and its PLAYTEST.
- Every K0 and K3 state line against the current sign-in code (`password-minigame.js`, `unlock-system.js`, `network-links.js`, `network-view-minigame.js`, the server's refusal constants).
- Layout. I computed the monitor at 1400x1000, 390x844, 915x412 and 800x600 with `pcMonitorMetrics`. Then I measured static mocks in headless Chromium, built from the real `fonts.css`, `main.css`, `minigames-framework.css`, `pc-monitor.css` and `password-minigame.css` with the real class names: tile rows with 0 to 2 tag lines (a tag line modelled as Press Start 2P 8px, 2px border), the chosen line with K3a's buttons and lines, and the K0 lines in GNF 16px. These are mocks, not the live screen, so the exact pixel counts need the builder's own fixture. The size of each overflow is beyond doubt.
- The UI rules, and section 1.1 and D1 to D7 for options, a recommendation and evidence.

Correct as written and not reported: tag widths ("Captured" is 64px; the tile's inner width is 92px, or 76px compact, so every phase 1 tag fits whole); the K0 code references (`unlock-system.js:260, 302, 369, 633`, `password-minigame.js:358`, `network-links.js:66-68`, `network-view-minigame.js:59`); P5b's "every account holder has the staff role" (`game.rb:1828-1835` adds `staff` to every NPC with creds); the eventMapping condition syntax (`npc-manager.js:25-133`); the sign-outs in R6 leaving only `office_lan` (logout prunes the SV-OPS-01 session, `game.rb:2356`); the capture log being carried by `test_capture_log` alone.

## B (blockers)

### B1. R8 expects an .rdp session that Run B has already signed out

- Evidence: plan:646 ("Run B ... plays R1, R2 and R6 up to the relay desktop, then reloads (R8)"); plan:656 (R6, before Connect: "Sign out at HB-DESK-01 and HB-FIN-02"); plan:659 (R8: "the .rdp session through the drop box is kept").
- Problem: R6 ends the HB-FIN-02 session before the relay desktop opens, so at R8 there is no .rdp session to keep. R8 cannot pass as written, and K3c's live proof (plan:536) claims it.
- Fix: Run B plays R6 without its sign-out step, or R8 drops the ".rdp session ... is kept" clause and checks instead that a non-relay session held at reload survives. Name which.

### B2. K2 and the K3 desktop changes rest on UI slice 6, which is not built

- Evidence: plan:57 ("UI slice 6 ... adds a server-side boolean `locked`"), plan:194, plan:425 (K2 test: "a credential session locks and unlocks through slice 6's predicate"), plan:526, plan:794; K2's base is "main after K1" (plan:391). `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md:222-224` lists slice 6 as "Can start now: nothing. Waits on: q93, q94, q95; approved wallpaper art". There is no session `locked` flag in `network_access.rb`, `game.rb` or `pc-sessions.js`. Slice 6 option C (`UX_FEEDBACK_ROUND_PLAN.md:295-311`) moves Lock, Switch user and Sign out into a start panel. K3a's credential line (plan:477) and K3c's Disconnect (plan:526) are written against today's account bar (`container-minigame.js:943-966`).
- Problem: a K2 builder on "main after K1" has no flag and no predicate, so the named test cannot be written. If slice 6 lands later, K3a's second account line and K3c's Disconnect go into a bar the start panel replaces. The panel's THIS PC section already shows the remote link, and its Switch and Sign out would sit beside a relay's Disconnect.
- Fix: state the order. Either K2 and K3a to K3c wait for slice 6 to merge, with K3a and K3c naming where the credential line and Disconnect go in the start panel. Or the plan drops every `locked` item until slice 6 exists and adds a short follow-up for when it lands.

## M (majors)

### M1. A reload resumes the end timer; it does not restart it

- Evidence: plan:630 ("A reload restarts the timer while `jake_assist_armed` is true, so after a reload the invite ends about 40 seconds later"); plan:659 (R8: "about 40 seconds after the reload the restarted timer ends the invite"). `ui/scenario-timer-dispatcher.js:84-96` resumes a `startOnGlobal` timer "from the saved running time when there is one", and `exportState` (around line 150) saves `started` on each sync and in the pagehide flush. `README_scenario_design.md:2753` still says "a reload restarts any timer", which the code no longer does.
- Problem: R8's expected timing is wrong. After a reload the invite ends at 40 s minus the time already run, and that can be almost at once. A playtest following the plan reports a false failure, or a builder "fixes" the dispatcher.
- Fix: R8 expects the end at 40 s minus the running time saved before the reload (the pagehide flush makes that close to the true time). Correct plan:630, and add a README fix to K1's docs list.

### M2. The invite ends on the server only at the next sync, up to 30 s after the timer fires

- Evidence: plan:632 ("It waits behind the relay desktop, which the sync answer closes first"); plan:657 (R7a); plan:412-413. `main.js:156` (`new StateSync(30000)`), `state-sync.js:327-334` (every 30 s and on page hide). A timer's `setGlobal` (`scenario-timer-dispatcher.js`, `_fireTimer`) does not call `stateSync.sync()`. The client cannot tell which globals end an invite, because the registry is stripped from the bootstrap (plan:102) and `credentialEndGlobals` is never sent (plan:416).
- Problem: the timer fires at 40 s, but the relay desktop stays open and usable for up to another 30 s. Jake's bark is queued behind it (`npc-manager.js:927`). The ink ending has the same delay. R7a reads as immediate, and a player keeps using a session the story says is over.
- Fix: in K3c, `systems/keyring.js` calls `stateSync.sync()` on any `global_variable_changed` while the client holds a relay session (a cheap trigger, bounded by the relay's life). Otherwise, state the up-to-30 s delay in R7a's expected result. The first is better for the lesson.

### M3. Two rows of tiles do not fit the screen at x2

- Evidence: plan:255 ("The tile row holds at most two rows of tiles ... at every scale, and the form below it never scrolls"); plan:475 (worst case: seven accounts, three tagged, one with two tags). Measured mock at 1400x1000 (x2, 560x350 layout, remote line, the "Choose an account." line): eight tiles (seven plus Other user) make two rows, and the screen's scrollHeight is 365 against 350 with no tags, 397 with one tag line per tile and 429 with two. A tile is 116px tall, plus 16px per tag line. At 800x600 (720x450) and 390x844 (342x546) the same rows fit.
- Problem: at x2 the "two rows" cap overflows the monitor before any tag is drawn, so the whole screen scrolls. That breaks the plan's own fit rule and K3a's worst-case test (plan:484).
- Fix: size the tile row's box from the space left, not by a row count, so at x2 it holds one row and scrolls with the pixel scrollbar and "More below". Alternatively, tags sit on one line beside each other at x2. Add a fixture with tags at x2 to `pc-monitor-frame.test.mjs`.

### M4. K3a's chosen-line worst case cannot fit at x2 or at 800x600

- Evidence: plan:469-470 (credential buttons, each with a full kind name and a teaching line under it, a greyed button with its reason, the Password field and Sign in); plan:476 ("the first credential button and Sign in in view without scrolling, at x1 and at the x2 560x350 layout"). The teaching line is moved to a toast only in the short window (plan:470). Measured mock with the real form classes (selected row with headshot and Change, "Connect with HB-FIN-02.rdp" with the saved_connection teaching line, the greyed "Connect with SV-OPS-01.rdp" with the refused line, Password row, Sign in, one refusal line): scrollHeight 524 against 350 at x2 and 522 against 450 at 800x600. It fits only at 390x844 (546 tall).
- Problem: the K3a test and the live proof named in the plan cannot pass. A builder will either shrink type below the pixel grid or let Sign in fall below the fold, which the plan forbids.
- Fix: treat every screen under about 450 layout pixels tall as the short window does. The teaching line goes to the toast, and the refused reason stays as one line under the greyed button with its full text in the title. Or allow the chosen line its own scroller with "More below", and require only the first credential button in view. Re-state plan:476 to match.

### M5. K0's message lines do not fit the "fixed one-line slot"

- Evidence: plan:252 (the NLA line, the account-list failure line, the both-failed line); plan:255 ("The message line takes a fixed one-line slot under the form"). In GNF 16px the NLA line measures 702px, the both-failed line 642px and a refusal line 372px. In the mock the message line is 38px tall for one line; with the NLA line it is 53px at x2 and 800x600 (two lines) and 62px at 390x844 (three lines). A typed screen with no captures opens straight to the Other user form (`setCapturedSignIns`, `password-minigame.js:1755-1781`), so at x2 the NLA line shares the screen with the full form, the state plan:69 already measures at 14px over.
- Problem: the slot that is meant to stop the overflow is a line short in exactly the states K0 adds, and the fit test (plan:255, 269) checks only the refusal line.
- Fix: keep every K0 line to about 60 characters, which fits one line at x2 (for example "{host} lists no accounts until you sign in (NLA)." and "{host}'s accounts could not be loaded."). Or budget two lines and add the typed screen at x2 to the fit test.

### M6. Shipped remote screens keep a second phrasing for off, unreachable and blocked

- Evidence: plan:246 (K0 closes a remote screen on 403 or 422 "with the shared remote strings of section 8.5"); plan:222 (one helper per state on a remote screen); plan:464 and 472 (the "Remote error lines" fix is in K3a, under "Only in a scenario that declares `credentials`"). Today a refused remote sign-in prints "This PC is not responding." or "This PC can't be reached." (`password-minigame.js:358-363`) and the server's "Remote sign-in is turned off on this PC" (`network_access.rb:951`, through `signInRefusalMessage`).
- Problem: in `test_access_networks` and `lab_physical_pentest`, a PC switched off while the screen loads reads "LW-DOOR01 is not responding.", but switched off at Sign in it reads "This PC is not responding." on the same screen. The same goes for remote-off. K0 changes those two scenarios and never moves them onto one phrasing.
- Fix: move the "Remote error lines" bullet from K3a into K0 for every remote screen. It needs no keyring data, and K0 already owns the remote screen's lines.

### M7. The find toast promises that SV-OPS-01.rdp "signs in"

- Evidence: plan:505 ("Saved connection found: {label} signs in as {displayName} on {host}."); plan:641 and plan:653 (R5a: SV-OPS-01.rdp is refused by `pw_only`, by design). GET /keyring without `pc_id` carries no `accepted` (plan:341).
- Problem: at R5a the toast tells the player that the file signs in as Ian on SV-OPS-01, and the next screen refuses it. The beat exists to teach the refusal, and the toast teaches the opposite first.
- Fix: word the find toast without a promise, for example "Saved connection found: {label}, for {displayName} on {host}." Carry it into D4's and D7's side-by-side wording (plan:745).

## m (minors)

### m1. The headless line contradicts a filled captured tile

- Evidence: plan:251 and plan:252 ("Type the account's name and password."); plan:668 (LW-DOOR01 shows its captured tiles, tagged). In the lab, Hampshire's capture is filled under `revealSecret: true` (`scenario.json.erb:78`).
- Problem: the line tells the player to type both while a one-click tile sits above it.
- Fix: "{host} lists no accounts of its own." in every case, or show the headless line only when there are no captured tiles.

### m2. K0's state lines share the message line with "Choose an account." and clear on any click

- Evidence: `password-minigame.js:1671-1673` puts "Choose an account." in the message line when nothing is chosen. `selectSignInTile` and `fillCapturedSignIn` call `setSignInMessage('')`. plan:252 places the K0 lines in the same line.
- Problem: the plan does not say which text wins before a choice, or whether the NLA or failure line comes back after a tile is chosen or a refusal is shown. The explanation vanishes on the first click.
- Fix: state the order: the K0 state line replaces "Choose an account.", stays until a refusal replaces it, and comes back on Change.

### m3. The off state has two phrasings across the view and the screens

- Evidence: plan:552 ("{host} is not responding.", "one per state, used by the remote sign-in screen, the tray and the view"). The view's row label is `NOT_RESPONDING_TEXT = 'Powered down'` (`network-view-minigame.js:60`), and the comment at `network-links.js:66` claims they are "the same words as its row in the view".
- Problem: the plan lists the remote-off row label beside its sentence but leaves out the off row label, so its "one phrasing" claim for the view is not true.
- Fix: list "Powered down" as the view's row label for the off state beside the sentence, as plan:555 does for remote-off, or align the two.

### m4. Not permitted and lockout still say "this PC" on a remote screen

- Evidence: `game.rb:1811-1812` (`LOGIN_LOCKED_OUT`, `LOGIN_NOT_PERMITTED`: "... on this PC"); plan:502 and plan:576 (the tray says "{displayName} can't sign in on {host}."); plan:252 ("The host is the answer's `host`, never 'This PC'").
- Problem: a typed sign-in refused for admission on a remote screen reads "This account can't sign in on this PC.", while Connect for the same state names the host.
- Fix: on a remote screen, map both refusals to host-named sentences in the text table, beside the K3a remote error lines.

### m5. "The desktop the player has open" never applies to a tray Connect

- Evidence: plan:593 ("Connect prefers a `from` route whose source is the desktop the player has open"); `inventory-menu.js:171-178` (the tray is covered while a minigame is open, and the menu does nothing then); plan:494.
- Problem: from the tray no desktop is ever open, so the rule cannot pick. With sessions at two PCs the route choice is undefined.
- Fix: say the `from` source is the desktop the file's Connect was started from. From the tray, use 8.2 step 8's order with a stated tie-break (the most recent session).

### m6. R7a depends on the player reopening the relay inside the 40 s window

- Evidence: plan:630 (the timer starts when the relay desktop first opens); plan:656 (R6 then checks the view and HB-FIN-03's keyboard, which closes the relay desktop); plan:657 (R7a: "With the relay desktop open").
- Problem: by the time R6's checks are done, the timer has often fired with the desktop closed, so R7a's "desktop closes" is never seen. Add M2's sync delay to that.
- Fix: play R7a straight after the Connect in R6 and move the keyboard and view checks after R7b, or lengthen `delayMs` for the test.

### m7. Jake's bark repeats the ink ending

- Evidence: plan:631-632 (the ink sets `jake_ended_assist`; the bark on `global_variable_changed:jake_ended_assist` says "I've ended that session."). `README_scenario_design.md` asks that a bark not repeat the line it opens.
- Problem: on the ink path, Jake says it in conversation and then barks it again as the chat closes.
- Fix: the timer also sets `jake_timer_ended_assist`, and the bark's condition reads it, or the bark condition excludes the ink path.

### m8. Jake has no named sprite key

- Evidence: plan:601 and plan:624. Sam, Lena and Ian in `test_access_networks` use `male_office_worker_v2`, `female_blowse_v2` and `male_nerd_v2` (`scenario.json.erb:353, 387, 405`), each with a `_headshot.png`. The README's art rule says every speaking character has their own sheet.
- Problem: a builder will either reuse a sheet (two characters looking alike) or start new image generation, which needs the user's go-ahead.
- Fix: name an existing v2 sheet with a headshot that no other cast member uses, and say "no new art".

### m9. Section 1.1 offers only four of its player-facing changes as picks

- Evidence: plan:22 (only rows marked "Default" can be overturned); rows 27, 28, 38 and 39 are marked. Rows 29 (the typed screen shows captures), 30 (specific refusals), 32 (the 40 s timer), 46 (Connect signs in directly) and 47 (the relay bar) also change what the player meets, but are not marked.
- Problem: the picks page would show these as settled.
- Fix: mark them "Default", or state why each is not the user's call.

### m10. K3c names the wrong file for the sync answer

- Evidence: plan:532 ("`api-client.js` (sync answer handling)"); PUT /sync_state is sent and its answer read in `state-sync.js:634-660`.
- Problem: `endedRelayPcIds` would be wired in the wrong module.
- Fix: name `state-sync.js` (and its test harness copy list if `pc-sessions.js` gains an import there).

### m11. R4 claims `server_lan` as its own result

- Evidence: plan:655 (R4: "the view lists `server_lan`"). The reach walk pivots through any held session on a reached network (`network_access.rb:1080-1112`, `reach_session_hosts` at 1115), so Sam's keyboard session from R1 and Lena's from R2 already bring `server_lan` in once the box is planted. R5a, which runs before R4, depends on it (SV-OPS-01 is on `server_lan`).
- Problem: R4 checks something already true since R2, and a reader of the beat table thinks Jake's sign-in opened the link.
- Fix: check `server_lan` in R2 (or R5a) and drop it from R4. Also note in R6 that signing out of HB-FIN-02 ends the SV-OPS-01 session, with its "has ended" toast.

## n (nits)

- n1. plan:73: the lab's access lines are `scenario.json.erb:1910` (LW-OPEN-07) and `:1948` (hot desk), not 1893 and 1937.
- n2. plan:494: the tray menu today is `[Use, Drop here, Examine]` (`inventory-menu.js:110-117`). Say Connect takes Use's place, giving `[Connect, Drop here, Examine]`.
- n3. plan:526: the monitor desktop has no header; the slot for "Remote assist session" is `desktop-remote-line` (`container-minigame.js:949-951`). Name it.
- n4. plan:707: lab answer (i) is "the default (`tiles` under (a))"; under (b) it equals (ii). Say so in the table.
- n5. plan:254: the short-window badge needs two 8x8 glyphs (key, plug). Name their source, since 1.1 says no new art.
