# Dyad with Local AI Agents 🚀

**This is a feature-rich fork of [Dyad](https://dyad.sh/) that adds native support for local AI agents and CLIs.**

While the original Dyad focuses on cloud models and basic local inference (Ollama), this version unlocks the power of advanced local tools:

- **OpenCode**: Run AI coding agents locally with tool execution.
- **Letta Agents**: Run stateful, memory-aware agents locally (formerly MemGPT).
- **Google Gemini CLI**: Use Gemini 2.5 Pro and other models via the official CLI.

> **Note**: This is a community fork. For the official Dyad project, visit [dyad.sh](https://dyad.sh/).

## 🌟 New Features in This Fork

### 1. OpenCode Integration

Use [OpenCode](https://opencode.ai) directly within Dyad.

- **Code Execution**: The model can write and run code to solve complex tasks.
- **Tool Use**: Full access to file system, shell commands, and more.
- **Local Privacy**: All code runs in your local environment.

### 2. Letta Agent Support

Integrates [Letta](https://docs.letta.com) (stateful agents).

- **Long-term Memory**: Agents that remember context across sessions.
- **Stateful Interactions**: Perfect for complex, multi-turn coding tasks.

### 3. Google Gemini CLI Support

Connects to Google's official [Gemini CLI](https://github.com/google-gemini/gemini-cli).

- **Access Latest Models**: Use Gemini 2.5 Pro, Flash, and future models.
- **Agentic Features**: Full tool execution and code interpretation.

---

## 🔌 Setup Guide

To use these new features, you must install and **authenticate** the respective CLI tools.

### 🛠️ Setting up OpenCode

1. Install OpenCode following [official instructions](https://opencode.ai).

2. **Authenticate** (required for models to appear in Dyad):

   ```bash
   opencode auth login
   ```

3. Verify it works:

   ```bash
   opencode --version
   opencode models  # Should list available models
   ```

4. **Restart Dyad** after authentication - models will appear in the provider list.

### 🛠️ Setting up Letta

Letta is the engine behind stateful agents (forked from MemGPT).

1. Install Letta:

   ```bash
   pip install letta
   # OR via pipx (recommended)
   pipx install letta
   ```

2. **Authenticate** (required for models to appear in Dyad):

   ```bash
   letta login
   ```

   This opens a browser for Letta Cloud OAuth.

3. Verify installation:

   ```bash
   letta --version
   ```

4. **Restart Dyad** after authentication - Letta models will appear.

### 🛠️ Setting up Gemini CLI

This integration uses Google's official [Gemini CLI](https://github.com/google-gemini/gemini-cli).

1. Install via npm:

   ```bash
   npm install -g @anthropic-ai/gemini-cli
   # OR
   npx @anthropic-ai/gemini-cli
   ```

2. **Authenticate** (required for models to appear in Dyad):

   ```bash
   gemini auth login
   ```

   This opens a browser for Google OAuth.

3. Verify:

   ```bash
   gemini --version
   ```

4. **Restart Dyad** after authentication - Gemini models will appear.

---

## ⚠️ Important: Models Won't Appear Until You Authenticate

After installing each CLI tool, you **must authenticate** before models appear in Dyad:

| Tool       | Auth Command          | What Happens                        |
| ---------- | --------------------- | ----------------------------------- |
| OpenCode   | `opencode auth login` | Opens browser for auth              |
| Letta      | `letta login`         | Opens browser for Letta Cloud OAuth |
| Gemini CLI | `gemini auth login`   | Opens browser for Google OAuth      |

After authenticating, **restart Dyad** to see the new models in your provider list.

---

## 📦 Download & Run

**Requirements:** Node.js 20+

### Quick Start (Linux - Recommended)

```bash
git clone https://github.com/rayngnpc/dyad-with-opencode.git
cd dyad-with-opencode
./setup.sh
npm start
```

### Manual Setup (All Platforms)

```bash
git clone https://github.com/rayngnpc/dyad-with-opencode.git
cd dyad-with-opencode

npm install
npm rebuild better-sqlite3    # Required on Linux
mkdir -p userData
npm run db:push
npm start
```

### Building Installers

You can build platform-specific installers:

```bash
# Build for your current platform
npm run make

# Outputs:
# - Linux: out/make/deb/x64/*.deb, out/make/rpm/x64/*.rpm
# - Windows: out/make/squirrel.windows/x64/*.exe
# - macOS: out/make/zip/darwin/x64/*.zip
```

> **Note**: Cross-platform builds require the target OS. Build .exe on Windows, .deb on Linux, .dmg on macOS.

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
