# m10 Full Disclosure: puzzle chains, round 3 review

2026-10-22. Phase 2, round 3, on HEAD 4e87628ec ("puzzle chains R2, scenario design R3, dialogue R3 and VM gating finds (F12/F13)"), run with `.claude/skills/mission-puzzle-chains/SKILL.md`. Read-only: the only file written is this one. Scenario design R4 and dialogue R4 were reading m10 at the same time.

**Method.** `room_depth.py` and the validator (`--skip-ink --no-graph`) run again. The seven ink files the commit touched (phone, Tesseract, Voltage, Vance, Elena, Gary, Netherton) recompiled to scratch with `bin/inklecate`: 0 warnings, each identical to the committed JSON. The VM is a black box: a find is taken to make its flag obtainable at any field console, and nothing else is assumed about the box. Of the VM gating documents I read only FINALE_VM_GATING_HANDOFF.md §B5. No VM plan, SecGen file or field guide was opened. The `PLACEHOLDER_` login strings (erb:186-190) are not counted.

**Counts: 0 blockers, 1 major, 2 minors, 3 nits.** Every round-2 finding is resolved or closed by a recorded ruling (§1). The major is in the new VM gating: the core access key can be picked up one lock before the core host terminal can take flag 4 (§2, M1).

---

## 1. Round-2 findings: status

| Finding | Status | Evidence at HEAD |
|---|---|---|
| m1 (minor) T-62 stacks on the bench-log text | **Resolved** | erb:1863 `delay: 10000`, `skipIfGlobal: cracker_rack_seen`. The first text is at 1.5 s (erb:1860), so the gap is 8.5 s, and 4 s after the 6 s "three things" text (erb:1864). Validator warning 49 is gone. The texts file still says 3.5 s (n2) |
| m2 (minor) captured Voltage's by-hand player told "talk to them first" | **Resolved** | phone:147-160. First rung adds `voltage_outcome != "by_hand"`; second takes `cut_by_hand or voltage_outcome == "by_hand"`, with the inner arms in the order R2 asked: step 2 → "Third from the left. Go and pull it."; `by_hand` → "He's talking you through it."; HaX → as before; else "Go to the isolator. They'll ring." DR3 n8 also added a `cut_step == 2` rung above the flags rung (phone:135-136), so the pull is named whatever else is done |
| m3 (minor) contract rows describe the old cut | **Resolved**, one row behind a later rename (n2) | CONTRACT:172 (topic gate has `cut_by_hand`), :280 (step 2 ends in an instruction, the isolator click writes `cut_step = 3` then the cut), :390-391 (the click mapping listed as a writer of both), :566-568 (HaX's re-ring carries `cut_step !== 2`; Vance's and Elena's `cut_done`). texts/BARKS_AND_TEXTS.md:62 (T-28 merged, three forms), :131 (B-01 guards on both branches and step 2). `lore_fragments.md` §1.5 (lines 360-361, the two pull variants) and §1.10 (the sticker sentence). Only :280 still names the step-2 button "[Going to it.]" |
| n1 (nit) camera toggle by button | **Left**, recorded (CONTRACT §11, "Left: PC n1"). Not reopened | — |
| n2 (nit) Wendell silent at his own breaker | **Resolved** | erb:3296 bark "Your funeral. I didn't see a thing." on the cut, `worked_round`, `cut_step === 3`, once |
| n3 (nit) "Ring me when you're standing at it" then a ring-back | **Resolved at step 0** | phone:765-769 "I'll ring you back when you're at it." Step 1 has the same shape (n1 below) |
| n4 (nit) P3 recorded two ways | **Resolved** | Plan §10 W11 declines P3's line with its reason; CONTRACT §11 says the same |
| n5 (nit) the Alpha button's "it" | **Superseded** by DR3 n2 | tesseract.ink:832 "[Your Alpha notes made students work it out. Now you'd hand everyone the answer.]" |
| n6 (nit) captured isolator click gets only the label | **Resolved** | erb:3340, captured branch only, `cut_step !== 2`, not after `by_hand` or `his_hands` |

