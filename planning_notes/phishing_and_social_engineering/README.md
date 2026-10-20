# Phishing and social engineering: design plan

Entry point for the folder. Read this first, then `designs/00_data_contract.md`, which is the single
source of truth for shared shapes and ids and wins over any other doc where they disagree.

## What this is

A set of reusable minigames and systems, plus two scenarios built from them, that teach phishing and
social engineering attacker-first and defender second. The learner does the attacker's work (OSINT,
pretext, spear-phish, landing page, call), then sits in the defender's chair and reads the same attack
from the other side. Everything runs in the browser. There are no VMs in this strand.

The stance comes from Chothia et al., "Phishing Attacks: Learning by Doing" (ASE '18), and from Joe
Gray, *Practical Social Engineering* (No Starch, 2022): social engineering taught ethically, with
defence following from the attack.

## Products and build order

1. **The systems (docs 00 to 07).** Mail client, OSINT browser, intel board, rules engine, inbox
   triage, pretext dialogue, landing-page builder. Build them through the student lab.
2. **Student lab (`designs/10`).** `lab_social_engineering`, browser-only. It is the first shippable
   product and takes the module's one technical-lab slot. No VMs, no VM companion.
3. **SAFETYNET: Eldritch Hacker (game 2).** The same systems form its core. Its narrative is
   provisional and lives in `../eldritch_hacker/` (start with `DIRECTION.md`); this folder does not
   restate it. Rough fit: the Institute is the corporate layer (email, sender authentication, landing
   pages), the cult is the social layer (members' posts, gatekeeper, forum or DM). The OSINT browser,
   pretext call, intel board and rules engine re-skin directly. The mail client and inbox triage need a
   DM or feed variant, `senderAuth` is email-only, and the landing-page builder's weaponisation check
   must be repeated for each new skin.
4. **Staff-awareness product (`designs/11`).** Short role-based episodes for non-technical staff, under
   the separate "Incident Simulations: Critical Cases" line, on a neutral corporate skin. Built after
   the student lab.

SAFETYNET: Licence to Hack (m01 to m10) is a separate, VM-backed game. These systems are not added to
it.

## Documents

| Doc | What it is | Status |
|-----|------------|--------|
| `designs/00_data_contract.md` | Shared schemas, canonical "AccountingNow" dataset and typed intel facts, factor library, intel-to-factor map, ink and engine constraints. §8 influence global and thresholds, §9 channels and synced globals, §10 email-to-ink contract, template and slot schema, §10a email identities, §11 where data lives (`social`), §12 engine work, §13 settled values (authoritative where a value is listed) | Plan. Current. Contract for 01 to 11 |
| `designs/01_mail_client.md` | Mail client (inbox and compose), accounts and mailboxes, reply delivery, persisted inbox | Plan. Current |
| `designs/02_osint_browser.md` | OSINT browser: company site, social media, public documents | Plan. Current |
| `designs/03_intel_board.md` | Intel board: evidence tracker, readiness, defender mode | Plan. Current |
| `designs/04_phish_rules_engine.md` | Phish-judging rules and layered feedback (a system, not a screen) | Plan. Current |
| `designs/05_inbox_triage_defender.md` | Inbox triage: the defender mirror and the pre/post assessment | Plan. Current |
| `designs/06_pretext_dialogue_system.md` | Pretext and vishing dialogue, on the character's influence global (`00` §8), separate stories per channel with synced globals (`00` §9) and templates (`00` §10) | Plan. Current |
| `designs/07_landing_page_builder.md` | Landing-page builder, abstracted: a scored page model, never a working page | Plan. Current |
| `designs/10_lab_social_engineering.md` | The student lab scenario chaining 00 to 07 | Plan. Current; cut to one session |
| `designs/11_awareness_product_episodes.md` | Awareness episodes (attack then defend), measurement, privacy | Plan. Current |

## Key decisions

**A. Influence is the pretext score: one global per character, with configurable threshold
behaviours.** There is no separate suspicion meter and no aggregate `pretextScore`. Each social
character has one scenario global, `<character>_influence`, a signed integer from about -100 to +100.
The character's config lists thresholds and what happens at each: wary, refuses, reports (sets an
alarm global and ends the conversation), a channel-scoped lockout with an expiry, and an opt-in combat
hostile that is off by default. Ink often just gates options on the global. The bar UI shows the
score with the thresholds as icons and redraws whenever the global changes. Existing missions are
unchanged: m01 Derek still turns hostile through `#hostile` and m02's guards are not affected. (The live engine handles no influence-value tag today; the tag handling is new work in `chat-helpers.js`, `00` §8.)
Every change carries a reason, so the bar, the tells panel and the debrief draw on one stream of
`{delta, reason, line}`. Details are in `00` §8. (Replaces the earlier plan of a separate suspicion meter, then of storing the score in the NPC
behaviour state.)

**B. Channels: separate ink stories, shared globals.** A character reached by phone, in person and by
email keeps a separate ink story per channel, because the dialogue is naturally different in each.
Influence and any other variable that must hold across channels are scenario globals, kept in sync
with each story's ink variables by the existing name-keyed mechanism (a global declared in
`globalVariables` and as a `VAR` in each story). A character entry lists the synced variables. There is
no single story and no channels list on one NPC record. Email-only characters get a headless record so
they exist without a loaded room. Intel from OSINT and earlier conversations arrives as `se_intel_*`
globals that unlock credible claims. A new copy of `neye-eve.ink` is the worked example (`00` §9). (Replaces the earlier idea of one ink
story per NPC serving every channel, switched by a `channel` variable.)

