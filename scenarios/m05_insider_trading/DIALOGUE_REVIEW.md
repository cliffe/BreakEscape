# m05 Insider Trading: dialogue review and rewrite (pass 4)

Script-editor pass, 2 October 2026, after the three design rounds in `DESIGN_REVIEW.md` and the round-3 confirmation playtest (`tools/playtest/m05-pass4-confirm3-report.md`). Brief: `docs/agents/PASS4_DIALOGUE_WRITER_PROMPT.md`. The findings below (sections 1 to 3) describe the ink **before** this pass, as snapshotted in the session scratchpad (`m05-dialogue/ink-before/`); "Changes made" (section 4) says what was done about them.

## 1. Compile, validator and lint (before)

- **Compile.** All ten inks compiled with `bin/inklecate`, no errors, no loose ends.
- **Validator** (dialogue-facing only). No INVALID. Every speaker prefix resolves; no `//` in dialogue, no line-start `*` emotes, no `**`. The three objective-wiring co-fire warnings are the intended ones from the design rounds.
- **dialoguelint** (`scripts/ink_runtime_check/dialoguelint.mjs`), totals by rule:

| Rule | Count | Where |
|---|---|---|
| `phone-self-prefix` | 195 | every HaX, Patricia and Recruiter phone line carried its own name |
| `you-after-choice` | 77 | `You:` echoes in every file but the phones; 30 in the confrontation alone |
| `line-len` | 29 | the briefing (Netherton 48 words, Nightshade 60), HaX's phone (11), the Recruiter (11), the debrief (2), the confrontation (1) |
| `blank-reentry` | 6 | the hubs of Lisa, Halloran, Owen and Patricia; Torres' `fighting` and `after_choice` |
| `not-x-but-y` | 2 | the Recruiter (`recruiter_introduction`, `recruiter_final_statement`) |
| `banned-word` | 1 | "leverage", briefing objective two |
| `transition` | 1 | "however" (a false positive: "Handle Torres however suits you") |
| `choice-len` | 1 | Owen's 18-word 23:47 choice |
| `exit-no-reply` | 1 | Torres' `[Not yet.]` |
| `text-len` | 1 | the "upload's dead" text, 34 words |

Line lengths before (median / p90 / max words): debrief 15 / 25 / 34; briefing 12 / 23 / 60; HaX phone 15 / 25 / 34; Recruiter 16 / 30 / 35; Patricia 12 / 20 / 28; Owen 11 / 22 / 29; Halloran 10 / 22 / 28; Lisa 10 / 19 / 23; Torres 9 / 19 / 32; timed texts 17 / 29 / 34.

## 2. Dialogue review (README_ink_best_practices.md)

### 2a. Attribution and narration: OK

Prefixes resolve. Narration is camera direction apart from two lines that comment: "This is the choice." (`m05_torres_confrontation.ink`, `evidence_revelation`) and "What it cost depends on what you just chose." (`upload_stopped`). Patricia and Halloran were both introduced with "sharp eyes".

### 2a-bis. Supported by the scenario: OK

Torres is shown in the data centre when named; the props the dialogue points at exist (the lanyard, the hook-side spare, the mug, the envelope). Owen's and Patricia's directions match the connections. No stationary NPC promises to walk anywhere.

### 2a-ter. Voices: OK, with one CONCERN on sameness

Every speaker has a voice block with an accent (voice bible, m05 table). On the page, though, the five office characters spoke in one clipped register: Lisa (chatty, south-west London) had no chatter, Owen (sardonic, Manchester) and Halloran (sharp, Dublin) traded the same short declaratives, and Patricia's lines read like HaX's. Cover the names and only Torres was clearly himself.

### 2b. Choices are spoken dialogue: CONCERN

77 `You:` echoes. Many brackets were labels with the real line underneath (`[Help me understand what was taken.]` then `You: The technical context will help me narrow it down.`; `[That isn't my problem.]` then `You: I'm not a social worker, David.`). The confrontation and Patricia's case summary also scripted whole player speeches (`public_exposure_path` ran four `You:` lines; `significant_findings` six). The Recruiter's `[He's not a "line item." He's a person.]` quoted a phrase she had not yet said. Briefing choices without full stops (`[I understand the urgency]`, `[We have to stop this]`).

### 2c. Hub structure: OK

Every person-chat NPC has `start` and `hub`, a sticky exit, and never reaches END. Exits are one or two lines.

### 2c-bis. Starved knots: OK

