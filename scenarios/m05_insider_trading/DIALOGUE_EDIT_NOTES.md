# m05 Insider Trading — script editor's notes on the dialogue pass

Fresh review, 2 October 2026. Read-only apart from this file.

Baseline: the writer's snapshot `<scratchpad>/m05-dialogue/ink-before/` (ten inks) and
`<scratchpad>/m05-dialogue/scenario-before.json.erb`. Every current ink and the erb were diffed against it
line by line. Line numbers are the **current** files unless marked "before". References:
`docs/agents/PASS4_BRIEF.md`, the dialogue style guide, the voice bible, the humanizer rules,
`README_ink_best_practices.md` ("Common ink bugs"), `DIALOGUE_REVIEW.md`, `DESIGN_REVIEW.md` and the round-3
confirmation report (`tools/playtest/m05-pass4-confirm3-report.md`). The m07 notes set the bar.

The short version: a strong pass. The whodunnit is untouched where it has to be and fixed where the design
rounds asked; the scripted player lines are gone; Owen, Lisa and Halloran now sound like three different
people; HaX has lost her banned lines. The faults are small: one stakes line that's wrong on one briefing
route, a flag call that still repeats its text, two Narrator lines in the Torres scene, and one re-entry line
that lands after a goodbye. Verdict at the end: **revise** (light).

## 1. Logic safety

All run by me in this session; output in `<scratchpad>/m05-scripted/`.

| Check | Result |
|---|---|
| `tagdiff.mjs --old <before> <after>`, each of the 10 inks | **STRUCTURE UNCHANGED** for the briefing, the debrief, Patricia's phone and the Recruiter. Halloran 11, Lisa 7, Owen 7, Patricia 12, Torres 19 differences: all the `hub_quiet` / `fight_quiet` / `after_quiet` re-entry pattern (a new VAR, a `{quiet: … - else: <line>}` block at the top of the resting knot, `~ quiet = true` before exits and after hard lines). Torres' `after_choice` also gains a prose-only branch on `final_choice` (narration for the KO endings, a Torres line otherwise); it reads state and sets nothing. HaX 2: the `{patricia_ko:}` block that chose between two scripted player lines went with them; HaX's reply still branches on `patricia_ko` (`m05_phone_agent_0x99.ink:544-548`). No tag, knot, choice condition, sticky/once-only marker or divert changed. `You:` lines 110 → 1 (the Recruiter's `[Say nothing.]`). |
| Compiled JSON in step | Recompiled all ten with `bin/inklecate` into scratch: every JSON identical to the one in the repo. |
| `dialoguelint.mjs` | 0 errors. Two notes, both allowed: `you-after-choice` after the Recruiter's non-verbal choice (`m05_phone_recruiter.ink:87`), and one villain `not-x-but-y` (`:352`). Medians 8–15, max 29 (debrief, Owen); timed texts max 28. |
| `reopencheck.mjs … m05_insider_trading` | HaX, Patricia's phone and the Recruiter: 1800 reopens each, **0 problems**. |
| Person-chat reopen (by reading the engine) | No double line. `InkEngine.continue()` runs past the empty output that carries `#exit_conversation`, so the quiet flag is spent in the farewell batch and the state is saved at the hub's choices (`person-chat-minigame.js:997-1010`, `systems/ink/ink-engine.js:31-60`). A re-talk re-navigates to the owning knot (`person-chat-minigame.js:513-527`), which now prints its re-entry line, so `reopenContextLine` returns null and the engine's "re-show the last line" never fires (`person-chat-reopen.js:58-63`). Every `~ quiet = true` is followed by a divert into the resting knot, so the flag is never left set at rest. |
| inkcheck + loopcheck, the writer's 31-state matrix over 31 entry knots | **1922 runs, 0 failures** on the final ink (the writer's run started before their last four prose tweaks; this one is after). No starved knots, runaways or runtime errors. |

Nothing here blocks.

## 2. The whodunnit

The top priority for this mission. I compared every whodunnit-facing line against the snapshot.

