# Script: SAFETYNET: Licence to Hack game trailer

Plan and shot ids: `docs/video/recipes/lth-game-trailer.md`. Times are trailer seconds; the music (Emerald Trigger) starts at 0, so trailer time is track time. Main cut 104.768 s.

Rules for every line: the announcer never talks over a character line, and keeps at least 0.3 s clear of one on each side; no answers, codes or flag values; no tool, exploit or technique names; UK English.

Fit rule: an announcer reads slower than a presenter, so the fit is 2.0 words a second, plus 0.3 s for each stop inside the cue, plus 0.35 s (0.2 s lead, 0.15 s tail). "CTF" and "SAFETYNET" count as one word each.

## V1: announcer

Delivery (TTS style annotation, passed as speech metadata, never in the text): "epic film-trailer announcer, deep and unhurried, low and close to the microphone, weight on the last word of each sentence, British". Model and language as `tools/video/scripts/narrate.rb` (gemini-3.8-flash-tts, en-GB).

Voice candidates (each reads the same test lines on the review page):

| Candidate | Why |
|---|---|
| Alnilam | Firm and low; no in-game character uses it |
| Gacrux | Mature, weighty; no in-game character uses it |
| Algenib | Gravelly; it is the in-game noir Narrator's voice, which links the trailer to the game but may blur the two |