**C. Email replies are written by ink (decided 2026-10-20).** The rules engine judges the message and writes the
result into the target's ink variables. The NPC's `on_email` knot then writes the reply, moves
influence with a reason and fires outcome tags. The checklist (the teaching layer) shows at once; the
reply (the diegetic layer) arrives after a delay (`00` §10, `01`).

**D. Messages are composed from templates with blanks (decided 2026-10-20).** The player composes from
templates such as "I'm your new manager, [name]" and fills each blank from evidence they have collected
(intel-board facts, OSINT finds). A template never pre-fills or hints an answer the player has not found.
The scorer judges the slot values, not free text, so there is no fragile text matching and no guessing at
the format the scorer wants. Free text, if allowed at all, is unscored flavour. This applies to email
(`01`, `04`, `00` §10) and to dialogue claims (`06`).

**E. Visual style (decided 2026-10-20).** In-world pictures are pixel art. Text the player must read or
compare stays in a readable sans-serif, so look-alike domains behave as they do in a real browser. Real
tools keep their own look. The bundled face is Atkinson Hyperlegible (Regular and Bold, SIL OFL 1.1), and it
covers every string the player reads or compares, domain chips and feedback lines included (`00` §6). Details are in `01`, `02` and `07`.

**F. Player identities: email first, phone later (decided 2026-10-20).** The mail client has player
accounts (given, found or created, unlocked by globals). A sent message records the real account used
separately from the display name shown in From, so a spoofed display name and a real account are
different things. Sender authentication follows the real account's domain, replies return to that
account's mailbox, and the ink is told which account was used. Phone identities (several phones, a
`caller_id`) are future work for Eldritch Hacker (`00` §10a).

**G. Student lab fits one session (decided 2026-10-20).** The lab must fit a single 60 to 90 minute
session, with a target of about 75. Scope is trimmed (fewer targets, stages moved or dropped) rather
than split into two labs. Richer assessment is out of scope for now (decision R).

**H. Role swap belongs to the awareness build (decided 2026-10-20).** The "play the helpdesk analyst"
role swap is specified and built in the awareness product (`11` N15). The student lab and `06` do not
carry it. (Settles the earlier disagreement between `06`, which put it after the first slice, and `11`,
which wanted it in the first slice: `11` keeps it and `06` defers to it.)

**I. Shared contract values (decided 2026-10-20).** `00` §13 lists the values several docs must match:
one link id per built page (`kit_payroll_page`), the `mode` board pointer, readiness set at grant time,
real-minute lockouts stored in globals, the triage set size per audience, and the six-domain menu with an
auth row for each. Attachments and links are chosen with the Attach control, never as blanks.

**J. Contract settlements (decided 2026-10-20).** Details are in `00` §13.
- The lab ships two mail accounts, `guest` (can spoof) and `freemail` (created, cannot spoof); `jed_pc`
  is a non-lab example. Reply delay is 15 s for all three lab targets.