| Item | Before → now | Verdict |
|---|---|---|
| Naming menus: Patricia in person (`m05_npc_patricia_morgan.ink:318-329`), her phone (`m05_phone_patricia.ink:129-141`), HaX (`m05_phone_agent_0x99.ink:359-369`) | Byte-identical apart from the dropped phone prefixes. Bare names, the "feeling" option, Ben's rebuttal. | Unchanged |
| Reason menus and replies (`patricia_morgan:357-377`, `phone_patricia:170-195`, `agent_0x99:438-462`) | Identical: same order (log decoy first, the right log reason never first), same conditions, same replies, same exits on a wrong reason. | Unchanged |
| `log_reason_right` and its phone and HaX twins | Identical. | Unchanged |
| Badge log (erb `door_log_text`, `:76`) and Owen's hand-over (`owen_gallagher:271-272`) | Only "Give me a sec" became "Give us a sec". | Unchanged |
| Halloran's alibi (`dr_halloran:210-213`) | A comma. Zurich, the lanyard, "David, mostly", "...Oh. Oh, no." all intact. | Unchanged |
| Owen's hallway sighting (`owen_gallagher:166`) | "Just standing there" → "Just stood there". Still unnamed, still "Didn't get a proper look". | Unchanged |
| Patricia's suspect list (`patricia_morgan:240-245`) | Identical: three motives, Torres the vaguest. | Unchanged |
| Briefing tells and "Patricia's included" (`opening:143-147`) | Identical. The non-cooperation line changed from "Financial desperation, ideological manipulation" to "People in debt, people with a grievance" (`opening:195`): debt fits Torres and Ben, grievance fits Halloran. If anything, better balanced. | OK |
| **Lisa's "What have you noticed lately?"** (`lisa_park:123-129`) | Before: "David Torres especially. He looks like he's carrying something heavy, all the time." Now three people in one breath: Halloran's row, Ben "snapping at everyone", David "has barely said a word in weeks". | **Fixed**, as the confirm3 report asked. See W1. |
| **Patricia's file hand-over** (`patricia_morgan:284-285`) | "Two names on Owen's sheet have something in their files this year" → "That's what vetting will let me give you. / Read them properly. Nobody's file is as tidy as it looks." | **Fixed**: no count, and the warning that both files are untidy survives. |
| Patricia's case read-back (`patricia_morgan:407-426`, `phone_patricia:216-235`) | Same six facts under the same six conditions; only who says them changed. Nothing is recited that the player doesn't hold. | OK (see C1 on whether the player still owns the case) |
| HaX's flag topics | `topic_flag3` "His name's on the manifest" (`agent_0x99:330`) names him, but only after flag 3, which is itself the evidence. | OK |
| Lisa's tin answer (`lisa_park:68`) | Still names David, by design. | **Acceptable.** The tin is on the table, the player chooses to ask, and the answer is motive only: no hours, no badge, no access. The game already says motive alone isn't a case: the strain reason is rejected ("Half this building has someone ill at home", `patricia_morgan:362`) and the flyer names nobody. The badge log is still where he becomes the suspect the evidence supports. |

**W1 (optional, design-level, for the log).** Lisa's three-way gossip is balanced on the page, but the hub
behind it isn't: `ask_office_mood` sets `heard_about_david` (`lisa_park:126`), and that flag unlocks two
David-only follow-ups ("Tell me about David Torres.", "What do you know about his wife?", `:103`, `:106`).
Halloran and Ben get no follow-up. So the menu still leans the moment she has named three people. This was
there before the pass and fixing it is a structure change, so it isn't one for this edit. Two options for
the orchestrator: give Ben one follow-up in Lisa's hub ("What's eating Ben?" → the pay review, the
evening test runs, "Owen says he's always skint"), or leave it, since the follow-ups are motive and the
log still decides it. I'd leave it; the confirm3 run found the log was the turning point once Lisa's
opener stopped naming him.

