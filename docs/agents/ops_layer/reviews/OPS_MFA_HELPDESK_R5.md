# OPS_MFA_HELPDESK_PLAN, round 5 (delta review)

Delta: `git diff 1754dfe69 f38f82993 -- docs/achitechture/OPS_MFA_HELPDESK_PLAN.md`. Plan lines
are from f38f82993. The log plan was read from the working tree (it has uncommitted edits); its
S8 rows (`OPS_LOG_ROWS_PLAN.md:1074-1083`) match HEAD.

## Checks that passed

- **Removal of S8c.** No reference left to 4.3, 5.5, 5.6, `lockSteps`, `secondStep`, L1/L2,
  `/unlock`, archives or doors, apart from the two "Related plan" pointers (7-9, 144-145), 5.2's
  subject sentence (273-281), section 6's one sentence (673-674) and request 11 (1062-1065).
  Requests run 1 to 11 and questions 1 to 6; 15 cites 5.4 (1070), 9 cites question 6 (785).
- **State keys.** "Five server-owned keys" (729) and five rows (736-740); "five" again at 435
  (section 10) and 823 (proof 1) and in section 12 (957).
- **R4 F13** done (126). **R4 F16** done (question 6, 1104 onward; 785).
- **Sign-in order** (283-298) agrees with the privilege plan (`OPS_PRIVILEGE_ACCOUNTS_PLAN.md:139-141`,
  `:948`) and the code: key built at `game.rb:3483`, admission ends `:3492`, failures cleared `:3494`.
- **Code claims added by the delta.** `pc-sessions.js:552-554`, `:555-562` (`_replace` at 560),
  `:619-621`, `password-minigame.js:2492-2495` all hold.
- **5.3 read end to end.** Nothing about locks remains; scene count (three) and route count (five
  `/mfa/*`, six with the desk) agree with sections 6 and 12.
- **Log section.** Signature matches `OPS_LOG_ROWS_PLAN.md:741`; `save_limit` meaning matches
  `:753`, `:854-860`; `once:` with `typed` refused matches `:752`; `approver` and the route list match
  `:1079`, `:1099`; `note_issued_secret` and `register_secret_source` match `:814-825`. Event names
  are snake_case.
- **No review or round references** in the plan.

## Findings

**F1 (minor). Recovery answers registered as secrets collide with names and ids.**
Plan 1007 registers every `creds.recovery` value with the log guard. The plan's own example
answer is a person's display name (`"manager": "Moira Kerr"`, 197), and section 7 says these
facts are in the world by design (693). The log plan's registry "holds no display names, ids or
usernames" (`OPS_LOG_ROWS_PLAN.md:827-829`, test at `:542`), its matcher compares every `as`,
`where` and `detail` string exactly with each secret and raises in test and development
(`:831-842`), and the leak scanner reads the secret list to scan `/log_rows` bodies (`:845-847`).
An author who writes a recovery answer equal to an NPC id, a username or a shown display name
(the natural answer to "who is your manager") makes ordinary rows raise in tests, or the
scripted playtest report a leak when a reader shows that name.
Fix: a validator error when a recovery value, compared as the matcher compares, equals any
scenario id, account username or NPC display name; or register only `creds.resetPassword` and say
why the recovery values, which are public facts, are not registered (and tell S9).

**F2 (minor). `relay` on `mfa_challenge` cannot occur.** Plan 1016 lists `relay` among the route
codes, and the decisions file justifies it by the pending record storing `relay` (355). A typed
sign-in never has a relay: `POST /login` with `relay` is refused before `attempt_login!`
(`games_controller.rb:1549-1552`), `attempt_login!` takes only `foothold:` and `from:`
(`game.rb:3444`), and `typed_route_refusal` takes the same two (plan 363). The pending record's
`'relay'?` is never written.
Fix: drop `'relay'?` from the record (355) and say the row registers the shared list but
`mfa_challenge` only ever carries `keyboard`, `foothold` or `from`.

**F3 (minor). "Each outcome writes one `helpdesk_request` row" is no longer true.** Plan 668.
Section 13 has a repeat of a granted request write no row (1030-1031), a blocked call past its
`save_limit` write none (1024), and the helper writes none when the typed username equals a
registered secret (`OPS_LOG_ROWS_PLAN.md:835-838`).
Fix: "Each outcome writes at most one `helpdesk_request` row (section 13)."

**N1 (nit).** The section 8 table (740) is followed straight by a paragraph (741) with no blank
line; in GitHub Markdown that paragraph renders as a table row. Add a blank line.

**N2 (nit).** "Details are closed codes" (994) is not true of `agent`, an NPC id (1025;
`OPS_LOG_ROWS_PLAN.md:1100`). Say "Details are closed codes or ids".

**N3 (nit).** "in any five minutes of server time" (981-982) reads as a sliding window; the
helper's window starts at the first stored call and resets after five minutes
(`OPS_LOG_ROWS_PLAN.md:856-859`), so up to twenty can store across a boundary. Use "in each
five-minute window", as the table does (1024).

**N4 (nit).** The secret-source tests (1010-1012): no row of this plan has a field that could
hold a six-digit code or a matching number, so say how the M1a and M3 cases put one in (for
example a `typed` value after `note_issued_secret`, which writes no row). `POST /mfa/approve`
also computes the numbers to judge a tap, so it should note them too (1006 names only the
pending-record write and the phone list).

**N5 (nit, not delta).** Plan 514 cites `pc-sessions.js:607` for the fallback message; it is
`:606`.

**N6 (nit).** Plan 36-37: "a way in that proves no password does not" can read as a saved
connection skipping the step; it is refused (330-349). Add "and a saved connection is refused".

## Summary

| Severity | Count | Findings |
|---|---|---|
| Blocker | 0 | |
| Major | 0 | |
| Minor | 3 | F1, F2, F3 |
| Nit | 6 | N1 to N6 |

**Verdict: can stop review.** No blocker or major; the three minors are local fixes a reviser can
make without another round.
