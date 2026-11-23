# ChemLab Web

A browser-based 3D chemistry-lab prototype with no Unity dependency.

## Run locally
Open `index.html` through a static server, for example:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080`.

## Controls
- **W/A/S/D**: fly
- **Space / Shift**: up / down
- **Mouse**: look
- **E or left-click**: interact / pick up sodium
- **F**: drop sodium
- **Left-click while holding**: throw sodium

The first complete interaction is sodium + water. It is an educational, rule-based visualization rather than a molecular-dynamics simulation.
