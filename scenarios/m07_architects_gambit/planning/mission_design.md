# m07 "The Architect's Gambit" — Mission Design

**Mission ID:** m07_architects_gambit
**Tier:** 3 (Advanced)
**Duration:** 80–100 minutes
**Focus:** ICS/SCADA security, NFS and service enumeration, privilege escalation, physical access control
**Authority:** `../PASS2_IMPROVEMENTS.md` (design rationale) and `../CONTRACT.md`. Where this doc and those disagree, they win.

> This file was `planning/stage_0_option_a_infrastructure.md`, one of four playable-branch designs.
> The four-branch architecture was cut. Option A is now **the** mission; the other three crises are
> off-camera operations the player delegates to a tactical team, specified in
> `planning/delegation_operations.md`. The old b/c/d docs sit in `planning/archive/`.

---

## The shape of the episode

Four ENTROPY operations go live inside the same sixty seconds. SAFETYNET has one field agent in
range and one tactical team.

The agent is not given a choice about where they go. Portland is the only one of the four targets
where a person standing in the building within thirty minutes changes the outcome, so that is where
Agent 0x00 is sent. The choice the player *does* get is colder: the team can reach exactly one of the
remaining three. **Two go unanswered, and the debrief reads out what happened at both.**

So the mission runs on two clocks at once. The one the player can see is the thirty-minute cascade
countdown on every SCADA terminal in the facility. The one they cannot see is running at the three
places they are not.

### The pitch in a sentence

You save 8.4 million people, and by the end you understand that the saving was the experiment.

---

## The target

### Pacific Northwest Regional Grid Control Facility

Industrial park outside Portland, Oregon. Three storeys of poured concrete, reinforced server halls,
an underground cable vault running out to the regional substations.

| | |
|---|---|
| Population served | 8.4 million across Washington, Oregon, Northern California |
| Substations controlled | 147 |
| Function | Real-time load balancing; automated grid rebalancing prevents cascade blackouts |
| Backup | On-site generators, 72-hour rating |
| Compliance regime | FERC |
| Physical security | RFID badge zones, biometric door to SCADA control, 6 guards on shift (one compromised), 42 cameras with known blind spots, audited visitor logs |

The facility is dull in exactly the way that matters. It is a room full of people watching numbers so
that a city they will never visit keeps its lights on. Critical Mass chose it because the numbers can
be made to lie.

---

## Operation Blackout — what is already happening

Three phases. The player walks in during the second.

**Phase 1 — intrusion. Complete, six months ago.**
Dr. James Mercer entered as a maintenance contractor under the OptiGrid Solutions cover and installed
backdoors in the SCADA control stack during scheduled work. The backdoors reach circuit breakers and
transformer tap changers directly. His physical credentials are still valid, because a guard on the
current shift renewed them.

**Phase 2 — destabilisation. In progress, T-30.**
An automated script fires at zero and runs a designed sequence rather than a random one:

1. Open critical breakers across the Seattle metro. Instant blackout.
2. Push the shed load onto Portland substations. Transformers over-temperature.
3. Oregon safety shutdowns trip in sequence. The dark area widens.
4. Northern California fails on load imbalance. Full regional collapse.

The timer is local and hardcoded. It cannot be stopped from outside the building. This is the whole
reason a person is being sent.

**Phase 3 — the cascade. Automated, if nobody stops it.**
Failures propagate into neighbouring grids. 23 major transformers burn out, and transformers are not
a stock item — restoration runs four to seven days. Hospitals hold 72 hours on backup. Water
treatment fails at 48. It is winter.

### The arithmetic Mercer has read

| Cause | Projected deaths, first 72 hours |
|---|---|
| Hospitals — life support failure, delayed response | 120–180 |
| Traffic — signal failure, collisions in darkness | 40–65 |
| Exposure — hypothermia, elderly and vulnerable | 80–140 |
| **Total** | **240–385** |

