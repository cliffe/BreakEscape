# Reusability review, group C

Scope: episode-runner, engagement-report, intel-board, landing-page-builder, pretext-prep, title-screen (title art and missionTitleName only), and the person-chat video-call view. Reviewed at fbbee3b16, read-only. Line numbers are against that tree.

## Background that applies to all of them

- **Home game.** Apart from episode-runner and the title art, these are the social-engineering (SE) suite. Its first home is `lab_social_engineering`, and the awareness episodes reuse it. Eldritch Hacker has no scenarios yet (`planning_notes/eldritch_hacker/DIRECTION.md:35-36, 86-90` plans to re-skin the suite), so there is nothing in that game to test against.
- **Docs and schema.** Coverage is good. `README_scenario_design.md:1985-2008` (social block table and object types), `:2174` onwards (intel board), `:2407` (report), `:2740` (pretext), `:2765` (landing pages) and `:2791` onwards (awareness episodes). `scripts/scenario-schema.json` covers the override keys (`prepLabels` :3174, `engagement.report.strings` :556, episode `strings` :2235, `videoLabel`/`participantTag` :4196). `scripts/validate_social/*.rb` (about 7,900 lines) lints every block. This is better documented than notes and container.
- **Launch.** Every one of these opens from an object `type` (`systems/interactions.js:1075` case-file, `:1115` kiosk, `:1126` page-builder, `:1136` report-workstation). Pretext-prep also opens from an NPC or desk phone that carries a `callId` (`interactions.js:662-702`, `:755`, `:1534`). The established minigames work the same way. None of them, and no other minigame either, can be opened from ink: the `trigger_minigame` tag only logs and shows a toast (`minigames/helpers/chat-helpers.js:190-202`, "Actual minigame triggering would be game-specific"). Event mappings only open conversations (`systems/npc-manager.js:1253`). This gap is engine-wide, so it does not count against any one of these.
- **Lifecycle.** All the SE overlays extend `SocialOverlayScene` (`framework/social-overlay.js`). They register DOM listeners through the base `addEventListener`, so cleanup removes them. The Esc handler is removed at `social-overlay.js:163-169`. Child launches go through `launchChild`/`returnTo`. The framework runs one minigame at a time, so "two at once" never happens. The real question is two *objects* in one scenario, which is answered per minigame below.
- **CSS.** Everything is prefixed (`epr-`, `aw-`, `er-`, `ib-`, `lpb-`, `pretext-`, `title-screen-`, `person-chat-vc-`/`-pip`) and loaded on every page (`app/views/break_escape/games/show.html.erb:79-91`), with one exception (landing-page-builder, finding LPB-1).
- **Tests.** Each minigame already has reusability tests that check defaults stay unchanged: `test/js/social-reuse-intel-board.test.mjs`, `social-reuse-pretext.test.mjs`, `social-reusability-options.test.mjs` (report, landing page, episode flip), `social-video-call-label.test.mjs`, `title-screen-input.test.mjs` and `fingerprint-art.test.mjs` (title name and art, `has-art`), plus about 40 `social-*` model and overlay tests.
- **Stale backlog line.** `docs/IDEAS_BACKLOG.md:64` lists "the video-call bar" as hard-coded mission text. ENG-07 `videoLabel` has since fixed that, so the line can be updated.

---

## episode-runner — reusable with small fixes (for awareness-style training products); one episode per scenario is a design choice

No brand, company, NPC or episode-number literals anywhere in `minigames/episode-runner/*` (I grepped for every awareness company name, plus Tesseract, Meridian, HaX and SAFETYNET). Every stage panel's copy can be overridden: `strings.stages.<id>` (`episode-runner-minigame.js:490-496`), `stepLabels` (:542-546), `finished`, `finishedHeading`, `alreadySeen`, `sendOff`, `launchFailed` and `briefDone`. The flip and debrief defaults sit in override tables (`flip-view.js:49-66`, `debrief-view.js:40-56, 348-352`). State is `episode_<id>_state`, re-read on open, so reload and resume work (:268-284). Test seams are in `params.deps` (:221-227).

Findings, most serious first:

1. **One episode per scenario.** (Design choice.) `systems/episode-starter.js:20-27` reads the single object `social.awarenessEpisode` and refuses any kiosk whose `episodeId` doesn't match it. The runner falls back to the same key (`episode-runner-minigame.js:243`) when it reopens after a child. Two kiosks running two episodes in one map (an Eldritch Hacker hub, say) can't be done. Smallest fix: let the starter also look up `social.awarenessEpisodes[]` by `episodeId` and pass `episode` explicitly, then carry `episode` in `returnParams()` (:976-978) and in the `watchCall` reopen. Today's single-key path stays the fallback, so current behaviour is exactly preserved. It needs an owner decision because the validator (`validate_social/awareness.rb`) and the docs assume one block.
2. **The skin is hard-wired to `'awareness'`.** (Design choice.) Sort drill, concern form and privacy panel get it at `episode-model.js:156, 290, 372`, and triage at `episode-runner-minigame.js:996`. Triage only knows `'awareness'` or none (`systems/triage-starter.js:392`). A themed game (Eldritch, or a SAFETYNET skin) can't restyle the defend half. Smallest fix: `skin: episode.skin ?? 'awareness'`. That preserves behaviour exactly, but it only pays off once a second skin exists.
3. **A few lines can't be overridden.** (Safe refactor.) The reopen heading `'Finished'` (:718), `PAUSE_COPY` prompt/heading/next (:126-131, 404-414; only `strings.facilitator.pause` overrides the text), the brief card `Next`/`Back` (:122, 465-466), the region label and default title `'Exercise'` (:214, 318; `episode-starter.js:38`), and the step strip's `aria-label 'Progress'` (`step-strip.js:44`). Fix: route each through `this.strings.<key>`, keeping the current literal as the default. Behaviour is preserved exactly.
4. **Coupling: measurement.** Every defend round writes `se_awareness_records` through `systems/awareness-measure.js` (local global only, no network, xAPI base `breakescape.example`, :34). Harmless outside awareness, but a non-training game would collect records it never reads. No fix needed; worth knowing.

Other notes. The call watcher (`watchCall`, :1085-1139) deliberately outlives the runner: it polls every 300 ms for up to 4 h and stops itself when the runner reopens. That is intended, and it is keyed per episode id. Nothing uses the runner outside `awareness_*`.

---

## engagement-report — reusable with small fixes (for any scenario built on the SE suite)

Driven by `social.engagement.report` (items, steps, `onCompleteGlobal`, `panels`, `labelBy`, `strings`). It is rebuilt from globals on every open, so reload is safe (`engagement-report-minigame.js:18-22`). The validator knows the keys (`validate_social/board.rb:178`, `options.rb:139-150`). The workstation gate is `minigameData.requiresGlobal`/`lockedMessage` (README :2003). Used only in `lab_social_engineering` and `test_social_docs_proof`, so nothing outside its home uses it.

