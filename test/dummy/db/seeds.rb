# The dummy app exists only to host the engine in standalone mode, so seeding it
# means seeding the engine: create/update a Mission for every scenario on disk.
# Without this file `rails db:seed` from the engine root silently does nothing,
# and the mission list comes up empty.
load BreakEscape::Engine.root.join('db', 'seeds.rb').to_s
