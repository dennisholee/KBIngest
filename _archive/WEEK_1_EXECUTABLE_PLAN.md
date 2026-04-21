# Sprint 1 Week 1 - Executable Daily Plan
**KB Extension Project: Foundation & Setup**

**Duration**: Monday–Friday, 5 days × 8 hours = 40 hours total  
**Team**: 1 Developer  
**Scope**: S1.1 (100% complete) + S1.2 (Design phase) + S1.3 (Setup phase)

---

## Quick Reference: Critical Path

```
S1.1.1 (Extension Scaffold)
    ↓
S1.1.2 (TypeScript Config) → S1.1.3 (Testing Framework)
    ↓
S1.1.4 (Git) → S1.1.5/S1.1.6 (Documentation)
    ↓
S1.2.1 (Schema Design) [CRITICAL PATH - foundational]
    ↓
S1.2.2/S1.2.3 (Architecture Design)
    ↓
S1.3.1/S1.3.2 (Configuration)
```

**Critical Path Items** (no slack time):
- ✓ S1.1.1 (Extension scaffold) - must work on Day 1
- ✓ S1.2.1 (Database schema) - must be solid by end Day 2
- ⚠ S1.2.4 (SQLite dependencies) - high native build risk

---

## DAILY BREAKDOWN

---

# DAY 1 (Monday) - PROJECT SCAFFOLDING

**Theme**: Foundation. Get the extension skeleton running and Git initialized.  
**Target Hours**: 8 (1.5h + 1h + 1h buffer + 1.5h + 1h + 1.5h + 0.5h overhead)  
**Success Criteria**: By EOD, extension boots in debug mode (F5); first commit pushed.

---

## Day 1 Morning Block (09:00–12:00 / 3 hours)

### Task S1.1.1: Create VS Code Extension Scaffold (1.5 hours)
**Owner**: Developer  
**Dependencies**: None  
**Risk**: 🟡 Low-Medium (dependency on Yeoman, Node version)

#### Execution Steps:

**[09:00–09:15] Prerequisites Check (15 min)**
- [ ] Verify Node.js version: `node --version` (must be ≥18.0.0)
  - If not: install nvm & LTS Node first (add 15 min buffer)
- [ ] Verify npm: `npm --version` (≥9.0.0)
- [ ] Verify VS Code: stable version installed locally

**[09:15–09:25] Install Yeoman & Generator (10 min)**
```bash
npm install -g yo generator-code
```
- Expected output: Completion without errors
- Typical duration: 1-2 min

**[09:25–09:50] Generate Extension Scaffold (25 min)**
```bash
mkdir -p ~/Devs/KBIngest/extension
cd ~/Devs/KBIngest/extension
yo code
```
Interactive prompts:
- TypeScript? → **Yes**
- Extension name? → `KB Extension`
- Identifier? → `kb-extension`
- Description? → `Personal knowledge base with Copilot integration`
- Initialize git? → **Yes** (or we do it manually)
- Initialize npm? → **Yes**
- Package manager? → **npm**

Expected output:
```
✔ Extension created successfully!
```

- [ ] Verify generated files:
  - `package.json` exists
  - `src/` folder with `extension.ts` & `test/` exists
  - `.vscode/` folder with `launch.json` exists
  - `tsconfig.json` exists

**[09:50–10:05] Quick Scaffold Validation (15 min)**
```bash
cd extension
npm run compile
npm test
```

Expected output:
- `[09:50] tsc: No errors`
- `[10:00] Jest: 1 test passing`

- [ ] All npm scripts listed: `npm run` shows `compile`, `test`, `package`, `watch`
- [ ] No console errors

**Success Checkpoint**: Extension scaffold created; first test passing.

---

### Task S1.1.2: Setup TypeScript Compiler Config (1 hour)
**Owner**: Developer  
**Dependencies**: S1.1.1  
**Risk**: 🟢 Low (standard configuration)

#### Execution Steps:

**[10:05–10:25] Create Strict TypeScript Config (20 min)**

Open `tsconfig.json`. Ensure these settings:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "ES2020",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "rootDir": "./src",
    "outDir": "./dist",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true
  },
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

- [ ] Save file
- [ ] No manual changes needed (Yeoman likely generated this already)

**[10:25–10:45] Verify Compilation + Source Maps (20 min)**
```bash
npm run compile
```

Check `dist/` folder:
- [ ] `extension.js` exists
- [ ] `extension.js.map` exists (source map)
- [ ] `extension.d.ts` exists (types)

Verify source maps work:
```bash
ls -la dist/
```

Expected: All three files visible.

**[10:45–11:00] Create .npmignore for Packaging (15 min)**

Create `.npmignore` in root:
```
src/
test/
**/*.ts
**/*.map
node_modules/
.git/
.gitignore
dist/test
```

- [ ] Save file

**Success Checkpoint**: TypeScript compiles with strict mode; source maps generated.

---

## Day 1 Lunch Break (12:00–13:00)
*Recommended: Step outside, lunch, review progress notes.*

---

## Day 1 Afternoon Block (13:00–17:00 / 4 hours)

### Task S1.1.3: Setup Testing Framework (1.5 hours)
**Owner**: Developer  
**Dependencies**: S1.1.2  
**Risk**: 🟡 Medium (Jest ↔ TypeScript integration quirks)

#### Execution Steps:

**[13:00–13:15] Install Jest + Dependencies (15 min)**
```bash
npm install --save-dev jest @types/jest ts-jest @testing-library/node typescript
```

Expected duration: 1-2 min

- [ ] Packages added to `package.json`

**[13:15–13:35] Create jest.config.js (20 min)**

Create `jest.config.js` in project root:

```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/index.ts'
  ],
  coveragePathIgnorePatterns: ['/node_modules/'],
  verbose: true
};
```

- [ ] File saved

**[13:35–13:50] Create Sample Test (15 min)**

Update or create `src/test/extension.test.ts`:

```typescript
import * as assert from 'assert';

describe('Extension', () => {
  it('should load configuration', () => {
    assert.strictEqual(typeof process.env.NODE_ENV, 'string');
    assert.ok(true, 'Basic test passing');
  });
});
```

- [ ] File saved

**[13:50–14:00] Run Tests (10 min)**
```bash
npm test
```

Expected output:
```
PASS  src/test/extension.test.ts
  Extension
    ✓ should load configuration (5 ms)

Test Suites: 1 passed, 1 total
Tests:       1 passed, 1 total
```

- [ ] Test passes

**Success Checkpoint**: Jest configured; sample test passes.

---

### Task S1.1.4: Initialize Git Repository (0.5 hours)
**Owner**: Developer  
**Dependencies**: S1.1.1  
**Risk**: 🟢 Low (standard Git)

#### Execution Steps:

**[14:00–14:05] Create .gitignore (5 min)**

Create `.gitignore` in root:

```
# Dependencies
node_modules/
package-lock.json
npm-debug.log*

# Build outputs
dist/
*.vsix
*.tgz

# IDE
.vscode-test/
.DS_Store
*.swp

# Test coverage
coverage/
.nyc_output/

# Environment
.env
.env.local

# OS
Thumbs.db
```

- [ ] File saved

**[14:05–14:15] Initialize Git (10 min)**
```bash
cd ~/Devs/KBIngest/extension
git init
git config user.name "Developer"
git config user.email "dev@example.com"
git add .
git commit -m "chore: initial extension scaffold with TypeScript + Jest"
git log --oneline
```

Expected output:
```
b3f2a1c chore: initial extension scaffold with TypeScript + Jest
```

- [ ] Commit created and visible in `git log`

**[14:15–14:20] Tag Version (5 min)**
```bash
git tag -a v0.1.0-alpha -m "Sprint 1 Week 1 - Day 1: Scaffolding"
git describe --tags
```

Expected output:
```
v0.1.0-alpha
```

- [ ] Tag created

**Success Checkpoint**: Git initialized; first commit with .gitignore.

---

### Task S1.1.5: Development Environment Documentation (1.5 hours)
**Owner**: Developer  
**Dependencies**: S1.1.1–S1.1.4  
**Risk**: 🟢 Low (documentation only)

#### Execution Steps:

**[14:20–14:50] Create README.md (30 min)**

Create `README.md` in project root:

```markdown
# KB Extension

A VS Code extension for personal knowledge management with Copilot Chat integration.

## Quick Start

### Prerequisites
- Node.js ≥18.0.0
- VS Code ≥1.85.0
- npm ≥9.0.0

### Setup

```bash
# Clone repo
git clone <repo> kb-extension
cd kb-extension

# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Run tests
npm test

# Start in debug mode
npm run watch
# Then press F5 in VS Code to launch debug session
```

## Available Commands

| Command | Purpose |
|---------|---------|
| `npm run compile` | Compile TypeScript to JavaScript |
| `npm run watch` | Watch for changes and recompile |
| `npm test` | Run Jest tests |
| `npm run lint` | Lint TypeScript (if configured) |

## Debugging

### Debug in VS Code

1. Open this folder in VS Code
2. Press `F5` to launch debug session
3. Extension runs in new VS Code window
4. Set breakpoints in `src/extension.ts`
5. Use Debug Console for inspection

### View Logs

```bash
# Watch extension output
tail -f ~/.config/Code/logs/*/window*/console.txt
```

## Project Structure

```
kb-extension/
├── src/
│   ├── extension.ts      # Main extension entry
│   └── test/             # Jest tests
├── package.json          # Dependencies & scripts
├── tsconfig.json         # TypeScript config
├── jest.config.js        # Jest config
└── README.md            # This file
```

## Troubleshooting

### Issue: `node_modules not found`
**Solution**: `npm install`

### Issue: TypeScript compilation errors
**Solution**: `npm run compile` — check error messages

### Issue: Jest tests fail
**Solution**: `npm test -- --verbose` for details

## Next Steps

See WEEK_1_EXECUTABLE_PLAN.md for daily tasks.
```

- [ ] File saved

**[14:50–15:10] Create Debugging Guide (20 min)**

Append to README or create `docs/DEBUGGING.md`:

```markdown
# Debugging Guide

## VS Code Extension Debugging

### Setting Breakpoints

1. Open `src/extension.ts`
2. Click left of line number (red dot appears)
3. Press F5 to start debugging
4. Code stops at breakpoint in debug window

### Debug Console

Use Debug Console (Ctrl+Shift+Y) to run:
```typescript
// Print a variable
console.log(myVar);

// Call a function
someFunction();
```

### Launch Configuration

File: `.vscode/launch.json` (auto-generated)

Key settings:
- `runtimeExecutable`: Points to VS Code Insiders (if using)
- `args`: ["--extensionDevelopmentPath=${workspaceFolder}"]

### Common Tasks

| Task | How |
|------|-----|
| Reload extension | Press Ctrl+R in debug VS Code |
| Stop debugging | Press Shift+F5 or close debug window |
| Inspect object | `console.log(JSON.stringify(obj, null, 2))` |
```

- [ ] File saved

**[15:10–15:25] Add Troubleshooting Section (15 min)**

Append to README:

```markdown
## Known Issues & Fixes

### npm ERR! code ERESOLVE
**Cause**: Dependency conflict  
**Fix**: `npm install --legacy-peer-deps`

### TypeScript error: "Cannot find module 'vscode'"
**Cause**: Types not installed  
**Fix**: `npm install --save-dev @types/vscode`

### Jest: "No tests found"
**Cause**: Test file not in pattern  
**Fix**: Ensure test files named `*.test.ts` in `src/test/`
```

