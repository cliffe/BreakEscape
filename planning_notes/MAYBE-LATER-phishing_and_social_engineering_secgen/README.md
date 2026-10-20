# Phishing & social engineering — practical VM challenges (SecGen)

> **Status (2026-10-20): PARKED / out of scope, kept for reference.** The module has one slot for a
> technical lab and it goes to the browser-only `lab_social_engineering`; Eldritch Hacker is also
> browser-only, so no VM companion or side operations are planned. If ever revisited, C6 (campaign
> forensics, existing modules, no victim bot) is the cheapest candidate.

Status: plan, started 2026-10-20. Companion to `../phishing_and_social_engineering/` (the no-VM
in-game suite). This folder plans the **VM-backed, practical** half: real boxes built by SecGen that
students attack, coupled to the game **only through the player** — there is no IPC between Break
Escape and the VMs.

## The one hard constraint: no IPC

Break Escape (the browser game, served by Rails) and the SecGen VMs (built and hosted by Hacktivity)
cannot talk to each other programmatically. There is no socket, no shared database, no callback. The
**only** channel is the human at the keyboard:

- **Game → VM:** the player reads something in the game (an email-address pattern, a username
  convention, a password won from a pretext call, a cloned-portal credential, a target's name or a
  date) and **types it into the VM** (the Kali console embedded in the game, or their own VM client).
  The VM is authored so that this information is the intended — sometimes the only — way in.
- **VM → Game:** the player finds something on the VM (a **CTF flag**, or further **OSINT**: an email,
  a config value, a cracked password, a document) and **types it back into the game** — flags into a
  flag station (validated server-side), other findings into the intel board or a story gate.

This is not a limitation to work around; it is the design. It mirrors a real engagement, where the
operator is the one carrying intelligence between recon and exploitation. And it sidesteps the SecGen
phishing lab's flakiness (`../phishing_and_social_engineering/README.md`): the *game* half stays
deterministic (the rules engine judges pretexts in-browser), while the *VM* half is a genuine box
where a real payload runs or a real service is reached.

## What already exists (the bridge is built)

Break Escape already couples missions to SecGen VMs exactly this way (m01–m08). Verified in code:

- `mission.json` → `secgen_scenario: "break_escape/safetynet/<mission>.xml"` makes the mission a VM
  mission (`Mission#requires_vms?` = `secgen_scenario.present?`, `app/models/break_escape/mission.rb:95`).
  Hacktivity builds the matching VM set (`sec_gen_batch` / `vm_sets`, matched by scenario, `mission.rb:106-120`).
- A `vm-launcher` object embeds a VM console in the game via `vm_object('kali', {ip, enable_console})`
  (`scenarios/m01_first_contact/scenario.json.erb:2034,2041`). The player attacks from there.
- Flags found on the VM are entered at a **flag station**; `POST /break_escape/games/:id/flags`
  (`routes.rb:47` → `games_controller#submit_flag`, `:1156`) validates them **server-side** against the
  real built flags and **never sends flag values to the client** (`Game#filter_requires_and_contents_recursive`,
  `game.rb:2320-2384` — station `flags` arrays become a `flagCount`, `hintOnlyFlags` are deleted). A
  validated flag runs its authored rewards + task completions (`submit_flag` →
  `find_flag_rewards`/`process_flag_rewards` + `process_flag_task_completions!`,
  `games_controller.rb:1226-1240` → client `processRewardEvents`, `flag-station-minigame.js:785`), and a
  reward's `set_global` (`apply-actions.js:33`) or a task's `onComplete.setGlobal`
  (`objectives-manager.js:754`) bridges it to game progress.
- `targetFlags: ["<vm>:<flag_id>"]` ties a station/objective to specific VM flags
  (`scenario.json.erb:350,362`). `acceptsVms` lists which VMs a station takes flags from (`:1387,2052`).
- `hintOnlyFlags` / hint-only messages: a flag that is **recognised but not scored**, used to tell the
  player "this value is used elsewhere" (a launch code, an archive key) — `games_controller.rb:1184-1203`.
  **Important:** the hint-only branch returns only a message; it does **not** set a global or complete a
  task, so it cannot gate game progress on its own. A VM finding that must *advance* the game uses a
  normal **scored** flag whose reward carries `set_global` / `onComplete.setGlobal` (see the bridge
  contract, `01`).
- `test:flag:N` aliases resolve to the real flag value so a playtest runs unchanged with or without a
  real VM build (`games_controller#resolve_test_flag_alias`). Lets us build and test the game half
  before the VM exists.

So this plan is mostly **authoring**, not new engine work: design VMs whose intended solution needs
game-found info, and game stages whose progress needs VM-found flags/OSINT, and wire them with the
mechanisms above.

## Documents

| File | Contents |
|------|----------|
| `01_bridge_contract.md` | The two-way, player-mediated handoff: what strings cross each boundary, how each is validated, the no-IPC authoring discipline, test aliases, anti-cheese rules |
| `02_vm_challenge_catalogue.md` | The phishing/SE-themed VM challenges, each tied to a game stage, with the game↔VM information flow spelled out |
| `03_audiences_and_missions.md` | How the VM track maps to the student lab, the SAFETYNET missions (the "missions require VM flags" rule), and why the awareness product stays no-VM |
| `04_secgen_building_blocks.md` | Reusable SecGen modules/scenarios and gaps (from a Haiku SecGen survey; design level, no exploit detail) |

## Relationship to the no-VM suite

The no-VM suite is the default and the awareness product. This VM track is **additive**: it reuses
the same fiction (AccountingNow / the SAFETYNET missions), the same OSINT and pretext front-end, and
hands off to a real box for the part that benefits from being real — enumerating a live mail server,
running a payload, reaching a service with harvested credentials, analysing phishing-kit artefacts.
A student can be routed from the in-game OSINT browser straight to the Kali console with the facts
they just gathered.

Per standing project rules: SecGen scenario/module reads and edits go to a Haiku subagent (VM
internals stay off the orchestrator's path); VM exploit detail is never written into these planning
docs — challenges are described at the level of "what the student does and what information crosses
the bridge", not step-by-step attacks.
