---
name: playtest-scenario
description: Plays a Break Escape scenario end to end in a real browser via the window.__test bridge, driving movement, interactions, dialogue and minigames with synthetic input, and reports pass/fail per walkthrough step. Trigger when the user asks to "playtest", "play through", "test the scenario in the browser", "drive the game", "run the walkthrough", "check the critical path actually works", or wants to watch an automated player attempt a mission.
---

# Break Escape playtest-scenario skill

Actually play the game and report what happened. This complements `validate-scenario` (schema) and `walkthrough-scenario` (paper trace): this skill runs the real build in a real browser and finds the things only playing can find — an item out of reach, a door whose lock never resolves, a conversation that dead-ends, a task that never fires.

**Read `docs/test-bridge.md` before your first run of a session.** It is the API reference for `window.__test`; this file only covers how to run a playtest with it.

## What a playtest is for

Three different questions, and a run should say which it is answering. They are not mutually exclusive — one run can do all three — but the report must separate them, because a pass on one says nothing about the others.

1. **Does the plumbing work?** Every interaction, minigame, dialogue branch and task fires as designed on the intended route. This is the default run.
2. **What happens when the player does something unexpected?** Talk to the NPC twice, leave a conversation half-finished and come back, open the safe before reading the clue, submit the wrong flag, walk out of the room mid-minigame, do the objectives out of order. Players have autonomy and will do all of this. Wandering off the walkthrough is not a harness error — it is the test. Report what broke.
3. **Can the mission be finished without doing the work?** m01–m08 are designed so the VM challenges must be completed. A route to the ending that skips them is a serious design defect, and worth actively hunting for.

### Earn the answer before you use it

You start the run already knowing the solutions — the PINs, the codes, the flag values, which NPC hands over which key. A real player does not. Almost nothing in a scenario is gated mechanically: a PIN is four digits and the game cannot tell whether you read the note or guessed; a flag is a string the station simply accepts. What stops a player skipping ahead is **not knowing the value yet**. So a run that types the answers straight in exercises the locks and proves nothing about whether the scenario teaches the player what they need.

**The rule: for each secret, go and get it in-game first, then use it.** Don't pretend you don't know it — knowing it is what lets you navigate efficiently and recognise the source when you find it. Aim to earn it.

In m01 you know the IT room PIN is 2468. Rather than walking up and typing it, go to the reception desk phone, listen to Kevin's message, and *then* open the door with the PIN it gave you. The information you were handed becomes the thing you verify: the message exists, it is reachable before the door, it actually states the code, and the code it states is the one the door takes.

This is where most real scenario defects live — a clue in a container that can only be opened with the code the clue contains, a note that names the wrong value after an edit, an NPC who only gives up the key on a branch the player has no reason to pick, a password list behind a lock it was supposed to open. None of these show up in a run that already knows the answer, and none of them show up in the schema validator either.

### The earned-secrets table

Every report carries this table, above the step results. One row per secret the run used — every key, PIN, code, passphrase and flag.

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Main Office Key | (item) | Sarah O'Brien, reception — dialogue reward | step 2 | yes |
| IT room PIN | `2468` | Maintenance Checklist, main office desk | step 4 | yes |
| Derek's safe PIN | `1337` | — never found a source in this run | — | **no** |
| `shatter_server:flag_2` | `<flag:2>` | My Passwords list (storage safe) → SSH to 172.16.0.2 → VM challenge | password list at step 12; **VM work not possible in standalone** | **no — prerequisite held, flag not earned** |

Columns:

- **Value used** — the literal PIN or code, or `<flag:N>` for a session-supplied flag. Write the token, not the flag value.
- **In-game source** — the specific object, NPC or container that reveals it. Not "the solution guide". If you never found one, say so; that is a finding.
- **Obtained at** — the step number in *this run* where you got it. Must be earlier than the step that used it.
- **Earned?** — `yes` only if this run reached the source before using the value.

**Flags get the full chain, not just the flag.** A flag's in-game prerequisite is whatever makes the VM work possible — for m01's SSH flags that is the "My Passwords" list in Derek's storage safe. Record whether the run obtained *that*, separately from whether the flag itself was earned. A run that found the password list has tested everything the game can be tested on in standalone; a run that submitted the same flag without it has not, and the two must not look alike in the table.

