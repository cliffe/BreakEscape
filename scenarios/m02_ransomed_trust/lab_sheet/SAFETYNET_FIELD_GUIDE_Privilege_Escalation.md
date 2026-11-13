# SAFETYNET Field Guide: Privilege Escalation

## Objective
Use this guide when you have a foothold on a host but your current account cannot reach the files you need. The goal is to enumerate what your account is permitted to do, then move into a context (another user or root) that can access the target data — using the least intrusive path that works.

## Quick Reference
- **sudo** runs commands as another user (often root) under rules defined in `/etc/sudoers`. Misconfigured rules are a common escalation path.
- Enumerate first (`sudo -l`), then choose the smallest step that gets the access you need.
- Prefer reading a file directly over opening a full shell — it leaves fewer traces.

```bash
sudo -l                          # What can this account run, and as whom?
sudo cat /home/[user]/[file]     # Read a file as the permitted user
sudo -u [user] /bin/bash         # Become another user (full access)
sudo -i                          # Root login shell (most access)
```

## Reading Your sudo Permissions
`sudo -l` is your first move. Typical output:

```
User [you] may run the following commands on [host]:
    ([user]) NOPASSWD: /bin/bash
    (root) /usr/bin/cat
```

- `(target) NOPASSWD: /bin/bash` — run a shell as `target` with no password (direct escalation).
- `(root) /usr/bin/cat` — run `cat` as root, password required.
- `(ALL) ALL` — run anything as anyone (a serious misconfiguration).

Focus on three things in each line: the **target user**, the **allowed command**, and whether **NOPASSWD** appears.

## Core Workflow
1. **Confirm who you are.** `whoami`, `id` — know your starting context.
2. **Enumerate.** `sudo -l` to list permitted commands and target users.
3. **Pick the least intrusive path.** If you only need to read a file, `sudo cat` it as the permitted user. If you need to explore, get a shell with `sudo -u [user] /bin/bash`.
4. **Verify the new context.** After switching, run `whoami` and `pwd` to confirm you are who you expect.
5. **Find and extract.** Search the reachable home directories and config locations for the intel you need.

```bash
sudo -u [user] ls -la /home/[user]/
sudo grep -r "key\|config\|deploy\|password" /home/[user]/
sudo cat /home/[user]/[interesting_file]
```

## Common Misconfiguration Patterns
| Rule | Why it helps you |
|------|------------------|
| Service account with shell access | `sudo -u [svc] /bin/bash` gives that account's files |
| Wildcards (`(ALL) /usr/bin/cat *`) | Read any file as any user |
| `SETENV` on an interpreter | Custom environment can lead to code execution |
| Scripts runnable as another user | A writable or call-chaining script can be leveraged |

## Common Failure Modes
- **"User is not in the sudoers file":** no sudo rights for that command — re-check the username and `sudo -l`.
- **"Permission denied" even with sudo:** you targeted the wrong user, or the file is unreadable even to that user. Be explicit: `sudo -u [exact_user] cat [path]`.
- **Shell appears frozen after `sudo -u ... /bin/bash`:** press Enter, or try `/bin/sh`; `Ctrl+D` to exit.

## Mission Application
A foothold rarely lands you where the sensitive data lives. Treat escalation as a short, deliberate sequence: enumerate, choose the minimal step, verify, extract. Read with `sudo cat` when you can, and only open a shell when you genuinely need to explore.

---
**Adapted from:** SAFETYNET Training Materials (Linux Privilege Escalation module)
**For:** SAFETYNET Operatives — **Classification:** Field Use
