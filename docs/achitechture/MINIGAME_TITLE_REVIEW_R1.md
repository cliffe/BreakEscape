# Minigame title escaping: review round 1

Branch `build/minigame-title`, commits c3231c7e5 and 2d1c19d2d, reviewed against `main`.

Counts: 0 blockers, 2 majors, 4 minors, 3 nits.

## What was checked

- Every `params.title` and `params.cancelText` read under `public/break_escape/js` (assignments, destructuring, `safeParams`/`options` copies) and every `innerHTML` header write (`headerElement.innerHTML`, own `container.innerHTML` title bars).
- Double escaping: the Wi-Fi join and sign-in headers in `password-minigame.js` (lines 224, 896) take a constant or their own field, never the already escaped base header, so nothing is escaped twice. No engine caller passes a pre-escaped title (no `title:` built with an escape helper or an entity). No scenario `name`, `title`, `displayName`, `stationName` or `observations` value contains markup or an HTML entity; the only entity-bearing titles (`sis03` "Section N &mdash; ...") are coverage-form section titles, which this branch does not touch.
- `displayDashes` returns a literal U+2013, not an entity, so escaping after it is correct and the dash survives (checked live: the " -- " in the hostile title shows as U+2013).
- Escape helpers cover `& < > " '`, so they are safe in attribute values too. No changed sink is an attribute.
- The new test imports the real modules under jsdom. Reverting each of the six source files to `main` one at a time makes its own test fail (base header revert also fails the forensic test), so each assertion is tied to its fix.
- Tests run: minigame-title-escape 6/6, keypad-title 6/6, network-links 42/42, and 23 related password, person-chat, phone-chat, forensic, segmentation, examine and minigame test files, all green.
- Live check on a keyless server on :3029 (m01 game), driving `MinigameFramework.startMinigame` with a hostile title and cancel text: the password base header, field label and cancel button, and the segmentation map title bar all render the tags as text, no handler runs.

The same live run found the two majors below: both executed an `img onerror` handler.

## Major

**M1. Password device panel still renders `params.title` and the scenario name as HTML.**
`public/break_escape/js/minigames/password/password-minigame.js:264-273, 290, 293-294`.
`getImageData()` sets `deviceName` from `sprite.scenarioData.name` (any textured lockable, the normal lock path) or falls back to `this.params.deviceName || this.params.title`, and the template writes it raw into `alt="${imageData.deviceName}"` and `<h4>${imageData.deviceName}</h4>`, with `observations` raw into the `<p>`. Live: `startMinigame('password', null, { title: HOSTILE, deviceImage: 'pc', lockable: null })` injects the `<b>` and the `img`, and `window.__pwned` becomes 1. The test misses it because it passes `lockable: null` with no `deviceImage`, so the panel never renders.
Fix: `alt="${escapeHtml(imageData.deviceName)}"`, `<h4>${escapeHtml(displayDashes(imageData.deviceName))}</h4>`, `<p>${escapeHtml(displayDashes(imageData.observations))}</p>` (the helper already exists in this file), and escape `imageData.imageFile` in the `src` too. Add a test case with `deviceImage: 'pc'` and one with a `lockable` stub carrying `texture.key` and a hostile `scenarioData.name`, asserting `.password-info h4` and the `img` `alt` read back as text.

**M2. The reported leftover is real and executes: fix the text-file and container headers in this branch.**
`public/break_escape/js/minigames/text-file/text-file-minigame.js:45` writes `displayDashes(this.textFileData.fileName)` raw into the header `<h3>`; the same scenario name also arrives as `params.title` (`systems/interactions.js:1850`, "Text File - <name>"). Its base header is now escaped, then line 45 overwrites it with the unescaped version, so the branch's fix does not hold for this minigame. Live: a hostile `fileName` injects three `img` elements and runs the handler.
`public/break_escape/js/minigames/container/container-minigame.js:505-506` does the same with `scenarioData.name` and `headerObservations()`.
These are the same sink class as the ones fixed (a subclass header rebuilt from the scenario name that feeds `params.title`), each is a one-line change, and leaving them means the branch's claim "subclass header sinks fixed" is not true for two of the most common minigames. Fix here, not later.
Fix (text-file): build the header as `'<h3><img src="/break_escape/assets/icons/notes.png" alt="Document" class="icon"> </h3><p>Viewing text file contents</p>'`, then `h3.append(displayDashes(this.textFileData.fileName))` (a text node). Container: `escapeHtml(displayDashes(...))` on both lines, or `textContent` on `h3` and `p`. Add both to `minigame-title-escape.test.mjs`.

## Minor

**m1. NPC and item names in `alt` attributes are unescaped.**
`minigames/container/container-minigame.js:566` (`alt="${this.npcDisplayName}"`), `minigames/phone-chat/phone-chat-ui.js:633` (`alt="${npc.displayName}"`), `minigames/lockpicking/lockpicking-game-phaser.js:384` (`alt="${itemName}"`). A `"` in a name breaks out of the attribute. Not a `params.title` sink, but the same data as the person-chat NPC name this branch fixed. Fix: wrap each in the local escape helper (phone-chat-ui already has `escHtml`).

**m2. Other author title fields written raw with `displayDashes` only.**
`minigames/drug-library-integrity/drug-library-integrity-minigame.js:127` (`consoleTitle`), `:649, :664, :677`; `minigames/ncsc-brief/ncsc-brief-minigame.js:165, 169, 178, 187`; `minigames/network-segmentation-map/network-segmentation-map-minigame.js:383` (`rule.title`); `minigames/forensic-data-platform/forensic-data-platform-minigame.js:101` (`block.title`); `minigames/coverage-decision-form/coverage-decision-form-minigame.js:135` (`section.title`). These are scenario data, not `params.title`, so outside this branch's stated scope. Note: `coverage-decision-form` section titles in `sis03` use `&mdash;` entities, so escaping that sink needs those values changed to a literal dash or ` -- ` first, or they will show as "&mdash;". Fix: log as a follow-up backlog entry (this branch deleted the old one) covering scenario-data sinks across these minigames.

**m3. The password test cannot reach the image panel or the lockable path.**
`test/js/minigame-title-escape.test.mjs:76-77`. See M1 for the cases to add. The same applies to text-file and container (M2): add them so the "every subclass that builds its own header" claim in the file's header comment is tested.

**m4. The backlog entry was deleted while two sinks of the same kind remain.**
`docs/IDEAS_BACKLOG.md` (entry removed in c3231c7e5). If M2 is fixed here this resolves itself; otherwise restore the entry naming text-file and container.

## Nit

**n1. Person-chat and phone-chat headers skip `displayDashes`.**
`minigames/person-chat/person-chat-minigame.js:199-200`, `minigames/phone-chat/phone-chat-minigame.js:156`. A " -- " in an NPC name or phone title shows as two hyphens there but as a dash in the base header. Pre-existing; `textContent = \`🎭 ${displayDashes(this.title)}\`` would align it.

**n2. Four copies of the same escape helper.**
`base-minigame.js:8`, `forensic-data-platform-minigame.js:5`, `network-segmentation-map-minigame.js:5`, `phone-chat-minigame.js:148`, plus the existing one in `password-minigame.js:33`. The reason (harnesses stub `display-dashes.js` and `base-minigame.js`) is sound. A small `utils/escape-html.js` added to the harness copy lists would remove the drift risk; acceptable as is.

**n3. `keypad-title.test.mjs:60` asserts the source text with a regex.**
It will break on any reformatting of the label line and proves nothing the new jsdom test does not. Consider dropping the source match now that `minigame-title-escape` renders the label.
