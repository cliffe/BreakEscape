---
title: "SAFETYNET Field Guide: SSH Access and Linux System Navigation"
organization: "SAFETYNET"
classification: "OPERATIONAL"
author: ["Agent HaX", "Adapted from SAFETYNET Training Materials"]
source: "scenarios/m01_first_contact/lab_sheet/1_intro_linux.md"
license: "CC BY-SA 4.0"
---

# Handler Note — Agent HaX

You've found a password list. That's one piece of the access chain.

Your immediate objective is to gain remote access, move through the target filesystem efficiently, and recover operationally useful intel.

The next phase usually has two friction points: getting valid SSH access, then moving through Linux directories fast enough to find useful intel. This guide covers both in operational order.

Start with the quick reference, then work the procedure sections. The target details will vary, but the method holds.

— HaX

---

# SAFETYNET Field Guide Extract: SSH Access and Linux System Navigation

## What is SSH and Hydra?

**SSH (Secure Shell)** is encrypted remote access to another computer. Unlike old unencrypted protocols like Telnet, SSH protects your credentials and communications.

**Hydra** is an automated credential-testing engine. It systematically attempts login combinations against network services. For SSH, it connects repeatedly with different passwords until one succeeds—a process known as online brute force.

Once you have credentials from Hydra, you use SSH to actually connect and access the remote system. Then you navigate the Linux filesystem to find the intelligence you're after.

---

## Quick Reference

Use this section as your rapid execution checklist: validate connectivity, run credential testing, then confirm access before moving into filesystem exploration.

### Command Structure

**Testing credentials with Hydra:**
```bash
hydra -l [username] -P [wordlist] [target-ip] -t 4 ssh
```

**Connecting via SSH:**
```bash
ssh [username]@[target-ip]
```

**Linux navigation (once connected):**
```bash
pwd              # Show current location
ls -la           # List files with details
cd [directory]   # Change to directory
cat [filename]   # Display file contents
```

### Common Options

| Tool | Option | What It Does |
|------|--------|--------------|
| Hydra | `-l username` | Specify username to test |
| Hydra | `-P wordlist` | Use a file of passwords |
| Hydra | `-t threads` | Parallel connections (4-8 typical) |
| SSH | `-p port` | Non-standard SSH port (default 22) |
| ls | `-l` | Long format (shows permissions, size, date) |
| ls | `-a` | Show hidden files (starting with .) |
| grep | `-r` | Search recursively in directories |

---

## Part A: SSH Credential Testing with Hydra

### Understanding Wordlists

A wordlist is a file containing passwords, one per line. Hydra tests each password in sequence until it finds a match.

**Strategic approach**: Start with smaller lists of common passwords. Most people use weak, predictable passwords—the top 1,000 catch 40%+ of users.

| Size | Time to Test | Best For |
|------|--------------|----------|
| Top 100 | Seconds | Quick tests, common passwords |
| Top 1,000 | 1-2 minutes | Most common passwords |
| Top 10,000 | 10-15 minutes | Typical weak passwords |
| 100,000+ | Hours | Comprehensive but slow |

**Where to find wordlists**:
- System wordlists already present on the attack VM (for example under `/usr/share/wordlists/`)
- Mission-derived custom lists built from names, dates, and terms you've already discovered
- Short, targeted lists first; expand only if needed

### The Attack Process

#### Step 1: Verify Target Reachability

Before testing credentials, confirm the target is online and SSH is listening:

```bash
# Check if the target is reachable
ping [target-ip]

# Verify SSH is listening on port 22
nc -zv [target-ip] 22
```

Output should show the port is open and responding.

#### Step 2: Prepare Your Wordlist

Create or locate a file with one password per line.

> **[GAMEPLAY NOTE]** You can paste text into the Kali VM using the **clipboard panel**. Click the clipboard icon in the VNC toolbar (top of the VM window) to open it. Paste your text into the textarea — it sends to the VM automatically on paste, or click **Send to VM**. Use this to transfer passwords or commands you've copied from mission documents without retyping them. The panel also has a **`/tmp/flags`** button that reads flag files from the VM directly into your clipboard.

```bash
# Use an existing wordlist
ls /usr/share/wordlists/seclists/Passwords/Common-Credentials/

# Create a custom list
cat > my_passwords.txt << EOF
password123
admin
letmein
welcome
dragon
EOF
```

#### Step 3: Run Hydra

```bash
hydra -l [username] -P my_passwords.txt [target-ip] -t 4 ssh
```

