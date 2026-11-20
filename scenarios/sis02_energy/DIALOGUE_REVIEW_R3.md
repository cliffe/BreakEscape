# sis02 Albion Battery Hall: Code Red, dialogue review round 3 (loop round 1)

Reviewer: npc-dialog-review skill in full, 2026-10-09, on main at merge 1cece907 plus today's uncommitted Helen narrator intro. Read-only; proposed fixes were applied to scratch copies only, compiled and re-run there.

Kind of game: Security-Informed Safety serious game, education first. Items closed in `DIALOGUE_REVIEW.md`, `DIALOGUE_REVIEW_R2.md` and `SCRIPT_EDITOR_REVIEW.md` are not re-raised.

Voiced: Narrator (Charon), Helen Marsh (Aoede), Priya S. (Leda). Marcus Webb and Tom Hadley are phone texts and are never voiced (ink headers, `CAST_DESIGN.md`). Helen's existing lines were voiced in ae2af56c; the three narrator lines added today have not been voiced yet, so changing them now costs nothing.

## 1. Checks run

| Check | Result |
|---|---|
| inklecate, all four inks, compiled into the scratch folder | 0 failed, no warnings, no loose ends. The scratch JSON matches the repo JSON for all four, so the repo JSON is current. |
| `ruby scripts/validate_scenario.rb … --skip-ink --no-graph` | Schema passes. The only dialogue-facing item is "eventMappings[13] person-chat cutscene has no background" (Helen's `evacuation_scene`). The rest are the four known Helen onceOnly overlap warnings and the credit-section and VM suggestions, which belong to the design review. |
| `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/sis02_energy/` | **0 findings, every rule.** Helen 69 lines (median 17 words, p90 22, max 25), Marcus 82 (14/20/24), Priya 98 (17/25/30), Tom 35 (15/21/24), 23 timed texts (17/25/27). |
| `loopcheck` from `start`, all four NPCs, over 5 states (none; dial read; everything found plus gas alarm; evacuated; dial read plus registers saved) | No runtime errors anywhere. |
| Multi-call inkjs scripts (`scratchpad/sis02-dialogue-r1/marcus_multicall.js`, `gas_paths.js`) | Prove D3-1, D3-2, D3-3, D3-4 and D3-6 on the current ink. They no longer reproduce once the proposed fixes are applied, and loopcheck stays clean afterwards. |
| House style grep (banned words, "Cyber Security", printed `{var}` in voiced lines, em dashes in dialogue) | Clean. The only inline conditionals in voiced lines choose between fixed strings (Helen :112, :148, :317; Priya :74, :411), which is allowed. |
| Globals set by choices | All declared and all read by Priya's debrief or the credits (en002_verdict, patch_decision, gauge_verdict, shutdown_argument, evidence_before_esd, isolation_scope, nis_initial_choice, trent_water_verify_first, tom_told_false_authority, the three "view heard" flags, cable_pull_agreed). |

## 2. Helen's narrator intro (`npc_helen_marsh.ink:63-67`)

The pattern is right: `Background[…]` then `Narrator[none]`, then `Background[none]` before Helen speaks. This matches m01 :230-231, m02 :263-264 and sis01 `npc_sarah.ink:56-59`, and a top-level `narrator` voice block exists (`scenario.json.erb:130-137`). The voice is a plain, unhurried scene-setter, which suits the Charon style. Checked against the pack: "on the Trent near Newark" (:681), "Saturday, half past six" (the 06:30 briefing, :783, :854), "two hundred megawatt-hours" (:839) and "charging … overnight" (about 48 MW on the overnight charge, :839) are all correct. "One car in the car park" matches the background art (`albion_energy.png` shows a single car).

### D3-5 (major): the narrator and Helen give the same fact back to back

`:66` "Your team is booked for the seven o'clock maintenance window on the grid PLC" is followed straight away by Helen at `:68`, "You're the lot booked for the seven o'clock window on the grid PLC?" This is the skill's "same fact twice in a row" rule (2i), and it falls on the first exchange of the game. Helen's line is already voiced. The narrator line isn't, so change the narrator line. Using it for the pack's 06:15 arrival (:781) instead gives the player something new and leads into Helen's "Look at that screen":

- `npc_helen_marsh.ink:66` → `Narrator: One car in the car park. The site's SCADA engineer got in at quarter past six, and she hasn't taken her eyes off the screen since.`
- Voiced: yes (narrator), not yet cached.

### D3-9 (minor): "Rows of white containers" against "Hall 1"

`:65` describes containers, which matches the art, but every other line in the game, the pack (:839) and the room itself call it Battery Hall 1 and Hall 2. A student who hears "containers" and is then sent to "Hall 1" may look for a container. Optional fix that keeps the picture and names the halls:

- `npc_helen_marsh.ink:65` → `Narrator: Two battery halls and rows of white cabinets: two hundred megawatt-hours of lithium-ion cells, charging off the grid overnight while the county sleeps.`
- Voiced: yes (narrator), not yet cached.

Noted, no change: the pack says the team was already on site when Helen arrived at 06:15 (:781), and Jay Patel had only just gone home, so "One car" stretches it. I would keep it anyway. It matches the art, it shows how empty the site is, and Priya's "you'll be watching it from the car park" (`npc_priya_s.ink:172`) gets an echo from it.

Handover to Helen: once D3-5 is fixed, the narrator ends on Helen watching the screen, and Helen opens by asking the team who they are. That reads cleanly.

## 3. Stale options and lines wrong on a path

### D3-1 (major, S3/S5 family): Marcus keeps offering "We're pressing the ESD now." after the registers are saved

`npc_marcus_webb.ink:110` is gated on `evidence_before_esd == ""`. In `evidence_scene`, the `bms_registers_saved` branch (`:168-170`) replies "You've saved the BMS register table already? Good. Then press it." and returns to the hub without setting `evidence_before_esd`. The option therefore stays on every later call until the ESD is pressed, and each pick gives the same line again. Proven by `marcus_multicall.js`: argue for the hazard after saving the registers, and the option is still there on calls 2 and 3. This happens on any route where the player exports the registers before arguing with Marcus, and also on the hazard branch, which diverts straight into `evidence_scene`. Nothing is softlocked, but the option is stale on every call.

- Fix: `npc_marcus_webb.ink:110` → `+ { anomaly_detected and not esd_activated and topic_shutdown_argued and evidence_before_esd == "" and not bms_registers_saved } [We're pressing the ESD now.]`
- Voiced: no. Leaves the debrief and credits alone: Priya's `bms_registers_saved` branch comes first (`npc_priya_s.ink:148`).

### D3-2 (major): Helen's "shut down now?" decision is still offered in a gas alarm

`npc_helen_marsh.ink:126` has no `hydrogen_alarm` gate. If the dial was read, the ESD hasn't been pressed and the gas alarm is up, Helen still asks "If I'm wrong, that's half the site off the grid…" and offers "[Give me five minutes with the historian first.]", answering "Five. Not six." That is unsafe advice in a gas alarm and contradicts her own N1 rule (`:114`). It also makes the debrief wrong: `shutdown_argument` becomes `"evidence"`, so Priya says "The gas came up while you were getting them" (`npc_priya_s.ink:143`) when the gas was already up before the choice. Proven in `gas_paths.js`. Her gauge question (`:121`, "Which would you bet the hall on?") is moot at that point too.

- Fix: `npc_helen_marsh.ink:126` → `+ { anomaly_detected and not esd_activated and not hydrogen_alarm and shutdown_argument == "" } [Should we shut Hall 1 down now?]`
- Fix (minor, same cause): `npc_helen_marsh.ink:121` → `+ { anomaly_detected and gauge_verdict == "" and not hydrogen_alarm } [That dial in the hall. Which do we believe?]` (`facility_evacuated` implies `hydrogen_alarm`, so that test is dropped.)
- Voiced: no line text changes.

### D3-3 (major): Marcus argues for the logs during a gas alarm

`npc_marcus_webb.ink:108` has the same gap. In a gas alarm, "[I think Hall 1 should come off now.]" gets "I'd want the jump server logs before we drop half the site. If it's a sensor fault, we've paid penalties for nothing." Nobody would say that with hydrogen at 1%. Round 4 fixed this for his status line (`:348`), but this option was left open. Proven in `gas_paths.js`.

- Fix: `npc_marcus_webb.ink:108` → `+ { anomaly_detected and not esd_activated and not hydrogen_alarm and not topic_shutdown_argued } [I think Hall 1 should come off now.]`
- Voiced: no.

### D3-4 (major): Marcus's first message in a gas alarm sends the player to the dial

If the player first messages Marcus after the gas alarm and before reading the dial, the only choice is `:85` "[Nothing solid yet. Helen doesn't like the look of the screens.]". Marcus replies "Get me something… The dial, the historian, anything." That breaks the rule that nothing sends the player into Hall 1 once the gas is up, and the player's own line is wrong too. Proven in `gas_paths.js`.

- Fix: add before `:85`, and gate `:85` on `not hydrogen_alarm`:

```
+ { hydrogen_alarm and not facility_evacuated and not anomaly_detected and not historian_flatline_found and not esd_activated } [Hall 1's in gas alarm. Nobody's read the dial yet.]
    Then leave the dial. Door station, now. We'll find the cause after.
    -> first_call_next
+ { not hydrogen_alarm and not facility_evacuated and not anomaly_detected and not historian_flatline_found and not esd_activated } [Nothing solid yet. Helen doesn't like the look of the screens.]
```

- Voiced: no. Checked in scratch: compiles, and `first_call_next` then sends the player to the workshop, which is correct.

### D3-6 (major): Tom describes the intrusion before anyone has found it

`npc_tom_hadley.ink:106-108`. "[What would OT monitoring have caught?]" can be asked from the first message. Tom has just said "I've never seen your jump server sessions" (`:101`), and then he answers "A contractor who left over a year ago, logged in at quarter to two from a print server." He can't know that, and it gives away the ENG-02 discovery. "Till Helen read a dial" is also wrong on routes where the dial was never read (ESD first, or the gas alarm first).

- Fix: `npc_tom_hadley.ink:107-108` →

```
    { jump_server_confirmed:
        That session you found. A contractor who left over a year ago, logged in at quarter to two from a print server. We'd have rung you by two.
        Instead it took Helen not trusting a screen.
    - else:
        Anyone on your jump server who shouldn't be, at an hour nobody works. I'd see that. As it is, I can't.
    }
```

- Voiced: no.

### D3-8 (minor): "The dial can wait" after the dial has been read

`npc_helen_marsh.ink:319` (`next_steps`, gas alarm, no ESD) says "The dial can wait" even when the player has already read it.

- Fix: `:319` → `Helen Marsh: Not the hall, not now. Press the station by the door.{ not anomaly_detected: The dial can wait.}`
- Voiced: yes. One new text variant ("…by the door."); the cached full line still covers the dial-not-read case.

### D3-13 (minor): "Those cells won't wait" after the ESD or the fire

`npc_marcus_webb.ink:244` (`isolation_scope_scene`, "[Let me think.]") can be reached after the ESD or the evacuation, when the cells are no longer what's pressing.

- Fix: `:244` → `    Not too long. {esd_activated: They're still in our network.|Those cells won't wait.}`
- Voiced: no.

## 4. Phone texts

Marcus and Tom read like texts: short, no greetings after the first, no self-prefixes (the lint agrees). Two small seams, both in Tom's first message:

### D3-11 (minor): Tom signs in twice

Once `jump_server_confirmed` is true, Tom's timed text arrives 9 s later and opens "Tom at CastleTech. Something wrote a file…" (`scenario.json.erb`, Tom's eventMappings). If the player then opens him for the first time, `npc_tom_hadley.ink:43` prints "Tom, CastleTech SOC." under it.

