# KB Extension - Day 2 Comprehensive Guide
**Tuesday, Sprint 1 Week 1: Database Schema Design & Configuration Structure**

**Duration**: 8 hours (09:00-17:00)  
**Status**: Day 1 ✅ Complete | Day 2 🟡 Today  
**Success Target**: Schema designed, documented, and reviewed; Migration system planned; Config schema defined

---

## ⏰ Day 2 Timeline Overview

```
09:00-12:00 (3h)  │ Morning Tasks
                   ├─ S1.1.7: Project Validation (1h)
                   └─ S1.2.1: Database Schema Design (3h) 🔴 CRITICAL PATH
                   │
12:00-13:00       │ LUNCH BREAK
                   │
13:00-17:00 (4h)  │ Afternoon Tasks
                   ├─ S1.2.2: Migration System Planning (1.5h)
                   ├─ S1.2.3: StorageManager Architecture (1.5h)
                   └─ S1.3.1: Configuration Schema Design (1h)
                   │
16:55-17:00 (5m)  │ Wrap-up & Commit
```

---

# MORNING BLOCK (09:00–12:00 / 3 HOURS)

## Task S1.1.7: Project Structure Validation (1 hour)
**Risk**: 🟡 Medium | **Dependencies**: All S1.1 tasks (Day 1)

Complete project validation from Day 1. Execute in sequence:

### [09:00–09:15] Validate Directory Structure

```bash
cd ~/Devs/KBIngest/extension
tree -L 3 -I 'node_modules'
```

**Expected Output**:
```
extension/
├── .git/                          ✅ Git repo
├── .vscode/
│   ├── launch.json
│   └── tasks.json
├── dist/
│   ├── extension.js
│   ├── extension.js.map           ✅ Source maps
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
└── node_modules/
```

**Verification Checklist**:
- [ ] `.git/` exists with 2+ commits visible via `git log --oneline`
- [ ] `src/extension.ts` is TypeScript (not .js)
- [ ] `dist/` has 3 files: .js, .map, .d.ts
- [ ] `package.json` valid JSON: `npm run` shows compile, watch, test

### [09:15–09:30] Verify Build Scripts

```bash
npm run
# Output should show: compile, watch, test, package, lint
```

**Expected visible scripts**:
```
available via 'npm run-script':
  compile
    tsc
  watch
    tsc -watch
  test
    jest --coverage
  package
    vsce package
```

### [09:30–09:45] Full Build Cycle Test

```bash
# Clean and rebuild
rm -rf dist/
npm run compile

# Run tests
npm test

# Verify no warnings
npm run compile 2>&1 | grep -i warning
# Should return empty
```

**Expected Results**:
- ✅ Compilation completes in <5 seconds
- ✅ All tests pass (1 test minimum)
- ✅ No warnings or errors
- ✅ dist/ folder populated

### [09:45–10:00] Launch & Debug Test

1. **Open VS Code**:
   ```bash
   code .
   ```

