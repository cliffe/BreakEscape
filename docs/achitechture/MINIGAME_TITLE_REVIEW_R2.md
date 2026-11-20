# Minigame title escaping: code review round 2

Scope: `git diff main...build/minigame-title` (commits c3231c7e5, 2d1c19d2d, ced304708, 463dac11e). Fresh read; earlier review files not consulted.

Counts: 0 blockers, 1 major, 5 minors, 3 nits.

## What was checked

- Every changed sink: base header and cancel text, password header, field label and device panel, person-chat and phone-chat headers, segmentation-map and forensic-platform titles, text-file header, window title, file name, type and observations, container header and info panels (container, NPC and desktop modes), NPC and item alt text, phone contact name, lockpicking item panel.
- Double escaping: no caller passes an already escaped `title`, `cancelText`, file name or device name (searched every `title:` passed to `startMinigame`). The Wi-Fi join header (`password-minigame.js:223`) and sign-in header (`:896`) build their own escaped headers and do not go through the base `<h3>`; the join title passed to the base is the constant `Join Wi-Fi`. Scenario ERB is rendered with plain `ERB.new` (`app/models/break_escape/mission.rb:209`), so server text arrives unescaped. No scenario `name`, `displayName`, `observations` or `fileName` carries an entity or a tag (searched every scenario), so nothing that used to render as `&mdash;` or `<br>` now shows literally. Escaping is applied after `displayDashes`, so the dash conversion still works.
- Attribute context: every new attribute escape covers `&<>"'`. Live check: the real m01 name "Kevin's Workstation" in the password `alt` and the hostile `"`-bearing names stay inside their attributes.
- Escaped `src`: no asset under `public/break_escape/assets` has `&`, `"`, `'`, `<` or `>` in its path (only spaces in sounds and music, which these panels do not use). Entity decoding restores the value in an attribute, so the images load: live check shows `pc.png`, `text_file.png`, `pc1.png` and the icons all loaded (`naturalWidth > 0`).
- Tests: `test/js/minigame-title-escape.test.mjs` imports the real modules into jsdom (13 pass); `keypad-title.test.mjs` (6) and `network-links.test.mjs` (42) pass.
- Live render on a keyless server on :3029, game on m01_first_contact, real object data for Kevin's Workstation (password, lockable path), Server Access Log (text file) and IT Monitoring Station (container, desktop mode), each also with a hostile name (`Safe & "Sound" <img src=x onerror=...> -- R&D`). Password panel, field label, text-file window and container header and panel read correctly; the hostile name showed as typed with the en dash, no handler ran, no page errors. The real container was refused by the server as locked in this fresh game, so its real-name render was checked through the hostile run (same template). Server stopped and the game row and flags file removed afterwards.

## Major

### M1. Container NPC mode still renders the NPC name as HTML in the heading

`public/break_escape/js/minigames/container/container-minigame.js:572`

```
<h3 ...>${this.npcDisplayName || 'NPC'} offers you items</h3>
```

The branch escaped the avatar `alt` six lines above (`:566`) but left the visible heading. Proven in jsdom with the real module: `npcDisplayName: 'Eve <img src=x onerror="1">'` produces an `<img onerror>` child in the heading. `npcDisplayName` is the NPC's scenario `displayName` (passed through `npcOptions` by the give-item path). The NPC-mode test (`test/js/minigame-title-escape.test.mjs`, "the container NPC mode ...") only asserts the `alt`, so it did not catch this.

Fix: `${escapeHtml(displayDashes(this.npcDisplayName || 'NPC'))} offers you items`, and add `assertText(document.querySelector('.npc-mode h3'), ...)` to that test (it needs `await mg.init()`, since `init` is async and the NPC UI is built after the awaits).

## Minor

### m1. Avatar `src` attributes left unescaped next to escaped `alt`

`container-minigame.js:566` (`src="${this.npcAvatar}"`) and `phone-chat/phone-chat-ui.js:633` (`src="${avatarSrc}"`). Both are author-supplied paths (`npc.avatar`, portrait variants). A quote in the path breaks out of the attribute. The password and lockpicking panels now escape `src`; these two should match. Fix: wrap both in the module's escape helper.

### m2. Phone contact preview is still HTML

`phone-chat/phone-chat-ui.js:638`: `<div class="contact-last-message">${displayDashes(lastMessagePreview)}</div>`, on the line below the newly escaped contact name. The preview is the last message's text (ink or scenario), cut at 40 characters, so a `<` or `&` in a line is parsed as markup and the cut can land mid-entity or mid-tag. Fix: `escHtml(displayDashes(lastMessagePreview))` (truncate first, escape after, as now).

