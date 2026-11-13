# Finale educational lines on VM content, and m10 design answers

2026-10-22. Drafted by a subagent against the finale VM plan material (FINALE_VM_PLAN.md,
STAGE_8_VM_ANSWERS.md, VM_SHAPE.md, SECGEN_DRAFT_NOTES.md, M09_PUZZLE_VM_ANSWERS.md) and the
m09/m10 SecGen drafts. Nothing has been built; every VM position is read from the plan and the
XML drafts, not a deployed box. Lines are concept-level only: no commands, no exploit steps.
Route a final check against the built VM through opus48 before any line ships (standing rule,
educational review "For the user").

---

## Task A: in-game teaching lines that touch VM content

Three lines. Two are the m10 flag-1 and flag-4 concept steers from educational review E-m6; one is
the m09 credential / account-lifecycle line from E-M4. Each is HaX, unvoiced, under 25 words per
bubble, UK English, in HaX's terse voice.

Note on scope: m10's other E-M4 fixes (the door-log reply, the Citadel Incident File item 5, the
1,206 badge records) reason over **in-game** documents (alarm log, door log, cloned cards). The
1,206 badge records are not VM content — m10's flag 2 is the staging schedule on the monitoring
host, not a personnel index — so those lines do not touch the VM and are left to the game-side
editor. Only the m09 credential line below sits on VM content.

### A1. m10 flag 1 — why an attacker goes for the defender's monitoring tools

**Concept:** security monitoring tooling is software and has its own vulnerabilities; a foothold on
the monitoring host turns the defenders' own visibility against them.

**True to the VM:** `bunker_monitor` is the security monitoring host the cameras and door systems
report to (FINALE_VM_PLAN §2, R3). Flag 1 is a user-level foothold on the monitoring service's
account. The line stays at "it watches the cameras/doors, it's software, get a foothold" — no
service name, port or technique.

**Target:** `scenarios/m10_full_disclosure/ink/m10_phone_agent0x99.ink`, knot `support_hub` (new
topic, placed near the other flag steers, e.g. after `hatch_topic`). New `=== monitor_topic ===`.
Add a `VAR hax_monitor_asked = false` beside the other `hax_*_asked` vars (lines 26-28). Hub choice:

```
+ {door_scene_done and not flag1_submitted and not hax_monitor_asked} [Their monitoring. Where do I start?] -> monitor_topic
```

```
=== monitor_topic ===
~ hax_monitor_asked = true
Their monitoring watches the cameras and the doors. It's still software, and software has holes.
Get a foothold on it and their own eyes work for us.
-> support_hub
```

### A2. m10 flag 4 — the link to Tesseract's "build your own way out first"

