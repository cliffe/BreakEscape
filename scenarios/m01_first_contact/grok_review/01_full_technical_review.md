# m01 First Contact — Full Technical Review

Audience: the author. Covers story↔scenario↔VM consistency, thematic coherence,
puzzle solvability, technical solvability, and pacing/skill order. The companion
`02_consistency_matrix.md` is the value-by-value table; this file is the reasoning.

VM-side values were checked against both SecGen copies by a separate pass; the flag
semantics, accounts, server name and IP line up with the game (see matrix). The three
things that do not line up are the Kali VM IP, the SecGen scenario identifier, and a
duplicate XML's encoder path.

## Verdict

The mission is solvable end to end in standalone/dev mode and the story is coherent and
genuinely good. The flag design is sound: four flags, each tied to a distinct Linux skill
(SSH password guessing, directory traversal, sudo-to-another-account, decode a base64
file), each wired to a physical lock or device in the fiction. The VM is required — the
confrontation is gated behind reading the ENTROPY archive, which only opens with flag_1.

The problems are integration drift, not design. The most serious is that **in Hacktivity
(real-VM) mode the mission cannot bind its VM set**, because the SecGen scenario
identifier in `mission.json` is stale. Everything else is a handful of consistency fixes.

## 1. Technical solvability (VM)

The intended chain, confirmed against the VM definition and the labsheet:

1. Find the password list ("My Passwords", 27 entries) and server details (shatter_server,
   172.16.0.2, user `derek`) in Derek's storage-room safe.
2. On the Kali box, `hydra -l derek -P passwords.txt 172.16.0.2 ssh` → one of the 27 is
   the real password (selected per build by the VM's string selector from the *same* 27
   strings the game ships). SSH in as `derek`.
3. In `derek`'s home: the archive decryption key (`DECRYPTION_KEY`, **flag_1**), and a
   subdirectory `operation_shatter/` holding `deployment_notes` (**flag_2**, the directory-
   traversal flag).
4. `sudo -l` shows `derek` may act as `shatter`. `sudo -u shatter …` reads `shatter`'s
   home: `shatter_configuration` (base64, **flag_4**) and `launch_code/launch_flag`
   (**flag_3**, the launch authorization code).
5. Submit flag_1 at the ENTROPY archive (server room), flag_2 and flag_4 at the drop-site,
   flag_3 into Derek's launch device at the end.

This all maps cleanly to the VM. Accounts (`derek`, `shatter`), server name, IP, the four
flag locations and the sudo relationship match. The labsheet is the most consistent layer
of all and correctly never prints a per-build secret.

**Issue T1 — Kali VM IP mismatch.** `scenario.json.erb` renders the VM launcher with a
fallback `"ip":"192.168.100.50"`. The VM defines the Kali box at `172.16.0.3` (same
172.16.0.x subnet as shatter_server at .0.2). 192.168.100.50 is a stray value inherited
from the `lab_intro_linux` template. In Hacktivity mode the real IP comes from the VM set
so this is only the standalone/dev placeholder, but it should match the VM. Fix: `172.16.0.3`.

**Issue T2 — SecGen scenario identifier is stale (most serious).**
`mission.json` sets `"secgen_scenario": "intro_to_linux_security_lab"`. `Mission#valid_vm_sets_for_user`
matches this string against Hacktivity's `sec_gen_batches.scenario`, which holds the
scenario XML path (compare `lab_intro_linux`, which uses
`"labs/introducing_attacks/1_intro_linux.xml"`). The string `intro_to_linux_security_lab`
is not a path and appears in neither SecGen XML — it is the *VM title* from the lab
scenario m01 was cloned from. Result: `requires_vms?` is true, but the VM-set query returns
nothing, so a Hacktivity player gets no VM bound. Fix: set it to the scenario's XML path,
`break_escape/safetynet/m01_first_contact.xml`. (Confirm against the exact string Hacktivity
records for this batch — the `lab_intro_linux` precedent says path-relative-to-`scenarios/`
with `.xml`.)

