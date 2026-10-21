# 03 — Intel board (evidence & target-profile tracker)

Status: plan. Shows what the OSINT browser (`02`), conversations (`06`) and physical recon have turned up,
and turns scattered facts into a target profile the player builds the attack from. Doubles as the
progress tracker, the home of the scoping and planning beats, and, in defender mode, the threat-intelligence
view (book Ch. 12). Readiness rule: `00_data_contract.md` §4; fact schema and join keys: §1; persistence: §5.
Docs write bare fact ids; the engine and the ink use `se_intel_<id>`.

## Purpose & audience

A **board the player returns to** that groups discovered facts by person and company and shows what is
still missing. It makes the recon-to-pretext link explicit: the player sees "I know Melanie trusts Jed and
expects a Friday balance sheet" and then goes to compose. All three audiences. Maps to book Ch. 3
(preparing and planning: the scoping worksheet becomes the board's frame), Ch. 6 (people OSINT) and Ch. 12
(threat intelligence, defender mode).

## Player goal in their own words

"Keep track of what I've found, and see what I still need before I can hit this person."

## Modes

One overlay, four modes, chosen by the object's `minigameData.mode` (`00` §11). **One case-file object
per mode**: the scenario places a `scope` board, a `plan` board and a `recon` board (and a `defender`
board) as separate objects, so no rule has to pick a mode from globals. A nested launch passes `mode` in
the call (`00` S12). Each mode has its own completion and its own globals. A mode other than `recon` is a
short structured exercise, built entirely from selecting authored options: no typing.

| Mode | What the player does | Completion sets |
|------|----------------------|-----------------|
| `recon` (default) | Reads people cards, the company panel and the readiness checklist. Display only | nothing: `target_ready_<id>` and `osint_done` are set where the facts are granted (below) |
| `scope` | Reads the rules-of-engagement brief, sorts authored scope cards into in-scope and out-of-scope, and answers the authored stop-rule question | `roe_signed` when every sorting card is placed correctly and every question card is answered with its `correct: true` option; step globals `roe_scope_done` and `roe_stoprule_done` |
| `plan` | Turns the brief into a plan by making two single-select picks from authored lists: the objective and the success measure (the targets are already fixed by the scope step, so there is no target pick) | `plan_done`; steps `plan_objective_done`, `plan_measures_done` |
| `defender` | The same facts relabelled as exposure: pick the better mitigation for each leaked fact | `profile_done` (no steps) |

The content of `scope`, `plan` and `defender` (cards, option lists, correct answers, the global names) is
authored in `social.engagement` (`00` §11 "Engagement mode blocks"; `10` writes the lab's content). This doc
owns the mechanism: each mode block has an `onCompleteGlobal` and an optional `steps[]` of `{ id,
onCompleteGlobal }`, and the board sets them through the shared global writer (`00` S3) on the
false-to-true flip.

**Step binding.** Every sorting card, question card and pick carries `step: <stepId>`, naming a step in the
same block. A step is done when every item carrying that step id is answered correctly: a sorting card sits
in the right pile; a question card has its `correct: true` option chosen; a single-select pick has its correct option
chosen; a `{ kind: "confirm", step, text }` item (a Confirm button labelled with `text`, no answer to get wrong, used by the lab report's `results` step) is done when pressed. The step's global is set on the false-to-true flip, and the block's `onCompleteGlobal` is set when
every declared step is done. A block with no `steps[]` is done when all its items are. A validator rule
(N6) rejects an item whose `step` is not declared in its block and a declared step with no items. In the
lab, `scope` has steps `scope` and `stoprule`; `plan` has `objective` and `measures`, and both are
single-select picks (one authored option is correct, the rest are wrong, and each wrong pick shows its `why`).
The validator (N6) checks that every `plan` pick and every `question` card has exactly one `correct: true` option.

A `scope` block holds two card kinds: sorting cards, and `kind: "question"` cards with
options `{ id, text, correct, why }` (one right answer, an explanation after each pick). Objectives
listen with an `eventMappings` entry on `global_variable_changed:<name>` (README engine table,
"Objectives"), one global per task; the board never relies on `minigame_completed` to mean "task done",
because closing the overlay also completes it (see Closing).

## The loop (recon mode)

A case-file overlay (house style, see Visual style). The board is rebuilt on open from the persisted
`se_intel_*` globals; nothing can be collected while it is open (overlays are modal, `00` §5), so it needs
no live updates. The layout:

- **People cards:** one per target (`people`), merged on the shared cast `id` (`00` §1). Name, role and
  address read from `social.people`, but only as far as the player holds them: the header reads "Not yet
  identified" until a held fact either provides a name form for the person or has that person as its
  `subject`. **This is the one naming rule for the game**: the evidence notes `02` writes use it too, so a
  fact reads the same on the board and in the notebook (a note for a fact with subject `pierce` names
  Melanie Pierce, because that fact is itself held once granted). The second route exists for Hampshire, whom no fact names (she is greeted with
  `greet_generic`): once `hampshire_careers` or any other fact with subject `hampshire` is held, the
  header shows her name and role from `social.people`. The role appears once `pierce_role` (or the
  equivalent) is held, and the address once `email_pattern` or a fixed address fact is held. The
  card lists the facts found about the person, with empty slots for what is not yet known ("Expects:
  ???").
  Each fact appears on the card named by its `subject`; company-wide facts (`email_pattern`, `tech_stack`,
  `username_convention`) go on the company panel. `careers_attachment` has subject `hampshire` (`00` §1) and
  sits on Chris Hampshire's card. The two stale facts (`baker_namesake`, `old_org_chart`) have subject
  `company` and appear in an "Old or unverified" list on the company panel, tagged as such, so the player
  sees they were found but not that they are wrong.
- **Contacts strip:** people who appear in a held fact's `provides` (for example Jed Baker, the trusted
  sender, who is not himself a target) get a small contact card, so the player can see who the story is
  built around. The `<person>_<form>` value in the `provides` entry resolves to a person through
  `social.people` (`00` §1).
- **Company panel:** the email pattern, tech stack, key dates and processes.
- **Attack readiness:** per target, a checklist of the **recon prerequisites** a credible approach needs,
  derived from the OSINT facts that back the recon-fed factors (`00` §4), not from `04`'s craft factors
  (`addressedTo`, `urgencyCalibrated` and `senderAuth` are about what the player writes). Slots are phrased
  as intel gaps, not factor names, so the board nudges without handing over the pretext recipe.
- **From the call:** facts granted by a pretext call (`06`) show on the card in their own section. They
  are not readiness slots, because readiness never depends on something earned after the recon room
  (`00` §4).
- **Influence:** a card for a target that has a `social.characters` entry shows its influence bar with the
  threshold icons and the score as a number beside it (`00` §8, the S4 component), read-only, from the character's influence global.

### Readiness rule and worked example

Melanie Pierce's card has three recon slots (`00` §4). As facts land:

```
Melanie Pierce — Finance                          [ Not ready ]
  ✗ You still don't know what Melanie does here.             (pierce_role)
  ✗ You still don't know who Melanie would open an email from.   (pierce_trusts_jed, email_pattern)
  ✗ You still don't know what Melanie expects to receive.    (pierce_expects_balance_sheet)
```

Once the player holds `pierce_role`, `email_pattern`, `pierce_trusts_jed` and
`pierce_expects_balance_sheet`, all three slots tick and the card flips to "Ready to approach — you have
enough to craft something she'll believe." It never names the factors or spells out the message. The
first slot is there because `pierce_role` provides her name forms; without it a card could read "Ready"
while the composer had no name to greet her with (`00` §4). The expected file type rides along with
`pierce_expects_balance_sheet` (its `provides` carries `attachmentKind: spreadsheet`), so it is not a
fourth slot. Each ✓ and ✗ is paired with words, never colour or a mark alone. The `doneString` and `goalString` are
plain sentences with no mark in them; the UI prefixes the mark and the word ("✓ Done:", "✗ Missing:"). `00`
§4 uses the same sentences, so there is one canonical form.

The slots, one array per target, are the `00` §4 shape (an object keyed by target id). They cover all
three lab targets, so every recon-fed factor has backing intel:

```jsonc
"social": { "intelBoard": {
  "title": "Engagement: AccountingNow",
  "people": ["pierce", "hampshire", "lord"],
  "readinessSlots": {
    "pierce": [
      { "label": "Who she is", "needsIntel": ["pierce_role"],
        "goalString": "You still don't know what Melanie does here.",
        "doneString": "She works in Finance." },
      { "label": "Who she trusts", "needsIntel": ["pierce_trusts_jed", "email_pattern"],
        "goalString": "You still don't know who Melanie would open an email from.",
        "doneString": "She trusts Jed Baker; you know the email pattern." },
      { "label": "What she expects", "needsIntel": ["pierce_expects_balance_sheet"],
        "goalString": "You still don't know what Melanie expects to receive.",
        "doneString": "She expects a Q3 balance sheet from Jed on Fridays." } ],
    "hampshire": [
      { "label": "Where mail goes", "needsIntel": ["hampshire_careers"],
        "goalString": "You still don't know how Chris receives mail from strangers.",
        "doneString": "The careers inbox accepts CVs from anyone." },
      { "label": "What the file should be", "needsIntel": ["careers_attachment"],
        "goalString": "You still don't know what kind of file Chris will open.",
        "doneString": "Chris takes .odt and .docx files." },
      { "label": "Why she would read it", "needsIntel": ["hampshire_cv_backlog"],
        "goalString": "You still don't know what Chris is busy with.",
        "doneString": "Chris is behind on CVs before Friday." } ],
    "lord": [
      { "label": "Her payroll system", "needsIntel": ["lord_portal", "lord_intern"],
        "goalString": "You still don't know which staff system Sofia uses.",
        "doneString": "She is a new intern and uses a staff payroll portal." } ]
  }
} }
```

`intelBoard` holds only the title, `people` (ids) and `readinessSlots`. Everything a mode shows
(`scopeNote`, scope and plan cards, the defender's `factMitigations`) lives in `social.engagement`
(`00` §11), so each piece of content has one home.

- `needsIntel` names facts; a slot may also carry `needsGlobal: [...]` (booleans only) for a non-fact
  prerequisite, with a `goalString` that does not name the builder. None of the lab's slots uses it: the
  built landing page is checked by `linkCredible` at send time, not by a slot (`00` §4).
- Lord's `senderTrust`, `linkCredible` and `pretextRelevant` are backed by `lord_trusts_portal_sender`,
  `lord_portal_name` and `lord_payslip_date`, all granted by the call (`06`). They appear in "From the
  call", not in her readiness slots.
- A card is ready when all its slots are done. **The board does not compute this.** `evaluateReadiness`
  (`00` §4, `systems/social-intel.js`) runs after every fact grant (`02` N2 `grantFact`, and the call
  grants of `06`) and sets `target_ready_<id>` once, on the false-to-true flip, and `osint_done` when every
  id in `people` is ready. The board only displays the result, so a player who collects everything and
  walks to the handler without opening the case file still advances. A scenario uses the globals to open
  the composer or prompt the handler.
- `scopeNote` is authored in `social.engagement`; the board shows it in a banner in every mode. It carries
  the ethics and authorisation beat (book Ch. 2) on the screen the player sees most.

### Decisions the board does not make for the player

The player does not file facts. Each fact carries a `subject`, so it lands on the right card with no linking
step. The pattern is collected in `02` from the Hunter lookup. The satisfying deductions belong to `02`:
choosing the right J. Baker, choosing the metadata field that matters.

## Defender mode

The same facts are shown as **exposure**, not progress. For each fact in `engagement.defender.factMitigations`
(`00` §11: `[ { intel, options: [ { id, text, good, why } ] } ]`) the card shows the fact's `reduceNote` (the
one-line "reduce this" prompt from `00` §1, for example "Staff should not post about internal systems or their release dates." on `lord_portal`) and
asks the player to pick a mitigation. Only facts that carry a `reduceNote` can appear here (N6), so the
lab's four defender facts (`email_pattern`, `username_convention`, `lord_portal`, `hampshire_careers`, the
list in `00` §1) each need one authored there; `00` §1 authors a note for no other fact. A wrong pick shows its `why`: what it would and wouldn't fix. The
mode completes (`profile_done`) when each fact has a `good` option chosen. This makes it a
threat-intelligence product (book Ch. 12), not a relabelled board. There is **no indicators step** unless
the scenario authors `engagement.defender.indicators` (off by default; the lab authors none). If it does,
the step lists those indicators, each read from the stored `tells` of what was sent (`00` §10a), and asks
the player to mark which they would block; it does not gate `profile_done` unless the block says so.
Selections are saved as ids in `se_board_state`.

## Engine wiring

New component `public/break_escape/js/minigames/intel-board/`, an openable overlay started via
`startMinigame`. There is no always-on tab framework, so "persistent" means the data persists, not that
the panel stays on screen. It needs the full wiring checklist in README Conventions:

- `export`, `import`, `registerScene('intel-board', …)` in `minigames/index.js`.
- A starter in `systems/minigame-starters.js`, exposed as `window.startIntelBoard`.
- A branch in `systems/interactions.js` for the case-file object type, and a sprite
  `assets/objects/case-file.png`, and a
  `this.load.image('case-file', 'objects/case-file.png')` line in `core/game.js` `preload()`. Object sprites are created from a base key that only a hard-coded preload line guarantees; without it the object renders as Phaser's missing-texture box, and the validator's PNG-exists check does not catch that.
- A stylesheet linked in `app/views/break_escape/games/show.html.erb`.
- `requiresKeyboardInput: true`. Nothing is typed, but the board is operated by Tab, Enter and Space, and
  the player controller's document-level `keydown` handler would otherwise jump on Space, interact on
  `E` (possibly opening another object's minigame) and swallow arrow keys. The flag pauses it
  (`core/player.js:279-330`, `keyboardPaused`; `minigames/framework/minigame-manager.js:37-45`). Add a
  test-bridge check that Space and `E` do nothing while the board is open.
- Validator keys and schema (N6): `social.intelBoard` under the `social` key (`00` §11), and a
  `minigameData` schema entry for the case-file object.

The object carries only a pointer: `minigameData: { mode }` (`00` §11; one of `scope`, `plan`, `recon`,
`defender`, default `recon`; one object per mode). The board also opens from `02`'s "Case file" button via
`00` S12: `02` passes `{ mode: 'recon', returnTo }`, and closing the board reopens the browser. There is
no phone entry (the phone has only the Notes return hook, `returnToPhoneAfterNotes`,
`minigames/index.js`). The mail composer reads the `se_intel_*` globals inline and never opens the board.

**State.** Facts come from the `se_intel_*` globals (declared in `globalVariables`, `00` §5). Mode answers
(sorted scope cards, plan picks, mitigations, indicator marks) are ids only, stored in one global,
`se_board_state`, under the `globalVariables[STATE_KEY]` pattern the SIEM minigame uses, so they survive a
reload and stay small. The board calls `window.stateSync?.sync()` after each mode completes. The 60 KB
`pagehide` flush shares one budget with every other global (`state-sync.js`).

**Closing.** Closing the board, and Esc, are normal exits: the scene sets
`gameResult = { mode, completed: <bool>, ready: [...] }` and calls `complete(true)`, so a close never emits
`minigame_failed`. It uses `disableClose: true`, which hides the framework's close button and Escape
handler (`base-minigame.js:18-23, 70-80`), so the board draws its own visible **Close** control and binds
its own Escape (capture phase). Because a close also fires `minigame_completed`, task completion keys on
the mode's global, not on that event.

**Reads.** `04`'s target definitions are read for the target list only. Readiness comes from
`readinessSlots`, so an author does not duplicate content.

### New engine work

| # | Item | Where in code |
|---|------|---------------|
| N1 | `intel-board` overlay: people cards, contacts strip, company panel, readiness checklist, "From the call" section, influence bar with its number (S4), own Close control, `requiresKeyboardInput: true` | new `minigames/intel-board/`; wiring as above |
| N2 | Rebuild from the `se_intel_*` and `target_ready_*` globals on open; file each fact by `subject`; no live updates needed | in N1; `00` §5 |
| N3 | Display `target_ready_<id>` and `osint_done`, set by `evaluateReadiness` (`00` §4), which is owned by `02` N2 | `social-intel.js` (`02` N2) |
| N4 | Modes `scope`, `plan`, `defender`: structured selection exercises (sorting cards, question cards, picks, confirm items), ids saved in `se_board_state`, items bound to steps by `step`, step and block globals set through the shared writer; content read from `social.engagement` | in N1; shape in `00` §11 |
| N5 | Close as a normal exit with its own Close control and Escape; nested launch and return-to (`00` S12) | `minigames/framework/base-minigame.js` (`disableClose`), `minigame-manager.js` |
| N6 | Validator: `readinessSlots` keys are target ids, every `needsIntel` id is a declared fact, every target has at least one slot and every `addressedAs` source lies in its slots, `factMitigations[].intel` ids are facts with a `reduceNote`, every `onCompleteGlobal` and step global is declared, every item's `step` is declared in its block and every declared step has items (a `confirm` item counts, and carries a `text` label); every `plan` pick list and every `question` card has exactly one `correct: true` option; schema entries for `social.intelBoard` and the case-file `minigameData` | `scripts/validate_scenario.rb` (S11); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json` |

## Accessibility and small screens

- The corkboard is decoration. The accessible structure is a list of cards, each with a heading, a
  readiness status in words ("Not ready", "Ready to approach") and a checklist. A single column below about
  700 px; cards stack.
- Nothing is dragged. Sorting scope cards, picking a plan option and picking a mitigation are all "pick one
  of these buttons", reachable by Tab and Enter, 44 px targets. A visible Close button is always present.
- `aria-live="polite"` regions announce a card changing to ready and a mode completing. No motion under
  `prefers-reduced-motion`; the pin and string art is static.
- Hover notes (such as a fact's `reduceNote`) are also behind a visible "Why?" button, since hover does not
  exist on touch.
- ✓ and ✗ are always paired with words.

## Reuse across audiences

- **Student lab:** all four modes, each on its own object. Defender mode is a real threat-intel product (book Ch. 12). The session
  length (about 75 minutes, `10`) limits how many scope and plan cards ship.
- **Awareness:** a simplified "what we found about you" reveal at the episode's end, the gut-punch.
- **Eldritch Hacker:** the case file the handler references; readiness gates the next objective, and a
  card can show a character's influence bar.

## Visual style

Chrome follows house style (README Conventions): dark panel, square corners, `--ui-*` tokens, `GNF` body,
`Press Start 2P` headings; no hard-coded green. Pinned-card, string and empty-slot art are pixel art. Every
string the player reads (fact text, addresses, the checklist, mitigation options and their `why` lines,
the scope brief) is inert DOM text in Source Sans 3 (`00` §6, `--se-font-readable`).

## Assets

- Corkboard background, pinned-card and string pixel art (PixelLab-first, none generated yet), empty-slot
  markers, threshold icons (shared with S4).
- Headshots for people and contact cards: the same 32x32 `<id>_headshot.png` files as `02`; `pierce`,
  `baker`, `hampshire` and `lord` are headshot-only, with a headshot asset id and no sprite key (`02` N6).

## Open questions

- OQ1: always-available tab like the notebook, or an object you open? Default: an object (the case file),
  persistent data either way.
- OQ2: does the defender indicators step need its own authored list, or are the stored `tells` of what the
  player sent enough? Default: no indicators step in the lab; `engagement.defender.indicators` is the
  opt-in, reading `tells` from the sent records.
