# Phish evidence recorded server-side (plan)

Scope: make the two facts that gate a phished credential's reveal, the landing page being built and
convincing, and a phishing email landing on the target, into facts the server establishes from its own
verification, not controls a tampered client grants itself. Today both reach the server only as
client-written, client-synced state, so a tampered client can forge a built page and a landed send and be
served a protected `capture.secret` (a sign-in password that is also a lock code, a PSK or a flag) without
ever running the minigames. This plan closes that forge.

The server owns the capture record already. `CaptureProofs#record_capture!` stores every stored field of a
capture and marks each entry `proven` only when `capture_evidence_holds?` is true. For a phished credential
that evidence comes through `phish_page_evidence_holds?`, which today reads the client: the landing-page
record from `globalVariables.se_landing_pages` and the landed send from `mailState`. This plan moves that
one reader onto two server-owned records written by two gated routes, and derives the victim's submission
rather than trusting it.

Four design decisions set the shape. The server recomputes every scenario's verdict through one code path
(no protected-vs-not branch at runtime); the send gate is the lighter check (page meets threshold plus an
authored send to the authored target and kit), not a full server re-judgement of the message;
`se_landing_pages` stays a client UI global the gate no longer trusts; and an old save that already landed
a phish has that fact imported once, gated on the server's re-derived build threshold.

## 1. The weakness as it stands

The phished credential's reveal is gated on two values a tampered client fully controls.

1. **The landing-page build is a client minigame.** `attach()`
   (`landing-page-builder-minigame.js`) writes `se_landing_pages[pageId]` into `globalVariables`, a record
   carrying `built: true`, `meetsThreshold`, `credibility` and the player's `choices`. `se_landing_pages`
   is an ordinary client global, so it round-trips through `sync_state`'s `merge_global_variables!`. It is
   not in `SERVER_OWNED_GLOBAL_NAMES` (only `se_captures`), so a client write passes straight through.
2. **The phish send is a client minigame.** `performSend` (`mail-bridge.js:343`) appends a `folder: 'sent'`
   record carrying `landed` to `mailState`, and when the send first lands it writes `victim.submitted` back
   onto `se_landing_pages[pageId]`. `mailState` reaches the server through `merge_mail_state!`, another
   client-written, client-synced section.
3. **The reader trusts both.** `phish_page_evidence_holds?` (`capture_proofs.rb:619` at the merged tip)
   returns true only when the stored page record has `built == true`, `meetsThreshold == true` and
   `victim.submitted == true`, and a `folder: 'sent'`, `landed: true` message to the target carrying one of
   the page's link kits exists. Every one of those is a value the client wrote and synced.

So a tampered client POSTs one `sync_state` with
`globalVariables.se_landing_pages = { payroll_login: { built: true, meetsThreshold: true, victim: { submitted: true } } }`
and `mailState` carrying one `sent`/`landed` message to the phish target with the page's kit id, and
`capture_evidence_holds?` returns true, so `record_capture!` stores the `payroll_login` credential
`proven: true` and `capture_secrets` serves `Sofia2026!`. No page was built, no email was sent. In
`lab_social_engineering` that secret is the code of a `password` lock (`sofia_archive`,
`scenario.json.erb`, `"requires": "Sofia2026!"`), so the forge hands the player a protected access value.
This is the cheat the plan closes.

## 2. Already on main

Four chunks are built, reviewed and merged to main. The remaining work (sections 4 onward) builds on them.

- **Stores and defaults.** `player_state['seLandingPages']` and `player_state['sePhishSends']` are added to
  `Game::ACCESS_STATE_DEFAULTS`, seeded to `{}` by the existing seed loop. They are not globals and not
  merged sections, so `sync_state` never reads them from the body, and they are not in the bootstrap
  serialisation allowlist, so they never ride back out to the client.
- **`BreakEscape::PhishScore`.** `lib/break_escape/phish_score.rb` is a pure Ruby port of the landing-page
  scorer (`scorePage` / `scoreFakeCheck` in `landing-page-model.js`): the domain guard, the per-factor
  scorers, the gates block, the fake-check scorer and the point tables. It returns
  `{ credibility, gates_passed, meets_threshold, blocked }` only, reads no secret and makes no request. A
  shared-fixture parity test (`test/models/break_escape/phish_score_parity_test.rb` and the node
  `social-phish-score-parity.test.mjs`) keeps the Ruby and JS copies from drifting.
- **Route 1, record a landing-page build.** `POST games/:id/se/landing_page` (under
  `around_action :with_game_lock`) runs `CaptureProofs#record_landing_page_build!`: it validates `pageId`,
  `targetId` and `choices` field by field against the page's authored menus, recomputes the verdict with
  `PhishScore`, and writes `seLandingPages[pageId] = { pageId, targetId, choices, credibility,
  meetsThreshold, built: true, at }` (first-wins on the page, last-score-wins on a rebuild). The store holds
  the server's own `meetsThreshold`/`credibility`, never the body's; the body carries no score. The client
  build module `se-landing-page-client.js` posts the closed set `{ pageId, targetId, choices }` from the
  builder's `attach()`, fire and forget, keeping the promise on `this._buildPost` for the send await. The
  `recompute_page_verdict?` predicate is universal (returns true for every page); nothing reads the store
  for the gate yet.
- **Validator rule.** `scripts/validate_scenario.rb` errors on any landing page whose `capture.secret` is a
  hard-access value (`CaptureModel.hard_access_values`: a lock code, an RFID or biometric `requires`, a
  Wi-Fi PSK, or a flag) unless the page is wired through a `social.mailClient.payloadKit` link kit, is
  buildable (some closed-menu choice set reaches the aimed target's `linkThreshold`, checked with the shared
  `PhishScore`), and has an authored `social.phishTargets` entry that aims at it. A landing secret that opens
  nothing is never flagged. The schema is unchanged: the routes record derived facts and add no authored
  field.

The remaining work is: the send route (Route 2), the legacy migration, and the reader change. It is
designed below under the four decisions.

## 3. The design decisions

- **One code path for the recompute.** The server recompute of `meetsThreshold` and `landed` runs for every
  scenario, not only when the served secret is protected. There is no protected-vs-not branch at runtime; a
  clean single path is worth more than saving a recompute on the awareness pages that gate nothing. The
  protected-vs-not distinction lives only at authoring time, in the validator rule above.
