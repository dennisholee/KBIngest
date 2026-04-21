# Day 2 Morning Session Plan (09:00–12:00)
**Tuesday, Sprint 1 - Database Schema Design Focus**

**Status**: Day 1 ✅ Complete | Day 2 🟡 Session 1 Active  
**Goal**: Validate Day 1 scaffold, design database schema, document schema  
**Deliverables**: schema.sql, SCHEMA_DESIGN.md, ERD diagram, StorageManager interface spec

---

## ⏰ Time Blocks & Tasks

### BLOCK 1: Project Validation (09:00–10:00 / 1 hour)

**Task**: Verify Day 1 completion and project health

#### [09:00–09:20] Pre-Start Checklist (20 min)

```bash
cd ~/Devs/KBIngest/extension/kb-extension

# 1. Verify git status
git log --oneline | head -5
# Expected: Multiple commits including "Initial commit" + "Day 1" commits

# 2. Verify current tag
git describe --tags
# Expected: v0.1.0-day1-complete (or similar)

# 3. Verify TypeScript compilation
npm run compile
# Expected: Completion in <5 seconds, no errors

# 4. Verify tests pass
npm test
# Expected: ✓ All tests passing

# 5. Check project structure
tree -L 2 -I 'node_modules|dist'
```

**Expected Output Structure**:
```
kb-extension/
├── .git/
├── .vscode/
│   ├── launch.json
│   └── tasks.json
├── src/
│   ├── extension.ts
│   ├── extension.d.ts        ← (Generated if type declarations enabled)
│   └── test/
│       └── extension.test.ts
├── dist/
│   ├── extension.js
│   ├── extension.js.map
│   └── extension.d.ts
├── docs/                      ← (Create if not exists)
├── package.json
├── tsconfig.json
├── jest.config.js
├── CHANGELOG.md
├── CONTRIBUTING.md
├── README.md
└── .gitignore
```

**Acceptance Criteria**:
- [ ] `.git/` exists with ≥2 commits
- [ ] Tag `v0.1.0-day1-complete` present
- [ ] `npm run compile` succeeds <5 seconds
- [ ] `npm test` shows ✓ passing
- [ ] No TypeScript errors

---

#### [09:20–09:40] Debug Session Verification (20 min)

Ensure the extension can launch and run in VS Code debug mode.

```bash
# In VS Code terminal (Ctrl+`)
npm run watch &

# In VS Code, press F5 to launch debug session
# (A new VS Code window opens with debug instance)
```

**Verification Checklist in Debug Window**:
- [ ] Extension loads without errors
- [ ] Debug Console shows: `'Congratulations, your extension "kb-extension" is now active!'`
- [ ] No red errors in Debug Console
- [ ] Command palette (Cmd+Shift+P) shows `Hello World` command available

**Stop Debug**: Shift+F5

**Acceptance Criteria**:
- [ ] Extension activates successfully
- [ ] No console errors
- [ ] Command is callable

---

#### [09:40–10:00] Environment Setup (20 min)

Create documentation directories and initialize Git substructure for Day 2 work.

```bash
# Create docs directory
mkdir -p docs

# Create src subdirectories for storage layer
mkdir -p src/storage
mkdir -p src/config
mkdir -p src/types
mkdir -p src/test/fixtures

# Verify structure
tree -L 3 -I 'node_modules' src/ docs/
```

**Create initial file stubs** (content added in later blocks):

```bash
# Create files (empty for now)
touch docs/SCHEMA_DESIGN.md
touch docs/schema_erd.txt
touch src/storage/StorageManager.ts
touch src/storage/schema.sql
touch src/config/ConfigManager.ts
touch src/types/index.ts
touch src/test/storage.test.ts
touch src/test/config.test.ts
```

**Verification**:
```bash
ls -la src/storage/
ls -la docs/
```

**Expected**: All 8 files created.

---

### BLOCK 2: Database Schema Design (10:00–12:00 / 2 hours) 🔴 CRITICAL PATH

**Task**: Design and document complete database schema

---

#### [10:00–10:30] Phase 1: Entity & Relationship Documentation (30 min)

**File**: `docs/SCHEMA_DESIGN.md`

Create comprehensive schema documentation:

```markdown
# Database Schema Design Document
**Version**: 1.0  
**Date**: [Today]  
**Status**: Design Phase  
**Last Updated**: [Today]

