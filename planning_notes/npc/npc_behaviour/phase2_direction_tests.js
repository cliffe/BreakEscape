/**
 * Phase 2: Direction Calculation Unit Tests
 *
 * These tests verify that the calculateDirection() function works correctly
 * for all edge cases and boundary conditions.
 *
 * Run in browser console after game loads:
 * > await import('./planning_notes/npc/npc_behaviour/phase2_direction_tests.js?v=1')
 */

/**
 * Test the calculateDirection logic
 * (Copied from npc-behavior.js for testing)
 */
function calculateDirection(dx, dy) {
    const absVX = Math.abs(dx);
    const absVY = Math.abs(dy);

    // Threshold: if one axis is > 2x the other, consider it pure cardinal
    if (absVX > absVY * 2) {
        return dx > 0 ? 'right' : 'left';
    }

    if (absVY > absVX * 2) {
        return dy > 0 ? 'down' : 'up';
    }

    // Diagonal
    if (dy > 0) {
        return dx > 0 ? 'down-right' : 'down-left';
    } else {
        return dx > 0 ? 'up-right' : 'up-left';
    }
}

/**
 * Test suite
 */
const tests = [
    // Pure Cardinal Directions
    {
        name: 'Pure Right (player directly east)',
        dx: 100,
        dy: 0,
        expected: 'right'
    },
    {
        name: 'Pure Left (player directly west)',
        dx: -100,
        dy: 0,
        expected: 'left'
    },
    {
        name: 'Pure Down (player directly south)',
        dx: 0,
        dy: 100,
        expected: 'down'
    },
    {
        name: 'Pure Up (player directly north)',
        dx: 0,
        dy: -100,
        expected: 'up'
    },

    // Threshold Tests - Should snap to cardinal
    {
        name: 'Mostly Right (30° angle)',
        dx: 100,
        dy: 30,
        expected: 'right',
        note: 'absVX (100) > absVY * 2 (60), should be cardinal'
    },
    {
        name: 'Mostly Left (30° angle)',
        dx: -100,
        dy: 30,
        expected: 'left',
        note: 'absVX (100) > absVY * 2 (60), should be cardinal'
    },
    {
        name: 'Mostly Down (30° angle)',
        dx: 30,
        dy: 100,
        expected: 'down',
        note: 'absVY (100) > absVX * 2 (60), should be cardinal'
    },
    {
        name: 'Mostly Up (30° angle)',
        dx: 30,
        dy: -100,
        expected: 'up',
        note: 'absVY (100) > absVX * 2 (60), should be cardinal'
    },

    // Pure Diagonal Directions (45°)
    {
        name: 'Pure Down-Right (45° angle)',
        dx: 100,
        dy: 100,
        expected: 'down-right',
        note: 'Equal dx/dy = 45°, should be diagonal'
    },
    {
        name: 'Pure Down-Left (45° angle)',
        dx: -100,
        dy: 100,
        expected: 'down-left',
        note: 'Equal dx/dy = 45°, should be diagonal'
    },
    {
        name: 'Pure Up-Right (45° angle)',
        dx: 100,
        dy: -100,
        expected: 'up-right',
        note: 'Equal dx/dy = 45°, should be diagonal'
    },
    {
        name: 'Pure Up-Left (45° angle)',
        dx: -100,
        dy: -100,
        expected: 'up-left',
        note: 'Equal dx/dy = 45°, should be diagonal'
    },

    // Threshold Boundary Tests
    {
        name: 'Threshold Boundary - Barely Diagonal Right-Down (60° from horizontal)',
        dx: 100,
        dy: 51,
        expected: 'down-right',
        note: 'absVX (100) NOT > absVY * 2 (102), should be diagonal'
    },
    {
        name: 'Threshold Boundary - Barely Cardinal Right (30° from horizontal)',
        dx: 100,
        dy: 49,
        expected: 'right',
        note: 'absVX (100) > absVY * 2 (98), should be cardinal'
    },
    {
        name: 'Threshold Boundary - Barely Diagonal Down-Right (30° from vertical)',
        dx: 51,
        dy: 100,
        expected: 'down-right',
        note: 'absVY (100) NOT > absVX * 2 (102), should be diagonal'
    },
    {
        name: 'Threshold Boundary - Barely Cardinal Down (60° from vertical)',
        dx: 49,
        dy: 100,
        expected: 'down',
        note: 'absVY (100) > absVX * 2 (98), should be cardinal'
    },

    // Edge Cases
    {
        name: 'Zero Distance (player on top of NPC)',
        dx: 0,
        dy: 0,
        expected: 'up-left',
        note: 'When dx=0 dy=0: not cardinal (0 NOT > 0), goes to diagonal, dy <= 0 so up, dx <= 0 so left = up-left'
    },

    // Small movements
    {
        name: 'Small Right Movement',
        dx: 1,
        dy: 0,
        expected: 'right'
    },
    {
        name: 'Small Diagonal Movement',
        dx: 1,
        dy: 1,
        expected: 'down-right'
    },

    // Large movements
    {
        name: 'Large Right Movement',
        dx: 1000,
        dy: 0,
        expected: 'right'
    },

    // Negative small movements
    {
        name: 'Small Up-Left Movement',
        dx: -1,
        dy: -1,
        expected: 'up-left'
    }
];

