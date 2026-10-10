# m08 The Mole — design review (pass 4)

Reviewed 2026-10-02 against `scenario.json.erb`, the twelve inks, the engine and m01_first_contact. Method: `.claude/skills/scenario-design-review/SKILL.md`, then the wider questions in the pass-4 brief. Read-only: nothing in the mission was changed. Line numbers are `scenario.json.erb` (erb) unless another file is named.

## 1. Validator

`ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb` (run 2026-10-02; it regenerated `dungeon_graph.*`). Structure, ERB, schema, unknown fields, ink, room geometry and door alignment all pass.

**❌ INVALID** — none.

**⚠️ WARNING** (2, both intended)
- `closing_debrief` has four `onceOnly` handlers on `global_variable_changed:brief_taken` that can fire together (erb:763-803). Each completes a different task (`interview_cipher`, `interview_phantom`, `interview_nightshade`, `breach_server_room`), so firing together is the point. Pass 3 recorded this (`PUZZLE_CHAINS_PLAN.md:186`).
- `interrogation_room/npcs[0]/eventMappings[0]` is a cutscene without `onceOnly` (erb:1361-1369). Deliberate: a reload mid-scene must be able to reopen it, and the ink skips to `after_choice` once `fate_decided` is set (`m08_nightshade_confrontation.ink:41`).

**✅ GOOD PRACTICE** — event-driven cutscenes (13), `globalVarOnKO` on every suspect and the Director, `skipIfGlobal` on the opening, dynamic music with credits, and `puzzle_graph_*` metadata.

**💡 SUGGESTION** (relevant ones only)
- `nightshade_profile` (in the safe) has no `puzzle_graph_unlocks`/`reveals` edge into the graph. It has `puzzle_graph_reveals` (erb:958), so this is the validator wanting an unlock; harmless.
- No PC container with a `collection_group` read task (m01 does this at `m01 erb:1824-1834`). `nightshade_desk` is a `pc` with no contents on purpose (erb:1319-1327). Not needed; the archive and locker carry the reading.
- No `timedMessages` on HaX. m08 uses event-driven `sendTimedMessage` instead (erb:589-720), which is the better pattern here (no texts landing over cutscenes, erb:579-581). Ignore.
- No hostile or patrolling NPC. Discussed under stakes in §4; a headquarters full of colleagues is the wrong place for a fight, so this is a judgement, not a gap.

**Graph summary:** Puzzle 47 nodes / 52 edges; Story 6 / 5; Integrated 53 / 61; Rooms 9 / 8. Critical path (4 hops): Report In And Take The Brief → Get Into The Internal Repository → Correlate The Leak Timeline → Confront The Mole → Close The Investigation.

## 2. Design review (skill §2a–2h)

The skill's checks are grouped here as it asks: solvability and clues, teaching, narrative and ink, structure (graph, rooms, objectives, KO).

### Group A — solvability and clues (§2a, §2b)

**2a Solvability: OK.** Critical path from `main_lobby`:
1. Netherton's brief completes `brief_with_netherton` on the first line (`m08_director_netherton.ink:51`); a KO completes it too (`taskOnKO`, erb:893; HaX sets `brief_taken`, erb:637-640).
2. Server room (RFID `server_zone_badge`, erb:1129-1132) has three routes: Netherton's keycard on request (`m08_director_netherton.ink:106-114`), his KO drop (`npc-hostile.js:139`, as pass 3 found), or the badge printer (PIN 0311 from the break-room post-it, erb:832-857, :1464).
3. Four flags at the relay (erb:1149-1167). `targetFlags`/`targetCount` are set on all four `submit_flags` tasks (erb:360-407), and each flag reward is a plain `set_global` the scenario reads (erb:1162-1167), so neither silent killer in §2a applies.
4. Suite PIN 5386 (erb:1331-1335): the code card in the Director's safe (safe PIN 2407 from the ops-floor printout, erb:1040), or Netherton aloud after a correct audit reading (`m08_director_netherton.ink:284`). The start-kit picks don't open a PIN lock, so one of these two deductions is required. Good.
5. The confrontation opens on entry once `all_flags_submitted` is latched (erb:805-811, :1361-1369); the debrief opens when it closes (erb:812-825); credits on the debrief closing (erb:200-212).

No circular dependencies. No soft lock found. Two order notes, both acceptable and already in the plan (`PUZZLE_CHAINS_PLAN.md:295-301`): a player who goes east first holds the suite card before seeing the suite door; one who goes west first holds the archives password before seeing the archives.

Dialogue promises: one presentation gap. The confrontation NPC stays `initiallyHidden` for the whole scene (erb:1357; nothing sets him visible, `npc-sprites.js:222`), so the room the player walks into, and walks out of, has nobody at the table while the narrator says "Nightshade sits with his hands flat on the table" (`m08_nightshade_confrontation.ink:44`). The debrief opens straight after, so it's seen for a moment. Minor (fix 21).

**2b Clue distribution: OK, with one over-signposted clue.** The investigation's clues are spread over five rooms: printout (ops), audit (archives), timeline (break room), auth excerpt (server room), Phantom's notes (intel). Every code has a source before its lock, and each source names its lock. No navigation-only notes.
- Readables with no puzzle use: the tactical board (erb:1101-1111), past leak investigations (erb:1207-1214), the database catalogue (erb:1194-1205) and the security notice (erb:858-866). They carry story and credits (`database_theft_understood`), which is their job. Keep.
- The USB stick's observation gives the whole recipe: "Base64, then ROT13 … unwrap it, last layer first" (erb:1506). HaX's text already says "wrapped twice. Same tricks as your first week" (erb:672). Telling the player the encodings removes the one thing the puzzle teaches (recognising them). See fix 12.

### Group B — teaching (§2c, §2c′)

**2c Educational coverage: OK on the VM, thin on the physical kit.**

| Lock / check | Where | Teaches | Verdict |
|---|---|---|---|
| password | archives (erb:1184-1188) | passwords on post-its, with a Level Red joke | OK |
| pin ×3 | badge printer, safe, suite | session left logged in; predictable codes (service numbers); a code kept as a decision | OK, the safe deduction is a good small one |
| key + picks | Nightshade's locker (erb:1486-1497) | physical security; asking for the key vs picking | OK, optional |
| rfid | server room | given a keycard by the Director, or a printed badge | **CONCERN**: the RFID cloner in the start kit (erb:236-242) has nothing to clone |
| fingerprint kit | — | nothing | **CONCERN**: carried, never used (erb:243-249) |
| flags ×4 | GitList VM | argument injection, secrets in git, login, sudo privesc | OK, matches the SecGen scenario (`SecGen/scenarios/break_escape/safetynet/m08_the_mole.xml:153-261`) |
| door audit check | Netherton (`m08_director_netherton.ink:151-284`) | log correlation, attribution ("doors tell you who was in a room, not whose account"), corroboration | strong, the best teaching in the mission |

