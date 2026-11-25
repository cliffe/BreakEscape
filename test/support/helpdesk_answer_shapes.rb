# frozen_string_literal: true

require 'json'

module BreakEscape
  # S8b unit 04: checks a real controller answer against test/fixtures/files/helpdesk_answer_shapes.json.
  # Status, exact key set at every level, equal values except at the entry's `vary` paths (type only).
  # `assert_answer_shape(name, response)` records each name asked for; `HelpdeskAnswerShapes.names`
  # lists every entry and `unproduced_names` the ones no test has yet asked for.
  module HelpdeskAnswerShapes
    PATH = File.expand_path('../fixtures/files/helpdesk_answer_shapes.json', __dir__)

    @asked = []

    class << self
      attr_reader :asked

      def entries
        @entries ||= JSON.parse(File.read(PATH)).reject { |k, _| k.start_with?('_') }
      end

      def names
        entries.keys
      end

      def unproduced_names
        names - asked
      end

      def record(name)
        @asked << name unless @asked.include?(name)
      end
    end

    # Fails (through Minitest) unless `response` has the entry's status and body shape.
    def assert_answer_shape(name, response)
      entry = HelpdeskAnswerShapes.entries[name.to_s]
      assert entry, "no answer shape named #{name}"
      HelpdeskAnswerShapes.record(name.to_s)
      assert_equal entry['status'], response.status.to_i, "#{name}: status"
      body = response.respond_to?(:parsed_body) ? response.parsed_body : response
      body = JSON.parse(body) if body.is_a?(String)
      problems = []
      compare_answer_shape(entry['body'], body, 'body', Array(entry['vary']), problems)
      assert_empty problems, "#{name}: #{problems.join('; ')}"
    end

    private

    def compare_answer_shape(want, got, path, vary, problems)
      if vary.include?(path)
        problems << "#{path}: type #{got.class}, wanted #{want.class}" unless answer_shape_type(want) == answer_shape_type(got)
        return
      end
      case want
      when Hash
        return problems << "#{path}: not an object" unless got.is_a?(Hash)

        extra = got.keys - want.keys
        missing = want.keys - got.keys
        problems << "#{path}: extra keys #{extra.sort}" unless extra.empty?
        problems << "#{path}: missing keys #{missing.sort}" unless missing.empty?
        want.each { |k, v| compare_answer_shape(v, got[k], "#{path}.#{k}", vary, problems) if got.key?(k) }
      when Array
        return problems << "#{path}: not an array" unless got.is_a?(Array)

        problems << "#{path}: length #{got.size}, wanted #{want.size}" unless got.size == want.size
        want.each_with_index { |v, i| compare_answer_shape(v, got[i], "#{path}[#{i}]", vary, problems) if i < got.size }
      else
        problems << "#{path}: #{got.inspect}, wanted #{want.inspect}" unless got == want
      end
    end

    def answer_shape_type(value)
      case value
      when true, false then :boolean
      when Integer, Float then :number
      when String then :string
      when Array then :array
      when Hash then :object
      else :null
      end
    end
  end
end
