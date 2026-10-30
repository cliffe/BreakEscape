# E20 remote and mobile working — design cycle 2 + dialogue cycle 1

Episode: `e20_remote_and_mobile_working` (full) and `e20_remote_and_mobile_working_defend` (defend-only).
Company Tarrowby Logistics, host Zainab Hussain, module core_09, role `mobile`. Consequence-flip shape
(ENG-04) with the `wifiList` page state (ENG-14) for the Wi-Fi cards, and the montage now carrying a
words-not-colour "Your call" tag (ENG-04 flip fix).

Reviewed against `REVIEWER_BRIEF.md`, `reviews/build/E20_DESIGN_C1.md` (and its C1 outcomes),
`episodes/E20_remote_and_mobile_working.md`, `modules/core_09_remote_and_mobile_working/concepts.md`,
and `00_COURSE_OVERVIEW.md`. Combined `scenario-design-review` + `npc-dialog-review`, adapted to the
awareness kiosk. Read-only; nothing edited but this file. `E19_E20_PLAYTEST_P1.md` does not exist, so no
playtest findings were folded in.

**Judged from:** both `.json.erb` shells, both host ink files, the `e20/mistake.json` and `e20/defend.json`
fragments, the E20 lines in `gen_e8_e17_shells.py`, `core_09/concepts.md`, the `wifiList` CSS, the montage
engine (`flip-view.js`, `episode-model.js`), and the two validators. All screens judged **from code**, not
a render (the optional :3001 bridge was not run — the C1 pass already rendered the cards/montage/debrief and
nothing in the content changed since except the CSS palette, which I read directly).

## Counts

| Thing | Count | Notes |
|---|---|---|
| Full stages | 5 | `brief, mistake, flip, defend, debrief` |
| Defend-only stages | 3 | `brief, defend, debrief` |
| `mistake` beats | 5 | one `safe:true` each, safe position varied (1,2,1,2,1) |
| Defend cards | 6 | 3 genuine (1,4,5), 3 fake (2,3,6); three mirror pairs |
| Concept cards | 5 | all carried into both variants' debrief |
| Host ink lines | full 8 / defend 3 | dialoguelint max 25 (full) / 30 (defend), no rule hits |
| Named cast | 1 | Zainab Hussain |

**Validators (clean for E20):**
- `validate_scenario.rb --strict-social --no-graph --skip-ink` on both shells: passes, only the standard
  m01-shaped SUGGESTION noise that applies to any one-room awareness kiosk.
- `dialoguelint.mjs` both folders: full `lines=8 max=25`, defend `lines=3 max=30`, no rule hits, no printed
  variables, all host lines under 30 words.

## C1 closure table

| C1 finding | Ruling | Verified this pass |
|---|---|---|
| **MA1** — `wifiList` paints open red / secured green (the password=safe misconception) | engine fix | **Closed.** `inbox-triage-minigame.css:444` now sets `.tri-wifi-secured, .tri-wifi-open { color:#2a3555 }` — one neutral ink for both labels. The green `#1f5d33` is gone from the file; the lock glyph (445–447) and the words carry the open/secured distinction. The remaining `#8f2a1f` reds are the browser "Not secure" label and autofill marker, not the Wi-Fi list. |
| **MI1** — one aim vs the spec's two | confirmed intended | **Closed.** Both shells carry a single `tell_them_apart_aim` (`order 0`, `missionConclusion: true`), matching the built E11 reference. No change needed. |
| **MI2** — card 3 per-flag note dense | fixed | **Closed.** The tightened `wifi_page_credentials` note ("...also reads 'Not secure'. Even with a padlock, no Wi-Fi page needs your work password: a padlock only means the connection is encrypted, not that the page is honest (see E5).") is byte-identical across `e20/defend.json` and both shells (md5 match). Em dash replaced with a colon, per the house rule. |

## What works (carried from C1, re-verified)

