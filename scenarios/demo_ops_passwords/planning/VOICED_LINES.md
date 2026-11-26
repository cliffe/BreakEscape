# demo_ops_passwords: voiced lines (text only)

Regenerated after the tour's final line edits (round 2) from `BreakEscape::TtsLineExtractor` (`bin/rails runner tools/video/scout/dump-lines.rb demo_ops_passwords <out.json>`), so it lists exactly what the batch would voice: each NPC's ink, Ama's event barks, the NPC chatter pools and the scenario's shared chatter pools (spoken by any NPC; listed under the NPC the extractor files them for). No audio exists yet. Word caps: 30 face to face (every line here is face to face). No line prints a variable, and none names a password, a fact value or a code. Choices the player picks are not voiced. `printer_svc` has no `voice` block and is not voiced. Feed posts are text, listed at the end for the record.

## ama_owusu (129 lines, voice Autonoe)

| # | Source | Line | Words |
|---|---|---|---|
| 1 | ink start | I'm Ama, from Fenlow. We look after the IT here. | 10 |
| 2 | ink start | Someone left a box of old password records in the confidential waste. | 12 |
| 3 | ink start | Show the partners why that matters. Come back and tell me what you find, and I'll tick it off. | 19 |
| 4 | ink hub | What can I help with? | 5 |
| 5 | ink hub | Go on. I'll be here. | 5 |
| 6 | ink whats_next | You've got two things about Delphine. Tell me what you learnt. | 11 |
| 7 | ink whats_next | Delphine posts on the office feed. Read it on the tablet in the kitchen. | 14 |
| 8 | ink whats_next | If she hasn't posted yet, I can ask about her weekend. | 11 |
| 9 | ink whats_next | Her desk photo tells you more. Ask me to send them for coffee, and take it while she's away. | 19 |
| 10 | ink whats_next | The records are in the bin in the IT room, and Graham sits right there. | 15 |
| 11 | ink whats_next | Walk round the kitchen, the IT room and the partner's office first. | 12 |
| 12 | ink whats_next | Then ask me to send them to lunch, and the room empties. | 12 |
| 13 | ink whats_next | Search the confidential-waste bin in the IT room. Take all three record files. | 13 |
| 14 | ink whats_next | Open the capture log in your inventory. Crack Delphine's record with both things you learnt, then tell me. | 18 |
| 15 | ink whats_next | There's a printer admin note in the cupboard by the printers. Take it. | 13 |
| 16 | ink whats_next | Then crack Graham's record from the file in your inventory. It's salted, so every guess takes longer. Wait for it. | 20 |
| 17 | ink whats_next | If you pressed Crack before you had the note, run it again now. | 13 |
| 18 | ink whats_next | Try Julian's record. Try it twice, then tell me. | 9 |
| 19 | ink whats_next | Sign in at Delphine's PC with her password once she's left it. | 12 |
| 20 | ink whats_next | Plug the USB stick into the port on Delphine's desk. | 10 |
| 21 | ink whats_next | Julian's at his desk until his client lunch. Ask me to send them to lunch. | 15 |
| 22 | ink whats_next | Julian's out at his client lunch. Sign in at his PC as Graham. | 13 |
| 23 | ink whats_next | Open Client files in Julian's profile, then tell me. Delphine's sign-in never could. | 13 |
| 24 | ink whats_next | Back at Julian's PC as Graham, plug the keystroke device into the socket beside it. | 15 |
| 25 | ink whats_next | Ask me to send them for coffee, then sign in at Delphine's PC as Graham and try the stick in her port again. | 23 |
| 26 | ink whats_next | Back at Julian's PC as Graham, use Cached accounts on its desktop, then tell me. | 15 |
| 27 | ink whats_next | Sign in at the hot desk as Graham and collect what it remembers, then tell me. | 16 |
| 28 | ink whats_next | Now ask me to switch Jun's PC off, and watch where he goes. Do it before you call it a day. | 21 |
| 29 | ink whats_next | Collect at the hot desk again, as Graham, then tell me. And ask me to switch Jun's PC back on, or he'll keep coming back. | 25 |
| 30 | ink whats_next | Crack one of the records you collected. A weak one falls at once. Then tell me. | 16 |
| 31 | ink whats_next | Graham's rota talks about a shared desk account. Its record is in the IT room. Crack it, then try it at Delphine's PC. | 23 |
| 32 | ink whats_next | Ask me to send them for coffee, then type the name and password under Other user. | 16 |
| 33 | ink whats_next | Now sign out at Julian's PC and try the shared desk account there. See what the sign-in screen says, then tell me. | 22 |
| 34 | ink whats_next | You've done the hands-on part. Tell me to call it a day. | 12 |
| 35 | ink whats_next | Open the sign-in log terminal in the IT room. Find your own rows, then flag the night-time failure. | 18 |
| 36 | ink whats_next | That's everything. Look round as long as you like. | 9 |
| 37 | ink whats_next | The printer account won't open any PC here. Try it if you like. | 13 |
| 38 | ink whats_next | Next time Graham's away from his desk, try that password on his PC. Same password, typed by hand. | 18 |
| 39 | ink tell_facts | Good. Two different places, two things she shares without a thought. | 11 |
| 40 | ink tell_facts | Keep both. A cracker needs them. | 6 |
| 41 | ink tell_crack_guessable | Her dog's name and the year it came home. That was all it took. | 14 |
| 42 | ink tell_crack_reused | Graham's password was the printer account's too. | 7 |
| 43 | ink tell_crack_reused | One person, one password, two accounts. That's reuse. | 8 |
| 44 | ink tell_crack_strong | Long and random, so guessing never gets there. | 8 |
| 45 | ink tell_profile | An administrator reaches what a user can't. That's the real cost. | 11 |
| 46 | ink tell_collect_partner | Julian's PC remembers who signed in. An administrator gets the stored records, never the passwords. | 15 |
| 47 | ink tell_collect_hot_desk | One record, Niamh's. Whoever uses a PC leaves a record behind. | 11 |
| 48 | ink tell_collect_hot_desk_late | Two records, Niamh's and Jun's. He'd already borrowed the desk, so it cached him too. | 15 |
| 49 | ink tell_collect_after_borrow | Now it remembers Jun as well. He signed in there, so it cached him. | 14 |
| 50 | ink tell_crack_cached | A weak password falls whatever PC it came from. | 9 |
| 51 | ink tell_local_refused | Refused, and no lockout counted. A local account works only on the PCs it was set up on, and Julian's isn't one. | 22 |
| 52 | ink lever_jun_off | I'll flick the switch at the wall. Watch what Jun does. | 11 |
| 53 | ink lever_jun_on | Back on again. | 3 |
| 54 | ink lever_jun_post | I'll ask Jun what he's been up to. Give him a minute. | 12 |
| 55 | ink cooler | Graham and Niamh, same time every day. Habits like that tell an intruder when a room's empty. | 17 |
| 56 | ink lever_coffee | I'll tell them the coffee's on. | 6 |
| 57 | ink lever_weekend | I'll ask Delphine how her weekend went. Give her a minute. | 11 |
| 58 | ink lever_lunch | Walk round first, so you know who sits where. The kitchen, the IT room and the partner's office. | 18 |
| 59 | ink lever_lunch | Then come back and I'll send them to lunch. | 9 |
| 60 | ink lever_lunch | Right. Lunch for everyone. Watch the rooms empty. | 8 |
| 61 | ink lever_day_end | Not yet. There's still some of today's list to do. | 10 |
| 62 | ink lever_day_end | The staff won't be back once they've gone home. Seen everything you wanted? | 13 |
| 63 | ink lever_day_end | Take your time. | 3 |
| 64 | ink day_end_go | Right. Home time for nearly all of them. | 8 |
| 65 | ink day_end_go | Graham stays. Ask him about the log. | 7 |
| 66 | ink lever_day_refused | Take your time. Ask me what's next if you're not sure. | 11 |
| 67 | ink recap | Nothing to look back on yet. Have a go first. | 10 |
| 68 | ink recap | That's all of it so far. Ask for the short version at the end. | 14 |
| 69 | ink recap | Borrowing left Jun's account on the hot desk. | 8 |
| 70 | ink recap | Each override left a row in the log. An administrator can get round a rule, but not quietly. | 18 |
| 71 | ink recap | A local account isn't part of the domain, so only the desks it was made on know it. | 18 |
| 72 | ink recap | One shared desk password would open every desk it covers. That's why it must not be weak. | 17 |
| 73 | ink recap | A remembered record cracks like any other. | 7 |
| 74 | ink recap | The hot desk still held Niamh's record from when she'd used it. | 12 |
| 75 | ink recap | Jun couldn't work, so he borrowed a PC and left it signed in. | 13 |
| 76 | ink recap | An administrator can collect what a PC remembers. | 8 |
| 77 | ink recap | The log kept all of it, including the night someone tried Graham's PC. | 13 |
| 78 | ink recap | The administrator could plug in what the policy blocks for everyone else. | 12 |
| 79 | ink recap | Julian's folders opened because the sign-in was an administrator's. | 9 |
| 80 | ink recap | An administrator's sign-in opens PCs that aren't theirs. | 8 |
| 81 | ink recap | A user can't get past the USB block, and can't change the rule either. | 14 |
| 82 | ink recap | A user's sign-in opens that user's desk, and no more. | 10 |
| 83 | ink recap | Julian's held. Long and random passwords are why. | 8 |
| 84 | ink recap | Graham's was salted, so it took a wait, but you already held the same password. | 15 |
| 85 | ink recap | Her record fell at once. A password made of her own life is weak. | 14 |
| 86 | ink recap | A stored record isn't safe just because it isn't plain text. | 11 |
| 87 | ink recap | People give away what a guesser needs, and they don't notice. | 11 |
| 88 | ink recap | There's more. Ask me again. | 5 |
| 89 | ink short_version | People share what a guesser needs, and a stolen record falls to it. | 13 |
| 90 | ink short_version | A reused password opens more than one account. A long random one doesn't fall. | 14 |
| 91 | ink short_version | A user's sign-in opens one desk. An administrator's opens other people's. | 11 |
| 92 | ink short_version | A PC remembers who used it, and a shared local password falls wherever it's used. | 15 |
| 93 | ink short_version | And the log remembers all of it. | 7 |
| 94 | npc.bark | Morning! Come and find me when you're ready. | 8 |
| 95 | npc.bark | Delphine's posted on the office feed. Have a read. | 9 |
| 96 | npc.bark | Graham's off to the kitchen, and Julian's gone to his client lunch. | 12 |
| 97 | npc.bark | His PC blocks devices, but an administrator's session let it through. That window's the office network. Close it for today. | 20 |
| 98 | npc.bark | Same stick, same port. Signed in as an administrator, the policy let it through, and the log keeps an override row. | 21 |
| 99 | npc.bark | Stored records, scrambled. None shows a password. Cracking is guessing, checked against them. | 13 |
| 100 | npc.bark | A cracked password works like any other, and the PC even offered it. She's an ordinary user, so no Administrator on the taskbar. | 23 |
| 101 | npc.bark | The desk policy refused the stick. That's a rule doing its job. | 12 |
| 102 | npc.bark | Graham is an administrator, so this session is one. The taskbar said Administrator. | 13 |
| 103 | npc.bark | His PC was down, so he borrowed the hot desk. That's a workaround, and it leaves something behind. | 18 |
| 104 | npc.bark | A shared desk account, cracked like any other. It works on the desks it covers. | 15 |
| 105 | scenario.chatter | Go on, after you. | 4 |
| 106 | scenario.chatter | Is there any milk left? | 5 |
| 107 | scenario.chatter | This machine takes forever. | 4 |
| 108 | scenario.chatter | Strong one today? | 3 |
| 109 | scenario.chatter | Who keeps taking the mugs? | 5 |
| 110 | scenario.chatter | Busy morning? | 2 |
| 111 | scenario.chatter | Did you see the car park email? | 7 |
| 112 | scenario.chatter | Friday drinks again? | 3 |
| 113 | scenario.chatter | How was the weekend? | 4 |
| 114 | scenario.chatter | Is it raining again? | 4 |
| 115 | scenario.chatter | Train was late again. | 4 |
| 116 | scenario.chatter | Any plans for lunch? | 4 |
| 117 | scenario.chatter | Quiet one today, isn't it? | 5 |
| 118 | scenario.chatter | Have you tried the new sandwich place? | 7 |
| 119 | scenario.chatter | Who switched the coffee off? | 5 |
| 120 | scenario.chatter | It's off. Typical. | 3 |
| 121 | scenario.chatter | No coffee here, then. | 4 |
| 122 | scenario.chatter | Missed it. | 2 |
| 123 | scenario.chatter | Who's the cake from? | 4 |
| 124 | scenario.chatter | Go on, just a small slice. | 6 |
| 125 | scenario.chatter | Whose birthday is it? | 4 |
| 126 | scenario.chatter | This is really good. | 4 |
| 127 | scenario.chatter | My PC's dead. Brilliant. | 4 |
| 128 | scenario.chatter | Why is it off? | 4 |
| 129 | scenario.chatter | I'll use the hot desk. | 5 |

