---
name: vm-playtest
description: Runs the end-to-end VM playtest of a SAFETYNET mission (m01-m08) on dev Hacktivity: check the mission's built VM set, with the user's yes bump and build a new release, start the game as a dedicated playtest student so Hacktivity assigns the set, drive the game in the browser while running the mission's named VM solve steps over the QEMU guest agent, submit the flag refs they return, optionally film the console, then relinquish the set (or keep it on failure). Trigger when the user asks to "VM playtest m0X", "run the full playtest with the real VM", "play a mission end to end including the VM part", "bump/build a playtest release", "check the mission's VM set status", "finish/relinquish the playtest set", or names a mission m01-m08 and asks for a real-VM run on the dev server. This is orchestrator-facing: it routes every VM and SecGen technical step to the opus48 agent type and keeps attack and exploit detail out of the orchestrator's own context.
---

# SAFETYNET VM playtest orchestration

Play a SAFETYNET mission from end to end on **dev Hacktivity**, including the VM part: confirm a built VM set exists, start the game as a dedicated playtest account, drive the game in the browser, run the mission's named VM solve steps on the Kali attack desktop over the guest agent, submit the flags they produce back into the game, optionally film it, and hand the set back.

This skill is the **workflow wrapper** only. The per-mission attack specifics (which recon, which foothold, which escalation) are not here and never belong here: they live in each mission's solve library, `Hacktivity/lib/playtest/solves/<mission>.rb`, written by an `opus48` subagent. This skill tells the orchestrator how to run a session, who does which step, what is safe to do without asking, and how to report.

**Read these before a run** (they are the source of truth; this file summarises them):

- `Hacktivity/docs/vm_playtest/IMPLEMENTATION_PLAN.md` - the full design. Sections 4 (safety), 6 (work packages), 7 (order) and 8 (a full run end to end) matter most here.
- `Hacktivity/docs/vm_playtest/RUNBOOK.md` - the live command reference and the dev-box facts (cluster id, accounts, env vars, recovery). Reread it each session: it grows as work lands and records the current base's facts.
- `Hacktivity/docs/vm_playtest/DEV_SERVER_PROMPT.md` - the hard rules for the dev server session.
- `BreakEscape/AGENTS.md`, "Choosing a model" and "Writing a subagent prompt".

Conventions: UK spelling, "cyber security" as two words, no em or en dashes. Commands run as `bin/rails runner script/dev/<name>.rb <options>` in the Hacktivity folder; `R` in this file stands for `bin/rails runner script/dev`. Each runner prints exactly one JSON line and exits 0 (ok, or still running), 1 (failed check, non-zero exit, lost, timeout) or 2 (refused or invalid).

## Who does what, and model routing

This is the part that keeps the run working, so get it right before anything else.

**The orchestrator runs on Opus 5.5 and must stay off the VM and SecGen material.** Opus 5.5's content safeguards over-flag practice-VM and lab text and have stopped VM-writing subagents (AGENTS.md, "Choosing a model"). So the orchestrator plans the run, calls the `mission_vm_session` and `vm_display` runners (they print one JSON line, no attack text), decides what needs the user, and reports. It does **not** read or write solve libraries, SecGen scenarios or modules, the VM companion lab sheet, or the raw output of a VM step.

**Route every VM and SecGen technical step to the `opus48` agent type** (`.claude/agents/opus48.md`: Opus 4.8, medium effort). Launch it **without** a `model` override, or the pinned model is replaced by Opus 5.5. That includes:

- writing or fixing a mission's solve library (`Hacktivity/lib/playtest/solves/<mission>.rb`) and its facts and inputs;
- reading SecGen scenarios or modules to derive solve steps;
- running a solve headless to debug it (`R/vm_step.rb`), and reading step output folders under `Hacktivity/tmp/playtest/exec/`;
- the WP11 Kali-login check and any work on the VM companion lab sheet (`labsheet_vm_steps.md`).

