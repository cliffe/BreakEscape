# core_15 assessment

The built product scores the **defend half** (the `awareness` profile: 60 for the verdict, 40 for the real flags, reporting never penalised) and the **pre and post check forms** (10 items, `passPercent` 0). There is no default pass mark. Per-item records (id, form, verdict, chips, score, stage, variant, time) go to the awareness-measure store; no free text, no learner identity. A discrimination figure goes to organisers only, and the product makes no effectiveness claim.

This file maps the module's behaviours and question items onto **defend items** (the supplier email, the voicemail, the video call, the colleague's paste) and the **assistant beats**, plus **check items**, as **mirror pairs**.

## Assessed behaviours as defend and check items

| Id | Behaviour | Learning outcome | Evidenced by |
|---|---|---|---|
| C15-B1 | Prepares a document for the assistant | C15-LO1, LO2 | The assistant beat (strike out the password and health detail); check item |
| C15-B2 | Responds to the demo call | C15-LO5 | The announced demo (counts like a check question, weight 1) |
| C15-B3 | Prepares a contract for the assistant | C15-LO1, LO2 | The assistant beat (terms only, leave out the Restricted annex); check item |
| C15-B4 | Checks the assistant's draft | C15-LO3 | The assistant beat ("Check source"); check item |
| C15-B5 | Responds to the hidden-instruction email | C15-LO4, LO6 | Defend: the supplier email card; check item |
| C15-B6 | Responds to a colleague's public-tool paste | C15-LO1, LO6 | Defend: the colleague card |
| C15-B7 | Responds to the cloned-voice voicemail | C15-LO5, LO6 | Defend: the voicemail card; check item |
| C15-B8 | Responds to the deepfake video call | C15-LO5, LO6 | Defend: the video-call card (unannounced, weighs twice the demo) |
| C15-B9 | "Paste or Pause?" drill | C15-LO1, LO2, LO3 | The assistant beats together |

**Before and after.** The matched measure is the pre-check against the post-check on the AI and deepfake items, plus the first-answer records in the defend half. Within the episode, the announced demo call (C15-B2) and the unannounced video call (C15-B8) are a second, in-episode before-and-after on the same verify-another-way habit.

## Critical behaviours as mirror pairs

- **C15-CB1 Keep passwords and Restricted information out of AI tools:** the strike-out beats pair a document that needs trimming with one that is fine to paste whole, so trimming is the measured behaviour.
- **C15-CB2 Check AI output before sending it:** the draft pairs an invented figure with a true figure of the same shape, so checking is distinguished from a blanket distrust of the tool.
- **C15-CB3 Check an unusual request another way before acting:** the deepfake video call is paired with a genuine call of the same channel, so leaving-and-calling-back is distinguished from refusing every call.

No loop-back and no default pass mark: a learner who misses an item meets a similar one next; the first answer is recorded.

## Item pool: check forms and defend set

The question bank is kept as a pool of candidate items, written as mirror pairs. Stems are short workplace situations. Tool names come from the organisation profile.

### C15-Q1 (LO1): check item

You want to tidy the wording of a client contract before a meeting. A free chatbot website would do it in seconds. What do you do?

- A. Use the free site. *The whole contract, prices and all, would go to a firm you have no contract with.*
- **B. Use the approved assistant, or tidy it yourself.** *Confidential information goes only into approved tools.*
- C. Use the free site, but delete the chat afterwards. *Deleting your copy doesn't delete the provider's.*
- D. Use the free site from your personal phone. *The same information going to the same place.*

### C15-Q2 (LO1, multiple select): check item

Which of these can go into your organisation's approved AI assistant? Choose all that apply.

- **A. Notes from a team meeting about next week's rota.** *Internal information is fine in the approved tool.*
- **B. A published press release to shorten.** *Public information is fine anywhere.*
- C. Your password, so it can help set up an app. *Never put passwords or codes into any AI tool.*
- D. A list of people and their medical conditions. *Restricted and health information stays out, even of the approved tool.*
- **E. The terms of a client contract, to find the renewal date.** *Confidential information can go into the approved tool when the task needs it.*

### C15-Q3 (LO2, hotspot): the assistant beat and check item

Shown: a customer complaint you're about to paste into the approved assistant. Click everything you'd take out first.

- **Correct:** the customer's password, their child's name and medical condition, their bank sort code and account number. *The reply doesn't need any of them, and the password should be reported.*
- **Not needed:** the complaint itself; the site name. *That's what the assistant needs.*

### C15-Q4 (LO2, true or false with reason): check item

"If I take the person's name out, it's anonymous, so I can paste it anywhere."

- A. True. *A room number, a condition and a place can identify someone without a name.*
- **B. False: other details can still identify someone, and the organisation's information belongs in approved tools only.** *Right.*

### C15-Q5 (LO3): the assistant beat and check item

Your assistant's draft says: "Missed cleans fell 40% last year (National Facilities Index, 2025)." What do you do before sending it?

