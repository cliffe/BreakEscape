// ================================================
// chat_minigame_demo: Vega (person-chat)
// An in-room colleague. Interacting with her opens the full-screen
// person-chat portrait view. Demonstrates: portrait + caption + choices,
// speaker switching (Vega <-> player), TTS lip-sync (if voices enabled).
// ================================================

=== start ===
#speaker:vega
Vega: Hey. You're looking at the person-chat view -- my portrait fills the screen, and your dialogue runs along the bottom.
Vega: This is how you talk to anyone standing in the same room as you.

* [How is this different from the phone?]
    Vega: The phone-chat view is a texting UI -- message bubbles, no portraits. Two contacts are already on the phones in your inventory. Open one.
    -> hub
* [What about video calls?]
    Vega: See the console blinking in the corner? Read it. Someone wants a video call -- that's the third style.
    -> hub

=== hub ===
#speaker:vega
Vega: Anything else?

* [Show me a player line.]
    You: Like this -- when I reply, the caption switches to me and my name turns orange.
    Vega: Exactly. Portrait for me, caption for you.
    -> hub
* [That's all, thanks.]
    Vega: Go try the others.
    #exit_conversation
    -> DONE