- Fix: move `Tom, CastleTech SOC.` from `:43` into the `- else:` branch at `:46`, above "Quiet from our end…".
- Voiced: no.

### D3-12 (minor): Tom's first-message menu can't answer his own Trent Water text

A player who opens Tom because of that text gets three options (`:54-63`), and none of them is about Trent Water. The Trent topic only appears in the hub, after a detour.

- Fix: add at the top of `first_call` (`:54`):

```
+ { jump_server_confirmed } [Your message about the shared server and Trent Water.]
    -> trent_water_topic
```

- Voiced: no. Checked in scratch: compiles, loopcheck clean.

## 5. Choices that matter (2d), hub structure, attribution

- **OK.** Every decision scene sets a declared global that Priya's debrief or the credits read back (section 1). The debrief's own choices are reflection questions that converge, and the two that matter set `en002_verdict` and `patch_decision`. The routes are distinct and arguable: dial or screen, hazard or logs, save the registers or press, how far to isolate, send now or wait, Trent now or verify first.
- **OK.** Hubs have a sticky exit, there are no starved knots (loopcheck), and closings are short. Priya's closing runs once (`debrief_closed`), and re-entry lines vary (`hub_quiet`, `start_quiet`, `debrief_quiet`).
- **OK.** Every `Name:` prefix resolves (Helen Marsh, Priya S., Narrator). Phone inks carry no prefixes. Player choices are first-person speech with no `You:` echoes. There are no `#speaker:` tags.
- **OK.** S1 (burnt first-call gate) is closed: Marcus's `first_call` options are all sticky and lead to the hub, which offers the session, sign-off and NIS paths on their own globals. The S3 check found no promised unlock without its setter: Marcus's "I'll tell him it's coming from me" (`:213`) sets `network_isolation_authorised` (`:214-215`), and Helen's "Press it, and I'll tell Marcus" is honoured by Marcus reading `shutdown_argument` (`:147-148`). For S4, `#complete_task` only sits in `start` for the briefing and first-contact tasks, where talking is the outcome.
- **Noted, not raised:** Helen's `arrival_briefing` says "too normal for a night on charge" (`:69`) and then "on a charge cycle, something always moves" (`:71`). The pack says the same and the lines are voiced, so I'd leave it.
- **Noted, outside this review:** the validator asks for a background on Helen's `evacuation_scene` cutscene. A plain frame may be what was intended. That's for the design reviewer.

