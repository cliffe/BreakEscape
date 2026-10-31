# m06 Follow the Money: dialogue review, pass 5 cycle 2

Reviewer: a fresh Opus agent, read-only, 2026-10-13. Skill: `npc-dialog-review`, run in full. Aim: a SAFETYNET campaign mission, judged as a TV spy thriller (`docs/agents/M06_PASS_BRIEF.md`). Read beforehand: `AGENTS.md`, `README_ink_best_practices.md` (gotchas 0a and 0b included), `DIALOGUE_REVIEW_P5_C1.md`, and the log section "Phase 4 dialogue, cycle 1" (commit 51fdf1b1). I did not open the SecGen XML, the four listed field guides, or the exploit detail in `VM_INTEGRATION.md`.

The ink folder has no uncommitted changes since 51fdf1b1, so this review tests exactly what cycle 1 committed. `tts_cache/m06_follow_the_money/` is still empty, so none of the rewrites below costs a re-voice.

New finding ids continue from cycle 1: D6-45 onwards. Tags are **blocker**, **major** and **minor**. Everything is mission-local unless marked. erb line numbers are as read today; another stage is editing `scenario.json.erb`, so find erb lines by their text.

## Step 1: compile, lint, routes, runtime

- **Compile.** All nine files compiled into the scratchpad (`m06-dialogue-c2-review/json/`) with no errors and no loose-end warnings. The compiled JSON is identical to the committed JSON for all nine files.
- **Routes.** All 27 pass (`route.js`): each ends `[result] all expectations met`, with `maxRun` 9 asserted on every route. The longest run on any route is 9: the debrief on r6, r21, r24 and r25, and Irina on r3. Satoshi peaks at 8 and the briefing at 8.
- **dialoguelint.** `Totals by rule: none`. The longest line is 27 words.
- **reopencheck.** m06 HaX phone: 1800 reopens, 1366 re-runs, 0 problems. No walk replayed the opening.
- **tagdiff `--old`** against the snapshot (`…/scratchpad/m06-dialogue-snapshot/ink/`): debrief 37, Irina 19, Dani 15, Satoshi 12, Priya 10, phone 9, briefing 4; guard and Kemal unchanged. These counts match the cycle-1 log exactly. I read every difference, and each one maps to a row in the log's table or to its "found while fixing" notes. The new trust gain in `evidence_pivot`'s first case (`irina_trust += 15`, tag directly after, on a spoken line) is the r27 re-route. Nothing is unexplained.
- **Gotcha 0a scan** (script over all 142 multi-line conditionals in the nine files): **no comment sits between a `{` and a first `- case:` line.** The scan flagged two blocks, and neither is a case list: debrief `fca_letter` :411 and guard `start` :33. Both are single-condition `{cond:` blocks whose body opens with a comment. Both bodies run: "One more thing…" prints on 19 of the 27 routes.
  - **Note for the orchestrator (not a finding):** I could not reproduce gotcha 0a in isolation. With `bin/inklecate`, a `//` comment between `{` and the first case gives byte-identical JSON to the same block without it, whether the comment is flush, indented, `/* */`, followed by a blank line, or a copy of the old `evidence_pivot` text. The first case printed every time. The README's 0a may describe a different trigger from the one the fixer saw. Re-check it before other missions build on it. Keeping comments above the `{` costs nothing either way.
- **Validator** (`--skip-ink --no-graph`): no errors. It gives the same 20 duplicate-mapping notes on HaX as cycle 1 (known noise). Nothing dialogue-facing is new.

## Confirmation of cycle 1 (D6-1 to D6-44)

Each row was checked against today's ink, by reading the line and grepping for the old text. All the cut lines are gone: "choose how you lose", "no head to cut off", "outlive", "find out what it cost", "Bold.", "deckchairs", "Casualties are inevitable", "philosophy, do you", "midwives", "status quo", "Time will tell", "door only opens", "Both of them", "Her loyalty held", "Eight hundred million" and "German-accented" all return 0 matches.