Test lines for all three: VO9 (the claim) and VO10 (to hear how each voice says "SAFETYNET"; if one misreads it, write "Safetynet" in that voice's TTS text only and keep the caption in capitals).

| Cue | Start | End | Over (picture) | Text | Words | Stops | Fit (s) | Clear window (s) | Spare (s) |
|---|---|---|---|---|---|---|---|---|---|
| VO1 | 0.60 | 4.25 | Title, before the first impact | First the hospitals. Then the power. | 6 | 1 | 3.65 | 0.00 to 6.77 | 3.12 |
| VO2 | 13.90 | 16.55 | C1, then two location flashes | Ten missions. One enemy. | 4 | 1 | 2.65 | 12.81 to 17.21 | 1.75 |
| VO3 | 25.35 | 32.60 | C2 into the montage: lockpick, badge clone, prints, biometric, keypad | Pick the locks. Clone the badges. Lift the prints. Don't get caught. | 12 | 3 | 7.25 | 24.49 to 37.57 (by choice; nothing is spoken until 52.10) | 5.83 |
| VO4 | 37.75 | 41.40 | C3 and the first two decoding shots | Decode the messages. Break the ciphers. | 6 | 1 | 3.65 | 37.57 to 43.93 | 2.71 |
| VO5 | 45.35 | 50.30 | The VM panel opening, then the console run | Then log in. Real machines. Real CTF challenges. | 8 | 2 | 4.95 | 43.93 to 51.80 | 2.92 |
| VO6 | 56.95 | 59.80 | The flag accepted and the story reacting | Every flag moves the story. | 5 | 0 | 2.85 | 56.83 to 59.93 (ends before C5) | 0.25 |
| VO7 | 59.95 | 64.90 | C5, the phone choice, the field guide opening | Stuck? Ask your handler. Read the field guide. | 8 | 2 | 4.95 | 59.93 to 65.67 | 0.79 |
| VO8 | 71.70 | 74.05 | The walkthrough | Walkthroughs for every mission. | 4 | 0 | 2.35 | 71.69 to 74.33 (the cut to the villains) | 0.29 |
| VO9 | 86.24 | 91.39 | C7a, C7b ("No other game" lands on the C7b cut at 88.735) | Inside a spy story. No other game does this. | 9 | 1 | 5.15 | 85.32 to 92.16 | 1.69 |
| VO10 | 97.70 | 101.65 | Close, before the curtain covers at 101.87 | SAFETYNET: Licence to Hack. Play now. | 6 | 2 | 3.95 | 95.99 to 104.17 | 4.23 |

68 words in all. "Clear window" keeps 0.3 s from the nearest character line on each side (or runs to the picture cut named). VO6 and VO8 have the least spare, and in both cases the limit is a picture cut, not a voice. Truth notes: hospitals are m02 and m03, the power grid m04 and m07; "Real CTF challenges" rests on every mission's VM flags being required in play; "Walkthroughs for every mission" is true now (all ten published and linked); VO9 is the owner's claim with nothing added (Q2 in the recipe has the alternatives); "Play now" is also on screen.

Clearance from character lines (every gap at least 0.3 s):

| Cue | Character line before (ends) | Gap (s) | Character line after (starts) | Gap (s) |
|---|---|---|---|---|
| VO1 | none | | Netherton, S03 (7.066) | 2.82 |
| VO2 | Netherton, S03 (12.506) | 1.39 | HaX, S07 (17.512) | 0.96 |
| VO3 | Netherton, S08 (24.185) | 1.17 | Victoria, S29 (52.100) | 19.50 |
| VO4 | Netherton, S08 (24.185) | 13.57 | Victoria, S29 (52.100) | 10.70 |
| VO5 | Netherton, S08 (24.185) | 21.17 | Victoria, S29 (52.100) | 1.80 |
| VO6 | Victoria, S29 (56.530) | 0.42 | Irina, S33 (65.973) | 6.17 |
| VO7 | Victoria, S29 (56.530) | 3.42 | Irina, S33 (65.973) | 1.07 |
| VO8 | Irina, S33 (71.393) | 0.31 | Voltage, S37 (77.731) | 3.68 |
| VO9 | The Recruiter, S39 (85.019) | 1.22 | The Architect, S40 (92.459) | 1.07 |
| VO10 | The Architect, S40 (95.692) | 2.01 | none | |

V1 keeps every character line in the V2 table below; the announcer fills only the spaces between them.

Mix: announcer at full, music ducked 10 dB under each cue (the dialogue duck), title clip audio at -4 dB as the preset sets it.

## V2: episode-style (no narrator)

All spoken audio is the in-game character dialogue already in the take audio, voiced from the game's TTS cache when each take was recorded, so V2 needs no new TTS. V1 uses the same lines. Every line sits wholly inside its shot, so the burned caption shows all of it.

| Shot | Line (trailer clock) | Speaker | Line | Take, source window | Audio |
|---|---|---|---|---|---|
| S03 | 7.066 to 12.506 | Director Magnus Netherton | ENTROPY used to steal. Now they break the things people can't live without. | m04 t01c_briefing, 4.838 to 10.278 | In the take; used in the m04 trailer |
| S07 | 17.512 to 21.292 | Agent HaX | If they refuse and you're too slow, people die on the ward. | m02 t01_hax_hook, 11.97 to 15.75 | In the take; used in the m02 trailer |
| S08 | 21.725 to 24.185 | Director Magnus Netherton | Eight point four million people, Agent. | m07 t10_briefing, 30.22 to 32.68 | In the take; used in the m07 trailer. Cut before his next sentence (32.884), last 0.1 s faded |
| S29 | 52.100 to 56.530 | Victoria Sterling | Freelance pen testing. Some CTF work. Competent. | m03 t19_victoria_pitch, 18.26 to 22.69 | In the take; not used in a trailer before. Two natural pauses inside the line |
| S33 | 65.973 to 71.393 | Dr Irina Volkova | Satoshi is paranoid about doors and careless about passwords. | m06 t12_irina_badges, 24.137 to 29.46 | In the take; used in the m06 trailer |
| S37 | 77.731 to 79.721 | Voltage | I didn't bring a bomb, agent. | m04 t04_voltage | In the take; used in the m04 trailer |
| S38 | 80.141 to 81.611 | Voltage | I brought a maintenance schedule. | m04 t04_voltage | In the take; used in the m04 trailer |
| S39 | 82.459 to 85.019 | The Recruiter | Everyone has a price, agent. | m05 t10_recruiter_call, 146.83 to 149.39 | In the take; used in the m05 trailer |
| S40 | 92.459 to 95.692 | The Architect | Four fires tonight, and only one of you. | m07 t13c_architect_call_fx, 37.525 to 40.758 | In the take; used in the m07 trailer |

In the take, S03's subtitle line begins "Agent 0x00.", which is spoken before the shot's in point; the burned caption text leaves it out, and the 16:9 frame-check confirms the game's own subtitle bar reads cleanly from 4.75 s. Agent HaX's phone help (S31) is on screen as text, not voiced.

Cards (both versions): C1 "Ten Missions / One Enemy"; C2 "Pick. Clone. / Crack."; C3 "Encoding & / Encryption"; C4 "Real VMs. / Real Hacking."; C5 "Stuck? / Hints. Guides. / Walkthroughs."; C6 "Meet / ENTROPY"; C7a "Real VMs and CTF / In a Spy Story"; C7b "No Other Game / Does This". Close: "Play now".

The trailer in short (both versions): the title; lights fail at a hospital and a plant; Netherton: ENTROPY now breaks what people can't live without; a ransom screen; "Ten Missions / One Enemy" over two locations; HaX: people die on the ward; Netherton: eight point four million people; "Pick. Clone. / Crack." and the montage (locks, badges, prints, a biometric door, a keypad, a conversation, a money trail, a PIN pad, a chase); "Encoding & Encryption" and three decoding screens; "Real VMs. / Real Hacking.", the VM opening in the game and five console cuts; Victoria reads the cover CV; a flag goes in and the story answers; "Stuck?", the phone sends a field guide, Irina drops a hint, a walkthrough; two calls, then "Meet ENTROPY" on the biggest hit, Voltage and the Recruiter; the two USP cards; two gadget flashes; the Architect: four fires, one of you; a lone agent in the dark; "Play now".
