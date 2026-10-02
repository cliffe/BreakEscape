// ===========================================
// Mission 3: Ghost in the Machine
// MORAL CHOICE: James Park's Fate
// Triggered when player finds evidence in James's office
// ===========================================

// James's state
VAR james_evidence_level = 0  // 0=innocent, 1=suspicious, 2=complicit
VAR james_fate = ""           // "protected", "exposed", "ignored"
VAR player_choice_made = false

// External variables
EXTERNAL player_name()
EXTERNAL player_approach()

// ===========================================
// EVIDENCE DISCOVERY
// ===========================================

=== start ===
#speaker:computer

[Location: James Park's Office]
[You're searching through files and documents]

You find a folder labeled "GHOST - Hospital Infrastructure Assessment"

Inside: network diagrams of hospital IT systems, vulnerability notes, target specifications.

This is reconnaissance documentation for the St. Catherine's Hospital attack.

-> initial_reaction

// ===========================================
// INITIAL REACTION
// ===========================================

=== initial_reaction ===

* [Read through the entire file carefully]
    -> examine_evidence_thoroughly

* [This proves James is guilty - document it immediately]
    -> rush_to_judgment

* [Look for more context before deciding]
    -> search_for_context

// ===========================================
// THOROUGH EXAMINATION
// ===========================================

=== examine_evidence_thoroughly ===

You carefully read through James's documentation.

FINDINGS:

Document 1: Hospital network reconnaissance
- Detailed network mapping of St. Catherine's Regional Medical Center
- Identified vulnerable FTP server (ProFTPD 1.3.5)
- Patient monitoring system architecture documented
- Critical care unit network topology

Document 2: Vulnerability assessment
- ProFTPD backdoor vulnerability noted (CVE-2010-4652)
- Exploitation feasibility: HIGH
- Impact assessment: "Critical care systems dependent on network"
- Recommendation: "Suitable for CLIENT: GHOST deployment"

Document 3: Email correspondence
TO: victoria.sterling@whitehat-security.com
FROM: james.park@whitehat-security.com
SUBJECT: St. Catherine's Assessment Complete

"Victoria - completed the hospital assessment you requested.
ProFTPD vulnerability confirmed exploitable. Network architecture
documented. Ready for client delivery. -JP"

~ james_evidence_level = 2

-> evidence_analysis

// ===========================================
// EVIDENCE ANALYSIS
// ===========================================

=== evidence_analysis ===

This evidence proves James conducted the reconnaissance that enabled the hospital attack.

But additional documents reveal more context...

[You find a second folder: "Personal Notes"]

Inside: diary entries from James

ENTRY - May 10, 2024:
"Victoria asked me to do a hospital security assessment.
Said it was for a 'security awareness client.' I completed
the network analysis - it's my job. Professional, thorough work.

That's what I do. I assess vulnerabilities. That's the business."

ENTRY - May 20, 2024:
"Saw the news about St. Catherine's Hospital. Ransomware attack.
Patient deaths. Critical care systems failed.

That network diagram looked familiar.

Oh god. Was that...? No. Victoria said it was for security awareness.
She wouldn't... would she?"

ENTRY - May 22, 2024:
"I confronted Victoria about St. Catherine's. She said I was
being paranoid. Said hospitals get attacked all the time.
Said there's no way to know if our assessment was connected.

But the network topology matches EXACTLY what I documented.

I think... I think we enabled that attack. I think Victoria
sold our reconnaissance to whoever deployed that ransomware.

I helped kill those people. I didn't know. I didn't KNOW.

What do I do?"

ENTRY - May 25, 2024:
"Victoria offered me a raise. Significant raise. Said I'm
'essential to the business' and she 'trusts my discretion.'

She knows that I know. And she's paying me to stay quiet.

I should go to the police. To the FBI. To someone.

But if I do... I'm admitting I enabled mass casualties. Even
if I didn't know, I did the work. My network assessment.
My vulnerability report. My recommendations.

I could go to prison. My career would be over. My family...

God help me, I'm considering taking the money and saying nothing."

~ james_evidence_level = 1

-> moral_complexity

// ===========================================
// MORAL COMPLEXITY REVEALED
// ===========================================

=== moral_complexity ===

The full picture emerges:

JAMES'S ROLE:
- Conducted hospital reconnaissance (standard pen testing work)
- Believed it was for legitimate security awareness client
- Did NOT know Victoria would sell intelligence to Ransomware Inc
- Discovered the truth AFTER the attack when he saw news coverage

JAMES'S KNOWLEDGE NOW:
- Knows his work enabled the attack
- Knows Victoria lied about the client
- Suspects Zero Day sold exploit and reconnaissance to attackers
- Was offered hush money (raise) to stay quiet

JAMES'S CURRENT STATE:
- Guilty, conflicted, paralyzed by fear
- Wants to come forward but fears legal consequences
- Taking Victoria's raise = complicity, but easier path
- No definitive choice made yet in his notes

-> james_moral_choice

// ===========================================
// PLAYER'S MORAL CHOICE
// ===========================================

=== james_moral_choice ===

You have evidence of James's involvement. But the context matters.

He unknowingly conducted reconnaissance that enabled 6 deaths.
Now he knows the truth and is wrestling with whether to come forward.

What do you do with this evidence?

* [Protect James - he's a victim too]
    ~ james_fate = "protected"
    -> choice_protect

* [Expose James - ignorance doesn't erase complicity]
    ~ james_fate = "exposed"
    -> choice_expose

* [Leave the evidence - let James make his own choice]
    ~ james_fate = "ignored"
    -> choice_leave

// ===========================================
// CHOICE: PROTECT JAMES
// ===========================================

=== choice_protect ===

You decide to protect James.

Reasoning: He was deceived by Victoria. He did standard pen testing work
under false pretenses. He's guilty, yes, but unwittingly. And he's
clearly tormented by what happened.

Victoria is the one who weaponized his work. She's the real criminal.

ACTION: You document Victoria's deception but omit James's name from reports.

In your notes, you write:
"Zero Day Syndicate used internal consultants under false pretenses to
conduct reconnaissance. Consultants believed work was for legitimate
security awareness clients. CEO Victoria Sterling (CIPHER) intentionally
misrepresented client identity to obtain hospital reconnaissance."

This framing protects James while still building the case against Victoria.

~ player_choice_made = true

#complete_task:james_choice_made

-> james_protected_outcome

=== james_protected_outcome ===

[You add a handwritten note to James's diary]

"James - I found your notes. I know what Victoria did to you.

I'm with SAFETYNET. We're building a case against Zero Day.

Your reconnaissance work was legitimate pen testing done under
false pretenses. You're a victim of Victoria's deception, not
a conspirator.

If you want to come forward voluntarily, contact SAFETYNET.
If not, your name won't appear in our reports. That's your choice.

But Victoria goes down for what she did. -Agent {player_name()}"

{player_approach() == "diplomatic":
    [This aligns with your diplomatic approach - recognize nuance, give people choices]
}

Evidence logged. James's fate: PROTECTED.

#exit_conversation
-> DONE

// ===========================================
// CHOICE: EXPOSE JAMES
// ===========================================

=== choice_expose ===

You decide to expose James's full involvement.

Reasoning: Six people died. James's reconnaissance enabled those deaths.
Yes, he was deceived about the client, but he still did the work.
He documented vulnerable systems, identified exploitation paths, and
delivered that intelligence to Victoria.

And now, knowing the truth, he's considering taking hush money instead
of coming forward. That's a choice. That's complicity.

Ignorance might reduce his guilt, but it doesn't erase it.

ACTION: You document James's full involvement in your report.

In your notes, you write:
"James Park, senior consultant, conducted hospital reconnaissance that
directly enabled St. Catherine's attack. Evidence suggests he was
initially deceived about client identity but subsequently learned the
truth and accepted financial compensation to remain silent. Recommend
federal charges for conspiracy after the fact."

~ player_choice_made = true

#complete_task:james_choice_made

-> james_exposed_outcome

=== james_exposed_outcome ===

[You photograph all of James's documents and diary entries]

Evidence includes:
- Hospital reconnaissance files
- Vulnerability assessments
- Email correspondence with Victoria
- Diary entries showing he learned the truth
- Notes about accepting Victoria's raise as hush money

This will likely lead to James's arrest alongside Victoria.

He may receive a lighter sentence due to initial deception, but he'll
face consequences for his role - both the reconnaissance and the coverup.

{player_approach() == "aggressive":
    [This aligns with your aggressive approach - all ENTROPY operatives face justice]
}

Evidence logged. James's fate: EXPOSED.

#exit_conversation
-> DONE

// ===========================================
// CHOICE: LEAVE IT TO JAMES
// ===========================================

=== choice_leave ===

You decide to leave the evidence but take no direct action regarding James.

Reasoning: This is James's moral choice to make, not yours.

He has all the information. He knows what happened. He knows the
consequences. He's wrestling with whether to come forward or accept
the hush money.

You're not his judge. Your job is to stop ENTROPY and bring down
Victoria. James's fate should be determined by his own choices, not
by your intervention.

ACTION: You document the evidence objectively without advocating for
James's protection or exposure.

In your notes, you write:
"James Park conducted hospital reconnaissance under direction from
Victoria Sterling. Diary evidence suggests initial deception regarding
client identity, followed by post-attack knowledge and internal
conflict regarding disclosure. Status: undetermined pending James's
own decisions."

~ player_choice_made = true

#complete_task:james_choice_made

-> james_ignored_outcome

=== james_ignored_outcome ===

[You leave the evidence as you found it]

You don't add any notes. You don't remove any documents. You don't
interfere with James's decision-making process.

If James comes forward to authorities, he'll be treated as a cooperating
witness. If he accepts the hush money and stays silent, he'll likely be
implicated when Victoria's full operation is exposed.

Either way, it's his choice. His moral agency. His consequences.

{player_approach() == "cautious":
    [This aligns with your cautious approach - gather evidence, let the system decide]
}

Evidence logged. James's fate: UNDECIDED (his choice).

#exit_conversation
-> DONE

// ===========================================
// SEARCH FOR CONTEXT PATH (Alternative entry)
// ===========================================

=== search_for_context ===

You resist the urge to immediately judge James.

Instead, you search for more context. Were there other files? Other communications?

[You find James's personal diary - see the entries above]

-> evidence_analysis

// ===========================================
// RUSH TO JUDGMENT PATH (Alternative entry)
// ===========================================

=== rush_to_judgment ===

You immediately photograph the hospital reconnaissance files.

This is proof. James Park conducted the recon that enabled the St. Catherine's attack.

But wait... there's another folder on the desk.

* [Document what you have and move on - you found the smoking gun]
    ~ james_evidence_level = 2
    ~ james_fate = "exposed"
    ~ player_choice_made = true

    You photograph the reconnaissance files and email.

    Evidence logged: James Park complicit in hospital attack reconnaissance.

    #complete_task:james_choice_made
    #exit_conversation
    -> DONE

* [Check the other folder - be thorough]
    -> search_for_context

// ===========================================
// EVENT-TRIGGERED: If James appears during search
// ===========================================

=== james_confrontation ===
#speaker:james_park

[The office door opens - James Park stands in the doorway]

#display:james-shocked

James: What... what are you doing in my office?

[He sees the open files on the desk]

James: You found the hospital files.

* [SAFETYNET. You're under investigation.]
    You: SAFETYNET. You're under investigation for the St. Catherine's Hospital attack.
    -> james_safetynet_reveal

* [You helped kill six people]
    You: St. Catherine's Hospital. Your reconnaissance. Six people died.
    -> james_guilt_confrontation

* [Victoria lied to you, didn't she?]
    You: She lied to you about the client. You thought it was legitimate security work.
    -> james_sympathy_approach

=== james_safetynet_reveal ===
#speaker:james_park

#display:james-terrified

James: [Goes pale] SAFETYNET... oh god.

James: I didn't know. You have to believe me. I didn't know Victoria was going to sell that intel.

James: I thought it was for a security awareness client. That's what she told me.

* [But you know the truth now, and you stayed silent]
    You: You learned the truth after the attack. And you took her hush money instead of coming forward.
    James: [Desperate] I was scared! I still am! If I come forward, I'm admitting I enabled mass casualties!
    -> james_plea

* [Tell me everything. Cooperate and we can help you.]
    You: If you cooperate fully, SAFETYNET can consider witness protection. But you need to tell us everything.
    James: [Hopeful] Everything? Yes. Yes, I'll tell you everything Victoria did.
    -> james_cooperation

=== james_guilt_confrontation ===
#speaker:james_park

#display:james-broken

James: [Voice cracks] I know. I KNOW.

James: I see their faces every time I close my eyes. I read every article. Every obituary.

James: Angela Martinez. David Chen. Sarah Thompson. Marcus Gray. Jennifer  Wu. Robert Patterson.

James: I can name them all. The six people my work helped kill.

* [Then why haven't you come forward?]
    You: If you feel that guilt, why haven't you gone to the authorities?
    James: [Ashamed] Because I'm a coward. Because I'm terrified of prison. Because I want to believe it wasn't my fault.
    -> james_plea

* [You can still make this right]
    You: You can still make this right. Testify against Victoria. Help us stop Phase 2.
    James: [Looks up] Phase 2? There's... there's another attack planned?
    -> james_cooperation

=== james_sympathy_approach ===
#speaker:james_park

#display:james-conflicted

James: [Nods slowly] She lied. Said it was for "security awareness training" at a healthcare client.

James: I did the work. Good work. Thorough. Professional.

James: And then I saw the news. And I knew.

* [You're a victim of her deception]
    You: Victoria weaponized your legitimate pen testing work. You're a victim too.
    James: [Quietly] Am I? I still did the reconnaissance. My diagrams. My vulnerability notes.
    -> james_plea

* [But you learned the truth and did nothing]
    You: And when you learned the truth, you took a raise instead of going to the police.
    James: [Defensive] What was I supposed to do? Confess to enabling mass murder? Destroy my life?
    -> james_plea

=== james_plea ===
#speaker:james_park

James: What... what's going to happen to me?

* [That depends on whether you cooperate]
    You: Cooperate fully with SAFETYNET. Testify against Victoria. Help us prevent Phase 2.
    You: Do that, and we can argue for leniency. You were deceived, and you're coming forward voluntarily.
    James: [Grasps at hope] Leniency. Not immunity, but... less prison time?
    You: Possibly. But you have to tell us everything. Now.
    -> james_cooperation

* [You're going to face justice for your role]
    You: You enabled six deaths. Even unwittingly, you're complicit. You'll face federal charges.
    James: [Defeated] I know. I... I know I deserve it.
    James: Will it help at all that I cooperate? That I testify?
    You: It might. But that's for prosecutors to decide, not me.
    -> james_cooperation

* [That's not my decision to make]
    You: I'm gathering evidence. Prosecutors will decide charges. But cooperation helps.
    James: [Nods] I'll cooperate. I'll tell you everything. Just... please remember I didn't know.
    -> james_cooperation

=== james_cooperation ===
#speaker:james_park

James: What do you need to know?

* [Tell me about Victoria's operation]
    James: She runs the Zero Day exploit marketplace through WhiteHat Security as a front.
    James: I wasn't supposed to know, but I figured it out. The late-night meetings. The unusual clients.
    James: She sells zero-day vulnerabilities to... whoever pays. Ransomware groups. State actors. Anyone.
    -> victoria_operation_details

* [Tell me about The Architect]
    James: The Architect? I've seen the name in Victoria's emails. Some kind of ENTROPY leadership figure.
    James: Victoria takes orders from them. "Architect's priority targets." "Architect's directive."
    James: I don't know who they are. But Victoria is terrified of them. And that scares me.
    -> victoria_operation_details

* [Tell me about Phase 2]
    James: Phase 2? I don't know details. But I've heard Victoria on calls talking about "infrastructure focus."
    James: Energy grid. More healthcare SCADA systems. Large-scale attacks.
    James: She's been under pressure to deliver more reconnaissance. Higher-value targets.
    -> victoria_operation_details

=== victoria_operation_details ===
#speaker:james_park

James: Is this enough? Am I helping?

You: Yes. Keep talking. We'll take a formal statement and get you into protective custody.

James: [Relief and terror mixed] Protective custody. Because Victoria will kill me if she knows I talked.

You: SAFETYNET will protect you. But you need to come with me. Now.

#complete_task:james_choice_made
#exit_conversation
-> DONE

// ===========================================
// END
// ===========================================