| # | Outcome in the log | Confirmed? | Note on the fixer's departures from the review wording |
|---|---|---|---|
| D6-1 | fixed | **Yes** (`irina:470-476`) | As proposed. The new beat is good. |
| D6-2 | fixed | **Yes** (`irina:394-403`) | As proposed. "Don't tell me yet." is a fine piece of subtext, but nothing pays it off: see D6-55. |
| D6-3 | fixed | **Yes** (`debrief:315-324, 392-401`) | Better than the review's "[He'll be doing that at the trial.]". The extra trims (one line per asset outcome, one strained-cover line) read cleanly. One new problem: "[I was there. Just the letter.]" names a letter HaX hasn't mentioned yet (D6-46). Longest debrief run is 9. |
| D6-4 | fixed | **Yes** (`debrief:397`) | As proposed. |
| D6-5 | fixed, placed differently | **Yes** (`trader:84-98`, `analyst:98-109`) | The move to the hub's re-entry line is right (gotcha 0b), and "detained" is better than the review's "taken out". One hole remains: a **first** meeting after Irina's fate still opens on "we're legit. Mostly." (D6-53). |
| D6-6 | fixed | **Yes** (`irina:203-231`) | Order only. Conditions unchanged (tagdiff shows no choice change in the hub). |
| D6-7 | fixed | **Yes** (`satoshi:495-518, 574-576`) | As proposed. The same pattern has come back on the freeze branch, though (D6-45). |
| D6-8 | fixed | **Yes** (`debrief:205, 373, 376`) | As proposed. "That's in the report too." at `debrief:240` is now left with nothing for "too" to refer to (D6-49). The new :376 contradicts :367 (D6-47). |
| D6-9 | fixed | **Yes** (`irina:495-501`) | As proposed. |
| D6-10 | fixed | **Yes** (`irina:513`) | |
| D6-11 | fixed | **Yes** (`irina:343`) | |
| D6-12 | fixed | **Yes** (`irina:635`) | "Ask, then." is a sound swap, for the reason given. |
| D6-13 | fixed | **Yes** (`minder:55, 137`) | "Moin." and "Na gut." are both idiomatic, and two uses is the right dose. |
| D6-14 | fixed | **Yes** (`minder:131`) | |
| D6-15 | fixed | **Yes** (`minder:154`) | |
| D6-16 | fixed | **Yes** (`minder:148`, `debrief:338`) | "Thirty years" is now spoken twice, in two different mouths (Kemal :123, and Satoshi :72 on the KO route only). The third match is the voice style. That's fine. |
| D6-17 | fixed, reworded | **Yes** (`satoshi:152`) | The reason for avoiding "invoice" holds. But on the no-fund route, :152 and :155 now make the same point back to back (D6-57), and no route plays this line (D6-65). |
| D6-18 | fixed, plus a new line | **Yes** (`satoshi:166-168`) | The insulin line is the best argument he has. Keep it. |
| D6-19 | fixed | **Yes** (`satoshi:187`) | |
| D6-20 | fixed | **Yes** (`satoshi:262`) | The line two above it (:216) still talks about a detained or knocked-down Irina in the present tense (D6-59). |
| D6-21 | fixed | **Yes** (`satoshi:274-300`) | Checked through the reopen path: an in-session reopen re-enters `choice_presentation` with `hub_quiet` already cleared, so the one-liner plays. r26 covers this across reloads. |
| D6-22 | fixed | **Yes** (`satoshi:317`) | "neither is the money" contradicts :310, "The money doesn't wait" (D6-60). |
| D6-23 | fixed | **Yes** | Cut. |
| D6-24 | fixed, shortened | **Yes** (`satoshi:366`) | |
| D6-25 | fixed | **Yes** (`satoshi:373`) | |
| D6-26 | fixed | **Yes** (`satoshi:393`) | |
| D6-27 | fixed | **Yes** (`satoshi:409`) | |
| D6-28 | fixed, differently | **Yes** (`satoshi:547`) | Better than the review's version. |
| D6-29 | fixed | **Yes** (`satoshi:601`) | |
| D6-30 | fixed | **Yes** (`analyst:212`) | Priya's "Same habit" now echoes Dani's "same habit" at `trader:240` (D6-54). |
| D6-31 | fixed, reworded | **Yes** (`debrief:379-381`) | The rewording is right: the review's "asked you" needed a global that doesn't exist. |
| D6-32 | fixed | **Yes** (`trader:100`) | |
| D6-33 | fixed, plus a third case | **Yes** (`phone:125-133`) | The guard-KO case is a good catch. |
| D6-34 | fixed | **Yes** (`phone:391, 671`) | The new :671 lands straight after "Start there." (D6-62). |
| D6-35 | fixed | **Yes** (`debrief:413-417, 465`) | The `else` verdict is only ever reached with exactly one right answer, since there are only two wrong options, so "One of those would stand up" is always true. |
| D6-36 | fixed | **Yes** (`debrief:516-521`) | |
| D6-37 | fixed | **Yes** | Knot gone; three diverts go to `final_assessment`. |
| D6-38 | fixed | **Yes** (`debrief:224`) | |
| D6-39 | fixed, edge left | **Partly** (`debrief:342-345`) | The ":154" cut and the ":553" line are in. The minder line still misreports two routes, not one (D6-63). |
| D6-40 | fixed | **Yes** (`phone:356`) | |
| D6-41 | fixed | **Yes** (`irina:92, 197, 632`) | |
| D6-42 | fixed | **Yes** | tagdiff shows all five locals and their writes removed. No new set-but-unread local found. |
| D6-43 | fixed (deleted) | **Yes** | The fixer's reason holds: it would have doubled the finale's handcuffs line. |
| D6-44 | left | **Rightly left** | `cell_disruption` gives the outcome on the "Start with the fund." route, and r1's transcript reads complete without it. |

