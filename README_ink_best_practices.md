# Ink Story Writing Best Practices for Break Escape

> **Canonical location.** This root `README_ink_best_practices.md` is the authoritative guide for writing NPC dialogue and interactive-story ink in Break Escape. Pair it with the `npc-dialog-review` skill (dialogue-quality review) and `README_scenario_design.md` + the `scenario-design-review` skill (structure/solvability review).

> **Writing style.** This file covers ink mechanics. For what characters say and how (line jobs, information first, subtext, choices, line lengths, AI tells), see the [dialogue style guide](story_design/universe_bible/09_scenario_design/dialogue_style.md). For how each recurring character sounds, see the [voice bible](story_design/universe_bible/04_characters/voice_bible.md).

## Dialogue Attribution: Inline Prefixes (Primary Method)

The primary way to attribute dialogue in Break Escape Ink is the **inline `Character Name: text` prefix format**. The engine parses the character name, looks it up in the character registry, and displays the correct portrait and label automatically. No `# speaker:` tag needed.

```ink
=== start ===
Maya Chen: Oh! You startled me. You're the IT contractor, right?

=== hub ===
Sarah O'Brien: Kevin should be in the IT room on the east side.
Agent HaX: Get inside and find out what ENTROPY is planning.
```

This is the approach used throughout Mission 1: First Contact and is the recommended style for all new NPC conversations.

### How the Engine Resolves Speakers

The engine uses `parseDialogueLine()` (in `person-chat-minigame.js`) to check each line for a `Character Name:` prefix and match it against the character registry. Processing priority is:

1. **Inline prefix** — `Character Name: dialogue text` — matched against the character registry
2. **`# speaker:` tag** — fallback used when a line has no inline prefix (see below)
3. **Default** — lines with no prefix and no tag attribute to the main NPC

### ⚠️ The prefix must match `id` or `displayName` EXACTLY

This is the single most common silent bug in Break Escape dialogue, and it does not fail at compile time.

`normalizeSpeakerId()` matches the text before the colon (case-insensitively) against each character's **`id`** or **`displayName`**, plus the special cases `player`, `npc`, `you` and `Narrator`. **Nothing else resolves.** A shortened name does not resolve. A role word does not resolve.

When a prefix fails to resolve, ink still compiles, the validator's old checks still pass, and the engine treats the whole line as *unprefixed* — so it appends the raw text, colon and all, to **whoever spoke last**. The player sees the other character's speech bubble containing `Marcus: I told them six months ago`.

❌ **WRONG** — NPC `displayName` is `"Marcus Webb"`, so `Marcus:` does not resolve:
```ink
Marcus: I told them six months ago.
```

✅ **RIGHT**:
```ink
Marcus Webb: I told them six months ago.
```

The same trap catches `Nurse:` (displayName `Sister Doyle`), `Guard:` (displayName `Val Okonkwo`), `Dr. Kim:` (displayName `Dr. Sarah Kim`), and `Supervisor:` (displayName `Graham Reeves`).

If you want a shorter label on screen, **change the `displayName` in the scenario** — do not shorten the prefix in the ink.

`ruby scripts/validate_scenario.rb <scenario>` now checks this. A prefix used five or more times in a file that matches no NPC is reported as ❌ INVALID; a one-off is reported as 💡 SUGGESTION, because prose labels (`Command: nmap -sV ...`, `Reasoning: ...`) look identical to a naive check and render harmlessly.

**`You:` is safe** — the engine aliases it to the player character. `Player:` works too.

### Narration and Stage Directions

Use the `Narrator:` inline prefix for stage directions. These display as italicised text rather than dialogue:

```ink
=== derek_office ===
Narrator: The room is dark. Files are scattered across the desk.
Maya Chen: *glances at door* Is it safe to talk?
```

For narration associated with a specific character portrait, use `Narrator[character_id]:`:

```ink
Narrator[maya_chen]: Maya shifts uncomfortably and lowers her voice.
Maya Chen: I've seen the target lists. People will die.
```

A plain `Narrator:` line keeps whatever portrait is showing. For a scene with nobody in frame, use `Narrator[none]:`. A `Background[path]:` line also clears the frame: the new background shows on its own until the next speaker line (or `Narrator[character_id]:`) brings a portrait back.

```ink
Background[assets/backgrounds/miskatonic_campus.png]:
Narrator: Miskatonic University. Freshers' week.
Narrator[player]: You join them. Nobody looks at you twice.
```

### Emotes vs. Narration: describe actions with the Narrator, keep flavour on dialogue

Two related rules — a real bug in the m01 Derek confrontation taught us why they matter (emote lines that began with `*` compiled into phantom player-choice buttons and dead-ended the surrender branch):

**1. A line that describes what is *happening* is a `Narrator:` line.** Physical actions, scene changes, and plot beats ("Derek sets down the launch device", "SAFETYNET backup arrives and restrains him") are narration — not a character's dialogue. Prefix them `Narrator:`.

**2. Inter-line flavour must be an emote *attached to a spoken line* — never standalone.** Small vocal / emotional / gesture cues (`*sighs*`, `*laughs*`, `*quietly*`, `*glances at the door*`) are delivery signals to the Gemini TTS for how the line is spoken. They must ride along with actual dialogue on the same character-prefixed line. **An emote with no dialogue is wrong** — for example, `Derek: *smiles*` on its own is not OK.

❌ **WRONG** — standalone emote, and (worse) it starts the line with `*`, so the compiler parses it as a player choice:
```ink
Derek Lawson: *smiles*
*laughs*
```

✅ **RIGHT** — emote fused with the character's spoken line:
```ink
Derek Lawson: *smiles* You really don't understand what we're building.
Derek Lawson: *laughs* You think I'd sell out the only people who understand the truth?
```

✅ **RIGHT** — a described action becomes a Narrator beat, with the dialogue on its own line:
```ink
Narrator: Derek sets down the launch device.
Derek Lawson: Take it. Stop the launch. I won't resist.
```

**Why this matters mechanically:** any line beginning with `*` is parsed as a `*` choice. A prefix-less emote line (`*laughs*`) therefore becomes a phantom choice button and can silently dead-end the branch — often surfacing only as an "apparent loose end" compiler warning. **Always lead the line with the speaker prefix (`Derek Lawson: *laughs* …`) or `Narrator:`** so the `*` sits *inside* the line, never at its start.

Rule of thumb: if it describes *what happens*, it's `Narrator:`; if it colours *how a line is spoken*, it's an inline `*emote*` on that character's dialogue — and it always carries dialogue with it.

#### Don't convert every emote — each `Narrator:` line costs the player a click

The split above is about *category*, not volume. Every `Narrator:` beat becomes its own dialogue block the player must advance past, so mechanically converting every gaze and gesture makes conversations feel like wading.

Apply the rule with judgement:

| Keep inline (delivery cues the TTS can act on) | Promote to `Narrator:` (events in the scene) |
|---|---|
| `*quietly*`, `*flatly*`, `*sharply*`, `*very evenly*` | Handing something over, reaching for a radio |
| `*sighs*`, `*snorts*`, `*tired laugh*`, `*almost laughs*` | Crossing the room, stepping between the player and a door |
| `*pause*`, `*slowly*`, `*breath*` (pacing for the TTS) | Looking up for the first time — where it marks the scene turning |
| `*not looking up*`, `*without turning round*` (manner of delivery) | Having to look away because they're overcome |

