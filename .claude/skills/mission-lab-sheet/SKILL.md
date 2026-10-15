---
name: mission-lab-sheet
description: Writes or rewrites the student-facing lab sheet for a Break Escape mission — a getting-started guide, the concepts behind each lock with worked examples students can check by hand, and a stage-by-stage walkthrough of layered hints (a visible nudge, then a collapsed Nudge, then a collapsed Recipe) — and publishes it to HacktivityLabSheets and the mission's mission.json. Two modes: "full" (lab-sheet learning: concepts, worked examples, questions and exercises) and "practical" (a focused walkthrough: what to do, where, and how, with only the concepts needed). Hacktivity shows the same page as "Lab Sheet" in courses and "Walkthrough" in game events. Trigger when the user asks to "write a lab sheet", "make a walkthrough", "student guide for <mission>", "hints for students", "update the labsheet", or to publish a mission's sheet to Hacktivity.
---

# Break Escape mission lab sheet

Produce one Markdown page a student can follow from launch to debrief. It must get them started, teach the ideas each lock depends on, and get them unstuck without simply handing over answers. The model is `scenarios/lab_tesseract_trials/labsheet.md`; read it before writing anything.

## Pick the mode

| Mode | Use when | Shape |
|---|---|---|
| **full** (default) | The mission is taught in a course, or teaches concepts students won't have met | Purpose, How to Use, Getting Started (with a warm-up), Concepts (with worked examples), Stuck? Hints stage by stage, error table, optional side content, optional command-line section, After the Game questions and exercises, Further Reading |
| **practical** | Students already know the theory, or the user asks for "just the walkthrough" | Purpose (short), Getting Started, a route overview, Stuck? Hints stage by stage, error table, and a short "What you did" debrief. Concepts appear only as a two- or three-line box inside the stage that needs them. No exercises |

Both modes share the same hint section. That section is the "walkthrough": in a game event Hacktivity labels the page **Walkthrough**, in a course **Lab Sheet**. Keep the page readable either way: the walkthrough must stand on its own, and the concepts must not depend on having read the hints.

## Step 1: Gather the facts, from the scenario first

The scenario file is the truth. Design docs, solution guides and old playtests go stale. Read, in this order:

1. `scenarios/<mission>/scenario.json.erb`: rooms and connections, every lock (`lockType`, `requires`), every clue object (`name`, `observations`, `text`), what each container holds, `objectives`/tasks, and ERB variables (which values are generated per game).
2. `mission.json`: title, difficulty, `secgen_scenario` (VMs), collection, CyBOK.
3. The handler's hint ladder in the ink (grep for `stuck`, `hint_rung`, `[I'm stuck.]`). Your hints should agree with it in substance and go a little further.
4. `SOLUTION_GUIDE.md`, `TESTING_WALKTHROUGH.md`, `dungeon_graph.md`: the critical path, common mistakes, exact error messages, time estimates. Check every claim against the scenario file before using it.
5. `information_pack.md` (SIS missions) and any existing `labsheet.md`: keep the existing learning outcomes, CyBOK mapping, reflection questions and authors unless they are wrong.
6. VM missions: the SecGen scenario (`secgen_scenario` in mission.json; the XML in the SecGen repo) and any field guides the handler hands out (`labUrl` in the scenario, pages under `HacktivityLabSheets/_labs/safetynet/`). Link to field guides rather than duplicating them.

Write down, for each stage on the critical path: where the clue is (room, object, exact in-game name), what the lock is and where, what shape of answer it wants (word, 4 digits, a flag), the operation or technique, and the traps. Note which values are generated per game.

Before you finish, list every in-game name the sheet uses and grep each one in `scenario.json.erb`. Wrong object or file names are the most common error in these sheets.

## Step 2: Rules for content

- **Never print a real answer.** If values are generated per game, say so and use made-up examples. If a value is fixed (a static PIN, a VM flag), the Recipe tier can say how to get it but must not print it. VM flags are never printed.
- **Made-up examples, checked.** Every worked example (binary to ASCII, Base64 by bits, a cipher shift, a hash length) must be run through Python or the shell before it goes in.
- **Don't steer moral choices.** Where the mission has endings or decisions, hints help the student understand what they hold. They never say which choice is right. Say that no ending is a failure, if that is true. Put anything that reveals a hidden route in a `<details>` labelled "Spoiler".
- **Teach as you unstick.** Where a lock rests on a skill (converting a byte, reading a log, spotting a segmented network), add a "Learn it" line in the Nudge tier that makes the student do one small step by hand before the tool does the rest.
- **Send students back into the game for depth.** Where the mission hands out field notes or field guides (Agent HaX's `[Send me that field note]`, a lecturer's handouts, a field guide gated behind a challenge), the stage that uses that idea says how to get it in game, for example "To learn more, ask Agent HaX for the field guide on SSH" or "Dr Selvarajan's handout covers hashes". Check the exact option text and the gating in the ink (what the student must have seen before the handler offers it). Mention the published URL of a field guide only as a second route, after the in-game one.
- **A warning is a bug report.** If you find yourself warning students not to do something ordinary ("don't call X before you have evidence"), the game probably has a softlock (`docs/agents/SOFTLOCK_PATTERNS.md`, S8). Report it in your hand-off rather than only documenting the workaround.
- **Name traps precisely.** Quote the exact error text or symptom ("four capital letters", "Data is not a valid byteArray") and say what it means.
- **Reuse the existing sheet's reflection questions** where they are good; add questions only where the hint walkthrough exposes something worth reflecting on.

## Step 3: Structure

### Front matter

Keep the HacktivityLabSheets front matter: `title`, `author` (keep existing authors), `license: "CC BY-SA 4.0"`, `description`, `overview` (mention that the sheet has a getting-started guide, concepts and stage-by-stage hints), `tags`, `categories` (one HacktivityLabSheets category; it sets the URL), `type` (include `"game-based-learning"` and `"lab-sheet"`), `difficulty`, `source` (GitHub URL of the BreakEscape copy), `cybok`.

### Full mode sections

1. **Purpose**: "By the end of this lab you should be able to" bullets.
2. **How to Use This Sheet**: play order; hints are layered, open one at a time and go back to the game after each; answers differ per game (if they do).
3. **Getting Started**: the player's role in one paragraph; numbered `\==action:` launch steps; time estimate and a stopping point for a 60-minute class; **How to Play** (controls, where handed items go, the handler's hint options, tool tips as `> Tip:` and `> Warning:` blocks); a **warm-up** using made-up data that exercises the main tool once.
4. **Concepts**: one subsection per idea, in play order. Use tables for recognition ("what you see → what it probably is → what to try"), worked examples in code blocks, and one `> Question:` self-check per subsection where the answer is not on the page.
5. **Stuck? Hints, Stage by Stage**: see the hint pattern below. Start with a `> Tip:` giving the three questions to ask before opening any hint (What is the clue made of? What shape does the lock want? What did the clue's own description say?).
6. **What the Tools and Locks Are Telling You**: a two-column table of error messages and symptoms → usual cause.
7. **Optional Side Content**: each optional puzzle in its own `<details>`.
8. **Try It on the Command Line (Optional)** where the mission's techniques have shell equivalents. Keep the student's own data, not game data.
9. **After the Game: Questions and Exercises**: grouped by theme; `> Question:` blocks then a `> Action:` hand-in exercise per group.
10. **Further Reading**.

### Practical mode sections

Purpose (3 bullets), Getting Started (launch steps, How to Play tips), **The Route at a Glance** (a numbered list of stages: room → lock → what it needs), Stuck? Hints (same pattern), error table, **What You Did** (five or six lines naming the technique behind each stage).

### The hint pattern (both modes)

One `###` subsection per stage, in play order, with an anchor (`{#hints-stage-name}`):