- Sender authentication carries a `dmarcPolicy` (`none`, `quarantine`, `reject`) on the claimed domain.
- An empty blank blocks Send with a neutral line that never names the evidence.
- Engagement items carry a `step`; a step is done when all its items are correct. Plan mode has two
  single-select picks (objective, measure), each with exactly one correct option.
- Pretext calls can be reopened while asks remain; outcome and lowest-influence globals hold the latest
  call, and grants accumulate.
- Band flags such as `dev_wary` are recomputed on every influence change and cleared at the threshold
  plus the re-arm margin; `recoverTo` must be at least the highest effect threshold plus that margin
  (counting only thresholds that fire below their value; Dev and Priya: -30). Lockout lives in globals, and is checked before the pretext card opens.
- The victim record is written on every send that carries a landing page; check missions conclude on
  their triage global so the carry-over finds a baseline; `call` is a supported non-email triage kind.

**K. Further contract settlements (decided 2026-10-20).** Details are in `00` §13.
- A replayed `playerSent` message is the latest sent record to the target whose tells include
  `senderTrust` or `senderAuth` (if none, the latest with any tells), so a later freemail retry does not
  shadow the student's spoof. A target with an `expectedLink` requires `linkCredible`, so a send with no
  page fails it. The victim
  record keeps its best outcome, so a later non-landing send does not erase an earlier success.
- A call records `reported` if it ended in a report, otherwise `got_it` if any ask was granted, otherwise
  `walked_away`; `pretext_call_done` is set by any granting ask. A threshold-to-band rule gives ink its
  band numbers.
- `applyActions` keeps emitting `global_variable_changed` on every call; change-only emission is for
  `grantFact` and the social paths.
- Concept cards live in `social.conceptCards`; the real-brand lint covers domain and address fields and concept-card text, not all prose. The defender
  facts are exactly four. The page builder launches only for a target in the page's `targets` map.
- CI gains a social-lint mode (`--strict-social`) and a job with both Ruby and Node. Check and episode
  mission shells have a host NPC, write their result globals with `deferEmit`, sync and then emit the done event, and carry an aim.

**L. The open check: From and Subject (decided 2026-10-20).** A target has to open a message before its
content matters. It opens when the sender passes `senderTrust` or the chosen subject's `topic` is among
the target's `interests.topics`; `landed` needs it, and the checklist's first row says whether it would be
opened. The subject wording is still not judged (the earlier default stands), but its topic now matters.
Each closed target is offered one subject it does not open. Details are in `00` §2 and §7, `04`, `01`.

**M. Template choice and feedback (decided 2026-10-20).** Templates follow credible phishing, and a send
is not guaranteed to land. A target offers two to four pretext templates, at most two blanks each, with a
plausible wrong one (Pierce's overdue supplier invoice, Lord's password notice). Blanks still offer only
held facts, stale ones included. Targets differ in the topics they open, the senders they trust and what
they act on, and the character says in their own words why they did not trust a message, which is the
player's feedback. The same holds for calls (`06`: two to four choices, at most two blanks). `00` §10, `04`.

**N. Reply controls, chasers and checklist timing (decided 2026-10-20).** A thread shows either "Choose a
reply" (short ink options, unscored) or "Write your reply. This one is judged" (a template composer for
tasks that draw the character out, started by `#compose_reply:<targetId>`), never both. Normally one reply
per send; the ink may queue one later chaser (`#mail_later`) and a scenario can drop timed mail
(`deliverAt`). In assessment mode the checklist waits for the reply (`checklistTiming: "withReply"`); in
training, and in the lab, it shows on send. `00` §10, `01`.

**O. Mailboxes, devices and found mail (decided 2026-10-20).** There is no single inbox. Each device (a
fixed or takeable `mail_terminal`) lists the accounts it offers. A laptop that holds a found account
shows that character's mail history and lets the player reply as them; the player can also carry their own
client in inventory. Marked words in a message can be saved as evidence (granting a fact) or sent to the
notepad. A password-locked device uses the ordinary object lock, so found credentials need no screen of
their own. There is still no reply-to slot. The lab ships none of this and keeps its two accounts.
`00` §10a, S14, `01`.

**P. No language model in the game (decided 2026-10-20).** The advisory LLM note is dropped. The judge,
replies, feedback and hints are authored data or ink. `00` §7.

