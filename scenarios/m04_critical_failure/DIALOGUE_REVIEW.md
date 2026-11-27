# m04 Critical Failure — Dialogue review (pass 4)

Script-editor pass over every ink file in `scenarios/m04_critical_failure/ink/` and the
player-facing strings in `scenario.json.erb`. Approach is the one approved on m07
(`scenarios/m07_architects_gambit/DIALOGUE_SAMPLES.md`, `DIALOGUE_EDIT_NOTES.md`): tighten,
never cut gameplay-critical information; keep each line's antecedent; vary the rhythm.

References read first: `AGENTS.md`, `docs/agents/PASS4_BRIEF.md`, the dialogue style guide
(`story_design/universe_bible/09_scenario_design/dialogue_style.md`), the voice bible
(`.../04_characters/voice_bible.md`), `README_ink_best_practices.md`, the humanizer skill, and
this mission's `DESIGN_REVIEW.md` (both "Changes made" rounds), so every scene's job was known
before a word changed.

Snapshot for the diff: `scratchpad/m04-dialogue/ink-before/` and `scenario-before.json.erb`.
Static checks after: ink compile 10/10, validator clean, door alignment OK, erb renders,
inkcheck + loopcheck over a state matrix, reopencheck 0 problems, dialoguelint before→after.

## 1. Skill findings (npc-dialog-review)

### Phase 1 — compile and validate
- All ten inks compile, 0 failed. The three `-> END` warnings are the briefing, the debrief
  and (expected) the one-shot operative hand-offs — legitimate endpoints.
- Validator: clean. Two "missing recommended behavior" warnings on the hidden seed cameos
  (Netherton, Nightshade) are pre-existing and correct — they co-speak in the briefing
  cutscene, which the briefing NPC drives; they need no behaviour of their own.

### Phase 2 — dialogue review

**2a Attribution & narration.** Every `Character Name:` prefix resolves (checked against the
erb NPC ids/displayNames). Phone inks carry HaX's / Vance's lines unprefixed, as the brief
requires; person-chat inks keep prefixes. Narration is on `Narrator:`. No standalone `*emote*`
lines. One narration AI-tell found and fixed (Voltage scene, see below).

**2a-bis Supported by the scenario.** The dialogue's props and directions match the erb
(workshop off Hall 1, plant room off Hall 2, the Hall 1 duty panel = Vance's print, the
tool case under the workshop bench). No stale geography. Vance is stationary (no patrol) and
nothing in his lines claims he moves.

