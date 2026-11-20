# m10 Full Disclosure: puzzle chains, round 2 review

2026-10-22. Phase 2, round 2, on HEAD 1625879bc ("scenario design R2, dialogue R2, puzzle chains R1 and playtest R1 fixes"), run with `.claude/skills/mission-puzzle-chains/SKILL.md`. Read-only: the only file written is this one. Scenario design R3 and dialogue R3 were reading m10 at the same time, so their findings may overlap with the nits here.

**Method.** I traced P1 and P2 by hand through `scenario.json.erb` mappings, the ink and the engine (`interactions.js:697-716`, `npc-manager.js:575-630`). The eight touched ink files were recompiled to scratch with `bin/inklecate`: 0 warnings, and each matches the committed JSON. `room_depth.py` and the validator (`--skip-ink --no-graph`) were run again. No VM plan, SecGen file or field guide was opened. VM flags are treated as black-box submissions.

**Counts: 0 blockers, 0 majors, 3 minors, 6 nits.** Every round-1 finding is resolved or closed by a ruling (§1). All three minors are small and come from the fix round: a text that lands on top of another one (P5), one rung of HaX's ladder on the captured-Voltage save (P1), and contract rows that still describe the old cut (P1, P2).

---

## 1. Round-1 findings: status

| Finding | Status | Evidence at HEAD |
|---|---|---|
| F1 (major) shutter topic goes round the room's scene | **Resolved** | The topic needs `cut_by_hand` (phone:89). `cut_by_hand` is set only by Wendell's walk-away or close (wendell.ink:57-60; erb:1700), a KO (erb:1696, 1699) or Voltage's fight (voltage.ink:273-275). Escaped Voltage's print, sheet and fight now all play before HaX can offer the cut. The double "Shutter's dead" is gone: HaX's in-call line was removed, and the one text fires on every cut (erb:1714) |
| F2 (minor) the by-hand cut never touches the isolator | **Resolved** | The pull happens on a step-2 click (erb:1716), and all four voices end on "[Going to it.]" plus an instruction, with no writes (phone:775-777; vance:76-81; elena:81-86; voltage:193-197). `addToNotes: false` (erb:3367). State-tense variants come first (erb:3372-3373, 3379-3380) |
| F3 remainder (nit) the decoded figure in his concession | **Not taken.** CONTRACT:1206 calls it "withdrawn in the plan", but the plan's §1 table and §5 P3 "What stays" still list it. See n4 | tesseract.ink exchange 1 unchanged |
| F4 (minor) Tomb Alpha button quotes a decode | **Resolved** (wording nit, n5) | tesseract.ink:813 |
| F5 (minor) card 4 on entering the room | **Resolved** (new timing minor, m1) | kowalczyk.ink:238 `{cracker_rack_seen}`; erb:1845 sets it from a click on the rack. Observation-only objects are interactable (`rooms.js:372`) and fire `object_interacted` on a click (`interactions.js:712`) |
| F6 (nit) reading his name stands Fonoti down | **Resolved** | skip list erb:3766; writers erb:3758 (onPickup), erb:3772 (net), fonoti.ink:49 |
| F7 (nit) "which of these two" | **Resolved** | victoria.ink:121, 124 "which of them" |
| F8 / P8 | Withdrawn in round 1 (E-m7 ruling). Not reopened | — |
| F9 (minor) bark gaps on the isolator | **Resolved** | Wendell's bark now needs `!m04_voltage_captured` and `cut_step !== 2` (erb:3266). Escaped Voltage's needs `voltage_outcome !== 'ko'` and `cut_step !== 2` (erb:3329) |
| F10 (nit) HaX's "fourth one along" | **Resolved** | phone:772 "The painted toggle under the row. Down." |

### 1.1 The six traces the brief asked for

