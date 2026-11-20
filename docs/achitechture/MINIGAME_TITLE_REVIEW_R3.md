# Minigame title escaping: code review round 3

Scope: `git diff main...build/minigame-title`, reviewed fresh, without earlier review files.

Standing rule: author and server text is plain text (textContent, or escape exactly once).

## Verification done

- `node test/js/minigame-title-escape.test.mjs`: 16 of 16 pass.
- Mutation checks, run on a scratch copy of the engine: each test fails once its escape is removed again. That covers the base cancel text, the password label and device alt, the text-file type, the container avatar src and header, the phone contact avatar src, the lockpicking image src, the forensic title and the phone-chat header. Async container panels are awaited, and the phone-chat test reaches its own header (the base header does not mask it).
- Headless render on :3029, game 1283 (m01_first_contact):
  - A real NPC's person-chat header renders correctly ("Agent HaX").
  - The reception table, renamed to a hostile string and opened as a container, shows the name and observations as text in the header and panel. No injected element, no handler ran.
  - A notes item with a hostile observation ran its handler (Major 1).
  - The render pass for the phone and the text file was not finished, because the run was stopped.

## Blockers

None.

## Majors

1. `public/break_escape/js/minigames/notes/notes-minigame.js:141` and `:550`
   - **Problem:** `observationDiv.innerHTML = displayDashes(this.observationText)`, and the Save handler does the same with the text the player typed. Observations reach this sink from scenario data (`notes-minigame.js:41`). They also come from this branch's own minigames when the player picks "Add to Notepad":
     - the text-file observations, or `Text file "<fileName>" from <source>` (`text-file-minigame.js:319-320`);
     - `Contact list from <phone title>` (`phone-chat-minigame.js:1510`, `:1518`);
     - `Postit note found in <container name>` (`container-minigame.js:1139`).
   - **Effect:** a name this branch escapes in the minigame panel is rendered as HTML one click later. Confirmed live: a hostile observation set `window.__pwned = 1`.
   - **Fix:** set `observationDiv.textContent = displayDashes(...)` on both lines, and keep `white-space: pre-wrap` if line breaks matter. Keep the `<em>` placeholder as a separate branch built with DOM nodes. Add a jsdom test that hands a hostile `observationText` to `startNotesMinigame`.

2. `public/break_escape/js/minigames/phone-chat/phone-chat-ui.js:566`
   - **Problem:** `refreshLivePreview` writes `el.innerHTML = displayDashes(preview)`. This is the same `.contact-last-message` field that round 2 escaped in `createContactItem` (`:637`). For a contact with `livePreview: true`, the escaped preview is replaced, after the ink dry run, by raw ink text.
   - **Fix:** `el.textContent = displayDashes(preview);`. Add a test that calls `refreshLivePreview` with a stubbed `PhoneChatConversation.previewReopen` that returns `PREVIEW`.

3. `public/break_escape/js/minigames/password/password-minigame.js:323` and `:332`
   - **Problem:** `${this.gameData.passwordHint}` and `${this.gameData.postitNote}` reach the default password template raw. They come from scenario `passwordHint` and `postitNote` (`unlock-system.js:768`, `:772`; `doors.js:543`, `:545`).
   - **Inconsistency:** the sign-in path in the same file escapes the post-it (`:953`), and this branch edited the template these lines sit in.
   - **Safe to escape:** no scenario uses markup or entities in these fields (searched with grep).
   - **Fix:** `${escapeHtml(displayDashes(this.gameData.passwordHint))}` and `${escapeHtml(displayDashes(this.gameData.postitNote))}`. Add both fields to the "deviceImage path" test.

## Minors

1. `public/break_escape/js/minigames/phone-chat/phone-chat-ui.js:881`
   - **Problem:** the voice-message transcript (ink text) goes into `innerHTML`. Ordinary messages in the same function use `textContent`.
   - **Fix:** build `<strong>Transcript:</strong>` and a `<br>` as nodes, then `append(displayDashes(transcript))`.

2. `public/break_escape/js/minigames/container/container-item-image.js:51`
   - **Problem:** `containerImageHtml` escapes `alt` but writes `src="${url}"` raw. The URL comes from the texture key, the scenario `type`, or a tray `src`.
   - **Fix:** escape `url` with the same `&<>"'` helper. Escape `'` and `>` in `alt` too, so the helper matches the others.