Running the browser playtest session itself (the game part plus the `vm`/`vmwait`/`<vmflag:REF>` commands) is scripted and touches no exploit text, so it can run on the model the playtest-scenario skill uses; but whenever a step's output has to be read or a solve edited, that is opus48 work. When in doubt, route it to opus48.

Point each subagent at files rather than restating them (AGENTS.md, "Writing a subagent prompt"): give it the plan, the RUNBOOK, the mission's solve file path, and the session tag. Keep briefs that touch VM content short ("write the solve for m0X from its SOLUTION_GUIDE.md, VM_INTEGRATION.md, labsheet_vm_steps.md and the SecGen tier-3 secgen_tests"); do not paste attack steps into the brief. Put the handover rule in every multi-step brief (hand over near 150k tokens).

### The fixed report-back format

A subagent's report to the orchestrator is **at most 15 lines** and carries no scenario text, attack content, exploit detail or quoted command output. The orchestrator's model over-flags that material, so a full handover note would trip it. Every VM subagent reports back in this allowlist form and nothing else:

- **verdict:** PASS or FAIL (one word).
- **per-step result:** `step N/M: PASS` or `step N/M: FAIL`, by step INDEX. Never step names: they describe the technique.
- **counts only:** flags earned, steps passed, tests passed (numbers, not values).
- **commits:** short hash only. No subject line: solve-commit subjects name the technique.
- **no names:** no module, CVE, tool, service, vulnerability or technique names anywhere in the report; refer to VM stages only as flag 1-N.
- **file refs:** bare `file:line`, never the line's content.
- **open items:** by handover-note section heading, "see note", with a count. Never the detail itself.

All of the real detail (step output, flag values, SecGen reasoning, the full changelog) goes into a **handover-note file**, written for the next agent, not for the orchestrator. The orchestrator is given the note's path and **never opens it**. When it needs more, it asks the agent for a neutral one-line summary, or has a small Haiku reader summarise the note. Notes point to content by `file:line` instead of quoting it.

When the user asks a technical question about a VM, an opus48 agent writes the answer to a file or artifact and the orchestrator relays only the link; the orchestrator never explains VM internals in its own words.

This matches the memory rule for this work: keep exploit and CTF text out of the orchestrator's own output; VM-step reports use the fixed allowlist format, with user-facing detail delivered through the exchange-form channel below.

### User-facing decisions: the exchange form

When a run needs a human decision (a build, a stale verdict, a failed build, an admin email, anything in the approval list), do not put the detail in chat where it enters the orchestrator's context. Use the exchange-form pattern (AGENTS.md, "Asking the user for input", and the review-page precedent):

- write the full context to a pending-decisions file in `Hacktivity/tmp/playtest/` (background, options, recommendation, evidence by file:line);
- surface the question to the user through the question tool with checkbox options (recommended first), or, for a batch of decisions or anything visual, publish one HTML artifact and send the link;
- back the artifact with the runtime data capability so answers land in `threads`/`responses` collections through ArtifactData, rather than being pasted back as prose that re-enters context;
- carry on with independent work while waiting, and move each answered item into the release log with the user's choice.

### If a safety classifier stops an opus48 task

Stop. Do not reword and retry, do not try another route, do not do it yourself (AGENTS.md; DEV_SERVER_PROMPT.md). Then:

1. report to the user the exact stop message, what the agent had done, and the file or step it was on;
2. if the message allows it, offer to rerun the **same task with the same prompt** on `sonnet-cvp` (the Cyber Verification Program relay) or Haiku. The user decides after reading the message;
3. if they agree, run it unchanged: no rewording to slip past the check, no stripped context, no wider reads;
4. if that is stopped too, or either model declines the task itself, report it and stop. No third model, no doing it yourself.

The browser playtester is scripted and never sees exploit text, so a classifier stop there should be rare; if it happens, it reports `{"blocked":"classifier","step":...,"session":TAG}` and the orchestrator restarts one opus48 subagent with a clean context (the same brief and the session tag, no earlier transcript) resuming at that step in the same live session. A second stop goes to the user.

