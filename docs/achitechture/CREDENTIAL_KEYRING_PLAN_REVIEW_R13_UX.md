Counts: B 0, M 0, m 1, n 1

# What I checked

Plan body of `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` (no Appendix A by intent; see the note at the end), weighted to section 8.7 (K3d Sign-ins list, tag and source rules, banners, tray badge/redraw, D8), section 10 (K5 tokens), section 8.5's text table and section 9.1's beats R1 to R13.

Checked against code:
- `minigames/capture-log/capture-rows.js` (buildCaptureRow, captureBannerText), `capture-log-model.js` (buildSections, the three sections, `remote === true` session filter, row keys and the seen-marks reader), `capture-log-minigame.js` (the badge at `captureLogTrayRule`, the redraw listeners, the "Captures" heading and banner).
- `minigames/landing-page-builder/landing-page-builder-minigame.js` `_buildCaptures` (the captures view, "Captures" heading, `captureBannerText`, `loadCaptureSecrets`) against D8 option A's second reader.
- `lib/break_escape/capture_model.rb` (`capture_entry_fields` dropping the secret, `all_capture_candidates` plain/overlaid pairs, `capture_candidates`) and `app/models/break_escape/capture_proofs.rb` (`record_capture!`, `pick_capture_candidate`, `capture_candidate_matches_client?`) against 8.7's tag-default rule.
- Scenarios: `lab_physical_pentest` capture-writer inventory (20 writers = 19 addCapture + 1 add_capture; 16 foothold, 4 credential; Len's `l.okafor`/`4471` has no account holder, so `pin` is right; Hampshire/Lord/Pierce are the only account holders), `test_capture_log` (four credential addCaptures, QR look-alike for `lord` at the cited line), `test_access_keyring` beat logic in 9.1.

Beat logic (R1 to R13) traced for solvability and reach: R5a's SV-OPS-01 reach via the drop box foothold pivoting through Lena's HB-FIN-02 session; R6's sign-out collapsing `server_lan`; R6/R7a's timer starting only on `jake_contract_read` so the invite cannot strand the one task it reaches; R12/R13's token clock from the plant. No unsolvable or stranding beat found.

Text-fit spot checks with the given metrics (Press Start 2P 8px/glyph; GNF 16px ~9.4px/glyph, ~32 glyphs per 306px line): tile tags all <=9 glyphs; the longest saved-connection refusal reason in the message slot is ~66 glyphs, which is right at the two-line ceiling and left to `signin-fit.mjs` (not a finding). Teaching lines are toast-only, so they are off the 560x350 base by design.

# Findings

## m1 (minor): 8.7's worked example "usb_lure is foothold by default" is contradicted by the capture candidate picker; under D8 option A it would tag "Finding"

Evidence:
- `app/models/break_escape/capture_proofs.rb:495-505`: `pick_capture_candidate` orders plain candidates first (`overlaid ? 1 : 0`) and returns the first candidate whose client address/host/roleLabel all match, else the plain one. `capture_candidate_matches_client?` compares `host` exactly.
- `lib/break_escape/capture_model.rb:397-415`: for an addCapture on an NPC with `usePayload`, `all_capture_candidates` emits a plain candidate (the addCapture fields) and an overlaid one (`capture.merge(usePayload)`, so `usePayload` keys win).
- `scenarios/lab_physical_pentest/scenario.json.erb:1511` Sofia's `usePayload` is `{ "host": "ledgerwell.account-help.example" }`; `:1556` the `usb_lure` addCapture authors `"host": "Accounts floor, Sofia's PC"` and fires on `npc_used:usb_target_pc` (`data.tag === "dev_usb"`). So the client records `usb_lure` with host "Accounts floor, Sofia's PC", which matches the plain candidate; the overlaid candidate's host is the domain and does not match.
- Plan 8.7 (lines ~654): "the server compares the stored entry's fields with each candidate's ... and takes the overlaid one when it matches, else the plain one ... So `lab_physical_pentest`'s `usb_lure`, on Sofia, whose `usePayload` sets the host, is `foothold` by default".

Problem: The stored `usb_lure` entry matches the plain (non-payload) candidate, not the overlaid one, so by the plan's own tag rule it defaults to `finding`, not `foothold`. The claim that it is "foothold by default" is wrong, and D8 option A's cost line ("`rowTag: \"foothold\"` on the three captures ... `dropbox_view`, `door_admin`, `hot_desk`") therefore undercounts the overrides by one: `usb_lure` would also need `rowTag: "foothold"`, or it shows "Finding". Scope: this only bites under D8 answer A, which is recommended for phase 2, not phase 1 (phase 1 is answer D), and the plan itself says a "Finding" tag on these "is not false", so the player-facing harm is cosmetic. It does not change K0.

Repro: no game needed; static. Author an addCapture foothold on an NPC whose `usePayload` only overrides `host` (as Sofia does), record it from the honest client, and reconstruct the tag by the 8.7 rule: the plain candidate is chosen, giving `finding`.

Suggested fix: either add `usb_lure` to D8 option A's `rowTag: "foothold"` list (four captures, not three), or change the foothold/finding default so a capture whose writer sits on an NPC with a `usePayload` counts as `foothold` regardless of which candidate the host matched (then correct the worked example's reasoning). State which, so the phase-2 implementer does not write a test asserting `usb_lure -> foothold` against the plain-match code.

## n1 (nit): minor line-reference drift in 8.7

Evidence: 8.7 cites the Findings-section push as `capture-log-model.js:90`; the `out.findings.push(...)` is at `capture-log-model.js:89`. The `capture-rows.js:22-26` and `capture-log-minigame.js:66-74`/`:99-101`/`:218` references are accurate.

Problem: Off-by-one citation; harmless.

Suggested fix: cite `:89` if the line numbers are refreshed.

# Could not check

- `signin-fit.mjs` is a new tool; real-browser fit of 8.5's lines and the 8.7 rows/banners at the four sizes is measurement-gated and I could not run it. The longest saved-connection refusal reason sits right on the two-line ceiling by the rough glyph estimate, so it is worth confirming there.
- Section 10's server-side line references (the four `start_token_clocks!` call sites, the prune/`reach_cache_key` edits, the expiry predicate readers) and 7.x's server dispatch are server-side; I confirmed the player-facing token wording and row behaviour only, not every cited line number.
- Note: while paging the plan I inadvertently read Appendix A (the review history), which the brief told me to avoid as a fresh reader. I formed the finding above from the code directly, not from the appendix, and did not reuse any prior round's wording.
