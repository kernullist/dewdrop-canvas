# Dewdrop Canvas 💧

> **A Tactile Liquid Brain-Mapping & Generative AI Thought Synthesis Board (Powered by Node.js & Express)**

🌎 **[한국어 버전 README (Korean Version)](./README.ko.md)**

![Dewdrop Canvas Demo](demo/dewdrop-canvas-demo.mp4)

---

Dewdrop Canvas is an immersive, premium digital workspace where ideas are represented as glowing, organic liquid dewdrops. Using advanced HTML5 2D Canvas compositing, hardware-accelerated CSS filter blending (`blur(12px) contrast(20)`), and spring-damping physics, dewdrops warp and snap together organically like real water droplets.

This project has been fully upgraded from a client-only static page into a **robust, database-backed multi-project workspace manager** powered by a secure local Node.js Express server. It features native multi-language capabilities (English & Korean), real-time thought color mapping, right-click AI single thought enhancements, and an interactive **AI Auto-Synergy Merge Picker** that finds, snaps, and synthesizes thought nodes programmatically.

---

## 🌟 Premium Key Features

### 1. 📂 Persistent Backend Multi-Project Engine
* **Project Isolation**: Workspace data is saved as discrete JSON files inside the `data/projects/` directory. Create, rename, delete, and manage unlimited project mind maps.
* **Instant Dynamic Autosaving**: Every thought board interaction (creating, dragging, snapping, merging, or deleting dewdrops) instantly autosaves to its respective backend database.
* **Automatic Active Restore**: The server tracks your last edited workspace and automatically restores it upon reloading or launching the application.
* **Seed Seeding**: Automatically seeds three beautiful starter nodes when a project is initialized to immediately give you tactile objects to merge.

### 2. 🎨 Content-Aware Dynamic Color System
* **Semantic Category Extraction**: Real-time vocabulary parsing (English & Korean) maps each thought to a tailored HSL theme:
  1. **IT / Tech / Coding** $\rightarrow$ **Teal/Cyan** (`#06b6d4` / `#6366f1`)
  2. **Fire / Warmth / Sunshine** $\rightarrow$ **Cozy Amber/Orange** (`#f59e0b` / `#f97316`)
  3. **Nature / Forest / Wind / Calm** $\rightarrow$ **Emerald Green** (`#10b981` / `#047857`)
  4. **Water / Rain / Storm / Ocean** $\rightarrow$ **Sapphire Royal Blue** (`#3b82f6` / `#1e3a8a`)
  5. **Art / Music / Dreams / Synergy** $\rightarrow$ **Cosmic Magenta/Violet** (`#a855f7` / `#ec4899`)
  6. **Ideas / Memos / Action (Generic)** $\rightarrow$ **Warm Gold/Amber** (`#f97316` / `#d97706` - designed to prevent warning/error red color associations)
* **Visual Synergy Integration**: This color system dynamically modifies the canvas metaballs, glassmorphic card hover borders, AI thinking aura animations, and the explosive pop particle splash effects.

### 3. 🪐 AI Auto-Synergy Merge Picker (New!)
* **Intelligent Recommendations**: Click the top-right cosmic star button (`#ai-auto-merge-btn`) to trigger the `POST /api/recommend-merge` endpoint. The AI analyzes all active thought nodes and selects the two thoughts that yield the most valuable creative or logical synergy.
* **Tactile Spring Attraction Snap**: On select, the chosen dewdrops are flagged with `aiAutoMerging` and immediately pull towards each other's midpoint coordinates using spring velocities. Custom sticky drag damping (`0.88`) ensures a smooth, satisfying gliding lock.
* **Automatic Synthesis Trigger**: As soon as the auto-snapped dewdrops collide, they bypass normal drag restrictions to launch the Synthesis Merge screen automatically.

