# Minigame HTML sinks: code review round 5

Branch `build/minigame-title`, whole `git diff main...build/minigame-title`, read fresh (earlier review files not read).

Counts: 0 blockers, 0 majors, 1 minor, 4 nits.

## What was checked

**Player-visible regressions.** Every scenario file (`scenarios/**/scenario.json.erb`, `.json` other than dungeon graphs, and `.ink`) was grepped for tags (`<br> <strong> <b> <em> <i> <p> <span> <code>` and others) and entities (`&amp; &mdash; &ndash; &rsquo; &ldquo; &deg; &rarr; &#NNNN;` and others). Every hit sits in a minigame that keeps an allow-list:

- sis03 coverage form (`outcomeSpeaker`, section titles, descriptions, labels, sublabels): entities only, handled by `authorHtml`.
- sis03 forensic data platform (desc, body, cells, setpoint labels and values, callouts): `<strong>`, `<strong style="color:...">`, `<p>`, `<p style="margin-top:...">`, `<br>`, `<code>`, entities. All survive `sanitizeRich` (style passes the property allow-list).
- sis03 NCSC brief (`caseRef`, badge, `briefMeta`, titles, confidence, bullets, paragraphs): `<strong>`, `<br>`, entities, handled by `authorHtml`.
- Alarm panel `panelTitle` with `<br>` (sis02, lab_tesseract_trials): handled by `escapeWithBreaks`.

No ink source or compiled ink JSON holds markup or entities, and no other scenario string does. The server (`app/`, `lib/`) sends no markup or entities in strings that reach toasts. No JavaScript caller of `showNotification`, `gameAlert`, `gameDisplay` or `gameConfirm` passes markup, either inline or through a variable built a few lines earlier, apart from the one `{ html: true }` caller. No caller escapes text before handing it to a toast that is now plain text (the old escape in `unlock-system.js` was removed in this branch), so nothing shows `&amp;` on screen.

**Remaining raw sinks.** A scanner over every `innerHTML`, `outerHTML` and `insertAdjacentHTML` template literal in `public/break_escape/js` listed each `${...}` that is not wrapped in an escape or allow-list function (219 hits). Each was traced: they are numbers, constants (RFID protocol tables, flag-station final states, menu labels), HTML fragments built from escaped parts (drug library, claims system, mixer board, network views), or validated values (`titleScreenArt` path regex). `ransomware-display` `groupName` is read but never rendered. The person-chat and phone-chat in-minigame toasts already use `textContent`. No raw author-text sink was found.

**Opt-in callers.** Only one: `interactions.js:2055` (`readInPlace`). Name, observations and text are each escaped once (`&`, `<`, `>`), the only markup is a literal `<em>`, and the content lands in element context, so quotes do not matter.

