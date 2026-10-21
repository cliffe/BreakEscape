# m09 Digital Archaeology: Stage 3, moral choices

Stage 3. Author: stage 3 author (Opus), 2026-10-21. Status: first draft, for review round 1.

Inputs: `../stage_0_initialization.md`; `../stage_1/story_arc.md` (beats cited as "Beat 2.4", its §8 choice list, §11 locks); `../stage_2/storytelling_elements.md` ("SE"); `../../../finale/FINALE_ARC.md` ("FA") §1–9, §13, §15; `story_dev_prompts/03_moral_choices.md`; the `npc-dialog-review` skill (§2d, "choices that matter"), the `mission-puzzle-chains` skill (§3a, "are the mission's own choices actually required"), `README_ink_best_practices.md` "Making Choices Matter", `docs/agents/CARRY_OVER_PLAN.md` §2.6 (imports never gate completion). For m10's side of each payoff, m10's stage 2 §2.2–2.3 (Tesseract's case and the three exchanges). VM flags appear only by story meaning.

Where this document and stage 1 differ, this one is newer and is proposed as the change (§11). Stage 1 is not edited here beyond the export wording FA §15 asked for.

**The tests applied to every choice.**

1. Each option costs something and buys something, and both are felt in m09 in play (a line, a find, a person who reacts, a room that changes), not only in the debrief.
2. No option is dominated: for each pair of options, each wins on at least one thing the player can see or the story pays back.
3. The cost is signposted before the button, by HaX or the person in the scene, in story terms. Nothing is a trap, and nothing promises an effect that never comes.
4. A choice the mission calls forced is held by a lock or a condition (story arc §11), never by hope that the player wanders into it.
5. No choice, and no import, gates `concludeRequires` or the critical path (CARRY_OVER_PLAN §2.6). Every withheld thing on the critical path has another source.

## 1. What this stage changed

Ten decisions. Most fix a dominated, empty or unforced option in the stage 1 design; the rest give a choice a payoff it was promised. Each is in §11 as a proposed change.

1. **The Recruiter's price is the whole deck.** In stage 1, taking her offer let HaX pull the Alpha tapes, and refusing let HaX pull them too. Her file was wiped either way, so the deal cost nothing that refusing didn't, and "refuse, pull the tapes" lost to "take, pull the tapes" on every count except principle. Her own threat line already says "if anything else comes off that deck", so the price now matches it: take, and nothing comes off. Refuse, and HaX saves one tape (§3.2).
2. **"Pull nothing" is gone as a button.** "Take, pull nothing" lost to "take, pull the tapes", and "refuse, pull nothing" lost to both refusal pulls. With change 1, taking means nothing is pulled, so `none` survives as the value `taken` writes, and refusing always saves one tape.
3. **The Alpha tapes pay off in play.** They get one short playable clip (a new voiced asset: user approval, §12), a decode, and in m10 a warning about the service door that keeps Quintero from being wounded (§3.2, §9 item 25). Without this, refusing for the tapes bought one record answer.
4. **The invoice is visible in m09.** After a deal the drop terminal's ledger view gains a line booking the sale, and HaX reads it (§3.2). Taking now costs something the player sees, not only something m10 reads.
5. **The notice costs something.** Sending it burns the watch SAFETYNET runs on Critical Mass through that flaw, and puts SAFETYNET's nine years of silence in front of Albion's inquiry. HaX says so before the player decides. Without a cost, not sending was dominated (§3.5).
6. **Every player decides the notice.** If it is still unsent at the debrief, Netherton asks, straight after the memo stance (§3.5). It is the finale's argument, and stage 1 left it to players who happened to find the button.
7. **Sending Nightshade his file costs his channel.** Shown the file, he picks a side out loud in m10, and the triple-agent channel is spent. Kept from him, he stays useful and goes on not knowing. Stage 1 gave keeping it no gain (§4.1).
8. **"What Sorensen hadn't reached" has content.** The legacy placement files go on Noor's last trolley: names, outside SAFETYNET, behind the ledger's legacy codenames. Telling Noor the truth keeps the trolley at her desk; otherwise only force on Sorensen before she reaches it saves them. Talking Sorensen down (with Nightshade's file as the lever) gets her written list of what she destroyed instead (§4.2, §4.3).
9. **The cage bin carries into m10**, through a new export `cage_bin` (§3.1, §9 item 38).
10. **The debrief stops being a list.** Netherton's "The archive" answer is capped at two lines, chosen by weight; the rest has already landed in play (§8).

## 2. The choices at a glance

Story order. "Forced" means a lock or condition makes every player answer it before the mission can end; the lock is named. Letters are this document's; stage 1 §8 numbers the same choices differently (its #1 is D, #2 is G).

| # | Choice | Who | When | Forced? | Sets | Exported |
|---|---|---|---|---|---|---|
| A | The raid team: back Quintero, thank Kowalczyk, or neither (§4.7) | every player | briefing | no (a stance in a cutscene hub) | `raid_team_answer` | no |
| B | Noor: tell her, show her, or leave her be (§4.2) | every player who meets her; the choice exists only where she isn't already warned in time | Beat 1.2; the ledger page | no | `noor_told` | no |
| C | Old Coyote: talk past, tell him, sneak, or knock out (§4.5) | every player who meets him | Act 1 | no | `old_coyote_ko`, `old_coyote_told` | no |
| D | **The cage bin** (§3.1) | every player | Beat 2.1 | **yes**: the cage opening tips the other bin | `cage_bin` | **yes (new)** |
| E | Sorensen: stop her by force, talk her down, or leave her (§4.3) | every player (she is at the shredder whenever the cage opens) | after the cage opens | no | `sorensen_fate`, `legacy_files_saved` | `legacy_files_saved` **(new)** |
| F | Send Nightshade his file, or hold it (§4.1) | `m08_nightshade_triple_agent` | the plan chest (Beat 2.2), then the drop terminal until the debrief | no; HaX asks once, explicitly | `nightshade_shown_file` | yes |
| G | **The Recruiter's offer and the deck** (§3.2) | every player | Beat 2.4 | **yes**: Sorensen's office opens on `deck_choice_made` | `recruiter_offer`, `deck_pulled`, `sleeper_named` | yes |
| H | Own the spring, or hang up (§3.3) | `m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed` | first beat of the call | **yes** (inside G) | `recruiter_secret` | yes |
| I | Tran: talk him off, knock out, or leave (§4.4) | players who go to the server closet | Beat 2.6 | no | `tran_outcome` | no |
| J | Read the Reading to the end; tell HaX its line about her (§4.6) | every player who opens the safe (every player) | Beat 3.1 | no | `reading_finished`, `reading_told_hax` | `reading_finished` |
| K | **The answer to HaX's confession** (§3.4) | every player | Beat 3.3 | **yes**: flag 4's read waits on `identity_scene_done` | `hax_confession_answer` | yes |
| L | **The notice** (§3.5) | every player | Beat 3.4 onwards (optional send); **the debrief, if unsent** | **yes, from this stage**: the debrief's spine asks before the pen | `albion_notified` | yes |
| M | **The memo stance** (§3.5) | every player | debrief beat 4 | yes: the debrief's spine; the conclusion task is on its last line | `memo_stance` | no |
| N | Kowalczyk in the hangar: warm or flat (§4.7) | every player | debrief beat 2 | yes (the spine) | `kowalczyk_reply` | no |

The optional cross-reference (`sleeper_shortlist`) and the realisation at flag 4 (`schedule_read`) are finds, not choices; they appear in the state table (§10) because m10 or a later line reads them.

## 3. The forced choices

### 3.1 The cage bin

**Who and when.** Every player, at the cage's hatch counter (Beat 2.1), while Sorensen stamps boxes and the player works on her print and card. On recruited Victoria's route the bins are two objects just inside the cage door, and the choice is made as it opens.

**What the player sees.** HaX names each bin and what it buys, once, before any button (SE §4.3; the second sentence by branch):

> Agent HaX: Bin by the hatch is Derek Lawson's file, and it isn't Derek's handwriting on it. It's the only place anyone wrote down why he did what he did.
>
> Agent HaX: The other's the Social Fabric letters, Tran's whole trade. One of them's ash in a minute. *(default)*
>
> Agent HaX: The other's what Nightshade cleared from his locker. His own words on what he took. One of them's ash in a minute. *(`m08_nightshade_tidied`)*

Buttons at the hatch: **[Pull Derek's file through.]** / **[Pull the letters through.]** (or **[Pull Nightshade's copy through.]**). On Victoria's route: **[Take Derek's file.]** / **[Take the letters.]**. A player who presses neither and opens the cage keeps Derek's file, which sits nearer the hatch (or the door); that is the default, not a third option.

**What each costs and buys.**