---

## Overview

This document describes the SQLite schema for KB Extension. The schema stores:
- **Documents**: Source files/content ingested by the user
- **Chunks**: Logical divisions of documents (e.g., paragraphs)
- **Vectors**: Embeddings for semantic search
- **Tags**: User-created labels for organization
- **Collections**: Folders/groupings for hierarchical organization

**Design Principles**:
- ✅ 3NF (Third Normal Form) - eliminates redundancy
- ✅ Immutable IDs (UUIDs) - stable references
- ✅ Timestamped records - audit trail
- ✅ Flexible metadata (JSON) - extensibility
- ✅ Foreign keys + cascading deletes - referential integrity

---

## Entity Definitions

### 1. DOCUMENTS Table

**Purpose**: Track ingested files and content sources

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `name` | TEXT | NOT NULL | Display name (user-facing) |
| `type` | TEXT | NOT NULL | One of: 'markdown', 'plaintext', 'pdf' |
| `source_path` | TEXT | NULL | Original file path (if from file system) |
| `size_bytes` | INTEGER | NOT NULL | File size for UI display |
| `hash` | TEXT | UNIQUE NOT NULL | SHA-256; prevents duplicate ingestion |
| `token_count` | INTEGER | NULL | Total tokens (for API budgeting) |
| `created_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | When added to KB |
| `updated_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last modification |
| `metadata` | TEXT | NULL | JSON object for extensibility |

**Rationale**:
- UUID ensures uniqueness across all instances
- `hash` prevents re-ingesting same file
- `type` enables document-type-specific rendering
- `token_count` supports batch API operations (e.g., embedding requests)
- `metadata` JSON allows future fields without schema migration

**Example**:
```json
{
  "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "name": "Meeting Notes - Jan 15, 2024",
  "type": "markdown",
  "source_path": "/Users/alice/Documents/notes.md",
  "size_bytes": 5432,
  "hash": "sha256:abc123def456...",
  "token_count": 1250,
  "created_date": "2024-01-15T10:30:00Z",
  "updated_date": "2024-01-15T10:30:00Z",
  "metadata": { "author": "Alice", "project": "Project Alpha" }
}
```

---

### 2. CHUNKS Table

**Purpose**: Store logical text segments for chunking/searching

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `document_id` | TEXT | NOT NULL, FK → documents(id) | Parent document |
| `sequence` | INTEGER | NOT NULL | Order (1, 2, 3, ...) within document |
| `text` | TEXT | NOT NULL | Actual chunk content |
| `token_count` | INTEGER | NOT NULL | Token count for this chunk |
| `created_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | When created |

**Constraints**:
- Foreign key: `document_id` references `documents(id)` with CASCADE DELETE
- Index on: `document_id, sequence` (fast document retrieval in order)

**Rationale**:
- One document can have many chunks (1:N relationship)
- `sequence` preserves document structure for reassembly
- `token_count` enables batch embedding (sum all chunks, check API limits)
- CASCADE DELETE ensures chunks removed when document deleted

**Example**:
```json
{
  "id": "e56a7f1b-40dd-4e2e-8d3f-1e8c9d2b4a6c",
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "sequence": 1,
  "text": "This is the first paragraph of the document. It contains important context.",
  "token_count": 28,
  "created_date": "2024-01-15T10:30:05Z"
}
```

---

### 3. VECTORS Table

**Purpose**: Store embeddings for semantic search

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `chunk_id` | TEXT | NOT NULL, FK → chunks(id), UNIQUE | One embedding per chunk |
| `embedding` | TEXT | NOT NULL | JSON array of floats |
| `model_name` | TEXT | NOT NULL | Model ID (e.g., 'all-MiniLM-L6-v2') |
| `dimension` | INTEGER | NOT NULL | Vector dimension (384 or 1536) |
| `created_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | When generated |

**Constraints**:
- Foreign key: `chunk_id` references `chunks(id)` with CASCADE DELETE
- UNIQUE on `chunk_id`: Ensures 1:1 relationship

**Rationale**:
- One vector per chunk (1:1 relationship via UNIQUE FK)
- `model_name` enables future re-embedding with different models
- `dimension` documents vector size for client applications
- Stored as JSON for flexibility (avoid binary dependency)