Summary: 42 are confirmed fixed, D6-44 was rightly left, and D6-39 is only partly closed. Six fixes left small new problems behind them, logged below as D6-46, D6-47, D6-49, D6-54, D6-60 and D6-62. None of those is above minor.

## Severity table (new findings)

Counts: **0 blockers, 1 major, 21 minors.** No lint finding needed withdrawing, because the lint was clean.

### Major

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-45 | major | `m06_satoshi_confrontation.ink:367-371, 384, 498` (and :330 when asked) | On the freeze branch, Satoshi makes one point, "your freeze recruits for me", four times in about ten lines. First "That's the state I've been warning people about. You just proved it for me.", then "Thank you. That'll recruit better than anything I could write.", then "And everyone on the fence just climbed down on my side.", then "And the frozen wallet will be on every forum by morning." (r1 transcript). This is the same class of problem as D6-7, now on the other branch. A man with an argument says it once and moves on. Said four times, it reads as a sneer. | Cut :371. Change :384 to `Satoshi Nakamoto II: The balances, sure. The advances went out a week ago, and nobody's asking for them back.` Keep :369 (the argument), :393 (his answer to the casualty trade) and :498 (the closer). The point then lands at most twice, and :498 lands as the last word. |

### Minors: the debrief

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-46 | minor | `m06_closing_debrief.ink:399` | "[I was there. Just the letter.]" asks for a letter HaX hasn't mentioned yet. It first appears at :414/:416, after this choice. Nothing earlier in the mission names it (grep "letter": no other spoken match). A choice that answers what wasn't said. | `+ [I was there. Skip it.]` and keep the reply at :400 ("Short version, then. They left every link open."). "One more thing…" then introduces the letter, as on the other branch. |
| D6-47 | minor | `m06_closing_debrief.ink:376` after `:367` | "None of them knew what HashChain was." follows straight on from "Okonkwo flagged those wallets before we ever did". Dani flagged a wallet with ENTROPY in its address (`trader:242`), and Priya told the player "I think Irina knows more than she says". So the two adjacent lines contradict each other. | `Agent HaX: None of them were in on it.` |
| D6-48 | minor | `m06_closing_debrief.ink:367, 370` | "…and got knocked down for it." ends both lines, back to back, when both staff are down (r25). | `:370` → `Agent HaX: Raghavan drew us the money, and woke up on the lab floor.` |
| D6-49 | minor | `m06_closing_debrief.ink:240` | "That's in the report too." used to follow other "in the report" lines. D6-8 removed those, so "too" now refers to nothing. | Cut the sentence: `Agent HaX: She went down on the trading floor after you'd detained her. The police carried her out.` |
| D6-50 | minor | `m06_closing_debrief.ink:569`; erb credits last line | "[What's next?]" gets "Some of them are already paid for.", and the credits then close on "72 hours. Six cells. Some of them were already paid." The player reads the stinger twice in two screens. This is the other half of D6-39's doubled ending. | `Agent HaX: We find out which of them moves first, and get there before it does.` The credits keep the stinger. |
| D6-51 | minor | `m06_closing_debrief.ink:276-283` | When the player both took the badge and read her notes, two lines in a row open with "And" (:276 or :279, then :283). r24 hears "And you cloned…" then "And you read her notes first.", and r25 hears "And she lent you…" then "And you read…". | `:283` → `Agent HaX: Reading her notes first was good work. Know what they've already told themselves.` |
| D6-52 | minor | `m06_npc_minder.ink:146`; `m06_satoshi_confrontation.ink:65`; `m06_closing_debrief.ink:358`; erb texts `:912`, `:1268`, `:1280` | The cycle-1 review counted "never heard of you" as a tic, but gave it no id, so it was never fixed. A route where the guard catches the player hears it four times: the text, then Kemal, then Satoshi, then the debrief. | Keep the texts, which are the cause. Kemal: `Kemal Aydin: Mr Nakamoto's phone has been ringing about you. The FCA has no file on you.` Satoshi: `Satoshi Nakamoto II: Somebody here rang the FCA tonight. You're not on their books.` Debrief: `Agent HaX: Your cover didn't last the night. HashChain rang the FCA, and that might cost us the next job.` |
| D6-66 | minor | `m06_closing_debrief.ink:102-107` → `:153-154` | The other side of D6-44. On the "[What does it give us?]" → "[What's left of that clock?]" route with the watch choice (r2), HaX says "You let it run. When the payout goes, every wallet it reaches gets tagged." Six lines later, `cell_disruption` says "Every cell that took a payout is on our map, and they don't know it. They'll have the money in three days." That's the same outcome twice, and the clock twice ("Seventy-two hours" at :94). | In `cell_disruption`'s `else`: `{operation_disrupted: Agent HaX: They don't know we're watching. Whatever the money buys goes ahead unless we get there first. - else: (the current two lines)}`. A knot visit count is safe here, because the debrief is one sitting. |