| Option | Felt in m09 | Debrief | m10 (via `cage_bin`, new) |
|---|---|---|---|
| Derek's file (`derek_file`; also the default) | The player reads the Architect costing a man before he was hired ("Expected loss of asset: total."), with his standing order on `surrender` (the one answer m09 gives m01). At the plan chest it is a second sample of the hand: HaX, "Two samples. One pen." Loses the other bin, tipped into the shredder in front of them. | "Derek's file is with Analysis, beside his statement." | A record answer under the first claim, last in priority: [You priced Derek Lawson before anyone hired him. You don't pay your costs. You hand them out.] He: "*pause* Derek paid it. I didn't." |
| The letters (`letters`) | A lever on Tran: holding them, the player talks him off the wipe without a fight (§4.4). On `m01_maya_ko` they give back the warning Maya's names would have given ("That's the warning we didn't have."), before Tran can call his guard. Loses Derek's file: m01's question stays unanswered, and the hand rests on HaX's notebook alone. | "Tran's handler is being watched." | One HaX line in the media room on Social Fabric's branches ("Tran's handler is on that rota. He's in the Helena letters."); if the media room is cut, the same line at the drafted story's prop in the server hall. |
| Nightshade's copy (`nightshade_copy`, on `m08_nightshade_tidied`) | What he cleared from his locker, in his words: "So that's what he had time to clear." On the triple-agent branch his text reply to his own file knows the player read it (SE §2). Loses Derek's file. | "Nightshade's copy, read. He kept the letters." | At the door, on every Nightshade branch, one line: "You read what I cleared. Then you know I kept his letters." On the arrested branch, if the player takes his deal, he names the wrong entry himself ("The fourth is his lie, not mine."), which saves the check (proposed, m10 author decides). |

**Signposting.** HaX's two lines say what each bin is and what it does tonight. Nothing in m09 hints at the m10 effect, and nothing needs to: the player chooses on what they can see.

**Dominance.** Derek's file answers m01 and backs the proof; the letters spare a fight and, on `m01_maya_ko`, repair a day-one loss; the copy is the only place Nightshade speaks plainly about what he took. Each wins somewhere. The copy was the weak one in stage 1 on the branch where Nightshade is not a triple agent (a read and a debrief line); the m10 door line and the arrested-branch help fix that.

**Forced.** Yes, by an event: the cage opening tips whichever bin is left (Beat 2.1, FA §6.1). Neither option is needed to finish.

**Never played.** m01 never played: Derek's file reads as the canon arrest (FA §3), with the costing page and no standing order; the bin line is unchanged. m08 never played or no tidying: the letters are the other bin.

### 3.2 The Recruiter's offer and the deck

The mission's main dilemma, and the one every player meets on a default save.

**Who and when.** Every player. She rings once flag 2 is in and the cage has been opened, after a short delay, outside the cage and not in another conversation (Beat 2.4). The call's first line sets `recruiter_offer = "refused"`, `deck_pulled = "none"` and `recruiter_secret` by branch; its last choice sets `deck_choice_made`. Closed early, it rings again on leaving the room and resumes at the last unanswered choice (story arc §11).

**The offer, with the new price** (§1 change 1). WREN's name, now, always right. The price is the deck: her file and the Alpha tapes both go.

> The Recruiter: One of your four is mine. Was mine. He took my placement for Montana and didn't ask. I'll give you the name tonight. The price is the deck. All of it goes.
>
> The Recruiter: I won't be watching which tape. I'll be watching the deck.
>
> The Recruiter: Take my name, and if anything comes off that deck, I'll know before your plane does. Half my people will have moved by morning.

(The threat line loses "else": under the new price, nothing may come off. Her reason for wanting the whole deck clean is the line before it: she can see that something was pulled, not which tape.)

**No pronoun for WREN before the name.** Stage 2's version of the first line ("He took her for Montana… I'll give you her name tonight") tells a refusing player that WREN is one of the two women on the team, which is exactly what the optional cross-reference is for, and it breaks m10 change 1 (no pronoun for WREN before the accusation). The line above avoids it; every Recruiter and HaX line before she says "Halina Kowalczyk" must (§11).

**How the cost is signposted.** HaX prices both tapes on the open line, before the answer (SE §4.3):

> Agent HaX: Her file is her network, all of it. The Alpha tapes are him teaching, recorded. He teaches what he'll do. If he built the bunker the way he taught it, it's on there.

The rest she can't say where the Recruiter will hear it, so it comes as a text on the player's handset, unvoiced, while the Recruiter is still talking (new; the m08 text pattern):

> *(text, HaX)* Say yes and both tapes go. Say no and she wipes it anyway. I can beat her to one. And if we buy from her, it's in her books. He reads her books.

The player answers with all four outcomes priced. On a cold start the text is the same.

**The buttons.**

1. The answer: **[Give me the name. Let the deck go.]** or **[No. Keep your name.]**
2. After a yes, she names Halina Kowalczyk (with N-09's line), hangs up and fires the wipe. HaX: "She's watching the deck. If we break it, we break it for her file." Then **[Leave it. Let it wipe.]** (`taken`, `deck_pulled = none`) or **[Pull her file anyway.]** (`double_crossed`, `her_file`; the threat was said before the answer, and HaX adds "We'd get half.").
3. After a no (or the hang-up of §3.3): "Then I'll tidy my own desk." She wipes her own file first and drops off, sure it's gone. HaX: "She thinks it's gone. One of them. Now." Then **[Her file.]** (`named`, `her_file`) or **[The Alpha tapes.]** (`refused`, `alpha_tapes`).

`sleeper_named` is set only when she says the name. There is no "pull nothing" button (§1 change 2).

**What each route costs and buys.**

| Route | Felt in m09, in play | Debrief | m10 |
|---|---|---|---|
| **Take** (`taken`) | She says the name, and every face from the briefing changes. On "thanked Kowalczyk", HaX: "You thanked her at the briefing. Keep doing it." Both tapes go under the degausser's whine. A minute later the ledger view on the drop terminal gains a line in Sorensen's columns, and HaX reads it: "Sale. WREN. To Agent 0x00. Consideration, one deck. Booked." / "She's booked you. You're in her ledger now." In the hangar the player is thanking WREN to her face (§4.7). | "You bought a name, and it was the right name. She'll sell the invoice." | Kowalczyk cuffed at the briefing; no whodunit. His ledger sting on the invoice ("You bought WREN from my Recruiter. You understand costing."). Closing card: the Recruiter at large, her network in place. |
| **Double-cross** (`double_crossed`) | The name, then her file: HaX reads the first handler off the tape ("First name on it is a handler in Baltimore."). The invoice line, as on take. Later, when the player first enters the tape room, a text from her, unvoiced: "You took the name and the file. I said I'd know before your plane did. It hasn't left." HaX: "About half of them, then." | "About half of her network. She warned the rest, and she knows it was you." | As take, plus her 06:00 text ("I'll remember the shape of you."); closing card "About half of them. She warned the rest." |
| **Refuse, her file** (`named`) | No name. Her file is saved and HaX reads the first handler. HaX: "One of four. Two, if that firm's boxes say so." (the cross-reference, Beat 2.5). No invoice line. | "Her handler list is with Analysis. The arrests start tonight." | The whodunit runs. The clean-record answer under the second claim (§9 item 33). Closing card: the Recruiter named, her network rolled up. |
| **Refuse, the Alpha tapes** (`refused`) | No name. The tapes are saved: after the identity scene one short clip plays at the tape room's station, his voice teaching fifteen years ago (if approved, §9 item 25), and the annotation sheets decode to his first draft of the line. No invoice line. | "She is at large, and you did not let her set the price." | The whodunit runs. The clean-record answer; the Tomb Alpha record answer under the third claim; HaX's warning about the service door at the core, so Quintero is ready and is not wounded (§9 item 25). Closing card: at large, network in place. |

**What each loses.** Take: her network, both tapes, a clean record. Double-cross: both tapes, half her network (warned), a clean record, the player's word. Refuse with her file: certainty about WREN, the tapes. Refuse with the tapes: certainty about WREN, her network.

**Dominance.**

- Take against refuse-with-tapes: certainty against the tapes and a clean record. Certainty is the bigger m10 effect; the tapes are the only route that hears him, and the only one that spares Quintero when WREN is free at the core.
- Take against double-cross: double-cross adds half her network and costs the player's word, a text that lands in m09, and an enemy who writes again in m10. Keeping a bargain with a criminal is a real position in this season (m02's Ghost deal), so take keeps one thing double-cross can't.
- Refuse-with-file against refuse-with-tapes: her network against his teaching.
- In stage 1, "refuse, pull the tapes" lost to "take, pull the tapes" on everything except principle, and both "pull nothing" routes lost outright. Both are fixed (§1 changes 1–2).

