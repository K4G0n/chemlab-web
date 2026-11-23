// Chemistry data and rules for the browser sandbox. These are curated educational
// approximations, not a substitute for laboratory prediction or procedures.
export function screenToWorld(point, camera) {
  return { x: (point.x - camera.x) / camera.zoom, y: (point.y - camera.y) / camera.zoom };
}

const sameSet = (items, expected) => items.length === expected.length && expected.every((id) => items.includes(id));
const ordinary = (conditions) => (conditions.temperatureK ?? 293) >= 260 && (conditions.temperatureK ?? 293) <= 500;

export const COMPOUNDS = [
  { id:'H2O', name:'Water', formula:'H₂O', category:'Common liquids', state:'liquid', density:1, meltingPoint:273.15, boilingPoint:373.15, color:'#49baff', description:'A common liquid compound used as the sandbox reaction medium.', miscibleGroup:'polar' },
  { id:'C2H5OH', name:'Ethanol', formula:'C₂H₅OH', category:'Common liquids', state:'liquid', density:.789, meltingPoint:159, boilingPoint:351.5, color:'#c9f0ff', description:'A molecular liquid compound that forms a simplified miscible mixture with water.', miscibleGroup:'polar' },
  { id:'HCl', name:'Hydrochloric acid', formula:'HCl', category:'Acids and bases', state:'liquid', density:1.18, color:'#dff7ff', description:'A virtual acid sample used only in abstract educational reaction rules.', miscibleGroup:'polar' },
  { id:'NaOH', name:'Sodium hydroxide', formula:'NaOH', category:'Acids and bases', state:'solid', density:2.13, color:'#e9f7ff', description:'A base represented by a simplified educational material profile.' },
  { id:'NH3', name:'Ammonia', formula:'NH₃', category:'Common compounds', state:'gas', density:.000771, color:'#c1f5d0', description:'A molecular nitrogen-hydrogen compound.' },
  { id:'O2', name:'Oxygen', formula:'O₂', category:'Atmospheric gases', state:'gas', density:.001429, color:'#89e8ff', description:'Diatomic oxygen gas.' },
  { id:'N2', name:'Nitrogen', formula:'N₂', category:'Atmospheric gases', state:'gas', density:.001251, color:'#a6bcff', description:'Diatomic nitrogen gas.' },
  { id:'H2', name:'Hydrogen', formula:'H₂', category:'Reaction products', state:'gas', density:.0000899, color:'#e8fbff', description:'A virtual gas product used by supported educational rules.' },
  { id:'CO2', name:'Carbon dioxide', formula:'CO₂', category:'Atmospheric gases', state:'gas', density:.001977, color:'#b9d2df', description:'A molecular gas made of carbon and oxygen.' },
  { id:'CH4', name:'Methane', formula:'CH₄', category:'Common compounds', state:'gas', density:.000657, color:'#d8eff5', description:'A molecular carbon-hydrogen compound.' },
  { id:'NaCl', name:'Sodium chloride', formula:'NaCl', category:'Salts', state:'solid', density:2.16, color:'#f1f4ff', description:'An ionic solid made from sodium and chloride ions.', form:'crystal' },
  { id:'NaCl_aq', name:'Sodium chloride solution', formula:'NaCl(aq)', category:'Mixtures and solutions', state:'liquid', density:1.04, color:'#91d9ff', description:'A simplified aqueous salt solution. The game keeps water as the carrier sample and adds this dissolved-solute marker.', miscibleGroup:'polar' },
  { id:'NaHCO3', name:'Sodium bicarbonate', formula:'NaHCO₃', category:'Salts', state:'solid', density:2.2, color:'#f5f6f0', description:'A sodium hydrogen carbonate salt.' },
  { id:'CaCO3', name:'Calcium carbonate', formula:'CaCO₃', category:'Minerals', state:'solid', density:2.71, color:'#f1ebcf', description:'A common calcium carbonate mineral.', form:'powder' },
  { id:'CaCl2', name:'Calcium chloride', formula:'CaCl₂', category:'Salts', state:'solid', density:2.15, color:'#e5eef7', description:'A calcium chloride salt used in virtual reaction rules.' },
  { id:'Na2CO3', name:'Sodium carbonate', formula:'Na₂CO₃', category:'Salts', state:'solid', density:2.54, color:'#eef6ff', description:'A carbonate salt used in virtual precipitation rules.' },
  { id:'AgNO3', name:'Silver nitrate', formula:'AgNO₃', category:'Salts', state:'solid', density:4.35, color:'#ebeff8', description:'A virtual silver salt sample used in precipitation demonstrations.' },
  { id:'AgCl', name:'Silver chloride', formula:'AgCl', category:'Reaction products', state:'solid', density:5.56, color:'#f9f8e9', description:'A simplified pale precipitate product.' },
  { id:'NaNO3', name:'Sodium nitrate', formula:'NaNO₃', category:'Reaction products', state:'solid', density:2.26, color:'#f4f7fc', description:'A nitrate salt product used by the educational reaction model.' },
  { id:'CuSO4', name:'Copper(II) sulfate', formula:'CuSO₄', category:'Salts', state:'solid', density:3.6, color:'#4f9dff', description:'A copper salt used in displacement and precipitation examples.' },
  { id:'CuOH2', name:'Copper(II) hydroxide', formula:'Cu(OH)₂', category:'Reaction products', state:'solid', density:3.37, color:'#70b6ed', description:'A simplified blue precipitate product.' },
  { id:'Na2SO4', name:'Sodium sulfate', formula:'Na₂SO₄', category:'Reaction products', state:'solid', density:2.66, color:'#eff7ff', description:'A sulfate salt product used in virtual reaction rules.' },
  { id:'FeSO4', name:'Iron(II) sulfate', formula:'FeSO₄', category:'Reaction products', state:'solid', density:1.9, color:'#9bbd82', description:'An iron sulfate product used in a virtual displacement example.' },
  { id:'ZnCl2', name:'Zinc chloride', formula:'ZnCl₂', category:'Reaction products', state:'solid', density:2.91, color:'#e6edf0', description:'A zinc salt product used in a virtual displacement example.' }
];

