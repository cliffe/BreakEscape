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

One overlay, four modes, chosen by the object's `minigameData.mode`. Each mode has its own completion
and its own globals. A mode other than `recon` is a short structured exercise, built entirely from
selecting authored options: no typing.

| Mode | What the player does | Completion sets |
|------|----------------------|-----------------|
| `recon` (default) | Reads people cards, the company panel and the readiness checklist | `target_ready_<id>` for each card that flips to ready |
| `scope` | Reads the rules-of-engagement brief and sorts authored scope cards into in-scope and out-of-scope | the mode's `onCompleteGlobal` when every card is placed correctly |
| `plan` | Turns the brief into a plan by picking an objective, a success measure and a target from authored lists | the mode's `onCompleteGlobal` |
| `defender` | The same facts relabelled as exposure: pick a mitigation for each leaked fact and mark the indicators in the engagement's own campaign | the mode's `onCompleteGlobal` |

The content of `scope`, `plan` and `defender` (the cards, option lists, correct answers and the global
names) is authored in `social.engagement` (shape owned by `10`). This doc owns the mechanism: a mode block
names its `onCompleteGlobal`, and the board sets it through the shared global writer (`00` S3) on the
false-to-true flip. Objectives listen with an `eventMappings` entry on `global_variable_changed:<name>`
(README engine table, "Objectives"); the board never relies on `minigame_completed` to mean "task done",
because closing the overlay also completes it (see Closing).

## The loop (recon mode)

A case-file overlay (house style, see Visual style). The board is rebuilt on open from the persisted
`se_intel_*` globals; nothing can be collected while it is open (overlays are modal, `00` §5), so it needs
no live updates. The layout:

- **People cards:** one per target (`people`), merged on the shared cast `id` (`00` §1): name, role,
  address and the facts found about them, with empty slots for what is not yet known ("Expects: ???").
  Each fact appears on the card named by its `subject`; company-wide facts (`email_pattern`, `tech_stack`,
  `username_convention`, `careers_attachment`) go on the company panel.
- **Contacts strip:** people who appear in a held fact's `provides` (for example Jed Baker, the trusted
  sender, who is not himself a target) get a small contact card, so the player can see who the story is
  built around.
- **Company panel:** the email pattern, tech stack, key dates and processes.
- **Attack readiness:** per target, a checklist of the **recon prerequisites** a credible approach needs,
  derived from the OSINT facts that back the recon-fed factors (`00` §4), not from `04`'s craft factors
  (`addressedTo`, `urgencyCalibrated` and `senderAuth` are about what the player writes). Slots are phrased
  as intel gaps, not factor names, so the board nudges without handing over the pretext recipe.
- **From the call:** facts granted by a pretext call (`06`) show on the card in their own section. They
  are not readiness slots, because readiness never depends on something earned after the recon room
  (`00` §4).
- **Influence:** a card for a target that has a `social.characters` entry shows its influence bar with the
  threshold icons (`00` §8, the S4 component), read-only, from the character's influence global.

### Readiness rule and worked example

Melanie Pierce's card has two recon slots. As facts land:

```
Melanie Pierce — Finance                          [ Not ready ]
  ✗ You still don't know who she'd open an email from.      (pierce_trusts_jed, email_pattern)
  ✗ You still don't know what she expects to receive.       (pierce_expects_balance_sheet)
```

Once the player holds `email_pattern`, `pierce_trusts_jed` and `pierce_expects_balance_sheet`, both slots
tick and the card flips to "Ready to approach — you have enough to craft something she'll believe." It never
names the factors or spells out the message. The expected file type rides along with
`pierce_expects_balance_sheet` (its `provides` carries `attachmentKind: spreadsheet`), so it is not a third
slot. Each ✓ and ✗ is paired with words, never colour or a mark alone.

The slots, one array per target, are the `00` §4 shape (an object keyed by target id). They cover all
three lab targets, so every recon-fed factor has backing intel:

