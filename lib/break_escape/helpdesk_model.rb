# frozen_string_literal: true

require_relative 'access_identities' unless defined?(BreakEscape::AccessIdentities)

module BreakEscape
  # The helpdesk recovery model (S8b, feature A23), read from the authored scenario. Plain Ruby, no
  # Rails and no ActiveSupport, so the validator and the dungeon-graph generator can require it and
  # agree with the server. Every function is deterministic: no random draw and no clock (the caller
  # passes any time).
  module HelpdeskModel
    module_function

    DESK_STOP_SECONDS = 300
    VERIFY = %w[none questions callback].freeze
    RESETS = %w[password mfa].freeze
    ANSWER_MAX = 64
    LABEL_MAX = 40
    TRIES_CAP = 200
    DEFAULT_MAX_TRIES = 3

    # The scenario's `helpdesks` map with defaults applied, desk id => desk Hash. An invalid or
    # absent `verify` is read as `questions` with every question required (the strictest reading).
    def desks(scenario)
      raw = scenario.is_a?(Hash) ? scenario['helpdesks'] : nil
      return {} unless raw.is_a?(Hash)

      raw.each_with_object({}) do |(id, desk), out|
        next unless id.is_a?(String) && !id.empty? && desk.is_a?(Hash)

        out[id] = build_desk(desk)
      end
    end

    # [desk_id, desk] for the first desk served by this NPC, else nil
    def desk_for_npc(scenario, npc_id)
      return nil unless npc_id.is_a?(String) && !npc_id.empty?

      desks(scenario).find { |_id, desk| desk['npc'] == npc_id }
    end

    # Strip, collapse inner whitespace, downcase, first ANSWER_MAX code points. '' for a non-string.
    def normalise_answer(text)
      return '' unless text.is_a?(String)

      text.scrub('').strip.gsub(/\s+/, ' ').downcase[0, ANSWER_MAX]
    end

    # Control characters out, first 64 code points. The caller applies `normalise_username`.
    def clean_username(text)
      return '' unless text.is_a?(String)

      text.scrub('').gsub(/[[:cntrl:]]/, '')[0, 64]
    end

    # "<deskId>|<normalised username>"
    def tries_key(desk_id, username)
      "#{desk_id}|#{AccessIdentities.normalise_username(username)}"
    end

    # How many of the desk's questions have a normalised answer equal to the normalised recovery
    # value. A missing or empty recovery value, or an empty answer, never matches.
    def answers_right(desk, recovery, answers)
      return 0 unless desk.is_a?(Hash) && recovery.is_a?(Hash) && answers.is_a?(Hash)

      Array(desk['questions']).count do |qid|
        right = normalise_answer(recovery[qid])
        given = normalise_answer(answers[qid])
        !right.empty? && !given.empty? && right == given
      end
    end

    # The `questions` rule: at least `minCorrect` right. A desk with no questions never holds.
    def rule_met?(desk, recovery, answers)
      return false unless desk.is_a?(Hash)

      count = Array(desk['questions']).length
      return false if count.zero?

      min = desk['minCorrect'].is_a?(Integer) ? desk['minCorrect'] : count
      min = min.clamp(1, count)
      answers_right(desk, recovery, answers) >= min
    end

    # The browser's `helpdeskForms`: per desk exactly npc, resets, questionLabels. nil with no desk.
    def forms(scenario)
      all = desks(scenario)
      return nil if all.empty?

      all.transform_values do |desk|
        labels = desk['questionLabels'].is_a?(Hash) ? desk['questionLabels'] : {}
        {
          'npc' => desk['npc'],
          'resets' => desk['resets'].dup,
          'questionLabels' => Array(desk['questions']).each_with_object({}) do |qid, out|
            label = labels[qid]
            out[qid] = label[0, LABEL_MAX] if label.is_a?(String)
          end
        }
      end
    end

    # Whether this desk could ever grant `what` for this account NPC: `what` is in `resets`; for
    # `password` the account has a `resetPassword`; for the `questions` rule every asked id has a
    # non-empty recovery answer.
    def covers?(desk, npc, what)
      return false unless desk.is_a?(Hash) && npc.is_a?(Hash)
      return false unless Array(desk['resets']).include?(what)

      creds = npc['creds'].is_a?(Hash) ? npc['creds'] : {}
      return false if what == 'password' && !(creds['resetPassword'].is_a?(String) && !creds['resetPassword'].empty?)
      return true unless desk['verify'] == 'questions'

      questions = Array(desk['questions'])
      recovery = creds['recovery'].is_a?(Hash) ? creds['recovery'] : {}
      !questions.empty? && questions.all? { |qid| !normalise_answer(recovery[qid]).empty? }
    end

    def build_desk(desk)
      verify = VERIFY.include?(desk['verify']) ? desk['verify'] : 'questions'
      questions = desk['questions'].is_a?(Array) ? desk['questions'].select { |q| q.is_a?(String) && !q.empty? }.uniq : []
      tries = desk['maxTries']
      tries = DEFAULT_MAX_TRIES unless tries.is_a?(Integer) && tries.between?(1, 9)
      min = desk['minCorrect']
      min = questions.length unless verify == desk['verify'] && min.is_a?(Integer) && !questions.empty? && min.between?(1, questions.length)
      resets = desk['resets'].is_a?(Array) ? RESETS.select { |r| desk['resets'].include?(r) } : []
      {
        'npc' => desk['npc'].is_a?(String) ? desk['npc'] : nil,
        'verify' => verify,
        'questions' => questions,
        'minCorrect' => min,
        'maxTries' => tries,
        'resets' => resets,
        'questionLabels' => desk['questionLabels'].is_a?(Hash) ? desk['questionLabels'] : {}
      }
    end
    private_class_method :build_desk
  end
end
