# Script: SAFETYNET: Licence to Hack game trailer

Plan and shot ids: `docs/video/recipes/lth-game-trailer.md`. Times are trailer seconds; the music (Emerald Trigger) starts at 0, so trailer time is track time. Main cut 104.768 s.

Rules for every line: the announcer never talks over a character line, and keeps at least 0.3 s clear of one on each side; no answers, codes or flag values; no tool, exploit or technique names; UK English.

Cue lengths: every cue is placed on its measured speech length in Alnilam's voice (the mp3 without its silent tail of 0.21 to 0.39 s, which the edit trims; no clip has a lead silence). A cue starts at its clip's first sound and ends at the end of its speech. "CTF" and "SAFETYNET" count as one word each. Every cue also keeps at least 0.3 s from the next announcer cue. If another voice is picked, measure it the same way and re-place any cue that no longer fits, keeping the clearances below.

## V1: announcer

Delivery (TTS style annotation, passed as speech metadata, never in the text): "Epic film-trailer announcer: very deep, low and close to the microphone, measured and unhurried, great gravitas, weight on the last word of each sentence, long pauses between sentences, British (UK English) accent". Model and language as `tools/video/scripts/narrate.rb` (gemini-3.8-flash-tts, en-GB).

Voices auditioned on VO1, VO4, VO5 and VO10 (measured lengths, seconds):

| Voice | VO1 | VO4 | VO5 | VO10 | Notes |
|---|---|---|---|---|---|
| Alnilam | 5.11 | 4.67 | 6.95 | 6.10 | Firm and low; no in-game character uses it. The timing baseline: every cue is placed on these lengths (final clips) |
| Gacrux | 5.76 | 5.28 | 7.90 | 6.07 | Mature, weighty; no in-game character uses it. Fits if VO5 starts at 43.50 (ends 51.40) |
| Algenib | 4.92 | 5.14 | 8.02 | 6.05 | Gravelly; the in-game noir Narrator's voice, which links the trailer to the game but may blur the two. Fits if VO5 starts at 43.50 (ends 51.52) |

The Gacrux and Algenib figures are audition measurements; re-measure the final clips if either is picked. Alnilam also read VO1 in a hushed, urgent style (4.37 s), as an alternative opening. If the chosen voice misreads "SAFETYNET", write "Safetynet" in that voice's TTS text only and keep the caption in capitals.

| Cue | Start | End | Over (picture) | Text | Words | Length (s) | Clear window (s) | Caption |
|---|---|---|---|---|---|---|---|---|
| VO1 | 0.60 | 5.714 | Title, before the first impact | First the hospitals. Then the power. | 6 | 5.114 | 0.00 to 6.77 | Burned 0.60 to 5.714, inside the title's end (5.767), clear of the keyhole art; a longer voice starts at 0.30 |
| VO2 | 13.10 | 17.136 | C1, the m10 forward post, the checkpoint | Ten missions. One enemy. | 4 | 4.036 | 12.81 to 17.21 | None (C1 shows the words) |
| VO3 | 25.40 | 32.327 | C2 into the montage: lockpick, badge clone, prints, biometric, keypad, a conversation | Pick the locks. Clone the badges. Don't get caught. | 9 | 6.927 | 24.49 to 34.86 | Hidden on C2; burned 26.331 to 32.327 |
| VO4 | 37.90 | 42.567 | C3 and the decoding shots | Decode the messages. Break the ciphers. | 6 | 4.667 | 37.86 to 51.80, shared with VO5 | Hidden on C3; burned 39.532 to 42.567 |
| VO5 | 44.00 | 50.945 | C4, the VM panel, the console run | Then log in. Real machines. Real CTF challenges. | 8 | 6.945 | shared with VO4 | Hidden on C4; burned 45.872 to 50.945 |
| VO6 | 56.85 | 60.819 | The flag accepted and the story reacting, then C5 | Every flag moves the story. | 5 | 3.969 | 56.83 to 65.67, shared with VO7 | Burned 56.85 to 59.931; hidden on C5 |
| VO7 (the clip voiced as VO7_alt) | 61.15 | 64.330 | C5, then the phone choice | Stuck? Ask your handler. | 4 | 3.180 | shared with VO6 | Hidden on C5; burned 62.334 to 64.330 |
| VO8 (the clip voiced as VO8_alt) | 71.70 | 74.860 | The walkthrough, then the ghost call | Walkthroughs for everyone. | 3 | 3.160 | 71.69 to 77.43 | Burned 71.70 to 74.86, through the turn to the ghost call |
| VO9 | 87.60 | 91.839 | C7a (first 1.3 s), then C7b | No other game does it like this. | 7 | 4.239 | 85.32 to 92.16 | None (C7b shows the words) |
| VO10 | 96.00 | 102.097 | The lone agent, then the close | SAFETYNET: Licence to Hack. Play now. | 6 | 6.097 | 95.99 to 104.17 | None (the close shows the name and "Play now") |

