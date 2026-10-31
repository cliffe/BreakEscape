# SAFETYNET Field Guide: Reconnaissance and Network Mapping

## Objective
Use this guide to quickly build an accurate map of reachable hosts and exposed services before exploitation. The goal is to reduce guesswork, avoid blind scans, and move into exploitation with evidence-backed targets.

## Quick Reference
- Discover live hosts first, then scan ports and services.
- Prioritize externally reachable services and management interfaces.
- Treat `filtered` results as firewall visibility, not proof a service is absent.
- Record host, open port, service, version, and confidence.

Common patterns:

```bash
# Identify live hosts on a subnet (e.g., 192.168.1.0/24)
nmap -sn -PE {SUBNET_RANGE}

# Fast SYN scan (requires elevated privileges)
sudo nmap -sS {TARGET_IP}

# Service/version detection on selected ports (e.g., 80,443,22 or 1-1000)
nmap -sV -p {PORTS} {TARGET_IP}

# Full TCP scan with service detection
nmap -p- -sV {TARGET_IP}

# OS and service profiling (heavier scan)
nmap -A {TARGET_IP}
```

## Core Workflow
1. Start with host discovery to identify active systems.
2. Run focused scans on likely targets first (critical ports, management ports, and likely service endpoints).
3. Expand to full port coverage when you need certainty.
4. Capture version info (`-sV`) and build a target table.
5. Rank targets by exploit potential and mission relevance.

Minimum scan record template:

```text
Host: {TARGET_IP}
Open Ports: {PORT_LIST}
Services: {SERVICE_LIST}
Versions: {VERSION_STRINGS}
Notes: {OBSERVATIONS}
Priority: {HIGH|MEDIUM|LOW}
```

## Common Failure Modes
- No hosts found:
  ICMP may be filtered. Try default Nmap discovery or scan a known host directly.
- Scan is too slow:
  Narrow target ranges, scan key ports first, then expand.
- Too many filtered ports:
  Network controls may block visibility. Keep testing reachable ports and collect what is observable.
- Version detection missing:
  Retry with `-sV` and run a focused scan on specific open ports.

## Mission Application
This mission pressures you to move fast, but speed without reconnaissance creates rework. Build a minimal network map first, identify likely vulnerable services, then move to exploitation only when you can justify why the target is high-value.