# Dyad with OpenCode 🚀

**This is a feature-rich fork of [Dyad](https://dyad.sh/) that adds native support for local AI agents and CLIs.**

While the original Dyad focuses on cloud models and basic local inference (Ollama), this version unlocks the power of advanced local tools:

- **OpenCode Interpreter**: Run code-interpreting agents locally.
- **Google Gemini CLI**: Use Gemini 1.5/Pro models directly from your terminal integration.
- **Letta Agents**: Run stateful, memory-aware agents locally.

> **Note**: This is a community fork. For the official Dyad project, visit [dyad.sh](https://dyad.sh/).

## 🌟 New Features in This Fork

### 1. OpenCode Integration

Use [OpenCode](https://opencode.ai) directly within Dyad.

- **Code Execution**: The model can write and run code to solve complex tasks.
- **Local Privacy**: All code runs in your local environment.
- **No API Keys Needed**: Uses your local OpenCode installation.

### 2. Google Gemini CLI Support

Connects to your local [Gemini CLI](https://github.com/google-gemini/gemini-cli).

- **Access Latest Models**: Use Gemini 1.5 Pro, Flash, and more.
- **Free Tier**: Leverage the generous free tier of Gemini via the CLI.

### 3. Letta Agent Support

Integrates [Letta](https://github.com/letta-ai/letta-code) (formerly MemGPT-like agents).

- **Long-term Memory**: Agents that remember context across sessions.
- **Stateful Interactions**: Perfect for complex, multi-turn coding tasks.

---

## 🔌 Setup Guide

To use these new features, simply install the CLI tools you want to use. Dyad will automatically detect them.

### 🛠️ Setting up OpenCode

1. Download OpenCode from [opencode.ai](https://opencode.ai).
2. Ensure `opencode` is in your system PATH.
3. Verify it works in your terminal:
   ```bash
   opencode --version
   ```

### 🛠️ Setting up Gemini CLI

1. Install the CLI tool:
   ```bash
   pip install gemini-cli  # or follow official instructions
   ```
2. Authenticate with Google:
   ```bash
   gemini auth login
   ```

### 🛠️ Setting up Letta

1. Install Letta:
   ```bash
   pip install letta
   ```
2. Start the Letta server or ensure the CLI is accessible.

---

## 📦 Download & Run

Since this is a fork, you'll likely want to build it yourself or download releases from this repository (once available).

```bash
# Clone this repo
git clone https://github.com/rayngnpc/dyad-with-opencode.git

# Install dependencies
npm install

# Run locally
npm run dev
```

---

## Original Dyad Features

- ⚡️ **Local**: Fast, private and no lock-in.
- 🛠 **Bring your own keys**: Use your own AI API keys — no vendor lock-in.
- 🖥️ **Cross-platform**: Easy to run on Mac or Windows.

## 🤝 Community

This fork is maintained by the community.

- Report issues in the [Issues tab](https://github.com/rayngnpc/dyad-with-opencode/issues).
- For the official Dyad community: [r/dyadbuilders](https://www.reddit.com/r/dyadbuilders/).

## License

- Code outside `src/pro`: Apache 2.0 (Open Source)
- Code inside `src/pro`: Functional Source License 1.1 (Fair Source)

See [LICENSE](./LICENSE) for details.
