# Recipe: Cyber Aware episode and course trailers

**Cyber Aware only.** The SAFETYNET mission trailer is `mission-trailer.md`. Nothing from the SAFETYNET look carries over (no keyhole title, no Licence to Hack opening, no red hex curtain, no Agent HaX). The visual rules are in `docs/video/CA_THEME_TWO_SEATS.md`. The episode and course content comes from `docs/video/CA_TRAILER_OUTLINE.md`.

House rules that still hold (`README.md`, `GUIDELINES.md`): 30 fps; −14 LUFS with true peak under −1 dBTP; an `.srt` cue for every voiced line; no empty screens; straight-line walks; a frame check of every shot; voiced lines only if they are in the ink (or the kit JSON) and cached.

## Defaults in force (D308 to D318, unanswered, outline recommendations)

The user can override any of these. Until then:

| Question | Default |
|---|---|
| Which videos | pilot ca12, then every episode, then the courses, then the programme |
| Length | episodes 45 s (consequence-first 40 s), courses 60 s, plus a 20 s catalogue cut from each episode |
| Narrator | none on episodes: game voices and cards only. One cast host voice for the programme trailer, only from cached lines |
| Sign-off | the Cyber Aware mark, then Hacktivity small |
| Platform first | Hacktivity course pages: 16:9, silent-safe, burned captions. Then LinkedIn 1:1 and 9:16 |
| Theme | "Two seats" |
| Attacker tools | named on cards ("Pretext call", "Look-alike page builder") |
| Consequence-first | same template, beats swapped (below) |
| Music | one CA track, with an attack cut and a defence cut |
| Debrief | none on screen in episodes; the programme trailer may use one generic cost line as text |

## Purpose