```jsonc
"social": { "intelBoard": {
  "title": "Engagement: AccountingNow",
  "people": ["pierce", "hampshire", "lord"],
  "readinessSlots": {
    "pierce": [
      { "label": "Who she trusts", "needsIntel": ["pierce_trusts_jed", "email_pattern"],
        "goalString": "You still don't know who Melanie would open an email from.",
        "doneString": "She trusts Jed Baker; you know the email pattern." },
      { "label": "What she expects", "needsIntel": ["pierce_expects_balance_sheet"],
        "goalString": "You still don't know what Melanie expects to receive.",
        "doneString": "She expects a Q3 balance sheet from Jed, on Fridays." } ],
    "hampshire": [
      { "label": "Where mail goes", "needsIntel": ["hampshire_careers"],
        "goalString": "You still don't know how Chris receives mail from strangers.",
        "doneString": "The careers inbox accepts CVs from anyone." },
      { "label": "What the file should be", "needsIntel": ["careers_attachment"],
        "goalString": "You still don't know what kind of file Chris will open.",
        "doneString": "Chris takes .odt and .docx files." },
      { "label": "Why he would read it", "needsIntel": ["hampshire_cv_backlog"],
        "goalString": "You still don't know what Chris is busy with.",
        "doneString": "Chris is behind on CVs before Friday." } ],
    "lord": [
      { "label": "Her payroll system", "needsIntel": ["lord_portal", "lord_intern"],
        "goalString": "You still don't know which staff system Sofia uses.",
        "doneString": "She is a new intern and uses a staff payroll portal." } ]
  },
  "mitigations": {                               // defender mode only: one pick per fact, ids only
    "pierce_expects_balance_sheet": [
      { "id": "keep_off_site", "text": "Keep internal routines off the public site", "best": true },
      { "id": "remove_staff_page", "text": "Take the whole team page down", "best": false } ] }
} }
```

- `needsIntel` names facts; a slot may also carry `needsGlobal: [...]` (booleans only) for a non-fact
  prerequisite, with a `goalString` that does not name the builder. None of the lab's slots uses it: the
  built landing page is checked by `linkCredible` at send time, not by a slot (`00` §4).
- Lord's `senderTrust`, `linkCredible` and `pretextRelevant` are backed by `lord_trusts_portal_sender`,
  `lord_portal_name` and `lord_payslip_date`, all granted by the call (`06`). They appear in "From the
  call", not in her readiness slots.
- A card flips to ready when all its slots are done. The board then sets `target_ready_<id>` through the
  shared writer, once, on the false-to-true flip. A scenario uses it to open the composer or prompt the
  handler. The names `target_ready_<id>` and `osint_done` come from `10`'s chain.
- `scopeNote` and the rest of the `scope`, `plan` and `defender` content are authored in
  `social.engagement`; the board shows `scopeNote` in a banner in every mode. It carries the ethics and
  authorisation beat (book Ch. 2) on the screen the player sees most.

### Decisions the board does not make for the player

The player does not file facts. Each fact carries a `subject`, so it lands on the right card with no linking
step; the old "link this fact to a person" and "derive the pattern" interactions are gone (the pattern is
collected in `02`, and the filing was busywork). The satisfying deductions belong to `02`: choosing the
right J. Baker, choosing the metadata field that matters.

## Defender mode

The same facts are shown as **exposure**, not progress. For each fact the card shows its `reduceNote` (the
one-line "reduce this" prompt from `00` §1, for example "Keep internal routines off the public site") and
asks the player to pick a mitigation from the authored `mitigations` for that fact. A wrong pick says what
it would and wouldn't fix. This makes it a threat-intelligence product (book Ch. 12), not a relabelled
board. The indicators step lists authored indicators from the player's own campaign (the sender address,
the link domain, the attachment kind), each read from the stored `tells` of what was sent (`00` §3), and
asks the player to mark which they would block. Selections are saved as ids in `se_board_state`.

## Engine wiring

New component `public/break_escape/js/minigames/intel-board/`, an openable overlay started via
`startMinigame`. There is no always-on tab framework, so "persistent" means the data persists, not that
the panel stays on screen. It needs the full wiring checklist in README Conventions:

- `export`, `import`, `registerScene('intel-board', …)` in `minigames/index.js`.
- A starter in `systems/minigame-starters.js`, exposed as `window.startIntelBoard`.
- A branch in `systems/interactions.js` for the case-file object type, and a sprite
  `assets/objects/case-file.png`.
- A stylesheet linked in `app/views/break_escape/games/show.html.erb`.
- No `requiresKeyboardInput`: nothing is typed.
- Validator keys and schema (N6): `social.intelBoard` under the `social` key (`00` §11), and a
  `minigameData` schema entry for the case-file object.

The object carries only a pointer: `minigameData: { mode }` (new; one of `scope`, `plan`, `recon`,
`defender`, default `recon`). The board also opens from the phone, and from `02`'s "Case file" button via
the nested-launch convention (README Conventions): `02` passes `returnTo`, and closing the board reopens
the browser. The mail composer reads the `se_intel_*` globals inline and never opens the board.

**State.** Facts come from the `se_intel_*` globals (declared in `globalVariables`, `00` §5). Mode answers
(sorted scope cards, plan picks, mitigations, indicator marks) are ids only, stored in one global,
`se_board_state`, under the `globalVariables[STATE_KEY]` pattern the SIEM minigame uses, so they survive a
reload and stay small. The board calls `window.stateSync?.sync()` after each mode completes. The 60 KB
`pagehide` flush shares one budget with every other global (`state-sync.js`).

