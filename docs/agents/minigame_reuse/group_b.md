# Reusability review, group B: mail-client, osint-browser, authenticator, assistant-chat, password-guesser, examine

Read-only review, 2026-10-30. Paths are relative to the repo root. JS lives in
`public/break_escape/js/minigames/<name>/` and CSS in `public/break_escape/css/<name>-minigame.css`.

## Cross-cutting (applies to all six, and to every other minigame)

- **Ink and event-mapping launch do not exist for any minigame.** The ink tag `#trigger_minigame:<name>`
  only raises a notification (`minigames/helpers/chat-helpers.js:190-197`: "Actual minigame triggering
  would be game-specific"). Event mappings open only conversations (`systems/npc-manager.js:661-714`,
  `_queueScriptedConversation` with `sceneType` phone-chat or person-chat). The one route a scenario can
  use is an object `type` handled in `systems/interactions.js`. The established minigames (notes, password,
  container) work the same way, so this is a framework gap and not specific to group B. **Design choice:**
  make `trigger_minigame` call a registry of starters keyed by object type, passing the tag's params as
  `minigameData`.
- **Single instance.** `MinigameFramework.startMinigame` replaces the open minigame, so two instances
  never run at once. Every scene in this group cleans up through `MinigameScene.addEventListener`
  (`framework/base-minigame.js:234-245`) and `SocialOverlayScene.cleanup` removes its capture-phase Esc
  handler (`framework/social-overlay.js:161-169`). I found no listener, timer or DOM leak on close.
- **CSS loading.** All seven stylesheets load unconditionally on every game page
  (`app/views/break_escape/games/show.html.erb:23,71-92`), so nothing depends on an awareness-only page.
  Every selector in the six files is class-prefixed (`.mail-`, `.ob-`, `.cc-`, `.auth-`, `.ac-`,
  `.examine-`, `.epr-gs-`). I found no element, `body` or `:root` selectors.

---

## examine: reusable now

The engine opens it for any text-only object (`systems/examine.js:66-79`, called from
`systems/interactions.js:1738,1844`). The opt-out is `observationDisplay: "gameDisplay"`, which the
validator knows (`scripts/validate_scenario.rb:376`) and README documents (`README_scenario_design.md:528,751`).
It has no brand, mission or awareness coupling. It is stateless and well tested
(`test/js/examine-minigame.test.mjs`, 14 tests, scene and launch rules).

Findings (low):
1. Low. `systems/examine.js:118,129`: the "Examine" title fallback and the "Close" cancel label are fixed
   English. This only matters for a non-English game. Safe refactor: read the defaults from a constant;
   behaviour is unchanged.

Non-awareness use: any mission with a text-only object, for example m01_first_contact. No opt-in is needed.

---

## authenticator: reusable with small fixes

The room-object route already exists. `type: "authenticator-device"` (`systems/interactions.js:1105-1112`)
calls `startAuthenticatorDevice` (`systems/minigame-starters.js:1278-1295`), which takes `minigameData` and
an optional `setGlobalPrefix` that writes `<prefix>approved` and `<prefix>sent`. The schema lives in
`scripts/minigame-data-schemas.json` (`authenticator-device`), the lint in
`scripts/validate_social/authenticator_device.rb`, and the tests in
`test/js/social-reuse-authenticator.test.mjs` (9 tests). Learner-facing strings can be overridden through
`params.strings` (`authenticator-minigame.js:24,48-54,94-96`).

Findings, most severe first:
1. **Medium. In decision mode the player cannot leave until the approval plays.** `requestClose`
   (`authenticator-minigame.js:420-424`) and the Esc layer (`:166`) both route to `_backToChoosing` while
   `approvedAt === null`, so Close never exits until the player picks options and waits for the outcome.
   The episode beat wants this, but a phone object in a SAFETYNET or Eldritch room becomes a trap.
   Safe refactor: add an optional `minigameData.lockUntilOutcome` (default `true`, which keeps today's
   behaviour); when it is false, Close aborts.
2. **Medium. Labels that cannot be overridden.** The card detail labels `'Account'`, `'Time'`, `'Location'`,
   `'Device'` (`:397-400`), the `'Approve'`/`'Deny'` chips (`:405`), the burst summary
   "…and N more prompts in the same burst." (`:255`) and the aria labels (`:106,133,280`) do not go through
   `_str`. Safe refactor: route them through `this._str(key, default)` and add the keys to the `strings`
   schema. Behaviour is unchanged.
