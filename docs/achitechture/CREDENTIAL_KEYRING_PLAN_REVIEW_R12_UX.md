Counts: B 0, M 1, m 5, n 3

# R12 UX and game-design review: credential keyring plan (phases 0 and 1)

Scope: player-facing design of the plan body (no Appendix A, no prior review files). I read the plan body, graded the eight draft notes against the code, then covered the row-tag fit, the token teaching text, and beats R1 to R13 of the test scenario. No finding changes slice K0: every graded issue lands in K3d (the Sign-ins list), K5 (tokens), or D8 option A (the labs' captures view), all built after K0. Code cited for the capture log (`capture-rows.js`, `capture-log-minigame.js`, `capture-log-model.js`) is pre-existing (before 1.0.15); the defects are in how the plan proposes to grow it, not in shipped behaviour.

## What I checked

- The eight draft notes, each against the named code and scenario lines.
- Row-tag widths against the capture-log CSS and the compact-tile budget (Press Start 2P at 8px a glyph).
- The K5 token text in 8.5 and section 10 for teaching accuracy.
- Beats R1 to R13 of 9.1 against the scenario the plan describes (the scenario is built in K1, so this is an internal-consistency check; `scenarios/test_access_keyring` does not exist yet).

Could not check directly: rendered pixel widths in a browser (RULES: read-only, no server); the foothold id a planted drop box on the `comms_port` jack actually produces (the plan names it `jack_comms_port` for `lena_token`'s proof, which I took on trust); and anything that depends on the unbuilt scenario's final authoring.

## Findings by grade

### M1 (draft note 2). The capture-log tray badge and an open device have no keyring source, so a "New in your capture log" credential can leave the badge wrong and the open list stale.

Evidence: `public/break_escape/js/minigames/capture-log/capture-log-minigame.js:66-74` (`captureLogTrayRule`) computes the badge synchronously as `newKeys(buildSections(...))`; `buildSections` (`capture-log-model.js:65`) reads only `holds`, `globals` (`se_captures`) and `sessionsSource`, never GET /keyring. The listener set (`capture-log-minigame.js:99-101`) is `global_variable_changed:se_captures`, `pc_signed_in`, `pc_signed_out`, `network_device_unplugged`, `inventory_changed`; no keyring event, and `onCapturesChanged` (`:82-85`) is what redraws an open device. The plan's K3d file list (plan 8.7, line 703) adds a GET /keyring fetch to `capture-log-minigame.js` for the open-device render but says nothing about the tray badge or about redrawing an open device when the keyring changes.

Repro (once K3d is built): on a new game of `test_access_keyring`, with the capture log in the start inventory, take `HB-FIN-02.rdp` at Sam's keyboard (R1). The find toast reads "New in your capture log: HB-FIN-02.rdp (saved connection for Lena Fox)." (plan 8.2), but the tray badge count comes from `captureLogTrayRule`, which cannot see the registry row, so it does not increment. Open the log while a later credential arrives and nothing redraws, because the keyring change fires no listened event.

Problem: the toast promises the player something new in the capture log, and the tray does not confirm it. A synchronous tray rule cannot await GET /keyring, so this needs a design decision the plan omits (cache the keyring rows in `systems/keyring.js` and feed the cache to `captureLogTrayRule`, and fire an event the open device listens on).

Suggested fix: in K3d, have `systems/keyring.js` hold the last keyring entries and a change event; `captureLogTrayRule` reads that cache so its `newKeys` count includes registry rows, and `ensureListening` adds the keyring change event to the redraw listeners. State this in 8.7.

### m1 (draft note 1). A password captured on a look-alike page gets the source tag "Recorded", not "Phished", because "Phished" reads only `social.phishTargets`.

Evidence: plan 8.7 line 682 ties "Phished" to `social.phishTargets` ids only; "Recorded" (line 683) catches "any other capture of a password". Neither `test_capture_log` nor `lab_physical_pentest` declares `phishTargets` (grep: no hits in either `scenario.json.erb`). Both author QR look-alike captures as plain `addCapture`: `scenarios/test_capture_log/scenario.json.erb:193` ("Entered on a look-alike page from the dropped QR card") and `scenarios/lab_physical_pentest/scenario.json.erb:1565` ("Entered on a look-alike sign-in page reached from a dropped QR code").

Repro: under D8 option A (or in `test_capture_log`'s Sign-ins list), Lord's row would carry "Recorded", lumping a phishing capture in with keylogger and drop-box captures.

Problem: teaching accuracy. A look-alike page is phishing; the row's own note says so, but the one-word source tag contradicts it. The Phished/Recorded split is the teaching point, and the existing content does not reach it because these captures are not modelled as phish targets.

Suggested fix: either widen "Phished" to captures whose note or candidate marks a look-alike page, or (cheaper) accept the limit and say in the README that a look-alike-page capture tags "Recorded" unless it is a declared phish target, so authors who want "Phished" declare the target.

### m2 (draft note 3). The default foothold tag is ambiguous when a capture has both a plain and a usePayload-overlaid candidate, and the stored record does not say which was taken.

Evidence: plan 8.7 line 654 tags a foothold capture "foothold" when "its candidate comes from a phish attachment or an NPC `usePayload`", else "finding", reading `CaptureModel.capture_candidates` (line 652). For a capture on an NPC that has a `usePayload`, `all_capture_candidates` (`lib/break_escape/capture_model.rb:393-416`) emits two candidates for the same (target, kind): a plain one (`overlaid: false`) and an overlaid one (`overlaid: true`). `usb_lure` is exactly this: `addCapture` on Sofia's eventMapping (`scenarios/lab_physical_pentest/scenario.json.erb:1556`), and Sofia carries `usePayload` (`:1511`). The stored entry (`store_capture_entry`, `capture_proofs.rb:175` via the fields at `:162-167`) keeps only the resolved fields, not `overlaid`, so a recompute from `capture_candidates` sees both a "finding" candidate and a "foothold" candidate and cannot tell which fired.

Repro: `CaptureModel.capture_candidates(data, "usb_lure", "foothold")` returns two rows; the tag rule has no tie-break.

Problem: the default tag is undefined for any payload-overlaid foothold. The plan's own remediation (authoring `rowTag: "foothold"` on `usb_lure` and the three other real-access captures, 8.7 line 717) covers this specific case, but the default rule is still unstated for the general one.

Suggested fix: define the tie-break in 8.7 (for example, an overlaid/payload candidate wins "foothold" if any candidate for the (target, kind) is overlaid), or require `rowTag` wherever a foothold capture's NPC has a `usePayload` and let the validator enforce it.

### m3 (draft note 4). 8.5 calls a planted device a foothold, but `network_drop` is authored as a finding and is not among the four captures that get `rowTag: "foothold"`; and the lab has 20 capture writers, not 19.

Evidence: plan 8.5 line 589 lists "a device was planted" under the "Foothold" full name. `network_drop` is a planted-device capture (`scenarios/lab_physical_pentest/scenario.json.erb:848`, `network_device_planted:network_port`, note "Planted a rogue device ... A finding on its own."), a plain `addCapture` with no payload, so the default rule (8.7 line 654) tags it "finding"; it is not in the plan's four real-access captures (8.7 line 713 lists `usb_lure`, `dropbox_view`, `door_admin`, `hot_desk`), so it gets no `rowTag` override. Separately, the lab has 19 `addCapture` writers plus one `add_capture` action, `comms_card_taken` (`:1865`, kind foothold), which 8.7's census (line 713, "19 `addCapture` writers") and the fit fixture (line 717, "all 19 of `lab_physical_pentest`'s rows") both omit, so there are 20 capture writers.

Repro: under D8 option A, `network_drop` renders "Finding" while 8.5 tells the reader a planted device is a "Foothold"; and `signin-fit.mjs`'s captures-view fixture would be sized for 19 rows, not 20.

Problem: a wording contradiction (planted device: finding or foothold?) and an undercount that mis-scopes the fit fixture.

Suggested fix: reword 8.5 so "device was planted" means a device that was used as access, not merely planted (or make the default tag for a `network_device_planted` capture "finding" explicit), and correct the census and the fit fixture to 20 writers, including `comms_card_taken`.

### m4 (draft note 6). The captures banner is unspecified for the renamed sections, and its text no longer fits the Sign-ins list.

Evidence: the banner "Passwords and PINs this engagement has recorded, shown in full here and masked in the report." is in `capture-rows.js:22-26` and is appended only to the section whose id is `captures` (`capture-log-minigame.js:218`). D4 (d) renames that section to "Sign-ins" and moves non-credential captures to a new "Captures" section below (plan 8.7 line 689), but the plan never says which banner goes over "Sign-ins" or over the new "Captures". The Sign-ins list now also holds saved connections, assist invites and tokens, none of which is a "password or PIN".

Repro: whichever section keeps the id `captures` inherits the "Passwords and PINs" banner; over Sign-ins it mis-describes the list, over the new Captures it mis-describes findings and footholds.

Problem: a banner that contradicts the list under it.

Suggested fix: specify two banners in 8.5/8.7, one for Sign-ins ("Sign-ins this engagement has recovered ...") and one for Captures ("PINs and findings ..."), each masked-in-the-report as today.

### m5 (draft note 8). The captured-PIN row line is `{host}: {value}` with no rule for a capture that has no host, and the test scenario's stationery-cupboard PIN has none.

Evidence: plan 8.7 line 677 gives the captured-PIN use line as `"{host}: {value or mask}"`. Today's credential row only prints a host when one is present (`capture-rows.js:45`, `if (entry.host) ...`), so a PIN with no host prints just the value; the plan's template drops that guard. The test scenario's second lobby card is "a credential capture with a four-digit `secret` ... and an address that is no account" (plan 9.1 line 763) with no host named, and R13 (line 819) renders it in the Captures section.

Repro: build `test_access_keyring`'s stationery PIN card without a host; R13's Captures row reads "{host}: 1234" (a literal placeholder or ": 1234").

Problem: a visible bad render for a host-less capture, reachable in the plan's own beat R13.

Suggested fix: keep today's guard in 8.7 (print the host and colon only when a host is present), and either author a host on the stationery PIN card or confirm the host-less form in the fit fixture.

## Nits

- n1 (draft note 5). Section 4 (line 232) names the kind tags "Finding", "PIN", "Password", "Foothold" while 8.7 (lines 640-648) and 9.2 (line 829) use the full names "Captured password" and "Captured PIN". Align section 4 to the 8.5/8.7 names so the authoritative tag text is stated once.
- n2 (draft note 7). The capture log already has a "Findings" section (filed inventory items, `capture-log-model.js:90`, kind `finding`), and K3d adds a "Finding" tag inside the new "Captures" section. Both phase-1 scenarios set `holds.items: false`, so the Findings section never renders and no player meets the clash yet, but a later scenario with filed items would show "Captures" rows tagged "Finding" beside a separate "Findings" section. Rename one before that lands.
- n3 (token clock fiction, section 10). The player-facing token lines in 8.5 are accurate ("A stolen session token signs in without the password until it expires. Short session lifetimes limit it."). The fiction has a small wrinkle: 9.1 says Lena "signed in this morning and left the session open", but the clock starts at the drop-box plant (plan line 840) and gives a fresh `expiresMin` (4) from capture, not from the morning issuance. The bar then shows "about {n} min left" counted from the plant. Harmless for the lesson, but a student could infer a token lasts N minutes from capture; a one-line README note that the game resets the clock at capture for playability would close it.

## Row-tag fit (390x844 and 915x412)

No finding. The tile short tags are all at most 8 glyphs ("Captured" 8, "In file" 7, "Saved" 5, "Assist" 6, "Token" 5, "Foothold" 8, "Finding" 7, "PIN" 3), so at 8px a glyph each is at most 64px inside the 76px compact tile the plan budgets for (plan line 267), and the plan already caps a tile at two tags with "+N" and a corner badge in the short window. The Sign-ins list rows are not width-locked: `.capture-log-list` is a vertical flex column inside a scroller (`.capture-log` has `overflow-y: auto`, `css/capture-log-minigame.css:3,8`) and `.capture-log-text` sets `overflow-wrap: anywhere` (`:15`), so the full-name tags ("Password in a file" is the longest at 18 glyphs, 144px) and the four-tag worst case (plan 8.7 line 707) wrap within the row and the list scrolls, rather than overflowing sideways, at both narrow sizes. The plan's `signin-fit.mjs` list fixture (line 707) covers this; it should assert wrapping, not a single line.

## Beats R1 to R13

Internally consistent with the scenario the plan describes. The lock-and-key chain holds: HB-FIN-02 admits both `lena` and `jake` (9.1 line 766), so Jake's "In file" tile on Switch user (R4) is reachable; `ops_pc`/`pw_only` accepts password only, so the greyed ".rdp" with the typed-password fallback (R5a, R5b) is right; `jake_desk` is `remote: "blocked"` with the office door never opening, so the relay is genuinely the only route to HB-FIN-03 (R6); the contract read arms the 90s timer so the invite cannot end before the one thing only it reaches is read (R6, R7a, R8); unplug and sign-out prune the dependent sessions (R6, R9); the `from` route needs a held source session (R10); and the token's clock runs from the plant with the two-tag case at R2 and expiry by R13 (R12, R13). The one concrete problem is in R13's Captures row, folded into m5 above (the host-less stationery PIN). I found no additional beat contradiction.
