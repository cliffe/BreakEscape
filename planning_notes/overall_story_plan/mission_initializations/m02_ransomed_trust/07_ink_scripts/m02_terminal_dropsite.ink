// ===========================================
// ACT 2 TERMINAL: Drop-Site Terminal (VM Flag Submission)
// Mission 2: Ransomed Trust
// Break Escape - Hybrid Architecture Integration
// ===========================================

// Variables for tracking flag submissions
VAR flag_ssh_submitted = false
VAR flag_proftpd_submitted = false
VAR flag_database_submitted = false
VAR flag_ghost_log_submitted = false

// External variables (set by game)
EXTERNAL player_name

// ===========================================
// MAIN TERMINAL INTERFACE
// ===========================================

=== start ===
#speaker:computer

SAFETYNET DROP-SITE TERMINAL

Secure communication channel for intercepted ENTROPY intelligence.

Submit flags to unlock analysis and resources.

-> main_menu

=== main_menu ===

+ {not flag_ssh_submitted} [Submit Flag 1: SSH Access]
    -> submit_flag_ssh

+ {not flag_proftpd_submitted} [Submit Flag 2: ProFTPD Exploit]
    -> submit_flag_proftpd

+ {not flag_database_submitted} [Submit Flag 3: Database Backup Located]
    -> submit_flag_database

+ {not flag_ghost_log_submitted} [Submit Flag 4: Ghost's Operational Log]
    -> submit_flag_ghost_log

+ [View submission status]
    -> view_status

+ [Exit terminal]
    #exit_conversation
    -> DONE

// ===========================================
// FLAG 1: SSH ACCESS
// ===========================================

=== submit_flag_ssh ===
#speaker:computer

SUBMIT FLAG: SSH ACCESS TO HOSPITAL BACKUP SERVER

Enter flag:

[Player input: flag\{ssh_access_granted}]

System: Flag verified.

System: ENTROPY server credentials intercepted.

System: Unlocking encrypted intelligence files...

~ flag_ssh_submitted = true
#complete_task:submit_ssh_flag
#unlock_task:exploit_proftpd_vulnerability

INTEL UNLOCKED: Hospital backup server accessible via SSH.

Credentials confirmed functional. Proceed with ProFTPD exploitation.

+ [Continue]
    -> main_menu

// ===========================================
// FLAG 2: ProFTPD EXPLOITATION
// ===========================================

=== submit_flag_proftpd ===
#speaker:computer

SUBMIT FLAG: ProFTPD BACKDOOR EXPLOITATION

Enter flag:

[Player input: flag\{proftpd_backdoor_exploited}]

System: Flag verified.

System: ProFTPD CVE-2010-4652 exploitation confirmed.

System: Shell access to backup server established.

~ flag_proftpd_submitted = true
#complete_task:submit_proftpd_flag
#unlock_task:navigate_backup_filesystem

INTEL UNLOCKED: Root filesystem access granted.

Navigate to /var/backups to locate encrypted database files and operational logs.

+ [Continue]
    -> main_menu

// ===========================================
// FLAG 3: DATABASE BACKUP LOCATED
// ===========================================

=== submit_flag_database ===
#speaker:computer

SUBMIT FLAG: DATABASE BACKUP LOCATION

Enter flag:

[Player input: flag\{database_backup_located}]

System: Flag verified.

System: Patient database backups identified.

System: Correlating with ransomware encryption keys...

~ flag_database_submitted = true
#complete_task:submit_database_flag
#unlock_task:locate_offline_backup_keys

INTEL UNLOCKED: Offline backup encryption keys mentioned in Ghost's logs.

Analysis indicates keys stored in physical safe: "Emergency Equipment Storage, Administrative Wing."

Search for 4-digit PIN-locked safe. Clues available in hospital environment.

+ [Continue]
    -> main_menu

// ===========================================
// FLAG 4: GHOST'S OPERATIONAL LOG
// ===========================================

=== submit_flag_ghost_log ===
#speaker:computer

SUBMIT FLAG: GHOST'S OPERATIONAL LOG

Enter flag:

[Player input: flag\{ghost_operational_log}]

System: Flag verified.

System: Ransomware Incorporated operational philosophy document intercepted.

System: Analyzing ENTROPY methodology...

~ flag_ghost_log_submitted = true
#complete_task:submit_ghost_log_flag
#unlock_lore:ghosts_manifesto

WARNING: Ghost calculated patient death probabilities (0.3% per hour).

47 patients on life support = 1-2 deaths if ransom paid immediately, 4-6 if delayed 12 hours.

ENTROPY classification: Ideological attack, not profit-motivated.

Recommendation: Complete recovery ASAP to minimize statistical patient risk.

+ [This is horrifying]
    -> ghost_log_reaction

+ [Continue]
    -> main_menu

=== ghost_log_reaction ===
#speaker:computer

Agent 0x99 (via secure channel): They calculated how many people would die.

Agent 0x99: Spreadsheets of projected fatalities. This is ENTROPY's ideology.

Agent 0x99: Operation Shatter had 42-85 projected deaths. Now patient death probabilities.

Agent 0x99: We're not fighting random criminals. We're fighting true believers.

+ [Continue]
    -> main_menu

// ===========================================
// VIEW STATUS
// ===========================================

=== view_status ===
#speaker:computer

FLAG SUBMISSION STATUS:

{flag_ssh_submitted:
    ✓ Flag 1: SSH Access - SUBMITTED
- else:
    ✗ Flag 1: SSH Access - PENDING
}

{flag_proftpd_submitted:
    ✓ Flag 2: ProFTPD Exploit - SUBMITTED
- else:
    ✗ Flag 2: ProFTPD Exploit - PENDING
}

{flag_database_submitted:
    ✓ Flag 3: Database Backup Located - SUBMITTED
- else:
    ✗ Flag 3: Database Backup Located - PENDING
}

{flag_ghost_log_submitted:
    ✓ Flag 4: Ghost's Operational Log - SUBMITTED
- else:
    ✗ Flag 4: Ghost's Operational Log - PENDING
}

{flag_ssh_submitted and flag_proftpd_submitted and flag_database_submitted and flag_ghost_log_submitted:
    ALL FLAGS SUBMITTED. PROCEED TO PHYSICAL SAFE LOCATION.
}

+ [Return to main menu]
    -> main_menu

+ [Exit terminal]
    #exit_conversation
    -> DONE
