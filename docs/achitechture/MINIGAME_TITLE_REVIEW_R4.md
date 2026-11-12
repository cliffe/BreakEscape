# Minigame title and HTML sinks: code review round 4

Date: 2026-11-12. Branch `build/minigame-title`, whole `git diff main...build/minigame-title`. Adversarial, fresh eyes; the R3 sweep table was used as a checklist only.

Counts: 0 blockers, 1 major, 4 minors, 3 nits.

## What was checked

- The four allow-lists: `authorHtml` (ncsc-brief, coverage-decision-form), `escapeWithBreaks` (alarm-panel), `sanitizeRich` (forensic-data-platform). Probed in jsdom with attributes, event handlers, `javascript:` links, nested and foreign tags (svg, math, noscript, plaintext, style, template), the DOMPurify-style form/math mXSS string, comments and CDATA, CSS escapes, `expression()`, entity-encoded tags and unbalanced tags. Nothing ran and no handler or link survived; findings m1, m2 and n2 are the residue.
- Every helper used in a changed file is defined in that file (the three apparent gaps are class methods).
- A scan of every template literal holding HTML across `public/break_escape/js` for interpolations that are not wrapped in an escape helper, plus `outerHTML`, `insertAdjacentHTML`, `document.write`, `createContextualFragment` and `DOMParser` (only three constant `insertAdjacentHTML` calls exist). The minigames are clean apart from constants and computed numbers; the sinks outside them are M1, m3 and m4.
- Double escaping: notebook `noteText` (markdown backslash escapes, HTML escaped once by `renderNoteMarkdown`), notes observations (now `textContent`, no caller pre-escapes), phone preview and transcript (text), `displayDashes` (runs before the escape everywhere, so `--` never meets `&amp;`), sis03 `&mdash;` / `&rsquo;` / `&ndash;` / `&deg;` (restored once by the allow-lists). None found. `interactions.js:2054` pre-escapes for `gameDisplay`, which is correct today but becomes a double escape under the M1 fix (see there).
- Scenario markup: a grep of every scenario `.json.erb` and `.json` (dungeon graphs excluded) and every `.ink` file for `<b> <br> <i> <em> <strong> <p> <code> <span>` and entities. Only sis02 and lab_tesseract_trials `panelTitle` (`<br>`) and sis03 ncsc-brief, coverage form and forensic platform fields carry markup, all of which go through the allow-lists. No ink file carries markup or entities. No visual regression is expected anywhere else.
- Tests: the four new test files import the live modules from `public/break_escape/js` and run them in jsdom; none use a copy.

## Live render (port 3029, keyless)

Games created with `tools/playtest/new-game.rb`: 1292 (sis03_cyber_insurance), 1293 (sis02_energy), 1294 (lab_tesseract_trials). Each minigame was started from the game's own server-rendered object data through the real `window.start*Minigame` starters, then screenshotted (ncsc brief opened to its content; all six forensic tabs).

| Minigame | Scenario | Result |
|---|---|---|
| ncsc-brief | sis03 | entities decoded (dashes, curly apostrophes, en dash ranges), meta italic with its line break, `Basis for attribution` bold; no literal tags or entities in `innerText` |
| coverage-decision-form | sis03 | section titles, options and descriptions decoded; header sub-line correct |
| forensic-data-platform | sis03 | six tabs render; red `<strong style="color:#f85149">` cells and `&deg;C` correct; callouts with `<strong>`/`<br>` intact |
| alarm-panel | sis02, lab_tesseract_trials | `<br>` in the panel title gives two and three lines |

No page errors. Zero `[onerror]`, `[onclick]`, `[onload]` in any minigame container. The server was stopped afterwards by PID.

## JS suite

`flock ... bin/test-js -j 3`: 502 files passed, 0 failed.

## Major

### M1. Notifications and the game display modal still render scenario text as HTML

`public/break_escape/js/systems/notifications.js:215-219` (`showNotification`, title and message), `:283-284` (`gameDisplay`, title and body) and `:325-328` (`gameConfirm` without `plainText`, message and both labels) put their arguments into `innerHTML` with `displayDashes` only. `plainText` is opt-in (`:191`, `:304`) and only 14 calls use it. Callers pass scenario object names and observations directly, which is the default way an object's observations are shown when no examine view opens:

