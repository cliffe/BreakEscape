# Phish evidence server plan (build/hard-phish-b): review R1

Scope: review only, against the real tree at `build/hard-phish-b` tip `f89de50a8`. The plan under
review is `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md`. The four settled decisions (Q1 one code
path, Q2 lighter send gate, Q3 `se_landing_pages` stays a client UI global, Q4 import a legacy landed
send once gated on the re-derived build threshold) and the two orchestrator calls (legacy sends migrate
by the build-threshold rule with no message required; the client reveal follows the server capture
record) are taken as final. The questions below are whether the plan implements them correctly and
whether each chunk can be built and tested as written.

## Counts

- Blocker: 1
- Major: 1
- Minor: 2

## Verdict: REVISE

One blocker: the plan's named mechanism for "the reveal follows the server" (section 7) cannot create
the server capture record in the exact window the lighter gate opens, so the chunk A live proof it
schedules cannot pass as written, and a legitimate player in that window is refused the secret. Fix the
mechanism (or justify dropping the client change) and the plan is close to ready; the rest holds up.

---

## Blocker

### B1. Section 7 "reveal follows server" has no path that creates the capture record the client never claimed

Files: plan section 7 (lines 244-264) and section 13 (lines 537-542); the real code at
`public/break_escape/js/systems/phish-rules.js` (`evaluateMessage`, the `landed` line),
`public/break_escape/js/minigames/landing-page-builder/landing-page-model.js:693-735`
(`describeVictimOutcome`, `captureGranted`),
`public/break_escape/js/minigames/mail-client/mail-bridge.js:411-441` (the `recordCapture` call),
`app/controllers/break_escape/games_controller.rb:947-1009` (`apply_capture_sync_step`),
`app/models/break_escape/capture_proofs.rb:432-446` (`stamp_proven_captures!`).

The divergence the plan relies on is real. In `phish-rules.js`, `evaluateMessage` computes
`const landed = open.opened && failedRequired.length === 0`, where `open.opened` needs sender trust or a
matching subject topic and `failedRequired` counts any required `senderTrust` / `senderAuth` /
`addressedTo` / `pretextRelevant` factor. The server's lighter gate (plan section 5, step 4) ignores all
of these and lands on page `meetsThreshold` plus authored target plus authored kit. So for `lord` the
server can land a send the client judges as not landed. The plan states this itself (section 13).

The break is in how the server capture record is created. The server's `seCaptures` entry for the
phished credential is only ever written by `record_capture!`, driven from the client's capture claim in
`apply_capture_sync_step` (`games_controller.rb:977-988`, reading `params[:captures]` and the client's
`globalVariables.se_captures`). The client only writes that `se_captures` global by calling
`recordCapture` (`mail-bridge.js:432`), and that call is gated by `captureGranted(before, next)`
(`mail-bridge.js:422`). `captureGranted` is true only when the victim outcome becomes `submitted`, and
`describeVictimOutcome` returns `submitted: true` only when `meets && didLand`, where
`didLand = landed === true` from the client judge
(`landing-page-model.js:693-735`). So in the divergence window (server lands, client judge does not),
the client never calls `recordCapture`, never syncs a capture claim, and the server never holds an
`seCaptures` entry for that target.

Section 7's named fix is to surface "the capture the server grants (returned in the Route 2 answer and by
`captures_for_client`)" and to re-stamp from the routes (section 6). Neither creates the entry.
`captures_for_client` (`capture_proofs.rb:326-337`) reads `se_captures_record`; with no entry it returns
nothing. `stamp_proven_captures!` (`capture_proofs.rb:432-446`) only flips `proven` on entries that
already exist; it creates none. Route 2 as specified writes `sePhishSends` only, not a capture. So the
secret is never served in the divergence window, and the chunk A live proof the plan itself schedules
(section 15, "a send the client judge would score down ... still surfaces the server-granted capture")
cannot pass.

Concrete failure: a student builds a genuinely convincing `payroll_login` page (server recomputes
`meetsThreshold: true`), sends an authored message to `lord` with `kit_payroll_page`, but writes a weak
pretext or a mis-addressed greeting. The client shows "did not land", calls no `recordCapture`, and the
`sofia_archive` password lock stays shut, with nothing on screen to explain it. Under the plan's own
"never refuse a legitimate player" rule and decision two, that is exactly the refusal section 7 exists to
prevent.