**Example**:
```json
{
  "id": "a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6",
  "chunk_id": "e56a7f1b-40dd-4e2e-8d3f-1e8c9d2b4a6c",
  "embedding": "[0.123, 0.456, 0.789, ..., 0.999]",  // 384 values for MiniLM
  "model_name": "all-MiniLM-L6-v2",
  "dimension": 384,
  "created_date": "2024-01-15T10:30:10Z"
}
```

---

### 4. TAGS Table

**Purpose**: Store user-defined labels for organization

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `name` | TEXT | UNIQUE NOT NULL | Tag name (case-sensitive) |
| `color` | TEXT | NULL | Optional hex color (#RRGGBB) |
| `description` | TEXT | NULL | Optional meaning/purpose |
| `created_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | When created |

**Constraints**:
- UNIQUE on `name`: Prevents duplicate tags

**Rationale**:
- Flat tagging (no hierarchy) for flexibility
- `color` enables UI visual grouping
- `description` documents tag purpose for future team use

**Example**:
```json
{
  "id": "p7q8r9s0-t1u2-43v4-w5x6-y7z8a9b0c1d2",
  "name": "urgent",
  "color": "#FF0000",
  "description": "High-priority items requiring immediate action",
  "created_date": "2024-01-15T09:00:00Z"
}
```

---

### 5. DOCUMENT_TAGS Table (Junction)

**Purpose**: Many-to-many relationship between Documents and Tags

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `document_id` | TEXT | NOT NULL, FK → documents(id) | Document reference |
| `tag_id` | TEXT | NOT NULL, FK → tags(id) | Tag reference |
| `added_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | When assigned |
| `PRIMARY KEY` | - | (document_id, tag_id) | Composite key prevents duplicates |

**Constraints**:
- FK on `document_id`: CASCADE DELETE (remove tags when document deleted)
- FK on `tag_id`: SET NULL or CASCADE (depends on business rule)
- Composite PK: Prevents same tag assigned twice to same document

**Rationale**:
- N:N relationship: Document can have many tags, tag can apply to many documents
- Junction table enforces integrity
- `added_date` provides audit trail for when tag was applied

**Example**:
```json
{
  "document_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "tag_id": "p7q8r9s0-t1u2-43v4-w5x6-y7z8a9b0c1d2",
  "added_date": "2024-01-15T10:35:00Z"
}
```

---

### 6. COLLECTIONS Table

**Purpose**: Store hierarchical groupings (folders)

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | TEXT | PRIMARY KEY | UUID v4 |
| `name` | TEXT | UNIQUE NOT NULL | Collection name |
| `description` | TEXT | NULL | Collection purpose |
| `color` | TEXT | NULL | Optional hex color |
| `created_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | When created |
| `updated_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | Last modification |

**Constraints**:
- UNIQUE on `name`: Prevents duplicate collections

**Rationale**:
- Complements tags with hierarchical organization
- `description` explains collection purpose
- `color` visual grouping in UI

**Example**:
```json
{
  "id": "m1n2o3p4-q5r6-47s8-t9u0-v1w2x3y4z5a6",
  "name": "Project Alpha - Research",
  "description": "Collected research and notes for Project Alpha",
  "color": "#0066CC",
  "created_date": "2024-01-10T14:00:00Z",
  "updated_date": "2024-01-15T16:00:00Z"
}
```

---

### 7. DOCUMENT_COLLECTIONS Table (Junction)

**Purpose**: Many-to-many relationship between Documents and Collections

**Columns**:
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `document_id` | TEXT | NOT NULL, FK → documents(id) | Document reference |
| `collection_id` | TEXT | NOT NULL, FK → collections(id) | Collection reference |
| `added_date` | DATETIME | NOT NULL DEFAULT CURRENT_TIMESTAMP | When added |
| `PRIMARY KEY` | - | (document_id, collection_id) | Composite key |

**Rationale**:
- N:N: Document can be in multiple collections
- `added_date` audit trail

---

## Relationships & Cardinality

```
┌─────────────────────────────────────────────────────────────────┐
│                       DOCUMENTS (1)                             │
│  id, name, type, source_path, size_bytes, hash, token_count...  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
         ┌─────────────┼─────────────┬──────────────┐
         │             │             │              │
   (1)   │ N:1         │ (1)         │ (1)          │ (1)
   ───   │             │ ───         │ ───          │ ───
         ▼             ▼ (N)         ▼ (N)          ▼ (N)
  ┌────────────┐  ┌──────────────┐  ┌───────────────────┐
  │  CHUNKS    │  │ DOC_TAGS     │  │  DOC_COLLECTIONS  │
  │ (N:1)      │  │ (Junction)   │  │  (Junction)       │
  └────────────┘  ├──────────────┤  ├───────────────────┤
         ▲        │ document_id  │  │ document_id       │
         │ (1)    │ tag_id ──┐   │  │ collection_id ──┐ │
         │ ───    └──────────┼───┘  └──────────────┼──┘ │
         │ (N)               │                     │     │
  ┌──────┴──────┐      ┌─────▼────────┐    ┌──────┴────────┐
  │  VECTORS    │      │   TAGS       │    │ COLLECTIONS   │
  │ (1:1 FK)    │      │ (1:N via JT) │    │ (1:N via JT)  │
  └─────────────┘      └──────────────┘    └───────────────┘
```

**Relationship Summary**:
- Document (1) ──→ (N) Chunks: Cascade delete
- Document (1) ──→ (N) Tags: Via junction table
- Document (1) ──→ (N) Collections: Via junction table
- Chunk (1) ──→ (1) Vector: UNIQUE FK, cascade delete
- Tag (1) ──→ (N) Documents: Via junction table
- Collection (1) ──→ (N) Documents: Via junction table

---

## Normalization: 3NF Analysis

**1NF (First Normal Form)**: Atomic values only
- ✅ All columns contain single atomic values
- ✅ `embedding` stored as JSON string (not array type)
- ✅ `metadata` stored as JSON string (not nested objects)

**2NF (Second Normal Form)**: No partial dependencies
- ✅ Every non-key attribute depends on **full primary key**
- ✅ Example: In DOCUMENT_TAGS, `added_date` depends on (document_id, tag_id), not just one

**3NF (Third Normal Form)**: No transitive dependencies
- ✅ No non-key attribute depends on another non-key attribute
- ✅ Example: In DOCUMENTS, `hash` depends directly on `id`, not through another column

**Conclusion**: ✅ Schema is 3NF-compliant, eliminates redundancy

---

## Indexing Strategy

**Purpose**: Accelerate common queries without excessive storage overhead

**Indexes**:

| Table | Column(s) | Type | Reason |
|-------|-----------|------|--------|
| documents | `id` | PRIMARY | Implicit (auto-indexed) |
| documents | `hash` | UNIQUE | Deduplication check: `WHERE hash = ?` |
| documents | `created_date` | INDEX | Sorting/filtering: `ORDER BY created_date DESC` |
| chunks | `document_id` | INDEX | Retrieve all chunks: `WHERE document_id = ?` |
| chunks | `(document_id, sequence)` | COMPOSITE | Retrieve ordered chunks efficiently |
| vectors | `chunk_id` | PRIMARY + UNIQUE | Implicit (auto-indexed) |
| vectors | `model_name` | INDEX | Filter by model: `WHERE model_name = ?` |
| tags | `name` | UNIQUE | Lookup: `WHERE name = ?` |
| document_tags | `document_id` | INDEX | All tags for document |
| document_tags | `tag_id` | INDEX | All documents with tag |
| document_collections | `document_id` | INDEX | All collections for document |
| document_collections | `collection_id` | INDEX | All documents in collection |

**Storage Cost**: ~2-3% overhead; **Query speedup**: 10-100x for common operations

---

## Constraints Summary

**Uniqueness**:
- `documents.hash` – UNIQUE (prevent duplicate ingestion)
- `tags.name` – UNIQUE (prevent duplicate tags)
- `collections.name` – UNIQUE (prevent duplicate collections)
- `vectors.chunk_id` – UNIQUE (1:1 with chunks)

**Foreign Keys** (with cascade delete):
- `chunks.document_id` → `documents.id` (ON DELETE CASCADE)
- `vectors.chunk_id` → `chunks.id` (ON DELETE CASCADE)
- `document_tags.document_id` → `documents.id` (ON DELETE CASCADE)
- `document_tags.tag_id` → `tags.id` (ON DELETE CASCADE)
- `document_collections.document_id` → `documents.id` (ON DELETE CASCADE)
- `document_collections.collection_id` → `collections.id` (ON DELETE CASCADE)

**Check Constraints** (future, if needed):
- `documents.type` IN ('markdown', 'plaintext', 'pdf')
- `vectors.dimension` > 0

---

## Future Extensions (Non-Breaking)

These can be added in v1.1+ without schema rework:

| Feature | Table | Change | Migration |
|---------|-------|--------|-----------|
| Full-text search | (create `chunks_fts` virtual table) | Add FTS5 table | Non-breaking |
| Search history | (new table) | Create search_history | Non-breaking |
| Annotations | (new table) | Create annotations | Non-breaking |
| Relationships | (new junction table) | Create document_links | Non-breaking |

---

## Summary

**Total Tables**: 7 (including 2 junction tables)  
**Total Indexes**: ~12  
**Storage Overhead**: ~2-3% for indexes  
**Complexity**: Low (no recursive structures, simple N:N only)  
**Scalability**: ✅ Handles 1K documents, 10K chunks, 100K vectors comfortably on local SQLite

This schema is **production-ready for MVP** and extensible for future features.
```

**Save location**: `docs/SCHEMA_DESIGN.md`

---

#### [10:30–11:15] Phase 2: Write SQL DDL (45 min)

**File**: `src/storage/schema.sql`

Create complete SQL schema with all tables, indexes, and constraints:

```sql
-- KB Extension Schema v1.0
-- SQLite Database Schema for Knowledge Base Storage
-- Created: [Today]
-- Last Updated: [Today]

-- Enable foreign keys (must be done on connection)
PRAGMA foreign_keys = ON;

-- ==============================================================================
-- TABLE: DOCUMENTS
-- Purpose: Track ingested files and content sources
-- ==============================================================================
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('markdown', 'plaintext', 'pdf')),
  source_path TEXT,
  size_bytes INTEGER NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  token_count INTEGER,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  metadata TEXT  -- JSON object for extensibility
);

