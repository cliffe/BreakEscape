# Integrating BreakEscape into Hacktivity

## Prerequisites

- Hacktivity running Rails 7.0+
- PostgreSQL database
- User model with Devise
- Pundit for authorization (recommended)

## Installation Steps

### 1. Add to Gemfile

```ruby
# Gemfile (in Hacktivity repository)
gem 'break_escape', path: '../BreakEscape'
```

### 2. Install and Migrate

```bash
bundle install
rails break_escape:install:migrations
rails db:migrate
rails break_escape:seed  # Creates missions from scenario directories
```

### 3. Mount Engine

```ruby
# config/routes.rb
mount BreakEscape::Engine => "/break_escape"
```

### 4. Configure

```ruby
# config/initializers/break_escape.rb
BreakEscape.configure do |config|
  config.standalone_mode = false  # Mounted mode in Hacktivity
end
```

### 5. Verify User Model

Ensure your User model has these methods for Pundit authorization:

```ruby
class User < ApplicationRecord
  def admin?
    # Your admin check logic
  end

  def account_manager?
    # Optional: account manager check logic
  end
end
```

### 6. Add Navigation Link (Optional)

```erb
<!-- In your Hacktivity navigation -->
<%= link_to "BreakEscape", break_escape_path %>
```

### 7. Restart Server

```bash
rails restart
# or
touch tmp/restart.txt
```

### 8. Verify Installation

Navigate to: `https://your-hacktivity.com/break_escape/`

You should see the mission selection screen.

### 9. Configure Asset Serving (Production Only)

**Development (puma)**: Skip this step. Rails controller handles assets fine.

**Production (nginx + Passenger)**: See **Production Deployment** section below for critical nginx configuration. This is essential for performance and scalability in Proxmox.

## Configuration Options

### Environment Variables

```bash
# .env (or similar)
BREAK_ESCAPE_STANDALONE=false  # Mounted mode (default)
```

### Custom Configuration

```ruby
# config/initializers/break_escape.rb
BreakEscape.configure do |config|
  # Mode
  config.standalone_mode = false

  # Demo user (only used in standalone mode)
  config.demo_user_handle = ENV['BREAK_ESCAPE_DEMO_USER'] || 'demo_player'
end
```

## Authorization Integration

BreakEscape uses Pundit policies by default. It expects:

### Game Access
- **Owner**: Users can only access their own games
- **Admin/Account Manager**: Can access all games

### Mission Visibility
- **All Users**: Can see published missions
- **Admin/Account Manager**: Can see all missions (including unpublished)

### Custom Policies

To customize authorization, create policy overrides in Hacktivity:

```ruby
# app/policies/break_escape/game_policy.rb (in Hacktivity)
module BreakEscape
  class GamePolicy < ::BreakEscape::GamePolicy
    def show?
      # Custom logic here
      super || custom_access_check?
    end
  end
end
```

## Database Tables

BreakEscape adds 3 tables to your database:

1. **break_escape_missions** - Metadata for scenarios
   - `name`, `display_name`, `description`, `published`, `difficulty_level`

2. **break_escape_games** - Player game instances
   - `player` (polymorphic: User), `mission_id`, `scenario_data` (JSONB), `player_state` (JSONB)

3. **break_escape_demo_users** - Optional (standalone mode only)
   - Only created if migrations run, can be safely ignored in mounted mode

## API Endpoints

Once mounted, these endpoints are available:

- **Mission List**: `GET /break_escape/missions`
- **Play Mission**: `GET /break_escape/missions/:id`
- **Game View**: `GET /break_escape/games/:id`
- **Scenario Data**: `GET /break_escape/games/:id/scenario`
- **NPC Scripts**: `GET /break_escape/games/:id/ink?npc=:npc_id`
- **Bootstrap**: `GET /break_escape/games/:id/bootstrap`
- **State Sync**: `PUT /break_escape/games/:id/sync_state`
- **Unlock**: `POST /break_escape/games/:id/unlock`
- **Inventory**: `POST /break_escape/games/:id/inventory`

