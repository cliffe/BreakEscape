# m03 Ghost in the Machine: dialogue review, pass 2 cycle 1

Reviewer: fresh Opus, read-only, 2026-10-12. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M03_PASS2_BRIEF.md`). Phase 4 items (P4-1..P4-64) are closed and are not re-raised unless they have regressed. m03 has no audio yet, so every rewrite below costs nothing in TTS.

Finding ids: `D2-n`. Tags: **blocker / major / minor**, and **local** (mission-local) or **approval** (engine, cross-mission, or a standing rule).

## Step 1: compile, validator, lint, runtime checks

**Compile.** All eight ink files compile with no errors or loose-end warnings. I compiled to the scratchpad, not over the game files. The compiled JSON matches the committed JSON byte for byte, after normalising, for all eight files.

**Validator** (`--skip-ink --no-graph`). Schema passes. Dialogue-facing items:

- The 4 `npc_ko:victoria_sterling` handlers on `agent_0x99` can fire together. This was justified in Phase 1 (an ERB comment says they are meant to fire together). No action.
- `executive_wing_hallway` npcs[0] eventMappings[0] is a person-chat mapping without `onceOnly`. It is the guard's `lockpick_used_in_view` catch, which is deliberately repeatable (`scenario.json.erb`, comment at the guard's first mapping). No action.
- Suggestion: `night_transition` has no `spriteVisemes`. Not a dialogue item; it belongs to the character stage.
- No unresolved speaker prefixes. Every `Name:` prefix (`Receptionist`, `Security Guard`, `Victoria Sterling`, `Danny Foster`, `Agent HaX`, `Director Magnus Netherton`, `Agent 0x47 'Nightshade'`, `Narrator`) matches a `displayName` exactly.

**dialoguelint.** 0 errors, 4 warnings:

| File:line | Rule | Verdict |
|---|---|---|
| `m03_npc_victoria.ink:469` | not-x-but-y ("That isn't cruelty. It's arithmetic.") | Keep. It is the villain's one per scene, and a blind tester picked it as a best line. |
| `m03_npc_victoria.ink:490` | choice-len, 18 words | Justified in Phase 4 (P4-37). It can stay, but D2-1 below offers a shorter option. |
| `m03_npc_victoria.ink` | stage-cue-density, 12 cues in 94 lines | Cut about 6 (D2-19). |
| `m03_npc_guard.ink` | stage-cue-density, 7 cues in 84 lines | Cut about 4 (D2-19). |

**Runtime.**

- `loopcheck` at each NPC's `currentKnot` (`start`), plus night, confrontation, KO and hostile states, plus the guard's `on_lockpick_detected`: clean.
- One extra state matrix fails. This is D2-4 (Victoria's `clone_rfid_distraction` starves).
- `reopencheck`: m03 has 0 problems. It reports "60 greeted again then the hub" for HaX's phone; m01 and m02 report 0 (D2-14).

## The read-through: does it play like a TV spy thriller?

Mostly, yes, and in places very well. Victoria's night confrontation (`m03_npc_victoria.ink:438-546`) is the best scene in the mission and holds up against anything in m01: "Once is curiosity. Twice is an inventory." (:447), "I sleep perfectly. That's the part people like you can never forgive." (:482), "I'm a desk. They'll have it filled by Monday." (:525). Danny's scene (`m03_danny_choice.ink`) is tight and human. The debrief has real handler texture in places: "Sit down before you fall down." (:56), "Finance will want a receipt." (:95), "Next time, bring it out yourself." (:258).

Where it falls short of the aim:

1. **The best weapon the player holds is never fired.** Netherton opens the mission with "Now they choose the targets first." (`m03_opening_briefing.ink:27`). The required flag-4 log itemises "Target Selection Consultation $10,000" and "Target: St. Catherine's ... (from the 214-site survey)" (`scenario.json.erb:66`), and Danny drew the map. Victoria's whole defence is "What a buyer builds with it is a buyer's problem." (`m03_npc_victoria.ink:466`), and no choice lets the player say "You picked the hospital." The mission's central reveal is set up and then dropped (D2-1).
2. **Victoria's afternoon spends her night argument.** She makes the "buyer's responsibility" case up to five or six times by day. When she makes it again at night, the line has nothing new to say (D2-2).
3. **The cover is never really tested by the person it's meant to fool.** HaX promises "Sterling will test you. Ethics questions dressed up as philosophy." (`m03_opening_briefing.ink:237`). In fact the player asks all the questions and Victoria answers. The suspicion system works (dropped read, the walk-back), but there is no moment where Victoria puts the recruit on the spot and remembers the answer (D2-3).
4. **The two moral choices never meet.** Danny's fate and Victoria's fate are each paid off in the debrief, but separately. "Sterling goes down for her part." (`m03_danny_choice.ink:76`) is a promise that the recruit and escape endings break, and nobody notices (D2-5).

Per character:

| Character | Verdict | Notes |
|---|---|---|
| Victoria Sterling | revise | Night: ship, with one new choice (D2-1). Afternoon: revise. Hold back the night argument (D2-2), add the recruit test (D2-3), replace about 8 stock lines (see "Weakest lines"). |
| Danny Foster | ship | One wording clash with the credits (D2-9). |
| Agent HaX, briefing | light revise | "Skip the background" route loses the stakes (D2-10); the promised test (D2-3). |
| Agent HaX, phone | light revise | Repeated greeting (D2-14); a few lines could carry more personality (weakest lines #18). |
| Agent HaX, debrief | revise | Danny × Victoria (D2-5); morals summed up against the voice bible (D2-7); "proof of concept" has two owners (D2-8). |
| Receptionist | light revise | Night scene ignores her question (D2-12); brochure lines (weakest lines). |
| Security Guard | light revise | Canon slip (D2-11); a line contradicts Victoria (weakest lines); repeated day lines (D2-13). |
| Narrator, night transition | ship | |
| Netherton, Nightshade | ship | Netherton's setup line needs its payoff (D2-1). Nightshade's m08 seed is intact (`m03_opening_briefing.ink:163`). |

## Majors

### D2-1 (major, local): the confrontation never says "you chose the target"

- **Setup:**
  - Netherton: "Zero Day Syndicate used to sell exploits to whoever paid. Now they choose the targets first." (`m03_opening_briefing.ink:27`).
  - m02 canon: "They picked St. Catherine's out of 214 hospitals." (`m02_closing_debrief.ink:938-940`).
  - The flag-4 log, which every player who reaches the confrontation has submitted: "Reconnaissance (214 hospitals) $15,000 / Target Selection Consultation $10,000 / Target: St. Catherine's ... (from the 214-site survey)" (`scenario.json.erb:66`).
  - The roster: "Target selected for client: St. Catherine's" (`scenario.json.erb:49`).
  - Danny drew the ward layout (`m03_danny_choice.ink:49`).
- **What's missing:** at night Victoria says "I sold a vulnerability. What a buyer builds with it is a buyer's problem." (`m03_npc_victoria.ink:466`) and "Better a professional who logs the sale than a criminal who doesn't." (:480). Her own invoice proves she chose the ward. No line in any ink file voices target selection (grep of `214|target selection` in `ink/`: only Netherton's line).
- **Fix:** give `the_reckoning` (`m03_npc_victoria.ink:481`, currently a single forced choice) a second option, so the player picks a stance:

  ```ink
  + [You didn't sell Ghost a tool. You sold them a hospital. Target selection, ten thousand. It's on your invoice.]
      Victoria Sterling: *a pause, the first one tonight* Danny's survey. Two hundred and fourteen sites, and one with the oldest FTP box on the list.
      Victoria Sterling: Ghost wanted somewhere that would pay. I told them where. That's consultancy.
      Narrator: For the first time she sounds like she's defending something, not explaining it.
      -> the_reckoning_close
  ```

  Then move the "line item / one move" lines (:484-485) into a shared `the_reckoning_close` that both options reach.
  - Optional: gate a sharper Danny line on `danny_fate != ""`: "Danny drew it for you. He sat in the dark for months because of it."
  - Needs `VAR danny_fate` in Victoria's ink (it is a synced global).
  - The debrief's arrested option (`m03_closing_debrief.ink:164`) can then say "She picked the ward off a survey of 214."
- **Why major:** this is the reveal the whole mission builds towards: Zero Day is a supplier that chooses targets, and that makes it worse than an arms dealer. As written, her "buyer's problem" stands unanswered on every route.

### D2-2 (major, local): Victoria makes her night argument five or six times by day

The "buyer's responsibility" defence, by line:

- `m03_npc_victoria.ink:202`: "That's not our concern. We're security professionals, not moralists."
- `:210`: "It's recognising the reality of how markets work."
- `:224-225`: "Exploit sales happen with or without us. So either the researcher gets paid, or the criminal does."
- `:238`: "That's on the buyer, not the researcher who discovered the vulnerability."
- `:256`: "Tools have utility. People choose how to use them."
- `:263-264`: "The line is intent ... you don't blame the crowbar manufacturer."
- At night, `:466` and `:480`.

A player who takes both afternoon topics (the natural thing to do while the cloner reads) hears it four to six times before night. Phase 4 cut the repeats from five arguments to two (P4-1). The remaining two are still this one argument, worded four ways.

**Fix: by day she deflects, and saves the argument for night.** By day she is charming, probing and evasive. Her afternoon subject is money and talent ("researchers deserve to be paid", "who knows first"), and she turns ethics questions back on the candidate. Concrete rewrites are in "Weakest lines" #1-#5. The night lines then land as the first time she says it straight, which fits a mask coming off. Keep `market-driven research` somewhere in the afternoon, because the debrief quotes it back (`m03_closing_debrief.ink:163`).

### D2-3 (major, local): the promised test never comes, and the cover isn't put under pressure by Victoria

HaX sets it up twice: "Sterling will test you. Ethics questions dressed up as philosophy. Stay the curious recruit; don't argue her down." (`m03_opening_briefing.ink:237`), and "Be natural with her -- she reads people for a living." (:194).

In the scene itself (`m03_npc_victoria.ink:106-275`), every question is the player's. Victoria never asks one that the recruit has to answer in character. The only cover pressure comes from the player's own blunt choices raising `victoria_suspicious`.

**Missing scene: Victoria's question.** A short, Victoria-initiated beat in the afternoon, offered once from the hub after the first topic (or just before the whiteboard). For example:

```ink
=== the_question ===
~ test_asked = true
Victoria Sterling: One question. I ask everyone, and most people get it wrong.
Victoria Sterling: You find a hole in an NHS trust's patient records. The vendor offers you a T-shirt and a thank-you. A buyer offers forty thousand. What do you do?
* [Take the forty. The vendor had years to find it.]
    ~ test_answer = "sold"
    ~ victoria_influence += 15   // with # influence_increased
    Victoria Sterling: Quickly said. I'll remember that.
