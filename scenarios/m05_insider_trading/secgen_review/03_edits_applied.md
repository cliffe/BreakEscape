# m05 Insider Trading — edits applied

## Changelog (file:line, repo, from → to)

1. `scenarios/m05_insider_trading/mission.json:5` (BreakEscape) — resolves F1
   `secgen_scenario`: `"m05_insider_trading"` → `"break_escape/safetynet/m05_insider_trading.xml"`

2. `scenarios/m05_insider_trading/scenario.json.erb:1806` (BreakEscape) — resolves F2
   vm-launcher fallback `"ip":"192.168.100.75"` → `"ip":"172.16.0.3"`
   (full field: `vm_object('attack_vm', {"id":5,"title":"kali","ip":"172.16.0.3","enable_console":true})`)

No ink changed. No SecGen XML changed (the canonical XML is internally consistent and
solvable; the drift was all on the game side). No in-mission `secgen/` copy exists.

## Verification

- `ruby scripts/validate_scenario.rb scenarios/m05_insider_trading/scenario.json.erb` — exit 0,
  "Validation complete". Only pre-existing "Missing recommended" warnings (NPC behavior /
  showProgress on collect_items), unrelated to this pass. The ERB re-rendered to valid JSON,
  proving `vm_object` still emits valid JSON after the IP change.
- compile-ink not run: no `.ink` touched.
- Grep: `192.168.100.75` no longer present in `scenario.json.erb`; `secgen_scenario` now
  `break_escape/safetynet/m05_insider_trading.xml`.
- SecGen module paths referenced by the XML all exist under `modules/`
  (bludit_upload_images_exec, parameterised_accounts, sudo_root_less, zip_file,
  encoders/selector/concatenate, encoders/base/base64). No VM build performed (out of scope).
- Step 2 matrix re-checked against the edited files: no new mismatch; critical path (recon →
  RCE → user → root, all four flags gating `concludeRequires`) intact.

## Still open / needs author decision / shared-file changes for the orchestrator

- **(author, cosmetic)** `scenario.json.erb:1806` fallback `"title":"kali"`. The lookup key
  `attack_vm` is correct; the fallback title is only the standalone/dev display label. It is
  left as the friendly "kali" (the box is Kali). In Hacktivity mode the VM's real title
  `attack_vm` is shown instead. Change to `"attack_vm"` only if you want standalone to match
  the Hacktivity label. Not a functional issue.
- **(build-confirm)** Host IPs. The SecGen XML assigns IPs with `network_ip` in datastore
  order (index 0 = attack_vm, 1 = qdc_research_server), while the human-written `<description>`
  states qdc_research_server = 172.16.0.2 and attack_vm = 172.16.0.3. Whether the auto-assigned
  octets match that prose can only be confirmed by a build. The game does not depend on it
  (real IPs flow from vm_context; the fixed fallback 172.16.0.3 is on the right network, and
  the iceweasel start page correctly targets datastore index 1 = the portal).
- **(build-confirm)** Within-bludit flag order (flag1 recon vs flag2 RCE). The XML comment
  notes this needs a build to confirm document order resolves recon-before-RCE. If a build
  shows them swapped, swap the two fallback flag strings and the two submit-flag titles; the
  display-form matching is index-based and would otherwise mislabel.
- **(shared file — report only, orchestrator to reconcile)** Field guide
  `HacktivityLabSheets/_labs/safetynet/` for the Bludit CMS exploitation lab, referenced by
  the canonical XML `<lab_sheet_url>`
  (`https://cliffe.github.io/HacktivityLabSheets/labs/safetynet/bludit-cms-exploitation/`).
  This guide was not edited (it may be shared / is in the third repo). The orchestrator should
  confirm it names: the authenticated image-upload RCE on Bludit 3.9.2, admin creds leaked in
  a web-exposed handover note, the manager-account user flag, and the `sudo less /root/...`
  root escape — and that the accounts/paths it prints match this VM. No per-build secret must
  appear in it.
- **(no action)** No top-level `"flags"` block (m01 has one via `vm_flags_json`). m05 uses the
  flag-station `flags_for_vm` + player_state `flags_by_vm`, same as m04; `game.rb` collects
  valid flags from the station and flags_by_vm, so the top-level block is not required here.
</content>

---

# Round 2 (2026-10-18)

## Edits applied this round

None. Round-1 fixes (`secgen_scenario` path; vm-launcher fallback IP) are intact and correct.
The rebase decision is KEEP (see 01 R2.2), and the VM chain is pedagogically sound as built
(see 01 R2.3), so no BreakEscape scenario edit and **no canonical SecGen XML edit** was needed.
Validator re-run clean (pre-existing `showProgress` warnings only).

## Rebase decision
KEEP. Bludit RCE + `sudo less` root escape fits the mission CyBOK and maps 1:1 to the four
aims; m05 is already an adaptation of the best-fit catalogue scenario (Feeling Blu). No rebase.

## Pedagogy fixes
None required. flag3 (manager-home 0600) and flag4 (root-owned 0600 behind the `sudo less`
escape) are both genuinely gated; the sudo rule is already scoped to the taught GTFOBins
`less` escape (no full-`ALL=(ALL) ALL` vs scoped-teaching mismatch).

## Shared field-guide change for the orchestrator (report only — NOT edited)

File: `HacktivityLabSheets/_labs/safetynet/bludit-cms-exploitation.md`
What: add a user-access step between the shell step and the root step. The current Core
Workflow (steps 4→5, lines ~71-72) goes www-data shell → `sudo -l` → root, and the Mission
Application paragraph (lines ~91) implies Flag 3's "Data Package Manifest" is readable straight
from the initial shell.
Why: Flag 3 is leaked to `/home/<manager>/flag` at mode `0600` owned by the manager account, so
the www-data RCE shell cannot read it. The player must first become the manager — the portal
admin password recovered at Flag 1 is also that account's Linux password — e.g. `su - <manager>`
from the shell, then read the manifest in the manager's home. Suggested: insert a workflow step
"Pivot to the account whose credentials you recovered" before the `sudo -l` step, and reword the
Mission Application Flag 3 sentence so it doesn't read as readable from the first shell.
No per-build secret appears in the guide (good); all other values (handover-note creds, Bludit
3.9.2 authenticated upload RCE, `sudo -l` GTFOBins root escape) match the VM.

## Still open / build-confirm (carried from Round 1, unchanged)
- (build-confirm) Host IP octets vs the prose `<description>` (172.16.0.2 / .3) — auto-assigned
  by `network_ip` in datastore order; only a build confirms the octets. Game does not depend on
  it (real IPs flow from vm_context).
- (build-confirm) Within-Bludit flag order (recon flag1 before RCE flag2) resolves by document
  order; a build confirms. If swapped, swap the two fallback flag strings and submit-flag titles.
- (author, cosmetic) `scenario.json.erb:1806` fallback `"title":"kali"` — standalone display
  label only; lookup key `attack_vm` is correct.