1. **Shutter topic gated on `cut_by_hand`.** phone:89. On a cold start, HaX's hub has no topic until Wendell is worked round, closed on or knocked out. The ladder's two new rungs (phone:140-150) are right on the default, escaped and Vance/Elena saves. One gap remains on captured Voltage (m2).
2. **Isolator pull at step 2, each voice.** One mapping on `agent_0x99` (erb:1716), with no voice term and no `!hax_jammed`, so it serves all four voices. `cut_step: 3` is written before `gallery_shutter_cut`, so Vance's and Elena's `cut_done` (erb:2311, 2331, `cut_step === 3`) see 3. The click event fires before the read resolves (`interactions.js:712`), so the pulling click shows the "where you pulled it" text. Per voice:
   - *HaX*: step 2 → "[Going to it.]" → instruction → "[Got it.]" (phone:775-777, `hax_close_got`). After the pull she sends one text (erb:1714).
   - *Vance and Elena*: "[On it.]" goes back to `cut_2_menu`, so a resumed re-ring (erb:2313, 2333, `resume: true`) lands on step 2's choices, not on "(Put the phone away.)". After the pull, `cut_done` rings at 1.5 s and HaX's text follows at 2.5 s.
   - *Captured Voltage*: works without `cut_by_hand`, because the pull mapping keys only on `cut_step`. His bark fires on `voltage_outcome === 'by_hand'` (erb:3308).
3. **`cut_step` guards and barks.** All three isolator→`cut_call` mappings carry `cut_step !== 2` (erb:1708, 2315, 2335), and so do both barks (erb:3266, 3329). HaX's close re-ring carries it too (erb:1709). Registration order doesn't matter at step 2: every other isolator handler also needs `!gallery_shutter_cut`, so whichever runs after the pull is false, and whichever runs before it is already false on `cut_step`. Clean.
4. **Captured-Voltage departure.** voltage.ink:193-197: the instruction, then `volt_quiet = true`, `#exit_conversation`, `-> cut_in_person`. The post-exit divert eats `volt_quiet` and parks on `cut_p2.cut_p2_menu` (voltage.ink:113-125). A re-talk therefore lands on the step-2 menu, whether the engine resumes saved state or re-enters at `captured` (which routes on `voltage_outcome == "by_hand"`, voltage.ink:47-49). Every other exit in the file already works this way. Correct; it departs from the plan's wording, and CONTRACT:1200 records that.
5. **`cracker_rack_seen` and the sticker variant.** It is declared in the include (carryover:211) and in `globalVariables` (erb:4303). The three new first variants (erb:1345-1347) keep each existing provenance quote and add the peeled square. Card 4 offers only the stonewall without it, the same as card 2 (kowalczyk.ink:221, 238). The pointer T-62 (erb:1846) is the timing minor (m1).
6. **`lock_guard_stood_down`.** Declared in both places (carryover:212; erb:4317). It is written by the card's `onPickup`, by the pickup net and by Fonoti's Vos pick. Every other `lock_guard_known` writer (rota erb:2952, Ghost, Victoria, Vos) now only names him, so the cone means something. A Vos-card holder who never talks to him is challenged in the cone; plan §6 accepted that, and it is not reopened. His pointer bark (erb:3776) still reads `lock_guard_known`, which is right: it fires only for a player who doesn't know whose card it is.

---

## 2. New findings

### m1 (minor). The rack pointer lands 2 s after the bench-log text, so the toasts stack

erb:1843 sends "That's a cloner in our own breaching kit…" at 1500 ms on `clue_bench_log`. P5's T-62, "Have a look at that rack in the corner bay." (erb:1846), fires on the same event at 3500 ms. When all three clues are in, the "three things" text (erb:1847) follows at 6000 ms. The validator flags this (warning 49: "can send timed texts less than 4 s apart… the first is gone before it can be read"). The plan's r2 n2 moved T-62 off 6000 ms to avoid the third text and put it 2 s behind the first.

**Fix.** Set T-62's `delay` to 10000 (4 s after the 6000 ms text, 8.5 s after the first). `skipIfGlobal: cracker_rack_seen` already drops it if the player has looked at the rack by then. One number, unvoiced.

### m2 (minor). HaX's "[Where are we?]" tells a captured-Voltage player to "talk to them first" after they have

The rungs test `cut_by_hand` (phone:140, 142). On captured saves the by-hand route is `voltage_outcome == "by_hand"` (voltage.ink:88), which never sets `cut_by_hand`. A player who chose "[I'll do it. Talk me through it.]" and is standing at step 2 asks HaX where they are and hears "The shutter's on whoever runs that room. Talk to them first." The ladder is the game's "what next?" net (OT §5). Here it points away from the isolator that is now the next click.