## delphine_arvanitis (32 lines, voice Despina)

| # | Source | Line | Words |
|---|---|---|---|
| 130 | ink start | Hello. You're the visitor Ama mentioned. | 6 |
| 131 | ink hub | Yes? | 1 |
| 132 | ink hub | The moment I get up, it locks itself. IT insisted. | 10 |
| 133 | ink hub | Niamh says I post too much. It's only photos and little updates. | 12 |
| 134 | ink hub | Thanks. | 1 |
| 135 | npc.chatter | Is that the last of the oat milk? | 8 |
| 136 | npc.chatter | I'll only be a minute. | 5 |
| 137 | scenario.chatter | Go on, after you. | 4 |
| 138 | scenario.chatter | Is there any milk left? | 5 |
| 139 | scenario.chatter | This machine takes forever. | 4 |
| 140 | scenario.chatter | Strong one today? | 3 |
| 141 | scenario.chatter | Who keeps taking the mugs? | 5 |
| 142 | scenario.chatter | Busy morning? | 2 |
| 143 | scenario.chatter | Did you see the car park email? | 7 |
| 144 | scenario.chatter | Friday drinks again? | 3 |
| 145 | scenario.chatter | How was the weekend? | 4 |
| 146 | scenario.chatter | Is it raining again? | 4 |
| 147 | scenario.chatter | Train was late again. | 4 |
| 148 | scenario.chatter | Any plans for lunch? | 4 |
| 149 | scenario.chatter | Quiet one today, isn't it? | 5 |
| 150 | scenario.chatter | Have you tried the new sandwich place? | 7 |
| 151 | scenario.chatter | Who switched the coffee off? | 5 |
| 152 | scenario.chatter | It's off. Typical. | 3 |
| 153 | scenario.chatter | No coffee here, then. | 4 |
| 154 | scenario.chatter | Missed it. | 2 |
| 155 | scenario.chatter | Who's the cake from? | 4 |
| 156 | scenario.chatter | Go on, just a small slice. | 6 |
| 157 | scenario.chatter | Whose birthday is it? | 4 |
| 158 | scenario.chatter | This is really good. | 4 |
| 159 | scenario.chatter | My PC's dead. Brilliant. | 4 |
| 160 | scenario.chatter | Why is it off? | 4 |
| 161 | scenario.chatter | I'll use the hot desk. | 5 |