- **The send gate is the lighter check.** The server does not re-judge the composed message (sender,
  addressing, pretext). It gates on the server's own page `meetsThreshold` plus a validated, authored send
  to the authored target carrying the authored kit. The reasoning and what this gives up are in section 13.
- **`se_landing_pages` stays a client UI global the gate no longer trusts.** It is not made
  `SERVER_OWNED`; the gate simply stops reading it. See section 8.
- **A legacy landed send is imported once, gated on the re-derived build threshold.** See section 9.

## 4. The server model

Two server-owned records in `player_state`, written only by the two gated routes, read by the evidence
check. The client's `se_landing_pages` and `mailState` stay for the minigame UI; the server stops trusting
them for the gate.

### 4.1 The two server-owned stores

Both live in `ACCESS_STATE_DEFAULTS` (already on main), the way `plantedItems` and `seCaptures` do.

- `player_state['seLandingPages']` = `{ pageId => entry }`, one entry per built page, each
  `{ 'pageId', 'targetId', 'choices', 'credibility', 'meetsThreshold', 'built' => true, 'at' }`. `choices`
  is the closed seven-key (or fake-check four-key) set, stored so the verdict can be shown and, if the
  scorer ever changes, recomputed. `credibility` and `meetsThreshold` are the server's own recomputed
  values, never the client's. Written by Route 1 (on main).
- `player_state['sePhishSends']` = `{ sendKey => entry }`, one entry per recorded send, each
  `{ 'targetId', 'kitId', 'pageId', 'landed', 'at' }`. `sendKey` is `"#{targetId}/#{kitId}"`, so the store
  is bounded by (authored phish targets x link kits) and a resend to the same target/kit is first-wins on
  `landed: true`, never a new row. Written by Route 2 (section 5).

Both are server-written only. They are never read from the request body on `sync_state`, and they are not
in the bootstrap serialisation allowlist, so they never ride back out to the client (section 8). The client
keeps its own `se_landing_pages`/`mailState` for the UI and reads the capture record
(`captures_for_client`) for what it is allowed to see.

### 4.2 One code path for the verdict (decision one)

The build route recomputes `PhishScore` for every page (`recompute_page_verdict?` returns true for all, on
main). The send route (section 5) computes `landed` the same way for every send. `phish_page_evidence_holds?`
(section 6) reads only the server stores, for every scenario. At runtime there is no protected-vs-not
branch: a phished credential in `lab_social_engineering` is gated through exactly the same two stores as a
phished credential in an awareness scenario that gates nothing. The only place the hard-access distinction
is made is the validator, at authoring time, which errors if a page whose `capture.secret` is a hard-access
value is not reachable through the two routes. So the protected secret is gated like any other phished
credential, through one code path, and the author cannot quietly wire a protected secret so that it skips
the routes.

## 5. Route 2: record a phish send (the lighter gate)

`POST games/:id/se/phish_send`, called by the send path (`performSend`, `mail-bridge.js:343`, from the
client send handler in `mail-client-minigame.js`, after the local record commit) once per send the client
would record as sent. Body: the composed message the client already bounds to `PENDING_MESSAGE_KEYS`
(`mail-bridge.js:320`: `fromAccount`, `to`, `targetId`, `subject`, `headerFrom`, slot values, `attachment`,
`link`) plus `{ targetId, kitId }`.

The route goes on `around_action :with_game_lock`, as Route 1 does: it saves the whole `player_state` and
re-stamps captures, so outside the row lock it would race `performSend`'s `mailState` sync on the same row
and could revert a just-synced change from a stale copy (the exact race the `with_game_lock` comment
documents, and the one the build route had to be moved under the lock to fix). The locking guard test
(`game_state_locking_test.rb`) lists `record_phish_send!` among its state writers, with a
`se/phish_send is locked` case that fails with the lock removed.

The gate, `CaptureProofs#record_phish_send!(input, scenario:)`, mirroring `record_landing_page_build!`:

1. **`targetId` is an authored phish target** (`CaptureModel.phish_target_ids`); else refuse `invalid`,
   nothing stored.
2. **`kitId` is an authored `kind: 'link'` payload kit** in `social.mailClient.payloadKit`, with a string
   `landingPageId` (the `findLinkKit` discipline, `mail-bridge.js:89-93`); else refuse `invalid`. The kit's
   `landingPageId` is the `pageId` the entry records; the body does not assert `pageId`.
3. **The composed message fields are validated against the target's authored sets**, the same closed-menu
   discipline as Route 1: `fromAccount` is an authored account in `social.mailClient.accounts`, `headerFrom`
   and slot values are authored value ids, the `link`/`attachment` kit ids are authored payload kits. A
   field naming an unauthored value is refused `invalid`. This validation is hostile-input hygiene: it keeps
   the body bounded to authored options, like a typed lock code, so a tampered client cannot inject
   arbitrary data. It does not judge the message, and it does not feed `landed` (see decision two,
   section 13).
4. **Compute `landed` from facts the server owns.**

   ```
   page   = player_state.dig('seLandingPages', kit['landingPageId'])
   landed = page.is_a?(Hash) && page['built'] == true && page['meetsThreshold'] == true
   ```

   That is, `landed` is true exactly when the kit's landing page has been recorded as built by Route 1 and
   the server's own recomputed `meetsThreshold` holds. The target and kit are already proven authored by
   steps 1 and 2, so a recorded send lands iff its kit's page is server-convincing. The body's `landed` is
   ignored. A send whose kit names a page not yet in `seLandingPages` is recorded `landed: false` (the
   message cannot land through a page the server has no build for), matching the client's own
   `linkCredible = missing` for an unbuilt page.
5. **Store** `sePhishSends["#{targetId}/#{kitId}"] = { targetId, kitId, pageId: kit['landingPageId'],
   landed, at }`, first-wins on `landed: true` (a later send cannot un-land an earlier success), last-wins
   while still `landed: false` (a resend after the page is built finally lands and overwrites the earlier
   miss). Re-stamp dependent captures (section 6).

