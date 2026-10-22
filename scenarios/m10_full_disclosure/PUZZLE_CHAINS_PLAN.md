# m10 Full Disclosure: puzzle-chains plan (phase 2, round 1, with reviewer rounds)

2026-10-22. Phase 2 of the AGENTS.md five-phase loop, run with `.claude/skills/mission-puzzle-chains/SKILL.md` on the tree at ea760465 ("Finale m10: alignment round 12 fixes, phase 1 closed"). Plan only. Nothing in the mission was edited (§4.7 says why each candidate fix was left to the plan).

**Kind of game and aim.** The Licence to Hack Season 1 finale, a TV spy thriller. The user's test for this phase: is it fun, engaging and educational; do the player's m01–m09 efforts and decisions land; does it wrap the season up?

**Method.** I worked from `scenario.json.erb`, the ink, the engine under `public/break_escape/js/`, `room_depth.py` and the validator (`--skip-ink --no-graph`, so `dungeon_graph.*` was not rewritten). CONTRACT.md §11 and ALIGNMENT_REVIEW_F_R12.md set what is settled. I opened no VM plan, SecGen file or field guide. VM flags are black-box submissions at their stations. Engine interruption and timing (Esc, reopen, F5, network races) is out of scope.

**Base.** [Final pass] Body citations are to m10 at ea760465, where the work began. m10 then moved to 87dbe9db (dialogue R1, educational R1, scenario design R1), and every finding was re-checked there; §13 gives each finding's status and its line at 87dbe9db. Earlier note: HEAD moved during the review (other missions and two committed m10 review documents, SCENARIO_DESIGN_REVIEW_R1.md and FINALE_EDUCATIONAL_REVIEW_R1.md; no cited m10 game line moved). m09 lines are as at the time of writing: the alpha mapping and sheet now sit near m09 erb:331 and :2279. §13 reconciles this plan with those two reviews. That round is now committed as 87dbe9db. At round 3 an uncommitted SD R2 fix round was in the tree; once it lands, ERB lines after about erb:1797 move by about +6 (2294→2300, 2312→2318, 3243→3249, 3304→3310, 3735→3741) and tesseract lines after about :234 by about +5. Re-cite against it before implementing.

**Counts, open in the game at 87dbe9db: 0 blockers, 1 major, 4 minors, 4 nits.** Major: F1. Minors: F2, F4, F5, F9. Nits: F3's remainder, F6, F7, F10. F8 was withdrawn after 87dbe9db's E-m7 ruling, and most of F3 was closed there. The three review rounds raised 2 majors, 20 minors and 19 nits against the plan itself; all are folded in (§14).

---

## 1. Summary: what to do, in order

| # | Item | Severity | Kind | Depends on |
|---|---|---|---|---|
| P1 | HaX's "[Talk me through the shutter.]" waits for the cut to fall to the player (`cut_by_hand`), so it can't skip Wendell's choice or escaped Voltage's scene; it replaces the dialogue round's "or you by hand" rung | **major** (F1) | ink, one condition; two `where_are_we` rungs (unvoiced) | nothing |
| P2 | The by-hand cut ends at the isolator: the voice talks the player to it, and clicking the isolator pulls the breaker; 87dbe9db's isolator mappings (SD m3) get the step-2 guard and their two bark gaps closed | minor (F2, F9) | ERB: the pull mapping, two state variants, `addToNotes: false`, guards on three SD m3 mappings and two barks; ink: four voices' last step; success lines move to calls, a text and a bark | P1 |
| P3 | The decoded figure lands in his concession (the rest of F3 is closed by 87dbe9db, SD m4 and the M1 warning) | nit (F3 remainder) | ink, one voiced line | nothing |
| P4 | Exchange 3's Tomb Alpha answer quotes what an m09 player read, not what only a decode gave | minor (F4) | ink, one button (unvoiced) | nothing |
| P5 | Kowalczyk's fourth card needs the cracker rack seen, and the player's own cracker shows the tell | minor (F5) | ERB: one mapping, one global, two observation variants, one pointer text; ink, one condition | nothing |
| P6 | Fonoti's challenge stands down only once he has handed over or stood down, not once the player has read his name | nit (F6) | ERB: one global, three writes, the challenge's skip list; ink, one write | nothing |
| P7 | Escaped Victoria's "which of these two" counts the gallery's guards wrong on most saves | nit (F7) | ink, two voiced lines (dialogue phase) | nothing |
| P9 | HaX's camera answer agrees with the isolator and the other three voices (a toggle under the row, not "fourth one along") | nit (F10) | ink, one voiced line | nothing |

**Overlaps with 87dbe9db** (§13): P2 builds on SD m3; F3 is mostly closed by SD m4; E-m7's firm option (P8) was decided against there, so P8 is withdrawn.

All eight (P1–P7, P9) are mission-local. P1 is the bug fix and goes first; P2 builds on it. P2 touches four voiced call knots, P3 one voiced line, P7 two, P9 one; m10 has no audio yet (`tts_cache/` holds no m10 clips), so none of them costs anything now. After each: recompile with `./scripts/compile-ink.sh m10_full_disclosure`, run `tagdiff.mjs` against HEAD, `dialoguelint`, `reopencheck` for `agent_0x99`, and the validator with `--skip-ink --no-graph`.

---

## 2. Headline numbers

From `room_depth.py`, the validator and `dungeon_graph.md` (2026-10-22). m01, m02 and m09 as in m09's plan §2.

| | m01 | m02 | m09 | m10 |
|---|---|---|---|---|
| Rooms | 13 | 13 | 11 | 8, a single corridor of rooms |
| Empty rooms | 0 | 2 | 1 | 0 |
| lockType declarations | 12 | 15 | 11 | 9 (six doors, cupboard, locker, model terminal) |
| Max room depth | 3 | 7 | 5 | 7 (`core`) |
| Critical-path hops (aims) | 9 | 4 | 3 | 5 (dungeon_graph.md, "Critical Path") |
| Locks on the critical path | — | — | 7 | 6: blast door (story), inner door (story; open on entry unless the tripwire is armed), Stair B (story), power room (card), gallery stair (story), outer lock (PIN) |
| Deductions needed to finish | — | — | 3 | 1 at most: the outer lock with the cracker's feedback, unless an earned code or an NPC opens it |
| Optional deductions with a payoff | — | — | 4 | 6: the whodunit (three clues in three rooms → a name, erb:1781-1786), Nightshade's payment against Helena's plans (nightshade.ink:194, 292), Voltage's print against m04 (voltage.ink:237), the casualty sheet (Voltage, Asante, Imran, exchange 1), the margin decode (erb:3102-3141), the keypad plate's digits (erb:3904-3927) |
| Start-kit tool classes used | 1 | — | 5 of 5 | 5 of 5, all optional except the cracker (§9) |
| VM flags | — | — | 4 | 4 on four stations, each opening a physical or story door (§8) |

---

## 3. Boss-key audit

Depth is BFS from `forward_post`. "Seen" is the depth at which the player first meets the lock; "key" is where its key or code first becomes available.

