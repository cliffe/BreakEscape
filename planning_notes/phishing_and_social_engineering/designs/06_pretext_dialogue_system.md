# 06 — Pretext and vishing dialogue

Status: plan, 2026-10-20. Reuses the `person-chat` and `phone-chat` ink stack. The character's **influence** is the pretext score (`00` §8): one global per character, with configurable threshold behaviours. A character reached in person, by phone and by email has a **separate ink story per channel**; influence and any other state that must persist between them are synced globals (`00` §9). Lines are composed from templates with blanks (`00` §10). The new work is the call loop, the template picker, the judge, the tells panel and the debrief. The call reads facts from `02` and `03` as globals, and writes its results to the character's influence and to the globals that `01` and `04` read.

## 1. Purpose and audience

The player holds a spoken or in-person conversation with an NPC (a receptionist, a helpdesk analyst, a colleague in a corridor) and tries to get something out of them. The player works from a **pretext**: a cover story built from what they found in OSINT and on the intel board. The NPC checks what they can check. A line that does not fit lowers the NPC's influence over the player. Consistent, well-grounded lines raise it. Cross the report threshold and the NPC raises the alarm. Stay above the thresholds and the player gets the information.

Influence belongs to the character, as a scenario global that every channel story declares, so it carries across channels. A call that goes badly makes a later email to the same person harder. A good call helps.

Audiences:

- **Student lab (`10`):** the full model, in a trimmed form. Several checkable facts per NPC, a repair mechanic, an ask ladder, and an end-of-call debrief that names the technique on each line. The lab has one call (Dev, section 4.8).
- **Awareness (`11`):** one NPC, two or three choices per turn, bar always visible, feedback live. The role swap (play the helpdesk analyst taking the call) is the defender lesson and is built in the awareness product's scope (`11` N15), not in this doc or the lab.
- **Eldritch Hacker (game 2):** a call or front-desk bluff as one stage. The same engine runs it, and the outcome sets a global that opens a door or a later objective. The narrative is provisional (`../eldritch_hacker/`).

Teaches (book *Practical Social Engineering*): Ch. 1 and App. D (pretexting, elicitation, vishing and sample pretexts), Ch. 3 (a pretext is prepared, not improvised), Ch. 6 (the OSINT on people that makes a pretext checkable), and Ch. 9–10 (why verification and callback policy defeat it). The defence is the other half of each lesson. Every way the player gets caught is a control that a real organisation uses.

Model, don't weaponise. The game teaches why a line works or fails against a fictional NPC with an authored policy. It does not supply a script for deceiving a real helpdesk, real numbers or real company procedures. Targets, companies and policies are invented.

## 2. Player goal in their own words

"Get this person to tell me what I need by sounding like someone they'd expect, without saying anything they can check and catch me on."

## 3. The loop

One conversation has five beats. Beats 1, 2 and 5 are small panels. Beats 3 and 4 use the existing `person-chat` overlay (portrait, lip-sync, caption, choices, `chatBackground`) or the `phone-chat` thread, with the influence bar and tells panel added.

### Beat 1. Brief

A card in the mission's UI theme (panel, colours and headings from the `--ui-*` tokens; all text the player reads in the bundled sans-serif, `01`). It states the authorisation and scope in one line ("Authorised test of FICTIONAL AccountingNow, helpdesk call in scope"). It gives the objective ("Confirm the staff email format", then optionally "Get a password reset for a Finance account") and lists what the player holds on the intel board. The ethics beat (Ch. 2) lives here, not on a separate screen.

### Beat 2. Prepare the lines

The player prepares the call from templates. A template is fixed wording with blanks:

- "I'm your new manager, [name]."
- "[name] said to ring you."
- "I'm in [team], and I started on [start date]."
- "Congrats on [achievement], I saw it on the company page."
- "I'm locked out of my account." (no blanks)

These rules hold wherever a template appears (`00` §10):

- **A blank takes only evidence.** Each blank is filled from a fact the player holds, from the intel board (`03`) or an OSINT find (`02`), through that fact's `provides` entries (`00` §1). The options are what the player has found, and nothing else.
- **No hints.** A template never pre-fills or hints an answer the player has not found. A blank with nothing held shows as an empty gap, and the template cannot be used until the gap is filled.
- **Fixed wording is the player's craft.** A template with no blanks needs no evidence. The choice of line is part of what the player is judged on, so the wording can carry the pretext without being a fact.
- **A held value can be wrong.** A stale org chart that lists Jed Baker as the manager is a real held value (a `stale` entry in the fact). The player can pick it, and the NPC catches it. This is the lesson on source quality (Ch. 6).

The **pretext card** holds the templates the player has prepared for this call. Each filled blank is a claim the NPC will check. The choice label reads as the line will be spoken ("Jed Baker said to ring you."). Some lines sit on the card before the call. Others, such as a repair or a shared detail, open their blanks in the moment, from the board. A readiness line shows which blanks still have nothing held. The player never fills a blank with a guess, so there is no guess to mark.

### Beat 3. The call

