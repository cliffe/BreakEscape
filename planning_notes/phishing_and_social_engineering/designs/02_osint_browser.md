# 02 — OSINT browser (company site, social media, public documents)

Status: plan. Feeds the facts a good pretext needs. Pairs with the intel board (`03`), which shows what
the player has found. The fact schema, the dataset and the `se_intel_*` globals are defined in
`00_data_contract.md` §1 and §5; this doc only says where each fact is found and how the player finds it.
Docs write bare fact ids (`pierce_role`); the engine and the ink use `se_intel_pierce_role`.

## Purpose & audience

An in-world **web browser** the player uses to research a target company and its people, the way a
social engineer does reconnaissance before an attack. Maps to book Ch. 4 (business OSINT), Ch. 5 (social
media and public documents) and Ch. 6 (people OSINT). All three audiences; the student lab goes deepest
(document metadata, the mechanics of each real tool named below), tuned by the `profile` in the data.

## Player goal in their own words

"Find out enough about this company and its people to know who to hit, and with what story."

## The loop

A browser overlay (house style, see Visual style). The player visits seeded in-world sites and reads
them. Reading is active: **the player picks out the lines that matter.** Every paragraph, staff row, post,
search result and metadata field is a selectable block. Selecting one either collects the fact it
carries, with a short "noted" confirmation, or says "Nothing here you can use." Decoy blocks are
deliberate: a browser that marked the useful lines would do the player's thinking for them.

1. Open the browser (the company home page is the default).
2. Move between pages with the sites strip and the links on each page. The address bar shows where you
   are; it is display-only, because nothing in this browser is typed.
3. Select a block to note it. A noted fact saves at once (see Engine wiring).
4. Open a document's properties panel and select the field that gives something away.
5. Use the tools panel: pick a simulated tool lookup or a search from the list (below).
6. Close the browser. Closing is a normal exit, and the case file (`03`) shows what is still missing.

There is **no typed input anywhere in this browser.** No search box, no pattern prompt, no free-text
answer. What a player can do is read, follow a link, select a block, or pick from a short authored list.
That keeps the browser consistent with composing from templates with blanks (`00` §10): the player earns
facts by finding them, and a fact then supplies the blank values they can use later.

### One award path per fact

Each fact in `social.intelFacts` is granted by **exactly one** element of the OSINT data: one block, one
search result, one lookup result or one metadata field. That element's page or result id is the fact's
`source` (`00` §1). No fact is also granted by merely viewing a page, and a page carries no `intel`
array of its own. A fact that the player sees on two pages is granted by the one that the author
names; the second page shows the same words as unmarked text. The validator checks this (N8).

Facts that arrive by a pretext call (`lord_portal_name`, `lord_payslip_date`, `lord_trusts_portal_sender`)
are granted by `06`, not here, and the validator excludes them from the "granted exactly once here" rule.
Both paths call the same function (N2), so a fact looks the same however it arrives.

### Layers (each a kind of source, each teaching a real OSINT technique)

1. **Company website** (Ch. 4): staff directory (names, roles, published addresses), org structure, news
   and team notes, vacancies (which reveal tech stack and process), the careers "how to apply" page.
   Teaches: mapping who works where, reading routine from public notes, what vacancies leak.
2. **Social media** (Ch. 5): in-world profiles with posts that leak the human details that make a
   spear-phish land: a new starter, a colleague "showing me the ropes", a backlog of CVs, "sorting my
   payslip on the staff portal". Teaches how ordinary posts become attack material.
3. **Public documents** (Ch. 5): a published PDF or spreadsheet whose **metadata** (author, software,
   internal path) leaks the username convention. Teaches document metadata as intel.
4. **Tools panel** (Ch. 6): simulated results from the tools named below, reached by picking an entry
   from a list (see Picked lookups). Models what theHarvester, Hunter and Recon-ng return. Breach-data
   lookups, if a scenario wants one, are a distinct entry ("this handle appears in a known breach list"),
   not conflated with enumeration.