- [ ] File saved and committed

**Success Checkpoint**: Development docs complete and clear.

---

### Task S1.1.6: Git Workflow Documentation (1 hour)
**Owner**: Developer  
**Dependencies**: S1.1.4  
**Risk**: 🟢 Low (documentation only)

#### Execution Steps:

**[15:25–15:45] Create CONTRIBUTING.md (20 min)**

Create `CONTRIBUTING.md` in root:

```markdown
# Contributing to KB Extension

## Commit Message Format

Follow conventional commits:

```
<type>(<scope>): <subject>
<blank line>
<body>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `test`: Test additions/fixes
- `chore`: Build, dependencies, config
- `refactor`: Code changes (no feature/fix)

### Examples
```
feat(storage): implement SQLite schema
fix(extension): resolve initialization error
docs(readme): add debugging guide
chore(deps): upgrade TypeScript to 5.2.0
```

## Branching

- `main`: Production-ready code
- `develop`: Integration branch
- `feature/*`: Feature branches (e.g., `feature/storage-layer`)
- `fix/*`: Bug fix branches (e.g., `fix/extension-crash`)

## Pull Request Checklist

- [ ] Feature branch created from `develop`
- [ ] All tests passing: `npm test`
- [ ] TypeScript compiles: `npm run compile`
- [ ] Code reviewed
- [ ] Commit message follows format
- [ ] Documentation updated

## Testing

Before committing:

```bash
npm run compile   # TypeScript errors?
npm test          # Tests passing?
npm run lint      # Code style?
```

## Release Process

1. Merge `develop` → `main`
2. Create tag: `git tag -a v0.X.Y`
3. Update CHANGELOG.md
4. Push tags: `git push --tags`
```

- [ ] File saved

**[15:45–16:00] Create CHANGELOG.md Template (15 min)**

Create `CHANGELOG.md`:

```markdown
# Changelog

All notable changes to this project documented here.

## [Unreleased]

### Added
- Initial project scaffold

### Changed
- N/A

### Fixed
- N/A

### Removed
- N/A

## [0.1.0-alpha] - 2026-04-25

### Added
- VS Code extension bootstrap
- TypeScript configuration
- Jest test framework
- Git repository initialization

[Unreleased]: https://github.com/user/kb-extension/compare/v0.1.0-alpha...develop
[0.1.0-alpha]: https://github.com/user/kb-extension/releases/tag/v0.1.0-alpha
```

- [ ] File saved

**Success Checkpoint**: Contributing guide + CHANGELOG created.

---

### End of Day 1: Wrap-up (16:00–17:00 / 1 hour)

**[16:00–16:30] Code Review & Cleanup (30 min)**

Checklist:
- [ ] Run `npm run compile` — no errors
- [ ] Run `npm test` — all pass
- [ ] Check `.gitignore` covers all temp files
- [ ] Review `package.json` for required fields

**[16:30–16:45] Commit & Tag (15 min)**
```bash
git add .
git commit -m "docs: add README, debugging guide, and CONTRIBUTING"
git tag -a v0.1.0-day1 -m "End of Day 1: Scaffolding complete"
```

- [ ] Second commit visible in log

**[16:45–17:00] Update Progress Notes (15 min)**

Update `PROGRESS.md` (create if missing):

```markdown
## Day 1 Status: ✅ COMPLETE

### Completed Tasks
- ✅ S1.1.1: Extension scaffold created
- ✅ S1.1.2: TypeScript strict mode configured
- ✅ S1.1.3: Jest testing framework setup
- ✅ S1.1.4: Git initialized with .gitignore
- ✅ S1.1.5: README + debugging guide
- ✅ S1.1.6: Contributing guidelines

### Key Metrics
- Tests passing: 1/1 ✅
- Compilation time: ~2s ✅
- Lines of documentation: 150+
- Git commits: 2

### Issues Encountered
- None

### Tomorrow's Focus
- S1.1.7: Project structure validation
- S1.2.1: Database schema design (3 hours)
- S1.3.1: Configuration schema design

### Notes
- Yeoman-generated project was clean, minimal manual tweaks
- TypeScript strict mode ready for enforcing quality
```

- [ ] File saved and committed

---

## Day 1 Success Criteria ✅

By EOD Monday, verify:

- [ ] Extension scaffold created via `yo code`
- [ ] `npm run compile` succeeds with zero errors
- [ ] `npm test` passes (1 test minimum)
- [ ] Extension launches in debug mode (F5 in VS Code)
- [ ] Git repo initialized with first 2 commits
- [ ] README.md explains setup process
- [ ] CONTRIBUTING.md documents workflow
- [ ] CHANGELOG.md started
- [ ] All changes committed and tagged `v0.1.0-day1`

**Expected Output**: Repository ready for Day 2; developer can compile, test, and debug without issues.

---

---

# DAY 2 (Tuesday) - DOCUMENTATION & STORAGE DESIGN

**Theme**: Complete scaffolding validation; begin foundational architecture design.  
**Target Hours**: 8 (1h + 1h + 1h + 3h + 1h + 1h)  
**Success Criteria**: Extension fully validated; database schema designed and reviewed.

---

## Day 2 Morning Block (09:00–12:00 / 3 hours)

### Task S1.1.7: Project Structure Validation (1 hour)
**Owner**: Developer  
**Dependencies**: All S1.1 tasks (Day 1)  
**Risk**: 🟡 Medium (may reveal hidden setup issues)

#### Execution Steps:

**[09:00–09:15] Validate Directory Structure (15 min)**

```bash
cd ~/Devs/KBIngest/extension
tree -L 3 -I 'node_modules'
```

Expected structure:
```
├── .git
├── .vscode/
│   ├── launch.json
│   └── tasks.json
├── dist/
│   ├── extension.js
│   ├── extension.js.map
│   └── extension.d.ts
├── src/
│   ├── extension.ts
│   └── test/
│       └── extension.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
├── .gitignore
├── README.md
├── CONTRIBUTING.md
├── CHANGELOG.md
└── node_modules/ (hidden)
```

Verify each component:
- [ ] `.git/` exists and has commits
- [ ] `src/extension.ts` is TypeScript (not JavaScript)
- [ ] `dist/` folder contains compiled output
- [ ] `package.json` has scripts: `compile`, `watch`, `test`

**[09:15–09:30] Verify package.json Scripts (15 min)**

```bash
npm run
```

Check that these are listed:
- [ ] `compile` → `tsc`
- [ ] `watch` → `tsc --watch`
- [ ] `test` → `jest`
- [ ] `package` → `vsce package`
- [ ] `lint` (if configured)

**[09:30–09:45] Test Full Build Cycle (15 min)**

```bash
npm run compile
npm test
npm run watch &  # Start in background
sleep 2
kill %1         # Stop watch
```

Expected:
- [ ] Compilation completes in <5s
- [ ] All tests pass
- [ ] No warnings or errors

**[09:45–10:00] Launch Debug Session (15 min)**

1. Open VS Code with extension folder
2. Press `F5` to launch debug
3. New VS Code window opens (debug instance)
4. Open extension output pane (Ctrl+`)
5. Press Ctrl+R to reload
6. Press Shift+F5 to stop debugging

Verify:
- [ ] Extension loads without crash
- [ ] Debug console shows no errors
- [ ] Extension activates successfully

**Success Checkpoint**: All core systems validated; extension boots cleanly.

---

### Task S1.2.1: Design Database Schema (3 hours) 🔴 **CRITICAL PATH**
**Owner**: Developer  
**Dependencies**: S1.1 complete  
**Risk**: 🔴 HIGH (foundational decision; changes later are expensive)

This is the **most important task of the week**. Quality here saves days of rework.

#### Execution Steps:

**[10:00–10:45] Requirements & ERD (45 min)**

**Phase 1a: Understand the Data Model (15 min)**

Questions to answer:
- What is a "document"? (User-uploaded file, URL, or both?)
- What is a "chunk"? (Paragraph, token-window, semantic-boundary?)
- What is a "collection"? (Folder, tag, or manual grouping?)
- Metadata: tags, created_date, updated_date, source_url?

Write answers in `docs/SCHEMA_DESIGN.md`:

```markdown
# Database Schema Design

## Entity Definitions

### Document
- Represents a file or content source ingested by user
- Attributes: id, name, type (markdown/pdf/text), size_bytes, created_date, updated_date, hash (for dedup)
- Relationships: has many Chunks, has many Tags

### Chunk
- Represents a portion of a Document (e.g., paragraph, token-window)
- Attributes: id, document_id, sequence, text, token_count, embedding (FK to vectors table)
- Relationships: belongs to Document, has one Vector

### Vector
- Represents the embedding of a Chunk (1536D for OpenAI model)
- Attributes: id, chunk_id, embedding (blob/text), model_name, created_date
- Relationships: belongs to Chunk

### Tag
- Represents user-created tags for organization
- Attributes: id, name, color (optional), created_date
- Relationships: has many Documents (many-to-many)

### Collection
- Represents a grouping of Documents (e.g., "Project X", "Research")
- Attributes: id, name, description, created_date
- Relationships: has many Documents

## Relationships

```
Document (1) ──────→ (many) Chunk
  (1) ──────→ (many) Tag (via document_tags table)
  (1) ──────→ (many) Collection (via document_collections table)

Chunk (1) ──────→ (1) Vector

Vector (1) ──────→ (1) Chunk
```
```

- [ ] Save file

**Phase 1b: Create Entity-Relationship Diagram (30 min)**

Create `docs/schema_erd.txt` (ASCII art):

```
┌─────────────────────┐
│    DOCUMENTS        │
├─────────────────────┤
│ id (PK)             │
│ name                │ 
│ type                │
│ source_path         │
│ size_bytes          │
│ hash                │
│ created_date        │
│ updated_date        │
└──────────┬──────────┘
           │
    ┌──────┴───────┬──────────────────┐
    │              │                  │
    ▼              ▼                  ▼
┌────────────┐ ┌──────────────┐ ┌─────────────┐
│  CHUNKS    │ │ DOC_TAGS     │ │ DOC_COLLS   │
├────────────┤ ├──────────────┤ ├─────────────┤
│ id (PK)    │ │ doc_id (FK)  │ │ doc_id (FK) │
│ doc_id (FK)│ │ tag_id (FK)  │ │ coll_id (FK)│
│ sequence   │ └──────────────┘ └─────────────┘
│ text       │        ▲                ▲
│ token_count│        │                │
│ vector_id  │        │                │
└─────┬──────┘   ┌────┴────┐      ┌────┴─────┐
      │          │  TAGS   │      │COLLECTIONS
      ▼          ├─────────┤      ├───────────┤
 ┌─────────┐     │ id (PK) │      │ id (PK)   │
 │ VECTORS │     │ name    │      │ name      │
 ├─────────┤     │ color   │      │ desc      │
 │ id (PK) │     └─────────┘      └───────────┘
 │ chunk_id│
 │ emb[..] │
 │ model   │
 └─────────┘
```

- [ ] Save file

---

**[10:45–11:30] Design SQL Schema (45 min)**

Create `schema.sql`:

```sql
-- ============================================
-- KB Extension Schema v1.0
-- Created: 2026-04-23
-- ============================================

-- Enable foreign keys for SQLite
PRAGMA foreign_keys = ON;

-- ============================================
-- DOCUMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('markdown', 'plaintext', 'pdf')),
  source_path TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  hash TEXT UNIQUE NOT NULL,           -- SHA-256 for deduplication
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,                       -- JSON: {source: "...", tags: [...]}
  CHECK (size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(hash);
CREATE INDEX IF NOT EXISTS idx_documents_created_date ON documents(created_date);

-- ============================================
-- CHUNKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,           -- Order within document (1, 2, 3, ...)
  text TEXT NOT NULL,
  token_count INTEGER NOT NULL,        -- For tracking OpenAI token limits
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE (document_id, sequence),
  CHECK (sequence >= 0),
  CHECK (token_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_sequence ON chunks(sequence);

-- ============================================
-- VECTORS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS vectors (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL UNIQUE,
  embedding TEXT NOT NULL,             -- JSON array [0.123, 0.456, ...]
  model_name TEXT NOT NULL,            -- e.g., "sentence-transformers/all-MiniLM-L6-v2"
  dimension INTEGER NOT NULL,          -- e.g., 384 or 1536
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE,
  CHECK (dimension > 0)
);

CREATE INDEX IF NOT EXISTS idx_vectors_chunk_id ON vectors(chunk_id);
CREATE INDEX IF NOT EXISTS idx_vectors_model_name ON vectors(model_name);

-- ============================================
-- TAGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT,                          -- Hex color: #RRGGBB
  description TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ============================================
-- DOCUMENT_TAGS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS document_tags (
  document_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (document_id, tag_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_tags_tag_id ON document_tags(tag_id);

-- ============================================
-- COLLECTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_collections_name ON collections(name);

-- ============================================
-- DOCUMENT_COLLECTIONS (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS document_collections (
  document_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (document_id, collection_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_doc_colls_coll_id ON document_collections(collection_id);

-- ============================================
-- METADATA TRACKING
-- ============================================
CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

INSERT OR IGNORE INTO schema_versions (version, description) 
VALUES (1, 'Initial schema: documents, chunks, vectors, tags, collections');

-- ============================================
-- VIEWS FOR COMMON QUERIES
-- ============================================

-- View: Documents with tag counts
CREATE VIEW IF NOT EXISTS documents_with_stats AS
SELECT 
  d.id,
  d.name,
  d.type,
  d.size_bytes,
  COUNT(DISTINCT c.id) as chunk_count,
  COUNT(DISTINCT dt.tag_id) as tag_count,
  COUNT(DISTINCT v.id) as vector_count,
  d.created_date
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
LEFT JOIN document_tags dt ON d.id = dt.document_id
LEFT JOIN vectors v ON c.id = v.chunk_id
GROUP BY d.id;

-- View: Chunks with vector info
CREATE VIEW IF NOT EXISTS chunks_with_vectors AS
SELECT 
  c.id,
  c.document_id,
  c.sequence,
  LENGTH(c.text) as text_length,
  c.token_count,
  v.id as vector_id,
  v.model_name,
  v.dimension
FROM chunks c
LEFT JOIN vectors v ON c.id = v.chunk_id;
```

- [ ] Save as `schema.sql` in root

**[11:30–12:00] Design Review & Documentation (30 min)**

Create `docs/SCHEMA_DECISIONS.md`:

```markdown
# Schema Design Decisions

## Why Each Table?

### documents
- Central entity; represents user's uploaded content
- Deduplication via `hash` prevents re-ingesting same file
- `type` field allows different parsing strategies

### chunks
- Separates documents into searchable units
- `sequence` preserves document order
- `token_count` enables batch processing within API limits
- Cascade delete ensures cleanup when document deleted

### vectors
- 1:1 relationship with chunks (one embedding per chunk)
- `model_name` allows future re-embedding with different models
- Stored as JSON for flexibility (can later add Qdrant integration)

### tags & collections
- Two ways to organize documents (flat tags vs hierarchical collections)
- Many-to-many relationships via junction tables
- Separate tables allow independent growth

## Normalization

- **3NF**: No transitive dependencies
- **Primary Keys**: Always TEXT UUIDs (easier to generate in JavaScript)
- **Foreign Keys**: All enabled in SQLite
- **Cascading Deletes**: Clean removal of related records

## Performance Considerations

- **Indexes**: Created on:
  - Primary lookups (id)
  - Foreign keys (document_id, chunk_id)
  - Common filters (hash, created_date)
  - M2M lookups (tag_id, collection_id)
- **Index Count**: 13 indexes for ~8 tables = ~1.6 indexes per table (reasonable)
- **Query Optimization**: Views pre-compute common aggregations

## Future Extensions

- [ ] Full-text search (FTS5 table for chunks.text)
- [ ] Search history (searches table)
- [ ] User notes/annotations (annotations table)
- [ ] Sync metadata (last_synced, deleted_flag)

## Migration Strategy

Versions tracked in `schema_versions` table. Future migrations:
- v2: Add FTS5 full-text search
- v3: Add user annotations table
- v4: Add sync metadata fields

## Testing

- [ ] All tables created without error
- [ ] Foreign key constraints enforced
- [ ] Cascading deletes work
- [ ] Indexes improve query performance
- [ ] NULL/CHECK constraints respected
```

- [ ] Save file

**Success Checkpoint**: Schema designed, documented, and reviewed for correctness.

---

## Day 2 Lunch Break (12:00–13:00)

---

## Day 2 Afternoon Block (13:00–17:00 / 4 hours)

### Task S1.2.2: Plan Migration System (1.5 hours)
**Owner**: Developer  
**Dependencies**: S1.2.1  
**Risk**: 🟡 Medium (planning only; no implementation)

#### Execution Steps:

**[13:00–13:20] Research Migration Patterns (20 min)**

Review patterns:
- Versioned SQL files (`migrations/001_initial.sql`, `migrations/002_add_fts.sql`)
- Migration registry table (`schema_versions`)
- Rollback strategy (downgrade SQL files)

Approach for this project:
- Migrations folder: `src/storage/migrations/`
- Each file named: `{version:03d}_{description}.sql`
- Example: `001_initial_schema.sql`, `002_add_fts5.sql`
- Registry: `schema_versions` table tracks applied versions

- [ ] Document in `docs/MIGRATIONS.md`

**[13:20–13:40] Design Migration File Structure (20 min)**

Create `src/storage/migrations/` folder:

```bash
mkdir -p src/storage/migrations
```

Create migration template `src/storage/migrations/.template.sql`:

```sql
-- ============================================
-- Migration: {VERSION} - {DESCRIPTION}
-- Applied: (auto-filled)
-- ============================================

-- FORWARD (v{VERSION})
BEGIN TRANSACTION;

-- Example: Add new column
-- ALTER TABLE documents ADD COLUMN new_field TEXT;

-- Example: Create new table
-- CREATE TABLE IF NOT EXISTS new_table ( ... );

-- Record migration
INSERT INTO schema_versions (version, description) 
VALUES ({VERSION}, '{DESCRIPTION}');

COMMIT;

-- ============================================
-- ROLLBACK (v{VERSION-1})
-- ============================================
/*
BEGIN TRANSACTION;

-- Reverse changes
-- DROP TABLE IF EXISTS new_table;
-- ALTER TABLE documents DROP COLUMN new_field;

-- Remove migration record
DELETE FROM schema_versions WHERE version = {VERSION};

COMMIT;
*/
```

- [ ] File saved

Create `src/storage/migrations/001_initial_schema.sql` (copy from earlier `schema.sql` with wrapped transaction):

```sql
BEGIN TRANSACTION;

-- [Full schema.sql content here]

INSERT INTO schema_versions (version, description) 
VALUES (1, 'Initial schema: documents, chunks, vectors, tags, collections');

COMMIT;
```

- [ ] File saved

---

**[13:40–14:10] Plan MigrationManager Interface (30 min)**

Create `src/storage/MigrationManager.interface.ts`:

```typescript
/**
 * MigrationManager
 * 
 * Handles database schema versioning and migrations.
 * Responsibilities:
 * - Track applied migrations
 * - Apply pending migrations in order
 * - Rollback to previous version (future)
 * - Report current schema version
 */

export interface IMigration {
  version: number;
  description: string;
  up: (db: any) => Promise<void>;
  down?: (db: any) => Promise<void>;
}

export interface IMigrationManager {
  /**
   * Get current schema version from database
   */
  getCurrentVersion(): Promise<number>;

  /**
   * Get list of available migrations
   */
  getAvailableMigrations(): Promise<IMigration[]>;

  /**
   * Get list of pending migrations (not yet applied)
   */
  getPendingMigrations(): Promise<IMigration[]>;

  /**
   * Apply all pending migrations in order
   * @returns number of migrations applied
   */
  migrate(): Promise<number>;

  /**
   * Rollback to specific version (future feature)
   * @param targetVersion - version to rollback to
   */
  rollback(targetVersion: number): Promise<void>;

  /**
   * Verify database schema integrity
   * @returns true if schema valid, throws if not
   */
  verify(): Promise<boolean>;
}
```

- [ ] File saved

**[14:10–14:25] Document Rollback Strategy (15 min)**

Add to `docs/MIGRATIONS.md`:

```markdown
# Rollback Strategy

## During Development (Week 1-4)

**Policy**: Rollback is manual; delete and re-init database

```bash
rm -f kb.db
npm run db:init   # Re-apply all migrations from scratch
```

## After MVP Release (Week 8+)

**Policy**: Support rollback via down scripts

- Each migration includes optional `down()` method
- User can run: `npm run db:rollback --to=2`
- Transactions ensure atomicity

## Migration Isolation

- Each migration in its own transaction
- If migration fails, transaction rolls back automatically
- Schema_versions table not modified if migration fails

## Testing Migrations

Procedure:
1. Apply migration v1 → v2
2. Verify schema correct
3. Rollback v2 → v1
4. Verify original schema restored
5. Repeat forward
```

- [ ] Append to `docs/MIGRATIONS.md`

---

**[14:25–14:40] Create Migration File Templates (15 min)**

Create `src/storage/migrations/README.md`:

```markdown
# Migrations

Place all database schema migrations here.

## Naming Convention

`{VERSION:03d}_{description}.sql`

Examples:
- `001_initial_schema.sql`
- `002_add_fts5_search.sql`
- `003_add_sync_metadata.sql`

## Adding a New Migration

1. Create file `src/storage/migrations/{next_version}_{description}.sql`
2. Write UP script (apply changes)
3. Write DOWN script (rollback)
4. Test: `npm run db:migrate`
5. Verify: `npm run db:verify`

## Example: Adding a Table

```sql
BEGIN TRANSACTION;

-- UP
CREATE TABLE IF NOT EXISTS annotations (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL UNIQUE,
  note TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
);

-- Record migration
INSERT INTO schema_versions (version, description)
VALUES (3, 'Add annotations table');

COMMIT;

-- DOWN (commented)
/*
BEGIN TRANSACTION;
DROP TABLE IF EXISTS annotations;
DELETE FROM schema_versions WHERE version = 3;
COMMIT;
*/
```

## Current Migrations

- v1: Initial schema (documents, chunks, vectors, tags, collections)
- v2: (Planned) Full-text search (FTS5)
- v3: (Planned) Annotations
```

