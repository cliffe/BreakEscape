# m10 Full Disclosure: scenario design review, round 3

2026-10-22. Fresh reviewer (Opus, read-only on game files). Phase 3 of the AGENTS.md five-phase loop, round 3. Tree at 1625879bc, which applied scenario design R2, dialogue R2, puzzle chains R1 and playtest R1 together. Dialogue R3 and puzzle chains R2 are reading m10 in parallel, so I've left wording and the cut's step design to them unless it changes what the player can do or know.

**Method.**
- **Validator.** `ruby scripts/validate_scenario.rb scenarios/m10_full_disclosure/scenario.json.erb --no-graph`, exit 0. Dialogue lint run separately. Both outputs are in the session scratchpad under `sdr3/`.
- **Reading.** The whole commit diff for the ERB and the changed inks, plus the CONTRACT §11 entries it added. In full: Tesseract's router, arrival, `case` and the warning; Netherton's router, `aside_end` and `tether`; HaX's hub, `where_are_we`, the whodunit knots, the recalls, the console and `cut_call`; Vos; the 06:00 scene, the hearing and the Citadel.
- **Engine.** `interactions.js:698-716` (object_interacted is emitted before the readable is built). `npc-manager.js:700-830, 965-985` (setGlobal is synchronous and emits `global_variable_changed`; a mapping can both set globals and send a text). `rooms.js:2959-3020` (room_entered fires on load with `previousRoom` `''`).
- **Not opened.** No VM plan, SecGen file, field guide or the other excluded files. I did no browser run.

**Counts: 0 blockers, 0 majors, 2 minors, 4 nits.**

**Verdict.** R2's major and four minors are closed, and the fixes hold up on reading. The loose-end order at Tesseract's warning is right, T-59 can no longer reach a taken save's briefing, the alibi task waits for 02:10, Wendell stays quiet when he isn't there, and the cold start's first decision now arrives in the same breath. The playtest changes are sound in design: the trace text explains a real outcome, and the resume flags as globals are the right shape. What's left is small, and both minors come from fixes in this commit:
- The new reload pointer sends the player to "[Where are we?]", but at the core stages that ladder doesn't say where to go.
- With Nightshade's hint no longer setting `clue_alibi`, a wrong accusation now needs HaX's alibi topic before a recall appears, and nothing says so.

The season close is strong on every ending I read: the 06:00 walkabout, the season line, the forty-seven, HaX's "the rest", the hearing and the Citadel. Earlier choices land without being listed.

---

## Part 1: R2's findings and this commit's design changes

| R2 | Fix | Verdict |
|---|---|---|
| **M1** loose-end order | `m10_tesseract.ink:224-238` | **Closed.** First that holds: the backdoor (`backdoor_channel_live and not backdoor_closed`), then WREN with the door log, then the door log alone, then the sheet. Still one line. The way back works: after the lock the gallery no longer jams (erb:1590 needs `!outer_lock_open`), the console mapping needs only `flag2_submitted`, `!hax_jammed` and no ending (erb:1718), and "[Close the backdoor.]" is on the console menu whatever the share state (`m10_phone_agent0x99.ink:630`). `console_stop` reads `backdoor_closed` later, so closing it after "Not yet" stops the Seattle credit. The WREN-without-log line now matches what HaX can act on. One leftover is a nit (n3). |
| **m1** T-59 during the briefing | erb:1838-1840 | **Closed.** The change mapping needs `workshop_entered`. The twin on `room_entered:workshop_floor` covers a sleeper caught earlier, and `cracker_text_sent` (declared at erb:4418) keeps it to once. The twin's departure from R2's suggestion (workshop, not server hall) is better: "his bench" is in that room. With P5's rack and the cracker's battery-door variant, the text now points at evidence the player can look at. It lands 2 s after "That's his sheet. Read it." on the same entry (validator 48; timing, uncounted). |
| **m2** `ns_borrow_hint` and `check_the_alibis` | `m10_nightshade.ink:84, 163, 275`; erb:1808-1809; `m10_phone_agent0x99.ink:98` | **Closed.** Nightshade writes `ns_borrow_hint`. The task ticks on whichever of `clue_alibi` and `clue_door_log` comes second, so on every save it ticks after the split. HaX's "[Who was where at ten past?]" now shows on every non-shortlist save. Two consequences of the change are below: m2 (recalls) and n2 (the new global is never read). On m09 shortlist saves the aside still sets `clue_alibi` (erb:1580), so those players never see the breakdown. R2 left that to the stage-8 ruling, and I haven't counted it. |
| **m3** Wendell's bark | erb:3266 | **Closed.** `!m04_voltage_captured` plus `cut_step !== 2`. On the captured branch a click before anyone has asked now shows only the isolator's text. That's acceptable, because captured Voltage is standing in the room and HaX's ladder says "Talk to them first." |
| **m4** the tether | `m10_director_netherton.ink:280-338` | **Closed.** On the silent branch, `aside_end` diverts into `tether`, and "[Let me think about it.]" exits quietly with `door_scene_done` unwritten. The router sends a re-talk back to `tether` ("The van. Does he come up to the door, or not?"), and the blast-door bark and HaX's ladder still point there. One ordering nit (n1). |
| n1 "I'll keep." twice | `:241` "I'll be here." | Closed. |
| n2 "bench upstairs" | `:237` "on the workshop bench" | Closed. |
| n3 End It's description | erb:1445 "Then the night closes." | Closed. |
| n4 duty guard's cone | erb:2778 `visualize: true` | Closed. |