- `systems/interactions.js:819-821`, `:2017-2019`, `:2070-2072` (`data.name` and the observations message), `:1352` and `:1680` (`lockedMessage`, `data.name`), `:1142`, `:1164`, `:1609`, `:1892`, `:1949`, `:2084` (`data.name`)
- `systems/objectives-manager.js:1212-1233` (task and aim titles)
- `systems/npc-game-bridge.js:26`, `:293`, `:426`, `:519`; `systems/inventory.js:488`, `:635`; `systems/minigame-starters.js:235`; `systems/unlock-system.js:887`, `:1009`; `minigames/container/container-minigame.js:1434`; `minigames/helpers/chat-helpers.js:141`, `:144` (item names, server error text)
- `systems/apply-actions.js:420` (`gameConfirm(text)` from a scenario action, no `plainText`)

This is pre-existing and outside the minigames, but it is the largest remaining author-text HTML sink and the R3 table does not list it. No scenario puts markup in these fields (grep above), so plain text changes nothing visible.

Fix: make plain text the default in `showNotification`, `gameDisplay` and `gameConfirm` (`plainText` true unless `options.html === true`), keep the newline handling (`setPlainLines` already does it), and give the one caller that builds markup on purpose, `interactions.js:2052-2054` (`<em>` around observations, pre-escaped), the `html: true` opt-in, or change it to plain text and drop its local `esc` so it is not escaped twice. Audit the constant-markup callers (any message with a literal tag) before flipping. Add a test that drives `gameAlert`, `gameDisplay` and `gameConfirm` with a hostile name and observation through `interactions.js`.

## Minor

### m1. `authorHtml` restores entity-encoded tags and leaves unbalanced tags

`public/break_escape/js/minigames/ncsc-brief/ncsc-brief-minigame.js:12-17` and `coverage-decision-form/coverage-decision-form-minigame.js:12-17`. The entity restore runs before the tag restore, so authored `&lt;b&gt;x&lt;/b&gt;` becomes a real `<b>x</b>`: an author cannot show a literal tag, and the comment's "only those exact forms" is not true. Each tag is also restored on its own, so `<b onclick=1>x</b>` gives escaped opening text plus a real `</b>`, and an unclosed `<i>` or `<b>` stays open; the parser's formatting reconstruction then carries italics or bold into the following sections of the brief. Not exploitable (only bare `strong em b i br` can appear), but a typo in a scenario restyles the rest of the document.

Fix: restore tags before entities, and restore pairs only: `.replace(/&lt;(strong|em|b|i)&gt;([\s\S]*?)&lt;\/\1&gt;/g, '<$1>$2</$1>')` (repeat once for one level of nesting), then `<br>`, then entities. Add the entity-encoded and unclosed cases to `minigame-html-sweep-b.test.mjs`.

### m2. `sanitizeRich` keeps any CSS property, and `style2` is not checked at all

`public/break_escape/js/minigames/forensic-data-platform/forensic-data-platform-minigame.js:17-18` and `:30-31`. `SAFE_STYLE` limits characters, not properties, so `position:fixed;top:0;left:0;width:100%;height:100%;z-index:99999;background:#000` survives (checked) and a block can cover the whole game, close button included. `:144` puts the callout's `style2` into a `style` attribute with attribute escaping only, so `background:url(https://...)` and the same overlay pass there too.

Fix: split the declaration list and keep only an allow-listed set of properties (`color`, `background-color`, `font-weight`, `font-style`, `text-decoration`, `margin*`, `padding*`), with the same character check per value; run `style2` through the same function. sis03 uses only `color` and `margin-top`.

### m3. Objective panel ids go into attributes unescaped

`public/break_escape/js/ui/objectives-panel.js:158` (`data-aim-id="${aim.aimId}"`) and `:194` (`data-task-id="${task.taskId}"`). The titles beside them are escaped, the ids are not; an id with a quote breaks out of the attribute. Same class as the coverage form `section.id` fixed on this branch. Fix: `this.escapeHtml(aim.aimId)` and `this.escapeHtml(task.taskId)`; read them back through `dataset` as today.

### m4. The inline phone fallback in npc-barks writes the NPC name and an error message as HTML

`public/break_escape/js/systems/npc-barks.js:716-717` (`params.npcName`) and `:906` (`err.message`, which can quote ink text). Fix: build the header span and the error div with `textContent`.

## Nits

### n1. Tag matching is case-sensitive in two allow-lists and not in the third

