# m03 Ghost in the Machine: dialogue review (pass 4)

Script editor's pass over every ink file and the player-facing text in `scenario.json.erb`, following `docs/agents/PASS4_BRIEF.md`, the dialogue style guide, the voice bible and the humanizer rules. The `npc-dialog-review` skill was run in full first; its findings are in section 1, the rewrite in section 2.

Baseline snapshot (ink + erb) and `lint-before.txt`: `scratchpad/m03-dialogue/`.

## 1. Skill findings

### Phase 1 — compile and validate

- **Compile:** 8 ink files, 0 failures. No loose-end warnings.
- **Validator:** no INVALID. Two pre-existing "missing recommended behavior" warnings on the two hidden reception_lobby cutscene NPCs (`night_transition` and the player-portrait narrator used by the night scene), plus the intended no-background warning noted in `DESIGN_REVIEW.md` round 2. None new, none caused by this pass.

### Phase 2 — dialogue review

**2a. Attribution & narration — OK.** Every prefix resolves (`Agent HaX`, `Director Magnus Netherton`, `Agent 0x47 'Nightshade'`, `Victoria Sterling`, `Danny Foster`, `Security Guard`/`#speaker:npc`, `Receptionist`, `Narrator`). Phone and briefing use `#speaker:agent_0x99`; person files use inline prefixes. Emotes are delivery cues inline; scene actions are on `Narrator:` lines. No over-promotion of gestures to narration.

