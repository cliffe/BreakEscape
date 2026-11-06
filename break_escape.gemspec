require_relative "lib/break_escape/version"

Gem::Specification.new do |spec|
  spec.name        = "break_escape"
  spec.version     = BreakEscape::VERSION
  spec.authors     = ["BreakEscape Team"]
  spec.email       = ["team@example.com"]
  spec.summary     = "BreakEscape escape room game engine"
  spec.description = "Rails engine for BreakEscape cybersecurity training escape room game"
  spec.license     = "MIT"

  spec.files = Dir.chdir(File.expand_path(__dir__)) do
    Dir["{app,config,db,lib,public}/**/*", "MIT-LICENSE", "Rakefile", "README.md"]
  end

  spec.add_dependency "rails", "~> 7.0"
  spec.add_dependency "pundit", "~> 2.3"
end
