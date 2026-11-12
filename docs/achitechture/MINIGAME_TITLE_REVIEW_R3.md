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