58 words in all. "Clear window" keeps 0.3 s from the nearest character line on each side. VO6 and VO7 share one window between Victoria and Irina: VO7 starts 0.33 s after VO6 ends, and its first word, "Stuck?", is the word on card C5, so the voice and the card say it together and the voice then adds the handler over the phone choice. VO6 runs 0.89 s into C5, the only cue that crosses from a shot into a card. VO8 is the one cue that does not fit the usual margin: its speech cannot start before 71.70 and "Walkthroughs for everyone." (the shortest voiced option) ends 0.53 s into the ghost call (S35, 74.327 to 74.995), 0.135 s before the withheld call (S36), which leads to "Meet ENTROPY". The ghost call has no character line, so nothing is spoken over, and the standard duck lowers its take audio. VO9 starts 2.0 s into C7a so that "does it like this" lands on C7b, and ends before the briefcase flash. Truth notes: hospitals are m02 and m03, the power grid m04 and m07; "Real CTF challenges" rests on every mission's VM flags being required in play; "Walkthroughs for everyone" is true (all ten mission walkthroughs are published and linked); VO9 is the owner's sentence (Q2 in the recipe has the alternatives); "Play now" is also on screen. VO7 and VO8 use the alternates voiced in the measured set; no cue needs new voicing.

Clearance from character lines (every gap at least 0.3 s):

| Cue | Character line before (ends) | Gap (s) | Character line after (starts) | Gap (s) |
|---|---|---|---|---|
| VO1 | none | | Netherton, S03 (7.066) | 1.35 |
| VO2 | Netherton, S03 (12.506) | 0.59 | HaX, S07 (17.512) | 0.38 |
| VO3 | Netherton, S08 (24.185) | 1.22 | Kemal, S18 (35.162) | 2.84 |
| VO4 | Kemal, S18 (37.562) | 0.34 | Victoria, S29 (52.100) | 9.53 |
| VO5 | Kemal, S18 (37.562) | 6.44 | Victoria, S29 (52.100) | 1.16 |
| VO6 | Victoria, S29 (56.530) | 0.32 | Irina, S33 (65.973) | 5.15 |
| VO7 | Victoria, S29 (56.530) | 4.62 | Irina, S33 (65.973) | 1.64 |
| VO8 | Irina, S33 (71.393) | 0.31 | Voltage, S37 (77.731) | 2.87 |
| VO9 | The Recruiter, S39 (85.019) | 2.58 | The Architect, S40 (92.459) | 0.62 |
| VO10 | The Architect, S40 (95.692) | 0.31 | none | |

Gaps between announcer cues: VO4 to VO5 1.43 s, VO6 to VO7 0.33 s. Every gap is measured to the end of the speech; the mp3 tail is silence and is trimmed in the edit, so the audible gaps are as listed.

V1 keeps every character line in the V2 table below; the announcer fills only the spaces between them.

Mix: announcer at full, music ducked 10 dB under each cue (the dialogue duck), title clip audio at -4 dB as the preset sets it.

## V2: episode-style (no narrator)

All spoken audio is the in-game character dialogue already in the take audio, voiced from the game's TTS cache when each take was recorded, so V2 needs no new TTS. V1 uses the same lines. Every line sits wholly inside its shot, so the burned caption shows all of it. The longest stretches with no voice in V2 are 24.19 to 35.16 s (the gadget montage, which ends on Kemal) and 37.56 to 52.10 s (decoding and the console run, carried by cards C3 and C4).