| Lock | Seen | Key from | Key depth | Verdict |
|---|---|---|---|---|
| Blast door, story RFID (erb:2595-2598) | 0 | the table scene, flag 1 and Arakawa's call, all at the forward post (erb:1617-1630) | 0 | ✅ announced story gate. Three inputs converge on one door, and each missing input has its own bark (erb:1624-1626) |
| Inner door, story RFID (erb:2710-2713) | 1 | opens as the player enters the tunnel (erb:1639); on the tripwire route, the ladder in the same room (erb:1645-1646) | 1 | ✅ by design. On most saves it isn't a lock. On the tripwire route it is the table's consequence, not a puzzle (W8) |
| Stair B, story RFID (erb:2984-2987) | 2 | Ghost's call on the duty handset, same room (erb:1653) | 2 | ✅ story beat. On the selling branch the call is a persuasion choice with a cost either way (ghost.ink:111-135) |
| Power room, RFID `tg_power_room_card` (erb:3198-3201) | 3 | Imran talked round, or Gary's or Imran's card copied with the cloner, same room (imran.ink:80-108; gary.ink:135-168); the fitter's spare card, picked out of the locker one room back (erb:2925-2954) | 3 / 2 | ✅ the one required lock where the player picks the tool: a decision, the cloner (m03) or the picks (m01). HaX's first-refusal bark names both routes (erb:1667) |
| Records cupboard, PIN 2817 (erb:2887-2924) | 2 | Vector's code (m08, same room, vector.ink:43-46), Ghost's code (m02 kept, ghost.ink:65-67), the cracker | 2 / 0 | ✅ by design, optional. Its rota is the long-arc clue for the outer lock |
| Fitter's locker, key (erb:2925-2954) | 2 | the lockpick (start kit), under the duty guard's patrol (erb:2737) | 0 | ✅ by design, optional |
| Model terminal, password (erb:3117-3141) | 3 | the margin strip beside it + CyberChef | 3 | ❌ same-room by intent (the decode is the step; erb:3116), optional. See F3 for what it pays |
| Gallery stair, story RFID (erb:3611-3614) | 5 | flags 2 and 3 in the same room; the cut, one room back (erb:1721-1730) | 5 / 4 | ✅ boss-key when the player walks past a live shutter: the hall is open from the power room, and the third bark sends them back (erb:1730) |
| Outer lock, PIN 6083 (erb:3962-3966) | 6 | the cracker (0); the keypad plate's digits (6, fingerprint kit, erb:3917); the rota → Fonoti's card (2 → 6, erb:2906, fonoti.ink:28-32); Ghost's code (2, m02 refused, ghost.ink:78); Vos's card or Victoria/Vos opening it (6, m03, vos.ink, victoria.ink) | 0–6 | ✅ by design. The cracker is the floor; every earned route is a shortcut that carries a story (W1) |

**Reading it.** No key-before-lock surprises. The two same-room story doors (Stair B, the tripwire ladder) are scenes rather than puzzles, and both cost something. The one lock that makes the player choose a tool is the power room, and it does it well. The weak beat in the audit isn't a lock: it is the shutter cut, which is the gallery stair's third input and never touches the room's isolator (F2), and which a hub topic can play before the room's scene (F1).

---
## 4. Findings

### F1 (major). HaX's shutter topic opens before the power room's scene, so the by-hand cut can skip Wendell's choice and the whole escaped-Voltage scene

**Evidence.** The hub offers "[Talk me through the shutter.]" on `{power_room_entered and not gallery_shutter_cut and phone_voice_is_hax}` (phone:83). It diverts straight into `cut_call` (phone:533-534), whose three steps end on `~ gallery_shutter_cut = true` (phone:736-739). Nothing asks whether the cut has fallen to the player: `cut_by_hand`, which Wendell's walk-away, a knock-out or Voltage's fight sets (wendell.ink:53-57; erb:1679, 1682-1683; voltage.ink:281), is not in the condition. `phone_voice_is_hax` is true on any save without m04's Vance ally, m07's turned Elena or a captured Voltage (erb:1562), which includes every cold start and every escaped-Voltage save without those allies.

**What the player meets.**
- *Escaped Voltage* (m04 `voltage_escaped`). He says "The shutter stays live until he says otherwise. Say what you came to say." (voltage.ink:233). The scene is the finale's best m04 payoff: his thumbprint on the bypass against the Albion print, or the casualty-sheet talk-down, or a fight (voltage.ink:236-265). The new topic is in HaX's hub the moment the player walks in. Three taps cut his shutter while he stands at it, his outcome becomes `avoided` on the way out (erb:1686), and the credits say "Still at his switchgear when the team came down." (erb:664). The print, the sheet and the fight are all skipped, and his line about the shutter is false.
- *Default, Wendell.* HaX's entry text frames the choice ("He doesn't know. Tell him, and he'll want to warn somebody. Their switchboard will hear it.", erb:1691), and then the hub offers a way round it. The cut by that route also leaves `cut_by_hand` false, so the mapping at erb:1695 sends "Shutter's dead. The hall's next." 2.5 s after HaX has just said "That's the shutter. It's dead." (phone:739). The line plays twice.

**Why it's a defect, not a ruling.** OT §4.9 made the topic "the last net" for a *missed ring*: "so even with the ring missed the cut is always one tap away" (stage_4/objectives_tasks.md:304). The ring itself waits for `cut_by_hand` (erb:1688). Leaving that out of the topic's guard turns the net into a door round the room's scene.

**Fix: P1.**

### F2 (minor; was major, regraded in r1). The by-hand cut never touches the isolator

**Evidence.** The aim is "Cut The Gallery's Power", and its task is "Get the gallery's blast shutter cut" (erb:1388-1399). Four voices can talk the player through it: HaX (phone:690-744), Vance (vance.ink:30-80), Elena (elena.ink:31-83) and captured Voltage in person (voltage.ink:137-203). Each is three menu taps: "[I'm at it.]", "[Key's turned.]", "[Pulling it.]", and the last tap writes `gallery_shutter_cut` in ink. The room's `shutter_isolator` (erb:3307-3326) is only a readable label. Nothing ties a tap to standing at it, and the phone calls can be answered in any room once they ring (the HaX topic in any room after `power_room_entered`, F1; Vance and Elena re-ring on entry but are answerable after leaving).

**Why it matters.** The voices are written as physical instruction ("Turn the key a quarter right and leave it.", "Third from the left, the big one. Don't touch the others."), and the isolator is drawn for it (`m10_key_isolator1`, ROOM_DRESSING.md:174). A by-hand route is one of the two options in every power-room scene: Wendell worked round or knocked out, captured Voltage's "[I'll do it. Talk me through it.]", escaped Voltage fought. On those saves the act's set piece is three buttons. [r1] With P1 in, the taps nearly always happen in the room, so this is a missed hands-on beat, not a break: minor. It's the one hands-on beat the power room offers, and it isn't hands-on.

**Also open from dressing.** The isolator still copies a snapshot of its text to notes, which goes stale after the cut. Dressing left `addToNotes: false` to this phase (DRESSING_REVIEW_R4.md:43, 102).

**Fix: P2.**

### F3 (minor at ea760465; mostly closed at 87dbe9db, remainder nit). Exchange 1's plain rebuttal claims a correction the player may never have seen, and the margin decode pays in wording only

**Evidence.** Exchange 1's slot 2 is the rebuttal on every save (CONTRACT §5.4). With neither `margin_note_read` nor `asante_confirmed_sheet` it reads "[Someone corrected your sheet upwards, and you signed your old number under it.]" (tesseract.ink:509). Nothing gates it on `casualty_sheet_read`. The correction is on the sheet itself (erb:326) and Imran mentions a "strip" in the margin (imran.ink:52), but a player who skipped both (HaX's two nudges are texts, erb:1713, 1805; Imran defers to Gary on the unprotected branch, imran.ink:16-17) is offered a fact they never learned. It's the class m09 avoided on purpose: "so the button never claims a decode the player didn't do" (m09 phone:688-690).