**Rows marked `no` are the boundary of what the run proves.** State it in words underneath: those steps were exercised, not tested, and everything downstream of them is unproven. A run with no `no` rows is a genuine solvability pass.

**When it is fine not to earn it.** Deliberately using a secret early is a legitimate test — question 2 above, and the only way to answer question 3. Do it on purpose, say so, and mark the row. What must not happen is drifting into it by convenience and then reporting a pass.

**Flags are the case where earning may be impossible.** Standalone has no VMs, so a `<flag:N>` value cannot be earned by any route; mark those rows "no" and say the mission's solvability is unproven past that point. Where VMs do exist and the run is about solvability, use the `pause` policy and let a human do the VM work — that is the only way that row becomes a "yes".

## Evidence: a report is not a run

The harness writes a session log — one JSON line per command and per result — to `tools/playtest/session-<timestamp>.jsonl`, or wherever `--log` points. You do not write it and cannot edit it.

**Two things are mandatory in every report, and a report without them is void:**

1. The **session log path**, and step numbers that cite line ranges in it.
2. The output of the post-run verifier, pasted in full:

   ```bash
   BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id>
   ```

   Send `{"cmd":"sync"}` before `quit` — globals and notes are otherwise flushed on a 30-second timer, and the verifier reads persisted state, so without it a real run can look less far along than it was.

   It prints the server's own record — rooms unlocked, inventory, globals, flags submitted — and exits non-zero unless the game shows something that could only have come from playing: a room beyond the first, an object opened, or a flag submitted. Globals and encountered NPCs do not count; mission setup and the opening cutscene set those. Run it at the end of every playtest. If it says NO PROGRESS RECORDED, you did not play the game, whatever your notes say.

This exists because a run has previously been reported in full — steps, dialogue, an earned-secrets table, a verdict of "provably solvable" — against a game whose inventory never changed from the two starting items. Nothing in the prose gave it away. The log and the verifier are the parts that cannot be written from the solution guide.

Never reconstruct a trace from what you expected to happen. If a command was not run, it does not appear.

## Small things that have each cost a run

- **The end-of-mission credits overlay never closes, and that is correct.** A
  scenario whose conclusionScreen is `bond_visualiser` opens a fullscreen
  `bv-stage` overlay with `autoStop: true` (music stops, visualiser stays open)
  and `disableClose: true` (no × button, Esc blocked). Nothing closes it, by
  design — it is the terminal state. Two runs have been lost waiting for it to
  clear, one of them concluding the game had hung on blocked audio. It has not
  hung. **Mission conclusion is decided server-side**, in `check_mission_conclusion`,
  and depends only on every `requiresCompleted` task being persisted. Check the
  game record; never wait on the screen.

- `mg type(i, text, {submit:true})` sends Enter **and** clicks a submit button if
  Enter changed nothing. Flag stations ignore Enter entirely; before this, a
  submitted flag silently never arrived. Check `submittedVia` in the result.
- `mg clickControl` takes an index **or** a label substring —
  `clickControl("submit")`. Prefer the label: indices shift as a minigame
  re-renders. A failure lists the controls that were available.
- A container shows "Loading contents..." for a beat after opening. `mg getState`
  now waits that out; a state read during it reports an empty safe.
- An unlocked door can still be shut, and `enter` opens it before walking
  through. An unlocked door that has *vanished* is normal — see above.
- `converse` stops once the conversation stops saying anything new, so hub NPCs
  no longer burn the whole turn budget. Pass `choices` when you need a branch.

## Token discipline

Playtests are long. These constraints matter more here than in most skills:

- **One state read per decision.** Use `{"cmd":"brief"}`, not `{"cmd":"state"}`. `brief` is the decision-sized projection: room, player, active minigame, blocking UI, dialogue with numbered choices, nearby interactables, inventory, open tasks, recently-set globals. Full `state` is for diagnosing a failure.
- **Deterministic waits, never polling loops.** `{"cmd":"waitFor",...}` resolves off the game's own frames and events. Never write a sleep-and-re-check loop.
- **No routine screenshots.** Assert on globals and tasks. Take a screenshot only when a step has already failed and the state doesn't explain why.
- **Don't re-read the walkthrough file.** Read it once, extract the steps, work from that.

---

## Step 1 — gather inputs

Ask the user only for what you cannot determine:

