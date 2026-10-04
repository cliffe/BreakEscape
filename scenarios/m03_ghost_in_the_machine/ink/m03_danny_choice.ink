EXTERNAL player_name()

// danny_fate is a scenario global; assigning it writes through to game state,
// where the credits and the debrief read it back. No unbound EXTERNAL getters.
VAR danny_fate = ""
VAR danny_evidence_seen = false
// Final round: a return visit gets its own line, skipped once after an exit.
VAR rest_quiet = false

// Root divert. When a conversation has ended (-> DONE), the engine restores only
// its variables on the next talk and continues from the root (npc-conversation-
// state.js restoreNPCState). Without this line the root is empty and the player
// sees "(End of conversation)" instead of the start knot's re-entry routing.
-> start

=== start ===
#speaker:danny_foster
// Re-entry guard: the decision scene plays once. Talking again must not replay it
// and overwrite danny_fate.
{ danny_fate != "":
    -> after_choice
}
Narrator: The office is small and lived-in. A framed photo faces the chair. On the screen, a folder is still open: "GHOST -- Hospital Infrastructure Assessment".
Narrator: A man is sitting in the dark with his coat on, as if he has been about to leave for hours and hasn't managed it. He doesn't startle.
Danny Foster: You're not one of ours. I'd know you.
// Pass 4 (fix 9): only assume the player has read his files if they have.
{ danny_evidence_seen:
    Danny Foster: You've seen it. The hospital files.
- else:
    Danny Foster: You're here about the hospital. Aren't you.
}
* [SAFETYNET. I'm investigating the St. Catherine's attack.]
    -> reveal
* [St. Catherine's. Your reconnaissance. People died.]
    -> guilt
* [She lied to you about the client, didn't she.]
    -> sympathy

=== reveal ===
#speaker:danny_foster
Danny Foster: SAFETYNET.
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
Danny Foster: She was buying my silence and I was letting her. The alternative is this.
Danny Foster: A stranger in my office at night, and me trying to explain I'm not what the map makes me look like.
Danny Foster: So. What happens now?
+ [Come in and testify. You were deceived. I'll put that in the report myself.]
    -> protect
+ [You drew the map, took the money, stayed quiet. You'll answer for it.]
    -> expose
+ [This isn't my call. You know what you did. Decide it yourself.]
    -> leave

=== protect ===
#speaker:danny_foster
Danny Foster: *shakily* You'd do that.
+ [Sterling goes down for her part. You don't have to. But you tell them everything.]
    Danny Foster: Everything. Yes. God, yes.
    Narrator: He reaches for his phone with a hand that isn't quite steady, and for the first time all night he looks like a man who might sleep.
    ~ danny_fate = "protected"
    #set_global:danny_fate:protected
    #complete_task:danny_choice_made
    ~ rest_quiet = true
    #exit_conversation
    -> after_choice

=== expose ===
#speaker:danny_foster
Danny Foster: *quietly* You're not wrong. That's the worst of it. You're not wrong.
+ [I'm logging it all -- recon, emails, the raise. Cooperating helps you. Nothing erases it.]
    Danny Foster: Then I'll cooperate. For what it's worth. Just... in whatever you write, say I didn't know at the start. Please.
    Narrator: He doesn't argue. Somewhere in the last few months he stopped believing he'd get to.
    ~ danny_fate = "exposed"
    #set_global:danny_fate:exposed
    #complete_task:danny_choice_made
    ~ rest_quiet = true
    #exit_conversation
    -> after_choice

=== leave ===
#speaker:danny_foster
Danny Foster: That's almost worse. At least a decision made for me isn't mine.
+ [Yours is the only one that'll hold. Make it.]
    Narrator: You leave him with the photo, the open folder, and the phone. Whatever he does with the three of them, he does alone.
    ~ danny_fate = "left"
    #set_global:danny_fate:left
    #complete_task:danny_choice_made
    ~ rest_quiet = true
    #exit_conversation
    -> after_choice

=== after_choice ===
// Resting point (m02 pattern): choices first, never DONE, so a re-talk in the
// same session lands here instead of "(End of conversation)".
#speaker:danny_foster
{ rest_quiet:
    ~ rest_quiet = false
- else:
    { danny_fate == "protected":
        Danny Foster: *quietly* I've made the call.
    }
    { danny_fate == "exposed":
        Danny Foster: I'm still here. I said I would be.
    }
    { danny_fate == "left":
        Danny Foster: Still deciding.
    }
    { danny_fate == "" or danny_fate == "ko":
        Narrator: He hasn't moved.
    }
}
+ {danny_fate == "protected"} [Danny's on the phone to SAFETYNET. Leave him to it.]
    Danny Foster: They're sending someone for me. Thank you. I mean it.
    ~ rest_quiet = true
    #exit_conversation
    -> after_choice
+ {danny_fate == "exposed"} [Danny's sitting very still. Leave him.]
    Danny Foster: I'm not going anywhere. You know where to find me.
    ~ rest_quiet = true
    #exit_conversation
    -> after_choice
+ {danny_fate == "left"} [Danny's still staring at the phone. Leave him.]
    Danny Foster: I'm still deciding. Let me.
    ~ rest_quiet = true
    #exit_conversation
    -> after_choice
+ {danny_fate == "" or danny_fate == "ko"} [Leave]
    ~ rest_quiet = true
    #exit_conversation
    -> after_choice
