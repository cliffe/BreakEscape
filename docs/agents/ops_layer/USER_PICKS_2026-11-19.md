# Ops layer: the user's picks (2026-11-19)

The user's answers to the picks page (41 questions). The user's own words are quoted. Where
the user asked to discuss or for more context, the orchestrator's reading is marked as such and
the question goes back to the user on the picks page. Everything else is a ruling.

## Blocking

- **BLOCK-1**: a. Retry the cracking reviser once on `sonnet-cvp` with the same brief.
- **BLOCK-2** (forged intel facts and cracking): user: "How does this hand over a password? They
  still need to collect the correct information. The server side cracker should only find the
  password from the cracker if the right information was collected." Orchestrator reading: option
  b (the facts the cracker reads are server-granted, recorded only when the server sees the
  event that reveals them), together with c (the crack also needs the server-held proof that the
  hash was collected). Goes back for confirmation.
- **BLOCK-3**: a. Accept the mix of time models for now.
- **BLOCK-4** (the network view's private control list): user asked for more context. User's
  example: "For a scan, the simple movie mode might just show a progress bar, with "scanning",
  while the realism mode can show an output that matches a simulated nmap terminal output."
  Goes back with context.

## Shared

- **SHARED-1**: a. Not now: log it and nothing else. User: "OK add that as an idea to the parked
  plan" (staff and defender reactions go in `ACTORS_AND_DEFENCE_PLAN_OUTLINE.md`).
- **SHARED-2**: a. Yes, for accounts marked admin.
- **SHARED-3**: c. **Always a hash.** User: "Is a cached hash the most accurate? Do they need
  root/admin to collect that? We could have a click to crack button from there. If the scenario
  doesn't want to cover it we can just not enable cached creds? Want to be educationally
  accurate." Ruling: a collected cached account is always a hash; collecting needs admin on that
  PC; the collected hash offers a crack action (S7); a scenario that does not teach cracking does
  not enable cached credentials. So S5b depends on S7 and builds after it.
- **SHARED-4**: a. A row for every sweep and every technique use; other actions first time only.

## Core

- **CORE-2**: b. **Display only** (the plan was written to enforced): discovery changes what the
  network view shows; the server does not refuse remote sign-in to an unswept host.
- **CORE-4**: e. **Free, but logged.** The evidence, noise count and alert fields come out. User:
  "This can come later, add as an unsettled idea to the defence stream."
- **CORE-5**: a. Yes, it ignores both.
- **CORE-8**: a. Count it, and warn the author.
- **CORE-11**: a. Keep the word under a separate key, and always write technique card. User:
  "se_technique and technique_card" (the key names).
- **CORE-12**: b. **Serve the desktop at the PC's own keyboard as that account, with no
  password** (the plan was written to refuse). User: "When clicking on the PC, transition to the
  remote session automatically, but with some visual indication that you are viewing it
  remotely. Any hacked PCs or devices should have a visual indicator for the player, for example
  tinted red with lightning bolts."

## Privilege and accounts

- **PRIV-2**: a. **PRIV-5**: a. **PRIV-6**: a. **PRIV-8**: a. **PRIV-9**: a. **PRIV-10**: a.
- **PRIV-7**: b. **Any admin session on the PC overrides** the planting policy (the plan was
  written to keyboard only). An admin session on a PC whose service is off still does not
  override; a locked admin session never overrides.

## MFA and helpdesk

- **MFA-4**: a. **MFA-6**: a. **MFA-7**: a.
- **MFA-8**: b. **A helpdesk's try limit lifts after five minutes of server time**, as the code
  step does (the plan was written to "stays for the game").

## Realism skin

- **SKIN-2**: a. No forcing: the scenario sets a default and the player's pick wins.

## Cracking

- **CRACK-1**: a. **CRACK-3**: a. **CRACK-4**: a.

## Second step on any lock (S8c)

- **LOCK-1** (NPC-granted unlock and the step): user asked for further explanation and context.
  Goes back with context. The plan stays at option a meanwhile.
- **LOCK-2**: a. **LOCK-4**: a. **LOCK-5**: a. **LOCK-6**: a. **LOCK-8**: a.
- **LOCK-3**: a. Password and PIN locks only take a typed code; other types take the push kinds.
  User: "Have fingerprint biometrics, bluetooth proxy lock, rfid fob, all been considered in
  terms of how they combine with the keyring? I.e. no issues with these concepts all
  co-existing?" A coexistence audit answers this.
- **LOCK-7**: no answer. The plan's default stands for now (refused; a file inside a carried
  container is fine) and the question goes back.

