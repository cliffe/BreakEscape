# Escaping build log (q47, q48)

Branch `build/escaping`. Decisions: q47 and q48 in `docs/handover/2026-11-11_USER_DECISIONS.md`. Background: `MINIGAME_TITLE_REVIEW_R3.md`, `MINIGAME_TITLE_REVIEW_R5.md`, `ACCESS_MODEL_SLICE_9_3B_W_CODE_REVIEW_R2.md` (Minor 1).

## What changed

### Shared helpers (q48 part 3)

- `public/break_escape/js/utils/escape-html.js`: `escapeHtml(value)`, the five characters `& < > " '`; null and undefined give an empty string, `0` stays `"0"`.
- `public/break_escape/js/utils/author-html.js`: `authorHtml(value)`, the allow-list formatter that was copied in the NCSC brief and the coverage form (R5 m1). It shows dashes, escapes everything, then restores bare `<strong> <em> <b> <i>` pairs, `<br>` and entities. It imports `escape-html.js` and `display-dashes.js`.
- These now import `escapeHtml` in place of a local copy: base-minigame, alarm-panel, ble-scanner, bluetooth, blockchain-explorer, mixer-match-board, container, coverage-decision-form, drug-library-integrity, esd-pushbutton, examine (was four characters), flag-station, forensic-data-platform, lockpicking, ncsc-brief, network-architecture, network-segmentation-map, network-view, password, phone-chat-minigame, phone-chat-ui, ransomware-display, rfid-ui, sis-config-threshold, text-file (header and file content), vm-launcher, and `systems/interactions.js`.
- Kept local, on purpose (listed in the backlog): helpers with `|| ''` (a `0` would render differently), the dash-folding ones, `dual-auth-text.js` (exports its own), `container-item-image.js` (import-free so node tests can load it), `utils/note-markdown.js`.

### Author formatting (q47)

- The allow-list filters stay. `systems/apply-actions.js` `showEndScreen` now writes the scenario `body` through `authorHtml` (was `innerHTML = displayDashes(body)`). The title was already `textContent`.
- The coverage form's outcome quote goes through `authorHtml` too, so an entity shows as its character, the same as the rest of the form (it was `textContent`).
- No scenario uses `show_end_screen` with markup today. `scenarios/test_simple_success` now has a body with `<strong>`, `<br>`, `&ndash;` and one tag outside the set, as the focused beat.

### Minigame titles (q48 part 1)

- `base-minigame.js` already escaped `params.title` and `cancelText` centrally (from the minigame title branch); it now uses the shared helper. Checked that no caller relies on HTML in a title: the only scenario titles with markup are alarm-panel `panelTitle` (its own `<br>` formatter) and coverage form section titles (`authorHtml`), neither of which is `params.title`.

### VM panel URL (q48 part 2)

- `vm-launcher-minigame.js` exports `safeVmPanelUrl(raw, base)`. It accepts http and https, or a relative path that resolves to the page's own origin. It refuses `javascript:`, `data:`, other schemes, `//host`, `/\host`, control characters hidden in the scheme, and anything that does not parse. A refused URL gives no iframe and no console link (the standalone card shows instead).

### Chat headers (q48 part 4)

- person-chat and phone-chat headers apply `displayDashes` (R3 n1); the escape is unchanged (text for person-chat, the shared helper for phone-chat).

### R5 nits

- n1: dropped the no-op `plainText: true` from `interactions.js`, `wearables.js`, `npc-workarounds.js` and `social-feed.js` (the ones R5 named). The same option is still passed in pc-sessions, unlock-system, network-links and inventory-menu: left for now because other builds touch those files (backlog).
- n2: `isQueuedDuplicate` and `findShownDuplicate` take the options and compare the render mode (`toastRenderMode`: html, or plain with or without verbatim). Callers pass their options.
- n3: `gameDisplay` html mode inserts the caller's HTML as given (newlines become `<br>`), with no dash display over built markup. The one caller (`interactions.js` read in place) applies `displayDashes` to each piece before the escape.
- n4: that caller uses the shared five-character escape.

## Tests

- New: `test/js/escaping-shared-helpers.test.mjs` (15 cases): the helper, `authorHtml` allowed and hostile input, the end screen (hostile title and body, formatting set), the coverage outcome quote (entities, hostile), `safeVmPanelUrl` (accepted and refused lists), the launcher with a `javascript:` URL (no link, no iframe), toast duplicates by render mode (held and on screen), `gameDisplay` html and plain modes, and a static check that the listed modules import the shared helpers and keep no local table.
- Added to `test/js/examine-minigame.test.mjs`: read in place with a hostile name, observations and text (escaped once, five characters, dash shown first).
- `test/js/minigame-title-escape.test.mjs`: chat header tests now expect the dash display. `minigame-html-sweep-c`: jsdom gets a page URL (the launcher needs an origin). Option expectations updated in wearables, npc-workarounds, social-feed and interaction-warning.
- Harness copy lists: about 100 test files that copy or stub engine modules now carry `utils/escape-html.js` and `utils/author-html.js` (or a stub, in the data-URL stub maps for `interactions.js` and `apply-actions.js`).
- Full suites: see the end of this file.

## Live proof (port 3038, headless)

Games 1385 (sis02_energy), 1386 (sis03_cyber_insurance), 1388 (lab_tesseract_trials), 1389 (m01_first_contact), 1390 and 1405 (test_simple_success), all rooms unlocked with `tools/playtest/unlock-all-rooms.rb`. Each minigame was opened by handing the room's real sprite to `window.handleObjectInteraction`. The sis03 coverage form is held by an NPC, so its own data from game 1386 was handed over as an inventory item. Results:

- sis02 alarm panel: the `<br>` in the title breaks the line; no literal tags or entities.
- sis03 NCSC brief (sealed envelope), forensic data platform (4 `<strong>`), coverage form (section titles show the em dash; the outcome quote and speaker are clean after a submit): no literal tags or entities, nothing injected.
- lab_tesseract_trials alarm panel: two `<br>` breaks in the title; clean.
- m01: the VM launcher and the flag station render; the person-chat header turns a "--" in the title into a dash and shows "Speaking with Agent HaX".
- End screens: a sis02-style body and a sis03 body (`<strong>`, `<br>`, `&deg;`, `&ldquo;`, dash) render formatted; a hostile body stays text and runs nothing. test_simple_success through its own `triggerOnInteract` `show_end_screen`: one `<strong>`, one `<br>`, the `&ndash;` shown as a dash, the `<u>` shown as typed.
- No page errors in any game.

`window.__test.interact('success_terminal')` returned ok:false in test_simple_success, so that beat used the room sprite and `handleObjectInteraction`; not investigated (backlog).

## Left open

- The `plainText` leftovers and the local helpers kept on purpose (backlog entry).

## Suite results

- JS, full `bin/test-js -j 3` under the shared lock: 506 of 508 files passed. The two failures (`f18-toast-flag-rfid`, `flag-station-launch-reopen`) were missing `escape-html.js` in their flag station fixtures; fixed in `4ecc342c2`, both pass alone. Before that, a run of the 123 affected files gave 120 of 123, and the three were fixed in `840738726`.
- Rails: no Rails code changed; no Rails test reads `test_simple_success`. The full run was queued behind other builds on the shared lock (see the report for its result).