Fix direction (choose and specify one): either (a) decouple the client capture record from
`evaluateMessage` landed, so the client records the capture (and syncs the claim) whenever it sends an
authored message to an authored target with an authored kit and a server-built convincing page, leaving
`evaluateMessage` purely advisory as section 7 intends; or (b) have Route 2 itself create the `seCaptures`
entry from the page's authored `capture` when `landed` is true, so the record exists server-side without a
client claim. The plan must name the mechanism, not "confirm and adjust if needed", because this is the
single client change the whole decision-two rationale rests on. (If instead the intent is that the
widened region should not auto-reveal, say so: note that the client keeps gating the reveal on its own
judge, that a client-landed send is always a server-landed send because the server gate is a strict
superset for link phish, and that section 7 is therefore unnecessary. One of these two positions needs to
be on the page; the current text asserts the reveal must follow the server but gives a mechanism that
does not make it so.)

---

## Major

### M1. The legacy migration still keys the landed import off a stored sent record, against "no message required"

Files: plan section 9 (lines 363-372) and section 9.1; the orchestrator's settled call ("legacy sends
migrate by the build-threshold rule alone, with no message required"); mailbox cap discipline in
`app/models/break_escape/capture_proofs.rb:647-661` (`each_stored_sent_message` walks
`player_state['mailState']['mailboxes']`).

Section 9 imports a landed send "for each old `folder: 'sent'`, `landed: true` record to an authored
target carrying an authored link kit", setting `landed` from the re-derived build threshold. The landed
verdict follows the build threshold, as settled, but the import still requires a stored sent record to
exist. The settled call says the migration should credit landed by the build-threshold rule alone, with
no message required.

Concrete failure: an honest legacy save in the narrow `proven: false` window (page built and convincing,
send made, capture recorded but not yet stamped when the save was taken) whose sent record was trimmed
out of the mailbox by the cap before the save. The build migration re-derives `meetsThreshold: true`, but
with no surviving sent record the send import writes nothing, so after chunk C the new reader finds no
landed send in `sePhishSends` and withholds `Sofia2026!` from a student who legitimately phished. This is
the legacy case section 10 says must never happen.

