---
title: "SAFETYNET Field Guide: Privilege Escalation via Sudo"
organization: "SAFETYNET"
classification: "OPERATIONAL"
author: ["Agent HaX", "Adapted from SAFETYNET Training Materials"]
source: "scenarios/m01_first_contact/lab_sheet/1_intro_linux.md"
license: "CC BY-SA 4.0"
---

# Handler Note — Agent HaX

You're inside, but permissions are now the main barrier.

Your immediate objective is to reach restricted data needed for the mission by moving into the account context that can access it.

That's normal. Linux accounts are segmented by design, and progress often depends on what sudo rights are available from your current context.

This guide gives you the escalation workflow: enumerate sudo rights, test access safely, then pivot to the account that can reach the data you need.

— HaX

---

# SAFETYNET Field Guide Extract: Privilege Escalation via Sudo

## What is Sudo?

**sudo** allows authorized users to execute commands as other users—typically root (administrator) or specific service accounts. It's the standard mechanism for privilege elevation on Linux systems.

Unlike switching to a completely different user account, sudo lets you run individual commands with elevated privileges without logging out and back in. This is powerful, often necessary, and frequently misconfigured.

**Why it matters for you**: If your current account has sudo access, you can read files, execute programs, or access systems that would normally be restricted. Misconfigured sudo rules are one of the most common paths to lateral movement and privilege escalation.

---

## Quick Reference

Use this section to execute in sequence: enumerate permissions first, choose the least intrusive access path that works, and only escalate further if required.

### Basic Sudo Syntax

```bash
sudo [options] [command]
```

### Essential Options

| Option | What It Does | Example |
|--------|--------------|---------|
| `-l` | List what you can do with sudo | `sudo -l` |
| `-u [user]` | Run command as specific user | `sudo -u [user] cat /home/[user]/important_note` |
| `-i` | Login shell (become the user fully) | `sudo -i` (become root) |
| `-s` | Non-login shell as the user | `sudo -s /bin/bash` |

### Commands You'll Actually Use

```bash
# Check what you can escalate to
sudo -l

# Read a file as another user
sudo cat /home/[user]/[filename]

# Get a shell as another user
sudo -u [user] /bin/bash

# Run a specific command as another user
sudo -u [user] [command]

# Read files as root
sudo cat /etc/shadow
```

---

## Understanding Your Sudo Permissions

### Checking What You Can Do

```bash
sudo -l
```

This is your first step. It shows exactly what your current account is authorized to do with sudo.

**Output interpretation**:

```
User user1 may run the following commands on desktop:
    (ALL) ALL
    (shatter) NOPASSWD: /bin/bash
    (root) /usr/bin/cat
```

Formatting may differ by system (line wrapping, spacing, ordering). Focus on target user, allowed command, and whether `NOPASSWD` appears.

Breaking this down:
- `(ALL) ALL` — Can run anything as any user (dangerous misconfiguration)
- `(shatter) NOPASSWD: /bin/bash` — Can run `/bin/bash` as user "shatter" without password
- `(root) /usr/bin/cat` — Can run `/usr/bin/cat` as root, but must provide password

### Understanding the Sudoers File

The `sudo` permissions are defined in `/etc/sudoers`. You typically can't read this directly, but you can infer the rules from `sudo -l` output.

**Common rule patterns**:

| Rule | Meaning | Security Impact |
|------|---------|-----------------|
| `(root) ALL` | Can run any command as root | User has full system access |
| `(username) NOPASSWD: /path/to/command` | Can run specific command as username without password | Escalation without auth |
| `(ALL) /usr/bin/cat` | Can run only `cat` as any user | Limited but useful for reading files |
| `(username) /bin/bash` | Can spawn shell as username | Full access to that user's files |

---

## Accessing Files as Another User

### Method 1: Direct File Read (Least Intrusive)

Read a specific file without becoming the other user:

```bash
sudo cat /home/[user]/[filename]
```

Or multiple files:
```bash
sudo cat /home/[user]/file1 /home/[user]/file2
```

**When to use**: When you just need to read specific content. Leaves minimal traces, doesn't open a shell.

**Common permissions to check first**:
```bash
# First, see what you can do
sudo -l

# Try reading accessible files
sudo cat /home/[target_user]/flag
sudo cat /home/[target_user]/config.txt
```

### Method 2: Explore as Another User (Full Access)

Get a shell as the target user:

```bash
sudo -u [user] /bin/bash
```

**What happens**:
- You'll get a new prompt (may look like `[user]@[hostname]:~$`)
- You're now operating as that user
- You can read their files, execute their programs, access their directories

