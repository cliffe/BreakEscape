# m08 The Mole — dialogue review and rewrite (pass 4)

Written 2 October 2026 by the pass-4 dialogue writer. Part 1 is the `npc-dialog-review` skill run on the
ink as it stood after the design pass (snapshot: `<scratchpad>/m08-dialogue/ink-before/`). Part 2,
"Changes made", records the rewrite. Line numbers in Part 1 are the **before** files.

## 1. Compile and validate

- **Compile.** All 12 ink files compile with `bin/inklecate`, no errors, no loose ends. The recompiled
  JSON is byte-identical to the committed JSON, so ink and JSON were in step before the pass.
- **Validator** (`validate-before.txt`). 0 errors. The only warnings are structural and belong to the
  design review (the debrief's four `brief_taken` handlers; the confrontation cutscene mapping without
  `onceOnly`). No dialogue-facing findings: every speaker prefix resolves, no `//` in dialogue, no
  line-start `*`, no `**bold**`, brackets balance.
- **Runtime.** inkcheck and loopcheck over a 59-state matrix (the design fixer's 40 states plus 19 for
  the files it didn't cover: HaX in person, both background NPCs, ATHENA, the three suspects' return
  visits, more confrontation and debrief states): 118/118 clean.
- **dialoguelint** (`lint-before.txt`): line-len 85, text-len 11, choice-len 7, not-x-but-y 2. The
  phone ink's lines all carry `Agent HaX:`, so the lint measured them; median 23 words, max 60.

## 2. Dialogue review

Spoken-line lengths before the pass (words, prefixed lines, Narrator excluded): Netherton median 29,
max 76 (69 lines); HaX median 27, max 60; Nightshade median 25, max 81. Debrief median 30, ATHENA's
console 35, Phantom 28. m01 runs at 12. This is the longest-winded mission in the series, and the length
is the main problem with almost every file.

### 2a. Attribution and narration

- **OK.** Every prefix matches a `displayName` exactly (ATHENA, Director Magnus Netherton, Agent HaX,
  Agent 0x23 'Cipher', Agent 0x88 'Phantom', Agent 0x47 'Nightshade', Junior Analyst, Off-Duty Agent).
- **CONCERN (phone).** `m08_phone_agent_0x99.ink` puts `Agent HaX:` on all 21 lines. The brief says
  phone inks drop the contact's own prefix (m01's phone ink has none; m07 dropped them).