Fix direction: state explicitly whether a stored sent record is required. If the settled intent is
build-threshold-alone, synthesise the landed send for any built-and-convincing page that is wired to an
authored phish target and an authored link kit (section 5's reachability facts), independent of whether a
trimmed `mailState` still holds the matching sent record. If a stored sent record is deliberately
required, reconcile that with the settled wording and note the trimmed-record case as an accepted gap.

---

## Minor

### m1. `phishEvidenceMigrated` storage location is unspecified

Files: plan section 9.1 (the writer "sets `phishEvidenceMigrated = true` when it finishes"); contrast the
server-owned keys in `app/models/break_escape/game.rb:2243-2275` (`ACCESS_STATE_DEFAULTS`,
`SERVER_OWNED_GLOBAL_NAMES`) and the whole-`globalVariables` ship at
`app/controllers/break_escape/games_controller.rb:344-346`.

The plan does not say whether `phishEvidenceMigrated` is a top-level `player_state` key or a global. It
should be a top-level server-owned key, for two reasons. First, if it lives in `globalVariables` a
tampered client can set it through the `sync_state` merge and skip its own migration; that only self-harms
(the server stores stay empty and the reader withholds), so it is not a forgery, but it is avoidable
state the client should not touch. Second, a global rides back out in `savedGlobalVariables`
(`games_controller.rb:344-346`) and is re-synced, a small but real breach of the "synced player_state must
not grow" rule the plan commits to in section 8. Pin it as a top-level `player_state` flag.

### m2. Section 8's "explicit allowlist, not a whole-state dump" overstates the bootstrap for globals

Files: plan section 8 (lines 276-282); `app/controllers/break_escape/games_controller.rb:344-346`.

Section 8 says the bootstrap `scenario` action "builds the client copy from an explicit allowlist of named
keys, not a whole-state dump". That is true for top-level `player_state` keys, which are attached one by
one (`objectivesState`, `submittedFlags`, `captures`, and so on), and the two server stores
`seLandingPages` / `sePhishSends` are correctly not among them, so the security claim holds. But
`globalVariables` is shipped wholesale as `savedGlobalVariables` (`games_controller.rb:344-346`), which is
a whole-section dump, and it carries the legacy `se_landing_pages` global. The wording should be corrected
so a reader does not infer that globals are allowlisted; the point that matters (the two server stores are
never serialised to the client) is unaffected and is accurate.

---

## What checks out

- Forgery, direct store forge (plan sections 4, 8; `game.rb:2243-2275`, the `sync_state` merge in
  `games_controller.rb:833-903`). `seLandingPages` and `sePhishSends` are top-level `player_state` keys,
  not globals and not merged sections, so `sync_state` never reads them from the body. After the reader
  change a forged `se_landing_pages` global or forged `mailState` is ignored by the gate. To move the
  gate the attacker must POST Route 1 with choices that genuinely re-score above threshold (that is
  playing the builder; `PhishScore.score` at `phish_score.rb:50`, validated field by field in
  `record_landing_page_build!`, `capture_proofs.rb:233-261`) and POST Route 2 to the authored target with
  the authored kit. The forge in section 1 is closed.
- Forgery, migration path (plan section 9). The build verdict is re-derived with `PhishScore` from the old
  `choices`, not trusted, and the landed import is gated on that re-derived threshold, so a forged
  `meetsThreshold: true` over junk choices migrates to `false`. No laundering, subject to M1 above on the
  honest side.
- Wrong target, wrong kit, oversized or hostile ids (plan section 5 steps 1-3, section 15 cases 1, 2, 6).
  The route mirrors `record_landing_page_build!`, whose id length cap and closed-menu validation are real
  (`valid_capture_target_id?` at `capture_proofs.rb:667-669`, `valid_build_choices?` at 502-521). Feasible
  as written.
- Q1 one code path (plan sections 3, 4.2). `recompute_page_verdict?` returns `true` for every page
  (`capture_proofs.rb:484-486`); Route 2 derives `landed` the same way for every send; the reader reads
  the two server stores for every scenario. No protected-versus-not branch at runtime; the hard-access
  distinction lives only in the validator at authoring time.
- Concurrency (plan section 5). Route 1 is already under `around_action :with_game_lock`
  (`games_controller.rb:103-105`); Route 2 is specified under the same lock, which serialises against
  `sync_state` on the same row (both take the Postgres row lock on the game), so there is no lost update.
  The locking guard test (`test/controllers/break_escape/game_state_locking_test.rb`) exists and the plan
  adds `record_phish_send!` to it.
- Synced state growth (plan section 8). Both stores are bounded (pages; targets by kits), first-wins, and
  never in the client-to-server body, the bootstrap allowlist, or the sync answer (`captures_for_client`
  at `capture_proofs.rb:326-337` strips to safe fields). The migration is a data move inside
  `player_state`. Net new synced growth is zero, subject to m1 on `phishEvidenceMigrated`.
- Reader change and retirement (plan section 6). The methods retired (`phish_evidence_fingerprint`,
  `each_stored_sent_message`, `phish_gated_unproven_captures?`, the `@phish_fp_before` block) are confined
  to the phish path (grep across `app` and `lib` shows no other callers), so the refactor is contained.
  `CaptureModel.page_evidence_kits` already returns `{ page_id => { address:, kits: [] } }`
  (`capture_model.rb:356-373`), the shape the new reader uses.
- Buildability and routing (plan section 14, chunk A). `se_landing_page` is already in `set_game`
  (`games_controller.rb:27-29`), `with_game_lock` (103-105) and `GamePolicy#se_landing_page?`
  (`game_policy.rb:128-130`); the route exists (`config/routes.rb:59`). Route 2 mirrors each. The build
  POST await hook is real: the builder keeps the promise on `this._buildPost`
  (`landing-page-builder-minigame.js:1025`) and `se-landing-page-client.js` posts the closed set.
- Q2 explanation (plan section 13). Accurate and plain. It states honestly what B gives up: the server no
  longer judges sender, addressing or pretext, so for `lord` a convincing page plus any authored message
  with the payroll kit serves the secret whether or not the email would have fooled her, and the lab is a
  little easier in exchange for a secret that can never be served off forged client state. (The honesty of
  the section is exactly why B1 matters: the plan knows the divergence exists, but the reveal mechanism it
  ships does not cover it.)
- Live proof hygiene (plan section 15). Ports 3664 or 3665, never `:3000`; headless with `setFPS(20)` and
  fixed steps on; real builder and mail controls through `window.__test`; server stores read back by a
  runner. The six hostile cases are listed. All consistent with project rules.
