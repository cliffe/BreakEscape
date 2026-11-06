# m09 stage 3, review round 2: choices and structure

## Scope and method

Reviewer: fresh read-only reviewer, round 2, 2026-10-21. Target: `moral_choices.md` ("MC") as revised after round 1 (its §13). Both lenses: do the choices matter (`npc-dialog-review` §2d), and structure, state and consistency (`mission-puzzle-chains` "are the mission's own choices required").

Read: `docs/agents/FINALE_BRIEF.md`; both skills; MC in full; `REVIEW_R1_CHOICES.md`, `REVIEW_R1_STRUCTURE.md`; `stage_1/story_arc.md` ("SA") Acts 1–3, §7, §8, §11. Canon checked against shipped ink: `m04_critical_failure/ink/m04_closing_debrief.ink` (disclosure branches, `crew_lost`), `m04_opening_briefing.ink:64` (Albion Energy Storage), `m05_insider_trading/ink/m05_phone_recruiter.ink` and `m05_closing_debrief.ink` (the deal, the confession), `m05 scenario.json.erb` exports, `m08_the_mole/ink/m08_closing_debrief.ink:80, :206`, `m08 scenario.json.erb` (tidied, triple agent), m07's Tesseract voice. m10's side by grep of m10 `stage_3/moral_choices.md` ("m10 MC") and FINALE_ARC ("FA"). No VM material opened.

Orchestrator rulings taken as given: the whole-deck price; the double-cross voids the name (she warns WREN, who waits at the core in m10); eleven exports; the F12 voiced clip.

Severity: **blocker** stops stage 4 working from MC; **major** breaks one of MC's five tests or contradicts shipped canon; **minor** is wording, a stale reference or a small state gap.
## Round 1 confirmation

"Resolved" means the fix is in MC and no stale copy remains in MC (grepped for: money, sold her, took her for, his letters, trolley, notice_sent_in_archive, nine years late, do we send, reads her books, private text, Warmer next time, box numbers, finished the job, pull nothing, cage_bin_saved, tran_stopped, sleeper_caught, keeps her job). Stale copies in SA and stage 2 are expected: MC §11 lists them as changes, and I checked each listed one is in the list.

**Choices review**

| ID | Status | Note |
|---|---|---|
| C-01 | resolved, one new risk | Recruiter lines are clean ("Your Architect took my placement…", "tell them"). HaX's new "He's writing in it now" (MC:114) is a bare "he" before the name; see R2-06 |
| C-02 | resolved in intent, open in effect | The double-cross now voids the name and is priced aloud (MC:102, MC:123). The result is underspecified and may now lose to refusing (R2-01), and its timeline and the debrief lines keyed on `sleeper_named` don't fit it (R2-02) |
| C-03 | resolved | "Say no and I wipe it myself. Same deck, no name." voiced; the text and its engine item withdrawn (change 30) |
| C-04 | resolved | Priced as a moral cost ("He'll quote it at you"), which is what m10 MC:332 delivers |
| C-05 | resolved | Cost is her father; the job is gone from the text (MC:278) |
| C-06 | resolved | HaX names what and when (MC:328); the box sits behind her on the feed table |
| C-07 | resolved | Files belong to Sorensen only; Noor carries no loot; warned in time is a pure reward |
| C-08 | resolved, thin payoff | Teresa Villanueva gives the letters a living person; nothing tells the player she was reached (R2-08) |
| C-09 | resolved, wrong timescales | The gain is said before and after; the after-lines compress disclosure into minutes (R2-04) |
| C-10 | resolved | Merge done; Sorensen's list is a debrief line; Old Coyote's radio link cut |
| C-11 | resolved | Tran's price before the button (MC:342) |
| C-12 | resolved | `denied` added, priced in m10 |
| C-13 | resolved | "[Send his notice.]" / "[Not yet.]" |
| C-14 | resolved | "[He kept his own papers off your list. Only yours burn.]" |
| C-15 | resolved | "You read it. You decide. I'll sign whichever." |
| Worst lines 1–5 | resolved | 1 withdrawn and voiced; 2–5 in as suggested |

**Structure review**