2. **In VS Code Terminal (Ctrl+`)**, run:
   ```bash
   npm run watch &
   ```

3. **Press F5** to launch debug session
   - A new VS Code window opens (debug instance)
   - Extension loads in extension host

4. **In Debug Console**, verify no errors

5. **Stop Debug**: Press Shift+F5

**Acceptance Criteria**:
- [ ] Extension loads without crash
- [ ] Debug window shows no console errors
- [ ] Reloading (Ctrl+R) works smoothly
- [ ] Debug stops cleanly

**If issues occur**:
- `Cannot find module 'vscode'`: Run `npm install --save-dev @types/vscode`
- TypeScript errors: `npm run compile` to see details
- Tests fail: `npm test -- --verbose` for info

---

## Task S1.2.1: Design Database Schema (3 hours) 🔴 CRITICAL PATH

**Risk**: 🔴 HIGH | **Dependencies**: S1.1 complete  
**Why Critical**: Database design is foundational; changes post-implementation are expensive.

This is **the most important design task of Week 1**. Take time, review twice.

---

### [10:00–10:45] Phase 1: Entity Planning & ERD (45 min)

#### Step 1: Document Entity Definitions (15 min)

Create `~/Devs/KBIngest/extension/docs/SCHEMA_DESIGN.md`:

```markdown
# Database Schema Design

## Entity Definitions

### Document
**What it represents**: A file or content source ingested by the user

**Attributes**:
- `id` (TEXT PRIMARY KEY): UUID unique identifier
- `name` (TEXT NOT NULL): Display name (e.g., "Meeting Notes Jan 2024")
- `type` (TEXT NOT NULL): One of: markdown, plaintext, pdf
- `source_path` (TEXT): Original file path (optional)
- `size_bytes` (INTEGER): File size in bytes
- `hash` (TEXT UNIQUE): SHA-256 hash for deduplication
- `created_date` (DATETIME): When added to KB
- `updated_date` (DATETIME): Last modification time
- `metadata` (TEXT): JSON for future extensibility

**Why**: Central entity tracking what user stored; hash prevents re-ingesting duplicates

---

### Chunk
**What it represents**: A portion of a document (e.g., paragraph, token window)

**Attributes**:
- `id` (TEXT PRIMARY KEY): UUID
- `document_id` (TEXT FK): Reference to parent document
- `sequence` (INTEGER): Order (1, 2, 3, ...) within document
- `text` (TEXT NOT NULL): Actual text content
- `token_count` (INTEGER): Tokens for API limit tracking
- `created_date` (DATETIME): When created

**Why**: Chunks are searchable units; sequence preserves document structure; token_count enables batch processing

---

### Vector
**What it represents**: An embedding (numerical representation) of a chunk

**Attributes**:
- `id` (TEXT PRIMARY KEY): UUID
- `chunk_id` (TEXT FK UNIQUE): One embedding per chunk
- `embedding` (TEXT): JSON array of floats [0.123, 0.456, ...]
- `model_name` (TEXT): Model used (e.g., "all-MiniLM-L6-v2")
- `dimension` (INTEGER): Vector dimension (384 for MiniLM, 1536 for larger)
- `created_date` (DATETIME): When generated

**Why**: Enables semantic search; model_name allows re-embedding with different models; stored as JSON for flexibility

---

### Tag
**What it represents**: A user-created label/category

**Attributes**:
- `id` (TEXT PRIMARY KEY): UUID
- `name` (TEXT UNIQUE)`: Tag name (e.g., "urgent", "archived")
- `color` (TEXT): Optional hex color (#RRGGBB)
- `description` (TEXT): Optional meaning
- `created_date` (DATETIME)

**Why**: Flat tagging system for flexible organization

---

### Document_Tags (Junction)
**What it represents**: Many-to-many relationship between Documents and Tags

**Attributes**:
- `document_id` (TEXT FK)
- `tag_id` (TEXT FK)
- `added_date` (DATETIME): When tag applied
- PRIMARY KEY: (document_id, tag_id)

**Why**: Allows documents to have multiple tags; allows tags across documents

---

### Collection
**What it represents**: A grouping/folder for organizing documents

**Attributes**:
- `id` (TEXT PRIMARY KEY): UUID
- `name` (TEXT UNIQUE): Collection name (e.g., "Project Alpha", "Research")
- `description` (TEXT): Optional description
- `color` (TEXT): Optional display color
- `created_date`, `updated_date` (DATETIME)

**Why**: Hierarchical organization (complementary to tags)

---

### Document_Collections (Junction)
**What it represents**: Many-to-many between Documents and Collections

**Attributes**:
- `document_id` (TEXT FK)
- `collection_id` (TEXT FK)
- `added_date` (DATETIME)
- PRIMARY KEY: (document_id, collection_id)

**Why**: Document can be in multiple collections

---

## Relationships (ER Diagram)

```
┌─────────────────────┐
│    DOCUMENTS        │
├─────────────────────┤
│ id (PK)             │
│ name                │ 
│ type                │
│ source_path         │
│ size_bytes          │
│ hash (UNIQUE)       │
│ created_date        │
│ updated_date        │
│ metadata            │
└──────────┬──────────┘
           │ 1
    ┌──────┴───────────────┬─────────────┐
    │ many               many           many
    ▼ 1                  ▼ 1            ▼ 1
┌────────────┐    ┌───────────────┐   ┌──────────────┐
│  CHUNKS    │    │ DOCUMENT_TAGS │   │ DOC_COLLS    │
├────────────┤    ├───────────────┤   ├──────────────┤
│ id (PK)    │    │ doc_id (FK) ◄─┼───┤ doc_id (FK) ◄┐
│ doc_id (FK)│    │ tag_id (FK) ──┼──→├──────────────┤
│ sequence   │    └───────────────┘   │ coll_id (FK)─┼──→┌─────────────────┐
│ text       │          ▲              └──────────────┘   │  COLLECTIONS    │
│ token_count│          │ many                   ▲        ├─────────────────┤
│ created_date          │                        │ many   │ id (PK)         │
└─────┬──────┘    ┌─────┴─────┐          ┌──────┴──────┐ │ name            │
      │           │   TAGS    │          │  (to Tags)  │ │ description     │
      │ 1         ├───────────┤          │             │ │ color           │
      │           │ id (PK)   │          └─────────────┘ │ created_date    │
      ▼           │ name      │                          │ updated_date    │
 ┌─────────┐      │ color     │                          └─────────────────┘
 │ VECTORS │      │ desc      │
 ├─────────┤      │ created   │
 │ id (PK) │      └───────────┘
 │ chunk_id│(FK, UNIQUE - 1:1)
 │embedding│
 │ model   │
 │ dim     │
 └─────────┘
```

---

## Normalization Analysis

**Normal Form**: 3NF (Third Normal Form)

✅ **1NF**: All columns atomic (no arrays, only strings/numbers)  
✅ **2NF**: No partial dependencies (each non-key attribute depends on whole key)  
✅ **3NF**: No transitive dependencies (non-key attributes don't depend on other non-keys)

**Example 3NF rationale**:
- `Document` has `name, type, hash` all depending on full key `id` ✅
- `Chunk` has `text, token_count` depending on full key `id` ✅
- No column says "if X then Y" (transitive) ✅

---

## Index Strategy

**Why Indexes**: Fast lookups; prevent full table scans

**Indexes by table**:

| Table | Column | Reason |
|-------|--------|--------|
| documents | `id` | Primary key (auto) |
| documents | `hash` | Deduplication lookup |
| documents | `created_date` | Sort/filter by date |
| chunks | `id` | Primary key (auto) |
| chunks | `document_id` | Foreign key lookup |
| chunks | `sequence` | Order within document |
| vectors | `id` | Primary key (auto) |
| vectors | `chunk_id` | FK + UNIQUE constraint |
| vectors | `model_name` | Filter by embedding model |
| tags | `id` | Primary key (auto) |
| tags | `name` | Lookup by name |
| doc_tags | `tag_id` | M2M reverse lookup |
| doc_colls | `collection_id` | M2M reverse lookup |

**Total**: ~13 indexes (reasonable for 8 tables)

**Index Cost**: ~2-3% storage overhead; massive query speedup

---

## Future Extensions

These **can be added later** without major rework:

- **v2**: Full-text search (FTS5 virtual table on chunks.text)
- **v3**: Search history (searches table tracking queries)
- **v4**: Annotations (user notes on chunks)
- **v5**: Sync metadata (last_synced, deleted_flag for cloud sync)
- **v6**: Relationships (links between documents)

---

## Testing Checklist (Week 2)

- [ ] Schema loads without error
- [ ] All CREATE TABLE statements succeed
- [ ] Foreign key constraints enforced
- [ ] CASCADE DELETEs work (delete document → chunks deleted)
- [ ] UNIQUE constraints prevent duplicates (hash, document_tags PK)
- [ ] Index creation succeeds
- [ ] SELECT against views works
```

**Save this file**: It's documentation that drives implementation.

#### Step 2: Create Visual ERD (30 min)

Create `~/Devs/KBIngest/extension/docs/schema_erd.txt` with ASCII diagram:

```
Entity-Relationship Diagram (Text Format)
=========================================

┌─────────────────────┐
│    DOCUMENTS        │
├─────────────────────┤
│ id (PK) UUID        │
│ name TEXT           │ 
│ type TEXT           │──┐ markdown|plaintext|pdf
│ source_path TEXT    │  │
│ size_bytes INTEGER  │  │
│ hash TEXT UNIQUE    │  │ ◄─── SHA256 for dedup
│ created_date DT     │  │
│ updated_date DT     │  │
│ metadata TEXT       │  │ ◄─── JSON future use
└──────────┬──────────┘  │
           │ PK          │
           │ (1)         │
    ┌──────┼────────┬────────────┐
    │      │ (many) │            │ (many)
    │      │        │            │
    ▼      ▼        ▼            ▼
┌────────────┐   ┌──────────────┐   ┌──────────────────┐
│  CHUNKS    │   │ DOCUMENT_TAGS│   │ DOC_COLLECTIONS │
├────────────┤   ├──────────────┤   ├──────────────────┤
│ id (PK)    │   │ doc_id (FK)  │   │ doc_id (FK)      │
│ doc_id(FK) │◄──┤ tag_id (FK)  │   │ coll_id (FK)     │
│ sequence   │   └──────────────┘   └────────┬─────────┘
│ text       │        ▲                      ▲
│ token_ct   │        │ (many)         (many)│
│ created_dt │   ┌────┴──────┐         ┌─────┴─────┐
└─────┬──────┘   │   TAGS    │         │COLLECTIONS│
      │ (1)      ├───────────┤         ├───────────┤
      │          │ id (PK)   │         │ id (PK)   │
      ▼          │ name UNIQ │         │ name UNIQ │
  ┌─────────┐    │ color     │         │ desc      │
  │ VECTORS │    │ created_dt│         │ created_dt│
  ├─────────┤    └───────────┘         │ updated_dt│
  │ id (PK) │                          └───────────┘
  │ chunk_id│(FK UNIQUE - 1:1 with Chunk)
  │ emb[..] │ 384D or 1536D JSON
  │ model   │ e.g., all-MiniLM-L6-v2
  │ dim     │ 384 or 1536
  │ created │
  └─────────┘

Key Cardinalities:
  Document (1) --→ (many) Chunks      [cascade delete]
  Document (1) --→ (many) Tags        [via doc_tags]
  Document (1) --→ (many) Collections [via doc_colls]
  Chunk (1) --→ (1) Vector             [1:1, cascade delete]
  Tag (1) --→ (many) Documents         [via doc_tags]
  Collection (1) --→ (many) Documents  [via doc_colls]
```

**Save this file**: Visual reference while coding.

---

### [10:45–11:30] Phase 2: Write SQL DDL (45 min)

Create `~/Devs/KBIngest/extension/schema.sql`:

```sql
-- ============================================
-- KB Extension SQLite Schema v1.0
-- Date: 2026-04-23
-- Author: KB Extension Development Team
-- Description: Storage layer for KB ingestion, 
--              chunking, embeddings, tags, collections
-- ============================================

-- Enable foreign keys (CRITICAL for referential integrity)
PRAGMA foreign_keys = ON;

-- ============================================
-- TABLE 1: DOCUMENTS
-- ============================================
-- Represents user-uploaded files or content sources
--
-- Example:
--   id: "doc-001"
--   name: "Meeting Notes Q1 2024"
--   type: "markdown"
--   hash: "sha256:abc123..." (for dedup)
-- ============================================

CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('markdown', 'plaintext', 'pdf')),
  source_path TEXT,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  hash TEXT UNIQUE NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT,
  CHECK (size_bytes >= 0)
);

CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(hash);
CREATE INDEX IF NOT EXISTS idx_documents_created_date ON documents(created_date);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- ============================================
-- TABLE 2: CHUNKS
-- ============================================
-- Represents searchable portions of documents
--
-- Example:
--   id: "chunk-001"
--   document_id: "doc-001"
--   sequence: 1
--   text: "First paragraph of document..."
--   token_count: 45
-- ============================================

CREATE TABLE IF NOT EXISTS chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  text TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  UNIQUE (document_id, sequence),
  CHECK (sequence >= 0),
  CHECK (token_count >= 0)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_sequence ON chunks(document_id, sequence);

-- ============================================
-- TABLE 3: VECTORS
-- ============================================
-- Embeddings (numerical representations) of chunks
--
-- Example:
--   id: "vec-001"
--   chunk_id: "chunk-001"
--   embedding: "[0.123, 0.456, 0.789, ...]"  (384D vector)
--   model_name: "sentence-transformers/all-MiniLM-L6-v2"
--   dimension: 384
-- ============================================

CREATE TABLE IF NOT EXISTS vectors (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL UNIQUE,
  embedding TEXT NOT NULL,
  model_name TEXT NOT NULL,
  dimension INTEGER NOT NULL,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE,
  CHECK (dimension > 0)
);

CREATE INDEX IF NOT EXISTS idx_vectors_chunk_id ON vectors(chunk_id);
CREATE INDEX IF NOT EXISTS idx_vectors_model_name ON vectors(model_name);

-- ============================================
-- TABLE 4: TAGS
-- ============================================
-- User-created labels for organizing documents
--
-- Example:
--   id: "tag-001"
--   name: "urgent"
--   color: "#FF0000"
-- ============================================

CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT,
  description TEXT,
  created_date DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);

-- ============================================
-- TABLE 5: DOCUMENT_TAGS (Junction/M2M)
-- ============================================
-- Maps documents to tags (many-to-many)
--
-- Example:
--   document_id: "doc-001"
--   tag_id: "tag-urgent"
--   added_date: "2026-04-23 10:00:00"
-- ============================================

CREATE TABLE IF NOT EXISTS document_tags (
  document_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (document_id, tag_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_tags_tag_id ON document_tags(tag_id);

-- ============================================
-- TABLE 6: COLLECTIONS
-- ============================================
-- Hierarchical groupings of documents
--
-- Example:
--   id: "coll-001"
--   name: "Project Alpha"
--   description: "Docs for Project Alpha initiative"
--   color: "#0000FF"
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
-- TABLE 7: DOCUMENT_COLLECTIONS (Junction/M2M)
-- ============================================
-- Maps documents to collections (many-to-many)
--
-- Example:
--   document_id: "doc-001"
--   collection_id: "coll-alpha"
--   added_date: "2026-04-23"
-- ============================================

CREATE TABLE IF NOT EXISTS document_collections (
  document_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  added_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  PRIMARY KEY (document_id, collection_id),
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_document_collections_collection_id 
  ON document_collections(collection_id);

-- ============================================
-- TABLE 8: SCHEMA_VERSIONS
-- ============================================
-- Tracks schema migrations for version control
--
-- Enables safe schema evolution:
--   v1: Initial schema (current)
--   v2: Add FTS5 for full-text search (future)
--   v3: Add annotations table (future)
-- ============================================

CREATE TABLE IF NOT EXISTS schema_versions (
  version INTEGER PRIMARY KEY,
  applied_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  description TEXT
);

-- Record current version
INSERT OR IGNORE INTO schema_versions (version, description) 
VALUES (1, 'Initial schema: documents, chunks, vectors, tags, collections');

-- ============================================
-- VIEWS: Common Queries
-- ============================================

-- View: Document Statistics
CREATE VIEW IF NOT EXISTS documents_with_stats AS
SELECT 
  d.id,
  d.name,
  d.type,
  d.size_bytes,
  COUNT(DISTINCT c.id) as chunk_count,
  SUM(c.token_count) as total_tokens,
  COUNT(DISTINCT dt.tag_id) as tag_count,
  COUNT(DISTINCT v.id) as vector_count,
  d.created_date,
  d.updated_date
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
LEFT JOIN document_tags dt ON d.id = dt.document_id
LEFT JOIN vectors v ON c.id = v.chunk_id
GROUP BY d.id;

-- View: Chunks with Vector Info
CREATE VIEW IF NOT EXISTS chunks_with_vectors AS
SELECT 
  c.id,
  c.document_id,
  c.sequence,
  LENGTH(c.text) as text_length,
  c.token_count,
  v.id as vector_id,
  v.model_name,
  v.dimension,
  CASE WHEN v.id IS NOT NULL THEN 'embedded' ELSE 'pending' END as status
FROM chunks c
LEFT JOIN vectors v ON c.id = v.chunk_id;

-- ============================================
-- END SCHEMA DEFINITION
-- ============================================
```

**Critical Notes**:

✅ **All PRIMARY KEY values are TEXT (UUID)** - Generate in JavaScript with `uuid` package  
✅ **PRAGMA foreign_keys = ON** - Referential integrity enforced  
✅ **CASCADE DELETE** - Removing document auto-removes chunks, vectors  
✅ **UNIQUE constraints** - hash (dedup), (doc_id, sequence), chunk_id in vectors, name in tags/collections  
✅ **CHECK constraints** - Enforce data validity (e.g., size_bytes >= 0, sequence >= 0)  
✅ **Indexes on FK columns** - Enable fast joins  
✅ **Views for common queries** - Pre-calculated aggregations  

---

### [11:30–12:00] Phase 3: Documentation & Review (30 min)

Create `~/Devs/KBIngest/extension/docs/SCHEMA_DECISIONS.md`:

```markdown
# Database Schema Design Rationale

## Why Each Table?

### documents
**Purpose**: Central inventory of user's ingested content

**Why separate from chunks**:
- Chunks are transient (can re-chunk same document differently)
- Documents are stable (user's original files)
- Allows document-level metadata (name, tags, collection membership)
- Enables deduplication by hash before ingesting

**Future use**: If user wants to re-chunk with different strategy, keep document; delete chunks; re-create chunks from original.

---

### chunks
**Purpose**: Atomic, searchable units within documents

**Why this granularity**:
- Smaller than full document: faster embeddings, better search precision
- Larger than single token: maintains context, reduces API calls
- Sequence field preserves reading order: can reconstruct context from adjacent chunks

**Size**: Configurable (default 512 tokens) with overlap (default 20 tokens). 
- 512 tokens ~ 2-3 KB of text
- Fits comfortably in embedding model token limits
- Reasonable chunk for RAG context window

---

### vectors
**Purpose**: Numerical embeddings enabling semantic search

**Why separate table**:
- Embedding generation is time-consuming; may not exist initially (pending ingestion)
- May want to re-embed with different model (e.g., upgrade to larger model)
- 1:1 with chunk; UNIQUE constraint enforces this
- Model name allows version tracking

**Why JSON format**:
- SQLite doesn't have native ARRAY type
- JSON strings are searchable (can index subsets)
- Can later integrate with Qdrant (which stores native vectors)

**Example vector**:
```json
[0.123, 0.456, 0.789, ..., 0.012]  // 384 floats for MiniLM-L6-v2
```

---

### tags
**Purpose**: Flat tagging system for quick categorization

**Why separate**:
- Independent of documents (tag can exist before any documents)
- Reusable (many documents can have same tag)
- Optional color for UI visualization
- No hierarchy (simple mental model)

**Complement**: Collections provide hierarchical grouping if needed.

---

### document_tags (Junction)
**Purpose**: Many-to-many relationship between documents and tags

**Why junction table**:
- One document can have multiple tags ✅
- One tag can label multiple documents ✅
- Can add metadata (added_date) to relationship itself

**Example**:
```
Document "Q1 Report"  --tags-->  ["finance", "urgent", "archived"]
Tag "urgent"          --docs-->  [Doc1, Doc3, Doc5, ...]
```

---

### collections
**Purpose**: Hierarchical/folder-like organization

**Why separate from tags**:
- Collections are explicit containers (user creates structure)
- Tags are implicit labels (user applies many per document)
- Complement: Use tags for flexible categorization; collections for fixed structure

**Example**:
```
Collection: "Project Alpha"
  └─ Documents: [requirements.md, design.pdf, implementation_notes.txt]
```

---

### document_collections (Junction)
**Purpose**: Many-to-many between documents and collections

**Why**:
- One document can belong to multiple projects/collections
- Enables cross-collection views

**Example**:
```
Document "Budget Review"  --in-->  ["Project Alpha", "Finance"]
```

---

### schema_versions
**Purpose**: Track database schema evolution

**Why**:
- Enable safe migrations (v1 → v2 → v3, etc.)
- Detect version mismatches between extension and database
- Support rollback procedures

**Table design**:
```sql
version (INTEGER): Migration sequence number (1, 2, 3, ...)
applied_date (DATETIME): When applied (auto-timestamp)
description (TEXT): Human-readable summary
```

---

## Normalization Proof

**Database satisfies 3NF (Third Normal Form)**:

### 1st Normal Form (1NF)
✅ **Atomic columns**: No arrays/lists
- ❌ BAD: `document.tags = "tag1, tag2"` (array in string)
- ✅ GOOD: document_tags junction table

### 2nd Normal Form (2NF)
✅ **No partial dependencies**: Every non-key attribute depends on entire key
- Example `document_tags`:
  - PK = (document_id, tag_id)
  - added_date depends on full PK ✅

### 3rd Normal Form (3NF)
✅ **No transitive dependencies**: Non-key attributes don't depend on other non-keys
- Example `documents`:
  - Keys: id
  - Attributes: name, type, hash
  - No attribute says "if A then B" ✅

**Result**: Minimal redundancy; maximum data consistency

---

## Index Strategy

| Table | Index | Reason | Impact |
|-------|-------|--------|--------|
| documents | id | PK | Fast by-ID lookup |
| documents | hash | Dedup | Find exact duplicates instantly |
| documents | created_date | Sort/filter | Timeline queries |
| chunks | document_id | FK | Retrieve all chunks of doc |
| chunks | (doc_id, sequence) | Composite | Order-preserving chunk retrieval |
| vectors | chunk_id | FK + UNIQUE | One vector per chunk |
| vectors | model_name | Filter | Query by embedding model |
| tags | name | Lookup | Find tags by name |
| doc_tags | tag_id | M2M reverse | All docs with given tag |
| doc_colls | collection_id | M2M reverse | All docs in collection |

**Total**: 13 indexes
**Storage cost**: ~2-3% overhead
**Query benefit**: 10-100x faster queries (no full table scans)

---

## Constraints Enforced

### PRIMARY KEY
Every row has unique id; prevents duplicates

### UNIQUE
- documents.hash: No duplicate files ingested
- tags.name: No duplicate tag names
- collections.name: No duplicate collection names
- document_tags.(doc_id, tag_id): Can't tag same doc twice with same tag
- vectors.chunk_id: Only one embedding per chunk

### CHECK
- documents.size_bytes >= 0: No negative sizes
- chunks.sequence >= 0: Order is non-negative
- chunks.token_count >= 0: No negative tokens
- vectors.dimension > 0: Dimension must be positive

### FOREIGN KEY
- chunks.document_id → documents.id (ON DELETE CASCADE)
- vectors.chunk_id → chunks.id (ON DELETE CASCADE)
- document_tags → documents & tags (ON DELETE CASCADE)
- document_collections → documents & collections (ON DELETE CASCADE)

**Result**: Referential integrity guaranteed; orphaned records impossible

---

## Cascade Delete Behavior

**When you delete a Document**:
```
Document deleted
  ↓ (CASCADE)
All Chunks deleted
  ↓ (CASCADE)
All Vectors deleted
  ↓ (CASCADE)
All document_tags entries deleted
All document_collections entries deleted
```

**Result**: One DELETE statement cleans up entire tree ✅

---

## Future Extensions (No schema change needed)

### v2: Full-Text Search
Add FTS5 virtual table:
```sql
CREATE VIRTUAL TABLE chunks_fts USING fts5(text, content=chunks);
```

### v3: Annotations
New table for user notes:
```sql
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  chunk_id TEXT FK,
  note TEXT,
  created_date DT
);
```

### v4: Search History
Track user queries:
```sql
CREATE TABLE searches (
  id TEXT PRIMARY KEY,
  query TEXT,
  results_count INTEGER,
  timestamp DATETIME
);
```

### v5: Sync Metadata
For cloud sync support:
```sql
ALTER TABLE documents ADD COLUMN last_synced DATETIME;
ALTER TABLE documents ADD COLUMN is_deleted BOOLEAN DEFAULT 0;
```

---

## Performance Estimates

| Operation | Expected Time | Notes |
|-----------|--------------|-------|
| Insert document | <1ms | One INSERT + one row |
| Insert 10 chunks | 5-10ms | Batch insert with transaction |
| Insert 10 vectors | 10-20ms | Vectors stored as JSON |
| Query: get doc by hash | <1ms | Indexed lookup |
| Query: get all chunks of doc | 5-20ms | FK index helps |
| Query: search full-text (no index) | 50-200ms | Full table scan; FTS5 improves in v2 |
| Query: search by vector (naive) | 100-500ms | No index; Qdrant needed for large scale |
| Full database dump (100 docs) | <100ms | Small dataset, fast |

**Scale**: This schema supports <10K documents efficiently. Beyond that, consider:
- Sharding/partitioning (Phase B)
- Migration to Qdrant Cloud (Phase B)

---

## Migration Strategy

### Current (Week 1-4): Development
- One schema version (v1)
- Delete DB and re-init to "rollback"
- Simple approach, fast iteration

### Post-MVP (Week 8+): Release
- Support multiple versions
- Each migration has UP and DOWN script
- Transactions ensure atomicity
- User can rollback if needed

**Migration file example**:
```
src/storage/migrations/
  001_initial_schema.sql        ← Current (active)
  002_add_fts5.sql              ← Future (Week 8+)
  003_add_annotations.sql       ← Future (Week 9+)
