import test from 'node:test';
import assert from 'node:assert/strict';
import { REACTION_RULES } from '../chemistry.js';
import { allocateCompactParticipants, candidateRulesForComponents, findReactionParticipantBodies, indexBodiesByComponent, planReaction, rankComponentSourcesByAnchor, spatialNeighborPairs } from '../reaction-engine.js';

const byId = (id) => REACTION_RULES.find((rule) => rule.id === id);

test('candidate rule lookup retains only multi-body rules whose complete reactant set is local', () => {
  assert.deepEqual(candidateRulesForComponents(new Set(['HCl', 'NaOH'])).map(({ id }) => id), ['hcl-naoh']);
});

test('component index retains only bodies that supply each positive material amount', () => {
  const bodies = [
    { id:'acid', plugin:{sample:{ledger:{components:{HCl:1, H2O:0}}}} },
    { id:'base', plugin:{sample:{ledger:{components:{NaOH:1, HCl:-1}}}} },
    { id:'empty', plugin:{sample:{ledger:{components:{HCl:0}}}} }
  ];
  const index = indexBodiesByComponent(bodies);
  assert.deepEqual([...index.entries()].map(([id, sources]) => [id, sources.map(({ id: bodyId }) => bodyId)]), [
    ['HCl', ['acid']],
    ['NaOH', ['base']]
  ]);
});

test('component source ranking orders each material index once by proximity to an anchor', () => {
  const acidNear = { id:'acid-near', position:{x:2,y:0} };
  const acidFar = { id:'acid-far', position:{x:20,y:0} };
  const baseNear = { id:'base-near', position:{x:4,y:0} };
  const ranked = rankComponentSourcesByAnchor({ position:{x:0, y:0} }, new Map([
    ['HCl', [acidFar, acidNear]],
    ['NaOH', [baseNear]]
  ]));
  assert.deepEqual([...ranked.entries()].map(([id, sources]) => [id, sources.map(source => source.id)]), [
    ['HCl', ['acid-near', 'acid-far']],
    ['NaOH', ['base-near']]
  ]);
});

test('component source ranking reuses a supplied anchor cache during one reaction scan', () => {
  const anchor = { position:{x:0, y:0} };
  const cache = new Map();
  const sources = new Map([['HCl', [{ id:'acid', position:{x:2,y:0} }]]]);
  const first = rankComponentSourcesByAnchor(anchor, sources, cache);
  const second = rankComponentSourcesByAnchor(anchor, sources, cache);
  assert.strictEqual(second, first);
});

test('component source ranking only sorts materials required by the feasible rule', () => {
  const anchor = { position:{x:0, y:0} };
  const sources = new Map([
    ['HCl', [{ id:'acid-far', position:{x:20,y:0} }, { id:'acid-near', position:{x:2,y:0} }]],
    ['NaOH', [{ id:'base', position:{x:4,y:0} }]],
    ['H2SO4', [{ id:'catalyst', position:{x:6,y:0} }]]
  ]);
  const ranked = rankComponentSourcesByAnchor(anchor, sources, new Map(), ['HCl', 'NaOH']);
  assert.deepEqual([...ranked.entries()].map(([id, bodies]) => [id, bodies.map(({ id: bodyId }) => bodyId)]), [
    ['HCl', ['acid-near', 'acid-far']],
    ['NaOH', ['base']]
  ]);
});

test('spatial neighbor pruning yields each nearby candidate pair once across grid boundaries', () => {
  const bodies = [
    { id:'left', position:{x:71,y:0} },
    { id:'right', position:{x:73,y:0} },
    { id:'nearby', position:{x:140,y:0} },
    { id:'distant', position:{x:300,y:0} }
  ];
  assert.deepEqual(spatialNeighborPairs(bodies, 72).map(([left, right]) => [left.id, right.id]), [
    ['left', 'right'],
    ['left', 'nearby'],
    ['right', 'nearby']
  ]);
});

test('compact participant allocation selects one shared local source group for multi-reactant rules', () => {
  const bodies = [
    { id:'left-acid', position:{x:0,y:0}, plugin:{sample:{ledger:{components:{HCl:1}}}} },
    { id:'left-base', position:{x:4,y:0}, plugin:{sample:{ledger:{components:{NaOH:1}}}} },
    { id:'left-catalyst', position:{x:8,y:0}, plugin:{sample:{ledger:{components:{H2SO4:1}}}} },
    { id:'right-acid', position:{x:100,y:0}, plugin:{sample:{ledger:{components:{HCl:1}}}} },
    { id:'right-base', position:{x:104,y:0}, plugin:{sample:{ledger:{components:{NaOH:1}}}} },
    { id:'right-catalyst', position:{x:108,y:0}, plugin:{sample:{ledger:{components:{H2SO4:1}}}} }
  ];
  const participants = allocateCompactParticipants(bodies, { HCl:1, NaOH:1, H2SO4:1 }, 1, { H2SO4:1 });
  assert.deepEqual(participants?.map(({ body, consumptions }) => [body.id, consumptions]), [
    ['left-acid', { HCl:1 }], ['left-base', { NaOH:1 }], ['left-catalyst', { H2SO4:0 }]
  ]);
});

test('reaction plan applies stoichiometric coefficients and leaves excess reactant', () => {
  const plan = planReaction(byId('sodium-water'), { Na:3, H2O:10 });
  assert.equal(plan.extent, 1.5);
  assert.deepEqual(plan.remaining, { Na:0, H2O:7 });
  assert.deepEqual(plan.products, { NaOH:3, H2:1.5 });
});

