export function screenToWorld(point, camera) {
  return { x: (point.x - camera.x) / camera.zoom, y: (point.y - camera.y) / camera.zoom };
}

const SAME = (items, expected) => items.length === expected.length && expected.every((symbol) => items.includes(symbol));

export function supportedReaction(symbols, conditions) {
  if (SAME(symbols, ['Na', 'H2O']) && conditions.temperatureK >= 260 && conditions.temperatureK <= 500) {
    return {
      id: 'sodium-water',
      name: 'Sodium reacting with water',
      equation: '2Na + 2H₂O → 2NaOH + H₂↑',
      products: ['NaOH', 'H2'],
      explanation: 'A simplified virtual demonstration of sodium reacting with water. Hydrogen bubbles and heat are shown as educational effects.',
      temperatureDeltaK: 20
    };
  }
  return null;
}

export const COMPOUNDS = [
  { id:'H2O', name:'Water', formula:'H₂O', category:'Common liquids', state:'liquid', density:1, color:'#49baff', description:'A common liquid compound used as the sandbox reaction medium.' },
  { id:'O2', name:'Oxygen', formula:'O₂', category:'Atmospheric gases', state:'gas', density:0.001429, color:'#89e8ff', description:'Diatomic oxygen gas.' },
  { id:'N2', name:'Nitrogen', formula:'N₂', category:'Atmospheric gases', state:'gas', density:0.001251, color:'#a6bcff', description:'Diatomic nitrogen gas.' },
  { id:'CO2', name:'Carbon dioxide', formula:'CO₂', category:'Atmospheric gases', state:'gas', density:0.001977, color:'#b9d2df', description:'A molecular gas made of carbon and oxygen.' },
  { id:'NaCl', name:'Sodium chloride', formula:'NaCl', category:'Salts', state:'solid', density:2.16, color:'#f1f4ff', description:'An ionic solid made from sodium and chloride ions.' },
  { id:'NaOH', name:'Sodium hydroxide', formula:'NaOH', category:'Reaction products', state:'solid', density:2.13, color:'#e9f7ff', description:'A virtual reaction product used by the sodium-water rule.' },
  { id:'H2', name:'Hydrogen', formula:'H₂', category:'Reaction products', state:'gas', density:0.0000899, color:'#e8fbff', description:'A virtual gas product used by the sodium-water rule.' },
  { id:'NH3', name:'Ammonia', formula:'NH₃', category:'Common compounds', state:'gas', density:0.000771, color:'#c1f5d0', description:'A molecular nitrogen-hydrogen compound.' },
  { id:'CH4', name:'Methane', formula:'CH₄', category:'Common compounds', state:'gas', density:0.000657, color:'#d8eff5', description:'A molecular carbon-hydrogen compound.' },
  { id:'C2H5OH', name:'Ethanol', formula:'C₂H₅OH', category:'Common liquids', state:'liquid', density:0.789, color:'#c9f0ff', description:'A molecular liquid compound.' },
  { id:'CaCO3', name:'Calcium carbonate', formula:'CaCO₃', category:'Minerals', state:'solid', density:2.71, color:'#f1ebcf', description:'A common calcium carbonate mineral.' },
  { id:'NaHCO3', name:'Sodium bicarbonate', formula:'NaHCO₃', category:'Salts', state:'solid', density:2.2, color:'#f5f6f0', description:'A sodium hydrogen carbonate salt.' }
];
