# Deduction inventory: the social-engineering / conversation minigames

Read-only survey for the deduction board (design 12 / `DEDUCTION_IMPLEMENTATION_PLAN.md` §3).
Scope: the minigames in `public/break_escape/js/minigames/` listed for this group, plus the
`social-*` / `mail-*` / pretext systems they lean on. All paths below are relative to
`public/break_escape/js/`. No code was changed.

## The shared grant / action contract (read this first)

Everything the board shows is a fact held through one path, so a minigame is a deduction clue
source only if it can reach that path.

- **`grantFact(id)`** — `systems/social-intel.js:184-217`. The single award path. Flip-only: a
  repeat does nothing. On first grant it writes `se_intel_<id> = true` through the shared writer,
  emits `intel_collected`, adds an evidence note (`window.addNote`), calls `stateSync.sync()`, and
  runs `evaluateReadiness` (sets `target_ready_<id>` / `osint_done`). The board reads the
  `se_intel_*` global as source of truth, so the deduction board will read these the same way.
- **`applyActions(actions)`** — `systems/apply-actions.js:31-262`. Action vocabulary today:
  `set_global` (37), `grant_fact` (49, calls `grantFact` + toast), `emit_event` (70),
  `complete_task` (76), `unlock_object` (87), `unlock_door` (102), `hint` (124), `give_item` (131),
  `tint_objects` (150), `lighting_dip` (180), `confirm_action` (187), `show_end_screen` (204).
  **There is no `verdict`, `deduction_favour` or `deduction_tamper` action** — the plan adds them.
- **ink action tags** — `minigames/helpers/chat-helpers.js:27` `processGameActionTags`. Cases
  (`grep '^\s*case' chat-helpers.js`): `unlock_door`, `give_item`, `give_npc_inventory_items`,
  `set_objective`, `reveal_secret`, `add_note`, `send_email`, `trigger_minigame`,
  `influence_increased/decreased`, `remove_npc`, `hostile`, `transition_to_person_chat`,
  `clone_keycard`, `complete_task`, `ending_check`, `skip_task`, `unlock_task`, `unlock_aim`,
  `set_global` (501), `portrait`, `lighting_dip`, `set_variable`, `influence` (649), `report` (652).
  **No `grant_fact` tag and no `verdict` tag.** So a plain witness line cannot grant a clue through
  ink today; it can only `#set_global:se_intel_<id>:true`, which sets the board global but skips
  `grantFact`'s note/toast/readiness. The influence/report tags the witness-push mechanic (§3.3)
  needs *do* exist.

The recurring engine gaps, named once:

- **GAP-GRANTTAG**: no `#grant_fact:<id>` ink tag. Smallest fix: add a `grant_fact` case to
  `processGameActionTags` that calls `applyActions([{type:'grant_fact', fact:param}])` (reuses the
  existing handler, so toast + readiness come for free).
- **GAP-VERDICT**: no verdict route anywhere (no action, no tag, no board submit). Plan §3.8 adds
  `#verdict:<kind>[:<suspect>]`, a `{type:'verdict'}` action, `npc_ko` → `ko`, and the board's
  "Make the call". Smallest fix per host noted below.
- **GAP-FAVOUR / GAP-TAMPER**: no `#deduction_favour:<suspect>`, no `deduction_tamper` action.

---

## assistant-chat — `assistant-chat/assistant-chat-minigame.js`

**Facts.** Authored AI-assistant overlay for an awareness episode's flip region
(`:1-37`). No LLM, no network: every reply/draft/document is a literal string from
`awarenessEpisode.assistant` (`:3-6`). `minigameData`/params: `config` (the `assistant` block)
with sections `summarise` / `paste` / `draft` / `exchanges`, `sentTemplateId`, optional `feedback`
(`:14-34`). It lands internal `caught`/`missed` verdicts as a teaching beat; it **writes no global
and grants no fact** (grep: no `writeGlobal`/`grantFact`/`emit`), returns via `onComplete` to the
episode runner (`:8-10`). Safety: nothing typed is read (`:34-37`).

**Uses & gaps.** No fit. It is episode-bound and deterministic, with nothing that reaches the
board. Eldritch Hacker: no fit. Corporate (Cyber Aware): at most set dressing inside an episode,
not a clue or verdict channel. Gap to make it a clue source would be large (no success global, no
grant path) and would fight its "nothing leaves the scene" design — not worth it.

## concern-form — `concern-form/concern-form-minigame.js` + `concern-form-model.js`

