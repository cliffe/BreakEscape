# m07 The Architect's Gambit: puzzle-chains review, pass 5, cycle 1

Stage 2, `mission-puzzle-chains` rubric. Fresh reviewer, read-only. 2026-10-14.
Kind of game: a SAFETYNET campaign mission, a TV spy thriller. The VM flags are required and woven into the story, and kit is cumulative from m01–m06.

Everything below was checked against `scenario.json.erb` (cited `erb:N`), the ink (`ink/<file>:N`) and the engine. `PUZZLE_CHAINS_PLAN.md` was read only as background, and nothing is taken from it unchecked. I opened no SecGen XML and none of the four restricted field guides. I started no browser session and edited no file except this one.

## Checks run (outputs in the session scratchpad, `m07-puzzle-c1-reviewer/`)

- **Route driver.** r1–r12 all pass ("all expectations met").
- **Probe route** `p1_park_follows_hax_hint.json` (kept in scratch). It shows F1: the player does what HaX's text says, and Park swings anyway.
- **Validator** (`--skip-ink --no-graph`). Schema, geometry and doors pass. There are 4 warnings, all for the repeatable person-chats (Hollis's sight chat and Park's entry chat, both deliberate), and 3 credits-fallback suggestions. None needs action.
- **Room depth** (`room_depth.py`): 6 rooms and no empty ones. Depth 0 checkpoint, 1 ops floor, 2 server hall, 3 generator hall and control room, 4 cable vault.
- **Engine facts used below.**
  - The ending needs only `end_the_sequence`'s own tasks plus `concludeRequires`. A missed Mercer chat can't strand it (`game.rb` `check_aim_completion`, `check_mission_conclusion`).
  - A PIN pad allows 5 tries per opening, and earlier guesses are kept (`pin-minigame.js:6`, `:593`).
  - With no `behavior.hostile` block, a hostile NPC chases at 145 for 10 damage a hit (`npc-behavior.js:357-361`). The player walks at 150 (`constants.js:39`). `combat-config.js` `chaseRange` is read nowhere, so nothing limits the chase.
  - `#clone_keycard:<id>` clones an NPC's `rfidCard` in conversation (`chat-helpers.js:312-380`). A saved clone opens a matching RFID door (`unlock-system.js:478-481`, `:515`). `card_cloned` is emitted on Save (`rfid-minigame.js:292`; m03 latches on it).

## Chain map

```
START security_checkpoint (d0)
 ├─ Hollis: sight challenge (erb:1261-1271) ─┬─ talk ─ needs Shift Handover Sheet (ops floor, d1) ─► badge + vault rule + Park tip
 │                                            ├─ KO ── badge drops (erb:1012)
 │                                            └─ back off ─ walk past (evaded on server-hall entry, erb:970-975)
 ├─ Contractor Badge Station (PIN 0616) ◄──── Shift Handover Sheet (d1)  ─► printed badge
 └─ Audited Visitor Log (asks "who signed this off??"; the sheet answers)
        │
operations_floor (d1): Plant Maintenance Key + Shift Handover Sheet in one tray; RFID reader on the east door
        │  RFID: Hollis's badge | printed badge     (RFID Cloner carried; no card to clone — F3/m12)
server_room (d2): Elena, VM terminal, SAFETYNET relay
 ├─ VM flag 1 (NFS) ─► Relay Decode ─┬─ HaX deduction ─► projection_revised ─► redirect (window: 40 min or flag 3)
 │                                    ├─ vault RULE ("last four of the ATS-1 plate serial")
 │                                    └─ operator account name (from the VM; needs checking against SecGen by the user)
 ├─ VM flag 2 (listener) ─► Listener Capture ─► operator password + control-room door password
 ├─ VM flag 3 (login: name + password) ─► arms the 15-min clock, closes the redirect window
 ├─ VM flag 4 (root) ─► unlocks the Cascade Control System (erb:1650-1654)
 ├─ Elena: one conversation ─► projection_revised, the door password, the vault rule (all also elsewhere)
 │
 ├─ north: scada_control (d3), password ◄── Elena | flag 2 capture
 │     Mercer (stance only; gates nothing) · Signed Casualty Projection · Cascade Control System (abort = grid_saved)
 │
 └─ south: generator_room (d3), key ◄── maintenance key (d1) | lockpick (m01 kit)
       Maintenance Log (old code VOID, "reset by OptiGrid") · ATS-1 plate (the DIGITS)
       │  PIN ◄── rule (decode | Hollis | Elena) + plate digits
       cable_vault (d4): Park · trunk splice · Tomb Gamma · mole intercept (all optional)
            Park talk-down ◄── Signed Casualty Projection (control room, d3)   ← F1 breaks this on the return trip
```