test('reaction plan respects a preserved carrier for the dissolution model', () => {
  const plan = planReaction(byId('salt-dissolution'), { NaCl:2, H2O:5 });
  assert.equal(plan.extent, 2);
  assert.deepEqual(plan.remaining, { NaCl:0, H2O:5 });
  assert.deepEqual(plan.products, { NaCl_aq:2 });
});

test('reaction plan rejects missing or insufficient named reactants', () => {
  assert.equal(planReaction(byId('hcl-naoh'), { HCl:1 }).extent, 0);
});

test('participant matching schedules three-reactant rules across distinct nearby bodies', () => {
  const bodies = [
    { id:'ethene-body', position:{x:0,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{C2H4:1}}}} },
    { id:'water-body', position:{x:22,y:4}, plugin:{sample:{temperatureK:480, ledger:{components:{H2O:2}}}} },
    { id:'acid-body', position:{x:38,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{H2SO4:1}}}} }
  ];
  const match = findReactionParticipantBodies(bodies, { temperatureK:480, pressureAtm:1 });
  assert.equal(match?.rule.id, 'ethene-hydration-acid-catalyzed');
  assert.equal(match?.extent, 1);
  assert.deepEqual(match?.participants.map(({ body, consumptions }) => [body.id, consumptions]), [
    ['ethene-body', { C2H4:1 }], ['water-body', { H2O:1 }], ['acid-body', { H2SO4:0 }]
  ]);
});

test('participant scheduling prefers a complete catalyst-aware rule over a less-specific rule', () => {
  const bodies = [
    { id:'ethene', position:{x:0,y:0}, plugin:{sample:{ledger:{components:{C2H4:1}}}} },
    { id:'water', position:{x:18,y:0}, plugin:{sample:{ledger:{components:{H2O:1}}}} },
    { id:'catalyst', position:{x:36,y:0}, plugin:{sample:{ledger:{components:{H2SO4:1}}}} }
  ];
  const match = findReactionParticipantBodies(bodies, { temperatureK:480, pressureAtm:5 });
  assert.equal(match?.rule.id, 'ethene-hydration-acid-catalyzed');
  assert.deepEqual(match?.participants.map(({ body, consumptions }) => [body.id, consumptions]), [
    ['ethene', { C2H4:1 }], ['water', { H2O:1 }], ['catalyst', { H2SO4:0 }]
  ]);
});

test('participant scheduling consumes a reactant identity across multiple nearby bodies', () => {
  const bodies = [
    { id:'acid-first', position:{x:0,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{CH3COOH:.25}}}} },
    { id:'acid-second', position:{x:12,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{CH3COOH:.75}}}} },
    { id:'ethanol', position:{x:25,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{C2H5OH:1}}}} },
    { id:'catalyst', position:{x:38,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{H2SO4:1}}}} }
  ];
  const match = findReactionParticipantBodies(bodies, { temperatureK:480, pressureAtm:1 });
  assert.equal(match?.rule.id, 'esterification-acid-catalyzed');
  assert.equal(match?.extent, 1);
  assert.deepEqual(match?.participants.map(({ body, consumptions }) => [body.id, consumptions]).sort(([left], [right]) => left.localeCompare(right)), [
    ['acid-first', { CH3COOH:.25 }], ['acid-second', { CH3COOH:.75 }], ['catalyst', { H2SO4:0 }], ['ethanol', { C2H5OH:1 }]
  ]);
});

test('participant scheduling can combine binary reactants distributed over nearby bodies', () => {
  const bodies = [
    { id:'acid-first', position:{x:0,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{HCl:1}}}} },
    { id:'acid-second', position:{x:14,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{HCl:1}}}} },
    { id:'carbonate', position:{x:28,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{Na2CO3:1}}}} }
  ];
  const match = findReactionParticipantBodies(bodies, { temperatureK:293, pressureAtm:1 });
  assert.equal(match?.rule.id, 'hcl-sodium-carbonate');
  assert.equal(match?.extent, 1);
  assert.deepEqual(match?.participants.map(({ body, consumptions }) => [body.id, consumptions]).sort(([left], [right]) => left.localeCompare(right)), [
    ['acid-first', { HCl:1 }], ['acid-second', { HCl:1 }], ['carbonate', { Na2CO3:1 }]
  ]);
});

test('participant scheduling ignores isolated contributors and uses one connected local cluster', () => {
  const bodies = [
    { id:'acid-local', position:{x:0,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{HCl:1}}}} },
    { id:'carbonate-local', position:{x:28,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{Na2CO3:1}}}} },
    { id:'acid-isolated', position:{x:180,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{HCl:1}}}} }
  ];
  const match = findReactionParticipantBodies(bodies, { temperatureK:293, pressureAtm:1 });
  assert.equal(match?.rule.id, 'hcl-sodium-carbonate');
  assert.equal(match?.extent, .5);
  assert.deepEqual(match?.participants.map(({ body }) => body.id), ['acid-local', 'carbonate-local']);
});

test('participant scheduling allocates distributed reactants nearest to their local partners', () => {
  const bodies = [
    { id:'acid-far', position:{x:0,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{HCl:1}}}} },
    { id:'carbonate', position:{x:50,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{Na2CO3:.5}}}} },
    { id:'acid-near', position:{x:36,y:0}, plugin:{sample:{temperatureK:293, ledger:{components:{HCl:1}}}} }
  ];
  const match = findReactionParticipantBodies(bodies, { temperatureK:293, pressureAtm:1 });
  assert.equal(match?.rule.id, 'hcl-sodium-carbonate');
  assert.equal(match?.extent, .5);
  assert.deepEqual(match?.participants.map(({ body, consumptions }) => [body.id, consumptions]), [
    ['acid-near', { HCl:1 }], ['carbonate', { Na2CO3:.5 }]
  ]);
});
