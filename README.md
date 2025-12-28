# Dyad with OpenCode 🚀

**This is a feature-rich fork of [Dyad](https://dyad.sh/) that adds native support for local AI agents and CLIs.**

While the original Dyad focuses on cloud models and basic local inference (Ollama), this version unlocks the power of advanced local tools:

- **OpenCode Interpreter**: Run code-interpreting agents locally.
- **Letta Agents**: Run stateful, memory-aware agents locally (formerly MemGPT).
- **Google Gemini CLI**: Use Gemini 1.5/Pro models via terminal integration.

> **Note**: This is a community fork. For the official Dyad project, visit [dyad.sh](https://dyad.sh/).

## 🌟 New Features in This Fork

### 1. OpenCode Integration

Use [OpenCode](https://opencode.ai) directly within Dyad.

- **Code Execution**: The model can write and run code to solve complex tasks.
- **Local Privacy**: All code runs in your local environment.

### 2. Letta Agent Support

Integrates [Letta](https://docs.letta.com) (stateful agents).

- **Long-term Memory**: Agents that remember context across sessions.
- **Stateful Interactions**: Perfect for complex, multi-turn coding tasks.

### 3. Google Gemini CLI Support

Connects to local Gemini CLI wrappers.

- **Access Latest Models**: Use Gemini 1.5 Pro, Flash, and more.

---

## 🔌 Setup Guide

To use these new features, you must install the respective CLI tools.

### 🛠️ Setting up OpenCode

1. Download OpenCode from [opencode.ai](https://opencode.ai).
2. Ensure `opencode` is in your system PATH.
3. Verify it works in your terminal:
   ```bash
   opencode --version
   ```

### 🛠️ Setting up Letta

Letta is the engine behind stateful agents (forked from MemGPT).

1. Install Letta via pip:
   ```bash
   pip install letta
   ```
2. Verify installation:
   ```bash
   letta --version
   ```
3. (Optional) Login to Letta Cloud or run a local server:
   ```bash
   letta login
   # OR
   letta server
   ```

### 🛠️ Setting up Gemini CLI

**⚠️ Important**: This integration is designed for the community `gemini-cli` tool (often installed via `pip install gemini-cli` from specific repositories) that supports the `--yolo` flag.

1. Ensure you have a `gemini` command in your path that accepts `--yolo` and `--output-format json`.
2. If you are using the official Google Cloud SDK, this integration might need a wrapper.
3. Verify: `gemini --version`

---

## 📦 Download & Run

**Requirements:** Node.js 20+

```bash
# Clone this repo
git clone https://github.com/rayngnpc/dyad-with-opencode.git
cd dyad-with-opencode

# Install dependencies
npm install

# (Linux only) Rebuild native modules if you get SQLite errors
npm rebuild better-sqlite3

# Create database directory and initialize DB
mkdir -p userData
npm run db:push

# Run the app
npm start
```

---

## Original Dyad Features

- ⚡️ **Local**: Fast, private and no lock-in.
- 🛠 **Bring your own keys**: Use your own AI API keys — no vendor lock-in.
- 🖥️ **Cross-platform**: Easy to run on Mac, Windows, or Linux.

## 🤝 Community

This fork is maintained by the community.

- Report issues in the [Issues tab](https://github.com/rayngnpc/dyad-with-opencode/issues).
- For the official Dyad community: [r/dyadbuilders](https://www.reddit.com/r/dyadbuilders/).

## License

- Code outside `src/pro`: Apache 2.0 (Open Source)
- Code inside `src/pro`: Functional Source License 1.1 (Fair Source)

See [LICENSE](./LICENSE) for details.