`ncsc-brief-minigame.js:16-17` and `coverage-decision-form-minigame.js:16-17` have no `i` flag, so `<BR>` or `<Strong>` show as literal text, while `alarm-panel-minigame.js:8` uses `gi`. Pick one rule (case-insensitive, emit lower case) for all three, or note the lower-case rule in the scenario design README.

### n2. `sanitizeRich` output is not stable under re-parsing for nested paragraphs

`forensic-data-platform-minigame.js:20-46`: unwrapping a non-allowed element can leave `<p>` directly inside `<p>` (for example `<p><button><p>x</p></button></p>` gives `<p><p>x</p></p>`), which the browser re-parses into sibling paragraphs plus an empty one. Harmless (text is always escaped on serialisation, so nothing new can appear), but `rich()` output inside `case 'p'` at `:152` nests the same way for any block whose `html` starts with `<p>`. Unwrap a `P` that has a `P` ancestor, or wrap `p` blocks in a `div`.

### n3. The coverage form header joins with a raw entity outside `authorHtml`

`coverage-decision-form-minigame.js:93-101`: `headerSub` and `badge` are assembled from escaped parts plus literal `&mdash;` and `&#10003;`, then inserted raw. Correct today; a comment at the join saying the parts are already HTML would stop a later edit from passing the whole string through `authorHtml` again (which would be harmless) or through `escapeHtml` (which would show `&mdash;` literally).

## Left in place

- Games 1292, 1293 and 1294 (standalone dev database), no flag XML files (none of the three scenarios uses VM flags).
- `tmp/keyless-3029.log` in this worktree.
- Screenshots and probe scripts in the session scratchpad only.

## Outcomes (2026-11-12)

Each finding was checked against the code first; all eight were confirmed and fixed. Main was merged in before the work.

- M1: `showNotification`/`gameAlert`, `gameDisplay` and `gameConfirm` render plain text by default (textContent, newlines kept). `{ html: true }` is the opt-in; the old `{ plainText: true }` is still accepted and changes nothing. Held toasts keep their `html` flag on replay. A sweep of all 168 direct calls and the indirect ones (`?.(`, `notify`, `toast` wrappers) across `public/break_escape/js` found no caller passing literal markup. Two callers pre-escaped and were changed: `interactions.js` read-in-place display (keeps its `<em>`, now passes `{ html: true }`, escapes once) and `unlock-system.js` "is using this PC" (escape removed, else `&lt;` would show; its test now expects the raw name). The phone and person chat `showNotification` methods were already textContent.
- m1 and n1: `authorHtml` in both minigames restores matched pairs only (one level of nesting), then `<br>`, then entities, case-insensitive with lower-case output. `&lt;b&gt;` stays literal; a stray or unclosed tag stays text.
- m2: `sanitizeRich` keeps only `color`, `background-color`, `font-weight`, `font-style`, `font-size`, `text-decoration`, `text-align`, `margin*` and `padding*`, with the character check per value; `style2` goes through the same `cleanStyle`. sis03 (`color`, `margin-top`) is unchanged.
- m3: aim and task ids use a dedicated attribute escape (the panel's `escapeHtml` serialises a text node, which leaves quotes alone and runs the dash display) and a quoted-selector escape when looked up.
- m4: the inline phone header and the ink error use textContent.
- n2: a `<p>` inside a `<p>` (from the `p` block wrapper or the author) is unwrapped.
- n3: comment added at the coverage form header join.

Tests: `notifications-plain-default.test.mjs` (real notifications.js and interactions.js in jsdom, hostile name, observations and confirmation text), `panel-barks-author-text.test.mjs` (m3, m4), new cases in `minigame-html-sweep-b` (m1, n1) and `minigame-html-sweep-c` (m2, n2). Every new case except the opt-in and dash-id checks fails against the pre-fix engine (`SWEEP_JS_ROOT` pointed at a copy of the merge commit).

Five toast tests used fake documents with no `createTextNode` and read the title from the markup; their fakes and assertions were updated for the plain default.

Suites (under the shared lock): `bin/rails test` 1748 runs, 0 failures, 0 errors, 1 skip; `bin/test-js -j 3` 506 files passed, 0 failed.

Commits: 57e387201 (merge main), 7da2ca0e5 (fixes and tests), d0370f228 (toast test fakes).

Not done: no live browser render this round; the change is covered by jsdom tests on the real modules.
