# m09 Digital Archaeology: script edit, round 2

## Verdict

**Revise (light).** No blockers. Every R1 finding is resolved or deliberately kept, the leftover grep is empty, the ink compiles, loopcheck passes on 21 entry states, and no phone line is over 25 words. The mission reads as a penultimate episode: a name proved, a confession, a call from the villain, and a hangar where the Montana order gets signed. That is the right shape for a hand-off to m10.

Five majors remain, each a one- or two-line fix:

- **B-R2-01.** The Recruiter's sold-and-confessed call opens on HaX answering a line nobody said.
- **B-R2-02.** Noor's tell button quotes a "bonus" the player can only learn from the flag-2 ledger, but it shows before the ledger.
- **B-R2-03.** R1 fixed Old Coyote's reply, but his truth button now says "I'm not an auditor" to a man nobody told they were one.
- **C-R2-01.** The briefing's "[She's right. Send me anyway.]" comes straight after Kowalczyk's line, but it sets the Quintero answer.
- **B-R2-04.** The Recruiter's text quotes a promise ("before your plane landed") that R1's trim removed from her call.

Two minors repeat the R1 C-01 problem in other places: A3-12 "Tell her it worked" fires on the PIN route, and the debrief replays "You get all of it from now on" word for word.

## What was run and read

- `./scripts/compile-ink.sh m09_digital_archaeology`: 16 compiled, 0 failed, no loose ends.
- `dialoguelint.mjs`: 0 errors. Five `not-x-but-y` warnings, all ones R1 ruled to keep (C1 L50, C2 L104, A1 L443, B3 L61 and B5 L36). One allowed `you-after-choice` (C1 L299, the silence). With no scenario file, the lint skips phone files. By hand (awk over A1, B1 and C3–C5, prefixes stripped), no phone line is over 25 words.
- `loopcheck.js`, all clean, on these states: A1 `start` (cold and late mission), `identity_scene` (found, teacher and Reading all set), `identity_resume` (after the confession), `deck_resume` (yes path), `hour_read` (`schedule_read`) and `tesseract_call`; B1 `call` (sold-and-lied, and sold-and-confessed) and `resume_name`; the hubs in B2, B3, B4, B6 and B7; B6 `challenge`; B5 `door`; C1; C2 (fresh, and a replay with every beat answered); C6 (clip played).
- `voicelines.mjs` on A1, to cross-check the hand counts.
- Leftover grep ("cheque", "Peg's office", "rights", "Not the copy", "It opened the safe", "He was one of ours, once") over `ink/*.ink` and `texts/*.md`: no hits.
- Read: the npc-dialog-review skill, PASS4_SCRIPT_EDITOR_PROMPT, FINALE_BRIEF, CONTRACT (§3, §7–§12), SCRIPT_EDIT_R1, every `ink/*.ink` and `texts/*.md`. S6 L144/L382 and SE L253/L592 were checked only for the bonus and for Quintero. No VM material was opened, and `// VM-STEER` lines are out of scope.
- Not run, because each needs `scenario.json.erb` (CONTRACT §10.2): the validator, reopencheck, the F20 walk and tagdiff.

## R1 confirmation

Status: **done** means resolved as R1 asked; **kept** means R1 left it optional and it stands; **partial** means the fix landed but left a new problem, which is listed below with an R2 id.

