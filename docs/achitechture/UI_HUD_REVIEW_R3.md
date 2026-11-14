# UI HUD review, round 3 (build/ui-hud at a2227a59a)

Counts: 0 B, 0 M, 3 m, 4 n. One older bug outside this branch is listed separately and not counted.

Merge check: `git merge-tree --write-tree main a2227a59a` with main at 5edb17541 gives a clean tree
(97702e7a9), no conflicts. Not merged.

How it was checked: read the fix-round diff (fb55a3b73 to a2227a59a, the code commits d2874ff6b,
45c2e2296, 55d7cd7e3, 545de0272) and compared the bark files with main. Live runs on a keyless server
(:3460), a fresh game from new-game.rb before each run (m01_first_contact 3889, 3892, 3893, 3898 to
3916, 3975; ca01_invoice_fraud 3920 to 3939), scrollbars shown, one browser at a time. Real functions
throughout: `gameAlert`, `objectivesManager.showTaskCompleteNotification`, `barkSystem.showBark` with
no forceToast, `npcManager._deliverTimedMessage`, `barkSystem.openPhoneChat`, `gameConfirm` with a real
click on Stay, `setHudLabel`, a real tap on the phone's back button. The R2 fix-round proof scripts
were re-run from a copy (session scratchpad `ui-hud-r3/`: `fix2.sh`, `land.sh`, `sweep2.sh`, `shots/`,
`sweep-m01.txt`, `sweep-ca01.txt`, `test-results.txt`).

Node tests, each file alone with plain node: the seven named files plus every test that imports or
reads a changed module (npc-barks, notifications, hud-lanes, phone-chat-ui, objectives panel and
manager, the changed CSS), 99 files, 1379 tests, 0 failures (ui-hud-lanes 36, bark-release-policy 31,
bark-lifetime 7, npc-bark-delay 20, phone-call-bark-hold 2, engine-fixes-round6 9,
toast-once-across-panel-handover 6). One listed file, `phone-ring-harness.mjs`, is a harness with no
tests; it exits 0.

## Round 2 findings

| R2 | Status | Live evidence (this round unless marked) |
| --- | --- | --- |
| M1 stuck bark under a dialog | Closed | 390x844: phone held 1 speech line; after the phone closed under the confirm it stayed held with the watch running (timer true); Stay clicked at its centre; shown 259 ms later, queue 0, timer cleared. `npc-barks.js:302` arms the watch before the early return |
| M2 phone layout | Closed | 390x844: compact, the second sender's earlier text sat under the phone (z 1400; a tap at its centre reached the phone header), 3 held (text, speech, text), back "Back, 3 unread", badge 3, the tap on back reached the back button and opened the list (r2_second badge 3), released in order on close at 2, 2503, 5005 ms (`a-m2__390x844.png`). 844x390: same, released at 5, 2511, 5012 ms. 1400x1000: not compact, two texts beside the phone (916 to 1380, z 9999), speech and the third text held, back count 3, released in order |
| M3 tutorial steps | Closed | 390x844 (game 3975): step 1 of 5 panel up (0 to 340), 3 barks held, none on screen, watch running; Skip hit at its centre; released at 99, 2600, 5101 ms in order, queue 0, overlay gone |
| M4 finished-task line cut | Closed at 360 and up | 360x640 m01, five at once: error toast stepped aside, brief line 84 to 172 whole in a 96 px lane, speech 328 to 448 whole, text and caption aside; the error toast came back at 2.6 s; sampler pass (`m01-scene__360x640.png`). Also passes at 390, 844x390, 915x412, 800x600, 1400. 320x568: see m1 |
| m1 pill cuts aims | Closed as wording; see new m2 | ca01 "Send the email in Derek's name" and m01 "Establish Access" take two lines at 390 and 360. 320: ca01's aim ends "email in..." (accepted: one tap to the sheet) |
| n1 CSS comment | Closed | `css/npc-barks.css:52-57` |
| n2 a text waits behind held speech | Open on wide screens only | 1400x1000: the third text was held behind kevin_park's speech until the phone closed. Moot on phones (all held). See n3 |
| n3 brief line waits 4 s | Closed | the brief toast skips the one-toast wait (`notifications.js:385-388`) |
| n4 hearts over Block at 360 | Closed | 360x640: hearts 8 to 176, Block from 188, no lift; 320x568: hearts lifted to 344 to 376, Block from 384 |

