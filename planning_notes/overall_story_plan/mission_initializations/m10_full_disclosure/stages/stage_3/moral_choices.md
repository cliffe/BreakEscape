# m10 Full Disclosure: Stage 3, moral choices

## 0. Status and sources

**Stage 3 complete** (draft 4, 2026-10-21; round 3's findings folded in, §17; no further review round, the orchestrator checks directly). Author: stage 3 author (Opus), 2026-10-21. Draft 1 the same day; round 1 reviews (`REVIEW_R1_CHOICES.md`, `REVIEW_R1_STRUCTURE.md`) folded in (§15), then round 2 (`REVIEW_R2.md`, §16), each with the orchestrator's rulings. User decisions in force: F11 (two lethal versions), F12 (m09's Alpha-tapes clip is voiced), F13 (surrender is a deal with no public trial; arrest is a public trial with no cells), F14–F16 (engine trials, playtest bootstrap, KO-pattern exports). **Milestone fix pass, 2026-10-21:** the stages 0–3 milestone findings and the orchestrator's simplification pass are applied here (media room and C11 cut; gallery at two options per branch; record pools of two; one fixed cells rule; a walkabout of three; the test plan rebuilt as act-start segments). The log is `../stage_1/story_arc.md` §20. **Stages 4–5 folded in, 2026-10-21** (`../stage_4/objectives_tasks.md`, "OT §n"; `../stage_5/room_layout.md`, "RL §n"; log in arc §21): the S4-/S5- changes that target this file are applied below. This file stays the authority for every choice, cost and global; OT and RL are the authority for how each is wired, placed and locked.

Built on `../../../finale/FINALE_ARC.md` ("FA §n", thread rows "row n"; the version with stages 1–2 folded in, FA §15), `../stage_0_initialization.md`, `../stage_1/story_arc.md` ("arc §n") and `../stage_2/storytelling_elements.md` ("SE §n"), with m09's choices and exports from `../../m09_digital_archaeology/stages/stage_3/moral_choices.md` ("m09 MC", its round 1 revision: eleven exports, the double-cross voiding the name, `recruiter_secret = denied`). The prompt is `story_design/story_dev_prompts/03_moral_choices.md`; where it and the newer standards differ, the newer ones win: `npc-dialog-review` §2d (choices that matter), `mission-puzzle-chains` §3a (are the mission's own choices required), `README_ink_best_practices.md` "Making Choices Matter", and `docs/agents/CARRY_OVER_PLAN.md` (imports never gate completion).

Stage 1 says what happens and in what order; this file says, for every choice, what the player sees, what each option costs and buys, who says so before the player picks, and what global records it. Where this file changes a cost or an option that stage 1 or 2 already wrote, the change is listed in §14 and this file is the authority for stage 4 onwards. Sample lines are samples (stage 7 writes the ink); choice text is in brackets, first person.

Conventions as in arc §0: UTC clock times; flags by story meaning only; "WREN" or "the sleeper", never "the plant"; "the power room"; no pronoun for WREN before the accusation; one non-HaX voice **on the line** per room (people in the room speak in person and don't count), the raid net counting as HaX's channel. Global names are working names in `snake_case`; stage 4 fixes them. There is no security-camera system in the engine (`systems/` has guard sight only), so every "camera" below is an object that sets a global, and what it changes is guard staging.

## 1. Rules every choice keeps

1. **Every option buys something the others don't.** If one option is better on every count, it isn't a choice. Each decision below lists a gain and a cost per option, and §13 records where stages 1–2 or draft 1 had a dominated option and how it was fixed. Puzzles (a right answer by design) and tasks (free to do) are labelled as such and are exempt.
2. **The cost is said before the pick**, by someone with a reason to say it: HaX, Netherton, the person in the room, or the narrator at the core. A cost the player learns only afterwards is allowed for one kind of choice, the trust test (does the player check before they trust?), and then the warning to check comes first. In the gallery, where HaX is jammed, her warnings come in her last line before the jam (D-22).
3. **The cost is felt in play**, not only in the credits: a door that opens or stays shut, a person who is or isn't there, a line from someone the player knows, a beat at 06:00. **An effect worth one guard more or fewer always comes with a line that says why** (a guard's bark, HaX naming it, a person's absence the player can see); otherwise it moves onto a person. At most three choices in the mission pay in a guard more or fewer, and each is voiced in the room: the tunnel post (the door, §3.1), the gallery's monitor post (the camera switch, §3.4) and Farah's gallery post (Imran, §3.3). Reinforcements after an alarm (a trusted Victoria while the share is live) are an event the player watches happen, not a quiet count. The credits restate an outcome in one clause; they never carry it alone.
4. **Fight or sneak is a playstyle, not a moral option.** Every scene keeps a way through by knock-out, stealth or a cloned card (stage 0 §2.2). It is quicker and costs an epilogue line where someone is hurt. The no-dominance test applies to the social options. **Every slot scene's first line sets its outcome global to `avoided`, and a room-exit mapping sets the same if the scene never opened**, so a player who walks past still gets a credits clause.
5. **Forced or optional, stated for each choice.** A choice the story needs is forced by a lock or an event, never by a nag: a story door (an RFID lock whose card exists nowhere) opened by the F19 `unlockDoor` mapping on HaX once its condition holds, its done-flag set from the unlock event itself (`door_unlocked_by_npc` from `agent_0x99`), with `game_loaded` and failed-try catch-ups and a holding bark that names what is missing (S4-1, S4-18; OT §4); a menu that must be answered to go on; a phone scene that rings again. An optional choice has a signposted cost for skipping it.
6. **Imports never gate.** No import appears in `concludeRequires`, an aim's `unlockCondition`, or a door mapping's condition (FA §3; CARRY_OVER_PLAN §2.7). An import may decide which branch of a scene plays and which options the menu shows; the locks that force a choice read only m10's own globals, which every branch sets. Every scene works with every import at its default (§7).
7. **Forced phone scenes** (Ghost's handset, arrested Victoria's line) follow FA §6.1: defaults on the first line, the done-flag on the last choice, and nothing downstream keyed on the conversation closing. Ghost's is answered, not sprung (OT §4.2): the handset rings as the player enters the office, a click on it opens the call, every click resumes it at the last unanswered choice (`resume: true`), and re-entering the office re-rings it; the done-flag lock holds the player until it is answered. Arrested Victoria's rings on flag 2 and once more at the gallery stair (§3.5). **No phone rings into the jammed gallery** (§3.5). Forced calls are voiced (F17, F20; OT §13).
8. **Stance choices are allowed** where the outcome is fixed by character (Ghost on the kept branch, Kowalczyk's question), and each still sets a global that something reads later (npc-dialog-review §2d.2).
9. **No line tells the player about a choice they didn't make.** Every at-large or penalising default also needs that source's `completed` (FA §3).
10. **Knock-outs and walk-aways never strand a forced scene.** The engine's static `koImmune: true` works (RL §6 item 36). Every holder of a forced face-to-face scene is `koImmune` (Nightshade at the table and in the van, Netherton, Malhotra on comms, HaX in person, a captured Voltage, a taken-in Nightshade at the lock), so their `npc_ko` nets are dropped (S5-8). Tesseract is `koImmune` for the whole core scene (S4-8); nothing needs the key toggled, so the toggle stays an unapproved engine item, and his knock-out fallback is withdrawn (§6.1). Every knockable slot-holder has a non-talk way past (RL §3).
11. **The core resumes.** Its four menus, and WREN's one-option "[Stop her.]" beat, write their globals on the pick (`exchange_1..3`, `console_choice`, `wren_at_core`, `database_outcome`, `ending`); walking away or reloading re-enters at the first one still unset. Nothing is incremented, so nothing can be counted twice (`points_landed` is derived, §6.3).
12. **Every choice is labelled by kind** (§2): dilemma (no right answer), puzzle (a right answer by design), stance (outcome fixed, attitude recorded), task (free to do), information, or hub. Stage 7 writes menus by kind.

## 2. Every choice at a glance

In the order a player meets them. "Forced" names the lock or event that makes the player answer; "optional" choices name what skipping costs. Globals are in §12.

| # | Choice | Kind | Who meets it | Where | Forced or optional | Main global |
|---|---|---|---|---|---|---|
| C1 | Back Quintero or Netherton | stance | every player | briefing (cutscene) | forced: a cutscene menu; "say nothing" is an option | `quintero_stance` |
| C2 | The door: four branches (§3.1) | dilemma (the unshown branch adds a trust check, a puzzle) | every player | forward post | forced: the breach waits on `door_scene_done` (with flag 1 and the pair back) | `nightshade_*`, `door_scene_done` |
| C4 | Ghost (§3.2) | dilemma on the selling branches; stance on kept and refused | every player | security office handset | forced: the stair down opens on `ghost_call_done` | `ghost_sale`, `ghost_gift`, `ghost_answer` |
| C5 | The workshop (§3.3) | dilemma | every player | workshop floor | forced: the power-room door needs a talked-round technician, Gary, a cloned card or the fitter's spare card from the security office | `imran_outcome`, `gary_outcome` |
| C6 | The power room (§3.4) | dilemma | every player | power room | forced: aim 3, the gallery's shutter, is cut by the slot-holder or by hand with the phone voice, which rings when the cut falls to the player | `voltage_outcome`, `wendell_outcome`, `gallery_camera_blinded` |
| C7 | Asante | information | the default server hall (no Mercer) | server hall | optional | `asante_outcome`, `asante_confirmed_sheet` |
| C8 | Arrested Victoria's line | dilemma | `m03_victoria_fate = arrested` | server hall, after flag 2 | optional, with a warned cost: one re-ring as the player leaves the hall, with HaX's warning; unanswered, Vos's secret is lost | `victoria_line_deal`, `vos_secret_known` |
| C9 | The console: kill a share, or trace one | dilemma on every save (kill Zero Day's, kill Ghost's buyers' where live, or let Zero Day's run and trace it) | every player | server-hall console, after flag 2 | optional: skipping it lets every live share go at the outer lock untraced, warned twice | `head_start_killed` |
| C10 | Close the backdoor | task | `m07_completed` and Austin not covered directly | server-hall console | optional: skipping it costs the partial release | `backdoor_closed` |
| C12 | The accusation (§5) | puzzle, with a moral cost for a wrong guess | every player not on `m09_sleeper_named` | any time after clue 1 | optional: no accusation means WREN acts at the core, said at the aside | `accused`, `officer_out`, `sleeper_caught`, `wrong_accusation` |
| C13 | The gallery (§3.5) | dilemma, two options at most per branch (none on arrested Victoria's branch when her secret is known: it is used automatically) | every player | gallery | forced: the outer lock is past the slot-holder | `victoria_gallery`, `vos_outcome` |
| C14 | The three exchanges (§6.3) | puzzle | every player | core | forced: the console's menu comes after the third | `exchange_1..3` |
| C15 | Stop it, or "Show me how it works" | gateway (the dilemma is Join's step 2) | every player | core | forced: the database menu waits on it | `console_choice`, `join_step` |
| C16 | The database (§6.5) | dilemma | every player who stops it | core | forced: step 5 waits on it | `database_outcome` |
| C17 | The end for him (§6.6) | dilemma | every player who secures or discloses | core | forced: the ending scene waits on it | `ending` |
| C18 | Kowalczyk's question | stance | a right face-to-face accusation; a line accusation (asked at 06:00); `m09_recruiter_offer = taken`, at the van window after the aside (M-07) | forward post | optional | `kowalczyk_answer` |
| – | The 06:00 walkabout | hub (not counted) | every ending that reaches 06:00 except the cold one | forward post | "[That's everyone.]" | none |

**16 choices** (milestone pass; was 17): nine dilemmas (C2, C4, C5, C6, C8, C9, C13, C16, C17; C4 is a stance on Ghost's kept and refused branches), one gateway (C15, whose dilemma is Join's step 2), two puzzles (C12, C14), two stances (C1, C18), one task (C10) and one piece of optional information (C7), plus the walkabout hub (three picks at most). Arakawa's call is no longer a choice (round 2): it stays as his line and his alibi. Numbering is kept so references stay stable; C3 is retired, and **C11 (kill the story) is retired with the media room** (orchestrator ruling, D-05). Every player meets C1, C2, C4, C5, C6, C9, C13, C14 and C15 (C9 can be skipped, at a warned cost; C13 has no menu on arrested Victoria's branch when her secret is known), and every player who doesn't join meets C16 and C17: ten forced decisions (C9 is the optional eleventh), five of them in the full scenes. A rich save makes about 18 picks in all (draft 1: about 25; before the milestone pass, about 19), with one decision after the talk in each Act 2 scene.

## 3. The five full scenes

### 3.1 The door: Nightshade

Forward post, straight after the private aside (arc §7.1). **Forced:** the breach at 02:30 opens on `door_scene_done`, flag 1 **and** the pair back (`pair_back`, which ends the pre-breach split, so the breach can't cut across Arakawa's call), in any order: the blast door is a story door, unlocked by HaX's `unlockDoor` mappings with `game_loaded` and failed-try catch-ups, and each early try gets a bark naming what is missing; HaX's short voiced call then carries Netherton's "Breach. Go." (S4-2; OT §4.1). Every branch sets `door_scene_done` on one explicit closing choice **at the table**, before the breach, so no branch can leave it unset. **Who holds the closing choice** (R2-03): on the three branches where Nightshade is at the table (shown, not shown, arrested) it is in **Nightshade's** conversation; on the silent branch he is in the van, and the tether question is in **Netherton's** conversation. **KO:** both holders are `koImmune` (Nightshade at the table and in the van, Netherton; RL §2.1), so a strike does nothing and the old `npc_ko` nets, the dropped override and the knocked-out-Netherton narrator line at 06:00 are gone (S5-8). *Default* below still marks the option a walk-past leaves. **Walk-away:** closing the scene before its closing choice leaves the breach shut, and talking to the same NPC again resumes at the closing choice; after a reload the knot re-enters on `door_scene_done`, never on saved ink position (OT §3). HaX's pointer to the scene is in SE §3.5. Netherton's m08 line, "If he burns you, it is on my signature", frames both triple-agent branches: whatever happens with Nightshade, Netherton signs for it, and says so.

**One question runs through all four branches: what is a traitor worth to you?** A witness, a map, a deal, or a second word.

**Kept, shown his file** (`m08_nightshade_triple_agent and m09_nightshade_shown_file`). He pays in full, marks the one wrong entry as Tesseract's lie, and hands over the override (the alarm panel), on both options. He has picked a side out loud, so the triple-agent channel is spent whatever the player decides (m09 MC §4.1: that is the price of sending the file). What is left is what happens to him:

| Option as the player sees it | Gain | Cost | Who says so first |
|---|---|---|---|
| [Stay at the post.] *(default)* | Nobody below sees him with SAFETYNET, so he stays safe and useful. At 06:00, on every ending that reaches it, one line from the post: "You left me where they couldn't see me. I'm still useful. That's rarer than you'd think." On the arrest ending he is also on the trial's witness list. | He never sees Tesseract; he asks once more, then lets it go. | Netherton: "Leave him here and nobody below sees him with us. He stays useful." |
| [Come with us. You can see his face.] | He is placed at the outer lock with Quintero (with a minder from the van team if Quintero is out), and the lock's manual release is his: he holds the lock against anyone coming up behind the player (§3.5). His look at Tesseract comes at the van window on arrest and surrender (§11 item 28). | Every guard below sees him with SAFETYNET: after tonight he is relocated under a new name ("Moved, and unreachable."), and he can't testify. | Netherton: "Take him down there and every guard in the place sees him with us. After tonight he gets a new name, and nobody reaches him again. Not even you." |

Sets `nightshade_taken_in`; the choice is the closing choice.

**Kept, not shown** (`m08_nightshade_triple_agent and not m09_nightshade_shown_file`). He pays warmly; one entry is wrong and he doesn't say so. His channel stays live on both options (he stays at the table, above ground; Netherton: "I'm keeping him. If he burns you twice, that's on my signature as well."). One decision, at the table:

- **The check** is the trust test (rule 1.2), and a puzzle: the player reads the payment and the m09 plans at the table (two readables, `payment_read` and `plans_read`; once both are read, Nightshade's ink offers the check; engine 37, RL §6), and the wrong entry doesn't match. HaX's pointer says "He's brought his payment. You've got Helena's plans." Checked, he smiles ("You read your homework.").
- **The closing choice**, whether or not the player checked:

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [We'll go by your map.] | His map has the refit: the tunnel post's shift change, so the post is empty when the player passes. | Every entry as he gave it, including the wrong one, unless the player checked: unchecked, the tunnel's inner door trips (arc §5.3: it locks from the security office side, the bunker and WREN are warned; the way round is the guard post's ladder up to the office's manual release, OT §4.3). Checked, the player takes that door the way the plans show, and the map is safe. | HaX: "He's only as right as the man who briefed him." |
| [Helena's plans will do.] *(default)* | Nothing he wrote is used: no tripwire. | The plans are from before the refit: the tunnel post is manned. HaX names it there: "Helena's plans didn't have him. Nightshade's would have." | Netherton: "The plans are good plans. They are old plans." |

For a player who checked, the map is better on every count: that is the reward for checking, not a dominated option (rule 1.1, puzzle). Sets `payment_checked`, `nightshade_map_used`, later `tripwire_tripped`.

**Arrested** (`m08_nightshade_arrested and not m08_nightshade_ko_before_fate`). Brought up in cuffs: "You said no deals. Netherton says otherwise tonight. I'd like to hear what you say."

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [No deals. I said it then.] (first, as the player's m08 answer) *(default)* | The player keeps their word. Nothing he wrote is used: no tripwire. He serves his full term (credits). At the lock, Quintero: "You turned him down twice. I'd have taken the deal. I'm glad you didn't." | Helena's old plans: the tunnel post is manned (HaX names it, as above). No ENTROPY-habits line: clue 2 stays to be found. | Netherton: "Without him you have Helena's plans. They are good plans. They are old plans." |
| [Name them. You'll get your deal.] | The refit's map, as above; his line on ENTROPY's habits, which replaces clue 2 (arc §8.3). | One entry is wrong (Tesseract lied to him too): unchecked, the tripwire. His sentence is reduced in the credits. | HaX: "He's only as right as the man who briefed him." |

Sets `nightshade_deal` (`refused` / `taken`). On `m09_cage_bin = nightshade_copy`, one line from him on either option, on this branch **and on the kept-not-shown branch above** (the talking branches; not after the shown-file text): "You read what I cleared. Then you know I kept his notes." (m09 MC §3.1; FA row 107; MS-05. The arrested-branch help m09 once proposed is dropped.)

**Silent, or never played** (`m08_nightshade_ko_before_fate`, or `not m08_completed`). One word: "Door."

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Bring him up. Let's hear the second word.] | "Manual." and the hand crank: the blast door opens without telling the bunker 0x00 is in, and the tunnel post is off guard. | Arakawa walks him up and holds the blast door all night. **Whodunit running:** Kowalczyk breaches the rooms ahead alone and unwatched; she goes ahead from the security office, not the server hall, so the last face-to-face moment to accuse her comes a room earlier, and Arakawa can be accused only on the line. **Kowalczyk not on the team** (`m09_sleeper_named`, either form; arc §3 beat 1): Quintero breaches ahead instead, so she is not beside the player at the outer lock (her lock line and her secret are lost) and reaches the core late. | Netherton, whodunit running: "If he goes up, Arakawa goes with him and stays with him. Kowalczyk goes ahead on her own." Kowalczyk gone: "If he goes up, Arakawa stays with him, and Quintero breaches alone. You'll be at the lock without her." |
| [Leave him in the van.] *(default)* | Arakawa goes ahead, as planned (with Kowalczyk, or alone when she is gone). | The blast door announces the player by name: the tunnel post is waiting. | as above |

Sets `nightshade_tethered`. Held in Netherton's conversation (he is `koImmune`). When Quintero has breached ahead, the outer lock is held by a minder from the van team, and WREN's beat at the core (on the double-cross branch) uses the no-Quintero form (§6.4).

**The guard coin.** Of the night's choices, the door is one of three that pay in a guard (rule 1.3): every branch's cost or gain is the tunnel post, and HaX says whose doing it is.

### 3.2 The network: Ghost

The security office's duty handset rings as the player enters, and the call opens when they click it (arc §7.5; OT §4.2). **Forced:** the stair down to the workshop floor opens on `ghost_call_done`, set on the call's last choice. The kept branch's "east door" is now the **records cupboard** in the same office, a PIN lock whose code Ghost gives on the last line ("The cupboard on the west wall's yours when you've answered.") and which Vector's code or the cracker also opens; it holds the gallery rota that names the lock guard (S4-4, S5-1). The cupboard is optional and bypasses nothing, so S3-03's lock on it is no longer needed. Every code said on the call goes into the notepad as a notes item given by `#give_item` (`ghost_cupboard_code` on the kept branch, `ghost_lock_code` on the refused one's hospitals answer; F21, not `#add_note`). The refused branch's trust answer gives the lock guard's name aloud, with no item, and sets `lock_guard_known` (OT §4.2). The call follows the phone rule (rule 1.7). A phone can't be knocked out, so no KO net is needed. **First line sets** `ghost_sale` by branch (`stopped` on kept and refused, `selling` otherwise) and `ghost_gift = ""`. The question underneath: **what do you owe an enemy who kept their word, and what will you let one sell?**

**Deal kept** (`m02_ghost_deal_accepted and m02_exposed_hospital`). Ghost has refused to sell. "Did the board ever thank you?" A stance (rule 1.8): Ghost's outcome is fixed by character, and the answer comes back as Ghost's 06:00 text.

| Option | Ghost's text at 06:00 |
|---|---|
| [No. That wasn't why.] | "Neither was this. Clean exit." |
| [They sent a card. Unsigned.] | "Mine will be too. Clean exit." |
| [Ask them yourself.] | "I did. They didn't know who I was. Clean exit." |

Sets `ghost_answer`; the answer is the last choice, and the cupboard's code comes with it.

**Refused** (`m02_ghost_deal_refused`). The parley, and Ghost's question back: "You turned me down. Why?" One menu: the answer is a stance, and it also chooses the gift, which Ghost gives without asking ("Don't thank me. It's not for you."). Ghost doesn't sell on either.

| Answer | Ghost gives | Ghost's 06:00 text |
|---|---|---|
| [I don't buy from people who hold hospitals.] | "Then do this cleanly. Four digits." The outer lock's maintenance code, noted: the lock opens without a card, the cracker or anyone's help (§3.5). | "Clean. I noticed." |
| [I didn't trust you to keep it.] | "Then don't trust me. Check it." Which gallery guard carries the code card (the lock guard, by name, spoken; no notes item), a quiet way through the lock: the line sets `lock_guard_known`, and his own ink then has a Ghost option that gives the card (OT §4.2, §4.5). | "You checked. Most don't." |

Sets `ghost_answer`, `ghost_gift` (`code` / `card`). (Draft 2's change-over gift is replaced by the code in round 2, so the night's guard effects stay at three.)

**Deal broken, unanswered, stranger** (`m02_ghost_deal_accepted and not m02_exposed_hospital`; `m02_completed` and neither deal value; m02 never played). Ghost is selling the cells' head start on, as a leaving fee. Two ways to answer; closing the call is not an answer (it rings again), and there is no "[Hang up.]" button, because it would be the bait with nothing gained.

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| Talk Ghost out of it (the hook: does Ghost want to leave on a hospital's worst day?) | No sale: Ghost's share of the head start is gone, so the console's choice is between Zero Day's share and tracing it (§4 C9). Ghost leaves for good. | It takes the right argument. Money ("[I'll pay you more.]") and threats ("[We'll find you.]") are visible misses ("Numbers are my department." / "You won't."). On **broken** the hook works only after the player owns the broken deal ("[I didn't keep it. I'm asking anyway.]"); before that Ghost says "We said we'd be watching. We were." and nothing moves. | HaX, as it rings: "Ghost leaves when Ghost has been paid. Make it not worth it." |
| [Sell it, then. I want to see who's buying.] | SAFETYNET watches the sale. If the player then spends the console on Ghost's share (C9), the buyers have paid for nothing in plain view: "Five buyers, and we have their names." One cell in the cells ledger (§10). | The console does one thing, so baiting Ghost means choosing at the console between Ghost's buyers, Zero Day, and a trace; whatever isn't killed goes as the outer lock opens. | HaX: "Then you'll want the console for Ghost's share. It only does one." |

On **broken** with `m02_ghost_keys_used`, Ghost is inside the bunker's systems and watching: a text mid-scene, "Left at the stairs. I can see you, and so can they.", and on the workshop floor Imran has been warned to keep his card on him (no clone; talk, or the fitter's spare card from the security office). The cost lands on a person, not a camera (F-08). Sets `ghost_sale` (`stopped` / `bait`; `selling` is only the first line's default, and the locked stair means no run leaves the room with it).

Every option on every branch reaches a last choice, so `ghost_call_done` is always set.

### 3.3 The workshop: Gary or Imran

Workshop floor (arc §7.2). **Forced** by the power-room door, which opens to a talked-round technician, Gary on the unprotected branch, a cloned card, or the shift fitter's spare card from the pickable locker back in the security office (S5-10: the no-talk route is a return trip that spends the lockpick; the workshop's old service hatch is gone). **Defaults:** the scene's first line, or the room's exit if nobody was spoken to, sets `imran_outcome = avoided` (and `gary_outcome = avoided` on the unprotected branch); a knock-out sets `ko` through `globalVarOnKO`. The question: **what do you do with someone who went over for a grievance that was fair?**

**Imran Siddiqui** (the default branch, and the protected branch with Gary beside him, who makes the argument with the player: "I trained him. He read my emails."). The argument is the casualty sheet above his own bench. Once he has listened, one decision:

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Go home. Keep your phone.] (talked round) | He opens the power-room door, names the bench log ("Names, not stores. Look at the log."), and rings a friend on the gallery shift to send her home. In the gallery her post is empty, her coat still on the chair, and a guard says it: "Where's Farah? She was on till six." She is safe in the credits. He walks out uncharged. | His phone, and the bench's supplier contact on it, leave with him: the front supplier isn't touched. | HaX: "Let him go and the phone goes with him. Keep him, and we get his supplier." |
| [I'm taking you in.] (taken in) | His card (cloned), the phone and his statement. HaX reads the supplier's last delivery off the phone at once: "A crate signed for at the service door on Tuesday. Raid-issue badge." That points at the service door tonight (a nudge for the whodunit, not a clue). The front supplier is named and raided by morning (a clause in Imran's credits line, "His supplier was raided by morning."; under the fixed cells rule it is not a ledger cell, §10), and the credits' Initiative line names how it recruits sacked hospital staff. | He is charged; no bench-log pointer; Farah stays on shift. | as above |

On the protected branch Gary reacts each way: "Good. That's how I'd want it done." / "*flatly* I'd hoped you'd ask him first." Talking round and taking in are each best on one count: kind and quick, or hard and thorough (draft 1's middle option, "phone taken", is folded into taking him in).

**Gary, unprotected and quiet** (`m02_completed and not m02_gary_protected and not m02_exposed_hospital`). Gary is on the floor; Imran follows whatever Gary does (`talked_round` → Imran `talked_round`, Farah goes home; `left_in_place` → Imran `card_cloned`; `taken_in` → Imran `taken_in`). Listening is the argument: the talk is three short beats, and a dismissive pick ("[Spare me the speech.]") closes it without a fight ("Then you're the board. Card's on my belt.").

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| Talk him round | He opens the power-room door and walks out with the team ("Seven warnings, nobody listened. You're listening now?"); a witness, not a defendant, in the credits. (Its exchange 3 record answer left the pool when pools were capped at two, §6.3.) | Time and the right picks; and he leaves the Initiative's books tonight. | HaX's m02 memory line comes first (SE §3.5). |
| Leave him where he is (clone his card) | Quick. Gary stays on the Initiative's payroll, shipping nothing, and SAFETYNET knows: "Still on their payroll. Still shipping nothing." in the credits (a later-season thread). | No witness, no record answer, and he stays inside with them. | HaX, as the player reaches his belt: "A man on their bench who ships nothing is worth something. Later." |
| [Cuff him.] | His statement, as Imran's above. | He is charged after three weeks of shipping nothing; Imran goes with him. | Gary: "Three weeks. I've not shipped a thing. Write that down." |

Sets `imran_outcome` (`talked_round` / `taken_in` / `card_cloned` / `ko` / `avoided`) and `gary_outcome` (`talked_round` / `left_in_place` / `taken_in` / `ko` / `avoided`, unprotected branch only).

### 3.4 The power room: Voltage or Wendell

Power room (arc §7.3). **Forced** by aim 3: the gallery's blast shutter is cut here, by the slot-holder or by hand. **The by-hand cut is rung, not looked for** (S4-15; OT §4.9): the phone voice rings when the cut falls to the player (Wendell worked round, or left without being told; a talk with escaped Voltage failing into a fight; Wendell or escaped Voltage knocked out), rings again on every entry to the power room while the shutter is live, and, where the voice is HaX, her hub topic "[Talk me through the shutter.]" carries the same knot as the last net. The isolator's text says so first: "A key switch and a breaker row. Whoever runs this room can cut it, or someone on the line can talk you through it." **Defaults:** the first line or the room's exit sets `voltage_outcome` / `wendell_outcome` to `avoided`; a knock-out sets `ko`. The question: **how far do you trust an enemy who has been useful, and what do you owe a bystander?**

**The gallery camera switch.** There is no camera system in the engine; the "camera" is a panel switch, an object that sets `gallery_camera_blinded`. In the gallery that global takes the guard off the monitor post, and he says why as he goes: "Camera's dead again. I'll go and look." The switch is one more choice inside the by-hand cut's ink, not an object of its own, so only the by-hand cut can throw it and nobody else's cut needs a rule to make it inert (F-07; S5-4, RL §6 item 46). This is the second of the night's three guard coins (rule 1.3).

**Voltage captured** (`m04_voltage_captured`). Placed at the power room after the breach, cuffed in front. He offers both options himself, which is the signposting: "Let me do it. It's quicker. Or do it yourself, and I'll tell you which one's the gallery camera."

| Option | Gain | Cost |
|---|---|---|
| [Your hands. Go on.] | A fast cut. He asks one thing for the inquiry ("Write down that I did it myself."), which the credits record: "Did tonight's switching himself, for us." (Its record answer left the pool, §6.3.) | The player watches him stand at a switch that could blind the raid's view of the gallery, and takes his word for it: "I could. Watch my hands." He doesn't. The gallery's monitor post stays manned. |
| [I'll do it. Talk me through it.] | The player works the old switchgear (a short switching task), and the camera switch with it. Voltage: "You're right not to trust me." | Slower and fiddlier; no inquiry ask, and no credits line in his own words. |

**Voltage escaped** (`m04_voltage_escaped`). He runs the room; Static beside him on `m04_static_left and not m04_static_left_alone`, else Wendell nervous at the far panel.

| Option | Gain | Cost |
|---|---|---|
| Prove the bypass was his (`m04_voltage_print_on_bypass` only): dust the refit's bypass panel with the fingerprint kit; the print lifted tonight matches the one lifted at Albion (S5-11; RL §2.5). Without the m04 print the panel gives "a clean print with nothing on file to match" | He stands down at once ("I'm not going to argue with my own thumb."); HaX: "I said it'd be waiting. It was." He cuts the shutter and goes out cuffed; his credits clause says he stood down on his own print. | none: the print is the reward for m04 (a puzzle solved earlier) |
| Talk him down with the corrected sheet (every escaped branch) | The same stand-down ("This one's wrong by a thousand."); his credits clause says he checked the sums. | Two right picks; a miss ("Don't tell me about sums.") leaves fight or the hand cut. |
| Fight | Quick, and the hand cut gives the camera switch. | Static, if present, fights too; Voltage is a knock-out in the credits. |

**Wendell Briggs, the default** (Voltage neither captured nor escaped). He thinks the servers belong to a data company.

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Tell him what the servers are for.] | He cuts the shutter himself ("Well. Which switch do you want."), and rings his old colleague Dale on the next shift, who stays home (credits: "Rang his mate Dale. Dale stayed home."). | The call goes out through the bunker's switchboard in the server hall: the hall knows the raid is coming. Asante won't show the schedule (C7 closes), or, on Mercer's branch, Mercer can't be drawn off the console (fight only). | The phone voice, in a text as the player first walks in, before Wendell's menu (OT §4.9): "He doesn't know. Tell him, and he'll want to warn somebody. Their switchboard will hear it." |
| Work round him | By hand with the phone voice, and the camera switch with it; Wendell never knows. | He is swept up at 06:00 with everyone else ("Do I still get paid for the week?"), and Dale walks into a raid at shift change: frightened, detained, released by morning (credits). | as above |

Draft 1's separate Dale menu is cut: the call is now what telling Wendell costs. Sets `voltage_outcome` (`his_hands` / `by_hand` / `stood_down_print` / `talked_down` / `fought` / `ko` / `avoided`), `wendell_outcome` (`told` / `worked_round` / `ko` / `avoided`), `gallery_camera_blinded`, and `server_hall_warned` on "told". The phone slot (Vance, else Elena, else HaX) changes the voice, not the options; it is unused when a captured Voltage is in the room (MS-07; FA row 44).

### 3.5 The gallery: Victoria or Vos, and arrested Victoria's line

The gallery is the room HaX can't reach (arc §7.4, §9.1). **Forced** by geography: a straight walkway, the outer lock at its east end with the core beyond, past whoever holds the slot (S5-16). The gallery stair opens only on flags 2 and 3 and the shutter cut, so nobody reaches this room without the console's chance (S4-11). **Defaults:** the slot scene's first line, or the room's exit if the player opens the lock past a slot-holder they never addressed, sets `victoria_gallery` / `vos_outcome` to `avoided`; a knock-out sets `ko`. Zero Day's share of the head start goes as the lock opens unless it was killed at the console (C9) or stopped here, so every decision here about it is in time, and the walkway's countdown object shows which share is still live (D-03, §12 display globals). The question: **justice for one person against harm to many, and what a turned asset is worth.**

**Two options per branch at most** (orchestrator ruling, D-04). The milestone pass cut recruited Victoria's "refuse" (left unanswered, `refused`, the default, keeps its old outcome), arrested Victoria's use-or-keep (the secret is used automatically) and Vos's talk-out. The room now holds about nine outcomes instead of fifteen.

**The ways through the outer lock**, a PIN keypad, five of them, each with its own payoff rather than the same one five times (M-04; S4-3, S5-2, S5-12, S4-20, S5-17, S5-18; OT §4.5):

- **The cracker while the lock guard isn't looking.** He walks the walkway, dwells at the stair end facing the slit windows, and his sight cone is drawn, so the player can see when the keypad is out of it. He challenges only at the keypad, never for crossing the walkway; cracked out of his cone, nothing happens; cracked inside it, he challenges as the cracker closes, with the door already open behind the player: a talk past him ("[Shift change. Netherton's orders.]", once) or a fight. No "window" bark: the drawn cone replaces it.
- **The keypad plate**, dusted: the four worn keys show, and the cracker finishes with time to spare. It needs nobody, and gives the fingerprint kit a use on every save.
- **The code card**, the quiet way. The lock guard carries it (dropped on a knock-out); his own ink gives it once he has been named to the player (escaped Victoria's "[Go.]", the gallery rota in the security office's records cupboard, Ghost's card gift, or Vos's deal; each sets `lock_guard_known`, and his ink has one option per route, OT §4.5); Vos holds his own copy and gives it on his deal. There is no pickpocketing. **The pointer**: the first try at the keypad gets the guard's line, "That takes the shift code. It's on my card, and it stays there.", which makes the rota's return trip open on every save.
- **From inside**: a Victoria who holds, or a Vos who stands aside, opens it.
- **Ghost's maintenance code**, typed from the notepad, which needs nobody at all.

A taken-in Nightshade isn't a way through: he holds the lock behind the player, so nothing comes up the walkway after them. On a trusted Victoria with the share live, the reinforcements never arrive while he holds it: one narrator line instead ("Boots on the stair, then Nightshade's voice on the intercom, and the boots stop."; S5-14).

**The release, said aloud** (S4-12). Whatever was live goes as the lock opens, whichever way opened it (one `outer_lock_open` global). HaX is jammed and the lock panel is easy to miss, so Tesseract's first line in the core says it by `head_start_out` ("Two cells have it. They'll waste it." / "Zero Day has it. You didn't stop that one." / "Someone's buyers have it. Not Zero Day's." / "Nothing went at four. You were thorough."), and HaX's first line on her return says it again ("Their head start went. Both shares." / "Zero Day's went." / "The resale went." / "Nothing went at the lock."). The player always learns what their console and gallery choices let through.

**What the gallery's people say** (F-01). HaX can't speak here, so each effect carried in from earlier gets one bark from a guard and no explanation: "Camera's dead again. I'll go and look." (the switch, §3.4); "Where's Farah? She was on till six." with her coat on an empty chair (Imran, §3.3); the lock guard's "Who gave out the code?" as the lock opens on a save where Ghost gave its code (§3.2; OT §4.5); Nightshade's voice on the lock's intercom, "Go on. I've got the door." (§3.1).

**HaX's last line before the jam** carries the one warning the gallery needs (D-22; milestone D-04), on recruited Victoria only: "Sterling goes with whoever's winning. Make sure it's us before you hand her anything. Show her the order, and she'll know we read Zero Day's mail." Arrested Victoria's use-or-keep warning is gone with the choice. The sweep line ("Netherton sweeps the whole place at six. Whoever you leave standing up there, he collects.") is said on every branch at the server hall's exit (arc §6.3), so the pre-jam line never carries more than one warning.

**Recruited** (`m03_victoria_fate = recruited`). She offers to open the outer lock. m03's "whether she stays turned is anyone's guess" is answered here, and the answer depends on the night: **she goes with whoever is winning** (F-03). If Zero Day's share is already dead (C9), Zero Day has nothing left to pay her, and she is SAFETYNET's; if it is live, she sells.

| Option | Gain | Cost |
|---|---|---|
| [Before you touch that lock. Zero Day's order has your name on it.] (confront) | The safe check. She holds ("Then you know I'm hedging. So is everyone."), opens the lock, and withdraws Zero Day's order. Her watch survives: a Victoria who held goes back to Zero Day as if she lost her nerve (§11 item 27). | She has seen what SAFETYNET reads. The tap on Zero Day's brokers goes quiet by morning (Netherton at 06:00: "The Zero Day tap went dark at five. She'll have sold that too."; one time for one event, MS-17). |
| [Open it.] (trust her) | If Zero Day's share is dead: the lock at once, and both her watch and the Zero Day tap survive: the best result, for the player who made sure we were winning. | If the share is live: she opens it and sells the raid. An alarm, reinforcements on the walkway (never arriving if Nightshade holds the lock, above), Zero Day's order stands, and she is gone back down the gallery stair at the walkway's west end, past the player; her watch is over. |

Unanswered (`refused`, the default on this branch, FA row 32: the player takes the lock another way without answering her) keeps what the cut "refuse" option bought: she is never handed anything, her watch and the tap both survive, and Zero Day's order stands unless the console killed it. It is a playstyle default, not a menu option.

**Escaped, with the m03 threat** (`escaped and m03_sterling_on_call_seen`; her own NPC copy, `victoria_threat`, with its own sprite; S5-15). A pistol held low, and her m03 threat in its shipped words (`m03_npc_victoria.ink:737`; MS-01): "My associates offered to deal with you. I said I'd do it myself. I still might." Then her terms: "If I walk out of here, I walk out owing nobody. Including you."

| Option | Gain | Cost |
|---|---|---|
| Talk her down (her own m03 words are the hook: "[You said you'd do it yourself. You haven't yet.]") | She lowers it, and chooses to owe the player one: she cancels Zero Day's order on her way out, back down the gallery stair past the player. | She is at large in the epilogue. A miss ("Don't analyse me.") raises the pistol, and only the knock-out is left. |
| Knock her out | She is held for the team and charged. | Zero Day's order stands (unless the console killed it). |

**Escaped, without the threat** (`escaped and not m03_sterling_on_call_seen`). Her trade: "I walk out. Zero Day's order goes away, and I tell you which of these two has the code card."

| Option | Gain | Cost |
|---|---|---|
| [Go.] | Zero Day's order withdrawn, and the guard with the code card named. With Zero Day's share already dead, only the guard's name. | She is at large. |
| [You're under arrest.] | She doesn't fight; cuffed to the rail; charged. | Zero Day's order stands; no guard named. |

Both escaped branches ask the same question two ways: justice for Victoria, or Zero Day's head start. A player who spent the console on killing Zero Day's share makes the arrest cheaper, and pays for it with the trace, or with Ghost's buyers on the bait branch (C9).

**Arrested** (`m03_victoria_fate = arrested`), part one: **her secure line** (C8). It rings in the server hall once flag 2 is in, so Vos's order is on the player's screen when she names him. It is the hall's one voice on the line (Asante or Mercer speak in person, which the one-voice rule doesn't count). **Optional, with a warned cost** (R2-12): if the player closes it or lets it ring, it rings once more as they approach the hall's exit to the gallery stair (still inside the server hall, so the jam isn't broken), with HaX: "Sterling's still on the line. She has something on Vos." After that it stops. It never rings into the gallery: if the player takes the gallery stair with the call unfinished, it is abandoned with its first-line defaults and `victoria_line_done` is set (S3-10), and the gallery plays Vos's own trade (below) with no secret to use. First line sets `victoria_line_deal = "no_deal"`. She gives Vos's secret first, as goodwill (the line that says it sets `vos_secret_known`; a resume starts at that line), then names her price:

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Deal. I'll tell them you helped.] | She keeps talking after tonight: Zero Day's UK book (a clause in her credits line, "Still talking."; under the fixed cells rule it is not a ledger cell, §10). | Her charge is reduced: the woman who sold St. Catherine's walks sooner. | Victoria: "A reduced charge, and you get the rest of my book. Or nothing, and you still have this." |
| [No deal. You gave it for free.] | She serves the full charge. | She stops at Vos; no book. | as above |

Part two, **the gallery**: Vos, face to face, with no menu (orchestrator ruling, D-04: the use-or-keep sub-decision is cut). With `vos_secret_known`, the player says it ("[Your second buyer. The one you skim from.]", a one-option line), and Vos withdraws Zero Day's order to keep the secret and stands aside from the lock ("Who told you that. No. Don't. I'm leaving."). The leverage is spent tonight; it doesn't burn the Zero Day tap (Vos learns that Victoria talked, not what SAFETYNET reads). `vos_secret_used` is set on that line. Netherton's "in a drawer" line is gone with the keep option.

If the call was abandoned (`vos_secret_known` false), Vos's default trade plays as written below.

**Victoria knocked out in m03, or never met** (`ko`, or `""`): **Pieter Vos** and his trade: "That guard has the code card. You can have it. My name stays off whatever you write tonight."

| Option | Gain | Cost |
|---|---|---|
| [Deal.] | The code card: the only quiet way on his branch. | His name is missing from the report: he walks free, unnamed, and the credits' Zero Day line leaves him out (the player's doing). Zero Day's order stands. |
| [No.] | He is named, and swept up at six. | The lock another way (the cracker out of the guard's cone, the dusted plate, the guard's own card); Zero Day's order stands. |

His talk-out is cut (D-04).

Sets `victoria_gallery` (`confronted` / `trusted` / `refused` (recruited branch default) / `talked_down` / `walked` / `arrested_here` / `ko` / `avoided`; the m03-arrested branch leaves it unset and records Vos alone), `vos_secret_used`, `vos_outcome` (`stood_aside` / `bought` / `refused` / `ko` / `avoided`), the display global `share_zero_day` where a gallery outcome stops the share, and, at the lock's unlock event, whether Zero Day's share was stopped (§12).

## 4. The smaller choices on the way

**C1, Quintero's objection** (stance; briefing, arc §3 beat 4). "For the record, I'd go in at noon tomorrow with twice the people." Netherton: "Noted, Agent Quintero. Twice now. The record also says six o'clock."

| Option | Paid back |
|---|---|
| [She's right. And we're going anyway.] (`quintero`) | At the outer lock: "You said I was right. Now we're both in." At 06:00, on the stretcher if hurt: "You backed me. I'll remember who did." |
| [The record says six. We go.] (`netherton`) | At the lock: "You picked the clock. Fair. It's still his door, and he's holding it open for us." At 06:00: "Next time, back the slow way. Once." |
| say nothing (`""`) | At the lock, her secret if asked (SE §3.4); at 06:00: "Shoulder. I've had worse from a door." |

Backing Quintero is also backing a suspect, a tell the player can't yet read. It changes nothing about the accusation's evidence.

**Arakawa's call** (gate, 02:10; no longer a choice, round 2). The call happens and is his alibi. He says the telescope unprompted as he hangs up: "She wants a telescope. I'm getting her a telescope." His credits clause is "Home for Saturday, with a telescope.", and if he is wrongly accused and recalled: "You heard me on the phone to her. Then you thought I'd do this?" No global.

**C7, Asante** (information; server hall, when Mercer isn't there). She will show the schedule if talked to, and, asked about the casualty sheet, confirms her correction ("I corrected his sums. He thanked me."), which gives the first rebuttal its decoded form without the CyberChef note (`asante_confirmed_sheet`). The curious player gains a sharper argument; nothing is lost by skipping her. On `server_hall_warned` (Wendell's call, §3.4) she won't talk. Her fate is playstyle (talk, knock out, or leave her at the console); she is arrested in the sweep unless knocked out, which costs a credits line. Default `asante_outcome = untouched`.

**C9, the console: kill a share, or trace one** (dilemma on every save; server hall, after flag 2). The console has time for one thing before the head start goes. HaX: "I can kill one feed, or follow one. Not both. Pick." Every live share goes **at one moment, the outer lock's unlock event**, which the story clock calls 04:00 (R2-13); "before four" and "as the lock opens" are the same beat on stage 4's countdown.

| Option | Gain | Cost |
|---|---|---|
| [Kill Zero Day's.] | Zero Day's share is dead: recruited Victoria is now safe to trust (§3.5), and escaped Victoria's arrest costs nothing. | No trace; on the bait branch, Ghost's buyers get their share. |
| [Kill Ghost's buyers'.] (bait branch only, where Ghost's share is still live) | Ghost's buyers get nothing, and have paid for nothing in plain view: the console's cell in the ledger, "the five buyers of the resale share" (§3.2, §10). | Zero Day's share goes at the lock unless the gallery stops it. |
| [Let it run. Trace who gets it.] (every save) | SAFETYNET follows Zero Day's share to the buyers: one cell in the ledger, and the order-book watch (operation 5, §6.5) gets names. At 06:00, on every ending that reaches it, Netherton says so: "We followed Zero Day's share. Four buyers, and one of them was careless." (R3-03; a player who killed the share doesn't hear it, and the silence is the kill's cost.) The database question in small: stop the harm, or let it happen and learn from it. | Zero Day's share goes out at the lock, unless the gallery stops it (then there is nothing to trace, and HaX says so: "She cancelled it. Nothing to follow."). On the bait branch, Ghost's buyers' share goes too. |

So the console always costs something, on every save, and the gallery's Zero Day stakes stay live for any player who traces (R2-01). Skipped, every live share goes untraced. HaX warns twice: after flag 2, and leaving the hall ("Fifteen minutes to their head start. That console's your last chance at it."). Sets `head_start_killed` (`zero_day` / `ghost` / `trace` / `""`) and the display globals `share_zero_day` / `share_resale` (§12). **A traced share stays `traced` at the lock** (S4-17): it goes out, but the core, the card and HaX can still tell it from a lost one, and the screens read "OUT, TRACED". The console needs flag 2: **flag 2's reward is an `emit_event` (`flag_2_in`), and HaX's mapping on it sets `flag2_submitted`**, as for every flag (S4-21; OT §3); before it, the controls read "Locked to the staging copy."

**The state is visible** (D-03). From flag 2, every countdown object shows the two shares, "ZERO DAY: LIVE / STOPPED / TRACED" and "SECOND BUYER: LIVE / STOPPED / NONE", read from the display globals (RELEASED, or OUT, TRACED, after the lock); and HaX's hub has a topic, "[What's still live?]", until the jam, which says each share's state and what can still stop it, and after the lock becomes "[What went out?]". The player can see before the gallery whether trusting a recruited Victoria is safe. Object text reading a global works today (`observationVariants` / `textVariants`; OT §6).

**C10, the backdoor** (task; server hall, after flag 2). One action, free; skipped, its queued batch goes at "Stop it" (the partial release). The first planned cut (arc §2).

**C11, the media room: retired** (milestone pass; orchestrator ruling, D-05). The media room is cut. What is left is a prop and a HaX line in the server hall (arc §6.4; FA row 84): the draft, naming the player on `m05_entropy_program_exposed`. On uncovered Fracture Social Fabric runs it from outside as the raid starts, with no task to stop it (a cost line at 06:00); otherwise it is held. On the executed ending a new version goes out on every branch (§8.3).

## 5. The whodunit accusation

A puzzle with a moral cost. Off whenever m09 named WREN (`m09_sleeper_named`; the two forms keyed on `m09_recruiter_offer`, `double_crossed` checked first, MS-03): on `taken` she is cuffed at the briefing (`sleeper_caught` true from the start), and she still asks "When did you know?" at the van window after the aside (C18, M-07); on `double_crossed` she was warned and is gone, and waits at the core (below, and §6.4). Otherwise **optional**, any time after clue 1, face to face when the accused is in the room and on the line to HaX otherwise (arc §8.4). The question is **loyalty to the people beside you**: accusing a colleague costs that colleague's job tonight if the player is wrong, and not accusing costs a colleague's shoulder if they're right to suspect.

**In the objectives** (S4-19; OT §2): the optional aim "Find The Sleeper" is story-gated by the local `whodunit_open`, opened when the private aside ends and never on the named or double-cross branches (`whodunit_live` false there), so the aim can't reveal itself on a closed save. Its tasks are the clues and "Name the sleeper, or decide not to"; an untaken accusation completes at the core, so the aim always closes.

**Signposting.** At the private aside Netherton adds one sentence to his "and neither will you": "Whoever it is wants the same room you do. Find them before you get there." HaX's nudge after each clue says what she can see and never a name; after the third: "That's three things that point somewhere. Your call, and you don't have to make it." The accusation is reached through the HaX hub ("[I know who WREN is.]"), then the team members on tonight's raid, then one confirmation: "[Yes. Them.]" / "[Not yet.]".

| Option | Gain | Cost |
|---|---|---|
| Accuse Kowalczyk, face to face | The four-card scene (arc §8.4) and her question, "When did you know?" (C18). She is held at the forward post; nobody comes through the service door at the core. | none, if right |
| Accuse Kowalczyk, on the line | Quintero takes her at the service door (`sleeper_caught`); she asks her question at 06:00 instead. | No face-to-face scene. With Quintero out, nobody can be sent: WREN reaches the core and the player stops her there (still `sleeper_caught`). |
| Accuse an innocent officer | none | The officer is led back with a line that is also a hint (SE §3.4), and their job goes until recalled (arc §8.4): Malhotra, HaX's relay goes with him: her voiced call as the gallery stair opens breaks up after the warning she owes, so the sweep line and the next door are lost (OT §4.4 wires it as one ink branch; the jam itself still starts in the gallery); Arakawa, the county road (the sheriff reopens it without his liaison, and Netherton says so on the net, "Sheriff's asking who the road's closed for. I've told him to wait.", with no deputy NPC; on the tether branch the blast door is held by the van team instead); Quintero, nobody but the player at the core; Vector or Phantom, the shared cost: their job at the forward post goes, with one line from Netherton ("Then I am a pair of hands short. Carry on."), and no bespoke room effect (round 2). `wrong_accusation` stays true even after a recall. |
| Recall the officer | Their job returns from the next room; Netherton over HaX's channel ("Officer Malhotra, you are cleared. Come back, and leave the face at the van."). | Available only once the player holds the evidence that clears them; the wrong call stays on the record and in the credits ("Recalled."). |
| Accuse nobody | The player never points at a friend. | WREN acts at the core: she comes through the service door for the key, and Quintero is wounded stopping her (a shoulder), unless the Alpha tapes warned HaX (§6.4), or the player stops her if Quintero is out. |

**One wrong accusation at a time** (simplification 6). While an officer is out, HaX refuses a second accusation of anyone else until the first is recalled ("Get Malhotra back first."); the right accusation is always accepted. So `officer_out` is one name or `""`, and the per-room staging has one officer missing at most.

**Knock-outs.** A knock-out is never an accusation (arc §8.4). Each knockable raid member has `globalVarOnKO` writing `<name>_ko` (`kowalczyk_ko`, `quintero_ko`, `arakawa_ko`, `vector_ko`, `phantom_ko`); a downed officer is held at the forward post and costs an epilogue line. Malhotra runs comms from the van and is `koImmune` (RL §2.1), so he has no KO global (`malhotra_ko` dropped at the stages 4–5 milestone fix, F-09). A knocked-out Kowalczyk can't act at the core; if she is never named, `sleeper_caught` stays false and the epilogue says so. A held officer can still be accused on the line.

**The double-cross branch** (`m09_recruiter_offer = double_crossed`; m09 MC §3.2). The player took the Recruiter's name in Helena and then pulled her file anyway, so the Recruiter warned WREN, and Kowalczyk walked off the apron in Helena (m09 MC §4.7). In m10 there is no whodunit and no sleeper on the team: the briefing has an empty place at the table and Netherton's one line ("Kowalczyk walked off the apron in Helena. We know where she has gone."); Arakawa breaches alone, or Quintero if Arakawa is at the blast door (§3.1). She is at the core with Tesseract when the player arrives (§6.4). C12 and C18 don't exist on this branch; `sleeper_caught` is set by what happens at the core.

**C18, Kowalczyk's question** ("When did you know?"; stance), after a right accusation, paid back by her reply at 06:00:

| Answer | Her reply |
|---|---|
| [At the bench log. Then your name on the case's sheet.] | "The paperwork. It's always the paperwork." |
| [At the briefing. You laughed too easily.] (a bluff; the player may say it whether or not it is true) | "*almost laughs* No, you didn't. But thank you." |
| [I didn't. I worked it out.] | "That's worse. That means I was good." |

Then, as SE §3.3 has it: "I liked you. I'd still have pressed it." `kowalczyk_answer`.

## 6. The core

### 6.1 Arrival and flag 4

No decision here, on purpose: the player works flag 4 while he watches (arc §9.3 step 0). Two things the core sets up for the choices to come:

- **HaX's one fact about the console** (said as flag 4 lands, on every branch, after her notice lines; all her flag 4 lines are her second-speaker lines inside his conversation, which his own mapping opens on `flag4_submitted`, OT §4.6 step 4, so no phone call can cut it): "I've got his box. If anything goes out from that console, I can try to kill the feed. Try." This is the signposting for the justified-lethal moment (§6.6): the player knows a fallback exists and that it isn't certain.
- **HaX on the purge**, the same beat: "And the line into our vault is open from here. We left it open." Then: "He's rigged this room. If both copies die, it purges: doors, lights, all of it. He'll be ready for that. We won't." She says it again, shorter, at the database menu (§6.5).

The optional head-start question ("Two hours for people who'll waste it." / "Good. I never liked paying them.") is information only.

On `should_have_told`, HaX's unasked line ("My agent told me I sat on it. They were right. You never told me anything.") comes just before the third exchange's menu, as SE §2.3 has it, and opens the "She learned that from you." answer there.

**He can't be knocked out.** He is `koImmune` for the whole core scene (S4-8; RL §2.8; FA §4.1): the engine can't switch the key mid-scene and nothing needs it to. The knock-out fallback that stood here in draft 4 (an `npc_ko` writing `tesseract_ko`, the hand disarm, the database menu at the host terminal, a one-option "[Cuff him.]"; R2-02, R3-01, P48) is **withdrawn**. Every ending is reached through his conversation, by a pick.

### 6.2 His case and the Recruiter beat

No decision (arc §9.3 step 1; SE §2.2): the Publication, the offer every player hears, and his evidence (up to three record lines, m04 then m01 then m07, closing "Since your first day."). After his evidence comes **the Recruiter beat**, which gathers m09's two Recruiter exports in one place so neither crowds his evidence (D-08's cap of three stays):

1. **`m09_recruiter_secret`** (to HaX, on the open line): `kept`, his leverage and her "I'll deal with that when this is done."; `told` or `confessed`, she cuts him off at "Forty-seven names", "They told me. Next."; **`denied`** (m09's new value: the player told her the Recruiter was fishing), he gets the receipt out whole, and HaX hears the lie exposed in front of him: "You told me she was fishing." Nothing else; she doesn't look at the player again until the database menu, and at 06:00 her forty-seven line is a fixed beat before "the rest", outside the walkabout, as on `kept` (D-07; §8.2). `""`, nothing.
2. **`m09_recruiter_offer`** (to the player):
   - `taken` or `double_crossed`: **the invoice**, one ledger sting that decides nothing: "You bought WREN from my Recruiter. You understand costing." (FA §13 item 33: confirmed.) On `double_crossed` he adds one glance at the service door she came in by (Quintero took her out by the lock side; MS-16).
   - `named` or `refused`: **the clean record** is the player's own answer under the second claim (§6.3), in m09's wording. If it is not on the player's menu (slot 4 taken by `m09_albion_notified`), he says it for them here instead: "My Recruiter offered you a name. You wouldn't buy it. I would have." It stings nothing and decides nothing.
   - `""`: nothing.

So an m09 player hears m09's Recruiter decision once at the core, either way round, and never twice.

**m09's two proposed Recruiter lines for m10** (m09 MC §3.2; R2-10): her 06:00 text on `double_crossed`, "I'll remember the shape of you.", is **taken** (it is already one of the two unvoiced texts at 06:00, §8.2). The card line "About half of them. She warned the rest." is **not taken for the card**, which is five lines and already carries the cells; it goes into "Elsewhere" as the Recruiter's network clause on `double_crossed` (§10).

### 6.3 The three exchanges

A puzzle (rule 1.12): only an answer that meets the claim lands. **Forced:** the console's menu comes only after the third exchange. Each exchange is one pick from four fixed slots (SE §2.3): the mission's rebuttal, an evidence decoy, and two record slots, with a plain decoy in the first empty record slot. Each pick writes `exchange_n` (`rebuttal` / `record` / `miss`) once; a resumed or replayed exchange rewrites the same value, never adds (rule 1.11). **`points_landed` is derived** from the three values when step 5 opens (the number that are `rebuttal` or `record`), not counted as they land.

This is where the season is felt in the argument: **the player answers him with what they found tonight, or with what they did in earlier missions.** The rebuttal is always on the menu, so surrender is open to every player; the record answers let a player use their own history.

**What two or more points buy, and what fewer buy** (said before step 5; §6.6): two or more, he stands with his hands empty and offers cooperation; fewer, he stays seated and the arrest has a dangerous moment in it. Neither is a failure: every count reaches a success ending, and fewer than two is the only way to the justified-lethal one.

**Which record answers show** (two at most per exchange). Draft 0's lists put the generic m09 answers first, so on any m09 save some of the player's own choices could never appear. Each record slot now has its own pool, most specific first, and **no pool holds more than two candidates** (orchestrator ruling, milestone simplification 3; exchange 3's slot 4 had five):

| Exchange | Record slot 3 (slot 2 in exchange 3) | Record slot 4 |
|---|---|---|
| 1. "The cost is acceptable." | `m07_debrief_stance = hardened` > the clean first day (with `m01_completed`, no m01 KOs, no `m02_patient_assaulted`, and `ko_pattern() == 0`) | `m02_bed4_manually_stabilised` > Derek's file (`m09_cage_bin = derek_file`) |
| 2. "Services like yours hoard." | earlier missions: `m04_disclosure_choice = full` > `m02_exposed_hospital` | Helena: `m09_albion_notified` > the clean record (`m09_recruiter_offer` `named` or `refused`; if hidden, he says it in the Recruiter beat, §6.2) |
| 3. "Better me, with clean hands." | HaX: "[HaX. You're on speaker.]" (`same_in_your_place` or `afterwards`) or "[She learned that from you.]" (`should_have_told`) | the Tomb Alpha notes (`m09_deck_pulled = alpha_tapes`) > HaX's meaning of the line (`m09_completed`), as the fallback |

Exchange 3's slot 2 is one candidate per `m09_hax_confession_answer` value, so it counts as one pool. Slot 4 follows FA §4.1 (the arc-keeper's call in the same pass). Three answers leave it, and each keeps another home: "Your file says I press it" (`m09_reading_finished`) keeps "Then I was wrong about one thing." after "Stop it" (§6.4); Voltage's three forms and a technician talked round keep their credits clauses, and their scenes keep a gain on each option without them (§3.3, §3.4). Exchange 1's clean first day also needs `ko_pattern() == 0` (F16, FA §3.6).

**The knock-out pattern** (F16; FA §3.6; D-06). `ko_pattern()`, one function in `m10_carryover_vars.ink`, counts the earlier missions in which the player knocked out at least one bystander. It reads 27 names: twenty-two Tier 2 imports (F16's seventeen and m02's five staff latches from the stages 4–5 fold), plus m01's three latches, `m02_patient_assaulted` and `m04_robert_vance_ko` (FINALE_ARC §3.6). In exchange 3, whose claim is clean hands, he reads it back as a ledger sting before his response to whatever the player picks; it stings and decides nothing. Fixed strings by band: 1, "You put someone on the floor who wasn't armed. Once. I noticed."; 2–3, "More than once, you've put someone on the floor who wasn't armed. Clean hands, Agent?"; 4 or more, "Most of the operations I've watched, you put someone on the floor who wasn't armed. That isn't a lapse. It's a method."; 0, nothing.

The new answers:

> [You priced Derek Lawson before anyone hired him. You don't pay your costs. You hand them out.] (exchange 1, Derek's file; m09's wording) / Dr Adrian Tesseract: *pause* Derek paid it. I didn't.
>
> [Your Recruiter offered me a name. I wouldn't buy it from her.] (exchange 2, the clean record; m09's wording) / on `named`: "*pause* No. You'd rather the slow way. It worked." / on `refused`: "*pause* No. You let her keep her people sooner than pay her. I didn't think your service still did that."

(Voltage's three answers and the technician's, added at stage 3, are retired with the cap.) Ledger answers (`m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`, and the knock-out pattern in exchange 3) still sting first and decide nothing (SE §2.1). Record answers placed under the wrong claim are decoys, after slot 4 (R4-05). The rebuttal's position rule (2nd, 1st, 3rd on a cold start) is unchanged, because only the order inside slot pools moves.

### 6.4 The console

**Forced:** the database menu waits on it. After the third exchange, his hand still by the key. A dilemma, and the door to Join.

| Option | Gain | Cost |
|---|---|---|
| [Stop it.] | The disarm goes through; he doesn't fight it ("Then we do it the slow way. In court. I've a lot to say."; on `m09_reading_finished`, "Then I was wrong about one thing.", or, when m09's fifth note guessed the player's bin wrong (`m09_reading_finished and m09_cage_bin != derek_file`), "Then I was wrong about two things."). | Any open backdoor channel releases its queued batch now, the partial release (Seattle first, on `m07_countdown_expired`). The player hears it as it happens, so a skipped C10 is felt here. |
| [Show me how it works.] | He shows the key; the player learns exactly what it does, from the man who built it, and can still stop it. | It is step 1 of Join (§6.7). The next menu always has "[Step back.]" and "[Stop it.]". |

`console_choice = stopped` is written on "Stop it"; `joined` only on the key's confirmation (§6.7). `partial_release` is set on "Stop it" (`none` / `small` / `large`, FA §4.2).

**WREN, if free** (not caught, not knocked out, not on the double-cross branch; the double-cross is checked first, then `taken` via `sleeper_caught`, MS-03): as the player reaches for the console to stop it, the service door she propped opens and she comes through for the key. **He refuses her**, every time, because it is his motive in his own mouth: "Not you, Halina. When they find out what you are, it proves nothing. It has to be one of theirs." She says one word, "Adrian.", and tries anyway. Then, by branch:

- **Default:** Quintero comes in from the lock at the noise and is wounded stopping her (a shoulder; she's talking at 06:00). `quintero_wounded` true.
- **On `m09_deck_pulled = alpha_tapes`** (m09 MC §9 item 25): HaX knows his habits from the tapes and warns as the player reaches the console: "Service door. He always builds his own way out first." The beat runs the same, refusal included, but Quintero, warned, is already moving and takes her **after** his refusal and before she touches the key, unhurt. This is the Alpha tapes' second payoff (the clip is voiced, F12).
- **With no Quintero** (held, knocked out, sent on a line accusation, or wrongly accused and not recalled): the player stops her with a one-option beat, "[Stop her.]" (an ink beat, not a knock-out: it sets `wren_stopped`, and her copy, `kowalczyk_core`, hides itself on that global; S5-5, RL §6 item 40); on `alpha_tapes` HaX's warning goes to the player, and the beat comes a second earlier.

The disarm goes through in every case, so she can never press the key. Being stopped at the core is not an accusation: `sleeper_caught` stays as it was (false, unless she had been named on the line), and `wren_at_core` is true. She never comes while the player is on the Join path, and comes as normal if the player steps back from it and then stops the release (FA §13 item 29).

**WREN caught**: he glances at the service door. Nobody comes. "You found her. I wondered whether you would."

**The double-cross branch** (`m09_recruiter_offer = double_crossed`; §5). Kowalczyk is in the core when the player walks in, standing by the service door, unarmed, the cracker's twin on her belt. The refusal has already happened, and the player arrives on the end of it: he is saying "...it proves nothing. It has to be one of theirs." and she is saying "Adrian." HaX, at once: "Quintero. Core. Now." Quintero comes in from the lock and takes her, unhurt; Kowalczyk doesn't fight and says one thing to the player on her way out: "She told me you'd break it. The Recruiter. She was right about you." No choice: the double-cross was the choice, made in Helena. `sleeper_caught` true, `wren_at_core` true. Then step 0 runs as normal: he has the player to himself, as he wanted. With no Quintero (knocked out), the player takes her with a one-option beat. **Nobody is wounded at the core on this branch** (orchestrator ruling): a known face, waiting in plain view, can't come through a door at the key. That is the double-cross's one concrete gain in m10, set against what it cost in Helena (the name's use, half her network, the player's word): `quintero_wounded` is false, and at 06:00 Quintero is on her feet.

### 6.5 The database

**Forced:** step 5 waits on it; needs flag 4 (always in by now). The finale's teaching spine as one menu: **keep the map, give it to the people who can fix it, or burn every copy.** Netherton comes on the line ("Magnus." / "Adrian."), and each option's case and cost are said before the menu opens, by the person with a reason to say them. Each option has a cost to strangers, not only to the service, so the player weighs harms, not the service against the public (F-04).

**The operations at stake.** Disclosure burns two live operations; securing keeps them, and the first pays off before the credits. Netherton names the two by this priority, the first two that apply:

1. The watch on a recruited Victoria: `m03_victoria_fate = recruited` and `victoria_gallery` is `confronted`, `refused` (the unanswered default, which keeps the cut "refuse" option's outcome), or `trusted` while Zero Day's share was dead at the lock (the same test `head_start_out` uses, §12). Every branch that keeps her watch is on the list (MS-02; §3.5).
2. Nightshade's channel (`m08_nightshade_triple_agent and not m09_nightshade_shown_file`, §3.1).
3. The HashChain tags (`m06_monitoring_enabled`).
4. The Critical Mass watch (`m09_completed and not m09_albion_notified`; sending the notice in m09 burned it, m09 MC §3.5), named by m04's branch as m09 names it: "the watch on Voltage's people" (`m04_voltage_escaped`), "what's left of his crew" (`m04_voltage_captured`), "the Critical Mass watch" otherwise.
5. **The watch on the early-access order book**: everyone who ordered the cells' head start, read off flag 2's schedule. Every player reaches flag 2, so this applies on every save, whatever Ghost did (on the bait branch, where the console killed Ghost's share, the five who paid Ghost are already caught; the watch follows the rest of the book).
6. The tap on Zero Day's brokers (unless a confronted Victoria burned it, §3.5).

There are always at least two: 5 always applies, and 6 is gone only when 1 applies. A cold start hears exactly 5 and 6.

**What the player hears before the menu**, in this order:

- Netherton, for secure, because it is his argument to make: "Half of these can't be patched this year. The water controllers can't be patched at all. Send those out and every buyer knows where to hit. Nobody can stop them."
- HaX, the cost of secure: "Infusion pumps in a hundred and forty hospitals. The one he used on you. Still live next year if we do this."
- Netherton, the cost of disclose, and why (R2-08; the same reason m09 gives for its watch going dark): "Two operations go dark if you do this: [the two names]. Both of them run through holes on that list. Patch the holes and we lose the way in. I will sign it." Each operation rides a listed flaw: Victoria's watch a broker's compromised mail server, Nightshade's channel a compromised vendor portal, the HashChain tags a flaw in the exchange's ledger software, the Critical Mass watch the Albion vendor's equipment, the order-book watch and the Zero Day tap the platforms the buyers trade on.
- HaX names the player's middle option by its real name, so the practice is named before the menu and can't be confused with the Publication (D-02; Netherton's full-disclosure line is at the briefing, arc §3 beat 2): "That's coordinated disclosure. The vendors first, quietly, with time to fix it."
- HaX, how disclose treats the ones that can't be fixed (R2-06): "The ones nobody can patch go to the operators, with workarounds. Not into a public list." On `m09_albion_notified`, HaX: "You burned the Critical Mass watch for one letter. This is that letter, a thousand times."
- HaX, the cost of wipe, plainly, with the menu open (F-06): "If both copies die, this room purges itself. Doors, lights, everything. You won't have him after." Netherton: "Then nobody has it. Not him, not us. Nobody fixes anything either. We both answer for it."

| Option, as the player sees it | Gain | Cost |
|---|---|---|
| [Secure it. Their copy's evidence. Ours stays in the vault.] | The flaws nobody can fix yet stay out of buyers' hands. Both named operations keep running, and the first rolls up its named cell before the credits (the fixed cells rule, §10). | The hoard stands: the pumps stay live, and the card says so ("Infusion pumps in 140 hospitals: still unpatched."). He was right about the service, and the player's hand proved it. |
| [Coordinated disclosure. Wipe theirs, and send ours to the vendors, on a schedule.] (D-02: the practice named on the button) | Coordinated disclosure, at its true speed (F-05; the same timescale m09 uses for the notice): acknowledgements tonight, fixes in about ninety days, a year before most are fitted. At 06:00 HaX reads the acknowledgements: "Forty vendors have acknowledged. Patch windows, ninety days. It'll be a year before most of them are fitted." The pumps' vendor has a date. On Austin-uncovered saves, the dispatch vendor ships a workaround within days and the fix on the same ninety-day window (§10). | Both named operations go dark on screen at 06:00 ("He's been moved. I can't reach him." / "The tags dropped at five past."). And one public cost, the honest one: the operators were told, there is no fix, so they run by hand. HaX, at 06:00: "Three water utilities went to manual at five. There's no patch for their controllers. They'll turn the valves by hand till spring." |
| [Wipe both. Theirs and ours.] | Nobody holds the map: not him, not the cells' customers, not the service. It is the one outcome his argument can't win. At 06:00 the gain is shown, in one line on every save, crediting only the wipe (R2-07): Netherton, "Nobody holds the map now. Not him, not the buyers, not whoever sits in my chair next." | Nothing is fixed: every flaw is still out there, unmapped. The core purges itself and he goes in the dark by the service door (§8.1). The end-for-him choice is gone, as HaX said. The player is suspended. |

None is best on every count: secure buys safety from the unfixable and two operations at the price of the hoard; disclose buys fixes, over months, at the price of two operations and a bad morning for three utilities; wipe buys a world where nobody holds the map, at the price of the fixes, the man, and the player's badge. `database_outcome` (`secured` / `disclosed` / `both_wiped`; `published` on Join).

HaX, if asked to choose (a fourth option, "[HaX. What would you do?]", which returns to the menu): "No. This one's yours. If I choose, I'll choose for the wrong reasons." Netherton makes secure's case and says each cost; he states no preference.

### 6.6 The end for him

**Forced:** the ending scene waits on it. Not offered after "wipe both". User decisions F11 (two lethal versions, each signposted) and F13 (surrender is a deal with no public trial; arrest is a public trial with no cells). The question: **justice, mercy, or revenge, and who gets to hear his case.** `points_landed` is derived here (§6.3).

**On `join_step >= 2`** (the player asked for the key, or reached its confirmation, then stepped away; §6.7), he opens step 5 with one line, whatever the points: "You held your hand out for it. I won't forget that."

**Two or more points.** He stands, hands empty: "Ask me, then." Netherton, on the line, says what each option means before the menu, in one breath: "If he cooperates, there is no trial. He gives us cells, and nobody hears his speech. Arrest him, and he makes it in open court."

| Option | Gain | Cost |
|---|---|---|
| [Then cooperate. All of it.] (`surrender`) | He types the cells' contact protocol into the bunker's terminal himself; two cells go into the ledger, always the cells' couriers and their quartermaster (§10). HaX sits with him in the van. | A deal for the man who priced 1,100 to 2,600 deaths: no public trial, and his argument is never tested in court. He warns the player: "They'll work out who you are by Thursday. Be careful." Credits: "Dr Adrian Tesseract. Cooperating. No trial." |
| [No deal. You're under arrest.] (`arrest`) | A public trial: his case is answered in open court, and nobody did a deal with him. HaX testifies. | No protocol, no cells: "He is in a cell. The cells are not." He gets the platform he wanted ("A trial. He will make speeches. Let him."). Credits: "Dr Adrian Tesseract. Awaiting trial." |
| [Shoot him where he stands.] | the cold choice, below | |

Justified lethal force is not on this menu: he has made no move (D-11, as reworded).

**Fewer than two points.** He stays seated: "Arrest me, then."

| Option | What happens |
|---|---|
| [You're under arrest.] | As the player moves: "His hand goes to the console. One key, and the first city's list goes out anyway." A two-option beat, no timer: |
| | **[Fire.]**: one narrated line ("His hand is on the key. You fire. He falls against the console before it's pressed."), `lethal`. Certain: nothing goes out. HaX: "I was a second behind you. Log it. I'll sign under you." |
| | **[Hold fire.]**: HaX kills the feed through the host the player controls, in time ("Got it. Feed's dead. Hold. He's done."). He looks at his hand, says "Ninety-nine.", and holds out his wrists: `arrest`. |
| [Shoot him where he sits.] | the cold choice, below |

The player chooses under uncertainty, with the only fact HaX gave them ("I can try to kill the feed. Try."). Holding fire always works; the player doesn't know that, and that is the point of the moment. Firing buys certainty, and an end with no trial, no platform and no deal; it costs a review board, and the cells go quiet behind a martyr. Holding fire buys a living prisoner and a trial, at the price of trusting someone else's hand. Neither is a trap.

**The cold choice** (both menus; FA §13 item 37: confirmed).

1. The button names the act and his posture: "[Shoot him where he sits.]" on fewer than two points, "[Shoot him where he stands.]" on two or more. It is always the last option. No other button in the scene uses "shoot"; the justified button is "[Fire.]" and appears only in the reach beat.
2. The narrator's warning, before any confirmation: "His hands are empty and in plain sight. He isn't moving. If you fire now, it's an execution, and HaX is on the line."
3. The confirmation: "[Do it.]" / "[Lower the weapon.]". Only "Do it." sets `ending = executed`.
4. "Lower the weapon." returns to the same menu without the cold option ("You lower it. He hasn't moved."), and sets `cold_lowered`, so the confirmation is final both ways (orchestrator ruling).

It cannot be reached by a misclick (two deliberate picks, one after a plain warning), a knock-out, the clock, a failed talk-down or any import. Points don't change it. Its weight is §8.3.

### 6.7 Join, step by step

The one non-success ending, chosen three times (FA §4.3; arc §9.4). Every player hears the offer in his case, so listening is never a step towards it. Each step offers the way back. The casualty figure is said once, at step 1 (M-07).

| Step | The player picks | What they are told first | Ways back offered |
|---|---|---|---|
| 1 | [Show me how it works.] (at the console, §6.4) | He: "It's a key. You press it. Everything I've told you happens." On 0–1 landed exchanges he adds "You couldn't answer me. Then let it be you."; on 2–3, colder, "You've beaten me. Now you want the key?" (M-11). Narrator: "Pressing it publishes the database to everyone, everywhere, in the same minute. Eleven hundred to twenty-six hundred people, the first month, by his own figure. You can still step back." | [Step back.] / [Stop it.] |
| 2 | [Give me the key.] | HaX: "0x00. Don't." Narrator: "If you take it, the mission ends here, and you work for ENTROPY." | [Step away.] / [Stop it.] |
| 3 | the release key, an ink choice in his conversation, then its own confirmation choice: "Publish the database to everyone, now?" (the key console is a prop; the engine's confirm action can't return into an open conversation; S5-3, RL §6 item 45) | the confirmation itself | [No.] returns to step 2's menu |

Only the key's confirmation sets `ending = joined`, `console_choice = joined` and `database_outcome = published`. He says, quietly, "Thank you, Agent." and nothing else. WREN never comes through on this path (§6.4).

**Stepping back is remembered** (`join_step`: 0–3, the furthest step reached; 3 means the player saw the key's confirmation and said no). Step 1 is curiosity and costs nothing. Asking for the key (`join_step >= 2`) is paid once, by his line at step 5 (§6.6), and nothing else. Nobody else mentions it; HaX heard it and says nothing, which the player will notice.

**What changes how it is offered, and only that**: the points (his step 1 line, above), `m01_player_launched_attack` (he makes the offer to that player first and most directly) and `m06_satoshi_stance`, which has three values in m06 (`m06_satoshi_confrontation.ink:540–551`; MS-14): `wondered` ("Sometimes. But I chose my side.") warmer; `rejected` ("No. Your ideology doesn't cover murder.", a reasoned no) its own line, neither warm nor cold; `refused` ("I'm not debating this with you.") colder, with "You told him no without thinking." Satoshi asked his question before the police came, not in cuffs. The signposting never changes.

## 7. Imported decisions and the never-played defaults

How each earlier decision changes a choice in m10: which branch the player meets, which options their menu holds, or what an option costs. Imports never gate (rule 1.6). Lines-only imports that change no choice (wall-card style lines, epilogue clauses) are in FA §3.2 and §10 here, not repeated. The "default" column is what a player who never played that mission meets; it matches FA §3's never-played canon.

| From | Import | The choice it changes, and how | Default (never played) |
|---|---|---|---|
| m01 | `final_choice` | none directly; his evidence's second line (SE §2.2) | the arrest line |
| m01 | `maya_ko`, `kevin_ko`, `sarah_ko` (with `m01_completed`) | removes or keeps the clean-first-day answer in exchange 1 | no clean-first-day answer |
| m01–m08 | the bystander knock-out latches (27 names, FA §3.6), read only through `ko_pattern()` | Tesseract's exchange 3 ledger sting by band; the clean first day also needs `ko_pattern() == 0` | `0`: no sting |
| m08 | `named_on_evidence` (M-12) | none; HaX's aside line when the whodunit runs | no line |
| m01 | `player_launched_attack` | how directly Join is offered (§6.7); nothing else | the plain offer |
| m02 | `ghost_deal_accepted`, `exposed_hospital`, `ghost_deal_refused`, `completed` | which Ghost branch (§3.2): a stance and a door, a gift, or the sale to argue down or bait | stranger: the sale |
| m02 | `ghost_keys_used` | on the broken branch, Ghost's text, and Imran keeps his card on him (no clone; talk, or the fitter's spare card) | none |
| m02 | `gary_protected`, `exposed_hospital` (with `m02_completed`) | which workshop branch (§3.3), and Imran's grievance line | Imran alone |
| m02 | `exposed_hospital` | adds the St. Catherine's answer to exchange 2 | none |
| m02 | `bed4_manually_stabilised` / `patient_bed4_deceased` | adds an exchange 1 answer / a ledger sting | neither |
| m02 | `patient_assaulted` | removes the clean-first-day answer | kept, if m01 allows |
| m03 | `victoria_fate`, `sterling_on_call_seen` | which gallery branch (§3.5), and whether there is a server-hall call (C8) | Vos and his trade |
| m03 | `guard_bribed` | a line in the lull; no choice | none |
| m04 | `voltage_captured`, `voltage_escaped`, `voltage_print_on_bypass`, `static_left`, `static_left_alone` | which power-room branch (§3.4); whether the print option exists; Static as one more hostile; the name Netherton gives the Critical Mass watch (§6.5) | Wendell and a phone voice |
| m04 | `vance_is_ally`, (m07) `elena_outcome` | the phone voice in the power room, unused when a captured Voltage is in the room (MS-07); not the options | HaX |
| m04 | `disclosure_choice` | his evidence's first line; the strongest exchange 2 answer on `full` | his Albion default line; no answer |
| m04 | `crew_lost` | a ledger sting in exchange 2 if the player argues from Albion | none |
| m05 | `entropy_program_exposed` | no choice since C11 is retired: the server hall's story names SAFETYNET and the player, where it runs (uncovered Fracture) and on the executed ending | the story names nobody |
| m05 | `recruiter_deal_*`, `found_pipeline_list`, `final_choice`, `elena_treatment_funded` | none; the close (§10) | the never-played clauses |
| m06 | `assets_seized` | two empty posts and the fence gap (visual only, HaX names it; RL §2.1); the $12.8M at 06:00 (§11 item 35) | full staffing; no $12.8M line |
| m06 | `monitoring_enabled` | adds the HashChain tags to the operations the database choice keeps or burns (§6.5) | not on the list |
| m06 | `satoshi_stance` (`wondered` / `rejected` / `refused`; MS-14) | Join's warmth (§6.7: one line per value); a ledger sting | neutral |
| m07 | `team_assignment`, `team_redirected` (with `m07_completed`) | whether C10 (the backdoor) exists, and how big the partial release is if C10 is skipped; on Fracture uncovered, Social Fabric runs its story from outside (no choice; the media room and C11 are cut; the server hall holds the draft as a prop) | no backdoor; the draft held |
| m07 | `countdown_expired` | "Seattle first." at "Stop it"; no choice | none |
| m07 | `mercer_fate`, `mercer_ko` (with `m07_completed`) | Mercer replaces Asante: C7 becomes a fight or a sneak | Asante |
| m07 | `debrief_stance` | his evidence's third line; on `hardened`, the projection desk and an exchange 1 answer | his default line; no answer |
| m07 | `architect_echo_heard` | HaX's beat in exchange 3; no choice | none |
| m08 | `nightshade_triple_agent`, `nightshade_arrested`, `nightshade_ko_before_fate`, `completed` | which door branch (§3.1) | silent: the tether |
| m08 | `accused_*`, `*_apologised`, `*_hostile` (with `m08_completed`) | whether Vector and Phantom are on the team: two more suspects, two more people a wrong accusation can cost, Vector's door, Phantom's list | the four-person team |
| m09 | `nightshade_shown_file` | on the triple-agent branch: shown, his channel is spent and the choice is his safety against his look at Tesseract; held, the payment check and cuff-or-leave, with his channel live (§3.1, §6.5) | (no triple agent without m08) |
| m09 | `sleeper_named` (read with `recruiter_offer`, MS-03) | removes C12: the whodunit is off; C18 stays on `taken` (at the van window, M-07) and goes on `double_crossed` | the whodunit runs |
| m09 | `sleeper_shortlist` | a helper for C12 (replaces clue 2) | none |
| m09 | `recruiter_offer` (Tier 1 now) | the Recruiter beat (§6.2) and the clean-record answer in exchange 2; on `double_crossed`, WREN is off the team, no whodunit, and she waits at the core, where nobody is wounded (§5, §6.4): a presence, so Tier 1. On `named`, Netherton's aside (her tape is by codename only; the arrests start at six, D-01). One "Elsewhere" clause per value (§10; MS-04) | nothing |
| m09 | `recruiter_secret` | HaX's exchange with him (§6.2), including `denied` ("You told me she was fishing."); her fixed 06:00 beat on `kept` or `denied`, before "the rest" and outside the walkabout (D-07); on `told`, a clause in the player's own credits line | nothing |
| m09 | `albion_notified` | an exchange 2 answer; HaX's line before the database choice | none; HaX reads the notice off his box |
| m09 | `hax_confession_answer` | the speaker answer or "She learned that from you." in exchange 3 | no HaX answer; a plain decoy |
| m09 | `deck_pulled` (Tier 1) | exchange 3's slot 4 pool, first (§6.3); HaX's blast-door line, "The best lock there is. Tape two."; on `alpha_tapes`, HaX's service-door warning, which spares Quintero (§6.4) | none |
| m09 | `reading_finished` | after "Stop it", "wrong about one thing" (or "two things" with `cage_bin`); its exchange 3 record answer left the pool (§6.3) | none |
| m09 | `legacy_files_saved` (Tier 2) | no choice; its one "Elsewhere" clause (§10) | no clause |
| m09 | `albion_notified` (again) | whether the Critical Mass watch is on the database choice's list (§6.5) | not on the list |
| m09 | `cage_bin` | `derek_file`: an exchange 1 answer (§6.3); `letters`: a HaX line at the server hall's drafted story (arc §6.4); `nightshade_copy`: Nightshade's line at the door, on the not-shown and arrested branches (§3.1) | none |

**A player whose first mission is m10** meets: the door's tether choice, Ghost as a stranger, Imran alone, Wendell, Vos's trade, the default team of four, Asante, no backdoor, the drafted story held, and every core choice with the mission's own rebuttals. Every forced choice above is present on that save: the minimum is the full set of ten (§2), with no import set.

## 8. The ending matrix

### 8.1 How each ending is reached

`concludeRequires` is the four flags for all six (no story task in it). The ending is the global `ending`, set by one pick each, and nothing else sets it. **The conclusion waits on it** (S3-12): the conclusion aim's own task, `close_the_night`, is completed by the last closing scene's last line, which plays only once `ending` is set, so `/conclude` can never run with `ending` or `database_outcome` empty and the export snapshot is never blank (engine 47). **The closing chain** (S4-5; OT §4.7, §7; m08's order): the pick sets `ending`; the ending's own beat plays to its end inside his conversation; when that conversation closes, the closing scene's own hidden NPC opens the scene (`six_oclock` on arrest, surrender, `lethal`, `executed` and `scorched`; `citadel` on `joined`); on `scorched` the hearing chains off the 06:00 scene's end (`six_done`); the last scene's last line runs `close_the_night` and sets `closing_done`; that scene's `conversation_closed` music entry plays the ending's track and carries the card and credits. Every closing mapping carries `!closing_done` and fires once, so re-talking him never replays a scene, and each scene NPC's `game_loaded` backstop re-opens only the scene still owed. All four `end_it` tasks complete on every ending, so the score never punishes one. The core's resume rule (rule 1.11) means a walk-away or reload re-enters the first unset menu.

| Ending | Path (C15 → C16 → C17) | Set by | Reachable from every save? |
|---|---|---|---|
| Surrender (`surrender`) | Stop it → secure or disclose → two or more points → [Then cooperate.] | that pick | yes: the three rebuttals are on every menu |
| Arrest (`arrest`) | Stop it → secure or disclose → two or more points and [No deal. You're under arrest.], or fewer than two, [You're under arrest.], then [Hold fire.] | either pick | yes |
| Lethal, justified (`lethal`) | Stop it → secure or disclose → fewer than two points → [You're under arrest.] → [Fire.] | [Fire.] | yes: any player can miss; closed to a player who lands two, by design (D-11) |
| Lethal, cold (`executed`) | Stop it → secure or disclose → either count → [Shoot him where he sits / stands.] → warning → [Do it.] | [Do it.] | yes |
| Scorched Earth (`scorched`) | Stop it → [Wipe both.] | that pick | yes |
| Join ENTROPY (`joined`) | [Show me how it works.] → [Give me the key.] → the key → "Publish the database to everyone, now?" → yes | the confirmation | yes |

**Join's three deliberate steps** are §6.7. The other five endings all stop the Publication; they differ in what the player did with the map and with the man. On the double-cross branch every ending is reached the same way; only the core's opening differs (§6.4).

### 8.2 What earlier choices change about each

The ending scene and the 06:00 frame are fixed per ending (arc §10); what the player's night and season put into them:

| What changes | Arrest | Surrender | Lethal, justified | Lethal, cold | Scorched Earth | Join |
|---|---|---|---|---|---|---|
| Who is standing at 06:00 (the walkabout, three at most; D-05) | Quintero first (on a stretcher on `quintero_wounded`), then Kowalczyk in the van if caught, a wrongly accused officer not recalled, Voltage, Gary or Imran, Wendell, Victoria, by branch, until three. Fixed beats outside the walkabout, so the cap can't drop them (D-07): a shown Nightshade left at the post speaks as the cutscene opens; HaX's forty-seven line on `kept` or `denied` comes before "the rest"; on `m09_recruiter_offer = named`, Netherton's "It's six. The arrests have started." (D-01) | same | same | no walkabout | same, then the hearing | no 06:00 |
| Netherton's numbers | the head start (`head_start_out`), the partial release or the story (uncovered Fracture), the trace on `head_start_killed = trace` (when Zero Day's share went out), and the $12.8M on `m06_assets_seized` | same | same | he signs nothing, and the $12.8M line doesn't play (its "I have signed for that as well" would contradict his refusal; its absence is part of it) | the suspension, the wipe's gain (§6.5), and the $12.8M line (victims' fund) | he orders 0x00 brought in |
| The database's beat | secured: the first named operation rolls up its cell; disclosed: the acknowledgements, both named operations go dark, the utilities on manual | same | same | same, without HaX reading the acknowledgements | both wiped | published |
| The cells on the card | the fixed cells rule (§10) | the same, plus his two | the same; "the cells go quiet" | the same | the same | "Every cell has it." |
| Tesseract at 06:00 and in the credits | the van; the chapter with Netherton; "Awaiting trial." | the van; HaX sits with him; "Cooperating. No trial." | dead by the console | dead | gone; the card "Afterwards, then." | walks out with the player |
| HaX's last word | the rest, then "I said no. It took me till morning." | the rest, then "He asked who taught you. I said I did." | the rest, then "There'll be a board. I'll be sitting next to you." | the designation, once; later, "I'll be at the board. I don't know what I'll say." | the rest at the hearing, then "They'll ask me if I'd have stopped you. I'll tell them I wasn't asked." | the designation, unanswered |
| A taken-in Nightshade | his look, at the van window: "You wrote me as a line item." / "You were a good one." | same | none (simplification 7) | none | none | none |
| WREN | caught: in the van; stopped at the core but never named: HaX's line | same | same | same | same; he leaves by the door she propped (his own way on `m09_sleeper_named`, when nobody propped it) | never comes; credits list her |
| Ghost's and the Recruiter's texts | Ghost's message by branch; the Recruiter on `double_crossed` | same | same | same, arriving while the player is held | same | none |
| Media story | ran from outside on uncovered Fracture, else held | same | same | **sent on every branch**, with its one true paragraph (§8.3) | as arrest | irrelevant |

Nothing earlier changes which ending the player can choose; it changes who is there when it lands, and what it cost.

### 8.3 The cold ending: signposting and weight

**Signposting** (§6.6): a button that names the act and his posture, always last, never sharing a word with "[Fire.]"; a narrator's warning that says "execution" and "HaX is on the line"; a second, separate confirmation; and a "Lower the weapon." that removes the option for the rest of the scene. It is offered on both menus, so a player who argued him down to empty hands can still choose it, and has to look at those hands first.

**Weight.** The darkest ending is carried by the people who have to answer for it, not by the violence, which is one line: "He is still looking at you when you fire." Nothing from him. Nobody sums it up.

1. **HaX** says nothing for a long time, then the player's designation, once. She doesn't come to the van, and she doesn't tell "the rest": the promise from Helena goes unpaid, and the player who played m09 knows what they lost. Her last word is a message, later: "I'll be at the board. I don't know what I'll say."
2. **Quintero** comes in from the lock and takes the weapon without a word (a minder from Netherton's van team, if she is wounded or out).
3. **Netherton** signs nothing, the one time in the season: "I will not put my name under this one. You will be held until the board sits." He has signed for everything since m08's "it is on my signature", Nightshade included, so the refusal is the verdict.
4. **The story** (`media_story_ran` true on every branch of this ending): at 06:00 Social Fabric sends a new version of the story the player saw on the server hall's printer (arc §6.4), from outside, with the player's photo on it and one new paragraph (running since the breach: updated; held: the draft goes out). The media room is cut, so this is one rule on every save. It appears on the forward post's screen, headline and photo and a paragraph that is true, with no narrator line (M-06): the player reads it themselves.
5. **The close.** No walkabout. Credits title MISSION COMPLETE, then AGENT 0x00: IN CUSTODY; the card's first line, "Dr Adrian Tesseract: shot unarmed." The rest of the night's work still lands (the database's beat, the cells, the people in "In this operation"), because the player did that work too. The ending punishes the act, not the whole night.

**What it is not.** It is not reached by any import, by failing the talk-down, or by the clock. The player who chooses it chose it twice, after being told what it was.

## 9. The moral questions, asked through play

Four questions run through the night. Nobody states them. HaX refuses to decide for the player, Netherton names costs and makes only the one case that is his to make (secure's, §6.5), and Tesseract concedes exactly what was proved and nothing more (SE §1 house style). Each question is asked by things the player does, several times, in different sizes, before the core asks it in full.

**1. Disclosure, hoarding or release?** The finale's educational spine (stage 0 §1).

| Asked small | Asked in full |
|---|---|
| Ghost selling the head start, and whether to let it run to see who buys (§3.2): information as a thing people sell | The database: secure, disclose, wipe (§6.5) |
| Vos reselling Zero Day's early access; arrested Victoria selling his secret, at the price of her own sentence (§3.5): what knowledge is worth, and who pays for it | His second claim: "Services like yours hoard. Only a shock fixes it." (§6.3) |
| The schedule's first entries in plain words, and the console that can kill one share, or trace one: stop the harm, or let it run and learn who takes it (§4 C9) | "Show me how it works": release, the key itself (§6.7) |
| The player's own record: m04's disclosure, m02's cover-up, m09's notice | |

**2. Justice or revenge?**

| Asked small | Asked in full |
|---|---|
| The arrested Nightshade's deal: keep your word, or trade with the mole for a better map (§3.1) | The end for him: a public trial, a deal for cells, a shot when he reaches, or a shot when he doesn't (§6.6) |
| Victoria arrested or let walk for Zero Day's order; Vos's name off the report for a code card (§3.5) | |
| Imran and Gary: charged, talked round, or left in place (§3.3) | |

**3. Is he right?** The night keeps giving him evidence. The pump flaw is real, known for three years and called an asset; but some flaws can't be fixed this year or at all, and a full map handed to every vendor tells buyers where to hit before fixes exist (Netherton's case, §6.5), so the service's reasons for holding are real too; disclosure works at its own speed (acknowledged tonight, fixed in months, fitted over a year), and costs a bad morning somewhere; Asante corrected his sums and he signed the old number anyway. The talk-down never asks the player to say he is wrong about everything: each rebuttal takes one claim away (the price, the "only", the clean hands), and he concedes each one exactly. A player who secures the database proves his second claim with their own hand, and the card says so ("still unpatched"). The one outcome his argument can't survive is Scorched Earth, where nobody holds anything, and it costs the player their badge. A player who agrees with him can press the key, and the game lets them.

**4. Loyalty: to HaX, to SAFETYNET, to the team.** The whodunit makes the player suspect the people beside them, at a price if wrong (§5). Netherton signs for whatever the player decides about Nightshade. Victoria, recruited, hedges ("So is everyone."), and the player decides whether a hedging asset is worth keeping. At the core, "[HaX. You're on speaker.]" hands the argument to the person he taught; HaX refuses to choose for the player; and the cold ending is the one choice in the season that HaX and Netherton both refuse to stand behind. Loyalty to SAFETYNET is tested by the database choice: securing keeps faith with the service, disclosing keeps faith with the public, wiping keeps faith with neither, and the service suspends the player for it.

**How it is kept out of lecture.** No character sums up a question. Costs are said in one line by someone with a stake. No ending is called right: every success ending has a cost on screen at 06:00, and Join's casualty curve is shown, not preached.

## 10. How the close reflects the player's choices

The user's test is that the player feels their choices "in who turns up, who helps, who betrays, what's possible, and what's said to them", never as a roll-call. The close keeps to that with four rules:

1. **One consequence, one person, one line.** Each consequence that lands at 06:00 is said by someone with a reason to say it: Quintero about the briefing stance, Kowalczyk about her question, Wendell about the week's pay, Netherton about numbers he signs for. The walkabout is a hub the player chooses from, at most three, Quintero first (orchestrator ruling, D-05), so nobody is read out; the close is budgeted at about 8 minutes (arc §2).
2. **Netherton's numbers are the night's, not the season's.** His lines are tonight's cost (the head start, the partial release or the story, the trace, the $12.8M). Earlier missions reach 06:00 only through the people standing there.
3. **The closing card is five fixed lines, in this order** (FA §13 item 36; confirmed): the Architect by ending; the database by `database_outcome`; the head start; the cells (the count and one name, by the fixed cells rule below); one human line. Join's card is three: "Dr Adrian Tesseract: with you." / "The database: everywhere." / "Every cell has it." The cold card's first line is "shot unarmed".
4. **The credits carry the rest, one clause per person**, in the order the player met them tonight ("In this operation"), then "Elsewhere" for those with nobody in m10 to carry them (arc §11.3). A clause states an outcome, never the choice that caused it ("Imran Siddiqui, the workshop. Went home. So did a friend."), so the player connects it themselves.

**The card's human line** (FA §13 item 36): the first that applies, in this order, which is the order of how many people the earlier choice put at risk and for how long the player has carried it:

| # | Line | Applies when |
|---|---|---|
| 1 | Dispatch in eleven counties: on `disclosed`, "Dispatch in eleven counties: a vendor workaround by the weekend. The fix is due in ninety days."; otherwise "Dispatch in eleven counties: still dropping calls. Day thirteen." | `m07_completed` and Austin never covered |
| 2 | Albion's inquiry, one clause for both missions (S3-19): on `full`, "Albion's inquiry asked who funded the plant's security. Parliament answered."; on `partial` with `m04_crew_lost`, "The Albion inquest heard the rest."; on `partial` without, "Albion's half-statement still stands. Nobody audited the other sites." Where m09 sent the notice and there is an inquiry (`m09_albion_notified` and (`full` or `m04_crew_lost`)), the clause adds m09's half: "It also asked SAFETYNET when it knew. SAFETYNET answered." | `m04_completed` and `m04_disclosure_choice` is `full` or `partial` |
| 3 | The forty-seven: how many were reached in time, by FA row 62's conditions | `m05_completed` |
| 4 | Elena Torres: "Elena Torres is in treatment. It's working." | `m05_elena_treatment_funded` |
| – | none applies: the line is left out, and the card runs four lines | |

Dispatch is first because it has run through both missions' briefings as a count of days; disclosing the database is the one choice that starts its fix tonight, so the card is also where that choice is felt by a player who never hears the acknowledgements. Each of the four is also in "Elsewhere", so nothing depends on being picked.

**Where the $12.8M lands** (FA §13 item 35): see §11.

**The cells: one fixed rule** (orchestrator ruling, milestone simplification 4; replaces the seven-source ledger and its fallback chain, S3-07, R2-05). Computed once when `ending` is set. Each source has its own cell, named in advance, so no two sources can claim the same one and nothing falls back:

| Source | Cells | Which |
|---|---|---|
| The console (C9) | one at most | the bait's catch, "the five buyers of the resale share" (console on the resale share, after the bait); or the trace, "the four buyers of Zero Day's share" (`trace`, when the share went out). The console does one thing, so never both. |
| Secure (C16) | one | the cell named for the first operation on the list (§6.5): Victoria's watch, Zero Day's UK desk; Nightshade's channel, the Initiative's procurement desk; the HashChain tags, the Crypto Anarchists' reserve; the Critical Mass watch, Critical Mass; the order-book watch, the book's largest buyer; the Zero Day tap, Zero Day's brokers |
| Surrender (C17) | two | always his protocol's own two, the cells' couriers and their quartermaster, which no other source names (FA §4.6) (§6.6) |
| m07 | by m07's rule | FA §4.6, with `m07_completed`; each named by its leader |

So the count runs from zero (no console catch, wipe or the cold ending) to four plus m07's. The card names one cell: surrender's first, else secure's, else the console's, else an m07 leader's, or the "not among them" form where m07 left a leader's cell standing. **m07's cells are named by leader** ("Michael Reeves's cell", "Marcus Ashford's cell", "Jennifer Walsh's cell"), never as Ghost Protocol, and the console's catch is "the resale share", never "Ghost's buyers", on any closing screen, so Ghost (whose text arrives at 06:00) and Ghost Protocol are never on one screen (consistency review, name clashes). The first name is kept so the m02 Reeves can't be read. A taken-in Imran's supplier and arrested Victoria's book are no longer cells: each is a clause in that person's credits line ("His supplier was raided by morning." / "Still talking."). The credits list the cells once. Surrender's rule (§11 item 34) is the table's third row.

**m09's "Elsewhere" clauses** (m09 MC §11 change 6): `m09_legacy_files_saved`, "Eleven placements outside SAFETYNET, picked up from the Helena files." (the import's one reader); the notice's inquiry half, merged into human line 2 above; on `m09_recruiter_secret = told`, a clause in the player's own "In this operation" line: "Agent 0x00. Told their handler." (never in "Elsewhere"); and **one clause for the Recruiter on every value of `m09_recruiter_offer`** (MS-04; she has no card line), the same wording as m09 SA §20: `taken` or `refused`, "The Recruiter: at large, her people at their desks."; `named`, "The Recruiter's network: rolled up." (at six, not before, D-01); `double_crossed`, m09's line, "About half of them. She warned the rest."; `""`, nothing.

## 11. FINALE_ARC §13 items for stage 3

Every FA §13 item owned by stage 3 that concerns m10. Item 7 (the Recruiter's choice wording) and the m09 halves of 25 and 38 are m09's stage 3.

| # | Item | Settled as | Where |
|---|---|---|---|
| 11 | Each slot's wording and costs | Every branch of the five scenes has options, gains, costs and who signposts them; each Act 2 scene has one decision after the talk; effects carried into the gallery are voiced there. | §3 |
| 14 | Disclose's operations and an epilogue beat per database option | One priority list of six operations, item 5 being the watch on the early-access order book from flag 2, so two always apply; disclose burns the first two, secure keeps both and the first rolls up its named cell. Each option has a public cost and a beat at 06:00; disclosure at its real speed. | §6.5, §8.2, §10 |
| 24 | Escaped Victoria without the threat | Her trade, worded; the arrest is cheaper when the console spent itself on Zero Day's share. | §3.5 |
| 25 | The Alpha tapes in m10 | Three payoffs: the exchange 3 record answer (first in slot 4's pool), HaX's blast-door line as the door opens for 0x00 ("The best lock there is. Tape two."), and HaX's service-door warning at the console, after his refusal of WREN, so Quintero takes her unhurt (no Quintero: the warning goes to the player). `m09_deck_pulled` is Tier 1. The clip itself is m09's (F12, voiced). | §6.3, §6.4, §7 |
| 27 | Why the branch operations survive the raid | A recruited Victoria who held (confronted), was left unanswered (`refused`, the default), or was trusted while Zero Day's share was dead goes back to Zero Day as if she lost her nerve; one trusted while the share was live burned herself (MS-02; "refused" is cut, and walking past carries its outcome). Nightshade's channel survives only where the player held his file in m09: he never turned openly and stays at the forward post, above ground. | §3.1, §3.5, §6.5 |
| 28 | Where a taken-in Nightshade goes | The outer lock, with Quintero (a minder from the van team if she is out): he holds it behind the player. His look at Tesseract is one exchange at the van window on arrest and surrender, and nothing on the other endings (simplification 7). Netherton has said the cost: he is relocated under a new name afterwards. | §3.1, §8.2 |
| 29 | WREN on the Join path | Checked against the three steps: she never comes while the player is on them; she comes as normal at "Stop it" if the player stepped back. On the double-cross branch she is already at the core and taken before step 0. | §6.4 |
| 33 | The invoice and refusing's clean record | Confirmed both. The invoice is a ledger sting in the Recruiter beat. The clean record is an exchange 2 answer in slot 4 (m09's wording, an answer per value), after `m09_albion_notified`; where that hides it, he says it himself in the Recruiter beat, so it is paid once on every refusing save. m10's slot pools supersede m09's "ranked last" (S3-18). | §6.2, §6.3 |
| 34 | Surrender's two cells | Always his protocol's own two, the cells' couriers and their quartermaster, under the fixed cells rule (milestone pass; the fallback order is gone). No other source names either, so there are always two. | §10 |
| 35 | The $12.8M | Flipped on `secured` (which three endings share), kept on the rest. Default: "The twelve point eight million goes back to the victims' fund. I have signed for that as well." On `secured`: "The Council is keeping the twelve point eight million with the copy, as evidence. I argued for the victims' fund. I lost." Only on `m06_assets_seized`, and not on the cold ending, where Netherton signs nothing (R2-16). | §10, §8.2 |
| 36 | The closing card's human line, and the card's order | Card order confirmed (Architect, database, head start, cells, human line). Human line: dispatch, then Albion's inquiry (one clause for m04 and m09), then the forty-seven, then Elena Torres. | §10 |
| 37 | The cold choice's wording, both menus | Confirmed: "[Shoot him where he sits.]" / "[Shoot him where he stands.]", always last; the narrator's warning; "[Do it.]" / "[Lower the weapon.]"; lowering removes the option. | §6.6 |
| 38 | m09 choices handed on (m10's half) | The cage bin through m09's `cage_bin`: Derek's file is an exchange 1 answer; the letters a HaX line at the drafted story's prop in the server hall (the media room is cut); Nightshade's copy one line at the door, on the not-shown and arrested branches. "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != derek_file`. `legacy_files_saved` gets its "Elsewhere" clause. | §3.1, §6.3, §6.4, §10 |

## 12. State table

Every global the choices set. Names are working names (stage 4 fixes them; exports keep FA §3.5's names once stage 9 adds them). Each needs all three legs (README_ink_best_practices: set, declare in `globalVariables`, `VAR` in every ink file that reads it), and each is read somewhere; the "Read by" column is the proof. None is in `concludeRequires`; only the done-flags drive door mappings. Writing a local from an import at `game_loaded` (`sleeper_caught` on `m09_sleeper_named`) is allowed: CARRY_OVER §2.6 forbids only writes to the import.

**Exports** (FA §3.5; for a later season, nothing reads them yet), each with the one moment it is computed (S3-14):

| Global | Values | Default | Computed | Read by (in m10) |
|---|---|---|---|---|
| `ending` | `arrest` / `surrender` / `lethal` / `executed` / `scorched` / `joined` | `""` | the C17 pick, "wipe both", the Join key's confirmation, always after `database_outcome` | ending scene (which completes the conclusion task, §8.1), 06:00, card, credits, music |
| `database_outcome` | `secured` / `disclosed` / `both_wiped` / `published` | `""` | C16; `published` on the key's confirmation | 06:00 beat, card, dispatch line, $12.8M line, cells rule |
| `sleeper_caught` | bool | `false`; `true` at load on `m09_sleeper_named and m09_recruiter_offer = taken` | a right accusation (face to face or on the line); the double-cross branch's taking at the core | WREN at the core, 06:00, credits |
| `wrong_accusation` | bool | `false` | any wrong accusation; stays true after a recall | 06:00 walkabout, credits |
| `head_start_out` | `none` / `zero_day` / `ghost` / `both` | `""` | on `outer_lock_open`, which two HaX mappings set whichever way opened the lock (the player's `door_unlocked` into the core, or an NPC's `door_unlocked_by_npc`; engine 39 as a pattern, no engine change; OT §4.5), by four mutually exclusive mappings: Zero Day out where `share_zero_day = live` or `traced`; the resale share out where `share_resale = live`. Equivalently, Zero Day out unless `head_start_killed = zero_day` or the gallery stopped it (`victoria_gallery` in `confronted` / `talked_down` / `walked`, or `vos_secret_used`); Ghost's buyers out unless `head_start_killed = ghost` or `ghost_sale = stopped` | Netherton's numbers, card, cells rule (the trace) |
| `partial_release` | `none` / `small` / `large` / `published` | `none` | "Stop it": `small` on the redirected channel left open, `large` on the uncovered one; `published` on the key's confirmation | HaX at 06:00, Netherton's numbers, card |
| `media_story_ran` | bool | `false` | when `ending` is set: `true` on `m07_completed` and uncovered Fracture (the story runs from outside; the media room is cut), and on `executed` on every branch; `false` on Join (FA §3.5) | Netherton's numbers, cold ending's screen, credits |

**Done-flags** (local; every branch sets them; S3-13). Each story door opens by HaX's `unlockDoor` mapping (F19) when its condition holds, one mapping per global in the condition, plus `game_loaded` and `door_unlock_failed:<room>` catch-ups; the door's own done-flag (`breach_open`, `inner_door_open`, `stair_open`, `gallery_open`) is set only from `door_unlocked_by_npc` with that room and `npcId === 'agent_0x99'`, so a refused unlock leaves nothing claiming the door is open (S4-1, S4-18; OT §4):

| Global | Set | Opens | KO or walk-away cover |
|---|---|---|---|
| `door_scene_done` | the closing choice at the table, every branch (§3.1) | the breach, with `flag1_submitted` and `pair_back` | the holders are `koImmune`; a walk-away or reload re-enters at the closing choice |
| `ghost_call_done` | the call's last choice, every branch | the security office's stair down | a phone; every click on the handset, and re-entering the office, resumes it |
| `gallery_shutter_cut` | the slot-holder's cut, or the phone voice's by-hand cut (§3.4) | the gallery stair, with `flag2_submitted` and `flag3_submitted` | the phone voice re-rings on entry; HaX's "[Talk me through the shutter.]" |
| `victoria_line_done` | the line's last choice, or the gallery stair with the call unfinished | nothing; it stops the re-ring | defaults written at the stair (§3.5) |

**Local decision globals:**

| Global | Values | Default | Set where | Read by |
|---|---|---|---|---|
| `quintero_stance` | `quintero` / `netherton` / `""` | `""` | C1 | outer lock, 06:00 |
| `nightshade_taken_in` | bool | `false` | §3.1 shown branch | outer lock, van window, credits |
| `payment_checked` | bool | `false` | §3.1, the check at the table | the tunnel door, HaX |
| `nightshade_map_used` | bool | `false` | §3.1 unshown branch's closing choice; `nightshade_deal = taken` implies it | the tunnel post, the tripwire |
| `tripwire_tripped` | bool | `false` | on `tripwire_armed` (`nightshade_map_used and not payment_checked`), the first try at the tunnel's inner door or the first use of the guard post's ladder, whichever comes first; sets `wren_warned` and `security_alerted` with it (OT §4.3) | security office, WREN's timing (arc §8.5) |
| `nightshade_deal` | `taken` / `refused` / `""` | `refused` on the arrested branch's first line | §3.1 arrested branch | tunnel, clue 2 helper, outer lock, credits |
| `nightshade_tethered` | bool | `false` | §3.1 silent branch | blast door, Arakawa's placement, Kowalczyk's peel-off room, accusation costs |
| `ghost_sale` | `stopped` / `bait` / `selling` | by branch on the call's first line | §3.2 | `share_resale`, `head_start_out`, C9's options, cells rule |
| `ghost_gift` | `code` / `card` / `""` | `""` | §3.2 refused branch | the outer lock |
| `ghost_answer` | one value per answer on the kept and refused branches | `""` | §3.2 | Ghost's 06:00 text |
| `imran_outcome` | `talked_round` / `taken_in` / `card_cloned` / `ko` / `avoided` | `avoided` (first line or room exit) | §3.3 | power-room door, bench-log pointer, Farah in the gallery, credits (the supplier clause on `taken_in`) |
| `gary_outcome` | `talked_round` / `left_in_place` / `taken_in` / `ko` / `avoided` | `avoided` on the unprotected branch | §3.3 | power-room door, credits |
| `voltage_outcome` | `his_hands` / `by_hand` / `stood_down_print` / `talked_down` / `fought` / `ko` / `avoided` | `avoided` | §3.4 | shutter, credits |
| `wendell_outcome` | `told` / `worked_round` / `ko` / `avoided` | `avoided` | §3.4 | 06:00, credits |
| `server_hall_warned` | bool | `false` | §3.4, Wendell told | Asante (C7 closed), Mercer (no draw-off) |
| `gallery_camera_blinded` | bool | `false` | §3.4, the switch, only inside a by-hand cut | the gallery's monitor post and its bark |
| `asante_outcome` | `talked` / `ko` / `untouched` | `untouched` | C7 | credits |
| `asante_confirmed_sheet` | bool | `false` | C7 | exchange 1 rebuttal's decoded form |
| `victoria_line_deal` | `deal` / `no_deal` | `no_deal` on the call's first line | C8 | credits ("Still talking.") |
| `vos_secret_known` | bool | `false` | C8, on the line that tells it | the gallery's branch: the secret used automatically, or Vos's own trade |
| `vos_secret_used` | bool | `false` | §3.5 arrested branch, set on the one-option line in the gallery whenever `vos_secret_known` | `share_zero_day`, `head_start_out` |
| `victoria_gallery` | `confronted` / `trusted` / `refused` / `talked_down` / `walked` / `arrested_here` / `ko` / `avoided` | `refused` on the recruited branch (unanswered); `avoided` on the escaped branches | §3.5 | `share_zero_day`, operations list, Zero Day tap, 06:00, credits |
| `vos_outcome` | `stood_aside` / `bought` / `refused` / `ko` / `avoided` | `avoided` (Vos's branches only) | §3.5 | credits' Zero Day line |
| `head_start_killed` | `zero_day` / `ghost` / `trace` / `""` | `""` | C9 | `share_zero_day`, `share_resale`, `head_start_out`, recruited Victoria, the console's cell |
| `share_zero_day` | `live` / `stopped` / `traced` / `released` | `live` | display global (D-03): `stopped` on `head_start_killed = zero_day`, `confronted`, `talked_down`, `walked` or `vos_secret_used`; `traced` on `head_start_killed = trace`; `released` replaces `live` and `traced` at the lock's unlock event | every countdown object's status line, HaX's "What's still live?", `head_start_out` |
| `share_resale` | `live` / `stopped` / `none` / `released` | `none`; `live` on the call's first line where `ghost_sale = selling` | display global (D-03): `stopped` on `ghost_sale = stopped` (talked out) or `head_start_killed = ghost`; `released` replaces `live` at the lock | every countdown object's status line, HaX's "What's still live?", `head_start_out` |
| `backdoor_closed` | bool | `false` | C10 | `partial_release` |
| `accused` | `kowalczyk` / `""` (the right accusation only) | `""` | §5 | team staging, core, 06:00 |
| `officer_out` | one officer sent back and not recalled, or `""` (one at a time) | `""` | §5; cleared on recall | per-room staging (RL §2.9), HaX's `gallery_open` call (`malhotra`, OT §4.4), core, 06:00 |
| `kowalczyk_ko`, `quintero_ko`, `arakawa_ko`, `vector_ko`, `phantom_ko` | bool | `false` | `globalVarOnKO` | staging (RL §2.9), WREN at the core, 06:00, credits (Malhotra is `koImmune`; no `malhotra_ko`) |
| `wren_at_core` | bool | `false` | §6.4, when WREN comes through or waits at the core | 06:00, credits |
| `quintero_wounded` | bool | `false` | §6.4 default branch | 06:00 stretcher, the cold ending's weapon-taker |
| `kowalczyk_answer` | `bench` / `briefing` / `worked_out` / `""` | `""` | C18 | her 06:00 reply |
| `exchange_1`, `exchange_2`, `exchange_3` | `rebuttal` / `record` / `miss` | `""` | §6.3, written on the pick | his openers; `points_landed` |
| `points_landed` | 0–3 | derived when step 5 opens, never incremented | §6.3 | step 5's menu, Join's step 1 line, the core's music |
| `console_choice` | `stopped` / `joined` / `""` | `""` | "Stop it"; `joined` on the key's confirmation | the core's resume rule |
| `join_step` | 0–3 | 0 | §6.7, the furthest step reached | his step 5 line on `>= 2` |
| `cold_lowered` | bool | `false` | §6.6, "Lower the weapon." | removes the cold option |

Cut since draft 1: `tesseract_ko` (stages 4–5: he is `koImmune`, S4-8), `nightshade_cuffed`, `dale_rang`, `ghost_gift = declined`/`blind`, the two Imran phone values (folded into `talked_round` and `taken_in`); in the milestone pass, `media_story_killed` (C11) and `vos_outcome = talked_out` (`victoria_gallery = refused` stays, as the recruited branch's unanswered default). Added in the milestone pass: the display globals `share_zero_day` and `share_resale` (D-03). `teaser_enabled` (FA §7) is configuration, not a decision, and is not listed. The countdown objects' global is `raid_clock` (OT §6): a string, default `t0145`, moved only forward by HaX's mappings on story events, its values `t0145` / `t0200` / `t0210` / `t0220` / `t0230` / `t0245` / `t0300` / `t0315` / `t0330` / `t0345` / `t0400` / `t0600`, each with a `t` prefix because ink `#set_global` turns digits into numbers.

**Wiring locals added at stage 4** (S4-16; OT §2–§7 own them; none is a decision): `split_started`, `gate_console_used`, `pair_back`, `aside_done`, `briefing_done`, `six_done`, `cut_by_hand`, `ladder_used`, `<room>_entered` (one per room), `<door>_open` (the four story doors' done-flags and `outer_lock_open`), `door_log_given`, `signout_read`, `margin_note_read`, `lock_guard_challenged`, `keypad_dusted`, `voltage_print_lifted`. Also in OT: `flag1_submitted`…`flag4_submitted` (set by HaX on each flag's `emit_event` reward, S4-21), `whodunit_live` and `whodunit_open` (the WREN aim's story gate, S4-19), `hax_jammed`, `at_keypad`, `lock_guard_known`, `closing_done`, `arakawa_call_done`, `wren_stopped`, `wren_entering`, `quintero_enters_core`. **OT §16 is the full inventory** (type, default, writer, readers) since the stages 4–5 milestone fix (A25), including the ones added then: `gallery_rota_read`, `breach_announced`, `override_held`, `phone_voice_is_hax`, `cut_step`, `flag4_heard`, `what_went_out_given`, and the previously undeclared `tripwire_armed`, `security_alerted`, `wren_warned`, `ghost_watch_on_route`, `plans_read`, `payment_read`, `core_greeted`, `case_heard`, `backdoor_channel_live`, `clue_door_log`, `clue_alibi`, `clue_bench_log`, `casualty_sheet_read`. `lock_guard_known` has four writers: the rota, Ghost's card gift, escaped Victoria's "[Go.]" and Vos's deal (OT §4.5).

**New imports** (§14): `m09_cage_bin` (`derek_file` / `letters` / `nightshade_copy` / `""`) and `m09_legacy_files_saved` (bool), both Tier 2, as m09 MC exports them. **Milestone pass** (FA §3.2, §3.6): eighteen more Tier 2 lines-only imports, the seventeen bystander knock-out latches read only through `ko_pattern()` in `m10_carryover_vars.ink` (F16) and `m08_named_on_evidence` (HaX's aside line, M-12). m10 imported **85** at that point (Tier 1 40, Tier 2 45); since the stages 4–5 fold it imports **90** (Tier 1 40, Tier 2 50, with m02's five staff latches; FINALE_ARC §3.2), plus nine `completed`.

## 13. Dominated and unforced choices found, and the fixes

Checked against rule 1.1 (no dominated option), rule 1.5 (forced, or optional with a warned cost) and `mission-puzzle-chains` §3a. "Was" is stages 1–2 or draft 1, as marked. Round 1's findings are in §15.

**Dominated options**

| # | Choice | Was | Now |
|---|---|---|---|
| D1 | Ghost, selling branches | "leave it" bought nothing (s1–2); then the bait beat talking Ghost out once the head start was stopped for free (draft 1, F-02) | The bait catches the buyers only if the console is spent on Ghost's share, and the console can kill one share, or trace one (C9), so baiting costs Zero Day's share or the trace. No bare "hang up". |
| D2 | Kept Nightshade, not shown | "accept or check" (s1–2); then a cuff-or-leave menu that sat past the breach (draft 1, S3-01) | One closing choice at the table: his map or Helena's plans. The check is the puzzle that makes his map safe; the channel stays live either way. |
| D3 | Arrested Nightshade | refusing bought nothing | Refusing keeps the player's word and carries no tripwire; the deal's map is newer and carries one. |
| D4 | Captured Voltage | "by hand" was slower and safe; then the camera switch, as a free object, undid the fix (F-07) | By hand is the only way to the camera switch, which goes inert once someone else cuts. |
| D5 | Recruited Victoria | confronting beat both (s1–2); then trusting her was a hidden-cost trap (draft 1, F-03) | She goes with whoever is winning: trust is right when Zero Day's share is dead, wrong when it is live, and HaX says so before the jam; confront is the safe check that costs the tap. (Milestone pass: "refuse" is cut to keep the gallery at two options; leaving her unanswered (`refused`, the default) keeps its outcome, and the countdown object shows the share's state, so trust is a judgement, not a guess.) |
| D6 | Escaped Victoria, with the threat | the knock-out beat the talk-down | Talked down, she cancels Zero Day's order; knocked out, she is charged. |
| D7 | Arrested Victoria's line | she tells the secret either way | The deal keeps her talking after tonight (a desk in the ledger), at the price of her sentence. |
| D8 | Arrested Victoria's secret, in the gallery | withholding it bought nothing | Kept, it was leverage Netherton held on Vos. Milestone pass: the use-or-keep choice is cut (D-04) and the secret is used automatically; the choice on this branch is C8's deal, on the line. |
| D9 | Unprotected Gary | walking past bought nothing | Left in place, a man on their bench who ships nothing. |
| D10 | Imran | three outcomes, two alike; "phone taken" paid only in the credits (M-01) | Two: talked round (door, pointer, Farah home) or taken in (the supplier's delivery read out tonight, a nudge for the whodunit, the supplier in the ledger). |
| D11 | Wendell | "tell him" cost nothing; "work round" bought nothing | Telling him means he warns Dale, and the server hall hears it (Asante won't talk, Mercer can't be drawn off); working round gives the camera switch. |
| D12 | Surrender against arrest | surrender bought cells and cost nothing | F13: a deal with no trial against a trial with no cells; Netherton says so first. |
| D13 | Wipe both | its gain unsaid, its escape a surprise (F-06) | The escape said plainly with the menu open; its gain shown at 06:00. |
| D14 | Hold fire against fire | no basis for the gamble | HaX's "I can try. Try." at flag 4. |
| D15 | Ghost, refused | a take-or-keep step with no consequence (M-02) | Cut: the answer chooses the gift, which Ghost gives without asking. |
| D16 | Shown Nightshade | once the shown file spent the channel, "stay" bought nothing | Stay: safe, useful, a line at 06:00 on every ending and the witness list on arrest; come: holds the lock behind the player, one look at the van window, and has to disappear. |
| D17 | The database | every public cost on one side (F-04) | Secure gets Netherton's public-safety case; disclose gets a public cost at 06:00 and its real timescale. |
| D18 | C9, the console | a free task that emptied five dilemmas (F-02); then, with one share only, still free on every save but the bait (R2-01) | Kill a share, or let Zero Day's run and trace it: the console costs something on every save. |
| D19 | The tether, on named and double-cross saves | its cost pointed at Kowalczyk, who isn't on the team (R2-04) | Quintero breaches ahead instead, and the player is at the outer lock without her. |
| D20 | Ghost's refused gift | the change-over was a fourth guard effect (R2-09) | The lock's maintenance code. |

**Hidden options**

| # | Where | Was | Now |
|---|---|---|---|
| H1 | Exchange 3's record slots | the generic m09 answers filled both slots on every m09 save | Slot 4 is the player's own acts, most specific first; HaX's meaning is the fallback. |
| H2 | Exchange 2's clean record | hidden behind three other answers | Slot 3 is earlier missions, slot 4 Helena; if still hidden, he says it in the Recruiter beat. |
| H3 | A talked-round Imran in exchange 3 | only Gary counted (S3-16) | Either technician counts. |

**Unforced choices, and stranded ones**

| # | Choice | Was | Now |
|---|---|---|---|
| U1 | Ghost's call | could be skipped; then the kept branch's east door bypassed the lock (S3-03) | The stair and the east door both open on `ghost_call_done`. (Since stages 4–5 the east door is the optional records cupboard, opened by a code, so only the stair waits on the call; S4-4.) |
| U2 | The door scene | nothing held the player; then the unchecked branch's last choice sat past the breach (S3-01) | One closing choice at the table on every branch; a KO net (since stages 4–5, `koImmune` holders instead; S5-8). |
| U3 | Arrested Victoria's line | a nag that followed the player into the jammed gallery (S3-10, M-08) | One re-ring, never into the gallery; abandoned with defaults at the stair. |
| U4 | The accusation | its not-accusing cost unsaid | Netherton at the aside; HaX at the third clue. Optional. |
| U5 | Every slot scene | a walk-past left its outcome empty (S3-04) | `avoided` on the first line or the room's exit; `ko` through `globalVarOnKO`. |
| U6 | The core | no resume rule; `points_landed` could double-count (S3-11) | Rule 1.11; `points_landed` derived. |
| U7 | The conclusion | could run with `ending` empty (S3-12) | The ending scene completes the conclusion task. |

Already sound and left alone: the gallery's geography, the workshop and power room locks, the core's four menus in order, the cold choice's two steps, Join's three.

## 14. Proposed changes

None is made here. Round 1 verdicts (REVIEW_R1_STRUCTURE: accept 21, modify 7) are applied: each "modify" is rewritten to its modified form and marked. "m10 s1–2" marks a change to this mission's stage 1–2 documents, which this file overrides from stage 4 on; stage 7 writes the lines either way.

**FINALE_ARC (arc-keeper)**

| # | Change | FA sections | R1 |
|---|---|---|---|
| P1 | Zero Day's share is also stopped by an escaped Victoria talked down (she cancels the order as she leaves). | §4.2 table, §4.4, §4.6 | accept |
| P2 | Recruited Victoria goes with whoever is winning: trust is safe once Zero Day's share is dead, a sale while it is live; confronting costs the Zero Day tap; refusing keeps both operations. HaX's last line before the jam says the rule and the tap cost. | §4.4, row 32, §5.4 | accept, revised by F-03 |
| P3 | One list of six operations for the database choice: Victoria's watch, Nightshade's channel (held file only), the HashChain tags, the Critical Mass watch (notice not sent; named by m04 branch), **the watch on the early-access order book from flag 2**, the Zero Day tap. Disclose burns the first two; secure keeps both and the first rolls up a cell through the cells ledger. `vos_secret_used` doesn't burn the tap. | §4.1 step 4, §4.6 | modify (S3-06, S3-07) |
| P4 | F13 (user-approved): surrender is a deal with no public trial; arrest a public trial with no cells; Netherton says so before the menu. Includes FA §4.6's surrender row ("no trial") and the credits clauses "Cooperating. No trial." / "Awaiting trial." | §4.1 step 5, §4.5, §4.6 | accept |
| P5 | Step 0: HaX's "I can try to kill the feed. Try." and the purge warning ("He's rigged this room. If both copies die, it purges..."), repeated plainly at the database menu. | §4.1 steps 0 and 4 | accept |
| P6 | Exchange record slots get their own pools (§6.3); new answers: Derek's file (exchange 1), the clean record in m09's wording with an answer per value, captured Voltage, Voltage's print, Imran talked round. | §4.1 table | accept |
| P7 | The Recruiter beat after his evidence: `recruiter_secret` to HaX (including `denied`: "You told me she was fishing."), then the invoice sting, or the clean record said for the player when it isn't on their menu. | §4.1 step 1, §3.2 | accept |
| P8 | m09 exports eleven (adds `cage_bin`, `legacy_files_saved`). m10 imports **67** plus nine `completed`: **Tier 1 40** (adds `m09_deck_pulled`, the service-door warning and blast-door line, and `m09_recruiter_offer`, which now places WREN at the core on `double_crossed`), **Tier 2 27** (adds `m09_cage_bin` and `m09_legacy_files_saved`; loses the two moved up). Supersedes FA §15's "`m09_deck_pulled` … Tier 2" note. | §3.2, §3.4, §15 counts | modify (S3-08), recounted for the double-cross branch |
| P9 | The $12.8M: victims' fund by default; kept by the Council as evidence on `secured`. | row 80, §4.6 | accept |
| P10 | Closing card: human line order dispatch, Albion (one clause for m04 and m09's notice), the forty-seven, Elena Torres; dispatch's line at the true disclosure speed (a workaround in days, the fix in ninety); Join's card three lines. | §4.6 | accept (S3-19) |
| P11 | Nightshade: shown, his channel is spent (m09), and stay-or-come trades safety and usefulness (a 06:00 line on every ending, the witness list on arrest) against holding the lock behind the player and one look at the van window; unshown, one closing choice at the table, his map or Helena's plans, with the check as a puzzle; the arrested refusal carries no tripwire; with no Quintero, a minder at the lock. No arrested-branch help from Nightshade's copy. | §4.4, rows 105, 107, §5.1, §13 item 28 | modify (S3-01, S3-15, S3-21, S3-08) |
| P12 | The outer lock's ways through each pay differently: picked under guard; the lock card (quiet); opened from inside; Ghost's maintenance code (nobody needed). A taken-in Nightshade holds it behind the player instead of opening it. | §4.0 route, §4.4 | accept, revised by M-04 |
| P13 | Ghost: the bait and its catch, through the one-share console and the cells ledger; the refused branch is one menu whose answer chooses the gift (the outer lock's maintenance code, or the lock card's holder). Ghost's keys-used watch lands on Imran's card, not a camera. | §4.4, rows 15, 16, §4.6 | modify (simplification 2, S3-07, F-08) |
| P14 | The power room's gallery-camera switch: an object that sets a global, reachable only inside a by-hand cut, inert after anyone else cuts; it takes the gallery's monitor guard off his post, with a bark. No CCTV system assumed. | §4.4 power room | accept (S3-20, F-07) |
| P15 | Workshop: unprotected Gary can be left in place; Imran has two outcomes (talked round, taken in), with `avoided` and `ko` defaults; Imran on the unprotected branch follows Gary. | §4.4 workshop, row 23 | accept |
| P16 | The aside: Netherton's "Whoever it is wants the same room you do. Find them before you get there." | §4.0, row 117 | accept |
| P17 | Two done-flag doors (the breach on flag 1 and `door_scene_done`; the security office's stair and the kept branch's east door on `ghost_call_done`), opened by eventMappings with a `game_loaded` re-check; KO safety nets on m08's pattern for every forced face-to-face scene; KO immunity proposed as an engine item. | §4.0 route, §6.1 phone rule, §6.2 | modify (S3-02, S3-03, S3-13) |
| P18 | The cold choice: always last; "Lower the weapon." removes it. | §4.1 step 5 | accept |
| P19 | `join_step` 0–3; his step 5 line on `join_step >= 2`; his step 1 line by points (M-11). | §4.3 | modify (S3-11) |
| P20 | §3.5's "local decision globals" sentence points at this file's §12; §13 statuses for items 11, 14, 24, 25, 27–29 and 33–38 point at §11 here. | §3.5, §13 | accept |
| P29 | **C9, one thing only**: kill Zero Day's share, kill Ghost's buyers' (bait branch), or let Zero Day's run and trace it (one cell; names for the order-book watch). HaX: "I can kill one feed, or follow one. Not both. Pick." Every live share goes at one moment, the outer lock's unlock event, which the clock calls 04:00. | §4.2 table and clock, §4.4, §4.6 | new (F-02, R2-01, R2-13, ruling) |
| P30 | **The database's public costs** (F-04–F-06): Netherton's case for secure; Netherton's reason disclosure burns operations ("Both of them run through holes on that list."); HaX's line that the unpatchable flaws go to operators with workarounds, not into a public list; disclose's public cost at 06:00, utilities running by hand because no patch exists yet ("They'll turn the valves by hand till spring."), and its real timescale (acknowledged tonight, fixed in about ninety days, fitted over a year), matching m09's notice; wipe's escape said at the menu and its gain shown at 06:00. | §4.1 step 4, §4.6, §1.2's teaching line | new (ruling) |
| P31 | **The double-cross branch**: WREN off the team (an empty place at the briefing, Netherton's one line), no whodunit, Kowalczyk waiting at the core beside Tesseract; the refusal plays as the player arrives; Quintero takes her; nobody is wounded at the core, which is the double-cross's one gain in m10. | §4.0, §4.4, row 117 | new (m09 ruling) |
| P32 | **The Alpha tapes' warning comes after his refusal of WREN**: Quintero takes her unhurt; with no Quintero, the warning goes to the player. Plus HaX's blast-door line "The best lock there is. Tape two." and "Then I was wrong about two things." on `m09_reading_finished and m09_cage_bin != derek_file`. | §4.4, row 119, §4.1 step 3 | new (S3-09, ruling) |
| P33 | **One cells ledger** for the card and the credits (§10); surrender's two cells are its source (6). | §4.6 | new (S3-07) |
| P34 | **The conclusion waits on `ending`**: the ending scene completes the conclusion task; the core's menus resume at the first unset global; `points_landed` derived. | §4.1, §4.5 | new (S3-11, S3-12) |
| P35 | **One wrong accusation live at a time**; KO bools per raid member; `wren_at_core`, `quintero_wounded`; WREN stopped at the core is not an accusation. | §4.4 accusing | new (S3-05) |
| P36 | **Wendell's call** is what telling him costs: Dale stays home; the server hall is warned (Asante won't talk; Mercer can't be drawn off). Dale's menu is cut. | §4.4 power room | new (cut 1) |
| P37 | **Victoria's line** rings in the server hall after flag 2, re-rings once, never into the gallery; abandoned with defaults at the stair. | §4.4, §5.4 one-voice note | new (S3-10, M-08) |
| P38 | **The gallery's barks** attribute what earlier choices did there (the camera, Priya, Ghost's code at the keypad, Nightshade on the intercom); exactly three choices pay in a guard (the tunnel post, the monitor post, Priya's post), each voiced. | §4.4, §4.0 | new (F-01, F-08) |
| P39 | The cold ending's story appears on the 06:00 screen with no narrator line. | §4.5 | new (M-06) |
| P40 | Join's casualty figure said once, at step 1. | §4.3 | new (M-07) |

**m09 (m09 author)**

| # | Change |
|---|---|
| P21 | m09 MC's `cage_bin` and `legacy_files_saved` exports, the shown-file channel cost, the Critical Mass watch (named by m04 branch), `recruiter_secret = denied`, the double-cross voiding the name, the Alpha tapes' warning after the refusal, and the blast-door line are all taken up as m09 wrote them. **The arrested-branch help from Nightshade's copy is rejected** (orchestrator); only the door line stays. Modify (S3-08, S3-09). |
| P22 | m09's clean record: m10's slot pools and the Recruiter-beat fallback supersede "ranked last"; one button wording for both missions, m09's ("[Your Recruiter offered me a name. I wouldn't buy it from her.]"). Accept (S3-18). |
| P41 | The disclosure timescale in m09's notice beat ("Patch window, ninety days.") and m10's disclose beat now agree; keep them in step at stage 7. **m09 MC:240's HaX line "This is the same, bigger." becomes m10's "You burned the Critical Mass watch for one letter. This is that letter, a thousand times."**, so the two missions say the same line (R2-11). |
| P44 | m09's double-cross location is Helena in m10 too (Kowalczyk "walked off the apron in Helena"); m09's two proposed Recruiter lines for m10: the 06:00 text taken, the card line moved to "Elsewhere" (§6.2). |

**m10 stages 1–2 (m10 author; applied from stage 4 on)**

| # | Change | Where |
|---|---|---|
| P23 | The five scenes' decision columns follow §3 (P1, P2, P11–P15, P31, P36, P37). | arc §7.1–7.5 |
| P24 | SE §2.2–2.3: the slot pools and new answers (§6.3); the Recruiter beat's lines, including `denied`. | SE §2.2, §2.3 |
| P25 | New sample lines: HaX at flag 4 (two) and at the database menu; her last line before the jam; Netherton's secure case, step 5 line, aside sentence and keep-him line; Victoria's terms and resume line; Ghost's gift lines and texts; Gary's and Imran's reactions; Voltage's offer ("I could. Watch my hands."); the gallery barks; Quintero's lock and 06:00 lines by stance; Kowalczyk's three replies and her double-cross line; Nightshade's 06:00 line from the post; Tesseract's Join step 1 lines; credits clauses for Tesseract by ending. | SE §2–3 |
| P26 | Surrender's 06:00 beat: "There will be no trial." | arc §10.3 |
| P27 | The outer lock's ways through, as P12. | arc §9.2 |
| P28 | The card's human line order, the Albion clause, the dispatch line, and Join's card. | arc §11.1 |
| P42 | The double-cross branch in the briefing (an empty place, Netherton's line) and at the core (P31). | arc §3, §9.3 |
| P43 | Quintero's "It's still a door he kept for us." → "It's still his door, and he's holding it open for us."; Netherton's wipe line split into two short sentences; the cold ending's narrator line removed. | SE §3.2, §3.4; arc §10.5 |
| P45 | arc:426 (§10.8, the database's beat) still says "the first vendor patches land within the hour": replace with the acknowledgements line, ninety days and a year to fit (§6.5), and add the utilities on manual (R2-11). | arc §10.8 |
| P46 | Arakawa's call is a line, not a choice (his telescope said unprompted). | arc §5.2 beat 3 |
| P47 | The tether on named and double-cross saves costs Quintero at the outer lock (arc line 69's rule); Netherton's two-form line. | arc §7.1, §9.2 |

**Round 2 additions for FINALE_ARC**

| # | Change | FA sections |
|---|---|---|
| P48 | **Tesseract's KO** writes only `tesseract_ko`; the hand disarm sets `console_choice` and `partial_release`; the terminal's database pick sets `ending` (`arrest`, or `scorched` on wipe). | §4.1, §4.5 |
| P49 | **The door scene's holders and nets**: Nightshade's conversation on his three branches, Netherton's on the silent branch; each has a KO mapping that writes the default and `door_scene_done`; a walk-away resumes at the closing choice. | §4.0, row 107 |
| P50 | **Wrong accusations**: Arakawa's cost is the county road (a person), Vector's and Phantom's the shared cost (their forward-post job and one Netherton line). | §4.4 accusing, row 112 |
| P51 | **Ghost's refused gifts**: the outer lock's maintenance code, or the lock card's holder (no change-over). | row 15, §4.4 |
| P52 | **The cells ledger** adds the trace and Imran's supplier as sources, names the cell for each operation, makes each fallback conditional, and ends on the order book's next-largest buyer so surrender always gets two. | §4.6 |
| P53 | **Arrested Victoria's call is optional, with a warned cost**: one re-ring at the gallery-stair exit inside the server hall, HaX's line, Vos's own trade if it went unanswered. | §4.4, §5.3 |
| P54 | **The $12.8M line** plays on every ending that reaches 06:00 except the cold one. | §4.6 |

**Stages 4–5 (engine)**: the structure review's items 30–48 stand as listed there. The ones this file depends on: 31 (the AND lock), 32–34 (phone re-ring, silence in the jammed room, face-to-face resume), 35 (KO safety nets), **36 (KO immunity for Tesseract until the end-for-him menu and for the forced-scene NPCs, with the safety nets as fallback)**, 37 (the payment check), 39 (one lock-unlock event), 40 ("[Stop her.]"), 42 (guard staging on a global), 45 (the key's confirmation), 46 (the camera switch's rule), 47 (the conclusion task on the ending scene). Item 41 (a CCTV system) is not needed: every camera is now an object and a guard. **Verdicts (RL §6, stages 4–5 closed):** 30 works (F19 `unlockDoor`); 31, 33, 34, 37, 39, 40, 43, 45, 46 and 47 are scenario patterns with no engine change; 32, 35, 38, 42 and 44 work today; 36 works as the static `koImmune` key, which every forced-scene holder and Tesseract carry for the whole scene, so the nets in 35 and Tesseract's knock-out fallback are dropped and only the toggle stays unapproved (not needed); 41 not needed; 48 withdrawn.

**For the user**: nothing new. F12 and F13 are approved and applied; the $12.8M and "Lower the weapon." are orchestrator rulings. One thing to know: on the double-cross branch nobody is hurt at the core (the branch's gain), so a player who broke faith with the Recruiter in m09 gets the cleaner climax in m10, having paid for it in Helena.

## 15. Review round 1 outcomes

Reviews: `REVIEW_R1_CHOICES.md` (9 majors F-01–F-09, 11 minors M-01–M-11, a cut list, five worst lines) and `REVIEW_R1_STRUCTURE.md` (1 blocker S3-01, 11 majors S3-02–S3-12, 10 minors S3-13–S3-22, change verdicts, simplifications 1–8, engine items 30–48). Orchestrator rulings and user decisions F12, F13 applied as given; m09 stage 3's revision (eleven exports, the double-cross voiding the name, `denied`, the Alpha-tapes warning after the refusal) folded in, with the later ruling that the double-cross core goes cleanly. None withdrawn; one partly (M-08).

**Choices review**

| # | Sev | Disposition | Where |
|---|---|---|---|
| F-01 | major | Fixed: gallery barks attribute each carried effect | §3.5 |
| F-02 | major | Fixed (ruling): the console kills one share only | §4 C9, §3.2, §3.5 |
| F-03 | major | Fixed (ruling): Victoria goes with whoever is winning; HaX says so before the jam | §3.5 |
| F-04 | major | Fixed (ruling): Netherton's public-safety case for secure; a public cost for disclose | §6.5 |
| F-05 | major | Fixed (ruling): acknowledgements tonight, fixes in about ninety days, a year to fit; matches m09 | §6.5, §10 |
| F-06 | major | Fixed (ruling): the escape and the lost end-for-him choice said at the menu; the gain shown at 06:00, worded by `head_start_out` so it stays true when the head start went out | §6.1, §6.5 |
| F-07 | major | Fixed: the switch only inside a by-hand cut; inert after another's cut | §3.4 |
| F-08 | major | Fixed: three guard coins (the tunnel post, the gallery monitor, the lock's change-over), each voiced; the rest moved onto people (Ghost's watch onto Imran's card, Wendell's call onto the server hall's people, Priya's absence, Arakawa on the tether onto Kowalczyk going ahead unwatched) | §1 rule 3, §3 |
| F-09 | major | Fixed: cuts 1–3 and simplifications 1–7; about 20 picks on a rich save, one decision per Act 2 scene after the talk | §2, §3 |
| M-01 | minor | Fixed: taking Imran in reads the supplier's last delivery tonight | §3.3 |
| M-02 | minor | Fixed: Ghost's take-or-keep step cut | §3.2 |
| M-03 | minor | Fixed: cuff-or-leave cut; Netherton keeps him in one line | §3.1 |
| M-04 | minor | Fixed: each way through the lock pays differently | §3.5 |
| M-05 | minor | Fixed: a kind column | §2 |
| M-06 | minor | Fixed: the story on screen, no narrator line | §8.3 |
| M-07 | minor | Fixed: the figure once | §6.7 |
| M-08 | minor | Partly withdrawn: the one-voice rule counts voices on the line, so Asante in person doesn't break it; the re-ring is cut to one and kept out of the gallery | §3.5 |
| M-09 | minor | Fixed: a print-branch answer | §6.3 |
| M-10 | minor | Fixed: "I walk out owing nobody. Including you." | §3.5 |
| M-11 | minor | Fixed: his step 1 line by points | §6.7 |
| Worst lines 1–5 and near misses | – | All rewritten as suggested | §3.4, §3.5, §4, §6.1, §6.5, §8.3 |
| Cuts 1–3, 5, 6 | – | Applied (Dale's menu; Ghost's second step; cuff-or-leave; Arakawa to two replies; C11 then C10 as the planned cuts) | §3, §4 |

**Structure review**

| # | Sev | Disposition | Where |
|---|---|---|---|
| S3-01 | blocker | Fixed (ruling): one closing choice at the table on every door branch sets `door_scene_done` | §3.1 |
| S3-02 | major | Fixed (ruling): rule 1.10; KO nets named per scene; KO immunity as engine 36 | §1, §3, §6.1 |
| S3-03 | major | Fixed: the east door opens on `ghost_call_done` | §3.2 |
| S3-04 | major | Fixed: `avoided` defaults; `ko` for Voltage; Imran mapped on Gary's branch; `arrested_here` split | §1 rule 4, §3.3–3.5, §12 |
| S3-05 | major | Fixed: one wrong accusation at a time; KO bools; `wren_at_core`, `quintero_wounded` | §5, §6.4, §12 |
| S3-06 | major | Fixed (ruling): item 5 is the early-access order book; `vos_secret_used` keeps the tap | §6.5, §3.5 |
| S3-07 | major | Fixed (ruling): one cells ledger | §10 |
| S3-08 | major | Fixed: arrested-branch help rejected; eleven exports; 67 imports, recounted to Tier 1 40 / Tier 2 27 after the double-cross branch made `m09_recruiter_offer` a presence; `legacy_files_saved` read | §7, §12, §14 P8 |
| S3-09 | major | Fixed: the warning after his refusal; the no-Quintero case; `sleeper_caught` unchanged; the blast-door line and "two things" taken up | §6.4, §7 |
| S3-10 | major | Fixed: no re-ring into the gallery | §3.5 |
| S3-11 | major | Fixed: rule 1.11; `points_landed` derived; `join_step` 0–3; `joined` set on the key | §1, §6.3, §6.4, §6.7 |
| S3-12 | major | Fixed: the ending scene completes the conclusion task | §8.1 |
| S3-13 | minor | Fixed: door mappings, not `unlockCondition`; `teaser_enabled` out of the table | §1 rule 5, §12 |
| S3-14 | minor | Fixed: a compute moment for each derived export; `published` added to `partial_release` | §12 |
| S3-15 | minor | Fixed: "Stay" gets a 06:00 line on every ending | §3.1 |
| S3-16 | minor | Fixed: Imran counts | §6.3 |
| S3-17 | minor | Fixed: the watch named by m04 branch | §6.5 |
| S3-18 | minor | Fixed: m10's pools win; m09's wording used | §6.3, §14 P22 |
| S3-19 | minor | Fixed: m09's clauses housed; one Albion clause | §10 |
| S3-20 | minor | Fixed: no CCTV assumed; cameras are objects and guards | §0, §3.4 |
| S3-21 | minor | Fixed: a minder at the lock with no Quintero | §3.1 |
| S3-22 | minor | Fixed: "flipped on `secured`" | §11 |
| Simplifications 1–7 | – | Applied (ruling); 8 (Victoria's line as goodwill only) kept in reserve for the time budget | §3, §5, §8.2 |

**After round 1.** 18 counted choices (ten dilemmas, two puzzles, three stances, two tasks, one piece of information) plus the walkabout hub; about 20 picks on a rich save. m10 imports 67 (Tier 1 40, Tier 2 27) plus nine `completed`. (Round 1's "about 28 route profiles" is superseded by the test plan in §16.)

## 16. Review round 2 outcomes

Review: `REVIEW_R2.md` (0 blockers, 4 majors R2-01–R2-04, 12 minors R2-05–R2-16, five worst lines, a scope section). Orchestrator rulings applied as given. Fixed with targeted edits. None withdrawn.

| # | Sev | Disposition | Where |
|---|---|---|---|
| R2-01 | major | Fixed (ruling): "[Let it run. Trace who gets it.]" on every save; the console always costs something | §4 C9, §3.2, §3.5, §10 ledger |
| R2-02 | major | Fixed (ruling): the KO writes only `tesseract_ko`; the hand disarm sets `console_choice` and `partial_release`; the terminal's pick sets `ending` (arrest, or Scorched Earth on wipe); the conclusion still waits on `ending` | §6.1, §8.1, §12 |
| R2-03 | major | Fixed (ruling): each door branch names its holder (Nightshade on three, Netherton on the silent one), each with a KO mapping that sets the default and `door_scene_done`; walk-away resumes at the closing choice | §3.1, §12 |
| R2-04 | major | Fixed (ruling, arc line 69): with Kowalczyk off the team, Quintero breaches when Arakawa holds the blast door, and the tether costs Quintero at the outer lock; Netherton's line in two forms | §3.1, §5 |
| R2-05 | minor | Fixed: the trace and Imran's supplier added as sources; each operation's cell named; the fallback conditional, ending on a buyer that always exists | §10, §11 item 34 |
| R2-06 | minor | Fixed (ruling): utilities run by hand because no patch exists, no leak; HaX says the unpatchable flaws go to operators with workarounds | §6.5 |
| R2-07 | minor | Fixed: wipe's 06:00 line credits only the wipe | §6.5 |
| R2-08 | minor | Fixed: Netherton says why (the operations ride holes on the list), matching m09; each operation's hole named | §6.5 |
| R2-09 | minor | Fixed: exactly three guard effects (the tunnel post, the monitor post, Priya's post), each voiced; Ghost's change-over replaced by the lock's code; Arakawa's wrong-accusation cost moved onto the county road | §1 rule 3, §3.2, §5 |
| R2-10 | minor | Fixed: Helena, not Great Falls; the glance at the service door, not at her; m09's two Recruiter lines: the 06:00 text taken, the card line moved to "Elsewhere" | §5, §6.2, §10 |
| R2-11 | minor | Fixed: arc §10.8's "within the hour" is P45; m09's "This is the same, bigger." is in P41 | §14 |
| R2-12 | minor | Fixed (ruling): C8 labelled optional with a warned cost; a re-ring at the stair exit inside the hall with HaX's line; Vos's own trade if unanswered | §2, §3.5 |
| R2-13 | minor | Fixed: one moment, the outer lock's unlock event, called 04:00 on the clock | §4 C9, §3.2 |
| R2-14 | minor | Fixed: C15 is a gateway; C9 is now a dilemma on every save | §2 |
| R2-15 | minor | Fixed: the test plan below replaces the profile count | §15, §16 |
| R2-16 | minor | Fixed: "Netherton's numbers"; the $12.8M line not on the cold ending | §8.2, §11 item 35 |
| Worst lines 1–5 | – | All taken as rewritten (Netherton's "new name"; the valves by hand; "Nobody holds the map now"; secure's case; Ghost's two texts) | §3.1, §3.2, §6.5 |
| Scope cuts 1–2 | – | Applied (ruling): Arakawa's call is a line; Vector's and Phantom's wrong-accusation costs are the shared one. Simplification 8 stays in reserve | §4, §5 |

**Final count** (as of round 2; superseded by the milestone pass, §2: 16 choices, C11 retired, about 18 picks). 17 choices: nine dilemmas (C2, C4, C5, C6, C8, C9, C13, C16, C17), one gateway (C15), two puzzles (C12, C14), two stances (C1, C18), two tasks (C10, C11), one piece of information (C7); plus the walkabout hub. Every player meets C1, C2, C4, C5, C6, C9, C13, C14 and C15, and everyone who doesn't join meets C16 and C17. About 19 picks on a rich save. m10 imports 67 (Tier 1 40, Tier 2 27) plus nine `completed`.

### Test plan for stage 8 (milestone pass; the live plan)

Rebuilt for D-10 and the simplification pass. **35 runs, about 15 hours of agent play** (the round 2 plan: 35 runs, 20 of them full length, about 35 hours). Three true end-to-end runs; everything else is an **act-start segment** of 15–30 minutes, started with the approved playtest bootstrap (F15: start in room R with globals G loaded; VM flags injected as globals unless the run says "worked"). Each scene branch, each C9 option, each gallery option, each accusation outcome and each lock route appears at least once; each ending and each database outcome at least twice. KO and reload nets sit inside the segment that owns the scene. **Stage 4 carries these runs as bootstrap command lines** (OT §9: `--start-room`, `--carry-npc`, `--complete-task`, `--submit-flag`, and the imports files) and is the authority where the two differ; the rows below were brought into line with it at the stages 4–5 fold (the KO nets on immune holders became immunity checks; the lock routes and the workshop's spare card follow §3.5 and §3.3; the cupboard replaces the east door and Vector's sealed door). A reload respawns the player at the start room, so every reload check times the walk back.

**End to end (3, about 105 minutes each, VM flags worked)**

| # | Save | What it proves |
|---|---|---|
| E1 | kind: careful m01–m09 (triple agent shown; m02 protected, kept deal; m03 recruited; m04 captured, `full`; m06 seized; m09 `named`, `same_in_your_place`, notice sent) | the whole night in one sitting with the most allies; the 105-minute budget and the 8-minute close; D-01's aside and 06:00 line; Victoria trusted with the share dead; surrender |
| E2 | hard: ruthless m01–m09 (m02 broken deal, keys used; m04 escaped, no print, crew lost; m03 escaped with threat; m07 Austin uncovered, `hardened`; m08 kept, not shown; m09 `taken`, `kept`) | the hostile route, the named cold open, Helena's plans at the door (a manned tunnel post), few record answers; the outer lock by the cracker while the guard's cone is off the keypad; fewer than two points, justified lethal |
| E3 | cold start, no imports | every default, the cold-start briefing read cold, the rebuttal positions; the outer lock by the dusted keypad plate; arrest after hold fire |

**Segment A: forward post to the security office's stair (8 runs, about 15 minutes each; start: mission start)**

| # | Save | Briefing and C1 | Door | Ghost | Also checks |
|---|---|---|---|---|---|
| A1 | m09 `taken` + m08 KO-before-fate | named cold open (`recruiter_offer == taken`); Quintero | silent, tether (Quintero breaches) | refused, code | MS-03 guard; Arakawa's 02:10 call worked |
| A2 | m09 `double_crossed` | empty place; Netherton | silent, leave | stranger, bait | double-cross checked before `taken` |
| A3 | m08 shown; Vector and Phantom present | say nothing | shown, stay | kept, answer 1 | the D-02 line; Vector's code at the records cupboard, the gallery rota inside |
| A4 | m08 shown | – | shown, come; reload before the closing choice: respawn, walk back, the knot re-enters at it | kept, answer 3 (the cupboard's code noted) | a strike at Nightshade does nothing (`koImmune`) |
| A5 | m08 kept, not shown; m02 broken, keys used; `nightshade_copy` | – | not shown, map unchecked (the tripwire, through to the security office) | broken, own it, talk out; call closed and reloaded mid-call | the notes line on the not-shown branch (MS-05) |
| A6 | m08 kept, not shown; m02 refused | – | not shown, payment checked, map | refused, card | door scene closed early, then resumed |
| A7 | m08 arrested; m02 unanswered; m03 `guard_bribed`; `nightshade_copy`; m09 `named` | – | arrested, refuse | unanswered, talk out | the Cardiff lull line (MS-01); D-01 aside; notes line on the arrested branch |
| A8 | m08 arrested; m02 kept | – | arrested, deal, unchecked; reload: deal, checked | kept, answer 2 (the stair stays shut until answered; the cupboard's code noted) | reload between deal and check; a strike at Netherton does nothing (`koImmune`) |

**Segment B: workshop floor and power room (5 runs, about 15 minutes; start: workshop floor)**

| # | Save | Workshop | Power room | Also checks |
|---|---|---|---|---|
| B1 | cold | Imran, talked round | Wendell, told (server hall warned) | Farah's post set empty |
| B2 | m02 protected | Gary + Imran, taken in (supplier read off the phone) | captured Voltage, his hands | phone slot unused with Voltage in the room (MS-07) |
| B3 | m02 unprotected; m04 escaped + print | Gary talked round | escaped, print | – |
| B4 | m02 unprotected; m04 escaped, Static | Gary left in place (Imran cloned) | escaped, sheet talk-down | – |
| B5 | m02 unprotected; m04 captured; m02 keys used | Gary cuffed; Imran keeps his card (the fitter's locker in the security office) | captured, by hand (camera switch); Wendell KO'd on a second pass, the phone voice rings | the switch only inside the by-hand cut |

**Segment W: the whodunit, security office to the outer lock (4 runs, about 30 minutes; start: security office, clue 1 open)**

| # | Accusation | Also checks |
|---|---|---|
| W1 | right, face to face (four cards) | her question; Arakawa looks away |
| W2 | wrong Malhotra, refused second accusation, recalled; right on the line | HaX's `gallery_open` call breaks up after its warning while he is out (OT §9 W2) |
| W3 | wrong Arakawa, not recalled; tethered Nightshade (van team at the blast door) | the county road cost |
| W4 | wrong Quintero, not recalled; then Kowalczyk on the line with no Quintero (the player stops her at the core) | `sleeper_caught` true from the core |

**Segment C: server hall to the outer lock (6 runs, about 20 minutes; start: server hall, flag 2 injected)**

| # | Save | C9 | C8 / gallery | Lock | Also checks |
|---|---|---|---|---|---|
| C1 | m03 recruited | kill Zero Day | trust (share dead) | opened from inside | status lines STOPPED; the "What's still live?" topic; Victoria's watch on the operations list (MS-02) |
| C2 | m03 recruited; m02 broken deal, Ghost baited | trace | trust (share live: alarm) | the cracker while the guard's cone is off the keypad | status TRACED then RELEASED; sweep line at the hall's exit (D-04) |
| C3 | m03 recruited | skipped | confront (tap dark at five); reload: left unanswered (`refused`) | opened from inside | both warnings on leaving the hall; one warning before the jam |
| C4 | m03 escaped + threat; m07 Mercer at large; m02 unanswered, Ghost baited | kill Ghost's (bait) | talked down / knocked out (reload) | the guard's dropped code card (this save can't have Ghost's code; OT §9 C4) | Mercer, Asante off the map; the story running from outside (Fracture uncovered) |
| C5 | m03 escaped, no threat; m07 Austin uncovered | trace | go (code card named) / arrest (reload) | the guard's own card, once named | backdoor closed |
| C6 | m03 arrested | kill Zero Day | line: deal; the secret used on Vos automatically. Reload: call closed, re-ring at the stair, abandoned; Vos's trade, deal / no | Vos stands aside; card | no keep option; `vos_secret_used` |

**Segment D: the core (9 runs, about 15 minutes; start: the core with globals, flag 4 injected unless "worked")**

D1 each of the six endings in turn from one save, checking the card (cells by the fixed rule; "Michael Reeves's cell", never Ghost Protocol next to Ghost's text), the walkabout of three, the fixed 06:00 beats (Nightshade, HaX's forty-seven, D-01's arrests line) and the credits clauses (the Recruiter on each value); D2 `join_step` 1 → step back → stop, and 3 → "No" → step away → stop; D3 a reload between each core menu (resume; `points_landed` unchanged); D4 strikes at Tesseract at each menu (nothing happens: `koImmune` for the whole scene; no fallback to test); D5 WREN free with Quintero, then with no Quintero ("[Stop her.]", reload on the beat); D6 WREN caught, and the double-cross opening (glance at the door she came in by); D7 `alpha_tapes` with and without Quintero; D8 the record pools at their cap (the Alpha notes over HaX's meaning in exchange 3; `full` over the hospital in exchange 2; the clean first day withheld when `ko_pattern() > 0`), the knock-out sting at each band (0, 1, 2–3, 4+) from seeded saves, and Satoshi's three stances in his offer; D9 the cold option lowered, a reload, then executed (the server hall's draft sent with its true paragraph).

### Test plan for stage 8 (round 2–3 version, superseded by the plan above; kept as the record)

About 35 runs, most of them short, against m07's 39. Full-length profiles are a covering set: each walks a non-default branch in every scene at once, so every scene branch, every C9 option and every accusation outcome appears at least once, and every ending and database outcome at least twice.

**Full-length covering profiles (20)**

| # | Save (imports) | Door | Ghost | Workshop | Power room | Gallery / C8 | C9 | Accusation | Database | Ending |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | cold start, all defaults | silent, leave | stranger, talk out | Imran round | Wendell told | Vos, deal | kill Zero Day | right, face to face | secure | surrender |
| 2 | cold start | silent, tether | stranger, bait | Imran taken in | Wendell worked round (camera) | Vos, refuse | kill Ghost's | wrong Malhotra, recalled; right on line | disclose | arrest anyway |
| 3 | rich: triple agent, shown; m02 protected, kept deal; m04 captured; m03 recruited | shown, stay | kept | Gary + Imran round | Voltage's hands | Victoria, confront | trace | none (WREN at core, Quintero wounded) | secure | arrest (hold fire) |
| 4 | as 3, other picks | shown, come (holds the lock) | kept | Gary + Imran taken in | by hand (camera) | Victoria, trust with Zero Day dead | kill Zero Day | right, on the line | disclose | lethal, justified |
| 5 | triple agent, file held; m02 broken deal + keys used; m04 escaped + print | not shown, map, unchecked (tripwire) | broken, own it, talk out | unprotected Gary round | escaped, print | recruited, trust with share live (alarm) | trace | wrong Arakawa, not recalled | wipe | Scorched Earth |
| 6 | as 5; Static with Voltage; m03 escaped + threat | not shown, map, checked | broken, bait | Gary left in place | escaped, sheet talk-down | escaped threat, talked down | kill Ghost's | right, face to face | secure | executed |
| 7 | file held; m02 unanswered; m03 escaped + threat | not shown, plans | unanswered, talk out | Gary cuffed | escaped, fought | escaped threat, KO | kill Zero Day | wrong Quintero, not recalled; a second accusation refused by HaX while she is out; then Kowalczyk on the line with no Quintero to send (the player stops her at the core, `sleeper_caught` true) | disclose | cold lowered, then arrest |
| 8 | m08 arrested; m02 kept; m03 escaped, no threat | arrested, refuse | kept | Imran KO | Wendell KO | escaped, walk | trace | right, face to face | – | Join (three steps) |
| 9 | arrested; m02 refused; m09 `alpha_tapes`; m03 escaped, no threat | arrested, deal, unchecked | refused, card | Imran clone | captured Voltage, his hands | escaped, arrest | kill Zero Day | none (warned: Quintero unhurt) | secure | surrender |
| 10 | arrested; m03 arrested; m07 Mercer at large | arrested, deal, checked | stranger, bait | Imran round | Wendell told (Mercer warned) | Victoria's line, no deal; secret used on Vos | trace | Kowalczyk KO, never named | disclose | arrest |
| 11 | m09 `taken` (named) + m08 KO-before-fate | silent, tether (Quintero breaches) | refused, code | Imran taken in | Wendell worked round | Vos, refuse | kill Zero Day | off | wipe | Scorched Earth |
| 12 | m09 `double_crossed` | silent, leave | stranger, talk out | Imran round | Wendell told | Vos, deal | trace | off (WREN at core, nobody hurt) | secure | surrender |
| 13 | m09 `double_crossed` + silent | silent, tether (no Quintero at core) | broken, bait | Imran round | captured, Voltage knocked out (`ko`; the player cuts by hand) | Vos, talk out | kill Ghost's | off (player takes her) | disclose | lethal, justified |
| 14 | m03 arrested; m08 Vector present; m07 Austin uncovered, Fracture uncovered | arrested, refuse | unanswered, talk out | Imran round | Wendell told | Victoria's line, deal; secret kept, then Vos's own trade (deal) | kill Zero Day | wrong Vector, recalled; right | secure | Join steps 1–2, step back; arrest (his "held your hand out" line) |
| 15 | m07 redirected, Fracture uncovered; m05 exposed | shown, stay | stranger, bait | Imran round | Wendell told | Vos, deal | trace | right, on the line | disclose | executed (story true; backdoor left open) |
| 16 | m06 assets seized | silent, leave | stranger, talk out | Imran round | Wendell walked past (`avoided` via the room exit; the player cuts by hand) | Vos, refuse | skipped (`head_start_killed = ""`; both live shares go) | right | secure ($12.8M kept by Council) | arrest anyway |
| 17 | m06 monitoring; m09 completed, notice not sent; m08 never played | silent, leave | kept | Imran round | Wendell told | Vos, deal | trace | right | disclose (HashChain and Critical Mass burned) | surrender |
| 18 | m08 Phantom present; m06 assets seized | silent, leave | refused, code | Imran round | Wendell told | Vos, refuse | kill Zero Day | wrong Phantom, recalled; right | wipe ($12.8M to the fund) | Scorched Earth |
| 19 | rich m09: `same_in_your_place`, `reading_finished`, `cage_bin = derek_file`, `albion_notified`, `refused`, `recruiter_secret = denied` | shown, come | kept | Gary round | Voltage stood down | recruited, refuse | trace | right | secure | surrender (three record answers) |
| 20 | cold start, every exchange missed | silent, tether | stranger, bait | Imran taken in | Wendell worked round | Vos, deal | kill Ghost's | none | – | Join |

**Short core-start profiles (10)**, loaded at the core with globals injected: (21) each of the six endings in turn from one save, checking the card, the walkabout and the credits clauses; (22) `join_step` 1 → step back → stop, and 3 → "No" → step away → stop; (23) a reload between each core menu, checking resume and that `points_landed` is unchanged; (24) Tesseract knocked out before the database menu, then secure (arrest) and wipe (Scorched Earth); and knocked out after secure but before C17, which resumes at "[Cuff him.]" (arrest); (25) WREN free with Quintero; (26) WREN free, no Quintero ("[Stop her.]", then reload on the beat); (27) WREN caught; (28) the double-cross opening; (29) `alpha_tapes` with and without Quintero; (30) the cold option lowered, then the menu re-entered after a reload.

**KO and reload nets (5)**: (31) Nightshade knocked out before the closing choice on each of his three branches (on the shown branch, the override is dropped and can be picked up); (32) Netherton knocked out before the tether question, then his lines at the database menu and at 06:00 still play; (33) the door scene closed early, then resumed; (34) Ghost's call closed early and reloaded mid-call, on a selling branch and the kept branch (the east door stays shut until answered); (35) arrested Victoria's call closed, the re-ring at the stair exit, then abandoned on the stair (Vos's own trade plays).

## 17. Review round 3 outcomes

Review: `REVIEW_R3.md` (0 blockers, 1 major, 4 minors; every R2 finding confirmed fixed). Final pass; targeted edits; none withdrawn. With these, stage 3 is complete.

| # | Sev | Disposition | Where |
|---|---|---|---|
| R3-01 | major | Fixed (ruling): with `tesseract_ko` true, the core resumes at the first unset of the hand disarm, the terminal's database menu, then a one-option "[Cuff him.]" that sets `ending = arrest`; his unset exchanges are skipped. Test 24 adds the KO after the database pick | §6.1, §12, §16 test 24 |
| R3-02 | minor | Fixed: "His lines"; the ledger's surrender source is (6) in §10 and P33; the `door_scene_done` cover names Netherton's net; the bait's catch "where the console killed Ghost's share"; "kill one share, or trace one" in §9 and D1; item 28's "relocated under a new name"; §2 and §16 agree on C9 (met by everyone, skippable) and about 19 picks | §2, §6.5, §9, §10, §11, §12, §13, §14 |
| R3-03 | minor | Fixed: the trace gets Netherton's 06:00 line on every ending that reaches 06:00 ("We followed Zero Day's share. Four buyers, and one of them was careless."); a player who killed the share doesn't hear it | §4 C9, §8.2 |
| R3-04 | minor | Fixed, folded into existing profiles (still 35 runs): profile 7 adds a refused second accusation and a line accusation of Kowalczyk with no Quintero; profile 10 takes "No deal"; profile 14 keeps Vos's secret; profile 16 walks past Wendell (`avoided`) and skips C9; profile 13 knocks Voltage out; test 24 adds the KO after the database pick. Profile 17's door is now silent (m08 never played), so its expected burns, the HashChain tags and the Critical Mass watch, are right | §16 |
| R3-05 | minor | Fixed: a knocked-out Netherton comes round in the van and his later lines stand (one narrator line at 06:00); a knocked-out shown Nightshade drops the override. Tests 31 and 32 check both | §3.1, §16 |
