// ================================================
// The Keyholder Trials: Dr Sidhu Selvarajan (his office)
// Helper: hashing, integrity, signatures. Gives FN7 and FN10, plants his scene,
// and has the signature line at the climax. Indian English through register;
// no stock markers ("see," / "isn't it?") unless the user approves them.
// ================================================

VAR met_sidhu = false
VAR asked_ledger = false
VAR checked_report = false

// Synced scenario globals
VAR fn07_had = false
VAR fn10_had = false
VAR relay_opened = false
VAR decision_made = false
VAR special_collections_open = false

=== start ===
{ met_sidhu: -> hub }
#complete_task:consult_sidhu
~ met_sidhu = true
Dr Sidhu Selvarajan: Come in, come in. Sidhu Selvarajan. You must be one of the new first-years.
Dr Sidhu Selvarajan: You were looking at my whiteboard. It is from my blockchain lecture. A toy ledger, four blocks.
{ not fn07_had:
    #give_item:notes:fn07_hashing
}
#give_item:notes:fn10_signatures
{ fn07_had:
    Dr Sidhu Selvarajan: Take this. It is on signatures. Let us be exact about them, because people confuse them with hashes.
- else:
    Dr Sidhu Selvarajan: Take these. One on hashes, one on signatures. Let us be exact about the difference, because people confuse them.
}
Dr Sidhu Selvarajan: If anyone hands you something signed, bring it to me. I like to watch a signature check out.
-> hub

=== hub ===
{ relay_opened and not decision_made and not checked_report:
    Dr Sidhu Selvarajan: You have the look of someone holding a document.
- else:
    Dr Sidhu Selvarajan: What can I do for you?
}
+ {relay_opened and not decision_made and not checked_report} [I've been given something signed. Will you look?]
    -> signed_now
+ {decision_made} [That signed report. I've made my choice.]
    -> signed_after
+ {not asked_ledger} [What's the ledger on the board?]
    -> ledger
+ [What's a hash actually for?]
    -> hash_for
+ [Thank you. I'll leave you to it.]
    #exit_conversation
    Dr Sidhu Selvarajan: Do check everything twice.
    -> hub

=== ledger ===
~ asked_ledger = true
Dr Sidhu Selvarajan: Each block keeps the hash of the block before it. That is the chain.
Dr Sidhu Selvarajan: Change one letter in block two and its hash changes, so block three no longer points at it, and so on to the end. Tampering shows.
{ special_collections_open:
    Dr Sidhu Selvarajan: And yes, the data in block four is a word. Somebody has been reading my board very closely this week.
}
-> hub

=== hash_for ===
Dr Sidhu Selvarajan: A hash is a fingerprint. Any amount of input, a fixed-length output, and you cannot run it backwards.
Dr Sidhu Selvarajan: Same input, same hash. One byte different, even a new line you cannot see, and it is a completely different hash.
Dr Sidhu Selvarajan: So you can check that nothing has changed without keeping the thing itself. That is the start of how good systems store passwords.
Dr Sidhu Selvarajan: They add salt and a slow hash, but that is another lecture.
-> hub

=== signed_now ===
~ checked_report = true
Narrator: He reads the report, the hash and the signature, and checks them on his own screen.
Dr Sidhu Selvarajan: It verifies against the Keyholder's key. So the Keyholder signed it, whatever the FROM line says, and nobody has touched it since.
Dr Sidhu Selvarajan: It does not tell you whether you should send it.
-> hub

=== signed_after ===
Dr Sidhu Selvarajan: It verified, I expect. That was never the question.
-> hub