// Values below tune an internally consistent browser-physics approximation. They are
// intentionally not presented as laboratory-grade transport coefficients.
const MATERIAL_OVERRIDES = {
  H2O:{ representation:'liquid', viscosity:.90, miscibleGroup:'polar', dropletCount:5 },
  C2H5OH:{ representation:'liquid', viscosity:1.07, miscibleGroup:'polar', dropletCount:5 },
  HCl:{ representation:'liquid', viscosity:1.05, miscibleGroup:'polar', dropletCount:5 },
  NaCl:{ representation:'crystal', friction:.55, restitution:.13 },
  CaCO3:{ representation:'powder', friction:.78, restitution:.04 },
  CO2:{ representation:'gas-cloud', diffusion:1.2 },
  H2:{ representation:'gas-cloud', diffusion:2.4 },
  NH3:{ representation:'gas-cloud', diffusion:1.8 },
  O2:{ representation:'gas-cloud', diffusion:1.1 },
  N2:{ representation:'gas-cloud', diffusion:1.15 }
};

export function materialProfile(material) {
  const state = material.state || 'solid';
  const defaults = state === 'gas'
    ? { representation:'gas-cloud', viscosity:.05, friction:.01, restitution:.45, diffusion:1, buoyancy:1, dropletCount:4 }
    : state === 'liquid'
      ? { representation:'liquid', viscosity:1, friction:.08, restitution:.04, dropletCount:5, miscibleGroup:material.miscibleGroup || null }
      : { representation:material.form === 'powder' ? 'powder' : material.form === 'crystal' ? 'crystal' : 'solid-chunk', viscosity:0, friction:.42, restitution:.2, dropletCount:1 };
  return { state, density:Number(material.density) || null, ...defaults, ...(MATERIAL_OVERRIDES[material.id] || {}) };
}

