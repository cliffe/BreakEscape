// Display text for the dual-authorisation panel. Defaults are sis01's wording, so a
// scenario that sets nothing looks exactly as it did before. A scenario overrides any of
// these in the object's minigameData (or the minigame params).
export const DUAL_AUTH_DEFAULTS = Object.freeze({
    heading: 'NETWORK ISOLATION — DUAL AUTHORISATION REQUIRED',
    itsec_label: 'IT SECURITY MANAGER',
    itsec_name: 'Ravi Anand',
    itsec_indicator: 'IT-SEC',
    clinical_label: 'CLINICAL ENGINEERING',
    clinical_name: 'David Osei',
    clinical_indicator: 'CLIN-ENG',
    authorise_label: 'AUTHORISE NETWORK ISOLATION'
});

export function resolveDualAuthText(minigameData = {}, params = {}) {
    const out = {};
    for (const key of Object.keys(DUAL_AUTH_DEFAULTS)) {
        const v = params[key] ?? minigameData?.[key];
        out[key] = (typeof v === 'string' && v.trim()) ? v : DUAL_AUTH_DEFAULTS[key];
    }
    return out;
}

export function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
