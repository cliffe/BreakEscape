# Handover: OPS_PRIVILEGE_ACCOUNTS_PLAN, planner

Status: not started. The plan file `docs/achitechture/OPS_PRIVILEGE_ACCOUNTS_PLAN.md` was not created.

Why: the drafting run was stopped by the automatic safety classifier, and context had passed the 150k soft limit.

## Done (reading only)

- Brief, outline (S5), digests D1, D2, D4, D5, D5b.
- `docs/ACCESS_AND_NETWORKS.md` sections A5, A6, A7, A8, A9, A10, A10b, A15, A16.
- `docs/IDEAS_BACKLOG.md:197`, the per-lockout `scope` idea.
- Code locations confirmed in `app/models/break_escape/game.rb`: `access_sessions` 3231, `session_identity` 3243, `session_admits?` 3260, `admitted_profiles` 3318, `login_desktop_contents` 3337, `effective_policy` 3360, `claim_login_session!` 3527, `claim_guest_session!` 3597, `start_login_session!` 4388 (the one session writer; `signedInPcs` written there). `npc_frustration.rb:391` `record_borrow_done!` writes `guestSessions`. `network_access.rb:507-512` is the implant USB policy hook (`AccessWork.plant_refused?`). `credential_keyring.rb:265` implicit `<npcId>.password` entries, `:312` `registry_keyring_entries`.

## Open

- Everything in the plan: all 15 sections from brief section 7.
- The S5b decision on how the server learns an NPC signed in at a PC. Server-side records today: `sessions`, `signedInPcs`, `guestSessions` (borrow done), owner claims. Own-PC NPC use is client-only.

## Files touched

- This note only. Nothing committed.

## Gotchas

- `docs/achitechture/` is the folder's real spelling.
- Route the redraft to the agent type the classifier-stop rule names (opus48 retry first).
