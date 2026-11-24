// Curated, offline chemistry registry for an educational sandbox. Rules are
// simplified simulation events, not laboratory predictions or instructions.
export function screenToWorld(point, camera) {
  return { x: (point.x - camera.x) / camera.zoom, y: (point.y - camera.y) / camera.zoom };
}

const REF = 'OpenStax Chemistry 2e, Ch. 4: Stoichiometry of Chemical Reactions';
const subscriptMap = { '₀':'0','₁':'1','₂':'2','₃':'3','₄':'4','₅':'5','₆':'6','₇':'7','₈':'8','₉':'9' };

function compound(id, name, formula, category, state, options = {}) {
  return { id, name, formula, formulaAscii:options.formulaAscii || formula, category, state, density:options.density ?? null, color:options.color || '#dbeafe', description:options.description || `${name} is available for curated educational simulation rules.`, ...options };
}

export const COMPOUNDS = [
  compound('H2O','Water','H₂O','Common liquids','liquid',{formulaAscii:'H2O',density:1,meltingPoint:273.15,boilingPoint:373.15,color:'#49baff',miscibleGroup:'polar'}),
  compound('C2H5OH','Ethanol','C₂H₅OH','Common liquids','liquid',{formulaAscii:'C2H5OH',density:.789,meltingPoint:159,boilingPoint:351.5,color:'#c9f0ff',miscibleGroup:'polar'}),
  compound('HCl','Hydrochloric acid','HCl','Acids and bases','liquid',{density:1.18,color:'#dff7ff',miscibleGroup:'polar'}),
  compound('H2SO4','Sulfuric acid','H₂SO₄','Acids and bases','liquid',{formulaAscii:'H2SO4',miscibleGroup:'polar'}),
  compound('HNO3','Nitric acid','HNO₃','Acids and bases','liquid',{formulaAscii:'HNO3',miscibleGroup:'polar'}),
  compound('CH3COOH','Ethanoic acid','CH₃COOH','Organic chemistry','liquid',{formulaAscii:'CH3COOH',miscibleGroup:'polar'}),
  compound('NaOH','Sodium hydroxide','NaOH','Acids and bases','solid',{density:2.13,color:'#e9f7ff'}),
  compound('KOH','Potassium hydroxide','KOH','Acids and bases','solid'),
  compound('NH3','Ammonia','NH₃','Common compounds','gas',{formulaAscii:'NH3',density:.000771,color:'#c1f5d0'}),
  compound('NH4Cl','Ammonium chloride','NH₄Cl','Salts','solid',{formulaAscii:'NH4Cl'}),
  compound('O2','Oxygen','O₂','Atmospheric gases','gas',{formulaAscii:'O2',density:.001429,color:'#89e8ff'}),
  compound('N2','Nitrogen','N₂','Atmospheric gases','gas',{formulaAscii:'N2',density:.001251,color:'#a6bcff'}),
  compound('H2','Hydrogen','H₂','Reaction products','gas',{formulaAscii:'H2',density:.0000899,color:'#e8fbff'}),
  compound('CO2','Carbon dioxide','CO₂','Atmospheric gases','gas',{formulaAscii:'CO2',density:.001977,color:'#b9d2df'}),
  compound('CO','Carbon monoxide','CO','Atmospheric gases','gas'),
  compound('CH4','Methane','CH₄','Common compounds','gas',{formulaAscii:'CH4',density:.000657,color:'#d8eff5'}),
  compound('C2H4','Ethene','C₂H₄','Organic chemistry','gas',{formulaAscii:'C2H4'}),
  compound('C2H6','Ethane','C₂H₆','Organic chemistry','gas',{formulaAscii:'C2H6'}),
  compound('C6H12O6','Glucose','C₆H₁₂O₆','Biochemistry-inspired','solid',{formulaAscii:'C6H12O6'}),
  compound('CH3COOC2H5','Ethyl ethanoate','CH₃COOC₂H₅','Organic chemistry','liquid',{formulaAscii:'CH3COOC2H5',miscibleGroup:'organic'}),
  compound('NaCl','Sodium chloride','NaCl','Salts','solid',{density:2.16,color:'#f1f4ff',form:'crystal'}),
  compound('NaCl_aq','Sodium chloride solution','NaCl(aq)','Mixtures and solutions','liquid',{formulaAscii:'NaCl',density:1.04,color:'#91d9ff',miscibleGroup:'polar'}),
  compound('NaHCO3','Sodium bicarbonate','NaHCO₃','Salts','solid',{formulaAscii:'NaHCO3',density:2.2,color:'#f5f6f0'}),
  compound('Na2CO3','Sodium carbonate','Na₂CO₃','Salts','solid',{formulaAscii:'Na2CO3'}),
  compound('Na2SO4','Sodium sulfate','Na₂SO₄','Salts','solid',{formulaAscii:'Na2SO4'}),
  compound('NaNO3','Sodium nitrate','NaNO₃','Salts','solid',{formulaAscii:'NaNO3'}),
  compound('KNO3','Potassium nitrate','KNO₃','Salts','solid',{formulaAscii:'KNO3'}),
  compound('KI','Potassium iodide','KI','Salts','solid'),
  compound('KCl','Potassium chloride','KCl','Salts','solid'),
  compound('KClO3','Potassium chlorate','KClO₃','Salts','solid',{formulaAscii:'KClO3'}),
  compound('CaCO3','Calcium carbonate','CaCO₃','Minerals','solid',{formulaAscii:'CaCO3',density:2.71,color:'#f1ebcf',form:'powder'}),
  compound('CaO','Calcium oxide','CaO','Oxides','solid'),
  compound('CaCl2','Calcium chloride','CaCl₂','Salts','solid',{formulaAscii:'CaCl2'}),
  compound('BaCl2','Barium chloride','BaCl₂','Salts','solid',{formulaAscii:'BaCl2'}),
  compound('BaSO4','Barium sulfate','BaSO₄','Reaction products','solid',{formulaAscii:'BaSO4',form:'powder'}),
  compound('AgNO3','Silver nitrate','AgNO₃','Salts','solid',{formulaAscii:'AgNO3',density:4.35,color:'#ebeff8'}),
  compound('AgCl','Silver chloride','AgCl','Reaction products','solid',{density:5.56,color:'#f9f8e9'}),
  compound('PbNO32','Lead(II) nitrate','Pb(NO₃)₂','Salts','solid',{formulaAscii:'Pb(NO3)2'}),
  compound('PbI2','Lead(II) iodide','PbI₂','Reaction products','solid',{formulaAscii:'PbI2',color:'#f1cf49'}),
  compound('CuSO4','Copper(II) sulfate','CuSO₄','Salts','solid',{formulaAscii:'CuSO4',density:3.6,color:'#4f9dff'}),
  compound('CuOH2','Copper(II) hydroxide','Cu(OH)₂','Reaction products','solid',{formulaAscii:'Cu(OH)2',color:'#70b6ed'}),
  compound('CuO','Copper(II) oxide','CuO','Oxides','solid'),
  compound('CuCl2','Copper(II) chloride','CuCl₂','Salts','solid',{formulaAscii:'CuCl2'}),
  compound('FeSO4','Iron(II) sulfate','FeSO₄','Reaction products','solid',{formulaAscii:'FeSO4'}),
  compound('Fe2O3','Iron(III) oxide','Fe₂O₃','Oxides','solid',{formulaAscii:'Fe2O3'}),
  compound('FeCl3','Iron(III) chloride','FeCl₃','Salts','solid',{formulaAscii:'FeCl3'}),
  compound('FeOH3','Iron(III) hydroxide','Fe(OH)₃','Reaction products','solid',{formulaAscii:'Fe(OH)3',form:'powder'}),
  compound('ZnCl2','Zinc chloride','ZnCl₂','Reaction products','solid',{formulaAscii:'ZnCl2'}),
  compound('ZnSO4','Zinc sulfate','ZnSO₄','Reaction products','solid',{formulaAscii:'ZnSO4'}),
  compound('MgO','Magnesium oxide','MgO','Oxides','solid'),
  compound('MgCl2','Magnesium chloride','MgCl₂','Salts','solid',{formulaAscii:'MgCl2'}),
  compound('AlCl3','Aluminium chloride','AlCl₃','Salts','solid',{formulaAscii:'AlCl3'}),
  compound('H2O2','Hydrogen peroxide','H₂O₂','Common compounds','liquid',{formulaAscii:'H2O2',miscibleGroup:'polar'}),
  compound('SO2','Sulfur dioxide','SO₂','Sulfur chemistry','gas',{formulaAscii:'SO2'}),
  compound('H2SO3','Sulfurous acid','H₂SO₃','Sulfur chemistry','liquid',{formulaAscii:'H2SO3',miscibleGroup:'polar'}),
  compound('SiO2','Silicon dioxide','SiO₂','Silicon chemistry','solid',{formulaAscii:'SiO2'}),
  compound('Si','Silicon','Si','Elements and materials','solid')
];

