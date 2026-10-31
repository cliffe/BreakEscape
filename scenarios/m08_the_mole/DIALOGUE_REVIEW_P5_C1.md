> **Rename (2026-10-16):** Agent 0x23 'Cipher' is now 'Vector' (user's decision). Ids, globals, the ink file and routes were renamed with him (`agent_vector`, `accused_vector`, `vector_*`, `m08_suspect_vector.ink`). This file predates the rename and still says Cipher.

# m08 The Mole: dialogue review, pass 5 cycle 1

Reviewer: fresh Opus, read-only, 2026-10-14. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission and the season finale, judged as a TV spy thriller turned inward. The traitor is one of the player's own colleagues. Deduction must not be handed over by a task title, toast or NPC. Suspects should each be plausible, and red herrings should cost something. The season's threads get paid off: the teacher line, Nightshade (`docs/agents/M08_PASS_BRIEF.md`). Format and depth follow `scenarios/m07_architects_gambit/DIALOGUE_REVIEW_P5_C1.md`. Alignment, puzzle chains and scenario design are closed, and I don't reopen their decisions unless a line has gone wrong.

Items handed to this stage, each answered below:
- the off-duty agent's missing locker gossip (`PUZZLE_REVIEW_P5_C2.md:182`): D8-7;
- the 11-line opening cutscene (log `:142`, every later round): D8-5;
- the eight `blank-reentry` CHECKs (log `:142`, every later round): D8-2, confirmed real;
- the three scripted `You:` lines in the confrontation (`DESIGN_REVIEW.md:230`): **closed**, none left in the ink;
- Netherton's reason for not handing over his card (`DESIGN_REREVIEW_1.md:106`): **closed**, `m08_director_netherton.ink:193` now reads "a hand-over is paperwork";
- "Nightshade in every briefing" (`DESIGN_REVIEW.md:185`): **closed**, `:124` "He has stood beside me at most of your briefings";
- regression item 13, "placed by ENTROPY during training" (log `:29`): **closed**, the credits (erb `:176`) now match his own account (`m08_nightshade_confrontation.ink:148-150`);
- the lines alignment C1 said would depend on Option B (`ALIGNMENT_REVIEW_P5_C1.md:56-60`): the HaX hub and `asked_logs` are re-checked in D8-17. "My account, my terminal, my mail." stays, because it is his own confession.

I didn't open the SecGen XML or the four listed field guides. HaX's VM hints, the flag texts and the debrief's box line are judged as writing only. Anything they claim about the VM **needs checking against SecGen by the user** (already U1 in `DECISIONS_PENDING.md`). Two findings add to it: D8-17 (whose account the box shows) and D8-21.

m08 has 4 cached clips (`tts_cache/m08_the_mole`, commit `295b3fdf`), so re-voicing costs almost nothing. The fixer should still keep the old → new list.

**Snapshot for `tagdiff --old`:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m08-dialogue-reviewer-c1/snapshot/ink/` (twelve `.ink` and twelve `.json`), taken at commit `f9b11416` with nothing uncommitted in the m08 ink folder. The route transcripts for all 23 routes are in `…/m08-dialogue-reviewer-c1/routes/`. The run counter is `…/runs.py`, and `…/play.js` plays one ink file from a knot with given variables.

Finding ids are `D8-n`, tagged **blocker / major / minor**. Every fix is mission-local: the ink, or the erb's text fields. A room-dressing agent may be editing `scenario.json.erb`, so erb line numbers will drift. The fixer re-reads any erb region before an Edit.

## Step 1: compile, lint, runtime

- **Compile.** All twelve files compile with 0 failures. The compiled JSON matches the committed JSON (`git status` is clean for the ink folder), so the routes test exactly this ink.
- **Voices.** Every speaking NPC has a voice block that names its accent and says "consistent … throughout":
  - narrator: RP, Algenib;
  - ATHENA, briefing and console: RP, Kore (the same character);
  - HaX, phone and in person: RP, Aoede, with the identity part word for word from the voice bible;
  - Netherton, office and debrief: RP, Charon;
  - Nightshade, lab and confrontation: RP, Enceladus;
  - Cipher: Glasgow, Iapetus;
  - Phantom: light educated Ghanaian, Fenrir;
  - junior analyst: Leicester British-Indian, Vindemiatrix;
  - off-duty agent: Geordie, Puck.

  No two characters share a voice name. Netherton's identity part isn't the canonical text (D8-24, optional).
- **dialoguelint:** 0 errors, 0 warnings. `blank-reentry` ×8: all eight are real (D8-2). `voiced-variable` ×3 on `{suite_code}` are ALLOWED: it is a constant (`erb:110`, "5386"), so the cache key never changes. The longest line is 30 words (the briefing). Timed texts: 37, median 27 words, maximum 30. Three double hyphens in the ink: D8-14.
- **tagdiff** against HEAD: structure unchanged in all twelve files.
- **reopencheck:** HaX's phone ink, 1800 reopens, 0 problems. `hax_read_1` holds back one line, as intended.
- **Routes:** all 23 (`route.js <file>`) end `[result] all expectations met`.
- **loopcheck** (200 steps × 6 strategies) on every NPC's `currentKnot` under 21 state sets:
  - the briefing;
  - Netherton fresh, mid-check with the box, and with both lab witnesses down;
  - HaX phone fresh, KO'd Director with the audit and a clock, and named with the VM steps open;
  - HaX in person fresh, and named with the go-bag known;
  - the off-duty agent at `start` (accused) and at `on_locker_picked`;
  - the analyst; ATHENA;
  - Cipher with the audit and the box, and accused with the audit;
  - Phantom with the lead and the audit;
  - Nightshade named with the profile and the box;
  - the confrontation tidied, accused and printed, and with the Director and Nightshade KO'd;
  - the debrief as a triple agent, and with every conduct and KO flag set.

  No runtime errors, no runaways.
- **UK English:** clean (grep for US spellings). No banned words.
- **Longest run without a choice**, worst case over the 23 route transcripts (`runs.py`), plus a hand-built worst state where the routes don't reach one:

| Conversation | Longest run | Where | Target ≤ 9 |
|---|---|---|---|
| briefing | **11** (every route) | ATHENA's whole cutscene | fails by two (D8-5) |
| confrontation, opening | **10** (r4); 11 reachable | the room, the account, why he didn't scrub it, KO line, door log, two tidy lines, the print | fails (D8-8) |
| confrontation, ending | **11** (r2) | triple agent: pause, three lines, the volunteered coordinates, the entry, the teacher line, the walk-out | fails (D8-9) |
| debrief | 8 on the routes; **14** reachable | `the_hunt`: every conduct line stacked (`play.js`, all conduct flags set) | fails on a bad route (D8-18) |
| Netherton | 9 (r10) | the opening | passes |
| Nightshade, Cipher, Phantom, off-duty | 5 | the accusations, the testimony | pass |
| HaX in person | 3 | | passes |
| HaX phone | 3 | | passes |

- **Most choices at once:** Netherton 9 (r11), Cipher 8, the confrontation hub 7, the phone hub 6 on the routes. By reading the hub conditions, the phone can't pass 8. Every hub is within 9.

## Severity table

Counts: **0 blockers, 4 majors, 21 minors.** Nothing blocks play. The majors are a mole who confesses in his interview, re-talks that never get their return lines, HaX's in-person scene going stale after the naming, and the season's teacher-line payoff read in the wrong voice.

### Majors

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8-1 | major | `m08_suspect_nightshade.ink:86`, `:88`, `:114` | **Nightshade confesses before the evidence.** The ink's own header says an early accusation gets "a graceful, chilling deflection -- never a confession" (`:6-7`). Three lines cross that line. (1) Okafor's evaluation is in the Director's safe, which opens on a service number from minute one, and it gets "Then you know Okafor was right" (`:86`). (2) The same topic ends "You're close to something now. Closer than is comfortable for either of us." (`:88`). An innocent man has no stake in "either of us". (3) The accusation ends "I'd rather you found me than guessed me." (`:114`). "Found me" admits there is something to find. Together they hand over the name before the door audit is read, which the brief rules out ("not … by an NPC"). The double-edged lines are allowed and good: "I could teach it to you, though I don't think we'll have the time." (`:58`), "Don't rule anyone out because they wrote the list." (`:72`). The voice bible's rule is one double-edged line, never a wink. | `:86` → `Agent 0x47 'Nightshade': You've been in the Director's safe. Good. Then you've read Okafor, and you know he buried it.` `:88` → `Agent 0x47 'Nightshade': Careful, 0x00. A sealed file makes a very tidy suspect. Tidy isn't the same as right.` (This echoes Cipher's "the easy target", `m08_suspect_cipher.ink:146`.) `:114` → `Agent 0x47 'Nightshade': Go and get your proof. Whichever way it points, I'd rather it was proof.` (keep both tags). The confrontation's payoff, "I'd rather you found me" logic, now lands only after the reveal: "Because some part of me wanted to be caught…" (`m08_nightshade_confrontation.ink:72`). No route asserts any of the three. |
| D8-2 | major | `m08_director_netherton.ink:97-103`; `m08_suspect_cipher.ink:33-36`; `m08_suspect_phantom.ink:197-200`; `m08_suspect_nightshade.ink:35-38`; `m08_background_agent.ink:108-110`; `m08_agent_0x99.ink:28-30`; lint lines in each file, plus `m08_background_analyst.ink:15`, `m08_receptionist_ai.ink:29` | **Re-talks never print their return lines.** All eight `blank-reentry` CHECKs are real. Every person-chat here parks at `hub`. A reopen restores the story and re-navigates to the knot that owns the first choice (`person-chat-minigame.js:520-536`), so it lands on `hub`, not `start`. These lines then play only after a page reload: Netherton's `return_visit`, Cipher's "You again. Come to cross me off, or add me back on?", Phantom's "Back again…", Nightshade's "Back so soon…", the off-duty agent's and HaX's "Still here…". Netherton's loss matters most. His `return_visit` carries the mission's best in-person nudge after flag 4: "You've been in the logs. I can see it on you. A terminal and a time is not a man. Read me the door." (`:99`). What the player sees instead is the engine's fallback (E6, deferred), which re-shows the last line over the hub. After his sign-off that line is "Go. Whoever it is was one of us this morning. Bring me a name I can prove." The routes hide this: r2's later Netherton talks open straight onto "(8 options)", and r13 forces `"knot": "start"` to hear the off-duty agent's "Still here" (`r13…json:44-45`). The whole naming loop runs on re-talks: confirmations, locker keys, apologies, readings. So the suspects greet the player with a goodbye on most visits. | The m03 `hub_quiet` pattern (m07 D7-37), per file. Move each `start` re-entry branch to the top of `hub` as `{ not hub_quiet: … }` then `~ hub_quiet = false`. Send every in-conversation `-> hub` through `= back` (`~ hub_quiet = true` / `-> hub`). Set `hub_quiet = true` at the end of the first-meeting intro. New local `VAR hub_quiet = false` in each file. Netherton's hub top: `{ not hub_quiet: {found_access_logs and not mole_identified and not audit_closed: Director Magnus Netherton: You've been in the logs. I can see it on you. A terminal and a time is not a man. Read me the door.\|Director Magnus Netherton: Agent. What do you need?} }`. HaX in person and the off-duty agent sit in the same break room, so vary one of them: HaX `Agent HaX: {&Still here. The coffee's still cold.\|You came back. Sit, if you want.}`; off-duty `Off-Duty Agent: {&Still not reading this.\|Back again. People will talk.}`. The analyst and ATHENA need only one line each: `Junior Analyst: {&Still here. Still reading the same paragraph.\|Yes?}`; `ATHENA: {&Reception. Still discreet.\|Agent. How may I help?}`. Netherton's `done`, Cipher's and Phantom's `leave`, and the others' exits set `hub_quiet = false` before `#exit_conversation`, so the next visit greets. Re-run loopcheck; r13 drops `"knot": "start"` and keeps `said "Still"`. |
| D8-3 | major | `m08_agent_0x99.ink:33-58` | **HaX in person goes stale once he's named.** This is the finale's quiet scene with HaX, and the named route (r1) sends the player through the break room after the naming. Three things go wrong after `mole_identified`. (1) "How are you holding up?" still answers "I can't work out which face it was. And I'm frightened of the second I can." (`:36`). (2) "Who's your money on?" is still offered, and answers "Don't make me pick… Get me evidence." (`:45-46`). (3) "It's Nightshade." is sticky with no guard, so a second ask replays "She doesn't answer for a long moment." (`:54-58`). After the confrontation she has nothing at all for the outcome, though "Any advice for the room?" retires on `fate_decided`. | (1) `:34-36` → `{ mole_identified: Agent HaX: Worse, now I know which face. He stood next to me at the Portland debrief and handed me a tissue. / Agent HaX: Ask me tomorrow. \| (the three existing lines) }`. (2) `:38` → `+ { not mole_identified } [Who's your money on?]`. (3) `:54` → `+ { mole_identified and not told_her } [It's Nightshade.]` with `~ told_her = true` (new local). (4) New, after it: `+ { fate_decided and not told_fate } [It's done.]` / `~ told_fate = true` / `Agent HaX: {nightshade_triple_agent: You kept him. Then I'll be the one reading every word he sends us.\|Good. I'll visit him once. Then never again.}`. Declare `VAR nightshade_triple_agent = false // Synced scenario global`. No route asserts any of these lines. |
| D8-4 | major | `m08_closing_debrief.ink:57-59` | **The season's teacher-line payoff is read by the narrator.** HaX's "Same classroom" text, the line the teacher thread from m07 lands on, is one `Narrator:` line of 40 words. The narrator voice (Algenib) reads HaX's words in quotation marks: "HaX: "He said it to you? 'Afterwards, not during.' I was taught that line, and I say it to every agent I run. Same classroom, 0x00. Don't ask me whose yet."" Moving it off the phone (round 1 browser N2) was right. Putting it in the narrator's mouth costs her voice at the one moment it counts. | `:58` becomes three lines: `Narrator: Your phone buzzes once in the corridor. HaX.` / `Agent HaX: He said it to you? Afterwards, not during. I was taught that line, and I say it to every agent I run.` / `Agent HaX: Same classroom, 0x00. Don't ask me whose yet.` The `Agent HaX:` prefix resolves to `agent_0x99`'s displayName and voice, as HaX's lines do in m07's debrief. The run before the stance choice becomes at most 9 (r10 had 8). r1, r2 and r7 keep their quotes: "Your phone buzzes once" and "Same classroom, 0x00". |

### Minors: the opening and the first contact

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8-5 | minor | `m08_opening_briefing.ink:11-28` | **Handed item.** The cutscene runs 11 lines on every route (a narrator line and ten from ATHENA). Two merges bring it to 9 and lose nothing the mission needs. "Planning access and years of practice" (`:26`) goes, because Netherton says "Planning access, like the other two" and all three suspects have years. | Merge `:22`+`:23` → `ATHENA: The leak came from inside this building. Director Netherton has three names, and one of them got two of your colleagues killed.` Merge `:25`+`:26` → `ATHENA: A word of advice, from the only voice here with no stake in the outcome. The moment they know you are hunting, they vanish. Be quiet. Be quick.` (29 words). Keep `:16` (the PIN-cracker plant) word for word. No route quotes either line. |
| D8-6 | minor | erb `:703` | HaX's first text comes 2.5 s after ATHENA's last line and repeats it: ATHENA says "The Director's office is north of this lobby", then HaX says "Director's office, north of the lobby." HaX's "one of the three is a friend of mine" also reads as only one of the three being a friend. In person she says "I've bled with all three" (`m08_agent_0x99.ink:34`), and her voice style means whichever one it is. | `"I'm on the wire. Get the Director's brief before you spook anyone. And 0x00... whichever of the three it is, it's a friend of mine."` (24 words). Re-read the erb region first. |
| D8-22 | minor | `m08_phone_agent_0x99.ink:75`, `:140-144` | The first call isn't progress-gated: a player who first opens the phone after the naming hears "a name I probably know". Separately, "[How do I get into the interrogation suite?]" stays on offer after the confrontation (gate `mole_identified` only), when the suite holds a man whose fate is entered. | `:75` → `Line's open. Same as Portland, except this time the target has a SAFETYNET lanyard and {mole_identified:a name I know\|a name I probably know}.` `:140` → `+ { mole_identified and not fate_decided } [How do I get into the interrogation suite?]`. |

### Minors: the off-duty agent, Netherton and the suspects

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8-7 | minor | `m08_background_agent.ink:133-143` | **Handed item** (`PUZZLE_REVIEW_P5_C2.md:182`). He promises "I'll be telling everyone I didn't see anything." (`:127`). His "[Heard anything new?]" gossips about accusations but never about the lockers. | In the `else` branch, after the accusation block: `{ locker_seen_picked: Off-Duty Agent: And somebody's been at the lockers in here. I've told everyone I didn't see who. Very convincingly. }`. `locker_seen_picked` is already declared (`:100`). |
| D8-12 | minor | `m08_director_netherton.ink:160-162` | In `name_forming`, only the Nightshade answer gets a beat ("Narrator: A long pause."). Cipher and Phantom get none, so the staging marks the right name before any evidence. | Cut `:162`. Netherton's "An instinct is not evidence." stands on its own. |
| D8-13 | minor | `m08_director_netherton.ink:413`, `:423` | On the intended route (named before the box, r1) he hedges, "That is a door, not an account. A man may sit in his own lab." He then puts a hand flat on the desk "as if the floor has moved", admits sealing the warning and gives the suite code. He doubts and believes in the same breath. "The card is in my safe" (`:423`) also comes straight after his own keycard was cloned, but it means the code card. | `:413` → `Director Magnus Netherton: A door is not an account, and a court will want both. Get me the account from the box.` `:423` → `Director Magnus Netherton: The code card is in my safe as well, with Dr Okafor's evaluation. Read hers before you face him.` No route quotes either line. |
| D8-14 | minor | `m08_director_netherton.ink:149`; `m08_phone_agent_0x99.ink:259` | Double hyphens where a full stop belongs (the user's dash rule): "Not for the file -- for me." and "Credentials in commit history -- classic, and exactly what he did." The guide line also says "he" while the hub says "Whoever's account it is" (`:162`). The guide is on offer before the naming. Cipher's "That's -- that's exactly…" (`m08_suspect_cipher.ink:146`) is a stammer, and stays. | `:149` → `Director Magnus Netherton: Already? Say it. Not for the file. For me. Who is your instinct pointing at?` `:259` → `Credentials in commit history. Classic. Read the log, then check the stash.` |
| D8-15 | minor | `m08_suspect_phantom.ink:302-303`; `m08_suspect_cipher.ink:161-162` | The leave lines don't know about the naming. A Phantom who was never accused still says "Go and get onto that repo. When the logs back me, tell the Director I was right to look." Cipher still says "You'll clear me on the evidence." | Phantom, before `- else:` → `- mole_identified: Agent 0x88 'Phantom': So it's done, and not by me. Tell the Director I was right to look.` Cipher, before `- else:` → `- mole_identified: Agent 0x23 'Cipher': I heard. Good. Back to the maths.` |
| D8-16 | minor | `m08_suspect_cipher.ink:105`, `:155-156`; `m08_suspect_phantom.ink:275`, `:296-297`; `m08_suspect_nightshade.ink:104` | The accusation stays on offer after it has been made. A second pick replays the whole scene ("He looks as if you have hit him…"). After an apology it also lands on `leave`'s `apologised` branch: Cipher says "And thank you. I mean that." to a man who has just accused him again. | `:105` → `+ { not mole_identified and not accused_cipher } [I think it's you, Cipher.]`. The same gate with `accused_phantom` (`:275`) and `accused_nightshade` (`:104`). No route accuses the same man twice. |
| D8-17 | minor | `m08_suspect_nightshade.ink:75` | The player's choice says "[The root logs have your account on the Portland plan. Forty-seven minutes.]", but nothing in the game says whose account it is. The access-log document shows `USER [REDACTED]` (erb `:1730`). HaX's flag-4 texts say "A terminal and a time, no face". Flag 2's "let's see whose account it really is" (erb `:719`) is never answered. If the VM's account name is his, the box names him, which Option B rules out. **Needs checking against SecGen by the user** (an addition to U1). | `[The root logs have a login on a Crypto Lab terminal, on the Portland plan. Forty-seven minutes.]` His reply (`:78-80`) still fits. The confrontation's "My account, my terminal, my mail." (`m08_nightshade_confrontation.ink:65`) stays: it is his confession. r6's pick changes from "The root logs have your account" to "The root logs have a login". |
| D8-23 | minor (optional) | erb `:1006` | The clone text names Nightshade before the naming, on every route: "You cloned the Director. Nightshade said it once: one day it'll be our badge somebody clones." It pays off m03 (`m03_opening_briefing.ink:173`). Before the reveal, though, it is HaX putting his name next to a betrayal, the "wink" the voice bible rules out. The payoff is stronger after the reveal. | Clone text: `"You cloned the Director. At the reader, emulate it from the cloner's Saved list."` Then in `m08_phone_agent_0x99.ink`, "[It's really Nightshade.]", after "He carried me two miles once.": `He told your intake one day it'd be our badge somebody clones. You cloned the Director's tonight.` No route asserts the clone text. |

### Minors: the confrontation

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8-8 | minor | `m08_nightshade_confrontation.ink:63-127` | The opening reaches 10 lines on r4 and 11 in a reachable state: KO'd or punched, named on evidence, accused and tidied, printed. That is the room, the account, the intercept, "why I didn't", two suspicion lines, the KO line, the door log, two tidy lines, then the print. | Merge `:66`+`:67` → `Agent 0x47 'Nightshade': The name they stripped off that intercept in the cable vault was mine. I could have scrubbed it years ago.` Start both branch lines with the question: `:69` → `…: You're wondering why I didn't. Because you'd already decided. I watched you do it, across my desk in the lab.`; `:72` → `…: You're wondering why I didn't. Some part of me wanted to be caught by someone who'd understand. I misjudged that, I think.` Merge `:98`+`:99` → `…: You said it to my face before you could prove it. So I tidied the bag and the stick. Not well enough, it seems.` The worst case becomes 9. Every route keeps "Not well enough, it seems". |
| D8-9 | minor | `m08_nightshade_confrontation.ink:204-243` | The triple-agent ending runs 10 lines to the exit, and 11 with `after_choice`'s line on r2. When the coordinates are volunteered it runs the pause, three lines, three coordinate lines, the entry, the teacher line and the walk-out. | Cut `:204` ("A long pause."; Netherton and the debrief already use the beat). Merge `:226`+`:227` → `Agent 0x47 'Nightshade': Tomb Gamma. Forty-seven point two-three-eight-two north, one-twelve point five-one-five-six west. An old Cold War bunker in Montana.` and keep "Everything they took from us went there, and so will you." as its own line. The worst case becomes 9. Keep `:237` word for word. |
| D8-10 | minor | `m08_nightshade_confrontation.ink:70`, `:161`, `:165` | "I wanted it to be you" three times in one scene: "Some part of me wanted it to be you who closed the loop. My student." (`:70`); "If anyone ever used it on me, I wanted it to be you." (`:161`); "I hoped it would be you." (`:165`). The first is the best, because it carries "My student". | `:161` → `Agent 0x47 'Nightshade': I'm glad it was my own lesson that caught me. Vanity, I know. It's the last one I've got.` `:165` → `Agent 0x47 'Nightshade': Because a man who runs has confessed. I preferred to make you prove it.` No route quotes these. |
| D8-11 | minor | `m08_nightshade_confrontation.ink:190`, `:231-235` | A Director who was punched and left standing (`netherton_hostile`, not KO'd) "won't talk to you again tonight". Here he still countersigns "before you've looked away". | Declare `VAR netherton_hostile = false // Synced scenario global`. `:190` → `{netherton_ko:the Director will countersign it when he is back on his feet\|{netherton_hostile:the Director, who will not see you tonight, countersigns whatever goes in\|the Director countersigns whatever goes in}}`. In `aftermath`, add `- netherton_hostile: Narrator: You type the entry. The countersignature arrives a minute later, from an office that won't open its door to you.` before `- else:`. |

### Minors: the debrief

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8-18 | minor | `m08_closing_debrief.ink:91-143` | `the_hunt` is a charge sheet with no player beat. With every conduct flag set (both accused, both struck, the locker catch, three KOs, a misread, an instinct and a tip-off), the run from the stance reply to the next choice is 14 lines (`play.js`). The routes reach 8. | After the conduct block (`:92-110`), only when any of it printed: `{ accused_cipher or accused_phantom or cipher_hostile or phantom_hostile or locker_seen_picked or offduty_agent_ko or analyst_ko or athena_ko: -> conduct_beat -> }`. Then `=== conduct_beat ===` / `+ [It was wrong, sir.]` → `Director Magnus Netherton: It was. Now the case.` / `+ [It was the job, sir.]` → `Director Magnus Netherton: Some of it. Not all of it. Now the case.` / `- ->->`. The worst case becomes 9, then 6. Routes that hit a conduct line need a pick for the beat: r2, r7, r8, r11, r13, r14, r15, r19, r20, r21, r22, r23. |
| D8-19 | minor | `m08_closing_debrief.ink:113`, `:118`, `:131-133` | "Lawyer" twice in two lines: "something I could put in front of a lawyer" and then "Not on the first reading. I noticed. So would a lawyer." The instinct branch says "Two good officers spent a night under a suspicion…" when the player named one man, and it stacks on the accusation lines when he was also accused. | `:118` → `Director Magnus Netherton: Not on the first reading. I noticed, and so will the file.` `:133` → `{ not (accused_cipher or accused_phantom): Director Magnus Netherton: {suspect_theory == "cipher":Cipher\|Phantom} spent a night under a suspicion he did not earn. Buy him a drink. The service won't. }`. r2 keeps "Not on the first re…". |
| D8-20 | minor | `m08_closing_debrief.ink:214` | "Tonight you turned it round." is the triple agent's line. Said to the player who handed him to the police, it misdescribes what they did. | `Director Magnus Netherton: They spent fifteen years making one of ours into a weapon. {nightshade_triple_agent:Tonight you turned it round. Now we find out who is holding it.\|Tonight you took it off them.}` |
| D8-21 | minor | `m08_closing_debrief.ink:149-150` | The brief asks the debrief to reflect the VM flags. The player's line and Netherton's reply cover flags 1 and 2 only: no password, credentials in the history. The credits carry all four. **The wording needs checking against SecGen by the user**, as for HaX's flag texts. | `:150` → `Director Magnus Netherton: And kept credentials in its history, and a sudo rule that handed you the rest. That goes in my report too.` (both phrases come from HaX's own texts, erb `:719`, `:727`). r1 keeps "history for anyone patient" only if that clause stays. Either keep it (`…in its history for anyone patient enough to read it, and a sudo rule that handed you the rest.`, 27 words) or update r1. |

### Minors: small text and voice fields

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D8-24 | minor (optional) | erb `:1165`, `:1343` | Netherton's style opens "Cinematic thriller." The voice bible's identity part is "SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried". Its words are all there but out of order. A change discards any m08 Netherton clips (at most 4 exist). | Both blocks: `SAFETYNET's director. Consistent British Received Pronunciation accent throughout -- do not shift to any other accent. Low, deliberate, unhurried. His own briefing was turned into a weapon; he does not raise his voice and he does not soften anything, and under the control is a cold fury that this came from inside his house.` Re-read the erb first. |
| D8-25 | minor | `m08_suspect_nightshade.ink:67`; `m08_suspect_cipher.ink:83` | The insider-briefing choice misquotes m05: "…the rules don't apply." against "…don't apply to them" (`m05_insider_trading_opening.ink:47`). Nightshade answers "Good. You were listening.", so the quote should be exact. "the battery hall" is "Battery Hall 1" in m04 (`m04_opening_briefing.ink:167`). | `[Your insider briefing. "The calm of someone who's decided the rules don't apply to them."]`; `[Cipher. Same handle as the ENTROPY operative in Battery Hall 1.]`. |

## Does it play like a TV spy thriller, and does the finale land?

Mostly yes. The best scenes are the best in m08's history. The confrontation is the season's strongest scene: a mole who argues like a teacher ("Order is a candle in a hurricane"), refuses to apologise for the act ("I'm not asking you to forgive the sum. I'm telling you I did it with my eyes open.") and closes on the teacher line, unexplained. Netherton's debrief opening, "Two of ours are dead in the space between what I knew and what I did.", is the right weight for a director who sealed the warning. The red herrings are people: Cipher's "you're meant to work out that you've been forgiven for something you didn't do" and Phantom's "three men staring at each other across a corridor" make the cost of a wrong accusation felt as well as counted.

It falls short in four places:

1. **The mole confesses in his interview** (D8-1). The door audit should make the case. "Then you know Okafor was right" makes it first.
2. **Re-talks greet the player with a goodbye** (D8-2). In a mission built on going back to the same four people, the return lines never play. Netherton's flag-4 nudge, the best of them, is lost.
3. **HaX's quiet scene doesn't move with the story** (D8-3). After the naming she still can't work out which face it was, and after the confrontation she has nothing to say about the outcome.
4. **The teacher-line payoff goes to the wrong voice** (D8-4). "Same classroom, 0x00. Don't ask me whose yet." is the season's last hook, and the narrator reads it.

### Deduction: does any line hand it over?

Only D8-1. The rest holds up when checked line by line:
- Netherton's check asks for a reading, never a name (`audit_c1`-`c4`), and his wrong-answer replies teach the method ("Read the door against the minute, not the man").
- HaX's ladder checks the step, not the answer (`m08_phone_agent_0x99.ink:105-129`).
- The KO texts are neutral before the naming (erb `:876`).
- The off-duty agent points at Cipher, and gets it wrong in a way the audit explains.
- Phantom's notes say "Doors tell you who was in a room, not whose account".

Netherton's narrator pause (D8-12) and the clone text (D8-23) are small tells worth removing. ATHENA's "the calmest person in a frightened building" and "Nightshade's the same as ever" were kept on purpose in alignment (log `:48`) and I leave them: each is a character reading the room, and Phantom gets an equal pointer.

### Nightshade: a fifteen-year colleague and the teacher line

This works. The fifteen years appear in three places:
- the confrontation: "the barracks you slept in years later", and "I walked past that reader every morning for fifteen years and never once thought of it as a witness";
- the debrief: "His own, fifteen years ago";
- HaX: "He's had fifteen years to polish it".

The teacher line is his last spoken words (`:237`). HaX then gives it a lineage in the debrief ("I was taught that line… Same classroom"), and Netherton refuses to name the teacher (`:192-193`). Once per mission, never explained, as the bible asks. Keep `:237`, the debrief's HaX text (with D8-4's voice fix) and `:192-193` word for word.

### HaX's voice against m04–m07

Consistent. Short lines (median 16 words on the phone), fact first, dry, no exclamation marks, no catchphrases, no axolotls: "Course. Which one.", "I'm here. Always am.", "Map before you shoot." The m08 slippage the style asks for is there and controlled. "So I'm going to be very professional tonight. Bear with me." and "We did survival training together. He carried me two miles once." are the m07 dryness cracking in one line each and going back to work, as the bible describes. In person she is quieter and better: "Don't say anything kind, I'll come apart." Fixes: D8-3, D8-4, D8-6, D8-22.

## Voice notes, per NPC

- **ATHENA (RP).** Corporate-calm and faintly wrong, as the style asks ("Everyone's, actually. It's rather the point."). The console's "facilities, being human, wrote it down somewhere they shouldn't" is the right register. Fix: D8-5.
- **Director Netherton (RP).** On model: few contractions, numbers in words, verdict last, care shown as procedure ("I would rather talk you out of a mistake than read about it."). Median line 18 words, under the bible's 20. "My jaw is fine, thank you for asking. We will not be discussing it." is the mission's one dry joke, as the bible allows. Fixes: D8-12, D8-13, D8-14, D8-19, D8-20, D8-24.
- **Nightshade, the lab (RP).** Warm, unhurried, the habit words the bible lists ("genuinely", "I'd encourage it"). The serenity is the tell, as designed. Three lines go past it into confession (D8-1). Fix: D8-25.
- **Nightshade, the confrontation (RP).** The register the bible saves for m08: longer, lyrical, rehearsed. "You always were better than me at the part I decided to skip." is exactly the teacher speaking to the student. Fixes: D8-8, D8-9, D8-10, D8-11.
- **Cipher (Glasgow).** Over-explains, flinches, does the maths in front of you, as the style asks. The two apology replies are among the best character writing in the mission. Fixes: D8-15, D8-16, D8-25.
- **Phantom (Ghanaian English).** Charm used as deflection, then dropped at the right moment ("He leans in, and all the charm goes out of his face."). "Accepted, and I'll be insufferable about it for a week." gives him a life outside the plot. Fixes: D8-15, D8-16.
- **The off-duty agent (Geordie).** Gossipy and enjoying it: "I didn't see anything. I'll be telling everyone I didn't see anything." Fix: D8-7.
- **The junior analyst (Leicester).** Two good lines of fear ("Knowing things is how you end up in an interview room."). D8-2 for her re-entry.
- **Narrator (noir).** Spare. Best: "Off the wire, she is smaller than she sounds on it." Two "A long pause." and one "A long beat." in the mission; D8-9 and D8-12 cut two.

## Best and worst lines

**Five best**

1. `m08_nightshade_confrontation.ink:160`, Nightshade: "Every word I taught you was true. I just never said where I'd learned it."
2. `m08_closing_debrief.ink:71`, Netherton: "Two of ours are dead in the space between what I knew and what I did."
3. `m08_agent_0x99.ink:23-25`, Narrator / HaX: "Off the wire, she is smaller than she sounds on it." / "Don't say anything kind, I'll come apart."
4. `m08_suspect_cipher.ink:100`, Cipher: "They just stop looking at you, and you're meant to work out that you've been forgiven for something you didn't do."
5. `m08_nightshade_confrontation.ink:142-143`, Nightshade: "I did the arithmetic of who, and did it anyway. … I'm telling you I did it with my eyes open."

Close behind:
- `m08_nightshade_confrontation.ink:85`, Nightshade: "I walked past that reader every morning for fifteen years and never once thought of it as a witness."
- `m08_phone_agent_0x99.ink:93`, HaX: "We did survival training together. He carried me two miles once."
- `m08_director_netherton.ink:416`, Netherton: "I sealed a warning about him a year ago and told myself it was prudence."
- `m08_suspect_phantom.ink:214`, Phantom: "…the official investigation is three men staring at each other across a corridor."
- `m08_closing_debrief.ink:63`, Netherton: "My jaw is fine, thank you for asking. We will not be discussing it."

**Five worst**

1. `m08_suspect_nightshade.ink:86`, Nightshade, before any evidence: "Then you know Okafor was right" (D8-1).
2. `m08_suspect_nightshade.ink:114`, Nightshade, to an accusation: "I'd rather you found me than guessed me." (D8-1).
3. `m08_agent_0x99.ink:36`, HaX, after the naming: "I can't work out which face it was." (D8-3).
4. `m08_closing_debrief.ink:58`, the narrator reading HaX's 40-word text in quotation marks (D8-4).
5. `m08_director_netherton.ink:435`, re-shown by the engine as Netherton's greeting on every return: "Go. Whoever it is was one of us this morning." (D8-2).

Dishonourable mention: "Tonight you turned it round." to the player who handed him to the police (`m08_closing_debrief.ink:214`, D8-20).

## Skill checks, one line each

- **2a attribution.** OK. Every `Name:` prefix resolves (the validator's ink check is clean). The phone ink carries no self-prefix.
- **2a-bis, supported by the scenario.** OK. Nightshade leaves the lab only once the chain is in (erb `:1859-1872`), so his post-naming lab lines are reachable and right. Gaps: D8-11 (a hostile Director countersigning).
- **2a-ter voices.** OK, with D8-24 (optional).
- **2b choice phrasing.** OK. Every bracket is first-person speech or a plain action. No `You:` echoes.
- **2c hub structure.** OK. Every person-chat has a sticky exit with a reply. The debrief and the briefing end deliberately.
- **2c-bis starved knots.** None (loopcheck clean over 21 states; reopencheck clean).
- **2d choices that matter.** Strong:
  - the accusations: tip-off, refusal, apology, debrief and credits;
  - the instinct (`suspect_theory`): debrief and credits;
  - the fate: the debrief, the credits and the next mission's hook;
  - the debrief stance: the credits.

  The two `the_case`/`the_box` single choices are beats, not decisions, and correctly so. Flat but legitimate: the confrontation's two exits to `the_choice` (stance, same destination).
- **2e cross-file state.** OK. D8-3 and D8-11 need `nightshade_triple_agent` and `netherton_hostile` declared in the files that will read them. Both are already scenario globals.
- **2f influence.** Tags present on every `+=`/`-=` in Cipher, Phantom and Nightshade. No file reads the three influence variables; they are feedback only. That is the m05-m07 practice, so I don't count it as a finding.
- **2g syntax.** OK. No `**`, no bullet dialogue, no stray `*`.
- **2h KO.** Covered by the design stages. Writing gaps: D8-11.
- **2i recurring bugs.**
  - Stale status answers: HaX's "What does the Director need from me?" stays current at every step on r1, r10, r12, r16. HaX in person does not (D8-3).
  - Late first contact: D8-22.
  - Choices that answer what wasn't said: D8-17.
  - The same fact twice: D8-6, D8-10, D8-19.
  - Hub greeting repeats: none, because none prints (D8-2).
  - Credit and debrief lines against every route: D8-19, D8-20.

## Route quotes a fix would break

| Fix | Route | Assertion |
|---|---|---|
| D8-2 | r13 | `"knot": "start"` on the off-duty talk; drop it so the route tests the reopen, and keep `said "Still"` |
| D8-4 | r1, r2, r7 | none break: the rewrite keeps "Your phone buzzes once" and "Same classroom, 0x00" |
| D8-17 | r6 | pick "The root logs have your account" → "The root logs have a login" |
| D8-18 | r2, r7, r8, r11, r13, r14, r15, r19, r20, r21, r22, r23 | the debrief steps need a pick for the new conduct beat (the driver stops on unlisted choices) |
| D8-19 | r2 | none break: "Not on the first reading" is kept |
| D8-21 | r1 | `said "history for anyone patient"`: keep the clause (the 27-word version) or update the route |
| D8-8 | every tidy route | none break: "Not well enough, it seems" is kept in every branch |

Lines asserted by routes that no fix touches: "noticed nothing", "never once explained", "Read me the door audit when you're ready", "Read me the door audit and give me the person", "That's not yours", "Someone saw you at the lockers", "My jaw is fine", "You read the door audit to HaX while I was on my office floor", "The box gave me a login", "He knew we were coming before we came", "before the box did", "Let it hurt afterwards, not during".

Add `{"maxRun": 9}` after the briefing, the confrontation and the debrief in r1, r2, r4 and r23 once D8-4, D8-5, D8-8, D8-9 and D8-18 are in.

## Prioritised action list

**Should fix**
- D8-1: three Nightshade lines that confess before the evidence.
- D8-2: the `hub_quiet` pattern in all eight person-chats, so re-talks greet.
- D8-3: HaX in person after the naming and after the fate.
- D8-4: the "Same classroom" text in HaX's voice.

**Polish**
- Every minor. In order of payoff:
  - the two handed items, D8-5 and D8-7;
  - D8-8, D8-9 and D8-18 (runs);
  - D8-12 and D8-23 (tells);
  - D8-20, D8-13, D8-10, D8-11, D8-16, D8-15, D8-19, D8-6, D8-22, D8-17 and D8-21 (the last two with the SecGen check);
  - then D8-14, D8-24 and D8-25.

## Spoken lines this review would change

All are listed old → new in the tables above. The four erb text fields are HaX's first text (D8-6), the clone text (D8-23, optional) and Netherton's two voice styles (D8-24, optional). Re-read each region before editing, because a room-dressing agent may be working in the same file. With 4 cached m08 clips, the re-voicing cost is close to nil. The fixer keeps the old → new list in the log, as earlier rounds did.
