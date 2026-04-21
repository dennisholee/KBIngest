# KB Extension Schema - Quick Reference

**For**: Developers implementing StorageManager and ingestion services  
**Version**: 1.0  
**Updated**: April 19, 2026

---

## Quick Schema Overview

```sql
-- 7 Core Tables (normalized, 3NF)
documents           -- File metadata & index
├─ chunks          -- Text segments (1:N relationship)
│  └─ vectors      -- Embeddings (1:1 unique)
└─ tags ↔ document_tags (M:M)

collections ↔ document_collections (M:M)
ingestion_status    -- Import tracking
schema_version      -- Migrations
```

---

## Table Reference

### `documents`
**Purpose**: Store file metadata  
**Primary Use**: Find documents, check deduplication

```sql
-- Create
INSERT INTO documents (id, name, type, size_bytes, hash) 
VALUES (uuid(), 'file.md', 'markdown', 5000, 'sha256:hash');

-- Find (dedup check)
SELECT * FROM documents WHERE hash = 'sha256:hash';

-- List with stats
SELECT d.*, ds.chunk_count, ds.embedding_status
FROM documents d
LEFT JOIN document_stats ds ON d.id = ds.id
ORDER BY d.created_date DESC
LIMIT 20;
```

**Key Columns**:
- `id`: UUID (PK)
- `hash`: SHA-256 (UNIQUE - prevents duplicates)
- `type`: 'markdown' | 'plaintext' | 'pdf'
- `created_date`: Auto-set timestamp

---

### `chunks`
**Purpose**: Text segments for searching/embedding  
**Primary Use**: Store document text, retrieve in order

```sql
-- Create (batch insert)
INSERT INTO chunks (id, document_id, sequence, text, token_count)
VALUES 
  (uuid(), 'doc-1', 0, 'First chunk', 50),
  (uuid(), 'doc-1', 1, 'Second chunk', 45);

-- Retrieve all chunks of doc
SELECT * FROM chunks 
WHERE document_id = 'doc-1' 
ORDER BY sequence;

-- Get specific chunk
SELECT * FROM chunks WHERE id = 'chunk-123';
```

**Key Columns**:
- `id`: UUID (PK)
- `document_id`: FK to documents
- `sequence`: Order (UNIQUE per document)
- `text`: Full chunk content
- `token_count`: For OpenAI API estimation

**Constraints**:
- UNIQUE (document_id, sequence)
- Foreign key ON DELETE CASCADE

---

### `vectors`
**Purpose**: Embeddings for semantic search  
**Primary Use**: Store embeddings, lookup by chunk

```sql
-- Create
INSERT INTO vectors (id, chunk_id, embedding, model_name, dimension)
VALUES (uuid(), 'chunk-1', '[0.1, -0.2, 0.3, ...]', 'all-MiniLM-L6-v2', 384);

-- Retrieve (1:1 with chunk)
SELECT * FROM vectors WHERE chunk_id = 'chunk-1';

-- Get all vectors for document
SELECT v.* FROM vectors v
JOIN chunks c ON v.chunk_id = c.id
WHERE c.document_id = 'doc-1';
```

**Key Columns**:
- `id`: UUID (PK)
- `chunk_id`: FK (UNIQUE - 1:1 relationship)
- `embedding`: JSON array of floats
- `model_name`: "all-MiniLM-L6-v2" (or other model)
- `dimension`: 384 or 1536 (depends on model)

**Note**: Embedding stored as JSON string for SQLite compatibility

---

### `tags`
**Purpose**: User-defined labels  
**Primary Use**: Create, list, filter by tag

```sql
-- Create
INSERT INTO tags (id, name, color)
VALUES (uuid(), 'important', '#FF6B6B');

-- List all tags
SELECT * FROM tags ORDER BY name;

-- Get documents with tag
SELECT d.* FROM documents d
JOIN document_tags dt ON d.id = dt.document_id
WHERE dt.tag_id = 'tag-123';
```

