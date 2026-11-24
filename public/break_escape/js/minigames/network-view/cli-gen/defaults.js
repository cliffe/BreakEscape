/**
 * CLI DEFAULTS (Ops S6 unit 06)
 * =============================
 * What the Terminal prints for a service or a finding when the server sent no `cli` fields for
 * it. A served field is used as it is; a default is built only for a field that is missing.
 * Pure: imports only ops-model.js, touches no DOM and reads no global.
 */
import { findingLabel } from '../ops-model.js';

const text = (v) => (typeof v === 'string' && v !== '' ? v : null);
const word = (v) => String(v ?? '');
const underscored = (v) => word(v).replace(/-/g, '_');
const dashed = (v) => word(v).replace(/_/g, '-');

/** `{ protocol, service, banner? }` from the service's `cli`, else `tcp`, the service's name, no banner. */
export function serviceCli(service) {
    const cli = service && typeof service.cli === 'object' && service.cli !== null ? service.cli : {};
    const out = {
        protocol: text(cli.protocol) ?? 'tcp',
        service: text(cli.service) ?? word(service?.name)
    };
    const banner = text(cli.banner);
    if (banner !== null) out.banner = banner;
    return out;
}

/** `{ title, module, script, advisories?, output? }` from the finding's `cli`, else the defaults. */
export function findingCli(finding, service) {
    const cli = finding && typeof finding.cli === 'object' && finding.cli !== null ? finding.cli : {};
    const serviceWord = word(service?.name ?? finding?.service);
    const serviceName = word(service?.label || service?.name || finding?.service);
    const cls = word(finding?.class);
    const alias = word(finding?.alias ?? finding?.id);
    const out = {
        title: text(cli.title) ?? `${findingLabel(finding)} on ${serviceName}`,
        module: text(cli.module) ?? `auxiliary/scanner/${underscored(serviceWord)}/${cls}_${alias}`,
        script: text(cli.script) ?? `${serviceWord}-${dashed(cls)}`
    };
    if (Array.isArray(cli.advisories)) out.advisories = cli.advisories.slice();
    if (Array.isArray(cli.output)) out.output = cli.output.slice();
    return out;
}

/** The address a command names for a host row: its `address`, else its id. */
export function hostTarget(row) {
    return text(row?.address) ?? word(row?.id);
}

/** The number of addresses a CIDR range holds, from its prefix; 0 when there is no usable prefix. */
export function rangeSize(cidr) {
    const m = /\/(\d{1,2})\s*$/.exec(word(cidr));
    if (!m) return 0;
    const prefix = Number(m[1]);
    return prefix >= 0 && prefix <= 32 ? 2 ** (32 - prefix) : 0;
}
