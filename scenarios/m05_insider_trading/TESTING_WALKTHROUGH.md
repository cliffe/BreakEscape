# Mission 5: "Insider Trading" — Testing Walkthrough

> Reconciled with the shipped `scenario.json.erb` and the ten `.ink` files
> after pass 3 and its implementation review (NPC ids renamed: `owen_gallagher`,
> `dr_halloran`) (see `PUZZLE_CHAINS_PLAN.md` §0). Codes, rooms and order below
> match the current build.
>
> **Pass 4 (2 October 2026):** m05 is now a whodunnit. Nothing names Torres
> before the evidence does; Dr Halloran is the red herring (her spare badge on
> the night log); naming is a choice of names; the "Find Out Why" aim opens on
> `torres_suspected`. See `DESIGN_REVIEW.md`, "Changes made (pass 4 design)",
> and `PASS4_PLAYTEST.md`.

## Prerequisites

- Hacktivity mode for the VM stage. The VM is `qdc_research_server` (Debian 12,
  Bludit research portal) plus a Kali `attack_vm`.
- Four flags on `qdc_research_server`, assumed in XML document order: leaked
  admin credentials (recon), authenticated image-upload RCE (shell), Torres'
  staging manifest (user), the Architect's authorisation (root, a sudo
  misconfiguration). Confirm the order on a real build.

## Start kit

Phone (HaX, and Patricia's mobile once you've met her), lockpicks, RFID cloner,
fingerprint kit. No PIN cracker.

## Room spine (single connections only)

```
      torres_office            data_center (key vault, fingerprint)
           |                        |
  research_lab — open_office_area   server_room (password)
                     |                  |
    break_room — main_corridor ——— server_hallway (RFID)
                     |
              reception_lobby ——— patricia_office
```

All nine connections are E/W pairs or equal-width N/S pairs. The door check
reports 9/9 aligned.

## The case (how identification is gated)

Evidence is a set of booleans, not a counter. Patricia (in person or by
phone), or HaX if Patricia is KO'd, accepts a name only with **one motive item
and one exfiltration item**:

- Motive: `found_medical_bills` (briefcase), `found_torres_journal` (desk) or
  `found_vetting_file` (from Patricia).
- Exfiltration: `flag3_submitted`, `found_manifest` or `found_upload_schedule`.