## 6. Findings and verdict

No blockers. No Must-fix softlocks: every stale or wrong path found here still lets the player finish.

| Id | Level | Where | Voiced lines touched |
|---|---|---|---|
| D3-1 | major | Marcus `:110` "We're pressing the ESD now." stays after the registers are saved: add `and not bms_registers_saved` | 0 |
| D3-2 | major | Helen `:126` (and `:121`, minor) shutdown and gauge decisions offered in a gas alarm, which makes Priya `:143` wrong: add `not hydrogen_alarm` | 0 |
| D3-3 | major | Marcus `:108` argues "sensor fault, logs first" in a gas alarm: add `not hydrogen_alarm` | 0 |
| D3-4 | major | Marcus `:85` first message in a gas alarm sends the player to the dial: new gas-alarm option, gate the old one | 0 |
| D3-5 | major | Narrator `:66` repeats Helen `:68` (booked for the 07:00 window): rewrite the narrator line | 1 narrator, not yet cached |
| D3-6 | major | Tom `:107-108` describes the c.ellison session before anyone has found it: branch on `jump_server_confirmed` | 0 |
| D3-8 | minor | Helen `:319` "The dial can wait" after the dial has been read: inline conditional | 1 new Helen variant |
| D3-9 | minor | Narrator `:65` "white containers" against "Hall 1": optional rewrite | 1 narrator, not yet cached |
| D3-11 | minor | Tom `:43` signs in twice after his Trent text: move into `else` | 0 |
| D3-12 | minor | Tom `first_call` has no Trent Water option: add one | 0 |
| D3-13 | minor | Marcus `:244` "Those cells won't wait" after the ESD: inline conditional | 0 |

All the proposed text was compiled in `scratchpad/sis02-dialogue-r1/fixed/`. Loopcheck is clean there, and the multi-call scripts no longer reproduce D3-1 to D3-4 or D3-6. Total voiced cost: 2 narrator lines that haven't been voiced yet, plus 1 new Helen variant.

After the fixes, run tagdiff against HEAD. Expected differences are choice conditions only, plus one new choice each in Marcus `first_call` and Tom `first_call`. There are no new tags or globals.

**Verdict: revise.** The six majors are small edits, and five of them change no voiced line. A short confirmation round is enough after that.