- **Proportionate, current Wi-Fi.** The "Public Wi-Fi, in proportion" card, card 1's `whyFine`, and card 4
  match `concepts.md` and retire the "anyone on the café Wi-Fi can read your email" scare; risk is narrowed
  to the look-alike network and the over-asking page. Matches the misconceptions table exactly.
- **One spine, repeated.** "Check the network's name, let the VPN do its job, never type your work password
  into a Wi-Fi page" runs through the brief, the `cafe_wifi` flipbeat, the cards, the concept panel and the
  host lines.
- **Fair defend set with the two pressure points.** Card 1 is the awkward genuine item — a stronger
  look-alike ("BeanBarrow Free") sits next to the real one, and trusting is right **only because the board
  names it**; card 2 is its exact inverse (no board, so trusting is wrong), which is a genuinely good
  teaching contrast. Card 4 is the genuine page placed straight after the fake page (card 3), the
  genuine-after-a-likely-miss. Each genuine item carries a `falseAlarmCost`; each fake an `ifTrusted` +
  `reportReply`. (The product-wide convention that a reported genuine still scores full is in play here as
  everywhere; the pressure against over-caution is the `falseAlarmCost` text, not the score.)
- **No-blame register holds.** "She wasn't being nosy; the screen was just there", "The stranger was lovely
  and touched nothing", plus the `noBlameLine` and Zainab's "Nobody's ever in trouble for reporting."
- **Overlap handled.** Card 3 cross-references E5 (padlock = encrypted, not honest); the E6 look-alikes
  `tarrowby-wifi.example` / `tarrowbey.example` are reused, not redeclared.
- **Montage "Your call" fix verified.** `episode-model.js:montageProps` shows the taken option's own line
  (both options are authored for every beat, so the taken line always wins), and `flip-view.js:145–148`
  styles it by the *shown* option's safety and adds a words-only tag — "Your call: the safe route" for a safe
  pick, "Your call" otherwise. The C1 "safe pick styled as a mistake" issue is resolved. The `cafe_wifi`
  headline even names the threat on a safe pick ("...the look-alike with the stronger signal got nothing from
  you"), so the lesson survives a clean playthrough.
- **Fonts/sizes.** SSIDs in the address font at 15px, meta/note rows at 13px, nothing below 13px; page
  domains in the address font.
- **Defend-only shell correct.** `mistake`/`flip` dropped, all five concept cards + rule of thumb carried,
  no "morning at home" over-promise in its brief (see MA2), scoring globals internally consistent
  (`episode_e20_remote_and_mobile_working_defend_defend_*` — the double `_defend_` is the standard generator
  pattern for a defend variant, matched across the aim global, `setGlobalPrefix`, eventMapping and ink VAR).

## Design findings

### MA2 — major — episode-local / needs-user — home working (C09-LO6) is promised but never delivered (full)
Full `scenario.json.erb:4` + `:420` (`strings.brief`): "First you spend two days working away from the
depot: a train, a café, a hotel, a morning at home."

The episode spec makes home working a required minimal touch: §1 "C09-LO6 (home working: camera and screen
share) is touched only in a debrief concept card and the montage, not as a scored card" and §6 "carried only
by the montage ... and a debrief mention." The build delivers **neither**:
- no `home` sandbox beat (beats are `train_screen`, `cafe_call`, `mind_laptop`, `cafe_wifi`, `lost_tablet`);
- no home line in `flipMontageByChoice`;
- no home card in `conceptPanel` (the five cards are Wi-Fi × 2, overlooked/overheard, devices/lost, Tarrowby
  controls — none covers camera-in-shot, share-a-window, or family use).

So a whole module learning objective gets zero coverage, and the learner is told they will "spend ... a
morning at home" and never does. The hotel, by contrast, *is* realised (card 2, Haverbridge Lodge). This is
full-variant only — the defend shell's brief doesn't promise home.

