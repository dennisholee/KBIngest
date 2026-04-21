# KB Extension - Week 2+ Development Startup Guide
**Days 3-5+ Implementation Kickoff**

**Status**: Days 1-2 ✅ Complete | Days 3-5+ 🟡 Ready to Start  
**Current Phase**: Active Development (S1.2 Storage + S1.3 Configuration)  
**Working Directory**: `/Users/dennislee/Devs/KBIngest/extension`

---

## Table of Contents

1. [✅ Pre-Flight Checklist](#pre-flight-checklist)
2. [📁 Development Environment Setup](#development-environment-setup)
3. [📅 Week 2 Kickoff (Days 3-5)](#week-2-kickoff-days-3-5)
4. [🔧 First Implementation Task - StorageManager](#first-implementation-task---storagemanager)
5. [💻 Development Workflow](#development-workflow)
6. [📊 Success Metrics](#success-metrics)
7. [🐛 Troubleshooting](#troubleshooting)

---

# ✅ Pre-Flight Checklist

Before starting implementation, verify Days 1-2 are complete:

## Verify Day 1: Extension Scaffold + TypeScript + Jest

```bash
cd ~/Devs/KBIngest/extension
```

**Check 1: Directory Structure**
```bash
ls -la
# Expected: src/, test/, dist/, package.json, tsconfig.json, jest.config.js, .git/
```

**Check 2: NPM Scripts Working**
```bash
npm run
# Should show: compile, watch, test, package, lint
```

**Check 3: Compilation**
```bash
npm run compile
# Expected: No errors; dist/ folder populated with .js, .map, .d.ts files
```

**Check 4: Tests**
```bash
npm test
# Expected: At least 1 test passing with coverage report
```

**Check 5: Git History**
```bash
git log --oneline
# Expected: At least 3-5 commits from Day 1
```

**Check 6: Debug Mode**
```bash
# In VS Code, press F5
# Expected: New debug window opens; extension loads without crash
# Stop with Shift+F5
```

✅ **If all checks pass**: Day 1 is confirmed complete.  
❌ **If any fail**: Run `WEEK_1_EXECUTABLE_PLAN.md` Day 1 tasks first.

---

## Verify Day 2: Database Schema Design + Configuration Planning

**Check 1: Schema Documentation**
```bash
ls -la docs/
# Expected: SCHEMA_DESIGN.md, SCHEMA_DECISIONS.md exist
```

**Check 2: Migration Structure**
```bash
ls -la src/storage/migrations/
# Expected: 001_initial_schema.sql exists
# Expected: README.md exists
```

**Check 3: Schema Interface Files**
```bash
ls -la src/storage/
# Expected: 
#   StorageManager.interface.ts
#   MigrationManager.interface.ts
#   errors/MigrationError.ts
```

**Check 4: Configuration Planning**
```bash
ls -la src/config/
# Expected: ConfigManager.interface.ts (may be empty placeholder)
```

✅ **If all checks pass**: Day 2 is confirmed complete.  
❌ **If any missing**: Check `DAY_2_COMPREHENSIVE_GUIDE.md` sections.

---

# 📁 Development Environment Setup

## Project Structure for Implementation

Here's the complete directory structure you'll build over Days 3-5+:

```
extension/
├── .vscode/
│   ├── launch.json                 ✅ Day 1
│   ├── tasks.json                  ✅ Day 1
│   └── settings.json               ← Day 3 (dev settings)
│
├── src/
│   ├── extension.ts                ✅ Day 1 (main entry point)
│   │
│   ├── storage/                    ← Day 3-4 ACTIVE
│   │   ├── StorageManager.ts       ← You'll create this (Day 3)
│   │   ├── StorageManager.interface.ts ✅ Day 2 (design)
│   │   ├── SqliteConnection.ts     ← You'll create (Day 3)
│   │   ├── migrations/
│   │   │   ├── README.md           ✅ Day 2
│   │   │   └── 001_initial_schema.sql ✅ Day 2 (copied from schema.sql)
│   │   ├── errors/
│   │   │   ├── MigrationError.ts   ✅ Day 2
│   │   │   └── StorageError.ts     ← You'll create (Day 3)
│   │   └── types/
│   │       ├── Document.ts         ← You'll create (Day 3)
│   │       ├── Chunk.ts            ← You'll create (Day 3)
│   │       ├── Vector.ts           ← You'll create (Day 3)
│   │       ├── Tag.ts              ← You'll create (Day 3)
│   │       └── Collection.ts       ← You'll create (Day 3)
│   │
│   ├── config/                     ← Day 4-5 (configuration)
│   │   ├── ConfigManager.ts        ← You'll create (Day 4)
│   │   ├── ConfigManager.interface.ts ✅ Day 2 (design)
│   │   ├── types/
│   │   │   └── Config.ts           ← You'll create (Day 4)
│   │   └── validators/
│   │       └── ConfigValidator.ts  ← You'll create (Day 4)
│   │
│   ├── utils/
│   │   ├── logger.ts               ← You'll create (Day 3)
│   │   ├── id-generator.ts         ← You'll create (Day 3)
│   │   └── retry.ts                ← You'll create (Day 3)
│   │
│   └── test/                       ✅ Day 1
│       ├── extension.test.ts       ✅ Day 1
│       ├── storage/
│       │   ├── StorageManager.test.ts ← You'll create (Day 3-4)
│       │   ├── SqliteConnection.test.ts ← You'll create (Day 3)
│       │   └── migrations/
│       │       └── MigrationManager.test.ts ← Day 4 (optional)
│       └── config/
│           └── ConfigManager.test.ts ← You'll create (Day 5)
│
├── docs/
│   ├── SCHEMA_DESIGN.md            ✅ Day 2
│   ├── SCHEMA_DECISIONS.md         ✅ Day 2
│   ├── MIGRATIONS.md               ✅ Day 2
│   ├── STORAGE_LAYER.md            ← You'll create (Day 3, optional)
│   ├── CONFIGURATION.md            ← You'll create (Day 4, optional)
│   └── API_REFERENCE.md            ← Day 5+ (reference)
│
├── package.json                    ✅ Day 1
├── tsconfig.json                   ✅ Day 1
├── jest.config.js                  ✅ Day 1
├── .gitignore                      ✅ Day 1
├── .npmignore                      ✅ Day 1
├── README.md                       ✅ Day 1
├── CONTRIBUTING.md                 ✅ Day 1
├── CHANGELOG.md                    ✅ Day 1
└── .git/                           ✅ Day 1 (Git repo)
```

**Key Directories to Create**:

```bash
mkdir -p src/storage/migrations
mkdir -p src/storage/errors
mkdir -p src/storage/types
mkdir -p src/config/validators
mkdir -p src/config/types
mkdir -p src/utils
mkdir -p src/test/storage/migrations
mkdir -p src/test/config
mkdir -p docs
```

---

## Build Pipeline & Development Tooling

### NPM Scripts (Already Working)

```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
    "lint": "eslint src --ext ts",
    "package": "vsce package"
  }
}
```

### Typical Development Session

```bash
# Terminal 1: Watch TypeScript compilation
npm run watch

# Terminal 2: Watch tests (continuous testing)
npm run test:watch

# Terminal 3: Main work terminal
git status
npm test
git add .
git commit -m "..."
git push
```

### VS Code Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Launch Debug | F5 |
| Stop Debug | Shift+F5 |
| Reload Extension | Ctrl+R (in debug window) |
| Show Problems | Ctrl+Shift+M |
| Open Terminal | Ctrl+` |
| Run Tests | Ctrl+Shift+D |

---

# 📅 Week 2 Kickoff (Days 3-5)

## High-Level Task Sequence

### Day 3 (Wednesday): Storage Layer Foundation
**Goal**: Get StorageManager compiling and basic tests passing

```
Time Block | Task | Deliverable
-----------|------|-------------
09:00-10:30 | Setup & Dependencies | SQLite package installed; connection utility working
10:30-12:30 | StorageManager Types | Type definitions for Document, Chunk, Vector, Tag, Collection
13:00-15:00 | StorageManager Implementation | Create/Read/Update/Delete methods for each entity
15:00-16:00 | Unit Tests | Basic unit tests for each method; >50% coverage
16:00-17:00 | Commit & Review | First major commit; code review checklist
```

**Success Criteria**:
- ✅ `npm run compile` succeeds with no errors
- ✅ `npm test` shows >5 tests passing
- ✅ Test coverage for storage >50%
- ✅ Git history shows 3+ commits

---

### Day 4 (Thursday): Storage Layer Completion
**Goal**: Complete StorageManager, add transaction support, health checks

```
Time Block | Task | Deliverable
-----------|------|-------------
09:00-10:30 | Transactions & Connection Pooling | Transaction wrapper; connection pool implementation
10:30-12:30 | Schema Initialization | Database init; health checks; schema verification
13:00-14:30 | Search Methods | SearchFTS, SearchSimilar stubs for Day 5
14:30-16:00 | Comprehensive Testing | Edge cases; error handling; >80% coverage
16:00-17:00 | Documentation & Commit | Inline docs; commit with test results
```

**Success Criteria**:
- ✅ `npm test` shows >20 tests passing
- ✅ Storage layer test coverage >80%
- ✅ Database initializes without errors
- ✅ Transactions working (test with nested creates)

---

### Day 5 (Friday): Configuration Layer
**Goal**: ConfigManager working; settings schema defined

```
Time Block | Task | Deliverable
-----------|------|-------------
09:00-10:30 | VS Code Settings Schema | package.json settings defined; types generated
10:30-12:30 | ConfigManager Implementation | Read/write/validate config; defaults working
13:00-14:30 | SecretStorage Integration | Store API keys securely; retrieve safely
14:30-15:30 | Unit Tests | Config manager tests; >80% coverage
15:30-17:00 | Integration & Commit | Wire to extension.ts; final commit
```

**Success Criteria**:
- ✅ `npm test` shows >25 tests passing
- ✅ All S1.2 + S1.3 tests passing
- ✅ Overall test coverage >70%
- ✅ Ready for Week 3 (ingestion service)

---

## Task Dependencies

```
Day 3 Prerequisites:
  ├─ SQLite package installed
  ├─ SqliteConnection utility working
  └─ Type definitions created
       ↓
Day 4 Prerequisites:
  ├─ All Day 3 tasks complete
  ├─ StorageManager compiling
  └─ Basic CRUD tests passing
       ↓
Day 5 Prerequisites:
  ├─ StorageManager stable (>80% coverage)
  ├─ Database initializing
  └─ Schema verification working
```

---

# 🔧 First Implementation Task - StorageManager Setup

This is the first major coding task. Follow these steps **exactly**.

## Step 1: Install SQLite Package & Dependencies

**Terminal**:
```bash
cd ~/Devs/KBIngest/extension
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
npm install uuid
npm install --save-dev @types/uuid
```

**Why better-sqlite3**:
- ✅ Synchronous API (simpler than async SQL libraries)
- ✅ Excellent performance (C++ bindings)
- ✅ Great TypeScript support
- ✅ Zero external servers (runs locally)
- ✅ 15k+ stars on GitHub

**Verify**:
```bash
npm list better-sqlite3
# Should show: better-sqlite3@9.x.x or latest
```

---

## Step 2: Create Type Definitions

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/types/Document.ts`:

```typescript
/**
 * Document Type Definition
 * 
 * Represents a user-uploaded file or content source
 * 
 * Example:
 *   {
 *     id: "doc-550e8400-e29b-41d4-a716-446655440000",
 *     name: "Meeting Notes Q1 2024",
 *     type: "markdown",
 *     source_path: "/Users/me/Documents/notes.md",
 *     size_bytes: 2048,
 *     hash: "sha256:abc123def456...",
 *     created_date: "2026-04-23T09:00:00Z",
 *     updated_date: "2026-04-23T09:00:00Z",
 *     metadata: { tags: ["important"] }
 *   }
 */

export enum DocumentType {
  MARKDOWN = 'markdown',
  PLAINTEXT = 'plaintext',
  PDF = 'pdf'
}

export interface Document {
  id: string;
  name: string;
  type: DocumentType;
  source_path?: string;
  size_bytes: number;
  hash: string; // SHA-256 for deduplication
  created_date: string; // ISO 8601
  updated_date: string;
  metadata?: Record<string, any>;
}

export interface CreateDocumentInput {
  name: string;
  type: DocumentType;
  source_path?: string;
  size_bytes: number;
  hash: string;
  metadata?: Record<string, any>;
}

export interface UpdateDocumentInput {
  name?: string;
  metadata?: Record<string, any>;
}
```

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/types/Chunk.ts`:

```typescript
/**
 * Chunk Type Definition
 * 
 * Represents a searchable portion of a document
 */

export interface Chunk {
  id: string;
  document_id: string;
  sequence: number; // Order within document (0, 1, 2, ...)
  text: string;
  token_count: number;
  created_date: string; // ISO 8601
}

export interface CreateChunkInput {
  document_id: string;
  sequence: number;
  text: string;
  token_count: number;
}

export interface UpdateChunkInput {
  text?: string;
  token_count?: number;
}
```

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/types/Vector.ts`:

```typescript
/**
 * Vector Type Definition
 * 
 * Represents an embedding (numerical representation) of a chunk
 */

export interface Vector {
  id: string;
  chunk_id: string;
  embedding: number[]; // Float array [0.123, 0.456, ...]
  model_name: string; // e.g., "sentence-transformers/all-MiniLM-L6-v2"
  dimension: number; // 384 for MiniLM, 1536 for larger models
  created_date: string; // ISO 8601
}

export interface CreateVectorInput {
  chunk_id: string;
  embedding: number[];
  model_name: string;
  dimension: number;
}
```

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/types/Tag.ts`:

```typescript
/**
 * Tag Type Definition
 * 
 * Represents a user-created label for organizing documents
 */

export interface Tag {
  id: string;
  name: string;
  color?: string; // Hex color e.g. "#FF0000"
  description?: string;
  created_date: string; // ISO 8601
}

export interface CreateTagInput {
  name: string;
  color?: string;
  description?: string;
}

export interface UpdateTagInput {
  name?: string;
  color?: string;
  description?: string;
}
```

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/types/Collection.ts`:

```typescript
/**
 * Collection Type Definition
 * 
 * Represents a hierarchical grouping/folder of documents
 */

export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  created_date: string; // ISO 8601
  updated_date: string;
}

export interface CreateCollectionInput {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateCollectionInput {
  name?: string;
  description?: string;
  color?: string;
}
```

**Verify**:
```bash
npm run compile
# Should compile with no errors
```

---

## Step 3: Create SQLite Connection Utility

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/SqliteConnection.ts`:

```typescript
/**
 * SQLite Connection Utility
 * 
 * Manages database connection, initialization, and lifecycle
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

export interface SqliteConnectionConfig {
  dbPath: string;
  readonly?: boolean;
  timeout?: number; // ms
}

export class SqliteConnection {
  private db: Database.Database | null = null;
  private readonly config: SqliteConnectionConfig;
  private readonly schemaPath: string;

  constructor(config: SqliteConnectionConfig) {
    this.config = config;
    this.schemaPath = path.join(__dirname, '../storage/migrations/001_initial_schema.sql');
  }

  /**
   * Open database connection
   * @throws Error if database can't be opened
   */
  open(): void {
    if (this.db) {
      throw new Error('Database already open');
    }

    try {
      // Ensure directory exists
      const dir = path.dirname(this.config.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      this.db = new Database(this.config.dbPath);
      
      // Enable foreign keys (critical for referential integrity)
      this.db.pragma('foreign_keys = ON');
      
      // Set timeout for busy database
      this.db.pragma(`busy_timeout = ${this.config.timeout || 5000}`);
    } catch (error) {
      throw new Error(`Failed to open SQLite database: ${error}`);
    }
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      try {
        this.db.close();
        this.db = null;
      } catch (error) {
        console.error('Error closing database:', error);
      }
    }
  }

  /**
   * Get database instance (for direct access)
   */
  getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not opened. Call open() first.');
    }
    return this.db;
  }

  /**
   * Initialize database schema
   * @throws Error if schema can't be applied
   */
  initializeSchema(): void {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    try {
      const schema = fs.readFileSync(this.schemaPath, 'utf-8');
      this.db.exec(schema);
    } catch (error) {
      throw new Error(`Failed to initialize schema: ${error}`);
    }
  }

  /**
   * Check if database is initialized
   */
  isInitialized(): boolean {
    if (!this.db) {
      return false;
    }

    try {
      const result = this.db.prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='documents'"
      ).get();
      return !!result;
    } catch (error) {
      return false;
    }
  }

  /**
   * Health check: verify database connectivity and schema
   * @returns true if database is healthy
   */
  healthCheck(): boolean {
    if (!this.db) {
      return false;
    }

    try {
      // Check connection
      const result = this.db.prepare("SELECT 1").get();
      if (!result) {
        return false;
      }

      // Check schema exists
      return this.isInitialized();
    } catch (error) {
      return false;
    }
  }

  /**
   * Execute transaction
   * @param fn Function to execute within transaction
   * @returns Result of function
   */
  transaction<T>(fn: (db: Database.Database) => T): T {
    if (!this.db) {
      throw new Error('Database not opened');
    }

    const tx = this.db.transaction(fn);
    return tx(this.db);
  }

  /**
   * Get database size in bytes
   */
  getSize(): number {
    try {
      return fs.statSync(this.config.dbPath).size;
    } catch (error) {
      return 0;
    }
  }
}
```

**Verify**:
```bash
npm run compile
# Should compile with no errors
```

---

## Step 4: Create Error Types

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/errors/StorageError.ts`:

```typescript
/**
 * Storage-specific error types
 */

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class DocumentNotFoundError extends StorageError {
  constructor(documentId: string) {
    super(
      `Document not found: ${documentId}`,
      'DOCUMENT_NOT_FOUND',
      { documentId }
    );
  }
}

export class ChunkNotFoundError extends StorageError {
  constructor(chunkId: string) {
    super(
      `Chunk not found: ${chunkId}`,
      'CHUNK_NOT_FOUND',
      { chunkId }
    );
  }
}

export class DuplicateDocumentError extends StorageError {
  constructor(hash: string) {
    super(
      `Document with hash already exists: ${hash}`,
      'DUPLICATE_DOCUMENT',
      { hash }
    );
  }
}

export class StorageInitializationError extends StorageError {
  constructor(reason: string) {
    super(
      `Failed to initialize storage: ${reason}`,
      'INITIALIZATION_FAILED',
      { reason }
    );
  }
}

export class TransactionError extends StorageError {
  constructor(message: string) {
    super(
      `Transaction failed: ${message}`,
      'TRANSACTION_FAILED',
      {}
    );
  }
}
```

---

## Step 5: Create Utility Functions

Create `/Users/dennislee/Devs/KBIngest/extension/src/utils/id-generator.ts`:

```typescript
/**
 * ID Generation Utilities
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return uuidv4();
}

/**
 * Generate document ID (prefixed)
 */
export function generateDocumentId(): string {
  return `doc-${uuidv4()}`;
}

/**
 * Generate chunk ID (prefixed)
 */
export function generateChunkId(): string {
  return `chunk-${uuidv4()}`;
}

/**
 * Generate vector ID (prefixed)
 */
export function generateVectorId(): string {
  return `vec-${uuidv4()}`;
}

/**
 * Generate tag ID (prefixed)
 */
export function generateTagId(): string {
  return `tag-${uuidv4()}`;
}

/**
 * Generate collection ID (prefixed)
 */
export function generateCollectionId(): string {
  return `coll-${uuidv4()}`;
}
```

---

## Step 6: Initial Unit Tests

Create `/Users/dennislee/Devs/KBIngest/extension/src/test/storage/SqliteConnection.test.ts`:

```typescript
/**
 * SqliteConnection Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { SqliteConnection } from '../../storage/SqliteConnection';

describe('SqliteConnection', () => {
  let testDbPath: string;

  beforeEach(() => {
    // Create temp db path for testing
    const tmpDir = path.join(__dirname, '../../..', '.test');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    testDbPath = path.join(tmpDir, `test-${Date.now()}.db`);
  });

  afterEach(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('open/close', () => {
    it('should open and close database connection', () => {
      const conn = new SqliteConnection({ dbPath: testDbPath });
      expect(() => conn.open()).not.toThrow();
      expect(() => conn.close()).not.toThrow();
    });

    it('should throw if opening already-open database', () => {
      const conn = new SqliteConnection({ dbPath: testDbPath });
      conn.open();
      expect(() => conn.open()).toThrow('Database already open');
      conn.close();
    });

    it('should create database directory if not exists', () => {
      const dbPath = path.join(__dirname, '../../..', '.test', 'subdir', 'test.db');
      const conn = new SqliteConnection({ dbPath });
      conn.open();
      expect(fs.existsSync(path.dirname(dbPath))).toBe(true);
      conn.close();
      // Cleanup
      fs.unlinkSync(dbPath);
      fs.rmdirSync(path.dirname(dbPath));
    });
  });

  describe('health check', () => {
    it('should return false if database not opened', () => {
      const conn = new SqliteConnection({ dbPath: testDbPath });
      expect(conn.healthCheck()).toBe(false);
    });

    it('should return false if database not initialized', () => {
      const conn = new SqliteConnection({ dbPath: testDbPath });
      conn.open();
      expect(conn.healthCheck()).toBe(false);
      conn.close();
    });

    it('should return true if database initialized', () => {
      const conn = new SqliteConnection({ dbPath: testDbPath });
      conn.open();
      conn.initializeSchema();
      expect(conn.healthCheck()).toBe(true);
      conn.close();
    });
  });

  describe('transaction', () => {
    it('should execute transaction', () => {
      const conn = new SqliteConnection({ dbPath: testDbPath });
      conn.open();
      conn.initializeSchema();

      const result = conn.transaction((db) => {
        const stmt = db.prepare('SELECT 1 as value');
        return stmt.get() as { value: number };
      });

      expect(result.value).toBe(1);
      conn.close();
    });
  });
});
```

Create `/Users/dennislee/Devs/KBIngest/extension/src/test/storage/StorageManager.test.ts`:

```typescript
/**
 * StorageManager Tests
 */

import * as fs from 'fs';
import * as path from 'path';
import { StorageManager } from '../../storage/StorageManager';
import { CreateDocumentInput, DocumentType } from '../../storage/types/Document';
import { CreateChunkInput } from '../../storage/types/Chunk';
import { CreateTagInput } from '../../storage/types/Tag';

describe('StorageManager', () => {
  let testDbPath: string;
  let storage: StorageManager;

  beforeEach(async () => {
    const tmpDir = path.join(__dirname, '../../..', '.test');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    testDbPath = path.join(tmpDir, `test-${Date.now()}.db`);

    storage = new StorageManager(testDbPath);
    await storage.initialize();
  });

  afterEach(() => {
    storage.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('Documents', () => {
    it('should create and retrieve document', async () => {
      const input: CreateDocumentInput = {
        name: 'Test Document',
        type: DocumentType.MARKDOWN,
        size_bytes: 1024,
        hash: 'sha256:abc123'
      };

      const doc = await storage.createDocument(input);
      expect(doc.id).toBeDefined();
      expect(doc.name).toBe('Test Document');

      const retrieved = await storage.getDocument(doc.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('Test Document');
    });

    it('should list documents', async () => {
      const input: CreateDocumentInput = {
        name: 'Doc 1',
        type: DocumentType.MARKDOWN,
        size_bytes: 1024,
        hash: 'sha256:hash1'
      };

      await storage.createDocument(input);
      await storage.createDocument({ ...input, name: 'Doc 2', hash: 'sha256:hash2' });

      const docs = await storage.listDocuments();
      expect(docs.length).toBeGreaterThanOrEqual(2);
    });

    it('should update document', async () => {
      const input: CreateDocumentInput = {
        name: 'Test Document',
        type: DocumentType.MARKDOWN,
        size_bytes: 1024,
        hash: 'sha256:abc123'
      };

      const doc = await storage.createDocument(input);
      const updated = await storage.updateDocument(doc.id, { name: 'Updated Name' });
      
      expect(updated.name).toBe('Updated Name');
    });

    it('should delete document', async () => {
      const input: CreateDocumentInput = {
        name: 'Test Document',
        type: DocumentType.MARKDOWN,
        size_bytes: 1024,
        hash: 'sha256:abc123'
      };

      const doc = await storage.createDocument(input);
      await storage.deleteDocument(doc.id);

      const retrieved = await storage.getDocument(doc.id);
      expect(retrieved).toBeNull();
    });
  });

  describe('Chunks', () => {
    let docId: string;

    beforeEach(async () => {
      const doc = await storage.createDocument({
        name: 'Doc',
        type: DocumentType.MARKDOWN,
        size_bytes: 1024,
        hash: 'sha256:doc1'
      });
      docId = doc.id;
    });

    it('should create and retrieve chunk', async () => {
      const input: CreateChunkInput = {
        document_id: docId,
        sequence: 0,
        text: 'First chunk text',
        token_count: 10
      };

      const chunk = await storage.createChunk(input);
      expect(chunk.id).toBeDefined();
      expect(chunk.text).toBe('First chunk text');

      const retrieved = await storage.getChunk(chunk.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.text).toBe('First chunk text');
    });

    it('should get chunks by document', async () => {
      await storage.createChunk({
        document_id: docId,
        sequence: 0,
        text: 'Chunk 1',
        token_count: 10
      });
      await storage.createChunk({
        document_id: docId,
        sequence: 1,
        text: 'Chunk 2',
        token_count: 15
      });

      const chunks = await storage.getChunksByDocument(docId);
      expect(chunks.length).toBe(2);
      expect(chunks[0].sequence).toBeLessThan(chunks[1].sequence);
    });
  });

  describe('Tags', () => {
    it('should create and retrieve tag', async () => {
      const input: CreateTagInput = {
        name: 'urgent',
        color: '#FF0000'
      };

      const tag = await storage.createTag(input);
      expect(tag.id).toBeDefined();
      expect(tag.name).toBe('urgent');

      const retrieved = await storage.getTag(tag.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.name).toBe('urgent');
    });

    it('should list tags', async () => {
      await storage.createTag({ name: 'tag1' });
      await storage.createTag({ name: 'tag2' });

      const tags = await storage.listTags();
      expect(tags.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Database initialization', () => {
    it('should verify health check after init', async () => {
      expect(storage.isHealthy()).toBe(true);
    });

    it('should have schema version', async () => {
      const version = await storage.getSchemaVersion();
      expect(version).toBeGreaterThanOrEqual(1);
    });
  });
});
```

---

## Step 7: Create Basic StorageManager Implementation

Create `/Users/dennislee/Devs/KBIngest/extension/src/storage/StorageManager.ts`:

```typescript
/**
 * StorageManager Implementation
 * 
 * Primary interface for all database operations
 */

import { SqliteConnection } from './SqliteConnection';
import {
  Document,
  CreateDocumentInput,
  UpdateDocumentInput,
  DocumentType
} from './types/Document';
import {
  Chunk,
  CreateChunkInput,
  UpdateChunkInput
} from './types/Chunk';
import {
  Vector,
  CreateVectorInput
} from './types/Vector';
import {
  Tag,
  CreateTagInput,
  UpdateTagInput
} from './types/Tag';
import {
  Collection,
  CreateCollectionInput,
  UpdateCollectionInput
} from './types/Collection';
import {
  DocumentNotFoundError,
  ChunkNotFoundError,
  StorageInitializationError,
  TransactionError
} from './errors/StorageError';
import {
  generateDocumentId,
  generateChunkId,
  generateVectorId,
  generateTagId,
  generateCollectionId
} from '../utils/id-generator';
import * as crypto from 'crypto';

export class StorageManager {
  private connection: SqliteConnection;

  constructor(dbPath: string) {
    this.connection = new SqliteConnection({
      dbPath,
      timeout: 5000
    });
  }

  /**
   * Initialize storage system
   * Opens database and ensures schema is initialized
   */
  async initialize(): Promise<void> {
    try {
      this.connection.open();
      
      if (!this.connection.isInitialized()) {
        this.connection.initializeSchema();
      }
      
      if (!this.connection.healthCheck()) {
        throw new Error('Health check failed after initialization');
      }
    } catch (error) {
      throw new StorageInitializationError((error as Error).message);
    }
  }

  /**
   * Close storage connection
   */
  close(): void {
    this.connection.close();
  }

  /**
   * Check if storage is healthy
   */
  isHealthy(): boolean {
    return this.connection.healthCheck();
  }

  /**
   * Get current schema version
   */
  async getSchemaVersion(): Promise<number> {
    return this.connection.transaction((db) => {
      const result = db.prepare(
        'SELECT MAX(version) as version FROM schema_versions'
      ).get() as { version: number | null };
      return result.version || 0;
    });
  }

  // ============================================
  // DOCUMENT OPERATIONS
  // ============================================

  async createDocument(input: CreateDocumentInput): Promise<Document> {
    const id = generateDocumentId();
    const now = new Date().toISOString();

    return this.connection.transaction((db) => {
      const stmt = db.prepare(`
        INSERT INTO documents (id, name, type, source_path, size_bytes, hash, created_date, updated_date, metadata)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        input.name,
        input.type,
        input.source_path || null,
        input.size_bytes,
        input.hash,
        now,
        now,
        input.metadata ? JSON.stringify(input.metadata) : null
      );

      return {
        id,
        name: input.name,
        type: input.type,
        source_path: input.source_path,
        size_bytes: input.size_bytes,
        hash: input.hash,
        created_date: now,
        updated_date: now,
        metadata: input.metadata
      };
    });
  }

  async getDocument(id: string): Promise<Document | null> {
    return this.connection.transaction((db) => {
      const stmt = db.prepare('SELECT * FROM documents WHERE id = ?');
      const row = stmt.get(id) as any;

      if (!row) {
        return null;
      }

      return {
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      };
    });
  }

  async listDocuments(): Promise<Document[]> {
    return this.connection.transaction((db) => {
      const stmt = db.prepare('SELECT * FROM documents ORDER BY created_date DESC');
      const rows = stmt.all() as any[];

      return rows.map(row => ({
        ...row,
        metadata: row.metadata ? JSON.parse(row.metadata) : undefined
      }));
    });
  }

  async updateDocument(id: string, input: UpdateDocumentInput): Promise<Document> {
    const doc = await this.getDocument(id);
    if (!doc) {
      throw new DocumentNotFoundError(id);
    }

    const now = new Date().toISOString();
    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.metadata !== undefined) {
      updates.push('metadata = ?');
      values.push(JSON.stringify(input.metadata));
    }

    updates.push('updated_date = ?');
    values.push(now);
    values.push(id);

    return this.connection.transaction((db) => {
      const stmt = db.prepare(`
        UPDATE documents SET ${updates.join(', ')} WHERE id = ?
      `);
      stmt.run(...values);

      const updated = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as any;
      return {
        ...updated,
        metadata: updated.metadata ? JSON.parse(updated.metadata) : undefined
      };
    });
  }

  async deleteDocument(id: string): Promise<void> {
    return this.connection.transaction((db) => {
      db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    });
  }

  // ============================================
  // CHUNK OPERATIONS
  // ============================================

  async createChunk(input: CreateChunkInput): Promise<Chunk> {
    const id = generateChunkId();
    const now = new Date().toISOString();

    return this.connection.transaction((db) => {
      const stmt = db.prepare(`
        INSERT INTO chunks (id, document_id, sequence, text, token_count, created_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        input.document_id,
        input.sequence,
        input.text,
        input.token_count,
        now
      );

      return {
        id,
        document_id: input.document_id,
        sequence: input.sequence,
        text: input.text,
        token_count: input.token_count,
        created_date: now
      };
    });
  }

  async getChunk(id: string): Promise<Chunk | null> {
    return this.connection.transaction((db) => {
      const stmt = db.prepare('SELECT * FROM chunks WHERE id = ?');
      const row = stmt.get(id) as any;
      return row || null;
    });
  }

  async getChunksByDocument(documentId: string): Promise<Chunk[]> {
    return this.connection.transaction((db) => {
      const stmt = db.prepare(
        'SELECT * FROM chunks WHERE document_id = ? ORDER BY sequence ASC'
      );
      return stmt.all(documentId) as Chunk[];
    });
  }

  async updateChunk(id: string, input: UpdateChunkInput): Promise<Chunk> {
    const chunk = await this.getChunk(id);
    if (!chunk) {
      throw new ChunkNotFoundError(id);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.text !== undefined) {
      updates.push('text = ?');
      values.push(input.text);
    }
    if (input.token_count !== undefined) {
      updates.push('token_count = ?');
      values.push(input.token_count);
    }

    values.push(id);

    return this.connection.transaction((db) => {
      const stmt = db.prepare(`UPDATE chunks SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values);

      return db.prepare('SELECT * FROM chunks WHERE id = ?').get(id) as Chunk;
    });
  }

  async deleteChunk(id: string): Promise<void> {
    return this.connection.transaction((db) => {
      db.prepare('DELETE FROM chunks WHERE id = ?').run(id);
    });
  }

  // ============================================
  // TAG OPERATIONS
  // ============================================

  async createTag(input: CreateTagInput): Promise<Tag> {
    const id = generateTagId();
    const now = new Date().toISOString();

    return this.connection.transaction((db) => {
      const stmt = db.prepare(`
        INSERT INTO tags (id, name, color, description, created_date)
        VALUES (?, ?, ?, ?, ?)
      `);

      stmt.run(id, input.name, input.color || null, input.description || null, now);

      return {
        id,
        name: input.name,
        color: input.color,
        description: input.description,
        created_date: now
      };
    });
  }

  async getTag(id: string): Promise<Tag | null> {
    return this.connection.transaction((db) => {
      return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag | undefined || null;
    });
  }

  async listTags(): Promise<Tag[]> {
    return this.connection.transaction((db) => {
      return db.prepare('SELECT * FROM tags ORDER BY name ASC').all() as Tag[];
    });
  }

  async updateTag(id: string, input: UpdateTagInput): Promise<Tag> {
    const tag = await this.getTag(id);
    if (!tag) {
      throw new Error(`Tag not found: ${id}`);
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      updates.push('name = ?');
      values.push(input.name);
    }
    if (input.color !== undefined) {
      updates.push('color = ?');
      values.push(input.color);
    }
    if (input.description !== undefined) {
      updates.push('description = ?');
      values.push(input.description);
    }

    values.push(id);

    return this.connection.transaction((db) => {
      const stmt = db.prepare(`UPDATE tags SET ${updates.join(', ')} WHERE id = ?`);
      stmt.run(...values);
      return db.prepare('SELECT * FROM tags WHERE id = ?').get(id) as Tag;
    });
  }

  async deleteTag(id: string): Promise<void> {
    return this.connection.transaction((db) => {
      db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    });
  }

  // ============================================
  // VECTOR OPERATIONS (Stubs for now)
  // ============================================

  async createVector(input: CreateVectorInput): Promise<Vector> {
    const id = generateVectorId();
    const now = new Date().toISOString();

    return this.connection.transaction((db) => {
      const stmt = db.prepare(`
        INSERT INTO vectors (id, chunk_id, embedding, model_name, dimension, created_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        id,
        input.chunk_id,
        JSON.stringify(input.embedding),
        input.model_name,
        input.dimension,
        now
      );

      return {
        id,
        chunk_id: input.chunk_id,
        embedding: input.embedding,
        model_name: input.model_name,
        dimension: input.dimension,
        created_date: now
      };
    });
  }

  // ============================================
  // HELPER METHODS
  // ============================================

  /**
   * Hash content for deduplication
   */
  static hashContent(content: string): string {
    return `sha256:${crypto.createHash('sha256').update(content).digest('hex')}`;
  }
}
```

---

## Step 8: First Compilation & Test Run

```bash
npm run compile
# Expected: No errors, dist/ updated

npm test
# Expected: Tests in StorageManager.test.ts pass; >5 tests
```

---

## Step 9: First Commit

```bash
git add -A
git commit -m "feat(storage): initial StorageManager implementation

- Created SqliteConnection utility for database lifecycle
- Created type definitions for Document, Chunk, Vector, Tag, Collection
- Implemented StorageManager CRUD operations
- Added unit tests for StorageManager and SqliteConnection
- All tests passing; StorageManager compiles without errors

Closes #S1.2.1"

git log --oneline
# You should see this new commit
```

---

# 💻 Development Workflow

## Daily Routine (8 hours)

### Start of Day (09:00)

```bash
cd ~/Devs/KBIngest/extension

# 1. Update code from git (if team)
git pull

# 2. Install any new dependencies
npm install

# 3. Start watch mode (Terminal 1)
npm run watch &

# 4. Start test watch (Terminal 2)
npm run test:watch &

# 5. Check status
npm run compile
```

### During Development

**Terminal 1** (Watch mode):
```bash
npm run watch
# Continuously compiles TypeScript as you save
# Shows any compilation errors immediately
```

**Terminal 2** (Test mode):
```bash
npm run test:watch
# Continuously runs tests as you save
# Shows any test failures immediately
```

**Terminal 3** (Work):
```bash
# Make code changes in VS Code
# Files auto-compile and test auto-runs

# When ready to commit:
git status
git add src/...
git commit -m "descriptive message"
git push
```

### Running Tests Manually

```bash
# Run all tests once
npm test

# Run specific test file
npm test StorageManager.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="Documents"

# Run with verbose output
npm test -- --verbose

# Debug tests
npm run test:debug
# Then open chrome://inspect in Chrome
```

### Debugging in VS Code

1. **Press F5** to launch debug session
   - New VS Code window opens with extension
   - Extension loads and any errors shown in debug console

2. **Set breakpoints** in your code (click line number)

3. **Step through** code (F10 = step over, F11 = step into)

4. **Inspect variables** in Variables panel

5. **Press Shift+F5** to stop debugging

### Code Style & Best Practices

**Always**:
- ✅ Use `npm run compile` before committing (ensure no TS errors)
- ✅ Run `npm test` before committing (ensure tests pass)
- ✅ Write tests for new code (aim for >80% coverage)
- ✅ Use descriptive commit messages (see examples below)
- ✅ Commit frequently (small, focused commits)

**Never**:
- ❌ Commit code that doesn't compile
- ❌ Commit code with failing tests
- ❌ Leave TypeScript `any` types without justification
- ❌ Use `console.log` (use logger instead)

### Commit Message Format

```
feat(component): brief description
  
- Detailed bullet point 1
- Detailed bullet point 2

Closes #ISSUE_NUMBER
```

**Examples**:
```
feat(storage): add document CRUD operations

- Implemented createDocument(), getDocument(), deleteDocument()
- Added comprehensive unit tests (5 tests)
- All tests passing; compilation clean

feat(config): ConfigManager reads VS Code settings

- Reads settings from vscode.workspace.getConfiguration()
- Validates against schema
- Falls back to defaults for missing settings

fix(storage): handle missing documents gracefully

- Return null instead of throwing in getDocument()
- Add DocumentNotFoundError for explicit failures
- Update tests to verify null handling
```

---

## Weekly Review (Friday EOD)

Every Friday at end of day:

```bash
# Summary of week's work
git log --oneline --since="5 days ago"

# Verify test coverage
npm test -- --coverage

# Run full compilation
npm run compile

# Check for any warnings
npm run lint || true

# Update progress in PROGRESS.md
```

---

## Handling Failures

### Compilation Errors

```bash
npm run compile
# Shows detailed TypeScript errors with line numbers

# Fix errors in VS Code, save, and recompile
npm run compile
```

### Test Failures

```bash
npm test
# Shows which tests failed

# Read error message carefully
npm test -- --verbose
# Shows more detail

# Debug specific test
npm run test:debug
# Then set breakpoint and trace
```

### Database Issues

```bash
# Remove test databases
rm -rf .test/

# Reinitialize
npm test
# Tests will create fresh databases
```

---

# 📊 Success Metrics

## What Defines "Development Started" ✅

By end of Day 3, you should have:

- [ ] `npm run compile` succeeds with 0 errors
- [ ] `npm test` shows ≥5 passing tests
- [ ] All type definitions created (Document, Chunk, Vector, Tag, Collection)
- [ ] StorageManager CRUD methods working (create, read, update, delete)
- [ ] SqliteConnection utility working
- [ ] At least 2 Git commits with clear messages
- [ ] Code coverage >50% for storage layer

**Verification**:
```bash
npm run compile && echo "✅ Compilation OK"
npm test && echo "✅ Tests OK"
git log --oneline | head -5
```

---

## First Milestone (End of Day 3)

**Deliverable**: StorageManager foundation working

**Acceptance Criteria**:
```
✅ StorageManager.ts compiles
✅ SqliteConnection utility working
✅ Type definitions complete
✅ All CRUD operations stubbed
✅ >5 unit tests passing
✅ Test coverage >50%
✅ Database initializes without error
✅ At least 2 commits pushed to git
```

**Command to verify**:
```bash
npm run compile && npm test && git log --oneline | head -3
```

---

## End of Day 4 Expectations

**Deliverable**: StorageManager complete with transaction support

**Acceptance Criteria**:
```
✅ All Day 3 criteria still met
✅ Transaction wrapper implemented
✅ Connection pooling (basic)
✅ Database health checks working
✅ Schema verification working
✅ >20 unit tests passing
✅ Test coverage >80% for storage
✅ 5+ commits pushed to git
```

---

## End of Week (Day 5) Expectations

**Deliverable**: Full S1.2 + S1.3 working

**Acceptance Criteria**:
```
✅ All Day 4 criteria still met
✅ ConfigManager implemented
✅ Settings schema defined (package.json)
✅ SecretStorage integration working
✅ Environment-based config loading
✅ >25 unit tests passing
✅ Overall test coverage >70%
✅ 10+ commits pushed to git
✅ Ready for Week 3 (ingestion service)
```

**Verification**:
```bash
npm run compile && npm test -- --coverage
# Coverage report should show >70% overall
```

---

## Testing Expectations

| Metric | Day 3 | Day 4 | Day 5 |
|--------|-------|-------|-------|
| Tests Passing | ≥5 | ≥20 | ≥25 |
| Storage Coverage | >50% | >80% | >80% |
| Config Coverage | N/A | N/A | >80% |
| Overall Coverage | ~50% | ~70% | >70% |
| Compilation | Clean | Clean | Clean |
| Git Commits | 2+ | 5+ | 10+ |

---

## Git Commit Strategy

**Frequency**: Commit every 30-60 minutes of work

**Pattern**:
```
Hour 1: git commit "feat: initial types"
Hour 2: git commit "feat: StorageManager CRUD"
Hour 3: git commit "test: add StorageManager tests"
Hour 4: git commit "fix: error handling in transactions"
```

**Benefits**:
- ✅ Easy to rollback if needed
- ✅ Clear history of progress
- ✅ Easy to identify where bugs were introduced
- ✅ Small commits are easier to review

---

# 🐛 Troubleshooting

## Problem: npm test fails with "Cannot find module 'better-sqlite3'"

**Solution**:
```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
npm run compile
npm test
```

---

## Problem: "Database is locked" error

**Solution**:
```bash
# Close all VS Code windows
# Kill any node processes
pkill -f node

# Remove .test databases
rm -rf .test/

# Try again
npm test
```

---

## Problem: TypeScript compilation slow

**Solution**:
```bash
# Restart watch mode
npm run watch
# Ctrl+C to stop
npm run watch &
# Restart in background
```

---

## Problem: "ENOENT: no such file or directory"

**Solution**:
```bash
# Create missing directories
mkdir -p src/storage/migrations
mkdir -p src/storage/errors
mkdir -p src/storage/types
mkdir -p src/config/types
mkdir -p src/test/storage

# Verify structure
find src -type d
```

---

## Problem: Tests timing out

**Solution**:
```bash
# Increase test timeout in jest.config.js
// jest.config.js
testTimeout: 10000  // 10 seconds

# Rebuild and test
npm run compile
npm test
```

---

## Problem: "Foreign key constraint failed"

**Solution**:
This means you're trying to delete a document that still has chunks. 

```typescript
// ❌ WRONG - will fail if chunks exist
await storage.deleteDocument(docId);

// ✅ RIGHT - delete chunks first (or use CASCADE in schema)
// Schema already has CASCADE DELETE, so this should work:
await storage.deleteDocument(docId);  // Chunks auto-deleted

// If still failing, verify PRAGMA:
connection.healthCheck();  // Verifies foreign_keys = ON
```

---

## Getting Help

1. **Check compilation errors**: `npm run compile`
2. **Check test errors**: `npm test -- --verbose`
3. **Review git history**: `git log --oneline -10`
4. **Check docs**: See `docs/` folder for architecture
5. **Review tests**: Tests are often the best documentation

---

# Next Steps

After completing this startup guide:

1. **Day 3**: Follow "First Implementation Task - StorageManager" step by step
2. **Day 4**: Complete transactions, health checks, comprehensive testing
3. **Day 5**: ConfigManager and finish S1.2 + S1.3
4. **Week 2+**: Continue with Week 2 ingestion service (S2.1-S2.4)

---

**Last Updated**: 2026-04-23  
**Status**: Ready for Days 3-5 Implementation  
**Next Review**: End of Day 3 (Thursday EOD)