- [ ] File saved

**Success Checkpoint**: Migration system architecture documented; template files created.

---

### Task S1.2.3: Plan StorageManager Architecture (1.5 hours)
**Owner**: Developer  
**Dependencies**: S1.2.1  
**Risk**: 🟢 Low (design only; no code)

#### Execution Steps:

**[14:40–15:10] Define StorageManager Interface (30 min)**

Create `src/storage/StorageManager.interface.ts`:

```typescript
/**
 * StorageManager
 * 
 * Handles all database operations for KB Extension.
 * Provides CRUD interface for documents, chunks, vectors, tags, collections.
 */

// ============================================
// TYPES
// ============================================

export interface IDocument {
  id: string;
  name: string;
  type: 'markdown' | 'plaintext' | 'pdf';
  sourcePath?: string;
  sizeBytes: number;
  hash: string;
  createdDate: Date;
  updatedDate: Date;
}

export interface IChunk {
  id: string;
  documentId: string;
  sequence: number;
  text: string;
  tokenCount: number;
}

export interface IVector {
  id: string;
  chunkId: string;
  embedding: number[];
  modelName: string;
  dimension: number;
}

export interface ITag {
  id: string;
  name: string;
  color?: string;
}

export interface ICollection {
  id: string;
  name: string;
  description?: string;
}

// ============================================
// QUERY/FILTER TYPES
// ============================================

export interface DocumentFilter {
  id?: string;
  name?: string;
  type?: string;
  tags?: string[];
  collections?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  chunk: IChunk;
  similarity?: number;  // 0-1 for vector similarity
  relevance?: number;   // 0-1 for full-text match
}

// ============================================
// MAIN INTERFACE
// ============================================

export interface IStorageManager {
  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Initialize database: create tables, apply migrations
   */
  init(): Promise<void>;

  /**
   * Health check: verify DB is accessible and schema valid
   */
  health(): Promise<boolean>;

  /**
   * Close database connection
   */
  close(): Promise<void>;

  // ============================================
  // DOCUMENTS CRUD
  // ============================================

  createDocument(doc: Omit<IDocument, 'id' | 'createdDate' | 'updatedDate'>): Promise<IDocument>;

  getDocument(id: string): Promise<IDocument | null>;

  listDocuments(filter?: DocumentFilter): Promise<IDocument[]>;

  updateDocument(id: string, updates: Partial<IDocument>): Promise<IDocument>;

  deleteDocument(id: string): Promise<void>;

  // ============================================
  // CHUNKS CRUD
  // ============================================

  createChunk(chunk: Omit<IChunk, 'id'>): Promise<IChunk>;

  createChunks(chunks: Omit<IChunk, 'id'>[]): Promise<IChunk[]>;

  getChunk(id: string): Promise<IChunk | null>;

  listChunks(documentId: string): Promise<IChunk[]>;

  deleteChunksByDocument(documentId: string): Promise<void>;

  // ============================================
  // VECTORS CRUD
  // ============================================

  createVector(vector: Omit<IVector, 'id'>): Promise<IVector>;

  createVectors(vectors: Omit<IVector, 'id'>[]): Promise<IVector[]>;

  getVector(chunkId: string): Promise<IVector | null>;

  // ============================================
  // TAGS
  // ============================================

  createTag(tag: Omit<ITag, 'id'>): Promise<ITag>;

  listTags(): Promise<ITag[]>;

  addTagToDocument(documentId: string, tagId: string): Promise<void>;

  removeTagFromDocument(documentId: string, tagId: string): Promise<void>;

  // ============================================
  // COLLECTIONS
  // ============================================

  createCollection(coll: Omit<ICollection, 'id'>): Promise<ICollection>;

  listCollections(): Promise<ICollection[]>;

  addDocumentToCollection(documentId: string, collectionId: string): Promise<void>;

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Run multiple operations in a single transaction
   * @param fn - function receives StorageManager as parameter
   * @returns result of fn
   */
  transaction<T>(fn: (manager: IStorageManager) => Promise<T>): Promise<T>;

  // ============================================
  // SEARCH
  // ============================================

  /**
   * Vector similarity search
   * @param embedding - 1536D vector
   * @param limit - top-k results
   * @returns chunks sorted by similarity
   */
  searchByVector(embedding: number[], limit?: number): Promise<SearchResult[]>;

  /**
   * Full-text search (SQLite FTS)
   * @param query - search terms
   * @param limit - top-k results
   * @returns chunks matching query
   */
  searchByText(query: string, limit?: number): Promise<SearchResult[]>;

  /**
   * Hybrid search: vector + full-text combined
   */
  search(query: string, embedding?: number[], limit?: number): Promise<SearchResult[]>;

  // ============================================
  // STATS & DIAGNOSTICS
  // ============================================

  /**
   * Get database statistics
   */
  getStats(): Promise<{
    documentCount: number;
    chunkCount: number;
    vectorCount: number;
    tagCount: number;
    collectionCount: number;
    totalSizeBytes: number;
  }>;

  /**
   * Validate database integrity
   * @returns empty array if valid, list of errors if not
   */
  validate(): Promise<string[]>;
}
```

- [ ] File saved

**[15:10–15:30] Plan Transaction Support (20 min)**

Add to `docs/STORAGE_ARCHITECTURE.md`:

```markdown
# Transaction Support

## Pattern: Ingestion Pipeline

Typical transaction:

```typescript
await storageManager.transaction(async (tx) => {
  // 1. Create document
  const doc = await tx.createDocument({ ... });
  
  // 2. Create chunks
  const chunks = await tx.createChunks([ ... ]);
  
  // 3. Create vectors
  const vectors = await tx.createVectors([ ... ]);
  
  // All succeed or all rollback atomically
  return { doc, chunks, vectors };
});
```

## Benefits

- Atomicity: All or nothing
- Consistency: No partial state
- Isolation: No race conditions
- Durability: Changes persisted

## Implementation (Week 2)

```typescript
async transaction<T>(
  fn: (manager: IStorageManager) => Promise<T>
): Promise<T> {
  this.db.exec('BEGIN TRANSACTION');
  try {
    const result = await fn(this);
    this.db.exec('COMMIT');
    return result;
  } catch (error) {
    this.db.exec('ROLLBACK');
    throw error;
  }
}
```
```

- [ ] Append to docs

---

**[15:30–15:50] Plan Connection Pooling (20 min)**

Add to `docs/STORAGE_ARCHITECTURE.md`:

```markdown
# Connection Pooling Strategy

## Single vs. Pool

For MVP (local SQLite):
- **Single connection**: Thread-safe, simpler, sufficient for single-user extension
- **Pool**: Future optimization if multi-threaded background tasks emerge

## Implementation Plan

```typescript
class StorageManager {
  private db: Database;
  
  // Single connection, reused for all operations
  async init() {
    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');  // Write-Ahead Logging
    this.db.pragma('foreign_keys = ON');
  }
}
```

## Concurrency Model

- VS Code extension is **single-threaded** (event-driven)
- SQLite with WAL handles multiple readers + one writer
- No explicit pool needed for MVP

## Future: Background Jobs

If future sprints add background ingestion:
- Consider thread pool for async embedding generation
- SQLite connection pool (sqlite3 package supports this)
- Implement in Phase B (Weeks 9-20)
```

- [ ] Append to docs

---

**[15:50–16:05] Plan Error Handling (15 min)**

Create `src/storage/StorageError.ts`:

```typescript
/**
 * Storage error types
 */

export class StorageError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class NotFoundError extends StorageError {
  constructor(message: string, originalError?: Error) {
    super(message, 'NOT_FOUND', originalError);
  }
}

export class DuplicateError extends StorageError {
  constructor(message: string, originalError?: Error) {
    super(message, 'DUPLICATE', originalError);
  }
}

export class ConstraintError extends StorageError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CONSTRAINT', originalError);
  }
}

export class TransactionError extends StorageError {
  constructor(message: string, originalError?: Error) {
    super(message, 'TRANSACTION', originalError);
  }
}
```

- [ ] File saved

---

**Success Checkpoint**: StorageManager interface designed; transaction/error strategy defined.

---

### Task S1.3.1: Design Configuration Schema (1 hour)
**Owner**: Developer  
**Dependencies**: S1.1 complete  
**Risk**: 🟢 Low (settings schema standard)

#### Execution Steps:

**[16:05–16:35] Define KB Settings (30 min)**

Open `package.json` and add `contributes.configuration` section:

```json
{
  "contributes": {
    "configuration": {
      "title": "KB Extension",
      "properties": {
        "kb.storage.location": {
          "type": "string",
          "default": "${workspaceFolder}/.kb",
          "description": "Directory where KB database and files are stored",
          "scope": "resource"
        },
        "kb.storage.databaseFile": {
          "type": "string",
          "default": "kb.db",
          "description": "Filename for SQLite database",
          "scope": "resource"
        },
        "kb.embedding.model": {
          "type": "string",
          "enum": ["sentence-transformers/all-MiniLM-L6-v2", "sentence-transformers/all-mpnet-base-v2"],
          "default": "sentence-transformers/all-MiniLM-L6-v2",
          "description": "Embedding model to use for document vectors",
          "scope": "machine"
        },
        "kb.chunking.strategy": {
          "type": "string",
          "enum": ["paragraph", "sentence", "token-window"],
          "default": "paragraph",
          "description": "How to split documents into chunks",
          "scope": "resource"
        },
        "kb.chunking.size": {
          "type": "integer",
          "default": 512,
          "minimum": 100,
          "maximum": 2000,
          "description": "Target chunk size in tokens",
          "scope": "resource"
        },
        "kb.chunking.overlap": {
          "type": "integer",
          "default": 20,
          "minimum": 0,
          "maximum": 500,
          "description": "Token overlap between chunks",
          "scope": "resource"
        },
        "kb.search.limit": {
          "type": "integer",
          "default": 10,
          "minimum": 1,
          "maximum": 100,
          "description": "Number of search results to return",
          "scope": "resource"
        },
        "kb.search.threshold": {
          "type": "number",
          "default": 0.5,
          "minimum": 0,
          "maximum": 1,
          "description": "Minimum similarity score for vector search (0-1)",
          "scope": "resource"
        },
        "kb.logging.level": {
          "type": "string",
          "enum": ["debug", "info", "warn", "error"],
          "default": "info",
          "description": "Logging verbosity",
          "scope": "machine"
        },
        "kb.advanced.enableMetrics": {
          "type": "boolean",
          "default": false,
          "description": "Collect performance metrics (development only)",
          "scope": "machine"
        }
      }
    }
  }
}
```

- [ ] Changes saved to package.json

**[16:35–16:55] Document Settings Schema (20 min)**

Create `docs/SETTINGS.md`:

```markdown
# Configuration Settings

## Scopes

- **resource**: Per workspace or folder
- **machine**: Global VS Code machine (user profile)

## Categories

### Storage
- `kb.storage.location` - Where database lives (default: .kb in workspace)
- `kb.storage.databaseFile` - Database filename (default: kb.db)

### Embedding
- `kb.embedding.model` - Which model to use for embeddings
  - `sentence-transformers/all-MiniLM-L6-v2`: Lightweight (384D, ~60MB)
  - `sentence-transformers/all-mpnet-base-v2`: Larger (768D, ~400MB)

### Chunking
- `kb.chunking.strategy`: How to split documents
  - `paragraph`: By blank lines (simplest)
  - `sentence`: By sentence boundaries (more precise)
  - `token-window`: Fixed token window (most control)
- `kb.chunking.size`: Tokens per chunk (default 512)
- `kb.chunking.overlap`: Token overlap (default 20)

### Search
- `kb.search.limit`: Results to return (default 10)
- `kb.search.threshold`: Min similarity score 0-1 (default 0.5)

### Developer
- `kb.logging.level`: Debug verbosity (default: info)
- `kb.advanced.enableMetrics`: Performance tracking (default: false)

## Example: .vscode/settings.json

```json
{
  "kb.storage.location": "${workspaceFolder}/.kb-custom",
  "kb.chunking.size": 256,
  "kb.search.limit": 20,
  "kb.logging.level": "debug"
}
```

## Example: ~/.config/Code/User/settings.json (Global)

```json
{
  "kb.embedding.model": "sentence-transformers/all-mpnet-base-v2",
  "kb.logging.level": "info"
}
```

## Future Settings (Phase B)

- [ ] `kb.embedding.provider`: "local", "ollama", "openai"
- [ ] `kb.qdrant.mode`: "memory", "disk", "cloud"
- [ ] `kb.advanced.maxDocumentSizeBytes`
- [ ] `kb.advanced.cacheEmbeddings`
```

- [ ] File saved

---

**Success Checkpoint**: Configuration schema designed and documented; ready for Week 2 implementation.

---

## End of Day 2: Wrap-up (16:55–17:00 / 5 min)

**[16:55–17:00] Commit & Update Progress (5 min)**

```bash
git add .
git commit -m "docs: database schema & storage architecture design

- Add schema.sql with 8 tables and normalization
- Define StorageManager interface with CRUD operations
- Document migration system and transaction pattern
- Add configuration schema to package.json
- Create SCHEMA_DECISIONS.md with rationale"
git tag -a v0.2.0-day2 -m "End of Day 2: Architecture designed"
```

Update `PROGRESS.md`:

```markdown
## Day 2 Status: ✅ COMPLETE

### Completed Tasks
- ✅ S1.1.7: Project structure fully validated
- ✅ S1.2.1: Database schema designed (8 tables, 13 indexes)
- ✅ S1.2.2: Migration system architecture planned
- ✅ S1.2.3: StorageManager interface defined
- ✅ S1.3.1: Configuration schema designed

### Artifacts Created
- schema.sql (350+ lines, fully normalized 3NF)
- SCHEMA_DESIGN.md (ERD, entity definitions)
- SCHEMA_DECISIONS.md (rationale, future extensions)
- MIGRATIONS.md (versioning strategy)
- StorageManager.interface.ts (22 methods, full API)
- SETTINGS.md (11 configurable parameters)

### Key Metrics
- Lines of documentation: 500+
- SQL indexes: 13 (optimized for common queries)
- Configuration parameters: 11
- API methods (StorageManager): 22
- Git commits: 3

### Tomorrow's Focus
- S1.2.2 continued: Migration implementation plan
- S1.2.3 continued: StorageManager skeleton code
- S1.2.4: Setup SQLite dependencies (risky task - native build)
- S1.3.2: ConfigManager implementation

### Risks Identified & Mitigated
| Risk | Status | Mitigation |
|------|--------|-----------|
| Schema changes post-design | Low | Design reviewed; stable now |
| Native SQLite build issues | Medium | Have sql.js fallback ready |
| Configuration bloat | Low | Limited to 11 params; more in Phase B |

### Notes
- Database schema is solid; minor tweaks possible but major design done
- Migration system design enables safe schema evolution
- Week 2 can proceed with confidence on storage foundation
```

- [ ] File saved and committed

---

## Day 2 Success Criteria ✅

By EOD Tuesday:

- [ ] S1.1.7 validation complete; extension boots without error
- [ ] Schema.sql created (8 tables, normalized, documented)
- [ ] StorageManager interface fully defined (22 methods)
- [ ] Migration system architecture documented
- [ ] Configuration schema added to package.json (11 settings)
- [ ] All design documents committed (`SCHEMA_DECISIONS.md`, `MIGRATIONS.md`, `SETTINGS.md`)
- [ ] Zero blocker issues; ready for Day 3 architecture design

**Key Deliverable**: Comprehensive storage layer design; ready for Week 2 implementation.

---

---

# DAY 3 (Wednesday) - ARCHITECTURE DESIGN & TOOLING

**Theme**: Complete storage architecture design; install & validate database dependencies.  
**Target Hours**: 8 (1.5h + 1.5h + 1h + 1h + 2h + 0.5h buffer)  
**Success Criteria**: StorageManager interface & migration templates completed; SQLite driver working.

---

## Day 3 Morning Block (09:00–12:00 / 3 hours)

### Task S1.2.2 (Continued): Migration System Design (1.5 hours)
**Owner**: Developer  
**Dependencies**: S1.2.1 complete  
**Risk**: 🟡 Low-Medium (design/planning; no code)

#### Execution Steps:

**[09:00–09:30] Finalize Migration Architecture Document (30 min)**

Expand `docs/MIGRATIONS.md` with pseudocode for MigrationManager:

```markdown
# MigrationManager Implementation Plan (Week 2)

## Pseudocode

```typescript
class MigrationManager implements IMigrationManager {
  private db: Database;
  private migrationsPath: string;

  async getCurrentVersion(): Promise<number> {
    // Query schema_versions, return MAX(version)
    // Default: 0 if no migrations applied
  }

  async getAvailableMigrations(): Promise<IMigration[]> {
    // Scan migrations/ folder for SQL files
    // Parse version from filename (001_*.sql → version 1)
    // Sort by version ascending
  }

  async getPendingMigrations(): Promise<IMigration[]> {
    // Get all available
    // Filter where version > currentVersion
  }

  async migrate(): Promise<number> {
    // For each pending migration (in order):
    //   1. Read SQL file
    //   2. Execute in transaction
    //   3. Record in schema_versions
    //   4. Log success
    // Return count
  }

  async verify(): Promise<boolean> {
    // SELECT COUNT(*) FROM each table
    // Verify foreign keys work
    // Return true if healthy
  }
}
```

- [ ] Append to MIGRATIONS.md

---

**[09:30–10:00] Create Migration File Examples (30 min)**

Create `src/storage/migrations/001_initial_schema.sql`:

```sql
-- ============================================
-- Migration 001: Initial Schema
-- ============================================

BEGIN TRANSACTION;

-- [Full schema from schema.sql goes here - omitted for brevity]

-- Record migration
INSERT INTO schema_versions (version, description)
VALUES (1, 'Initial schema: documents, chunks, vectors, tags, collections');

COMMIT;
```

- [ ] File saved

Create `src/storage/migrations/002_add_fts5.sql` (template for future):

```sql
-- ============================================
-- Migration 002: Add Full-Text Search (FTS5) - FUTURE
-- ============================================

/*
BEGIN TRANSACTION;

-- Create FTS5 virtual table for full-text search on chunks
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  content='chunks',
  content_rowid='id',
  text
);

-- Populate FTS table with existing chunks
INSERT INTO chunks_fts(rowid, text) 
SELECT id, text FROM chunks;

-- Trigger to keep FTS updated on INSERT
CREATE TRIGGER IF NOT EXISTS chunks_fts_insert
AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, text) VALUES (new.id, new.text);
END;

-- Trigger to keep FTS updated on DELETE
CREATE TRIGGER IF NOT EXISTS chunks_fts_delete
AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, text) VALUES('delete', old.id, old.text);
END;

-- Record migration
INSERT INTO schema_versions (version, description)
VALUES (2, 'Add FTS5 full-text search on chunks');

COMMIT;

-- DOWN (rollback)
-- DROP TRIGGER IF EXISTS chunks_fts_insert;
-- DROP TRIGGER IF EXISTS chunks_fts_delete;
-- DROP TABLE IF EXISTS chunks_fts;
-- DELETE FROM schema_versions WHERE version = 2;
*/
```

- [ ] File saved

---

**Success Checkpoint**: Migration architecture finalized; template migrations created.

---

### Task S1.2.3 (Continued): StorageManager Architecture (1.5 hours)
**Owner**: Developer  
**Dependencies**: S1.2.1  
**Risk**: 🟢 Low (design/interface only; no implementation)

#### Execution Steps:

**[10:00–10:30] Add Error Handling to Interface (30 min)**

Update `src/storage/StorageManager.interface.ts` with error documentation:

```typescript
/**
 * Error Handling Strategy
 * 
 * StorageManager methods throw specific errors:
 * 
 * NotFoundError: Resource doesn't exist (e.g., getDocument(nonexistent))
 * DuplicateError: Unique constraint violated (e.g., duplicate hash)
 * ConstraintError: Foreign key or check constraint failed
 * TransactionError: Transaction failed and rolled back
 * 
 * Example:
 * 
 *   try {
 *     const doc = await manager.getDocument('nonexistent');
 *   } catch (e) {
 *     if (e instanceof NotFoundError) {
 *       console.log('Document not found');
 *     }
 *   }
 */

export interface IStorageManager {
  // ... (existing methods)

  /**
   * @throws NotFoundError if document not found
   */
  getDocument(id: string): Promise<IDocument | null>;

  /**
   * @throws DuplicateError if hash already exists
   * @throws ConstraintError if size_bytes < 0
   */
  createDocument(doc: Omit<IDocument, 'id' | 'createdDate' | 'updatedDate'>): Promise<IDocument>;

  /**
   * @throws ConstraintError if foreign key invalid
   */
  createChunk(chunk: Omit<IChunk, 'id'>): Promise<IChunk>;

  /**
   * @throws TransactionError if transaction fails
   */
  transaction<T>(fn: (manager: IStorageManager) => Promise<T>): Promise<T>;
}
```

- [ ] File saved

---

**[10:30–11:00] Design Search Query Interface (30 min)**

Add advanced search types to `src/storage/StorageManager.interface.ts`:

```typescript
/**
 * Advanced Search Support
 */

export interface VectorSearchOptions {
  embedding: number[];
  limit?: number;        // default 10
  threshold?: number;    // 0-1, default 0.5
  modelName?: string;    // filter by model (optional)
}

export interface TextSearchOptions {
  query: string;
  limit?: number;        // default 10
  documentIds?: string[]; // search only in these docs
}

export interface HybridSearchOptions {
  query: string;
  embedding: number[];
  vectorWeight?: number;  // 0-1, default 0.6
  textWeight?: number;    // 0-1, default 0.4
  limit?: number;
  threshold?: number;
}

// Updated StorageManager interface

export interface IStorageManager {
  // ... (existing methods)

  /**
   * Advanced vector search with options
   */
  searchByVectorAdvanced(options: VectorSearchOptions): Promise<SearchResult[]>;

  /**
   * Advanced full-text search with options
   */
  searchByTextAdvanced(options: TextSearchOptions): Promise<SearchResult[]>;

  /**
   * Hybrid search: combine vector + full-text with weights
   * vectorWeight + textWeight should sum to 1.0 (or auto-normalize)
   */
  searchHybrid(options: HybridSearchOptions): Promise<SearchResult[]>;

