# ca18 Password guessing at scale: trailer scout (desk scout, 23 Nov 2026)

Read from the scenario, ink, engine source, the TTS cache (ffprobe and silencedetect, -35 dB) and the ca09 take scripts. **No server was run and nothing was recorded**, so every "verified" below means read from code or the cache, not seen in a browser. The take stage must dry-run each entry state. Model: `docs/video/scout/ca09_scout.md` (same password guesser) and the ca10 and ca14 scripts (Merrin & Sallow room, step-away end).

## Headline

- Folder: `scenarios/ca18_credential_attacks_at_scale` (the full episode; `_defend` is the defend-only twin and is not used). Company Merrin & Sallow Architects (accent `#8a5a2b`), one room, `training_room`, one kiosk (`training_kiosk`, episode `e18_credential_attacks_at_scale`). Player starts (6, 6.2) as `female_office_worker_v2` (no hooded sprite). Cast in the room: Ama Owusu (host, `ama_owusu`, at 5.5, 3.8), Lorna Easton (`kit_lorna_easton`), Delphine Arvanitis (`kit_delphine_arvanitis`), sofa, Lorna's PC.
- Strip stages: `brief`, `osint`, `guess` (label Campaign), `flip` (label Your inbox), `defend`, `debrief`. State global `episode_e18_credential_attacks_at_scale_state`.
- **The attack is the org-scale password guesser, `mode: spray`**: panels "Who works here" (roster names, address pattern, built addresses), "Words from the practice's own website" (three slot words plus the season and year), "One password, every account" (four passes, each "tried once on every account", then "N of M accounts opened"), "Passwords from somewhere else" (masked stuffing rows), and "Three random words" (the passphrase answer). The scale read is the USP shot.
- **The outline's end line is not used** (see "Lines not to use"). The recommended end is Lorna's first bark after Look up, cached since the D278 retake.
- Cache: `tts_cache/ca18_credential_attacks_at_scale/` has 55 clips. Every line used below has a sidecar and mp3 there. Cache-key note: the Ama flip line's sidecar text has a colon ("...arriving: some real...") where the ink has a comma; the ca09 scout found the key ignores punctuation, so it should hit. Confirm with a real `/tts` request in the dry run.

## Part A: voiced lines (clip lengths by ffprobe; add 0.2 to 0.4 s in game)

### Ama Owusu (`ama_owusu`, full-episode ink, hub resting point)

| ID | Text | Len | Speech and pauses | When | Use |
|---|---|---|---|---|---|
| A1 | Welcome to the Merrin & Sallow exercise. I look after security for the practice. | 5.38 s | 0.34 to 5.06, pause 2.92 to 3.19 | first talk, fresh game, line 1 | plays first, cut |
| A2 | Attackers rarely pick one person and crack them. | 3.41 s | 0.29 to 3.07 | same talk, line 2 | **hook** |
| A3 | They scoop up everyone's names and a few words off the website, then try one password across the lot, so nothing locks. | 8.02 s | 0.28 to 7.60 | line 3 | spare, too long and says the attack in full |
| A4 | See how little it took: a staff list, a few words off the website, one password tried across everyone. | 7.18 s | 0.35 to 6.83, pauses 1.63 to 2.02, 2.91 to 3.08, 4.62 to 4.88 | talk after `guess_e18_landed`, line 1 | plays first, cut |
| A5 | A stolen list from another site opened a few more. The accounts that opened were the predictable ones. | 6.17 s | 0.16 to 6.12, pauses 2.96 to 3.36, 4.60 to 4.93 | same talk, line 2 | cut |
| A6 | Now it's your seat, and the alerts are arriving, some real, some fakes meant to finish the job. | 5.93 s | 0.23 to 5.58, pauses 2.83 to 3.08, 3.74 to 3.92 | same talk, line 3 | **flip line** |