The mission's topic is insider threat and attribution, and the puzzles fit it. The gap is the arc finale leaving two of the three carried tools inert: the dungeon graph shows `rfid_cloner` and `fingerprint_kit` as dangling nodes with no edges. See §4 and fix 1.

**2c′ Field guides: CONCERN on timing.** All six are exposure-gated and on request (`m08_phone_agent_0x99.ink:84`, `:96-122`), every `#give_item` id matches `itemsHeld` (erb:722-729), all offer globals are declared (erb:1619-1631), and all six sheets exist in HacktivityLabSheets (`_labs/safetynet/`). The `labUrl`s 404 until that repo is pushed (log line 17).

Two guides are offered after the step they teach:
- **Secrets in git history** is offered on `flag2_submitted` (erb:605-611). The sheet is about recovering committed or stashed credentials (`secrets-in-git-history.md`, "Objective"), which is how flag 2 is earned. It should be offered at flag 1.
- **Vulnerability analysis** is offered on `flag1_submitted` (erb:597-603), after the exploit has worked. HaX's own pitch ("Know why the flaw works before you lean on it", `m08_phone_agent_0x99.ink:114`) wants it before. Offer it with the scanning guide on first use of the launcher (erb:713-720).

Recon (server room entry), scanning (launcher), CyberChef (USB opened) and privesc (flag 3) are timed right. Fix 19.

### Group C — narrative and ink (§2d, §2d′)

**2d Narrative structure: OK.**
- Opening: ATHENA's cutscene briefs role, stakes, kit and the first destination (`m08_opening_briefing.ink:11-25`), with `skipIfGlobal` (erb:510). HaX's first text follows the cutscene closing, not a timer (erb:591-595).
- Closing: hidden `closing_debrief` in the always-loaded lobby (erb:731-828), opened by the confrontation closing or any room entry once the fate and all four flags are in. Clear win condition (`concludeRequires`, erb:443-450).
- Event wiring spot-checked: flag 4 → `mole_identified` (erb:621-627); all flags → Nightshade leaves the lab (erb:1296-1305) and the confrontation arms (erb:1363-1364); Netherton KO → `brief_taken` and the keycard text (erb:636-641). All correct.

**2d′ Ink conventions: mostly OK.**
- Narration is on the Narrator voice and a top-level `narrator` block exists (erb:115-123).
- No combat or terminal logic in ink. The fate is a two-choice decision in ink (`m08_nightshade_confrontation.ink:112-127`), which is a conversation, not a terminal menu. The old terminal was removed in pass 2 (erb:1392).
- Choices are first person throughout. The confrontation has three scripted `You:` lines the player didn't choose (`m08_nightshade_confrontation.ink:47`, `:67`, `:76`). They aren't echoes of a choice, but :76 puts a retort in the player's mouth straight after a choice. Hand to the dialogue stage.
- ATHENA's console is a `person` NPC with an office-worker sprite (erb:545-564) while its observation says "The reception console is lit and awake" (erb:563). The building AI is a woman you can punch. Minor; art backlog.

### Group D — structure (§2e, §2f, §2g, §2h)

**2e Graph metadata: CONCERN (documentation only).**
- The deduction that pass 3 built, audit + clock → Netherton → suite code, is invisible. Netherton has no `puzzle_graph_actions` (the file has none at all), and the audit (erb:1219-1232), timeline (erb:1469-1478) and auth excerpt (erb:1170-1179) have `reveals` but no edge to the suite door.
- The post-it unlocks `security_archives` only (erb:1466); its second job, the printer PIN, has no edge.
- The badge printer and the safe each appear twice (`lock_badge_printer` + `visitor_badge_printer`, `lock_director_safe` + `director_s_safe`) because the object carries `puzzle_graph_role` as well as a lock.
- Fix 20 covers the three items above.
- Starting items are sourced from the start room (OK). VM chain is connected launcher → flag 1 → … → flag 4 (OK). No backwards edges.

**2f Rooms: OK.** Nine rooms, none empty, room types fit an HQ. Depth 2. Geometry and doors clean. The one long walk is server room → interrogation room after the last flag (four rooms, east end to the far west), which is the right moment for a walk: the music has just moved to `threat`.

**2g Objectives scaffolding**

| Aim | Required tasks | With in-world pointer | Dead-zone risk | Bark/conversation at transition |
|---|---|---|---|---|
| Report In And Take The Brief | 1 | 1 (ATHENA, HaX) | none | ATHENA cutscene, HaX text (erb:591-595) |
| Work The Three Suspects | 3 (+2 optional) | 3 (titles name the rooms; Netherton's hub) | low | Netherton's brief |
| Get Into The Internal Repository | 3 | 3 (keycard; launcher text; flag texts) | low | HaX on server-room entry and launcher (erb:701-720) |
| Correlate The Leak Timeline | 2 | 2 (HaX flag 2 and 3 texts) | low | HaX (erb:605-619) |
| Confront The Mole | 1 | 1, but the suite code has no task | **medium** | HaX all-flags text (erb:629-634) |
| Close The Investigation | 2 | 2 (automatic) | none | debrief opens itself |

Findings:
- **Aim 4 has no task for the one required deduction.** The task is "Put the evidence to the mole" (erb:422-429). Getting the suite code (printout → safe, or the audit check) is the step a player is most likely to be stuck on, and the objectives panel says nothing about it. HaX's 6-second text does (erb:633). Pass 2 removed `open_interrogation_room` because picks opened the door at minute one (erb:418-421); the door is now a keypad, so a code task can come back, gated on `all_flags_submitted` so it can't reveal the aim early (lesson 27). Fix 6.
- **Aim 3's description over-promises.** "Line them up against the leak window until only one name survives" (erb:384); its tasks are flags 3 and 4 (erb:388-409). The lining-up lives in aim 1's optional `name_the_mole`. Reword. Fix 6.
- **Aim 1 gates nothing.** It is required for no later aim and is not in `concludeRequires`. That is fine for completion, but see §4 on the investigation being skippable.
- Task titles are actions throughout, and spoiler-safe ("the cryptography lab's duty officer", erb:319).

**2h KO resilience**

| Person NPC | Gates a required task/item? | Fallback | KO in debrief/credits? | Verdict |
|---|---|---|---|---|
| director_netherton | brief (aim 0), keycard, suite code (one route) | `taskOnKO` + `brief_taken` (erb:893, :637-640); card drops; printer; safe | debrief :37-39, credit erb:191, confrontation :113, :148-152 | OK |
| agent_cipher | interview (aim 1, not critical) | brief-gated KO pair (erb:757-768) | credit erb:170; HaX erb:649-653 | OK |
| agent_phantom | interview (not critical) | erb:769-780 | credit erb:173; HaX erb:654-659 | OK |
| agent_nightshade | interview (not critical), locker key | erb:781-792; key drops; picks | credit erb:192; confrontation :55-57 | OK |
| nightshade_confrontation | confront + fate (critical) | hidden, `taskOnKO` (erb:1359), HaX safety net (erb:680-688) | credit erb:163; debrief :104-105 | OK |
| agent_0x99_person | nothing | — | credit erb:193; HaX erb:661-665 | OK |
| receptionist_ai (ATHENA) | hints only | HaX repeats the safe hint (`phone ink:69`, `:72`) | none | OK; see note |
| background_agent, background_analyst | nothing | — | none | OK |
| opening_briefing_cutscene, closing_debrief | hidden | — | — | OK |

Win condition can't be blocked by any KO. One coherence note: after an ATHENA KO the only pointer to the archives password is gone (HaX's door-log answer says "behind a passphrase" and stops, `phone ink:76`). The archives are optional, so this isn't a soft lock. Fix 14.

