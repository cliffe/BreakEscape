# m05 Insider Trading: design re-review 1 (pass 4)

Reviewer: fresh adversarial re-review, 2026-10-02. Read-only apart from this file. Line numbers are for the working tree on 2026-10-02 (uncommitted pass-4 changes).

## 1. Checks run

Static only; no browser test.

- `ruby scripts/validate_scenario.rb …/scenario.json.erb`: exit 0, no INVALID, no unknown fields, ink valid, geometry and doors OK. Three co-fire warnings, all known and intended (flag-3 pair, the two lockpicking-guide `object_interacted` mappings plus the VM launcher, the four Torres-close nags guarded by `flags_nag_sent`). The validator regenerates `dungeon_graph.*` as a side effect: Puzzle 39/41, critical path unchanged.
- `python3 scripts/check_door_alignment.py`: 9/9 OK.
- `node scripts/ink_runtime_check/reopencheck.mjs … m05_insider_trading`: 0 problems (HaX 1800 reopens, Recruiter 1800, Patricia's phone 1800).
- `tagdiff.mjs`: every removal I checked is a move (old `name_to_hax` tags now in `hax_name_torres`; old `stop_upload` tail now in `upload_stopped`). Nothing load-bearing lost.
- `dialoguelint.mjs`, compared against HEAD: three new issues from this pass, all minor (§5 m9). The 77 `you-after-choice` checks and the older line-length errors belong to the dialogue stage.
- Sprites: every `spriteSheet`, talk, viseme and headshot file exists. Within m05 no two on-screen characters share a sheet (the two `female_spy_v2` NPCs are both HaX, in separate cutscenes; Netherton and Nightshade are hidden co-speakers). Cross-mission reuse is normal for generic staff (Owen's `male_nerd_v2` is also m01's Kevin Park and m08's Cipher; Torres' `male_telecom_v2` is m07's Thomas Park). Not a clash; noted only because Kevin is also an IT admin.

## 2. The whodunnit, worked as a detective

**Does the evidence clear Halloran?** Yes, fairly. The badge log (erb:71) shows spare #4471 on the server hallway four nights, each six minutes after #4408 D. TORRES at the main entrance, and her primary #4462 never in after hours. Nobody else enters except Owen on the Sunday, which his pencilled note explains. So whoever carried the spare came in on Torres' badge. The lanyard (erb, research_lab `zurich_lanyard`) and her vetting file put her in Zurich 21–25 Sep, covering the first night; the other three nights are covered by her primary never swiping in. Her file also shows the TalentStack approach declared the next morning. The dates check out against the 2026 calendar, and the timeline holds if the mission night is Wed 7 Oct (log "to Tue 6 Oct", incident log "2 weeks ago" = 23 Sep, debrief "Thursday morning").

**Does it convict Torres?** Yes: the log pattern, Halloran's "David, mostly" in her lab where the spare hangs (`m05_npc_dr_halloran.ink:202-205`), undeclared debt in his vetting file, the leaflet's "THE DEBT" in small neat blue capitals matching the journal, and his name on the manifest and schedule. Fair play: every link is findable and none needs outside knowledge.

**Remaining early pointers.**
- **Vetting files on the first visit (major, M1).** Patricia's "I need your help" menu offers the files from the first conversation (`m05_npc_patricia_morgan.ink:262-270`), and the aim-2 task "Ask Patricia for the vetting files" (erb:290) points at it. Reading "Vetting Aftercare File: D. Torres" (change of circumstances NOT DECLARED, three new loans) sets `found_vetting_file`, which latches `torres_suspected` (erb:899-905) and opens "Find Out Why" with "Get a keycard for Torres' office". A player can have Torres flagged in the to-do list two minutes in, before the badge log or the red herring has done anything.
- **Owen KO (minor, m1).** His dropped item is named "Torres Office Keycard" (erb:1250), and HaX's relay pushes "Torres Office Card (relayed copy)" (erb:747-749) and says "the only print enrolled is Torres'" (`m05_phone_agent_0x99.ink:451,459`), all regardless of `torres_suspected`.
- **The vault (minor, m2).** Owen at the password handover: "David's thumb and nobody else's" (`m05_npc_owen_gallagher.ink:255`); HaX's general advice "The vault takes Torres' print" fires on `vault_reader_seen` alone (`m05_phone_agent_0x99.ink:653-654`). Both can come before suspicion. Mild: a crypto lead holding the vault print is innocent on its face, but it's a third nudge.
- Behaviour lines (Owen's hallway sighting, Lisa's "David Torres especially", Patricia's "Torres has been distracted") are fair clues, not pointers. The briefing tells the player to watch for exactly these.

**Can the naming menu be brute-forced?** Partly. Once the log is read, the menu offers exactly two names (`m05_npc_patricia_morgan.ink:307-310`; same on the phone, :128-131, and HaX, :348-351). "David Torres" never costs anything and, on the log alone, the ink supplies the deduction for the player: `You: His badge comes in the front door six minutes before Halloran's spare…` (:347). So a player who picks the other name on the sheet without having read the front-door lines is told the answer and rewarded. Halloran costs only if picked first without the alibi. That makes the expected cost of guessing half a suspension, and the reasoning optional (major, M2).

**`torres_suspected` gating** is sound apart from M1: it is set by motive or exfil evidence (erb:899-913), Halloran's spare-badge answer, or a partial naming, and gates the office asks in all three places plus the aim. The server derives the aim on reload only when a task in it is done (`game.rb:1152-1157`), but the `unlockAim` mapping calls `persistUnlock` (`objectives-manager.js:706-711`), so the aim survives a reload either way.

**Wrong accusation.** Proportionate. Halloran is suspended, Patricia's influence drops by 2 (which can lock the CEO-email handover; the cabinet copy remains), HaX nudges after 15 s (erb:924-928) and points at the alibi in general advice, Halloran withholds her spare (Owen's clone is the main route anyway), Torres mentions it, the debrief costs 10 trust and names it, and the credits print WRONG ACCUSATION. Torres can still be named. Two loose ends (m3, m4).

**Teaching.** Access-log correlation is taught by doing it, which is the best part of the pass. Money and the approach land through the vetting files and the leaflet. The debrief recap (`m05_closing_debrief.ink:262-281`) names money, hours, an approach and the boss, but not the lesson the two vetting files set up, declared versus undeclared, and not behaviour (m5).

## 3. Fix-by-fix verification

| Fix | Status | Evidence / notes |
|---|---|---|
| 1 Patricia-KO variants | Done | `m05_torres_confrontation.ink:65-69, 273-277, 394-398`; HaX `:481-493, :597-601`; debrief `:369-373, :421-425, :447-451`. KO lines for Owen, Lisa, Halloran in `the_night` (:245-256). Gap: Halloran's restored-access line (m3). |
| 2 Recruiter consistency | Done | Debrief `:336-343, :470-474, :505-507`. |
| 3 Recruiter credits | Done | erb credits: the seven Recruiter lines are mutually exclusive across offered/decided/accepted/confessed/list (accept sets `decided` too, `m05_phone_recruiter.ink:214-215`). |
| 4 Recruiter pointer | Done | erb mapping on `recruiter_texted`, single-term condition, `skipIfGlobal`. |
| 5 Debrief reflects the night | Done, with an over-claim | Trust adjustments `:145-165`; briefing answer checked `:200-220`; `the_night` `:234-281`. The badge-log praise and BORROWED BADGE credit fire on reading the log, not on using it (m6). |
| 6 Outstanding flags | Done | All three naming routes and `general_advice :670-673`. |
| 7 Phone authorities | Done | `m05_phone_patricia.ink:97-104`; hub prints nothing before choices; reopencheck clean. |
| 8 Evidence shapes the turn | Done | `turn_argument` `:212-224`; Elena always available. New choice is 16 words (m9). |
| 9 v2 sprites | Done (static) | §1. Render positions not browser-checked yet. |
| 10 Whodunnit | Done, two majors | §2: M1, M2. |
| 11 Confrontation continuity | Done | `:99-106`, `:113`; "Nobody else knows" gone. |
| 12 Urgency vs print | Done | All three naming routes. |
| 13 Teaching lines | Done | Owen `:256`; RFID guide mapping and knot; mission.json keyword. |
| 14 Read reminders | Withdrawn, correctly | Notes `onRead` fires on pickup (`interactions.js:1453-1468`). |
| 15 Pull the drive | Done | `:455-463`. |
| 16 Graph and config | Done | Validator output; `waitForEvent` and `show_scenario_brief` present. |
| 17 Nightshade intro | Done | Opening diff. |
| Deniability (extra) | Done | Debrief `:528-532`. But the exposure ending's resting line now contradicts it (m7). |

## 4. Route matrix

Traced in ink and mappings; all completable.

| Route | Result |
|---|---|
| Reload mid-mission | `torres_suspected` aim persisted via `persistUnlock`; Owen's log ask hidden by `found_door_log` once read; naming knots re-check `torres_identified` at the top; reopencheck 0. OK. |
| Patricia KO before naming | Relay gives a pass and both authorities (`m05_phone_agent_0x99.ink:424-434`); her files drop; HaX takes the naming with the same menu. Owen's office ask still waits for `torres_suspected`. OK. |
| Patricia KO after naming | Torres opener, arrest line, post-KO narration and debrief branch. OK. |
| Owen KO | Relay gives badge, card, password, and the log if unread. Works; early pointer (m1). |
| Halloran KO | Lanyard, her file (via Patricia) and the log still clear her; spare drops. OK. |
| Lisa KO | Nothing gated. Debrief line. OK. |
| Wrong accusation (person, phone, HaX) | `halloran_accused` set in all three; Halloran then offered only if not accused; Torres still nameable. Phone version skips the influence cost (no influence var there); fine. Loose ends m3, m4. |
| Partial naming → office | Patricia (`:356-363`), phone (`:175-181`) and HaX (`:398-415`) all set `torres_suspected`; Owen's `request_office_card` then honours `patricia_authorised_office`. OK. |
| Recruiter: never/heard/refused/accepted±confessed × list | Debrief and credits consistent (§3). The "envelope still in your pocket" narration (`m05_torres_confrontation.ink:468-470`) plays even after the player agreed the envelope goes to Reading; pre-existing, no engine way to remove it (backlog `remove_item`). |
| Each ending | turn, arrest ± cooperation, fight non-lethal/lethal, exposure: debrief branches all present. Exposure resting line contradicts (m7). |

## 5. Findings

No blockers.

**M1 [major] The vetting files short-circuit the whodunnit.** Available on the first visit (`m05_npc_patricia_morgan.ink:262-270`), pointed at by the aim-2 task (erb:290); reading Torres' file sets `torres_suspected` (erb:899-905). Fix: gate the ask on `found_door_log or halloran_questioned`, so the log is the hinge and the files answer it. Before that, Patricia: "Vetting files are restricted. Bring me a name or a pattern and I'll pull them." After: "Two names on Owen's sheet. Here are both. One of them declared it. One didn't." Retitle the task "Pull the vetting files on the names in the log" (or keep it, since the aim is a to-do list). Leave the files in her `itemsHeld`, so a Patricia KO still drops them; that route is off-path. Mirror the ask on her phone only if fix 7's logic wants it. About 2 spoken lines.

**M2 [major] The naming lets the game do the deduction.** On the log alone, picking "David Torres" makes the player say the front-door correlation for them (`m05_npc_patricia_morgan.ink:346-349`; phone `:167-170`; HaX `:404-405`), and Torres never costs. Fix: when the only support is the log, ask why, with the player picking the reason: "His badge comes in the front door six minutes before her spare, every night." (authorises the search); "He's been under strain. His wife's ill." (Patricia: "So's half this building's family. That's not evidence." No cost, back to hub); and, if `halloran_questioned`, "He works late in her lab, where the spare hangs." (also authorises). Same three-choice knot in the phone and HaX versions; choices-only knot, so re-navigation is safe. About 3 spoken lines.

**m1 [minor] Owen-KO pointers.** Rename his card to something neutral, e.g. "IT Spare Office Card" (observations: "IT's spare for the office beyond the open-plan"), and the relay copy to "Spare Office Card (relayed copy)" (names stay distinct, E18). In `on_owen_ko_relay`, say "the office spares" and gate the vault line: `{torres_suspected: …only print enrolled is Torres'. - else: …only print enrolled is the cryptography lead's.}`. Ids unchanged, so no tag changes.

**m2 [minor] Vault lines name him before suspicion.** `m05_npc_owen_gallagher.ink:255` and `m05_phone_agent_0x99.ink:653-654`: use "the cryptography lead's" unless `torres_suspected` (Owen needs the VAR; HaX has it). Optional; the door sign already says "Cryptography Lead Only".

**m3 [minor] Halloran's reinstatement assumes Patricia.** `m05_npc_dr_halloran.ink:211-213` says "Patricia's given me my access back" even when Patricia is KO'd and Torres was named to HaX, and HaX's naming (`m05_phone_agent_0x99.ink:371-394`) never restores her. Fix: add `{halloran_accused: Agent HaX: And I'll get Halloran's access back on.}` to the HaX naming, and branch Halloran's line on `patricia_ko` ("Security have given me my access back."; add `VAR patricia_ko`).

**m4 [minor] Owen contradicts himself on Halloran's hours.** "Halloran lives in that lab" in answer to "keeping odd hours?" (`m05_npc_owen_gallagher.ink:155`) against "She's not a night owl" at the log (`:267`). Fix: "Halloran practically lives in that lab, but she's gone by seven. David Torres, though, lately." It also agrees with the log (her primary never in after hours). In the same vein, the player's Halloran question says "after midnight. Four times" (`m05_npc_dr_halloran.ink:128`), but the first swipe is 23:47: use "at night. Four times."

**m5 [minor] The debrief misses the declared-approach lesson.** The two files are set up to contrast declared with undeclared, and the recap (`m05_closing_debrief.ink:262-281`) never says it. Add, gated on Halloran's file being read (it sets `found_halloran_alibi`, which the debrief would need to declare): "Halloran had the same recruiter at her table in Zurich. She reported it the next morning. That's the whole difference." One line. A behaviour line would need a new global (Owen's or Lisa's observation knots); backlog-sized, skip unless cheap.

**m6 [minor] Badge-log credit over-claims.** "You read the badge log properly…" (`m05_closing_debrief.ink:241-242`) and BORROWED BADGE (erb:148) need only `found_door_log`, which the Owen-KO relay or simply opening the sheet sets. A player who named Torres from vetting file and flag 3 still gets it. Fix: set a `door_log_reasoned` global in the log-reason choice from M2 and in Halloran's `spare_badge`, and gate both on it; otherwise fall back to "The badge log was in your kit. It would have saved you time."

**m7 [minor] Exposure ending's resting line.** `after_choice` gives "Sit tight. The police are on their way." for `public_exposure` (`m05_torres_confrontation.ink:516`), but that path says the police come "within the week" (:495) and the debrief says they picked him up "the next morning" (debrief :504). Fix: a separate choice for exposure, e.g. "Go home, David. They'll come for you soon enough."

**m8 [minor, pre-existing] The confrontation opener claims what the player may not have.** "I've seen the staging on the portal. The Recruiter. All of it." (`m05_torres_confrontation.ink:87-88`) plays on a run that found exfil only in the vault and never met the word "Recruiter". Fix: "I've seen what you've been staging. All of it."

**m9 [minor] Three new lint issues.** Opening `:141` (32 words), HaX `:598` (30 words), Torres choice `:217` (16 words). Trim in the dialogue stage.

## 6. Verdict

Another round needed: M1 and M2 sit at the centre of the whodunnit, and both are small mission-local edits; the minors can go in the same pass.
