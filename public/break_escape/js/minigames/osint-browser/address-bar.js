// The OSINT browser's address bar text (SE design 02 N9). A pure function: no DOM.
//
// The bar is display-only. It shows the authored host exactly as typed in the data: an `xn--`
// label stays punycode, a non-ASCII letter stays as it is, and nothing is converted either way
// (a look-alike host must draw as the author wrote it). It never goes through displayDashes.

/**
 * @param {{url?: string}} site   an authored OSINT site
 * @param {{url?: string, path?: string}} [page]  a page may carry its own `url`, or a `path`
 *                                                appended to the site's host
 * @returns {string}
 */
export function formatAddress(site, page = null) {
    if (page && typeof page.url === 'string' && page.url) return page.url;
    const base = (site && typeof site.url === 'string') ? site.url : '';
    const path = (page && typeof page.path === 'string') ? page.path : '';
    return base + path;
}