The test: **would losing this line cost the scene a beat, or just a bit of colour?** Beats get their own Narrator line. Colour rides along with the dialogue, where it also does useful work steering the voice.

### Dialogue must be supported by the scenario

Ink can assert anything. The engine only renders what the scenario actually defines, and the mismatch is invisible until playtest. Before signing off a conversation, check the ink against the scenario JSON:

- **Movement vs `behavior`.** An NPC with no `behavior.patrol` never moves. Stage directions like *"without stopping"*, *"takes you down the row"*, or *"comes back with"* describe a character the player will never see. Either give the NPC a patrol, or make the stillness the characterisation — a ward sister who cannot leave the one bed that will kill someone in four minutes is more interesting than one who paces.
- **Props.** Anything the dialogue draws attention to should exist as an object in that room, or the player will hunt for it. If it must not be takeable (because it would bypass a puzzle), add it as a `takeable: false` object rather than leaving it as narration.
- **Handovers.** "Take it, it's yours" needs a `#give_item` tag *and* a matching entry in the speaking NPC's `itemsHeld`. The validator cross-references this — but only for the tag, not for the promise. A line that offers something and doesn't tag it fails silently.
- **Geography.** Directions in dialogue ("east of reception", "down the south corridor") go stale the moment the layout changes. Re-read every direction after any connection edit.
- **Sprites vs narration.** If a knot says a character has been taken away, hide them — `setVisible: false` on an event mapping — or the player walks back in and finds them standing there.
- **Off-screen intentions.** A stationary NPC saying "I go into that meeting in five minutes" will still be standing there two hours later. Phrase intentions so they stay true for an unbounded night ("they keep moving the call").

Legitimate exceptions: events genuinely off the map (other wards, the world outside), and post-mission debriefs describing what happened afterwards.

### Multi-Character Scenes

Use inline prefixes for each character. The engine matches each name against the character registry, so all named speakers get correct portraits automatically:

```ink
=== meeting ===
Alex: Have you met my colleague?
Jordan: Nice to meet you. I manage the backend systems.
Alex: We work great together!
```

No `# speaker:` tags required.

---

## `# speaker:` Tags — Fallback Only

`# speaker:` tags are a fallback mechanism for lines that have **no inline character prefix**. You should rarely need them in practice.

| Tag Format | Usage |
|-----------|-------|
| `# speaker:npc` | Attribute the following tag-less line to the main NPC |
| `# speaker:player` | Attribute the following tag-less line to the player |
| `# speaker:npc:character_id` | Attribute to a specific character by ID |

**When you might use them:**

- A line of dialogue with no natural character prefix (e.g., atmospheric one-liners)
- Explicitly marking player-spoken lines that have no prefix

**When you do NOT need them:**

- Any line written as `Character Name: text` — the prefix handles it
- Narration written as `Narrator: text` — the prefix handles it
- Single-NPC conversations — lines without any prefix already default to the main NPC

### Technical Implementation

**Code location**: `js/minigames/person-chat/person-chat-minigame.js` → `parseDialogueLine()` and `createDialogueBlocks()`

---

## Recommended NPC Structure (REQUIRED)

All Break Escape NPC conversations **must** follow this standard structure:

1. **`=== start ===` knot** - Initial greeting when conversation opens
2. **`=== hub ===` knot** - Central loop that always repeats after interactions
3. **Hub must have at least one repeating exit choice** - Include `+ [Exit/Leave choice] #exit_conversation` with `+` (sticky choice)
4. **Hub loops back to itself** - Use `-> hub` to return from topic knots
5. **Player choices in brackets** - All `*` and `+` choices wrapped in `[...]` written as short dialogue

### Choice Types: `+` (sticky) vs `*` (non-sticky)

**Critical distinction:**

- **`+` (sticky choice)**: Always available, appears every time the hub is reached
  - **Use for**: Exit options, repeatable questions, ongoing topics
  - **Example**: `+ [Leave conversation] #exit_conversation`

- **`*` (non-sticky choice)**: Appears only once per conversation session
  - **Use for**: One-time narrative progression, initial questions
  - **Important**: State is NOT saved between game loads - the `*` choice will appear again in the next conversation session
  - **Example**: `* [Tell me about your background]`

