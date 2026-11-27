# Stage 8: Scenario Review and Validation

**Purpose:** Conduct comprehensive review of the complete scenario to ensure quality, consistency, playability, educational value, and technical correctness before implementation.

**Output:** A validation report with findings, required fixes, recommendations, and final approval or revision requests.

---

## Your Role

You are a scenario validator for Break Escape. Your task is to:

1. Review all materials from Stages 0-7 for completeness and quality
2. Verify consistency across all scenario elements
3. Validate technical compliance with game systems
4. Ensure educational objectives are met
5. Check narrative quality and player experience
6. Identify issues and recommend fixes
7. Provide final approval or request revisions

**You are the quality gate.** Nothing proceeds to implementation without passing this review.

## Required Input

You should receive from all previous stages:
- Stage 0: Initialization (challenges, cell, theme)
- Stage 1: Narrative structure
- Stage 2: Storytelling elements
- Stage 3: Moral choices
- Stage 4: Player objectives
- Stage 5: Room layout
- Stage 6: LORE fragments
- Stage 7: Ink scripts

## Required Reading

### All Previous Stage Outputs
Review every document produced in Stages 0-7

### Reference Documentation
- `story_design/universe_bible/` - Entire universe bible for consistency checks
- `docs/GAME_DESIGN.md` - Game mechanics and constraints
- `docs/ROOM_GENERATION.md` - Technical room requirements
- `docs/INK_INTEGRATION.md` - Ink integration requirements
- `story_design/universe_bible/10_reference/style_guide.md` - Writing standards
- `story_design/universe_bible/10_reference/cybok_mapping.md` - Educational standards

## Review Process

### Step 1: Completeness Check

```markdown
## Completeness Validation

### Required Deliverables

**Stage 0: Initialization**
- [ ] Technical challenges defined (3-5 challenges)
- [ ] ENTROPY cell selected and justified
- [ ] Narrative theme chosen
- [ ] Initialization summary complete

**Stage 1: Narrative Structure**
- [ ] Three-act structure defined
- [ ] All key story beats identified
- [ ] Challenge integration mapped
- [ ] Pacing and tension planned

**Stage 2: Storytelling Elements**
- [ ] All NPC characters profiled
- [ ] Atmospheric design complete
- [ ] Dialogue guidelines created
- [ ] Key storytelling moments defined

**Stage 3: Moral Choices**
- [ ] Major choices designed (2-4 recommended)
- [ ] Consequences mapped
- [ ] Ethical framework validated
- [ ] Choice implementation planned

**Stage 4: Player Objectives**
- [ ] Primary objectives defined (3-6)
- [ ] Secondary objectives created (2-5)
- [ ] Progression structure mapped
- [ ] Success/failure states defined

**Stage 5: Room Layout**
- [ ] All rooms specified with dimensions
- [ ] Room connections documented
- [ ] Challenge placement completed
- [ ] Item distribution mapped
- [ ] NPC positioning defined
- [ ] Technical validation completed

**Stage 6: LORE Fragments**
- [ ] Fragment budget determined
- [ ] All fragments written
- [ ] Fragment metadata complete
- [ ] Discovery flow planned
- [ ] LORE system validation passed

**Stage 7: Ink Scripts**
- [ ] Opening cutscene scripted
- [ ] Closing cutscene(s) scripted
- [ ] All NPC dialogues scripted
- [ ] Choice moments implemented
- [ ] Mid-scenario beats scripted
- [ ] Syntax validated in Inky

### Missing Elements Check

**Critical Missing Elements:**
[List anything required that's missing]

**Recommended Additions:**
[List anything that would improve the scenario]

**Optional Enhancements:**
[List nice-to-have elements]
```

### Step 2: Consistency Validation