Release and voice: `public/break_escape/js/systems/bark-release-policy.js` and `bark-lifetime.js` are
byte-identical to main 5edb17541 (checked with `git diff --quiet main a2227a59a -- <path>`).
The only change near the release since R2 is the watch at `npc-barks.js:302`; `releaseHeldBarks`,
`_voiceEnd` and `_speakBark` are untouched. The server was keyless, so voice-end waits were not
exercised live.

## Size sweep (five at once: error toast, finished task, phone text, speech from an unloaded person, caption)

Sampler: any overlap fails, and any line cut by its lane for three samples in a row (750 ms).

| size | m01 | ca01 (no Block/Punch, no hearts) |
| --- | --- | --- |
| 320x568 | fail: error toast cut 39 px, speech 46 px (m1) | pass |
| 360x640 | pass | pass |
| 390x844 | pass | pass |
| 844x390 | pass | pass |
| 915x412 | pass | pass |
| 800x600 | pass | pass |
| 1400x1000 | pass | pass |

Shots looked at: `m01-scene__360x640`, `m01-scene__390x844`, `m01-after__320x568`,
`m01-scene__844x390`, `m01-scene__1400x1000`, `a-m2__390x844`, `b-land__844x390`, and crops of the pill
(`crop-pill-360.png`, `crop-pill-ca01.png`).

## Minor

### m1. 320x568: the error toast comes back over the budget and the speech line and toast are both cut
`public/break_escape/js/ui/hud-lanes.js:391-407` (toasts come back as soon as no brief line shows),
`:307-318` (`placeHearts`), `public/break_escape/js/systems/notifications.js:229-243`.
Live, m01 game 3900: while the brief line shows, everything fits (brief 84 to 172, speech 216 to 336
whole). When the brief line goes (5 s), the error toast returns at once (three lines, 143 px) while
the speech line is still up; the lane budget, already 84 px shorter because the lifted hearts move the
dock top, cannot hold both, so the toast is cut by 39 px (its last line) and the speech line by 46 px
(more than a third of it) until one of them ends. ca01 at 320 passes, because with no Block/Punch
there is no lift.

Judgement: not acceptable as it stands, but not worth more lane space either. At 320 a player sees a
speech line with its end missing and a refusal with its last line gone, for several seconds. Neither
needs to show at that moment: the toast has already been read once (it came first) and is only coming
back. Fix: a toast returning from stepping aside comes back only when it fits whole; until then it
stays aside with its countdown paused (the same rule texts already follow). If it is still aside when
its speech line ends, it shows then. Nothing about the hearts or Block/Punch needs to change. Add the
320x568 five-at-once case to the sweep. A cheaper fallback, if the fixer prefers: accept and document
320 as below the supported floor (the narrowest phones in common use are 360 wide), but the return
rule is a few lines and also covers a landscape screen with a long speech line.

