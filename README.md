# ChemLab Sandbox

A browser-based, cartoon-style 3D chemistry sandbox. It is a rule-based educational simulation, not molecular dynamics or laboratory safety guidance.

## What is included

- Empty 3D sandbox arena with drag, orbit, pan, zoom, pause, gravity, and simulation-speed controls.
- Searchable element catalog for every element from hydrogen (1) through plutonium (94).
- Advanced inspector fields: atomic number/mass, proton/electron counts, isotope-dependent neutron note, electron configuration, density, melting/boiling points, oxidation states, electronegativity, and standard state.
- Spawnable utilities: water beaker, empty beaker, heater plate, vacuum chamber, thermometer, and safety shield.
- Condition controls for temperature, pressure, gravity, and simulation speed.
- Current starter reaction rule: sodium + water, shown as an educational effect.

## Controls

- **Left mouse drag:** move a sandbox object
- **Right mouse drag:** orbit camera
- **Middle mouse drag:** pan camera
- **Mouse wheel:** zoom
- **W / A / S / D:** pan camera
- **Q / E:** lower / raise camera focus
- **Space:** pause/resume
- **Delete:** remove selected object

## Run locally

Use a static server because the game loads `data/elements.json` at runtime:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Element data

`data/elements.json` is a normalized, project-owned subset (1–94) of the ISC-licensed `periodic-table` npm dataset, version 0.0.8. The original package describes itself as transformed periodic-table CSV data and was published in 2017. Unknown values are preserved as unknown rather than fabricated; melting and boiling values are displayed in kelvin. Verify properties against a current authoritative chemistry source before relying on them for coursework or real-world decisions.

## Tests

```bash
node --test tests/*.test.mjs
```