1. **Most of the table and status text can't be overridden.** (Safe refactor.) `DEFAULT_REPORT_STRINGS` (`report-model.js:27-34`) covers six keys. Still literal: `pageOutcomeLine` (`engagement-report-minigame.js:56-58`), `'Report filed.'` / `'n of m steps done.'` (:121-123), the mail table headers Target/Sent/Failed/Landed/First send landed (:156-160), `'No mail has been sent yet.'` (:177), `'Landing page'` (:182), the call outcome sentences (:205-212), `'Findings'`, `'Root cause'`, `'Control'`, `'Written up'`/`'Open'` (:284-309), `'Right:'`/`'Good:'`/`'Not quite:'` (:275, 335) and `'Results confirmed.'` (:351). A cult-setting report ("Ritual infiltration report") would still say "Campaign"/"mail" in the column heads. Fix: add these keys to `DEFAULT_REPORT_STRINGS` with today's wording, and to the schema at `scenario-schema.json:556`. Behaviour is preserved exactly.
2. **One report per scenario.** (Design choice.) There is one `engagement.report` block and one state key, `se_report_state` (`report-model.js:24`). A second report-workstation opens the same report. That is fine for a campaign wrap-up, so leave it unless a game needs per-chapter reports.
3. **The results panels are fixed to mail, pages and calls** (`report-model.js:35`, `RESULT_PANELS`). A DM/feed channel (Eldritch's cult layer) would need a new panel type. That is design work, not a parameter.

---

## intel-board — reusable with small fixes

Four modes (`recon`, `defender`, `scope`, `plan`) are picked per object by `minigameData.mode` (`systems/minigame-starters.js:1158-1175`). The board is rebuilt from `se_intel_*` and `target_ready_*` on every open (`intel-board-minigame.js:1-8, 108-120`), with picks saved as ids in `se_board_state`. `intelBoard.labels` (`board-model.js:14-33`) and `intelBoard.groups` (:36-45) are reuse options added already and tested. The validator checks `labels` and `groups` (`validate_social/board.rb:68-82`) and warns on a second defender board (README :2246). Used only in `lab_social_engineering` and the `test_social_*` fixtures. m09's `case_file` (`scenarios/m09*/scenario.json.erb:1650-1655`) only borrows the sprite.

1. **Section headings and prompts are literal.** (Safe refactor.) `'People'` (:607), `'Contacts'` / `'No one else has come up yet.'` (:705-707), `'From the call'` (:658, 741), `'Old or unverified'` (:750-754), `'Not yet found'` (:653), `'New since you last looked'` (:627), `'Stuck? Show me where to look'` (:681), `'Indicators to block'`, `'Block'`/`'Let through'` (:235, 261), `'Which mitigation would you put in place?'` (:316), `'Rules of engagement'`, `'Sort the scope cards'`, `'In scope'`/`'Out of scope'` (:426-467), the `'{name} is now ready to approach.'` live line (:149), the empty-state lines (:174, 214, 404, 443), and `NOT_IDENTIFIED` (`board-model.js:11`). The words are generic SE terms, but a re-skin can't change them. Fix: add these to `DEFAULT_LABELS` with today's text. Behaviour is preserved exactly.
2. **One board state per scenario.** (Design choice.) `STATE_KEY = 'se_board_state'` (`board-model.js:10`) and the fixed `se_intel_`/`target_ready_` prefixes. Two separate investigations in one map would share one board. That is acceptable for the suite's model, so it is noted rather than proposed.

---

## landing-page-builder — reusable with small fixes; one CSS leak to fix first

Each object names its page with `minigameData.landingPageId` (and optionally `targetId`), so several builders can coexist. Drafts and records are keyed by page id (`se_landing_drafts[pageId]`, `se_landing_pages[pageId]`, `landing-page-builder-minigame.js:24-27, 42-43`). Chrome text goes through `pageDef.strings` (`landing-page-model.js:160-164`), `pageDef.fieldLabels` (:757-762), `check.strings` (`landing-page-builder-minigame.js:74-82`) and a brand's own `logo` path (`landing-page-render.js:50-55`). The profile (`student`/`awareness`/`mission`) is data (:356). The `.example`-only domain guard (`landing-page-model.js:56`, N6b) is a safety rule and must stay in any skin (DIRECTION.md:90 agrees). Used outside the lab by `awareness_e5_signin_pages` and `awareness_e10_downloads_and_fake_checks`, through the episode build stage.

1. **The unscoped `.cc-*` rules override the OSINT browser's concept cards.** (Safe refactor; this is a real leak.) `landing-page-builder-minigame.css:78` (`.cc-button`) and `:496-508` (`.cc-card`, `.cc-panel`, `.cc-title`, `.cc-text`, `.cc-image`) are global. They redefine the same selectors as `osint-browser-minigame.css:79, 331-336`, and the builder's sheet loads later (`show.html.erb:80` vs `:86`). At equal specificity, the builder's `.cc-panel` background (`var(--ui-surface)`, dark in every theme at `ui-themes.css:46/91/136/181`), border and padding win inside the OSINT browser too. The OSINT `color: #1f2430` survives, so its yellow note cards should come out dark text on a dark panel. I reasoned this from the cascade and haven't confirmed it in a browser, so check it live. Fix: prefix the builder's rules with `.lpb-root ` (the root class, `landing-page-builder-minigame.js:438`). The builder keeps exactly today's look, and the OSINT browser gets back the styling its own sheet intends.
2. **The builder's "Case file" button ignores `intelBoard.labels.caseButton`.** (Safe refactor.) `landing-page-builder-minigame.js:576` has the literal `'Case file'`, but the OSINT browser honours the label (`osint-browser-minigame.js:170`). Fix: `this.social.intelBoard.labels?.caseButton || 'Case file'`. Behaviour is preserved exactly.
3. **Some chrome literals sit outside `pageDef.strings`.** (Safe refactor.) The step strip labels Pretext/Build/Score/Send/Inspect (:105-111), `RESULT_WORD` (:61), `GIVEAWAY_WORDS` (:66-73) feeding `giveawayLine`, `ALWAYS_TELL_ROWS` (:88-91), `DEFAULT_LOGOS` labels (:55-60), `'Why the page must match the story'` (:581) and the "You haven't found out what X would expect…" line (:572-573). `FIVE_HABITS` (:116) can already be replaced through the `five-habits` concept card (:1163). Fix: look each up through `pageString(pageDef, key)` with today's text as the default. Behaviour is preserved exactly.

---

## pretext-prep — reusable now (small polish)

Driven by the `social.pretextNpcs[]` entry named by `callId`. The wording uses `prepLabels` (`pretext-card.js:40-52`, schema :3174), fact labels use `intelFacts[id].label` (:32-37, 77-81), and the brief/ethics lines come from `brief.*` with a neutral fallback (:136-146). Mid-call reload goes through `pretext_<callId>_state` (`interactions.js:689-694`). Two calls in one scenario are fine, since everything is keyed by `callId`. Used outside the lab by `awareness_e3_helpdesk_reset` and `awareness_e12_visitor_tailgater`.

1. **A few button and gate literals.** (Safe refactor.) The Begin label `'Make the call'`/`'Approach'`/`'Begin'` (`pretext-prep-minigame.js:132`), `'Back to research'` (:168), `'Pretext card'` (:217-218), `'No blanks to fill. The lines are fixed.'` (:240), `'The call did not open.'` (:367), `'This call has no contact.'` (:127) and the gate line `'Choose an option for the X blank'` (`pretext-card.js:220`). Fix: add these keys to `prepLabels`. Behaviour is preserved exactly.
2. **Launcher wording assumes a desk phone.** (Safe refactor.) In `systems/interactions.js:677-681`, the "already have what X can tell you. Ringing back…" toast is titled `'Desk Phone'` even when the `callId` sits on an in-person NPC (:755). Fix: take the title and text from the call entry (`prepLabels.alreadyHeldTitle`/`alreadyHeld`), keeping today's text as the default.
3. **It needs the social engine.** Without `window.socialInfluence` the launch only logs a console warning and nothing opens (:665-668). Any scenario with a `social` block has the service, so this only bites a hand-built scenario. A `gameAlert` there would be friendlier.

---

## title-screen (title art and missionTitleName) — reusable now; the validator and docs lag

`titleScreenArt()` (`title-screen-input.js:89-92`) only takes a same-site image path. The server only passes `mission.json` `title_art` matching `title_art/<name>.(jpg|png|webp)` (`app/models/break_escape/mission.rb:97-102`, `show.html.erb:246-247`). With no art there's no `has-art` class, so other missions don't change (`title-screen-minigame.js:31-35`, tested at `title-screen-input.test.mjs:135`). `titleScreenName` falls back to `display_name` (`title-screen-input.js:79-83`). Timers and listeners are cleared in `cleanup()` (:220-240). The CSS is namespaced. Nothing outside `awareness_*` uses either key yet.

1. **The validator calls `titleScreenName` an error-prone unknown field.** (Safe refactor.) Running `scripts/validate_scenario.rb` on `awareness_e12_visitor_tailgater` prints "Top-level field 'titleScreenName' is not recognized in the schema — this field will be ignored by the game engine". That's wrong: `show.html.erb:244-245` reads it. Fix: add `titleScreenName` (string, at most 80 characters, matching the server's trim) to the top-level properties in `scripts/scenario-schema.json`. This removes the false warning and changes nothing at runtime.
2. **`title_art` and `titleScreenName` aren't in `README_scenario_design.md`** (no hits). A mission author outside awareness won't find them. The art's composition rule (keep the right 40% calm for the text, `title-screen.css:124-125`) lives only in a CSS comment. Fix: add a short subsection near the `mission.json` `scoring` docs (README :1563).
3. **The Hacktivity logo is a fixed asset** (`title-screen-minigame.js:37`). This is older code and outside the brief. Eldritch Hacker is also a Hacktivity Games title (DIRECTION.md "Positioning"), so it probably isn't a blocker. If a game ever needs its own logo, a `missionTitleLogo` config key with today's path as the default would preserve behaviour.

