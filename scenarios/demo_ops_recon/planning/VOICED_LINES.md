# demo_ops_recon: voiced lines (text only)

Voice audio is decided later (SHOWCASE_PLAN.md section 9); this is the list a later batch would use. Nothing here is generated or cached. Word caps: 30 face to face, 25 on the phone (all lines here are face to face). A line over the cap is marked LONG. No line prints a variable. Chidi, Jun and Agnieszka keep the `office_life_showcase` voice blocks verbatim, so their pooled lines that match that scenario reuse its cache. Regenerated in round 1 from the ink and the scenario file; lines new or changed since the build are listed again under "Changed in round 1".

## ama_owusu

| # | Source | Line | Words |
|---|---|---|---|
| 1 | ink start | I'm Ama, from Fenlow. Merrin and Sallow want to know what an outsider could learn from one spare network port. | 20 |
| 2 | ink start | This drop box is yours. Plug it in when nobody is looking, and I'll point out each step. | 18 |
| 3 | ink hub | What can I help with? | 5 |
| 4 | ink hub | Anything else? | 2 |
| 5 | ink hub | Go on. | 2 |
| 6 | ink hub | Go on. I'll be here. | 5 |
| 7 | ink whats_next | Find the hot desk and its network port. Plug the drop box in while Jun is away from it. | 19 |
| 8 | ink whats_next | Jun goes for coffee now and then, or I can send him and Chidi. Be off the port before he's back. | 21 |
| 9 | ink whats_next | Open the drop box in your inventory and sweep the office network. See what answers. | 15 |
| 10 | ink whats_next | Scan the printer to see what it runs. | 8 |
| 11 | ink whats_next | Check the printer's admin page. It reports two weaknesses. Test both to see which is real. | 16 |
| 12 | ink whats_next | There's a technique card in the printer cupboard. Use it on the weakness that's real. | 15 |
| 13 | ink whats_next | Now try the file server the same way, in the Terminal view. Same moves, typed. | 15 |
| 14 | ink whats_next | Then come back and tell me what it said. | 9 |
| 15 | ink whats_next | The rest needs the evening. Tell me to call it a day. | 12 |
| 16 | ink whats_next | The rest needs the evening. Look in on the kitchen and the server room first, then tell me to call it a day. | 23 |
| 17 | ink whats_next | Zainab stays late. She'll be in the server room or at the kitchen coffee. She has a card for you. | 20 |
| 18 | ink whats_next | Use Zainab's card on the file server's update weakness. That gets you a user session. | 15 |
| 19 | ink whats_next | Then test the left-open setting, and use the card from her tool roll on it. That's an admin session, and the shared drive. | 23 |
| 20 | ink whats_next | Go and see Graham in IT. He'll show you the network log. | 12 |
| 21 | ink whats_next | That's the lot. Ask for the short version, or stay and look round. | 13 |
| 22 | ink lever_coffee | Right. A coffee run. Chidi and Jun will head for the machine. | 12 |
| 23 | ink lever_coffee | Anyone still at the hot desk port when Jun comes back gets caught. | 13 |
| 24 | ink lever_lunch | Have a look in the kitchen first. That's where they eat. | 11 |
| 25 | ink lever_lunch | Lunch, then. Staff drift off their desks, Jun included. | 9 |
| 26 | ink lever_day_end | Look in on the kitchen and the server room first. Zainab works in the server room, and she'll want the kitchen later. | 22 |
| 27 | ink lever_day_end | Seen what you wanted? Once they've gone home, it's just Zainab and Graham. | 13 |
| 28 | ink lever_day_end | Right. Home time for nearly everyone. | 6 |
| 29 | ink lever_day_end | Zainab will head for the kitchen coffee, and Graham will show you the log. | 14 |
| 30 | ink lever_day_end | Take your time. | 3 |
| 31 | ink terminal_talk | Good. What did the file server say? | 7 |
| 32 | ink terminal_talk | That's the banner. It tells you what to look up before you guess. | 13 |
| 33 | ink terminal_talk | Same findings, same names. The Terminal shows the addresses and banners the panels tidy away. | 15 |
| 34 | ink terminal_talk | Try it, then tell me. | 5 |
| 35 | ink terminal_ticked | Panels and Terminal are two views of the same thing. Switch between them any time. | 15 |
| 36 | ink recap | Which part? | 2 |
| 37 | ink recap_morning | The drop box on the port gave you a foothold. No password needed, only a free cable. | 17 |
| 38 | ink recap_morning | The sweep listed what answers. Machines you never touched, found from one port. | 13 |
| 39 | ink recap_morning | The scan showed what the printer runs, service by service. | 10 |
| 40 | ink recap_midday | Testing sorted the weakness that's real from the one that's a false alarm. | 13 |
| 41 | ink recap_midday | The card turned the printer's factory account into a saved link to Agnieszka's PC. | 14 |
| 42 | ink recap_midday | The Terminal showed the same findings, typed, with each machine's address and banner. | 13 |
| 43 | ink recap_evening | The shared drive took two steps, a user session and then an administrator's. | 13 |
| 44 | ink recap_evening | The log kept every step you took, so someone could spot you afterwards. | 13 |
| 45 | ink short_version | One cable shows a lot. Sweep the network, then scan each machine. | 12 |
| 46 | ink short_version | Reported weaknesses are only reports. Test each one before you trust it. | 12 |
| 47 | ink short_version | A technique fits one kind of weakness, and some need a user session first. | 14 |
| 48 | ink short_version | Everything you did is in the network log. That's how defenders find you. | 13 |
| 49 | bark room_entered:office | Morning! Come and find me when you're ready. | 8 |
| 50 | bark network_foothold_gained:hotdesk_jack | You're in. Now see what answers. | 6 |
| 51 | bark network_device_unplugged:hotdesk_jack | Unplugged. Every session through that box has ended with it. | 10 |
| 52 | bark global_variable_changed:printer_off | Printer's off. It won't answer on the network now. | 9 |
| 53 | bark network_foothold_gained:kitchen_jack | That works too. Nobody's watching the kitchen port. | 8 |
| 54 | bark global_variable_changed:sweep_done | That's everything that answers. Pick the printer and scan it. | 10 |
| 55 | bark global_variable_changed:scan_printer_done | The admin page is the one to look at. Check it, then test what it reports. | 16 |
| 56 | bark global_variable_changed:confirm_both_done | One real, one false alarm. There's a technique card in the printer cupboard. | 13 |
| 57 | bark global_variable_changed:use_card_done | The printer kept a saved link to Agnieszka's PC. Try it from her row. | 14 |
| 58 | bark global_variable_changed:file_server_seen | That's the file server. Come and tell me what it said. | 11 |
| 59 | bark global_variable_changed:open_share_done | You're in the shared drive. Graham can show you how that looked. | 12 |

