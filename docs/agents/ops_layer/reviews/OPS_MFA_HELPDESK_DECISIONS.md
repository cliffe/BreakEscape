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
