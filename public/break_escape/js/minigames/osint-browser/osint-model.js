// The OSINT browser's data handling (SE design 02; contract 00 §5, §11). Pure: no DOM, no writes.
//
// Sites are authored under social.osint.sites. This file works out which are shown, which page
// a location names, which tool lookups are unlocked, and the small ids-only state the browser
// keeps in the `se_osint_state` global.
//
// Locations are strings: 'company' (a site, its first page), 'company.team' (siteId.pageId),
// 'social.pierce' (a social profile page is the person id), and TOOLS_KEY for the tools panel.

export const STATE_KEY = 'se_osint_state';
export const INTEL_PREFIX = 'se_intel_';
export const TOOLS_KEY = '~tools';
export const SITE_TYPES = ['company-site', 'social', 'document'];

const isStr = (v) => typeof v === 'string' && v.length > 0;

/** The kinds of site a profile shows. Awareness sets keep to the company site and social. */
export function siteAllowed(site, profile) {
    if (!site || !SITE_TYPES.includes(site.type)) return false;
    if (profile === 'awareness') return site.type !== 'document';
    return true;
}

export function toolsAllowed(profile) {
    return profile !== 'awareness';
}

/** A global-name `showIf` (blocks and social profiles): true when the global is truthy. */
export function showIfHolds(showIf, globals) {
    if (!isStr(showIf)) return true;
    return !!(globals || {})[showIf];
}

export function isHeld(globals, factId) {
    return (globals || {})[INTEL_PREFIX + factId] === true;
}

/** { visited: [ids], at: location|null }, whatever shape the global has. */
export function readOsintState(globals) {
    const raw = (globals || {})[STATE_KEY];
    const visited = Array.isArray(raw?.visited) ? raw.visited.filter(isStr) : [];
    return { visited: [...new Set(visited)], at: isStr(raw?.at) ? raw.at : null };
}

/** Sites this browser shows: in data order, limited by siteIds (a workstation's minigameData). */
export function listSites(osint, { siteIds = null, profile = null } = {}) {
    const sites = Array.isArray(osint?.sites) ? osint.sites : [];
    const only = Array.isArray(siteIds) && siteIds.length ? new Set(siteIds) : null;
    return sites.filter((s) => isStr(s?.id) && siteAllowed(s, profile || osint?.profile) && (!only || only.has(s.id)));
}

/**
 * The pages of a site that are visible now.
 * company-site: its `pages`. social: one page per profile whose showIf holds (page id = person).
 * document: no pages (one view with a properties panel).
 */
export function visiblePages(site, globals) {
    if (!site) return [];
    if (site.type === 'company-site') {
        return (Array.isArray(site.pages) ? site.pages : []).filter((p) => isStr(p?.id) && showIfHolds(p.showIf, globals));
    }
    if (site.type === 'social') {
        return (Array.isArray(site.profiles) ? site.profiles : [])
            .filter((p) => isStr(p?.person) && showIfHolds(p.showIf, globals))
            .map((p) => ({ id: p.person, title: p.name || p.person, profile: p }));
    }
    return [];
}

/** Split 'site.page' into its ids. */
export function splitKey(key) {
    if (!isStr(key)) return { siteId: null, pageId: null };
    const i = key.indexOf('.');
    return i === -1 ? { siteId: key, pageId: null } : { siteId: key.slice(0, i), pageId: key.slice(i + 1) };
}

/**
 * Turn a location string into a place. A bare site id opens the site's first visible page (a
 * social site opens its profile list, no page). Returns null if it names nothing shown.
 */
export function locate(sites, key, globals) {
    if (key === TOOLS_KEY) return { view: 'tools', site: null, pageId: null };
    const { siteId, pageId } = splitKey(key);
    const site = sites.find((s) => s.id === siteId);
    if (!site) return null;
    if (site.type === 'document') return { view: 'document', site, pageId: null };
    const pages = visiblePages(site, globals);
    if (site.type === 'social') {
        if (!pageId) return { view: 'social', site, pageId: null };
        return pages.some((p) => p.id === pageId) ? { view: 'social', site, pageId } : null;
    }
    if (!pageId) return pages.length ? { view: 'page', site, pageId: pages[0].id } : { view: 'page', site, pageId: null };
    return pages.some((p) => p.id === pageId) ? { view: 'page', site, pageId } : null;
}

/** The location string for a place (inverse of locate for a real page). */
export function keyOf(place) {
    if (!place) return null;
    if (place.view === 'tools') return TOOLS_KEY;
    if (!place.site) return null;
    return place.pageId ? `${place.site.id}.${place.pageId}` : place.site.id;
}

/** The ids a visit to a place records: its site, and its page when it has one. */
export function visitKeys(place) {
    if (!place?.site) return [];
    return place.pageId ? [place.site.id, `${place.site.id}.${place.pageId}`] : [place.site.id];
}

/**
 * Where a link goes. 'pageId' is a page on the same site; 'siteId.pageId' and 'siteId' name
 * another place. Returns the location string, or null if it names nothing shown.
 */
export function resolveLink(sites, fromSiteId, to, globals) {
    if (!isStr(to)) return null;
    const from = sites.find((s) => s.id === fromSiteId);
    if (from && !to.includes('.') && visiblePages(from, globals).some((p) => p.id === to)) {
        return keyOf(locate(sites, `${fromSiteId}.${to}`, globals));
    }
    const place = locate(sites, to, globals);
    return place ? keyOf(place) : null;
}

/** Whether a lookup entry is listed yet: no unlockedBy means always. */
export function toolUnlocked(tool, visited, globals) {
    const u = tool?.unlockedBy;
    if (!u || typeof u !== 'object') return true;
    if (isStr(u.visited)) return (visited || []).includes(u.visited);
    if (isStr(u.fact)) return isHeld(globals, u.fact);
    return false; // an unknown shape never unlocks (the validator rejects it)
}

export function listTools(osint, visited, globals) {
    const tools = Array.isArray(osint?.tools) ? osint.tools.filter((t) => isStr(t?.id)) : [];
    return {
        available: tools.filter((t) => toolUnlocked(t, visited, globals)),
        locked: tools.filter((t) => !toolUnlocked(t, visited, globals))
    };
}