**At least one unconditional `+` choice must be present in *every knot that can be
entered more than once*** — not just the knot literally named `hub`. If all of a
re-enterable knot's choices are `*`, or are `+` but every one is behind a `{condition}`,
then a later visit can find the choice list empty; ink then falls off the end of the
knot and raises `RUNTIME ERROR: ran out of content`. This compiles cleanly and only
fails at runtime. See "The starved knot" under [Anti-Patterns](#anti-patterns-avoid-these).

A useful way to think about it: `*` does not mean "one-time question", it means
"permanently retire this option" — including on the visit where it was the last option
standing. Prefer `+` with a `{not asked_x}` guard, which retires the *content* while
leaving the knot able to offer something.

### Player Choice Formatting

**Critical**: Every player choice must be written as dialogue in square brackets `[]`, not as menu options or stage directions summarising what the player is about to say.

❌ **WRONG** - Technical menu language / third-person stage direction:
```ink
* [Ask about security]
* [Sympathize with Marcus]
* [Express readiness]
* [Offer to protect Marcus from scapegoating]
```

✅ **RIGHT** - Dialogue as the player would actually speak, first person:
```ink
* [Can you tell me about security?]
* [How do I create a strong password?]
* [I've heard about phishing attacks...]
* [I'm ready. What's the mission?]
* [I'll make sure the evidence shows you warned them. You won't be scapegoated.]
```

The text in brackets appears as the player's spoken dialogue to the NPC. Make it conversational and in-character — it's what the player says out loud, not a label describing their intent.

#### Don't echo the choice in a separate `You:` line

A common mistake is writing a short menu-style bracket and then repeating the actual spoken line as a separate `You:` line right after it:

❌ **WRONG** - Bracket is a label, the real line is duplicated below it:
```ink
* [Sympathize with Marcus]
    You: Budget cuts are common. You did your job by warning them.
    ~ marcus_influence += 15
    -> sympathize_response
```

✅ **RIGHT** - The bracket *is* the spoken line; there's nothing left to echo:
```ink
* [Budget cuts are common. You did your job by warning them.]
    ~ marcus_influence += 15
    -> sympathize_response
```

The engine displays the selected choice text as the player's dialogue when the choice is made — a following `You:` line is redundant at best and, since it silently duplicates what the player just "said", reads as a script error. Fold the intended spoken content into the bracket and delete the echo. This is the consistent pattern in `m01_first_contact` — no NPC ink file there follows a choice with a `You:` line.

A short non-verbal choice (staying silent, walking away without a word) is the one legitimate exception — e.g. `* [Say nothing, let her process]` or `* [Stay silent]` followed by `You: ...` to represent the silence itself. That's an action, not a stage-direction label standing in for dialogue.

#### Decision-terminal / computer menus

For `#speaker:computer` interactions (a terminal decision UI, not a person conversation), the same rule applies: phrase the option as the player's decision in the moment, not a UI action label.

❌ **WRONG:**
```ink
+ [Confirm — upload everything]
+ [Go back]
```

✅ **RIGHT:**
```ink
+ [Confirmed. Send it all.]
+ [Wait -- let me reconsider.]
```

### Hub Structure Pattern

```ink
=== start ===
Maya Chen: Initial greeting here.
-> hub

=== hub ===
* [Player dialogue choice 1]
    -> topic_1

* [Player dialogue choice 2]
    -> topic_2

+ [Exit/Leave]
    #exit_conversation
    Maya Chen: Farewell response.

-> hub
```

**Key points:**
- **Hub always repeats** - Every topic knot must `-> hub` to keep conversation flowing
- **At least one `+` choice required** - Typically the exit option, ensures player can always leave
- `*` choices (non-sticky) appear only once per conversation session, but reset when the game is reloaded
- `+` choices (sticky) appear every time the hub is reached
- Hub always loops with `-> hub` after handling topics
- Exit choice has `#exit_conversation` tag to close minigame
- Exit choice still gets NPC response before closing

**Important**: `*` choice state is NOT persisted between game loads. If a player exits the game and reloads, all `*` choices will be available again. This is simpler than tracking state with variables and is acceptable for most use cases.

---

## Making Choices Matter: Consequence Design

A hub that loops and lets the player exit is the *mechanical* baseline. It is not enough. The most common quality problem in Break Escape dialogue is **flat choices** — options that read as meaningful but deliver the same result no matter which one the player picks. An interactive story earns its "interactive" only when choices change something the player can perceive.

### The flat-choice anti-pattern

A choice is flat when every branch converges on the same information or the same state with no observable difference. The player quickly learns their input is cosmetic and stops reading.

❌ **WRONG** — three "different" openings that all deliver the identical briefing:
```ink
=== start ===
* [You mean Derek. Social Fabric.]
    -> debrief_facts
* [Say that plainly. Who's behind this?]
    -> debrief_facts
* [Just tell me what it cost.]
    -> debrief_facts

=== debrief_facts ===
Agent HaX: Here is the complete rundown, identical regardless of what you just said.
-> hub
```

The tell: multiple choices diverting to the same knot with no variable set in between. If removing the choices entirely would lose nothing, they are decoration.

**Exposing different information is itself a valid consequence — just a lightweight one.** A choice where each branch teaches the player something *different* (asking the handler about the timeline vs. the patient risk vs. the adversary) is not flat: the player's curiosity changed what they know, and that is a real, perceivable result. This is common and entirely appropriate in **briefings and info-gathering conversations**, where letting the player pull on the threads they care about is the whole point. The spectrum runs from *identical content* (flat — fix it) → *different information* (fine, especially for briefings) → *different state that the story pays back later* (best, and what most in-mission and debrief choices should aim for). Tend toward the consequence end of that spectrum wherever a choice plausibly *could* change something later; reserve pure information-differentiation for moments (like a briefing) where the player is simply deciding what to learn.

✅ **RIGHT** — each choice records a stance the story reads later, *and* routes through a hub so no content is skipped:
```ink
=== start ===
* [You mean Derek. Social Fabric.]
    ~ player_cold = true
    -> debrief_hub
* [Say that plainly. Who's really behind this?]
    ~ player_shaken = true
    -> debrief_hub
```
```ink
// ...much later, the debrief pays the stance back:
{player_cold: Agent HaX: You saw the pattern before I named it. That's the job.}
{player_shaken: Agent HaX: You wanted it said plainly. Fine. It was Derek's playbook, run by someone new.}
```

### Convergent choices *are* correct — for stance, not outcome

Not every choice must fork the plot. When the player faces an **immovable** character — an ideological antagonist who cannot be talked out of their position — offering choices that all reach the same next beat is legitimate, because the player is choosing *how they stand*, not *what happens*. Ghost (the ransomware operative) and a committed inside asset are written this way on purpose: their monologue is going to land regardless, and the choices let the player pick their posture toward it.

The distinction that keeps this honest:

- **Legitimate convergence**: the *outcome* is fixed by character (a fanatic won't budge), but the *player's expressed stance* differs and, ideally, is remembered.
- **Flat choice**: the outcome is fixed by *laziness* — the writer routed everything to one knot to save effort, and nothing records that the choice happened.

If you find yourself writing convergent choices, ask: *is this immovable for a story reason, or did I just not build the branch?* If it is immovable, still set a stance variable so the convergence feels authored, not accidental.

### Wire consequences end-to-end with `#set_global`

The highest-value choices reach beyond the current conversation. A decision made talking to one NPC should be visible when the player talks to another, or in the closing debrief. This is done with **cross-file global state**, and it has three mandatory parts — miss any one and the payoff silently never fires:

1. **Set it** where the choice is made, with a `#set_global:<name>:<value>` tag:
   ```ink
   + [Pay the ransom. Save who you can save tonight.]
       #set_global:advised_board_pay:true
       #set_global:advised_board_refuse:false
       Dr. Kim: Then that's what I'll argue. If they ask who advised it, my name goes on it. Not yours.
       -> hub
   ```
2. **Declare it** in the scenario's `globalVariables` block (`scenario.json.erb`) so the engine knows it exists:
   ```json
   "advised_board_pay": false,
   "advised_board_refuse": false,
   ```
3. **Sync-and-read it** in whichever ink file pays it off, by declaring a matching `VAR` (the engine populates it at conversation open):
   ```ink
   VAR advised_board_pay = false
   VAR advised_board_refuse = false
   ```

Then the payoff can reckon the choice against what actually happened. The reward for wiring it fully is a moment that feels like the game *remembered*:
```ink
{advised_board_refuse and paid_ransom:
    Agent HaX: You told Kim to hold the line, and she spent her credibility stalling the board -- on your word. Then someone paid anyway. People remember that.
}
{advised_board_refuse and not paid_ransom:
    Agent HaX: And you kept your word to Kim. You said you'd get the keys without paying, and you did. That's rarer than it should be.
}
```

**Checklist for every `#set_global` you write:** is it declared in `globalVariables`? Is it `VAR`-declared in every ink file that reads it? Does *something* actually branch on it later? A global that is set but never read is a promise the game breaks.

### Consequences must not gate the critical path

Making a choice matter is not licence to soft-lock the player. If a "wrong" or merely *cold* choice withholds something the mission genuinely requires, you have built a trap, not a consequence. The rule: **consequence choices may change flavour, richness, tone, and side rewards freely — but anything on the critical path needs a redundant source.**

Worked example — the ward nurse rewards empathy by handing over a safe's override code directly; a purely transactional player gets sent to dig it out instead:
```ink
{showed_empathy:
    Nurse: The override's never changed in all my years -- it's the hospital's founding year. Take it and go.
- else:
    Nurse: There's a PIN safe on it. Old institutional code -- written down in half a dozen places if you actually look. I've patients to watch.
}
```
This is safe *only because* the code is independently discoverable (a desk note, a plaque, and a brute-force fallback device all exist). The cold player loses a shortcut, not the mission. Before gating anything behind a choice, confirm at least one other path to the same progress — or keep the gate purely cosmetic.

### Reward curiosity with real advantage

The inverse of punishing "wrong" choices: give the *engaged* player something worth engaging for. An optional question that yields genuine foreknowledge — a breadcrumb toward a later mystery, an early warning, a name — makes exploration pay without ever blocking the player who skips it. A receptionist who, only if asked, mentions the plainclothes stranger who never signs the visitor log hands the curious player a head start on unmasking that character later. It sets no puzzle flags and gates nothing; its whole value is that the choice *meant* something.

### Prefer a question-hub over lossy opening choices

A frequent debrief/briefing mistake: front-load the scene with a few big choices that each divert straight into a different slice of content — so picking one **skips** the others. The player makes one pick and never sees the rest. Instead, use a **question-hub**: stance/opening choices set state and funnel into a hub that offers each topic as its own repeatable option, then routes into the shared consequence spine. Nobody misses content; the choices colour it rather than truncating it. (This is the pattern the m02 closing debrief uses: two stance choices → `debrief_hub` → topic questions → the full mission-summary spine.)

### Continuity callbacks make a world feel authored

Choices resonate more when the story visibly remembers events beyond the current scene — prior missions, named characters, established canon. Referencing an earlier operation by name, tying a new antagonist's methods explicitly to an old one, or letting the player *ask* the question that surfaces the link all make the player's attention feel rewarded. Keep such references phrased for whatever state actually carries between missions: if an earlier outcome is not persisted, phrase the callback so it holds true either way ("whatever happened to him at Viral Dynamics") rather than asserting a result the player may not have produced.

### NPC-dialogue robustness: survive a knockout

Because knockout is permanent and the player can attack any NPC, a conversation that is the *only* way to complete a required task or hand over a gating item is a latent soft-lock. On the scenario side this is handled with `taskOnKO` (complete the stranded task on KO) and `globalVarOnKO` (let the debrief acknowledge the KO instead of contradicting it). When you write a conversation that gates progress, make sure its NPC has that safety net. The full treatment lives in the `scenario-design-review` skill (§2h) and `README_scenario_design.md`; flag it here so dialogue authors design with it in mind rather than discovering it in review.

---

## Core Design Pattern: Hub-Based Conversations

Break Escape conversations follow a **hub-based loop** pattern where NPCs provide repeatable interactions without hard endings.

### Why Hub-Based?

1. **State Persistence** - Variables (favour, items earned, flags) accumulate naturally across multiple interactions
2. **Dynamic Content** - Use Ink conditionals to show different options based on player progress
3. **Continuous Evolution** - NPCs can "remember" conversations and respond differently
4. **Educational Flow** - Mirrors real learning where concepts build on each other

## Standard Ink Structure

### Template

```ink
VAR npc_name = "Maya Chen"
VAR favour = 0
VAR has_learned_about_passwords = false

=== start ===
~ favour += 1
Maya Chen: Hello! What would you like to know?
-> hub

=== hub ===
* [Can you teach me about passwords?]
  ~ has_learned_about_passwords = true
  ~ favour += 1
  -> ask_passwords
* [Tell me something interesting]
  -> small_talk
+ [I should get going]
    #exit_conversation
    Maya Chen: See you around!
    -> hub

=== ask_passwords ===
Maya Chen: Passwords should be...
-> hub

=== small_talk ===
Maya Chen: Nice weather we're having.
-> hub
```

### Key Points

1. **Hub Section**: Central "choice point" that always loops back
2. **Exit Choice**: Use `+ [Player dialogue] #exit_conversation` (sticky choice)
3. **Variables**: Increment favour/flags on meaningful choices
4. **No Hard END**: Avoid `-> END` for loop-based conversations
5. **Player Dialogue**: Every choice written as spoken dialogue in brackets

## Exit Strategy: `#exit_conversation` Tag

### What It Does

When a player selects a choice tagged with `#exit_conversation`:
1. The dialogue plays normally
2. After the NPC response, the minigame closes automatically
3. All conversation state (variables, progress) is saved
4. Player returns to the game world

### Tag Placement

**Important**: The `#exit_conversation` tag must be placed on its own line **after** the choice, not inline with the choice text. This ensures the tag appears in the game engine's output where it will be detected.

✅ **CORRECT** - Tag on separate line:
```ink
+ [I need to go]
    #exit_conversation
    {npc_name}: Okay, come back anytime!
    -> hub
```

❌ **INCORRECT** - Tag inline with choice:
```ink
+ [I need to go] #exit_conversation
  {npc_name}: Okay, come back anytime!
  -> hub
```

### Usage

```ink
+ [I need to go]
    #exit_conversation
    {npc_name}: Okay, come back anytime!
    -> hub
```

### Important

- The NPC still responds to the choice
- Variables continue to accumulate
- Story state is saved with all progression
- On next conversation, story picks up from where it left off

## Handling Repeated Interactions

Break Escape uses Ink's built-in features to manage menu options across multiple conversations.

### Understanding Choice Types: `*` vs `+`

Before diving into patterns, understand the fundamental choice types:

**`*` (non-sticky choice)**
- Appears only ONCE per conversation session
- After selected, it disappears from the menu
- **State is NOT saved** - Choice will reappear after game reload
- Use for: One-time narrative moments, initial questions

**`+` (sticky choice)**
- Appears EVERY time the hub is reached
- Never disappears from the menu
- Always available to select
- Use for: Exit options, repeatable questions, ongoing topics

**Critical**: Every hub MUST have at least one `+` choice (typically the exit option) to ensure players can always leave the conversation.

### Pattern 1: Remove Option After First Visit (`once`)

Use `once { }` to show a choice only the first time:

```ink
=== hub ===
once {
  * [Introduce yourself]
      -> introduction
}
+ [Leave]
    #exit_conversation
    -> hub
```

**Result:**
- 1st visit: "Introduce yourself" appears
- 2nd+ visits: "Introduce yourself" is hidden

### Pattern 2: Change Menu Text on Repeat (`sticky`)

Use `sticky { }` with conditionals to show different options:

```ink
VAR asked_question = false

=== hub ===
sticky {
  + {asked_question: [Remind me about that question]}
      -> question_reminder
  + {not asked_question: [Ask a question]}
      -> question
}
+ [Leave]
    #exit_conversation
    -> hub

=== question ===
~ asked_question = true
{npc_name}: Here's the answer...
-> hub

=== question_reminder ===
{npc_name}: As I said before...
-> hub
```

**Result:**
- 1st visit: "Ask a question"
- 2nd+ visits: "Remind me about that question"

### Pattern 3: Show Different Content Based on Progress

Use variable conditionals anywhere:

```ink
VAR favour = 0
VAR has_learned_x = false

=== hub ===
+ {favour < 5: [Ask politely]}
    ~ favour += 1
    -> polite_ask
+ {favour >= 5: [Ask as a friend]}
    ~ favour += 2
    -> friend_ask
+ [Leave]
    #exit_conversation
    -> hub
```

### Combining Patterns

```ink
VAR asked_quest = false
VAR quest_complete = false

=== hub ===
// This option appears only once
once {
  * [You mentioned a quest?]
      ~ asked_quest = true
      -> quest_explanation
}

// These options change based on state
sticky {
  + {asked_quest and not quest_complete: [Any progress on that quest?]}
      -> quest_progress
  + {quest_complete: [Quest complete! Any rewards?]}
      -> quest_rewards
}

+ [Leave]
    #exit_conversation
    -> hub
```

### How Variables Persist

Variables are automatically saved and restored:

```ink
VAR conversation_count = 0

=== start ===
~ conversation_count += 1
NPC: This is conversation #{conversation_count}
-> hub
```

**Session 1:** conversation_count = 1  
**Session 2:** conversation_count = 2 (starts at 1, increments to 2)  
**Session 3:** conversation_count = 3  

The variable keeps incrementing across all conversations!

## State Saving Strategy

### Automatic Saving

- State saves **immediately after each choice** is made
- Variables persist across multiple conversations
- No manual save required

### What Gets Saved

```javascript
{
  storyState: "...",          // Full Ink state (for resuming mid-conversation)
  variables: { favour: 5 },   // Extracted variables (used when restarting)
  timestamp: 1699207400000    // When it was saved
}
```

### Resumption Behavior

1. **Mid-Conversation Resume** (has `storyState`)
   - Story picks up exactly where it left off
   - Full narrative context preserved
   
2. **After Hard END** (only `variables`)
   - Story restarts from `=== start ===`
   - Variables are pre-loaded
   - Conditionals can show different options based on prior interactions

## Advanced Patterns

### Favour/Reputation System

```ink
VAR favour = 0

=== hub ===
{favour >= 5:
  + [You seem to like me...]
    ~ favour += 1
    -> compliment_response
}
+ [What's up?]
    ~ favour += 1
    -> greeting
+ [Leave]
    #exit_conversation
    -> hub
```

### Unlocking Questlines

```ink
VAR has_quest = false
VAR quest_complete = false

=== hub ===
{not has_quest:
  + [Do you need help?]
    ~ has_quest = true
    -> offer_quest
}
{has_quest and not quest_complete:
  + [Is the quest done?]
    -> check_quest
}
* [Leave]
    #exit_conversation
    -> hub
```

### Dialogue That Changes Based on Progress

```ink
=== greet ===
{conversation_count == 1:
  {npc_name}: Oh, a new face! I'm {npc_name}.
}
{conversation_count == 2:
  {npc_name}: Oh, you're back! Nice to see you again.
}
{conversation_count > 2:
  {npc_name}: Welcome back, my friend! How are you doing?
}
-> hub
```

## Anti-Patterns (Avoid These)

❌ **The starved knot: a re-enterable knot where every choice is once-only (`*`)**

This is the single most common way a Break Escape conversation breaks at runtime, and
it compiles perfectly.

```ink
=== chen_provides_access ===
Robert Chen: Here's a Level 1 keycard.

* [Thanks. I'll start with the records]     // all three are once-only
    -> end_professional
* [I appreciate your cooperation]
    -> end_grateful
* {discussed_optigrid} [About those contractors...]
    -> optigrid_details
```

*Problem: the knot has four inbound diverts. On the second arrival the first two
choices are spent and the third is gated off, so the choice list is **empty**. Ink
falls off the end of the knot and raises `RUNTIME ERROR: ran out of content`. In
m04 this exact shape accounted for the great majority of ~1,700 failing paths across
seven knots.*

*Better: make the repeatable options sticky and guarantee at least one always-available
exit. A hub must never be able to run dry.*
```ink
=== chen_provides_access ===
{not chen_provided_keycard:
    Robert Chen: Here's a Level 1 keycard.
}

+ [Thanks. I'll start with the records]      // sticky
    ~ chen_provided_keycard = true
    -> end_professional

+ {discussed_optigrid} [About those contractors...]
    -> optigrid_details

+ [That's everything for now.]               // always available: the safety net
    #exit_conversation
    -> chen_provides_access
```

**The rule:** *any knot that can be entered more than once needs at least one `+`
choice that is never conditional.* Gate content with `{...}` conditions on sticky
choices rather than relying on `*` to retire it — `*` retires the option permanently,
including on the visit where it was your only remaining option.

**Where it bites hardest:** a knot named as an NPC's `currentKnot`, any `hub`, and any
knot that a "one more thing…" / "anything else?" option loops back to. The engine
re-navigates to the current knot every time a conversation re-opens
(`phone-chat-minigame.js:478-482`), so entry knots are re-entered constantly.

**How to catch it:** a depth-first walk of the choice tree does *not* reliably find
this — it caps out before revisiting a hub enough times to starve it. Drive the
conversation for a few hundred steps under several choice strategies and assert the
choice list never empties. See `scripts/ink_runtime_check/loopcheck.js`.

❌ **Hard Endings Without Hub**
```ink
=== conversation ===
{npc_name}: That's all I have to say.
-> END
```
*Problem: Player can't interact again, variables become stuck*

❌ **Showing Same Option Repeatedly**
```ink
=== hub ===
+ [Learn about X] -> learn_x
+ [Learn about X] -> learn_x  // This appears EVERY time!
```
*Better: Use `once { }` or `sticky { }` with conditionals*

❌ **Forgetting to Mark Topics as Visited**
```ink
=== hub ===
+ [Ask about passwords]
    -> ask_passwords

=== ask_passwords ===
NPC: Passwords should be strong...
-> hub
```
*Problem: Player sees "Ask about passwords" every time*

*Better: Track it with a variable*
```ink
VAR asked_passwords = false

=== ask_passwords ===
~ asked_passwords = true
{npc_name}: Passwords should be strong...
-> hub
```

❌ **Mixing Exit and END — in a hub conversation**
```ink
=== hub ===
+ [Leave] #exit_conversation
  -> END
```
*Problem: Confused state logic, and the NPC can never be talked to again. In a
looping conversation use `#exit_conversation` and return to the hub.*

✅ **…but a linear cutscene should end.** Opening briefings and closing debriefs are
not hubs: they play once and stop. There, `#exit_conversation` followed by `-> END` is
the correct pattern, and returning to `start` instead is a bug — `start`'s once-only
choices are already spent, so it runs out of content.
```ink
=== mission_departure ===
Agent HaX: Good luck. Go.

#exit_conversation

-> END
```
*Reference: `m01_opening_briefing.ink:224-225` and `m01_closing_debrief.ink:913-914`
(gold standard); `m02_opening_briefing.ink:227-229` and `m02_closing_debrief.ink:809-811`
follow the same pattern. Note `scripts/compile-ink.sh` warns on every `END` it sees; that
heuristic cannot tell a cutscene from a hub, and m01 itself trips it.*

❌ **Conditional Without Variable**
```ink
=== hub ===
+ {talked_before: [Remind me]}  // 'talked_before' undefined!
    -> reminder
```
*Better: Define the variable first*
```ink
VAR talked_before = false

=== ask_something ===
~ talked_before = true
-> hub
```

## Common ink bugs (pass 4)

These came up in more than one mission during the pass-4 dialogue reviews and playtests (October 2026). Most are caught by `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<mission>/` (rule name in brackets); the rest are for the reviewer. `README_scenario_design.md` ("Common bugs and how to avoid them") has the scenario-file side.

**0. A line that starts with a stage cue becomes a choice** (`emote-as-choice`, error). In ink a line beginning `*` is a choice, so `*leans in* Fine.` on its own line is not an emote. It hides behind a speaker prefix (`Ghost: *leans in* Fine.` is safe) and appears when the prefix is stripped, as happened in m02's phone ink. Put the cue mid-line (`Fine. *leans in*`) or cut it.

**1. A first meeting that falls into the return visit** (`choice-fallthrough`). Ink doesn't stop at choices: it keeps running to the end of the flow and gathers every choice it passes. So a block that offers choices and is followed by more content prints that content as well, and merges both sets of choices. In m06, Dani, Priya and Satoshi greeted a first-time visitor with "Hi again":
```ink
// ❌ first block flips the flag, so the second block runs too
{first_meeting:
    ~ first_meeting = false
    Dani: You're the regulator, yeah?
    + [Mostly?] -> hub
}
{not first_meeting:
    Dani: Hi again. What's up?
    -> hub
}
// ✅ one block, with - else:
{first_meeting:
    ~ first_meeting = false
    Dani: You're the regulator, yeah?
    + [Mostly?] -> hub
- else:
    Dani: Hi again. What's up?
    -> hub
}
```

**2. A resting knot that prints nothing** (`blank-reentry`, person-chat). After `#exit_conversation` the story is saved where it diverts to, and a re-talk re-enters that knot (person-chat re-navigates to the knot, not the stitch, that owns the saved choices). If the knot opens straight on its choices, the player gets the buttons with no fresh line; playtesters read it as a blank screen (m03 receptionist and Victoria, m04 Vance, m08 Netherton). The engine may fall back to re-showing the last line, but a re-entry line gives better context. Add one, and skip it once after a goodbye so the farewell batch doesn't end on a greeting. Vary it, or it repeats after every topic (m06 Irina's "I'm still here, and still yours" after each answer):
```ink
=== hub ===
{hub_quiet:
    ~ hub_quiet = false          // set to true on every exit choice
- else:
    Receptionist: {&What else can I help with?|Anything else?|Ask away.}
}
+ [...]
```
Phone inks are the exception: the thread shows the history, and a phone resting knot should hold choices only (the pass-3 re-navigation rule).

**3. An influence tag that lands on narration** (`tag-on-narrator`). A tag on its own line attaches to the next line of text. Before a divert, that's the first line of the next knot; if that line is `Narrator:`, the "+ Influence" popup shows over the narration (m06 Irina's evidence scene). Put the tag directly above a line the NPC speaks.