Plus $2.4bn in destroyed plant, $18bn in wider economic damage, contaminated water supply behind the
treatment failures, hospital evacuations conducted in the dark, and the civil disorder that follows
four days without power.

Keep these numbers in the fiction as a *document*. The projection exists as a signed PDF on Mercer's
workstation, and it is the single most useful prop in the mission: Elena has not seen it, Mercer has,
and the player can carry it from one to the other.

---

## Cast

The rule is **three cold, one conflicted**. Sympathy lives with the junior asset who was lied to.
Nobody at the top of this cell is recruitable.

### Dr. James Mercer — "Blackout" (`james_mercer`)

Critical Mass cell lead. Canon: `03_entropy_cells/critical_mass.md`. Former Department of Energy grid
engineer, twenty years spent trying to modernise the grid, warnings ignored on budget grounds until a
near-miss solar storm made his point for him and broke something in him at the same time.

Professorial. Explains while he works, because he cannot help teaching. Obsessed with elegant
cascading failures — he wants the collapse to *demonstrate* a systemic weakness, and a messy blackout
would offend him. Signature: attacks timed to peak load.

**He is cold.** He has the casualty projection. He signed it. When the player puts the number to him
he does not flinch, and he does not deny it, because to him 240–385 is the tuition fee for a lesson
the country has refused to pay for twice already. Write him as a man who has read philosophy and
arrived somewhere monstrous by argument.

The player never gets to change his mind. What the player gets is a **stance** — condemn him, reason
with him, or say nothing at all — and the debrief remembers which. `mercer_stance` is the emotional
payload of the confrontation, not a negotiation tree.

Not physically aggressive. Cornered, he goes for the manual override rather than a weapon. **No
lethal player firearm in this scene.** Endings: arrested, dropped, escaped — driven by real state.

### Elena Rodriguez (`elena_rodriguez`)

Critical Mass electrical engineer, server room. She maintains the backdoors. She also believes she is
part of a six-hour demonstration blackout with a full hospital carve-out and nobody hurt, because that
is the operational summary Mercer gave her.

She was shown different numbers. This is where the mission's sympathy lives, and it is also the
mission's intel source: she has seen the coordination traffic between the four operations and she can
tell the player that the briefing projections came *from ENTROPY*.

Three outcomes: she turns, she flees, or she is dropped. Everything she carries has a redundant
source, so a player who KOs her on sight is not stranded — they simply have to work for it on the VM.

### Jake Morrison (`jake_morrison`)

Facility security guard. Bought, not converted; he renewed Mercer's credentials for money and has
spent six months not thinking about it. Cold and hostile. He is the first evidence that ENTROPY had
inside help *here*, which is a small rhyme with the much larger problem the cable vault reveals.

Patrols the checkpoint and the ops-floor approach with a directional LOS cone. Evade him, talk past
him, or drop him. `morrison_resolved` records which.

### Thomas Park (`thomas_park`)

Critical Mass sabotage tech, cable vault. Cold, hostile, static, reacts on entry. His job is to cut
the facility's own backup power if anyone gets close to the vault, which is the pressure on the last
approach.

### Agent HaX (`agent_0x99`)

Handler, on the phone. Runs the progress-gated support hub: the three delegation briefs, the choice
itself, the redirect window, the five field guides, per-stage VM hints. She is under visible strain,
and it is not about the grid — she is watching three operations she cannot help. Let that leak into
her lines without ever letting her make the call for the player.

### Director Magnus Netherton (`director_netherton`)

Canon SAFETYNET Director of Field Operations (`04_characters/safetynet/director_netherton.md`).
Delivers the opening briefing, takes the debrief. Military intelligence background, formal, by the
book, and the book has nothing in it for tonight. **Replaces the invented "Director Patricia Morgan"**
from the earlier draft.

### The Architect (`the_architect`)

Comms only, per `masterminds/the_architect.md` — never physically encountered. Taunts arrive over the
facility intercom on the countdown.

### Cut from the earlier draft

