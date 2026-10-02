# m06 Follow the Money — script editor's notes on the dialogue pass

Fresh review, 2 October 2026. Read-only apart from this file.

Baseline: the writer's snapshot `<scratchpad>/m06-dialogue/ink-before/` (ink) and
`scenario-before.json.erb`. The current files were compared against it line by line. Line numbers
below are the **current** files unless marked "before". References: `docs/agents/PASS4_BRIEF.md`, the
dialogue style guide, the voice bible, the humanizer rules, `DIALOGUE_REVIEW.md`, and the m07 notes
as the bar.

The short version: a good pass, and safe. Priya now sounds like Leeds and Dani like Peckham, the
scripted `You:` lines are gone, HaX is back to fact-first, and Satoshi has
stopped shouting. The puzzle text is intact and still solves to one slot. Two things need fixing
before it ships. One of Irina's lines lost the antecedent the player's evidence used to supply. And
the writer fixed Priya's "every Friday night" but left three other descriptions of the deposits
("together", "same amounts, same times") that contradict her own write-up. Verdict at the end:
**revise** (light).

## 1. Logic safety (mechanical checks)

All run by me in this session; output in `<scratchpad>/m06-scripted/`.

| Check | Result |
|---|---|
| `tagdiff.mjs --old <before> <after>`, each of the 8 ink files | **STRUCTURE UNCHANGED** in 7. The phone ink has exactly the two logged differences: `VAR entered_data_center` (`:76`) and the `{not entered_data_center:}` condition in `recap` (`:282`). `You:` lines 16 → 0. |
| erb diff against `scenario-before.json.erb` | Nine timed texts reworded, Dani's credit pronoun, the new global and its two `setGlobal`s on the existing `room_entered:data_center` mappings. Nothing else. |
| Compiled JSON in step with the ink | Recompiled all 8 with `bin/inklecate` into scratch; every JSON matches the committed one. |
| `dialoguelint.mjs` | 0 errors, 0 warnings. Medians: debrief 13, analyst 11, guard 9, Irina 12, trader 10, briefing 16, phone 13 (max 21), Satoshi 10. Timed texts median 25, max 30. |
| `reopencheck.mjs … m06_follow_the_money` | agent_0x99_handler, 1800 reopens, **0 problems**. |
| inkcheck + loopcheck over the writer's 14-state matrix | **224/224 clean**. |
| Recap fuzz (my own, `recap.js`): 20,000 random states through `recap` | Never prints an empty recap now that "That's where we are." has gone. |

The recap gate is right. Both `room_entered:data_center` mappings require `found_architects_fund !==
true`, and the gated line only shows while the fund isn't found, so every case where the direction
could print is covered.

**The puzzle, re-solved from the rendered erb** (`rendered.json`). Fee 1.5%, minimum hold 6 hours
(`mixer_pool_config.yml`). Deposits from Priya's write-up:

| Deposit | Expected credit, earliest time | Settlement log | Result |
|---|---|---|---|
| 14 Jul 21:40, $2,400,000 | $2,364,000, from 15 Jul 03:40 | 3815 at 01:15 (too early); **4471 at 04:20**; 5093 $2,346,000 (digits swapped) | 4471 |
| 29 Jul 22:10, $1,200,000 | $1,182,000, from 30 Jul 04:10 | 6120 $1,200,000 at 02:40 (no fee, too early); **4471 at 05:05** | 4471 |
| 03 Aug 20:05, $680,000 | $669,800, from 04 Aug 02:05 | 2207 at 01:50 (15 min early); **4471 at 03:35** | 4471 |

Only 4471 fits all three; 3815 and 2207 are still the amount-only decoys, 6120 the no-fee decoy, 5093
the misread one. The write-up, settlement log, pool config, custody index and fund document are
byte-identical to the before-copy. Priya's method line (`m06_npc_analyst.ink:315`) lost only a colon.
Irina's narrowing lines (`m06_npc_irina_volkova.ink:461-462`) and her slot-check replies (`:501-526`)
are unchanged. HaX's three rungs (`m06_phone_agent_0x99.ink:437-441`) are unchanged apart from the
prefix. Rung 2 has a small, pre-existing wording problem (S4).

## 2. Information: what the player needs, and where it is now

Walked the critical path and each optional branch against the before-copy and the room
`connections` (lobby → checkpoint → trading floor; lab east, Irina's office west, server room north;
data centre north of that; executive wing east of the data centre; Satoshi north of the wing).