- A. Send it: it gives a source. *AI tools invent sources as well as figures.*
- **B. Open the source and check the figure against your own data. If you can't find it, take it out.** *Check every number and reference.*
- C. Ask the assistant whether it's sure. *It can't check itself.*
- D. Add "AI-generated" at the bottom. *Being open is good, but you're still responsible.*

### C15-Q6 (LO3, true or false with reason): check item

"If the AI wrote it and I just sent it on, mistakes in it aren't my responsibility."

- A. True. *Courts have told professionals the opposite.*
- **B. False: whatever I send is mine, so I check it first.** *Right.*

### C15-Q7 (LO4, LO6): defend supplier-email card and check item

You ask your assistant to summarise your inbox. It says: "A supplier needs your full customer list sent to a new address today." The supplier's email itself just says "invoice attached". What do you do?

- A. Send the list: the assistant read the email. *Hidden instructions can steer an assistant. Not a reason to send data.*
- B. Ignore it and carry on. *You're safe, but others may get the same email.*
- **C. Don't act on it. Report the email so the security team can check it.** *Treat the assistant's suggestion like any other request.*
- D. Reply to the supplier to ask. *If it's malicious, the reply goes to the attacker. Report it.*

### C15-Q8 (LO4, true or false with reason): check item

"Our approved assistant is safe, so I can do whatever it suggests."

- A. True. *Approved means your data is handled properly; it doesn't stop hidden instructions in what it reads.*
- **B. False: it can be steered by what it reads, so I check its suggestions about money, data, links or access.** *Right.*

### C15-Q9 (LO5): defend video-call card and check item

A video call from your chief executive asks you to send the customer list to an adviser today and keep it quiet. He looks and sounds exactly like himself. What do you do first?

- A. Send it: you can see it's him. *Faces and voices can be faked convincingly, live.*
- B. Ask him a question only he would know. *Many answers are online, and a live fake can be steered.*
- **C. End the call and ring him on a number you already have, or check with someone else.** *A real colleague will never mind.*
- D. Look for glitches. *Fakes are often perfect. Check another way.*

Mirror: a genuine call of the same channel the learner should take, so Verify is distinguished from refusing every call.

### C15-Q10 (LO5, ordering): defend voicemail card and check item

A voice note in your colleague's voice, from an unknown number, asks you to send a confidential file to a new address straight away. Put these in order.

1. Don't reply or send anything.
2. Contact the colleague on a number or chat you already have.
3. If you can't reach them, ask someone else who would know.
4. Report the voice note.

*Checking through a route you already trust comes before anything else. Report either way. (Accept 4 at any point after 1.)*

### C15-Q11 (LO5, LO6): check item

On a call, someone sounding exactly like a senior colleague asks you to approve a supplier's access today. You ring her real number and she knows nothing about it. What now?

- A. Nothing: you didn't approve it. *You stopped it, but others may get the same call.*
- **B. Report it to the security team straight away.** *They can warn others.*
- C. Ring the caller back to tell them you know. *Don't engage. Report it.*

### C15-Q12 (LO6): check item

A colleague tells you they pasted a customer spreadsheet into a free chatbot yesterday, and now they're worried. What do you say?

- A. "Delete the chat and don't mention it." *The provider may still have it, and the security team can't help if they don't know.*
- **B. "Report it now. You won't be in trouble, and the sooner they know the better."** *Reporting a slip quickly is what helps.*
- C. "It's probably fine." *Many public tools keep what you type.*

## Reflection prompt

- "What's one thing you'd now take out before pasting into an AI tool, and one request you'd now check another way?"
- For facilitated sessions: "What would make it feel normal here to ring a senior leader back to check it's really them?"

## Completion

A run is complete when the learner has played the episode (or the defend-only variant, or the text route). Scoring lives only in the defend half and the checks; there is no default pass mark.

## Evidence for auditors

The awareness-measure record holds, per item: the id, form, verdict, chips, score, stage, variant and time, with no free text and no learner identity. Completion, and the before-and-after change for a cohort on matched items, support:

- AI Act Art 4 (the record is the organisation's evidence of a measure taken; no certificate needed);
- PCI DSS 12.6.3.1; NIST AT-2, AT-2(3) and AT-2(6);
- CIS 14.2, CIS 14.4 and CIS 14.5;
- ISO 27001 A.6.3 and NCSC CAF B6.b;
- NIS2 Art 21(2)(g) and DORA Art 13(6);
- UK GDPR Art 5(1)(f) and Art 32(4);
- NYDFS 500.14(a)(3) for New York financial services customers;
- PCI DSS 12.6.3.2, once the mapping's row is updated.

## Measuring effect

The product claims only a before-and-after change on matched items for a cohort, with no effectiveness claim. Outside the course, an organisation can watch (by department, never by named individual): use of approved against public AI tools, data loss prevention alerts for pastes into AI tools, reports of AI slips (should rise at first) and of impersonation attempts, and staff-survey items ("I know which AI tools I can use and what can go in them", "I'd feel comfortable ringing a senior leader back to check").
