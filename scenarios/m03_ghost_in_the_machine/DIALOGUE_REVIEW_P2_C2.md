# m03 Ghost in the Machine: dialogue review, pass 2 cycle 2

Reviewer: fresh Opus, read-only, 2026-10-12. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M03_PASS2_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P2_C1.md`, the "Dialogue cycle 1 fixes" entry in `IMPROVEMENT_LOOP_LOG.md`, commit adee101b. m03 has no audio, so no rewrite below costs anything in TTS.

Finding ids: `D3-n` (cycle 2). Weakest lines: `W-n`. Tags: **blocker / major / minor**, and **local** (mission-local) or **approval** (engine, cross-mission, or a standing rule). Line numbers are in the current files.

## Step 1: compile, validator, lint, runtime checks

**Compile.** All eight ink files compile with no errors and no loose-end warnings. I compiled into the session scratchpad, not over the game files. All eight match the committed JSON exactly (parsed and compared).

**Validator** (`--skip-ink --no-graph`). Schema passes. The dialogue-facing items are the known, justified ones from cycle 1: the 4 `npc_ko:victoria_sterling` handlers on `agent_0x99`; Terry's repeatable `lockpick_used_in_view` mapping without `onceOnly` (deliberate); the `night_transition` visemes suggestion (character stage). No unresolved speaker prefixes and no dead `VAR` or undeclared `#set_global` warnings.

**dialoguelint.** 0 errors, 2 warnings, both justified in cycle 1:

| File:line | Rule | Verdict |
|---|---|---|
| `m03_npc_victoria.ink:561` | not-x-but-y ("That isn't cruelty. It's arithmetic.") | Keep. The villain's one per scene. |
| `m03_npc_victoria.ink:606` | choice-len 18 | Keep (P4-37). |

There are no `choice-fallthrough`, `blank-reentry`, `exit-no-reply`, `tag-on-narrator` or stage-cue-density findings. Victoria is down to 6 cues and Terry to 2.

**reopencheck.** 0 problems. m03 phone: 454 reopens, "0 greeted again then the hub" (60 before cycle 1).

**loopcheck.** Clean at `start` across 27 runs:
- the C1 starved-knot state (D2-4: `rfid_clone_started` plus all three `asked_lab_*`), which now passes;
- Victoria with the test pending and answered, mid-read after a drop, card cloned, the night call, the night with each test answer and goodbye, the stacked night (`sterling_on_call_seen` + `receptionist_ko` + `guard_told_safetynet`), and each fate;
- Terry by day (first visit and return), and at night with `notebook`, `brushoff`, a bribe;
- Ffion at night (first and return visits) and by day with every topic spent;
- the briefing, Danny, the phone at night after the revelation, and the debrief (escaped + exposed, ko + ko).

I also walked these routes with a small inkjs driver to read the actual text: Victoria's afternoon (test "asked", ethics, dropped read, walk-back, retry), her stacked night opener, Terry's notebook route, and the debrief on recruited + protected.

**Softlock patterns S1–S8 on the new material.**
- `the_question`: all choices are sticky and every one sets `victoria_test_answer`, so the hub never routes back to it, and it is never offered once the read starts. S5-safe.
- `target_followup`: one unconditional `+`.
- `night_answer`: all sticky, reached once via `night_greeted`.
- S3: Ffion's "I'll tell the guard you're about" is backed by `ffion_night_story` and Terry reads it.
- S4: `#complete_task:meet_victoria` is still in `start` (`m03_npc_victoria.ink:87`), correctly, as in C1. No night route reaches it.
- No new gate sits on the critical path.

## Part 1: cycle 1 verification

I checked every claim in the log against the line it cites. 22 of the 26 findings are fixed as claimed. Three are fixed but carry a fault into the new text (D2-3, D2-12, D2-17), and one is fixed with an overstated log entry (D2-25). None is worse than before cycle 1 except D2-17, where the new lines break a line that already existed.