**Facts.** The player builds a short report from fact chips (what / when / where / who) plus an
optional conclusion chip; feedback favours facts over a verdict (`:1-18`). Teaching only — "nothing
here is a mark" (`model :1-24`). Config: `factChips`, `conclusionChips`, `guidance`, `minFacts`,
`strings`; or `episode.concernForm`. On Done the `gameResult` is `concernRecord()` — counts, a tone
and the picked chip ids (`:16`, model `concernRecord`). It **writes no global** (grep clean in both
files). Close/Esc = `{aborted:true}`.

**Uses & gaps.** Best role: a **report verdict channel** — the corporate "Refer to HR / raise a
concern" act, and a natural home for §3.10's "report facts, not a verdict" ethos. Corporate
(Cyber Aware / Incident Simulations): the player assembles the concern about one colleague and
filing it is the `report` verdict against that suspect. Eldritch Hacker: thinner (the lab files a
SAFETYNET report), usable but phone/person chat suits the pulp tone better.
**Gap**: the result is teaching-only — no global, no verdict, and no notion of *which suspect* the
concern names. Smallest fix: a thin starter wiring the `onComplete` record to
`applyActions([{type:'verdict', kind:'report', value:'guilty', suspect:<configured>}])`, with the
suspect carried in `minigameData` (depends on GAP-VERDICT).

## engagement-report — `engagement-report/engagement-report-minigame.js` + `report-model.js`

**Facts.** The results-and-findings overlay that closes the SE lab (`:1-27`). Display-only campaign
metrics read live from `mailState.metrics` / landing records / pretext globals; interactive steps
are `results` (Confirm / optional `question` items) and `findings` (pair a root cause with a
control). Writes `se_report_state` (in-progress ids, `STATE_KEY`, `:404`) and the step/block globals
`report_results_done` / `report_findings_done` / `report_filed` on the flip (`:413`). No `grantFact`.

**Uses & gaps.** Best role: a **debrief / close surface**, or in a case that ends with "file the
report" the block global `report_filed` is a clean close gate. Corporate: the findings step maps
well onto "what let the insider in" after the calls are made — a reflective close, not a per-suspect
verdict. Eldritch Hacker: weaker (tonally corporate). **Gap**: findings pair causes with controls,
not suspects, so it cannot carry verdicts; it can gate the close and feed `onClose` actions.

## episode-runner — `episode-runner/episode-runner-minigame.js`

**Facts.** The awareness-episode orchestrator (`:1-40`): reads `social.awarenessEpisode`, runs
stages (`brief`, `osint`, `build`, `write`, `mfa`, `guess`, `mistake`, `flip`, `defend`, `check`,
`debrief`), opening child minigames via `launchChild` and watching their outcome globals (e.g.
`pretext_<callId>_outcome`, `guess.landedGlobal`). Writes stage globals through `writeGlobal`
(`:219`), records triage, emits `global_variable_changed` (`:1094`).

**Uses & gaps.** No direct fit as clue source or verdict channel — it is a wrapper. It could *host*
a deduction mini-case as one stage in a Cyber Aware episode, but the board itself is the
intel-board host, not this. The outcome globals it already watches are the pattern the plan reuses
for the call-driven verdict flow. Role: orchestration only.

## inbox-triage — `inbox-triage/inbox-triage-minigame.js` + `triage-*.js` + `systems/triage-starter.js`

**Facts.** Classify a bank of messages (keep / flag / report-style bins). The scene carries only
`minigameData:{triageSetId}` (`:7`); the result is handed back via `persistResult` / `onResult` /
`onComplete` (`:1775`, `:1968`). The **starter** writes the outcome: per-set globals from
`outcome.setGlobalPrefix` with `{stage}` substituted (`triage-starter.js:121-123`, `:301`), emits
`global_variable_changed:<name>` for the true ones (`:194`) and a `TRIAGE_DONE_EVENT` (`:278`,
`:354`), and can complete tasks via `objectivesManager` (`:108`). No `grantFact`.

**Uses & gaps.** Good **clue source via a global bridge**, and a plausible **report channel**.
Eldritch Hacker: triage a cult's DMs/emails — correctly flagging a sender writes
`<prefix>flagged_cultsign` true, and a `triggers`/`eventMappings` entry on
`global_variable_changed:<that global>` grants a marked clue on that suspect (the plan's "mail"
route, §3.2). Corporate: triage the incident mailbox; flagging the insider's spoofed message grants
the "what they sent" clue. **Gap**: it writes globals but never calls `grantFact`, so a clue needs
the global→trigger hop (supported today — small authoring gap, no engine change). For a *report
verdict* the flagged-global would likewise need a verdict trigger (GAP-VERDICT).