The other end is thin as well. The workshop's one decode chain, the Base64 strip into CyberChef, `DOUBLECOUNT` and the bench terminal (erb:3102-3141), sets `margin_note_read`. That only swaps the same rebuttal's wording ("Asante corrected your sheet, and you signed your old figure under her initials.", tesseract.ink:503) and ticks an optional task (erb:1676). Asante's confirm needs only the sheet (asante.ink:46). The decode is good CyberChef practice, but the finale's argument doesn't notice whether the player did it.

**Fix: P3.**

### F4 (minor). Exchange 3's Tomb Alpha answer quotes a line only a decode gives, but the import means "opened"

**Evidence.** "[Your Tomb Alpha notes say carry it. They never say hand it on.]" shows on `m09_deck_pulled == "alpha_tapes" and m09_alpha_annotations_read` (tesseract.ink:727, 765). In m09, `alpha_annotations_read` is set when the readable sheet is opened (m09 erb:325, 2249), and the sheet's last line is Vigenère ciphertext under "For session three, decode. Key: the series." (m09 erb:2264). "Carry it yourself" is the decoded text, and m09 never confirms a decode (m09 phone:688-693). A player who opened the sheet and didn't decode it is offered a quotation they never read. Tesseract's own "Let it hurt afterwards" (tesseract.ink:708) supplies the second half, not the first.

**Fix: P4.**

### F5 (minor). Kowalczyk's fourth card is offered on entering the workshop, not on seeing the evidence it cites

**Evidence.** In the face-to-face accusation, card 4 is "[You said it never went through stores. Then it came straight off his bench.]" on `{workshop_entered}` (kowalczyk.ink:233-237). The evidence is the cracker rack: "Racks of half-built PIN crackers in matte casings. No stores labels. A batch sticker inside each battery door: G-19." (erb:3182), set against her own words on the player's cracker, "Matte casing, no stores label… 'This one's mine. Never been through stores'" (erb:1334-1337). The rack is an observation-only prop that nothing records (erb:3176-3183). The contract's rule for these cards is "A card shows only once the player holds what it says" (kowalczyk.ink:13-14), and card 2 follows it (`clue_bench_log`, :220). Card 4 doesn't.

**Why it matters.** It's the most personal clue in the whodunit: the tool the player has carried since the briefing (or since Helena) came off his bench. A player who walked past the rack gets the line handed to them, and a player who did notice the casings gets nothing more for it.

**Fix: P5.**

### F6 (nit). Reading Fonoti's name upstairs stops him challenging the player at his own lock

**Evidence.** His sight challenge skips on `lock_guard_known` (erb:3708). That global is written when he hands over the card (erb:3700, 3714), but also by reading the gallery rota (erb:2906), Ghost's "trust" answer (ghost.ink:85), Victoria's "[Go.]" (victoria.ink:121) and Vos's deal (vos.ink:68). So a player who has only read the rota can crack the outer lock inside his drawn cone and he says nothing. The global's two meanings ("the player knows who carries the card" and "he has stood down") have merged. The cost is small (his challenge has a free "Shift change" pass, W2), but the scene doesn't make sense.

**Fix: P6.**

### F7 (nit). Escaped Victoria's "which of these two" miscounts the walkway

**Evidence.** "Which of these two carries the code card." / "…I tell you which of these two has the code card." (victoria.ink:111, 113). The gallery holds three guards by default: Fonoti, Haugen at the monitor and Farah at the floor post (erb:3686-3765; rota erb:298-300). Farah goes home on Imran's `talked_round` (erb:3762) and Haugen leaves on a blinded camera (erb:3740-3741), so the count is three, two or one by save. It's right only when exactly one of them has gone. The wording is in the design docs (MC §3.5, arc, SE, S6 §2.4), so it's a dialogue-phase change, not a factual fix.

**Fix: P7.**

### 4.7 Bug sweep (skill Step 4)

| Check | Result |
|---|---|
| Cross-scenario ids hard-coded in shared minigames | None reached. m10 uses PIN, password, RFID (clone tags and the reader), lockpicking, dusting, flag stations, the VM launcher and the alarm panel, all scenario-driven |
| `item_picked_up:` keyed on id | None. Both use the type with `data.itemId` (erb:1813 `item_picked_up:key` for `alarm_override`; erb:3714 `item_picked_up:notes` for `gallery_code_card`). The validator's "registers only once the gallery loads" note on the second is harmless: the card exists only in Fonoti's hands, and its own `onPickup` writes the same global |
| Tasks with no completion route | None on the required list. Each traced to its setter (erb:1675-1676, 1694, 1702-1705, 1758-1786). `use_the_console` (optional) can't complete on the rare save where both shares were stopped elsewhere before the first console use (§10 W9) |
| Player-visible author notes | None in `text`, `observations` or ink |
| Observations that state a code | None. The plate's dusted variant gives the digit set, which is the point of dusting (erb:3917) |
| Rename residue | None. Rota, duty board and credits agree on Fonoti, Haugen, Qureshi, Kiel, Abara, Malhotra, Kowalczyk, Quintero |
| Stale geography | Checked against `connections` and ROOM_DRESSING.md:50-55: "the cupboard on the west wall" (ghost.ink:48; dressing: "on the west wall below the W door"), "the fitter's locker upstairs" (erb:1667), "the sealed section's hatch, at the east end of the server hall" (erb:78), "a printer by the west door" (erb:3589), "Grey cabinet by the door" (vance.ink:36; "the gallery shutter's key switch by the E door"), "the stair at the west end" of the gallery. All true. HaX's "on the wall by the old board" (phone:695) is looser than the others but not wrong |
| Dead ERB helpers, unused narrative variables | None found. `clock_times`, `zd_word_*`, `resale_*`, `cell_names`, `signout`, `rota`, `duty_board`, `bench_log`, `schedule`, `printer`, `payment` are all interpolated |
| Technical claims | The margin strip decodes to "For whoever checks his sums. Recovery counted twice, hospital rows. True range 2,100 to 3,600. My model is on the bench terminal, key DOUBLECOUNT. Abena Asante" (checked; the ERB also raises if it drifts, erb:172-174). The plate's digits 0, 3, 6, 8 are exactly the outer lock's (erb:177, 3917). EM4100 as an instant clone matches the engine (npc-conversation-state.js:687). The cracker removes the attempt limit (pin-minigame.js:42-45), so both PIN locks are Mastermind deductions, as m09's plan asked of m10 (m09 plan §9 item 3). Coordinated disclosure (vendors first, time to fix, workarounds to operators for the unpatchable; tesseract.ink:1044) and "full disclosure is one researcher, one flaw, after the vendor stops answering" (netherton.ink:138) are fair. The 90-day fix window on the card (erb:512) is the common industry default |
| Validator (`--skip-ink --no-graph`) | 0 errors. The two objective-wiring warnings, the cutscene `onceOnly` advisories, the imported-condition advisories, the five intended "nothing can open it" story-door and locker warnings (erb:23-29), and dialogue-repeat warnings that belong to phase 4 |

