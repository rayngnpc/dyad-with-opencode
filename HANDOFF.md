# AI Session Handoff

> Last updated: **Tue Mar 25 2026** — Session context for continuing work on Dyad fork. Latest: Fixed v0.40.0 port issues (Node 24 upgrade, TOKEN_COUNT_QUERY_KEY build error, re-enabled Gemini CLI, unlocked Annotator pro gate). Stopped upstream tracking — this is a standalone fork.

---

## 1. User Requests (Chronological)

1. **Turbopack Memory Leak** — "When using Dyad and enter the project, it keeps displaying `Error: Can't resolve 'tailwindcss'` and got memory leak."
2. **Gemini CLI Auth Security Audit** — "Take a look on the current Gemini-cli, antigravity with third party software for Auth method... Is our method safe?"
3. **OpenCode/OpenClaw Ban Concern** — "I'm talking about that current opencode and openclaw auth with gemini and antigravity got account banned." User wants to know if Dyad's Gemini CLI integration risks the same account bans.
4. **Session Mechanism Comparison** — "Is the GEMINI-CLI on Dyad using the same mechanism spawn easy chat as each session just like OpenCode?" (DONE)
5. **Gemini CLI Premature Stopping** — "it show the work for a bit . But then it just hanging after 2 lines of code." (DONE)
6. **Non-Native UI (Basic)** — "it doesn't look like native Dyad to me" — raw tool output instead of file cards/diffs (DONE)
7. **Non-Native UI (Full)** — "it doesn't feel like native interaction when it execute of using tool like native dyad" — ALL tools need native display (DONE)
8. **Explicit Gemini Model Selection** — "Can we add specific models for gemini-cli to be manually use that model?" — User wants all 6 Gemini models selectable (DONE)
9. **Gemini CLI maxOutputTokens for all models** — "add the gemini-3.1-flash-lite with the capacity... Last time we did sometime about capacity that went from 8k to 65k" — All 6 explicit models need `maxOutputTokens: 65536` in `~/.gemini/settings.json` (DONE)
10. **Gemini CLI garbled streaming + wrong tools** — "it stopped mid air... only 30s and it finished... List Directory showing raw JSON, Read showing 'Error reading file'" — Streaming delta bug, wrong tool names, missing tool output (DONE)
11. **Fix ALL CLI providers comprehensively** — "Can you fix this. And find potential bugs and fix it too. So i dont have to comeback here in the future about these kind of stuff. I want it to be native like whatever AI models using on Dyad. Secondly, is opencode have this kind of problem also?" — System prompt conflict, missing project context for Gemini+OpenCode+Letta (DONE)
12. **v0.40.0 build failures** — npm install failed (Node >= 24 required), TOKEN_COUNT_QUERY_KEY missing export, Gemini CLI disabled by Genesis Agent port (DONE)
13. **Unlock Annotator for imported projects** — Pro gate bypass + component-tagger upgrade needed for imported projects (DONE)
14. **Stop upstream tracking** — User decided this is a standalone fork, no more rebasing from dyad-sh/dyad (DONE)

---

## 2. Completed Work

### Fix A: Turbopack Memory Leak (DONE)

**Status**: Code applied, TypeScript check passed. Awaiting user runtime test.

**File Modified**: `src/ipc/handlers/app_handlers.ts`

**Change 1** — `getDefaultCommand()` (line ~67): Added `--webpack` flag to disable Turbopack:

```typescript
function getDefaultCommand(appId: number): string {
  const port = getAppPort(appId);
  // --webpack: Disable Turbopack (Next.js 15.3+). Turbopack + Tailwind v4
  // causes unbounded memory growth during compilation (Next.js issue #91396).
  // The flag is silently ignored by non-Next.js dev servers.
  return `(pnpm install && pnpm run dev --port ${port} --webpack) || (npm install --legacy-peer-deps && npm run dev -- --port ${port} --webpack)`;
}
```

**Change 2** — Spawn env (~line 173): Added `NODE_OPTIONS` with `--max-old-space-size=4096`:

```typescript
NODE_OPTIONS: [process.env.NODE_OPTIONS, "--max-old-space-size=4096"]
  .filter(Boolean)
  .join(" "),
```

**Verification**: `npm run ts:main` — zero new errors (2 pre-existing errors in unrelated files).

### Investigation B: Gemini CLI Auth Security Audit (DONE)

**Conclusion: Dyad is SAFE from the OpenCode/OpenClaw ban scenario.**

**Key findings:**

- OpenCode/OpenClaw extracted OAuth refresh tokens from plaintext files (`~/.config/opencode/antigravity-accounts.json`) and replayed them directly against Google's API from a non-Google client — this is what triggered bans
- Dyad spawns the **actual `gemini` CLI binary** as a child process — it never touches tokens directly
- Google sees legitimate Gemini CLI traffic from Dyad, not token replay from an unknown client
- Google's official statement: "Using third-party software to harvest or piggyback on Gemini CLI's OAuth authentication to access our backend services is a direct violation"
- Dyad does NOT piggyback — it delegates to the real CLI

**Risk assessment:**

| Factor              | Dyad (SAFE)                   | OpenCode/OpenClaw (BANNED)                |
| ------------------- | ----------------------------- | ----------------------------------------- |
| How it calls Gemini | Spawns real `gemini` binary   | Extracts OAuth tokens, calls API directly |
| Auth handling       | Never touches tokens          | Reads token files, injects into HTTP      |
| What Google sees    | Legitimate Gemini CLI traffic | Unknown client with stolen tokens         |
| Ban risk            | LOW                           | HIGH — direct ToS violation               |

**Remaining low risks for Dyad:**

- `--yolo` flag could cause abnormal usage patterns if overused
- `...process.env` passthrough exposes all env vars to child process (not a ban risk, but a general security hygiene issue)
- If Google ever prohibits programmatic CLI invocation (unlikely — breaks CI/CD)

**Recommended improvement**: Sanitize environment before spawning Gemini CLI (whitelist only needed vars instead of `...process.env`).

---

### Fix D: Gemini CLI Premature Stopping — maxOutputTokens (DONE)