Nothing in the rewrite names Torres earlier, makes a right reason more obvious or removes an ambiguity.
The two changes the design rounds asked for (Lisa's opener, the file count) are both in.

## 3. Information: what the player needs, and where it is now

Walked the critical path and the optional branches against the before-copy.

| Step | Where it's delivered now | Findable again? |
|---|---|---|
| Go to Patricia first | Briefing close `opening:346`; arrival text erb `:815`; HaX first call `agent_0x99:105` | Yes |
| Kit (picks, cloner, print kit; no PIN cracker) | Briefing `opening:219-221` (unchanged) | Inventory |
| Drop-site, Bludit, four flags | Briefing `opening:253-258`, `:313`; erb `:1036`; HaX guides `agent_0x99:565-637` | Yes |
| Bring the why and the proof | Patricia `patricia_morgan:148`, `:154`; HaX first call `agent_0x99:117` | Yes, HaX `general_advice` |
| The 23:47 badge → Owen's reader log | Patricia's log (erb `:1588`); Owen hub `owen_gallagher:115`; HaX `general_advice` `agent_0x99:735` | Yes |
| Halloran's spare and alibi | `dr_halloran:138`, `:210-213`; HaX `:727`; erb `:945` | Yes |
| Vetting files, gated on the log | `patricia_morgan:274-285` | Yes (sticky ask) |
| Office card: Patricia's say-so or Owen's trust | `patricia_morgan:288-292`, `:399`; `owen_gallagher:127`, `:275-298`; erb `:990`, `:997` | Yes |
| Owen's badge for the server hallway | `owen_gallagher:121`; erb `:984`; RFID guide `agent_0x99:609-621` | Yes |
| Server-room password | `owen_gallagher:124`, `:230-262`; `patricia_morgan:294-297`; erb `:1005`; HaX `:707-712` | Yes |
| Vault takes Torres' print | `owen_gallagher:256-261`; erb `:1012`, `:1019`; Patricia `:451-458`; HaX `:713-718` | Yes |
| Torres is at the upload terminal | `patricia_morgan:442`; `phone_patricia:243`; HaX `:395` | Yes |
| The deal terms (SAFETYNET pays for the trial; no promises about a court) | Torres `torres_confrontation:240`, `:296` | In the scene |
| Flags outstanding after the climax | `patricia_morgan:448-450`; HaX `:400-402`, `:740-742`; erb `:1044` | Yes |

The trims kept every instruction, code and pointer. What I found:

- **I1 (should-fix). The stakes line is wrong on one route.** `opening:300` "Thirty to forty-five lives. I
  won't say it again." sits under `{knows_full_stakes:}`, and `timeline_urgency` sets that flag
  (`opening:83`) without saying the number. A player who asks "How much time do we have?" then "Understood.
  What do you need from me?" hears the figure for the first time in a line that says she's said it before.
  The writer's note says the line "also covers the player who heard the clock but not the number"; it does
  reach them, but the words don't fit them. The before line ("Remember…") had a milder version of the same
  fault. Replace: "Thirty to forty-five lives ride on that upload. Keep the number with you." (13 words;
  works for both routes.)
- **I2 (should-fix). The flag-3 call repeats the flag-3 text.** erb `:895` "Last one's the authorisation behind
  it, where only root can read." and HaX `topic_flag3` `agent_0x99:332` "The last one's the authorisation behind
  it. Only root can read it, so think about sudo." The writer's note says the flag topics no longer repeat
  the texts; this one still does. Replace `:332`: "Root's the last door. Start with what that account is
  allowed to run." (Citation level; the sudo guide at `:600` says the same.)
- **I3 (should-fix). Flags 2 and 4 restate the choice the player just read.** `[Second flag's in. I've got a
  shell.]` → "The shell's yours, then." (`:320`), after the text "Second flag in. You've got a shell."
  (erb `:888`): the player gets the same fact three times. `[Fourth flag's in. Root, and the Architect's
  sign-off.]` → "That's root, and all four in." (`:340`), after the text "Final flag in." Replace `:320` with
  "Now find out who's been living on that box." and drop "Look for…" to "Their home directory will tell you
  who." on `:322`; replace `:340` with "Then you've seen the Architect's signature." `:342` stays ("Read the
  number on it before you face Torres. He's seen it too." is good, and true: `torres_confrontation:131-133`).
- **I4 (optional, pre-existing, for the log).** HaX's `general_advice` goes stale after the confrontation
  when all four flags are in: it falls through to "You've named him. Be ready for anything down there."
  (`agent_0x99:745`). A status answer should branch down to the step (README "Common ink bugs" 10). Fix is a
  condition, so not for this pass: add `{final_choice != "": Torres is dealt with and the portal's done.
  Find HaX for the debrief. -> support_hub}` above `:744` (wording to suit where the debrief is triggered).
- **I5 (optional, pre-existing).** Owen's two 23:47 choices disagree about the place: "in the server hallway"
  (`owen_gallagher:115`) and "in your server room" (`:238`). Patricia's log says server room (erb `:1588`);
  the badge log says server hallway (erb `:76`). A careful player in a whodunnit notices. Make `:238` "[Patricia's
  log has a crypto badge on the server side at 23:47. Unlogged.]", or settle the place in the erb.