/**
 * Run all tests
 */
export function runDirectionTests() {
    console.log('🧪 Running Phase 2 Direction Calculation Tests...\n');

    let passed = 0;
    let failed = 0;
    const failures = [];

    tests.forEach((test, index) => {
        const result = calculateDirection(test.dx, test.dy);
        const success = result === test.expected;

        if (success) {
            passed++;
            console.log(`✅ Test ${index + 1}: ${test.name}`);
            if (test.note) {
                console.log(`   📝 ${test.note}`);
            }
        } else {
            failed++;
            failures.push({
                ...test,
                actual: result
            });
            console.log(`❌ Test ${index + 1}: ${test.name}`);
            console.log(`   Expected: ${test.expected}, Got: ${result}`);
            console.log(`   Input: dx=${test.dx}, dy=${test.dy}`);
            if (test.note) {
                console.log(`   📝 ${test.note}`);
            }
        }
    });

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
    console.log(`${'='.repeat(50)}\n`);

    if (failures.length > 0) {
        console.log('❌ Failed Tests:');
        failures.forEach(f => {
            console.log(`  - ${f.name}: Expected ${f.expected}, Got ${f.actual}`);
        });
    } else {
        console.log('✅ All tests passed!');
    }

    return {
        passed,
        failed,
        total: tests.length,
        failures
    };
}

/**
 * Test against actual NPC behavior (if behavior manager available)
 */
export function testWithActualBehavior(npcId = 'npc_center') {
    if (!window.npcBehaviorManager) {
        console.error('❌ NPCBehaviorManager not available. Load game first.');
        return;
    }

    const behavior = window.npcBehaviorManager.getBehavior(npcId);
    if (!behavior) {
        console.error(`❌ NPC "${npcId}" not found or has no behavior.`);
        return;
    }

    console.log(`🧪 Testing with actual NPC behavior: ${npcId}\n`);

    // Test a few key directions
    const testCases = [
        { dx: 100, dy: 0, expected: 'right' },
        { dx: -100, dy: 0, expected: 'left' },
        { dx: 0, dy: 100, expected: 'down' },
        { dx: 0, dy: -100, expected: 'up' },
        { dx: 100, dy: 100, expected: 'down-right' },
        { dx: -100, dy: -100, expected: 'up-left' }
    ];

    testCases.forEach(test => {
        const result = behavior.calculateDirection(test.dx, test.dy);
        const success = result === test.expected;
        console.log(success ? '✅' : '❌',
                    `dx=${test.dx}, dy=${test.dy}: Expected ${test.expected}, Got ${result}`);
    });
}

// Auto-run tests when imported
console.log('📦 Phase 2 Direction Tests Loaded');
console.log('Run tests with: runDirectionTests()');
console.log('Test with actual NPC: testWithActualBehavior("npc_id")');

// Export for use in console
window.runDirectionTests = runDirectionTests;
window.testWithActualBehavior = testWithActualBehavior;
