# frozen_string_literal: true

module BreakEscape
  class Cybok < ApplicationRecord
    self.table_name = 'break_escape_cyboks'

    belongs_to :cybokable, polymorphic: true

    # Mirror Hacktivity's KA_CODES for consistency
    KA_CODES = {
      'IC' => 'Introduction to CyBOK',
      'FM' => 'Formal Methods',
      'RMG' => 'Risk Management & Governance',
      'LR' => 'Law & Regulation',
      'HF' => 'Human Factors',
      'POR' => 'Privacy & Online Rights',
      'MAT' => 'Malware & Attack Technologies',
      'AB' => 'Adversarial Behaviours',
      'SOIM' => 'Security Operations & Incident Management',
      'F' => 'Forensics',
      'C' => 'Cryptography',
      'AC' => 'Applied Cryptography',
      'OSV' => 'Operating Systems & Virtualisation Security',
      'DSS' => 'Distributed Systems Security',
      'AAA' => 'Authentication, Authorisation and Accountability',
      'SS' => 'Software Security',
      'WAM' => 'Web & Mobile Security',
      'SSL' => 'Secure Software Lifecycle',
      'NS' => 'Network Security',
      'HS' => 'Hardware Security',
      'CPS' => 'Cyber Physical Systems',
      'PLT' => 'Physical Layer and Telecommunications Security'
    }.freeze

    CATEGORY_MAPPING = {
      'Introductory Concepts' => ['IC'],
      'Human, Organisational & Regulatory Aspects' => %w[RMG LR HF POR],
      'Attacks & Defences' => %w[MAT AB SOIM F],
      'Systems Security' => %w[C OSV DSS AAA FM],
      'Software and Platform Security' => %w[SS WAM SSL],
      'Infrastructure Security' => %w[AC NS HS CPS PLT]
    }.freeze

    def ka_full_name
      KA_CODES[ka] || 'Unknown KA'
    end

    def ka_category
      CATEGORY_MAPPING.each do |category, kas|
        return category if kas.include?(ka)
      end
      'Unknown Category'
    end

    # Parse keywords string back to array (matches Hacktivity behavior)
    def keywords_array
      return [] if keywords.blank?

      # Handle both array-coerced strings and plain comma-separated
      keywords.gsub(/[\[\]"]/, '').split(',').map(&:strip)
    end
  end
end