**Issue T3 — `vm_object` title does not match the built VM.**
`vm_object('intro_to_linux_security_lab', {…title:"kali"…})`. In Hacktivity mode `vm_object`
finds the VM whose `title` equals the first argument. The built VMs are titled `shatter_server`
and `kali`; nothing is titled `intro_to_linux_security_lab`, so it always falls through to
the static fallback (with the wrong IP from T1). The console the player drives is the Kali
box. Fix: `vm_object('kali', …)` — matches the fallback's own title, the VM's system name,
and the documented usage example in `mission.rb`.

**Issue T4 — in-mission SecGen copy has a broken encoder path.** The duplicate at
`secgen/m01_first_contact.xml` sets the `shatter_configuration` base64 encoder to
`modules/encoders/string/base64`, which does not exist in SecGen. The canonical repo copy
uses `modules/encoders/base/base64`. If anyone builds from the in-mission copy it fails.
Fix the path in the duplicate (or treat the duplicate as reference-only and keep it in sync).
The two copies also differ in the field-guide lab-sheet URL scheme — that one is an author
decision (which URL layout is canonical), noted, not changed.

## 2. Puzzle solvability (physical)

Traced the full lock/key chain against the dungeon graph; no dead ends or soft-locks.

- **Linchpin is Kevin's lockpick.** Derek's office needs either the spare key (inside
  Patricia's briefcase) or a direct pick — and the briefcase itself needs the pick. So the
  pick is mandatory, and Kevin hands it over (or it drops if the player KOs him). Reachable.
- **Reachability of the password list.** The VM password wordlist lives in the storage-room
  safe (PIN 1337). 1337 comes from Encoded Note (1) (base64) in Derek's office, decoded at
  the CyberChef workstation (inside Patricia's briefcase). So: Kevin → lockpick → briefcase →
  CyberChef + Derek's office → decode note → 1337 → wordlist → VM. Linear, acyclic, solvable.
- **PIN redundancy is healthy.** IT PIN 2468 is discoverable three ways (reception voicemail,
  storage backup note, Kevin's out-of-office note). Anniversary 0419 is available both from
  the plaintext Anniversary Card and from decoding Encoded Note (2). Good — a learner who
  misses one clue is not stuck.
- **Progression gate.** The Derek confrontation is correctly gated on `entropy_reveal_read`
  (reading the ENTROPY Network Architecture in the archive), which requires flag_1. So the
  technical work cannot be skipped to reach the ending. The `concludeRequires` gate on the
  ending lists the three submit-flags tasks. Consistent with "the mission must require the
  VM flags."

**Issue P1 — the `submit_ssh_flag` targetFlag is in the non-matching form (known).**
The three VM tasks use `targetFlags`:
- `submit_ssh_flag`: `["shatter_server:flag_1"]`
- `submit_linux_flag`: `["flag_station_dropsite:shatter_server-flag1"]`
- `submit_sudo_flag`: `["flag_station_dropsite:shatter_server-flag2"]`

Per the matcher (`game.rb` `process_flag_task_completions!` and the note above it), only two
authored forms ever match: the legacy display form `shatter_server-flag1` and the
station-qualified display form `flag_station_dropsite:shatter_server-flag1`. The *reference*
form `shatter_server:flag_1` **silently never matches**. So `submit_linux_flag` and
`submit_sudo_flag` are correct; `submit_ssh_flag` is in the dead form.

It still completes, via a different route: the ENTROPY archive lock carries
`completesTask: "submit_ssh_flag"` and its flagReward sets `ssh_flag_submitted`, which an
eventMapping also maps to `completeTask: submit_ssh_flag`. So the task closes when the player
opens the archive with flag_1 — which is the only way to get flag_1's payload anyway.

I deliberately did **not** change this. The matcher's own comment records that the mixed
forms are known, that normalisation was tried and reverted, and that "fixing"
`submit_ssh_flag` to a matching form would complete it (and unlock `decrypt_entropy_intel`)
earlier in the flow than live players currently see. This is an author decision, flagged in
04's open list, not a silent edit.

## 3. Story ↔ scenario coherence

Strong overall. The frame (IT-audit cover, handler by phone, informant to protect, villain
with a monologue, a launch device with an abort/launch moral choice) is consistent, and the
debrief branches thoroughly on what the player actually did (evidence found, who was KO'd,
Kevin's frame-up choice, the ending choice, abort vs launch). Names, dates, casualty figures
and profile counts are consistent across every document (see matrix, "story constants").

**Issue S1 — Derek's tenure contradicts itself.** The opening briefing says Derek "has been
there three months"; Kevin says "about 18 months" and Patricia's reconstruction opens "18
MONTHS AGO: Derek Lawson hired." 18 months is the dominant canon. Fix the briefing to 18
months.

**Issue S2 — Maya's job title drifts.** The briefing calls her "the journalist who contacted
us" and the debrief says "continue her journalism," but she is a Content Analyst everywhere
else (office door "Maya Chen — Research", her own notes "I was hired as a content analyst").
Align the two stray lines to her analyst role.

**Issue S3 — Sarah's internal id.** The NPC id is `sarah_martinez` while the display name is
"Sarah O'Brien" (a rename that didn't reach the id). Not player-visible and internally
consistent (objectives, KO globals and credits all use `sarah_martinez`), so this is a
low-priority cleanup, not a bug. Renaming the id touches `targetNPC`, `taskOnKO`,
`globalVarOnKO` and the credits block together — do it as a deliberate pass or leave it.

**Issue S4 — player name.** Scenario global `player_name` is "Agent Zero"; the ink files
default to "Agent 0x00"/"Agent". The global wins at runtime, so the player is addressed as
"Agent Zero". Harmless; note only.

## 4. Thematic coherence

The thesis — "trust is the attack surface; verify everything" — runs through every layer:
the Architect's letter, Derek's monologue, the disinformation campaign, and the technical
lesson (weak reused passwords, an over-privileged account that can sudo to the infrastructure
account). The physical puzzles teach the same idea at human scale (reused anniversary/birthday
dates as PINs, a password on a sticky note). The labsheet's reflective questions explicitly
tie the sudo misconfiguration to least privilege. This is well joined up.

## 5. Pacing / skill order for a learner

The skill ramp is well sequenced: observe and read → simple PIN logic → lockpicking →
Base64/ROT13 decoding → then the VM (SSH guessing → filesystem navigation → sudo → decode).
Agent HaX hands out each field guide at the moment the matching challenge appears, and the
labsheet mirrors the order with layered hints (nudge → recipe). The labsheet even marks a
natural 60-minute stopping point once the archive is open.

One note: the two decoding notes in Derek's office (Encoded Note 1 and 2) depend on the
CyberChef workstation from Patricia's briefcase, which in turn depends on the lockpick. A
learner who heads to Derek's office early (via the lockpick) but hasn't yet grabbed CyberChef
can read the encoded notes but not decode them. The anniversary PIN has a plaintext backstop
(the Anniversary Card), but the storage-safe PIN 1337 only comes from decoding Note 1 (its
value does appear as the worked example in Patricia's CyberChef note and the labsheet, so it
is not a hard block). Acceptable; just the one dependency worth being aware of.

## Fix summary (see 04 for applied changes)

Applied: T1 (Kali IP), T2 (secgen_scenario path), T3 (vm_object title), T4 (duplicate XML
encoder path), the CyberChef dangling `storyPath`, S1 (tenure), S2 (Maya role), README doc.
Not changed, author decision: P1 (submit_ssh_flag targetFlag form), S3 (Sarah id), S4
(player name), the field-guide lab-sheet URL scheme difference between the two SecGen XMLs.
