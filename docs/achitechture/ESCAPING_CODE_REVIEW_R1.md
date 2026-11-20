# Escaping (q47, q48): adversarial code review, round 1

Branch `build/escaping` against `main` (merge base `93a58745b`, head `76f672064`). Read with `docs/achitechture/ESCAPING_BUILD_LOG.md`.

Counts: 0 blocker, 0 major, 1 minor, 5 nits.

## What was tried

### `utils/author-html.js`

Every probe below went through `authorHtml` and then into a jsdom element's `innerHTML`, and the resulting element tree was checked for any tag outside `b i em strong br` or any attribute at all.

- Attribute smuggling: `<b onclick=...>`, `<b >`, `<b\t>`, `<b/>`, `<strong style="background:url(javascript:...)">`, `<a href="javascript:...">`. All stay text. The pair pattern only matches the exact escaped forms `&lt;tag&gt;`, so there is no place for an attribute to ride along.
- Nested and malformed: `<b><i>x</b></i>` (crossed) stays text; `<b><i>x</i></b>` formats; three deep leaves the outer pair as text; `<<b>>x<</b>>`, `<b>x</b`, `<sc<b>r</b>ipt>`, `<svg><b>x</b></svg>`, `<style><b>x</b></style>`: only the inner `b` is real, the rest is text. A pair restored in pass one can never straddle a pass-two match, because pass-two boundaries are escaped tags and pass-one pairs contain none, so the output is always balanced.
- Entities that decode to tags: `&lt;img ...&gt;`, `&#60;img ...&#62;`, `&#x3c;script&#x3e;`, `&amp;lt;b&amp;gt;`. Tags are restored before entities, so these come back as entities and render as the characters `<` and `>`, never as markup.
- `<br>` variants: `<br/>`, `<BR />`, `<br\n/>` become `<br>`; `<br / >` and `<br x>` stay text.
- Case: `<STRONG>x</strong>` and `<b>a</B>` format (the `i` flag applies to the back-reference), output lower case.
- `javascript:` as plain text is inert: there are no attributes.
- Random fuzz: 200,000 strings of up to 20 atoms drawn from `< > / b i em strong br & # x 3c ; lt gt amp " ' = on script img`, tab, newline and upper-case letters. No disallowed element or attribute in any of them.
- Cost: 200,000 characters after one unclosed `<b>` took 4 ms; 20,000 unclosed `<b>a` took 14 ms. No backtracking problem.
- Sinks: every `authorHtml` call (ncsc-brief, coverage form, end screen) puts the result in element content, none in an attribute.

### Forensic data platform rich text

Not changed by this branch beyond the shared escape import, but checked as asked. `cleanStyle` refuses `url(`, `expression`, `\75 rl(`, `u/**/rl(` and `position`/`z-index`, and an `&#59;` inside the attribute does not split a declaration. `sanitizeRich` held against `<img onerror>`, an `svg`/`math`/`mglyph`/`style` namespace mix, a `noscript` title breakout, a form-in-math reparse and `<a href="javascript:">` inside `<code>`. See n4 for the one gap.

### `showEndScreen`

The title and button are `textContent`; the body goes through `authorHtml`; `outcome` is only compared, never inserted. `body` set to `null`, `0` or a number renders as before (`''`, `"0"`). Live: the branch's test_simple_success end screen shows one `<strong>`, one `<br>`, the dash, and `<u>u</u>` as typed text.

### `safeVmPanelUrl`

Refused, as intended: `//evil.com/x`, `\\evil.com`, `/\evil.com`, `\/evil.com`, a leading space, U+0000, U+0001, U+000B, U+001F, U+00A0 or U+3000 before the scheme, `java\tscript:`, `JaVaScRiPt:`, `data:`, `blob:`, `ftp:`. Accepted: the server's own `/break_escape/games/<id>/vm_panel`, a bare relative path, `HTTPS://GAME.example/x`. A leading control character turns a scheme into a "relative" input, which then fails the origin test, so that path fails closed. See m1 for what is accepted that need not be.

The desktop app loads the game over the remote https page (only its offline page is a local file), so the same-origin test does not refuse the real panel there.

### gameDisplay html mode

Callers of `gameDisplay` in `public/`, `app/` and `lib/`: `systems/interactions.js` lines 823, 2019 and 2075 (plain mode, no options) and line 2059 (the one `html: true` caller, the read-in-place branch). At 2059 the observations, the text and the title each pass `escapeHtml(displayDashes(String(s)))` before the `<em>` is added; nothing else is concatenated in. No ink tag, scenario action or server response reaches `gameDisplay`: scenario `readDisplay: "gameDisplay"` routes to that same branch.

### Toast duplicate checks

