---
description: "Use when implementing KB Extension Sprint 1 features: setting up TypeScript extension scaffold, designing/implementing SQLite storage layer, configuring VS Code settings, writing storage tests, or establishing development workflow. Covers best practices for project initialization, database schema, configuration management, and test patterns specific to KB Extension S1.1-S1.3."
name: "KB Extension Development Guidelines"
---

# KB Extension Development Guidelines - Sprint 1

## Project Context

This guidance applies to the KB Extension project: a personal knowledge base system integrating with GitHub Copilot Chat. Focus on Sprints 1.1 (Project Initialization), 1.2 (Storage Layer), and 1.3 (Configuration).

**Key Resources**:
- `WEEK_1_EXECUTABLE_PLAN.md` - Time-boxed daily execution guide
- `IMPLEMENTATION_PLAN.md` - Full scope and deliverables
- `ARCHITECTURE.md` - System design and component contracts

---

## Stage 1: Project Scaffolding (S1.1)

### Generating the VS Code Extension

When starting the project scaffolding:

```bash
# Prerequisites
node --version  # Must be ≥18.0.0
npm --version   # Must be ≥9.0.0

# Install generators
npm install -g yo generator-code

# Generate extension
mkdir -p ~/Devs/KBIngest/extension
cd ~/Devs/KBIngest/extension
yo code
```

**Yeoman Prompts**:
- TypeScript? → **Yes**
- Extension name? → `KB Extension`
- Identifier? → `kb-extension`
- Description? → `Personal knowledge base with Copilot integration`
- Initialize git? → **Yes**
- Initialize npm? → **Yes**
- Package manager? → **npm**

### TypeScript Configuration

The scaffold creates `tsconfig.json`. Verify these settings:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./out",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**DO**:
- Keep `strict: true` for type safety
- Enable all strict mode options
- Enable source maps for debugging
- Output to `./out` directory

**DO NOT**:
- Disable strict mode
- Use `any` types without explicit justification
- Skip lib check for third-party types

### Testing Setup

The scaffold includes Jest. Verify `package.json`:

```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "jest --coverage",
    "lint": "eslint src --ext ts"
  },
  "devDependencies": {
    "@types/jest": "^29.x",
    "jest": "^29.x",
    "ts-jest": "^29.x",
    "typescript": "^5.x"
  }
}
```

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  rootDir: 'src',
  collectCoverageFrom: [
    '**/*.ts',
    '!**/*.test.ts',
    '!**/node_modules/**'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

**Build Verification**:
```bash
npm run compile     # Should complete without errors
npm test            # Should pass all tests, ≥80% coverage
```

### Git Initialization

The scaffold sets up Git. Verify `.gitignore`:

```
out/
dist/
node_modules/
*.vsix
.env
.env.local
coverage/
.DS_Store
```

**First Commit**:
```bash
git add .
git commit -m "feat(S1.1): Initial VS Code extension scaffold

- Generate extension with TypeScript, Jest, ESLint
- Configure strict TypeScript compiler settings
- Setup Jest coverage thresholds (80%)
- Initialize Git with proper .gitignore"
```

---

## Stage 2: Storage Layer - SQLite (S1.2)

### Database Schema Design

Create `src/storage/schema.sql`:

```sql
-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  collectionId TEXT NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  contentType TEXT DEFAULT 'text/markdown',
  wordCount INTEGER,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (collectionId) REFERENCES collections(id) ON DELETE CASCADE
);

-- Chunks table (for embeddings)
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  documentId TEXT NOT NULL,
  text TEXT NOT NULL,
  startIndex INTEGER,
  endIndex INTEGER,
  embedding BLOB,
  embeddingModel TEXT,
  tokenCount INTEGER,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  color TEXT
);

-- DocumentTag junction table
CREATE TABLE IF NOT EXISTS documentTags (
  documentId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  PRIMARY KEY (documentId, tagId),
  FOREIGN KEY (documentId) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (tagId) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_collectionId ON documents(collectionId);
CREATE INDEX IF NOT EXISTS idx_chunks_documentId ON chunks(documentId);
CREATE INDEX IF NOT EXISTS idx_chunks_embeddingModel ON chunks(embeddingModel);
```

### StorageManager Implementation

Create `src/storage/StorageManager.ts`:

```typescript
import sqlite3 from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export interface Document {
  id: string;
  collectionId: string;
  name: string;
  content: string;
  contentType: string;
  wordCount?: number;
  createdAt: number;
  updatedAt: number;
}

export class StorageManager {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor(dataDir: string) {
    this.dbPath = path.join(dataDir, 'kb-extension.db');
    
    // Ensure directory exists
    fs.mkdirSync(dataDir, { recursive: true });

    // Initialize database
    this.db = new sqlite3(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    
    this.initializeSchema();
  }

  private initializeSchema(): void {
    const schema = fs.readFileSync(
      path.join(__dirname, 'schema.sql'),
      'utf-8'
    );
    this.db.exec(schema);
  }

  // CRUD operations
  async createDocument(doc: Omit<Document, 'createdAt' | 'updatedAt'>): Promise<Document> {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO documents (id, collectionId, name, content, contentType, wordCount, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(doc.id, doc.collectionId, doc.name, doc.content, doc.contentType, doc.wordCount, now, now);

    return { ...doc, createdAt: now, updatedAt: now };
  }

  async readDocument(id: string): Promise<Document | null> {
    const stmt = this.db.prepare('SELECT * FROM documents WHERE id = ?');
    return stmt.get(id) as Document | null;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | null> {
    const now = Date.now();
    const setClauses = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    
    const values = [...Object.values(updates), now, id];
    const stmt = this.db.prepare(
      `UPDATE documents SET ${setClauses}, updatedAt = ? WHERE id = ?`
    );

    stmt.run(...values);
    return this.readDocument(id);
  }

  async deleteDocument(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM documents WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Transaction support
  transaction<T>(fn: () => T): T {
    const inner = this.db.transaction(fn);
    return inner();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const result = this.db.prepare('SELECT 1').get();
      return result !== undefined;
    } catch {
      return false;
    }
  }

  // Cleanup
  close(): void {
    this.db.close();
  }
}
```

### Schema Migrations

Create `src/storage/migrations.ts`:

```typescript
export interface Migration {
  version: number;
  name: string;
  up: (db: Database) => void;
  down: (db: Database) => void;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'initial_schema',
    up: (db) => {
      // Initialize schema from schema.sql
    },
    down: (db) => {
      // Rollback - drop all tables
    }
  }
];
```

**Best Practices**:
- One migration per logical change
- Always provide rollback (`down`) function
- Test both up and down migrations
- Use descriptive migration names
- Version incrementally (1, 2, 3...)

---

## Stage 3: Configuration (S1.3)

### VS Code Settings Schema

Update `package.json`:

```json
{
  "contributes": {
    "configuration": {
      "title": "KB Extension",
      "properties": {
        "kbExtension.dataDirectory": {
          "type": "string",
          "default": "${workspaceFolder}/.kb-extension",
          "description": "Directory for storing KB data and database"
        },
        "kbExtension.embeddingModel": {
          "type": "string",
          "enum": ["xenova/all-MiniLM-L6-v2", "custom"],
          "default": "xenova/all-MiniLM-L6-v2",
          "description": "Embedding model to use for document chunks"
        },
        "kbExtension.chunkSize": {
          "type": "number",
          "default": 512,
          "minimum": 100,
          "maximum": 2000,
          "description": "Token count per chunk"
        },
        "kbExtension.chunkOverlap": {
          "type": "number",
          "default": 50,
          "minimum": 0,
          "maximum": 200,
          "description": "Token overlap between chunks"
        }
      }
    }
  }
}
```

### ConfigManager Implementation

Create `src/config/ConfigManager.ts`:

```typescript
import * as vscode from 'vscode';

export interface KBExtensionConfig {
  dataDirectory: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
}

export class ConfigManager {
  private config: vscode.WorkspaceConfiguration;

  constructor() {
    this.config = vscode.workspace.getConfiguration('kbExtension');
  }

  get dataDirectory(): string {
    const dir = this.config.get<string>('dataDirectory') || '';
    return dir.replace('${workspaceFolder}', vscode.workspace.rootPath || '');
  }

  get embeddingModel(): string {
    return this.config.get<string>('embeddingModel') || 'xenova/all-MiniLM-L6-v2';
  }

  get chunkSize(): number {
    return this.config.get<number>('chunkSize') || 512;
  }

  get chunkOverlap(): number {
    return this.config.get<number>('chunkOverlap') || 50;
  }

  async updateSetting(key: string, value: any, isGlobal: boolean = false): Promise<void> {
    const target = isGlobal 
      ? vscode.ConfigurationTarget.Global 
      : vscode.ConfigurationTarget.Workspace;
    
    await this.config.update(key, value, target);
  }

  onConfigChange(callback: (config: KBExtensionConfig) => void): vscode.Disposable {
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('kbExtension')) {
        this.config = vscode.workspace.getConfiguration('kbExtension');
        callback(this.getAll());
      }
    });
  }

  getAll(): KBExtensionConfig {
    return {
      dataDirectory: this.dataDirectory,
      embeddingModel: this.embeddingModel,
      chunkSize: this.chunkSize,
      chunkOverlap: this.chunkOverlap
    };
  }

  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.chunkSize < 100 || this.chunkSize > 2000) {
      errors.push('chunkSize must be between 100 and 2000');
    }

    if (this.chunkOverlap < 0 || this.chunkOverlap > 200) {
      errors.push('chunkOverlap must be between 0 and 200');
    }

    if (this.chunkOverlap >= this.chunkSize) {
      errors.push('chunkOverlap must be less than chunkSize');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
```

### SecretStorage Integration

In `src/extension.ts`:

```typescript
import * as vscode from 'vscode';
import { StorageManager } from './storage/StorageManager';
import { ConfigManager } from './config/ConfigManager';

export async function activate(context: vscode.ExtensionContext) {
  const configManager = new ConfigManager();
  const config = configManager.getAll();

  // Validate configuration
  const validation = configManager.validate();
  if (!validation.valid) {
    vscode.window.showErrorMessage(`Configuration errors: ${validation.errors.join(', ')}`);
    return;
  }

  // Initialize storage
  const storageManager = new StorageManager(config.dataDirectory);

  // Health check
  const isHealthy = await storageManager.healthCheck();
  if (!isHealthy) {
    vscode.window.showErrorMessage('Failed to initialize storage layer');
    return;
  }

  // Store API keys in SecretStorage
  const storeApiKey = vscode.commands.registerCommand(
    'kb-extension.storeApiKey',
    async () => {
      const apiKey = await vscode.window.showInputBox({
        prompt: 'Enter API Key',
        password: true
      });

      if (apiKey) {
        await context.secrets.store('kb-extension-api-key', apiKey);
        vscode.window.showInformationMessage('API key stored securely');
      }
    }
  );

  // Retrieve API key
  const getApiKey = async (): Promise<string | undefined> => {
    return context.secrets.get('kb-extension-api-key');
  };

  context.subscriptions.push(storeApiKey);

  // Listen for config changes
  context.subscriptions.push(
    configManager.onConfigChange((newConfig) => {
      console.log('Configuration changed:', newConfig);
    })
  );
}

export function deactivate() {}
```

---

## Writing Tests for S1.2 Storage Layer

Create `src/storage/StorageManager.test.ts`:

```typescript
import { StorageManager, Document } from './StorageManager';
import path from 'path';
import fs from 'fs';
import os from 'os';

describe('StorageManager', () => {
  let storageManager: StorageManager;
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-test-'));
    storageManager = new StorageManager(tempDir);
  });

  afterEach(() => {
    storageManager.close();
    fs.rmSync(tempDir, { recursive: true });
  });

  describe('Document CRUD', () => {
    test('should create a document', async () => {
      const doc = await storageManager.createDocument({
        id: 'doc-1',
        collectionId: 'col-1',
        name: 'Test Document',
        content: 'This is test content',
        contentType: 'text/markdown',
        wordCount: 4
      });

      expect(doc.id).toBe('doc-1');
      expect(doc.name).toBe('Test Document');
    });

    test('should read a document', async () => {
      await storageManager.createDocument({
        id: 'doc-2',
        collectionId: 'col-1',
        name: 'Read Test',
        content: 'Content to read',
        contentType: 'text/markdown'
      });

      const retrieved = await storageManager.readDocument('doc-2');
      expect(retrieved?.name).toBe('Read Test');
    });

    test('should return null for non-existent document', async () => {
      const retrieved = await storageManager.readDocument('non-existent');
      expect(retrieved).toBeNull();
    });

    test('should update a document', async () => {
      await storageManager.createDocument({
        id: 'doc-3',
        collectionId: 'col-1',
        name: 'Original Name',
        content: 'Original content',
        contentType: 'text/markdown'
      });

      const updated = await storageManager.updateDocument('doc-3', {
        name: 'Updated Name'
      });

      expect(updated?.name).toBe('Updated Name');
    });

    test('should delete a document', async () => {
      await storageManager.createDocument({
        id: 'doc-4',
        collectionId: 'col-1',
        name: 'To Delete',
        content: 'Will be deleted',
        contentType: 'text/markdown'
      });

      const deleted = await storageManager.deleteDocument('doc-4');
      expect(deleted).toBe(true);

      const retrieved = await storageManager.readDocument('doc-4');
      expect(retrieved).toBeNull();
    });
  });

  test('should pass health check', async () => {
    const isHealthy = await storageManager.healthCheck();
    expect(isHealthy).toBe(true);
  });
});
```

**Test Coverage Goals**:
- ✓ All CRUD operations (create, read, update, delete)
- ✓ Error handling (invalid inputs, missing records)
- ✓ Transaction support (rollback, atomicity)
- ✓ Health checks (database connectivity)
- ✓ Target: ≥80% code coverage

---

## Common Patterns & Pitfalls

### DO: Follow Strict TypeScript

```typescript
// GOOD
function processDocument(doc: Document): void {
  const wordCount: number = doc.content.split(/\s+/).length;
  // ...
}

// BAD - avoid any
function processDocument(doc: any): void {
  const wordCount = doc.content.split(/\s+/).length; // any type
}
```

### DO: Use Transactions for Multi-Step Operations

```typescript
// GOOD
storageManager.transaction(() => {
  createDocument(doc1);
  createDocument(doc2);
  addTags(doc1, ['tag1', 'tag2']);
  // All succeed or all fail
});

// BAD - can leave partial state
createDocument(doc1);
createDocument(doc2);
addTags(doc1, ['tag1', 'tag2']); // Can fail after docs created
```

### DO: Test Both Happy Path and Error Cases

```typescript
// GOOD
test('should handle database errors gracefully', async () => {
  // Simulate error condition
  // Verify error is caught and logged
  // Verify no partial state left behind
});
```

### DO NOT: Hardcode Paths

```typescript
// BAD
const dbPath = '/Users/dennis/kb-extension.db';

// GOOD
const dbPath = path.join(context.extensionPath, 'data', 'kb-extension.db');
```

---

## Daily Checkpoint Reference

Use these checkpoints from `WEEK_1_EXECUTABLE_PLAN.md`:

**Stage 1 Checkpoint (End of Day 1-2)**:
- ✓ Extension scaffolds and compiles
- ✓ Tests run successfully
- ✓ Git initialized with first commit
- ✓ Development environment documented

**Stage 2 Checkpoint (End of Day 3)**:
- ✓ Database schema designed and documented
- ✓ StorageManager implements all CRUD operations
- ✓ Migrations system in place
- ✓ >80% test coverage for storage

**Stage 3 Checkpoint (End of Day 4-5)**:
- ✓ VS Code settings schema defined
- ✓ ConfigManager reads/writes settings
- ✓ SecretStorage integration working
- ✓ Configuration validation in place
- ✓ All S1.1-S1.3 tasks committed

---

## Useful Commands

```bash
# Development
npm run compile      # TypeScript compilation
npm run watch        # Watch mode for development
npm test             # Run tests with coverage
npm test -- --watch  # Watch mode for tests

# Git workflow
git status           # Check current status
git add .            # Stage all changes
git commit -m "message"  # Commit with message
git log --oneline    # View commit history

# Extension debugging
code --open-devtools # Open DevTools in VS Code
F5                   # Launch extension in debug mode
```

---

**Integration Note**: These guidelines work in conjunction with the `kb-extension-developer` agent. When working on S1.1-S1.3 tasks, reference this guidance for execution patterns, and refer to the agent for workflow orchestration and progress tracking.
