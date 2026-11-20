# Escaping (q47, q48): adversarial code review, round 2

Branch `build/escaping` against `main`, head `4ea6b7180` (R1 fixes). Read with `ESCAPING_BUILD_LOG.md` and `ESCAPING_CODE_REVIEW_R1.md`.

Counts: 0 blocker, 0 major, 1 minor, 2 nits.

## R1 findings

- m1 (VM panel URL to any host): fixed. `safeVmPanelUrl` now applies the origin test to every input and returns the parsed href. Probed with the page at `https://game.example/hacktivities/1-break-escape/play/mission/9`: `https://user:pw@evil.example/x`, `HTTPS://evil.example`, `https://game.example@evil.example/`, a leading U+0001 and a leading space are all refused; the server's `/break_escape/games/9/vm_panel` and a bare relative path pass, as the absolute same-origin href.
- n1 (backlog and build log on `interact`): fixed.
- n2 (refused URL in Hacktivity mode): fixed. The card says the console is not available, the VirtualBox steps are not shown, and the warning gives only the length.
- n3 (`?vm_title=`): fixed. `vmPanelUrlWithTitle` uses `searchParams`. One visible change: a space is now sent as `+` where `encodeURIComponent` sent `%20`. Rack decodes both to a space, and `vm_panel` looks the VM up from `params[:vm_title]`, so nothing changes on the server. No other repo builds or parses that query (checked Hacktivity, hacktivity-desktop and hacktivity-android).
- n4 (forensic font sizes): fixed for one element; see n1 below for nesting.
- n5 (end screen host links): fixed in `showEndScreen`; see m1 below for the host rule and n2 for the other exits.

## What was tried

### The absolute hrefs

`safeVmPanelUrl` and `safeShellUrl` now return absolute URLs where the raw config value was a path. Every consumer was checked for anything that compares or stores the value expecting a path:

- `window.breakEscapeConfig.vmPanelUrl` itself is unchanged (`show.html.erb` still writes `vm_panel_game_path`), so Hacktivity's `mission_page_alias_test.rb`, which matches that raw line, is unaffected. Only the launcher's own copy (`this.vmPanelUrl`) is absolute.
- The iframe `src`, the console `href` and the end screen's `location.href` are all resolved by the browser against the page anyway, so a same-origin absolute URL and the path load the same document with the same referrer. The `vm_panel` action does not look at the referrer; `user_not_authorized` deliberately ignores it.
- `client-platform.js` (Play app link routing, `openOutside`, `wantsOutside`) parses every href with `new URL(href, location.href)` before testing origin and in-app paths, so absolute and relative give the same answer.
- `main.js`'s iframe guard tests `window.self !== window.top`, not a URL.
- No test or engine module compares `iframe.src` or the link `href` with the config value. The two tests that did (`app-mode-exit`, `minigame-html-sweep-c`) were updated in R1 to expect the parsed href.
- In Hacktivity the game page lives at `/hacktivities/<event>/play/mission/<game>` and the panel at `/break_escape/games/<id>/vm_panel`: different paths, same origin, so the check passes. The desktop app loads the game from the remote https page (R1), so the same holds there.

Nothing found.

### Where the end screen's links come from

