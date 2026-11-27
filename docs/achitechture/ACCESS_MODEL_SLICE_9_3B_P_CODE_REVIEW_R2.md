# Access model slice 9.3b sub-slice P: code review R2

Scope: port security on in-game network jacks, refuse-only (section 5.4 / section 13). Round 2 over
the R1 fix commit `565cc5642`, branch `build/9-3b-p` at `3f16c9be2` (merge of `main`), diffed
`main...build/9-3b-p`. Read-only; nothing changed, nothing committed.

## Verification run

- `test/js/network-links.test.mjs`: 38 pass, 0 fail (run alone).
- `test/js/validator-network-model.test.mjs`: 35 pass, 0 fail (run alone).
- `test/controllers/break_escape/network_footholds_test.rb` (Ruby 2.7.8, under the shared lock):
  31 runs, 338 assertions, 0 failures.

## R1 findings: all closed

- **Minor 1 (toast renders author text as HTML) — closed.** `network-links.js:69-72` now passes
  `{ plainText: true }` to `gameAlert` from the single `toast()` wrapper. The call is positionally
  correct against `gameAlert(message, type, title, duration, options)` (`notifications.js:271`):
  message, type, `''`, ms, `{ plainText: true }`. **No caller relies on HTML.** All twelve `toast()`
  sites (`:361, :386, :393, :397, :438, :441, :496, :519, :535, :550, :588`) pass fixed strings,
  named constants, or text-only template interpolation (`Remote session on ...`, `${message} ${line}`);
  none contains a tag, bold or `<br>`. The plainText path (`notifications.js:182, :226-233`) still
  renders newlines as `<br>` elements and no caller passes `\n`, so nothing is lost. Tests at
  `network-links.test.mjs:254, :270` assert `opts.plainText === true` for the refusal and the
  `no_device` hint and would fail (opts undefined) without the wrapper change.
- **Minor 2 (blank `portSecurityMessage` not rejected) — closed, and correct.**
  `validate_network.rb:85-87` warns (not errors) via an `elsif` that is only reached when the first
  branch is false, i.e. when `portSecurity` is truthy and the key present, and fires on
  `to_s.strip.empty?`. That exactly mirrors the runtime fallback in `port_security_refusal`
  (`network_access.rb:111-115`), which swaps a blank/whitespace message for `PORT_SECURITY_REFUSAL`.
  The `portSecurity:false` + blank-message case still errors first (priority correct). Test at
  `validator-network-model.test.mjs:299` covers `''` and `'   '` warn and a real message does not;
  fails without the `elsif`.
- **Nit 1 (no test pins the 422 body keys) — closed, and exact.** `network_footholds_test.rb:203`
  asserts `%w[error reason success] == body.keys.sort`. The controller renders the model body
  verbatim (`games_controller.rb:1260-1261`, `render json: result[:body]`) and the refusal body is
  `{ success:false, reason:'port_security', error: refusal }` (`network_access.rb:192`), so exactly
  three keys; any added key breaks the assertion. Exact.
- **Nit 2 (client fallback untested) — closed.** `network-links.test.mjs:280` drives a 422 with no
  `error` and asserts the generic line. Pins existing behaviour.

Note: Nit 1 and Nit 2 are pinning tests on behaviour that already held before `565cc5642`, so they do
not "fail without a fix" in the way the two minors do. The build log states this plainly ("the nits
are pinning tests"); no misrepresentation.

## Findings

None. No Blocker, Major, Minor or Nit.

## Verdict

Approve. The three R2 questions check out: no toast caller depends on HTML so the plainText change is
safe; the blank-message warning is correctly gated and matches the runtime fallback; the 422 body-key
assertion is exact. All four R1 findings are closed, the two behavioural fixes each have a test that
fails without them, and the three changed test files pass alone. Ready to land; the W-merge notes in
R1 still stand for whoever lands W next.
