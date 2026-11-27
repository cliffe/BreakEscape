# VM shape for m09 and m10

Counts, positions, account names and plain service types only. No exploit steps, commands, CVE numbers or tool names.

Sources: `docs/agents/SECGEN_MODULE_PLAN.md` ("Finale & remaining missions"), SecGen `scenarios/ctf/` and `scenarios/break_escape/safetynet/`.

## 1. Existing SecGen scenarios for m09 and m10

None. Nothing in SecGen `scenarios/` is named for m09, m10 or the finale.

## 2. SAFETYNET m01 to m08 (the usual size)

Each mission has one target box plus an attacker box. The attacker box is not counted.

| Mission | Target box | Flags | Where the flags sit |
|---|---|---|---|
| m01 First Contact | Desktop with remote login | 4 | Two on the operative's account (user level). Two on a second account, reached through privilege from the first. |
| m02 Ransomed Trust | Backup desktop, old file transfer server | 4 | One on a low-privilege IT account. Two readable over anonymous file transfer, before any login. One root, via the file transfer server. |
| m03 Ghost in the Machine | Desktop with a small web site, old file transfer server, build service | 4 | One in the service banners (visible to any scan). One on the public web site, encoded. One root, via the file transfer server. One in the build service's user home. |
| m04 Critical Failure | Jump server: status web page, old file transfer server, remote login on a high port | 4 | One on the public status page. One root, via the file transfer server. One root-only file, reached through privilege escalation. One in the remote-login user's home. |
| m05 Insider Trading | Research server: blog and content site, remote login | 5 (4 plus a bonus) | One on a public admin note. One via the web app's shell. One in the manager account's home. One root. Bonus: inside a password-protected archive, off the main path. |
| m06 Follow the Money | Desktop with analytics database, remote login | 4 | Three on backend accounts (user level), one each. One in the vault account's home, readable by the operator account through a privilege rule. |
| m07 Architect's Gambit | Attack host: network file share, plain-text message service, remote login | 4 | One on a file share (no login). One on a message service (no login). One on a user account. One root. |
| m08 The Mole | Code repository viewer, remote login | 4 | One in the repository's public listing. One in the repository history (a password). One on the mole's operations account. One root. |

The usual size is four flags on one target box. Two or more flags are visible before any login in m02, m03, m04, m05, m07 and m08.

## 3. m09 candidate: Nosferatu (`scenarios/ctf/nosferatu.xml`)

- **Servers:** one target box, plus the attacker box that the file defines.
- **Flags:** 4.
- **Flag positions:**
  1. Public web page, plain text, before any login.
  2. Same public web page, encoded. The player has to decode it on the attacker box.
  3. Home directory of the web service account, after getting in (user level).
  4. Root's home directory, after privilege escalation.
- **Account names students see:** `nostromousr`, the web service account. The file names no other accounts on the target. The attacker box uses `kali`.
- **Service:** an old, lightweight web server that nobody has patched.
- **Optional second service** (the plan's IRC option, from the Eyearesee catalogue scenario): adds two flags, so six in total, which is above the usual four.

Fit notes:
- Two public flags suit a site that nobody took down.
- A web daemon's service account is an awkward owner for an operative's files. The story needs a reason for the files to sit under it.

## 4. m10 candidate: Containers Escape (`scenarios/ctf/container_escape.xml`)

- **Servers:** two targets, `desktop` and `chroot_esc_server`. The file defines no attacker box, so the designers must supply one.
- **Flags:** 2, one per target.
- **Flag positions:** both sit in the host's root home. They are only reached after leaving the container (desktop) or the jail (chroot server). Neither the container nor the jail holds a flag.
- **Account names:** the desktop has three accounts with mythical-creature names, generated at build. The chroot server has no named accounts.
- **Service:** on the desktop, a listener on a random high port starts a shell inside a container. On the chroot server, a similar listener starts a shell inside an older-style jail.

Awkward points:
- Both flags sit at the climax. Nothing rewards progress before the escape. Four is the usual count.
- The plan's entry route (a web application server, from the Disastrous Development scenario) is not in this file. Adding it would need a decision on where its flag sits. One extra flag would bring the total to three.
- Three generated names on one box means students will see names that need mapping to characters.
- The file's comment says "two accounts", but it defines three.
- Both boxes also enable remote root login with a generated password. Check that students cannot reach root that way, because it would skip the escape.

## 5. Spare alternates (catalogue scenarios)

| Alternate | Catalogue scenario | Targets | Flags | Flag positions | Plain service |
|---|---|---|---|---|---|
| Big-data analytics platform | `ctf/catching_sparks.xml` | 1 | 1 | Only flag is in a user's home | Analytics platform with a web interface |
| Event-data database | `ctf/eventful_data.xml` | 1 | 2 | Service account's home; root through a privilege misconfiguration | Event-data query database |
| Network monitoring platform | `ctf/off_the_trail.xml` | 1 | 3 | Monitoring service account (`maltrail`) home; platform's threat data; root | Traffic monitoring platform on a high port |
| IRC chat server | `ctf/eyearesee.xml` | 1 | 3 | One visible before login; a user home; root | IRC chat server |
| Web application server | `ctf/disastrous_development.xml` | 1 | 1 | The one flag, at the service's privilege level | Web app server for a developer platform |

The single-flag boxes (Sparks and the web app server) suit an entry point or a foothold box, not a finale box on their own.

## 6. Assumptions

- Assumption: Flag positions come from each scenario's comments and leak wiring. I did not build any VM, so placements are as written, not as deployed.
- Assumption: The "root" label for the file transfer flags relies on the module writing its post-login leak to root's home, which I checked for m03 and m04 only.
- Assumption: "Before login" follows how the web and file transfer modules place pre-login strings. I did not check the pre-login placement for the IRC, monitoring and file share modules.
- Choice: I used scenario titles and file paths, not module identifiers, to respect the no-tool-names limit. Module names can go into the build notes if needed.
- Noticed, not acted on: the container scenario's account comment, and the remote root login on both boxes.
