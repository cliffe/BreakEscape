# demo_ops_passwords: implementation review R3 (delta)

Reviewer: Sonnet, read-only. Delta: `66e744ddd` (scenario dir only). Read R2 and `git show` of the delta.

**Verdict: clean.** Nothing in the delta touches what the server sends or access checks (the only scenario change is a `_comment`), so nothing needs Opus.

## R2 items

| Item | Status | Evidence |
|---|---|---|
| n1 free-play line | closed | `ama_owusu.ink` whats_next: "Next time Graham's away from his desk, try that password on his PC. Same password, typed by hand." PLAYTEST free-play line says lunch is the only window and is short (25 to 60 s). VOICED_LINES row 28 updated. |
| n2 coffee-socket order | closed | PLAYTEST: lever first, then socket off while she is on her way; the reverse order is noted. |
| n3 hub count | closed | BUILD_REPORT: up to 12 choices, still a CHECK. Hiding "Call it a day." was declined (pinned by the test); acceptable. |
| m6 suggestion | closed | `_comment` on `desk_usb_port` explains why the confirm stays. |
| Playtest: "What did that show?" early | closed | Gated `{ earn_facts_done or get_records_done }` (ink line 84). Both vars are declared and set. The recap branch for "nothing earned" is now unreachable from the hub but harmless. |
| Playtest items 3 to 11 | closed | Written up in PLAYTEST (click the post, no toast; printer refusal writes no row; harness notes; P6b no teaching toast). |

## Checks run

- Validator: 0 errors, 26 warnings (same as R2).
- Ink compile: no errors. The passwords ink and json files are unchanged by the compile.
- Scenario test (under flock): 31 runs, 713 assertions, 0 failures.

## New faults

None. Note: `git status` in the worktree showed unrelated modified `demo_ops_recon` files and an untracked `node_modules`. They are not from this delta or this review, and I did not commit them.