| Step | Where it's delivered now | Findable again? |
|---|---|---|
| Cover, and Volkova on the trading floor | Briefing `m06_opening_briefing.ink:89-93`, `:118`; text on briefing close; recap `:252-253` | Yes |
| Guard: say FCA, name Dr Volkova | Guard ink `:59-83`; recap "You've an appointment" | Yes (retry) |
| Volkova's wordlist | Irina `:223-247` (second ask always works); `password_help` `:199`; recap `:258-263` | Yes |
| Server-room passphrase: term + year | Checklist object at the checkpoint; text on `server_passphrase_known`; recap `:266-267` | Yes; text blurred, see S1 |
| Irina's office badge (west, RFID) | Text on entering the floor; recap `:256`; Irina lend `:290-305` or clone `:314-331` | Yes |
| Priya's write-up, lab east | Text after meeting Irina; `blockchain_help` `:213`; recap `:270`; `fund_hint` `:431` | Yes |
| Backend: build service, then reuse | Texts on the VM launcher and flag 1; recap `:273`, `:276`; guides | Yes; see S2 |
| Financial DB runs the doors; data-centre code in the export, north door | Flag-3 text; recap `:279`, `:283` (now gated) | Yes |
| Matching method | Priya `mixer_matching` `:311-317` (sticky); write-up section 2; `fund_hint` ladder (sticky); text on entering the data centre; Irina `slot_wrong` `:520` | Yes, four places |
| Vault account before going upstairs | Text on entering the wing early; recap `:291` | Yes |
| Spare executive badge from Volkova; wing east of the data centre | Fund-found text; recap `:293-301`; Irina `:355-356`; relay for a KO | Yes |
| Safe code 2140 | Irina `:465`; recap `:304`; the Architect's email P.S. | Yes |
| Freeze or watch, and the cost | Phone `critical_choice_preview` `:384-386`, `handler_recommendation` `:398-402`; Satoshi `:265-267` | Yes; watch cost blurred, see S3 |
| Irina's fate | Phone `on_network_complete` `:410`; recap `:316` | Yes |
| All four flags before extraction | Recap `:319` | Yes |

Losses and blurs, by severity:

- **M1 (must-fix).** Irina, `evidence_pivot` else-branch `:389`. The before-copy had the player say
  "Hospital ransoms. Exploit sales." (before `:389`). Now the narrator only says "You point at the source wallets, one
  by one." Two lines later (`reveal_identity` `:405`) she says "My work. Used to kill people." On this
  branch she hasn't seen the fund or the casualty line, so the deaths come from nowhere. This is the
  likely route for a player who goes to the lab before the data centre. Replace `:389`:
  "Narrator: You point at the first wallet. RansomInc. The hospital ransoms, pooled."
- **M2 (must-fix). Three pattern descriptions contradict Priya's own write-up.** The write-up has three
  named deposits on three different dates (14 Jul, 29 Jul, 3 Aug), at three different round amounts,
  all late in the evening. The writer fixed "every Friday night" but these still say the wallets move
  together, at the same amounts, at the same times:
  - Priya `m06_npc_analyst.ink:70` "Several wallets converting to Monero together, similar amounts,
    timed like they're in step." Replace: "Big money through our mixer. Big round sums, always late in
    the evening."
  - Priya `:184` "Big wallets, converting together, regular as a bus timetable." The dates aren't
    regular either. Replace: "Big round sums, late evening, straight into the mixer. Same habit every
    time."
  - Dani `m06_npc_trader.ink:208` "Big wallets mixing together, same amounts, same times." Replace:
    "Big round sums going in late at night. Same wallets, same habit."

  A player doing the matching reads these and goes looking for simultaneous deposits that don't
  exist. That's the kind of slip the writer's own review called must-fix. (Priya's general method line
  `illegal_patterns` `:149`, "Unrelated wallets that mix at the same time…", is about laundering in
  general and can stay.)
- **S1.** Timed text on `server_passphrase_known` (`scenario.json.erb:916`): "the checklist dates
  itself" now means "the checklist shows its age" to most readers, which is the wrong hint. The year
  *is* the checklist's date (Rev. January 2025). Replace (26 words): "House rule: a crypto term and a
  year. The checklist's own date is the year. The term tops the list people here use. Volkova keeps
  one." The recap (`:266`) says it plainly, so it's findable, but the text is the first time the player
  hears it.