**Q. Influence bar visibility (decided 2026-10-20).** The number is shown with the bar in training and
assessment alike, and the bar also appears on the character's world sprite once its value has changed, so
the player can steer away from pushing it too low. One bar per character; a second social meter only if
research supports it and the player would understand it at once. The modelled helpdesk policy stays
deliberately weak and is labelled weak, with callback to the number on file as the defence. `00` §8, S13,
`06`.

**R. Student lab, triage and awareness answers (decided 2026-10-20).**
- Failed phishing in the lab: free, unlimited retries as rehearsal; no heat limit (`10`).
- Richer assessment and Hacktivity scoring: out of scope for now (`10` §4). Aggregate group size for the
  awareness product (A4) and hosting and learner privacy (A7) are also out of scope for now.
- The SPF-breaks-on-forwarding message stays in the lab triage, with a banner, word-and-colour results and a
  plain caption so it reads clearly (`05`, `10`).
- Lab sheets and walkthroughs for all labs and scenarios are written last, after practically everything
  else is complete.
- Legal framing: UK Computer Misuse Act 1990 plus a generic "equivalent laws elsewhere" line; the cast
  surnames Pierce, Lord and Hampshire stay.
- Collection label: a new `lab_games` collection for this lab and `lab_tesseract_trials`, both of which are
  a new kind of lab game. No platform code changes; the missions index titleizes the label (`10` N6).
- Spare time in the lab: extension content that uses the core mechanisms and minigames comes first (a
  second triage round, then indicator tagging in the profile, then the stand-alone header quiz and the DMARC
  simulation), per `10` OQ9.
- Pre/post score lives in `gameState.globalVariables` for the lab and Eldritch Hacker, with a server-side
  record only if the awareness product is productised; the pre-test shows feedback at the end of its round
  (`05`).
- Awareness: E7 (deepfaked-voice CEO) ships as an optional episode; no pilot of the pre/post measurement and
  no effectiveness claims (A3); hosted service sold commercially (A5), with PixelLab's terms checked once
  before release (`11`).

**S. Builder brand templates (decided 2026-10-20).** In the student lab a brand may copy the sign-in look of a
real, popular open-source tool, and its page may show that tool's name. Every domain, address and account stays
fictional and ends `.example`, and the lint keeps the real name out of domain and address fields (`07` §1, §5).
Awareness keeps fictional brands only (`07` §7). Per the user's note, the template build goes to a Haiku agent,
so these docs give the game-level rules and no build detail.

**T. Builder captures are simulated, and the player's input is never read (decided 2026-10-20).** A submitted
sign-in adds an authored, fictional note to the player's notes (`07` §5 and N11, `00` §11a). It is a scenario
record: nothing the player types is read, and the page record keeps ids and booleans only. The metrics line stays
Visits and Submissions, and reports are still not measured (`10`).

**U. Padlock teaching line confirmed (decided 2026-10-20).** The line in `07` §3 stands as written. Checking the
wording against current browsers is a pre-ship task.

Defaults taken elsewhere, for context: fictional targets only, no real-staff OSINT; the
lab is the first slice; the awareness product measures pre and post from the start and defers LMS and
SSO integration.

## Pretext dialogue

`designs/06_pretext_dialogue_system.md` runs on the character's influence global (`00` §8), separate
stories per channel with synced globals (`00` §9), and template blanks for its lines (`00` §10). Where `00` and `06` differ, `00` wins.

## Open questions

Working defaults are taken for all of these; none blocks the design. The answered items are recorded under
Key decisions (L to U).

**Rules engine (`04`)**

- How strict is the coherence gate before it frustrates (default: lenient, tune in playtest)? Should a `redFlag` string be mandatory per factor per target (default: no; the validator warns on a mismatched override)?

**Pretext (`06`)**

- Should a report without a lockout also recover over time, or only on a scenario beat (`06` OQ4)? Default: channel lockout with an expiry and reset.
- Smaller working defaults are listed in each doc's own open questions. Decided, so not open: unscored free text is off in this build (`00` §13).

**Landing-page builder (`07`)**

