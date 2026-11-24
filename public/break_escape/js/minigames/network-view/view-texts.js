// The network view's fixed texts (Ops S6 unit 02), shared by every skin. Names and values are
// the ones the scene has always exported. This module imports nothing and touches no DOM.

export const REMOTE_OFF_TEXT = 'Remote sign-in off';
export const NOT_RESPONDING_TEXT = 'Powered down';
export const NO_ROUTE_TEXT = 'No route';
export const DOWN_TAG = '(down)';
export const POWERED_DOWN_TAG = '(powered down)';
export const sessionKeptText = (name) => `Session kept: ${name}`;
// The own block's heading on every view: the subtitle (or a Wi-Fi title) already names the network
export const OWN_HEADING = 'Reachable';
// Shown when the view was fetched before the latest globals reached the server
export const STALE_TEXT = 'Still updating, so this may be out of date.';
// An implant whose own PC is off: the link is listed and reaches nothing
export const linkOffText = (host) => `This link is not responding: ${host || 'its PC'} is off.`;
// Two different reasons for a padlock badge: a held session that was locked, and a share that needs
// an account the player has not signed in with
export const HOST_LOCKED_LABEL = 'Locked';
export const SHARE_LOCKED_LABEL = 'Needs account';

/** The padlock badge's label for a row: a locked session ('host') or a share needing an account. */
export function lockBadgeLabel(kind) {
    return kind === 'share' ? SHARE_LOCKED_LABEL : HOST_LOCKED_LABEL;
}

// A planted box's view opened at its jack: Unplug in the header takes the box back out
export const UNPLUG_TEXT = 'Unplug';
export const UNPLUGGING_TEXT = 'Unplugging...';
// Ops controls: the label of a control while its request is out
export const SWEEP_TEXT = 'Sweep';
export const SWEEPING_TEXT = 'Sweeping...';
export const SCAN_TEXT = 'Scan';
export const SCANNING_TEXT = 'Scanning...';
export const CHECK_TEXT = 'Check';
export const CHECKING_TEXT = 'Checking...';
export const CONFIRM_TEXT = 'Confirm';
export const CONFIRMING_TEXT = 'Confirming...';
export const NO_FINDINGS_TEXT = 'Nothing was found on that service.';
export const TECHNIQUES_HEADING = 'Techniques';
export const USE_TEXT = 'Use';
export const USING_TEXT = 'Using...';
export const PICK_HINT_TEXT = 'Pick a finding, then a card.';
export const CREDENTIAL_GRANT_TEXT = 'That gave you a saved sign-in. It is in your keyring.';
export const sessionGrantText = (host, who) => `You now hold a session on ${host || 'that host'}${who ? ` as ${who}` : ''}.`;
export const pickedText = (alias, name) => `Finding ${alias} with ${name}`;
export const COMPROMISED_TEXT = 'Compromised';
export const NEEDS_HEADING = 'Needs';
export const SWEEP_HINT_TEXT = 'Nothing is listed here yet. Sweep to see what answers.';
export const SHARE_LOCKED_TEXT = "Needs an account with access. It opens from that account's desktop.";