```

---

## Testing Approach

**Database validation** (Week 2):

1. **Schema Creation**: All CREATE TABLE succeed
2. **Constraints**: Verify UNIQUE/CHECK/FK enforced
3. **Cascade Delete**: Delete doc; verify chunks & vectors gone
4. **Indexes**: Verify created; compare query performance before/after
5. **Views**: SELECT from views; verify aggregations correct
6. **Performance**: Insert 1000 docs; query performance acceptable

---

## Conclusion

This schema provides:
- ✅ **Normalization**: 3NF; no redundancy
- ✅ **Referential Integrity**: FK constraints; CASCADE deletes
- ✅ **Performance**: Indexes on critical lookups
- ✅ **Flexibility**: Tags + collections; both systems coexist
- ✅ **Extensibility**: Easy to add tables (v2, v3, ...) without breaking existing
- ✅ **Simplicity**: 8 tables; clear relationships; documented

**Ready for Week 2 implementation** ✅
```

**Verification Checklist** (before continuing):

- [ ] `SCHEMA_DESIGN.md` clearly explains 7 entities
- [ ] ERD diagrams (both text and ASCII) match the schema
- [ ] `schema.sql` is 400+ lines with comments
- [ ] All constraints documented (PK, FK, UNIQUE, CHECK)
- [ ] 13 indexes listed with rationale
- [ ] Future extensions listed (v2-v5)

---

**Success Checkpoint Reached**: 🟢

✅ Database schema fully designed, documented, and reviewed  
✅ All artifacts created and saved  
✅ Ready for migration system planning  

**Time elapsed**: ~2.5 hours (15 min buffer built in)

---

# AFTERNOON BLOCK (13:00–17:00 / 4 HOURS)

## Task S1.2.2: Plan Migration System Architecture (1.5 hours)

**Risk**: 🟡 Medium | **Dependencies**: S1.2.1  
**What we're doing**: Designing (not implementing) how to manage schema versions

### [13:00–13:20] Migration Pattern Research & Design (20 min)

Create `~/Devs/KBIngest/extension/docs/MIGRATIONS.md`:

```markdown
# Database Migration Strategy

## Overview

**Problem**: As KB evolves, schema changes (new tables, columns, constraints)

**Solution**: Versioned migrations tracked in `schema_versions` table

**Pattern**:
```
v1: Initial schema (current, active)
  ↓ (Week 2: implement StorageManager)
v2: Add FTS5 full-text search (future, Week 8+)
  ↓
v3: Add annotations table (future, Week 9+)
  ↓
v4: Add sync metadata (future, Week 10+)
```

---

## Current State (Week 1-2): Single Version

**Structure**:
```
src/storage/
  ├── schema/
  │   └── v001_initial.sql       ← Applied (v1)
  ├── schema_versions table       ← Tracks: version=1
```

**Initialization** (Week 2):
```typescript
async function initDatabase() {
  // 1. Check if DB exists
  // 2. Read schema_versions table
  // 3. Get current_version
  // 4. If v0 → apply v1
  // 5. If v1 → already initialized
}
```

---

## Future State (Post-MVP): Multiple Versions

**Structure** (Week 8+):
```
src/storage/migrations/
  ├── 001_initial_schema.sql
  ├── 002_add_fts5.sql
  ├── 003_add_annotations.sql
  └── README.md                  ← Instructions
```

**Migration Process**:
```
1. Read schema_versions table → current_version = 1
2. Scan migrations/ folder → available = [v1, v2, v3, ...]
3. pending = [v2, v3, ...] (versions after current)
4. For each pending:
   a. Execute migration file
   b. Update schema_versions table
   c. On error: ROLLBACK; throw