"Marcus 'Blackout' Chen" (the name belongs to a Supply Chain Saboteurs member and is also a possible
0day alias; the earlier draft spent it twice more on two different people), Adrian Cross, Victoria
"V1per" Zhang, Specter, Rachel Morrow, Director Patricia Morgan, and the three innocent-staff NPCs
(Sarah Chen, David Kim, Rebecca Torres) whose functions fold into environmental storytelling on the
operations floor.

**Open canon issue:** the bible gives Blackout's real name as Dr. James Mercer in
`critical_mass.md`, and as Michael Bradford in `09_scenario_design/examples/grid_down.md`. This
mission uses Mercer. The bible needs reconciling either way.

---

## Rooms and lock spine

Six rooms, one coherent building. All six room types are verified to exist as tilemaps.

| Room | Type | Contains |
|---|---|---|
| Security Checkpoint *(start)* | `room_security` | Morrison, badge printer, visitor log |
| Operations Floor | `room_office` | Evacuating staff, situation board, 147-substation map, maintenance key |
| Server Room | `room_servers` | vm-launcher + flag-station, Elena, NFS coordination traffic |
| SCADA Control Room | `room_control_1x2gu` | Mercer, countdown display, `crisis_control_system`, debrief trigger |
| Backup Generator Room | `room_battery_hall` | Park's sabotage target, maintenance log carrying the vault PIN |
| Underground Cable Vault | `room_archive_1x2gu` | How the backdoors went in, Tomb Gamma, mole evidence |

Five lock types, one per field guide, each with a redundant source so no knockout can strand the run:

| Gate | Lock | Primary source | Redundant source |
|---|---|---|---|
| Operations Floor → Server Room | `rfid` | Morrison's badge (talk or KO) | Badge printer at the checkpoint |
| Server Room → Generator Room | `key` + lockpick | Maintenance key on the ops floor | Lockpick in starting inventory |
| Generator Room → Cable Vault | `pin` | Maintenance log in the generator room | Elena |
| → SCADA Control Room | `password` | Elena | Netcat C2 channel (VM flag 2) |
| `crisis_control_system` | `flag` | `station:flag_4` | — (win condition) |

**Guard space.** Morrison patrols with a ~130° cone, ~150px range, `visualize: true`, in a room large
enough to circle. Park is static and reacts on entry. Hostility is expressed through `#hostile` and
engine knockout only.

---

## VM, flags and what each one tells you

SecGen scenario `putting_it_together` — NFS shares, netcat, privilege escalation, multi-stage.
Implemented as a real `vm-launcher` object plus a separate `flag-station` with `acceptsVms`, on the
m02 pattern (`scenarios/m02_ransomed_trust/scenario.json.erb:1735-1760`), with `flagRewards` of type
`set_global`.

| Flag | Challenge | What the player finds | Sets |
|---|---|---|---|
| 1 | Mount the misconfigured NFS export on the SCADA backup server; recover the attack timeline | **The coordination traffic.** Four operations, one schedule, one authority. The crises are one operation. | `flag1_submitted`, `found_coordination_traffic` |
| 2 | Enumerate services, find the netcat C2 channel, read the operatives' traffic | Override codes **and the SCADA control room password** — the redundant route past Elena | `flag2_submitted` |
| 3 | Privilege escalation to root on the attack host | Control of the machine running the countdown | `flag3_submitted` |
| 4 | Identify the attack processes, terminate them, lock out remote access | The grid holds | `flag4_submitted`, unlocks `crisis_control_system` |

The narrative work happens at flag 1. Everything before it is a break-in; everything after it is a
different mission, because the player now knows the thing Mercer does not.

**Field guides** — exposure-gated, offered from the hub on request, never before the player has hit
the obstacle they explain:

| Guide | Offered when | Lab sheet |
|---|---|---|
| RFID cloning | First contact with the badge door | `rfid-cloning.md` |
| Lockpicking | First contact with the key lock | `lockpicking.md` |
| Recon & network mapping | `room_entered:server_room` | `reconnaissance-and-network-mapping.md` |
| Scanning & exploitation | vm-launcher first interacted | `scanning-and-exploitation.md` |
| Privilege escalation | `flag2_submitted` | `privilege-escalation.md` |