No information was lost from the Torres scene. The scripted player lines that carried the deal (SAFETYNET
pays; a court is not ours to promise) are now in the choice (`:295`), Torres' reply (`:296`) and one
Narrator line (`:240`).

## 4. Character

**Netherton.** Right. Formal, few contractions ("I have brought Nightshade in"), a report-like opener, a fast
hand-over. "Catching a mole is precisely his trade" is kept word for word (`opening:30`); it's the approved
m08 plant and still reads as an ordinary compliment.

**Nightshade.** Right. The 60-word speech is now medium line, short line, which is his rhythm in the voice
bible, and "the calm of someone who's decided the rules don't apply to them" survives intact (`opening:36`).
One double-edged line, never a wink. Good.

**HaX.** The banned lines are gone ("Trust your training", "Good work"), she opens on the fact, and there
are no exclamation marks or mottos. Better lines than before: "Copy. Mind the clock." (`agent_0x99:190`),
"It's a win for the file. His family paid for it." (debrief `:546`), "Read the number on it before you face
Torres. He's seen it too." (`agent_0x99:342`). Two habits to trim:

- **CH1 (optional). "Good." is becoming her tic.** Five times: `agent_0x99:422`, `:467`, `:669`, briefing
  `:276`, erb `:1044`. Keep the erb one ("The upload's dead. Good."); it's earned. At `:467` drop "Good." ("His
  badge at the front door, her spare six minutes on, every night. That's a pattern."); at `:669` use "Then
  read the room when you get there."
- **CH2 (optional). Two sign-offs that sum up.** `agent_0x99:688` "Both are true at once. Nobody's philosophy
  handles that cleanly." and `:693` "That's a lot to carry, {player_name}." The voice bible says she states
  the cost and lets it sit. Cut `:688` to "Both are true at once." and `:693` to "{player_name}." (or cut it).

**Patricia** (Cardiff, ex-military, dry). Distinct now: "Direct. Good.", "Then we can skip a step.", "Do. I
don't like surprises.", "Quickly, now. The CEO's prowling." Her case read-back is in her register (notes,
fragments). One repetition:

- **CH3 (optional). "Go on, then." three ways.** `share_findings` opens "Go on, then. Who?" (`:313`), her
  hub says "Go on." (`:168`), and `significant_close` answers "[I'll stop him.]" with "Go on, then." (`:471`).
  The last is the one that matters: it's her send-off before the climax. Replace `:471`: "Then go. I'll be
  by the phone." (It matches her own instruction at `:460`: "keep him there and call me".)

**Owen** (Manchester, sardonic). The best-improved voice: "Alright.", "Finally. Someone to fix our mess who
isn't me.", "Mostly reason.", "Always behind, always skint, that lad.", "Give us a sec", "Go on. I'm half
listening." He sounds like one person from the first line.

**Halloran** (Dublin, sharp, protective). Good: "I run Heisenberg.", "I hope to God you're wrong about my
team.", "Go on, so.", "Quickly, please. I've work to do.", "*quietly* I suppose he will." Covered names,
she and Patricia no longer swap.

**Lisa** (chatty). She chats now: "I sit by the kettle. I notice things.", "Keep it to yourself, yeah?",
"Hence the tin.", "like it's a game of Cluedo", "poor lamb". One repeat the new gossip line created:

- **CH4 (optional).** On the gossip route the player hears "David Torres has barely said a word in weeks."
  (`lisa_park:128`) and then, two choices later, "Now he barely talks at all." (`:144`). Replace `:144`:
  "Now he eats lunch at his desk and doesn't look up."

**Torres.** His grief lines are untouched and still the best writing in the mission. The new lines where
he works out what the player means are in his voice ("You're not police. So Patricia's ringing them.",
"The upload first. I know.", "And the court? *a beat* No. You can't promise that."). Two Narrator lines
don't fit him or the Narrator; see CR3.

