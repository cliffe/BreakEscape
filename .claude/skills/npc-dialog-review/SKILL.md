---
name: npc-dialog-review
description: Dialogue-quality review of a Break Escape scenario's ink — compiles the ink, runs the validator for the dialogue-facing checks, then applies the writing judgement in README_ink_best_practices.md (attribution, hub structure, player-choice phrasing, and above all whether choices actually matter). Trigger when the user asks for a "dialogue review", "NPC review", "ink review", "conversation critique", or wants to check whether an NPC's choices feel flat / consequential before finalising. Complements scenario-design-review, which owns structure/solvability.
---

# Break Escape NPC dialogue review skill

Two-phase check, scoped to what the characters *say and offer*: (1) compile + validate the ink, (2) apply the writing principles from `README_ink_best_practices.md` that require reading and reasoning about the dialogue itself.

This skill is the dialogue counterpart to `scenario-design-review`. Where that skill judges solvability, layout, and objectives scaffolding, this one judges conversation craft — and, most importantly, **whether player choices carry consequences**. Where the two overlap (KO resilience, player-choice phrasing), defer to `scenario-design-review` for the deep mechanical verdict and focus here on the writing.

Work from the repository root (`/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape`). Take a scenario name or path as argument (e.g. `m02_ransomed_trust`); if given a directory, its ink lives in `scenarios/<name>/ink/*.ink`.

## Step 1 — compile and validate

```bash
./scripts/compile-ink.sh <scenario_name>
ruby scripts/validate_scenario.rb scenarios/<scenario_name>/scenario.json.erb
```

**From the compile output**, report:

- Any `Failed:` count > 0 — a file that doesn't compile is a blocker; name it.
- **"Apparent loose end" warnings** — per `README_ink_best_practices.md`, these are usually real syntax errors (missing knot, bad divert, stray `**`/`*` at line start), not noise. List each.
- `-> END` warnings are expected only on closing debriefs / briefings that legitimately end the conversation; note them but don't escalate.

**From the validator**, surface only the **dialogue-facing** findings (leave layout/objectives/graph to `scenario-design-review`):

- `#speaker:narrator` used with no top-level `narrator` voice block defined.
- Player-choice / `You:`-echo phrasing flags.
- `#give_item:...` that doesn't match the speaking NPC's `itemsHeld`, and `#give_item` tags placed *after* their dialogue line (they fire on the wrong `story.Continue()`).
- **Speaker prefixes that resolve to no NPC** — ❌ INVALID for a name used 5+ times in a file, 💡 SUGGESTION for a one-off (prose labels like `Command: nmap ...` look identical to the check and render harmlessly).
- **Ink character hazards** — `//` inside dialogue (silently truncates the line as a comment), a standalone `*emote*` at line start (parses as a phantom choice), `**bold**`, unpaired `*`, unbalanced `[ ]` in a choice.
- KO-wiring warnings where a required task's only completion path is a KO-vulnerable conversation with no `taskOnKO` fallback (cross-reference in §2f, don't restate detail).

Present blockers first, then warnings. Omit empty groups.

