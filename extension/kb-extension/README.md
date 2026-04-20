# KB Extension

A VS Code extension for managing a personal knowledge base with Copilot Chat integration.

## Features

- 📚 **Local-First Knowledge Base** - Store and manage your personal knowledge base locally
- 🤖 **Copilot Chat Integration** - Query your KB through VS Code's Copilot Chat interface
- 🔍 **Vector Search** - Semantic search powered by local embeddings
- 💾 **SQLite Storage** - Persistent document and chunk storage

## Quick Start

### Prerequisites

- VS Code 1.109.0 or higher
- **Node.js 20.20.2** (MODULE_VERSION 115) - Required for better-sqlite3 native module compatibility
- npm 10.8.2 or higher

### Installation

```bash
cd extension/kb-extension
npm install
npm run compile
```

### Build Configuration

**Important**: The extension uses better-sqlite3 native module which requires exact NODE_MODULE_VERSION matching:
- Node.js v20.20.2 (MODULE_VERSION 115) ✅ Tested & working
- System Node v25 (MODULE_VERSION 141) ⚠️ Will cause runtime error

To ensure correct build environment:
```bash
export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
npm install
npm run compile
```

### Available Scripts

- `npm run compile` - Build the extension (requires Node v20)
- `npm run watch` - Watch mode for development
- `npm test` - Run tests
- `npm run lint` - Run ESLint
- `npm run vscode:prepublish` - Prepare for publishing

## Project Structure

```
src/
├── extension.ts        # Main extension entry point
└── test/
    └── extension.test.ts  # Basic extension tests

out/                   # Compiled JavaScript output
.vscode/               # VS Code configuration
├── launch.json         # Debug configuration
└── settings.json       # Extension-specific settings
```

## Development

### Running the Extension

1. Open the project in VS Code
2. Press `F5` to start debugging
3. This opens a new VS Code window with the extension loaded

### Building

```bash
npm run compile    # Single build
npm run watch      # Watch mode for development
```

### Testing

```bash
npm test
```

## Architecture

### Phase 1 (Sprint 1, Week 1)
- ✅ Project scaffolding and TypeScript setup
- 🔄 Storage layer foundation
- 🔄 Configuration management

### Phase 2 (Sprint 1, Week 2)
- Embedding integration
- Vector search implementation
- Chat interface integration

### Phase 3+ (Future)
- Document ingestion pipelines
- Advanced query features
- Performance optimization

## Troubleshooting

### Build Errors

If you encounter TypeScript errors, ensure:
1. `npm install` has completed successfully
2. `tsconfig.json` is present and valid
3. Node modules are not corrupted: `rm -rf node_modules && npm install`

### Extension Won't Load

1. Check `.vscode/settings.json` for valid configuration
2. Review the Debug Console (F5 → Debug Console tab) for errors
3. Verify `out/extension.js` exists after compilation

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

## License

MIT

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