**The Recruiter** (American, warm, ruthless). Splitting her long lines has kept the menace and the patience:
"It costs me nothing.", "He was a line item, agent.", "I've built a career on the difference." Her
American idiom ("one less thing", "Do what you like with Torres") is right for her. The new choice
"[You're talking about him like a receipt.]" answers what she has said (`m05_phone_recruiter.ink:105`).

**Narrator.** Mostly camera: "20:14. The data centre. The racks roar." "This is the choice." and "What it
cost depends on what you just chose." are gone, rightly. One editorial line slipped in; see CR3.

The one-mission cast is now distinct with the names covered: Patricia clipped and procedural, Owen
deflecting with jokes, Halloran fierce and formal, Lisa warm and run-on, Torres slow and broken.

## 5. Craft

**Choices.** First person and spoken throughout; the 77 echoes are folded in and the brackets that were
labels are now the line ("[I've been briefed. Quantum-safe keys, an inside job, and it ends tonight.]",
"[If he's done something, his circumstances don't change that.]"). The approach answer "[I'll read the room
when I get there.]" now matches the debrief's callback "You said you'd read the room." (`debrief:221`).
That's a good catch.

**CR1. Does the player still feel they made the case? Yes.** The naming choice has to stay a bare name
(the whodunnit menus are locked), so the question is what follows it. "Slowly. I'm writing this down."
(`patricia_morgan:407`, `phone_patricia:216`) tells the player they are talking, and the fragments that follow
read as Patricia's notes of what they said, each one present only if they found it. Then "...Damn." and the
Christmas party. Before, the player had six scripted lines they didn't choose; now they hear their own
evidence taken down. It works, and it's better than the old version. No change.

**CR2. The exposure-debrief pair and `mission_priority` (orchestrator item 5).**

- `public_exposure_path`'s two choices (`debrief:520`, `:523`) are distinct in intent (stop a rebuild /
  punish) but get the same answer, which opens "It worked." (`:529`). Smallest fix, prose only, no state:
  give each choice one reply and drop "It worked." from the knot.
  - `:520` "[It was the only way to make sure they can't rebuild it.]" → `Agent HaX: That part worked.`
  - `:523` "[ENTROPY needed to see this cost them something.]" → `Agent HaX: It did. Not only them.`
  - `:529` → `Agent HaX: The Initiative is finished in this country, for now.`

  "Not only them." then lands on the next lines about Torres' children. Recording the stance (a VAR the
  final reflection reads) is more than this beat needs.
- `mission_priority` (`opening:8`, `:275`, `:281`, `:287`; erb `:539`) is set and read nowhere in the repo
  (I grepped the ink, the erb, the Ruby and the JS). `player_approach`, set on the same three choices, carries
  the same information and is read by the briefing and the debrief. **Fine as it is.** Removing it is a
  structure change for no player-facing gain; if a later logic pass is tidying globals, delete the VAR, the
  three assignments and the erb global together.

**CR3. Narration in the Torres scene** (should-fix).

- `torres_confrontation:470` "Narrator: Home, and act normal. Elena starts treatment on Monday. You'll be in
  touch." is the player's instruction voiced as the Narrator's own fragment; in the noir voice it sounds as if
  the narrator is giving Torres orders. Replace: "Narrator: You tell him: home, act normal. Elena starts
  treatment on Monday. You'll be in touch." (Same pattern as the writer's own `:240`, "You tell him.")
- `:482` "Narrator: You nod. SAFETYNET keeps its deals." The second sentence is the Narrator vouching for the
  institution, which the voice bible rules out ("never comments"). Replace: "Narrator: You nod."

**CR4. Torres restates the exposure choice** (optional, recommended). The player picks "[I'm going public. The
programme, the Recruiter, you. From a source nobody can trace.]" and Torres' first line is "You'd burn all
of it. The Recruiter, the placements. Me." (`:420`). Every route into this choice has passed through
`torres_knows_truth`, where the Recruiter's first lie was "Investigative journalists exposing a corrupt
contractor." (`:128`). Use it: "David Torres: Journalists. That's what she told me this was, at the start."
It turns a restatement into the scene's best irony.