3. **Medium (docs).** `authenticator-device` is missing from the object-type table at
   `README_scenario_design.md:1997-2006`. README documents only the episode `mfa` stage (`:3163`).
   Safe: add a row covering `pushes/approvesAt` or `choice/pushTemplate/defenderNote`, `strings` and
   `setGlobalPrefix`.
4. **Design choice. Attacker point of view only.** `mode` is echoed into the result but never changes
   behaviour (`:74,427`), and the Approve/Deny buttons are inert `aria-hidden` spans (`:402-410`). A mission
   where the player is the target and has to deny an unexpected push (which suits SAFETYNET defence or an
   Eldritch victim beat) would need a new `mode: "target"` with live buttons and a result such as
   `{ denied, approved }`.
5. Low. `CHOICE_MAX_CARDS = 4` (`:46`) and `DEFAULT_STEP_MS = 1600` (`:43`) are fixed. `deps.stepMs` can be
   passed only from code. Safe: read `minigameData.stepMs` and `maxCards` with the current defaults.

Save/reload: no scene state is kept. With `setGlobalPrefix` the outcome persists as globals (approved is
never cleared, sent is a high-water mark). That is acceptable for a replayable demo.

Non-awareness use: **none**. No scenario under `scenarios/` uses `authenticator-device`; it appears only in
the test fixtures.

---

## osint-browser: reusable with small fixes

It launches from `type: "osint-workstation"` with `minigameData { siteIds?, start? }`
(`systems/interactions.js:1085-1092`, `systems/minigame-starters.js:1180-1198`). Content comes from
`social.osint`, which has a closed schema (`scripts/scenario-schema.json`, `socialOsintSite`) and a linter
(`scripts/validate_social/osint.rb`, which includes logo file checks at `:136-145`). README documents it
(`README_scenario_design.md:2001`). It degrades gracefully: with no `social.intelBoard` there is no Case
file button (`osint-browser-minigame.js:169`), and with no `intelFacts` every block reports "nothing".
Tests: `social-osint-browser`, `social-gap-osint-*`, `social-osint-address-bar`, `social-reuse-osint`
(fixture-based), `osint-friendface-logo`, `validator-social-osint`.

Findings, most severe first:
1. **Medium. The FriendFace brand is injected automatically and cannot be turned off.** `brandLogo`
   (`osint-browser-minigame.js:41-48`) gives `friendface.png` to any site whose name, title, url *or id*
   matches `/friend\s*face/i`. An explicit `logo` wins, but nothing can turn it off: `logo: ""` is falsy and
   falls through to the regex, and the schema types `logo` as string only. An Eldritch or SAFETYNET site
   with "friendface" in its id gets the corporate wordmark, and its title is hidden whenever `logoAlt` is set
   (`:333`). Safe refactor: treat `site.logo === false` (or `"none"`) as "no logo" and allow `false` in the
   schema. Every existing site keeps its current output.
2. **Medium. Learner-facing text that cannot be overridden.** `NOTHING` "Nothing here you can use." (`:50`),
   the `Noted:` / `Already noted:` prefixes (`:669,681`), `'Address'` (`:192`), the Tools strip
   `'Tools'`/`'Lookups'` (`:219-220`), `'People'`, `'All profiles'`, `'No profiles to show yet.'`
   (`:381-389`), `'Archive'` (`:371`), `'Document properties'`/`'Close properties'` (`:458,470,477`), the
   tools disclaimer and empty text (`:513,515`), and the hidden "Add to notes" hint (`:197`). Some keys are
   already overridable (`osint.title`, `pinLabel`, `tool.emptyText`, `intelBoard.labels.caseButton`). Safe
   refactor: an optional `social.osint.labels` map with today's strings as defaults, added to the schema.
   Behaviour is unchanged.
3. Low. **The page id `archive` has special handling.** A page with id `archive` is left out of the page
   nav and shown as a footer link labelled "Archive" (`:353,370-372`). This is undocumented, so an author
   who uses that id by chance loses the nav entry. Safe: document it, or move it to a `page.footer: true`
   flag and keep the id rule as the fallback.
4. Low. **`profile: "awareness"` is a magic value** that hides `document` sites and the tools panel
   (`osint-model.js:17-26`). It is data-driven but undocumented in the schema (`profile` is described as
   "for example 'student'"). Safe: document the value, or add explicit `allowDocuments`/`allowTools` keys
   that default from the profile.