## graham_whitfield (38 lines, voice Umbriel)

| # | Source | Line | Words |
|---|---|---|---|
| 162 | ink start | Now then. You'll be the visitor. | 6 |
| 163 | ink hub | Go on, then. | 3 |
| 164 | ink hub | I've one I like. Why would I change it? | 9 |
| 165 | ink hub | Right you are. | 3 |
| 166 | ink log_offer | Every sign-in leaves a row. Open the log terminal and find yours. | 12 |
| 167 | ink log_offer | Then look at the small hours. Someone tried my PC in the night. Flag that row. | 16 |
| 168 | ink rota | Tuesdays I do the desk rounds on the shared desk account. One login, three desks. | 15 |
| 169 | ink rota | The rota says which. Don't ask me about the old backups cabinet. | 12 |
| 170 | ink exchange_cooler_chat | Kettle's on its last legs, Niamh. | 6 |
| 171 | ink exchange_cooler_chat | Not mine. I drink from the pot. | 7 |
| 172 | ink exchange_cooler_chat | Suits me. | 2 |
| 173 | npc.chatter | How's tricks, then? | 3 |
| 174 | npc.chatter | Nobody tells me anything up here. | 6 |
| 175 | scenario.chatter | Go on, after you. | 4 |
| 176 | scenario.chatter | Is there any milk left? | 5 |
| 177 | scenario.chatter | This machine takes forever. | 4 |
| 178 | scenario.chatter | Strong one today? | 3 |
| 179 | scenario.chatter | Who keeps taking the mugs? | 5 |
| 180 | scenario.chatter | Busy morning? | 2 |
| 181 | scenario.chatter | Did you see the car park email? | 7 |
| 182 | scenario.chatter | Friday drinks again? | 3 |
| 183 | scenario.chatter | How was the weekend? | 4 |
| 184 | scenario.chatter | Is it raining again? | 4 |
| 185 | scenario.chatter | Train was late again. | 4 |
| 186 | scenario.chatter | Any plans for lunch? | 4 |
| 187 | scenario.chatter | Quiet one today, isn't it? | 5 |
| 188 | scenario.chatter | Have you tried the new sandwich place? | 7 |
| 189 | scenario.chatter | Who switched the coffee off? | 5 |
| 190 | scenario.chatter | It's off. Typical. | 3 |
| 191 | scenario.chatter | No coffee here, then. | 4 |
| 192 | scenario.chatter | Missed it. | 2 |
| 193 | scenario.chatter | Who's the cake from? | 4 |
| 194 | scenario.chatter | Go on, just a small slice. | 6 |
| 195 | scenario.chatter | Whose birthday is it? | 4 |
| 196 | scenario.chatter | This is really good. | 4 |
| 197 | scenario.chatter | My PC's dead. Brilliant. | 4 |
| 198 | scenario.chatter | Why is it off? | 4 |
| 199 | scenario.chatter | I'll use the hot desk. | 5 |