**2a-ter Voices.** Every speaking NPC has a voice block. No voice name is shared by two
characters who appear together. **One portrait defect found and fixed outside the ink** (the
brief's non-dialogue item): `robert_vance` had no talk/headshot/viseme set, so his dialogue
bust showed the generic hooded silhouette — see §"Non-dialogue fix".

**2b Player choices.** First-person throughout. No `You:` echo lines anywhere (0 before, 0
after). Non-verbal choices (`[Say nothing.]`) are the only ones followed by a Narrator beat.

**2c Hub integrity / 2c-bis starved knots.** Untouched by this pass (the design pass hardened
them); loopcheck confirms every hub loops and every one-shot reaches a clean end.

**2d Choices that matter.** Left as the design pass wired them (Cipher's night-crew branch,
Relay's clone route, Voltage's three stances, the disclosure choice, the what-failed choice).
This pass only rephrased the words, never the wiring.

**2e–2f State / influence.** No `#set_global`, `#influence_*`, VAR, knot or divert changed —
confirmed per-file by `tagdiff.mjs` (STRUCTURE UNCHANGED, all ten).

### Voice-bible problems this pass was briefed to fix
- **HaX reads like a task list on the phone.** `vm_guidance` ("Perfect. Use it to scan the
  SCADA network topology. / Identify compromised systems, enumerate services, find their
  attack mechanism.") and `vance_status_inquiry` ("Vance's cooperation will be valuable")
  are the exact lines the voice bible flags (`voice_bible.md:42`, `:351`). Both were corporate
  objective-speak, the one register HaX never uses. Rewritten to her real voice: fact first,
  plain nouns, the human beat after.
- **The fingerprint security point.** Made clear without being said twice in the same words:
  the plant-reader line (Vance, in person and on the phone) carries "they lifted my print off
  the panel — do the same"; the erb print bark says "the reader can't tell a lift from a
  living thumb"; the debrief says "a print names you — it can't prove you're the one standing
  there". Three different framings of one idea.
- **Nightshade's m08 seed kept verbatim:** "The physics doesn't lie and neither do I" stays in
  the briefing (approved foreshadowing).

## 2. Changes made

Prose only. No tag, knot, VAR, divert or choice condition changed — `tagdiff.mjs --old <snapshot>`
reports **STRUCTURE UNCHANGED** for all ten ink files. The only non-ink change is Vance's sprite
config (§"Non-dialogue fix") and the three over-length erb timed texts. m04 audio is generated
after this pass, so every spoken-line change is free.

| File | Spoken lines touched | Why |
|---|---|---|
| `m04_opening_briefing.ink` | ~45 | HaX off the stock "critical infrastructure threat" opener; numbers said aloud ("two hundred and forty thousand"); the objectives list led with the first action and the workshop location; Netherton/Nightshade trimmed under 30 words; one dropped Narrator ("you sit forward") that only padded the choice. |
| `m04_phone_agent0x99.ink` | ~55 | The two bible-flagged lines rewritten (`vm_guidance`, `vance_status_inquiry`); "valuable" removed; every hint now opens on the next action, plain HaX register, phone lines under 25 words; the three-vector line split so it fits. |
| `m04_npc_robert_vance.ink` | ~40 | Teesside engineer's plainer register; numbers spoken; the plant-reader "do what they did" kept but tightened; reveal beats pared of "Oh God, what have I done?" melodrama into something blunter. |
| `m04_phone_robert_vance.ink` | ~27 | Every over-length line (L106, L107, L135, L158, L160) brought under 25; "ESD" spoken as "the shutdown"; urgency branches kept their state-aware facts. |
| `m04_npc_voltage.ink` | ~30 | The 34-word ideology line split into two; the villain kept his long, calm beats (he earns them) but each now moves; one Narrator "It isn't doubt. It's irritation" de-tell'd to "Not doubt. Irritation." He keeps one rhetorical contrast as a character habit. |
| `m04_closing_debrief.ink` | ~48 | "Excellent" grades cut (HaX states the cost, doesn't grade); the four-mission roll-call folded into one line that points back at how close m04 came; disclosure outcomes tightened; the what-failed beat reworded for three distinct framings of the biometric point; "This isn't about X anymore" removed. |
| `m04_npc_operative_cipher.ink` | 0 | Already tight, in voice, lint-clean. Left as the design pass wrote it. |
| `m04_npc_operative_relay.ink` | 0 | As above — her "I did the modelling" beats are strong and clean. |
| `m04_npc_operative_static.ink` | 0 | Four-words-at-a-time by design; nothing to cut. |
| `m04_npc_security_guard.ink` | 0 | In voice (polite, grumpy West Country), lint-clean. |
| `scenario.json.erb` (timed texts) | 3 | The three over-30-word texts (distcc offer, "don't trust the screens", Vance's ally text) trimmed under 30. Other player-facing strings (barks, credits, readable docs) read well and were left. |

### Lint before → after (by rule)

| Rule | Before | After |
|---|---|---|
| `line-len` (ink over cap) | 11 | 0 |
| `text-len` (timed text over cap) | 3 | 0 |
| `not-x-but-y` | 2 | 0 |
| `banned-word` ("valuable") | 1 | 0 |
| `inflated` ("let me know if you need anything") | 1 | 0 |
| **Total** | **18** | **0** |

Medians after: briefing 12, phone HaX 11, Vance 9, Vance phone 11, Voltage 9, debrief 14,
operatives 5–7. All under the per-channel caps; near m01's target of 12.

### tagdiff
`node scripts/ink_runtime_check/tagdiff.mjs --old scratchpad/m04-dialogue/ink-before/<file> <file>`
→ **STRUCTURE UNCHANGED** on all ten. (A full-dir tagdiff against `HEAD` reports the 204
differences from the pass-4 *design* pass, already logged in `DESIGN_REVIEW.md` round 2 — none
of them is from this dialogue pass.) Informational prose counts moved where lines were split to
fit the caps (Vance phone 40→44, Voltage 80→81, debrief 118→111, briefing 103→99,
phone HaX 153→146); `You:` lines 0→0 everywhere.

## 3. Non-dialogue fix — Vance's dialogue portrait

m04's confirmation playtest flagged Vance's dialogue bust as a generic hooded silhouette. Cause:
`robert_vance` was on the `hacker` sprite sheet with no `spriteTalk`, `spriteVisemes` or
`avatar`, so the portrait fell back to the hooded default. Changed to **`male_telecom_v2`** — a
hi-vis field/plant engineer with a complete talk + headshot + viseme set, which suits an OT
operations manager on a night shift and clashes with no one on screen in m04 (HaX; Netherton
`male_spy_v2`; Nightshade `male_scientist_v2`; the guard and the four operatives on
`hacker-red`). This also fixes his portrait in the debrief, where his lines resolve to this
NPC's displayName. Assets already in the repo — no art generated, no cost.

## 4. Static checks run
- `./scripts/compile-ink.sh m04_critical_failure` — 10 compiled, 0 failed.
- `ruby scripts/validate_scenario.rb` — clean (erb renders; two pre-existing seed-cameo warnings).
- `python3 scripts/check_door_alignment.py` — all doors OK.
- `inkcheck.js` / `loopcheck.js` over a state matrix (Vance-phone urgency branches, debrief
  vented+captured+what-failed, debrief Vance-KO, the 61°C turn, three-vector) — 0 runtime errors.
- `reopencheck.mjs … m04_critical_failure` — 1800 reopens per phone ink, 0 problems.
- `dialoguelint.mjs` before/after — 18 → 0.

## 5. Not done / backlog
- Operative and guard inks were judged already up to standard and left unchanged.
- Readable world documents (notes, blueprints, logs) were left as written; they read as props,
  not dialogue, and the design pass had already tuned them.
- No browser playtest run (prose-only change; the design pass's `PASS4_PLAYTEST.md` covers the
  critical path). A read-through of the debrief on screen would confirm the what-failed beat
  paces well, and a look at Vance's new portrait in the ops office and the debrief would confirm
  the sprite swap.

## Script edit round

Applies `DIALOGUE_EDIT_NOTES.md` (verdict: revise, light). Same snapshot as before
(`scratchpad/m04-dialogue/ink-before/`).

**Correction to §1.** I wrote that the phone inks carried HaX's and Vance's lines unprefixed. They
didn't: 18 `Agent HaX:` and 35 `Robert Vance:` prefixes were still there. Both are now 0 (S1). The
narration tell I called "de-tell'd" in Voltage's scene was the same shape with the verbs removed; it's now
replaced with what the camera sees (M3).

| Item | Done | Where |
|---|---|---|
| M1 | RFID guide reverted to "Read it, save it, play it back at the reader." (the cloner emulates; there are no blank cards) | HaX phone `request_rfid_guide` |
| M2 | All 13 of Vance's debrief reactions rewritten in his voice, using the editor's lines; "240,000" now spoken in words; "duct tape" → "gaffer tape". Also the low-trust line ("I don't follow all of it. I know the hall's still standing."), which was in the same register | debrief disclosure knots, `disclosure_outcome`, `debrief_end_*` |
| M3 | Voltage: "…His eyes go to the laptop clock."; Relay: "There is no flinch in it." | Voltage `voltage_states_the_number`, Relay `relay_doubt` |
| M4 | First hub choice → "[What happens if they set those batteries off?]" | briefing hub |
| S1 | Contact prefixes stripped: HaX phone 18 → 0, Vance phone 35 → 0. No spoken text changed | both phone inks |
| S2 | "Nobody else in that building knows the chain above Blackout." | debrief |
| S3 | Netherton: "ENTROPY used to steal. Now they break the things people stand under." | briefing |
| S4 | Vance's third "two hundred and forty thousand" → "Not on my site. We're stopping this." | Vance `vance_commits_to_helping` |
| S5 | Relay's mind-reading cabinet sentence cut; also the "unhurried confidence" line and "No. You're really not." (optional) | Relay |
| S6 | Static "[Move him.]" → "[Out of my way.]" | Static |
| S7 | Guard "[Grid-safety regulator. I'm here for the audit.]", "The regulator? This early?", and the duplicate choice → "[Just a routine visit. Won't take long.]"; Vance's reveal narration no longer "Not a state auditor — SAFETYNET" | guard, Vance |
| S8 | "Find Robert Vance. He runs the site, and he's on shift. He isn't expecting anyone before dawn." | briefing cover |
| S9 | "every round" restored in the no-kit branch | HaX `navigation_help` |
| S10 | "ESD" introduced once in the briefing ("…Emergency Shutdown button, the ESD."), so the texts that use it now have a referent; Vance keeps "the ESD" in one engineer's line | briefing objective Three, Vance phone urgency |
| S11 | First text after the briefing → "Gate first. Regulator badge, routine audit, came early. Then find Vance in the operations office." | erb HaX `timedMessages` |
| S12 | "…the physical dial in Battery Hall 1." | erb work-order text |
| S13 | Task Force Null explanation → "Find whoever sends the directives. Every cell we've hit so far was working from the same ones." | debrief |
| S14 | "He'll call when he's ready. Not tonight." (fits both paths) | debrief |
| S15 | "So far he's given us one thing: the number." | debrief |
| S16 | `robert_vance_phone` avatar → `male_telecom_headshot.png`. Supported: the phone UI reads `npc.avatar` with `assets/` paths (`phone-chat-ui.js:435-440`) | erb |
| S17 | "Now we know how the cells fit together." | debrief |
| S18 | "That's the job, when it works." cut (ends on the forty-odd line); last line → "Sleep. I'll call."; "You're ready for this." cut | debrief |

Optional items also taken: briefing "Yes." for "That's the whole job.", and one list of three fewer
("They break the things people live on, and they mean to."); HaX "Grid control can see it too." (no second
"case made"), "Bring it home." cut, the 61°C line now pays off Nightshade's "how much time" ("the time we
thought we had is gone"); Vance phone "HV room" and one longer engineer's line on the rack banks; Vance "I've
got a plant to run"; Voltage "make that legible" restored; Cipher's "He wants it to be a lie." cut; the
disclosure choices out of menu-speak ("[Keep it classified. Let them patch it quietly.]", "[Say there was an
incident. Keep the details back.]") with HaX's echo trimmed.

**Non-dialogue change.** The opening cutscene's `timedConversation` had no `waitForEvent`, so it fired on
the first one-second tick. Added `"waitForEvent": "game_loaded"` in the same position as m01–m03. Validator
clean afterwards.

**Lines touched this round.** About 45 spoken lines, 7 choices and 2 timed texts across all 10 ink files and
the erb, plus 53 prefixes removed with no change to their text, one avatar path and one cutscene trigger.

**Checks.** Compile 10/10, 0 failed. `tagdiff --old` against the snapshot: STRUCTURE UNCHANGED on all ten.
`dialoguelint`: 0 findings (`lint-after-r2.txt`). Validator clean (the two seed-cameo warnings as before);
door alignment 8/8. `reopencheck`: 1800 reopens per phone ink, 0 problems. `loopcheck` on every entry knot:
0 runtime errors. `inkcheck`: debrief at trust 80/60/20, vented, trigger-vented and Vance KO (96/96 clean
each); Vance phone with the reader seen and the hydrogen alarm (215/215); HaX hub with the RFID guide offered
(39/39). No browser run.

**Backlog (from the notes, for the orchestrator):** `male_telecom_v2` is also Owen Gallagher (m05) and Thomas
Park (m07), so m05 opens with Vance's face on another man; the gate guard shares `hacker-red` with the four
operatives, though the debrief scolds a player for hitting him; and `dialoguelint` misses "She is not X; she
Y" and verbless "Not X. Y." in narration.

## Playtest round

Source: `tools/playtest/m04-pass4-dialogue-report.md` (games 1410 and 1418).

### 1. Dead end: flags in, evidence not read
Cause: `map_the_attack` unlocks only after `confirm_the_lie`, which needs `find_infiltration_evidence`.
With all four flags submitted but no evidence document read, `attack_mechanism_known` never sets, so the ESD
stays unarmed and its refusal points back at the jump server. The gate stays (orchestrator decision); it is
now signposted:
- New global `all_flags_in`. The four `flag_*_submitted` globals were declared but never set; four mappings
  on `objective_task_completed:submit_*` now set them. Another four set `all_flags_in` when the other three are
  already in. Flag tasks still complete and emit while their aim is locked (`objectives-manager.js`
  `handleFlagTasksUpdated`).
- HaX text on `all_flags_in` when no evidence global is set: "Flags are in, but grid control won't move without
  the break-in on paper. Vance's work orders, the workshop access log or the camera log. Any one." A second
  text covers the case where the thermometer hasn't been read.
- New ESD refusal variant, placed before the generic "proof is on the workshop jump server" one: "…Grid control
  has the hazard and the attack, not the break-in. They want it on paper: Vance's work orders, the workshop
  access log or the camera log."
- HaX's "What should I be doing right now?" now has two branches. With the flags in and no evidence, it names
  the three documents and where they are. With the flags in and no thermometer reading, it names the dial on
  the Rack Bank C wall.

### 2. Pointers
- "What should I be doing right now?" before the workshop now says it needs a Level 2 card. It then says
  either "You've got Relay's" or "Relay carries one… Hall 2 opens on Vance's card".
- The 61°C call now gives the unit and the object: "Sixty-one degrees on the Hall 1 battery thermometer, against
  twenty-eight on the screens." "The screens lie because they have to" now gives the reason: "…because ENTROPY
  feed them. That dial isn't on their network." Nightshade's line changed to "they won't wait for 0800", so it
  no longer contradicts the kit text. The ESD-armed text, sent from three mappings, says "the sixty-one degrees
  in Hall 1 is on record".
- HaX's "I'm on the OT network" option now retires once all flags are in. "SCADA backup server" is now "the
  BMS jump server" in the HaX choice, in Vance's phone line and in the aim description.

### 3. Lines
- Voltage: "*already moving*" and the "*because*" asterisks removed. The "had this ranked" narrator line is now
  just the camera. The two "one keystroke" lines are now "Look at my hand. Then look at the clock.", followed by
  the threat, which now says "not eight o'clock" and no longer says "noon". His openers changed: "So they sent
  someone." and "And not one of my people saw you come." replace the "SAFETYNET drones" and "I respect that"
  pair. The arrest beat no longer repeats "Static's down" ("Nobody left to stop you. All right."). "A court can
  have the number too" is now "Let them read the casualty model. I signed it." The interpreting narrator lines
  are cut back to what the camera sees.
- Relay: "Then you'd better be quick" is now "That was my card. Run, then.", which fits both the rushed and the
  unrushed clone. "She reads the silence correctly" is now "The silence goes on a beat too long."
- Cipher: "He says it like a line he has been given…" is now "He says it too fast."
- The fingerprint kit text is rewritten so the reference cards and file prints read plainly. It no longer claims
  "nothing's counting down".
- Debrief: "But..." cut. The three "Approved." lines are now Netherton's reaction to each disclosure option, and
  "Decision recorded." is now "Done." Two single-option player beats break up the run of fifteen HaX bubbles
  before the first choice: "[What did we get out of there?]" and "[And how did they get in? How did I?]".
- Vance no longer answers his own "What do you need from me?". The doubled "ops desk" on his phone is gone (the
  first call now opens "What do you need?"). The guard gives the direction once. HaX now answers the two
  hub-return choices ("Ask. Quickly.", "Go on."). "Holding the watch" is now "setting the clock on all of it".

### 4. Voltage's sprite
Voltage moved from `hacker-red` (the same as Static, with a faceless bust) to `male_office_worker_v2`, with its
talk, viseme and headshot files: a man in his forties in shirt and loose tie, which fits the former grid engineer
at the laptop. Nobody else in m04 uses it; Phantom uses it in m08.

### 5. HP 88 in Hall 2 (run B)
It wasn't a hazard. m04 has no damage source apart from the four hostile operatives (grep finds no hazard,
timer or scripted damage). In the run B log, HP was 100 at seq 451 and 88 at seq 455. Cipher was hostile at that
point (he had radioed the cell) and adjacent to the player for about six seconds while the harness paused
before `debugKO`: three hits at his `attackDamage` of 4 make 12. That's intended combat, and the loss came from
the assisted fight, not from the mission.

### Structure changes (intended, 17 in tagdiff)
- `m04_phone_agent0x99.ink` (13): six new VARs (`all_flags_in`, `anomaly_detected` and the four evidence
  globals); the OT-network option's condition gains `and not all_flags_in`; five new condition heads in
  `priority_guidance` (Relay's card yes/no, and flags in with evidence or thermometer missing).
- `m04_closing_debrief.ink` (4): two single-option sticky choices, plus their per-knot counts.
- erb: eight flag-tracking mappings and two HaX texts on `all_flags_in`, one ESD refusal variant, the global
  `all_flags_in`, Voltage's sprite block. `scripts/ink_runtime_check/missions.json`: `all_flags_in` added to the
  m04 entry only.

### Checks
- Compile: 10 of 10. `tagdiff --old` against the snapshot: the 17 differences above, and nothing else.
- `dialoguelint`: 0 findings.
- Validator: 0 errors. The onceOnly-pair warnings are the intended independent handlers, and each flag event
  now carries four. Door alignment: 8 of 8.
- `reopencheck`: 0 problems.
- `loopcheck`: every entry knot passes, plus the HaX hub with the flags in and the evidence missing.
- `inkcheck`: `priority_guidance` with the evidence missing, with the evidence found, and with Relay's card
  cloned; the debrief in three outcome states; Voltage with Static down. All paths clean. No browser rerun.

Not changed: the report's note that the "Card's yours" text arrives after the biometric-door text. That order
comes from the timing of two different events, and fixing it is engine or mapping work beyond a text edit.
