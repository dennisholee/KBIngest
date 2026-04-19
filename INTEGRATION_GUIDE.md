# KB Extension Integration Guide

**Version:** 1.0.0  
**Last Updated:** April 19, 2026  
**Status:** Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Extension Dependencies](#extension-dependencies)
4. [API Reference](#api-reference)
5. [Configuration](#configuration)
6. [Chat Participant Integration](#chat-participant-integration)
7. [Command Integration](#command-integration)
8. [Secret Storage](#secret-storage)
9. [Code Examples](#code-examples)
10. [Best Practices](#best-practices)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The **KB Extension** provides a comprehensive knowledge base management system integrated with **GitHub Copilot Chat**. This guide shows how to integrate KB Extension capabilities into your own VS Code extensions and applications.

### Key Features

- 🔍 **Full-Text Search** - Search ingested documents
- 💬 **Chat Integration** - Natural language queries via Copilot Chat
- 📄 **Multi-Format Support** - Markdown, Plain Text, PDF
- 🔐 **Secure Credentials** - Built-in secret storage
- ⚙️ **Configurable** - Workspace and global settings
- 🧠 **Smart Embedding** - AI-powered document understanding

---

## Quick Start

### 1. Install KB Extension

```bash
code --install-extension /Users/dennislee/Devs/KBIngest/kb-extension-0.0.1.vsix
```

### 2. Reference in Your Extension

Add to your `package.json`:

```json
{
  "extensionDependencies": [
    "publisher.kb-extension"
  ]
}
```

### 3. Execute KB Commands

```typescript
import * as vscode from 'vscode';

await vscode.commands.executeCommand('kb-extension.helloWorld');
```

---

## Extension Dependencies

### Declaring KB Extension as a Dependency

In your extension's `package.json`:

```json
{
  "name": "my-extension",
  "displayName": "My Extension",
  "version": "1.0.0",
  "engines": {
    "vscode": "^1.116.0"
  },
  "extensionDependencies": [
    "publisher.kb-extension"
  ],
  "activationEvents": [
    "onStartupFinished"
  ]
}
```

### Checking if KB Extension is Available

```typescript
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  const kbExtension = vscode.extensions.getExtension('publisher.kb-extension');
  
  if (!kbExtension) {
    vscode.window.showErrorMessage('KB Extension is not installed');
    return;
  }
  
  // KB Extension is available
  await useKBExtension();
}

async function useKBExtension() {
  // Now safe to use KB commands
}
```

---

## API Reference

### Available Commands

#### `kb-extension.helloWorld`

Test command that displays a greeting message.

```typescript
await vscode.commands.executeCommand('kb-extension.helloWorld');
```

**Returns:** void  
**Example Output:** "Hello from KB Extension!"

---

#### `kb-extension.showDiagnostics`

Display configuration, storage statistics, and system information.

```typescript
await vscode.commands.executeCommand('kb-extension.showDiagnostics');
```

**Returns:** void  
**Output:** Diagnostics panel showing:
- Storage path
- Database size
- Configuration settings
- Document count
- Total tokens

---

#### `kb-extension.storeApiKey`

Store an API key securely using VS Code's secret storage.

```typescript
await vscode.commands.executeCommand('kb-extension.storeApiKey', 'my-api-key');
```

**Parameters:**
- `apiKey` (string) - The API key to store

**Returns:** void  
**Storage:** Encrypted in system keychain

---

### Chat Participant API

Interact with the KB chat participant for natural language queries.

#### Basic Chat Request

```typescript
import * as vscode from 'vscode';

const response = await vscode.chat.createChatRequest({
  participant: 'kb',
  prompt: '/search authentication'
});

// Listen for responses
response.stream.onDidReceiveMessage((message) => {
  console.log(message.content);
});
```

#### Slash Commands

```typescript
// Search documents
await vscode.chat.createChatRequest({
  participant: 'kb',
  prompt: '/search JWT implementation'
});

// List all documents
await vscode.chat.createChatRequest({
  participant: 'kb',
  prompt: '/list'
});

// Add document
await vscode.chat.createChatRequest({
  participant: 'kb',
  prompt: '/ingest /path/to/document.md'
});

// Show help
await vscode.chat.createChatRequest({
  participant: 'kb',
  prompt: '/help'
});
```

#### Natural Language Queries

```typescript
// Ask natural language questions
await vscode.chat.createChatRequest({
  participant: 'kb',
  prompt: 'How do I implement OAuth2?'
});

await vscode.chat.createChatRequest({
  participant: 'kb',
  prompt: 'What are the security best practices?'
});
```

---

## Configuration

### Configuration Schema

Access KB Extension settings through the VS Code Configuration API:

```typescript
import * as vscode from 'vscode';

const config = vscode.workspace.getConfiguration('kbExtension');
```

### Available Settings

#### Storage Configuration

```typescript
const storagePath = config.get('storage.path');
// Default: "${workspaceFolder}/.kb"

const databaseName = config.get('storage.databaseName');
// Default: "kb-store"

const autoCreateStorage = config.get('storage.autoCreate');
// Default: true
```

#### Embedding Configuration

```typescript
const provider = config.get('embedding.provider');
// Default: "copilot"

const model = config.get('embedding.model');
// Default: "text-embedding-3-small"

const embeddingDimension = config.get('embedding.dimension');
// Default: 1536
```

#### Search Configuration

```typescript
const topK = config.get('search.topK');
// Default: 5 (number of results)

const scoreThreshold = config.get('search.scoreThreshold');
// Default: 0.7 (relevance threshold)

const maxResults = config.get('search.maxResults');
// Default: 50
```

#### Ingestion Configuration

```typescript
const maxFileSize = config.get('ingestion.maxFileSize');
// Default: 52428800 (50 MB)

const supportedFormats = config.get('ingestion.supportedFormats');
// Default: ["md", "txt", "pdf"]

const autoDetectEncoding = config.get('ingestion.autoDetectEncoding');
// Default: true
```

### Modifying Configuration

```typescript
import * as vscode from 'vscode';

const config = vscode.workspace.getConfiguration('kbExtension');

// Set workspace-level setting
await config.update('search.topK', 10, vscode.ConfigurationTarget.Workspace);

// Set global setting
await config.update('storage.path', '/custom/path', vscode.ConfigurationTarget.Global);
```

---

## Chat Participant Integration

### Registering a Custom Chat Participant

If you want to integrate with Copilot Chat from your extension:

```typescript
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  // Create custom chat participant
  const handler: vscode.ChatRequestHandler = async (
    request: vscode.ChatRequest,
    context: vscode.ChatContext,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ) => {
    // Call KB Extension search
    const prompt = request.prompt;
    
    if (prompt.includes('kb:')) {
      const query = prompt.replace('kb:', '').trim();
      
      // Query KB Extension
      await queryKB(query, stream);
    }
  };

  const participant = vscode.chat.createChatParticipant('myext.custom', handler);
  context.subscriptions.push(participant);
}

async function queryKB(query: string, stream: vscode.ChatResponseStream) {
  try {
    stream.progress(`Searching KB for: ${query}`);
    
    // Execute KB search command
    await vscode.commands.executeCommand('kb-extension.search', {
      query,
      topK: 5
    });
    
    stream.markdown(`Found results for: **${query}**`);
  } catch (error) {
    stream.markdown(`Error: ${error}`);
  }
}
```

---

## Command Integration

### Extending KB Extension with Custom Commands

```typescript
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  // Register command that uses KB Extension
  const disposable = vscode.commands.registerCommand(
    'myext.searchDocumentation',
    async (topic: string) => {
      // Get selected text as default query
      const editor = vscode.window.activeTextEditor;
      const query = editor?.document.getWordRangeAtPosition(editor.selection.active);
      
      // Search KB
      await vscode.commands.executeCommand('kb-extension.helloWorld');
      
      vscode.window.showInformationMessage(`Searching KB for: ${topic}`);
    }
  );

  context.subscriptions.push(disposable);
}
```

### Creating Command Palette Commands

```typescript
vscode.commands.registerCommand('myext.queryKB', async () => {
  const query = await vscode.window.showInputBox({
    prompt: 'Enter your question',
    placeHolder: 'How do I implement OAuth2?'
  });
  
  if (query) {
    // Execute KB search
    await vscode.commands.executeCommand('kb-extension.search', {
      query
    });
  }
});
```

---

## Secret Storage

### Secure API Key Management

```typescript
import * as vscode from 'vscode';

export async function activate(context: vscode.ExtensionContext) {
  // Store API key
  await context.secrets.store('myext.apiKey', 'secret-value');
  
  // Retrieve API key
  const apiKey = await context.secrets.get('myext.apiKey');
  
  if (apiKey) {
    console.log('API key is stored');
  }
  
  // Delete API key
  await context.secrets.delete('myext.apiKey');
}
```

### Using KB Extension Secret Storage

```typescript
import * as vscode from 'vscode';

// Store in KB Extension's secure storage
await vscode.commands.executeCommand(
  'kb-extension.storeApiKey',
  'your-copilot-api-key'
);
```

---

## Code Examples

### Example 1: Search KB from Command Palette

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('myext.quickSearch', async () => {
      const query = await vscode.window.showInputBox({
        prompt: 'Search Knowledge Base'
      });
      
      if (query) {
        // Show progress
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Searching KB...`
          },
          async () => {
            // Execute KB search
            await vscode.commands.executeCommand('kb-extension.search', {
              query,
              topK: 5
            });
          }
        );
      }
    })
  );
}
```

### Example 2: Integrate KB with Status Bar

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  // Create status bar button
  const statusBarItem = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    100
  );
  
  statusBarItem.command = 'myext.askKB';
  statusBarItem.text = '$(book) Ask KB';
  statusBarItem.show();

  // Register command
  context.subscriptions.push(
    vscode.commands.registerCommand('myext.askKB', async () => {
      const query = await vscode.window.showInputBox({
        prompt: 'Ask the Knowledge Base'
      });
      
      if (query) {
        // Open Copilot Chat with KB query
        await vscode.commands.executeCommand('workbench.action.chat.open');
        
        // This would ideally execute the KB search
        vscode.window.showInformationMessage(
          `Query: ${query}\nUse @kb in Copilot Chat to search`
        );
      }
    })
  );

  context.subscriptions.push(statusBarItem);
}
```

### Example 3: Batch Document Ingestion

```typescript
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand('myext.ingestFolder', async () => {
      // Pick folder
      const folders = await vscode.window.showOpenDialog({
        canSelectFolders: true,
        canSelectFiles: false
      });

      if (!folders || folders.length === 0) {
        return;
      }

      const folderPath = folders[0].fsPath;
      const files = fs.readdirSync(folderPath).filter(f => 
        f.endsWith('.md') || f.endsWith('.txt')
      );

      // Ingest each file
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        
        await vscode.window.withProgress(
          {
            location: vscode.ProgressLocation.Notification,
            title: `Ingesting ${file}...`
          },
          async () => {
            await vscode.commands.executeCommand(
              'kb-extension.ingestDocument',
              { filepath: filePath }
            );
          }
        );
      }

      vscode.window.showInformationMessage(
        `Ingested ${files.length} documents`
      );
    })
  );
}
```

### Example 4: Hover Provider with KB Lookup

```typescript
import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.registerHoverProvider('*', {
      provideHover(document, position) {
        // Get word at position
        const wordRange = document.getWordRangeAtPosition(position);
        const word = document.getText(wordRange);

        // Return hover that suggests KB search
        return new vscode.Hover(
          new vscode.MarkdownString(
            `Search KB for **${word}**\n\nUse \`@kb /search ${word}\` in Copilot Chat`
          )
        );
      }
    })
  );
}
```

---

## Best Practices

### 1. **Error Handling**

Always handle command execution errors:

```typescript
try {
  await vscode.commands.executeCommand('kb-extension.search', { query });
} catch (error) {
  vscode.window.showErrorMessage(`KB Search failed: ${error}`);
}
```

### 2. **Progress Indication**

Show progress for long-running operations:

```typescript
await vscode.window.withProgress(
  {
    location: vscode.ProgressLocation.Notification,
    title: 'Searching knowledge base...'
  },
  async () => {
    await vscode.commands.executeCommand('kb-extension.search', { query });
  }
);
```

### 3. **Configuration Validation**

Validate configuration before using:

```typescript
const config = vscode.workspace.getConfiguration('kbExtension');
const topK = config.get<number>('search.topK');

if (topK && topK > 0 && topK <= 100) {
  // Safe to use
} else {
  vscode.window.showWarning('Invalid search.topK configuration');
}
```

### 4. **Avoid Blocking Operations**

Use async patterns to avoid UI freezing:

```typescript
// Good - non-blocking
vscode.commands.executeCommand('kb-extension.search', { query });

// Avoid - can block UI
await vscode.commands.executeCommand('kb-extension.search', { query });
// (unless necessary for synchronization)
```

### 5. **Cache Results**

Cache KB search results to reduce redundant queries:

```typescript
interface CacheEntry {
  query: string;
  results: any[];
  timestamp: number;
}

const searchCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function cachedSearch(query: string) {
  const cached = searchCache.get(query);
  
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.results;
  }

  // Perform search
  const results = await vscode.commands.executeCommand(
    'kb-extension.search',
    { query }
  );

  searchCache.set(query, {
    query,
    results,
    timestamp: Date.now()
  });

  return results;
}
```

### 6. **Resource Cleanup**

Properly dispose of resources:

```typescript
export function deactivate() {
  // Clean up subscriptions
  disposables.forEach(d => d.dispose());
  
  // Clear caches
  searchCache.clear();
}
```

---

## Troubleshooting

### Issue: "KB Extension is not installed"

**Solution:**
```bash
code --install-extension /Users/dennislee/Devs/KBIngest/kb-extension-0.0.1.vsix
```

Verify installation:
```bash
code --list-extensions | grep kb-extension
```

---

### Issue: Commands Not Found

**Solution:** Ensure KB Extension is listed in `extensionDependencies`:

```json
{
  "extensionDependencies": ["publisher.kb-extension"]
}
```

---

### Issue: Configuration Not Applied

**Solution:** Configuration changes require VS Code reload:

```typescript
// Prompt user to reload
const reload = await vscode.window.showInformationMessage(
  'Configuration changed. Reload now?',
  'Yes',
  'No'
);

if (reload === 'Yes') {
  vscode.commands.executeCommand('workbench.action.reloadWindow');
}
```

---

### Issue: Chat Participant Not Responding

**Solution:** Ensure chat is properly initialized:

```typescript
if (!vscode.chat) {
  vscode.window.showErrorMessage('Chat API not available');
  return;
}

// Check if KB participant exists
const participants = await vscode.chat.getParticipants?.();
if (!participants?.find(p => p.id === 'kb')) {
  vscode.window.showErrorMessage('KB participant not registered');
}
```

---

### Issue: Secret Storage Not Working

**Solution:** Use proper error handling:

```typescript
try {
  const secret = await context.secrets.get('kb-api-key');
  if (!secret) {
    vscode.window.showWarningMessage('API key not configured');
  }
} catch (error) {
  vscode.window.showErrorMessage(`Failed to access secrets: ${error}`);
}
```

---

## Support & Resources

- **Documentation:** [KB Extension README](./README.md)
- **Installation:** [Installation Guide](./INSTALLATION_GUIDE.md)
- **Source Code:** `/Users/dennislee/Devs/KBIngest/extension/kb-extension/`
- **VS Code API:** https://code.visualstudio.com/api
- **Issues:** Open an issue on GitHub

---

## Version History

### v1.0.0 (April 19, 2026)
- Initial integration guide
- Complete API reference
- Code examples and best practices
- Troubleshooting section

---

**Last Updated:** April 19, 2026  
**Maintainer:** KB Extension Team