**CR5. Re-entry lines (orchestrator item 3).** The six knots read well and vary: Lisa "Anything else? I've got
nowhere to be." / "Go on." / "What else?"; Halloran "What else?" / "Go on, so." / "Quickly, please. I've
work to do."; Owen "What else?" / "Go on. I'm half listening." / "Yeah?"; Patricia "Go on." / "What now?" /
"Quickly, now. The CEO's prowling."; Torres "Still here." / "Is there something else?", or "He hasn't
moved." after a KO; the fight knot "He's breathing hard, between you and the terminal." None loops: each
`{&…}` cycles, each block is skipped once after an exit, and no knot re-enters itself without a choice. The
writer was right to set the flag after the hard lines ("...Oh. Oh, no.", the suspension, Owen's "walked
past him"), so "What else?" never follows them. As shown in section 1, they can't double up with the
engine's re-shown line. One miss:

- **CR5a (should-fix).** `owen_gallagher:77-79`: "[Point me at the logs. I'll take it from here.]" → "Right.
  Terminal's over there. Shout if you need anything." → `-> hub`, which now adds "What else?" / "Yeah?"
  straight after. The player has just said they're going and Owen has just said "shout". Add
  `~ hub_quiet = true` before `-> hub` on that choice, as the writer did for Halloran's hard lines (one
  assignment, same pattern; log it with the other re-entry differences).

**CR6. Lines that go stale after the confrontation** (optional, pre-existing in substance).

- `dr_halloran:247` "Then think about his circumstances when you're in front of him. Please." `halloran_guilt`
  can open after the confrontation is over (it needs only `torres_identified`). Replace: "Then think about his
  circumstances. Please." (works either side of the scene).
- HaX `general_advice` (I4 above).

**CR7. The public-exposure debrief says the same thing twice** (optional). "Expect them to hit back. You made
them look weak, and they won't forget it." (`debrief:549`) and then, two knots later, "We'll be watching for
their reply." (`:639`, which replaced "They're wounded, not finished"). Replace `:639` with something new:
"Their other cells will have read the same headlines."

**CR8. Small choice wording** (optional). Halloran's new "[I need into the server hallway. Your badge opens
it.]" (`dr_halloran:141`) uses "I need into", which is Scottish and northern usage; the player's voice is plain
British. Owen's and Patricia's "[I need into David Torres' office.]" predate the pass. If one is changed,
change all three to "I need to get into…".