A narrative slip on the Netherton-KO path: HaX's all-flags text says "The Director's had him walked down to the interrogation room" (erb:633) while the Director is on his office floor. Fix 8.

## 3. Carried pass-3 notes

From `PASS4_EDITORIAL_LOG.md:18` and `PASS3_APPROVAL_LOG.md:151`.

**"I'll need access." persists — confirmed (within the open conversation); the "until a reload" part is not explained by the code.**
The option is gated `{ not netherton_card_taken }` (`m08_director_netherton.ink:99`). That global is set by a pickup mapping on `closing_debrief` (erb:751-756). The mapping's `setGlobal` broadcasts only to engines in `npcManager.inkEngineCache` (`npc-manager.js:647-657` → `npc-conversation-state.js:479-503`), but a person-chat runs its own `InkEngine` (`person-chat-minigame.js:49`), so the open conversation never hears it. The give is also asynchronous, so the hub after `take_keycard` is evaluated before the pickup lands. Result: the option shows again straight after the card is handed over, for the rest of that conversation. On a reopen, the engine syncs globals and re-navigates to `hub` (`person-chat-minigame.js:500-526`), which should hide it; I can't see in the code why pass 3 saw it survive until a reload. One browser check settles it.
Fix: mission-local, end `take_keycard` with `#exit_conversation` so the next talk re-evaluates the hub (fix 4). Proper fix: an open person-chat should receive global broadcasts (engine, backlog).

**`mission_complete` on the backstop path — confirmed.**
`mission_complete` is set only on the debrief's last line (`m08_closing_debrief.ink:141`). The reload backstop sets `debrief_backstop_fired` and completes `take_the_debrief` but not `mission_complete` (erb:532-540). The engine never reads `mission_complete` (no match in `public/break_escape/js`); the scenario does, as the backstop's own guard (`!globalVars.mission_complete`, erb:535). So after the first backstop fires, every other room's backstop handler stays armed, and each would re-emit `debrief_backstop_fired`, which re-triggers the victory entry and its credits (erb:200). In practice the conclusion screen is `disableClose` and the player can't walk into another room, so the visible effect is the stale global. Fix 5: add `"mission_complete": true` to the backstop's `setGlobal`. One line, mission-local.

**Netherton's resumed check shows choices without the question — confirmed.**
Each step prints its question in `audit_qN` and keeps its choices in `audit_cN` (`m08_director_netherton.ink:169-250`). On reopen, person-chat re-navigates to the top-level knot of the first saved choice (`person-chat-minigame.js:508-521`), which is `audit_cN`, and `audit_cN` prints nothing before its choices. The split was deliberate in pass 3 so a reopen replays no text (`PUZZLE_CHAINS_PLAN.md:162-164`), but here replaying the question is what the player needs. Fix 3: move each question line into its `audit_cN`, after the state guard, and divert straight to `audit_cN`. The guard still sends a reopen after `mole_identified` to the hub without printing. Mission-local. The general engine fix is already in `docs/IDEAS_BACKLOG.md:14`.

**"A stale bark after reading"** is not attributed to a mission in the log. m08 has no bark that fires on reading; its only read/pickup message is HaX's CyberChef offer on opening the USB stick (erb:666-673), which stays accurate. Not an m08 item; close it for m08.

## 4. Beyond the checklist

### Pacing and dead time

The shape is: brief (2 min) → three interviews and the documents (10–20 min, all optional for completion) → VM (most of the "60–75 minutes" in `mission.json`) → walk to the suite → confrontation → debrief. That's a sound shape for a finale. Two problems:

- **The keycard arrives at minute two.** "[I'll need access.]" is open from the first hub (`m08_director_netherton.ink:99`), so the server room and the VM are open before the player has met a suspect. A player who goes straight to the box gets the name from HaX at flag 4 ("It's Nightshade. It was always Nightshade", erb:626), and the mystery the mission is named after becomes optional reading. Pass 3 built a good deduction (`PUZZLE_CHAINS_PLAN.md:214-217`); the order of play doesn't ask anyone to do it. Fix 2 holds the card until the interviews are done, leaving the badge printer as the early route for players who explore.
- **Nothing happens in the building during the VM.** That is normal for a VM mission. The interviews have post-flag-4 beats (Cipher's apology, Nightshade's "Forty-seven minutes" option), which are good reasons to walk back, but they are only open between flag 4 and the last flag going through the relay, after which Nightshade leaves the lab. Acceptable.

### Does the player always know what to do next?

Mostly. ATHENA → Netherton → aims panel names rooms → HaX texts at every VM step. The weak spot is the suite code (§2g): no task, one HaX text, and the HaX phone answer before flag 4 is deliberately vague ("look at what he signs", `phone ink:69`). The other weak spot is the audit check's entry gate: "[I've been through the door audit, sir.]" appears as soon as the audit is read (`:102`), but then sends the player away twice, once for a clock and once for a confirmation (`:153-166`). Each turn-back says what to fetch, so this is fair, but nothing in the objectives panel tracks it (`name_the_mole` is one optional task). Acceptable for an optional deduction.

### How well each puzzle teaches its Cyber Security idea

