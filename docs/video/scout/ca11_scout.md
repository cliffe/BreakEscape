# ca11 Misdirected data: trailer scout (DESK SCOUT, 23 Nov 2026)

Consequence-first episode at Carrholme Services (CS, tier O). Desk scout only: read from `scenarios/ca11_misdirected_data/` (scenario.json.erb, ink/tomasz_wisniewski.ink), `scenarios/_office_kit/ink/yusuf_demir_ambient.ink`, `planning_notes/phishing_and_social_engineering/awareness/e11/` (mistake.json, defend.json) and the 16 clips in `tts_cache/ca11_misdirected_data/` (lengths from ffprobe, silences from ffmpeg silencedetect at -35 dB, d 0.15 s). No server was started, no take recorded, no live `/tts` test, nothing committed. Every "entry state" below is derived from the scenario and the ca15 take scripts and is **unverified until a dry run**.

Model: ca15 (consequence-first, same kiosk episode runner). Differences from ca15: five-step strip is the same (Brief, Choices, Where it led, Defend, Debrief) but there is **no Swap Shop**, so the Defend step opens straight on the inbox; the room is a single room (the Training Room) with two NPCs only, Tomasz (host, person chat) and Yusuf (kit NPC, barks); there is no ambient chatter pool for Yusuf, so no pre-Start room line exists.

## Headline

