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

test('participant matching requires three distinct nearby bodies for a three-reactant rule', () => {
  const bodies = [
    { id:'ethene-body', position:{x:0,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{C2H4:1}}}} },
    { id:'water-body', position:{x:22,y:4}, plugin:{sample:{temperatureK:480, ledger:{components:{H2O:2}}}} },
    { id:'acid-body', position:{x:38,y:0}, plugin:{sample:{temperatureK:480, ledger:{components:{H2SO4:1}}}} }
  ];
  const match = findReactionParticipantBodies(bodies, { temperatureK:480, pressureAtm:1 });
  assert.equal(match?.rule.id, 'ethene-hydration-acid-catalyzed');
  assert.deepEqual(match?.participants.map(({ body, materialId }) => [body.id, materialId]), [
    ['ethene-body', 'C2H4'], ['water-body', 'H2O'], ['acid-body', 'H2SO4']
  ]);
});