```markdown
## Consistency Across Stages

### Narrative Consistency

**Character Consistency:**
- [ ] Character voices are consistent from Stage 2 through Stage 7 Ink
- [ ] Character motivations align across all appearances
- [ ] Character knowledge/awareness is logical throughout
- [ ] No characters appear/disappear without explanation

**Issues Found:**
[List any character inconsistencies]

**Story Consistency:**
- [ ] Events occur in logical order
- [ ] Timeline makes sense
- [ ] No contradictions in what happened
- [ ] Cause and effect relationships work

**Issues Found:**
[List any story logic problems]

**Tone Consistency:**
- [ ] Atmospheric design (Stage 2) matches narrative tone (Stage 1)
- [ ] Dialogue tone (Stage 7) matches style guide
- [ ] Serious/humorous balance is appropriate
- [ ] ENTROPY cell portrayal is consistent with universe bible

**Issues Found:**
[List any tone inconsistencies]

### Technical Consistency

**Challenge-Objective Alignment:**
- [ ] All Stage 0 challenges are addressed in Stage 4 objectives
- [ ] All Stage 4 objectives have associated challenges
- [ ] Challenge difficulty matches stated tier
- [ ] Challenge placement (Stage 5) supports objectives

**Issues Found:**
[List any misalignments]

**Spatial Consistency:**
- [ ] Stage 2 location descriptions match Stage 5 room designs
- [ ] NPC positions (Stage 5) align with their dialogue (Stage 7)
- [ ] Item locations support challenge requirements
- [ ] LORE fragment placement makes narrative sense

**Issues Found:**
[List any spatial inconsistencies]

**Choice Consistency:**
- [ ] Stage 3 choices are implemented in Stage 7 Ink
- [ ] Choice consequences appear in Ink where specified
- [ ] Variables track choices correctly
- [ ] Ending variations reflect choices

**Issues Found:**
[List any choice implementation issues]

### Universe Canon Consistency

**ENTROPY Cell Accuracy:**
- [ ] Cell selection (Stage 0) matches capabilities shown
- [ ] Cell philosophy is portrayed accurately
- [ ] Cell methods align with universe bible
- [ ] Cell members are consistent with established canon

**Issues Found:**
[List any canon violations]

**SAFETYNET Accuracy:**
- [ ] Field operations rules are respected
- [ ] Handler behavior is appropriate
- [ ] Agency protocols are followed
- [ ] Technology matches established capabilities

**Issues Found:**
[List any SAFETYNET inconsistencies]

**World Rules:**
- [ ] Technology is appropriate for the world
- [ ] No violations of established universe rules
- [ ] Timeline fits with other scenarios
- [ ] Cross-references to other scenarios are accurate

**Issues Found:**
[List any world-building violations]
```

### Step 3: Technical Validation

```markdown
## Technical Compliance

### Room Generation Compliance

**Critical Requirements:**
- [ ] All rooms are 4×4 to 15×15 GU
- [ ] All rooms have 1 GU padding correctly accounted for
- [ ] All items are placed in usable space (NOT in padding)
- [ ] All room connections have ≥ 1 GU overlap
- [ ] Door placements are valid
- [ ] Total map footprint is reasonable

**Review Each Room:**

**Room 1: [Name]**
- Size: [X]×[Y] GU ✓/✗
- Usable space: [X-2]×[Y-2] GU ✓/✗
- Items in usable space: ✓/✗
- Connections valid: ✓/✗

[Repeat for all rooms]

**Issues Found:**
[List all room generation violations]

**CRITICAL:** Any room generation violations MUST be fixed. These will break the game.

### Ink Technical Validation

**Syntax Correctness:**
- [ ] All .ink files validated in Inky editor
- [ ] No syntax errors
- [ ] All diverts point to existing knots
- [ ] All variables are declared
- [ ] All conditionals have proper syntax

**Logic Correctness:**
- [ ] No infinite loops
- [ ] All branches reach END or valid divert
- [ ] Conditional logic is sound
- [ ] Variable states are tracked correctly

**Integration Correctness:**
- [ ] External variables match game system expectations
- [ ] Variable names are consistent with documentation
- [ ] Events are triggered at correct points
- [ ] Game state is read correctly

**Issues Found:**
[List all Ink technical issues]

### Game System Integration

**Objective System:**
- [ ] Objectives can be tracked by game
- [ ] Success criteria are implementable
- [ ] Progression gates work with game logic
- [ ] Failure handling is implementable

**Challenge System:**
- [ ] All challenges use available game mechanics
- [ ] Challenge success criteria are clear
- [ ] Challenge difficulty is appropriate
- [ ] Challenges are actually implementable with current systems

**Issues Found:**
[List integration concerns]

**Implementation Feasibility:**
[Are there any challenges or features that may be difficult/impossible to implement with current game systems?]
```