The P2 machinery traced again on the new lines: the pull (erb:1733) writes `cut_step: 3` before `gallery_shutter_cut`; the three T-28 forms (erb:1728-1731) are first-match on `shutter_text_sent`; all three click-to-call mappings (erb:1721, 2332, 2352) and both pre-scene barks (erb:3298, 3363) carry `cut_step !== 2`; HaX's one-time close re-ring (erb:1722) carries it too. Step 2 in all four voices ends on "[Anything else before I pull it?]" and an instruction with no writes (phone:805-807; vance:77; elena:82; voltage:194).

---

## 2. New findings

### M1 (major). The core access key is reachable one lock before the core host terminal, so a player can hold flag 4 with nowhere to submit it

**Evidence.** The envelope `core_access_key` is in the gallery (erb:4053-4065, position (3, 3), "clipped to the walkway rail"). Flag 4's station, `core_host_terminal`, is in the core (erb:4210-4224). Between them is the outer lock, PIN 6083 (erb:4082). The same attack VM sits behind three field consoles: the forward post (erb:2541), the server hall (erb:3585) and the core (erb:4227). By the time the player is in the gallery, flags 2 and 3 are in (the gallery stair waits on them). So a player who picks up the envelope and then gets stuck at the outer lock (in Fonoti's cone, or slow with the cracker) can walk one room back to the hall console and work the core host with the key. They then hold flag 4 while the only terminal that takes it is behind a door they haven't opened. That breaks the user's rule as stated for this pass ("a player never holds a flag they can't yet submit").

The commit's own check misses the lock. CONTRACT:1237 says "flag 4's key is past the gallery stair, and its terminal is in the core", and the object's `_comment` says "reachable only after the gallery stair". Both are true, but the station isn't usable at the gallery stair. It becomes usable at the outer lock. The handoff's concept ("a core access key in the gallery … available only after the gallery stair", B5 item 3) has the same gap, so the build followed the brief faithfully. The brief was one room short.

Two smaller problems sit on the same object:
- **It reads as the outer lock's key.** An item called "Core Access Key", stamped CORE. ACCESS, lies ten tiles from the locked door to the core, at the season's last lock. A player will try it there, and it does nothing (the lock is a PIN pad). That is misdirection at the one place the finale wants a clean deduction (W1).
- **No author with a motive** (skill 3d). The core's one-holder key ("ONE HOLDER") clipped to an open rail beside Haugen's chair (`monitor_guard`, (3, 4.5)), with three guards on the walkway, doesn't survive "would this object exist, in this state, if nobody had designed a puzzle?" The gallery already has its shift code card, held by Fonoti, which is the right way a code travels there.

HaX's steer also makes the player walk back. `box_topic` shows only on `outer_lock_open` (phone:88; HaX is jammed in the gallery), so she names the envelope after the player has passed it: "There's a key envelope on the gallery rail, stamped CORE." (phone:582). That return is through the door they have just cracked, and buys nothing.

**Fix (preferred).** Move the envelope into the core, on or beside the core host terminal, and give it Tesseract as the author. He invited the agent, and the plan already rules that he "hides nothing from the agent he invited" (W4). His arrival line is "Get on his box. He'll keep." (tesseract.ink:142, HaX), and `box_topic` already says "He'll have left himself a way out. Find it."
- ERB: move the object to `core` (position for dressing to confirm). Observation along the lines of "A sealed envelope propped against the host terminal's screen, stamped CORE. ACCESS. Left out for whoever came down." Keep `takeable`, `readable`, the `PLACEHOLDER` key string and `puzzle_graph_unlocks: core_host_terminal`.
- `box_topic` (phone:582), one unvoiced hub line: "He's left a key envelope on his terminal, stamped CORE. He wants you on his box."
- Rename the item "Core Host Key" (or "Host Key Envelope") so it can't be taken for the outer lock's key, even in the core.
- Correct CONTRACT:1233 and :1237 and the object's `_comment`.

Cost: one object moved and reworded, one unvoiced line, two contract lines. No new global or mapping. The station and the find are then both at depth 7 and the find is reachable only once the station is, which matches flags 1 and 3. It also takes away a walk back through the last lock.

**Alternative.** Tesseract hands it over in `arrival` with `#give_item`. That makes his invitation explicit, but costs a voiced line, a give tag and a reload check on `core_greeted`. The object on his terminal says the same thing for less.

**Not recommended.** Keeping the envelope in the gallery and revealing it on `outer_lock_open` closes the hold, but the key then appears behind the player on a rail they've already walked, and the misdirection at the lock stays.

### m1 (minor). Flag 1's tag hangs off SAFETYNET's own console, not Tomb Gamma's terminal