5. Low. **One state global per scenario.** `se_osint_state` (`osint-model.js:10`) holds `visited` and `at`
   for every workstation. Two workstations with different `siteIds` share their visited list, so tool
   unlocks by `visited` carry across. `at` falls back safely when it names a site the second workstation
   does not show (`osint-browser-minigame.js:146-151`). This is acceptable; it is worth a line in README.
6. **Design choice.** The browser is a corporate-web skin (company site, social profiles, document
   properties). `planning_notes/eldritch_hacker/DIRECTION.md:86` already lists it under "re-skin well";
   re-skinning (frame art, fonts) needs CSS, because a scenario cannot set CSS variables.

Save/reload: state is kept. Visits and the last place are in `se_osint_state`, and facts are in
`se_intel_<id>` globals, written as they happen (`:261-274,715-724`).

Non-awareness use: `scenarios/lab_social_engineering/scenario.json.erb` and
`scenarios/test_social_docs_proof/scenario.json.erb`.

---

## mail-client: reusable with small fixes (for SE missions); a design choice for general email

It launches from `type: "mail_terminal"` (`systems/interactions.js:1518-1523`). The terminal is placed
after the lock check, so a locked terminal works. `minigameData { accountIds, defaultAccount, maxSends,
layout, readOnly }` is passed through (`systems/minigame-starters.js:1132-1156`) and listed in
`scripts/minigame-data-schemas.json`. Content comes from `social.mailClient`, `templates` and
`phishTargets`, under the closed schema plus `scripts/validate_social/mail.rb` (1,146 lines). There is a
README worked example (`README_scenario_design.md:2582-2608`). Theme hooks `--se-frame-image` and
`--se-chip-image` exist (`mail-client-minigame.css:25-26`). I found no brand names or scenario ids in the code.
Tests: about 20 `social-mail-*` files, including `social-reuse-mail` (readOnly, theme hooks, starter
pass-through).

Findings, most severe first:
1. **Medium. A read-only mailbox always closes as a failure.** `closeMode` returns `'abort'` when nothing
   has been sent and there is no episode `returnTo` (`mail-client-minigame.js:1128-1132`). A `readOnly`
   terminal can never send (`:311,643,707`), so every close is `{ aborted: true }` with `complete(false)`,
   which emits `minigame_failed` (`framework/base-minigame.js:99`). An evidence inbox in a SAFETYNET mission
   (the most likely reuse) would therefore report failure on every read. Safe refactor: return `'close'`
   when `this.params.readOnly === true`. No scenario uses `readOnly: true` today (grep of
   `scenarios/*/scenario.json.erb`), so current behaviour is unchanged in practice.
2. **Medium. Mail behaviour depends on the awareness block being present.** `dataOnlyText` returns `''`
   for a miss whenever `social.awarenessEpisode` exists, and otherwise falls back to the first failed
   factor's line (`mail-bridge.js:557`). The reply behaviour of a mail target therefore depends on whether
   the scenario is an awareness shell, and an author cannot choose it. The default landed reply
   'Thanks, received.' (`:554`) is also fixed. Safe refactor: add a `mailClient.missReplyFallback`
   (`"factor"` | `"none"`), defaulting to `"none"` when `awarenessEpisode` is present and `"factor"`
   otherwise, plus `mailClient.defaultLandedReply`. Behaviour is unchanged.
3. **Medium. No label overrides anywhere in the client.** Every chrome string is fixed English: the
   folder and toolbar labels (`mail-client-minigame.js:296-315`), Create account and Contacts
   (`:463-552,647-663`), the reader (`mail-reader.js:193,260,264,295-297,477,508-509,537,544`) and the
   composer (`mail-composer.js:855-1280`). The composer's SE-teaching copy ("Red flags", "Stuck? Show me
   where to look", "Write your reply. This one is judged", "Judged: landed") cannot be reworded for another
   tone, and DIRECTION.md:87 says Eldritch needs a DM/feed variant. The only existing hook is the reader's
   `detailsLabels` option (`mail-reader.js:92,315`), which no scenario path can reach. Safe refactor: an
   optional `social.mailClient.labels` map passed to the shell, reader and composer, with today's strings
   as defaults.
4. Low. **`_episodeMode()` is inferred, not declared** (`mail-client-minigame.js:361-363`). A room terminal
   with `maxSends` or `layout: "phone"` changes its close result shape (`sentIds`, `:1137`) and test state.
   This is harmless today but surprising. Safe: make it an explicit `episodeMode` param that the episode
   runner sets, with the inference as a fallback.