```markdown
### Trial III: The Keyholder Guest Terminal {#hints-trial-3}

**Clue:** the Trial III Card, from Locker 4. **Lock:** the guest terminal in the teaching lab (west of the foyer). **Lock wants:** a word.

> Hint: One question or observation that points at the kind of thing, not the method.

<details markdown="1">
<summary>Nudge</summary>

The method, the traps, where help is in the game.

**Learn it:** ==action: Do one step by hand== and check it against the tool.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Paste the card text into **Input**==.
2. \==action: Add **From Binary**== (Delimiter Space, Byte Length 8).
3. \==action: Type the word into the guest terminal==.

</details>
```

- Tier 1 (visible `> Hint:`) names the kind of thing. Tier 2 (Nudge) gives the method and the traps. Tier 3 (Recipe) gives exact steps and settings, never the value.
- Call tier 3 **Recipe** when the stage is solved in a tool such as CyberChef, and **Steps** when it is a sequence of in-game actions (talk to, read, decide, submit). One mission may use both.
- Stages with two separate sticking points get two Nudges with descriptive summaries ("Nudge: finding the key", "Nudge: the output is all nonsense").
- Add a `> Warning:` after the details for the single most common way students fail at that stage.
- Include a "Before the First Lock" stage (where the first clue is, how to get the main tool) and a finale stage.
- Mark a natural stopping point for a 60-minute class with a `> Tip:`.

## Step 4: House style

Apply `HacktivityLabSheets/_labs/example_highlighting_guide.md`, with these project decisions:

- `> Question:` only for questions the page does not answer. A question answered later becomes a `> Note:` that points to the section.
- The first word after a block label is capitalised. If a block would start with inline code, rephrase ("The `echo` command…", "Run `iconv -l`…").
- Every step the student performs gets `==action: ...==`. At the start of a line or after a list number, write `\==action:` (the formatter escapes it; other labs use the same form). Bold inside an action is fine.
- Collapsible content uses `<details markdown="1">` with a `<summary>` and blank lines inside.
- Do **not** escape `|` inside fenced code blocks: the backslash shows and breaks copy-paste.
- UK English. "Cyber Security" with a space. Follow the user's writing-style rules in `~/.claude/CLAUDE.md` (no banned vocabulary, no "It's not X, it's Y", no summary sentences, few em dashes). Short, plain sentences; second person; present tense.

## Step 5: Publish

1. The source is `scenarios/<mission>/labsheet.md` in BreakEscape.
2. Copy it, byte-identical, to `HacktivityLabSheets/_labs/<category>/<file>.md` and confirm with `cmp`. Check whether a published copy already exists (`grep -rl` the title) and overwrite that one rather than making a second.
3. The published URL is `https://cliffe.github.io/HacktivityLabSheets/labs/<category>/<slug>/`, where `<slug>` is the file name without `.md`, with `_` turned into `-`, lower case. (Pages with an explicit `permalink:` use that instead.)
4. Set `"lab_sheet_url"` in `scenarios/<mission>/mission.json`, inserted after `"collection"` with a one-line edit (do not rewrite the file through a JSON serialiser: it reflows the arrays). Validate with `python3 -m json.tool`.
5. Hacktivity copies the mission's `lab_sheet_url` onto a new game slot whose own field is blank. Existing slots need the URL set by hand; say so in the hand-off.

## Step 6: Verify

- Every in-game name in the sheet greps to `scenario.json.erb`.
- Every worked example re-runs correctly.
- `<details>` and `</details>` counts match.
- `grep -nE '^> [A-Za-z ]+: [a-z\`]'` returns nothing (capital after labels).
- `grep -niwE 'delve|intricate|tapestry|pivotal|underscore|landscape|foster|enhance|crucial|robust|profound'` returns nothing outside technical uses.
- No real answer, PIN, key or flag appears anywhere.
- The published copy `cmp`s identical; `mission.json` validates.

Report: the mode chosen, the sections, any facts you found that contradict the solution guide or design docs (list them; do not fix other files unless asked), and the published URL.