- Homograph shown in the student lab only, as one authored example? Default: yes.
- Template brands: artwork. Default: a pixel redraw of the tool's layout and colours, with no copied logo artwork. Alternative: the tool's own logo. This carries the trademark risk, so it needs a decision before the first template ships.
- Template brands in the awareness product (`11`)? Default: no, fictional brands only (`07` §7). Alternative: templates there too, which needs a view on the commercial release (decision R).

**Awareness product (`11`)**

- A2. First-slice episode order? Default: E1 finance, then E5 login page and E3 vishing.
- A6. A defend-only variant of each episode for customers who dislike the "write a phish" beat? Default: yes.
- A8. Pre/post ordering and strictness. The platform does not order missions or stop a second pre-check game, and `CarryOver` uses the newest concluded run. Default: the organiser sequences the check missions, a missing baseline is shown as such, and product copy claims nothing stricter.

## Engine work, consolidated

Everything new that the plan needs, once, with the code that has to change. Paths are under
`public/break_escape/js/` unless stated. `00` §12 holds the full detail for S1 to S14; the other
numbers are the owning doc's N-items. Nothing here is built yet.

| Area | Work | Owner | Code location |
|------|------|-------|---------------|
| Ink externals | Bind the social externals once in `InkEngine` with no-op defaults, so the phone preload, bark path, dry runs and mail runner can load stories that declare them; add tooling stubs | `00` S1 | `systems/ink/ink-engine.js`; `phone-chat-conversation.js` (`setupExternalFunctions`, used by both chats), `person-chat-minigame.js`, `phone-chat-minigame.js`; `npc-manager.js` bark path; `scripts/ink_runtime_check/` |
| Global sync | One shared global writer (write, broadcast, emit; a `deferEmit` option lets the triage starter write, then await `stateSync.syncConfirmed()`, which re-issues the PUT with a fresh `clientTs` through the single-flight queue until the server confirms (resolving true when there is nothing to send), and only then emit; `_syncOnce` reports success); the writer also writes each changed global into the open conversation's engine, which is not in `inkEngineCache` used by `applyActions` (which keeps emitting on every call) and by the change-only social paths; engine-set variables written after restore and sync in every loader; `email_` set excluded from saved ink variables | `00` S3, S7 | `systems/apply-actions.js`; `systems/npc-conversation-state.js`; `person-chat-minigame.js`, `phone-chat-minigame.js`; `state-sync.js` (`sync`, `_syncOnce`, lines 286-326) |
| Influence | Watcher on the influence global, write path with reasons, threshold effects and latch, `npc_influence_changed` event, and the `#influence:N`, `_gained`, `_lost` and `#report` tags handled once in the shared tag processor (social characters only; none is handled by the live engine today) | `00` S5, `06` N9 | new `systems/social-influence.js`; `chat-helpers.js` `processGameActionTags`; `phone-chat-conversation.js` (`person-chat-conversation.js` is not loaded) |
| Influence UI | A DOM influence bar with threshold icons and the number, tells panel, render-only phone bubbles, portrait tint hook; a world-sprite influence pip shown while the value differs from its start | `00` S4 and S13, `06` N4 | `person-chat-ui.js`, `phone-chat-ui.js`, `person-chat-portraits.js` (not the unloaded `systems/npc-health-bar.js`); new `ui/npc-influence-pips.js` modelled on `ui/npc-health-bars.js`, created in `core/game.js` beside `window.npcHealthBars` (about 1679) with its `update()` called beside line 2164 |
| Lockout | Stored in the declared globals `<character>_lockout_until` and `_lockout_channel` (no separate record, no server section); "will not talk" refusal checked in person-chat, phone-chat, mail and before `pretext-prep`; the lift writes `recoverTo` silently and clears the band flags; opt-in combat hostile left as is | `00` S10 | `systems/interactions.js` NPC sprite branch and the `phone` `callId` branch (placed above the line-1355 phone gate, which admits only `text`, `voice` or `npcIds`); `systems/social-influence.js`; phone-chat and mail entry points |
| Records without a room | Headless email records registered at start, and the ink endpoint finds them; display-name ties prefer the conversation's own NPC | `00` S2, S8 | `systems/npc-lazy-loader.js`; `core/game.js`; `app/controllers/break_escape/games_controller.rb` ink lookup; `systems/npc-manager.js`; `app/models/break_escape/game.rb` (`find_npc_in_scenario`, `scenario_npc_ids`); `scripts/validate_scenario.rb` (phone checks, ink file collection, the `room['npcs']` iterations) |
| Mail | Mail client minigame with accounts, account creation, switcher, Sent folder and drafts, the open-check row, reply options and judged replies, checklist timing; devices (fixed and takeable `mail_terminal`; its branch goes after the generic lock check in `interactions.js`, and the unlock endpoint for a takeable item needs confirming), found mailboxes with history and highlights; mail scheduler (ink, text and seed jobs, chasers) and runner; notification and message-list renderer; `mailState` persisted (client export and flush, server sanitiser and caps, bootstrap, restore) | `01` N1 to N18, `00` S6, S9, S14 | `minigames/` (new); `systems/npc-manager.js` tick loop (`_checkTimedMessages` is the model); `state-sync.js` `KEYED_SECTIONS`, `confirm()`, `flush()` and job change detection by job ids only; `games_controller.rb` `merge_last_write_wins_sections`; `app/models/break_escape/game.rb`; `core/game.js` |
| Templates | Template and slot composer, blank picker from held facts, send gate; slot judge with `linkInfo`; the open check (sender or subject topic) | `01` N10, `04` N1 to N12, `06` N6 | new; `systems/phish-rules.js` |
| Intel | Typed intel facts; `se_intel_*` declared; `grantFact` and `evaluateReadiness` set `target_ready_<id>` and `osint_done` at grant time; facts added as notes | `00` §1, §4, §5, `02` N2, `03` N3 | `systems/social-intel.js` (new); `systems/apply-actions.js`; `window.addNote` in `notes-minigame.js` |
| OSINT, board | OSINT browser (picked lookups, selectable metadata, namesake and archive elements); intel board with modes (scope, plan, recon, defender) | `02` N1 to N9, `03` N1 to N6 | `minigames/` (new) |
| Pretext | Judge, `PretextSession`, `pretext-prep`, debrief in the chat overlay, completion payload and per-call globals | `06` N1 to N12 | `minigames/pretext-prep/` (new); `systems/pretext-judge.js` (new) |
| Triage | Inbox-triage minigame and scorer (unit tests `social-triage-scoring`); read-only `mail-reader` shared with the mail client; `playerSent` message kind reading `tells`; non-email kinds including `call` | `05` N1 to N11, `01` N5 | `minigames/` (new) |
| Landing page | Builder, scorer, DOM/pixel layered renderer (text in the sans-serif), persisted pages, `linkInfoFor`, validator lint (allowlist plus denylist, ASCII on raw text) and a runtime guard | `07` N1 to N11 (with N6b) | `minigames/` (new); `scripts/validate_scenario.rb` |
| Lab | Engagement report builder, metrics read from `mailState`, board mode data, validator work, ink externals | `10` N1 to N8 (N6: non-VM mission configuration, `secgen_scenario: null` and the new `lab_games` `collection` label, also applied to `lab_tesseract_trials`) | `minigames/engagement-report/` (new); `db/seeds.rb` lines 67 to 71; see `10` |
| Awareness | Episode runner, flip view, defend sets, measurement store, facilitated flag, non-email surfaces, role swap, shell host NPC and flushed done event | `11` N1 to N16 | `minigames/` (new); see `11` |
| Minigame framework | Wiring checklist per minigame (including the sprite preload line in `core/game.js`); return-to for nested overlays (`00` S12; `startMinigame` ends the running one); `requiresKeyboardInput` and an own Close control on every overlay | README Conventions | `minigames/framework/minigame-manager.js`, `base-minigame.js`; `minigames/index.js`; `minigame-starters.js`; `systems/interactions.js` |
| Objectives | A global cannot complete a task or open a lock; use `eventMappings` on `global_variable_changed:<name>` with `completeTask`, or `#complete_task`. An aim's `unlockCondition` is truthy or `equals` only; an `eventMappings` condition on `global_variable_changed:<name>` accepts numeric comparisons (`value >= 60`). A boolean is still the simpler contract | all | `systems/objectives-manager.js`; `systems/npc-manager.js` event mappings |
| Fonts and CSS | Atkinson Hyperlegible (Regular and Bold, OFL 1.1), self-hosted, declared in `css/fonts.css` as `--se-font-readable`, used for every string the player reads or compares; authored domains rendered raw, not through `displayDashes` | `07`, `02` | `public/break_escape/assets/fonts/`; `css/fonts.css` |
| Validator and schema | Top-level `social`; `social.characters` lints; `_influence`, `_latched` and every `setGlobal` effect global declared and not imported; `se_intel_*` declared; template and slot checks; `on_email` and `email_*` checks; `minigameData` schema entries; `npcType` unchanged; lockout lint; the single "Lint field list" (`00` §11). The validator exits 1 on structure, schema and ink compile errors and on bad arguments, otherwise 0; `--strict-social` also exits 1 on social lint errors. CI (`.github/workflows/ci.yml`): one job with Ruby (`ruby/setup-ruby`, the sqlite3 apt packages and `BUNDLE_BUILD__SQLITE3: "--enable-system-libraries"`, as the existing jobs) and Node 20 with jsdom; `package-lock.json` un-ignored (`.gitignore:43`), regenerated and committed so `npm ci` works; Node tests run as `bundle exec node --test test/js/validator-*.test.mjs test/js/social-*.test.mjs` and fail rather than skip; the unit tests `social-phish-rules`, `social-triage-scoring`, `social-pretext-judge`, `social-intel` and the safety tests `social-landing-page-model`, `-render`, `-guard` and `social-osint-address-bar` (plus a `test:social` script); validator tests call lint functions in-process or use `--no-graph --skip-ink`; a loop over only scenarios with a `social` key with `--strict-social --no-graph --skip-ink` that must not rewrite tracked files | `00` S11 and each doc | `scripts/validate_scenario.rb` (`known_top_level`), `scripts/scenario-schema.json`, `scripts/minigame-data-schemas.json`, `.github/workflows/ci.yml`, `.gitignore`, `package.json` |
| Platform (not BreakEscape) | Per-student report or richer score recording, if an assessment ever needs more than task and aim share | out of scope for now | Hacktivity `app/jobs/game_scoring_job.rb` |