-- Index on hash for deduplication checks
CREATE UNIQUE INDEX idx_documents_hash ON documents(hash);

-- Index on created_date for sorting
CREATE INDEX idx_documents_created_date ON documents(created_date DESC);

-- ==============================================================================
-- TABLE: CHUNKS
-- Purpose: Logical text segments for chunking/searching
-- ==============================================================================
CREATE TABLE chunks (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL,
  sequence INTEGER NOT NULL,
  text TEXT NOT NULL,
  token_count INTEGER NOT NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint with cascade delete
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  
  -- Ensure sequence is unique per document (maintain order)
  UNIQUE (document_id, sequence)
);

-- Index for fast lookup by document
CREATE INDEX idx_chunks_document_id ON chunks(document_id);

-- Composite index for retrieving ordered chunks
CREATE INDEX idx_chunks_document_sequence ON chunks(document_id, sequence);

-- ==============================================================================
-- TABLE: VECTORS
-- Purpose: Embeddings for semantic search
-- ==============================================================================
CREATE TABLE vectors (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL UNIQUE,
  embedding TEXT NOT NULL,  -- JSON array of floats
  model_name TEXT NOT NULL,
  dimension INTEGER NOT NULL,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Foreign key constraint with cascade delete
  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
);

-- Index on model_name for filtering
CREATE INDEX idx_vectors_model_name ON vectors(model_name);

