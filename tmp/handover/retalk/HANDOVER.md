# Re-talk fix handover

Worktree .claude/worktrees/p-retalk, branch fix/retalk-restart (from fix/speaker-prefix-esd 5285ef7b5).
Needs by hand in a fresh worktree: `ln -s ../p-9-2-h/node_modules node_modules`, `ln -s ../../../vendor vendor`, `.bundle/config` copied from p-9-2-h.
Keyless server: `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true bundle exec rails server -b 127.0.0.1 -p 3082 -P <pidfile>` (start-keyless-server.sh is hardcoded to 3001). Stopped at handover.

## Done (commit 8553598dd)
- person-chat-reopen.js: resumedStoryHadOnlyTheEnd({isReopen,result,restartOnRetalk}).
- person-chat-minigame.js showCurrentDialogue hasEnded branch: such a reopen calls restartAfterEnd() and re-shows; the empty result's tags are never processed.
- phone-chat: PhoneChatConversation.restoredStoryHasOnlyTheEnd() (probes engine.continue, no tag processing, restores state if not spent) used in _showRestoredThread.
- test/js/person-chat-retalk-restart.test.mjs: 9 tests, all pass; 2 person-chat tests fail with the engine edit reverted.

## Live
- Reproduced pre-fix on m01 Fatima, game 8153: talk, choose "Don't let me keep you." (mg choose 1), close at once (mg close, inside the reply window), interact again (the first interact right after close sometimes opens nothing; repeat it) -> "(End of conversation - press ESC to exit)".
- Post-fix game 8160 same sequence: second talk shows "Sorry, I'm halfway through a candidate's file." with her choice; then choosing and reading through shows the reply, close, third talk shows the opening again.

## Open
1. bin/test-js full run not done yet.
2. Live proof on one m02 NPC (Val/Raval; m02 startRoom reception_lobby, use new-game.rb --start-room) and one tag-carrying knot (Val "I'll get you something" sets val_argument_heard; Raval bed4_assist sets globals). Show a set_global fires once: hook window.eventDispatcher.on('global_variable_changed:<name>') via the session `eval` cmd and count. No give_item knot in the affected list has the tag after the line (m09 Sorensen gives before the line), so use a set_global one and say so.
3. Note for report: restart replays the knot from 'start' or the pending currentKnot, so Sorensen's door knot would offer the bin choice again (existing behaviour for ended stories). Dropped tags never ran (save was before the tag line was read).