**The playtest-driven changes that touch design**

- **"Your trace is gone…"** (erb:1724-1725). **Sound.** The two mappings cover both cases: the order is pulled while HaX can reach the player, or it's pulled in the jammed gallery and she says so when the jam lifts. That happens at the lock, on leaving the gallery, or on a reload's `game_loaded` (erb:1575). `trace_loss_told` keeps it to once. The outcome is a real consequence of two of the player's own choices. "Let it run" at the console, then Vos's secret or Victoria's walk, pulls the very order the trace was watching. Vos's "The order goes with me" (`m10_vos.ink:66`) gives fair warning in the moment, and HaX's text closes the loop. The console, `whats_live`, the arrival line (`m10_tesseract.ink:122-133`), the card, ELSEWHERE and the 06:00 numbers all read `share_zero_day`, so they agree. The 2.5 s gap after "Lost you up there. I'm back." (validator 46) is timing and isn't counted.
- **The forward-post reload pointer** (erb:1722). **The idea is right, but where it sends the player falls short (m1).**
- **The core resume flags as globals** (`m10_carryover_vars.ink:213-226`; erb:4305-4316). **Sound.** All twelve are declared in both places, and only `m10_tesseract.ink` reads them. `case` resumes on `tess_case_step` and `tess_pitch_said`, `case_records` skips records already read, and `tess_warned` now survives a reload, so the warning still plays only once. `tess_quiet` and `tess_menu` stay file-local, which is correct, because they are per-session re-entry latches.

---

## Part 2: the skill, run again

### Step 1: validator

- **❌ INVALID:** none. The room layout has no overlaps.
- **⚠️ WARNING.** The known set from R2:
  - 2 objective-wiring overlaps;
  - 19 cutscenes guarded by done-globals;
  - the gallery AND gate (a false positive);
  - 5 story doors or lockpick-only locks;
  - 2 door-log text repeats;
  - the `lock_guard` false positive;
  - 31 import conditions.

  New since R2, all from this commit's texts:
  - three toast stacks (46 `hax_jammed`, 48 the workshop entry, 49 `clue_bench_log` with the rack pointer). These are timing and uncounted.
- **Dialogue lint, 9.** The same as R2 (5 blank-reentry on disableClose closing scenes, 2 crowded-hub on paper, 1 US spelling, 1 not-x-but-y at `m10_tesseract.ink:461`). These belong to the dialogue round.
- **💡 SUGGESTION.**
  - New: `ns_borrow_hint` is set but never read (n2).
  - New: `lock_guard_stood_down` on the card's onPickup (intended, P6).
  - The rest as R2.

### 2a. Solvability: OK

Nothing in the commit adds a gate.
- The isolator pull (erb:1716) is on HaX's always-loaded phone NPC with no jam condition, and every other isolator mapping is guarded by `cut_step !== 2` or `!gallery_shutter_cut`. So the pull writes the cut once, and nothing else opens on the same click.
- Kowalczyk's fourth card now needs `cracker_rack_seen` (`m10_kowalczyk.ink:238`). The rack is a named object in the workshop (erb:3224), and HaX points at it once the bench log is read (erb:1846).
- Fonoti's challenge skips on `lock_guard_stood_down`. All three routes write it.

### 2b. Clues: OK

The rack, the cracker's battery door and T-59 now make one small chain in the room where they belong.

### 2c. Educational coverage: OK

The cold-start Base64 rung ("That's encoded, not encrypted. Your kit can read it.") names the concept without the answer. The `box_topic` rewording keeps the concept and adds no technical detail.

### 2c′. Field guides: OK (labUrl still owed, as R1 said)

### 2d. Narrative: OK

