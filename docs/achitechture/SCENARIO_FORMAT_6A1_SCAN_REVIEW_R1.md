# Scenario format hardening 6a-1 part 2 (fresh-state payload scan) review R1

Range: `1f322f593..17462190f` on `build/hard-6a1-scan`. Review only.

- Blocker: 0
- Major: 1
- Minor: 3

Verdict: FIX

The scan body is well built: class 1 is caught structurally from the schema marks and the
server-only-ancestor precedence, the `srand(1)` render is representative because the answer set is
collected from the same rendered `scenario_data` the routes serve, and class 2 and class 4 reuse
step 3's one match rule. The exceptions, their decisions headings and the known-failures wiring all
check out and the focused tests pass (`validator-known-failures.test.mjs`: 21 pass here). The one
Major is a coverage gap the coordinator's probe surfaced: a secret shipping in a declared
authored-text field is never value-checked, and the shared match rule is too narrow for short
secrets, so three plaintext secrets ship in the bootstrap while the scan stays green.

---

## Major 1: class-3 declared text is never value-checked, and the match rule misses short and prose-embedded secrets

`scenarios/test_secret_leaks/scenario.json.erb` (on this branch) ships all three of its secrets in
plain text in `scenario_brief`:

> "... a combination padlock (12-30-5). ... the cryptex answer WOLF ... carries the vault door PIN
> 4821 ..."

`scenario_brief` is served by `GET /games/:id/scenario`: `Game#filtered_scenario_for_bootstrap`
(`game.rb:1737`) starts from `scenario_data.deep_dup` and never deletes `scenario_brief`
(`grep` for a delete of it finds none; only rooms, objectives and characterSprites are touched). Yet
the fresh-state corpus scan reported zero findings for `test_secret_leaks` (only the three legacy
PCs across crypto2/3/4). The scenario is rendered and scanned, not skipped.

Two reasons compound, both confirmed against the code on this branch:

1. **class 3 is never compared with answers.** `scenario_brief` is a declared top-level string in
   `scripts/scenario-schema.json` (`{"type":"string"}`, unmarked), so in `walk_leaf`
   `SS.child(SS.root, 'scenario_brief')` resolves to a Node and `C.classify` returns `:class3`,
   which `classify_scalar` passes with no value check (`payload_scan_fresh_state_test.rb:574-575`,
   "`:class3` and `:not_secret` pass"). The class-3 comment (line 15, "a declared field with no
   mark: passes (authored clue text, which step 3 allows)") assumes step 3 guarantees class-3 text
   is secret-free. It does not: step 3's validator uses the same match rule, which has the same
   blind spot (see below), so this leak was caught by a human review round, not by either scanner.
   The upshot is that any secret pasted into a declared string (`scenario_brief`, a `postitNote`, an
   item `name`/`observations`, dialogue text, a door sign, a note) ships and the scan passes it.

2. **the match rule is too narrow even if class 3 were value-checked.**
   `SecretLeaks.answer_matches_leaf?` (`scripts/validate_secret_leaks.rb:155-193`):
   - a `combination` answer (12-30-5) only matches a leaf whose whole value is combination-form
     (`\A\d+(?:[\s,\-]+\d+)*\z`), so a combination quoted in prose never matches;
   - a `cryptex`/`password`/`pin` answer matches a whole word inside a longer string only when the
     answer is **6 or more characters** (`if av.length >= 6`). `WOLF` (4) and `4821` (4) are below
     that, so they only match a leaf that equals the secret exactly. In a prose field they never do.

   This also affects the scan's own class 2 and class 4 scope, not just class 3: a global or
   `minigameData` leaf (class 2), or an undeclared-key leaf (class 4), whose value *contains* a
   4-digit PIN or 4-letter word inside a longer string (for example a global set to
   `"the door code is 4821"`) escapes the scan. Only a leaf equal to the short secret is caught.

**Why this matters.** The scan's headline value, and the build log's framing ("no secret ships",
"Scan results ... Three findings"), reads as proof that nothing secret reaches the client in the
fresh state. It is narrower than that: it does not cover secrets in declared authored text, and it
cannot see short secrets embedded in any longer string. The plan does scope the scan to
class 1 / 2 / unexempted class 4 and delegates class-3 text to step 3, so the implementation matches
the written spec; the gap is that the spec's own net has a hole, and a green scan should not be read
as "no plaintext secret ships".

**Suggested fix (pragmatic, honest about the tradeoff).**

- Value-check class-3 string leaves against the answer set with `answer_matches_leaf?` as well. This
  costs nothing in false positives for secrets of 6+ characters (a password like `Satchel42`, a long
  cryptex answer, a token) pasted into `scenario_brief` or dialogue would then be caught, which is the
  realistic leak. Keep class 3 passing for `:not_secret` text.
- State plainly, in the class-3 comment and the build log, that the scan does **not** detect short
  secrets (under 6 characters: most PINs, 4-letter cryptex words) or combinations embedded in prose,
  because the value rule cannot do so without unacceptable false positives (`4821`, `1234` and `12-30-5`
  occur in ordinary descriptive text, dates and room numbers). Those remain human-review territory,
  and the scan's guarantee should be stated as "no class 1/2/unexempted-class-4 **value-matchable**
  leaf ships", not "no secret ships".
- For the specific fixture, the remediation already in flight (the `build/hard-step3` builder
  rewriting the brief so it does not name the secrets) is the right resolution; the scan should not be
  expected to catch 4-digit and 4-letter secrets quoted in prose.

---

## Minor 1: `SKIP_ROUTES` omits `friendface_phone`, so the "routes it leaves out" claim is incomplete

`SKIP_ROUTES` (lines 223-235) is asserted to be exhaustive by name and reason
(`test 'the fresh-state scan names the routes it leaves out, each with a reason'`). It lists
`POST feed_post` ("serialised like feedPosts (class 4), fetched by 6a-2"), but not `POST
friendface_phone`, which serves the same feed data: `open_friendface_phone`
(`social_feed.rb:281`) returns `feedPosts` (when asked with `posts=1`) plus `site`/`person`. The
two GET panel routes `vm_panel` and `vm_set_panel` are also unlisted. None of these leaks in the
fresh state (friendface_phone returns `:forbidden` unless the player holds the phone item, which a
fresh inventory never does, and never sends `posts=1`; the panels redirect or `head :not_found` and
carry no JSON body), so there is no missed leak, only an incomplete list.

Suggested fix: add `friendface_phone` to `SKIP_ROUTES` with a reason parallel to `feed_post`
(opened-state, needs a held phone; serves feedPosts, class 4, fetched by 6a-2), and either list the
two panel routes with "redirect only, no scenario payload" or note in the test that the list covers
data-serving routes, so the "every route it leaves out" wording matches what is actually asserted.

## Minor 2: the build log names a method that does not exist

The 6a-1 part 2 build-log section (`SCENARIO_FORMAT_HARDENING_BUILD_LOG.md:3418`) attributes the
feed-fact withholding to "`SocialFeed.withhold_feed_facts!` / `strip_feed_facts!`". There is no
`strip_feed_facts!` in the tree (`grep` finds only `withhold_feed_facts!`, `social_feed.rb:306`).
The logic described is correct; the name is not. Drop the `/ strip_feed_facts!`.

The `intelFacts`-no-mark decision itself is sound: `withhold_feed_facts!` deletes the feed-gated
fact ids (from `AccessWork.feed_facts`) from the bootstrap's `social.intelFacts` at serve time, the
remaining facts are client-visible OSINT text that the client readers need, and a whole-record
`x-serverOnly` would wrongly withhold them. An unearned feed-gated fact leaking into the bootstrap
would be a `withhold_feed_facts!` bug (step 8.3's concern), and the scan would not catch it because
feed-fact text is narrative, not in the secret answer set, so leaving `intelFacts` unmarked is the
right call for 6a-1. Worth noting only that the scan therefore provides no net for feed-fact gating.

## Minor 3: a stale test name in the exceptions suite

`test('exceptions: the real list is an empty array until step 3 lands', ...)`
(`validator-known-failures.test.mjs:322`) now describes a condition that no longer holds: the
exceptions file holds three entries and step 3 has landed. The body only asserts the file parses to
an array, so the test is correct; the name misleads a future reader. Rename to something like
"the real exceptions list is a JSON array".

---

## Items checked and found correct

- **Server-only-ancestor precedence.** `walk_leaf` sets `child_withheld` true only for an
  unconditional `mark == true` on a route the node's `x-servedBy` does not name, and never clears it,
  so the whole subtree is withheld (class 1 if it ships). Conditional marks (`unlessLockType` /
  `whenLockType`) apply to the scalar `requires`/`combination` leaves via `C.classify`, which is
  correct (they are not subtree marks).
- **`srand(1)` is representative.** The answer set comes from `SecretLeaks.collect_answers` over the
  same rendered `scenario_data` the routes serve, so a randomised PIN is judged against its own
  shipped value; a randomised secret cannot come and go between the two.
- **class-4 serving allowance is not too broad.** `class4_served?` allows only `postitNote` on
  `GET /login_accounts` and `psk` on `GET /network`, and both bodies are server-constructed with a
  fixed shape, so the key check mirrors the `x-servedBy` marks without widening what can pass.
- **`clue_covers?` and class-2 alignment.** `clue_covers?` matches step 3's rule exactly
  (`c['lock'].to_s == lock_id.to_s && !lock_id.nil?` and `c['in'].to_s == container.to_s`), with the
  `global:<name>` container form matching `acknowledged_clues`'s `in`. The only divergence is that
  the scan's clue exemption does not replicate step 3's `inside_lock?` ERROR (a clue naming a
  container inside the lock's own contents), so the scan would exempt a case step 3 rejects; this is
  not a real hole because step 3 still blocks that scenario from validating clean. Worth a one-line
  note, no change needed.
- **`playerInventory` walk fix.** Remapping `playerInventory` to the item-array node makes an
  inventory item's `name`/`observations` class 3 (fixing the test_unlock_gaps "Pocket Cryptex" false
  positive) without hiding a real leak: an inventory item's `cryptexConfig.answer`, `combination` or
  `requires` is still reached through the item schema and classed server-only.
- **`acknowledgedApproved` wiring.** `otherApproved()` now pushes both the payload-scan-exception and
  the acknowledgedClues `[label, heading]` pairs into the shared-heading dedup, so one
  VALIDATOR_DECISIONS heading cannot back an entry in two lists. `root` is in scope and the reader
  guards a missing `scenarios/` directory.
- **Fixture test quality.** The per-class fixture proves each class fails (class 1 pin `requires`,
  class 2 leaked global with and without a covering clue, class 4 undeclared-key password) and that a
  legitimate leaf passes (class 3 `postitNote` clue, class 4 `postitNote` on `GET /login_accounts`).
  Its gap is the same as Major 1: it does not include a class-3 field holding a value-matchable
  secret, which is why the class-3 blind spot was not exercised.