5. Low (docs). The README object table lists only `{ accountIds, defaultAccount? }` for `mail_terminal`
   (`README_scenario_design.md:2004`), but the schema also takes `maxSends`, `layout` and `readOnly`.
   Safe: add them.
6. Low. `se_mail_last_account` (`mail-client-minigame.js:56`) is one global per scenario. A second terminal
   whose `accountIds` do not include it falls back correctly to `defaultAccount` or the first account
   (`:126-128`). Acceptable.
7. **Design choice. Sending is phishing-only.** A composed message needs `social.templates` and a
   `phishTargets` entry and is judged by `systems/phish-rules.js` (README `:2608`). Ordinary correspondence
   with an NPC (a SAFETYNET agent replying to a contact) has no route beyond authored follow-ups. Supporting
   it would mean an unjudged "plain" send mode, which is a product decision.
8. **Design choice. Visual re-skin.** The `--se-frame-image`/`--se-chip-image` hooks can only be set from
   CSS. A scenario-level skin key would need an owner decision covering all the SE overlays together.

Save/reload: state is kept. `mailState` is owned and persisted by the scheduler (`window.mailScheduler`),
the last account is held in a global, and drafts persist (`social-mail-draft-persist.test.mjs`). It
degrades safely with no `social.mailClient` (`resolveAccounts` returns `[]` and the label reads "No account",
`:336`).

Non-awareness use: `scenarios/lab_social_engineering/scenario.json.erb` (also `test_social_docs_proof`,
`test_social_freetext`, `test_social_m5_channels`).

---

## assistant-chat: awareness-specific (launch only); the scene itself would be reusable after a small fix

The scene is clean and fully data-driven. It reads `params.config` and draws only the authored
`summarise`, `paste`, `draft` and `exchanges` sections (`assistant-chat-minigame.js:110-114`). Its schema
is documented in the header comment (`:8-31`), and every string goes in through `textContent`.

Findings, most severe first:
1. **High. No way to launch it outside an awareness episode.** The only caller is the episode runner
   (`episode-runner/episode-runner-minigame.js:655`, `launchChild('assistant-chat', …)`), which reads
   `awarenessEpisode.assistant`. There is no object type, no `window.start*` starter, and no entry in
   `scripts/minigame-data-schemas.json`. The config schema exists only under
   `#/definitions/socialAwarenessEpisode/properties/assistant` and is linted only by
   `scripts/validate_social/awareness.rb:925` (`assistant_checks(ep)`). Safe refactor (additive): a
   `type: "assistant-terminal"` branch in `interactions.js` and a starter that passes
   `minigameData.config` (or `minigameData.assistantId` pointing at a new `social.assistants[]`) as
   `params.config`, a schema entry reusing the existing assistant definition, and a README row. Episode
   behaviour is unchanged.
2. **Medium. Strings that cannot be overridden.** `'Strike out'`/`'Put back'` (`:230,237`), `'✓ Done'`
   (`:154`), the aria labels 'Summarise my emails' and 'Ask the assistant' (`:183,364`), 'Close' (`:91-92`),
   and the recap fallbacks (`:402,407`). Safe: route them through `config.labels`; behaviour is unchanged.
3. Low. Its result carries `episodeId` (`:410`), which is harmless outside an episode (it is `null`).
4. Low (CSS). The awareness accent colour is hard-coded (`assistant-chat-minigame.css:110`,
   `#2f6f5e`), not a token. Safe: `var(--ac-accent, #2f6f5e)`.

Save/reload: no state is kept. The scene warns the player instead (`:102-108`, `config.reloadNote`). This is
acceptable for a short authored beat.

Tests: `test/js/social-assistant-chat.test.mjs` (24 tests) drives the scene directly with `params.config`,
so the reusable surface is covered. Nothing tests a room-object launch, because none exists.

Non-awareness use: **none**.

---

## password-guesser: awareness-specific (launch and styling); the model is reusable

The model is pure and data-driven (`password-guesser-model.js`). Every learner-facing line goes through
`textFor(config, key)` with `DEFAULT_TEXT` (`:32-87`), and modes are a registry (`MODE_BUILDERS`, `:278`).
The params are documented in the header (`password-guesser-minigame.js:11-21`).