5. Verify final version matches expected
```

---

## File Naming Convention

**Format**: `{VERSION:03d}_{description}.sql`

**Examples**:
```
001_initial_schema.sql
002_add_fts5_search.sql
003_add_annotations_table.sql
004_add_user_preferences.sql
```

**Rules**:
- Three-digit version (001, 002, 010, 100)
- Lowercase description
- Underscores between words
- .sql extension

---

## Migration File Structure

**Template**:
```sql
-- Migration: v{VERSION} - {DESCRIPTION}
-- Applied: {TIMESTAMP, auto-filled}
-- Author: KB Extension
-- Purpose: {What this migration does}

BEGIN TRANSACTION;

-- ============================================
-- FORWARD: Apply changes (v{N-1} → v{N})
-- ============================================

CREATE TABLE IF NOT EXISTS new_table (
  id TEXT PRIMARY KEY,
  ...
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_new_table_name ON new_table(name);

-- Update schema version
INSERT INTO schema_versions (version, description)
VALUES ({VERSION}, '{DESCRIPTION}');

COMMIT;

-- ============================================
-- ROLLBACK: Reverse changes (v{N} → v{N-1})
-- ============================================
-- 
-- Uncomment and run if rollback needed (manual process)
--
-- BEGIN TRANSACTION;
-- DROP TABLE IF EXISTS new_table;
-- DELETE FROM schema_versions WHERE version = {VERSION};
-- COMMIT;
```

**Key Points**:
- All changes in single TRANSACTION
- All-or-nothing atomicity
- Rollback script as comment (manual execution)

---

## Example Migration v2: Add Full-Text Search

**File**: `002_add_fts5_search.sql`

```sql
-- Migration: v2 - Add FTS5 Full-Text Search
-- Purpose: Enable fast full-text search on chunk text

BEGIN TRANSACTION;

-- FTS5 virtual table for full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
  chunk_id UNINDEXED,
  document_id UNINDEXED,
  text,
  content=chunks,
  content_rowid=id
);

-- Populate FTS table with existing chunks
INSERT INTO chunks_fts(rowid, chunk_id, document_id, text)
SELECT id, id, document_id, text FROM chunks;

-- Create trigger to keep FTS in sync
CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts(rowid, chunk_id, document_id, text)
  VALUES (new.id, new.id, new.document_id, new.text);
END;

CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  INSERT INTO chunks_fts(chunks_fts, rowid, chunk_id, document_id, text)
  VALUES('delete', old.id, old.id, old.document_id, old.text);
END;

-- Update schema version
INSERT INTO schema_versions (version, description)
VALUES (2, 'Add FTS5 full-text search on chunks');

COMMIT;

-- ============================================
-- ROLLBACK (manual)
-- ============================================
/*
BEGIN TRANSACTION;
DROP TABLE IF EXISTS chunks_fts;
DROP TRIGGER IF EXISTS chunks_ai;
DROP TRIGGER IF EXISTS chunks_ad;
DELETE FROM schema_versions WHERE version = 2;
COMMIT;
*/
```

---

## MigrationManager Interface

**Purpose**: Programmatic API for schema management

**Methods** (to implement Week 2):

```typescript
interface IMigrationManager {
  // Get current schema version from DB
  getCurrentVersion(): Promise<number>;
  
  // Get all available migrations
  getAvailableMigrations(): Promise<Migration[]>;
  
  // Get pending migrations (not yet applied)
  getPendingMigrations(): Promise<Migration[]>;
  
  // Apply all pending migrations (auto-increment version)
  migrate(): Promise<number>;  // Returns final version
  
  // Rollback to specific version (future)
  rollback(targetVersion: number): Promise<void>;
  
  // Verify database integrity post-migration
  verify(): Promise<boolean>;
}

interface Migration {
  version: number;
  description: string;
  content: string;  // SQL content
}
```

---

## Development Workflow (Week 1-4)

**No rollback needed** (because DB is local, not critical):

```bash
# If schema needs change:
$ rm -f kb.db
$ npm run db:init
# Re-applies v1 from scratch
```

---

## Release Workflow (Post-MVP, Week 8+)

**Support safe schema evolution**:

```bash
# Deploy extension v0.5.0 with schema v2
$ npm run db:migrate
# Detects: current v1 → available v2
# Applies v2 migration
# Updates schema_versions table
# Verifies integrity

# User can rollback if needed (manual)
$ npm run db:rollback --to=1
```

---

## Testing Migrations (Week 2+)

**Test procedure**:
1. Apply v1 → v2
2. Insert sample data into new table
3. Query works correctly
4. Rollback v2 → v1
5. Verify original schema restored
6. Repeat forward (v1 → v2)
7. All data preserved ✅

---

## Error Handling

**Scenarios**:

### Scenario 1: Migration file missing
```
Error: Migration v2 not found in migrations/ folder
Fix: Ensure 002_add_fts5.sql exists and is readable
```

### Scenario 2: Migration SQL syntax error
```
Error: SQL parse error in 002_add_fts5.sql
Fix: Validate SQL before commit
```

### Scenario 3: Database locked during migration
```
Error: SQLITE_BUSY - database is locked
Fix: Close other processes; retry
```

### Scenario 4: Constraint violation during migration
```
Error: UNIQUE constraint failed on new column
Fix: Pre-populate column with defaults; check data
```

**Handling** (Week 2 implementation):
- Try/catch around each migration
- Log details to extension output
- ROLLBACK if any step fails
- User sees clear error message

---

## Summary

| Phase | Version | Status | Migration Count |
|-------|---------|--------|-----------------|
| Week 1-2 | v1 | Active | 1 (v1 only) |
| Week 3-4 | v1-v2 | Active | 2 (v1, v2) |
| Week 5-6 | v1-v3 | Active | 3+ |
| MVP (Week 8) | v1-v4 | Active | 4+ |

**Key Point**: Migration system implemented in Week 2 (not Week 1); foundation laid now.
```

**Save this file**.

---

### [13:20–13:40] Create Migration File Structure (20 min)

Create directory and template:

```bash
mkdir -p ~/Devs/KBIngest/extension/src/storage/migrations
```

Create `~/Devs/KBIngest/extension/src/storage/migrations/README.md`:

```markdown
# Migrations

Database schema evolution tracked here.

## Naming

`{VERSION:03d}_{description}.sql`

- `001_initial_schema.sql` ← Active (v1)
- `002_add_fts5.sql` ← Future (Week 8+)
- `003_add_annotations.sql` ← Future (Week 9+)

## Adding Migration

1. Create file `{next_version}_{description}.sql`
2. Write UP (apply) script with BEGIN/COMMIT
3. Write DOWN (rollback) script in comments
4. Test: `npm run db:migrate`
5. Verify: `npm run db:verify`

## Current Migrations

- **v1** (ACTIVE): Initial schema (documents, chunks, vectors, tags, collections)
  - Tables: 8
  - Indexes: 13
  - Constraints: PK, FK, UNIQUE, CHECK
```

**Save this file**.

Create `~/Devs/KBIngest/extension/src/storage/migrations/001_initial_schema.sql`:

Copy entire `schema.sql` content you created earlier, wrap it:

```sql
-- Migration v1: Initial Schema
-- Applied: 2026-04-23
-- Description: Create base tables for KB storage

BEGIN TRANSACTION;

-- [FULL schema.sql content from earlier, lines 1-400]

-- Record migration
INSERT OR IGNORE INTO schema_versions (version, description)
VALUES (1, 'Initial schema: documents, chunks, vectors, tags, collections');

COMMIT;
```

**Save this file**.

---

### [13:40–14:10] Design MigrationManager Interface (30 min)

Create `~/Devs/KBIngest/extension/src/storage/MigrationManager.interface.ts`:

```typescript
/**
 * MigrationManager Interface
 * 
 * Handles database schema versioning and migrations.
 * Manages apply/rollback of schema changes.
 */

export interface IMigration {
  version: number;
  description: string;
  filepath: string;
  content: string;
}

export interface IMigrationStatus {
  currentVersion: number;
  targetVersion: number;
  pendingMigrations: IMigration[];
  lastApplied?: Date;
}

export interface IMigrationManager {
  /**
   * Initialize migration system; verify v1 is applied
   * @throws Error if database can't be initialized
   */
  init(): Promise<void>;

  /**
   * Get current schema version from database
   * @returns version number (1, 2, 3, ...)
   * @throws Error if schema_versions table doesn't exist
   */
  getCurrentVersion(): Promise<number>;

  /**
   * Get all available migration files from disk
   * @returns sorted by version ascending
   */
  getAvailableMigrations(): Promise<IMigration[]>;

  /**
   * Get migrations that haven't been applied yet
   * @example
   * Current version: 1
   * Available: [v1, v2, v3]
   * Pending: [v2, v3]
   */
  getPendingMigrations(): Promise<IMigration[]>;

  /**
   * Get current migration status
   */
  getStatus(): Promise<IMigrationStatus>;

  /**
   * Apply all pending migrations in order
   * - Each migration wrapped in transaction
   * - On error: auto-ROLLBACK; throw
   * @returns final version after migrations
   */
  migrate(): Promise<number>;

  /**
   * Apply specific migration (advanced)
   * @param version - migration version to apply
   * @throws if version <= currentVersion or not found
   */
  migrateToVersion(version: number): Promise<void>;

  /**
   * Rollback to specific version (manual rollback scripts)
   * @param targetVersion - roll back to this version
   * @throws if targetVersion >= currentVersion
   * @note Implementation deferred to Phase B
   */
  rollback(targetVersion: number): Promise<void>;

  /**
   * Verify database integrity post-migration
   * - Check schema_versions table exists
   * - Check all tables/indexes created
   * - Check version consistency
   * @returns true if valid
   * @throws descriptive error if not
   */
  verify(): Promise<boolean>;

  /**
   * Get human-readable migration history
   */
  getHistory(): Promise<Array<{
    version: number;
    description: string;
    appliedDate: Date;
  }>>;
}
```

**Save this file**.

---

### [14:10–14:25] Document Error Types (15 min)

Create `~/Devs/KBIngest/extension/src/storage/errors/MigrationError.ts`:

```typescript
/**
 * Migration-specific error types
 */

export class MigrationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

export class MigrationNotFoundError extends MigrationError {
  constructor(version: number) {
    super(
      `Migration v${version} not found`,
      'MIGRATION_NOT_FOUND',
      { version }
    );
  }
}

export class MigrationAlreadyAppliedError extends MigrationError {
  constructor(version: number) {
    super(
      `Migration v${version} already applied`,
      'ALREADY_APPLIED',
      { version }
    );
  }
}

export class MigrationFailedError extends MigrationError {
  constructor(version: number, originalError: Error) {
    super(
      `Migration v${version} failed: ${originalError.message}`,
      'MIGRATION_FAILED',
      { version, originalError: originalError.message }
    );
  }
}

export class MigrationVerificationError extends MigrationError {
  constructor(issues: string[]) {
    super(
      `Schema verification failed: ${issues.join('; ')}`,
      'VERIFICATION_FAILED',
      { issues }
    );
  }
}
```

**Save this file**.

---