| C1 id | Claimed | Verified at | Verdict |
|---|---|---|---|
| D2-1 target selection | second stance, `target_followup`, global read by debrief | `m03_npc_victoria.ink:580-595`; `m03_closing_debrief.ink:169-171` | **Fixed.** Gated on `transaction_log_read or revelation_heard` (:580); the revelation call names the line item (`m03_phone_agent0x99.ink:444`). Writing notes in D3-5, D3-6, D3-7. |
| D2-2 day deflects | no buyer argument by day | `:148`, `:160`, `:225`, `:231`, `:248-249`, `:260`, `:280`, `:288-289` | **Fixed.** No day line makes the buyer's-responsibility case. One echo is left: D3-8. |
| D2-3 Victoria's test | `the_question`, night read-back | `:177-179`, `:304-331`, `:528-533` | **Fixed, payoff often lost.** The scene works and reads well. At night, though, the generic suspicion line pre-empts the answer for many players, and it then makes a false claim (D3-3). A player who goes straight to the whiteboard never gets the test (D3-21). |
| D2-4 starved knot | sticky fallback | `:388-390` | **Fixed.** The C1 state now passes loopcheck. |
| D2-5 fates meet | Danny × Victoria lines | `m03_closing_debrief.ink:300-310`, `:321-326` | **Fixed**, and the lines are strong. They land in an 18-line monologue with no reply (D3-4). |
| D2-6 pricing oblique | | `:405` | Fixed. The debrief's KO choice still uses the old rationale (D3-18). |
| D2-7 no moral summing | | debrief `:298`, `:333`, `:412`, `:250` | Fixed at the cited lines. The exposed branch still sums up (D3-17). |
| D2-8 proof of concept | branched | debrief `:241-245` | Fixed. |
| D2-9 credit | "came in on his own, not charged" | `scenario.json.erb:178` | Fixed. It now clashes with "collected him" (D3-14). |
| D2-10 skip route | stakes line, global, dead write gone | briefing `:46`, `:55-61` | Fixed. |
| D2-11 canon slip | | `m03_npc_terry_mott.ink:237` | Fixed. The capitulation after it is too quick (D3-13). |
| D2-12 Ffion's night question | three answers, global read by Terry | `m03_npc_ffion_rees.ink:285-312`; Terry `:48-52`, `:96-100` | **Fixed, but only one answer matters.** Terry's opener reads "notebook", then his excuse menu ignores it. "sterling" and "brushoff" are never read (D3-2). |
| D2-13 Terry day repeats | `day_greeted`, `asked_knock_off` | Terry `:74-92` | Fixed. A night callback is still missing (D3-12). |
| D2-14 phone re-greet | `greeted` | phone `:92-95`; reopencheck 0 | Fixed. |
| D2-15 leaving/searching | | Ffion `:136`, `:141-142` | Fixed. "Night, then" now repeats (D3-10). |
| D2-16 low-influence opener | | `:525-527` | Fixed. |
| D2-17 doorway reveal | | `:513-516`, `:666` | **Fixed, with a regression.** The two new lines sit between "Recruits don't do that." (:510) and "Nor do they leave my receptionist on her own floor" (:520), so "they" loses its referent. Seen in a walk with `sterling_on_call_seen` + `receptionist_ko`. The opener now runs to six Victoria lines (D3-1). |
| D2-18 dead fate globals | removed | grep of erb, ink, missions.json: no hits | Fixed. |
| D2-19 cues | 12 → 7, Terry cut 5 | Victoria 6 cues, Terry 2 | Fixed. Ffion has 3 in 54 lines (D3-22). |
| D2-20 paperwork said once | | briefing `:83`; debrief `:111-113` | Fixed. |
| D2-21 one owner per stance | | debrief `:173-174`, `:199` | Fixed. The targeting choice can now echo HaX's line just before it (D3-15). |
| D2-22 packed bag | | Terry `:275` | Fixed. It pays off `m03_npc_victoria.ink:509` and debrief `:207`. |
| D2-23 names | renames | erb, inks, missions.json | Fixed. "It's Terry, since you didn't ask." (`:357`) is a good line. |
| D2-24 menu label, idle repeat | | `:114`, `:715` | Fixed. |
| D2-25 Ffion cover | cover-consistent; "a tip that helps at the whiteboard" | Ffion `:111-116` | **Fixed in the ink; the log overstates it.** "Let her do the talking. She likes an audience." is flavour; nothing reads it, so it doesn't "help at the whiteboard". The choice set is still mildly consequential, because the influence it gives opens `ask_building_layout` at 15. Correct the log wording; no ink change needed. |
| D2-26 props | cut | Ffion `:92`, `:180` | Fixed. |
| Weakest lines #1–#20 | all changed | spot-checked all 20 | Fixed as logged. #19 (`m03_npc_terry_mott.ink:184`) reads well from both lies that reach it. |
| Scenes #1–#7 | built | as above | Built. #6 (goodbye stance) is at `:475-490` and `:534-539`. #7 (Netherton through HaX) is at debrief `:161`, `:188`, `:209`; :161 over-explains (D3-16). |

**C1 items not properly fixed:** D2-17 (a regression: the "Nor do they" referent, and the stacked opener), D2-12 (two of three answers are flat, and Terry ignores the story he was told), D2-3 (the night payoff is pre-empted for many players and the line that plays instead makes a false claim). D2-25 needs a log correction only.

## Part 2: the new material

The new scenes are good. The test (`the_question`) gives the afternoon its first real pressure, and "Report it and bill them anyway, you said. I took that for greed. It was a conscience keeping its options open." (`:533`) is one of the best lines in the mission. "Danny was paid a great deal of money to stop asking. He's the one who agreed the price." (`:591`) is cruel in exactly the right way. HaX's fate-linked Danny lines are the strongest new writing: "He asked which floor they're holding Sterling on. I didn't tell him." (debrief `:306`) and "Somebody has to tell him she's walking. It should be you." (`:303`). The faults are in how the new pieces connect, which is where a fix pass usually slips.

