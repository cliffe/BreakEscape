# Mission 5: "Insider Trading" — Testing Walkthrough

> Reconciled with the shipped `scenario.json.erb` and the nine `.ink` files
> after pass 2 and its review round (see `PASS2_IMPROVEMENTS.md`). Codes,
> rooms and order below match the current build, not the alignment draft.

## Prerequisites

- Hacktivity mode for the VM stage. The VM is `qdc_research_server` (Debian 12,
  Bludit research portal) plus a Kali `attack_vm`.
- Four flags on `qdc_research_server`, assumed in XML document order: leaked
  admin credentials (recon), authenticated image-upload RCE (shell), Torres'
  staging manifest (user), the Architect's authorisation (root). Confirm the
  order on a real build.

## Room spine (single connections only)

```
      torres_office            data_center
           |                        |
  research_lab — open_office_area   server_room
                     |                  |
    break_room — main_corridor ——— server_hallway (RFID)
                     |
              reception_lobby ——— patricia_office
```

All nine connections are E/W pairs or equal-width N/S pairs. `door_align.py`
models every one of them and reports 9/9 aligned.

## The case (how identification is gated)

Evidence is a set of booleans, not a counter. Patricia (or HaX, if Patricia is
out) accepts a name only with **one motive item and one exfiltration item**:

- Motive: `found_medical_bills` (briefcase), `found_torres_journal` (desk) or
  `found_vetting_file` (from Patricia). Each latches `case_motive`.
- Exfiltration: `flag3_submitted`, `found_manifest` or `found_upload_schedule`.
  Each latches `case_exfil`.

When the second half lands, HaX texts "That's both halves" once
(`case_ready_notified`). `found_pamphlet` (break room) and
`found_pipeline_list` (data centre envelope) are optional and show in the
debrief and credits.

## Aim 1 — Get Inside Quantum Dynamics

1. The opening briefing plays automatically (Netherton, Nightshade, HaX) →
   `receive_mission_briefing` (a custom task; it completes when the briefing
   opens, with backstops on close and on re-entering reception).
2. Go east from reception into `patricia_office`. Talk to Patricia →
   `meet_handler`. She gives the visitor badge → `obtain_security_badge`.

## Aim 2 — Work Out Who Has Been in the Servers

3. Go back west into reception, then north into `main_corridor` and north again
   into `open_office_area`. Talk to Kevin → `talk_to_kevin`.
4. Take the **server password** sticky note (`quantum2024`) from Kevin's desk →
   `find_server_password`.
5. Work through Kevin's topics (or build rapport) and ask for:
   - the **cloned staff badge** (opens the server hallway) → `obtain_server_badge`;
   - the **office keycard**, which needs Patricia's authority (ask her for
     office access first) or high rapport → `obtain_torres_keycard`;
   - the **lockpick** (optional) → `find_lockpick`.
6. Optional: ask Patricia for the **vetting files** → `find_vetting_file`; read
   the **TalentStack leaflet** in the break room (west of the corridor) →
   `find_entropy_pamphlet`; talk to Lisa (break room) and Dr Chen (research lab,
   west of the open-plan). Chen's badge is a second route to the server hallway.

Aims 3 and 4 both open when aim 2 completes and can be done in either order.

## Aim 3 — Find Out Why

7. North from the open-plan into `torres_office` (office keycard) →
   `access_torres_office`.
8. Read the **journal** on the desk → `find_journal`.
9. Pick the **briefcase** (key lock, pins 35/60/45/30) for the **medical bills**
   → `find_medical_bills` (optional).
10. Optional: pick Patricia's **filing cabinet** (pins 40/55/30/50) for the CEO's
    stand-down email.

## Aim 4 — Prove the Exfiltration on the Server

11. East from the corridor into `server_hallway` (RFID), north into
    `server_room` (password `quantum2024`) → `access_server_room`.
12. Open the Bludit terminal → `access_bludit_vm`.
13. Exploit the portal and submit four flags at the drop-site →
    `submit_flag1..4`. Flag 4 sets `architect_approval_confirmed`.
