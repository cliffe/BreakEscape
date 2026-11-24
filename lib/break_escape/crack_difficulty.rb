# frozen_string_literal: true

module BreakEscape
  # The difficulty grades of the offline cracker (feature A21). Plain Ruby, no Rails and no
  # require. A grade is a shorthand for two things a hash record can also say outright: whether
  # the record is salted and how long a salted guess waits. It never supplies facts and never
  # changes the password class.
  #
  # The grade comes from the record's own `crack.difficulty`, else from the NPC's
  # `habits.passwordDifficulty`. A field written on the record (`salted`, `crackSeconds`)
  # always wins over the grade's default.
  module CrackDifficulty
    module_function

    GRADES = %w[easy medium hard].freeze

    # Wait in seconds for a salted record that writes no `crackSeconds` and has no grade.
    DEFAULT_WAIT = 60

    TABLE = {
      'easy' => { salted: false, wait: nil, facts: (1..1) },
      'medium' => { salted: true, wait: 60, facts: (2..2) },
      'hard' => { salted: true, wait: 120, facts: (3..4) }
    }.freeze

    # { salted:, crack_seconds: } for a hash record and the NPC it belongs to, or nil when a
    # grade written in either place is not one of GRADES. crack_seconds is nil when unsalted.
    def resolve(record, npc)
      record_grade = grade_of(record.is_a?(Hash) ? record['crack'] : nil, 'difficulty')
      npc_habits = npc.is_a?(Hash) ? npc['habits'] : nil
      npc_grade = grade_of(npc_habits, 'passwordDifficulty')
      return nil if record_grade == :bad || npc_grade == :bad

      grade = record_grade || npc_grade
      row = grade && TABLE[grade]
      record = {} unless record.is_a?(Hash)

      salted = record['salted'] == true || record['salted'] == false ? record['salted'] : (row ? row[:salted] : false)
      return { salted: false, crack_seconds: nil } unless salted

      written = record['crackSeconds']
      seconds = written.is_a?(Integer) ? written : ((row && row[:wait]) || DEFAULT_WAIT)
      { salted: true, crack_seconds: seconds }
    end

    # The expected number of guessable facts for a grade, as a Range; nil for an unknown one.
    def fact_band(grade)
      TABLE[grade] && TABLE[grade][:facts]
    end

    # nil when the key is absent, :bad when present and not a known grade, else the grade.
    def grade_of(hash, key)
      return nil unless hash.is_a?(Hash) && hash.key?(key)

      GRADES.include?(hash[key]) ? hash[key] : :bad
    end
    private_class_method :grade_of
  end
end