**4. The contact's own name in a phone ink** (`phone-self-prefix`). Phone lines take no `Name:` prefix for the contact (m01's phone ink has none); keep a prefix only when someone else speaks. `Narrator:` lines render as narration in both chats; use them sparingly on the phone.

**5. A spoken goodbye with no answer** (`exit-no-reply`). The engine shows the chosen text as the player's own bubble. If the choice then goes straight to `#exit_conversation` (or `END`), the chat closes on the player's words, waiting for a click (m08 "[I'll leave you to it.]", "[Understood, Director.]"; m03 "[She is. Goodnight.]"). Give the NPC a one-line reply. Put the tag on its own line after the reply, or above it, never ahead of a divert that leaves the reply behind:
```ink
+ [I'll leave you to it.]
    Off-Duty Agent: Shut the door on your way.
    #exit_conversation
    -> hub
```

**6. Asterisk cues** (`stage-cue-in-info`, `stage-cue-density`). `*a beat*` shows on screen as written and steers the voice. m01 uses about one per 37 spoken lines. Never put one on a line carrying a number or a code ("\*reading\* Two hundred and forty." in m07): the player has to read past it to get the information.

**7. "Not X. Y."** (`not-x-but-y`). The two-sentence form ("Not doubt. Irritation."), the pronoun form ("She is not startled. She has been waiting.") and "like X, and not Y" are the same AI tell as "it's not X, it's Y", in narration as much as in dialogue. A villain may keep one per scene.

