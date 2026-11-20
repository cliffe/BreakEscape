# m07 The Architect's Gambit: dialogue review, pass 5 cycle 1

Reviewer: fresh Opus, read-only, 2026-10-14. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission judged as a TV spy thriller, the season's climax set-piece: four crises in one minute, one team, a choice that has to cost something real and be paid off honestly (`docs/agents/M07_PASS_BRIEF.md`). Gold standard: m04 and m06 after their dialogue cycles, with m05 cycle 1 (`scenarios/m05_insider_trading/DIALOGUE_REVIEW_P5_C1.md`) as the model for format. Alignment, puzzle chains and scenario design are closed, so their decisions aren't reopened here unless a line has gone wrong.

Items handed on to this stage by the log, each answered below: C3 (D7-11), C4 (D7-3), C5 (closed by F1 in puzzle chains; confirmed: Park's third visit branches on `park_returns`, `m07_npc_thomas_park.ink:133-147`), C6 (D7-12), F10 (D7-13), the T-20/T-10 order (D7-3) and the debrief's 55–63-line read-out (D7-1).

I didn't open the SecGen XML or the four listed field guides. HaX's VM hints and the debrief's one-line VM summary (`m07_closing_debrief.ink:115`) are judged as writing only; whether they match the VM **needs checking against SecGen by the user** (already U3 in `DECISIONS_PENDING.md`).

No m07 audio exists (`tts_cache/` has no m07 folder; the log says the same), so none of the rewrites below costs anything in re-voicing. The fixer should still keep the old → new list.

**Snapshot for `tagdiff --old`:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m07-dialogue-reviewer-c1/snapshot/ink/` (eight `.ink` and eight `.json`), taken at commit `8e868ab9` with nothing uncommitted in the m07 ink folder. Route transcripts for all 27 routes are in `…/m07-dialogue-reviewer-c1/routes/`.

Finding ids are `D7-n`, tagged **blocker / major / minor**. Every fix is mission-local (the ink, or the erb's text fields). A room-dressing agent was editing `scenario.json.erb` during this review (it changed while I wrote; erb line numbers here were re-checked at the end, but will drift): the fixer re-reads any erb region before an Edit.

## Step 1: compile, validator, lint, runtime

- **Compile.** All eight files compile into the scratchpad with no errors and no loose-end warnings. The compiled JSON matches the committed JSON for every file, so the routes test exactly this ink.
- **Validator** (full, `--no-graph`, so the ink checks ran): "All ink files valid". No invalid speaker prefixes, no `#give_item` mismatches, no ink character hazards. The 13 onceOnly-overlap notes on HaX's mappings, the two cutscene notes (Hollis and Park chats opened by mappings), the timed-text spacing note (`object_interacted`, 800 ms / 1500 ms) and the three all-conditional credits sections are the scenario-design notes already logged. None is dialogue-facing.
- **Voices.** Every speaking NPC has a voice block that names its accent and says "consistent … throughout": narrator (RP, Algenib), Netherton (RP, Charon, used by the briefing and the debrief, the same character), HaX (RP, Aoede, identity part word for word from the voice bible), Hollis (PNW working class, Puck), the Architect (deliberately unplaceable mid-Atlantic, Sadaltager), Elena (Californian, Mexican-American, Leda), Mercer (General American PNW, Iapetus), Park (Korean-American PNW, Rasalgethi). No two characters share a voice name. Elena's style describes a different person from the one the ink writes (D7-26).
- **dialoguelint:** 0 errors. `blank-reentry` ×6 (D7-37 takes the three real ones; Hollis `parked` and Park `parked` hold only a hostile NPC, and Park's `hub` after evading is re-entered through `back_at_it`, which prints), `you-after-choice` ×2 (Elena :344 and Mercer :111, both non-verbal "Say nothing", allowed), `transition` ×1 (Architect :118 "however you like", not a transition: **withdrawn**), `not-x-but-y` ×1 (debrief :662 "Not to this room. Somewhere without windows.", which is Netherton moving the next meeting out of a compromised room, not the AI tell: **withdrawn**). Longest line 30 words (briefing, debrief); timed texts max 30.
- **tagdiff** against HEAD: structure unchanged in all eight files.
- **reopencheck:** HaX 1800 reopens, 0 problems; the Architect 476 reopens, 0 problems.
- **Routes, all 27** (`route.js <file>`): every one ends `[result] all expectations met`.
- **loopcheck** (200 steps × 6 strategies) on every NPC's declared `currentKnot` (`start` for all eight) under 15 state sets: the briefing; the debrief with full lore and with the clock expired and no team; Elena fresh with the projection, and turned; Mercer fresh with all levers, and after the abort with Elena turned; Hollis with both documents, and backed off; Park fresh with the projection, and on the third visit; HaX with every topic open, and after the abort with all flags; the Architect redirected with T-20 and T-10 unheard, and with T-5 and T-1 unheard after expiry. No runtime errors, no runaways.
- **Visit-count openers:** none. Park's third visit was moved onto `park_returns` (C5, closed). Every other opener reads a synced global or a saved ink local.
- **Printed variables in voiced lines:** none print a variable. HaX :118 and :543 choose between fixed strings inline, which the user's rule allows.
- **Stage directions as text:** three asterisk cues in 3,605 lines (Elena :84 `*lifts both hands, unimpressed*`, Mercer :377 `*a long pause*`, none on a number). Well under m01's density.
- **Longest run without a choice, per conversation** (worst over the 27 route transcripts, counted with a script over the transcripts in the scratchpad):

| Conversation | Longest run | Where | Target ≤ 9 |
|---|---|---|---|
| debrief | **63** (r4); 62 (r5, r12); 59–61 on seven more routes | `start` to the debrief hub's first choice: the win, the team, the revision, both dark operations, the site, the coda | fails (D7-1) |
| briefing | **11** (every route) | `start`, Netherton to the first question | fails by two (D7-17) |
| Architect | 8 (r1, r2, r6, r7) | T-10's close, then T-20 straight on in the same call (C4) | passes on count, fails on sense (D7-3) |
| phone (HaX) | 7 (r1, r4, r7) | `redirect_open`, the cost read-out | passes |
| hollis | 8 | `deal_take` | passes |
| elena | 8 | `turn_offer` → `turn_yes` | passes |
| mercer | 5 | opening | passes |
| park | 5 | `stand_down` | passes |

- **Most choices on screen at once:** HaX's hub, **15** in a reachable state (ink run with the mid-to-late topics open: see D7-5); 10 seen on routes r2 and r21. Every person-chat is at 7 or fewer.

## Severity table

Counts: **0 blockers, 5 majors, 37 minors.** Two lint warnings withdrawn (Step 1). Nothing blocks play: every finding is about what a line says or how long the player waits to speak.

### Majors

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7-1 | major | `m07_closing_debrief.ink:87-553` | **The debrief's read-out.** From the first narrator line to the first choice the player waits 59–63 lines on ten routes (r4 63, r5 and r12 62). It covers the win, the team, the correction, both dark operations, two of ours, the site, and the coda, and the player says nothing through any of it. m04, m05 and m06 all reached 9 or fewer. The material is good; the scene is a lecture because the agent isn't in the room. | See **Structural findings: how to fix the read-out** below. Eight short player beats, none of which lets the player excuse themselves, and six merges or cuts. Every run comes out at 9 or fewer. |
| D7-2 | major | `m07_closing_debrief.ink:336`, `:370-373`, `:198` | **The debrief reports a week that hasn't happened.** The scene is the same night, "four hours ago" (`:161`, comment `:85-86`), about 06:40 Pacific. Netherton reads results in the past tense that need days: "Two states have postponed. A third has certified a result…" (`:336`), "banking was down for eleven hours" (`:370`), "Operations cancelled all week" (`:372`), "Eighty to a hundred and forty patients did not survive that week" (`:373`), and in the covered branch "Markets moved three per cent and are recovering" (`:198`). Trojan Horse (`:341-348`) gets it right, in the future tense. A player who notices loses trust in the one scene that has to pay the choice off honestly, and "I have the first reporting" (`:133`) promises first reporting. | `:336` → `Director Magnus Netherton: Two secretaries of state are already talking about postponing. The package is believable because the breach under it is real.` (and cut the "believable" sentence from `:335`, which then ends "…ninety minutes later, as designed."). `:370` → `Director Magnus Netherton: Operation Meltdown. Twelve targets, one command. Futures are down fourteen per cent, and banking has been dark since three.` `:372` → `Director Magnus Netherton: The ransomware is in four thousand two hundred hospitals. Every theatre list from this morning is cancelled.` `:373` → `Director Magnus Netherton: The desk projects eighty to a hundred and forty patients will not survive the week, waiting for operations nobody can schedule.` `:198` → `Director Magnus Netherton: Eight of the twelve held clean. Four took damage, mostly money and stolen code. Futures are down three per cent.` Keep `:337` and `:374`, which are already in the right tense. |
| D7-3 | major | `m07_architect_comms.ink:59-66`, `:193-250`, `:430`, `:451` | **C4, the T-20/T-10 order.** A player who leaves T-20 unread and opens the line at T-10 hears T-10, "The call ends mid-syllable.", and then T-20 in the same continuation, twenty minutes stale: "The handset cuts across the facility alarm… You've sent your team." (r6 at minute 41, r7). On r7 the stale T-20 also contradicts the T-10 line just spoken: "You moved them. I had wondered whether you would." is followed by "Almost nobody picks the one with no bodies in the brief." (C3, D7-11). T-20 retires on T-5 (`:64`) but not on T-10. The last fixer kept it because T-20 is the taunt that names the two operations left, which T-10's `else` branch doesn't. | Retire T-20 on T-10 and fold its one essential line into T-10. In `taunt_t10`, after `~ heard_t10 = true`: `{architect_t20_played and not heard_t20:` / `~ heard_t20 = true` / `~ t20_folded = true` / `}` (new local `VAR t20_folded = false`). After the opener: `{t20_folded and not team_redirected and team_assignment != "trojan_horse":` / `{team_assignment == "fracture": You sent your team to Washington. San Francisco and the vendors are on your clock.\|You sent your team to San Francisco. Washington and the vendors stand open.}` / `}` (the redirect and Trojan branches of T-10 already speak to the team). Add `and not architect_t10_played` to the T-20 test in `start` (`:64`), `dead_air_choices` (`:430`) and `parked` (`:451`). Add `~ heard_t20 = true` at the top of `taunt_t5`. Routes: add `"notSaid": ["You've sent your team."]` after the T-10 call in r6 and r7. |
| D7-4 | major | `m07_closing_debrief.ink:598-626` | **The stance question to a player who never sent the team.** On r5 (never committed) Netherton asks "Three briefs. One team. You sent it where you sent it. Where do you stand on that?", the player can answer "[I made the call on the numbers I had. I'd make it again.]", and Netherton says "Good. That answer will stand up in any review room you ever sit in." Nobody made a call. "Two operations went dark because of a choice I made" is also false: three did. The scene that judges the choice gets it wrong for the one player who refused it. | `:598` → `{team_assignment == "": Director Magnus Netherton: Three briefs. One team, and you never sent it. Where do you stand on that?\|Director Magnus Netherton: Three briefs. One team. You sent it where you sent it. Where do you stand on that?}`. Gate the "numbers I had" and "Two operations" choices with `{team_assignment != ""}`. New choice: `* {team_assignment == ""} [I didn't make the call. Three went dark. That's mine.]` / `#set_global:debrief_stance:owned` / `Director Magnus Netherton: It is. Not choosing was a choice, and it was the most expensive one on the board.` / `Director Magnus Netherton: Carry it accurately. The menu was his. Leaving it unordered was yours.` / `-> handoff`. In the hardened branch (`:640-641`) add `- team_assignment == "":` → `Director Magnus Netherton: Yes. Next time, make the call while you work it out.` before `- else:`. |
| D7-5 | major | `m07_phone_agent_0x99.ink:217-321` | **HaX's hub can show 15 choices.** With the mid-to-late topics open (team on Fracture, correction found after the window, Hollis talked, Elena turned, Mercer arrested, the vault searched, the echo heard, flag 3 in) the hub lists 15 options (ink run, listed in the scratchpad): redirect-closed, the two we're not covering, Hollis, Elena, the share, Mercer, Tomb Gamma, the teacher line, the mole, Park, the operator hint, guides, "Where do I stand?", "Remind me of the layout and the clock", exit. Routes r2 and r21 show 10. The mission's best HaX beats (the teacher line, the mole) sit in the middle of a list of reports. | See **Structural findings: how to fold HaX's hub** below: one "About the people in here." choice (Hollis, Elena, Mercer, Park), one "What I found in the vault." choice (Tomb Gamma, the mole, each keeping its own player line), one "I'm stuck on something." choice (the operator hint, the vault keypad, the guides), and "Remind me of the layout and the clock" hidden once `server_hall_reached`, with the clock line moved into the ladder. The most at once becomes 9. |

### Minors: the debrief

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7-6 | minor | `m07_closing_debrief.ink:169-183`, `:220-228` | On the direct Trojan routes the same facts come twice inside eight lines. `covered_trojan_direct` says the manifest and "ninety days… nine", then `revision_payoff` says "Your field notes say the Trojan Horse projection was understated. Nine days, not ninety, and dispatch on the manifest." r9 also hears "You read their schedule before you made the call…" and then "You found it before you chose, and you chose Austin." | Merge `:169-170`: `Director Magnus Netherton: The manifest was not what the brief said. A third of those keys sign health record and dispatch systems, and the payload was set to wake in nine days, not ninety.` In `covered_trojan_direct`'s block (`:176-183`) add, before `- else:`, `- projection_revised:` → `Director Magnus Netherton: You found out what you had chosen while they were stopping it.` Then the Trojan block in `revision_payoff` (`:220-229`) becomes only HaX's `:227` line and `-> revision_lesson`. |
| D7-7 | minor | `m07_closing_debrief.ink:252`, `:355-356` | On every `revision_found_open` route HaX makes the same point twice: "The team not moving is a separate sentence. I won't pretend otherwise." and, fifteen lines later in the Trojan read-out, "You knew. You found it and it did not move." The second is the stronger, because it lands on the casualty figure. | Cut `:252`. Breaks r2's `said` "The team not moving is a separate sentence". |
| D7-8 | minor | `m07_closing_debrief.ink:564` | "[Nothing on the record, sir. But I'll answer one thing.]" answers a question Netherton hasn't asked yet. | `+ [Nothing on the record, sir.]` Netherton's `:597` ("One question, then…") then asks it. The new text keeps the substring the 14 routes pick on. |
| D7-9 | minor | `m07_closing_debrief.ink:600-610` | The "defended" answer gets "Good. That answer will stand up in any review room…" from a player who found the correction with the window open and left the team where it was without declining (r12, r15 class). The hardened and handoff lines were already guarded for this state (N1); this one wasn't. | Add a first branch: `- revision_found_open and not team_redirected and not redirect_declined:` → `Director Magnus Netherton: The numbers you had changed while the window was open, and the team stayed where it was. That answer will need more than one sentence in a review room.` |
| D7-10 | minor | `m07_closing_debrief.ink:521` | `coda_thin`: "He was on your handset the moment you reached the operations floor." Since the late-first-contact fix (r23–r25) his first call can come at the checkpoint, after T-20, or at T-5. | `Agent HaX: The calls. He had your handset tonight, and your designation.` |
| D7-39 | minor | `m07_closing_debrief.ink:386-395` | A Mercer who went hostile and was left standing (`mercer_fate == "ko"`, `mercer_ko` false) falls to the `else`: "Blackout was still at the master console when you left that room." He came at the agent. "Blackout" is also a name only HaX's optional `topic_mercer` ever says. | Before `- else:` add `- mercer_fate == "ko":` → `Director Magnus Netherton: Dr. James Mercer came at you in that control room. By the time the police reached it, he was gone.` `:394` → `Director Magnus Netherton: Dr. James Mercer was still at the master console when you left that room. By the time the police reached it, he was not.` |
| D7-40 | minor | `m07_closing_debrief.ink:203`; erb `:200`; briefing `:86` | The team is "airborne" in the briefing and "still over Denver" in HaX's texts (erb `:833`, `:995`), but "stood by in Denver" in the debrief and the credits. | `:203` → `…It circled over Denver all night and went nowhere.` erb `:200` (credits text) → `TACTICAL TEAM: Never committed — held over Denver for the duration`. Re-read erb first. |
| D7-41 | minor (optional) | `m07_closing_debrief.ink:507`; erb `:2130` | The intercept says "Window, thirty minutes." Everything else says forty (the drive, the redirect window). A player who has the document can check. | "Window, forty minutes." in both the ink and the document text, or leave it if "window" is meant as the commit deadline and say so in a comment. |

### Minors: the Architect and the briefing

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7-11 | minor | `m07_architect_comms.ink:150-152` | **C3.** A fast player can redirect before minute 10. T-20 reads only `team_assignment`, so the redirected player hears "The update pipeline. Interesting. Almost nobody picks the one with no bodies in the brief." He watches the board, and his T-10 and sign-off both know the team was moved. | `:151` → `{team_redirected: You moved them already. You read the column nobody reads. So two go dark, and one of them is the one you chose first.\|The update pipeline. Interesting. Almost nobody picks the one with no bodies in the brief.}`. Keep the direct-commit wording word for word: it echoes Netherton's commit line (`m07_opening_briefing.ink:279`), and m08 pays that off as the leak through his briefings (`m08_the_mole/DIALOGUE_EDIT_NOTES.md:197`). |
| D7-14 | minor | erb `:1487`, `:1493`; `m07_architect_comms.ink:219`, `:270-276`, `:331` | The bark gives away the call's punch line three times. T-5's bark "Five minutes. Say the other two out loud." is followed by "Say the other two out loud." T-1's "This was never about the power grid." is followed by "But the grid was never the point." T-10's "Ten minutes before your team is too committed to move" is followed by "Ten minutes, and your team is too committed to move." (the `else` branch). | erb `:1487` → `"Five minutes, Agent 0x00."`; erb `:1493` → `"One minute, Agent 0x00."`. For T-10 keep the bark (three routes assert it) and change the line: `:219` → `The beauty of entropy is that it doesn't require me to win. Soon your team won't be yours to move.` Breaks r24's `said` "Five minutes. Say the other two out loud." and r2's `said` "Ten minutes, and your team is too committed to move". |
| D7-15 | minor | `m07_architect_comms.ink:168-175` | "[Say what you want to say.]" → "I have." and he goes straight on: "Answer honestly. I'll know either way. Did you decide with a number, or with your stomach?" He says he's finished and then isn't. | `:169` → `Nearly.` |
| D7-16 | minor | `m07_architect_comms.ink:267` | T-5 opens on "Mercer would give you his figure…". Nobody has named Mercer by then on many routes (the briefing names Reeves, Walsh and Ashford; Mercer's name comes from Elena, Hollis's papers or HaX's optional topic). On r24 it is the first thing the Architect ever says to the player. | `The man in your control room would give you his figure and defend it to your face. I respect that, even when the figure is monstrous.` |
| D7-19 | minor | `m07_architect_comms.ink:148`, `:152` | The Architect moves Meltdown's deaths forward: "Eighty to a hundred and forty people, tonight, on your clock." and "Eighty to a hundred and forty dead by morning." The brief (`m07_opening_briefing.ink:190`, `:193`) and the debrief say this week, from delayed care. He uses numbers exactly; that's his point. | `:148` → `…Twelve companies. Eighty to a hundred and forty people this week, starting on your clock.` `:152` → `…A hundred and eighty-seven million records. Eighty to a hundred and forty dead before the week is out.` |
| D7-20 | minor | `m07_architect_comms.ink:215` | On a direct Trojan route the player hears "the one with no bodies in the brief" three times: Netherton at the commit, T-20, and T-10. Keep the first two (the m08 plant needs the Architect to repeat Netherton's words once). | `You sent them to Austin. I'd like to know what you saw in it.` |
| D7-17 | minor | `m07_opening_briefing.ink:19-42` | The opening runs 11 lines (narrator, nine Netherton, narrator) before the player speaks, on every route. Two merges bring it to 9. | Merge `:23` and `:25`: `Director Magnus Netherton: Four ENTROPY operations went live inside the same sixty seconds. Three days ago you followed the fund that paid for them.` Merge `:37` and `:39`: `Director Magnus Netherton: A sequence on their SCADA stack takes all of it down in four steps. It waits on a start signal from a host inside the building, and nobody stops it from outside.` Keep `:29` ("Frozen or watched", asserted by r1) and the Portland pin. |
| D7-18 | minor | `m07_opening_briefing.ink:140-143`, `:170-177`, `:203-208` | Only Trojan Horse's tail says what the team would achieve there ("If the team goes there, the run stops before deployment…", `:175`), on every route. Fracture's and Meltdown's are behind a once-only second question. A player who answers "Understood." to all three learns the payoff for one: a small, unintended nudge toward the understated brief. | Fracture tail, after `:141`: `Director Magnus Netherton: If the team goes there, the story never runs. The breach does.` Meltdown tail, after `:206`: `Director Magnus Netherton: If the team goes there, the ransomware never reaches the hospitals.` (not "an ordinary night", which the commit line `:287` uses). Leave the question replies as they are; they add detail. |

### Minors: HaX (phone)

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7-12 | minor | `m07_phone_agent_0x99.ink:580-592` | **C6.** r10: the player deduces the correction, logs in, then commits Fracture. The hub at once offers "Can I still move the team to Trojan Horse?" and HaX answers "The team's on the ground on a live objective. Pull them now and we strand two operations instead of one." The team left a minute ago. The refusal is right; the reason is false. | Declare `VAR revision_before_commit = false` (a synced global, erb `:2169`). `:584` → `{revision_before_commit: You made that call with the numbers in hand. It stands.\|The team's on the ground on a live objective. Pull them now and we strand two operations instead of one.}` |
| D7-30 | minor | `m07_phone_agent_0x99.ink:124`, `:171` | HaX's first call always ends "Get past the checkpoint to the operations floor." A player who doesn't open the phone until the server hall hears it there (pass-4 class "a first phone contact opened late"). | `:124` and `:171` → `{inside_reached: You're past the checkpoint. Ask me where you stand and I'll give you the next step.\|Get past the checkpoint to the operations floor.}` (`:171` keeps "Call me when you hit something you can't open." in the else). |
| D7-31 | minor | `m07_phone_agent_0x99.ink:116` | "The ops room's covering three continents tonight." All four operations are in the United States. | `The ops room's running four fires tonight. If I go quiet for ten seconds, it isn't personal.` |
| D7-32 | minor | `m07_phone_agent_0x99.ink:122`, `:613`; `m07_opening_briefing.ink:54`, `:308` | "The one place a person on the ground changes the outcome" is said four times in the first ten minutes: Netherton twice, HaX's first call, HaX's "How do you carry that?". | Cut `:122` ("You're my hands in the one place…"). Keep `:613`, where it answers a question. |
| D7-33 | minor | `m07_phone_agent_0x99.ink:571` | After the redirect: "The ones you couldn't reach are on ENTROPY." HaX absolves the player, one line after "It's logged under your name.", and against the voice bible ("states the cost and lets it sit") and the debrief's own rule (`m07_closing_debrief.ink:17`). | Cut `:571`. "Done. It's logged under your name." ends it. |
| D7-34 | minor | `m07_phone_agent_0x99.ink:616-619` | "Was there a right answer?" → "No. That was the design. Anyone who says they'd have known is lying, or didn't read the briefs." After the correction (`projection_revised`) the player has just shown that one brief was a lie, so "didn't read the briefs" turns on them. | `{projection_revised: Not on the brief we gave you. He wrote the brief.\|No. That was the design.}` then `{not projection_revised: Anyone who says they'd have known is lying, or didn't read the briefs.}` |
| D7-35 | minor | `m07_phone_agent_0x99.ink:631` | Hollis topic: "It's a small version of a bigger question. You'll meet the big one tonight." HaX can't know that, and on routes that skip the vault it never comes true. | `If it missed him, I want to know what else it missed.` |
| D7-36 | minor | `m07_phone_agent_0x99.ink:672-676` | Mercer topic: the same three lines for every fate, and "What you said is his to live with now." follows a KO where nothing was said (combat KO with `mercer_fate == ""`). | `:676` → `{mercer_fate == "arrested": He'll talk. He's waited twenty years for a room that has to listen.\|{mercer_fate == "escaped": You let him walk. That's in the log, in your words.\|He never got to say his piece. He'll mind that more than the cell.}}` |
| D7-38 | minor | `m07_phone_agent_0x99.ink:719` | "You still held three states with one step gone." Step one darkened Seattle, so one of the three states wasn't held. | `You still held most of three states, with Seattle gone for a while.` |
| D7-42 | minor | `m07_phone_agent_0x99.ink:118`, `:248`, `:265`, `:582` | Double hyphens where a comma or full stop belongs (the user's em-dash rule): "Fracture -- Washington", "The guard on the checkpoint -- Hollis.", "The share -- four operations…", "No. I'm sorry -- that window's shut." | `Fracture, Washington` (and the other two); `[The guard on the checkpoint, Hollis. He was dirty.]`; `[The share. Four operations running off one schedule.]`; `No. I'm sorry. That window's shut.` No route picks on these. |

### Minors: Hollis, Elena, Mercer, Park

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D7-13 | minor | `m07_npc_ray_hollis.ink:143` | **F10.** The clone opens "You ask how much again…" after either stakes choice, including "No. It's exactly what you meant.", where nobody asked how much. | `Narrator: You ask him what it bought, and step in close while he works out an answer.` True after either choice, and new after "How much?". |
| D7-21 | minor | `m07_npc_ray_hollis.ink:60` | "Building's been evacuated forty minutes." The player has just driven up to people "coming out of the front doors with coats over their heads" (`m07_opening_briefing.ink:302`, "The building is evacuating."). | `Ray Hollis: Building's evacuating. So you're lost, or you're the other thing.` |
| D7-22 | minor | `m07_npc_ray_hollis.ink:266-273` | `wary_again` plays "He is jumpier now… There you are. I knew something was in here." on every re-talk after backing off, and after the clone, where he has just said "Are we done? Go on, then." to the player's face (r14, last step). | `{hollis_cloned: Narrator: He looks up from the desk. His hand stays off his belt this time. / Ray Hollis: Thought you'd gone. Say it or go.\|{wary_said: Ray Hollis: Still here. Say it or go.\|(the two existing lines) ~ wary_said = true}}` with a new local `VAR wary_said = false`. Breaks r14's last `said` "There you are." (the post-clone sighting); r2 keeps it. |
| D7-23 | minor | `m07_npc_ray_hollis.ink:100` | "[Keep him on the money. Let the cloner read his belt.]" is an instruction, not speech. Park's actions use parentheses ("(Hold up the projection.)"). | `+ {…} [(Keep him on the money. Let the cloner read his belt.)]`. r14 still picks on "Keep him on the money"; its `notSaid` "[choice] Keep him on the money" would pass trivially, so change it to "Keep him on the money". |
| D7-24 | minor | `m07_npc_elena_rodriguez.ink:222`, `:224` | "Same table your ninety came out of, one column over." plays after "[Why Austin?]" and after the projection route, where nobody told her the brief said ninety. "And I recognised a name on the vendor manifest." is followed by prefixes, not a name. | Set a local `told_ninety` on the "Dormant ninety days" choice (`:198`). `:222` → `Elena Rodriguez: The dormancy field says T plus nine. Nine days. {told_ninety: Same table your ninety came out of, one column over.\|The column next to it says ninety. That's the one somebody wanted read.}` `:224` → `Elena Rodriguez: And I read the vendor manifest. Over a third of the entries are prefixed EHR or CAD.` |
| D7-25 | minor | `m07_npc_james_mercer.ink:136`; `m07_npc_elena_rodriguez.ink:307-309` | A turned Elena tells the player "Ask him what the carve-out page says." Mercer offers no such line; the nearest choice says "Elena Rodriguez thinks this is a six-hour demonstration with nobody hurt.", present tense, after she has read the real numbers. | `:136` choice text → `{elena_outcome == "turned": Elena says to ask you what the carve-out page says.\|{elena_outcome != "": Elena Rodriguez thought this was a six-hour demonstration with nobody hurt.\|Elena Rodriguez thinks this is a six-hour demonstration with nobody hurt.}}`. In `topic_elena`'s turned branch (`:201`) add after the first line: `Dr. James Mercer: Page one of her copy had the carve-out. Mine had the annex instead.` r23 (Elena not turned) keeps its quote. |
| D7-26 | minor | erb `:1714` (Elena's voice style) | The style describes "a contract electrical engineer… who worked out an hour ago what her cabling survey was for". The ink's Elena is a Critical Mass engineer who wrote the sequencing, has spent six months on it, and believed nobody would be hurt. The TTS will act a surprised contractor. Free to change now: no m07 audio. | Scene part → `A grid engineer in her early thirties who helped build tonight's outage believing nobody would be hurt, and has just read otherwise.` Keep the accent sentence and everything after "Mid-range pitch." word for word. Re-read the erb region first. |
| D7-27 | minor | `m07_npc_james_mercer.ink:166`, `:223`, `:338`, `:388-390` | "I testified twice, and filed the same submission three times in eight years." But the page calls tonight "the third submission" (`:223`), the hollowed ending counts "Three submissions" including tonight (`:338`), and the walk-out says "When the fourth submission is declined" (`:388`). | `:166` → `…I testified twice, and filed the same submission twice in eight years.` |
| D7-28 | minor | `m07_npc_james_mercer.ink:267`, `:382` | "It takes no abort from this chair." The abort does go in at this console once root is in (HaX `:151`, `:382`; the console's observations, erb `:1916`), and in the post-abort branch Mercer says "You put the abort through while I sat here." | `:267` → `Dr. James Mercer: End it how? While the host in the server hall drives it, this chair takes no abort, and the sequence doesn't care what happens to me.` `:382` → `…Ah. It's decided on the host in the server hall, not by me. So I'm a man in a room with a signed piece of paper.` |
| D7-29 | minor | `m07_npc_james_mercer.ink:228`, `:245` | US spellings: "modeler", "artifact". | "modeller", "artefact". The accent is in the voice style. |
| D7-37 | minor | `m07_npc_elena_rodriguez.ink:97`, `:300`; `m07_npc_james_mercer.ink:121-129` | Lint `blank-reentry`, confirmed: a reopen goes straight to the owner of the saved choice (Hollis's hub comment `:71-74`), so a re-talk with Elena lands on bare choices, and Mercer's `returning` lines ("Back. The console hasn't changed its mind either.") never play, because the reopen skips `start`. | Use Hollis's `back`/`hub_quiet` pattern. Elena `hub`: `{not hub_quiet: Elena Rodriguez: {&Still here. Ask.\|I haven't moved. Neither has the table.}}` then `~ hub_quiet = false`; every in-conversation `-> hub` goes through a `back` stitch that sets `hub_quiet`. Elena `post_turn_hub`: the same with `{&The tables are coming back. Slowly.\|What else?}`. Mercer: move `returning`'s two lines into the top of `hub` under `not hub_quiet and stance_taken`, with the same `back` stitch. |

## Structural findings

### How to fix the read-out (D7-1)

The run starts at `start` and doesn't stop until `debrief_hub`. The scene's rules (`:16-19`) stay: nobody absolves the player, both dark operations are read by name and number, the win is real. So every new player line is a reaction or a question, never an excuse, and every reply is one line. I checked the counts by hand against r4 (63), r5 (62), r1 and r9; the fixer should re-measure from the route transcripts.

1. **Open faster** (`:87-91`). Merge the two narrator lines: `Narrator: A borrowed office at the grid site, not long after the abort. On the secure link, Netherton sits down in front of the camera with a tablet, in the suit he briefed you in.` Keep "Agent. Sit down."
2. **Beat 1: after the win** (`:99-120`, before the door-order block `:121-129`). The run to here is at most 8 (2 + four win lines + the two VM lines; 7 when the clock ran out).
   ```ink
   + [How close was it?]
   + [It doesn't feel done, sir.]
       Director Magnus Netherton: It will not, tonight. It is done anyway.
   - (door order block, :121-129, unchanged)
   ```
   The door-order line then answers "How close was it?" on every route, so nothing the credits rely on is lost.
3. **Cut the narrator at `:131`** ("He lets that stand… turns the tablet over."); `:133` follows the door line directly. With D7-6's merge, `covered_trojan_direct` is at most 6 lines, so the run to Beat 2 is at most 8.
4. **Beat 2: after the team's result** (end of every `covered_*` stitch, before `revision_payoff`):
   ```ink
   = team_reaction
   + [Was it worth it?]
       Director Magnus Netherton: {team_assignment == "": That question belongs to the other three.|Ask me again when I have read you the other two.}
   + [Go on, sir.]
   - -> revision_payoff
   ```
   "Ask me again when I have read you the other two" sets up the dark read-out and refuses to absolve.
5. **Beat 3: the player says the twist** (`revision_lesson`, `:294-298`). The mission's central lesson goes to the player, as m05's D5-3 did for its deduction:
   ```ink
   = revision_lesson
   Director Magnus Netherton: Every figure you were briefed with came from material we captured.
   + [He let us capture it.]
       Director Magnus Netherton: Yes. Our threat desk did not derive one of those numbers.
   + [Then whose numbers were they?]
       Director Magnus Netherton: His. The Architect let us capture them. Our threat desk did not derive one.
   - -> operations_gone_dark
   ```
   The run from Beat 2 is at most 6 (revision payoff 1–4 after D7-6 and D7-7, plus this line).
6. **Beat 4: the player braces** (`:306-313`). Cut the narrator `:306`; keep "Two operations went unanswered. I am reading both."
   ```ink
   + [Read them, sir.]
   + [I know what they were, sir.]
       Director Magnus Netherton: You know the briefs. These are the results.
   ```
7. **Beat 5: between the dark read-outs.** A tunnel called after each `dark_*` except the last. Merge `:346-347` (`Director Magnus Netherton: Ninety to a hundred and sixty dead over the following month, spread thin enough that no single coroner sees a cluster.`), which brings `dark_trojan` to 7 plus HaX's 1–2 = 9 at most.
   ```ink
   = between
   + {not asked_on_me} [How many of those are on me?]
       ~ asked_on_me = true
       Director Magnus Netherton: Ask me that after the next one.
   + [Go on.]
   - ->->
   ```
   (`asked_on_me` a new local; the stance question at the end is where it gets answered.)
8. **Beat 6: two of ours** (`:326-328`). After "And two of ours. Names withheld until the families are told.":
   ```ink
   + [Who were they?]
       Director Magnus Netherton: Not tonight. Their families first.
   + (Say nothing.)
       Narrator: He doesn't fill the silence either.
   ```
   Then cut the narrator `:328`, which the second reply replaces. m08's "two of ours" setup is unchanged.
9. **Trim the site** (`:384-485`) to one line per person: merge each two-line branch into one (Elena KO `:428-429`, turned `:431-432`; Hollis KO `:444` + `:447`, talked `:451-452`; Park KO `:466-467`; every Park branch ending "Had the abort come any later…" folds that clause into its first sentence, as `…and the control run cut. Any later with the abort, and that control centre runs on nothing.`). Merge `:422-423` into one Netherton line. The run from Beat 6 is at most 8.
10. **Move Tomb Gamma into the hub.** `coda_close`'s two Tomb lines (`:532-535`) go to the top of `q_tomb`, which already exists for a player who found it. That takes 2 lines out of the coda for free.
11. **Beat 7: the intercept** (`coda_full`, after the narrator `:508`):
    ```ink
    + [That's my deployment. Word for word.]
        Agent HaX: Word for word.
    + [When was it sent?]
    - (then :509-513 unchanged)
    ```
    Merge `:514-515` (`Agent HaX: He built a problem with no right answer, pointed one agent at it, and watched what we protect when we can only protect one thing.`) and cut `:516` ("How fast we decide. Which numbers we believe…", a list). In `coda_thin`, the same beat after `:522`: `+ [Nobody outside SAFETYNET knew that.]` → `:523` as HaX's reply; `+ [How?]` → (none).
12. **Beat 8: before "Look at me"** (`:536`). After "You gave him a clean reading." (or "We didn't find it."):
    ```ink
    + [Then he got what he came for.]
    + (Say nothing.)
    - Director Magnus Netherton: Agent. Look at me.
    ```
    The tail to the hub is then 4 lines.

No condition or global changes; one new local (`asked_on_me`). Routes that quote cut lines: none of `:131`, `:306`, `:328`, `:516` is asserted. Every route's debrief needs picks for the new beats (the route driver stops on unlisted choices, so the fixer adds picks by substring to all 27 routes' debrief steps). Raise each route's run guard from `<= 66` to `9`.

### How to fold HaX's hub (D7-5)

```ink
// replaces the four people topics (:248-255, :269-270) and the Park pointer (:285-286)
+ {people_news()} [About the people in here.]
    -> people_topics

// replaces Tomb Gamma (:273-274) and the mole (:281-282)
+ {(found_tomb_gamma and not tomb_discussed) or (found_mole_evidence and not mole_discussed)} [What I found in the vault.]
    -> vault_finds

// replaces the vault keypad hint (:289-290), the four VM hints (:293-300) and "Send me a field guide." (:305-306)
+ {stuck_news()} [I'm stuck on something.]
    -> stuck_topics

// "Remind me of the layout and the clock." (:314) gains {not server_hall_reached}
```

`people_topics`, `vault_finds` and `stuck_topics` are choices-only knots holding the existing choices word for word (the mole keeps "They didn't leak the operation. They leaked me.", the teacher line keeps its own hub choice), each with a sticky `+ [Never mind.] -> hub`. `people_news()` and `stuck_news()` are functions over the existing gates, like `guide_waiting()`. The clock answer moves into the ladder as a text-only tunnel at the top of `report_progress`, for `cascade_armed or countdown_expired`, reusing the four lines at `:145-154`. The most the hub can show at once becomes 9 (commit or redirect or "Bring me in", the two we're not covering, the deduction or the share, people, vault, the teacher line, stuck, "Where do I stand?", exit). reopencheck must be re-run: the three new knots are choices-only, so a reopen lands on them and "Never mind." gets out, the same shape as `field_guides` today.

## Does it play like a TV spy thriller?

Yes, more than any mission before it, and the writing is the strongest in the campaign line for line. The briefing is the best opening in m01–m08: rain on the I-5, the wall map, a director who refuses to choose for the agent ("A director who chooses for the agent he is sending in is choosing for himself, and calling it command."). The Architect is properly unnerving because he never raises the temperature: he answers questions with statements, uses the player's own numbers against them, and hangs up first. The debrief's turn, from "That number is now zero" to "He measured you. He did not beat you." / "He says it like a line he has decided to believe.", is a real season-finale beat.

It falls short in four places:

1. **The debrief is a sixty-line lecture** (D7-1). The agent whose choice the scene is about says nothing until the end, and the scene's best idea, that every number was the Architect's, is told to the player when the player could say it.
2. **The debrief reports a week the same night** (D7-2). It promises first reporting and reads out death tolls and certified elections four hours in.
3. **The Architect's calls can arrive out of order** (D7-3, D7-11). T-20 straight after T-10, twenty minutes stale, and on r7 contradicting the line he has just said. His menace depends on the sense that he sees everything; a stale call breaks it.
4. **The debrief asks the uncommitted player a question that assumes a commit, and praises the answer** (D7-4).

### The four-crisis choice, and whether the debrief pays it off honestly

Mostly yes, and better than the brief asks. Every commit gets a distinct result read out by name and number (`covered_*`), and the two operations left are always read in full. The correction is handled with care for every timing: found before the commit and chosen anyway, found with the window open and held, weighed and declined, found late, read and never put against the brief. Each gets its own sentence, and the routes check them. Netherton's "You had no way to know what you were choosing. I would like it noted that you chose it anyway." for the unknowing Trojan player is exactly right. "The choice was yours. The menu was his." is the best line in the debrief.

Three gaps: the uncommitted player (D7-4), the "defended" answer after a held correction (D7-9), and the tense of the dark read-outs (D7-2). The redirect route reads Fracture or Meltdown as dark without saying the team had been there and left; that is honest (they peeled off), and the redirect's cost was stated at the time (`m07_phone_agent_0x99.ink:543-551`), so no change is needed.

### The Architect's menace and the teacher thread

The teacher line works. HaX says it first, by text, at the commit (erb `:823`) or on the ops floor (erb `:833`). The Architect says it once, in T-30's close or in the close of whichever taunt is first contact, with "I expect you've been told that." HaX's `topic_teacher` picks it up ("...Read me that again." / "Somebody taught it to me, a long time ago. Somebody who taught a lot of us."), and m08 closes it with Nightshade's last words. Once per mission at most, never explained, as the voice bible asks. Keep every instance word for word.

The menace is right in register (unplaceable, under 15 words, no threats) and in the details: "Your handset reports no call in the log." "They do. And I have written every one of them down." He loses some of it to the out-of-order calls (D7-3), to barks that give away the call (D7-14), and to opening a first-contact T-5 on a name the player may not know (D7-16).

### HaX's voice against m04–m06

Consistent. Short lines (median 13 words), fact first, dry ("If I go quiet for ten seconds, it isn't personal."), no exclamation marks, no catchphrases, no "great job". The strain the m07 style asks for shows as dryness, as the bible says it should: "Badly, if you're any good. Nobody comes out of triage clean." Two drifts: one line of absolution after the redirect (D7-33), and the repetition of "the one place a person on the ground" (D7-32). The mole topic ("Slowly. I want to be sure I'm hearing this.") is the m07/m08 dryness slipping in exactly the way the bible describes.

## Voice notes, per NPC

- **Director Netherton (RP).** On model: formal, few contractions, exact numbers in full words, short declaratives with a verdict at the end. The handbook joke appears once (briefing `:252`), as the bible allows. Median line 18 words in the briefing, under the bible's 20. His care comes out as procedure ("I will log it, I will defend it, and I will not take it off you."). Fixes: D7-2, D7-4, D7-9, D7-17.
- **The Architect (unplaceable).** The best-held voice in the mission. Never angry, never pleading, never explains. "Doors close. It's the one thing they reliably do." and "I wasn't playing for tonight." are bone-dry in exactly the bible's sense. Fixes: D7-3, D7-11, D7-14, D7-15, D7-16, D7-19, D7-20.
- **Agent HaX (RP handler).** See above. Fixes: D7-5, D7-12, D7-30 to D7-36, D7-38, D7-42.
- **Ray Hollis (PNW guard).** Distinct: flat, defensive, too casual, and the money keeps leaking out of him ("there's a number in my account that says stand here." / "It comes out too fast, and he hears it."). "Enough that I can't give it back. That's the whole trick of it, isn't it." is his best. Fixes: D7-13, D7-21, D7-22, D7-23.
- **Elena Rodriguez (Californian, Mexican-American).** The mission's warmth, and it never turns sentimental. Concrete and technical ("The load-shed tables. He rewrote them."), with real bite ("That's a cheap thing to say to me. / It's also the only true thing anyone's said in this building since Thursday."). Her page-forty speech is the best character writing in m07. Fixes: D7-24, D7-26, D7-37.
- **Dr James Mercer (General American, PNW).** Cold, professorial, never defensive, as the style asks. "It would be a strange sort of cowardice to write them and then decline to know them." and the hypothermia column are chilling because he's precise. His endings each give him one line that hurts ("The grid is still fragile." said "the way a man checks for his keys"). Fixes: D7-25, D7-27, D7-28, D7-29, D7-37.
- **Thomas Park (Korean-American, PNW).** Short sentences, hands first, as the style asks. "They said a building. Empty, they said. Nobody in it." is the human cost in eight words. No changes.
- **Narrator (noir).** Spare and well judged. About one line per beat, and the best ones do two jobs: "The line holds for a second longer than a bad connection would explain." / "He picks the tablet up again and holds it at arm's length, to read rather than say." The read-out fix cuts three narrator lines, none of them among the best.

## Best and worst lines

**Five best**

1. `m07_closing_debrief.ink:616`, Netherton: "So carry it accurately, which is harder than carrying it heavily. The choice was yours. The menu was his."
2. `m07_closing_debrief.ink:542-543`, Netherton: "He measured you. He did not beat you." / Narrator: "He says it like a line he has decided to believe."
3. `m07_npc_elena_rodriguez.ink:155-157`, Elena: "Then somebody read it properly. Asked me about page forty. Nobody had ever asked me about page forty. / That's how they get people like me. You'd think it was money."
4. `m07_architect_comms.ink:338`, the Architect: "They do. And I have written every one of them down."
5. `m07_opening_briefing.ink:250`, Netherton: "A director who chooses for the agent he is sending in is choosing for himself, and calling it command."

Close behind: Park's "They said a building. Empty, they said. Nobody in it." (`:78`); Mercer's "I costed the hypothermia column myself. The modeler kept rounding down, and I thought that was dishonest." (`:228`, with D7-29's spelling); HaX's "One authority signing for all four. One operation wearing four coats." (`:517`); the last narrator line, "Somewhere else, a man reads the same figures on the same kind of tablet, and is pleased with them." (`:677`).

**Five worst**

1. `m07_closing_debrief.ink:373`, Netherton: "Eighty to a hundred and forty patients did not survive that week…" A week reported four hours in (D7-2).
2. `m07_closing_debrief.ink:598`, Netherton, to a player who never sent the team: "You sent it where you sent it." Then "Good." (D7-4).
3. `m07_architect_comms.ink:151`, the Architect, to a player he has just told "You moved them": "Almost nobody picks the one with no bodies in the brief." (D7-3, D7-11).
4. `m07_phone_agent_0x99.ink:571`, HaX: "The ones you couldn't reach are on ENTROPY." Absolution, one line after "It's logged under your name." (D7-33).
5. `m07_phone_agent_0x99.ink:584`, HaX, to a team that left a minute ago: "The team's on the ground on a live objective." (D7-12).

Dishonourable mention: "The ops room's covering three continents tonight." (`:116`, D7-31).

## Skill checks, one line each

- **2a attribution.** OK. Every `Name:` prefix resolves (validator). Phone inks carry no self-prefix. HaX and Netherton in the debrief resolve to their own NPCs and voices.
- **2a-bis, supported by the scenario.** OK, with D7-21 (Hollis and the evacuation) and D7-28 (Mercer and the console). Park's walk-out and Elena's flight are hidden by mappings (checked in earlier phases).
- **2a-ter voices.** OK, with D7-26 (Elena's style describes a different character).
- **2b choice phrasing.** OK, with D7-23. Every other bracket is the player's own words; the two `You: ...` lines follow non-verbal choices.
- **2c hub structure.** OK. Every person-chat has a sticky exit with a reply; the debrief and briefing end deliberately.
- **2c-bis starved knots.** None: loopcheck clean on every entry knot over 15 states; reopencheck clean on both phone inks.
- **2d choices that matter.** Strong. The commit, the redirect (taken, declined or never asked), Elena's outcome, Mercer's stance and fate, Hollis's and Park's resolutions and the debrief stance are all read back in the debrief and credits. Flat pairs that are stances, correctly: Park's two `projection` replies, Elena's `lever_briefing` pair, the Architect's choice pairs (he is immovable by design). Lossy: the briefing tails (D7-18).
- **2e cross-file state.** OK. D7-12 needs `revision_before_commit` declared in the phone ink; it is already a declared global.
- **2f influence.** N/A. No NPC in m07 runs on rapport; outcomes are gated on evidence (the handover, the projection, the share), which is the right design for a one-night siege.
- **2g syntax.** OK. No `**`, no bullet dialogue, no line starting with `*` outside choices.
- **2h KO.** Covered by alignment and puzzle chains. Writing gaps: D7-36 (HaX after a silent Mercer KO), D7-39 (a hostile Mercer left standing).
- **2i recurring bugs.** "Where do I stand?" stays current at every stage on r21, r22, r26, r27. Late first contact: D7-30. Choices that answer what wasn't said: D7-8, D7-13, D7-15, D7-24, D7-25. The same fact twice: D7-6, D7-7, D7-14, D7-32. Credit and debrief lines against every route: D7-4, D7-9.

## Route quotes a fix would break

| Fix | Route | Assertion |
|---|---|---|
| D7-1 | all 27 | the debrief steps need picks for the eight new beats; the `maxRun` guard of 66 should drop to 9 |
| D7-7 | r2 | `said` "The team not moving is a separate sentence" |
| D7-14 | r24 | `said` "Five minutes. Say the other two out loud." (the bark) |
| D7-14 | r2 | `said` "Ten minutes, and your team is too committed to move" (T-10's line) |
| D7-22 | r14 | `said` "There you are." on the sighting after the clone |
| D7-23 | r14 | `notSaid` "[choice] Keep him on the money" (passes trivially after the change; update it) |
| D7-3 | r6, r7 | none break; add `notSaid` "You've sent your team." after the T-10 call |
| D7-8 | 14 routes | none break: the new choice keeps the picked substring "Nothing on the record" |

Lines asserted by routes that no fix touches: "contingency board since Thursday", "Frozen or watched", the barks "Ten minutes before your team is too committed to move" and "Agent 0x00.", "Above expectations", "You knew. You found it", "Almost nobody gets there this quickly", "Elena Rodriguez thinks this is a six-hour demonstration" (r23, Elena not turned).

## Prioritised action list

**Should fix**
- D7-1: break the debrief read-out into runs of 9 or fewer (the eight beats above).
- D7-2: put the dark read-outs in the tense of a debrief four hours in.
- D7-3: T-20 retires on T-10, with its naming line folded in (C4).
- D7-4: the stance question for a player who never sent the team.
- D7-5: fold HaX's hub to 9.

**Polish**
- Every minor. In order of payoff: D7-11 (C3), D7-12 (C6), D7-13 (F10), D7-9, D7-6, D7-7, D7-14, D7-33, D7-34, D7-16, D7-22, D7-24, D7-25, D7-27, D7-28, D7-37, then the rest.

## Spoken lines this review would change

All are listed with old → new wording in the tables above. No m07 audio exists, so nothing costs anything to re-voice. The fixer should still keep the old → new list in the log, as the earlier rounds did. Four erb text fields are touched (the barks, D7-14; a credits line, D7-40; the intercept, D7-41, optional; Elena's voice style, D7-26); re-read each region before editing, because a room-dressing agent may be working in the same file.
