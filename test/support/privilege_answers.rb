require 'json'

# Ops S5bc unit 19: reads the real server answers that ops_privilege_scenario_test.rb recorded
# (PRIV_ANSWERS_RECORD=1) into test/fixtures/files/ops_privilege_answers.json. It only reads the
# file, by answer name: { status:, body: }. Never edit the file by hand; re-record it.
module PrivilegeAnswers
  PATH = File.expand_path('../fixtures/files/ops_privilege_answers.json', __dir__)

  module_function

  def all
    JSON.parse(File.read(PATH))
  end

  def names
    all.keys
  end

  def entry(name)
    all.fetch(name.to_s) { raise KeyError, "no recorded privilege answer named #{name}" }
  end

  def body(name)
    entry(name)['body']
  end

  def status(name)
    entry(name)['status']
  end
end