| Input     | How to resolve it                                     |
| --------- | ----------------------------------------------------- |
| Scenario  | From the user. Maps to `scenarios/<name>/`            |
| Game URL  | Needs a running server and a game id — see below      |
| `speed`   | `fast` (default) or `human`                           |
| VM policy | Only if the scenario has VM-backed steps — see Step 4 |

### Server and game id

```bash
# Server (leave running in the background)
./start_server.sh          # BREAK_ESCAPE_STANDALONE=true, port 3000
```

Create the game with the **checked-in helper**, never by hand:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb <scenario_name>
```

`<scenario_name>` is the directory under `scenarios/` — `m02_ransomed_trust`. A
numeric mission id works too; a name that doesn't exist prints the list.

One argument is the whole of setup. The helper reads the scenario to find which
VM it draws flags from and how many it references, synthesises distinctive
stand-in values, seeds them the way the standalone new-game form does (before
`save!`, so the ERB renders with them), and writes them out as a flag-hints XML
for the session's `--flags`. It prints:

```
MISSION=m02_ransomed_trust (id 46)
GAME_ID=987
URL=http://127.0.0.1:3000/break_escape/games/987
FLAG_SOURCE=derived from scenario
FLAGS_EXPECTED=hospital_backup_server:4
VALID_FLAGS=4
PREFLIGHT OK
FLAGS_XML=tools/playtest/m02_ransomed_trust-flags-game987.xml
```

Pass `URL` to `--url` and `FLAGS_XML` to `--flags`. **If it aborts, stop and
report it — do not play on.** With no valid flags every submission returns
`Invalid flag` and the back half of a VM mission is unreachable; that failure
looks exactly like a scenario bug and is not one. A `PREFLIGHT WARN` means fewer
flags rendered than the scenario references — usually a VM name mismatch.

Pass a flag-hints XML as a second argument only when the exact values matter — a
real SecGen build, or reproducing someone else's run. Never use `flag{1}`..`flag{4}`:
when something goes wrong, a generic value is indistinguishable from the others
in a response body.

A scenario with no VM flags needs no special handling; `VALID_FLAGS=0` with no
`FLAGS_EXPECTED` is correct there.

The generated XML is named after the game, so it stays matched to the run that
used it — `<scenario>-flags-game<id>.xml`. Keep it alongside the session log;
together they say exactly what that run was given.

Note `bin/rails runner` chokes on some inline scripts (`IndexError: string not matched`) — pass a file path, which is what the helper is.

Always start a fresh game unless the user asks to resume one.

**Check after bootstrap that you are on the game you created.** m01 seeds `encounteredNPCs` at creation, so `has_progress?` is true even on a brand-new game and the session-resume overlay always appears. It lists every other session for that mission as "Load session #N" — links to *other games*. The session script now suppresses the overlay with `?skip_resume=1` and refuses to click those links, but verify anyway: the bootstrap trace must not mention "OTHER SESSIONS", and your opening tasks must be OPEN, not already complete. If earlier steps look done before you did them, you are on the wrong game.

### Prerequisites

The bridge only exists outside production (`breakEscapeConfig.testBridge`). Playwright lives in the repo (`node_modules`, chromium already installed). If `window.__test` never appears, the server is in production mode or `main.js` failed to load — say so rather than retrying.

---

## Step 2 — read the scenario's walkthrough

Scenarios document their critical path in **`scenarios/<name>/TESTING_WALKTHROUGH.md`**. The format is consistent across missions:

- Prose preamble: room layout diagram, prerequisites, minigames used, "the central rule to test against".
- `## Aim: <title>` sections, each with `[Unlocks after: …]`.
- **Numbered steps**, continuing across aims (1…23+), each shaped `**<Location> — <Thing>** — <action> → <expected outcome>`.
- Outcomes are stated as **globals set** (`bernie_gave_key`), **tasks completed** (`task sign_in_at_reception complete`), and **items given**.
- Steps marked *optional*, *(opt)* or "Optional but recommended" are not pass/fail.
- Each aim ends with `**Aim completes when:** …`, listing the required step numbers.
- Some steps are `*KO fallback*` alternates — do not run these on the main path.

Parse those numbered steps into a checklist of `{ number, location, action, expect: { globals[], tasks[], items[] }, optional }`. The stated outcomes are your assertions — you do not need to invent success criteria.

### When there is no TESTING_WALKTHROUGH.md