**Opening.** The silent branch now plays briefing → aside → tether → table done, in one sitting.

**Middle.** The by-hand cut ends with the player's own hand on the breaker, which is a better beat than a menu button.

**Ending.**
- Tesseract warns once, names the costliest loose end, and the walk back works.
- The three closing scenes each end on HaX or Netherton saying something only this player's season could produce:
  - the 06:00 season line, chosen by `season_line()`;
  - "He asked who taught you. I said I did.";
  - "I'll tell them you asked, and I said it was yours.";
  - Whitlock, Voltage or Nightshade at the Citadel.
- A cold start gets a clean, shorter close (no season line, no forty-seven), which is right.

### 2d′. Ink conventions: OK

### 2d″. Patrols: OK

### 2e. Graph metadata: OK, unchanged

### 2f. Rooms: OK

### 2g. Scaffolding

R1's table still stands. The changes:
- `check_the_alibis` now ticks in order.
- End It's description is true on every ending.
- The weak point is the reload. After a reload the player spawns at the forward post, up to seven rooms from where they were. The new text points to the ladder, and at the core stages the ladder doesn't say where to go (m1).

### 2h. Knock-out resilience: OK, unchanged

A knocked-out escaped Voltage no longer barks (F9). A hidden Wendell stays silent.

### 2i. Recurring classes

- **Status answers go stale.** I walked `where_are_we` again. Two gaps, both from this commit:
  - after a reload, the core rungs don't name the core (m1);
  - on the captured-Voltage by-hand route, `cut_by_hand` is never set (`m10_voltage.ink:88` writes only `voltage_outcome`), so mid-cut the ladder still says "Talk to them first." (n4).
- **Whodunit fairness.** It's still fair and can't be skipped. A wrong accusation can still be undone, but the way back is now hidden behind an unprompted topic (m2).
- **Credits against every route.** No printed change (CONTRACT §11 says the fixer compared against HEAD). The trace and the backdoor both reach their credit lines only on the routes that earn them.

---

## Findings

### Minor

