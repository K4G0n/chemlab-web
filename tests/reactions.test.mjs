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

test('sodium-water requires a complete two-sodium stoichiometric set', () => {
  const rule = supportedReaction(['Na', 'H2O'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'sodium-water');
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
});

test('curated alkali and alkaline-earth water reactions produce spawnable hydroxides and hydrogen only from complete sets', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['K', 'H2O'], 'potassium-water'],
    [['Ca', 'H2O'], 'calcium-water'],
    [['Mg', 'H2O'], 'magnesium-water']
  ];
  for (const [reactants, id] of expectedRules) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.equal(rule?.requiresWholeStoichiometricSet, true);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['KOH', 'CaOH2', 'MgOH2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const magnesium = REACTION_RULES.find((rule) => rule.id === 'magnesium-water');
  assert.match(magnesium?.limitations || '', /educational water-reaction model/i);
});

test('barium oxide hydration provides catalog-backed barium hydroxide for acid-base reactions', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const hydration = supportedReaction(['BaO', 'H2O'], conditions);
  assert.equal(hydration?.id, 'barium-oxide-hydration');
  assert.deepEqual(hydration?.reactantStoichiometry, { BaO:1, H2O:1 });
  assert.deepEqual(hydration?.productStoichiometry, { BaOH2:1 });

  const expectedNeutralizations = [
    [['BaOH2', 'HCl'], 'barium-hydroxide-hydrochloric', { BaOH2:1, HCl:2 }, { BaCl2:1, H2O:2 }],
    [['BaOH2', 'H2SO4'], 'barium-hydroxide-sulfuric', { BaOH2:1, H2SO4:1 }, { BaSO4:1, H2O:2 }]
  ];
  for (const [reactants, id, reactantStoichiometry, productStoichiometry] of expectedNeutralizations) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.deepEqual(rule?.reactantStoichiometry, reactantStoichiometry);
    assert.deepEqual(rule?.productStoichiometry, productStoichiometry);
  }

  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['BaO', 'H2O', 'BaOH2', 'HCl', 'BaCl2', 'H2SO4', 'BaSO4']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const sulfate = REACTION_RULES.find((rule) => rule.id === 'barium-hydroxide-sulfuric');
  assert.match(sulfate?.limitations || '', /educational acid-base neutralization model/i);
});

test('magnesium oxide hydration provides catalog-backed magnesium hydroxide for follow-on reactions', () => {
  const hydration = supportedReaction(['MgO', 'H2O'], { temperatureK:293, pressureAtm:1 });
  assert.equal(hydration?.id, 'magnesium-oxide-hydration');
  assert.deepEqual(hydration?.reactantStoichiometry, { MgO:1, H2O:1 });
  assert.deepEqual(hydration?.productStoichiometry, { MgOH2:1 });

  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgO', 'H2O', 'MgOH2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(hydration?.limitations || '', /educational oxide-hydration model/i);
});