---

## Video call (person-chat `videoCall`) — reusable now

Generic, and already used outside awareness: `m02_ransomed_trust`, `lab_tesseract_trials`, `chat_minigame_demo` and `test-tesseract-probes`, as well as `awareness_e13_ai_assistant*`. The **self-view is the player's chosen sprite, not a fixed hooded one.** `person-chat-minigame.js:74-81` lays the character registry's player over `scenario.player`. The registry gets `chosenPlayerSprite()` = `breakEscapeConfig.playerSprite || scenario.player.spriteSheet` (`core/game.js:1760-1771`, `utils/player-avatar.js:26-28`), and the PiP renders that (`person-chat-ui.js:304-320`). The hooded `male_hacker_hood_v2` only shows when the player has no saved preference (`show.html.erb:232`). The world sprite works the same way, so the call matches the world. The `'hacker'` fallback (`person-chat-minigame.js:81`, `person-chat-ui.js:307`) only applies when there's no registry. `videoLabel`/`participantTag` override the bar (:274-283), and the schema and validator know them (`validate_scenario.rb:330`, schema :4196-4203). The timer and PiP renderer are torn down at `person-chat-ui.js:681-687`. phone-chat has no video-call code.

1. **`'LIVE'` and `'YOU'` are literal** (`person-chat-ui.js:267, 297`). (Safe refactor.) Fix: `config.selfLabel`/`liveLabel` passed through like `videoLabel` (`npc-manager.js:1270-1272`). Behaviour is preserved exactly.
2. **Event mappings are the only way to open one.** (Design choice.) `conversationMode: "video-call"` exists only in eventMappings (`npc-manager.js:1253-1272`). `timedConversation` (:336-341) has no `videoCall`, and talking to an NPC never opens one. A scenario that wants "the contact calls you at minute 3" has to fake it with an event. Fix: pass `videoCall`, `videoLabel` and `participantTag` through from `timedConversation`. Absent, nothing changes.