**Allow-list bypass.**
- `authorHtml` escapes everything first. It then restores only bare `<strong|em|b|i>` matched pairs (two passes, so one level of nesting), `<br>`, and `&name;` / `&#N;` / `&#xN;` entities. An authored `&lt;script&gt;` comes back as the entity text, which renders as literal characters and is never parsed as a tag. Attributes cannot be restored. `cssClass` is escaped into its attribute.
- `sanitizeRich` parses in an inert `<template>`. It drops script-like and foreign-content elements whole (SVG and MathML included), unwraps everything outside `STRONG P BR CODE`, removes every attribute except a style on `STRONG`/`P` that passes a property allow-list and a character allow-list (no `url(`, `expression`, `@import`, `:`, `/` or `\`), and unwraps nested `<p>`. `<plaintext>` and `<listing>` are unwrapped, so their text is serialised escaped. No mutation XSS path was found. `style2` on callouts goes through the same `cleanStyle`.
- `escapeWithBreaks` restores `<br>` only.

**Live render, port 3029, m01_first_contact (game 1318).** Run headless, with screenshots taken and DOM text checked for stray `&amp;`, `&lt;`, `&#39;`, other entities and literal tags:
- Toasts: an author-style message with `'`, `&`, `<->`, `"` and `>` across two lines, plus the Key Ring bullet list. Shown exactly as typed, line breaks kept.
- `gameDisplay` with a real observation: plain text, a literal `<b>` shown as text (as intended).
- Notepad from the inventory (notes minigame): text correct.
- Phone from the inventory: contact list preview, then the Agent HaX conversation. Apostrophes are correct.
- Password lock on Kevin's Workstation (real `handleUnlock`): header, observations, field label and post-it all correct. With the right password the PC desktop (container) opens. Header and icon labels are correct.
- Text file "Server Access Log" opened from the desktop: name, body (with an arrow) and observations (with an em dash character) all correct.

No page errors. One 404 on `assets/objects/notepad.png` in the inventory. It also happens on main, so it is outside this branch (see the end of this file).

**Tests.** `bin/test-js -j 3` was run on the 16 test files the branch touches plus every test that imports the changed modules: 98 files, 98 passed, 0 failed.

## Findings

### Minor

**m1. The `authorHtml` allow-list is in two identical copies.** `public/break_escape/js/minigames/ncsc-brief/ncsc-brief-minigame.js:5-23` and `public/break_escape/js/minigames/coverage-decision-form/coverage-decision-form-minigame.js:5-23` each define `escapeHtml`, `AUTHOR_PAIR` and `authorHtml`. A security allow-list kept in two places will drift: a later fix to one copy (say, a new tag) leaves the other behind.
*Fix:* move the three into `public/break_escape/js/utils/author-html.js`, export `authorHtml`, and import it in both minigames. Add the new file to each JS test harness copy list that copies either minigame (see the copy-list rule). Keep one hostile-input test against the shared module.

### Nits

**n1. Redundant `{ plainText: true }` options.** `systems/interactions.js:779`, `systems/wearables.js:110`, `systems/npc-workarounds.js:313,432` and `systems/social-feed.js:244` still pass `plainText: true`, which no longer changes anything (`notifications.js` comments say so). A reader may conclude that plain text is opt-in.
*Fix:* drop `plainText: true`, keep `verbatim: true` where it is set, and default `opts || {}` at `npc-workarounds.js:432`.

**n2. Duplicate checks ignore the render options.** `systems/notifications.js:102` (`isQueuedDuplicate`) and `:164` (`findShownDuplicate`) compare message, type and title only. A verbatim toast and a dash-displayed toast with the same text count as one, and so does an `html: true` toast and a plain one. Neither case happens today.
*Fix:* include `verbatim` and `html` in the comparison: store them in `_toast` (already done) and in the held tuple's options, and compare them there.

**n3. `gameDisplay` HTML mode runs `displayDashes` over finished HTML.** At `systems/notifications.js:288-289` the dash display runs after the caller has built markup, so a `--` inside a tag or attribute would be rewritten. The only caller passes escaped text and a bare `<em>`, so nothing breaks now.
*Fix:* in `interactions.js:2052-2053`, apply `displayDashes` to each piece before escaping, and let the HTML branch insert the body as given.

**n4. The local `esc` in `interactions.js:2052` escapes three characters, not five.** It is safe in element content, but every other helper in the branch escapes `& < > " '`, and this one would be unsafe if it were ever reused in an attribute.
*Fix:* use the same five-character escape, ideally one shared `utils/escape-html.js`. There are 36 local escape helpers in `public/break_escape/js`, which is a separate tidy-up.

## Outside this branch

- `assets/objects/notepad.png` returns 404, so the inventory Notepad slot shows a broken image with its alt text. This also happens on main. Either add the asset or point the notepad item at an existing icon.

## Leftovers from the live check

- Game row 1318 (m01_first_contact) is in the shared dev database, with every room marked unlocked by `tools/playtest/unlock-all-rooms.rb`.
- `tools/playtest/m01_first_contact-flags-game1318.xml` (gitignored).
- `tmp/keyless-3029.log` (gitignored, about 9.5 MB).
- The :3029 server is stopped and its pid file is gone.