## julian_sallow (29 lines, voice Rasalgethi)

| # | Source | Line | Words |
|---|---|---|---|
| 200 | ink start | Ah, the visitor. Keep it brief, I've a client lunch later. | 11 |
| 201 | ink hub | Quickly, then. | 2 |
| 202 | ink hub | Long and random, from a manager. I couldn't tell you one if you asked. | 14 |
| 203 | ink hub | Good. | 1 |
| 204 | scenario.chatter | Go on, after you. | 4 |
| 205 | scenario.chatter | Is there any milk left? | 5 |
| 206 | scenario.chatter | This machine takes forever. | 4 |
| 207 | scenario.chatter | Strong one today? | 3 |
| 208 | scenario.chatter | Who keeps taking the mugs? | 5 |
| 209 | scenario.chatter | Busy morning? | 2 |
| 210 | scenario.chatter | Did you see the car park email? | 7 |
| 211 | scenario.chatter | Friday drinks again? | 3 |
| 212 | scenario.chatter | How was the weekend? | 4 |
| 213 | scenario.chatter | Is it raining again? | 4 |
| 214 | scenario.chatter | Train was late again. | 4 |
| 215 | scenario.chatter | Any plans for lunch? | 4 |
| 216 | scenario.chatter | Quiet one today, isn't it? | 5 |
| 217 | scenario.chatter | Have you tried the new sandwich place? | 7 |
| 218 | scenario.chatter | Who switched the coffee off? | 5 |
| 219 | scenario.chatter | It's off. Typical. | 3 |
| 220 | scenario.chatter | No coffee here, then. | 4 |
| 221 | scenario.chatter | Missed it. | 2 |
| 222 | scenario.chatter | Who's the cake from? | 4 |
| 223 | scenario.chatter | Go on, just a small slice. | 6 |
| 224 | scenario.chatter | Whose birthday is it? | 4 |
| 225 | scenario.chatter | This is really good. | 4 |
| 226 | scenario.chatter | My PC's dead. Brilliant. | 4 |
| 227 | scenario.chatter | Why is it off? | 4 |
| 228 | scenario.chatter | I'll use the hot desk. | 5 |