**Problem**: Gemini CLI stops generating after ~2 minutes. This was a confirmed bug: CLI defaults `maxOutputTokens` to 8,192 tokens when ALL models support 65,536. Upstream issue: [github.com/google-gemini/gemini-cli/issues/23081](https://github.com/google-gemini/gemini-cli/issues/23081)

**Fix Applied**: Added `customAliases.chat-base` in `~/.gemini/settings.json`:

```json
"modelConfigs": {
  "customAliases": {
    "chat-base": {
      "extends": "base",
      "modelConfig": {
        "generateContentConfig": {
          "thinkingConfig": { "includeThoughts": true },
          "temperature": 1, "topP": 0.95, "topK": 64,
          "maxOutputTokens": 65536
        }
      }
    }
  }
}
```

**Verification**:

- `customAliases` feature confirmed present in v0.34.0 (modelConfigService.js line 48)
- Config format verified correct — deep merge applies after built-in aliases
- LSP diagnostics: zero errors on `gemini_cli_provider.ts`

**Important Note**: The config applies to NEW sessions. On fresh Dyad restart, the first message creates a new session with `maxOutputTokens: 65536`. Subsequent messages using `--resume latest` continue that session. Previous test failure likely from resuming a pre-config session.

---

### Fix E: Non-Native UI — Dyad XML Tags (DONE)

**Problem**: Gemini CLI outputs raw tool messages ("Using tool: write_file / Tool completed") instead of Dyad's native file cards, diffs, and previews.

**Root Cause**: Gemini CLI in `--yolo` mode executes its OWN tools (`write_file`, `replace`, `read_file`) and outputs JSON events. Dyad's `processFullResponseActions` looks for `<dyad-write>`, `<dyad-search-replace>` XML tags — but none were being produced.

**Solution**: Convert `tool_use` JSON events to Dyad XML tags in `gemini_cli_provider.ts`:

**Changes in `src/ipc/utils/gemini_cli_provider.ts`** (now 668 lines):

1. **Helper functions added** (lines 84-98):

```typescript
function toRelativePath(filePath: string, cwd: string): string {
  if (path.isAbsolute(filePath) && filePath.startsWith(cwd)) {
    const rel = path.relative(cwd, filePath);
    return rel || filePath;
  }
  return filePath;
}

function escapeXmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
```

2. **`tool_use` handler** (lines 405-471): Converts file operations to native tags:

   - `write_file` → `<dyad-write path="..." description="...">content</dyad-write>`
   - `replace` → `<dyad-search-replace path="..." description="..."><<<<<<< SEARCH\n...\n=======\n...\n>>>>>>> REPLACE</dyad-search-replace>`
   - Other tools → plain text markdown (unchanged)

3. **`tool_result` handler** (lines 472-489): Suppresses duplicate display for file tools that were converted to native tags.

**Verification**: LSP diagnostics clean — zero errors.

---

### Fix F: MCP Server Hang — vibe_kanban Removed (DONE)

**Problem**: `vibe_kanban` MCP server was failing with `MCP error -32000: Connection closed`, causing Gemini CLI to hang during MCP discovery.

**Fix Applied**: Removed `vibe_kanban` from `~/.gemini/settings.json`. Kept working MCPs: `n8n`, `perplexity`, `perplexity_expert`.

---

### Fix G: Double-Execution Safety Analysis (DONE)

**Concern**: With `--yolo` enabled, Gemini CLI writes files to disk AND Dyad's `processFullResponseActions` tries to write the same files from `<dyad-write>` tags.

**Analysis & Resolution**:

- **`<dyad-write>` tags**: Harmless — writes identical content over what CLI already wrote (same result)
- **`<dyad-search-replace>` tags**: The search string won't be found (CLI already applied it), so `response_processor.ts` logs a warning and skips. No harm.
- **Git commits**: Still work — the uncommitted files fallback (line 546-570 in response_processor.ts) catches ALL changes Gemini CLI made and amends them into the commit.

**Result**: Safe to use as-is. No code changes needed.

---

### Fix H: Full Native Tool Display — All Gemini CLI Tools (DONE)

**Problem**: Only `write_file` and `replace` were converted to native Dyad tags. Other tools (`read_file`, `shell`, `glob`, `web_search`) showed generic markdown: "**Using tool: tool_name**"

**Solution**: Extended tool conversion in `gemini_cli_provider.ts` to support ALL tools with native UI:

**Changes in `src/ipc/utils/gemini_cli_provider.ts`** (now ~750 lines):

1. **New helper functions** (lines ~100-130):

   - `formatToolOutput(output, maxLength)` — Truncates tool output for display
   - `getToolTitle(toolName, params)` — Human-readable titles ("Reading src/app.ts" instead of "read_file")

2. **State tracking** (line ~362):

   - `activeTools` Map — Tracks tool_id → {name, title} for proper result handling

3. **Enhanced `tool_use` handler** — Now converts ALL tools to native tags:

| Gemini CLI Tool | Dyad Native Tag         | Notes                           |
| --------------- | ----------------------- | ------------------------------- |
| `write_file`    | `<dyad-write>`          | Already existed                 |
| `replace`       | `<dyad-search-replace>` | Already existed                 |
| `read_file`     | `<dyad-read>`           | **NEW** — Collapsible file view |
| `glob`          | `<dyad-list-files>`     | **NEW** — Directory listing     |
| `list_dir`      | `<dyad-list-files>`     | **NEW** — Directory listing     |
| `web_search`    | `<dyad-web-search>`     | **NEW** — Search results        |
| `shell`         | `<dyad-output>`         | **NEW** — Command output        |
| Other tools     | Markdown with params    | Shows title + JSON params       |

4. **Enhanced `tool_result` handler**:
   - For native tags: Closes the tag with tool output content
   - For non-native tools: Shows "**Title** completed" with truncated output in code block
   - Proper error handling for failed tools

**Behavior**:

- Tool execution displays with collapsible UI (file reads, writes, edits)
- Progress indicators during tool execution (via unclosed tag detection in `DyadMarkdownParser`)
- Tool output truncated to reasonable lengths (800-2000 chars depending on tool type)
- Generic tools show JSON params if under 300 chars

**Verification**: LSP diagnostics clean, lint clean.

---

### Fix I: Explicit Gemini Model Selection (DONE)

**Problem**: Users could only select "Auto (Gemini 3)" or "Auto (Gemini 2.5)" — no way to select specific models like `gemini-2.5-flash` or `gemini-3.1-pro-preview`.

**Solution**: Expanded the hardcoded model list in `fetchGeminiCliModels()` to include all 6 user-available models.

**File Modified**: `src/ipc/handlers/local_model_gemini_cli_handler.ts`

**Change** (lines 126-168): Replaced 3-model list with 8-model list:

```typescript
const geminiModels: LocalModel[] = [
  // Auto modes
  { modelName: "auto", displayName: "Auto (Gemini 3)", provider: "gemini_cli" },
  { modelName: "manual", displayName: "Manual", provider: "gemini_cli" },
  // Gemini 3.x series
  {
    modelName: "gemini-3.1-pro-preview",
    displayName: "Gemini 3.1 Pro (Preview)",
    provider: "gemini_cli",
  },
  {
    modelName: "gemini-3-flash-preview",
    displayName: "Gemini 3 Flash (Preview)",
    provider: "gemini_cli",
  },
  {
    modelName: "gemini-3.1-flash-lite-preview",
    displayName: "Gemini 3.1 Flash Lite (Preview)",
    provider: "gemini_cli",
  },
  // Gemini 2.5 series
  {
    modelName: "gemini-2.5-pro",
    displayName: "Gemini 2.5 Pro",
    provider: "gemini_cli",
  },
  {
    modelName: "gemini-2.5-flash",
    displayName: "Gemini 2.5 Flash",
    provider: "gemini_cli",
  },
  {
    modelName: "gemini-2.5-flash-lite",
    displayName: "Gemini 2.5 Flash Lite",
    provider: "gemini_cli",
  },
];
```

**How it works**: The architecture already supported explicit models:

- `gemini_cli_provider.ts` passes `--model {modelName}` when model is not "auto" or "manual"
- `ModelPicker.tsx` renders whatever models `fetchGeminiCliModels()` returns
- No other files needed changes

**Verification**: `npm run ts:main` — 2 pre-existing errors (unrelated), no new errors.

**User action required**: Restart Dyad. Models will appear in **Local models → Gemini CLI** dropdown.

---

### Fix J: CLI Provider System Prompt + Streaming Fixes (DONE)

**Problem**: ALL three CLI providers (Gemini, OpenCode, Letta) were prepending Dyad's full system prompt (containing `<dyad-write>` tag instructions) to CLI messages. This confused CLI models because:
1. Dyad's system prompt tells the AI to use `<dyad-write>` tags — but CLI tools have their OWN tools (`write_file`, `replace`, etc.)
2. The conflicting instructions caused models to produce garbled output or fail to use their native tools properly
3. CLI models never received actual project context (package.json, tailwind config, etc.)

Additionally, Gemini CLI had streaming and tool name bugs:
- **Garbled streaming**: Delta parsing used `content.slice(lastContent.length)` assuming accumulated text, but Gemini CLI sends actual deltas
- **Wrong tool names**: Used old names (`list_dir`, `shell`, `web_search`) instead of v0.34.0 names (`list_directory`, `run_shell_command`, `google_web_search`)
- **False "Error reading file"**: `read_file` tool returned `output: undefined` on success (result was in a different field)
- **Error as object**: Gemini CLI sends `error: { type, message }` not `error: "string"`

**Solution**: Created shared `cli_context.ts` utility and updated all 3 CLI providers.

**Files Modified**:

1. **`src/ipc/utils/cli_context.ts`** (NEW — shared utility):
   - `buildCliProjectContext(cwd)` — Reads key config files (package.json, tailwind, tsconfig, vite/next config, AI_RULES.md) and returns `<project_context>` tagged content
   - `extractCliUserMessage(prompt)` — Extracts last user message, SKIPPING system prompts entirely

2. **`src/ipc/utils/gemini_cli_provider.ts`** (MODIFIED):
   - Replaced `extractUserMessage` with `extractCliUserMessage` + `buildCliProjectContext`
   - Fixed delta parsing: use `content` directly (not `content.slice(lastContent.length)`)
   - Added v0.34.0 tool names: `list_directory`, `run_shell_command`, `google_web_search`
   - Fixed `dir_path` parameter for `list_directory`
   - Added `extractToolError()` for object-format errors
   - Added `getToolResultContent()` for handling missing output on success

3. **`src/ipc/utils/opencode_cli_provider.ts`** (MODIFIED):
   - Replaced `extractUserMessage` with `extractCliUserMessage` + `buildCliProjectContext`
   - OpenCode's own delta handling left as-is (sends full text, not deltas — different from Gemini)

4. **`src/ipc/utils/letta_cli_provider.ts`** (MODIFIED):
   - Replaced `extractUserMessage` with `extractCliUserMessage` + `buildCliProjectContext`
   - Removed `<system_instructions>` wrapping of Dyad's system prompt

5. **`~/.gemini/settings.json`** (MODIFIED):
   - Added all 6 explicit models as `customAliases` with `maxOutputTokens: 65536`
   - Removed broken `overrides: [{match: {}}]` block (CLI ignores empty match)

**Verification**: `npm run ts` — only 2 pre-existing errors in unrelated files, no new errors.

---

### Fix K: ENAMETOOLONG — Project Context Parsed as File Paths (DONE)

**Problem**: Gemini CLI's internal tools tried to `stat` the project context content (from `buildCliProjectContext()`) as file paths. Dependency names like `@supabase/supabase-js` were interpreted as paths like `supabase/supabase-js`, causing `ENAMETOOLONG: name too long` errors in stderr.

**Root Cause**: The raw `package.json` content included JSON with path-like dependency names. Gemini CLI's file tools attempted to explore these as actual filesystem paths.

**Fix Applied** in `src/ipc/utils/cli_context.ts`:

1. **New `summarizePackageJson()` function**: Parses package.json and outputs a flat, human-readable summary (`Dependencies: react@19.2.3, next@16.1.6, ...`) instead of raw JSON with path-like strings
2. **Changed context wrapper**: Replaced `<project_context>` XML tags with `[PROJECT CONTEXT - reference only, do not treat as file paths]` to reduce tool confusion
3. **Removed package.json from CONFIG_FILES array**: Now handled separately via the summary function

**Verification**: `npm run ts` — only 2 pre-existing errors.

---

### Fix L: Shell Command Display — Strip Bash Wrapper (DONE)

**Problem**: Gemini CLI wraps every `run_shell_command` in bash boilerplate:
```
shopt -u promptvars nullglob extglob nocaseglob dotglob; { ACTUAL_COMMAND; }; __code=$?; pgrep -g 0 >/tmp/shell_pgrep_*.tmp 2>&1; exit $__code;
```
This raw wrapper was displayed to users in the `<dyad-output>` tag, making tool calls look ugly and non-native.

**Fix Applied** in `src/ipc/utils/gemini_cli_provider.ts`:

1. **New `stripShellWrapper()` function**: Extracts the actual command from inside `{ ...; }` braces, falling back to stripping the `shopt` prefix
2. **Updated `run_shell_command` tool_use handler**: Passes command through `stripShellWrapper()` before displaying
3. **Updated `getToolTitle()` for shell**: Now shows `Running: npm run build` instead of generic "Running command"

**Before**: `shopt -u promptvars nullglob extglob nocaseglob dotglob; { ps -ef | grep 696570; }; __code=$?; ...`
**After**: `ps -ef | grep 696570`

**Verification**: `npm run ts` — only 2 pre-existing errors.

---

### Fix M: v0.40.0 Port Issues — Node 24, Build Errors, Gemini CLI (DONE)

**Problem**: Genesis Agent ported custom CLI providers onto Dyad v0.40.0 (commit `1a5b322`, ~500 upstream commits). This introduced several issues:

1. **Node >= 24 required** — Electron 40 requires Node 24+. User had v20.19.2.
2. **`TOKEN_COUNT_QUERY_KEY` missing** — `ModelPicker.tsx` imported a symbol removed during upstream refactoring.
3. **Gemini CLI disabled** — Genesis Agent conservatively threw an error in the `gemini_cli` case of `get_model_client.ts`.

**Fixes Applied**:

1. **Node 24**: Installed `fnm` (Fast Node Manager), set Node v24.14.1 as default. Config in `~/.zshrc`.

2. **`src/components/ModelPicker.tsx`**: Replaced removed import with centralized query keys:
   ```typescript
   // Before (broken):
   import { TOKEN_COUNT_QUERY_KEY } from "@/hooks/useCountTokens";
   queryClient.invalidateQueries({ queryKey: TOKEN_COUNT_QUERY_KEY });

   // After (fixed):
   import { queryKeys } from "@/lib/queryKeys";
   queryClient.invalidateQueries({ queryKey: queryKeys.tokenCount.all });
   ```

3. **`src/ipc/utils/get_model_client.ts`**: Re-enabled Gemini CLI provider:
   ```typescript
   // Before (disabled):
   // import { createGeminiCliProvider } from "./gemini_cli_provider"; // DISABLED: ban risk
   case "gemini_cli": { throw new Error("...disabled due to Google account ban risk..."); }

   // After (enabled):
   import { createGeminiCliProvider } from "./gemini_cli_provider";
   case "gemini_cli": {
     const provider = createGeminiCliProvider();
     return { modelClient: { model: provider(model.name) }, backupModelClients: [] };
   }
   ```

**Verification**: `npm run build` succeeded. TypeScript: 0 errors.

---

### Fix N: Unlock Annotator Pro Gate (DONE)

**Problem**: Annotator (pen icon in preview panel) was gated behind Dyad Pro subscription check.

**Fix Applied** in `src/components/preview_panel/PreviewIframe.tsx`:
```typescript
// Before: const isProMode = !!userBudget;
const isProMode = true; // Enabled for local fork
```

**Note for imported projects**: The annotator also requires the `@dyad-sh/react-vite-component-tagger` Vite plugin to add `data-dyad-id` attributes to React components. Without this, the component selector script can't find elements and the buttons stay disabled. To fix: go to **App Details → App Upgrades → "Enable select component to edit"** and click Upgrade. This is handled by `src/ipc/handlers/app_upgrade_handlers.ts`.

**Verification**: TypeScript: 0 errors.

---

### Decision O: Standalone Fork — No Upstream Tracking (2026-03-25)

**Decision**: This repo is a standalone fork of Dyad v0.40.0. No more rebasing or merging from `dyad-sh/dyad`.

**Reason**: Each upstream rebase breaks custom CLI provider code. Genesis Agent's v0.40.0 port introduced multiple bugs that required manual fixes.

**Status**: Only `origin` remote exists (`rayngnpc/dyad-with-cli`). No `upstream` remote configured.

---

### Fix P: inotify File Watcher Limit (PENDING USER ACTION)

**Problem**: `npm start` fails with `ENOSPC: System limit for number of file watchers reached`. Vite can't watch all project files.

**Current limit**: 186,827 (too low for Vite + multiple repos + browser).

**Fix**: User needs to run:
```bash
sudo sysctl fs.inotify.max_user_watches=524288
sudo sysctl fs.inotify.max_user_instances=1024
```

To make permanent:
```bash
echo 'fs.inotify.max_user_watches=524288' | sudo tee -a /etc/sysctl.d/50-inotify.conf
echo 'fs.inotify.max_user_instances=1024' | sudo tee -a /etc/sysctl.d/50-inotify.conf
sudo sysctl --system
```

---

## 3. Past Investigations (All DONE)

### Investigation C: Dyad vs OpenCode Session Spawning Mechanism (DONE)

**Question**: Does Dyad use the same Gemini CLI session mechanism as OpenCode?
**Answer**: No — they are fundamentally different. Dyad spawns the real CLI. OpenCode uses HTTP API.

**Dyad's approach** (fully understood from `src/ipc/utils/gemini_cli_provider.ts`):

- Spawns `gemini` binary via `child_process.spawn()`
- Each chat message = new process spawn with `--output-format stream-json --yolo -p "message"`
- Session continuity via `--resume latest` flag (added after first successful message)
- Session tracked per app via `initializedSessions` Set (keyed by `app-{appId}`)
- Working directory set to the app's project directory
- Process lifecycle: spawn → stream stdout/stderr → parse JSON events → kill on close/abort
- No persistent connection — each message is a fresh process

**OpenCode's approach** (confirmed from source code at `github.com/sst/opencode`):

- OpenCode does **NOT** spawn the `gemini` CLI binary — it uses `@ai-sdk/google` HTTP API SDK
- Gemini integration is via direct API calls with `x-goog-api-key` header, not CLI spawning
- No `--yolo`, `--resume`, `--output-format` flags — those are CLI-only concepts
- GitHub Issue #402 ("Allow using Gemini CLI for free requests") confirms this is NOT supported natively
- Community workarounds exist (`CLIProxyAPI`, `opencode-gemini-auth`) but these extract OAuth tokens — which is exactly what caused the bans
- A community plugin `opencode-claude-code-plugin` spawns Claude CLI as subprocess (similar pattern to Dyad's Gemini integration), but there is no equivalent for Gemini CLI

**Conclusion**: Dyad and OpenCode use fundamentally different mechanisms. Dyad spawns the real CLI binary (safe). OpenCode uses HTTP API (also safe with API keys, but community plugins that extract OAuth tokens caused the bans).

---

## 4. Key Files Reference

| File                                                 | Purpose                                                | Lines |
| ---------------------------------------------------- | ------------------------------------------------------ | ----- |
| `src/ipc/handlers/app_handlers.ts`                   | App process management, dev server spawning (MODIFIED) | 1621  |
| `src/ipc/utils/cli_context.ts`                       | Shared CLI context: project files + message extraction | 141   |
| `src/ipc/utils/gemini_cli_provider.ts`               | Gemini CLI spawn, streaming, native tags (MODIFIED)    | ~837  |
| `src/ipc/utils/opencode_cli_provider.ts`             | OpenCode CLI spawn, streaming (MODIFIED)               | ~614  |
| `src/ipc/utils/letta_cli_provider.ts`                | Letta CLI spawn, streaming (MODIFIED)                  | ~583  |
| `src/ipc/handlers/local_model_gemini_cli_handler.ts` | Gemini CLI detection, model listing, path resolution   | 297   |
| `src/ipc/handlers/chat_stream_handlers.ts`           | Where CLI providers are invoked                        | —     |
| `src/ipc/utils/get_model_client.ts`                  | Model client selection logic                           | —     |
| `~/.gemini/settings.json`                            | Gemini CLI config, MCP servers (MODIFIED)              | 111   |

---

## 5. User's System

- **OS**: Debian 13 (trixie), x86_64, ~24GB RAM
- **Node.js**: v24.14.1 via fnm (system node is v20.19.2 at /usr/bin/node)
- **Shell**: zsh — fnm config in `~/.zshrc`, must `source ~/.zshrc` in new terminals
- **Dyad**: v0.40.0 (standalone fork, NOT tracking upstream)
- **Electron**: 40.0.0
- **Gemini CLI**: v0.34.0
- **OpenCode CLI**: v1.1.7
- **Letta CLI**: v0.18.4
- **Ollama/LM Studio**: Not running (connection refused in logs — expected/benign)
- **Repos**: `~/Dyad-Project/dyad-myself` and `~/Dyad-Project/dyad-with-cli` are the same repo (identical commits, same remote)

---

## 6. Explicit Constraints

- **DO NOT** kill existing processes with `pkill` — it killed the user's running Dyad instance previously
- **DO NOT** try to start Electron via `nohup` — GUI apps need interactive terminal
- **DO NOT** rebase or merge from upstream `dyad-sh/dyad` — this is a standalone fork
- User will manually start Dyad and test; agent should analyze logs
- TypeScript errors: some pre-existing type errors in UI components (asChild, onCloseAutoFocus) — do not attempt to fix
- **inotify limit**: If `npm start` hangs, user needs `sudo sysctl fs.inotify.max_user_watches=524288`

---

## 7. Gemini CLI Session Architecture (Dyad)

```
User sends chat message in Dyad UI
  └─> chat_stream_handlers.ts receives IPC
       └─> setGeminiCliWorkingDirectory(appDir)
       └─> setGeminiCliSessionKey("app-{appId}")
       └─> gemini_cli_provider.doStream()
            ├─ First message: spawn gemini --output-format stream-json --yolo -p "msg"
            ├─ Subsequent: spawn gemini --output-format stream-json --yolo --resume latest -p "msg"
            ├─ Parse stdout line-by-line as JSON events (init, message, tool_use, tool_result, result)
            ├─ Stream text deltas to frontend via ReadableStream
            └─ On "result" event with success: markSessionInitialized()
```

**Key detail**: Each message spawns a NEW `gemini` process. Session state lives inside Gemini CLI's own session storage (in `~/.gemini/`), not in Dyad. The `--resume latest` flag tells Gemini CLI to continue the most recent session in that working directory.

---

## 8. Known Gaps / Future Work

| Gap | Provider | Description | Priority |
|-----|----------|-------------|----------|
| No native Dyad tags | OpenCode | Tool calls shown as plain markdown, not `<dyad-write>`, `<dyad-read>`, etc. | Medium |
| No native Dyad tags | Letta | Same as OpenCode — tool calls shown as markdown text | Medium |
| No structured codebase | All CLI | Native API models get `CodebaseFile` objects via `providerOptions`; CLI providers only get text-based project context from `buildCliProjectContext()` | Low |
| No cross-app context | All CLI | Native models receive `mentionedApps` codebase; CLI providers don't | Low |
| No smart context mode | All CLI | Native models support "deep"/"balanced" context strategies; CLI providers use static config file list | Low |

**Note**: The native Dyad tag gap for OpenCode/Letta means their tool executions (file writes, reads, shell commands) render as markdown code blocks instead of Dyad's rich UI components (collapsible file cards, diffs, etc.). Gemini CLI already has full native tag synthesis (Fix H above).

---

## 9. Security Audit Details

### Gemini CLI Token Storage (v0.34.0)

- **Primary**: OS keychain via `keytar` (Keychain Access on macOS, libsecret on Linux)
- **Fallback**: AES-256-GCM encrypted file at `~/.gemini/gemini-credentials.json`
- **Legacy**: Plaintext `~/.gemini/oauth_creds.json` may exist from older versions

### Known CVEs in Gemini CLI v0.34.0

- **CVE-2026-28292** (Medium) — simple-git dependency vulnerability
- **Sandbox bypass** via `LD_PRELOAD` / `NODE_OPTIONS` injection
- **HITL bypass** via UI truncation/newline injection
- **API key leakage** in tool output

### Google's Ban Enforcement (Feb 2026)

- Mass account suspensions for Antigravity token reuse via third-party tools
- Affected paid $250/mo Ultra subscribers — no warnings, no refunds
- Official position: any use of Antigravity/Gemini CLI OAuth tokens outside Google's own clients = ToS violation
- Dyad is NOT in this category because it runs the real `gemini` binary
