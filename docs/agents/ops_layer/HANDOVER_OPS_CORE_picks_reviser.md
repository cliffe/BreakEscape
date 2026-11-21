# Handover: OPS_CORE_PLAN picks reviser (2026-11-19)

Brief: apply USER_PICKS_2026-11-19 rulings CORE-2 b, CORE-4 e, CORE-12 b, CORE-11 a (keys
`se_technique`, `technique_card`), drop CORE-5 a / CORE-8 a from section 15, and CROSS_PLAN_R4
Z1 (L1a and L1b built before S1). Edit tool only; no commit; record outcomes in
`reviews/OPS_CORE_DECISIONS.md` under "## Picks 2026-11-19".

## Done (in `docs/achitechture/OPS_CORE_PLAN.md`, sections 0 to 9.1)

- Section 0: `evidence` removed from weakness, decoy, finding; Noise row and `evidence`
  enumeration removed; card field is `technique_card`; `opsNoise` removed from state list;
  the keyboard sentence reworded (record keeps foothold when served at the keyboard).
- Section 1: steps 3/4 without evidence or Probe; new step 6 (compromised marker, click opens
  remote view); new paragraph "Discovery is a display" (sign-in, desktop, shares not gated; a
  player who knows a host's name can sign in without sweeping; scan still follows the sweep);
  noise paragraph replaced by "free, but written down" (SHARED-4 a log rows); "Why decoys
  stay" paragraph (kept: they teach false positives; a card on a false finding is refused
  and logged); "noisy" removed from the failure paragraph.
- Section 3 table: S2 without evidence/alert; S3 adds `technique_card`, the `se_technique`
  rename, keyboard remote view and the marker. Early-field table uses `technique_card`.
- 4.1: discovery governs the view only; shares served by `GET /container` regardless.
- 4.2: example without `evidence` and `alert`; evidence and alert bullets removed, replaced by
  one line (world documents can hint, engine does not link them).
- 4.3: example item and proof use `technique_card`; "One word, two separate keys" bullet
  describes the pretext rename (six scenarios listed, schema, `pretext-judge.js:240`, `:258`,
  social pretext validator, JS fixtures, README; `tells.techniques` keeps its name).
- 5.1, 5.2: discovery enforcement removed (`host_reachable_through?`, `from_route_refusal`,
  `resource_admits_player?` unchanged); unswept discovery block lists rows of PCs the player
  holds a session on; `ops_listed?` still needs open or swept for the ops routes.
- 5.3: evidence, Probe, noise, `add_noise!`, noise keys removed; confirm free and logged on
  first confirm; pending-key list updated.
- 5.4: refusals: every 422 writes a `technique_refused` row with `save_limit: true` (no noisy
  branch). Keyboard section rewritten: click on a PC with a technique copy calls
  `networkLinks.openSession` through the session's foothold (new reader
  `pcSessions.remoteViewFoothold`); remote-view marker (red 2px frame class
  `desktop-frame--remote-view`, bolt + "Remote view: <account> through <link>" line in
  `remote-host-text.js`, 0.3 s stepped static wipe, skipped under reduced motion); server keyboard
  branch unchanged, `settle_session_at_keyboard!` gains a `technique` skip; `network_only`
  refusal and its client handler removed; folder no-route line passes only where the keyboard
  desktop would. New "compromised marker" design: `systems/compromise-marks.js`, marks technique
  sessions, implant footholds, planted jacks; not password/credential/claim/relay sessions, Wi-Fi
  APs, shares; `hosts` entries marked on the network-view row; tint `0xff8a8a`, 7x11 code-drawn
  bolt bitmap, no art file; test bridge `compromiseMarks()`; optional 16x16 PNG needs user yes.
  Reader and comparison tables updated.
- 5.5: evidence/Probe/noise/`data-quiet`/`network_alerted`/`quiet`/`noisy` removed; bolt on
  host rows; marker module on harness copy lists.
- 6: `network_only` gone (twelve codes); confirm/technique rows without noise; repeat
  paragraph (a repeated sweep still writes its row).
- 7: discovery-gated rows reworded; noise and evidence rows removed; no-exposure line updated.
- 8: three keys, no `opsNoise`; marker adds no state.
- 9.1: `evidence`, `opsEvidence`, `alert` removed; `technique_card` item field and proof kind;
  pretext line rename row added; discovery description note.

## Done in pass 2 (second agent, stopped at context limit)

