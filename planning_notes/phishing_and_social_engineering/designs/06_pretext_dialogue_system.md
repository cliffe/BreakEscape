# 06 — Pretext / vishing dialogue system (NPC suspicion)

Status: plan, 2026-10-20. Reuses the `person-chat` and `phone-chat` ink stack; the only new state is a
suspicion meter, the data that drives it, and a feedback panel. Calls the judging vocabulary of
`04_phish_rules_engine.md`, reads the facts gathered in `03_intel_board.md`, and feeds the mail loop in
`01_mail_client.md`.

R1 fixes applied: session persisted under `globalVariables` (M1); worked-example arithmetic corrected, final meter 0/10 (M2); external-function framing corrected, 3rd-arg caveat and idempotence kept (M3); `ASK PENDING` format defined; `boostIfGlobal`/`strictIfGlobal` referenced as existing (00 §7); defender note now says verification facts were OSINT-discoverable.

## 1. Purpose & audience

The player holds a **spoken or in-person conversation** with an NPC (a receptionist, a helpdesk
analyst, a mark in a corridor) and tries to get something out of them while working from a
**pretext**: a cover story prepared from OSINT. The NPC checks what they can check. A line that does
not fit raises the NPC's suspicion; consistent, well-grounded lines lower it. Cross a threshold and
the NPC verifies by calling back or alerts security. Stay under it and the player gets the information.

All three audiences (see `BRIEF.md`):

- **Cyber Security students:** the full model. Several checkable facts per NPC, a repair mechanic, an
  ask ladder, and an end-of-call debrief that names the technique used on each line.
- **Awareness learners:** one NPC, two or three choices per turn, meter always visible, feedback live.
  Followed by a role swap (play the helpdesk analyst taking the call) which is the defender lesson.
- **SAFETYNET missions:** a vishing call or a front-desk bluff as one stage. Same engine; the outcome
  sets a global that opens a door or a later objective.

Teaches (book *Practical Social Engineering*): Ch. 1 and Appendix D (pretexting, elicitation, vishing
and the sample pretexts), Ch. 3 (a pretext is prepared, not improvised), Ch. 6 (the people OSINT that
makes a pretext checkable), Ch. 9–10 (why verification and callback policy defeat it). The defence is
the other half of every lesson: each way the player gets caught is a control a real organisation uses.

Model, don't weaponise. The game teaches why a line works or fails against a *fictional* NPC with an
authored policy. It does not supply a script for deceiving a real helpdesk, real numbers, or real
company procedures. Targets, companies and policies are invented.

## 2. Player goal in their own words

"Get this person to tell me what I need by sounding like someone they'd expect, without saying
anything they can check and catch me on."

## 3. The loop

One conversation is five beats. Beats 1, 2 and 5 are small panels; beats 3 and 4 are the existing
`person-chat` overlay (portrait, lip-sync, caption, choices, `chatBackground`) with one added widget.

### Beat 1. Brief

A card in house style (dark panel, `Press Start 2P` heading, `VT323` body, `#00ff41` accent). It states
the authorisation and scope in one line ("Authorised test of FICTIONAL AccountingNow, helpdesk call
in scope"), the **objective** ("Confirm the staff email format", then optionally "Get a password reset
for a Finance account"), and what the player has on the intel board. The ethics beat (Ch. 2) lives
here, not in a separate screen.

### Beat 2. Build the pretext

The player fills a short **pretext card** from the intel board (`03`). Slots, each filled by picking
a fact the board holds:

| Slot | Example options (from the board) |
|------|----------------------------------|
| Who I am | New starter / Contractor / Auditor |
| My team | Finance / Sales Ops / Reception |
| My manager | Melanie Pierce / Jed Baker |
| Why I'm calling | Locked out / Can't find the form / Chasing an invoice |

The board can hold a **stale or wrong** fact (an old org chart listing Jed Baker as Finance lead).
Picking it is not blocked; the NPC will catch it. That is the lesson on source quality (Ch. 6), and it
is why the slots take a fact the player chose rather than a fact the game chose. A slot left empty is
allowed: the player then has to bluff, and the choices for that slot are the unverifiable kind.

The card is a commitment. Its slot values become the values the NPC checks and the words the choice
labels use ("Say your manager is *Melanie Pierce*"). An optional **readiness line** shows which slots
are backed by intel and which are guesses, using the same readiness idea as the intel board.

### Beat 3. The call

`person-chat` opens with the NPC (voice call: portrait, no video; in person: portrait plus the room's
`chatBackground`). Each turn:

1. The NPC speaks (ink line, lip-synced as for any NPC).
2. The player picks one of two to four choices. Choices are the player's side of the conversation and
   cover the elicitation techniques as options: appeal to authority, urgency, reciprocity, a shared
   detail from OSINT, a direct ask, small talk, staying quiet, correcting yourself.
3. The choice's **claims** are checked against what the NPC knows. The meter moves.
4. A **tells panel** shows the result of that one line (section 4) beside the portrait. The NPC then
   reacts in character, and the reaction depends on how wary they now are.

A **suspicion gauge** sits under the portrait: a bar of ten pips with a mark at the *wary* line and
another at the *challenge* line. The NPC's portrait expression follows the band (relaxed, wary,
suspicious). The player always sees where they stand.