- **S2.** `password_help_choices` `:205` "John's default list is enough there." A player who doesn't
  know the tool reads "John" as a person. Replace: "The cracking guide covers it. John the Ripper's
  default list is enough there." (Still at citation level; the before-copy named the tool too.)

## 3. Character

**HaX.** Back to her voice: fact first, short, no grades, no "Priority one", no sign-off on the
recap. The best lines are hers: "Don't argue privacy with her. She'll win. Argue about what it's
buying." (phone `:240`), "Our profile says that keeps her up at night. Not enough to quit." (phone
`:229`), the Tesseract beat that stops at "Let's leave it there for tonight." (debrief `:433`), and
"Their people will be glad you wrote it and not someone from the FCA." (debrief `:358`). The FCA letter is a good scene. Two
habits to trim:

- **Optional.** "My guess?" (phone `:220`) is a rhetorical opener (humanizer 33). "Probably one wallet every
  cell draws on." does the same job.
- **Optional.** `on_network_choices` `:420` "He'll be expecting someone. Let it be you." is a
  sign-off motto. Cut to "Copy. I'm on the line."

**Nightshade.** His one line (briefing `:30`) is untouched and still the double-edged one the log
approved ("the mixers stop hiding people and start revealing them"). Leave it.

**Netherton.** Two lines, terse, hands over. Right.

**Irina.** Guarded, exact, few contractions, and the writer kept her. One cut went too far:

- **S5.** `discuss_badges` `:285` "Four years round my neck. The badges I would defend." The fronted
  object makes it read as a garble. Before: "The badges are the one part of our security I'd defend."
  Restore that wording as its own sentence (the line stays under 20 words).