Off (grades, verdicts, answers): "You read the page before you signed in...", "You stopped the one that mattered...", "The alert looked like us and you were trying to protect...", "You didn't trust that fake lockout alert...", "That lockout alert dressed as our own IT...", "Picture that password on the fake page...", the post-defend recap ("That's both sides done. What breaks the spray is a different password for every account...", "A unique password per account in a manager...") and "Your own seat now... never type a password to unlock or check anything" (advisory). "Lorna, this morning's attackers have already guessed your new password..." is a consequence of a pick (off).

### Lorna Easton (`kit_lorna_easton`, kit ink, `ca18` and `ca18_reset` knots)

| ID | Text | Len | Speech | When | Use |
|---|---|---|---|---|---|
| L1 | Fenlow have made me reset my password after this morning. | 3.58 s | 0.21 to 3.20 (measured 0.25 to 3.20) | bark about 1.5 s after Look up plus an unmeasured game lead, needs `kit_quiet` true; the shot is mark-driven | **end line** |
| L2 | Kept my old one, changed the season. One less thing to remember. That'll do, won't it? | 5.45 s | 0.17 to 5.40, pauses 1.03 to 1.26, 2.15 to 2.56, 3.86 to 4.25, 5.05 | bark 7.0 s after Look up (5.5 s after the "there" flag), same NPC so it queues behind L1 | **off, outline line** (below) |
| ambient | "Reception's been non-stop." 2.81 s (speech 0.29 to 2.43); "Kettle's on if you fancy one."; "Nice bit of quiet." | | | chatter, needs `kit_quiet` false | spare hook ambience |

Off: "Smart. A lockout warning is no reason to type your password anywhere." and "The provider's resetting logins after sign-ins from somewhere odd." (branch lines), "Ah, makes sense. Three random words it is." and "Lovely. That's saved." (answers to the choice).

### Delphine Arvanitis (`kit_delphine_arvanitis`)