## niamh_doherty (33 lines, voice Kore)

| # | Source | Line | Words |
|---|---|---|---|
| 229 | ink start | Oh, hello. Mind the mugs. | 5 |
| 230 | ink hub | What's up? | 2 |
| 231 | ink hub | Delphine's on there again. Mostly the dog. | 7 |
| 232 | ink hub | See you. | 2 |
| 233 | ink exchange_cooler_chat | So are the mugs, Graham. | 5 |
| 234 | ink exchange_cooler_chat | You would. Same time tomorrow? | 5 |
| 235 | npc.chatter | Delphine's dog is on the feed again. | 7 |
| 236 | npc.chatter | Did you see the photo on her desk? | 8 |
| 237 | scenario.chatter | Go on, after you. | 4 |
| 238 | scenario.chatter | Is there any milk left? | 5 |
| 239 | scenario.chatter | This machine takes forever. | 4 |
| 240 | scenario.chatter | Strong one today? | 3 |
| 241 | scenario.chatter | Who keeps taking the mugs? | 5 |
| 242 | scenario.chatter | Busy morning? | 2 |
| 243 | scenario.chatter | Did you see the car park email? | 7 |
| 244 | scenario.chatter | Friday drinks again? | 3 |
| 245 | scenario.chatter | How was the weekend? | 4 |
| 246 | scenario.chatter | Is it raining again? | 4 |
| 247 | scenario.chatter | Train was late again. | 4 |
| 248 | scenario.chatter | Any plans for lunch? | 4 |
| 249 | scenario.chatter | Quiet one today, isn't it? | 5 |
| 250 | scenario.chatter | Have you tried the new sandwich place? | 7 |
| 251 | scenario.chatter | Who switched the coffee off? | 5 |
| 252 | scenario.chatter | It's off. Typical. | 3 |
| 253 | scenario.chatter | No coffee here, then. | 4 |
| 254 | scenario.chatter | Missed it. | 2 |
| 255 | scenario.chatter | Who's the cake from? | 4 |
| 256 | scenario.chatter | Go on, just a small slice. | 6 |
| 257 | scenario.chatter | Whose birthday is it? | 4 |
| 258 | scenario.chatter | This is really good. | 4 |
| 259 | scenario.chatter | My PC's dead. Brilliant. | 4 |
| 260 | scenario.chatter | Why is it off? | 4 |
| 261 | scenario.chatter | I'll use the hot desk. | 5 |

