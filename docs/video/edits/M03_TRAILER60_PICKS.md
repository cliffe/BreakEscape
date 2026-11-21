# m03 60 s trailer: draft picks (scout stage, unreviewed by the user)

Source: `docs/video/scout/m03_scout.md`. Recipe: `docs/video/recipes/mission-trailer.md`. Models: m01, m02 picks.

Spine: a recruit walks into a respectable pentest firm that is really the exploit market behind the hospital attack, clones cards past its readers by day, then comes back at night while the guard's torch sweeps, with Victoria Sterling as the voice of the business.

## Music

Proposed: CutScene "Shadow Code 1", 118.65 BPM, window from 114.322 s (the mission's night playlist; unused by m01/m02). Fallback: SpyAction "Midnight Trigger" at 92.994 s. Lifts and the 60 s window still to be analysed (`analyse_music.py`). Question 1.

## Beat sheet (grid to be set once the 60 s analysis exists)

| Slot | Shot | Take id | Entry state | Line / audio |
|---|---|---|---|---|
| Title | `safetynet-open` preset, HaX J-cut | none | none | hook below under the title |
| Hook | HaX briefing portrait | t01_hax_hook | fresh game, wait for the cutscene | HaX "You worked St. Catherine's last month. The hospital that went dark." (3.77 s) or "They don't run the attacks. They arm the cells that do." (3.62 s); both cached |
| Card | Mission 3 / Ghost in the Machine | none | none | none |
| Drop | `main_hallway` motion lights strike at night (dark lead-in) | t02_hall_lights | `--set briefing_played=true --set clone_call_done=true`, start `main_hallway` | none |
| Montage A (4 shots) | lockpick on the executive office door, RFID clone (reception, cloner glow, no code), phone chat with HaX, PIN keypad (3 wrong digits, no ENTER) | t03_lockpick, t04_rfid_clone, t05_phone, t06_keypad | start kit in inventory; exec office or reception | none |
| Card | Real / Hacking | none | none | none |
| Walk to VM | player walks to the Training Lab Terminal in `server_room`, out before it opens | t07_walk_vm | `--start-room server_room --unlock server_room`, night | none |
| Real hacking | recon capture, nmap typing then banners, MAC line cropped, 2 s | clip | `~/safetynet-footage/m03/solution/vm_console_recon_s949.trimmed.mkv` window about 35.5-39.5 s | none |
| Real tool | CyberChef workstation, input pane only, neutral input | t08_cyberchef | server_room, take the workstation | none |
| Card | Uncover / the Mystery | none | none | none |
| Character beat 1 | approach shot to Ffion at night, then her line | t09_ffion | night, `reception_lobby`, before all four flags | Ffion "Is Ms. Sterling expecting you this late?" (3.29 s) after "Oh! You made me jump. I only came back for my charger." (3.50 s) if length allows |
| Character beat 2 | approach to Zainab, then line (day, afternoon) | t10_zainab | fresh game, afternoon, `reception_lobby` | Zainab "Hiya. Here to see Sterling? Good luck." (3.89 s) |
| Character beat 3 | Yusuf or a Terry torch beat | t11_yusuf / t12_terry | afternoon reception / exec wing night | Yusuf "Afternoon. If you're my client, you're very late." (4.58 s) |
| Card | Choices with / Consequences (dissolve) | none | none | none |
| Montage B | walk to Victoria's door, ward-style walk heading for the exec wing past the swivel chair, beside Ffion's desk; no wall bumps | t13_walk_conf, t14_walk_exec, t15_walk_desk | day then night | none |
| Card | Hold Back / the Entropy (wording is Q4) | none | none | none |
| Crescendo | lockpick, key select, RFID read/save, RFID emulate at the reader, password screen (cropped off the post-it), PIN keypad, pc desktop, CyberChef (crop), phone chat, flag station (crop), sight cone with Terry's "Picks. Right. We're done talking." (3.29 s); NPC flashes for characters without a beat (Danny only with the user's yes) | t16_minigames, t17_guard | see scout section 5 | Terry line starts under the cut |
| Villain | Victoria Sterling in the conference room, wide then 3x close-up | t18_victoria | afternoon, `conference_room_01` unlocked | "Competent is cheap. That's not why you're here." (3.98 s) then optionally "We find it, we price it, and we find the somebody." (5.26 s) |
| Bumper | `hacktivity-close` preset | none | none | none |

Left out: Danny's lines and office, the transaction log and printouts (old t04), the revelation call (old t03), all post-it and whiteboard screens, the VM launcher panel (old t02 approach re-record cropped), choice and credit screens.

## Take list (all fresh; old t01-t04 predate office life and avatars)

Avatars (adjacent visible shots never share one; hood hackers once each when the player is hidden): t03 lucia_moreno, t04 mei_lin_chow, t06 daniel_seo, t07 ngozi_adeyemi, t02 vivian_ashby, t09 marcus_hale, t10 frank_callahan, t11 harjit_singh, t12 daniel_seo, t13 lucia_moreno, t14 ngozi_adeyemi, t15 mei_lin_chow, t16 marcus_hale, t17 vivian_ashby, t18 frank_callahan, t05/t01/t08 hood or any (player not visible). Set with `BE_SPRITE=<key> tools/video/takes/run-take.sh m03 <id>`.
Scripts to write: t01_hax_hook (reuse m02 pattern), t02_hall_lights, t03_lockpick, t04_rfid_clone, t05_phone, t06_keypad, t07_walk_vm, t08_cyberchef, t09_ffion (reuse old t01 setup, add an approach), t10_zainab, t11_yusuf, t12_terry, t13-t15 walks, t16_minigames chain, t17_guard (sight cone), t18_victoria. Old scripts `tools/video/takes/m03/_live.mjs` and t01 assume the LIVE rig; port to a keyless game with the new-game.rb flags.

## Open questions for the user

1. Music: Shadow Code 1 (night playlist), Midnight Trigger or Cold Bond Circuit? By ear.
2. Show Victoria Sterling as the villain close (she is the briefed target, not a twist)? And may Danny Foster appear as a face flash, or be left out?
3. Hook: "The hospital that went dark." or "They arm the cells that do."?
4. Threat card wording for m03 (m01 "The Entropy", m02 "Before the Ward Goes Dark"): suggestion "Before the Next Sale".
5. Real Hacking: is a recon-only nmap beat (MAC line cropped) enough, as agreed for m02?
6. Terry's "Picks. Right. We're done talking." plays only after the lockpick is caught in his view: show the caught-picking beat (a sight-cone showpiece)?

## Orchestrator decisions (2026-11-21, before takes)
- Q2: show Victoria as the villain close; Danny may appear as a face flash in the crescendo (user on m02 v2: "Not a spoiler to see an NPC on screen"). Still no Danny lines or office.
- Q5: recon-only nmap beat, MAC line cropped (same as the m02 v2 console beat the user kept).
- Q6: yes, record the caught-picking sight-cone beat (t17_guard); Terry's line J-cuts into it.
- Q1: Shadow Code 1 by the 60 s beat analysis at the edit stage (the user kept the analysis pick on m02); fallbacks as listed.
- Q3, Q4 go on the review page with a suggested pick: hook "They don't run the attacks. They arm the cells that do." (states m03's premise; record both, the edit uses one); threat card "Before the Next Sale".
- User notes from m02 that apply: approach shot before each character line, voices J/L-cut across the cut, lines finish, no walking into walls/doors, ambient chatter muted, voices levelled to HaX.
