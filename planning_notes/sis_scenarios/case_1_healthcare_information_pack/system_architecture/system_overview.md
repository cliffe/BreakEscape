# System Overview — Northgate General Hospital

---

## ICT and Clinical System Environment

Northgate General Hospital operates a heterogeneous ICT estate that has evolved over two decades of incremental investment, punctuated by periodic modernisation projects. The hospital's digital infrastructure serves three broad functions: enterprise administration (finance, HR, email, management reporting), clinical information management (electronic health records, diagnostic imaging, clinical decision support), and direct patient care delivery (networked medical devices that administer treatments and monitor patient physiology). These functions are interconnected — a medication prescription originates in the EHR, flows to a pharmacy verification system, and ultimately programmes an infusion pump at the bedside — creating data dependencies that cross organisational and network boundaries.

## Three Network Zones

The hospital's network is organised into three logical zones, though the physical implementation of this segmentation is incomplete at the time of the incident.

### Enterprise IT Zone

The enterprise zone hosts the Trust's administrative and communication systems: Active Directory domain services, email (Microsoft Exchange), finance and HR applications, management reporting databases, and staff workstations. This zone connects to the internet through a perimeter firewall and web proxy. It also hosts the Trust's remote access infrastructure — an SSL VPN gateway used by staff and contractors. The EHR application server resides in this zone, as do file servers and the print management infrastructure. Approximately 1,800 domain-joined workstations are deployed across the hospital site.

### Clinical / Medical Device Zone

The clinical zone houses networked medical devices and the systems that manage them. This includes the infusion pump fleet (480 units) and its centralised fleet management console, patient monitoring systems (320 bedside monitors aggregated through ward-level central stations), ventilators (60 units), and clinical workstations used by nursing and pharmacy staff to interact with these devices. The PACS (Picture Archiving and Communication System) and its associated radiology information system also reside in this zone, handling DICOM image data from CT, MRI, X-ray, and ultrasound modalities. Communication within this zone uses a mix of HL7 v2 messaging, DICOM, and proprietary vendor protocols — many of which predate modern encryption and authentication standards.

### External Zone

The external zone encompasses all connections beyond the Trust's network perimeter. This includes internet access (filtered through the perimeter firewall and web proxy), the NHS Health and Social Care Network (HSCN) for inter-Trust communication and national services, and vendor remote-access connections for medical device support and maintenance. A biomedical device vendor maintains a persistent VPN connection to the clinical zone for firmware updates and remote troubleshooting of the infusion pump fleet.

## IT/OT Integration Points

The critical security-safety intersection points are the interfaces between the enterprise IT environment and the clinical device zone. These include:

- **Dual-homed clinical workstations**: Machines with network interfaces on both zones, maintained to allow clinicians simultaneous access to the EHR (enterprise zone) and device management applications (clinical zone). These workstations are the primary cross-zone attack surface.
- **EHR-to-device data flows**: Prescription data flows from the EHR to the infusion pump management console, crossing the zone boundary. This is a functional dependency — if the EHR is compromised, downstream device programming is affected.
- **PACS integration**: Diagnostic imaging modalities in the clinical zone write images to PACS storage, which is accessed by radiologists via workstations in the enterprise zone. DICOM traffic crosses the zone boundary.

## Known Weaknesses

At the time of the incident, several security gaps were known but unresolved:

1. The network segmentation project was 70% complete — three inpatient wards remained on a flat Layer-2 segment shared with enterprise systems.
2. Legacy firewall exception rules permitted bidirectional access between specific clinical workstations and the enterprise zone.
3. The SSL VPN did not enforce multi-factor authentication for contractor accounts.
4. On-site backup infrastructure was network-accessible from the enterprise zone without air-gapping.
5. Medical device communication protocols lacked encryption and mutual authentication.
6. No formal governance structure linked the IT Security team with Clinical Engineering for managing cyber risks to medical devices.
