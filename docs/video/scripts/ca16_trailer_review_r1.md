# ca16 trailer script review, round 1 (sell and truth)

Script: `docs/video/scripts/ca16_trailer_script.md` at 851756c99 (defaults taken for the open owner questions, Darren's cooler walk added to `topic`). Checked against `scenarios/ca16_insider_risk/scenario.json.erb`, `scenarios/ca16_insider_risk/ink/anjali_rao.ink`, `docs/video/takes_ca16.md` (dry runs, 23 Nov), `docs/video/CA_MOVEMENT_B4.md`, the recipe and the finished ca07 script. Findings are not applied.

Verdict: revise. Totals: **0 B, 2 M, 6 m.**

## Findings

### M1. The `list` shot describes a list that does not exist
Row: "the top five rows (Reuben's row at the foot cropped out)". The dry run's row order is Opportunities, Reuben, Quayholt Sign-in, Ross, IT Service Desk, Hana: Reuben is second and Hana last, so no crop removes Reuben and keeps the header. The take already blanks Reuben's preview ("Can I use your login for ten minutes?") with the row height, name and time kept. The notes ("Frame the list on the top five rows so the Reuben row is out") and default 4 ("cropped out of the list shot for that reason") repeat the error.
Rewrite the row: "t05_inbox_list 2–5.4 s · tab A LEAVER'S WEEK · all six rows, Reuben's preview blanked in the take (name and time stay), the '0 of 6 sorted' header in frame; badge hidden; nothing pressed". Notes and default 4: "Reuben's preview is blanked in the list shot, so his request does not pre-empt Niamh's." v9a "Six messages, one week." now matches the picture exactly.

### M2. `niamh_end` timings are stale, and the long-in alternative would cut Niamh's own bark
Notes: "Niamh's ask is estimated at +8 to +10.5 s after Look up (up to about +14 s ...)". Measured: bark 1 "Hang on, my screen's thrown me out." +1.6 s (3.04 s, ends about +4.64 s), Niamh beside the player +4.06 s, ask +6.0 to +6.4 s. In = ask minus 1.3 s lands at +4.7 to +5.1 s, only 0.06 to 0.46 s after bark 1 ends. The alternative "in = ask minus 2.2 s ... if the picture of her arriving is wanted" lands at +3.8 to +4.2 s, inside bark 1, so the shot would open on a clipped line.
Rewrite the note: "Measured in the dry run: bark 1 at +1.6 s (ends about +4.6 s), Niamh arrives +4.1 s, the ask starts +6.0 to +6.4 s. In = ask minus 1.3 s; check on the real marks that it is at least 0.2 s after bark 1's audio end, and if not, use in = bark 1 end plus 0.2 s and keep the out. Hold 10 s after the press." Delete the ask-minus-2.2 s alternative.

### m1. The `flip` shot has no Continue and no tick
Row: "`Continue`: the strip ticks to 4 Defend". `t04_concern_form` seeds the state and opens on the Raise a concern launch panel with the strip already on 4 Defend (three ticks); t03 never leaves the montage, so there is no Continue to film. The launch paragraph (it names Samira) is hidden.
Rewrite: "t04_concern_form 0–2.6 s · tab YOUR TURN · the Raise a concern launch panel, strip on 4 Defend; heading and strip only, the paragraph hidden in the take". The turn then rests on the edit's seat flip; v6 "Now it's your turn." still fits.

### m2. The Brief panel's scope notice is in frame
The take hides the advice paragraph, and the second paragraph "... You are not being asked to investigate anyone." stays (`takes_ca16.md`, t02). It is reassurance, the same kind of line the hook's bar crop removes from Anjali. Crop the panel above the scope notice (the strip ends at y 367 and the heading at y 425; the notice starts at y 613), now in the 2.5 s Brief part of `topic`.

### m3. The Darren cutaway in `topic` is unproven and unnamed
`t08_darren_cooler` is written and not dry-run; the trip length is a tile estimate. Darren is never named, so the cutaway only says "an office". It sits under "This episode: insider risk.", which the owner rule wants over footage that shows the topic. It earns its place for F4 (the office moves before the kiosk takes over), so keep it, but: if the dry run fails the 120 px check, or the walk does not read in 1.6 s, return `topic` to the Brief panel alone (4.1 s). Start v1c on the join, not before it, so "insider risk" lands on the Quayholt heading.

### m4. v10 "Real, or rigged?" over a genuine colleague (O4, A2)
Hana is `isPhish` false: "Genuine and awkward, not a trick." In an episode whose lesson is "facts, not a verdict on anyone", the trailer asks the viewer to suspect a colleague who turns out to be fine. The line is a question and the card stays unanswered, so this is minor.
Optional rewrite: **"A colleague's locked out. What would you do?"** (7 words and a stop, 3.04 + 0.3 = 3.34 s, same as now; caption "A colleague's locked out. / What would you do?").

### m5. The brief's "Play now" is not in the close, and should not be
The orchestrator's rules list "Play now"; `CA_THEME_TWO_SEATS.md` and the recipe rule it out for Cyber Aware. v13 "Make the calls, see where they lead, on Hacktivity.co.uk." follows the CA rule. No change; flag for the owner if "Play now" is a new rule.

### m6. The `concern` row names three chip groups; four are on screen
The Build step shows What, When, Where and Who (t04 frame). The Who chips are "It came to me; I gather others were messaged too" and "A colleague on my team; I'd rather not say more than that": neither names Samira, so they can stay. Rewrite the row to "the What, When, Where and Who groups".

## Facts checked (true as written)

- Hook: `anjali_rao.ink` line 57, "Anjali Rao, information security. This week someone's leaving and there's a bit of talk going round. You're not here to catch anyone."; the trailer takes the middle sentence.
- v3: "We pay people at firms like yours for remote access. 25% of what we make." is an offer of money for access.
- v4: "Ross asks you to export his accounts to his personal email 'for the handover'", and the brief says a colleague is leaving on Friday.
- v5, v5b, v12: `flipHeading` "A week later"; "A reply drew more pressure, then a flood of sign-in prompts that night." and "The client list sat in a personal inbox outside the firm." (first sentences, word for word in the trim).
- v7: the defend half is the Raise a concern form then the messages (`defendIntro`).
- v9a: six items in the set. Hana's call: caller ID, line 1 as quoted, line 2 below the crop (wide y 342).
- End line: the bark text matches the scenario (lines 1010 and 1080).
- Titles: "Insider risk", "Quayholt Insurance".
- No em or en dashes in the VO; UK spelling; total 72.1 s re-added from the shot lengths (the `topic` split keeps 4.1 s); hook 4.2 s, close 5.5 s.

## Rubric (trailer subset, 0 to 3)

| Item | Score | Evidence |
|---|---|---|
| F1 hook | 2 | "This week someone's leaving and there's a bit of talk going round." sets a situation and a little gossip; a question, not a lesson. Not a strong line, but the best cached one. |
| F4 living world | 3 | Anjali in portrait, Darren off to the cooler (`topic`, if the take holds), Niamh walking up to ask for a login at the end, a bark before it in the same run. |
| O1 attacker's goal and method shown | 2 | The offer card ("remote access ... 25% of what we make") and its outcome ("more pressure, then a flood of sign-in prompts that night") show an outsider's goal and next step. Not played as the attacker (consequence-first). |
| O2 attacker reasoning visible | 1 | Why the offer targets staff is on the card ("people at firms like yours") but no VO line draws it out; the leaver's favour and Niamh's ask are colleagues, not attackers. |
| O4 tone | 3 | No fear or blame: the rumour and Samira beats are kept off screen, the "not here to catch anyone" line is cropped only because it is reassurance, and the end is an awkward everyday ask. m4 is the one nudge towards suspicion. |
| A1 accuracy | 2 | Every VO claim matches the scenario; two picture descriptions do not match the takes (M1 list order, m1 flip). 3 once fixed. |
| A2 safe takeaway | 3 | No tells, no verdict states, no conclusions chips; the advice paragraph is hidden. |
| P1 see it play out | 2 | The montage and Niamh's ask show choices playing out in the world; no application by the learner is shown. |

Trailer subset: 18 of 24.

## Sell

The trailer sells a believable week: an offer, a leaver's favour, where they went, then the learner raising a concern and sorting messages, ending on a colleague asking for a login with no answer given. That ending is strong because the viewer now knows the pattern. The weakest part is the middle third, where three panel shots in a row (flip, blue card, concern) carry little motion; the Darren cutaway helps at the start but not there. A future round could test moving it to sit between `concern` and `list` if `topic` reads better with the Brief panel alone.
