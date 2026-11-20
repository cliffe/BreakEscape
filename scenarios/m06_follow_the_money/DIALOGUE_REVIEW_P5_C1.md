# m06 Follow the Money: dialogue review, pass 5 cycle 1

Reviewer: fresh Opus, read-only, 2026-10-13. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission judged as a TV spy thriller (`docs/agents/M06_PASS_BRIEF.md`). Gold standard: m04 after its three dialogue cycles, and m03. Alignment, puzzle chains and scenario design are closed and not re-raised unless a line regressed. The SecGen XML, the four listed field guides and the exploit detail in `VM_INTEGRATION.md` were not opened.

`tts_cache/m06_follow_the_money/` is empty, so no rewrite below costs a re-voice yet.

**Snapshot for `tagdiff --old`:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/d6b8f541-8b07-49dd-af31-499f27c257e9/scratchpad/m06-dialogue-snapshot/ink/` (nine `.ink` and nine `.json`), taken at commit `7a1a829a`, with no uncommitted changes in the ink folder (`COMMIT.txt` beside it).

Finding ids `D6-n`. Tags: **blocker / major / minor**. Everything is mission-local (ink, or the erb's dialogue and text fields) unless marked.

erb line numbers are as read during this review. `scenario.json.erb` was being edited by another stage (room dressing) at the same time, so re-find erb lines by their text.

## Step 1: compile, validator, lint, runtime

- **Compile.** All nine files compile into the scratchpad with no errors and no loose-end warnings. The compiled JSON matches the committed JSON for every file, so the routes test exactly this ink.
- **Validator** (`--skip-ink --no-graph`): no blockers. Every `Name:` prefix resolves to an id or displayName (checked separately by script over all nine files). The one non-resolving "prefix" is phone :348 `The wallet is still yours to decide: freeze it…`, a sentence with a colon; it renders as plain text (D6-40). Dialogue-facing warnings: the three repeatable person-chat cutscenes (the guard's and Kemal's sight and lockpick challenges, decided in alignment), and 20 duplicate-mapping notes on HaX (known noise). The credits notes (all-conditional sections) belong to scenario design.
- **Voices.** Every speaking NPC has a voice block with an explicit accent and "consistent … throughout". The cast spans RP (HaX, Netherton, Nightshade), South London (guard), Peckham (Dani), Leeds (Priya), Russian (Irina), Hamburg German (Kemal) and San Francisco (Satoshi). No voice name is shared between characters who appear together (Aoede is HaX in three contexts).
- **dialoguelint:** no findings in any file (`Totals by rule: none`). Max line length 27 words.
- **reopencheck:** m06 HaX phone, 1800 reopens, 0 problems.
- **Routes, all 23** (`route.js <file>`): every one ends `[result] all expectations met`.
- **Longest run without a choice, per conversation** (worst over the 23 routes):

| Conversation | Longest run | Where |
|---|---|---|
| debrief | **18** (r6, r10); 17 (r3, r12); 14–16 elsewhere | Irina choice → FCA letter (D6-3) |
| satoshi | 10 (r1, r3, r8, r10, r13, r15) | asset reply → "Do you ever wonder" (D6-7) |
| irina | 9 (r3) | suspicious opener through `audit_discussion` |
| briefing | 8 (r1, r2) | `hashchain` |
| phone | ≤5 | – |
| minder, guard, trader, analyst | ≤5 | – |

- **loopcheck** (200 steps × 6 strategies) on every NPC's `currentKnot`, Kemal's `on_sighted` and `on_lockpick_seen`, the guard's `on_lockpick_seen`, Irina's `after_choice` recruited and detained, Satoshi with and without the fund and with Irina KO'd, the phone hub at the call-in with Satoshi KO'd, the debrief with every KO and the strain, and the briefing: no runtime errors.
- **Visit-count openers:** none. Every opener is keyed on a synced global (`exchange_infiltrated`, `trader_spoken`, `analyst_spoken`, `minder_challenged`, `satoshi_confronted`, `guard_waved_through`) or a saved ink local, so nothing replays a first meeting after a reload. The only reload-sensitive read is `TURNS()` in Irina's executive-badge latch (D6-41).

## Severity table

Counts: **0 blockers, 6 majors, 38 minors.** No lint finding needed withdrawing (the lint was clean).

### Majors

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-1 | major | `m06_npc_irina_volkova.ink:222, 443-448` | The hub's `[I'm not from the FCA. I'm SAFETYNET…]` goes straight to "My work. Used to kill people." On r2 she has seen nothing: no write-up, no fund page, no casualty line. Her biggest line answers evidence that was never shown. | In `reveal_identity`, after the credentials narration: `{shown_casualties or shown_architects_fund: Dr. Irina Volkova: My work. Used to kill people. - else: ~ shown_architects_fund = true / Narrator: Then the fund allocation, open at the casualty line. / Dr. Irina Volkova: *reads it twice* I wrote the mixer so nobody could see where money went. Not so nobody could see this.}` |
| D6-2 | major | `m06_npc_irina_volkova.ink:387-393` then `:423-427` | The executive-badge handover has the player show her the fund page "the per-cell lines, then the casualty line, then the signature". She reacts only to the signature ("He thinks it's funny.") and hands over a badge. Two choices later (r10, r5) `evidence_pivot` shows her the casualty projection again, and only then does she say "They costed the deaths." So she reads the deaths twice and reacts once, late. | Keep the casualty line for the evidence scene. At :387 use a new local `shown_signature`: `Narrator: You show her the authorisation line on the fund page, and nothing else.` / `Dr. Irina Volkova: Satoshi's Ghost. He signs the money with that name. He thinks it's funny.` / `{not recruitment_offered: Dr. Irina Volkova: *quietly* You're not from the FCA. ...No. Don't tell me yet.}`. Don't set `shown_architects_fund` there. The subtext sets up the reveal and gives her a reason to hand over the badge. |
| D6-3 | major | `m06_closing_debrief.ink:214-389` | The debrief's longest run without a choice is **18 lines** (r6, r10), 17 on r3 and r12, and 14–16 everywhere else. It runs from the Irina choice through Satoshi, the exchange, Kemal, the cover, the staff and the flags to the FCA letter. This item was deferred to dialogue from alignment, and it is still there. m04 cut its worst run to 7. | Add two player beats and trim one line. (1) After the Satoshi block in `satoshi_aftermath` (:311): `+ [He'll be doing that at the trial.]` → `Agent HaX: Let him. The jury will have the allocation.` / `+ [Did he give anything up?]` → `Agent HaX: {architect_identity_found: Nothing his safe hadn't already told us.\|Not a word about The Architect. That's what his safe was for.}`. Both continue to the exchange lines. (2) Replace the flag lines (D6-4) with a choice after `All four flags in.`: `+ [Walk me through it.]` → the two story lines and the chain line / `+ [I was there. Just the letter.]` → `Agent HaX: Short version, then. They left every link open.` → `fca_letter`. (3) Cut :229 ("The police and the lawyers decide what happens to her now. She knows that."), which adds nothing to :231. The runs become about 7, 7 and 5. |
| D6-4 | major | `m06_closing_debrief.ink:373-376` | The kill-chain line, "Map it, get on it, crack it, reuse it, move sideways, take the keys.", is a six-fragment list straight after two lines that have just said the same steps in prose. That's the same fact twice in a row, and the list is the bullet-dialogue anti-pattern. It's the one place the debrief reads as a lecture. | Keep :373-374 as they are (the story beats per flag). Replace :376 with `Agent HaX: That's the whole chain, from outside to the keys, and they'd left every link open.` This keeps the chain framing from scenario design decision 1 without the list. |
| D6-5 | major | `m06_npc_trader.ink:47-50`; `m06_npc_analyst.ink:52-55`; erb Irina (5,5), Dani (5,7) on `trading_floor` | Dani sits two tiles from Irina. After the player detains her ("*offers her wrists*") or knocks her down, Dani's re-entry opener is still "Hi again. What's up?", and their topics still say "Irina makes sure. Honestly." Priya is next door and says "Need something?". The floor's own staff never notice the night's biggest event. | Declare `irina_arrested`, `irina_taken` and `irina_ko` in both files. Dani's `- else:` → `{ - irina_ko: Dani Okonkwo: Irina's on the floor and nobody's- did you- *stops* Don't answer that. - irina_arrested and not irina_taken: Dani Okonkwo: *barely above a whisper* She's just sitting there. Are you allowed to tell me what's going on? - irina_taken: Dani Okonkwo: They walked Irina out past my desk. Am I next? Honestly, you can tell me. - else: Dani Okonkwo: Hi again. What's up? }`. Priya: `{irina_arrested or irina_ko: Priya Raghavan: Somebody said Irina's been taken out. Was it the graph? Was it my graph?\|Priya Raghavan: Need something?}` |
| D6-7 | major | `m06_satoshi_confrontation.ink:494-579` | The climax ends on a 10-line run (r1, r3, r8, r10, r13, r15) of stacked villain closers. "We'll adapt" (:501) is followed by "The Architect will adapt" (:520). "The idea will outlive her. It'll outlive me." (:506), "ENTROPY has no head to cut off" (:520), "The Architect keeps spares" (:577) and "you'll find out what it cost" (:579) all make the same point four times. Each dilutes the others. | Keep one of each kind. :501 → `Satoshi Nakamoto II: And the wallet you left running? Enjoy the map while it's fresh.` Cut :506 and :520. In `mission_complete`, keep `Call your police, then. I'll wait.` and `You closed one exchange. The Architect keeps spares.` and cut :579. The run drops to about 6, and the line that's left lands. |

### Minors: Irina and Kemal

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-6 | minor | `m06_npc_irina_volkova.ink:198-228` | Deferred item n5. The hub lists the late, story-defining options (the answer, the reveal, the evidence, the executive badge) under the early ones, so at the moment of decision the player reads past passwords, research and door access first. | Ink order only, no tag or condition change: `I need an answer` → `I'm not from the FCA` → `There's something you need to see` → `Satoshi's wing` → `Can I borrow your badge?` → `(Let the cloner read her badge…)` → `password strength` → `Let's start again, properly` → `Tell me about your door access` → `post-quantum work` → `That's all for now.` |
| D6-8 | minor | erb:1273, erb:1282 (both texts), erb:1167; `m06_closing_debrief.ink:205, 241, 358-362` | "That goes in the report" (or "That's in the report") appears seven times. A guard KO gets "The guard was doing his job. That goes in the report" by text, then in the debrief "The guard on the checkpoint was a contractor doing his job. … None of them had done anything wrong. That goes in the report." HaX delivers the same moral twice in near-identical words. | Keep the texts. Debrief :359 → `Agent HaX: The guard on the checkpoint has a wife who wants to know why he's in A&E.`; :362 → `Agent HaX: None of them knew what HashChain was.`; :205 → `And then she went down on the trading floor. I'll be explaining that one upstairs.`; :241 keep. |
| D6-9 | minor | `m06_npc_irina_volkova.ink:466-468` | "I won't turn on Satoshi on the strength of one conversation and a graph." plays on the direct-reveal route, where there was no graph. Both lines replay word for word every time the player returns with "I need an answer". | `{given_time: Dr. Irina Volkova: I said I'd think. I'm thinking. It's slower than you'd like.\|Dr. Irina Volkova: I won't turn on Satoshi because a stranger put a badge on my desk.}` Keep :468 for the first visit only (`{not given_time: …}`). |
| D6-10 | minor | `m06_npc_irina_volkova.ink:479-480` | The back-out "[Then I'll leave you to it. For now.]" gets the reply "For now.", which echoes the player's last two words. | `Dr. Irina Volkova: Don't take too long. He notices when I'm quiet.` |
| D6-11 | minor | `m06_npc_irina_volkova.ink:337-338` | The strained-cover refusal says "Someone on the floor has been asking whether you are who you say you are." When the strain came from Irina's own first suspicion, later repaired, she is talking about herself. A console lockout or a staff KO isn't "asking" either. | `Dr. Irina Volkova: There's been talk about you tonight. Until it stops, my badge stays on my neck.` |
| D6-12 | minor | `m06_npc_irina_volkova.ink:600-601` | A turned Irina greets every reopen with the same "What else do you need?". | `Dr. Irina Volkova: {&What else do you need?\|Still here.\|Quickly. He calls down at odd hours.}` |
| D6-13 | minor | `m06_npc_minder.ink` (whole) | Kemal's voice style is Turkish-German from Hamburg, but nothing in his words places him. He speaks careful, contraction-free English, which is right, but there isn't one word of his own. | A light touch in two places. :55 → `Kemal Aydin: Moin. This floor is closed. Who let you up?`; :137 → `Kemal Aydin: Na gut. Go in.` ("Moin" is Hamburg's greeting at any hour.) |
| D6-14 | minor | `m06_npc_minder.ink:131` | "A short exchange in German-accented English" narrates Kemal's own accent to the player, who can already hear it. | `Narrator: He holds your eye while he dials. A short exchange, then a longer silence on the other end.` |
| D6-15 | minor | `m06_npc_minder.ink:154` | "I hoped you would say that." is a stock heavy's line and wastes the one moment Kemal gets to be physical. | `Kemal Aydin: *takes off his watch and pockets it* Then come and move me.` |
| D6-16 | minor | `m06_npc_minder.ink:123, 148`; `m06_satoshi_confrontation.ink:72`; `m06_closing_debrief.ink:326` | "Thirty years" four times. Kemal says it twice himself on r8 (turned back, then talked past after a reload). | :148 → `Kemal Aydin: I guarded banks that stole politely. He at least says what he is.` Debrief :326 → `His minder's in custody too. He finishes a long career on a corridor floor.` Keep :123 and Satoshi's. |

### Minors: Satoshi

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-17 | minor | `m06_satoshi_confrontation.ink:152` | "Casualties are inevitable in any revolution." is a stock villain line, on the no-fund route. | `Satoshi Nakamoto II: People die when systems change. They die when they don't, too. You just never see the invoice.` |
| D6-18 | minor | `:155` then `:166-168` | "How many die keeping the current system running?" is followed straight away, after "Nothing justifies this.", by "The system you protect kills people too. Slowly, with paperwork." That's the same argument twice in a row. | :166 → `Satoshi Nakamoto II: Everything justifies something. You just don't like my arithmetic.` Keep :168. |
| D6-19 | minor | `:189` | "You don't understand our philosophy, do you?" is filler before his best line (:191). | Cut it. `ideology_discussion` opens on `Whoever controls the money controls the people. We'd like nobody to.` |
| D6-20 | minor | `:269-271` | With Irina knocked down (and neither turned nor detained), he asks "Did you try her conscience? I'd love to know which way she went." A few lines later (:509) he knows she's "on the trading-floor carpet". | Condition :269 `{not irina_recruited and not irina_arrested and not irina_ko: …}`. |
| D6-21 | minor | `:279-295`; r20 lines 205-209 | After a deferral ("Not yet. I'll be back with the recovery keys."), every return replays the full four-line pitch: "Let's talk about my money. / Twelve point eight million… / You could freeze it… / Or you let it run…". After a reload it also gets "Back again." | Add a local `pitch_heard`. On a revisit: `{found_wallet_keys: Satoshi Nakamoto II: You found the keys. So, which is it?\|Satoshi Nakamoto II: Freeze or watch. I'm still waiting.}`, and the full pitch only the first time. |
| D6-22 | minor | `:312` | "I'll be here; the door only opens one way for me now." What this means isn't clear: he isn't detained, and his door isn't locked from outside. | `Satoshi Nakamoto II: The vault account. Of course. Go on. I'm not going anywhere, and neither is the money.` |
| D6-23 | minor | `:329` | "You can't win. You can only choose how you lose." is a stock aphorism, after three lines that already made the point. | Cut it. The scene ends on `Watch it, and you spend a year on surveillance while we move house.` |
| D6-24 | minor | `:363` | "He claps, slowly." is the slow-clap cliché. | `Narrator: He watches the transfer land on your screen, and smiles as if he'd sent it himself.` |
| D6-25 | minor | `:370` | "[The money that hadn't left stays put.]" is awkward to say out loud. | `[Whatever hadn't gone out stays put.]` |
| D6-26 | minor | `:390` | "People tonight over people later." The freeze protects the people on the projection, not anyone "tonight". The trade he means is the projection against the recruits his martyrdom brings. | `Satoshi Nakamoto II: The names on that page over whoever my martyrdom recruits. That's human. Wrong, but human.` |
| D6-27 | minor | `:294` then `:406` | "Patient of you" in the pitch, then "Patient. I didn't expect that from SAFETYNET." as the first word of the watch reply. | :406 → `Satoshi Nakamoto II: You'll let it run. I didn't expect that from SAFETYNET.` and cut :408 ("Bold."), which repeats it. |
| D6-28 | minor | `:548` | "Ask me in fifty years. You might find you were rearranging deckchairs." is a muddled image, and a British one in a San Francisco voice. | `Satoshi Nakamoto II: Murder's what you call it when you lose. Ask the people who wrote your history books.` |
| D6-29 | minor | `:604` | "[I made the right call. Both of them.]" assumes Irina's fate is settled, which it may not be. | `[I made the right call.]` |
| D6-43 | minor | `:256-257` | The `else` branch of `irina_betrayal_reaction` ("She refused you, I presume? Good. Her loyalty held.") is unreachable: the knot is entered only when `irina_recruited` is true (:216-218). | Delete the branch, or reach it from `corrupted_ideals` with `irina_arrested` too, which is a good line wasted: `{irina_arrested: Satoshi Nakamoto II: She refused you, I presume? Good. Her loyalty held.}` |

### Minors: Dani, Priya, HaX, the debrief, structure

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-30 | minor | `m06_npc_analyst.ink:74` → `:196` | "Big round sums, always late in the evening." and the next knot's first line, "Big round sums, late evening, straight into the mixer. Same habit every time.", say the same fact twice in a row. | :196 → `Priya Raghavan: Same habit every time. In, mixed, and gone by midnight.` |
| D6-31 | minor | `m06_npc_analyst.ink:388`; `m06_closing_debrief.ink:352-363` | Priya asks the player, "When you're done, tell me whether I've been helping criminals." The debrief never answers her, though the credits remember her. This is the cheapest reward for curiosity in the mission. | In `cover_and_staff`, `{analyst_walked_through and not analyst_ko: Agent HaX: Raghavan asked you whether she'd been drawing criminals. Somebody from the police will tell her. I'd rather it was you.}` (declare `analyst_walked_through`). |
| D6-32 | minor | `m06_npc_trader.ink:78`, `:102` | The hub choice "[Eight hundred million a day. Is that normal for you?]" quotes a figure nothing in the game gives the player (grep: the ink and the erb have no other "800"/"eight hundred"). Dani then says it straight back. | `[How much goes through here in a day?]` |
| D6-33 | minor | `m06_phone_agent_0x99.ink:118, 123` | The first call asks "How's the FCA cover holding?" and offers "[Holding fine. Nobody's looked twice.]" even after the guard has caught the player picking (`guard_caught` → `cover_strained`; `guard_resolved` stays false). | `+ {not guard_resolved and not cover_strained} [Holding fine. Nobody's looked twice.]` and `+ {cover_strained} [The guard caught me at his door.]` → `Then he'll ring the FCA. Get to Volkova before the answer comes back.` |
| D6-34 | minor | `m06_phone_agent_0x99.ink:299, 383, 663` | "…before anything clever" three times in HaX's mouth, plus the erb flag-1 text saying the same thing. | :383 → `Someone will have reused it. Try it on the other accounts first.`; :663 → `The password you have is the place to start.` |
| D6-35 | minor | `m06_closing_debrief.ink:389, 437` | The letter set-up ignores the strained cover, though "the FCA had never heard of you" was three lines earlier on those routes. The one-or-none verdict, "Their people will be glad you wrote it and not someone from the FCA.", is hard to follow. | :389 → `{cover_strained: Agent HaX: One more thing. The FCA wants to know who was using its name tonight, and it wants a letter. Three findings.\|Agent HaX: One more thing. You were their regulator tonight, and the FCA wants its letter. Give me the three findings that go in it.}`. :437 → `Agent HaX: One of those would stand up. Read it again before it goes.` |
| D6-36 | minor | `m06_closing_debrief.ink:487-494` | The two Tesseract questions return the same two facts (87 per cent; he trained half the field) in reverse order. The choice is flat. | `[One of ours?]` → `Ours. He wrote the training I gave you.` / `[How much weight does his guess carry?]` → `Eighty-seven per cent, by Satoshi's sum. Satoshi doesn't round up.` Each then goes to `tesseract_revelation`. |
| D6-37 | minor | `m06_closing_debrief.ink:531-532` | `mission_conclusion` ("The man in the corner office was Satoshi's Ghost.") restates what Satoshi confessed, HaX texted and the debrief covered 25 lines earlier. On every route it sits between the safe and "Here's what worries me". | Cut the knot; divert `identity_*`, `accelerationism_discussion` and `personal_connection` straight to `final_assessment`. |
| D6-38 | minor | `m06_closing_debrief.ink:224` | "She never looked at what it paid for until you put it in front of her" is false on the notes route ("What have I become?", her own words) and on the direct-reveal route. | `Agent HaX: She'd looked. She just hadn't let herself read it. You made her.` |
| D6-39 | minor | `m06_closing_debrief.ink:329-330`; `:106` vs `:154`; `:550, 553` | "His minder let you walk in. I'd like to hear what you said to him." is wrong when Volkova's phone call got the player past him (cover strained, Irina turned). On the watch route, "You let it run." (:106) is followed within a few lines by "We let it run." (:154). Both final choices end on the same "Some of them are already paid for." | :330 → `{cover_strained and irina_recruited: His minder took Volkova's word for you. That's twice tonight she's put her name to you.\|His minder let you walk in. I'd like to hear what you said to him.}`. Cut :154. :553 → `If they do, we won't get much warning.` |
| D6-40 | minor | `m06_phone_agent_0x99.ink:348` | "The wallet is still yours to decide: freeze it…" puts a colon after six words, so the speaker parser tries it as a name. It renders harmlessly, but it's the shape the prefix check exists to catch. | `The wallet's still yours to decide. Freeze it, or leave it running and watch it.` |
| D6-41 | minor | `m06_npc_irina_volkova.ink:216, 380, 606` | `exec_badge_turn` is a saved ink local, and `TURNS()` resets on a page reload. After a failed give and a reload, the "Satoshi's wing" option stays hidden until the turn count catches up. The give rarely fails, so this is unlikely. | Clear it at the top of `start`: `~ exec_badge_turn = -1` (the latch only needs to last one batch). |
| D6-42 | minor | analyst :10, trader :6, briefing :12-13, satoshi :16 | These locals are set but never read: `analyst_talked`, `trader_talked`, `asked_about_irina`, `mission_accepted`, `ideology_discussed`. | Delete them, or have the briefing's `asked_about_irina` change one line of Irina's opener (it's a natural continuity hook: the "Thirty-seven papers" choice). |
| D6-44 | minor | `m06_closing_debrief.ink:81-84` | "[Start with the fund.]" skips `strategic_impact` and `operation_disrupted`, so the "Depends what you did with the wallet" beat is heard only by players who pick the other opener. `cell_disruption` restates the outcome, so nothing essential is lost. | Leave as is, or fold `operation_disrupted`'s two lines into `cell_disruption` and drop the knot. |

## Does it play like a TV spy thriller?

Mostly. The middle of the mission is the strongest part. Irina's first scene has real subtext: "A supervisory visit. Always a pleasure, I'm sure." Dani's nerves sell the floor ("Safe. Er, I mean, no problem."). Kemal's two speeches give a minder a past in one line each. HaX's phone voice is quick and dry, and leaves the calls to the player ("I'll give you the cost of each. The call's yours.").

It falls short in three places:

1. **The two scenes that carry the moral choices misfire on some routes.** Irina reacts to a casualty projection she hasn't been shown (D6-1), and on other routes she reads it twice and reacts once (D6-2). These are the beats the mission is built around.
2. **The ending talks too much.** Satoshi closes on four versions of "you can't stop us" (D6-7). The debrief then runs 14–18 lines without the player (D6-3) and ends its VM section on a list (D6-4). m04's debrief, after its three cycles, never goes more than 7.
3. **The world doesn't react around the player.** Dani and Priya carry on as if nothing has happened after their CTO is handcuffed two desks away (D6-5). A thriller needs bystanders who notice.

## The pass-5 material

- **Cover strain.** It's well wired. Every cause gets its own text, and the effects are moderate and visible: Irina's harder badge loan, Kemal's refusal, Satoshi's opener, the debrief line and the credit. Satoshi's split opener is the best use of it ("Your paperwork was good. I had you checked anyway. Old habit."). Weak spots: "never heard of you" in four texts and three conversations, so a strained route hears it three or four times; Irina's line, which can describe her own suspicion (D6-11); and HaX's first call ignoring it (D6-33).
- **Kemal.** He's the best new character. "Thirty years I guarded banks for men in good suits…" and "I gave thirty years to banks that stole politely. He at least says what he is." give him an ideology in two lines, and his short replies ("Yes. You will.", "Do not thank me. I only open the door.") are in character. Missing: any trace of Hamburg in his words (D6-13), a better line for when he squares up (D6-15), and some variety on "thirty years" (D6-16). His precedence lines (Satoshi :71-79, debrief :324-333) agree with the credits on every route checked.
- **Irina's collection, refusal and back-out.** The structure is sound: the back-out exists, the detained resting narration ("She sits very still at her desk and doesn't look up. The police are on their way up for her, and she knows it.") is good, and the relays never strand an item. The writing around it is thin. Every return gets the same refusal (D6-9), the back-out's reply is an echo (D6-10), and her detention lines ("This is the state overreach we warned people about." / "All those papers. For this.") are good but are the last thing she ever says.
- **The console strikes.** The texts are tight and escalate well: "One more and somebody's phone goes." / "Somebody's phone just buzzed." / "Now they know where we're looking." The debrief's elimination line ("It logged every slot you tried, so ENTROPY will know exactly where we looked.") makes brute force cost something without lecturing. No changes.
- **The call-in.** It's clean, in m04's shape: "Once you're out, you don't go back in. Whatever you haven't read stays for forensics." / "His safe's still shut, for one." The pointer at the safe is exactly as heavy as it should be. No changes.
- **The debrief's outcome branches.** These are mostly right and well gated: Irina's four states, the freeze/watch payoffs, Satoshi's stance, the minder, the staff, the signing case, the safe. The kill-chain line is the weak point (D6-4), along with the long run (D6-3), the repeated staff moral (D6-8), and one branch that misreports how the player passed Kemal (D6-39).

## Per-NPC voice notes

- **Dr. Irina Volkova** (light Russian, dry, controlled). Her best lines are the guarded ones: "Always a pleasure, I'm sure.", "Exactly backwards.", "Management's response was to stop me running it." She is too accommodating at the turn: she hands over the executive badge with no reaction to what she has just read (D6-2). One line of subtext there would make her the most interesting person in the building. The repeated refusal (D6-9) and the identical re-entry greeting (D6-12) flatten her late scenes.
- **Satoshi Nakamoto II** (San Francisco, amused). The early lines work: the whitepaper narration, "Whoever controls the money controls the people. We'd like nobody to.", "You've costed it. So have I." Nothing in the words sounds West Coast, though, and "deckchairs" (D6-28) is British. Give him one or two American turns ("Here's the thing.", "Look,"). In the second half he slides into stock villain lines (D6-17, D6-23, D6-24, D6-7). He is best when he is calm and specific; he is weakest delivering aphorisms.
- **Kemal Aydin** (Hamburg, courteous, immovable). He has the strongest voice of the new characters and the fewest words, which suits him. He needs one regional marker (D6-13) and a better line for the stand-off (D6-15).
- **Dani Okonkwo** (Peckham, nervy, over-explaining). Fully in voice: "Joking. It's all above board. Irina makes sure. Honestly. Ignore me.", "Legal and that. But… yeah.", "innit". Dani's only gap is the missing reaction to Irina (D6-5).
- **Priya Raghavan** (Leeds, bright, technical). In voice ("Built most of it myself, me.", "for nowt"). Her arc, from "I just draw the pictures" to "That's starting to sound like an excuse.", is the best small arc in the mission, and it deserves its payoff (D6-31). Her method knot (`mixer_matching`) is teaching, but it's short and it's her job, so it doesn't read as a lecture.
- **Checkpoint Guard** (South London, procedural). It works. "IT come in through the back with a ticket number." and "Don't touch the screens; the traders bite." are good. No changes.
- **Agent HaX** (RP, quick, wry). The phone voice is right: short lines, no moralising, and calls left to the player. Watch three verbal tics: "That goes in the report" (D6-8), "before anything clever" (D6-34) and "never heard of you". In the debrief she is at her best in the personal beats ("...I was one of his students.", "Someone took a photo. I've been asked not to circulate it.") and at her worst in the summaries (D6-4, D6-37).
- **Netherton and Nightshade** (briefing). One line each, and both in character. Nightshade's "Money's just another protocol, and this one leaks." is a good handover. No changes.

## Five best lines

1. Kemal, `m06_npc_minder.ink:123`: "Thirty years I guarded banks for men in good suits. Then I guarded this one for a man in a hood. The paperwork is always the same."
2. Satoshi, `m06_satoshi_confrontation.ink:428`: "You've costed it. So have I." (The player's own word, turned back on them.)
3. Irina, `m06_npc_irina_volkova.ink:488`: "You're giving me time. Nobody in this building has ever done that."
4. HaX, `m06_closing_debrief.ink:294`: "Someone took a photo. I've been asked not to circulate it."
5. Dani, `m06_npc_trader.ink:37`: "Joking. It's all above board. Irina makes sure. Honestly. Ignore me."

(Close behind: Priya's "That's starting to sound like an excuse." and HaX's "...I was one of his students.")

## Five worst lines

1. HaX, `m06_closing_debrief.ink:376`: "Map it, get on it, crack it, reuse it, move sideways, take the keys. A whole chain, and they'd left every link open." (D6-4)
2. Irina, `m06_npc_irina_volkova.ink:448`, on the direct-reveal route: "My work. Used to kill people." It's a good line, but here it answers evidence she was never shown. (D6-1)
3. Satoshi, `m06_satoshi_confrontation.ink:329`: "You can't win. You can only choose how you lose." (D6-23)
4. Satoshi, `m06_satoshi_confrontation.ink:520`: "ENTROPY has no head to cut off. The Architect will adapt.", two lines after "We'll adapt." (D6-7)
5. Satoshi, `m06_satoshi_confrontation.ink:152`: "Casualties are inevitable in any revolution." (D6-17)

(Close behind: Kemal's "I hoped you would say that." and Irina's echoed "For now.")

## Structural findings

Skill sections 2a–2i, briefly. Detail is in the table.

| Check | Verdict | Notes |
|---|---|---|
| 2a attribution | OK | Every prefix resolves (scripted check over nine files). Emotes are split by category, and the cue density is close to m01's. Narration is on `Narrator:` with a top-level narrator voice. |
| 2a-bis scenario support | OK, with one note | Geography checked against `connections`: Irina's office west of the floor, the lab east, the data centre north of the server room, the executive wing east of the data centre, Satoshi's office north of the wing. All correct. Satoshi "stands and holds out his wrists" (:492) and Priya "swings the monitor round" (:81) describe movement the sprites won't show. That's acceptable as flavour. |
| 2a-ter voices | CONCERN (minor) | Every block names its accent. Kemal's and Satoshi's words don't carry their accents (D6-13, Satoshi voice note). |
| 2b choice phrasing | OK | First-person throughout. Non-verbal choices are in parentheses. No `You:` echoes. |
| 2c hub integrity | OK | Every person-chat has a sticky exit with a one-line reply. The only hard ends are the briefing and the debrief. |
| 2c-bis starved knots | OK | loopcheck is clean on every entry knot and state tried (Step 1). |
| 2d choices that matter | Mostly OK | The real consequence choices are Irina's opener (trust and the strain), the badge (lend or clone, paid back in the debrief), turn or detain (paid back by Satoshi, the debrief and the credits), freeze or watch (paid back everywhere), Kemal (talk, word, pick or fight; paid back by Satoshi, the debrief and the credits), Satoshi's stance (paid back in the debrief) and the FCA letter (scored). Flat: the Tesseract pair (D6-36). Satoshi's ideology choices converge, which is legitimate for an immovable antagonist, but they set no stance variable; the final stance choice covers that. |
| 2e cross-file state | OK | Every `#set_variable` target is declared in `globalVariables` (scripted check). Five set-but-never-read locals (D6-42). `recruitment_refused` is read only in a hub condition that can no longer show once she is detained, so it's harmless. |
| 2f influence | OK | Every `irina_trust` change carries its tag. The tag never lands on narration (the lint is clean, and :425-427 was checked by hand). Dani, Priya and Kemal have no influence track, which is right for bystanders and a knowledge-gated minder. |
| 2g syntax | OK | No bold, no list dialogue apart from D6-4, and no line starting with `*`. |
| 2h KO writing | OK | Every KO state has its own line in Satoshi, the debrief and the credits, and they agree (routes r4, r6, r9, r10, r21). Nothing assumes a downed NPC is standing, except D6-5 (bystanders don't react) and D6-20 (Satoshi asks about a KO'd Irina). |
| 2i stale status answers | OK | HaX's recap was walked stage by stage against the globals: guard, badge, wordlist, door, write-up, flags 1–4, console, slot help, executive badge, Kemal, safe, signing case, deferral, settled money, call-in. Each line retires at the right step. The first call opened late branches on `guard_resolved`, but not on `cover_strained` (D6-33). |
| Fall-through choices | none | Lint clean. The Dani, Priya and Satoshi openers use `- else:`. |
| Exits with no reply | none | Lint clean, and checked by hand through the diverts (Irina `after_choice`, Kemal's stitches, Satoshi's deferrals). |
| Stage directions printed as text | none | Every `*cue*` sits inside a spoken line. No cue sits on a line that carries a number. |
| Printed variables in voiced lines | none | No `{variable}` is printed in a voiced line. Numbers are fixed text. |
| Visit-count openers | none | See Step 1. Only `TURNS()` in Irina's latch (D6-41). |
| Same fact twice in a row | 5 | D6-4, D6-18, D6-30, D6-32, D6-39 (:106/:154). |
| Repeated phrases across the mission | 3 tics | "That goes in the report" ×7 (D6-8); "never heard of you" ×7 across texts, Kemal, Satoshi and the debrief; "thirty years" ×4 (D6-16); "before anything clever" ×3–4 (D6-34). |

## Prioritised action list

**Must fix:** none. Nothing blocks play, every route passes, and every promise is wired.

**Should fix (degrades the story):**
- D6-1, D6-2: Irina's reveal and badge scenes must react to what she has actually seen.
- D6-3, D6-4: the debrief's 18-line run and the kill-chain list.
- D6-5: Dani and Priya react to Irina's detention or KO.
- D6-7: one villain closer, not four.
- D6-6: n5, Irina's hub order (newest first).

**Worth considering (polish):** D6-8 to D6-44, roughly in this order: the repeated morals and tics (D6-8, D6-16, D6-34), Satoshi's stock lines (D6-17, D6-23, D6-24, D6-28), his repeated pitch (D6-21), Irina's refusal and back-out (D6-9, D6-10), Kemal's accent and stand-off line (D6-13, D6-15), Priya's payoff (D6-31), then the rest.

Before cutting any line, grep the later missions for it: `grep -rn -i "<phrase>" scenarios/m0[78]*/ink/`. Grepped for this review: m07 and m08 don't quote "Satoshi's Ghost", "no head to cut off" or "keeps spares", so D6-7 and D6-37 are safe to cut.