**Concept:** isolation boundaries (a container, a jail) are a control, not an absolute — they can be
escaped; and an operator who isolates his most critical box may still cut himself an exit. Ties
flag 3 (escape the release service's container) to flag 4 (escape the jail on the core host) as one
progression.

**True to the VM:** flag 4 is full control of `core_host`, reached after leaving the jail
(FINALE_VM_PLAN §2 row 4, R6). "builds his own way out first" is already a HaX line in the mission
(`m10_tesseract.ink:879, 881`), so the steer echoes established voice. No chroot/jail/technique
word is used.

**Target:** same file, knot `support_hub` (new topic). New `=== box_topic ===`. Add
`VAR hax_box_asked = false`. Hub choice:

```
+ {outer_lock_open and not flag4_submitted and not hax_box_asked} [His box.] -> box_topic
```

```
=== box_topic ===
~ hax_box_asked = true
He walled his box off, the way the release service was boxed in. Isolation like that can still be broken out of.
And he always builds his own way out first. Find his.
-> support_hub
```

### A3. m09 credential / account lifecycle (E-M4)

**Concept:** credential and account lifecycle — when a person leaves, their accounts and access are
revoked the same day; an unrevoked credential is a standing way back in.

**True to the VM:** flag 3 on `tomb_beta_server` is the staff credential issued to Tesseract,
sitting in the web service account's home, **never revoked** (FINALE_VM_PLAN §1 row 3, R1;
SECGEN_DRAFT_NOTES m09 row 3; M09_PUZZLE_VM_ANSWERS Q2/D2 — "an unrevoked credential that was never
revoked"). The identity scene already states "Issued before he left us. Never revoked."
(`m09_phone_agent0x99.ink:385-386`), so this names the control behind that fact. No technique.

**Target:** `scenarios/m09_digital_archaeology/ink/m09_phone_agent0x99.ink`, knot `support_hub`,
existing topic `[About the name.]` (gated `identity_scene_done and not name_topic_given`, lines
697-701). Add the line inside that topic (unvoiced hub text). This matches the review's intent
(a beat on `identity_scene_done`) and keeps it on an existing unvoiced hub rung rather than adding
a timed text.

```
+ {identity_scene_done and not name_topic_given} [About the name.]
    ~ name_topic_given = true
    He told us to call him Adrian on the course. None of us ever managed it.
    When someone leaves, their accounts and their kit go the same day. His were never revoked. Seven years on, the credential still works.
    That's all you get tonight. The rest is afterwards.
    -> support_hub
```

(If a hub line is not wanted here, the same text works as an unvoiced HaX text on
`identity_scene_done`, once, `delayMs: 4000`, in the `hax_maps` block — the review's original
placement.)

---

## Task B: m10 scenario-design-review "Questions for you" (VM)

Answered at story / design level from the VM plan material. "Settled?" says whether the plan
decides it; the rest is for the user to decide or check at build. Nothing is built, so every
box-behaviour claim is a plan reading, not a verified fact.

### B1. Can the later hosts be attacked before the story reaches their rooms? Could a fast student take all four flags at the gate?

**Leaning yes — unsettled, and a build-time decision.** m10 has one attack box (the forward post
terminal) and three targets: `bunker_monitor`, `release_host`, `core_host`. The attack box carries
the IP list in the m08 pattern (FINALE_VM_PLAN §2; SECGEN_DRAFT_NOTES), and the plan places no
network segmentation between the three targets. SECGEN_DRAFT_NOTES build-check 10 is explicit:
"The climax (`release_host`, `core_host`) is not gated by SecGen. Flags 1 and 2 gate it only in the
game." So on a flat network a fast student could reach all three targets from the forward post and
capture all four VM flags early. The in-game **submission stations** still enforce story order
(flag 2 at the hall console, flag 4 at the core terminal), so the narrative still unfolds in
sequence — but flag capture is not held back by the VM.

- **Settled by the plan:** the three-target shape, the single attack box, no SecGen gating of the
  climax (FINALE_VM_PLAN §2; SECGEN_DRAFT_NOTES; STAGE_8_VM_ANSWERS m10 Q1/Q3). This is the same
  early-reach question as m09 Q1/D1 (STAGE_8_VM_ANSWERS; M09_PUZZLE_VM_ANSWERS D1).
- **For the user at build:** decide whether to segment the network so `release_host` and
  `core_host` are unreachable until the story opens them (matching the dramatic order), or accept
  early capture and rely on the in-game stations to gate the story. Confirm on the built box whether
  the three targets sit on one flat network reachable from the attack box.

### B2. Does the release host show anything that reads as "the disarm" HaX promises?

**No, as planned.** HaX's hatch line promises "Get out of the container onto that host, and you've
got the disarm." (`m10_phone_agent0x99.ink:517, 521`). But the release host's flag file
(`docker_flag`, root's home) carries **the flag string only — no text** (SECGEN_DRAFT_NOTES m10
row 3). The "disarm" is an **in-game** action: leaving the container arms the disarm at the
server-hall console (FINALE_VM_PLAN §2 row 3, R5). Nothing on `release_host` reads as a disarm or
kill switch.

- **Settled by the plan:** flag 3's file has no accompanying text; the disarm is the console action
  (SECGEN_DRAFT_NOTES; FINALE_VM_PLAN §2, R5).
- **For the user at build:** either (a) seed a file on `release_host` beside flag 3 that reads as
  the disarm / kill switch, so HaX's line is literally true on the box, or (b) keep the disarm as
  the in-game console action and soften HaX's line so "the disarm" is plainly the console step, not
  something read on the host. This is a seed-content/story-text call in the same family as the M3/M4
  seed rulings.

### B3. Does the core host hold the unsent notice the core scene leans on?

**No, as planned — unsettled.** `flag4_lines` tells the player the unsent vendor notice is "on
here" (`m10_tesseract.ink:196-199`), and exchange 2's rebuttal leans on that notice. But m10's
core-host flag file (`chroot_flag`, root's home) carries **the flag string only — no text**
(SECGEN_DRAFT_NOTES m10 row 4), and FINALE_VM_PLAN §2 row 4 lists only "the stolen copy and the
live line into the Citadel's vault" for `core_host`, not the notice. The m10 seed-content ruling
(M4) covers only the `bunker_monitor` schedule, not a core-host notice. (The unsent notice *is*
seeded in **m09**, on `tomb_beta_server` beside flag 3 — `vendor_notice_draft` — but that is a
different box in a different mission.)

Important mitigation: the notice is delivered to the player **through HaX's dialogue** on every save
(`flag4_lines` names it whether or not `m09_completed`), so the core scene does not strictly require
the player to read a VM file. The educational review confirms a non-reader can still land exchange 2.

- **Settled by the plan:** the core-host flag file has no seeded notice; the notice reaches the
  player via dialogue (SECGEN_DRAFT_NOTES m10 row 4; FINALE_VM_PLAN §2 row 4).
- **For the user at build:** decide whether to seed the unsent vendor notice (and, on an
  m09-carryover save, Helena's notice) as a file in `core_host`'s root home beside flag 4 so the
  "it's on here" line is literally true, or accept that the notice is narrative-only (HaX reports
  it) and confirm exchange 2 never asks the player to have read a VM file. If literal-on-the-box is
  wanted, this is new seed content beyond the current M4 ruling.

### B4. Does the 100–110 minute estimate still hold?

**Unsettled — no timed run has been done.** The plan sets no per-flag time; the review's working
figure is about 8 minutes a flag, ~32 minutes of the ~105-minute budget, and the timed VM pass was
waived before stage 7 (STAGE_8_VM_ANSWERS m10 Q4). Four targets plus the attack box is the largest
SAFETYNET build so far (SECGEN_DRAFT_NOTES build-check 1), so build and test time are themselves a
risk to the estimate.

- **Settled by the plan:** nothing; explicitly deferred to a timed run (STAGE_8_VM_ANSWERS m10 Q4).
- **For the user at build:** run the timed VM pass once built (FINALE_ARC §13 item 45) and set the
  published length from it. If the VM portion runs over ~34 minutes, the review's cut order starts
  with the backdoor task. The 100–110 total holds only if the VM portion lands near 32 minutes and
  the browser portion matches prior estimates.

---

## Cross-cutting build note relevant to B1–B3

Root login over SSH must stay disabled on `release_host` and `core_host` (the SecGen draft removes
`ssh_root_login` and the `hackerbot_access_root_password` datastore). If it is left on, a student
logs in as root and reads both climax flags without the escape — which would also make B1 worse.
Confirm after the build that root login over SSH is refused (SECGEN_DRAFT_NOTES; FINALE_VM_PLAN §2
build notes, known issue 1).