**Evidence.** In the forward post, "Field Console (Gate)" (`gate_console`, erb:2540-2550) is SAFETYNET's field kit: "The field console, racked by the gate. It talks to their gate terminal." Tomb Gamma's kit is the Gate Terminal (erb:2551-2567: "Tomb Gamma's gate terminal. Everything at the gate reports through it to their security monitoring."). The tag (erb:2599-2611) is "cut from the gate console's power lead", and HaX says "There's a maintenance tag on the gate console's lead" (phone:573). A Tomb Gamma monitoring login on SAFETYNET's own console has no author (3d), and the in-game name "gate console" sends the player to the wrong object. The tag's own text also says "Do not remove." while its observation says it has been cut off.

**Fix** (unvoiced strings, plus the dressing position): put the tag on the gate terminal. Observation: "A laminated maintenance tag on a cable tie, hanging off the gate terminal's power lead." HaX (phone:573): "There's a maintenance tag on their gate terminal's lead. Their service login's on it." Correct CONTRACT:1231. The tag's position (15, 4) then goes beside the terminal's stand, not the console's trestle (ROOM_DRESSING.md:48 has the field console on a trestle and the gate terminal on its own stand).

### m2 (minor). "His disarm sits on that box" points at the release host, but the game's disarm is his console in the core

**Evidence.** HaX's `hatch_topic`, restored under F13: "Get out of the container onto that host. His disarm sits on that box." (phone:564). Everywhere else in the game the disarm is Tesseract's console in the core: its stopped state reads "His console. The cover is down. The disarm's lamp is green." (erb:4191), and the clocks read "RELEASE: DISARMED" only after that choice (erb:122, 125). Flag 3 opens the gallery stair and changes nothing about the release. A player can fairly take HaX's line to mean flag 3 stops the release, then find the clock still running and the real switch two rooms on.

F13 is the user's ruling and the reference stays. Only the wording needs to say that what's on the release host is a record of the disarm, not the switch. A story-only reword such as "His disarm's written down on that box. The switch is still his." keeps the F13 reference and points forward to the console. B5 item 4 asks for this wording to go past the user or opus48, so route it there rather than to a fixer. It is an unvoiced hub line.

### Nits

- **n1. HaX's step 1 "[Give me a minute.]" is followed by her ringing back.** phone:780-783 ("Take it. The key won't turn itself.") closes the call; the one-time `conversation_closed:agent_0x99` re-ring (erb:1722, `cut_step !== 2`) fires 1.5 s later if the player didn't use it at step 0. R2 n3 fixed this shape at step 0 only. Either reword ("Take it. I'll ring you back.") or add `cut_step !== 1` to the re-ring, so that only step 0's "I'll ring you back" leads to a ring. One HaX line or one condition.
- **n2. Two doc rows are behind the build.** texts/BARKS_AND_TEXTS.md:127 gives T-62 as 3.5 s (the build has 10 s, erb:1863). CONTRACT:280 still names the step-2 button "[Going to it.]" (DR3 m1 made it "[Anything else before I pull it?]", phone:805). No player effect; a fixer working from §1.6 would rebuild the old button.
- **n3. "Operator's Duty Card" sits one room from a card reader.** The flag 3 find (erb:3673-3685) is a `notes` item, so the RFID minigame never offers it, but "card" in the server hall, with the gallery stair's reader at the east door, invites a try. "Operator's Duty Sheet" or "Duty Slip" would remove the doubt. Unvoiced; HaX's "dropped a duty card" (phone:565) would change with it.

---

## 3. The audit, run again on the current build

### 3.1 Headline numbers (room_depth.py, validator)

| | m01 | m02 | m09 | m10 at R2 | m10 now |
|---|---|---|---|---|---|
| Rooms / empty | 13 / 0 | 13 / 2 | 11 / 1 | 8 / 0 | 8 / 0 |
| lockType declarations | 12 | 15 | 11 | 9 | 9 |
| Max depth | 3 | 7 | 5 | 7 (`core`) | 7 |
| Hands-on beats on the critical path | — | — | — | the cracker; the power-room door; the isolator pull on by-hand saves | the same, plus **three VM finds** (one per gated flag) |
| Optional deductions with a payoff | — | — | 4 | 6 | 6 |

