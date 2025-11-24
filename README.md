# Cognitive Knobs 🎛️

**A retro-futuristic control surface for manipulating AI cognition in real-time.**

Transform LLM interaction from prompt engineering to parameter manipulation. Instead of crafting prompts, adjust cognitive dimensions with analog-style controls and see results at frame-rate speed.

## ✨ Features

- **Real-time Parameter Control**: Adjust temperature, max tokens, top-p, frequency penalty, and presence penalty with tactile slider controls
- **Live Preview Mode**: Ultra-fast inference (<100ms) enables continuous feedback as you adjust parameters
- **Configuration Management**: Save and load parameter presets for different use cases
- **Distinctive Retro Design**: Vintage studio equipment aesthetic with warm amber LEDs, wood tones, and metallic finishes
- **Debounced Processing**: Smart request handling prevents overwhelming the API
- **Request Cancellation**: Outdated requests are automatically cancelled

## 🎨 Design Philosophy

Inspired by 1970s analog synthesizers and mixing consoles, Cognitive Knobs makes abstract AI parameters feel tangible and manipulable. The interface features:

- Warm color palette (amber, copper, brass, wood tones)
- LED-style readouts and VU meters
- Analog fader controls
- Grain textures and metallic finishes
- Distinctive typography (Orbitron, Space Mono, Major Mono Display)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- OpenRouter API key ([get one here](https://openrouter.ai/keys))

### Setup

1. **Configure environment variables:**

   Edit `.env` and add your OpenRouter API key:
   ```bash
   OPENROUTER_API_KEY=your-api-key-here
   ```

2. **Update the model (important!):**

   Open `src/routes/api/generate/+server.ts` and update the `CEREBRAS_MODEL` constant with the correct Cerebras GLM 4.6 model identifier from OpenRouter.

   Check [OpenRouter's model list](https://openrouter.ai/models) for the exact Cerebras GLM 4.6 model name.

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to the URL shown in terminal (e.g., `http://localhost:5174`)

## 🎛️ How to Use

### Basic Workflow

1. **Set System Prompt**: Define how the AI should behave
2. **Adjust Cognitive Parameters**: Use the sliders to manipulate cognitive dimensions
3. **Enter Input**: Type your text to transform
4. **Generate**: Click generate or enable live preview mode

### Live Preview Mode

Toggle "Live Preview" to enable real-time processing. As you adjust parameters, the output updates automatically (with 300ms debouncing).

### Saving Presets

1. Click **Presets** to expand configuration manager
2. Enter a name for your current settings
3. Click **Save**
4. Load saved presets anytime to quickly switch configurations

## 🛠️ Tech Stack

- **Framework**: SvelteKit 2 + Svelte 5 (with runes)
- **Language**: TypeScript
- **API**: OpenRouter (Cerebras GLM 4.6)
- **Styling**: Custom CSS with CSS variables
- **State Management**: Svelte 5 runes ($state, $derived, $effect)

## 📝 License

MIT

---

**Made with ⚡ using Claude Code**
