# E20 Remote and mobile working: blind playtest B1

Blind run, headless (machine load average 30 to 45, so timings below are estimates at a reading pace, not wall-clock). Server :3001. Games: full persona 1 = 4953, full persona 2 = 4966, defend-only = 4969. Session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/aw2/blind-e20/p1.jsonl`, `p1b.jsonl`, `p2.jsonl`, `p3.jsonl`. verify-run.rb: all three "progress recorded", 1 task completed (`tell_them_apart`), no flags (none in this episode). Screenshots: none taken (none needed).

Harness notes: the kiosk's answer options (`label.epr-sbx-option`) and the flag tick-boxes are not in the `mg` control list, so I clicked those visible labels through the DOM (stated, not used to discover anything hidden). `bootstrap` with `resume:"resume"` after a reload hung (known resume loop); I restarted the session on the same game instead.

## Persona 1: careful worker (full), about 12 min

| When | What I thought the goal was |
| --- | --- |
| Start | Tell safe from fake networks, from the task "Tell the safe networks and pages from the fakes". |
| Zainab | "Two days on the road, then sort real from fake. Nothing is a real password." Clear. |
| Kiosk brief | Same goal; told only the last part is scored. |
| Everyday choices (5) | Pick what I would really do; unscored. Each had one plainly careful option and one careless one. |
| Where it led | Every call reported as "the safe route", with a concrete good outcome. |
| Sorting (6 items) | Trust / Report / Delete / Verify each, then tick what I noticed. |
| Debrief | Score 100, short lessons, "On Monday, three things". |

Reload: done at the "Where it led" screen (between stages). Progress was kept: reopening the kiosk landed on the same "Where it led" screen with all five choices intact. The player sprite went back to the start position (minor, not progress). Nothing lost.

### Stuck moments
| Where | Duration | Tried | Unstuck by |
| --- | --- | --- | --- |
| Item 1 (café Wi-Fi list) | about 1 min | Clicking the network rows (not clickable); chose Report because a look-alike is on the list | Nothing. I guessed. See finding M1. |
| Kiosk intro | seconds | Looked for a start button; "Start" is clear | n/a |

No stuck moment longer than a minute. Nothing needed outside help.

### Real decisions: was the answer given away?
- Choice 1 (seat), 2 (call), 3 (laptop), 4 (Wi-Fi), 5 (service desk): the careful option is the longer, more detailed one every time ("back to the wall, privacy screen on"; "ring the service desk now, day or night"), and the careless one reads as careless ("Read it out quietly", "you'll only be a minute", "wait until the morning, it's locked and might turn up"). Answer given away by wording on all five. These are unscored, so it costs less, but there is no real dilemma.
- Sorting: Haverbridge (FREE in capitals, strongest signal, "Already selected for you") and the work-password page are obvious. The lost-device message has a one-letter domain (`tarrowbey`) which is fairly spotted. The café list is the one real puzzle, and it is broken (M1). The real service-desk email (trust) and real café page (trust) work well as the "don't report everything" half.
- The flag tick-box list names every possible tell in full sentences, so ticking is partly a vocabulary match rather than noticing. Minor.

### What I learned (own words)
Strongest signal is not the safest; the venue tells you its network name; a Wi-Fi page never needs my work password; if a device goes missing, ring the service desk straight away even if it's locked; a message that "found" my lost device is a trap; a real service-desk reminder is fine to trust; don't read codes out in a queue.

## Persona 2: struggling player (full), about 9 min

Skipped Zainab, took the second (quick) option on every everyday choice, trusted the official-looking items, deleted the plain ones, ticked "Nothing looks wrong" throughout.

- Where it led: each bad choice gets a plain consequence, no blame. Best lines: "She wasn't being nosy; the screen was just there." and "The stranger was lovely and touched nothing." Fair and humane.
- Sorting: Trust on Haverbridge, work-password page, fake device message scored 0 each with "Not this time... The right call was Report or Verify" and "What would have happened". Deleting two real items scored 70 each. Round score 25%, "Worth practising: here's where to look first". No shaming. This is a good debrief for a mistake-prone player.
- Debrief names the most-missed tells, says what the real ones were, explains the cost of over-reporting, and ends with "a miss here says more about the attack than about you."

Issues seen:
- Debrief says "Reported instead of accepted... Reported as if it were a scam" for items I **deleted** (wording follows Report, not the actual verdict). Minor, content.
- "Trust" on the café Wi-Fi list scored 100 "Right call" and Report scored 100 as well (M1).
- Skipping Zainab loses nothing, which is fine.

## Defend-only (persona 1), about 6 min

Opens straight on a short brief that names "the café's Wi-Fi and a look-alike, a page that wants your work password, a notice about a lost device", which gives away the whole sort. Then the same six items. I did them 100/100 with 97% overall and the debrief says all three tells were named, so the 97 is unexplained (nit). The debrief still includes "At home, mind the camera and what's behind you" and the "Out of sight, out of earshot" paragraph, which refer to material the defend-only player never saw (train, queue, café table, home). It reads as slightly out of place but does not confuse. The task list ticks both objectives correctly. Makes sense to someone who skipped the full episode.

## Scores (1 to 5)
Fun 3, pacing 4, clarity of goals 4 (5 apart from item 1), openness of decisions 2 (everyday choices obvious; sort is open but item 1 is muddled), teaching 4.

Times (estimated at reading pace): full about 12 min (target 15), struggling about 9 min, defend-only about 6 min (target 8).

## Five best lines
1. "She wasn't being nosy; the screen was just there."
2. "The stranger was lovely and touched nothing. The couple at the next table, though, could read your open inbox..."
3. "Your password manager did not fill this in, because it does not recognise the page." (a tell a real user can actually use)
4. "A padlock only means the connection is encrypted, not that the page is honest."
5. "These messages are built to fool careful people, so a miss here says more about the attack than about you."

## Five worst lines
1. "Thanks for reporting. A colleague will check it and let it through." (café list, after Report; contradicts being scored 100 with the look-alike ticked and then "Not a flag here")
2. "See how little it took?" (shown to a player whose five choices were all safe)
3. "You joined the network the staff named... This is the one the attackers were counting on." (ambiguous: reads as if the safe network was the trap)
4. "Reported instead of accepted... Reported as if it were a scam" (shown for a Delete)
5. "Not a flag here: A public Wi-Fi network named to look like the venue's" (for a list that literally contains BeanBarrow Free)

## Severity table
| # | Sev | Tag | Finding |
| --- | --- | --- | --- |
| M1 | major | content | Item 1 (café Wi-Fi list) has no clear thing to judge. It contains a real network (chalkboard) and a look-alike (BeanBarrow Free) but takes one verdict. Trust and Report both score 100; ticking the look-alike flag on Report is then labelled "Not a flag here", and a Trust verdict says "this one was real". A player cannot tell what is being asked. Suggest making the item the single look-alike network, or making rows selectable. |
| m1 | minor | content | "See how little it took?" opens the Defend stage even for a player who made all safe choices. |
| m2 | minor | content | Everyday choices are unscored and the careful option is always the longer, detailed one: answer given away by wording. |
| m3 | minor | content | Debrief uses "Reported" wording for items the player deleted. |
| m4 | minor | content | Defend-only debrief carries home-camera and "out of sight, out of earshot" paragraphs from parts of the story the player never saw. |
| m5 | minor | content | "This is the one the attackers were counting on" under the safe café outcome reads backwards. |
| n1 | nit | content | 97% with every tell named and all calls right; no reason given. |
| n2 | nit | engine | After a reload the player sprite returns to the start position (progress kept). |
| n3 | nit | engine | Zainab's lines each appeared twice in the transcript ("I'll walk you through two days..." and "Any time."); may be a harness echo, not checked on screen. |
| n4 | nit | engine | `mg getState` text is capped at 2000 characters, so long debriefs look cut off ("...Out of sight, out of earshot | In"); harness only. |

Counts: blocker 0, major 1, minor 5, nit 4. Reload kept progress. No stuck moment over a minute.