### Step 4: Educational Validation

```markdown
## Educational Quality

### Learning Objectives

**CyBOK Alignment:**
For each technical challenge:

**Challenge 1: [Name]**
- CyBOK area: [Area from Stage 0]
- Learning objective: [What player should learn]
- Accuracy: ✓/✗ [Is the technical content accurate?]
- Appropriateness: ✓/✗ [Is difficulty right for tier?]
- Effectiveness: ✓/✗ [Will players actually learn this?]

[Repeat for all challenges]

**Issues Found:**
[List any educational concerns]

### Technical Accuracy

**Cybersecurity Concepts:**
- [ ] All technical information is accurate
- [ ] No outdated or deprecated techniques taught
- [ ] No "Hollywood hacking" nonsense
- [ ] Real-world applicability is clear
- [ ] Best practices are demonstrated

**Common Accuracy Issues to Check:**
- Are port numbers realistic?
- Are IP addresses valid?
- Is encryption properly described?
- Are command syntaxes correct?
- Are vulnerability names real?
- Are attack methods accurate?

**Issues Found:**
[List any technical inaccuracies]

### Ethical Framework

**SAFETYNET Rules Compliance:**
- [ ] Scenario respects field operations handbook
- [ ] Choices align with ethical framework
- [ ] No encouragement of illegal hacking
- [ ] Civilian safety is prioritized appropriately
- [ ] Legal boundaries are respected

**Ethical Choice Quality:**
- [ ] Choices reflect real security dilemmas
- [ ] No choice is clearly unethical
- [ ] Competing values are legitimate
- [ ] Consequences are appropriate

**Issues Found:**
[List any ethical concerns]

### Pedagogical Effectiveness

**Teaching Quality:**
- [ ] Concepts are introduced before required
- [ ] Difficulty progression is appropriate
- [ ] Players learn by doing, not by reading
- [ ] Failure provides learning opportunities
- [ ] Success reinforces correct understanding

**Engagement:**
- [ ] Learning is integrated into narrative
- [ ] Technical challenges advance the story
- [ ] Players are motivated to learn
- [ ] Educational content doesn't feel like homework

**Issues Found:**
[List pedagogical concerns]
```

### Step 5: Narrative Quality Review