| ID | Status | Note |
|---|---|---|
| S3-01 | resolved | Ours are on her tape; the box never names WREN; the m08 link dropped |
| S3-02 | resolved | Courier and report, matching `m05_phone_recruiter.ink:183–185`; SA:187 and SA:600 in change 11 |
| S3-03 | partly resolved | The vendor-versus-site distinction is in, and the inquiry is conditional (matches m04's `crew_lost` inquest lines). On `full`, m04 published "the holes it came through" and audited "every other storage site" (`m04_closing_debrief.ink:470, :489`); the half-line doesn't explain why four hundred sites are still open (R2-05) |
| S3-04 | resolved for the tapes route | Tesseract still refuses her; Quintero unhurt; `sleeper_caught` left to m10; no-Quintero case covered. The double-cross's own core beat is not specified (R2-01) |
| S3-05 | resolved | One rule, set at `cage_opened`, first-of trigger, not keyed on an id. "Leaving the cage" needs a definition the engine can see (R2-09) |
| S3-06 | resolved | One list of eleven; tiers; m10 count 65 + `cage_bin` + `legacy_files_saved` = 67, consistent with FA:437 and m10 MC P8 |
| S3-07 | resolved, one contradiction | "(not played; §8)" cells marked. §8 says "left" outcomes get no line, then lists Noor's "left" line (R2-10) |
| S3-08 | resolved | "something off my deck" |
| S3-09 | resolved, one new hole | Legal pairs on every button; the cross-speaker resume is an engine check. Writing `sleeper_named` on the "yes" button contradicts MC:126 and lets a resumed call skip the name (R2-03) |
| S3-10 | resolved | |
| S3-11 | resolved | |
| S3-12 | resolved | |
| S3-13 | resolved | "his notes"; door line on talking branches, not after the shown-file text |
| S3-14 | resolved | |
| S3-15 | resolved | Lock row in change 19; Netherton's question branched |
| S3-16 | resolved | |
| S3-17 | resolved | |
| S3-18 | resolved, one stale line | Clip at the tape room's station, built as TTS ink. SA Beat 3.6 still says "His voice is never heard in m09" and no change rewords it (R2-11) |
| S3-19 | resolved, see R2-06 | Grounded in the day-10 entry in prose; the spoken line is still cryptic |
| Change verdicts, scope 1–4, engine 16–29 | resolved | Applied, numbering kept |
## Findings

No blockers.

### Major

**R2-01 (major). The double-cross may now lose to "refuse, her file" on everything the player can see.**
- **Location:** MC:133 (route table), MC:142–143 (dominance), MC:533 and change 5 (MC:591), change 27.
- **Evidence:** MC:143 gives the double-cross "WREN known and off the raid team (no saboteur behind the player, no whodunit)". m10 MC:299, "Accuse nobody": "WREN acts at the core: she comes through the service door for the key, and Quintero is wounded stopping her". So an unaccused WREN does nothing until the core. MC:533 and change 5 give WREN at the core on `double_crossed` ("the refusal plays there") but never say whether anyone is hurt.
- **Problem:** Lay the two routes side by side. Refuse-her-file gets the whole network, a clean record, and a whodunit the player can win (a right accusation, helped by the shortlist), with Quintero's wound as the worst case. Double-cross gets half the network, the invoice, a broken word, and WREN loose at the core. Unless the core goes better on `double_crossed`, the only thing it buys is "no wrong accusation possible". A thoughtful player who has heard both prices will refuse. Round 1 found the double-cross dominating take; the fix has flipped it to being dominated by refuse-her-file. The orchestrator's ruling (she warns WREN; WREN at the core) is kept; what's missing is the m10 outcome that makes it a trade.
- **Fix:** In §3.2's dominance list and in changes 5 and 27, say what the double-cross buys at the core: WREN is a known face standing beside Tesseract, so nobody is surprised and nobody is wounded (Quintero or the player takes her as she moves, with no service-door ambush). Then the trade is plain: double-cross means half the network, certainty, and a clean core, against refuse-her-file's whole network and clean record with a whodunit that can go wrong. Add one line to the dominance list: "Double-cross against refuse-her-file: half her network and a WREN you can see coming, against the whole network and a clean record with WREN still hidden on the team." If m10 can't promise "no wound", give the half-network a concrete m10 use instead (the Baltimore handler's file names something in Tomb Gamma).