| R1 | Status | Where now | Note |
|---|---|---|---|
| Ruling 1 / C-01 | done | C2 L71 "[Thank you. I was glad of it.]", L76 "[It was in my pocket.]"; C7 L57 "Asked after her cracker. Got a shrug." | The same false claim survives in text A3-12 (A-R2-06) |
| Ruling 2 / B-08 | done | B4 L28 drops "dear"; L49 "When I've finished, dear." is the only "dear" in the mission | |
| Ruling 5 / A-19 | done | A3 L54–55: A3-21 keyed on `!m08_tomb_gamma_location_known`; A3-22b deleted | |
| Ruling 6 | done | C2 L144–149: the hub's re-entry is one line, "Anything more, before I sign?" | |
| A-01 | done | A1 L319–323: the hand line opens the scene, before the credential | The pronoun still leans on Nightshade (A-R2-07) |
| A-02 / A-a | done | A1 L343–358: three lines a form; L347's chiasmus is gone | |
| A-03, A-04, A-e, A-f | done | A1 L433–441 | The run is still long (A-R2-05) |
| A-05 | done | A1 L616 "[His annotation sheets, with the tapes.]" on `alpha_annotations_read` | |
| A-06 | done | "She fired it from Sorensen's office. I'm on the door." A1 L298; B1 L174, L184, L210, L219 | Same text in all five places |
| A-07 | done | "She only watched the counter. I can pull one before it wipes. Which?" A1 L283, B1 L190 | |
| A-08, A-09, A-10 | done | A1 L146, L205, L196 | |
| A-11 | done | A1 L492 "Oh-four-hundred, UTC." | "At six" survives in L483 (A-R2-04) |
| A-12, A-13, A-14 | done | A1 L532, L592, L584 | |
| A-15 | done | The `recruiter_call_started` row is gone (A1 L777 comment) | |
| A-16 | done | A1 L829 `// VM-STEER` | |
| A-17 | done | A1 L137–139 | |
| A-18 | done | A3-06a/b | |
| A-20 | done | A3-18 | |
| A-b | done | A1 L382–411 | `should` with the Reading repeats "He taught me" (A-R2-03) |
| B-01 | done | B1 L82, L128, L130, L140–141, L144, L155–156 | All 25 words or fewer |
| B-02 | done | B1 L97 "I thought I'd call."; L130 "I call my placement."; L155 "check" | |
| B-03 | done | B1 L133–138 has no default arm | |
| B-04 | done | B3 L162–188: recognition, then HaX's bins | |
| B-05 | done | B3 L176, B5 L101: "You handed Mr. Lawson to the police…" | |
| B-06 | partial | B6 L201: "Figured. Auditors bring coffee. I'll be in the truck." | The reply is fixed, but the button now makes the same claim (B-R2-03) |
| B-07 | partial | B2 L101, L104; B6 L195, L233; B3 L231 | Noor's bonus button quotes an unseen fact (B-R2-02) |
| B-09, B-10 | done | B2 L34, L41, L75, L108; B3 L234, L246; B4 L43, L68 | |
| B-11 | kept | B3 L237 | |
| B-12 | done | B4 L54 | |
| B-13, B-14, B-15 | done | B1 L118, L122, L97 | |
| B-16 | partial | B6 L217 and B7 L39 now have two variants each | Enough |
| C-02 | done | C1 L230 "They call him the Architect. We have a suspect." | |
| C-03 | done | C1 L59 | |
| C-04 | done | C4 L210 "Safe enough. Please be quick." | |
| C-05 | done | C7 L78 "Wiped the tape side. Nobody stopped him." | |
| C-06 | done | C2 L198; C7 L61 | |
| C-07 | done | C1 L263 "Somebody always asks me that. This time it's now." | |
| C-08 | done | C1 L107, L143–156, L172–174, L190–201 | |
| C-09 | kept | C1 L283 "The long way is over." | Kowalczyk's comeback still rescues it |

## Three saves, read as a player

**Careful, full history.** The save: m01 expose, m03 directive decoded, m05 deal accepted and confessed, m06 identity found with monitoring, m07 teacher discussed and the echo heard, m08 triple agent. The wall plays as a recap of the season the player made. Netherton's "Your tags lit up last night" ties m06 to the courier. In the identity scene, three carry-overs stack: the Portland echo, "Satoshi's guess. It was mine as well.", and "I told you on the handset he taught me." Together they reward the player who listened. Two places let it down:

- The briefing's "You heard me say it after HashChain. I called it his guess." (C1 L233) puts "his" straight after Netherton's suspect line, so it reads as the Architect's guess when it means Satoshi's (C-R2-03).
- On this save the Recruiter's call opens with HaX: "We've talked about that. She has nothing on you." The Recruiter hasn't said anything for HaX to cut across (B-R2-01). On this save, that is the call's first line.

**Ruthless, many knock-outs.** The save: m01 fight, m05 combat_lethal, m08 HaX and Netherton KO'd; tonight Old Coyote, Noor, Sorensen and Tran KO'd. The briefing handles it well: "You put me on the floor at the Citadel. I'm still running you." and the chair furthest away. Tonight's KOs cost something and are said once each. The debrief's two-line cap leaves Old Coyote and Tran to the credits, which is fine. Sorensen's "You put a man on the floor after you'd already won" lands. No line assumes a KO'd person is up and about. The ledger's "..." for a dead Torres is the right size. Nothing here needs changing.