| Shot | Line (trailer clock) | Speaker | Line | Take, source window | Audio |
|---|---|---|---|---|---|
| S03 | 7.066 to 12.506 | Director Magnus Netherton | ENTROPY used to steal. Now they break the things people can't live without. | m04 t01c_briefing, 4.838 to 10.278 | In the take; used in the m04 trailer |
| S07 | 17.512 to 21.292 | Agent HaX | If they refuse and you're too slow, people die on the ward. | m02 t01_hax_hook, 11.97 to 15.75 | In the take; used in the m02 trailer |
| S08 | 21.725 to 24.185 | Director Magnus Netherton | Eight point four million people, Agent. | m07 t10_briefing, 30.22 to 32.68 | In the take; used in the m07 trailer. Cut before his next sentence (32.884), last 0.1 s faded |
| S18 | 35.162 to 37.562 | Kemal Aydin | Then come and move me. | m06 t29_kemal_picks, 42.03 to 44.43 | In the take; used in the m06 trailer. The narrator ends before the in point (42.000) |
| S29 | 52.100 to 56.530 | Victoria Sterling | Freelance pen testing. Some CTF work. Competent. | m03 t19_victoria_pitch, 18.26 to 22.69 | In the take; not used in a trailer before. Two natural pauses inside the line |
| S33 | 65.973 to 71.393 | Dr Irina Volkova | Satoshi is paranoid about doors and careless about passwords. | m06 t12_irina_badges, 24.137 to 29.46 | In the take; used in the m06 trailer |
| S37 | 77.731 to 79.721 | Voltage | I didn't bring a bomb, agent. | m04 t04_voltage | In the take; used in the m04 trailer |
| S38 | 80.141 to 81.611 | Voltage | I brought a maintenance schedule. | m04 t04_voltage | In the take; used in the m04 trailer |
| S39 | 82.459 to 85.019 | The Recruiter | Everyone has a price, agent. | m05 t10_recruiter_call, 146.83 to 149.39 | In the take; used in the m05 trailer |
| S40 | 92.459 to 95.692 | The Architect | Four fires tonight, and only one of you. | m07 t13c_architect_call_fx, 37.525 to 40.758 | In the take; used in the m07 trailer |

Captions: every line above is burned in all three aspects, except S07, S18 and S29 in 16:9, which are framed at zoom 1 so the game's own subtitle bar shows the line. In the take, S03's subtitle line begins "Agent 0x00.", which is spoken before the shot's in point; the burned caption leaves it out, and S03's 16:9 crop shows none of the game bar. S07's caption holds to the shot's end (21.525) and S38's starts at the shot's start (79.931), because both lines run faster than 3 words a second. Agent HaX's phone help (S31) is on screen as text, not voiced.

Cards (both versions): C1 "Ten Missions / One Enemy"; C2 "Pick. Clone. / Crack."; C3 "Encoding & / Encryption"; C4 "Real VMs. / Real Hacking."; C5 "Stuck? / Hints. Guides. / Walkthroughs."; C6 "Meet / ENTROPY"; C7a "Real VMs and CTF / In a Spy Story"; C7b "No Other Game / Does It Like This". Close: a burned line "SAFETYNET: Licence to Hack" and the preset's "Play now".

The trailer in short (both versions): the title; a hospital lobby on red alert, a plant in the dark; Netherton: ENTROPY now breaks what people can't live without; a ransom screen; "Ten Missions / One Enemy" over the m10 forward post at night and a checkpoint; HaX: people die on the ward; Netherton: eight point four million people; "Pick. Clone. / Crack." and the montage (locks, badges, prints, a biometric door, a keypad, a conversation, a money trail); Kemal blocks the way: "Then come and move me."; "Encoding & Encryption" and three decoding screens; "Real VMs. / Real Hacking.", the VM open in the game and five console cuts; Victoria reads the cover CV; the archive key goes in and Agent HaX answers; "Stuck?", the phone sends a field guide, Irina drops a hint, a walkthrough; two calls, then "Meet ENTROPY" on the biggest hit, Voltage and the Recruiter; the two USP cards; a briefcase flash; the Architect: four fires, one of you; a lone agent alone in the empty generator hall; the name and "Play now".
