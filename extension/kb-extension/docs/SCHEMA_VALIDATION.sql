-- ============================================================================
-- KB Extension Schema Validation Queries (v1.0)
-- ============================================================================
-- Use these queries to verify schema integrity, test functionality,
-- and identify issues in the database.
--
-- Usage:
--   sqlite3 ~/.kbextension/data.db < SCHEMA_VALIDATION.sql
--
-- ============================================================================

-- ============================================================================
-- SECTION 1: SCHEMA EXISTENCE CHECKS
-- ============================================================================

.echo on
.print "=== SCHEMA VALIDATION REPORT ==="
.print "Generated: $(date)"
.print ""

.print "[1/8] CHECKING TABLE EXISTENCE..."
SELECT name, type, sql FROM sqlite_master 
WHERE type='table' 
AND name NOT LIKE 'sqlite_%'
ORDER BY name;

.print "[2/8] CHECKING INDEXES..."
SELECT name, tbl_name FROM sqlite_master 
WHERE type='index' 
AND name NOT LIKE 'sqlite_%'
ORDER BY tbl_name, name;

.print "[3/8] CHECKING TRIGGERS..."
SELECT name, tbl_name, sql FROM sqlite_master 
WHERE type='trigger'
ORDER BY tbl_name, name;

.print "[4/8] CHECKING VIEWS..."
SELECT name, sql FROM sqlite_master 
WHERE type='view'
ORDER BY name;

-- ============================================================================
-- SECTION 2: PRAGMA CHECKS (Schema metadata)
-- ============================================================================

.print "[5/8] CHECKING PRAGMA SETTINGS..."
.print "Foreign Keys Enabled:"
PRAGMA foreign_keys;

.print "Journal Mode:"
PRAGMA journal_mode;

-- ============================================================================
-- SECTION 3: FOREIGN KEY INTEGRITY
-- ============================================================================

.print "[6/8] CHECKING FOREIGN KEY CONSTRAINTS..."

.print "Orphaned chunks (document_id points to non-existent document):"
SELECT c.id, c.document_id FROM chunks c 
LEFT JOIN documents d ON c.document_id = d.id 
WHERE d.id IS NULL;

.print "Orphaned vectors (chunk_id points to non-existent chunk):"
SELECT v.id, v.chunk_id FROM vectors v 
LEFT JOIN chunks c ON v.chunk_id = c.id 
WHERE c.id IS NULL;

.print "Orphaned document_tags (invalid references):"
SELECT dt.document_id, dt.tag_id FROM document_tags dt
LEFT JOIN documents d ON dt.document_id = d.id
LEFT JOIN tags t ON dt.tag_id = t.id
WHERE d.id IS NULL OR t.id IS NULL;

.print "Orphaned document_collections (invalid references):"
SELECT dc.document_id, dc.collection_id FROM document_collections dc
LEFT JOIN documents d ON dc.document_id = d.id
LEFT JOIN collections col ON dc.collection_id = col.id
WHERE d.id IS NULL OR col.id IS NULL;

-- ============================================================================
-- SECTION 4: UNIQUE CONSTRAINT CHECKS
-- ============================================================================

.print "[7/8] CHECKING UNIQUE CONSTRAINTS..."

.print "Duplicate document hashes (should be empty):"
SELECT hash, COUNT(*) as count FROM documents GROUP BY hash HAVING count > 1;

.print "Duplicate tag names (should be empty):"
SELECT name, COUNT(*) as count FROM tags GROUP BY name HAVING count > 1;

.print "Duplicate collection names (should be empty):"
SELECT name, COUNT(*) as count FROM collections GROUP BY name HAVING count > 1;

.print "Duplicate chunk sequences within documents (should be empty):"
SELECT document_id, sequence, COUNT(*) as count 
FROM chunks 
GROUP BY document_id, sequence 
HAVING count > 1;

.print "Duplicate document_tags assignments (should be empty):"
SELECT document_id, tag_id, COUNT(*) as count 
FROM document_tags 
GROUP BY document_id, tag_id 
HAVING count > 1;

.print "Duplicate document_collections assignments (should be empty):"
SELECT document_id, collection_id, COUNT(*) as count 
FROM document_collections 
GROUP BY document_id, collection_id 
HAVING count > 1;

-- ============================================================================
-- SECTION 5: DATA STATISTICS
-- ============================================================================

.print "[8/8] DATABASE STATISTICS..."

.print "Table row counts:"
SELECT 
  'documents' as table_name, COUNT(*) as row_count FROM documents
UNION ALL
SELECT 'chunks', COUNT(*) FROM chunks
UNION ALL
SELECT 'vectors', COUNT(*) FROM vectors
UNION ALL
SELECT 'tags', COUNT(*) FROM tags
UNION ALL
SELECT 'collections', COUNT(*) FROM collections
UNION ALL
SELECT 'document_tags', COUNT(*) FROM document_tags
UNION ALL
SELECT 'document_collections', COUNT(*) FROM document_collections
UNION ALL
SELECT 'ingestion_status', COUNT(*) FROM ingestion_status;

.print "Database size (MB):"
SELECT ROUND(page_count * page_size / 1024.0 / 1024.0, 2) as size_mb 
FROM pragma_page_count(), pragma_page_size();

.print "WAL mode info:"
PRAGMA wal_autocheckpoint;

-- ============================================================================
-- SECTION 6: FUNCTIONAL TESTS (Sample queries)
-- ============================================================================

.print ""
.print "=== FUNCTIONAL TESTS ==="

.print "Test 1: Insert document and retrieve:"
-- INSERT INTO documents (id, name, type, size_bytes, hash) 
-- VALUES ('test-doc-1', 'Test Document', 'markdown', 1000, 'test-hash-1');
-- SELECT * FROM documents WHERE id = 'test-doc-1';

.print "Test 2: Query document_stats view (should reflect any existing documents):"
SELECT * FROM document_stats LIMIT 1;

.print "Test 3: Query chunk_vectors view (should show any chunks with vector status):"
SELECT * FROM chunk_vectors LIMIT 1;

.print "Test 4: Query collection_summary view (should show any collections):"
SELECT * FROM collection_summary LIMIT 1;

.print "Test 5: Check schema_version table:"
SELECT * FROM schema_version;

.print "Test 6: FTS5 index status:"
SELECT * FROM chunks_fts LIMIT 1;

-- ============================================================================
-- SECTION 7: CLEANUP INSTRUCTIONS
-- ============================================================================

.print ""
.print "=== VALIDATION COMPLETE ==="
.print ""
.print "If all checks above are empty/valid, the schema is healthy!"
.print ""
.print "To reset schema (DESTRUCTIVE):"
.print "  1. Delete the database: rm ~/.kbextension/data.db"
.print "  2. Reinitialize: npm run initialize-db"
.print ""
.print "To vacuum database (shrink file size):"
.print "  VACUUM;"
.print ""
.print "To analyze query performance:"
.print "  ANALYZE;"
.echo off