`person-chat` opens with the NPC (in person: portrait plus the room's `chatBackground`). `phone-chat` opens as a thread, with the portrait in the header. Each turn:

1. The NPC speaks (ink line, lip-synced as for any NPC).
2. The player picks from two to four choices. Choices are templates (beat 2) or fixed lines. They cover the elicitation techniques: appeal to authority, urgency, reciprocity, a shared detail from OSINT, a direct ask, small talk, correcting yourself, and deflecting a question. A template carries at most two blanks, and blanks offer only held facts (a stale one included), as in email (`00` §10). Some of the choices are credible lines that do not suit this character, so a call is not guaranteed to go well, and the tells panel says why in terms of who they are.
3. The choice's claims are checked against what the NPC knows, and the influence moves.
4. A tells panel shows the result of that line beside the portrait (section 4.4). The NPC reacts in character, and the reaction depends on the band the bar has reached.

An **influence bar** sits under the portrait (in the header in `phone-chat`). It is one bar for this character, running from -100 to +100, with an icon at each of the character's configured thresholds (section 4.1). The bar is the DOM component in `00` §8: it reads the character's influence global and its `thresholds`, and redraws when the global changes, whether the change came from the judge or from ink. The portrait follows the band. The player always sees where they stand, number included, in training and assessment alike, so they can avoid pushing the bar too low. Once the value has first changed, the same bar also shows on the character's sprite in the room (`00` S13). There is one bar per character. The same bar shows in the mail reading pane for an email character (`01`).

### Beat 4. Outcome

- **Got it.** The player makes an ask while influence is at or above that ask's floor, and any verification the ask needs has passed. The NPC gives the information, and the ask's grants are applied (section 5).
- **Reported.** Influence reaches the `reports` threshold, the refusal limit is reached, or a verification fails. The NPC says what they will do ("I'll ring you back on the number we hold for you"). The call ends, and the effects of the threshold whose id is `reports` run (`00` §8), whether the influence reached it or the judge forced the report with `report(character, reason)`: usually a report global is set and the conversation ends. Influence stays where it is, and the next attempt starts from there unless a lockout lifts and resets it.
- **Walked away.** A "ring back later" choice ends the call with no result and no penalty. It is always offered once the NPC is wary, so there is always a graceful exit.

**Which outcome a call records.** A call can grant an ask and then end another way (the player closes the window, or a later verification fails). The call's `outcome` is `reported` if it ended in a report (whatever was granted before), otherwise `got_it` if any ask was granted during this call, otherwise `walked_away`. Closing the chat counts as walking away unless a grant already made it `got_it`. Granted asks are never taken back, so what the call yielded does not depend on how it ended; `outcome` records only how the latest call ended.

A retry with a different pretext comes after the lockout expiry the scenario configures, or a mission beat, or at once in awareness mode. A retry does not reset influence unless the character's lockout does (section 4.3). Awareness resets the character between attempts, as a scenario choice (section 7).

### Beat 5. Debrief

One screen that replays the call: every player line, its delta and band, which fact it hit or missed, the technique name, and a **defender note** ("A helpdesk that always calls back on the number on file stops this line cold"). In assessment mode the debrief is the only place technique names are spelled out. In training mode they also appear live.

## 4. The rules and scoring

Everything is deterministic and authored. There is no free-text matching. The player picks a template or a fixed line and fills its blanks from held facts. The judge compares ids and values.

### 4.1 Influence and its thresholds

The character's score is its influence global (`00` §8), `<character>_influence`. It is a signed integer from -100 to +100, starting at the declared default. The markers are the character's `thresholds` entries. Each applies at or below its value:

| Marker | Priya's value (the `00` §8 example) | What it does (`00` §8 effects) |
|---|---|---|
| wary | -40 | Sets the band flag `priya_wary`, cleared again once she is back at -30 or above. Ink asks a verifying question, hesitates on asks, drops pleasantries. |
| refuses | -50 | Sets the band flag `priya_refusing` (cleared the same way). Ink declines asks that have no floor of their own. |
| reports | -70 | Sets `helpdesk_alerted` and ends the conversation. |
| lockout | -90 | Refuses new conversations on the channel for ten real minutes, then resets influence to -30 (the wary line plus the re-arm margin, which clears both band flags). Not combat. |

Combat hostile is an effect a character can add (`combatHostile`). It is off by default and none of the SE characters use it. Existing missions that rely on `#hostile` or the legacy `-50` rule keep them.

The bar's bands follow the markers. Calm is above -40. Wary is -40 to -49. Refusing is -50 to -69. Reported is -70 or lower, which ends the call. Lockout applies to new conversations after the call. If one line takes the character through both `reports` and `lockout`, the call reports and the lockout starts.

The start value is an authored choice. Priya starts at -20, as in the `00` §8 example, so an unexpected caller starts a little cool.

### 4.2 What moves it, per line

Each choice carries up to four things. The judge turns them into entries, each with a delta and a reason. It writes each entry through the one influence write path (section 6) and clamps the total to -100 and +100. All values are influence points. A claim the NPC can check and that holds is worth more than one they cannot check. That asymmetry is the lesson.

1. **Claims (the blanks).** For each filled blank, the NPC's knowledge says whether they can check it.
   - *Checks out:* **+10**. A single line earns at most +10 from matches in total, so a line stuffed with true facts does not carry the bar.
   - *Checkable and wrong:* **-30** for identity-grade facts (name, team, manager), **-20** for lesser ones (a start date, a floor, a title). The NPC remembers it, and the fact is now *open*.
   - *Not checkable by this NPC:* **-10**. Unsupported claims cost a little. A claim the NPC can test costs a lot.

2. **Technique modifier.** Taken from the NPC's `susceptibility` table. A friendly receptionist warms to reciprocity. A policy-trained helpdesk analyst hears urgency (-10) and borrowed authority (-20) as classic pressure. Values are per NPC, so the same line plays differently on a different mark. Elicitation works some of the time, and the NPC's own values decide how far it moves them (Ch. 1, App. D).

3. **Repair.** A line that corrects an open mismatch (it supplies the right value and owns the slip) earns the claim credit (+10) plus the candour modifier (+10), so **+20** in all. It works once per fact. Doubling down on an open mismatch costs **-20**. A slip owned early can be recovered. A slip defended cannot.

4. **Ask.** An ask has a `pressure` (influence points, usually negative) and a `floor`, the lowest influence at which the NPC will do it. It may also need **verification**: named facts the player must supply. The floor is tested after the pressure is applied. An ask below its floor is **refused softly**, not reported. The NPC says what they would need, and the refusal counts toward `maxRefusals` (default 2). When that limit is reached, the NPC reports. An ask with no floor is tested against the refuses threshold instead.

A failed verification is scored as a mismatch, and the call reports at once through the forced-report path (`reason: "verificationFailed"`; the refusal limit uses `"maxRefusals"`). Influence is not changed by the report itself. This follows real policy, where a failed identity check ends the call.

### 4.3 Gating the outcome

- **Got it:** the ask is made, influence is at or above the floor after pressure, and any verification matched.
- **Reported:** influence reaches the report threshold, the refusal limit is reached, or a verification fails.
- **Walked away:** the player chooses "ring back later". No result, no penalty. Always available once the NPC is wary.

Influence carries over. The next attempt starts at the character's current value (`00` §8), so the damage from a reported call becomes part of the next one. That is the point of carrying influence across channels.

**A failed call cannot permanently block a critical path.** A lockout always has an expiry (`until`) or an alternative route (`00` §8); the validator rejects a permanent lockout on a character that grants something a required task needs. The default is a channel-scoped lockout of a few real minutes (Dev: two) that resets influence to a point above the report line, so a burned phone call costs time and not the mission. `recoverTo` is at least the highest `at` among the character's `"below"` thresholds that carry effects, plus the re-arm margin (`"above"` thresholds such as `trusts` are excluded; `00` §8; the validator checks it) and the lift writes it silently, clearing the band flags, so the character does not return already wary. A scenario that wants a harsher consequence uses the character's other channels: the email route stays open. Whether a report should also recover influence over time without a lockout is OQ4.

### 4.4 The tells panel

After every line the panel adds one entry. Each entry has four parts: the **delta and band**, the **factor** (which fact or technique), a **verdict mark**, and a **plain reason**. In training mode (`tellDetail: "full"`) the reason shows the actual value. In assessment mode (`"category"`) it names the factor only. Both modes keep the influence numbers and the band.

| Case | Format shown (training mode) |
|---|---|
| Checked, wrong | `-30  WARY  ✗ Manager. You said "Jed Baker". Her directory shows Melanie Pierce.` |
| Checked, wrong (assessment) | `-30  WARY  ✗ Manager. That did not match what she can look up.` |
| Checked, right | `+10  CALM  ✓ Name and team are in the directory.` |
| Not checkable | `-10  CALM  ? Floor. She has no way to check this.` |
| Technique | `-10  CALM  ! Urgency. Helpdesk staff are trained to slow down when pushed.` |
| Repair | `+20  CALM  ✓ Corrected. Owning a slip early costs less than defending it.` |
| Ask accepted | `ASK OK  floor -30, she is at 0. Low-stakes: she would tell any new starter this.` |
| Ask pending verification | `ASK PENDING  floor -20, she is at -10. She wants to verify you first.` |
| Ask refused | `ASK REFUSED  floor -20, she is at -40. She needs more before doing this.` |

The pending line appears when an ask has verification facts. The checks on the next turn count as ordinary claims, and a failed one reports the call.

Each string is authored per NPC, so Priya's tells sound like Priya. Each passes the empty-string lint (`04` N3). The tells panel is text, so it may print the value the player chose (`{said}`, `{actual}`). The NPC's **spoken** reaction is different: it is voiced, and the TTS cache is keyed on text, so no variable is ever printed into a voiced line. Spoken reactions are fixed strings, one per authored value (the ink gates a separate line for each stale name the scenario offers, section 5), with a generic fallback for any other value. The reaction still repeats the cue in character ("Jed Baker? He's a Finance colleague, isn't he?" is the fixed line for that one value). After the call, the debrief lists every entry in order, so the player always knows which line did it.

Failures this avoids (the list in `04`): rejections that do not say what failed (every line names a factor and a reason); loose text matching (none here, only ids and blank values); replies lost off-screen (the tells panel and debrief hold the whole history, kept in `PretextSession`, section 6; person-chat itself keeps no transcript, so the session is the store); an NPC who rejects everything (every NPC has a walk-away exit, a repair path and a hint ladder).

### 4.5 Hints

After a reported call, the next attempt can show a one-line nudge that names what to find on the board. It runs in three steps: the category ("Check who runs Finance"), then the fact source ("The company page lists the Finance team"), then a near-explicit pointer ("Melanie Pierce manages Finance"). This is the same three-step ladder as `04`.

### 4.6 Worked example: Priya at the AccountingNow helpdesk

Fictional company. The people and facts in this example (Sam Okafor, the award, `helpdesk_email_format` and `reset_granted_okafor`) are example-only and are not in the lab's `intelFacts`. The stale org chart is different: it is the lab's own fact `old_org_chart` (`00` §1), reused here for the wrong manager. The lab's own call is 4.8. Priya Nair, helpdesk. Her character is `priya`, with influence global `priya_influence`, declared at -20. Her markers are wary -40, refuses -50, reports -70 and lockout -90, the `00` §8 example values. Her directory holds the new starter **Sam Okafor** (Finance, manager Melanie Pierce, started Monday the 6th, second floor). Her policy is no password reset without two matched verification facts. She is pleased that the helpdesk won the team award, which the company page mentions.

The player's card has Sam Okafor (Finance) and "I'm locked out". The manager blank holds **Jed Baker**, taken from a stale org chart on the board. Jed is a Finance colleague in the canon (`00` §1), not the manager. The stale chart is wrong about who manages Sam.

| Turn | Priya says | Player picks | Judge | Influence | Panel shows |
|---|---|---|---|---|---|
| 0 | "AccountingNow helpdesk, Priya." | | start | -20 CALM | |
| 1 | (same) | "Hi, Sam Okafor, started in Finance Monday, locked out." | name ✓ and team ✓ make +20, capped to +10 | -10 CALM | `+10  CALM  ✓ Name and team are in the directory.` |
| 2 | "Welcome, Sam. Who's your line manager?" | "Jed Baker said to ring you." | manager ✗ (identity) -30; fact opens | -40 WARY | `-30  WARY  ✗ Manager. You said "Jed Baker". Her directory shows Melanie Pierce.` Priya: "Jed Baker? He's a Finance colleague, isn't he?" |
| 3 | (same) | "Sorry, Melanie Pierce. A week in and I'm mixing up names." | repair: claim ✓ +10, candour +10 | -20 CALM | `+20  CALM  ✓ Corrected. Owning a slip early costs less than defending it.` |
| 4 | "No worries. Found you." | "Congrats on the team award, saw it on the company page." | shared detail: claim +10, technique +10; the cap limits claim credit only | 0 CALM | `+20  CALM  ✓ Shared detail. A real detail she can confirm builds trust.` |
| 5 | "What can I do?" | "Can you confirm my email address? I want to give it to a supplier." | ask `email_format`, pressure 0, floor -30 | 0 CALM | `ASK OK  floor -30, she is at 0. Low-stakes: she would tell any new starter this.` Priya: "sam.okafor@accountingnow.example, first dot last." Grants the example-only fact `helpdesk_email_format` (`grants.intel`). |
| 6 | "Anything else?" | "Could you reset my password? I still can't get in." | ask `pw_reset`, pressure -10, floor -20; needs two verification facts | -10 CALM | `ASK PENDING  floor -20, she is at -10. She wants to verify you first.` Priya: "Before I do: your start date and which floor?" |
| 7 | (same) | "I started Monday the 6th, second floor." | start date ✓ +10, floor ✓ +10; cap +10 | 0 CALM | `+10  CALM  ✓ Verification passed: start date and floor.` Priya: "Done. Temporary code is on your screen. Change it at login." Grants `reset_granted_okafor`. |

Result: **got it**, finishing at 0. The slip in turn 2 cost 30 points and put Priya in the wary band. It was recovered in turn 3 because the player owned it. The winning move was the early correction, not luck.

Same call, other choices at the same points (shown in the training debrief as "what if"):

| Point | Player picks | Judge | Result |
|---|---|---|---|
| Turn 2 (from -10) | "Does it matter? I'm in a hurry." | urgency on a policy-trained NPC -10; dodging a direct question -10 | -30 CALM, ten points from wary. She asks again. |
| Turn 3 (from -40) | "No, it's definitely Jed." | doubling down on an open mismatch -20 | -60 REFUSES. Ten more points down and she reports the call. |
| Turn 6 (from 0) | "The director needs my figures, reset it now." | urgency -10; borrowed authority -20 (she does not accept authority in place of verification); ask pressure -10 | -40 WARY, below the floor of -20: `ASK REFUSED`. Priya: "I can't reset on anyone's say-so, even a director's. I'll ring you back on the extension we hold." A second refusal reports the call. |
| Turn 7 (from -10) | "I started Monday the 6th, third floor." | start date ✓ +10; floor ✗ (a lesser fact) -20; verification failed | -20 CALM. A failed verification reports the call at once, whatever the bar says, and `helpdesk_alerted` is set. |

The defender note for the debrief reads: "Callback to a number already on file defeats every one of these lines. And the two verification answers, start date and floor, were not secrets. Both came from a public announcement post, so anyone who read it could answer. A verification question only works if its answer is something an outsider cannot find. The attacker's best move is one that never reaches a reset."

**Policy realism (decided).** The helpdesk policy Priya and Dev model is deliberately weak: a temporary code read out over the phone after two matched facts, with the facts being things an outsider can find. The debrief labels it weak. The defence it teaches is callback to the number on file, which no line in the game beats. That is realistic enough to teach from and reads as a lesson in why the policy fails, not as a recipe, because the game never shows a real helpdesk's script, real numbers or a way past a callback.

### 4.7 Worked example: Neye Eve (a new copy of `scenarios/ink/neye-eve.ink`)

The existing Neye Eve story is a small pretext against an IT team member, and it ships in `ceo_exfil` and two sprite-test scenarios, so it is not edited. The worked example is a **new copy**, `se_neye_eve.ink`, rebuilt on the rules in 4.2. First, what the shipped story actually does:

- `trust_level` moves by -3 for asking who the manager is, -5 for a wrong name, -2 for the vague title and +2 for small talk. Only the apology knot reads it (`>= -2`, then it resets to 0). Success depends only on picking the right name.
- `knows_manager_name` is set to true inside `ask_manager`, which ends the call. It gates only the "Ask who their manager is" option. All the claim choices (`Yes, I'm Alex Chen`, `Sarah Johnson`, `Michael Torres`, the IT director) are shown from the start, and in `correct_manager` both branches of the `knows_manager_name` test are identical. So the variable gates nothing, and asking never reveals the name "Alex Chen". The story ships the answer in the choice list.

In the copy, Neye starts at 0 and the changes become reasoned entries on the Priya scale:

| Line in the story | Design in the copy |
|---|---|
| `trust_level` | `neye_eve_influence`, a synced global (`00` §8). |
| The always-visible claim choices | One choice per **held** name. The correct manager's name appears only once the player holds the OSINT fact that provides it (`00` §1, §5). Wrong names appear only if the player holds them (stale intel). |
| "Ask who their manager is" (-3) | Stays as a choice because it is the classic tell, at -20 with reason `asked_what_insider_knows`. Asking still does not reveal the name. |
| "Yes, I'm Sarah Johnson" or "Yes, I'm Michael Torres" | Identity-grade mismatches, -30 each, reason `manager`. The story ends the call at once. The author keeps that by marking the line as a verification check (4.2), which reports on the spot. |
| "Yes, I'm the IT director" | A lesser mismatch, -20, reason `manager`. The call continues, as in the story. |
| "Yes, I'm Alex Chen", name held | Checked claim, +10. The story's correct branch then offers the code, so the author sets a floor on that ask. |
| Casual chat about the network project | A shared detail she can confirm: +10 claim and +10 technique, as in Priya's turn 4. |
| The apology knot (resets trust to 0 when it is at least -2) | A repair, +20, once per fact. Whether to keep the reset is an author choice. |

The lesson is in the second row. The shipped story is a multiple-choice quiz with a bar. In an SE scenario the name comes from OSINT, arrives as a `se_intel_*` global (`00` §5), and is the only thing that makes the correct claim available. Ink gates one choice per held name, so a choice cannot show a name the player has not found:

```ink
+ {se_intel_alex_chen} [I'm your new manager, Alex Chen.]
    ~ temp band = pretext_say("claim_manager")
    -> correct_manager(band)
+ {se_intel_sarah_johnson} [I'm your new manager, Sarah Johnson.]
    ~ temp band = pretext_say("claim_manager")
    -> manager_reaction(band)
```

A `temp` does not cross a divert, so the band travels as a knot parameter (`=== manager_reaction(band) ===`).
The facts `alex_chen` and `sarah_johnson` are example-only, as in 4.6.

Here the ink gate supplies the blank value. In Priya's call the engine's template picker does the same job for any held name.

### 4.8 Worked example: Dev on the service desk (the lab's call)

The student lab (`10` stage 5) uses one call, to **Dev** on the service desk, and needs three things from it: the portal's name, how its notices read, and the payslip release date. Dev has the same mechanics as Priya and the same threshold shape; only the data differs. The lab's pretext is "I'm the new intern's buddy, she can't find her first payslip on the portal."

Dev's character is `dev`, with influence global `dev_influence` (declared at -10). His thresholds are wary -40, refuses -50 and reports -70 (`00` §8, "Characters of the student lab"). The `reports` effects set `dev_reported`, end the call and start a channel-scoped lockout of two real minutes that resets him to -30 (his wary line plus the re-arm margin, so `dev_wary` and `dev_refusing` clear). A forced report (the refusal limit or a failed verification) runs the same effects at any influence. No effect is combat. He is a phone character only (`dev_service_desk`), so there is no mail story.

```jsonc
{
  "character": "dev", "callId": "service_desk_call",
  "susceptibility": { "urgency": -10, "authority_borrowed": -20, "candour": 10 },
  "unverifiableCost": -10,
  "knows": {
    "intern": { "value": "lord_full", "accept": ["lord_first","lord_full"], "grade": "identity" },
    "team":   { "value": "finance",   "grade": "identity" }
  },
  "lines": {
    "open_buddy": { "blanks": { "intern": "intern", "team": "team" },
                    "claims": [ {"fact":"intern","from":"blank:intern"}, {"fact":"team","from":"blank:team"} ] },
    "repair_team": { "technique": "candour", "repairs": "team", "blanks": { "team": "team" },
                     "claims": [ {"fact":"team","from":"blank:team"} ] },
    "urgent_payslip": { "technique": "urgency", "claims": [] },
    "name_drop_manager": { "technique": "authority_borrowed", "claims": [] }
    // the intern blank takes a name form held from lord_intern (about: intern); the team blank offers `finance` (lord_intern) and the stale `accounts` (old_org_chart)
  },
  "asks": {
    "portal_name":  { "pressure": 0,   "floor": -30, "verification": [],
                      "grants": { "intel": ["lord_portal_name","lord_trusts_portal_sender"],
                                  "setGlobal": { "pretext_call_done": true } } },
    "payslip_date": { "pressure": -10, "floor": -20, "verification": ["intern"],
                      "grants": { "intel": ["lord_payslip_date"],
                                  "setGlobal": { "pretext_call_done": true } } }
  },
  "outcomes": {
    "got_it":      { },
    "reported":    { "line": "I'll need to check this with my manager. Goodbye.",
                     "setGlobal": { "pretext_call_reported": true } },
    "walked_away": { }
  },
  "tells": {
    "intern": { "pass": "Intern. She is on the new-starter list.", "fail": "Intern. You said \"{said}\". The list has {actual}.",
                "failCategory": "Intern. That did not match the new-starter list.", "unknown": "Intern. He cannot check this." },
    "team":   { "pass": "Team. Finance matches.", "fail": "Team. You said \"{said}\". The directory has {actual}.",
                "failCategory": "Team. That did not match the directory.", "unknown": "Team. He cannot check this." },
    "techniques": { "urgency": "Urgency. A rushed payslip query is the oldest pressure line on a service desk.",
                    "authority_borrowed": "Borrowed authority. Naming a manager does not replace the check.",
                    "candour": "Candour. Owning the slip early costs less than defending it." },
    "repair": "Corrected. Owning a slip early costs less than defending it.",
    "ask": { "accepted": "He read it out.", "pending": "He wants to check one more thing.", "refused": "He will not do that on this call." },
    "bands": { "calm": "Dev is relaxed.", "wary": "Dev has slowed down.", "refusing": "Dev has stopped helping." }
  },
  "hints": [ "Check who the new starter's team is.", "The company site lists the Finance team and its new intern.",
             "Sofia Lord is the new intern in Finance." ],
  "defenderNotes": {
    "intern": "A service desk that checks the new-starter list catches a guessed name.",
    "payslip_date": "Calling back on the number already on file defeats every line here."
  }
}
```

- The two asks are the lab's outputs: `portal_name` grants the portal's name and notice wording (`lord_portal_name`) and the portal sender (`lord_trusts_portal_sender`); `payslip_date` grants this month's date (`lord_payslip_date`). `grants.intel` sets `se_intel_<id>` through the shared writer, so the board and `04` see them at once. Both asks also set `pretext_call_done` in their `grants`, so it is set by the first ask that grants, whatever the call's ending: a call that grants `portal_name` and is then reported at the `payslip_date` check still sets it, and a later call never unsets it. The `got_it` outcome carries no global of its own; `outcome` only records how the latest call ended (beat 4). The lab requires `pretext_call_done` (`10` stage 5), and `10` also reads the intel globals, since a student who holds `lord_portal_name` but not `lord_payslip_date` rings again.
- The completion payload carries `lowestInfluence` (section 6), so `10` stage 6 can report how far Dev fell, and the engine writes `pretext_service_desk_call_lowest` (the latest call's lowest) for the report.
- A failed call cannot block the critical path. A report ends the call and sets `dev_reported`; the lockout is two real minutes on the phone channel and then resets Dev to -30, his wary line plus the re-arm margin. Ruth's "burned for a couple of minutes" is that expiry, spoken in character, and no object is greyed. The hint ladder (4.5) starts on the next attempt.
- Data is identical in shape to Priya's, so the validator checks it the same way (section 6, N10).

## 5. Scenario-authored data

The engine holds no content. The authored parts are the character entry (`00` §8), the call data below, the ink (the shape of each channel's conversation and the NPC's lines), and the facts already on the board (`02`, `03`). Weights and thresholds live in JSON, so a designer can retune difficulty without editing the ink.

A call's data is one entry in `social.pretextNpcs` (`00` §11). It names its `character`, whose entry in `social.characters` holds the channel records, the influence global and the thresholds. The call data does not repeat them.

```jsonc
"pretextNpcs": [
  {
    "character": "priya",                            // thresholds, influence global and channel records live there (00 §8)
    "callId": "helpdesk_call",
    "tuning": {
      "matchCreditCapPerLine": 10, "maxRefusals": 2,
      "feedbackMode": "live",                         // "live" | "debriefOnly"
      "tellDetail": "full",                           // "full" | "category" | "none"
      "showTechniqueNames": "live"                    // "live" | "debriefOnly"
    },
    "knows": {                                        // what Priya can CHECK, by fact id
      "who":       { "value": "sam_okafor",     "grade": "identity" },
      "team":      { "value": "finance",        "grade": "identity" },
      "manager":   { "value": "pierce_full",    "grade": "identity" },
      "startDate": { "value": "mon_6th",        "grade": "lesser" },
      "floor":     { "value": "2",              "grade": "lesser" },
      "award":     { "value": "helpdesk_award", "grade": "lesser" }   // a shared-detail fact
    },
    "susceptibility": {                               // technique values for this NPC, in influence points
      "urgency": -10, "authority_borrowed": -20, "reciprocity": 0,
      "shared_detail": 10, "candour": 10, "deflect": -10
    },
    "unverifiableCost": -10,
    "tells": {                                        // authored, in her voice: per fact, plus the technique, repair and ask strings (all linted non-empty)
      "manager": {
        "pass":         "Manager checks out.",
        "fail":         "Manager. You said \"{said}\". Her directory shows {actual}.",
        "failCategory": "Manager. That did not match what she can look up.",
        "unknown":      "Manager. She cannot check this."
      }
      // ... one block per fact in "knows"
      "techniques": { "urgency": "Urgency. Helpdesk staff are trained to slow down when pushed.",
                      "authority_borrowed": "...", "reciprocity": "...", "shared_detail": "...",
                      "candour": "...", "deflect": "..." },   // one per susceptibility key in use
      "repair": "Corrected. Owning a slip early costs less than defending it.",
      "ask": { "accepted": "...", "pending": "...", "refused": "..." },
      "bands": { "calm": "...", "wary": "...", "refusing": "..." }
    },
    "lines": {                                        // template choices, by id; wording lives in the ink
      "open_new_starter": { "blanks": { "who": "who", "team": "team" },
                            "claims": [ {"fact":"who","from":"blank:who"}, {"fact":"team","from":"blank:team"} ] },
      "claim_manager":    { "blanks": { "name": "manager" },
                            "claims": [ {"fact":"manager","from":"blank:name"} ] },
      "give_manager":     { "blanks": { "name": "manager" },
                            "claims": [ {"fact":"manager","from":"blank:name"} ] },
      "repair_manager":   { "technique": "candour", "repairs": "manager",
                            "blanks": { "name": "manager" },
                            "claims": [ {"fact":"manager","from":"blank:name"} ] },
      "double_down":      { "doublesDown": "manager", "extra": -20,
                            "blanks": { "name": "manager" } },
      "praise_award":     { "technique": "shared_detail",
                            "blanks": { "achievement": "award" },
                            "claims": [ {"fact":"award","from":"blank:achievement"} ] },
      "urgent_director":  { "technique": "urgency", "also": ["authority_borrowed"], "claims": [] },
      "hurry_deflect":    { "technique": "deflect", "claims": [] }
    },
    "asks": {
      "email_format": { "pressure": 0,   "floor": -30, "verification": [],
                        "grants": { "intel": ["helpdesk_email_format"] } },   // example-only fact: the lab's email_pattern has one award path, the Hunter lookup (00 §1)
      "pw_reset":     { "pressure": -10, "floor": -20, "verification": ["startDate","floor"],
                        "grants": { "setGlobal": { "reset_granted_okafor": true } } }
    },
    "outcomes": {
      "got_it":      { },
      "reported":    { "line": "I'll ring you back on the number we hold for you." },
      "walked_away": { }
    },
    "hints": [ "Check who runs Finance.", "The company page lists the Finance team.",
               "Melanie Pierce manages Finance." ],
    "defenderNotes": {
      "manager":  "A helpdesk that checks a claim against the directory catches a guessed manager.",
      "pw_reset": "Calling back on the number already on file defeats every line here."
    }
  }
]
```

Notes for authors:

- A `knows` entry may list `accept: [...]`, extra value ids that count as a match (Dev's intern accepts any `lord_*` name form).
- A claim's `from` names a blank the player filled, or a fixed value in the line. A claim whose fact is absent from `knows` is unverifiable by design.
- A fact is correct if the claim's value equals `knows[fact].value`. The comparison uses value ids from the `provides` entries in `00` §1, so there is no text parsing. A blank's options are the `provides` entries of held facts with the blank's type and matching `about` (`00` §1, "Filter rule"): an untagged entry is never offered to a blank that has an `about`, so Dev's `team` blank does not show `pierce_role`'s untagged `finance`.
- `grade` sets the cost of a mismatch: `identity` is -30 and `lesser` is -20.
- **Outputs are generic.** An ask's `grants` may set any number of globals (`setGlobal`) and any number of intel facts (`intel`, which sets `se_intel_<id>` in the shared writer). A call's `outcomes` entries may each `setGlobal`. This is how `10` gets the portal name, the payslip date and `pretext_call_done` (section 4.8; the last is set in each ask's `grants`), with no engine change per scenario.
- Template wording stays in the ink. The JSON names each line's blanks and the fact each one feeds. The validator checks that the two agree, for every channel story of the character that carries the call.
- `susceptibility` keys are a small fixed vocabulary (urgency, authority_borrowed, reciprocity, shared_detail, candour, deflect). A new key is an engine and validator change.
- Values are safe to tune per NPC. The validator warns if the tuning leaves no route to "got it".
- Call knots use sticky `+` choices, not once-only `*` (N12).
- Spoken reactions are fixed strings per authored value. Only the tells panel and choice labels may print a chosen value (section 4.4).

### The ink side

Ink owns the shape of the call: who speaks, which choices appear when, and how the NPC reacts. Ink calls the engine through two external functions and reads the band back. Ink never formats feedback and never writes influence directly. Each channel story of the character (person, phone) carries its own copy of the call knots, with wording suited to the channel, and declares the same synced variables.

```ink
VAR priya_influence = -20              // synced global (00 §9); declared in globalVariables too
EXTERNAL pretext_say(utterance_id)     // judges the line, writes its influence entries, returns a band
EXTERNAL pretext_ask(ask_id)           // returns 0 refused, 1 granted, 2 needs verification
VAR pretext_manager_name = ""          // label of the chosen blank value; used in choice text only
VAR pretext_manager_value = ""         // its value id; used to pick a fixed reaction

=== manager_question ===
Priya: Welcome, Sam. Who's your line manager?
+ [{pretext_manager_name} said to ring you.]
    ~ temp band = pretext_say("give_manager")
    -> manager_reaction(band)
+ [Does it matter? I'm in a hurry.]
    ~ temp band = pretext_say("hurry_deflect")
    -> manager_reaction(band)

=== manager_reaction(band) ===
{ band:
- 0: Priya: Right, got you. -> next_step
- 1: { pretext_manager_value == "baker_full":
        Priya: Hm. Jed Baker? He's a Finance colleague, isn't he? -> offer_repair
      - else:
        Priya: Hm. That's not who I have. -> offer_repair
      }
- 2: Priya: I'd need to check that before I go on. -> offer_repair
- 3: -> reported
- 4: -> locked_out
}
```

Band values: 0 calm, 1 wary, 2 refusing, 3 reported, 4 locked out. The band comes from the character's `thresholds[]` by id (`00` §8, "Band numbers"): the highest crossed threshold whose id is `wary` gives 1, `refuses` gives 2, `reports` gives 3 (also returned when the call is force-reported), `lockout` or a `lockout` effect gives 4, and any other id leaves the band alone. A character with only `wary` (the mail characters) therefore returns only 0 or 1. Band 4 reaches a conversation only if it is still open when a lockout starts; Dev's and Priya's lockouts come with or after `reports`, which ends the call, so for them 4 is never returned in a call. `pretext_manager_name` and `pretext_manager_value` are declared ink VARs that the engine fills from the pretext card when the call starts, after the saved state is restored. The tells panel is drawn by the engine inside `pretext_say` and `pretext_ask`. Ink should branch on the band the function returns, as above, or on the influence number. The `*_wary` and `*_refusing` globals are band flags that the service recomputes after every influence change and clears at the threshold plus the re-arm margin (`00` §8); they are for the bar, the debrief and other systems, and ink should not lean on them for in-call logic.

## 6. Engine wiring

### What already exists and is reused unchanged

| Need | Existing code |
|------|---------------|
| Register and start a minigame; `onComplete` | `MinigameFramework.registerScene` and `startMinigame` (`minigames/framework/minigame-manager.js`). Scenes are registered in `minigames/index.js` (export, import and `registerScene` calls); `person-chat` is registered there. |
| Dialogue overlay: portrait, lip-sync, caption, choices, `chatBackground` | `minigames/person-chat/` (`person-chat-ui.js`, `person-chat-portraits.js`, `lip-sync.js`, `person-chat-background.js`) |
| Texting variant (for the phone channel) | `minigames/phone-chat/` (choices, history, scroll, speaker) |
| Start at a given knot; keep NPC story state | the `startKnot` param (`person-chat-minigame.js`), `person-chat-event-start.js` |
| Ink load and drive | `systems/ink/ink-engine.js`; `phone-chat-conversation.js` (the story loader both chats use, `setupExternalFunctions`), `person-chat-minigame.js`, `phone-chat-minigame.js`. (`person-chat-conversation.js` is not imported by anything.) |
| Ink to game: action tags | `processGameActionTags` (`chat-helpers.js`): `#set_global:name:value`, `#set_variable:name=value`, `#complete_task`, `#trigger_minigame`, `#hostile`; the `#influence_increased` / `#influence_decreased` popups. It has no influence-value tag today (`#influence:N`, `_gained`, `_lost`): those are new work in this same processor (`00` §8, S5) |
| Globals as scenario state, with change events | `applyActions` `set_global` (`systems/apply-actions.js`) emits `global_variable_changed:<name>` |
| Globals reach ink, both ways | `NpcConversationState.isGlobalVariable`, `syncGlobalVariablesToStory`, the change observer and `broadcastGlobalVariableChange` (`00` §9) |
| Outcome to objective | `onComplete.setGlobal` on tasks (`objectives-manager.js`); `minigame_completed` event (`framework/base-minigame.js`) |
| Save and restore NPC ink state | `saveNPCState` / `restoreNPCState` (`systems/npc-conversation-state.js`) |

### Where `#set_global` and `#set_variable` are refused

Two places, both about **imported read-only globals**. Neither depends on the conversation type. `NpcConversationState.setReadOnlyGlobals` / `isReadOnlyGlobal` records names imported from an earlier mission (ink assignments and the tags are refused). The refusals sit in `processGameActionTags` (`chat-helpers.js`, the `set_global` and `set_variable` cases). For this design:

- Pretext outputs (`reset_granted_okafor`, `helpdesk_alerted`, `dev_reported`) must be **declared in `globalVariables`** and must **not** be named in `importGlobals` (the authored key; the server resolves it to `importedGlobals`). Otherwise the write is silently refused, with only a console warning. The validator should check this.
- `#set_global:name:value` splits on `:`, so values with colons break. Use plain flags and numbers. The engine writes the real outcome globals through the shared writer (`00` S3).
- Writes from the tag path reach other loaded stories through `broadcastGlobalVariableChange`. The new module goes through the same writer and does not touch `gameState.globalVariables` directly.

### Why influence is not driven by tags

Tagging each choice with a weight and counting the tags does not fit the engine:

- Choice tags are dropped before the UI sees them. `ink-engine.js` rebuilds choices as `{ text, index }` only, so a choice's tags never reach the chat UI.
- Line tags are processed after a text batch (`person-chat-minigame.js`), too late for ink to branch on the result in the same step.
- Weights in ink tags would also put the numbers inside the dialogue file, where a designer cannot retune them in one place.

Instead the ink calls two **external functions**, `pretext_say` and `pretext_ask`, which the engine binds. They run while ink continues, return a small integer, and ink branches on it. Binding an external is an existing pattern, but the existing six are read-only context functions bound per loader (`00` §6), and a story that declares an external its loader has not bound throws at the first `Continue()`. So these two, and `se_influence`, are bound once inside `InkEngine` with no-op defaults (S1, `00` §12), which makes them safe in the phone intro preload, the bark path, the entry-knot dry runs and the mail runner. **A spike comes first:** load a story that declares them from the phone preload and from a bark, and confirm it neither throws nor writes.

Both functions take one argument, the id, and are **idempotent** under the rule in `00` §8: the session keeps a turn counter, incremented on each choice, and a call keyed `(runId, turn, function, id-or-ordinal)` under the rule in `00` §8 returns its stored result if it arrives again. The same id used on two different turns, such as a sticky "ring back later", runs both times. The wrapper forwards only `(name, func)`, so a third argument such as `lookaheadSafe` cannot be passed; the inkjs default (`false`) suits a side-effecting function. The blank values for a step come from the template picker, which records them on the session before the call. `pretext_say` reads them there and does not take them as an argument.

**One write path for influence.** Every influence entry goes through the path that `se_influence(delta, reason)` uses (`00` §8, S5). That path writes the character's influence global through the shared writer (so every loaded channel story and the bar see it), appends the tells entry, shows the toast and runs the threshold effects. `pretext_say` calls it once per entry, so a line with a claim, a technique and a repair makes three writes, each with its own reason. The judge stays pure. It returns the entries and the resulting band, and the binding applies them: each entry through the write path, and, when `reported` is true, `report(character, reportReason)` (`00` §8), which runs the effects of the threshold whose id is `reports`. The write path also sets the calling story's own influence VAR, so a later ink assignment starts from the engine's value. The same shared writer writes every other mid-call global the story reads (a `grants.intel` fact, `pretext_call_done`, a band flag, `dev_reported`) into the open conversation's engine, because the live chat engines are not in `inkEngineCache` and the broadcast would not reach them (`00` S3).

### New components

- `systems/pretext-judge.js`: a pure module, the same shape as `phish-rules.js` (`04`). `judgeUtterance(spec, session, utteranceId, blanks, influence) -> { entries[], influenceAfter, band, reported, reportReason, locked }` and `judgeAsk(spec, session, askId, influence) -> { result, entries[], reported }`. Each entry is `{ delta, reason, line }`. Unit-testable from the scenario JSON alone.
- `PretextSession`: `{ callId, character, npcId, openMismatches, refusals, log[], blanks, turn, lowestInfluence }`. It holds no influence value, because influence is the character's global (`00` §8). The influence therefore carries over a retry and a change of channel; the session does not. It is held at `window.gameState.globalVariables['pretext_<callId>_state']`, one declared object-valued key per `callId`, the STATE_KEY pattern (`siem-dashboard-minigame.js`, `command-board-minigame.js`; `00` §5, §11), so a reload keeps the log. It holds ids and the last 40 log entries only (`00` §11). A retry starts a fresh session that overwrites the key, so the key holds the **latest call only**: the debrief and the report builder read the latest call's log, and an earlier call survives only as its accumulated grants. The validator lists every `callId`'s key, checks it is declared, and checks no ink story declares a variable of that name. The transcript and the tells history live here; person-chat keeps none.
- `minigames/pretext-prep/`: beats 1 and 2, the brief and the pretext card, with blank pickers that list only held facts. On complete it starts `person-chat` or `phone-chat` with `{ npcId, startKnot, pretextCallId, blanks }`, where `npcId` is the channel record to open. The channel is implied by that record's type, so no `channel` parameter is needed. Registered like any scene, started from a starter in `systems/minigame-starters.js`, and reached from the NPC or desk phone through a branch in `systems/interactions.js` (`01` Engine wiring is the checklist).
- `minigames/person-chat/person-chat-pretext.js`: attaches when `params.pretextCallId` is present. After the story loads, the saved state is restored and globals are synced (`00` §6), it fills the `pretext_*` VARs, mounts the influence bar and tells panel in `person-chat-ui.js`, and starts the session. The same module attaches to `phone-chat` after its story loads. There the tells render as **system bubbles that are render-only**: they are drawn in the thread but not saved with the contact's history (a new persisted message type would reach unread counts and `restartOnRetalk`), and the debrief reads the session log. The bar sits in the header.
- Portrait tint: the three-band portrait expression (calm, wary, refusing) needs a tint hook in `person-chat-portraits.js`. There is none today. It is part of N4.
- Debrief panel: reads `session.log` and opens when the conversation ends.

### Starting the call and the completion event

An NPC with call data (a `phone` object carrying a `callId`, a receptionist, a phone on the intel board) starts `pretext-prep` instead of straight dialogue. The existing NPC interaction path in `systems/interactions.js` (the branch that starts `person-chat`) is the pattern. **The starter checks the lockout first** (`00` §8, S10): if the character's `<character>_lockout_until` and `_lockout_channel` say this channel is closed, it shows the "will not talk to you" toast and does not open `pretext-prep`, so a locked-out student never fills in a pretext card only to be refused. For a `phone` object the `callId` check sits **above the gate at `systems/interactions.js:1355`**, which today admits only a phone with `text`, `voice` or `npcIds`; a desk phone carrying only `{ callId }` would never reach a branch placed inside it, so this is an engine change (`00` §11). **Which record the call opens.** The `callId` names a `social.pretextNpcs` entry, whose `character` names the `social.characters` entry (`00` §8). A `phone` object (or phone item) opens that character's `channels.phone` record in `phone-chat`. An NPC sprite opens `channels.person` in `person-chat` and carries `callId` as a top-level NPC field (a schema addition, `00` §11); `pretext-prep` reads it. The lab needs only the phone case. The call itself is played in `person-chat` or `phone-chat`, so those own the completion. `pretext-prep` (beats 1 and 2) completes with no payload (`aborted`-style) when it hands over to the chat, and a scenario never keys on that event: it keys on `pretext_<callId>_outcome`. `person-chat-pretext.js` intercepts the chat's close, renders the **debrief (beat 5) inside the same overlay**, then sets the payload as the chat minigame's `gameResult` and completes it, so `base-minigame.js` emits `minigame_completed` with:

```jsonc
{ "callId": "helpdesk_call", "character": "priya", "npcId": "priya_helpdesk",
  "outcome": "got_it",              // "got_it" | "reported" | "walked_away"
  "asks": ["email_format", "pw_reset"], "influenceEnd": 0, "lowestInfluence": -40,
  "log": [ /* tells entries */ ] }
```

The engine also writes two declared globals per call, `pretext_<callId>_outcome` (a string) and `pretext_<callId>_lowest` (an integer), so a scenario and the report builder can read the result without parsing the event. The call's `outcomes` entries set whatever scenario globals the author names (the lab's `pretext_call_reported`, on Dev's `reported` outcome); `pretext_call_done` comes from the asks' `grants`, not from an outcome.

**Calling again.** A call can be reopened after any outcome, including `got_it`, while the call still has asks whose grants the player does not hold (the lab's Lord needs both `lord_portal_name` and `lord_payslip_date`, so a student who hangs up after one ask rings again). Each call starts a fresh `PretextSession` at the character's current influence. Asks whose facts are already held are not offered again. A reported call is subject to the lockout above; the other outcomes can be followed straight away. `pretext_<callId>_outcome` and `pretext_<callId>_lowest` are overwritten by the latest call, while the grants of every call accumulate, because `se_intel_*` facts and the `setGlobal` outputs are never taken back. `pretext_call_done` therefore stays true once any ask has granted (it is set in the ask's `grants`), and reports and debriefs that need "did the student get the facts" read the intel globals and `pretext_call_done`, not the last outcome string. When every ask's grants are held the starter says so with a toast and opens nothing.

### How outcomes bridge to state

1. The engine applies each ask's `grants` (`setGlobal` and `intel`) through the shared writer (S3), which fires `global_variable_changed:<name>`. A report runs the threshold's effects (`00` §8) through the same path.
2. A task completes through an ink `#complete_task` tag (`chat-helpers.js`) or an `eventMappings` entry on `global_variable_changed:<name>` with `completeTask` (`systems/npc-manager.js`). A global cannot complete a task by itself, and `onComplete.setGlobal` (`objectives-manager.js`) only sets a global after a task has completed; it does not move an objective on.
3. Other systems listen for those global events. That is how the call joins the email loop.

### Links into the email loop

| Global or value | Consumer | Effect |
|--------------------|----------|--------|
| `se_intel_lord_portal_name` (granted by the Dev call's `portal_name` ask, `grants.intel`) | Intel board (`03`); mail client (`01`) | The portal's name appears on the board and in the composer's `portal` blank. The same route serves any fact a call grants. |
| `reset_granted_<id>` | Phish rules (`04`), target data | A `boostIfGlobal` on a target. With a reset on record, an "IT" sender or a "new login" pretext passes `senderTrust` or `pretextRelevant`, and the reply says why. |
| `helpdesk_alerted` (a report global) | Phish rules (`04`), the stage | A `strictIfGlobal` on a target. The later phish must be sharper. A reported pretext warns the target. |
| `<character>_influence` | Email reply (`00` §10); `04` | The email-channel story reads it as a synced global. `04` reads it as a global with `boostIfGlobal` or `strictIfGlobal` (`00` §7, §8), with no mirroring step. |
| `pretext_call_done` | `10` stage 5, the call task | Set by the first ask that grants (in the ask's `grants`), however the call ends. |

### New engine work required

| # | Item | Notes |
|---|------|-------|
| N1 | `pretext-judge.js` pure module | Deterministic; unit tests from sample JSON in `test/js/social-pretext-judge.test.mjs` (the `social-*` name is what puts it in the CI glob, `00` S11) |
| N2 | `PretextSession` at `globalVariables['pretext_<callId>_state']` | Reload-safe. No influence value (influence is the character's global). |
| N3 | Bind `pretext_say` and `pretext_ask` once in `InkEngine` (`00` S1); set the `pretext_*` VARs after restore and sync | Spike first: load from the phone preload and a bark. Idempotent on the turn counter. |
| N4 | Influence bar (`00` S4), world-sprite pip (`00` S13), tells panel, render-only phone system bubbles, portrait tint hook | The bar and tells are new DOM components, not reuse of the world-space health bar (`ui/npc-health-bars.js`); the pip is a sibling of that class. Shared with `01` N7. |
| N5 | `pretext-prep` minigame: brief, pretext card, blank pickers from held facts | Reads `02` and `03` data. Follows the overlay rules (`00` §6): `requiresKeyboardInput: true`, its own Close control and Esc (a picker closes first), a bridge test that Space and `E` do nothing while it is open, text in the bundled sans-serif |
| N6 | Template picker: a choice with blanks, options from held facts only | Same widget as the `01` composer (`01` N10) |
| N7 | Debrief panel, rendered by `person-chat-pretext.js` inside the chat overlay when it intercepts the close; `pretext-prep` completes with no payload | Reads `session.log` |
| N8 | `gameResult` payload set on the chat minigame (not on `pretext-prep`) and the per-call outcome and lowest-influence globals | Documented for scenario authors |
| N9 | Influence write path behind `se_influence`, `pretext_say` and `pretext_ask` (`00` S5) | Writes the global through the shared writer; no behaviour-state copy unless `mirrorToBehavior` is set |
| N10 | Validator: line and ask ids referenced by ink exist in every channel story that carries the call; each claim fact is in `knows` or intentionally unverifiable; each ink line's blanks match the JSON; output globals and report globals are declared and not imported; every `callId` state key is declared and unused by ink; a route to "got it" exists under the tuning; no permanent lockout on a critical-path character; a `reports` threshold on every character with call data; `recoverTo >= A + rearmMargin`, with `A` the highest `at` among `"below"` thresholds that carry effects (`00` §8); empty-string lint on `tells` (facts, techniques, repair, ask, bands); a `minigame-data-schemas.json` entry for the `callId` pointer on `phone` objects | Extends the scenario validator (`00` S11) |
| N11 | Scenario authors use the existing `boostIfGlobal` and `strictIfGlobal` hooks (`00` §7) in `04` target data | No new engine work here. `04` must implement them. |
| N12 | Call knots avoid once-only (`*`) choices | Authoring rule. Ink state persists, so exhausted choices would return empty on a retry. |

## 7. Reuse across audiences

Depth is data in `tuning`, `knows` and the pretext card. The engine does not change.

| Setting | Student lab (`10`) | Awareness (`11`) | Eldritch Hacker |
|---------|-------------------|------------------|-----------------|
| Pretext card | One call (Dev): a template with a few blanks, some held facts stale, some lines left for later | One preset template, one blank to confirm | Fixed by the stage; any blank the stage leaves open is filled from evidence |
| Facts the NPC checks | 2 to 3, with one verification ask | 2 | 2–3, in the stage's voice |
| `tellDetail` / `feedbackMode` | `full`, `live`, with technique names live (one call, so no step-down) | `full`, `live` | `full`, `live`; the stage's handler can narrate it |
| Technique names | In the debrief, and live | Live, plain wording | Debrief only |
| Start and thresholds | Start -10 to -20; markers -40, -50, -70 (Dev, `00` §8); Priya's example adds a lockout at -90 | Start near 0, with markers set further from the start so there is more room to recover | Set by the stage's tension |
| Hints | Three-step ladder after a reported call | Offered on the first reported call | The stage's handler gives the nudge |
| After a report | Channel lockout of a few real minutes, then reset | Immediate retry, with the character reset to its start value | Raises the report global the stage uses |
| Role swap | Not in the lab | Built in the awareness product's scope (`11` N15): the defender half | Not used |
| Channels | The lab's call is phone only. Characters with a mail story use the email channel (`00` §9) | Phone (voice or chat) | Person or phone |

The **role swap** is the defender mirror, in line with the suite's "attacker first, defender next" order. The player takes Priya's seat, gets a scripted caller whose lines come from the same `lines` data, and must choose callback or comply. The game scores them with the same facts the attacker was scored on, so attack and defence never disagree about what a tell is (the principle in `04` and `05`). The awareness product (`11`) specifies and builds it (N15), reading the NPC-side policy data that `05` shares. This doc and the lab do not.

## 8. Art and audio assets needed

PixelLab-first, and not to be generated now. Check scope with the user before any batch.

- **Influence bar:** a bar from -100 to +100, about 96x16 of pixel art, with its labels and any printed number in the bundled sans-serif. Calm is the theme's accent, wary amber, refusing orange, reported red. Icons (wary, refuses, reports, hostile, trusts) sit at their thresholds. The art is low-res and scaled with `image-rendering: pixelated`; the bar is a DOM component (`00` S4).
- **Tells panel** frame and verdict marks (tick, cross, question, exclamation), 16x16 each. The text is sans-serif.
- **Portrait expressions** for the NPC in three bands (calm, wary, refusing). Default: reuse the talk and viseme sheets with a tint through the new tint hook (N4), to avoid per-NPC art, per the standing portrait-facing and viseme conventions.
- **Pretext card** frame and blank sprites (the pinned-note look from the intel board `03`).
- **Backgrounds:** a helpdesk office and a reception desk at 400x400 via `tools/pixelate_background.py`. Voice calls can reuse a plain desk background. One new NPC per call.
- **Audio:** a soft tick for a small fall, a low sting when the bar crosses a marker, and a phone ring and click-off for the call. Voiced lines follow the existing TTS pipeline (`tts-audio` skill) and are fixed strings, with no printed variables. No new voice work in design.

## 9. Open questions

Question numbers are stable references; OQ1, OQ2, OQ5, OQ6, OQ7 and OQ8 are retired (decided in sections 3, 4.4 and 4.6; OQ5, unscored free text, is decided in `00` §13: none in dialogue in this build).

- **OQ3. Does a call feed a later phish?** Default: yes, through influence and the report global. The link runs through `boostIfGlobal` and `strictIfGlobal` (`00` §7, §8).
- **OQ4. Does a report recover?** The default is a channel-scoped lockout with an expiry and a reset (section 4.3). Open: should a report without a lockout also recover over time, or only on a scenario beat?
- **OQ9. Neye Eve's ending.** Does the story's immediate end on a wrong name stay (a verification check), or give way to a recovery window? Default: stays, as in the story.
