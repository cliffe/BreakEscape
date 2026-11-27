# Re-talk fix handover 2 (2026-11-18)

Branch fix/retalk-restart, main merged (merge commit, no rebase). Server :3087 and sessions stopped.

## Done
- bin/test-js after merge: 761 pass, 1 fail: phone-call-notes-paths.test.mjs (its stub conversation lacked restoredStoryHasOnlyTheEnd). Stub fixed with one line; that file 15/15 and person-chat-retalk-restart 9/9 pass. Full bin/test-js NOT re-run after the stub fix.
- Live m02 on keyless :3087, own games 8212, 8214, 8216, 8223, 8230, 8238, 8243, 8257, 8268 (new-game.rb --start-room ward_hall --set cover_burned=true; walk to office_corridor; Val's catch chat opens). Val: choose "Somebody phoned...", then "I'll get you something", close with X on the reply "I'm stood in a corridor..." (page poller on innerText, 10 ms). Reload (bootstrap resume:"resume"), re-talk: real conversation "Back again. Have you got something for me this time?" with choices, not "(End of conversation)".
- Read-through case (8223): val_argument_heard event fired once, reload, re-talk real conversation, no global/task/toast events on open.

## Open / unexplained
- Close-at-reply case: at close val_argument_heard was false client-side and no write for 8 s, but a later sync (after the bridge `sync` command, before reload) carried globalVariables val_argument_heard=true and the server then held true. My hooks (emit wrap, defineProperty on globals, fetch wrap) saw nothing. Cause unknown (maybe the bridge sync, a server write). Repeat without the `sync` command, read the DB read-only (rails runner) before and after, count sync_state bodies in tmp/keyless-3087.log. Only one delta seen, nothing fired twice.
- Phone NPC live re-talk (agent_0x99 / ghost in m02) NOT done.
- Helpers (untracked scratch) in tmp/: launch.sh, send.sh, ev.sh, adv.sh, hook3.js.
- Gotchas: bootstrap resume:"new" (default) makes a NEW game; use resume:"resume" after reload. pressKey is refused inside a minigame; the chat auto-advances. Do not pgrep -f and kill in the same shell command as a heredoc (killed the shell).
