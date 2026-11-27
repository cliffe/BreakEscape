# m06 Follow the Money: office-life spoken lines (slice 5)

Every line the office-life build adds. Pool lines are scenario data (NPC `chatter` in `scenario.json.erb`); exchanges and conversations are ink knots. No `DIALOGUE_SAMPLE.md` existed, so the lines follow PLAN.md section 6 and the banned-topic list in 3.3. Voiced 2026-11-18 (59 clips with the four non-office-life debrief and Irina lines the same top-up filled); no barks are added.

## Pools (one line each, 40 characters at most)

| Speaker | Pool | Line | Chars |
|---|---|---|---|
| trader_npc | coffee | Another one. Don't tell my mum. | 31 |
| trader_npc | coffee | Charts won't watch themselves. | 30 |
| trader_npc | coffee | Is it decaf? Tell me it's not decaf. | 36 |
| trader_npc | coffee | Asia's about to open. Need this. | 32 |
| trader_npc | coffee | I can see in colour again. | 26 |
| trader_npc | grumble | Seriously? Not tonight. | 23 |
| trader_npc | grumble | I'll sulk at my desk, then. | 27 |
| lerato_dlamini | coffee | Rota says I'm on until the sun's up. | 36 |
| lerato_dlamini | coffee | Somebody has to answer the phones. | 34 |
| lerato_dlamini | coffee | Black, strong, no conversation. | 31 |
| lerato_dlamini | coffee | Who keeps taking my blue mug? | 29 |
| lerato_dlamini | coffee | If the phones go, I run. | 24 |
| lerato_dlamini | grumble | Well, that's no use to anyone. | 30 |
| lerato_dlamini | grumble | Brilliant. Just brilliant. | 26 |
| lerato_dlamini | phone | Trading floor, Lerato speaking. | 31 |
| lerato_dlamini | phone | Yes, I can see the problem. One moment. | 39 |
| lerato_dlamini | phone | Thank you for calling. Goodnight. | 33 |
| tomasz_wisniewski | coffee | Tea would be kinder, but coffee works. | 38 |
| tomasz_wisniewski | coffee | Many years of nights. Still tired. | 34 |
| tomasz_wisniewski | coffee | One more ticket, then I sit down. | 33 |
| tomasz_wisniewski | coffee | Someone left a mug. Mine, I think. | 34 |
| tomasz_wisniewski | coffee | The app crashes, I drink. Simple. | 33 |
| tomasz_wisniewski | grumble | Not to worry. Later, perhaps. | 29 |
| tomasz_wisniewski | grumble | A pity. I will try again. | 25 |
| tomasz_wisniewski | phone_message | Lerato is away. May I take a message? | 37 |
| tomasz_wisniewski | phone_message | I will tell her you called. | 27 |
| tomasz_wisniewski | phone_message | She will ring you back shortly. | 31 |

Pool lines: 27. The `grumble_gone` pool (pizza gone) is not written: with two servings and two eaters at one each it can never play (LIVE_S4.md). Dani has no `phone` pool: he does not answer phones.

## Exchanges (ink knots, heard once each, `heard_<knot>`, first line stands alone, lines 40 characters at most)