**Why nothing was fixed in place.** F1 is a one-condition ink change, but it is a logic gate with a softlock surface (P1 "What could break"), not a factual slip, so it goes through review with P2. F7's wording is carried by four design documents. No wrong CVE, rename residue or player-visible author note turned up.

**Interruption track, one line, uncounted.** Nothing new beyond R12's note that `#clone_keycard` is never flushed on an Esc (Gary's and Imran's clone picks). P2's mapping is synchronous on the click, so it adds nothing to that class.

---
## 5. Proposals

### P1. The shutter topic waits for the cut to fall to the player ✅ keep (F1)

**Story logic.** HaX talks the player through the switchgear when whoever runs the room won't or can't. She doesn't go round them.

**Change.**
1. phone:83: `+ {power_room_entered and cut_by_hand and not gallery_shutter_cut and phone_voice_is_hax} [Talk me through the shutter.] -> shutter_topic`. That is OT §4.9's intent, the net for a missed ring, since the ring itself waits on `cut_by_hand` (erb:1688).
2. `where_are_we` (phone:108-150) gains two rungs above `workshop_entered` (unvoiced). [r1 R7] The dialogue round in progress adds a `power_room_entered` rung, "The shutter. Whoever runs that room, or you by hand."; P1's two rungs replace it, since after P1 HaX no longer offers "by hand" before the scene:
   - `power_room_entered and not gallery_shutter_cut and not cut_by_hand` → "The shutter's on whoever runs that room. Talk to them first."
   - `power_room_entered and not gallery_shutter_cut and cut_by_hand` → "The shutter's ours now." then `{cut_step == 2: Third from the left. Go and pull it.|{phone_voice_is_hax: Ask me and I'll talk you through it.|Pick up when they ring.}}` [r2 m1: gating on `phone_voice_is_hax` too left Vance's and Elena's saves on "Get to the power room" while standing in it.]
3. Nothing else. With the gate, every HaX by-hand cut has `cut_by_hand` set, so the "Shutter's dead. The hall's next." text (erb:1695, `!cut_by_hand`) no longer doubles her in-call line. P2 then moves her success line to that text.

**Cost.** One ink condition, two unvoiced lines. No new global.

**Dependencies.** None.

### P2. The by-hand cut ends at the isolator ✅ keep (F2)

**Story logic.** The voice knows 1960s switchgear and the player has the hands. The call gets the player to the cabinet and says which breaker; the player pulls it.

**Change** (ERB and four ink files):
1. **One mapping on `agent_0x99`**: `object_interacted`, condition `data.objectName === 'Shutter Isolator' && data.roomId === 'power_room' && globalVars.cut_step === 2 && !globalVars.gallery_shutter_cut`, `setGlobal: { cut_step: 3, gallery_shutter_cut: true }`, in that order, `cooldown: 0`. [r1 R1] The engine sets each key and fires its `global_variable_changed` at once, in object order (npc-manager.js:808-817), so `cut_step` must be 3 before the `gallery_shutter_cut` event that item 4's calls and bark listen for. `cut_step` is already a JSON global (erb:4249), so a reload keeps it. Gating on step 2 keeps the people choices: the isolator can't pull until a voice has talked the player to it, and a voice rings only once the cut has fallen to the player (P1; erb:1688, 2272, 2288) or captured Voltage has been asked (voltage.ink:87-90).
2. **The isolator** (erb:3307-3326): `addToNotes: false` (dressing's open item: its snapshot goes stale after the cut). [r1 R2] The click's `object_interacted` fires synchronously (interactions.js:712) before the read resolves its text, so the mapping always wins and a pre-cut "you pull it" variant could never show. Instead, two new first variants (text and observation) on the by-hand state, written in state tense so they stay true on later clicks. Only a voice's talk-through reaches `cut_step` 3; Wendell's and Voltage's own cuts don't:
   - [r2 m4; final pass] No label row: 87dbe9db declined E-m10's row because its breaker numbers would contradict the "small toggle under the row" for the camera. The voice names the breaker ("third from the left"), and the camera stays a toggle (P9 aligns HaX's one line that says otherwise).
   - `globalVars.gallery_shutter_cut === true && globalVars.cut_step === 3 && globalVars.gallery_camera_blinded === true` → "Key a quarter right. The third breaker from the left down, where you pulled it. GALLERY SHUTTER: ISOLATED. Under the row, the painted toggle thrown: GALLERY CAMERA: OFF."
   - `globalVars.gallery_shutter_cut === true && globalVars.cut_step === 3` → "Key a quarter right. The third breaker from the left down, where you pulled it. GALLERY SHUTTER: ISOLATED."
   - the two existing cut variants follow, unchanged, for the NPC cuts.
   S6 owns these strings; add them to S6 §1.5 (lore_fragments.md:354-361) with a "puzzle chains P2" mark.
