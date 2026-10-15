# m06 Follow the Money — pass-4 playtest script (changed parts)

Written 2026-10-02 after the pass-4 design changes (DESIGN_REVIEW.md, "Changes made"). Play on the
keyless server (`PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner
tools/playtest/new-game.rb m06_follow_the_money`); follow `.claude/skills/playtest-scenario/`.
Split into two runs of about 12 minutes (A: steps 1–8, B: steps 9–15). Keep an earned-secrets
table: the slot number must be **worked out from in-game text**, never typed from this file or
TESTING_WALKTHROUGH.md. Finish with `tools/playtest/verify-run.rb`.

## Run A — briefing to the data centre

1. **Briefing.** Let the opening play. Pick "Which exchange?" then "How do I get in?" then "I'm ready."
   Expect: about 10 lines, the FCA cover heard, the kit line, the "two calls" close. Replay in a
   second game picking "Which payments?" / "Why would Volkova help us?" / "What am I looking for?":
   the cover is heard on that route too.
2. **Guard and Irina.** Through the checkpoint by any route; talk to Irina, get the wordlist.
   Expect: HaX's text after Irina's first close points east to the analysts. Picking up the
   wordlist does **not** offer the cracking guide.
3. **The lab.** Talk to Priya; pick "How would you follow money through a mixer?". Take her
   write-up. Expect: three ENTROPY deposits with amounts and times; no fund address, no slot
   number. HaX's text says Priya loses the money at the mixer. Read the Daily Trading Report:
   no `1ARCHITECT9FUND`, no $12.8M.
4. **Server room and terminal.** `bitcoin2025` from the checklist and the wordlist. Use the
   terminal. Expect: HaX's text now offers the recon, distcc **and** cracking guides; the hub
   lists "Send me the offline password cracking guide."
5. **Flags 1–3** (earn them). After flag 3 expect HaX's text: the code is in the export, north
   door, *and* finish the vault account before going upstairs. Read the export: header
   `hc-findb-01`. Read the rack sheet: lists `hc-findb-01` and `hc-vault-01`.
6. **Reload** the page here (mid-mission). Then phone HaX → "Remind me where we are."
   Expect: the data-centre line, the custody-console method line, and "Finish the estate before
   you go upstairs". No replayed intro.
7. **Data centre.** Enter with 3110. Expect: HaX's console text arrives once. Open the
   Financial Transaction Server; take all three files.
8. **Solve it.** Phone HaX → "Which cold slot is the fund?" once (first nudge only, then stop
   asking). Work it out from the write-up, `mixer_settlements.log` and `mixer_pool_config.yml`.
   First try a decoy (3815): refused. Then enter the slot you deduced on the **Custody Console**.
   Expect: it opens, `identify_fund_wallet` ticks, the fund document is inside and shows the
   custody slot and the pre-signed release line; taking it ticks `discover_architects_fund`, the
   music changes, HaX texts about the badge. Record in the table how you got the number.

## Run B — top floor and the ending

9. **Flag 4 nudge.** Get the executive badge from Irina, but go to the wing **before** flag 4.
   Expect: one HaX text on entering the wing about the vault account. Go back and submit flag 4.
   Expect: HaX's text says whoever holds the keys holds the money; the recovery keys list slots.
10. **Satoshi.** Confront him; choose freeze. Expect: "moves into a wallet we hold" wording, not
    "cold storage".
11. **Irina, turned.** In a second game (or before step 7 in this one), raise trust, show her the
    write-up, recruit her **before** the data centre. Expect: she names the slot and the safe
    code; HaX's recap repeats both; the console opens with it; credits say "SLOT GIVEN UP BY
    VOLKOVA". In the main game, detain her: she gives nothing.
12. **Irina KO before meeting her** (separate quick game, optional): HaX's KO text says you never
    got a proper conversation out of her, not "halfway to walking".
13. **Debrief.** Expect, in order: a line on how the fund was found (traced vs given by
    Volkova); the Irina section with a line on badge clone/lend and her notes where they apply;
    Satoshi's aftermath on **every** Irina branch; one line on the backend; the **FCA letter**
    (pick two real findings and "They trade a lot of Monero": HaX corrects it, verdict "Two good
    ones"). With watch chosen, HaX explains the pre-signed payout and the quiet arrest.
14. **Credits.** Freeze credit says "moved into a SAFETYNET wallet". Dani's specific credit only
    if you reached his suspicions; otherwise "Kept his head down". Priya's "Drew the graph" only if
    she walked you through it.
15. **Verify.** `tools/playtest/verify-run.rb` shows progress and the mission concluded. Note any
    line that didn't appear, with the game id and a screenshot.

## Round 2 confirmation run (about 10 minutes)

Use one fresh game. The slot must be worked out in-game again.

1. **Irina early.** Recruit Irina before the data centre. Expect her to rule out 6120 and anything inside six hours, and to give 2140. She never says the slot.
2. **Phone hub.** At the data-centre stage, open HaX's hub. Expect the slot question and "Remind me where we are." near the top, and no "general advice". The recap names the console but doesn't restate the method.
3. **Data centre.** Enter it, take the three files and ask HaX for a hint twice. Expect hint 1 to be the method in one line and hint 2 "Start with the biggest deposit…". The index has no CEO pattern on the answer.
4. **Slot check.** Ask Irina "Check a slot for me", name 5093 (refused, with "cut and hold"), then 4471 (confirmed). Open the console.
5. **Reload, then debrief.** Reload and finish the mission. Expect:
   - the debrief says "Volkova confirmed the slot";
   - no doubled "short of money" or "custody" lines;
   - on watch, no "handed to the police" next to "off the books";
   - the credits read "TRACED, CONFIRMED BY VOLKOVA".
6. **KO game.** In a quick second game, KO Irina before speaking to her and take her executive badge. Go to Satoshi without opening the console. Expect:
   - only "Not yet. I'll find your wallet first.";
   - HaX's wing text points at the console;
   - after the fund, the debrief KO path says "We never got a proper conversation out of her" and doesn't cite her notes.
