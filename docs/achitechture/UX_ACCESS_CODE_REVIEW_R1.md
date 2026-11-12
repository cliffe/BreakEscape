Counts: 0 blockers, 2 majors, 6 minors, 3 nits.

# UX access: code review R1

Branch `build/ux-access` at b5633eca6, reviewed as `git diff main...build/ux-access` (merge base 72e26f911, 10 commits, 26 files). Read with the build log (all rounds), AGENTS.md and the common builder brief (pixel-art UI rule, sync size rule).

Verdict: no blockers. Two majors: the merge with build/unlock-gaps-r1 needs hand work beyond the one textual conflict, and the toast cap can hold important toasts back for a long time. Secrets and the sync rule are clean.

## Checks run

- JS tests: all 159 test files that import a changed module (notifications, password, container and network-view minigames, escape-html, inventory, pc-sessions, npc-action-icons, npc-needs-debug), `bin/test-js -j 3`, no lock: 159 passed, 0 failed.
- Trial merge of build/ux-access + build/dup-toast + main 33c003230 (merge-tree, unpacked in the scratchpad, never in the worktree): no conflicts; the 26 toast, password, container, network-view, inventory, needs and action-icon test files pass on it.
- Trial merge with build/unlock-gaps-r1, conflict resolved as in M1 below: 17 of 18 password and container test files pass; `minigame-controls-layout.test.mjs` fails (M1).
- Validator on test_access_networks (`--no-graph`): 0 lines with ❌.
- Mission scan: every m01 to m10 scenario rendered through the validator's ERB renderer; every `lockType: "password"` object and room, and every desktop-mode container, listed with its type and file count.

## Majors

### M1. The unlock-gaps-r1 merge: one textual conflict, one silent CSS clash, and a layout assumption that no longer holds

Files: public/break_escape/js/minigames/password/password-minigame.js:32-43 and :320; public/break_escape/css/container-minigame.css:17-25 and :41-46.

Failure scenario: `git merge` stops on two hunks in password-minigame.js (this branch's `passwordScreenKind` beside unlock-gaps' `isCaseLockTarget`, and the `password-minigame-area` class string). That part is plain. The CSS merge reports clean, but unlock-gaps adds `height: calc(100% - 40px)` to the same `.container-minigame.desktop-mode` rule where this branch sets `height: auto`. The merged rule carries both, the later `auto` wins silently, and unlock-gaps' `test/js/minigame-controls-layout.test.mjs` test 4 ("the password and container panels fit inside the game area") then fails: expected `calc(100% - 40px)`, actual `auto`. Separately, this branch's `max-height: calc(100vh - 440px)` on the desktop screen was worked out for the framework's Cancel row sitting absolutely at the bottom of the window; unlock-gaps moves that row into the flow (minigames-framework.css `.minigame-controls`), so the 440px budget is unproven after the merge. At a short viewport (under about 680px tall, where the 240px floor wins) the monitor may push Close off the bottom.