export const REACTION_RULES = [
  { id:'sodium-water', category:'water reaction', reactants:['Na','H2O'], products:['NaOH','H2'], equation:'2Na + 2H₂O → 2NaOH + H₂↑', temperatureDeltaK:20, observable:'heat and a colourless gas marker', explanation:'A simplified virtual demonstration of sodium reacting with water. The result is represented with a base product and hydrogen gas marker.', condition:ordinary },
  { id:'hcl-naoh', category:'neutralization', reactants:['HCl','NaOH'], products:['NaCl','H2O'], equation:'HCl + NaOH → NaCl + H₂O', temperatureDeltaK:8, observable:'a modest temperature increase', explanation:'A virtual acid-base neutralization rule. It illustrates the formation of salt and water without concentrations or laboratory instructions.', condition:ordinary },
  { id:'hcl-sodium-bicarbonate', category:'gas formation', reactants:['HCl','NaHCO3'], products:['NaCl','H2O','CO2'], equation:'NaHCO₃ + HCl → NaCl + H₂O + CO₂↑', temperatureDeltaK:-2, observable:'carbon dioxide gas marker', explanation:'A virtual carbonate-acid rule that produces a carbon dioxide marker. Conditions are abstracted for safe educational exploration.', condition:ordinary },
  { id:'hcl-calcium-carbonate', category:'gas formation', reactants:['CaCO3','HCl'], products:['CaCl2','H2O','CO2'], equation:'CaCO₃ + 2HCl → CaCl₂ + H₂O + CO₂↑', temperatureDeltaK:-3, observable:'gas marker and mineral transformation', explanation:'A virtual acid-carbonate reaction used to demonstrate that carbonate materials can form carbon dioxide in supported conditions.', condition:ordinary },
  { id:'silver-chloride-precipitate', category:'precipitation', reactants:['AgNO3','NaCl'], products:['AgCl','NaNO3'], equation:'AgNO₃ + NaCl → AgCl↓ + NaNO₃', temperatureDeltaK:0, observable:'pale precipitate marker', explanation:'A virtual double-displacement rule that creates a silver chloride precipitate marker and a remaining nitrate salt product.', condition:ordinary },
  { id:'calcium-carbonate-precipitate', category:'precipitation', reactants:['CaCl2','Na2CO3'], products:['CaCO3','NaCl'], equation:'CaCl₂ + Na₂CO₃ → CaCO₃↓ + 2NaCl', temperatureDeltaK:0, observable:'calcium carbonate precipitate marker', explanation:'A virtual precipitation rule that demonstrates formation of an insoluble carbonate product.', condition:ordinary },
  { id:'copper-hydroxide-precipitate', category:'precipitation', reactants:['CuSO4','NaOH'], products:['CuOH2','Na2SO4'], equation:'CuSO₄ + 2NaOH → Cu(OH)₂↓ + Na₂SO₄', temperatureDeltaK:0, observable:'blue precipitate marker', explanation:'A virtual precipitation rule that demonstrates formation of copper(II) hydroxide as a blue product marker.', condition:ordinary },
  { id:'iron-copper-displacement', category:'displacement', reactants:['Fe','CuSO4'], products:['FeSO4','Cu'], equation:'Fe + CuSO₄ → FeSO₄ + Cu', temperatureDeltaK:1, observable:'copper product marker and colour shift', explanation:'A virtual single-displacement example in which iron is represented as displacing copper from a copper sulfate material.', condition:ordinary },
  { id:'zinc-acid-displacement', category:'displacement', reactants:['Zn','HCl'], products:['ZnCl2','H2'], equation:'Zn + 2HCl → ZnCl₂ + H₂↑', temperatureDeltaK:5, observable:'hydrogen gas marker', explanation:'A virtual metal-acid displacement rule. It is an abstract simulation event and does not provide real-world preparation guidance.', condition:ordinary },
  { id:'salt-dissolution', category:'dissolution', reactants:['NaCl','H2O'], products:['NaCl_aq'], preserveReactants:['H2O'], equation:'NaCl(s) → Na⁺(aq) + Cl⁻(aq)', temperatureDeltaK:0, observable:'dissolved-solute marker in water', explanation:'A simplified dissolution event. Water remains as the carrier sample while a solution marker records the dissolved salt identity.', condition:ordinary }
];

export function supportedReaction(symbols, conditions = {}) {
  const rule = REACTION_RULES.find((candidate) => sameSet(symbols, candidate.reactants) && (candidate.condition?.(conditions) ?? true));
  return rule ? { ...rule, name: rule.name || rule.id.replaceAll('-', ' ') } : null;
}