### Majors

#### D3-1 (major, local): the night opener stacks six lines, and the doorway reveal orphans "Nor do they"

- **What plays** (walked with `sterling_on_call_seen`, `receptionist_ko`, `guard_told_safetynet`):
  - `:509` Narrator: "Victoria is standing by the window..."
  - `:510` "You came back after hours. Recruits don't do that."
  - `:514` "You looked in on me earlier, while I was on the phone. That window shows the whole doorway."
  - `:515` "My associates offered to deal with you. I told them I'd do it myself. I wanted to see what you'd bring back."
  - `:520` "Nor do they leave my receptionist on her own floor..." ("they" now points at her associates, not recruits)
  - `:546-547` the guard's call, then "Say what you came to say."
- **Why it matters:** six Victoria lines before the player's first word, in the scene that most needs back-and-forth. The doorway reveal is also spent at the top of the scene, where it is a callback rather than a threat.
- **Fix:** move the reveal to `the_reckoning_close` (`:597-602`), just before "So decide what you actually want from the next thirty seconds." There it becomes her last card, and the threat in it is live:

  ```ink
  === the_reckoning_close ===
  Narrator: She settles the bag on her shoulder.
  Victoria Sterling: To the Architect I'm a line item. Sable, Zero Day, this office -- all of it is rented. All of it replaceable.
  { sterling_on_call_seen:
      Victoria Sterling: You stood in my doorway earlier. At night that window's a mirror.
      Victoria Sterling: My associates offered to deal with you. I said I'd do it myself. I still might.
  }
  Victoria Sterling: So decide what you actually want from the next thirty seconds. I have a car downstairs, and you have exactly one move.
  ```

  The opener then holds at most one read-back and the guard line, which restores "Nor do they" (:520). If the reveal stays where it is, reword :520 as "Recruits don't leave my receptionist on her own floor either." "At night that window's a mirror" is also clearer than "That window shows the whole doorway" (:514): the night-call narration has her back to the door (:665), and the line should say how she saw the player.

#### D3-2 (major, local): Ffion's night answer matters for one choice in three, and Terry forgets it after one line

- `ffion_night_story` takes "sterling", "notebook" or "brushoff" (`m03_npc_ffion_rees.ink:293`, `:300`, `:307`). Only "notebook" is read anywhere (grep: Terry `:48`, `:96`). The other two are flat.
- On the notebook route Terry opens "Ffion said there'd be someone about. Notebook, was it? Conference room's the other end of the building." (`:49`), then asks "So what are you doing in my corridor?" (`:97`). The excuse menu (`:101-117`) is the generic one: "I work here -- research, second floor", "Sterling asked me to grab some files", "Building maintenance". A player who told Ffion "notebook" can now tell Terry something else entirely, and he doesn't notice.
- **Fix, all inside Terry's ink with the existing global:**
  - **notebook:** add a first choice, `+ {ffion_night_story == "notebook"} [Wrong turn. I'll find it.]`, with Terry: "Other end, mate. And it's a long way round to a notebook, through the executive wing." Then go to `hub` with `guard_suspicious` left as it is. On the other three excuses, open with one line when the story is notebook: "Funny. Ffion said notebook." (`~ guard_suspicious = true`).
  - **sterling:** opener "Ffion reckons Ms. Sterling's expecting you. She never said nothing to me." That is a lie Terry can check, and `excuse_victoria` (`:141`) becomes the natural follow-up.
  - **brushoff:** opener "Ffion rang. Said someone come in at eleven and wouldn't say what for. That you?" The player was short with a civilian, and it reached the guard.
- This turns the one civilian who tests the cover at night into a chain the player is caught in. That is what D2-12 was for.

#### D3-3 (major, local): the test's payoff is pre-empted by a suspicion line that can be false

- **The order** (`:519-543`): receptionist KO → `victoria_suspicious >= 10 or read_dropped or suspicion_warned` → low influence → test answer → goodbye.
- **The false claim:** the suspicion line is "You asked about the training network twice this afternoon. Once is curiosity. Twice is an inventory." (`:524`). That is true only after `read_dropped`, when the player drifted back to the board. `suspicion_warned` is also set by questions, not reads:
  - "This sounds like you're advocating selling vulnerabilities" (`:161`);
  - "wilful ignorance" (`:232`);
  - the hospital question (`:261`);
  - the test's own "asked" answer (`:326`);
  - and suspicion 10 is easy to reach: "unconventional" (+5, `:137`) plus the hospital question (+5).
