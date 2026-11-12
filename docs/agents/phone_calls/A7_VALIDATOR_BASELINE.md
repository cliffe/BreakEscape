# A7a validator baseline

Cut 2026-11-12 on `build/phone-calls`, after the `check_phone_calls` check (`scripts/validate_phone_calls.rb`) and the dialoguelint rule `call-in-text-thread` landed. Command per scenario: `ruby scripts/validate_scenario.rb scenarios/<name>/scenario.json.erb --no-graph`, over every scenario with an `npcType: "phone"` record (28). The lint hits below are the full list from `node scripts/ink_runtime_check/dialoguelint.mjs scenarios/<name> --json` (the validator prints only four per rule).

Slice codes are plan section 8: M1 (m09 rings), M4 (m04), M5 (m05), M6 (m07), M7 (m03), M8 (m01), M9 (small wording), M10 (m06 fund and bring-in, m08 door audit). "Unexpected" means no slice in plan 7.2, 7.3 or section 8 names the line.

`test_phone_calls`: 0. `lab_social_engineering`: 0 (no phone-call or lint output, as required). No scenario reports a phone-calls error. Two scenarios (`npc-sprite-test2`, `ceo_exfil`) stop at an old `#give_item` ink error before any of this runs; they have no phone-call content in scope and are not touched by this work.

| Scenario | "Call me" warnings (check) | Lint hits (`call-in-text-thread`) | Unexpected |
|---|---|---|---|
| m01_first_contact | 7 | 0 | 0 |
| m03_ghost_in_the_machine | 9 | 1 | 1 |
| m04_critical_failure | 5 | 0 | 0 |
| m05_insider_trading | 26 | 8 | 5 |
| m06_follow_the_money | 6 | 1 | 3 |
| m07_architects_gambit | 8 | 11 | 3 |
| m08_the_mole | 6 | 0 | 3 |
| m09_digital_archaeology | 0 | 6 | 1 |
| m10_full_disclosure | 0 | 3 | 3 |
| lab_tesseract_trials | 4 | 3 | 7 |
| sis02_energy | 1 | 0 | 0 |
| test_finale_calls_credits | 0 | 1 | 1 |
| every other scenario with a phone record | 0 | 0 | 0 |

ERB line numbers are the `scenario.json.erb` line of the message, matched against plan 7.3.

## m01_first_contact (7, M8)

- ERB `:925` (eventMappings[27]), "That's the full picture ... Call me ...": M8, stays, the bring-in call (7.3).
- ERB `:1019` (eventMappings[37]), "Abort confirmed ... Call me when you're ready to debrief": M8, stays.
- ERB `:1028` (eventMappings[38]), "...I'm seeing reports ... Call me.": M8, stays.
- ERB `:1064`, `:1073`, `:1082` (eventMappings[42] to [44]), "All technical evidence secured ... Call me ...": M8, stays (x3).
- ERB `:1091` (eventMappings[45]), "Derek is contained and ENTROPY's full picture ... call me": M8, stays.
- ERB `:1100` (eventMappings[46]), "Derek is contained. You still need to access the ENTROPY encrypted archive ... call me": M8, stays.
- Ink `m01_phone_agent0x99.ink:417`, "Call me if you need support.": M8, reword to "Message me" (7.3).

The "stays" lines stop warning when M8 gives HaX a `ring` or `call` entry; the check only looks at the contact.

## m03_ghost_in_the_machine (9 + 1, M7)

- ERB `:947`, `:955` (eventMappings[15], [16]), "You're on her machine. Call me when you've had a look.": M7, reword to "Message me".
- ERB `:972` (eventMappings[19]), "That's more than a price list. Call me ...": M7, reword.
- ERB `:978` (eventMappings[20]), "A drive in her desk? Call me.": M7, reword to "Tell me what's on it".
- ERB `:1016` (eventMappings[25]), "Got the distcc logs. Call me when you're done at the drop-site.": M7, stays (the revelation call).
- ERB `:1100` (eventMappings[35]), "She's down ... Call me when you want bringing in.": M7, stays (bring-in).
- ERB `:1107`, `:1113`, `:1132`, `:1138` (eventMappings[36], [37], [40], [41]), "Everything's off their network ... call me ...": M7, stays (bring-in). The check folds the identical texts into two warnings with a count.
- Ink `m03_phone_agent0x99.ink:391`, "Finish your sweep, then call me and I'll bring you in.": M7, stays.
- Ink `m03_phone_agent0x99.ink:564`, "Base64 first ... Call me when it reads.": M7, reword (`directive_later`).
- Lint `m03_phone_agent0x99.ink:99`, "On the line, player_name().": unexpected. The greeting uses "on the line" as a figure of speech in a text knot and no slice rewrites it.

## m04_critical_failure (5, M4)