```markdown
## Narrative Quality

### Story Structure

**Three-Act Structure:**
- [ ] Act 1 establishes situation effectively
- [ ] Act 2 develops investigation compellingly
- [ ] Act 3 provides satisfying climax
- [ ] Pacing is appropriate throughout
- [ ] Story beats land with impact

**Issues Found:**
[List structural problems]

### Character Quality

**Character Development:**
- [ ] NPCs feel like real people
- [ ] Character motivations are clear
- [ ] Character voices are distinct
- [ ] Characters serve story purpose
- [ ] No flat or one-dimensional characters

**Dialogue Quality:**
- [ ] Dialogue sounds natural when read aloud
- [ ] Characters speak distinctly
- [ ] Exposition is integrated smoothly
- [ ] No awkward or stilted conversations
- [ ] Emotional beats land effectively

**Read-Aloud Test:**
[Did you read all dialogue aloud? What felt off?]

**Issues Found:**
[List character/dialogue problems]

### Emotional Impact

**Engagement:**
- [ ] Opening hooks player attention
- [ ] Stakes are clear and meaningful
- [ ] Tension builds appropriately
- [ ] Climax is genuinely tense
- [ ] Resolution provides satisfaction

**Player Investment:**
- [ ] Player cares about outcome
- [ ] Choices feel meaningful
- [ ] Success feels earned
- [ ] Failure provides motivation to retry

**Issues Found:**
[List engagement problems]

### LORE Integration

**Fragment Quality:**
- [ ] Fragments are well-written
- [ ] Information is interesting and relevant
- [ ] Progressive revelation works
- [ ] Fragments connect to larger universe
- [ ] Discovery is rewarding

**Balance:**
- [ ] Not too many fragments (overwhelming)
- [ ] Not too few fragments (unsatisfying)
- [ ] Distribution across difficulty is good
- [ ] Fragment placement makes sense

**Issues Found:**
[List LORE problems]
```

### Step 6: Player Experience Review

```markdown
## Player Experience

### Playability

**Clarity:**
- [ ] Player always knows what to do next
- [ ] Objectives are clear
- [ ] Success criteria are understandable
- [ ] Navigation is intuitive
- [ ] Puzzle solutions are fair

**Frustration Points:**
[What might frustrate players?]
- Unclear objectives?
- Impossible challenges?
- Confusing layout?
- Unfair difficulty spikes?
- Dead ends?

**Pacing:**
- [ ] No sections drag on too long
- [ ] Action and reflection are balanced
- [ ] Difficulty curve is smooth
- [ ] Breathing room after intense sections
- [ ] Overall duration feels right

**Issues Found:**
[List playability concerns]

### Player Agency

**Meaningful Choices:**
- [ ] Choices actually affect outcomes
- [ ] Player decisions are honored
- [ ] Multiple approaches are viable
- [ ] Exploration is rewarded
- [ ] Player feels in control

**False Choices:**
[Are there any "choices" that don't actually matter?]

**Issues Found:**
[List agency problems]

### Replay Value

**Incentives to Replay:**
- [ ] Multiple choice paths to explore
- [ ] LORE to collect
- [ ] Different approaches possible
- [ ] Secrets to discover
- [ ] Variations in ending

**First vs. Second Playthrough:**
[What's different on replay?]
[Is there enough new to discover?]

**Issues Found:**
[List replay value concerns]

### Accessibility

**Difficulty Options:**
- [ ] Hint system available if stuck
- [ ] Challenges are fair for target tier
- [ ] No mandatory twitch skills
- [ ] Clear feedback on progress
- [ ] Failure allows retry with learning

**Inclusivity:**
- [ ] Language is clear
- [ ] No unnecessary jargon without explanation
- [ ] Visual descriptions are adequate
- [ ] No assumptions about prior knowledge

**Issues Found:**
[List accessibility concerns]
```

### Step 7: Polish and Presentation

```markdown
## Polish Review

### Writing Quality

**Prose:**
- [ ] No typos or spelling errors
- [ ] Grammar is correct
- [ ] Punctuation is appropriate
- [ ] Formatting is consistent
- [ ] Writing is clear and concise

**Style:**
- [ ] Matches Break Escape style guide
- [ ] Tone is consistent throughout
- [ ] Voice is appropriate for each character
- [ ] Technical writing is clear
- [ ] Narrative writing is engaging

**Proofreading:**
[List any writing issues found]

### Formatting and Organization

**Documentation:**
- [ ] All sections are properly formatted
- [ ] Headings are consistent
- [ ] Lists are properly structured
- [ ] Code/Ink is properly formatted
- [ ] Cross-references are accurate

**Organization:**
- [ ] Easy to find information
- [ ] Logical structure
- [ ] Complete table of contents/indices
- [ ] No orphaned sections
- [ ] All files properly named

**Issues Found:**
[List organizational problems]

### Completeness of Documentation

**For Developers:**
- [ ] Clear implementation notes
- [ ] All technical specs provided
- [ ] Integration points documented
- [ ] Variable lists complete
- [ ] Asset requirements listed

**For Writers:**
- [ ] Character voice guides complete
- [ ] Style notes provided
- [ ] Context is clear
- [ ] References are available

**For Designers:**
- [ ] Design rationale documented
- [ ] Alternative approaches noted
- [ ] Edge cases considered
- [ ] Testing guidance provided

**Issues Found:**
[List documentation gaps]
```