Not every scenario has one (m01_first_contact does not). Fall back in this order:

1. **`scenarios/<name>/SOLUTION_GUIDE.md`** — where it exists this is often a *better* source, because it carries the actual answers a playtest needs. Its format is numbered step tables grouped into phases:

   ```markdown
   ### Phase 2: Build the Case

   | Step | Action                       | Result                                    |
   | ---- | ---------------------------- | ----------------------------------------- |
   | 8    | Enter IT Room (PIN **2468**) | Task: Access IT Room ✓                    |
   | 9    | Talk to Kevin Park           | Get **Lockpick Kit** + **Server Room Keycard** |
   ```

   Parse `Step` → number, `Action` → what to do, `Result` → the assertion. Bolded values in the Action column are the literal inputs (PINs, codes). A `—` step number marks an *alternative* route, not a required one. Look for a "Puzzle Solutions Reference" section too — PINs, keys and codes collected in one place.
2. **`scenarios/<name>/dungeon_graph.md`** — lock/key dependency order. Useful for deciding what must happen before what, but it is not a step list on its own.
   Alongside it, `scenarios/<name>/dungeon_graph.json` holds the same puzzle graph in machine-readable form (`nodes` / `edges`, `soft: true` meaning an optional or narrative edge). Both are regenerated by `ruby scripts/validate_scenario.rb <scenario>`; regenerate before a run so the graph matches the scenario you are playing.

3. **An ad hoc list from the user** — a description of what to try, in order.

Say which source you used at the top of the report; a reader needs to know whether "step 9" refers to a walkthrough or a solution guide.

> Note for future maintenance: if any of these formats change, only this step needs updating — everything downstream works from the parsed checklist.

---

## Step 3 — run the session

The harness keeps one browser open for the whole playtest, reading one JSON command per line on stdin and writing one JSON result per line on stdout.

```bash
node .claude/skills/playtest-scenario/scripts/playtest-session.js \
  --url <URL from new-game.rb> \
  --speed human \
  --flags <FLAGS_XML from new-game.rb> \
  --log tools/playtest/<scenario>-session.jsonl
```

| Option    | Effect                                                                                                   |
| --------- | -------------------------------------------------------------------------------------------------------- |
| `--flags` | `FLAGS_XML` from `new-game.rb` — the flag values that game was seeded with. A comma-separated list also works |
| `--log`   | Where the session log goes. Defaults to `tools/playtest/session-<timestamp>.jsonl`; `--no-log` disables it — never do that for a run you intend to report |

`--flags` is what makes a non-VM playthrough possible. Pass the XML once at startup and write `<flag:1>`, `<flag:2>`, … in the trace wherever a flag value is needed; the harness substitutes the real value before dispatch and records the substitution in the log. `{"cmd":"flags"}` reports what was configured and every token used so far — that list is the raw material for the flag rows of the earned-secrets table.

**The browser is headed by default — the user is meant to watch it.** Only pass `--headless` if the user explicitly asks, or if there is no display.

Movement is already legible to a watcher: `moveTo` issues a real canvas click, so the game's own click indicator and pathfinding animation play exactly as they do for a human. Do not add a separate movement marker.

### Speed

| `--speed`        | Between steps | After a dialogue line | Use for                                |
| ---------------- | ------------- | --------------------- | -------------------------------------- |
| `fast` (default) | none          | 120 ms                | Automated regression runs              |
| `human`          | 900 ms        | 850 ms                | Watchable demos, showing someone a bug |

Speed changes pacing only. Waits stay deterministic in both, so `fast` is not less reliable — it is just not watchable. Prefer `human` whenever the user is present, and switch mid-run with `{"cmd":"speed","value":"human"}`.

### Approaching things: use moveToNear

`moveTo(entity.x, entity.y)` then `interact()` is the obvious move and it is wrong. The engine measures range from a point offset up to 45px in the direction the player faces, so walking as close as possible can push that point *past* a near target and the interaction is refused at a distance the player is practically standing on. This has twice been misreported as a game bug on a mission that works.

```json
{"cmd":"moveToNear","id":"derek_cabinet"}
{"cmd":"interact","id":"derek_cabinet"}
```

