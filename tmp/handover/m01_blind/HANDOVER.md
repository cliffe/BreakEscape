# m01 blind findings: handover

Branch fix/m01-blind-findings, worktree .claude/worktrees/p-m01-blind. Commit 1e6b00c6d on top of the merge of fix/flag-malformed-feedback (aca072684).
Scratch: server :3114 running from this worktree (PID in tmp/pids/server-3114.pid, stop by PID); game 8370 (start break_room, meet_kevin completed, HaX carried) created but not yet driven; sessions 8365/8366 quit. Screenshots in /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/shots/ (8-lockout.png, 4-flagstation-key-listed.png, 4-flagstation-reopened.png).

## Done (committed)
- #4 names: both acceptsVmLabels now "ENTROPY attack server (172.16.0.2)"; Kali and drop-site observations name each other. Key-type (hintOnlyFlags) flags now listed in the SUBMITTED FLAGS list marked "key: use elsewhere" (flag-wording.js flagHistoryHtml, flag-station-minigame.js recognisedFlags, CSS, test/js/flag-history-recognised.test.mjs). Live proof OK (reopen keeps it in-session).
- #5 ROT13 sample now "The meeting is at noon" / "Gur zrrgvat vf ng abba" (note + tr command). Nothing in ink referenced it.
- #6 find_derek_access is now type unlock_room, targetRoom derek_office (ticks when the door opens, not at lockpick/key pickup). Panel cap: skipped (no engine cap; aims already auto-collapse when complete, optional tasks are dimmed). NOT yet live-proved.
- #8 password lockout: opt-in lockoutSeconds on a lock (password-minigame.js module map, unlock-system.js and minigame-starters.js pass it). Derek's computer: maxAttempts 3, lockoutSeconds 30. The attempt limit was client-only (server keeps no count), so persistence is client-side, in memory (a page reload resets it). Live proof OK: 2 wrong, close, reopen shows 2/3, third locks, reopen shows "Locked for N more seconds", correct 0419 refused during lock, accepted after expiry. test/js/password-lockout-persist.test.mjs. "My Passwords" text gained a footer pointing at the name-plus-date pattern and MMDD.
- #9 date hints: personal safe note "Keyed month first, then day (MMDD)"; Anniversary Card "(Derek keys dates month first, then day.)". Note: report assumed DDMM; 0319 and 0419 are both MMDD.
- #2 HaX text (unvoiced sendTimedMessage in agent_0x99 eventMappings) on conversation_closed:derek_lawson when !entropy_reveal_read && !derek_confronted, once. The real gate is entropy_reveal_read (reading the archive), not reporting to HaX. NOT yet live-proved: confirm the event name fires after Derek's refusal and the text arrives (game 8370, converse derek_lawson, choose "We should talk about some irregularities", close, then check phone messages).
- Validator: 0 errors, 25 warnings, same count as main. No ink touched, so no compile.

## Open
1. bin/test-js full run: 2 failures caused by my flag-station edit (source-text assertions): test/js/engine-fixes-pass4b.test.mjs test 10 ("bespoke minigames show scenario text through displayDashes", error "typed flags stay as typed") and test/js/vm-weave-engine.test.mjs test 6 ("R7: a hint-only response is neutral info..."). Both pass on aca072684. Update them to match the new buildFlagHistory (now flagHistoryHtml) and the extra recognisedFlags block in the hint branch; do not weaken what they guard (escaping, neutral hint, no success tick).
2. Rails tests (tests.lock convention, BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle): not run. Run game/scenario-related ones (test/models/break_escape/game_test.rb, scenario/validator ones).
3. Live proof of #2 and #6 (and screenshots), a screenshot of the ROT13 note / My Passwords / safe note if wanted.
4. Re-run full bin/test-js after fixing; then stop server 3114 by PID.

## Walkthrough lines to update (HacktivityLabSheets, not touched)
- Any line giving the cabinet PIN from the ROT13 example (it no longer reveals 0419; the PIN still comes from the Base64 note and the anniversary card).
- Derek's computer: 3 wrong tries now lock for 30 s across reopening.
- Flag station: flags 1 and 3 now appear in the list as "key: use elsewhere"; the badge reads "ENTROPY attack server (172.16.0.2)".
- "Find access to Derek's office" ticks when the door opens.
- Date format MMDD hint for the safe and cabinet.


## Update (second agent)
- Tests fixed: engine-fixes-pass4b test 10 now checks flagHistoryHtml behaviour (hyphens kept, no en dash; mutation confirmed it fails); vm-weave-engine R7 fixture gets recognisedFlags and asserts the key row (mutations: info->success and dropped push both fail). Full bin/test-js: 770 passed, 0 failed.
- Derek gate: ink gate is only entropy_reveal_read, set by taking (onPickup) the "ENTROPY Network Architecture" note from the unlocked archive in server_room. Reporting to HaX is not a gate. HaX text reworded (unvoiced) to say unlock the archive and take that file. conversation_closed:derek_lawson fires after the refusal (live: game 8388, text arrived in HaX thread).
- #6 live: game 8427 task stays active at key pickup, at the lock screen, and shows completed once the key is turned (client lags while the picker is open; a fresh page shows completed).
- Screenshots in scratchpad/shots/9-* and 10-*.
- NOT done: Rails tests (game_test.rb, validator/scenario ones) under tests.lock.