**Success Checkpoint**: Migration system architecture fully designed  
✅ MIGRATIONS.md explains strategy  
✅ MigrationManager interface defined  
✅ Error types created  
✅ v1 migration file created  

---

## Task S1.2.3: Plan StorageManager Architecture (1.5 hours)

**Risk**: 🟢 Low | **Dependencies**: S1.2.1  
**What we're doing**: Interface design for all storage operations

### [14:25–14:55] Define StorageManager Types & Interface (30 min)

Create `~/Devs/KBIngest/extension/src/storage/types/index.ts`:

```typescript
/**
 * Storage Layer Type Definitions
 */

// ============================================
// ENTITY TYPES
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
  metadata?: Record<string, any>;
}

export interface IChunk {
  id: string;
  documentId: string;
  sequence: number;
  text: string;
  tokenCount: number;
  createdDate?: Date;
}

export interface IVector {
  id: string;
  chunkId: string;
  embedding: number[];
  modelName: string;
  dimension: number;
  createdDate?: Date;
}

export interface ITag {
  id: string;
  name: string;
  color?: string;
  description?: string;
  createdDate?: Date;
}

export interface ICollection {
  id: string;
  name: string;
  description?: string;
  color?: string;
  createdDate?: Date;
  updatedDate?: Date;
}

// ============================================
// FILTER/QUERY TYPES
// ============================================

export interface DocumentFilter {
  id?: string;
  name?: string;
  type?: 'markdown' | 'plaintext' | 'pdf';
  tags?: string[];
  collections?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  chunk: IChunk;
  similarity?: number;      // 0-1 for vector similarity
  relevance?: number;       // 0-1 for full-text match
  document?: IDocument;     // Optional: parent document
  score?: number;           // Combined score
}

export interface DatabaseStats {
  documentCount: number;
  chunkCount: number;
  vectorCount: number;
  tagCount: number;
  collectionCount: number;
  totalSizeBytes: number;
  schemaVersion: number;
}

// ============================================
// OPERATION RESPONSES
// ============================================

export interface OperationResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface BulkOperationResult {
  totalCount: number;
  successCount: number;
  failureCount: number;
  errors: Array<{
    itemId: string;
    error: string;
  }>;
}
```

**Save this file**.

Create `~/Devs/KBIngest/extension/src/storage/StorageManager.interface.ts`:

```typescript
/**
 * StorageManager Interface
 * 
 * Defines the complete API for storage operations.
 * Responsible for all database CRUD, transactions, and searches.
 */

import {
  IDocument, IChunk, IVector, ITag, ICollection,
  DocumentFilter, SearchResult, DatabaseStats
} from './types';

export interface IStorageManager {
  // ============================================
  // LIFECYCLE
  // ============================================

  /**
   * Initialize database: create tables, apply migrations
   * Called once on extension startup
   * @throws Error if database can't be initialized
   */
  init(): Promise<void>;

  /**
   * Health check: verify DB is accessible and schema valid
   * @returns true if healthy
   */
  health(): Promise<boolean>;

  /**
   * Close database connection
   * Called on extension deactivation
   */
  close(): Promise<void>;

  /**
   * Get database statistics
   */
  getStats(): Promise<DatabaseStats>;

  /**
   * Validate database integrity
   * @returns empty array if valid, list of error messages if not
   */
  validate(): Promise<string[]>;

  // ============================================
  // DOCUMENTS CRUD
  // ============================================

  /**
   * Create new document
   * @param doc - document data (id, createdDate, updatedDate auto-generated)
   * @returns created document with generated id
   * @throws DuplicateError if hash already exists
   */
  createDocument(
    doc: Omit<IDocument, 'id' | 'createdDate' | 'updatedDate'>
  ): Promise<IDocument>;

  /**
   * Get document by id
   * @returns document or null if not found
   */
  getDocument(id: string): Promise<IDocument | null>;

  /**
   * Get document by hash (deduplication check)
   */
  getDocumentByHash(hash: string): Promise<IDocument | null>;

  /**
   * List documents with optional filtering
   */
  listDocuments(filter?: DocumentFilter): Promise<IDocument[]>;

  /**
   * Update document metadata
   */
  updateDocument(
    id: string,
    updates: Partial<Omit<IDocument, 'id' | 'hash'>>
  ): Promise<IDocument>;

  /**
   * Delete document (cascades to chunks, vectors)
   */
  deleteDocument(id: string): Promise<void>;

  /**
   * Delete multiple documents
   */
  deleteDocuments(ids: string[]): Promise<number>;

  // ============================================
  // CHUNKS CRUD
  // ============================================

  /**
   * Create chunk
   */
  createChunk(chunk: Omit<IChunk, 'id' | 'createdDate'>): Promise<IChunk>;

  /**
   * Batch create chunks (recommended for ingestion)
   * Wrapped in transaction for atomicity
   */
  createChunks(chunks: Omit<IChunk, 'id' | 'createdDate'>[]): Promise<IChunk[]>;

  /**
   * Get chunk by id
   */
  getChunk(id: string): Promise<IChunk | null>;

  /**
   * Get all chunks of a document, ordered by sequence
   */
  listChunks(documentId: string): Promise<IChunk[]>;

  /**
   * Get chunk with adjacent chunks (for context)
   * @param chunkId - target chunk
   * @param contextSize - how many before/after to return
   */
  getChunkWithContext(
    chunkId: string,
    contextSize?: number
  ): Promise<{ before: IChunk[]; chunk: IChunk; after: IChunk[] } | null>;

  /**
   * Delete chunks (usually cascaded from document delete)
   */
  deleteChunksByDocument(documentId: string): Promise<number>;

  // ============================================
  // VECTORS CRUD
  // ============================================

  /**
   * Create vector (embedding)
   */
  createVector(vector: Omit<IVector, 'id' | 'createdDate'>): Promise<IVector>;

  /**
   * Batch create vectors
   * Wrapped in transaction
   */
  createVectors(vectors: Omit<IVector, 'id' | 'createdDate'>[]): Promise<IVector[]>;

  /**
   * Get vector by chunk id
   */
  getVector(chunkId: string): Promise<IVector | null>;

  /**
   * Check if chunk has embedding
   */
  hasVector(chunkId: string): Promise<boolean>;

  /**
   * Delete vectors for chunks (cascaded from chunk delete)
   */
  deleteVectorsByChunk(chunkIds: string[]): Promise<number>;

  // ============================================
  // TAGS
  // ============================================

  /**
   * Create tag
   */
  createTag(tag: Omit<ITag, 'id' | 'createdDate'>): Promise<ITag>;

  /**
   * Get tag by id
   */
  getTag(id: string): Promise<ITag | null>;

  /**
   * Get tag by name
   */
  getTagByName(name: string): Promise<ITag | null>;

  /**
   * List all tags
   */
  listTags(): Promise<ITag[]>;

  /**
   * Add tag to document (creates M2M entry)
   * @throws DuplicateError if already tagged
   */
  addTagToDocument(documentId: string, tagId: string): Promise<void>;

  /**
   * Remove tag from document
   */
  removeTagFromDocument(documentId: string, tagId: string): Promise<void>;

  /**
   * Get all tags for a document
   */
  getDocumentTags(documentId: string): Promise<ITag[]>;

  /**
   * Get all documents with a tag
   */
  getDocumentsWithTag(tagId: string): Promise<IDocument[]>;

  /**
   * Delete tag (removes from all documents)
   */
  deleteTag(id: string): Promise<void>;

  // ============================================
  // COLLECTIONS
  // ============================================

  /**
   * Create collection
   */
  createCollection(
    coll: Omit<ICollection, 'id' | 'createdDate' | 'updatedDate'>
  ): Promise<ICollection>;

  /**
   * Get collection by id
   */
  getCollection(id: string): Promise<ICollection | null>;

  /**
   * Get collection by name
   */
  getCollectionByName(name: string): Promise<ICollection | null>;

  /**
   * List all collections
   */
  listCollections(): Promise<ICollection[]>;

  /**
   * Add document to collection
   */
  addDocumentToCollection(documentId: string, collectionId: string): Promise<void>;

  /**
   * Remove document from collection
   */
  removeDocumentFromCollection(documentId: string, collectionId: string): Promise<void>;

  /**
   * Get all collections for a document
   */
  getDocumentCollections(documentId: string): Promise<ICollection[]>;

  /**
   * Get all documents in a collection
   */
  getCollectionDocuments(collectionId: string): Promise<IDocument[]>;

  /**
   * Delete collection (removes associations, not documents)
   */
  deleteCollection(id: string): Promise<void>;

  /**
   * Update collection
   */
  updateCollection(
    id: string,
    updates: Partial<Omit<ICollection, 'id' | 'createdDate'>>
  ): Promise<ICollection>;

  // ============================================
  // TRANSACTIONS
  // ============================================

  /**
   * Run multiple operations in atomic transaction
   * All succeed or all fail (ROLLBACK)
   * @example
   * await storage.transaction(async (tx) => {
   *   const doc = await tx.createDocument(...);
   *   const chunks = await tx.createChunks([...]);
   *   const vectors = await tx.createVectors([...]);
   *   return { doc, chunks, vectors };
   * });
   */
  transaction<T>(
    fn: (manager: IStorageManager) => Promise<T>
  ): Promise<T>;

  // ============================================
  // SEARCH
  // ============================================

  /**
   * Vector similarity search
   * @param embedding - vector to search for (384D or 1536D)
   * @param limit - top-k results (default 10)
   * @param threshold - minimum similarity 0-1 (default 0.5)
   * @returns chunks sorted by similarity descending
   */
  searchByVector(
    embedding: number[],
    limit?: number,
    threshold?: number
  ): Promise<SearchResult[]>;

  /**
   * Full-text search on chunk text
   * @param query - search terms
   * @param limit - top-k results
   * @returns chunks matching query
   * @note FTS5 added in v2; MVP uses LIKE
   */
  searchByText(query: string, limit?: number): Promise<SearchResult[]>;

  /**
   * Hybrid search: combine vector + text
   * @param query - text query
   * @param embedding - optional vector (if not provided, use text only)
   * @param limit - results to return
   */
  search(
    query: string,
    embedding?: number[],
    limit?: number
  ): Promise<SearchResult[]>;

  /**
   * Advanced search with filters
   * @param query - text query
   * @param embedding - optional vector
   * @param filters - apply tag/collection/date filters
   * @param limit - results count
   */
  advancedSearch(
    query: string,
    embedding?: number[],
    filters?: {
      tags?: string[];
      collections?: string[];
      documentTypes?: string[];
    },
    limit?: number
  ): Promise<SearchResult[]>;

  // ============================================
  // BULK OPERATIONS
  // ============================================

  /**
   * Import multiple documents with chunks and vectors
   * Used for batch ingestion
   */
  bulkImport(
    operations: Array<{
      document: Omit<IDocument, 'id' | 'createdDate' | 'updatedDate'>;
      chunks: Omit<IChunk, 'id' | 'createdDate'>[];
      vectors: Omit<IVector, 'id' | 'createdDate'>[];
    }>
  ): Promise<{
    documentIds: string[];
    chunkIds: string[];
    vectorIds: string[];
  }>;

  /**
   * Export documents (for backup)
   */
  exportDocuments(
    documentIds: string[]
  ): Promise<Array<{
    document: IDocument;
    chunks: IChunk[];
    vectors: IVector[];
    tags: ITag[];
  }>>;
}
```

