Counts: B 0, M 3, m 5, n 8

# Credential keyring plan: review round 8 (UX and game design)

Plan reviewed: the round 8 plan body (836 lines). Code: worktree `p-keyring-plan` at 6067cae1a. Line numbers below are in that worktree, so some differ by a few lines from the plan's citations on main.

## What I checked

- Every beat of 9.1 in run order (Runs A to D), tracing which sessions are held and which networks are reached after each beat, against the reach walk (`network_access.rb:1039-1143`), pruning (`network_access.rb:1150-1166`), the bridge label (`network_access.rb:828-837`), timers (`ui/scenario-timer-dispatcher.js:24-130, 314-333`; called every frame at `core/game.js:2660-2662`, which keeps running while a minigame is open), the pagehide flush that carries the timer state (`state-sync.js:365-369, 696-716`), event dispatch and wildcard listeners (`systems/npc-events.js:45-58`), mapping conditions (`systems/npc-manager.js:54-103`), barks (`systems/npc-barks.js:16-23, 171-177`), the ink gift (`minigames/helpers/chat-helpers.js:123-149`, `systems/npc-game-bridge.js:230-249`), `onPickup` (`systems/inventory.js:644-664`), the tray menu (`systems/inventory-menu.js:87-122, 180-199`) and how the network view opens (`systems/interactions.js:951-953`).
- Fit. `pcMonitorMetrics` run in node: screen 1120x700 at x2 (layout 560x350) for 1400x1000; 342x546, 488x306 and 720x450 at x1 for 390x844, 915x412 and 800x600. All match the plan. Text widths measured with the repo's own GNF and Press Start 2P woff2 fonts in headless Chromium (the main tree's `node_modules/playwright`). Screen heights measured with a replica: the real `show.html.erb` stylesheet list, the monitor's `.pc-monitor[data-compact|data-short][data-ui-scale]` flags, and the sign-in markup copied from `password-minigame.js:1418-1479`, with the plan's new elements (found-password slab, credential buttons, greyed reason) styled as the existing slabs. Calibration: the plan's baseline (Other user form plus a one-line refusal at 1400x1000, scrollHeight 364 against 350) measures 360 in the replica, so its error is about 4px. Scripts and shots are in the review's scratch folder.
- Player-facing text in 5.2, 8.2 and 8.5 for one phrasing per state, fillable fields, the no-pronoun rule and UK English.
- UI rules, game design, section 13's decisions, and which tests run in jsdom without layout.

## B

None.

## M

### M1. The new fold and gap rules are shared CSS, so K0 changes every keyboard sign-in screen, m01 to m10 included

Evidence: plan line 272 ("Once an account is chosen, the tile row folds at every size (today only at x2 and in the short window)" and "Height in the chosen state at x2 also comes from 4px gaps"); line 274 ("The chosen line, Change and the fold rules are the keyboard's"); line 275 ("Keyboard screens are unchanged"); line 707 (K0: "No change in m01 to m10"). The keyboard and remote screens are one template (`password-minigame.js:1418-1479`, the remote screen differs only by `s.remote`), and the fold and gap rules are keyed on `.pc-monitor[...] .signin-mode.signin-chosen` (`password-minigame.css:1273-1287`) with no remote scope.

Problem: written as the plan says, the fold at every size and the x2 4px gaps reach the keyboard screen of every sign-in PC in every mission (at 390x844 and 800x600 the tiles would vanish on choosing an account where they stay today). Line 274 says the opposite of line 272, so the builder must guess, and 9.2 and the D1 gate assume no mission screen changes.

Fix: scope both rules to the remote screen with a class set only there (for example `.signin-mode.signin-remote-screen`), say so in 5.2, delete "the fold rules are the keyboard's", and add a keyboard screen of an m01 PC at all four sizes to `signin-fit.mjs` as a no-change check. If the fold at every size is wanted on the keyboard too, list it in 9.2 and on the picks page.

### M2. Joining "Signed in now" to the remote header cuts the signed-in account's name, and is not needed at x2

