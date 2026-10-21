# frozen_string_literal: true

# Social lints for the triage area. Stub: the packet that owns this area fills in
# `check`. Return an array of issue strings starting with "❌" (error, fails
# --strict-social) or "⚠️" (warning), in the style of validate_scenario.rb.
module ValidateSocial
  module Triage
    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(_ctx)
      []
    end
  end
end