test('iron(II) oxide neutralizes hydrochloric acid into catalog-backed iron(II) chloride and water', () => {
  const rule = supportedReaction(['FeO', 'HCl'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-ii-oxide-hydrochloric');
  assert.deepEqual(rule?.reactantStoichiometry, { FeO:1, HCl:2 });
  assert.deepEqual(rule?.productStoichiometry, { FeCl2:1, H2O:1 });

  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['FeO', 'HCl', 'FeCl2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('iron(II) oxide neutralizes sulfuric acid into catalog-backed iron(II) sulfate and water', () => {
  const rule = supportedReaction(['FeO', 'H2SO4'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-ii-oxide-sulfuric');
  assert.deepEqual(rule?.reactantStoichiometry, { FeO:1, H2SO4:1 });
  assert.deepEqual(rule?.productStoichiometry, { FeSO4:1, H2O:1 });

  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['FeO', 'H2SO4', 'FeSO4', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('iron(II) oxide neutralizes nitric acid into catalog-backed iron(II) nitrate and water', () => {
  const rule = supportedReaction(['FeO', 'HNO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-ii-oxide-nitric');
  assert.deepEqual(rule?.reactantStoichiometry, { FeO:1, HNO3:2 });
  assert.deepEqual(rule?.productStoichiometry, { FeNO32:1, H2O:1 });

  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['FeO', 'HNO3', 'FeNO32', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('iron(II) oxide neutralizes hydrobromic acid into catalog-backed iron(II) bromide and water', () => {
  const rule = supportedReaction(['FeO', 'HBr'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-ii-oxide-hydrobromic');
  assert.deepEqual(rule?.reactantStoichiometry, { FeO:1, HBr:2 });
  assert.deepEqual(rule?.productStoichiometry, { FeBr2:1, H2O:1 });

  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['FeO', 'HBr', 'FeBr2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('iron(II) oxide neutralizes hydroiodic acid into catalog-backed iron(II) iodide and water', () => {
  const rule = supportedReaction(['FeO', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-ii-oxide-hydroiodic');
  assert.deepEqual(rule?.reactantStoichiometry, { FeO:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { FeI2:1, H2O:1 });

  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['FeO', 'HI', 'FeI2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('barium oxide neutralizes common mineral acids into catalog-backed salts and water', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedReactions = [
    [['BaO', 'HCl'], 'barium-oxide-hydrochloric', { BaO:1, HCl:2 }, { BaCl2:1, H2O:1 }],
    [['BaO', 'H2SO4'], 'barium-oxide-sulfuric', { BaO:1, H2SO4:1 }, { BaSO4:1, H2O:1 }],
    [['BaO', 'HNO3'], 'barium-oxide-nitric', { BaO:1, HNO3:2 }, { BaNO32:1, H2O:1 }]
  ];
  for (const [reactants, id, reactantStoichiometry, productStoichiometry] of expectedReactions) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.deepEqual(rule?.reactantStoichiometry, reactantStoichiometry);
    assert.deepEqual(rule?.productStoichiometry, productStoichiometry);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['BaO', 'HCl', 'H2SO4', 'HNO3', 'BaCl2', 'BaSO4', 'BaNO32', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const sulfuric = REACTION_RULES.find((rule) => rule.id === 'barium-oxide-sulfuric');
  assert.match(sulfuric?.limitations || '', /educational acid-metal-oxide model/i);
});

test('barium carbonate reacts with common mineral acids into catalog-backed salts, water, and carbon dioxide', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedReactions = [
    [['BaCO3', 'HCl'], 'barium-carbonate-hydrochloric', { BaCO3:1, HCl:2 }, { BaCl2:1, H2O:1, CO2:1 }],
    [['BaCO3', 'H2SO4'], 'barium-carbonate-sulfuric', { BaCO3:1, H2SO4:1 }, { BaSO4:1, H2O:1, CO2:1 }]
  ];
  for (const [reactants, id, reactantStoichiometry, productStoichiometry] of expectedReactions) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.deepEqual(rule?.reactantStoichiometry, reactantStoichiometry);
    assert.deepEqual(rule?.productStoichiometry, productStoichiometry);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['BaCO3', 'HCl', 'H2SO4', 'BaCl2', 'BaSO4', 'H2O', 'CO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const sulfuric = REACTION_RULES.find((rule) => rule.id === 'barium-carbonate-sulfuric');
  assert.match(sulfuric?.limitations || '', /educational carbonate-acid model/i);
});

test('magnesium carbonate reacts with common mineral acids into catalog-backed salts, water, and carbon dioxide', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedReactions = [
    [['MgCO3', 'HCl'], 'magnesium-carbonate-hydrochloric', { MgCO3:1, HCl:2 }, { MgCl2:1, H2O:1, CO2:1 }],
    [['MgCO3', 'H2SO4'], 'magnesium-carbonate-sulfuric', { MgCO3:1, H2SO4:1 }, { MgSO4:1, H2O:1, CO2:1 }]
  ];
  for (const [reactants, id, reactantStoichiometry, productStoichiometry] of expectedReactions) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.deepEqual(rule?.reactantStoichiometry, reactantStoichiometry);
    assert.deepEqual(rule?.productStoichiometry, productStoichiometry);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgCO3', 'HCl', 'H2SO4', 'MgCl2', 'MgSO4', 'H2O', 'CO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const sulfuric = REACTION_RULES.find((rule) => rule.id === 'magnesium-carbonate-sulfuric');
  assert.match(sulfuric?.limitations || '', /educational carbonate-acid model/i);
});

test('magnesium carbonate reacts with hydrobromic and nitric acids into catalog-backed salts, water, and carbon dioxide', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedReactions = [
    [['MgCO3', 'HBr'], 'magnesium-carbonate-hydrobromic', { MgCO3:1, HBr:2 }, { MgBr2:1, H2O:1, CO2:1 }],
    [['MgCO3', 'HNO3'], 'magnesium-carbonate-nitric', { MgCO3:1, HNO3:2 }, { MgNO32:1, H2O:1, CO2:1 }]
  ];
  for (const [reactants, id, reactantStoichiometry, productStoichiometry] of expectedReactions) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.deepEqual(rule?.reactantStoichiometry, reactantStoichiometry);
    assert.deepEqual(rule?.productStoichiometry, productStoichiometry);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgCO3', 'HBr', 'HNO3', 'MgBr2', 'MgNO32', 'H2O', 'CO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const nitric = REACTION_RULES.find((rule) => rule.id === 'magnesium-carbonate-nitric');
  assert.match(nitric?.limitations || '', /educational carbonate-acid model/i);
});

test('magnesium carbonate reacts with hydroiodic acid into catalog-backed magnesium iodide, water, and carbon dioxide', () => {
  const rule = supportedReaction(['MgCO3', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'magnesium-carbonate-hydroiodic');
  assert.deepEqual(rule?.reactantStoichiometry, { MgCO3:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { MgI2:1, H2O:1, CO2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgCO3', 'HI', 'MgI2', 'H2O', 'CO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational carbonate-acid model/i);
});

test('curated metal plus sulfuric acid reactions yield catalog-backed sulfates and hydrogen from complete sets', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['Mg', 'H2SO4'], 'magnesium-sulfuric-acid-displacement'],
    [['Zn', 'H2SO4'], 'zinc-sulfuric-acid-displacement'],
    [['Fe', 'H2SO4'], 'iron-sulfuric-acid-displacement'],
    [['Al', 'H2SO4'], 'aluminium-sulfuric-acid-displacement']
  ];
  for (const [reactants, id] of expectedRules) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.equal(rule?.requiresWholeStoichiometricSet, true);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgSO4', 'ZnSO4', 'FeSO4', 'Al2SO43', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const aluminium = REACTION_RULES.find((rule) => rule.id === 'aluminium-sulfuric-acid-displacement');
  assert.match(aluminium?.limitations || '', /educational metal-acid model/i);
});

test('calcium displaces hydrogen from hydrochloric acid into catalog-backed calcium chloride', () => {
  const rule = supportedReaction(['Ca', 'HCl'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-hydrochloric-displacement');
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
  assert.deepEqual(rule?.reactantStoichiometry, { Ca:1, HCl:2 });
  assert.deepEqual(rule?.productStoichiometry, { CaCl2:1, H2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HCl', 'CaCl2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('hydrogen sulfide oxidizes to catalog-backed sulfur dioxide and water only when heated', () => {
  assert.equal(supportedReaction(['H2S', 'O2'], { temperatureK:293, pressureAtm:1 }), null);
  const rule = supportedReaction(['H2S', 'O2'], { temperatureK:500, pressureAtm:1 });
  assert.equal(rule?.id, 'hydrogen-sulfide-oxidation');
  assert.deepEqual(rule?.reactantStoichiometry, { H2S:2, O2:3 });
  assert.deepEqual(rule?.productStoichiometry, { SO2:2, H2O:2 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['H2S', 'O2', 'SO2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational oxidation model/i);
});

test('copper(II) oxide and sulfuric acid yield catalog-backed copper(II) sulfate and water', () => {
  const rule = supportedReaction(['CuO', 'H2SO4'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'copper-oxide-sulfuric');
  assert.deepEqual(rule?.reactantStoichiometry, { CuO:1, H2SO4:1 });
  assert.deepEqual(rule?.productStoichiometry, { CuSO4:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CuSO4', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('copper(II) oxide and nitric acid yield catalog-backed copper(II) nitrate and water', () => {
  const rule = supportedReaction(['CuO', 'HNO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'copper-oxide-nitric');
  assert.deepEqual(rule?.reactantStoichiometry, { CuO:1, HNO3:2 });
  assert.deepEqual(rule?.productStoichiometry, { CuNO32:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CuO', 'HNO3', 'CuNO32', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('copper(II) oxide and hydrobromic acid yield catalog-backed copper(II) bromide and water', () => {
  const rule = supportedReaction(['CuO', 'HBr'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'copper-oxide-hydrobromic');
  assert.deepEqual(rule?.reactantStoichiometry, { CuO:1, HBr:2 });
  assert.deepEqual(rule?.productStoichiometry, { CuBr2:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CuO', 'HBr', 'CuBr2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('magnesium, zinc, and calcium oxides react with hydrobromic acid into catalog-backed bromides and water', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['MgO', 'HBr'], 'magnesium-oxide-hydrobromic', { MgO:1, HBr:2 }, { MgBr2:1, H2O:1 }],
    [['ZnO', 'HBr'], 'zinc-oxide-hydrobromic', { ZnO:1, HBr:2 }, { ZnBr2:1, H2O:1 }],
    [['CaO', 'HBr'], 'calcium-oxide-hydrobromic', { CaO:1, HBr:2 }, { CaBr2:1, H2O:1 }]
  ];
  for (const [reactants, id, reactantStoichiometry, productStoichiometry] of expectedRules) {
    const rule = supportedReaction(reactants, conditions);
    assert.equal(rule?.id, id);
    assert.deepEqual(rule?.reactantStoichiometry, reactantStoichiometry);
    assert.deepEqual(rule?.productStoichiometry, productStoichiometry);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgO', 'ZnO', 'CaO', 'HBr', 'MgBr2', 'ZnBr2', 'CaBr2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('calcium oxide and sulfuric acid yield catalog-backed calcium sulfate and water', () => {
  const rule = supportedReaction(['CaO', 'H2SO4'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-oxide-sulfuric');
  assert.deepEqual(rule?.reactantStoichiometry, { CaO:1, H2SO4:1 });
  assert.deepEqual(rule?.productStoichiometry, { CaSO4:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CaO', 'H2SO4', 'CaSO4', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('calcium oxide and hydrochloric acid yield catalog-backed calcium chloride and water', () => {
  const rule = supportedReaction(['CaO', 'HCl'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-oxide-hydrochloric');
  assert.deepEqual(rule?.reactantStoichiometry, { CaO:1, HCl:2 });
  assert.deepEqual(rule?.productStoichiometry, { CaCl2:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CaO', 'HCl', 'CaCl2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('calcium oxide and nitric acid yield catalog-backed calcium nitrate and water', () => {
  const rule = supportedReaction(['CaO', 'HNO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-oxide-nitric');
  assert.deepEqual(rule?.reactantStoichiometry, { CaO:1, HNO3:2 });
  assert.deepEqual(rule?.productStoichiometry, { CaNO32:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CaO', 'HNO3', 'CaNO32', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('magnesium oxide and nitric acid yield catalog-backed magnesium nitrate and water', () => {
  const rule = supportedReaction(['MgO', 'HNO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'magnesium-oxide-nitric');
  assert.deepEqual(rule?.reactantStoichiometry, { MgO:1, HNO3:2 });
  assert.deepEqual(rule?.productStoichiometry, { MgNO32:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgO', 'HNO3', 'MgNO32', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('zinc oxide and nitric acid yield catalog-backed zinc nitrate and water', () => {
  const rule = supportedReaction(['ZnO', 'HNO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'zinc-oxide-nitric');
  assert.deepEqual(rule?.reactantStoichiometry, { ZnO:1, HNO3:2 });
  assert.deepEqual(rule?.productStoichiometry, { ZnNO32:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['ZnO', 'HNO3', 'ZnNO32', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('aluminium oxide and hydrochloric acid yield catalog-backed aluminium chloride and water', () => {
  const rule = supportedReaction(['Al2O3', 'HCl'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'aluminium-oxide-hydrochloric');
  assert.deepEqual(rule?.reactantStoichiometry, { Al2O3:1, HCl:6 });
  assert.deepEqual(rule?.productStoichiometry, { AlCl3:2, H2O:3 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['Al2O3', 'HCl', 'AlCl3', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('iron(III) oxide and hydrobromic acid yield catalog-backed iron(III) bromide and water', () => {
  const rule = supportedReaction(['Fe2O3', 'HBr'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-oxide-hydrobromic');
  assert.deepEqual(rule?.reactantStoichiometry, { Fe2O3:1, HBr:6 });
  assert.deepEqual(rule?.productStoichiometry, { FeBr3:2, H2O:3 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['Fe2O3', 'HBr', 'FeBr3', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('iron and hydroiodic acid yield catalog-backed iron(II) iodide and hydrogen', () => {
  const rule = supportedReaction(['Fe', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-hydroiodic-displacement');
  assert.deepEqual(rule?.reactantStoichiometry, { Fe:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { FeI2:1, H2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HI', 'FeI2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('magnesium and hydroiodic acid yield catalog-backed magnesium iodide and hydrogen', () => {
  const rule = supportedReaction(['Mg', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'magnesium-hydroiodic-displacement');
  assert.deepEqual(rule?.reactantStoichiometry, { Mg:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { MgI2:1, H2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HI', 'MgI2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('zinc and hydroiodic acid yield catalog-backed zinc iodide and hydrogen', () => {
  const rule = supportedReaction(['Zn', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'zinc-hydroiodic-displacement');
  assert.deepEqual(rule?.reactantStoichiometry, { Zn:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { ZnI2:1, H2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HI', 'ZnI2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('aluminium and hydroiodic acid yield catalog-backed aluminium iodide and hydrogen', () => {
  const rule = supportedReaction(['Al', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'aluminium-hydroiodic-displacement');
  assert.deepEqual(rule?.reactantStoichiometry, { Al:2, HI:6 });
  assert.deepEqual(rule?.productStoichiometry, { AlI3:2, H2:3 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HI', 'AlI3', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('iron and hydrobromic acid yield catalog-backed iron(II) bromide and hydrogen', () => {
  const rule = supportedReaction(['Fe', 'HBr'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-hydrobromic-displacement');
  assert.deepEqual(rule?.reactantStoichiometry, { Fe:1, HBr:2 });
  assert.deepEqual(rule?.productStoichiometry, { FeBr2:1, H2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HBr', 'FeBr2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('calcium and hydrobromic acid yield catalog-backed calcium bromide and hydrogen', () => {
  const rule = supportedReaction(['Ca', 'HBr'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-hydrobromic-displacement');
  assert.deepEqual(rule?.reactantStoichiometry, { Ca:1, HBr:2 });
  assert.deepEqual(rule?.productStoichiometry, { CaBr2:1, H2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HBr', 'CaBr2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('calcium and hydroiodic acid yield catalog-backed calcium iodide and hydrogen', () => {
  const rule = supportedReaction(['Ca', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-hydroiodic-displacement');
  assert.deepEqual(rule?.reactantStoichiometry, { Ca:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { CaI2:1, H2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['HI', 'CaI2', 'H2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.equal(rule?.requiresWholeStoichiometricSet, true);
  assert.match(rule?.limitations || '', /educational metal-acid model/i);
});

test('magnesium oxide and hydroiodic acid yield catalog-backed magnesium iodide and water', () => {
  const rule = supportedReaction(['MgO', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'magnesium-oxide-hydroiodic');
  assert.deepEqual(rule?.reactantStoichiometry, { MgO:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { MgI2:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgO', 'HI', 'MgI2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('zinc oxide and hydroiodic acid yield catalog-backed zinc iodide and water', () => {
  const rule = supportedReaction(['ZnO', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'zinc-oxide-hydroiodic');
  assert.deepEqual(rule?.reactantStoichiometry, { ZnO:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { ZnI2:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['ZnO', 'HI', 'ZnI2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('calcium oxide and hydroiodic acid yield catalog-backed calcium iodide and water', () => {
  const rule = supportedReaction(['CaO', 'HI'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-oxide-hydroiodic');
  assert.deepEqual(rule?.reactantStoichiometry, { CaO:1, HI:2 });
  assert.deepEqual(rule?.productStoichiometry, { CaI2:1, H2O:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CaO', 'HI', 'CaI2', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('calcium hydroxide and nitric acid yield catalog-backed calcium nitrate and water', () => {
  const rule = supportedReaction(['CaOH2', 'HNO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-hydroxide-nitric');
  assert.deepEqual(rule?.reactantStoichiometry, { CaOH2:1, HNO3:2 });
  assert.deepEqual(rule?.productStoichiometry, { CaNO32:1, H2O:2 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CaOH2', 'HNO3', 'CaNO32', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
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

test('magnesium and zinc hydroxide precipitation variants conserve spectator salts and expose products', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['MgSO4', 'NaOH'], 'magnesium-hydroxide-sulfate-sodium'],
    [['MgSO4', 'KOH'], 'magnesium-hydroxide-sulfate-potassium'],
    [['MgCl2', 'NaOH'], 'magnesium-hydroxide-chloride-sodium'],
    [['MgCl2', 'KOH'], 'magnesium-hydroxide-chloride-potassium'],
    [['ZnSO4', 'NaOH'], 'zinc-hydroxide-sulfate-sodium'],
    [['ZnSO4', 'KOH'], 'zinc-hydroxide-sulfate-potassium'],
    [['ZnCl2', 'NaOH'], 'zinc-hydroxide-chloride-sodium'],
    [['ZnCl2', 'KOH'], 'zinc-hydroxide-chloride-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgOH2', 'ZnOH2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('aluminium and iron(III) sulfate hydroxide precipitation variants preserve balanced spectator salts', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['AlCl3', 'NaOH'], 'aluminium-hydroxide-chloride-sodium'],
    [['AlCl3', 'KOH'], 'aluminium-hydroxide-chloride-potassium'],
    [['Al2SO43', 'NaOH'], 'aluminium-hydroxide-sulfate-sodium'],
    [['Al2SO43', 'KOH'], 'aluminium-hydroxide-sulfate-potassium'],
    [['Fe2SO43', 'NaOH'], 'iron-hydroxide-sulfate-sodium'],
    [['Fe2SO43', 'KOH'], 'iron-hydroxide-sulfate-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  assert.equal(new Set(COMPOUNDS.map((compound) => compound.id)).has('AlOH3'), true, 'AlOH3 must be spawnable');
});

test('calcium hydroxide precipitation variants conserve nitrate and chloride spectator salts', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['CaCl2', 'NaOH'], 'calcium-hydroxide-chloride-sodium'],
    [['CaCl2', 'KOH'], 'calcium-hydroxide-chloride-potassium'],
    [['CaNO32', 'NaOH'], 'calcium-hydroxide-nitrate-sodium'],
    [['CaNO32', 'KOH'], 'calcium-hydroxide-nitrate-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  assert.equal(new Set(COMPOUNDS.map((compound) => compound.id)).has('CaOH2'), true, 'CaOH2 must be spawnable');
});

test('barium and calcium sulfate precipitation variants conserve soluble spectator salts', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['BaCl2', 'K2SO4'], 'barium-sulfate-chloride-potassium'],
    [['CaCl2', 'Na2SO4'], 'calcium-sulfate-chloride-sodium'],
    [['CaCl2', 'K2SO4'], 'calcium-sulfate-chloride-potassium'],
    [['CaNO32', 'Na2SO4'], 'calcium-sulfate-nitrate-sodium'],
    [['CaNO32', 'K2SO4'], 'calcium-sulfate-nitrate-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  assert.equal(new Set(COMPOUNDS.map((compound) => compound.id)).has('CaSO4'), true, 'CaSO4 must be spawnable');
});

test('calcium carbonate precipitation completes the curated calcium salt and alkali-carbonate matrix', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['CaCl2', 'K2CO3'], 'calcium-carbonate-chloride-potassium'],
    [['CaNO32', 'Na2CO3'], 'calcium-carbonate-nitrate-sodium'],
    [['CaNO32', 'K2CO3'], 'calcium-carbonate-nitrate-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  assert.equal(new Set(COMPOUNDS.map((compound) => compound.id)).has('CaCO3'), true, 'CaCO3 must be spawnable');
});

test('copper(II) chloride and sulfate salts provide distinct hydroxide and carbonate precipitation outcomes', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['CuCl2', 'NaOH'], 'copper-hydroxide-chloride-sodium'],
    [['CuCl2', 'KOH'], 'copper-hydroxide-chloride-potassium'],
    [['CuCl2', 'Na2CO3'], 'copper-carbonate-chloride-sodium'],
    [['CuCl2', 'K2CO3'], 'copper-carbonate-chloride-potassium'],
    [['CuSO4', 'K2CO3'], 'copper-carbonate-sulfate-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CuOH2', 'CuCO3']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('copper(II) nitrate and bromide salts extend the balanced hydroxide and carbonate precipitation matrix', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['CuNO32', 'NaOH'], 'copper-hydroxide-nitrate-sodium'],
    [['CuNO32', 'KOH'], 'copper-hydroxide-nitrate-potassium'],
    [['CuNO32', 'Na2CO3'], 'copper-carbonate-nitrate-sodium'],
    [['CuNO32', 'K2CO3'], 'copper-carbonate-nitrate-potassium'],
    [['CuBr2', 'NaOH'], 'copper-hydroxide-bromide-sodium'],
    [['CuBr2', 'KOH'], 'copper-hydroxide-bromide-potassium'],
    [['CuBr2', 'Na2CO3'], 'copper-carbonate-bromide-sodium'],
    [['CuBr2', 'K2CO3'], 'copper-carbonate-bromide-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CuNO32', 'CuBr2', 'CuOH2', 'CuCO3']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('zinc(II) nitrate and bromide salts extend the balanced hydroxide and carbonate precipitation matrix', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['ZnNO32', 'NaOH'], 'zinc-hydroxide-nitrate-sodium'],
    [['ZnNO32', 'KOH'], 'zinc-hydroxide-nitrate-potassium'],
    [['ZnNO32', 'Na2CO3'], 'zinc-carbonate-nitrate-sodium'],
    [['ZnNO32', 'K2CO3'], 'zinc-carbonate-nitrate-potassium'],
    [['ZnBr2', 'NaOH'], 'zinc-hydroxide-bromide-sodium'],
    [['ZnBr2', 'KOH'], 'zinc-hydroxide-bromide-potassium'],
    [['ZnBr2', 'Na2CO3'], 'zinc-carbonate-bromide-sodium'],
    [['ZnBr2', 'K2CO3'], 'zinc-carbonate-bromide-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['ZnNO32', 'ZnBr2', 'ZnOH2', 'ZnCO3']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('iron(II) salts provide distinct hydroxide and educational carbonate precipitate outcomes', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['FeCl2', 'NaOH'], 'iron-ii-hydroxide-chloride-sodium'],
    [['FeCl2', 'KOH'], 'iron-ii-hydroxide-chloride-potassium'],
    [['FeSO4', 'NaOH'], 'iron-ii-hydroxide-sulfate-sodium'],
    [['FeSO4', 'KOH'], 'iron-ii-hydroxide-sulfate-potassium'],
    [['FeNO32', 'NaOH'], 'iron-ii-hydroxide-nitrate-sodium'],
    [['FeNO32', 'KOH'], 'iron-ii-hydroxide-nitrate-potassium'],
    [['FeCl2', 'Na2CO3'], 'iron-ii-carbonate-chloride-sodium'],
    [['FeCl2', 'K2CO3'], 'iron-ii-carbonate-chloride-potassium'],
    [['FeSO4', 'Na2CO3'], 'iron-ii-carbonate-sulfate-sodium'],
    [['FeSO4', 'K2CO3'], 'iron-ii-carbonate-sulfate-potassium'],
    [['FeNO32', 'Na2CO3'], 'iron-ii-carbonate-nitrate-sodium'],
    [['FeNO32', 'K2CO3'], 'iron-ii-carbonate-nitrate-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['FeOH2', 'FeCO3']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('magnesium(II) salts provide carbonate outcomes with balanced spectator salts', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['MgCl2', 'Na2CO3'], 'magnesium-carbonate-chloride-sodium'],
    [['MgCl2', 'K2CO3'], 'magnesium-carbonate-chloride-potassium'],
    [['MgSO4', 'Na2CO3'], 'magnesium-carbonate-sulfate-sodium'],
    [['MgSO4', 'K2CO3'], 'magnesium-carbonate-sulfate-potassium'],
    [['MgNO32', 'Na2CO3'], 'magnesium-carbonate-nitrate-sodium'],
    [['MgNO32', 'K2CO3'], 'magnesium-carbonate-nitrate-potassium'],
    [['MgBr2', 'Na2CO3'], 'magnesium-carbonate-bromide-sodium'],
    [['MgBr2', 'K2CO3'], 'magnesium-carbonate-bromide-potassium']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  assert.equal(new Set(COMPOUNDS.map((compound) => compound.id)).has('MgCO3'), true, 'MgCO3 must be spawnable');
});

test('curated metal carbonate and hydroxide decompositions require simulated high temperature', () => {
  const ordinaryConditions = { temperatureK:293, pressureAtm:1 };
  const stronglyHeatedConditions = { temperatureK:700, pressureAtm:1 };
  const expectedRules = [
    ['MgCO3', 'magnesium-carbonate-decomposition'],
    ['ZnCO3', 'zinc-carbonate-decomposition'],
    ['CuCO3', 'copper-carbonate-decomposition'],
    ['MgOH2', 'magnesium-hydroxide-decomposition'],
    ['ZnOH2', 'zinc-hydroxide-decomposition'],
    ['CuOH2', 'copper-hydroxide-decomposition'],
    ['FeOH3', 'iron-iii-hydroxide-decomposition']
  ];
  for (const [reactant, id] of expectedRules) {
    assert.equal(supportedUnaryReaction(reactant, ordinaryConditions), null, `${reactant} should not decompose at ordinary conditions`);
    assert.equal(supportedUnaryReaction(reactant, stronglyHeatedConditions)?.id, id);
  }
  const copperCarbonate = REACTION_RULES.find((rule) => rule.id === 'copper-carbonate-decomposition');
  assert.match(copperCarbonate?.limitations || '', /basic carbonate variants/i);
});

test('alkali nitrate decompositions are spawnable and require simulated high temperature', () => {
  const ordinaryConditions = { temperatureK:293, pressureAtm:1 };
  const stronglyHeatedConditions = { temperatureK:700, pressureAtm:1 };
  const expectedRules = [
    ['NaNO3', 'sodium-nitrate-decomposition'],
    ['KNO3', 'potassium-nitrate-decomposition']
  ];
  for (const [reactant, id] of expectedRules) {
    assert.equal(supportedUnaryReaction(reactant, ordinaryConditions), null, `${reactant} should not decompose at ordinary conditions`);
    assert.equal(supportedUnaryReaction(reactant, stronglyHeatedConditions)?.id, id);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['NaNO2', 'KNO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
});

test('curated divalent metal nitrate decompositions require simulated high temperature and expose nitrogen dioxide', () => {
  const ordinaryConditions = { temperatureK:293, pressureAtm:1 };
  const stronglyHeatedConditions = { temperatureK:700, pressureAtm:1 };
  const expectedRules = [
    ['MgNO32', 'magnesium-nitrate-decomposition'],
    ['CaNO32', 'calcium-nitrate-decomposition'],
    ['ZnNO32', 'zinc-nitrate-decomposition'],
    ['CuNO32', 'copper-nitrate-decomposition']
  ];
  for (const [reactant, id] of expectedRules) {
    assert.equal(supportedUnaryReaction(reactant, ordinaryConditions), null, `${reactant} should not decompose at ordinary conditions`);
    assert.equal(supportedUnaryReaction(reactant, stronglyHeatedConditions)?.id, id);
  }
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  assert.equal(spawnableIds.has('NO2'), true, 'NO2 must be spawnable');
  const copperNitrate = REACTION_RULES.find((rule) => rule.id === 'copper-nitrate-decomposition');
  assert.match(copperNitrate?.limitations || '', /educational thermal decomposition model/i);
});

test('curated sulfite and sulfide acid reactions expose gas products and a precursor pathway', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['Na2SO3', 'HCl'], 'hydrochloric-sodium-sulfite'],
    [['Na2SO3', 'HBr'], 'hydrobromic-sodium-sulfite'],
    [['Na2SO3', 'H2SO4'], 'sulfuric-sodium-sulfite'],
    [['Na2S', 'HCl'], 'hydrochloric-sodium-sulfide'],
    [['Na2S', 'HBr'], 'hydrobromic-sodium-sulfide'],
    [['Na2S', 'H2SO4'], 'sulfuric-sodium-sulfide'],
    [['Na', 'S'], 'sodium-sulfide-synthesis']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['Na2S', 'H2S', 'Na2SO3', 'SO2', 'Na2SO4']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const sulfide = REACTION_RULES.find((rule) => rule.id === 'sulfuric-sodium-sulfide');
  assert.match(sulfide?.limitations || '', /educational gas-formation model/i);
});

test('basic oxides absorb curated acidic oxides into spawnable carbonate and sulfite or sulfate salts', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['Na2O', 'CO2'], 'sodium-oxide-carbon-dioxide'],
    [['K2O', 'CO2'], 'potassium-oxide-carbon-dioxide'],
    [['MgO', 'CO2'], 'magnesium-oxide-carbon-dioxide'],
    [['Na2O', 'SO2'], 'sodium-oxide-sulfur-dioxide'],
    [['K2O', 'SO2'], 'potassium-oxide-sulfur-dioxide'],
    [['MgO', 'SO2'], 'magnesium-oxide-sulfur-dioxide'],
    [['CaO', 'SO2'], 'calcium-oxide-sulfur-dioxide'],
    [['CaO', 'SO3'], 'calcium-oxide-sulfur-trioxide']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgSO3', 'K2SO3']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const sulfate = REACTION_RULES.find((rule) => rule.id === 'calcium-oxide-sulfur-trioxide');
  assert.match(sulfate?.limitations || '', /educational oxide-absorption model/i);
});

test('acidic oxides react with curated alkali and alkaline-earth bases into balanced salts and water', () => {
  const conditions = { temperatureK:293, pressureAtm:1 };
  const expectedRules = [
    [['CO2', 'KOH'], 'carbon-dioxide-potassium-hydroxide'],
    [['SO2', 'KOH'], 'sulfur-dioxide-potassium-hydroxide'],
    [['SO3', 'NaOH'], 'sulfur-trioxide-sodium-hydroxide'],
    [['SO3', 'KOH'], 'sulfur-trioxide-potassium-hydroxide'],
    [['SO3', 'CaOH2'], 'sulfur-trioxide-calcium-hydroxide']
  ];
  for (const [reactants, id] of expectedRules) assert.equal(supportedReaction(reactants, conditions)?.id, id);
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['K2CO3', 'K2SO3', 'Na2SO4', 'K2SO4', 'CaSO4']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  const sulfate = REACTION_RULES.find((rule) => rule.id === 'sulfur-trioxide-calcium-hydroxide');
  assert.match(sulfate?.limitations || '', /educational acidic-oxide absorption model/i);
});

test('aluminium oxide and hydrobromic acid yield catalog-backed aluminium bromide and water', () => {
  const rule = supportedReaction(['Al2O3', 'HBr'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'aluminium-oxide-hydrobromic');
  assert.deepEqual(rule?.reactantStoichiometry, { Al2O3:1, HBr:6 });
  assert.deepEqual(rule?.productStoichiometry, { AlBr3:2, H2O:3 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['Al2O3', 'HBr', 'AlBr3', 'H2O']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational acid-metal-oxide model/i);
});

test('sodium oxide and sulfur trioxide yield catalog-backed sodium sulfate', () => {
  const rule = supportedReaction(['Na2O', 'SO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'sodium-oxide-sulfur-trioxide');
  assert.deepEqual(rule?.reactantStoichiometry, { Na2O:1, SO3:1 });
  assert.deepEqual(rule?.productStoichiometry, { Na2SO4:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['Na2O', 'SO3', 'Na2SO4']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational oxide-absorption model/i);
});

test('potassium oxide and sulfur trioxide yield catalog-backed potassium sulfate', () => {
  const rule = supportedReaction(['K2O', 'SO3'], { temperatureK:293, pressureAtm:1 });
  assert.equal(rule?.id, 'potassium-oxide-sulfur-trioxide');
  assert.deepEqual(rule?.reactantStoichiometry, { K2O:1, SO3:1 });
  assert.deepEqual(rule?.productStoichiometry, { K2SO4:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['K2O', 'SO3', 'K2SO4']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational oxide-absorption model/i);
});

test('calcium sulfite decomposes into catalog-backed calcium oxide and sulfur dioxide only when strongly heated', () => {
  assert.equal(supportedUnaryReaction('CaSO3', { temperatureK:500, pressureAtm:1 }), null);
  const rule = supportedUnaryReaction('CaSO3', { temperatureK:750, pressureAtm:1 });
  assert.equal(rule?.id, 'calcium-sulfite-decomposition');
  assert.deepEqual(rule?.reactantStoichiometry, { CaSO3:1 });
  assert.deepEqual(rule?.productStoichiometry, { CaO:1, SO2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['CaSO3', 'CaO', 'SO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational thermal decomposition model/i);
});

test('magnesium sulfite decomposes into catalog-backed magnesium oxide and sulfur dioxide only when strongly heated', () => {
  assert.equal(supportedUnaryReaction('MgSO3', { temperatureK:500, pressureAtm:1 }), null);
  const rule = supportedUnaryReaction('MgSO3', { temperatureK:750, pressureAtm:1 });
  assert.equal(rule?.id, 'magnesium-sulfite-decomposition');
  assert.deepEqual(rule?.reactantStoichiometry, { MgSO3:1 });
  assert.deepEqual(rule?.productStoichiometry, { MgO:1, SO2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['MgSO3', 'MgO', 'SO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational thermal decomposition model/i);
});

test('barium carbonate decomposes into catalog-backed barium oxide and carbon dioxide only when strongly heated', () => {
  assert.equal(supportedUnaryReaction('BaCO3', { temperatureK:500, pressureAtm:1 }), null);
  const rule = supportedUnaryReaction('BaCO3', { temperatureK:750, pressureAtm:1 });
  assert.equal(rule?.id, 'barium-carbonate-decomposition');
  assert.deepEqual(rule?.reactantStoichiometry, { BaCO3:1 });
  assert.deepEqual(rule?.productStoichiometry, { BaO:1, CO2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['BaCO3', 'BaO', 'CO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational thermal decomposition model/i);
});

test('iron(II) carbonate decomposes into catalog-backed iron(II) oxide and carbon dioxide only when strongly heated', () => {
  assert.equal(supportedUnaryReaction('FeCO3', { temperatureK:500, pressureAtm:1 }), null);
  const rule = supportedUnaryReaction('FeCO3', { temperatureK:750, pressureAtm:1 });
  assert.equal(rule?.id, 'iron-ii-carbonate-decomposition');
  assert.deepEqual(rule?.reactantStoichiometry, { FeCO3:1 });
  assert.deepEqual(rule?.productStoichiometry, { FeO:1, CO2:1 });
  const spawnableIds = new Set(COMPOUNDS.map((compound) => compound.id));
  for (const id of ['FeCO3', 'FeO', 'CO2']) assert.equal(spawnableIds.has(id), true, `${id} must be spawnable`);
  assert.match(rule?.limitations || '', /educational thermal decomposition model/i);
});