**R2-02 (major). The double-cross breaks the night's timeline and three lines keyed on `sleeper_named`.**
- **Location:** MC:133, MC:394, change 19 (MC:608), change 27 (MC:625); SA §7.1 spine and last image; SA Beat 3.3.
- **Evidence:** MC:133: "Kowalczyk took a phone call at Great Falls and walked off the apron." SA §7: the debrief is "a hangar at Helena's airfield, where Task Force Null's aircraft landed while the player was in the archive"; SA Beat 3.3 has Netherton "on the line from the aircraft … in its forward cabin with the door shut, where WREN can't hear". Great Falls appears in no other m09 or FA document. SA §7.1 spine, "Named: We take her at the briefing, in front of the others … Until then she sees nothing in my face. Nor in yours." and the last image "On `sleeper_named`, across the hangar, Kowalczyk waves." `sleeper_named` is true on `double_crossed` (MC:551).
- **Problem:** (1) There is no stop at Great Falls; the plane flies to Helena. (2) Beat 3.3 has no `double_crossed` form, though by then she has been warned. (3) Stage 7 will write the spine and the last image off `sleeper_named`, so a double-crossing player hears Netherton plan to take her at the briefing and sees her wave across a hangar she has left. Change 19 lists only "Kowalczyk's absence on `double_crossed`".
- **Fix:** She gets the Recruiter's call in the air and walks off the apron at Helena on landing: "Kowalczyk took a phone call when we landed and walked off the apron. Her phone was in a bin by the fuel bowser." Beat 3.3's framing on `double_crossed`: "where she can't hear" still works, because she's still aboard. Add to change 19: on `double_crossed`, the "why the team goes in together" line becomes a third form ("She knows we know. She'll be where he is. So will we."), and the last image drops the wave (Narrator: "Her crate is still on the ramp."). Key all three on `recruiter_offer == "double_crossed"` before `sleeper_named`.

**R2-03 (major). `sleeper_named` is written on the "yes" button, and a resumed call can skip the name.**
- **Location:** MC:94 ("'yes' writes `taken` + `none` and `sleeper_named`"), MC:126 ("`sleeper_named` is set only when she says the name"), MC:551; change 31.
- **Evidence:** After "yes" the order is: the Recruiter names Kowalczyk, hangs up, fires the wipe, and then HaX asks "[Leave it.] / [Pull her file anyway.]" (MC:123). The resume rule re-rings "as **HaX**, at the tape choice" (MC:94).
- **Problem:** MC says two different things. If the button sets it, a player who closes the call (Escape, damage) between "yes" and her naming line comes back to HaX at the leave-or-pull choice with `sleeper_named = true`, and never hears the name. That loses the moment §3.2 says every face from the briefing changes, and leaves the leave-or-pull choice priced in terms ("we lose the name") of a name they don't have. In the fiction the wipe she fired has also been running the whole time the call was closed.
- **Fix:** Set `sleeper_named` on her naming line, as MC:126 says, and correct MC:94 and §10. Give the resume two points: closed before the name, the Recruiter re-rings and says it ("You hung up on the part you paid for. Halina Kowalczyk."); closed after the name, HaX re-rings at the leave-or-pull choice with one line that holds the wipe ("I've paused the deck. It won't hold long."). Put both in change 31.

**R2-04 (major). The notice teaches that disclosure fixes things in minutes.**
- **Location:** MC:218, MC:228 and MC:234 (send row).
- **Evidence:** Before the button: "Send it and the vendor patches four hundred sites, and the watch goes dark." Netherton: "Send it, and four hundred sites get patched and the Critical Mass watch goes dark." After a send, within a beat: "Vendor's acknowledged. Patch window, ninety days." / "Critical Mass watch just went dark."
- **Problem:** Disclosure is the lesson the finale is built on, and this version gets the timescales wrong. A notice starts a clock; it doesn't close a hole. Vendors acknowledge, take weeks to months to ship a fix (ninety days is the usual coordinated-disclosure deadline for the fix, not a "patch window"), and industrial sites take months or years to apply it, and some never do. The watch going dark the same minute is the other error. Nothing has been patched yet, so the only honest reason for it to go dark at once is a choice SAFETYNET makes: once the vendor is investigating that kit, SAFETYNET's own monitoring in it would be found, and keeping a hole open after reporting it is something the service won't do. That reason is better drama too, because it makes the cost a decision rather than a side effect. As written, a student learns that sending a notice patches four hundred sites.
- **Fix:** Before the button: "Send it and the vendor starts fixing four hundred sites, and we pull the watch. They'll be crawling over that kit, and we can't be in it when they look." After a send: "Vendor's acknowledged. They're saying ninety days for a fix. Getting it onto four hundred sites will take a year." / "Analysis is pulling the watch. It's dark by morning." Netherton: "Send it, and the vendor starts fixing four hundred sites and the Critical Mass watch comes down tonight." m10's "You burned the Critical Mass watch for one letter" still holds.