## Asset Serving

Static game assets are located in `public/break_escape/`:
- JavaScript: `public/break_escape/js/`
- CSS: `public/break_escape/css/`
- Images: `public/break_escape/assets/`
- CyberChef workstation: `public/break_escape/assets/cyberchef/`

BreakEscape serves these through a lightweight controller (`StaticFilesController`). This is **acceptable for development (puma)** but requires special configuration for production (nginx + Passenger).

## Production Deployment (Proxmox / nginx + Passenger)

### Asset Serving Configuration — CRITICAL FOR PERFORMANCE

BreakEscape's static assets are served through a Rails controller, which is **fine for development (puma)** but **not suitable for production** without proper nginx configuration. Each static asset request (CSS, JS, images) ties up a Ruby process, limiting scalability.

#### Option 1: nginx Direct Serving (Recommended)

Configure nginx to serve BreakEscape assets directly, bypassing Rails entirely:

```nginx
# In your nginx server block (usually in /etc/nginx/sites-available/hacktivity)

# Serve BreakEscape static assets directly via nginx
location ~ ^/break_escape/(css|js|assets|stylesheets)/ {
  # Point to the actual BreakEscape gem directory
  # Adjust path based on where the gem is installed
  alias /path/to/BreakEscape/public/break_escape/;
  
  # Cache versioned assets aggressively (1 year)
  expires 1y;
  add_header Cache-Control "public, immutable";
  add_header X-Content-Type-Options "nosniff";
  
  # Enable gzip compression for text assets
  gzip on;
  gzip_types text/css application/javascript image/svg+xml;
  gzip_min_length 1024;
  
  # Suppress access logs (frequent, not important)
  access_log off;
  
  # Don't pass to Passenger
  break;
}

# Serve CyberChef HTML file with shorter cache
location ~ ^/break_escape/.*\.html$ {
  alias /path/to/BreakEscape/public/break_escape/;
  expires 1h;
  add_header Cache-Control "public";
  access_log off;
  break;
}

# All other /break_escape/* routes go to Passenger
location /break_escape/ {
  passenger_pass http://passenger_app;
  passenger_set_header X-Real-IP $remote_addr;
  passenger_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  passenger_set_header X-Forwarded-Proto $scheme;
  passenger_set_header Host $host;
}
```

**Finding the BreakEscape gem path:**
```bash
# In Hacktivity directory
bundle show break_escape
# Output: /path/to/BreakEscape
```

After updating nginx config:
```bash
sudo nginx -t           # Test syntax
sudo systemctl reload nginx
```

**Benefits**:
- Assets served at line-rate (no Ruby process overhead)
- Browser caching via ETags and Cache-Control headers
- Automatic gzip compression
- Scales to thousands of concurrent users
- Reduces Passenger memory footprint

#### Option 2: Rails Controller Serving (Development/Small Scale)

If nginx configuration isn't available, the Rails controller approach works but has limitations:
- One Ruby process per asset request
- No aggressive caching
- Higher latency
- Lower concurrent user capacity

The `StaticFilesController` in BreakEscape handles this, but you must monitor:
```bash
# Watch Passenger process count/memory
passenger-status
```

If you see many idle processes or memory creep, switch to nginx direct serving.

### Pre-deployment Checklist

- [ ] **Asset path verified**: Confirm `public/break_escape/` exists and contains CSS, JS, assets directories
- [ ] **nginx configured** (if using production): Test syntax with `nginx -t`
- [ ] **CSP configured**: BreakEscape sources added to Hacktivity's CSP initializer
- [ ] **Gemfile locked**: Run `bundle install` and commit Gemfile.lock
- [ ] **Migrations applied**: `rails break_escape:install:migrations && rails db:migrate`
- [ ] **Ink scenarios compiled** (optional, improves startup): See Performance section below
- [ ] **TTS cache present**: Verify `tts_cache/` directory has pre-generated MP3 files