### Beat 4. Outcome

Two ways out, both with consequences the scenario authors and neither a dead end:

- **Got it.** The player makes an ask while suspicion is under that ask's ceiling (and any
  verification the ask needs has passed). The NPC gives the information; ink sets the result global.
- **Caught.** Suspicion reaches the *challenge* line, or the NPC invokes their callback rule. The NPC
  says what they are going to do ("I'll ring you back on the number we hold for you"), the call ends,
  and a global records it. Typical consequences: the helpdesk NPC refuses further calls for a while;
  a flag lets a guard NPC or an alert system react. The player can retry with a different pretext
  after a scenario-set cooldown, a mission beat, or immediately in awareness mode.

### Beat 5. Debrief

A one-screen replay of the call: every player line, its delta, which fact it hit or missed, the
technique name, and a **defender note** ("A helpdesk that always calls back on the number on file
stops this line cold"). The debrief is the only place technique names are spelled out in assessment
mode. In training mode they appear live as well (section 4).

## 4. The rules / scoring

Everything is deterministic and authored. There is **no free-text matching**: the player picks from
authored choices, so each line has an id and the judge compares ids and slot values, never substrings.

### The meter

`suspicion` is an integer 0–10, starting at the NPC's `baseline` (cold calls start above zero: an
unexpected caller is mildly suspicious by default). Two lines on the gauge, both scenario-set:

| Band | Default | NPC behaviour |
|------|---------|---------------|
| Calm | 0 to 3 | Helpful, volunteers a little. |
| Wary | 4 to 6 | Asks a verifying question, hesitates on asks, drops pleasantries. |
| Challenge | 7 or more | Invokes the callback / security rule. The call ends: **caught**. |

### What moves it, per line

Each choice (an *utterance*) carries up to four things. The judge adds them up, then clamps to 0–10.

1. **Claims** the line makes about the world: manager, team, start date, a named colleague. For each,
   the NPC's knowledge says whether they can check it:
   - *Checks out* (match): **-1**. A single line cannot earn more than -1 from matches in total, so a
     line stuffed with true facts does not wipe the meter.
   - *Checkable and wrong* (mismatch): **+3** for identity-grade facts (name, team, manager), **+2**
     for lesser ones. The NPC remembers it: the fact is now *open*.
   - *Not checkable by this NPC* (unverifiable bluff): **+1**. Unsupported claims cost a little; a
     claim the NPC *can* test costs a lot. That asymmetry is the lesson.
2. **Technique modifier.** How this NPC reacts to the technique, from the NPC's `susceptibility`
   table. A friendly receptionist warms to reciprocity (-1); a policy-trained helpdesk analyst hears
   urgency (+1) and borrowed authority (+2) as classic pressure tells. Values are per NPC, so the same
   line plays differently on a different mark. This is the elicitation lesson (Ch. 1, App. D): the
   technique is a lever, not a guarantee.
3. **Repair.** A line that corrects an open mismatch (supplies the right value) and owns the slip
   carries the claim credit (-1) plus a candour modifier (-1): **-2** in all. It works once per fact. Doubling
   down on an open mismatch is **+2** more. Net effect: a slip owned early is recoverable; one
   defended is not.
4. **Ask.** If the line asks for something, the ask has a `pressure` (added to the meter) and a
   `ceiling` (the highest suspicion at which the NPC will do it), and may need **verification**: named
   facts the player must then match. The ceiling is tested *after* the pressure is added. An ask over
   its ceiling is **refused softly** (not caught): the NPC says what they would need, and the refusal
   counts toward a `maxRefusals` limit (default 2), after which the NPC uses the callback rule.

Failing a required verification fact is treated as a mismatch **and** triggers the callback rule on the
spot. This mirrors real policy: a failed identity check ends the call.

### Gating the outcome