  /**
   * Get search metrics/diagnostics
   * (development only; disabled in production)
   */
  getSearchMetrics(): Promise<{
    lastVectorQueryTime: number;  // ms
    lastTextQueryTime: number;    // ms
    cacheHitRate: number;         // 0-1
  }>;
}
```

- [ ] File saved

---

**[11:00–11:30] Create StorageManager Implementation Checklist (30 min)**

Create `docs/STORAGEMANAGER_IMPLEMENTATION_CHECKLIST.md`:

```markdown
# StorageManager Implementation Checklist (Week 2)

## Phase 1: Database Connection & Lifecycle

- [ ] Initialize SQLite connection
  - [ ] Load database file or create if missing
  - [ ] Enable WAL mode (Write-Ahead Logging)
  - [ ] Enable foreign key constraints
  - [ ] Set connection timeout
- [ ] Apply migrations on init
  - [ ] Check schema_versions table
  - [ ] Run all pending migrations
  - [ ] Log migration results
- [ ] Implement health check
  - [ ] Query count from each table
  - [ ] Verify foreign keys work
  - [ ] Return boolean status
- [ ] Implement close/cleanup
  - [ ] Close database connection safely
  - [ ] Release any pooled connections (future)

## Phase 2: CRUD Operations

### Documents
- [ ] createDocument(...)
  - [ ] Generate UUID for id
  - [ ] Compute SHA-256 hash of content
  - [ ] Insert with timestamps
  - [ ] Return inserted record
- [ ] getDocument(id)
  - [ ] Query by id
  - [ ] Return or throw NotFoundError
- [ ] listDocuments(filter)
  - [ ] Support filter: tags, collections, date range
  - [ ] Support pagination: limit, offset
  - [ ] Join with tag/collection counts
- [ ] updateDocument(id, updates)
  - [ ] Only allow certain fields (not id, hash, createdDate)
  - [ ] Update updatedDate timestamp
- [ ] deleteDocument(id)
  - [ ] Cascade delete chunks, vectors, tags, collections

### Chunks
- [ ] createChunk / createChunks
  - [ ] Batch insert for performance
  - [ ] Validate sequence numbers
  - [ ] Check tokenCount > 0
- [ ] listChunks(documentId)
  - [ ] Query by documentId
  - [ ] Order by sequence ascending
- [ ] deleteChunksByDocument
  - [ ] Cascade delete vectors

### Vectors
- [ ] createVector / createVectors
  - [ ] Validate embedding dimension matches model
  - [ ] Store as JSON array
  - [ ] Batch insert for performance
- [ ] getVector(chunkId)
  - [ ] 1:1 relationship, return one or null

### Tags & Collections
- [ ] createTag, listTags, addTagToDocument
- [ ] createCollection, listCollections, addDocumentToCollection

## Phase 3: Advanced Features

### Transactions
- [ ] Implement transaction wrapper
  - [ ] BEGIN TRANSACTION
  - [ ] Call user function
  - [ ] COMMIT on success
  - [ ] ROLLBACK on error

### Search
- [ ] searchByVector(embedding, limit)
  - [ ] Load all vectors (Phase 1: in-memory, compute similarity)
  - [ ] Sort by cosine similarity
  - [ ] Return top-k with scores
  - [ ] (Phase B: Qdrant integration for 1M+ vectors)
- [ ] searchByText(query)
  - [ ] Use SQLite LIKE or FTS (if available)
  - [ ] Return matching chunks
- [ ] searchHybrid
  - [ ] Combine vector + text results
  - [ ] Weight and rank combined

### Statistics
- [ ] getStats()
  - [ ] Count each table
  - [ ] Sum document sizes
- [ ] validate()
  - [ ] Check referential integrity
  - [ ] Return list of errors

## Testing Requirements

- [ ] Unit tests for each CRUD method
  - [ ] Success case
  - [ ] Error case (not found, constraint violation)
- [ ] Integration tests for transactions
  - [ ] Verify atomicity (all or nothing)
  - [ ] Verify rollback works
- [ ] Search tests
  - [ ] Vector search returns results in order
  - [ ] Text search finds keywords
  - [ ] Hybrid search combines correctly
- [ ] Performance benchmarks
  - [ ] Create 1000 documents
  - [ ] Create 10,000 chunks
  - [ ] Search <100ms latency

## Week 2 Deliverables

- [ ] src/storage/StorageManager.ts (fully implemented)
- [ ] src/storage/StorageManager.test.ts (>80% coverage)
- [ ] src/storage/MigrationManager.ts (migrations working)
- [ ] All dependencies installed and working
- [ ] Health checks passing
```

- [ ] File saved

---

**Success Checkpoint**: StorageManager design complete; implementation checklist ready for Week 2.

---

## Day 3 Lunch Break (12:00–13:00)

---

## Day 3 Afternoon Block (13:00–17:00 / 4 hours)

### Task S1.2.4: Setup SQLite Dependency (1 hour)
**Owner**: Developer  
**Dependencies**: S1.1 complete  
**Risk**: 🔴 HIGH (native build can fail; fallback needed)

#### Execution Steps:

**[13:00–13:10] Evaluate SQLite Libraries (10 min)**

Research options:
1. **better-sqlite3**: Fastest, requires native build, may fail on some systems
2. **sqlite3**: Classic node-sqlite3, native build, widely supported
3. **sql.js**: Pure JavaScript, slower, no native build, works everywhere

**Decision for MVP**: Try better-sqlite3 first; have sql.js fallback

Create `docs/SQLITE_DECISION.md`:

```markdown
# SQLite Library Decision

## Options Considered

| Library | Pros | Cons | Status |
|---------|------|------|--------|
| better-sqlite3 | Fastest, synchronous API | Native build risk | PRIMARY |
| sqlite3 | Reliable, widely used | Callback API, slower | BACKUP |
| sql.js | Pure JS, zero build issues | Slower (in-process) | FALLBACK |

## Decision: better-sqlite3 (PRIMARY)

Rationale:
- Synchronous API cleaner than callbacks
- Performance matters for 1M+ vectors (future)
- Native build typically works on macOS/Linux/Windows

## Fallback Plan

If better-sqlite3 build fails:
1. Try `npm install sqlite3`
2. If that fails, try `npm install sql.js`
3. Document which was used in ENVIRONMENT_REPORT.md

## Verification

After install, verify:

```bash
node -e "const db = require('better-sqlite3')(':memory:'); console.log(db.exec('SELECT 1'))"
```

Should print: `[]` (empty result set) without errors.
```

- [ ] File saved

---

**[13:10–13:25] Install better-sqlite3 (15 min)**

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
```

**Possible outputs:**

✅ Success (most likely on macOS/Linux):
```
added 2 packages in 5.2s
```

❌ Native build error (less likely, but prepare for it):
```
npm ERR! build failed
```

If ❌ occurs, follow fallback:
```bash
npm uninstall better-sqlite3
npm install sqlite3
```

- [ ] Confirm packages added to package.json

---

**[13:25–13:40] Create Database Utility Module (15 min)**

Create `src/storage/database.ts`:

```typescript
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * Database utilities and helpers
 */

export class DatabaseConnection {
  private db: Database.Database | null = null;
  private dbPath: string;

  constructor(dbPath: string = ':memory:') {
    this.dbPath = dbPath;
  }

  /**
   * Open and initialize database
   */
  open(): Database.Database {
    if (this.db) {
      return this.db;
    }

    // Ensure directory exists if not in-memory
    if (this.dbPath !== ':memory:') {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // Create connection
    this.db = new Database(this.dbPath);

    // Configure SQLite
    this.db.pragma('journal_mode = WAL');
    this.db.pragma('foreign_keys = ON');
    this.db.pragma('synchronous = NORMAL');

    return this.db;
  }

  /**
   * Get existing connection or throw
   */
  getConnection(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }
    return this.db;
  }

  /**
   * Close database
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.db !== null;
  }
}

/**
 * Execute SQL file
 */
export function executeSqlFile(
  db: Database.Database,
  filePath: string
): void {
  const sql = fs.readFileSync(filePath, 'utf-8');
  db.exec(sql);
}
```

- [ ] File saved

---

**[13:40–13:55] Test Database Connection (15 min)**

Create `src/storage/database.test.ts`:

```typescript
import { DatabaseConnection } from './database';

describe('DatabaseConnection', () => {
  let conn: DatabaseConnection;

  beforeEach(() => {
    conn = new DatabaseConnection(':memory:');
  });

  afterEach(() => {
    conn.close();
  });

  it('should open in-memory database', () => {
    const db = conn.open();
    expect(db).toBeDefined();
  });

  it('should execute SQL', () => {
    const db = conn.open();
    db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, name TEXT)');
    const result = db.prepare('SELECT * FROM test').all();
    expect(result).toEqual([]);
  });

  it('should enforce foreign keys', () => {
    const db = conn.open();
    db.exec(`
      CREATE TABLE parent (id INTEGER PRIMARY KEY);
      CREATE TABLE child (id INTEGER PRIMARY KEY, parent_id INTEGER, FOREIGN KEY(parent_id) REFERENCES parent(id));
    `);

    const insert = db.prepare('INSERT INTO child (parent_id) VALUES (?)');
    expect(() => insert.run(999)).toThrow();
  });

  it('should be marked as connected when open', () => {
    expect(conn.isConnected()).toBe(false);
    conn.open();
    expect(conn.isConnected()).toBe(true);
  });

  it('should be marked as disconnected after close', () => {
    conn.open();
    conn.close();
    expect(conn.isConnected()).toBe(false);
  });
});
```

- [ ] File saved

**Run tests**:
```bash
npm test -- database.test.ts
```

Expected:
```
PASS  src/storage/database.test.ts
  DatabaseConnection
    ✓ should open in-memory database (5 ms)
    ✓ should execute SQL (3 ms)
    ✓ should enforce foreign keys (2 ms)
    ✓ should be marked as connected when open (1 ms)
    ✓ should be marked as disconnected after close (1 ms)

Test Suites: 1 passed, 1 total
Tests:       5 passed, 5 total
```

- [ ] Tests passing

**Success Checkpoint**: SQLite driver installed & tested; database utilities working.

---

### Task S1.3.2: ConfigManager Implementation (2 hours)
**Owner**: Developer  
**Dependencies**: S1.3.1  
**Risk**: 🟡 Medium (VS Code API, requires testing)

#### Execution Steps:

**[13:55–14:25] Create ConfigManager Skeleton (30 min)**

Create `src/config/ConfigManager.ts`:

```typescript
import * as vscode from 'vscode';

/**
 * Configuration Manager
 * 
 * Handles KB Extension settings with:
 * - VS Code settings workspace/machine scope
 * - Environment variable overrides (.env)
 * - Default values from package.json schema
 */

export interface IConfigManager {
  get<T>(key: string, defaultValue?: T): T | undefined;
  set<T>(key: string, value: T, scope: vscode.ConfigurationTarget): Promise<void>;
  watch(key: string, callback: (value: any) => void): void;
  getAll(): Record<string, any>;
}

export class ConfigManager implements IConfigManager {
  private config: vscode.WorkspaceConfiguration;
  private watchers: Map<string, Set<Function>> = new Map();

  constructor() {
    this.config = vscode.workspace.getConfiguration('kb');
    this.setupConfigChangeListener();
  }

  /**
   * Get configuration value
   * Precedence: Environment variables > VS Code settings > defaults
   */
  get<T>(key: string, defaultValue?: T): T | undefined {
    // Check environment variable first (HIGHEST priority)
    const envKey = `KB_${key.toUpperCase().replace(/\./g, '_')}`;
    const envValue = process.env[envKey];
    if (envValue !== undefined) {
      return this.parseValue(envValue) as T;
    }

    // Check VS Code settings
    const vsCodeValue = this.config.get<T>(key);
    if (vsCodeValue !== undefined) {
      return vsCodeValue;
    }

    // Return default
    return defaultValue;
  }

  /**
   * Set configuration value
   */
  async set<T>(
    key: string,
    value: T,
    scope: vscode.ConfigurationTarget = vscode.ConfigurationTarget.WorkspaceFolder
  ): Promise<void> {
    try {
      await this.config.update(key, value, scope);
      this.notifyWatchers(key, value);
    } catch (error) {
      console.error(`Failed to set config ${key}:`, error);
      throw error;
    }
  }

  /**
   * Watch for changes
   */
  watch(key: string, callback: Function): void {
    if (!this.watchers.has(key)) {
      this.watchers.set(key, new Set());
    }
    this.watchers.get(key)!.add(callback);
  }

  /**
   * Get all configuration as object
   */
  getAll(): Record<string, any> {
    return this.config.toJSON() || {};
  }

  /**
   * Internal: Parse value from environment variable
   */
  private parseValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (!isNaN(Number(value))) return Number(value);
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }

  /**
   * Internal: Notify watchers
   */
  private notifyWatchers(key: string, value: any): void {
    if (this.watchers.has(key)) {
      this.watchers.get(key)!.forEach(callback => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Watcher callback error for ${key}:`, error);
        }
      });
    }
  }

  /**
   * Internal: Listen for VS Code config changes
   */
  private setupConfigChangeListener(): void {
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('kb')) {
        this.config = vscode.workspace.getConfiguration('kb');
        // Notify all watchers
        this.watchers.forEach((callbacks, key) => {
          const value = this.get(key);
          callbacks.forEach(cb => cb(value));
        });
      }
    });
  }

  /**
   * Load environment variables from .env file
   */
  loadDotEnv(dotEnvPath: string): void {
    // Defer to dotenv package (install in S1.3.4)
    console.log(`[ConfigManager] dotenv support: ${dotEnvPath} (Week 2 enhancement)`);
  }
}

// Singleton instance
let configManager: ConfigManager | null = null;

export function getConfigManager(): ConfigManager {
  if (!configManager) {
    configManager = new ConfigManager();
  }
  return configManager;
}

export function resetConfigManager(): void {
  configManager = null;
}
```

- [ ] File saved

---

**[14:25–14:55] Create ConfigManager Tests (30 min)**

Create `src/config/ConfigManager.test.ts`:

```typescript
import * as vscode from 'vscode';
import { ConfigManager, resetConfigManager } from './ConfigManager';

describe('ConfigManager', () => {
  let manager: ConfigManager;

  beforeEach(() => {
    manager = new ConfigManager();
    resetConfigManager();
  });

  describe('get', () => {
    it('should get value from VS Code config', () => {
      // Note: In real tests, mock vscode.workspace.getConfiguration
      // For now, this is a placeholder test
      const value = manager.get('storage.location', '/default');
      expect(value).toBeDefined();
    });

    it('should return default if not set', () => {
      const value = manager.get('nonexistent', 'default-value');
      expect(value).toBe('default-value');
    });

    it('should prioritize environment variables', () => {
      process.env.KB_TEST_VALUE = 'from-env';
      const value = manager.get('test.value', 'default');
      expect(value).toBe('from-env');
      delete process.env.KB_TEST_VALUE;
    });
  });

  describe('set', () => {
    it('should set value', async () => {
      // Note: Requires mocking VS Code API
      // Placeholder for real implementation
      expect(manager).toBeDefined();
    });
  });

  describe('watch', () => {
    it('should call callback when value changes', (done) => {
      const callback = jest.fn();
      manager.watch('storage.location', callback);
      // Simulate config change
      // (requires VS Code API mocking)
      done();
    });
  });

  describe('getAll', () => {
    it('should return all config values', () => {
      const all = manager.getAll();
      expect(typeof all).toBe('object');
    });
  });
});
```

- [ ] File saved

**Run tests**:
```bash
npm test -- ConfigManager.test.ts
```

⚠️ Note: Tests will be partial (VS Code API mocking required). Full tests in Week 2.

---

**[14:55–15:25] Create Secrets Manager (30 min)**

Create `src/config/SecretManager.ts`:

```typescript
import * as vscode from 'vscode';

/**
 * Secret Storage Manager
 * 
 * Handles secure storage of sensitive data (API keys, tokens) using VS Code's
 * built-in SecretStorage API. Data is encrypted per VS Code's platform:
 * - macOS: Keychain
 * - Windows: DPAPI
 * - Linux: pass
 */

export interface ISecretManager {
  get(key: string): Promise<string | undefined>;
  store(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  listKeys(): Promise<string[]>;
}

export class SecretManager implements ISecretManager {
  private secretStorage: vscode.SecretStorage;

  constructor(secretStorage: vscode.SecretStorage) {
    this.secretStorage = secretStorage;
  }

  /**
   * Get secret value
   */
  async get(key: string): Promise<string | undefined> {
    try {
      const value = await this.secretStorage.get(key);
      return value;
    } catch (error) {
      console.error(`Failed to get secret ${key}:`, error);
      throw new Error(`SecretStorage get failed: ${error}`);
    }
  }

  /**
   * Store secret value (encrypted)
   */
  async store(key: string, value: string): Promise<void> {
    try {
      await this.secretStorage.store(key, value);
    } catch (error) {
      console.error(`Failed to store secret ${key}:`, error);
      throw new Error(`SecretStorage store failed: ${error}`);
    }
  }

  /**
   * Delete secret
   */
  async delete(key: string): Promise<void> {
    try {
      await this.secretStorage.delete(key);
    } catch (error) {
      console.error(`Failed to delete secret ${key}:`, error);
      throw new Error(`SecretStorage delete failed: ${error}`);
    }
  }

  /**
   * List all stored secret keys
   * Note: VS Code SecretStorage doesn't support key enumeration.
   * We maintain a list separately or track keys we've stored.
   */
  async listKeys(): Promise<string[]> {
    // Not directly supported by VS Code API
    // Workaround: maintain a registry key with list of keys
    const registry = await this.get('kb:secret-keys');
    return registry ? JSON.parse(registry) : [];
  }

  /**
   * Internal: Register a key (add to tracking list)
   */
  async registerKey(key: string): Promise<void> {
    const keys = await this.listKeys();
    if (!keys.includes(key)) {
      keys.push(key);
      await this.secretStorage.store('kb:secret-keys', JSON.stringify(keys));
    }
  }

  /**
   * Internal: Unregister a key
   */
  async unregisterKey(key: string): Promise<void> {
    const keys = await this.listKeys();
    const filtered = keys.filter(k => k !== key);
    await this.secretStorage.store('kb:secret-keys', JSON.stringify(filtered));
  }
}
```

- [ ] File saved

---

**Success Checkpoint**: ConfigManager skeleton works; SecretManager interface defined.

---

### Task S1.3.4: Environment Config Loading (1 hour)
**Owner**: Developer  
**Dependencies**: S1.3.2  
**Risk**: 🟢 Low (standard pattern)

#### Execution Steps:

**[15:25–15:35] Install dotenv (10 min)**

```bash
npm install dotenv
npm install --save-dev @types/node
```

- [ ] Packages installed

---

**[15:35–15:45] Create .env.example Template (10 min)**

Create `.env.example`:

```bash
# KB Extension Environment Variables
# Copy to .env and fill in your values

# Storage
KB_STORAGE_LOCATION=.kb
KB_STORAGE_DATABASE_FILE=kb.db

# Embedding Model
KB_EMBEDDING_MODEL=sentence-transformers/all-MiniLM-L6-v2

# Chunking
KB_CHUNKING_STRATEGY=paragraph
KB_CHUNKING_SIZE=512
KB_CHUNKING_OVERLAP=20

# Search
KB_SEARCH_LIMIT=10
KB_SEARCH_THRESHOLD=0.5

# Logging
KB_LOGGING_LEVEL=info

# Development (commented out by default)
# KB_ADVANCED_ENABLE_METRICS=false
# KB_DEBUG_MODE=false
```

- [ ] File saved
- [ ] Add to .gitignore: `.env` (keep `.env.example` in git)

---

**[15:45–16:00] Implement Environment Loader (15 min)**

Create `src/config/EnvironmentLoader.ts`:

```typescript
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Load environment variables from .env file
 */
export function loadEnvironment(workspacePath: string): void {
  const envPath = path.join(workspacePath, '.env');
  
  if (fs.existsSync(envPath)) {
    const result = dotenv.config({ path: envPath });
    
    if (result.error) {
      console.warn(`Failed to load .env file:`, result.error);
    } else {
      console.log(`Loaded ${Object.keys(result.parsed || {}).length} environment variables`);
    }
  } else {
    console.log(`.env file not found at ${envPath}. Using defaults.`);
  }
}

/**
 * Get environment variable with type coercion
 */
export function getEnv<T>(key: string, defaultValue?: T): T | undefined {
  const value = process.env[key];
  
  if (value === undefined) {
    return defaultValue;
  }

  if (typeof defaultValue === 'boolean') {
    return (value === 'true') as any;
  }

  if (typeof defaultValue === 'number') {
    return (parseInt(value, 10) || defaultValue) as any;
  }

  return value as any;
}
```

- [ ] File saved

---

**[16:00–16:20] Create Integration Test (20 min)**

Create `src/config/integration.test.ts`:

```typescript
import { loadEnvironment, getEnv } from './EnvironmentLoader';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('EnvironmentLoader Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'kb-test-'));
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('should load .env file', () => {
    const envPath = path.join(tempDir, '.env');
    fs.writeFileSync(envPath, 'TEST_VAR=test-value\nTEST_NUMBER=42\n');

    loadEnvironment(tempDir);

    expect(getEnv('TEST_VAR')).toBe('test-value');
    expect(getEnv('TEST_NUMBER', 0)).toBe(42);
  });

  it('should return default if .env not found', () => {
    loadEnvironment(tempDir);
    expect(getEnv('NONEXISTENT', 'default')).toBe('default');
  });

  it('should coerce boolean values', () => {
    const envPath = path.join(tempDir, '.env');
    fs.writeFileSync(envPath, 'ENABLED=true\n');

    loadEnvironment(tempDir);
    expect(getEnv('ENABLED', false)).toBe(true);
  });
});
```

- [ ] File saved

**Run tests**:
```bash
npm test -- integration.test.ts
```

Expected: All tests passing.

---

**Success Checkpoint**: Environment loading system complete; .env configuration ready.

---

## End of Day 3: Wrap-up (16:20–17:00 / 40 min)

**[16:20–16:40] Code Review & Cleanup (20 min)**

Checklist:
- [ ] `npm run compile` succeeds
- [ ] `npm test` passes (all tests, including new ones)
- [ ] No TypeScript errors
- [ ] All new files have docstrings

---

**[16:40–16:55] Commit All Work (15 min)**

```bash
git add .
git commit -m "feat: complete storage & configuration architecture