const MATERIAL_OVERRIDES = { H2O:{representation:'liquid',viscosity:.90,miscibleGroup:'polar',dropletCount:5}, C2H5OH:{representation:'liquid',viscosity:1.07,miscibleGroup:'polar',dropletCount:5}, HCl:{representation:'liquid',viscosity:1.05,miscibleGroup:'polar',dropletCount:5}, NaCl:{representation:'crystal',friction:.55,restitution:.13}, CaCO3:{representation:'powder',friction:.78,restitution:.04}, CO2:{representation:'gas-cloud',diffusion:1.2}, H2:{representation:'gas-cloud',diffusion:2.4}, NH3:{representation:'gas-cloud',diffusion:1.8}, O2:{representation:'gas-cloud',diffusion:1.1}, N2:{representation:'gas-cloud',diffusion:1.15} };
export function materialProfile(material) {
  const state = material.state || 'solid';
  const defaults = state === 'gas' ? {representation:'gas-cloud',viscosity:.05,friction:.01,restitution:.45,diffusion:1,buoyancy:1,dropletCount:4} : state === 'liquid' ? {representation:'liquid',viscosity:1,friction:.08,restitution:.04,dropletCount:5,miscibleGroup:material.miscibleGroup || null} : {representation:material.form === 'powder' ? 'powder' : material.form === 'crystal' ? 'crystal' : 'solid-chunk',viscosity:0,friction:.42,restitution:.2,dropletCount:1};
  return { state, density:Number(material.density) || null, ...defaults, ...(MATERIAL_OVERRIDES[material.id] || {}) };
}