### Step 8: Risk Assessment

```markdown
## Risk Analysis

### Implementation Risks

**High Risk Items:**
[Features that might be difficult to implement]
- Risk: [Description]
  - Mitigation: [How to reduce risk]
  - Fallback: [Alternative if it doesn't work]

**Technical Debt:**
[Anything that might cause problems later]

**Dependencies:**
[External dependencies that could cause issues]

### Content Risks

**Controversial Content:**
[Anything that might be sensitive or controversial]
- Issue: [Description]
  - Assessment: [Is this acceptable?]
  - Mitigation: [How to handle carefully]

**Educational Risks:**
[Anything that might teach incorrectly]
- Issue: [Description]
  - Fix: [How to correct]

### Schedule Risks

**Scope Concerns:**
[Is this scenario too ambitious?]
[Could any features be cut if needed?]

**Complexity:**
[Are any systems overly complex?]
[Could they be simplified?]

### Overall Risk Level

**Risk Level:** [Low / Medium / High]

**Justification:**
[Why this risk level?]

**Recommendations:**
[What should be done to manage risks?]
```

## Output Format

```markdown
# Scenario Review Report: [Scenario Name]

**Reviewer:** [Name]
**Review Date:** [Date]
**Scenario Stage:** Complete (Stages 0-7)

## Executive Summary

**Overall Assessment:** [Pass / Pass with Revisions / Needs Major Revisions / Reject]

**Summary:**
[2-3 paragraph overview of the scenario and review findings]

**Strengths:**
- [Key strength 1]
- [Key strength 2]
- [Key strength 3]

**Concerns:**
- [Key concern 1]
- [Key concern 2]
- [Key concern 3]

**Recommendation:**
[Approve for implementation / Request revisions / Needs redesign]

---

## Detailed Review Findings

### 1. Completeness Check
[Results from Step 1]

### 2. Consistency Validation
[Results from Step 2]

### 3. Technical Validation
[Results from Step 3]

### 4. Educational Validation
[Results from Step 4]

### 5. Narrative Quality Review
[Results from Step 5]

### 6. Player Experience Review
[Results from Step 6]

### 7. Polish and Presentation
[Results from Step 7]

### 8. Risk Assessment
[Results from Step 8]

---

## Issues Summary

### Critical Issues (MUST FIX)
[Issues that prevent implementation]

1. [Issue description]
   - **Location:** [Which stage/file]
   - **Impact:** [Why this is critical]
   - **Required Fix:** [What must be done]

### Major Issues (SHOULD FIX)
[Issues that significantly impact quality]

1. [Issue description]
   - **Location:** [Which stage/file]
   - **Impact:** [Why this matters]
   - **Recommended Fix:** [What should be done]

### Minor Issues (NICE TO FIX)
[Issues that would improve quality]

1. [Issue description]
   - **Location:** [Which stage/file]
   - **Recommendation:** [Suggested improvement]

---

## Validation Results

### Educational Standards: ✓ / ✗
[Pass or fail, with explanation]

### Technical Standards: ✓ / ✗
[Pass or fail, with explanation]

### Narrative Standards: ✓ / ✗
[Pass or fail, with explanation]

### Universe Canon: ✓ / ✗
[Pass or fail, with explanation]

### Implementation Readiness: ✓ / ✗
[Pass or fail, with explanation]

---

## Recommendations

### Before Implementation
[What must be done before this can be implemented]

1. [Recommendation 1]
2. [Recommendation 2]
etc.

### For Future Iterations
[Enhancements that could be added later]

1. [Enhancement 1]
2. [Enhancement 2]
etc.

### Lessons Learned
[What can be applied to future scenarios]

1. [Lesson 1]
2. [Lesson 2]
etc.

---

## Final Decision

**Status:** [APPROVED / APPROVED WITH REVISIONS / NEEDS MAJOR REVISION / REJECTED]

**Conditions for Approval:**
[If approved with conditions, what must be done]

**Next Steps:**
[What happens next]

**Sign-off:**
- [ ] Educational content validated
- [ ] Technical implementation feasible
- [ ] Narrative quality acceptable
- [ ] Universe consistency maintained
- [ ] Ready for development

---

**Reviewer Signature:** [Name]
**Date:** [Date]
```

