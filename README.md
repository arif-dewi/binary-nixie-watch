# 🕐 Binary Nixie Watch

A beautiful binary clock with vintage Nixie tube aesthetics, built with D3.js and modern web technologies.

![Binary Nixie Watch Preview](https://via.placeholder.com/800x400/1a1a2e/ff6a00?text=Binary+Nixie+Watch)

## ✨ Features

- **Real-time binary clock** - Hours, minutes, and seconds in binary format
- **Vintage Nixie tube design** - Warm amber glow with realistic glass reflections
- **3D perspective effects** - Subtle camera movement that follows your mouse
- **Immersive audio** - Optional ambient electrical hum and satisfying tick sounds
- **Smooth animations** - D3.js powered transitions and startup sequence
- **Interactive tooltips** - Hover over tubes to see binary math (2⁴ = 16)
- **Responsive design** - Works on desktop and mobile devices

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/binary-nixie-watch.git
cd binary-nixie-watch

# Install dependencies
npm install

# Start development server
npm run dev
```

Open your browser to `http://localhost:3000` and enjoy the watch!

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Lint JavaScript files
- `npm run format` - Format code with Prettier
- `npm run deploy` - Deploy to GitHub Pages

### Project Structure

```
binary-nixie-watch/
├── index.html              # Main HTML file
├── src/
│   ├── css/
│   │   └── styles.css      # All styling
│   └── js/
│       ├── svg-definitions.js  # SVG filters and gradients
│       ├── audio-manager.js    # Sound effects
│       └── nixie-watch.js      # Main watch logic
├── package.json
└── vite.config.js
```

## 🎨 Customization

### Color Themes
Modify the CSS variables in `styles.css`:
```css
/* For blue theme */
--primary-color: #4da6ff;
--glow-color: #66b3ff;
```

### Audio Settings
Adjust volume levels in `audio-manager.js`:
```javascript
this.ambientOscillator.volume.value = -35; // Ambient hum
this.tickSynth.volume.value = -18;          // Tick sounds
```

### Animation Speed
Change transition durations in `nixie-watch.js`:
```javascript
.transition()
.duration(300) // Milliseconds
```

## 🚀 Deployment

### GitHub Pages
```bash
npm run deploy
```

### Netlify
1. Build the project: `npm run build`
2. Upload the `dist/` folder to Netlify

### Vercel
```bash
npx vercel --prod
```

## 🧠 How It Works

### Binary Time Display
- **Hours**: 5-bit binary (0-23)
- **Minutes**: 6-bit binary (0-59)
- **Seconds**: 6-bit binary (0-59)

Each tube shows `1` (lit) or `0` (dimmed), representing the binary digits.

### Technical Architecture
- **D3.js** for data-driven DOM manipulation and smooth animations
- **Tone.js** for Web Audio API sound synthesis
- **Vite** for modern build tooling and hot reload
- **ES6 modules** for clean, maintainable code organization

## 🎯 Browser Support

- Chrome/Edge 88+
- Firefox 85+
- Safari 14+
- Mobile browsers with WebGL support

## 📄 License

MIT License - feel free to use this project for learning or in your portfolio!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a Pull Request

## 🙏 Acknowledgments

- Inspired by vintage Nixie tube electronics
- Built with modern web technologies
- Sound design using Web Audio API

---

**Made with ❤️ and lots of ☕**

*Show off your binary skills and impress your friends!* 🚀# binary-nixie-watch