-- ==============================================================================
-- TABLE: TAGS
-- Purpose: User-defined labels for organization
-- ==============================================================================
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  color TEXT,  -- Hex color: #RRGGBB
  description TEXT,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on name for fast lookup
CREATE UNIQUE INDEX idx_tags_name ON tags(name);

-- ==============================================================================
-- TABLE: DOCUMENT_TAGS (Junction)
-- Purpose: Many-to-many relationship between documents and tags
-- ==============================================================================
CREATE TABLE document_tags (
  document_id TEXT NOT NULL,
  tag_id TEXT NOT NULL,
  added_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Composite primary key prevents duplicate assignments
  PRIMARY KEY (document_id, tag_id),
  
  -- Foreign key constraints
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Indexes for fast reverse lookups
CREATE INDEX idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag_id ON document_tags(tag_id);

-- ==============================================================================
-- TABLE: COLLECTIONS
-- Purpose: Hierarchical groupings (folders)
-- ==============================================================================
CREATE TABLE collections (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT,  -- Hex color: #RRGGBB
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Index on name for fast lookup
CREATE UNIQUE INDEX idx_collections_name ON collections(name);

-- ==============================================================================
-- TABLE: DOCUMENT_COLLECTIONS (Junction)
-- Purpose: Many-to-many relationship between documents and collections
-- ==============================================================================
CREATE TABLE document_collections (
  document_id TEXT NOT NULL,
  collection_id TEXT NOT NULL,
  added_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Composite primary key
  PRIMARY KEY (document_id, collection_id),
  
  -- Foreign key constraints
  FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
  FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE
);

-- Indexes for fast reverse lookups
CREATE INDEX idx_document_collections_document_id ON document_collections(document_id);
CREATE INDEX idx_document_collections_collection_id ON document_collections(collection_id);

-- ==============================================================================
-- VIEWS (Optional, for convenience)
-- ==============================================================================

-- View: All document information with chunk and tag counts
CREATE VIEW document_stats AS
SELECT 
  d.id,
  d.name,
  d.type,
  COUNT(DISTINCT c.id) as chunk_count,
  COALESCE(SUM(c.token_count), 0) as total_tokens,
  COUNT(DISTINCT dt.tag_id) as tag_count,
  d.created_date,
  d.updated_date
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
LEFT JOIN document_tags dt ON d.id = dt.document_id
GROUP BY d.id;

-- View: All chunks with vector status
CREATE VIEW chunk_vectors AS
SELECT 
  c.id,
  c.document_id,
  c.sequence,
  c.text,
  c.token_count,
  CASE WHEN v.id IS NOT NULL THEN 1 ELSE 0 END as has_vector,
  v.model_name,
  v.dimension,
  c.created_date
FROM chunks c
LEFT JOIN vectors v ON c.id = v.chunk_id;

-- ==============================================================================
-- SCHEMA VERSION (For migrations)
-- ==============================================================================
CREATE TABLE schema_version (
  version INTEGER PRIMARY KEY,
  description TEXT NOT NULL,
  applied_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO schema_version (version, description) VALUES
(1, 'Initial schema: documents, chunks, vectors, tags, collections, junctions');
```

**Save location**: `src/storage/schema.sql`

**Verification**:
```bash
# Check syntax (dry run)
sqlite3 :memory: < src/storage/schema.sql
# Expected: No errors
```

---

#### [11:15–12:00] Phase 3: Create ERD Diagrams & Documentation (45 min)

**File 1**: `docs/schema_erd.txt` - ASCII Entity-Relationship Diagram

```
ENTITY-RELATIONSHIP DIAGRAM (Text Format)
==========================================

┌─────────────────────────────────────────┐
│         DOCUMENTS (1 side)              │
├─────────────────────────────────────────┤
│ • id (PK, UUID)                         │
│ • name (TEXT NOT NULL)                  │
│ • type (TEXT, CHECK: markdown|...)      │
│ • source_path (TEXT)                    │
│ • size_bytes (INTEGER NOT NULL)         │
│ • hash (TEXT, UNIQUE NOT NULL)          │
│ • token_count (INTEGER)                 │
│ • created_date (DATETIME)               │
│ • updated_date (DATETIME)               │
│ • metadata (TEXT, JSON)                 │
└──────────┬──────────────────────────────┘
           │ 1
     ┌─────┴──────────────┬────────────────┬────────────────┐
     │ (many)             │ (many)          │ (many)         │
     │ 1:N                │ N:N             │ N:N            │
     ▼ N                  ▼ N               ▼ N              │
┌─────────────────┐ ┌──────────────────┐  ┌─────────────────────┐
│   CHUNKS        │ │ DOCUMENT_TAGS    │  │ DOC_COLLECTIONS     │
│   (N side)      │ │ (Junction Table) │  │ (Junction Table)    │
├─────────────────┤ ├──────────────────┤  ├─────────────────────┤
│ • id (PK)       │ │ ┌─ doc_id (FK) ──┼──┤ ┌─ doc_id (FK) ─────┤
│ • doc_id (FK) ◄─┤ │                  │  │ │                   │
│ • sequence      │ │ ┌─ tag_id (FK) ──┼──┤ │ ┌─ coll_id (FK) ───┤
│ • text          │ │ │                │  │ │ │                  │
│ • token_count   │ │ └─ added_date    │  │ │ └─ added_date      │
│ • created_date  │ │ └─ PK:(doc,tag)  │  │ │ └─ PK:(doc,coll)   │
└────────┬────────┘ └──────▲───────────┘  └────────▲─────────────┘
         │ 1                │ (many)               │ (many)
         │ ──               │                      │
         │ (1)              │ (1)                  │ (1)
         │ 1:1              ▼ N                    ▼ N
         │              ┌──────────────┐      ┌──────────────────┐
         │              │   TAGS       │      │  COLLECTIONS     │
         ▼              │              │      │                  │
    ┌─────────┐         ├──────────────┤      ├──────────────────┤
    │ VECTORS │         │ • id (PK)    │      │ • id (PK)        │
    ├─────────┤         │ • name UNIQ  │      │ • name UNIQ      │
    │ • id    │         │ • color      │      │ • description    │
    │ • chunk_│         │ • description│      │ • color          │
    │  id (FK │         │ • created    │      │ • created_date   │
    │  UNIQUE)│         │ • updated    │      │ • updated_date   │
    │ • embed │         └──────────────┘      └──────────────────┘
    │ • model │
    │ • dim   │
    │ • create│
    └─────────┘

CARDINALITY SUMMARY:
═══════════════════════════════════════════════════════════════════════
Relationship              │ Card. │ Type    │ Delete Behavior
───────────────────────────────────────────────────────────────────────
Document → Chunks        │ 1:N   │ FK      │ CASCADE DELETE
Document → Tags          │ N:N   │ Junction│ CASCADE DELETE both sides
Document → Collections   │ N:N   │ Junction│ CASCADE DELETE both sides
Chunk → Vector           │ 1:1   │ UNIQUE  │ CASCADE DELETE
Tag ← Documents          │ N:N   │ Junction│ CASCADE DELETE both sides
Collection ← Documents   │ N:N   │ Junction│ CASCADE DELETE both sides
═══════════════════════════════════════════════════════════════════════

INDEX SUMMARY:
═══════════════════════════════════════════════════════════════════════
Table                    │ Columns              │ Type    │ Purpose
───────────────────────────────────────────────────────────────────────
documents                │ id                   │ PRIMARY │ Key lookup
documents                │ hash                 │ UNIQUE  │ Deduplication
documents                │ created_date DESC    │ INDEX   │ Sort by date
chunks                   │ document_id          │ INDEX   │ Get all chunks
chunks                   │ (doc_id, sequence)   │ COMPOSITE│ Ordered chunks
vectors                  │ chunk_id             │ UNIQUE  │ 1:1 relationship
vectors                  │ model_name           │ INDEX   │ Filter by model
tags                     │ name                 │ UNIQUE  │ Lookup by name
document_tags            │ document_id          │ INDEX   │ Tags per doc
document_tags            │ tag_id               │ INDEX   │ Docs per tag
document_collections     │ document_id          │ INDEX   │ Colls per doc
document_collections     │ collection_id        │ INDEX   │ Docs per coll
═══════════════════════════════════════════════════════════════════════

NORMALIZATION: ✅ 3NF Compliant
─ 1NF: All values atomic (no arrays in columns)
─ 2NF: No partial dependencies on keys
─ 3NF: No transitive dependencies between non-keys
─ Result: Minimal redundancy, efficient queries
```

**Save location**: `docs/schema_erd.txt`

---

**File 2**: `docs/SCHEMA_MIGRATION_STRATEGY.md` - Migration planning for future changes

```markdown
# Schema Migration Strategy

## Version 1.0 (Current)
- Base schema with 7 tables, 12 indexes
- Supports documents, chunks, vectors, tags, collections
- Audit trail via timestamps

## Future Upgrades (Non-Breaking)

### v1.1: Full-Text Search Support
```sql
-- Create virtual FTS5 table
CREATE VIRTUAL TABLE chunks_fts USING fts5(
  chunk_id UNINDEXED,
  text
);

-- Populate with existing data
INSERT INTO chunks_fts (chunk_id, text) SELECT id, text FROM chunks;
```
**Migration Type**: Additive (existing schema unchanged)

### v1.2: Search History Tracking
```sql
CREATE TABLE search_history (
  id TEXT PRIMARY KEY,
  query TEXT NOT NULL,
  search_type TEXT, -- 'full-text', 'semantic'
  results_count INTEGER,
  execution_time_ms INTEGER,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```
**Migration Type**: Additive

### v1.3: Annotations
```sql
CREATE TABLE annotations (
  id TEXT PRIMARY KEY,
  chunk_id TEXT NOT NULL,
  content TEXT NOT NULL,
  user_note TEXT,
  created_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (chunk_id) REFERENCES chunks(id) ON DELETE CASCADE
);
```
**Migration Type**: Additive

## Migration Execution Pattern

All migrations follow this pattern:

1. **Read** current `schema_version` table
2. **Determine** target version
3. **Validate** compatibility (forward migrations only)
4. **Execute** migration script with error handling
5. **Update** `schema_version` table
6. **Test** with sample data

```typescript
// Example migration runner
async function migrateSchema(db: Database, targetVersion: number) {
  const currentVersion = await getCurrentSchemaVersion(db);
  
  if (currentVersion >= targetVersion) {
    return; // Already at target or newer
  }
  
  const migrations = [
    { version: 1, up: () => { /* v1.0 creation */ } },
    { version: 2, up: () => { /* v1.1 migration */ } },
    { version: 3, up: () => { /* v1.2 migration */ } },
  ];
  
  for (const migration of migrations) {
    if (migration.version > currentVersion && migration.version <= targetVersion) {
      await migration.up();
      await recordMigration(db, migration.version);
    }
  }
}
```

## Rollback Strategy

For critical issues:
1. Take backup of database file
2. Restore backup
3. Skip failed migration in code
4. Fix issue in migration script
5. Re-run migration

**Best Practice**: Always backup before migrations (Day 2 backups in `.vscode` settings)

```
```

**Save location**: `docs/SCHEMA_MIGRATION_STRATEGY.md`

---

**Final Task: Commit Schema Documentation**

```bash
cd ~/Devs/KBIngest/extension/kb-extension

# Stage all documentation and DDL
git add docs/SCHEMA_DESIGN.md docs/schema_erd.txt docs/SCHEMA_MIGRATION_STRATEGY.md src/storage/schema.sql

# Commit with clear message
git commit -m "Day 2: Database schema design documentation and DDL

- SCHEMA_DESIGN.md: Complete entity definitions, 3NF analysis, indexing strategy
- schema_erd.txt: ASCII ERD with cardinality and constraints
- schema.sql: Production-ready DDL with all tables and indexes
- SCHEMA_MIGRATION_STRATEGY.md: Path for future non-breaking migrations

Schema Features:
- 7 tables: documents, chunks, vectors, tags, collections, 2 junctions
- 12 indexes optimized for common queries
- 3NF normalized, cascade delete for referential integrity
- UUID immutable IDs, SHA-256 deduplication, JSON extensibility
- 100% suitable for MVP (handles 1K docs, 10K chunks locally)

Tested via: sqlite3 :memory: < schema.sql (no errors)
Status: Ready for StorageManager implementation (Day 2 Afternoon)"

# Verify commit
git log --oneline -3
# Expected: Your schema commit + Day 1 commits
```

---

## ✅ Morning Session Checklist

By 12:00 (lunch), you should have:

- [ ] **S1.1.7 Complete**: Day 1 project validated, extension loads in debug mode
- [ ] **S1.2.1 Phase 1 Complete**: `SCHEMA_DESIGN.md` with 7 entity definitions, cardinality, normalization analysis
- [ ] **S1.2.1 Phase 2 Complete**: `src/storage/schema.sql` with DDL, indexes, constraints (tested with sqlite3)
- [ ] **S1.2.1 Phase 3 Complete**: `schema_erd.txt` ASCII diagrams, `SCHEMA_MIGRATION_STRATEGY.md` planning docs
- [ ] **Git Commit**: Schema design committed with clear message
- [ ] **File Structure**: `docs/` and `src/storage/` populated with schema artifacts

**Success Metrics**:
- ✅ Extension boots in debug mode (F5)
- ✅ Schema documentation is comprehensive and reviewed twice
- ✅ DDL has no syntax errors
- ✅ 1 clean Git commit capturing morning work
- ✅ Ready to start StorageManager implementation after lunch

---

## 🎯 Next: Afternoon Session

**13:00–17:00**: 
1. S1.2.2: Design StorageManager interface
2. S1.2.3: Migration system planning
3. S1.3.1: ConfigManager interface design
4. Testing foundation setup
5. 2+ more Git commits

**See**: DAY_2_AFTERNOON_SESSION_PLAN.md for detailed tasks
