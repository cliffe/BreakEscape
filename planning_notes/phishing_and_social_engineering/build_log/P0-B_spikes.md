# P0-B: spikes F1 and F2

Packet P0-B, 2026-10-21, HEAD 5a4d0ae7 (working tree shared with other agents). Plan §3 F1 and F2,
§2.3 items 6 and 8; contract `00` S1 and S3; SPIKES §4. No engine file edited. Scratch folder:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P0-B/`
(below, `se-P0-B/`). Paths under `js/` are `public/break_escape/js/`.

## F1. Writing a global into an open conversation

**Answer: it works, in both chats, with no echo and no loop.** The open story reads the new value
on its next line. A write from inside the story's own `Continue()` (an `EXTERNAL`, which is how
`se_influence` will call the writer) shows on the same line, after the call. One hazard turned up,
covered under "Inside `Continue()`" below.

### How it was tested

- Game 2814 (m01, keyless :3001, made with `new-game.rb`). Headless Chromium, started and closed by
  the script with `launchServer` (PID recorded in the run file, checked dead afterwards).
- Script: `se-P0-B/f1/f1-live-write.cjs`. Probe stories: `se-P0-B/f1/probe.ink` (two lines, then a
  hub that prints `audit_correct_answers` and offers "Look again", "Add one in ink", "Bye") and
  `se-P0-B/f1/probe2.ink` (calls `EXTERNAL f1_bump(n)`, with an ink fallback). Compiled in the
  scratch folder.
- The probe was attached to a real NPC by console: `sarah_martinez` (person chat, through
  `npc.storyJSON`) and `agent_0x99` (phone chat, `storyPath` nulled so `storyJSON` is used).
  `audit_correct_answers` is a declared m01 number global. Everything was set by console, so it
  counts as exercised, not earned. This was an engine spike, not a playtest, so `verify-run.rb` does
  not apply.
- The writer under test is `00` S3 cut down to what F1 checks: set
  `gameState.globalVariables[name]`, call `broadcastGlobalVariableChange(name, value, null)`, write
  the calling story with its observer detached, then emit `global_variable_changed:<name>` once.
  `eventDispatcher.emit` and `broadcastGlobalVariableChange` were wrapped to count calls.
- Results: `se-P0-B/f1/run3.json` (copy `run3-kept.json`); run 2 is the same without the probe2
  section.

### What each step showed (run 3)

| Step | Chat | Result |
|------|------|--------|
| Broadcast only, no story write (control A) | person, phone | gameState 3, open story still 0. The chat engines are not in `npcManager.inkEngineCache` (checked: `engineInInkEngineCache: false` for both), so the broadcast skips them |
| Writer writes 5 while "Line one: 0" is on screen | person | story 5, gameState 5, 1 emit, 1 broadcast (source `null`), touched set empty; the next line read **"Line two: 5"**, then "Hub reads 5" |
| Ink then runs `~ audit_correct_answers += 1` | person | "Ink added one: 6"; the observer fired once (emit 6, broadcast with source `sarah_martinez`); no second emit |
| Story write with the observer attached and gameState stale (control B) | person | the observer **echoes**: emit, broadcast and touched-set entry for a value nobody set through ink |
| Story write with the observer attached, gameState written first (control C) | person | no emit, no broadcast: the observer's equality check returns early |
| Writer writes 20 at a choice point, then "Look again" | person | **"Again reads 20"** |
| Writer writes 7 at a choice point, then "Look again" | phone | thread gains **"Again reads 7"** and "Hub reads 7"; 1 emit, 1 broadcast |
| Ink adds one | phone | "Ink added one: 8"; the observer fired once (stack shows `npc-conversation-state.js:525` from inkjs's batch flush) |
| `f1_bump(4)` bound to the writer, called from ink | person, probe2 | **"Returned 4, var now 4"**, next line "Next line: 4"; the call ran with `batchObservingVariableChanges = true`; 1 emit from the writer, none from the observer |
| Ink sets the global to 100, then calls `f1_bump(1)`, in one `Continue()` | person, probe2 | **"After assign and bump: 5"**, not 101. Ink's 100 never reached gameState and was never emitted |

Totals, person chat (probe): 4 emits for 4 changes (5, 6, 9 control B, 20). Control C added none.
Phone: 2 emits for 2 changes.

### The engine objects P0-D's writer has to reach

1. **The open engine.** `window.MinigameFramework` (`js/minigames/index.js:53`), whose
   `currentMinigame` (`js/minigames/framework/minigame-manager.js:6`, set at `:112`) is the open
   chat. Both chats keep the engine as `currentMinigame.inkEngine`: person chat builds its own at
   `js/minigames/person-chat/person-chat-minigame.js:53`, phone chat at
   `js/minigames/phone-chat/phone-chat-minigame.js:49`. It is the same object as
   `currentMinigame.conversation.engine` (`js/minigames/phone-chat/phone-chat-conversation.js:39`;
   the conversations are built at `person-chat-minigame.js:459` and `phone-chat-minigame.js:336`).
   Checked in the browser: `engineIsConversationEngine: true` for both. The NPC is
   `currentMinigame.npcId` in person chat and `currentMinigame.currentNPCId` in phone chat.
   The planned binding (`00` S3: "the binding passes the open conversation's engine") gets the
   engine without any of this, because `se_influence` is bound on that engine. The minigame route
   is for callers that are not ink, such as a tag handler or the board.
2. **Read `engine.story` at write time; never cache the story.** The phone minigame uses one
   `InkEngine` for the opening preload of every contact (`phone-chat-minigame.js:301`) and for each
   conversation it opens (`:336`, then `loadStory` replaces `engine.story`). After the player
   switches contact, the same engine holds another NPC's story. Check the NPC id before writing.
3. **Whether the story declares the name.** `story.variablesState._defaultGlobalVariables.has(name)`,
   as `setDeclaredVariable` does (`js/systems/npc-conversation-state.js:210-221`). Use that function
   for the write itself: it calls `variablesState.$(name, value)` and refuses names the story does
   not declare.
4. **The observer.** `observeGlobalVariableChanges` (`npc-conversation-state.js:480-531`) puts an
   *own* property `variableChangedEvent` on the story's `VariablesState` (`:489`). It shadows
   inkjs's prototype method of the same name (`assets/vendor/ink.js`, character offset 57942,
   `variableChangedEvent(t,e){for(let n of this.variableChangedEventCallbacks)n(t,e)}`), which is
   inkjs's own dispatcher. inkjs fires it only when it is not null (`SetGlobal`, offset 62556). So:
   save `vs.variableChangedEvent`, set it to `null`, write, and restore it in a `finally`. That is
   what `broadcastGlobalVariableChange` does (`:552-558`) and what `resolveEntryKnot` does
   (`phone-chat-conversation.js:230-249`; also `:621-632`). A story with no own observer (the phone
   preload sets `observeGlobals = false`, `:738`; bark engines never attach one) inherits the
   method. Restoring by plain assignment then turns the inherited method into an own property.
   That does no harm, but `delete vs.variableChangedEvent` restores the original state exactly, and
   the F1 writer does that.
5. **Order.** Write gameState before the story. The observer returns early when gameState already
   holds the value (`npc-conversation-state.js:500`, control C), so even a write with the observer
   still attached would not echo once gameState is current. Keep the detach anyway. It does not
   depend on value equality (`unwrappedValue` against what gameState holds), and it keeps the
   write out of the touched set (`:515`), which `syncGlobalVariablesFromStory` reads after each
   person-chat choice (`person-chat-minigame.js:965`). In F1 the touched set never held the
   writer's name.
6. **The observer survives state reloads.** `story.state.LoadJson` keeps the same `VariablesState`
   object, so an observer attached before a restore still fires (F2 saw observer emits in 436
   branch segments walked after `LoadJson`). Anything that replaces the state object would drop it.
   Nothing in `js/` calls `ResetState` today.

### Inside `Continue()`: read the base value from the calling story

While `Continue()` runs, inkjs batches observer calls (`set batchObservingVariableChanges`, ink.js
offset 58102). An ink assignment queues its observer call until the end of the `Continue()`, so
gameState does not have the value yet. A write made with the observer detached is not queued at all
(the `SetGlobal` condition at offset 62556), so the writer's own write never echoes, even in batch
mode. The hazard is the write before it. If ink assigns a global and then calls
`se_influence(delta)` in the same `Continue()`, a writer that adds `delta` to the gameState value
loses ink's assignment without trace (probe2: 100, then +1, gave 5). When the writer is given a
calling engine whose story declares the name, it must take the current value from that story
(`variablesState.$(name)`), not from gameState. This changes `00` S3 / plan 0.2–0.3: see "What
changes the plan".

**Not tested:** choice text and conditions that are already on screen. A write at a choice point
cannot change them, because ink evaluated them before the write. The new value shows from the
next `Continue()`. Person chat re-evaluates choices only when a conversation opens
(`person-chat-minigame.js:541-556`). A pretext call that shows a choice only once influence passes a
threshold should therefore change the value before the choice point, not while the choices are up.

## F2. `scripts/ink_runtime_check/social-load-all.mjs`

**Answer: turning `allowExternalFunctionFallbacks` on changes nothing in m01 to m08.** That covers
79 stories, 214 runs and 3,644 chat segments walked. No outcome differs. Two runs differ only in
the wording of an error that is thrown either way. First output:
`build_log/P0-B_social-load-all_first-output.txt` (exit 0).

### What the tool does

It renders each m01–m08 `scenario.json.erb` with the validator's `render_erb_to_json`. It collects
every NPC with a `storyPath` (plus any `changeStoryPath` in its mappings) and every compiled story
in the mission's `ink/` folder. Then it drives each story through copies of the real engine files
(`ink-engine.js`, `phone-chat-conversation.js`, `phone-chat-speaker.js`, `npc-conversation-state.js`,
copied to a temp folder as `reopencheck.mjs` does). Each run is done twice, flag off and flag on:

- **chat**: `PhoneChatConversation.loadStory` (both chats load through it; it binds the six
  read-only externals and attaches the observer), then the entry each minigame uses (person:
  `goToKnot(currentKnot || 'start')`; phone first open: `goToEntryKnot`), then a depth-first walk
  of the choices through `continue`/`makeChoice`, restoring the state and globals for each branch
  (depth 3, at most 120 segments per run).
- **event**: the same, at each `eventMappings` knot that opens a conversation.
- **preload**: the real `PhoneChatConversation._preloadOpeningOnce` for each phone NPC.
- **bark**: what `npc-manager.js` `_showBarkFromKnot` does (`:1203-1220`): a bare `InkEngine`,
  `loadStory`, `goToKnot`, `continue`, nothing bound. It runs at each mapping knot that reaches the
  ink bark path, and as a probe at each NPC's `currentKnot`, so every story is loaded once with no
  bindings.

The tool turns the flag on by wrapping the copied `InkEngine.prototype.loadStory`, right after the
`Story` is built. That is item 0.1's hook point (`js/systems/ink/ink-engine.js:15`, `:18`). Ink's
random seed is fixed in both runs. Each run records lines, tags, choices, observer emits, preload
messages and deferred globals and tags, the bark text, and any exception or `console.warn`/`error`.
The tool exits 1 when any run differs. Two full runs gave byte-identical JSON. Run it with
`node scripts/ink_runtime_check/social-load-all.mjs [--json=out.json] [--depth=N] [--nodes=N] [m0N ...]`.
The full run takes about 4 seconds.

### Flag off against flag on

| | |
|---|---|
| Runs | 214 (79 chat, 42 event, 14 preload, 79 bark probes, 0 mapped ink barks) |
| Outcome differs | **0** |
| Wording only | 2: bark probe on `m02_phone_agent0x99.json` and on `m03_phone_agent0x99.json`. Both throw `Missing function binding for external: 'player_name'` both ways. inkjs ends the message "(ink fallbacks disabled)" with the flag off and ", and no fallback ink function found." with it on |
| Errors today, same both ways | the same 2 (the bark path binds nothing, and these two stories call `player_name()`) |

The first full run, before the tool folded the error wording, reported these two runs as
differences and exited 1. The tool now lists them in a section of their own.

### Findings that matter beyond the yes/no

- **Only two shipped stories call an `EXTERNAL` at runtime:** `m02_phone_agent0x99.json` and
  `m03_phone_agent0x99.json`, both `player_name`, with no ink fallback. 24 `.ink` files in m02 to
  m04 have an `EXTERNAL` line, but 22 never call the function, and inklecate leaves an uncalled
  external out of the compiled JSON. Recompiling `m02_phone_agent0x99.ink` and `m04_npc_voltage.ink`
  in scratch gave byte-identical files with 2 and 0 calls. So plan §2.3 item 8's count (m02 11, m03
  6, m04 7) counts declarations, not anything the runtime sees.
- **No m01–m08 `eventMappings` entry reaches the ink bark path.** The only mapping with a knot
  outside a conversation mode (m02 `security_guard_patrol`, `cover_challenge`) also has bark text,
  so it shows a text bark. The `npc-manager.js:1206` loader is reached by none of these missions,
  so the bark probes are the only cover it has. If someone maps an ink bark to either HaX phone
  story, it fails today (caught, `console.error`, no bark), and it will still fail after 0.1
  unless the story gains a `player_name` fallback.
- **`npc-manager.js` `getInkEngine` (`:2039-2101`, `new InkEngine` at `:2079`) is dead code.**
  Its only caller is `person-chat-conversation.js:54`, which is not loaded (`00` S5). The tool
  does not drive it.
- m01 to m08 use no story from `scenarios/ink/`, and every compiled story in their `ink/` folders is
  referenced by an NPC.
- Limits: the chat walk is a sample (5 runs reached the 120-segment cap). Globals start at the
  scenario defaults, and saved-state restores are not driven. Tags are recorded but not passed to
  `processGameActionTags`. The flag cannot change a tag, so none of this weakens the diff.

## What changes the plan

1. **`00` S3 / plan 0.2 and 0.3 (P0-D, P0-E):** when the writer is given a calling engine whose
   story declares the name, `se_influence` and any other read-modify-write must take the current
   value from that story, not from gameState. Inside `Continue()`, an ink assignment made earlier
   in the same `Continue()` has not reached gameState yet. P0-D needs a test for this: in one
   `Continue()`, ink sets the global and then calls the external, and the result must be the ink
   value plus delta, with one emit.
2. **Plan §2.3 item 8 fixtures:** use `m02_phone_agent0x99` and `m03_phone_agent0x99` as the
   `EXTERNAL` fixtures. These are the only stories whose compiled JSON calls one. An m04 story
   tests nothing here (none of its compiled stories calls an external), and the m02/m03 counts
   should read "2 stories call one at runtime".
3. **0.1 can land as written.** The flag changes no shipped outcome. Re-run `social-load-all.mjs`
   before each engine commit that touches a loader, as §2.3 item 6 says. Expect exit 0 and the two
   wording-only lines.
4. Precise wording for the writer (P0-D): reach the engine as in the list above; read
   `engine.story` at write time and check the NPC; detach the observer in a `try/finally`,
   restoring with `delete` when it was not an own property; write gameState first.
