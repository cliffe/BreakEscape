// New-mail notification (SE design 01 N14, contract 00 S9 "Notification").
//
// The scheduler (P1-F) calls notifyNewMail(record) after it has committed a
// delivered message to mailState. If a mail client is open on that mailbox the
// message is appended there and nothing barks. Otherwise a toast tells the
// player something arrived. There is no workstation badge to reuse (the phone
// badge is phone-shaped), so the toast is the notification for now.

const openClients = new Set();

/** A mail client registers itself while open: { mailboxId(), receiveMessage(record) }. */
export function registerOpenClient(client) {
    openClients.add(client);
    return () => openClients.delete(client);
}

export function openClientCount() {
    return openClients.size;
}

/**
 * @param {object} record  the delivered inbox record (00 §10a)
 * @returns {'appended'|'notified'}
 */
export function notifyNewMail(record) {
    for (const client of openClients) {
        if (client.holdsMailbox ? client.holdsMailbox(record?.mailbox) : client.mailboxId() === record?.mailbox) {
            client.receiveMessage(record);
            return 'appended';
        }
    }
    const who = record?.from?.name || record?.from?.address || 'someone';
    const subject = record?.subject ? `: ${record.subject}` : '';
    if (typeof window !== 'undefined') {
        window.showNotification?.(`New mail from ${who}${subject}`, 'info');
        window.playUISound?.('notification');
    }
    return 'notified';
}