`isQueuedDuplicate` reads the mode from `q[5]`, which is the caller's options for a new entry and `{html, verbatim}` for a toast pulled back by `holdRecentNotifications`; `findShownDuplicate` reads it from `el._toast`, which `renderNotification` now stamps with the same two fields. `toastRenderMode` folds `verbatim` to false under `html`, which matches what the renderer does. Missing or null options give plain, not verbatim, in all three places. No other callers.

### The swapped modules

Each removed local copy was compared with the shared helper. All but five were the same `String(value ?? '')` five-character form. The others:

- `blockchain-explorer`, `mixer-match-board`: chained `replace` with the same five characters and `?? ''`. Same output.
- `examine`: four characters (no `'`). Now also escapes `'`; only safer, and the result is element content.
- `phone-chat-minigame`, `phone-chat-ui`: `String(v)` without `??` in the minigame. Both call sites are guarded (`resolved.app?.title` truthy, `safeParams.title || 'Phone'`), so `null` never arrives. The added dash display is the intended q48 part 4 change.
- `text-file` content: was a `replace` chain on whatever `displayDashes` returned, so a numeric `fileContent` threw; now renders as the number. An improvement.
- `interactions.js` read in place: was three characters on `String(s)`; `String(s)` is kept, so `undefined` still reads `"undefined"` as on main.

`0`, `null` and `undefined` behave as before in every module.

### `window.__test.interact('success_terminal')`

Not a regression. Played on main through the main tree's keyless server on :3001 (game 1420, main at the merge base, clean tree) and on the branch through a keyless server from this worktree on :3048 (game 1427, stopped afterwards). On both, `interact` first returns `ok:false, reason:"minigame-active"` (the title screen, then the Mission Brief notes minigame) and then `ok:false, reason:"blocking-ui"` (the tutorial prompt). Once those are cleared, both return `ok:true, mode:"direct"` and the end screen appears; no page errors. The build's live run most likely called it before clearing them. See n1.

### Harness copy lists and the full JS suite

The full run under the shared lock did not get a turn: about a dozen full Rails and JS runs from other worktrees were queued on it for over half an hour, so it was cancelled. In its place, every test file the branch changed plus every file that names `escape-html.js`, `author-html.js` or any of the 29 engine modules importing them (176 of 508 files, so every harness that copies one of those modules) ran at `-j 2` with `bin/test-js`: 176 passed, 0 failed, no fixture retries. The files outside that set cannot load the shared helpers, so a missing copy list entry would show here. A full locked run before merge is still worth doing.

## Findings

### Minor

**m1. `safeVmPanelUrl` accepts an absolute http(s) URL to any host.** The same-origin test only applies to input with no scheme of its own. So `https://evil.com`, and also `http:evil.com`, `http:/evil.com` and `https:/\evil.com` (which read as relative at a glance but resolve to another host), pass, and land in the iframe `src` and the console link. The server only ever sends a same-origin path (`vm_panel_game_path`), so nothing needs a foreign host. Since the function exists as a second line behind the server, apply the origin test to every input, and return `parsed.href` rather than the trimmed source text so the iframe, the link and the check all use one parse. Add `http:evil.com` and `https:/\evil.com` to the refused list in `escaping-shared-helpers.test.mjs`.

### Nits

**n1. The backlog entry and build log say the `interact` ok:false was not investigated.** `docs/IDEAS_BACKLOG.md` (the escaping leftovers, item 3) and the build log's live-proof note can say instead that it was the title screen, Mission Brief and tutorial prompt still open, the same on main, and drop item 3.

**n2. A refused panel URL in Hacktivity mode shows the standalone card.** With `hacktivityMode` on and the URL refused, `buildVmDisplay` falls to the `this.vm.ip` branch and tells the player to start the VM in VirtualBox. It only happens on a misconfigured server, but a `console.warn` naming the refused value (escaped, or by length only) would make that case findable.

**n3. `?vm_title=` is appended with a bare `?`.** If the panel URL ever carries a query or a fragment, the title lands in the wrong place. Pre-existing; building the URL with `URL`/`searchParams` from the parsed value (see m1) fixes it in passing.

**n4. Forensic `cleanStyle` places no bound on sizes.** `font-size:9999px`, `font-size:calc(100vw)` and large margins pass. They cannot position or layer anything, so this is cosmetic, author-only and pre-existing; noted because the brief asked about the style path.

**n5. The end screen button's host links are not scheme-checked.** `shellReturnUrl` and `shellMenuUrl` go straight to `window.location.href`. They come from the host's `shell_links` hook (server config, JSON-escaped in the view), so this is the same class as the panel URL rather than a live hole. Pre-existing and outside this branch; a candidate for the same helper if one is made general.