**8. A timed text repeated as the first line** (validator). A bark or `sendTimedMessage` text appears before the chat opens. If the knot then opens on the same words, the player reads them twice (m07 Architect, "Agent 0x00. Don't look for the trace."). Make the bark a teaser.

**9. Variables nobody sets** (validator). A `VAR` read in a condition, never assigned with `~`, and with no scenario global of the same name to sync in, is fixed at its default (m06 `recruitment_accepted`). A `#set_global` name missing from `globalVariables` is usually a typo.

**10. A hub with too many choices** (`crowded-hub`, check). A knot whose choice block can offer more than ten choices at once (sticky, once-only and conditional all count) buries the topic that matters now; the m02 phone hub reached 20 buttons in a playtest. Order by relevance: topics that arrive later in the mission go first in the ink, so the newest, most relevant choices sit at the top (see m01's handler hub, `m01_phone_agent0x99.ink`, knot `support_hub`), and retire spent topics with a `not topic_given` guard. Fold related offers into one button with a choices-only follow-up knot (m02 `field_guides`). The rule skips a hub where nearly every conditional choice carries a `not` guard and the unconditional ones sit last, which is the m01 shape.
```ink
// m01 support_hub: late-mission topics first, each retired once used, fixed choices last
+ {entropy_reveal_read and (player_aborted_attack or player_launched_attack)} [Operation Shatter resolved — I'm ready for debrief]
+ {derek_office_locked_seen and not derek_office_entered} [Derek's office is locked — how do I get in?]
+ {server_room_entered and not ssh_flag_submitted and not ssh_hint_given} [SSH brute force help]
+ [Got any general advice?]
+ [I'm good for now]
```

**11. For the reviewer** (no lint):
- `#speaker:` tags don't choose the speaker. Person-chat acts only on `#speaker:player` and `#speaker:npc[:id]`; a two-part tag like `#speaker:analyst` is ignored and the `Name:` prefix decides (m06). Write the prefix.
- Status answers ("Where do I stand?", "Remind me where we are", "What's the clock?") must branch on the globals that change, down to the step the player is on. Four missions had a recap that went stale halfway through.
- A choice can only quote or answer what the player has heard on this route. Check every choice against each way into its knot (m03 "[…I signed myself in.]" after a KO route; m04 Relay answering a reply nobody gave).
- Don't say the same fact twice in a row, across a choice and its reply, or across two speakers (m04 gate guard, Vance's phone opener, the debrief's "Voltage is out through the dock").

## Debugging

### Check Saved State

```javascript
// In browser console
window.npcConversationStateManager.getNPCState('npc_id')
```

### Clear State (Testing)

```javascript
window.npcConversationStateManager.clearNPCState('npc_id')
```

### View All NPCs with Saved State

```javascript
window.npcConversationStateManager.getSavedNPCs()
```

## Testing Your Ink Story

1. **First Interaction**: Variables should start at defaults
2. **Make a Choice**: Favour/flags should increment
3. **Exit**: Should save all variables
4. **Return**: Should have same favour, new options may appear
5. **Hard END (if used)**: Should only save variables, restart fresh

## Real-World Example: Security Expert NPC

Here's a complete example showing all techniques combined:

```ink
VAR expert_name = "Security Expert"
VAR favour = 0

VAR learned_passwords = false
VAR learned_phishing = false
VAR learned_mfa = false

VAR task_given = false
VAR task_complete = false

=== start ===
~ favour += 1
{expert_name}: Welcome back! Good to see you again.
-> hub

=== hub ===
// Introduction - appears only once
once {
  * [I'd like to learn about cybersecurity]
      -> introduction
}

// Password topic - changes on repeat
sticky {
  + {learned_passwords: [Tell me more about password security]}
      -> passwords_advanced
  + {not learned_passwords: [How do I create strong passwords?]}
      -> learn_passwords
}

// Phishing topic - only shows after passwords are learned
{learned_passwords:
  sticky {
    + {learned_phishing: [Any new phishing threats?]}
        -> phishing_update
    + {not learned_phishing: [What about phishing attacks?]}
        -> learn_phishing
  }
}

// MFA topic - conditional unlock
{learned_passwords and learned_phishing:
  sticky {
    + {learned_mfa: [More about multi-factor authentication?]}
        -> mfa_advanced
    + {not learned_mfa: [I've heard about multi-factor authentication...]}
        -> learn_mfa
  }
}

// Tasks appear based on what they've learned
{learned_passwords and learned_phishing and not task_given:
  + [Do you have any tasks for me?]
      ~ task_given = true
      -> task_offer
}

{task_given and not task_complete:
  + [I completed that task]
      ~ task_complete = true
      ~ favour += 5
      -> task_complete_response
}

{favour >= 20:
  + [You seem to trust me now...]
      ~ favour += 2
      -> friendship_response
}

+ [Leave]
    #exit_conversation
    {expert_name}: Great work! Keep learning.
    -> hub

=== introduction ===
{expert_name}: Cybersecurity is all about protecting data and systems.
{expert_name}: I can teach you the fundamentals, starting with passwords.
-> hub

=== learn_passwords ===
~ learned_passwords = true
~ favour += 1
{expert_name}: Strong passwords are your first line of defense.
{expert_name}: Use at least 12 characters, mixed case, numbers, and symbols.
-> hub

=== passwords_advanced ===
{expert_name}: Consider using a password manager like Bitwarden or 1Password.
{expert_name}: This way you don't have to remember complex passwords.
-> hub

=== learn_phishing ===
~ learned_phishing = true
~ favour += 1
{expert_name}: Phishing emails trick people into revealing sensitive data.
{expert_name}: Always verify sender email addresses and never click suspicious links.
-> hub

=== phishing_update ===
{expert_name}: New phishing techniques are emerging every day.
{expert_name}: Stay vigilant and report suspicious emails to your IT team.
-> hub

=== learn_mfa ===
~ learned_mfa = true
~ favour += 1
{expert_name}: Multi-factor authentication adds an extra security layer.
{expert_name}: Even if someone has your password, they can't log in without the second factor.
-> hub

=== mfa_advanced ===
{expert_name}: The most secure setup uses a hardware security key like YubiKey.
{expert_name}: SMS codes work too, but authenticator apps are better.
-> hub

=== task_offer ===
{expert_name}: I need you to audit our password policies.
{expert_name}: Can you check if our employees are following best practices?
-> hub

=== task_complete_response ===
{expert_name}: Excellent work! Your audit found several issues we need to fix.
{expert_name}: You're becoming quite the security expert yourself!
-> hub

=== friendship_response ===
{expert_name}: You've learned so much, and I can see your dedication.
{expert_name}: I'd like to bring you into our security team permanently.
-> hub
```

**Key Features Demonstrated:**
- ✅ `once { }` for one-time intro
- ✅ `sticky { }` for "tell me more" options
- ✅ Conditionals for unlocking content
- ✅ Variable tracking (learned_X, favour)
- ✅ Task progression system
- ✅ Friendship levels based on favour
- ✅ Proper hub structure

---

## NPC Influence System

### Overview

Every NPC can track an **influence** variable representing your relationship with them. When influence changes, Break Escape displays visual feedback to the player.

**Use an influence variable wherever it plausibly fits.** Any NPC the player can build rapport with — allies, gatekeepers, witnesses, suspects — should track influence so the player gets visible feedback that their approach is landing. Reserve "no influence var" for NPCs where rapport is genuinely meaningless (pure ambient one-liners, in-bed patients, a text terminal, or a cutscene handler gated on knowledge flags rather than relationship).

**Name it `influence`, or `<name>_influence` for a per-NPC scalar** (`marcus_influence`, `kim_influence` are good — they read clearly and the tags still apply). **Do not invent parallel rapport scalars** like `trust_level`, `relationship_score`, or `friendliness` — collapse them into the one influence variable. A derived *boolean threshold* flag (e.g. `marcus_trusts_player = marcus_influence >= 20`) is fine; a second competing numeric rapport track is not.

**CRITICAL REQUIREMENT**: You MUST include `# influence_increased` after every `influence +=` statement and `# influence_decreased` after every `influence -=` statement. These tags are required for the game to display visual feedback to players. This applies regardless of the variable name used (e.g., `influence`, `marcus_influence`, `rapport`, `favour`). A `+= 0` no-op needs no tag (nothing changed).

### Implementation

#### 1. Declare the Influence Variable

```ink
VAR npc_name = "Agent Carter"
VAR influence = 0
VAR relationship = "stranger"
```

#### 2. Increase Influence (Positive Actions)

When the player does something helpful or builds rapport:

```ink
=== help_npc ===
Agent Carter: Thanks for your help! I really appreciate it.
~ influence += 1
#influence_increased
-> hub
```

**Result**: Displays green popup: **"+ Influence: Agent Carter"**

**CRITICAL**: You MUST include `#influence_increased` immediately after every `influence +=` statement. Without this tag, the game will not display the visual feedback to the player.

#### 3. Decrease Influence (Negative Actions)

When the player is rude or makes poor choices:

```ink
=== be_rude ===
Agent Carter: That was uncalled for. I expected better.
~ influence -= 1
#influence_decreased
-> hub
```

**Result**: Displays red popup: **"- Influence: Agent Carter"**

**CRITICAL**: You MUST include `#influence_decreased` immediately after every `influence -=` statement. Without this tag, the game will not display the visual feedback to the player.

#### 4. Use Influence for Conditional Content

```ink
VAR influence = 0

=== hub ===
{influence >= 5:
  + [Ask for classified intel]
      -> classified_intel
}

{influence >= 10:
  + [Request backup]
      -> backup_available
}

{influence < -5:
  Agent Carter: I'm done talking to you.
}
```

### Complete Influence Example

```ink
VAR influence = 0

=== start ===
Field Agent: Hello. What do you need?
-> hub

=== hub ===
+ [Offer to help]
    Field Agent: That would be great, thanks!
    ~ influence += 2
    #influence_increased
    -> hub

+ [Demand cooperation]
    Field Agent: I don't respond well to demands.
    ~ influence -= 2
    #influence_decreased
    -> hub

+ {influence >= 5} [Share sensitive information]
    Field Agent: Since I trust you... here's what I know.
    -> trusted_info

+ [Leave]
    #exit_conversation
    -> hub

=== trusted_info ===
Narrator: The Field Agent share with you since you have influence.
Field Agent: The breach came from inside the facility.
~ influence += 1
#influence_increased
-> hub
```

### Best Practices

- **ALWAYS include influence tags**: Every `influence +=` must be followed by `#influence_increased`, and every `influence -=` must be followed by `#influence_decreased`. This is REQUIRED for the game to display visual feedback to players.
- **Use meaningful increments**: ±1 for small actions, ±2-3 for significant choices
- **Track thresholds**: Unlock new options at key influence levels (5, 10, 15)
- **Show consequences**: Have NPCs react differently based on current influence
- **Balance carefully**: Make influence meaningful but not too easy to game
- **Update relationship labels**: Use influence to change how NPCs address the player

### Technical Tags

| Tag | Effect | Popup Color | Required? |
|-----|--------|-------------|-----------|
| `#influence_increased` | Shows positive relationship change | Green | **YES** - Must follow every `influence +=` |
| `#influence_decreased` | Shows negative relationship change | Red | **YES** - Must follow every `influence -=` |

**IMPORTANT**: These tags are NOT optional. They must be included wherever you modify influence variables, regardless of variable name (e.g., `influence`, `rapport`, `favour`, `trust`, etc.). Without these tags, players will not see visual feedback when their relationship with NPCs changes.

See `docs/NPC_INFLUENCE.md` for complete documentation.

---

## Common Syntax Errors to Avoid

### Do NOT Use Markdown-Style Bold (`**text**`)

**Ink does NOT support markdown-style bold formatting.** Using `**text**` will cause the asterisks to appear literally in the output, which looks unprofessional.

❌ **WRONG:**
```ink
Here's a **Lab Sheet Workstation** in this room.
```

✅ **RIGHT:**
```ink
Here's a Lab Sheet Workstation in this room.
```

If you need emphasis, use capitalization, quotes, or descriptive language instead of markdown formatting.

### Do NOT Start Lines with `*` (Except for Choices)

**Lines cannot start with `*` in Ink**, except when it's part of a valid choice syntax (`* [choice text]` or `+ [choice text]`).

❌ **WRONG:**
```ink
**Navigation in normal mode:**
- "h" "j" "k" "l" move cursor
```

✅ **RIGHT:**
```ink
Navigation in normal mode:
- "h" "j" "k" "l" move cursor
```

If you need section headers, use plain text without asterisks.

**This is the most common cause of the emote bug** (see *§Emotes vs. Narration*): a flavour cue written as `*laughs*` on its own line is parsed as a choice. Lead every emote line with a speaker or `Narrator:` prefix so the `*` never sits at the start of the line.

### Characters that change what ink compiles

Ink treats several characters as syntax. Inside dialogue they either vanish or restructure the story, and only some of it surfaces as a compiler warning. `ruby scripts/validate_scenario.rb` checks all of these.

| In dialogue | What ink does with it | Fix |
|---|---|---|
| `//` | Starts a comment. **Everything after it on the line is silently discarded.** Bites hardest on URLs and file paths. | Rephrase, or split the URL |
| `*` at line start | Parses as a choice. A standalone `*sighs*` becomes a phantom choice button that can dead-end the branch | Attach the emote to a spoken line, or use `Narrator:` |
| Unpaired `*` | Renders the asterisk to the player | Close the emote |
| `**bold**` | Not supported; renders literally | Capitals or plain wording |
| `->` | Reads as a divert | Use an en dash or "to" |
| `{` `}` | Conditional / alternative syntax | Escape or rephrase |
| `\|` inside `{}` | Alternative separator | Only use deliberately |
| `[` `]` unbalanced in a choice | Swallows the rest of the line | Balance them |

Safe: `£` and other UTF-8 (survives compilation intact), `--` for dashes, `#` on its own line as a tag, `>` at line start.

### Do NOT Ignore "Apparent Loose End" Warnings

**"Apparent loose end" warnings from the Ink compiler are likely syntax errors** and should be investigated, not ignored. These warnings typically indicate:

- Missing knot definitions (referenced but not defined)
- Incorrect choice syntax
- Unclosed conditionals or loops
- Invalid divert targets
- Markdown formatting such as ** at the start of a line.

Always fix these warnings before considering your Ink story complete. They can cause runtime errors or unexpected behavior in the game.

### Avoid Lists in Dialogue (Use Sentences Instead)

**Dialogue is displayed line-by-line to players**, so lists with bullet points create a poor reading experience. Players must click through each list item individually, which feels tedious.

❌ **WRONG:**
```ink
You've shown you can:
- Navigate Linux systems effectively
- Use SSH for remote access
- Perform security testing with tools like Hydra
- Escalate privileges when needed
```

✅ **RIGHT:**
```ink
You've shown you can navigate Linux systems effectively, use SSH for remote access, perform security testing with tools like Hydra, and escalate privileges when needed.
```

**Best Practice:** Convert lists to flowing sentences using commas and "and" for the final item. This creates natural, readable dialogue that players can skip through more easily.

### Keep Exit Conversations Brief

**Exit conversations should be 1-2 lines maximum** before the `#exit_conversation` tag. Players are trying to leave, so don't make them read through multiple paragraphs.

❌ **WRONG:**
```ink
=== end_conversation ===
Whenever you need a refresher on Linux fundamentals, I'm here.

You've demonstrated solid understanding and good security awareness. Keep that mindset.

Now get to that terminal and start practicing. Theory is useful, but hands-on experience is how you actually learn.

See you in the field, Agent.

#exit_conversation
```

✅ **RIGHT:**
```ink
=== end_conversation ===
See you in the field, Agent.

#exit_conversation
```

Or with conditional content:
```ink
=== end_conversation ===
{instructor_rapport >= 40:
    You've demonstrated solid understanding. See you in the field, Agent.
- else:
    See you in the field, Agent.
}

#exit_conversation
```

**Best Practice:** Keep farewell messages short and to the point. Players appreciate quick exits.

## Common Questions

**Q: Should I use `-> END` or hub loop?**  
A: Use hub loop for all NPCs, and include in that loop at least one exit option that is always available.

**Q: How do I show different dialogue on repeat conversations?**  
A: Use Ink conditionals with variables like `{conversation_count > 1:` or `{influence >= 5:`

**Q: Can I have both choices and auto-advance?**  
A: Yes! After showing choices, the hub is reached. Use `-> hub` to loop.

**Q: What if I need to end a conversation for story reasons?**  
A: Use a choice with dialogue that feels like an ending, then loop back to hub. Or use `#exit_conversation` to close the minigame while keeping state.

**Q: What's the difference between `once` and `sticky`?**  
A: `once` shows content only once then hides it. `sticky` shows different content based on conditions. Use `once` for introductions, use `sticky` to change menu text.

**Q: Can I have unlimited options in a hub?**  
A: Yes! But for good UX, keep it to 3-5 main options plus "Leave". Use conditionals to show/hide options based on player progress.