14. North into `data_center` → `access_data_center`. Read the **upload
    schedule** → `find_upload_schedule`; the **manifest** → `found_manifest`;
    the **TalentStack envelope** → `found_pipeline_list` (47 names).

## Aim 5 — Decide What Happens to Him *(mission conclusion)*

15. With one motive + one exfiltration item, name Torres to Patricia →
    `identify_torres`, `torres_identified`. If Patricia is KO'd, name him to HaX
    instead (hub option "Patricia's down…"). Torres becomes visible in the data
    centre.
16. When Patricia's conversation closes, the Recruiter calls (Patricia route).
    On the HaX route she leaves a text; ring her back. Her deal: leave the
    TalentStack envelope out of your report.
17. Confront Torres at the upload terminal → `confront_torres`. Choose:
    - **Turn** → `turn_double_agent`; SAFETYNET pays for Elena's treatment.
    - **Hold him for the police** → `arrest`; talking before they arrive sets
      `elena_treatment_funded`.
    - **Expose** → `public_exposure`, `entropy_program_exposed`.
    - **Fight** → he turns hostile. After the KO, a `disableClose` choice sets
      `combat_nonlethal` (stay with him) or `combat_lethal` (leave him bleeding).
    `make_critical_choice` completes.
18. `concludeRequires` = all four flags. With the flags in, the debrief fires
    when the Torres conversation closes. Without them, HaX texts you back to
    the server once, and the last flag submission fires the debrief.
19. The debrief plays as a person-chat cutscene (`debrief_played` guards a
    replay). `hear_debrief` completes and the credits roll.

## Global variable state (end of a clean turn-double-agent run)

- `torres_identified`, `torres_turned`, `elena_treatment_funded` = true
- `flag1..4_submitted`, `architect_approval_confirmed` = true
- `case_motive`, `case_exfil`, `case_ready_notified` = true
- `final_choice` = `turn_double_agent`, `debrief_played` = true

## Reconciliation against the dungeon graph

- Critical path: establish_access → investigate_employees → (gather_evidence ∥
  exploit_infrastructure) → confront_insider.
- Server-hallway badge: two sources (Kevin's clone; Chen's badge, marked
  `puzzle_graph_optional`), plus HaX's relayed copy on a Kevin KO.
- Office card: Kevin, or HaX's relayed copy on a Kevin KO.

## Edge cases — NPC-KO fallback trace

- **Patricia KO** → HaX phone cutscene `on_patricia_ko_relay` gives a real
  `id_badge` (contractor pass) and sets `patricia_authorised_office`; naming
  moves to HaX (`name_to_hax`).
- **Kevin KO** → `on_kevin_ko_relay` gives working copies of the staff badge and
  the office card (his own items can't drop in a later-loaded room).
- **Torres KO** → `post_ko_choice` (`disableClose`). If that scene is ever lost
  (reload mid-choice), re-entering the data centre opens HaX's
  `post_ko_safety_net` with the same two choices; `torres_fate_by_phone` then
  fires the debrief.
- Lisa / Chen KO only close their optional interviews.

## Testing checklist

- [x] Every collect task has `targetCount: 1` and ticks on pickup (live, game 1169).
- [ ] The Recruiter's first call always reaches the offer, even if the naming
      conversation's close fires twice.
- [ ] With Patricia KO'd, HaX and Torres no longer mention her as the
      sponsor.

- [ ] All four flags submit and tick `submit_flag1..4`.
- [ ] Naming needs both halves of the case; one half alone is refused.
- [ ] The Recruiter does not appear on the phone before Torres is named.
- [ ] The Recruiter calls after the naming conversation, not during it.
- [ ] The debrief does not fire until all four flags are in.
- [ ] Credits roll after the debrief.
- [ ] Every doorway walks through (9/9 aligned).
- [ ] Escape can't close the post-KO choice.

## Not verified here

- Live browser playtest (movement, the fight, the flag round-trip, the
  Patricia → Recruiter → Torres staging).
- SecGen flag order on a real build.