---

## Beat sheet

| # | Beat | Where | What the player learns | New state |
|---|---|---|---|---|
| 1 | Briefing in the car | Cutscene on load | Four operations, one of you, one team. The three briefs. | `briefing_played` |
| 2 | **The delegation** | HaX hub | The call is theirs, and it is not close | `team_assignment`, `team_assigned` |
| 3 | Morrison is dirty | Security Checkpoint | ENTROPY had inside help *here* | `morrison_resolved` |
| 4 | The floor is evacuating | Operations Floor | 8.4 million people, 147 substations, the clock is real | — |
| 5 | **Elena** | Server Room | She was shown different numbers. The briefing projections are ENTROPY's. | `elena_outcome`, `projection_revised` |
| 6 | The share | Server Room, VM flags 1–2 | Four operations, one schedule | `found_coordination_traffic` |
| 7 | **Redirect window**, closes T-10 | HaX hub | Acting on what she told you costs time you may not have | `team_redirected` |
| 8 | **Mercer** | SCADA Control | He has read the projection and signed it | `mercer_fate`, `mercer_stance`, `mercer_told_diversion` |
| 9 | Neutralise | SCADA Control, VM flags 3–4 | The grid holds | `grid_saved` |
| 10 | The vault | Cable Vault | Tomb Gamma — and the mole leaked *you* | `found_tomb_gamma`, `found_mole_evidence` |
| 11 | **Debrief** | SCADA Control | What happened at the three. What the gambit actually was. | `mission_complete` |

Eight of these eleven beats recontextualise the one before them. That progression is the design.

---

## The revision mechanic — curiosity pays

The projections in the opening briefing are **ENTROPY's own numbers**, leaked to SAFETYNET on purpose
as part of the gambit. One of the three is badly understated: the TechForge signing keys include
healthcare and emergency-dispatch vendors, and the dormancy period is a fraction of the ninety days
briefed. Details in `planning/delegation_operations.md`.

Two independent ways to find out, so a knockout cannot close the door:

- **Elena**, in dialogue, if the player works her rather than dropping her.
- **The NFS coordination traffic**, VM flag 1.

Either sets `projection_revised` and opens a redirect option on the HaX hub. **The window closes at
T-10.** A player who investigates early can move the team and save people the rushing player does not;
a player who finds out at T-8 has to live with knowing. Nothing about this blocks the fast route.

---

## The twist, in two turns

**Turn one — at the SCADA terminal.** The coordination traffic shows all four operations running off a
single schedule under a single authority. They are not four crises. They are one operation with four
limbs. Mercer does not know he is a diversion, and telling him is a stance choice with its own ending
(`mercer_told_diversion`) — the professor discovering he was a teaching aid.

**Turn two — in the cable vault, paid off in the debrief.** The intercepted mail on the compromised
server has SAFETYNET's deployment in it *before SAFETYNET made it*. The mole did not leak the
operation timing. The mole leaked **the agent**.

Which reframes everything. The gambit was never the attack. It was an experiment to find out how
SAFETYNET triages when it cannot cover everything — how many teams, sent where, on what basis, at what
threshold. The player answered the question honestly and at speed, under a countdown, and the answer
went straight to the person who asked it.

The player still saved 8.4 million people. The debrief says so plainly and means it. The floor that
drops is the discovery that the victory was *measured*, and that M8's mole hunt starts from a much
worse position than anyone thought.

---

## The Architect on the intercom

Taunts fire on the countdown and read `team_assignment`, so he names the operations the player left
uncovered.

**T-30.** "Agent 0x00. I've been watching your career with interest. Let's see whether you are what
your file says you are."

**T-20.** "You've sent your team. Somewhere. Tell me — did you use a number to decide, or did you use
your stomach? I'd genuinely like to know. It's rather the point of the evening."