**Fix** (unvoiced hub text, phone:140-150):
- first rung: `power_room_entered and not gallery_shutter_cut and not cut_by_hand and voltage_outcome != "by_hand"`;
- second rung: `… and (cut_by_hand or voltage_outcome == "by_hand")`, with the inner arms in this order: `cut_step == 2` → "Third from the left. Go and pull it."; `voltage_outcome == "by_hand"` → "He's talking you through it."; `phone_voice_is_hax` → as now; else as now.

### m3 (minor). The contract's reference rows still prescribe the old cut

Plan §12 listed the rows that P1 and P2 make stale. The §11 changelog records the change (CONTRACT:1198-1207), but the rows a fixer builds from are unchanged:
- CONTRACT:172: the `shutter_topic` gate has no `cut_by_hand`.
- CONTRACT:280: §1.6's step-2 row still reads "[Pulling it.]" → `cut_step = 3`, `gallery_shutter_cut = true`.
- CONTRACT:388, 390: the isolator mapping is missing from the `cut_step` writers. `gallery_shutter_cut` still lists Vance, Elena and HaX's `cut_call` as writers.
- CONTRACT:566: HaX's re-ring row has no `cut_step !== 2`. Vance's and Elena's rows don't mention `cut_done`.
- texts/BARKS_AND_TEXTS.md:62-63: T-28a and T-28b are still two rows with the old conditions; the build has one text (erb:1714). B-01 (:130) doesn't mention the captured guard.
- CONTRACT:1206 says it plainly: the S6 strings (isolator variants, sticker) are not in `lore_fragments.md` §1.5 and §1.10.

Why it is a minor and not a nit: §1.6 is "one shape in four places", and a later dialogue or playtest fixer working from it would rebuild "[Pulling it.]" and undo P2. No player-facing effect today.

### Nits

- **n1. The camera toggle is still flipped by a button while the breaker is now a click.** The four voices write `gallery_camera_blinded` in the answer itself (phone:770; vance:72; elena:77; voltage:189). The pulled-state text then says "the painted toggle thrown". It's a small mismatch in the hands-on beat P2 created. A cheap option: the answer sets a JSON flag `camera_toggle_told`, and a second pull mapping registered *before* erb:1716 (`cut_step === 2 && camera_toggle_told`) writes `gallery_camera_blinded: true, cut_step: 3, gallery_shutter_cut: true` in that order. A player who asks and never pulls then keeps a live camera. Optional; it moves a consequence (Haugen leaving, erb:3798-3799) onto the click.
- **n2. Wendell says nothing when the player pulls his breaker in front of him.** On `worked_round` he says "I'll be at the panel if anybody needs a breaker." (wendell.ink:62). When the player then pulls it beside him, nothing happens (his bark excludes `worked_round`, erb:3266). One bark on `global_variable_changed:gallery_shutter_cut` with `wendell_outcome === 'worked_round' && cut_step === 3`, such as "Your funeral. I didn't see a thing.", would land the choice. One voiced bark, dialogue phase.
- **n3. HaX's "Ring me when you're standing at it." is followed by her ringing back.** At step 0, "[Give me a minute.]" (phone:738) closes the call. The one-time `conversation_closed:agent_0x99` re-ring (erb:1709) then rings 1.5 s later. This predates round 1 and wasn't touched by it. Reword to "I'll ring you back at it." or similar (one voiced line), or leave it.
- **n4. P3's status is recorded two ways.** The plan keeps P3's remaining line ("Two thousand one hundred. Her figure. I knew that too.") as a live nit; CONTRACT:1206 calls it withdrawn. Pick one and record the reason in the plan's §10, so it isn't proposed again. The margin decode still pays only in wording plus an optional task. That is the one place where an earlier skill (Base64, m01) lands thinner than the rest of the kit.
- **n5. P4's button has an unclear "it".** "[Your Alpha notes made students decode it themselves. Now you'd do it for everyone.]" (tesseract.ink:813) answers "Somebody has to be the during. Better me." (:759), but the second "it" can read as "decode" or "hurt". Something like "…Now you'd do the hurting for everyone." ties it to his question. Unvoiced button; dialogue phase owns the words.
- **n6. A click on the isolator before talking to captured Voltage gets only the label.** Every other branch's pre-scene click barks or rings (erb:1708, 3266, 3329). Captured Voltage is cuffed in plain view and his opener offers both routes, so nobody is stuck. Plan P2 item 6 mentioned SD R2's suggested bark for him; it wasn't added. SD R3 can rule on it. If it is added, it needs `cut_step !== 2` and `voltage_outcome === '' || 'avoided'`.