- **Got it:** ask made, suspicion within the ceiling after pressure, verification (if any) matched.
- **Caught:** suspicion reaches the challenge line, or the refusal limit is hit, or verification fails.
- **Walked away:** a "ring back later" choice ends the call with no penalty and no result. It is always
  offered once the NPC is wary, so there is a graceful exit.

### The feedback shown (the tells panel)

After every line the panel adds one entry. Four parts, always present: the **delta and band**, the
**factor** (which fact or technique), a **verdict mark**, and a **plain reason**. The reason names the
factor without handing over the answer in assessment mode (`tellDetail: "category"`), and shows the
actual value in training mode (`tellDetail: "full"`). Entry formats:

| Case | Format shown |
|------|--------------|
| Checked, wrong | `+3  WARY 4/10  ✗ Manager. You said "Jed Baker". Her directory shows Melanie Pierce.` |
| Checked, wrong (assessment) | `+3  WARY 4/10  ✗ Manager. That did not match what she can look up.` |
| Checked, right | `-1  CALM 1/10  ✓ Name and team are in the directory.` |
| Unverifiable bluff | `+1  ... ? Floor. She cannot check this, but you gave her nothing to trust it on.` |
| Technique | `+1  ... ! Urgency. Helpdesk staff are trained to slow down when pushed.` |
| Repair | `-2  ... ✓ Corrected. Owning a slip early costs less than defending it.` |
| Ask accepted | `ASK OK  ceiling 5, you are at 0. Low-stakes: she would tell any new starter this.` |
| Ask pending verification | `ASK PENDING  ceiling 3, you are at 1. She wants to verify you first.` Shown when an ask has `verification` facts; the next turn's checks are scored as ordinary claims, and a failure ends the call. |
| Ask refused | `ASK REFUSED  ceiling 3, you are at 5. She needs more before doing this.` |

