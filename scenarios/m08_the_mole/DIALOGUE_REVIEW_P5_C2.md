# m08 The Mole: dialogue review, pass 5 cycle 2

Reviewer: fresh Opus, read-only, 2026-10-14. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission and the season finale, judged as a TV spy thriller turned inward. The traitor is one of the player's own colleagues, the deduction must not be handed over by a task title, toast or NPC, suspects should each be plausible and red herrings should cost something. The season's threads get paid off: the teacher line and Nightshade (`docs/agents/M08_PASS_BRIEF.md`). Inputs: `DIALOGUE_REVIEW_P5_C1.md`, the "Phase 4 dialogue, cycle 1" entry in `IMPROVEMENT_LOOP_LOG.md`, and the ink at commit `d99cd167` (nothing in the ink folder is uncommitted). The working tree's `scenario.json.erb` holds uncommitted room-dressing changes and the fixer's four text edits (HaX's first text, the clone text, Netherton's two voice styles), which I review below. Format follows `scenarios/m07_architects_gambit/DIALOGUE_REVIEW_P5_C2.md`.

I didn't open the SecGen XML or the four listed field guides. HaX's VM hints, the flag texts and the debrief's box line (`m08_closing_debrief.ink:171`, now covering the sudo rule) are judged as writing only. Whether they match the VM **needs checking against SecGen by the user** (U1 and its addendum 3 in `DECISIONS_PENDING.md`, unchanged).

Finding ids are `D8C2-n`, tagged **blocker / major / minor**. m08 has 4 cached clips, so re-voicing costs next to nothing; the fixer should still keep the old → new list. Erb line numbers are from the working tree and will drift while room dressing edits the file. Re-read each region before an Edit.