**What "an authored send to the authored target and kit" means as server-checkable evidence.** The server
records, per send, `{ targetId, kitId, pageId, landed, at }`. It matches `targetId` against
`social.phishTargets`, `kitId` against the authored `kind: 'link'` payload kits, derives `pageId` from the
kit's `landingPageId` (not from the body), and reads `landed` off the server-owned `seLandingPages` store,
never the body. The composed message is validated against the target's authored templates, the authored
`social.mailClient.accounts` and authored slot ids, so the send is a real, bounded, authored composition
rather than a bare `{ targetId, kitId }` pair, but its craft is not judged. No client-asserted score or
verdict is trusted anywhere on this path.

This route ports **no** account resolution, factor bias or message judge; the lighter gate needs none
(decision two, section 13). The only server recomputation it relies on is `PhishScore`, already on main,
reached through the `seLandingPages` store.

## 6. The reader change and stamping

`phish_page_evidence_holds?` stops reading `se_landing_pages` and `mailState` and reads the two server
stores instead. Its signature drops `extra_sent`:

```
def phish_page_evidence_holds?(page_id, target_id, scenario)
  page = player_state.dig('seLandingPages', page_id)
  return false unless page.is_a?(Hash) && page['built'] == true && page['meetsThreshold'] == true

  info    = CaptureModel.page_evidence_kits(scenario)[page_id]
  kit_ids = info ? Array(info[:kits]) : []
  return false if kit_ids.empty?

  Array(player_state['sePhishSends']).any? do |_key, send|
    send.is_a?(Hash) && send['landed'] == true &&
      send['targetId'].to_s == target_id.to_s && kit_ids.include?(send['kitId'])
  end
end
```

`victim.submitted` is no longer read: it was `page.meetsThreshold && landed`, and both conjuncts are now the
server's own `page['meetsThreshold']` and `send['landed']`, so the derived submission is exactly these two
server facts holding together.

**`extra_sent` is removed, not kept and ignored.** It carried the request's own sent messages so the sync
could credit a send that arrived in the same body as the capture claim. A send now reaches the server
through Route 2, never through a sync body, so there is no request-local sent message for this path. The
parameter is dropped from `phish_page_evidence_holds?`, and from `capture_evidence_holds?`,
`capture_revealable?` and `stamp_proven_captures!`, which only ever forwarded it to the phish reader. The
caller in `apply_capture_sync_step` stops building `extra_sent` for this path. `each_stored_sent_message`
and `phish_evidence_fingerprint` retire with it.

**Stamping moves to the routes.** Today `stamp_proven_captures!` runs on `sync_state` and on the bootstrap,
because the evidence used to arrive on a sync. Under this plan the phish evidence arrives at the two routes,
so each route, after writing its record and before `save!`, re-runs `stamp_proven_captures!(scenario:)`, and
the route answer carries the freshly revealable capture (the same `captures`/`capturesRefused` answer shape
the sync uses). A `sync_state` can no longer advance this evidence, so the phish branch of the sync's stamp
walk, `phish_evidence_fingerprint`, and the `phishGated` / `phish_gated_unproven_captures?` machinery retire
for this path, including the now-dead `phishGated` writes (capture_proofs.rb:174 and :695). `captures_for_client` is
an allowlist that never emits `phishGated`, so it needs no change. The controller's phish-gating block in `apply_capture_sync_step` (`@phish_fp_before`, the
`needs_stamp` fingerprint compare, and the `extra_sent` build and forward) goes with them.

The capture record itself is still created the way it is today, from the client's own capture claim. When
the client's mail minigame judges a send as landing on a built, convincing page (`describeVictimOutcome`
returns `submitted: true`, `captureGranted` fires), it calls `recordCapture` into `se_captures`
(`mail-bridge.js:422-438`) and syncs it, and `apply_capture_sync_step` writes the `seCaptures` entry through
`record_capture!` exactly as before. Route 2 does not create the capture; it records the send evidence the
stamp then checks. The server never fabricates a capture the client did not claim, and, because the server
gate is a strict superset of the client judge (section 7), every claim the client makes is one the server
stamps.

This does not regress part-3 serving: the two live readers re-check `capture_revealable?` on every serve
(`game.rb`, `network_access.rb`), so a part-3-gated capture is served off that live read, not off a
sync-time stamp. Part-3 proofs (`target_capture_proofs`) are unchanged; they already read server-owned proof
lists (`plantedItems`, `signedInPcs`, `gainedFootholds`), arriving through their own routes, so a credential
gated on both a phish and a part-3 proof still needs both.

## 7. Client and server in parity: the gate is a strict superset of the client judge

The client keeps its own judge and the client decides what the player sees. `evaluateMessage`
(`phish-rules.js`) and `describeVictimOutcome` (`landing-page-model.js:693-703`) still decide, on the
client, whether the victim lands and whether the credential is revealed, and the client still records the
capture claim when they say so (`captureGranted` to `recordCapture`, `mail-bridge.js:422-438`), exactly as
today. Nothing in the client reveal path changes.