**Save this file**.

---

### [14:55–15:25] Document Storage Architecture Design (30 min)

Create `~/Devs/KBIngest/extension/docs/STORAGE_ARCHITECTURE.md`:

```markdown
# Storage Layer Architecture

## Overview

**Purpose**: Provide persistent storage for ingested documents, chunks, vectors, and metadata

**Technology**: SQLite (local, file-based, zero-setup)

**Data Flow**:
```
User uploads document
  ↓
ParseDocument() → plain text
  ↓
ChunkText() → chunks[]
  ↓
GenerateEmbeddings() → vectors[]
  ↓
StorageManager.createDocument() + createChunks() + createVectors()
  ↓ (within transaction)
SQLite storage (atomic, all-or-nothing)
  ↓
Success → UI updated
Error → Rollback; user notified
```

---

## Component: StorageManager

**Responsibilities**:
- CRUD for all entities (documents, chunks, vectors, tags, collections)
- Transaction management (all-or-nothing ingestion)
- Search interface (vector + full-text)
- Health checks and validation

**Public API**: 30+ methods covering all operations

**Key Methods**:

| Method | Purpose | Example |
|--------|---------|---------|
| init() | Initialize DB, apply migrations | `await storage.init()` |
| createDocument() | Ingest new document | `await storage.createDocument(...)` |
| createChunks() | Add chunks (batch) | `await storage.createChunks([...])` |
| createVectors() | Add embeddings | `await storage.createVectors([...])` |
| transaction() | Atomic batch operation | `await storage.transaction(async (tx) => {...})` |
| search() | Hybrid search | `await storage.search(query, embedding)` |
| getStats() | Document/chunk counts | `await storage.getStats()` |
| health() | Verify database OK | `await storage.health()` |

---

## Transaction Pattern

**Problem**: Ingestion is multi-step (create doc → create chunks → create vectors). If step 2 fails, step 1's data is orphaned.

**Solution**: Wrap in transaction.

**Example**:

```typescript
async function ingestDocument(file: Buffer, filename: string) {
  return await storageManager.transaction(async (tx) => {
    // Step 1: Create document record
    const doc = await tx.createDocument({
      name: filename,
      type: 'markdown',
      sizeBytes: file.length,
      hash: computeSHA256(file)
    });

    // Step 2: Parse and chunk
    const chunks = await parseAndChunk(file);
    const createdChunks = await tx.createChunks(
      chunks.map((text, seq) => ({
        documentId: doc.id,
        sequence: seq,
        text,
        tokenCount: countTokens(text)
      }))
    );

    // Step 3: Generate embeddings
    const vectors = await generateEmbeddings(createdChunks);
    await tx.createVectors(vectors);

    // All succeed atomically
    return doc;
  });
  
  // If any step throws, ALL changes rolled back
}
```

**Benefits**:
- Atomicity: All or nothing
- Consistency: No partial ingestion
- Isolation: No concurrent reads of incomplete state
- Durability: Committed data persists

---

## Error Handling

**Custom Error Types**:

```
StorageError (base)
  ├─ NotFoundError: Entity doesn't exist
  ├─ DuplicateError: Unique constraint violation (e.g., tag name)
  ├─ ConstraintError: Foreign key or check constraint violated
  └─ TransactionError: Transaction failed/rollback
```

**Example**:

```typescript
try {
  await storage.addTagToDocument(docId, tagId);
} catch (error) {
  if (error instanceof DuplicateError) {
    console.log('Tag already applied to document');
  } else if (error instanceof NotFoundError) {
    console.log('Document or tag not found');
  } else {
    console.log('Unexpected error:', error);
  }
}
```

---

## Connection Management

**Current (MVP)**: Single connection, reused

```typescript
class StorageManager {
  private db: Database;  // Single connection
  
  async init() {
    this.db = new Database(path);
    this.db.pragma('journal_mode = WAL');  // Write-Ahead Logging
    this.db.pragma('foreign_keys = ON');   // Integrity
  }
}
```

**Why single connection**:
- VS Code extension is single-threaded
- SQLite WAL handles multiple readers + one writer
- Sufficient for personal KB (<10K documents)

**Future (Phase B)**: Connection pool if background tasks added

---

## Concurrency & Locking

**SQLite Locking Model**:

| Mode | Readers | Writer | Notes |
|------|---------|--------|-------|
| WAL off | 1 | 1 | Serialized; slow |
| WAL on | Many | 1 | Concurrent reads; exclusive write |

**Our Setup**: WAL enabled → multiple concurrent readers, exclusive writer

**Scenario**:
```
UI reads documents    ← Reader 1
Background job searches chunks ← Reader 2
Ingestion thread writes vectors ← Writer 1
                      ↓
Result: Readers proceed; writer queued (or locks if needed)
```

**Practical implication**: Extension remains responsive during ingestion ✅

---

## Performance Characteristics

| Operation | Time | Scaling | Notes |
|-----------|------|---------|-------|
| Insert 1 document + 10 chunks + 10 vectors | 5-20ms | O(n) | Within transaction |
| Query: get document by hash | <1ms | O(1) | Indexed lookup |
| Query: all chunks of doc | 5-20ms | O(1) | FK index helps |
| Query: full-text search (no FTS5) | 50-200ms | O(n) | Full table scan; improves v2 |
| Database size: 1000 documents | ~50-100MB | Depends | SQLite is compact |
| Memory footprint: 1000 docs | ~10-20MB | Linear | WAL checkpoint + cache |

**Optimization**: Indexes on all FK and common filters (13 total)

---

## Backup & Recovery

**Backup Strategy** (Week 2+):

```bash
# Manual backup: Copy database file
cp ~/.config/Code/User/globalStorage/kb-extension/kb.db ./backup.db

# Automated backup: Option in settings (Phase B)
```

**Recovery**:
```bash
# Restore from backup
cp ./backup.db ~/.config/Code/User/globalStorage/kb-extension/kb.db

# Re-validate
npm run db:verify
```

---

## Migration & Schema Evolution

**Versioning**: Tracked in `schema_versions` table

**Timeline**:
- v1: Initial (Week 1, active)
- v2: FTS5 (Week 8+)
- v3: Annotations (Week 9+)
- v4+: Future extensions

**Implementation**: See MIGRATIONS.md

---

## Testing Strategy

**Unit Tests** (Week 2):

- [ ] Document CRUD (create, read, update, delete)
- [ ] Chunk CRUD with FK constraints
- [ ] Vector CRUD with uniqueness
- [ ] Tag association (M2M)
- [ ] Collection membership (M2M)
- [ ] Transactions (atomicity)
- [ ] Search (vector, text, hybrid)
- [ ] Error cases (duplicates, constraints, not found)
- [ ] Stats calculation
- [ ] Health checks

**Expected Coverage**: >80%

---

## API Contract

**Method Signatures**:

```typescript
// Lifecycle
async init(): Promise<void>
async health(): Promise<boolean>
async close(): Promise<void>

// Documents
async createDocument(doc): Promise<IDocument>
async getDocument(id): Promise<IDocument | null>
async listDocuments(filter?): Promise<IDocument[]>
async updateDocument(id, updates): Promise<IDocument>
async deleteDocument(id): Promise<void>

// ... 30+ methods total
```

**All methods**: Typed, documented, error-safe

---

## Roadmap Integration

**Week 1** (this week): Design complete ✓  
**Week 2**: Implement StorageManager + 80% tests  
**Week 3**: Integration with IngestionService  
**Week 4**: Performance tuning & optimization  

**Ready for Week 2 implementation** ✓
```

**Save this file**.

---

**Success Checkpoint Reached**: 🟢

✅ StorageManager interface fully defined (30+ methods)  
✅ Type definitions comprehensive  
✅ Transaction pattern documented  
✅ Error handling strategy designed  
✅ Performance characteristics documented  

---

## Task S1.3.1: Design Configuration Schema (1 hour)

**Risk**: 🟢 Low | **Dependencies**: S1.1 complete

### [15:25–15:55] Define KB Settings in package.json (30 min)

Open `~/Devs/KBIngest/extension/package.json` and locate or add `contributes.configuration`:

```json
{
  "name": "kb-extension",
  "version": "0.1.0",
  
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
          "description": "Filename for SQLite database (relative to storage location)",
          "scope": "resource"
        },
        "kb.embedding.model": {
          "type": "string",
          "enum": [
            "sentence-transformers/all-MiniLM-L6-v2",
            "sentence-transformers/all-mpnet-base-v2"
          ],
          "default": "sentence-transformers/all-MiniLM-L6-v2",
          "description": "Embedding model to use (MiniLM: 384D lightweight; MPNet: 768D larger)",
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
          "description": "Target chunk size in tokens (default 512 ~2-3 KB)",
          "scope": "resource"
        },
        "kb.chunking.overlap": {
          "type": "integer",
          "default": 20,
          "minimum": 0,
          "maximum": 500,
          "description": "Token overlap between chunks (preserves context)",
          "scope": "resource"
        },
        "kb.search.limit": {
          "type": "integer",
          "default": 10,
          "minimum": 1,
          "maximum": 100,
          "description": "Number of search results to return per query",
          "scope": "resource"
        },
        "kb.search.threshold": {
          "type": "number",
          "default": 0.5,
          "minimum": 0,
          "maximum": 1,
          "description": "Minimum similarity score for vector search (0=accept all, 1=perfect match only)",
          "scope": "resource"
        },
        "kb.logging.level": {
          "type": "string",
          "enum": ["debug", "info", "warn", "error"],
          "default": "info",
          "description": "Logging verbosity (debug for development, info for production)",
          "scope": "machine"
        },
        "kb.advanced.enableMetrics": {
          "type": "boolean",
          "default": false,
          "description": "Collect performance metrics (development only)",
          "scope": "machine"
        },
        "kb.advanced.maxDocumentSizeBytes": {
          "type": "integer",
          "default": 10485760,
          "minimum": 1048576,
          "description": "Maximum document size in bytes (default 10 MB)",
          "scope": "machine"
        }
      }
    }
  }
}
```

**Save `package.json`**.

**Verify JSON is valid**:
```bash
cd ~/Devs/KBIngest/extension
npm run compile 2>&1 | head -20
# Should have no JSON parse errors
```

---

### [15:55–16:25] Document Configuration Schema (30 min)

Create `~/Devs/KBIngest/extension/docs/SETTINGS.md`:

