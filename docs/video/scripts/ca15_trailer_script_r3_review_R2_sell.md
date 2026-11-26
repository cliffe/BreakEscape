# ca15 trailer script r3: sell and truth review, round 2

Script: `docs/video/scripts/ca15_trailer_script_r3.md` at 895849ad7 (revision 2, 75.78 s). Checked against `scenarios/ca15_shadow_it/scenario.json.erb`, `ink/nilesh_solanki.ink`, the episode runner (`episode-runner-minigame.js` `_pendingBeat`, `episode-model.js` `stageFollowing`), `docs/video/recipes/course-trailer.md`, `docs/video/CA_THEME_TWO_SEATS.md`, `docs/video/GUIDELINES.md` and the CA fun and USP rubric. External sources fetched this round: the NCSC "Shadow IT" guidance page and the Tischer et al. 2016 paper (full text). Reviewer: Opus (sell and truth). 26 Nov 2026.

**Totals: 0 B, 3 M, 2 m.**

## R1 majors

- **R1 M1 (beat order): resolved.** led_email (beat 13) now follows the drop, v18 follows v16 directly, and v17 names the referent ("the personal inbox").
- **R1 M2 (no payoff): resolved.** Beat 11 holds on the session note with v21, and the body stays a glimpse.
- **R1 M3 (corner run): resolved.** Nilesh's "She was being kind" is the default beat 12. The corner run is option C, and the default cut no longer depends on E4 or the cross-room bark.

## Verified true this round

- Joanne's two barks match the erb word for word: the `npc_picked_up:ca15_red_stick` mapping, and the `npc_use_started:ca15_ops_pc` mapping with `data.npcId` set to Joanne.
- The session note's name and text match, and it is given by the `ca15_drop_t_note` timer (`startOnGlobal: ca15_drop_used`, `delayMs: 300`).
- `red_stick` is `after: "mistake"` with `resumeOnDone: true`.
- These strings match: `worldBeatHeading` "One from the red-team kit", `flipHeading` "Six months later", the `send_personal` montage line, the Benmoor subject and `kindLine`, and Fatima's two barks.
- Nilesh's lines 84, 85 and 87 and his hub line on `ca15_drop_used and not ca15_drop_said` are in the ink as quoted.
- "Everyday choices" is the runner's mistake-stage heading, and the inbox's four verbs are Trust, Report, Delete and Verify.
- No "Break Escape" appears anywhere on screen or in the VO. The CTA "Learn on Hacktivity.co.uk" is spoken in v11 and shown on the plate.
- None of the eight new narrator lines blames anyone or tells the viewer to do the unsafe thing.

## Findings

| # | Sev | Line or beat | Issue | Fix |
|---|---|---|---|---|
| 1 | M | Seat tab `THE SHORTCUT` on beats 6 to 12 (house rule, section 1 "M7") | **Sell (USP).** The trailer's best selling point is 26 s of the learner acting as the attacker: taking the kit, choosing where people stop, and watching who bites. The only label that stays on screen during that stretch says `THE SHORTCUT`, which is the employee's seat. v18 says "the attacker's side" once, and the `RED TEAM · BOOKED WITH IT` chip lasts 2.7 s. A silent viewer reads the drop as more shortcut-taking. The theme already has this seat in the same colour: the seat tab reads `ATTACKER` (CA_THEME_TWO_SEATS, "Seat labels... so a silent viewer always knows whose side this is"). | Tab `ATTACKER` on beats 6 to 12, then back to `THE SHORTCUT` on beat 13 (the six-months page). Same red, same left seat, so there is no seat change and no extra join. Keep the room in the chip, and keep `RED TEAM · BOOKED WITH IT` on beat 6 for A2. This changes the recipe's "consequence-first trailers never claim an attacker" rule for ca15, so put it to the owner through AC0 alongside R1 m10's recipe note. If the owner keeps `THE SHORTCUT`, the chip on beats 7 to 11 becomes `RED TEAM · <room>`. |
| 2 | M | Section 1 ("After the first shortcut pick", "one shortcut pick, then the drop"); section 3 v18 truth note; shot list entry states for t10, t11 and t15 ("`--set` the sort complete") | **Truth (game and capture spec).** The mistake stage has four picks (`personal_email`, `drivers_chat`, `visitor_stick`, `rota_app`). `_pendingBeat` shows the red-team panel only when `state.done` includes `mistake` **and** `state.stage === stageFollowing('mistake')`, which is `flip`. So the step-away comes after all four picks, not after the first. "Sort complete" names the defend sort everywhere else in the script (v15, beat 15). Seeded that way, the stage is past `flip` and t10 and t11 open with no Look up panel. The trailer cut can still elide (one pick shown, then the drop), so no VO changes. | Section 1: "after the four everyday choices (the mistake stage), before the flip". Entry state for t10 and t11: "mistake stage done with `send_personal` on card 1, stage `flip`, `worldBeatPicked` unset". t15 needs only the globals it lists, so drop "sort complete" there. Have the take script assert that the "One from the red-team kit" heading is visible before it records. |
| 3 | M | Length (75.78 s against about 70.8 s; siblings ca10 to ca14 run 70.1 to 74.4 s); attack-to-defend balance | **Length verdict: most of the extra 5 s is earned, and about 2.5 s is not.** The payoff (2.4 s, O1) and Nilesh's read (6.5 s, 2.9 s more than the corner run, O2) are the two biggest sell gains of this round, so keep them. The fat is beats 8 and 9: two shots and two VO lines (6.3 s) to get from the door to a stick on the floor. Balance is the second issue. Attack footage runs 40.9 s (beats 4 to 13) against 15.2 s for the defend half (beats 14 to 16), while the owner's chapter-card rule asks for "short attack footage... then mostly defend gameplay". The owner did ask for the real drop, so this is a call for the owner, not a defect. | Merge beats 8 and 9 into one 4.4 s shot from `door_through` to the stick landing by the kettle, with Joanne and Niamh both at the kettle (F4 still on screen). VO: **"Next door, you leave it by the kettle."** (8 words, about 3.83 s at house fit, 0.57 s margin). That saves 1.9 s. Trim beat 10's pre-roll from `use_started` minus 2.2 s to minus 1.6 s, which saves 0.6 s. That gives about 73.28 s; snap it to 29 bars (73.25 s) so it still ends on a bar. Retire v19 and v20 and voice the merged line instead (one line, not two). Add owner question 4: "The attack half is about 40 s and the defend half about 15 s; keep that, or move time to the inbox and Fatima?" Default: keep, because the drop is what the owner asked for. |
| 4 | m | Fallback hook (beat 1F) together with beat 16 | If the fallback ships, Fatima opens and closes the trailer over the same stick in the same room. The viewer may read beat 16 as a replay. | Cut it as a deliberate bookend: the hook asks "Hang on...", and beat 16 answers with her ask. Frame them differently: t07 at 2 / 1.125 / 2 and t14 closer, as in its shot note. Note in section 8 Q1 that the fallback's story is "a stick turns up, here's how you got there". |
| 5 | m | Section 7, Tischer source note | The note is accurate as far as it goes. The paper also found that "geographic location, time of day, and day of week have no affect on whether a user plugs in the drive" (Table I). So the review page must never cite Tischer behind "somewhere people stop" or "by the kettle". Separately, and out of scope for the trailer, Nilesh's unused ink line "A labelled stick gets opened out of nosiness. A blank one gets plugged in to find its owner" runs against the paper: no appearance raised the connection rate, and return-address labels lowered it (29% against 45% unlabelled). | Add one clause to the source note: "location had no measured effect; the kettle is a game rule (the notice radius), not a cited finding." Pass the label line to the ca15 scenario owner as a dialogue-accuracy note. |