Evidence: plan line 272 (the "Signed in now" line joins the remote header line, "cut with an ellipsis"); line 498 (the Switch user worst case). Today the two are separate slabs (`password-minigame.js:1436-1440`, `password-minigame.css:751-762, 1155-1163`). Measured: "Remote sign-in through Network drop box. Signed in now: Lena Fox (lfox)" is 548px of GNF 16px, against about 508px of text room in the slab at x2 (560 minus 32 padding minus the slab's 8px padding and 2px border each side). In the replica the Jake case renders as "...Signed in now: Jake Br..." at 1400x1000. Without the join, the same worst case (Jake chosen, found-password slab, Password, Sign in, a two-line refusal) with 4px gaps fits at x2 with about 16px to spare. At 915x412 it is 1px over (replica error about 4px); giving `.signin-current` the remote line's 2px 8px padding in place of 4px 10px brings it to 0 over.

Problem: the one fact Switch user is about (who is signed in now) is the part the ellipsis removes, and "Lena Fox (lfox)" loses the username first. At 915x412 a 1px shortfall would push the found-password lines into their scroll box, where the "More below" cue takes more height than it saves and hides the file name, the line the player needs to read.

Fix: drop the join. Use the 4px gaps at x2 (remote screen only, see M1) and the remote line's padding on `.signin-current`; if a join is ever needed, cut the link name ("through Network dr...") and keep "Signed in now: {displayName} ({username})" whole. Add the Switch user worst case at 915x412 with a two-line refusal to `signin-fit.mjs` and assert the found-password slab's file name line is fully inside the area.

### M3. The relay desktop hides Jake's shares, which contradicts the plan's own fiction and reads as a bug after R4

Evidence: plan line 35 (a relay "maps no shares"; "The invite is Jake's own screen shared through his vendor's relay"); line 550 ("No share folders show (the server maps none)"); beat R4 at line 693 ("Jake's desktop maps `finance_share` with `q3_payroll.txt`") and R6 at line 694 ("no share folder"). A keyboard or foothold session at a PC maps every admitted share on networks reachable from it (`mapped_shares`, `network_access.rb:1265`), so Jake's own session at HB-FIN-03 would show `finance_share`.

Problem: in Run A the player has just seen Jake's sign-in map his finance share (R4). Then they join Jake's own live session, which the plan says is his own screen, and the share is gone, with nothing on screen saying why. A screen share shows what the holder's session shows, so the sink rule (a sound security limit for the reach walk) has no in-world reason the player can see, and the beat that asserts it will look broken to anyone playing it.

Fix: either give the relay desktop one line under the account bar that explains the limit in the fiction (for example "Shared drives are not passed through remote assist." through the 8.5 table, under D7), or keep the sink and change the test scenario so `finance_share` is reached only from HB-FIN-02 (so Jake's own PC never maps it), and say in the README credentials section which of the two a mission author should use. Show the relay desktop beside Jake's R4 desktop on the picks page as part of the "relay sink" evidence (plan line 56), since the current evidence shows only the network view.

## m

### m1. `signin-fit.mjs` cannot catch the line-count limits the plan relies on, and the plan's glyph estimates are high

Evidence: plan line 268 ("each at most two lines in GNF 16px at 390x844 (about 38 characters a line)"); line 498 ("about 35 GNF glyphs at 390x844"); line 571 ("Every line drawn on a sign-in screen fits two lines (a short form, one) ... `signin-fit.mjs` checks each"); line 273 (its failure conditions: area overflow, a fixed-words line's `scrollWidth`, Password and Sign in out of view). Measured: GNF 16px advances about 9.4px a glyph (38 "M" or "a" glyphs measure 356px), so the 306px message box holds about 32 characters, not 38. The short reason "HB-DESK-01 needs the password typed." measures 302px against 306px, leaving 4px; a pixel scrollbar on the ways-in box (12px, `password-minigame.css:47-49`) or any slab padding under the greyed button pushes it to two lines. "WS-BENCH-01 needs the password typed." is 311px.

Problem: a wrapped line has no horizontal overflow, so `scrollWidth` never fires for it; the "two lines" and "one line" promises go untested. The 38-character figure would lead D7 rewording to lines that do not fit.

Fix: give `signin-fit.mjs` a line-count check (the element's height divided by its line height) for each 8.5 line and the short reason, measured inside the ways-in box with its scrollbar shown; correct the two estimates to about 32 glyphs; and add "the first credential button is in view" (line 497) to its failure conditions.

### m2. "+N" does not fit a compact tile beside a tag

Evidence: plan line 270 ("at most two per tile and then '+N'"; "Every phase 1 tag fits a compact tile whole"). A compact tile's content box is 76px (`password-minigame.css:1304-1307`; measured `clientWidth` 76 at 390x844). "Captured +1" in Press Start 2P 8px is 88px and is cut in the replica. Jake can hold "Captured", "In file" and "Saved" at once (a captured password, a found password and a saved connection), so "+N" occurs with phase 1 kinds.

Fix: say where "+N" goes: its own line, or in place of the second tag ("Captured" / "+2"), and add a three-entry tile to the `signin-fit.mjs` tile fixture.

### m3. "Your saved sign-ins could not be loaded." clashes with the "Saved" tag

Evidence: plan line 494 and line 608 (the `/keyring` failure line); line 588 ("Saved" is the tag and "Saved connection" the full name for `saved_connection`).

Problem: the failure line covers "In file" entries too, but the player has learnt "Saved" as one kind. One word, two meanings on the same screen.

Fix: "Your found sign-ins could not be loaded." or "Sign-ins you found could not be loaded.", and keep "Saved" for the one kind.

### m4. D4's Keyring options collide with the tray's "Key Ring", and the picks page does not say so

Evidence: plan lines 779 and 785 (options (b) "a Keyring inventory item" with "Open the Keyring in your inventory", (a) and (d) a "Keyring" section); line 608 already notes that the tray's "Key Ring" is the physical keys. The tray labels the grouped keys "Key Ring" (`systems/inventory.js:1208, 1223, 1238`).

Fix: list the clash as a cost of (a), (b) and (d) in D4, and name the item or section differently in mocks m7 and m8 ("Sign-ins", "Credentials") so the user picks between real options.

### m5. In the test scenario the assist invite opens a PC the player can already reach, so R6 does not show what the invite is for

Evidence: 9.1 gives Jake's password in `passwords.txt` (line 680), HB-FIN-03 admits Jake with remote sign-in allowed (`finance` policy, line 654), and K3a shows "In file" tags on keyboard and foothold screens (lines 485-489). So after R3 the player can type Jake's password at HB-FIN-03 over the drop box or at its keyboard. A typed sign-in there also replaces a held relay session (one slot per PC, line 204).

Problem: the invite's lesson (social engineering gets you into someone's live session) lands only if it is the way in. Here it is a slower, more limited route to a PC already open to the player, which also teaches the wrong thing (why bother with the person?). Nothing breaks, but the beat is the scenario's demonstration of the kind.

Fix: give HB-FIN-03 a policy whose `accepts` keeps `password` but sets `remote: "blocked"` for foothold sign-in (the relay ignores it, line 198), or admit a different account at HB-FIN-03 than the one in `passwords.txt`, so the relay is the only way onto Jake's own PC; note in the README credentials section that an invite should open something the player cannot otherwise reach.

## n

- n1. K0's fit fixture names "the longest host in each scenario (LW-OPEN-07, HB-DOOR-01)" (plan line 273), but `test_access_networks` has longer sign-in hosts: HB-KIOSK-01 (`scenario.json.erb:841`) and WS-BENCH-01 (line 645), which N14 brings onto a remote screen. Every K0 line still fits two lines with them (widest, "WS-BENCH-01's sign-in details could not be loaded.", is 384px); fix the fixture to use them.
- n2. R6 (line 694) says SV-OPS-01's reach "was through Lena's session", but after R4 the HB-FIN-02 slot holds Jake's session. Say "through the HB-FIN-02 session".
- n3. Run D "starts a new game with no drop box" (line 684), but the start inventory is "the drop box only" (line 639). Say "without planting the drop box".
- n4. The tray menu draws icons per entry (`inventory-menu.js` `inventoryMenuIcon`); a new `connect` entry gets none while Drop here and Examine have theirs. Say which icon Connect uses (the item's own tray picture, as Use does).
- n5. "This connection is for another PC." is listed for the sign-in screen (line 603), but a sign-in screen only offers credentials whose `connectsTo` is that PC (line 488) and Connect never posts elsewhere (line 525), so no player sees it. Mark it as a tampered-client answer only, or drop it from the table.
- n6. The relay desktop says "remote assist" twice: header "Remote assist session" and bar "Using {displayName}'s session (remote assist)" (line 550). The claim bar already reads "Using {name}'s session ({username})" (`container-minigame.js:956`), where the brackets hold the username. Keep the bar's brackets for the username in both, and leave "Remote assist session" to the header.
- n7. Line 272 sizes the tile box "from the height left after the form and the message line" before an account is chosen, but the form is hidden until a choice (`password-minigame.js:1651`). Say "after the header lines and the message line".
- n8. The teaching toast shows "the first time for the kind" (lines 491, 525) without saying whether "first" is per page or per game; on reload it would show again. Say which.

## Verified and fine

The monitor sizes in 5.2 match `pcMonitorMetrics` exactly. With 4px gaps at x2, the Other user form plus a two-line refusal fits `.pc-monitor-area` at 1400x1000 with about 17px to spare, as the plan claims; at 390x844 and 800x600 every chosen-state worst case I built fits with room; Lena's worst case at 915x412 is 7px over, which the ways-in scroller absorbs with the first credential button still in view. All four tags fit a compact tile whole ("Captured" is 64px of 76px). Every K0 and 8.5 sign-in line fits two lines of 306px with the longest host in play (widest 534px). The tile row, the found-password line with a 32-character name (283px) and the "Connect with HB-FIN-02.rdp" label (211px) fit. The beat trace holds: the network view opens from the tray's link item anywhere (`interactions.js:951-953`), so R6's checks fit inside 90 seconds; crossing into `server_lan` needs a session on `office_lan` (`network_access.rb:828-837, 1129-1143`), so R1's sign-out and R6's "office_lan only" are right; the timer keeps running behind an open desktop (`core/game.js:2660-2662`), supports `condition` and resumes from the pagehide flush's saved running time (`state-sync.js:365-369, 696-716`), so R8's resume claim holds; `global_variable_changed:*` is a valid wildcard for K3c's prompt sync (`npc-events.js:51-57`); barks wait behind a minigame and drain on close; `#give_item:text_file:jake_assist_code` matches by id (`npc-game-bridge.js:243-246`) and `onPickup.setVariable` gates the choice; `finance_desk` without `maxAttempts` means no wrong password strands HB-FIN-02, and the relay ignores lockouts, so no beat can be stranded by typing. The 8.5 strings keep one phrasing per state, every template field is fillable in its state, the engine text uses no pronoun for the account holder, and the spelling is UK English. Section 13's options are real and D1 and D7 list evidence that a picks page can carry; jsdom tests are kept to structure, with fit left to the real-browser script.
