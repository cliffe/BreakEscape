# Lab fix round 4: R2 and failure routes F1–F17

Sources: `R2.md`, `F1-F5.md`, `F6-F10.md` and `F11-F17.md` in this folder. None of them found a blocker. Fix everything below, or log why an item is left.

## Hints and guidance (teaching first)

- **H1 (F1-F5): the softest hint can never be shown.** `phish-rules.js:418-424` indexes `hints[prior]` with `prior >= 1`, so `hints[0]` is never reached. Fix the index and add a Node test.
- **H2 (F1-F5, F6-F10):**
  - Hints follow the miss count, not the factor that failed. Lord's third miss with only the link missing said "call the service desk", and the hint after a failed third Lord send names facts already held.
  - Make the hint rung reflect the failing factor, or at least skip rungs whose advice is already satisfied.
- **H3 (F1-F5): Pierce's third hint is wrong on `guest`.** It reads "can only send as itself" on a send from `guest`, which can spoof. Make it account-aware.
- **F17: a student who leaves a door locked gets no pointer to Ruth.**
  - All three doors say only "Locked / Requires key" or "Wrong key!".
  - `ruth_phone.ink` stage 2's opener (line 96) says "You've the key already" whether or not the key is held, and stage 7 has no key line at all.
  - Fix the phone rungs so each stage names the next key until it is held. The file header says that is the rule.
  - If a door-level locked message can be added cheaply as an opt-in scenario property (with no change for doors that don't set it), add one for the three lab doors pointing to Ruth.
- **F15: the board's "Where mail goes" row says "Read the careers page"** when the careers page has already been read. It should point at the careers inbox.
- **Lockout toast (F6-F10):** "Dev will not talk to you right now" gives no reason. Add a short reason, such as "he's flagged the call — give it a while".

## Call and report accuracy

- **Dev's authored `reported` goodbye line never appears in the chat** (F6-F10).
- **A second Dev call shows the first call's leftovers** (F6-F10). Its transcript is appended under the first one, and the bar's "Last change" line carries over. A new call should start a clean transcript, or show a clear divider. After a reload, the greeting prints twice (F12).
- **Ruth's phone keeps the "Dev flagged that last call" line after a clean second call** (F6-F10).
- **Engagement report:**
  - The pretext row mixes two calls ("reported … Lowest influence: 0"). Report the worst call, or both.
  - The landing row shows the last attached page's domain, not the one that landed. Use the page that landed.
- **"Attach anyway" on a failing page completes `payroll_page_attached`** (F6-F10). This is intended, because a weak page can be sent and then fail at the target. Check that the task text reads as "attached", not as "page passes".
- **`phish_lord_landed` sets a few seconds after "It landed"** (F6-F10). Look into the lag, and fix it if it's cheap.
- **Influence after landing is inconsistent** (F1-F5). Lord stays at -20 while Pierce goes up to -10. Find out why, and make it consistent.
- **The Lord portal-domain advisory shows on a Jed-spoof message** (F1-F5). Scope it to Lord.
- **The call-prep panel lists the 2019 org chart without its "Old or unverified" warning** (F1-F5).
- **The Dev call debrief shows each ask's cost only after the ask** (F1-F5). Leave this, unless showing the cost earlier teaches better.

## Overlays

- **F11:** six overlays log `minigame_failed` on Esc or Close: the mail client, the pretext card, the triage intro, Ruth's person chat, Ruth's phone chat and the door lockpick. None of these closes completes a task. The mail-client abort is by design.
  - For this build's own overlays (pretext card, triage intro), make a plain close a clean close, not a failure, if nothing reads the failure.
  - Leave the engine's older overlays alone.
  - Update PLAN.md §10 F11 so it says what is actually required: no task completes and no error is shown.
- **F12:** a reload mid-triage restarts the round at 0 of 8 with no notice. Add a one-line notice, or keep the progress.
- **Mail client (R2):** "Pick an address first." is an `info` toast, and those are held while the full-screen panel is open. Show the message inside the create-account panel instead.

## Clock and text

- **Seeded mail is dated 08:15 to 08:55, but the game clock starts sends at 08:03** (R2). Line them up, either by moving the clock start or the seeded times.
- **The influence "floor" wording is unexplained** (R2). Explain it in one line, or rename it.
- **PLAN.md text is out of date** (F6-F10):
  - §10 F6 and the -30 reopen in IMPLEMENTATION_PLAN.md: Dev now reopens at 0, his configured start.
  - §3, lines 543–546: the refusal limit at -60 reports first, before the -70 threshold.
  - The quoted Ruth line no longer matches her actual line.
  - Update these to match the current design.

## Done when

- The Node suite and the validator are green, with no change on any shipped scenario.
- The lab passes `--strict-social`.
- There are new tests for H1, H2 and H3 and for the phone key rungs.
- `SE_BUILD_LOG.md` is updated.
- Your report lists every file you changed.