- **Door audit (best in the mission).** The four steps (when, who, why not Cipher, why trust Phantom's printout) teach attribution: a door log places a person in a room, an auth log places an account on a file, and you corroborate a source you didn't produce. Netherton's wrong-answer replies are short and teach on their own ("Desks don't open files", "Then it agrees with Phantom twice", `:260-269`). Keep exactly as is, apart from fix 3.
- **VM.** Good, and HaX's flag texts name the idea at each step. The two mistimed guides (§2c′) are the only weakness.
- **Safe.** Small and satisfying: the printout prints the Director's service number and the margin explains the habit (erb:1040).
- **USB stick.** Over-explained (§2b, fix 12).
- **Badge printer.** A logged-in printer with a badge in the tray (erb:841) is a neat physical-security lesson, and HaX ties it to Nightshade's m03 line (erb:695). Most players never see it because the Director hands over his card first. Fix 2 also fixes this.
- **RFID and fingerprints.** Nothing to teach because nothing uses them (fix 1).

### Fun, stakes and payoff

- **Stakes promised, never enforced.** The brief says "Do it quietly -- the moment they know you are looking, they are gone" (erb:105), ATHENA repeats it (`m08_opening_briefing.ink:23`) and so does Netherton (`m08_director_netherton.ink:96`). Accusing Nightshade to his face costs nothing: he says "I'll still be here when you come back" (`m08_suspect_nightshade.ink:100`), and he is. Accusing an innocent man has a cost (debrief :62-64, credits erb:169-174), which is good. Fix 10 gives the warning one small, non-blocking consequence.
- **The confrontation** is strong. It reads the player's history (suspicion, audit, lab KO, early accusation, go-bag), the philosophy is presented and pushed back on, and Tomb Gamma is given up on every path (`:133-138`). The fate choice has real weight and the debrief carries it.
- **The debrief and credits reflect what the player did** closely: fate, accusations, audit reading tiers, first theory, Okafor, KOs, the stance on Netherton. Two gaps: HaX's flag-4 text ignores a player who already named Nightshade from the audit (erb:626; fix 7), and nothing reflects the decoded USB stick (the engine can't see a CyberChef decode, so leave it).

### Continuity with m01–m07

What lands well:
- m07's last beat ("The leak was the agent", `m07_closing_debrief.ink:371-372`) is m08's premise, and its "Somebody knows where [Tomb Gamma] is" (`:439`) is paid off by Nightshade's coordinates.
- Nightshade's m05 insider briefing (`m05_insider_trading_opening.ink:30`) comes back twice, in the interview (`m08_suspect_nightshade.ink:60-65`) and the confrontation (`:92-95`).
- His m03 line about cloning ("One day it'll be our badge somebody clones", `m03_opening_briefing.ink:175`) is quoted by HaX on the printer route (erb:695).

What's missed:
- **The PIN cracker.** It has been held back every mission. In m03 HaX says "Nightshade's still got the one from St. Catherine's on his bench" (`m03_opening_briefing.ink:177`); m04 "it isn't leaving the lab" (`m04_opening_briefing.ink:279`); m05, m06, m07 the same. m08's ATHENA says it's "on a bench in Technical Analysis, two floors down" (`m08_opening_briefing.ink:15`). The finale is the place to reveal whose bench, and why the team never got it back. Fix 11 (line change only; giving the device to the player is a user decision under the rationing rule).
- **The m07 intercept's sender.** m07 says it came from "a safetynet.gov address with the local part removed" and that level five clearance sees the tasking board (`m07_closing_debrief.ink:427-428`). m08's evidence never closes that loop: no line says the stripped local part was Nightshade's. Fix 9.
- **Two Ciphers.** m04's ENTROPY operative is "Cipher" (`m04_npc_operative_cipher.ink:2`; `m04_opening_briefing.ink:157`). m08's innocent SAFETYNET analyst is Agent 0x23 "Cipher". Nobody in m08 mentions it. A player who remembers m04 will read it as a clue. Renaming costs ids and files (rename rule), so the cheaper fix is to use it: one line where Cipher or Netherton acknowledges the shared handle makes the herring better (fix 13).
- **The kit.** Picks, cloner and print kit are named on arrival (`m08_opening_briefing.ink:15`), and only the picks have a use (fix 1). For the last mission of the arc this is the biggest missed payoff.
- **Nightshade in every briefing.** He briefed m03, m04, m05 and m06 beside Netherton. Netherton's suspect line says "He helps write the plans ENTROPY seemed to be reading" (`m08_director_netherton.ink:91`) but never "he was in the room for every operation I have sent you on". Worth a clause in the dialogue stage; no fix number.
- The no-coordinate debrief branch says Tomb Gamma is "a name from his files" (`m08_closing_debrief.ink:131`); m07 found it in the vault (`m07_closing_debrief.ink:391`). Fix 15.

### Presentation

- Phantom and Netherton use the same sprite, `male_spy_v2` (erb:1069 and :881, also the debrief :737). In a whodunit the Director and a suspect shouldn't look identical. `male_telecom_v2` has walk, talk and viseme sheets and isn't used elsewhere in m08 (fix 16).
- The interrogation room is empty during and after the confrontation (§2a).
- ATHENA is a human sprite (§2d′).

### Stale notes and docs

- The comments say the person-chat End Conversation button ignores `disableClose` (erb:675, `m08_nightshade_confrontation.ink:129-131`). It no longer does: `base-minigame.js:17-19` hides cancel when `disableClose` is set. HaX's "You walked out on him" nudge (erb:674-679) can now only fire after a reload. Harmless; update the comments (fix 17).
- `mission.json` is stale: it lists GitList CVE-2018-1000533 as "directory traversal" (it is argument injection, as the erb says, erb:17-18), and claims "Password cracking", "RFID cloning" and a "dead drop system", none of which m08 has (fix 18).
- Flag order against a real build is still unverified (erb:21-23; `SecGen/.../m08_the_mole.xml:154-155`). Needs a SecGen build; not mission-local.

## 5. Proposed fixes

No blockers. Tags: **[major/minor]**, **[local]** = m08's own files (approved under the pass-4 rules if solvable and validator-clean), **[approval]** = engine, shared, other missions or other repos. After any change: compile, validator, door check, inkcheck/loopcheck, `reopencheck.mjs … m08_the_mole`, and update CONTRACT.md / TESTING_WALKTHROUGH.md where identifiers or the route change.