**Cold start.** Every cold line is canon, and the cold player is told enough to follow. Nightshade comes in as "the traitor we took two days ago". The confession's `else` form explains the fund itself ("a file on a crypto fund, with his name in it at eighty-seven per cent"). The two dead agents are on the wall ("Two of ours died at the others") before "Two cards on that wall". One soft spot: "He said you'd know where to find him. He meant the door." (C1 L216) is spoken to a player who never met Nightshade. The contract makes it canon (row 107), so it stays; noted only.

**Does it land as episode 9 of 10?** Yes. The order of scenes works: name, confession, the villain's call, the order signed. The Tesseract call is still the best scene in the mission. The debrief closes on a decision for m10 (who goes into Montana, and how WREN is handled), not a recap. HaX's "I still owe you the rest. When this is over." holds the season's personal thread open.

**Voices across groups.** HaX is the same woman in A1 (unprefixed), B1/B2/B3 (prefixed) and C1/C2: fact first, short, costs left to sit. The six shared HaX lines in A1 and B1 match character for character. Netherton is formal everywhere. The Recruiter keeps m05's pricing voice. Sorensen and Noor use US forms throughout. Gary ("you're stood at a keypad") and Torres ("I am", "Do not") are recognisably themselves.

**Repeated lines.** Within one route, two lines are said twice: the debrief replays "You get all of it from now on." (A-R2-02), and the ledger read gives "Montana operation. Day ten." twice in a row (A-R2-01). Torres says "next of kin" and then "sick parent" back to back (C-R2-05).

**Claims about what didn't happen:** B-R2-02 (the bonus), B-R2-03 (the auditor), B-R2-04 (the plane), A-R2-06 (the toy that "worked"), B-R2-05 ("not from the lease-holder" on Victoria's route) and A-R2-08 ("[Afterwards. Not during.]" after an early close).

## Structure and voiced-call rules

- **Compile and lint:** clean (above).
- **Phone rules, checked by hand:**
  - No contact uses its own prefix in its own thread.
  - Anyone else in a thread is prefixed with a registered name (`Agent HaX:` in B1 and C3; `Director Magnus Netherton:` in A1).
  - The only `Narrator:` lines in phone files are in the unvoiced `start` stubs (B1 L36, C3–C5).
  - Resting knots (`support_hub`, `reading_ask`, `nightshade_ask`, `hand_ask`, `guides_menu`, B1 `start`) hold choices only.
  - Every phone line is 25 words or fewer.
- **Voiced knots** (A1: `deck_resume`, `identity_scene`, `identity_resume`, `tesseract_call`; B1: `call`, `resume_name`):
  - No narration.
  - No printed variables: every `{…}` is a condition choosing between whole sentences.
  - Each path ends `#exit_conversation` then `-> DONE`.
  - None diverts into `start`, `support_hub`, `afterwards` or a hub topic. `identity_resume` reaches only `identity_scene`'s own stitches, and `resume_name` reaches only `call.yes_block`, both of which are voiced.
  - Started and done flags follow §7.2 item 7. `tesseract_call_done` sits above the last report line, and each scene's done flag sits on its answer.
  - Inline cues: `*beat*` appears at A1 L400, L410 and L561, and in B1 L163, never on a line carrying a number or name the player needs.
- **Person-chat hubs:** each has a re-entry line, a sticky exit with a reply, and `+` topics behind `not` guards. Loopcheck found no starved knot.
- **Not checkable yet:** the contract's §10.2 items (validator, reopencheck, F20 walk, tagdiff, browser re-rings).

## Audio counts

Distinct voiced lines (one clip each), counted by hand from the source and cross-checked against `voicelines.mjs` for A1.

| Scope | Expected | Counted | Detail |
|---|---|---|---|
| Group A calls | ~48 new | **55 distinct, 49 new** | HaX 52, Netherton 3. `deck_resume` 7 (6 shared with B1); opening 6; recognition 2; confession forms 9; wall 2; answers 6; back to work 1; Albion 11; `identity_resume` 1; Tesseract call 10. One over R1's 48, within rounding (R1 probably counted 7 shared). |
| Recruiter | 14 | **14** | L82, L93, L97, L109, L118, L120, L128, L129, L130, L143, L155, L156, L163, L236. B1's HaX lines: 18 distinct, 12 not shared with A1. |
| Briefing | ~84 | **84 character lines + 8 Narrator** | Netherton 21, HaX 54, Quintero 3, Kowalczyk 3, Malhotra 2, Arakawa 1. The "~84" leaves out the narrator. |
| Debrief | ~49 | **49 character lines + 16 Narrator** | 51 prefixed lines less two shared strings (C2 L102 = L106; L124 = L127) |

