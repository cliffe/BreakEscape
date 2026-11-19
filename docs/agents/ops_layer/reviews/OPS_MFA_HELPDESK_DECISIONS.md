# OPS_MFA_HELPDESK_PLAN, decisions on review findings

Round 1 (`OPS_MFA_HELPDESK_R1.md`). Every major and minor was acted on. No finding was declined
outright. The entries below are where the plan took a different fix from the one suggested.

| Finding | What the plan does instead | Why |
|---|---|---|
| F12 (major) | Takes option (b): `policies.*.mfa` ships with the policy and is declared public. `mfaDeclared` is removed | Orchestrator ruling: a policy's kind is public, its answers are not. Stripping it would need a filtered policy copy for three client readers and protects nothing usable |
| F14 (major) | Keeps re-enrolment onto the player's own phone and gives it a flow: a "My phone" button on the sign-in pane opens the code or approval scene as a child, with no phone item. `GET /mfa/phone` takes `own=1` and never calls `held_friendface_phone(nil)` | Suggested fix put the code and Approve in the pane itself; reusing the two child scenes costs no new scene and keeps one look for a phone |
| F17 (minor) | `mfaPrompts` counts only requests the owner received, with `>=` | Suggested fix was to document that held-phone requests still tire the owner; not counting them is simpler to explain |
| F18.1 (minor) | Keeps one tries key per typed username, normalised, control characters stripped, cut to 64 code points; the test promise is reworded | One shared key for unknown names would let `blocked` versus `refused` tell known accounts from unknown ones |
| F18.2 (minor) | Stated as best-effort, with "met and not knocked out" as the sanity check; no room check | The rules that grant (`questions`, `callback`) are server-enforced; a room check would break phone-contact desks |
| F19 (minor) | Recovery answers may appear in ink; the ink error is kept for `resetPassword` only | Conversation is a fair source for a fact about a person; the `recovery` map itself is still never sent |
| F20 (minor) | Keeps real time with a `codeExpired` answer that counts nowhere; the attempt-bound code is option (b) of open question 1 | As suggested; noted here because the clock stays a user choice |
| F27.5 (minor) | No hand-back flow is designed. Beat F5 shows the device route refusing after a drop; a give-back ink tag is option (b) of open question 4 | No existing tag passes an item from the player to an NPC, so the suggested "works with the current give tag" does not hold |

Round 1 additions beyond the findings:

- A third flat state key, `mfaAccounts` (`started` and `used` per account), beside the ruled
  `mfaPending` and `mfaPrompts`. It holds the counter the number match is derived from (F15) and
  the last used code window (F16).
- Settled defaults (former open questions 2, 3, 4, 8, 10, plus fatigue scope, screen unlock and
  lockouts after a reset) are in plan section 5.5.

Round 2 (`OPS_MFA_HELPDESK_R2.md`). Both majors and all eleven minors were acted on, with the
round 1 items marked partly closed (F7, F10, F8, F13). Entries below are the finding declined and
the places where the plan took a different fix.