**2a-bis. Supported by the scenario — OK.** Directions match `connections` (reception → main hallway → conference/server room; executive wing east; Danny's office south of the wing). The whiteboard, plaque, drive, safe, laptop and drop-site all exist as objects. `#give_item`/`#clone_keycard` tags match `itemsHeld`/mappings. The night guard patrols (waypoints), so "rounds every fifteen minutes" holds. No stage direction describes movement a still NPC can't perform.

**2a-ter. Voices — OK.** Every speaking NPC has a `voice` block; no voice shared by two characters who appear together. HaX, Netherton and Nightshade match their voice-bible entries. The one-mission cast (Cardiff receptionist, RP Sterling, Essex guard, Nottingham Danny) reads distinct with the names covered.

**2b. Player choices are spoken dialogue — CONCERN (fixed).** The whole mission carried the `You:`-echo pattern: a menu-label bracket followed by a `You:` line saying the real words. 77 echo lines across briefing (20), debrief (18), guard (19), Victoria (25 You: lines, 13 of them echoes), receptionist (5) and phone (3). Danny's confrontation also scripted the player's speech in `You:` lines after a short bracket. All folded; see section 2.

**2c. Hub structure — OK.** `start`/`hub` present; sticky `#exit_conversation` exits reachable; no stray `-> END` outside briefing/debrief.

**2c-bis. Starved knots — OK.** loopcheck over the state matrix (section 3) hit no `ran out of content`. The three one-option `+` choices added to Danny's fate knots each sit in a knot entered once, so no starvation risk.

**2d. Choices that matter — OK.** Briefing choices set `player_approach`, `handler_trust`, `knows_m2_connection`, `called_it_murder`; the guard's cover choices set `guard_told_safetynet`/`guard_bribed`; Victoria's interview tracks `victoria_influence`/`victoria_suspicious`; the confrontation sets `victoria_fate`; Danny sets `danny_fate`. All are read back in the debrief or by Victoria's night opener. The confrontation is legitimate stance-convergence (she is an immovable believer) and records the stance. No flat clusters; no `#set_global` set-but-never-read introduced.

**2e. Cross-file state — OK.** No `#set_global` added or removed by this pass (tagdiff STRUCTURE UNCHANGED on all files bar Danny; Danny's change is choices only, no new globals).

**2f. Influence & feedback tags — OK.** Every `influence +=` kept its `# influence_increased`/`# influence_decreased` tag through the fold (tags live in choice bodies, untouched).

**2g. Syntax — OK.** No `**bold**`, no list dialogue, no line starting with `*`.

**2h. KO-resilience — OK (writing side).** The debrief's receptionist-KO and Victoria-KO/day-KO branches still read correctly; no rewritten line assumes an NPC is conscious whose body may be down. (Mechanical verdict stays with `scenario-design-review`.)

## 2. Changes made

Mission-local only (ink + erb). Nothing committed. Approach throughout: fold every `You:` echo into its choice (choices are now the player's first-person words); split over-cap lines; cut AI tells and inflated framing; keep gameplay facts first and findable; UK English and "Cyber Security"; security detail at citation level. Recurring names ("Foster") keep tripping the `banned-word` rule — those are false positives on the surname and are listed as justified.

### m03_opening_briefing.ink
- Netherton's 49-word opener split into four short declaratives (formal, hands over fast — voice bible). Keeps "Operation Cyber Arsenal".
- All 20 `You:` echoes folded into their choices. HaX's "Here's what matters:" filler opener dropped.
- Over-cap lines trimmed: the St. Catherine's recap, topic_victoria (two lines), topic_clone (reception/executive two-stage lines), Nightshade's capture-and-replay line, the kit line.
- **Nightshade's m08 foreshadow kept and made its own short beat:** "One day it'll be our badge somebody clones. Remember how easy it was." (subtle, no wink).
- "most valuable thing" → "what matters most" (banned word `valuable`).
- The player's "That's not a trade. That's murder..." lost its "not X, Y" frame; the choice is now "That's murder with an invoice attached." (`called_it_murder` tag kept).
- Lines changed: ~22 spoken lines + 11 choice brackets. Tagdiff: STRUCTURE UNCHANGED.

### m03_phone_agent0x99.ink
- 3 `You:` echoes folded (revelation-call choices). The "That's not negligence, that's a pricing decision" echo reworded to "They charged a premium to hit a hospital. They priced the harm in." (drops the tell).
- 9 over-cap phone lines split to ≤25 words: the RFID, lockpicking, distcc-exploitation and recon guide replies, the two rfid/lockpicking hints, the network hint, both revelation-call lines, the KO-card line. Tool names (e.g. the custom-key recovery attack) left at citation level — the field guides carry the detail.
- Lines changed: ~15 spoken lines + 3 choices. Tagdiff: STRUCTURE UNCHANGED.

### m03_npc_receptionist.ink
- 5 `You:` echoes folded. "cybersecurity" → "Cyber Security" (×3).
- Lines changed: 5 choices + 3 spoken. Tagdiff: STRUCTURE UNCHANGED.

### m03_npc_guard.ink
- 19 `You:` echoes folded across the excuses, the bribe and the SAFETYNET reveal. Two knots now open on the guard's reaction rather than a scripted player line (`offer_bribe`, `safetynet_reveal`), with the player's words moved into the originating choices; the guard's questions still have something to react to.
- The 35-word "persuade with more lies" line folded into a short choice.
- Lines changed: ~18 choices/spoken lines. Tagdiff: STRUCTURE UNCHANGED.

### m03_npc_victoria.ink
- 13 `You:` echoes folded (first impression, philosophy, ethics, clone small talk, clone debrief). "stands as you enter" → "rises as you come in" (inflated). "valuable discoveries" → "fair pay for what they find" (banned word).
- Her last recruit line trimmed to 30 words; the confrontation choice trimmed from 19 to 13 words.
- Kept: her one permitted villain contrast, "That isn't cruelty. It's arithmetic.", and the confrontation set-piece player lines (a scene, not echoes).
- Lines changed: 13 choices + ~4 spoken. Tagdiff: STRUCTURE UNCHANGED.

### m03_closing_debrief.ink
- 18 `You:` echoes folded. Three player "This isn't X. It's Y" lines reworded as plain statements. Five over-cap HaX lines split (anonymous-advisory, Danny-protected, the paper-trail line, the two catalogue-advisory lines). The paper-trail line lost its "we don't just... we have" shape and a rule-of-three.
- Lines changed: ~16 choices + ~8 spoken. Tagdiff: STRUCTURE UNCHANGED.

### m03_danny_choice.ink (structural, deliberate)
- The scripted player speeches were rebuilt to the style guide's own Danny pattern (§7): the opening line folds into the originating choice, the NPC reacts, and a **one-option `+` choice** carries the player's second beat before the fate tag fires. This adds three `+` choices (one per fate knot) — the only structural change in the pass. All tags, globals, diverts and the `the_question` choices are unchanged; tagdiff reports exactly those 3 added choices and nothing else.
- The 34-word Danny line split; the `expose` continuation choice trimmed to ≤15.
- Lines changed: 3 opening choices reworded, 3 continuation choices added, 7 `You:` lines removed.

### m03_night_transition.ink
- Reviewed, unchanged. Three atmospheric `Narrator:` lines, already short; tagdiff STRUCTURE UNCHANGED.

### scenario.json.erb (timed texts)
- Four over-30-word timed texts trimmed to ≤30, fact first: the lockpicking-corridor text, the VM-terminal text, and both all-flags texts. The two all-flags pairs (normal + revelation-call duplicate; day-KO + revelation-call duplicate) were edited together so each pair stays identical, as the in-file comment requires. The direction ("Danny's office in the executive wing, go there first, then Sterling") is preserved in each.

## 3. Verification

| Check | Result |
|---|---|
| ink compile | 8 files, 0 failures |
| tagdiff (each file vs before-snapshot) | STRUCTURE UNCHANGED on 7 files; Danny: 6 diffs = the 3 intended one-option `+` choices, nothing else |
| validator | no INVALID; only the pre-existing no-behavior / no-background warnings |
| door alignment | OK (6 doors) |
| erb render | validator and dialoguelint both parse the rendered scenario; 4 trimmed texts present |
| reopencheck m03 | **0 problems** |
| loopcheck (state matrix, all 8 files, entry + night/fate variants) | clean, no runtime errors or runaways |
| inkcheck (changed files) | clean, failing=0 (hubs cap as expected) |

### dialoguelint before → after (by rule)

| Rule | Before | After | Note |
|---|---|---|---|
| you-after-choice | 77 | 0 | all folded |
| line-len (ink) | 28 | 0 | all split |
| text-len (erb) | 6 | 0 | all trimmed |
| not-x-but-y | 6 | 1 | remaining one is Victoria's permitted villain contrast |
| banned-word | 14 | 10 | all 10 are the surname "Foster" — false positives |
| choice-len | 2 | 0 | — |
| cyber-security | 3 | 0 | → "Cyber Security" |
| inflated | 1 | 0 | "stands as" reworded |

`lint-before.txt` / `lint-after.txt`: `scratchpad/m03-dialogue/`.

Spoken lines touched: roughly 60 changed and ~55 `You:` echo lines removed across 7 ink files, plus 4 timed texts. m03 audio is not yet generated, so no TTS cost.

## 4. Script edit round

Response to `DIALOGUE_EDIT_NOTES.md` (verdict "revise (light)"), with the orchestrator's calls on section 4a. Round-1 ink kept at `scratchpad/m03-dialogue/ink-round1/`; tagdiff below is still against the original `ink-before/`. No erb changes this round.

**Must-fix**
- **M1, M2.** Victoria's arrest and escape echoes deleted. Brackets now carry the words: "[You're not walking out of here. Bag down, hands where I can see them.]" and "[Go. I've got what I need off your servers. You're just the signature now.]". The escape narrator line loses its second sentence (it told the player what they thought).
- **M3.** Danny protect: "[Sterling goes down for her part. You don't have to go down with her -- but you tell them everything.]", so "Everything. Yes. God, yes." answers something again.
- **M4.** Briefing: "[What else are they planning?]" / "There's a Phase 2. That's the other thing you're going in to find."
- **M5.** Victoria: "[And you don't care what the buyers do? That's wilful ignorance.]"

**Victoria's twelve `You:` lines (4a), all gone**
- Two one-option choices, as the editor recommended and the orchestrator approved: "[Forty per cent extra for a hospital. You priced the bodies in.]" (nested `++` under the St. Catherine's choice, so her "I priced the urgency in" answers the click) and "[That's the story you tell yourself so you can sleep.]" (gives the player a beat in her six-line run, before "I sleep perfectly").
- Seven folded: the whiteboard question into the hub bracket; both eager-recruit walk-backs into one bracket with an inline `{receptionist_ko:…|…}` text alternative (the knot stays choice-free); "This lab can't have been cheap to build."; "Do you offer any formal certifications?" with "Nearly there. Keep her talking." moved ahead of the menu; the recruit bracket now ends "…and I'll fight for a deal. Not immunity."
- "When." removed; she carries it: "The window opens in weeks."
- "Then I'll take whoever sits at it next" cut with its opaque body-count reply.

**Should-fix**
- **S2.** Victoria's contrasts cut to one per scene: afternoon `:211-212` reworded ("Exploit sales happen with or without us."), night recruit line now "You didn't move me. You're simply a better bet than a shallow grave.", escape line now "St. Catherine's was a proof of concept. You'll see the rest." Kept: "The question isn't whether systems will fail…" (her afternoon thesis) and "That isn't cruelty. It's arithmetic." (night).
- **S3.** "Darkside" named in the briefing and both phone lines, matching the RFID minigame's button.
- **S4.** Phone: "Work the lock only when the guard's back is turned."
- **S5.** Guard: "[There's an HVAC fault upstairs. If it trips overnight, this floor cooks.]"
- **S6.** Debrief aggressive callback: "You went in hard and stayed hard. I won't argue with it." (neutral, because `aggressive` can also come from the speed choice).
- **S7.** Danny leave: "[Yours is the only one that'll hold. Make it.]"
- **S8.** Netherton: "Zero Day Syndicate used to sell exploits to whoever paid. Now they choose the targets first."
- **S9.** Menu labels to speech: guard hub (bribe choice now "[Maybe we can work something out.]", so "Are you trying to bribe me?" has something to answer), its two "[Continue]"s, "[Wait, wait! Hear me out.]", the patrol exit; receptionist hub, sign-in choices and three "[Continue]"s; Victoria hub topics and exit; phone hint menu, guide requests ("Can you send me the … guide?"), "[Continue]".
- **S10.** Debrief: the St. Catherine's bracket, "You didn't just close a case" → "You handed us the shape of the thing.", the marathon line → "They are. And every one of them bought from Zero Day.", "tonight" → "last night", and the tidy close "That reaches a lot further than one building" cut. "one step closer to the Architect" (×2) → "the Architect has one fewer supplier".
- **S11.** UK English: "programmes", "in the car park when I leave at six", "towards" (×2). Every Unicode em dash in the ink replaced with `--`.
- **Optional items taken.** HaX stock lines: "Trust your instincts", "You've got this", "Make this count", "That's what I wanted to hear. Stay safe.", "Well done", "Good work", "Listen carefully". Briefing "Obfuscation, not security." → "None of it is security."; guard's repeated "fifteen minutes"; phone "priced the harm in" → "That's intent, on an invoice." (so it no longer pre-empts Victoria's "priced the bodies in").
- **Not taken.** The receptionist's pre-existing "Ms. Sterling usually authorises visitors herself" (`:52`) and the briefing's "operational lead of the cell" vs "0day leads the cell": both are design-level facts rather than this round's prose, so I've listed them for the orchestrator.

**Checks**

| Check | Result |
|---|---|
| compile | 8 files, 0 failures |
| tagdiff vs original snapshot | 6 files STRUCTURE UNCHANGED. Danny: the 3 round-1 one-option choices (6 diffs). Victoria: 8 diffs, all intended: the two new one-option choices and their choice counts; the St. Catherine's parent choice now reaches `the_reckoning` through its nested choice (same target, one level down, so it reports as removed/added); and the `receptionist_ko` text alternative in the eager-recruit bracket. Saved: `scratchpad/m03-dialogue/tagdiff-victoria-round2.txt` |
| dialoguelint | 0 errors. Warnings: `not-x-but-y` 1 (Victoria's permitted line); `choice-len` 2, both the editor's specified big-moment brackets (Danny protect 19 words, Victoria recruit 18). `banned-word` now 0 (the lint no longer flags "Foster"). `You:` lines: 0 in every file |
| reopencheck m03 | 0 problems |
| loopcheck | 25/25 clean, including Victoria's night states (`night_confrontation_ready` with and without `usb_seen`, `roster_seen`, `receptionist_ko` + `guard_told_safetynet`), her afternoon walk-back states, the fates, Danny, guard, receptionist, phone and revelation call, briefing, two debrief mixes, and the night transition |
| inkcheck | clean on Victoria's confrontation, Danny, debrief and briefing |
| validator | no INVALID; the erb is untouched this round |

Medians after this round: guard 8, Danny 11, Victoria 12, receptionist 12, briefing 14, phone 14 (max 25), debrief 17 (max 30).

Lines touched this round: about 30 spoken lines and about 45 choice brackets, across 7 ink files. Not yet read on screen: the night confrontation with its two new clicks, which the editor suggests checking once for pace.

## 5. Playtest round

Response to `tools/playtest/m03-pass4-dialogue-report.md` (no hook failures; eight fixes requested). Round-2 ink and erb kept at `scratchpad/m03-dialogue/ink-round2/` and `scenario-round2.json.erb`; tagdiff below is against those.

**1. Perfect Stealth after a challenge.** New global `guard_challenged`, set by a tag where the guard first stops the player at night (`m03_npc_guard.ink`, `start`). It's declared in `globalVariables`, in the reopencheck fixture and in the debrief and phone inks. Perfect Stealth now also requires `not guard_challenged` in the debrief opener and the credit. The aim and task text now say "never stopped". A challenged player who lied their way on gets a line of their own: "The guard stopped you and you lied your way on. He never caught you at a lock, but he'll remember your face." The "never gave him the chance" line excludes a challenge too.

**2. Revelation call.** "Pull the rest… the drive in her desk" and "If you find the directive" now play only if the drive hasn't been found. If the player has the drive but hasn't decoded it, HaX asks them to decode it. If they've decoded it: "And it lines up with the directive you read me. Phase 2 has a supplier, and now a ledger."

**3. "Where do I stand?"** now reads state:
- Afternoon: staff badge or not.
- After all four flags: Danny or Sterling next, and the drive if they want leverage.
- During the night: flags (none / some / three in), an undecoded drive, an unread office, and the guard (told, bribed, caught at a lock, challenged, or not met).
Synced globals were added to the phone ink for this.

**4. Guard.** "[I'm with SAFETYNET. This is an active ENTROPY investigation.]" is now on the first excuse menu as the honest option, and stays on the suspicious path. The unmotivated HVAC lie after "I work here" is now "[Ring Ms. Sterling if you like. She'll vouch for me.]", answered with "I'm not ringing the boss at this hour on your say-so."

**5. Naming.** HaX says "CyberChef workstation", which is the object's name, in the phone hints, the drive call and the erb toast. "Drop-site" is now always "drop-site terminal", which is also the object's name, and the briefing glosses it once: it "takes your flags and sends them straight to me".

**6. Receptionist.**
- The clone option is now "[Lean in to read the building directory.]", and the narrator line that repeated it is cut.
- The sign-in request and clipboard no longer replay after the WhiteHat detour.
- "Midnight work sessions?" now gets an answer about midnight.
- "[She is. Goodnight.]" gets a reply.

**7. Blank hub screens.** The receptionist hub, Victoria's afternoon hub and Victoria's `idle` resting knot each open with one short line on re-entry:
- the receptionist: "What else can I help with?" and variants, or "I'm just off" at night;
- Victoria: "Go on." / "What else?" / "Ask.", or "Was there something else?";
- the night confrontation: "Sterling hasn't left…";
- on the phone, or if she's out cold or her fate is decided: a narrator line.

Every exit sets a quiet flag (`hub_quiet` / `idle_quiet`). The resting knot skips its line once and clears the flag, so a goodbye never shows a stray greeting in the same batch (person-chat shows the whole batch before closing). A reopen or a topic loop shows the line. The choices still live in the same knot, so the re-navigation rule is unchanged. Checked by simulating each case with the game's `ink.js`:
- the receptionist's goodbye batch holds only the farewell, and a reopen shows "What else can I help with?";
- Victoria's afternoon reopen shows "Was there something else?", and her night reopen shows "Sterling hasn't left…" with "Sterling. We need to talk."

**8. The worst lines.**
- The stealth line now fires only when it's true.
- HaX's mentor filler is gone: "I know you'll do this right" became "Come back in one piece", "That's why you're good at this" became "Then watch her, not the room", "Final word" was cut, and the "That's you. Don't lose it" line became "You did the technical work and still saw the people in it. Keep doing both."
- Briefing asides: the US-dollar aside was cut, "a source inside beats a cell we can't see into", "No PIN cracker this time", "Fine. Just don't leave the logs behind."
- "[Did Zero Day sell Ghost the way in?]" replaces a statement the player couldn't know yet.
- Debrief: "Rest first." no longer promises a debrief inside the debrief; the "nuance" line became "You gave him room to come in by himself. That's why he did."; "Correct. And coordinated…" became "It is. And timed across cells."
- Eager-recruit brackets: "Sorry about earlier. Freelance habit -- I test every client's story." and, after a receptionist KO, "Nobody was at the desk, so I found my own way in."
- Afternoon Victoria is sharper: "You'd be amazed how many people choke on that sentence.", "Indignation is cheap, and it pays nobody's rent.", "I know which I'd rather fund." (which also ends her "the question…" tic), and "Nothing in there is a toy. My students break real things."
- The guard has some character now: "It's an office, mate.", "Pays the mortgage. And nobody talks to me after nine, which suits me.", "Signs my wages, never learnt my name.", "Like you, possibly.", "Gets visitors who don't look like they've ever owned a tie.", "I never saw you. I'm good at that, as it goes."
- Phone ink: HaX's own `Agent HaX:` prefix is dropped throughout, as the pass-4 brief asks. The engine stripped it anyway; the playtest saw no prefixed bubbles.

**Structure changes (tagdiff against round 2, all deliberate):**
- **debrief:** `VAR guard_challenged`; the Perfect Stealth and "never gave him the chance" conditions gain `not guard_challenged`; one new conditional for the challenged-and-lied line (6 diffs).
- **guard:** `#set_global:guard_challenged:true` in `start`; one new `*` choice in `first_excuse` → `safetynet_reveal` (5 diffs).
- **receptionist:** `VAR hub_quiet`; quiet-flag assignments on the start greeting and the four exits; the hub's re-entry conditional; `not topic_company_history` around the sign-in lines (12 diffs).
- **Victoria:** `VAR idle_quiet` and `hub_quiet`; quiet-flag assignments on her 11 exits and the start greeting; re-entry conditionals in `hub` and `idle` (28 diffs).
- **phone:** 8 synced `VAR`s; `report_progress` conditionals; the revelation-call conditionals (28 diffs).
- **briefing, Danny, night transition:** STRUCTURE UNCHANGED.

No knots, diverts or existing tags changed. The erb gains one global and edits to the credit condition and four text strings. In `scripts/ink_runtime_check/missions.json` (shared), the m03 block gains `guard_challenged: false`. The file was re-serialised in its original two-space format, so its diff against HEAD shows only uncommitted key additions: that line plus earlier uncommitted ones, including other missions'.

**Checks**

| Check | Result |
|---|---|
| compile | 8 files, 0 failures |
| dialoguelint | 0 errors. Same three warnings as the script edit round: Victoria's permitted contrast, and two big-moment choices |
| reopencheck m03 | 0 problems |
| loopcheck | 32/32 clean. Covers receptionist start, hub and night; Victoria start, hub and idle by day, on the phone, at night, KO, and after her fate; guard night start and `first_excuse`; phone `report_progress` in five states; the revelation call (no drive, drive found, drive decoded); debrief challenged / stealth / told; briefing, Danny, night transition |
| inkcheck | clean: guard `first_excuse`, debrief (challenged), phone `report_progress`, receptionist |
| re-entry simulation (game `ink.js`) | as described under 7 |
| validator | no INVALID; warnings identical to round 2 |
| door alignment | 6/6 OK |

Scratch: `scratchpad/m03-dialogue/` (`tagdiff-round3-*.txt`, `lint-round3.txt`, `loop-round3.txt`, `reopen-round3.txt`, `validator-round3.txt`, `reentry.cjs`).

Lines touched this round: about 45 spoken lines, 12 choice brackets and 4 erb strings. About 10 of the spoken lines are new: the re-entry lines, the challenged-guard debrief line, the receptionist's goodnight, and the `report_progress` variants.

## 6. Final confirmation round

Response to `tools/playtest/m03-pass4-final-report.md` (8/9 passed). Round-3 ink and erb are kept in `scratchpad/m03-dialogue/ink-round3/`. The erb is unchanged this round.

- **Guard re-entry.** The guard now uses the same quiet-flag pattern as the receptionist and Victoria. His hub opens with "Anything else, or are we done?" / "Go on, then." / "Still here?". `guard_idle` opens with a narrator line that depends on the state (day, night, hostile). All 21 exits set `idle_quiet`.
- **Receptionist at night.** New `night_greeted`. On the first visit she's rummaging in a drawer, then says "Oh! You made me jump…". On a return visit: "I'm just off, honestly." / "Still looking for that charger. Night!"
- **Danny's return visit.** He gets his own line for each fate ("I've made the call." / "I'm still here. I said I would be." / "Still deciding." / "He hasn't moved."), skipped once after an exit (`rest_quiet`).
- **"Where do I stand?"** The day text is now keyed on `clone_call_done`, and there's a line for the gap between saving Sterling's card and the eleven o'clock scene.
- **Small items.**
  - Briefing: "She's the front's CEO, and she runs this end of the cell for 0day." The drop-site terminal is explained in the network topic, where it first appears. The learning topic flows straight back to the hub, so one click instead of two.
  - "I know you will. Go." is cut.
  - The progress recap no longer repeats the all-flags text.
  - The debrief's closing summary no longer repeats each fate line ("Sterling's been charged." etc.).
- **New lint rules.** The over-long briefing line is split. Exit replies are added for the guard's "Alright, I'm going." and Victoria's two leave options. The guard's influence tag now sits before his spoken line, not before a narrator line. Victoria's opening narration loses its "not X. Y." Thirteen stage cues the words already carry are cut. Still open, by design: Victoria's one permitted contrast; the two big-moment choices; the stage-cue density warnings, now much lower; and blank re-entry on the hidden night cutscene, which is never re-talked.

**Structure changes (tagdiff against round 3):**
- **guard (34 diffs):** quiet-flag VARs, assignments and re-entry conditionals; the influence tag moved above its line in the same knot.
- **receptionist (6):** `night_greeted` and its conditionals.
- **Danny (15):** `rest_quiet` and the per-fate re-entry lines.
- **phone (5):** the `clone_call_done` VAR and conditionals; one divert, the new card-saved line's `-> report_end`.
- **briefing (2):** one `+` choice removed in `topic_learn`.
- **debrief, Victoria, night transition:** STRUCTURE UNCHANGED.

**Checks.** Compile 8/0. reopencheck 0 problems. loopcheck 20/20 clean: guard day, night, hub and hostile idle; receptionist night first and return; Danny at rest in each fate; phone recap before and after the night scene; revelation call; briefing; debrief; Victoria. The validator has no INVALID. Its one new item is a lip-sync suggestion for the night cutscene's portrait; it comes from a validator or asset update, not from this round.

## 7. Backlog ideas

- A `dialoguelint` allowlist for character surnames that collide with banned words (e.g. "Foster"), so the real signal isn't buried under false positives.