Sell one episode to a buyer or learner who reads the course page with the sound off: the learner **builds the attack first**, sees it land, then **takes the other seat** and holds the line, in an office that notices. The trailer is graded on the CA fun and USP rubric (`tmp/handover/ac0/CA_FUN_USP_RUBRIC.md`): F1 hook, F4 living world, O1 and O2 (the attacker's steps and reasoning are visible), O4 (curious tone, never fear), A2 (pattern level only).

## Episode beat sheet (45 s, attack episodes)

The times are a 0.5 s grid; move each card onto a lift of the CA track once it is analysed (`video-edit` Step 2).

| # | Time | Dur | Beat | Seat | Content | Join in |
|---|---|---|---|---|---|---|
| 1 | 0.0 | 4.0 | Hook | full frame | the company room, staff on their needs, one ambient line as a hook (ca12: Thandiwe "Right, five minutes on the sofa...") | cut |
| 2 | 4.0 | 2.0 | Title | split opens | preset `ca-open`: the two seats slide in, episode name and company in the join (**Visitors and tailgating / Merrin & Sallow**) | seam |
| 3 | 6.0 | 5.0 | Research | attacker | OSINT browser, one public fact going to the notebook. Card tab names the tool ("Open-source research") | seam |
| 4 | 11.0 | 6.0 | Build | attacker | the pretext card or mail template filling with found facts; "Use only details you have found" | cut |
| 5 | 17.0 | 5.0 | Lands | attacker | the attack landing: the meter moving, the target giving way (ca12: Delphine D1, the door unlocks) | cut |
| 6 | 22.0 | 2.0 | Flip | the join | the step strip ticks to Defend; the seats swap (theme "flip") | flip |
| 7 | 24.0 | 6.0 | Defend | defender | triage list with mixed kinds before any verdict; one card opened, no result | cut |
| 8 | 30.0 | 5.0 | Living office | defender, full frame | the step-away Look up; the room beat (ca12: the open screen, Camila walks to the door) | cut |
| 9 | 35.0 | 2.5 | What you'll spot | card | one pattern-level line, never the tell list (ca12: "A good story isn't a check"). Round 2 replaces this with the blue chapter card (see the chapter-card rule below) | seam |
| 10 | 37.5 | 4.5 | End line | full frame | the best cached line, portrait view with the game's own bar (ca12: Camila C1) | cut |
| 11 | 42.0 | 3.0 | End card | closes | preset `ca-close`: halves close into the Cyber Aware mark, course name, the tagline "Play the attack · Learn to stop it", Hacktivity small | seam |

**Chapter-card rule (from ca12 round 1, 22 Nov).** The owner asked for clearer title pages that say what the offence covers, then gameplay of the defence. So an episode runs: a **red chapter card** (what the attack covers, up to three short bullets at pattern level, no tells), short attack footage, the flip, a **blue chapter card** (what the defend half covers), then mostly defend gameplay. One red and one blue card per episode, red first. The cards use the `ca` card style with `"chapter": "attack"` or `"defend"` (`CaChapter.tsx`). In the beat table the blue card replaces beat 9 and the red card sits between beats 2 and 3; attack beats shrink to about 3 s each and beat 7 grows. ca12 round 2 is the worked example (`docs/video/edits/CA12_TRAILER_R2_SELECTS.md`).

Total 45.0 s. The **20 s catalogue cut** is beats 1 (2 s), 2, 3 (3 s), 5 (4 s), 6, 7 (4 s), 11 = 20 s; it has no end line, so its last voiced moment is the attack landing.

## Consequence-first episodes (E11, E15, E16, E19, E20), 40 s

There is no attacker to play, so these trailers never claim one. The attacker seat becomes the **"The shortcut" seat** (same left half and colour, label `THE SHORTCUT`), and the right half stays `DEFENDER`.

| # | Change |
|---|---|
| 3 | **The everyday choices**, 6 s: the choice-run cards (a busy morning, a Friday deadline, a leaver's week, a day on the road), with the verdict marks hidden |
| 4 | **Where it led**, 9 s: the "six months on" or "by the end of the day" reveal, without the per-choice verdicts |
| 5 | dropped; its time goes to beat 4 |
| 6 | the strip moves to the sort, 2 s |
| 7 | the sort drill, concern form or desk inbox |
| 8 | tier E or O: the room request; tier T (ca20): a 3 s ambient room shot |
| 9 | framed as a habit ("Check who it's going to before you send") |

The USP card reads "See where the shortcut led" in place of a tool name.

The chapter-card rule applies here too, with the left seat as `THE SHORTCUT`: a card saying what the choices cover (shortcut seat colour), the short "where it led" footage, the flip, a blue card saying what the sort covers, then mostly defend gameplay. The shortcut card never claims an attacker to play.

Tier S and T episodes (ca00, ca04, ca17, ca20) have no step-away: beat 8 becomes 3 s of ambient room, and the 2 s goes to beat 7.

## Course trailers (60 s)

1. `ca-open` with the course name (3 s).
2. Two or three 12 s episode segments, each cut from its episode edit: beats 3 to 5 (attack) or 3 to 4 (consequence-first), then a 2 s slice of beat 8. A company stripe in the seat label says which company each segment is set in.
3. A 6 s "before and after check" card: the pre check, the episodes, the post check, "no pass mark".
4. The course habit line as text (from the seed), 4 s.
5. `ca-close`, 3 s.

Courses 7 and 8 (consequence-first only) show no attack half: use the shortcut seat throughout. Course 12 (incident simulations) is out of scope.

The **programme trailer** (90 s) follows section 5 of the outline. Its narrator, if the user wants one, is a cast host, and only with cached lines.

## Captions

- The game's own subtitle bar carries the line in 16:9 where it is in frame; never add a second layer over it.
- **Burned captions on every cut**, 16:9 included, because the course page plays silent. Where the bar is cropped (9:16, 1:1, or a tight 16:9 frame), set `caption` on the shot so the theme's caption style shows the line from `lines[]`.
- Cards are the story for a silent viewer: each beat must read without sound.
- `.srt` always, with shot-level `"dialogue": true`.

## End card

The Cyber Aware mark, the course or episode name, the tagline "Play the attack · Learn to stop it" (the owner dropped "15 minutes, in your browser · No installs", 2026-11-22), then Hacktivity small under a rule. No "Play now" (that is SAFETYNET's call to action). No URL until the course page link is confirmed.

## Spoilers for CA

Off screen: tells (the details that give an item away), the tells checklist, check-form answers, scores, percentages, grades, debrief verdicts, the flip's picked-out lines, "You stopped..." or "You kept..." branch lines, and choice menus whose options are outcomes. On screen: the attack build, the lure (pattern level, never a readable worked lure that could be lifted), the attack landing, the flip, the triage list before any verdict.

## Inputs and stages

1. `video-scout` (adapted to CA): `docs/video/scout/<ep>_scout.md`.
2. Shot list or picks: `docs/video/edits/<EP>_TRAILER45_SHOTLIST.md`.
3. `video-takes`: takes under `tools/video/takes/<ep>/`, from a worktree of local main, avatar window agreed with VID1 and AC0 if BE_SPRITE is set. Always `FOOTAGE_ROOT=$HOME/video-takes-local`, never `~/safetynet-footage` (a one-way Drive mirror whose timer moves unsynced folders to `~/safetynet-footage-deleted/`); a display other than VID1's 113, with its own `VIDEO_STATE_DIR`. Pass `--set` JSON to `run-take.sh` without single quotes. Runbook pattern: `docs/video/edits/CA12_CAPTURE_RUNBOOK.md`.
4. **Script rounds (before any voicing or final render; owner, 2026-11-22).** Write `docs/video/scripts/<ep>_trailer_script.md`: one row per shot with time, footage, on-screen text, narrator line and game line, plus the owner's brief. It can be generated from a draft edit list (`tools/video/scripts/make_script_doc.js` pattern). Then review it in rounds, as for plans (`AGENTS.md`):
   - each round has two reviewers in parallel: **sell and truth** (Opus: does it sell the course on its own, is the attacker-first USP clear, is every narrator claim true of the episode's ink and scenario) and **silent read and timing** (Sonnet: captions alone tell the story and match the picture, words per second at most 3.0, no narrator over a character line, caption length, rhythm, writing rules);
   - the orchestrator merges the findings into a rewritten script (no references to the reviews in it), at most five rounds, and from round 4 on uses delta reviews on Sonnet; stop when a round finds no B or M;
   - a captions-only render is allowed as a timing preview during the rounds; it is not the review cut;
   - then the owner signs off the script (line text and voice) through AC0. Only then generate narrator TTS (new spend: needs its yes) and render the review cut.
5. `video-edit`: `tools/video/edits/<ep>_trailer45.json`, first shot `{"preset": "ca-open"}`, last `{"preset": "ca-close"}`. Narrator cues go in the edit-level `vo` list; small game UI gets an `insets` magnifier (see the theme doc).
6. `video-review`: one page per round with the questions below, scored against the rubric's F1, F4, O1, O2, O4 and A2.

## Review questions

1. Verdict: ship, revise or rethink?
2. Does the trailer make it clear, with the sound off, that the learner plays the attacker first and then defends?
3. The tool cards: do the names read as the episode's own activity?
4. Is anything on screen a tell, a verdict, a score or a readable lure?
5. The hook and the end line: keep, or swap for the spares?
6. The flip: does the seat swap read as the turning point?
7. Does the office feel alive (F4), and is the tone curious, not frightening (O4)?
8. The Two seats look: right for a separate product line? Anything that still reads as SAFETYNET?
9. Music: the attack and defence cuts, or silent with captions only?
10. The end card: mark, wording, Hacktivity placement.