### Pre-compilation and Caching

For optimal production performance:

```bash
# Pre-compile Ink scripts during deployment (reduces first-request latency)
cd BreakEscape
bundle exec rake break_escape:compile_ink_scenarios
cd ..

# Verify migrations are applied
rails db:migrate:status | grep break_escape

# Restart application
touch tmp/restart.txt  # Passenger
# or
systemctl restart puma  # Puma
```

### Monitoring in Production

Set up alerts for:
- **Passenger process count**: If consistently high, assets may be tying up processes
- **Rails request latency**: Spike in latency → potential asset bottleneck
- **Database connection pool**: Monitor for exhaustion

Check logs for asset-serving errors:
```bash
tail -f log/production.log | grep "break_escape"
```

---

## Troubleshooting

### 404 errors on /break_escape/

**Solution**: Ensure engine is mounted in `config/routes.rb`

```ruby
mount BreakEscape::Engine => "/break_escape"
```

### Authentication errors

**Solution**: Verify `current_user` method works in your ApplicationController

```ruby
# In Hacktivity's ApplicationController
def current_user
  # Should return User instance or nil
end
```

### Asset 404s (CSS/JS not loading)

**Solution**: Check multiple things depending on your setup.

**Step 1: Verify files exist in the gem**
```bash
# Find the gem location
gem_path=$(bundle show break_escape)
ls $gem_path/public/break_escape/js/
ls $gem_path/public/break_escape/css/
ls $gem_path/public/break_escape/assets/
```

**Step 2: If using nginx direct serving (production)**
- Verify the `alias` path in nginx config points to the correct gem location
- Test: `curl -I https://your-site.com/break_escape/css/main.css` should return 200
- Check nginx error log: `sudo tail -f /var/log/nginx/error.log`
- Verify nginx syntax: `sudo nginx -t`

**Step 3: If using Rails controller serving (development)**
- Verify routes are mounted: `rails routes | grep break_escape`
- Check controller is accessible: `curl -I http://localhost:3000/break_escape/css/main.css` should return 200
- Check Rails logs for routing errors

### Ink compilation errors

**Solution**: Verify `bin/inklecate` executable exists and is executable

```bash
chmod +x scenarios/inklecate
# Or ensure inklecate is in PATH
```

### CSRF token errors on API calls

**Solution**: Ensure your layout includes CSRF meta tags

```erb
<!-- In application.html.erb -->
<%= csrf_meta_tags %>
```

### Database migration issues

**Solution**: Check PostgreSQL is running and migrations ran successfully

```bash
rails db:migrate:status | grep break_escape
# Should show all migrations as "up"
```

### Game screen is blank / Phaser never starts

**Symptom**: Browser console shows `Refused to load the script 'https://cdn.jsdelivr.net/...'`
or `Refused to execute inline script`.

**Solution**: Hacktivity's CSP is blocking BreakEscape's scripts. Follow the **Content
Security Policy (CSP) Configuration** section above and add the required sources.
The most common causes:

- `cdn.jsdelivr.net`, `unpkg.com`, or `ajax.googleapis.com` missing from `script-src`
  → Phaser, EasyStar.js, Tippy.js, and the WebFont Loader all fail silently
- `content_security_policy_nonce_directives` does not include `style-src`
  → inline `<style nonce="...">` blocks on `games/new` and `missions/index` are blocked
- Nonce generator not configured → every `<script nonce="...">` tag in BreakEscape
  views renders with an empty nonce and is refused

Open the browser DevTools → Console. Each CSP violation names the blocked URL or
`"inline script"` / `"inline style"` and the directive that rejected it — use that
to pinpoint which source or directive is missing.

### Game fonts missing (Press Start 2P / VT323 render as fallback)

**Symptom**: Pixel/retro fonts don't appear; text uses a generic sans-serif.