### m3. Remaining scenario-text sinks not in the backlog entry

The new backlog entry lists drug-library console title and section lines, ncsc-brief, segmentation `rule.title`, forensic `block.title` and coverage-form section titles. These also take scenario text into `innerHTML` with `displayDashes` only:

- `rfid/rfid-ui.js:910-912` (`showSuccess`) and `:931-933` (`showError` message): messages built from card names, e.g. `rfid/rfid-data.js:346,355` (`Saved: ${cardData.name}`).
- `bluetooth/bluetooth-scanner-minigame.js:472` (`device.name`).
- `esd-pushbutton/esd-pushbutton-minigame.js:95` (`label`).
- `drug-library-integrity/drug-library-integrity-minigame.js:214,512,521` (`drug.name`).
- `alarm-panel/alarm-panel-minigame.js:82` (`panelTitle`): documented as supporting `<br>`, and sis02 and lab_tesseract_trials author `<br>` in it. Needs a decision: switch the authored `<br>` to `\n`, render with `white-space: pre-line` and escape.

Fix: add these to the backlog entry (or a follow-up slice) so the next pass is complete.

### m4. Backlog entry under-states the entity clean-up for sis03

`docs/IDEAS_BACKLOG.md` (new entry) says to change `&mdash;` in the sis03 coverage-form section titles before escaping that form. The ncsc-brief data in the same scenario also carries entities: section titles at `scenarios/sis03_cyber_insurance/scenario.json.erb:1538,1550,1561` and a confidence text with `&mdash;` and `&ndash;` (about line 1536). Escaping ncsc-brief without changing these would show literal entities. Fix: name the ncsc-brief values in the entry too.

### m5. Test gaps on the changed sinks

`test/js/minigame-title-escape.test.mjs`:

- Text file: only the header is asserted, and only with `headerElement: true`, which the real caller (`systems/interactions.js:1849`) does not pass, so in play that header is hidden. The visible sinks (`.window-title`, `.file-name`, `.file-type`, `.file-observations p`) are untested.
- Container: only the header (`:504-507`) is asserted. The container-mode panel (`:589-590`) and desktop-mode panel (`:632-633`) are untested, and `init` is not awaited, so the panels are never built in the test.
- NPC mode heading, as in M1.

Fix: await `init()` for the container cases, pass `mode`/`desktopMode` to reach both panels, and assert the text-file body sinks with the real caller's params.

## Nits

### n1. Lockpicking panel skips `displayDashes`

`lockpicking/lockpicking-game-phaser.js:391-392`: the password and container panels now run names and observations through `displayDashes`; this one shows `--` as typed. Fix: `escapeItemText(displayDashes(itemName))` and the same for observations (the test then drops `dashes: false`).

### n2. Nine copies of the same escape helper

Base, password, text-file, forensic, segmentation, lockpicking, container, phone-chat and phone-chat-ui each define an identical `&<>"'` replacer. Fix: export one `escapeHtml` from `js/utils/` and import it; check the JS test harness copy list when adding the import.

### n3. keypad-title test lost its label assertion

`test/js/keypad-title.test.mjs:60` replaced the source-shape assertion with a comment pointing at the new test. That is fine as the label is now rendered and checked there, but the comment could name the test case ("the password header and field label ...") so the link survives a rename.

## Outcomes

- M1 fixed: the NPC-mode heading escapes `displayDashes(npcDisplayName || 'NPC')`. The test now awaits `init()` and asserts the `.npc-mode h3` text; it fails on the old code. A second grep of the NPC-mode path found no other raw scenario string (item names go through `textContent` and `title`, messages through `textContent`).
- m1 fixed: the container NPC avatar `src` and the phone contact avatar `src` are escaped; both are tested with a hostile path.
- m2 fixed: the phone contact preview is escaped after the cut; tested with a markup-bearing last message.
- m3 and m4 done in the backlog entry: the extra sinks (rfid, bluetooth, ESD pushbutton, drug names, alarm panel title with its `<br>` decision) and the sis03 `ncsc-brief` entity and `<br>` values are named.
- m5 fixed: new tests for the text file window with the real caller's params (window title, file name, type, observations), and for the container-mode and desktop-mode panels with `init()` awaited.
- n1 fixed: the lockpicking name and observations run through `displayDashes`; the test drops `dashes: false`. The image `alt` stays as typed, matching the other panels' alt text.
- n2 deferred to the backlog entry: a shared helper touches nine modules and the test harness copy lists, outside this fix round.
- n3 fixed: the keypad-title comment names the test case.