- **CONCERN (narration that comments).** Several Narrator lines interpret rather than show:
  Netherton's opener (`m08_director_netherton.ink:62`, 49 words, "in a suit that has not been off since
  that night"), the debrief opener (`m08_closing_debrief.ink:37`, "which is somehow worse"), the
  confrontation opener (`m08_nightshade_confrontation.ink:47`, "looks like a man who has set something
  heavy down") and the ATHENA cutscene opener (`m08_opening_briefing.ink:11`, 44 words). Camera
  directions should be shorter and concrete.
- **OK.** Delivery cues are mostly Narrator beats ("He lowers his voice.", "He doesn't blink."). A few
  could ride on the line instead, but each is one short beat; not worth the churn.

### 2a-bis. Is the dialogue supported by the scenario?

- **OK, with one note.** Netherton "does not turn around" then "Now he turns" (`:62`, `:68`): a static
  sprite can't show this, but it reads as a stage direction for a cutscene, as m07's did. Keep, shorter.
- **OK.** The debrief is a cutscene placed off the confrontation; "waiting in the corridor outside the
  interrogation suite" is an off-map exception.
- **OK.** Props named in dialogue exist: the disposition screen (erb `:1549`), the post-it by the kettle
  (`:1616`), the personnel printout in the ops-floor tray (`:1166`), the locker and USB stick, the go-bag.
- **OK.** Directions match `connections`: Director north of lobby; ops floor east; server room east of
  ops floor; archives south of ops floor; intel analysis north of ops floor; Crypto Lab west of lobby;
  interrogation room south of the lab; break room west of the lab.

### 2a-ter. Voices

- **OK.** Every speaker has a voice block; no voice shared between two characters who appear together
  (both ATHENA entries are one character; both Netherton and both Nightshade entries likewise). Accents
  are named and varied (RP, Glaswegian, Ghanaian English, Leicester, Geordie).

### 2b. Player choices are spoken dialogue

- **CONCERN.** Four scripted `You:` lines:
  - `m08_opening_briefing.ink:17` "You: What happened here?" in a choice-free cutscene;
  - `m08_nightshade_confrontation.ink:50` "You: Why didn't you?";
  - `:76` the player recites the whole case (35 words);
  - `:85` "You: You're dressing murder up as physics…" after the "[Two people are dead…]" choice: a
    scripted retort the player didn't pick.
  Fix without adding choices: let ATHENA and Nightshade carry the line (Nightshade reciting the case
  against himself is more menacing than the player doing it).
- **OK.** Choices are first-person speech throughout. Long ones: the two fate choices (28 and 31 words),
  the three debrief stance choices (16–20), the m05 quote choice (17), the go-bag choice (16). The fate
  choices are the big moment and may run long, but 31 words is a paragraph; trim to about 20.
- **CONCERN (minor).** `[Portland wasn't about the four attacks, was it.]` (`:112`) is a "not X" shape in
  the player's mouth (lint not-x-but-y).

### 2c. Hub structure

- **OK.** Every hub has a sticky exit; every topic returns to its hub; only the briefing and debrief end.
- **CONCERN (minor).** Exits run long: Netherton's `done` (`:331`, 32 words), Cipher's and Phantom's
  leave lines (up to 21), ATHENA's console exit. One or two short lines each.

### 2c-bis. Starved knots

- **OK.** loopcheck clean over 59 states. No re-enterable knot runs dry.

### 2d. Choices that matter

- **OK.** `suspect_theory` (Netherton) is read by the debrief and credits; `debrief_stance` by the credits;
  `accused_*` by the debrief, credits and Nightshade's confrontation; `nightshade_suspected` by HaX, the
  confrontation and the debrief; `named_on_evidence`/`audit_misread`/`audit_closed` by the debrief and
  credits; the fate by everything after it. The door-audit check is the best teaching in the mission:
  each wrong answer gets a short, specific correction (`:299-308`).
- **OK (stance convergence).** The confrontation hub is information choices in front of an immovable man;
  the fate choice is the outcome. The debrief stance choices converge on `the_hunt` but set
  `debrief_stance`, so they read as authored.
- **OK.** Critical-path safety: the suite code has three sources (the safe, Netherton after the audit,
  HaX's post-flag-4 answer); the card has three routes (clone, printer, KO drop).
- **Worth considering (continuity).** The earlier missions' plants mostly land: m03's badge line (HaX's
  clone text), m05's "catching insiders" briefing (interview and confrontation), the PIN cracker (ATHENA
  and a confrontation choice), "taught your intake" (Netherton, confrontation). Two gaps:
  - Nightshade never mentions the m07 intercept himself. HaX's flag-3 text ties the mail to "the sender
    stripped off the Portland intercept", but the man who sent it doesn't own it. One line in his case
    recital would close the loop.
  - The PIN-cracker exchange is good but explains ("A careful man asking to keep a device for study is
    the least suspicious thing in this building"). It would land harder with the menace left in: the tool
    was kept back so the player was always one tool short, and he chose which one.
- **Optional echo.** The Architect's teacher line from m07 ("Let it hurt afterwards, not during.") could
  come from Nightshade as the player leaves, unexplained. It ties him to the same teacher without saying so.

### 2e. Cross-file state

- **OK.** Every `#set_global` names a declared global, and every global read by another file is `VAR`-declared
  there.
- **Minor.** `witness_heard` (`m08_background_agent.ink:19`) is set and never read; the file guards on its
  local `met`. Harmless; left as is (structure).

### 2f. Influence

- **OK.** Every `+=`/`-=` on Cipher, Phantom and Nightshade carries its tag. HaX, Netherton and ATHENA
  have none, correctly (handler, director, building AI).

### 2g. Syntax and readability

- **OK.** No bold, no bullet dialogue, no stray `*`.
- **CONCERN.** Length. 85 face-to-face lines over 30 words and 11 timed texts over 30 words. The worst:
  Nightshade's "I gave them your deployment" (81 words), Netherton's Okafor confession (76), Phantom's
  Crypto Lab lead (62), Nightshade's recruitment (62), HaX's suite-code answer (60). Most make two or three
  points in one bubble.

### 2h. KO resilience (writing side)

- **OK.** The debrief reads `netherton_ko` and `nightshade_ko_before_fate`; the confrontation reads
  `nightshade_ko` and `netherton_ko`; HaX texts cover every KO. No line assumes a KO'd man is standing.

### Voice against the voice bible

- **Netherton.** Formal and exact, few contractions, but his lines run three or four sentences each and
  some soften into speeches ("checking soil for the rest of my career", "a service that forgets that
  becomes the thing it hunts"). Two hero "not X, Y" shapes: "not a break-in, a plantation" (`m08_closing_debrief.ink:117`)
  and "They did not out-think us… They were handed the board" (acceptable: it states a fact, keep).
  The bible's own example, "I have never had to say the next sentence", must stay.
- **HaX.** Right in register, wrong in length (median 27 against her m01 13). The in-person scene is the
  one place the bible allows her longer lines; even there, 52-word speeches lose the "says less than she
  feels" quality that "Don't say anything kind, I'll come apart" sets up.
- **Nightshade.** The confrontation has his best material ("Order is a candle in a hurricane", "I'm not
  asking you to forgive the sum…", "You always were better than me at the part I decided to skip"). It's
  buried in 50- to 80-word lines. He's allowed to be the longest speaker in the game, but as many short
  lines, each one a new idea. He also has no line that frightens: he is rueful throughout. The scene
  needs one moment where the player feels what he could still do.
- **Cipher, Phantom.** Distinct (Cipher anxious and over-explaining, Phantom charming and blunt), but each
  speech makes three points. Phantom's "it isn't money. It's belief." is a lint hit.
- **ATHENA.** Funny and unnerving; the console lines at 35 words lose the timing of the joke.

## 3. Action list

**Must fix**

- Nothing blocks play. No compile errors, no soft-locks, no unread gating globals.

**Should fix**

- Bring every line under the caps (85 line-len, 11 text-len), as many short lines rather than cut content.
- Fold or remove the four scripted `You:` lines (briefing `:17`; confrontation `:50`, `:76`, `:85`).
- Drop the `Agent HaX:` prefix from all phone lines.
- Trim the long choices (fate, debrief stance, m05 quote, go-bag) and rephrase the "wasn't about" choice.
- Narration: shorter, concrete, no commentary.
- Nightshade: give the confrontation menace as well as grief; let him own the m07 intercept.

**Worth considering**

- The m07 teacher-line echo, from Nightshade, once, unexplained.
- Exit lines to one or two short lines.
- `witness_heard` is never read (structure; left alone).

## Changes made

All 12 ink files and 16 erb strings (15 timed texts, one task description). Words only: no tag, knot,
variable, divert, condition or sticky/once-only mark changed in any file, and the rendered erb is identical
to the before-copy apart from `message`/`description` text. Long lines were split into several short
lines rather than cut, so every fact a player needs is still said, in the same knot and the same order.

### Per file

| File | Prose lines before → after (changed) | What changed and why |
|---|---|---|
| `m08_nightshade_confrontation.ink` | 51 → 75 (~54) | See "The confrontation" below. Three `You:` lines gone; long choices trimmed. |
| `m08_director_netherton.ink` | 95 → 114 (~41) | Every speech split to one point per line (median 25 → 18 words). Opening narration from 49 words to 23, without the commentary. "I have never had to say the next sentence" kept as its own line. Nightshade's entry adds "He has stood beside me at most of your briefings" (design review §4: he was in the room for m02–m06). `done` exit cut to two sentences. Door-audit check: questions, answers and the ten corrections untouched; the confirmation step and `audit_right` split into short lines, and "That is a door, not an account" kept, because that distinction is what the check teaches. |
| `m08_closing_debrief.ink` | 38 → 58 (~40) | The Okafor confession (76 words) is now four lines, with "Two of ours are dead in the space between what I knew and what I did" on its own. Every number and name is still read aloud. Sermon endings cut ("That is how mole hunts damage…", "a service that forgets that becomes the thing it hunts"); the hero "not a break-in, a plantation" gone. The wrong-first-call line no longer says "Cipher, or Phantom" to a player who named only one ("Your first name for me was the wrong one."). Triple-agent branch keeps "with my eyes open", which now echoes Nightshade's line. |
| `m08_phone_agent_0x99.ink` | 39 → 51 (~33) | **All 21 `Agent HaX:` prefixes removed** (checked: `grep 'HaX:'` finds nothing). Lines split to phone length (median 23 → 12, max 60 → 24). The suite-code answer keeps every step (keypad, south of the lab; safe; service number; signed printout in the ops-floor tray). |
| `m08_agent_0x99.ink` (HaX in person) | 20 → 30 (~17) | Her 50-word speeches split; "Don't say anything kind, I'll come apart" untouched. "God." used once (her only one in the mission). |
| `m08_suspect_nightshade.ink` | 33 → 42 (~20) | Split; menace sharpened in two places ("Nothing convicts them like it, either. I try not to dwell on that half."; "I could teach it to you, though I don't think we'll have the time."). The m05 choice is now "[You taught me that. …]" (14 words). |
| `m08_suspect_cipher.ink` | 35 → 46 (~20) | Split, keeping his over-explaining. Alibi line now says the auth log will show his **account** never touched the share (was "badge"), which matches the door-log/auth-log distinction Netherton teaches. "It's just not the something you're selling tickets to" → "It's just a very boring something, with a great deal of maths in it." |
| `m08_suspect_phantom.ink` | 25 → 37 (~19) | Split. "it isn't money. It's belief" (lint) → "There's no money trail. So it's belief." |
| `m08_opening_briefing.ink` | 8 → 11 (~9) | "You: What happened here?" removed; ATHENA says "You are wondering what happened here." (she logs everything, so she reads minds too). Narration 44 → 17 words. |
| `m08_receptionist_ai.ink` | 10 → 13 (~6) | Each hint split so the joke lands on its own line. Hints unchanged (kettle; signed printout in the ops-floor tray). |
| `m08_background_agent.ink` | 10 → 11 (~2) | The testimony split in two; times and the "Cipher. Or not." hedge kept exactly. |
| `m08_background_analyst.ink` | 5 → 5 (~2) | Trimmed. |
| `scenario.json.erb` | 16 strings | 11 over-length texts brought to 30 words or fewer, 4 more trimmed; every route and pointer kept (Netherton-KO text: card on the floor, reception printer, PIN in the break room). Task description "not just how they answer" → "as well as how they answer". |

### The confrontation

The brief asked for the climax of the arc: menace and grief, the earlier plants paid off, earned rather
than explained.

- **Shape.** The player no longer recites the case. Nightshade does it himself ("Forty-seven minutes on
  the Portland plan… My account, my terminal, my mail."), which shows he is ahead of the room, then
  "So you have the what. You came for the why." and the candle speech in four lines.
- **The m07 intercept.** New line: "The name they stripped off that intercept in the cable vault was mine.
  They've always cleaned up after me." It agrees with m07 ("the name stripped before it reached us") and
  with HaX's flag-3 text, and it is the first time he owns the leak by name.
- **Menace.** "They've always cleaned up after me." / "I doubt I was the only tired one they found."
  (plants Netherton's debrief worry about others) / on the PIN cracker, "Every lock it would have opened in
  a minute, you opened the long way… I chose what you went in without." / the triple-agent answer keeps "for
  exactly as long as it suits me" and "Never forget I told you that part".
- **Grief.** "God help me, it felt like honesty", the vanity line, "Perhaps. You always were better than me
  at the part I decided to skip" (the player's old scripted retort is now his: "You're thinking I dress
  murder up as physics…").
- **Plants paid.** m03 badge (HaX's clone text, unchanged); m05 "catching insiders" (interview choice and
  confrontation, with the m05 three-part quote said once only, in the interview); PIN cracker (ATHENA,
  confrontation); fifteen years and the player's intake (Netherton, "the barracks you slept in years
  later", "since I taught you").
- **The m07 teacher line.** Nightshade's last words, on every path: "And 0x00. Let it hurt afterwards, not
  during." These are the exact words HaX and the Architect use in m07. Nothing explains them.
- **Kept word for word:** "Order is a candle in a hurricane", "I'm not asking you to forgive the sum. I'm
  telling you I did it with my eyes open" (his one rhetorical contrast for the scene), the coordinates, "The
  dead were... the cost of your attention being elsewhere."

### Lint, before and after

| Rule | Before | After |
|---|---|---|
| line-len (person > 30, phone > 25) | 85 | 0 |
| text-len (timed text > 30) | 11 | 0 |
| choice-len (> 15) | 7 | 0 |
| not-x-but-y | 2 | 0 |
| you-after-choice | 0 | 0 |

Medians (words per spoken line): Netherton 29 → 18, HaX in person 33 → 15, HaX phone 23 → 12, Nightshade
25 → 15, debrief 30 → 17, Phantom 28 → 15, Cipher 26 → 16, ATHENA console 35 → 19. Timed texts: median
33 → 28, max 71 → 30. Files: `<scratchpad>/m08-dialogue/lint-before.txt`, `lint-after.txt`.

### Checks

- **tagdiff** against the snapshot, per file: **STRUCTURE UNCHANGED** in all 12 (`tagdiff.txt`). `You:`
  lines 4 → 0. Against git HEAD the mission still shows the design pass's 89 intended differences; this
  pass adds none.
- **Compile:** all 12 recompiled with `bin/inklecate`, no warnings; `.json` in step.
- **Validator:** 0 errors; output identical to before (same two structural warnings from the design pass).
- **Doors:** all OK. **Render:** OK; structure identical to before apart from text.
- **reopencheck** (`m08_the_mole`): 1800 reopens, **0 problems**.
- **inkcheck + loopcheck**, 59 states (`matrix.sh`): **118/118 clean** after, as before.

### Spoken lines touched

About 140 old lines rewritten into about 265 new ones across the ink (most are splits, so the
words are largely the same), 8 choice texts, and 16 erb strings. By speaker, roughly: Netherton 50
(briefing 28, debrief 22), Nightshade 45 (confrontation 33, interview 12), HaX 30 (phone 21, in person
9), Cipher 12, Phantom 11, ATHENA 10, Narrator 9, background 3. HaX's texts: 15. m08 audio isn't generated
yet, so none of this costs anything now.

### Not done, and for the log

- `witness_heard` is set and never read (`m08_background_agent.ink:19`). Left alone because removing it
  is structural.
- Nightshade's job title: aligned with the voice bible in the script edit round (below).
- Not browser-tested. Static checks only. The confrontation now has more, shorter lines (about 30 clicks
  on the longest path instead of 20); a read-through on screen would confirm the pace.

## Script edit round

Applied 2 October 2026 from `DIALOGUE_EDIT_NOTES.md` (verdict: revise, light), with the orchestrator's
approval of the two structural items S1 and S8. The candle speech, "eyes open" and the closing teacher line
are unchanged, word for word.

| Item | Change |
|---|---|
| M1 | Confrontation opening: one evidence recital. "You found it. Forty-seven minutes on the Portland plan, two days before you deployed. My account, my terminal, my mail." then "The name they stripped off that intercept in the cable vault was mine." The second recital, "They've always cleaned up after me." (S5) and "So you have the what. You came for the why." are gone. |
| M2 | Title is "cryptographic-hardware analyst" in Netherton's suspect line; the dossier (erb, "Cryptographic-Hardware Analyst (seconded to mission planning)"); the personnel printout (erb); `mission.json` role. No "Operations Specialist" is left in m08. |
| M3 | Flag-4 texts: "The root file says what that night was for: our threat database." Both versions are 30 words. |
| S1 | **Structural (approved).** `the_case` is now a one-option choice, `+ [It's over, Nightshade. Tell me why.]`, which leads into the candle speech and then `-> hub`. |
| S2 | "He answers evenly." cut; "You'd call it dressing murder up as physics. Perhaps. You always were better than me at the part I decided to skip." |
| S3 | Recruitment: "Not with money, {player_name}. Money buys a coward. They look for the ones who've started to suspect it's all a delaying action." |
| S4 | Interview choice `[Your insider briefing. "The calm…"]`; confrontation choice `[Netherton told me to learn mole-catching from you.]` (the m05 line), reply "He did. Every word I taught you was true." |
| S6 | Volunteered-coordinates path: "You never asked about The Architect…" and "Everything they took from us went there, and so will you." |
| S7 | "The code card is in my safe, with Dr Okafor's evaluation. Read her evaluation before you face him." |
| S8 | **Structural (approved).** Debrief `close`: if the player never asked "[Then what now.]", Netherton adds one line before "Go home": "Montana in seventy-two hours, Agent. Tomb Gamma." (coordinates known) or "Seventy-two hours, Agent. Then we find Tomb Gamma." (not known). Every debrief path now ends on the hook to the next mission. |

None of the optional items were taken.

**Intended structure differences against the snapshot (5, all approved):**

- `m08_nightshade_confrontation.ink` (2): the new sticky choice in `the_case` (`+ -> hub`) and its
  per-knot choice count (S1).
- `m08_closing_debrief.ink` (3): the conditions `not asked_next`, `tomb_gamma_location_known` and `else` in
  `close` (S8).

The other 10 files report STRUCTURE UNCHANGED.

**Checks:**

- All 12 ink files recompiled; `.json` in step.
- dialoguelint: no rule fires.
- reopencheck: 0 problems.
- inkcheck/loopcheck: 64 states, 128/128 clean. That is the 59 states from before plus `the_case` entered
  directly (twice) and `close` with and without `asked_next` and the coordinates.
- Validator output is identical to before.
- Doors all OK; `mission.json` parses.

**Spoken lines in this round:** about 14 (7 rewritten or merged, 7 removed, 2 new debrief hook lines), plus
3 choice texts (one new), 2 timed texts, 2 document strings and one `mission.json` field.

## Playtest round

Applied 2 October 2026 from `tools/playtest/m08-pass4-dialogue-report.md` and the orchestrator's list. The
candle speech, "eyes open" and the closing teacher line are unchanged.

| Item | Change |
|---|---|
| Worst lines | Netherton debrief: "seeds… checking soil" → "There may be others in this service, recruited the same way and still waiting." / "I shall spend the rest of my career reading our own files."; "thank you for the shape of it" → "I shall carry it regardless. Thank you." Phantom: "Same three as yours, minus me." → "The other two on your list…"; exit → "When the logs back me, tell the Director I was right to look." HaX in person: "You're thinking Nightshade too. The quiet one." → "Don't make me say a name." / "I used to envy one of them for how calm he is. Tonight I don't…" (no name; the calm points the way). Nightshade interview: "Watch the person who teaches you…" → "Don't rule anyone out because they wrote the list."; the truth antithesis → "The truth clears people, properly examined. I've always found that a comfort."; "My calm is what caring costs…" → "I've been grieving a long time, 0x00. Longer than nine days. It wears smooth." Cipher's default exit is now a three-line sequence. Off-Duty Agent's filler "Same rumours…" → "Phantom's stopped being charming. Nightshade's the same as ever." HaX first call: "So I'm going to be very professional tonight. Bear with me." |
| Montana prompt | "Montana. Work out what Portland was really for, and where it went, and you'll have your Montana." This points to the database topic and then the Architect topic, without promising a choice the player can't see yet. |
| HaX server-room answer | **Structural.** New branch after the KO case: once `cipher_seen`, `phantom_seen` and `nightshade_seen` are all set (existing scenario latches, set on interview or KO), she answers "You've seen all three. Back to the Director, and stand close with the cloner. Or the visitor printer at reception." |
| Print pointer | The USB stick's observation now ends "…a clean thumbprint on the casing, worth checking against the locker's owner." HaX's lift text adds "Check it against the locker's owner." Neither names him. |
| Exit replies | Netherton "[Understood, Director.]" → "Go."; Off-Duty Agent "[I'll leave you to it.]" → "Mind the door."; Junior Analyst (same choice, caught by the new `exit-no-reply` lint) → "Close the door behind you. Please." |
| Confrontation hub | Topics reordered: why, recruitment, PIN cracker, "Netherton told me", go-bag, then the database reveal, then the Architect. Replies of three or more lines tightened: recruitment 4→3, "taught" 3→2, database 4→2 ("That was the night's real work." cut), Architect 4→3, "what you did" 4→3. Nothing a player needs was cut. The coordinates still have their own line. |

**Structure differences** (cumulative against the snapshot, all intended):

- confrontation (2): S1, unchanged since the last round. The hub reorder is not a structural difference;
  tagdiff compares choices as multisets.
- debrief (3): S8.
- phone (4, new): `VAR cipher_seen`, `phantom_seen`, `nightshade_seen` and the condition
  `cipher_seen and phantom_seen and nightshade_seen`.

Cipher's `{&…|…|…}` exit sequence is inline prose to tagdiff. It is logic in effect, so it is listed here. The other 9 files are STRUCTURE UNCHANGED.

**Checks:**

- All 12 ink files recompiled; `.json` in step.
- dialoguelint: no errors and no warnings. 8 `blank-reentry` checks remain; see below.
- reopencheck: 0 problems.
- inkcheck/loopcheck: 69 states, 138/138 clean. The 5 states added this round are: the phone with all three seen; the
  confrontation hub with and without the database asked; the Off-Duty Agent's hub; and Cipher's exit.
- Validator: 0 errors. One new suggestion (ATHENA and the Junior Analyst share `female_office_worker_v2`).
  It comes from a validator check committed today; no sprite was touched in this pass.

**Left for the orchestrator:**

- `blank-reentry` (8 hubs: Netherton, both suspects' and both background hubs, HaX in person, ATHENA's
  console, the debrief). This is the playtest's finding 2, a re-talk that opens on bare choices. The m03
  `hub_quiet` pattern fixes it, but that means a new knot and flag per NPC, so it is structural, or an engine fallback. Not done here.
- The auto-advance holding every line for about 5 s whatever its length (playtest pace verdict) is an engine
  item.

**Spoken lines in this round:** about 30. That is 14 rewritten, about 12 merged or removed in the hub tightening, and
3 new exit replies plus 2 new sequence variants, with 2 erb strings (one text, one observation).