The round-3 matrix (1550 inkcheck and loopcheck runs, 31 states, 25 entry knots) found none. Re-run after this pass: see section 4.

### 2d. Choices that matter

- **OK (information).** The briefing question hub, HaX's topics, Lisa's and Owen's gossip.
- **OK (stance, recorded).** `confront_stance` (debrief `final_reflection`), `player_approach` (debrief, checked against case strength and KOs), the Recruiter deal globals (debrief and credits), Torres' fate (debrief and credits).
- **OK (gates with a second source).** Halloran's spare (Owen's clone), Owen's password (Patricia's authority, the incident log), the vetting files (the bills and journal in the office).
- **CONCERN (minor, flat).** The two debrief choices after public exposure lead to the same lines with nothing recorded (`public_exposure_path`). Owen's two clone replies are flavour only. Left as they are; they are short.
- **CONCERN (minor, never read).** `mission_priority` is set by the briefing's last question and read nowhere. `player_approach` carries the same information and is read, so nothing is lost.

### 2e. Cross-file state: OK

No `#set_global` tags in the inks; state moves through synced scenario globals declared in `globalVariables` and `VAR`-declared where read (validated in the design rounds).

### 2f. Influence feedback: CONCERN (not fixed here)

Lisa, Halloran, Owen and Patricia change influence 46 times and no change carries `# influence_increased` / `# influence_decreased`, so the player never sees the popup. Adding the tags is a tag change, and in a whodunnit a "+ Influence" on one answer could read as a hint, so it is left for the orchestrator (section 6).

### 2g. Syntax: OK

No bold, no bullet dialogue. Two speeches read as lists (the briefing's "Your objectives:" and Nightshade's three-part pattern).

### 2h. KO resilience (writing side): OK

The design rounds wired `patricia_ko`, `owen_ko`, `lisa_ko`, `halloran_ko` and `torres_ko` through the relays and the debrief. No line assumes a downed NPC is up.

### 2i. Recurring bugs the lint can't see

