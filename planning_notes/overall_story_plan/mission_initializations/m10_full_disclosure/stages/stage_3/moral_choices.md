# m10 Full Disclosure: Stage 3, moral choices

## 0. Status and sources

Stage 3, draft 1. Author: stage 3 author (Opus), 2026-10-21. Not yet reviewed.

Built on `../../../finale/FINALE_ARC.md` ("FA §n", thread rows "row n"; the version with stages 1–2 folded in, FA §15), `../stage_0_initialization.md`, `../stage_1/story_arc.md` ("arc §n") and `../stage_2/storytelling_elements.md` ("SE §n"), with m09's choices and exports from `../../m09_digital_archaeology/stages/stage_1/story_arc.md` §8 and FA §3.4. The prompt is `story_design/story_dev_prompts/03_moral_choices.md`; where it and the newer standards differ, the newer ones win: `npc-dialog-review` §2d (choices that matter), `mission-puzzle-chains` §3a (are the mission's own choices required), `README_ink_best_practices.md` "Making Choices Matter", and `docs/agents/CARRY_OVER_PLAN.md` (imports never gate completion).

Stage 1 says what happens and in what order; this file says, for every choice, what the player sees, what each option costs and buys, who says so before the player picks, and what global records it. Where this file changes a cost or an option that stage 1 or 2 already wrote, the change is listed in §14 and this file is the authority for stage 4 onwards. Sample lines are samples (stage 7 writes the ink); choice text is in brackets, first person.

Conventions as in arc §0: UTC clock times; flags by story meaning only; "WREN" or "the sleeper", never "the plant"; "the power room"; no pronoun for WREN before the accusation; one non-HaX voice per room, the raid net counting as HaX's channel. Global names are working names in `snake_case`; stage 4 fixes them.

## 1. Rules every choice keeps