## chidi_okeke

| # | Source | Line | Words |
|---|---|---|---|
| 1 | ink start | Hiya. Can't stop long, I've a report due. | 8 |
| 2 | ink hub | Still here, still busy. | 4 |
| 3 | ink hub | Only since about seven. Graham says it's nothing. | 8 |
| 4 | ink hub | Jun, mostly. The network port there is live, which is handy for laptops. | 13 |
| 5 | ink hub | Cheers. | 1 |
| 6 | chatter coffee | Report's due at four. Wish me luck. | 7 |
| 7 | chatter coffee | Someone's finished the biscuits. | 4 |
| 8 | chatter coffee | Is the network slow for anyone else? | 7 |

## jun_watanabe

| # | Source | Line | Words |
|---|---|---|---|
| 1 | ink start | Morning. Mind the cable, it's the hot desk. | 8 |
| 2 | ink hub | Yes? | 1 |
| 3 | ink hub | Whoever gets in first. I just like the window. | 9 |
| 4 | ink hub | I leave my things here when I go for coffee. I'd notice someone at my desk. | 16 |
| 5 | ink hub | The one by my feet? It's a live network port. Anyone can plug a laptop in. | 16 |
| 6 | ink hub | Right, ta. | 2 |
| 7 | bark npc_caught_at_post:jun_watanabe | Er, that's my desk. Can I help you? | 8 |
| 8 | bark npc_returned_post:jun_watanabe | Er, that's my desk. Can I help you? | 8 |
| 9 | chatter coffee | Third one today. Don't judge. | 5 |
| 10 | chatter coffee | Did you see that new rota? | 6 |
| 11 | chatter coffee | I always sit by the wall port. | 7 |