## Quality Checklist

Before finalizing review, verify:

### Review Completeness
- [ ] All stages reviewed (0-7)
- [ ] All deliverables checked
- [ ] All checklists completed
- [ ] All issues documented
- [ ] All recommendations provided

### Review Thoroughness
- [ ] Actually read all Ink scripts (didn't just skim)
- [ ] Actually checked room dimensions (didn't just assume)
- [ ] Actually tested Ink syntax (didn't just trust)
- [ ] Actually read LORE fragments (didn't just count)
- [ ] Actually considered player experience (didn't just check boxes)

### Review Fairness
- [ ] Feedback is constructive
- [ ] Criticism is specific
- [ ] Praise is given where deserved
- [ ] Recommendations are actionable
- [ ] Standards applied consistently

### Review Usefulness
- [ ] Issues are clearly described
- [ ] Fixes are specific
- [ ] Priorities are clear (critical vs. nice-to-have)
- [ ] Next steps are obvious
- [ ] Feedback can actually be acted upon

## Common Issues to Watch For

### Frequent Problems

**Narrative:**
- Exposition dumps in dialogue
- Flat or interchangeable character voices
- Unclear motivations
- Deus ex machina solutions
- Inconsistent tone

**Technical:**
- Items placed in padding zones (very common!)
- Room overlap < 1 GU
- Undefined Ink variables
- Infinite Ink loops
- Missing else clauses in conditionals

**Educational:**
- Outdated technical information
- "Hollywood hacking" unrealism
- Skippable learning content
- Too much lecture, not enough doing
- Wrong difficulty for tier

**Integration:**
- Objectives without challenges
- Challenges without objectives
- LORE fragments without placement
- Choices without consequences
- Missing prerequisites

**Player Experience:**
- Unclear next steps
- Unfair difficulty spikes
- Dead ends
- False choices
- Frustrating busywork

## Review Tips

1. **Read everything** - Don't skim, actually read every document
2. **Test the Ink** - Load it in Inky, test every branch
3. **Walk through mentally** - Imagine playing the scenario
4. **Check the math** - Room sizes, overlaps, counts
5. **Read aloud** - Dialogue especially
6. **Think like a player** - What would confuse you?
7. **Think like a dev** - What would be hard to implement?
8. **Check the canon** - Does this fit the universe?
9. **Be specific** - "Dialogue feels off" isn't helpful; "Handler doesn't sound professional" is
10. **Be constructive** - Suggest fixes, don't just criticize

---

Save your review report as:
```
scenario_designs/[scenario_name]/08_review/validation_report.md
```

**If Approved:** Scenario proceeds to implementation.

**If Revisions Needed:** Return to appropriate stages with specific feedback, then re-review.

**If Rejected:** Major redesign needed, likely return to Stage 0 or 1.