1. **[major][local] Give the cloner and the print kit a job.** Two options; either or both.
   - *Cloner (recommended, pairs with fix 2).* Netherton won't hand over his all-zones card: "I am not putting my card in anyone's hand tonight. Stand close enough and I won't notice what's in your pocket." He carries it as an RFID card the player clones, the m06 pattern (`m06 erb:782-786`: `card_cloned` → global; clone rule in `PASS3_PUZZLE_BRIEF.md`). HaX's existing m03 callback (erb:695) moves to the clone. KO still drops the card; the printer stays the third route. Teaches what the cloner is for, inside SAFETYNET's own walls, which is the point of the m03 line.
   - *Print kit.* Lift a print from the USB stick's envelope in the locker and match it against candidates (Cipher, Nightshade, Phantom, facilities), using the existing fingerprint fields (`fingerprintOwner`, `fingerprintCandidates`, `scenario-schema.json:850-866`; m04 use at `m04 erb:1432-1433`, event `fingerprint_collected:<owner>` at `:663`). It ties the decoded mail to a hand, not just a locker label, and comes after the locker, so it is not a minute-one pointer (the F3 concern in the plan). Set a global; one confrontation line ("You printed the envelope. Of course you did.") and one credit.
2. **[major][local] Hold Netherton's keycard until the three interviews are done.** Gate "[I'll need access.]" (`m08_director_netherton.ink:99`) on each suspect being interviewed or knocked out (`cipher_interviewed or cipher_ko`, etc.; declare the VARs). Before that, a sticky "[I'll need access.]" gets "Talk to all three first. I want them to have seen you on the floor before anyone sees you at the server room." HaX's phone answer already offers the printer route (`phone ink:54`), so impatient players have an earned alternative. Effect: the investigation happens before the box answers it, and the printer route gets played. Pacing change, so the orchestrator's call; with fix 1's cloner it becomes "clone the card after the interviews".
3. **[minor][local] Resume Netherton's audit check with its question.** Move each question line from `audit_qN` into `audit_cN` after the guard; `audit_case` and each correct branch divert to `audit_cN`; delete `audit_q1-4`. Rerun `sim_netherton.js` and reopencheck; the expected result changes from "replays no text" to "replays the question".
4. **[minor][local] Stop "[I'll need access.]" reappearing after the give.** End `take_keycard` with `#exit_conversation` and `-> hub` (Netherton's last line, "Do not lose the card…", is already a sign-off). The reopen syncs `netherton_card_taken` and re-navigates (`person-chat-minigame.js:500-526`). Browser-check the "until a reload" report while there. If fix 1's cloner lands, this knot changes anyway.
5. **[minor][local] Set `mission_complete` on the debrief backstop.** erb:537: `"setGlobal": { "debrief_backstop_fired": true, "mission_complete": true }`.
6. **[minor][local] Objectives wording and the suite-code task.**
   - Aim 3 description (erb:384): "A foothold is not a case. Log in as the account owner, get root, and read the access logs the box keeps from users."
   - Aim 4: add a custom task "Get the interrogation-suite code", completed by mappings on `suite_code_found` and `named_on_evidence`, each also requiring `all_flags_submitted`, plus the pair on `all_flags_submitted` requiring either (the brief-gated pattern, erb:763-803). Not optional; it is the step players stall on.
7. **[minor][local] HaX's flag-4 text when the player already named him.** Split the flag-4 mapping (erb:621-627) into two with disjoint conditions on `named_on_evidence`, same `setGlobal`. Named version: "Root. The access logs say what your door audit said: Crypto Lab terminal, forty-seven minutes, two days before Portland. It's Nightshade. You had him before the box did. I trained with him." Keep the database line in both.
8. **[minor][local] HaX's all-flags text on the Netherton-KO path.** Split erb:629-634 on `netherton_ko`: "Security have walked him down to the interrogation room. The Director's still on his office floor, so it's your call in there. The suite code's in his safe."
9. **[minor][local] Close the m07 intercept loop.** Add a line to the full case file (erb:1386-1387) and HaX's flag-3 text (erb:618): the mail's account is the safetynet.gov sender whose local part was stripped from the m07 intercept, e.g. "5. Sender of the D-0 intercept: n.ops@safetynet.gov, the local part stripped in transit." Keep it to one clause; the m07 debrief is cached audio, so m07 is not touched.
10. **[minor][local] Make "do it quietly" cost something.** When `accused_nightshade` is set before `mole_identified`, HaX texts: "He knows now. If he was going to tidy up, he's doing it tonight." (a mapping on `global_variable_changed:accused_nightshade` with `!globalVars.mole_identified`). In the confrontation, gated the same way: "You told me you were coming. I had a night to tidy up, and I didn't. Think about why." No item is removed, so nothing can soft-lock. (Removing the USB stick was considered and dropped: container contents can't be made conditional without engine work.)
11. **[minor][local] PIN cracker payoff (line only).** ATHENA (`m08_opening_briefing.ink:15`): "The PIN device you are thinking of is still on Agent 0x47's bench, where it has been since St. Catherine's." Then one Nightshade line in the confrontation hub or after the go-bag: "And yes, I kept the PIN cracker. Every mission. You were always one tool short, and you never asked why." Giving the device to the player is **[approval]** (rationing rule).
12. **[minor][local] Let the player identify the USB encodings.** erb:1506: drop "Its properties say how it was wrapped: Base64, then ROT13 … last layer first." Keep "One file on it, PERSONAL_BACKUP.enc. Lazy, for a cryptographer." HaX's text (erb:672) and the CyberChef guide carry the hint.
13. **[minor][local] Acknowledge the two Ciphers.** One option in Cipher's hub, gated on `asked_others` or always: "[Cipher. Same handle as the ENTROPY man at the battery hall.]" → "I had it first. Eleven years first. They took it after the battery job, and I'd love to know who told them it was mine." It makes him look guiltier and gives Phantom's "reads logs he isn't cleared for" more weight.
14. **[minor][local] HaX's door-log answer points at the password.** `phone ink:76`: add "Facilities set that passphrase, and facilities write things down. Kettle." Covers an ATHENA KO.
15. **[minor][local] Debrief no-coordinate branch.** `m08_closing_debrief.ink:131`: "a name from his files" → "a name from the vault".
16. **[minor][local] Give Phantom his own look.** erb:1069-1071: `male_telecom_v2`, `male_telecom_talk.png`, `male_telecom_visemes.png` (all present in `assets/characters/`). Render the room after, per the room-dressing skill.
17. **[minor][local] Update stale comments** about End Conversation ignoring `disableClose` (erb:675, :1341; `m08_nightshade_confrontation.ink:129-131`). Keep the HaX nudge; it still covers a reload mid-scene.
18. **[minor][local] Correct `mission.json`.** CVE-2018-1000533 is argument injection; remove "Password cracking" and "dead drop"; "RFID cloning" stays only if fix 1's cloner lands.
19. **[major][local] Field-guide timing.** Move `gitsecrets_guide_offered` from the flag-2 mapping (erb:609) to the flag-1 mapping (erb:601) and move the guide sentence with it; move `vulnanalysis_guide_offered` from flag 1 (erb:601) to the launcher mapping (erb:717). The flag-1 text then ends: "The way in from here is reading, not tooling: the history and the stash. There's a field guide on secrets in git history if you want it." The flag-2 text loses its guide sentence.
20. **[minor][local] Graph metadata.** Post-it `puzzle_graph_unlocks: ["security_archives", "badge_printer"]` (erb:1466); `puzzle_graph_actions` on Netherton for the brief, the keycard and the audit check (`unlocks_aim` on the check → the suite door); `puzzle_graph_unlocks` on the audit, timeline and auth excerpt pointing at that action; drop `puzzle_graph_role` from the printer and safe objects if that removes the duplicate nodes (check against `generate_dungeon_graph.rb`).
21. **[minor][local] Seat Nightshade in the suite.** Add `"setVisible": true` to an `all_flags_submitted` mapping on `nightshade_confrontation` (the lab copy already hides on the same event, erb:1296-1305), so the room has someone at the table. He is still covered by `taskOnKO` and HaX's safety net if punched. Check placement with a room render.
22. **[minor][approval] Verify the flag order against a real SecGen build** (erb:21-23; SecGen m08 XML :154-155) and push the HacktivityLabSheets commit so the six guide URLs resolve.
23. **[minor][local, dialogue stage] The three scripted `You:` lines in the confrontation** (`m08_nightshade_confrontation.ink:47`, `:67`, `:76`): fold :76 into a player choice or cut it.

Spoken lines touched if all local fixes land (m08 audio isn't generated yet, so no cost today): about 14 new or changed lines across ATHENA, Netherton, HaX, Nightshade and Cipher.

## 6. Ideas for the backlog

- **Engine: open person-chats should hear global changes.** `broadcastGlobalVariableChange` writes only to `npcManager.inkEngineCache` (`npc-conversation-state.js:479-503`), and person-chat builds its own engine (`person-chat-minigame.js:49`). Registering the open person-chat engine (or re-syncing and re-navigating after each tag-driven event) would fix the m08 keycard option and any "item given, option still shown" case in other missions.
- **Engine: person-chat resume replays the question** (already `docs/IDEAS_BACKLOG.md:14`). m08's audit check is the clearest case.
- **Engine: hidden cutscene NPCs in the room.** A mapping option such as `revealDuringScene: true` that shows a hidden NPC while their scene is open and keeps them after, so confrontations happen with someone at the table.
- **Engine: conditional container contents** (`contents[].condition` on a global), so a mission can remove evidence when the player tips off a suspect. Would make "do it quietly" a real mechanic.
- **Minigame: a case board.** A lightweight evidence board where the player pins clues (audit row, timeline line, auth excerpt) to a claim and submits it, replacing multiple-choice deduction in ink. Netherton's four-step check would be its first user; m05 and m06 have similar reasoning beats.
- **Fingerprints: match against a known card.** The print minigame identifies an owner from candidates; adding a "compare with this reference card" step (a personnel file's print card) would teach comparison, not just recognition.
- **Art: an ATHENA console NPC** (a reception terminal with a face on screen, standing or wall-mounted) so the building AI stops being an office worker. PixelLab, one at a time, at target size.
- **Art: a unique Phantom and Netherton.** Both share `male_spy_v2`; Netherton appears in every mission, so he is the one who most deserves his own sprite. Pipeline skill from a concept portrait.
- **Story: the PIN cracker.** If the user approves fix 11's reveal, m09 could open with the team finally holding it, as a reward for closing the arc.
- **Story: the triple-agent branch.** The debrief and the bible say he "may resurface as a live-wire asset" (`insider_threat_initiative.md:81`). m09/m10 should read `nightshade_triple_agent` if cross-mission state is carried; worth checking whether it is.

## Changes made (pass 4 design)

Implemented 2026-10-02. Static checks only; no browser run yet (`PASS4_PLAYTEST.md` is the script). Fix numbers are §5's.

| Fix | Status | Notes |
|---|---|---|
| 1 Kit in the finale: cloner | **Done** | Netherton no longer hands his card over. After the three interviews he refuses ("I am not putting my card in anyone's hand tonight"), turns to the maps, and the hub offers "[Step up beside him and let the cloner read his card.]". Clone rule followed: `rfidCard` on `director_netherton` (card_id `server_zone_badge`, EM4100, name "Director Netherton Keycard"); `#clone_keycard` on a throwaway narrator line; `clone_debrief` reads the synced `netherton_card_taken`; one `card_cloned` mapping on `agent_0x99` sets `netherton_card_cloned` + `netherton_card_taken` and carries HaX's EM4100 point and the m03 callback (moved from the printer text). The physical card stays in `itemsHeld`, so a KO still drops it. Credit added. |
| 1 Kit in the finale: print | **Changed approach** | The print is on the USB stick's gloss casing, not the paper envelope: the kit's surfaces are glossy or textured plastic, and one item keeps the locker simple. `hasFingerprint` on `encrypted_backup` (owner Nightshade, `glossy_dark`, easy, candidates Cipher / Phantom / Director Netherton / Facilities); `fingerprint_collected:nightshade` → `nightshade_print_lifted` + a HaX text; a confrontation line and a credit. **Risk:** every existing print surface is a room object; this one is an inventory item. The engine path reads as if it works (inventory click → `handleObjectInteraction` → print branch before the range check, interactions.js:1231), but it is unproven, so it is playtest step 8. If it fails, the fallback is moving `hasFingerprint` to the locker. |
| 2 Hold the keycard | **Done** | "[I'll need access.]" is sticky and answers "Not yet. Talk to all three first…" plus a line per suspect not yet seen, until each is interviewed or KO'd (ink function `interviews_done()`). It is hidden once the player holds a printed badge. "[I have a name forming.]" is now gated on the interviews instead of the card; "[I'm ready. Let me work.]" is always there, so the hub never empties. HaX's server-room answer explains both routes. |
| 3 Audit check resumes with its question | **Done** | `audit_q1`–`audit_q4` removed; each question sits in its `audit_cN` after the state guard. A reopen mid-check now replays the question. |
| 4 "[I'll need access.]" after the give | **Done, different shape** | `take_keycard` no longer exists. The successful clone branch ends with `#exit_conversation`, so the next talk re-evaluates the hub. The "until a reload" report was not browser-checked. |
| 5 `mission_complete` on the backstop | **Done** | All nine room-entry backstops set it. |
| 6 Objectives | **Done** | Aim 3 description reworded. New required task `get_suite_code` in "Confront The Mole", completed by `closing_debrief` mappings that wait for `all_flags_submitted` (five at first; round 2 removed one that could never fire, leaving four). |
| 7 HaX flag-4 text when already named | **Done** | Two mappings, disjoint on `named_on_evidence`, same `setGlobal`. |
| 8 All-flags text on the Netherton-KO path | **Done** | Split on `netherton_ko`. |
| 9 m07 intercept loop | **Done** | Case file item 3 and HaX's flag-3 text tie the mail to the safetynet.gov sender stripped off the intercept. m07 untouched. |
| 10 "Do it quietly" costs something | **Done** | HaX texts on an early accusation; the confrontation line ("I had the whole night to tidy up after that, and I didn't. Think about why.") is now its own block, so it plays alongside the door-log line. |
| 11 PIN cracker payoff | **Done (lines only)** | ATHENA: "still signed out to Agent 0x47, as it has been since St. Catherine's" (no location claim, since his desk is bare). New optional confrontation choice "[Every mission, the PIN cracker stayed on your bench.]". Giving the device to the player stays an approval item. |
| 12 USB encodings | **Done** | Observation no longer names Base64/ROT13. |
| 13 Two Ciphers | **Done** | One optional Cipher choice; he had the handle first and wants to know who told ENTROPY it was his. No rename. |
| 14 HaX door-log answer | **Done** | Adds "Facilities set that passphrase, and facilities write things down. Kettle." |
| 15 Debrief "from his files" | **Done** | Now "from the vault". |
| 16 Phantom's look | **Done (recast in round 2)** | First `male_telecom_v2`; the playtest found its hi-vis vest read as facilities, so round 2 moved him to `male_office_worker_v2`. |
| 17 Stale comments | **Done** | erb HaX nudge mapping, confrontation NPC comment, confrontation ink. |
| 18 `mission.json` | **Done** | Argument injection; "dead drop" and "Password cracking" removed; "RFID cloning" kept (now true); "Fingerprint lifting" added. |
| 19 Field-guide timing | **Done** | Secrets-in-git-history moved to flag 1; vulnerability analysis moved to the launcher. |
| 20 Graph metadata | **Done, one exception** | Post-it unlocks archives and the printer; Netherton has two `puzzle_graph_actions` (clone; audit reading); `puzzle_graph_links` join cloner → clone → server-room door, timeline/auth excerpt/audit → audit reading → suite door, and kit → USB stick. The printer's duplicate node is gone. The safe keeps its duplicate: without `puzzle_graph_unlocks` on the safe the validator doesn't read the code card inside it and warns that the suite door is unmapped. |
| 21 Seat Nightshade in the suite | **Done** | `setVisible: true` on `all_flags_submitted` and on room entry with the case made. Checked against `room_security.json` geometry only: (5.0, 4.2) is in the gap between the two tables, just above a chair; needs a look in the browser (playtest step 14). |
| 22 Flag order / lab-sheet URLs | **Not done** | Needs a SecGen build and a HacktivityLabSheets push. |
| 23 Scripted `You:` lines | **Not done** | Dialogue stage. |
| Canon: Nightshade's "cohort" | **Done** | He has fifteen years' service and **taught the player's intake** (m01 has the player new). Changed: Netherton's suspect line, the debrief "Training…" line, three confrontation lines and a narrator line, the dossier, the personnel printout, both Nightshade voice styles and his lab observation. HaX "trained with him" stays: she has about fifteen years in. |
| Canon: Netherton's tenure | **Done** | "I have run field operations for five years." |

### Check results

- Ink: all six edited files recompiled with `bin/inklecate`, no errors or warnings; .json in step.
- `ruby scripts/validate_scenario.rb`: 0 errors, 2 warnings, both pre-existing and intended (§1).
- `python3 scripts/check_door_alignment.py`: all doors OK.
- Rendered JSON (`tools/pass2/render.rb`) with 26 assertions (scratchpad `m08_assert.py`): clone wiring and card name, one `card_cloned` mapping, print surface and mapping, flag-4 and all-flags splits, guide moves, backstop, suite-code task and its gating, Phantom's sprite, the seated confrontation, graph, case file, globals, credits in both credit blocks, E18, no "cohort"/"eleven years" left. All pass.
- `reopencheck.mjs … m08_the_mole`: 0 problems (phone NPCs). `scripts/ink_runtime_check/missions.json` gained the two new m08 globals.
- inkcheck/loopcheck state matrix (scratchpad `m08_matrix.sh`, 37 states over Netherton (fresh, return, interviews done/partly/KO'd, access offered, cloned, printer badge, each audit stage, each `audit_cN` entered directly, `clone_card`/`clone_debrief`), the confrontation (five states incl. fate set), the phone (five), Cipher, the opening and the debrief): 37/37 inkcheck clean, 37/37 loopcheck no runtime errors.

### tagdiff (intended differences)

`tagdiff.mjs scenarios/m08_the_mole/`: 80 structural differences, all intended.
- **Netherton (64):** `take_keycard` and its `#give_item`/`gave_keycard` removed (fix 1); `access_request`, `access_offer`, `clone_card`, `clone_debrief` added with `#clone_keycard:server_zone_badge` and `#exit_conversation` (fixes 1, 2, 4); `interviews_done()` and synced VARs `cipher_interviewed`, `phantom_interviewed`, `nightshade_interviewed`, `phantom_ko`, `badge_cloned`, local `access_offered` (fix 2); hub choices re-gated (access, clone, name forming, ready); `audit_q1`–`audit_q4` removed and their diverts retargeted to `audit_c1`–`audit_c4` (fix 3).
- **Confrontation (8):** VARs `nightshade_print_lifted`, `asked_cracker`; the PIN-cracker choice (fix 11); the print condition (fix 1). The accused line moved from a multi-branch block to its own block; tagdiff counts the condition text as the same.
- **Phone HaX (2):** VAR `netherton_card_taken` and the "already have access" branch.
- **Cipher (6):** VAR `asked_handle` and the handle choice (fix 13).
- Opening and debrief: prose only.

### Spoken lines added or changed

About 44 (m08 audio isn't generated yet, so no cost now).
- Netherton ink: Netherton 10 (tenure, cohort, "Not yet…", three "You have not seen…", "Then, access…", "Stand where you like…", two clone sign-off lines); Narrator 5 (lanyard, step up, "He does not look down", "did not get a clean read" and, in the confrontation, "after everything he taught you"). The two old `take_keycard` lines are gone.
- Confrontation: Nightshade 7 (cohort ×3, accusation, print, PIN cracker ×2).
- Debrief: Netherton 2. Opening: ATHENA 1. Cipher: Cipher 1, Narrator 1.
- HaX phone ink: 4 (three server-room answers, the door-log answer).
- HaX texts in the erb: 11 (flags 1, 2, 3; flag 4 named; all-flags KO version; Netherton KO; printer; clone; print; accusation; launcher).
- Player choice text added: 3 (clone, handle, PIN cracker).

### For the user or the engine

- Flag order against a real SecGen build, and the HacktivityLabSheets push for the six guide URLs (fix 22, carried).
- Giving the player the PIN cracker in the finale (rationing rule): not done, line-only payoff.
- Engine: an open person-chat doesn't hear global broadcasts (§6); the clone and print flows rely on the post-minigame resync instead.
- Engine/test: a print surface on an inventory item has no precedent; the playtest decides whether it needs engine work or a move to the locker.
- `scripts/ink_runtime_check/missions.json` (shared tooling file) was edited in m08's section only.

### Backlog ideas from this pass

- Fingerprints: let the dusting panel show "where it came from" for inventory items, and let the "Search Room" highlight include carried items with prints.
- RFID: a short "card read" flourish in the cloner for EM4100 (UID only, no crypto) versus MIFARE, so the teaching point HaX makes is visible in the minigame.
- Objectives: a task that lists remaining sub-steps ("Seen: Cipher, Phantom") would let the access gate show progress without Netherton listing names.

### Round 2 (2026-10-02)

Sources: `DESIGN_REREVIEW_1.md` and the playtest report `tools/playtest/m08-pass4-report.md`. In the playtest every priority check passed, including the clone and the print lifted off the USB stick.

| Item | Status | What changed |
|---|---|---|
| M1 nothing sends the player back to the Director | **Done** | HaX sends one text once all three suspects are seen: "That's all three. Now go and see the Director about the server room. Take the cloner." Mapping conditions are `&&`-only (PASS2 lessons), so six mappings first set `cipher_seen`, `phantom_seen` and `nightshade_seen` (from interviewed or KO). The text then fires from whichever latch lands last. It is skipped if the Director is down, the player already has a way in, or `access_nudge_sent` is already set. |
| m1 print counts on any lift | **Done** | Any lift (`fingerprint_collected:nightshade`) now only sends HaX's hedged text. Only the match (`fingerprint_identified:nightshade`) sets `nightshade_print_lifted`, which drives the credit and the confrontation line. |
| m2 reload before the print click | **Done (script)** | Added to the confirmation run below. |
| m3 stale comments | **Done** | The Director-KO and confrontation safety-net comments now match the code. |
| m4 dead `get_suite_code` handler | **Done** | Removed. Four handlers remain, and the docs now say four. |
| m5 KO after the fate contradicts the fate | **Done** | The safety net also sets `nightshade_ko_before_fate`. The "knocked down before he could answer" credit and the debrief's KO branch read that global instead of `nightshade_confront_ko`. |
| m6 voice bible | **Done** | Edited only the lines that mention m08's Netherton and Nightshade: the tenure quote, the continuity and voice-name notes, both m08 style rows, and the three drift rows (now closed). |
| m7 "reading your mail for fifteen years" | **Done** | Changed to "…the man who put me here fifteen years ago." |
| m8 Netherton's reason for refusing the card | **Done** | Now: "I am not handing my card to anyone tonight. The mole reads this building's paperwork, and a hand-over is paperwork." |
| m9 line lengths | **Partly (trimmed my own lines)** | Shortened HaX's clone, printer and all-flags-KO texts, the three phone server-room answers and the door-log answer. Also cut the cohort replacements in Netherton's suspect line, the debrief and two confrontation lines back to their original length or shorter. Lint is down from line-len 88 / text-len 13 to 85 / 11. Older over-length lines are left for the dialogue stage. |
| P1 nothing points at Emulate after a reload | **Done** | HaX's clone text now ends "At the reader, emulate it from the cloner's Saved list." Her server-room answer, once the card is cloned: "Open the cloner, pick his card from Saved, emulate it. EM4100 has no crypto; the reader can't tell." This also brings back the EM4100 teaching point that the trim took out of the clone text. |
| P2 flag 4 says "put whatever's left through the relay" when nothing is left | **Done** | That sentence is gone from both flag-4 texts. It is now a separate text on `mole_identified`, delayed 5 s, with `skipIfGlobal: all_flags_submitted`, so it only arrives when a flag is still outstanding. |
| P3 "I need a field guide" shown too early | **Done** | It was already gated on a guide being offered; in the playtest one had been (recon, on entering the server room). It is now also hidden once every offered guide has been taken. |
| P4 Phantom reads as facilities | **Done** | Phantom is now `male_office_worker_v2` (shirt and tie). The break-room off-duty agent, who had that sprite, moved to `male_hacker_hood_v2`, which has a talk sheet but no viseme sheet, as in m06. Not Netherton's sprite and not Nightshade's. |
| P5 Nightshade stands, the text says he sits | **Done** | The text now says he stands. The narration and his observation read "stands at the table with both hands flat on it". There is no sitting pose, so I didn't move him. |
| P6 "I did not see it" line goes past unseen | **Done** | `clone_debrief` now ends on "[Understood, Director.]", and the exit tag fires on that choice. A reopen at that point replays the two sign-off lines, which is harmless. |

**Checks (round 2):**
- ink recompiled (four files);
- validator 0 errors with the same 2 intended warnings;
- doors 8/8;
- render asserts 37/37 (`scratchpad/m08-fixer/m08_assert.py`; new checks for every item above, including no `||` in any mapping condition);
- reopencheck 0 problems;
- tagdiff 89 differences;
- inkcheck/loopcheck matrix (`scratchpad/m08-fixer/m08_matrix.sh`, 40 states, including the failed clone, a cloned phone, a taken guide and the KO-before-fate debrief): 40/40 inkcheck clean and 40/40 loopcheck clean.

**Further tagdiff differences (89 in total, 9 more than round 1, all intended):**
- Debrief: VAR and condition `nightshade_confront_ko` → `nightshade_ko_before_fate` (m5).
- Netherton: `clone_debrief` reshaped to a guard, two lines and a closing choice that carries `#exit_conversation` (P6).
- Phone: VAR `netherton_card_cloned`, the cloned branch (P1) and the stricter field-guide gate (P3).
- `missions.json` (m08 block) gained `access_nudge_sent` and `nightshade_ko_before_fate`.

**Spoken lines in round 2:**
- New:
  - HaX texts: hand-back and "put the rest through the relay".
  - Phone: the cloned server-room answer.
  - Player choice "[Understood, Director.]".
- Changed:
  - HaX texts: clone, printer, all-flags KO version, flag 3, both flag-4 versions.
  - Phone: three server-room answers and the door-log answer.
  - Netherton: access refusal, both clone sign-off lines, the suspect line.
  - Nightshade: three lines.
  - Narrator: the confrontation opener.
  - Debrief: one line.

About 22 lines in all.