**R2-05 (major). On `full`, m04 already published the holes; "four hundred still open" needs its reason.**
- **Location:** MC:210–214, change 18.
- **Evidence:** `m04_closing_debrief.ink:470`, `full`: "Full transparency. The attack, the holes it came through, ENTROPY. All of it."; `:489`: "every other storage site gets audited". Albion is a grid-battery storage site (`m04_opening_briefing.ink:64`). MC:214's half-line on `full`: "You told them how they got in. Nobody told the vendor why the door was there."
- **Problem:** On `full` the public was told how Critical Mass got in, and every storage site was audited. A player who chose `full` will ask how four hundred sites can still be open. "Why the door was there" says SAFETYNET knew, but it doesn't explain the open sites. S3-03's fix covers the other branches and leaves this one, the branch whose players care most.
- **Fix:** Put the open sites outside what m04's audit covered: the audits were of storage sites and the holes were described as Albion's configuration, but the flaw is in the controller itself, and that kit also runs in water works and substations. HaX on `full`: "You told them how they got in. They audited every battery site and fixed the settings. The flaw's in the controller, and that's in water works and substations too. Nobody told the vendor." The other branches stay as written.
### Minor

**R2-06 (minor). HaX's invoice line has a bare "he" before the name, and the wrong hand.**
- **Location:** MC:114, MC:116.
- **Evidence:** "And if we buy from her, SAFETYNET's in an ENTROPY ledger. He's writing in it now. He'll quote it at you." The nearest "he" on the call is three lines back; WREN is "one of your four". SA Beat 2.3: the day-10 entry was "updated … in Sorensen's hand".
- **Problem:** C-01's rule (no "he" before the name that could be one of the four) is broken by HaX instead of the Recruiter. "He's writing in it now" is also untrue as stated: Sorensen wrote the entry, on his orders.
- **Fix:** Worst line 1.

**R2-07 (minor). Noor reacts to a line only the player can hear.**
- **Location:** MC:289.
- **Evidence:** "she reaches for her phone to ring him, and HaX, on the player's line: 'Not tonight. Not from here.' She puts it down".
- **Problem:** HaX is in the player's ear. Noor puts the phone down because of something she can't have heard.
- **Fix:** The player says it. One sticky choice, "[Not tonight. Not from here.]", with HaX's line before it ("Don't let her ring from here."), or Noor reads the player's face (Narrator: "You shake your head. She puts it down.").

