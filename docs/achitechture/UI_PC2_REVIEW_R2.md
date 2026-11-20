# UI PC 2 review, round 2

Branch `build/ui-pc2`, tip 11fcc77a8, worktree `.claude/worktrees/p-ui-pc2`. Reviews the fix
round 1 commits (5cbb32d33, c0072e913, 11fcc77a8) against the R1 report and
`UI_PC2_BUILD_LOG.md`.

Counts: **B 0, M 0, m 1, n 3.** Every R1 finding is closed in code and backed by the named
tests. The live browser proof at the five sizes was not re-run this round (context budget; see
"Not checked"). Findings below are from code reading, the test suite and `git merge-tree`.

## R1 findings, each one

- **M1 (card always on the tiles) — closed.** The prompt is now its own `#signin-prompt`
  element outside the card, on a flat dark plate with no border (`password-minigame.css:1389`),
  set with `textContent` (`password-minigame.js:1816`). `syncSignInCard` hides the card when
  the form is not shown and the only text is the prompt and it is not an error
  (`password-minigame.js:1805-1817`). The test that asserted the opposite is rewritten and now
  asserts `card.hidden === true` on the tiles alone (`pc-monitor-frame.test.mjs:504,510`).
- **M2 (taskbar silhouette while the sign-in shows the headshot) — closed, server side.**
  `login_session_answer` adds `portrait` and `avatar` (`game.rb:3017-3022`), used by the
  password sign-in, both claim paths and the load `sessions`
  (`game.rb:2208,2280,2364,2435`); `pc-sessions.js` keeps them (`publicSession`,
  `pictureFields`, restore on load, sign-in and claim) and `pc-taskbar.js` builds the picture
  from them (`pc-taskbar.js:84-91,273`). Covered by `pc-taskbar.test.mjs` (empty manager keeps
  the headshot; silhouette only with no source) and `access_model_login_test.rb:54`.
- **m1 (view after the plant has no Unplug) — closed.** `plant` opens the first foothold with
  `{ atJack: jackId, jackSprite }` and `plugAndPlant` forwards the sprite
  (`network-links.js:405,449-451`).
- **m2 (refused Unplug toast covers the header) — closed.** A refusal shows in
  `.network-view-unplug-notice` under the button via `setUnplugNotice` (textContent)
  (`network-view-minigame.js:650,655-661`); `unplugFromView` calls `unplug(..., { quiet: true })`
  which returns the message instead of a toast (`network-links.js:540,560-568`).
- **m3 (Unplug row costs short landscape a third of the list) — closed in code.** A
  `(orientation: landscape) and (max-height: 460px)` rule absolutely positions the actions on
  the header row (`network-view-minigame.css:182-196`). Live overlap with the X at 667x375 and
  844x390 not re-checked this round.
- **m4 (locked + wrong at 360x640 scrolls inside the screen) — closed in code.** A locked
  screen is marked `signin-locked` (`password-minigame.js:1647`); on `data-compact` a chosen,
  locked screen folds its tiles and captured list, Change brings them back
  (`password-minigame.css:1291-1300`). This folds only the locked+chosen state, so the
  already-fitting unlocked wrong state is untouched; it matches main's existing fold on
  `data-short`/`data-ui-scale=2` (main has no sign-in card at all, so the ~24px the card adds is
  new to this branch). The 360x640 fit was not re-measured live this round.
- **m5 (one PC, two window idioms) — closed.** The share window has the reader's X
  (`container-minigame.js:970`, `#pc-share-close`); `closePc` sets `closeWholePc` and the exit
  logic lands a remote trip or closes the PC on the bezel X, while the window X and Esc go back
  to the desktop (`container-minigame.js:708-712,740-770`). One helper, `bindPcWindowCloses`
  (`pc-monitor.js:308-330`), now serves both the reader and the share; `text-file-minigame.js`
  calls it (`:144`). The CSS selector moved from `.pc-file` to `.pc-share`
  (`text-file-minigame.css:512`); the reader keeps the rule because its layout carries both
  classes (`text-file-minigame.js:168`).
- **n1 (misleading test name) — closed.** `pc-monitor-frame.test.mjs:504` now names and asserts
  the same thing.
- **R1 n5 (inventory view has no hint) — closed.** `unplugHintHtml` adds "You can unplug the
  box at its port (...)" when the view is not at a jack (`network-view-minigame.js:598-607`).

## Server change: leak, sync growth, client safety

- **No leak of an unearned account.** `login_session_answer` runs only after a correct password
  and `pc_admits_account?` (`game.rb:2199-2208`); the locked, wrong/unknown, not-permitted,
  unreachable, off and remote-blocked paths all return before it (`game.rb:2179-2212`). The load
  `sessions` map builds an entry only for a session the player already holds
  (`session_for_client`, `game.rb:2430-2437`). The values add nothing the client could not
  already see: `login_account_tiles` already serves `portrait` and `avatar` for every admitted
  account on the sign-in screen (`game.rb:2498-2512`).