### Minors: Satoshi

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-57 | minor | `m06_satoshi_confrontation.ink:152` then `:155` | No-fund route. "People die when systems change. They die when they don't, too. You just never count yours." is followed at once by "Here's my question. How many die keeping the current system running?" That's the same argument twice in a row, D6-18's problem coming back. If the player then picks "[Nothing justifies this.]", the insulin line makes the point a third time. | `:152` → `Satoshi Nakamoto II: You haven't seen the numbers. I have. They're smaller than you'd think.` The question at :155 then lands as his argument, and :168 as its example. |
| D6-58 | minor | `:124`, `:126`, `:148` | "You mapped the network. Impressive." and, a choice later, "You found the allocation. Thorough." are two stock one-word compliments in one scene. :126 says "guess" and then "guessed" in consecutive sentences. | `:148` → `Satoshi Nakamoto II: You found the allocation.` `:126` → `Satoshi Nakamoto II: You haven't found my wallet. But you've seen enough of my exchange to guess.` |
| D6-59 | minor | `:216` → `:258-260` | With Irina detained or knocked down, "[Privacy has honest uses…]" still gets "At least, Irina thinks so. She's been having... moral difficulties." and "She built it for an idea and doesn't like what the idea costs.", both in the present tense. The finale a minute later knows she's in handcuffs or on the carpet. D6-20 fixed only the question at :263. | In `corrupted_ideals`, add a case before the `else`: `- irina_arrested or irina_ko:` / `Satoshi Nakamoto II: Irina thought so too. Look where it got her.` / `-> choice_presentation`. |
| D6-60 | minor | `:310` vs `:317` | A player who defers twice (no fund, then fund but no keys) hears "The money doesn't wait, but I can." and later "I'm not going anywhere, and neither is the money." The second contradicts the first and the 72-hour clock. | `:317` → `Satoshi Nakamoto II: The vault account. Of course. Go on. I'm not going anywhere. The money is, in three days.` |
| D6-61 | minor | `:420` then `:502` | Watch branch, "[We'll take apart the whole network that way.]": "your map goes stale" and, four lines later, "Enjoy the map while it's fresh". The closer is weaker for having just been said. | `:420` → `Satoshi Nakamoto II: Maybe. Cells move house. We've done it before.` |

**Does Satoshi now read as a man with an argument?** Mostly, yes. The rewritten lines carry a position, not a sneer: "Look, every crash so far, the banks got rescued and everybody else got the bill. This time I'd like to choose who pays.", "Everything justifies something. You just don't like my arithmetic.", the insulin line, "We costed it so it stays small. That's what a number is for.", "You won't agree. You work for the people who'd lose the most if I'm right.", and "Murder's what they call it when you lose. The winners get statues." His one rhetorical contrast ("You'd call it laundering…") is within the guide's allowance. What still pulls him back towards a stock villain is repetition (D6-45, D6-57, D6-61) and the two one-word compliments (D6-58). Each new line works on its own.

