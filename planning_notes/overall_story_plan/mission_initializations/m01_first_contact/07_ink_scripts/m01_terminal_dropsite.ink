// ================================================
// Mission 1: First Contact - Drop-Site Terminal
// Server Room - VM Flag Submission
// Tutorial: Submitting flags for intel/resources
// ================================================

VAR ssh_flag_submitted = false
VAR navigation_flag_submitted = false
VAR sudo_flag_submitted = false
VAR first_use = true

// External variables
EXTERNAL player_name

// ================================================
// START: DROP-SITE TERMINAL
// ================================================

=== start ===
{first_use:
    ~ first_use = false
    -> first_access
}
{not first_use:
    -> hub
}

// ================================================
// FIRST ACCESS (Tutorial)
// ================================================

=== first_access ===
SAFETYNET DROP-SITE TERMINAL
Secure Flag Submission Interface v2.3.1

This terminal accepts flags from VM challenges. Each flag unlocks intelligence or resources.

+ [View available flag categories]
    -> flag_categories
+ [Submit a flag]
    -> hub

=== flag_categories ===
AVAILABLE CATEGORIES:
- SSH Access (Brute Force)
- Linux Navigation (File System)
- Privilege Escalation (Sudo)

Each successful submission provides actionable intelligence.

-> hub

// ================================================
// SUBMISSION HUB
// ================================================

=== hub ===
SAFETYNET DROP-SITE > Ready for submission

+ {not ssh_flag_submitted} [Submit SSH Access Flag]
    -> submit_ssh
+ {not navigation_flag_submitted} [Submit Linux Navigation Flag]
    -> submit_navigation
+ {not sudo_flag_submitted} [Submit Privilege Escalation Flag]
    -> submit_sudo
+ [Exit terminal]
    #exit_conversation
    Terminal session closed.
    -> hub

// ================================================
// SSH FLAG SUBMISSION
// ================================================

=== submit_ssh ===
Enter SSH Access Flag:

[Player enters flag from VM - Hydra brute force]

+ [FLAG_SSH_BRUTE_FORCE_SUCCESS]
    -> ssh_success
+ [Wrong flag]
    -> ssh_retry

=== ssh_success ===
~ ssh_flag_submitted = true
#complete_task:submit_ssh_flag

✓ FLAG VERIFIED: SSH Access

Intelligence unlocked: Credentials provide access to victim user account on compromised server.

Agent 0x99 has been notified. Proceed with Linux navigation challenges.

-> hub

=== ssh_retry ===
✗ FLAG REJECTED

Check your VM terminal output. Flag format should match exactly.

-> hub

// ================================================
// NAVIGATION FLAG SUBMISSION
// ================================================

=== submit_navigation ===
Enter Linux Navigation Flag:

[Player enters flag from VM - found in home directory]

+ [FLAG_LINUX_NAVIGATION_COMPLETE]
    -> navigation_success
+ [Wrong flag]
    -> navigation_retry

=== navigation_success ===
~ navigation_flag_submitted = true
#complete_task:submit_navigation_flag

✓ FLAG VERIFIED: Linux Navigation

Intelligence unlocked: File system mapping reveals additional user accounts. Investigate privilege escalation options.

Agent 0x99: Good work. Look for sudo access or other privilege escalation vectors.

-> hub

=== navigation_retry ===
✗ FLAG REJECTED

Navigate the victim's file system carefully. Check hidden files and directories.

-> hub

// ================================================
// SUDO FLAG SUBMISSION
// ================================================

=== submit_sudo ===
Enter Privilege Escalation Flag:

[Player enters flag from VM - bystander account access]

+ [FLAG_SUDO_ESCALATION_COMPLETE]
    -> sudo_success
+ [Wrong flag]
    -> sudo_retry

=== sudo_success ===
~ sudo_flag_submitted = true
#complete_task:submit_sudo_flag

✓ FLAG VERIFIED: Privilege Escalation

CRITICAL INTELLIGENCE UNLOCKED:

Bystander account files reveal Derek Lawson's coordination with Zero Day Syndicate cell.

Evidence: Encrypted communications referencing "Phase 3" election manipulation timeline.

Agent 0x99: This confirms Derek is the primary operative. Gather physical evidence to correlate.

-> hub

=== sudo_retry ===
✗ FLAG REJECTED

Use sudo commands to access other user accounts. Check for lateral movement opportunities.

-> hub
