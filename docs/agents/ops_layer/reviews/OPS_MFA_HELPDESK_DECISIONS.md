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
