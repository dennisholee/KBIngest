# KB Extension Schema Migration Strategy

**Version**: 1.0  
**Date**: April 19, 2026  
**Purpose**: Guidelines for managing schema changes across releases

---

## Table of Contents

1. [Migration Philosophy](#migration-philosophy)
2. [Current Schema Version](#current-schema-version)
3. [Migration Process](#migration-process)
4. [Rollback Procedures](#rollback-procedures)
5. [Testing Strategy](#testing-strategy)
6. [Deployment Checklist](#deployment-checklist)
7. [Planned Future Migrations](#planned-future-migrations)

---

## Migration Philosophy

### Core Principles

1. **Backward Compatibility** — Existing databases should work without full rebuild
2. **Non-Breaking Changes** — Additive schema changes where possible
3. **Atomic Transactions** — All or nothing; no partial migrations
4. **Audit Trail** — Every change tracked in `schema_version` table
5. **Data Preservation** — Never lose user data; copy and transform instead
6. **Testability** — Every migration has validation queries

### Migration Classifications

**Type A: Safe (Non-Breaking)**
- Add new nullable columns
- Add new optional tables
- Add new indexes (can be created offline)
- Add new views/triggers
- **Deployment**: Automatic

**Type B: Careful (Requires Data Migration)**
- Add NOT NULL columns (requires defaults)
- Rename columns
- Change column types
- Create new UNIQUE constraints
- **Deployment**: Manual with rollback plan

**Type C: Dangerous (Breaking Changes)**
- Delete tables
- Delete columns (irreversible)
- Change PRIMARY KEY
- **Deployment**: Only in major version upgrade with user notification

---

## Current Schema Version

### Version 1.0 (Current)

**Release Date**: April 2026  
**Status**: ✅ Stable  
**Tables**: 9 core tables + 1 virtual table

**Schema Contents**:
```sql
documents
├── chunks
│   └── vectors
├── tags
│   └── document_tags (M:M)
├── collections
│   └── document_collections (M:M)
├── ingestion_status
└── [virtual] chunks_fts

schema_version (metadata)
```

**Capabilities**:
- Document storage with deduplication
- Chunk-based segmentation
- Vector embeddings (384D, 768D, 1536D)
- Flexible tagging system
- Collection organization
- Full-text search (FTS5)
- Batch import tracking
- Automatic migration framework

---

## Migration Process

### Phase 1: Planning

**Before Coding**:

1. **Identify Change Type**
   ```
   Is this additive only?           → Type A (safe)
   Does it require data movement?   → Type B (careful)
   Does it delete data?             → Type C (dangerous!)
   ```

2. **Write Migration SQL**
   - Create separate `.sql` file with version number
   - Example: `migrations/v1_0_to_v1_1.sql`
   - Include rollback instructions in comments

3. **Document Impact**
   - What data might be affected?
   - How long will migration take?
   - What's the rollback plan?

### Phase 2: Implementation

**SQL Structure**:

```sql
-- migrations/v1_0_to_v1_1.sql
-- Migration: Add document caching table
-- From: v1.0 | To: v1.1
-- Estimated time: <5 seconds
-- Type: Type A (safe - additive)

BEGIN TRANSACTION;

-- Step 1: Update schema_version FIRST (prevents partial migrations)
INSERT INTO schema_version (version, description) 
VALUES (2, 'Add document_cache table for performance optimization');

-- Step 2: Create new table
CREATE TABLE document_cache (
  document_id TEXT PRIMARY KEY REFERENCES documents(id) ON DELETE CASCADE,
  cached_summary TEXT,
  cached_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Step 3: Populate cache with existing documents (if needed)
INSERT INTO document_cache (document_id, cached_at)
SELECT id, created_date FROM documents;

-- Step 4: Create indexes for new table
CREATE INDEX idx_document_cache_updated ON document_cache(cached_at);

COMMIT;
```

### Phase 3: StorageManager Implementation

**TypeScript Implementation**:

```typescript
// src/storage/StorageManager.ts

export class StorageManager implements IStorageManager {
  async migrateSchema(targetVersion: number): Promise<void> {
    const current = await this.getCurrentSchemaVersion();
    
    if (current === targetVersion) {
      console.log(`[Migration] Already at v${targetVersion}`);
      return;
    }
    
    console.log(`[Migration] Upgrading from v${current} to v${targetVersion}`);
    
    // Route to appropriate migration
    if (current === 1 && targetVersion === 2) {
      await this.migrate_v1_to_v2();
    } else if (current === 2 && targetVersion === 3) {
      await this.migrate_v2_to_v3();
    } else {
      throw new Error(`No migration path from v${current} to v${targetVersion}`);
    }
  }
  
  private async migrate_v1_to_v2(): Promise<void> {
    try {
      console.log('[Migration] Starting v1.0 → v1.1');
      
      // BEGIN TRANSACTION automatically when using this.db.exec()
      const migrationSql = fs.readFileSync(
        path.join(__dirname, '../storage/migrations/v1_0_to_v1_1.sql'),
        'utf-8'
      );
      
      await this.db.exec(migrationSql);
      
      console.log('[Migration] ✓ v1.0 → v1.1 complete');
      
    } catch (error) {
      console.error('[Migration] ✗ Failed:', error);
      throw new DatabaseError('Migration v1.0 → v1.1 failed', error);
    }
  }
  
  async getCurrentSchemaVersion(): Promise<number> {
    try {
      const result = await this.db.get(
        'SELECT MAX(version) as version FROM schema_version'
      );
      return result?.version ?? 1;
    } catch {
      return 1; // If table doesn't exist, assume v1
    }
  }
}
```

---

## Rollback Procedures

### Rollback Levels

**Level 1: Undo via SQL** (Type A changes only)

```sql
-- Rollback v1.1 to v1.0 (if additive only)
DELETE FROM schema_version WHERE version = 2;
DROP TABLE document_cache;
DROP INDEX idx_document_cache_updated;
```

**Level 2: Restore from Backup** (Type B changes)

```bash
# Stop extension
code --kill

# Restore backup
cp ~/.kbextension/data.db.backup ~/.kbextension/data.db

# Restart extension
code
```

**Level 3: Full Reinitialize** (Type C changes, data loss)

```bash
# WARNING: This deletes all data!
rm ~/.kbextension/data.db
rm ~/.kbextension/data.db-*

# Extension will auto-initialize on next load
```

### Backup Strategy

**Automatic Backups**:
- Enabled by default in `package.json` setting: `kbExtension.storage.autoBackup`
- Happens on extension activation
- Retained for 7 days (configurable)
- Location: `~/.kbextension/backups/data.db.YYYYMMDD_HHMMSS`

**Manual Backup**:
```bash
# Create dated backup
cp ~/.kbextension/data.db ~/.kbextension/data.db.backup.$(date +%Y%m%d_%H%M%S)

# List all backups
ls -lh ~/.kbextension/data.db*
```

---

## Testing Strategy

### Unit Tests for Migrations

**File**: `src/storage/migrations.test.ts`

```typescript
describe('Schema Migrations', () => {
  
  describe('v1.0 → v1.1', () => {
    let storage: StorageManager;
    
    beforeEach(async () => {
      storage = new StorageManager(':memory:');
      await storage.initialize();
    });
    
    it('should add document_cache table', async () => {
      await storage.migrateSchema(2);
      
      const result = await storage.db.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='document_cache'"
      );
      
      expect(result.length).toBe(1);
    });
    
    it('should populate cache with existing documents', async () => {
      // Create test document
      await storage.db.run(
        'INSERT INTO documents (id, name, type, size_bytes, hash) VALUES (?, ?, ?, ?, ?)',
        ['doc-1', 'test', 'markdown', 100, 'hash1']
      );
      
      // Migrate
      await storage.migrateSchema(2);
      
      // Verify cache populated
      const cached = await storage.db.get(
        'SELECT COUNT(*) as count FROM document_cache'
      );
      expect(cached.count).toBe(1);
    });
    
    it('should update schema_version correctly', async () => {
      await storage.migrateSchema(2);
      
      const version = await storage.getCurrentSchemaVersion();
      expect(version).toBe(2);
    });
  });
  
});
```

### Integration Tests

**File**: `src/storage/storage.test.ts`

```typescript
describe('StorageManager with migrations', () => {
  
  it('should handle schema version mismatch gracefully', async () => {
    const storage = new StorageManager(':memory:');
    
    // Initialize with v1
    await storage.initialize();
    expect(await storage.getCurrentSchemaVersion()).toBe(1);
    
    // Migrate to v2
    await storage.migrateSchema(2);
    expect(await storage.getCurrentSchemaVersion()).toBe(2);
    
    // Re-migrate (should be idempotent)
    await storage.migrateSchema(2);
    expect(await storage.getCurrentSchemaVersion()).toBe(2);
  });
  
  it('should maintain data integrity through migrations', async () => {
    const storage = new StorageManager(':memory:');
    await storage.initialize();
    
    // Create test data
    const doc = await storage.createDocument({
      name: 'test',
      type: 'markdown',
      size_bytes: 100,
      hash: 'test-hash'
    });
    
    const docId = doc.data?.id!;
    
    // Migrate
    await storage.migrateSchema(2);
    
    // Verify data still exists
    const retrieved = await storage.getDocument(docId);
    expect(retrieved.data?.name).toBe('test');
  });
  
});
```

---

## Deployment Checklist

Before deploying any schema migration:

- [ ] Write migration SQL (include rollback comments)
- [ ] Add version entry to `schema_version` table first
- [ ] Test migration on copy of production data
- [ ] Create unit test for migration
- [ ] Test rollback procedure
- [ ] Document estimated migration time
- [ ] Create backup before deploying
- [ ] Update CHANGELOG.md with migration details
- [ ] Notify users (if breaking change)
- [ ] Monitor for issues after deployment

### Pre-Deployment Testing

```bash
# 1. Create test database from production backup
cp ~/.kbextension/data.db ~/.kbextension/data.db.test

# 2. Run migration on test copy
sqlite3 ~/.kbextension/data.db.test < migrations/v1_0_to_v1_1.sql

# 3. Validate integrity
sqlite3 ~/.kbextension/data.db.test < docs/SCHEMA_VALIDATION.sql

# 4. Test rollback
cp ~/.kbextension/data.db.test ~/.kbextension/data.db.rollback

# 5. If successful, keep backup and deploy to production
cp ~/.kbextension/data.db ~/.kbextension/data.db.backup.pre-v1.1
```

---

## Planned Future Migrations

### Roadmap

#### v1.1 (Next Release)
**Type**: Type A (Safe)
- Add `document_cache` table for performance
- Add `cached_summary` column to cache frequently accessed docs
- Add indexes for cache queries
- **No data loss**
- **Migration time**: <1 second

#### v2.0 (Major Release)
**Type**: Type B (Careful - Qdrant integration)
- Migrate `vectors` table to Qdrant references only
- Keep lightweight SQLite index of vector metadata
- Add `qdrant_point_id` column to vectors
- Add `qdrant_collection_name` column
- **Data preservation**: All embeddings maintained
- **Migration time**: Depends on vector count (~10K vectors = 5 sec)

#### v2.1 (Document Versioning)
**Type**: Type B (Careful)
- Add `document_versions` table
- Add `parent_version_id` to documents for tracking edits
- **Use case**: Maintain edit history of ingested documents
- **Migration time**: <5 seconds (table created, data unchanged)

#### v3.0 (Collection Hierarchy)
**Type**: Type B (Careful)
- Add `parent_collection_id` to collections table
- Enable nested collection structure
- Migrate existing flat collections (no change needed, new field nullable)
- **Migration time**: <1 second

---

## Emergency Procedures

### Database Corruption Recovery

**Scenario**: SQLite file corrupt (won't open)

```bash
# 1. Attempt automated recovery
sqlite3 ~/.kbextension/data.db "PRAGMA integrity_check;"

# 2. If failed, restore from backup
rm ~/.kbextension/data.db
cp ~/.kbextension/data.db.backup ~/.kbextension/data.db

# 3. If no backup, full rebuild
rm ~/.kbextension/data.db
# Extension will reinitialize on next load
# ⚠️ WARNING: All ingested documents will be lost
```

### Slow Migration Detection

**Scenario**: Migration hangs for >30 seconds

```bash
# 1. Monitor file size growth
watch -n 1 'ls -lh ~/.kbextension/data.db'

# 2. Check for locks
lsof | grep data.db

# 3. Kill hung process
killall -9 Code

# 4. Restore backup
cp ~/.kbextension/data.db.backup ~/.kbextension/data.db

# 5. Report issue and wait for fix
```

---

## Version History

| Version | Release | Changes | Status |
|---------|---------|---------|--------|
| 1.0 | Apr 2026 | Initial schema | ✅ Current |
| 1.1 | TBD | Add caching | 📋 Planned |
| 2.0 | TBD | Qdrant integration | 📋 Planned |
| 2.1 | TBD | Document versioning | 📋 Planned |
| 3.0 | TBD | Collection hierarchy | 📋 Planned |

---

## Summary

This migration strategy provides:
- ✅ Clear path for schema evolution
- ✅ Data preservation through careful migrations
- ✅ Rollback capabilities at every step
- ✅ Automated testing of migrations
- ✅ User-friendly backup/restore

**Key Takeaway**: Schema changes should be additive and non-breaking whenever possible. When breaking changes are necessary, provide a clear migration path with testing and rollback options.
