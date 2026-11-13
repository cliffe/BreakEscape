# m10 Full Disclosure: scenario design review, round 5

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, round 5. From this round, a round with no blockers or majors closes the phase (user's rule).

**Tree.** HEAD 588b5ae52 (SD R4, dialogue R4 and puzzle chains R3 applied). There were no uncommitted m10 changes while I read. Dialogue R5 and puzzle chains R4 are reading in parallel.

**Method.**
- Validator: `ruby scripts/validate_scenario.rb … --no-graph`. Dialogue lint: `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/m10_full_disclosure/`. Outputs are in the session scratchpad under `sd_r5_m10/`.
- Read: the HEAD diff to the ERB, HaX's ink, Tesseract's ink and the CONTRACT; HaX's hub, `where_are_we`, the whodunit knots (accuse, refused, wrong, recalls, alibi), `hatch_topic`, `monitor_topic`, `box_topic`; Tesseract's `arrival`, `finish_box`, `flag4_lines`, `case`, `case_recruiter` and `exch_2_menu`; the three finds, the three flag stations, the core's field console and file index, the gallery-stair mappings, the shutter texts and the aims.
- I checked the engine's condition evaluator (`public/break_escape/js/systems/npc-manager.js:16-112`) for the one INVALID.
- Not opened: no VM plan, SecGen file, field guide or other excluded file. No browser run.

**Counts: 0 blockers, 0 majors, 2 minors, 4 nits.** There is one dresser note, not counted.

**Verdict.** All of R4's findings are closed. The three finds now sit where their stations work, and each one has a pointer the player will meet. The whodunit sends a wrong-accusation player to the right clue for every officer.

Running the skill afresh turned up two minors:
- one of DR4's shutter texts is written in a form the engine can't evaluate, so it never fires;
- HaX's flag-4 notice line says "never sent" to a player who sent that notice in m09.

Both are one-line fixes. Nothing reaches major, so the phase closes.

---

## Part 1: R4's findings

| R4 | Fix at HEAD | Verdict |
|---|---|---|
| **M1** core key | erb:4251-4261: "Core Host Key" at core (2.2, 4.8), "propped against the host terminal's screen… Left out for whoever came down", text "For the agent. A.T." `box_topic` (`m10_phone_agent0x99.ink:598`) leads with "He's left a key envelope on his terminal, stamped CORE." The core has its own field console (erb:4215-4223), so the key, the attack box and the station are all in one room. | **Closed.** No flag can be held before its station. There is no walk back. |
| **m1** duty sheet, hatch-first | erb:1639: the hatch's first click now ends "One of his operators dropped a duty sheet by the east racks." | **Closed.** |
| **m2** tag push | `m10_phone_agent0x99.ink:177`: the `door_scene_done` rung is "Their monitoring. Gate terminal. The login's on the maintenance tag." The tag hangs off Tomb Gamma's gate terminal (erb:2603-2613). | **Closed.** The sticky topic a stuck player opens now names the tag. |
| **m3** relops label | erb:188 `release_login_user = 'relops'`. erb:3684 reads "Release host login:". | **Closed** for the Vos clash. The second half (does the label match what the login opens?) is still a question for the VM side. See n1. |
| **m4** Quintero's pointer | ink:390-395 and 449-454: for Quintero without the bench log, HaX says "The bench log clears her. Read it." Everyone else still gets the ten-past pointer. | **Closed.** I traced both knots: accusing Quintero sets `officer_out` and `hax_suspect` to her, the right branch fires, and once the log is read the hub shows "[Bring Quintero back.]" (ink:94). |
| **n1** the lesson | ink:586: "People leave logins on their kit. Look for them." | **Closed.** |
| **n2** "too" | `m10_tesseract.ink:192`: "…is on his box." | **Closed.** |
| d1 to d3 | key (2.2, 4.8), tag (15.6, 3.4), sheet (15.5, 3.5) | Placed as noted. See d1 below on the key's text. |

The status ladder now names the find at each VM stage: the post (ink:177), the hall (ink:142) and the core (ink:132). I walked it at every stage from `else` to `ending` and found no stale rung.

---

## Part 2: the skill, run again

### Step 1: validator

- **❌ INVALID, 1.** `forward_post/agent_0x99/eventMappings[134]` (erb:1729) uses `||` and parentheses. This is minor m1 below.
- **⚠️ WARNING.** Same set as R4, no new entries: 2 objective-wiring overlaps, 19 cutscene onceOnly notes (they're guarded by done-globals), the gallery AND gate (a false positive), 5 story doors or lockpick-only locks, 2 door-log text repeats, the `lock_guard` false positive, the blast-tunnel twin texts (false positive, as R4 said), and 31 import conditions.
- **Dialogue lint, 9.** Same as R4. These belong to the dialogue round.
- **💡 SUGGESTION.** As R4. Layout geometry is OK with no overlaps.

### 2a. Solvability: OK

Critical path: briefing → table → tag → flag 1 → breach → tunnel → security office → handset → workshop → power room → shutter → server hall → flags 2 and 3 (in either order) → gallery stair → outer lock → key in the core → flag 4 → the case and exchanges → three decisions → close the night. Each lock's key or login is in reach before its lock. The gallery's door barks name the missing half in order (erb:1772-1774). I found no new soft-lock pattern.

### 2b. Clues: OK

All three VM finds are in their station's room, and each has two pointers: a hub or status line plus the find's own text. The only clues left for whoever reads further are the core file index and the uplink printer. Both are story, and both are optional.

### 2c. Educational coverage: OK

There are three logins left on kit, each acted on by the player, and HaX names the lesson once. The VM flags carry the technical teaching.

### 2c′. Field guides: OK

All four guides are offered on exposure and given on request (erb:1628-1645). The `labUrl` is still owed, as R1 said.

### 2d. Narrative and season close: OK, with one contradiction (m2)

The finale still lands:
- the head start is acknowledged on arrival;
- the m09 Recruiter and notice exports reach the argument (`case_recruiter`, and slot 4 of `exch_2_menu`);
- the file index changes with `m09_albion_notified` (erb:4237);
- the three decisions, then the closing card and credits.

The one place a carried choice is contradicted is HaX's flag-4 line (m2).

### 2d′ to 2d″: OK, unchanged

### 2e. Graph metadata: OK

The three finds are keys to their stations (`gate_terminal`, `sealed_hatch`, `core_host_terminal`).

### 2f. Rooms: OK. See d1.

### 2g. Scaffolding: OK

R1's table stands. "Reach The Core" no longer has a dead zone: the key is in the room where the aim description leaves the player, and the arrival line, `box_topic` and the status rung all point at it. Two small gaps remain:
- one task title reads oddly (n4);
- the guide-4 text could carry the key (n3).

### 2h. Knock-out resilience: OK, unchanged

No NPC holds a find.

### 2i. Recurring classes

- **Status answers go stale.** OK. See Part 1.
- **Credits and debrief versus every route.** No change since R4.
- **Whodunit fairness.** Fair, and it can't be skipped. Every wrong accusation now points at that officer's own clearing clue.
- **Hub order.** Unchanged. "[His box.]" and "[The hatch?]" sit with the act's other topics.

---

## Findings

### Minor

**m1. DR4 n4's shutter text can never fire.** erb:1729:

`… && ((globalVars.cut_step === 3 && !globalVars.phone_voice_is_hax) || globalVars.voltage_outcome === 'by_hand') && …`

`safeEvaluateCondition` splits on `&&` and accepts only simple terms (npc-manager.js:70-112). The term `((globalVars.cut_step === 3` is unsupported, so it returns false. The validator reports this as ❌ INVALID.

When it fails, erb:1730 fires: "Shutter's dead. The stair's open." So a player whose voice (Vance, Elena or captured Voltage) has just said the shutter is dead hears "dead" again. That is the repeat DR4 n4 meant to remove. The CONTRACT §11 line "traced over five save types, one text per cut and no repeat" doesn't hold in the engine.

Nothing breaks: the stair still opens and a correct text still arrives. Grading follows the user's rule. A player would notice the repeated word, which makes this a minor, and the INVALID should not ship.

**Fix:** split it into two mappings above erb:1730, each `onceOnly`, setting `shutter_text_sent`, and sending "The stair's open.":
- `… flag3_submitted === true && globalVars.cut_step === 3 && !globalVars.phone_voice_is_hax && !globalVars.shutter_text_sent && !globalVars.hax_jammed`
- `… flag3_submitted === true && globalVars.voltage_outcome === 'by_hand' && !globalVars.shutter_text_sent && !globalVars.hax_jammed`

The first one to fire sets `shutter_text_sent`, so the second can't double up. Then re-run the validator to confirm 0 INVALID.

**m2. HaX tells a player who sent Tesseract's notice in m09 that it was "never sent".** `m10_tesseract.ink:191-192`: on `m09_completed`, HaX says "The notice from Helena is on his box. Nine years, and never sent."

m09 lets the player send that notice (`m09_closing_debrief.ink:148` `#set_global:albion_notified:true`; m09's credits read "His vendor notice: sent tonight."). This mission knows it:
- the core file index the player reads next says "Sent from Helena, day 12. Not by me." (erb:4237);
- exchange 2 and `case_recruiter` both branch on `m09_albion_notified`.

So HaX's line is wrong on the route where the player did the brave thing in m09, and it comes just as the season is meant to pay that choice back. A returning player will notice.

**Fix:** branch the line (one voiced reword, one new voiced line):
- `m09_completed and m09_albion_notified`: "The notice from Helena is on his box. Nine years he sat on it. You sent it."
- `m09_completed` otherwise: keep "…Nine years, and never sent."

Pass it to the dialogue round for the wording if they prefer their own.

### Nits

- **n1. "Release host login" against "Get out of the container onto that host."** erb:3684 and `m10_phone_agent0x99.ink:573-575`. If the duty sheet's login opens the release service (inside the container), the label tells the student they already have the host, and the breakout reads as unnecessary. If it really opens the host, the label is right. The observations line already says "Release service, operator on shift." (erb:3683). **Fix:** opus48 or the user confirms what `relops` opens. If it opens the service, change the label to "Release service login:". This is the half of R4 m3 still open. It's a question for the VM side, not a reopened ruling.
- **n2. Two different "keys" in the core.** The inventory holds a "Core Host Key" (erb:4255), a login code in an envelope. Meanwhile Tesseract's publish control is "the key" throughout the end scene ("The key's where you left it.", "The key is yours to use or not.", `m10_tesseract.ink:877-890, 958-1011`), and HaX's ladder says "The key's on his terminal." The narration makes his key physical, so the scene still reads, but the envelope's name invites the wrong picture. **Fix:** rename the find "Core Host Login" or "Core Access Code" (name only; the id `core_access_key` and the text can stay). The ladder and `box_topic` would then say "envelope" or "login", not "key".
- **n3. The guide-4 text is the natural place for the key pointer.** erb:1645 fires when the player first touches the core's field console, which is exactly when they need the login: "Guide for his box, when you want it." **Fix:** add "His key's on the terminal." (or "login", per n2). It's unvoiced. The arrival's voiced "Get on his box." can stay as it is.
- **n4. The flag-4 task title.** erb:1451: "Take the core host and submit it at its terminal". "It" reads as the host. The other VM tasks say "submit the flag". **Fix:** "Get onto the core host and submit the flag at its terminal".

---

## For the room dresser (not counted)

- **d1. Core Host Key, core (2.2, 4.8).** The object says "propped against the host terminal's screen", but the key now sits on the desk beside the terminal at (1.2, 4.6). Either move it onto the terminal's side of the desk, or change the observation to "A sealed envelope on the desk by the host terminal, stamped CORE. ACCESS. Left out for whoever came down." (unvoiced).

## Out of scope (one line, uncounted)

Timing: the hatch's first click sends two texts 0.5 s apart (erb:1639 at 1.5 s, erb:1644 at 2 s), and the uplink printer stacks up to four.

---

## Prioritised action list

**Must fix:** none that blocks play.

**Should fix (before this phase is committed as closed)**
1. m1: split erb:1729 into two `&&`-only mappings and re-run the validator.
2. m2: branch HaX's flag-4 notice line on `m09_albion_notified`.

**Worth considering:** n1 (VM-side question), n2 to n4, d1.

## Top five

1. **m1.** DR4 n4's "The stair's open." mapping (erb:1729) uses `||`, which the engine can't evaluate, so it never fires and the voice-cut routes repeat "Shutter's dead". It's the one validator INVALID.
2. **m2.** "Nine years, and never sent." (`m10_tesseract.ink:192`) is false for a player who sent the notice in m09. The file index beside it says it was sent.
3. **n1.** "Release host login" may tell the student they already have the host before the container escape. VM side to confirm.
4. **n2.** The "Core Host Key" envelope shares a word with Tesseract's publish key in the final scene.
5. **n3.** The guide-4 text, which fires at the core's field console, is a free spot to point at the envelope.

## For the user

- n1: what the `relops` login opens (the release service or its host) decides the duty sheet's label.
- m2 adds one voiced line and rewords none (the existing line stays for the not-sent route).
- The closing card's teaser (F11) and R1's VM questions 1, 2 and 4 still stand from earlier rounds.

**Verdict: phase closes.** (0 blockers, 0 majors. Apply m1 and m2 with the fixer's next batch.)