```markdown
# KB Extension Configuration

## Settings Overview

11 configurable parameters across 5 categories: Storage, Embedding, Chunking, Search, Developer

All settings edited via VS Code `settings.json` or Settings UI.

---

## Storage Settings

### kb.storage.location
**Type**: `string`  
**Default**: `${workspaceFolder}/.kb`  
**Scope**: `resource` (per workspace/folder)

Where the KB database and files live.

**Example**:
```json
{
  "kb.storage.location": "${workspaceFolder}/.kb-custom"
}
```

**Variables**:
- `${workspaceFolder}`: Current workspace root
- `${workspaceFolderBasename}`: Workspace folder name
- Absolute paths also OK: `/home/user/kb-storage`

**Notes**:
- Directory auto-created if doesn't exist (Week 2)
- Requires write permissions
- Can use per-folder overrides in VS Code

---

### kb.storage.databaseFile
**Type**: `string`  
**Default**: `kb.db`  
**Scope**: `resource`

Filename of SQLite database (relative to storage.location).

**Example**:
```json
{
  "kb.storage.databaseFile": "personal.db"
}
```

**Result**: Database at `${workspaceFolder}/.kb/personal.db`

**Notes**:
- Don't include path separators; just filename
- ".db" extension recommended
- Single database per workspace

---

## Embedding Settings

### kb.embedding.model
**Type**: `string`  
**Enum**: `["sentence-transformers/all-MiniLM-L6-v2", "sentence-transformers/all-mpnet-base-v2"]`  
**Default**: `sentence-transformers/all-MiniLM-L6-v2`  
**Scope**: `machine` (global user preference)

Which embedding model to use for semantic search.

**Options**:

| Model | Dimension | Size | Speed | Quality | Recommended |
|-------|-----------|------|-------|---------|-------------|
| MiniLM-L6-v2 | 384D | ~60MB | Fast (100-200ms/chunk) | Good (99% of MiniLM-L12) | ✅ MVP |
| MPNet-base-v2 | 768D | ~400MB | Slower (200-400ms/chunk) | Better (more precise) | Phase B |

**Example**:
```json
{
  "kb.embedding.model": "sentence-transformers/all-mpnet-base-v2"
}
```

**Impact**:
- Changing model requires re-embedding all documents (Week 3)
- MiniLM recommended for most users
- MPNet if you need highest precision

**Technical**: Models downloaded from Hugging Face; cached locally in extension storage

---

## Chunking Settings

### kb.chunking.strategy
**Type**: `string`  
**Enum**: `["paragraph", "sentence", "token-window"]`  
**Default**: `paragraph`  
**Scope**: `resource`

How to split documents into chunks.

**Strategies**:

| Strategy | How It Works | Pros | Cons |
|----------|------------|------|------|
| **paragraph** | Split on blank lines | Simple, preserves natural boundaries | May create very large chunks |
| **sentence** | Split on sentence endings (. ! ?) | Balanced, good context | Punctuation detection tricky |
| **token-window** | Fixed token count with overlap | Most control, consistent size | Splits mid-sentence sometimes |

**Example**:
```json
{
  "kb.chunking.strategy": "sentence"
}
```

**Recommendation**: `paragraph` for most use cases; switch to `sentence` if chunks too large

---

### kb.chunking.size
**Type**: `integer`  
**Range**: 100-2000  
**Default**: 512  
**Scope**: `resource`

Target chunk size in tokens (for token-window strategy; approximate for others).

**Examples**:

| Size | Approx. Text | Use Case |
|------|-------------|----------|
| 256 tokens | 1 KB | Dense technical docs; short context |
| 512 tokens | 2-3 KB | Balanced (recommended) |
| 1024 tokens | 4-5 KB | Narrative docs; need more context |

**Example**:
```json
{
  "kb.chunking.size": 1024
}
```

**Impact**:
- Larger chunks: fewer embeddings (faster), less precise
- Smaller chunks: more embeddings (slower), more precise

---

### kb.chunking.overlap
**Type**: `integer`  
**Range**: 0-500  
**Default**: 20  
**Scope**: `resource`

Token overlap between adjacent chunks (preserves context at boundaries).

**Example**:
```json
{
  "kb.chunking.strategy": "token-window",
  "kb.chunking.size": 512,
  "kb.chunking.overlap": 50
}
```

**Effect**:
```
Chunk 1: [tokens 0-512]
Chunk 2: [tokens 462-974]  ← 50-token overlap
Chunk 3: [tokens 924-1436] ← 50-token overlap
```

**Benefits**:
- Prevents losing context at chunk boundaries
- Better semantic continuity
- Slight increase in storage (worth it)

**Recommendation**: 20 tokens default is good; increase if docs have complex relationships

---

## Search Settings

### kb.search.limit
**Type**: `integer`  
**Range**: 1-100  
**Default**: 10  
**Scope**: `resource`

How many search results to return per query.

**Example**:
```json
{
  "kb.search.limit": 20
}
```

**Impact**:
- More results: more processing time
- Fewer results: faster, UI less cluttered
- Typical: 10 results is good default

---

### kb.search.threshold
**Type**: `number`  
**Range**: 0-1  
**Default**: 0.5  
**Scope**: `resource`

Minimum similarity score for vector search results (0 = accept anything, 1 = exact match only).

**Example**:
```json
{
  "kb.search.threshold": 0.6
}
```

**Impact**:
- 0.3: Very permissive (many false positives)
- 0.5: Balanced (recommended)
- 0.7: Strict (may miss relevant results)
- 0.9: Very strict (only near-duplicates)

**Technical**: Cosine similarity score on embedding vectors

---

## Developer Settings

### kb.logging.level
**Type**: `string`  
**Enum**: `["debug", "info", "warn", "error"]`  
**Default**: `info`  
**Scope**: `machine`

Log verbosity level.

**Levels**:

| Level | Shown | Output Pane | Use |
|-------|-------|------------|-----|
| **debug** | All | Verbose logs | Development & troubleshooting |
| **info** | Info + warn + error | Key events | Normal operation |
| **warn** | Warn + error | Warnings & issues | Production (quiet) |
| **error** | Error only | Errors only | Silent operation |

**Example**:
```json
{
  "kb.logging.level": "debug"
}
```

**Output**: Extension output pane in VS Code (Ctrl+K Ctrl+H)

---

### kb.advanced.enableMetrics
**Type**: `boolean`  
**Default**: `false`  
**Scope**: `machine`

Collect performance metrics (ingestion time, search latency, memory use).

**Example**:
```json
{
  "kb.advanced.enableMetrics": true
}
```

**When enabled**:
- Time logged for ingestion, search, embedding
- Memory usage sampled
- Written to extension logs
- ~1-2% performance overhead

**Use case**: Troubleshooting slow operations; performance tuning

---

### kb.advanced.maxDocumentSizeBytes
**Type**: `integer`  
**Default**: 10485760 (10 MB)  
**Range**: 1MB - unlimited  
**Scope**: `machine`

Maximum document size allowed (safety limit).

**Example**:
```json
{
  "kb.advanced.maxDocumentSizeBytes": 52428800
}
```

**Impact**:
- 10 MB: Reasonable default (most documents < 1 MB)
- 50 MB: Allow larger PDFs
- 100 MB+: For archive documents

**Note**: Larger files require more ingestion time

---

## Configuration Examples

### Example 1: Default Setup (MVP)
```json
// Settings (use defaults)
{}
```

Result:
- Database: `.kb/kb.db`
- Model: MiniLM (384D)
- Chunks: paragraph, 512 tokens
- Search: 10 results, threshold 0.5
- Logging: info level

---

### Example 2: Power User (Phase B+)
```json
{
  "kb.storage.location": "${workspaceFolder}/.kb-pro",
  "kb.embedding.model": "sentence-transformers/all-mpnet-base-v2",
  "kb.chunking.strategy": "sentence",
  "kb.chunking.size": 1024,
  "kb.chunking.overlap": 50,
  "kb.search.limit": 20,
  "kb.search.threshold": 0.6,
  "kb.logging.level": "debug",
  "kb.advanced.enableMetrics": true
}
```

---

### Example 3: Workspace Override
**Global settings** (`~/.config/Code/User/settings.json`):
```json
{
  "kb.embedding.model": "sentence-transformers/all-mpnet-base-v2",
  "kb.logging.level": "info"
}
```

**Workspace settings** (`.vscode/settings.json`):
```json
{
  "kb.storage.location": "${workspaceFolder}/.kb-local",
  "kb.chunking.size": 256
}
```

**Result**: Workspace settings override global for local settings; machine settings stay global

---

## Future Settings (Phase B+)

Planned but not yet implemented:

- `kb.embedding.provider`: "local", "ollama", "openai" (toggle embedding source)
- `kb.qdrant.mode`: "memory", "disk", "cloud" (vector DB mode)
- `kb.ingestion.autoTag`: Auto-suggest tags during upload
- `kb.ui.theme`: Dark, light, auto
- `kb.sync.enabled`: Enable cloud sync (Phase C)

---

## Settings UI (Week 3)

**Week 2**: Settings via `settings.json` (CLI users)  
**Week 3**: Settings UI panel in sidebar (GUI users)

Easy toggle between options without editing JSON.

---

## Configuration Manager (Week 2)

**API** (to be implemented):

```typescript
interface IConfigManager {
  get<T>(key: string, defaultValue?: T): T;
  set(key: string, value: any): Promise<void>;
  onChange(key: string, listener: (value: any) => void): Disposable;
}

// Usage:
const model = configManager.get('kb.embedding.model');
// → "sentence-transformers/all-MiniLM-L6-v2"

await configManager.set('kb.search.limit', 20);

configManager.onChange('kb.logging.level', (level) => {
  logger.setLevel(level);
});
```

**Implementation**: Wraps VS Code's configuration API

---

## Troubleshooting

### Setting not taking effect
1. Reload VS Code window (Ctrl+Shift+P > Reload Window)
2. Check Extension output for errors
3. Verify JSON syntax in settings.json

### Setting shows error
- Red squiggly underline: Check against allowed values (enum)
- Check min/max for numbers
- Restart VS Code

### Need to reset to defaults
Delete the setting from `settings.json`; VS Code reverts to default
```

**Save this file**.

---

**Success Checkpoint Reached**: 🟢

✅ Configuration schema defined in package.json  
✅ All 11 settings documented with examples  
✅ Scope (resource vs machine) explained  
✅ Future settings identified  

---

## End of Day 2: Wrap-up (16:55–17:00 / 5 min)

### [16:55–17:00] Commit All Changes

```bash
cd ~/Devs/KBIngest/extension

# Stage all documentation and schema files
git add -A

# Comprehensive commit message
git commit -m "docs: database schema & storage architecture design

Morning Tasks:
- S1.1.7: Project structure fully validated
- S1.2.1: Database schema designed (8 tables, 13 indexes, 3NF normalized)
  - Documents, chunks, vectors (1:1 embeddings)
  - Tags & collections (M2M relationships)
  - Foreign key constraints with CASCADE delete
  - Clear ERD and schema design rationale

Afternoon Tasks:
- S1.2.2: Migration system architecture documented
  - Versioning strategy (v1, v2, v3, ...)
  - MigrationManager interface (6 methods)
  - Migration file template with rollback scripts
- S1.2.3: StorageManager interface fully designed
  - 30+ methods covering all CRUD, transactions, search
  - Transaction pattern for atomic operations
  - Error types (NotFound, Duplicate, Constraint, Transaction)
  - Performance estimates and testing strategy
- S1.3.1: Configuration schema designed
  - 11 settings in package.json
  - Storage, embedding, chunking, search, developer categories
  - Machine vs resource scopes

Files Created:
- schema.sql (400+ lines with comments)
- SCHEMA_DESIGN.md (entity definitions, ERD, normalization)
- SCHEMA_DECISIONS.md (rationale, indexes, future extensions)
- MIGRATIONS.md (versioning, file structure, examples)
- MigrationManager.interface.ts (migration API)
- StorageManager.interface.ts (30+ storage methods)
- StorageManager types (IDocument, IChunk, IVector, etc.)
- STORAGE_ARCHITECTURE.md (transaction patterns, error handling, perf)
- SETTINGS.md (all 11 configuration options explained)

Total Documentation: 1000+ lines
Schema Tables: 8 (normalized, indexed)
API Methods: 30+ (well-typed, documented)

Commits: 
- v0.1.0-day1: Scaffolding complete
- v0.2.0-day2: Architecture design complete
"

# Create Day 2 tag
git tag -a v0.2.0-day2 -m "End of Day 2: Database schema & architecture designed"

# Verify commits
git log --oneline | head -5
git tag -l
```

