# test_access_sessions: Haiku regression runs, 2026-11-09

Two scripted runs of PLAYTEST.md on the keyless server, headless, after access model step 9.

## Run 1 (game 23): T1 to T5 and T11

| Beat | Result | Server record after the beat |
|---|---|---|
| T1 owner present: "Dana Reyes is using this PC", nothing opens | PASS | sessions 0 |
| T2 owner away: claim, copy a file | PASS | dana_pc = dana (claim); copiedItems dana_forecast |
| T3 owner returns: claim ends ("owner_returned") | PASS | sessions 0 |
| T4 lockChance 1: sign-in screen; password session survives the owner's return | PASS | ian_pc = ian (password) |
| T5 autoLockMin 0: locked at the moment Priya leaves | PASS | no priya_pc session |
| T11 reload: claim ended, password session kept and reopens with no password | PASS | ian_pc = ian (password) |

## Run 2 (game 22): T6 to T10, reload after T7

| Beat | Result | Server record after the beat |
|---|---|---|
| T6 autoLockMin 5: open at 4 minutes, "The screen locked" at 5 | PASS | sessions 0 |
| T7 owner knocked out: claim allowed; ended by the reload; sign-in screen after | PASS | sessions 0 after reload |
| T8 owner hidden: sign-in screen, no claim | PASS | none |
| T9 owner removed: sign-in screen, no claim | PASS | none |
| T10 unowned hot desk: sign-in screen | PASS | none |

Leak check: no sign-in details or locked contents in any response in either run (59 and the full Run 1 file). No task completed outside its own beat.

## Findings

- Both runs: an owner who has just left is still walking near their PC, so the first click can land on the owner (a conversation) rather than the PC. The game behaves correctly; PLAYTEST.md now says to wait. Filed in the ideas backlog as a play-feel question.
- Harness notes (sign dialogs, the manual clock moving every owner, `drain` emptying the buffer) are in PLAYTEST.md.