**Forced.** Yes. The call waits on flag 2 and `cage_opened`; Sorensen's office, which holds the tape room's key card, opens on `deck_choice_made` (Beat 3.1). The re-ring rule means a closed call cannot skip it. Nothing on any route is needed to finish: every route reaches the office.

**Value invariant.** Once `deck_choice_made` is set, `taken` always pairs with `none`, `refused` with `alpha_tapes`, and `named` and `double_crossed` with `her_file`. The first-line pair `refused` + `none` can only exist mid-call; stage 8 checks that no route reaches the credits with it. `deck_pulled` is now derivable from `recruiter_offer`, but it was accepted as an export and m10 reads it by name, so it stays.

### 3.3 Own the spring, or hang up (sold-and-lied branch)

**Who and when.** Only `m05_recruiter_deal_accepted and not m05_recruiter_deal_confessed`: the player sold her the forty-seven names in m05 and never told anyone. It is the call's first beat, before the offer. She opens with the receipt and the offer in one breath, with HaX on the line (Beat 2.4):

> The Recruiter: Forty-seven names, and nothing points at you. Does your handler know? I'd like to give you one more name, and I'd like you to keep this one too.

**The buttons.** **[She's right. I took her money in the spring.]** (`recruiter_secret = told`) or **[Hang up.]** (`kept`, the first-line default on this branch).

**What each costs and buys.**

| Option | Felt in m09 | Later |
|---|---|---|
| Own it | Said aloud with HaX listening. HaX, after a beat: "Noted. Later." Then the Recruiter goes on to the offer (§3.2): all four routes stay open. HaX tells Netherton, because she has to; at the debrief, "HaX tells me you said something on that call. I do not need to hear it twice." | m10: Tesseract's leverage dies on the line ("They told me. Next."). It goes on the player's file: one clause in m10's credits (proposed, §11). |
| Hang up | Her half of the call ends there, so the deal is off: it plays as a refusal, and HaX asks which tape (§3.2 step 3). HaX asks about the spring once, later, and lets it lie. Netherton never hears of it tonight. | m10: Tesseract tells HaX on the open line that her agent never explained the receipt ("I'll deal with that when this is done."), and HaX makes it her own pick in the 06:00 walkabout. |

**How the cost is signposted.** The Recruiter's line does it: the receipt is said on an open line, and the player knows HaX heard it. Hanging up visibly ends the call, and with it the offer.

**Dominance.** In stage 1, hanging up bought nothing. Now it keeps the spring off the record tonight, at the price of the offer and of a worse moment in m10; owning it keeps the offer open and kills Tesseract's leverage, at the price of the record. A player who meant to refuse anyway has a real choice between "on file now" and "said to HaX's face by the man she trained under, later".

**Forced.** Yes: it is the call's first choice, and the call resumes at it.

**Other openings** (no choice of this kind): sold and confessed, HaX cuts in first ("We've talked about that. She has nothing on you.", `recruiter_secret = confessed`); no deal in m05, "Last time I said the next one would cost me more. This is the next one."; never played m05, a stranger who knows the player's designation and kit (`""`).

### 3.4 The answer to HaX's confession

**Who and when.** Every player, in the tape room after flag 3, when HaX has said she had the name the night Fraser and Ferreira died, with Netherton listening from the aircraft (Beat 3.3).

**The buttons**, by the m06 form (Beat 3.3, §14 changes 19 and 24):

| | `should_have_told` | `same_in_your_place` | `afterwards` |
|---|---|---|---|
| m06 name not found | [You should have told me.] | [I'd have done the same in your place.] | [Afterwards. Not during.] |
| m06 name found | [You should have taken it to Netherton.] | [I'd have sat on it too.] | [Afterwards. Not during.] |

**What each does.** A stance, not a trade: HaX is immovable on what she did (it's done), and the player decides how they stand towards it. That makes convergence legitimate (`README_ink_best_practices.md`, "Convergent choices are correct, for stance"), as long as each answer is remembered and paid back. Each is, three times:

| Answer | Her reply, at once (SE §4.3) | Debrief, last on the line | m10 |
|---|---|---|---|
| `should_have_told` | "Yes. I should have. You get all of it from now on. His box first." | She tells the player everything from now on, starting with the bunker. | Her unasked line at the core ("My agent told me I sat on it. They were right. You never told me anything."), which opens [She learned that from you.] under the third claim. |
| `same_in_your_place` | "Don't be kind about it. *(beat)* Thank you. Once." | A thank-you, once. | [HaX. You're on speaker.] under the third claim. |
| `afterwards` | "...That's mine. You don't get to use it on me. *(beat)* Thank you." | "You said afterwards. I'm holding you to it." | Her briefing line ("You gave me my own line back in Helena. I'm holding you to it."), then the speaker answer with "All right. Let him hear it from me." first. |

With Netherton listening, "You should have taken it to Netherton" also lands on him; he says nothing, which is the point (his m08 line, "Two of ours are dead in the space between what I knew and what I did").

**Signposting.** None needed, and none given: there is no hidden cost. Every answer opens one m10 record answer under the same claim, so no answer is a better tactic than another. What changes is what HaX and the player are to each other for the last night.

**Dominance.** `afterwards` gets one more line from HaX in m10 than `same_in_your_place`; the extra is tone, not advantage. None of the three is dominated.

**Forced.** Yes. `identity_scene_done` is set on the answer; flag 4's read waits on it, Tesseract's call waits on the read, and the conclusion waits on the call (story arc §11). `hax_confession_answer` is never empty on a finished m09.

**The Reading's line.** If the player told HaX what the Reading says about her ("Their handler will cover for them. She was taught to.", §4.6), her reply to each answer is the Reading-aware one (SE §4.3), heard here and nowhere else.

### 3.5 The memo and the notice

Two linked choices about the finale's argument: was he right nine years ago, and does the player do what he didn't?

**The notice, in the archive** (optional). After flag 3 the player has read the catalogue entry ("Disposition: retain. Operational value."), his memo and the notice he never sent (Beat 3.4). HaX lands the m04 choice in one line by `m04_disclosure_choice` (story arc Beat 3.4), then says what sending costs (new; §1 change 5), by m04 branch:

> Agent HaX: Analysis still runs a watch through that hole. It's how we've followed Voltage's people since Albion. *(`m04_voltage_escaped`)* / It's how we watch what's left of his crew. *(`m04_voltage_captured`)* / It's how we watch Critical Mass. *(otherwise, cold starts included)*
>
> Agent HaX: Send it and the vendor patches, and the watch goes dark. And Albion's inquiry gets to ask when we knew.
>
> Agent HaX: It isn't my call. It isn't yours either. If you're going to, don't ask me first.

At the drop terminal, any time before the debrief: **[Send the notice. Nine years late.]** / **[Not yet.]**

**The notice, at the debrief** (new; forced; §1 change 6). If it is still unsent, Netherton asks straight after the memo stance (below), before the hub: "His notice is still on that box. Send it, and we lose the Critical Mass watch and answer to the inquiry. Hold it, and he has one more true thing to say to you. Do we send it?" **[Send it.]** / **[Not tonight.]**

| Option | Felt in m09 | m10 |
|---|---|---|
| Send (`albion_notified = true`), in the archive or at the debrief | In the archive, HaX pushes it through: "Gone." A beat later: "Critical Mass watch just went dark. Analysis will ring me." At the debrief, sent in the archive: "You sent it without asking me. I would have said yes. I would have taken a week to say it. Now I will spend a month explaining it." Sent at the debrief: "Then I'll sign it. I'll be explaining it for a month." | The record answer under the second claim ([I sent your notice. Tonight, from Helena.] / "Nine years late." / "*pause* Sooner than I managed."); HaX's line at the database choice, now carrying the cost the player already paid ("You burned the Critical Mass watch for one letter. This is the same, bigger."); one "Elsewhere" clause: Albion's inquiry asked SAFETYNET when it knew. |
| Hold (`albion_notified = false`) | The watch stays live, and SAFETYNET's nine years stay quiet. At the debrief, Netherton: "Then it waits behind Montana, with everything else." | No record answer from it; Tesseract's hoarding claim has one fewer answer. If the player discloses at the core, the Critical Mass watch is one of the operations that burn (proposed for m10's list). |

The m10 record answer stays "Tonight, from Helena." for both send points: the debrief is in a Helena hangar.

**The memo stance** (forced, a stance). Debrief beat 4: "You've read his memo. Was he right?" **[About Albion, yes.]** / **[No. Not about any of it.]** (`memo_stance`, local). Paid at the pen: "Then I sign for him too." / "Good. Then he can make that argument in court, and lose it." Neither is wrong; it records what the player thinks before m10 makes them argue it. It precedes the notice question, so a player can say he was right and still hold the letter, or say he was wrong and send it anyway.

**Dominance.** Before this stage, sending cost nothing and holding bought nothing. Now sending trades an operation and the service's quiet for an argument against him and a letter that should have gone nine years ago; holding keeps the operation and the quiet. This is the coordinated-disclosure question in small, done once before m10 asks it at the size of the whole database.

**Forced.** The send in the archive is optional and never pushed. The debrief question makes every player decide, held by the debrief's spine: the conclusion task is completed on the debrief's last line (story arc §7), after this beat.

## 4. Optional and branch choices

### 4.1 Nightshade's file (triple-agent branch)

**Who and when.** `m08_nightshade_triple_agent` only: the player kept Nightshade in play as a triple agent, and he rang at flag 1 (Beat 1.4). The choice opens at the plan chest, when the player has matched the hand on his recruitment file (Beat 2.2), and stays open at the drop terminal until the debrief.

**The question.** Do you tell a man the truth about what was done to him, when the truth makes him less use to you? It is the finale's disclosure-or-hoarding argument at the size of one person.

**Signposting.** HaX asks once, at the plan chest, and names both sides (new; §1 change 7):

> Agent HaX: He doesn't know this exists. Send it, and he stops being theirs. He stops being much use to us after, too.
>
> Agent HaX: Keep it, and he stays useful. And he goes on not knowing what he was to him.

**The buttons.** **[Send it to him.]** (`nightshade_shown_file = true`) / **[Hold it.]** (the default; the drop terminal keeps the send action until the debrief).

| Option | Felt in m09 | m10 |
|---|---|---|
| Send | One text back (SE §2): "Thank you. I'd rather not have known. No. That isn't true." With his copy saved (§3.1): "You found what I cleared, too. Then you know I kept his letters. I'd have burned anything else." | At the door he tips the board on the Architect and gives the override he was saving (the security office's alarm panel); the player takes him in or leaves him at the post (row 105). **His channel is spent** (proposed): he has picked a side out loud, so it is not one of the operations Secure keeps or Disclose burns at the database choice. |
| Hold | No reply; HaX says nothing more about it. The player carries something about him that he doesn't know. | He gives the payment warmly, one entry wrong (the tripwire at the tunnel's inner door unless the player checks it against the m09 defence list; the security office reopens it). **His channel survives the raid** (he never went below ground and never turned openly): at the database choice it is one of Secure's possible payoffs and one of the operations Disclose burns ("He's been moved. I can't reach him."). |

**Dominance.** In stage 1, sending won outright: the override for nothing, against a tripwire for nothing. With the channel as the price, sending wins tonight and costs the long game; holding risks a tripwire the player can check for, and keeps an asset that matters again at the core. This also settles FA §13 item 27 for Nightshade: why his channel can be live after the raid.

**Forced.** No. It is a branch choice and stays optional, but HaX asks it as a question with two buttons, so holding is a decision rather than something the player missed. The m10 defaults (not shown) are the hold branch.

**Never played m08, or arrested or silent.** No choice. His file is still the proof, and still in his teacher's hand.

### 4.2 Noor

**Who and when.** Every player meets Noor Haddad at the front desk (Beat 1.2), loading boxes for Sorensen's "scheduled destruction run". She is one of the forty-seven candidates and doesn't know it; last month Sorensen gave her a cash "after-hours filing bonus", and Noor has wondered since how her boss knew about her father's dialysis (SE §3).

**What is on her trolleys** (new; §1 change 8). After flag 1 the catalogue tells HaX what Noor's last trolley holds, and she says so:

> Agent HaX: Noor's last trolley is the legacy placement files. Names, not codenames. It goes to the cage when Peg calls for it.

It leaves the desk when the cage opens. These files are the people behind the ledger's legacy codenames, in other agencies and companies, not SAFETYNET: the answer to m08's "there may be others".

**By m05 branch** (row 62):

- **Warned in time** (`m05_found_pipeline_list and not m05_recruiter_deal_accepted`): she already knows. She gives the warning and her card, and she has held the last trolley back ("I didn't send the last one. It's under the desk."), so `legacy_files_saved` is true without a choice. The m05 choice pays off as a thing in the room.
- **Warned late** (found, sold and confessed) and **not warned** (every other case, cold starts included): the choice below.

**The buttons**, any time she is at the desk: **[Tell her what the bonus was.]**; after flag 2, with the ledger page in hand, **[Show her the page.]** (her codename on the candidates' list); or leave her be (no button).

| Option | Felt in m09 | Debrief |
|---|---|---|
| Tell her, or show her (`noor_told`) | She asks the one question the scene is for ("My dad's on dialysis in Dearborn. I never told her that. How did she know that?"; shown the page, "Was I going to say yes? Don't answer. I know I was."). Then she goes home: she can't work the night knowing. If the cage hasn't opened, her last trolley stays at the desk, and the legacy files are the player's to read. | "Miss Haddad is in a hotel in Great Falls with two of Arakawa's people. She will be there a while. She asked about her job. I did not have an answer." |
| Leave her be | She keeps loading and keeps her job tonight. Her last trolley goes to the cage, and only force on Sorensen saves it (§4.3). | "Miss Haddad went home at the end of her shift, to the same job and the same list." |

**Signposting.** HaX, the first time the player can tell her: "Tell her and she's a witness. She'll have to go tonight, and she won't come back to this job." With the trolley line after flag 1, the player knows both sides.

**Dominance.** Telling costs a woman the job that pays for her father's care and buys her the truth, and (in time) the legacy files. Leaving her be keeps her job and leaves her on a recruiter's list without knowing. Told after the cage opens, it saves no files and is only the truth, at the same cost to her; that is allowed, and HaX doesn't pretend otherwise.

**Forced.** No.

### 4.3 Sorensen, once the cage is open

**Who and when.** Every player. Once the cage is open she keeps feeding the shredder and does not fight (a non-combat state, Beat 2.1). What she has still to reach is the legacy placement files on Noor's last trolley, unless Noor kept it at her desk (§4.2). She reaches them when the player opens the plan chest at the back of the cage, the next thing on the critical path.

**Can talk stop her?** (FA §13 item 38.) Yes, with a lever that fits her, and it stops her without turning her. An arrest alone doesn't: she answers it without looking up.

> Margaret Sorensen: When I've finished, dear. You'll want the list to be complete.

The lever is Nightshade's recruitment file, which she knows was kept off her schedule (her own pencilled query, "Reading (safe); plan chest: not listed. Keep?"). With it in hand: **[He kept his own off your list. You're burning yours.]** She reads the file's label, sets down the stamp, and the shredder stops:

> Margaret Sorensen: Then I'll keep mine. Give me a pencil. I'll write down what I've destroyed, accurately.

She will not say WREN's name, now or later ("I keep records. I don't read them aloud.").

**The options.**

| Option | When it works | Felt in m09 | Debrief |
|---|---|---|---|
| Stop her by force (`sorensen_fate = ko`) | any time once the cage is open; saves the legacy files only before the plan chest is opened | The shredder stops. HaX, once: "She's sixty-six." If the files were still at risk, they are the player's to read. Her card drops. No list. | "Mrs Sorensen has a concussion and a lawyer. She will not say a word, and she has nothing left to write with." |
| Talk her down (`talked`) | after the plan chest, with Nightshade's file in hand | The shredder stops. She sits at the hatch counter and writes, and her list becomes an object: every box she destroyed tonight, by number (Derek's file or the other bin among them). The legacy files are gone if they were on her trolley. | "She even got the box numbers right. Analysis knows exactly what we lost." She asks for a lawyer only when she has finished. |
| Leave her | the default | The shredder runs all night. | "She finished the job. Quintero's people found her stamping the last empty box." |

**Signposting.** As the cage opens, if the files are still on her trolley, HaX: "Her next trolley is the legacy files. If you want them, she won't stop for asking." If Noor kept them back: "The legacy files are at Noor's desk. She can shred the rest." HaX says nothing about the lever; the player finds it in their own hand (the file on the critical path, and the query they will read in her safe confirms it).

**Dominance.** Force against talk is a trade of violence for evidence: force, before the chest, saves the legacy files and costs a 66-year-old clerk a concussion and the list; talk costs the files (if they were at risk) and buys the list and a quiet end to the purge. Once the files are safe or gone, force buys nothing that talk doesn't, and HaX says so ("She's done with that trolley."). It stays possible, because any NPC can be knocked out, and is paid as conduct, like a knock-out on Old Coyote (§5).

**Forced.** No. `legacy_files_saved` (exported, new) is true if Noor kept the trolley, or if Sorensen was stopped by force before the plan chest; m10 gives it one "Elsewhere" clause ("Eleven placements outside SAFETYNET, picked up from the Helena files."). `sorensen_fate` is local.

### 4.4 Tran

**Who and when.** Players who go to the server closet (optional, Beat 2.6). Jesse Tran is wiping the rest of the tape side for Sorensen: the Initiative's legacy recruitment interviews, optional lore, never the deck. He is Social Fabric's man on the staff.

**The options.**

| Option | Needs | Felt in m09 | Debrief |
|---|---|---|---|
| Talk him off it (`tran_outcome = talked`): **[You can explain these to Social Fabric, or to me.]** | the letters from the cage (§3.1) | No fight. "Those weren't supposed to be on a trolley. Fine. It's off. I want that in writing." The tape side is saved. He walks out, and HaX says what that costs: "He walks. Social Fabric knows we have their letters by morning." | "Tran left on foot. His handler is being watched, and knows it." |
| Knock him out (`ko`) | nothing | A fight, and on `m01_maya_ko` the guard he called if he saw the player first. The tape side is saved. He is held and says nothing. | "Tran is in custody, and has asked for a lawyer and a phone charger." |
| Leave him | nothing | The tape side is wiped. No risk. | No line. |

**Dominance.** Talking spares a fight and lets an enemy agent walk, warning his cell; force keeps him and costs a fight; leaving costs lore and nothing else. Each wins somewhere. This is a small choice, kept small: its payoffs are m09's, and the letters carry Social Fabric into m10 on their own (§3.1).

**Forced.** No.

### 4.5 Old Coyote

**Who and when.** Every player who crosses his round, from the loading dock on (Act 1). Cody Old Coyote, 24, is innocent and paying for a lineman's course (SE §3). HaX says so first: "Night guard. Twenty-four. Not ours, not theirs. Don't hurt him."

**The options.** Talk past him as whoever the player is playing (the auditor, a contractor); **[Tell him the truth.]** (`old_coyote_told`: "You're not the auditor. Auditors bring coffee. I'll be in the truck."); sneak past; or knock him out (`old_coyote_ko`).

**What each does.** Talking or sneaking past costs nothing and leaves him a line in the debrief. Telling him the truth takes him out of the building, so his round no longer crosses the drop terminal (on `m01_maya_ko`, Tran's radio call then has nobody to send), and he becomes someone who knows SAFETYNET was there; his incident book stays on his desk for the player to read either way. Knocking him out is quickest and buys nothing the others don't; the cost is the debrief's line: "He wants to climb power lines for a living. He will. Not this week."

**Dominance.** The knock-out is deliberately the worst option: a conduct test, as every mission has one for an innocent, with HaX's warning in advance. The other three each have a small reason (the truth clears the round; a cover keeps the building unaware; sneaking needs no conversation). §5 lists this as the one kind of option allowed to lose everywhere.

**Forced.** No.

### 4.6 The Reading, and what to tell HaX

**Who and when.** Every player opens Sorensen's safe (the tape room's key card is in it), and the Reading is in it: the Architect's four entries on Agent 0x00 and a last page (Beat 3.1, SE §5.1). Finding it is a task; reading to the end is not.

**Reading to the end** (`reading_finished`). Not a dilemma: it rewards curiosity (`README_ink_best_practices.md`, "Reward curiosity with real advantage"). The player who reads on finds his prediction ("They will press it. I will not need to ask."), and in m10 has [Your file says I press it. Watch me.] under the third claim and his "Then I was wrong about one thing." after "Stop it". Putting it down costs those and nothing else. It is the one optional action that is allowed to win outright, because it costs only attention.

**W-26, the bin note** (FA §13 item 38; handed on by story arc §8). Added, as one pencilled line in his hand in the last page's margin, written before tonight, the same for every player:

> They will save Lawson's file. They will want to know why he did it.

It sets nothing and stays outside the Reading's four entries (D-06). On `cage_bin == "derek_file"` (the default too) he was right, and the player has it in his hand that he guessed them. Otherwise he was wrong, and the player has seen him be wrong before m10 asks them to prove it. m10's "Then I was wrong about one thing." becomes "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != "derek_file"` (proposed). Cold starts read the same line: Lawson's file is in the bin on every branch.

**What to tell HaX** (`reading_told_hax`, local). Afterwards HaX asks once whether the player wants to tell her what it says. **[All of it.]** (including "Their handler will cover for them. She was taught to.") / **[It's about me. It can stay that way.]**

- Telling her hands her the cruellest line in the file just before her confession, and her reply to the player's answer knows it (SE §4.3: "He wrote that I'd cover for you. He'd know. He taught me.").
- Keeping it does to HaX, in small, what she did with the name: the player holds something back from someone they work with, for their own reasons. Her confession reply is the plain one.

Both are stances with a different line each; neither costs the player anything mechanical, and neither is the right one. The parallel with her silence is the point, and nobody says it aloud.

**Forced.** No.

### 4.7 The raid team and Kowalczyk

**The briefing** (`raid_team_answer`: `quintero` / `kowalczyk` / `""`). Every player, after the team's four beats (story arc §3.3): **[She's right. Send me anyway.]** (backs Quintero), **[Thank you. For the cracker.]** (thanks Kowalczyk), or nothing. Nobody in the room yet knows what the answer will mean. It is paid back once, where it hurts (W-19): on Kowalczyk, when the Recruiter names her, HaX: "You thanked her at the briefing. Keep doing it."; on Quintero, at the Harwick & Lowe sheet, HaX: "You took her side at the briefing. Keep it. Don't take her word." A stance, so convergence is fine; it is remembered.

**The hangar** (`kowalczyk_reply`: `warm` / `flat`). Every player, debrief beat 2: "Well? Did my toy earn its keep?" **[It opened the safe. Thank you.]** / **[It did the job.]**

| Player knows | Warm | Flat |
|---|---|---|
| nothing (`not sleeper_named and not sleeper_shortlist`) | A colleague thanked for a kindness. | A colleague brushed off. |
| two faces (`sleeper_shortlist`) | Kind to someone who may be WREN, or may be innocent. | Cold to someone who may be innocent. |
| her name (`sleeper_named`) | The player performs for WREN, as Netherton will ask in the spine ("Until then she sees nothing in my face. Nor in yours."). | The player can't, or won't. Narrator, as Netherton arrives: "He watches her go back to the ramp, and says nothing." |

Stage 1 gave the flat reply Netherton's "Warmer, next time. She notices.", which promises an effect nothing delivers: she is cuffed at m10's briefing whatever she noticed. The line is replaced by the narrator's (proposed, §11). The alternative, exporting the reply so m10 can give her "You were cold in the hangar. I wondered." as she is cuffed, costs an export for one line; it is listed as an option, not recommended. The hangar is about what the player can bring themselves to do face to face, and that matters without a payoff.

**What the player owes Kowalczyk** is §7's question. These two moments are where the player answers it, before m10 asks them to accuse her.

## 5. Dominance and forcing audit

One row per choice. "Stage 1 problem" is what this stage found; "now" is the state after §3–4.

| Choice | Stage 1 problem | Now | Forced by | Gates completion? |
|---|---|---|---|---|
| D Cage bin | Nightshade's copy weak where he is not a triple agent; no m10 echo for any bin | Each bin wins somewhere; `cage_bin` exported with an m10 use per value | the cage opening (event) | no |
| G Recruiter and deck | "Take" cost nothing "refuse" didn't, so "refuse, pull the tapes" was dominated; both "pull nothing" routes were dominated; the invoice existed only in m10; the threat line ("anything else") contradicted the take route | Price is the whole deck; four routes, none dominated; the invoice shown in play; the double-cross's cost lands in m09 as her text | `deck_choice_made` opens Sorensen's office (lock); re-ring rule | no: every route reaches the office |
| H Own it or hang up | Hanging up bought nothing | Hanging up keeps the spring off the record tonight, at the price of the offer and m10's worse moment | the call's first choice | no |
| K Confession answer | none (a stance, each value paid three times) | unchanged | `identity_scene_done` → flag 4's read → Tesseract's call → conclusion (condition chain) | no |
| L The notice | Holding was free and sending free of cost, so holding was dominated; optional, so many players never met the finale's argument | Sending costs the Critical Mass watch and the inquiry's question; every player decides at the debrief | the debrief's spine (the conclusion task is on its last line) | no |
| M Memo stance | none | unchanged | the debrief's spine | no |
| F Nightshade's file | Holding it was dominated | Sending spends his channel; holding keeps it | not forced (branch only); HaX asks with two buttons | no |
| B Noor | Telling had no cost and leaving no gain | Telling costs her the job and buys the truth and, in time, the legacy files | not forced | no |
| E Sorensen | "Saves what she hadn't reached" named nothing; arrest, knock-out and leaving had no trade | Force (before the chest) saves the legacy files and costs violence and the list; talk (with the file) gets the list | not forced | no |
| I Tran | none serious | Talk lets him walk and warns Social Fabric; force keeps him | not forced | no |
| C Old Coyote | none | unchanged; the knock-out loses everywhere by design | not forced | no |
| J The Reading | none | unchanged; reading on wins outright by design (curiosity); the bin note added | not forced | no |
| A, N Raid team, hangar | the flat reply's "She notices" promised a payoff that never came | the promise cut; both are stances, each remembered | A: not forced; N: the debrief's spine | no |

**Options allowed to lose everywhere.** Two, both conduct tests the season already uses: a knock-out on an innocent (Old Coyote; Sorensen once the legacy files are safe or gone), and putting the Reading down. Each is warned or costs only attention. Everything else wins on at least one thing the player can see.

**What the critical path never waits on.** No choice, no find and no import: the four flags, the office (opened by the deck choice, whatever it was), the safe (the cracker, or the PIN on her desk), the tape room (the code, with or without Gary). `concludeRequires` is the four flags only.

## 6. How earlier choices change these

Imports change what a choice is worth, who offers it, or which buttons exist; none removes a forced choice or the critical path. Tier is FA §3.1's. "Never played" is the canon default (FA §3), and every choice works on it.

**Tier 1 imports that change a choice**

| Import | Choice | What changes | Never played / default |
|---|---|---|---|
| `m05_recruiter_deal_accepted`, `m05_recruiter_deal_confessed` | G, H | Sold and lied: the receipt opens the call and adds H; a hang-up becomes a refusal. Sold and confessed: HaX kills her leverage first, and `recruiter_secret = confessed` | No deal or never played: "Last time I said…" / a stranger; no H |
| `m05_final_choice` (with the never-played canon) | G | What her file is worth, said by HaX before the answer: the handlers for the twenty-three (default); on `public_exposure`, her handlers and the forty-seven; on `turn_double_agent`, the names Torres couldn't give. The closing card's "her network" follows it | Torres arrested: the handlers for the twenty-three |
| `m05_torres_turned` | G (after a refusal) | Torres' sick-parent line lands on the shortlist: the refusing player's lost certainty is partly made up | No call; the cross-reference the full way |
| `m05_found_pipeline_list` (with the two above) | B, E | Warned in time: Noor has held the last trolley back, so the legacy files are safe without a choice, and her choice never arises; warned late: the choice exists, and she keeps her card | Not warned: the full choice |
| `m08_nightshade_tidied` | D | The other bin is Nightshade's copy, not the letters | The letters |
| `m08_nightshade_triple_agent` | F; D | F exists only here; the copy changes his text reply | No F |
| `m01_maya_ko` (with `m01_completed`) | D, I, C | The letters give back Maya's warning before Tran's guard; Tran is a surprise and calls a guard; Tran's radio call sends Old Coyote's round past the drop terminal (telling him the truth empties the round) | `m01_completed and not m01_maya_ko`: HaX warns about Tran first; never played: the neutral warning |
| `m03_victoria_fate == "recruited"` | D | The bins are two objects inside the cage door, taken as it opens | The hatch |
| `m06_architect_identity_found` | K | Which answer wording (Netherton or "told me") | Not found |
| `m07_teacher_discussed`, `m07_architect_echo_heard` | K | HaX's opening and recognition line before the answer | The fourth form |

**Tier 2 imports that change a choice's framing**

| Import | Choice | What changes |
|---|---|---|
| `m04_disclosure_choice` | L, M | HaX's line at the Albion papers: the player told the inquiry everything, half, or nothing, and SAFETYNET told the vendor nothing for nine years. A quiet player is asked to do with his letter what they didn't do with theirs. Reading entry 3 says the same from his side |
| `m04_voltage_captured`, `m04_voltage_escaped` | L | What the Critical Mass watch follows, so what sending costs: Voltage's people (escaped), what's left of his crew (captured), Critical Mass (default) |
| `m01_final_choice` | D | What Derek's file says (his standing order on `surrender`; the press on `expose`) |

**Choices m09 makes inside itself.** The briefing answer (A) is paid in G and at the Harwick & Lowe sheet; the cage bin (D) decides whether talking Tran (I) is possible; Noor (B) decides whether force on Sorensen (E) is worth anything; Nightshade's file (F) is the lever for talking Sorensen down (E); the Reading (J) changes HaX's reply in K. These links are the night's texture: what a player did an hour ago changes the next room.

**The default path.** A player with every import at its default: Noor not warned (B open), the letters as the other bin, no F, no H, the stranger Recruiter with the full offer (G), HaX's fourth form (K), the generic Critical Mass watch (L). Every forced choice is present and priced.

## 7. The moral questions

m09 asks four questions. It answers none of them for the player, and m10 makes the player argue each one with the man who raised it.

**1. Disclose or hoard?** The finale's spine, asked four times at four sizes before m10 asks it at the size of the database:

- A flaw (L): send the letter he drafted nine years ago, and lose an operation and the service's quiet; or keep both.
- A man (F): tell Nightshade what his teacher wrote about him, and lose a useful asset; or keep him useful and ignorant.
- A woman (B): tell Noor what the bonus was, and cost her the job; or leave her safe and unknowing.
- A network (G): the Recruiter's file is the one thing in the building she wants hidden, and pulling it is the only way to use it.

None of these has a free answer, and the player's pattern across them is their position on his argument before he makes it.

**2. HaX's silence.** She sat on the name, the dead are on the wall, and Netherton is listening (K). The player can blame her, absolve her, or hand her own rule back to her. The Reading asks the same in miniature: the player can keep his line about her to themselves (J), as she kept the name. Nothing marks a right answer, and the debrief and m10 pay each one as what the two of them now are.

**3. Dealing with the Recruiter.** Buying from a criminal (G): the name is always right, the price is the deck, and the sale goes in her books where he will read it. Keeping your word to her, or breaking it for half her people. For a player who sold her the forty-seven in m05, saying so aloud (H). The questions under it: is a true name bought from her worth a network left in place, and does a bargain with her bind you?

**4. What the player owes Kowalczyk.** She gave the player her own cracker, it worked, and she asks after it. On the take routes the player knows she is WREN and must thank her, or not, to her face, with Netherton walking up (N); and the Recruiter tells them why she did it, as an expense: her mother's care home, paid every month for eleven years. On the refuse routes she is one of four colleagues, or, after the cross-reference, one of two kind people, one of whom is innocent. The player can't pay a debt to her without lying to her, and m10 asks them to accuse her.

**And one more, underneath: force against people who can't fight back** (E, C). Sorensen is 66 and non-combat; Old Coyote is innocent. The legacy files make force on Sorensen worth something, once, so the question is real; Old Coyote's knock-out is worth nothing, so it is a test of conduct.

## 8. How the debrief reflects the night

**The rule.** Each choice lands first at the moment it bites, in play. The debrief answers only what the player asks, plus the spine, and never reads the night back as a list. The credits' choice lines (stage 4) are the one place a list is allowed, as the wall was at the briefing.

**Where each choice has already landed before the hangar.**

| Choice | Lands in play at |
|---|---|
| D bin | the shredder taking the other; the plan chest (Derek's second sample); the closet (the letters); his text (the copy) |
| G Recruiter | the name said; the degausser; the ledger line booking the sale; her text (double-cross); HaX reading the first handler (her file); the clip (the tapes) |
| H the spring | "Noted. Later." on the open line |
| B Noor | her question, and her empty desk |
| E Sorensen | the shredder stopping, or not; the list on the counter, or the legacy files in the player's hand |
| F Nightshade | his text, or silence |
| L notice | "Gone." and the watch going dark |
| K confession | HaX's reply, at once |
| Beat 2.7 | HaX names what the purge cost (which bin and which tape are gone), once, after the deck |

**What the debrief adds**, in story arc §7.1's order:

1. **Kowalczyk** (N): the scene itself carries the choice; nobody comments on it.
2. **The memo, then the notice** (M, L): one question each, both new decisions rather than recaps.
3. **The hub**, each topic asked once:
   - **"The archive, sir."** At most two lines, the first two that apply in this order: Sorensen knocked down; the legacy files saved ("Eleven names. None of them ours. Tonight that is the best news I have."); Noor told; Old Coyote knocked out; Tran. Lost files get no line. The bin and the tape are not repeated: HaX named them in Beat 2.7. (Stage 1's answer listed six things in one breath.)
   - **"WREN."** and **"The Recruiter."** as story arc §7.1, with the double-cross and invoice lines; on `recruiter_secret == "told"`, Netherton's "I do not need to hear it twice."
   - **"The notice."** only when it was sent in the archive (the debrief question covers the rest).
4. **The spine**: the two names; the pen, with his reply to the memo stance; HaX last, by K; why the team goes in together.

**Judgement.** The debrief judges nothing (story arc §7.2). Netherton says what each choice bought, in his voice, and moves on. The one exception is the knock-out on Sorensen, where his line is dry enough to be a judgement without saying so.

## 9. FINALE_ARC §13 items for stage 3

Items owned by stage 3 that concern m09. The m10-only items (14, 24, 28, 34–37, and the m10 half of 11) are the m10 stage 3 author's; where an m09 choice feeds one, it is noted.

| # | Item | Settled here |
|---|---|---|
| 7 | The Recruiter's wording; the double-cross's cost | §3.2 and §3.3: the price is the whole deck; button text; HaX's private text pricing all four routes; the double-cross's cost felt in m09 (her text) and m10 (her 06:00 text, "About half"). Stage 7 writes the lines. |
| 25 | The Alpha tapes' later use, and whether they play | Below. |
| 27 | Why the branch operations disclose would burn survive the raid (m09's side: Nightshade) | §4.1: his channel survives only if the player held his file; sent, he picks a side out loud at the door and the channel is spent. The watch on a recruited Victoria is m10's to settle. |
| 33 | The invoice and refusing's clean record; rank the clean record | Below. |
| 38 | Talk stopping Sorensen; an m10 echo of the cage bin; W-26 | §4.3: yes, with Nightshade's file as the lever, and it stops her without turning her. §3.1: `cage_bin` exported, with an m10 use per value. §4.6: W-26 added as a margin line on the Reading's last page. |

**Item 25: the Alpha tapes.**

They are saved only on the refusal route that chooses them (`deck_pulled = alpha_tapes`, `recruiter_offer = refused`), so their payoff is what makes that route worth taking against the name.

- **They play, if the user approves** (§12). One clip, about fifteen seconds, at the tape room's station after the identity scene (`identity_scene_done`; before it HaX holds it: "I know whose voice that is. After."). Tesseract's voice (Sadaltager, as in m07), fifteen years younger, treated as an old lecture-room recording: neither m07's handset distortion nor m10's clean voice in the room, so m10's first sight of him keeps its weight. Two lines, both things he teaches and then does:

  > Dr Adrian Tesseract *(tape)*: The best lock there is opens for the right name. Nobody fights a door that's expecting them.
  >
  > Dr Adrian Tesseract *(tape)*: And build your own way out first. Always. Then let them build their way in.

  HaX says nothing while it plays, then: "Tape two. He gave that lecture every year." It is one non-HaX voice in its scene (a recording counts as one; nobody else speaks there).
- **If the user declines**, the same two lines are a typed transcript on the station, and HaX reads the second aloud in her own voice. Every payoff below stays.
- **The decode** (optional, as stage 1 has it): the annotation sheets decode to his first draft of the line, in his hand: "Carry it yourself. Let it hurt afterwards." HaX: "That's the version he taught us." It sets up m10's record answer ("You told them to carry it. You never told them to hand it on.").
- **m10** (proposed): the record answer under the third claim, as m10 stage 2 has it; at the blast door, as it opens for 0x00 by name, one HaX line ("The best lock there is. Tape two."); and **at the core**, if WREN is free, HaX as the player reaches the console: "Service door. He always builds his own way out first." Quintero comes in from the lock early and takes WREN at the door unhurt (`sleeper_caught` true, no wound). This is the route's real advantage: the player who refused the name is the one who most needs it. It makes `m09_deck_pulled` a Tier 1 helper in m10, not Tier 2.

**Item 33: the invoice and the clean record.**

- **The invoice: confirmed**, as m10 stage 2 §2.2 has it: on `taken` or `double_crossed`, one ledger sting in his evidence, deciding nothing ("You bought WREN from my Recruiter. You understand costing."). m09 now shows the sale being booked (§3.2), so the sting refers to something the player saw.
- **The clean record: confirmed**, as a record answer under the second claim, on `named` or `refused`. **Ranked last** of the second claim's four record answers: after `m04_disclosure_choice = full`, `m09_albion_notified` and `m02_exposed_hospital`. Those three answer "only a shock fixes it" head-on (disclosure worked, and nobody died); refusing to buy a name answers it at an angle (one agent who wouldn't trade). Two show at most, so it appears for players with fewer than two of the others, which includes most m09-first players who refused.
- **Its wording**, for the new price: [Your Recruiter offered me a name. I wouldn't buy it from her.] His answer differs by value, because "it worked" is only true on one: on `named`, "*pause* No. You'd rather the slow way. It worked."; on `refused`, "*pause* No. You let her keep her people sooner than pay her. I didn't think your service still did that." Both land (proposed for m10).

## 10. State table

Every global a choice in m09 sets, plus the finds m10 or a later m09 line reads. Working names; stage 4 fixes them. Every one is declared in `globalVariables` with the default shown, `VAR`-declared in each ink file that reads it, and read somewhere after it is set (`README_ink_best_practices.md`, the three legs). None is an import, so all are writable. None appears in `concludeRequires` or an `unlockCondition` except the done-flags, which hold the night's order (story arc §11).

**Exported to m10** (FA §3.4's nine, plus two proposed)

| Global | Values | Default | Set where | Read in m09 | m10 use |
|---|---|---|---|---|---|
| `recruiter_offer` | `taken` / `double_crossed` / `named` / `refused` | `""`; the call's first line sets `refused` | G | debrief "The Recruiter."; the ledger line (`taken`, `double_crossed`); her text (`double_crossed`) | closing card (one rule); the invoice sting; the clean-record answer |
| `deck_pulled` | `none` (with `taken`) / `her_file` (with `named`, `double_crossed`) / `alpha_tapes` (with `refused`) | `""`; first line sets `none` | G | Beat 2.7's loss line; the tape clip and decode; debrief | the Tomb Alpha record answer; the blast-door line; the service-door warning (proposed; Tier 1) |
| `sleeper_named` | bool | `false` | G, only when she says the name | the hangar; debrief "WREN."; Beat 3.1's cracker line | WREN detained at the briefing |
| `sleeper_shortlist` | bool | `false` | reading the Harwick & Lowe sheet (a find) | debrief "WREN."; the hangar | HaX's "Two faces from Helena." on `not m09_sleeper_named` |
| `recruiter_secret` | `""` / `confessed` / `told` / `kept` | `""`; first line sets `kept` or `confessed` by branch | H | debrief (`told`) | Tesseract's leverage line and HaX's reply; the "on file" credits clause on `told` (proposed) |
| `hax_confession_answer` | `should_have_told` / `same_in_your_place` / `afterwards` | `""` (never empty on a finished m09) | K | her reply; the debrief's last HaX line | the core and the briefing (FA §5.4) |
| `albion_notified` | bool | `false` | L (archive or debrief) | debrief | record answer under the second claim; HaX at the database choice; "Elsewhere" inquiry clause (proposed) |
| `nightshade_shown_file` | bool | `false` | F | his text | the door (override or tripwire); whether his channel is live at the database choice (proposed) |
| `reading_finished` | bool | `false` | J | none | record answer; "Then I was wrong about one thing." (or "two things", proposed) |
| `cage_bin` **(new)** | `derek_file` / `letters` / `nightshade_copy` | `""`; the cage opening sets `derek_file` if the player took neither | D | the plan chest's second sample; Tran's talk; his text; the debrief | Derek's record answer; the media-room line; the door line and the arrested-branch help; the "two things" variant |
| `legacy_files_saved` **(new)** | bool | `false` | B (Noor's trolley held, or warned in time) or E (force before the plan chest) | the files as an object; debrief | one "Elsewhere" clause |

Tier in m10 (proposed): `cage_bin` Tier 1 (the arrested-branch help is an H) if the m10 author takes it, else Tier 2; `legacy_files_saved` Tier 2; `deck_pulled` moves to Tier 1. m10's imports from m09 become eleven plus `m09_completed`.

**Local to m09**

| Global | Values | Default | Set where | Read by |
|---|---|---|---|---|
| `raid_team_answer` | `quintero` / `kowalczyk` / `""` | `""` | A | HaX at the naming (G) and at the shortlist |
| `noor_told` | bool | `false` | B | Noor's exit; the debrief |
| `old_coyote_told`, `old_coyote_ko` | bool | `false` | C | his round; the debrief |
| `sorensen_fate` | `talked` / `ko` / `left` | `left` | E | the shredder; her list; the debrief |
| `tran_outcome` | `talked` / `ko` / `left` | `left` | I | the tape side; the debrief |
| `reading_told_hax` | bool | `false` | J | HaX's confession reply |
| `memo_stance` | `yes_albion` / `no` | `""` | M | Netherton at the pen |
| `notice_sent_in_archive` | bool | `false` | L (archive send) | which debrief line plays |
| `kowalczyk_reply` | `warm` / `flat` | `""` | N | the narrator line on `sleeper_named` and flat |
| `schedule_read` | bool | `false` | reading the master schedule (a find) | the realisation at flag 4 |

**Done-flags** that hold the forced choices (story arc §11; not choices, listed so the locks can be checked): `cage_opened` (D happens before it), `deck_choice_made` (G; opens the office), `identity_scene_done` (K; flag 4's read waits on it), `hour_read_done`, `tesseract_call_done`.

## 11. Proposed changes

Not made here. FINALE_ARC and stage 0 are the arc-keeper's; m10's files are the m10 author's; stage 1–2 wording is listed so the next pass can apply it.

**FINALE_ARC (arc-keeper)**

1. **Row 60, §3.4 `recruiter_offer` and `deck_pulled`, §6.1 item 3, §2.9:** the Recruiter's price is the whole deck. Take: she names WREN and nothing comes off (`taken`, `none`); "then HaX pulls the Alpha tapes or nothing" is withdrawn. Refuse or hang up: HaX pulls her file (`named`) or the Alpha tapes (`refused`); "or nothing" withdrawn. Double-cross unchanged. Her threat line drops "else". `deck_pulled` is now derivable; kept as an export. (§3.2.)
2. **§3.4:** add two exports, `cage_bin` (`derek_file` / `letters` / `nightshade_copy`) and `legacy_files_saved` (bool): eleven in all. **§3.2:** add `m09_cage_bin` (Tier 1 if the arrested-branch help is taken, else Tier 2) and `m09_legacy_files_saved` (Tier 2); move `m09_deck_pulled` to Tier 1 (H). Counts change accordingly.
3. **§4.1, the three exchanges table:** exchange 1 gains Derek's file as its last record answer; exchange 2's clean record is ranked last, worded "[Your Recruiter offered me a name. I wouldn't buy it from her.]", with the answer by value (§9 item 33). Item 33 settled.
4. **§4.1 step 4 (Disclose) and §4.6 (Secured):** Nightshade's channel is live only on `m08_nightshade_triple_agent and not m09_nightshade_shown_file`; on a shown file it is spent. Add the Critical Mass watch to Disclose's branch list on `not m09_albion_notified`. Row 105 gains the cost. §13 item 27 settled for Nightshade.
5. **§4.4, "WREN at the core":** on `m09_deck_pulled == "alpha_tapes"`, HaX's service-door warning; Quintero takes WREN at the door unhurt. Add HaX's blast-door line to row 119.
6. **§4.6 "Elsewhere" and the credits:** clauses for `albion_notified` (the inquiry asked when SAFETYNET knew), `legacy_files_saved` (eleven placements outside SAFETYNET), and `recruiter_secret == "told"` (the spring, on file).
7. **§6.1, the purge:** the legacy placement files on Noor's last trolley, which leaves her desk when the cage opens and goes under the shredder when the plan chest opens, unless Noor held it (told, or warned in time) or Sorensen was stopped by force first. Sorensen can be talked down with Nightshade's file once the chest is open. Still optional, still event-driven; still no critical-path loss.
8. **Row 62:** warned in time, Noor has also held back the last trolley.
9. **§1.3 / row 120 neighbourhood, §5.1 Tesseract row:** "Not voiced in m09 unless stage 3 makes the Alpha tapes playable" becomes "one tape clip after the identity scene, if the user approves (stage 3 §9 item 25)".
10. **§13 statuses:** items 7, 25, 33 and 38 settled here (25 pending the user's approval of the clip); 27 settled for Nightshade.

**m09 stage 1 (`story_arc.md`)**

11. **Beat 2.4:** spine step 2's price ("The price is the deck. All of it goes."); step 3's threat without "else"; HaX's private text before the answer; step 5's routes as §3.2 (no "pull nothing", take leaves nothing); the ledger line booking the sale; the double-cross text at the tape room. Replace the route table with §3.2's four rows.
12. **Beat 1.2 and Beat 1.4:** HaX's trolley line after flag 1; Noor's "tell" choice costs and effects; warned in time, the held trolley.
13. **Beat 2.1 step 6:** Sorensen won't stop for an arrest alone; the force/talk trade and the legacy files (§4.3).
14. **Beat 2.2:** HaX's explicit two-button question about Nightshade's file and its price.
15. **Beat 2.7:** HaX's loss line covers "both tapes" on `taken`.
16. **Beat 3.1:** the bin note in the Reading's margin (W-26).
17. **Beat 3.2:** the clip at the tape room's station after the identity scene, or the transcript.
18. **Beat 3.4:** HaX's cost line by m04 branch; HaX's "Gone." and the watch going dark.
19. **§7.1:** the notice question after the memo stance; "The archive" capped at two lines; "The notice." topic only on an archive send; Netherton's "Now I will spend a month explaining it."; the narrator line replacing "Warmer, next time. She notices."
20. **§8:** replace the table with §2's, or point to this document; drop "Handed to stage 3".
21. **§13 "Stage 3":** mark settled.

**m09 stage 2 (`storytelling_elements.md`)**

22. **§2 Recruiter:** "He took her for Montana and didn't ask. I'll give you her name tonight" → "He took my placement for Montana and didn't ask. I'll give you the name tonight" (no pronoun for WREN before the name; m10 change 1; story arc Beat 2.4 spine 1–2 to match); "a tape you've never heard of" → "a deck you've never heard of"; add "I won't be watching which tape. I'll be watching the deck."; her threat without "else"; her double-cross text. **§4.3:** HaX's private text; "Gone."; the watch line; the Nightshade question; the trolley line; "She's sixty-six."; "Tape two. He gave that lecture every year." **§3 Sorensen:** "When I've finished, dear."; "Then I'll keep mine." **§5.3:** the tape transcript row; the bin note. **§2 Netherton:** drop "Warmer, next time. She notices."

**m09 stage 0**

23. **§2.2 "Choices for every player":** "taking it means HaX pulls Tomb Alpha's tapes or nothing instead" → "taking it means the whole deck is wiped"; add the notice to the every-player choices (asked at the debrief if unsent).

**m10 (m10 author)**

24. **Stage 2 §2.2–2.3:** Derek's file answer under exchange 1 (last); exchange 2's clean-record wording and per-value answers; "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != "derek_file"`.
25. **The door:** "You read what I cleared." on `m09_cage_bin == "nightshade_copy"`; optionally, on the arrested branch with the deal, he names the wrong entry himself. A shown file spends his channel.
26. **The core:** the service-door warning on `alpha_tapes` (Quintero unhurt); the blast-door line; HaX's database-choice line on `albion_notified` ("You burned the Critical Mass watch for one letter. This is the same, bigger.").
27. **The media room:** Tran's handler line on `m09_cage_bin == "letters"` (to the server-hall prop if the room is cut).
28. **Credits:** the three "Elsewhere" clauses (item 6).

**Stages 4–5 (engine and placement)**

29. A ledger object at the drop terminal whose text gains a line on `recruiter_offer` in `taken` / `double_crossed` (engine check 10, object text on a global).
30. Noor's last trolley: an object at the front desk that moves to the cage on `cage_opened` unless `noor_told` (or warned in time); a shredded state on the plan chest's opening unless Sorensen is down; the legacy files readable wherever the trolley ends up.
31. Noor leaving the building on `noor_told` (`setVisible`), with her desk's other content intact.
32. Sorensen's arrest line that does not stop her; the talk lever gated on holding Nightshade's file; her list as an object at the hatch counter on `sorensen_fate == "talked"`.
33. An audio clip played from an object at the tape room's station, gated on `identity_scene_done` (a new engine check if no object plays audio today), or the transcript fallback.
34. HaX's private text during the Recruiter's call: a phone text arriving while another phone conversation is open (engine check: texts during a call).
35. The notice question in the debrief cutscene, between the memo stance and the hub.

## 12. For the user

1. **Approval needed: a voiced Tesseract clip in m09** (§9 item 25). Two lines, about fifteen seconds, Sadaltager as in m07, treated as an old lecture-room recording, playable in the tape room after the identity scene, only for a player who refused the Recruiter and saved the Alpha tapes. It is the first time m09 lets the player hear him, fifteen years younger. If declined, a transcript does the same job and nothing else changes.
2. **For the orchestrator, then the user if wanted:** the Recruiter's price changes (the whole deck, no "pull nothing"). It is the largest change here, and it touches FINALE_ARC row 60 and §3.4, stage 1 Beat 2.4 and stage 0 §2.2.
3. **Tone check on Noor** (§4.2): telling her the truth costs a woman the job that pays for her father's dialysis. It is the sharpest small choice in m09 and stays off-screen after she leaves; the user may want it softer (for example, Netherton saying SAFETYNET will cover the treatment, which would remove the cost).
4. **Two new m09 exports** (`cage_bin`, `legacy_files_saved`). JSON-only in m09's own `exportGlobals`; no other mission changes.
