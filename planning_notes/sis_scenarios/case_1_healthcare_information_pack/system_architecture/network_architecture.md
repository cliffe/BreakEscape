# Network Architecture — Northgate General Hospital

---

## Network Diagram

```mermaid
graph TB
    subgraph EXT["Internet / External Zone"]
        INTERNET["Internet"]
        HSCN["NHS HSCN Network"]
        VENDOR_VPN["Vendor Remote Access<br/>(Infusion Pump Manufacturer)"]
    end

    subgraph PERIM["Perimeter"]
        FW1["Perimeter Firewall<br/>+ Web Proxy"]
        VPN_GW["SSL VPN Gateway<br/>(No MFA for contractors)"]
    end

    subgraph ENTERPRISE["Enterprise IT Zone"]
        AD["Active Directory<br/>Domain Controllers"]
        EMAIL["Email Server<br/>(Exchange)"]
        EHR["Electronic Health<br/>Records (EHR)"]
        FILESERV["File Servers"]
        ADMIN_WS["Admin Workstations<br/>(~1,800)"]
        BACKUP["Backup Infrastructure<br/>(NAS + Tape Library)"]
        SIEM["SIEM / Log<br/>Aggregation"]
    end

    subgraph SEGWALL["Internal Boundary"]
        FW2["Internal Firewall<br/>(Partial Segmentation)"]
    end

    subgraph CLINICAL["Clinical / Medical Device Zone"]
        FLEET_MGR["Infusion Pump Fleet<br/>Management Console"]
        PUMPS["Infusion Pumps<br/>(480 units)"]
        MON_CENTRAL["Patient Monitor<br/>Central Stations"]
        MON_BEDSIDE["Bedside Patient<br/>Monitors (320)"]
        VENTS["Ventilators<br/>(60 units)"]
        PACS["PACS Server<br/>+ Image Archive"]
        MODALITIES["Imaging Modalities<br/>(CT / MRI / X-ray)"]
        CLIN_WS["Clinical Workstations<br/>(Dual-Homed)"]
    end

    subgraph LEGACY["Legacy Flat Segment<br/>(3 Wards — Not Yet Migrated)"]
        LEGACY_MON["Patient Monitors<br/>(Legacy Wards)"]
        LEGACY_WS["Ward Workstations<br/>(Legacy Wards)"]
        LEGACY_PUMPS["Infusion Pumps<br/>(Legacy Wards)"]
    end

    INTERNET --> FW1
    HSCN --> FW1
    VENDOR_VPN -.->|"Persistent VPN"| FW2
    FW1 --> VPN_GW
    FW1 --> ENTERPRISE
    VPN_GW -->|"Remote Access"| ENTERPRISE

    AD --- EMAIL
    AD --- EHR
    AD --- FILESERV
    AD --- ADMIN_WS
    AD --- BACKUP
    ADMIN_WS --- SIEM

    ENTERPRISE --> FW2
    FW2 --> CLINICAL

    CLIN_WS -.->|"Legacy Exception Rules<br/>(Bidirectional)"| ENTERPRISE
    CLIN_WS --- FLEET_MGR
    FLEET_MGR --- PUMPS
    MON_CENTRAL --- MON_BEDSIDE
    PACS --- MODALITIES
    CLIN_WS --- MON_CENTRAL
    CLIN_WS --- PACS

    ENTERPRISE ---|"Flat L2 Segment<br/>(No Segmentation)"| LEGACY
    LEGACY_MON --- LEGACY_WS
    LEGACY_WS --- LEGACY_PUMPS

    style EXT fill:#f9e0e0,stroke:#c0392b
    style ENTERPRISE fill:#e8f0fe,stroke:#2980b9
    style CLINICAL fill:#e8f8e8,stroke:#27ae60
    style LEGACY fill:#fff3cd,stroke:#f39c12
    style SEGWALL fill:#f5f5f5,stroke:#7f8c8d
    style PERIM fill:#f5f5f5,stroke:#7f8c8d
```

---

## Architecture Explanation

### Zone Design

Northgate's network follows a three-zone architecture common in NHS trusts that have undergone partial modernisation. The **Enterprise IT Zone** (blue) hosts all administrative and business systems, including Active Directory, email, the EHR platform, file services, and backup infrastructure. This zone is protected from the internet by a perimeter firewall with web proxy and content filtering. Remote access is provided through an SSL VPN gateway — the same gateway that, at the time of the incident, did not enforce multi-factor authentication for contractor accounts.

The **Clinical / Medical Device Zone** (green) houses the hospital's networked medical devices and the systems that manage them. This zone was designed as a segregated environment with its own VLAN infrastructure, separated from the enterprise zone by an internal next-generation firewall. The firewall enforces allow-list rules for cross-zone traffic — in principle, only specific data flows (EHR prescription data to the fleet management console, DICOM images from modalities to PACS) should traverse the boundary.

### The Segmentation Gap

The critical weakness lies in the incomplete migration. The **Legacy Flat Segment** (amber) represents the three inpatient wards that had not yet been migrated to the new clinical VLAN at the time of the incident. Devices on these wards — patient monitors, infusion pumps, and ward workstations — share a flat Layer-2 broadcast domain with enterprise workstations. There is no firewall or access control between them. This means that any compromise of an enterprise workstation on these floor segments provides direct, unfiltered network access to medical devices.

Additionally, a set of **dual-homed clinical workstations** (shown with dashed bidirectional links) maintain interfaces on both zones. These were provisioned as a pragmatic workaround: clinicians needed to access both the EHR (enterprise zone) and the infusion pump management console (clinical zone) from the same terminal. Legacy firewall exception rules permit this bidirectional traffic. These dual-homed machines are the primary cross-zone attack vector — a compromise of any one of them provides an attacker with a bridgehead into the clinical device network.

### Security-Safety Implications

The architecture has three properties that are directly relevant to the security-informed safety argument:

1. **Medical device dependence on enterprise services**: Infusion pumps and patient monitors ultimately depend on data originating in the enterprise zone (prescriptions, patient demographics). A loss of the enterprise zone therefore cascades to clinical device functionality.

2. **The IT/OT boundary is porous**: The internal firewall is the intended trust boundary between IT and clinical OT systems, but the dual-homed workstations and legacy flat segments undermine it. An attacker who reaches the clinical zone inherits the weak authentication and unencrypted protocol environment of legacy medical devices.

3. **Vendor remote access bypasses segmentation**: The infusion pump manufacturer's persistent VPN connection terminates directly in the clinical zone, providing an alternative entry point that bypasses the enterprise perimeter entirely. If the vendor's own credentials are compromised, the clinical zone is directly exposed.
