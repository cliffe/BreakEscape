# S5b/S5c round 3 review: client delta (Sonnet)

Scope: commit 8a27c1089 (`scenarios/test_ops_privilege/PLAYTEST.md` only, 8 lines), checked against the round 2 findings in `S5bc_R2_client.md`. No tests run (doc-only delta); no servers; no code touched.

## Verdict: PASS with 1 minor new finding (R3-CLIENT1). No finding needs Opus.

## Round 2 findings

| Finding | Status | Evidence |
|---|---|---|
| R2-CLIENT1 beat 13 toast | closed | Beat 13 now reads: one toast "Hash collected (2)". Matches `findToastText` in `public/break_escape/js/utils/remote-host-text.js` (equal lines merged into "line (n)"). The added "held while the desktop is open and shown after it closes" matches the beat 16 wording. |
| R2-CLIENT2 row stays "hash" until next press | closed | Beat 17 now says the row still reads "hash" with "Crack" until "Cached accounts" is pressed again. Beat 20 now says the press refreshes the rows (Sam "cracked"/"Open", Priya "hash"/"Crack"). This agrees with `markCracked` running only at a press. Doc fix chosen, no server change. |
| R2-CLIENT3 remote domain docs | closed (by e36ab07fd, not 8a27c1089) | `grep` finds neither "at the keyboard only" nor "landing separately" in `docs/ACCESS_AND_NETWORKS.md`; e36ab07fd touched that file (4 lines). The dead `row.domain` spread was left as optional. |
| R2-CLIENT4 unseen screen states | closed | Beat 5 and beat 23 now carry "seen in game 187" lines with the labels ("Domain: northwind" under "Bay desk PC (BAY01)", then "Connect with / Bay PC sign-in token", marker "Administrator"; "Cracked" / "Desk administrator (deskadmin): Winter2026", row "cracked" with "Open"). The intro names game 187 as the source. I cannot re-run the browser; the claim rests on the author's report. |

Also checked: the commit renamed "The desk administrator's habit" to "The shared desk login habit" and reworded the poster text in beats 22 to 24. This matches `scenario.json.erb:139` (label "The shared desk login habit"). The poster text in beat 22 ("admin duty on the desks is shared by everyone in turn ...") was not compared word for word with the scenario text here.

## New findings

### R3-CLIENT1 (minor): beat 20 says Sam was cracked "in beat 17", but beat 17 only opens the cracker

Beat 17 says to click "Crack" on Sam's row, see the cracker with two chips, and close it. It never picks a chip or presses the cracker's own Crack. Beat 20 now says "Sam's reads 'cracked' with 'Open' (cracked in beat 17; the press refreshes the row)". Followed as written, Sam is not cracked in beat 17 and the row would read "hash". The only evidence of a cracked Sam is the recorded `keyring_after_collect_desk_b` in `test/fixtures/files/ops_privilege_answers.json`, where `hotdesk_sam` has `"status": "cracked"`. That is a scripted recording, not the click path of beat 17. If game 187 did crack him, beat 17 is missing the step; if not, beat 20 is wrong.

Fix (`PLAYTEST.md`): in beat 17 add the step ("pick a chip, press Crack: Sam's hash cracks"), or reword beat 20 to "Sam's row reads cracked / Open only if beat 17 pressed Crack in the cracker; otherwise hash / Crack". The playtester should confirm which.

## Recorded limits
- No browser run; the game 187 lines are taken on trust.
- Nothing in this delta touches what the server sends.