## Safety rules (hard constraints)

**The Proxmox cluster is the production cluster.** Only this Hacktivity VM and its database are dev. VMs that dev Hacktivity builds are recorded in the dev database and are ours: the tooling may build, start, shut down, revert, relinquish and run commands in them, and deprecate or roll back their releases. These are the limits, taken from plan section 4 and DEV_SERVER_PROMPT.md, and they are not negotiable in a run:

- **Only playtest VM sets, ever.** Every runner call (including `--status`, `--poll`, `--kill`) checks the set is in a batch of the playtest event, is unassigned or held by a playtest account, and is in a batch with no `parent_pool` that is not itself a pool. The runners enforce this; do not look for a way round it.
- **The VM is the one we think it is.** Before every exec the runner reads the VM's Proxmox config and requires its name to equal the set's `ovirt_vm_name`, with the node from `/cluster/resources`. Proxmox reuses VM ids, so a stale id is refused. A VM that is not on the cluster is refused too (it may be archived; start the set through Hacktivity first).
- **Ask the user first, every time, before any of these**, saying exactly what will happen and waiting for a yes (a yes covers that one action):
  - deleting any VM;
  - setting a set to a status that makes a scheduled job delete its VMs: `error`, `build_stopped`, `marked_broken`, `failed_to_revert`, `deleted`, `broken`. The scheduled `ProxmoxUpdateAndArchiveVmsJob` deletes the VMs of dev sets in those statuses, so `--rollback` deliberately never sets one;
  - any admin-type Proxmox action (templates, snapshot deletion, nodes, storage, networks, pools, users, permissions);
  - touching any VM, VM set, batch or event that dev Hacktivity did not build or this work did not create;
  - building or bumping a release (see "Release names and builds").
- **Use Proxmox only through Hacktivity's own client and jobs.** Never `qm`, `pvesh`, `curl` to the API, or the Proxmox web UI. VMs are started only through Hacktivity's paths (activation, `DispatchVmCtrlService`), so `booted` is recorded and relinquish reverts them.
- **No credentials or exploit text on command lines.** Commands reach the guest on stdin from a quoted heredoc or a file (`<<'EOF'` or `< file`), never `echo '...' |`. The browser password and desktop credentials come from environment variables. Facts and inputs marked `secret:` are redacted in logs.
- **Build logs are never printed raw.** `add_to_secgen_batch.log` and the SecGen error logs hold the full SecGen command line, including `--proxmoxuser` and `--proxmoxpass`. Print only log paths, or tails passed through `Playtest.redact`. Never read or print `config/credentials*`, `config/master.key`, SecGen's `secgen.conf`, any `projects/*/Vagrantfile`, or git remote URLs.
- **The playtester runs only named steps** (`vm_step`), never `vm_exec`. `vm_exec` is for humans and solve authors.
- **Do not add gems or npm packages without asking.** Hacktivity is Ruby 2.7.0 and Rails 7.0.

The archive job note: the dev cluster's `cluster_type` is lowercase `proxmox` while the job selects `Proxmox`, so on dev it currently matches no cluster and touches nothing. Treat any change to the cluster record as needing the user's OK, because if it ever matched, the job would act on the production cluster.

## Release names and builds

Every bump and every build uses shared hardware, takes about 20 minutes, and is a change to a VM set, so **every one needs the user's explicit yes first** (DEV_SERVER_PROMPT.md). Before proposing a bump, tell the user the mission, the release name you propose and why, and wait for a yes. The `--confirm` flag on the runner stands for that yes; the orchestrator adds it only after the user has said so, and `--bump`/`--rollback` also need `--admin EMAIL` for an account that passes `SecGenBatchPolicy#update?` (bumps are admin-only edits).

**Release-name rules:** `release_XX_label`, where

