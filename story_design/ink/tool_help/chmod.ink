// ===========================================
// TOOL HELP: CHMOD
// Break Escape Universe
// ===========================================
// Educational content about chmod and file permissions
// For use in training scenarios and missions
// ===========================================

=== chmod_help ===

Guide: chmod—"change mode"—is a fundamental Linux/Unix command for managing file permissions.

Guide: Understanding permissions is critical in security work. Misconfigured permissions are a common vulnerability, and you'll often need to modify permissions during operations.

+ [What are file permissions?]
    -> chmod_permissions_basics

+ [How do I read permission notation?]
    -> chmod_reading_permissions

+ [How do I use chmod?]
    -> chmod_usage

+ [What are the numeric codes?]
    -> chmod_numeric

+ [Show me common examples]
    -> chmod_examples

+ [I understand now]
    -> chmod_end

// ----------------
// Permissions basics
// ----------------

=== chmod_permissions_basics ===

Guide: Every file and directory in Linux has three types of permissions:

Guide: **Read (r)**: Permission to view file contents or list directory contents
**Write (w)**: Permission to modify file contents or create/delete files in a directory
**Execute (x)**: Permission to run a file as a program, or access a directory

Guide: These permissions are set for three categories of users:

Guide: **Owner (u)**: The user who owns the file
**Group (g)**: Users who are members of the file's group
**Others (o)**: Everyone else

Guide: Think of it as a security matrix: for each file, you define what the owner can do, what the group can do, and what everyone else can do.

Guide: When you run `ls -l`, you see permissions like this:
```
-rw-r--r--  1 user group  1234 Jan 1 12:00 file.txt
```

Guide: That first part `-rw-r--r--` shows the permissions. Let's break it down:
- First character: File type (`-` for file, `d` for directory, `l` for symlink)
- Next three: Owner permissions (`rw-` = read and write, no execute)
- Next three: Group permissions (`r--` = read only)
- Last three: Others permissions (`r--` = read only)

* [How do I read this notation?]
    -> chmod_reading_permissions

* [How do I change permissions?]
    -> chmod_usage

* [What are the numeric codes?]
    -> chmod_numeric

* [Show me examples]
    -> chmod_examples

// ----------------
// Reading permissions
// ----------------

=== chmod_reading_permissions ===

Guide: Let's decode permission strings step by step.

Guide: **Example 1**: `-rwxr-xr-x`
- `-`: Regular file
- `rwx`: Owner can read, write, and execute
- `r-x`: Group can read and execute, but not write
- `r-x`: Others can read and execute, but not write

Guide: This might be an executable script that everyone can run, but only the owner can modify.

Guide: **Example 2**: `drwxrwx---`
- `d`: Directory
- `rwx`: Owner has full access (read, write, execute = can enter and modify directory)
- `rwx`: Group has full access
- `---`: Others have no access at all

Guide: This is a shared directory for a specific group, completely private from other users.

Guide: **Example 3**: `-rw-------`
- `-`: Regular file
- `rw-`: Owner can read and write
- `---`: Group has no access
- `---`: Others have no access

Guide: This is a private file, like you might use for sensitive data or SSH keys.

Guide: **Example 4**: `-rwsr-xr-x`
- Notice the `s` instead of `x` in owner permissions
- This is a special "setuid" bit
- When executed, the program runs with owner privileges, not the user's privileges
- This is powerful and potentially dangerous!

* [How do I change these permissions?]
    -> chmod_usage

* [Explain the basics again]
    -> chmod_permissions_basics

* [What are the numeric codes?]
    -> chmod_numeric

* [Show me examples]
    -> chmod_examples

// ----------------
// Using chmod
// ----------------

=== chmod_usage ===

Guide: chmod has two modes: symbolic and numeric. Let's cover both.

Guide: **SYMBOLIC MODE:**

Guide: Basic syntax: `chmod [who][operation][permissions] filename`

Guide: **Who:**
- `u` = user (owner)
- `g` = group
- `o` = others
- `a` = all (everyone)

Guide: **Operation:**
- `+` = add permission
- `-` = remove permission
- `=` = set exact permission

Guide: **Permissions:**
- `r` = read
- `w` = write
- `x` = execute

Guide: **Examples:**
- `chmod u+x script.sh` - Add execute permission for owner
- `chmod g-w file.txt` - Remove write permission for group
- `chmod o+r document.txt` - Add read permission for others
- `chmod a+x program` - Add execute permission for everyone
- `chmod u=rwx,g=rx,o=r file.txt` - Set exact permissions for each category