- **Optional.** Choice text mixes "Dr Volkova" (`:106`, `:413`) and "Dr. Volkova" (`:196`, `:202`, and
  Dani's hub `m06_npc_trader.ink:75`). UK style in choices is "Dr"; speaker prefixes must stay as they
  are.

**Priya and Dani.** Covered names, you can tell them apart: Priya has "me" tags, "nowt", "Ta",
"I just draw the pictures"; Dani has "innit", "Safe", "Rammed", "Legal and that". Priya's repeated "I
just…" (`:34`, `:298`, `:344`) is her minimising herself, and the confession at `:344-346` pays it off.
Keep it. Three small things:

- **S6.** "Honestly?" is now a mission-wide tic: Priya `:243` and `:329`, Dani `:33` and `:214`. Give it
  to Dani, who is the jittery one. Priya `:243`: "*uncomfortable* It looks bad." Priya `:329`: delete the
  line and move the cue to `:331`: "*stops typing* I love this job. I love privacy tech."
- **S7.** Dani `irina_discussion`: the player has just asked "What's Dr. Volkova like to work for?" (hub
  `:75`) and the follow-up choice at `:242` is "[What's she like?]", the same question again. Replace
  the choice: "[Do you get on with her?]". The reply ("Intense. Bit distant. Fair, though.") fits.
- **Optional.** Dani `:250` "She's been stressed lately, mind." "Mind" is Priya's northern word
  (`:162`). Dani: "She's been stressed lately, though."

**Satoshi.** The capitals are gone and he's calm and amused, as the voice bible wants. "Slowly, with
paperwork." (`:141`), "I'd rather it fell on a schedule." (`:180`) and "You've costed it. So have I."
(`:399`) are the right kind of villain line. He's been cut harder than anyone (154 → 124 lines), and
he's now as clipped as HaX. A villain gets more room than that.

- **Optional.** Let one line per beat run long. For `:141`: "The system you protect kills people too.
  Medical debt, evictions, a pension fund that bets on both. It just does it slowly, with paperwork."
  (25 words.)
- **Optional.** "I just…/We just…" five times (`:143`, `:152`, `:336`, `:351`, `:401`). Cut "just" from
  `:143` and `:401`.
- **Optional.** `strategic_explanation` `:299` "You can't win, {player_name}. You can only choose how you
  lose." (pre-existing) is a stock line. Replace: "Either way, {player_name}, I've already been paid
  for tonight."
- **Optional.** He's American but says "speciality" (`:334`). Use "specialty".

**The guard** is unchanged and is still in good shape.

**Narrator.** Mostly camera now. The writer cut "She'd never feel it read." (`:303`) and "as if he
rehearsed it" (`:464`), both of which interpreted. Right.

## 4. Craft, and the structure items the writer couldn't fix

**Choices** are first person throughout and there are no echoes. The menu labels are gone apart from
one:

- **S8.** Debrief `strategic_impact` `:90` "[Tell me about The Architect's Fund]" is still a label with
  no full stop, and its pair at `:74` already says "[Start with the fund.]". Replace: "[And the fund?]"

**Debrief.** It reads every choice back by name (freeze/watch, Irina's fate and how she was worked,
the confirmed slot, Satoshi KO, the safe file, the FCA picks), and HaX doesn't grade. The tightening
left some repeats closer together:

- **S9.** The projection is read twice in one scene: `fund_implications` `:120` and again in the watch
  branch of `cell_disruption` `:143`. Every route plays `:120` first. Keep `:143`'s "The projection on
  that document is the one we agreed to watch." and cut the number after it.
- **S10.** `operation_disrupted` (`:96-101`) and `cell_disruption` (`:137-143`) say the same thing on the
  "What's left of that clock?" route: paid cells keep their money, frozen cells get nothing, every
  payout is tagged. Make `operation_disrupted` about the clock only, and leave the cost to
  `cell_disruption`:
  - freeze: "You froze it before the payout. The clock ran down on an empty wallet."
  - watch: "You let it run. The payout went out on time, and every wallet it reached is tagged."
- **S11.** `mission_conclusion` restates the scene. `:449` "For the first time we can see how the
  cells connect." repeats `:72`; the `{irina_recruited:}` line `:455` "And Irina Volkova gave us the
  mixer." repeats `:191`. Cut both (the empty block can go with its line), and start `:451` without
  "And": "The man in the corner office was Satoshi's Ghost. The Crypto Anarchists' own leader."
- **Optional.** `recruitment_validation` `:206` "Pool keys and the wallet map before midnight, and the
  account that paid her." Without a verb it reads as a deadline, and the debrief is at four in the
  morning. "She sent the pool keys and the wallet map before midnight, and named the account that
  paid her."
- **Optional.** `:263` "Good. Know what they've already told themselves." is a maxim. "Good. You knew
  what she'd been telling herself before you walked in."

**Subtext.** Better than before. HaX's "...I was one of his students." / "Let's leave it there for
tonight." is the right size, and it lines up with m07's "teacher" thread, which the log approved
(P6). Irina's "I don't want to write it again." (`:444`) and Priya's "I'd like to know what I've
been drawing." (`:377`) say less than they feel. No change.

**Villain.** Satoshi wants something in each beat (to be understood, then to make the player doubt),
each beat has an exit, and the one hard line is there ("How many die keeping the current system
running?"). The redundancy at `philosophy_challenge` is small:

- **Optional.** On the `criminal_accusation` route he says "I don't accept it. You knew that walking
  in." (`:204`) and then "But I don't expect you to agree." (`:215`). Cut `:204`.

### The four structure items the writer logged

These are my calls. All are mission-local and small, so they can go in the edit round. Each needs a
tagdiff entry in the log.

**(a) Influence tags on `irina_trust` (should-fix, S12).** The count is higher than the review says:
16 changes, 15 untagged (only `notes_leverage` `:446` has a tag). `README_ink_best_practices.md:1076`
requires a tag after every change, and the tag only shows a popup (`chat-helpers.js:199-224`); it
changes no state. Two placement traps:

- A tag line attaches to the next line of text. Four changes are followed only by `-> hub`, which
  prints nothing, so the popup would ride on nothing: `:153`, `:158`, `:261`, `:271`. For `:158`,
  `:261` and `:271`, move the `~` line and its tag above the reply lines in the same block. `:153` has
  no reply at all: the player says "Financial surveillance worries me too" and gets silence. Add one:
  "Dr. Irina Volkova: *a small nod* Then we have that much in common." with the change and tag above it.
- The openers fire twice in one exchange: `:107` then `:125` (professional), `:116` then `:143`
  (academic). Each pair always runs together, so fold them: `:107` becomes `+= 15`, `:116` becomes
  `+= 25`, and delete `:125` and `:143`. Totals are unchanged (the `request_passwords` comment at
  `:225` already counts them that way), and the player gets one popup per opener.

Then tag the rest: `#influence_decreased` after `:111`; `#influence_increased` after `:107`, `:116`,
`:153`, `:158`, `:229`, `:261`, `:271`, `:293`, `:393`, `:408`, `:411`, `:434`. A browser check on
one opener and the evidence scene confirms the popups land on a spoken line.

**(b) The three flat choice pairs (should-fix, S13).** Give each option its own first reply line and
keep the shared knot for what follows.

- Priya `transaction_work` `:72-76`. The shared reply opens "*frowns* Yeah. Very." (`:182`), which
  only answers "That sounds suspicious." Move `:182` into the first choice body. Give "[Show me.]" its
  own: "Priya Raghavan: *swings the monitor round* Here." Delete `:182` from `suspicious_patterns`.
- Priya `monero_forensics` `:129-133`. Move "Pretty much." from `internal_logs_value` `:138` into the
  first choice. Give "[Then whoever has your logs has everything.]" its own reaction: "Priya Raghavan:
  *stops* Yeah. Don't put that in your report." The knot then opens "With our logs you can unmix
  anything we've ever processed."
- Debrief `identity_found` `:404-407`. "[One of ours?]" has already been answered by "Our chief
  strategist, once." Answer each choice in its own words and shrink the shared knot:
  - "[One of ours?]": "Agent HaX: Ours. He trained half the agents in the field." / "Agent HaX:
    Satoshi only rates it eighty-seven per cent. Treat it as a lead."
  - "[How much weight does his guess carry?]": "Agent HaX: Eighty-seven per cent, by Satoshi's sum.
    Treat it as a lead." / "Agent HaX: It fits, though. Tesseract trained half the agents in the field."
  - `tesseract_revelation` keeps only `:414` ("He left over an argument…") and its two choices. "Do you
    know him?" → "...I was one of his students." still follows.

**(c) Satoshi's final question records no stance (should-fix, S14).** The style guide (section 7)
says a stance choice in front of an immovable character is fine *if a variable records it*. Wire
it up and read it back once:

- erb `globalVariables`: `"satoshi_stance": ""`.
- `final_words` choices (`:501-508`): `#set_variable:satoshi_stance=rejected`, `=wondered`, `=refused`
  in the three bodies, above the divert (the next knot opens on a spoken line, as in `seize_assets`).
- Debrief: `VAR satoshi_stance = ""`, and in `satoshi_aftermath`'s non-KO branch replace `:283` with a
  three-way conditional:
  - wondered: "He told the arresting officer you'd admitted to wondering. I've left that out of the
    file."
  - refused: "He talked about financial freedom all the way through his rights. Said you wouldn't
    debate him. He took it as a compliment."
  - otherwise (rejected, or the field never reached): "He talked about financial freedom all the way
    through his rights."

  The KO route skips `final_words`, and the KO branch has its own line, so nothing else changes. Add
  `satoshi_stance` to the matrix states for loopcheck.

**(d) `#speaker:analyst` (no change).** `determineSpeaker` (`person-chat-minigame.js:658-694`) only
acts on two-part speaker tags that say `player` or `npc`. Anything else falls back to the main NPC,
and the `Name:` prefix sets the speaker in any case. So `#speaker:analyst` behaves exactly like
`#speaker:satoshi` and `#speaker:trader`, which don't match their ids (`satoshi_nakamoto`,
`trader_npc`) either. Harmless. If anyone tidies it, do all three at once in a later pass; it isn't
worth a tag change now.

## 5. AI tells and UK English

A hand search for the banned words, the transitions, "not just", "isn't about", "it's not", "that's
not", "-ing" tails and US spellings finds nothing the lint missed, apart from the items below.

- **Rhythm.** The same risk as m07, less of it. Trimming every long line has given HaX, Irina and
  Satoshi one cadence in places: two short declaratives and a fragment ("True believer. Nobody turns
  him." / "She built the mixer. She might turn." / "Short-term thinking. SAFETYNET's speciality."). It
  suits HaX. Satoshi should be the one voice allowed a long sentence (see the optional `:141` line).
- **Rhetorical openers.** "Honestly?" ×2 for Priya (S6), "My guess?" for HaX (optional), "Here's my
  question." for Satoshi (`:130`; it's his, it can stay).
- **Contrast pairs.** Satoshi has his one ("We're not terrorists. We're midwives.") plus "You'd call
  it laundering. I call it financial freedom…" (`:106`), which is the same shape. A villain habit, and
  the guide allows one per scene; this is a second. Optional: cut the first half, leaving "I call it
  financial freedom for people who need it most." HaX's "That's a CV, not a finding." (debrief
  `:344`) is a joke in a hero's mouth. Keep it; it gets the laugh.
- **Tailing negations.** Irina `:452` "what I give you tonight gets used. Not buried." Natural for her
  and short. Keep.
- **Tidy endings.** Mostly gone. Phone `:420` (optional, above) is the one left.
- **UK English.** Narration, choices and British speakers are clean ("organised", "per cent",
  "licence", "Cyber Security"). Satoshi keeps American idiom ("Sure", "Bold"); only "speciality"
  slips the other way.

## 6. Findings list

**Must-fix**

- **M1.** Irina `m06_npc_irina_volkova.ink:389`: put the hospital ransoms back as the antecedent for
  "Used to kill people" (`:405`). "Narrator: You point at the first wallet. RansomInc. The hospital
  ransoms, pooled."
- **M2.** Priya `m06_npc_analyst.ink:70`, `:184` and Dani `m06_npc_trader.ink:208`: stop describing the
  deposits as simultaneous, same-amount and regular, which contradicts the write-up the puzzle runs
  on. Replacement lines in section 2.

**Should-fix** (replacement lines given above)

S1 erb `:916` "dates itself" text · S2 phone `:205` "John the Ripper" · S3 phone `:400` the cost of
watching · S4 phone `:439` "at least six hours on" · S5 Irina `:285` badges line · S6 "Honestly?" to
Dani only (Priya `:243`, `:329`) · S7 Dani `:242` duplicate question · S8 debrief `:90` label choice ·
S9 debrief `:143` second reading of the projection · S10 debrief `operation_disrupted` repeats
`cell_disruption` · S11 debrief `mission_conclusion` restates · S12 influence tags, with the four
placement moves, one new Irina reply and the two opener folds · S13 the three flat pairs · S14
Satoshi stance variable and one debrief line.

**Optional**

HaX "My guess?" (`:220`) and `:420` sign-off; "Dr" in choices; Dani "mind" (`:250`); Satoshi's long
line at `:141`, "just" ×2, `:299` stock line, "specialty", `:106` contrast, `:204` repeat; debrief
`:206` "before midnight", `:263` maxim.

**Lines this would touch.** M1–M2 and S1–S11: about 22 spoken lines, 3 choices and 1 timed text.
S12 adds one spoken line and moves four `~` lines; S13 adds five spoken lines and moves two; S14
changes one spoken line into three variants. m06 audio isn't generated yet, so there's no cost.
S12–S14 are structural: tags, one new global, two `+=` values and new lines in choice bodies.
Log each one with its tagdiff output. None touches a knot name, a divert target or a choice
condition.

## 7. Verdict

**Revise** (light). The structure is unchanged apart from the one logged recap gate, every runtime
check is clean, and the puzzle still solves to slot 4471 alone. The pass makes m06 shorter and truer
to the voice bible, and it should stand. Fix M1 and M2 before it ships: M1 because Irina's turning
line no longer follows from anything on the evidence-first route, M2 because three lines still
describe a deposit pattern the write-up contradicts, in the mission whose puzzle is reading that
write-up carefully. Take S1–S11 in the same edit; they're one-line swaps. S12–S14 are small structure
changes and can go in the same round.

Afterwards, rerun tagdiff against the same snapshot (expect differences only in the Irina, analyst,
debrief and Satoshi files, each explained in the log), then dialoguelint, reopencheck, the
loopcheck matrix with `satoshi_stance` added, and the validator. A short browser look at one Irina
opener and the evidence scene confirms the influence popups land on a spoken line.

Scratch output: `<scratchpad>/m06-scripted/` (`tagdiff.txt`, `lint.txt`, `reopen.txt`, `matrix.txt`,
`recap.js`, `rendered.json`, `json/`).
- **S3.** `handler_recommendation` `:400` "If you watch it, the balances reach the cells on that page,
  and we get the map." The before-copy carried the cost of watching ("cells whose projection you've
  just read"); now the freeze line has a cost and the watch line has only a gain. HaX states the cost
  of each and lets it sit; that's her job here. Replace: "If you watch it, the balances pay for what's
  on that page, and we get the map."
- **S4 (pre-existing).** `fund_hint` rung 2 `:439` "look for it less the fee, six hours on." The hold is
  a minimum ("nothing leaves the pool sooner than this"), and the right credit lands 6 h 40 m after
  the deposit. "Six hours on" sends a careful player looking for 03:40 exactly. Replace: "Start with
  the biggest deposit. Look for it less the fee, at least six hours on."

Everything else the cuts removed was colour or is on paper. The six cell names (debrief, before
`:121`) are on the fund document the player holds. The timed texts kept every fact, apart from "never
returned" on the badge (fund-found text, `erb:1021`), which the door-controller export still carries.
