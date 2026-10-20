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
6. Close the browser with its own visible Close control (or Esc). Closing is a normal exit, and the case
   file (`03`) shows what is still missing; its readiness already updated as each fact was collected.

There is **no typed input anywhere in this browser.** No search box, no pattern prompt, no free-text
answer. What a player can do is read, follow a link, select a block, or pick from a short authored list.
That keeps the browser consistent with composing from templates with blanks (`00` §10): the player earns
facts by finding them, and a fact then supplies the blank values they can use later.

### One award path per fact

Each fact in `social.intelFacts` is granted by **exactly one** element of the OSINT data: one block, one
search result, one lookup result or one metadata field. That element's own id (the block, post, result or
field id, never its page or site id) is the fact's `source` (`00` §1): `row_pierce`, `note_q3`,
`post_pierce_jed`, `r_pattern`, `f_author`, `org_old_chart`. No fact is also granted by merely viewing a page, and a page carries no `intel`
array of its own. A fact that the player sees on two pages is granted by the one that the author
names; the second page shows the same words as unmarked text. The validator checks this (N8).

Facts that arrive by a pretext call (`lord_portal_name`, `lord_payslip_date`, `lord_trusts_portal_sender`)
are granted by `06`, not here, and the validator excludes them from the "granted exactly once here" rule.
A fact can also be granted by a **mail highlight** (`01`, `00` §10a): a marked span in a seeded message on a
found device, whose id is the fact's `source`. The validator excludes those facts from the "granted
exactly once here" rule in the same way and checks that each is granted by exactly one highlight.
All three paths call the same function (N2), so a fact looks the same however it arrives.

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

The company site also keeps an **Archive** page (linked from the footer of every company page) holding an
old organisation chart. It is a deliberately out-of-date source: selecting it grants the `stale` fact
`old_org_chart`, which gives the composer a wrong manager and a wrong team to choose between (`00` §1).

### Picked lookups

The tools panel offers **one entry per thing the player could sensibly look up**, built from what they
have already seen: a name from the team page, a handle from a profile, the company domain. An entry
appears once its `unlockedBy` condition holds: `{ "visited": "<siteId>" | "<siteId>.<pageId>" }` when a
page has been visited, or `{ "fact": "<factId>" }` when a named fact is held (read from its `se_intel_*`
global). An entry with no `unlockedBy` is always listed. The
player picks an entry and reads its authored result list; selecting a result block collects its fact, as
anywhere else. Some entries are decoys that return nothing useful ("No public results for this handle"),
so picking is a judgement, not a click-through.

- **Hunter lookup on `accountingnow.example`** returns the pattern most staff addresses follow. Its
  result grants `email_pattern`, the single award path for that fact. The team page also shows the
  published addresses, because a real directory does; seeing them is not a grant.
- **A name search for "J. Baker"** (theHarvester or Recon-ng style) returns two entries on purpose, Jed
  Baker of AccountingNow and a namesake in Leeds (`leeds_baker`, `00` §1), so the player must use the
  company site to decide. Selecting the namesake result `r_namesake` grants the `stale` fact
  `baker_namesake`; selecting the right entry (`r_jed`) grants
  nothing new and the result says why it matched (same employer, same role). OSINT is messy, which is
  the lesson, and the stale fact gives `05`/`04` something wrong to hold (`00` §1, "stale").
- No tool is runnable and none connects anywhere. The learning is what each would return, why that
  matters, and the defensive takeaway.

### Tool framing (model, don't weaponise)

Real tools are named with a one-line "what it does" on a concept card: **theHarvester** (emails,
subdomains and names from public sources), **Hunter** (address patterns for a domain), **Recon-ng** (a
framework that automates the above), **Maltego** (link-analysis graphs of people and organisations). The
card is shown beside the lookup that models it, behind a visible "What is this?" button: `tool_hunter`
(the Hunter lookup), `tool_harvester` (the name search), `tool_recon` (the handle search) and
`tool_exiftool` (the document properties panel; **exiftool** reads the metadata a file carries). These
four are the only concept cards in the OSINT stage; `10` shows no separate wall notes for them.