- Open items 1 (9.2), 2 (9.3), 3 (section 10, now five check parts incl. pretext verdict
  snapshot and the compromise marker as the one intended visible change in the five jack/implant
  scenarios), 4 (section 11 whole: unit, controller, node, all three playtests, live proof) are
  DONE. 5.4 gained `utils/compromise-bolt.js` (shared bitmap, no imports) and the art line now
  says "later polish item needing the user's yes". 4.3 names `scripts/validate_social/pretext.rb`
  and `pretext-judge.js:276`.
- Item 5 (12.1) PARTLY: Z1 build-order paragraph and the closing "Build order" paragraph in 12.2
  are done. STILL TO DO in 12.1 table: step 1 (add section 10 part 5 pretext snapshot; say L1a
  and L1b are on main); step 3 (drop "the condition in `host_reachable_through?`,
  `from_route_refusal` and ... `resource_admits_player?`", test name
  `network_discovery_display_test`); step 6 (drop evidence, `add_noise!`, `opsNoise`, `alert`,
  `network_alerted`, noise on blocks; test `network_ops_free_test` replaces `network_noise_test`);
  step 7 (drop Probe, evidence, noise line); step 9 (add the pretext rename and
  `validator-social-pretext-key.test.mjs`); step 10 (drop noise; refusals always
  `save_limit: true`; `network_ops_free_test`); step 11 (replace keyboard refusal/`network_only`
  handler with the `settle_session_at_keyboard!` skip; tests `container-network-only` ->
  blocked-host test only); step 12 (drop "`via` test in `heldAtKeyboard`"; add
  `remoteViewFoothold` click path, remote-view frame/line/wipe, `compromise-marks.js`,
  `compromise-bolt.js`, row bolt; tests `pc-remote-view-click`, `desktop-remote-view`,
  `compromise-marks`). 12.2: `game.rb` row "four keys" -> three, drop "server-owned global
  names"; `network_access.rb` row drop `host_reachable_through?`, `from_route_refusal`,
  `resource_admits_player?`; `pc-sessions.js` row rewrite (remoteViewFoothold, no heldAtKeyboard
  change, no `network_only` handler; add `remote-host-text.js`, `ui-themes.css`,
  `screen-states.js` importers, `core/rooms.js`); `verify-run.rb` "four names ... 25 lines" ->
  three, 20; add the six SE scenarios, `pretext-judge.js`, `validate_social/pretext.rb`, schema
  pretext line; new files list add `compromise-marks.js`, `compromise-bolt.js`.
- Items 6 to 10 NOT started (sections 13, 14, 15, final grep, decisions lines).
- NEW orchestrator ruling to apply: the session-type implant (`needsSession`) stays
  keyboard-only: only a keyboard session (typed sign-in or claim) satisfies it; a technique
  session does NOT, even though clicking the PC serves its desktop. Change the 5.4 table cell
  (grep `needsSession`, about plan line 650-660) and any sentence saying otherwise (section 11
  `network_technique_session_test` row says "`needsSession` for an implant": make it "refused");
  evidence in `docs/agents/ops_layer/reviews/OPS_PRIVILEGE_ACCOUNTS_R6.md` M2. Record it in the
  decisions lines.
- Other orchestrator rulings for item 8/10: do NOT rename `tells.techniques` (plan already says
  it keeps its name in 4.3; section 15 question 4 just goes); a service scan still needs the
  sweep; unswept block lists PCs with a held session; Wi-Fi APs get no mark; bolt drawn in code,
  optional 16x16 icon a later polish item needing the user's yes. Each gets a "## Picks
  2026-11-19" line in `reviews/OPS_CORE_DECISIONS.md` (not yet written).
- Privilege plan section 14 to S3 (lines ~988-1003): answer rule (`access: "admin"` whenever
  `session_access` is admin, any session kind; stored value never passed through) is already
  how `client_access_level` works once pointed at `session_access`; confirm it in request 1.
  Its USB note: any admin session (technique too) overrides planting; the session-type implant
  needs a keyboard session. Confirm desktop_request_allowed? passes technique admin on a blocked
  headless host through its own foothold (already in request 1). No other plan names proof kind
  `technique`; skin plan (lines 99, 103, 105, 668, 939) still names `data-quiet`, noise,
  `network_only`, Probe: request 6 must list these.
- Ambiguity left for the orchestrator: whether "only the new keys use se_technique" means the
  pretext line key `technique` should NOT be renamed in the six shipped scenarios. Sections 0 to
  11 keep the rename (as part 1 wrote it); if the orchestrator meant no rename, 4.3, 9.1, 9.2, 10
  (row and part 5), 11.3 (two tests) and 11.2 part 3 exception must come out.

## Open (as first listed; see above for status)

