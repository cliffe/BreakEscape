# m09 Digital Archaeology: Stage 3, moral choices

Stage 3. Author: stage 3 author (Opus), 2026-10-21. Status: stage 3 complete. Round 1–3 fixes folded in (§13–§15); user decision F12 (the Alpha-tapes clip is voiced) applied; stages 0–3 milestone fixes applied 2026-10-21 (listed in `../stage_1/story_arc.md` §20). The §11 changes are applied; the "proposed" labels in §3–§10 are dropped (MS-12), and §11 stays as the record. Stages 4–5 (`../stage_4/objectives_tasks.md` §14, `../stage_5/room_layout.md` §12) folded in 2026-10-21 (listed in `../stage_1/story_arc.md` §21): where a choice's place, timing or wiring changed, §2–§10 now say so; no choice, cost or export changed.

Inputs: `../stage_0_initialization.md`; `../stage_1/story_arc.md` (beats cited as "Beat 2.4", its §8 choice list, §11 locks); `../stage_2/storytelling_elements.md` ("SE"); `../../../finale/FINALE_ARC.md` ("FA") §1–9, §13, §15; `story_dev_prompts/03_moral_choices.md`; the `npc-dialog-review` skill (§2d, "choices that matter"), the `mission-puzzle-chains` skill (§3a, "are the mission's own choices actually required"), `README_ink_best_practices.md` "Making Choices Matter", `docs/agents/CARRY_OVER_PLAN.md` §2.6 (imports never gate completion). For m10's side of each payoff, m10's stage 2 §2.2–2.3 (Tesseract's case and the three exchanges). VM flags appear only by story meaning.

Where this document and stage 1 differ, this one is newer and is proposed as the change (§11). Stage 1 is not edited here beyond the export wording FA §15 asked for.

**The tests applied to every choice.**

1. Each option costs something and buys something, and both are felt in m09 in play (a line, a find, a person who reacts, a room that changes), not only in the debrief.
2. No option is dominated: for each pair of options, each wins on at least one thing the player can see or the story pays back.
3. The cost is signposted before the button, by HaX or the person in the scene, in story terms. Nothing is a trap, and nothing promises an effect that never comes.
4. A choice the mission calls forced is held by a lock or a condition (story arc §11), never by hope that the player wanders into it.
5. No choice, and no import, gates `concludeRequires` or the critical path (CARRY_OVER_PLAN §2.6). Every withheld thing on the critical path has another source.

## 1. What this stage changed

Eleven decisions. Most fix a dominated, empty or unforced option in the stage 1 design; the rest give a choice a payoff it was promised. Each is in §11 as a proposed change.

1. **The Recruiter's price is the whole deck.** In stage 1, taking her offer let HaX pull the Alpha tapes, and refusing let HaX pull them too. Her file was wiped either way, so the deal cost nothing that refusing didn't, and "refuse, pull the tapes" lost to "take, pull the tapes" on every count except principle. Her own threat line already says "if anything else comes off that deck", so the price now matches it: take, and nothing comes off. Refuse, and HaX saves one tape (§3.2).
2. **"Pull nothing" is gone as a button.** "Take, pull nothing" lost to "take, pull the tapes", and "refuse, pull nothing" lost to both refusal pulls. With change 1, taking means nothing is pulled, so `none` survives as the value `taken` writes, and refusing always saves one tape.
3. **The Alpha tapes pay off in play.** One short voiced clip (approved, F12), a decode, and in m10 a warning about the service door, so Quintero takes WREN unhurt after Tesseract has refused her (§3.2, §9 item 25). Without this, refusing for the tapes bought one record answer.
4. **The invoice is visible in m09, and priced as what it is.** After a deal, once the player is in Sorensen's office, the drop terminal's ledger view gains a line booking the sale, and HaX texts it (stage 4 §6.6). HaX prices it before the answer as a moral cost (SAFETYNET in an ENTROPY ledger, quoted back), not a tactical one (§3.2).
5. **The double-cross costs the name** (round 1, C-02). Broken faith voids the sale: she warns WREN, and Kowalczyk is gone by the hangar. Said before the choice (§3.2).
6. **The notice costs something and protects someone.** Albion fixed its own site; the flaw is in the vendor's controller (Carrow Controls' RM-4 module, stage 6 §1.10), which also runs in water works and substations, still open there, and SAFETYNET's watch on Critical Mass runs there. Sending starts a fix that will take a year to reach those sites, and SAFETYNET pulls the watch at once; on `full` or `crew_lost` it also puts SAFETYNET's nine years in front of Albion's inquiry. HaX names both sides before the player decides (§3.5).
7. **Every player decides the notice.** If it is still unsent at the debrief, Netherton hands it to the player straight after the memo stance (§3.5).
8. **Sending Nightshade his file costs his channel.** Shown the file, he picks a side out loud in m10, and the triple-agent channel is spent. Kept from him, he stays useful and goes on not knowing (§4.1).
9. **"What Sorensen hadn't reached" has content, and it belongs to her.** The legacy placement files outside SAFETYNET (the SAFETYNET ones went onto the Recruiter's tape) are on the shredder's feed behind her. Only stopping her by force before the clock HaX names runs out saves them; talking her down gets her account of what she destroyed instead (§4.3). Noor's choice is about Noor and her father, with no loot attached (§4.2).
10. **The cage bin is past against present, and carries into m10.** The letters' last page is Social Fabric's next smear, on a union rep in Butte the player can still warn; `cage_bin` is exported (§3.1).
11. **The debrief stops being a list.** "The archive" is capped at two lines, chosen by weight; the rest has already landed in play (§8).

## 2. The choices at a glance

Story order. "Forced" means a lock or condition makes every player answer it before the mission can end; the lock is named. Letters are this document's; stage 1 §8 numbers the same choices differently (its #1 is D, #2 is G).

| # | Choice | Who | When | Forced? | Sets | Exported |
|---|---|---|---|---|---|---|
| A | The raid team: back Quintero, thank Kowalczyk, or neither (§4.7) | every player | briefing | no (a stance in a cutscene hub) | `raid_team_answer` | no |
| B | Noor: tell her, show her, or leave her be; or knock her out, on any branch (§4.2) | every player who meets her; the tell/show choice exists only where she isn't already warned in time | Beat 1.2; the ledger page | no | `noor_told`, `noor_ko` | no |
| C | Old Coyote: talk past, tell him, sneak, or knock out (§4.5) | every player who meets him | Act 1 | no | `old_coyote_ko`, `old_coyote_told` | no |
| D | **The cage bin** (§3.1) | every player | Beat 2.1 | **yes**: the cage opening tips the other bin | `cage_bin` | **yes (new)** |
| E | Sorensen: stop her by force, talk her down, or leave her (§4.3) | every player (she is at the shredder whenever the cage opens) | after the cage opens; the legacy files only until Nightshade's file comes out of the plan cabinet or the player first leaves the cage | no | `sorensen_fate`, `legacy_files_saved` | `legacy_files_saved` **(new)** |
| F | Send Nightshade his file, or hold it (§4.1) | `m08_nightshade_triple_agent` | once his file is held (Beat 2.2), in HaX's hub, from any room until the debrief | no; HaX asks once, explicitly | `nightshade_shown_file` | yes |
| G | **The Recruiter's offer and the deck** (§3.2) | every player | Beat 2.4 | **yes**: Sorensen's office opens on `deck_choice_made` | `recruiter_offer`, `deck_pulled`, `sleeper_named` | yes |
| H | Own the spring, deny it, or hang up (§3.3) | `m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed` | first beat of the call | **yes** (inside G) | `recruiter_secret` | yes |
| I | Tran: talk him off, knock out, or leave (§4.4) | players who go to the server closet | Beat 2.6 | no | `tran_outcome` | no |
| J | Read the Reading to the end; tell HaX its line about her (§4.6) | every player who opens the safe (every player) | Beat 3.1 | no | `reading_finished`, `reading_told_hax` | `reading_finished` |
| K | **The answer to HaX's confession** (§3.4) | every player | Beat 3.3 | **yes**: flag 4's read waits on `identity_scene_done` | `hax_confession_answer` | yes |
| L | **The notice** (§3.5) | every player | Beat 3.4 onwards (optional send); **the debrief, if unsent** | **yes, from this stage**: the debrief's spine asks before the pen | `albion_notified` | yes |
| M | **The memo stance** (§3.5) | every player | debrief beat 4 | yes: the debrief's spine; the conclusion task is on its last line | `memo_stance` | no |
| N | Kowalczyk in the hangar: warm or flat (§4.7) | every player | debrief beat 2 | yes (the spine) | `kowalczyk_reply` | no |

The optional cross-reference (`sleeper_shortlist`) and the realisation at flag 4 (`schedule_read`) are finds, not choices; they appear in the state table (§10) because m10 or a later line reads them.

## 3. The forced choices

### 3.1 The cage bin

**Who and when.** Every player, at the hatch counter in the restricted stacks (Beat 2.1), while Sorensen stamps boxes and the player works on her print and card. The bins sit in the strip behind her, out of reach, so the player chooses on HaX's lines, and Sorensen passes the pulled file across. On recruited Victoria's route the gate opens without the hatch, and the choice is made at the cage door, in a scene hosted by a hidden Sorensen record that holds both files, so knocking her down in the cage can never undo it (stage 4 §4, stage 5 §3.7, P3).

**What the player sees.** HaX names each bin and what it buys, once, before any button (SE §4.3; the second sentence by branch):

> Agent HaX: Bin by the hatch is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did.
>
> Agent HaX: The other's the Social Fabric letters. Last one's about a union rep in Butte they're about to bury. One of them's ash in a minute. *(default)*
>
> Agent HaX: The other's what Nightshade cleared from his locker. His own words on what he took. One of them's ash in a minute. *(`m08_nightshade_tidied`)*

Buttons at the hatch: **[Pull Derek's file through.]** / **[Pull the letters through.]** (or **[Pull Nightshade's copy through.]**). On Victoria's route: **[Take Derek's file.]** / **[Take the letters.]** (or **[Take Nightshade's copy.]**). Each button gives the file by id (`derek_file`, `letters`, `nightshade_copy`); `sorensen_hatch` and `sorensen_door` both hold all three (stage 5 §3.6–3.7). A player who presses neither and opens the cage keeps Derek's file, which sits nearer the hatch (or the door); that is the default, not a third option.

**What each costs and buys.**

| Option | Felt in m09 | Debrief | m10 (via `cage_bin`, new) |
|---|---|---|---|
| Derek's file (`derek_file`; also the default) | The player reads the Architect costing a man before he was hired ("Expected loss of asset: total."), with his motive ("Motive: belief.") and his standing order ("if taken, put the device down and wait. Say nothing."): the one answer m09 gives m01. The page is fixed and true on every m01 branch (stage 6 C-07); what the player did is read back by the Reading's page 1 and HaX's bin line in ink (on `surrender`, "There's your why. He was told to."; on `expose`, "He wanted your headlines."). At the hand comparison it is a second sample: HaX, "Two samples. One pen." Loses the other bin, tipped into the shredder in front of them. | (not played; §8) | A record answer under the first claim, last in priority: [You priced Derek Lawson before anyone hired him. You don't pay your costs. You hand them out.] He: "*pause* Derek paid it. I didn't." |
| The letters (`letters`) | The last letter is Social Fabric's next job, briefed to the Initiative: Teresa Villanueva, 41, a union rep at the Butte copper mine, about to be ruined by a fabricated affair and a leaked medical file. The brief says why her, which is what makes her a person on the page: "Why her: when she says we, she means the men on the night shift." The same letters name Tran's courier (J.T.) and his handler, D. Varga, "the Bozeman number" (stage 6 §1.5). Taking the letters, HaX: "Arakawa's ringing Butte. She'll hear it from us first." In Beat 2.7, on `cage_bin == "letters"`, HaX confirms it: "Arakawa got Villanueva. She wanted to know who'd bother." (R2-08) Also a lever on Tran (§4.4) and, on `m01_maya_ko`, the warning Maya's names would have given ("That's the warning we didn't have."). Loses Derek's file: m01's question stays unanswered, and the hand rests on HaX's notebook alone. | (not played; §8) | One HaX line on Social Fabric's branches ("Tran's handler is on that rota. He's in the Helena letters."); the rota should carry "D. Varga" (stage 6 §6.3). m10's media room is cut (milestone ruling), so the line goes wherever m10 now stages Social Fabric, by default the drafted story's prop in the server hall; the m10 author places it. |
| Nightshade's copy (`nightshade_copy`, on `m08_nightshade_tidied`) | What he cleared from his locker, in his words: "So that's what he had time to clear." On the triple-agent branch his text reply to his own file knows the player read it (SE §2). Loses Derek's file. | (not played; §8) | At the door, on the talking branches only (triple agent, arrested; not the silent "Door."), and not after m09's shown-file text already said it: "You read what I cleared. Then you know I kept his notes." |

What Nightshade kept is "his notes" (the Architect's notes to him), so it is never confused with the Social Fabric letters, the bin it replaces (S3-13). Teresa Villanueva is named only in documents and HaX's line; she never appears.

**Signposting.** HaX's two lines say what each bin is and what it does tonight. Nothing in m09 hints at the m10 effect, and nothing needs to: the player chooses on what they can see.

**Dominance.** Past against present: Derek's file answers the player's first case and backs the proof; the letters save a living woman's name and spare a fight with Tran. Each wins somewhere, and on the default path the player has to choose between a question they have carried since m01 and someone they can still help. The copy (on `m08_nightshade_tidied`) is the only place Nightshade speaks plainly about what he took, and the m10 door line pays it.

**Forced.** Yes, by an event: the cage opening tips whichever bin is left and writes the default `derek_file` if nothing was pressed (Beat 2.1, FA §6.1; stage 4 §4). On Victoria's route the door scene just after can still overwrite it. Neither option is needed to finish.

**Never played.** m01 never played: Derek's file is the same fixed page (stage 6 C-07), and the Reading's page 1 gives the canon arrest (FA §3); the bin line is unchanged. m08 never played or no tidying: the letters are the other bin.

### 3.2 The Recruiter's offer and the deck

The mission's main dilemma, and the one every player meets on a default save.

**Who and when.** Every player. She rings once flag 2 is in, HaX has read the ledger, and the cage has been opened, after a short delay, outside the cage and not in another conversation (Beat 2.4; stage 4 §4 row 3). The call is voiced (F17): every line in the Recruiter's or HaX's voice, no narrator (stage 4 P12). Every button writes a complete legal pair (S3-09): the call's first line sets `recruiter_offer = "refused"` with `deck_pulled = "alpha_tapes"` (nothing reads `deck_pulled` before `deck_choice_made`), and `recruiter_secret` by branch; "yes" writes `taken` + `none`; `sleeper_named` is set on her naming line, not the button (R2-03); the tape choice overwrites. Its last choice sets `deck_choice_made`. Closed early, it rings again on leaving the room and resumes at the last unanswered choice (story arc §11), with two resume points after a "yes" (R2-03):

- **Closed between "yes" and the name:** the Recruiter re-rings and says it: "You hung up on the part you paid for. Halina Kowalczyk." `sleeper_named` is set there.
- **Closed after the name** (at the leave-or-pull choice, or after a refusal at the tape choice): the Recruiter has gone, so **HaX** re-rings, with one line that holds the wipe in the fiction ("I've paused the deck. It won't hold long."), then the unanswered choice. Built as three re-ring mappings with disjoint conditions, each also on load (stage 4 §6.1; stage 5 §10 item 17, a browser test at stage 9).

**The offer, with the new price** (§1 change 1). WREN's name, now, always right. The price is the deck: her file and the Alpha tapes both go. Every cost is said aloud, on the call, before the answer; nothing rests on an unvoiced text (round 1, C-03).

> The Recruiter: One of your four is mine. Was mine, until your Architect took them for Montana. The name tonight. You let my tape deck wipe.
>
> The Recruiter: Say no and I wipe it myself. Same deck, no name.
>
> The Recruiter: I can't see which tape you pull, only that you pulled one. Take the name and pull anything, and I call my placement.

(Stage 7, script edit R1 B-01, R2 B-R2-06, R3 I-3: the phone cap is 25 words, so the "half her people" cost moved to HaX's yes-block, still said before the button: "Pull her file and we get half her people. She warns the rest, and Kowalczyk runs.")

**No pronoun for WREN before the name** (round 1, C-01). Stage 2's first line ("He took her for Montana… her name") tells a refusing player that WREN is a woman, and a bare "He" for the Architect reads as WREN. The line names the Architect and calls WREN "my placement" and "them". Every Recruiter and HaX line before "Halina Kowalczyk" follows the same rule (§11).

**HaX, on the open line, before the answer** (SE §4.3, plus two new lines):

> Agent HaX: Her file is her network, all of it. The Alpha tapes are him teaching, recorded. He teaches what he'll do. If he built the bunker the way he taught it, it's on there.
>
> Agent HaX: I can beat that wipe.
>
> The Recruiter: Nobody has.
>
> Agent HaX: Buy from her and we go in an ENTROPY ledger, next to his orders. He'll read the sale, and he'll quote it at you.

"Next to his orders" (stage 7's wording) points at what the player has read: WREN's day-10 entry, "assigned TF Null, Montana operation", written in Sorensen's hand on his orders (S3-19, R2-06). No bare "he" before the name could mean one of the four. The invoice is priced as a moral cost and pays back as one: a line he quotes, deciding nothing (C-04).

HaX's boast is said where the Recruiter hears it, and she dismisses it; that is why, on a refusal, she wipes her own file first and drops off sure it's gone. The player answers with all four outcomes priced, on a cold start too.

**The buttons.**

1. The answer: **[Give me the name. Let the deck go.]** or **[No. Keep your name.]**
2. After a yes, she names Halina Kowalczyk (with N-09's line), hangs up and fires the wipe. HaX: "She's watching the deck. Pull her file and we get half her people. She warns the rest, and Kowalczyk runs." Then **[Leave it. Let it wipe.]** (`taken`, `deck_pulled = none`) or **[Pull her file anyway.]** (`double_crossed`, `her_file`).
3. **After a hang-up** (§3.3), with no Recruiter line, since the player has hung up before her offer (R3-01). HaX, in place of the old narrator line (narration in a phone thread isn't voiced, stage 4 P12): "She's started the wipe on her tape deck. She thinks you've gone." (stage 7 R2 cut "Her counter's running."; R3 B-R3-02 names the deck) Then the first half of HaX's line from above: "Her file is her network, all of it. The Alpha tapes are him teaching, recorded." Then: "One of them. Now." Then **[Her file.]** (`named`, `her_file`) or **[The Alpha tapes.]** (`refused`, `alpha_tapes`).
4. After a no: "Then I'll tidy my own desk. *(beat)* Gone. Goodnight, agent." She wipes her own file first and drops off, sure it's gone. HaX: "She only watched the counter. I can pull one before it wipes. Which?" (R2-12: the player sees why she believes it; stage 7's wording.) Then **[Her file.]** (`named`, `her_file`) or **[The Alpha tapes.]** (`refused`, `alpha_tapes`).

`sleeper_named` is set only when she says the name. There is no "pull nothing" button (§1 change 2).

**What each route costs and buys.**

| Route | Felt in m09, in play | Debrief | m10 |
|---|---|---|---|
| **Take** (`taken`) | She says the name, and every face from the briefing changes. On "thanked Kowalczyk", HaX: "You thanked her at the briefing. Keep doing it." Both tapes go under the degausser's whine. Once the player is in Sorensen's office, the ledger view on the drop terminal gains a line in Sorensen's columns, and HaX texts it: "Sale. WREN. To Agent 0x00. Consideration, one deck. Booked." / "She's booked you. You're in her ledger now." In the hangar the player is thanking WREN to her face (§4.7). | "You bought a name, and it was the right name. She'll sell the invoice." | Kowalczyk cuffed at the briefing; no whodunit. His ledger sting on the invoice ("You bought WREN from my Recruiter. You understand costing."). An "Elsewhere" clause in the credits: "The Recruiter: at large, her people at their desks." (MS-04; the closing card has no Recruiter line.) |
| **Double-cross** (`double_crossed`) | The name, then her file: HaX reads the first handler off the tape ("First name on it is a handler in Baltimore."). The invoice line, as on take. When the player first enters the tape room, a text from her, unvoiced: "You took the name and something off my deck. I said I'd know. Your team's plane is still in the air." (stage 7 R2 B-R2-04; S3-08: she knows something was pulled, not what.) She rings WREN, aboard the aircraft, as she said she would. **In the hangar, Kowalczyk isn't there** (§4.7): Netherton, "Kowalczyk took a phone call when we landed and walked off the apron. Her phone was in a bin by the fuel bowser." The identity scene is unchanged: Netherton is still in the forward cabin with the door shut, and she is still aboard. The debrief's spine and last image take `double_crossed` forms (§4.7, R2-02). | "About half of her network. She warned the rest, and she warned Kowalczyk." | WREN is not on the team and not detained: she has gone to Tomb Gamma. **At the core she is a known face standing beside Tesseract**, so nobody is surprised and nobody is wounded: he refuses her, and Quintero (or the player, with no Quintero) takes her as she moves, with no service-door ambush (orchestrator ruling, R2-01). No whodunit. His ledger sting on the invoice. Her 06:00 text ("I'll remember the shape of you."); an "Elsewhere" clause, "About half of them. She warned the rest." (both taken by m10, m10 MC §6.2 / P44). |
| **Refuse, her file** (`named`) | No name. Her file is saved and HaX reads the first handler. HaX: "One of four. Two, if that firm's boxes say so." (the cross-reference, Beat 2.5). No invoice line. The tape lists SAFETYNET's placements by codename only; the key from codename to person was hers alone, so it cannot name WREN (D-01). | "Her handler list is with Analysis. Ours are on it by codename only; she kept the key to the names." / "The police make the arrests at oh-six-hundred, day thirteen. Nobody moves before then. WREN would hear." (D-01; SAFETYNET has no arrest powers, CONTRACT §9.3 C-4) | The whodunit runs, with WREN unwarned, because nobody is arrested before the raid. The clean-record answer under the second claim (§9 item 33). An "Elsewhere" clause: "The Recruiter's network: rolled up." unless the cells ledger already took it. |
| **Refuse, the Alpha tapes** (`refused`) | No name. The tapes are saved: after the identity scene a short voiced clip plays from the reel deck in the tape room, his voice teaching fifteen years ago (F12, §9 item 25), and the annotation sheets decode to his first draft of the line. No invoice line. | "She is at large, and you did not let her set the price." | The whodunit runs. The clean-record answer; the Tomb Alpha record answer under the third claim; HaX's warning about the service door at the core, so Quintero takes WREN unhurt after Tesseract has refused her (§9 item 25). An "Elsewhere" clause: "The Recruiter: at large, her people at their desks." |

**What each loses.** Take: her network, both tapes, a clean record. Double-cross: both tapes, half her network (warned), a clean record, the player's word, and the name's use: WREN is warned and gone. Refuse with her file: certainty about WREN, the tapes. Refuse with the tapes: certainty about WREN, her network.

**Dominance.**

- Take against refuse-with-tapes: certainty against the tapes and a clean record. Certainty is the bigger m10 effect; the tapes are the only route that hears him, and the only refusal that spares Quintero at the core.
- Take against double-cross (round 1, C-02): the double-cross buys half her network and costs the name's use. WREN, warned, is gone before the hangar and stands beside Tesseract at the core instead of sitting in cuffs at the briefing. Take keeps WREN in custody from the start (a prisoner with eleven years of the Initiative in her head, and her propped service door never happens) and keeps the player's word; the double-cross trades her custody and the player's word for half a network, and the core still goes cleanly. The Recruiter says the price before the answer, in her own voice.
- Double-cross against refuse-with-her-file (R2-01): half her network and a WREN you can see coming (off the team, no whodunit, a clean core with nobody wounded), against the whole network and a clean record, with WREN still hidden on the team and a whodunit that can go wrong (a wrong accusation, or Quintero wounded at the core).
- Refuse-with-file against refuse-with-tapes: her network against his teaching.
- In stage 1, "refuse, pull the tapes" lost to "take, pull the tapes" on everything except principle, and both "pull nothing" routes lost outright. Both are fixed (§1 changes 1–2).

**Forced.** Yes. The call waits on flag 2 and `cage_opened`; Sorensen's office, which holds the tape room's key card, opens on `deck_choice_made` (Beat 3.1). The re-ring rule means a closed call cannot skip it. Nothing on any route is needed to finish: every route reaches the office.

**Value invariant.** `taken` always pairs with `none`, `refused` with `alpha_tapes`, and `named` and `double_crossed` with `her_file`, at every save point, because each button writes a whole pair. `deck_pulled` is derivable from `recruiter_offer`, but it was accepted as an export and m10 reads it by name, so it stays.

### 3.3 Own the spring, deny it, or hang up (sold-and-lied branch)

**Who and when.** Only `m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed`: the player let the forty-seven go to her courier in m05, in return for a clean report, and never told anyone (shipped m05: "Leave it out of your report. Let my courier have it. In return, nothing in this operation points at you."; no money changed hands; round 1, S3-02). It is the call's first beat, before the offer. She opens with the deal and the offer in one breath, with HaX on the line (Beat 2.4):

> The Recruiter: Forty-seven names, and nothing points at you. Does your handler know? I have one more name for you. Keep this one too.

**The buttons** (a third added in round 1, C-12). **[She's right. I let her courier have the list last spring.]** (`recruiter_secret = told`); **[She's fishing. I never dealt with her.]** (`denied`, new); **[Hang up.]** (`kept`, the first-line default on this branch).

**What each costs and buys.**

| Option | Felt in m09 | Later |
|---|---|---|
| Own it | Said aloud with HaX listening. HaX, after a beat: "Noted. Later." and, at Beat 2.7, the reason this isn't m05's private confession: "Last spring I'd have kept that between us. Not tonight." (R2-13; it is the night she will own her own silence.) Then the offer (§3.2): all four routes stay open. HaX tells Netherton, because she has to; at the debrief, "HaX tells me you said something on that call. I do not need to hear it twice." | m10: Tesseract's leverage dies on the line ("They told me. Next."). It goes on the player's record: a clause in the player's own "In this operation" credit (§11 change 6). |
| Deny it | The Recruiter, amused: "Of course. Shall we do business anyway?" HaX says nothing. All four routes stay open: a liar can still buy the name. Netherton never hears of it tonight. | m10: Tesseract's leverage line exposes a lie, not a silence. HaX: "You told me she was fishing." She makes it her 06:00 walkabout pick, and it is a harder conversation than on `kept`. |
| Hang up | Her half of the call ends there, so the deal is off: it plays as a refusal, and HaX asks which tape (§3.2 step 3). HaX asks about the spring once, later, and lets it lie. Netherton never hears of it tonight. | m10: Tesseract tells HaX on the open line that her agent never explained the deal ("I'll deal with that when this is done."), and HaX makes it her own pick in the 06:00 walkabout. |

**How the cost is signposted.** The Recruiter's line does it: the deal is said on an open line, and the player knows HaX heard it. Hanging up visibly ends the call, and with it the offer.

**Dominance.** Owning it keeps the offer and kills Tesseract's leverage, at the price of the record tonight. Denying keeps the offer and the record, at the price of a lie HaX will hear exposed in m10. Hanging up keeps the record and tells no lie, at the price of the offer and a silence exposed in m10. Each wins somewhere.

**Forced.** Yes: it is the call's first choice, and the call resumes at it.

**Other openings** (no choice of this kind): sold and confessed, the Recruiter's same sold line, then HaX ("We've talked about that. She has nothing on you.", `recruiter_secret = confessed`; stage 7 R2 B-R2-01); no deal in m05, "Last time I said the next one would cost me more. This is the next one."; never played m05, a stranger who knows the player's designation and kit ("Agent 0x00, with a card cloner, a safe cracker and a handler listening. You're standing in my filing system. I thought I'd call.", `""`).

### 3.4 The answer to HaX's confession

**Who and when.** Every player, in the salvage cage after flag 3 (stage 4 P1), when HaX has said she had the name the night Fraser and Ferreira died, with Netherton listening from the aircraft (Beat 3.3). The scene is voiced (F17).

**The buttons**, by the m06 form (Beat 3.3, §14 changes 19 and 24):

| | `should_have_told` | `same_in_your_place` | `afterwards` |
|---|---|---|---|
| m06 name not found | [You should have told me.] | [I'd have done the same in your place.] | [Afterwards. Not during.] |
| m06 name found | [You should have taken it to Netherton.] | [I'd have sat on it too.] | [Afterwards. Not during.] |

**What each does.** A stance, not a trade: HaX is immovable on what she did (it's done), and the player decides how they stand towards it. That makes convergence legitimate (`README_ink_best_practices.md`, "Convergent choices are correct, for stance"), as long as each answer is remembered and paid back. Each is, three times:

| Answer | Her reply, at once (SE §4.3) | Debrief, last on the line | m10 |
|---|---|---|---|
| `should_have_told` | "Yes. I should have." / "You get all of it from now on." | She tells the player everything from now on, starting with the bunker. | Her unasked line at the core ("My agent told me I sat on it. They were right. You never told me anything."), which opens [She learned that from you.] under the third claim. |
| `same_in_your_place` | "Don't be kind about it. *(beat)* Thank you. Once." | A thank-you, once. | [HaX. You're on speaker.] under the third claim. |
| `afterwards` (shown once the player has heard the line: `afterwards_heard or m07_architect_echo_heard`, stage 7 R2 A-R2-08) | "...That's mine. You don't get to use it on me. *(beat)* Thank you." | "You said afterwards. I'm holding you to it." | Her briefing line ("You gave me my own line back in Helena. I'm holding you to it."), then the speaker answer with "All right. Let him hear it from me." first. |

With Netherton listening, "You should have taken it to Netherton" also lands on him; he says nothing, which is the point (his m08 line, "Two of ours are dead in the space between what I knew and what I did").

**Signposting.** None needed, and none given: there is no hidden cost. Every answer opens one m10 record answer under the same claim, so no answer is a better tactic than another. What changes is what HaX and the player are to each other for the last night.

**Dominance.** `afterwards` gets one more line from HaX in m10 than `same_in_your_place`; the extra is tone, not advantage. None of the three is dominated.

**Forced.** Yes. `identity_scene_done` is set on the answer; flag 4's read waits on it, Tesseract's call waits on the read, and the conclusion waits on the call (story arc §11). `hax_confession_answer` is never empty on a finished m09.

**The Reading's line.** If the player told HaX what the Reading says about her ("Their handler will cover for them. She was taught to.", §4.6), her reply to each answer is the Reading-aware one (SE §4.3), heard here and nowhere else.

### 3.5 The memo and the notice

Two linked choices about the finale's argument: was he right nine years ago, and does the player do what he didn't?

**The notice, in the archive** (optional). After flag 3 the player has read the catalogue entry ("Disposition: retain. Operational value."), his memo and the notice he never sent (Beat 3.4). HaX lands the m04 choice in one line by `m04_disclosure_choice` (story arc Beat 3.4), then says what is still exposed, what the watch is, and what sending costs (round 1, C-09 and S3-03).

**The canon this rests on** (shipped m04: Albion patched its own holes on every branch; on `full` they were published and every battery storage site audited). The flaw is in the controller itself, the vendor's control unit, and that controller also runs in water works and substations, which m04's audit never touched: it audited storage sites and fixed their configuration (R2-05). The vendor was never told what SAFETYNET's catalogue entry says, so every other site running the controller is still open. SAFETYNET's watch on Critical Mass runs on those sites, because that is where Critical Mass will try the hole again.

> Agent HaX: Albion fixed its own plant. That controller also runs water works and substations. Four hundred sites, still open. *(every branch except `full`)*
>
> Agent HaX: They audited every battery site. The controller's still in water works and substations. Four hundred sites. *(`m04_disclosure_choice == "full"`)*
>
> Agent HaX: Our watch sits on that kit. Send it, the vendor starts a fix, and the watch comes down.
>
> Agent HaX: And Albion's inquiry gets to ask when we knew. *(on `m04_disclosure_choice == "full"` or `m04_crew_lost`)*

(Stage 7's lines: script edit R1 A-03/A-04 cut the per-Voltage watch lines and two flat buttons; R2 audio cut 1 merged the watch and the send.)

**How disclosure actually runs** (R2-04; the teaching point). A notice starts a clock; it closes nothing tonight. The vendor acknowledges within hours, works to the usual coordinated-disclosure deadline of about ninety days for a fix, and the fix then takes months, often a year or more, to reach industrial sites, some of which never apply it. The watch goes dark at once only because SAFETYNET chooses to pull it: once the vendor is investigating that controller, SAFETYNET's own access in it would be found, and the service won't keep using a hole it has just reported. Every line below keeps to that.
>
> Agent HaX: It isn't my call. It isn't yours either. If you're going to, don't ask me first.

(The inquiry cost exists only where m04 left a public inquiry: `full`, or any branch with `m04_crew_lost`. On `quiet` and on `partial` without deaths, Albion was a classified maintenance fault, and the line is not said. m09 does not import `m04_crew_lost` today; it is already exported by m04 and read by m10, so m09 adds it to its Tier 2 imports, §11.)

In HaX's hub, from any room, any time before the debrief (stage 4 P8): **[His notice. Send it.]** / **[Not yet.]** ("It keeps. So does the hole.") (C-13: the button passes no verdict, and "nine years late" is left for Tesseract to say in m10.)

**The notice, at the debrief** (new; forced; §1 change 7). If it is still unsent, Netherton hands it to the player straight after the memo stance (below), before the hub, by the same branches (C-15, worst line 5, S3-15):

> Director Magnus Netherton: His notice is still on that box. Send it, and the vendor starts on a fix for four hundred sites and the Critical Mass watch comes down tonight. *(on `full` or `m04_crew_lost`:)* The inquiry will ask when we knew. Hold it, and he can call us hoarders, and be right. You read it. You decide. I'll sign whichever.

**[Send it.]** / **[Hold it.]**

| Option | Felt in m09 | m10 |
|---|---|---|
| Send (`albion_notified = true`), in the archive or at the debrief | In the archive, HaX pushes it through: "Gone." A beat later, the gain and the cost together: "Vendor's acknowledged. They're saying ninety days for a fix. Getting it onto four hundred sites will take a year." / "Analysis is pulling the watch. It's dark by morning." At the debrief, sent in the archive: "You sent it without asking me. I would have said yes. I would have taken a week to say it." Sent at the debrief: "Then I sign it." | The record answer under the second claim ([I sent your notice. Tonight, from Helena.] / "Nine years late." / "*pause* Sooner than I managed."); HaX's line at the database choice, carrying the cost the player already paid ("You burned the Critical Mass watch for one letter. This is that letter, a thousand times.", m10's wording, P41); the Albion "Elsewhere" clause gains a variant (on `full` or `m04_crew_lost`: the inquiry asked SAFETYNET when it knew). |
| Hold (`albion_notified = false`) | The watch stays live, and the four hundred sites stay open. At the debrief, Netherton: "Then it waits behind Montana, with everything else." | No record answer from it; Tesseract's hoarding claim has one fewer answer. If the player discloses at the core, the Critical Mass watch is one of the operations that burn (on m10's list). |

Whether it was sent in the archive is read from `debrief_notice_before`, which HaX's "[Bring me in.]" knot copies from `albion_notified` before the debrief opens. It is never a value taken on the debrief's own first line, because the debrief restarts at its knot after a reload (stage 4 §5, §6.5; this replaces S3-16's ink temp).

The m10 record answer stays "Tonight, from Helena." for both send points: the debrief is in a Helena hangar.

**The memo stance** (forced, a stance). Debrief beat 4: "You've read his memo. Was he right?" **[About Albion, yes.]** / **[No. Not about any of it.]** (`memo_stance`, local). Paid at the pen: "Then I sign for him too." / "Good. Then he can make that argument in court, and lose it." Neither is wrong; it records what the player thinks before m10 makes them argue it. It precedes the notice question, so a player can say he was right and still hold the letter, or say he was wrong and send it anyway.

**Dominance.** Before this stage, sending cost nothing and holding bought nothing. Now sending starts the fix for four hundred open sites (a fix that will take a year to land) and wins an argument against him, at the price of an operation SAFETYNET chooses to pull (and, where Albion had an inquiry, the service's quiet); holding keeps the operation and leaves the sites open with nobody fixing them. This is the coordinated-disclosure question in small, done once before m10 asks it at the size of the whole database. At flag 4, HaX's one line sets real full disclosure (one researcher, one flaw, after the vendor stops answering) and this coordinated notice apart from the Publication's mass release (story arc Beat 3.5; milestone D-02).

**Forced.** The send in the archive is optional and never pushed. The debrief question makes every player decide, held by the debrief's spine: the conclusion task is completed on the debrief's last line (story arc §7), after this beat.

## 4. Optional and branch choices

### 4.1 Nightshade's file (triple-agent branch)

**Who and when.** `m08_nightshade_triple_agent` only: the player kept Nightshade in play as a triple agent, and he rang at flag 1 (Beat 1.4). The choice opens once his recruitment file is out of the plan cabinet and in the player's hand (Beat 2.2), and stays open in HaX's hub, from any room, until the debrief (stage 4 P8).

**The question.** Do you tell a man the truth about what was done to him, when the truth makes him less use to you? It is the finale's disclosure-or-hoarding argument at the size of one person.

**Signposting.** HaX asks once, in her hub, and names both sides (new; §1 change 8):

> Agent HaX: He doesn't know this exists. Send it, and he stops being theirs. He stops being much use to us after, too.
>
> Agent HaX: Keep it, and he stays useful. He never finds out what his teacher wrote about him.

**The buttons**, behind HaX's hub topic "[Nightshade's file.]" (stage 7): **[Send Nightshade his file.]** (`nightshade_shown_file = true`) / **[Hold it.]** (the default; the send stays in HaX's hub until the debrief: after Hold, the topic offers only **[Send Nightshade his file.]**, and retires on the send or the debrief, stage 4 §7.1 topic 10).

| Option | Felt in m09 | m10 |
|---|---|---|
| Send | One text back (SE §2; `nightshade_phone`'s mapping on `nightshade_shown_file`, stage 4 §6.6): "Thank you. I'd rather not have known. No. That isn't true." With his copy saved (§3.1): "You found what I cleared, too. Then you know I kept his notes. I'd have burned anything else." | At the door he tips the board on the Architect and gives the override he was saving (the security office's alarm panel); the player takes him in or leaves him at the post (row 105). **His channel is spent**: he has picked a side out loud, so it is not one of the operations Secure keeps or Disclose burns at the database choice. |
| Hold | No reply; HaX says nothing more about it. The player carries something about him that he doesn't know. | He gives the payment warmly, one entry wrong (the tripwire at the tunnel's inner door unless the player checks it against the m09 defence list; the security office reopens it). **His channel survives the raid** (he never went below ground and never turned openly): at the database choice it is one of Secure's possible payoffs and one of the operations Disclose burns ("He's been moved. I can't reach him."). |

**Dominance.** In stage 1, sending won outright: the override for nothing, against a tripwire for nothing. With the channel as the price, sending wins tonight and costs the long game; holding risks a tripwire the player can check for, and keeps an asset that matters again at the core. This also settles FA §13 item 27 for Nightshade: why his channel can be live after the raid.

**Forced.** No. It is a branch choice and stays optional, but HaX asks it as a question with two buttons, so holding is a decision rather than something the player missed. The m10 defaults (not shown) are the hold branch.

**Never played m08, or arrested or silent.** No choice. His file is still the proof, and still in his teacher's hand.

### 4.2 Noor

**Who and when.** Every player meets Noor Haddad at the front desk (Beat 1.2), loading boxes for Sorensen's "scheduled destruction run". She is one of the forty-seven candidates and doesn't know it; last month Sorensen gave her a cash "after-hours filing bonus", and Noor has wondered since how her boss knew about her father's dialysis (SE §3).

**What the choice is about** (round 1, C-05 and C-07). Noor and her father, and nothing else. The legacy files are not tied to her any more (§4.3). Her job is not the cost either: by morning the archive is a crime scene on every route, and pretending she keeps it would be false. The cost is her father. Told, she is a witness against the Initiative, and a witness goes where SAFETYNET puts her and rings nobody until it is safe; her father is on dialysis in Dearborn, and she is the one who rings him every night and pays for it.

**By m05 branch** (row 62):

- **Warned in time** (`m05_found_pipeline_list and not m05_recruiter_deal_accepted`): she already knows, so there is no choice. She gives the warning and hands over her card. (On every other branch the player can clone it while talking to her, so the staff-door route never depends on her help or a knock-out; stage 4 P5.) She has also held back the last box of the night's run, which she was meant to take to the cage ("I didn't send the last one. It's under the desk."): the legacy files, saved as a reward for m05, without a choice (§4.3 sets the value).
- **Warned late** (found, sold and confessed) and **not warned** (every other case, cold starts included): the choice below.

**The buttons**, any time she is at the desk once she has mentioned the bonus ("She knew my name before I said it. Gave me a five-hundred-dollar filing bonus my first week.", ink-local `noor_asked_peg`): **[That bonus wasn't for filing. She was sizing you up.]** (stage 7 R2 B-R2-02); once the player has read the printed ledger after flag 2 (`ledger_page_seen`, set by HaX when `printed_ledger_read` changes with `flag2_submitted`; a read of the enciphered binder before flag 2 doesn't count, stage 6 C-06), **[Read this. It's her ledger. You're on it.]** (stage 7 R1 B-07; her codename, LINNET, on the candidates' row: "$500, filing bonus", "Father, dialysis, Dearborn."); or leave her be (no button). "Show" uses the printed ledger from the shelf in the restricted cage (stage 5 §3.7), a readable, not an item, so the page survives its shredding as something the player has read; it is the same choice with proof attached, and saves nothing extra (S3-17).

| Option | Felt in m09 | Debrief |
|---|---|---|
| Tell her, or show her (`noor_told`) | She asks the one question the scene is for ("My dad's on dialysis in Dearborn. I never told her that. How did she know that?"; shown the page, "Was I going to say yes? Don't answer. I know I was."). Then she reaches for her phone to ring him. HaX, in the player's ear: "Don't let her ring from here." The player says it: **[Not tonight. Not from here.]** (R2-07). She puts it down and goes out with Arakawa's people. Her desk is empty for the rest of the night. | "Miss Haddad is in a hotel in Great Falls with two of Arakawa's people. She has not been allowed to ring her father. She asked twice." |
| Leave her be | She keeps loading, and at the end of the run she goes home and rings her father, as she does every night, not knowing, still on a recruiter's list. | "Miss Haddad went home and rang her father. She is still on a list, and she does not know it." (stage 7 R3 C-R3-01; warned in time instead: "Miss Haddad went home at the end of her shift. She knew what list she was on before you arrived.") |
| Knock her out (`noor_ko`, any branch; milestone M-02) | She stays down at her desk until Arakawa's people collect her. A box she held back (warned in time) stays under the desk, so `legacy_files_saved` is unchanged; her staff-door card drops. HaX says nothing; the debrief does. Like Old Coyote's, a conduct test that buys nothing. | Checked before her other two lines: "Miss Haddad woke up at her own desk with a headache and two of Arakawa's people. She has asked who hit her. I have not told her." |

**Signposting.** HaX, the first time the player can tell her (`noor_asked_peg or ledger_page_seen`, stage 7 R3 B-R3-01): "Tell her and she's a witness. She goes tonight, and she doesn't ring her dad for a while."

**Dominance.** Telling gives her the truth and SAFETYNET's protection, and takes her father's voice away for weeks. Leaving her be keeps her nightly call home and leaves her a target who doesn't know it. Neither is free, and nothing else in the mission rides on it.

**Forced.** No.

### 4.3 Sorensen, once the cage is open

**Who and when.** Every player. Once the cage is open she keeps feeding the shredder and does not fight (a non-combat state, Beat 2.1).

**What she has left: the legacy files** (round 1, S3-01, S3-05, C-06, C-07). The last box of the night's run is the Initiative's legacy placement files outside SAFETYNET: names, in her own hand, the work she is proudest of, which is why she shreds it last. The SAFETYNET placements are not in it: when the Architect took WREN's tasking, those files went onto the Recruiter's tape, which is why her file is "her network, all of it" (§3.2). On the tape they are listed by codename only, and the key from codename to person was hers alone (D-01). The box never names WREN. HaX, on reading it: "Nobody of ours in here. Ours are on her tape, by codename." These are the Initiative's method used outside the service; they are not the answer to m08's "others in this service".

- **Why it can't be wheeled away.** The box is open on the shredder's feed table, behind her, with the feed running; she is between the hatch and the table and works from it sheet by sheet. Taking it means going through her.
- **The value is set at `cage_opened`**: `legacy_files_saved = true` if Noor held the box back (warned in time, §4.2); otherwise it is on the feed table, at risk.
- **The clock.** It goes under the shredder at the **first** of: the player taking Nightshade's file from the plan cabinet, or the player first leaving the opened cage (the cage is its own room, stage 4 P4). Until then a knock-out on Sorensen sets `legacy_files_saved = true`. The leaving half is the same event the Recruiter's call waits on, so Sorensen never waits for the player to come back.

**Can talk stop her?** (FA §13 item 38.) Yes, with a lever that fits her, and it stops her without turning her. An arrest alone doesn't: she answers it without looking up.

> Margaret Sorensen: When I've finished, dear. You'll want the list to be complete.

The lever is Nightshade's recruitment file, which she knows was kept off her schedule (her own pencilled query, "Reading (safe). Plan chest: not listed. Keep?"). With it in hand: **[Your Architect kept his own papers off your list. Only yours burn.]** (worst line 3; stage 7 R1 B-12). She reads the file's label, sets down the stamp, and the shredder stops:

> Margaret Sorensen: Then I'll keep what's left. Give me a pencil. I'll write down what I've destroyed, accurately.

She will not say WREN's name, now or later ("I keep records. I don't read them aloud.").

**The options.**

| Option | When it works | Felt in m09 | Debrief |
|---|---|---|---|
| Stop her by force (`sorensen_fate = ko`) | any time once the cage is open; saves the legacy files only before the clock runs out | The shredder stops. HaX, once: "She's sixty-six." If the files were still on the feed table, they are the player's to read. Her card drops. | "Mrs Sorensen woke up asking for a lawyer. She has not said a word since." (second in §8's order; stage 7 R1 C-06, no injury named) |
| Talk her down (`talked`) | after the plan cabinet, with Nightshade's file in hand | The shredder stops, and the building goes quiet. She sits at the feed table and writes. The legacy files are gone if they were at risk. | "She wrote down every box she destroyed. She even got the numbers right." (first in §8's order) |
| Leave her | the default | The shredder runs all night. | none (§8) |

Her list is a debrief line, not an object (round 1, C-10; scope simplification). Once she is `talked`, a later knock-out does not overwrite `sorensen_fate` (S3-10); stage 4 does it in the knock-out mapping. "Sorensen still free", for the printed-binder rule (SA Beat 2.3), means `sorensen_fate == "left"` (S3-11).

**Signposting** (C-06). As the cage opens, if the files are on the feed table, HaX says what and when: "That box behind her is the last of the night. The legacy files. She gets to it the moment you go past her to the cabinet, or walk out of this cage. She won't stop for asking." (Stage 5 made the cage its own room, stage 4 P4, so "walk out of this cage" is the line and leaving the cage is the trigger; the "…or leave the stacks" alternative of R2-09 is not needed.) If Noor held them back: "The legacy files are under Noor's desk. Let her shred the rest." HaX says nothing about the lever; the player finds it in their own hand (the file on the critical path), and the query in her safe confirms it later.

**Dominance.** Force against talk is a trade of violence for evidence: force, before the clock runs out, saves the legacy files and costs a 66-year-old clerk a concussion; talk costs the files (if they were at risk) and buys her account of what was destroyed and a quiet end to the purge. Once the files are safe or gone, force buys nothing that talk doesn't, and HaX says so ("She's done with that box."). It stays possible, because any NPC can be knocked out, and is paid as conduct, like a knock-out on Old Coyote (§5).

**Forced.** No. `legacy_files_saved` (exported, new) is true if Noor held the box back, or if Sorensen was knocked out before the clock ran out; m10 gives it one "Elsewhere" clause ("Eleven placements outside SAFETYNET, picked up from the Helena files."). `sorensen_fate` is local.

### 4.4 Tran

**Who and when.** Players who go to the server closet (optional, Beat 2.6). Jesse Tran is wiping the rest of the tape side for Sorensen: the Initiative's legacy recruitment interviews, optional lore, never the deck. He is Social Fabric's man on the staff.

**The options.**

| Option | Needs | Felt in m09 | Debrief |
|---|---|---|---|
| Talk him off it: **[You can explain these to Social Fabric, or to me.]**, then his price, said before the player agrees (C-11): "Fine. It's off. I walk out that door, and I make a phone call on the way." **[Go.]** (`tran_outcome = talked`) / **[No deal.]** (back to the other options) | the letters from the cage (§3.1) | No fight. The tape side is saved. He walks, and Social Fabric knows SAFETYNET has its letters by morning. | "Tran left on foot. His handler is being watched, and knows it." (last in §8's order) |
| Knock him out (`ko`) | nothing | A fight, and on `m01_maya_ko` the guard he called if he saw the player first (Lyle Dillard, Statewide Security; stage 6 §5). The tape side is saved. He is held and says nothing. | "Tran is in custody, and has asked for a lawyer and a phone charger." (last in §8's order) |
| Leave him | nothing | The tape side is wiped. No risk. | none |

**Dominance.** Talking spares a fight and lets an enemy agent walk, warning his cell; force keeps him and costs a fight; leaving costs lore and nothing else. Each wins somewhere. This is a small choice, kept small: its payoffs are m09's, and the letters carry Social Fabric into m10 on their own (§3.1).

**Forced.** No.

### 4.5 Old Coyote

**Who and when.** Every player who crosses his round, from the loading dock on (Act 1). Cody Old Coyote, 24, is innocent and paying for a lineman's course (SE §3). HaX says so first: "Night guard. Twenty-four. Not ours, not theirs. Don't hurt him."

**The options.** Talk past him as whoever the player is playing (the auditor, a contractor); the truth, in three forms by the cover claimed (stage 7 R3 B-R3-03): "[I'm not an auditor. You don't want to see tonight.]" → "Figured. Auditors bring coffee. I'll be in the truck."; "[I'm not here for the shredder. Go and sit in your truck.]" or, with no cover, "[You don't want to be a witness tonight. Go and sit in your truck.]" → "Figured. I'll be in the truck." (`old_coyote_told`); sneak past; or knock him out (`old_coyote_ko`).

**What each does.** Talking or sneaking past costs nothing. Telling him the truth takes him out to his truck for the night, so his round is gone, and he becomes someone who knows SAFETYNET was there; his incident book stays on his desk for the player to read either way. (Round 1 scope cut: the link to Tran's radio call on `m01_maya_ko` is dropped; Tran's call simply finds nobody if he has left.) Knocking him out is quickest and buys nothing the others don't; the cost is the debrief's line (§8's order): "Your night guard wants to climb power lines for a living. He will. Not this week."

**Dominance.** The knock-out is deliberately the worst option: a conduct test, as every mission has one for an innocent, with HaX's warning in advance. The other three each have a small reason (the truth clears the round; a cover keeps the building unaware; sneaking needs no conversation).

**Forced.** No.

### 4.6 The Reading, and what to tell HaX

**Who and when.** Every player opens Sorensen's safe (the tape room's key card is in it), and the Reading is in it: the Architect's four entries on Agent 0x00 and a last page (Beat 3.1, SE §5.1). Finding it is a task; reading to the end is not.

**Reading to the end** (`reading_finished`). Not a dilemma: it rewards curiosity (`README_ink_best_practices.md`, "Reward curiosity with real advantage"). The player who reads on finds his prediction ("They will press it. I will not need to ask."), and in m10 has [Your file says I press it. Watch me.] under the third claim and his "Then I was wrong about one thing." after "Stop it". Putting it down costs those and nothing else. It is the one optional action that is allowed to win outright, because it costs only attention.

**W-26, the bin note** (FA §13 item 38; handed on by story arc §8). Added, as one pencilled line in his hand in the last page's margin, written before tonight, the same for every player:

> They will save Lawson's file. They will want to know why he did it.

It sets nothing and stays outside the Reading's four entries (D-06). On `cage_bin == "derek_file"` (the default too) he was right, and the player has it in his hand that he guessed them. Otherwise he was wrong, and the player has seen him be wrong before m10 asks them to prove it. m10's "Then I was wrong about one thing." becomes "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != "derek_file"`. Cold starts read the same line: Lawson's file is in the bin on every branch.

**What to tell HaX** (`reading_told_hax`, local). Afterwards HaX asks once whether the player wants to tell her what it says. **[All of it.]** (including "Their handler will cover for them. She was taught to.") / **[It's about me. It can stay that way.]**

- Telling her hands her the cruellest line in the file just before her confession, and her reply to the player's answer knows it (stage 7: "He wrote that I'd cover for you." then "I covered for him." on `should_have_told`, or "Tonight you covered for me." on the other two).
- Keeping it does to HaX, in small, what she did with the name: the player holds something back from someone they work with, for their own reasons. Her confession reply is the plain one.

Both are stances with a different line each; neither costs the player anything mechanical, and neither is the right one. The parallel with her silence is the point, and nobody says it aloud.

**Forced.** No.

### 4.7 The raid team and Kowalczyk

**The briefing** (`raid_team_answer`: `quintero` / `kowalczyk` / `""`). Every player, after the team's four beats (story arc §3.3): **[Quintero's right. Send me anyway.]** (backs Quintero; stage 7 R2 C-R2-01), **[Thank you. For the cracker.]** (thanks Kowalczyk), or nothing. Nobody in the room yet knows what the answer will mean. It is paid back once, where it hurts (W-19): on Kowalczyk, when the Recruiter names her, HaX: "You thanked her at the briefing. Keep doing it."; on Quintero, at the Harwick & Lowe sheet, HaX: "You took her side at the briefing. Keep it. Don't take her word." A stance, so convergence is fine; it is remembered.

**The hangar** (`kowalczyk_reply`: `warm` / `flat`). Every player, debrief beat 2: "Well? Did my toy earn its keep?" **[Thank you. I was glad of it.]** / **[It was in my pocket.]** (stage 7 R1 ruling 1: both hold when the PIN opened the safe)

| Player knows | Warm | Flat |
|---|---|---|
| nothing (`not sleeper_named and not sleeper_shortlist`) | A colleague thanked for a kindness. | A colleague brushed off. |
| two faces (`sleeper_shortlist`) | Kind to someone who may be WREN, or may be innocent. | Cold to someone who may be innocent. |
| her name (`sleeper_named`, taken) | The player performs for WREN, as Netherton will ask in the spine ("Until then she sees nothing in my face. Nor in yours."). | The player can't, or won't. Narrator, as Netherton arrives: "He watches her go back to the ramp, and says nothing." |
| her name, double-crossed | No choice: she isn't there. Her crate sits on the ramp with nobody to lift it, and Netherton reaches the player first: "Kowalczyk took a phone call when we landed and walked off the apron. Her phone was in a bin by the fuel bowser." | |

**The debrief's `double_crossed` forms** (R2-02). Stage 1 keys two spine beats on `sleeper_named`, which is also true on `double_crossed`; each gets a variant, checked first (`recruiter_offer == "double_crossed"` before `sleeper_named`):

- **Why the team goes in together**, the last spoken line: "She knows we know. She'll be where he is. So will we." (in place of "We take her at the briefing, in front of the others…").
- **The last image**: no wave. Narrator: "He caps the pen. Her crate is still on the ramp."

Stage 1 gave the flat reply Netherton's "Warmer, next time. She notices.", which promises an effect nothing delivers: she is cuffed at m10's briefing whatever she noticed. The line is replaced by the narrator's (§11 change 19). The alternative, exporting the reply so m10 can give her "You were cold in the hangar. I wondered." as she is cuffed, costs an export for one line; it is listed as an option, not recommended. The hangar is about what the player can bring themselves to do face to face, and that matters without a payoff.

**What the player owes Kowalczyk** is §7's question. These two moments are where the player answers it, before m10 asks them to accuse her.

## 5. Dominance and forcing audit

One row per choice. "Stage 1 problem" is what this stage found; "now" is the state after §3–4.

| Choice | Stage 1 problem | Now | Forced by | Gates completion? |
|---|---|---|---|---|
| D Cage bin | A choice between records; the letters' value unreadable at the hatch; no m10 echo | Past against present: Derek's file against a union rep the player can still warn; `cage_bin` exported, an m10 line per value | the cage opening (event) | no |
| G Recruiter and deck | "Take" cost nothing "refuse" didn't; both "pull nothing" routes dominated; the invoice only in m10; the double-cross cost nothing material (C-02) | Price is the whole deck; every cost voiced on the call; the invoice shown and priced as moral; the double-cross voids the name (WREN warned and gone) | `deck_choice_made` opens Sorensen's office (lock); re-ring rule, crossing to HaX at the tape choice | no: every route reaches the office |
| H Own it, deny it, hang up | Hanging up bought nothing; no way to lie (C-12) | Three answers, each winning somewhere (§3.3) | the call's first choice | no |
| K Confession answer | none (a stance, each value paid three times) | unchanged | `identity_scene_done` → flag 4's read → Tesseract's call → conclusion (condition chain) | no |
| L The notice | Holding was dominated; optional, so many players never met the finale's argument | Sending starts the fix for four hundred open sites and SAFETYNET pulls the Critical Mass watch (and, on `full` or `crew_lost`, faces the inquiry); every player decides at the debrief | the debrief's spine (the conclusion task is on its last line); a new row for SA §11 | no |
| M Memo stance | none | unchanged | the debrief's spine | no |
| F Nightshade's file | Holding it was dominated | Sending spends his channel; holding keeps it | not forced (branch only); HaX asks with two buttons | no |
| B Noor | Telling had no cost and leaving no gain; in the first draft, a timing puzzle for the legacy files with a false "job" cost (C-05, C-07) | Truth and protection against her father's nightly call; no loot attached | not forced | no |
| E Sorensen | "Saves what she hadn't reached" named nothing; in the first draft, a hidden trigger (C-06) | Force, before a clock HaX names, saves the legacy files and costs violence; talk (with the file) gets her account | not forced | no |
| I Tran | none serious | Talk lets him walk and warns Social Fabric; force keeps him | not forced | no |
| C Old Coyote | none | unchanged; the knock-out loses everywhere by design | not forced | no |
| J The Reading | none | unchanged; reading on wins outright by design (curiosity); the bin note added | not forced | no |
| A, N Raid team, hangar | the flat reply's "She notices" promised a payoff that never came | the promise cut; both are stances, each remembered | A: not forced; N: the debrief's spine | no |

**Options allowed to lose everywhere.** Two, both conduct tests the season already uses: a knock-out on an innocent (Old Coyote; Noor; Sorensen once the legacy files are safe or gone), and putting the Reading down. Each is warned or costs only attention. Everything else wins on at least one thing the player can see.

**What the critical path never waits on.** No choice, no find and no import: the four flags, the office (opened by the deck choice, whatever it was), the safe (the cracker, which is in the start kit, or the rent ledger's date, `060216`), the tape room (the card in the safe), the salvage cage (the code from the notepad and the legend beside its keypad, with or without Gary). Every person-lock has a route that needs no conversation to go well: Noor's card can be cloned on every branch, Sorensen's at the hatch on every branch. `concludeRequires` is the four flags only.

## 6. How earlier choices change these

Imports change what a choice is worth, who offers it, or which buttons exist; none removes a forced choice or the critical path. Tier is FA §3.1's. "Never played" is the canon default (FA §3), and every choice works on it.

**Tier 1 imports that change a choice**

| Import | Choice | What changes | Never played / default |
|---|---|---|---|
| `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed` | G, H | Dealt and lied: the deal opens the call and adds H; a hang-up becomes a refusal. Sold and confessed: HaX kills her leverage first, and `recruiter_secret = confessed` | No deal or never played: "Last time I said…" / a stranger; no H |
| `m05_final_choice` (with the never-played canon) | G | What her file is worth, said by HaX before the answer: the handlers for the twenty-three (default); on `public_exposure`, her handlers and the forty-seven; on `turn_double_agent`, the names Torres couldn't give. m10's "Elsewhere" clause for her network follows it | Torres arrested: the handlers for the twenty-three |
| `m05_torres_turned` | G (after a refusal) | Torres' sick-parent line lands on the shortlist: the refusing player's lost certainty is partly made up | No call; the cross-reference the full way |
| `m05_found_pipeline_list` (with the two above) | B, E | Warned in time: Noor already knows (no B), and she has held the last box back, so the legacy files are safe at `cage_opened` and E's force buys nothing; warned late: B exists, and she keeps her card (it can still be cloned, stage 4 P5) | Not warned: the full choice |
| `m08_nightshade_tidied` | D | The other bin is Nightshade's copy, not the letters | The letters |
| `m08_nightshade_triple_agent` | F; D | F exists only here; the copy changes his text reply | No F |
| `m01_maya_ko` (with `m01_completed`) | D, I | The letters give back Maya's warning before Tran's guard; Tran is a surprise and calls a guard | `m01_completed and not m01_maya_ko`: HaX warns about Tran first; never played: the neutral warning |
| `m03_victoria_fate == "recruited"` | D | The maintenance code opens the gate without the hatch; the bin choice is made at the cage door as it opens, from a hidden Sorensen record that holds both files (stage 5 §3.7) | The hatch |
| `m06_architect_identity_found` | K | Which answer wording (Netherton or "told me") | Not found |
| `m07_teacher_discussed`, `m07_architect_echo_heard` | K | HaX's opening and recognition line before the answer | The fourth form |

**Tier 2 imports that change a choice's framing**

| Import | Choice | What changes |
|---|---|---|
| `m04_disclosure_choice` | L, M | HaX's line at the Albion papers: the player told the inquiry everything, half, or nothing, and SAFETYNET told the vendor nothing for nine years. A quiet player is asked to do with his letter what they didn't do with theirs. Reading entry 3 says the same from his side |
| `m04_voltage_captured`, `m04_voltage_escaped` | L | Whom the Critical Mass watch is waiting for: Voltage's people (escaped), what's left of his crew (captured), Critical Mass (default) |
| `m04_crew_lost` (new m09 import, Tier 2) | L | With `m04_disclosure_choice == "full"`, whether there is an inquiry to ask when SAFETYNET knew |
| `m01_final_choice` | D | What the Reading's page 1 and HaX's bin line say about Derek (his standing order on `surrender`; the press on `expose`); his file's text is fixed (stage 6 C-07) |

**Choices m09 makes inside itself.** The briefing answer (A) is paid in G and at the Harwick & Lowe sheet; the cage bin (D) decides whether talking Tran (I) is possible; Nightshade's recruitment file (found by every player) is the lever for talking Sorensen down (E); the m05 import, not Noor's choice, decides whether force on Sorensen is worth anything (round 1, C-07: Noor no longer feeds Sorensen); the Reading (J) changes HaX's reply in K. These links are the night's texture: what a player did an hour ago changes the next room.

**The default path.** A player with every import at its default: Noor not warned (B open), the letters as the other bin, no F, no H, the stranger Recruiter with the full offer (G), HaX's fourth form (K), the generic Critical Mass watch (L). Every forced choice is present and priced.

## 7. The moral questions

m09 asks four questions. It answers none of them for the player, and m10 makes the player argue each one with the man who raised it.

**1. Disclose or hoard?** The finale's spine, asked at several sizes before m10 asks it at the size of the database:

- A flaw (L): send the letter he drafted nine years ago, and lose an operation and the service's quiet; or keep both.
- A man (F): tell Nightshade what his teacher wrote about him, and lose a useful asset; or keep him useful and ignorant.
- A woman (B): tell Noor what the bonus was, and cut her off from her father for weeks; or let her ring him tonight, unknowing.
- The past or the present (D): the answer to the player's first case, or a union rep in Butte who hasn't been ruined yet.
- A network (G): the Recruiter's file is the one thing in the building she wants hidden, and pulling it is the only way to use it.

None of these has a free answer, and the player's pattern across them is their position on his argument before he makes it.

**2. HaX's silence.** She sat on the name, the dead are on the wall, and Netherton is listening (K). The player can blame her, absolve her, or hand her own rule back to her. The Reading asks the same in miniature: the player can keep his line about her to themselves (J), as she kept the name. Nothing marks a right answer, and the debrief and m10 pay each one as what the two of them now are.

**3. Dealing with the Recruiter.** Buying from a criminal (G): the name is always right, the price is the deck, and the sale goes in her books where he will read it. Keeping your word to her, or breaking it for half her people and losing what you bought. For a player who let her courier have the forty-seven in m05, saying so aloud, lying, or hanging up (H). The questions under it: is a true name bought from her worth a network left in place, and does a bargain with her bind you?

**4. What the player owes Kowalczyk.** She gave the player her own cracker, it worked, and she asks after it. On take the player knows she is WREN and must thank her, or not, to her face, with Netherton walking up (N); on the double-cross the deal they broke is what warned her, and she isn't there to face; and the Recruiter tells them why she did it, as an expense: her mother's care home, paid every month for eleven years. On the refuse routes she is one of four colleagues, or, after the cross-reference, one of two kind people, one of whom is innocent. The player can't pay a debt to her without lying to her, and m10 asks them to accuse her.

**And one more, underneath: force against people who can't fight back** (E, C). Sorensen is 66 and non-combat; Old Coyote is innocent. The legacy files make force on Sorensen worth something, once, so the question is real; Old Coyote's knock-out is worth nothing, so it is a test of conduct.

## 8. How the debrief reflects the night

**The rule.** Each choice lands first at the moment it bites, in play. The debrief answers only what the player asks, plus the spine, and never reads the night back as a list. The credits' choice lines (drafted in stage 4 §9) are the one place a list is allowed, as the wall was at the briefing.

**Where each choice has already landed before the hangar.**

| Choice | Lands in play at |
|---|---|
| D bin | the shredder taking the other; the hand comparison (Derek's second sample); "Arakawa's ringing Butte." (the letters); his text (the copy) |
| G Recruiter | the name said; the degausser; the ledger line booking the sale; her text and, in the hangar, Kowalczyk's absence (double-cross); HaX reading the first handler (her file); the clip (the tapes) |
| H the spring | "Noted. Later." on the open line, or her amusement at a denial |
| B Noor | her question, the phone she puts down, her empty desk |
| E Sorensen | the shredder stopping, or not; the legacy files in the player's hand |
| F Nightshade | his text, or silence |
| L notice | "Gone.", the vendor's acknowledgement with its ninety days and its year, and Analysis pulling the watch |
| K confession | HaX's reply, at once |
| Beat 2.7 | HaX names what the purge cost (which bin and which tape are gone), once, after the deck |

**What the debrief adds**, in story arc §7.1's order:

1. **Kowalczyk** (N): the scene itself carries the choice; nobody comments on it. On `double_crossed` her absence is the scene (§4.7).
2. **The memo, then the notice** (M, L): one question each, both new decisions rather than recaps.
3. **The hub**, each topic asked once:
   - **"The archive, sir."** At most two lines, the first two that apply in this order (S3-07): Sorensen talked down ("She wrote down every box she destroyed. She even got the numbers right."); Sorensen knocked down ("Mrs Sorensen woke up asking for a lawyer. She has not said a word since."); the legacy files saved ("Eleven names. None of them ours. Tonight that is the best news I have."); Noor (knocked out, else told or left, her line from §4.2); Old Coyote knocked out; Tran (talked or knocked out). Sorensen's and Tran's "left" outcomes, and lost files, get no line. Noor's "left" line plays, because leaving her is a choice with its own cost (R2-10). The bin and the tape are not repeated: HaX named them in Beat 2.7. These are the only places the per-choice debrief lines in §3–4 play; a cell marked "(not played; §8)" never does.
   - **"WREN."** and **"The Recruiter."** as story arc §7.1, with the invoice line; on `double_crossed`, "About half of her network. She warned the rest, and she warned Kowalczyk."; on `recruiter_secret == "told"`, Netherton's "I do not need to hear it twice."
   - **"The notice."** only when it was sent in the archive (read from `debrief_notice_before`, stage 4 §6.5; the debrief question covers the rest).
4. **The spine**: the two names; the pen, with his reply to the memo stance; HaX last, by K; why the team goes in together.

**Judgement.** The debrief judges nothing (story arc §7.2). Netherton says what each choice bought, in his voice, and moves on. The one exception is the knock-out on Sorensen, where his line is dry enough to be a judgement without saying so.

## 9. FINALE_ARC §13 items for stage 3

Items owned by stage 3 that concern m09. The m10-only items (14, 24, 28, 34–37, and the m10 half of 11) are the m10 stage 3 author's; where an m09 choice feeds one, it is noted.

| # | Item | Settled here |
|---|---|---|
| 7 | The Recruiter's wording; the double-cross's cost | §3.2 and §3.3: the price is the whole deck; button text; every route priced aloud on the call (her refusal line, HaX's boast and its dismissal, HaX's invoice line); the double-cross voids the name (she warns WREN; Kowalczyk gone by the hangar; at the core in m10). Stage 7 writes the lines. |
| 25 | The Alpha tapes' later use, and whether they play | Below. |
| 27 | Why the branch operations disclose would burn survive the raid (m09's side: Nightshade) | §4.1: his channel survives only if the player held his file; sent, he picks a side out loud at the door and the channel is spent. The watch on a recruited Victoria is m10's to settle. |
| 33 | The invoice and refusing's clean record; rank the clean record | Below. |
| 38 | Talk stopping Sorensen; an m10 echo of the cage bin; W-26 | §4.3: yes, with Nightshade's file as the lever, and it stops her without turning her. §3.1: `cage_bin` exported, with an m10 use per value. §4.6: W-26 added as a margin line on the Reading's last page. |

**Item 25: the Alpha tapes.**

They are saved only on the refusal route that chooses them (`deck_pulled = alpha_tapes`, `recruiter_offer = refused`), so their payoff is what makes that route worth taking against the name.

- **They play** (user decision F12, 2026-10-21). One clip, about fifteen seconds, from the reel deck on a bench in the tape room (not the drop terminal; S3-18; stage 5 §3.9) after the identity scene (`identity_scene_done`; before it HaX holds it: "I know whose voice that is. After."). Tesseract's voice (Sadaltager, as in m07), fifteen years younger, treated as an old lecture-room recording: neither m07's handset distortion nor m10's clean voice in the room, so m10's first sight of him keeps its weight. Two lines, both things he teaches and then does:

  > Dr Adrian Tesseract *(tape)*: The best lock there is opens for the right name. Nobody fights a door that's expecting them.
  >
  > Dr Adrian Tesseract *(tape)*: And build your own way out first. Always. Then let them build their way in.

  HaX says nothing while it plays, then: "Tape two. He gave that lecture every year." It is one non-HaX voice in its scene (a recording counts as one; nobody else speaks there).
- **How it plays.** The engine has no path for an object to play an audio file (S3-18, engine item 25: barks and music only). The clip is therefore an ink conversation opened from the deck (its interaction sets a global that opens a hidden recording speaker's person-chat, so it can be replayed; stage 5 §3.9, §10 item 25), with the two lines spoken by a "Dr Adrian Tesseract (recording)" speaker and HaX's line in her own voice and voiced through the normal TTS pipeline, with a voice style for an old recording. That needs no engine change; the tts-audio skill sets the style, and the user hears it before it ships. A typed transcript on the same object is the fallback if the style can't be made to sound like a recording.
- **The decode** (optional, as stage 1 has it): the annotation sheets decode to his first draft of the line, in his hand: "Carry it yourself. Let it hurt afterwards." HaX, from her hub once the sheet is read (topic 3b, "[His annotation sheets, with the tapes.]", on `alpha_annotations_read`, stage 7 R1 A-05): "That's the version he taught us." It sets up m10's record answer ("You told them to carry it. You never told them to hand it on.").
- **m10**: the record answer under the third claim, as m10 stage 2 has it; at the blast door, as it opens for 0x00 by name, one HaX line ("The best lock there is. Tape two."); and **at the core**, if WREN is free, HaX as the player reaches the console: "Service door. He always builds his own way out first." The beat then runs as FA §4.4 has it, with one change (round 1, S3-04): WREN comes through and reaches for the key, Tesseract refuses her ("Not you, Halina. … It has to be one of theirs."), and Quintero, warned and already moving, takes her before she touches it, **unhurt**. The player still hears his motive from his own mouth. With no Quintero (held, wrongly accused and not recalled, or sent back), the warning goes to the player, who gets the stop-her beat a second earlier; nothing else changes. What this does to `sleeper_caught` is m10's to decide; m09 specifies only the warning and the wound. This is the route's real advantage: the player who refused the name is the one who most needs it. It makes `m09_deck_pulled` a Tier 1 helper in m10 (orchestrator ruling).

**Item 33: the invoice and the clean record.**

- **The invoice: confirmed**, as m10 stage 2 §2.2 has it: on `taken` or `double_crossed`, one ledger sting in his evidence, deciding nothing ("You bought WREN from my Recruiter. You understand costing."). m09 shows the sale being booked (§3.2) and HaX prices it as exactly this ("He'll quote it at you."), so the sting delivers what was promised and no more (C-04).
- **The clean record: confirmed**, as a record answer under the second claim, on `named` or `refused`. Its place is m10's (m10 MC §6.2–6.3, P22, which supersede this stage's "ranked last"; milestone MS-11): exchange 2's slot pools put the earlier missions (`m04_disclosure_choice = full`, then `m02_exposed_hospital`) in slot 3 and Helena in slot 4, `m09_albion_notified` first and the clean record second. Where slot 4 hides it, Tesseract says it for the player in the Recruiter beat ("My Recruiter offered you a name. You wouldn't buy it. I would have."), so it is paid once on every refusing save.
- **Its wording**, for the new price: [Your Recruiter offered me a name. I wouldn't buy it from her.] His answer differs by value, because "it worked" is only true on one: on `named`, "*pause* No. You'd rather the slow way. It worked."; on `refused`, "*pause* No. You let her keep her people sooner than pay her. I didn't think your service still did that." Both land; m10 uses this wording.

## 10. State table

Every global a choice in m09 sets, plus the finds m10 or a later m09 line reads. Stage 4 kept these names and added the machinery globals (S4 §5). Every one is declared in `globalVariables` with the default shown, `VAR`-declared in each ink file that reads it, and read somewhere after it is set (`README_ink_best_practices.md`, the three legs). None is an import, so all are writable. None appears in `concludeRequires` or an `unlockCondition` except the done-flags, which hold the night's order (story arc §11).

**Exported to m10** (FA §3.4's nine, plus two added at this stage)

| Global | Values | Default | Set where | Read in m09 | m10 use |
|---|---|---|---|---|---|
| `recruiter_offer` | `taken` / `double_crossed` / `named` / `refused` | `""`; the call's first line sets `refused` | G | debrief "The Recruiter."; the ledger line (`taken`, `double_crossed`); her text and Kowalczyk's absence (`double_crossed`) | an "Elsewhere" clause by value (MS-04: `taken` / `refused` at large, `named` rolled up, `double_crossed` "About half of them"); the invoice sting; the clean-record answer; on `double_crossed`, WREN absent from the team and at the core |
| `deck_pulled` | `none` (with `taken`) / `her_file` (with `named`, `double_crossed`) / `alpha_tapes` (with `refused`) | `""`; the call's first line sets `alpha_tapes` (paired with `refused`); every button writes a legal pair | G | Beat 2.7's loss line; the tape clip and decode; debrief | the Tomb Alpha record answer; the blast-door line; the service-door warning (Tier 1, orchestrator ruling) |
| `sleeper_named` | bool | `false` | G, on her naming line (or the resumed call's "Halina Kowalczyk."), never on the button (R2-03) | the hangar; debrief "WREN."; Beat 3.1's cracker line | WREN detained at the briefing on `taken`; on `double_crossed`, named but gone. m10 keys the briefing arrest on `recruiter_offer == "taken"`, never on `sleeper_named` alone (MS-03) |
| `sleeper_shortlist` | bool | `false` | reading the Harwick & Lowe sheet (a find) | debrief "WREN."; the hangar | HaX's "Two faces from Helena." on `not m09_sleeper_named` |
| `recruiter_secret` | `""` / `confessed` / `told` / `kept` / `denied` (new) | `""`; first line sets `kept` or `confessed` by branch | H | debrief (`told`); the Recruiter's reply (`denied`) | Tesseract's leverage line and HaX's reply (on `denied`, "You told me she was fishing."); on `told`, a clause in the player's own "In this operation" credit |
| `hax_confession_answer` | `should_have_told` / `same_in_your_place` / `afterwards` | `""` (never empty on a finished m09) | K | her reply; the debrief's last HaX line | the core and the briefing (FA §5.4) |
| `albion_notified` | bool | `false` | L (archive or debrief) | debrief (`debrief_notice_before`, copied in HaX's "[Bring me in.]" knot, tells an archive send apart) | record answer under the second claim; HaX at the database choice; a variant of m10's existing Albion "Elsewhere" clause on `full` or `m04_crew_lost` |
| `nightshade_shown_file` | bool | `false` | F | his text | the door (override or tripwire); whether his channel is live at the database choice |
| `reading_finished` | bool | `false` | J | none | record answer; "Then I was wrong about one thing." (or "two things") |
| `cage_bin` **(new)** | `derek_file` / `letters` / `nightshade_copy` | `""`; `cage_opened` writes `derek_file` if the player took neither | D | the hand comparison's second sample; Arakawa's call to Butte and Tran's talk (letters); his text (copy) | Derek's record answer; HaX's line at the server-hall prop (letters; was the media room's, then Tran's handler line; m10 places it); the door line (talking branches, not after the shown-file text); the "two things" variant |
| `legacy_files_saved` **(new)** | bool | `false` | at `cage_opened`, `true` if warned in time (Noor held the box); otherwise `true` on a knock-out on Sorensen before the clock (the first of Nightshade's file taken from the plan cabinet, `nightshade_file_held`, or the player first leaving the opened cage) | the files as an object; HaX's line on reading them; debrief | one "Elsewhere" clause (m10 must add a reader) |

**The export list, one end state** (round 1, S3-06). Eleven exports plus `m09_completed`: `nightshade_shown_file`, `sleeper_named`, `sleeper_shortlist`, `recruiter_offer`, `deck_pulled`, `albion_notified`, `hax_confession_answer`, `recruiter_secret`, `reading_finished`, `cage_bin`, `legacy_files_saved`. **Tiers in m10:** Tier 1 gains `m09_deck_pulled` (orchestrator ruling; supersedes FA §15's "Tier 2" note); `m09_cage_bin` is Tier 2 (the arrested-branch help is dropped, scope 1); `m09_legacy_files_saved` is Tier 2. m10's import count became 67 here (its 66 plus `legacy_files_saved`); it is 90 now (Tier 1 40, Tier 2 50; FINALE_ARC §3.2). **What m10 must change:** read `legacy_files_saved` (one "Elsewhere" clause); handle `recruiter_secret == "denied"` and `recruiter_offer == "double_crossed"`'s new meaning (WREN warned and gone); restate m10 stage 3's "m09 exports ten" as eleven.

**Local to m09**

| Global | Values | Default | Set where | Read by |
|---|---|---|---|---|
| `raid_team_answer` | `quintero` / `kowalczyk` / `""` | `""` | A | HaX at the naming (G) and at the shortlist |
| `noor_told` | bool | `false` | B | Noor's exit; the debrief |
| `noor_ko` (milestone M-02) | bool | `false` | B, a knock-out on Noor | the debrief's "The archive" (checked before `noor_told`); not exported (an m10 "Elsewhere" clause would need it, story arc §20) |
| `old_coyote_told`, `old_coyote_ko` | bool | `false` | C | his round; the debrief |
| `sorensen_fate` | `talked` / `ko` / `left` | `left` | E; a knock-out after `talked` leaves it `talked` | the shredder; the debrief; "still free" (the printed-binder rule) means `left` |
| `tran_outcome` (renamed from stage 1's `tran_stopped`) | `talked` / `ko` / `left` | `left` | I | the tape side; the debrief |
| `reading_told_hax` | bool | `false` | J | HaX's confession reply |
| `memo_stance` | `yes_albion` / `no` | `""` | M | Netherton at the pen |
| `kowalczyk_reply` | `warm` / `flat` | `""` | N | the narrator line on `sleeper_named` and flat |
| `schedule_read` | bool | `false` | reading the master schedule (a find) | the realisation at flag 4 |

`cage_bin` replaces stage 1's working name `cage_bin_saved`. Stage 1's separate "arrest" options for Sorensen and Tran are gone: an arrest doesn't stop Sorensen (§4.3), and Tran is talked, knocked out or left. The first draft's `notice_sent_in_archive` is dropped (S3-16). Stage 4 adds `debrief_notice_before` in its place, copied in HaX's "[Bring me in.]" knot, because a debrief that restarts at its knot after a reload can't use a first-line ink temp.

**Done-flags** that hold the forced choices (story arc §11; not choices, listed so the locks can be checked): `cage_opened` (D happens before it), `deck_choice_made` (G; opens the office), `identity_scene_done` (K; flag 4's read waits on it), `hour_read_done`, `tesseract_call_done`.

**Stage 7 additions** (CONTRACT §5.3–§5.4, as shipped). No export, value or setter above changed; the eleven exports stand. New choice-side state, all ink-local `VAR`s (saved with each story, read by no other file): the Recruiter's `recruiter_hung_up` (G/H: a restart after a hang-up replays HaX's hang-up form, and `recruiter_secret` stays `kept`); Noor's `noor_asked_peg` (B: the bonus button and HaX's signpost wait for her to mention the bonus, or for `ledger_page_seen`) and `noor_cover`; Old Coyote's `coyote_cover` (C: three truth buttons by the cover claimed); HaX's `nightshade_file_decided` (F), `reading_told_hax_asked` (J) and `confession_heard` (K: the identity scene's resume point); the debrief's `asked_archive`, `asked_wren`, `asked_recruiter`, `asked_notice`, `notice_answered` (L at the debrief survives a replay) and `said_floor_line` (Netherton's m08 pen line, once). One new scenario global, `alpha_annotations_read` (the Alpha decode's read latch; gates HaX's topic 3b), and `tran_ko` (`globalVarOnKO`, S5 §8) joins the knock-out globals.

## 11. Proposed changes

Not made here. FINALE_ARC and stage 0 are the arc-keeper's; m10's files are the m10 author's; stage 1–2 wording is listed so the next pass can apply it. Updated to the round 1 structure review's verdicts (accept 20, modify 15) and the rulings; the numbering is unchanged so the verdicts still match.

**FINALE_ARC (arc-keeper)**

1. **Row 60, §3.4 `recruiter_offer` and `deck_pulled`, §6.1 item 3, §2.9, §13 item 25:** the Recruiter's price is the whole deck. Take: she names WREN and nothing comes off (`taken`, `none`). Refuse or hang up: HaX pulls her file (`named`) or the Alpha tapes (`refused`). Rewrite §3.4's value descriptions ("HaX pulled the Alpha tapes, or nothing"), §6.1 item 3's "take + nothing / refuse + nothing" sentence and §13 item 25's "'Pull nothing' already maps to `refused`". The double-cross voids the name: she warns WREN, who is gone before the hangar (round 1, C-02). Her threat line as §3.2. `deck_pulled` is derivable; kept as an export.
2. **§3.4, §3.2, §15:** the one end state in §10: eleven exports; m10 Tier 1 gains `m09_deck_pulled`; `m09_cage_bin` and `m09_legacy_files_saved` are Tier 2; m10's count 67 (90 since the stages 4–5 fold). Supersede §15's "`m09_deck_pulled`'s tier … Tier 2" note. **§3.1:** add `m04_crew_lost` to m09's Tier 2 imports (44 variables).
3. **§4.1, the three exchanges table:** exchange 1 gains Derek's file as its last record answer; exchange 2's clean record is ranked last, worded "[Your Recruiter offered me a name. I wouldn't buy it from her.]", with the answer by value (§9 item 33). Item 33 settled. *(Ranking superseded by m10's slot pools, m10 MC P22; §9 item 33 now says so.)*
4. **§4.1 step 4 (Disclose) and §4.6 (Secured), row 105:** Nightshade's channel is live only on `m08_nightshade_triple_agent and not m09_nightshade_shown_file`. Add the Critical Mass watch to Disclose's branch list on `not m09_albion_notified`. §13 item 27 settled for Nightshade.
5. **§4.4, "WREN at the core":** on `m09_deck_pulled == "alpha_tapes"`, HaX's service-door warning; Tesseract still refuses her; Quintero takes her after it, unhurt; with no Quintero, the warning goes to the player. `sleeper_caught` is m10's. On `m09_recruiter_offer == "double_crossed"`, WREN is not on the team: she is a known face standing beside Tesseract in the core when the player arrives; the refusal plays there, and Quintero (or the player) takes her as she moves, with no service-door ambush and nobody wounded (orchestrator ruling, R2-01). Add HaX's blast-door line to row 119.
6. **§4.6 "Elsewhere" and the credits:** `albion_notified` becomes a variant of m10's one Albion clause, on `full` or `m04_crew_lost` (S3-14); a new clause for `legacy_files_saved`; `recruiter_secret == "told"` goes in the player's own "In this operation" line, not "Elsewhere".
7. **§6.1, the purge:** the legacy placement files outside SAFETYNET (the SAFETYNET ones went onto the Recruiter's tape; the box never names WREN), in Sorensen's hand, open on the shredder's feed table behind her. `legacy_files_saved` is set at `cage_opened` (true if warned in time); otherwise shredded at the first of the plan chest opened or the player first leaving the opened cage, unless Sorensen is knocked out first. HaX says what and when. Talk stops her once the chest is open (her account, not the files). Optional, event-driven, no critical-path loss.
8. **Row 62:** warned in time, Noor has also held back the last box (the legacy files).
9. **§5.1 Tesseract row and "Not voiced in m09":** one voiced clip in the tape room after the identity scene, on `alpha_tapes` (F12).
10. **§13 statuses:** items 7, 25, 33 and 38 settled here; 27 settled for Nightshade; §15's tier note superseded.

**m09 stage 1 (`story_arc.md`)**

11. **Beat 2.4 (and SA:187, SA:600):** the m05 deal wording: "sold her the forty-seven" → "let her courier have the forty-seven", and the own-it button "[She's right. I let her courier have the list last spring.]" (S3-02); the denial button and `denied`; the Recruiter's price, refusal and threat lines as §3.2 (the Architect named, no pronoun for WREN); HaX's boast, the Recruiter's "Nobody has." and HaX's invoice line, all voiced (no private text); the hang-up form of the tape choice, with no Recruiter line (the counter starts; "She's wiping it. She thinks it's gone."; HaX's file/tapes line; "One of them. Now."; R3-01); step 5's routes (no "pull nothing"); `sleeper_named` on her naming line, with the two resume points (R2-03); "Then I'll tidy my own desk. Gone. Goodnight, agent." and HaX's "She watched the counter. Not the copy." (R2-12); the ledger line booking the sale; the double-cross text at the tape room ("…before your plane landed. It's still in the air.") and Kowalczyk walking off the apron at Helena on landing. Replace the route table with §3.2's four rows.
12. **Beat 1.2:** Noor's choice as truth against her father's nightly call; warned in time, the held box. No trolley line from HaX (the files are Sorensen's now).
13. **Beat 2.1 step 6, SA §8 rows 1, 11, 12, Beat 2.6, §7.1 "The archive" row:** Sorensen won't stop for an arrest alone (the separate "arrest" option goes; so does Tran's); the legacy files on her feed table, the clock and HaX's line naming it; the talk lever; a knock-out after `talked` keeps `talked`; "still free" means `left`. Renames: `cage_bin_saved` → `cage_bin`, `tran_stopped` → `tran_outcome` (S3-12).
14. **Beat 2.2:** HaX's two-button question about Nightshade's file and its price.
15. **Beat 2.7:** HaX's loss line covers "both tapes" on `taken`.
16. **Beat 3.1:** the bin note in the Reading's margin (W-26).
17. **Beat 3.2, SA:260, Beat 3.6:** the clip at the tape room's station after the identity scene (not "on the drop terminal"); Beat 3.6's "His voice is never heard in m09." becomes "His voice is never heard live in m09." (R2-11). **Beat 2.7:** on `cage_bin == "letters"`, "Arakawa got Villanueva. She wanted to know who'd bother."; on `told`, "Last spring I'd have kept that between us. Not tonight."
18. **Beat 3.4:** HaX's lines as §3.5: the flaw in the controller, which also runs in water works and substations (so sites stay open after m04's `full` audit), four hundred sites, the `full` line, the watch by m04 branch, the inquiry only on `full` or `m04_crew_lost`; the disclosure timescales (acknowledged tonight, a fix in about ninety days, a year to roll out; SAFETYNET chooses to pull the watch); "Gone.", the acknowledgement, "Analysis is pulling the watch. It's dark by morning." Button "[Send his notice.]".
19. **§7.1 and §11:** the notice handed to the player after the memo stance ("You read it. You decide. I'll sign whichever."), by m04 branch; a new §11 lock row ("the notice → the pen: asked after the memo stance if unsent; the conclusion task is on the last line"; S3-15); "The archive" capped at two lines in §8's order; "The notice." topic only on an archive send; the narrator line replacing "Warmer, next time. She notices."; on `double_crossed`, checked before `sleeper_named` (R2-02): Kowalczyk's absence and Netherton's "took a phone call when we landed" line, the last spoken line "She knows we know. She'll be where he is. So will we.", and the last image "He caps the pen. Her crate is still on the ramp." (no wave).
20. **§8:** point to this document's §2 table; drop "Handed to stage 3"; record the renames.
21. **§13 "Stage 3":** mark settled.
22. **§11 engine list:** add round 1's items 16–29 as amended in §11 below.

**m09 stage 2 (`storytelling_elements.md`)**

23. **§2 Recruiter:** "He took her for Montana … her name" → "Your Architect took my placement for Montana … the name"; add "Say no and I wipe it myself. Same deck, no name." and "I can't see which tape you pull. I can see that you pulled one."; the threat as §3.2; "Nobody has."; the double-cross text with "something off my deck"; "Of course. Shall we do business anyway?" (denial). Any "her money" wording → the courier and the report. **§2 Nightshade:** "kept his letters" → "kept his notes". **§4.3 HaX:** the boast and the invoice line; the notice lines; the Nightshade question as reworded; the legacy-files clock line and "Nobody of ours in here. Ours are on her tape."; "She's sixty-six."; "Tape two. He gave that lecture every year."; "Not tonight. Not from here." (Noor). **§3 Sorensen:** "When I've finished, dear."; "Then I'll keep what's left." **§3 Noor:** her phone, put down. **§5.3:** the letters' last page (Teresa Villanueva, Butte); the tape lines; the bin note. **§2 Netherton:** drop "Warmer, next time. She notices."; Kowalczyk's absence line; the notice question; the two `double_crossed` spine lines. Round 2 lines also go in: the Recruiter's resumed "You hung up on the part you paid for. Halina Kowalczyk." and "Gone. Goodnight, agent."; HaX's invoice line as reworded, "Pull her file and we get half her people. She warns the rest, and Kowalczyk runs.", "She watched the counter. Not the copy.", "I've paused the deck. It won't hold long.", the controller and timescale lines, "Don't let her ring from here." and the player's "[Not tonight. Not from here.]"; Villanueva's quoted line.

**m09 stage 0**

24. **§2.2 "Choices for every player":** "taking it means HaX pulls Tomb Alpha's tapes or nothing instead" → "taking it means the whole deck is wiped"; the notice added to the every-player choices.

**m10 (m10 author)**

25. **Stage 2 §2.2–2.3 and stage 3:** Derek's file answer under exchange 1 (last); exchange 2's clean-record wording (also m10 SE:127 and m10 MC:333's "a name for a file") and per-value answers; "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != "derek_file"`.
26. **The door:** "You read what I cleared. Then you know I kept his notes." on `m09_cage_bin == "nightshade_copy"`, on the talking branches only, and not when `m09_nightshade_shown_file` (m09's text already said it). The arrested-branch help is dropped. A shown file spends his channel; mark m10 SA §13 item 5's "unless taken in" stale.
27. **The core and the briefing:** the service-door warning on `alpha_tapes` (as change 5); the double-cross branch (Kowalczyk absent from the team and the briefing, having walked off the apron at Helena; WREN a known face beside Tesseract at the core, taken as she moves, **nobody wounded**; no whodunit; R2-01); the blast-door line; HaX's database-choice line on `albion_notified`; `recruiter_secret == "denied"` ("You told me she was fishing.").
28. **The media room:** Tran's handler line on `m09_cage_bin == "letters"` (to the server-hall prop if the room is cut). *(Milestone ruling 2026-10-21: the media room is cut; m10 places the line. Stages 4–5 milestone: it is HaX's line at the server-hall prop, as FINALE_ARC and m10 have it.)*
29. **Credits:** the Albion variant, the `legacy_files_saved` clause, the `told` clause in the player's own line (change 6); add `m09_legacy_files_saved` to m10's imports.

**Stages 4–5 (engine and placement)**, renumbered as the structure review's engine items 16–29, amended by round 1:

30. (16) **Withdrawn**: no text during the call; every cost is voiced (C-03).
31. (17) A forced call with two resume points after a "yes" (R2-03): closed before her naming line, the Recruiter re-rings and says the name; closed after it, HaX re-rings at the unanswered choice with "I've paused the deck. It won't hold long."; the same after a reload.
32. (18) The ledger line at the drop terminal about a minute after `deck_choice_made` on `taken` / `double_crossed`.
33. (19, 20) The legacy box: one object on the feed table, removed at the first of Nightshade's file picked up (an `onPickup` `setVariable` or a unique item type, never an id) and the first exit from the opened cage, unless Sorensen is down. The exit needs an event the engine sees (R2-09): either the cage is its own room, so `room_entered` on any other room fires as the player steps out, or the cage stays inside the restricted stacks and HaX's line says "leave the stacks". Stage 5 picks one; the Recruiter's "out of the cage" condition uses the same event; under Noor's desk instead on warned in time; persisting across reload.
34. (21) A knock-out on Sorensen that does not overwrite `talked`.
35. (22) A conditional choice in Sorensen's conversation on holding Nightshade's file.
36. (23) **Withdrawn**: her list is a debrief line, not an object.
37. (24) Noor leaving on `noor_told` and Old Coyote on `old_coyote_told` (`setVisible`), their desks' objects left in place.
38. (25) The clip as an ink conversation from the station object, voiced by TTS with a recording style; no object-audio path needed (§9 item 25).
39. (26) The double-cross text on first entry to the tape room.
40. (27) A choice inserted into the debrief cutscene between the stance and the hub, and resume if closed.
41. (28) The drop terminal's send actions (notice, Nightshade's file) reachable from the tape room until the debrief.
42. (29) The cage bins: one object removed on `cage_opened` by which was taken.
43. **Playtest covering set** (structure review, scope): stage 4 names about twelve routes covering every export value and cross-link once, plus a reload in each forced phone scene, and three more from round 2: double-cross with the call closed between "yes" and the name; `denied` then take; `full` with `crew_lost`, the notice held in the archive and sent at the debrief.

## 12. For the user

1. **Decided (F12, 2026-10-21):** the Alpha-tapes clip is voiced. Two lines, about fifteen seconds, his m07 voice treated as an old recording. Built as an ink conversation voiced by TTS (§9 item 25); the user hears the recording style before it ships.
2. **For the user to know:** the double-cross now costs the name. A player who takes the Recruiter's name and then pulls her file anyway loses WREN: she is warned, walks off the apron at Helena, and waits at the core in m10 instead of in cuffs at the briefing. The Recruiter says so before the choice. It is the largest change in this round, and it changes one m10 branch.
3. **Tone check on Noor** (§4.2): telling her the truth means she can't ring her father, who is on dialysis in Dearborn, for weeks. It stays off-screen after she leaves except for Netherton's "She asked twice."
4. **New named character, documents only:** Teresa Villanueva, 41, a union rep at the Butte copper mine (Butte's smelter closed in 1980), on the Social Fabric letters' last page, quoted once, and confirmed warned in Beat 2.7 (§3.1). Grepped: no clash.
5. **F13** (surrender is a deal with no public trial; arrest is a public trial) touches nothing in m09. Netherton's memo-stance reply "Then he can make that argument in court, and lose it." stays right for the arrest ending and reads as his expectation on the others.

## 13. Review round 1 outcomes

Reviews: `REVIEW_R1_CHOICES.md` (C-01 to C-15: 9 majors, 6 minors, five worst lines) and `REVIEW_R1_STRUCTURE.md` (S3-01 to S3-19: 7 majors, 12 minors; 35 change verdicts; scope simplifications; engine items 16–29). Orchestrator rulings and user decisions F12, F13 applied as given.

**Choices review**

| ID | Sev | Outcome | Where |
|---|---|---|---|
| C-01 | major | Fixed: the Recruiter names "your Architect"; WREN is "my placement" / "them" before the name | §3.2 |
| C-02 | major | Fixed, my design (orchestrator: "a cost that bites in play"): the double-cross voids the name. She warns WREN; Kowalczyk walks off the apron at Great Falls (superseded: Helena since R2-02) and is missing from the hangar; in m10 she waits at the core with Tesseract. The Recruiter prices it before the answer. Chosen over the reviewer's option (b) (a fact paid for keeping faith) because it costs the double-cross something the player loses on the night, and keeps take's one advantage (WREN in cuffs) | §3.2, §4.7, §8, §11 changes 1, 5, 27 |
| C-03 | major | Fixed: every cost voiced on the call. The Recruiter: "Say no and I wipe it myself. Same deck, no name."; HaX's "I can beat that wipe." with her dismissal ("Nobody has."), which is also why she drops off sure it's gone. The private text and its engine item are withdrawn | §3.2; §11 change 30 |
| C-04 | major | Fixed: the invoice priced as a moral cost ("SAFETYNET's in an ENTROPY ledger … He'll quote it at you."), which is what m10 delivers | §3.2, §9 item 33 |
| C-05 | major | Fixed (ruling): Noor's cost is her father, not her job (the archive is gone by morning on every route). Told, she can't ring him; left, she rings him, unknowing | §4.2 |
| C-06 | major | Fixed: HaX names what and when as the cage opens; the box is on the feed table behind Sorensen, so it can't be wheeled away | §4.3 |
| C-07 | major | Fixed (ruling): the files belong to Sorensen's choice; Noor carries no loot; warned in time stays as a pure reward | §4.2, §4.3, §6 |
| C-08 | major | Fixed: the letters' last page is Social Fabric's next job, on Teresa Villanueva, a union rep in Butte; taking them gets her warned. Past against present | §3.1, §7 |
| C-09 | major | Fixed: HaX says who is exposed (four hundred sites on the vendor's kit) before the button, and the vendor's acknowledgement plays after a send | §3.5 |
| C-10 | minor | Fixed in part: the legacy chain merged (C-07); Sorensen's list is a debrief line, not an object; Old Coyote's link to Tran's radio call cut. The memo and the notice stay back to back, one exchange each | §4.3, §4.5, §3.5 |
| C-11 | minor | Fixed: Tran states his price before the player agrees | §4.4 |
| C-12 | minor | Fixed: a denial button, `recruiter_secret = denied`, with its own m10 cost | §3.3, §10 |
| C-13 | minor | Fixed: "[Send his notice.]" / "[Not yet.]" | §3.5 |
| C-14 | minor | Fixed: "[He kept his own papers off your list. Only yours burn.]" | §4.3 |
| C-15 | minor | Fixed: "You read it. You decide. I'll sign whichever." | §3.5 |
| Worst lines 1–5 | – | 1: the private text withdrawn, its content voiced (C-03, C-04). 2, 3, 4, 5: rewritten as suggested (5 with S3-03's branch) | §3.2, §4.3, §4.1, §3.5 |

**Structure review**

| ID | Sev | Outcome | Where |
|---|---|---|---|
| S3-01 | major | Fixed (ruling): the SAFETYNET placements went onto the Recruiter's tape, so the box never names WREN; HaX says so; the m08 link dropped | §4.3 |
| S3-02 | major | Fixed (ruling): no money changed hands in m05; the button and wording are about the courier and the report; SA:187, SA:600 in change 11 | §3.3, §6, §7; §11 change 11 |
| S3-03 | major | Fixed (ruling): Albion patched its own site; the flaw is the vendor's and open elsewhere, where the watch runs; the inquiry cost only on `full` or `m04_crew_lost` (a new m09 Tier 2 import) | §3.5, §6; §11 changes 2, 18 |
| S3-04 | major | Fixed (ruling): Tesseract still refuses WREN; Quintero takes her after it, unhurt; `sleeper_caught` left to m10; no-Quintero case covered | §9 item 25; §11 change 5 |
| S3-05 | major | Fixed (ruling): set at `cage_opened`; shredded at the first of the chest opened or first leaving the opened cage (since stage 4: Nightshade's file picked up, `nightshade_file_held`); trigger not keyed on an item id | §4.3, §10; §11 changes 7, 33 |
| S3-06 | major | Fixed (ruling): one export list (eleven), tiers stated, what m10 must change; arrested-branch help dropped, `cage_bin` Tier 2 | §10; §11 changes 2, 26 |
| S3-07 | major | Fixed: §8's order (talked above knocked out; "left" and lost files silent) is the only place per-choice debrief lines play; dropped cells marked | §8, §3.1, §4.3 |
| S3-08 | minor | Fixed: "something off my deck" | §3.2 |
| S3-09 | minor | Fixed: every button writes a legal pair (first line `refused` + `alpha_tapes`); the cross-speaker resume is an engine check; FA §3.4 descriptions in change 1 | §3.2, §10; §11 changes 1, 31 |
| S3-10 | minor | Fixed: a knock-out after `talked` keeps `talked` | §4.3, §10 |
| S3-11 | minor | Fixed: "free" means `left` | §4.3, §10 |
| S3-12 | minor | Fixed: renames and the removed "arrest" options listed | §10; §11 change 13 |
| S3-13 | minor | Fixed: door line on talking branches only and not after the shown-file text; his material is "his notes" | §3.1, §4.1; §11 change 26 |
| S3-14 | minor | Fixed: the Albion variant joins m10's one clause; the spring goes in the player's own credit | §3.3, §10; §11 change 6 |
| S3-15 | minor | Fixed: the lock row for SA §11; Netherton's question by m04 branch | §3.5; §11 change 19 |
| S3-16 | minor | Fixed: `notice_sent_in_archive` dropped for an ink temp (superseded at stage 4 by `debrief_notice_before`, stage 4 §6.5) | §3.5, §10 |
| S3-17 | minor | Fixed: "show" noted as placement-dependent; it no longer bears on the files | §4.2 |
| S3-18 | minor | Fixed: the tape room's station; SA:260 in change 17; the clip built as a TTS-voiced ink conversation, since no object-audio path exists | §9 item 25 |
| S3-19 | minor | Fixed: HaX grounds "he's writing in it" in WREN's day-10 entry | §3.2 |
| Change verdicts | – | All 35 applied as verdicted (20 accepted, 15 modified) in §11, numbering kept | §11 |
| Scope 1–4 | – | Adopted: arrested-branch help dropped; `notice_sent_in_archive` dropped; one legacy-files rule; Old Coyote's link to Tran's call cut. Scope 5 superseded by F12 | §3.1, §3.5, §4.3, §4.5 |
| Engine 16–29 | – | Carried into §11 changes 30–42; 16 and 23 withdrawn by the fixes above; 25 answered without an engine change | §11 |

**Counts:** 34 findings (16 major, 18 minor), plus five worst lines, 35 change verdicts, four scope items and fourteen engine items. All 34 fixed; none withdrawn. Two of the reviewer's suggested options not taken, with reasons: C-02 (b) (see C-02) and C-10's cut of Old Coyote's "tell him the truth" (kept: one line, and it gives the truth-telling player something on an innocent).

## 14. Review round 2 outcomes

Review: `REVIEW_R2.md` (R2-01 to R2-05 majors, R2-06 to R2-13 minors, five worst lines). Orchestrator rulings applied as given.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R2-01 | major | Fixed (ruling): on `double_crossed` the core goes cleanly. WREN is a known face beside Tesseract, he refuses her, and Quintero (or the player) takes her as she moves, nobody wounded. That plus half the network is what the double-cross buys against refuse-her-file; stated in the route table and dominance list, and listed for m10 | §3.2; §11 changes 5, 27 |
| R2-02 | major | Fixed (ruling): she gets the call aboard and walks off the apron at Helena on landing; the identity scene is unchanged (she is still aboard); the spine's last line and last image get `double_crossed` forms, checked before `sleeper_named` | §3.2, §4.7; §11 changes 11, 19 |
| R2-03 | major | Fixed (ruling): `sleeper_named` set on her naming line; two resume points (the Recruiter says the name; HaX holds the wipe) | §3.2, §10; §11 changes 11, 31 |
| R2-04 | major | Fixed (ruling): acknowledged tonight, a fix in about ninety days, a year to roll out, some sites never; the watch comes down because SAFETYNET chooses to pull it once the vendor is investigating the controller. Every notice line keeps to that, and the teaching point is stated once | §1, §3.5, §5, §8; §11 change 18 |
| R2-05 | major | Fixed (ruling): the flaw is in the controller, which also runs in water works and substations, outside m04's audit of battery storage sites; HaX's `full` line says so | §1, §3.5; §11 change 18 |
| R2-06 | minor | Fixed: worst line 1 (the Architect named; Sorensen's hand, his orders) | §3.2 |
| R2-07 | minor | Fixed: HaX tells the player, and the player says "[Not tonight. Not from here.]" | §4.2 |
| R2-08 | minor | Fixed: the Butte copper mine (the smelter closed in 1980); one quoted line of hers; HaX confirms she was reached in Beat 2.7 | §3.1, §12 |
| R2-09 | minor | Fixed: the cage-exit event is stage 5's choice (cage as its own room, or "leave the stacks"), and the Recruiter's condition uses the same event | §4.3; §11 change 33 |
| R2-10 | minor | Fixed: Sorensen's and Tran's "left" are silent; Noor's plays | §8 |
| R2-11 | minor | Fixed: Beat 3.6's "never heard" → "never heard live" in change 17; "§1 change 8"; the `schedule_read` row moved into the table | §4.1, §10; §11 change 17 |
| R2-12 | minor | Fixed: "Gone. Goodnight, agent." and "She watched the counter. Not the copy." | §3.2 |
| R2-13 | minor | Fixed in part: on `told`, HaX's "Last spring I'd have kept that between us. Not tonight." at Beat 2.7. Not taken: m05's "Four minutes is a long sales pitch." on `denied`, because HaX's silence there is stronger and the reviewer marked it optional | §3.3; §11 change 17 |
| Worst lines 1–5 | – | All five rewritten as suggested (4 with the R2-04 timescales; 5 with Helena) | §3.2, §3.5 |

Also: the take-against-double-cross dominance line restated, since the double-cross's core is now clean: take keeps WREN in custody from the start and the player's word; the double-cross trades both for half a network. Three playtest routes added to change 43.

**Counts:** 13 findings (5 major, 8 minor), plus five worst lines. All 13 fixed (R2-13 in part, as above); none withdrawn.

## 15. Review round 3 outcomes

Review: `REVIEW_R3.md` (R3-01 major; R3-02 to R3-04 minor). Final pass; applied as the orchestrator directed.

| ID | Sev | Outcome | Where |
|---|---|---|---|
| R3-01 | major | Fixed: the hang-up gets its own form of the tape choice, with no Recruiter line: the deck's counter starts; HaX, "She's wiping it. She thinks it's gone."; her file/tapes line; "One of them. Now." | §3.2 step 3; §11 change 11 |
| R3-02 | minor | Fixed: "the only refusal that spares Quintero at the core" | §3.2 dominance |
| R3-03 | minor | Fixed: Helena in §12 item 2; §13's C-02 row marked superseded | §12, §13 |
| R3-04 | minor | Fixed: "the vendor starts on a fix for four hundred sites", in HaX's and Netherton's lines | §3.5 |

**Counts:** 4 findings (1 major, 3 minor), all fixed, none withdrawn. Stage 3 is complete.
