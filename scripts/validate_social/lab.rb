# frozen_string_literal: true

# Social lints for the lab area. P6-G: the lab-level lints of 10 N7.
#   - every engagement item with a `correct` or `good` flag carries a `why`
#   - every completing global in the objectives table is declared: the engagement block and step
#     globals, and the `global_variable_changed:<name>` event mappings that complete tasks
# (03 N6's step and pick checks for scope, plan and report live in board.rb.)
#
# Return an array of issue strings starting with "❌" (error, fails --strict-social) or "⚠️"
# (warning), in the style of validate_scenario.rb. Runs only when the scenario has a `social` key.
module ValidateSocial
  module Lab
    BLOCKS = %w[scope plan report].freeze # defender options are linted in board.rb

    # ctx: ValidateSocial::Context (json, repo_root, valid_item_types, imports, ...)
    def self.check(ctx)
      return [] unless ctx.social.is_a?(Hash)

      eng = ctx.social['engagement']
      issues = []
      if eng.is_a?(Hash)
        BLOCKS.each do |mode|
          block = eng[mode]
          next unless block.is_a?(Hash)

          issues.concat(why_checks(block, "social.engagement.#{mode}"))
          issues.concat(block_globals(ctx, block, "social.engagement.#{mode}"))
        end
      end
      issues.concat(mapping_checks(ctx))
      issues.uniq
    end

    def self.err(msg)
      Mail.err(msg)
    end

    # Any object under the block with a boolean `correct` or `good` is an answer option or finding
    # part, and the student is shown its `why` after picking it.
    def self.why_checks(node, where)
      case node
      when Array
        node.each_with_index.flat_map { |n, i| why_checks(n, "#{where}[#{n.is_a?(Hash) && n['id'] ? n['id'] : i}]") }
      when Hash
        out = []
        flagged = %w[correct good].select { |k| [true, false].include?(node[k]) }
        out << err("#{where} has #{flagged.join(' and ')} but no why; every answer shows the student why it is right or wrong") if !flagged.empty? && Mail.blank?(node['why'])
        node.each { |k, v| out.concat(why_checks(v, "#{where}.#{k}")) if v.is_a?(Array) || v.is_a?(Hash) }
        out
      else
        []
      end
    end

    def self.block_globals(ctx, block, where)
      issues = []
      names = [[block['onCompleteGlobal'], "#{where}.onCompleteGlobal"]]
      Mail.hash_list(block['steps']).each { |s| names << [s['onCompleteGlobal'], "#{where}.steps[#{s['id']}].onCompleteGlobal"] }
      names.each do |g, w|
        if Mail.blank?(g)
          issues << err("#{w} is missing; nothing would record that it is done, so its task could never complete")
        else
          d = Mail.declared_written(ctx, g, w)
          issues << d if d
        end
      end
      issues
    end

    # `global_variable_changed:<name>` mappings: the global must be declared (an undeclared one is
    # silently not synced to ink or the game state), and `completeTask` must name a real task.
    def self.mapping_checks(ctx)
      task_ids = Mail.hash_list(ctx.json['objectives']).flat_map { |a| Mail.hash_list(a['tasks']).map { |t| t['taskId'] } }.compact.to_set
      out = []
      walk_mappings(ctx.json, '') do |m, where|
        pat = m['eventPattern']
        if pat.is_a?(String) && pat.start_with?('global_variable_changed:')
          name = pat.delete_prefix('global_variable_changed:')
          out << err("#{where}: eventPattern names global '#{name}', which is not declared in globalVariables; the task could never complete") unless ctx.all_globals.key?(name)
        end
        t = m['completeTask']
        out << err("#{where}: completeTask '#{t}' is not a taskId in objectives") if t.is_a?(String) && !task_ids.include?(t)
      end
      out
    end

    def self.walk_mappings(node, path, &blk)
      case node
      when Hash
        if node['eventMappings'].is_a?(Array)
          node['eventMappings'].each_with_index do |m, i|
            blk.call(m, "#{path}/eventMappings[#{i}]") if m.is_a?(Hash)
          end
        end
        node.each { |k, v| walk_mappings(v, "#{path}/#{k}", &blk) if v.is_a?(Hash) || v.is_a?(Array) }
      when Array
        node.each_with_index { |v, i| walk_mappings(v, "#{path}[#{i}]", &blk) if v.is_a?(Hash) || v.is_a?(Array) }
      end
    end
  end
end