- **No player_state growth.** `portrait`/`avatar` are computed from the scenario on each answer
  and never written to `player_state` (asserted: `access_model_login_test.rb:63`). They ride the
  scenario-load response (`games_controller.rb:425`, served once per load) and sign-in/claim
  responses, bounded by the number of sign-in PCs, and the client never sends the session list
  back (`sessionLockingSupported` comment, `games_controller.rb:429`). Compliant with the sync
  size rule.
- **Client-safe, not org input.** The values are scenario-authored (NPC `spriteTalk`/`spriteSheet`
  stem and `avatar`), not end-user or org text, so org-input-sanitisation does not apply. Even so
  the client never uses the raw string as a URL: `headshotKeys` reduces it to a file stem
  (`characterKey`: last path segment, extension and `_talk/_headshot/_visemes` stripped) and
  `headshotUrl` wraps it in `/break_escape/assets/characters/<stem>_headshot.png`
  (`npc-headshot.js:16-38`). The result is assigned to `el.style.backgroundImage` as a CSSOM
  property (`npc-headshot.js:161`, `pc-taskbar.js:256`), not `innerHTML`, and is painted only
  after the image loads at exactly 32x32 (`npc-headshot.js:185-190`). The sign-in prompt is set
  with `textContent` (`password-minigame.js:1816`).

## bindPcWindowCloses and the bezel X

Reader and share share the helper and behave the same: window X (`.pc-window-close`) ->
`closeByPlayer`, bezel X (`#minigame-close`) -> `closePc` (`pc-monitor.js:308-330`), each scene
defining its own `closePc` (`text-file-minigame.js:151`, `container-minigame.js:709`). The three
new share tests that click the window X do not displace the bezel X path: it is still exercised
in `container-shares.test.mjs:752, 764, 789` (plus the reader paths at `:211, 427, 520`),
including the new m5 tests that click both.

## A35 overlap with build/ui-minigames2

`git merge-tree --write-tree 11fcc77a8 build/ui-minigames2` is clean (exit 0, no conflicted
paths). `bindPcWindowCloses` adds no new conflict: build/ui-minigames2 does not touch
`pc-monitor.js`, `text-file-minigame.js` or `container-minigame.js`, and never names
`bindPcWindowCloses` or `.pc-window-close`. The one file both branches change,
`css/network-view-minigame.css`, auto-merges in separate hunks (ui-pc2's unplug notice and short
landscape rules; ui-minigames2's border colour and badge-wrap). The R1 recommendation stands:
build/ui-pc2 owns the reader's X behaviour and markup; ui-minigames2 owns the page colours.

## Minor

**m1. The refused/locked/remote negative and the remote-success cases have no Rails assertion.**
`access_model_login_test.rb:54` asserts a local sign-in and the load sessions carry the picture
and that nothing is stored, but no test asserts a wrong/locked/not-permitted response *omits*
`portrait`/`avatar`, nor that the remote-success answer carries them. The code paths are correct
(`game.rb:2195-2212`, builder shared with the remote answer at `:2435`), so this is a
coverage gap, not a defect. One test each would lock the no-leak behaviour in.

## Nits

**n1.** R1 n2 (fat-finger risk: the window X's 44px hit area reaches the bezel X's edge on a
coarse pointer) is unchanged (`text-file-minigame.css:550-555`). Latent; a real-phone look still
open.

**n2.** R1 n3 (the remote sign-in status line is ~3px wider than the card each side at 390x844)
is unchanged. Cosmetic.

**n3.** Live browser proof not run this round. The following are verified by code and the test
suite only, not re-measured at 390x844, 360x640, 667x375, 844x390, 1400x900 with real clicks:
M1 prompt rendering over a wallpaper, M2 taskbar headshot with Sam's room unloaded, m3 Unplug on
the title row not overlapping the X, m4 locked+wrong fitting 360x640, m5 share window X. The
f1 shots in `scratchpad/ui-pc2-f1/shots` are the latest live evidence; nine fresh games
(test_access_networks, ids 3807-3816) were created for an R2 run that was cut for context.

## Tests run this round (one file at a time)

- Node, all green: network-links-routing 4, objectives-network-footholds 8, access-signin-routing
  23, container-shares 45, network-view 59, pc-monitor-frame 57, pc-taskbar 31,
  password-signin-mode 64, access-remote-signin 17, network-links 70, test-bridge-access 15,
  minigame-title-escape 24, container-transfer-dialog 14.
- Rails (under the shared lock), green: access_model_login + network_remote_signin +
  network_host_service_off together = 79 runs, 800 assertions, 0 failures, 0 errors, 0 skips.