Findings, most severe first:
1. **High. No way to launch it outside an awareness episode.** It is opened only by the episode runner
   (`episode-runner/episode-model.js:562`, `kind: 'guess'` from `awarenessEpisode.guess`). There is no object
   type, no starter and no `minigame-data-schemas.json` entry. The schema sits under
   `socialAwarenessEpisode/properties/guess`, linted from `scripts/validate_social/awareness.rb` (the model
   header says "lint is in awareness.rb", `password-guesser-model.js:10`). Safe refactor (additive): a
   `guess-terminal` object type and a starter passing `minigameData.config` as `params.config`, with a
   schema entry reusing the `guess` definition. A SAFETYNET mission could then show a password-spray
   console fed by its own `se_intel_*` facts.
2. **Medium. Styling borrowed from the episode runner and the awareness skin.** Buttons get
   `epr-button aw-button` (`password-guesser-minigame.js:147`), which are styled by `episode-runner.css:60`
   and `awareness-skin.css:67`. The root defines its own `--aw-*` palette
   (`password-guesser-minigame.css:4-8`), and every class uses the `epr-gs-` (episode-runner) prefix. It
   works today only because all those sheets load on every page, and a change to the episode runner's
   buttons restyles the guesser. Safe refactor: copy the two button rules into
   `password-guesser-minigame.css` under `.epr-gs-root button`, and keep the class names so nothing visible
   changes.
3. Low. Default strings tied to the episode context: `unsupported` says "try the kiosk again"
   (`password-guesser-model.js:79`), `reuseRow` says "the work account" (`:45`), and the fallbacks
   `'another site'` (`:133`) and `'Account'` (`:255`) sit outside `textFor`. All except the last two can be
   overridden through `config.strings`. Safe: move those two literals into `DEFAULT_TEXT`.
4. Low. The fact source is fixed to the `se_intel_` prefix (`password-guesser-model.js:27,90-92`), the same
   one the OSINT browser and the mail composer use (`mail-composer.js:29`). This is consistent across the SE
   suite, so it is not a blocker.

Save/reload: no state is kept. The scene warns about this (`reloadNote`, `:37`). `config.landedGlobal`
persists the outcome (`password-guesser-minigame.js:217-234`).

Tests: `social-password-guesser.test.mjs` (35 tests, on inline fixtures and never on a live awareness file)
and `social-password-guesser-spray.test.mjs`. The model and scene are covered.

Non-awareness use: **none**.

---

## Summary table

| Minigame | Verdict | Launch routes today | Validator knows keys | Non-awareness scenario |
|---|---|---|---|---|
| examine | reusable now | automatic on text-only objects | yes (`observationDisplay`) | any (for example m01) |
| authenticator | small fixes | object `authenticator-device` | yes (schemas json + lint) | none |
| osint-browser | small fixes | object `osint-workstation` | yes (closed schema + lint) | lab_social_engineering |
| mail-client | small fixes (SE); design choice for plain email | object `mail_terminal` | yes (closed schema + lint) | lab_social_engineering |
| assistant-chat | awareness-specific (launch) | episode runner only | only inside `awarenessEpisode` | none |
| password-guesser | awareness-specific (launch, CSS) | episode runner only | only inside `awarenessEpisode` | none |

### Safe refactors (defaults keep today's behaviour)
1. mail: `closeMode` returns `'close'` when `readOnly` (no current scenario affected).
2. assistant-chat and password-guesser: room-object types and starters that pass `minigameData.config`, with
   schema entries reusing the existing definitions and README rows.
3. authenticator: `lockUntilOutcome` (default true); route card labels and the summary line through `strings`.
4. osint: `logo: false` turns the brand logo off; a `social.osint.labels` map.
5. mail: `missReplyFallback` and `defaultLandedReply` defaulting from today's `awarenessEpisode` test;
   a `social.mailClient.labels` map.
6. password-guesser: give it its own copy of the button CSS; move `'another site'` and `'Account'` into
   `DEFAULT_TEXT`.
7. Docs: add `authenticator-device`, and the `mail_terminal` `maxSends/layout/readOnly` keys, to
   README_scenario_design.md.

### Design choices for the owner
1. Should `#trigger_minigame` (ink) and event mappings be able to open any registered overlay? This is
   framework-wide.
2. Authenticator: add a target point-of-view mode (the player denies or approves)?
3. Mail: support an unjudged "plain" send for ordinary correspondence, and a DM/feed variant for Eldritch?
4. A scenario-level skin key for the SE overlays (frame art, fonts), since the CSS hooks cannot be set from
   JSON.