**Where cards live.** A `card` value is an id into `social.conceptCards[] { id, title, text, image? }`
(`00` §11), a plain-text collection shared with `07`'s cards (`07` N7). The text is authored prose that may
name the real tool; it is the only field the brand denylist exempts (`07` §1), and it holds no domain other
than a `.example` one. Real product names elsewhere in this data (`Microsoft Excel` in a metadata field,
`Xero` and `Office 365` on the careers page) are generic software names in prose, not domains; the lint
does not read them (`07` §1). One shared card renderer shows a card (title, text, optional pixel image) behind the
"What is this?" button; N1 builds it and `07` N7 reuses it. The validator (N8) checks that every `card`
id resolves.

### Document metadata

A `document` site has a properties panel listing authored `fields` (author, software, path, created,
last-saved-by). Each field is a selectable row. Selecting one shows what it gives an attacker ("The author
field is the staff member's username, `mpierce`. Usernames often follow a convention.") and, for the field
that carries a fact, collects it. The player decides which field matters by selecting it; there are no
prompts to answer. The panel carries the `tool_exiftool` card.

## Worked example: the flagship chain

Player reads the team page and selects Melanie's row (`pierce_role`). They run the Hunter lookup and
select the pattern (`email_pattern`). They read Melanie's post ("First week in the finance team, Jed's
showing me the ropes!") and select it (`pierce_trusts_jed`). They find the team note ("Jed: I'll send Mel
the Q3 balance sheet on Friday") and select it (`pierce_expects_balance_sheet`). Those four facts fill
Pierce's three readiness slots in `00` §4 (who she is, who she trusts, what she expects). The moment the
last one is granted, `grantFact` runs `evaluateReadiness` and sets `target_ready_pierce`; the case file
only displays it, so a player who never opens the board still advances. Each
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
        { "id": "archive", "title": "Archive", "blocks": [
            { "id": "org_old_chart", "kind": "p",
              "text": "Organisation chart (2019): Jed Baker manages the team. Interns sit in Accounts.",
              "fact": "old_org_chart" } ] },
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
    { "id": "deck", "url": "accountingnow.example/Q3.pdf", "type": "document", "card": "tool_exiftool",
      "fields": [
        { "id": "f_author", "label": "Author", "value": "mpierce", "fact": "username_convention" },
        { "id": "f_software", "label": "Software", "value": "Microsoft Excel" },
        { "id": "f_path", "label": "Path", "value": "C:\\Users\\mpierce\\Documents" } ] }
  ],
  "tools": [
    { "id": "hunter", "label": "Hunter lookup: accountingnow.example", "card": "tool_hunter",
      "unlockedBy": { "visited": "company.team" },
      "results": [ { "id": "r_pattern", "text": "Most addresses follow first-initial.surname@accountingnow.example",
                     "fact": "email_pattern" } ] },
    { "id": "name_baker", "label": "Name search: J. Baker", "card": "tool_harvester",
      "unlockedBy": { "visited": "company.team" },
      "results": [ { "id": "r_jed", "text": "J. Baker, Finance, accountingnow.example" },
                   { "id": "r_namesake", "text": "J. Baker, Plumbing, Leeds", "fact": "baker_namesake" } ] },
    { "id": "name_pierce_decoy", "label": "Handle search: @mpierce_official", "card": "tool_recon",
      "unlockedBy": { "visited": "deck" },
      "results": [] }
  ]
} }
```

- A block's `fact` is the one award path for that fact. `showIf` names a global. The forensic data
  platform's renderer supports it on blocks only; applying it to a profile (as here, hiding Chris
  Hampshire's profile until the careers inbox block `careers_inbox` has been selected, which grants
  `hampshire_careers`) is new work in N1, so the discovery order
  follows the story.
- `unlockedBy.visited` takes either a site id (`"deck"`) or `siteId.pageId` (`"company.team"`), so the two
  namespaces never mix. `se_osint_state.visited` stores the same strings.
- `baker_namesake` (result `r_namesake`) and `old_org_chart` (block `org_old_chart` on the company site's
  archive page) are the two `stale` facts defined in `00` §1 and its `provides` table. They are declared
  in `social.intelFacts` like any other fact.
- Which blocks exist, the page text, and the `url` strings are content only; they never carry values the
  engine compares. Domain, address and metadata strings render raw (not through `displayDashes`; see N9).
- Everything in this block reaches the browser unfiltered (`00` §11). That is acceptable for the lab.

### Where every backing fact is found

Every recon-fed factor in `00` §4 has its backing fact reachable here, or by the call.

| Fact | Granted by (element id) | Backs |
|------|-----------|-------|
| `email_pattern` | `r_pattern`, the Hunter lookup result | `senderTrust` (address built from a held name) |
| `pierce_role` | `row_pierce`, team page | `addressedTo` name forms; Pierce card |
| `pierce_trusts_jed` | `post_pierce_jed`, Pierce's post | `senderTrust` (Pierce) |
| `pierce_expects_balance_sheet` | `note_q3`, team note | `pretextRelevant`, `attachmentPlausible` (Pierce) |
| `hampshire_careers` | `careers_inbox`, careers page | `senderTrust` (open inbox) |
| `hampshire_cv_backlog` | `post_hampshire_cvs`, Chris's post | `pretextRelevant` (Hampshire) |
| `careers_attachment` | `apply_format`, how-to-apply page | `attachmentPlausible` (Hampshire) |
| `tech_stack` | `careers_stack`, careers page | flavour; not a prerequisite |
| `lord_intern` | `row_lord`, team page | Lord's name forms; Lord card |
| `lord_portal` | `post_lord_payslip`, Sofia's post | Lord readiness; what to clone (`07`) |
| `username_convention` | `f_author`, document author field | lab teaching only; in no readiness slot |
| `baker_namesake` (stale) | `r_namesake`, name search | none; a wrong sender option |
| `old_org_chart` (stale) | `org_old_chart`, archive page | none; a wrong manager and team |
| `lord_portal_name`, `lord_payslip_date`, `lord_trusts_portal_sender` | `portal_name`, `payslip_date` (the pretext call, `06`) | `linkCredible`, `pretextRelevant`, `senderTrust` (Lord) |

## Engine wiring

New component `public/break_escape/js/minigames/osint-browser/`. It needs the full wiring checklist in
README Conventions, listed here with this component's names so nothing is missed:

- `export`, `import` and `registerScene('osint-browser', …)` in `minigames/index.js` (three places).
- A starter in `systems/minigame-starters.js`, exposed as `window.startOsintBrowser`.
- A branch in `systems/interactions.js` for the workstation object type (for example `osint-workstation`),
  like the siem and command-board branches there; a sprite `assets/objects/osint-workstation.png`, and a
  `this.load.image('osint-workstation', 'objects/osint-workstation.png')` line in `core/game.js` `preload()`. Object sprites are created from a base key that only a hard-coded preload line guarantees; without it the object renders as Phaser's missing-texture box, and the validator's PNG-exists check does not catch that.
- A stylesheet linked in `app/views/break_escape/games/show.html.erb`.
- `requiresKeyboardInput: true` in the starter's params. The overlay is operated by Tab, Enter, Space and
  arrow keys, and the player controller's document-level `keydown` handler would otherwise jump on Space,
  call `tryInteractWithNearest()` on `E` (which can open another object's minigame) and swallow the
  arrows; the flag pauses it (`core/player.js:279-330`, `keyboardPaused`;
  `minigames/framework/minigame-manager.js:37-45`). Add a test-bridge check that Space and `E` do
  nothing while the browser is open (`00` §6, "Overlay rules").
- Validator keys and schema (N8): `social.osint` under the `social` top-level key (`00` §11, S11), and a
  `minigameData` schema entry for the workstation object.

The object carries only a pointer: `minigameData: { siteIds: [...] }` (`00` §11; it limits a workstation
to some sites, for example the careers-only terminal). Without it the browser shows every site in
`social.osint`.

### Collecting a fact, and persistence

`grantFact(id)` (N2, one function in `systems/`, shared with `06`'s `grants.intel`) does all of this, and
only on the false-to-true flip:

1. Sets `se_intel_<id>` through the shared global writer (`00` S3). `applyActions({type:'set_global'})`
   (`systems/apply-actions.js:33-43`) emits on every call and has no flourish; `grantFact` is the
   flip-only wrapper that adds both. The shared writer also broadcasts to cached ink stories, so a
   conversation already open sees it.
2. Adds the fact as a note with `window.addNote(title, text, important)` (`minigames/notes/notes-minigame.js`):
   title "Evidence: <subject>", text the fact's `text`. The subject shown follows the one naming rule in `03` (People cards): the person's display name if the
   player holds a name form for them or holds any fact with that person as its `subject`, **counting the
   fact being granted now**; otherwise it is a
   neutral label ("a colleague", "the company"), never the cast id. `addNote` de-duplicates by title and
   text, so a repeat collect is harmless. `addNote` gives each note `id: Date.now()` and the sync merges
   notes by `id`, so several facts granted in one synchronous run (the call grants three) would collide
   and lose notes; N2 changes `addNote` to build ids from the timestamp plus a counter. `gameState.notes` already syncs (`state-sync.js`, `buildPlayerSections`)
   and restores (`core/game.js`), so the player gets a searchable evidence log with no new persistence.
3. Calls `window.stateSync?.sync()` so a reload straight after a collect loses nothing.
4. Runs `evaluateReadiness(readinessSlots, globals)` (`00` §4, in `systems/social-intel.js`), which sets
   `target_ready_<id>` on each false-to-true flip and `osint_done` when every id in
   `intelBoard.people` is ready. Readiness is therefore set where the facts are granted, with no
   dependency on the board having been opened. The pretext call grants (`06`) call the same function.

Visited sites and pages (needed for `unlockedBy`) are kept as ids in one object, `se_osint_state`
(`{ visited: ["company", "company.team", ...] }`), a global under the `globalVariables[STATE_KEY]` pattern the SIEM minigame uses
(`siem-dashboard-minigame.js`). It is declared in `globalVariables` with default `{}`. It is not an ink
variable, so it never syncs to a story. Keep it ids-only; the 60 KB `pagehide` flush shares one budget with
every other global (`state-sync.js`).

Every `se_intel_<id>` is declared in the scenario's `globalVariables` with default `false` (`00` §5); the
validator derives the list from `social.intelFacts` and checks it.

### Closing, Esc and the case file

Closing the browser is a normal exit. The scene sets `gameResult = { collected: [...], visited: [...] }`
and calls `complete(true)`, so a close never emits `minigame_failed` (`base-minigame.js` `complete`).
`BaseMinigame.start()` binds a document-level Escape that calls `complete(false)`, and `disableClose:
true` hides the framework's close button as well as that handler (`base-minigame.js:18-23, 70-80`). The
browser passes `disableClose: true`, draws its own visible **Close** control (touch players have no Esc)
and binds its own Escape, in the capture phase, to the same close. Scenarios drive tasks off the
`se_intel_*` globals, not off this event.

A "Case file" button opens the intel board (`03`). Only one minigame runs at a time, and
`MinigameFramework.startMinigame` ends the running one first (`minigames/framework/minigame-manager.js`),
so the button uses engine item S12 (`00` §12, "Return to"): the browser's state is already in
`se_osint_state` and the `se_intel_*` globals, it sets `suspended: true` in its params so its `onComplete`
ignores the `onComplete(false, null)` that `startMinigame` fires, and it launches the board with
`{ mode: 'recon', returnTo: { sceneType: 'osint-browser', params } }`. The board's close reopens the
browser. The composer (`01`) does not open the board at all; it reads the `se_intel_*` globals inline.

### Reuse

- **Block renderer.** `minigames/forensic-data-platform/forensic-data-platform-minigame.js` already renders
  typed blocks (`p`, `list`, `document-excerpt`, `callout`, `timeline`, `log-table`) with `showIf`. Copy that
  renderer's block set for page bodies rather than writing a second one, but not its `p` case, which
  renders `block.html` through `displayDashes` (line 106); authored domains must not. The staff, post
  and result kinds are the new ones. Authored text is set with `textContent`, or with a one-line
  escaper copied into the new module (`escapeHtml` in `blockchain-explorer-minigame.js:4` is
  module-local, and the `escapeText` helper beside it (line 14) runs `displayDashes`), never `innerHTML`, so a
  domain or handle cannot inject markup.
- **Evidence log.** `window.addNote`, above.
- **Markdown.** `utils/note-markdown.js` (`renderNoteMarkdown`) escapes input and renders headings, bold,
  lists and tables, but has no links or images. Use it for long bodies if wanted; clickable links are new.
  Only `notes` renders markdown; `text-file` and `examine` do not, so they supply panel chrome only.
- **Seeded picker.** `minigames/log-filter/` is a reference for list filtering UI; nothing is typed here, so
  borrow the list styling only.

### New engine work

| # | Item | Where in code |
|---|------|---------------|
| N1 | `osint-browser` overlay: sites strip, display-only address bar, page renderer (company, social, document, tools), selectable blocks, properties panel, profile-level `showIf`, the shared concept-card renderer (also used by `07` N7), own Close control, `requiresKeyboardInput: true`. The wiring checklist above | new `minigames/osint-browser/`; `index.js`; `minigame-starters.js`; `systems/interactions.js`; `show.html.erb` |
| N2 | `grantFact(id)`: shared writer (`00` S3), note, sync, flip-only, then `evaluateReadiness` (sets `target_ready_<id>`, `osint_done`); used by 02 and by `06` grants | new `systems/social-intel.js`; `systems/apply-actions.js` `set_global`; `notes-minigame.js` `window.addNote` (unique note ids: timestamp plus counter). Unit test file `test/js/social-intel.test.mjs` (grant flip-only behaviour, naming rule, readiness), run by the CI glob in `07` N6 |
| N3 | Document properties view with selectable fields | in N1 |
| N4 | Tools panel: picked lookups with `unlockedBy`, decoy entries, result blocks | in N1 |
| N5 | Close as a normal exit, own Close control and Escape, nested launch to the case file with return-to (`00` S12) | `minigames/framework/base-minigame.js` (`disableClose`), `minigame-manager.js` |
| N6 | Cast headshots: each of `pierce`, `baker`, `hampshire`, `lord` needs a sprite key and a `<key>_headshot.png` (32x32). A headshot-to-`<key>_talk.png` fallback for profile images does not exist (`person-chat-portraits.js:913-916` falls back the other way, `_talk` to `_headshot`), so either every key ships a headshot or the reverse fallback is new work here. Site images live under `assets/osint/<scenario>/` | `public/break_escape/assets/characters/`; path built as in `ui/hud.js`; `person-chat-portraits.js` |
| N7 | Bundle Atkinson Hyperlegible Next, Latin and Cyrillic subsets, after the import check (`00` §6) and apply `--se-font-readable` to every string the browser shows that holds a domain, address, handle, file name or metadata field, wherever it appears (address bar, tools-panel labels such as "Hunter lookup: accountingnow.example", result lines, notes, confirmations); authored domains rendered raw | `public/break_escape/assets/fonts/`; `css/fonts.css`; `utils/display-dashes.js` bypass |
| N8 | Validator: every fact (bar the call-granted ones, and bar the mail-highlight-granted ones, which `01` N18 checks: each is granted by exactly one highlight whose id equals the fact's `source`) is granted by exactly one element and each `source` equals that element's id; every `fact` and `showIf` resolves; every `unlockedBy` is `{ visited }` (a site id or `siteId.pageId` that exists) or `{ fact }` (a declared fact id); every `card` id is in `social.conceptCards`; every `se_intel_*` declared; `se_osint_state` declared with default `{}`; every field on the single lint field list in `00` §11 that this block authors (`sites[].url`, staff-block and contact `address` values, `provides` `address` values) passes the lint rules in `07` §1 and N6 (host-only `.example`, ASCII, denylist); this item does not restate the field list or the rules, and the raw-label brand-word allowlist does not apply to site urls; `social.osint` schema and the `minigameData` entry | `scripts/validate_scenario.rb` (`known_top_level`); `scripts/scenario-schema.json`; `scripts/minigame-data-schemas.json` (S11) |
| N9 | Tests: the address-bar formatter (a pure function) returns the authored host as typed, with `--` (an `xn--` label) and any non-ASCII letter unchanged and never converted either way; clicking a page link leaves `window.location` unchanged and switches the displayed page (needs the DOM that `07` N3 supplies with `jsdom`). Both live in `test/js/social-osint-address-bar.test.mjs` and are run by the CI step in `00` S11 and `07` N6 (`bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs`) | `test/js/`; named in the CI step's `social-*` glob (`07` N6) |

## Accessibility and small screens

- A single column below about 700 px. The sites strip becomes a vertical list of buttons; the tools panel
  becomes a section under the page. Nothing depends on hover.
- Every selectable block is a button reachable by Tab and Enter, and the overlay has a visible Close button. Its accessible name is the block text,
  with "Add to notes" as the description. Links in a page body are focusable elements (`<a href="#">` whose click handler calls `preventDefault`, or
  `role="link"` buttons) in tab order. Activating one switches the page shown inside the overlay and
  never navigates: the authored URL is display text and no `href` carries it. A test (N9) clicks a link
  and checks that `window.location` is unchanged.
- A visually hidden `aria-live="polite"` region announces "Noted: <fact text>" and "Nothing here you can
  use". The visible confirmation always carries words, not just a tick or colour.
- No motion under `prefers-reduced-motion`: the "noted" flourish becomes a static highlight.
- Teaching text on concept cards is behind a visible "What is this?" button as well as hover.
- Touch targets are at least 44 px. Pixel images have `alt` text; purely decorative ones are `aria-hidden`.
- Page text is real DOM text, so screen readers, zoom and selection all work. The playtest bridge
  (`systems/test-bridge/`) can drive the blocks as ordinary buttons.

## Reuse across audiences

- **Student lab:** all four layers, document metadata, the ambiguous search, the archive page, the four concept cards.
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

## Visual style

- Overlay chrome follows house style (README Conventions): dark panel, square corners, colours from the
  `--ui-*` tokens in `css/ui-themes.css` so the mission's `ui_theme` applies, `GNF` body font, `Press
  Start 2P` for headings. Nothing is hard-coded green.
- In-world pictures (logos, banners, product photos, headshots) are pixel art.
- Text the player must read or compare is **inert DOM text in a readable sans-serif, not a pixel font**:
  the address bar, document metadata, bios, posts, body text, and any tools-panel label or result line
  that contains a domain, address or handle. The face is Atkinson Hyperlegible Next (`00` §6, N7), which keeps
  `l`, `I`, `1` and `rn`/`m` apart; the game's own fonts (`GNF`, `Press Start 2P`) stay on chrome labels
  and headings with no such string. Without a bundled face the text would take whatever the player's
  operating system supplies and look-alike domains would not behave as in a real browser. The bundled face covers Latin and Cyrillic (`00` §6), so a look-alike host the address bar is given (the lab's homograph reaches it through the page links of `07`, not through `sites[].url`, which stays ASCII under the lint) draws as typed; the punycode form may sit beside it as a teaching contrast.
- Real tools (CyberChef, a terminal) keep their own real look.

## Open questions

- OQ1: simulate partial or rate-limited tool output? Default: clean for awareness, one ambiguous result
  (the two J. Bakers) in the lab.
- OQ2: real-staff OSINT stays out of scope; fictional targets only.
- OQ3: how many decoy blocks per page before selecting becomes tedious? Default: roughly one decoy to
  every useful block; tune in playtest.