**T-10.** "The beauty of entropy is that it doesn't require me to win. Stop this, and something else
fails. Someone else dies. You simply won't be in the room for it."

**T-5.** "Mercer believes in his cause. He'd tell you the number and defend it. Do you believe in
yours enough to name the two you abandoned?"

**T-1.** "Impressive. Genuinely. But this was never about the power grid."

**After the grid holds.** "You saved 8.4 million people. I'll have the figures from the other three by
morning. So will you — and then we'll both know the same thing about you."

---

## Outcomes

**Grid saved.** No blackout casualties. Mercer arrested, dropped, or escaped. Critical Mass cell
disrupted in the Pacific Northwest. Tomb Gamma coordinates recovered. Mole evidence recovered. The
debrief then reports the three delegated operations — one covered, two not — per
`planning/delegation_operations.md`.

**Timer expires.** Cascade cutscene over the regional map. 240–385 dead across 72 hours, $18bn, four
to seven days dark. Critical Mass takes a strategic win and a recruitment surge. M8–M10 inherit a
demoralised SAFETYNET.

**The three delegated operations** are never deterministic on this mission's outcome. They resolve on
`team_assignment` and `team_redirected` alone.

---

## Lore drops

**Tomb Gamma.** Encrypted coordinates on Mercer's terminal — an abandoned Cold War bunker in the
Montana wilderness, labelled "The Architect's workshop. Where entropy is refined." *Open decision:
`notable_locations.md` deliberately leaves the location unspecified. Promote to canon or keep the
coordinates corrupted and partial.*

**The mole.** An intercept on the compromised server:

> From: [REDACTED]@safetynet.gov
> To: architect@entropy.onion
> Subject: Deployment confirmed
> "Four targets, simultaneous. 0x00 to Portland. One team uncommitted — they'll have to choose.
> Window: thirty minutes."

The timestamp is the reveal. It predates the tasking order.

**The Architect's philosophy**, in his own audio: "Entropy is inevitable. Systems decay. I merely
publish the schedule."

**"The Professor."** Mercer's notes reference someone with deep knowledge of government security
protocols, SAFETYNET operational procedure and multi-cell coordination — an intelligence background.
*Open decision: zero hits in `story_design/`. Promote or cut.*

---

## Timer

Thirty minutes of in-game time. It needs to be a real engine clock, not the frozen ERB constant the
earlier build rendered, because the redirect window at T-10 is a decision under a deadline and means
nothing without one. A `timer_system` test scenario exists; confirm before committing to T-10 as a
hard gate.

Pressure escalation: Architect taunts on the schedule above; Mercer orders his people to slow the
player at T-15; Elena tries to leave at T-10 and can be stopped; Park cuts backup power at T-5.

Visual: countdown on every SCADA terminal, red warning lights at T-10, audible alarm at T-5, a
persistent timer overlay on the player's phone.

---

## Implementation notes

**Build order.** The state contract comes first and gates everything else — the globals table, NPC
ids, `displayName` values and ink knot names, published before any ink is written. Work packages are
in `../PASS2_IMPROVEMENTS.md` (retired ALIGNMENT_PLAN).

**Attribution.** Inline `DisplayName:` prefixes only, matching `displayName` exactly: `Dr. James
Mercer:`, `Elena Rodriguez:`, `Agent HaX:`, `Director Magnus Netherton:`, `Narrator:`, `You:`.
`#speaker:` tags do not resolve and must not be used.

**Ink hygiene.** No markdown bold, bullets or headings inside ink. A sticky unconditional exit in
every re-enterable knot. `#set_global` on every consequence-bearing choice. Choices phrased as
first-person spoken lines, not menu labels.

**Playtest questions.** Is thirty minutes tight or merely stressful? Does the redirect window feel
like a decision or a gotcha? Does Mercer read as a man with an argument rather than a villain with a
speech? Do the casualty numbers land as people or as figures?