---

## Fix lists

**Safe refactors** (pure parameterisation; the defaults keep today's output):
- LPB-1: scope the builder's `.cc-*` rules under `.lpb-root`. This one is a bug fix for the OSINT browser; confirm it live.
- LPB-2: the builder's Case file button uses `intelBoard.labels.caseButton`.
- Schema: add top-level `titleScreenName` to stop the false validator warning.
- README: document `title_art` and `titleScreenName`.
- Add the remaining literals to the existing override tables: report (`DEFAULT_REPORT_STRINGS`), intel board (`DEFAULT_LABELS`), builder (`pageString`), pretext (`prepLabels`, plus the `interactions.js:677-681` toast), episode (`strings.*` for Finished, Pause, Next/Back, Exercise), video call (`LIVE`/`YOU`).
- Video call: pass the call fields through from `timedConversation`.
- `docs/IDEAS_BACKLOG.md:64`: drop "the video-call bar".

**Design choices for the owner:**
- More than one awareness episode per scenario (`social.awarenessEpisodes[]`), with the validator and docs following.
- A configurable episode or triage skin beyond `'awareness'`.
- Per-scenario singletons: `se_board_state` and `se_report_state` (one board and one report per scenario).
- Report panels for a DM/feed channel (Eldritch's cult layer).
- A real `trigger_minigame` ink tag. Engine-wide; it would give every minigame an ink launch.