**Solution**: Add Google Fonts to the CSP:

```ruby
policy.style_src *policy.style_src, "https://fonts.googleapis.com"
policy.font_src  *policy.font_src,  "https://fonts.gstatic.com", :data
```

### CyberChef workstation iframe is blank

**Symptom**: Clicking the Crypto Workstation opens the panel but it stays empty.

**Solution**: Add frame and worker sources:

```ruby
policy.frame_src  *policy.frame_src,  :self
policy.worker_src *policy.worker_src, :self, "blob:"
```

`blob:` is required for CyberChef's Tesseract OCR and Forge prime web workers.

## TTS Voice Cache

BreakEscape pre-generates NPC dialogue audio using the Gemini TTS API and
commits the resulting MP3 files to the engine repository.  This means
**no Gemini API key or quota is needed at runtime** — audio is served
straight from disk.

### Cache Location

The cache lives at `tts_cache/` inside the engine repository root:

```
BreakEscape/
  tts_cache/
    m01_first_contact/    ← per-scenario subdirectory
      <md5hash>.mp3       ← one file per unique dialogue line
    ceo_exfil/
      ...
```

The `TtsService` constant is:

```ruby
CACHE_DIR = BreakEscape::Engine.root.join("tts_cache")
```

`Engine.root` always resolves to the engine gem directory, so the cache path
is identical in both standalone mode and when the engine is mounted into
Hacktivity via `path:` in the Gemfile.

### Serving Audio

Audio is served through the authenticated `POST /games/:id/tts` controller
action, which validates that the requested text matches the NPC's actual Ink
dialogue before returning the cached MP3.  Static-file fallback is not used —
all TTS requests go through the controller so authentication and text
validation cannot be bypassed.

### Pre-generating New Audio

When scenario dialogue changes or a new scenario is added, regenerate the
cache with the batch rake task:

```bash
# From the BreakEscape engine directory
bundle exec rake app:break_escape:tts:batch_generate[scenario_name]
# e.g.
bundle exec rake app:break_escape:tts:batch_generate[m01_first_contact]
```

Set `GEMINI_API_KEY` before running.  The batch processor:
- skips lines already cached (cache-hit fast path)
- skips phone NPCs (`npcType: "phone"`) — these use client-side text chat
- applies exponential back-off on quota errors

Commit the resulting `tts_cache/<scenario>/` files to git so that Hacktivity
deployments pick them up automatically.

### Cleaning Up Stale Cache Files

A helper script identifies and removes cache files that should no longer exist
(e.g. audio generated for phone-NPC Ink dialogue before the batch processor
was updated to skip them):

```bash
# Preview what would be deleted
ruby scripts/tts_cache_cleanup_phone.rb

# Actually delete
ruby scripts/tts_cache_cleanup_phone.rb --delete
```

---

## Performance Considerations

### Asset Serving (Critical)
See **Production Deployment** section above. nginx direct serving is **strongly recommended** for production (Proxmox).

### JIT Ink Compilation
- First NPC interaction compiles `.ink` → `.json` (~300ms)
- Subsequent interactions use cached JSON (~10ms)
- Compiled files persist across restarts

**Production optimization**:
```bash
# Pre-compile all Ink files during deployment to warm the cache
rake break_escape:compile_ink_scenarios
```
This moves the 300ms cost from first user interaction to deployment time.

### Scenario Generation
- ERB templates render on game creation (~50ms)
- Scenario data cached in `games.scenario_data` JSONB
- No re-rendering during gameplay

### State Sync
- Periodic sync every 30 seconds (configurable)
- Uses Rails cache for temporary state
- Database writes only on unlock/inventory changes

### TTS Audio Serving
- All audio pre-cached in `tts_cache/` directory
- Served via authenticated controller (prevents bypass)
- No API calls to Gemini at runtime

## Content Security Policy (CSP) Configuration