- ERB `:898` (eventMappings[3]), "Sixty-one on that dial? Call me when you're clear of it.": M4, becomes HaX's ring.
- ERB `:1080` (eventMappings[23]), "Grid control confirms it ... call me and I'll bring you in": M4, stays (bring-in).
- Ink `m04_phone_agent0x99.ink:652`, "Call me when you've got a real reading.": M4, reword to "I'll ring once ...".
- ERB `:1520` (robert_vance_phone eventMappings[0]), "It's Vance ... Call me for the engineering side": M4, stays (Vance callable).
- Ink `m04_phone_robert_vance.ink:273`, "Call me if you need it.": M4, stays (inside Vance's call).

The `opening_briefing_cutscene` line "I'm on the phone the whole way. Call me." (`m04_opening_briefing.ink:303`) is an in-person person-chat NPC, so the check does not look at it (see the log).

## m05_insider_trading (26 + 8, M5)

"Call me" warnings:

- ERB `:1064` (eventMappings[11]), "Three hundred and eighty thousand dollars ... Call me if you want to talk it through": M5, reword.
- ERB `:1070` (eventMappings[12]), "A personal journal. Call me once you've read it.": M5, reword.
- ERB `:1101` (eventMappings[16]), "Root flag in ... Call me. You need to hear this.": M5, becomes HaX's ring.
- ERB `:1114` (eventMappings[18], [19], two ERB variants each), "That's the last flag. Sweep the vault ... then call me and I'll bring you in." and "... Call me.": unexpected. Not in 7.3; same family as the bring-in texts at `:1379` and `:1386`, so the M5 bring-in work should take them.
- ERB `:1250` (eventMappings[46], +1), "That's both halves: why he'd do it ..." (ends in a `<%= tail %>` variant that says "call me"): unexpected. Not in 7.3; the text is built by ERB, which the 7.3 grep did not read.
- ERB `:1364` (eventMappings[64], [65], +3), "The upload's dead ... then sweep the vault and call me.": unexpected. Not in 7.3; the same bring-in family as `:1379`.
- ERB `:1379`, `:1386` (eventMappings[72], [73]), "Upload's dead ... call me and I'll bring you in": M5, stays (bring-in).
- ERB `:1457`, `:1484` (eventMappings[89], [92]), "... call me for Security": M5, reword to "message me".
- Ink `m05_phone_agent_0x99.ink:782`, `:784`, `:786`, `:788`, `post_ko_safety_net_sweep`: M5, stays (bring-in) (4 warnings).
- Ink `m05_phone_agent_0x99.ink:901`, "... then call me" in the Security relay: M5, reword.
- Ink `m05_phone_agent_0x99.ink:936`, "Call me again if it helps.": M5, reword.
- Ink `m05_phone_agent_0x99.ink:1009`, `:1011`, `:1013`, `report_progress`: M5, stays (bring-in) (3 warnings).
- ERB `:1552` (patricia_phone eventMappings[0]), "Ring me if anything changes": M5, stays (Patricia callable).
- Ink `m05_phone_patricia.ink:120`, `:152`, `:338`, `:355`, "Ring me ...": M5, stays (Patricia callable) (4 warnings).

Lint hits (all in the Recruiter's ink, M5):

- `m05_phone_recruiter.ink:60`, "Caller ID": M5, `first_call` is a real call.
- `m05_phone_recruiter.ink:240`, `:259`, `:372`, `:386`, "The line goes dead.": M5 (`hangs_up`, `end_contact`, `never_talked_terms`, `idle`, `recruiter_deal_taken`, `recruiter_deal_refused`, `recruiter_final_statement` per plan 4.4).
- `m05_phone_recruiter.ink:393`, `:403`, "She hangs up first.": M5.
- `m05_phone_recruiter.ink:417`, "It rings out.": M5 (the ring-back choice becomes the engine's no-answer).

## m06_follow_the_money (6 + 1, M10)

- ERB `:1246`, `:1253` (eventMappings[43], [44]), "$12.8M in the wallet ... Call me about it.": M10, stays (fund call).
- ERB `:1628` (eventMappings[104] to [129], 26 mappings, two warnings with counts), "That's both calls made, and the backend's done ... then call me and I'll bring you in.": unexpected. Not in 7.3; it is the m06 bring-in text (M10 bring-in call) in 26 per-branch variants from an ERB loop.
- Ink `m06_phone_agent_0x99.ink:579`, "Call me when you've opened it.": M10, stays (inside the fund call).
- Ink `m06_phone_agent_0x99.ink:584`, "Call me when you have them.": M10, stays.
- Lint `m06_phone_agent_0x99.ink:141`, "I'm on the line. Call anytime.": unexpected. A hub line in HaX's text thread; no slice rewrites it. Two ways to clear it: reword, or let M10 decide since HaX gains a `call` entry there.

(The `:1628` text has two ERB variants, so it is two warnings; each carries a count of the 26 mappings.)

## m07_architects_gambit (8 + 11, M6)

- ERB `:896` (eventMappings[6]), "call me and say which": M6, reword to "message me".
- ERB `:904`, `:912`, `:919` (eventMappings[7], +2), "... call me before you log in on their host": M6, reword to "tell me" (7.3 lists `:904` only; `:912` and `:919` are its variants).
- ERB `:1314`, `:1322`, `:1329` (eventMappings[65], [68], [69], +2), "Grid's held ... call me ...": M6, stays (bring-in).
- Ink `m07_phone_agent_0x99.ink:167`, "Call me the second you hit something you can't open.": M6, reword.
- Ink `m07_phone_agent_0x99.ink:177`, "Get past the checkpoint ... Call me when you hit something you can't open." (inline conditional): unexpected. Not in 7.3; the same hint family as `:167`, so M6 should reword it too.
- Ink `m07_phone_agent_0x99.ink:343`, "Submit the rest, then call me.": M6, stays (bring-in).
- Lint `m07_architect_comms.ink:97`, `:124`, `:141`, `:289`, `:351` ("Your handset lights", "The line drops"): M6, the taunts become withheld voiced calls and the narration is rewritten.
- Lint `m07_architect_comms.ink:381`, `:383`, "He hangs up first.": M6 (plan 4.4 `taunt_t1`, `t1_close`).
- Lint `m07_architect_comms.ink:399`, `:401`, "Your handset rings anyway.": M6.
- Lint `m07_phone_agent_0x99.ink:798`, "A long pause on the line.": unexpected. HaX narration in the bring-in family; not named by 7.2.
- Lint `m07_phone_agent_0x99.ink:804`, "Not on this line.": unexpected. A figure of speech; M6 rewrites `bring_me_in` but not this knot.

## m08_the_mole (6, M10)

- ERB `:827`, `:830`, `:833`, `:836`, `:839` (eventMappings[8], [10]), "Root. A terminal and a time, no face ... read it to me." plus an ERB-built tail with "call me": unexpected. Not in 7.3 (ERB variable text). Same door-audit beat as `:867`, so M10 should cover it.
- ERB `:867` (eventMappings[14]), "That's the door audit ... Call me when you've got both.": M10, stays (door audit call).
- ERB `:1035` (eventMappings[58]), "Ow. I'm not hitting back, 0x00 ... Ring me.": unexpected. The 7.3 grep covered "call me" only, not "ring me". The beat is a fight reaction, not the door audit; needs a decision (reword to "message me", or leave if HaX is callable by then).
- Ink `m08_phone_agent_0x99.ink:234`, `:247`, "Read it again and call me back.": M10, stays (inside the door audit call).

## m09_digital_archaeology (0 + 6)

No check warnings: the m09 contacts use the old voiced forms, which the check treats as call-capable.

- Lint `m09_phone_nightshade.ink:15`, `m09_phone_torres.ink:21`, `m09_phone_gary.ink:18`, "The number rings out.": M1 (the `start` stubs drop the "[Ring back.]" choice).
- Lint `m09_phone_nightshade.ink:20`, "get off her line", and `:27`, "before you picked up": M1 (the `call` knot, which M1 marks `// lint: call-knot`).
- Lint `m09_phone_recruiter.ink:37`, "The number rings out.": unexpected. 7.2 lists the Recruiter's calls as unchanged and M1 names only Nightshade, Torres and Gary.

## m10_full_disclosure (0 + 3)

- Lint `m10_ghost_phone.ink:123` ("on this line"), `m10_phone_agent0x99.ink:302` ("on the line"), `:763` ("on the line"): unexpected (3). These are figures of speech inside voiced old-style calls. No slice touches m10 call knots (7.2 says "unchanged"); the fix is a `// lint: call-knot` marker on those knots, which nobody has scheduled.

## lab_tesseract_trials (4 + 3, all unexpected)

7.2 says this lab is unchanged and 7.3 stops at m08, so nothing clears these.

- ERB `:468`, `:470`, `:472` (eventMappings[22], [24], [26]), "... Call me when you're clear.": unexpected (3). HaX texts to "call me" with no call entry; decide between rewording to "message me" and giving HaX a call entry.
- Ink `phone_agent_0x99.ink:220`, "Then call me.": unexpected.
- Lint `phone_agent_0x99.ink:69`, `:153`, `:181`, "on this line": unexpected (3). Figures of speech in a text knot.

## sis02_energy (1, M9)

- Ink `npc_marcus_webb.ink:139`, "Tell Tom to ring me and I'll confirm.": M9, the sis02 ring-wording pass. This is a person-to-person ring inside the fiction, so a reviewer may reasonably leave it.

## test_finale_calls_credits (0 + 1, unexpected)

- Lint `hax_call.ink:15`, "Don't hang up.": unexpected. A voiced test call; adding `// lint: call-knot` under its knot heading clears it.

## Notes

- The "stays" outcomes above clear when the owning slice adds a `ring` or `call` entry for the contact (the check is per contact, not per beat), not when the text changes. The "reword" outcomes clear when the text changes.
- A "stays" text on a contact that gets only a `ring` (no `call` entry) is not flagged afterwards either. Plan 3.5 asks that the call exist for that beat; the check cannot tell which beat.