### Picked lookups (replaces a typed search box)

The tools panel offers **one entry per thing the player could sensibly look up**, built from what they
have already seen: a name from the team page, a handle from a profile, the company domain. An entry
appears once its `unlockedBy` condition holds (a page has been visited, or a named fact is held). The
player picks an entry and reads its authored result list; selecting a result block collects its fact, as
anywhere else. Some entries are decoys that return nothing useful ("No public results for this handle"),
so picking is a judgement, not a click-through.

- **Hunter lookup on `accountingnow.example`** returns the pattern most staff addresses follow. Its
  result grants `email_pattern`, the single award path for that fact. The team page also shows the
  published addresses, because a real directory does; seeing them is not a grant.
- **A name search for "J. Baker"** (theHarvester or Recon-ng style) returns two entries on purpose, Jed
  Baker of AccountingNow and a namesake elsewhere, so the player must use the company site to decide.
  Selecting the namesake grants the `stale` fact `baker_namesake`; selecting the right entry grants
  nothing new and the result says why it matched (same employer, same role). OSINT is messy, which is
  the lesson, and the stale fact gives `05`/`04` something wrong to hold (`00` §1, "stale").
- No tool is runnable and none connects anywhere. The learning is what each would return, why that
  matters, and the defensive takeaway.

### Tool framing (model, don't weaponise)

