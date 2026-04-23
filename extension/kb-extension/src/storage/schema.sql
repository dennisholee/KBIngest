-- KB Extension Schema v1.0
-- SQLite Database Schema for Knowledge Base Storage
-- Entities: 7 core tables + 2 junction tables + 2 convenience views + 1 metadata table
-- Features: Cascade deletes, deduplication, indexing, full-text search, schema versioning
-- Created: April 2026
-- Last Updated: April 2026

-- ==============================================================================
-- TABLE: DOCUMENTS
-- Purpose: Knowledge base documents
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
-- TABLE: INGESTION_STATUS (Track import operations)
-- Purpose: Audit trail for batch ingestion, progress tracking, error recovery
-- ==============================================================================
CREATE TABLE ingestion_status (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL UNIQUE,  -- Groups related imports
  status TEXT NOT NULL CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  total_documents INTEGER NOT NULL,
  processed_documents INTEGER NOT NULL DEFAULT 0,
  failed_documents INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  metadata TEXT  -- JSON for additional tracking info
);

CREATE INDEX idx_ingestion_status_batch_id ON ingestion_status(batch_id);
CREATE INDEX idx_ingestion_status_status ON ingestion_status(status);

-- ==============================================================================
-- FULL-TEXT SEARCH VIRTUAL TABLES (Created after main tables)
-- ==============================================================================

-- FTS5 virtual table for semantic search on chunk content
-- NOTE: FTS5 is not supported by sql.js, so this is disabled for now
-- CREATE VIRTUAL TABLE chunks_fts USING fts5(
--   chunk_id UNINDEXED,
--   document_id UNINDEXED,
--   content,
--   tokenize = 'porter'  -- Porter stemming for better search
-- );
--
-- -- Trigger to keep FTS index in sync with chunks table (INSERT)
-- CREATE TRIGGER chunks_fts_insert AFTER INSERT ON chunks BEGIN
--   INSERT INTO chunks_fts(chunk_id, document_id, content) 
--   VALUES (new.id, new.document_id, new.text);
-- END;
--
-- -- Trigger to keep FTS index in sync with chunks table (DELETE)
-- CREATE TRIGGER chunks_fts_delete AFTER DELETE ON chunks BEGIN
--   DELETE FROM chunks_fts WHERE chunk_id = old.id;
-- END;
--
-- -- Trigger to keep FTS index in sync with chunks table (UPDATE)
-- CREATE TRIGGER chunks_fts_update AFTER UPDATE ON chunks BEGIN
--   DELETE FROM chunks_fts WHERE chunk_id = old.id;
--   INSERT INTO chunks_fts(chunk_id, document_id, content)
--   VALUES (new.id, new.document_id, new.text);
-- END;

-- ==============================================================================
-- VIEWS (For convenience and analytics)
-- ==============================================================================

-- View: Document statistics and metadata
CREATE VIEW document_stats AS
SELECT 
  d.id,
  d.name,
  d.type,
  COUNT(DISTINCT c.id) as chunk_count,
  COALESCE(SUM(c.token_count), 0) as total_tokens,
  COUNT(DISTINCT dt.tag_id) as tag_count,
  COUNT(DISTINCT dc.collection_id) as collection_count,
  COALESCE(COUNT(DISTINCT v.id), 0) as vector_count,
  CASE 
    WHEN COUNT(DISTINCT v.id) = COUNT(DISTINCT c.id) AND COUNT(DISTINCT c.id) > 0 THEN 'complete'
    WHEN COUNT(DISTINCT v.id) > 0 THEN 'partial'
    ELSE 'pending'
  END as embedding_status,
  d.created_date,
  d.updated_date
FROM documents d
LEFT JOIN chunks c ON d.id = c.document_id
LEFT JOIN document_tags dt ON d.id = dt.document_id
LEFT JOIN document_collections dc ON d.id = dc.document_id
LEFT JOIN vectors v ON c.id = v.chunk_id
GROUP BY d.id;

-- View: Chunk details with vector embeddings
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
  v.embedding,
  c.created_date
FROM chunks c
LEFT JOIN vectors v ON c.id = v.chunk_id;

-- View: Collection contents summary
CREATE VIEW collection_summary AS
SELECT 
  col.id,
  col.name,
  col.description,
  COUNT(DISTINCT dc.document_id) as document_count,
  COUNT(DISTINCT c.id) as chunk_count,
  COALESCE(SUM(c.token_count), 0) as total_tokens,
  col.created_date
FROM collections col
LEFT JOIN document_collections dc ON col.id = dc.collection_id
LEFT JOIN documents d ON dc.document_id = d.id
LEFT JOIN chunks c ON d.id = c.document_id
GROUP BY col.id;

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
