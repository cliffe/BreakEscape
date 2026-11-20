# UX feedback round plan: review, round 1

Reviewed: `docs/achitechture/UX_FEEDBACK_ROUND_PLAN.md` at 3490117ba (branch build/ux-feedback). Checked against the user's saved verdicts (56 shot files), the review page's option picks (read from the page's own store: all eight picks and both pick notes match the plan), the review cards and images, and the code on main at c9a4f7a84.

## Coverage

Every "change" and "unsure" verdict, every note on an "ok" or unmarked shot, and all eight option picks appear in section 1 and are read correctly. Readings checked against the images where the note was short: main-11 (the note sits at the top-left of a floor-standing PC, padlock on the right; bottom-anchoring is the right fix), main-12 (the sign-in note is centred under the bezel), main3-05 and main3-08 (card notes confirm the UNC labels and the broken header). The o-acl-doors pick note ("copies ... need the flipper interaction to emulate to open") and the o-barks note (pulsing talk icon plus toast, replace with the speech bubble) are both carried into the plan. main2-16 is read as icons on the two entries, with Q1 asking about new entries: a fair reading.

Code references checked and correct: `postitPosition` and its constants, `.password-minigame-area .postit-note`, `.container-minigame.desktop-mode > .postit-note`, `accountBarHtml`, `createDesktopUI`, `openMappedShare` (asks for `network_share`, which has no image), `_renderBark`, `_showBarkIcon` (the 1.25 tween), `_speakBark`, `world.speak` in npc-needs, `objectActions`, the interaction menu's `{src, frame, cols, cell}` icon, `showDoorScreen`, `showEmulationScreen` (500 ms), `openLoginSignIn` and the remote path, `pcInUseBy` and `showPcInUse` (core/game.js 2963 and 2978), `heldRfidCardIds`, `requestRfidAccessUnlock`, `passwordScreenKind`, `applyTilePortrait`, `blockSectionHtml`, `rowHtml`, `linkOffText`, `host_service_off?`, network_access.rb lines 362, 502, 540 and 571, commit 6990989ac removing the copier's clip-path, the asset sizes (wallpaper 320x320, hand_frames 128x128 in 32px cells, m09_folder1 26x18) and every named test file.

## Findings

### Majors

**M1. Slice 3, o-acl-doors: the copier has no server-decided emulate path, so "Server API unchanged" plus edits to unlock-system.js and rfid-ui.js cannot deliver it.**
For an access-list door with no `requires`, `startRfidReader` passes `requiredCardIds: []`, so `RFIDMinigame.isLockingAttempt` is false (rfid-minigame.js line 58). The door screen never shows (`showDoorScreen` runs only when `isLockingAttempt`), and `handleEmulate` answers "No reader here". Even with that flag forced on, `handleEmulate` decides locally with `requiredCardIds.includes(cardId)` (line 236), which is always false here, and its success path ends in `onComplete`, which calls `notifyServerUnlock(lockable, type, 'rfid')` with no `card_ids`. The server's `rfid_lock_passes?` then returns `requires.any?`, false for an access-list-only lock, so the door would be refused. The slice must add an access-list mode to rfid-minigame.js: the door screen shows for a lock with an access list, Emulate calls `requestRfidAccessUnlock(lockable, type, [cardId])` and waits for the answer (keeping the UID-only and revoked refusals and the pending clone record wait), and success hands the server's response to `unlockTarget` instead of a second unlock call. Name rfid-minigame.js in the slice and add a test that drives Emulate at an access-list-only door to a single-id request and an open door.

What the server must check, for the plan to state: the server already decides the card from server-written state (`held_keycard_ids` from the server's own inventory copy, ignoring client-forged items; copies only from `server_clones` while an `rfid_cloner` is held; UID-only copies refused unless `acceptsUIDOnly`). That stays. "A copy opens only through the copier" is client flow only: the server cannot tell an Emulate press from a hand-made request carrying the same recorded copy's id. Under the cheat policy this is acceptable (the player genuinely holds the copy and the copier), but the plan should say it is a best-effort UX rule and not a server rule, so no reviewer later reads it as enforced.

**M2. Slice 3: revoked cards still open access-list doors, and slice 3 rebuilds that path.**
Card cancellation (`revoked_card_ids`, apply-actions.js `isCardRevoked`) is checked only on the client, and only in `evaluateRfidCredential` and the copier's tap and emulate paths. `heldRfidCardIds` does not filter revoked ids, and the server has no knowledge of revocation (no reference in app/). So today a cancelled card, or a copy of it, still opens an access-list door that admits its owner. Slice 3 owns this code path now: filter revoked ids in the physical-first request and in access-list Emulate, add a test for both, and state the server position. The server can only enforce it if revocation becomes server-recorded (the global is client-written today); if that is out of scope, log it as a known best-effort gap and add a backlog entry.

**M3. Slice 5: the three-line cap would cut voiced bark text.**
"Wraps at about 24 characters, at most three lines" holds about 72 characters. Of the 122 authored `bark` fields in scenarios/, 26 are longer than 72 characters (the longest 150, in the labs). TTS speaks the whole line, so a truncated bubble would show less than the NPC says, and a bark often carries the hint ("Ask at reception"). The plan must say what a longer line does: a wider bubble or more lines up to a stated cap, paging in step with the lifetime, or a toast fallback for lines over the cap. Add a test with a long line that shows the whole text somewhere.

**M4. Slice 5: the speech bubble it promotes breaks the pixel-art UI rule.**
npc-world-bubbles.js draws with `fontFamily: 'monospace'` (a system font, not a pixel font), a 1px stroke, and `fillRoundedRect` / `strokeRoundedRect` with a radius of 4 (smooth corners, not stepped). Slice 5 makes this bubble the main place barks appear, so it must meet the rule: a pixel font (GNF, VT323 or Press Start 2P, loaded before the text is made), a 2px square stroke or stepped corners drawn in whole pixels, and a test that pins the font family and the absence of rounded-rect calls. The card for main-13 already notes the Phaser monospace font as unfinished (finding 13).

### Minors

**m1. Slice 2 mixes work that can start now with work that waits on q92 (remote tiles).** Split it: 2a (sign-in post-it, room mark, share labels, share header, share folder window) and 2b (shared sign-in module and remote tiles). For 2b, say what the server does for each Q3 answer. "The target PC's picker" can reuse GET /login_accounts with the `foothold` parameter, which already withholds the post-it, but the client skips that call for remote screens today and the plan should say the server judges reachability through the named foothold and returns tiles only then. "Captured accounts only" comes from GET /capture_secrets, which is already server-filtered; say where the portraits come from without returning tiles for uncaptured accounts.

**m2. Slice 3 placeholder Copy icon is drawn at a non-integer scale.** `assets/objects/rfid_cloner.png` is 11x22; the menu's plain-image path uses `background-size: contain` in a 64px box, so it scales by about 2.9. Use a whole-number scale (x2, centred) for the placeholder, or leave Copy without an icon until the art is approved.

**m3. Slice 5: bubble capacity and minigame behaviour for barks.** The bubble layer shows at most `MAX_BUBBLES` (4), nearest first, and hides every bubble while any minigame is open. Say what a bark does when its NPC is fifth nearest (priority over needs chatter, or toast), and when a minigame opens while a bark bubble is up (the line is lost today; a toast would have stayed). The routing test should cover both.

**m4. Slice 1: the Wi-Fi header keeps the repetition the card complained about.** The main3-02 card notes "Wi-Fi: Guest Wi-Fi, on Guest Wi-Fi" and a stale "Open it to see what it reaches" on an open view. With title "<device>: <place>" and subtitle "<device> on <place>", the title and subtitle repeat each other for every foothold kind, and for Wi-Fi the plan does not say whether the place is the network name (as `Wi-Fi: #{net_name}` today) or the access point's room. Define the Wi-Fi place, make the subtitle add something the title lacks (for example the network or the source object), and replace the stale observation line on an open view.

**m5. Slice 1: the outer 4px border stays.** network-view-minigame.css line 9 is `border: 4px solid`. The plan notes "outer 4px" and then keeps only the block's 2px frame without saying the outer frame goes to 2px or to the ui-themes skin. State it, and have the network-view test check it.

**m6. Slice 4: removing the X from `gameConfirm` changes every confirm in the game.** notifications.js serves the breaker, jack plant, power switch and other confirms. Either move it to its own small slice or list the confirms to retake (main-18, main-25, main3-14 at least), check Esc still cancels, and add a test that every confirm keeps a Cancel button.

**m7. Questions out of date.** Q9 is already answered (common brief, 2026-11-12: stepped clip-path corners are pixel art), so drop it. Q10 (prompt skin, q98) has no slice: give it one (slice 2a, which owns password-minigame.css). Add the form numbers so builders can match answers: Q1 q90, Q2 q91, Q3 q92, Q4 q93, Q5 q94, Q6 q95, Q7 q96, Q8 q97, Q10 q98.

**m8. Sync size statement is incomplete.** The rule asks what each sync sends as well as how big state can grow. Say it for the two places that touch stored state: o-link-names changes only the string written into each `player_state['footholds']` record at grant (one per foothold, bounded by the scenario's footholds, sent once in the grant answer); mock-up C's Lock is a server-side boolean on a held session that the client reads in the sessions answer and never sends back. Every other slice is client display only.

**m9. Slice 2 post-it moves have no failing test.** The sign-in post-it change is CSS only; add a CSS assertion (as slice 3 does for the clip-path) that `.password-minigame-area .postit-note` is placed at the bezel's lower-left. Add `test/js/access-signin-postit.test.mjs` to the slice's test list, since the shared sign-in module moves the code it drives.

**m10. Q8 should tell the user it reverses a decided server rule.** `rfid_unlock_card_answer` (game.rb) answers `viaCopy` with no id precisely so that one request holding every card does not reveal whose identity a list admits. Emulating one copy at a time reveals it by trial. Put that in Q8 so the user decides with that in view; if the user wants it hidden, the alternative is one Emulate that offers every saved copy in one request.

### Nits

**n1.** Slice 3's Rails test "a single-id copy request" passes without the slice (the server is unchanged). Call it a regression pin, not a must-fail test.

**n2.** Default foothold names are written at grant time, so games already holding footholds keep the old names. Fine; say so in the slice so a retake on an old game is not read as a failure.

**n3.** lab_physical_pentest has an authored `linkName` ("Drop box: comms cupboard") already in the new pattern; no change needed, but list it in slice 1's validator run since its names are the only shipped ones the default touches.

**n4.** The "Take Container" button lives in `.desktop-taskbar` today; slice 6 must keep it when the taskbar moves inside the bezel.

**n5.** Other branches carry unmerged edits to npc-barks.js, rfid-minigame.js and rfid-ui.js (merge/m03-improvement-loop, build/phone-calls and its siblings). Check whether any is still live before slices 3 and 5 start.

**n6.** Slice 2's share folder window: opening with `desktopMode` false must keep `parentLockable` so Close reopens the desktop, and the remote return path; add that to its test.

**n7.** Section 2 says "Slices 1, 3, 4 and 5 ... can run in parallel" without saying whether slice 2 joins them. It can, but slices 2 and 3 both edit unlock-system.js (sign-in and RFID blocks, far apart): say so, and merge one before the other.

## Slice order, parallelism and waiting slices

File overlaps: slices 2 and 6 (container-minigame.js and .css: sequential, as planned); slices 2 and 3 (unlock-system.js, different functions: parallel with care); slices 1 and 8 (test_access_networks: 8 after 1); slices 3 and 8 (action-menu.js copier icon: 8 after 3). Slices 1, 4, 5 and 7 share no files with each other.

Waiting on the decisions form:
- Slice 3b (o-acl-doors) waits on q97 (Q8), since the answer may change the design (M1, m10).
- Slice 2b (shared sign-in module and remote tiles) waits on q92 (Q3) for the tiles; the module extraction itself could start.
- Slice 4 waits on q91 (Q2).
- Slice 6 waits on q93 (Q4), q94 (Q5) and q95 (Q6), and on wallpaper art.
- q98 (Q10) work joins slice 2a once answered.
- q90 (Q1) blocks only any new menu entries, not the icons.
- q96 (Q7) blocks nothing.
- Slice 8 waits on the user's art approval.

## Slices that can start now

- Slice 1 (network views), with m4, m5 and n3 folded in.
- Slice 2a (sign-in post-it, room mark, share labels, share header, share folder window), with m9 and n6.
- Slice 3a (copier stepped corners, emulation screen held and breadcrumb, Take and Copy menu icons with m2's whole-number placeholder).
- Slice 5 (speech bubble barks), once the plan says how M3, M4 and m3 are handled.
- Slice 7 (pixel pass on older minigames).

Counts: 0 blockers, 4 majors, 10 minors, 7 nits.
