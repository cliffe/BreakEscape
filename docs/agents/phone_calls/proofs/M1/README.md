# M1 proofs (m09 Nightshade, Torres, Gary ring)

Server :3025, keyless (every /tts returns 503; the request list in `*_tts.jsonl` is the evidence). Route: `tools/phone_calls/routes/m09_m1_live.sh`. Branches come from `imports.json`.
Games start in the room of the beat (`--start-room`), the keypad and the lid are driven with `moveToNear` and `interact`, the banner with its real buttons.

| Route | Result |
|---|---|
| `gary_hold` | Gary rings 1.5 s after the first try at the salvage keypad, over the open keypad (`gary_hold_ring_over_keypad.png`, banner "Answer puts them on hold until you close this"). Answer: ringer `held`, keypad stays. Closing the keypad: ringer `connected`, call screen "ON CALL", opening line voiced (/tts), choice taken, End, back in the world. |
| `gary_popup` | CyberChef popup open (laptop `block`), `door_unlock_attempt {connectedRoom: salvage_cage}` emitted (the door's own event; the player cannot hold the popup and the keypad open together). Banner over the popup, Answer: laptop `none`, call opens at once; End: laptop `block` again. |
| `gary_decline` | Decline over the keypad: row "Missed call", callback `{knot: call}`, thread shows the Call back header and row buttons and the `(Close.)` choice only (no "(End of conversation)"). Call back connects and plays the call again. |
| `torres_box` | Torres rings at the shut lid (over the password field), Decline leaves a callback, the file number opens the container, the lid's `item_unlocked` mapping rings again over the container, Answer holds, closing the container opens the call, End. |
| `nightshade` | After the flag 1 event Nightshade rings about 7 s later, rings out after 20 s unanswered (ringer back to null). |
| `reload_ring` | Reload while Gary rings: back in the world, "Missed call" row, callback kept, no second ring. |
| `reload_call` | Reload in the middle of the answered call: thread on its home knot (`start`), "Missed call" row, callback kept, call not resumed (A6 rule). |

Not run: a ring-out for Gary and Torres (same code path as Nightshade's); Nightshade answered (same `call` shape as the others; compile and key checks cover its lines).
