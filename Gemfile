source 'https://rubygems.org'

gemspec
gem 'rails', '~> 7.0'
gem 'json-schema'

group :development do
  gem 'rubocop-rails-omakase', require: false
end

group :development, :test do
  # Postgres, matching Hacktivity and production. Left unpinned, as Hacktivity
  # leaves it, so the two upgrade side by side. SQLite could not
  # take the game's concurrent writes: a single ink line fires several tag
  # POSTs at once, and sqlite3 1.5.3 does not release the GVL while waiting on
  # a busy lock, so busy_timeout never applies under Puma and one write in the
  # burst dies with SQLite3::BusyException.
  gem 'pg'
  # Kept so the older SQLite development databases stay readable.
  gem 'sqlite3'
  gem 'puma'
end
