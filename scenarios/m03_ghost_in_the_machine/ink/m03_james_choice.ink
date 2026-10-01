EXTERNAL player_name()

// james_fate is a scenario global; assigning it writes through to game state,
// where the credits and the debrief read it back. No unbound EXTERNAL getters.
VAR james_fate = ""
VAR danny_evidence_seen = false
VAR player_choice_made = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:danny_foster
// Re-entry guard: the decision scene plays once. Talking again must not replay it
// and overwrite james_fate.
{ james_fate != "":
    -> after_choice
}
Narrator: The office is small and lived-in. A framed photo faces the chair. On the screen, a folder is still open: "GHOST -- Hospital Infrastructure Assessment".
Narrator: A man is sitting in the dark with his coat on, as if he has been about to leave for hours and hasn't managed it. He doesn't startle.
Danny Foster: You're not one of ours. I'd know you.
Danny Foster: You've seen it. The hospital files.
* [SAFETYNET. I'm investigating the St. Catherine's attack.]
    -> reveal
* [St. Catherine's. Your reconnaissance. People died.]
    -> guilt
* [She lied to you about the client, didn't she.]
    -> sympathy

=== reveal ===
#speaker:danny_foster
Danny Foster: *very quietly* SAFETYNET.
Danny Foster: I didn't know. You have to believe that. She told me it was a security-awareness client. That's what the paperwork says because that's what she told me to write.
Danny Foster: And then I saw the news, and I knew exactly what I'd handed her.
-> the_question

=== guilt ===
#speaker:danny_foster
Danny Foster: *voice cracks* I know. I know what my map was for.
Danny Foster: I read every article. I could tell you the ward layout from memory because I drew it. I keep thinking if I'd asked one more question --
Danny Foster: But I didn't. I did good, thorough work, and I gave it to her, and she sold it.
-> the_question

=== sympathy ===
#speaker:danny_foster
Danny Foster: Security-awareness training at a healthcare client. Her exact words. I even believed the invoice.
Danny Foster: I did the work. Careful work. And then the ransomware ran on the exact FTP box I'd flagged, and I understood what careful had bought.
-> the_question

=== the_question ===
#speaker:danny_foster
~ danny_evidence_seen = true
Danny Foster: When I worked it out, I went to her. She told me I was paranoid. Then she gave me a raise and called me essential.
Danny Foster: She was buying my silence and I was letting her, because the alternative is this. A stranger in my office at night, and me trying to explain that I'm not what the map makes me look like.
Danny Foster: So. What happens now?
+ [Come in on your own. Testify against Sterling. I'll argue you were deceived.]
    -> protect
+ [You drew the map. You took the money to stay quiet. That's a choice, and you'll answer for it.]
    -> expose
+ [This isn't my call to make for you. Decide it yourself.]
    -> leave

=== protect ===
#speaker:danny_foster
You: You were lied to. The reconnaissance was legitimate work under a false client. Come in voluntarily and cooperate, and I'll put that in the report myself. Not immunity. But the truth, in your favour.
Danny Foster: *shakily* You'd do that.
You: Sterling goes down for what she did with your work. You don't have to go down with her. But you have to come in, and you have to tell them everything.
Danny Foster: Everything. Yes. God, yes.
Narrator: He reaches for his phone with a hand that isn't quite steady, and for the first time all night he looks like a man who might sleep.
~ james_fate = "protected"
#set_global:james_fate:protected
~ player_choice_made = true
#complete_task:james_choice_made
#exit_conversation
-> after_choice

=== expose ===
#speaker:danny_foster
You: You documented the systems. You handed over the exploit path. And when you knew what it was for, you took her money and said nothing. Deceived at the start, complicit by the end.
Danny Foster: *quietly* You're not wrong. That's the worst of it. You're not wrong.
You: I'm logging all of it. The recon, the emails, the raise. Prosecutors decide the charge, not me. Cooperating will help you. Nothing erases it.
Danny Foster: *defeated* Then I'll cooperate. For whatever it's worth. Just -- in whatever you write, say that I didn't know at the start. Please.
Narrator: He doesn't argue. Somewhere in the last few months he stopped believing he'd get to.
~ james_fate = "exposed"
#set_global:james_fate:exposed
~ player_choice_made = true
#complete_task:james_choice_made
#exit_conversation
-> after_choice

=== leave ===
#speaker:danny_foster
You: You already know what you did and what you owe. That decision belongs to you, not to a stranger in your office at four in the morning.
You: Sterling is who I came for. What you do next is between you and whoever you pick up that phone to call.
Danny Foster: That's almost worse. At least a decision made for me isn't mine.
You: It's the only one that'll hold, though. Make it.
Narrator: You leave him with the photo, the open folder, and the phone. Whatever he does with the three of them, he does alone.
~ james_fate = "left"
#set_global:james_fate:left
~ player_choice_made = true
#complete_task:james_choice_made
#exit_conversation
-> after_choice

=== after_choice ===
// Resting point (m02 pattern): choices first, never DONE, so a re-talk in the
// same session lands here instead of "(End of conversation)".
#speaker:danny_foster
+ {james_fate == "protected"} [Danny's on the phone to SAFETYNET. Leave him to it.]
    Danny Foster: They're sending someone for me. Thank you. I mean it.
    #exit_conversation
    -> after_choice
+ {james_fate == "exposed"} [Danny's sitting very still. Leave him.]
    Danny Foster: I'm not going anywhere. You know where to find me.
    #exit_conversation
    -> after_choice
+ {james_fate == "left"} [Danny's still staring at the phone. Leave him.]
    Danny Foster: I'm still deciding. Let me.
    #exit_conversation
    -> after_choice
+ {james_fate == "" or james_fate == "ko"} [Leave]
    #exit_conversation
    -> after_choice
