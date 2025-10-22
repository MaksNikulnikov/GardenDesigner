# 🌿 Garden Designer

**Garden Designer** is a small 3D casual farm prototype built with **Three.js + GSAP**.  
Players can build gardens and animal pens, plant crops, feed animals, and harvest resources — all in a bright, low-poly world.

---

## 🧠 Features
- Interactive 3D environment
- Modular architecture with managers
- Plants and animals simulation
- Day/night lighting system
- Animated UI with hints and tutorial
- Sound and music integration
- Responsive scaling (Resizer)

---

## 🧩 Project Structure
```
src/
└── World/
    ├── game/            # Core gameplay managers
    ├── ui/              # UI system (HTML + logic)
    ├── audio/           # Global sound controller
    ├── components/      # Scene + 3D factories
    ├── effects/         # GSAP/particle effects
    ├── systems/         # Loop, renderer, controls
    ├── config/          # Game and field parameters
```

---

## 🚀 Getting Started
```bash
npm install
npm run dev
```

Then open your local dev server (e.g. `http://localhost:5173` if using Vite).

---

## 🎮 Controls
- 🖱️ Click to build, plant, or harvest
- 🌞 Toggle day/night in the top-right corner
- 🎵 Music starts after first interaction
- 📲 CTA button triggers external action

---

## 🛠️ Technology Stack
- [Three.js](https://threejs.org/)
- [GSAP](https://greensock.com/gsap/)
- HTML / CSS / Vanilla JS
- Modular ES6 architecture

---

## 📜 License
MIT © Garden Designer Team
