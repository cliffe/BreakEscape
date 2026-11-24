# frozen_string_literal: true

module BreakEscape
  # Second step on any lock (S8c): the gate answer and the /mfa/* lock actions.
  # STUB (unit 04): neutral bodies; unit 13 fills them in this file. Each action answers
  # [body, status] or a symbol (:not_found, :no_phone).
  module LockStepGate
    extend ActiveSupport::Concern

    # nil (nothing to do, or a passed record: go on and open) or the gate answer Hash
    def lock_step_gate(_target_type, _target_id, _method, resolved: nil)
      nil
    end

    def verify_lock_code!(_target_type, _target_id, *_args, **_opts)
      :not_found
    end

    def prompt_lock!(_target_type, _target_id, *_args, **_opts)
      :not_found
    end

    def approve_lock!(_target_type, _target_id, *_args, **_opts)
      :not_found
    end

    def lock_phone_answer(_target_type, _target_id, *_args, **_opts)
      :no_phone
    end
  end
end
