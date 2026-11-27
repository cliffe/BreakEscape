# P1-W: wiring for the mail client and intel board overlays

Done 2026-10-21. Not committed.

## Hunks (my blocks only)

- `public/break_escape/js/minigames/index.js`: export, import and `registerScene` for `mail-client` (MailClientMinigame) and `intel-board` (IntelBoardMinigame).
- `public/break_escape/js/systems/minigame-starters.js`: import of `socialOverlayParams`; `startMailClientMinigame(sprite, options)` (accountIds, defaultAccount from minigameData) and `startIntelBoardMinigame(sprite, options)` (`mode` default `recon`, `returnTo` from options), both on `window`, both built with `socialOverlayParams({...})`.
- `public/break_escape/js/systems/interactions.js`: plain `mail_terminal` and `case-file` branches, placed just before the "Major Incident Command Board" branch. They only open the overlay (no lock check; P1-F moves the mail branch).
- `app/views/break_escape/games/show.html.erb`: two `<link>`s after flag-station-minigame.css.
- `scripts/minigame-data-schemas.json`: `mail_terminal` (optional accountIds, defaultAccount) and `case-file` (optional mode), no required keys.
- `public/break_escape/js/core/game.js`: two `this.load.image` lines after `'phone'`. The PNGs from art batch 1 are untouched. (The game.js diff also holds the other session's mail-scheduler import and init hunks.)

## Gates

- Validator `--strict-social --no-graph --skip-ink` on test_social_slice: exit 0, zero "no schema" lines.
- Node suite (`test/js/*.test.mjs`, 1038 tests): only the Node 18 "Unable to deserialize cloned data" runner flake fails, on a varying 2 to 3 files (engine-fixes-pass3, event-mapping-unlock-door, others); re-running those files alone passes their assertions.
- Browser (keyless :3001, headless, game 2864 slice, 2865 m01): the mail terminal opens `mail-client` (title "Mail Terminal"), the case file opens `intel-board` (title "Case File"), and `minigame.close()` closes each (activeMinigame null afterwards). m01 loads, first room reception_area, its Building Directory notes object opens the notes minigame. Page errors: none; one pre-existing 404 console line, the same on m01 (source not traced).
- Playwright 1.64 needs Node 20 and the system node is 18, so the script ran under `/home/cliffe/.cache/ms-playwright-go/1.57.0/node` with the cached chromium-1148 as executablePath. Script: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/run.cjs`. All browsers closed.

## Screenshots

- Mail overlay open: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/mail-open.png
- Intel board open: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/board-open.png
- Slice room before opening: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/slice-start.png
- Closed states: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/mail-closed.png, /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/board-closed.png
- Art at 2x pixelated (mail_terminal 27x25, case-file 40x27, both crisp): /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/art-2x.png
- m01 first-room object: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-W/m01-notes.png

## Notes

- The slice's case file object sets `"sprite": "notice_board1"`, so `case-file.png` is loaded (texture exists, 40x27) but not drawn in the slice room.
- The mail overlay screenshot shows the world dimmed behind it; the board overlay is taller than the 800px viewport (the People and Company sections scroll). Left to the board packet.
