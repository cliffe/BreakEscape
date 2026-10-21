# m09 texts, group B (the Recruiter)

Strings the scenario sends as texts, for stage 9 to paste. Unvoiced. The Recruiter's own thread, so no prefix. CONTRACT.md §3.7.

| Sender | Text (fixed) | Trigger (for stage 9) |
|---|---|---|
| `recruiter` | You took the name and something off my deck. I said I'd know before your plane landed. It's still in the air. | `room_entered:tape_room`, condition `globalVars.recruiter_offer === 'double_crossed'`, `onceOnly` |

Notes for stage 9:

- She knows something came off the deck, not what (MC §3.2, S3-08). Don't add a line that says which tape.
- The text arrives on her thread after the call has ended. Her home knot `start` is the "[Hello?]" stub, so opening the thread to read it shows only "The number rings out." Nothing in the text depends on the player answering.