### 4. 🪄 Secure Multi-LLM Backend Synthesis & Single-Thought Enhancements
* **API Key Safety**: Your Gemini, DeepSeek, or OpenRouter API keys are processed safely server-side, protecting them from browser memory exposure.
* **Tone-and-Manner (T&M) Prompts**: The prompt engine adapts dynamically. Technical/business thoughts are merged and enhanced using professional engineering logic, while literature/creative memos are synthesized in a warm, poetic prose style.
* **Right-Click Context Menu ("AI 생각 보강 & 정돈")**: Right-clicking a thought card reveals a glassmorphic context menu to instantly refine spelling, enhance grammar, and append a creative single-sentence AI extension.

### 5. 🔄 Robust Rollback (Undo) System (`Ctrl + Z`)
* **Undo History**: Tracks up to 10 full-canvas configurations for each project in memory. Undo via the header button or keyboard shortkey `Ctrl + Z`.
* **Spring Blast Division Physics**: Restoring merged dewdrops triggers a high-fidelity division animation, applying outward spring velocity vectors that push restored dewdrops away from their midpoint combined with **2.2 seconds of temporary merge immunity** to prevent immediate re-merges.

### 6. 🌐 Settings Panel & Dynamic Language Support
* **Real-time UX Translation**: Choose between **English** and **Korean** inside the brand-cog settings modal. Changing language instantly updates sidebar menus, status bars, toasts, AI thinking steps, and offline fallback generators.
* **Dynamic Localized Prompting**: The selected language is sent to the backend API, instructing the AI models to synthesize and enhance in the chosen language.

### 7. 🔊 Procedural Audio & Scrollable Board
* **Web Audio Synthesis**: All spatial audio (plops, snap chimes, explosive bursts) is generated algorithmically inside the browser in real-time. Zero heavy audio assets required.
* **Virtual Board coordinates (`2400px x 1800px`)**: Centered viewport scroll wrapper protects thought nodes from getting squished and auto-merged when browser size is reduced.

---

## 🚀 How to Run & Configure

Dewdrop Canvas runs entirely on a lightweight local Express server.

### 1. Installation
Navigate to your project directory and install the necessary dependencies:
```bash
# Navigate to directory
cd C:\Users\kernullist\.gemini\antigravity\scratch\dewdrop-canvas

# Install dependencies (Express, CORS, dotenv, node-fetch)
npm install
```

### 2. Configure API Keys (Optional)
Create or open the `.env` file in the root directory and add your API keys:
```env
PORT=3001
GEMINI_API_KEY=your_gemini_key_here
DEEPSEEK_API_KEY=your_deepseek_key_here
OPENROUTER_API_KEY=your_openrouter_key_here
```
*(If no keys are configured, the server operates in its fully functional, immersive offline **Poetic Simulator Mode**).*

### 3. Launch the Server
Start the local database service:
```bash
npm start
```

### 4. Play in the Browser
Open your browser and navigate to:
🔗 **[http://localhost:3001](http://localhost:3001)**

---

## 📂 File Architecture

* **[`server.js`](file:///c:/Users/kernullist/.gemini/antigravity/scratch/dewdrop-canvas/server.js)**: Local Node.js Express server hosting the REST endpoints, secure backend LLM proxy engines, multi-language prompt configurations, and offline poetic simulators.
* **[`app.js`](file:///c:/Users/kernullist/.gemini/antigravity/scratch/dewdrop-canvas/app.js)**: Core client script managing HTML5 2D Canvas rendering, spring-mass physics, Web Audio procedural synthesis, settings modals, and frontend button handlers.
* **[`index.html`](file:///c:/Users/kernullist/.gemini/antigravity/scratch/dewdrop-canvas/index.html)**: Clean HTML5 semantic layout containing the glassmorphic settings sidebar, canvas workspace, and loading overlays.
* **[`style.css`](file:///c:/Users/kernullist/.gemini/antigravity/scratch/dewdrop-canvas/style.css)**: Design tokens, animated cosmic backdrops, glassmorphic panels, and the critical blur-contrast liquid compositing engine.
* **[`package.json`](file:///c:/Users/kernullist/.gemini/antigravity/scratch/dewdrop-canvas/package.json)**: Node dependencies configuration.
