require "bundler/setup"

# Note: This is a Rails Engine. Standard 'rake test' is not defined here.
# Use 'bundle exec rails test' to run the full test suite.
# Alternatively, 'bundle exec rake app:test' runs tests within the dummy app context.

APP_RAKEFILE = File.expand_path("test/dummy/Rakefile", __dir__)
load "rails/tasks/engine.rake"

load "rails/tasks/statistics.rake"

require "bundler/gem_tasks"

task :test do
  puts "\n" + ("=" * 80)
  puts "NOTICE: Running 'rake test' directly is not supported in this Engine."
  puts "Please use: bundle exec rails test"
  puts "Or use:     bundle exec rake app:test"
  puts ("=" * 80) + "\n"
  # Optional: You could trigger the actual test here, but signposting is safer
  # to prevent confusion about environment loading.
end

task default: :test