- **X is zero padded to two digits** and **always increments**. Assignment orders versions by string (`version DESC`), so `release_10` must sort after `release_9`; the padding is what makes that true. The next X is the highest X across the batch's version and its sets' versions (both `release_` and `deprecated_`) plus one.
- `label` is lower case `[a-z0-9_]`, at most 24 characters, a very short description of why (`update_description`, `stale_rebuild`).
- An unnumbered version such as the seed's `release_default` counts as X=0. Deprecation renames a set to `deprecated_release_XX_label`.
- Two digits allow 99 releases per batch (open question Q4 in the plan: confirm that is enough if a batch ever nears it).

**What a bump does** (plan 6.2, enforced in the runner): under a batch lock, check admin and `--confirm`; refuse if the batch has or is a `parent_pool` or any set has no `secgen_job_id`; compute the next name; set `batch.version` and `places_available = vm_sets.count - spare_vms + 1`; create exactly one new pending set with the new version and `relinquished: false`; then run the build job in process and confirm the new set has a `secgen_job_id`. Old sets are **not** deprecated at bump time, so a failed build leaves the previous release playable. Old releases are deprecated only when `--wait` (or `--start`) confirms the new set is ready.

Every bump, deprecation and rollback is logged to `Hacktivity/tmp/playtest/releases.jsonl` with the admin email, SecGen commit and BreakEscape commit.

## The end-to-end run

This is plan section 8, the sequence a run follows. Load the env first (`set -a; . ~/.config/hacktivity-playtest/env; set +a`) so `HACKTIVITY_PLAYTEST_TOOLS=1`, `PLAYTEST_CLUSTER_ID` and `PLAYTEST_PASSWORD` are set; the dev Hacktivity server (`./start_local_server.sh`) and SecGen's batch service must be up. Each numbered step maps to a runner call that prints one JSON line.

**1. Status first (always).**

```
R/mission_vm_session.rb --mission m0X --status
```

Read only, no Proxmox calls. Verdict is one of `ready`, `stale`, `building`, `reverting`, `none`, `failed`. A set is `ready` when its version is the batch's, build succeeded, no owner, flags read, the flag count equals the expected count, and every VM has a `proxmox_vmid` and IP.

**2. On `stale` or `none`, ask the user, then (on yes) build.** `stale` means the SecGen commit differs from the release's: ask the user whether the change touches this mission. `none` means no built set. With the user's yes and an admin email (see "Release names and builds"):

```
R/mission_vm_session.rb --mission m0X --bump --label <why> --admin <email> --confirm
R/mission_vm_session.rb --mission m0X --wait            # run in the background; costs no tokens until it ends
```

`--wait` polls and prints one line at the end: `ready` (and deprecates the old lower-X sets), `failed`, `failed: flags`, or `timeout`. Run it with the harness's `run_in_background` so a 20-minute build costs nothing while it runs. On `failed`, tell the user, then (with the user's yes and admin email):

```
R/mission_vm_session.rb --mission m0X --rollback --admin <email> --confirm
```

Rollback sets the version back to the previous release, renames that release's `deprecated_` sets back, and leaves the failed set's VMs for a human to decide. It never sets a delete-triggering status.

**3. Start the game as a playtest account.**

```
R/mission_vm_session.rb --mission m0X --start --user auto --max-minutes 180
```

Refused unless the verdict is `ready` (a `stale` set needs `--accept-stale` after a human OK). It picks a free playtest account, creates and enrols the game, assigns the set pinned to the batch's version, extends the activation timer, starts the VMs through Hacktivity and waits for the guest agent on every VM. It prints the game id and URL, the account, the set id and version, and each VM's title, IP and VM-page URL. The console stays locked until the player reaches the in-game VM launcher, exactly as for a player.

**4. Log the browser in** (shared with the capture rig):

```
node tools/video/capture/login.mjs --email <account>
```

Signs in with `PLAYTEST_PASSWORD`, handles the emailed sign-in token (read on dev from `Hacktivity/tmp/letter_opener`), and saves a per-account Playwright `storageState`. Neither password nor token is printed.

