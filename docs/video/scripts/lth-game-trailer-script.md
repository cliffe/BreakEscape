# Script: SAFETYNET: Licence to Hack game trailer (R1)

Plan and shot ids: `docs/video/recipes/lth-game-trailer.md`. Times are trailer seconds; the music (Emerald Trigger) starts at 0, so trailer time is track time. Main cut 104.77 s.

Rules for every line: the announcer never talks over a character line; no answers, codes or flag values; no tool or technique names; UK English.

Fit rule (house rule from the CA scripts): 2.3 words a second, plus 0.3 s per clause stop, 0.2 s lead and 0.15 s tail. "VMs" and "CTF" count as one word each. The announcer reads slower than a presenter, so every line below leaves at least 0.3 s spare at 2.3 words a second.

## V1: announcer

Delivery (TTS style annotation, passed as speech metadata, never in the text): "epic film-trailer announcer, deep and unhurried, low and close to the microphone, weight on the last word of each sentence, British". Model and language as `tools/video/scripts/narrate.rb` (gemini-3.8-flash-tts, en-GB).

Voice candidates (one line each, the same test line, on the review page):

| Candidate | Why |
|---|---|
| Alnilam | Firm and low; no in-game character uses it |
| Gacrux | Mature, weighty; no in-game character uses it |
| Algenib | Gravelly; it is the in-game noir Narrator's voice, which links the trailer to the game but may blur the two |

Test line for all three: VO9.

| Cue | Start | End | Window (picture) | Text | Words | Fit (s) |
|---|---|---|---|---|---|---|
| VO1 | 0.60 | 4.60 | Title, before the first impact | First the hospitals. Then the emergency lines. | 7 | 3.9 |
| VO2 | 14.60 | 17.40 | C1 and the three location flashes | Ten missions. One enemy. | 4 | 2.7 |
| VO3 | 24.85 | 32.20 | C2 and the gadget montage (no character lines) | Pick the locks. Clone the badges. Lift the prints. And don't get caught. | 13 | 7.2 |
| VO4 | 37.65 | 41.30 | C3 and the decoding shots | Decode the messages. Decrypt the ciphers. | 6 | 3.5 |
| VO5 | 43.95 | 49.20 | C4, the VM panel and console cuts | Then the real thing. Real virtual machines. Real hacking. | 9 | 5.2 |
| VO6 | 53.70 | 59.60 | Console hold, flag station, C5 | Every flag you capture on a live machine moves the story on. | 12 | 5.9 |
| VO7 | 59.60 | 62.30 | End of C5, C6, the phone opening | Stuck? Call your handler. | 4 | 2.7 |
| VO8 | 65.85 | 73.70 | S36a, S36b, S37, S38 (V1 slot, no character lines) | Ask the people around you. Check your field notes. And every mission has a walkthrough. | 15 | 7.8 |
| VO9 | 85.65 | 91.95 | C8a, C8b, the crescendo flashes | No other game puts real VMs and CTF challenges inside a spy story. | 13 | 6.3 |
| VO10 | 98.20 | 101.80 | Close: curtain and logo | SAFETYNET: Licence to Hack. Play now. | 6 | 3.6 |

89 words in all. VO1 truth: hospitals are m02 and m03, emergency call lines are m05. VO8's last sentence depends on Q8 (all ten walkthroughs published); fallback "And if you need it, there's a walkthrough." (8 words, 4.2 s). VO9 is the owner's claim, nothing added. VO10 sits over the curtain; "Play now" is also on screen.

Character lines kept in V1 (their windows have no announcer): S03, S04, S08, S09, S35, S41 and S42, S43 and S44, S45 and S46 (see V2 for text). V1 drops S36 (Irina) and uses S36a and S36b instead, so VO8 has a clear window.

Mix: VO at full, music ducked 10 dB under each cue (the dialogue duck), title clip audio at -4 dB as the preset sets it.

## V2: episode-style (no narrator)

All spoken audio is the in-game character dialogue already in the take audio. Every line below was voiced from the game's TTS cache when its take was recorded, so no new TTS is needed for V2. "Cached audio" says where that is confirmed.

| Shot | Time | Speaker | Line | Take | Cached audio |
|---|---|---|---|---|---|
| S03 | 6.978 to 11.478 | Director Magnus Netherton | ENTROPY used to steal. Now they break the things people can't live without. | m04 t01c_briefing | In the take; shipped in the m04 trailer |
| S04 | 11.478 to 14.466 | Agent HaX | If they refuse and you're too slow, people die on the ward. | m02 t01_hax_hook | In the take; shipped in m02 |
| S08 | 18.374 to 22.041 | ATHENA | The leak came from inside this building. | m08 t10_athena_hook | In the take; shipped in m08 |
| S09 | 22.041 to 24.773 | Director Magnus Netherton | Eight point four million people, Agent. | m07 t10_briefing | In the take; shipped in m07 |
| S35 | 62.334 to 65.736 | Agent HaX (phone) | Top row. The third breaker from the left feeds the shutter. | m10 t12_power_room | In the take (recorded with the HaX phone voice on); m10 trailer not signed off |
| S36 | 65.736 to 71.529 | Dr Irina Volkova | Satoshi is paranoid about doors and careless about passwords. | m06 t12_irina_badges | In the take; shipped in m06 |
| S41, S42 | 77.531 to 82.338 | Voltage | I didn't bring a bomb, agent. / I brought a maintenance schedule. | m04 t04_voltage | In the take; shipped in m04 |
| S43, S44 | 82.338 to 85.569 | The Recruiter | Everyone has a price, agent. / I'm asking what yours is. | m05 t10_recruiter_call | In the take; shipped in m05 |
| S45, S46 | 92.334 to 96.769 | The Architect | Four fires tonight, and only one of you. / I set them so you'd have to choose. | m07 t13c_architect_call_fx | In the take; shipped in m07 |

Agent HaX's text-chat phone lines (S34, and S36a in V1) are on screen as text, not voiced: the scouts found no cached audio for the phone handler id (m01 and m03 scout reports), and none is needed.

Cards (both versions): C1 "Ten Missions / One Enemy"; C2 "Pick. Clone. / Dust. Crack."; C3 "Decode. / Decrypt."; C4 "Real VMs. / Real Hacking."; C5 "Every Flag / Moves the Story"; C6 "Stuck? / Call HaX."; C7 "Meet / ENTROPY"; C8a "Real VMs and CTF / Inside a Spy Story"; C8b "No Other Game / Does This". Close: "Play now".

V2 sequence in short: title; lights strike and two briefing lines; "Ten Missions"; the stakes; the gadgets montage; "Decode. Decrypt."; "Real VMs. Real Hacking." and the console run; the flag station and "Every Flag Moves the Story"; "Stuck? Call HaX.", HaX on the phone, an NPC hint, notes, the walkthrough; "Meet ENTROPY" on the biggest hit, Voltage and the Recruiter; the two USP cards in the breakdown; five gadget flashes; the Architect's line; the close.

## Next round

Script review rounds before any TTS or render (memory, trailer script rounds): Opus on sell and truth, Sonnet on silent viewing and timing. The test line VO9 goes to all three voices only after the script is clean.