**Easy further cuts** (none costs a carry-over):

1. A1 L438–439: merge the watch and the send into one line. "Our watch sits on that kit. Send it, the vendor starts a fix, and the watch comes down." (−1; this also shortens A-R2-05's run)
2. A1 L387: on `should` with the Reading, drop "He'd know. He taught me." and reuse L398's string, "He wrote that I'd cover for you." as its own clip, or cut the `should` Reading form entirely. (−1)
3. B1 L196–197: "Her counter's running." and "She's wiping it. She thinks it's gone." say one thing. Keep L197. (−1 HaX)
4. C1 L238: "They're guessing. I'd like to find out they guessed high." could lose its first sentence. This saves words, not clips. Optional.

Applying 1–3 gives A 47 new and B1 HaX 11 new. B-R2-01's fix reuses an existing Recruiter clip, so the Recruiter stays at 14.

## Group A: HaX's phone

A1 = `ink/m09_phone_agent0x99.ink`, A3 = `texts/A_hax_texts.md`, C2 = `ink/m09_closing_debrief.ink`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| A-R2-01 | minor | A1 L184–189 | HaX quotes the entry ("Assigned TF Null, Montana operation."), and both buttons then reply "Montana operation. Day ten." The same fact twice in a row. | Reply on both: "That's one of the four you met at the briefing." Keep L188 "The entry doesn't say who. It says where." on "[Who is WREN?]". |
| A-R2-02 | minor | C2 L258 vs A1 L390 | On `should_have_told` the debrief replays "You get all of it from now on." word for word, then L264 says "I still owe you the rest". The promise and the debt now read as a contradiction. | C2 L258: "Everything I have on the bunker is on your phone. As promised." (A new clip, but the repeat goes.) |
| A-R2-03 | minor | A1 L387 | With the Reading on `should`: "He'd know. He taught me." comes two lines after the confession's "He taught me." (L349/L357). | "He wrote that I'd cover for you. He'd know." (or audio cut 2). |
| A-R2-04 | minor | A1 L483–485 (text) | "At six" is a bare local-sounding time (the R1 A-11 rule). "Turn that key… Then why build a key at all?" doesn't say what the key is, so HaX's own question reads as a non sequitur. | "He's giving it away. At oh-six-hundred it starts going out, city by city. There's a key on here that sends it everywhere in the same minute." / "Then why build the key?" (Keep L485.) |
| A-R2-05 | minor | A1 L415–445 | From "Seven years…" to "His tapes…" HaX speaks 7–8 voiced lines with no player beat. R1 cut the two flat buttons that broke the run. This is the trade, but it is the longest unbroken stretch in the mission. | Audio cut 1 (merge watch and send). Leave the rest. |
| A-R2-06 | minor | A3-12 (A3 L29) | "Kowalczyk's toy. Tell her it worked." fires on the safe's unlock whichever way it opened. That is R1 C-01's false claim on the PIN route, now in a text. | "Safe's open. Kowalczyk will want to hear about her toy." (holds on both routes). |
| A-R2-07 | minor | A1 L322 | "You never told me about the writing on Nightshade's file. I put it next to my notebook. It's his." The nearest "he" is still Nightshade, and "my notebook" hasn't been explained yet (L349 does it later). | "You never told me about the writing on Nightshade's file. I put it beside my old course notebook. Same hand." |
| A-R2-08 | minor | A1 L377 | "[Afterwards. Not during.]" quotes HaX's `afterwards` line. A player who closed that text early (`afterwards_heard` false) and never heard m07's echo hasn't heard it, so her "That's mine" answers a quote from nowhere. | Gate the button on `afterwards_heard or m07_architect_echo_heard`. The other two answers always show, so the knot can't starve. |
| A-R2-09 | minor | A1 L697 | "[Sorensen's mail.]" is a menu label for something the player hasn't heard of. | "[Can Victoria's people get me through that gate?]" |
| OK | – | A1 L554–569 | The Tesseract call. | Keep as written. |
| OK | – | A1 L218–250 | `afterwards`: the loss lines are right for every `cage_bin` × `deck_pulled` case. | Keep. |
| OK | – | A1 L779–807 | The status ladder names the next step on every row. | Keep. |