- Cast lines usable: Yusuf's talk "Handovers go out fast when it's busy." (first sentence; the hook after round 1 review), his step-away bark (first two sentences), and a spare, the welcome (sentence 1 only, "Morning. I'm Yusuf, I keep an eye on security here.", whose cut sat inside "Grab" when taken after sentence 2). Tomasz's lines are host advice or grades and stay off.
- Best end line: Yusuf, "This printout isn't ours. It's a care home's resident list, with health notes on it." (cut at sentence 2; sentence 3 "Someone sent it here by mistake." repeats the episode's tell wording and is dropped). The printout appears on the copier when he walks to it.
- Strongest picture: the "Six months later" montage (a stranger waiting outside the school after the friendly call; three families complaining after a contact export). It is the attacker's use of leaked data in plain terms, with no attacker to play.
- No uncached cast line is needed for the 71.7 s cut.

## Set pieces

| # | Set piece | Entry state (to verify in the dry run) | Notes |
|---|---|---|---|
| S1 | Training Room wide, Yusuf at (3, 7), Tomasz at (5.5, 3.8), copier at the back wall, water cooler right | fresh game, `BE_SPRITE=female_office_worker_v2`, `--hide-hud --zoom-step 1`, Skip tutorial, close Brief | Yusuf's thirst need (initial 65, urgent at 50, 30 per minute) sends him to the cooler after about 30 s, so he may not be at his chair for a late take. No chatter pool, so no bubble in the room wide. |
| S2 | Yusuf welcome, person chat | S1, walk to `kit_yusuf_demir`, talk | `start` knot while `kit_defend_done` is false: "Morning. I'm Yusuf, I keep an eye on security here. Grab a water if you need one." Close the chat before the `bye` choice shows (ca03 `closeBeforeMenu` pattern). |
| S3 | Kiosk Brief | `__test.interact('training_kiosk')` | Brief text is the scenario brief; not used. |
| S4 | Choices (four everyday choices, unscored, no marks before Next) | S3, Start, the "Make the choices" button (ca15 label; verify) | Beats in order: caller_bernadette (Carol asks which school Bernadette is at and when she finishes), overtime_sheet (the Sam list with an "External recipient" chip described in the card text), marketing_export (Martin, Sales Director, wants the family contacts exported), redaction_send (Mr Hale's incident report). Options are elements, not buttons: click by text (ca15 `pressEl`). The safe option's position varies (first in caller and redaction, second in overtime and marketing), so pick by label text, never by position. Labels for the unsafe picks: "Tell her which school Bernadette is at today and when she finishes"; "Choose Sam Whitlow from the top of the list and send the sheet"; "Export the family contacts and pass the file to Martin"; "Send Mr Hale the one-page report in full". |
| S5 | "Six months later" montage (flipHeading) | after the fourth pick, "See where they led" (ca15 label) | One line per beat for the option picked. With all four unsafe picks the lines are the "went wrong" ones (below). Hide the verdict labels and the green/amber borders as in ca15 `t03_choices_reveal` (`hideText /^Your call/`, neutral borders); confirm in the dry run whether ca11 shows the same labels. The overtime card's line ends "That is the first email waiting in today's inbox", which points at an inbox item before the viewer sees the inbox: keep that card out of punch-ins. |
| S6 | Flip to Defend: the defend intro panel | S5, Continue | Strip ticks to Defend. The panel body (`strings.defendIntro`) states the rule (anything about personal data goes to the DPO the same day): that is advice, so frame the heading and strip only, body out of frame. |
| S7 | Desk inbox, six rows, list then a genuine card | `--set episode_e11_misdirected_data_state={"done":["brief","mistake","flip"]}`, open kiosk, the inbox button (ca15 "Open the inbox"; verify), Start | Rows by time: 08:52 Sam Whitlow "I think this wasn't meant for me?" (the key item, `e11_wrong_sam_breach`, sets `kit_key_caught`), 09:20 call "DC Rowley, North Pennine Police", 09:35 Carrholme Payroll "Confirm your bank and National Insurance details...", 10:04 Gareth Hale "Mum's cardigan is missing AGAIN", 10:48 Wychbourne Court Laundry "This week's laundry list" (care summary attached), 11:15 Sam Whitlow "Mrs Hale's son has a new mobile, and good news" (the only genuine one). Header "0 of 6 sorted" and the "Items passed on for the team: 0" badge (hide the badge). Open the 11:15 card (genuine, no tell): From, subject, body readable; the four verb buttons are in the panel but never named and never pressed. The 08:52 row's subject is the nearest thing to a tell in the list: it is on the list screen only, never opened or spoken. |
| S8 | Step-away panel | S7 state then `--set` list below, open kiosk | Text from `strings.stepAway`: "Look up from the kiosk to see how a case like this plays out here. It takes a few seconds, and your place is saved." Buttons Look up / Carry on (ca15 labels; verify). Shot stops before the click. |
| S9 | Room beat: Yusuf walks to the copier tray, the printout appears, his bark | S8 then press Look up (a second run, not the same capture as the panel shot) | Chain from the scenario: `episode_step_away` (needs `kit_defend_done`) sets `kit_ca11_out`; the printout object is revealed on `kit_ca11_out`; Yusuf's needs suspend, 1 s later he is sent to (3.5, 3.7); on `npc_arrived` he barks, **only if `kit_quiet` is true**; 1.5 s after arrival he moves to (5, 4.2); 5 s after arrival the second bark is queued ("You'll want this today. In the wrong hands it's a shortlist of vulnerable people, with their addresses, handed over for free."). Same NPC, so bark 2 queues behind bark 1 and starts about 8.6 s after bark 1 starts; the shot ends 6.1 s after bark 1 starts, so it never reaches bark 2. The timer `kit_ca11_t_done` (14 s after out) only resumes his needs. |
| S10 | Debrief, Tomasz sign-off, conclusion screen | after the inbox | Off by design (verdicts, grades, host advice). |

`--set` seeds (ca15 pattern; `--set` does not fire events):
- Step-away: `--set episode_e11_misdirected_data_state={"done":["brief","mistake","flip","defend"]} --set episode_e11_misdirected_data_defend_complete=true --set kit_defend_done=true --set kit_attack_done=true --set kit_quiet=true --set episode_e11_misdirected_data_defend_percent=60`. `kit_quiet=true` is needed here (Yusuf's bark and the printout beat check it, unlike ca15's Fatima); it is set in play by the first kiosk state change and cleared by the debrief. Keep `_defend_percent` under 85 (85 and over sets `kit_caught`).
- Inbox: `--set episode_e11_misdirected_data_state={"done":["brief","mistake","flip"]}`.
- Spare hook (Yusuf "Handovers..."): `--set kit_defend_done=true` only (talk to Yusuf, `kit_key_caught` false, `kit_ep` is "ca11" by default).
- A game that has been through the kiosk saves its stage: fresh game per run.

## Cached lines usable (all in `tts_cache/ca11_misdirected_data/`, sidecar `scenario` ca11_misdirected_data)

| Line | NPC | Clip | Length | Speech windows (silencedetect) | Use |
|---|---|---|---|---|---|
| "Morning. I'm Yusuf, I keep an eye on security here. Grab a water if you need one." | kit_yusuf_demir (7cdb7dcc) | mp3 | 5.736 s | "Morning." 0.23 to 1.72; sentence 2 2.04 to 3.81; sentence 3 3.97 to 5.36 | **Hook**: cut after sentence 2 (3.81 s), out = audio start + 3.81 + 0.2. Names Yusuf. |
| "This printout isn't ours. It's a care home's resident list, with health notes on it. Someone sent it here by mistake." | kit_yusuf_demir (c246dc75) | mp3 | 8.616 s | s1 0.27 to 1.97; s2 2.62 to 5.86 (a 0.17 s pause at 4.61 after "list,"); s3 6.70 to 8.28 | **End line**: cut after sentence 2 (5.86 s), out = audio start + 5.86 + 0.2. |
| "Handovers go out fast when it's busy. One wrong recipient and resident details land where they shouldn't." | kit_yusuf_demir (5c66bd4a) | mp3 | 6.744 s | s1 0.27 to 2.44; s2 2.98 to 6.38 | Spare hook: sentence 1 only (cut 0.3 + 2.44 + 0.2 = 2.9 s). It is the not-caught branch of a person chat after the defend set; sentence 1 alone is neutral. |
| "You'll want this today. In the wrong hands it's a shortlist of vulnerable people, with their addresses, handed over for free." | kit_yusuf_demir (3cc8c649) | mp3 | 7.656 s | s1 0.28 to 1.32; s2 1.90 to 7.27 | Bark 2: not used (queued behind bark 1; attacker-view line, a possible spare for a longer end if the owner wants it, +5.3 s). |
| "Tomasz Wiśniewski, data protection. I do a drop-in at this desk once a month, so I'm at the next chair if you need me." | tomasz_wisniewski (f7638b6d) | mp3 | 8.448 s | s1 0.32 to 2.73; s2 3.29 to 5.63; s3 5.97 to 8.11 | Off: a host intro with no moment in it. |

Off by rule (grades, host advice or praise naming the item): "Good catch on Sam's email. Staff overtime and health notes had already gone outside Carrholme..." (Yusuf, `kit_key_caught`), "Well spotted. Once it's in the wrong inbox you can't call it back..." (Yusuf react), "One wrong recipient and people's details are out, and that's a breach to report..." (Yusuf react), Tomasz's "You brought the misdirected one to me the same day...", "A misdirected item means a quiet word with me that day, never a quiet delete, and you came.", "Sent astray, these details put the people in them at a stranger's reach...", "To anyone who collects data like this...", "That's the desk sorted. Anything about someone's personal data comes to the DPO the same day.", "And nobody here is ever in trouble for reporting, including their own slip." (reads as permission to slip), "Clear the queue the way you would on any morning. If something goes wrong, the only wrong move is to keep it to yourself." (host advice), "Any time."

## Montage lines (game text on screen; unsafe picks)

- caller_bernadette / give_details: "Two weeks on, a stranger was waiting for Bernadette outside her school. The birthday-surprise call was how he learned where a lone worker would be, and when."
- overtime_sheet / send_wrong_sam: "The overtime sheet, with the back-injury and union-meeting notes, sat in a care home manager's inbox until he wrote in to ask whether it was meant for him. That is the first email waiting in today's inbox. ..." (keep out of punch-ins)
- marketing_export / export_list: "A month on, three families complained and one wrote to the ICO, the UK's data protection regulator. The contacts had been given to sort out a lost cardigan, not to hear about offers."
- redaction_send / send_as_is: "Mr Hale opened the report and read another resident's continence-care note and a driver's mobile number. One mistake, two more people's data exposed." (sensitive detail; not a punch-in)

## Spoiler judgement per shot

- Show: S2 talk "Handovers go out fast when it's busy." (sentence 1; the bar cropped because it prints sentence 2, needs `--set kit_defend_done=true`); S4 card 1 (and card 3) before Next with the unsafe pick chosen and no marks; S5 overview and the caller and export lines with labels hidden; S6 heading and strip; S7 list before any verdict and the genuine 11:15 card; S8 panel before the click; S9 Yusuf at or on the way to the tray, the printout already on it (it is revealed at the press), bark sentences 1 and 2 burned with the game's bubble hidden in every format.
- Off screen: any "Your call" label and green/amber borders; the safe options picked; the defend intro body (it states the rule); the verb buttons named or pressed; the 08:52, 09:20, 09:35, 10:04 and 10:48 cards opened (each carries its tell or its answer); the Wychbourne attachment label; "0 of 6 sorted" is fine, the "Items passed on" badge is hidden; the debrief and Tomasz's lines; bark 2; the 10:48 row opened (its attachment name is never shown).
- Pattern level: the lure is a friendly caller, a contact export request and an autocomplete choice. No lifted template risk.

## Avatar

No change needed: the scenario names `female_office_worker_v2` itself. Check the player sprite in the take (ca15 scout saw the hooded sprite in a headless run: `checkSprite` throws if it is not `female_office_worker_v2`).

## Hazards for the takes

- Bark queue: Yusuf only; bark 2 never reaches the shot. No second NPC barks in this room (Tomasz has no barks), so no cross-NPC overlap.
- The printout beat needs `kit_quiet` true (seed above) and Yusuf not mid-walk to the cooler: mark the real bark audio start and retake until Yusuf is at his chair or already walking from it.
- Do not click in the chat or leave the panels idle past the timers; fresh game per run.
- 9:16 and 1:1: the choice card, the montage page, the inbox list and card and the step-away panel are all minigame panels about 700 px wide: plan a narrowed-panel run for each (CSS `max-width: 560px`, as ca10 plans), then the crops show them full width. The room shots (hook portrait, printout beat) are a cx check: Yusuf, the copier and the printout sit left of centre (x 3 to 5 of the room), so the crop sits left and the game's bar must fall inside 607 px.

## Not verified (needs the dry run)

Kiosk button labels on ca11 ("Make the choices", "See where they led", "Open the inbox", "Look up"), the tab names, the montage layout and label text, Yusuf's real arrival time and bark start after Look up, and whether the 08:52 row sorts above the genuine row in the list. Nothing here blocks a take: every item is a label or a timing the dry run settles.

## Round 1 review changes (24 Nov)

Hook is now `5c66bd4a` sentence 1 (speech 0.28 to 2.41 s, silencedetect at -30 and -25 dB; sentence 2 starts 2.98 s, 3.03 s in the defend clip; out = audio start plus 2.61 s). The welcome (S2) is no longer used. The office shot opens at the later of the `press` and bark start minus 1.8 s, with the bubble hidden and captions burned. Narrowed takes added: `t07c_stepaway_panel_narrow`, and `t03b` ends on Continue. See the script's "Changes from review (round 1)".