1. 9.2 validator tables (around plan lines 1140 to 1190): remove rows naming `evidence`,
   `alert`, `alert.sets`, `alert.after`, "Decoys on a network with no alert"; change
   `technique` to `technique_card` and `proof.technique` to `proof.technique_card`; remove
   "question 5" from the S3 sign-in warning; add a check that pretext lines use `se_technique`
   (old key `technique` on a pretext line is an error after the rename). Line 1148
   (`discovery: "scan"` with no host) stays.
2. 9.3 graph table: remove Evidence and Alert rows; `when 'technique'` becomes
   `when 'technique_card'`; check no discovery edge gates a sign-in lock (discovery label only).
3. Section 10 (effect on existing scenarios): add that the pretext rename changes six scenario
   files but not their behaviour; the golden comparison and social tests prove it.
4. Section 11 tests (around lines 1254 to 1480): grep for `noise`, `evidence`, `probe`,
   `alert`, `network_only`, `swept`/`unswept` refusals, `blocked_host`; remove the
   discovery-refusal tests (replace with a test that sign-in to an unswept host succeeds);
   remove noise/alert/evidence tests and playtest beats; remove the keyboard `network_only`
   tests; add tests for `settle_session_at_keyboard!` skip, the click-opens-remote-view path,
   `compromise-marks.js` (node test, each source and its removal), the remote-view frame, the
   folder line, and the pretext rename; add `compromiseMarks()` checks to the playtest and
   the live proof.
5. Section 12.1 steps: Z1 (CROSS_PLAN_R4): state that log stages L1a and L1b are built before
   S1 (the current text at about line 1484 says L1a lands "before step 2"). Add build steps for
   the pretext rename, the marker module, the remote-view frame. 12.2 shared files: add
   `screen-states.js` neighbours, `pc-sessions.js`, `unlock-system.js`, `container-minigame.js`,
   `remote-host-text.js`, `ui-themes.css`, the six SE scenarios, `pretext-judge.js`.
6. Section 13 log rows: a row for every sweep (repeat sweeps too, with `save_limit`) and every
   technique use (granted and refused); scan, check, confirm first time only; remove `quiet`,
   `noisy`, noise columns; `technique_refused` always `save_limit: true`.
7. Section 14: rewrite request 5 (no discovery condition in `host_reachable_through?` or
   `from_route_refusal`; sign-in checks order unchanged); request 6 (skin: remove "confirm with
   Probe" and the quiet-or-noisy sentence; add remote-view marker/compromise marks are
   world-side, not skin); request 8 (log: every sweep and every technique use writes a row;
   refusals all `save_limit: true`; no quiet/noisy split); request 12 (parked defence work:
   noise/alert removed; an unsettled idea for the defence stream is to price guessing, reading
   the log rows); add a request for the privilege plan if it read `network_only` or the
   keyboard refusal (check `OPS_PRIVILEGE_ACCOUNTS_PLAN.md` by grep only, do not edit); add a
   request for S7/S5b if they name proof kind `technique`.
8. Section 15: remove questions 1 to 5 (all answered). Leave a single new question only if
   needed: whether the NPC `tells.techniques` map should also become `se_techniques`. If no
   questions remain, say the section has none, or keep that one question with options and a
   recommendation (recommend: rename it too, same mechanical step).
9. Final grep over the whole plan for `noise`, `evidence`, `Probe`, `alert`, `quiet`,
   `noisy`, `network_only`, `"technique"`, `question [0-9]`, "enforced".
10. Add "## Picks 2026-11-19" to `docs/agents/ops_layer/reviews/OPS_CORE_DECISIONS.md`, one
    line per ruling: CORE-2 b, CORE-4 e (decoys kept, reason), CORE-5 a, CORE-8 a, CORE-11 a,
    CORE-12 b (click via foothold, marker, no art file), Z1.

## Files touched

- `docs/achitechture/OPS_CORE_PLAN.md` (edited, uncommitted)
- `docs/agents/ops_layer/HANDOVER_OPS_CORE_picks_reviser.md` (this note)

## Gotchas

- Choices made, for the orchestrator to check: ops routes still require a sweep before a scan
  (only sign-in, desktop and shares are ungated); unswept discovery blocks list rows of PCs the
  player holds a session on; clicking opens via the foothold route rather than a keyboard serve;
  only the pretext line key is renamed, not `tells.techniques` or the top-level `techniques`.
- `compromise-marks.js` importer list is stated as "where `screen-states.js` is"; verify the
  importers by grep at build time.
- Not checked in code: whether `pcSessions` emits `pc_signed_out` for `endedPcIds` on unplug
  (the marker relies on it, or on `network_device_unplugged`).
