# SAFETYNET Field Guide: SSH Access and Bruteforce

## Objective
Use this guide when you need to gain an authenticated foothold on a remote Linux host over SSH. The goal is to confirm the service is reachable, recover a valid credential through online password testing, log in, and orient yourself on the system.

## Quick Reference
- **SSH** is encrypted remote shell access. **Hydra** is an online credential-testing engine that tries login combinations against a service until one works.
- Confirm reachability first, test credentials second, connect third.
- Start small: common-password lists catch most weak accounts before you reach for large lists.

```bash
# 1. Confirm the SSH port is open
nc -zv [target-ip] 22

# 2. Test credentials online with Hydra
hydra -l [username] -P [wordlist] [target-ip] -t 4 ssh

# 3. Connect once you have a valid pair
ssh [username]@[target-ip]
```

| Tool | Option | Meaning |
|------|--------|---------|
| Hydra | `-l [user]` | Single username to test |
| Hydra | `-L [file]` | List of usernames |
| Hydra | `-P [file]` | Password wordlist |
| Hydra | `-t [n]` | Parallel tasks (4–8 typical) |
| SSH | `-p [port]` | Non-standard port (default 22) |

## Core Workflow
1. **Verify the target.** Confirm the host is up and SSH is listening (`nc -zv [target-ip] 22`). A refused connection means wrong host, wrong port, or service down.
2. **Choose a username.** Use account names you have discovered through reconnaissance, notes, or service banners. Guessing the right user halves the problem.
3. **Pick a wordlist.** Begin with a short list of common credentials, then expand only if needed. Targeted lists built from names, dates, and organisation terms often beat huge generic ones.
4. **Run Hydra.** A success line looks like `[22][ssh] host: ... login: [user] password: [found]`. Record the pair.
5. **Connect and orient.** `ssh [username]@[target-ip]`, accept the host key on first connect, then run `whoami`, `hostname`, `pwd`, and `ls -la` to confirm where you landed.

## Selecting and Sizing Wordlists
| Size | Time | Use when |
|------|------|----------|
| Top 100 | Seconds | Quick check for obvious credentials |
| Top 1,000 | 1–2 min | Most common weak passwords |
| Top 10,000 | 10–15 min | Typical weak passwords |

Weak passwords cluster around predictable patterns: organisation names, account-derived strings, founding/anniversary years, and simple variations (`Word1`, `Word!`, `Word2024`). System wordlists are usually available on the attack VM under `/usr/share/wordlists/`.

## Common Failure Modes
- **Hydra finishes with no match:** wrong username, wrong list, or possible lockout. Reconfirm the account, try a different list.
- **Attack is slow or stalls:** raise threads (`-t 8`) or shrink the list; some hosts rate-limit after failures, in which case reduce threads.
- **"Connection refused" on SSH:** service not listening or wrong port/host — re-check with `nc`.
- **"Permission denied" with the right password:** additional restriction in play (key-only auth, IP allow-list).

## Mission Application
Reaching this host is the foothold step before deeper exploitation. Confirm the port, test a sensible username against a focused wordlist, and once you are in, note your privilege level immediately — it tells you whether you can read what you need or must escalate next.

---
**Adapted from:** SAFETYNET Training Materials (SSH and Credential Attacks modules)
**For:** SAFETYNET Operatives — **Classification:** Field Use