const ordinary = ({temperatureK=293}) => temperatureK >= 260 && temperatureK <= 500;
const heated = ({temperatureK=293}) => temperatureK >= 450;
const stronglyHeated = ({temperatureK=293}) => temperatureK >= 700;
const pressurized = ({temperatureK=293,pressureAtm=1}) => temperatureK >= 450 && pressureAtm >= 5;
function rule(id, category, reactantStoichiometry, productStoichiometry, equation, options = {}) {
  return { id, name:options.name || id.replaceAll('-',' '), category, reactantStoichiometry, productStoichiometry, reactants:Object.keys(reactantStoichiometry), products:Object.keys(productStoichiometry), equation, temperatureDeltaK:options.temperatureDeltaK ?? 0, observable:options.observable || 'a tracked product transformation', explanation:options.explanation || `A curated, educational ${category} simulation event.`, reference:options.reference || REF, validation:'balanced', modes:options.modes || ['normal','quantum'], preserveReactants:options.preserveReactants || {}, condition:options.condition || ordinary, limitations:options.limitations || 'Rule-based educational approximation; no laboratory prediction is implied.' };
}

export const REACTION_RULES = [
  rule('sodium-water','water reaction',{Na:2,H2O:2},{NaOH:2,H2:1},'2Na + 2H₂O → 2NaOH + H₂↑',{temperatureDeltaK:20,observable:'heat and hydrogen gas marker'}),
  rule('hcl-naoh','neutralization',{HCl:1,NaOH:1},{NaCl:1,H2O:1},'HCl + NaOH → NaCl + H₂O',{temperatureDeltaK:8}),
  rule('h2so4-naoh','neutralization',{H2SO4:1,NaOH:2},{Na2SO4:1,H2O:2},'H₂SO₄ + 2NaOH → Na₂SO₄ + 2H₂O',{temperatureDeltaK:10}),
  rule('hno3-koh','neutralization',{HNO3:1,KOH:1},{KNO3:1,H2O:1},'HNO₃ + KOH → KNO₃ + H₂O',{temperatureDeltaK:7}),
  rule('hcl-ammonia','acid-base',{HCl:1,NH3:1},{NH4Cl:1},'HCl + NH₃ → NH₄Cl',{observable:'ammonium salt marker'}),
  rule('hcl-sodium-bicarbonate','gas formation',{HCl:1,NaHCO3:1},{NaCl:1,H2O:1,CO2:1},'NaHCO₃ + HCl → NaCl + H₂O + CO₂↑',{temperatureDeltaK:-2}),
  rule('hcl-sodium-carbonate','gas formation',{HCl:2,Na2CO3:1},{NaCl:2,H2O:1,CO2:1},'Na₂CO₃ + 2HCl → 2NaCl + H₂O + CO₂↑',{temperatureDeltaK:-2}),
  rule('hcl-calcium-carbonate','gas formation',{CaCO3:1,HCl:2},{CaCl2:1,H2O:1,CO2:1},'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑',{temperatureDeltaK:-3}),
  rule('silver-chloride-precipitate','precipitation',{AgNO3:1,NaCl:1},{AgCl:1,NaNO3:1},'AgNO₃ + NaCl → AgCl↓ + NaNO₃',{observable:'pale precipitate marker'}),
  rule('barium-sulfate-precipitate','precipitation',{BaCl2:1,Na2SO4:1},{BaSO4:1,NaCl:2},'BaCl₂ + Na₂SO₄ → BaSO₄↓ + 2NaCl',{observable:'white precipitate marker'}),
  rule('lead-iodide-precipitate','precipitation',{PbNO32:1,KI:2},{PbI2:1,KNO3:2},'Pb(NO₃)₂ + 2KI → PbI₂↓ + 2KNO₃',{observable:'yellow precipitate marker'}),
  rule('calcium-carbonate-precipitate','precipitation',{CaCl2:1,Na2CO3:1},{CaCO3:1,NaCl:2},'CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl',{observable:'calcium carbonate precipitate marker'}),
  rule('copper-hydroxide-precipitate','precipitation',{CuSO4:1,NaOH:2},{CuOH2:1,Na2SO4:1},'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄',{observable:'blue precipitate marker'}),
  rule('iron-hydroxide-precipitate','precipitation',{FeCl3:1,NaOH:3},{FeOH3:1,NaCl:3},'FeCl₃ + 3NaOH → Fe(OH)₃↓ + 3NaCl',{observable:'brown precipitate marker'}),
  rule('iron-copper-displacement','displacement',{Fe:1,CuSO4:1},{FeSO4:1,Cu:1},'Fe + CuSO₄ → FeSO₄ + Cu',{temperatureDeltaK:1}),
  rule('zinc-copper-displacement','displacement',{Zn:1,CuSO4:1},{ZnSO4:1,Cu:1},'Zn + CuSO₄ → ZnSO₄ + Cu',{temperatureDeltaK:1}),
  rule('zinc-acid-displacement','displacement',{Zn:1,HCl:2},{ZnCl2:1,H2:1},'Zn + 2HCl → ZnCl₂ + H₂↑',{temperatureDeltaK:5}),
  rule('magnesium-acid-displacement','displacement',{Mg:1,HCl:2},{MgCl2:1,H2:1},'Mg + 2HCl → MgCl₂ + H₂↑',{temperatureDeltaK:7}),
  rule('aluminium-acid-displacement','displacement',{Al:2,HCl:6},{AlCl3:2,H2:3},'2Al + 6HCl → 2AlCl₃ + 3H₂↑',{temperatureDeltaK:9}),
  rule('copper-oxide-acid','acid-metal-oxide',{CuO:1,HCl:2},{CuCl2:1,H2O:1},'CuO + 2HCl → CuCl₂ + H₂O'),
  rule('methane-combustion','combustion',{CH4:1,O2:2},{CO2:1,H2O:2},'CH₄ + 2O₂ → CO₂ + 2H₂O',{condition:heated,temperatureDeltaK:35,observable:'heat and carbon dioxide marker'}),
  rule('ethanol-combustion','combustion',{C2H5OH:1,O2:3},{CO2:2,H2O:3},'C₂H₅OH + 3O₂ → 2CO₂ + 3H₂O',{condition:heated,temperatureDeltaK:35}),
  rule('hydrogen-combustion','synthesis',{H2:2,O2:1},{H2O:2},'2H₂ + O₂ → 2H₂O',{condition:heated,temperatureDeltaK:30}),
  rule('magnesium-oxidation','oxidation',{Mg:2,O2:1},{MgO:2},'2Mg + O₂ → 2MgO',{condition:heated,temperatureDeltaK:25}),
  rule('iron-oxidation','corrosion',{Fe:4,O2:3},{Fe2O3:2},'4Fe + 3O₂ → 2Fe₂O₃',{condition:heated,temperatureDeltaK:6}),
  rule('sulfur-oxidation','oxidation',{S:1,O2:1},{SO2:1},'S + O₂ → SO₂',{condition:heated,temperatureDeltaK:16}),
  rule('sulfur-dioxide-hydration','hydrolysis',{SO2:1,H2O:1},{H2SO3:1},'SO₂ + H₂O → H₂SO₃'),
  rule('limestone-decomposition','decomposition',{CaCO3:1},{CaO:1,CO2:1},'CaCO₃ → CaO + CO₂↑',{condition:stronglyHeated,temperatureDeltaK:-15}),
  rule('peroxide-decomposition','decomposition',{H2O2:2},{H2O:2,O2:1},'2H₂O₂ → 2H₂O + O₂↑',{observable:'oxygen gas marker'}),
  rule('chlorate-decomposition','decomposition',{KClO3:2},{KCl:2,O2:3},'2KClO₃ → 2KCl + 3O₂↑',{condition:stronglyHeated,temperatureDeltaK:-20}),
  rule('water-gas-reduction','reduction',{Fe2O3:1,CO:3},{Fe:2,CO2:3},'Fe₂O₃ + 3CO → 2Fe + 3CO₂',{condition:stronglyHeated,temperatureDeltaK:-8}),
  rule('ethene-hydrogenation','addition',{C2H4:1,H2:1},{C2H6:1},'C₂H₄ + H₂ → C₂H₆',{condition:heated,temperatureDeltaK:6}),
  rule('ethene-hydration','addition',{C2H4:1,H2O:1},{C2H5OH:1},'C₂H₄ + H₂O → C₂H₅OH',{condition:heated,temperatureDeltaK:2}),
  rule('esterification','condensation',{CH3COOH:1,C2H5OH:1},{CH3COOC2H5:1,H2O:1},'CH₃COOH + C₂H₅OH → CH₃COOC₂H₅ + H₂O',{condition:heated,temperatureDeltaK:1}),
  rule('glucose-fermentation','biochemistry-inspired',{C6H12O6:1},{C2H5OH:2,CO2:2},'C₆H₁₂O₆ → 2C₂H₅OH + 2CO₂↑',{condition:ordinary,temperatureDeltaK:1}),
  rule('ammonia-synthesis','synthesis',{N2:1,H2:3},{NH3:2},'N₂ + 3H₂ → 2NH₃',{condition:pressurized,temperatureDeltaK:12,limitations:'Virtual high-pressure synthesis representation; no real-world procedure is modeled.'}),
  rule('silica-reduction','reduction',{SiO2:1,C:2},{Si:1,CO:2},'SiO₂ + 2C → Si + 2CO',{condition:stronglyHeated,temperatureDeltaK:-12}),
  rule('salt-dissolution','dissolution',{NaCl:1,H2O:1},{NaCl_aq:1},'NaCl(s) → Na⁺(aq) + Cl⁻(aq)',{preserveReactants:{H2O:1},observable:'dissolved-solute marker in water',limitations:'Carrier water is preserved in the simulation ledger.'})
];