## Design pillars

- **Learn the attack to learn the defence.** Every attacker mechanic has a defender mirror: craft a
  spoofed sender, then read a `Received` or SPF header; write a pretext, then spot one; clone a
  landing page, then check a URL and a certificate.
- **Deterministic, legible feedback.** The game judges every action against explicit rules and shows
  which factor passed or failed, never a silent pass or fail. Judging happens in the game, where it
  can be explained instantly.
- **Fun and educational, not hard.** Short loops, clear goals, a visible checklist, escalating hints,
  no dead ends.
- **Model, don't weaponise.** The minigames teach the reasoning (who to target, what pretext, which
  red flag). They produce no working malware, credential harvesters or operational tooling. Real tools
  (Recon-ng, theHarvester, Hunter, SET, Gophish, Maltego) are named and explained at concept level, as
  in-world flavour, never as runnable kit. A design that would work as a real phishing kit is a blocker.
- **Reusable systems.** Each minigame is a standalone engine component that a scenario wires up with
  JSON, the way `biometrics`, `person-chat` and `flag-station` already work.
- **Ethics and authorisation up front** (book Ch. 2). Every scenario frames the activity as authorised
  and scoped and carries a short consent beat. Targets are fictional companies and people.

## Mapping to *Practical Social Engineering*

