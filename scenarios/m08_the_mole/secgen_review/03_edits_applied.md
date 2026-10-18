# m08_the_mole — edits applied

All edits are in the **BreakEscape** repo. No SecGen XML change was needed (the VM is correct
for the story). No ink changed, so no recompile. No shared files edited.

## Changelog (file:line, from → to)

1. **`scenarios/m08_the_mole/mission.json:5`** — resolves FINDING 1.
   `secgen_scenario`: `"m08_the_mole"` → `"break_escape/safetynet/m08_the_mole.xml"`.
   The bare name is not in Hacktivity's `SCENARIOS` set, fails the inclusion validation and
   binds no VM; the XML-path-relative-to-`scenarios/` form is the confirmed correct value.

2. **`scenarios/m08_the_mole/scenario.json.erb:1837`** — resolves FINDING 2.
   `vm_object('attack_vm', …)` fallback `ip`: `"192.168.100.50"` → `"172.16.0.3"`.
   The fallback IP was off the target's 172.16.0.x network; a standalone player would see a
   placeholder on the wrong net. `172.16.0.3` is the attack VM's address per the canonical XML.
   The lookup title `attack_vm` and display `title:"kali"` were already correct and unchanged.

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb` — no errors;
  ERB re-rendered to valid JSON; dungeon graph regenerated (Puzzle 62 nodes / 78 edges;
  critical path 5 hops ending Confront The Mole → Close The Investigation). Only pre-existing
  SUGGESTION/GOOD-PRACTICE notes (unconditional-credits-line suggestions, PC-container
  suggestion) — unrelated to this review.
- Ink: not changed, no `compile-ink` run needed.
- Grep confirmed: `secgen_scenario` is the new path and the bare name is gone; the fallback
  IP is `172.16.0.3` and `192.168.100.50` no longer appears anywhere in the mission.
- SecGen module paths referenced by the XML all exist under `modules/` (static check, no build).

## Still open / needs author decision

- **Flag 1 vs 2 emit order (per-build).** Both come from `gitlist_040` (`strings_to_pre_leak`
  then `strings_to_leak`). The game assumes recon=flag1, creds=flag2 (XML document order). A
  SecGen build-and-solve would confirm the module emits them in that order. No action unless a
  build shows otherwise.
- **Target-server IP not surfaced in-game.** The game never prints the gitlist server's
  172.16.0.2; the player gets it from recon on the VM. Intentional, left as-is.
- **mission.json `secgen` block (line 80–81).** The descriptive `"scenario"` string there
  (`"m08_the_mole (Break Escape SAFETYNET: Mission 8 — The Mole VMs)"`) is documentation, not
  the binding field, so it was left untouched. Author may wish to align its prose with the new
  path for tidiness; not a functional issue.

## Shared-file changes for the orchestrator

None. No SecGen module under `modules/` and no cross-mission field guide needs a change: the
VM is internally consistent, the referenced technique guides are generic and name no stale
m08 value, and there is no in-mission `secgen/` copy to reconcile.
