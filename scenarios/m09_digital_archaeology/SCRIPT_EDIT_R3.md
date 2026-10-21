# m09 Digital Archaeology: script edit, round 3

## Verdict

**Revise (light), then ship without another round.** All 21 R2 findings landed. The ink compiles, the lint shows only the five `not-x-but-y` warnings that R1 ruled to keep, and loopcheck is clean on all 24 states R2 touched. Two R2 fixes created new majors, and each is a one-line fix:

- **B-R3-01.** Noor: R2 gated the bonus button on `noor_asked_peg` but left HaX's signpost ungated. On the first visit HaX now says "Tell her and she's a witness…" when there is nothing to tell. That uses up the one statement of the cost before the choice exists.
- **A-R3-01.** Identity scene: R2's Reading split leaves "He wrote that I'd cover for you." alone on `should_have_told`, followed by "Yes. I should have." Spoken aloud, the reply reads as "I should have covered for you". That is the wrong meaning in the mission's emotional peak.

Everything else is minor or an improvement. The mission works as episode 9 of 10. Its best scenes (Sorensen at the feed, the identity scene, Tesseract's call, Netherton's card) earn their weight, and the carry-overs that matter most change who helps, who turns up and which route is open. They do more than name-check.

## What was run and read

- `./scripts/compile-ink.sh m09_digital_archaeology`: 16 compiled, 0 failed, no loose ends.
- `dialoguelint.mjs`: 0 errors. Five `not-x-but-y` warnings: C1 L50, C2 L104, A1 L449, B3 L61 and B5's HaX bin line. All five were already ruled keep in R1/R2. One allowed `you-after-choice` (C1 L299, the silence). The lint reports nothing on the phone files without a scenario, so I checked them by hand: an awk pass over A1, B1 and C3–C5 found no phone line over 25 words.
- `loopcheck.js` was clean on 24 states: B6 `challenge` (fresh, and on a repeat sighting with `coyote_cover=auditor`); B6 `start` (fresh, and told); B2 `start` (not warned, ledger seen, warned late); A1 `identity_resume` (name said, confession heard), `identity_scene` (Reading told; `afterwards_heard` with m06), `hour_read` (`schedule_read`), `hour_read_resume` (choice reached), `ledger_read`, `support_hub` (Victoria's route, after the identity scene); B1 `call` (sold and confessed; sold and lied; after a hang-up); B5 `door` (default, and tidied); C4 `call` (shortlist, and default); C2 `start` (`should_have_told`, and shortlist); C1 `start` (m06 found).
- `git diff 262a54ab..HEAD` over `ink/*.ink` and `texts/*.md`: I read every R2 change line by line against its finding (CONTRACT §13).
- Read: the npc-dialog-review skill, PASS4_SCRIPT_EDITOR_PROMPT, FINALE_BRIEF, README_ink_best_practices (the pass-4 rules), CONTRACT §0–§13, SCRIPT_EDIT_R1 and R2, every `ink/*.ink` and `texts/*.md`, and the voice bible's Netherton entry. I grepped m10's ink only to see whether m09's set-ups ("Then why build the key?", the unread imports) are paid off there. They are: m10 `m10_tesseract.ink` L635–648 and `m10_director_netherton.ink` L116 pay off the key, and m10 reads all eight imports m09 leaves alone. No VM material was opened, and `// VM-STEER` lines are out of scope.
- Not run, because each needs `scenario.json.erb`: the validator, reopencheck, the F20 walk and tagdiff (CONTRACT §10.2).

## R2 confirmation

**Done** means resolved as R2 asked. **New problem** means the fix landed but created something else, listed below with an R3 id.

| R2 | Status | Where now | New problem? |
|---|---|---|---|
| B-R2-01 | done | B1 L87–92: her sold line, then HaX's "We've talked about that." | None. HaX now cuts across "Does your handler know?", which plays better than the old order |
| B-R2-02 | done | B2 L99, L102 | **Yes, B-R3-01.** The signpost at L82–85 still fires on the first visit, before any tell button |
| B-R2-03 | done | B6 L173–176, L219–222, `truth_plain` | **Yes, minor B-R3-03.** The plain button tells him nothing true, so "Figured." answers nothing on a first challenge |
| B-R2-04 | done | B9 L7 | None. It matches C2's "took a phone call when we landed" |
| B-R2-05 | done | B5 L235 | None |
| B-R2-06 | done | B1 L130 "for my tape deck" | No new problem, but the trade is still opaque (improvement I-3) |
| B-R2-07 | done | B1 L199 | The cut exposed an older gap: on a hang-up from the spring choice, "it" has no referent (B-R3-02) |
| R2 follow-up (B5 "One bin is…") | done | B5 L237 | None |
| A-R2-01 | done | A1 L186, L189 | **Yes, minor A-R3-03.** After "It says where.", "That's one of the four" reads as the place, and the act-two turn now lands on a pronoun |
| A-R2-02 / C-R2-04 | done | C2 L258 "As promised." | None. "Everything I have on the bunker" and "the rest" now read as two different debts |
| A-R2-03 + follow-up | done | A1 L390–392 | **Yes, A-R3-01 (major).** The first half of the split stands alone on `should` and turns the meaning of "Yes. I should have." |
| A-R2-04 | done | A1 L489–491 | None. "Then why build the key?" is left open on purpose and paid off in m10 |
| A-R2-05 (audio cut 1) | done | A1 L445 | None |
| A-R2-06 | done | A3-12 | None |
| A-R2-07 | done | A1 L322 | **Yes, minor A-R3-02.** "Same hand" straight after "my old course notebook" can be heard as HaX's own handwriting, and two lines later the confession says again that the notebook is from his course |
| A-R2-08 | done | A1 L379 | None. The other two buttons always show |
| A-R2-09 | done | A1 L704 | None |
| C-R2-01 | done | C1 L290 | None. "Then don't make me right." still lands |
| C-R2-02 | done | C2 L272 | None |
| C-R2-03 | done | C1 L233 | None. It now plants the identity scene's "called it Satoshi's guess" |
| C-R2-05 | done | C4 L169–175 | None |

The R2 audio cuts 1 and 3 landed. Cut 2 was traded for the split (CONTRACT §13).

## Three saves, read as a player

### Careful, full history

The save: m01 recruit, m03 Victoria recruited, m05 deal accepted and not confessed, m06 identity found with monitoring, m07 teacher discussed and echo heard, m08 triple agent and tidied. Kowalczyk thanked at the briefing.

- **Briefing.** The wall plays as the season the player made. Netherton's "Your tags lit up last night" ties m06 to the courier. The quote: Kowalczyk's "The long way's for people who get paid by the hour", which on this save is also a clue. **The sag:** from the cold open (C1 L26) to the first player choice (L251) is about 30 clicks: 4 Netherton lines, 8–12 wall lines from HaX, the suspect, the stakes. The wall alone is 9–12 HaX lines with one narrator break (I-5).
- **Recruiter call.** It opens on "Keep this one too." and then the spring choice: real, exported and paid back by HaX in `afterwards` ("Last spring I'd have kept that between us. Not tonight.") and by Netherton in the debrief. The payoff when Kowalczyk was thanked is the best carry-over in the mission: "She gave you something at the briefing, I expect. She's generous. It's how we hired her." / "You thanked her at the briefing. Keep doing it." **The sag:** between the offer and the answer, eight lines run without a player beat (B1 L130–146), three from the Recruiter and then five mixed. "I can beat that wipe." / "Nobody has." rescues the run. The trade itself ("The name tonight, for my tape deck") is still the least clear line in the call (I-3).
- **Sorensen.** Victoria's route sends the player through the maintenance code into B5, a different scene from the hatch. A real change in what's possible. "It's only paper. The people are where they've always been" is the line people will quote. The pencil lever, and the silence after it, land.
- **Identity scene and confession.** Three carry-overs stack: the Portland echo, "Satoshi's guess. It was mine as well.", and "I told you on the handset he taught me." The quote: "Two cards on that wall. I had his name the night they died." Netherton's single "HaX." is the best-directed line in the file. On this save the opening hand line now says "beside my old course notebook. Same hand.", and two lines later the m06 form doesn't repeat the course (A-R3-02 applies to the other forms).
- **Tesseract's call.** Still the best scene. "Nobody's called me that since the course. *beat* It's HaX." No choice, rightly.
- **Debrief.** "He reads the first name off the card. He doesn't look down for the second." That pays off the briefing's "I will read those two myself. Later." and is the moment of the mission. The hub and the pen stance are real choices.

### Ruthless, many knock-outs

The save: m01 fight, m05 combat_lethal, m08 HaX and Netherton KO'd; tonight Noor, Sorensen, Tran and Old Coyote KO'd. The deck was double-crossed.

- The briefing's "You put me on the floor at the Citadel. I'm still running you." and "Netherton takes the chair furthest from yours. Nobody mentions why." are both good. **But nothing after the briefing remembers either KO.** HaX's confession and Netherton's pen are the same as on a clean save. Of the "who helps, who betrays" carry-overs, these two big ones stop at name-checks. I-7 gives Netherton one line at the pen that pays off "Nobody mentions why".
- Sorensen's "You put a man on the floor after you'd already won. I filed that myself." is the right recognition line for this save.
- "She's sixty-six." (A3-09) is the hardest line in the mission, and the right size.
- The double-cross run (B9 "Your team's plane is still in the air." → "Kowalczyk took a phone call when we landed" → "Her crate is still on the ramp.") is consistent and cold. Nothing claims a KO'd person is up and about.

### Cold start

- The wall shortens and the canon reads as history. Nightshade comes in as "The traitor we took two days ago", and HaX's `else` confession ("He was mine. I wanted the other thirteen.") is arguably the best of the four forms.
- The Recruiter's cold opening introduces her through what she knows ("a card cloner, a safe cracker and a handler listening"). The cold wall's m05 line has already named "the Recruiter", and the phone UI shows her name, so the cold player can follow.
- A cold player who hangs up can't (the spring choice needs the m05 deal), so B-R3-02 hits only the careful save.

### Do earlier choices change what people do?

Mostly yes, and the strongest cases go beyond lines:

- **Who helps:** Gary (m02), Torres (m05 turned), Nightshade (m08 triple), and Noor's card (m05 warned in time).
- **Who turns up hostile:** Dillard (m01 Maya KO).
- **What's possible:** Victoria's maintenance code and the B5 scene (m03), and the bins' contents (m08 tidied).
- **What's said to the player:** the confession forms, Sorensen's recognition, the Recruiter's openings.

The name-check-only carry-overs are the m08 KOs (above), m04 Voltage, m06 Irina and m02 ransom; the last two are texts. Eight imports go unread in m09 (`m01_kevin_ko`, `m01_sarah_ko`, `m02_insider_asset_arrested`, `m02_patient_assaulted`, `m02_reeves_fate`, `m04_voltage_escaped`, `m07_debrief_stance`, `m07_team_redirected`). All eight are read in m10, so that's fine.

### Fake choices

There are none of consequence. The single-button taps (A1 L146 "[Who else is inside?]", L205, L494 "[Isn't it?]") are phone pacing, not decisions. The pen stance's identical holding reply ("Hold that until I find a pen.") is a deliberate delay, paid back at the pen.

## Voices across the three groups

- **HaX** is one woman in A1 (unprefixed), B1/B2/B3/B5 (prefixed) and C1/C2/C6: fact first, short, costs left to sit, rare thanks. The shared B1/A1 blocks still match character for character (`deck_resume` L270–301 against B1 L169–224, prefixes aside). The only wobble is HaX's B2 "ring her dad". It's fine, since she is quoting Noor's world.
- **Netherton** is formal everywhere. Contractions are rare, as the voice bible allows ("I'll sign whichever", "She'll sell the invoice"). One line drops the full form where it carries weight: C2 L215 "she doesn't know it" (C-R3-01). In A1 his three fixed lines ("I said we wouldn't name him…") match C1's "I will not say the name in this room".
- **The Recruiter** prices everything: "Sensible.", "check", "Shall we do business anyway?", "Goodnight, agent." She is consistent across her openings, the spine and B9's text.
- **Sorensen** is the same across B3, B4 and B5: US forms, "Mr. Lawson", "dear" exactly once (B4 L176), exact numbers ("Thirty-eight of them"). Netherton's "Mrs Sorensen" / "Miss Haddad" are correctly UK.
- **The minor callers:** Gary ("you're stood at a keypad", "Director of Cyber Security, me"), Torres ("I am", "Do not thank me") and Nightshade ("You know what to do with old.") each stay themselves.

## Structure and voiced-call rules

- **Compile, lint and loopcheck:** clean (above). No starved knot. Every person-chat hub keeps a re-entry line and a sticky exit with a reply.
- **Voiced knots touched by R2** (B1 `call` on sold and confessed, and the hang-up block; A1 `identity_scene.opening`, `answer`, `said_*`, `albion`):
  - No `Narrator:` line, and no printed variable: every `{…}` chooses between whole sentences.
  - Each path ends `#exit_conversation`, `-> DONE`.
  - On the confessed route, `#unlock_task:answer_the_offer` still sits above the first spoken line (B1 L89).
  - `*beat*` appears only at A1 L405, L416, L568 and B1 L165, never on a line with a number or a needed name.
  - No phone line is over 25 words.
- **Shared strings:** "He wrote that I'd cover for you." is now one clip, shared by three arms (A1 L391, L402, L413). The hang-up block's "Her file is her network…" still matches the spine's L142.
- **Audio after R2** (CONTRACT §13): group A 54 distinct, the Recruiter 14, briefing 84 + 8, debrief 49 + 16. The R3 fixes and improvements below come to **+2 clips net** if all are taken (A-R3-01 +1, I-7 +1; the others replace a clip or are unvoiced). See the table under Improvements.

## Group A: HaX's phone

A1 = `ink/m09_phone_agent0x99.ink`, A3 = `texts/A_hax_texts.md`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| A-R3-01 | major | A1 L390–394 (`said_should`, with `reading_told_hax`) | The R2 follow-up keeps only "He wrote that I'd cover for you." on this arm. With no turn after it, the next line, "Yes. I should have.", is heard as "I should have covered for you". In the other two arms the line is set up for "Tonight you covered for me."; here it just hangs. | Add one line after the shared clip: "I covered for him." Then "Yes. I should have." reads as not telling, which is what she means. (+1 clip.) If audio must stay flat, drop the Reading line from this arm entirely instead. |
| A-R3-02 | minor | A1 L322, then L349 / L357 | "I put it beside my old course notebook. Same hand." can be heard as HaX's own handwriting, since her notebook holds her notes and the hub says "Those are my notes. That's his pen." On the m06-only and cold forms, the confession two lines later repeats "The notebook in my case file is from his course." | "You never told me about the writing on Nightshade's file. I put it beside the margins in my old course notebook. Same hand." The confession's existing "Those margins are his." then pays off the plant. (Replaces the clip.) |
| A-R3-03 | minor | A1 L185–189 (`ledger_read`, unvoiced) | After "The entry doesn't say who. It says where.", the reply "That's one of the four you met at the briefing." reads as if "that" is the place. This is the mission's act-two turn (the mole is on the raid team), and it lands on a pronoun. | Both buttons: "WREN's on our team. One of the four you met at the briefing." Keep "The entry doesn't say who. It says where." on "[Who is WREN?]". Text, so no audio cost; it names WREN with no pronoun. |
| OK | – | A1 L561–576 | The Tesseract call. | Keep. |
| OK | – | A1 L489–492 | "Then why build the key?" is left open on purpose and paid off in m10 (`m10_tesseract.ink` L648). | Keep. |
| OK | – | A1 L146, L205, L494 | Single-button taps in text calls. Pacing, not fake choices. | Keep. |
| OK | – | A3 | Every text holds on every route checked (A3-11/12 on the PIN route, A3-29b after C-R2-01). | Keep. |

## Group B: the archive's people and the Recruiter

B1 `m09_phone_recruiter.ink`, B2 `m09_noor_haddad.ink`, B3–B5 Sorensen, B6 `m09_old_coyote.ink`, B7 `m09_jesse_tran.ink`, B9 `texts/B_recruiter_texts.md`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| B-R3-01 | major | B2 L82–85 | Created by R2 B-R2-02. The signpost "Tell her and she's a witness. She goes tonight, and she doesn't ring her dad for a while." fires on the first hub visit. Unless the ledger page has been seen, no tell button exists then: the bonus button now waits for `noor_asked_peg`. The player hears about a choice they can't see, and `noor_tell_signposted` spends the one statement of the cost before the choice appears. | Add `and (noor_asked_peg or ledger_page_seen)` to the condition. After the Peg answer, `back` returns to `hub` and the signpost then fires directly under "…a five-hundred-dollar filing bonus my first week.", the best place for it. No audio change. Rerun loopcheck on B2 `start`. |
| B-R3-02 | minor | B1 L196–199 (the hang-up block) | Older gap that R2's cut exposed. On "[Hang up.]" from the spring choice, the player hangs up on her first line, before the deck is ever mentioned. HaX's "She's wiping it. She thinks it's gone." has no referent, and the next two lines then name a file and tapes the player has never heard of. | "She's started the wipe on her tape deck. She thinks you've gone." (Replaces the clip, which is B1-only and not shared with A1.) |
| B-R3-03 | minor | B6 L175, L221 | Created by R2 B-R2-03. "[Go and sit in your truck. You don't want to see tonight.]" tells him nothing true (`old_coyote_told` is the truth beat). On a first challenge with no cover, "Figured." answers a confession that wasn't made. | Split the plain button by cover (unvoiced, free). On `coyote_cover == "contractor"`: "[I'm not here for the shredder. Go and sit in your truck.]". Otherwise: "[You don't want to be a witness tonight. Go and sit in your truck.]". The reply stays "Figured. I'll be in the truck." |
| OK | – | B1 L87–92 | The confessed opening after R2. HaX cutting across "Does your handler know?" is better than the old order. | Keep. |
| OK | – | B3 / B5 | The recognition, the bins, B5's own line. | Keep. |
| OK | – | B4 | "When I've finished, dear." The pencil, then silence. | Keep. |
| OK | – | B7 | His price before the deal; "a guy who fixes printers". | Keep. |

## Group C: cutscenes, callers, clip, texts, credits

C1 `m09_briefing.ink`, C2 `m09_closing_debrief.ink`, C3–C5 callers, C6 `m09_alpha_recording.ink`, C7 `texts/C_texts_and_credits.md`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| C-R3-01 | minor | C2 L215 | "She is still on a list, and she doesn't know it." This is a weight line, and the voice bible keeps Netherton's full forms "where weight matters". | "…and she does not know it." (Replaces the clip.) |
| C-R3-02 | minor | C1 L26–L249 | About 30 lines from the cold open to the first choice, 9–12 of them HaX at the wall. The careful save is rewarded by it; for everyone else it is the mission's longest stretch with no input. | See I-5: one player beat at the last two cards, with no new audio. |
| OK | – | C2 L234–284 | The card, the pen, HaX by answer, the last line by route. "As promised." holds. | Keep. |
| OK | – | C3–C5 | Each caller sounds like himself; Torres' arms no longer repeat. | Keep. |
| OK | – | C6 | It pays off the call ("opens for the right name") and plants m10. | Keep. |
| OK | – | C7 | The card and credits match the debrief on every route checked (double-cross, taken, named, refused; Noor four ways; HaX three ways). | Keep. |

## Improvements

Best first. "Clip" is the voiced-audio cost: **0** means a replaced string or unvoiced text. These go beyond the fixes above, though I-1, I-2, I-4 and I-6 also close A-R3-03, A-R3-01, B-R3-02 and A-R3-02.

| # | Where | Now | Rewrite | Why | Clip |
|---|---|---|---|---|---|
| I-1 | A1 L186, L189 (text) | "That's one of the four you met at the briefing." | "WREN's on our team. One of the four you met at the briefing." | The mole on the raid team is the mission's turn. Say it, then let it sit. | 0 |
| I-2 | A1 L390–393 | "He wrote that I'd cover for you." / "Yes. I should have." | "He wrote that I'd cover for you." / "I covered for him." / "Yes. I should have." | It fixes A-R3-01, and it gives the `should` arm the sharpest line of the three: she covered for the wrong man. | +1 |
| I-3 | B1 L130 | "The name tonight, for my tape deck. All of it." | "The name tonight. You let my tape deck wipe, all of it." | The player is told the price in the same words as the button "[Give me the name. Let the deck go.]". Then "Say no and I wipe it myself. Same deck, no name." makes sense: yes buys a name, and the wipe happens either way. | 0 |
| I-4 | B1 L199 | "She's wiping it. She thinks it's gone." | "She's started the wipe on her tape deck. She thinks you've gone." | It fixes B-R3-02, and HaX hears the hang-up the way the player did. | 0 |
| I-5 | C1 L222–223 | Narrator: "…HaX stops in front of them." / Netherton: "I will read those two myself. Later." | Keep the narrator line, then a player button "[Who are the last two?]" before Netherton's line. | It breaks the 30-line run with the one question the player is actually asking, and it makes "Later." an answer to them. The debrief's card pays it off. Single button, so it's a beat, not a decision; acceptable in a cutscene. | 0 |
| I-6 | A1 L322 | "…I put it beside my old course notebook. Same hand." | "…I put it beside the margins in my old course notebook. Same hand." | It fixes A-R3-02, plants "margins" for "Those margins are his.", and stops the line being heard as her own hand. | 0 |
| I-7 | C2, after L240 ("uncaps a pen"), on `m08_netherton_ko` | – | "Director Magnus Netherton: You put me on the floor at the Citadel. Nobody has mentioned it. I am mentioning it once." | It pays off the briefing's "Nobody mentions why." and gives the ruthless save one line that remembers what the player did. In his voice: formal, dry, a verdict. Optionally the same idea for HaX on `m08_hax_ko` in m10 rather than here. | +1 |
| I-8 | B6 L175, L221 (buttons) | "[Go and sit in your truck. You don't want to see tonight.]" | Contractor: "[I'm not here for the shredder. Go and sit in your truck.]"; no cover: "[You don't want to be a witness tonight. Go and sit in your truck.]" | It fixes B-R3-03; each form says something true before he goes. | 0 |
| I-9 | B2 L82 | the signpost's condition | add `and (noor_asked_peg or ledger_page_seen)` | It fixes B-R3-01, and the cost line lands directly under the bonus it explains. | 0 |
| I-10 | C2 L215 | "…and she doesn't know it." | "…and she does not know it." | It fixes C-R3-01: Netherton's full form, on the line that should sting. | 0 |

**Net audio if all are taken: +2 clips** (I-2, I-7). For exactly flat, take I-2's fallback (drop the Reading line on `should`) and skip I-7.

After the edits: recompile; rerun dialoguelint; rerun loopcheck on B2 `start` (signpost gate), B6 `challenge` and `start` (three button forms), A1 `identity_scene` with `reading_told_hax=true`, and C2 `start` with `m08_netherton_ko=true`. Then update CONTRACT §2.1 (A-R3-01, A-R3-02, the `ledger_read` fixed string), §3.1 (I-3, the hang-up block), §3.2 (the signpost gate), §3.4 (the button forms) and §4.2 (I-7).

## Finding counts

| Group | Blocker | Major | Minor | Total |
|---|---|---|---|---|
| A | 0 | 1 (A-R3-01) | 2 (A-R3-02, A-R3-03) | 3 |
| B | 0 | 1 (B-R3-01) | 2 (B-R3-02, B-R3-03) | 3 |
| C | 0 | 0 | 2 (C-R3-01, C-R3-02) | 2 |

Both majors are side effects of R2 fixes, as with round 1's two. Once both are in, the mission can ship without a fourth round.