| Book chapter | Where it lands |
|--------------|----------------|
| 1 What is Social Engineering? | Framing across lab and episodes; pretext dialogue (06) |
| 2 Ethical Considerations | Ethics and authorisation beat in every scenario (10, 11) |
| 3 Preparing for an Attack | Lab stage 1 "scope and plan"; the scoping worksheet (App. A) as an in-game brief |
| 4 Gathering Business OSINT | OSINT browser (02), company-site layer |
| 5 Social Media and Public Documents | OSINT browser (02), social and document-metadata layer |
| 6 Gathering OSINT About People | OSINT browser (02) and intel board (03) |
| 7 Phishing | Mail client (01) and rules engine (04) |
| 8 Cloning a Landing Page | Landing-page builder (07) |
| 9 Detection, Measurement, Reporting | Lab stage "metrics and report" (10); reporting template (App. B) |
| 10 Proactive Defense | Inbox triage (05); awareness episodes (11) |
| 11 Technical Email Controls | SPF/DKIM/DMARC layer in triage (05) |
| 12 Producing Threat Intelligence | Intel board defender mode (03); lab capstone (10) |

## Build order within the systems

1. Mail client (01), rules engine (04), intel board (03): the core loop (compose, judge, feedback,
   record). Nothing plays without these.
2. OSINT browser (02): feeds the loop with the facts a good pretext needs.
3. Inbox triage (05): the defender mirror, and the awareness assessment.
4. Pretext dialogue (06): reuses `person-chat`, `phone-chat` and ink, so it is cheap.
5. Landing-page builder (07): last, with the most new UI for the least reuse.
6. Scenarios: the lab (10) first, then the Eldritch Hacker missions, then the awareness episodes (11).