3. `docs/IDEAS_BACKLOG.md` (the minigame title entry)
   - **Problem:** the list of remaining scenario-data sinks is incomplete. It leaves out:
     - `forensic-data-platform-minigame.js:191`: `caseRef`, which sits next to the escaped title;
     - `forensic-data-platform-minigame.js:54-110`: timeline, table, list and doc block fields;
     - `forensic-data-platform-minigame.js:184`: tab labels;
     - `network-segmentation-map-minigame.js:90-391`: zone labels, devices, auth labels, `claimRef` and `item.text`;
     - `network-architecture-minigame.js:134-256`: SVG labels and node details;
     - `siem-dashboard-minigame.js:520`: `alert.source` and `alert.description`.
   - **Fix:**
     - Add these to the entry.
     - Note that `c.html` and `block.html` in the forensic platform are rich text by design. They need a decision: either an allow-list, or conversion to plain text in the scenarios.

## Nits

1. `public/break_escape/js/minigames/person-chat/person-chat-minigame.js:199-200` and `phone-chat/phone-chat-minigame.js:156`
   - **Problem:** these headers skip `displayDashes`, while every other header in the branch applies it. That was true before this branch as well. The tests pass `{ dashes: false }` to match.
   - **Fix:** wrap both in `displayDashes`, then drop `dashes: false` from those tests.

2. `test/js/minigame-title-escape.test.mjs:183`
   - **Problem:** the container header test calls the async `init` through the sync `initQuietly`. It passes only because the header is written before the first `await`, and a later rejection would be unhandled.
   - **Fix:** use `await initQuietlyAsync(mg)`, as the other container tests do.

3. `public/break_escape/js/minigames/person-chat/person-chat-minigame.js:2067`
   - **Problem:** `showError` puts `${message}` into `innerHTML`. Messages include `NPC not found: ${npcId}` and error text.
   - **Fix:** build the warning span with DOM nodes and append the message as text.

## Not finished

The headless render of the phone-chat and text-file minigames from m01 objects was not completed: the run was stopped before that pass.

## Outcomes (fix round 3, with a full sink sweep)

Each round found more sinks, so this round listed every `innerHTML`, `outerHTML`, `insertAdjacentHTML` and HTML template literal in `public/break_escape/js/minigames` (about 224 writes and 660 interpolations, triaged by a script that lists every unescaped `${...}` inside markup), plus the helpers the minigames import from `js/ui`, `js/utils` and `js/systems`. Each source was classed as constant (module literal, number, computed class), escaped (upstream or at the sink), or author/server text. Every author/server sink is now `textContent` or escaped once.

- Majors 1 to 3 fixed. Minors 1 and 2 fixed. Minor 3 done: the backlog entry now lists only what is left after the sweep.
- Nit 1 left (pre-existing): adding `displayDashes` to the person-chat and phone-chat headers needs a new import in modules that about 25 JS harnesses load. Logged with the shared-helper item.
- Nits 2 and 3 fixed.
- Not escaped twice: notebook `noteContent` (`renderNoteMarkdown` escapes it), text-file content (`formatFileContent` escapes, then adds `<br>`), the blockchain wallet sublabel (already escaped by `_walletLabel`, so the second escape was removed), the drug library `_changesText` (a `plain` mode for its `textContent` caller), and `showSuccess`/`showFailure` in the base class, which take markup by contract: every caller passes a constant or escapes first.
- Author markup kept on purpose, through allow-list formatters: `ncsc-brief` and `coverage-decision-form` (`authorHtml`: escape all, then restore entities and bare `<strong> <em> <b> <i> <br>`), `alarm-panel` title and footer (`<br>` only), and `forensic-data-platform` block fields (`sanitizeRich`: a DOM allow-list of `<strong> <p> <br> <code>`, a plain `style` on strong and p, everything else unwrapped or dropped). Whether to keep this or convert sis02, sis03 and lab_tesseract_trials to plain text is in the backlog.
- Outside the minigames: `systems/apply-actions.js:497` (end screen body, sis03 uses `<br>`) is logged, not changed.

### Sweep table (author/server sinks; constants and already-escaped sinks are summarised per file)