**Debrief payoffs.** Every choice-setting global is still read back by name: the approach (with its "read
the room" callback), the badge log, Halloran's suspension, the warning signs found, `confront_stance`, the
fate, Elena's treatment, the Recruiter deal and the stand-down email. "That was thirty to forty-five people, in
the first wave alone." (`:232`) does the job the duplicate "they'll never know" did, and the human line is kept
for the close (`:682`).

**Villains.** The Recruiter earns her length: each line now does one thing, and the one rhetorical "That's
not a defence. It's…" lands at the end where it belongs. Torres isn't a villain and isn't written as one.

**m08 foreshadowing.** Netherton's and Nightshade's lines are intact and no louder than before. No new hints
were added.

## 6. AI tells and UK English

A hand search for the banned words, the transitions and the "not X, Y" shapes finds nothing the lint
missed, apart from the items below.

- **Rhythm.** Better than m07's pass: the writer split long lines unevenly, and Lisa, Owen and Torres each
  have their own pace. The risk is HaX's phone, where most answers are now one medium line and one short one
  ("Recon first. A leaked login gets you further than guessing ever will." / "Quiet hands. It'll give." /
  "Quick scan, clean notes, then go in."). That's her rhythm in the voice bible, so it stays; CH1 and CH2
  take out the tidy beats on top of it.
- **Tidy endings.** The writer cut "That's how they're caught.", "That's the difference.", "High risk, high
  reward." Two remain: CH2 (`agent_0x99:688`, `:693`).
- **Disguised "Not X. Y."** "Weigh what it costs. Ignore how reasonable she sounded." (`agent_0x99:296`) is
  the imperative version of "weigh X, not Y". It reads as natural speech; optional: "Weigh what it costs. How
  reasonable she sounded doesn't come into it." Patricia's "It's enough to look, not to act." is in the locked
  reason menu; leave it. The Recruiter's "Inventory doesn't have a price, agent. People do." and her final "not
  a defence" are in different scenes, one each, as the style guide allows a villain.
- **Rule of three.** The briefing's "A badge at an odd hour. Money that doesn't add up. Someone who's changed."
  and Halloran's "Pressure. Coercion." are design lines and earn the list. "Cardiac arrests. Strokes. Structure
  fires." is the before-copy's figure list, moved to its own line; fine.
- **UK English.** Clean: per cent, car park, Cluedo, skint, "Give us a sec", 999. "program" in `agent_0x99:606`
  is the computing sense, correct in UK English. Narration uses the 24-hour clock ("20:14"); fine for the
  noir narrator.

## 7. Findings list

**Must-fix**

- **M1 (= I1).** Briefing `m05_insider_trading_opening.ink:300`: "Thirty to forty-five lives. I won't say it
  again." is the first time the timeline-route player hears the number. Replace: "Thirty to forty-five lives
  ride on that upload. Keep the number with you."

**Should-fix** (replacement lines in the sections above)

- **I2** HaX `topic_flag3` `m05_phone_agent_0x99.ink:332` repeats the flag-3 text: "Root's the last door.
  Start with what that account is allowed to run."
- **I3** HaX `topic_flag2` `:320` and `topic_flag4` `:340` restate the choice and the text: `:320` "Now find out
  who's been living on that box.", `:322` "Their home directory will tell you who.", `:340` "Then you've seen the
  Architect's signature."
- **CR3** Torres `m05_torres_confrontation.ink:470` "Narrator: You tell him: home, act normal. Elena starts
  treatment on Monday. You'll be in touch."; `:482` "Narrator: You nod."
- **CR5a** Owen `m05_npc_owen_gallagher.ink:77-79`: add `~ hub_quiet = true` before `-> hub` so "What else?"
  doesn't follow "I'll take it from here." (one assignment; log it with the re-entry differences).
- **CR2** Debrief exposure pair `m05_closing_debrief.ink:520-529`: one reply under each choice ("That part
  worked." / "It did. Not only them.") and drop "It worked." from `:529`. Prose only.

**Optional**

W1 a Ben follow-up in Lisa's hub (design, for the log; I'd leave it) · I4 HaX `general_advice` after the
confrontation (condition, for the log) · I5 Owen's server hallway / server room at `:238` · CH1 two of HaX's
five "Good."s · CH2 HaX `:688`, `:693` sign-offs · CH3 Patricia `:471` "Then go. I'll be by the phone." · CH4
Lisa `:144` · CR4 Torres `:420` "Journalists. That's what she told me this was, at the start." (recommended) ·
CR6 Halloran `:247` · CR7 debrief `:639` · CR8 "I need into" · `agent_0x99:296` "Weigh what it costs…".

**Orchestrator's questions, answered.**

1. Whodunnit balance: intact. Nothing names Torres earlier, no right reason is easier to spot, no ambiguity
   is gone; the two leaks the design rounds found are fixed. Lisa's tin answer naming David is acceptable
   (section 2).
2. No influence tags proposed.
3. Re-entry knots: read well, vary, don't loop, and can't double up with the engine's re-shown line; one
   miss (CR5a).
4. Voices: all true to the bible; Patricia's read-back keeps the player as the one making the case (CR1).
5. `mission_priority`: fine as it is. Exposure pair: the prose fix in CR2.

**Lines this would touch.** Must-fix and should-fix: 10 spoken lines across 4 inks, plus one assignment
(CR5a), which is the only structure change. With every optional item, about 25 lines and 4 choices. m05 audio
isn't generated yet, so none of this costs anything. No erb text needs to change.

## 8. Verdict

**Revise** (light). The pass is good and should stand. It kept the whodunnit exactly as the design rounds
left it and fixed the two leaks they found. It removed 109 scripted player lines without losing a fact, and
gave five office voices that sounded alike five different ones. The structure changes are the re-entry
pattern and nothing else. M1 is one line that's wrong on a real route; the should-fix items are one-line swaps,
three of them repeats the pass meant to remove. After the edit, rerun tagdiff against the same snapshot (expect
one new difference, CR5a's assignment), dialoguelint, reopencheck and the matrix. Prose this size needs no new
playtest; a read of the turn ending on screen would confirm CR3.

Scratch output: `<scratchpad>/m05-scripted/` (`tagdiff.txt`, `lint.txt`, `reopen.txt`, `matrix.out`,
`json/`).