**Also run the dialogue lint and the tag diff** (both are editor's aids; exit code is always 0):

```bash
node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<scenario_name>/        # add --json for counts
node scripts/ink_runtime_check/tagdiff.mjs scenarios/<scenario_name>/             # after any rewrite: explain every difference
```

From the lint, report line-length errors, `you-after-choice`, the AI-tell warnings, and the pass-4 structural rules (detail and examples in `README_ink_best_practices.md`, "Common ink bugs (pass 4)"):

| Rule | Level | What it means |
|---|---|---|
| `choice-fallthrough` | check | choices in a `{cond: ...}` block, followed by more content: ink prints it too and merges both sets (m06 "Hi again" on a first meeting). Fix with `- else:` |
| `blank-reentry` | check | person-chat: a conversation parks in a knot that prints nothing before its choices, so a re-talk gets no fresh line. Add a re-entry line (m03 `hub_quiet` pattern) |
| `tag-on-narrator` | check | an influence tag before a divert lands on the next knot's `Narrator:` line. Move it above a spoken line |
| `phone-self-prefix` | warn | the contact's own `Name:` prefix in a phone ink. Drop it |
| `exit-no-reply` | warn | person-chat: a spoken choice goes straight to `#exit_conversation`/`END` and the chat closes on the player's own bubble. Give the NPC a one-line reply |
| `stage-cue-in-info`, `stage-cue-density` | check, warn | an asterisk cue on a line carrying a number; more cues than m01's ~1 per 37 lines |
| `not-x-but-y` | warn | now also "Not X. Y.", "She is not X. She Y." and "like X, and not Y" |

A `check` is a prompt to look, not a verdict: confirm each against the ink before reporting it.

## Step 2 — dialogue review against README_ink_best_practices.md

Read every `.ink` file in `scenarios/<name>/ink/`. Report each finding as **CONCERN**, **OK**, or **N/A**, and cite the file + knot. Do not restate Phase-1 items; cross-reference them.

### 2a. Attribution & narration

- **Every `Character Name:` prefix resolves to an NPC `id` or `displayName`, exactly.** This is the highest-value check in this skill. `normalizeSpeakerId()` matches only against id / displayName plus the specials `player`, `npc`, `you`, `Narrator`. A shortened name (`Marcus:` for `Marcus Webb`) or a role word (`Guard:`, `Nurse:`, `Dr. Kim:`) does **not** resolve — ink still compiles, and the engine renders the literal text `Marcus: ...` inside whichever character spoke last. Phase 1 flags this automatically; confirm each ❌ INVALID is a real speaker rather than a prose label, and check the fix used the NPC's exact `displayName` instead of shortening it further.
- **Emotes split by category, not wholesale.** Delivery cues the TTS can act on (`*quietly*`, `*sighs*`, `*pause*`, `*not looking up*`) stay inline; events in the scene (handing something over, crossing the room, looking up for the first time) become `Narrator:` beats. Flag a file that has promoted *every* gesture — each Narrator line is an extra click-through and conversations start to wade.

### 2a-bis. Is the dialogue supported by the scenario?

Ink can assert anything; the engine only renders what the scenario defines. Read each NPC's block in `scenario.json.erb` alongside its ink and flag contradictions — these are invisible until playtest:

- **Movement vs `behavior`.** An NPC with no `behavior.patrol` never moves. Stage directions like *"without stopping"*, *"takes you down the row"*, *"comes back with"* describe something the player will never see. Either the NPC needs a patrol, or the stillness should become the characterisation.
- **Props.** Anything the dialogue draws attention to should exist as an object in that room. If it must not be takeable (it would bypass a puzzle), it still wants to exist as `takeable: false`.
- **Handovers.** "Take it, it's yours" needs a `#give_item` tag *and* a matching `itemsHeld` entry. Phase 1 validates the tag; only reading the prose catches an offer that was never tagged at all.
- **Geography.** Directions in dialogue go stale whenever connections change. Cross-check every "east of", "down the corridor", "first door" against the current `connections`.
- **Sprites vs narration.** If a knot says a character has been taken away or their post is empty, an event mapping should `setVisible: false`.
- **Off-screen intentions.** A stationary NPC saying "I go in in five minutes" is still standing there hours later. Intentions must stay true for an unbounded night.

Off-map events and post-mission debriefs are legitimate exceptions.

### 2a-ter. Voices

- Every speaking NPC has a `voice` block (terminals/computer phone NPCs excepted).
- No `voice.name` is reused by two characters who appear together — reuse is correct only for the *same* character across multiple NPC entries.
- Each `style` names its accent explicitly and says "consistent ... throughout"; the cast is not uniformly RP.
- Dialogue uses inline `Character Name:` prefixes (primary method); `#speaker:` tags only as a fallback for tag-less lines. (The `Name:` prefix is what picks the speaker. `#speaker:` tags are not matched by prefix: `determineSpeaker` in person-chat-minigame.js honours only `#speaker:player`, `#speaker:npc`, and the three-part `#speaker:npc:<exact_id>` (which must exactly match a character id). Any other two-part tag, such as `#speaker:dr_kim` or m01's `#speaker:derek`, is ignored and the line falls back to the conversation's own NPC, which is why m01's works: Derek is the NPC in his own conversation. So a `#speaker:<name>` tag only matters when it names someone other than the conversation's NPC and has no `Name:` prefix; then it's a real bug, and the fix is a `Name:` prefix or the exact `#speaker:npc:<id>` form.)
- Standalone scene-setting / third-person action beats are spoken as `Narrator:` lines, and a top-level `narrator` voice block exists. Inline emotes inside a character's own line (`Nurse: *sighs* Right.`) are fine.

### 2b. Player choices are spoken dialogue

Per `§Player Choice Formatting`. Scan every `*`/`+` choice bracket:

- **CONCERN** if a bracket is a third-person menu label (`[Ask about security]`, `[Sympathize with Marcus]`, `[Express readiness]`) instead of the player's actual first-person words.
- **CONCERN** on the `You:`-echo tell — a short label bracket immediately followed by a `You: <the real line>` on the next line. Fix: fold the real line into the bracket, delete the echo. (m01 convention: no NPC ink file follows a choice with a `You:` line.) The one legitimate exception is a genuinely non-verbal choice (`[Stay silent]`) followed by `You: …` representing the silence.
- Same rule for `#speaker:computer` decision terminals: `[Confirmed. Send it all.]`, not `[Confirm — upload everything]`.

### 2c. Hub structure integrity

Per `§Recommended NPC Structure`:

- `=== start ===` and `=== hub ===` present; topic knots `-> hub`.
- At least one **sticky (`+`) exit** choice tagged `#exit_conversation` always reachable in the hub.
- Exit conversations are 1–2 lines (`§Keep Exit Conversations Brief`).
- No hard `-> END` except deliberate scenario endpoints (debrief/briefing).

### 2c-bis. Starved knots — every re-enterable knot must keep an option (**Must-fix**)

The most common runtime break in this codebase, and it **compiles cleanly**. A knot that can be entered more than once, but whose choices are *all* once-only (`*`) — or are `+` but *every one* is behind a `{condition}` — can present an **empty choice list** on a later visit. Ink then falls off the end of the knot and raises `RUNTIME ERROR: ran out of content`. See `README_ink_best_practices.md` §"The starved knot".

Check every `.ink` file:

1. **Find re-enterable knots.** For each knot, count inbound diverts (`grep -c '\-> knot_name\b'`). Treat as re-enterable if inbound > 1, **or** it is named as an NPC's `currentKnot` in `scenario.json.erb`, **or** any "anything else? / one more thing…" option loops back to it. Entry knots are re-entered constantly — the engine re-navigates to the current knot each time a conversation re-opens (`phone-chat-minigame.js:478-482`).
2. **Flag any such knot with no unconditional `+`.** Report as **Must-fix** with the knot name and its inbound count. All-`*` is the classic case; all-`+`-but-all-gated is the subtle one.
3. **Recommend the fix:** make repeatable options sticky, guard the *content* with `{not asked_x}` rather than retiring the *option* with `*`, and add one always-available fallback (`+ [That's everything for now.]` → `#exit_conversation` → back to the hub).

**Runtime is the authority here — do not try to settle this by reading.** Run both harnesses, using each NPC's declared `currentKnot` from `scenario.json.erb` as the entry knot:

```bash
node scripts/ink_runtime_check/inkcheck.js  <file.json> <entry_knot> [VAR=value ...]
node scripts/ink_runtime_check/loopcheck.js <file.json> <entry_knot> [VAR=value ...]
```

- `inkcheck` walks the choice tree depth-first — good for broad coverage, but it **does not reliably catch starvation**: it caps out before revisiting a hub enough times.
- `loopcheck` drives the conversation 200 steps under six choice strategies and fails **only on a runtime error, a fatal bad-knot, or a runaway**. A conversation reaching a clean end (`-> END`) is reported, never failed — that is correct for briefings, debriefs and one-shot conversations. Calibrated against **m01 (gold standard)**: all seven files pass; m02 passes too.

Using the declared `currentKnot` also catches the related bug where it names a knot the ink does not define — `ChoosePathString` throws, `person-chat-minigame.js:436-437` does not catch it, and the NPC is **silently mute** (this was true of two m04 NPCs, including the mission's climactic antagonist).

**Static triage (optional, noisy).** The grep below lists knots with >1 inbound divert and no unconditional `+`. Treat it as a reading list, **not** findings: it has a high false-positive rate, because many inbound diverts are mutually exclusive branches on a linear path that legitimately ends. Run against m01 and m02 it flags ~20 knots, every one of them fine. Only report a knot after `loopcheck` produces an actual error for it.

```bash
python3 - <<'PY'
import re, glob, os
for p in sorted(glob.glob('scenarios/<name>/ink/*.ink')):
    src = open(p).read()
    knots, cur, buf = [], None, []
    for l in src.split('\n'):
        if l.startswith('==='):
            if cur: knots.append((cur, buf))
            cur, buf = re.sub(r'=', '', l).strip(), []
        elif cur is not None: buf.append(l)
    if cur: knots.append((cur, buf))
    for name, buf in knots:
        star  = sum(1 for l in buf if re.match(r'\s*\*\s*[\[{]', l))
        stick = sum(1 for l in buf if re.match(r'\s*\+\s*(?!\{)\s*\[', l))  # unconditional +
        inbound = len(re.findall(r'->\s*' + re.escape(name) + r'\b', src))
        if star and stick == 0 and inbound > 1:
            print(f'{os.path.basename(p):38s} {name:34s} inbound={inbound} *={star} uncond+={stick}')
PY
```

The signal that separates a real starved knot from the false positives is whether the knot is genuinely re-entered **within one session** — i.e. it is an NPC entry knot, or a hub, or something an "anything else? / one more thing…" option loops back to. That is what `loopcheck` measures directly.

### 2d. Choices that matter — the core check (`§Making Choices Matter`)

This is the reason the skill exists. For **each NPC**, judge whether its choices are consequential or flat.

1. **Flat-choice detection.** Find sets of choices that all divert to the same knot with **no variable set and no distinct line** in between — the player gets identical content regardless of pick. Grep aid: look for multiple choices under one knot whose bodies are a bare `-> same_target`. Report each cluster as a CONCERN with the knot name. If deleting the choices would lose nothing, they're decoration. **Note the spectrum:** choices that expose *different information* per branch are **not** flat — that's a valid lightweight consequence and is entirely appropriate in briefings / info-gathering (the player chooses what to learn); mark those OK. Only *identical content regardless of pick* is the anti-pattern. Judge in-mission and debrief choices harder — they should tend toward *different state the story pays back later*, not just different info.
2. **Convergent-but-legitimate.** Before flagging convergence, ask whether the character is **immovable for a story reason** (an ideological antagonist who cannot be swayed — e.g. Ghost, a committed inside asset). Convergent choices are correct there because the player picks a *stance*, not an *outcome* — but the choice should still set a stance variable so the convergence reads as authored. Mark these **OK** (note the stance var) rather than CONCERN.
3. **End-to-end consequence wiring.** For choices that *do* set state via `#set_global:<name>:<value>`, verify all three legs (§2e) and confirm **something actually branches on it later** (another NPC, or the closing debrief). A `#set_global` that is set but never read is a broken promise — CONCERN.
4. **Critical-path safety.** Where a choice *withholds* something (an item, a code, a task completion), confirm the withheld thing has a **redundant source** so a "cold"/"wrong" pick can't soft-lock. Consequence choices may change flavour, tone, richness, and side rewards freely; anything the mission requires needs another path. A gate on the critical path with no alternate source is a **Must-fix**.
   Also run the conversation-structure checks in `docs/agents/SOFTLOCK_PATTERNS.md`: once-only first-call menus that strand a gating global (S1), lines that announce an unlock without setting it (S3), `#complete_task` in `start` (S4), and `+` options that lead to exhaustible `*` content (S5). Prove each with a multi-call script that fails on the old ink.
5. **Reward for engagement.** Does curiosity pay? Optional questions that yield real foreknowledge (a breadcrumb toward a later reveal, an early warning, a name) make exploration worthwhile without blocking players who skip them. Note where an NPC could offer this and doesn't, if it would strengthen the scene.
6. **Lossy opening choices.** Flag briefings/debriefs where a few big opening choices each divert into a *different slice* of content, so picking one **skips** the others. Recommend the question-hub pattern: stance choices set state → hub offers each topic as its own repeatable option → routes into the shared spine. Nobody misses content.
7. **Continuity callbacks.** Note where the dialogue could reward attention by remembering events beyond the scene (prior missions, named characters, canon) — and check any existing callback is phrased for whatever state actually persists between missions (don't assert an outcome the player may not have produced).

### 2e. Cross-file state integrity

For every `#set_global:<name>:…` found in the ink:

- Is `<name>` declared in `scenario.json.erb` → `globalVariables`? (Undeclared = silently dead.)
- Is `<name>` `VAR`-declared in **every** ink file that reads it (so the engine syncs it at open)?
- Is it read *somewhere* (a conditional, a callback)? Set-but-never-read is a CONCERN. Grep aids: `grep -rho '#set_global:[a-z_]*' ink/ | sort -u` vs the `globalVariables` block and each file's `VAR` declarations.

### 2f. Influence variable & feedback tags

Per `§NPC Influence System`:

- **Tags are mandatory:** every `influence +=` (or `<name>_influence`/`rapport`/`favour +=`) must be immediately followed by `# influence_increased`, and every `-=` by `# influence_decreased`. Missing tags = no visual feedback — list every offender (this is a Should-fix). A `+= 0` no-op needs no tag.
- **Coverage:** does every NPC the player can build rapport with (allies, gatekeepers, witnesses, suspects) actually *have* an influence variable? Flag conversational NPCs that gate or colour behaviour on ad-hoc booleans but expose no influence feedback at all. (Pure ambient one-liners, in-bed patients, terminals, and knowledge-gated cutscene handlers legitimately have none.)
- **No parallel scalars:** flag any second numeric rapport track (`trust_level`, `relationship_score`, `friendliness`) competing with influence — collapse into one influence var. A derived boolean threshold (`marcus_trusts_player`) is fine.

### 2g. Syntax & readability anti-patterns

Per `§Common Syntax Errors`:

- No markdown bold `**text**` (renders literally).
- No bullet-list dialogue — convert lists to flowing sentences (players click line-by-line).
- No lines starting with `*` except valid choices.
- Investigate every "apparent loose end" from Phase 1.

### 2h. KO-resilience (dialogue side, cross-ref)

Because KO is permanent and any NPC can be attacked, a conversation that is the **only** way to complete a required task or hand over a gating item is a latent soft-lock. Confirm such NPCs have `taskOnKO` (complete the stranded task) and `globalVarOnKO` (so the debrief can acknowledge the KO instead of contradicting it). `scenario-design-review §2h` owns the full mechanical verdict and the critical-vs-side classification — cross-reference it; here just confirm the *writing* accounts for the KO branch (no line assumes an NPC is alive/at-large whose body may be on the floor).

### 2i. Recurring ink bugs the lint can't see (pass 4)

These came up in several missions' pass-4 playtests and need a reader:

- **Stale status answers.** For every re-askable handler topic ("Where do I stand?", "Remind me where we are", "What's the clock?", "What should I focus on?"), walk the mission's stages and read the answer at each. It must branch on the globals that change, down to the step the player is on (m03, m04, m06, m07 all went stale halfway).
- **A first phone contact opened late.** The contact's opening check-in must branch on progress (m06: "How's the FCA cover holding?" at the data centre).
- **Choices that quote or answer what wasn't said.** Check each choice against every route into its knot: does it quote a line the NPC hasn't said yet, or state something that didn't happen on this route (m03 "[…I signed myself in.]" after a KO; m04 Relay answering a reply nobody gave)?
- **The same fact twice in a row**, across a choice and its reply, two speakers, or a bark and the line it opens (m04 gate guard, Vance's phone opener, the debrief's "Voltage is out through the dock"; m07 Architect bark). The validator flags the bark case.
- **A hub greeting that repeats after every topic** (m06 Irina's "I'm still here, and still yours"). Vary it with `{&a|b|c}` or skip it with a quiet flag.
- **`#speaker:` tags.** In person-chat only `#speaker:player` and three-part `#speaker:npc:<id>` choose a speaker (`person-chat-minigame.js` `determineSpeaker`); a two-part tag such as `#speaker:analyst` is ignored and the `Name:` prefix decides. So check the prefix, not the tag, on every line where the speaker matters.
- **Credit and debrief lines against every route** that reaches them (m03 PERFECT STEALTH after the guard's challenge).

## Step 3 — prioritised action list

Short, one line per item, grouped:

**Must fix (blocks play or breaks a promise)**

- Ink that fails to compile; unresolved "apparent loose end" warnings.
- A consequence choice that gates the **critical path** with no redundant source (soft-lock).
- A `#set_global` gating progress that is undeclared or never read.

**Should fix (degrades the story)**

- Flat choices (identical content regardless of pick) that aren't legitimate stance-convergence.
- Menu-label / `You:`-echo choice phrasing; missing influence tags; narration not on the Narrator voice.
- Lossy opening choices that skip content (recommend question-hub).

**Worth considering (polish)**

- Convergent choices that would read as authored if they set a stance variable.
- Places to reward curiosity or add a continuity callback.
- Exit-conversation trims, list-to-sentence conversions.

Before recommending that a line be cut, grep the later missions for the line or its idea (`grep -rn -i "<key phrase>" scenarios/*/ink/`). A line that looks loose may be a setup: m03's review nearly cut Nightshade's "One day it'll be our badge somebody clones", which m08 pays off.

Keep it concise; don't repeat detail already given in the review sections above.
