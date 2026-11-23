# frozen_string_literal: true

require 'json'
require 'monitor'

module BreakEscape
  # The realism catalog loader (docs/achitechture/OPS_CORE_PLAN.md section 5.3, "The catalog loader").
  # Reads every `config/break_escape/realism_catalog/*.json` once, on first use, into a frozen map
  # from catalog id to entry. Plain Ruby: Rails is used only for its logger, when defined, so the
  # catalog validator scripts can require_relative this file and agree with the server.
  #
  # Never raises into a caller. When a file does not parse, or an id or a `module` value appears
  # twice across the files, it logs ONE warning naming the files and the faults (never catalog text)
  # and loads an EMPTY map (fails closed). A missing folder is an empty map with no warning.
  # No route serves the map.
  module RealismCatalog
    DEFAULT_FOLDER = File.expand_path('../../config/break_escape/realism_catalog', __dir__).freeze
    LOCK = Monitor.new
    EMPTY = {}.freeze

    class << self
      # The frozen entry Hash (string keys) for a catalog id, or nil.
      def lookup(id)
        return nil unless id.is_a?(String)

        state[:map][id]
      rescue StandardError
        nil
      end

      # Load faults, each { 'file' => basename, 'fault' => kind }; never catalog text.
      def faults
        state[:faults]
      rescue StandardError
        EMPTY_FAULTS
      end

      # Use another folder for the block (tests), then restore the previous state.
      def with_folder(path)
        LOCK.synchronize do
          saved = [@state, @folder]
          @state = nil
          @folder = path.to_s
          begin
            yield
          ensure
            @state, @folder = saved
          end
        end
      end

      private

      EMPTY_FAULTS = [].freeze

      def state
        LOCK.synchronize { @state ||= load_folder(@folder || DEFAULT_FOLDER) }
      end

      def load_folder(folder)
        files = Dir.glob(File.join(folder, '*.json')).sort
        return { map: EMPTY, faults: EMPTY_FAULTS } if files.empty?

        map = {}
        modules = {}
        faults = []
        files.each { |file| read_file(file, map, modules, faults) }
        return finish_failed(faults) unless faults.empty?

        map.each_value { |entry| deep_freeze(entry) }
        { map: map.freeze, faults: EMPTY_FAULTS }
      rescue StandardError => e
        finish_failed([{ 'file' => File.basename(folder.to_s), 'fault' => "load_error_#{e.class.name.to_s.split('::').last}" }.freeze])
      end

      def read_file(file, map, modules, faults)
        name = File.basename(file)
        data = JSON.parse(File.read(file))
        entries = data.is_a?(Hash) ? data['entries'] : nil
        unless entries.is_a?(Hash)
          faults << fault(name, 'bad_shape')
          return
        end
        entries.each do |id, entry|
          unless entry.is_a?(Hash)
            faults << fault(name, 'bad_shape')
            next
          end
          faults << fault(name, 'duplicate_id') if map.key?(id)
          mod = entry['module']
          faults << fault(name, 'duplicate_module') if mod.is_a?(String) && modules.key?(mod)
          map[id] ||= entry
          modules[mod] = true if mod.is_a?(String)
        end
      rescue JSON::ParserError, SystemCallError, EncodingError
        faults << fault(File.basename(file), 'parse_error')
      end

      def fault(file, kind)
        { 'file' => file, 'fault' => kind }.freeze
      end

      def finish_failed(faults)
        faults = faults.uniq.freeze
        log_warning(faults)
        { map: EMPTY, faults: faults }
      end

      def log_warning(faults)
        text = faults.map { |f| "#{f['file']}: #{f['fault']}" }.join('; ')
        message = "RealismCatalog: catalog not loaded (empty map): #{text}"
        if defined?(Rails) && Rails.respond_to?(:logger) && Rails.logger
          Rails.logger.warn(message)
        else
          warn(message)
        end
      rescue StandardError
        nil
      end

      def deep_freeze(obj)
        case obj
        when Hash then obj.each { |k, v| k.freeze; deep_freeze(v) }
        when Array then obj.each { |v| deep_freeze(v) }
        end
        obj.freeze
      end
    end
  end
end