When the second half lands, HaX texts "That's both halves… Call Patricia and
give her the name" once. `found_pamphlet` (break room), `found_pipeline_list`
(data-centre envelope) and `found_stand_down_email` (CEO's email) are optional
and show in the debrief and credits.

**Who (pass 4).** The naming menu ("Go on, then. Who?") offers only names the
player has a reason for:

- "Dr Ruth Halloran…" once the badge log is read (`found_door_log`), until she
  has been accused. With her alibi known (`found_halloran_alibi`) Patricia
  refuses it at no cost. Without it, Halloran is suspended
  (`halloran_accused`): Patricia's influence -2, HaX's nudge text after 15 s,
  Torres mentions it, debrief line and trust -10, a WRONG ACCUSATION credit.
- "Ben Ashworth" once the log is read: refused, no cost ("Thursday at eight? The transfers run two till four"; the sheet no longer explains him, round 3).
- Round 3: every Torres naming without both halves uses one reason menu (log decoy, strain, Halloran's word, the front-door times, money, staging, "cryptography lead"). A wrong reason ends the conversation; only the front-door reason sets `door_log_reasoned`.
- "David Torres" once the log is read or `torres_suspected` is set. Both halves
  → named. Motive or exfil only → not named, but `torres_suspected` is set and
  the office search is authorised. Log only → "why?": the main-entrance times
  (or, after asking Halloran, her lab) is accepted (`door_log_reasoned`); strain
  or expertise is refused at no cost. Nothing → "On what?".

`torres_suspected` (opens "Find Out Why" and every office-card ask) is set by (round 3: not by Torres' vetting file):
reading Torres' vetting file, the medical bills or journal, flag 3, the
manifest or schedule (mappings), or a partial naming (ink). Round 2: asking
Halloran about her spare no longer sets it.

The badge log: Halloran's spare #4471 reaches the server hallway four nights,
each six minutes after Torres' own #4408 comes in the main entrance; her
primary badge never comes in after hours. Her alibi for Wed 23 Sep (Zurich,
21–25 Sep) is on the lanyard in her lab, in her vetting file, and in her own
answer.

## Aim 1 — Get Inside Quantum Dynamics

1. The opening briefing plays (Netherton, Nightshade, HaX). HaX names your kit
   in the cover-story section → `receive_mission_briefing`.
2. East into `patricia_office`. Talk to Patricia → `meet_handler`; visitor badge
   → `obtain_security_badge`. **Read the Security Incident Log on her desk**
   (`found_incident_log`); you'll need it for Owen.
3. When Patricia's conversation closes, she texts her mobile number. She is now
   callable on the phone.

## Aim 2 — Work Out Who Has Been in the Servers

4. West into reception, north into `main_corridor`, north into
   `open_office_area`. Talk to Owen Gallagher → `talk_to_owen`.
5. Choose "(Lean over his log screen…)". The RFID clone minigame runs on his
   EM4100 badge ("Staff Badge - O. Gallagher"). On success Owen notices the beep.
   `server_badge_obtained` is set by the `card_cloned` mapping. If you cancel,
   the choice reappears.
6. East from the corridor into `server_hallway` (the cloned card opens it) →
   `obtain_server_badge` (enter_room). Read the IT notice by the door.
7. Try the server-room door: HaX's "Password lock…" bark (`server_door_seen`).
8. Back to Owen: "The server room wants a password." He refuses. If Patricia
   has only authorised the office, he says so ("Patricia signed off David's
   office, not the server room"). Either:
   - with the incident log read: "Patricia's log has a crypto badge in your
     server room at 23:47…", or
   - ask Patricia (in person) via "I need your help with something" → "The
     server room wants a password Owen won't give me", then back to Owen.

   (Round 2: reading the IT notice by the door also opens this ask.) He hands over the sticky note (`quantum2024`) → `find_server_password`. He
   also says the key vault past the server room reads **David's thumb and
   nobody else's**, and that you can't change a thumb.
9. The badge log: with the incident log read, ask Owen "Patricia's log has a
   crypto badge in the server hallway at 23:47. Whose?" He hands over the
   **Server Hallway Badge Log** → `find_door_log` (optional), and says "That's
   Halloran's spare". Read the main-entrance lines too.
10. Clear (or accuse) Halloran: in the research lab, "Your spare badge has been
    through the server hallway after midnight. Four times." She gives the
    Zurich alibi, says the spare hangs on the hook by the door, and that David
    works in her lab late → `halloran_questioned`, `torres_suspected`. The
    **Conference Lanyard** on her monitor carries the same alibi.
11. Optional: vetting files from Patricia (`find_vetting_file`, "Find out who
    on the team is under pressure"), only once the badge log is read
    (round 2): **two** files, Torres (undeclared debts) and Halloran (late
    report, no dates, cancelled interview; not an alibi on its own). TalentStack leaflet in the break room (`find_entropy_pamphlet`);
    its handwriting matches the journal. Lisa says whose collection it is when
    asked, and mentions Halloran's row with the CEO. Halloran's spare badge is a
    second hallway route unless she has been accused.

## Aim 3 — Find Out Why (opens on `torres_suspected`)

First, the office keycard: once `torres_suspected` is set, ask Patricia (in
person or by phone) for his office, or name him with part of the case, then
Owen → `obtain_torres_keycard`. Before that, neither Patricia nor Owen offers it.

11. North from the open-plan into `torres_office` → `access_torres_office`.
12. Read the **journal** → `find_journal`.
13. **Dust the mug** on the front-right of the desk with the fingerprint kit: "Collected David
    Torres's fingerprint sample". HaX: "That's Torres' print."
14. Pick the **briefcase** (pins 35/60/45/30) for the **medical bills** →
    `find_medical_bills` (optional).
15. Optional, the CEO's stand-down email (`found_stand_down_email`), either way:
    - pick Patricia's filing cabinet (pins 40/55/30/50); or
    - ask Patricia "How far did your own investigation get?", then "Show me the
      email" (or later, from her hub, "You mentioned an email…"). She hands
      over "Patricia's Copy of the CEO's Email" and the conversation closes.
      Taking either copy counts, read or not. If the give ever fails, the offer
      comes back next time you talk to her.

## Aim 4 — Prove the Exfiltration on the Server

16. Hallway → `server_room` (password `quantum2024`) → `access_server_room`.
17. Bludit terminal; four flags (`access_bludit_vm` now ticks on flag 1) at the drop-site →
    `submit_flag1..4`. After flag 3 HaX offers the sudo guide.
18. North door: the key-vault fingerprint reader (`vault_reader_seen`). With
    Torres' print it opens → `access_data_center`. Without it: "requires David
    Torres's fingerprint". Go back for the mug.
19. Read the **upload schedule**, the **manifest** and the **TalentStack
    envelope**.

## Aim 5 — Decide What Happens to Him *(mission conclusion)*

20. Name Torres, in any of three ways → `identify_torres`, `torres_identified`:
    - by **phone**: Patricia → "I know who it is" → "David Torres";
    - **in person** in Patricia's office ("I think I know who it is");
    - to **HaX** if Patricia is KO'd.

    Every route also authorises the office spare. The closing lines depend on
    state: with flags outstanding, "Stop him first", then finish the portal;
    then "You've got his print. Go." / the fingerprint hint / "You'll need his
    print first." Torres appears at the upload terminal.
    HaX texts about the Recruiter ~6 s after her text, unless you've already
    rung her.
21. When the naming conversation closes, the Recruiter **texts**
    (`recruiter_texted`). Ring her back from the phone for her offer: leave the
    envelope out of your report. If you confront Torres first and ring her
    afterwards, she plays `never_talked_terms` ("we never did talk terms") and
    makes no offer. After a reload she re-texts if you never opened her chat, or
    if you heard the offer and never answered (`recruiter_deal_decided`).
22. Confront Torres. His new line: "The vault logged me in twice tonight. One
    of them was you." Choices as before:
    - turn: the argument depends on evidence (journal quote with
      `found_torres_journal`, the Architect's price with `flag4_submitted`,
      Elena always);
    - hold him for the police, with or without the treatment deal;
    - expose (anonymous source; the debrief says what it cost SAFETYNET);
    - fight, then a post-KO choice.

    On the talk endings the upload is stopped by a choice: pull the drive
    yourself, or make him cancel it.
23. `concludeRequires` = all four flags. The debrief fires when the Torres
    conversation closes with all four flags in; otherwise on the last flag.
24. Debrief and credits. The CEO line reads one way or the other depending on
    `found_stand_down_email`.

## Edge cases — NPC-KO fallback trace

- **Patricia KO**: HaX's `on_patricia_ko_relay` does three things:
  - gives a contractor pass;
  - sets `patricia_authorised_office` and `patricia_authorised_server`, so
    Owen accepts "Security's signed it off";
  - moves the naming to HaX.

  Her phone then only offers "(Ring her. It rings out.)", with no reply and no
  unread badge. Her desk log stays readable.
  Patricia-KO lines (pass 4): the arrest line, post-KO narration, HaX's advice
  and safety net, `after_choice` and three debrief branches no longer name
  her. Her dropped items include both vetting files.
- **Owen KO**: his office card, password note and badge log drop. HaX's
  `on_owen_ko_relay` gives copies of the staff badge, the office card and the
  password (from IT's ticket queue), plus the badge log if not yet read, and
  says the vault line.
- **Wrong accusation**: Halloran accused → suspended (her greeting changes, no
  spare badge), HaX nudge, `general_advice` points at the alibi and the
  front-door lines. Torres can still be named the usual way.
- **Torres KO**: `post_ko_choice` (`disableClose`); safety net on re-entering the
  data centre.
- Lisa / Halloran KO only close their optional interviews.

## Testing checklist (pass 3)

- [ ] Start inventory: four items; phone lists HaX, and Patricia only usefully
      after meeting her.
- [ ] Clone succeeds and the debrief line plays; a cancelled clone offers the
      choice again.
- [ ] Owen refuses without leverage; the log line or Patricia's authority gets
      the note and the vault line.
- [ ] The vault refuses without the print and opens with it; reload between
      dusting and the door loses the print and the mug can be dusted again.
- [ ] Open the phone **before** meeting Patricia: nothing usable, no unread
      badge. Meet her: the mobile text arrives and her hub works.
- [ ] Name by phone from the server room; the Recruiter's text arrives after the
      call closes, not during it.
- [ ] Name in person; the Recruiter's text arrives after the conversation
      closes.
- [ ] Reload after the Recruiter's text, before ringing back: `game_loaded`
      re-sends it (unproven for phone NPCs; if it fails, record it).
- [ ] KO Patricia after a call; phoning her gives only "(Ring her. It rings
      out.)" and no unread badge.
- [ ] Reopen the Recruiter's chat after the confrontation while her
      "Still deciding?" menu was the last thing shown: it goes straight to her
      post-confrontation lines.
- [ ] Patricia's email copy arrives on all three routes.
- [ ] Confront Torres before ringing the Recruiter back: her call is the
      post-confrontation line, with no offer.
- [ ] Reload with the Recruiter's offer heard but unanswered: she re-texts.
- [ ] Take Patricia's email copy without reading it: the debrief still credits
      the CEO line.
- [ ] Mid-mission reload: no intro replays; the cloner card survives.
- [ ] All four flags submit; the debrief waits for them; credits roll.
- [ ] Pass 4: before any evidence, no to-do item, Patricia choice or Owen
      choice names Torres; the corridor flyer names nobody.
- [ ] Pass 4: badge log → Halloran questioned → "Find Out Why" appears and the
      office ask opens.
- [ ] Pass 4: accuse Halloran with the log only → suspended, nudge text,
      Torres still nameable; WRONG ACCUSATION in the credits.
- [ ] Pass 4: never ring the Recruiter → credits show "NEVER HEARD HER OFFER".
- [ ] Pass 4: v2 sprites render at every NPC position; no two on-screen NPCs
      share a sheet.

## Not verified here

- Live browser playtest of everything above.
- Render placement of the moved mug (`torres_office` (5.6, 4.1), front of the
  desk) and IT notice (`server_hallway` (3, 2.3), on the floor).
- SecGen flag order on a real build.