* [Report it, then invoice the vendor for my time anyway.]
    ~ test_answer = "hedged"
    Victoria Sterling: Wanting both. Honest, at least. It won't make you rich.
* [I'd want to know what the buyer wanted it for.]
    ~ test_answer = "asked"
    ~ victoria_suspicious += 5
    Victoria Sterling: Nobody tells you. And if you need to know, you can't afford to.
- -> hub
```

Pay it back at night, in `nighttime_confrontation` (:442-451):

- "sold": "You said you'd take the forty. You said it very quickly. The ones who mean it take longer."
- "asked": "You asked what the buyer wanted it for. I should have ended the interview there."

HaX can also pay it back in the debrief recap, as one line.

Keep it off the critical path: it must not gate the whiteboard, and the clone must still be reachable after any answer. This gives the cover a real test, a choice that's remembered, and a night opener that comes from the player's own words.

### D2-4 (major, local): `clone_rfid_distraction` can starve after reloads mid-read

**The state.** `clone_rfid_distraction` (`m03_npc_victoria.ink:310-328`) has only three `*` choices, each also gated by `not asked_lab_*`. The hub re-enters it through "Keep her talking about the lab" (:172) whenever `rfid_clone_started and not rfid_clone_complete and not read_dropped`, and through `clone_retry` (:305). The file's own comment at :332-333 says a reload restarts at `start` with variables restored. So each reload mid-read, after a lab question, spends one question. After three, the knot has no choices.

**Proof.** `loopcheck m03_npc_victoria.json start recruitment_discussed=true rfid_clone_started=true asked_lab_services=true asked_lab_access=true asked_lab_praise=true` gives "RUNTIME ERROR: ran out of content" under all strategies (4 of 4 shown).

Rare (it needs about three reloads during the clone), but Victoria's conversation is on the critical path, and a broken chat gives no error the player can see.

**Fix:**

- Add a sticky fallback to the knot, for example `+ [Ask her what the students find hardest.]` → "Victoria Sterling: Patience. They want root in a minute. The good ones wait." → `-> clone_check_1`.
- Or hide the hub option (:172) once all three `asked_lab_*` are true.

(Skill §2c-bis; SOFTLOCK_PATTERNS S5.)

### D2-5 (major, local): Danny's fate and Victoria's fate never meet

- **The broken promise.** Danny's protect route makes a promise: "Sterling goes down for her part. You don't have to." (`m03_danny_choice.ink:76`). On the recruit ending she doesn't go down, and on the escape ending she walks. The debrief's Danny knot (`m03_closing_debrief.ink:275-282`) still says "Sterling used him", with no word about the promise.
- **The recruit plot hole.** On recruited + protected, HaX says Danny "came to us on his own last night. Cooperating fully." (:276). Two knots earlier she says Sterling "stays at Zero Day so nothing looks wrong" (:150). A senior consultant vanishing into SAFETYNET custody the same night is exactly what would look wrong, and nobody remarks on it.
- **The irony nobody names.** On recruited + exposed, the woman who lied to Danny gets a deal, and Danny gets charged. That is the sharpest moral irony in the mission, and nobody says it.

**Fix:** one or two lines in `danny_discussion`, gated on both fates:

- recruited + protected: "Danny thinks Sterling's going down. She isn't. His statement stays sealed, or she's burned inside a week. You'll want to be the one who tells him, or nobody will."
- recruited + exposed: "So the woman who lied to him gets a deal, and he gets a court date. I'll sign off on it. I won't pretend it's tidy."
- escaped + protected: "You told him she'd answer for it. She's in the wind. He asked me this morning if that was true."

These are the choices-remembered moments a TV thriller lives on, and they cost a few lines.

## Minors

| # | Tag | File:line | Finding | Fix |
|---|---|---|---|---|
| D2-6 | minor, local | `m03_npc_victoria.ink:342` vs `:469` | Her afternoon pricing line names the hospital premium outright ("Hospitals can't, so hospitals cost more."), which spends the night line "Forty per cent extra for a hospital. You priced the bodies in." The reason also differs: "can't defend itself" by day, "pay fast, pay quietly" at night (and in her own catalogue note, `scenario.json.erb:57`). | Keep the afternoon line oblique: "CVSS is the floor. After that it's what the buyer's target can't afford to lose. Some sectors can't afford to lose anything." The night line then reveals what she meant. |
| D2-7 | minor, local | `m03_closing_debrief.ink:277-282`, `:377`, `:234` | HaX sums up the moral, which the voice bible rules out ("never ... a moral summing up the scene", `voice_bible.md` HaX). Examples: "Sterling used him. He's no conspirator." and "But he'll carry it. That's its own sentence."; "You did the technical work and still saw the people in it. Keep doing both."; "Stopping a distributed strike is hard. Knowing it's coming is everything." Danny already owns his moral in his own scene (`m03_danny_choice.ink:50,62-64`). | Rewrites in "Weakest lines" #16, #17 and #20. |
| D2-8 | minor, local | `m03_npc_victoria.ink:538`, `m03_closing_debrief.ink:229` | "St. Catherine's was a proof of concept" has two owners. On the escape route the player hears Victoria say it, then HaX says it as her own analysis. | Branch the debrief line. Escape route: "She told you St. Catherine's was a proof of concept. She wasn't showing off." Other routes: "St. Catherine's was the test run. This is the order book." |
| D2-9 | minor, local | `scenario.json.erb:178` vs `m03_danny_choice.ink:66` | Credit "PROTECTED — came in on his own, name kept out of the report". The player promised "I'll put that in the report myself", and the debrief says "I read his file and your notes" (:277). | Credit: "PROTECTED — came in on his own, not charged". |
| D2-10 | minor, local | `m03_opening_briefing.ink:43-56` | "[Skip the background. What's the mission?]" sets `player_approach = "direct"`, which `mission_approach` always overwrites (dead write). The route also jumps to `objectives`, skipping St. Catherine's, the stakes and the "murder with an invoice" choice. `knows_m2_connection` stays false, so `final_instructions` (:222) says nothing. A player who wants it short loses the reason for the mission (skill §2d.6, lossy opening). | On the direct route, give one compressed line that sets the global: "Short version: the exploit that took down St. Catherine's came from this shop. We want their books." Plus `#set_global:knows_m2_connection:true`. Drop the dead "direct" write, or read it in the debrief. |
| D2-11 | minor, local | `m03_npc_guard.ink:218` | "SAFETYNET. The people off the news?" SAFETYNET is a covert organisation (`02_organisations/safetynet/overview.md:5`) and denies affiliation publicly (`rules_of_engagement.md:132`). | "SAFETYNET. Never heard of you. Is that meant to make me feel better?" |
| D2-12 | minor, local | `m03_npc_receptionist.ink:279-283` | At night she asks "Is Ms. Sterling expecting you this late?" and the only choice is "[Goodnight. Don't stay too late.]", which ignores it. This is the one place a civilian puts the cover under pressure, and the player can't answer. | Offer two or three answers: "[She said to come back once the building was quiet.]" / "[Left my notebook in the conference room.]" / "[Something like that. Night.]" Give each a one-line reply. Optionally set a global the guard reads ("Reception said you'd be about."). |
| D2-13 | minor, local | `m03_npc_guard.ink:61-77`, `:500` | By day, every "[Nod to the guard]" replays the same two-line greeting. "[When do you knock off?]" is sticky and replays the same answer ending on "Why?". | Vary the greeting on a return visit, and gate "knock off" on `not topic_shift` so it retires once asked. Side effect to check: asking it by day sets `topic_shift`, which also hides the night hub's "[Long night ahead of you?]" (:272) and the route information behind it (:302). Use a separate day flag. |
| D2-14 | minor, local | `m03_phone_agent0x99.ink:89`, `:136-139` | "On the line, {player_name()}." prints on every phone reopen after "[Nothing right now]" (reopencheck: 60 re-greets; m01 and m02: 0). The thread fills with greetings. | Do what m02 does: greet once (a `greeted` flag), and on later opens go straight to the hub. Or vary it with `{&...}`. Phone text, no TTS. |
| D2-15 | minor, local | `m03_npc_receptionist.ink:131` vs `:276` | Night hub: "I'm just off, honestly." Then "[You're still here? It's late.]" gets "Still looking for that charger. Night!" She is leaving and searching in consecutive lines. | Hub line: "Found it. Charger was in the biscuit tin, don't ask." Then "Night, then." on the choice. |
| D2-16 | minor, local | `m03_npc_victoria.ink:446-449` | "You were very easy to like this afternoon." also plays for a low-influence player whom she told "I'm not sure you're the right fit" (:190), if their suspicion stayed under 10. | Add `- victoria_influence < 10:` "You were rude this afternoon. I put it down to nerves. Nerves don't come back at eleven at night." |
| D2-17 | minor, local | `m03_npc_victoria.ink:552`, `:438-458` | Her night call ("No. Not tonight. I said I'd deal with it myself.") is never paid off. A thriller would have her reveal she saw the player in the doorway. | In `nighttime_confrontation`, gated on `sterling_on_call_seen` (add the VAR): "You were in the doorway earlier. I saw you in the window. I let you go, because I wanted to see what you'd bring back." It also explains "I'll deal with it myself" (the Architect's people offered to handle the player), which sets up "a better bet than a shallow grave" (:513). |
| D2-18 | minor, local | `m03_npc_victoria.ink:515,528,541`; `scenario.json.erb:1707-1709` | `victoria_recruited`, `victoria_arrested` and `victoria_escaped` are set but read nowhere: not in the erb, the ink, any other mission or the engine (grep). `victoria_fate` carries the outcome. | Remove the three tags and globals, or note them as save metadata. |
| D2-19 | minor, local | stage cues, Victoria and guard | Lint density warnings. `*slight pause*` appears twice (:124, :351). Most cues repeat what the words already carry. | Victoria: cut `*warmly*` :139, the second `*slight pause*` :351, `*evenly*` :238, `*coolly*` :298, `*unhurried*` :537, `*a beat*` :472. Keep :283 `*curtly*`, :300, :460, :525 and :552. Guard: cut `*pauses*` :90, `*sceptical*` :113, `*sharply*` :180, `*stunned*` :223. |
| D2-20 | minor, local | `m03_opening_briefing.ink:78`, `m03_phone_agent0x99.ink:439`, `m03_closing_debrief.ink:108` | "Buyer's paperwork → seller's own ledger" is said three times, in briefing, revelation call and debrief. It is good once. | Keep it in the revelation call (the moment it becomes true). Trim the debrief line to "Now it's in their own books." |
| D2-21 | minor, local | `m03_phone_agent0x99.ink:450`, `m03_closing_debrief.ink:164`, `:188-189` | "Pricing proves intent" has three owners: "That's intent, on an invoice.", "Premeditation in a spreadsheet.", and "The pricing alone proves intent." | Give the debrief options other stances (see D2-1: "She picked the ward off a survey of 214."). |
| D2-22 | minor, local | `m03_npc_guard.ink:256` | "And Ms. Sterling's been more stressed. Snapping at people." This contradicts the Victoria the player meets, composed and "I sleep perfectly." | Rewrite as foreshadowing: "And Ms. Sterling's had a packed bag under her desk since Tuesday. Didn't think anything of it till now." This pays off "Coat on, a slim bag over one shoulder" (`m03_npc_victoria.ink:441`) and "She had a bag packed" (`m03_closing_debrief.ink:197`). |
| D2-23 | minor, local (renames) | `scenario.json.erb:608-609`, `:1470-1471` | The receptionist and the night guard have no names. m01 and m02 name every speaking civilian (Sarah O'Brien, Bernie Nwosu, Val Okonkwo; `voice_bible.md`). A named guard who "never learnt" Sterling's name (:338) is funnier when the player knows his. | Optional. Name both, and follow the standing rule to rename ids, ink files and globals with them. No audio exists, so it costs nothing. |
| D2-24 | minor, local | `m03_npc_victoria.ink:100`, `:602` | "[Thank her for her time]" is a menu label in a spoken slot. The reply "We covered the main points. I'll be in touch about the training programme." repeats on every reopen. | "[Thanks again for your time.]", and vary the reply with `{&I'll be in touch.\|Reception will see you out.\|Was there something else, or are you lost?}`. |
| D2-25 | minor, local | `m03_npc_receptionist.ink:107` | "[Relatively new. Still learning.]" breaks the cover set in the briefing ("freelance pentester", `m03_opening_briefing.ink:188`) and stated by Victoria ("Freelance pen testing, some CTF competition work.", `m03_npc_victoria.ink:108`). Nothing notices. The choice set is also flat (influence only). | Reword as a cover-consistent hedge: "[Freelance, mostly small jobs. This'd be a step up.]". Or keep the slip and let Victoria notice it once: "Reception says you told her you're new. My file says otherwise." That needs a synced global. |
| D2-26 | minor, local | `m03_npc_receptionist.ink:90`, `:175` | "She has a whole wall of awards in her office" and "coffee maker, the works" name props that don't exist in Sterling's office (no award or coffee object in `scenario.json.erb`; skill §2a-bis). | Hand to room dressing: add an awards shelf and a coffee machine to `executive_office`. Or cut the details. |

## The 20 weakest lines, with rewrites

Every one is a voiced line, except #18, which is phone text. m03 has no audio, so none of them costs anything to change. Rewrites keep each speaker's accent and register (`voice_bible.md` m03 table).

| # | File:line | Now | Rewrite | Why |
|---|---|---|---|---|
| 1 | `m03_npc_victoria.ink:145` | "Selling" is such a crude term. Think of it as market-driven research incentives. | "Selling." You say it like a confession. Call it market-driven research and the same room applauds. | She owns the word instead of hiding behind jargon. Keeps "market-driven research" for the debrief callback (:163). |
| 2 | `m03_npc_victoria.ink:202` | That's not our concern. We're security professionals, not moralists. | *a small smile* Everyone asks that in their first week. Nobody asks it in their second. | Deflects rather than argues (D2-2), and sounds like a threat. |
| 3 | `m03_npc_victoria.ink:210` | It's recognising the reality of how markets work. | Wilful. Yes. It's the only kind of ignorance worth paying for. | Answers the jab directly, chillingly, in fewer words. |
| 4 | `m03_npc_victoria.ink:238` and `:256` | That's on the buyer, not the researcher who discovered the vulnerability. / Tools have utility. People choose how to use them. | Hospitals. You've done your reading. Most candidates wait for the second interview. / Ask me again once you've signed something. I answer that question for staff, not guests. | Holds the night argument back (D2-2). Turns the question on the candidate (D2-3). |
| 5 | `m03_npc_victoria.ink:264` | If someone uses a crowbar to break into a house, you don't blame the crowbar manufacturer. | I don't make holes. I find them, and I'm honest about the invoice. | Drops the stock analogy and keeps the invoice motif, which D2-1 then turns against her. |
| 6 | `m03_npc_victoria.ink:134` | Neither. There's a third option most won't discuss. | Neither. Both assume the vendor deserves it for free. | The tease isn't paid off (the next knot never names the option). The rewrite states her position. |
| 7 | `m03_npc_victoria.ink:313` | The training network uses real vulnerable services. Much more effective than theoretical exercises. | Everything on that board is real, and everything on it is broken. On purpose. | Brochure → character. |
| 8 | `m03_npc_victoria.ink:365` | You're asking good questions. Technical competence is common. Strategic thinking is rare. | You ask questions like someone taking notes. I like that in staff. I watch for it in guests. | A stock HR line becomes cover pressure while the cloner reads. |
| 9 | `m03_npc_victoria.ink:370` | Exactly. That's why most security researchers stay poor while we thrive. | Exactly. Which is why my researchers are paid like surgeons. | Concrete, and it seeds Danny's raise (`m03_danny_choice.ink:62`). |
| 10 | `m03_npc_victoria.ink:377` | We don't believe in traditional certifications. Results speak louder than paper. | Certificates are for people who want permission. My students don't ask. | Drops the cliché; tells us who she trains. |
| 11 | `m03_npc_victoria.ink:410` | I think that covers the basic philosophy. The training programme starts next month if you're interested. | That's enough philosophy for one afternoon. The programme starts next month. I'll know by Friday whether you're on it. | Closes the scene on her power, not on admin. |
| 12 | `m03_npc_receptionist.ink:83` | We also have a research division - Zero Day training programmes. Very cutting-edge stuff. | There's the training side too. Zero Day. Don't ask me what they do in there, I only order the pizzas. | Brochure → Cardiff front desk. Hints that she doesn't know. |
| 13 | `m03_npc_receptionist.ink:190` | He's been a bit stressed lately, though. I think he's working on a big project. | He's been off it lately, mind. Hasn't touched a doughnut in weeks. | Shows it rather than telling, and calls back her own doughnut line (:188). |
| 14 | `m03_npc_receptionist.ink:193` | Penetration testing, mostly. He goes on-site to client locations for security audits. | Site visits, mostly. Hospitals, loads of them this year. Came back from one and sat in his car for an hour. | Brochure → foreshadowing. Rewards asking about Danny. |
| 15 | `m03_npc_receptionist.ink:240` | Card readers on the conference room and the server room. Ms. Sterling is very particular about access control. | Ms. Sterling had them fitted herself. Says a door's only as good as whoever's holding the card. | Repeats :231 and "very particular" (:165). The rewrite is dramatic irony for a player holding a cloner. |
| 16 | `m03_closing_debrief.ink:277-282` | I read his file and your notes. He drew a map under a lie. ... Sterling used him. He's no conspirator. ... But he'll carry it. That's its own sentence. | He walked in at two this morning with a box file and the photo off his desk, and he hasn't stopped talking since. ... He won't be charged. He'll carry it anyway. | Cuts the moral summing up (D2-7). Pays off the framed photo (`m03_danny_choice.ink:23`). |
| 17 | `m03_closing_debrief.ink:377` | You did the technical work and still saw the people in it. Keep doing both. | I read your notes on Foster twice. That's not a complaint. | HaX shows care by what she does (voice bible). Same gate. |
| 18 | `m03_phone_agent0x99.ink:448` | It does. ENTROPY procurement, in writing. Ironclad. | It does. One ENTROPY cell invoicing another. I may have it framed. | "Ironclad" is stock. Dry HaX humour after good news (voice bible). Phone text. |
| 19 | `m03_npc_guard.ink:165` | This doesn't add up. You're not making sense. | New this week, no badge, and here at eleven at night. Pull the other one. | Generic → Estuary, and specific to the lie told. |
| 20 | `m03_closing_debrief.ink:234` | We're already moving. Stopping a distributed strike is hard. Knowing it's coming is everything. | We're already moving. For once we've got the head start. | Drops the platitude. |

Not on the list, and worth protecting: `m03_npc_victoria.ink:447, 469, 482, 485, 513, 525`; `m03_opening_briefing.ink:83, 163, 165`; `m03_danny_choice.ink:62-64, 101`; `m03_npc_guard.ink:261, 309, 338`; `m03_phone_agent0x99.ink:550`; `m03_closing_debrief.ink:91, 95, 139, 157, 258`.

## Scenes missing or flat

In priority order. All are mission-local and add a few lines each. None touches the critical path if built as described.

1. **"You chose the hospital"** (D2-1). The confrontation beat the mission is built for. It is a second stance in `the_reckoning`.
2. **Victoria's question** (D2-3). The recruit is tested in the afternoon, and the answer comes back at night. It turns the afternoon from an interview the player runs into one Victoria runs.
3. **The two fates meet** (D2-5). One or two debrief lines where Danny's and Victoria's fates collide.
4. **"I saw you in the doorway"** (D2-17). Victoria reveals she let the player go during her call. This is the thriller beat where the antagonist was a step ahead all along.
5. **Reception at eleven at night** (D2-12). A civilian asks the cover question and the player has to answer it.
6. **Flat:** the afternoon after the whiteboard (`clone_debrief` → `meeting_end`, `m03_npc_victoria.ink:404-436`). Three goodbyes ("I'll have my assistant send you the enrolment details", "Of course. Take your time.", "My pleasure.") converge with nothing remembered except influence. Let the pick set a stance she reads at night. For example, "[This is exactly the kind of work I've been looking for.]" could give "You told me this was exactly the work you wanted. I believed you. That's the part I mind."
7. **Optional: a Netherton line in the debrief.** He plants "That is a line I do not let anyone cross." (`m03_opening_briefing.ink:28`) and doesn't return. The voice bible has him cameo in m02–m06 briefings only, so this would be new for him. If added, keep it to one line, gated on Victoria's fate (recruited: "We are now in business with the woman who priced a hospital. I will want that justified in writing, Agent."). Flagged rather than recommended, because it adds a speaker and changes the debrief's cast.

## Skill checklist (§2a–§2i)

| Check | Result |
|---|---|
| 2a Attribution | OK. Every prefix resolves. Emotes are split sensibly (D2-19 for density). |
| 2a-bis Supported by scenario | Mostly OK. Props: D2-26. Victoria "walks back to the table" (`m03_npc_victoria.ink:360`) and "lets the bag slide off her shoulder" (:510) describe a stationary NPC moving, but each is a beat inside the chat, as m02 does. OK. The family photo exists (`danny_office`). Geography lines (conference room "first door on the left", server room "far end", exec wing "east", Danny "south side") agree with `connections`. |
| 2a-ter Voices | OK. Distinct accents (Cardiff, RP, Estuary, Nottingham). No voice name reused inside the mission. The narrator voice block exists. |
| 2b Player choices spoken | OK, apart from D2-24. Action labels ("[Drift back to the whiteboard]", "[Brace yourself]", "[Run]") are non-verbal and fine. Minor punctuation inconsistency (`[I'm ready]`, `[Understood]`, `[Must be boring work]`, `[I'll get everything]` lack the full stop that other choices have). |
| 2c Hub structure | OK. Every person-chat NPC has a sticky exit and a resting knot. Exits are 1–2 lines. `-> END` appears nowhere. `-> DONE` appears only in the briefing, the debrief and the phone exit. |
| 2c-bis Starved knots | **D2-4** (Victoria `clone_rfid_distraction`). Everything else passes `loopcheck` under every state tried. |
| 2d Choices that matter | Danny: consequential, wired to the debrief and credits. Victoria's fate: consequential. Guard: consequential (stealth, debrief, Victoria's opener). Briefing: info-choice, OK, except the lossy "skip" route (D2-10). Victoria's afternoon goodbyes and the receptionist's first impression: flat (Scenes #6, D2-25). The debrief's reaction choices are stance choices with a little `handler_trust`. Fine for a debrief, but nothing reads the stance. Cross-thread payoffs are missing (D2-5). |
| 2d.4 Critical-path safety / S1–S8 | S1: none (hub replays for the missed calls, P3-19). S3: none found (every "it's in your kit" line has its `#give_item` tag). S4: `#complete_task:meet_victoria` sits in `start` (`m03_npc_victoria.ink:74`), but the outcome is meeting her, so it is correct where it is. S5: **D2-4**. S6/S7: not re-derived here (Phase 3 covered them; no ink conditions changed since). S8: the guard hint "Never work a lock in his sightline" is the mechanic, not a hidden bug. |
| 2e Cross-file state | Every `#set_global` name is declared. Readers have their VARs. Write-only: D2-18; the "direct" write in D2-10. |
| 2f Influence tags | OK. Every `+=`/`-=` on an influence variable carries its tag. `handler_trust` changes in the debrief are tagged. |
| 2g Syntax | OK. No `**`, and no list dialogue except HaX's spoken "One / Two / Three" objectives (`m03_opening_briefing.ink:112-114`), which reads as speech. |
| 2h KO | OK. The debrief and credits handle KO for every NPC (Phase 3/5). |
| 2i Recurring bugs | "Where do I stand?" (`m03_phone_agent0x99.ink:334-409`) still branches correctly at every stage I walked: day pre-badge, badge, card saved, Victoria KO, night with 0–3 flags, all four, guard states. Repeated greeting: D2-14. Choices quoting the unsaid: none found. The "Sable" gate (B-11) holds. Same fact twice in a row: D2-15, D2-20. |

## Phase 4 regression check

No Phase 4 fix has regressed:

- P4-43: Nightshade's "One day it'll be our badge somebody clones." is present (`m03_opening_briefing.ink:163`).
- The voice rule holds: no printed variable in any voiced line. The only `{guard_detection_count ...}` use is an inline conditional choosing fixed words (`m03_closing_debrief.ink:86`).
- P4-44: "Exactly." no longer follows a question (`m03_npc_victoria.ink:216-219` is "Precisely." after a statement).

D2-2 is a deeper version of P4-1 rather than a regression: the count of arguments went down, but the one left is still repeated.

## Prioritised action list

**Must fix**

- D2-4: add a sticky fallback to `clone_rfid_distraction`, or retire the hub route. Prove it with the `loopcheck` state above, which should fail on the old ink and pass on the new.

**Should fix (raises the writing to the aim)**

- D2-1: the target-selection stance in `the_reckoning`.
- D2-2, with weakest lines #1–#6: Victoria deflects by day.
- D2-3: Victoria's question, with its night payback.
- D2-5: Danny × Victoria lines in the debrief.
- D2-7, D2-8, D2-20, D2-21: one owner per line or moral in the debrief.
- D2-10: compressed stakes on the "skip" route.
- D2-11: canon slip.
- D2-12: the receptionist's night question.
- D2-16: low-influence night opener.
- D2-22: guard foreshadows the bag.
- The rest of the 20 weakest lines.

**Worth considering**

- D2-17: "I saw you in the doorway".
- Scenes #6: goodbye stance remembered.
- D2-13, D2-14, D2-15, D2-24: reopen repeats.
- D2-18: dead globals.
- D2-19: cues.
- D2-23: name the receptionist and guard.
- D2-25, D2-26.
- Scenes #7: Netherton.

Lines grepped against m04–m08 before recommending a change: "proof of concept", "market-driven", "crowbar", "Ironclad", "buyer's problem", "doughnut", "packed bag". No later mission quotes any of the lines this review would cut or reword (the only m04 hit is a code comment citing Victoria's clone knots, `m04_npc_robert_vance.ink:248`). The structural notes D2-1, D2-3 and D2-17 each add a VAR to Victoria's ink (`danny_fate`, `test_answer`, `sterling_on_call_seen`). Check `missions.json` and the reopen check after adding them.

## For the user

Nothing here strictly needs approval: every finding is mission-local, and m03 has no audio. Two calls the orchestrator may want to pass up, because they change the cast:

- **D2-23.** Give the receptionist and the night guard names. Under the standing rule, that renames their ids and files. It also touches the character-pipeline stage, which names its assets by id.
- **Scenes #7.** Add a one-line Netherton reaction to the debrief (new for an m02–m06 debrief).

## Verdict and counts

**Verdict: revise.** The structure is sound and the night is already the best writing in the campaign so far. One rare starved knot needs fixing. The big gains are in the writing: fire the target-selection reveal at Victoria, make her afternoon a test the recruit can fail, and let the two moral choices meet in the debrief. Expect cycle 2 to confirm D2-4 and judge the new scenes; Victoria's afternoon is likely to need a second pass after its rewrite.

| Severity | Count | Ids |
|---|---|---|
| Blocker | 0 | |
| Major | 5 | D2-1, D2-2, D2-3, D2-4, D2-5 |
| Minor | 21 | D2-6 .. D2-26 |

All 26 are mission-local. Two minors (D2-23, Scenes #7) are flagged for an optional user check because they change the cast. Weakest-line rewrites: 20 (19 voiced, 1 phone text). Checks: static only (compile, validator, dialoguelint, loopcheck, reopencheck). No browser run.