**Snapshot for the next `tagdiff --old`:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m08-dialogue-reviewer-c2/snapshot/ink/` (twelve `.ink`, twelve `.json`, taken at `d99cd167`). Route transcripts: `…/m08-dialogue-reviewer-c2/routes/`. `runs.py` and `play.js` are copied alongside.

## Step 1: compile, validator, lint, runtime

All run by me, into `…/scratchpad/m08-dialogue-reviewer-c2/`.

- **Compile to scratch.** `bin/inklecate` on all twelve files: no errors, no loose ends. Every scratch JSON matches the committed JSON, so the routes test exactly this ink.
- **Routes, all 25** (`route.js`, transcripts in `routes/`): every one ends `[result] all expectations met`. Longest run without a choice (`runs.py`): 9 for the briefing, Netherton's opening, the confrontation (r25, the triple agent's close) and the debrief (r10). Suspects 5, HaX in person 4. Most choices at once: Netherton 9 (r11), Nightshade, Cipher and the confrontation 7.
- **dialoguelint:** 0 errors, 0 warnings, 0 checks. The three `voiced-variable` ALLOWED on `{suite_code}` are the constant, as in cycle 1. blank-reentry is 8 → 0. **Tool gap (not a dialogue finding):** the lint's speaker regex (`dialoguelint.mjs:128`, `[A-Z][\w.'’()]*`) has no hyphen, so `Off-Duty Agent:` never matches. His file reports `lines=0` and none of his lines are measured or rule-checked. I read his file by hand (nothing over 22 words, every exit has a reply). It's a shared tool, so the fix is for the orchestrator.
- **tagdiff against HEAD:** structure unchanged in all twelve files. **tagdiff `--old` against the cycle-1 snapshot**, file by file: HaX in person 50, off-duty 23, analyst 18, debrief 12, Netherton 90, confrontation 8, briefing 0, phone 4, ATHENA 26, Cipher 51, Nightshade 46, Phantom 51. I read every file's diff against the log. Each difference maps to a logged change: the `hub_quiet`/`back` rewiring, `return_visit` removed, the new VARs (`told_her`, `told_fate`, `after_quiet`, `met` for the analyst and ATHENA, `netherton_hostile` and `nightshade_triple_agent` declared), the D8-16 and D8-22 conditions, `conduct_beat`, and the branches for D8-3, D8-7, D8-11, D8-15, D8-19, D8-20 and D8-23.
- **reopencheck:** m08 phone 1800 reopens, 1166 re-runs, 0 problems; all missions 0.
- **loopcheck** (200 steps × 6 strategies) on 17 states the fixer didn't list. HaX after the fate (triple), and named with the go-bag lining. The off-duty agent from `on_locker_picked` with an accusation, and on a post-naming re-talk. The analyst and ATHENA on re-talk. Netherton with flag 4, the audit and a confirmed row; with the audit closed and the tip-off; and named with all three interviewed. Cipher accused and named with every topic open; Cipher accused before the evidence. Phantom accused and named with the lead and the audit. Nightshade accused, profiled and named with flag 4. The confrontation reopened after a triple fate, and opened with the Director hostile, a locker tidy and the print. The debrief with an accusation, an analyst KO, a misread, an instinct and a hostile Director. HaX's phone named with the card cloned and the chain in. No runtime errors, no runaways.
- **Validator** (`--skip-ink --no-graph`): schema passes, layout and doors OK. The 20 notes are the known ones (seven onceOnly `brief_taken` handlers, cutscene backgrounds, the interrogation-room cutscene's onceOnly, the shared ATHENA/analyst sheet, the all-conditional credits sections). Nothing dialogue-facing.
- **UK English and the user's writing rules** over every changed line and the four erb edits: no banned words, no US spellings, no em dashes. The one double hyphen left is Cipher's stammer (`m08_suspect_cipher.ink:160`), kept on purpose.

## Confirmation of cycle 1 (D8-1 to D8-25)

All 25 are closed in the ink and erb. I checked each against the line, not the log. Where the fixer departed from the review, my judgement is in the last column.

| # | Status | Where it now lives | Judgement on any departure |
|---|---|---|---|
| D8-1 | closed | `m08_suspect_nightshade.ink:95`, `:97`, `:124` | All three now pass the test "could an innocent man say this?". "Tidy isn't the same as right" also sets up the confrontation's "So I tidied", which is a good echo. The fixer's own wording for `:124` ("Whichever way it points, it'll be worth more than a guess") reads better than the review's. It does leave "proof" twice in a row with the leave line (D8C2-5) |
| D8-2 | closed | all eight person-chats: `back` knot, greeting under `{ not hub_quiet: }` at the top of `hub`; Netherton `:105-113`, Cipher `:184-192`, Phantom `:51-59`, Nightshade `:52-56`, HaX `:41-45`, off-duty `:157-161`, analyst `:202-206`, ATHENA `:237-241` | Routing exits through `back` was the right call. Under the review's version every goodbye would have ended on a greeting. I traced it: an exit leaves `hub_quiet` false at rest, so the next reopen greets, and a topic's return never does. r24 confirms both on screen-equivalent output. Two greetings now read wrongly in some states (D8C2-1, D8C2-2), and two post-naming greetings repeat the leave line (D8C2-3, D8C2-4) |
| D8-3 | closed | `m08_agent_0x99.ink:47-49`, `:56`, `:72-73`, `:78-80` | As proposed. "He stood next to me at the Portland debrief and handed me a tissue." is the best new line this cycle. "[It's done.]" can't be reached in play (see "Notes, not counted") |
| D8-4 | closed | `m08_closing_debrief.ink:61-63` | Two `Agent HaX:` lines, as proposed. Merging the corridor and the Director into one narrator line kept the run at 9, but the merged sentence has a dangling modifier and puts the text after the Director has arrived (D8C2-8) |
| D8-5 | closed | `m08_opening_briefing.ink:280`, `:282`; run 9 on every route | As proposed. The PIN-cracker line (`:274`) untouched |
| D8-6 | closed | erb HaX first text (working tree) | As proposed |
| D8-7 | closed | `m08_background_agent.ink:172-174` | Dropping the leading "And" was right, because the line can open his answer. The joke works: he says it to the person he caught |
| D8-8 | closed | `m08_nightshade_confrontation.ink:71`, `:73`, `:76`, `:102` | As proposed |
| D8-9 | closed | pause cut; `after_quiet` `:244-256` | Declining the coordinates merge was right: as I wrote it, it saved nothing. The `after_quiet` latch works: the walk-out ends on "Then you go.", and a reopen or a page reload prints "Go on…" (traced; r25) |
| D8-10 | closed | `:164`, `:168` | As proposed. The new `:168` now sits beside an untouched `:170` that gives a second, different motive (D8C2-7) |
| D8-11 | closed | `:60`, `:193`, `:236-237` | As proposed |
| D8-12 | closed | `m08_director_netherton.ink:168-171` (no pause) | As proposed |
| D8-13 | closed | `:420`, `:430` | As proposed |
| D8-14 | closed | Netherton `:157`, phone `:264` | As proposed |
| D8-15 | closed | Cipher `:310-311`, Phantom `:152-153` | The lines are the review's. Together with the fixer's new post-naming greetings, they make each visit say the same thing twice (D8C2-3, D8C2-4) |
| D8-16 | closed | Nightshade `:114`, Cipher `:253`, Phantom `:124` | As proposed |
| D8-17 | closed | Nightshade `:84` | The shorter wording clears the choice cap and still fits his reply. r6 updated |
| D8-18 | closed | debrief `:119-121`, `:160-165` | As proposed. The worst state I played (accused, locker, misread, owned) runs 8 / 5 / 4 / 4 |
| D8-19 | closed | `:129`, `:145-147` | As proposed. "So will the file" adds a third "file" in one speech (D8C2-9) |
| D8-20 | closed | `:236` | Keeping "pointing it at the rest of us" is better than the review's cut |
| D8-21 | closed | `:171` | The 28-word version, which keeps r1. **Needs checking against SecGen by the user** (U1, addendum 3) |
| D8-22 | closed | phone `:75`, `:145` | As proposed |
| D8-23 | closed | erb clone text (working tree); phone `:95-97` | Gating it on `netherton_card_cloned` was right (a printer or KO route never cloned anything). "You" for "your intake" is correct: Nightshade said it in the player's m03 briefing (`m03_opening_briefing.ink:173`) |
| D8-24 | closed | erb `:1165`, `:1345` | Both now open on the identity part m02-m06 use word for word |
| D8-25 | closed | Nightshade `:76`, Cipher `:230` | As proposed |

## Severity table

Counts: **0 blockers, 0 majors, 10 minors** (two of them optional). Nothing blocks play and nothing breaks a promise. Eight are wording. D8C2-1 and D8C2-2 add a branch to a greeting, and D8C2-10 (optional) adds a once-flag.

### Minors: re-talk greetings (the new hub_quiet lines)

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8C2-1 | minor | `m08_director_netherton.ink:107-108` | The flag-4 nudge is a fixed line, so it repeats on every re-talk between flag 4 and the naming: "You've been in the logs. I can see it on you." can come up three or four times while the player works out the audit. The other greetings cycle; this one doesn't. | Make it a stopping sequence: `Director Magnus Netherton: {You've been in the logs. I can see it on you. A terminal and a time is not a man. Read me the door.\|The door, Agent. Read it to me when you can.}`. r24's assertion (first re-talk) still holds. |
| D8C2-2 | minor | `m08_suspect_cipher.ink:185-190` | Straight after an accusation, the cycle can give Cipher his cheerful return line: r24's third Cipher visit opens "Back. Still boring, I promise." to the agent who has just called him a traitor. He had told them to "come back and say sorry, or come back with cuffs" (`:298`). | Add a branch before `- else:` → `- accused_cipher and not apologised: Agent 0x23 'Cipher': You again. Sorry, or cuffs?`. Phantom's two lines both survive an accusation, so he needs nothing. |
| D8C2-3 | minor | `m08_suspect_cipher.ink:187`, `:311` | A post-naming visit to a never-accused Cipher says the same thing at both ends: "You again. I hear it's over. I'm still doing the maths on how I feel about that." then, on leaving, "I heard. Good. Back to the maths." That's "heard" twice and "the maths" twice in two lines (r25). | Keep the greeting. `:311` → `Agent 0x23 'Cipher': Go on. I've a key schedule that won't finish itself.` r25's `said "I heard. Good. Back to the maths."` changes to "a key schedule that won't finish itself". |
| D8C2-4 | minor | `m08_suspect_phantom.ink:54`, `:148`, `:153` | Phantom after the naming is the same fault. He greets with "So the hunt's over, and you came back anyway. Sit." and leaves with "So it's done, and not by me." (r25): two "So" openers carrying one fact. If he was accused, the leave line is "So the logs got there." | `:54` → `Agent 0x88 'Phantom': The hunt's over, I hear, and you came back anyway. Sit.` `:153` → `Agent 0x88 'Phantom': Not my collar, then. Tell the Director I was right to look.` Leave `:148` as it is. r25's two `said` strings change to "The hunt's over, I hear" and "Not my collar, then". |

### Minors: Nightshade in the lab

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8C2-5 | minor | `m08_suspect_nightshade.ink:124`, `:129` | After the accusation, the scene ends "Go and get your proof. Whichever way it points, it'll be worth more than a guess." The leave line is then "Bring proof next time. It's the only thing worth bringing.": proof twice and "worth" twice in a row (r24). | `:129` → `Agent 0x47 'Nightshade': Close the door gently. The whole floor's listening now.` It's double-edged, because an innocent man knows gossip travels as well as a guilty one. It also pays off the tip-off text the player has just had. r24's `said "Bring proof next time"` changes to "The whole floor's listening now". |
| D8C2-6 | minor (optional) | `m08_suspect_nightshade.ink:121` | "I know which one you're running on. It isn't evidence yet." The "yet" says evidence is coming. With "nothing I'm afraid of" two lines later and the new "Whichever way it points", the four-line scene has two winks where the voice bible allows one. Cycle 1 didn't flag it, and it predates this pass. | `…I know you, and I know which one you're running on. It isn't evidence.` |

### Minors: the confrontation

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8C2-7 | minor | `m08_nightshade_confrontation.ink:168`, `:170` | The D8-10 rewrite changed his reason for staying ("Because a man who runs has confessed. I preferred to make you prove it."). The next line, kept from the old version, gives a different one: "Montana was always where I was going. I just wanted to see your face first." The old pair ("I wanted to see who they would send … see your face first") agreed with each other. The new pair doesn't. | `:170` → `Agent 0x47 'Nightshade': You have the coordinates now. Montana was always where I was going. It seems you'll get there first.` No route quotes it. |

### Minors: the debrief

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8C2-8 | minor | `m08_closing_debrief.ink:61` | The D8-4 merge reads "Netherton finds you in the corridor, looking older than he did at the briefing a few hours ago. Your phone buzzes once. HaX." The participle has nothing to attach to: it reads as if *you* look older. It also makes the player read a text with the Director standing in front of them. | `Narrator: Netherton finds you in the corridor. He looks older than he did at the briefing a few hours ago. Your phone buzzes once: HaX.` It is still one line, so the run stays 9. r1, r2, r7 and r25 keep "Your phone buzzes once". |
| D8C2-9 | minor | `m08_closing_debrief.ink:100`, `:103`, `:129`, `:171` | The D8-19 fix leaves "file" three times in one speech when the player accused someone and misread the audit: "It is in the file now…", "That goes in the file beside everything else", "I noticed, and so will the file." `:103` "That goes in…" also returns at `:171` "That goes in my report too." (played: accused, locker, misread). | `:129` → `Director Magnus Netherton: Not on the first reading. I noticed.` `:171` → `…and a sudo rule that handed you the rest. That will be in my report as well.` r2 keeps "Not on the first reading". r1 keeps "history for anyone patient". |

### Minors: HaX on the phone

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8C2-10 | minor (optional) | `m08_phone_agent_0x99.ink:91-100` | "[It's really Nightshade.]" is sticky and has no once-flag, so each ask replays the whole reply. That now includes the new badge line ("He told you once it'd be our badge somebody clones…"), which works once and reads as a tic the second time. The other sticky phone topics are status questions, whose answers change; this one never does. | `+ { mole_identified and not fate_decided and not asked_really } [It's really Nightshade.]` with `~ asked_really = true` (new local `VAR asked_really = false`). The hub still has its sticky exit, so no knot starves. r25 asks it once. |

## Notes, not counted

- **"[It's done.]" (D8-3) and the post-fate suspect lines can't be reached in play.** Every route to the fate has the whole chain in, because Nightshade only moves to the suite once it is, and the safety-net KO happens in the suite. The debrief then starts on `conversation_closed:nightshade_confrontation` or on the next room entered (erb `:1268-1280`). HaX's "[It's done.]", and Cipher's and Phantom's "Go and finish it" after the fate, are reachable only with globals set by hand (r25). They're harmless. I'd leave them as insurance against a future change to the debrief trigger rather than cut them.
- **ATHENA's "What have you seen tonight?"** still offers "the calmest person in a frightened building" after the naming. It was kept on purpose in alignment (log `:48`), and after the naming it reads as told-you-so, which suits her.
- **Nightshade's "genuinely"** comes three times in the lab (`:59`, `:87`, `:111`), twice as "I'd genuinely encourage it". The voice bible gives him the habit, and the repeat at the locker key is pointed. I leave it.
- **The four erb text edits** are clean. HaX's first text no longer repeats ATHENA, and "whichever of the three it is" fixes the misreading. The clone text is now just the instruction. Netherton's two styles open on the canonical identity part, matching m02-m06 (erb `:1165`, `:1345`).

## Fresh review: what the brief asked about

**The hub_quiet greetings.** Each prints once per visit. Traced in all eight files and shown by r24:
- no greeting after a topic, because every topic returns through `back`;
- no greeting at the end of a goodbye, because the exit diverts through `back` after `#exit_conversation`;
- a greeting on every reopen and every page reload, because `hub_quiet` rests at false and each `start` guard goes straight to `hub`.

None of them gives away the deduction. Netherton's flag-4 line asks for a reading ("A terminal and a time is not a man. Read me the door."). Cipher's and Phantom's post-naming lines say "it's over" without a name, which agrees with the off-duty agent's "Nobody's said for who". Nightshade's "Still here, as promised. Ask." is the right temperature. Faults: D8C2-1 to D8C2-4.

**The deflected Nightshade lines.** Still double-edged, not a confession. "A sealed file makes a very tidy suspect. Tidy isn't the same as right." is the best of the three: it argues his own innocence in words that turn round once he is caught. The alibi beat, "You've proved I keep long hours, 0x00. Bring me the account." (`:105`), is still the right length of rope. D8C2-6 is the one wink left.

**HaX's post-naming beats.** In person she now moves with the story. "Worse, now I know which face. He stood next to me at the Portland debrief and handed me a tissue. / Ask me tomorrow." is HaX exactly: a fact, a crack, then work. On the phone, the moved m03 badge line lands better after the naming than it did before. "Same classroom, 0x00. Don't ask me whose yet." is now in her voice. My only HaX finding is D8C2-10, and it is optional.

**The debrief conduct beat.** It works. "[It was wrong, sir.]" / "It was. Now the case." and "[It was the job, sir.]" / "Some of it. Not all of it. Now the case." give the player a stance in the middle of the charge sheet without letting them off. Netherton's reply is the same length either way, which is right for a man who won't be talked round. "Now the case." is a clean hinge into the reading lines.

**Repetition from merges.** D8C2-3, D8C2-4, D8C2-5 and D8C2-9. The briefing and confrontation merges are clean.

**Voice.** Every new line is in character:
- Netherton's "Agent. Go on." is the right weight;
- Phantom's "You again. Sit. Tell me something I don't know." is charm used as a door;
- Cipher's "Back. Still boring, I promise." is him exactly, outside D8C2-2's state;
- the analyst's "Still reading the same paragraph" and ATHENA's "Reception. Still discreet." are small and right.

## Best and worst lines

**Five best (new or changed this cycle)**

1. `m08_agent_0x99.ink:48`, HaX: "Worse, now I know which face. He stood next to me at the Portland debrief and handed me a tissue."
2. `m08_suspect_nightshade.ink:97`, Nightshade: "A sealed file makes a very tidy suspect. Tidy isn't the same as right."
3. `m08_nightshade_confrontation.ink:168`, Nightshade: "Because a man who runs has confessed. I preferred to make you prove it."
4. `m08_closing_debrief.ink:164`, Netherton: "Some of it. Not all of it. Now the case."
5. `m08_background_agent.ink:173`, off-duty agent: "Somebody's been at the lockers in here. I've told everyone I didn't see who. Very convincingly."

Still the mission's best, untouched: "Every word I taught you was true. I just never said where I'd learned it." (`m08_nightshade_confrontation.ink:163`) and "Two of ours are dead in the space between what I knew and what I did." (`m08_closing_debrief.ink:77`).

**Five worst**

1. `m08_suspect_cipher.ink:189`, Cipher, straight after being accused: "Back. Still boring, I promise." (D8C2-2)
2. `m08_closing_debrief.ink:61`, the narrator: "Netherton finds you in the corridor, looking older than…" (D8C2-8)
3. `m08_nightshade_confrontation.ink:170`, after his new reason: "I just wanted to see your face first." (D8C2-7)
4. `m08_suspect_phantom.ink:153`, after "So the hunt's over": "So it's done, and not by me." (D8C2-4)
5. `m08_suspect_nightshade.ink:129`, after "Go and get your proof": "Bring proof next time." (D8C2-5)

## Route quotes a fix would break

| Fix | Route | Assertion |
|---|---|---|
| D8C2-1 | r24 | none break: the first re-talk still prints "A terminal and a time is not a man. Read me the door." |
| D8C2-3 | r25 | `said "I heard. Good. Back to the maths."` → "a key schedule that won't finish itself" |
| D8C2-4 | r25 | `said "So it's done, and not by me"` → "Not my collar, then"; `said "So the hunt's over, and you came back anyway"` → "The hunt's over, I hear" |
| D8C2-5 | r24 | `said "Bring proof next time"` → "The whole floor's listening now" |
| D8C2-8 | r1, r2, r7, r25 | none break: "Your phone buzzes once" is kept |
| D8C2-9 | r1, r2 | none break: "Not on the first reading" and "history for anyone patient" are kept |
| D8C2-2, -6, -7, -10 | — | no route quotes the lines. Add `said "Sorry, or cuffs?"` to r24's post-accusation Cipher visit |

## Verdict

**Another full review cycle isn't needed.** This cycle found nothing above minor: 0 blockers, 0 majors, 10 minors, two of them optional. AGENTS.md says to stop a design-heavy stage once a cycle finds nothing above minor. All four of cycle 1's majors are properly closed. The fixer's three departures (exits through `back`, the `after_quiet` latch, the shared narrator line) were all sound, and each cost only a small slip, logged here.

Recommended close:
1. A fixer pass for the ten minors. Each is a line or a one-branch change.
2. The routes updated as listed, then the routes, lint, loopcheck and tagdiff re-run.
3. A short confirmation read of just those lines, not a full cycle.
4. The browser items already owed from cycle 1:
   - each person-chat's return line on screen once, with none after a goodbye or a topic;
   - the Director's flag-4 nudge on a re-talk;
   - the conduct beat;
   - HaX's two `Agent HaX:` lines in the debrief in her voice and portrait;
   - the confrontation's walk-out ending on "Then you go." and its reopen line.

Two items for the orchestrator, not the dialogue fixer: the dialoguelint hyphen gap (`dialoguelint.mjs:128`, a shared tool), and the SecGen check on the debrief's box line (U1, addendum 3).

## Spoken lines this review would change

The old → new pairs are in the tables above: Netherton's nudge variant (D8C2-1), Cipher's accused greeting and post-naming leave (D8C2-2, -3), Phantom's post-naming greeting and leave (D8C2-4), Nightshade's accused leave and "yet" (D8C2-5, -6), the confrontation's Montana line (D8C2-7), the debrief's corridor narrator line and two Netherton lines (D8C2-8, -9). D8C2-10 changes a condition only. No erb text fields are touched.