## agnieszka_duda

| # | Source | Line | Words |
|---|---|---|---|
| 1 | ink start | Hi. I'm Agnieszka. The printer's mine, more or less. | 9 |
| 2 | ink hub | Yes? Just tidying. | 3 |
| 3 | ink hub | Because nobody else will. | 4 |
| 4 | ink hub | If I see dirty mugs, I can't leave them. It's a habit. | 12 |
| 5 | ink hub | All day. When it's off I have to wait, and I don't like waiting. | 14 |
| 6 | ink hub | Whoever set it up did it from my PC, and nobody's touched it since. | 14 |
| 7 | ink hub | See you. | 2 |
| 8 | chatter cooler | Someone's left mugs everywhere again. | 5 |
| 9 | chatter cooler | Are you going to the quiz? | 6 |
| 10 | chatter cooler | I never know who fixed the printer last. | 8 |
| 11 | ink exchange_cooler_chat (exchange) | I've been hiding at my desk, Graham. | 7 |
| 12 | ink exchange_cooler_chat (exchange) | You never do. Five minutes at most. | 7 |

## zainab_hussain

| # | Source | Line | Words |
|---|---|---|---|
| 1 | ink start | Alright. I'm only in to service the kit. | 8 |
| 2 | ink hub | Still here. | 2 |
| 3 | ink hub | I'm in a different office every day. | 7 |
| 4 | ink hub | Easier to get the job done if I don't get chatting. | 11 |
| 5 | ink hub | My spare kit. It lives in the server room. | 9 |
| 6 | ink hub | Help yourself to what you need, as long as it goes back. | 12 |
| 7 | ink hub | Right. | 1 |
| 8 | ink card_offer | Everyone's gone, so I can talk. Ama said you're doing the network check. | 13 |
| 9 | ink card_offer | Here, take this card. It's for a known update gap on the file server. | 14 |
| 10 | ink card_offer | It only fits a weakness that is real, and that you've tested. | 12 |
| 11 | ink card_offer | There's another card in my tool roll, in the server room. Help yourself. | 13 |
| 12 | bark global_variable_changed:act_evening | Quiet now. Time for a coffee in peace. | 8 |

## graham_whitfield

| # | Source | Line | Words |
|---|---|---|---|
| 1 | ink start | Now then. You'll be the visitor Ama mentioned. | 8 |
| 2 | ink hub | Go on, then. | 3 |
| 3 | ink hub | Only for the cooler. It's where you hear things. | 9 |
| 4 | ink hub | The network, mostly. The printer, the file server, the camera. | 10 |
| 5 | ink hub | I don't watch it all day. The log does that for me. | 12 |
| 6 | ink hub | Right you are. | 3 |
| 7 | ink log_offer | Want to see what you looked like from here? The network log PC's just there. | 15 |
| 8 | ink log_offer | Every sweep, scan and test you did is a row. Find your own. | 13 |
| 9 | ink log_offer | Before you got here, someone swept the whole network from the kitchen port. Find that sweep and flag it. | 19 |
| 10 | ink exchange_cooler_chat (exchange) | Not seen you at the cooler all week. | 8 |
| 11 | ink exchange_cooler_chat (exchange) | Deadline? I'll not keep you long. | 6 |
| 12 | ink exchange_cooler_chat (exchange) | Then back to it. Same time tomorrow? | 7 |
| 13 | chatter cooler | How's tricks, then? | 3 |
| 14 | chatter cooler | Nobody tells me anything up here. | 6 |
| 15 | chatter cooler | The log never forgets, you know. | 6 |