- **A route that proves it:** "unconventional" (+5), then the hospital question (+5, warned), then the walk-back (`eager_recruit`, `:347-359`), then a clean read (`eager_act_done` skips the drop, `:396`). At night she says "twice" about a network the player asked about once, and the test answer ("You asked what the buyer wanted it for. I should have ended the interview there.") never plays, although it is the precise line for this player.
- **Fix:** order the read-back by what she actually saw. Keep one line.

  ```ink
  - read_dropped:
      ...Once is curiosity. Twice is an inventory.          // protected line, now always true
  - victoria_test_answer == "asked":
      You asked what the buyer wanted it for. I should have ended the interview there.
  - victoria_test_answer == "sold":  ...
  - victoria_test_answer == "hedged": ...
  - victoria_suspicious >= 10 or suspicion_warned:
      Victoria Sterling: You asked what my buyers do with it. Then you asked again in different words. Recruits ask once.
  - victoria_influence < 10: ...
  ```

  The test (D2-3, the scene this cycle built) then pays off for nearly everyone who took it, and "Twice is an inventory" stays true wherever it plays.

#### D3-4 (major, local): the debrief's second half is an 18-line monologue, with the fate payoffs buried in it

- **The count:** walked on recruited + protected, from the Architect choice (`m03_closing_debrief.ink:260`) to the aftermath choices (`:442`), HaX speaks 18 lines with no player input:
  - `architect_investigation`, 3 lines;
  - `danny_discussion`, 7 lines;
  - `what_made_it_possible`, 2 lines;
  - `final_assessment`, 5 lines;
  - `aftermath`, 3 lines.
- **The cost:** "Somebody has to tell him she's walking. It should be you." (`:303`) asks the player to do something, and the player can't answer. The best emotional beat of the debrief becomes a paragraph.
- **Fix:**
  - Add one choice at the end of `danny_discussion`, before `-> what_made_it_possible`, for the branches where a fate line plays. Recruited + protected, for example:
    - `[I'll tell him.]`: "Do it before Counter-intelligence does. They'll make it sound like a favour."
    - `[Not yet. Let him have a week.]`: "A week, then. After that he hears it on the news."
    - `[He was told she'd answer for it. She will. Just not to him.]`: "That's the version I'd use. He won't thank you for it."
  - Each choice gets a one-line reply and sets nothing new. Give the other branches one or two short stance choices of the same kind (escaped + protected: "[I'll find her.]" / "[He should stop asking.]").
  - Cut `architect_investigation`'s third line, or fold it into its second, so the run before Danny is shorter.
- m02's debrief gives the player a voice at each fate; this is the place m03 most needs it.

### Minors