The server gate is a strict superset of that client judge. The client grants the capture only when the
victim outcome becomes `submitted`, which `describeVictimOutcome` returns only when `meets && didLand`:
`meets` is the page's `meetsThreshold`, `didLand` is `evaluateMessage`'s `landed` (the email opened and no
required sender/addressing/pretext factor failed). The server gate requires less to let a send through: the
page's own `meetsThreshold` (server-recomputed, held in parity with the client's by the `PhishScore`
shared-fixture test), an authored target and an authored kit, and a recorded send. On every honest path the
send goes to the authored target carrying the authored kit (the composer only offers a built page's kit),
and the two routes have been posted, so the server stores hold a built, convincing page and a landed send.

Because `meets` is the same page threshold on both sides and the server drops the extra
sender/addressing/pretext factors the client adds, every send the client judges as landed is a send the
server gate passes. So a legitimate player is never refused what the game showed them: the capture the
client claimed is always one the server stamps `proven` through the two stores.

The server can be more lenient than the client, for example toward a poor-pretext forged send that names
the right target and carries the right kit over a server-convincing page. That leniency is the accepted cost
of the lighter gate (section 13). The direction matters: because the server is never stricter than the
client, client/server drift can never refuse a legitimate player. At worst a later drift lets through a
forged send that the lighter gate already accepts; it can never withhold a credential the game revealed.

Two tests pin this property (scheduled in chunk A, section 14):

- **A superset test.** Shared parity fixtures across the `lab_social_engineering` kits and targets and the
  test scenario: for every case the client judge lands (`describeVictimOutcome` returns `submitted`), the
  server gate (`record_phish_send!`'s `landed` plus the reader's authored-target/authored-kit check) passes.
  No client-landed case is refused by the server. The fixture set also takes one landing kit and target from
  each other scenario that authors a phish (the awareness scenarios included, found by a scenario scan in the
  test, not a fixed list), so the one reader is checked on every authored phish, not only the lab.
- **A guard test.** A focused assertion that the server's `landed` depends only on the page's
  `meetsThreshold` and the authored target and kit, not on any message-craft factor. It feeds a
  client-landed case with a deliberately weak pretext and a mis-addressed greeting and asserts the server
  still lands it. A later edit that made the server stricter than the client, by reading a sender or pretext
  factor into the gate, fails this test.

## 8. Keeping the stores server-owned and off the client (decision three)

The two stores must be unwritable by the client, and must not ride back out to it. `se_landing_pages` stays
a client UI global the gate ignores.

- **Never written from the request.** `seLandingPages` and `sePhishSends` are plain `player_state` keys the
  client never sends. The `sync_state` merge touches only the sections it names (`currentRoom`,
  `globalVariables`, `mailState`, inventory, and so on); it never reads the two keys from the body, so a
  client cannot write them. They are not globals and not merged sections, so no reject list is needed.
- **Never serialised to the client.** The bootstrap `scenario` action attaches top-level `player_state`
  keys to the client copy one by one (`objectivesState`, `submittedFlags`, `captures`, and so on), from a
  named set; `seLandingPages` and `sePhishSends` are not among them and must not be added. `seCaptures`
  reaches the client only through `captures_for_client`, which strips `proven`/`phishGated` and never serves
  a secret; the sync answer builds from `captures_for_client`, not the whole state. `globalVariables` is a
  different case: it ships wholesale as `savedGlobalVariables` (`games_controller.rb:344-346`), a
  whole-section dump, and it carries the legacy `se_landing_pages` global. That is why `se_landing_pages`
  still goes out to the client (the builder UI needs it); the two server stores are not globals and are
  never in that dump. The implementer confirms the two stores stay off the client by grepping the `scenario`
  action and the sync answer for the two keys and finding no reference. (This is already true for
  `seLandingPages` and `sePhishSends` on main; it is re-confirmed when Route 2 and the reader land.)
- **`se_landing_pages` stays a client UI global, untrusted.** It is not added to `SERVER_OWNED_GLOBAL_NAMES`.
  Making it server-owned would be a larger UI change (the builder restores its own state from
  `globals[PAGES_KEY]`, `landing-page-builder-minigame.js`), for no security the gate does not already have
  once it reads only `seLandingPages`. The minimal, safe change is to leave it a client-owned UI global the
  gate no longer trusts. `mailState` stays exactly as it is (the mail UI needs it); the gate stops reading
  it for `landed`.

A tampered client can still write `se_landing_pages`/`mailState` to any shape, and the minigame UI will show
whatever it writes, but the gate reads neither, so the forge no longer serves the secret.

### Payload size (the sync size rule)

Synced player state must not grow so data is constantly re-sent.

- `seLandingPages` is bounded by the scenario's landing pages (one in the lab, a handful at most), one entry
  each, written only by Route 1. `sePhishSends` is bounded by (phish targets x link kits), keyed so a resend
  is first-wins, written only by Route 2. Neither is ever in the client-to-server payload, the bootstrap, or
  the sync answer.
- The two routes carry a one-shot body each (the page `choices`, or one composed message), the same shape
  the client already persists on its own records; they are single actions, like `POST network/plant`, not
  re-sent state.
- `sync_state` sends **less**, not more: `se_landing_pages` and `mailState` no longer have to be trusted for
  the gate, and the `phish_evidence_fingerprint` walk over the mailbox on every sync retires (section 6).

Net new synced-state growth: zero per sync.

## 9. Legacy saves: a one-time import (decision four)

A save made before this change has its phish evidence in the client globals, not the server stores. On the
first bootstrap that holds `scenario_data`, migrate it once.

**Before (old save, client-written evidence):**

```json
{
  "globalVariables": {
    "se_landing_pages": {
      "payroll_login": {
        "pageId": "payroll_login", "targetId": "lord", "built": true,
        "credibility": 80, "meetsThreshold": true,
        "choices": { "brand": "ledgerwell", "purpose": "payslip", "domainId": "d_word",
                     "logo": "crisp", "wording": "w_formal", "fields": ["email","password"], "padlock": true },
        "victim": { "visited": true, "submitted": true }
      }
    }
  },
  "mailState": { "mailboxes": { "lord": { "messages": [
    { "folder": "sent", "landed": true, "targetId": "lord", "link": { "kitId": "kit_payroll_page" } }
  ] } } },
  "seCaptures": { "lord": { "targetId": "lord", "kind": "credential", "proven": true } }
}
```

**After (migrated to server stores, verdicts re-derived server-side):**

```json
{
  "seLandingPages": {
    "payroll_login": { "pageId": "payroll_login", "targetId": "lord",
      "choices": { "brand": "ledgerwell", "purpose": "payslip", "domainId": "d_word",
                   "logo": "crisp", "wording": "w_formal", "fields": ["email","password"], "padlock": true },
      "credibility": 80, "meetsThreshold": true, "built": true, "at": 1731600000000 }
  },
  "sePhishSends": {
    "lord/kit_payroll_page": { "targetId": "lord", "kitId": "kit_payroll_page",
      "pageId": "payroll_login", "landed": true, "at": 1731600000000 }
  },
  "seCaptures": { "lord": { "targetId": "lord", "kind": "credential", "proven": true } }
}
```

The migration, `migrate_legacy_phish_evidence!(scenario:)`, mirroring `migrate_legacy_captures!`:

- **The build verdict is re-derived, not trusted.** The old record carries `choices`; the migration
  validates them against the page menus and runs `PhishScore.score` on them, storing the **server's**
  `meetsThreshold`, not the old record's. An old save that forged `meetsThreshold: true` with junk choices
  migrates to a server verdict computed from those choices, so a forged old save is not laundered into a
  server fact. A page whose old `choices` are absent or off-menu migrates as not built (the player rebuilds;
  honest play reaches it again).
- **The landed send is keyed off the legacy save's own durable landed marker, not a surviving sent mail
  record.** The mailbox is capped and `performSend`'s `sent` record can be trimmed out of `mailState`
  before the save is taken, so the import must not depend on that record surviving. The durable marker the
  legacy client wrote for a landed phish is `globalVariables.se_landing_pages[pageId].victim.submitted ==
  true`: the mail bridge writes the best victim outcome back onto the page record on the send that lands
  (`betterVictim`, `mail-bridge.js:418-420`), and `victim.submitted` is set only when the page met threshold
  and the email landed (`describeVictimOutcome`, `landing-page-model.js:701`). This lives in
  `se_landing_pages`, not `mailState`, so the mailbox cap never trims it; the old reader read exactly this
  marker (`capture_proofs.rb:626`). So the import rule is: for each legacy `se_landing_pages[pageId]` whose
  `victim.submitted == true`, that is wired to an authored phish target and an authored `kind: 'link'`
  payload kit (the section 5 reachability facts: the kit's `landingPageId` is this page and the target aims
  at it), write `sePhishSends["#{targetId}/#{kitId}"]` with
  `landed = seLandingPages[pageId].built && meetsThreshold` taken from the **server's re-derived build**
  above. No stored sent mail is consulted, and no client `landed` is trusted. An honest old save (its stored
  `choices` re-score to `meetsThreshold: true`) is imported as landed even if its sent record was trimmed,
  so it is not soft-locked into redoing the phish; a forged old marker whose page does not re-score
  convincing imports as `landed: false` and is still blocked.
- **What a forged legacy landed marker still leaves open, and why it is no worse than live B.** A tampered
  old save can set `victim.submitted: true` on a page it did not honestly build. But the import credits
  `landed` only from the server's re-derived build threshold, rebuilt from the save's stored `choices`, so a
  forged marker lands a send only when those `choices` genuinely re-score above threshold, which is playing
  the builder. That is exactly what Route 2 computes for a fresh send: an authored target and kit over a
  server-convincing page, with the message craft not judged. So the import adds no trust beyond live B. The
  one thing it does not re-verify, that the forged marker's choices were really entered through the builder
  rather than hand-written into the save, is the same best-effort gap B accepts on the live path (a forged
  Route 1 body with choices that happen to score above threshold is playing the builder by another name),
  so the migrated outcome is no worse than a fresh forge, which B already accepts.
- **One-time and idempotent.** The writer runs once per save, gated on `phishEvidenceMigrated` (section
  9.1), and `sePhishSends` is first-wins on `landed: true`, so a re-run (or a later live Route 2 send for
  the same target/kit) credits once and never double-writes. `seLandingPages` is first-wins per page the
  same way.
- **An already-proven capture is left alone.** If `seCaptures[target].proven == true` already (the player was
  served the secret in the old save), the migration leaves the capture entry as it is; part-2 evidence only
  ever withholds, never retracts (the proof lists are monotonic), so a player who finished the phish keeps
  the result. The migration still populates the two server stores so the reader has them once it flips.
- **No format bump, no `db:migrate`.** The two stores default to `{}` via `ACCESS_STATE_DEFAULTS`, and the
  migration is a data move inside `player_state`. The old `se_landing_pages` global is left in place for the
  UI; the old `mailState` is untouched.

### 9.1 Migration trigger and gate

The migration reads the scenario and must run before the first phish route or sync reads the new stores, so
it belongs in the locked bootstrap that already holds `scenario_data`: `prepare_bootstrap_state!`, called
from the `scenario` bootstrap action. It must not be wired to `sync_state`, which loads the narrow
`SYNC_STATE_COLUMNS` (no `scenario_data`) and is often the first request after deploy, the same discipline
the capture migration follows. `ensure_current_format!` runs before `prepare_bootstrap_state!`, so the
migration always reads current-format scenario data; no format transform touches `se_landing_pages`,
`mailState`, `globalVariables` or the scenario's `social.landingPages`/`phishTargets`.

It is a genuinely separate guarded step, not folded silently next to the capture migration, because
`bootstrap_state_needs_write?` is a cheap OR of predicates that decides whether the lock is taken at all. A
save with legacy `globalVariables.se_landing_pages` but already-migrated captures and empty new stores trips
none of the existing predicates, so without its own predicate the lock is never taken and the migration
never runs for exactly the save that needs it. So:

- A new predicate `legacy_phish_evidence?` (player_state alone, no scenario): true when
  `globalVariables.se_landing_pages` is a non-empty Hash and `phishEvidenceMigrated` is not set. It is added
  to the OR in `bootstrap_state_needs_write?`.
- A new writer `migrate_legacy_phish_evidence!(scenario:)` is added to `run_bootstrap_writers!`, ordered
  **before** `stamp_proven_captures!`, so the stamp that follows in the same locked pass picks up the
  migrated evidence and stamps the capture `proven: true` at once, closing the narrow `proven: false` window
  directly. The writer sets `phishEvidenceMigrated = true` when it finishes.
- The writer's first line is an entry guard: it returns at once when `player_state['phishEvidenceMigrated']
  == true`. The lock predicate alone is not enough, because `run_bootstrap_writers!` (game.rb:1309-1323) calls
  every writer whenever the lock is taken for any reason (another writer's predicate can take it), and unlike
  `migrate_legacy_captures!` this migration leaves `se_landing_pages` in place, so without the guard it would
  re-read that client-writable global on every later locked bootstrap. With the guard it runs a single time.

`phishEvidenceMigrated` is a top-level, server-owned `player_state` key, not a global. It is never read from
the `sync_state` body (a global in `globalVariables` would merge through `sync_state`, letting a tampered
client set the flag and skip its own migration; that would only self-harm, since the server stores would
stay empty and the reader would withhold, but it is avoidable state the client should not touch) and it is
never in the bootstrap serialisation allowlist (a global rides back out in `savedGlobalVariables` and is
re-synced, a small breach of the sync-size rule in section 8). Keeping it a top-level server-owned flag
keeps it off both paths.

The common honest case needs no migration to stay unlocked anyway: an honest mid-lab old save recorded the
capture `proven: true` when it was first recorded, and `capture_revealable?` serves any `proven: true` entry
without reading the phish stores. The migration closes the narrow `proven: false` window, where the player
built and sent but the capture had not yet been stamped when the save was taken.

## 10. The migration ships before the reader change

Migration-before-reader is a hard ordering constraint, not a preference. Once the reader consults the server
stores (section 6), a returning honest save in the narrow `proven: false` window (built and sent, not yet
stamped) has its phish evidence only in the client globals, so if the migration has not populated the server
stores first, the new reader returns false and withholds `Sofia2026!` from a legitimately playing student.
Migration-before-reader is strictly safe: the migration writes the server stores while the old reader still
reads client globals, which is harmless until the reader flips. The build order (section 14) places the
migration chunk before the reader chunk for this reason, and every chunk up to the reader leaves the old
client-evidence reader in place, so the forge is no worse than today until the reader closes it, and no
legitimate student is ever withheld the secret between two deploys.

## 11. Network delays, offline play, reload: a legitimate player is never refused

A legitimate player must never be refused, and an honest build and send must always be credited. The two
routes are self-contained server events, so the guarantees are simpler than the sync path's.

- **Each route carries its own fact.** Route 1 writes `seLandingPages` and Route 2 writes `sePhishSends`
  directly; neither depends on a `sync_state` landing first. The capture is stamped inside the route that
  completes the evidence (section 6), so the secret is revealable the instant the second route's `save!`
  commits, with no wait for a sync.
- **The send route awaits the build route's response, not a sync.** `landed` reads the server's page
  `meetsThreshold`, so the build must be recorded on the server before the send is judged. The client send
  helper **awaits the build POST's HTTP response before firing the send POST**. On every honest path the
  page is built client-side before its link can be attached to a message (the composer only offers a built
  page's kit, `mail-composer.js:669-685`, `rec.built === true`), so the build route has already been POSTed;
  the send helper waits for that POST's own promise (`this._buildPost`) to resolve, then posts the send.
  Awaiting a `sync_state` would be wrong here: `seLandingPages` is server-written only and never in the sync
  answer, so a sync neither carries the build confirmation to the client nor proves the build POST committed.
  This await is the primary guarantee against the race. If, despite the ordering, a send route still arrives
  before its build route is recorded, Route 2 records the send `landed: false` and answers
  `{ success: true, landed: false, reason: 'page_not_built_yet', retryable: true }`; the send helper, on that
  reason-and-flag, re-awaits the in-flight build POST (or re-posts the build from the client page record if
  none is pending) and re-posts the send once. The re-post normally lands because the build is now recorded.
  If that single re-post also returns `page_not_built_yet`, the send is handed to the bounded offline
  re-send queue below, which re-posts it (builds before sends) on the next `online` event or sync until the
  build is recorded and the send lands.
- **Offline, then reconnect.** A route POST cannot be sent while offline. A build or send made offline, or a
  send a persistent `page_not_built_yet` left unlanded after its one re-post, is held in a **bounded
  in-memory re-send queue** on the SE minigame controller (not in `player_state`, so the sync size rule is
  untouched), keyed by `pageId` (builds) or `targetId/kitId` (sends) so it holds at most one entry per page
  or per target/kit and cannot grow per attempt; it is drained on the browser `online` event (the
  `conclude-mission.js` precedent) and on the next successful sync, each drain re-posting through the normal
  route once, builds before sends. The server records are idempotent (first-wins on success), so a drained
  duplicate is a no-op and never double-credits. A true forge (off-menu build choices, a send to an
  unauthored target) is refused on every drain and never credited; the queue cannot spin because each drain
  is one route call triggered only externally.
- **Reload.** `seLandingPages` and `sePhishSends` persist in `player_state`, so an earned phish survives a
  reload; the minigame rebuilds its UI from the client globals as today. A build or send not yet posted when
  the tab reloads is re-driven by the minigame the next time the player attaches or sends, and the server
  record is idempotent, so a replay credits once.

## 12. Cheat policy: what is server-enforced and what stays best effort

Under the cheat policy the server hard-enforces anything that lets a student past a secret; a client
shortcut that only saves time is acceptable; hardening must never block a student playing as intended.

- **Server-enforced, because a protected secret is at stake (`lab_social_engineering`).** The page being
  convincing (`meetsThreshold`) is recomputed from the authored rules and the player's validated choices,
  which the server owns outright through `PhishScore`. The send landing is gated on that server page verdict
  plus an authored send to the authored target carrying the authored kit, all server-verified. The
  submission is derived from the two. The secret (`Sofia2026!`, a password-lock code) is served only when
  both server facts hold. Forging `se_landing_pages`/`mailState` no longer serves it. This is mandatory, not
  a preference, for a protected secret.
- **The message craft is best effort, by decision two.** The server does not judge the sender, addressing or
  pretext. Under the cheat policy this is the "ink-gated steps stay best effort" category: the sender and
  pretext craft is a learning step, enforced client-side and shown as feedback, not a hard gate on the
  secret. What stays hard is the page credibility (recomputed) and the target/kit of the send (validated).
  Section 13 states exactly what this gives up.
- **Best effort is acceptable where the served secret is not a hard-access value.** Across the corpus that is
  every awareness scenario and test fixture: each landing page carries no protected `capture.secret`, so
  there is nothing behind the phish to hard-enforce. Recording the authored build and send, with the page
  verdict recomputed on the one code path, closes nothing a protected secret depends on, because none does.
- **Honest play still works.** The server serves the secret the moment it has recorded an authored build with
  a server-convincing page and an authored landed send to the authored target with the authored kit, so the
  intended solve is unblocked. The validator rule (on main) keeps the page's secret reachable only through
  the two routes, so a future author cannot quietly reopen the forge.

## 13. Decision two: why the lighter check, and what it rules out

This is written for the reader weighing the trade. It answers directly: is the client/server drift risk
real, which way would it bite, how does the lighter gate make it harmless, and what does it give up.

**Is the drift risk real? Yes.** Deciding `landed` from the authored rules in full means porting three
pieces of client logic into Ruby: the account resolution (`resolveAccounts`, `mail-data.js`), the factor
bias (`applyFactorBias`, `mail-bridge.js`) and the message judge (`evaluateMessage` and its helpers,
`phish-rules.js`), roughly 460 lines across three files. Two copies of the same logic drift. A type
coercion that differs between Ruby and JS, a factor mode read one way on one side, an account-resolution
edge handled slightly differently, and the two verdicts disagree.

**Which way it would bite with a full port: a legitimate player blocked.** If the server re-judged the
message, the failure that would matter is the server refusing a send the client landed. A player crafts a
sender and pretext the client's judge accepts, the client shows the email landed and grants the capture, and
the server, diverging on one subtle branch, records `landed: false` and withholds `Sofia2026!`. The first
symptom is a student who did everything right and cannot open the lock, with nothing on screen to explain
it. The drift would not have to exist on day one; it would be latent, surfacing the moment someone edited
the mail client's account handling or factor logic in JS and did not mirror it in Ruby. That is the bad
experience the lighter gate is chosen to avoid.

**How the lighter gate makes drift harmless.** It computes `landed` only from facts the server already owns
outright: the page's server-recomputed `meetsThreshold` (one port, `PhishScore`, already on main and held in
parity with the JS by a shared-fixture test) plus two closed-set membership checks (the target is authored,
the kit is authored). There is no second large port to keep in sync, no account globals to resolve, no
factor bias to reproduce. One scorer, not a scorer plus a judge. And the one direction that could refuse a
player is closed structurally: the server gate is a strict superset of the client judge (section 7), so the
server is never stricter than the client. The client still scores sender and pretext and grants the capture
only when its own judge lands; the server asks for less, so it passes every send the client granted.
Client/server drift can never refuse a legitimate player; at worst a later drift lets through a forged send
the lighter gate already accepts. The superset and guard tests (section 7, chunk A) hold that invariant.

**What it gives up.** The server no longer judges the sender, addressing or pretext quality. A crafted send
that names the right target and carries the right kit lands even with a poor pretext, a wrong-looking From or
a mis-addressed greeting, as long as the page meets threshold. For `lord`, the one protected target, the
sender, addressing and pretext factors (`senderTrust`, `addressedTo`, `pretextRelevant`) are no longer a
hard gate on the secret. Concretely: a determined player who builds a genuinely convincing page (which still
requires playing the build minigame correctly, because the page score is server-recomputed) and sends any
authored message to `lord` carrying the payroll kit is served `Sofia2026!`, whether or not the email would
have fooled her. This is the accepted cost of B.

**What that means for cheat resistance.** The project policy hard-enforces secrets and keys and lets
ink-gated steps stay best effort. The lighter gate keeps the hard parts hard: the secret still requires a
server-recomputed convincing page and a send to the authored target with the authored kit, neither of which
a tampered client can forge. What drops out of the hard tier is the message-craft judgement, which becomes
best effort. The learning value of crafting a convincing sender and pretext is still taught and scored, but
client-side, as the feedback the mail minigame already shows, not as a wall in front of the credential. The
lab is a little easier to complete, and in exchange its protected secret can never be served off forged
client state and no honest player is ever blocked by a Ruby/JS disagreement that does not exist.

**What stays client-side only.** The mail minigame's `evaluateMessage`, its account resolution and its
factor-bias handling all stay in the client, unchanged, feeding the player's send feedback (did it land,
which factors were weak) and the client's own reveal of the captured credential. None of it is trusted by
the gate, and none of it is removed; the client keeps teaching pretext quality as gameplay.

**What the lighter gate rules out of the design.** It drops the entire send-judge port: no
`lib/break_escape/phish_judge.rb` (the `resolveAccounts`, `applyFactorBias` and `evaluateMessage` Ruby
port), no `phish_judge_parity_test.rb`, and no server reading of the account-resolution or factor-bias
globals (`acct_<id>`, `acct_<id>_choice`, an account's `unlockedBy`, `burned_<id>`, the
`boostIfGlobal`/`strictIfGlobal` flags). Route 2 resolves no account and judges no message. The validator's
kit-reachability rule stays the structural check already on main (an aimed phish target exists and carries
the per-target threshold); the fuller "a composed message can actually satisfy the target's required
factors" check is not added, because the server no longer judges the message, so there is no runtime judge
for the author-time check to mirror.

## 14. Build order (remaining chunks)

Three chunks remain, each leaving the game runnable, testable and committable on its own. Two ordering
constraints set the sequence: the reader change lands only after the send store exists and is populated, and
the migration lands before the reader change (section 10). Order: send route, then migration, then reader.

**Chunk A: Route 2 (send) and its store write.** Add `record_phish_send!` (section 5), the
`POST se/phish_send` route under `around_action :with_game_lock` with its `GamePolicy` method and `set_game`
coverage, the client send POST (awaiting the build POST, section 11) and the retry/offline-queue wiring. Add
`record_phish_send!` to the locking guard test. It writes `sePhishSends`; nothing reads it for the gate yet,
so the old client-evidence reader still drives the reveal and honest play is unaffected. Both stores now
fill. This chunk no longer carries a client reveal change (the client keeps its own judge and records the
capture as today, section 7), so it is smaller than it would have been under a reveal-follows-server design:
the client work is the send POST, the build-await and the offline queue, with nothing touched in the reveal
path. Commit.

Tests: unit (`record_phish_send!`: authored target/kit accepted and landed from the built page, unbuilt page
gives `landed: false`, unauthored target or kit refused `invalid`, off-menu message field refused, resend is
first-wins idempotent); controller with real requests (`POST se/phish_send` stores the server verdict, is
under the lock per `game_state_locking_test.rb`, ignores a body-asserted `landed`); the superset test (every
client-landed fixture across the lab kits/targets and the test scenario passes the server gate) and the
guard test (the server `landed` reads only the page threshold and the authored target/kit, so a stricter
server edit fails), section 7; node (the send client posts on send, awaits the build POST, retries only on
`page_not_built_yet` + `retryable`, drains the offline queue once and never double-credits). Live browser
proof: section 15.

**Chunk B: legacy migration and its gate.** Add `legacy_phish_evidence?`, `migrate_legacy_phish_evidence!`
and its place in `bootstrap_state_needs_write?` / `run_bootstrap_writers!` (section 9.1), with
`phishEvidenceMigrated` as a top-level server-owned flag. Old saves populate the server stores on their next
bootstrap. The reader is still the old client-evidence path, so this is behaviour-neutral for live play (the
stores it writes are not yet read) and simply has the stores ready before the reader flips. Commit.

Tests: unit (an honest old save with good `choices` and a `victim.submitted` marker migrates to server
`meetsThreshold` and an imported `landed` gated on the re-derived build, even when the stored sent mail was
trimmed; a forged old save with junk choices migrates to `meetsThreshold: false` and `landed: false`; an
already-proven capture is left untouched while the stores still populate; the writer sets
`phishEvidenceMigrated` and runs once; with `phishEvidenceMigrated` already set, a bootstrap that takes the
lock through a different writer's predicate leaves both stores untouched even after `se_landing_pages` is
edited; `phishEvidenceMigrated` is never read from a `sync_state` body);
controller with real requests (the `scenario` bootstrap on an exposed legacy save takes the lock via
`legacy_phish_evidence?`, runs the migration and stamps the capture; `sync_state` does not run it). Live
browser proof: section 15.

**Chunk C: the reader change and stamping.** Switch `phish_page_evidence_holds?` to the two stores
(section 6), drop `extra_sent` through the call chain, re-stamp from the two routes, and retire
`phish_evidence_fingerprint`, `phish_gated_unproven_captures?`, `each_stored_sent_message`, the controller's
`@phish_fp_before` / `needs_stamp` / `extra_sent` block in `apply_capture_sync_step`, and the sync's phish
stamp branch. This is the chunk that moves trust off the client. Update the tests that assert on the retiring
machinery in the same chunk. Commit.

Tests: unit (`phish_page_evidence_holds?` reads only the server stores, true only when the page is
server-built-and-convincing and a landed send to the target with an authored kit exists; the forged-client
case returns false); controller with real requests (the forge from section 1 via `sync_state` no longer
serves the secret; an honest build then send through the two routes serves it; a convincing page with a send
whose kit's page is not built withholds it); the validator counts unchanged on the lab and the touched
fixtures. Live browser proof: section 15.

## 15. Hostile-input cases and live proofs

**Hostile-input cases** (asserted in the chunk tests above; the forge is the headline):

1. **A forged send for another target.** `POST se/phish_send` with a `targetId` that is not an authored
   phish target: refused `invalid`, nothing stored.
2. **The wrong kit.** A send whose `kitId` is not an authored `kind: 'link'` payload kit, or whose kit's
   `landingPageId` names no built page: the first is refused `invalid`; the second is recorded `landed:
   false` and never credits the secret.
3. **A page below the threshold.** A build whose choices re-score to `meetsThreshold: false`, then a send
   with its kit: the send records `landed: false`, the capture stays unproven, the secret is withheld.
4. **A replay.** Two send routes to the same target/kit after a landed first: one stored entry, the capture
   credited once (first-wins idempotency); a drained offline-queue duplicate is a no-op.
5. **A forged `se_landing_pages` global.** `sync_state` with
   `globalVariables.se_landing_pages = { payroll_login: { built: true, meetsThreshold: true, victim: {
   submitted: true } } }` and a forged `mailState` landed send, no build or send route called: after the
   reader change the `lord` capture stays unproven and `capture_secrets` withholds `Sofia2026!`. This is the
   forge the plan closes; it fails if the reader still reads the client globals.
6. **Hostile shapes.** Oversized or control-character `pageId`/`targetId`/`kitId` and over-long choice/slot
   ids on both routes: refused, nothing stored, no exception (the `valid_capture_target_id?` length-cap
   discipline).

**Live browser proof on the real game path.** The protected phish is in `lab_social_engineering` (its
`payroll_login` page is the only shipped landing page carrying a hard-access `capture.secret`). Each chunk's
proof runs on a keyless server on **port 3664 or 3665** (never `:3000`), headless, `setFPS(20)`, fixed steps
on, driving the real builder and mail client through `window.__test` and the real Attach/Send controls, with
the server stores read back read-only by a rails runner. `test_social_slice` is the forge-refused fixture
(same builder and routes, no protected payoff) where the lab's full reception/mail/osint progression is not
needed.

- **Chunk A (send route).** Drive the lab to a real build, then a real send to `lord` with
  `kit_payroll_page`; confirm `POST se/phish_send` recorded `sePhishSends["lord/kit_payroll_page"].landed ==
  true` from the server's own page verdict, and that a send before the build returns `page_not_built_yet`
  and lands on the re-post. Confirm the superset property holds on the real path: a send with a weak pretext
  the client judge would score down, over a server-convincing page, still records `landed: true` on the
  server (the client's own reveal is unchanged and is covered by the superset test). With Playwright `route`
  delaying then aborting the build and send POSTs, and `context.setOffline(true)` across a build-then-send
  then `setOffline(false)`, confirm the honest player is credited (on reconnect for the offline case) and
  never refused. Record game ids in the build log.
- **Chunk B (migration).** Seed an old save (good `choices`, a `victim.submitted` marker, empty server
  stores) via the keyless path, bootstrap it, and confirm the migration derived `meetsThreshold`, imported
  the send gated on it off the `victim.submitted` marker (with no surviving sent mail), and (with chunk C
  landed or the old reader) the secret is servable; a second seed with forged `meetsThreshold: true` over
  junk choices migrates to `meetsThreshold: false` and the secret is withheld.
- **Chunk C (reader).** Tampered run: `sync_state` the forged `se_landing_pages` and `mailState` with no
  build or send route called; confirm `capture_secrets` withholds `Sofia2026!` and the capture view shows
  the credential unproven. Honest run: build and send through the two routes; confirm the capture is served
  and the `sofia_archive` lock opens with the served secret.

## 16. What happens to the build/hard-phish-c4 branch

`build/hard-phish-c4` ported the full send judge (`lib/break_escape/phish_judge.rb`: `resolveAccounts`,
`applyFactorBias`, `evaluateMessage`, about 460 lines) with its parity fixtures and a review. It was built
on the assumption that the send gate would re-judge the message server-side. The settled design is the
lighter gate (section 13), which judges no message and resolves no account, so none of that port is part of
the design. Route 2 needs nothing from it.

**Drop the branch.** Keeping a 460-line Ruby copy of the mail client's judge, plus its parity fixtures,
would be exactly the drift-prone duplication the lighter gate was chosen to avoid, and nothing in the
remaining chunks calls it. The branch (judge, `phish_judge_parity_test.rb`, the node parity test, the
`validate_scenario.rb` message-land addition, and the review doc) is not merged. The one judge-independent
improvement it also carried, a profile-aware refinement to the validator's buildability search with a
fake-check node case, is a small author-time soundness tidy-up unrelated to the judge; it can be
cherry-picked as a standalone validator follow-up later if wanted, but it is not required by this plan and is
out of the critical path.