Real tools are named with a one-line "what it does" on a concept card: **theHarvester** (emails,
subdomains and names from public sources), **Hunter** (address patterns for a domain), **Recon-ng** (a
framework that automates the above), **Maltego** (link-analysis graphs of people and organisations). The
card is shown beside the lookup that models it. Cards are shared content with `07` N7. In the student lab,
one card per layer is enough (the lab's time budget is in `10`); the other tools are one-line mentions.

### Document metadata

A `document` site has a properties panel listing authored `fields` (author, software, path, created,
last-saved-by). Each field is a selectable row. Selecting one shows what it gives an attacker ("The author
field is the staff member's username, `mpierce`. Usernames often follow a convention.") and, for the field
that carries a fact, collects it. This replaces the old typed metadata prompts: the player decides which
field matters by selecting it.

## Worked example: the flagship chain

Player reads the team page and selects Melanie's row (`pierce_role`). They run the Hunter lookup and
select the pattern (`email_pattern`). They read Melanie's post ("First week in the finance team, Jed's
showing me the ropes!") and select it (`pierce_trusts_jed`). They find the team note ("Jed: I'll send Mel
the Q3 balance sheet on Friday") and select it (`pierce_expects_balance_sheet`). Those four are exactly
Pierce's recon prerequisites in `00` §4, so the case file flips her card to "Ready to approach". Each
fact also supplies blank values: `pierce_role` gives her name forms, `pierce_expects_balance_sheet` gives
the document, Jed's name and "Friday", and `email_pattern` lets the composer build `j.baker@…` once a
sender name is held (`00` §1, "Typed intel fact schema").

## Scenario-authored data

Facts are **not** defined here. `social.intelFacts` (`00` §1) holds each fact's text, subject, source,
`provides` and `reduceNote`. The OSINT block only says where each is found, by id:

```jsonc
"social": { "osint": {
  "profile": "student",                       // student | awareness | mission; picks layers and cards
  "sites": [
    { "id": "company", "url": "accountingnow.example", "type": "company-site",
      "pages": [
        { "id": "team", "title": "Our Team", "blocks": [
            { "id": "row_pierce", "kind": "staff", "person": "pierce", "name": "Melanie Pierce",
              "role": "Finance", "address": "m.pierce@accountingnow.example", "fact": "pierce_role" },
            { "id": "row_baker",   "kind": "staff", "person": "baker", "name": "Jed Baker",
              "role": "Finance", "address": "j.baker@accountingnow.example" },
            { "id": "row_hampshire", "kind": "staff", "person": "hampshire", "name": "Chris Hampshire",
              "role": "Careers/HR", "address": "careers@accountingnow.example" },
            { "id": "row_lord",    "kind": "staff", "person": "lord", "name": "Sofia Lord",
              "role": "Intern", "address": "s.lord@accountingnow.example", "fact": "lord_intern" } ] },
        { "id": "notes", "title": "Team notes", "blocks": [
            { "id": "note_q3", "kind": "p", "text": "Jed: I'll send Mel the Q3 balance sheet on Friday.",
              "fact": "pierce_expects_balance_sheet" },
            { "id": "note_lunch", "kind": "p", "text": "Friday lunch is in the kitchen, bring a plate." } ] },
        { "id": "careers", "title": "Careers", "blocks": [
            { "id": "careers_inbox", "kind": "p", "text": "Send your CV to careers@accountingnow.example. We read every one.",
              "fact": "hampshire_careers" },
            { "id": "careers_stack", "kind": "p", "text": "You will use Xero and Office 365.", "fact": "tech_stack" } ] },
        { "id": "apply", "title": "How to apply", "blocks": [
            { "id": "apply_format", "kind": "p", "text": "We accept .odt and .docx only.", "fact": "careers_attachment" } ] } ] },
    { "id": "social", "url": "friendface.example", "type": "social",
      "profiles": [
        { "person": "pierce", "posts": [
            { "id": "post_pierce_jed", "text": "First week in the finance team. Jed's showing me the ropes!",
              "fact": "pierce_trusts_jed" } ] },
        { "person": "lord", "posts": [
            { "id": "post_lord_payslip", "text": "Intern life! Finally sorting my payslip on the staff portal.",
              "fact": "lord_portal" } ] },
        { "person": "hampshire", "showIf": "se_intel_hampshire_careers", "posts": [
            { "id": "post_hampshire_cvs", "text": "So many CVs to get through before Friday.",
              "fact": "hampshire_cv_backlog" } ] } ] },
    { "id": "deck", "url": "accountingnow.example/Q3.pdf", "type": "document",
      "fields": [
        { "id": "f_author", "label": "Author", "value": "mpierce", "fact": "username_convention" },
        { "id": "f_software", "label": "Software", "value": "Microsoft Excel" },
        { "id": "f_path", "label": "Path", "value": "C:\\Users\\mpierce\\Documents" } ] }
  ],
  "tools": [
    { "id": "hunter", "label": "Hunter lookup: accountingnow.example", "card": "tool_hunter",
      "unlockedBy": { "visited": "team" },
      "results": [ { "id": "r_pattern", "text": "Most addresses follow first-initial.surname@accountingnow.example",
                     "fact": "email_pattern" } ] },
    { "id": "name_baker", "label": "Name search: J. Baker", "card": "tool_harvester",
      "unlockedBy": { "visited": "team" },
      "results": [ { "id": "r_jed", "text": "J. Baker, Finance, accountingnow.example" },
                   { "id": "r_namesake", "text": "J. Baker, Plumbing, Leeds", "fact": "baker_namesake" } ] },
    { "id": "name_pierce_decoy", "label": "Handle search: @mpierce_official", "card": "tool_recon",
      "unlockedBy": { "visited": "deck" },
      "results": [] }
  ]
} }
```

- A block's `fact` is the one award path for that fact. `showIf` names a global and works on blocks and
  profiles, as in the forensic data platform's block renderer; here it hides Chris Hampshire's profile
  until the careers page has been read, so the discovery order follows the story.
- `baker_namesake` (and the "stale org chart" `00` §1 mentions) are decoy facts the scenario authors
  into `social.intelFacts` with `kind: "stale"` entries. They are scenario-local and need declaring like
  any other fact (see Unresolved at the end of this doc).
- Which blocks exist, the page text, and the `url` strings are content only; they never carry values the
  engine compares. Domain, address and metadata strings render raw (not through `displayDashes`; see N9).
- Everything in this block reaches the browser unfiltered (`00` §11). That is acceptable for the lab.

### Where every backing fact is found

Every recon-fed factor in `00` §4 has its backing fact reachable here, or by the call.

| Fact | Granted by | Backs |
|------|-----------|-------|
| `email_pattern` | Hunter lookup result | `senderTrust` (address built from a held name) |
| `pierce_role` | team page, Pierce row | `addressedTo` name forms; Pierce card |
| `pierce_trusts_jed` | Pierce's post | `senderTrust` (Pierce) |
| `pierce_expects_balance_sheet` | team note | `pretextRelevant`, `attachmentPlausible` (Pierce) |
| `hampshire_careers` | careers page | `senderTrust` (open inbox) |
| `hampshire_cv_backlog` | Chris's post | `pretextRelevant` (Hampshire) |
| `careers_attachment` | how-to-apply page | `attachmentPlausible` (Hampshire) |
| `tech_stack` | careers page | flavour; not a prerequisite |
| `lord_intern` | team page, Lord row | Lord's name forms; Lord card |
| `lord_portal` | Sofia's post | Lord readiness; what to clone (`07`) |
| `username_convention` | document author field | lab teaching only |
| `lord_portal_name`, `lord_payslip_date`, `lord_trusts_portal_sender` | the pretext call (`06`) | `linkCredible`, `pretextRelevant`, `senderTrust` (Lord) |

## Engine wiring

New component `public/break_escape/js/minigames/osint-browser/`. It needs the full wiring checklist in
README Conventions, listed here with this component's names so nothing is missed:

- `export`, `import` and `registerScene('osint-browser', …)` in `minigames/index.js` (three places).
- A starter in `systems/minigame-starters.js`, exposed as `window.startOsintBrowser`.
- A branch in `systems/interactions.js` for the workstation object type (for example `osint-workstation`),
  like the siem and command-board branches there; a sprite `assets/objects/osint-workstation.png`.
- A stylesheet linked in `app/views/break_escape/games/show.html.erb`.
- No `requiresKeyboardInput`: nothing is typed, so game keys are left alone. If a scenario ever adds a
  text field, set it and follow the Esc rule below.
- Validator keys and schema (N8): `social.osint` under the `social` top-level key (`00` §11, S11), and a
  `minigameData` schema entry for the workstation object.

The object carries only a pointer: `minigameData: { siteIds?: [...] }` (new, optional; it limits a
workstation to some sites, for example the careers-only terminal). Without it the browser shows every
site in `social.osint`.

### Collecting a fact, and persistence

`grantFact(id)` (N2, one function in `systems/`, shared with `06`'s `grants.intel`) does all of this, and
only on the false-to-true flip:

1. Sets `se_intel_<id>` through the shared global writer (`00` S3; today
   `applyActions({type:'set_global'})` in `systems/apply-actions.js`, which patches
   `gameState.globalVariables` and emits `global_variable_changed:se_intel_<id>`). The shared writer
   also broadcasts to cached ink stories, so a conversation already open sees it.
2. Adds the fact as a note with `window.addNote(title, text, important)` (`minigames/notes/notes-minigame.js`):
   title "Evidence: <subject>", text the fact's `text`. `addNote` de-duplicates by title and text, so a
   repeat collect is harmless. `gameState.notes` already syncs (`state-sync.js`, `buildPlayerSections`)
   and restores (`core/game.js`), so the player gets a searchable evidence log with no new persistence.
3. Calls `window.stateSync?.sync()` so a reload straight after a collect loses nothing.

Visited pages (needed for `unlockedBy`) are kept as ids in one object, `se_osint_state`
(`{ visited: [...] }`), a global under the `globalVariables[STATE_KEY]` pattern the SIEM minigame uses
(`siem-dashboard-minigame.js`). It is declared in `globalVariables` with default `{}`. It is not an ink
variable, so it never syncs to a story. Keep it ids-only; the 60 KB `pagehide` flush shares one budget with
every other global (`state-sync.js`).

Every `se_intel_<id>` is declared in the scenario's `globalVariables` with default `false` (`00` §5); the
validator derives the list from `social.intelFacts` and checks it.

### Closing, Esc and the case file

Closing the browser is a normal exit. The scene sets `gameResult = { collected: [...], visited: [...] }`
and calls `complete(true)`, so a close never emits `minigame_failed` (`base-minigame.js` `complete`).
`BaseMinigame.start()` binds a document-level Escape that calls `complete(false)`; the browser passes
`disableClose: true` and binds its own Escape that calls the same close. Scenarios drive tasks off the
`se_intel_*` globals, not off this event.

A "Case file" button opens the intel board (`03`). Only one minigame runs at a time, and
`MinigameFramework.startMinigame` ends the running one first (`minigames/framework/minigame-manager.js`),
so the button uses the nested-launch convention in README Conventions: the browser's state is already in
its globals, the launch passes `returnTo: { sceneType: 'osint-browser', params }`, and the board's close
reopens the browser. The composer (`01`) does not open the board at all; it reads the `se_intel_*` globals
inline.

### Reuse

- **Block renderer.** `minigames/forensic-data-platform/forensic-data-platform-minigame.js` already renders
  typed blocks (`p`, `list`, `document-excerpt`, `callout`, `timeline`, `log-table`) with `showIf`. Copy that
  renderer's block set for page bodies rather than writing a second one; the staff, post and result kinds
  are the new ones. Authored text is set with `textContent` or an `escapeHtml` helper
  (`blockchain-explorer-minigame.js`), never `innerHTML`, so a domain or handle cannot inject markup.
- **Evidence log.** `window.addNote`, above.
- **Markdown.** `utils/note-markdown.js` (`renderNoteMarkdown`) escapes input and renders headings, bold,
  lists and tables, but has no links or images. Use it for long bodies if wanted; clickable links are new.
  Only `notes` renders markdown; `text-file` and `examine` do not, so they supply panel chrome only.
- **Seeded picker.** `minigames/log-filter/` is a reference for list filtering UI; nothing is typed here, so
  borrow the list styling only.

### New engine work

| # | Item | Where in code |
|---|------|---------------|
| N1 | `osint-browser` overlay: sites strip, display-only address bar, page renderer (company, social, document, tools), selectable blocks, properties panel. The wiring checklist above | new `minigames/osint-browser/`; `index.js`; `minigame-starters.js`; `systems/interactions.js`; `show.html.erb` |
| N2 | `grantFact(id)`: shared writer (`00` S3), note, sync, flip-only; used by 02 and by `06` grants | new `systems/social-intel.js`; `systems/apply-actions.js` `set_global`; `notes-minigame.js` `window.addNote` |
| N3 | Document properties view with selectable fields | in N1 |
| N4 | Tools panel: picked lookups with `unlockedBy`, decoy entries, result blocks | in N1 |
| N5 | Close as a normal exit, own Escape, nested launch to the case file with return-to (README engine table, "Minigame framework") | `minigames/framework/base-minigame.js` (`disableClose`), `minigame-manager.js` |
| N6 | Cast headshots: each of `pierce`, `baker`, `hampshire`, `lord` needs a sprite key and a `<key>_headshot.png` (32x32); profile images fall back to `<key>_talk.png` frame 0. Site images live under `assets/osint/<scenario>/` | `public/break_escape/assets/characters/`; path built as in `ui/hud.js`; `person-chat-portraits.js` fallback |
| N7 | Bundled readable sans-serif for page text and the address bar (README engine table, "Fonts and CSS"), plus authored domains rendered raw | `public/break_escape/assets/fonts/`; `css/fonts.css`; `utils/display-dashes.js` bypass |
| N8 | Validator: every fact (bar the call-granted ones) is granted by exactly one element; every `fact` and `showIf` resolves; every `se_intel_*` declared; domain and address strings end `.example`; `social.osint` schema and the `minigameData` entry | `scripts/validate_scenario.rb` (`known_top_level`); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json` (S11) |
| N9 | Test: a string with `--` (an `xn--` label) displays unchanged in the address bar | `test/js/` |

## Accessibility and small screens

- A single column below about 700 px. The sites strip becomes a vertical list of buttons; the tools panel
  becomes a section under the page. Nothing depends on hover.
- Every selectable block is a button reachable by Tab and Enter. Its accessible name is the block text,
  with "Add to notes" as the description. Links are real links in the page body, in tab order.
- A visually hidden `aria-live="polite"` region announces "Noted: <fact text>" and "Nothing here you can
  use". The visible confirmation always carries words, not just a tick or colour.
- No motion under `prefers-reduced-motion`: the "noted" flourish becomes a static highlight.
- Teaching text on concept cards is behind a visible "What is this?" button as well as hover.
- Touch targets are at least 44 px. Pixel images have `alt` text; purely decorative ones are `aria-hidden`.
- Page text is real DOM text, so screen readers, zoom and selection all work. The playtest bridge
  (`systems/test-bridge/`) can drive the blocks as ordinary buttons.

## Reuse across audiences

- **Student lab:** all four layers, document metadata, the ambiguous search, a concept card per layer.
  The lab's session length (about 75 minutes, `10`) limits how many sites and decoys it ships.
- **Awareness:** company site and social only, fewer facts, no tools panel; the lesson is "look how much
  is public".
- **Eldritch Hacker:** a couple of sources gating one pretext; the handler points the player at them in
  dialogue. The layers re-skin (a members' forum in place of a staff page). `showIf` does the gating.

## Assets

- Browser chrome, page layouts and a profile template as pixel UI (PixelLab-first, none generated yet);
  small favicons per site; a properties-panel frame.
- Staff and profile pictures: the existing headshot pipeline (32x32 `<key>_headshot.png`, shown at integer
  scale with `image-rendering: pixelated`). The cast are new characters, so each needs its own sprite key,
  including `baker`, who is not an NPC but appears on profiles and sender cards. Headshots are cut from the
  walk sprite and can be stale, so check each after art changes.

## Visual style (decided 2026-10-20)

- Overlay chrome follows house style (README Conventions): dark panel, square corners, colours from the
  `--ui-*` tokens in `css/ui-themes.css` so the mission's `ui_theme` applies, `GNF` body font, `Press
  Start 2P` for headings. Nothing is hard-coded green.
- In-world pictures (logos, banners, product photos, headshots) are pixel art.
- Text the player must read or compare is **inert DOM text in a readable sans-serif, not a pixel font**:
  the address bar, document metadata, bios, posts and body text. The sans-serif is a bundled, self-hosted
  face with clearly different `l`, `I`, `1` and `rn`/`m` (N7; none is bundled today, and the game's
  existing fonts are `GNF`, `Pixelify Sans` and `Press Start 2P`). Without a bundled face the text would
  take whatever the player's operating system supplies and look-alike domains would not behave as in a
  real browser.
- Real tools (CyberChef, a terminal) keep their own real look.

## Open questions

- OQ1 (resolved): the derive-the-pattern step is gone. Sofia's address is on the team page, so there was
  nothing to derive; `email_pattern` is collected from the Hunter lookup instead.
- OQ2: simulate partial or rate-limited tool output? Default: clean for awareness, one ambiguous result
  (the two J. Bakers) in the lab.
- OQ3: real-staff OSINT stays out of scope; fictional targets only.
- OQ4: how many decoy blocks per page before selecting becomes tedious? Default: roughly one decoy to
  every useful block; tune in playtest.

## Unresolved against `00`

- `baker_namesake` and a stale org-chart fact are scenario-authored `stale` facts that `00` §1 mentions
  in prose but does not list as ids. They belong in the `00` §1 fact table (or are declared per scenario).
- `minigameData.siteIds` is not in `00` §11's list of pointers (`mailboxId`, `accountIds`, `triageSetId`,
  `landingPageId`, `callId`). Add it, or drop it and ship one dataset per scenario.
- `00` §1 lists `lord_intern` as found on "social + team page". This doc grants it from the team page only,
  because a fact has one award path; `00` should say so.
