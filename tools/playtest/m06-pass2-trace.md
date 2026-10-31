# m06 pass 2 trace (summary; full replayable commands are the "dir":"in" lines of the session logs)

Logs: tools/playtest/m06-pass2-session-A.jsonl (game 1173), tools/playtest/m06-pass2-session-B.jsonl (game 1174).
Flags: tools/playtest/m06_follow_the_money-flags-game1173.xml, ...game1174.xml (session tokens `<flag:N>`, substitutions logged as dir "flag").

Run B route: bootstrap -> room/enter security_checkpoint -> interact it_onboarding_checklist -> enter trading_floor -> converse elena (opener "Thirty-seven papers", "Financial surveillance", password request, research, door access, badge) -> open Password Dictionary List (inventory click) -> door:trading_floor->server_room lock "bitcoin2025" -> blockchain_evidence -> vm_launcher_hackme -> flag_station_financial type <flag:1..3> -> Door Controller Export -> door:server_room->data_center lock "3110" -> architects_fund_doc, executive_access_badge -> executive_wing door -> executive_wing_plaque -> <flag:4> -> satoshi_office -> executive_safe lock "2140" -> satoshi "You're being detained" / "Then look at this first" / "I'm freezing" -> elena "There's something you need to see" / "You flagged" / "You didn't see the whole picture" -> debrief (driven with choose 1).

Run A differences: phone opened by inventory click (first_call + initial_guidance), Elena wordlist refused, passphrase from checklist, Satoshi "Not yet" before flag 4, phone read of HaX pointer, flag 4, freeze, reload, debugKO elena_volkov (assisted, combat not played).