Layout and connections are unchanged (one corridor, forward post to core), so depth, BFS positions and door parity can't have moved.

Validator: 0 errors. Warning 49 (R2 m1) is gone. The rest is the set R2 listed: the two objective-wiring notes, cutscene `onceOnly` advisories, imported-condition advisories, the five intended "nothing can open it" doors and locker, warning 45 (the gallery-only `item_picked_up:notes` mapping, which reads `data.itemId`, so the three new `notes` finds can't trip it, erb:3819), and two older ones: the `room_entered:blast_tunnel` double text (erb:1842-1843, the triple-agent and arrested m08 arms, which can't both hold) and the release console and hatch both unlocking `gallery` (the intended AND). None is new in this commit.

### 3.2 Boss-key table, with the VM gating finds

Depth is BFS from `forward_post`: tunnel 1, office 2, workshop 3, power room 4, hall 5, gallery 6, core 7. Lock lines are at HEAD.

| Lock | Seen | Key from (depth) | Verdict |
|---|---|---|---|
| Blast door, story (erb:2673) | 0 | table scene, flag 1, Arakawa (0) | ✅ announced story gate |
| Inner door, story (erb:2788) | 1 | opens on entry; tripwire → ladder (1) | ✅ by design (W8) |
| Stair B, story (erb:3062) | 2 | Ghost's call (2) | ✅ story beat with a cost |
| Power room, RFID (erb:3276) | 3 | Imran talked round or a clone (3); fitter's spare by lockpick (2) | ✅ the player picks the tool |
| Records cupboard, PIN (erb:2968) | 2 | Vector (m08), Ghost (m02), cracker | ✅ by design, optional |
| Fitter's locker, key (erb:3007) | 2 | lockpick (0) | ✅ by design, optional |
| Model terminal, password (erb:3199) | 3 | margin strip + CyberChef (3) | ❌ same room by intent (W7), optional |
| Shutter isolator (story action, erb:1733) | 4 | the voice's instruction (4) | ✅ scene, then the click |
| Gallery stair, story (erb:3718) | 5 | flags 2 and 3 (5); the cut (4) | ✅ boss-key past a live shutter |
| Outer lock, PIN (erb:4082) | 6 | cracker (0), plate (6), rota→Fonoti (2→6), Ghost (2), Vos/Victoria (6) | ✅ by design (W1) |

**The VM gating finds.** "Station seen" is where the player first meets the flag station; "usable" is the first depth at which it will take the flag; "find" is the first depth at which the login or key can be read. The rule holds when find ≥ usable.

| Flag | Station (line) | Seen | Usable | Find (line) | Find reachable | Hold before usable? | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Gate Terminal (erb:2551) | 0 | 0, from the start (no gate on the station) | Maintenance Tag (erb:2599), forward post | 0, from the start | No | ✅ same room. HaX names it once the door scene is done (phone:103, 573). Its wording points at the wrong console (m1) |
| 2 | Release Console (erb:3594) | 5 | 5 | none (B5 gives no find for flag 2) | — | — | not assessed: VM side, see §5 |
| 3 | Sealed Section Hatch (erb:3655) | 5 | 5, on entry (no gate) | Operator's Duty Card (erb:3673), server hall | 5, behind the power-room card door (erb:3276) | No | ✅ same room. B5's "or workshop" option would have failed the rule (workshop is depth 3, hatch 5); the build chose the hall. HaX names it after flag 2 (phone:86, 565); a player doing flag 3 first finds it unprompted |
| 4 | Core Host Terminal (erb:4210) | 7 (the gallery's slit windows show "one console", erb:4046-4052, but it can't be reached) | 7, behind the outer lock (erb:4082) | Core Access Key (erb:4053), gallery | **6**, after the gallery stair, **before** the outer lock | **Yes**, via the hall console (erb:3585) one room back | ❌ **M1.** After the fix: find 7, usable 7, ✅ |

All three finds, once M1 is fixed, sit in the station's own room. They are search beats, not hunts across rooms. With the user's rule and a single corridor, that is the only arrangement that can't fail: any find one room earlier than its station breaks the rule, and one room later behind a door would block a flag the player has earned. HaX names each in a hub topic the player has to ask for, so the find never stalls anyone, and a careful player gets it before asking.

### 3.3 Chain depth