Guide: **Common patterns:**
- `chmod +x script.sh` - Make executable (shorthand for a+x)
- `chmod -w file.txt` - Make read-only
- `chmod u+x,go-rwx private_script.sh` - Executable only by owner

* [Tell me about numeric mode]
    -> chmod_numeric

* [Show me practical examples]
    -> chmod_examples

* [Explain permissions again]
    -> chmod_permissions_basics

* [I understand now]
    -> chmod_end

// ----------------
// Numeric mode
// ----------------

=== chmod_numeric ===

Guide: Numeric (octal) mode is faster once you learn it. Each permission has a value:

Guide: **Permission values:**
- `r` (read) = 4
- `w` (write) = 2
- `x` (execute) = 1
- No permission = 0

Guide: You add them up for each category:
- `rwx` = 4+2+1 = 7
- `rw-` = 4+2+0 = 6
- `r-x` = 4+0+1 = 5
- `r--` = 4+0+0 = 4
- `---` = 0+0+0 = 0

Guide: Then you provide three digits: owner, group, others.

Guide: **Common permission codes:**

Guide: **755** (`rwxr-xr-x`):
Owner has full control, everyone can read and execute
Common for executable scripts and programs

Guide: **644** (`rw-r--r--`):
Owner can modify, everyone can read
Common for regular files and documents

Guide: **600** (`rw-------`):
Only owner can read and write, no one else has access
Common for private files, SSH keys, credentials

Guide: **700** (`rwx------`):
Only owner has full control, no one else can access
Common for private directories

Guide: **666** (`rw-rw-rw-`):
Everyone can read and write (generally not recommended!)
Potentially insecure

Guide: **777** (`rwxrwxrwx`):
Full permissions for everyone (dangerous!)
Almost never a good idea in production

Guide: **Usage:**
- `chmod 755 script.sh`
- `chmod 600 id_rsa`
- `chmod 644 config.txt`

* [Show me practical examples]
    -> chmod_examples

* [Explain symbolic mode]
    -> chmod_usage

* [What do permissions mean?]
    -> chmod_permissions_basics

* [I'm ready to use chmod]
    -> chmod_end

// ----------------
// Examples
// ----------------

=== chmod_examples ===

Guide: Let's walk through real-world scenarios:

Guide: **Scenario 1: Making a script executable**
You download a Python script and want to run it:
```
$ ls -l script.py
-rw-r--r--  1 user group  1234 Jan 1 12:00 script.py
$ chmod +x script.py
$ ls -l script.py
-rwxr-xr-x  1 user group  1234 Jan 1 12:00 script.py
$ ./script.py
(script runs)
```

Guide: **Scenario 2: Securing SSH private key**
SSH will refuse to use a private key with loose permissions:
```
$ chmod 600 ~/.ssh/id_rsa
```
Now only you can read or write your private key. Required for security.

Guide: **Scenario 3: Creating a shared group directory**
Team members need to collaborate:
```
$ mkdir shared_project
$ chmod 770 shared_project
$ chgrp developers shared_project
```
Now all members of the "developers" group can fully access it, but others cannot.

Guide: **Scenario 4: Making a file read-only**
You have a configuration you don't want accidentally modified:
```
$ chmod 444 important_config.conf
```
Now no one can write to it (you'd need to chmod again to modify it).

Guide: **Scenario 5: After uploading a web shell (penetration testing)**
You've uploaded exploit.php to a web server:
```
$ chmod 755 exploit.php
```
Now the web server can execute it (as can you), but it's not writable by others.

Guide: **Scenario 6: Recursive permissions for a directory**
Set permissions for a directory and everything inside:
```
$ chmod -R 755 /var/www/website/
```
The `-R` flag applies recursively to all files and subdirectories.

* [Explain numeric codes again]
    -> chmod_numeric

* [Tell me about symbolic mode]
    -> chmod_usage

* [What are permissions?]
    -> chmod_permissions_basics

* [I'm ready to practice]
    -> chmod_end

// ----------------
// End
// ----------------

=== chmod_end ===

Guide: Understanding chmod is essential for Linux security work. You'll use it constantly for:
- Securing sensitive files
- Making scripts executable
- Fixing permission vulnerabilities
- Post-exploitation activities

Guide: Key principles:
- **Principle of least privilege**: Grant only the permissions needed
- **Protect private keys**: Always use 600 or 400 for SSH keys
- **Be cautious with 777**: World-writable permissions are usually dangerous
- **Check before you change**: Use `ls -l` to see current permissions first

Guide: Practice in a safe environment until chmod becomes second nature.

-> END
