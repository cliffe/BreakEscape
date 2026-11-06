# Phase 1a packet notes (read with SE_BUILD_BRIEF.md)

- Your packet row is in IMPLEMENTATION_PLAN.md §4 (search `| P1-X |`); read it, the Phase 1 section
  (from "### Phase 1"), the §2.2 Phase 1a rows, and every design section the row cites. `00` wins.
- Kind of game: a lab game, education first, fictional companies only (Ledgerwell; Hampshire is
  Careers/HR). The player is a sanctioned tester; nothing here sends real mail or touches a real host.
- Phase 0 is in: `systems/global-writer.js` (writeGlobal/readGlobal), `systems/social-influence.js`
  (not needed in 1a), `systems/scenario-npc-records.js`, `minigames/framework/social-overlay.js`
  (SocialOverlayScene: own Close, capture-phase Esc layers, launchChild with returnTo/suspended,
  getTestState base; new overlays extend it), `validate_social.rb` with per-area files in
  `scripts/validate_social/`, `--strict-social`, `tools/playtest/verify-run.rb --tasks`,
  `count-task-posts.sh`, `se/check-bridge.mjs`, Source Sans 3 as `var(--se-font-readable)`.
- Art batch 1 exists (do not regenerate, do not overwrite): `assets/objects/mail_terminal.png`,
  `objects/case-file.png`, `characters/hampshire_headshot.png`, `ui/social/mail-frame.png` (9-slice
  about 8; use it for the mail window frame), `ui/social/mail-chip-attachment.png`,
  `mail-chip-account.png`, `board-cork.png` (tiles), `board-card.png` (9-slice), `board-card-pinned.png`,
  `board-string.png`; `icons/mail-{inbox,sent,new,account,unread-dot}.png` (unread dot amber;
  `mail-new.png` also marks the delayed-reply row), `icons/attach-{document,pdf,spreadsheet,archive,
  image,link}.png`, `icons/mark-{tick,cross,question,exclamation}.png`, `icons/board-{pushpin,
  slot-empty,ready,not-ready}.png`. UI art is drawn at 1x and shown at 2x with
  `image-rendering: pixelated`. Composer blanks are CSS on the `--ui-*` tokens. Board strings are SVG
  lines. Marks are always paired with words.
- Another Claude session (m09/m10 finale) edits the same tree, including phone-chat files,
  npc-manager.js, apply-actions.js, games_controller.rb, game.rb and validate_scenario.rb. Re-read any
  shared file just before editing and change only your own block.
- Tests go in `test/js/social-*.test.mjs`, `test/js/validator-social-*.test.mjs` or the Rails tree,
  with fixtures under `test/js/fixtures/social/...`.