| Finding | What the plan does instead | Why |
|---|---|---|
| F27.5 note in check 1 (nit) | Declined: open question 3 (b) still names a new give-back ink tag, not the office-life pickup of a dropped item | The `npc-needs.js` pickup was not read this round, and the question stays with the user either way |
| R2-1 (major) | The pickup test runs only on a stored NPC drop: an item marked `added` whose id is not in `droppedItems` | The suggested mark alone would still refuse a player who drops an authored loose device and picks it up again, because a player drop keeps the item's `owner` |
| R2-3, check 3 third bullet (minor) | One rule, `code_state`: right, stale (`used` or `expired`, uncounted) or wrong | Orchestrator ruling: merge the two rules |
| R2-8 (minor) | The `generation` argument is removed. A re-enrolled account's code is keyed on `own:<npcId>`; the old device keeps showing its own code, which never verifies | Same outcome as the suggested "serves generation 0", with one less parameter and no 403 special case |
| R2-9a (minor) | The no-screen approval moved to a later slice, so `takeCompleted` is only ever set by a child of a suspended sign-in screen, and a forced child close clears it | Orchestrator ruling 1 |
| R2-11 (minor) | A saved connection to an MFA PC is refused at sign-in (`typeToSignIn`); the validator warns | Orchestrator ruling 1: a runtime refusal with a reason code, not a validator error |
| R2-7 (minor) | Lists three existing build sites (`game.rb:3483`, `:3580`, `access_work.rb:1393`) and two split sites | A grep found no fourth builder; `credential_login.rb:59` calls `account_locked_out_at?` |
| R2-14 (minor) | Keeps the log plan's event names; registers a third `by` code (`own_phone`); drops `request` from `mfa_prompt_sent` and the detail on `mfa_expired`; `as: nil` for an unknown username | Each plan registers its own events (log plan 13.5); a per-request number would stop the run merging, which the orchestrator ruled it must |
| R3-N1 (major) | Put to the user as open question 5; body written to a five-minute closure on server time (the finding's option c). The validator warning covers the per-PC lockout that wrong codes feed, not the cap | Under a timed closure the cap cannot strand a scenario, so the only "limit with no way to reopen" left is the policy lockout |
| R3-N2 (minor) | Fixed differently: `lastRead` is keyed by account and source as suggested, but a re-enrolled account's old device answers `enrolled: false` with no code at all, instead of a code plus a flag | Nothing to pre-fill or mistype if no dead code is shown |
| R3-N3 (minor) | Fixed differently: every `helpdesk_request` row is `as: { typed: }`, not `as: nil` on refusals; `agent` dropped from that row | Orchestrator ruling 3. `agent` dropped because a typed username plus a 40-character agent would pass the log plan's 400-byte row ceiling (estimate; S9 asked to recompute) |
| R3-N4 (minor) | Fixed differently: the blocked branch passes `once: true` and saves only when `r&.stored?`, not `merge_limit: 10` | Orchestrator ruling 4; a blocked desk stays blocked, so one row per desk, typed username and `what` says it all |
| R3-N7 (minor) | Fixed as a validator warning for a loose owned phone plus an information line per code device, not a unit test over rendered scenarios | Orchestrator ruling 5; the validator already runs on rendered scenarios and proof 4 runs it over all of them |
| R3-N8 (minor) | Fixed differently: the saved connection is refused with `typeToSignIn: "password_changed"` until the new password has been typed once, per account, not `ended: true` | Orchestrator ruling 5: it should work again after a typed sign-in, which `ended` would not allow |
| R3 trim list | Applied in full, with further cuts beyond it; the plan ends at about 1100 lines, not under 1000 | The R3 rulings added about 70 lines of rules, tests and a question; the validator warnings and controller cases were tabulated, but nothing a builder needs was cut to reach the number |
| Coordinator, 2026-11-19 | Section 5.2 states the second step as owner-and-subject functions; "Later slices" names S8c | New user requirement; S8c itself is not designed here |
| R4 split | S8c removed from this plan whole (4.3, 5.6, its rows in sections 3, 6 to 13, requests 11 to 13, questions 6 to 8); it lives in `OPS_LOCK_SECOND_STEP_PLAN.md` (A25) | Coordinator ruling after R4. This plan keeps the owner-and-subject sentence in 5.2, one sentence in section 6 and request 11 |
| R4-F1, F2, F3, F4, F6 to F12, F14, F15, F17, N1 to N3 | Not acted on here | S8c only; they go to the lock plan |
| R4-F5 (minor) | Declined for sign-in: the phone listing waiting requests with no pane open stays a later slice | The contradiction was with the lock text, which has left this plan; `GET /mfa/phone` here is only reached from the pane's child scene |
| R4-F16 (minor) | Fixed differently: the desk half is question 6, not 9; the lock half left with S8c | Questions now run 1 to 6 |
| R4 trim list | S8a and S8b rows applied (33-37, 2.4, later slices, 5.4 and 5.5 merged, section 10 rows collapsed, JS tests as a table, requests 1 to 6 shortened); the S8c rows went with the split | Plan is 1115 lines |
| Log R4 section 4 | `by` renamed `approver` on the log row only; the client event `mfa_approved { by }` keeps its field | The reserved name is a log detail rule; the client event is not a log row |
| Log R4 section 4 | "Second-step seeds" not registered as a scenario field | This plan authors no seed: the code key is the application's secret. Codes and matching numbers are noted on issue; `creds.recovery` and `creds.resetPassword` are the registered fields (H1) |
| Log R4 section 4 | `route` takes all four shared codes, including `relay` | The pending record stores `relay`, so a challenge can start over one |
| Request 8 (S9) | Reduced to "nothing further asked" | The log plan now registers these rows as this plan writes them |
| R5-F1 (minor) | Fixed differently: only `creds.resetPassword` is registered; recovery answers are not, and no helpdesk row stores a typed answer | Orchestrator ruling; recovery answers can be public facts that collide with ids and display names. Secret table and guard test row updated |
| R5-F2 (minor) | Applied: `relay` dropped from the pending record and from `mfa_challenge` `route`. Supersedes the "Log R4 section 4" `relay` row above | A typed sign-in with a relay is refused before `attempt_login!` (`games_controller.rb:1549-1552`, `game.rb:3444`) |
| R5-F3 (minor) | Applied: "at most one `helpdesk_request` row" | Matches section 13 |
| R5-N1 to N6 | All applied (blank line after the state table, "closed codes or ids", "each five-minute window", M1a/M3 guard tests via `typed` after `note_issued_secret` and `/mfa/approve` noted, `:606`, saved connection refused in the section 1 sentence) | One-line fixes |
