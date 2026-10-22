# m09 Digital Archaeology: NPC dialogue review, round 1 (phase 4)

Skill: `.claude/skills/npc-dialog-review/SKILL.md`, run in full. Scope: every ink in `ink/`, `texts/A_hax_texts.md`, `texts/B_recruiter_texts.md`, `texts/C_texts_and_credits.md`, and the in-world text in `scenario.json.erb` (scenario brief, objectives, readables with their text and observation variants, the closing card and credits, HaX's timed texts). The briefing wall was checked one arm at a time against the source missions, and so were the stage cues.

**Ref reviewed: `157a552a`** (m09 last changed by "scenario design round 2 fixes"). The builder committed twice during this review, 4adf5576 (design R1 fixes) and then 157a552a (design R2 fixes), so I re-exported, recompiled and re-linted at each. These lines changed under me. Each finding below is against the final version:
- `bring_in_confirm` (new at 4adf5576, reordered at 157a552a), the hub's status rows (Victoria row added, then moved), Noor's ledger button (now "[I've read her ledger. You're on it.]"), and Sorensen's cage re-entry glance and `start` ending. I have no finding on any of these beyond what design R2 already raised.
- The debrief's Sun River line was added at 4adf5576 and split three ways at 157a552a. Finding **m8** is on the 157a552a version.
- A3-36 (HaX's Victoria text) was added at 4adf5576. Finding **m3** is on it.

Settled rulings were not reopened, except MJ-2. MJ-2 has a concrete reason (the pronoun's antecedent) that the earlier rounds didn't raise.

**Counts: 0 blocker, 2 major, 9 minor, 7 nit.** 6 lint hits withdrawn (§1.3).

Voiced means a line that will be sent to TTS: the briefing, the debrief and the Alpha clip (person-chat cutscenes), every person-chat (Noor, Sorensen ×3, Old Coyote, Tran, Dillard, including `Agent HaX:` lines inside them), the Recruiter's `call`/`resume_name`, and HaX's `deck_resume`, `identity_scene`, `identity_resume` and `tesseract_call`. Unvoiced: HaX's hub, `dock`, `flag1_read`, `ledger_read`, `afterwards`, `hour_read`, the three other callers, every text, the card and credits, and the documents. Audio isn't generated yet, so every rewrite below is free.

---

## 1. Step 1: compile, validate, lint, runtime

### 1.1 Compile
All 16 inks compile with `bin/inklecate` at 157a552a, with no errors, no "apparent loose end" warnings and no `END` warnings.

### 1.2 Validator (dialogue-facing only)
`ruby scripts/validate_scenario.rb` with the sibling missions present: 0 errors. No speaker prefix fails to resolve, every `#give_item` matches its speaker's `itemsHeld`, there is no `//` in dialogue, no stray `*` and no `**bold**`. The top-level `narrator` voice block exists (Algenib, RP). The 13 onceOnly-overlap warnings and 4 cutscene-onceOnly warnings are design-review territory and were justified in an ERB comment at alignment R1 m12. Not repeated here.

### 1.3 Dialogue lint
`dialoguelint.mjs`: 0 errors, 5 `not-x-but-y` warnings and 1 `you-after-choice` check. Phone files lint as `[phone]` (the scenario is present), and no phone line is over 25 words. All six are withdrawn:

| Lint hit | Withdrawn because |
|---|---|
| briefing.ink:64 "We have Helena. Not the bunker. Not yet." | Fixed string (contract §4.1 beat 3). It's a list of what they have, not a reframe. |
| closing_debrief.ink:118 "[No. Not about any of it.]" | A player choice, and the turn is the player's stance. |
| phone_agent0x99.ink:525 "It isn't my call. It isn't yours either…" | Fixed (§2.1). Two parallel denials, not "not X but Y". |
| sorensen_hatch.ink:77 / sorensen_door.ink:45 "…it isn't Derek's handwriting on it. It's the only place…" | Fixed. The second sentence adds a new fact (why the file matters). It doesn't recast the first. |
| briefing.ink:336 `You: ...` | The non-verbal silence choice, which contract §4.1 item 11 allows. |

### 1.4 Runtime
`loopcheck.js` on every entry knot in contract §1, with mid-mission states (HaX `start`, `support_hub` ×3 states, `bring_in_confirm`, `guides_menu`, the four voiced knots, `hour_read`; Recruiter `call` ×2, `resume_name`; every person-chat `start`/`challenge`/`door`/`handover`; briefing; debrief with `deed_found` and `m08_netherton_ko`; the three callers): no runtime errors, no runaways, and no starved knots. The hubs loop as hubs should, and the one-shot scenes end cleanly. `voicelines.mjs` on every voiced file finds no printed variable. The only digits are fixed strings ("In 2017", agent numbers, "0x00").

### 1.5 tagdiff
`tagdiff --ref 3e2bad5d` shows the builder's two commits: the debrief's new `deed_found` VAR and three-way branch, and in HaX's ink the new `bring_in_confirm` knot with the `start_debrief` tag, `#exit_conversation` and `debrief_notice_before` copy moved into it, plus four new VARs. The re-ring and done-flag tags are unchanged. I changed nothing, so there is no tagdiff of my own.

---

## 2. Findings

### Major

**MJ-1. HaX's text tells a `recruit` player they turned Derek Lawson. In m01 he refused, and m09's own briefing says so.**
`scenario.json.erb:358` (A3-28d), `texts/A_hax_texts.md:72`, `CONTRACT.md:178`. Unvoiced (text).
- In m01, Derek answers the recruit offer with "I will never betray ENTROPY." (`m01_derek_confrontation.ink:377`). The m01 debrief has HaX say "Fanatics don't turn, Agent. They'd rather go to prison as martyrs." (`m01_closing_debrief.ink:732`). m09's own wall card says "You offered Derek Lawson a deal. He chose to be a martyr." (`m09_briefing.ink:121`).
- Current: "He believed this more than the man who wrote it. You turned him anyway."
- Proposed: "He believed this more than the man who wrote it. You still offered him a way out."
- The user's priority is a player's choice that lands, and this one lands wrong. Fix the ERB, texts/A and CONTRACT §2.3 together.

**MJ-2. "You're the one he writes about" reads as Derek Lawson, not the Architect.**
`m09_sorensen_hatch.ink:74`, `m09_sorensen_door.ink:43`. Voiced (Sorensen, two clips).
- On every route where the player finished m01, the recognition line before this ends with Lawson as the last "he": "…he kept his promise and said nothing. He was always good about promises." / "…and he asked to see every one." / "I still pay Mr. Lawson's lawyer…". The next thing HaX says is "Bin by the hatch is Derek Lawson's file". So a player hears "the one he writes about" as Derek, and then hears that Derek's file is in the bin. That points them at the wrong man at the turn of the scene. The person who writes about the player is Tesseract, in the Reading.
- Current (B3): "You're not from the lease-holder. You're the one he writes about."
- Proposed (B3): "You're not from the lease-holder. You're the one the Architect writes about."
- Current (B5): "You came in by the maintenance code, not my hatch. You're the one he writes about."
- Proposed (B5): "You came in by the maintenance code, not my hatch. You're the one the Architect writes about."
- If "the Architect" is wrong in Sorensen's mouth (she never names him elsewhere), use "You're the one A. writes about." That matches the order's "-- A." and the schedule's signature. Contract §3.3 marks the string fixed. The reason for reopening it is the antecedent, which R2 B-R2-05 didn't consider.

### Minor

**m1. Albion's card: "It held a courier account" has no clear "it".**
`m09_briefing.ink:37`. Voiced (Netherton).
- Current: "Your card from Albion. Task Force Null went in yesterday. It held a courier account, and this was on it."
- "It" reads as the card. What was found is the safehouse whose address was on the card.
- Proposed: "Your card from Albion had an address on it. Task Force Null went in yesterday. There was a courier account, and this was on it."

**m2. The briefing's guess is never paid off when the real number arrives.**
`m09_phone_agent0x99.ink:586`. Unvoiced (`hour_read`).
- In the briefing (L274) HaX says Analysis guessed "hundreds", then: "They're guessing. I'd like to find out they guessed high." The casualty sheet says 1,100 to 2,600, so they guessed low. The button "[Analysis had a guess. Is it on there?]" sets this up, and her reply drops it.
- Current: "His own number. It replaces theirs."
- Proposed: "His own number. Analysis guessed low."

**m3. Victoria's route: A3-36 and hub topic 14 say the same thing back to back, and neither answers the briefing's "We've never used her."**
`scenario.json.erb:181` (A3-36), `m09_phone_agent0x99.ink:784`, `m09_briefing.ink:148`. Unvoiced.
- The text "Victoria's people read this building's mail. Ask me about that gate." is followed by the player asking, and HaX's reply opens "Victoria's people read their mail." That's the same fact twice in a row (skill §2i). The wall card said "Victoria Sterling turned. We've never used her." Tonight is the first time they use her, and nobody says so.
- Proposed A3-36: "First time we've used Victoria. Her people read this building's mail. Ask me about that gate."
- Proposed topic 14 reply (L784): "There's a maintenance code for that gate. Sorensen never changed it." Keep L785.
- Update CONTRACT §2.1 row 14 and §2.3 A3-36.

**m4. The identity scene moves to Albion without saying the notice is about Albion.**
`m09_phone_agent0x99.ink:491` and `:505`. Voiced (HaX).
- For a player who hasn't read the folder (`memo_read` false), HaX says "There's more on his box. A memo and a draft. Read them." and goes straight to "We marked this hole "retain" nine years ago…" (`full`), "You kept Albion quiet…" (`quiet`), or "Send it, the vendor starts a fix…" (L521). None of those says the draft is a vendor notice, or that the hole is Albion's. Only the never-played arm (L514) makes that link.
- The notice is one of the mission's choices that m10 carries forward, so the player should know what they're being asked to send.
- Proposed L491: "Seven years, and nobody turned it off. There's more on his box. A memo, and a vendor notice he never sent. Read them."
- Proposed L505: "That's Albion's hole. We marked it "retain" nine years ago. The vendor never heard a word from us."
- Two clips, both still under 25 words.

**m5. The status row after flag 2 sends a player back to the hatch they've already been to.**
`m09_phone_agent0x99.ink:932-933`. Unvoiced.
- `flag2_submitted` comes before `hatch_talked and not cage_opened` (L943). A player who has talked at the hatch and cloned the card, and then submits flag 2, is told "The hatch, then the gate. Her card's on that reel." This is the stale-status pattern from pass 4.
- Proposed: add above L932: `- flag2_submitted and hatch_talked and not cage_opened:` "The gate, beside her hatch. If you didn't clone her card, go back to the counter."

**m6. `flag1_read`: the same fact twice in a row.**
`m09_phone_agent0x99.ink:202` and `:207`. Unvoiced.
- HaX says "The boxes on the clerk's trolleys are the ones on this list." The player asks "[She's shredding Series R?]" and she answers "Box by box, off the clerk's trolleys."
- Proposed L207: "Box by box. The first sixteen are already gone." This matches the run sheet's flag-1 variant, where R-114 to R-129 are marked DONE.

**m7. Netherton contracts on two weighted lines.**
`m09_closing_debrief.ink:109` and `:191`. Voiced (Netherton). The standing rule is full forms on weighted lines, and both of these are verdicts.
- Current: "You've read his memo. Was he right?" Proposed: "You have read his memo. Was he right?"
- Current: "You bought a name, and it was the right name. She'll sell the invoice." Proposed: "You bought a name, and it was the right name. She will sell the invoice."

**m8. New at 157a552a: in the Sun River line, "her" reads as Ana Lúcia Ferreira.**
`m09_closing_debrief.ink:265` and `:269`. Voiced (Netherton).
- The line just before is the card: "Agent 0x6B, Ana Lúcia Ferreira." / "He doesn't look down for the second." So "Her own file gave us the address" and "It was in her office all night" attach to the last woman named, who is a dead agent.
- Proposed L265: "Sun River. A civil defence bunker Tesseract's people leased from the state in 2016. Mrs Sorensen's own file gave us the address. That is where the order sends us." (29 words)
- Proposed L269: "Sun River. Analysis found the lease an hour ago. It was in Mrs Sorensen's office all night. That is where the order sends us."

**m9. Worth considering: the cover the player gives Noor or Old Coyote never reaches Sorensen.**
`m09_sorensen_hatch.ink:40`. Voiced (Sorensen, +1 or 2 lines).
- Sorensen always opens with "The lease-holder's auditor." That works for players who told Noor or Old Coyote they were the audit, and it's a nice unspoken payoff there. A player who told Noor "SAFETYNET. Someone in this building is recruiting people." gets the same guess. The cover choice then changes only Noor's re-entry bark (`noor_cover`, ink-local).
- Proposed: promote `noor_cover` to a synced global, and on `noor_cover == "safetynet"` open with "Narrator: She looks up before you can say who you are." / "Margaret Sorensen: Noor rang through. SAFETYNET, of course. There's a chair on your side." and skip `opening` straight to `recognition`. That costs one new Sorensen clip and a new global.
- Low priority. Skip it if the global budget is tight.

### Nits

| # | File:line | Voiced | Current | Proposed |
|---|---|---|---|---|
| n1 | phone_agent0x99.ink:246 | no | You bagged the dossier. 'Including the people.' This is the people. | You bagged the dossier. "Including the people." This is the people. (the file's other quotes are double) |
| n2 | phone_agent0x99.ink:302 | no | The rest when this is over. Her office is past the binders. | The rest when this is over. Her office is the west door off the restricted stacks. (no binders are dressed there; the geography matches the connections) |
| n3 | phone_agent0x99.ink:927 | no | Her card's in your hand. The tape room's north of the stacks. | …The tape room's north of the restricted stacks. (there are two stacks rooms, and the open stacks have nothing north) |
| n4 | phone_agent0x99.ink:406 | yes (HaX) | I told you on the handset he taught me. I put his name in a drawer. | I told you on the phone he taught me. I put his name in a drawer. |
| n5 | jesse_tran.ink:54, :69 | yes (Narrator) | "[No deal.]" returns to the hub, and the sticky lever replays "He reads the courier line, J.T., and takes his hands off the keyboard." | Guard the narrator beat with an ink-local `tran_read_letters` so a second ask goes straight to his price line. |
| n6 | phone_agent0x99.ink:410, :418 | yes (HaX) | He taught me. The notebook in my case file is from his course. Those margins are his. | He taught me. The margins in that notebook are his. (when `hand_matched` was set in this scene's opening, the player has just heard about the notebook) |
| n7 | phone_agent0x99.ink:440 | no (choice) | `{afterwards_heard or m07_architect_echo_heard}` | Add `or (m08_completed and not m08_nightshade_ko_before_fate)`. HaX said "Afterwards, not during." in m08's debrief (`m08_closing_debrief.ink:65`). |

---

## 3. Step 2 by section

- **2a Attribution and narration: OK.** Every prefix resolves (validator), and contract §8.3 matches the registry. Narrator lines are confined to person-chats and cutscenes, with none in a voiced phone knot. Emotes are split sensibly: scene events are Narrator beats, and delivery cues stay inline.
- **2a-bis Supported by the scenario: OK.**
  - Directions match the connections: west door → front desk, shutter north → open stacks, closet off the open stacks, tape room north of the restricted stacks, office west. n2 and n3 are only vague wording.
  - Old Coyote's "on my desk by the dock" has the Incident Log, and "NOBODY READS THIS" pays off his "You'd be the first."
  - Sorensen is static and her lines don't move her. Noor and Old Coyote hide on `noor_told`/`old_coyote_told`.
  - Every handover has a `#give_item` matched to `itemsHeld`.
- **2a-ter Voices: OK.**
  - Every speaker has a voice block, and every style names its accent. The cast spans RP, West London ×2, Black Country, Castilian-English, West Texas, Northern California, Midwestern, Pacific Northwest, rural Montana ×2 and Western American.
  - Gary and Netherton share Charon, as they have since m02. They never share a conversation, and Gary's call is unvoiced here.
  - Tesseract's recording reuses m07's Architect voice (Sadaltager), which is right.
- **2b Player choices: OK.** All are first-person. The two clone buttons that read as stage directions ("[Lean in over her list…]", "[Lean on the counter…]") were approved at playtest R1 B-M2. The only `You:` line is the allowed silence.
- **2c Hubs: OK.** Every person-chat hub has a re-entry line and a sticky exit with a reply. Phone resting knots hold only choices.
- **2c-bis Starved knots: none** (loopcheck, §1.4).
- **2d Choices that matter: OK overall. This is the mission's strength.**
  - Every big choice sets an exported global that something reads back: the bin, the deck, the Recruiter, the confession answer, the notice, Nightshade's file, the memo stance, Kowalczyk's reply, the raid-team answer, Noor told, Sorensen talked down, Tran talked off.
  - The briefing's question hub and the dock and `flag1_read` buttons expose different information per pick, which is fine.
  - The light choices are Noor's cover (m9) and Old Coyote's covers. The covers change the bark, and telling him the truth sends him to his truck.
  - Wrong landings: MJ-1 (recruit). Unpaid set-ups: m2 (Analysis's guess), m3 (Victoria "never used").
- **2e Cross-file state: OK** (validator: every `#set_global` is declared, and every reader declares a `VAR`).
- **2f Influence: N/A.** Contract §6.1 deliberately uses no influence tags, and consequence runs through story globals instead. No parallel rapport scalar exists.
- **2g Syntax: OK.**
- **2h KO: OK.** Debrief lines exist for Sorensen, Noor, Old Coyote and Tran knocked out. HaX texts on each bystander KO. Sorensen's talked fate survives a later KO.
- **2i Pass-4 bugs.**
  - Stale status: m5.
  - A late first phone contact: OK. `start` skips `dock` after flag 1.
  - Choices quoting the unheard: OK, as gated. n7 widens the gate.
  - The same fact twice: m3, m6.
  - Repeating hub greeting: OK, with `{&…}` cycles.
  - `#speaker:` tags: none used.
  - Credits per route: every person ends on an unconditional clause, and the five card lines hold.
  - Continuity spot-checks against the source inks hold: m06's "eighty-seven per cent", m07's two agents killed (unconditional, so the wall's two cards fit every route), m07/m08's "afterwards, not during", and m08's "Same classroom". MJ-1 is the one exception.

**Briefing wall.** Every arm was read against its mission's values (contract §5.2). Only MJ-1's text contradicts its source, and that's a text, not a wall arm. The long run before the first button (about 20 lines, with one player beat at the end) was settled at R3 I-5 and isn't reopened.

**Stage cues.** There are 6 in all (*beat* ×5, *to you* ×1), well under m01's density, and none sits on a line carrying a number or a name the player needs.

---

## 4. Spoken lines these fixes would change (for the TTS budget)

| Finding | Speaker | Clips |
|---|---|---|
| MJ-2 | Sorensen | 2 reworded (hatch, door) |
| m1 | Netherton (briefing) | 1 reworded |
| m4 | HaX (identity scene) | 2 reworded |
| m7 | Netherton (debrief) | 2 reworded |
| m8 | Netherton (debrief) | 2 reworded |
| m9 (optional) | Sorensen | +1 new |
| n4, n6 | HaX (identity scene) | 1 and 2 reworded |
| n5 | Narrator (Tran) | 0 (guard only) |

MJ-1, m2, m3, m5, m6, n1–n3 and n7 are unvoiced.

## 5. Prioritised action list

**Must fix:** none.

**Should fix**
1. MJ-1: A3-28d (ERB, texts/A, contract).
2. MJ-2: "the one he writes about" in B3 and B5.
3. m4: the Albion hinge in the identity scene.
4. m3: A3-36 and topic 14 (repetition, and the "never used her" payoff).
5. m8: "her" in the Sun River line.
6. m5, m6, m7, m1, m2.

**Worth considering:** m9, n1–n7.

## 6. Top five

1. **MJ-1.** "You turned him anyway" says the player turned Derek, but in m01 he refused, and the m09 wall says he chose to be a martyr.
2. **MJ-2.** "You're the one he writes about" follows a line about Lawson on every m01-played route, so it points at Derek instead of the Architect, right before Derek's bin.
3. **m4.** The identity scene goes to "this hole" and "Send it" without saying the draft is Albion's vendor notice, for a player who hasn't read the folder.
4. **m3.** On Victoria's route HaX says "read the mail" twice in a row and never says tonight is the first time they've used her.
5. **m8.** The new Sun River line's "her own file" / "her office" lands on Ferreira, the name read just before it.