Chatter "Phone's not stopped ringing." (2.09 s, speech 0.25 to 1.80), "Three deliveries already.", "Visitor book's filling up." (needs `kit_quiet` false). Spare hook over the room wide; random speaker, mild. Her ca18 branch lines ("We've all been asked to reset our logins today. Something got reused.", "An 'account locked' warning goes out wide...") are off (the first names the reuse, the second is the fake lockout's tell).

## Part B: set pieces and minigames

| # | Set piece | Entry state | On screen risk | Verified |
|---|---|---|---|---|
| S1 | Ama's welcome (hook) | fresh game (`tools/playtest/new-game.sh ca18_credential_attacks_at_scale`), Skip tutorial, close Brief, walk to Ama, interact; A1 plays, Continue, A2 | portrait view, no tell. Cut before A3 | from ink |
| S2 | Kiosk Brief and strip | `__test.interact('training_kiosk')` (first interact can be swallowed, retry up to 3) | none | from source |
| S3 | OSINT browser | after Start, button "Open the browser". Sites: Merrin & Sallow (People, Contact, Projects, Home, Visit) and Friendface | public facts only; five facts: team list, email pattern, projects, strapline, street. Click a block to note it | from scenario `osint` |
| S4 | Spray console | after the browser is closed with the facts noted (all five give the full run), button "Open the guesser" | **hide `[data-panel=passphrase]`** (the answer: harbour ladder crimson) and **`.epr-gs-live`** (echoes each tried guess). Stuffing rows are masked ("......"), safe. All candidates are made up (Calderbank2026, DesignThatLasts1, Verrow!, Autumn2026); none is a real-world password | from `password-guesser-model.js`; rows are `.epr-gs-row[data-state]`, buttons `.epr-gs-step`, `.epr-gs-all`, `.epr-gs-off` |
| S5 | The flip | "Switch the rig off" (needs every row stepped, including the hidden passphrase row) closes the guesser onto the flip, heading "Now it's your inbox." | the body carries `flipDefenderLine` and the two aftermath cards whose notes explain genuine versus fake alerts: frame on heading and strip only | from `strings`; not seen |
| S6 | Ama after the landing | `--set guess_e18_landed=true` on a fresh game; talk; A4, A5 (Continue each), then A6 | portrait, no tell | from ink |
| S7 | Defend triage (six alerts) | `--set 'episode_e18_credential_attacks_at_scale_state={"done":["brief","osint","guess","flip"]}' --set guess_e18_landed=true`; kiosk opens on Defend | list: six unread rows, no verdict before a pick. **Hide**: the brief paragraph (it says never type a password to unlock), the "Fakes stopped for the team" badge, flag chips. Open a **genuine** card only: the 08:54 Fenlow Managed IT alert (`e18_lockout_genuine`, "Some accounts were briefly locked this morning"), which introduces "Fenlow" before Lorna's L1. Sentence 1 shares a paragraph with the advisory, and a crop cannot split a paragraph, so frame on From, subject and "Hello," only. Keep the cursor off the 09:06 row (the key fake); the 09:14 sign-in card is not used | from `triageSets`; list wording to confirm |
| S8 | Step-away and Lorna | `--set 'episode_e18_credential_attacks_at_scale_state={"done":["brief","osint","guess","flip","defend"]}' --set episode_e18_credential_attacks_at_scale_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set episode_e18_credential_attacks_at_scale_defend_percent=60 --set kit_quiet=true`; open kiosk, press Look up | keep `_defend_percent` under 85 (85 sets `kit_caught`). `--set` does not fire events, hence `kit_quiet=true` by hand. Never talk to Lorna (the choice and the 45 s silent timer follow) | from scenario mappings; not seen |
| S9 | Debrief and verdict screens | | **off** (grades, percentages, reasons) | not used |

Bark timing (from the mappings): Look up sets `kit_ca18_out`; L1 plays 1.5 s later; `kit_ca18_there` also fires at 1.5 s; L2 plays 5.5 s after that, so about 7.0 s after Look up. Both are Lorna, so L2 queues behind L1 and does not overlap (one NPC's barks queue); the take ends before it. Delphine is suspended (needs "suspend") and walks to (4.5, 4.5) at +1.0 s.

## Spoiler judgements

- **Show:** the People and Contact pages with a fact noted; the spray console's roster, word list and passes ticking, and "N of M accounts opened"; the flip heading and strip; the six-alert list; the genuine 08:54 Fenlow card framed on From, subject and "Hello,"; the Look up panel; Lorna's bark.
- **Off:** the passphrase panel, the live log, the flip body, the triage brief, the flag chips, any card after a verdict, the verdict screens, the debrief, every grade line, the fake lockout card (it prints the look-alike address), the fake breach checker, Lorna's L2.

## Lines not to use, with the reason

- **Outline end line L2** "Kept my old one, changed the season. One less thing to remember. That'll do, won't it?": it sounds like permission to take a shortcut ("That'll do, won't it?"), and "changed the season" echoes the spray's own on-screen "Autumn2026" pass word for word, so the viewer reads it as the answer. Use L1 instead.
- A6 is the only Ama line that says "fakes"; it says "some real, some fakes" and names no tell, so it stays.

## 9:16 and 1:1 (narrowed-panel takes)

`max-width: 560px` on the panel root, one extra run each: the spray console (status words sit at the right edge of each row), the OSINT browser (People and Contact notes), the triage list and the Fenlow card, the Look up panel (`t05b_lorna_reset_narrow`), and the flip heading and strip (mark `flip-up-narrow` inside `t02b`). Ama portrait and the Lorna room shot are cx checks (player in the upper two thirds).

## Hazards

- Fresh game for every take; a used game reopens on its saved stage.
- Throttle with `window.__test.throttleFps(20)`; never `fixedStep=false`.
- Lorna's bark needs the player in earshot; the room is one screen.
- Never type or show a real-looking password; the guess strings stay as authored.
- Ink compile and `kit_ca18_t_tail` (45 s after the ask) are not reached: nothing is clicked in the chat after L1.

## Round 1 review changes (24 Nov)

The `alerts` card is now the genuine 08:54 Fenlow card (from, subject and "Hello,"), not the 09:14 sign-in card; A6 ends at 5.58 s; A2 ends at 3.06 s; the Lorna shot is mark-driven (`press`, `l1_start`) and `t05b_lorna_reset_narrow` is added. See the script's "Changes from review (round 1)".