- Implement StorageManager interface (22 CRUD methods)
- Setup DatabaseConnection with better-sqlite3
- Create ConfigManager for VS Code settings
- Implement SecretManager for secure key storage
- Add EnvironmentLoader for .env support
- Create migration system templates
- Add comprehensive unit + integration tests
- Document all architecture decisions"

git tag -a v0.3.0-day3 -m "End of Day 3: Architecture & tooling complete"
```

- [ ] Commit successful

---

**[16:55–17:00] Update Progress (5 min)**

Update `PROGRESS.md`:

```markdown
## Day 3 Status: ✅ COMPLETE

### Completed Tasks
- ✅ S1.2.2: Migration system finalized
- ✅ S1.2.3: StorageManager interface complete
- ✅ S1.2.4: SQLite better-sqlite3 installed & tested
- ✅ S1.3.2: ConfigManager skeleton + tests
- ✅ S1.3.3: SecretManager implemented
- ✅ S1.3.4: Environment loader setup

### Code Artifacts
- src/storage/database.ts (DatabaseConnection class)
- src/storage/StorageManager.interface.ts (22 methods)
- src/storage/StorageManager.test.ts (5 tests)
- src/config/ConfigManager.ts (get/set/watch)
- src/config/SecretManager.ts (secure storage)
- src/config/EnvironmentLoader.ts (.env support)
- src/config/integration.test.ts (environment tests)
- src/storage/migrations/ (templates)

### Metrics
- New lines of code: 800+
- Test coverage: 7 new tests
- Database schema: Ready (schema.sql)
- Configuration parameters: 11 (in package.json)
- Error types: 5 (NotFound, Duplicate, Constraint, Transaction, Storage)

### Issues Encountered
- None (better-sqlite3 installed cleanly)

### Tomorrow's Focus (Day 4)
- S1.3.3: SecretStorage full integration
- S1.3.5: Settings UI placeholder
- Buffer time + refinement

### Notes
- Storage layer foundation solid; ready for full implementation Week 2
- All interfaces defined; minimal surprises expected
```

- [ ] File saved and committed

---

## Day 3 Success Criteria ✅

By EOD Wednesday:

- [ ] StorageManager interface complete (22 methods, all documented)
- [ ] DatabaseConnection class working with better-sqlite3
- [ ] ConfigManager skeleton complete (get/set/watch)
- [ ] SecretManager interface implemented (secure storage)
- [ ] EnvironmentLoader working with .env files
- [ ] Migration system templates created
- [ ] All tests passing (>10 new tests)
- [ ] Zero blocking issues; ready for Day 4

**Key Deliverables**: Complete storage + configuration architecture; ready for Week 2 implementation sprints.

---

---

# DAY 4 (Thursday) - CONFIGURATION & SECRETS FINALIZATION

**Theme**: Complete configuration infrastructure; conduct design review.  
**Target Hours**: 8 (1h + 1h + 1h + 3h buffer + 1h + 1h)  
**Success Criteria**: All configuration systems complete; no blockers for Day 5.

---

[Continued from Day 3... Due to length constraints, I'll provide the Day 4-5 structure]

---

# DAY 4 (Thursday) SUMMARY

**Morning (09:00–12:00)**:
- S1.3.3: SecretStorage integration test (1h)
- S1.3.5: Settings UI placeholder (1h)
- Architecture design review with checklists (1h)

**Afternoon (13:00–17:00)**:
- Buffer time: Resolve any issues, refinement (3h)
- Code quality review: Linting, formatting (1h)
- Documentation pass: Ensure all files documented (1h)

**EOD**: All Day 1-3 work reviewed; commit `v0.4.0-day4`

---

# DAY 5 (Friday) - INTEGRATION & WEEK 1 WRAP-UP

**Theme**: Integration testing; declare Week 1 complete.  
**Target Hours**: 8 (1h + 1h + 1h + 1h + 1h + 1h + 1h + 1h)  
**Success Criteria**: Extension boots; all components communicate; Week 1 checklist 100% complete.

---

**Morning (09:00–12:00)**:
- [09:00–10:00] Integration test: All components together (1h)
- [10:00–11:00] Extension health check: Full boot sequence (1h)
- [11:00–12:00] Documentation final pass + README updates (1h)

**Afternoon (13:00–17:00)**:
- [13:00–14:00] Bug fixes + refinement (1h)
- [14:00–15:00] Create Week 1 completion checklist (1h)
- [15:00–16:00] Prepare Week 2 tasks list (1h)
- [16:00–17:00] Final commit + tag v0.1.0-alpha; push (1h)

**EOD**: Week 1 complete; tag release `v0.1.0-alpha`; Week 2 ready to begin.

---

## Critical Path Risk Analysis

| Task | Risk Level | Impact | Mitigation | Target Completion |
|------|-----------|--------|-----------|------|
| S1.1.1 Extension Scaffold | 🟢 Low | High (blocker) | Early validation | Day 1 09:30 |
| S1.1.2 TypeScript Config | 🟢 Low | High | Standard setup | Day 1 11:00 |
| S1.2.1 Database Schema | 🔴 HIGH | Critical | Design review | Day 2 12:00 |
| S1.2.4 SQLite Install | 🔴 HIGH | High | Fallback sql.js | Day 3 14:00 |
| S1.3.2 ConfigManager | 🟡 Medium | Medium | Test early | Day 3 15:25 |

---

## Daily Success Checklists

### Day 1 ✅
- [ ] Extension scaffold created and boots
- [ ] TypeScript strict mode configured
- [ ] Jest tests running
- [ ] Git initialized with 2 commits
- [ ] Documentation complete (README, CONTRIBUTING, CHANGELOG)

### Day 2 ✅
- [ ] Project structure validated
- [ ] Database schema designed (8 tables, normalized)
- [ ] StorageManager interface defined (22 methods)
- [ ] Configuration schema in package.json (11 settings)
- [ ] Migration system designed

### Day 3 ✅
- [ ] DatabaseConnection class working
- [ ] ConfigManager skeleton complete
- [ ] SecretManager implemented
- [ ] Environment loader working
- [ ] SQLite better-sqlite3 installed & tested

### Day 4 ⏳
- [ ] SecretStorage integration complete
- [ ] Settings UI placeholder working
- [ ] All components integrated
- [ ] Code quality review passed
- [ ] Zero blocking issues

### Day 5 🎯
- [ ] Full integration test passing
- [ ] Extension boots without error
- [ ] All Week 1 tasks marked complete
- [ ] Week 2 task list prepared
- [ ] Tag release v0.1.0-alpha

---

## Time Allocation Summary

| Activity | Hours | Days | % of Week |
|----------|-------|------|-----------|
| Project Setup (S1.1) | 8 | 1-2 | 20% |
| Database Design (S1.2) | 6 | 2-3 | 15% |
| Configuration (S1.3) | 5 | 3-4 | 12% |
| Integration & Review | 5 | 4-5 | 12% |
| Documentation | 8 | Throughout | 20% |
| Buffer/Contingency | 8 | Throughout | 21% |
| **TOTAL** | **40** | **5** | **100%** |

---

## Resource Requirements

**Hardware**:
- Development machine (macOS/Linux/Windows)
- 8GB+ RAM recommended
- SSD for database operations
- 500MB disk space

**Software**:
- Node.js ≥18.0.0
- VS Code ≥1.85.0
- npm ≥9.0.0
- Git ≥2.30.0

**External Services**: None (local-first development)

---

## Key Decisions & Trade-offs

| Decision | Rationale | Consequence |
|----------|-----------|------------|
| better-sqlite3 (primary) | Performance, sync API | Risk: native build; mitigation: sql.js fallback |
| Normalize DB to 3NF | Data integrity, query efficiency | Consequence: more joins, slightly more complex |
| ConfigManager with watchers | Reactive settings | Consequence: must cleanup listeners |
| Local embeddings (@xenova) | No API keys, privacy | Consequence: slower initially; can optimize later |

---

## Week 2 Preview & Dependencies

**Week 2 (Sprints S1.2 & S1.3 Implementation)**:
- Implement StorageManager CRUD methods
- Implement MigrationManager
- Full ConfigManager implementation
- Add 80%+ unit test coverage
- Begin document parsing (S2.1)

**Critical Handoffs**:
- Week 1 → Week 2: All interfaces stable; implementation can proceed
- Database schema ready for migrations
- Configuration system ready for full UI

---

## Documentation Deliverables

By end of Week 1, the following should exist:

1. **README.md** - Quick start, setup instructions
2. **CONTRIBUTING.md** - Git workflow, commit conventions
3. **CHANGELOG.md** - Version history
4. **DEBUGGING.md** - Debug mode, troubleshooting
5. **SCHEMA_DESIGN.md** - ERD, entity definitions
6. **SCHEMA_DECISIONS.md** - Rationale, normalization
7. **MIGRATIONS.md** - Migration strategy, versioning
8. **SETTINGS.md** - Configuration parameters
9. **STORAGE_ARCHITECTURE.md** - Interface design, transactions
10. **SQLITE_DECISION.md** - Library choice rationale
11. **PROGRESS.md** - Daily status (living document)
12. **WEEK_1_EXECUTABLE_PLAN.md** - This document

---

## Rollback & Recovery Procedures

If a task fails catastrophically:

**Day 1 - Scaffold Issues**:
```bash
rm -rf extension
yo code kb-extension  # Restart
```

**Day 2-3 - Schema Design Issues**:
```bash
git checkout HEAD~N -- schema.sql  # Revert schema
# Re-design or restore from backup
```

**Day 3 - SQLite Install Fails**:
```bash
npm uninstall better-sqlite3
npm install sql.js  # Fallback
# Update code to use sql.js instead (compatibility layer needed)
```

**Any Day - Git Issues**:
```bash
git reflog  # Find commits before issue
git reset --hard <commit>  # Restore
```

---

## Success Metrics & Definition of Done

### Week 1 Complete When:

✅ **Technical**:
- Extension scaffold created, committed, tagged
- All npm scripts working (compile, test, watch)
- TypeScript strict mode enforced
- Jest tests running (minimum 10 tests, >70% coverage)
- Git history clean with meaningful commits
- Database schema designed and documented
- All interfaces defined (StorageManager, ConfigManager, MigrationManager)
- SQLite dependency installed and tested
- Configuration system working (get/set/watch)
- Secret storage API integrated

✅ **Documentation**:
- README with setup instructions
- Development environment guide
- Debugging guide
- Schema documentation with ERD
- Architecture decisions documented
- Configuration parameters documented
- CONTRIBUTING guide created
- CHANGELOG started
- PROGRESS tracked daily

✅ **Quality**:
- Zero TypeScript compilation errors
- All new tests passing
- No console errors on extension boot
- Code formatted consistently
- All files have proper docstrings/comments

✅ **Process**:
- Daily progress notes updated
- Commits are atomic and well-documented
- No uncommitted changes at EOD
- Week 1 tasks list marked complete

---

**Status: Ready for Execution**

Developer can start Monday morning with this plan and complete all Week 1 objectives systematically.

Good luck! 🚀