## External sources (fetched 26 Nov)

- **NCSC "Shadow IT".** Shadow IT "refers to the unknown assets that are used within an organisation for business purposes". It normally arises when "employees struggling to use sanctioned tools or processes" find workarounds. The page also says to "always take a positive and no-blame approach to people who have been forced into adopting shadow IT." The script's quotes match. The page says nothing about removable media or found sticks, which agrees with the script's decision not to cite NCSC for v9.
- **Tischer et al., IEEE S&P 2016.** 297 drives dropped; an "estimated success rate of 45–98%"; the first connection "in less than six minutes"; 68% to locate the owner and 18% out of curiosity; "users connect all types of drives unless there are other means of locating the owner"; "nearly half are overcome with curiosity and open intriguing files... before trying to find the drive's owner". These support Joanne's "see whose it is", Nilesh's "She was being kind" and the session note's "opened a file to find the owner". On location, see finding 5.

## Sell read (cold)

- **Hook.** Joanne's "Whose is this?" asks a question at second 0, and beat 10 answers it: you left it. That is the best open this trailer has had.
- **Attack half.** Nilesh's line 87 is the attacker's method in his own words ("somewhere people stop", "watch who picks it up"). Beat 12 gives the reason in attacker terms without blaming Joanne. This is the USP done properly, and finding 1 only makes it visible to a silent viewer.
- **v21 "The tracker reports home."** It is thin on what the attacker gains, but it is true and it fits 2.4 s. Do not reach for the session note's "payload" line: that would push the beat towards fear framing and past the window.
- **Defend half.** The inbox's Benmoor row and Fatima's ask make a fresh case for the same lesson ("you leave a stick, then one is left for you"). It is short but complete.
- **Close.** "Take the shortcut · See where it leads" still covers both halves. Keep it.

## Rubric (CA fun and USP, trailer-observable items, 0 to 3)

F2, F5, F6 and O3 cannot be observed in a trailer. A1 and A2 are gate checks.

| Item | Score | Evidence |
|---|---|---|
| F1 Early hook | 3 | 0.0 to 4.2 s: Joanne, "Someone's dropped a memory stick. Whose is this?", burned as a caption. The fallback (Fatima's "Hang on...") also scores 3 |
| F3 Agency | 2 | One pick (beat 5) with its consequence (beat 13), and one placement (beat 9) with its outcome (beats 10 and 11). Each is shown once, with no comparison run |
| F4 Living world | 3 | Joanne and Niamh on needs routines at the kettle, Joanne carrying the stick to her own desk, Fatima walking to a stick and asking with the "!" cue |
| O1 Attacker method shown | 3 | Take the kit (7), leave it where people stop (9), watch who finds it (10), the tracker reports home (11) |
| O2 Attacker reasoning | 3 | "Somewhere people stop" (placement) and "She was being kind, and that's what a drop relies on" (the human lever, not a character flaw) |
| O4 Tone | 3 | "Nobody was careless there"; Joanne is kind, not foolish; the narrator never blames and never frightens |
| P1 Practice or play out | 2 | The drop plays out in the world and a fresh case follows (Benmoor and Fatima). The learner's own answer stays off screen by design |
| A1 Accuracy (gate) | pass | Every on-screen and voiced claim checks against the erb, the ink and both sources. Finding 2 is a capture-spec error, not a claim on screen |
| A2 Safe takeaway (gate) | pass | Pattern level only; no device, payload or tooling detail; the beat 6 chip shows the exercise is sanctioned |

Scored 19 of 21. That matches the script's own estimate, so I see no inflation. Finding 1 raises nothing on paper but makes O1 and O2 readable with the sound off. Finding 3 costs nothing on the rubric.