### m2. The two-line pill on upright phones cuts the bottom of its second line
`public/break_escape/css/objectives.css:25-27` (`.objectives-panel.collapsed { max-height: 40px }`),
`:500-516` (the two-line rule).
At 360 and 390 the pill measures 56 screen px (40 px at the HUD zoom of 1.4) while its text box runs to
66 of a box ending at 70; the frame's inner edge covers the last rows of the second line. In the crops
the bottoms of "Access" (m01, 360) and "Derek's name" (ca01, 390) are missing, so the line reads as
cut, though the scroll check in the proof (`scrollHeight <= clientHeight`) says it fits. Fix: in the
two-line rule raise the collapsed panel's max-height to fit two 18 px lines plus the header padding
and frame (about 58 px before zoom), and check that the lanes measure the taller pill (they read the
pill's rect, so they should).

### m3. A repeat of a toast that has stepped aside restarts its countdown while hidden
`public/break_escape/js/systems/notifications.js:371-377` (the duplicate path calls `startCountdown`),
`:229-243` (`laneYieldHandler`).
While a finished-task line shows on a phone, an older toast steps aside (display none) with its time
left saved in `_yieldLeft`. If the same toast is raised again meanwhile (the player tries the locked
door again), `findShownDuplicate` finds the hidden copy and restarts its countdown. The toast stays
hidden, so the player sees no answer to the second try; if its duration ends before the brief line
does, it is removed unseen; if not, the brief line's end replaces the fresh countdown with the old
time left (at least 1.5 s), so the refresh is lost. Not seen live (found by reading); no test covers
it. Fix: in the duplicate path, when the copy has `hud-lane-yield`, set `_yieldLeft` to the new
duration instead of starting the countdown, and add a unit test.

## Nits

- n1. `refreshBackUnread` calls `listContacts` on every bark while the phone is open
  (`phone-chat-ui.js:637`, via `npc-barks.js:183`), and `listContacts` logs "Filtered to n contacts"
  each time (`phone-chat-ui.js:619`). Console noise only.
- n2. The back badge uses the contact list's `unread-badge` look: GNF at 12 px
  (`phone-chat-minigame.css:221-223`), so the count is a small, slightly soft digit (`a-m2__390x844.png`).
  It is the existing badge, and reusing it is right; a 16 px count would read better in both places.
- n3. Wide screens: R2 n2 still stands (a text for another thread waits behind held speech until the
  phone closes). Small and older; leave unless the speech hold is touched again.
- n4. A finished-task line hides an error toast that came first for up to 5 s (by design, M4). It
  answers the player's last action, so this is the one case where the jump costs something; m1's
  return rule and m3's fix keep it from being lost.

## The questions asked

- 320x568 limit: see m1. Do not take space from anything else; hold the returning toast until it fits.
- The landscape phone's second reply: older, not this branch. The phone and minigame CSS on this
  branch differ from main only by the new `.back-button .back-unread` rule
  (`phone-chat-minigame.css:282-288`; main lines 968 to 969 are 976 to 977 here); `minigames-framework.css` and the phone minigame JS are
  identical to main. Live at 844x390 (game 3892), the header is 73 to 135 with the badge and without it
  (badge hidden and re-measured), and the replies are at 257 to 295 and 301 to 338 either way, so the
  badge moves nothing. See "Older, outside this branch".
- Back-button count on wide screens: keep. It reads the thread histories, so it is right on any size,
  and it outlasts a text beside the phone that times out. It also matches the contact list's badges
  (live, 1400: back 3, r2_second 3).
- Finished-task lines jumping the toast queue: keep. The line has to show with the pill's blink to mean
  anything; a waiting info toast goes after it (the brief counts as shown, so `headDue` waits). Only
  the hidden error toast costs anything (n4, m1, m3).
- Bark release and voice code: unchanged from main (above).

## Older, outside this branch (not counted)

At 844x390 and 915x412 the phone frame is 273 px tall (`phone-chat-minigame.css:10`,
`min(700px, max(70vh, calc(100vh - 125px)))`), and the header, the message pane's 96 px minimum
(`:976`) and the choices' 64 px minimum (`:977`) do not fit in it. The choices list runs past the
clip: the first reply is cut (257 to 295 against a frame ending at 293) and the second (301 to 338) is
drawn under the clip, invisible, and a tap at its centre reaches the minigame's "Add to Notepad"
button (309 to 374) (`b-land__844x390.png`). The list does not scroll (scrollHeight 97 = clientHeight
97), because the container itself is taller than the space left. A player on a phone held sideways
cannot pick the second reply by touch; keys work on a desktop. Main has the same CSS, so this predates
the HUD work. Worth its own ticket (Major for phones held sideways): on short screens let the choices
take the space below the header and scroll inside the frame, or shrink the message pane's minimum.

## Not checked

- M2 at 360x640 and 915x412 not re-run (fixer's runs passed; 390x844, 844x390 and 1400x1000 re-run).
- Two brief lines at once (a task that also completes its aim) at 320 and 360: not run. Both are
  brief, so neither steps aside, and `notifyFloor` can take the whole free height.
- Voice-end waits (keyless server).

## Checked and fine

- Pixel-art rule: the new CSS adds no radius, soft shadow or gradient; the badge has a 2 px border; the
  pill keeps the square skin.
- Sync size: nothing touches player_state or any synced record.
- Harness copies: the three stubbed tests pass with the new `__dialogOpen` stub.
- Hearts lift: `heartsLift` is measured with the lift cleared (`hud-lanes.js:307-318`), so it cannot
  flip between frames; the lifted hearts at 320 sit over the room, clear of Block/Punch by 8 px.