Each string is authored per NPC (so Priya's tells sound like Priya) and checked by an empty-string
lint like `04` N3. The NPC's **spoken** reaction carries the same information in character ("Jed
Baker? He's in Sales Ops, isn't he?"), so the cue is both diegetic and written down. After the call,
the debrief lists every entry in order. The player is never left guessing which line did it.

**SecGen failures this avoids** (see `README.md`): rejections that did not say what failed (every line
here gets a named factor and reason); loose substring matching (no text matching at all, only authored
ids and slot values); replies lost off-screen (the tells panel and debrief hold the whole history; the
transcript persists in `person-chat` state); a dead-end victim who rejects everything (every NPC has a
`walkAway` exit, a repair path, and a hint ladder).

### Hints

After a caught call, the next attempt can show a one-line nudge naming what to find on the board: first
the category ("Check who runs Finance"), then the fact source ("The company page lists the Finance
team"), then near-explicit ("Melanie Pierce manages Finance"). Same three-step ladder as `04` hints.

### Worked example: Priya at the AccountingNow helpdesk

Fictional company. Priya Nair, helpdesk. `baseline` 2, wary at 4, challenge at 7. Her directory holds
the new starter **Sam Okafor** (Finance, manager Melanie Pierce, started Monday the 6th, second floor).
Her policy: no password reset without two matched verification facts. She enjoys that the helpdesk won
the team award, which the company page mentions. The player's pretext card says: Sam Okafor, Finance,
new starter, locked out. The **manager slot is Jed Baker**, picked from a stale org chart on the board.

| Turn | Priya says | Player picks | Judge | Meter | Panel shows |
|------|-----------|--------------|-------|-------|-------------|
| 0 | "AccountingNow helpdesk, Priya." | | baseline | 2 CALM | |
| 1 | (same) | "Hi, Sam Okafor, started in Finance Monday, locked out." | name ✓, team ✓: -2, capped to -1 | 1 CALM | `-1 CALM 1/10 ✓ Name and team are in the directory.` |
| 2 | "Welcome, Sam. Who's your line manager?" | "Jed Baker said to ring you." | manager ✗ (identity-grade) +3, fact opens | 4 WARY | `+3 WARY 4/10 ✗ Manager. You said "Jed Baker". Her directory shows Melanie Pierce.` Priya: "Jed Baker? He's Sales Ops, isn't he?" |
| 3 | (same) | "Sorry, Melanie Pierce. A week in and I'm mixing up names." | repair: claim ✓ -1, candour -1 | 2 CALM | `-2 CALM 2/10 ✓ Corrected. Owning a slip early costs less than defending it.` |
| 4 | "No worries. Found you." | "Congrats on the team award, saw it on the company page." | shared detail: claim checks out -1, technique -1 (stack: the cap limits match credit only) = -2 | 0 CALM | `-2 CALM 0/10 ✓ Shared detail. A real detail she can confirm builds trust.` |
| 5 | "What can I do?" | "Can you confirm my email address? I want to give it to a supplier." | ask `email_format`, pressure 0, ceiling 5 | 0 CALM | `ASK OK ceiling 5, you are at 0. Low-stakes: she would tell any new starter this.` Priya: "sam.okafor@accountingnow.example, first dot last." Sets `email_pattern_known`. |
| 6 | "Anything else?" | "Could you reset my password? I still can't get in." | ask `pw_reset`, pressure +1, ceiling 3; needs 2 verification facts | 1 CALM | `ASK PENDING ceiling 3, you are at 1. She wants to verify you first.` Priya: "Before I do: your start date and which floor?" |
| 7 | (same) | "Monday the 6th, second floor." | start date ✓, floor ✓ (both from the announcement post): -2, capped to -1 | 0 CALM | `-1 CALM 0/10 ✓ Verification passed: start date and floor.` Priya: "Done. Temporary code is on your screen. Change it at login." Sets `reset_granted_okafor`. |

Result: **got it**, finishing at 0/10. The slip in turn 2 cost three pips and was recovered in turn 3
because the player owned it; the winning move was the early correction, not luck.

Same call, other choices at the same points (shown in the training debrief as "what if"):

| Point | Player picks | Judge | Result |
|-------|--------------|-------|--------|
| Turn 2 | "Does it matter? I'm in a hurry." | urgency on a policy-trained NPC +1, dodging a direct question +1 | 1 + 2 = 3 CALM, one pip from wary; she asks again |
| Turn 3 | "No, it's definitely Jed." | doubling down on an open mismatch +2 | 4 + 2 = 6 WARY, one more slip is a callback |
| Turn 6 | "The director needs my figures, reset it now." | urgency +1, borrowed authority +2 (she hears "authority" as not-verification), ask pressure +1 | 0 + 4 = 4 WARY, over ceiling 3: `ASK REFUSED`; Priya: "I can't reset on anyone's say-so, even a director's. I'll ring you back on the extension we hold." Second refusal = **caught**. |
| Turn 7 | "Monday the 6th, third floor." | floor ✗ +3, verification failed | 1 + 3 = 4, but a failed verification ends the call: **caught** (callback). Sets `helpdesk_alerted`. |

The defender note for the debrief reads: "Callback to a number already on file defeats every one of
these lines. And the two verification answers, start date and floor, were not secrets: both came from a
public announcement post, so anyone who read it could answer. A verification question only works if its
answer is something an outsider cannot find. The attacker's best move is one that never reaches a reset."

## 5. Scenario-authored data

The engine holds no content. Three authored things: the **scenario JSON** (pretext card, NPC knowledge,
weights, thresholds, outcomes), the **ink** (the conversation's shape and the NPC's in-character
lines), and the **intel facts** already on the board (`02`/`03`). Weights live in JSON so a designer
can retune difficulty without touching the ink.

```jsonc
"pretextCalls": [
  {
    "id": "helpdesk_call",
    "npcId": "priya_helpdesk",              // an ordinary NPC with an ink story
    "channel": "voice",                     // "voice" | "inPerson" | "chat" (chat uses phone-chat)
    "brief": {
      "scopeNote": "Authorised test of FICTIONAL AccountingNow. Helpdesk call is in scope.",
      "objectives": [
        { "id": "email_format", "label": "Confirm the staff email format" },
        { "id": "pw_reset", "label": "Get a password reset for a Finance account", "optional": true }
      ]
    },
    "pretextCard": {
      "slots": [
        { "id": "who",     "label": "Who I am",    "from": "board.people" },
        { "id": "team",    "label": "My team",     "from": "board.company.teams" },
        { "id": "manager", "label": "My manager",  "from": "board.people" },
        { "id": "reason",  "label": "Why I'm calling",
          "options": ["locked_out", "cannot_find_form", "chasing_invoice"] }
      ],
      "allowEmptySlots": true               // an empty slot means bluffing: claims on it are unverifiable
    },
    "tuning": {
      "baseline": 2, "wary": 4, "challenge": 7, "max": 10,
      "matchCreditCapPerLine": 1, "maxRefusals": 2,
      "feedbackMode": "live",               // "live" | "debriefOnly"
      "tellDetail": "full",                 // "full" | "category" | "none"
      "showTechniqueNames": "live",         // "live" | "debriefOnly"
      "meterVisible": true
    },
    "npc": {
      "knows": {                            // what Priya can CHECK, by fact id
        "who":      { "value": "sam_okafor",       "weight": 3 },
        "team":     { "value": "finance",          "weight": 3 },
        "manager":  { "value": "melanie_pierce",   "weight": 3 },
        "startDate":{ "value": "mon_6th",          "weight": 2 },
        "floor":    { "value": "2",                "weight": 2 },
        "award":    { "value": "helpdesk_award",   "weight": 1 }   // a shared-detail fact
      },
      "susceptibility": {                   // technique modifiers for this NPC
        "urgency": 1, "authority_borrowed": 2, "reciprocity": 0,
        "shared_detail": -1, "candour": -1, "deflect": 1
      },
      "unverifiableCost": 1,
      "tells": {                            // per fact: authored, in her voice
        "manager": {
          "pass":    "Manager checks out.",
          "fail":    "Manager. You said \"{said}\". Her directory shows {actual}.",
          "failCategory": "Manager. That did not match what she can look up.",
          "unknown": "Manager. She cannot check this."
        }
        // ... one block per fact in "knows"
      }
    },
    "utterances": {                         // the choices, by id (used from ink)
      "open_new_starter": { "technique": null,
                            "claims": [ {"fact":"who","from":"slot:who"}, {"fact":"team","from":"slot:team"} ] },
      "give_manager":     { "technique": null,
                            "claims": [ {"fact":"manager","from":"slot:manager"} ] },
      "repair_manager":   { "technique": "candour", "repairs": "manager",
                            "claims": [ {"fact":"manager","from":"literal:melanie_pierce"} ] },
      "double_down":      { "technique": null, "doublesDown": "manager", "extra": 2 },
      "praise_award":     { "technique": "shared_detail",
                            "claims": [ {"fact":"award","from":"literal:helpdesk_award"} ] },
      "urgent_director":  { "technique": "urgency", "also": ["authority_borrowed"], "claims": [] }
    },
    "asks": {
      "email_format": { "pressure": 0, "ceiling": 5, "verification": [],
                        "grants": { "setGlobal": { "email_pattern_known": true } } },
      "pw_reset":     { "pressure": 1, "ceiling": 3, "verification": ["startDate","floor"],
                        "grants": { "setGlobal": { "reset_granted_okafor": true } } }
    },
    "outcomes": {
      "caught": { "setGlobal": { "helpdesk_alerted": true },
                  "line": "I'll ring you back on the number we hold for you.",
                  "cooldownSeconds": 0, "retry": "allowed" },
      "walkAway": { "setGlobal": {} }
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

- `from` resolves to a **pretext-card slot**, a **literal**, or `none`. A claim whose `fact` is absent
  from `npc.knows` is automatically *unverifiable*.
- A fact is correct if `claim.value === knows[fact].value`. Comparison is on fact ids the board uses
  (the same ids as `02` intel facts), so there is no text parsing.
- `susceptibility` keys are a small fixed vocabulary (urgency, authority_borrowed, reciprocity,
  shared_detail, candour, deflect). Adding a new key is an engine-and-validator change.
- Weights and technique values are safe to tune per NPC. The validator warns if the tuning leaves no
  route to "got it" (the no-dead-end check).
- Authors write each choice's label and the NPC's reaction in ink; only ids and numbers live in JSON.

### The ink side

Ink owns the shape of the call: who speaks, which choices appear when, and how the NPC reacts. Ink
calls the engine through an **external function** and reads the band back, so the reaction depends on
the result of the player's own line. Sketch (no engine knowledge in the ink beyond two functions):

```ink
EXTERNAL pretext_say(utterance_id)       // returns band: 0 calm, 1 wary, 2 challenge
EXTERNAL pretext_ask(ask_id)             // returns 0 refused, 1 granted, 2 needs verification
VAR pretext_band = 0

=== manager_question ===
Priya: Welcome, Sam. Who's your line manager?
+ [Say your manager is {pretext_manager_name}]
    You: {pretext_manager_name} said to ring you.
    ~ pretext_band = pretext_say("give_manager")
    -> manager_reaction
+ [Say it doesn't matter, you're in a hurry]
    You: Does it matter? I'm in a hurry.
    ~ pretext_band = pretext_say("hurry_deflect")
    -> manager_reaction

=== manager_reaction ===
{ pretext_band:
- 0: Priya: Right, got you. -> next_step
- 1: Priya: Hm. Jed Baker? He's in Sales Ops, isn't he? -> offer_repair
- 2: -> caught
}
```

`pretext_manager_name` is a declared ink VAR the engine fills from the pretext card at call start.
The tells panel is drawn by the engine inside `pretext_say`/`pretext_ask`; ink never formats feedback.

## 6. Engine wiring

### What already exists and is reused unchanged

| Need | Existing code |
|------|---------------|
| Register and start a minigame; `onComplete` | `minigame-manager.js:229` (`registerScene`), `:15` (`startMinigame`). `person-chat` registered at `minigames/index.js:157`. |
| Dialogue overlay: portrait, lip-sync, caption, choices, `chatBackground` | `minigames/person-chat/` (`person-chat-ui.js`, `person-chat-portraits.js`, `lip-sync.js`, `person-chat-background.js`) |
| Texting variant (for a chat-channel pretext) | `minigames/phone-chat/` (choices, history, scroll, speaker) |
| Start at a given knot; keep NPC story state | `startKnot` param (`person-chat-minigame.js:57`), `person-chat-event-start.js` |
| Ink load and drive | `systems/ink/ink-engine.js`; `person-chat-conversation.js:54`, `person-chat-minigame.js:475`, `phone-chat-minigame.js:417` |
| Ink to game: action tags | `processGameActionTags` (`chat-helpers.js:24`): `#set_global:name:value` (`:453`), `#set_variable:name=value` (`:548`), `#complete_task` (`:392`), `#trigger_minigame` (`:187`) |
| Globals as scenario state, with change events | `applyActions` `set_global` (`apply-actions.js:33-40`) emits `global_variable_changed:<name>` |
| Globals reach ink | `isGlobalVariable` (`npc-conversation-state.js:362`): a name declared in the scenario's `globalVariables`, or prefixed `global_` |
| Outcome to objective | `onComplete.setGlobal` on tasks (`objectives-manager.js:754`); `minigame_completed` event (`base-minigame.js:84-108`) |
| Save/restore NPC ink state | `saveNPCState`/`restoreNPCState` (`npc-conversation-state.js:26`, `:94`) |

### Where `#set_global` / `#set_variable` are refused

Two places, both about **imported read-only globals**, not about conversation type:
`npc-conversation-state.js:329` documents `setReadOnlyGlobals` (names imported from an earlier
mission; ink assignments and the tags are refused), and the refusals are at `chat-helpers.js:466`
(`set_global`) and `:561` (`set_variable`). Consequences for this design:

- Pretext outputs (`email_pattern_known`, `reset_granted_okafor`, `helpdesk_alerted`) must be
  **declared in `globalVariables`** and must **not** be named in `importedGlobals`, or the write is
  silently refused with only a console warning. The validator should check this.
- `#set_global:name:value` splits on `:` (`chat-helpers.js:456`), so values with colons break. Use
  plain flags and numbers. The engine writes the real outcome globals itself through `applyActions`.
- Writes from the tag path reach other loaded stories through `broadcastGlobalVariableChange`
  (`chat-helpers.js:495`, `:581`). The new module goes
  through the same helpers rather than touching `gameState.globalVariables` directly.

### Why the suspicion meter is not driven by tags

The first idea was to tag each choice with a weight and count tags. It does not fit the engine:

- Choice tags are dropped before the UI sees them. `ink-engine.js:69` and `:98` rebuild choices as
  `{ text, index }` only, so `person-chat-conversation.js:328` (`tags: choice.tags || []`) is always empty.
- Line tags are processed after a text batch (`person-chat-minigame.js:1032`), too late for ink to branch
  on the result in the same step.
- Weights in ink tags would also put the numbers inside the dialogue file, where a designer cannot
  retune them in one place.

Instead the ink calls two **external functions** (`pretext_say`, `pretext_ask`) that the engine binds. They
run synchronously while ink continues, return a small integer, and ink branches on it. External functions are a proven pattern here: `person-chat-conversation.js:98-131` and
`phone-chat-conversation.js:135-169` each bind six through `bindExternalFunction` (`ink-engine.js:138`; data
contract 00 §6), so `pretext_say` and `pretext_ask` need no spike.

One caveat, from the wrapper. It forwards only `(name, func)` to inkjs (`ink-engine.js:142`) and drops a
third argument, so `lookaheadSafe` cannot be passed. The inkjs default (`false`) is the setting a
side-effecting function wants, since inkjs then does not evaluate it speculatively. To be safe regardless,
both functions take one argument (the id) and are **idempotent per step**: the session records the last
`(stepIndex, id)` it judged and returns the stored result if the same call arrives again, so the tells
panel cannot double-fire. If a later pure read function ever needs `lookaheadSafe = true`, the wrapper
must be extended to forward the third argument.

### New components

- `systems/pretext-judge.js`: a **pure module** (no DOM), same shape as `phish-rules.js` in `04`.
  `judgeUtterance(call, session, utteranceId) -> { delta, band, entries[], caught }` and
  `judgeAsk(call, session, askId) -> { result, entries[], caught }`. Unit-testable from the scenario
  JSON alone.
- `PretextSession`: `{ callId, suspicion, openMismatches, refusals, log[], slots }`. Held at
  `window.gameState.globalVariables['pretext_<callId>_state']`, the only gameState branch that saves to the
  server (the STATE_KEY pattern in `siem-dashboard-minigame.js:925` and `command-board-minigame.js:445`; data
  contract 00 §5), so a reload keeps the meter and the log. A retry starts a fresh session while the old
  transcript stays in history. The key is a declared global (validator checks it).
- `minigames/pretext-prep/`: beats 1 and 2 (brief, pretext card). On complete, it starts
  `person-chat` with `{ npcId, startKnot, pretextCallId, slots }`. Registered like any scene
  (`minigame-manager.js:229`), started from a starter in `systems/minigame-starters.js` (pattern as in `01`).
- `minigames/person-chat/person-chat-pretext.js`: attaches when `params.pretextCallId` is present. After
  the story loads (`person-chat-minigame.js:475`), it binds the two externals, writes slot values into
  ink VARs, and mounts the **gauge** and **tells panel** in `person-chat-ui.js`. The same module
  attaches to `phone-chat` after `phone-chat-minigame.js:417`, where tells render as system bubbles in the
  thread (`phone-chat-history.js`) and the gauge sits in the header.
- Debrief panel: reads `session.log`. Opens when the conversation ends.

### Starting the call and the completion event

An NPC with a `pretextCallId` in the scenario (a desk phone object, a receptionist, a phone on the intel
board) starts `pretext-prep` instead of straight dialogue; the existing NPC interaction path
(`interactions.js:695` starts `person-chat`) is the pattern. On end, `PersonChatMinigame` sets
`this.gameResult` and calls `this.complete(true)` (`person-chat-minigame.js:1043`, `:1255`); `base-minigame.js:84-108`
emits `minigame_completed` with `result`:

```jsonc
{ "callId": "helpdesk_call", "outcome": "got_it",   // "got_it" | "caught" | "walked_away"
  "asks": ["email_format","pw_reset"], "suspicionEnd": 1, "log": [ /* tells entries */ ] }
```

### How outcomes bridge to state

1. The engine applies the ask's `grants.setGlobal` and the outcome's `setGlobal` with `applyActions`
   (`apply-actions.js:33-40`), which also fires `global_variable_changed:<name>`.
2. A task's `onComplete.setGlobal` (`objectives-manager.js:754`) or an ink `#complete_task` tag
   (`chat-helpers.js:392`) moves the objective on.
3. Other systems listen for the same global events, which is how the call joins the email loop (below).

### Links into the email loop

| Global from a call | Consumer | Effect |
|--------------------|----------|--------|
| `email_pattern_known` | Intel board (`03`): company panel; mail client (`01`) | Pattern appears on the board and the composer can build addresses for other staff, without the player guessing. |
| `reset_granted_<id>` | Phish rules (`04`) target data | A target can list `boostIfGlobal`: with a reset on record, an "IT" sender or "new login" pretext passes `senderTrust`/`pretextRelevant`, and the reply says why ("IT said they'd reset my login"). |
| `helpdesk_alerted` | Phish rules (`04`), mission scenario | The target gets stricter (a `strictIfGlobal` flag): the later phish must be sharper. Teaches that a caught pretext warns the target. |

### New engine work required

| # | Item | Notes |
|---|------|-------|
| N1 | `pretext-judge.js` pure module | Deterministic; unit tests from sample JSON |
| N2 | `PretextSession` state at `globalVariables['pretext_<callId>_state']` | Reload-safe (STATE_KEY pattern); fresh per attempt; key declared in `globalVariables` |
| N3 | Bind `pretext_say` / `pretext_ask` in `person-chat` and `phone-chat` | Proven pattern (00 §6); one-argument, idempotent per step. Wrapper drops a 3rd arg (`ink-engine.js:142`), so extend it only if `lookaheadSafe = true` is ever needed |
| N4 | Gauge and tells panel in `person-chat-ui.js`; bubble variant in phone-chat | House-style widgets |
| N5 | `pretext-prep` minigame (brief + pretext card, slots from the board) | Reads `03` data |
| N6 | Debrief panel, with technique names and defender notes | Reads `session.log` |
| N7 | `gameResult` payload on completion | Documented for scenario authors |
| N8 | Validator rules: utterance and ask ids referenced by ink exist; every fact in `claims` is in `npc.knows` or intentionally unverifiable; output globals declared and not imported; a path to "got it" exists under the tuning; empty-string lint on `tells` | Extends the scenario validator |
| N9 | Scenario authors use the existing `boostIfGlobal` / `strictIfGlobal` hooks (00 §7) in `04` target data | No new engine work in 06; `04` must implement them |
| N10 | Call knots must avoid once-only (`*`) choices | Authoring rule; ink state persists (`npc-conversation-state.js:94`) so exhausted choices would return empty on retry. Use `+` choices, or reset via `startKnot`. |

## 7. Reuse across audiences

Depth is data in `tuning`, `npc.knows` and `pretextCard`; the engine does not change.

| Setting | Student lab | Awareness | Mission (m01–m08) |
|---------|-------------|-----------|-------------------|
| Pretext card | Full: four slots, stale facts on the board, empty slots allowed | One preset pretext, one slot to confirm | Pre-filled from the mission's cover identity |
| Facts the NPC checks | 5–6, with a verification ask | 2 | 2–3, in the mission's voice |
| `tellDetail` / `feedbackMode` | `full` early, then `category` + `debriefOnly` for later calls | `full`, `live` | `full`, `live`; the mission's handler can narrate it |
| Technique names | In debrief, live in the first call | Live, plain wording | Debrief only |
| `baseline`, thresholds | 2 / 4 / 7 | 1 / 5 / 9 (forgiving) | Set by the stage's tension |
| Hints | Three-step ladder after a caught call | Hint offered on first caught call | Handler (Agent HaX) gives the nudge |
| Caught | Cooldown or a harder second call | Immediate retry | Raises an alert global the mission uses |
| Role swap | Optional: play Priya, decide to call back or not | Required: the defender half | Not used |
| Channel | voice, inPerson, chat | voice or chat | inPerson or voice |

The **role swap** is the defender mirror, in line with the suite's "attacker first, defender next" spine.
The player takes Priya's seat, gets a scripted caller whose lines were generated from the same
`utterances` data, and must choose callback or comply. The game scores them with the same facts the
attacker was scored on, so attack and defence never disagree about what a tell is (the same principle
as `04` and `05`). It is not specified further here; it needs the NPC-side policy data (`05` shares it).

## 8. Art / audio assets needed

PixelLab-first; not to be generated now. Check scope with the user before any batch.

- **Gauge:** ten-pip bar with two tick marks, in `Press Start 2P` labels, `#00ff41` calm, amber wary, red
  challenge. Drawn low-res and scaled with `image-rendering: pixelated`. About 96x16.
- **Tells panel** frame, verdict marks (tick, cross, question, exclamation), 16x16 each.
- **Portrait expressions** for the NPC in three bands (relaxed, wary, suspicious): either extra portrait
  frames per NPC, or reuse the existing talk and viseme sheets with a tint. Default: reuse, tint only,
  to avoid per-NPC art (per the standing portrait-facing and viseme conventions).
- **Pretext card** frame and slot sprites (the pinned-note look from the intel board `03`).
- **Backgrounds:** a helpdesk office and a reception desk at 400x400 via `tools/pixelate_background.py`
  (voice calls can reuse a video-call style or a plain desk background). One new NPC per call.
- **Audio:** a soft tick for a calm drop, a low sting for a rise, a phone ring and click-off for the
  call. Voiced lines follow the existing TTS pipeline (`tts-audio` skill); no new voice work in design.

## 9. Open questions

Each is also in `QUESTIONS_FOR_USER.md` (entries tagged `06-Q1` to `06-Q4`).

- **OQ1 (06-Q1).** Where does suspicion live: a hidden meter shown only as the NPC's mood and the tells
  panel, or a visible gauge with numbers? Default: visible gauge, no number in assessment mode.
- **OQ2 (06-Q2).** Is the role swap (play the helpdesk analyst) in the first slice? Default: no; ship the
  attacker call first, add the swap with the defender work in `05`.
- **OQ3 (06-Q3).** Do pretext outputs feed the later phish (`boostIfGlobal`)? Default: yes, it is the link
  the brief asks for, using the `boostIfGlobal` / `strictIfGlobal` hooks already defined in 00 §7.
- **OQ4.** Should a caught call lock the player out for a while? Default: no hard lock (fun, not
  hard); it raises the target's strictness instead.
- **OQ5.** Free-text speech? Default: no. Authored choices keep judging exact; a free-text mode would
  re-open the matching problems `04` works hard to avoid.
- **OQ6 (06-Q4).** Is the policy we model realistic enough to teach from (a helpdesk reading a temporary code
  over the phone after two matched facts)? It is deliberately weak so the attacker can win, and the
  defender note says so. Wants a security-accuracy check; default: keep, labelled as a weak policy.
