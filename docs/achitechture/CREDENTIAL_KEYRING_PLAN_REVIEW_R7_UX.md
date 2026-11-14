Counts: B 1, M 6, m 7, n 3

# Credential keyring plan: review round 7 (UX and game design)

Plan reviewed: the plan body, round 7 (826 lines). Code: worktree `p-keyring-plan` at a6e0dbf54. Line numbers below are "plan:N" for the plan body and file:line for the code.

## What I checked

- Monitor sizes from `pcMonitorMetrics` run in node: 1400x1000 gives a 1120x700 screen at x2 (a 560x350 layout); 390x844 gives 342x546 at x1; 915x412 gives 488x306 at x1 (compact, short); 800x600 gives 720x450 at x1 (not compact, not short).
- Text widths measured in headless Chromium (Playwright from the main repo's node_modules) with the repo's own `gnf.woff2` and `PressStart2P-Regular.woff2`, through canvas `measureText` after `document.fonts.load`.
- Screen heights measured in headless Chromium with a static replica: the real `fonts.css`, `minigames-framework.css`, `pc-monitor.css` and `password-minigame.css`, the `.pc-monitor` frame placed from `pcMonitorMetrics`, and the sign-in markup copied from `initSignIn` (`password-minigame.js:1446-1477`). New plan elements (tags, the credential button, the reason line, the two-line slot) were added with the existing classes (`pc-os-btn`, `signin-selected`, `signin-message`). This is a replica, not the live screen: it measures today's x2 Other user state with a one-line refusal at 350px where the plan quotes 364px, so treat every number as accurate to within about 15px. Scripts and shots are in the scratchpad `r7ux/` folder.
- Every beat of 9.1 traced in run order against the reach walk, session pruning, the timer dispatcher, event-mapping conditions, the NPC give path, the inventory menu guard, lockouts and workstation presence.
- Player-facing text in 5.2, 8.2 and 8.5 for one phrasing per state, fillable fields, the no-pronoun rule and UK English.
- The decisions in section 13 and the evidence each lists.

## B

### B1. The found-password line cannot name passwords.txt on one line, so R4 fails as written

Evidence: plan:483 and plan:602 ("Password in {label}: type it from the file."); plan:490 (fixed words kept whole, only the label cut with an ellipsis); plan:683 (R4: "the chosen line names passwords.txt"). The sign-in form is capped at 360px (`password-minigame.css:847-852`), and at 390x844 the screen layout is 342px wide with 8px area padding (`password-minigame.css:1248-1251`). Measured in GNF 16px: the fixed words "Password in " and ": type it from the file." take 251px, and the whole line with "passwords.txt" takes 355px. The `signin-selected` slab adds 20px of padding and border (`password-minigame.css:1146-1155`).

Problem: the label gets at most 89px inside the 360px form (x2, 800x600, 915x412) and about 55px at 390x844, where no placement gives it room. "passwords.txt" needs 104px. Under the plan's own cut rule the test scenario's 13-character file name shows as roughly "passw..." at 390x844 and "passwords..." elsewhere, and R4's assertion fails at the sizes the live proof shoots. The 32-character worst case (plan:490) keeps about 6 to 10 characters, so the line no longer tells the player which file to open. In the replica at x2 the line wraps to two lines ("...type it from the / file."), cutting the fixed words that plan:490 keeps whole.

Fix: shorten the fixed words and put the label on its own line. For example, a first line "In passwords.txt" with the label cut only past the slab width, and a second line "Type it from the file." Or drop the fixed tail and rely on the "In file" tag plus the button's title. Then measure at 390x844 and in the 360px form, and add both to K3a's worst cases.

## M

### M1. A fixed two-line message slot causes the x2 overflow it claims to fix

Evidence: plan:269 ("The message line takes a fixed two-line slot under the form, so the Other user form plus a refusal line fits `.pc-monitor-area` at 1400x1000 (today it overflows by 14px)"). The message line is hidden when empty (`password-minigame.css:893-895`). In the chosen state at x2 the tile row and the captured block are already hidden (`password-minigame.css:1274-1282`), so removing the "Captured sign-ins" heading saves nothing there. Replica, 1400x1000, remote Other user with a refusal: one line needs 350px of 350; a reserved two-line slot needs 365px (15px over, close to the plan's own 14px figure).

Problem: reserving a second line makes the screen taller, not shorter. Nothing else in K0 takes height away from the chosen state at x2, so the `scrollHeight <= clientHeight` assertion in plan:269 cannot hold with the mechanism given. A slot reserved while empty also costs about 65px in every chosen state (see M2).

Fix: say where the height comes from: for example, 4px gaps at x2 as the short window already uses (`password-minigame.css:1286-1288`), or the remote line folded into the bezel name. Reserve the second line only when a message needs it. Re-measure in a real browser (see M3).

### M2. The fit worst cases leave out the Switch user state that R4 and R5b use, and it overflows at x2

Evidence: the plan's worst cases (plan:488-491) are the tile row, the chosen line and the desktop bar. R4 is Switch user on HB-FIN-02 (plan:683), and R5b reopens SV-OPS-01 while Ian's R5a session is still held (plan:681-682). Both screens therefore carry the "Signed in now" line (`password-minigame.js:1435-1437`, shown on a remote screen when a session is held, `unlock-system.js:666-679`) above the remote line. Replica at x2: R4 (Jake chosen, found-password line, Password, Sign in, a one-line refusal in the two-line slot) needs 392px of 350, 42px over. R4 at 915x412 needs 314 of 306. R5b at x2 needs 340px with the message empty; reserving the slot as plan:269 says adds about 65px. At 800x600 the tile row does not fold on choose (fold is only `data-short` or x2, `password-minigame.css:1274-1282`), and R4 needs 528px of 450.

Problem: plan:490 lets the chosen line scroll inside its own box, and plan:483 puts the Password field and Sign in on that line. At x2, then, the primary action scrolls out of view in two of the test's own beats, which contradicts "the form never scrolls" (plan:269). At 800x600 the tile box sized "from the height left" (plan:269) would get about 48px: a sliver of a 126px tile row, not "one row".

Fix: add "Switch user with a held session" (the "Signed in now" line, the remote line, the found-password line and a two-line refusal) as a fourth worst case at all four sizes. Fold the tile row on choose at 800x600 too, or give that size a minimum one-row tile box. State which element scrolls when the chosen state is too tall. The Password field and Sign in should not be it.

### M3. The fit tests named for pc-monitor-frame.test.mjs cannot measure overflow

Evidence: plan:269, plan:283 and plan:499 put `scrollHeight <= clientHeight` assertions, "the row inside the screen" and the three worst cases in `test/js/pc-monitor-frame.test.mjs`. That file runs the real modules against jsdom (`pc-monitor-frame.test.mjs:13, 37`). It has no layout engine, so it stubs `getBoundingClientRect`, `scrollHeight` and `clientHeight` by hand (`pc-monitor-frame.test.mjs:470-475, 721-724`).

Problem: in jsdom `scrollHeight` and `clientHeight` are 0 unless stubbed, so every planned fit assertion passes whatever the CSS does. B1, M1 and M2 would all ship green. Only the live-proof shots would show them, and those are checked by eye.

Fix: run the fit assertions in a real browser: a Playwright test that loads the sign-in screen with the real CSS and fonts at the four sizes and reads `scrollHeight`, `clientHeight` and the label's `scrollWidth`. The replica approach in this review is a cheap starting point. Keep jsdom for structure only.

### M4. Lockouts are permanent, so a lockout that refuses the .rdp can strand the test scenario

Evidence: plan:39 and plan:415 (a saved connection is refused while the account is locked out). Lockouts are written to `player_state['loginLockouts']` with no expiry (`game.rb:2867-2884, 2900`; read at `game.rb:2257-2261`). In 9.1 the `finance` policy has `maxAttempts: 5` (plan:102, plan:633). Lena's tile is on HB-FIN-02's remote screen with the Password field "always shown" (plan:483). The .rdp is the only way onto Lena's desktop, and that desktop holds the only copy of the Finance PIN (plan:644, plan:668).

Problem: a player who types five wrong passwords for Lena at HB-FIN-02 (easy to do while exploring, since the field sits under her tile) locks `lfox` there for good. The .rdp is then refused, door_code.txt can never be read, Finance never opens, and R3, R4, R6 and R7 cannot be reached. The same pattern in a mission would strand students. The picks page shows the lockout default (plan:57) without this consequence.

Fix: add the stranding case to the lockout default's picks-page evidence. In the test scenario give the PIN a second route, or set no `maxAttempts` on Lena's PC. Add a validator warning for a `saved_connection` whose target honours lockout when the credential is the only route to a needed item.

### M5. The full policy reason does not fit the two-line slot at 390x844, and the "one-line" short form wraps

Evidence: plan:484 (short form "fits one line"; clicking puts the full reason in the message slot), plan:269 (a fixed two-line slot), plan:265 (at most two lines, about 38 characters a line at 390x844), plan:590. The message line has 2px 8px padding and a 2px border in compact (`password-minigame.css:1339-1341`), leaving 306px of text at 390x844. Measured in GNF 16px: "SV-OPS-01 always asks for the password, so a saved one is ignored. That setting is the fix." is 682px, three lines at 390x844 (confirmed in the replica shot). "SV-OPS-01 always asks for the password." is 313px, two lines at 390x844. The D7 alternative "{host} does not accept saved passwords. That setting stops this attack." fits in two.

Problem: the recommended D7 text breaks the plan's own two-line rule on a phone, and the short line breaks "fits one line". D7's recommendation (plan:804) says the tags fit, but gives no measurement for the lines.

Fix: measure every 8.5 line at 306px and put the result on the picks page beside each D7 pair. Shorten the full reason to two lines at 306px (or recommend the alternative), and make the short form fit one line at 306px with the longest host in play, for example "{host} needs the password typed.".

### M6. A registry password entry without `foundIn` has nothing to fill its label, tag or toast

Evidence: plan:134 (`foundIn` is optional on `password`), plan:337 (the entry's `label` is the file name), plan:482 (the "In file" tag waits until the `foundIn` item is opened), plan:521 ("{displayName}'s password is in {label}."), plan:602 ("Password in {label}: ..."). Section 6.3 (plan:360-379) neither errors nor warns on a registry `password` without `foundIn`.

Problem: for such an entry the tag's wait never ends, or ends at once (the plan does not say which). The toast and the chosen line have no `{label}`, and "In file" is the wrong tag for a password whose proof is, say, `planted`. The builder has to invent the behaviour, and the text table has no line for this state.

Fix: either make `foundIn` required on a registry `password` (a validator error), or define the no-file state: its tag, its chosen line, its toast and its wait rule.

## m

### m1. The host in K0's failure lines has no source when /login_accounts fails

Evidence: plan:265 ("The host is the answer's `host`, never 'This PC'") for "{host}'s accounts could not be loaded." and "{host}'s sign-in details could not be loaded.". Both lines are shown exactly when that answer is missing. `remoteLockable` carries the view row's `host` (`unlock-system.js:302-314`).

Problem: as written, the field cannot be filled in the two states that use it.

Fix: name the view row's host (`scenarioData.host`, else the name) as the source when the answer is missing.

### m2. "Your keyring" clashes with the existing Key Ring tray item

Evidence: plan:600 ("Your keyring could not be loaded.") and D4 (b)'s toast "New on your keyring ... Open the Keyring in your inventory" (plan:775). The tray already has a player-facing "Key Ring" for physical keys (`inventory.js:1208, 1278`).

Problem: under D4 (c) the player never sees a keyring anywhere, then meets "Your keyring could not be loaded." on a sign-in screen and will think of their keys. Option (b) would put two rings in the tray. The picks page does not mention the clash.

Fix: word the failure line without the word ("Your saved sign-ins could not be loaded.") and note the clash under D4 (b).

### m3. The greyed button both "does nothing" and takes a click

Evidence: plan:483 ("shows as a greyed button ... and does nothing") and plan:484 ("clicking the greyed button puts the full reason ... in the message slot").

Problem: the two sentences contradict each other, and a native `disabled` button gets no click at all. On a phone the title text is not reachable either, so the full reason would only ever show after a refused Connect.

Fix: say it is an `aria-disabled` button whose click shows the full reason, and test that click.

### m4. K3a's /keyring fetch has no sync first, so a capture read just before can be missing

Evidence: plan:487 (the remote screen waits for three lists, with `/keyring` in place of the captured list, plan:480). The server's implicit entries read the synced `se_captures` (`network_access.rb:1385-1387`). Today's captured list syncs before it asks (`unlock-system.js:338-339`), and the plan gives Connect a flush (plan:509) but not the screen.

Problem: in R5a the player reads Ian's card and opens SV-OPS-01 straight away. If the keyring answer races the sync, Ian's "Captured" tag and filled password are missing until the next open.

Fix: `syncConfirmed` before the screen's `/keyring` request, as `/capture_secrets` does, inside K0's cap.

### m5. A held session at the target itself is not excluded as a `from` source

Evidence: plan:197 and plan:351 (`from` sources are sessions the target "can be reached from", never a relay), plan:621 (tray Connect prefers `from`, most recent first). The rule does not exclude `pcId == connectsTo`.

Problem: in R5b under K4, Ian's own session at SV-OPS-01 is the most recently opened session that "reaches" SV-OPS-01, so Connect could post `from: ops_pc` to `ops_pc`. Lena's session would also outrank the foothold, so the reopened screen's header reads "Remote sign-in from ..." rather than the foothold line R5b was written against.

Fix: exclude the target PC as a source, and say which route R5b expects once K4 is in.

### m6. 800x600 is described as the 560x350 base, but its tile row stays up when chosen

Evidence: plan:269 ("on the 560x350 base (x1 and x2) that is one row of tiles"). At x1 the four sizes give 342x546, 488x306 and 720x450 layouts; none is 560x350. The fold on choose is only `data-short` or x2 (`password-minigame.css:1274-1282`), so 800x600 keeps the tiles above the form (measured in M2).

Problem: the one-row statement is not true at x1, and the builder may size for a layout no window has.

Fix: state the per-size layout (from `pcMonitorMetrics`) and the fold rule per size in 5.2.

### m7. The test scenario never makes the assist invite necessary

Evidence: Jake's password is in passwords.txt (plan:670). HB-FIN-03 is on `office_lan` with policy `finance` and access `{ people: ["jake"] }` (plan:644), so it is reachable over the drop box like HB-FIN-02, and its keyboard screen shows Jake's "In file" tile (plan:271).

Problem: by R6 the player can already sign in to Jake's own PC with his password, so the relay opens nothing new. The beats prove the mechanics, but a playtester will reasonably ask what the invite was for, and the "relay is understandable" question goes untested.

Fix: give the relay something only it reaches. For example, Jake's PC under a policy that refuses typed remote sign-ins (`remote: "blocked"`, which the relay ignores, plan:198), so the invite is the only way onto his screen from outside the room. Or say in PLAYTEST.md that the redundancy is deliberate.

## n

### n1. "Assist" is listed as a tag but no screen draws it

Evidence: plan:27, plan:480 and plan:581 list "Assist" among the tags; plan:481 and plan:537 say an invite never shows on a sign-in screen.

Fix: drop the tag from the tag lists and keep only the full name for Connect and Examine.

### n2. "Connect directly with no observations" conflicts with Drop here

Evidence: plan:509. `inventoryMenuFor` returns a menu for any droppable item (`inventory-menu.js:87-118`), and both credential items are takeable `text_file`s.

Fix: say the direct click applies only when the item has neither observations nor Drop here, or drop the clause.

### n3. The resumed timer counts from the last sync, not from the reload

Evidence: plan:658 and plan:687 ("about 90 seconds of play from the first Connect"). The dispatcher resumes from the running time saved at the last sync (`scenario-timer-dispatcher.js:86-96`), so play between that sync and the reload is lost (up to the 30 s sync interval).

Fix: allow about 90 to 120 seconds in R8's check, or have K3c's prompt sync also run just before unload.

## Verified and fine

The reach walk supports R2, R5a and R6 as written. A foothold reaches a linked network only through a held session host on a reached network (`network_access.rb:1076-1105, 1115-1125`). Signing out at HB-FIN-02 therefore drops `server_lan`, and pruning ends the SV-OPS-01 session with "Your session on {host} has ended." (`network-links.js:65`, `pc-sessions.js:429`). R4's share mapping holds because `networks_reachable_from` walks links without a pivot (`network_access.rb:1129-1141`). Timers keep running while the relay desktop is open, since the scene update loop calls the dispatcher and the minigame manager pauses only keyboard input (`core/game.js:2657-2662`, `minigame-manager.js:105-116`). The mapping condition and the timer condition use supported syntax (`npc-manager.js:54-130`, `scenario-timer-dispatcher.js:348-375`). An ink gift of a `text_file` goes through `addToInventory`, so its `onPickup` latch fires (`npc-game-bridge.js:281`, `inventory.js:1050`). A standing Jake with no needs tracking is not "present", so a click at HB-FIN-03 opens the sign-in screen (`workstation-state.js:65-67, 254-259`). The tray menu is refused while a minigame is open (`inventory-menu.js:171-174`), which the Connect beats respect. Every tag fits a tile whole: "Captured" is 64px and "In file" 48px in Press Start 2P 8px, and the compact tile leaves about 76px (`password-minigame.css:1304-1307`). The K0 state lines fit two lines at 306px (the NLA line is 381px; "{host}'s sign-in details could not be loaded." is 357px). The lab facts behind D1 match the scenario (`lab_physical_pentest/scenario.json.erb:78, 187, 1698, 1893-1918, 1937-1948, 2311`; PLAYTEST lines 1028 and 1033), and `README_scenario_design.md:2753` is out of date as the plan says. The engine strings avoid pronouns for the account holder, UK spelling holds, and the decisions in section 13 offer real alternatives argued from the cited behaviour, apart from the evidence gaps noted in M4, M5 and m2.
