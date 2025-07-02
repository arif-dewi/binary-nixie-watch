# 🕐 Binary Nixie Watch

A beautiful binary clock with vintage Nixie tube aesthetics, built with D3.js and modern web technologies.

[![CI](https://github.com/arif-dewi/binary-nixie-watch/actions/workflows/ci.yml/badge.svg)](https://github.com/arif-dewi/binary-nixie-watch/actions)
[![Demo](https://img.shields.io/badge/demo-watch.arifdewi.dev-orange?logo=github)](https://watch.arifdewi.dev)

## ✨ Features

* **Real-time binary clock** – Hours, minutes, and seconds in binary format
* **Vintage Nixie tube design** – Warm amber glow with realistic glass reflections
* **3D perspective effects** – Subtle camera movement that follows your mouse
* **Immersive audio** – Optional ambient electrical hum and satisfying tick sounds
* **Smooth animations** – D3.js powered transitions and startup sequence
* **Interactive tooltips** – Hover over tubes to see binary math (2⁴ = 16)
* **Responsive design** – Works on desktop and mobile devices

## 🚀 Live Demo

* 🔗 **Live App**: [https://watch.arifdewi.dev](https://watch.arifdewi.dev)
* 💾 **GitHub Repo**: [https://github.com/arif-dewi/binary-nixie-watch](https://github.com/arif-dewi/binary-nixie-watch)

## 💠 Quick Start

### Prerequisites

* Node.js 18+
* npm or yarn

### Installation

```bash
git clone https://github.com/arif-dewi/binary-nixie-watch.git
cd binary-nixie-watch
npm install
npm run dev
```

Open your browser to `http://localhost:5173` and enjoy the watch!

## 📁 Project Structure

```
binary-nixie-watch/
├── index.html
├── src/
│   ├── css/
│   │   └── styles.css
│   └── js/
│       ├── audio-manager.js
│       ├── helpers/
│       ├── nixie-watch.js
│       └── svg-definitions.js
├── tests/
│   └── e2e.cy.js
├── .github/
│   └── workflows/ci.yml
├── package.json
└── vite.config.js
```

## ⚙️ Available Scripts

* `npm run dev` – Start dev server
* `npm run build` – Build for production
* `npm run preview` – Preview production build
* `npm run lint` – Lint JavaScript files
* `npm run format` – Format code with Prettier
* `npm run test` – Run unit tests (Vitest)
* `npm run test:e2e` – Run Cypress end-to-end tests

## 💖 Customization

### Colors

Edit CSS variables in `styles.css`:

```css
:root {
  --primary-color: #ff6a00;
  --glow-color: #ff6a00;
}
```

### Audio

Edit `audio-manager.js`:

```js
this.ambientOscillator.volume.value = -35;
this.tickSynth.volume.value = -18;
```

### Animation speed

Edit `nixie-watch.js`:

```js
.transition()
.duration(300);
```

## 🚀 Deployment

### GitHub Pages

```bash
npm run deploy
```

### Netlify

1. Build the project: `npm run build`
2. Upload `dist/` folder to Netlify

## 🧠 How It Works

### Binary Representation

* **Hours**: 5-bit (0–23)
* **Minutes/Seconds**: 6-bit (0–59)

### Tech Stack

* **D3.js** – For dynamic rendering and transitions
* **Tone.js** – Web Audio API abstraction
* **Vite** – Fast build tool
* **Cypress/Vitest** – For testing

## 🔼 Browser Support

* Chrome 88+
* Firefox 85+
* Safari 14+
* Mobile with WebGL support

## 📄 License

MIT License

## 🤝 Contributing

1. Fork the repo
2. Create feature branch
3. Push & open PR

---

**Made with ❤️ and ☕ by [@arif-dewi](https://github.com/arif-dewi)**
