# ca12 Visitors and tailgating: 45 s trailer shot list (pilot)

For the takes stage. Beats follow `docs/video/recipes/course-trailer.md`; the evidence is in `docs/video/scout/ca12_scout.md`; the look is `docs/video/CA_THEME_TWO_SEATS.md`. Line ids (D1, C1, L1, A1) are the scout's.

Every take: a fresh game from `PLAYTEST_PORT=<port> tools/playtest/new-game.sh ca12_visitor_tailgater`, Skip tutorial, close the Mission Brief, `--hide-hud --zoom-step 1`, 30 fps. Cut in only after the NPC's portrait has replaced the player's (the "playtest" save name). Day lighting (`defaultMode: on`).

**Avatar.** The player is the hooded hacker (`female_hacker_hood_v2`) by default, which reads as SAFETYNET. Recommended: one BE_SPRITE window for an office-worker avatar on t02, t06, t07 and t08 (an avatar the cast does not already use). The courier costume covers t04 and t05. If no window is agreed, frame those shots so the player is small or off camera.

**Reuse.** "MS" marks a take that also serves ca04, ca14 and ca18 (the same Merrin & Sallow rooms and kit staff).

| Take | Beat | Seat | Entry state | Action and marks | Must prove | Reuse |
|---|---|---|---|---|---|---|
| t01_studio_wide | 1 hook | full | fresh game, player off camera or still at the doorway | 8 s of staff on their needs; mark A1 (Thandiwe, sofa line) start and end; a spare run for A2 | lit studio, three staff moving, no jitter, bubble readable | **MS** (establishing shot for all four) |
| t02_two_rooms | 1 or 8 | full | player at the studio-lobby doorway | 4 s hold showing the studio and Delphine's desk together; then a straight walk of 2 s toward the lobby | both seats in one frame | **MS** (ca04 PA desk, ca14, ca18) |
| t03_kiosk_strip | 2, 6 | defender strip | fresh game, interact `training_kiosk` (retry up to 3 times); second pass: any game past the call, panel "Take the calls" (the tick lands on Continue) | mark: kiosk open; Start; then later in the run the strip at "4 The call"; a second pass after the call for the tick to "5 Defend" | step strip in the brown company tab, no scope text cropped mid-line | **MS** (strip per company) |
| t04_osint_note | 3 | attacker | kiosk, Start, button `Open the browser` (about 10 s from the kiosk) | navy browser window: Friendface tab, the Catherine Merrin link, **Pin** on the first post; marks at page open, click, "noted" | the fact going to the notes; no worked lure | MS: ca14's posts-mined beat can reuse the browser frame |
| t05_pretext_card | 4 | attacker | after t04 (same run): close the browser, `Prepare the call`; Recipient is a custom list (click the `Catherine Merrin` span) then `Approach` | the card filling: "Your aim" heading, the held fact, the line choices; marks per change | "Use only details you have found" readable | ca04, ca18 (pattern only) |
| t06_the_call | 5 | attacker | after t05: `Approach` teleports to the lobby and opens the call (no walk, no courier sprite, black ground) | D3, then open_parcel (D4) or name_drop_partner (D2), then the buzz ask, D1; mark the meter moving and D1 start and end; door unlock | meter moving, D1 clean, technique chip at pattern level, crop above the two explanation lines under the meter (they spell out the technique), no tells panel | ca03 for the meter (other company) |
| t07_flip | 6 | join | after t06: end the call with Done, then talk to Lorna (L1 untested in play), then the kiosk (flip screen, strip on step 4) | L1 start and end; then `Continue` ticks the strip to Defend on a clean "Take the calls" panel; heading only from the flip screen | the tick and the heading; crop the picked-out lines | **MS** (L1 is ca12-only; the tick is reusable) |
| t08_triage | 7 | defender | after t07: `Open the queue`, then `Start` on the navy Brief screen (about 10 s) | the six-row list; open one visitor card; stop before any verdict | mixed visitor cards; no result or tells | ca04 (PA inbox is different: frame only) |
| t09_step_away | 8 | full | after the defend set (`--set` verified: `episode_e12_visitor_tailgater_state={"done":["brief","osint","write","flip","defend"]}` plus `episode_e12_visitor_tailgater_defend_complete=true`, `kit_defend_done=true`, `kit_attack_done=true`, `episode_e12_visitor_tailgater_defend_percent=100`; `kit_defend_done` alone is not enough) | the panel, Look up; Thandiwe leaves her screen (A1); Camila stands by the kiosk and says C1 about 46 s after Look up (A1 at about 5 s); **stop before the door choice** | open screen visible, Camila's walk straight, C1 clean | **MS** (the room beat machinery and Thandiwe's desk) |
| t10_ambient_spares | 1, 8 spares | full | fresh game | Julian A4 and A5 (kettle trip), Thandiwe A3 | spare ambient lines and the coffee trip | **MS** |

The end line (beat 10) comes from t09 (C1); the attack payoff (beat 5) from t06 (D1).

## Spoiler cuts

- t06: no tells panel at the end of the call, no tell sentences ("Recipient. ..."), no outcome label.
- t07: crop below the flip heading; "the lines picked out below" mark the courier's tells for the defend set.
- t08: nothing after a verdict button is pressed.
- t09: cut before the door and screen choice menu; never Lorna's recap branch lines.
- No debrief frames at all.

## Capture window

Ten takes, most of them one continuous run (t03 to t08 can be one long take marked per beat, with t04 to t07 also as separate re-takes). Estimate, with setup, checks and one re-take each for t06 and t09: **about 3 hours**, of which the BE_SPRITE avatar window covers about 1.5 hours (t02, t07, t08, t09). With no avatar change, about 2.5 hours and no window needed.
