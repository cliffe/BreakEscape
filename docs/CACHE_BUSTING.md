# Asset Cache Busting

BreakEscape assets (JS, CSS, images, fonts) are served by nginx with infinite
cache headers for performance, with Cloudflare in front. This document explains
how cache busting works, what to check in your infrastructure, and how to verify
it is working after a deploy.

## How it works

Every asset URL served from `/break_escape/` carries a `?v=<VERSION>` query
parameter derived from `BreakEscape::ASSETS_VERSION` (defined in
`lib/break_escape/version.rb`, defaults to the gem `VERSION`).

Because nginx has infinite cache, the browser and Cloudflare treat each
versioned URL as immutable. When the version changes, the new URLs have never
been cached, so clients fetch fresh copies. Old versioned URLs simply orphan in
the cache and eventually expire.

**JS modules** — all 147 ES6 modules use relative `import` paths inside the
static `.js` files, which nginx serves directly. A
`<script type="importmap">` block is injected into each page `<head>` by the
`break_escape_import_map` Rails helper. The browser resolves every relative
module specifier to an absolute URL and rewrites it through the import map
before making any request, so all module fetches use versioned URLs even though
the `.js` source files themselves contain no version strings.

**CSS and other assets** — referenced via the `be_asset_path` ERB helper in
templates, which appends `?v=VERSION` to the URL.

## Bumping the version on deploy

Edit `lib/break_escape/version.rb`:

```ruby
VERSION = '1.0.1'   # was 1.0.0
```

`ASSETS_VERSION` inherits from `VERSION` automatically.

Then update the lockfile in the host Rails app and restart the server:

```bash
cd ~/Hacktivity
bundle install
passenger-config restart-app /
```

`bundle install` is required because changing `VERSION` in the gem source makes
the recorded version in `Gemfile.lock` stale. Passenger restarts Bundler, which
compares the gem's actual version against the lockfile and raises a version
mismatch error if they differ. Skipping this step causes the app to fail on
restart.

Alternatively, set the environment variable `BREAK_ESCAPE_ASSETS_VERSION` on
the server without changing code (no `bundle install` needed):

```
BREAK_ESCAPE_ASSETS_VERSION=2024-06-11 rails server
```

## Infrastructure checklist

### Nginx

No changes required. Infinite cache is correct for versioned URLs — they are
immutable by design. When the version bumps, new URLs are requested that nginx
has never served, so they are fetched from disk and cached fresh.

### Cloudflare

**Cache Level must not be "Ignore Query String".**

If that mode is active, Cloudflare treats `main.js?v=1.0.0` and
`main.js?v=1.0.1` as the same cache entry and the version bump has no effect.

Check: Cloudflare dashboard → your zone → Caching → Cache Level.
It should be **Standard** (the default). If you have Cache Rules for
`/break_escape/*`, verify none of them set "Ignore Query String" behaviour.

**HTML pages must not be cached by Cloudflare.**

The Rails-served HTML pages contain the import map with the current version
strings. If Cloudflare caches the HTML, users receive a stale import map after
a deploy and continue loading old module versions.

By default Cloudflare does not cache HTML from a dynamic origin. This becomes
a problem only if you have a "Cache Everything" page rule or Cache Rule
covering the BreakEscape routes. If such a rule exists, add an exception for
`/break_escape/games/*` and `/break_escape/player_preferences/*` to bypass
caching for those paths.

## Testing in development mode

In development, static files are served by `StaticFilesController` instead of
nginx. The controller routes use a `*path` wildcard that captures only the URL
path, not the query string — `params[:path]` for
`/break_escape/js/main.js?v=1.0.0` is simply `main.js`. The version param is
ignored server-side and the correct file is served, so all of the following
work exactly as in production:

- The import map is injected into the HTML
- Asset URLs carry `?v=VERSION`
- All module requests in DevTools show versioned URLs
- Setting `BREAK_ESCAPE_ASSETS_VERSION=foo` updates every URL immediately

The one thing development cannot reproduce is actual cache behaviour. The
static controller does not set long-lived cache headers, so browsers will not
aggressively cache assets and a version bump will not visibly change fetch
behaviour. To test the cache mechanics themselves, use a staging environment
with nginx, or temporarily add `response.set_header('Cache-Control', 'public,
max-age=31536000')` to `StaticFilesController#serve`, load a page, then bump
the version and confirm fresh `200` responses replace cache hits.

## Testing after a deploy

### 1. Confirm the import map is present

Open the game page in a browser, view source, and search for
`<script type="importmap">`. You should see a JSON block mapping every
`/break_escape/js/...` path to its versioned equivalent:

```json
{"imports":{"/break_escape/js/api-client.js":"/break_escape/js/api-client.js?v=1.0.1", ...}}
```

### 2. Confirm asset URLs carry the version

In the same page source, every `<link>` and `<script src>` for
`/break_escape/` should have `?v=<VERSION>` appended. Example:

```html
<link rel="stylesheet" href="/break_escape/css/main.css?v=1.0.1">
<script type="module" src="/break_escape/js/main.js?v=1.0.1">
```

### 3. Confirm modules load with versioned URLs

Open browser DevTools → Network tab, filter by JS, reload the game page.
Every request to `/break_escape/js/` should have `?v=<VERSION>` in the URL,
including modules loaded by other modules (not just the entry point).

### 4. Confirm a version bump busts the cache

1. Load the game page and note the version in the import map (e.g. `v=1.0.0`).
2. Bump `VERSION` (or `BREAK_ESCAPE_ASSETS_VERSION`) and redeploy.
3. Hard-reload the page (Cmd+Shift+R / Ctrl+Shift+R).
4. View source — the import map should show the new version.
5. In DevTools Network, all `/break_escape/` requests should show the new
   version and have status `200` (fetched fresh), not served from cache.

### 5. Confirm Cloudflare is not serving a stale HTML page

After a deploy, check the response headers for the game page URL:

```
curl -I https://your-domain/break_escape/games/<id>
```

Look at `CF-Cache-Status`. It should be `DYNAMIC` or `BYPASS`, not `HIT`.
A `HIT` means Cloudflare is serving a cached HTML page with a stale import map.