function normalizeFormula(formula) {
  return [...formula].map(char => subscriptMap[char] || char).join('').replace(/\((aq|s|l|g)\)/gi,'');
}
export function parseFormula(formula) {
  const source = normalizeFormula(formula);
  let index = 0;
  const readNumber = () => { let digits=''; while(/\d/.test(source[index] || '')) digits += source[index++]; return digits ? Number(digits) : 1; };
  const group = (untilParen=false) => { const atoms={}; while(index < source.length) { const char=source[index]; if(char === ')') { if(!untilParen) throw new Error(`Unexpected ) in ${formula}`); index++; break; } if(char === '(') { index++; const nested=group(true); const amount=readNumber(); for(const [element,count] of Object.entries(nested)) atoms[element]=(atoms[element]||0)+count*amount; continue; } if(!/[A-Z]/.test(char)) throw new Error(`Invalid formula ${formula}`); let element=source[index++]; while(/[a-z]/.test(source[index] || '')) element += source[index++]; atoms[element]=(atoms[element]||0)+readNumber(); } return atoms; };
  const atoms = group();
  if(index !== source.length) throw new Error(`Unparsed formula ${formula}`);
  return atoms;
}
function formulaFor(id) { return COMPOUNDS.find(item => item.id === id)?.formulaAscii || id; }
function sumAtoms(stoichiometry) {
  const total={};
  for(const [id,coefficient] of Object.entries(stoichiometry)) for(const [element,count] of Object.entries(parseFormula(formulaFor(id)))) total[element]=(total[element]||0)+count*coefficient;
  return total;
}
function sameAtoms(left,right) { const elements=new Set([...Object.keys(left),...Object.keys(right)]); return [...elements].every(element => left[element] === right[element]); }
export function validateReactionRegistry() {
  const errors=[]; const ids=new Set();
  for(const reaction of REACTION_RULES) {
    if(ids.has(reaction.id)) errors.push(`Duplicate reaction id: ${reaction.id}`); ids.add(reaction.id);
    if(!reaction.reference || reaction.validation !== 'balanced') errors.push(`Unvalidated reaction: ${reaction.id}`);
    const outputs={...reaction.productStoichiometry};
    for(const [id,coefficient] of Object.entries(reaction.preserveReactants || {})) outputs[id]=(outputs[id]||0)+coefficient;
    try { if(!sameAtoms(sumAtoms(reaction.reactantStoichiometry),sumAtoms(outputs))) errors.push(`Atom imbalance: ${reaction.id}`); } catch(error) { errors.push(`${reaction.id}: ${error.message}`); }
  }
  return { valid:errors.length===0, errors };
}
export function reactionCoverage() {
  const families=[...new Set(REACTION_RULES.map(rule => rule.category))].sort();
  return { total:REACTION_RULES.length, validated:REACTION_RULES.filter(rule => rule.validation === 'balanced').length, normalMode:REACTION_RULES.filter(rule => rule.modes.includes('normal')).length, quantumMode:REACTION_RULES.filter(rule => rule.modes.includes('quantum')).length, families, incomplete:REACTION_RULES.filter(rule => rule.validation !== 'balanced').length };
}
const reactionIndex = new Map();
for (const reaction of REACTION_RULES) {
  const key = [...reaction.reactants].sort().join('|');
  if (!reactionIndex.has(key)) reactionIndex.set(key, []);
  reactionIndex.get(key).push(reaction);
}
export function supportedReaction(symbols, conditions = {}) {
  const key = [...symbols].sort().join('|');
  return (reactionIndex.get(key) || []).find(candidate => candidate.condition(conditions)) || null;
}
export function supportedUnaryReaction(symbol, conditions = {}) {
  return (reactionIndex.get(symbol) || []).find(candidate => candidate.reactants.length === 1 && candidate.condition(conditions)) || null;
}