`getState().nearby` reports `distance` (plain) and `interactDistance` (the engine's actual measure). **`inRange` follows `interactDistance`.** If you see a small `distance` but `inRange:false`, that is the offset, not a bug — call `moveToNear`. Full mechanism in `docs/test-bridge.md`.

### Locks and doors: `lock` and `enter`

`{"cmd":"lock"}` solves the lock minigame that is currently open — it picks the
key (add `"key":"Main Office"` to choose among several), clicks the keyhole, and
waits for the unlock to finish. For PIN and password locks pass
`{"cmd":"lock","code":"2468"}`; it handles both a typed field and a keypad that
has to be tapped digit by digit. Do not click canvas coordinates by hand: the
coordinates a lock reports are **centres**, reading them as top-left corners
silently does nothing, and that mistake has cost a run.

`{"cmd":"enter","room":"main_office_area"}` walks through to an adjacent room.
Use it rather than `moveTo` coordinates. Two things make doors awkward and both
have ended runs:

- Rooms load lazily, so the destination does not exist until you are in it.
- **An unlocked door is removed from the scene.** `moveToNear("door:...")` then
  fails with `unknown-entity`, which reads like a broken door and is not one.
  The session remembers doorways from earlier `room` calls and walks through the
  remembered gap — so send `{"cmd":"room"}` in a room before trying to leave it.

The normal sequence for a locked door is: `room` → `moveToNear` the door →
`interact` → `lock` → `enter`.

### Finding things: `room`, not `brief`

`brief` lists only what is within about six tiles, capped at 25 entries. That is
right for deciding what to do next and wrong for finding anything: stand in a
doorway and you will see two chairs and conclude the desk you want is not in the
scenario.

`{"cmd":"room"}` lists every interactable in the current room at any distance —
objects, doors and NPCs, with ids and coordinates. Pass `{"id":"<room_id>"}` for
another room. Use it on entering a room, then `moveToNear` the id you want.

`visible: false` means the object exists but has not been revealed yet. That is
content gated behind something, not a missing object — do not report it as absent.

### Conversations: use `converse`, not a hand-rolled loop

`{"cmd":"converse","id":"<npc_id>"}` opens a conversation and drives it to the
end in one command: it continues while the dialogue continues, takes each choice
branch it has not taken before, closes the minigame, and returns the transcript,
the branches it chose, and the inventory afterwards.

Use it for every NPC. An unfinished conversation input-locks the main world, so
every later movement and interaction is refused with `minigame-active` — three
runs have died exactly this way, marching through a hundred commands into a game
that stopped listening. `converse` cannot leave one open.

- `choices: ["^Yes", "audit"]` — regexes tried in order when you need a specific
  branch. Otherwise it exhausts the branches and stops.
- `exhaustedBranches: true` means the conversation was a hub with nothing new left.
- `hitTurnLimit: true` means it ran to `maxTurns` — report it; it may be a loop.
- `ok: false, reason: "no-dialogue-appeared"` means the target opened something
  that is not a conversation. Phones are the common case: they open a **contact
  list** first. Read `contacts` from `mg getState`, then
  `{"cmd":"mg","action":"clickText","args":["<contact name>"]}` to open the
  message, and read the transcript from the state text.

### Clustered targets and the disambiguation menu

Where interactables sit close together — a memo on the desk beside the NPC you
want — the engine gathers everything within 32px of the click and, with more
than one, raises a disambiguation menu. This is the normal path, not an error:
`interact(id)` drives the menu itself and picks your target by name, reporting
`mode: "via-interaction-menu"`. `moveToNear` warns you to expect it with
`viaMenu: true` and names the rival in `nearestCandidate`.

Two consequences worth knowing:

- **Plain centre distance is the binding measure**, not `interactDistance`. A
  target outside 32px plain is not gathered at all, so it can neither be clicked
  nor appear in the menu — however close `interactDistance` looks. That is what
  `arrived-but-outside-plain-range` means.
- **`moveTo` walks on the keyboard when the destination is near an
  interactable**, because a world click there would open it instead of moving.
  You will see `via: "keyboard(avoids-click-trigger)"` and `avoidedTrigger`.
  It is slower and can report `blocked`; that is a real obstruction, not a bug.

### `ok: true` is not enough — check `mismatch`

Interactables sit close together and the game routes a click by proximity to the click point, so asking for an NPC can open a note lying on the desk beside them. `interact()` now reports what actually opened:

```json
{"ok":true,"mismatch":true,"opened":{"id":"notes","title":"Visitor Sign-In Log"}}
```

**`mismatch: true` is a FAILURE.** Close it and approach again with `moveToNear`, or pick your target from the disambiguation menu. Recording it as a pass means the rest of your trace is playing a different mission.

On a genuine failure, `interact()` reports `plainDistance` and `engineDistance`. Compare **`engineDistance`** against `range` — `plainDistance` is not what the game tests, and comparing it has already sent one run chasing a phantom inconsistency.

### Two traps that will cost you a run

**A bridge code change never reaches an already-open session.** The page imported the ES module at load; editing anything under `systems/test-bridge/**` has no effect until you quit the harness and start a new one. If a method you just added is missing from `Object.keys`, that is why — restart, do not re-issue the command.

**`resume` can rewind inventory while leaving story globals ahead of it.** After `{"cmd":"bootstrap","resume":"resume"}`, check `inventory` against what you expect: an NPC's `hasTalked` can reset even when the global it set is still true, so you may need to redo the most recent conversation. Prefer `resume:"new"` and a fresh game unless you specifically need to continue one.

### The command loop

Always open with `bootstrap`. It clears the staggered opening overlays — session resume prompt, tutorial prompt, title screen, mission brief, opening cutscene — by clicking real controls, and confirms the overworld is *stably* clear before returning:

```json
{"cmd":"bootstrap","tutorial":"decline","resume":"new"}
```

Then, per walkthrough step, the loop is: **read `brief` → act → wait deterministically → assert**.

```json
{"cmd":"room"}
{"cmd":"moveToNear","id":"receptionist"}
{"cmd":"converse","id":"receptionist"}
{"cmd":"waitFor","kind":"task","id":"sign_in_at_reception","timeoutMs":8000}
```

**Send one command, read its result, then choose the next.** Do not queue the
mission up front. This is the single most common way a run dies: an early
`ok:false` goes unread, the world is input-locked behind an open minigame, and
the run sends hundreds more commands into a game that stopped listening. Five
runs have ended this way, one of them 200 commands past the refusal. Treat every
`ok:false` as a stop-and-fix.

Prefer the high-level commands — `room`, `converse`, `lock`, `enter` — over
hand-rolled `mg` sequences. Each of them exists because the hand-rolled version
failed a run.

Full command list is in the header of `scripts/playtest-session.js`.

### Driving dialogue

Use `converse` (above) for whole conversations. The manual actions here are for
when a step turns on one specific line or branch — asserting what an NPC says,
or steering a choice that gates a later step.

`brief().dialogue` gives you `speaker`, `text`, and `choices` as `"1. …"` strings matching the on-screen numbers.

- `awaitingChoice: true` → `{"cmd":"mg","action":"choose","args":["^<pattern>"]}`
- `canContinue: true` → `{"cmd":"mg","action":"continue"}`

**Select choices by regex, not by number.** `choose(2)` is fine while exploring, but a recorded step must use a pattern: Ink options are conditional, so an index silently picks a different line once a gated option appears above it, and the run continues down the wrong branch still passing. A pattern turns the same edit into a failure naming the choices that were actually on screen (`choice-no-match`), and refuses to guess when a pattern matches two options (`choice-ambiguous`). Anchor patterns with `^` and keep them short — enough to identify the line, not so much that any rewording breaks them.

Use `{"cmd":"mg","action":"matchDialogue","args":["<pattern>"]}` to assert an NPC's line without acting, where a step's point is what a character *says*.

Pressing continue while choices are showing does nothing — that is correct game behaviour, not a failure. The session waits for `waitForDialogue` after each advance, so you never need to sleep between lines.

Choose the option the walkthrough names. Where it says "any opening choice", pick the one matching the outcome under test — m02 step 4 notes that a truthful line sets `was_honest` → `bernie_trusts_player`, which gates a later step, so the choice is not arbitrary.

### Minigames

When `brief().activeMinigame` is non-null, main-world actions are refused (`reason: 'minigame-active'`) — the engine has disabled scene input. Drive `{"cmd":"mg","action":…}` instead. `{"cmd":"mg","action":"getState"}` returns that minigame's own state; every minigame at minimum reports its visible `text`, `controls[]` and `fields[]`, so you can act on any of the 43 without special-casing.

Two need judgement:

- **`lockpicking`** renders into its own nested Phaser canvas, so `clickText` and `clickControl` have nothing to act on. Note that a key-type lock opens this same minigame *even when the player holds the right key* — a "key lock" step is a real step, not a skip. Read `getTestState()` and branch:
- **`container`** nests. `getState().items` lists each entry with a `kind`:

  - `kind: "take"` → the item goes into the inventory and the container stays open.
  - `kind: "view"` → the item is taken **and** a viewer (notes, text file) opens on top. Closing that viewer **re-opens the container**, it does not return you to the overworld. `returnsToContainer: true` on the viewer's state says so, and `close()` reports `returnedToContainer`.

  Use `{"cmd":"mg","action":"take","args":["<item name>"]}` — it clicks the real element whichever markup the container uses (`.container-content-item` for bins and safes, `.desktop-icon` for PCs) and tells you whether a viewer opened. To empty a container: `take` each item, and after a `view` item close the viewer once and expect to be back in the container. Do not treat the reappearing container as a stray minigame and close it in a loop.

  - `keySelection: [...]` present → the player holds more than one key, so a *selection* screen is showing first. `clickCanvas` the chosen entry's `x`/`y` (each has a `label`), then re-read state; `keyTarget` appears afterwards.
  - `keyMode: true` with `keyTarget` → one `{"cmd":"mg","action":"clickCanvas","args":[keyTarget.x, keyTarget.y]}` inserts the key, checks the cuts and completes the lock by itself. Report a plain **PASS**.
  - pick mode → picking is dexterity and cannot be driven. Use `{"cmd":"mg","action":"completeLockpick"}`, which refuses unless the player is genuinely carrying a lockpick kit, and report **PASS (assisted)**.
  - Mark **BLOCKED** only when the player has no lockpick and no key — i.e. when a real player could not open it either. That is a scenario finding worth reporting.
- **`flag-station`** reports `requiresExternalVm: true`. See Step 4.

### When an action is refused

`{"ok": false, "reason": …}` is informative, not a crash:

| reason                  | Do this                                                                                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minigame-active`       | Drive `mg` instead                                                                                                                                                   |
| `blocking-ui`           | `{"cmd":"dismiss","label":"<button text>"}`                                                                                                                          |
| `ambiguous-blocking-ui` | Re-issue `dismiss` with an explicit label. **Never guess** — the session-resume overlay's buttons include "New Session", which discards the save and reloads mid-run |
| `still-out-of-range`    | The game walked the player but stopped short; `moveTo` closer, then retry                                                                                            |
| `unknown-entity:<id>`   | Not loaded or not in the scan; check `brief().nearby`                                                                                                                |

If `interact` reports `ok: true` but `brief()` shows **no** active minigame and **no** state change, and `drain()` shows no event, suspect a game-side bug before retrying the same call. The bridge is reporting truthfully that it clicked; the game simply did not react. Retrying identically will not help — capture the log and report it.

---

## Step 4 — VM-backed steps

Missions like m02 include steps performed on a real VM (SSH in, exploit ProFTPD, recover a flag) and submitted through the `flag-station` minigame. The browser bridge cannot do this work. When you reach such a step, **ask the user** which they want, unless they set a policy up front:

| Policy               | Behaviour                                                                                                                                                                        |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `session` (default)  | Submit `<flag:N>`, substituted from the `--flags` XML given at session start. The normal choice for any non-VM playthrough                                                       |
| `pause`              | Stop and wait for the user to do the VM work themselves, then continue. Only meaningful where VMs actually exist — and the only policy that can produce a solvability pass       |
| `test-flags`         | Submit the positional stand-in `test:flag:1`, `test:flag:2`, … Use only when no real flags were seeded; it proves the station wiring and nothing else                            |
| `skip`               | Mark **BLOCKED** and continue, so the rest of the path still gets exercised. Downstream steps gated on that flag are BLOCKED too — say so rather than reporting them as failures |
| `stop`               | End the run there and report everything up to that point                                                                                                                         |

Under `session` and `test-flags`, still go and get the flag's **in-game prerequisite** first — for m01, the "My Passwords" list in the storage safe. The flag value itself cannot be earned without a VM, but the route to it can, and the earned-secrets table must show which half the run covered.

### The two environments, one trace

The game is developed in two places, and a playtest must work in both:

| Environment               | VMs  | Flags come from                                    |
| ------------------------- | ---- | -------------------------------------------------- |
| This machine (standalone) | none | Flag-hint XML you supply at game creation (Step 1) |
| The VM dev environment    | real | The VM build, via Hacktivity's `vm_context`        |

**Write traces with `<flag:N>`, never literal values.** The harness substitutes it from `--flags` and logs the substitution, so one trace runs unchanged in both environments and the log records exactly which flags were handed over rather than earned. A trace with hardcoded flag values breaks against real opaque flags and hides the handover.

`test:flag:N` is the older stand-in, resolved server-side to that station's Nth real flag. It remains valid where no flags were seeded.

```json
{"cmd":"mg","action":"type","args":[0,"<flag:1>",{"submit":true}]}
```

Note the token is **not** `flag{1}` — SecGen XML often uses `flag{1}`…`flag{4}` as the actual values, so that form is always treated literally and never positionally.

Where VMs genuinely exist and the point of the run is to verify the VM work itself, use `pause` and let a human do it; `test:flag:N` proves the station, rewards and task wiring, and nothing about whether the box is exploitable.

Real flag values still work everywhere, so `flags` and `test-flags` can be mixed in one run. Never set the flag global directly.

Pick the policy from the purpose of the run (see "What a playtest is for"). `test-flags` is right for plumbing and for unexpected-behaviour runs, and is the only option in standalone. It is never a solvability pass: a flag that could not be earned in this run is a row marked "no" in the earned-secrets table, and everything downstream of it is exercised but unproven. Only `pause`, with a human doing the VM work, turns that row into a "yes".

---

## Step 5 — report

**You may not classify a finding as a game or scenario bug.** Report what you observed and what you could not complete, with evidence. Every time this harness has asserted a game bug it has been wrong, and the wrong classification is what wastes the reader's time. If you believe the game is at fault, say "could not complete step N; suspect engine, evidence: ..." and let a human rule on it. Rule out these three first, in order: (1) the target was never actually in engine range — check `interactDistance`, not `distance`; (2) the harness reported success without confirming anything opened; (3) you drove the UI wrongly. Only when all three are excluded is "suspect engine" worth writing.

Write the report to `tools/playtest/<scenario>-report.md` and the replayable command trace to `tools/playtest/<scenario>-trace.md`. Do NOT append run reports to this skill — a skill is instructions, and a growing pile of past runs inside it costs every future run tokens for no benefit. `tools/playtest/m02-report.md` is the shape to copy.

Scenarios run 15–25 numbered steps across 4–6 aims, so report per step, grouped by aim, and keep each line to one row.

The report opens with four things, in this order, before the step results:

1. **Which of the three questions** the run answers (plumbing / unexpected behaviour / solvability).
2. **The session log path**, and the game id.
3. **`verify-run.rb` output**, pasted in full.
4. **The earned-secrets table**, in the format given above.

Rows marked "no" are the boundary of what the run proves; state plainly that the steps downstream of them were exercised but not tested. Step results cite the session log.

```markdown
## The m01 baseline

`m01_first_contact` is the calibration scenario: it is deployed, known good, and
has a verified end-to-end run. When something fails in another mission, ask
whether the same shape of thing worked in m01 before concluding the scenario is
at fault.

- `tools/playtest/m01-baseline-report.md` — the run: 13 rooms, 9 containers,
  4 flags, 37 items, every secret earned in-game before use.
- `tools/playtest/m01-baseline-session.jsonl` — its 947-command log. A worked
  example of the whole vocabulary against a real mission.
- `tools/playtest/m01-confirm-verification.md` — the eighteen harness defects
  found getting there, and what each looked like before diagnosis. Read this
  before reporting a suspected engine or scenario fault; the failure you are
  looking at is probably in there.

Two m01 findings are open and may recur elsewhere: a collider short-stops
`moveToNear` on three server-room objects (up to 59.7px), and the final
abort/launch confirmation was never completed, so the debrief path is untested.

**Drive with Sonnet.** Five Haiku runs failed at the same point — not reacting to
`ok:false` — including one on the fully fixed harness with the route in hand.
Haiku is fine for setup, reading reports, and cross-checking a log against a
claim.

---

## Related skills

- `/validate-scenario` — schema and solvability, before playing
- `/walkthrough-scenario` — generates the `TESTING_WALKTHROUGH.md` this skill consumes
- `/scenario-design-review` — design judgement, not execution
```