Fix:
- password-minigame.js: keep both helpers (close `passwordScreenKind` with its `}` before unlock-gaps' doc comment) and both classes: `password-minigame-area${kind === 'prompt' ? ' prompt-mode' : ''}${caseLock ? ' case-lock' : ''}`. A case is never a computer type, so it gets both classes; the `.case-lock` rules are more specific (0,3,0 against 0,2,0) and win, and `.prompt-mode` clears the new label backing for it. Tried in a scratch tree: syntax checks, the password tests pass.
- container-minigame.css: drop unlock-gaps' `height: calc(100% - 40px)` line from the desktop-mode rule (the 16:10 screen needs `height: auto`) and change test 4's desktop expectation in minigame-controls-layout.test.mjs to `auto`, with a comment saying why.
- Before merging, a live look at a sign-in desktop and a mission desktop (m01 IT Monitoring Station) at 1400x1000 and 1280x720 with the in-flow Cancel row, and retune the 440px if Close is cut off.

### M2. The two-toast cap counts toasts that never time out, and a waiting toast has no age limit

Files: public/break_escape/js/systems/notifications.js:215-218 (`shownToasts`), :260-266 (the cap), :326 (`showNextWaiting` on removal); inventory.js:1145 (Key Ring toast, duration 0).

Failure scenario: the player clicks a key ring with two or more keys. Its "Key Ring" toast has duration 0 and stays until closed; many players leave it. That toast holds one of the two places, so from then on every info and success toast (task complete, item acquired, new aim, the `hint` action's 6 to 12 s toasts) goes through a single place, one at a time. A trigger that completes a task and gives a hint and an item puts three toasts in line: the last one shows 15 to 25 s after the event, out of its context. With two toasts that never time out on screen (Key Ring plus the Mission Brief fallback at helpers.js:43, which also uses duration 0), nothing info or success shows until the player closes one. Warnings and errors still show at once and are not lost, and a waiting toast is never dropped, so this is a delay, not a loss. Queueing while a panel is open is safe: `showNextWaiting` re-checks the hold and moves a waiting toast to the held queue, which is released when the panel closes. A task-complete toast already waited behind a long panel before this branch; the cap adds to that wait, because the released held toasts go through the cap too.

Fix:
- In `shownToasts`, leave out toasts with `duration <= 0` (they are dismissed by hand and should not hold the queue), or give them their own place.
- Give a waiting toast a cap on its wait (for example 8 s): past it, show it anyway (going over the cap for a moment) rather than later still.
- Tests in toast-queue.test.mjs: a duration-0 info toast plus two timed toasts all show; a toast that has waited past the limit shows.

## Minors

### m1. The desktop post-it jumps when first dragged

Files: public/break_escape/css/container-minigame.css:31-38; public/break_escape/js/utils/helpers.js:196-211.

Failure scenario: the post-it is now `position: absolute; top: auto; bottom: 64px` from CSS. `makeDraggable` skips its "make absolute" branch (it already is), sets `bottom: auto` and then reads `offsetTop`. With both `top` and `bottom` auto, the note snaps to its static position (the start of the flex column, the top of the monitor) at the first press, then drags from there. Every desktop with `showPostit` (m01 Kevin's and Derek's PCs, m02 Gary's, m03 Victoria's, the access test PCs) shows it.

Fix: in `makeDraggable`, before clearing `bottom`, pin the current box: `const r = el.getBoundingClientRect(), pr = (el.offsetParent || document.body).getBoundingClientRect(); el.style.left = (r.left - pr.left) + 'px'; el.style.top = (r.top - pr.top) + 'px';` for an absolute element too. Add a test with a bottom-anchored note.

### m2. A lockout's message is on screen for 2.5 s and then gone

File: public/break_escape/js/minigames/password/password-minigame.js:1201-1208.

Failure scenario: the toast and the failure box are gone (right, they tripled the words), but the screen still closes itself after `LOCKOUT_CLOSE_MS` (2.5 s) and the sign-in `onComplete` (unlock-system.js:506-511) shows nothing after. A lockout line that names a wait reads in about 3 s; a slower reader or someone looking at the post-it misses it and has no trace of why the PC refused them. The old error toast lasted at least 5 s (`ERROR_TOAST_MIN_MS`).

Fix: keep the screen open with the form disabled until the player presses Close, or raise `LOCKOUT_CLOSE_MS` to the error floor (5 s). Update the test in password-signin-mode.test.mjs.

### m3. The computer test for the password screen is narrower than the desktop test, and reads only `params.lockable`

File: public/break_escape/js/minigames/password/password-minigame.js:38-43 and :314.

Failure scenario: `SCREEN_TYPE` matches pc, laptop, workstation, terminal, tablet, kiosk, desktop, computer, smartscreen and server by object type only. The container's `shouldUseDesktopMode` (container-minigame.js:346-357) also treats monitor, screen, display, mainframe, console, ipad, surface and smartboard as computers, and reads the name as well as the type. A password-locked object of type `security_console`, `mainframe` or `ipad` would open its lock on the plain panel and then its contents on a desktop. No m01 to m10 object hits this today: their password-locked computers are all `pc` or `pc10`, which keep the screen. The rest of the file reads `this.params.lockable || this.params.sprite` (lines 290, 711, 807), as does unlock-gaps' `isCaseLockTarget`; a launch that passes only `sprite` would get the panel.

Fix: share one keyword list with the container (export it from one module), test on whole segments as now, and pass `this.params.lockable || this.params.sprite`.

### m4. Pixel-art leftovers on the screens this branch restyled

Files: public/break_escape/css/password-minigame.css:148 (`.monitor-screen::before` linear-gradient), :320 (`.password-hint` 1px border), :429 (`.key` 1px border), :550 (`.attempts-counter` 1px border); public/break_escape/css/container-minigame.css:248 (desktop icon label 1px text outline).

Failure scenario: the build log says the classic password screen has no gradients, but the green-cyan gradient overlay is still drawn on every computer's password screen (m01, m02, m03, m10); only the prompt panel hides it. The attempts counter (shown on every classic password screen, so now on the door panels in m05 to m09 too), the hint box and the on-screen keys keep 1px hairlines. The desktop label's 1px outline is a pixel outline rather than a soft shadow, so it is borderline. The 1px container borders at container-minigame.css:380, 423, 445, 467 and 473 are fixed to 2px by build/unlock-gaps-r1 and need nothing here.

Fix: delete the `::before` gradient (or make it a flat fill); 2px borders on `.password-hint`, `.key` and `.attempts-counter`; a 2px outline on the label, or leave it and note the exception.

### m5. VT323 on the Phaser canvas is never loaded

Files: public/break_escape/js/systems/npc-action-icons.js:349, :380; public/break_escape/js/systems/npc-needs-debug.js:103.

Failure scenario: VT323 comes in through `@import` in stylesheets for minigames (text-file, person-chat, notes and others), and a browser downloads a web font only when a DOM element uses it. Canvas text does not count, and nothing preloads it (`document.fonts.load` is not called anywhere). Until a conversation or text file opens, the action icons' text stand-ins and the debug label draw in the fallback `monospace`, the smooth font the rule forbids. A text object made before the font arrives keeps the fallback until its text changes.

Fix: at boot, `document.fonts.load("16px 'VT323'")` (and the GNF face if canvas uses it) and wait for it before the first scene creates these, as `objectives-panel.js:103` waits on `document.fonts.ready`. Or check how lock-graphics.js, which already uses VT323 on the canvas, gets it.

### m6. test_access_networks: the playtest script misses the new confirms, and the kiosk's injector socket has none

Files: scenarios/test_access_networks/PLAYTEST.md:243, :313, :315; scenarios/test_access_networks/scenario.json.erb:800-810 (`kiosk_dock`).

Failure scenario: N5 and N7 say "interact server_breaker" and expect `servers_offline` to be set; it now waits for a confirm, so a scripted run that does not answer the dialog sees no outage and reports N5 and N7 as broken. The Sam's desk step is the same. The kiosk socket takes the same keystroke injector with no confirm, so the two sockets for one device behave differently (the kiosk refuses it, but the player does not know that before plugging in).

Fix: add "confirm the dialog" to those PLAYTEST.md steps; wrap the kiosk's `grant_foothold` in the same `confirm_action`. Re-run the validator.

## Nits

- n1. scenario.json.erb:725-735: the Sam's desk confirm shows whether or not the player holds a session at Sam's PC; without one the player confirms and the server then refuses (`implant_not_ready`). The confirm text promises a plug-in that will not happen. A condition on a session global, if one exists, or wording that does not promise success.
- n2. notifications.js:388-401: toasts waiting for a place when a panel opens are moved to the held queue only as a shown toast leaves, so they land behind toasts raised during the panel and show after them, out of order. Moving `waitingToasts` into the held queue in `holdRecentNotifications` keeps the order.
- n3. network-view-minigame.js:226-233: `displayOrder` now sorts a down block's rows by kind, but every down row is still drawn as a computer (`data-kind="pc"`, the PC icon, which predates this branch), and down blocks get no group headings, so a share there sorts after the computers with nothing to say why. Draw the row's own kind, or sort down blocks by name only.

## Mission content (check 1)

- Password locks that are not computers, now on the plain panel: the server room doors in m05 and m06, the SCADA control door in m07, the security archives door in m08, Sorensen's office and the salvage cage doors in m09, and the m09 `hl_box` safe. Each was a monitor with desktop wallpaper before, which read as a PC sign-in; the plain panel suits a door or safe better, and the field label still names the lock. No intended look breaks.
- Password-locked computers keep the screen: m01 (Kevin's PC, `derek_computer`), m02 `gary_workstation`, m03 `victoria_computer`, m10 `model_terminal` (`pc10`).
- Desktop containers in m01 to m10: 13, each with 1 to 4 files, so the 112px tiles fit in one row of the 16:10 screen at 1400x1000. The longest single word in a file name is 21 characters (m06 `transaction_server`); it breaks inside the word as a last resort, as intended. The build log's b07 shot shows the m01 desktop holding.
- Post-it words: the longest word on any post-it across all scenarios is 16 characters, which fits the 260px note at GNF 18px without overflow.

## Secrets (check 3)

- Claimed-session banner: `claimLineText` uses only `displayName`, `username` and `via`; `publicSession` adds one boolean `guest`, set client side in `claim()` (pc-sessions.js:315). No password is held in a claim session, and none is shown.
- Network view: the rows show only `host`, `name` and `kind` as the server sends them; the group headings are fixed text; the own network's name was already in the old title. The sort reads the same fields and shows nothing new.
- Wi-Fi panel: the new title uses `join.apName`, which is the access point object's `name` (network-links.js:650). The same text was already in the join header on main (password-minigame.js:237 on main). The SSID is not read.

## Sync size (check 5)

No player_state or synced field is added. `guest` lives in the client's session map, the toast queue is module memory, and the scenario edits only wrap existing actions in `confirm_action`. Nothing re-sent grows.

## Merges (check 6)

- build/unlock-gaps-r1 (8042190b2): see M1.
- build/dup-toast (d8b6721fb): merges clean. At this tip it touches notifications.js (`settleAfterPanelClose`, above the code this branch changed), minigame-manager.js and a new `toast-once-across-panel-handover.test.mjs`; it does not touch `toast-duplicate.test.mjs`. Its settle window works with the cap: `showNextWaiting` treats the settle window as a panel and holds. The toast tests pass on the merged tree.
- build/ux-devices (bd5f7c4f2): merges clean. It carries the same `notepadItemData` change to inventory.js and the same test edit, so git takes one copy.
- main 33c003230: merges clean; tests pass on the merged tree (with dup-toast).