- **Status answer.** HaX's `general_advice` branches on the case's stages (log, alibi, suspicion, motive, exfil, flags, fate). OK. Its last fallback said "Trust your training", which the voice bible bans.
- **Choices quoting the unsaid.** The Recruiter's "line item" choice (2b).
- **The same fact twice.** The first timed text ("You're in. Patricia Morgan's office…") and HaX's first call both opened "You're in". The flag texts and HaX's flag topics repeated each other word for word ("First flag verified", "Second flag in. You've got a shell", "Third flag verified. His staging manifest, under his own name"). The debrief said the "they'll never know" line twice (`mission_outcome_assessment` and `mission_end`). Patricia's hub greeting and `request_authorization` both asked "What do you need?".
- **Whodunnit pointers** (the reason this mission was re-designed). Lisa's "What have you noticed lately?" singled out Torres ("David Torres especially. He looks like he's carrying something heavy, all the time.") before the badge log. Patricia's file hand-over ("Two names on Owen's sheet have something in their files this year") told the player there are exactly two people of interest. Lisa's collection-tin answer also names him, by design (it is the motive thread; the player chooses to ask).
- **Voice.** HaX: "Trust your training", "Good work" (both on the voice bible's never-says list), "That's the right answer". Netherton's cameo ran 48 words with contractions. Nightshade's 60-word speech.

## 3. Prioritised action list

**Must fix**
- Lisa's opener names Torres before the badge log (whodunnit balance).
- Patricia's file hand-over gives away the count.
- HaX's banned lines ("Trust your training", "Good work").

**Should fix**
- 77 `You:` echoes and the scripted player speeches (confrontation, case summary).
- 195 phone self-prefixes.
- 29 over-long lines, the 34-word text, the 18-word choice.
- Six resting knots with no re-entry line; Torres' silent `[Not yet.]`.
- Repeated facts: the opening text and first call, the flag texts and flag topics, the debrief's double "never know".
- Five office voices that sound alike.
- Influence popups (section 6; needs the orchestrator).

**Worth considering**
- The flat exposure-debrief pair and the unread `mission_priority` (logic; left).
- Briefing objectives read as a list; Nightshade's speech as a list.

## 4. Changes made

Mission-local files only: the ten inks and their compiled `.json`, five timed texts in `scenario.json.erb`, and this file. Nothing committed.

### The whodunnit (left as balanced as the design rounds made it)

- **Lisa's "What have you noticed lately?"** now spreads the gossip over three people with no "especially": Halloran's row with the CEO, Ben "snapping at everyone", David who "has barely said a word in weeks". David is the quietest of the three, not the obvious one. `heard_about_david` still gates her David questions, so he is named once, alongside two others.
- **Patricia's file hand-over** is now "That's what vetting will let me give you. / Read them properly. Nobody's file is as tidy as it looks." No count, and it keeps the warning that both files are untidy.
- Untouched on purpose: the badge-log lines, Halloran's alibi and "David, mostly", Owen's unnamed hallway sighting, the naming menus and every reason-menu choice and reply, Patricia's suspect list, the briefing's three tells and "Patricia's included". The case summary (below) recites only evidence the player already holds.
- Still there by design: Lisa's tin answer names David, because it's the motive thread and the player chooses to ask. Halloran's team line names David as her cryptography lead, as before.

### Per file

| File | Lines (before → after) | Spoken lines new or rewritten | Choices reworded | `You:` lines |
|---|---|---|---|---|
| `m05_insider_trading_opening.ink` | 345 → 347 | 49 | 20 | 8 → 0 |
| `m05_npc_patricia_morgan.ink` | 471 → 479 | 22 | 5 | 19 → 0 |
| `m05_npc_owen_gallagher.ink` | 317 → 314 | 15 | 6 | 14 → 0 |
| `m05_npc_dr_halloran.ink` | 248 → 254 | 20 | 8 | 11 → 0 |
| `m05_npc_lisa_park.ink` | 181 → 188 | 21 | 3 | 6 → 0 |
| `m05_phone_agent_0x99.ink` | 761 → 769 | 61 | 7 | 4 → 0 |
| `m05_phone_patricia.ink` | 279 → 281 | 9 | 0 | 7 → 0 |
| `m05_phone_recruiter.ink` | 384 → 404 | 34 | 2 | 1 → 1 (the silent choice) |
| `m05_torres_confrontation.ink` | 532 → 541 | 28 | 13 | 30 → 0 |
| `m05_closing_debrief.ink` | 695 → 691 | 20 | 10 | 10 → 0 |

"Spoken lines new or rewritten" counts lines whose words changed, ignoring the dropped phone prefixes (the phone already stripped them before the voice, so the prefix alone changes no audio). In all: about 280 spoken lines and 74 choices touched, and five timed texts. m05 audio is not generated yet, so none of this costs anything now.

**Briefing.** Netherton's 48-word cameo is two lines with fewer contractions; "catching a mole is precisely his trade" is kept word for word (approved m08 foreshadowing). Nightshade's 60-word speech is three short lines and keeps "the calm of someone who's decided the rules don't apply to them" (his m05 double-edged line in the voice bible). HaX's throat-clearing opener is cut; "Your objectives:" is "Three things, then." with "One." / "Two." / "Three."; figures are written for the voice ("Seventy-three per cent"); "leverage" is gone. The approach answers are first-person speech, and "I'll read the room when I get there." matches the debrief's "You said you'd read the room." The closing restatement of the stakes is now "Thirty to forty-five lives. I won't say it again." (it also covers the player who heard the clock but not the number). It ends on the first action: "Patricia Morgan's expecting you. Go."

**Patricia** (Cardiff, ex-military, dry). Echoes folded into the choices. Her case summary on naming Torres is her reading back her notes ("Slowly. I'm writing this down." / "Money. His wife's treatment isn't covered…") instead of six scripted player lines, same facts, same conditions. New hub re-entry line, varied, and no longer the same words as `request_authorization`. "Do. I don't like surprises." and "Go on, then." give her exits an answer.

**Owen** (Manchester, sardonic). "Alright." / "Finally. Someone to fix our mess who isn't me." / "Mostly reason." / "Always behind, always skint, that lad." The 23:47 choice is 13 words. Echoes gone, including the two that repeated a hub choice at the top of `request_password` and `request_office_card`.

**Halloran** (Dublin, sharp, protective). "I run Heisenberg." / "I hope to God you're wrong about my team." / "Go on, so." Her alibi lines are unchanged in substance. Her `torres_defense` reply no longer needs a scripted player line to answer it.

**Lisa** (chatty, south-west London). Given room to chat: "I sit by the kettle. I notice things.", "like it's a game of Cluedo", "poor lamb", "Hence the tin." Plus the whodunnit change above.

**HaX (phone).** Prefixes dropped. Long lines split; each answer opens on the action. "Trust your training" replaced. "That's the right answer" is now "Good." Hub choices for guides are asks ("Can you send me the lockpicking guide?"), and "Got any general advice?" is "What should I be doing right now?", which is what `general_advice` answers. The flag topics no longer repeat the flag texts word for word. The first call no longer repeats the opening text's "You're in". "Soft:"/"Hard:" became "Go soft and…"/"Go hard and…" (the validator read them as speaker prefixes).

**The Recruiter.** Prefixes dropped; long lines split into her own rhythm, menace kept ("It costs me nothing.", "I've built a career on the difference.", "He was cheap. The next one might cost me more, and I'll enjoy the work regardless."). The "line item" choice now answers what she has said ("You're talking about him like a receipt."). She keeps one rhetorical "That's not a defence. It's…" in her final statement, as a villain may; the earlier one in her introduction went.

**Torres.** All 30 scripted player lines are gone. The player's words are in the choices; where the player used to answer without a choice, Torres works it out ("You're not police. So Patricia's ringing them." / "And the court? *a beat* No. You can't promise that." / "…No. That's for a court, isn't it. Not you.") or a Narrator line reports it ("You tell him. SAFETYNET pays for the trial…"). His grief lines are untouched. Narration no longer comments ("This is the choice." cut). Percentages read "94 per cent". `[Not yet.]` gets "The bar's still moving."

**Debrief.** Echoes folded; the two over-long lines split; the duplicate "they'll never know" is now a number ("That was thirty to forty-five people, in the first wave alone.") with the human line kept for the close; tidy endings cut ("That's how they're caught.", "That's the difference.", "High risk, high reward."). "Good work." is now "That's everything."

**Timed texts** (`scenario.json.erb`). Five trimmed to 28 words or fewer: the arrival text, the bills text, the third-flag text, the Bludit text and the "upload's dead" text (34 → 26).

### Structural changes (deliberate)

`tagdiff --old <ink-before> <file>`: **STRUCTURE UNCHANGED** for the briefing, the debrief, Patricia's phone and the Recruiter. The rest:

- **Re-entry lines (blank-reentry), 56 differences.** Lisa, Halloran, Owen and Patricia's hubs, and Torres' `fighting` and `after_choice`, get the m03 pattern: a new `VAR hub_quiet` (Torres: `fight_quiet`, `after_quiet`), a `{quiet: ~ quiet = false - else: <line>}` block at the top of the knot, and `~ quiet = true` before every exit. Halloran and Owen also set it after the scenes that end on a hard line (her suspension, the alibi's "Oh, no.", the news about David), so "What else?" doesn't follow them. No choice, condition, tag or divert changed. Counts: Lisa 7, Halloran 11, Owen 7, Patricia 12, Torres 19.
- **HaX's post-KO safety net, 2 differences.** The `{patricia_ko:}` block that chose between two scripted player lines is removed with the lines; the choice text now says it, and HaX's reply still branches on `patricia_ko`.

Everything else is prose.

### Lint, before and after

| Rule | Before | After |
|---|---|---|
| `phone-self-prefix` | 195 | 0 |
| `you-after-choice` | 77 | 1 (the Recruiter's `[Say nothing.]`, allowed) |
| `line-len` | 29 | 0 |
| `blank-reentry` | 6 | 0 |
| `not-x-but-y` | 2 | 1 (the Recruiter's final statement, villain's one per scene) |
| `banned-word` | 1 | 0 |
| `transition` | 1 | 0 |
| `choice-len` | 1 | 0 |
| `exit-no-reply` | 1 | 0 |
| `text-len` | 1 | 0 |

Line lengths after (median / p90 / max): debrief 15 / 24 / 29; briefing 13 / 21 / 25; HaX phone 14 / 20 / 23; Recruiter 14 / 21 / 23; Patricia 13 / 20 / 27; Owen 12 / 23 / 29; Halloran 11 / 21 / 24; Lisa 12 / 18 / 20; Torres 8 / 17 / 24; Patricia's phone 10 / 16 / 23; timed texts 17 / 27 / 28. Two asterisk cues in the mission (Halloran, Torres), neither on a number.

### Checks (static; no browser test run)

Scratch output: `<scratchpad>/m05-dialogue/` (`lint-before.txt`, `lint-after.txt`, `tagdiff.txt`, `validate.txt`, `reopen.txt`, `matrix.out`, `rendered.json`).

- `bin/inklecate`: all ten inks compile with no warnings; every `.json` was rebuilt from the final ink.
- `ruby scripts/validate_scenario.rb`: no INVALID, "All ink files valid", the same three intended co-fire warnings as round 3.
- `python3 scripts/check_door_alignment.py`: 9/9 OK.
- `tools/pass2/render.rb`: the erb renders and parses; the 30 timed messages max out at 28 words.
- `reopencheck.mjs … m05_insider_trading`: HaX, Patricia's phone and the Recruiter, 1800 reopens each, 0 problems.
- inkcheck and loopcheck: the round-3 matrix (31 states) over 31 entry knots, adding Lisa's, Halloran's and Owen's hubs, Torres' `after_choice` and `fighting`, and the Recruiter's `idle`: 1922 runs, 0 failures. (The run started before the last four prose tweaks: the first-call "You're in", the briefing's stakes line, one debrief line and Patricia's greeting variants. None touches structure.)
- `tagdiff`: as listed above.

## 5. Not fixed, and why

- **Influence popups** (2f): tag change, and a possible hint in a whodunnit. For the orchestrator.
- **`mission_priority`** is never read; **the exposure-debrief choice pair** records nothing. Logic, left.
- **Lisa's tin answer** still names David, by design.
- **Ben Ashworth** has no lines (he isn't an NPC), so he can't be given a voice in this pass.

## 6. Ideas for the backlog

- **Influence feedback in m05**: add `# influence_increased/decreased` to the 46 influence changes, after deciding whether the popup leaks the whodunnit (it could be suppressed on the reason menu only).
- **A Ben Ashworth NPC**: the third suspect is only ever talked about. A short, nervous scene (his Thursday test run, his pay review) would make the red herrings two people deep.
- **dialoguelint**: count an unprefixed `Word:` line in a phone ink (the validator flagged "Soft:"/"Hard:" here) and a timed text whose opening words repeat the contact's first line.
- **Validator**: flag a VAR set by a choice and read nowhere (`mission_priority`).

## 7. Script edit round (after DIALOGUE_EDIT_NOTES.md, verdict "revise (light)")

- **M1.** Briefing `final_instructions`: "Thirty to forty-five lives ride on that upload. Keep the number with you." The timeline-route player hears the number for the first time here.
- **I2.** HaX `topic_flag3`: "Root's the last door. Start with what that account is allowed to run." My earlier note said the flag answers no longer repeated the texts; this one still did.
- **I3.** HaX `topic_flag2`: "Now find out who's been living on that box." / "Their home directory will tell you who." HaX `topic_flag4`: "Then you've seen the Architect's signature."
- **CR3.** Torres `upload_stopped`: "Narrator: You tell him: home, act normal. Elena starts treatment on Monday. You'll be in touch." and "Narrator: You nod." The Narrator no longer vouches for SAFETYNET.
- **CR5a.** Owen's "[Point me at the logs. I'll take it from here.]" now sets `~ hub_quiet = true` before `-> hub`, so "What else?" doesn't follow "Shout if you need anything." **One added assignment (structural, listed).**
- **CR2.** Debrief exposure pair: each choice gets its own reply ("That part worked." / "It did. Not only them."), and "It worked." is dropped from the next line. Prose only.
- **I4 (optional, approved condition change).** HaX `general_advice`: a new `{final_choice != "": Torres is dealt with and the portal's done. I'm bringing you in. -> support_hub}` above the `torres_identified` return. The debrief starts on its own once the fate is set and all four flags are in. **Adds one condition and one divert (listed).**
- **I5 (optional).** Owen's password-ask choice now says "on the server side at 23:47". It no longer says "in your server room", which contradicted his hub choice's "server hallway".
- Not taken: the Ben follow-up in Lisa's hub (a design point, logged by the orchestrator), CR4 and the CH items.

Checks:
- All ten inks recompile cleanly.
- dialoguelint: `you-after-choice=1` (the allowed silent choice) and `not-x-but-y=1` (the Recruiter), as before.
- Validator: no INVALID. reopencheck: 0 problems.
- tagdiff against `ink-before` is now 61 differences, up from 58. The new three are Owen +1 (CR5a) and HaX +2 (I4: the condition and its divert). The briefing, debrief, Patricia's phone and the Recruiter are still STRUCTURE UNCHANGED.
- inkcheck/loopcheck matrix re-run: see the end of this section.
- inkcheck/loopcheck re-run on the final files: 1922 runs (31 states × 31 entry knots), 0 failures.

## 8. Playtest round (after tools/playtest/m05-pass4-dialogue-report.md)

The playtest found no hook failures, and nothing named Torres before the badge log. Fixes:

**The ten worst lines**
1. **Patricia, "How did you spot it?" route.** The badge line now opens "Here. Visitor badge…", so it reads as a hand-over and no longer answers a question nobody asked.
2. **Lisa.**
   - The choice is now "[Is David all right? At home, I mean?]", so no wife is assumed.
   - Her answer introduces Elena ("His wife, Elena… Now she's ill. Properly ill.").
   - "The number" is now "what the treatment costs".
3. **Torres.** "At first? Investigative journalists, exposing a corrupt contractor…" now answers both the soft opener and the hard one.
4. **Torres scene narration.**
   - "You make the offer: the trial paid for, and somewhere quiet for the family if it ever gets dangerous." The Narrator now reports the offer instead of vouching for SAFETYNET.
   - "the Recruiter has been in touch with you tonight" replaces "rang you"; a text is enough to make it true.
5. **Halloran's** Torres answer now says something new: "David made Heisenberg work. Two years of his life are in that key exchange." It adds nothing that points at him.
6. **HaX debrief.**
   - "a recruiter's leaflet, with a deadline scribbled on the back" matches the leaflet's "SAY YES BY THURS."
   - The upload numbers now agree. The briefing's objective three is "The rotation windows are in that last part, and they stay in the building." The debrief is "stopped at ninety-seven per cent… The rotation windows were in the last of it, and they never went." The briefing's 73 per cent was staged before tonight, and the transfer bar is tonight's run, so the two figures no longer clash.
7. **HaX debrief.**
   - "That's what the review board will want to hear. I'm not sure I do." no longer misattributes the line to Torres.
   - The low-trust close is "The job got done. I'm still deciding about the rest.", so it isn't a second goodbye.
8. **Patricia's log reason, in person and by phone.**
   - "Ruth's spare… Ruth's own badge never comes in after seven" removes the ambiguous "hers".
   - If she suspended Halloran: "And Ruth's sitting in her lab, suspended on your word. That's on both of us now."
9. **Briefing.**
   - The "read the room" reply is now "Just keep hunches and proof in separate piles."
   - The non-cooperation thought now carries through: "Whoever it is, ENTROPY found them before we did. Keep that in mind when you choose."
10. **Owen.**
    - His access answer now gives information: "I hold the spares for most of the doors here. Give me a reason I can write in the log and they're yours."
    - The clone reply is "Just don't try it on Security", which still works if Patricia is down.

**Other items**
- **Credits:** "CIVILIAN LIVES SAVED" has no condition now. Every ending stops the upload.
- **Vault texts:** the reader mapping is split on `torres_print_collected`. Without the print, the old pointer plays. With the print already lifted, it says "That's the vault reader. You've already lifted his print. Use it." The guard is `vault_reader_seen`. The two conditions are disjoint, and the validator shows the same three co-fire warnings as before.
- **Halloran's position:** moved from (6,5) to (6,6), one tile south off the chair row, onto open floor. She has no patrol; the "pacing" is the stationary NPC's return-home after being bumped. **Not browser-checked.** Someone should look at it on screen.
- **Owen's access ask:** now also a sticky hub choice until used (`asked_access`).
- **Death toll:** stated on every route. `final_instructions` now always says "Thirty to forty-five lives ride on that upload. Keep the number with you." and sets `knows_full_stakes`, so the debrief's number line and the credits follow.
- **Owen's office ask:** retired once he hands the card over (local `card_handed`, the same pattern as his password and log flags).
- **One name for the place:** the incident log reads "server hallway access (23:47)". So do Owen's password choice and the debrief's warning-sign line.

**Structural changes this round** (tagdiff against `ink-before` rose from 61 to 78 differences):
- **Briefing (+2):** the `{knows_full_stakes:}` condition is removed and `~ knows_full_stakes = true` added.
- **Owen (+13):** VARs `asked_access` and `card_handed`; a new sticky hub choice; `asked_access` set in two places; `card_handed` set in the three give branches and added to the office-ask condition.
- **Patricia (+1) and her phone (+1):** a `{halloran_accused:}` block in the log-reason knot.
- **Erb:** the credits condition is removed; the vault mapping is split in two; Halloran's position changed; the incident-log text changed.

**Checks**
- All ten inks compile.
- dialoguelint: `you-after-choice=1` and `not-x-but-y=1` (both allowed, as before).
- Validator: no INVALID, all ink valid, the same three intended co-fire warnings.
- Doors: 9/9.
- reopencheck: 0 problems.
- inkcheck/loopcheck: see the next line.
- inkcheck/loopcheck on the final files: 1922 runs (31 states × 31 entry knots), 0 failures.