**Accent touches.** Satoshi's American markers are natural and light: "Look," once, "Here's my question.", "waiting on your police", "You want to argue some more", and "Sure." three times (:129, :382, :563). Three is the limit: don't add a fourth. Kemal's "Moin." (first meeting, unsighted) and "Na gut." (after Volkova's call) are idiomatic Hamburg, and his contraction-free English carries the rest. Dani's "innit", "Safe. Er…" and "Rammed", and Priya's "me", "nowt" and "Ta", are unchanged and still right.

### Minors: Irina, Dani, Priya, HaX's phone

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-53 | minor | `m06_npc_trader.ink:32-52`; `m06_npc_analyst.ink:34-55` | The rest of D6-5. The reactions sit in each hub's re-entry line, so a player who detains or knocks down Irina **before ever talking to Dani** gets Dani's normal first meeting: "Don't worry, we're legit. Mostly.", then "Irina makes sure." Irina is in handcuffs two desks away. Priya's first line is "If you're here about the flagged transactions, talk to Irina." This is reachable: Priya's write-up and the fund don't need Dani, and an early KO is r18's route. | Dani: wrap :38-40 in `{irina_arrested or irina_ko: Dani Okonkwo: You're the regulator? Is this about Irina? *glances at her desk* I don't know anything. Honestly. - else: (the two current lines)}`. Guard the "[Mostly?…]" choice with `{not irina_arrested and not irina_ko}`. Set `irina_news` to the matching level (3 KO, 2 taken, 1 detained) so the hub doesn't react again. Priya: `{irina_arrested or irina_ko: Priya Raghavan: *doesn't look up* If you're here about Irina, I just draw the pictures.\|(current :40)}`, skip :42 in that case, and set `irina_news` the same way. |
| D6-54 | minor | `m06_npc_trader.ink:240`; `m06_npc_analyst.ink:82, 212` | Dani says "Big round sums going in late at night. Same wallets, same habit." Priya says "Big round sums, always late in the evening." and "Same habit every time." Two witnesses agreeing is the design, but here they share whole phrases, which reads as copy. | Dani `:240` → `…Big round sums going in late at night. Same wallets, like clockwork.` |
| D6-55 | minor | `m06_npc_irina_volkova.ink:443-445` → `:467-471` | On the route where the fund is found before the write-up is shown (r1), Irina reacts to the deaths three times in four lines: "They costed the deaths…", then "I told myself this was about privacy… Not... this.", then the credentials narration, then "My work. Used to kill people." `evidence_pivot`'s fund branch always continues into `reveal_identity`, so the doubling happens every time. Separately, her D6-2 subtext ("You're not from the FCA. ...No. Don't tell me yet.") is never paid off when the player then tells her. | Cut `:445` (that branch only; the write-up-only branch keeps its own version at :450). In `reveal_identity`, after the credentials narration: `{shown_signature: Dr. Irina Volkova: I asked you not to tell me.}`. The run becomes "They costed the deaths…" → credentials → "I asked you not to tell me." → "My work. Used to kill people.", which escalates instead of repeating. It holds on the direct-reveal route too: credentials → "I asked you not to tell me." → the fund narration → "*reads it twice*…". |
| D6-56 | minor | `m06_npc_irina_volkova.ink:419` then `:437` / `:449` | The narration says "all of it through the mixer she wrote", and her reply in every branch then says it again ("All of it through my mixer" / "It went through my mixer"). | `:419` → `Narrator: You lay Priya's write-up on her desk. Money in from the cells, money back out.` |
| D6-62 | minor | `m06_phone_agent_0x99.ink:670-671` | D6-34's replacement ("The password you have is the place to start.") lands straight after "…share a service account. Start there.", so "start" ends two lines running. | `:671` → `Try the password you already have.` |
| D6-64 | minor (not voiced) | `m06_npc_irina_volkova.ink:203, 209`; `m06_npc_trader.ink:106` | Choice text mixes "Dr. Volkova" and "Dr Volkova" (`irina:122, 486`; `analyst:51`; `minder:66, 82`; guard). UK style, and the majority, is "Dr" with no full stop. The `Dr. Irina Volkova:` prefix must stay as it is, because it's the displayName. | `[I need an answer, Dr Volkova.]`, `[There's something you need to see, Dr Volkova.]`, `[What's Dr Volkova like to work for?]`. |

### Minors: Kemal's precedence (the D6-39 edge) and route coverage

| # | Sev. | File:line | Finding | Concrete rewrite |
|---|---|---|---|---|
| D6-63 | minor | `m06_closing_debrief.ink:342-345`; `m06_satoshi_confrontation.ink:75-76`; erb credits `:212` | The D6-39 edge, and a second one the log didn't list. (a) The player talks past Kemal with the FCA line, then strains the cover (a staff KO, or a second console strike) with Irina turned. The debrief then says "His minder took Volkova's word for you…". (b) The cover holds, Kemal catches the player picking Satoshi's door (`saw_picks`; a minder catch doesn't strain the cover, erb `:905-1336`), and Volkova vouches. The debrief then says "His minder let you walk in. I'd like to hear what you said to him.", the credits say "Talked your way past him", and Satoshi says "you must have been convincing". `cover_strained`, `irina_recruited` and `minder_challenged` can't tell these routes apart, so it needs a global. | **New synced global `minder_vouched`.** (1) erb `globalVariables`: `"minder_vouched": false,` next to `minder_passed`. (2) `m06_npc_minder.ink` `irina_vouches`: `#set_variable:minder_vouched=true` after `#set_variable:minder_passed=true`, plus `VAR minder_vouched = false` in the synced block. (3) Debrief: `VAR minder_vouched = false`; replace the case `- minder_passed and cover_strained and irina_recruited:` with `- minder_vouched:` (same position and line). (4) Satoshi: `VAR minder_vouched = false`; a new case before `- minder_passed:`: `Satoshi Nakamoto II: Kemal rang Irina, and she vouched for you. So that's where she's gone.` This also sets up his "That's why she betrayed us, isn't it?" at :213. (5) Credits: add `&& !globalVars.minder_vouched` to the "Talked your way past him" condition, and a new entry `KEMAL AYDIN (MINDER): Let you in on Volkova's word` with `globalVars.minder_vouched && !globalVars.minder_hostile && !globalVars.minder_ko`. KO and hostile still take precedence, as they do now. |
| D6-65 | minor (test gap) | `scripts/ink_runtime_check/m06_routes/` | No route plays Satoshi's no-fund `casualties_discussion` (grep across all 27 outputs: "never count yours" has 0 matches), so D6-17's rewrite and D6-57 are untested. No route covers either D6-63 edge either. | Add `r28_kemal_vouch_edges.json`: (a) talk past, then knock Dani down, Irina turned, debrief and credits; (b) cover held, picks caught, Volkova vouches, then Satoshi's opener, debrief and credits. Add `r29_no_fund_satoshi_casualties.json`: reach Satoshi without the fund, pick "[You're funding ENTROPY…]" then "[You're paying for people to die.]" then "[Nothing justifies this.]", and assert `notSaid` on the doubled argument. |

## The debrief, heard end to end

I read the debrief as a player would hear it on four routes: r1 (cover held, turned, freeze, every optional beat), r24 (watch, strained, two KOs, turned then down), r25 (freeze, three staff KOs, detained, Satoshi KO'd), and r2 (strained, detained, watch).

- **Pacing.** This is now right. The longest run is 9, and the player gets a choice roughly every 6 to 8 lines. The two new beats work: "[He'll be making speeches at the trial.]" / "Let him. The jury will have the allocation." is a real exchange, and "[Walk me through it.]" lets a player skip the VM recap without losing the FCA letter. The shape is sound: fund, cells, Volkova, Satoshi, the exchange and the minder, the cover and the staff, flags, letter, evidence, The Architect, the worry, sign-off. The tail from the letter's verdict to the end now runs about 5 lines between choices, and "Get some rest. Keep your phone on." is a good last line.
- **Tone.** HaX is dry and personal where it counts: "Someone took a photo. I've been asked not to circulate it.", "The guard on the checkpoint has a wife who wants to know why he's in A&E.", "...I was one of his students." The summary lines no longer lecture. The one place the tone slips is the staff block on a heavy-KO route. Two identical "got knocked down for it" endings (D6-48) and a closing line that contradicts the first (D6-47) make it read like a mail merge.
- **Repetition across the debrief.** "Already paid" comes three times, including the credits (D6-50). "Every cell" opens four lines (:78, :128, :153, :329), which is tolerable. The safe gets a pre-echo in "Did he give anything up?", but that reads as set-up, not repetition. The strained route still hears "never heard of you" for the fourth time (D6-52).
- **Outcome truth.** Every branch I walked agrees with the credits, except the minder line on the two D6-63 routes.

## Five best lines

1. HaX, `m06_closing_debrief.ink:293`: "Someone took a photo. I've been asked not to circulate it."
2. Satoshi, `m06_satoshi_confrontation.ink:203`: "Look, every crash so far, the banks got rescued and everybody else got the bill. This time I'd like to choose who pays." (Cycle 1's brief to the fixer in one line: an argument, not a gloat.)
3. Kemal, `m06_npc_minder.ink:123`: "Thirty years I guarded banks for men in good suits. Then I guarded this one for a man in a hood. The paperwork is always the same."
4. Satoshi, `m06_satoshi_confrontation.ink:547`: "Murder's what they call it when you lose. The winners get statues."
5. Irina, `m06_npc_irina_volkova.ink:521`: "You're giving me time. Nobody in this building has ever done that."

Close behind: Kemal's "*takes off his watch and pockets it* Then come and move me.", HaX's A&E line, Satoshi's insulin line, and Irina's "*quietly* You're not from the FCA. ...No. Don't tell me yet." (better still once D6-55 pays it off).

## Five worst lines

1. Player, `m06_closing_debrief.ink:399`: "[I was there. Just the letter.]" It asks for a letter nobody has mentioned. (D6-46)
2. HaX, `m06_closing_debrief.ink:376`: "None of them knew what HashChain was.", one line after "Okonkwo flagged those wallets before we ever did". (D6-47)
3. Satoshi, `m06_satoshi_confrontation.ink:371`: "Thank you. That'll recruit better than anything I could write." It's the second of four versions of one point. (D6-45)
4. Irina, `m06_npc_irina_volkova.ink:445`: "I told myself this was about privacy. Financial freedom. Not... this.", sitting between "They costed the deaths" and "My work. Used to kill people." (D6-55)
5. HaX, `m06_phone_agent_0x99.ink:671`: "The password you have is the place to start.", straight after "Start there." (D6-62)

Close behind: Satoshi's "You've seen enough of my exchange to guess. You haven't found my wallet, but you've guessed." (D6-58), and Dani's "we're legit. Mostly." with Irina in handcuffs two desks away (D6-53).

## Is another cycle worth it?

**Yes, one more, and it should be short.** Cycle 2 found 1 major and 21 minors, against cycle 1's 6 majors and 38 minors. The major (D6-45) is a two-line cut. Most of the minors are one-line rewrites, and five are small debris from cycle 1's own fixes. Only D6-63 touches structure: the new global, one erb `globalVariables` entry and one credits entry. The erb edits must be small and exact, because another stage is editing the file.

Suggested scope for cycle 3:
- Fix D6-45 to D6-64 and D6-66.
- Add r28 and r29 (D6-65).
- A reviewer confirms with the routes, the lint and `tagdiff`.
- Close the stage if that round finds nothing above minor, after the browser checks cycle 1 left open. Those are still owed: Dani's and Priya's re-entry after a real detention, collection and KO; Irina's badge scene and direct reveal; Satoshi's return after a deferral and a reload; HaX's first call after a catch and after a guard KO. Add Kemal's vouch route.

A fourth writing cycle is unlikely to pay. After these fixes, what's left will be taste, not faults.

## Spoken lines this review would change

None has audio yet. Listed for the fixer's log.

- Satoshi: cut :371. Rewrite :384, :152, :148, :126, :317, :420, :65. New lines in `corrupted_ideals` (D6-59) and the opener (D6-63).
- HaX debrief: :376, :370, :240, :569, :283, :358, and a new watch-branch line in `cell_disruption` (D6-66).
- HaX phone: :671.
- Kemal: :146.
- Irina: cut :445. New "I asked you not to tell me." Narration :419.
- Dani: new first-meeting line (D6-53); :240.
- Priya: new first-meeting line (D6-53).
- Choices (not voiced): debrief :399; Irina :203, :209; Dani :106.
