# BreakEscape Rails Engine

Cyber security training escape room game as a mountable Rails Engine.

## Features

- 24+ cyber security escape room scenarios
- Server-side progress tracking with 2-table schema
- Randomized passwords per game instance via ERB
- JIT Ink script compilation for NPC dialogue
- Polymorphic player support (User/DemoUser)
- Pundit authorization
- RESTful API for game state management
- Session-based state persistence

## Installation

There are two ways to run it: stand alone, or mounted inside an existing Rails app.

### Stand alone (run on your own PC)

The repo contains a small host Rails app with the engine mounted, so that you can run the game on your own PC, running the server locally.

On a clean **Ubuntu 22.04** VM:

```bash
sudo apt update
sudo apt install -y git ruby-full build-essential libsqlite3-dev sqlite3

git clone https://github.com/cliffe/BreakEscape.git
cd BreakEscape

bundle install                              # installs Rails and everything else
bundle exec rails db:create db:migrate
bundle exec rails db:seed                   # creates the missions from scenarios/
./start_server.sh
```

Then visit http://localhost:3000/break_escape/, or `http://<vm-ip>:3000/break_escape/` from outside the VM.

There is no `install:migrations` step here: the bundled host app reads the engine's migrations directly. But you do need `db:seed` — without it the database has no missions and the mission list comes up empty.

Standalone mode has no login — players are tracked as `DemoUser` records.

**A note on Ruby versions.** The game runs on Ruby 2.7, 3.0 or 3.1. Ubuntu 22.04 installs 3.0 for you, which is why the instructions above use 22.04 and why you don't have to install Ruby yourself.

Ruby 3.2 and newer will not work without some tweaks/testing. Ubuntu 24.04 installs 3.2, so if that is what you have, install Ruby 3.1 alongside it with [rbenv](https://github.com/rbenv/rbenv) and use that instead.

Why: `Gemfile.lock` records the exact versions of the third-party libraries the project was built and tested against. Two of them are older than Ruby 3.2 and cannot be installed on it, so `bundle install` stops with an error. It is those library versions that are out of date, not the game itself; updating them would lift the limit.

### Mounted in an existing Rails app

Use this if you are embedding BreakEscape in Hacktivity or another Rails 7 app. The engine then uses the host app's `current_user`.

In the **host app's** `Gemfile`, at the top level (not inside a `group` block), add — where the path is the repository root, i.e. the directory containing `break_escape.gemspec`, not one of the `break_escape` namespace directories inside it:

```ruby
gem 'break_escape', path: '../BreakEscape'
```

Then, from the host app:

```bash
bundle install
rails break_escape:install:migrations
rails db:migrate
rails break_escape:seed  # creates the missions from scenarios/
```

(The host app's own `rails db:seed` will not pick these up unless its `db/seeds.rb` loads the engine's, as Hacktivity's does.)

And mount it in the host app's `config/routes.rb`:

```ruby
mount BreakEscape::Engine => "/break_escape"
```

## Configuration

```ruby
# config/initializers/break_escape.rb
BreakEscape.configure do |config|
  config.standalone_mode = false  # true for development
  config.demo_user_handle = 'demo_player'
end
```

## Database Schema

- `break_escape_missions` - Scenario metadata (name, display_name, published, difficulty)
- `break_escape_games` - Player state + scenario snapshot (JSONB)
- `break_escape_demo_users` - Standalone mode only (optional)

## API Endpoints

- `GET /games/:id/scenario` - Scenario JSON (ERB-generated)
- `GET /games/:id/ink?npc=X` - NPC script (JIT compiled from .ink)
- `GET /games/:id/bootstrap` - Initial game data
- `PUT /games/:id/sync_state` - Sync player state
- `POST /games/:id/unlock` - Validate unlock attempt
- `POST /games/:id/inventory` - Update inventory

## Architecture

### ERB Scenario Generation

Scenarios are stored as `.json.erb` templates and rendered on-demand with randomized values:

- `<%= random_password %>` - Generates unique password per game
- `<%= random_pin %>` - Generates unique 4-digit PIN
- `<%= random_code %>` - Generates unique hex code

### JIT Ink Compilation

NPC dialogue scripts compile on first request (~300ms):

1. Check if `.json` exists and is newer than `.ink`
2. If needed, run `inklecate` to compile
3. Cache compiled JSON for subsequent requests

### State Management

Player state stored in JSONB column:

- Current room and unlocked rooms
- Inventory and collected items
- NPC encounters
- Global variables (synced with client)
- Health and minigame state

## Testing

### CI

Tests run automatically on GitHub Actions. The committed `Gemfile.lock` pins the exact gem versions used.

### Locally with network access

```bash
bundle install
bundle exec rails db:create db:migrate RAILS_ENV=test
bundle exec rails test
```

### Locally without network access

The engine ships with a `bin/setup` script that bootstraps the bundle from a sibling Hacktivity checkout (which already has all the required gems vendored):

```bash
# From the BreakEscape root — Hacktivity must be at ../Hacktivity
bin/setup
bundle exec rails test

# If Hacktivity is elsewhere, set HACKTIVITY_DIR:
HACKTIVITY_DIR=/path/to/Hacktivity bin/setup
```

`bin/setup` copies the resolved `.gem` files into `vendor/cache/` and runs `bundle install --local`. The `vendor/cache/` and `vendor/bundle/` directories are gitignored; only `Gemfile.lock` is committed.

## Documentation

See `HACKTIVITY_INTEGRATION.md` for integration guide.

## Acknowledgments

Many thanks to everyone who has contributed to the project. Please refer to the [GitHub history](https://github.com/cliffe/BreakEscape/graphs/contributors).

- This project is supported by a Cyber Security Body of Knowledge (CyBOK) resources around CyBOK 1.1 grant (2023-2024).
- This project is supported by a Cyber Security Body of Knowledge (CyBOK) resources around CyBOK 1.1 grant (2024-2025).
- This project is supported by a Cyber Security Body of Knowledge (CyBOK) resources around Security-Informed Safety grant (2025-2026).
