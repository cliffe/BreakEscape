# VM technical-steps companion sheets — reconcile to current VMs (2026-10-23)

Task: bring each SAFETYNET mission's **VM technical-steps companion** lab sheet into line with its current SecGen VM, after this session's VM weave changes. User decisions (2026-10-23): update the four changed missions in full; audit the other six and fix only real mismatches; verify against the committed SecGen XML only (no VM build).

## Repos and files
- Lab sheets: `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/safetynet/`. The companion per mission is `mNN-<slug>-vm-technical-steps.md` (NOT the main `mNN_<slug>.md`, which is the non-technical game walkthrough — **do not touch the main sheet**). Shared concept field guides also live here (e.g. `apache-druid-rce.md`, `erlang-otp-ssh-rce.md`, `secrets-in-git-history.md`, `nfs-and-netcat-leaks.md`, `offline-password-cracking.md`, `privilege-escalation.md`) — link to them, reuse them, don't duplicate their bodies.
- SecGen VM (source of truth for the technical side): `/home/cliffe/Files/Projects/Code/SecGen/scenarios/break_escape/safetynet/<mission>.xml` and the modules it uses. Current as of commits 7c2532511 (m04, m08) and 2b0e1b4bc (m09, m10).
- Game side (what the game tells the player about the VM — for consistency, not for copying attack detail in): `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/scenarios/<mission>/scenario.json.erb`, `mission.json`.
- The review of this session's changes: `scenarios/VM_INTEGRATION_REVIEW.md` (section 9 lists what changed per mission).

## Model and content
- All writers are **opus48** (Opus 4.8): read SecGen, modules and the exploit-detail field guides directly — that is your job. Follow the `mission-lab-sheet` skill (load it) for the companion's format: the strict game/VM split, the layered hint stages (a visible nudge, then a collapsed **Nudge**, then a collapsed **Recipe**), command-line practice and server reflection questions.
- **Classifier-stop contingency:** before you write the sheet, gather everything you need into `FACTS.md` in your scratch folder — the game-side references (accounts, hosts, flags, finds, story beats the sheet should name) and the sheet's structure/requirements — so that if a classifier stops you, a `sonnet-cvp` rerun needs only your `FACTS.md` plus the SecGen XML, never the non-technical game files. If a classifier stops you, stop at once, say which mission/section, and do not reword or retry.
- Keep accounts, hostnames, IPs, file paths, flag names and flag order **identical** between the sheet, the SecGen XML and what the game says. Where the game names a credential/host/file, the sheet and the VM must match it.

## What changed this session (the four to rewrite in full)
- **m04:** three leaked files now carry in-fiction documents (coordination notes, calibration override, operator notes) with the flag appended. Foothold is the SSH-daemon RCE (not distcc). 
- **m08:** one account `svc-planning` across recon, the recovered login, the mail sender (ENTROPY alias `deep_state_drop`) and the root access log; planning file `pnw_contingency.enc`.
- **m09:** catalogue entered by a login (`catalogsvc` / `Catalog!Helena2016`, from the reading-room slip) then sudo-pager privesc; Tomb Beta keeps the unauthenticated web-server RCE onto `nostromousr` then privesc; four story files in Tomb Beta's home (enrolment record, Tesseract memo, unsent vendor notice, holdings record — VH-2017-0312, Carrow Controls RM-4).
- **m10:** monitoring account `secmon` (command-injection foothold, flag 1); separate `staging` / `Staging!Copy25` account for flag 2; `relops` / `Release!Shift25` on release_host; seeded kill config (flag 3) and core file index + unsent notice (flag 4).

## Rules
- Review and update **only the VM technical-steps companion** `.md` files in HacktivityLabSheets. Do not edit the main game sheets, the BreakEscape repo, or SecGen. Do **not** commit — the orchestrator reviews and commits.
- Re-read a file just before editing it (shared tree). UK English; "Cyber Security" as two words; plain prose.
- Return: per mission, what you changed and why (section level), every account/host/file/flag you verified against SecGen, any mismatch you found between game and VM that you could NOT fix in the sheet (goes to the orchestrator for the user), and whether the sheet's intended solution path still matches the VM as built.