**Expected output**:
```
b1234cd docs: database schema & storage architecture design
a9876bc chore: initial extension scaffold with TypeScript + Jest
...

v0.1.0-alpha
v0.1.0-day1
v0.2.0-day2
```

### Update PROGRESS.md

Create `~/Devs/KBIngest/extension/PROGRESS.md`:

```markdown
# KB Extension Development Progress

## Day 1 (Monday) - ✅ COMPLETE
**Theme**: Project Scaffolding

### Completed Tasks
- ✅ S1.1.1: Extension scaffold via `yo code`
- ✅ S1.1.2: TypeScript strict mode configured
- ✅ S1.1.3: Jest testing framework setup
- ✅ S1.1.4: Git initialized with .gitignore
- ✅ S1.1.5: README + debugging guide
- ✅ S1.1.6: Contributing guidelines

### Key Deliverables
- Extension scaffolds successfully
- npm run compile: ✅ <5 seconds, zero errors
- npm test: ✅ All pass, coverage ready
- F5 debugging: ✅ Works in VS Code

### Metrics
- Files created: 5 (README.md, CONTRIBUTING.md, CHANGELOG.md, etc.)
- Git commits: 2
- Lines of documentation: 200+
- Tests passing: 1/1

### Notes
- Yeoman-generated scaffold was clean
- TypeScript strict mode ready for enforcing quality
- All Day 1 deliverables met

---

## Day 2 (Tuesday) - ✅ COMPLETE
**Theme**: Database Schema Design & Configuration Structure

### Completed Tasks
- ✅ S1.1.7: Project structure fully validated
- ✅ S1.2.1: Database schema designed (CRITICAL PATH)
- ✅ S1.2.2: Migration system architecture planned
- ✅ S1.2.3: StorageManager interface designed
- ✅ S1.3.1: Configuration schema designed

### Key Deliverables

#### Database Schema (S1.2.1)
- `schema.sql`: 400+ lines, 8 tables, fully normalized (3NF)
- `SCHEMA_DESIGN.md`: Entity definitions, ERD, relationships
- `SCHEMA_DECISIONS.md`: Rationale, index strategy, future extensions

**Schema Components**:
- Documents: Ingested content, deduplication by hash
- Chunks: Searchable units (paragraphs/token-windows)
- Vectors: Embeddings (384D MiniLM, 1536D future)
- Tags: Flat categorization (M2M)
- Collections: Hierarchical grouping (M2M)
- Schema_Versions: Migration tracking

**Quality**:
- 3NF Normalization: ✅ No redundancy
- Foreign Key Constraints: ✅ CASCADE delete
- Indexes: 13 (on PK, FK, common filters)
- Performance: <1ms lookup, 5-20ms operations

#### Migration System (S1.2.2)
- `MIGRATIONS.md`: Versioning strategy, file structure
- `MigrationManager.interface.ts`: 6 methods (init, getCurrentVersion, getPendingMigrations, migrate, etc.)
- Migration template: v1 (active), v2-v5 planned
- Error types: MigrationError, MigrationFailedError, etc.

**Strategy**:
- v1 (Week 1-2): Initial schema
- v2 (Week 8): FTS5 full-text search
- v3-v5 (Week 9+): Annotations, sync metadata, extensions

#### StorageManager Interface (S1.2.3)
- `StorageManager.interface.ts`: 30+ methods
- `types/index.ts`: Complete type definitions

**Methods by Category**:
- Lifecycle: init, health, close, getStats, validate (5)
- Documents CRUD: create, get, list, update, delete (5)
- Chunks CRUD: create (batch), get, list, delete (4)
- Vectors CRUD: create (batch), get, delete (3)
- Tags: create, get, list, add/remove to document (4)
- Collections: create, get, list, add/remove document (4)
- Transactions: atomic multi-operation wrapper (1)
- Search: vector, text, hybrid, advanced (4)
- Bulk operations: import, export (2)

**Quality**:
- Full TypeScript types ✅
- Error handling documented ✅
- Transaction pattern defined ✅
- 30+ methods, all documented ✅

#### Storage Architecture (S1.2.3 docs)
- `STORAGE_ARCHITECTURE.md`: 800+ lines
- Transaction patterns (atomicity, consistency)
- Error handling strategy
- Connection management (single connection + WAL)
- Performance characteristics
- Concurrency model (SQLite WAL)
- Backup & recovery
- Migration integration
- Testing strategy (>80% coverage target)

#### Configuration Schema (S1.3.1)
- `package.json`: 11 settings defined
- `SETTINGS.md`: 600+ lines documentation
- Categories: Storage (2), Embedding (1), Chunking (3), Search (2), Developer (3)
- Scope: machine vs resource (global vs per-workspace)
- Examples for each setting
- Future settings identified (phase B+)

### Metrics
- Files created: 10 major files
- Lines of documentation: 1200+
- Database tables: 8
- API methods: 30+
- Configuration parameters: 11
- Git commits: 2
- Code: All TypeScript, fully typed

### Artifacts Summary

```
Database Schema:
  ├── schema.sql (400 lines)
  ├── SCHEMA_DESIGN.md (300 lines)
  └── SCHEMA_DECISIONS.md (250 lines)

Storage API:
  ├── StorageManager.interface.ts (300 lines)
  ├── types/index.ts (150 lines)
  └── STORAGE_ARCHITECTURE.md (350 lines)

Migration System:
  ├── MIGRATIONS.md (200 lines)
  ├── MigrationManager.interface.ts (100 lines)
  └── 001_initial_schema.sql (420 lines)

Configuration:
  ├── package.json (contributes.configuration section)
  └── SETTINGS.md (300 lines)

Migration Files:
  └── src/storage/migrations/
      ├── README.md (template guide)
      └── 001_initial_schema.sql

Error Handling:
  ├── StorageError.ts (base class)
  └── MigrationError.ts (migration errors)
```

### Quality Checklist

✅ **Schema Design**:
- 3NF normalization verified
- All constraints documented (PK, FK, UNIQUE, CHECK)
- Index strategy explained (13 indexes, 2-3% overhead)
- Cascade delete behavior verified
- Performance estimates provided

✅ **API Design**:
- 30+ methods covering all operations
- Full TypeScript type safety
- Clear error handling strategy
- Transaction pattern documented
- Batch operation support

✅ **Documentation**:
- 1200+ lines of clear documentation
- Examples for each setting/API
- Future extensions identified
- Rationale for design decisions
- Performance characteristics

### Design Review

**Strengths**:
- Schema is well-normalized; minimal redundancy
- API covers all CRUD + search + transactions
- Migration system enables safe schema evolution
- Configuration is comprehensive yet simple
- Documentation is thorough and actionable

**Risks Addressed**:
- ⚠ Schema changes post-implementation: Addressed with detailed design review
- ⚠ Native SQLite build issues: Noted for Day 3 (sql.js fallback ready)
- ⚠ Configuration complexity: Limited to 11 core settings, extensible design

### Day 3 Readiness

✅ All prerequisite design work complete  
✅ No blocking issues identified  
✅ Ready to proceed with Day 3 tasks:
- S1.2.2 continued: Migration implementation
- S1.2.3 continued: StorageManager skeleton
- S1.2.4: Install SQLite dependencies (risky native build)
- S1.3.2: ConfigManager implementation

### Notes

- Schema is solid; major design decisions locked
- Week 2 will implement StorageManager with >80% test coverage
- Migration system foundation ready; implementation in Week 2
- Configuration API ready for Week 2 ConfigManager implementation
- Day 3 will focus on dependency setup and risk mitigation

---

## Week 1 Overall Progress

### Sprint 1 Completion Status

| Task | Day 1 | Day 2 | Day 3 | Status |
|------|-------|-------|-------|--------|
| S1.1: Project Init | ✅ | ✅ | → | 100% |
| S1.2: Schema Design | → | ✅ | → | 70% |
| S1.2: StorageManager | → | ✅ | → | 70% |
| S1.3: Config Schema | → | ✅ | → | 70% |
| Dependency Setup | → | → | → | 0% |
| Implementation | → | → | → | 0% |

**Definition of Done** (by EOD Friday):
- [ ] Extension boots without error
- [ ] SQLite initialized and healthy
- [ ] StorageManager tests >80% coverage
- [ ] ConfigManager reads/writes settings
- [ ] All changes committed to main

### Architecture Confidence

**Design Quality**: 🟢 High
**Ready for Implementation**: 🟢 Yes
**Risk Level**: 🟡 Medium (SQLite native build on Day 3)

---

**Next Steps**: Day 3 - Architecture design completion + dependency setup

Generated: 2026-04-23  
Updated: 2026-04-23 (Day 2 complete)
```

**Save this file** and commit it.

---

**🎉 Day 2 Complete!**

## Summary of Accomplishments

✅ **Morning (09:00-12:00)**:
1. Project validation (S1.1.7) - Extension fully functional
2. Database schema design (S1.2.1 CRITICAL) - 8 tables, 3NF, 13 indexes

✅ **Afternoon (13:00-17:00)**:
3. Migration system architecture (S1.2.2) - Versioning strategy, MigrationManager interface
4. StorageManager interface design (S1.2.3) - 30+ methods, full TypeScript types
5. Configuration schema design (S1.3.1) - 11 settings in package.json

✅ **Deliverables**:
- schema.sql (400+ lines)
- 10 major documentation files (1200+ lines)
- StorageManager interface (30+ methods)
- MigrationManager interface (6 methods)
- Configuration schema (11 settings)
- All committed with v0.2.0-day2 tag

✅ **Quality**:
- Database: 3NF normalized, all constraints documented
- API: Full TypeScript typing, complete coverage
- Documentation: Clear examples, rationale, future roadmap

✅ **Ready for**:
- Day 3: Dependency setup + risk mitigation
- Week 2: StorageManager implementation + tests
- Week 3+: Integration with ingestion pipeline

---

**End Date**: Tuesday, 2026-04-23, 17:00  
**Total Duration**: 8 hours  
**Status**: ✅ COMPLETE - All Day 2 deliverables met

Proceed to **Day 3 Guide** for dependency setup and risk mitigation.

