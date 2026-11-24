import test from 'node:test';
import assert from 'node:assert/strict';
import { REACTION_RULES, reactionCoverage, supportedReaction, supportedUnaryReaction, validateReactionRegistry } from '../chemistry.js';

test('reaction registry uses unique structured entries and validates atom conservation', () => {
  const validation = validateReactionRegistry();
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(new Set(REACTION_RULES.map((rule) => rule.id)).size, REACTION_RULES.length);
  assert.ok(REACTION_RULES.length >= 25);
  for (const rule of REACTION_RULES) {
    assert.ok(rule.reference);
    assert.ok(rule.validation === 'balanced');
    assert.ok(Object.keys(rule.reactantStoichiometry).length >= 1);
    assert.ok(Object.keys(rule.productStoichiometry).length >= 1);
  }
});

test('reaction coverage reports implemented rules, families, and mode compatibility from actual data', () => {
  const coverage = reactionCoverage();
  assert.equal(coverage.total, REACTION_RULES.length);
  assert.equal(coverage.validated, REACTION_RULES.length);
  assert.ok(coverage.families.includes('neutralization'));
  assert.ok(coverage.families.includes('combustion'));
  assert.ok(coverage.normalMode > 20);
  assert.ok(coverage.quantumMode > 20);
});

test('reaction lookup remains order independent but rejects unmatched identities and failed conditions', () => {
  assert.equal(supportedReaction(['NaOH', 'HCl'], { temperatureK:293, pressureAtm:1 })?.id, 'hcl-naoh');
  assert.equal(supportedReaction(['Au', 'H2O'], { temperatureK:293, pressureAtm:1 }), null);
  assert.equal(supportedReaction(['Na', 'H2O'], { temperatureK:700, pressureAtm:1 }), null);
});

test('unary decomposition rules are independently indexed and condition-gated', () => {
  assert.equal(supportedUnaryReaction('CaCO3', { temperatureK:293, pressureAtm:1 }), null);
  assert.equal(supportedUnaryReaction('CaCO3', { temperatureK:850, pressureAtm:1 })?.id, 'limestone-decomposition');
});