Critical path for the ending: checkpoint → ops floor → (badge) → server hall → flags 1–4 → control room door (Elena or flag 2) → console abort → "Bring me in" (or the 9-minute fallback). The plant, the vault, Hollis's talk route, Elena, Mercer and Park are all off the ending's path. They carry consequence, credits and score.

## Boss-key audit

| Lock | Seen at | Key / code available at | Verdict |
|---|---|---|---|
| Contractor Badge Station PIN (erb:1421-1444) | d0 | Shift Handover Sheet, d1 (erb:1516-1527) | ✅ boss-key (seen, hunted next door, walked back) |
| Hollis, talk route (soft lock) | d0, by sight challenge | Handover Sheet's print-history line, d1 (`ink/m07_npc_ray_hollis.ink:84`) | ✅ boss-key |
| Server hall RFID (erb:1543-1546) | d1 (east door) | Hollis badge d0 (talk needs d1); printed badge d0 via d1; KO drop d0 | ✅ on the talk and printer routes; ⚠️ key-before-lock on the KO route (by choice) |
| Generator hall key (erb:1814-1819) | d2 | key d1 (erb:1482-1492); lockpick from start | ⚠️ key-before-lock for the key; ✅ *by design* for the picks (m01 capability). HaX's guide text names both (erb:1054) |
| Cable vault PIN (erb:1870-1873) | d3 | rule: decode (VM, d2), Hollis (d0), Elena (d2); digits: ATS-1 plate, d3 | ❌ same-room for the digits, ✅ for the rule. Tolerable because the vault is optional and the lesson is "a code you can read off the room isn't a secret" (erb:993) |
| Control room password (erb:1708-1711) | d2 | Elena, d2; flag 2 capture, d2 (VM depth) | ❌ same-room on the Elena route (see "Considered" below); flag-2 route is gated by VM work |
| Cascade Control System (erb:1755-1763) | d3 | flag 4 at the relay, d2 | ✅ boss-key (the walk back to the console is the payoff) |
| Park, talk-down (soft lock) | d4 | Signed Casualty Projection, d3 (erb:1797-1808) | ✅ boss-key in design, **broken by F1** on a return trip |

Headline numbers: 6 rooms, 0 empty, 5 locked rooms plus 2 locked objects, 4 VM flags all in `concludeRequires` (erb:557-564). The critical path is 3 doors and 4 flags.

## Severity table

| # | Sev | Finding (short) | Source |
|---|---|---|---|
| F1 | **major** | HaX's return-visit text sends the player for the projection; the next visit makes Park swing, so the talk-down can never be used | new |
| F2 | **major** | Hollis, Park and Mercer all fight at engine defaults (chase 145 against a walk of 150, 10 damage a hit) with no leash and no HaX combat text. Absorbs browser N2 | new + carried N2 |
| N1 | **major** | Debrief says Hollis "waited for the police" on the only route where he refuses and walks out | carried (browser) |
| F3 | minor | The RFID Cloner has nothing to clone, and it opens its minigame at the server door with no card to emulate | carried m12 |
| F4 | minor | HaX's vault hint ignores a rule already given by Hollis or Elena | new |
| F5 | minor | Elena KO text says "the vault code's in their site notes"; the notes give the rule, not the code | new |
| F6 | minor | Stale comments contradict the file (aim chain, "anything walk-past is optional", Elena "the vault PIN", the cloner) | new |
| C1 | minor | Informed commit elsewhere with the window open is read as passivity | carried |
| C2 | minor | A decode read before the commit isn't latched | carried |
| N3 | minor | Praise after "Nobody put it next to the brief" | carried (browser) |

**Counts: 0 blockers, 3 majors, 7 minors.** Majors: F1 and F2 are new (F2 absorbs N2), N1 is carried. Minors: F4–F6 are new; F3 (m12), C1, C2 and N3 are carried.