3. **Each voice's last step** stops writing the cut. HaX `cut_breakers` (phone:727-744), Vance `cut_2_menu` (vance.ink:63-82), Elena `cut_2` (elena.ink:68-83) and captured Voltage `cut_p2_menu` (voltage.ink:177-203): "[Pulling it.]" becomes "[Going to it.]" with no `cut_step`/`gallery_shutter_cut` writes; the voice's line becomes the instruction ("Third from the left. Go and pull it.", in each voice's own words); then the call or talk ends without writing anything. [r1 R3, R9] Vance's and Elena's re-rings resume their saved story (`"resume": true`, erb:2273, 2289; npc-manager.js:1182), so "[Going to it.]" → the instruction → a one-choice stitch "[On it.]" with `#exit_conversation` → `cut_2_menu`, not `cut_close_way` → `cut_after` (which shows only "(Put the phone away.)"). [r2 m5: the phone closes as the last line types out (phone-chat-minigame.js:990-1003), so an information line ends on a short reply.] It becomes step 2's only exit, replacing "[Give me a minute.]", which would now mean the same; the new `cut_done` call mappings carry no `resume`. HaX routes on `cut_step` without resume; her step 2 also drops "[Give me a minute.]" and closes "[Going to it.]" on "[Got it.]" [r2 n6]. Voltage's "[Going to it.]" exits without setting `volt_quiet`, so a re-talk replays the instruction line rather than jumping to `cut_p2_menu` (voltage.ink:117-126). The camera question stays in this step, before the instruction. "[I'm at it.]" and "[Key's turned.]" stay as they are: they pace the talk and write `cut_step`, which a reopen routes on.
4. **The success lines move to after the pull**, one per voice, heard once:
   - HaX: her text "Shutter's dead. The hall's next." on every cut where she is the voice (`gallery_shutter_cut` with `cut_by_hand && phone_voice_is_hax`); merge erb:1695-1696 so each cut sends HaX's text once.
   - Vance and Elena keep their voiced success lines (Vance: "That's it. Shutter's dead. Sixty-year-old kit, and it still does what it's told.", vance.ink:78; Elena: "Done. That shutter's dead. Go get him.", elena.ink:83 at 87dbe9db) as a short voiced call, `cut_done`, rung on `gallery_shutter_cut` with `cut_step === 3` on their branch (`onceOnly`, `delayMs: 1500`), ending on "[On my way.]". Their cameo's warmth is the m04 and m07 payoff, so it keeps the voice. HaX's text follows theirs, as it does now (erb:1696).
   - Captured Voltage: his line ("That's it. Shutter's dead. You'll want to say you did it alone. You did.") becomes a bark from `voltage_power_captured` on `gallery_shutter_cut` with `voltage_outcome === 'by_hand'`. `captured_rest`'s "Shutter's isolated. The rest is yours." plays on the next talk [r2 n1].
5. **Re-rings** (What could break, S7): HaX's one-time re-ring on `conversation_closed:agent_0x99` (erb:1690) gains `&& globalVars.cut_step !== 2`, or ending her call at step 2 rings it straight back. The `room_entered:power_room` re-rings (erb:1689, 2273, 2289) stay: at step 2 they repeat the instruction to a player who left without pulling, which is the right reminder.
6. **87dbe9db's isolator mappings (SD m3)** [final pass]. A click opens the voice's `cut_call` when the cut is by hand (erb:1704, 2294, 2312 at 87dbe9db); add `globalVars.cut_step !== 2` to each, so the step-2 click pulls instead of reopening the call (their delayed open would also re-check `!gallery_shutter_cut`, npc-manager.js:620-626, but say it in the condition). Close two bark gaps (F9), if not already in (the uncommitted SD R2 round adds Wendell's guard): Wendell's bark (erb:3243) needs `!globalVars.m04_voltage_captured`, or a hidden Wendell barks "Hands off my panel." on captured saves (his condition tests only `!m04_voltage_escaped`, and barks don't check visibility); escaped Voltage's bark (erb:3304) needs `globalVars.voltage_outcome !== 'ko'`, or a knocked-out Voltage says "The shutter stays live until he says otherwise." Any new isolator bark (SD R2 suggests one for captured Voltage) also carries `cut_step !== 2`, so the pulling click doesn't bark.

**Cost.** [r2 n7] Four new mappings (the isolator pull, Vance's and Elena's `cut_done` rings, Voltage's bark), the merge of erb:1695-1696, the re-ring guard; the isolator's label text and two state variants (S6); four ink knots changed and two new one-line voiced knots (existing lines moved); and P2's guards on 87dbe9db's isolator mappings (item 6). m10 has no audio yet.

**Dependencies.** P1 (otherwise the HaX topic still offers the cut before the scene; P2 would only make that route end at the isolator).

### P3. The decoded figure lands in his concession (F3 remainder; items 1–3 superseded)

**Superseded at 87dbe9db.** SD m4 gated the correction rebuttal on `casualty_sheet_read`, with the decoy "[Nobody can know a number like that.]" for a non-reader (tesseract.ink:552-558 at 87dbe9db). This plan's W6 worried that a non-reader would face an exchange where every button misses. 87dbe9db's M1 ending warning answers that: before the case starts, HaX names the loose end ("You never read his sheet. It's on the bench upstairs.") and "[Not yet. I want to finish something.]" lets the player go and read it. The sheet now scores, and the player is told so in time. That is better than this plan's P3 items 1–3, which are withdrawn (W6 updated).

**What stays.** On `margin_note_read`, his concession to the sharper button ("*pause* I knew.", tesseract.ink:545 arm at 87dbe9db) gains, as an inline `{margin_note_read: …}` (the arm also opens on `asante_confirmed_sheet`), a second line, "Two thousand one hundred. Her figure. I knew that too." (no cue on the number line, CONTRACT §5.6). The decode is the workshop's one encoding exercise, and this is the one place the number the player decoded comes back. One voiced line; no audio yet.

### P4. Exchange 3's Tomb Alpha answer quotes the sheet's plain lines ✅ keep (F4)

**Change** (tesseract.ink:765): "[Your Tomb Alpha notes say carry it. They never say hand it on.]" becomes an answer drawn from the plain lines every m09 player who opened the sheet read ("A lock that expects you is a lock you cannot fight. Build the door before the room.", m09 erb:2264). [r1 R10] The plain lines are about preparing, not about who carries the hurt, so the seed leans on what an opener also saw, the sheet's instruction to the students, "For session three, decode": "[Your Alpha notes made students decode it themselves. Now you'd do it for everyone.]" (14 words; CONTRACT:614 caps choices under fifteen). His reply "I was younger. I meant it then." still fits. The dialogue phase owns the final words. Unvoiced button. The gate stays as it is.

**Alternative, not taken.** An m09 export for a confirmed decode. m09 has no point where the decode is checked (the line is never typed anywhere), and m09 is mid-loop, so a new export would be invented there to serve m10.

### P5. The cracker rack is evidence the card needs ✅ keep (F5)

**Story logic.** Kowalczyk's lie is in the player's pocket. Seeing the rack is what makes the line the player's own.

**Change.**
1. New JSON global `cracker_rack_seen` (false), declared in `globalVariables` and as a `VAR` in `m10_carryover_vars.ink`. HaX mapping: `object_interacted`, `data.objectName === 'Cracker Rack' && data.roomId === 'workshop_floor' && !globalVars.cracker_rack_seen` → `setGlobal: { cracker_rack_seen: true }`.
2. kowalczyk.ink:236: `{workshop_entered}` becomes `{cracker_rack_seen}`. Without it, card 4 offers only the stonewall, as card 2 does without the bench log (kowalczyk.ink:220) [r2 n4].
3. The player's cracker (erb:1329-1342) gains first `observationVariants` entries on `globalVars.cracker_rack_seen === true`, one per existing provenance variant (erb:1334-1337), each keeping her quoted words and adding: "Inside the battery door, where his bench puts its batch sticker, there's a clean square where one was peeled off." (new S6 string, §1.10; r2 n3: her words are the other half of card 4). The author with a motive is Kowalczyk, hiding where it came from. It also gives a player on `taken` or `double_crossed`, where the whodunit is off, a quiet confirmation.

4. [r1 R8] A pointer, because without it an unlooked-at prop becomes a one-shot loss of the crack: HaX's bench-log text (erb:1808) gains a second text on `clue_bench_log && !cracker_rack_seen && whodunit_live && accused === ''` (once, `delay` 3500, `skipIfGlobal: cracker_rack_seen`): "Have a look at that rack in the corner bay." Unvoiced. [r2 n2: 6000 ms collided with erb:1809's "three things" text; the rack is in the SE bay (ROOM_DRESSING.md:51); the text points without concluding.]

**Cost.** One global, one mapping, one variant, one text, one ink condition (unvoiced button). The crack's "It was a good cracker." (kowalczyk.ink:251) lands harder for a player who has opened the battery door.

**Dependencies.** None.

### P6. Fonoti stands down when he has, not when his name is known ⚠️ optional, nit (F6)

**Change.** New global `lock_guard_stood_down` (declared in `globalVariables` and as a `VAR` in `m10_carryover_vars.ink`, since Fonoti's ink writes it; r2 n5), set by the code card's `onPickup` and the net at erb:3714 (alongside `lock_guard_known`), and by Fonoti's "[Vos sold you out.]" pick (fonoti.ink:43-46). His challenge's `skipIfGlobal` (erb:3708) reads `["lock_guard_challenged", "lock_guard_stood_down", "outer_lock_open"]`. `lock_guard_known` keeps its other jobs (his pointer bark, erb:3718). A rota reader then gets the challenge if they crack in his cone, with the same free "Shift change" pass (W2). That's the scene the drawn cone promises.

**Cost.** One global, three writes (the card's `onPickup`, the erb:3714 net, Fonoti's Vos pick), one list. Unvoiced. [r1 R11: the dialogue round in progress gates Fonoti's card picks on `not outer_lock_open`; re-cite fonoti.ink against it.]

### P7. Escaped Victoria counts the guards right ⚠️ dialogue phase, nit (F7)

victoria.ink:111, 113: "which of these two" becomes "which of them". Two voiced lines (no audio yet). Update MC §3.5, arc, SE and S6 §2.4's copies in the same pass.

### P9. HaX's camera answer matches the isolator ⚠️ nit (F10)

phone:759 at 87dbe9db, in `cut_breakers`: "Fourth one along. Throw it as well. Their monitor up there just went dark." becomes a toggle line, e.g. "The painted toggle under the row. Down. Their monitor up there just went dark." One voiced line, no step change (CONTRACT §11 E-m10 declined the label row and HaX's step change). The isolator's existing NPC-cut variant ("a smaller switch thrown the other way") stays.

---
## 6. What could break

- **Solvability (P1).** Every save still has a way to cut the shutter. Default: Wendell is told (he cuts), worked round or knocked out (`cut_by_hand`, erb:1679, 1683; closing his chat without a pick counts as worked round, because his entry knot writes `avoided` first, wendell.ink:22-24). Captured Voltage: koImmune, both of his options cut. Escaped Voltage: the print or the talk-down (he cuts), or a fight or a knock-out (`cut_by_hand`). In every `cut_by_hand` case a voice rings (erb:1688, 2272, 2288) and re-rings on entry. A player who walks through without talking meets the gallery stair's third bark (erb:1730) and P1's new `where_are_we` rung. No new softlock. The hub's ten-choice cap (OT §4.9 note) gets easier: the topic shows on fewer saves.
- **Solvability (P2).** Before step 2 a click on the isolator only barks or opens the voice's call (87dbe9db's SD m3 mappings); only the step-2 click pulls, so it can't skip a voice. Every voice reaches step 2 by its existing buttons, and `cut_step` is a JSON global, so a reload, a reopen or a re-ring keeps it (the voices route on it: phone:681-688, vance.ink:16-27, voltage.ink:113-135). A player told the breaker in another room walks back and clicks: intended.
- **S7, the re-ring (P2).** HaX's one-time `conversation_closed:agent_0x99` re-ring (erb:1690) would fire as soon as her call ends at step 2. P2 item 5 guards it with `cut_step !== 2`. The `room_entered:power_room` re-rings at step 2 repeat the instruction, which is what a player who left without pulling needs.
- **Reading order (P2).** [r1 R2] The mapping always runs before the read resolves its text (interactions.js:712), so the pulling click shows the new by-hand variant. The camera arm follows `gallery_camera_blinded`, which the call writes when asked.
- **Event order (P2).** [r1 R1] `setGlobal` keys fire their change events in object order (npc-manager.js:808-817); `cut_step: 3` goes first, or the Vance and Elena `cut_done` calls (gated on `cut_step === 3`) never ring. The browser proof checks the Vance call arrives.
- **The fight route (P2).** [r1 R4] On escaped Voltage's fight, the cut used to be phone taps anywhere; now the pull is at the isolator with Voltage, and Static on his branch, hostile in the room. That is a difficulty change, accepted: the fight is the player's pick ("[Step away from the board. Now.]"), he answers "Then be quick about it.", and fighting for the board is the scene. The fight route is in the browser proof.
- **Text count (P1, P2).** After both, each cut sends HaX's "Shutter's dead. The hall's next." once: on the NPC cuts, on her own talk-through, and after Vance's or Elena's `cut_done` call. The duplicate F1 found is gone.
- **S2, order (P5).** A player who accuses Kowalczyk face to face before looking at the rack reaches card 4 with only the stonewall. That records the same right accusation without the crack, as card 2 already does without the bench log (kowalczyk.ink:13-14, 220). The line accusation through HaX is untouched.
- **S2, order (P6).** A rota reader who goes to Fonoti first gets the card and the stand-down. One who cracks in his cone gets the challenge and the free pass (W2). A player holding Vos's or Ghost's code who types it in his cone is challenged the same way; the existing "Who gave out the code?" bark (erb:3719) is unchanged.
- **The argument (P3).** At 87dbe9db a non-reader lands exchange 1 only through slot 3 (`hard` or `clean`); the M1 warning and "[Not yet.]" cover that (W6). P3 adds one line inside the existing arm and changes no `exchange_1` value, so `landed_count()` is untouched.
- **KO routes and layout.** Untouched. No room, door or connection changes, so BFS positions and door parity can't move.
- **Validator.** P5 adds one global, P6 one more; both are declared and read. No new `item_picked_up` mapping.

---

## 7. Dialogue implications

Phone lines of 25 words or fewer, HaX unprefixed in her own thread, voiced calls with no narrator and no printed variable (CONTRACT §4). The new and changed lines:

| Item | Speaker | Line | Voiced |
|---|---|---|---|
| P1 | HaX (hub) | "The shutter's on whoever runs that room. Talk to them first." / "The shutter's ours now. Ask me and I'll talk you through it." | no (hub text) |
| P2 | HaX, Vance, Elena (calls); Voltage (in person) | each voice's step-2 instruction to go and pull the breaker (four lines) | yes, four |
| P2 | HaX | "That's the shutter. It's dead." leaves her call; the existing text covers it | removes one |
| P2 | Vance, Elena | the existing success lines move into a one-line `cut_done` call each | yes, moved, not new |
| P2 | Voltage | "That's it. Shutter's dead. You'll want to say you did it alone. You did." moves to a bark | becomes a bark |
| P2 | isolator | two pull variants (S6 §1.5) | no |
| P3 | Tesseract | after "*pause* I knew.", "Two thousand one hundred. Her figure. I knew that too." | yes, one new |
| P9 | HaX | "Fourth one along. Throw it as well." becomes a toggle line, e.g. "The painted toggle under the row. Down. Their monitor up there just went dark." | yes, one reworded |
| P4 | player | the Alpha button | no |
| P5 | the cracker | the battery-door variant (S6 §1.10) | no |
| P7 | Victoria | "which of them" ×2 | yes, two reworded |

m10 has no audio yet, so none of these costs a clip now. The dialogue phase owns the final wording of P2's instructions, P3's button and P7; the seeds here only fix what each line has to do. Each P2 instruction should be one line that names the key, the breaker and the pull, so the click is the next thing the player does.

---

## 8. Pacing

- **Acts against depth.** Act 1 is all at depth 0: the briefing, the door scene, flag 1 at the gate terminal, the split and Arakawa's call (erb:1617-1636). It's the longest stretch in one room. The table's readables give the VM's wait something to do, and one of them, the sign-out sheet, pays off two rooms later. Act 2 runs depth 1 to 5 at a beat a room: the tunnel post, Ghost's handset, the bench, the cut, then flags 2 and 3 and the console. The turn is HaX's `gallery_open_call` at the hall's east door (erb:1732), then the jam and the silence on the walkway. The climax is at depth 7, and the resolution cuts back to depth 0 as a scene (06:00).
- **Returns.** Few, and all optional: the fitter's locker (workshop → office), the sign-out sheet (HaX reads it on the line, so no walk), the shutter skipped on the way through (hall → power room), the rota's name carried from depth 2 to the walkway. A finale that runs straight at the core is the right shape; the long arcs (rota → Fonoti, Ghost's code → the lock, the casualty sheet → Voltage, Asante and the core) carry the memory without the walking.
- **Empty rooms.** None. Every room has a scene, a readable that matters and at least one choice.
- **Hands-on beats on the critical path.** Before P2: the cracker at the outer lock, and the power-room door when the player picks the locker or a clone. After P2, the by-hand cut joins them on every save where the player takes it.
- **VM weave.** Each flag opens something in the room: flag 1 the breach and the door log's read (erb:1617-1625, 2860-2866); flag 2 the schedule, the console's controls, the backdoor task and Victoria's call (erb:1698-1708, 2257, 3529, 3545); flag 3 the gallery stair; flag 4 his case and the file index. No flag is a detour.

---

## 9. Capability arc

| Mission | Grants | m10's use |
|---|---|---|
| m01 | Lockpicks; Base64 | The fitter's locker for the power-room card, under the duty guard's patrol (optional). Base64 on the margin strip, into CyberChef (optional) |
| m02 | PIN cracker (rationed) | Kowalczyk's own, issued at the briefing or in Helena. It's the floor on both PIN locks (unlimited tries, Mastermind feedback), and it's evidence: card 4 against her (P5 makes the player find that) |
| m03 | RFID cloner | Gary's or Imran's power-room card, copied in conversation (optional, EM4100). The easiest clone of the season, after m09's MIFARE key attack; here the cost is the decision, not the clone |
| m04 | Fingerprint kit | The keypad plate's digits on every save; Voltage's thumbprint on the bypass against Albion's on the escaped branch (the stand-down) |
| m05–m08 | Evidence as leverage; checking a record | The casualty sheet against Voltage, Asante and Tesseract; the payment against Helena's plans (m08 branches); Vector's cupboard code (m08 on-team); the three-room whodunit and its cards |
| m09 | Vigenère; the shortlist, the Alpha tapes, the notice, the memo | Vigenère isn't used (W4). The rest land: the shortlist as the alibi clue at the aside, the Alpha tapes as Quintero unhurt and a record answer, the notice and the memo in exchanges 2 and 3 and the database beat |
| **m10** | **Nothing new; the finale spends the kit** | — |

**Earlier decisions that open routes here** (the user's question, answered from the code): m02's Ghost deal (cupboard code, outer-lock code, Fonoti's name, or a sale to stop at the console); m02's Gary (consultant pointing to Imran, or a technician to talk round or copy); m03's Victoria (opens the lock, sells the raid, or names the guard; Vos's secret from the arrested branch); m04's Voltage and Vance (who runs the power room and whose voice cuts it); m06's freeze (the gate hut dark, one guard fewer in the office); m07's Mercer and team assignment (who's in the hall, the backdoor task and the partial release); m08's Nightshade, Vector and Phantom (the door scene, the override, the tether, the cupboard code, the accusation list); m09's offer, shortlist, tapes and notice (whether there's a whodunit, the alibi clue, Quintero's shoulder, the record answers). Each comes back as a route, a cost or a line, and the credits read most of them.

**For a Season 2** (no VM content): the cloner was last spent at its easiest. If the kit carries over, a Season 2 opener can show the wall for a card that can't be read in conversation.

---
## 10. Withdrawn and considered (don't re-propose)

- **W1. The cracker makes the outer lock's other routes optional.** Kept. [r2 briefly proposed P8, a password keypad, after E-m7's firm option; 87dbe9db decided "the outer lock stays a PIN lock" and added T-59 instead (CONTRACT §11 E-m7). No new play reason beyond E-m7's own, so P8 is withdrawn and the ruling stands.] The cracker is Kowalczyk's, issued in the story, and it's evidence against her. With unlimited tries and Mastermind feedback (pin-minigame.js:42-45) it turns the lock into a short deduction, as m09's plan asked of m10's PIN locks. The plate cuts the search to four digits, and every earned code saves the time and carries a story (who opened the door for you). Over-redundancy (skill 3c) is per save, not per file: each save sees the cracker, the plate, the rota route and one or two branch routes, and each costs something different.
- **W2. Fonoti's "Shift change" is a free pass.** Kept (C-07; CONTRACT §1.5, fonoti.ink:57-78). The drawn cone gives the walkway its tension, and a fight with a 140-HP slugger at the season's last lock would run against "minigames should be fun and educational, not hard" (AGENTS.md). P6 only makes the challenge happen when it should.
- **W3. Make the whodunit required.** No. It carries consequence without a gate: WREN at the core, Quintero's shoulder, the cards and C18, the credits (tesseract.ink:972-998; erb:604-616). Skill Step 1: story threads get consequence and score, not `concludeRequires`.
- **W4. A Vigenère lock, as m09's plan §9 item 1 suggested.** Dropped. No object in the bunker has an author with a motive to Vigenère-encode it. Asante's strip is meant to be read by "whoever checks his sums", and Base64 is the right weight for that. Tesseract hides nothing from the agent he invited. Inventing one would be a chain built to match m09's pattern (skill 3d).
- **W5. Gate Victoria's "Zero Day's order has your name on it" on reading the schedule.** Dropped. She says it herself in her opener ("Zero Day sent me to collect at four", victoria.ink:44), and HaX's gallery call names the move (phone:658-660). The button asserts nothing the player hasn't heard.
- **W6. Gate exchange 1's rebuttal on the sheet and leave the unread player without one.** First dropped for P3; then 87dbe9db applied it as SD m4 with the M1 ending warning, which tells a non-reader about the sheet and offers "Not yet" before the case. With the warning, the concern is answered. P3 items 1–3 are withdrawn.
- **W7. The model terminal sits beside its own clue.** By intent (erb:3116): the decode is the step, and a bench terminal belongs on the bench.
- **W8. The tripwire's ladder is a one-click, same-room way round.** Kept. It's the table's consequence (the alarm, Kowalczyk warned, the guards quicker; erb:1644-1647, 2735), not a puzzle, and HaX's call explains it in one breath (phone:636-639).
- **W9. `use_the_console` can't complete when both shares were stopped before the first console use.** Not counted. It needs the player to climb to the gallery, deal with Victoria or Vos, and come back down before opening the lock. The task is optional and true ("kill one share, or trace one": there was nothing to do).
- **W10. The door log's `!flag1_submitted` variant is unreachable** (flag 1 precedes the breach; erb:2860, 2864). Harmless.

---

## 11. For the user (VM questions, not reasoned about here)

1. Flag 2 is "the staging schedule". In the game, the schedule terminal names Zero Day's collector (V. STERLING or P. VOS) and the backdoor batch (erb:3547-3562). Victoria's confront button and HaX's "Show her the order" lean on that. Does the VM's staging copy say the same? If it says something else, the two halves disagree.
2. Flag 1 makes the core-level door log readable in the security office (erb:2850-2871: 02:10, service door, D. MALHOTRA, and the m09 double-cross and taken variants). If the VM's monitoring host also has a door log, does it agree with the game's?
3. F9 from alignment (the built box's hostnames and flag values, and which station takes which flag) is still with you, unchanged.

---

## 12. Done when

- P1 in the ink, compiled. `tagdiff` shows one changed choice condition and two text lines in `m10_phone_agent0x99.ink`. `reopencheck` for `agent_0x99` at 0 problems; `loopcheck` on `support_hub` clean.
- P2: the mapping, the isolator variants and `addToNotes: false` in the ERB; the four voices' step 2 changed; Vance's and Elena's `cut_done` knots with their mappings; Voltage's bark; HaX's re-ring guard. `tagdiff` shows the `cut_step`/`gallery_shutter_cut` writes removed from four knots, the new `cut_done` knots in Vance's and Elena's files and the step-2 stitches, and nothing else structural. Validator clean.
- P3 to P5 in place; P6 and P7 if taken. CONTRACT §11 gets a "puzzle chains" block, and the rows P1 and P2 make stale are corrected: CONTRACT.md:172 (the topic's gate), :388 (`phone_voice_is_hax`), :566 (the `cut_call` re-ring row), :177 and :274-282 (§1.6's cut-shape table, which still prescribes "[Pulling it.] → cut_step = 3, gallery_shutter_cut = true"), :390 (add the isolator mapping as a `cut_step` writer), texts/BARKS_AND_TEXTS.md:62-63 (T-28a/b, the merged text) [r2 m7], and :1117 ("nobody else can cut while he stands", false at HEAD and true after P1) [r1 R13]; S6 §1.5 and §1.10 get the new strings; §5.4 gets P3's note.
- **Browser proof** (AGENTS: fix claims need live proof), on the keyless server:
  - cold start: enter the power room and check HaX's hub has no shutter topic; work Wendell round; take HaX's call to step 2; click the isolator; one "Shutter's dead" text; the gallery stair opens after flags 2 and 3;
  - escaped Voltage (m04 `voltage_escaped`, no Vance, no Elena): no shutter topic before the scene; the print stand-down still cuts; the fight route, with Voltage (and Static) hostile, then HaX's talk-through and the click at the isolator;
  - Vance ally: his call to step 2, leave the room and come back (the resumed re-ring lands on step 2's menu, not "(Put the phone away.)"), click, his `cut_done` call arrives, then HaX's text;
  - captured Voltage "[I'll do it.]": his step 2, the click, his bark;
  - a reload at `cut_step` 2, then the click;
  - the whodunit face to face in the workshop with and without the rack looked at (card 4 present / stonewall only), and HaX's rack pointer after the bench log;
  - the core's exchange 1 on a decoded save (P3's line);
  - P2 item 6: on a by-hand save a click at step 0 or 1 opens the voice's call and a click at step 2 pulls; no Wendell bark on a captured save; no bark from a knocked-out escaped Voltage;
  - P9: HaX's camera answer names the toggle.

---

## 13. Status at 87dbe9db [r2 M1; final pass]

SCENARIO_DESIGN_REVIEW_R1.md (SD), FINALE_EDUCATIONAL_REVIEW_R1.md (E) and the dialogue review ran alongside this plan, and 87dbe9db applied their fixes. Each finding re-checked there:

| Finding | Status at 87dbe9db | Lines at 87dbe9db |
|---|---|---|
| F1 (major) | **Open.** The topic's gate is unchanged. The dialogue round's new `where_are_we` rung ("The shutter. Whoever runs that room, or you by hand.") now also promises the by-hand route before the scene; P1 replaces it | phone:88; phone:139-140 |
| F2 (minor) | **Partly met.** SD m3 makes a click on the isolator start the talk (a bark before the scene; the voice's call once the cut is by hand). The pull is still the "[Pulling it.]" button in all four voices, and the isolator still copies to notes. P2 finishes it and guards SD m3's mappings at step 2 | erb:1704, 2294, 2312 (SD m3 calls); erb:3243, 3304 (barks); erb:3333-3355 (isolator); phone:761, vance:75, elena:80, voltage:192 |
| F9 (minor, new) | **Open.** SD m3's barks: a hidden Wendell barks on captured saves; a knocked-out escaped Voltage barks. Fix in P2 item 6 | erb:3243, 3304 |
| F3 (minor) | **Mostly closed** by SD m4 and the M1 warning (P3, W6). Remainder (the decoded figure) is a nit | tesseract:545-558 |
| F4 (minor) | **Open** | tesseract:813 |
| F5 (minor) | **Open.** Card 4 still on `workshop_entered`. E-m7's T-59 ("Her cracker came off his bench…") fires on `sleeper_caught`, set by an accusation or, on m09 `taken` saves, at the briefing (whodunit off). Either way it doesn't pre-empt card 4 (the uncommitted SD R2 round also gates it on `workshop_entered`); no conflict with P5 | kowalczyk:236; erb:1824 |
| F6 (nit) | **Open** | erb:3735 |
| F7 (nit) | **Open** (the dialogue round restructured the block but kept "which of these two") | victoria:121, 124 |
| F8 / P8 | **Withdrawn.** 87dbe9db decided the outer lock stays a PIN lock and added T-59 (CONTRACT §11, E-m7). W1 stands | erb:3991 |
| F10 (nit, new) | **Open.** HaX's camera answer says "Fourth one along. Throw it as well."; the isolator's cut variant says "a smaller switch thrown", and Vance, Elena and Voltage say a painted toggle under the row. 87dbe9db declined E-m10's label row for exactly this clash, so HaX's line is the odd one out. P9 | phone:759; erb:3344 |

## 14. Review log

| Round | Reviewer | Blocker | Major | Minor | Nit | Outcome |
|---|---|---|---|---|---|---|
| 1 | fresh general-purpose (Opus), read-only | 0 | 1 (R1) | 7 (R2–R8) | 5 (R9–R13) | All accepted. R1 (setGlobal order) and R2 (click event before the text) checked by me at npc-manager.js:808-817 and interactions.js:712. F1, F3–F7 confirmed; F2 regraded major → minor. P2 reworked (event order, state-tense variants, the resume exit, Voltage's quiet flag, the fight route owned in §6); P3 item 3 and the cue fixed; P4 seed changed; P5 gains a pointer; P6 count; P1 merged with the in-progress dialogue rung; CONTRACT rows added to §12; base-tree note. No §10 item reopened |

| 2 | fresh general-purpose (Opus), read-only | 0 | 1 (M1) | 7 (m1–m7) | 9 (n1–n9) | All round-1 fixes confirmed in the engine (key order, click before text, resume routing, the delayed re-check). M1 accepted: §13 reconciles P2 with SD m3 and E-m10, sets P3 against SD m4 for the user's ruling, constrains E-m7's text, and takes E-m7's firm option as P8 (W1 withdrawn; reversed in the final pass: P8 withdrawn after 87dbe9db's ruling, W1 kept). m1–m7 and n1–n8 folded in. n9 (six_oclock.ink:227's escaped `by_hand` arm is unreachable) is pre-existing and left for the dialogue phase |
| 3 | fresh general-purpose (Opus), read-only, confirmation against 87dbe9db and the committed HEAD after it | 0 | 0 | 6 | 5 | Signed off. §13's statuses confirmed at HEAD (F1, F4–F7, F9, F10 open; F2 partly met by SD m3; F3 mostly closed). All six minors and five nits folded in: P9 given its own entry and checks; §6's exchange 1 line rewritten for SD m4; F9 marked "if not already in" with the SD R2 drift noted; Elena's quote; P2's item order; counts. An earlier round-3 attempt was cut off by a usage limit and is not counted |

Measured against m01_first_contact and m02_ransomed_trust. Reviewed: 3 rounds. Open in the plan at the end of round 3: 0 blockers, 0 majors, 0 minors. The game defects in the Counts line stay until P1–P7 and P9 are implemented.