## intel-board — `intel-board/intel-board-minigame.js` + `board-model.js`

**Facts.** The case-file board host. Modes today: `recon` (default), `defender`, `scope`, `plan`
(`:3`, `:88`); `deduction` is **not** present. Reads `se_intel_*`, `target_ready_*`, `osint_done`
and renders; interactive modes let the player pick cards that set step/block globals through the
shared writer on the flip (`:39-47`). Params `{mode, returnTo, social}`. Close = normal exit with
`{mode, completed, ready}`; no verdict, no marks, no submit (grep: none).

**Uses & gaps.** This is **the deduction board host** — plan §3.7 adds a `deduction` mode (one
`case-file` object, `minigameData.mode:"deduction"`) with the profile card, suspect cards, marks,
the nudge, and the `allowSubmit` "Make the call" final-verdict route. **Gap (the central engine
work)**: no deduction mode, no marks persistence, no nudge, no `final` submit → verdicts. Smallest
fix is not small: build the mode against `social.deduction` and the evaluator. Applies to both
universes equally.

## landing-page-builder — `landing-page-builder/landing-page-builder-minigame.js` + models

**Facts.** Build a phishing landing page (clone a brand, pick a domain, add a form). Writes
`landing_<pageId>_built` true and `landing_<pageId>_domain` on completion (`:962-966`), plus draft
state (`:1181`, `:1187`). No `grantFact`. Launched by the episode `build` stage or an object.