No soft-lock on the ending's path. Every required lock has two routes, and none of them can be burnt:
- the badge: talk, printer or KO;
- the plant door: key or picks;
- the control room door: Elena or flag 2;
- the console: flag 4.

The vault is optional. F1 is the only dead end, and it is on optional content (Park's best outcome).

---

## Major findings

### F1. Following HaX's Park hint makes Park unreachable by the hint
- **Evidence.**
  - Visit 1: `entry` → hub → "Nothing. I was never here." sets `park_resolved = "evaded"` (`ink/m07_npc_thomas_park.ink:111-117`).
  - Visit 2: the entry mapping (erb:1903-1907) opens `start` → `back_at_it` (visit count 1) → "Second time. There isn't a third." → hub (`:122-124`).
  - On the same entry, HaX's mapping (erb:996-1001, fires only while `park_resolved === 'evaded'` and the projection is unread) texts "Mercer's signed projection is in the control room. Show him that."
  - The player can leave the visit-2 hub only by evading again: the hub has no other exit (`:43-53`).
  - Visit 3: `back_at_it` takes the else-branch and goes straight to `goes_loud.swing` (`:125-130`), with no hub. So the projection choice (`:46`) is never offered.
  - Probe `p1_park_follows_hax_hint.json` plays exactly this and passes `notSaid: "Read this. It's the projection"` with `park_resolved = "ko"`.
  - The text fires only for a player who doesn't have the projection, and following it is what leads to the swing. HaX's hub `topic_park` (`ink/m07_phone_agent_0x99.ink`, "Put the number in front of him.") gives the same advice and has the same problem when it is asked between visits 2 and 3.
- **Why it matters.** Most players reach the vault before the control room: the plant needs a key or picks, while the control room needs Elena or flag 2. So this is the common case, not an edge. The mission's only boss-key soft lock (the vault encounter, the hunt in the control room, the return) breaks on the return. The talk-down is the one outcome that leaves "the transfer switch intact" (erb:228).
  - It came from two separate fixes: alignment r1 m4 moved the hint to the return visit, and r2 m7 made the third visit hostile.
- **Fix.** Make a third visit with the projection in hand a last chance, not an automatic swing.
  - Add a counter `VAR park_returns = 0`, incremented at the top of `back_at_it`. Branch on it rather than on visit counts, which also closes C5.
  - In `back_at_it`, for the third visit or later: `{casualty_projection_found: -> last_chance}`, otherwise the swing as now.
  - New `= last_chance` stitch. Narration "He comes up off his knees with the crimping tool in his fist, and waits." / Park "I said there wasn't a third. You've got one sentence." Choices: "(Hold up the projection.)" → `projection`, and "(Step back.)" → `swing`.
  - HaX's return text gains "He won't wait for a third look. Have it in your hand when you go back down." HaX's `topic_park` gets the same line.
  - Add `p1` as route r13, flipping its expectation to the projection being offered and `park_resolved = "talked"`. Add a reload variant (evade, re-enter, `"reload": "page"`, re-enter, fetch, re-enter) for the counter.

### F2. Every hostile in m07 fights at engine defaults (absorbs browser N2)
- **Evidence.**
  - None of Hollis (erb:1194-1283), Park (erb:1881-1929) or Mercer (erb:1719-1751) has a `behavior.hostile` block, so all three chase at 145 and hit for 10 (`npc-behavior.js:357-361`). The player walks at 150 (`constants.js:39`), so a fleeing player can't open a gap.
  - `chaseRange` isn't read (`combat-config.js:50` only), so a chase never gives up. In browser game 2409, Park followed the player out of the vault, through the generator hall and the server hall, and knocked them out at the control room door (`PASS5_ALIGN_R2_BROWSER.md` N2).
  - m07 has no HaX text on any NPC turning hostile, so the game never says how to fight. Compare m06's tuning of Kemal: 75 speed, 3 damage, and a HaX controls text (`scenarios/m06_follow_the_money/scenario.json.erb:2238`, log S1). m04's guard is 110 / 4.
  - All three fights can come early. Hollis turns at the start spot ("Walk at him" → "Put it down", `ink/m07_npc_ray_hollis.ink:198-217`). Park turns on visit 3 or on a single pick ("Then finish it and see what happens"). After F1's fix, the visit-3 swing is still the result for a player without the projection.
- **Why major.** A struggling player who picks the wrong line, or backs off Park twice, loses about 10 HP a hit to an NPC they can't outrun, and gets no instruction. A KO costs a restart in the start room (regression m-14), five rooms from the vault. This is the combat counterpart of the m06 S1 finding, which was rated major.
- **Fix** (mission-local, numbers in the m06/m04 range):
  - Hollis: `"behavior": { …, "hostile": { "chaseSpeed": 100, "attackDamage": 4, "pauseToAttack": true } }`. He's a guard in his mid-thirties, so a little slower than m04's 110.
  - Park: `"behavior": { "hostile": { "chaseSpeed": 80, "attackDamage": 4, "pauseToAttack": true } }`. He has a crimping tool, and he is tied to his job.
  - Mercer: `"behavior": { "hostile": { "chaseSpeed": 70, "attackDamage": 3, "pauseToAttack": true } }`. He's in his late fifties.
  - HaX: one text per NPC on the hostile latch, keyed on `global_variable_changed:hollis_resolved` / `park_resolved` / `mercer_fate` with `value === 'ko'` (the hostile marker each ink sets), onceOnly. For example: "He's coming for you. Q for your fists, then E or click when he's in front of you. Step back between swings. Or walk away: he's slow." Use the tutorial's own control wording, as m06 did.
  - Leave the cross-room chase as it is. With the speed under the player's, walking away now works, and the line says so.
  - Browser check owed: Park's chase from the vault, and the Hollis fight at the start spot.

### N1 (carried). The debrief misreports the Hollis talk route
- **Evidence.** `ink/m07_closing_debrief.ink:427-429`: "Ray Hollis walked to the muster point and waited for the police. He is giving a full statement, payment included. / He did not have to wait."
  - The only route that sets `talked` is `deal_take`. There he refuses to talk to the police ("I'm not saying anything to anybody", `ink/m07_npc_ray_hollis.ink:152`), the player's choice is "you go, and you keep going" (`:158`), and he "goes out through the muster door and doesn't look back" (`:183`).
  - "Wait here for the police" leads only to `deal_refused` (`:160-196`).
- **My view.** Major, as the browser check rated it. It contradicts what the player chose, on the route the mission rewards most. It's a one-line text fix with no structural change, so do it now rather than wait for the dialogue stage.
- **Fix.** "Ray Hollis handed over his badge and walked out through the muster door. The police picked him up at the gate. He has given his name and nothing else, yet." / "He told you about the vault and the man on the riser. That is more than he has told us." (The second line credits what only the talk route gets, `:177-181`.) The credit (erb:224) is already right.

---

## Minor findings

### F3 (carried m12). The RFID Cloner has nothing to clone
- **Evidence.**
  - The cloner is in the start kit (erb:275-281), and the comment says "Neither is needed here" (erb:271-274).
  - Because it's carried, the server-hall reader opens the cloner minigame for a player with no badge (`unlock-system.js:515-521`), with nothing saved to emulate. That is a dead screen at the mission's first real lock.
  - m03 granted the cloner, and m05 spends it on an NPC's lanyard (`rfidCard` + `#clone_keycard`, `scenarios/m05_insider_trading/ink/m05_npc_owen_gallagher.ink:241-246`).
- **Fix.** Make cloning the quiet way past Hollis. It is cheaper than the talk route and costs more in the story.
  - Hollis gets `"rfidCard": { "card_id": "server_zone_badge", "rfid_protocol": "EM4100", "name": "Server Zone Badge - R. Hollis" }`. His `itemsHeld` badge stays, so the KO drop and the talk handover are unchanged.
  - Add a hub choice gated on `pressed_once`: he has just said "there's a number in my account that says stand here" and is rattled (`:113-118`). The choice: "[Keep him on the money. Let the cloner read his belt.]" → new knot `clone`. It sets `~ hollis_backed_off = true` and `#set_global:hollis_backed_off:true`, then runs `#clone_keycard:server_zone_badge`. Narration on return: "He's still talking when you step back. He never looks at his belt." Then exit.
  - Scenario: a `card_cloned` mapping on `agent_0x99` (onceOnly) sets `badge_obtained: true` and texts the lesson once: "His badge never left his belt. Anyone who stands that close can walk off with a copy."
  - The existing server-hall mapping (erb:970-975) then records `evaded`. The debrief ("still at his post, and still on their payroll", `:431`) and credit (erb:226) already fit.
  - What it costs: no vault rule, no Park tip, and Hollis stays bought. Talk stays the best route, and the printer stays the paperwork lesson. That is four routes to one door; I checked this against the over-redundancy warning. It's acceptable because each route costs something different, and this one spends a capability the player earned in m03.
  - Rewrite the erb:271 comment. Add route r14: stakes → clone → `card_cloned` → enter the server room → `hollis_resolved = "evaded"`.
  - Browser check owed: the clone minigame returning to Hollis's chat, and the clone opening the reader.

### F4. HaX's vault hint ignores a rule the player already has
- `vault_hint` (`ink/m07_phone_agent_0x99.ink`, "PASS 3: the player is at the vault door") branches only on the decode. A player who heard Hollis ("He read the number off the plate on the transfer switch", `ink/m07_npc_ray_hollis.ink:179`) or a turned Elena (`ink/m07_npc_elena_rodriguez.ink:292`) asks, and is told to go and do VM work.
- **Fix.** Add a first branch `{hollis_resolved == "talked" or elena_outcome == "turned": You've been told already. The plate on the transfer switch, in this hall. Last four of the serial.}`. Both VARs are declared in the phone ink.

### F5. Elena KO text overclaims
- erb:1017: "The vault code's in their site notes off the share". The decode gives the rule. The digits are on the plate (erb:1669, erb:1847).
- **Fix.** "…How to read the vault code is in their site notes off the share, and their listener leaks the control room password."

### F6. Stale comments
- erb:323-327 names an aim `below_ground` and calls the vault aim "optional lore [that] must never gate the conclusion". The aim is `trace_the_intrusion`. It still never gates the conclusion, but two of its tasks are required since U5 (erb:439-456).
- erb:333-335, "Anything a player can legitimately walk past (…the vault…) is `optional: true`", is no longer true of the generator hall and the keypad.
- erb:1556 says Elena is the source of "the vault PIN". It's the rule since pass 5 (her own ink header, `:15-17`).
- erb:271-274, the cloner comment, goes stale if F3 lands.
- **Fix.** Rewrite the four comments. No behaviour change.

### C1, C2 (carried from `ALIGNMENT_REVIEW_P5_C3.md`)
- **My view.** Both stay minor. Neither touches a lock or a route. They are about what the debrief and credits say about the redirect choice, which is the mission's central decision, so they matter for honesty rather than solvability.
- They add a latch (`decode_before_commit`), mappings, credit conditions and debrief branches. That is structural, so do them in this stage's fix round, not the dialogue stage. Then the dialogue stage's tagdiff stays about words.
- Take the C3 reviewer's fixes as written. Add q1–q3 as routes r15–r17.

### N3 (carried). Praise straight after "Nobody put it next to the brief"
- **Evidence.**
  - The handoff's "Above expectations" is withheld only on `revision_found_open and not team_redirected and not redirect_declined` (`ink/m07_closing_debrief.ink:621`).
  - A player who read the decode with the window open and never made the deduction has `revision_found_open` false. They hear A2's "Their own schedule was in your hands tonight… Nobody put it next to the brief." Then, if they pick "defended", they get "Good. That answer will stand up in any review room" (`:579`) and then "Above expectations".
- **My view.** Minor, and it belongs in the same round as C1/C2, because it is a gate on an existing VAR.
- **Fix.**
  - Widen the handoff gate with `and not (found_coordination_traffic and not projection_revised and team_assignment != "trojan_horse")`. `found_coordination_traffic` is declared in the debrief since A2.
  - In "defended", give that player an alternative second line: "It will. You also had their schedule in your hands, and you didn't put it next to the brief. Keep the discipline. Change the numbers you trust."
  - Route: r8 with the stance "defended", expecting `notSaid: "Above expectations"`.

---

## Considered, no change recommended

These are recorded so the next round doesn't re-raise them.

- **The deduction can be brute-forced.** There are 3 operations × 4 fields, and a wrong pick costs nothing (`ink/m07_phone_agent_0x99.ink`, `deduce_wrong`). Alignment r2 m4 kept "costs nothing" on purpose and removed the values from the choices. The redirect window's clock is the real cost of guessing. Leave it.
- **Elena opens the control room door from the same room, for about five clicks and no evidence.** "What were you told" → "The other three operations" → "Help me stop it" → the door password (`ink/m07_npc_elena_rodriguez.ink:98`, `:112`, `:118`, `:288`). She also hands over `projection_revised`. This is her designed role, as the witness and primary source (the alignment r1 M2 decision). The flag-2 route needs VM work, and every flag is required for the ending anyway. So she speeds up a struggling player without letting anyone skip the VM. Gating her on the decode would take that help away. Leave it. If a later round wants her to need evidence, the place to do it is `turn_offer` (`{revision_heard and (found_coordination_traffic or casualty_projection_found)}`), not her revision beat.
- **The ATS-1 plate prints the digits in its observation** (erb:1847). A player can try 4703 without the rule, and gets 5 tries per opening. That is the lesson HaX states at the door (erb:993), and the vault is optional. Leave it.
- **Park doesn't guard the vault's lore.** After "Nothing. I was never here." the player is still in the room and can take the splice, Tomb Gamma and the intercept. The header calls him "pressure on the last approach, not plot" (`ink/m07_npc_thomas_park.ink:8`). Leaving him has a cost: the switch is cut (erb:1849-1853), and the debrief and credits say so. Leave it.
- **The Fingerprint Kit is carried and unused** (erb:283-288). Nothing in the building has a reason to sit behind a print: the handover sheet already proves Hollis's login. Inventing a print puzzle would break the "would this object exist anyway?" test. Leave it (for the user, see below).
- **The keyed plant door is key-before-lock.** The key and the handover sheet share a tray (erb:1488, erb:1521), and HaX's guide text names both the key and the picks (erb:1054). The picks are the m01 capability being spent. Leave it.

## How the VM flags slot into the chains

- **Flag 1 (NFS share)** pays out the relay decode (erb:1635-1638, erb:1662-1673). It drives three chains:
  - the deduction on HaX's hub, which gates the redirect (the central choice);
  - the vault rule (side chain);
  - the operator account name for flag 3.
  
  HaX reacts with a nudge (erb:818) and a prompt with no conclusion (erb:825).
- **Flag 2 (listener)** pays out the capture (erb:1640-1643, erb:1675-1685), which holds the operator password and the control room door password. It is the redundant door route past Elena. HaX texts it (erb:873-890), corroborating Elena when she has already given the door.
- **Flag 3 (operator login)** is the mission's best-woven flag. It arms the visible 15-minute clock and closes the redirect window (erb:940-954). The player is warned about this five times before logging in: the aim text (erb:512), the flag-2 text (erb:890), `vm_hint_3`, the open-window verdicts, and HaX's clock answer. The order of door and login is recorded (`logged_in_before_door`, erb:928-938), and the credits mark it (erb:187).
- **Flag 4 (root)** unlocks the console (erb:1650-1654). The console's observation says so before you get there (erb:1763), and HaX texts "Go and give it one" (erb:960).
- **The debrief and credits reflect all four.** The three-doors beat and the ATTACK HOST and CLOCK credits are at erb:183-187. All four flags are in `concludeRequires` (erb:557-564). If the console was opened with flags 1–3 still missing, the nag (erb:1075-1083) and the debrief hold (erb:1401) cover it.
- **Verdict.** The flags are required, framed and answered. Flag 3 makes a VM step into a story decision about timing, which is what the brief asks for. No change.

## Difficulty for a struggling player

- **The checkpoint.** Hollis challenges on sight a few seconds after the tutorial. "Back off. I'm leaving." is clear, and the 20-second cooldown (erb:1267) lets the player walk on. The danger is "Walk at him" → "Put it down": an early fight at default stats (F2).
- **The badge.** HaX's ops-floor text names both routes (erb:1046). The sheet sits in the same tray as the plant key, so a player who takes the key usually takes the sheet. That's fair.
- **The VM.** There are per-stage hints (`vm_hint_1`–`4`), field guides offered when each obstacle appears (erb:1037-1070), and the capture tells the player they no longer need anyone for the door. That's fair.
- **The vault.** The maintenance log sends the player to OptiGrid, and HaX's hint names the source (F4 for the Hollis/Elena case). Fair, once F4 is fixed.
- **Park.** The trap in F1 and the fight in F2 together make this the worst spot for a struggling player. After both fixes it is fair: visit 1 warns, HaX points to the projection, and a third visit carrying it gets a last chance.
- **The ending.** "Bring me in" plus the 9-minute fallback. Nobody waits forever.
- **The clock.** It never fails the mission. Step one runs and the debrief reads it out.

## What could break (for the fixer)

- **F1.**
  - `park_returns` is an ink variable, so `npcInkVariables` carries it over a reload (C3's C5 analysis).
  - Keep the swing reachable for a player without the projection, so r2's third visit still turns hostile.
  - Check S2: a player who already has the projection on visit 1 or 2 must still see the hub choice there.
- **F2.**
  - `behavior` already exists on Hollis (patrol, erb:1234). Add `hostile` beside `patrol`, don't replace the block. Park and Mercer have no `behavior` yet.
  - The HaX texts must not fire on a reload: they are onceOnly, keyed on the change, and the value persists.
  - The music event on `npc_hostile_state_changed` (erb:141-146) is unaffected.
- **F3.**
  - The `pressed_once` choice must not appear after `talked` or `ko`. The hub already diverts those at `:65-70`.
  - The `card_cloned` mapping must sit on an always-loaded NPC (HaX is fine).
  - `hollis_backed_off` set in the clone knot sends any later sighting to `wary_again`, which is correct, because he's still bought.
  - Check that the RFID guide mapping (erb:1041-1047, `!badge_obtained`) doesn't text after a clone made on the ops floor. It can't: Hollis is in the checkpoint.
- **N1.** Text only.
- **C1, C2, N3.** As the C3 reviewer listed. Re-run r1–r12, plus the new r13–r17 and the N3 variant of r8.

## Items for the user

- **Needs checking against SecGen by the user** (U3, unchanged; I opened none of the files):
  - whether the NFS export carries the operator account's name, as the decode's header (erb:1669) and `vm_hint_1` say;
  - whether flag 4 can be reached before flag 3. If it can, `cascade_armed` never arms, the window never closes on a login and `logged_in_before_door` never sets. Nothing breaks, but the clock beat is skipped;
  - the debrief's three-doors line and the ATTACK HOST credit (erb:184);
  - the one-host wording.
- **Unused kit.** The Fingerprint Kit (and the cloner, unless F3 is taken) is carried with no use in m07. Recommendation: take F3 and leave the print kit unused, because cumulative kit doesn't mean every tool gets a lock. Overrule if you want a print use found.
- No engine change is proposed. F2 uses existing `behavior.hostile` fields, F3 uses existing `rfidCard` and `#clone_keycard`.

## Spoken lines these fixes would touch

No m07 audio exists yet; listed for the record.

- **F1.** New Park narration and line ("…in his fist, and waits." / "I said there wasn't a third. You've got one sentence."). HaX's return text and `topic_park` each gain one line.
- **F2.** Three new HaX texts (or one shared wording).
- **N1.** The debrief's two Hollis "talked" lines are replaced.
- **F3.** New Hollis narration ("He's still talking when you step back…") and a new HaX lesson text.
- **F4.** One new HaX phone line.
- **F5.** One HaX text reworded.
- **C1, C2, N3.** As listed in `ALIGNMENT_REVIEW_P5_C3.md`, plus N3's alternative "defended" line.

## Capability arc

- **m07 grants nothing new.** It spends the m01 picks (the plant door) and, with F3, the m03 cloner.
- **The m04 print kit and the rationed PIN cracker are carried unused.** That fits a climax that tests the full kit on people and on the VM, not on new locks.
- **For m08:** nothing new to show the wall for. The mole thread is set up by the vault intercept (erb:1957-1969).

## Can the stage move on?

Not yet. F1 and F2 are majors, and N1 is a one-line major. After a fix round, a second puzzle-chains cycle should:
- confirm F1–F6 and the carried items;
- look again at whether four routes to the badge reads as too many once the clone is in.

A browser check is owed for these:
- Park's return trip with the projection;
- the hostile chase speeds;
- the clone at Hollis and the reader.

*Reviewed against `scenario.json.erb`, the ink and the engine. Cycle 1 of the pass-5 puzzle-chains stage.*