| # | Tag | File:line | Finding | Fix |
|---|---|---|---|---|
| D3-5 | minor, local | `m03_npc_victoria.ink:576-586` | The target-selection option is the obvious pick, so most players now never hear "I sleep perfectly. That's the part people like you can never forgive." (`:577`), a protected best line (C1 "worth protecting"). | Offer the jab again after her answer. In `target_followup`, replace or add: `+ [Consultancy. Is that the story you tell yourself so you can sleep?]` → `:577` → `-> the_reckoning_close`. The court option can stay as a third. |
| D3-6 | minor, local | `:583` | "Danny's survey." plays for a player who never met Danny and may never have heard his name: the briefing mention is optional (`m03_opening_briefing.ink:243`), as are Ffion's topic and HaX's hint. The flag-4 log doesn't name him (`scenario.json.erb:66`). | "Danny Foster's survey. One of mine." |
| D3-7 | minor, local | `:585` | Narrator: "It's the first answer tonight she's had to think about." It tells, and it contradicts what we just saw: she answered at once, with figures. | Cut it, and put the pause in her mouth: `Victoria Sterling: *after a moment* Danny Foster's survey...` (`:583`), with no other cue in that batch. |
| D3-8 | minor, local | `:325` vs `:225` | The "asked" reply ("Nobody tells you. And if you need to know, you can't afford to.") echoes "Everyone asks that in their first week. Nobody asks it in their second." a few lines earlier, in shape ("Nobody...") and in idea (don't ask about buyers). On the walk they are four lines apart. | "Then you'd never sell anything. The buyer who explains himself is the one you should worry about." |
| D3-9 | minor, local | `m03_npc_ffion_rees.ink:85` vs `:95-96` | She says "Don't ask me what they do in there, I only order the pizzas." (shown at influence ≥ 10, which "what's WhiteHat like?" always gives). The next choice asks what training Zero Day offers, and she answers like a brochure: "Advanced penetration testing techniques. For serious researchers." The voice bible has her as someone who "doesn't know what the back rooms do". | "Told you, I just do the pizzas. Advanced something. She picks them herself, mind. Turned away a lad who'd been on the telly last spring." Drop the `*slightly evasive*` cue. |
| D3-10 | minor, local | Ffion `:142`, `:295`, `:309` | "Night, then." closes three of the four night replies. A second visit gets "Found it. Charger was in the biscuit tin" → "[Night, Ffion.]" → "Night, then." again. | :142 "Go on, I'm locking the drawer.", :295 keep, :309 "Right. Well. Suit yourself." |
| D3-11 | minor, local | Terry `:77` vs Ffion `:65` | Terry: "If Ms. Sterling wants you back here, she'll walk you through herself." Ffion: "She doesn't come out to fetch people." | Terry: "If Ms. Sterling wanted you back here, she'd have told me. She hasn't." |
| D3-12 | minor, local | Terry `:88` vs `:315` | Asked "When do you knock off?" by day ("Not till six tomorrow morning. Double shift."), he gives the same news at night as if new. | `:315`: `{asked_knock_off:Told you this afternoon. Six.\|Double shift tonight. On till six.}` |
| D3-13 | minor, local | Terry `:237` → `:242`, `:248`, `:254` | "SAFETYNET. Never heard of you. Is that meant to make me feel better?" is good. All three answers then fold him in one line ("Right. Yeah. Whatever you need."), which throws away the scepticism just set up. | Keep the flip, but make it his: `:242` "...That's a lot of laminate for people nobody's heard of. Go on, then." / `:248` "Not even her. Right. I'm going to regret this." (which also sets up his call to Sterling, `:236`, as a choice he made). |
| D3-14 | minor, local | debrief `:294`, `:296`; `scenario.json.erb:178` | "Our people collected him at two this morning." is followed two lines later by "You gave him room to come in by himself. That's why he did." The credit says "came in on his own". | `:294`: "He rang us just after midnight. Our people collected him at two. He brought a box file..." Then "came in by himself" and the credit are both true. |
| D3-15 | minor, local | debrief `:170` → `:173` | With `named_target_selection`, HaX says "Not with 'target selection, ten thousand' on her own invoice. And you got her to call it consultancy on an open line." The first choice is then "[She picked the ward off a survey of two hundred and fourteen.]": the same fact twice in a row. "Ward" is also the wrong unit, since the survey was of hospitals. | Gate the choice text: `{named_target_selection:[She'll call it consultancy in court too.]\|[She picked St. Catherine's off a survey of two hundred and fourteen.]}`. The reply "Targeting. That's the word the CPS will use." fits both. |
| D3-16 | minor, local | debrief `:161` | "He had me write 'she priced a hospital' on the cover sheet, so nobody forgets who we're in business with." The tail explains the gesture. | End at "on the cover sheet." |
| D3-17 | minor, local | debrief `:315` | "Deceived at the start, complicit by the end, and the second part is a choice a court can name." This is the moral summing-up the voice bible rules out for HaX (the C1 D2-7 class, on the exposed branch). | "He took the raise after he knew. A court will care about the date." |
| D3-18 | minor, local | debrief `:198` | The KO stance "She charged more to hit people who couldn't defend themselves." keeps the old pricing reason that D2-6 removed. Victoria says "pay fast, pay quietly" (`m03_npc_victoria.ink:561`), as does the catalogue (`scenario.json.erb:57`). | "[She charged a hospital premium because they pay fast and quietly. She'd earned the file.]" (or a shorter version under 15 words). |
| D3-19 | minor, local | `m03_npc_victoria.ink:473-501` | The afternoon ends on three goodbyes in a row: "I'll know by Friday" (:473), a goodbye reply (:479/483/489), then `meeting_end` with "Have a look round" (:495), "I have another meeting in a few minutes. But we'll be in touch." (:499), the phone buzz and "Excuse me, I need to take this." "In touch" appears up to twice, and :499 repeats what the phone buzz shows. | Cut :499. The scene closes on the buzz, which is also the setup for her night call. |
| D3-20 | minor, local | Victoria `:107`, Ffion `:46`, Terry `:66` | Fixed re-entry lines repeat on every reopen: "Back for more conversation?", "Back again? Forgotten something?", "You again. I'm keeping my eye on you." | Vary each with `{&...}`. Victoria: `{&Forgotten something?\|Reconsidering?\|Sit, then.}` Terry: `{&You again.\|Still here, then.\|You're making my night very long.}` |
| D3-21 | minor, local | hub `:177` | The test needs a topic first. A player who goes straight to the whiteboard (offered from the first hub, `:191`) never gets it, though HaX promised it (`m03_opening_briefing.ink:242`). | In `clone_debrief`, before the goodbye choices, divert once to `the_question` when `victoria_test_answer == ""`, with an opener such as "Before you go. One question. I ask everyone..." Its answers already return through the hub; make that route go to the goodbye instead (a flag, or a dedicated return). The card is already saved here, so nothing on the critical path is at risk. |
| D3-22 | minor, local | Ffion `:95`, `:217`, `:220` | Three cues in 54 lines, against m01's 1 in 37. `*gestures at the wall*` mid-line is a scene event. | Cut :95 (see D3-9) and :220. Make :217 a Narrator beat or cut it ("Says so on the plaque there, look."). |
| D3-23 | minor, local | phone `:164-175` | `hint_confrontation` sets out the three fates but never mentions the strongest lever the player holds, the target-selection line item, which the revelation call gave them. Curiosity could pay here. | One line, gated on `revelation_heard`: "And if you want to see her stop and think, ask her about the ten thousand." |

## Part 3: raising the bar

With the cycle-1 faults gone, these would make m03 play better as a thriller. The line rewrites are mission-local and cost nothing (no audio). Before suggesting any cut, I grepped m04–m08 for the lines and ideas involved: "line item" turns up in m05's recruiter (`m05_phone_recruiter.ink:114`, "He was a line item, agent."), which is a good ENTROPY echo of `:600`, so keep Victoria's line. Nothing else is quoted later.

### The 15 weakest remaining lines

| # | File:line | Now | Rewrite | Why |
|---|---|---|---|---|
| W-1 | `m03_npc_victoria.ink:125` | To see if you understand the philosophy behind real security research. | To find out what you're worth. Your CV only tells me what you cost. | Her first answer to the recruit. Money and appraisal, which is her daytime subject (D2-2), and it puts the candidate under assessment. |
| W-2 | `:143-144` | The traditional security model is broken. Researchers find vulnerabilities, report them to vendors, wait months for patches. / Meanwhile, those same vulnerabilities get discovered by others. Sold on dark markets. Exploited. | You find a hole and do the decent thing. The vendor sits on it for six months. Somebody less decent finds it in three. | Two keynote lines become one with a point. Gets to the test faster (see Pacing). |
| W-3 | `:138` | *slight pause* We push boundaries, yes. Let me explain our approach. | Unconventional. That's the polite word. Sit down and I'll tell you the other one. | The stock "push boundaries" line becomes a dare. |
| W-4 | `:204`, `:208`, `:211` | I think you'd be a good fit for our training programme. I'll be in touch. / We'll review your application. Thank you for your time. / I'm not sure you're the right fit for Zero Day's culture. We'll be in touch. | You'll do. Reception will have the details by Friday. / You're harder to read than most. I'll let you know which way it falls. / You argue with the person interviewing you. Brave. Not useful. | HR form letters become her voice. The low-influence line keeps the night read-back true ("You were rude this afternoon", `:527`). |
| W-5 | `:401-402` | Of course, what students learn in the lab is just the beginning. / The money is in knowing who'll pay, and how much. | The lab's the easy part. The money is in knowing who'll pay, and how much. | Cuts a filler connector during the read. |
| W-6 | `:408` | Security research is as much economics as it is code. | That's why I don't hire coders. I hire people who can count. | A stock line becomes a character line. |
| W-7 | `:437` | Worth every penny. Our students go operational faster than any university programme. | It paid for itself in a quarter. Universities teach them to write it up. I teach them what it's worth. | Brochure becomes the money motif. |
| W-8 | `:497` | Off the record? I think you'd fit in well here. We need more pragmatists. | Off the record, you didn't flinch once. People who don't flinch do well here. | Concrete, and it reads as a warning on a replay. |
| W-9 | Ffion `:167-168` | Oh, she's brilliant. Speaks at all the big conferences, writes the papers, the lot. / And she really cares about the work. Sometimes she's here until midnight. | Oh, she's brilliant. Does the big conferences, gets quoted in the papers. Bit terrifying, mind. | "Midnight" is said three times in this topic (:168, the choice at :178, :179). Keep it for the follow-up. |
| W-10 | Ffion `:170-171` | Between you and me, she can be intense. Very particular about her research. / But she's fair. If you're good at what you do, she'll respect you. | Between you and me, I've never seen her lose an argument. Not once. / She remembers everyone's birthday, though. Which is more than my last place did. | A detail of her own life, and a quiet contrast with Terry's "never learnt my name" (`:357`): Victoria works on the people she finds useful. |
| W-11 | Ffion `:216-221` | WhiteHat Security was founded in 2010 by Victoria Sterling. ... *uncertain* Something about market-driven security research? Ms. Sterling explains it better than I can. / She has strong opinions about how the security industry should work. | Since 2010. Says so on the plaque, there, look. "Security Through Economics." / (reply) Something about paying people properly? Ask her. Actually, don't, you'll be here till six. | Brochure becomes the front desk. Keeps "2010" and the plaque, which are the password clue (`m03_phone_agent0x99.ink:315`). Leaves "market-driven" to Victoria. |
| W-12 | Terry `:301`, `:304` | I'm keeping an eye on you. Don't make me regret this. / Alright. Stay out of trouble. | I've got your face now. Don't make me use it. / Mind how you go. | Stock guard lines become Terry's. |
| W-13 | Terry `:394`, `:405` | That's it. I'm calling the police. Don't move. / Security! I have an intruder! | Right. That's the police, then. Stay where you are. / Oi! Get back here! | He is the security, on his own; shouting for security reads as a slip. |
| W-14 | Terry `:148` | Alright. But be quick about it. And stay in the executive area. Don't wander. | Ten minutes. Then I come looking. | Shorter and drier, and it puts a clock on the player. |
| W-15 | briefing `:205`, `:247` | Your call. I trust your read. / Good answer. Evidence first. | Your call. / Then get the facts. He'll still be there. | HaX shows trust by handing over, not by saying it (voice bible: "without saying she's warm"); "Good answer" is a quiz-master's line. |

### Scenes that still land flat

1. **The clone has a clock but no threat** (`:366-445`). "Halfway" and "Nearly there" are good, but nothing goes wrong unless the player has already slipped. One beat of danger would make the read feel like a heist. In `clone_check_2`, gated on `victoria_suspicious >= 5` and not `read_dropped`:

   ```ink
   Narrator: Her eyes drop to your jacket, where the cloner's light shows through the cloth. Then back to the board.
   ```

   Narration only, so there's no new choice and no softlock risk. A player who has been careful never sees it; a player who has pushed her sees how close it got.
2. **The doorway reveal as her last card** (D3-1). At the close, "I said I'd do it myself. I still might." turns a callback into a threat just before the one-move choice.
3. **Ffion and Terry as one chain** (D3-2). What the player tells reception at eleven reaches the guard. That is a small cover-maintenance scene, and it rewards the player for keeping a story straight.
4. **The Danny payoff with a reply** (D3-4). "It should be you." deserves an answer.
5. **Optional, cross-mission:** nothing in m04–m08 mentions Sterling or Danny (grep of `scenarios/m0[4-8]*/ink`). A recruited Sterling is the obvious source to quote in a later briefing, and HaX's "It should be you" leaves a thread a later mission could close. This needs approval and belongs in `docs/IDEAS_BACKLOG.md`, not this cycle.

### Pacing: Victoria's afternoon and night

- **The afternoon** has about 12 choice points on a typical route:
  - first impression;
  - philosophy;
  - a topic and its follow-up;
  - the test;
  - a second topic (optional);
  - the whiteboard;
  - three beats while the cloner reads;
  - the goodbye.
- **The slow part is the first third.** `first_impression` → `philosophy_intro` → `market_efficiency_pitch` → the first topic are three lecture beats in a row before anything is at stake. W-1 and W-2 cut two lines and make the first answer an appraisal, so the test (the first real pressure) arrives sooner. The middle and end are now well paced: the test, then the read with its narrated clock. Trim the tail as in D3-19.
- **The night** runs well once the player speaks: an accusation, her reply, `the_reckoning`, target selection, the close, one move. The fault is the top-heavy opener (D3-1). With the reveal moved, the opener is one read-back plus, at most, the guard's call, and the player speaks within three or four lines. That matches m01's confrontations.

### Ffion and Terry as distinct people

- **Ffion (Cardiff, mid-twenties): mostly there.**
  - The markers are right and unforced: "You'll be the three o'clock, is it?" (`:39`), "love", "mind", "Lives for it, she does." (`:176`).
  - The new lines give her a life: the pizzas (`:85`), the biscuit tin (`:136`), the charger (`:285`).
  - What lets her down is the brochure answers left in her topics (D3-9, W-9 to W-11). She is at her best when she doesn't know what the firm does and says so cheerfully.
- **Terry (Essex, fifties, dry): there whenever he isn't threatening.**
  - "With a pick set. Course she did." (`:441`), "Pays the mortgage. And nobody talks to me after nine, which suits me." (`:328`), "Right you are. I never saw you. I'm good at that, as it goes." (`:280`) and "It's Terry, since you didn't ask." are all him.
  - His hostile and escalation lines are generic guard barks (W-12, W-13), and his SAFETYNET flip is too quick (D3-13).
  - Rule of thumb for the fixer: Terry never shouts a full sentence. He gets shorter.
- The two no longer sound alike. The remaining risk is that both slip into stock lines at the edges of their scenes.

### HaX's handler voice

- **The debrief is the best HaX writing in m03.** The fate-linked Danny lines, "Finance will want a receipt." (`:97`) and "Next time, bring it out yourself." (`:274`) show care through what she does. The remaining slips are the over-explained cover-sheet line (D3-16) and one moral summing-up (D3-17).
- **The phone** is terse and functional, which suits a handler. "Well. That's one way to end a job interview." (`:557`) and "One ENTROPY cell invoicing another. I may have it framed." (`:455`) carry her humour. The hints are flat by design; D3-23 is the one place a hint could carry a little edge.
- **The briefing** leans on stock acknowledgements: "Right to business. Good." (`:47`), "Smart." (`:209`), "Agreed. That's the mission." (`:109`), plus W-15. One or two are fine as clipped acknowledgements; together they sound like a form. Cut "Good." from `:47` and swap one of the others.

## Structure and skill checklist (§2a–§2i)

| Check | Result |
|---|---|
| 2a Attribution | OK. Every prefix resolves (`Ffion Rees`, `Terry Mott`, `Victoria Sterling`, `Danny Foster`, `Agent HaX`, `Director Magnus Netherton`, `Agent 0x47 'Nightshade'`, `Narrator`). |
| 2a-bis Supported by scenario | OK. The window Victoria stands by and the reflection the reveal needs are narration inside the chat (`:509`, `:665`). The packed bag is under her desk by day (Terry `:275`) and on her shoulder by night (`:509`), so no prop is needed. The plaque exists (`scenario.json.erb:536`). Terry's "second floor" (`:101`) is the player's lie, not geography. |
| 2a-ter Voices | OK. No change since C1. |
| 2b Choices spoken | OK. New choices are first-person speech. Non-verbal labels ("[Look in on Sterling]", "[Brace yourself]") are actions. |
| 2c Hub structure | OK. Every person-chat ink has a sticky exit and a resting knot. Exits are 1–2 lines. No `-> END`. |
| 2c-bis Starved knots | OK. loopcheck is clean over 27 runs, including the C1 D2-4 state. |
| 2d Choices that matter | Victoria's test: remembered, but often pre-empted (D3-3). Goodbye stance: remembered (a low-priority read-back, correctly). Target selection: remembered by the debrief. Ffion's night answer: one value in three matters (D3-2). Danny × Victoria: paid off, with no player reply (D3-4). |
| 2d.4 S1–S8 | None found in the new material (see Step 1). |
| 2e Cross-file state | OK. `named_target_selection`, `ffion_night_story` and `sterling_on_call_seen` are declared in the erb (`:1765`, `:1773-1774`) and in missions.json (`:410`, `:418-419`), with VARs in every reader. `victoria_test_answer`, `afternoon_goodbye`, `skipped_background`, `greeted`, `day_greeted` and `asked_knock_off` are local and read. Two values of `ffion_night_story` are never read (D3-2). |
| 2f Influence tags | OK. Every new `+=` carries `# influence_increased`. |
| 2g Syntax | OK. |
| 2h KO | OK. New lines respect KO: target_followup's Danny option excludes `danny_fate == "ko"` (`:590`); the night read-back handles `receptionist_ko` first. |
| 2i Recurring bugs | Same fact twice in a row: D3-8, D3-15. A choice the route didn't earn: D3-6 (a name the player may not know). Hub greetings vary, except the re-entry lines in D3-20. Credit against route: D3-14. |

## Prioritised action list

**Must fix:** none. No blocker and no softlock.

**Should fix (this cycle)**

- D3-1: move the doorway reveal to `the_reckoning_close`, and restore "Nor do they".
- D3-3: reorder the night read-back so the test pays off and "twice" is always true.
- D3-2: Terry reads all three of Ffion's answers, and catches a changed story.
- D3-4: give the player a reply after the Danny × Victoria lines; trim the run-up.
- D3-5 to D3-8: the polish on the target-selection beat and the test reply.
- D3-9, D3-13, D3-17: character slips (Ffion's brochure, Terry's flip, HaX summing up).

**Worth doing**

- W-1 to W-15.
- Scenes #1 (the cloner's light).
- D3-10 to D3-12, D3-14 to D3-16, D3-18 to D3-23.

Lines grepped against m04–m08 before recommending a change: "line item", "consultancy", "sleep perfectly", "picked the hospital", "mirror", "Danny", "Sterling". The only later echo is m05's "He was a line item, agent.", which this review keeps.

## For the user

Nothing here needs approval: every finding is mission-local, and m03 has no audio. One idea goes to the backlog rather than this cycle, because it touches later missions: a callback to a recruited Sterling and to Danny's "It should be you." thread in m04 or later (Scenes #5).

## Verdict and counts

**Verdict: revise (light).** Cycle 1 landed: the mission now fires its central reveal at Victoria, tests the recruit, and lets the two moral choices meet. The new text is mostly strong. Three connections between the new pieces don't hold yet:
- the night opener stacks and breaks a referent;
- the test's payoff is pre-empted by a line that can be false;
- Ffion's answer reaches Terry for one line, then he forgets it.

The debrief also needs one place for the player to answer. All four are a few lines each. Expect cycle 3 to confirm those and take the weakest-lines pass.

| Severity | Count | Ids |
|---|---|---|
| Blocker | 0 | |
| Major | 4 | D3-1, D3-2, D3-3, D3-4 |
| Minor | 19 | D3-5 .. D3-23 |

All 23 are mission-local. Weakest-line rewrites: 15 (W-1 to W-15, all voiced). Flat or missing scenes: 5 (four local, one for the backlog). C1 items not properly fixed: D2-17 (regression), D2-12, D2-3; D2-25 needs a log correction only. Checks: static only (compile to scratchpad, validator `--skip-ink --no-graph`, dialoguelint, reopencheck, loopcheck over 27 runs, text walks with inkjs). No browser run.