## Group B: the archive's people and the Recruiter

B1 `m09_phone_recruiter.ink`, B2 `m09_noor_haddad.ink`, B3 `m09_sorensen_hatch.ink`, B4 `m09_sorensen_cage.ink`, B5 `m09_sorensen_door.ink`, B6 `m09_old_coyote.ink`, B7 `m09_jesse_tran.ink`, B9 `texts/B_recruiter_texts.md`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| B-R2-01 | major | B1 L87–90 | On sold-and-confessed the call's first voiced line is HaX's "We've talked about that. She has nothing on you." The Recruiter rang and has said nothing. "That" refers to nothing, and her voice isn't heard until the grievance. | Put the Recruiter's sold line first: L82's string, "Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too." (same clip, no audio cost), then HaX's line, then the spine. Update CONTRACT §3.1. |
| B-R2-02 | major | B2 L101 | "[That bonus wasn't for filing. She was sizing you up.]" shows when `not ledger_page_seen`. The "$500, filing bonus" exists only on the flag-2 printed ledger (S6 L144, L382), and Noor never mentions it, so before the ledger the player quotes a fact they can't know. | Let Noor say it. L99 becomes "She knew my name before I said it. Gave me a five-hundred-dollar filing bonus my first week." (16 words). Then gate L101 on `noor_asked_peg`. |
| B-R2-03 | major | B6 L195, L233 | The truth button "[I'm not an auditor. You don't want to see tonight.]" shows on the first challenge and in the hub before any cover, and after the contractor cover. In all three the player denies a claim nobody made. The reply "Auditors bring coffee" has the same problem. This is R1 B-06 coming back through B-07's rewrite. | Two buttons. On `coyote_cover == "auditor"`, keep the current button and reply. Otherwise: "[Go and sit in your truck. You don't want to see tonight.]" → "Figured. I'll be in the truck." (+1 clip) |
| B-R2-04 | major | B9 L7 | "I said I'd know before your plane landed." She doesn't say this in the call any more: R1 B-01 trimmed "half my people will have moved by morning", and nothing about a plane replaced it. | "You took the name and something off my deck. I said I'd know. Your team's plane is still in the air." (21 words) |
| B-R2-05 | minor | B5 L105 | On Victoria's route the player never meets the hatch, so nobody has claimed to be from the lease-holder, and "You're not from the lease-holder." answers nothing. Old Coyote's audit cover is the only route where it holds. | B5 only: "You came in by the maintenance code, not my hatch. You're the one he writes about." (new clip; B3 keeps its string) |
| B-R2-06 | minor | B1 L128 | "The name tonight, for the deck." The player hasn't seen her deck (the tape room comes after the call). HaX's L140 explains what's on it two lines later, but the offer itself is vague. | "The name tonight, for my tape deck. All of it." (fixed string: CONTRACT §3.1) |
| B-R2-07 | minor | B1 L196–197 | "Her counter's running." / "She's wiping it." The same fact, twice. | Audio cut 3. |
| OK | – | B1 L118–144 | The spine. "I work with him. Tonight he forgot the difference." / "Nobody has." | Keep. |
| OK | – | B3 L162–188, B4 | Recognition first, then the bins; "dear" once; the pencil, and silence after it. | Keep. |
| OK | – | B7 | His price comes before the deal; "the Bozeman number". | Keep. |

## Group C: cutscenes, callers, clip, texts

C1 `m09_briefing.ink`, C2 `m09_closing_debrief.ink`, C4 `m09_phone_torres.ink`, C7 `texts/C_texts_and_credits.md`.