---

## 3. The audit, run again on the current build

### 3.1 Headline numbers (room_depth.py, validator)

| | m01 | m02 | m09 | m10 at R1 | m10 now |
|---|---|---|---|---|---|
| Rooms / empty | 13 / 0 | 13 / 2 | 11 / 1 | 8 / 0 | 8 / 0 |
| lockType declarations | 12 | 15 | 11 | 9 | 9 |
| Max depth | 3 | 7 | 5 | 7 | 7 (`core`) |
| Hands-on beats on the critical path | — | — | — | the cracker; the power-room door when picked or cloned | the same, **plus the isolator pull** on every by-hand save |
| Optional deductions with a payoff | — | — | 4 | 6 | 6. The whodunit's card 4 is now earned by looking |

Validator: 0 errors. New warning 49 is m1. The rest are the round-1 set: story-door "nothing can open it", cutscene `onceOnly`, imported conditions, and warning 45's gallery-only `item_picked_up` mapping, which is harmless because the card exists only in Fonoti's hands.

### 3.2 Boss-key table

Depth is BFS from `forward_post`: tunnel 1, office 2, workshop 3, power room 4, hall 5, gallery 6, core 7. The verdicts match round 1 apart from the shutter row.

| Lock | Seen | Key from (depth) | Verdict |
|---|---|---|---|
| Blast door, story (erb:2643) | 0 | table scene, flag 1, Arakawa (0) | ✅ announced story gate, three inputs with a bark each |
| Inner door, story (erb:2758) | 1 | opens on entry; tripwire → ladder (1) | ✅ by design (the table's consequence) |
| Stair B, story (erb:3032) | 2 | Ghost's call (2) | ✅ story beat with a cost either way |
| Power room, RFID (erb:3246) | 3 | Imran talked round or a clone (3); fitter's spare by lockpick (2) | ✅ the player picks the tool |
| Records cupboard, PIN (erb:2938) | 2 | Vector (m08), Ghost (m02), cracker | ✅ by design, optional |
| Fitter's locker, key (erb:2977) | 2 | lockpick (0) | ✅ by design, optional |
| Model terminal, password (erb:3169) | 3 | margin strip + CyberChef (3) | ❌ same room by intent (W7), optional |
| **Shutter isolator** (story action, erb:1716) | 4 | the voice's instruction (4), once the room's owner is dealt with | ✅ **new beat**: talk, then walk to the cabinet and pull. Same room, because it is a scene, not a hunt. It turns a menu into a click |
| Gallery stair, story (erb:3671) | 5 | flags 2 and 3 (5); the cut (4) | ✅ boss-key when the player passes a live shutter (third bark sends them back) |
| Outer lock, PIN (erb:4022) | 6 | cracker (0), plate (6), rota→Fonoti (2→6), Ghost (2), Vos/Victoria (6) | ✅ by design (W1). P6 makes the cone a real risk for anyone who hasn't been handed the card |

### 3.3 Chain depth

Unchanged in shape, and slightly better. The cut now goes room owner → voice → cabinet. The whodunit's card 4 needs a third look in the workshop: bench log, sign-out sheet, rack. P5's pointer only nudges it. The required spine is still mostly story doors, with one Mastermind deduction at the outer lock. W1 and W3 settled that, and the finale's weight sits in the choices and the core argument, which is the right place for it.

### 3.4 Carry-over capabilities spent

| Kit | Spent in m10 | Change since R1 |
|---|---|---|
| Lockpicks (m01) | fitter's locker → spare power-room card | — |
| Base64 (m01) | margin strip → model terminal; pays in wording and a task | P3 not taken (n4) |
| PIN cracker (m02) | outer lock and cupboard floor; **evidence** | now earned: rack → sticker → card 4 → "It was a good cracker." |
| RFID cloner (m03) | Gary's or Imran's card | — |
| Fingerprint kit (m04) | keypad plate; Voltage's print on the bypass | — |
| m05–m08 evidence and records | casualty sheet, payment, Vector's code, whodunit | — |
| m09 (shortlist, Alpha tapes, notice, memo) | alibi clue, Quintero, exchange answers | Alpha answer no longer claims a decode (P4) |

### 3.5 Choices that matter

Re-read against the build:
- **Wendell, told or worked round.** Telling him costs Asante (`server_hall_warned`, asante.ink:16, 33) and saves Dale. Working round him now costs the walk to the cabinet, and only that route offers the camera. Both sides have a real cost, and P2 made the hands-on side feel like the player's own work. n2 would make him react to it.
- **Escaped Voltage: print, sheet or fight.** P1 restored this. It can no longer be skipped from HaX's hub. The fight route now ends at the isolator with him (and Static) hostile, a difficulty change the plan accepted.
- **Captured Voltage: his hands or yours.** His hands leaves the camera on ("I left it for you to see"). Yours gives the walk-through, the camera and his bark. Fine, apart from m2.
- **Fonoti.** Being handed the card is now different from knowing his name (P6), so the drawn cone carries real tension.
- **Whodunit.** Optional with consequence (W3). Card 4 is now evidence the player found.

Nothing here reopens a §10 withdrawal.

### 3.6 Bug sweep (skill Step 4)

| Check | Result |
|---|---|
| `item_picked_up:` keyed on id | None new. erb:3772 uses the type `notes` with `data.itemId` |
| Tasks with no completion route | `cut_the_shutter` (erb:1713) completes on `gallery_shutter_cut` from the isolator mapping, Wendell, Voltage's stand-down or his hands. Every by-hand save reaches step 2 by the voice's buttons |
| Author notes, code-stating observations | None new. The sticker variant states provenance, not a code |
| Stale geography | "the rack in the corner bay" (erb:1846) fits the SE bay in ROOM_DRESSING.md:51. "Third from the left" is the same in all four voices and the isolator text. "Grey cabinet by the door" matches. |
| Dead globals | `cracker_rack_seen` and `lock_guard_stood_down` are both read. None new |
| Compiled ink | Eight touched files recompiled to scratch: identical to the committed JSON, 0 warnings |

---

## 4. For phase 5 (browser only)

1. **Cold start, Wendell worked round.** HaX's hub has no shutter topic before Wendell is dealt with. Her call to step 2, then "[Got it.]" closes cleanly with no re-ring at step 2. A click on the isolator shows the "where you pulled it" text and one "Shutter's dead" text. The gallery stair opens after flags 2 and 3.
2. **Escaped Voltage fight.** The pull is reachable and clickable while Voltage (and Static) are hostile. Check the difficulty against "fun, not hard". The print and sheet routes still cut with no hub topic shown first.
3. **Vance ally.** Take the call to step 2 and "[On it.]", leave the room and come back: the resumed call lands on step 2's choices. Pull: `cut_done` rings at about 1.5 s, and HaX's text at 2.5 s arrives during or after the call without hiding it.
4. **Elena turned.** The same as 3.
5. **Captured "[I'll do it.]".** The instruction line shows before the chat closes. A re-talk lands on the step-2 menu, not the opener. Pull: his bark is readable.
6. **Reload at `cut_step` 2**, then the click pulls.
7. **Guards.** On a by-hand save, a click at step 0 or 1 opens the voice's call. A captured save has no Wendell bark. A knocked-out escaped Voltage is silent.
8. **Workshop.** A click on the Cracker Rack shows its text and sets the flag. Face to face, card 4 appears with the rack seen and only the stonewall without it. The bench-log texts don't stack (after m1). The inventory cracker shows the sticker.
9. **Gallery.** A rota reader cracking inside the cone is challenged and "Shift change" lets them through. After the handover, no challenge. After the Vos pick, no challenge.
10. **Core.** On an m09 Alpha-tapes save, exchange 3's Alpha button.
11. **After m2.** On a captured by-hand save at step 2, "[Where are we?]" names the breaker.

---

## 5. Severity log

| Round | Blocker | Major | Minor | Nit | Outcome |
|---|---|---|---|---|---|
| 2 (this) | 0 | 0 | 3 (m1–m3) | 6 (n1–n6) | Round-1 F1, F2, F4–F7, F9 and F10 resolved. F3's remainder not taken (n4 asks for one record). Nothing structural is left; the minors are a delay, a ladder rung and the contract rows |

Measured against m01_first_contact and m02_ransomed_trust.
