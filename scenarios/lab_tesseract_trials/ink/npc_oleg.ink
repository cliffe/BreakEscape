// ================================================
// The Keyholder Trials: Dr Oleg Illiashenko (staff office, optional)
// Real colleague. Warm, competent, dry. His voice comes through word choice
// and rhythm only: no phonetic spelling, no broken English, no stereotypes,
// nothing political. English throughout.
// His beat: the new staff system has turned his name into mojibake (UTF-8
// read as Windows-1251). Optional, no lock and no quiz. The "fixed it" beat is
// a conversation claim after the player has read the file (staff_list_read),
// because the game can't see CyberChef's output.
// Second beat: lookalike usernames (homoglyphs), one with a Cyrillic е;
// lookalike_seen is set by reading duplicate_accounts.txt. Gives FN13.
// hub_quiet as in the other person-chat inks (DIALOGUE_REVIEW_R2 M1).
// ================================================

VAR met_oleg = false
VAR asked_name = false
VAR explained = false
VAR fixed_claimed = false
VAR asked_cryptosecure = false
VAR asked_colleagues = false
VAR asked_week = false
VAR asked_lookalike = false
VAR quiet = false

// Synced scenario globals
VAR staff_list_read = false
VAR lookalike_seen = false

=== start ===
{ met_oleg: -> hub }
~ met_oleg = true
Dr Oleg Illiashenko: The sign on that door says staff only. You read it and came in anyway. That's a good instinct for this department.
Dr Oleg Illiashenko: Oleg Illiashenko. I'm one of the lecturers here. Sit anywhere that isn't covered in marking.
~ quiet = true
-> hub

=== hub ===
{
- quiet:
    ~ quiet = false
- else:
    Dr Oleg Illiashenko: {&Yes?|Something else?|Still here? Good.}
}
+ {not asked_name} [You look annoyed. Is something wrong?]
    -> name
+ {staff_list_read and not explained} [Your name on that staff list. What happened to it?]
    -> explain
+ {staff_list_read and not fixed_claimed} [I fixed your name. It reads properly in CyberChef now.]
    -> fixed
+ {lookalike_seen and not asked_lookalike} [The system thinks you're two people. Two usernames that look the same.]
    -> lookalike
+ {not asked_cryptosecure} [What do you make of CryptoSecure?]
    -> cryptosecure
+ {not asked_colleagues} [What are the others like? Dr Shaw, Dr Selvarajan, Dr Schreuders?]
    -> colleagues
+ {not asked_week} [Busy week?]
    -> week
+ [I'll leave you to it.]
    #exit_conversation
    Dr Oleg Illiashenko: Close the door properly on your way out. It sticks.
    -> hub

=== name ===
~ asked_name = true
Dr Oleg Illiashenko: Only the new staff system. It printed the staff list, and my name came out as nonsense.
Dr Oleg Illiashenko: The list is in the photocopier, if you want to see.
~ quiet = true
-> hub

=== explain ===
~ explained = true
#give_item:notes:fn12_mojibake
Dr Oleg Illiashenko: Same bytes, wrong table. My name is saved as UTF-8, two bytes for every Cyrillic letter.
Dr Oleg Illiashenko: Then some program reads those bytes with a one-byte table, Windows-1251, and every letter becomes two wrong ones.
Dr Oleg Illiashenko: Nothing is lost. You only have to read the bytes the way they were written. Here, I wrote it down.
~ quiet = true
-> hub

=== fixed ===
~ fixed_claimed = true
Dr Oleg Illiashenko: Show me.
Narrator: He reads it off your screen and, for once today, smiles at a computer.
Dr Oleg Illiashenko: There it is. Thank you. I'll send your recipe to the people who built the system.
Dr Oleg Illiashenko: They'll tell me it works on their machine.
~ quiet = true
-> hub

=== lookalike ===
~ asked_lookalike = true
#give_item:notes:fn13_lookalikes
Dr Oleg Illiashenko: Look at the bytes, not the letters. One of those has a Cyrillic letter that looks exactly like an English e.
Dr Oleg Illiashenko: Same shape, different number. The computer is right: those are two different names.
Dr Oleg Illiashenko: Two names that look the same aren't the same bytes. Ask anyone who has clicked a link to a bank that wasn't quite their bank.
Dr Oleg Illiashenko: Either the system imported me twice, or someone wants a staff login with my name on it. Today I'm not sure which is worse.
~ quiet = true
-> hub

=== cryptosecure ===
~ asked_cryptosecure = true
Dr Oleg Illiashenko: A recovery company that recruits first-years with puzzles. I have seen better business models. Not many more interesting ones.
Dr Oleg Illiashenko: If they offer you money for your password, the answer is no. If they offer you money for theirs, also no.
~ quiet = true
-> hub

=== colleagues ===
~ asked_colleagues = true
Dr Oleg Illiashenko: Tom has three hundred first-years this week and still remembers their names. I don't know how. I suspect a spreadsheet.
Dr Oleg Illiashenko: Sidhu checks everything twice, which is why I give him my exam papers to check once.
Dr Oleg Illiashenko: Cliffe I mostly see in corridors, walking quickly away from a committee.
~ quiet = true
-> hub

=== week ===
~ asked_week = true
Dr Oleg Illiashenko: Freshers' week. Lost students, free pizza, and one laptop that won't join the Wi-Fi.
Dr Oleg Illiashenko: This time the laptop is mine. Please don't tell my students.
~ quiet = true
-> hub
