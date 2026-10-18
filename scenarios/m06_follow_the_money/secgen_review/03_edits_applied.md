# m06 Follow the Money — edits applied, verification, open items

## Changes (file:line, repo, from → to)

| # | File:line | Repo | From → To | Resolves |
|---|-----------|------|-----------|----------|
| 1 | `scenarios/m06_follow_the_money/mission.json:5` | BreakEscape | `secgen_scenario`: `"m06_follow_the_money"` → `"break_escape/safetynet/m06_follow_the_money.xml"` | F1 (no VM bound in Hacktivity) |
| 2 | `scenarios/m06_follow_the_money/scenario.json.erb:1941` | BreakEscape | `vm_object` fallback `"title":"kali","ip":"192.168.100.86"` → `"title":"kali_cracker","ip":"172.16.0.3"` | F2 (fallback on wrong network / wrong title) |

No SecGen XML edit was needed (values already consistent; all module paths resolve).
No ink changed, so no recompile.

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m06_follow_the_money/scenario.json.erb`
  — completes; ERB re-renders to valid JSON; dungeon graph regenerated (critical path
  5 hops, unchanged). Only pre-existing suggestions/warnings remain (moral_conflict_revealed
  unused, credits fallback lines, two lobby NPCs without behavior) — none related to
  these edits.
- Grep: `192.168.100.86` and bare `"m06_follow_the_money"` gone from the two files;
  `break_escape/safetynet/m06_follow_the_money.xml` and `kali_cracker…172.16.0.3`
  present.
- SecGen module paths referenced by the XML all resolve under `SecGen/modules/`
  (`distcc_exec`, `readable_shadow`, `ssh_root_login`, `parameterised_accounts`,
  `kde_minimal`, `handy_cli_tools`, `hash_tools`, `kali_pwtools`, `metasploit_framework`,
  `nmap`, `account`, `concatenate` encoder). Static check only; no build.
- Consistency matrix (doc 02) re-run against the edited files: no remaining mismatch;
  critical path solvable end to end (all four flags reachable, concludeRequires holds).

## Open / needs author decision

1. **flag_4 priv-esc is optional, not required (pedagogy).** `hcvault` has a weak
   crackable password, so flag_4 can be read by cracking `hcvault` directly, bypassing
   the `hcops`-sudo escalation the mission frames as the point. Deliberate (XML comment),
   so not changed. If escalation should be mandatory, set `hcvault`'s password to a
   `strong_password_generator` in the canonical XML. (Author call.)

## Shared-file changes for the orchestrator

None required. The field guides touched by m06 (offline-password-cracking,
privilege-escalation, distcc-exploitation) are shared across all eight missions and
stay generic; they do not assert m06-specific VM values and need no change. The
`jtrpassword.lst` wordlist and the SecGen modules are shared and were only read, not
edited.

## Not done / out of scope
- No VM build/boot or solve (static review only).
- No commit/stash/checkout (orchestrator commits per repo, per mission).