## jun_watanabe (39 lines, voice Puck)

| # | Source | Line | Words |
|---|---|---|---|
| 262 | ink start | Oh, hi. Sorry, I'm a bit swamped. | 7 |
| 263 | ink hub | Sorry, still swamped. | 3 |
| 264 | ink hub | Always. At least the printer's behaving. | 6 |
| 265 | ink hub | Dead as a doornail. I can't get a thing done. | 10 |
| 266 | ink hub | I'll have to try the hot desk. | 7 |
| 267 | ink hub | Only till mine's back. I never log out of borrowed PCs. Is that bad? | 14 |
| 268 | ink hub | No worries. | 2 |
| 269 | npc.chatter | Third one today. Don't judge. | 5 |
| 270 | npc.chatter | Did you see that new rota? | 6 |
| 271 | npc.chatter | It's dead. Of course it's dead. | 6 |
| 272 | npc.chatter | Who switched my PC off? | 5 |
| 273 | npc.chatter | I only just saved that. | 5 |
| 274 | npc.chatter | I can't work like this. | 5 |
| 275 | npc.chatter | Right. That's it. The hot desk. | 6 |
| 276 | scenario.chatter | Go on, after you. | 4 |
| 277 | scenario.chatter | Is there any milk left? | 5 |
| 278 | scenario.chatter | This machine takes forever. | 4 |
| 279 | scenario.chatter | Strong one today? | 3 |
| 280 | scenario.chatter | Who keeps taking the mugs? | 5 |
| 281 | scenario.chatter | Busy morning? | 2 |
| 282 | scenario.chatter | Did you see the car park email? | 7 |
| 283 | scenario.chatter | Friday drinks again? | 3 |
| 284 | scenario.chatter | How was the weekend? | 4 |
| 285 | scenario.chatter | Is it raining again? | 4 |
| 286 | scenario.chatter | Train was late again. | 4 |
| 287 | scenario.chatter | Any plans for lunch? | 4 |
| 288 | scenario.chatter | Quiet one today, isn't it? | 5 |
| 289 | scenario.chatter | Have you tried the new sandwich place? | 7 |
| 290 | scenario.chatter | Who switched the coffee off? | 5 |
| 291 | scenario.chatter | It's off. Typical. | 3 |
| 292 | scenario.chatter | No coffee here, then. | 4 |
| 293 | scenario.chatter | Missed it. | 2 |
| 294 | scenario.chatter | Who's the cake from? | 4 |
| 295 | scenario.chatter | Go on, just a small slice. | 6 |
| 296 | scenario.chatter | Whose birthday is it? | 4 |
| 297 | scenario.chatter | This is really good. | 4 |
| 298 | scenario.chatter | My PC's dead. Brilliant. | 4 |
| 299 | scenario.chatter | Why is it off? | 4 |
| 300 | scenario.chatter | I'll use the hot desk. | 5 |

## Totals

300 lines; longest 25 words; none over the cap.

## Feed posts (text, not voiced)

| Person | Post id | Text |
|---|---|---|
| delphine_arvanitis | delphine_post_1 | Ten years since the best decision of my life. Our dog came home in 2016 and has run the house ever since. |
| delphine_arvanitis | delphine_post_2 | Walked for two hours. Muddy paws on every chair in the house. |
| delphine_arvanitis | delphine_post_3 | Reception tip: the red folder is not a coaster. |
| niamh_doherty | niamh_post_1 | Who ate my yoghurt? It had my name on it. Twice. |
| niamh_doherty | niamh_post_2 | Printer jammed again. I am not touching it. |