BreakEscape loads external libraries and uses inline scripts with nonces.
When mounting the engine into Hacktivity you **must** extend the host CSP
to allow the sources below, otherwise scripts, fonts, and the CyberChef
iframe will be blocked.

Add or extend a `content_security_policy` initializer in Hacktivity:

```ruby
# config/initializers/content_security_policy.rb  (in Hacktivity)
Rails.application.configure do
  config.content_security_policy do |policy|
    # --- BreakEscape external script sources ---
    policy.script_src *policy.script_src,
      "https://cdn.jsdelivr.net",    # Phaser 3, EasyStar.js
      "https://unpkg.com"             # Tippy.js, Popper.js (mission selector)

    # --- BreakEscape Web Workers ---
    # CyberChef iframe uses blob-based workers (Tesseract OCR, Forge prime)
    policy.worker_src *policy.worker_src, :self, "blob:"

    # --- Nonce directives ---
    # Ensure nonces are generated for scripts so that BreakEscape's
    # inline <script nonce="..."> tags work.
  end

  # Generate a fresh nonce per request for script-src
  config.content_security_policy_nonce_generator = ->(request) { SecureRandom.base64(16) }
  config.content_security_policy_nonce_directives = %w[script-src]
end
```

> **Note:** Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`) are already loaded
> via `<link>` tags in BreakEscape views and are covered by Hacktivity's existing
> `:https` directives in `style-src` and `font-src` — no additional CSP entries needed.
>
> The `*policy.script_src` spread syntax preserves whatever Hacktivity already has
> in that directive (e.g. `'self'`, `'nonce-...'`) and appends only the new sources.

### Sources required for BreakEscape

| Source | Directive | Used by |
|--------|-----------|---------|
| `cdn.jsdelivr.net` | `script-src` | Phaser 3.60, EasyStar.js 0.4.4 (game client) |
| `unpkg.com` | `script-src` | Tippy.js 6, Popper.js 2 (mission selector tooltips) |
| `'self'` | `worker-src` | CyberChef iframe (same-origin) |
| `blob:` | `worker-src` | CyberChef's Tesseract OCR and Forge prime workers |

## Security Notes

1. **CSRF Protection**: All POST/PUT endpoints require valid CSRF tokens
2. **Authorization**: Pundit policies enforce access control
3. **XSS Prevention**: All inline scripts and styles use CSP nonces; `eval()` is not used; inline event handlers (`onclick`, `onerror`) are not used — see CSP section above for required host configuration
4. **SQL Injection**: All queries use parameterized statements
5. **Session Security**: Sessions tied to user authentication
6. **VM Console Access**: Console access is blocked until the player reaches the terminal in-game. The `vm_panel` endpoint enforces that the room containing the VM launcher is unlocked in the player's game state before enabling console access. Admins and account managers bypass this check. This prevents players from skipping game narrative and directly accessing VM consoles.

## Monitoring

### Key Metrics to Track

- Game session duration
- Mission completion rates
- Unlock attempt failures (may indicate difficulty issues)
- Ink compilation times (should be ~300ms first time)
- State sync success rate

### Logs to Monitor

```ruby
# Game creation
"[BreakEscape] Game created: ID=123, Mission=ceo_exfil"

# Ink compilation
"[BreakEscape] Compiling helper1_greeting.ink..."
"[BreakEscape] Compiled helper1_greeting.ink (45.2 KB)"

# Unlock validation
"[BreakEscape] Unlock validated: door=office, method=password"
```

## Updating BreakEscape

```bash
cd ../BreakEscape
git pull origin main

cd ../Hacktivity
bundle install
rails break_escape:install:migrations  # Install new migrations
rails db:migrate
rails restart
```

## Support

For issues specific to BreakEscape engine:
- Check `README.md` in BreakEscape repository
- Review implementation plan in `planning_notes/`
- Check game client logs in browser console

For Hacktivity integration issues:
- Verify Devise authentication is working
- Check Pundit policies are configured
- Review Rails logs for errors