1. **Every option buys something the others don't.** If one option is better on every count, it isn't a choice. Each decision below lists a gain and a cost per option, and §13 records where stages 1–2 had a dominated option and how it was fixed.
2. **The cost is said before the pick**, by someone with a reason to say it: HaX, Netherton, the person in the room, or the narrator at the core. A cost the player learns only afterwards is allowed for one kind of choice, the trust test (does the player check before they trust?), and then the warning to check comes first. In the gallery, where HaX is jammed, her warnings come in her last line before the jam (D-22).
3. **The cost is felt in play**, not only in the credits: a door that opens or stays shut, a guard more or fewer, a line from someone the player knows, a beat at 06:00. The credits restate it in one clause; they never carry it alone.
4. **Fight or sneak is a playstyle, not a moral option.** Every scene keeps a way through by knock-out, stealth or a cloned card (stage 0 §2.2). It is quicker and costs an epilogue line where someone is hurt. The no-dominance test in rule 1 applies to the social options, and the fight-or-sneak route is checked only for not being a trap.
5. **Forced or optional, stated for each choice.** A choice the story needs is forced by a lock or an event, never by a nag: a door that waits on a local done-flag, a menu that must be answered to go on, a phone scene that rings again. An optional choice has a signposted cost for skipping it.
6. **Imports never gate.** No import appears in `concludeRequires` or an `unlockCondition` (FA §3; CARRY_OVER_PLAN §2.7). An import may decide which branch of a scene plays and which options the menu shows; the locks that force a choice read only m10's own globals, which every branch sets. Every scene works with every import at its default (§7).
7. **Forced phone scenes** (Ghost's handset, arrested Victoria's line) follow FA §6.1: defaults on the first line, the done-flag on the last choice, a re-ring on leaving the room that resumes at the last unanswered choice, and nothing downstream keyed on the conversation closing.
8. **Stance choices are allowed** where the outcome is fixed by character (Ghost on the kept branch, Kowalczyk's question), and each still sets a global that something reads later (npc-dialog-review §2d.2).
9. **No line tells the player about a choice they didn't make.** Every at-large or penalising default also needs that source's `completed` (FA §3).

## 2. Every choice at a glance

In the order a player meets them. "Forced" names the lock or event that makes the player answer; "optional" choices name what skipping costs. Globals are in §12.

| # | Choice | Who meets it | Where | Forced or optional | Main global |
|---|---|---|---|---|---|
| C1 | Back Quintero or Netherton | every player | briefing (cutscene) | forced: a cutscene menu; "say nothing" is an option | `quintero_stance` |
| C2 | The door: four branches (§3.1) | every player | forward post | forced: the breach waits on `door_scene_done` | `nightshade_*`, `door_scene_done` |
| C3 | Arakawa's call | every player | gate, 02:10 | optional stance; the call happens either way | `arakawa_call` |
| C4 | Ghost (§3.2) | every player | security office handset | forced: the stair down waits on `ghost_call_done` | `ghost_sale`, `ghost_gift`, `ghost_answer` |
| C5 | The workshop (§3.3) | every player | workshop floor | forced: the power-room door needs a talked-round technician, Gary, the cloned card or the old hatch | `imran_outcome`, `gary_outcome` |
| C6 | The power room (§3.4) | every player | power room | forced: aim 3, the gallery's shutter, is cut by the slot-holder or by hand | `voltage_outcome`, `wendell_outcome`, `dale_rang`, `gallery_camera_blinded` |
| C7 | Asante | the default server hall (no Mercer) | server hall | optional | `asante_outcome`, `asante_confirmed_sheet` |
| C8 | Arrested Victoria's line | `m03_victoria_fate = arrested` | server hall | forced by re-ring; nothing waits on it | `victoria_line_deal`, `vos_secret_known` |
| C9 | Stop the head start | every player | server-hall console | optional: skipping it lets the cells' share go at the outer lock, warned twice | `head_start_stopped` |
| C10 | Close the backdoor | `m07_completed` and Austin not covered directly | server-hall console | optional: skipping it costs the partial release | `backdoor_closed` |
| C11 | Kill the story | Fracture uncovered, with `m07_completed` | media room | optional: skipping it lets the story run | `media_story_killed` |
| C12 | The accusation (§5) | every player not on `m09_sleeper_named` | any time after clue 1 | optional: no accusation means WREN acts at the core, said at the aside | `accused`, `sleeper_caught`, `wrong_accusation` |
| C13 | The gallery (§3.5) | every player | gallery | forced: the outer lock is past the slot-holder | `victoria_gallery`, `vos_outcome` |
| C14 | The three exchanges (§6.3) | every player | core | forced: the console's menu comes after the third | `exchange_1..3`, `points_landed` |
| C15 | Stop it, or "Show me how it works" | every player | core | forced: the database menu waits on it | `console_choice`, `join_step` |
| C16 | The database (§6.5) | every player who stops it | core | forced: step 5 waits on it | `database_outcome` |
| C17 | The end for him (§6.6) | every player who secures or discloses | core | forced: the ending scene waits on it | `ending` |
| C18 | Kowalczyk's question | a right face-to-face accusation; a line accusation (asked at 06:00) | forward post | optional stance | `kowalczyk_answer` |
| C19 | The 06:00 walkabout | every ending that reaches 06:00 except the cold one | forward post | a hub; "[That's everyone.]" | none (information) |

Every player meets C1, C2, C4, C5, C6, C13, C14 and C15, and every player who doesn't join meets C16 and C17 too: ten forced decisions, five of them in the full scenes, plus optional tasks whose cost is warned.

## 3. The five full scenes

### 3.1 The door: Nightshade

Forward post, straight after the private aside (arc §7.1). **Forced:** the gate's breach at 02:30 waits on flag 1 and `door_scene_done`, which each branch sets on its last choice. HaX's pointer to the scene is in SE §3.5. Netherton's m08 line, "If he burns you, it is on my signature", is the frame on both triple-agent branches: whatever the player decides about Nightshade, Netherton signs for it, and says so.

**One question runs through all four branches: what is a traitor worth to you?** A channel, a deal, a door, or nothing.

**Kept, shown his file** (`m08_nightshade_triple_agent and m09_nightshade_shown_file`). He pays in full, marks the one wrong entry as Tesseract's lie, and hands over the override (the alarm panel). That much is his gift on both options. He has picked a side out loud, so the triple-agent channel is spent whatever the player decides (m09 stage 3 §4.1: that is the price of sending the file). What is left to decide is what happens to him:

| Option as the player sees it | Gain | Cost | Who says so first |
|---|---|---|---|
| [Stay at the post.] | Nobody below sees him with SAFETYNET, so he stays safe in custody and can testify: on the arrest ending he is on the trial's witness list ("Agent 0x47 'Nightshade', the door. Witness for the prosecution."). | He never sees Tesseract; he asks once more, then lets it go. | Netherton: "Leave him here and nobody below sees him with us. He lives to give evidence." |
| [Come with us. You can see his face.] | He is placed at the outer lock with Quintero and gives the player the lock's manual release, a fifth way through (§3.5). After the choices, he gets his look at Tesseract (§11 item 28). | Every guard below sees him with SAFETYNET: after tonight he has to disappear ("Moved, and unreachable."), and he can't testify. | Netherton: "Take him down there and every guard in the place sees him with us. After tonight I will have to make him disappear." |

Sets `nightshade_taken_in`. Felt: the lock and the face-to-face, or his place on the witness list.

**Kept, not shown** (`m08_nightshade_triple_agent and not m09_nightshade_shown_file`). He pays warmly; one entry is wrong and he doesn't say so. This branch has two decisions.

1. **The payment** is a trust test, the one place rule 1.2's exception is used. HaX's pointer says "He's brought his payment." and, on every branch where a payment is given, "You've got Helena's plans. Use them." The check is a player action at the table (lay the payment beside the m09 plans; the wrong entry doesn't match), not a menu pick, so there is no "[Trust him]" button competing with a "[Check it]" button. Checked: he smiles ("You read your homework."), and the player takes the tunnel's inner door the way the plans show, so it never trips. Unchecked: the tripwire at that door (arc §5.3). Sets `payment_checked`, `tripwire_tripped`.
2. **What to do with him**, once the lie is out (at the table if checked, or on the line at the locked door if not; Netherton asks, so it always comes):

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Cuff him. The arrangement's over.] | A man who tried to burn the raid can't do it twice; Netherton closes the file in front of the player. | His channel ends; one fewer operation for the database choice. | Netherton: "Cuff him and the channel's done. Leave him and I am keeping a man who just tried to burn you. Your call. My signature either way." |
| [Leave him at the table. We'll talk after.] | The channel stays live, lie and all: on `secured` it rolls up a cell, and HaX says "He gave us a real one. He'll have given them one too." | The player keeps a liar at the table all night; Netherton says nothing more about it, which is worse. | as above |

Defaults to "leave" if the line is closed (Netherton keeps him; the raid net is HaX's channel, so this is not a separate phone scene). Sets `nightshade_cuffed`.

**Arrested** (`m08_nightshade_arrested and not m08_nightshade_ko_before_fate`). Brought up in cuffs: "You said no deals. Netherton says otherwise tonight. I'd like to hear what you say."

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [No deals. I said it then.] (first, as the player's m08 answer) | The player keeps their word. No wrong entry is in play, so there is nothing to check and no tripwire. He serves his full term (credits). | The defences come from the m09 plans alone, which miss one camera in the tunnel: one guard alert there, avoidable by stealth. No ENTROPY-habits line (clue 2 stays to be found). | Netherton: "Without him you have Helena's plans. They are good plans. They are not complete." |
| [Name them. You'll get your deal.] | Every defence with its entry; his line on ENTROPY's habits, which replaces clue 2 (arc §8.3). | One entry is wrong (Tesseract lied to him too): unchecked, it is the tripwire, as above. His sentence is reduced in the credits. | HaX: "He's only as right as the man who briefed him." |

Sets `nightshade_deal` (`refused` / `taken`). Felt: the camera alert or the tripwire risk; Quintero, at the lock, on "no deals": "You turned him down twice. I'd have taken the deal. I'm glad you didn't."

**Silent, or never played** (`m08_nightshade_ko_before_fate`, or `not m08_completed`). One word: "Door."

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Bring him up. Let's hear the second word.] | "Manual." and the hand crank: the blast door opens without telling the bunker 0x00 is in, and the tunnel post is off guard. | Arakawa walks him up and holds the blast door all night: he isn't a room ahead, so one more guard stands in the security office, and he can be accused only on the line. | Netherton: "If he goes up, Arakawa goes with him and stays with him." |
| [Leave him in the van.] | Arakawa goes ahead with Kowalczyk, as planned. | The blast door announces the player by name, and the tunnel post is waiting. | as above |

Sets `nightshade_tethered`. Felt at the blast door either way.

**Every branch is winnable at its default**: the m09 plans hold every defence (FA §3 never-played canon), so a player with no Nightshade help still gets in, with one more alert.

### 3.2 The network: Ghost

The security office's duty handset rings on entry (arc §7.5). **Forced:** the stair down to the workshop floor opens on `ghost_call_done`, set on the call's last choice; the call follows the phone rule (rule 1.7), and the handset on the desk resumes it if clicked. **First line sets** `ghost_sale` by branch (`stopped` on kept and refused, `selling` otherwise) and `ghost_gift = ""`. The question underneath: **what do you owe an enemy who kept their word, and what will you let one sell?**

**Deal kept** (`m02_ghost_deal_accepted and m02_exposed_hospital`). Ghost has refused to sell and opens the east door. Then: "Did the board ever thank you?" A stance (rule 1.8): Ghost's outcome is fixed by character, and the answer comes back as Ghost's 06:00 text.

| Option | Ghost's text at 06:00 |
|---|---|
| [No. That wasn't why.] | "Neither was this. Clean exit." |
| [They sent a card. Unsigned.] | "Mine will be too. Clean exit." |
| [Ask them yourself.] | "I did. They didn't know who I was. Clean exit." |

Sets `ghost_answer`. The side door is the gain on every option; the main route stays open too.

**Refused** (`m02_ghost_deal_refused`). The parley, and Ghost's question back: "You turned me down. Why?" The answer chooses which gift Ghost offers, and then the player takes it or not.

| Answer | Ghost offers |
|---|---|
| [I don't buy from people who hold hospitals.] | "Then do this cleanly." The core guard's change at the outer lock: a window past it (§3.5). |
| [I didn't trust you to keep it.] | "Then don't trust me. I'll just switch one off." One camera blind on the route below. |

| Then | Gain | Cost | Who says so first |
|---|---|---|---|
| [I'll take it.] | the window or the blind | Ghost now knows the player's route; Ghost's 06:00 text: "We're square." | HaX: "Take a gift from Ghost and Ghost knows where you walked." |
| [Keep it. Just go.] | Nothing owed; HaX: "Good."; Ghost's text: "Twice now. I'll stop asking." | no window, no blind | as above |

Ghost doesn't sell on either. Sets `ghost_answer`, `ghost_gift` (`window` / `blind` / `declined`).

**Deal broken, unanswered, stranger** (`m02_ghost_deal_accepted and not m02_exposed_hospital`; `m02_completed` and neither deal value; m02 never played). Ghost is selling the cells' head start on, as a leaving fee. Two ways to answer; closing the call is not an answer (it rings again), and there is no "[Hang up.]" button, because it would be the bait with nothing gained.

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| Talk Ghost out of it (the hook: does Ghost want to leave on a hospital's worst day?) | No sale: Ghost's share of the head start is gone wherever the outer lock stands. Ghost leaves for good. | It takes the right argument. Money ("[I'll pay you more.]") and threats ("[We'll find you.]") are visible misses ("Numbers are my department." / "You won't."). On **broken** the hook works only after the player owns the broken deal ("[I didn't keep it. I'm asking anyway.]"); before that Ghost says "We said we'd be watching. We were." and nothing moves. | HaX, as it rings: "Ghost leaves when Ghost has been paid. Make it not worth it." |
| [Sell it, then. I want to see who's buying.] | SAFETYNET watches the sale. If the head start is then stopped at the server-hall console (C9), the buyers have paid for nothing in plain view: "Five buyers, and we have their names." One more cell on the closing card. | If the console task is skipped, Ghost's buyers have the head start at 04:00. | HaX: "Then the console in the server hall is the only thing between them and the head start." |

On **broken** with `m02_ghost_keys_used`, Ghost also watches the route: a camera alert in the next room, which the office's desk can blind (one action). Sets `ghost_sale` (`stopped` / `bait`; `selling` is only the first line's default, and the locked stair means no run leaves the room with it).

Every option on every branch reaches a last choice, so `ghost_call_done` is always set.

### 3.3 The workshop: Gary or Imran

Workshop floor (arc §7.2). **Forced** by the power-room door, which opens to a talked-round technician, Gary on the unprotected branch, a cloned card, or picks on the old service hatch. The question: **what do you do with someone who went over for a grievance that was fair?**

**Imran Siddiqui, talked round** (the default branch, and the protected branch with Gary beside him). The argument is the casualty sheet above his own bench; on the protected branch Gary makes it with the player ("I trained him. He read my emails."). Once he's round, one more decision, about his phone:

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Keep your phone.] | He opens the power-room door, names the bench log ("Names, not stores. Look at the log."), and rings a friend on the gallery shift to send her home: one gallery guard fewer, and she is safe in the credits. He walks out with the team, uncharged. | His phone holds the bench's supplier contact, and it leaves with him: the front supplier isn't rolled up. | HaX: "Leave him the phone and he can ring anyone. Take it and we get his supplier." |
| [I'll need your phone.] | The supplier contact goes to Netherton: the front supplier is rolled up in the epilogue. | Stung, he opens the door but won't name the bench log, so clue 3 is the player's to find. His friend stays on shift (the guard stays). | as above |

On the protected branch Gary reacts each way: "Good. That's how I'd want it done." / "*flatly* That's how the board did it."

**Imran, taken in** ([Cuff him.]), on the protected and default branches:

| Gain | Cost |
|---|---|
| His card (cloned), the supplier contact, and his statement on how the Initiative recruits sacked hospital staff: the credits' Initiative line names it. | He is charged; no pointer to the bench log; his friend stays on shift. On the protected branch Gary: "I'd hoped you'd ask him first." |

So the three outcomes are: kind and quick (phone left), kind and thorough (phone taken), hard and thorough (taken in). None is best on every count.

**Gary, unprotected and quiet** (`m02_completed and not m02_gary_protected and not m02_exposed_hospital`). Gary is on the floor; Imran follows whatever Gary does. Listening is the argument: the talk is three short beats, and a dismissive pick ("[Spare me the speech.]") closes it without a fight ("Then you're the board. Card's on my belt.").

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| Talk him round | He opens the power-room door and walks out with the team ("Seven warnings, nobody listened. You're listening now?"); "a technician talked round" is a record answer under the third claim (§6.3). He is a witness, not a defendant, in the credits. | Time and the right picks; and he leaves the Initiative's books tonight. | HaX's m02 memory line comes first (SE §3.5). |
| Leave him where he is (clone his card) | Quick. Gary stays on the Initiative's payroll, shipping nothing, and SAFETYNET knows: HaX, "A man on their bench who ships nothing is worth something. Later." His credits clause: "Still on their payroll. Still shipping nothing." (a later-season thread) | No witness, no record answer, and he stays inside with them. | HaX, as the player reaches his belt: the line above. |
| [Cuff him.] | His statement, as Imran's above. | He is charged after three weeks of shipping nothing; Imran goes with him. | Gary: "Three weeks. I've not shipped a thing. Write that down." |

Sets `imran_outcome` (`phone_left` / `phone_taken` / `taken_in` / `card_cloned` / `ko`) and `gary_outcome` (`talked_round` / `left_in_place` / `taken_in` / `ko`, unprotected branch only). Fight or sneak: knock-out or clone, as rule 1.4.

### 3.4 The power room: Voltage or Wendell

Power room (arc §7.3). **Forced** by aim 3: the gallery's blast shutter is cut here, by the slot-holder or by hand. The question: **how far do you trust an enemy who has been useful, and what do you owe a bystander?**

**Voltage captured** (`m04_voltage_captured`). Placed at the power room after the breach, cuffed in front. He offers both options himself, which is the signposting: "Let me do it. It's quicker. Or do it yourself, and I'll tell you which one's the gallery camera."

| Option | Gain | Cost |
|---|---|---|
| [Your hands. Go on.] | A fast cut. He asks one thing for the inquiry ("Write down that I did it myself."), which the credits record. "Voltage did tonight's switching, for us" becomes a record answer under the third claim (§6.3). | The player watches him stand next to a switch that could blind the raid's view of the gallery, and has to take his word ("I could. I won't. Watch me not."). He doesn't. |
| [I'll do it. Talk me through it.] | The player works the old switchgear (a short switching task), and with it the panel's gallery camera: throw it, and the gallery's guards get no camera alerts (`gallery_camera_blinded`). Voltage: "You're right not to trust me." | Slower and fiddlier; no inquiry ask, no record answer. |

**Voltage escaped** (`m04_voltage_escaped`). He runs the room; Static beside him on `m04_static_left and not m04_static_left_alone`, else Wendell nervous at the far panel.

| Option | Gain | Cost |
|---|---|---|
| Prove the bypass was his (`m04_voltage_print_on_bypass` only) | He stands down at once ("I'm not going to argue with my own thumb."); HaX: "I said it'd be waiting. It was." He cuts the shutter and goes out cuffed. "Voltage stood down" is a record answer under the third claim. | none: the print is the reward for m04 |
| Talk him down with the corrected sheet (every escaped branch) | The same stand-down ("This one's wrong by a thousand."), and the same record answer. | Needs the workshop's sheet (always found, it is on the critical path) and two right picks; a miss ("Don't tell me about sums.") leaves fight or the hand cut. |
| Fight | Quick. | Static, if present, fights too; no record answer; Voltage is a knock-out in the credits. The player cuts the shutter by hand with Wendell or the phone voice. |

**Wendell Briggs, the default** (Voltage neither captured nor escaped). He thinks the servers belong to a data company.

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Tell him what the servers are for.] | He cuts the shutter himself ("Well. Which switch do you want."), then asks to ring Dale, his old colleague on the next shift (below). | none beyond the time it takes | the phone voice: "He doesn't know. You could tell him." |
| Work round him | By hand with the phone voice, and with it the gallery camera (below); Wendell never knows. | He is swept up at 06:00 with everyone else ("Do I still get paid for the week?"), and Dale walks in at shift change. | as above |

**Dale** (after "tell him"): "Dale's on the next shift. Let me ring him. He's got grandkids."

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Ring him.] | Dale stays home; the credits say so. | The call goes out on the bunker's lines: one guard alert in the server hall. | HaX: "If he rings out, someone on their net hears it." |
| [Not yet. After.] | No alert. | Dale walks into a raid at shift change: frightened, detained, released by morning (credits). | as above |

Sets `voltage_outcome` (`his_hands` / `by_hand` / `stood_down_print` / `talked_down` / `fought`), `wendell_outcome` (`told` / `worked_round` / `ko`), `dale_rang`, `gallery_camera_blinded`. The phone slot (Vance, else Elena, else HaX) changes the voice, not the options.

**The gallery camera** is a switch on the panel beside the shutter. Whoever works the panel decides it: the player, on any by-hand cut (captured Voltage talking them through, a fought Voltage, a Wendell worked round), can throw it; Voltage won't touch it, and Wendell doesn't know what it is. So on every branch, letting someone else do the switching is quicker and kinder, and doing it yourself buys a quieter gallery.

### 3.5 The gallery: Victoria or Vos, and arrested Victoria's line

The gallery is the room HaX can't reach (arc §7.4, §9.1). **Forced** by geography: the outer lock is at the far end, past whoever holds the slot. The lock opens by any one of: picked the long way; a gallery guard's card (named by escaped Victoria, bought from Vos); opened by a Victoria who holds or a Vos who stands aside; Ghost's guard-change window; or a taken-in Nightshade's manual release (§3.1). The cells' head start goes as it opens unless stopped (FA §4.2), so every decision here about Zero Day's share is in time. The question: **justice for one person against harm to many, and what a turned asset is worth.**

**HaX's last line before the jam** carries every warning the gallery needs (D-22), by branch:

- Recruited Victoria: "Sterling's in the gallery. Check her against the order before you trust her with anything. Show her the order, though, and she'll know we read Zero Day's mail."
- Arrested Victoria, after her call: "Use it on Vos and he knows we have it. Keep it, and it's ours for later."
- Every branch: "Netherton sweeps the whole place at six. Whoever you leave standing up there, he collects."

**Recruited** (`m03_victoria_fate = recruited`). She offers to open the outer lock. m03's "whether she stays turned is anyone's guess" is answered here.

| Option | Gain | Cost |
|---|---|---|
| [Before you touch that lock: Zero Day's order. Your name's on it.] (confront) | She holds ("Then you know I'm hedging. So is everyone."), opens the lock, and withdraws Zero Day's order. The watch on her survives: a Victoria who held goes back to Zero Day as if she lost her nerve (§11 item 27). | She has seen what SAFETYNET can read. The tap on Zero Day's brokers goes quiet by morning (Netherton at 06:00: "The Zero Day tap went dark at four. She'll have sold that too."). |
| [Open it.] (trust her) | The lock opens at once. The Zero Day tap is safe; she never saw the schedule. | Untested, she plays the stronger side: she opens it and sells the raid. An alarm, reinforcements on the walkway (avoidable by stealth or the blinded camera), Zero Day's order stands, and she is gone by the far stair. Her watch is over. |
| [No. Stand away from it.] (refuse) | She is never given the chance to choose. Her watch and the Zero Day tap both survive. | The long way to the lock (or another way through), and Zero Day's order stands unless the head start was stopped. |

**Escaped, with the m03 threat** (`escaped and m03_sterling_on_call_seen`). A pistol held low: "In London my associates offered to deal with you. I said I'd do it myself. I still might." She names her own terms: "If I walk out of here, I take what I came for with me. I don't leave people presents."

| Option | Gain | Cost |
|---|---|---|
| Talk her down (her own m03 words are the hook: "[You said you'd do it yourself. You haven't yet.]") | She lowers it, cancels Zero Day's order as she goes, and leaves by the far stair. | She is at large in the epilogue. A miss ("Don't analyse me.") raises the pistol, and only the knock-out is left. |
| Knock her out | She is held for the team and charged. | Zero Day's order stands (unless the head start is stopped). |

**Escaped, without the threat** (`escaped and not m03_sterling_on_call_seen`). Her trade: "I walk out. Zero Day's order goes away, and I tell you which of these two has the lock card."

| Option | Gain | Cost |
|---|---|---|
| [Go.] | Zero Day's order withdrawn, and the guard with the lock card named. With the head start already stopped, only the guard's name. | She is at large. |
| [You're under arrest.] | She doesn't fight; cuffed to the rail; charged. | Zero Day's order stands; no guard named. |

So both escaped branches put the same question two ways: justice for Victoria, or Zero Day's head start. A player who stopped the head start at the console makes the arrest cheaper, which is the console task paying back.

**Arrested** (`m03_victoria_fate = arrested`), part one: **her secure line in the server hall** (C8). The server hall's one non-HaX voice. **Forced by re-ring** (rule 1.7); nothing waits on it, and a call never finished leaves the gallery on the withheld branch. First line sets `victoria_line_deal = "no_deal"`. She gives Vos's secret first, as goodwill (the line that says it sets `vos_secret_known`; a resume starts at that line), then names her price:

| Option | Gain | Cost | Who says so first |
|---|---|---|---|
| [Deal. I'll tell them you helped.] | She keeps talking after tonight: Zero Day's London book, a Zero Day desk rolled up in the credits. | Her charge is reduced: the woman who sold St. Catherine's walks sooner. | Victoria: "A reduced charge, and you get the rest of my book. Or nothing, and you still have this." |
| [No deal. You gave it for free.] | She serves the full charge. | She stops at Vos; no London book. | as above |

Part two, **the gallery**: Vos, face to face.

| Option | Gain | Cost |
|---|---|---|
| Use it ("[Your second buyer. The one you skim from.]") | Vos withdraws Zero Day's order to keep the secret and stands aside from the lock ("Who told you that. No. Don't. I'm leaving."). | Vos knows SAFETYNET has it; the leverage is spent tonight. |
| Keep it | SAFETYNET keeps Vos's secret for later: Netherton at 06:00, "I have Mr Vos's second buyer in a drawer. He doesn't know." | The default branch's terms below: his trade, or the long way. |

**Victoria knocked out in m03, or never met** (`ko`, or `""`): **Pieter Vos** and his trade: "That guard has the lock card. You can have it. My name stays off whatever you write tonight."

| Option | Gain | Cost |
|---|---|---|
| [Deal.] | The lock card. | His name is missing from the report: he walks free, unnamed, and the credits' Zero Day line leaves him out (the player's doing). Zero Day's order stands. |
| [No.] | He is named, and swept up at six. | The lock the long way; Zero Day's order stands. |
| Talk him out (only once the head start is stopped: "[It's stopped. You're waiting for nothing.]") | He leaves before the sweep; nothing to collect. | He is at large, and named. |

Sets `victoria_gallery` (`confronted` / `trusted` / `refused` / `talked_down` / `ko` / `walked` / `arrested`), `vos_secret_used`, `vos_outcome` (`stood_aside` when the secret is used; otherwise `bought` / `refused` / `talked_out` / `ko`) and, derived at the lock, whether Zero Day's share was stopped (§12).

## 4. The smaller choices on the way

**C1, Quintero's objection** (briefing, arc §3 beat 4). "For the record, I'd go in at noon tomorrow with twice the people." Netherton: "Noted, Agent Quintero. Twice now. The record also says six o'clock."

| Option | Paid back |
|---|---|
| [She's right. And we're going anyway.] (`quintero`) | At the outer lock: "You said I was right. Now we're both in." At 06:00, on the stretcher if hurt: "You backed me. I'll remember who did." |
| [The record says six. We go.] (`netherton`) | At the lock: "You picked the clock. Fair. It's still a door he kept for us." At 06:00: "Next time, back the slow way. Once." |
| say nothing (`""`) | At the lock, her secret if asked (SE §3.4); at 06:00: "Shoulder. I've had worse from a door." |

A stance, and a whodunit tell the player can't yet read: backing Quintero is backing a suspect. It changes nothing about the accusation's evidence.

**C3, Arakawa's call** (gate, 02:10). [Go on. Thirty seconds.] / [Off the phone, Kenji.] / [What's she want for her birthday?] He gets off either way, and the call is his alibi whatever the player says. Paid back in his credits clause ("Home for Saturday, with a telescope." on the third; "Home for Saturday." otherwise) and in his 06:00 line if he is wrongly accused and recalled ("You asked about her. Then you thought I'd do this?"). `arakawa_call`.

**C7, Asante** (server hall, when Mercer isn't there). She will show the schedule if talked to, and, asked about the casualty sheet, confirms her correction ("I corrected his sums. He thanked me."), which gives the first rebuttal its decoded form without the CyberChef note (`asante_confirmed_sheet`). The curious player gains a sharper argument; nothing is lost by skipping her. Her fate is a playstyle choice (talk, knock out, or leave her at the console); she is arrested in the sweep on every branch but the knock-out, which costs a credits line.

**C9 and C10, the console tasks** (server hall, after flag 2). Stop the head start; close the backdoor. These are tasks, not dilemmas: each lowers the night's cost and has no price of its own. What makes them matter is what they pay back elsewhere: stopping the head start turns Ghost's bait into a catch (§3.2), makes escaped Victoria's arrest free (§3.5), and lets the player talk Vos out. HaX warns twice (flag 2; leaving the hall: "Fifteen minutes to their head start. That console's your last chance at it."). Skipped, they are paid at the lock (the head start) and at "Stop it" (the partial release).

**C11, the media room** (optional, the first planned cut). Kill the story at the desk, or leave it. Leaving it lets "massacre in Montana" run all night (naming the player on `m05_entropy_program_exposed`); the credits and Netherton's 06:00 numbers say so. On the executed ending the rule in §8.3 overrides it.

## 5. The whodunit accusation

Off on `m09_sleeper_named` (`sleeper_caught` true from the start). Otherwise **optional**, any time after clue 1, face to face when the accused is in the room and on the line to HaX otherwise (arc §8.4). The question is **loyalty to the people beside you**: accusing a colleague costs that colleague's job tonight if the player is wrong, and not accusing costs a colleague's shoulder if they're right to suspect.

**Signposting.** At the private aside Netherton adds one sentence to his "and neither will you": "Whoever it is wants the same room you do. Find them before you get there." HaX's nudge after each clue says what she can see and never a name; after the third: "That's three things that point somewhere. Your call, and you don't have to make it." The accusation is reached through the HaX hub ("[I know who WREN is.]"), then a list of the team members on tonight's raid, then one confirmation: "[Yes. Them.]" / "[Not yet.]".

| Option | Gain | Cost |
|---|---|---|
| Accuse Kowalczyk, face to face | The four-card scene (arc §8.4) and her question, "When did you know?" (C18). She is held at the forward post; nobody props a door at the core. | none, if right; she is the one the evidence holds |
| Accuse Kowalczyk, on the line | Quintero takes her at the service door (`sleeper_caught`); she asks her question at 06:00 instead. | No face-to-face scene. With Quintero sent back, nobody can be sent: WREN reaches the core and the player stops her there (still `sleeper_caught`). |
| Accuse an innocent officer | none | The officer is led back with a line that is also a hint (SE §3.4), and their job goes until recalled (arc §8.4): Malhotra, HaX's line drops one room early; Arakawa, one more guard ahead (or the blast-door detail comes down, on the tether branch); Quintero, nobody but the player at the core; Vector, his door shuts; Phantom, his list goes. `wrong_accusation` stays true even after a recall. |
| Recall the officer | Their job returns from the next room; Netherton over HaX's channel ("Officer Malhotra, you are cleared. Come back, and leave the face at the van."). | Available only once the player holds the evidence that clears them; the wrong call stays on the record and in the credits ("Recalled."). |
| Accuse nobody | The player never points at a friend. | WREN acts at the core: she comes through the service door for the key, and Quintero is wounded stopping her (a shoulder), or the player stops her if Quintero is gone. The epilogue says she was never named until then. |

Repeat accusations are allowed; each wrong one costs that officer. A knock-out is never an accusation (arc §8.4): it holds the officer at the forward post and costs an epilogue line, and a knocked-out Kowalczyk who is never named leaves `sleeper_caught` false.

**C18, Kowalczyk's question** ("When did you know?"), a stance with three answers, paid back by her reply at 06:00:

| Answer | Her reply |
|---|---|
| [At the bench log. Then your name on the case's sheet.] | "The paperwork. It's always the paperwork." |
| [At the briefing. You laughed too easily.] (a bluff; the player may say it whether or not it is true) | "*almost laughs* No, you didn't. But thank you." |
| [I didn't. I worked it out.] | "That's worse. That means I was good." |

Then, as SE §3.3 has it: "I liked you. I'd still have pressed it." `kowalczyk_answer`.

## 6. The core

### 6.1 Arrival and flag 4

No decision here, on purpose: the player works flag 4 while he watches (arc §9.3 step 0). Two things the core sets up for the choices to come:

- **HaX's one fact about the console** (new, said as flag 4 lands, on every branch, after her notice lines): "I've got his box. If anything goes out from that console, I can try to kill the feed. Try." This is the signposting for the justified-lethal moment (§6.6): the player knows a fallback exists and that it isn't certain.
- **HaX on the database**, as flag 4 lands, same beat: "And I can see the line into our vault from here. It's open. We left it open." Then, once, when the player first looks at the core host's purge rule: "He's wired this room to something if both copies die. I can't see what it does to the doors." That is the signposting for Scorched Earth's chaos and his escape (§6.5).

The optional head-start question ("Two hours for people who'll waste it." / "Good. I never liked paying them.") is information only.

On `should_have_told`, HaX's unasked line ("My agent told me I sat on it. They were right. You never told me anything.") comes just before the third exchange's menu, as SE §2.3 has it, and opens the "She learned that from you." answer there.

### 6.2 His case and the Recruiter beat

No decision (arc §9.3 step 1; SE §2.2): the Publication, the offer every player hears, and his evidence (up to three record lines, m04 then m01 then m07, closing "Since your first day."). Stage 3 settles what follows his evidence, **the Recruiter beat**, which gathers m09's two Recruiter exports in one place so neither crowds his evidence (D-08's cap of three stays):

1. **`m09_recruiter_secret`** (to HaX, on the open line): `kept`, his leverage and her "I'll deal with that when this is done."; `told` or `confessed`, she cuts him off at "Forty-seven names", "They told me. Next."; `""`, nothing.
2. **`m09_recruiter_offer`** (to the player):
   - `taken` or `double_crossed`: **the invoice**, one ledger sting that decides nothing: "You bought WREN from my Recruiter. You understand costing." (FA §13 item 33: confirmed.)
   - `named` or `refused`: **the clean record** is the player's own answer under the second claim (§6.3). If that answer is not on the player's menu (the slot is taken by `m09_albion_notified`, below), he says it for them instead, here, so m09's promise that refusing is paid once always holds: "My Recruiter offered you a name for a file. You said no. I'd have bought it." It stings nothing and decides nothing; it is a compliment he can't help paying.
   - `""`: nothing.

So an m09 player always hears m09's Recruiter decision once at the core, either way round, and never twice.

### 6.3 The three exchanges

**Forced:** the console's menu comes only after the third exchange. Each exchange is one pick from four fixed slots (SE §2.3): the mission's rebuttal, an evidence decoy, and two record slots, with a plain decoy in the first empty record slot. Only an answer that meets the claim lands. `exchange_n` records `rebuttal` / `record` / `miss`; `points_landed` counts the landings (0–3).

This is the season's argument played as a choice: **the player answers him with what they found tonight, or with what they did in earlier missions.** The rebuttal is always on the menu, so surrender is open to every player; the record answers let a player use their own history, which is how the season's choices are felt here.

**What two or more points buy, and what fewer buy** (said before step 5; §6.6): two or more, he stands with his hands empty and offers cooperation; fewer, he stays seated and the arrest has a dangerous moment in it. Neither is a failure: every count reaches a success ending, and fewer than two is the only way to the justified-lethal one.

**Which record answers show** (two at most per exchange). Stage 2's lists put the generic m09 answers first, so on any m09 save some of the player's own m09 choices could never appear: in exchange 3, HaX's slot and "HaX's meaning of the line" (on `m09_completed`) fill both record slots for every m09 player, which hides the Reading, the Alpha tapes and tonight's Voltage and technician answers for good. Stage 3 fixes the sourcing so each slot has its own pool:

| Exchange | Record slot 3 (or 2, in exchange 3) | Record slot 4 |
|---|---|---|
| 1. "The cost is acceptable." | `m07_debrief_stance = hardened` > the clean first day (with `m01_completed`, no m01 KOs, no `m02_patient_assaulted`) | `m02_bed4_manually_stabilised` > Derek's file (`m09_cage_bin = derek_file`, a new m09 export; m09 stage 3 §3.1) |
| 2. "Services like yours hoard." | earlier missions: `m04_disclosure_choice = full` > `m02_exposed_hospital` | Helena: `m09_albion_notified` > the clean record (`m09_recruiter_offer` `named` or `refused`; if hidden, he says it in the Recruiter beat, §6.2) |
| 3. "Better me, with clean hands." | HaX: "[HaX. You're on speaker.]" (`same_in_your_place` or `afterwards`) or "[She learned that from you.]" (`should_have_told`) | the player's own acts, most specific first: the Tomb Alpha notes (`m09_deck_pulled = alpha_tapes`) > "Your file says I press it" (`m09_reading_finished`) > captured Voltage's switching (`voltage_outcome = his_hands`) or "Voltage stood down" (`stood_down_print` / `talked_down`) > a technician talked round (`gary_outcome = talked_round`) > HaX's meaning of the line (`m09_completed`) last, as the fallback |

`m09_reading_finished` loses nothing by sitting second: it is also paid after "Stop it" ("Then I was wrong about one thing."). The two new answers (Derek's wording is m09 stage 3's):

> [You priced Derek Lawson before anyone hired him. You don't pay your costs. You hand them out.] (exchange 1, Derek's file) / Dr Adrian Tesseract: *pause* Derek paid it. I didn't.
>
> [Voltage did tonight's switching with his own hands. For us.] (exchange 3, captured, his hands) / Dr Adrian Tesseract: *pause* His own hands. He'll want that written down.

Ledger answers (`m04_crew_lost`, `m02_patient_bed4_deceased`, `m06_satoshi_stance`) still sting first and decide nothing (SE §2.1). Record answers placed under the wrong claim are decoys, after slot 4 (R4-05). The rebuttal's position rule (2nd, 1st, 3rd on a cold start) is unchanged, because only the order inside slot pools moves.

### 6.4 The console

**Forced:** the database menu waits on it. After the third exchange, his hand still by the key.

| Option | Gain | Cost |
|---|---|---|
| [Stop it.] | The disarm goes through; he doesn't fight it ("Then we do it the slow way. In court. I've a lot to say."; on `m09_reading_finished`, "Then I was wrong about one thing."). | Any open backdoor channel releases its queued batch now, the partial release (Seattle first, on `m07_countdown_expired`). The player hears it as it happens, so a skipped console task is felt here. |
| [Show me how it works.] | He shows the key; the player learns exactly what it does, from the man who built it, and can still stop it. | It is step 1 of Join (§6.7). The next menu always has "[Step back.]" and "[Stop it.]". |

**WREN**, if free (not caught, not knocked out), comes through the service door as the player reaches for the console to stop it (arc §9.3). The player's only input is a one-option beat if nobody else can stop her ("[Stop her.]", a knock-out); Quintero does it if she is at the lock. She never comes while the player is on the Join path, and comes as normal if the player steps back from it and then stops the release (FA §13 item 29: checked against the steps). Her one chance is the key; the disarm goes through either way, so she can never press it. On `m09_deck_pulled = alpha_tapes`, HaX knows his habits from the tapes and warns as the player reaches the console ("Service door. He always builds his own way out first."): Quintero comes in from the lock early and takes WREN at the door unhurt (m09 stage 3 §3.2). That is the Alpha tapes' second payoff, and the one that spares Quintero.

`console_choice` (`stopped` / `joined`); `partial_release` is set here (`none` / `small` / `large`, FA §4.2); `join_step` records how far the player went before stepping back (§6.7).

### 6.5 The database

**Forced:** step 5 waits on it; needs flag 4 (always in by now). The finale's educational spine as one menu: **keep the map, give it to the people who can fix it, or burn every copy.** Netherton comes on the line ("Magnus." / "Adrian."), and the costs are said before the menu opens, in this order, each by the person with a reason to say it.

**The operations at stake.** Disclosure burns two live operations; securing keeps them, and the first pays off before the credits. Netherton names the two by this priority, the first two that apply:

1. The watch on a recruited Victoria (`recruited`, and she was confronted or refused, §3.5).
2. Nightshade's channel (`m08_nightshade_triple_agent and not m09_nightshade_shown_file`, and not cuffed tonight, §3.1).
3. The HashChain tags (`m06_monitoring_enabled`).
4. The Critical Mass watch (`m09_completed and not m09_albion_notified`; sending the notice in m09 burned it, m09 stage 3 §3.5).
5. The watch on Ghost's buyers (every player: Ghost was selling tonight on every branch, or had buyers to refuse).
6. The tap on Zero Day's brokers (unless a confronted Victoria burned it, §3.5).

There are always at least two: 5 always applies, and 6 is gone only when 1 applies. So the player hears names they know, made by choices they made tonight.

| Option, as the player sees it | Gain | Cost | Said first by |
|---|---|---|---|
| [Secure it. Their copy's evidence. Ours stays in the vault.] | Both named operations keep running, and the first rolls up a cell before the credits (on Nightshade's channel, HaX: "He gave us a real one. He'll have given them one too." on the not-shown branch). The Council has its map. | The hoard stands: the flaws stay unreported, including the one he used against the player. On the card: "Infusion pumps in 140 hospitals: still unpatched." He was right about the service, and the player has proved it. | HaX: "Infusion pumps in a hundred and forty hospitals. The one he used on you. Still live next year if we do this." |
| [Disclose it. Wipe theirs, and send ours to the vendors, on a schedule.] | Coordinated disclosure: the first patches land within the hour (HaX reads the count at 06:00), and on Austin-uncovered saves the dispatch fix lands with them (§10). The answer to his second claim, done. | Both named operations go dark on screen at 06:00 ("He's been moved. I can't reach him." / "The tags dropped at five past."). The service gives up its map: Netherton signs for that too. | Netherton: "Two operations go dark if you do this. [the two names]. I will sign it." On `m09_albion_notified`, HaX: "You burned the Critical Mass watch for one letter. This is the same, bigger." (m09 stage 3's wording) |
| [Wipe both. Theirs and ours.] | Nobody holds the map: not him, not the cells' customers, not the service. Nobody sells it a second time (Nightshade did once). It is the one outcome his argument can't win, because there is nothing left to publish or to hoard. | Nothing is fixed: every flaw is still out there, unmapped. The core purges itself and he gets away in the dark (§8.1). The player is suspended. No step 5: the end for him is no longer theirs to choose. | Netherton: "Then nobody has it. Not him, not us. Nobody fixes anything either, and I will have to answer for it, and so will you." HaX, from flag 4: "He's wired this room to something if both copies die." |

None is best on every count: secure buys operations and a cell at the price of the hoard; disclose buys the fixes at the price of two operations; wipe buys a world where nobody holds the map, at the price of the fixes, the man, and the player's badge. `database_outcome` (`secured` / `disclosed` / `both_wiped`; `published` on Join).

HaX, if asked to choose (a fourth option, "[HaX. What would you do?]", which returns to the menu): "No. This one's yours. If I choose, I'll choose for the wrong reasons." Netherton names costs, not preferences.

### 6.6 The end for him

**Forced:** the ending scene waits on it. Not offered after "wipe both". User decision F11: two lethal versions, each signposted (FA §4.1 step 5). The question: **justice, mercy, or revenge, and who gets to hear his case.**

**On `join_step = 2`** (the player asked for the key, then stepped away; §6.7), he opens step 5 with one line, whatever the points: "You held your hand out for it. I won't forget that." It is the same line on every menu, and it lands hardest on the cold one.

**Two or more points.** He stands, hands empty: "Ask me, then." Netherton, on the line, says what each option means before the menu, in one breath: "If he cooperates, there is no trial. He gives us cells, and nobody hears his speech. Arrest him, and he makes it in open court."

| Option | Gain | Cost |
|---|---|---|
| [Then cooperate. All of it.] (`surrender`) | He types the cells' contact protocol into the bunker's terminal himself; two cells are rolled up (rule in §11 item 34). HaX sits with him in the van. | A deal for the man who priced 1,100 to 2,600 deaths: no public trial, and his argument is never tested in court. He warns the player: "They'll work out who you are by Thursday. Be careful." |
| [No deal. You're under arrest.] (`arrest`) | A public trial: his case is answered in open court, and nobody did a deal with him. HaX testifies. | No protocol, no cells: "He is in a cell. The cells are not." He gets the platform he wanted ("A trial. He will make speeches. Let him."). |
| [Shoot him where he stands.] | see the cold choice, below | |

Justified lethal force is not on this menu: he has made no move (D-11, as reworded).

**Fewer than two points.** He stays seated: "Arrest me, then."

| Option | What happens |
|---|---|
| [You're under arrest.] | As the player moves: "His hand goes to the console. One key, and the first city's list goes out anyway." A two-option beat, no timer: |
| | **[Fire.]**: one narrated line ("His hand is on the key. You fire. He falls against the console before it's pressed."), `lethal`. Certain: nothing goes out. HaX: "I was a second behind you. Log it. I'll sign under you." |
| | **[Hold fire.]**: HaX kills the feed through the host the player controls, in time ("Got it. Feed's dead. Hold. He's done."). He looks at his hand, says "Ninety-nine.", and holds out his wrists: `arrest`. The player trusted HaX's "try" (§6.1) with a city's list. |
| [Shoot him where he sits.] | see the cold choice, below |

Fire and hold fire both reach success; the player chooses under uncertainty, with the only facts HaX gave them ("I can try to kill the feed. Try."). Neither is a trap. Holding fire always works; the player doesn't know that, and that is the point of the moment. Firing buys certainty, and an end with no trial, no platform and no deal; it costs a review board, and the cells go quiet behind a martyr (§8.2). Holding fire buys a living prisoner and a trial, at the price of trusting someone else's hand.

**The cold choice** (both menus; FA §13 item 37: confirmed, with the wording below).

1. The button names the act and his posture: "[Shoot him where he sits.]" on fewer than two points, "[Shoot him where he stands.]" on two or more. It is always the last option on the menu. No other button in the scene uses "shoot"; the justified button is "[Fire.]" and appears only in the reach beat.
2. The narrator's warning, before any confirmation: "His hands are empty and in plain sight. He isn't moving. If you fire now, it's an execution, and HaX is on the line."
3. The confirmation: "[Do it.]" / "[Lower the weapon.]". Only "Do it." sets `ending = executed`.
4. "Lower the weapon." returns to the same menu without the cold option ("You lower it. He hasn't moved."), so the confirmation is final both ways. The player can't keep raising it.

It cannot be reached by a misclick (two deliberate picks, one of them after a plain warning), a knock-out, the clock, a failed talk-down or any import. Points don't change it. Its weight is §8.3.

### 6.7 Join, step by step

The one non-success ending, chosen three times (FA §4.3; arc §9.4). Every player hears the offer in his case, so listening is never a step towards it. Each step states the cost again and offers the way back.

| Step | The player picks | What they are told first | Ways back offered |
|---|---|---|---|
| 1 | [Show me how it works.] (at the console, §6.4) | He: "It's a key. You press it. Everything I've told you happens." Narrator: "Pressing it publishes the database to everyone, everywhere, in the same minute. Eleven hundred to twenty-six hundred people, the first month, by his own figure. You can still step back." | [Step back.] / [Stop it.] |
| 2 | [Give me the key.] | HaX: "0x00. Don't." Narrator: "If you take it, the mission ends here, and you work for ENTROPY. Eleven hundred to twenty-six hundred people." | [Step away.] / [Stop it.] |
| 3 | the release key, an object at the console, then its own confirmation: "Publish the database to everyone, now?" | the confirmation itself | [No.] returns to step 2's menu |

Only the key's confirmation sets `ending = joined` and `database_outcome = published`. He says, quietly, "Thank you, Agent." and nothing else. WREN never comes through on this path (§6.4).

**Stepping back is remembered** (`join_step`: 0, 1 or 2, the furthest step reached before stepping back). Step 1 is curiosity and costs nothing. Step 2, asking for the key, is paid once: his line at step 5 ("You held your hand out for it. I won't forget that."), and nothing else. Nobody else mentions it; HaX heard it and says nothing, which the player will notice.

**What changes how it is offered, and only that**: `m01_player_launched_attack` (he makes the offer to that player first and most directly) and `m06_satoshi_stance` (`wondered` warmer, `rejected` colder). The signposting never changes.

## 7. Imported decisions and the never-played defaults

How each earlier decision changes a choice in m10: which branch the player meets, which options their menu holds, or what an option costs. Imports never gate (rule 1.6). Lines-only imports that change no choice (wall-card style lines, epilogue clauses) are in FA §3.2 and §10 here, not repeated. The "default" column is what a player who never played that mission meets; it matches FA §3's never-played canon.

| From | Import | The choice it changes, and how | Default (never played) |
|---|---|---|---|
| m01 | `final_choice` | none directly; his evidence's second line (SE §2.2) | the arrest line |
| m01 | `maya_ko`, `kevin_ko`, `sarah_ko` (with `m01_completed`) | removes or keeps the clean-first-day answer in exchange 1 | no clean-first-day answer |
| m01 | `player_launched_attack` | how directly Join is offered (§6.7); nothing else | the plain offer |
| m02 | `ghost_deal_accepted`, `exposed_hospital`, `ghost_deal_refused`, `completed` | which Ghost branch (§3.2): a stance and a door, a gift, or the sale to argue down or bait | stranger: the sale |
| m02 | `ghost_keys_used` | on the broken branch, adds Ghost's camera watch (one desk action) | none |
| m02 | `gary_protected`, `exposed_hospital` (with `m02_completed`) | which workshop branch (§3.3), and Imran's grievance line | Imran alone |
| m02 | `exposed_hospital` | adds the St. Catherine's answer to exchange 2 | none |
| m02 | `bed4_manually_stabilised` / `patient_bed4_deceased` | adds an exchange 1 answer / a ledger sting | neither |
| m02 | `patient_assaulted` | removes the clean-first-day answer | kept, if m01 allows |
| m03 | `victoria_fate`, `sterling_on_call_seen` | which gallery branch (§3.5), and whether there is a server-hall call (C8) | Vos and his trade |
| m03 | `guard_bribed` | a line in the lull; no choice | none |
| m04 | `voltage_captured`, `voltage_escaped`, `voltage_print_on_bypass`, `static_left`, `static_left_alone` | which power-room branch (§3.4); whether the print option exists; Static as one more hostile | Wendell and a phone voice |
| m04 | `vance_is_ally`, (m07) `elena_outcome` | the phone voice in the power room; not the options | HaX |
| m04 | `disclosure_choice` | his evidence's first line; the strongest exchange 2 answer on `full` | his Albion default line; no answer |
| m04 | `crew_lost` | a ledger sting in exchange 2 if the player argues from Albion | none |
| m05 | `entropy_program_exposed` | raises the cost of skipping C11: the story names the player | the story names nobody |
| m05 | `recruiter_deal_*`, `found_pipeline_list`, `final_choice`, `elena_treatment_funded` | none; the close (§10) | the never-played clauses |
| m06 | `assets_seized` | two empty posts and the fence gap, an easier route; the $12.8M at 06:00 (§11 item 35) | full staffing; no $12.8M line |
| m06 | `monitoring_enabled` | adds the HashChain tags to the operations the database choice keeps or burns (§6.5) | not on the list |
| m06 | `satoshi_stance` | Join's warmth; a ledger sting | neutral |
| m07 | `team_assignment`, `team_redirected` (with `m07_completed`) | whether C10 (the backdoor) and C11 (the media room) exist, and how big the partial release is if C10 is skipped | no backdoor, no live story (the draft on the desk) |
| m07 | `countdown_expired` | "Seattle first." at "Stop it"; no choice | none |
| m07 | `mercer_fate`, `mercer_ko` (with `m07_completed`) | Mercer replaces Asante: C7 becomes a fight or a sneak | Asante |
| m07 | `debrief_stance` | his evidence's third line; on `hardened`, the projection desk and an exchange 1 answer | his default line; no answer |
| m07 | `architect_echo_heard` | HaX's beat in exchange 3; no choice | none |
| m08 | `nightshade_triple_agent`, `nightshade_arrested`, `nightshade_ko_before_fate`, `completed` | which door branch (§3.1) | silent: the tether |
| m08 | `accused_*`, `*_apologised`, `*_hostile` (with `m08_completed`) | whether Vector and Phantom are on the team: two more suspects, two more people a wrong accusation can cost, Vector's door, Phantom's list | the four-person team |
| m09 | `nightshade_shown_file` | on the triple-agent branch: shown, his channel is spent and the choice is his safety against his look at Tesseract; held, the payment check and cuff-or-leave, with his channel live (§3.1, §6.5) | (no triple agent without m08) |
| m09 | `sleeper_named` | removes C12 and C18: the whodunit is off | the whodunit runs |
| m09 | `sleeper_shortlist` | a helper for C12 (replaces clue 2) | none |
| m09 | `recruiter_offer` | the Recruiter beat (§6.2) and the clean-record answer in exchange 2 | nothing |
| m09 | `recruiter_secret` | HaX's exchange with him (§6.2); her own 06:00 walkabout pick on `kept` | nothing |
| m09 | `albion_notified` | an exchange 2 answer; HaX's line before the database choice | none; HaX reads the notice off his box |
| m09 | `hax_confession_answer` | the speaker answer or "She learned that from you." in exchange 3 | no HaX answer; a plain decoy |
| m09 | `deck_pulled`, `reading_finished` | exchange 3's slot 4 pool (§6.3); `reading_finished` also after "Stop it"; on `alpha_tapes`, HaX's service-door warning, which spares Quintero (§6.4) | none |
| m09 | `albion_notified` (again) | whether the Critical Mass watch is on the database choice's list (§6.5) | not on the list |
| m09 | `cage_bin` (proposed) | `derek_file`: an exchange 1 answer (§6.3); `letters`: a HaX line in the media room; `nightshade_copy`: Nightshade's line at the door (m09 stage 3 §3.1) | none |

**A player whose first mission is m10** meets: the door's tether choice, Ghost as a stranger, Imran alone, Wendell, Vos's trade, the default team of four, Asante, no backdoor or live story, and every core choice with the mission's own rebuttals. Every forced choice above is present on that save: the minimum is the full set of ten (§2), with no import set.

## 8. The ending matrix

### 8.1 How each ending is reached

`concludeRequires` is the four flags for all six; the ending is the global `ending`, set by one pick each, and nothing else sets it.

| Ending | Path (C15 → C16 → C17) | Set by | Reachable from every save? |
|---|---|---|---|
| Surrender (`surrender`) | Stop it → secure or disclose → two or more points → [Then cooperate.] | that pick | yes: the three rebuttals are on every menu |
| Arrest (`arrest`) | Stop it → secure or disclose → two or more points and [No deal. You're under arrest.], or fewer than two, [You're under arrest.], then [Hold fire.] | either pick | yes |
| Lethal, justified (`lethal`) | Stop it → secure or disclose → fewer than two points → [You're under arrest.] → [Fire.] | [Fire.] | yes: any player can miss; it is closed to a player who lands two, by design (D-11) |
| Lethal, cold (`executed`) | Stop it → secure or disclose → either count → [Shoot him where he sits / stands.] → warning → [Do it.] | [Do it.] | yes |
| Scorched Earth (`scorched`) | Stop it → [Wipe both.] | that pick | yes |
| Join ENTROPY (`joined`) | [Show me how it works.] → [Give me the key.] → the key → "Publish the database to everyone, now?" → yes | the confirmation | yes |

**Join's three deliberate steps** are §6.7. The other five endings are all successes in the technical sense (the Publication is stopped on all five); they differ in what the player did with the map and with the man.

### 8.2 What earlier choices change about each

The ending scene and the 06:00 frame are fixed per ending (arc §10); what the player's night and season put into them:

| What changes | Arrest | Surrender | Lethal, justified | Lethal, cold | Scorched Earth | Join |
|---|---|---|---|---|---|---|
| Who is standing at 06:00 (the walkabout) | Quintero (stretcher if WREN reached the core and HaX had no warning from the Alpha tapes), Kowalczyk in the van if caught, a wrongly accused officer not recalled, HaX on `kept`, then Voltage, Gary and Imran, Wendell, Victoria, by branch | same | same | no walkabout | same, then the hearing | no 06:00 |
| Netherton's two numbers | the head start (`head_start_out`), the partial release or the story, the $12.8M on `m06_assets_seized` | same | same | he signs nothing | the suspension | he orders 0x00 brought in |
| The database's beat | secured: the first named operation rolls up a cell; disclosed: the patch count, and both named operations go dark | same | same | same, without HaX reading the count | both wiped | published |
| The cells on the card | the head start's holders, the m07 cells (with `m07_completed`), Ghost's buyers caught on the bait | plus his two cells (§11 item 34) | "the cells go quiet" | as arrest | as arrest | "Every cell has it." |
| Tesseract at 06:00 | the van; the chapter with Netherton | the van; HaX sits with him | dead by the console | dead | gone; the card "Afterwards, then." | walks out with the player |
| HaX's last word | "the rest", then "I said no. It took me till morning." | the rest, then "He asked who taught you. I said I did." | the rest, then "There'll be a board. I'll be sitting next to you." | the designation, once; later, "I'll be at the board. I don't know what I'll say." | the rest at the hearing, then "They'll ask me if I'd have stopped you. I'll tell them I wasn't asked." | the designation, unanswered |
| Nightshade, if taken in | at the van window: "You wrote me as a line item." / "You were a good one." | same | at the console: "*pause* Smaller than I remembered." | not brought in | at the empty chair: "He left by a door. He always did." | not brought in |
| WREN | caught: in the van; never named: HaX's line | same | same | same | same; he leaves by the door she propped (his own way on `m09_sleeper_named`, when nobody propped it) | never comes; credits list her |
| Ghost's and the Recruiter's texts | Ghost's message by branch; the Recruiter on `double_crossed` | same | same | same, arriving while he is held | same | none |
| Media story | ran or killed (C11), by branch | same | same | **runs**, with its one true paragraph (§8.3) | ran or killed | irrelevant |

The table's rule: nothing earlier changes which ending the player can choose; it changes who is there when it lands, and what it cost.

### 8.3 The cold ending: signposting and weight

**Signposting** (§6.6): a button that names the act and his posture, always last, never sharing a word with "[Fire.]"; a narrator's warning that says "execution" and "HaX is on the line"; a second, separate confirmation; and a "Lower the weapon." that removes the option for good. It is offered on both menus, so a player who argued him down to empty hands can still choose it, and has to look at those hands first.

**Weight.** The darkest ending is carried by the people who have to answer for it, not by the violence, which is one line: "He is still looking at you when you fire." Nothing from him.

1. **HaX** says nothing for a long time, then the player's designation, once. She doesn't come to the van, and she does not tell "the rest": the promise from Helena goes unpaid, and the player who played m09 knows what they lost. Her last word is a message, later: "I'll be at the board. I don't know what I'll say."
2. **Quintero** comes in from the lock and takes the weapon without a word (Netherton's van team, if she is wounded or gone).
3. **Netherton** signs nothing, the one time in the season: "I will not put my name under this one. You will be held until the board sits." He has signed for everything since m08's "it is on my signature", Nightshade included, so the refusal is the verdict.
4. **The story** (`media_story_ran` true on every media-room branch): at 06:00 Social Fabric sends a new version with the player's photo on it. Narrator: "At six the story goes out. Most of it is still a lie. The paragraph about the man you shot isn't." The lie the player spent the night stopping becomes true in one paragraph, by their hand.
5. **The close.** No walkabout. Credits title MISSION COMPLETE, then AGENT 0x00: IN CUSTODY; the card's first line, "Dr Adrian Tesseract: shot unarmed." The rest of the night's work still lands (the database's beat, the cells, the people in "In this operation"), because the player did that work too. The ending punishes the act, not the whole night.

**What it is not.** It is not reached by any import, by failing the talk-down, or by the clock. The player who chooses it chose it twice, after being told what it was.

## 9. The moral questions, asked through play

Four questions run through the night. Nobody states them. HaX refuses to decide for the player, Netherton names costs and never preferences, and Tesseract concedes exactly what was proved and nothing more (SE §1 house style). Each question is asked by things the player does, several times, in different sizes, before the core asks it in full.

**1. Disclosure, hoarding or release?** The finale's educational spine (stage 0 §1).

| Asked small | Asked in full |
|---|---|
| Ghost selling the head start, and whether to let it run to see who buys (§3.2): information as a thing people sell | The database: secure, disclose, wipe (§6.5) |
| Vos reselling Zero Day's early access; arrested Victoria selling his secret; whether to spend it or keep it (§3.5): knowledge used now or hoarded for later | His second claim: "Services like yours hoard. Only a shock fixes it." (§6.3) |
| The schedule's first entries in plain words, and the console tasks: who gets hurt first when it all comes out (§4) | "Show me how it works": release, the key itself (§6.7) |
| The player's own record: m04's disclosure, m02's cover-up, m09's notice | |

**2. Justice or revenge?**

| Asked small | Asked in full |
|---|---|
| The arrested Nightshade's deal: keep your word, or trade with the mole for a better map (§3.1) | The end for him: a public trial, a deal for cells, a shot when he reaches, or a shot when he doesn't (§6.6) |
| Victoria arrested or let walk for Zero Day's order; Vos's name off the report for a lock card (§3.5) | |
| Imran and Gary: charged, talked round, or left in place (§3.3) | |

**3. Is he right?** The night keeps giving him evidence. The pump flaw is real, known for three years and called an asset; disclosing it costs two operations the player knows, so the service's reasons for hoarding are real too; Asante corrected his sums and he signed the old number anyway. The talk-down never asks the player to say he is wrong about everything: each rebuttal takes one claim away (the price, the "only", the clean hands), and he concedes each one exactly. A player who secures the database proves his second claim with their own hand, and the card says so ("still unpatched"). The one outcome his argument can't survive is Scorched Earth, where nobody holds anything, and it costs the player their badge. A player who agrees with him can press the key, and the game lets them.

**4. Loyalty: to HaX, to SAFETYNET, to the team.** The whodunit makes the player suspect the people beside them, at a price if wrong (§5). Netherton signs for whatever the player decides about Nightshade. Victoria, recruited, hedges ("So is everyone."), and the player decides whether a hedging asset is worth keeping. At the core, "[HaX. You're on speaker.]" hands the argument to the person he taught; HaX refuses to choose for the player; and the cold ending is the one choice in the season that HaX and Netherton both refuse to stand behind. Loyalty to SAFETYNET is tested by the database choice: securing keeps faith with the service, disclosing keeps faith with the public, wiping keeps faith with neither, and the service suspends the player for it.

**How it is kept out of lecture.** No character sums up a question. Costs are said in one line by someone with a stake. No ending is called right: every success ending has a cost on screen at 06:00, and Join's casualty curve is shown, not preached.

## 10. How the close reflects the player's choices

The user's test is that the player feels their choices "in who turns up, who helps, who betrays, what's possible, and what's said to them", never as a roll-call. The close keeps to that with four rules:

1. **One consequence, one person, one line.** Each consequence that lands at 06:00 is said by someone with a reason to say it: Quintero about the briefing stance, Kowalczyk about her question, Wendell about the week's pay, Netherton about numbers he signs for. The walkabout is a hub the player chooses from (C19), at most five, so nobody is read out.
2. **Netherton's numbers are the night's, not the season's.** His two lines are tonight's cost (the head start, the partial release or the story, the $12.8M). Earlier missions reach 06:00 only through the people standing there.
3. **The closing card is five fixed lines, in this order** (FA §13 item 36; confirmed): the Architect by ending; the database by `database_outcome`; the head start; the cells (a count and one name); one human line. Join's card is three: "Dr Adrian Tesseract: with you." / "The database: everywhere." / "Every cell has it." The cold card's first line is "shot unarmed".
4. **The credits carry the rest, one clause per person**, in the order the player met them tonight ("In this operation"), then "Elsewhere" for those with nobody in m10 to carry them (arc §11.3). A clause states an outcome, never the choice that caused it ("Imran Siddiqui, the workshop. Kept his phone. Sent a friend home."), so the player connects it themselves.

**The card's human line** (FA §13 item 36): the first that applies, in this order, which is the order of how many people the earlier choice put at risk and for how long the player has carried it:

| # | Line | Applies when |
|---|---|---|
| 1 | Dispatch in eleven counties: "answered every call by seven, after the first patch." on `disclosed`; otherwise "still dropping calls. Day thirteen." | `m07_completed` and Austin never covered |
| 2 | Albion's inquiry: on `full`, "Albion's inquiry asked who funded the plant's security. Parliament answered."; on `partial` with `m04_crew_lost`, "The Albion inquest heard the rest."; on `partial` without, "Albion's half-statement still stands. Nobody audited the other sites." | `m04_completed` and `m04_disclosure_choice` is `full` or `partial` |
| 3 | The forty-seven: how many were reached in time, by FA row 62's conditions | `m05_completed` |
| 4 | Elena Torres: "Elena Torres is in treatment. It's working." | `m05_elena_treatment_funded` |
| – | none applies: the line is left out, and the card runs four lines | |

Dispatch is first because it has run through both missions' briefings as a count of days; disclosing the database is the one choice that ends it tonight, so the card is also where that choice is felt by a player who never sees the patch count. Each of the four is also in "Elsewhere", so nothing depends on being picked.

**Where the $12.8M lands** (FA §13 item 35): see §11.

## 11. FINALE_ARC §13 items for stage 3

Every FA §13 item owned by stage 3 that concerns m10. Items 7 (the Recruiter's choice wording) and the m09 halves of 25 and 38 are m09's stage 3.

| # | Item | Settled as | Where |
|---|---|---|---|
| 11 | Each slot's wording and costs | Every branch of the five scenes has options, gains, costs and who signposts them; four branches gained a real option (§13). | §3 |
| 14 | Disclose's operations and an epilogue beat per database option | One priority list of six operations; disclose burns the first two that apply, secure keeps both and the first rolls up a cell on screen; there are always two. | §6.5, §8.2 |
| 24 | Escaped Victoria without the threat | Her trade, worded; the arrest is cheaper once the head start is stopped. | §3.5 |
| 25 | The Alpha tapes in m10 | Confirmed: an exchange 3 record answer citing his Tomb Alpha teaching notes, on `m09_deck_pulled = alpha_tapes`, now first in slot 4's pool so it always shows; and, from m09 stage 3, HaX's service-door warning at the console, so Quintero takes a free WREN unhurt. The answer cites the notes, so it works whether or not m09 makes the tapes playable (m09's call). | §6.3, §6.4 |
| 27 | Why the branch operations survive the raid | A recruited Victoria who held, or was refused, goes back to Zero Day as if she lost her nerve; one who was trusted blind burned herself. Nightshade's channel survives only where the player held his file in m09 (m09 stage 3 §4.1): he never turned openly, and he stays at the forward post, above ground and out of the guards' sight. Cuffing him tonight ends it; a shown Nightshade has already spent it. | §3.1, §3.5, §6.5 |
| 28 | Where a taken-in Nightshade goes | Placed at the outer lock with Quintero; gives the lock's manual release (a fifth way through). Stays at the lock when WREN comes (Quintero goes in). After the choices he gets his look: on arrest and surrender, at the van window at 06:00, one exchange ("You wrote me as a line item." / "You were a good one."); on justified lethal, brought to the console, one line ("*pause* Smaller than I remembered."); on Scorched Earth, at the empty chair ("He left by a door. He always did."). Not on the cold ending or Join. Netherton has already said what it costs: he has to disappear afterwards. | §3.1, §8.2 |
| 29 | WREN on the Join path | Checked against the three steps: she never comes while the player is on them; she comes as normal at "Stop it" if the player stepped back. | §6.4 |
| 33 | The invoice and refusing's clean record | Confirmed both. The invoice is a ledger sting in the Recruiter beat after his evidence. The clean record is an exchange 2 answer in slot 4, after `m09_albion_notified`; where that hides it, he says it himself in the Recruiter beat, so it is paid once on every refusing save. | §6.2, §6.3 |
| 34 | Surrender's two cells | The first two that apply, in this order: (1) Zero Day, if it took the head start; (2) Ghost's buyers, if they took it; (3) the m07 cells left running, with `m07_completed`, in the closing card's own m07 order (FA §4.6); (4) Zero Day, if not already counted; (5) Critical Mass. His protocol is tonight's contact list (who was paid, who took the push), so it hurts most where the player's earlier choices left a cell running: a surrender partly repairs the season's losses. The card names the second. | §6.6 |
| 35 | The $12.8M | Flipped on one ending, kept on the rest. Default: "The twelve point eight million goes back to the victims' fund. I have signed for that as well." On `secured`: "The Council is keeping the twelve point eight million with the copy, as evidence. I argued for the victims' fund. I lost." The instinct that keeps the map keeps the money, and the player hears it from the man who signed for both. Only on `m06_assets_seized`. | §10 |
| 36 | The closing card's human line, and the card's order | Card order confirmed (Architect, database, head start, cells, human line). Human line: dispatch, then Albion's inquiry, then the forty-seven, then Elena Torres. | §10 |
| 37 | The cold choice's wording, both menus | Confirmed: "[Shoot him where he sits.]" / "[Shoot him where he stands.]", always last; the narrator's warning; "[Do it.]" / "[Lower the weapon.]"; lowering removes the option. | §6.6 |
| 38 | m09 choices handed on (m10's half) | The cage bin carries through m09 stage 3's new export `cage_bin`: Derek's file is an exchange 1 answer (slot 4, after bed four); the letters a HaX line in the media room (or at the draft's prop if the room is cut); Nightshade's copy one line at the door. Accepted as m09 wrote them. Whether talk stops Sorensen and W-26's fifth Reading note are m09's. | §6.3 |

## 12. State table

Every global the choices set. Names are working names (stage 4 fixes them; exports keep FA §3.5's names once stage 9 adds them). Each needs all three legs (README_ink_best_practices: set, declare in `globalVariables`, `VAR` in every ink file that reads it), and each is read somewhere; the "Read by" column is the proof. None is in `concludeRequires`; the three done-flags are the only ones in an `unlockCondition`.

**Exports** (FA §3.5; for a later season, nothing reads them yet):

| Global | Values | Default | Set where | Read by (in m10) |
|---|---|---|---|---|
| `ending` | `arrest` / `surrender` / `lethal` / `executed` / `scorched` / `joined` | `""` | C17, or the Join key, or "wipe both" | ending scene, 06:00, card, credits title, music |
| `database_outcome` | `secured` / `disclosed` / `both_wiped` / `published` | `""` | C16; `published` on the Join key | 06:00 beat, card, dispatch line, $12.8M line |
| `sleeper_caught` | bool | `false`; `true` at start on `m09_sleeper_named` | a right accusation, face to face or on the line | core (WREN beat), 06:00, credits |
| `wrong_accusation` | bool | `false` | any wrong accusation; stays true after a recall | 06:00 walkabout, credits |
| `head_start_out` | `none` / `zero_day` / `ghost` / `both` | `""` | as the outer lock opens: `none` if `head_start_stopped`; otherwise Zero Day unless its share was stopped (`victoria_gallery` in `confronted` / `talked_down` / `walked`, or `vos_secret_used`), plus Ghost unless `ghost_sale = stopped` | Netherton's numbers, card, surrender's cells |
| `partial_release` | `none` / `small` / `large` | `none` | "Stop it": `small` on the redirected channel left open, `large` on the uncovered one left open | HaX at 06:00, Netherton's numbers, card |
| `media_story_ran` | bool | `false` | `true` when the live story is never killed; `true` on `executed` whatever happened | Netherton's numbers, cold ending, credits |

**Done-flags** (the only globals in an `unlockCondition`; local, every branch sets them):

| Global | Set | Unlocks |
|---|---|---|
| `door_scene_done` | last choice of the door scene, every branch | the breach (with flag 1) |
| `ghost_call_done` | last choice of Ghost's call, every branch | the security office's stair down |
| `victoria_line_done` | last choice of arrested Victoria's call | nothing; stops the re-ring |

**Local decision globals:**

| Global | Values | Default | Set where | Read by |
|---|---|---|---|---|
| `quintero_stance` | `quintero` / `netherton` / `""` | `""` | C1 | outer lock, 06:00 |
| `nightshade_taken_in` | bool | `false` | §3.1 shown branch | outer lock, core, 06:00, database list, credits |
| `payment_checked` | bool | `false` | §3.1, the table check | tunnel door, HaX |
| `tripwire_tripped` | bool | `false` | the tunnel's inner door | security office, WREN timing (arc §8.5) |
| `nightshade_cuffed` | bool | `false` | §3.1 not-shown branch, second decision | database list, credits |
| `nightshade_deal` | `taken` / `refused` / `""` | `""` | §3.1 arrested branch | tunnel camera, clue 2 helper, outer lock, credits |
| `nightshade_tethered` | bool | `false` | §3.1 silent branch | blast door, Arakawa's placement, accusation costs |
| `arakawa_call` | `let_go` / `told_off` / `asked` / `""` | `""` | C3 | credits, recall line |
| `ghost_sale` | `stopped` / `bait` / `selling` | by branch on the call's first line | §3.2 | `head_start_out`, card (bait), database list |
| `ghost_gift` | `window` / `blind` / `declined` / `""` | `""` | §3.2 refused branch | outer lock, the next room's camera, Ghost's text |
| `ghost_answer` | one value per answer on the kept and refused branches | `""` | §3.2 | Ghost's 06:00 text |
| `imran_outcome` | `phone_left` / `phone_taken` / `taken_in` / `card_cloned` / `ko` | `""` | §3.3 | power-room door, clue 3 pointer, gallery guard count, credits |
| `gary_outcome` | `talked_round` / `left_in_place` / `taken_in` / `ko` / `""` | `""` | §3.3 unprotected branch | power-room door, exchange 3 pool, credits |
| `voltage_outcome` | `his_hands` / `by_hand` / `stood_down_print` / `talked_down` / `fought` / `""` | `""` | §3.4 | shutter, exchange 3 pool, credits |
| `wendell_outcome` | `told` / `worked_round` / `ko` / `""` | `""` | §3.4 default branch | 06:00, credits |
| `dale_rang` | bool | `false` | §3.4 | server-hall alert, credits |
| `gallery_camera_blinded` | bool | `false` | §3.4, any by-hand cut | gallery guards' alerts |
| `asante_outcome` | `talked` / `ko` / `left` / `""` | `""` | C7 | credits |
| `asante_confirmed_sheet` | bool | `false` | C7 | exchange 1 rebuttal's decoded form |
| `victoria_line_deal` | `deal` / `no_deal` | `no_deal` on the call's first line | C8 | credits, Zero Day's line |
| `vos_secret_known` | bool | `false` | C8, on the line that tells it | gallery options |
| `vos_secret_used` | bool | `false` | §3.5 arrested branch | Zero Day's share, 06:00 |
| `victoria_gallery` | `confronted` / `trusted` / `refused` / `talked_down` / `ko` / `walked` / `arrested` / `""` | `""` | §3.5 | Zero Day's share, the database list, the Zero Day tap, 06:00, credits |
| `vos_outcome` | `bought` / `refused` / `talked_out` / `stood_aside` / `ko` / `""` | `""` | §3.5 | credits' Zero Day line |
| `head_start_stopped` | bool | `false` | C9 | `head_start_out`, Ghost's bait, Vos's talk-out |
| `backdoor_closed` | bool | `false` | C10 | `partial_release` |
| `media_story_killed` | bool | `false` | C11 | `media_story_ran` |
| `accused` | `kowalczyk` / `quintero` / `malhotra` / `arakawa` / `vector` / `phantom` / `""` (the last named) | `""` | §5 | team staging, core, 06:00 |
| `officer_out` | the name of an officer sent back and not recalled, or `""` | `""` | §5 (wrong accusation; cleared on recall) | per-room staging, HaX's jam room, core, 06:00 |
| `kowalczyk_answer` | `bench` / `briefing` / `worked_out` / `""` | `""` | C18 | her 06:00 reply |
| `exchange_1`, `exchange_2`, `exchange_3` | `rebuttal` / `record` / `miss` | `""` | §6.3 | his openers for the next claim |
| `points_landed` | 0–3 | 0 | §6.3 | step 5's menu, the core's music |
| `console_choice` | `stopped` / `joined` / `""` | `""` | C15 | the core |
| `join_step` | 0–3 | 0 | §6.7 | his step 5 line |
| `cold_lowered` | bool | `false` | §6.6, "Lower the weapon." | removes the cold option |
| `teaser_enabled` | bool | `false` | set by the user later (FA §7) | the credits sequence |

The countdown objects' global and its step values are stage 4's (FA §4.2).

**New imports this stage takes up** (§14): `m09_cage_bin` (`derek_file` / `letters` / `nightshade_copy` / `""`), Tier 2, the export m09 stage 3 proposes.

## 13. Dominated and unforced choices found, and the fixes

Checked against rule 1.1 (no dominated option), rule 1.5 (forced, or optional with a warned cost) and `mission-puzzle-chains` §3a. "Was" is stages 1–2 as written.

**Dominated options**

| # | Choice | Was | Fix |
|---|---|---|---|
| D1 | Ghost, broken / unanswered / stranger | "talk Ghost out, or leave it": leaving it bought nothing | Leaving it becomes a bait ("I want to see who's buying"): stopped later at the console, it catches the buyers (one more cell on the card). No bare "hang up" button. |
| D2 | Kept Nightshade, not shown | "accept or check": checking was always better, so it wasn't a choice | The check becomes a player action (a trust test, rule 1.2), and the branch gains a real decision after the lie is out: cuff him and end the channel, or keep a liar's channel. |
| D3 | Arrested Nightshade | refusing cost one camera and bought nothing | Refusing keeps the player's m08 word and removes the wrong entry, so there is no tripwire risk; the deal's map is fuller but carries it. |
| D4 | Captured Voltage | "by hand" was slower and safe, while trusting him was never punished | By hand gives the player the gallery camera switch; his hands give speed, the inquiry ask and an exchange 3 answer. Extended to every by-hand cut. |
| D5 | Recruited Victoria | confronting her beat both other options | Confronting costs the Zero Day tap (she has seen what we read); trusting her opens the lock at once and keeps the tap, at the price of the alarm and her watch; refusing keeps both operations at the price of the long way. HaX's last line names the tap cost. |
| D6 | Escaped Victoria, with the threat | the knock-out (arrest) beat the talk-down (she leaves) | Talked down, she cancels Zero Day's order as she goes. Both escaped branches now ask justice for her against the cells' head start. |
| D7 | Arrested Victoria's line | she tells the secret either way, so "no deal" beat "deal" | The deal keeps her talking after tonight (Zero Day's London book); no deal keeps her full sentence. |
| D8 | Arrested Victoria's secret, in the gallery | withholding it bought nothing | Kept, it is leverage Netherton holds on Vos for later. |
| D9 | Unprotected Gary | cloning his card and walking past bought nothing | Leaving him in place keeps a man on their bench who ships nothing, which HaX names as worth something later. |
| D10 | Imran's phone, and taking him in | "phone taken" and "taken in" had the same costs | Taken in adds his statement and costs his freedom; phone taken keeps him uncharged. Each of the three is best on one count. |
| D11 | Wendell | "work round him" bought nothing | It gives the gallery camera (D4). |
| D12 | Surrender against arrest, two or more points | surrender bought cells and cost nothing | Surrender is a deal with no public trial; arrest is a public trial with no cells. Netherton says so before the menu. |
| D13 | Wipe both | its gain was never said, and its costs (his escape, the suspension) were a surprise | Netherton states the gain (nobody holds or sells the map again; the one outcome his argument can't win) and the suspension; HaX names the purge rule at flag 4. |
| D14 | Hold fire against fire | the player had no basis for the gamble | HaX's "I can try to kill the feed. Try." at flag 4 is the basis. |
| D15 | Ghost, refused: take the gift or not | declining bought nothing | Taking a gift lets Ghost see the route; declining earns respect and a different goodbye. A stance-weighted gain, kept small on purpose. |
| D16 | Shown Nightshade: stay or come | once m09 stage 3 made the shown file spend his channel, "stay at the post" would have bought nothing | Staying keeps him safe and on the trial's witness list; coming gives the lock and his look at Tesseract, and he has to disappear afterwards. |

**Hidden options** (an option that can never appear is a broken promise, npc-dialog-review §2d.3)

| # | Where | Was | Fix |
|---|---|---|---|
| H1 | Exchange 3's record slots | on every m09 save, HaX's slot and "HaX's meaning of the line" (`m09_completed`) filled both, so `m09_deck_pulled`, `m09_reading_finished`, Voltage and the talked-round technician never showed | Slot 4 is the player's own acts, most specific first; HaX's meaning is the last fallback (§6.3). |
| H2 | Exchange 2's clean record | ranked fourth of four, so a full-disclosure, notice-sending player never saw it, breaking m09's "refusing is paid once" | Slot 3 is earlier missions, slot 4 is Helena; where the notice still hides it, he says it for the player in the Recruiter beat (§6.2). |

**Unforced choices**

| # | Choice | Was | Fix |
|---|---|---|---|
| U1 | Ghost's call | could be skipped by walking on (nothing waited on it) | The security office's stair down waits on `ghost_call_done`; the call re-rings by rule 1.7. |
| U2 | The door scene | "the first thing the player does", but nothing held them there | The breach waits on `door_scene_done`. |
| U3 | Arrested Victoria's line | could be closed and forgotten | Forced by re-ring; not gated (gating it would turn an import into a lock), and an unfinished call leaves the gallery on its default. |
| U4 | The accusation | optional, and the cost of not accusing was never said | Netherton at the aside: "Find them before you get there."; HaX's third-clue nudge says it is the player's call. Kept optional. |
| U5 | The console tasks | optional | Kept optional and warned twice; they now pay back elsewhere (D1, D6, Vos's talk-out). |

Already sound and left alone: the gallery, the workshop and power room (forced by their doors and the shutter), the core's four menus (each waits on the last), the cold choice's two steps, and Join's three.

## 14. Proposed changes

None is made here. "m10 s1–2" marks a change to this mission's stage 1–2 documents, which this file overrides from stage 4 on; stage 7 writes the lines either way.

**FINALE_ARC (arc-keeper)**

| # | Change | FA sections |
|---|---|---|
| P1 | Zero Day's share is also stopped by an escaped Victoria **talked down** (she cancels the order as she leaves). | §4.2 table, §4.4, §4.6 head start |
| P2 | Recruited Victoria: confronting her costs the Zero Day broker tap; trusting her blind opens the lock at once and sells the raid; refusing keeps both operations. HaX's last line before the jam names the tap cost. | §4.4, row 32, §5.4 |
| P3 | **One priority list of six operations** for the database choice (§6.5): Victoria's watch, Nightshade's channel (held file only), the HashChain tags, the Critical Mass watch (notice not sent; m09 stage 3), the watch on Ghost's buyers, the Zero Day tap. Disclose burns the first two that apply; secure keeps both and the first rolls up a cell. | §4.1 step 4, §4.6 database beats |
| P4 | **Surrender means no public trial**; arrest means a public trial and no cells. Netherton says so before the step 5 menu. | §4.1 step 5, §4.5, §4.6 |
| P5 | Step 0: HaX's "I can try to kill the feed. Try." and the purge-rule line at flag 4 (the signposting for justified lethal and Scorched Earth). | §4.1 step 0 |
| P6 | Exchange record slots get their own pools (§6.3); exchange 3's slot 4 is the player's acts, most specific first, with "HaX's meaning of the line" last; two new answers (Derek's file under the first claim, m09's wording; captured Voltage's switching under the third). | §4.1 table |
| P7 | **The Recruiter beat** after his evidence: `recruiter_secret` to HaX, then the invoice sting, or the clean record said for the player when it isn't on their menu. | §4.1 step 1, §3.2 |
| P8 | Add `m09_cage_bin` to m10's Tier 2 imports (m10 66 variables); m09 exports ten (with m09 stage 3's proposal). | §3.2, §3.4, §15 counts |
| P9 | The $12.8M: victims' fund by default, the Council keeps it on `secured`. | row 80, §4.6 |
| P10 | Closing card: human line order dispatch, Albion, the forty-seven, Elena Torres (dispatch's line by `database_outcome`); Join's card is three lines. | §4.6 |
| P11 | Nightshade: shown, his channel is spent (m09 stage 3), and stay-or-come trades his safety and testimony against the lock and his look; the not-shown branch's cuff-or-leave decision; the arrested refusal has no wrong entry (so no tripwire), the deal's wrong entry can trip; a taken-in Nightshade is at the outer lock with Quintero, gives its manual release, and gets his look at Tesseract by ending. | §4.4, rows 105, 107, §5.1, §13 item 28 |
| P12 | The outer lock has five ways through (adds the taken-in Nightshade's release). | §4.0 route, §4.4 |
| P13 | Ghost: the bait option and its catch on the card; the refused branch's gift can be declined. | §4.4, row 15, §4.6 cells |
| P14 | The power room's gallery camera switch, for any by-hand cut. | §4.4 power room |
| P15 | The workshop: unprotected Gary can be left in place; Imran's three outcomes. | §4.4 workshop, row 23 |
| P16 | The aside: Netherton's "Whoever it is wants the same room you do. Find them before you get there." | §4.0, row 117 |
| P17 | Two new done-flag locks: the breach waits on `door_scene_done`; the security office's stair down on `ghost_call_done`. | §4.0 route, §6.1 phone rule |
| P18 | The cold choice: "Lower the weapon." removes it; the button is always last. | §4.1 step 5 |
| P19 | `join_step`: asking for the key and stepping away is paid once, by his step 5 line. | §4.3 |
| P20 | §3.5's "local decision globals" sentence points at this file's §12; §13 statuses for items 11, 14, 24, 25, 27–29 and 33–38 point at §11 here. | §3.5, §13 |

**m09 (m09 author)**

| # | Change |
|---|---|
| P21 | m09 stage 3's `cage_bin` export, the shown-file channel cost, the Critical Mass watch and the Alpha tapes' service-door warning are all taken up here as m09 wrote them (§3.1, §6.3–6.5). Its optional arrested-branch help from Nightshade's copy (he names the wrong entry himself) is accepted: on `m09_cage_bin = nightshade_copy` and the deal, there is nothing to check. |
| P22 | m09's "refusing earns a clean record that m10 pays once" now holds on every refusing save (§6.2); no m09 change needed, noted so m09's stage 3 can say so. |

**m10 stages 1–2 (m10 author; applied from stage 4 on)**

| # | Change | Where |
|---|---|---|
| P23 | The five scenes' decision columns follow §3 (P1, P2, P11, P13–P15, D7, D8). | arc §7.1–7.5 |
| P24 | SE §2.3's slot lists follow §6.3; the two new answers and responses; SE §2.2 gains the Recruiter beat's clean-record line. | SE §2.2, §2.3 |
| P25 | New sample lines: HaX at flag 4 (two); her extended last line before the jam; Netherton's step 5 line, the aside sentence and the cuff-or-leave line; Victoria's "I don't leave people presents." and her line's resume line; Ghost's bait responses and texts; Gary's and Imran's reactions; Voltage's offer; Quintero's lock and 06:00 lines by stance; Kowalczyk's three replies; Nightshade's three looks. | SE §3 |
| P26 | Surrender's 06:00 beat adds Netherton: "There will be no trial." | arc §10.3 |
| P27 | The outer lock's ways through gain the fifth. | arc §9.2 |
| P28 | The card's human line order and Join's card. | arc §11.1 |

**Stages 4–5 (engine checks)**: the two new done-flag locks; the duty handset as a clickable resume; a one-option "[Stop her.]" beat; the cold option removed after lowering; the panel's gallery-camera switch as an object; reload-mid-call for both phone scenes (FA §6.1).

**For the user** (each has a default above; none blocks stage 4):

1. Surrender now means a deal with no public trial (P4). It gives arrest a real reason, and it changes what "surrender and cooperation" says about him.
2. The $12.8M stays with the Council on `secured` (P9), so Netherton loses one argument in the epilogue.
3. "Lower the weapon." removes the cold option for the rest of the scene (P18). The alternative is to leave it on the menu with the warning played again.
