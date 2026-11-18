require 'digest'

# How verify-run.rb prints submitted flag values. A playtest report is pasted
# around, so the default is a marker with the length and a short hash (enough to
# tell two values apart, not enough to read one). show: true prints them in full.
module FlagRedaction
  module_function

  def mark(value)
    s = value.to_s
    "<redacted len=#{s.length} sha=#{Digest::SHA256.hexdigest(s)[0, 6]}>"
  end

  def list(flags, show: false)
    flags.map { |f| show ? f.to_s : mark(f) }.join(', ')
  end
end