Fix (pick one, needs-user):
- **(preferred, spec-aligned)** add a sixth `conceptPanel` card — the "debrief concept card" the spec names —
  e.g. heading "At home, mind the camera and the screen", text drawn from `concepts.md` "Home working" (check
  what's behind you before a video call, share a window not the whole screen, work devices are for work). This
  touches no scored card and keeps the defend set at six.
- **(or)** trim "a morning at home" from the full `scenario_brief` and `strings.brief` so the copy matches the
  content (e.g. "...a train, a café, a hotel."), and accept C09-LO6 as out of this episode.

### MI5 — minor — episode-local — "VPN" is never glossed for a non-technical learner
`conceptPanel` cards 1 and 5, and several host lines, lean on "VPN" / "Tarrowby Connect" as a given. A clerk
on first read may not know what it is. `concepts.md`'s glossary has the four-word version. Optional one-clause
gloss in card 1:
old → "...and Tarrowby's laptops add a VPN on top, so ordinary work on the venue's own network is mostly fine."
new → "...and Tarrowby's laptops add a VPN (a secure tunnel back to the company) on top, so ordinary work on
the venue's own network is mostly fine."
Not a blocker; the text works without it and the phrase is widely known.

## Dialogue findings (old → new)

### MI3 — minor — episode-local — full host "done" line is clipped/ungrammatical to voice
`scenarios/awareness_e20_remote_and_mobile_working/ink/zainab_hussain.ink:40`.

The line drops its verb and reads oddly aloud; the defend variant already says it the smooth way
(`..._defend/ink:22`, "if unsure, use your hotspot"). Align the full line to it (stays 20 words):
old → "A Wi-Fi page wanting your work password is always a fake, and when you're not sure it's the phone's
hotspot."
new → "A Wi-Fi page wanting your work password is always a fake, and when you're not sure, use your phone's
hotspot."

### MI4 — minor — needs-user (doc only, not learner-facing) — stale montage comment in the fragment
`planning_notes/phishing_and_social_engineering/awareness/e20/mistake.json:7` (and the `_notes.flipMontageByChoice`
block) say a beat the learner took the safe option on "shows the 'taken instead' line (the version where it
went wrong)." The current engine (`episode-model.js:485–499`) shows the taken option's **own** line — for a
safe pick, the good-outcome line, tagged "Your call: the safe route". The behaviour is correct and matches the
authored lines; only the dev comment is out of date. Worth a one-line correction so a future author isn't
misled. No learner-facing effect.

## Voiced host lines I'd change

Only MI3 above (full done-line). The rest voice cleanly:
- Welcome line 3 ("A screen someone reads, a call someone hears, a bag left for a minute, a password typed
  into the wrong Wi-Fi page.") is a verbless list but reads as an intentional spoken build after "it's the
  small things that catch people" — keep.
- The defend welcome (30 words, four short sentences ending "Nothing's real.") is terse but voiceable — keep.

## Verdict per stage

- **brief** — ship after MA2 (resolve the "morning at home" promise).
- **mistake (sandbox)** — ship. Five fair beats, exactly one safe option each, position varied, both montage
  lines authored. (Home beat intentionally absent per spec — but see MA2.)
- **flip (montage)** — ship. "Your call" tagging verified; headline keeps the threat named on a safe pick.
  Fix the stale dev comment (MI4) at leisure.
- **defend** — ship. Fair set, three mirror pairs, awkward genuine (card 1) + genuine-after-fake (card 4),
  MI2 closed, fonts/sizes right.
- **debrief** — ship after MA2 (the sixth concept card is the natural home for the missing C09-LO6 touch).
  Monday card is three concrete actions; the no-blame line and rule of thumb are right.
- **defend-only shell** — ship. Correct stage drop, globals consistent, no home over-promise.

**Overall: ship-worthy, one major (MA2) to resolve with the user.** MA1/MI1/MI2 from C1 are all closed and
verified. MA2 (home working promised but not delivered — a module LO the spec said to include) is the one new
item needing a decision: add a sixth concept card or trim the brief. MI3 (full done-line voicing), MI4 (stale
fragment comment) and MI5 (gloss VPN) are small and local.