Unchanged in shape. Each VM flag now has a find and a station in the same room, which adds a look-round beat at the forward post, the hall and (after M1) the core. The required spine is still mostly story doors, with one deduction at the outer lock (W1, W3). The finds add physical presence to the VM steps without adding walking, which suits a finale that runs straight at the core (plan §8).

### 3.4 Carry-over capabilities spent

As R2 §3.4. No change in this commit.

### 3.5 Choices that matter

As R2 §3.5, with R2's minors and n2 now in: captured Voltage's "[Where are we?]" names the breaker, and Wendell answers a pull in front of him. Nothing reopens a §10 withdrawal.

### 3.6 Bug sweep (skill Step 4)

| Check | Result |
|---|---|
| `item_picked_up:` keyed on id | None new. Both mappings use the type plus `data.itemId` (erb:1868, 3819). The three new finds are `notes`; neither mapping reacts to them |
| Tasks with no completion route | None new. `submit_flag_1/3/4` (erb:1395, 1436, 1451) are each reachable once their find is (after M1) |
| Author notes, code-stating observations | None player-visible. The three `_comment` fields carry PLACEHOLDER notes, which the engine never shows. The finds' texts state logins by design (that is the find) |
| Stale geography | "east racks" (phone:565) fits the hall's south-wall racks and the hatch at the east end (ROOM_DRESSING.md:53). "the gate console's lead" names the wrong object (m1). "the gallery rail" changes with M1 |
| Dead globals | None new. The commit adds two include variables, both read |
| Compiled ink | Seven touched files recompiled to scratch: identical, 0 warnings |
| Validator | 0 errors; no new warning (§3.1) |

---

## 4. For phase 5 (browser only)

New in this round:
1. **Tag position.** The Maintenance Tag at (15, 4) (erb:2606) is visible and clickable and isn't under `arakawa_gate` at (16, 5) once he is revealed. After m1, it sits by the gate terminal's stand.
2. **Card position.** The Operator's Duty Card at (17, 5) (erb:3680) lies on open floor by the east racks, clear of both hall patrol lines, and is clickable.
3. **Envelope after M1.** In the core, visible on entry, clickable while Tesseract's arrival is parked, and not reachable before the outer lock opens (Victoria's and Vos's open-from-inside routes too).
4. **Each find.** Picking up adds a note whose text shows the account lines (PLACEHOLDER until opus48 or the user sets them). No other mapping fires.
5. **HaX's three steers.** `monitor_topic` after the door scene and before flag 1; `hatch_topic` after flag 2 and before flag 3; `box_topic` in the core after the lock, before flag 4. Each names its find and then retires.
6. **No early hold (the M1 regression check).** On a save at the gallery with the lock shut, no object anywhere reachable carries the core host key.
7. **Step-1 re-ring (n1).** At HaX's step 1, "[Give me a minute.]" then wait: after the fix, no ring straight back.

Carried from R2 §4, still to be run (texts and buttons as now named): the cold-start Wendell-worked-round cut; the escaped Voltage fight route; Vance and Elena resume at step 2 and `cut_done`; captured "[I'll do it.]", re-talk at step 2 and his bark; a reload at `cut_step` 2; the click guards at steps 0 and 1 on each branch; the workshop rack, card 4 and the T-62 timing at 10 s; Fonoti's cone after the rota, the handover and the Vos pick; exchange 3's Alpha button; captured "[Where are we?]" at step 2.

---

## 5. For the user (not reasoned about here)

- **Flag 2 has no find.** B5 lists finds for flags 1, 3 and 4 only. If flag 2 needs a login or key of its own on the VM, the rule wants a find for it as well, in the server hall (the only room that satisfies the rule for its station). VM side, so it goes to opus48 or the user.
- **m2's wording** touches the F13 reference and goes via the user or opus48 (B5 item 4).

---

## 6. Severity log

| Round | Blocker | Major | Minor | Nit | Outcome |
|---|---|---|---|---|---|
| 2 | 0 | 0 | 3 | 6 | m1-m3, n2-n6 resolved; n1 left by ruling |
| 3 (this) | 0 | 1 (M1) | 2 (m1, m2) | 3 (n1-n3) | All round-2 findings closed. M1 is in the VM gating added this commit: the core key in the gallery breaks the no-early-flag rule by one lock. m1 and m2 are wording on the new finds and the F13 line. Nothing structural outside the gating |

Measured against m01_first_contact and m02_ransomed_trust.