Where:
- `[username]` = The account you're targeting
- `my_passwords.txt` = File with password attempts
- `[target-ip]` = IP address of the remote system
- `-t 4` = Use 4 parallel connections (adjust 2-8 based on speed needs)

#### Step 4: Interpret Results

**Success** — Hydra displays:
```
[22][ssh] host: 192.168.1.100 login: user1 password: foundpassword
```
Write down that password. It's your key.

**No match** — Hydra finishes without finding a password. Try a different wordlist or username.

**Error (connection refused)** — The target isn't reachable or SSH isn't running. Verify with ping/nc.

#### Step 5: Connect with SSH

Once Hydra finds credentials, connect to the host:

```bash
ssh [username]@[target-ip]
```

Then verify where you landed:

```bash
whoami
hostname
pwd
```

If those checks look right, continue to Part B for navigation and file discovery.

### Common Patterns in Target Environments

Real-world password practices follow predictable patterns:

**Weak password characteristics**:
- Based on the company name or industry
- Derived from the account name (if username is "user1", password might be User1_2024)
- Common date patterns (year of founding, current year, anniversary dates)
- Keyboard patterns (qwerty, 123456, password)
- Dictionary words with simple modifications (password1, Password!, Admin123)

**What this means for your attack**: Wordlists containing the most common passwords work because most people choose from a small set of predictable patterns.

---

## Part B: Linux Navigation and File Exploration

### Understanding the Linux Filesystem

Linux organizes files hierarchically, starting from the root directory `/`. Common locations:

```
/home/          — User home directories
/tmp/           — Temporary files
/etc/           — System configuration
/var/log/       — System logs
/usr/bin/       — User programs
```

When you SSH into a system, you start in your home directory, typically `/home/[username]`.

### Essential Navigation Commands

#### pwd — Print Working Directory

Shows your current location in the filesystem:

```bash
pwd
# Output: /home/[username]
```

**When to use**: Whenever you're unsure where you are. It's safe and harmless.

#### ls — List Directory Contents

Lists files and directories. Without flags, shows just names. With flags, shows details:

```bash
# Basic listing
ls
# Output: file1.txt file2.txt directory1

# Detailed listing with permissions and timestamps
ls -la
# Output: 
# drwxr-xr-x  2 user1 user1   4096 May 18 10:23 directory1
# -rw-r--r--  1 user1 user1    234 May 18 10:22 file1.txt
# -rw-r--r--  1 user1 user1   1024 May 18 10:21 file2.txt
# drwxr-xr-x  2 user1 user1   4096 May 18 10:20 .hidden_directory
```

**Useful flags**:
- `-l` = Long format (shows permissions, owner, size, date)
- `-a` = Show all files (including hidden files starting with `.`)
- `-h` = Human-readable sizes (KB, MB instead of bytes)

#### cd — Change Directory

Move to a different directory:

```bash
# Go to a subdirectory
cd directory1

# Go to parent directory (one level up)
cd ..

# Go to home directory (from anywhere)
cd

# Go to root (be careful here)
cd /
```

**Tip**: Tab completion saves typing. Type `cd dir` and press Tab to autocomplete directory names.

#### cat — Display File Contents

Read the contents of a file:

```bash
# Display a text file
cat file1.txt

# Display with line numbers
cat -n file1.txt

# Display multiple files
cat file1.txt file2.txt
```

**When to use**: Examining small to medium text files (config files, flags, logs).

#### grep — Search for Patterns

Find lines matching a pattern in files:

```bash
# Search for "password" in a file
grep "password" config.txt

# Search recursively in all files under a directory
grep -r "password" /home/[username]/

# Case-insensitive search
grep -i "PASSWORD" config.txt

# Show line numbers
grep -n "password" config.txt
```

**When to use**: Locating specific content in files or directories without reading everything.

#### echo — Print Text

Display text or variables:

```bash
# Simple output
echo "Hello, world!"

# Print to a file
echo "text" > newfile.txt
```

### Common File Exploration Patterns

**Discovering what's in a directory**:
```bash
ls -la           # See all files and permissions
ls -lah          # With human-readable sizes
```

**Finding specific files**:
```bash
grep -r "flag" /home/[username]/          # Search for "flag" in all files
grep -r "key\|password\|KEY" /home/       # Search for multiple patterns
find /home/[username]/ -type f            # List all files (not directories)
```

**Examining files you find**:
```bash
cat filename                   # Read entire file
head -20 filename             # Show first 20 lines
tail -10 filename             # Show last 10 lines
wc -l filename                # Count lines in file
```