| Knot | Speaker | Line | Chars |
|---|---|---|---|
| ex_dani_tomasz_late_shift | Tomasz Wisniewski | Dani, is that your fifth coffee tonight? | 40 |
| ex_dani_tomasz_late_shift | Dani Okonkwo | Sixth. Asia opens soon and I'm fading. | 38 |
| ex_dani_tomasz_late_shift | Tomasz Wisniewski | At least your charts never shout at you. | 40 |
| ex_dani_tomasz_late_shift | Dani Okonkwo | No. Your callers do enough of that. | 35 |
| ex_dani_tomasz_late_shift | Tomasz Wisniewski | One said his notification rang twice. | 37 |
| ex_dani_tomasz_late_shift | Dani Okonkwo | Tell him it's a feature. Works for me. | 38 |
| ex_floor_after_irina | Lerato Dlamini | Did you see the police come through? | 36 |
| ex_floor_after_irina | Tomasz Wisniewski | I did. Two officers, very quiet. | 32 |
| ex_floor_after_irina | Lerato Dlamini | Nobody has told us a thing. | 27 |
| ex_floor_after_irina | Tomasz Wisniewski | I only keep the queue running. | 30 |
| ex_floor_after_irina | Lerato Dlamini | Same. The floor won't run itself. | 33 |
| ex_floor_after_seizure | Lerato Dlamini | My phone hasn't stopped all night. | 34 |
| ex_floor_after_seizure | Tomasz Wisniewski | The queue climbs. Callers everywhere. | 37 |
| ex_floor_after_seizure | Lerato Dlamini | And I've no idea what to tell them. | 35 |
| ex_floor_after_seizure | Tomasz Wisniewski | Then we answer, and we say very little. | 39 |
| ex_floor_after_seizure | Lerato Dlamini | Politely. That part I can do. | 29 |

Knot homes and gates:
- `ex_dani_tomasz_late_shift`: `m06_npc_tomasz.ink`, `with: trader_npc`, gate `irina_arrested: false`, `floor_staff_ko: false`
- `ex_floor_after_irina`: `m06_npc_lerato.ink`, `with: tomasz_wisniewski`, gate `irina_taken: true`, `floor_staff_ko: false`
- `ex_floor_after_seizure`: `m06_npc_lerato.ink`, `with: tomasz_wisniewski`, gate `assets_seized: true`, `floor_staff_ko: false`

Exchange lines: 16.

## Short conversations (spoken ink lines; player choices are not voiced)

| Speaker | Knot | Line |
|---|---|---|
| lerato_dlamini | `m06_npc_lerato.ink` start | Evening. I'm on the phones and the rota tonight. |
| lerato_dlamini | hub re-entry | You again. Go on, before the phone goes. |
| lerato_dlamini | hub, Quiet night? | Quiet is how it starts. Then the early markets wake and every line lights up. |
| lerato_dlamini | hub, Quiet night? | And I've not eaten since I came in. |
| lerato_dlamini | hub, Who else is on tonight? | Me, Tomasz on the support queue, and Dani, wired on coffee. |
| lerato_dlamini | hub, goodbye | Mind the coffee machine. It bites. |
| tomasz_wisniewski | `m06_npc_tomasz.ink` start | Sorry, I am in the middle of a ticket. How can I help? |
| tomasz_wisniewski | hub re-entry | Yes? Quickly, I have a caller waiting. |
| tomasz_wisniewski | hub, How is the queue tonight? | Quiet. One app crashing on launch, one notification that rings twice. |
| tomasz_wisniewski | hub, How is the queue tonight? | Nothing worse. I do not trust it. |
| tomasz_wisniewski | hub, Who covers the phones? | Lerato has the desk phone. If she is away, I pick up. |
| tomasz_wisniewski | hub, goodbye | Thank you. Back to my queue. |

Conversation lines: 12.

## Existing lines changed

None. No existing knot, bark, mapping or ink file was edited. `chatter`, `chatterCooldownMin`, `exchanges` and `storyPath` were added to the trader, Lerato and Tomasz records; the trader's `storyPath` already existed.

## Clips needing voicing

- Pools: 27
- Exchanges: 16
- Conversations: 12
- Barks: 0
- **Total: 55**

V6 (`app:break_escape:tts:office_lines`) counts pools and exchanges only: 43 clips, all uncached, which matches. The 12 conversation lines are picked up by the normal tts-audio extraction of the two new ink files.

## Banned-topic check (PLAN 3.3)

Words checked absent from every line above: money, funds, wallet, deposit, withdraw, transfer, settle, custody, escrow, client, customer, account, login, password, hold, held, audit, FCA, regulator, visitor, badge, key, card, ops, any four-digit number, any month, date or hour count. The only numerals-as-words are ordinal coffee counts (fifth, sixth, fourth), which are not codes.

Dialogue review fixes (DIALOGUE_REVIEW_OL.md, Outcomes): line texts above are current. Clip count unchanged at 55 (no line added or removed).