`shellReturnUrl` and `shellMenuUrl` come from one place: the host's `BreakEscape.configuration.shell_links` hook, read in `games#show` and written into the page with `json_escape`. They are not scenario data and not player input. Standalone Break Escape has no hook, so both are `null`. Hacktivity's hook (`config/initializers/break_escape.rb`) returns `play_event_operations_path` and `play_event_operation_debrief_path`: same-origin paths, never a full URL. `walkthroughUrl` (a game slot's `lab_sheet_url`) is the only shell link that names another host, and it does not go through `safeShellUrl`; Hacktivity's models already hold it to `https://` with a plain host name. See m1.

### `safeShellUrl` edge cases

`http:evil.com` and `https:/\evil.com` take the relative branch and fail the origin test; a leading control character does the same, so those fail closed. `https:evil.example` resolves to a path on the game's own origin (`.../mission/evil.example`) and is accepted, which is harmless. Anything with `scheme://` is accepted for any host, including `https://user:pw@evil.example/` and `https://game.example@evil.example/`.

The shell URL is now read when the end screen opens rather than when the button is clicked. `breakEscapeConfig` is written once by the page before the engine loads, so this changes nothing.

### Font-size clamp

`clampFontSize` holds a single declaration to px 8 to 48, em and rem 0.5 to 3, % 50 to 300 or a keyword, and drops `calc()`, viewport units, negatives, exponents and bare numbers. `!important` was already dropped by `SAFE_STYLE`. Scenario values in the repository are all 10px to 14px, so nothing in a real mission changes. Nesting gets round it; see n1.

### success-screen.js, game-over-screen.js and game-menu.js

Checked for author or server text reaching HTML:

- `ui/success-screen.js`: the title, body and button label (including `shellReturnLabel`) are all set with `textContent`. Its body is documented as plain text, and no scenario's `conclusionScreen` title or body holds a tag or an entity today. No HTML sink.
- `ui/game-over-screen.js`: every string is a literal, set with `textContent`. No HTML sink.
- `ui/game-menu.js`: the `innerHTML` templates carry only literals (`PAGES`, the controls table, the leave label, which is one of two fixed strings) and `UI_THEMES`, `HEALTH_STYLES` and `SIZE_STEPS`, which are module constants. The saved theme from browser storage is only compared, never inserted. `missionDisplayName` goes in with `textContent`. Shell URLs are never put in markup.

None of them carry author or server text into HTML. They do navigate to the shell links unchecked; see n2.

### Tests

Run without the lock, as the brief asks: every test file the branch changes, plus every file that names `escape-html`, `author-html`, `apply-actions`, the VM launcher, the forensic platform, `base-minigame`, `notifications.js`, `interactions.js`, the chat minigames, text file, NCSC brief, coverage form, success screen, game-over screen or game menu. 211 files, `bin/test-js -j 3`: 211 passed, 0 failed, no fixture retries. Rails code is unchanged on this branch, so no Rails tests were run.

## Findings

### Minor

**m1. `safeShellUrl` accepts an absolute http(s) URL on any host, which no source needs.** The comment above it reasons that the shell is the host's own page, so an absolute link may name another host. The only source is the host's `shell_links` hook, and Hacktivity's hook returns same-origin paths (`play_event_operations_path`, `play_event_operation_debrief_path`); standalone sends `null`. So `https://evil.example/`, `https://user:pw@evil.example/` and `https://game.example@evil.example/` pass where nothing legitimate ever needs them. This is the same case R1 m1 raised for the VM panel URL, and the same reasoning applies: the check exists as a second line behind server config, so it should allow only what the server sends. Suggest the same rule as `safeVmPanelUrl` (http or https, resolving to the page's own origin, parsed href returned), dropping the `hasScheme` branch, and updating the comment. In `escaping-shared-helpers.test.mjs`, move `https://hub.example/debrief` and `http://hub.example/debrief` to the refused list and add a same-origin absolute URL to the accepted one. If a future host really does need a shell on another origin, an explicit allowed-origins list in the config is safer than any host.

### Nits

**n1. Nested elements get round the font-size clamp.** `sanitizeRich` keeps `<strong>` inside `<strong>` and `<p>`, each with its own style, and em, % and the keywords `larger` and `smaller` compound. `<p style="font-size:3em"><strong style="font-size:3em"><strong style="font-size:3em">` keeps all three declarations (checked), giving 27 times the base size; three nested `0.5em` give an eighth. Author-only and cosmetic, as R1 said of the original gap. If it matters, allow px and rem only (rem does not compound; every scenario value is px), or drop `larger` and `smaller` and clamp em and % only on the outermost styled element. Margins and padding are still unbounded, as the build log says.

**n2. The other exits navigate to the shell links unchecked, and the success screen shows the shell label for a link the end screen would refuse.** `success-screen.js` `returnToMissions` (also the bond visualiser's EXIT MISSION), `game-over-screen.js` `mainMenu`, and `game-menu.js` `leaveTarget`/`quitToShell` all send `location.href` to `shellReturnUrl` or `shellMenuUrl` as given. `openNow` picks `shellReturnLabel` whenever `shellReturnUrl` is set, so a refused URL would still show "Debrief". The build log lists these as left. The source is server config (see above), so this is consistency, not a live hole; the success screen is the usual way a short episode ends, so it is the one worth doing first. Moving `safeShellUrl` into a small `utils/` module (the harnesses that stub `apply-actions.js` imports would need it in their stub maps) would let all four use one rule.