## Conventions

- Overlays follow house style: the dark panel, square corners and colours come from the `--ui-*` tokens
  in `css/ui-themes.css` (the mission's `ui_theme` chooses the accent, so nothing is hard-coded green);
  chrome and headings use the theme fonts (`GNF` is the framework body font, `Press Start 2P` for
  headings). Pixel art (logos, portraits, icons) is drawn low-res and scaled with
  `image-rendering: pixelated`. All text a player reads or compares is a readable sans-serif that is
  bundled with the game: Atkinson Hyperlegible (none was bundled before; see the engine list). `scenarios/FINGERPRINT_MINIGAME_PLAN.md`
  is the template for how a minigame design doc is structured.
- Accessibility and small screens: a single column below about 700 px; every action reachable by
  keyboard (drag-to-link has a pick-and-confirm alternative); `aria-live="polite"` on score and
  "noted" regions; no motion under `prefers-reduced-motion`; teaching notes behind a visible button as
  well as hover; ticks, crosses and marks always paired with words; 44 px touch targets.
- Closing a viewer overlay (OSINT browser, intel board) is a normal exit, not a failure: they set a
  result and call `complete(true)`, and Esc inside a text field first clears or blurs the field.
- Each minigame is an engine component under `public/break_escape/js/minigames/<name>/`, started by an
  interaction, emitting a completion event a scenario listens for, with outcomes bridged to globals the
  way existing minigames do. Every new minigame needs the same wiring checklist: export, import and
  `registerScene` in `minigames/index.js`; a starter in `minigame-starters.js` exposed on `window`; a
  branch in `systems/interactions.js` for the object type; a stylesheet linked in
  `app/views/break_escape/games/show.html.erb`; a sprite `assets/objects/<type>.png` (the validator rejects an object type with none) plus a `this.load.image('<type>', 'objects/<type>.png')` line in `core/game.js` `preload()` (without it the object renders as Phaser's missing-texture box, and the validator does not catch that); and a `minigame-data-schemas.json` entry for the type's `minigameData`; `requiresKeyboardInput: true` for any overlay with keyboard-operable controls (it pauses the world's movement and interaction keys); and
  `aborted: true` set by the minigame itself on Esc (the framework does not). Only one minigame is
  open at a time, so a minigame that launches another uses the return-to helper (`00` S12): it saves its draft (mail: `mailState.drafts`) and passes `returnTo`, or reads the data inline instead of opening the other overlay.
- Scenario-authored content (victims, OSINT facts, rules, feedback strings) lives in scenario JSON, not
  in the minigame code, under one top-level `social` key (`00` §11). It reaches the browser unfiltered,
  so judged data is readable by a determined player. That is acceptable for the lab. Awareness scoring
  that is reported to anyone else must be computed on a server path.
- A design doc covers: purpose and audience, the player's goal, the loop, rules and scoring with worked
  examples, scenario-authored data, engine wiring with file and line references (new work flagged),
  reuse across audiences, assets (PixelLab-first, none generated yet), open questions.
- Writing: UK English, plain prose. No commits without being asked.

## Where narrative lives

- Eldritch Hacker (game 2): `../eldritch_hacker/DIRECTION.md` and `FRESH_CONTEXT_PROMPTS.md`.
  Provisional until a universe-bible pass.
- The student lab's cast and story (Northgate Assurance, AccountingNow): `designs/10` and the canonical
  dataset in `designs/00` §1.
- A parked VM-backed variant of this strand is kept for reference in
  `../MAYBE-LATER-phishing_and_social_engineering_secgen/`. It is out of scope.
- Wider decisions across this strand: `../PHISHING_AND_SE_DECISIONS.md`.
