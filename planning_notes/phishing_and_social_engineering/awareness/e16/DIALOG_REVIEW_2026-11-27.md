# ca16 Insider risk: dialogue review of the new lines (2026-11-27)

Scope: the spoken and written text added by commit `aadb4e239` (insider risk defined in the brief, Anjali's welcome and the debrief), in `ca16_insider_risk` and `ca16_insider_risk_defend`. New lines only; the rest of the ink was read for flow but not re-reviewed. Run before voicing.

Speaker note: Anjali Rao, information security analyst, calm and attentive, no stated mannerism, so she gets the full concision check.

## Step 1: compile, validator, lint

| Check | ca16_insider_risk | ca16_insider_risk_defend |
|---|---|---|
| `compile-ink.sh` | 1 compiled, 0 failed, no loose ends | 1 compiled, 0 failed, no loose ends |
| `validate_scenario.rb` | 0 errors, 24 warnings (none dialogue-facing, none new) | 0 errors, 10 warnings (same) |
| `dialoguelint.mjs` | no findings; max line 25 words | no findings; max line 23 words |
| `loopcheck.js` at `hub` | clean, 200 steps x 6 strategies | clean |
| node tests (`social-*`, `*beat*`, `validator-social-awareness`) | 176 files passed, 0 failed | |

The generator (`gen_e8_e17_shells.py`) now reproduces the defend ink byte for byte. Before this pass it held the welcome as one line while the committed ink had two, so a re-run would have undone the split.

## Step 2: findings

### Fixed in this pass

**F1. The definition, both files (Should fix, P13 and consistency).**
Before: "Insider risk is harm from people who already have access. Mostly it's an accident, now and then it's on purpose."
After: "Insider risk is harm from people who already have access. Mostly by accident, sometimes on purpose."

Reasons:
- The second sentence was two clauses joined by a comma, and "it's an accident" has no clear subject after "harm".
- The episode had three wordings of one definition: the trailer ("Mostly accidents. Sometimes on purpose."), the brief ("mostly by accident, sometimes on purpose") and the spoken line. The spoken line now uses the brief's words and the trailer's beat, so a learner who saw the trailer hears the line they came in with. It is four words shorter.
- "Sometimes" matches the brief and the trailer. "Now and then" sounded a little more natural but was the odd one out.

**F2. Defend welcome, second line (Should fix, P9 and P11).** `ca16_insider_risk_defend/ink/anjali_rao.ink:32`
Before: "You're not here to catch anyone. Start at the kiosk. Raise a concern as facts, then sort the messages. Tell me what you're offered."
After: "You're not here to catch anyone. Tell me what you're offered. At the kiosk, raise a concern as facts, then sort the messages."

"Start at the kiosk. Raise a concern as facts..." was one instruction cut in two, and "Tell me what you're offered" hung off the end after the routing. The standing rule now sits next to the reassurance and the kiosk instruction closes the line, which is where the player goes next. Three sentences, three points, two words shorter. This line is a new clip either way because the welcome was split.

**F3. Debrief card "What insider risk means", both scenarios (Should fix, P8).** full erb :641, twin :449, fragment `e16/defend.json:259`
Before: "A small part is deliberate, such as taking money for access, and that part is rare."
After: "A small part is deliberate, such as taking money for access."

"A small part" and "that part is rare" said the same thing twice. "Rare" is also the harder claim to stand behind: published incident breakdowns usually put negligence at a bit over half and deliberate insiders at around a fifth to a quarter, which is a small part, not a rare one. "Mostly by accident" is safe on the same figures.

### Checked and left alone

- **Flow in the full welcome** (`ca16_insider_risk/ink/anjali_rao.ink:57-60`). :57 ends "You're not here to catch anyone", :58 defines the term, :59 says what to do ("bring me the facts rather than a theory"). Reassurance, definition, action. It reads cleanly and the definition's "on purpose" is boxed in on both sides by no-suspicion lines, which is what the owner asked for. See the owner question below for the alternative order.
- **Monologue (P5, mild).** The full welcome is now four NPC lines before the only choice. Each carries a different thing (who she is and the week, the definition, the three habits, where to go), and a welcome is heard once, so it stays. It is at the limit: nothing more should be added here.
- **TTS readiness.** No `{var}` text, no stage directions, no asterisks, no colons, semicolons or dashes in the three spoken lines. All resolve to `Anjali Rao` exactly.
- **Spoken and written layers.** The definition is spoken once per sitting and written in the brief and the card. That is the read-back copy, not P2.
- **Brief sentence** ("Insider risk is harm that comes from people who already have access: mostly by accident, sometimes on purpose."). Clear, accurate, and placed before the week's set-up in both briefs. The colon is fine in writing.
- **Card, rest of the text.** The examples (a borrowed login, a client list sent to a personal inbox, money for access) are all things the episode plays, and the close ("take the facts to the right person, and leave suspicion of colleagues out of it") is the anti-spying message stated outright.
- **Borrowed-login outcome** (full erb :672). "Nothing was taken this time, but the record says it was you; a reset would have cost two minutes." This fixes "Harmless this time" and agrees with Anjali's done lines about a name on the audit. One mild wobble: the same sentence pair says the entry was "on the record until it was explained" and then "the record says it was you" in the present tense. Readable as it stands, so not changed. A tighter version if wanted: "Nothing was taken this time, but until it was explained the record said it was you; a reset would have cost two minutes."

### Offensive angle

The spoken definition is neutral, which suits a host line. The attacker's side is carried elsewhere in the episode (the offer, the sign-in prompts, "tell me what gets offered to you"). The card's deliberate example, "taking money for access", describes the insider's act. Nothing in the three definitions says that the deliberate case usually starts with someone outside making an approach, which is the part this course can tell better than most. That is a content choice, so it is an owner question, not a fix.

## Concision (2l)

- Counts: P9 strong 1 (F2, fixed), P13/P8 strong 2 (F1, F3, fixed), P5 mild 1 (full welcome, kept). Repeat facts across NPCs: none (one speaker). Monologues of four or more lines: 1, justified. Mannerism speakers skipped: none.

## Step 3: action list

Must fix: none.

Should fix: F1, F2, F3, all done in this pass.

Worth considering:
- Reorder the full welcome to match the twin (owner question 1).
- Name the outside approach in the card (owner question 2).
- The tense wobble in the borrowed-login outcome.

## Lines to voice

| File:line | Text |
|---|---|
| `scenarios/ca16_insider_risk/ink/anjali_rao.ink:58` | Insider risk is harm from people who already have access. Mostly by accident, sometimes on purpose. |
| `scenarios/ca16_insider_risk_defend/ink/anjali_rao.ink:31` | Anjali Rao, information security. Insider risk is harm from people who already have access. Mostly by accident, sometimes on purpose. |
| `scenarios/ca16_insider_risk_defend/ink/anjali_rao.ink:32` | You're not here to catch anyone. Tell me what you're offered. At the kiosk, raise a concern as facts, then sort the messages. |

The full episode's :57 is unchanged and keeps its clip (`tts_cache/ca16_insider_risk/a33a8692d706675e6bb7a526170a3311`). The twin's old one-line welcome clip (`tts_cache/ca16_insider_risk_defend/bfbd24db169f97936ddefae2935cb8e9`) is now an orphan for the next prune.

## Owner questions

1. **Order of the full welcome.** The twin says name, definition, then "You're not here to catch anyone". The full episode says name, the week, "You're not here to catch anyone", then the definition. Matching the twin would put the reassurance straight after "sometimes on purpose" in both, at the cost of re-voicing :57 as well. Kept as is for now.
2. **Outside approach in the card.** Should the deliberate example say where it usually starts, for instance "A small part is deliberate, and it often starts with an approach from outside: money for access"? It would bring the attacker's side into the definition. Not changed.