**Closing.** Closing the board, and Esc, are normal exits: the scene sets
`gameResult = { mode, completed: <bool>, ready: [...] }` and calls `complete(true)`, so a close never emits
`minigame_failed`. It uses `disableClose: true` and its own Escape binding (`base-minigame.js` binds a
document-level Escape that calls `complete(false)`). Because a close also fires `minigame_completed`, task
completion keys on the mode's global, not on that event.

**Reads.** `04`'s target definitions are read for the target list only. Readiness comes from
`readinessSlots`, so an author does not duplicate content.

### New engine work

| # | Item | Where in code |
|---|------|---------------|
| N1 | `intel-board` overlay: people cards, contacts strip, company panel, readiness checklist, "From the call" section, influence bar (S4) | new `minigames/intel-board/`; wiring as above |
| N2 | Rebuild from the `se_intel_*` globals on open; file each fact by `subject`; no live updates needed | in N1; `00` §5 |
| N3 | `target_ready_<id>` set through the shared writer on the false-to-true flip (`00` S3) | `systems/apply-actions.js`; `social-intel.js` (`02` N2) |
| N4 | Modes `scope`, `plan`, `defender`: structured selection exercises, ids saved in `se_board_state`, each mode names an `onCompleteGlobal`; content read from `social.engagement` | in N1; shape owned by `10` |
| N5 | Close as a normal exit with its own Escape; nested launch and return-to (README engine table, "Minigame framework") | `minigames/framework/base-minigame.js` (`disableClose`), `minigame-manager.js` |
| N6 | Validator: `readinessSlots` keys are target ids, every `needsIntel` id is a declared fact, every target has at least one slot, `mitigations` keys are facts with a `reduceNote`, `onCompleteGlobal` names are declared; schema entries for `social.intelBoard` and the case-file `minigameData` | `scripts/validate_scenario.rb` (S11); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json` |

## Accessibility and small screens

- The corkboard is decoration. The accessible structure is a list of cards, each with a heading, a
  readiness status in words ("Not ready", "Ready to approach") and a checklist. A single column below about
  700 px; cards stack.
- Nothing is dragged. Sorting scope cards, picking a plan option and picking a mitigation are all "pick one
  of these buttons", reachable by Tab and Enter, 44 px targets.
- `aria-live="polite"` regions announce a card changing to ready and a mode completing. No motion under
  `prefers-reduced-motion`; the pin and string art is static.
- Hover notes (such as a fact's `reduceNote`) are also behind a visible "Why?" button, since hover does not
  exist on touch.
- ✓ and ✗ are always paired with words.

## Reuse across audiences

- **Student lab:** all four modes. Defender mode is a real threat-intel product (book Ch. 12). The session
  length (about 75 minutes, `10`) limits how many scope and plan cards ship.
- **Awareness:** a simplified "what we found about you" reveal at the episode's end, the gut-punch.
- **Eldritch Hacker:** the case file the handler references; readiness gates the next objective, and a
  card can show a character's influence bar.

## Visual style

Chrome follows house style (README Conventions): dark panel, square corners, `--ui-*` tokens, `GNF` body,
`Press Start 2P` headings; no hard-coded green. Pinned-card, string and empty-slot art are pixel art. Fact
text, addresses and the checklist are inert DOM text in the bundled readable sans-serif (`02` N7).

## Assets

- Corkboard background, pinned-card and string pixel art (PixelLab-first, none generated yet), empty-slot
  markers, threshold icons (shared with S4).
- Headshots for people and contact cards: the same 32x32 `<key>_headshot.png` files as `02`, which needs
  sprite keys for `pierce`, `baker`, `hampshire`, `lord` (`02` N6).

## Open questions

- OQ1: always-available tab like the notebook, or an object you open? Default: an object (the case file)
  and the phone, persistent data either way.
- OQ2 (resolved): no manual linking. Each fact has a `subject`, so the board files it. The deductions are
  in `02`.
- OQ3: does the indicators step in defender mode need its own authored list, or is the stored `tells` of
  what the player sent enough? Default: read `tells`; add an authored list only if playtest shows it thin.

## Unresolved against `00` and `10`

- `minigameData.mode` is not in `00` §11's pointer list. Add it.
- The `scope`, `plan` and `defender` content shapes and the global names (`roe_signed`, `plan_done`,
  `profile_done` in `10`) are `10`'s to define in `social.engagement`; this doc assumes each mode block has
  an `onCompleteGlobal`.
- `target_ready_<id>` and `osint_done` are named by `10`; `00` should list them if they stay.