| File | Sink and source | Action |
|---|---|---|
| framework/base-minigame.js | header title, cancel text | already escaped (R1); `showSuccess`/`showFailure` markup by contract, callers checked |
| notes/notes-minigame.js:141, :395, :550, :580 | observations (scenario, player typing, lines other minigames add) | `textContent` via `setObservationText`; placeholder `<em>` built as a node |
| notes/notes-minigame.js:129, :385 | note content | already escaped (`renderNoteMarkdown`) |
| phone-chat/phone-chat-ui.js:566 | live preview (ink dry run) | `textContent` |
| phone-chat/phone-chat-ui.js:881 | voice transcript (ink) | label and `<br>` as nodes, transcript appended as text |
| phone-chat/phone-chat-ui.js:642 | contact time | escaped |
| phone-chat/phone-chat-ui.js, rest | contact name, handle, avatar, preview, app title | already escaped (R2); call HTML and buttons constant |
| phone-chat/phone-chat-minigame.js | header | already escaped |
| person-chat/person-chat-minigame.js:2067 | `showError` message (NPC id, error text) | DOM nodes, message as text |
| person-chat/person-chat-ui.js, portraits | continue button, status bar | constant; labels already `textContent` |
| password/password-minigame.js:323, :332 | `passwordHint`, `postitNote` (scenario) | escaped |
| password/password-minigame.js:400 | attempts and max attempts | escaped |
| password/password-minigame.js, sign-in | tiles, current user, link name, captured list, post-it | already escaped |
| container/container-item-image.js:51 | image `src` and `alt` | both escaped, five characters |
| container/container-minigame.js | header, panels, NPC mode, desktop, transfer dialog | already escaped (R1, R2); transfer choices constant |
| text-file, examine, lockpicking | names, types, observations, content | already escaped |
| alarm-panel | `panelTitle`, footer (uses `<br>`), lamp labels, status | escaped; `<br>` restored for title and footer |
| esd-pushbutton | `label`, `confirmDesc` | escaped |
| ransomware-display | organisation, systems, amounts, wallet, portal, extra lines | escaped |
| sis-config-threshold | rows (parameter, modified by, values, status), compare title, confirm label, detail | escaped; `<wbr>` added after the escape |
| drug-library-integrity | title, subtitle, file names, drug rows, tampered entry, sources, fleet report, outcome text, drug name global | escaped |
| dusting, title-screen, cryptex, combination, pin, command-board, infusion-pump, intel-board | | already escaped, validated, or constant |
| backup-recovery | `outcomeTone` in a class | escaped; rest already escaped |
| warranty-checklist | verdict restored from saved state, in class names | checked against `VERDICT_LABELS` |
| blockchain-explorer | `confirmations`, `blockHeight` (scenario strings) | escaped; wallet sublabel double escape removed |
| blockchain-explorer/mixer-match-board.js | currency in `money()`, `feePercent` | escaped (`moneyHtml`) |
| ncsc-brief | 17 section, note and badge fields (entities, `<strong>`, `<br>` by design); confidence class | `authorHtml`; class escaped |
| coverage-decision-form | section and option text (entities); `section.id`, `opt.value` attributes and selectors | `authorHtml`; attributes escaped; radios matched by property |
| claims-management-system, ehr-terminal, shredded-document | | already escaped |
| forensic-data-platform:54-110, :286 | block fields and tab heading (rich by design) | `sanitizeRich` |
| forensic-data-platform:67, :103, :184, :191, :199, :201 | cell class, style2, tab id and label, `caseRef`, confirm label and hint | escaped; tab selector by dataset |
| network-architecture:125-258 | SVG labels and attributes, detail panel | escaped |
| network-segmentation-map:90-391 | sever label, zones, devices, consequences, auth labels, `claimRef`, rule title, section | escaped |
| network-view | rows and header (server) | already escaped |
| siem:518 | alert severity, source, description | built with `textContent` |
| flag-station:870, :877 | reward item name, room id (server) | escaped; helper now covers quotes |
| vm-launcher | VM title, IP, console href (server) | helper now covers quotes |
| rfid/rfid-ui.js:319, :384, :462, :740 | card field rows | `textContent` (label as `<strong>`) |
| rfid/rfid-ui.js:910, :931 | success and error messages (card names) | escaped |
| ble-scanner | device name, MAC, UUID | escaped |
| bluetooth | device name, MAC, details, category | escaped |
| biometrics, fingerprint-reader | | constant or already escaped |

Tests: `test/js/minigame-title-escape.test.mjs` (7 new cases for this round's sinks) and `test/js/minigame-html-sweep-a.test.mjs`, `-b`, `-c` (26 cases for the specialised minigames). Each new case fails against the pre-fix modules and passes now; the placeholder case is a regression guard.
