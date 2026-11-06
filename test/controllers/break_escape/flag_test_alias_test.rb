require 'test_helper'

module BreakEscape
  # Covers the development-only flag{N} stand-ins accepted by the flag station,
  # and the guarantee that they are an ALIAS rather than a bypass: they resolve
  # to the real flag and then every normal check still runs. Real flag values
  # must keep working unchanged, in every environment.
  class FlagTestAliasTest < ActionDispatch::IntegrationTest
    include Engine.routes.url_helpers

    FLAG_1 = 'flag{alpha_secret}'.freeze
    FLAG_2 = 'flag{beta_secret}'.freeze

    setup do
      @game = Game.create!(
        mission: break_escape_missions(:ceo_exfil),
        player: break_escape_demo_users(:test_user),
        scenario_data: {
          'startRoom' => 'reception',
          'flags' => {
            'target_vm' => { 'flag_1' => FLAG_1, 'flag_2' => FLAG_2 }
          },
          'rooms' => {
            'reception' => {
              'type' => 'room_reception',
              'objects' => [
                {
                  'type' => 'flag-station',
                  'id' => 'dropsite',
                  'name' => 'Drop Site',
                  'acceptsVms' => ['target_vm'],
                  'flags' => ['target_vm:flag_1', 'target_vm:flag_2']
                }
              ]
            }
          }
        }
      )
    end

    # Rails.env= is the supported way to swap environments in a test; mocha's
    # stub is not loaded in this suite.
    def with_rails_env(name)
      original = Rails.env
      Rails.env = name
      yield
    ensure
      Rails.env = original
    end

    def submit(flag, station_id: 'dropsite')
      post flags_game_url(@game), params: { flag: flag, stationId: station_id },
                                  as: :json
      JSON.parse(response.body)
    end

    test 'flag{1} resolves to the station first real flag' do
      body = submit('test:flag:1')

      assert_equal true, body['success'], body.inspect
      assert_equal true, body['testFlagAlias'], 'response must declare the stand-in was used'
      assert_equal FLAG_1, body['flag'], 'must resolve to the real flag value'
    end

    test 'test:flag:2 resolves to the second flag' do
      body = submit('test:flag:2')

      assert_equal true, body['success'], body.inspect
      assert_equal FLAG_2, body['flag']
    end

    test 'real flag values still work and are not marked as aliases' do
      body = submit(FLAG_1)

      assert_equal true, body['success'], body.inspect
      assert_equal FLAG_1, body['flag']
      assert_not_equal true, body['testFlagAlias']
    end

    test 'an alias is not a bypass: duplicate submission is still rejected' do
      assert_equal true, submit('test:flag:1')['success']

      body = submit('test:flag:1')
      assert_equal false, body['success'], 'second submission of the same flag must fail'
    end

    test 'an alias and the real flag are the same submission' do
      assert_equal true, submit('test:flag:1')['success']

      # Having consumed it via the alias, the real value must now be a duplicate.
      body = submit(FLAG_1)
      assert_equal false, body['success'],
                   'alias and real value must refer to one flag, not two'
    end

    test 'out-of-range index is passed through and rejected, not silently remapped' do
      body = submit('test:flag:99')

      assert_equal false, body['success']
      assert_not_equal FLAG_1, body['flag'],
                       'an unmatched index must never fall back to a real flag'
    end

    test 'a non-alias flag value is left alone' do
      body = submit('flag{not_a_real_flag}')

      assert_equal false, body['success']
    end

    test 'aliases are unavailable in production' do
      with_rails_env('production') do
        body = submit('test:flag:1')

        assert_equal false, body['success'],
                     'flag{1} must not be accepted in production'
        assert_not_equal true, body['testFlagAlias']
      end
    end

    test 'production still accepts real flags' do
      with_rails_env('production') do
        body = submit(FLAG_1)

        assert_equal true, body['success'], body.inspect
      end
    end
  end

    # SecGen flag-hint XML commonly uses flag{1}, flag{2}, ... as the REAL flag
    # values (that is what the standalone new-game form accepts). The positional
    # alias must not hijack them: a literal that is genuinely valid wins.
    class FlagTestAliasLiteralCollisionTest < ActionDispatch::IntegrationTest
      include Engine.routes.url_helpers

      setup do
        @game = Game.create!(
          mission: break_escape_missions(:ceo_exfil),
          player: break_escape_demo_users(:test_user),
          scenario_data: {
            'startRoom' => 'reception',
            'flags' => {
              'target_vm' => { 'flag_1' => 'flag{1}', 'flag_2' => 'flag{2}', 'flag_3' => 'flag{3}' }
            },
            'rooms' => {
              'reception' => {
                'type' => 'room_reception',
                'objects' => [
                  { 'type' => 'flag-station', 'id' => 'dropsite', 'name' => 'Drop Site',
                    'acceptsVms' => ['target_vm'],
                    # This station owns only flags 2 and 3 — so a positional
                    # reading of "flag{1}" would resolve to flag{2}.
                    'flags' => ['target_vm:flag_2', 'target_vm:flag_3'] }
                ]
              }
            }
          }
        )
      end

      def submit(flag)
        post flags_game_url(@game), params: { flag: flag, stationId: 'dropsite' }, as: :json
        JSON.parse(response.body)
      end

      test 'flag{1} is never read positionally, even though it looks like an index' do
        body = submit('flag{1}')

        # flag{1} is a real flag here but belongs to no station, so it is
        # rejected on ownership. The point is that it was NOT rewritten to
        # flag{2} (this station's first flag) — that would silently submit the
        # wrong flag in exactly the SecGen XML setup testers actually use.
        assert_not_equal 'flag{2}', body['flag'],
                         'a real flag{N} value was hijacked by positional aliasing'
        assert_not_equal true, body['testFlagAlias']
      end

      test 'test:flag:1 IS positional and resolves to this station first flag' do
        body = submit('test:flag:1')

        assert_equal true, body['success'], body.inspect
        assert_equal 'flag{2}', body['flag'],
                     'station owns flags 2 and 3, so its first is flag{2}'
        assert_equal true, body['testFlagAlias']
      end

      test 'a real flag owned by the station is accepted unaliased' do
        body = submit('flag{2}')

        assert_equal true, body['success'], body.inspect
        assert_equal 'flag{2}', body['flag']
        assert_not_equal true, body['testFlagAlias']
      end
    end
end