**m1. After a reload, "Ask me where we are" gets an answer that doesn't say where.** Files and lines:
- `scenario.json.erb:1722` (the pointer);
- `m10_phone_agent0x99.ink:115-129` (the ladder's top rungs).

A reload spawns at the forward post (an engine limit). Once the breach is open, HaX texts "Everything below is still open. Ask me where we are." The ladder's comment says it "names where to walk back to", and the lower rungs do: "Power room.", "The hatch in the sealed section.", "Up the stair. The lock's at the end." But a reload during the most likely stretch to save and quit, the long scene at the core, gets one of these:
- "Hear him out.";
- "Your call on his console.";
- "The database. Then him.";
- "It's him now.";
- "You're in. His box first."

None of them names the core, and the core is the farthest room from the spawn. A returning student is told to ask, asks, and still doesn't know which way to go.

The same text also fires on any ordinary walk back. The likeliest case is stepping back out of the tunnel after "Breach. Go." to dodge the tunnel guard. That player then gets "Everything below is still open. Ask me where we are." two seconds later, which reads as if they're lost.

**Fix.**
- Add `&& !data.previousRoom` to the pointer's condition. On load, `previousRoom` is `''` (`rooms.js:2965`, `:94`); on a walk back it's `blast_tunnel`.
- Name the room in the core rungs, in a form that reads right whether the player is there or seven rooms away:
  - "The core. Hear him out.";
  - "The core. Your call on his console.";
  - "The core. The database, then him.";
  - "The core. It's him now.";
  - "In the core. His box first."

These are unvoiced hub lines. Browser check: reload with `exchange_3` set, read the text, ask, and walk to the core.

**m2. After a wrong accusation, the recall is hidden behind a topic nothing points to.** Files and lines:
- `m10_phone_agent0x99.ink:92-96` (the recalls need `clue_alibi`);
- `:98` (the alibi topic);
- `:358-370` (`accuse_refused`);
- `:402` (Malhotra's "Check the log again.").

Before this commit, Nightshade's hint set `clue_alibi` at the table on most saves, so "[Bring Malhotra back.]" appeared straight after a wrong accusation. Now, on every non-shortlist save, the recalls for Malhotra, Arakawa, Vector and Phantom stay hidden until the player happens to ask "[Who was where at ten past?]". That fits the design (a recall needs the evidence that clears the officer), but nothing points to the topic:
- Trying to name someone else gets "Get Malhotra back first." with no recall button on screen.
- Malhotra's own protest, "Check the log again.", sends the player back to the door log, which names his badge.

A student who has just lost HaX's relay and wants it back sees the consequence but not the remedy. That's the kind of moment that turns a fair deduction into "the game is broken".

**Fix.** In `accuse_refused` and at the end of `accuse_wrong`, when `not clue_alibi`, add one HaX line after the existing one, for example: "Show me where everyone was at ten past, and Netherton will clear him." (her/them as needed). It's unvoiced. Optionally, move "[Who was where at ten past?]" above the accusation line in the hub while `officer_out != ""`, so the remedy sits at the top. Quintero's recall already has its pointer in her own line ("Read the sheet.").

### Nits

- **n1. On the silent branch, HaX's console line splits Nightshade from "He".** `m10_director_netherton.ink:288-296, 309`. The order is now HaX's "Nightshade's in the van.", then HaX's "Start the gate console on your way past. It's slow to boot.", then Netherton's "He has said one word since we took him: 'Door.'" The "He" lands after a line about a terminal. **Fix:** on the silent branch, say the console line after the tether (or leave it to the 8 s text, which already says it), or open the tether with "Nightshade has said one word…" (Netherton, 1 reworded).
- **n2. `ns_borrow_hint` is written and never read** (validator suggestion 50; `m10_nightshade.ink:84, 163, 275`). It's harmless, but Nightshade's advice now goes unanswered. **Fix:** let HaX's alibi topic nod to it once (`{ns_borrow_hint: Nightshade's rule. Whoever went where nobody watches.}` before "So who wasn't where…"), or drop the global.
- **n3. The warning names one loose end, then never another.** `m10_tesseract.ink:224-238`. A player who hears "His backdoor's still open.", walks back and closes it, then returns to "All four. Good." with the sheet still unread, gets no second line. "At most one" was R1's ruling, and that's right for the first pass. **Fix (optional):** on a re-entry after "Not yet" (`tess_warned and not tess_pitch_said`), HaX says the first loose end that still holds, if any. It's the same four lines, with no new clips.
- **n4. On the captured-Voltage by-hand route, HaX's ladder says "Talk to them first." mid-cut.** `m10_voltage.ink:88` sets `voltage_outcome = "by_hand"` but not `cut_by_hand`, so `m10_phone_agent0x99.ink:140-149` never reaches "Third from the left. Go and pull it." at step 2. The player is standing beside Voltage, so the harm is small. **Fix:** a rung `power_room_entered and not gallery_shutter_cut and voltage_outcome == "by_hand"` with the same step 2 line as the others ("Third from the left. Go and pull it.", or "He's talking you through it."). Puzzle chains R2 may already own this.

---

## Prioritised action list

**Must fix:** none.

**Should fix**
1. m1: the reload pointer fires on reload only, and the core rungs name the core.
2. m2: after a wrong accusation, HaX points at the alibi that clears the officer.

**Worth considering:** n1 to n4.

## Top five

1. **m1.** After a reload, "Ask me where we are" answers "Hear him out." with no room named. It also fires when the player steps back out of the tunnel.
2. **m2.** After a wrong accusation, "[Bring X back.]" stays hidden until the alibi topic is asked, and the refusal line doesn't say so.
3. **n1.** On the silent branch, the gate-console line sits between "Nightshade's in the van." and Netherton's "He has said one word…".
4. **n3.** After "Not yet", a second loose end is never named.
5. **n4.** On the captured-Voltage cut, HaX's ladder lags a step ("Talk to them first." at step 2).

## For the user

- On m09 shortlist saves, the aside still sets `clue_alibi`, so HaX's alibi breakdown never shows there. Keep it (the shortlist is the narrowing) or drop it so every save gets the breakdown? This was R2's open point.
- The closing card's teaser is still off (F11), and R1's VM questions 1, 2 and 4 still stand.

## Out of scope (engine interruption and timing; uncounted)

- Toast stacks from this commit's texts (validator 46, 48, 49). The `aside_done` texts and the guide offer now land while the silent branch's tether is on screen.

## Browser checks owed (not findings)

1. The isolator at step 2 shows the "where you pulled it" text on the same click, gives one "Shutter's dead" text, and gives the right `cut_done` call or bark for HaX, Vance, Elena and captured Voltage.
2. Reload at the core mid-`case` (`tess_case_step` 1) resumes at "Where was I. Your record." without the warning.
3. Trace, then Vos's secret in the gallery, then the lock: "Your trace is gone…" arrives once, and the core arrival line doesn't claim a trace.
4. Silent branch: the aside runs into the tether. "[Let me think about it.]" exits, and a re-talk asks again.
5. After the m1 fix, the pointer fires on a reload and not on stepping back out of the tunnel.
