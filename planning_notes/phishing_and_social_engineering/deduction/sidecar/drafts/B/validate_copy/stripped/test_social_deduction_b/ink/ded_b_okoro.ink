// ================================================
// Fixture B (draft): Ngozi Okoro, night operator. Suspect. Person NPC in b_office.
// Nigerian-British, late thirties, twelve years on nights. Sharp, tired, bitter
// about the shift pattern and not hiding it well. Answers questions with questions.
//
// Plan: the plan gives Okoro no ink route (her cells come from the badge log, the
// DHCP printout, Tomás and the HR summary, §9.1 "Clue routes"), so this story
// grants nothing (DL18 would warn on an unlisted grant) and carries no verdict tag
// (report-only, DL12). Her own word clears nobody (§7.1). She points at someone
// else, truthfully: Samira does bring a laptop in.
// ================================================

VAR okoro_met = false
VAR hub_quiet = false

=== start ===
{ okoro_met:
    -> hub
- else:
    ~ okoro_met = true
    ~ hub_quiet = true
    Ngozi Okoro: Security brought in a fresh face. Lovely. I've got alerts to clear, so be quick.
    -> hub
}

=== hub ===
{ hub_quiet:
    ~ hub_quiet = false
- else:
    Ngozi Okoro: {&Still here?|What now?|Go on.}
}
+ [What does a night operator actually do?] -> job
+ [Were you anywhere near the server room last night?] -> server
+ [How are you finding the new shift pattern?] -> pattern
+ [I'll leave you to your alerts.]
    Ngozi Okoro: Thank you.
    ~ hub_quiet = true
    #exit_conversation
    -> hub

=== job ===
Ngozi Okoro: I watch screens so nobody else has to. Disk fills up, I ring someone. Backup fails, I ring someone.
Ngozi Okoro: Twelve years. You'd think they'd let me sleep at night by now.
-> hub

=== server ===
Ngozi Okoro: I go where the tickets send me. Ask the door, it remembers better than I do.
Ngozi Okoro: And while you're asking, Samira brings her own laptop in every night. Nobody says a word about that.
-> hub

=== pattern ===
Ngozi Okoro: Four nights on, two off, and the two move every week. I appealed. I lost.
Ngozi Okoro: That's all there is to say about it.
-> hub