## Log rows

- **LOG-1**: a. **LOG-4**: a. **LOG-6**: a. **LOG-7**: a.

# Round 2 (answered 2026-11-19 evening)

User's words quoted; orchestrator's readings marked "Reading:".

- **R2-1** (cracking route): no option picked. "We are now running under the CVP account, so more
  likely to work now." Reading: run the cracking reviser directly on an opus55 agent with the
  existing brief; no sonnet-cvp relay.
- **R2-2** (cracker needs server-granted facts and proof the hash was collected): left blank.
  Reading: the plan stays on the recommendation (both checks).
- **R2-3** (control list for the two looks): no option picked. "The realism mode should show full
  simulated nmap msf cli output based on the weaknesses etc -- it should be generated from
  separate files (js, etc)". Reading: the terminal (realism) look shows full simulated
  scanner-style and exploit-framework-style console output, modelled on nmap and Metasploit,
  generated from each host's services and weaknesses by separate per-tool generator modules. The
  earlier "no real tool names" rule and its deny-list test are withdrawn for the realism look;
  the movie look stays plain. Realistic names (services, versions, module names) come from
  authored scenario data per weakness, with generic defaults; the generators format them. The one
  shared control table stays (not contradicted). Still simulated: nothing runs against a real
  host, and the output carries no working exploit payloads.
- **R2-4**: a. The step is still due; the NPC replaces the card or PIN only.
- **R2-5**: b. Allow a second step on a carried item after auditing every inventory path.
- **R2-6**: b. Keep the pretext key as `technique`; `technique_card` only for the new card. No
  `se_technique`.
- **R2-7**: a. Session-type implants stay keyboard-only.
- **R2-8**: a. Accept the new "Nobody is signed in at this keyboard." message in
  test_access_networks and demo_access_tour.
- **R2-9**: a. A helpdesk request over a PC needs a session there; in person needs none.
- **R2-10**: a. The approval prompt waits until the conversation and its screens close.
- **R2-11**: a. Fix both existing-code bugs (keycard credential signs in after revocation;
  validator counts fob/rfid as cards) on a small branch with tests, through the usual train.

# Round 3 (answered 2026-11-19, night)

- **R3-1**: a. Allow real advisory ids and module paths in the realism skin; brief rule 4
  changed accordingly. User: "But keep these simulated realism details separate from the main
  scenario, to avoid false positive classifier hits -- maybe a separate catalog of vulns with
  matching details, with a simple id to link that to the scenaro". Reading: vulnerability
  details (advisory ids, module paths, script titles, banners naming them) live in a separate
  realism catalog file outside scenario files; a weakness or decoy links to an entry by a plain
  id. Network layout (addresses, ranges, host names) stays in the scenario's `cli`.
- **R3-2**: b. **No mark**: every line bare, as the real tools print (plan was written to a
  first-line mark). The "in this simulation" local answers stay.
- **R3-3**: a. Real-time wait per guess on a salted record (default 60 s).
- **R3-4**: a. `common` is recipe only. User: "When specifying the password we could specify a
  cracking difficulty?" Reading: the cracking plan designs an optional author-facing difficulty
  on the password/recipe and recommends it.
- **R3-5**: a. Wording only; no `carriedGone` list.
- **R3-6**: a. Fix the knock-out drop id / credential re-stamp bug on a branch with tests,
  through the usual train (branch `fix/knockout-drop-item-id`).
- **R3-7**: c. Note it and leave it (timer/object-action item claims are not trigger-checked).
- **R3-8**: a. Leave plain carried containers until the lock plan is built, then extend its
  Rule D check to them.