**Understanding file permissions** (from `ls -la`):
```
-rw-r--r--  1 derek derek   1024 May 18 10:21 file.txt

Breaking this down:
- means regular file (d = directory, l = link)
rw- owner can read and write, not execute
r-- group can read only
r-- others can read only
```

---

## Performance & Troubleshooting

If something fails, treat it as a signal about your assumptions (target, username, wordlist, or command syntax). Work each check in order and you will recover momentum quickly.

### Hydra Attacks Taking Too Long

**Problem**: The attack feels slow or stalls on the current list.

In real operations, timing varies with network quality, target policy, and list size. In this training mission, sustained slowness usually means your username/list choice needs adjustment.

**Solutions**:
1. **Increase threads** — Change `-t 4` to `-t 8` for faster parallel testing
2. **Smaller wordlist** — Narrow your list to top 100 instead of top 10,000
3. **SSH rate limiting** — Some systems slow down after failed attempts; if so, reduce threads and wait

**Monitor progress**: Hydra shows attempts in real-time. If it's doing ~5-10 attempts per second, it's working normally.

### Hydra Completes but No Match

**Problem**: Tested all passwords, found none.

**Likely causes**:
1. **Wrong username** — Verify the account name exists and is spelled correctly
2. **Wrong wordlist** — The password isn't in your list. Try a different one
3. **Account lockout** — Some systems lock after X failed attempts

**Next steps**:
- Confirm the username with reconnaissance
- Expand to a larger wordlist
- Try a different attack vector

### SSH Connection Issues

**"Connection refused"**
- SSH isn't running on that port
- Wrong IP address
- Network unreachable
- Solution: Verify IP and try `ping [target-ip]` first

**"Permission denied" with correct password**
- Password is correct but something else is blocking (2FA, IP restrictions)
- Solution: Check if additional authentication is required

**"Host key verification failed"**
- First time connecting to a system; SSH needs you to verify the fingerprint
- Solution: Type `yes` when prompted to add the host to known_hosts

### Can't Find Files You're Looking For

**Problem**: `ls` shows directories but no expected files.

**Solutions**:
1. **Files might be hidden** — Use `ls -la` to show hidden files (starting with `.`)
2. **Wrong directory** — Confirm you're in the right location with `pwd`
3. **Files exist but with different names** — Use `grep -r` to search for content
4. **Permission issues** — Some files may be unreadable. Note the permissions from `ls -la`

**Discovery approach**:
```bash
# Start broad
ls -la

# Search for keywords
grep -r "flag" /home/[username]/
grep -r "key\|password\|secret" /home/[username]/

# Check specific directories mentioned in system output
cd /home/[username]/
ls -la
cat [any_readable_files]
```

---

## Reference: Linux Concepts

### File Permissions Explained

From `ls -la`, the first 10 characters describe permissions:

```
-rw-r--r--
^         ^
|         └─ Others (world)
└─────────── Owner and Group

Position 1: File type (- = regular file, d = directory)
Positions 2-4: Owner permissions (read, write, execute)
Positions 5-7: Group permissions (read, write, execute)
Positions 8-10: Others permissions (read, write, execute)
```

**Letters mean**:
- `r` = Read
- `w` = Write
- `x` = Execute
- `-` = No permission

**Examples**:
- `-rw-r--r--` = Owner can read/write; group and others can read only
- `drwxr-xr-x` = Directory; owner has all permissions; others can read/execute (enter)

### Command Help

If you don't know what a command does or what flags to use:

```bash
# Full manual (detailed documentation)
man [command]

# Quick help
[command] --help
```

**Getting out of `man`**: Press `q` to quit.

---

## The Sequence in Practice

**Phase 1**: You have a target username and candidate password list
```bash
hydra -l [username] -P [wordlist].txt [target-ip] -t 4 ssh
# [Result: valid login/password pair]
```

**Phase 2**: You now have credentials. Connect.
```bash
ssh [username]@[target-ip]
# [Prompt for password, enter discovered credential]
```

**Phase 3**: You're inside. Explore.
```bash
pwd                    # Confirm location
ls -la                 # See what's here
grep -r "key\|config\|note" /home/[username]/
cat [filename]         # Read files you find
```

---

**Adapted from**: SAFETYNET Training Materials (SSH and Linux Fundamentals modules)  
**Original Source**: scenarios/m01_first_contact/lab_sheet/1_intro_linux.md  
**For**: SAFETYNET Operatives  
**Classification**: Field Use