**Verify you're the right user**:
```bash
whoami          # Should show the target username
pwd             # Should show their home directory
id              # Shows detailed user/group info
```

**Example**:
```bash
# Current: user1@desktop:~$
user1@desktop:~$ sudo -u target_user /bin/bash

# Now you're target_user
target_user@desktop:~$ whoami
target_user
target_user@desktop:~$ pwd
/home/target_user
target_user@desktop:~$ ls -la
```

### Method 3: Root Access (Most Dangerous)

If you have sudo access to root:

```bash
sudo -i
```

This gives you a root login shell. You now have complete system access.

**Warning**: Root access means you can modify anything. Be careful not to break the system.

**When you'd need this**: Reading system files, accessing other users' directories, modifying system configuration.

---

## Password Prompts

When you run a sudo command, you may be prompted for a password:

```bash
[sudo] password for derek:
```

**What it's asking for**: Your *current* user's password (in this example, derek's password), not the target user's password.

**Common scenarios**:

| Scenario | What Happens |
|----------|--------------|
| Command in sudoers with NOPASSWD | No prompt—command runs immediately |
| Command in sudoers without NOPASSWD | Prompted for your password once |
| Command NOT in sudoers | Prompted, then denied with "user is not in the sudoers file" |

**If you're unsure**: Check `sudo -l` first. If the command appears in the output without NOPASSWD, prepare to enter your password.

---

## Finding Intelligence Through Escalation

Once you have escalated access, explore systematically:

### Discovering What to Read

```bash
# See what's in the user's home directory
sudo -u [user] ls -la /home/[user]/

# List all files (find readable ones)
sudo -u [user] ls -la /home/[user]/*

# Search for specific content
sudo -u [user] grep -r "config\|deploy\|key\|password" /home/[user]/
```

### Reading Files Safely

```bash
# Read a single file
sudo cat /home/[user]/important_note

# Read multiple files
sudo cat /home/[user]/file1 /home/[user]/file2

# Use grep to extract specific lines
sudo grep "important" /home/[user]/config.txt

# Count lines or get file info
sudo wc -l /home/[user]/config
sudo file /home/[user]/archive.tar.gz
```

### Handling Different File Types

**Text files**:
```bash
sudo cat /home/[user]/config.txt
```

**Encoded/binary files**:
```bash
# Base64-encoded
sudo cat /home/[user]/encoded_data | base64 -d

# Hexdump of binary
sudo xxd /home/[user]/binary_file

# Try to understand file type
sudo file /home/[user]/unknown_file
```

---

## Common Escalation Patterns

### What to Look For

Real-world systems often have these misconfiguration patterns:

**Pattern 1: Unnecessary service accounts with shell access**
```bash
sudo -u [service_account] /bin/bash
```
Service accounts (like `postgres`, `www-data`) sometimes have full shell access when they should be restricted.

**Pattern 2: Wildcards in sudoers**
```bash
(ALL) /usr/bin/cat *
```
Allows running `cat` on any file as any user.

**Pattern 3: Environment variable manipulation**
```bash
(ALL) SETENV: /usr/bin/python
```
Can run Python with custom environment—potential for code execution escalation.

**Pattern 4: Scripts run as other users**
```bash
(ALL) /opt/scripts/backup.sh
```
If the script is writable or calls other programs, you might leverage it.

### Exploitation Approach

1. **Check what you can do**: `sudo -l`
2. **Identify misconfigurations**: Look for overly broad permissions
3. **Test access**: Try reading a file as the target user
4. **Explore systematically**: List directory, find interesting files
5. **Extract intelligence**: Read files containing flags, keys, or configuration

---

## Troubleshooting

Escalation setbacks are common. Use this section to diagnose access failures systematically so you keep control of the workflow instead of guessing.

### "User is not in the sudoers file"

**Meaning**: Your account doesn't have sudo access for this command (or any command).

**Solutions**:
- Double-check you're using the right username
- Check `sudo -l` to see what you *can* do
- Try a different command or user
- This might mean you need a different escalation path

### "Permission denied" Even With Sudo

**Meaning**: You ran sudo, but the target file is still not readable.

**Likely causes**:
1. **You specified the wrong user** — Command is allowed as root, not as the target user
2. **File permissions are restrictive** — Even the target user can't read it
3. **Command syntax wrong** — You're trying to read something that isn't a file

**Solution**:
```bash
# Check what sudo can actually do
sudo -l

# Be explicit about the user
sudo -u [exact_user] cat /path/to/file

# Verify file exists and check permissions
sudo ls -la /path/to/file
```

### Password Prompt Every Time

**Meaning**: Every `sudo` command asks for your password.

**This is normal** — It's a security feature. You're being asked to re-authenticate.

**Solution**: Just enter your password each time. Some systems cache the password briefly, others require it for each command.

### Can't Find Files You're Looking For

**Problem**: You have escalated access but files aren't where you expected.

**Investigation steps**:
```bash
# Verify you're the right user
whoami

# Check your current directory
pwd

# List what's actually there
ls -la

# Search by name
sudo find /home/[user] -name "*flag*" -o -name "*key*"

# Search by content
sudo grep -r "sensitive_content" /home/[user]/
```

### Shell Won't Respond or Appears Frozen

**Problem**: You ran `sudo -u [user] /bin/bash` but nothing happens.

**Solutions**:
1. **Try typing a command anyway** — The shell might be there, just not showing a prompt
2. **Press Enter** — Sometimes the prompt appears after you hit a key
3. **Try a different shell** — Instead of `/bin/bash`, try `sh`: `sudo -u [user] /bin/sh`
4. **Exit the frozen shell** — Press `Ctrl+D` or type `exit` and press Enter

---

## Security & Operational Notes

### Why Sudo Escalation Works

Systems rely on sudo for legitimate administrative tasks. But misconfigurations create opportunities:

- **Overly broad permissions** — Accounts allowed to run all commands as root
- **Service accounts with shell access** — Should be restricted to specific tasks
- **No password requirements** — NOPASSWD rules for sensitive commands
- **Wildcard rules** — Patterns that match too many commands

This is why they're vulnerable to compromise. This is your opportunity.

### What You're Looking For

Once escalated, prioritize finding:
1. **Configuration files** — Often contain credentials, server addresses, deployment info
2. **Key mission artifacts** — Files that contain keys, credentials, or access data
3. **Deployment notes** — Operational planning documents
4. **Scripts and automation** — Reveal what the system does

### Operational Security Notes

- **Leave minimal traces** — Avoid creating files or modifying timestamps when possible
- **Use `cat` over shell access** — Reading files with `sudo cat` is less invasive than opening a shell
- **Check command history** — If there is one, your `sudo` commands may be logged
- **Work quickly** — The longer you're escalated, the higher the risk of detection

---

## The Escalation Sequence in Practice

**Scenario**: You're logged in as a lower-privileged user and need access to another account's files.

### Step 1: Check Your Permissions
```bash
user1@desktop:~$ sudo -l
User user1 may run the following commands on desktop:
    (target_user) NOPASSWD: /bin/bash
    (target_user) /usr/bin/cat
```

### Step 2: Try Direct File Read (If Allowed)
```bash
user1@desktop:~$ sudo cat /home/target_user/important_note
[File contents appear if command is permitted]
```

### Step 3: If You Need to Explore More, Get a Shell
```bash
user1@desktop:~$ sudo -u target_user /bin/bash
target_user@desktop:~$ whoami
target_user
target_user@desktop:~$ ls -la
```

### Step 4: Search for and Read Files
```bash
target_user@desktop:~$ grep -r "deploy\|config\|key" /home/target_user/

target_user@desktop:~$ cat /home/target_user/[interesting_file]
[Review output and identify useful intel]
```

### Step 5: Exit and Return to Original User
```bash
target_user@desktop:~$ exit
user1@desktop:~$ whoami
user1
```

---

## Reference: Common Commands After Escalation

```bash
# Understand where you are
whoami                          # Current user
id                              # User ID, groups, etc.
pwd                             # Current directory
hostname                        # System name

# Explore the escalated user's environment
ls -la /home/[user]/            # See their home directory
cat /home/[user]/.bash_history  # See their command history (if readable)
env | grep -i "path\|home"      # See their environment variables

# Find intelligence
grep -r "flag\|key\|password" /home/[user]/
find /home/[user]/ -type f -name "*config*" -o -name "*deploy*"
ls -lat /home/[user]/           # Most recently modified files (likely active)

# Read different file types
cat [text_file]                 # Plain text
base64 -d [encoded_file]        # Base64-encoded data
strings [binary_file]           # Readable strings from binary
tar -tf [archive]               # List contents without extracting

# Exit when done
exit                            # Exit the escalated shell
```

---

## The Goal

Find what the system was designed to protect, extract it, and report back.

The intelligence is there. The misconfigurations are there. Your task is to connect them.

---

**Adapted from**: SAFETYNET Training Materials (Linux Privilege Escalation module)  
**For**: SAFETYNET Operatives  
**Classification**: Field Use
