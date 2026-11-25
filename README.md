# ChemLab — 2D Chemistry Sandbox

ChemLab is a browser-based **2D physics sandbox** for exploring periodic-table reference data, physical samples, laboratory tools, and a deliberately limited set of educational chemistry rules. It runs as a static site, including on GitHub Pages; it has no backend and does not give real laboratory instructions.

## Playable systems

- Genuine 2D Matter.js physics: a real static ground and side boundaries, gravity, collisions, angular movement, drag/throw with explicit release restoration, fixed-step simulation, pause, slow motion, and pan/zoom.
- Empty sandbox with cursor-accurate spawning: choose an item, move the cursor, press **E**. The selected catalog item remains available for repeated spawning.
- **94 spawnable elements**: hydrogen (1) through plutonium (94), arranged by periodic-table category with search.
- Advanced reference inspector: atomic number/mass, neutral proton/electron counts, isotope-dependent neutron note, electron configuration, oxidation states, density, melting/boiling point, standard state, and electronegativity when source data is available.
- **Normal Mode** creates macroscopic approximations: solid chunks/crystals, powder particles, liquid droplets, and visible gas-cloud particles. **Quantum Mode** uses representative atom and molecule samples; it is not a wavefunction or molecular-dynamics solver.
- 24 bundled compounds and material samples, including common liquids/gases, salts, acids/bases, reaction products, and simplified solution markers.
- Functional starter tools: beaker, heater plate, cooling plate, thermometer, pH meter, magnetic stirrer, airflow fan, pressure chamber, digital scale, and safety shield.
- Conditions: temperature, pressure, gravity, simulation speed, pause, optional grid.
- Object operations: select, drag/hold, throw, rectangle multiselect, duplicate, freeze, delete, undo/redo, and right-click context actions.
- Local scene save/load and a Discovery Notebook that records only implemented rule-based reactions.

## Controls

- **E** — spawn selected catalog item at cursor
- **Left drag** — select and move; release to throw
- **Shift + drag** — selection rectangle / add to selection
- **Right click** — object context menu
- **Middle drag** — pan camera
- **Mouse wheel** — zoom at cursor
- **Space** — pause/resume
- **G** — slow motion
- **A / D while holding an object** — rotate counter-clockwise / clockwise
- **F** — freeze/unfreeze selected object(s)
- **Delete / Backspace** — delete selection
- **Ctrl+D** — duplicate
- **Ctrl+Z / Ctrl+Y** — undo/redo
- **Ctrl+S** — save scene locally
- **Escape** — deselect and close context menu

## Chemistry scope

This is **not** molecular dynamics, quantum chemistry, or real-world lab guidance. It uses explicit, documented rule-based events. The bundled reaction catalog currently has 10 educational rules across water reaction, neutralization, gas formation, precipitation, displacement, and dissolution. For example:

`2Na + 2H₂O → 2NaOH + H₂↑`

Unsupported contacts intentionally remain inert rather than inventing chemistry. Water and ethanol currently receive simplified melting/boiling transitions; other phase and pressure behavior remains an educational approximation. The pressure chamber reports global sandbox pressure only—it is not yet an isolated pressure volume. Missing values remain unavailable rather than fabricated.

## Run locally

A static server is required because the game fetches bundled data modules:

```bash
python3 -m http.server 8080
```

Open `http://127.0.0.1:8080`.

## Data and dependencies

- `data/elements.json` is a normalized project-owned H–Pu subset of `periodic-table@0.0.8` (ISC licensed). The package is a 2017 transformed periodic-table CSV dataset; values are reference data, not a guarantee of current scientific authority.
- Matter.js 0.20.0 is bundled locally under `vendor/matter.min.js` (MIT).
- No external runtime CDN, analytics, backend, or API is required for normal play.

## Tests

```bash
node --input-type=module --check < game.js
node --test tests/*.test.mjs
```
