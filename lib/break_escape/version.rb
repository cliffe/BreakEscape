module BreakEscape
  # Bump this when you make a new release.
  # Cache busting for assets -- updating this will force browsers to fetch new versions of all the JS, CSS, and most character assets.
  VERSION = '1.0.7'
  ASSETS_VERSION = ENV.fetch('BREAK_ESCAPE_ASSETS_VERSION', VERSION)
end