## scenario chatter

| # | Source | Line | Words |
|---|---|---|---|
| 1 | chatter coffee | Go on, after you. | 4 |
| 2 | chatter coffee | Is there any milk left? | 5 |
| 3 | chatter coffee | This machine takes forever. | 4 |
| 4 | chatter coffee | Strong one today? | 3 |
| 5 | chatter coffee | Who keeps taking the mugs? | 5 |
| 6 | chatter coffee | Busy morning? | 2 |
| 7 | chatter cooler | Did you see the car park email? | 7 |
| 8 | chatter cooler | Friday drinks again? | 3 |
| 9 | chatter cooler | How was the weekend? | 4 |
| 10 | chatter cooler | Is it raining again? | 4 |
| 11 | chatter cooler | Train was late again. | 4 |
| 12 | chatter cooler | Any plans for lunch? | 4 |
| 13 | chatter cooler | Quiet one today, isn't it? | 5 |
| 14 | chatter cooler | Have you tried the new sandwich place? | 7 |
| 15 | chatter grumble_off | Who switched the coffee off? | 5 |
| 16 | chatter grumble_off | It's off. Typical. | 3 |
| 17 | chatter grumble_off | No coffee here, then. | 4 |
| 18 | chatter grumble_gone | Missed it. | 2 |
| 19 | chatter cake | Who's the cake from? | 4 |
| 20 | chatter cake | Go on, just a small slice. | 6 |
| 21 | chatter cake | Whose birthday is it? | 4 |
| 22 | chatter cake | This is really good. | 4 |
| 23 | chatter work_fail_printer | The printer's off again. | 4 |
| 24 | chatter work_fail_printer | Nothing's coming out of the printer. | 6 |
| 25 | chatter work_fail_printer | Who switched the printer off? | 5 |
| 26 | chatter work_fail | Why is nothing working today? | 5 |

## Changed in round 1

Lines new or reworded in the round 1 fixes (dialogue review R1 and implementation review R1). Lines cut in round 1: Chidi's two screen-lock lines, Graham's screen-lock line, Ama's "They've gone for coffee" and "That's your midday" lines, and the old Terminal teaching line.

