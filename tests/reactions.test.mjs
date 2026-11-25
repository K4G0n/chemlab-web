import test from 'node:test';
import assert from 'node:assert/strict';
import { COMPOUNDS, REACTION_RULES, reactionCoverage, supportedReaction, supportedUnaryReaction, validateReactionRegistry } from '../chemistry.js';

test('reaction registry uses unique structured entries and validates atom conservation', () => {
  const validation = validateReactionRegistry();
  assert.equal(validation.valid, true, validation.errors.join('\n'));
  assert.equal(new Set(REACTION_RULES.map((rule) => rule.id)).size, REACTION_RULES.length);
  assert.ok(REACTION_RULES.length >= 80);
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

test('alkali neutralization family provides distinct balanced halide and sulfate outcomes', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  assert.equal(supportedReaction(['HCl', 'KOH'], conditions)?.id, 'hcl-potassium-hydroxide');
  assert.equal(supportedReaction(['HBr', 'KOH'], conditions)?.id, 'hbr-potassium-hydroxide');
  assert.equal(supportedReaction(['HI', 'NaOH'], conditions)?.id, 'hi-sodium-hydroxide');
  assert.equal(supportedReaction(['HNO3', 'NaOH'], conditions)?.id, 'hno3-sodium-hydroxide');
  assert.equal(supportedReaction(['H2SO4', 'KOH'], conditions)?.id, 'h2so4-potassium-hydroxide');
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  assert.equal(spawnableIds.has('NaI'), true);
  assert.equal(spawnableIds.has('K2SO4'), true);
});

test('three-reactant acid-catalyzed hydration is condition-gated and preserves its catalyst', () => {
  const ordinaryConditions = { temperatureK:293, pressureAtm:1 };
  const heatedConditions = { temperatureK:480, pressureAtm:1 };
  assert.equal(supportedReaction(['C2H4', 'H2O', 'H2SO4'], ordinaryConditions), null);
  const rule = supportedReaction(['H2SO4', 'C2H4', 'H2O'], heatedConditions);
  assert.equal(rule?.id, 'ethene-hydration-acid-catalyzed');
  assert.deepEqual(rule?.preserveReactants, { H2SO4:1 });
});

test('uncatalyzed ethene hydration remains pressure-gated so catalyst-aware play can select the ternary rule', () => {
  assert.equal(supportedReaction(['C2H4', 'H2O'], { temperatureK:480, pressureAtm:1 }), null);
  assert.equal(supportedReaction(['C2H4', 'H2O'], { temperatureK:480, pressureAtm:5 })?.id, 'ethene-hydration');
});

test('acid-catalyzed esterification is selected at simulated heat while its uncatalyzed counterpart remains more restrictive', () => {
  const heatedConditions = { temperatureK:480, pressureAtm:1 };
  assert.equal(supportedReaction(['CH3COOH', 'C2H5OH'], heatedConditions), null);
  const rule = supportedReaction(['H2SO4', 'CH3COOH', 'C2H5OH'], heatedConditions);
  assert.equal(rule?.id, 'esterification-acid-catalyzed');
  assert.deepEqual(rule?.preserveReactants, { H2SO4:1 });
  assert.equal(supportedReaction(['CH3COOH', 'C2H5OH'], { temperatureK:720, pressureAtm:1 })?.id, 'esterification');
});

test('expanded precipitation families provide balanced cross-salt outcomes with spawnable products', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['AgNO3', 'KCl'], 'silver-chloride-potassium'],
    [['AgNO3', 'NaI'], 'silver-iodide-sodium'],
    [['BaCl2', 'Na2CO3'], 'barium-carbonate-precipitate'],
    [['BaNO32', 'K2SO4'], 'barium-sulfate-potassium'],
    [['CuSO4', 'KOH'], 'copper-hydroxide-potassium'],
    [['CuSO4', 'Na2CO3'], 'copper-carbonate-precipitate'],
    [['FeCl3', 'KOH'], 'iron-hydroxide-potassium'],
    [['PbNO32', 'Na2SO4'], 'lead-sulfate-precipitate'],
    [['PbNO32', 'KBr'], 'lead-bromide-precipitate']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['BaCO3', 'CuCO3', 'PbSO4', 'PbBr2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('carbonate and halide precipitation variants preserve spectator salts and expose new products', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['BaNO32', 'Na2CO3'], 'barium-carbonate-nitrate'],
    [['BaCl2', 'K2CO3'], 'barium-carbonate-potassium'],
    [['BaNO32', 'K2CO3'], 'barium-carbonate-nitrate-potassium'],
    [['PbNO32', 'Na2CO3'], 'lead-carbonate-precipitate'],
    [['PbNO32', 'K2CO3'], 'lead-carbonate-potassium'],
    [['PbNO32', 'CaCl2'], 'lead-chloride-calcium'],
    [['PbNO32', 'CaBr2'], 'lead-bromide-calcium'],
    [['AgNO3', 'CaBr2'], 'silver-bromide-calcium'],
    [['AgNO3', 'MgCl2'], 'silver-chloride-magnesium'],
    [['AgNO3', 'MgBr2'], 'silver-bromide-magnesium'],
    [['PbNO32', 'MgCl2'], 'lead-chloride-magnesium'],
    [['PbNO32', 'MgBr2'], 'lead-bromide-magnesium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['K2CO3', 'MgNO32', 'PbCO3']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});