**Key Columns**:
- `id`: UUID (PK)
- `name`: UNIQUE (enforced)
- `color`: Hex color (#RRGGBB)
- `description`: Optional explanation

---

### `collections`
**Purpose**: Organize documents into folders  
**Primary Use**: Group, filter, browse

```sql
-- Create
INSERT INTO collections (id, name, description, color)
VALUES (uuid(), 'Machine Learning', 'ML-related docs', '#4ECDC4');

-- Get all docs in collection
SELECT d.* FROM documents d
JOIN document_collections dc ON d.id = dc.document_id
WHERE dc.collection_id = 'coll-1'
ORDER BY d.created_date DESC;

-- Get docs in multiple collections
SELECT d.* FROM documents d
JOIN document_collections dc ON d.id = dc.document_id
WHERE dc.collection_id IN ('coll-1', 'coll-2')
GROUP BY d.id;
```

**Key Columns**:
- `id`: UUID (PK)
- `name`: UNIQUE (enforced)
- `description`: Optional purpose
- `color`: Hex color for UI

---

### `document_tags` (M:M Junction)
**Purpose**: Assign tags to documents  
**Primary Use**: Add/remove tags, filter by tags

```sql
-- Add tag to document
INSERT INTO document_tags (document_id, tag_id)
VALUES ('doc-1', 'tag-1');

-- Get all tags for a document
SELECT t.* FROM tags t
JOIN document_tags dt ON t.id = dt.tag_id
WHERE dt.document_id = 'doc-1';

-- Remove tag
DELETE FROM document_tags 
WHERE document_id = 'doc-1' AND tag_id = 'tag-1';

-- Find docs with specific tag
SELECT d.* FROM documents d
JOIN document_tags dt ON d.id = dt.document_id
WHERE dt.tag_id = 'tag-1';
```

**Constraint**: PRIMARY KEY (document_id, tag_id)

---

### `document_collections` (M:M Junction)
**Purpose**: Assign documents to collections  
**Primary Use**: Organize into folders

```sql
-- Add document to collection
INSERT INTO document_collections (document_id, collection_id)
VALUES ('doc-1', 'coll-1');

-- Get collections for a document
SELECT c.* FROM collections c
JOIN document_collections dc ON c.id = dc.collection_id
WHERE dc.document_id = 'doc-1';

-- Remove document from collection
DELETE FROM document_collections
WHERE document_id = 'doc-1' AND collection_id = 'coll-1';
```

---

### `ingestion_status`
**Purpose**: Track batch import operations  
**Primary Use**: Progress tracking, error recovery

```sql
-- Start import batch
INSERT INTO ingestion_status (id, batch_id, status, total_documents)
VALUES (uuid(), 'batch-123', 'pending', 50);

-- Update progress
UPDATE ingestion_status 
SET status = 'in_progress', processed_documents = 25
WHERE batch_id = 'batch-123';

-- Mark complete
UPDATE ingestion_status 
SET status = 'completed', completed_at = CURRENT_TIMESTAMP
WHERE batch_id = 'batch-123';

-- Check status
SELECT * FROM ingestion_status WHERE batch_id = 'batch-123';
```

**Status Values**: 'pending' | 'in_progress' | 'completed' | 'failed'

---

### `chunks_fts` (Full-Text Search Virtual Table)
**Purpose**: Fast semantic search on chunk content  
**Primary Use**: Search queries

```sql
-- Simple search
SELECT chunk_id, content FROM chunks_fts
WHERE content MATCH 'machine learning'
LIMIT 10;

-- Boolean search
SELECT chunk_id, content FROM chunks_fts
WHERE content MATCH '"neural network" AND training'
LIMIT 10;

-- Join with chunks for full data
SELECT c.* FROM chunks_fts fts
JOIN chunks c ON c.id = fts.chunk_id
WHERE fts.content MATCH 'query'
ORDER BY rank
LIMIT 10;
```

**Note**: Automatically synced via triggers; no manual maintenance

---

## Convenient Views

### `document_stats`
Pre-calculated statistics per document

```sql
SELECT * FROM document_stats WHERE id = 'doc-1';
-- Returns:
-- - chunk_count, total_tokens, tag_count, collection_count
-- - vector_count, embedding_status (pending/partial/complete)
```

### `chunk_vectors`
Chunk data with vector status

```sql
SELECT * FROM chunk_vectors WHERE document_id = 'doc-1';
-- Returns:
-- - All chunks with has_vector, model_name, dimension fields
```

### `collection_summary`
Collection statistics

```sql
SELECT * FROM collection_summary WHERE name = 'ML';
-- Returns:
-- - document_count, chunk_count, total_tokens
```

---

## Common Operations

### Import Document

```typescript
// Step 1: Create document
const doc = await storage.createDocument({
  name: 'learning.md',
  type: 'markdown',
  size_bytes: 5000,
  hash: sha256(content)  // Check for duplicates
});

// Step 2: Create chunks
for (let i = 0; i < chunks.length; i++) {
  await storage.createChunk({
    document_id: doc.id,
    sequence: i,
    text: chunks[i],
    token_count: tokenize(chunks[i]).length
  });
}

// Step 3: Create embeddings
for (const chunk of chunks) {
  const embedding = await embedder.embed(chunk.text);
  await storage.createVector({
    chunk_id: chunk.id,
    embedding: embedding,
    model_name: 'all-MiniLM-L6-v2',
    dimension: 384
  });
}
```

### Search Documents

```sql
-- Full-text search
SELECT c.* FROM chunks_fts fts
JOIN chunks c ON c.id = fts.chunk_id
WHERE fts.content MATCH 'neural networks'
LIMIT 10;

-- Filter by tag
SELECT DISTINCT d.* FROM documents d
JOIN document_tags dt ON d.id = dt.document_id
WHERE dt.tag_id = 'tag-1'
ORDER BY d.created_date DESC;

-- Filter by collection
SELECT d.* FROM documents d
JOIN document_collections dc ON d.id = dc.document_id
WHERE dc.collection_id = 'coll-1'
ORDER BY d.created_date DESC;
```

### Delete Document (cascades)

```sql
-- Single command cascades to all related data
DELETE FROM documents WHERE id = 'doc-1';
-- Automatically deletes:
-- - chunks (via FK CASCADE)
-- - vectors (via FK CASCADE)
-- - document_tags (via FK CASCADE)
-- - document_collections (via FK CASCADE)
```

---

## Transaction Example

```typescript
async function importBatch(documents: Document[]) {
  try {
    await storage.beginTransaction();
    
    // Create ingestion status
    const status = await storage.createIngestionStatus({
      batch_id: nanoid(),
      status: 'in_progress',
      total_documents: documents.length,
      processed_documents: 0,
      failed_documents: 0
    });
    
    // Process each document
    for (const doc of documents) {
      try {
        await storage.createDocument(doc);
        // ... create chunks, vectors, tags, etc.
        await storage.updateIngestionStatus(status.batch_id, {
          processed_documents: ++count
        });
      } catch (error) {
        await storage.updateIngestionStatus(status.batch_id, {
          failed_documents: ++failCount,
          error_message: error.message
        });
      }
    }
    
    await storage.updateIngestionStatus(status.batch_id, {
      status: 'completed'
    });
    
    await storage.commit();
  } catch (error) {
    await storage.rollback();
    throw error;
  }
}
```

---

## Performance Tips

1. **Batch Inserts** — Insert 100+ rows in single transaction
2. **Indexes** — Use indexed columns in WHERE/JOIN (automatic via schema)
3. **Views** — Use convenience views for aggregations
4. **FTS** — Use chunks_fts for text search, not LIKE
5. **Limits** — Always LIMIT results in UI queries
6. **Transactions** — Group related operations

---

## Migration Planning

**Current**: v1.0 (4/19/2026)  
**Next**: v1.1 (add caching)  
**Future**: v2.0 (Qdrant), v2.1 (versioning), v3.0 (hierarchy)

Check [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md) for details.

---

## Validation Queries

```bash
# Check schema integrity
sqlite3 data.db < docs/SCHEMA_VALIDATION.sql

# Verify foreign keys
SELECT * FROM pragma_foreign_key_check();

# Get database stats
SELECT COUNT(*) as documents FROM documents;
SELECT COUNT(*) as chunks FROM chunks;
SELECT COUNT(*) as vectors FROM vectors;
SELECT ROUND(page_count * page_size / 1024.0 / 1024.0, 2) as size_mb 
FROM pragma_page_count(), pragma_page_size();
```

---

## Troubleshooting

**Issue**: Foreign key constraint failed
- **Check**: Verify document/chunk/tag IDs exist before inserting
- **Fix**: Use `PRAGMA foreign_keys = ON;` to enable strict checking

**Issue**: Duplicate hash error
- **Check**: Hash uniqueness on documents (by design)
- **Fix**: Use existing document ID instead of creating new one

**Issue**: Chunk sequence conflict
- **Check**: (document_id, sequence) uniqueness
- **Fix**: Use next available sequence number or replace existing

**Issue**: Slow FTS queries
- **Check**: Index status with `ANALYZE;`
- **Fix**: Consider full-text search only for 100+ documents

---

## Quick Links

- **Schema Design**: [SCHEMA_DESIGN.md](./SCHEMA_DESIGN.md)
- **Validation**: [SCHEMA_VALIDATION.sql](./SCHEMA_VALIDATION.sql)
- **Migrations**: [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md)
- **Types**: [src/types/index.ts](../src/types/index.ts)
- **DDL**: [src/storage/schema.sql](../src/storage/schema.sql)

---

**Last Updated**: April 19, 2026  
**For**: KB Extension Sprint 1.2.1
