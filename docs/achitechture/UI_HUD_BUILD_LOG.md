# UI HUD build log (H1 and B2, option A of each)

Branch build/ui-hud, worktree .claude/worktrees/p-ui-hud, from main fc4b4d8a5, main merged in again at 61c033b13.

User picks (2026-11-14): H1 A, four lanes on the phone HUD; B2 A, bark toasts split by source.

## What changed

- `js/ui/hud-lanes.js` (new). Measures the top bar (objectives, menu buttons) and the dock (tray, avatar and hearts, Block/Punch) and places two lanes between them: the notify lane (system toasts, then phone texts) under the top bar, and the message lane (the caption, then speech from someone in the building) above the dock. Pure parts: `computeLanes`, `stackMembers`, `laneYields`, `laneBudgetShare`, `barkSource`, `arrowDirection`, `isCompactViewport`.
  - The lanes together use at most 75% of the free height on a phone held upright, 95% on a phone held sideways (500 px tall or less), 80% on a wide screen. Space no message needs is split 4:3; when the messages need more than the budget it is split by need. So the lanes never meet.
  - When the messages need more than the budget, the caption steps aside first (it comes back on the next hover or tap), then the phone texts (still in the phone thread with the unread badge). Speech and toasts never step aside.
  - Members are placed one after another inside a lane, each limited to what is left; a member's content past its limit is clipped by the lane, never drawn over the next lane.
  - Started at boot from `ui/hud.js` (dynamic import, so no test harness copy lists change) and again by the bark system; re-placed on resize, on any size change of a member or anchor (ResizeObserver), when HUD pieces come and go, when the caption shows or hides and when toasts come and go. Class writes happen only on change, so placing never triggers itself.
  - `body.hud-compact` marks the phone layout (under 900 px wide or 500 px tall or less).
- Bark toasts (`js/systems/npc-barks.js`, `css/npc-barks.css`, `css/ui-themes.css`). `barkSource`: phone contacts (and timed messages, which are texts whoever sends them, `channel: 'phone'` in `npc-manager.js`) go to `#npc-bark-container` as a phone notification: theme square frame, green stripe, phone icon, headshot, X, tap opens the thread. People in the building who are out of view go to the new `#npc-speech-container` in the message lane: caption frame, headshot, a pixel arrow towards the speaker, not clickable (pointer-events none), no X. The text is unchanged (`Name: line`), so nothing new is spoken and cached audio still matches. An NPC whose room has not loaded is looked up in the scenario. Headshots use `applyHeadshotBox` from `utils/npc-headshot.js`. "Clear all" shows only with two or more texts. No soft shadows or hover jumps.
- Toasts (`js/systems/notifications.js`, `css/notifications.css`). One toast at a time on phones (`maxShownToasts`), the rest queue; two lines of message (three for warnings and errors); verbatim toasts (a password to copy) are never cut.
- Objectives (`js/ui/objectives-panel.js`, `css/objectives.css`, `js/systems/objectives-manager.js`). On phones the panel loads collapsed as a one-line pill (current aim and n/m) that stops short of the menu buttons, never opens by itself, and opens on tap as a sheet with an X. The four objective toasts fold into the pill: it blinks (stepped, 2 px outline) and shows "Done: task" and the like for 4 s. Wide screens keep the open panel and the toasts. This also settles the integrator's minor: at 390x844 the panel no longer expands over the canvas centre (centre hit test in every proof run lands on the game, not the panel).
- `.popup-overlay` (integrator minor): the empty div in `games/show.html.erb` had no CSS anywhere, so its `active` class did nothing; removed with the two lines in `minigame-manager.js` that toggled it.

## Proof

Scripts and shots: scratchpad `ui-hud/` (`proof.sh`, `scene.js`, `measure.js`, `order.js`, `shots/`, `proof-*.txt`). Game: m01_first_contact, keyless server on :3460. Each size: rest, each lane alone (toast, task, phone, speech, caption, combat), then all at once (access-denied toast, task complete, phone text, speech line, caption, Block/Punch, tray). Every pair of HUD boxes from different groups is tested for intersection.

| size | rest | each lane alone | all at once |
| --- | --- | --- | --- |
| 390x844 | none | none | none (caption stepped aside for speech) |
| 844x390 | none | none | none (caption and phone text stepped aside) |
| 915x412 | none | none | none (caption and phone text stepped aside) |
| 800x600 | none | none | none |
| 1400x1000 | none | none | none |

Bark order and timing (live, 390x844): three barks held behind a conversation, released FIFO (speech, phone, speech) with gaps of 2548 ms and 2503 ms (HELD_BARK_GAP_MS 2500). The release policy and voice waits are unchanged; bark-release-policy and bark-lifetime tests pass.

## Tests

New: `test/js/ui-hud-lanes.test.mjs` (lane maths at the five sizes, stacking, yields, budget, source split, arrow, bark DOM split and click behaviour, CSS rules, one toast on phones, pill summary and folding). Run plain `node file` for every test file that imports or reads a changed module.

## Open

- Phone texts that step aside on a short landscape screen keep their lifetime running; they stay in the thread and the badge, but may close unseen if the toast or speech outlasts them.
- The pill text at 390 shows about ten characters before the ellipsis; the full aim is one tap away.
- The arrow points from the player to the speaker's sprite at the moment the line shows; it does not follow movement.
- Toast type stripe under the theme skin (critique T1) is not part of this build.