**R2-08 (minor). Teresa Villanueva is saved on a promise, and Butte has no smelter.**
- **Location:** MC:77, MC:80, MC:651.
- **Evidence:** The letters' only payoff for her is "Arakawa's ringing Butte. She'll hear it from us first." §8 keeps the bin out of the debrief; the m10 echo is about Tran's handler, not her. "A union rep at the Butte smelter": Butte's industry is the open-pit copper mine; the area's smelter (Anaconda) closed in 1980.
- **Problem:** The present half of the bin choice exists to save a person, and the player never learns whether she was reached. She lands as a name and an age. A Montana player will catch the smelter.
- **Fix:** One line of hers in the letter, so she is a person (the Initiative's brief quotes her: "She says 'we' when she means the men on the night shift."). One line of confirmation: HaX in Beat 2.7 on `cage_bin == "letters"` ("Arakawa got Villanueva. She wanted to know who'd bother."), or a clause in m10's "Elsewhere". Make her a rep at the Butte mine.

**R2-09 (minor). "Leaving the opened cage" needs an event the engine can see.**
- **Location:** MC:306, change 33 (MC:634).
- **Evidence:** SA §11 puts the cage, the plan chest and the ledger shelf all in one room, "restricted stacks". The engine's room event is `room_entered` (R1 engine item 26).
- **Problem:** If the cage is part of the restricted stacks room, no event fires when the player steps out through the mesh door. The shred trigger, and the Recruiter's "out of the cage" condition, then fire only when the player enters another room, which is later than HaX's "walk out of this cage" promises.
- **Fix:** Add to change 33: either the cage is its own room (then `room_entered` on any other room is the trigger), or HaX's line matches the room ("…or leave the stacks"). Stage 5 picks one.

**R2-10 (minor). §8 says "left" outcomes are silent, then gives Noor's "left" line.**
- **Location:** MC:501.
- **Evidence:** "Noor (told or left, her line from §4.2) … 'Left' outcomes and lost files get no line."
- **Fix:** "Sorensen and Tran 'left' outcomes, and lost files, get no line. Noor's 'left' line plays, because leaving her is a choice with its own cost."

**R2-11 (minor). Stale references.**
- SA Beat 3.6: "His voice is never heard in m09." contradicts the F12 clip. Change 9 rewords FA §5.1 only, and change 17 only SA:260. Add SA Beat 3.6 to change 17: "His voice is never heard live in m09."
- MC:255: Nightshade's question cites "§1 change 7"; it is change 8.
- MC:576–577: the `schedule_read` row sits after the paragraph that ends the local table, so it renders as stray text. Move it above the paragraph.

**R2-12 (minor). The refusal's payoff rests on the Recruiter not checking.**
- **Location:** MC:102, MC:110–118, MC:124.
- **Evidence:** She says "I can see that you pulled one", hears HaX say "I can beat that wipe", then on a refusal "wipes her own file first and drops off, sure it's gone". The `named` route's whole-network payoff depends on her warning nobody.
- **Problem:** A player who listens will ask why someone who can see pulls, and has just been told one is coming, doesn't watch. "Nobody has." gives her pride as the reason, but nothing in the scene shows it.
- **Fix:** Show the pride in what she does: "Then I'll tidy my own desk. *(beat)* Gone. Goodnight, agent." and HaX, after: "She watched the counter. Not the copy." One line, and the player sees why she believes it.

**R2-13 (minor). Owning the spring reverses m05's precedent without a word.**
- **Location:** MC:163.
- **Evidence:** m05's confession: "Thank you for telling me. That's the only reason this stays between us." (`m05_closing_debrief.ink:740`). MC: on `told`, "HaX tells Netherton, because she has to".
- **Problem:** This player lied in m05, so they never heard that promise, and the reversal is defensible on the night HaX confesses her own silence. Neither MC nor HaX says why this time is different, and stage 7 will need the reason.
- **Fix:** One line from HaX at "Noted. Later.", or at Beat 2.7: "Last spring I'd have kept that between us. Not tonight." On `denied`, HaX's silence could carry m05's line instead: "Four minutes is a long sales pitch." (`m05_closing_debrief.ink:750`). Neither is required.
## Route walk: the Recruiter

Every opening against every answer, checking that the cost is said before the button, that something lands in m09, and that the state is legal at each save point.

| Opening | Answer | Cost said first? | Felt in m09 | State | Verdict |
|---|---|---|---|---|---|
| any | take, leave it | yes: "The price is the deck. All of it goes." | the name, every face changes; ledger line; the hangar | `taken`/`none`/`sleeper_named` | works; R2-03 on resume |
| any | take, pull her file (double-cross) | yes: her threat, and HaX's "Half her people, and we lose the name" | first handler read; her text; the hangar without her | `double_crossed`/`her_file` | trade unclear (R2-01); timeline and spine (R2-02) |
| any | refuse, her file | yes: "Say no and I wipe it myself" | first handler; the cross-reference line | `named`/`her_file` | works; R2-12 plausibility |
| any | refuse, the tapes | yes, and the payoff (the clip) is real now | the clip after the identity scene; the decode | `refused`/`alpha_tapes` | works. The best-built route |
| sold and lied | own it | not needed (honesty); see R2-13 | "Noted. Later."; Netherton's line | `told` | works |
| sold and lied | deny | the risk of a lie is plain; no line prices it | her amusement; HaX's silence | `denied` | works. HaX's silence is the right call |
| sold and lied | hang up | yes: hanging up ends the call | plays as a refusal; HaX's later question | `kept` + `refused`/`alpha_tapes` default, then the tape choice | works |
| sold and confessed | (no H) | n/a | HaX cuts in | `confessed` | works |
| no deal / never played | (no H) | n/a | n/a | `""` | works |

Closing the call: at H, at the answer, between "yes" and the name (R2-03), at the leave-or-pull choice, at the tape choice. Every point holds a legal pair. Only the second-to-last loses something the player should have heard.

## Other choices, fresh

- **Cage bin (D).** A real dilemma now: m01's answer against a living person. Neither side is dominated on the default path. The `nightshade_copy` side is thin but limited to its branch. See R2-08.
- **Sorensen and the legacy files (E).** Fair. The clock is two events, both said by HaX as the cage opens, neither a timer, and both things the player chooses to do. Force before the chest saves the files; talk needs the file from the chest, so it always costs them; leaving her costs both. "She's sixty-six." still does the work. The one engine gap is R2-09.
- **Noor (B).** Lands as a person. "Was I going to say yes? Don't answer. I know I was." and "She asked twice." carry it. Telling her and leaving her be both cost something, and nothing else in the mission rides on it. See R2-07.
- **Nightshade (F).** Unchanged and still the cleanest dilemma here.
- **Notice (L).** The cost and the gain are both said before the button, and every player now meets it. Two corrections: the timescales (R2-04) and the `full` branch (R2-05).
- **Confession (K), Reading (J), memo (M), hangar (N), Tran (I), Old Coyote (C), raid team (A).** No new problems. The "two things" variant in m10 is a good use of W-26.
## State and exports

**Every global, every route, before the conclusion.**

| Global | Set on every route? | Note |
|---|---|---|
| `recruiter_offer`, `deck_pulled` | yes: legal pair from the first line; every button writes a pair | ok |
| `sleeper_named` | yes (default false) | set point contradicts itself (R2-03) |
| `recruiter_secret` | yes: first line by branch; `told`/`denied` by button | ok |
| `hax_confession_answer` | yes: flag 4's read waits on it | ok |
| `albion_notified` | yes: archive or the forced debrief question | ok (resume after a closed debrief is engine item 40) |
| `cage_bin` | yes: `cage_opened` writes `derek_file` by default, Victoria's route included | ok |
| `legacy_files_saved` | yes: set at `cage_opened` from the m05 import, or by a knock-out before the clock | ok; trigger needs R2-09 |
| `nightshade_shown_file`, `reading_finished`, `sleeper_shortlist` | defaults false; optional | ok |
| `sorensen_fate`, `tran_outcome` | default `left`; KO after `talked` keeps `talked` | ok |
| `noor_told`, `old_coyote_*`, `reading_told_hax`, `raid_team_answer`, `schedule_read` | defaults given | ok |
| `memo_stance`, `kowalczyk_reply` | the debrief spine; `kowalczyk_reply` stays `""` on `double_crossed` (no choice), which the table allows | ok |

No import is written; none gates `concludeRequires` (the four flags) or an `unlockCondition`. The m05 imports MC relies on (`recruiter_deal_confessed`, `found_pipeline_list`) aren't in m05's `exportGlobals` yet (`m05 scenario.json.erb:610–611`). FA marks both ✱, to be added under the approved F4, so this is a reminder for the build, not a finding.

**The new lock row** (change 19: "the notice → the pen: asked after the memo stance if unsent; the conclusion task is on the last line"). It holds: the conclusion task sits on the debrief's last line, and the question comes before the hub. The one dependency is engine item 40 (a choice inside the debrief cutscene that resumes if closed). On `double_crossed` the hangar's own beats need the R2-02 variants. The lock does not.

**Exports against m10.** Eleven plus `m09_completed`, matching the list in MC:561. m10's documents already read nine by name (grep of m10 SA, SE, MC and FA: `albion_notified`, `deck_pulled`, `hax_confession_answer`, `nightshade_shown_file`, `reading_finished`, `recruiter_offer`, `recruiter_secret`, `sleeper_named`, `sleeper_shortlist`), plus `cage_bin` in m10 MC. `legacy_files_saved` has no reader yet, and MC's "what m10 must change" names it. Two m10 handlers are still missing, and MC lists both: `recruiter_secret == "denied"`, and `double_crossed` meaning WREN gone (m10 MC reads `double_crossed` at :332 and :529 only for the invoice and her text; WREN's absence from the team isn't there yet). m10 MC:746 still says "m09 exports ten". All three are on the m10 author's list (changes 25–29). The consistency check passes once m10 applies them.
## Scope

Still buildable. Round 1 removed more than it added: the private text, Sorensen's list object, `notice_sent_in_archive`, the arrested-branch help and Old Coyote's radio link are gone. What's new is one voiced clip built as an ordinary ink conversation (no engine work), the denial button, Kowalczyk's absence from the hangar on `double_crossed`, and the debrief notice question. The engine items that carry real risk are the same three as before: the cross-speaker resume (31, which R2-03 makes two resume points), the legacy box's two-event removal (33, with R2-09's room question), and a choice inside the debrief cutscene that resumes (40). None needs a new system.