**5. Drive the game and run the solve steps.** Start one browser per game with the playtest-scenario session script, pointed at the game URL, the storage state and the Hacktivity dir:

```
node .claude/skills/playtest-scenario/scripts/playtest-session.js --url <game url> \
    --storage-state <file> --game-id <id> --hacktivity-dir <path>
```

Play the game part as the playtest-scenario skill describes (VM policy `vm-step`). At the Kali, read the in-game post-it for the desktop credentials, then run the mission's named steps, each started in the background and awaited so a long step costs no tokens:

```
{"cmd":"vm","step":"desktop_login","args":{"desktop_user":"...","desktop_pass":"..."}}
{"cmd":"vm","step":"recon"}        then   {"cmd":"vmwait","job":...}
{"cmd":"vm","step":"foothold","args":{"ssh_pass":"<from the in-game sticky note>"}}   ...
```

The playtester runs **only named steps**, never improvised commands. Values the game hands the player (a password on a sticky note) are passed in as `args`, so a pass proves the game actually gives them out; values the build randomised (IPs, accounts) are facts the solve reads from the built project. Each flag a step finds comes back as a `<vmflag:REF>` token; submit it at the right station and the session fetches the value and logs `source: "vm-step"` (so `verify-run.rb` counts it as earned in game). Quit the session when the VM steps are done (one browser per game).

**6. Optionally film it.** See "Filming the run" below.

**7. Finish.**

```
R/mission_vm_session.rb --game <id> --finish            # on a pass: relinquish, which reverts the set
R/mission_vm_session.rb --game <id> --finish --keep     # on a failure: keep the set for inspection
```

`--finish` marks the game completed and relinquishes the set (the copy reverts to `success`). `--finish --keep` keeps the set, extends the timer by 24 hours so the archive leaves it alone, and leaves the account busy until it is relinquished later. Use `--keep` whenever the run failed and you want the VM to inspect.

## Filming the run

Filming is optional and only for steps marked `filmable: true` in the solve (steps whose screen output shows no password, account name or flag). The camera prep runner is `R/vm_display.rb` (resolution, a quiet desktop, the console take, reset); the actual console capture and its sensitive-frame masking belong to the **vm-console-takes** skill (`.claude/skills/vm-console-takes/`). Follow that skill for the capture, and run it on the `opus48` agent, as it is VM technical work. This section only says where filming sits in a run.

The shot order for one run, so the cut matches (plan WP7):

1. after the playtest run has finished its VM steps, quit the playtest session;
2. the in-game approach take at the default guest resolution: walk to the Kali, read the post-it, open the VM panel, and the embedded monitor shows the login screen (the `video-takes` skill records this);
3. `R/vm_display.rb --mode --font --quiet` to prepare the desktop, once a desktop session exists (the console login creates one);
4. the full-screen console take while `R/vm_display.rb --film <step>` runs a filmable step live (a second run of that step, which is safe because steps repeat) - this is the **vm-console-takes** skill's job;
5. `R/vm_display.rb --stop-film`, then `--finish`.

Note the dev-box caveat recorded in the RUNBOOK: the HD VirtViewer route has no SPICE path from the dev box, so the noVNC console take at the Kali's native resolution is the available route there. Check the RUNBOOK's "vm_display" and "VirtViewer" notes for the current state before filming.

## Recovery

From the RUNBOOK's recovery notes:

- **A failed build:** `--rollback` (admin, `--confirm`, user's yes) returns the batch to the previous release and renames that release's unassigned sets back. The failed set's VMs are left for a human; do not give the set a delete-triggering status without asking.
- **A kept set** (`--finish --keep` after a failure): the account stays busy and the VM stays up for inspection. Relinquish it later with `--finish` on the same game when done.
- **A busy account:** `--start --user auto` skips busy accounts; busy means an owned `success` set, an activated set, or an in-progress game. If none is free, `--status` shows who holds what, and the fix is to finish whatever run is holding an account.
- **A `lost` job** (no `rc` and no unit after a revert, reboot or OOM): just run the step again; steps are safe to repeat.
- **Archived VMs:** the cluster moves idle VMs into storage automatically, so a set whose VMs report "not on the cluster" may simply be archived. `vm_exec`, `vm_display` and the identity check refuse such a VM; start the set through Hacktivity first (`--start` does, and handles the two-start archived-VM case), then run steps.
- **Undo the seed, before anything is built:** `PURGE=1 bin/rails db:seed:safetynet_playtest`. It is refused once any VM set exists, because relinquished records stay for good.
- Logs: `log/playtest_exec.log` (rotated, 5 files of 10 MB) and `Hacktivity/tmp/playtest/` (`releases.jsonl`, job sidecars, exec output, `seed_created.json`).

## Stage 4: bringing a new mission online (m02-m08)

Stages 0 to 3 build the tooling and prove it on m01. Stage 4 is the repeated per-mission work, **one mission and one build at a time** (plan 7 and WP11):

1. **WP11 Kali-login check (BreakEscape content).** The player needs the desktop credentials in game. Some missions (m01, m04) already have a post-it on the VM launcher; others do not. For a mission without one, decide where the player learns the login (the launcher's own `postitNote`/`showPostit` as in m01, or another in-world source that fits the story), make the change through the mission's usual skills, and run the dungeon-graph and validator checks after. Confirm it matches the base VM's account. This is mission content and VM-adjacent: route the VM side of it to opus48, and the `desktop_login` solve step checks the game's hint against the VM on every run.
2. **Write the solve** for the mission (`opus48`), from its `SOLUTION_GUIDE.md`, `VM_INTEGRATION.md`, the VM companion lab sheet and the SecGen tier-3 `secgen_test`s. Debug it headless against a fresh set.
3. **A full run** of this skill, end to end, with filming if wanted.
4. **One build at a time.** Two parallel agents on one mission need two ready sets, which means running the build step again with the user's yes. Do not queue several builds: they share hardware and each needs its own approval.

m09 and m10 are drafts; they wait until their SecGen scenarios build.

## Runner reference

`R` is `bin/rails runner script/dev` in the Hacktivity folder.

| Runner | Purpose | Who |
|---|---|---|
| `mission_vm_session.rb --mission m0X --status` | state and verdict, read only | orchestrator |
| `mission_vm_session.rb ... --bump --label L --admin E --confirm` | new release (user's yes) | orchestrator |
| `mission_vm_session.rb ... --wait [--max-minutes N]` | poll a build; background | orchestrator |
| `mission_vm_session.rb ... --rollback --admin E --confirm` | undo a failed build (user's yes) | orchestrator |
| `mission_vm_session.rb ... --start --user auto [--max-minutes N] [--accept-stale]` | assign a set, start the game | orchestrator |
| `mission_vm_session.rb --game ID --finish [--keep]` | relinquish (or keep on failure) | orchestrator |
| `vm_display.rb --vm-set ID --vm kali [--mode ...] [--font ...] [--quiet] [--reset]` | camera prep | opus48 / vm-console-takes |
| `vm_display.rb ... --film STEP / --stop-film / --replay STEP` | filmed step | vm-console-takes |
| `vm_step.rb --game ID --step NAME [--args-json -] / --list / --flag-value REF` | run one solve step | opus48 (debug); the session (via `vm`/`vmwait`) |
| `vm_exec.rb --vm-set ID --vm kali ... <<'EOF'` | arbitrary command on stdin | humans and solve authors only, never the playtester |

Files: solves in `Hacktivity/lib/playtest/solves/<mission>.rb`; the playtest session script and its `vm`/`vmwait`/`<vmflag:REF>` tokens in `.claude/skills/playtest-scenario/`; the console take in the `vm-console-takes` skill; the login helper at `tools/video/capture/login.mjs`.





