import test from 'node:test';
import assert from 'node:assert/strict';
import { REACTION_RULES } from '../chemistry.js';
import { findReactionParticipantBodies, planReaction } from '../reaction-engine.js';

const byId = (id) => REACTION_RULES.find((rule) => rule.id === id);

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