Testable with the twelve-route covering set (change 43). Add three routes this round makes necessary: double-cross with the call closed between "yes" and the name; `denied` then take; `full` with `crew_lost`, notice held in the archive and sent at the debrief.
## Worst lines

1. **HaX, the invoice** (MC:114). *"And if we buy from her, SAFETYNET's in an ENTROPY ledger. He's writing in it now. He'll quote it at you."* There's a bare "he" before the name, the present tense is cryptic, and it's the wrong hand (R2-06). **Rewrite:** *"Buy from her and SAFETYNET goes in an ENTROPY ledger. The Architect's orders are in that ledger already. He'll read the sale, and he'll quote it at you."*

2. **HaX, after "yes"** (MC:123). *"She's watching the deck. If we break it, we break it for her file. Half her people, and we lose the name."* "Break it for her file" takes a second read, and "we lose the name" is wrong: they keep the name and lose the woman. **Rewrite:** *"She's watching the deck. Pull her file and we get half her people. She warns the rest, and Kowalczyk runs."*

3. **The Recruiter's text** (MC:133). *"You took the name and something off my deck. I said I'd know before your plane did. It hasn't left."* Whose plane, and left where? The team's plane is in the air. **Rewrite:** *"You took the name and something off my deck. I said I'd know before your plane landed. It's still in the air."*