**Uses & gaps.** Weak fit. The `landing_<id>_built` global could gate a clue ("a page in this
suspect's style exists") through the global→trigger hop, or be a favour artefact. Mostly no fit as a
clue source or verdict channel in either universe. Role: optional minor clue gate only.

## mail-client — `mail-client/mail-client-minigame.js` + `mail-bridge.js` + `mail-composer.js` + `mail-reader.js`

**Facts.** Read, compose and send mail. The **reader** grants a clue from a marked highlight span:
`m.grantFact(highlight.grants, …)` (`mail-client-minigame.js:1217`, note `:193`) — a real clue
source today. The **composer/bridge** judges a send to a phishing target and writes
`phish_<target>_attempts` (`mail-bridge.js:389`) and the target's `outcome.setGlobal` on a landed
send (`:512-528`); a non-target recipient is kept in Sent, never judged (`:340-345`). Also sets
globals via `#set_global`-style highlights (`mail-client-minigame.js:569`).

**Uses & gaps.** Two roles. (1) **Clue source** — a highlight in a read message grants a clue
(works today; Eldritch Hacker: a ritual date / forum handle in a cult email as a *marked* clue;
corporate: the spoofed sender header). (2) **Report verdict channel** — "forward to SAFETYNET /
your manager". **Gap for the report**: outcome globals are keyed per *phishing target*, and a report
to an authority is a non-target recipient that is "never judged", so it records nothing. Smallest
fix: either author a dedicated report recipient whose `outcome.setGlobal` records the named suspect,
or (cleaner) a mail→verdict hook so a send to the report address fires
`{type:'verdict', kind:'report'}` (GAP-VERDICT). The clue role needs no engine change.

## ncsc-brief — `ncsc-brief/ncsc-brief-minigame.js`

**Facts.** A sealed attribution dossier, scenario-driven (`:1-25`). Gated by `gateVar`; on open it
sets `reviewedVar` true (`:122`) and emits `global_variable_changed:<reviewedVar>` (`:194-202`).
`minigameData`: `gateVar`, `reviewedVar`, `caseRef`, `sealedMessage`, `briefTitle`, `briefMeta`,
`sections[]` (typed content blocks). Display only; no `grantFact`.

**Uses & gaps.** Fit: a **clue / profile surface** — a dossier the player unlocks that reveals who
fits a profile, or the mission brief's "what to look for". The `reviewedVar` global can gate a clue
grant through the global→trigger hop. Eldritch Hacker: a SAFETYNET field brief on the Quantum Cabal's
tells; corporate: an NCSC/vendor advisory naming the insider pattern. **Gap**: sets a reviewed
global but does not `grantFact`; the global→trigger hop covers it (small authoring gap), or
GAP-GRANTTAG if the reveal should carry a clue directly.

## osint-browser — `osint-browser/osint-browser-minigame.js` + `osint-model.js`

**Facts.** Browse authored pages; a metadata field is a button, and selecting it collects the fact
it carries via `grantFact` (`:656-674`, import `:28`). Writes browse state `STATE_KEY` (`:274`).
`minigameData`: `siteIds` (subset of sites; all when absent — `minigame-starters.js:1184`).

**Uses & gaps.** **Prime clue source.** It already calls `grantFact`, so a selected public-record
block *is* a board clue with no engine change. Eldritch Hacker: a forum post, a cached profile, an
archived ritual notice carrying a *marked* clue; a `count:1` sighting (a unique sigil photographed
once) is the "unique item" moral-choice trigger of §3.5. Corporate: a LinkedIn/press page placing a
suspect somewhere ("where they were"). **Gap**: none for granting. The only missing piece is the
authored `count:1` moral-choice ink around a sighting (§3.5 is authored, not engine) — no engine fix
needed.

## password-guesser — `password-guesser/password-guesser-minigame.js` + model

**Facts.** Step an authored "guesser" through a colleague's guess list; on a landed account it
writes `config.landedGlobal` true on any normal close (`:229`, header `:15-23`). Result
`{finished, landed}`. Nothing typed, nothing scored.

**Uses & gaps.** Weak fit. `landedGlobal` could gate a clue ("this suspect reused a breached
password" → "what they carry/know") through the global→trigger hop, but the content is about the
learner's own account, not a suspect's whereabouts/kit. Mostly no fit as a clue or verdict channel.
Role: optional minor clue gate only.

## pretext-prep — `pretext-prep/pretext-prep-minigame.js` + `pretext-card.js`

**Facts.** The brief + pretext card: each blank is a picker of **held facts only** (`:1-18`). Begin
hands over to person-chat / phone-chat with `{npcId, startKnot, pretextCallId, blanks}`; the prep
overlay itself completes with **no payload** and writes nothing — "handing over to the chat does not
emit a result a scenario could key on" (`:11-18`). The call's result is `pretext_<callId>_outcome`,
written by the chat.

**Uses & gaps.** Fit: the **approach gate** before questioning a suspect — it enforces that you can
only use clues you already hold, which is the right texture for pushing a witness (§3.3). Eldritch
Hacker and corporate alike: prep the cover story, then the chat carries the verdict/witness/favour.
**Gap**: it grants and writes nothing itself; everything lands in the chat it launches, so its
deduction value is entirely downstream. No standalone fix needed.

## privacy-panel — `privacy-panel/privacy-panel-minigame.js` + `privacy-model.js`

**Facts.** Toggle profile settings to "close" found OSINT facts, in this panel's view only; reads
`social.intelFacts` and `se_intel_*` and **never writes either** (`:1-4`, `:14`). Result record on
Done; Close/Esc = aborted, nothing kept.

**Uses & gaps.** No fit. It is read-only reflection on the learner's own exposure, with no board
side effect. Eldritch Hacker and corporate: no clue, no verdict. A "cover your tracks" errand
reading would need a write path it deliberately lacks — not worth adding.

## sort-drill — `sort-drill/sort-drill-minigame.js` + model

**Facts.** Sort situation cards into 2–4 bins with the reason shown after each drop (`:1-21`); scored
or not per config. Result = `scoreDrill()` record on the Summary via `gameResult`/`closeResult`; it
**writes no global** (grep clean). Config: `bins`, `cards`, `scored`, `answerKeyProfile`, `drawRules`,
`drawCount`, `strings`.

**Uses & gaps.** No fit as a clue/verdict channel — teaching only, no board side effect. The nearest
stretch is a "sort these clues by who they point to" reflection, but that duplicates the board's
marks and still writes nothing. Role: episode teaching only.

## phone-chat — `phone-chat/phone-chat-minigame.js` + `phone-chat-conversation.js`

**Facts.** Ink-driven phone call. Action tags run through `processGameActionTags`
(`chat-helpers.js`); it writes the story's own vars for `#set_global` (`phone-chat-conversation.js:820-832`,
emit `:982`) and emits `conversation_closed:<npcId>` (`phone-chat-minigame.js:1339`). It has
`#influence` / `#report` (the witness-push levers, §3.3) and `#give_item`, `#set_global`,
`#complete_task` via the shared dispatcher.

**Uses & gaps.** Roles: **report verdict channel** ("call SAFETYNET and name them"), **witness
grant** (a remote informant), and **favour ask**. **Gaps**: GAP-VERDICT (no `#verdict:report:<s>`),
GAP-GRANTTAG (a witness line cannot grant a clue — only `#set_global:se_intel_<id>:true`, which
skips the note/toast/readiness), GAP-FAVOUR. Smallest fix: add `grant_fact`, `verdict` and
`deduction_favour` cases to `processGameActionTags`, each delegating to `applyActions`. Eldritch
Hacker: the SAFETYNET handler call that commits a report; corporate: calling the SOC/manager.

## person-chat — `person-chat/person-chat-minigame.js` + `person-chat-conversation.js` + `person-chat-pretext.js`

**Facts.** In-person ink conversation, same tag dispatcher `processGameActionTags`
(`person-chat-minigame.js:20`). `#give_item` handled (`person-chat-conversation.js:390,530`). The
**pretext path grants facts**: a successful `pretext_ask` external runs `applyGrants` →
`grantFact` with `source:'pretext'` (`person-chat-pretext.js:204-214, 258-305`) — a working
conversation clue route, but only through the pretext/influence judge, not a plain line.
`#influence` / `#report` present.

**Uses & gaps.** The **core deduction conversation host**: `accuse` / `trust` in the suspect's own
ink, `report` / `accuse` of another suspect from a third party, the favour ask + errand, and witness
grants. **Gaps**: GAP-VERDICT (no `#verdict:<kind>[:<suspect>]`), GAP-GRANTTAG (a non-pretext witness
line cannot grant a clue), GAP-FAVOUR / GAP-TAMPER. Smallest fix: the same `grant_fact` / `verdict` /
`deduction_favour` cases in `processGameActionTags`, reusing `applyActions`; the pretext grant path
shows the plumbing already reaches `grantFact`. Eldritch Hacker: confront a guest at the gathering,
vouch for the courier, do the "fetch the ward" favour that backfires if they are a cultist; corporate:
confront the contractor, clear the new starter, run the badge-collection errand.

---

## Summary table

| Minigame | Best deduction role(s) | Gap |
|---|---|---|
| assistant-chat | None (episode-bound, nothing reaches the board) | No success global / no grant path; not worth wiring |
| concern-form | Report verdict channel (corporate "refer / raise a concern") | Teaching-only result: no global, no verdict, no suspect — needs onComplete→verdict wiring (GAP-VERDICT) |
| engagement-report | Debrief / "file the report" close gate | Pairs causes↔controls, not suspects; carries no per-suspect verdict |
| episode-runner | Orchestration only (could host a case as a stage) | Not a clue/verdict channel itself |
| inbox-triage | Clue source (flag a sender → clue via global→trigger); possible report channel | Writes globals but never grantFact (small authoring hop); report needs GAP-VERDICT |
| intel-board | **The deduction board host** (profile card, suspect cards, marks, nudge, final call) | No `deduction` mode, no marks, no nudge, no `final` submit → verdicts (central engine work) |
| landing-page-builder | Minor clue gate via `landing_<id>_built` | Not a clue/verdict channel; weak content fit |
| mail-client | Clue source (reader highlight → grantFact, works today); report verdict channel | Report recipient is "never judged"; needs a report→verdict hook (GAP-VERDICT); clue role needs nothing |
| ncsc-brief | Clue / profile / "what to look for" surface | Sets a reviewed global, not a fact — needs global→trigger hop or GAP-GRANTTAG |
| osint-browser | **Prime clue source** (selected block → grantFact); unique-item sighting (count:1, §3.5) | None for granting; §3.5 moral choice is authored ink, not engine |
| password-guesser | Minor clue gate via `landedGlobal` | Content is the learner's account, not a suspect; weak fit |
| pretext-prep | Approach gate before questioning (held-facts-only) | Grants/writes nothing itself; value is entirely downstream in the chat |
| privacy-panel | None (read-only, never writes) | No board write path by design |
| sort-drill | None (teaching only, writes nothing) | No board side effect |
| phone-chat | Report verdict; remote witness grant; favour ask | GAP-VERDICT, GAP-GRANTTAG, GAP-FAVOUR — add cases to processGameActionTags→applyActions |
| person-chat | **Core host**: accuse/trust/report, witness grant, favour + errand/backfire | GAP-VERDICT, GAP-GRANTTAG, GAP-FAVOUR, GAP-TAMPER — same fix; pretext path already reaches grantFact |