| Speaker | Source | Line | Words |
|---|---|---|---|
| ama_owusu | ink start | I'm Ama, from Fenlow. Merrin and Sallow want to know what an outsider could learn from one spare network port. | 20 |
| ama_owusu | ink hub | Anything else? | 2 |
| ama_owusu | ink hub | Go on. | 2 |
| ama_owusu | ink whats_next | Find the hot desk and its network port. Plug the drop box in while Jun is away from it. | 19 |
| ama_owusu | ink whats_next | Jun goes for coffee now and then, or I can send him and Chidi. Be off the port before he's back. | 21 |
| ama_owusu | ink whats_next | Open the drop box in your inventory and sweep the office network. See what answers. | 15 |
| ama_owusu | ink whats_next | Scan the printer to see what it runs. | 8 |
| ama_owusu | ink whats_next | Check the printer's admin page. It reports two weaknesses. Test both to see which is real. | 16 |
| ama_owusu | ink whats_next | There's a technique card in the printer cupboard. Use it on the weakness that's real. | 15 |
| ama_owusu | ink whats_next | Now try the file server the same way, in the Terminal view. Same moves, typed. | 15 |
| ama_owusu | ink whats_next | Then come back and tell me what it said. | 9 |
| ama_owusu | ink whats_next | The rest needs the evening. Look in on the kitchen and the server room first, then tell me to call it a day. | 23 |
| ama_owusu | ink whats_next | Zainab stays late. She'll be in the server room or at the kitchen coffee. She has a card for you. | 20 |
| ama_owusu | ink whats_next | Use Zainab's card on the file server's update weakness. That gets you a user session. | 15 |
| ama_owusu | ink whats_next | Then test the left-open setting, and use the card from her tool roll on it. That's an admin session, and the shared drive. | 23 |
| ama_owusu | ink lever_coffee | Anyone still at the hot desk port when Jun comes back gets caught. | 13 |
| ama_owusu | ink lever_lunch | Have a look in the kitchen first. That's where they eat. | 11 |
| ama_owusu | ink lever_lunch | Lunch, then. Staff drift off their desks, Jun included. | 9 |
| ama_owusu | ink lever_day_end | Look in on the kitchen and the server room first. Zainab works in the server room, and she'll want the kitchen later. | 22 |
| ama_owusu | ink lever_day_end | Zainab will head for the kitchen coffee, and Graham will show you the log. | 14 |
| ama_owusu | ink terminal_talk | Same findings, same names. The Terminal shows the addresses and banners the panels tidy away. | 15 |
| ama_owusu | ink terminal_talk | Try it, then tell me. | 5 |
| ama_owusu | ink recap | Which part? | 2 |
| ama_owusu | ink recap_morning | The drop box on the port gave you a foothold. No password needed, only a free cable. | 17 |
| ama_owusu | ink recap_morning | The sweep listed what answers. Machines you never touched, found from one port. | 13 |
| ama_owusu | ink recap_midday | The card turned the printer's factory account into a saved link to Agnieszka's PC. | 14 |
| ama_owusu | ink recap_midday | The Terminal showed the same findings, typed, with each machine's address and banner. | 13 |
| ama_owusu | ink recap_evening | The shared drive took two steps, a user session and then an administrator's. | 13 |
| ama_owusu | ink short_version | One cable shows a lot. Sweep the network, then scan each machine. | 12 |
| ama_owusu | ink short_version | A technique fits one kind of weakness, and some need a user session first. | 14 |
| ama_owusu | bark network_foothold_gained:kitchen_jack | That works too. Nobody's watching the kitchen port. | 8 |
| ama_owusu | bark global_variable_changed:sweep_done | That's everything that answers. Pick the printer and scan it. | 10 |
| ama_owusu | bark global_variable_changed:scan_printer_done | The admin page is the one to look at. Check it, then test what it reports. | 16 |
| ama_owusu | bark global_variable_changed:confirm_both_done | One real, one false alarm. There's a technique card in the printer cupboard. | 13 |
| ama_owusu | bark global_variable_changed:use_card_done | The printer kept a saved link to Agnieszka's PC. Try it from her row. | 14 |
| ama_owusu | bark global_variable_changed:file_server_seen | That's the file server. Come and tell me what it said. | 11 |
| ama_owusu | bark global_variable_changed:open_share_done | You're in the shared drive. Graham can show you how that looked. | 12 |
| chidi_okeke | ink hub | Only since about seven. Graham says it's nothing. | 8 |
| chidi_okeke | ink hub | Jun, mostly. The network port there is live, which is handy for laptops. | 13 |
| jun_watanabe | ink hub | I leave my things here when I go for coffee. I'd notice someone at my desk. | 16 |
| jun_watanabe | ink hub | The one by my feet? It's a live network port. Anyone can plug a laptop in. | 16 |
| agnieszka_duda | ink start | Hi. I'm Agnieszka. The printer's mine, more or less. | 9 |
| agnieszka_duda | ink hub | Whoever set it up did it from my PC, and nobody's touched it since. | 14 |
| zainab_hussain | ink card_offer | Everyone's gone, so I can talk. Ama said you're doing the network check. | 13 |
| zainab_hussain | ink card_offer | There's another card in my tool roll, in the server room. Help yourself. | 13 |
| graham_whitfield | ink log_offer | Want to see what you looked like from here? The network log PC's just there. | 15 |
| graham_whitfield | ink log_offer | Before you got here, someone swept the whole network from the kitchen port. Find that sweep and flag it. | 19 |

## Totals

143 lines listed; 47 new or changed in round 1; longest 23 words.