4. **HaX, after a send** (MC:234). *"Vendor's acknowledged. Patch window, ninety days." / "Critical Mass watch just went dark."* The disclosure timescales are wrong (R2-04). **Rewrite:** *"Vendor's acknowledged. They're saying ninety days for a fix. Getting it onto four hundred sites will take a year."* / *"Analysis is pulling the watch. It's dark by morning."*

5. **Netherton, the hangar on `double_crossed`** (MC:133). *"Kowalczyk took a phone call at Great Falls and walked off the apron. Her phone was in a bin by the fuel bowser."* There was no stop at Great Falls (R2-02). **Rewrite:** *"Kowalczyk took a phone call when we landed and walked off the apron. Her phone was in a bin by the fuel bowser."*

Lines that should survive stage 7 as they are: "Say no and I wipe it myself. Same deck, no name."; "I can't see which tape you pull. I can see that you pulled one."; "Nobody has."; "Then I'll keep what's left. Give me a pencil."; "Miss Haddad is in a hotel in Great Falls … She asked twice."; "Tape two. He gave that lecture every year."
## Verdict

**Not clean. Revise, then round 3.** No blockers, 5 majors, 8 minors, five worst lines.

Round 1 is almost all resolved, with no stale copies left in MC. The C-08 letters fix and the legacy-files rule are good work: the bin is now past against present, and Sorensen's clock is fair because it is two said events rather than a timer. The remaining problems sit in two places. The double-cross was redesigned this round, and its consequences haven't been followed through. Against refuse-her-file it doesn't say what it buys at the core (R2-01). The plane, the identity scene, the spine and the last image don't fit it (R2-02). And the name can be skipped on a resumed call (R2-03). The notice now has a cost and a gain, but it teaches the wrong timescales (R2-04) and loses the `full` branch's logic (R2-05). Each fix is a sentence or a line, with nothing to restructure.

Top findings, in order: R2-01, R2-02, R2-04, R2-03, R2-05.