| Id | Level | Where | Problem | Fix |
|---|---|---|---|---|
| C-R2-01 | major | C1 L290 | "[She's right. Send me anyway.]" comes straight after Kowalczyk's "The long way's for people who get paid by the hour." Read in place, "she" is Kowalczyk, yet the button sets `raid_team_answer:quintero`, which B1/A3-29b later pay back as "You took her side at the briefing". The player's answer is ambiguous, and the export it sets may not be the one they meant. | "[Quintero's right. Send me anyway.]" |
| C-R2-02 | minor | C2 L272 | "If I bench four agents tonight" holds on the default route (WREN is one of four). On `sleeper_shortlist` Netherton has just said "Two names". | "If I bench anyone tonight, WREN knows we know. They come. You watch them." (one string, every route) |
| C-R2-03 | minor | C1 L233 | "You heard me say it after HashChain. I called it his guess." comes straight after Netherton's suspect line, so "his" reads as the Architect. | "…I called it Satoshi's guess." (This also sets up the identity scene's "It was mine as well.") |
| C-R2-04 | minor | C2 L264 vs A1 L248 | "I still owe you the rest. When this is over." echoes `afterwards`' "The rest when this is over." That's intended as a motif, but on `should_have_told` it sits under the repeated "all of it" line. | Fixed by A-R2-02. |
| C-R2-05 | minor | C4 L204, L208 | On `sleeper_shortlist`: "Read the next of kin on each. That is the line they hire on." then "They pick people with someone to lose. Look for the ones with a sick parent." The same pointer twice. | Show L208 only in the `else` arm. The shortlist arm already says it. |
| OK | – | C2 L55–85 | The hangar buttons hold on both routes; Netherton's silent watch on `sleeper_named`. | Keep. |
| OK | – | C2 L234–284 | The two names, the pen, HaX's line by answer, and the last line by route. | Keep. |
| OK | – | C6 | The clip pays off the call ("opens for the right name") and plants m10 ("build your own way out first"). | Keep. |
| OK | – | C7 | The credits match the debrief on every route checked (Tran, Kowalczyk, Sorensen, Noor). | Keep, apart from A-R2-06's text. |

## The worst remaining lines

| # | Where | Now | Rewrite |
|---|---|---|---|
| 1 | B1 L89 (first line of the confessed call) | "We've talked about that. She has nothing on you." (HaX, answering nobody) | Recruiter first: "Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too." then HaX's line |
| 2 | B2 L101 | "[That bonus wasn't for filing. She was sizing you up.]" (no bonus mentioned yet) | Noor L99: "She knew my name before I said it. Gave me a five-hundred-dollar filing bonus my first week." Button gated on `noor_asked_peg` |
| 3 | B6 L195, L233 | "[I'm not an auditor. You don't want to see tonight.]" (on the first challenge) | Off the auditor cover: "[Go and sit in your truck. You don't want to see tonight.]" → "Figured. I'll be in the truck." |
| 4 | C1 L290 | "[She's right. Send me anyway.]" | "[Quintero's right. Send me anyway.]" |
| 5 | B9 L7 | "I said I'd know before your plane landed. It's still in the air." | "I said I'd know. Your team's plane is still in the air." |
| 6 | A3-12 | "Kowalczyk's toy. Tell her it worked." | "Safe's open. Kowalczyk will want to hear about her toy." |
| 7 | C2 L258 | "Everything I have on the bunker is on your phone. You get all of it from now on." | "Everything I have on the bunker is on your phone. As promised." |
| 8 | A1 L483–484 | "At six it starts going out, city by city. Turn that key and it goes everywhere in the same minute." / "Then why build a key at all?" | "At oh-six-hundred it starts going out, city by city. There's a key on here that sends it everywhere in the same minute." / "Then why build the key?" |
| 9 | A1 L322 | "I put it next to my notebook. It's his." | "I put it beside my old course notebook. Same hand." |
| 10 | C2 L272 | "If I bench four agents tonight, WREN knows we know." | "If I bench anyone tonight, WREN knows we know." |

## Finding counts

| Group | Blocker | Major | Minor | Total |
|---|---|---|---|---|
| A | 0 | 0 | 9 (A-R2-01 to A-R2-09) | 9 |
| B | 0 | 4 (B-R2-01 to B-R2-04) | 3 (B-R2-05 to B-R2-07) | 7 |
| C | 0 | 1 (C-R2-01) | 4 (C-R2-02, -03, -05; C-R2-04 is closed by A-R2-02) | 5 |

After the fixes:

- Recompile and rerun dialoguelint.
- Rerun loopcheck on B6 `challenge` and `start` (the new button condition), B2 `start` (the new gate) and A1 `identity_resume` (the gated answer).
- Update CONTRACT §3.1 (B-R2-01, B-R2-06), §3.2 (B-R2-02), §3.4 (B-R2-03), §3.7 (B-R2-04) and §4.1 (C-R2-01, C-R2-03), because those strings or conditions are marked fixed.
- A3-29b ("You took her side at the briefing.") still reads correctly after C-R2-01.
