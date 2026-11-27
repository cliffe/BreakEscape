// Reed runs the station hall. The assistant practice below opens from ink with
//   # trigger_minigame:exercise-station exerciseId=assistant_demo setGlobalPrefix=ex_assistant_
// The minigame opens once the line has been read, and the conversation returns when it closes.

=== start ===
Reed: Five stations in this hall, and a vault that opens when the privacy panel is done.
Reed: I can also bring up the practice assistant for you, if you would rather not walk over.
-> hub

=== hub ===
+ [Open the practice assistant]
    -> assistant
+ [How do I open the vault?]
    Reed: Finish the privacy panel at the far desk. The vault door lets go when it is done.
    -> hub
+ [That is all, thanks] #exit_conversation
    Reed: Good luck.
    -> DONE

=== assistant ===
Reed: Here it comes. # trigger_minigame:exercise-station exerciseId=assistant_demo setGlobalPrefix=ex_assistant_
-> hub
