/**
 * SQLite-backed Storage Manager
 * 
 * Complete CRUD operations for KB Extension with:
 * - SQLite database persistence
 * - Transaction support
 * - Constraint enforcement
 * - Full-text search integration
 */

import { randomUUID } from 'crypto';
import { createHash } from 'crypto';
import * as path from 'path';
import type {
  IStorageManager,
  Document,
  Chunk,
  Vector,
  Tag,
  Collection,
  DocumentTag,
  IngestionStatus,
  QueryResult,
  SearchFilter,
} from '../types';
import { DatabaseError } from '../types';
import { DatabaseConnection } from './DatabaseConnection';
import { MigrationRunner } from './migrations/MigrationRunner';
import { migrations, getLatestMigrationVersion } from './migrations/index';

export class StorageManager implements IStorageManager {
  private dbPath: string;
  private schemaPath: string;
  private db: DatabaseConnection | null = null;
  private isInitialized = false;
  private migrationRunner: MigrationRunner;

  constructor(dbPath: string, schemaPath?: string) {
    this.dbPath = dbPath;
    // Resolve schema path relative to this file's directory
    this.schemaPath = schemaPath || path.join(__dirname, 'schema.sql');
    
    // Initialize migration runner with all registered migrations
    this.migrationRunner = new MigrationRunner({ verbose: true });
    this.migrationRunner.registerBatch(migrations);
  }

  async initialize(): Promise<void> {
    try {
      this.db = new DatabaseConnection(this.dbPath, this.schemaPath);
      await this.db.open();
      this.isInitialized = true;
      console.log(`[StorageManager] Initialized at ${this.dbPath}`);
    } catch (error) {
      this.isInitialized = false;
      throw new DatabaseError(`Failed to initialize storage: ${error}`);
    }
  }

  async isHealthy(): Promise<boolean> {
    if (!this.db) {
      return false;
    }
    try {
      const stmt = this.db.prepare('SELECT COUNT(*) as count FROM documents') as any;
      stmt.get();
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentSchemaVersion(): Promise<number> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT MAX(version) as version FROM schema_version') as any;
      const result = stmt.get() as { version: number | null };
      return result.version || 0;
    } catch {
      return 0;
    }
  }

  async migrateSchema(targetVersion?: number): Promise<void> {
    this.ensureInitialized();
    try {
      const conn = this.db!.getConnection();
      
      // Determine target version
      const target = targetVersion ?? getLatestMigrationVersion();
      const current = this.migrationRunner.getCurrentVersion(conn);

      if (current === target) {
        console.log(`[StorageManager] Already at schema v${current}`);
        return;
      }

      console.log(`[StorageManager] Migrating schema: v${current} → v${target}`);

      // Execute migrations
      const results = await this.migrationRunner.migrate(conn, target);

      // Report results
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      console.log(
        `[StorageManager] Migration complete: ${successful} successful, ${failed} failed`
      );

      if (failed > 0) {
        const errors = results
          .filter((r) => !r.success)
          .map((r) => `  - v${r.fromVersion}→${r.toVersion}: ${r.error}`)
          .join('\n');
        throw new DatabaseError(
          `Schema migration failed:\n${errors}`
        );
      }
    } catch (error) {
      throw new DatabaseError(`Failed to migrate schema: ${error}`);
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
    }
    this.isInitialized = false;
    console.log('[StorageManager] Connection closed');
  }

  // ============================================================
  // DOCUMENT OPERATIONS
  // ============================================================

  async createDocument(
    doc: Omit<Document, 'id' | 'created_date' | 'updated_date'>
  ): Promise<QueryResult<Document>> {
    this.ensureInitialized();
    try {
      const id = randomUUID();
      const now = new Date();

      const stmt = this.db!.prepare(`
        INSERT INTO documents (
          id, name, type, source_path, size_bytes, hash, token_count, created_date, updated_date, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `) as any;

      stmt.run(
        id,
        doc.name,
        doc.type,
        doc.source_path || null,
        doc.size_bytes || 0,
        doc.hash,
        doc.token_count || 0,
        now.getTime(),
        now.getTime(),
        doc.metadata ? JSON.stringify(doc.metadata) : null
      );

      return {
        success: true,
        data: {
          id,
          ...doc,
          created_date: now,
          updated_date: now,
        },
      };
    } catch (error: any) {
      if (error?.message?.includes('UNIQUE')) {
        return {
          success: false,
          error: { code: 'DUPLICATE_HASH', message: 'Document hash must be unique' },
        };
      }
      return {
        success: false,
        error: { code: 'DOCUMENT_CREATE_ERROR', message: String(error) },
      };
    }
  }

  async getDocument(id: string): Promise<QueryResult<Document | null>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT * FROM documents WHERE id = ?') as any;
      const row = stmt.get(id) as any;
      if (!row) {
        return { success: true, data: null };
      }
      return {
        success: true,
        data: this.mapRowToDocument(row),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DOCUMENT_GET_ERROR', message: String(error) },
      };
    }
  }

  async listDocuments(filter?: SearchFilter): Promise<QueryResult<Document[]>> {
    this.ensureInitialized();
    try {
      let query = 'SELECT * FROM documents WHERE 1=1';
      const params: any[] = [];

      if (filter?.types && filter.types.length > 0) {
        const placeholders = filter.types.map(() => '?').join(',');
        query += ` AND type IN (${placeholders})`;
        params.push(...filter.types);
      }

      query += ' ORDER BY created_date DESC';

      if (filter?.limit) {
        query += ' LIMIT ?';
        params.push(filter.limit);
      }

      const stmt = this.db!.prepare(query) as any;
      const rows = stmt.all(...params) as any[];
      return {
        success: true,
        data: rows.map(row => this.mapRowToDocument(row)),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DOCUMENT_LIST_ERROR', message: String(error) },
      };
    }
  }

  async updateDocument(
    id: string,
    updates: Partial<Document>
  ): Promise<QueryResult<Document>> {
    this.ensureInitialized();
    try {
      const now = new Date();
      const fields: string[] = [];
      const values: any[] = [];

      // Only allow updating specific fields
      const allowedFields = ['name', 'token_count', 'metadata'];
      for (const field of allowedFields) {
        if (field in updates) {
          fields.push(`${field} = ?`);
          values.push(
            field === 'metadata'
              ? JSON.stringify((updates as any)[field])
              : (updates as any)[field]
          );
        }
      }

      if (fields.length === 0) {
        // No updates, just return current document
        const result = await this.getDocument(id);
        if (result.success && result.data) {
          return { success: true, data: result.data };
        }
        return {
          success: false,
          error: { code: 'DOCUMENT_NOT_FOUND', message: 'Document not found' },
        };
      }

      fields.push('updated_date = ?');
      values.push(now.getTime());
      values.push(id);

      const stmt = this.db!.prepare(
        `UPDATE documents SET ${fields.join(', ')} WHERE id = ?`
      ) as any;
      stmt.run(...values);

      const result = await this.getDocument(id);
      if (result.success && result.data) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: { code: 'DOCUMENT_UPDATE_ERROR', message: 'Failed to update document' },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DOCUMENT_UPDATE_ERROR', message: String(error) },
      };
    }
  }

  async deleteDocument(id: string): Promise<QueryResult<{ deletedCount: number }>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('DELETE FROM documents WHERE id = ?') as any;
      const info = stmt.run(id);
      return {
        success: true,
        data: { deletedCount: (info as any).changes || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DOCUMENT_DELETE_ERROR', message: String(error) },
      };
    }
  }

  // ============================================================
  // CHUNK OPERATIONS
  // ============================================================

  async createChunk(
    chunk: Omit<Chunk, 'id' | 'created_date'>
  ): Promise<QueryResult<Chunk>> {
    this.ensureInitialized();
    try {
      const id = randomUUID();
      const now = new Date();

      const stmt = this.db!.prepare(`
        INSERT INTO chunks (
          id, document_id, sequence, text, token_count, created_date
        ) VALUES (?, ?, ?, ?, ?, ?)
      `) as any;

      stmt.run(
        id,
        chunk.document_id,
        chunk.sequence,
        chunk.text,
        chunk.token_count || 0,
        now.getTime()
      );

      return {
        success: true,
        data: {
          id,
          ...chunk,
          created_date: now,
        },
      };
    } catch (error: any) {
      if (error?.message?.includes('UNIQUE')) {
        return {
          success: false,
          error: { code: 'DUPLICATE_SEQUENCE', message: 'Sequence must be unique within document' },
        };
      }
      return {
        success: false,
        error: { code: 'CHUNK_CREATE_ERROR', message: String(error) },
      };
    }
  }

  async getChunk(id: string): Promise<QueryResult<Chunk | null>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT * FROM chunks WHERE id = ?') as any;
      const row = stmt.get(id) as any;
      if (!row) {
        return { success: true, data: null };
      }
      return {
        success: true,
        data: this.mapRowToChunk(row),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'CHUNK_GET_ERROR', message: String(error) },
      };
    }
  }

  async listChunksByDocument(documentId: string): Promise<QueryResult<Chunk[]>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(
        'SELECT * FROM chunks WHERE document_id = ? ORDER BY sequence ASC'
      ) as any;
      const rows = stmt.all(documentId) as any[];
      return {
        success: true,
        data: rows.map(row => this.mapRowToChunk(row)),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'CHUNK_LIST_ERROR', message: String(error) },
      };
    }
  }

  async deleteChunk(id: string): Promise<QueryResult<{ deletedCount: number }>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('DELETE FROM chunks WHERE id = ?') as any;
      const info = stmt.run(id);
      return {
        success: true,
        data: { deletedCount: (info as any).changes || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'CHUNK_DELETE_ERROR', message: String(error) },
      };
    }
  }

  // ============================================================
  // VECTOR OPERATIONS
  // ============================================================

  async createVector(
    vector: Omit<Vector, 'id' | 'created_date'>
  ): Promise<QueryResult<Vector>> {
    this.ensureInitialized();
    try {
      const id = randomUUID();
      const now = new Date();

      const stmt = this.db!.prepare(`
        INSERT INTO vectors (
          id, chunk_id, embedding, model_name, dimension, created_date
        ) VALUES (?, ?, ?, ?, ?, ?)
      `) as any;

      stmt.run(
        id,
        vector.chunk_id,
        JSON.stringify(vector.embedding),
        vector.model_name,
        vector.dimension,
        now.getTime()
      );

      return {
        success: true,
        data: {
          id,
          ...vector,
          created_date: now,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'VECTOR_CREATE_ERROR', message: String(error) },
      };
    }
  }

  async getVector(chunkId: string): Promise<QueryResult<Vector | null>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT * FROM vectors WHERE chunk_id = ?') as any;
      const row = stmt.get(chunkId) as any;
      if (!row) {
        return { success: true, data: null };
      }
      return {
        success: true,
        data: this.mapRowToVector(row),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'VECTOR_GET_ERROR', message: String(error) },
      };
    }
  }

  async updateVector(
    chunkId: string,
    embedding: number[]
  ): Promise<QueryResult<Vector>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(
        'UPDATE vectors SET embedding = ? WHERE chunk_id = ?'
      ) as any;
      stmt.run(JSON.stringify(embedding), chunkId);

      const result = await this.getVector(chunkId);
      if (result.success && result.data) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: { code: 'VECTOR_UPDATE_ERROR', message: 'Failed to update vector' },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'VECTOR_UPDATE_ERROR', message: String(error) },
      };
    }
  }

  // ============================================================
  // TAG OPERATIONS
  // ============================================================

  async createTag(
    tag: Omit<Tag, 'id' | 'created_date'>
  ): Promise<QueryResult<Tag>> {
    this.ensureInitialized();
    try {
      const id = randomUUID();
      const now = new Date();

      const stmt = this.db!.prepare(`
        INSERT INTO tags (id, name, color, description, created_date)
        VALUES (?, ?, ?, ?, ?)
      `) as any;

      stmt.run(id, tag.name, tag.color || null, tag.description || null, now.getTime());

      return {
        success: true,
        data: {
          id,
          ...tag,
          created_date: now,
        },
      };
    } catch (error: any) {
      if (error?.message?.includes('UNIQUE')) {
        return {
          success: false,
          error: { code: 'DUPLICATE_TAG_NAME', message: 'Tag name must be unique' },
        };
      }
      return {
        success: false,
        error: { code: 'TAG_CREATE_ERROR', message: String(error) },
      };
    }
  }

  async getTag(id: string): Promise<QueryResult<Tag | null>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT * FROM tags WHERE id = ?') as any;
      const row = stmt.get(id) as any;
      if (!row) {
        return { success: true, data: null };
      }
      return {
        success: true,
        data: this.mapRowToTag(row),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'TAG_GET_ERROR', message: String(error) },
      };
    }
  }

  async listTags(): Promise<QueryResult<Tag[]>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT * FROM tags ORDER BY name ASC') as any;
      const rows = stmt.all() as any[];
      return {
        success: true,
        data: rows.map(row => this.mapRowToTag(row)),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'TAG_LIST_ERROR', message: String(error) },
      };
    }
  }

  async updateTag(
    id: string,
    updates: Partial<Tag>
  ): Promise<QueryResult<Tag>> {
    this.ensureInitialized();
    try {
      const fields: string[] = [];
      const values: any[] = [];

      const allowedFields = ['color', 'description'];
      for (const field of allowedFields) {
        if (field in updates) {
          fields.push(`${field} = ?`);
          values.push((updates as any)[field]);
        }
      }

      if (fields.length === 0) {
        const result = await this.getTag(id);
        if (result.success && result.data) {
          return { success: true, data: result.data };
        }
        return {
          success: false,
          error: { code: 'TAG_NOT_FOUND', message: 'Tag not found' },
        };
      }

      values.push(id);
      const stmt = this.db!.prepare(`UPDATE tags SET ${fields.join(', ')} WHERE id = ?`) as any;
      stmt.run(...values);

      const result = await this.getTag(id);
      if (result.success && result.data) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: { code: 'TAG_UPDATE_ERROR', message: 'Failed to update tag' },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'TAG_UPDATE_ERROR', message: String(error) },
      };
    }
  }

  async deleteTag(id: string): Promise<QueryResult<{ deletedCount: number }>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('DELETE FROM tags WHERE id = ?') as any;
      const info = stmt.run(id);
      return {
        success: true,
        data: { deletedCount: (info as any).changes || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'TAG_DELETE_ERROR', message: String(error) },
      };
    }
  }

  // ============================================================
  // COLLECTION OPERATIONS
  // ============================================================

  async createCollection(
    collection: Omit<Collection, 'id' | 'created_date' | 'updated_date'>
  ): Promise<QueryResult<Collection>> {
    this.ensureInitialized();
    try {
      const id = randomUUID();
      const now = new Date();

      const stmt = this.db!.prepare(`
        INSERT INTO collections (id, name, description, color, created_date, updated_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `) as any;

      stmt.run(
        id,
        collection.name,
        collection.description || null,
        collection.color || null,
        now.getTime(),
        now.getTime()
      );

      return {
        success: true,
        data: {
          id,
          ...collection,
          created_date: now,
          updated_date: now,
        },
      };
    } catch (error: any) {
      if (error?.message?.includes('UNIQUE')) {
        return {
          success: false,
          error: { code: 'DUPLICATE_COLLECTION_NAME', message: 'Collection name must be unique' },
        };
      }
      return {
        success: false,
        error: { code: 'COLLECTION_CREATE_ERROR', message: String(error) },
      };
    }
  }

  async listCollections(): Promise<QueryResult<Collection[]>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('SELECT * FROM collections ORDER BY name ASC') as any;
      const rows = stmt.all() as any[];
      return {
        success: true,
        data: rows.map(row => this.mapRowToCollection(row)),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'COLLECTION_LIST_ERROR', message: String(error) },
      };
    }
  }

  async deleteCollection(id: string): Promise<QueryResult<{ deletedCount: number }>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare('DELETE FROM collections WHERE id = ?') as any;
      const info = stmt.run(id);
      return {
        success: true,
        data: { deletedCount: (info as any).changes || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'COLLECTION_DELETE_ERROR', message: String(error) },
      };
    }
  }

  // ============================================================
  // DOCUMENT-TAG OPERATIONS
  // ============================================================

  async addTagToDocument(
    documentId: string,
    tagId: string
  ): Promise<QueryResult<DocumentTag>> {
    this.ensureInitialized();
    try {
      const now = new Date();
      const stmt = this.db!.prepare(`
        INSERT INTO document_tags (document_id, tag_id, added_date)
        VALUES (?, ?, ?)
      `) as any;
      stmt.run(documentId, tagId, now.getTime());

      return {
        success: true,
        data: { document_id: documentId, tag_id: tagId, added_date: now },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DOCUMENT_TAG_CREATE_ERROR', message: String(error) },
      };
    }
  }

  async removeTagFromDocument(
    documentId: string,
    tagId: string
  ): Promise<QueryResult<{ deletedCount: number }>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(
        'DELETE FROM document_tags WHERE document_id = ? AND tag_id = ?'
      ) as any;
      const info = stmt.run(documentId, tagId);
      return {
        success: true,
        data: { deletedCount: (info as any).changes || 0 },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DOCUMENT_TAG_DELETE_ERROR', message: String(error) },
      };
    }
  }

  async getDocumentTags(documentId: string): Promise<QueryResult<Tag[]>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(`
        SELECT t.* FROM tags t
        INNER JOIN document_tags dt ON t.id = dt.tag_id
        WHERE dt.document_id = ?
        ORDER BY t.name ASC
      `) as any;
      const rows = stmt.all(documentId) as any[];
      return {
        success: true,
        data: rows.map(row => this.mapRowToTag(row)),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'DOCUMENT_TAGS_GET_ERROR', message: String(error) },
      };
    }
  }

  // ============================================================
  // INGESTION STATUS OPERATIONS
  // ============================================================

  async createIngestionStatus(
    status: Omit<IngestionStatus, 'id' | 'started_at'>
  ): Promise<QueryResult<IngestionStatus>> {
    this.ensureInitialized();
    try {
      const id = randomUUID();
      const now = new Date();

      const stmt = this.db!.prepare(`
        INSERT INTO ingestion_status (
          id, batch_id, status, total_documents, processed_documents, failed_documents, error_message, started_at, completed_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `) as any;

      stmt.run(
        id,
        status.batch_id,
        status.status,
        status.total_documents,
        status.processed_documents || 0,
        status.failed_documents || 0,
        status.error_message || null,
        now.getTime(),
        null,
        status.metadata ? JSON.stringify(status.metadata) : null
      );

      return {
        success: true,
        data: {
          id,
          ...status,
          started_at: now,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INGESTION_STATUS_CREATE_ERROR', message: String(error) },
      };
    }
  }

  async getIngestionStatus(batchId: string): Promise<QueryResult<IngestionStatus | null>> {
    this.ensureInitialized();
    try {
      const stmt = this.db!.prepare(
        'SELECT * FROM ingestion_status WHERE batch_id = ? LIMIT 1'
      ) as any;
      const row = stmt.get(batchId) as any;
      if (!row) {
        return { success: true, data: null };
      }
      return {
        success: true,
        data: this.mapRowToIngestionStatus(row),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INGESTION_STATUS_GET_ERROR', message: String(error) },
      };
    }
  }

  async updateIngestionStatus(
    batchId: string,
    updates: Partial<IngestionStatus>
  ): Promise<QueryResult<IngestionStatus>> {
    this.ensureInitialized();
    try {
      const fields: string[] = [];
      const values: any[] = [];

      const allowedFields = ['status', 'processed_documents', 'failed_documents', 'error_message', 'completed_at'];
      for (const field of allowedFields) {
        if (field in updates) {
          fields.push(`${field} = ?`);
          values.push((updates as any)[field]);
        }
      }

      if (fields.length === 0) {
        const result = await this.getIngestionStatus(batchId);
        if (result.success && result.data) {
          return { success: true, data: result.data };
        }
        return {
          success: false,
          error: { code: 'INGESTION_STATUS_NOT_FOUND', message: 'Ingestion status not found' },
        };
      }

      values.push(batchId);
      const stmt = this.db!.prepare(
        `UPDATE ingestion_status SET ${fields.join(', ')} WHERE batch_id = ?`
      ) as any;
      stmt.run(...values);

      const result = await this.getIngestionStatus(batchId);
      if (result.success && result.data) {
        return { success: true, data: result.data };
      }
      return {
        success: false,
        error: { code: 'INGESTION_STATUS_UPDATE_ERROR', message: 'Failed to update ingestion status' },
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INGESTION_STATUS_UPDATE_ERROR', message: String(error) },
      };
    }
  }

  async listIngestionStatuses(limit?: number): Promise<QueryResult<IngestionStatus[]>> {
    this.ensureInitialized();
    try {
      let query = 'SELECT * FROM ingestion_status ORDER BY started_at DESC';
      if (limit) {
        query += ` LIMIT ${limit}`;
      }
      const stmt = this.db!.prepare(query) as any;
      const rows = stmt.all() as any[];
      return {
        success: true,
        data: rows.map(row => this.mapRowToIngestionStatus(row)),
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'INGESTION_STATUS_LIST_ERROR', message: String(error) },
      };
    }
  }

  // ============================================================
  // TRANSACTION & UTILITY
  // ============================================================

  async beginTransaction(): Promise<void> {
    this.ensureInitialized();
    try {
      this.db!.exec('BEGIN TRANSACTION');
    } catch (error) {
      throw new DatabaseError(`Failed to begin transaction: ${error}`);
    }
  }

  async commit(): Promise<void> {
    this.ensureInitialized();
    try {
      this.db!.exec('COMMIT');
    } catch (error) {
      throw new DatabaseError(`Failed to commit transaction: ${error}`);
    }
  }

  async rollback(): Promise<void> {
    this.ensureInitialized();
    try {
      this.db!.exec('ROLLBACK');
    } catch (error) {
      throw new DatabaseError(`Failed to rollback transaction: ${error}`);
    }
  }

  async getDatabaseStats(): Promise<{
    documentCount: number;
    chunkCount: number;
    vectorCount: number;
    tagCount: number;
    collectionCount: number;
    ingestionBatchCount: number;
    databaseSizeBytes: number;
  }> {
    this.ensureInitialized();
    try {
      const docStmt = this.db!.prepare('SELECT COUNT(*) as count FROM documents') as any;
      const chunkStmt = this.db!.prepare('SELECT COUNT(*) as count FROM chunks') as any;
      const vectorStmt = this.db!.prepare('SELECT COUNT(*) as count FROM vectors') as any;
      const tagStmt = this.db!.prepare('SELECT COUNT(*) as count FROM tags') as any;
      const collectionStmt = this.db!.prepare('SELECT COUNT(*) as count FROM collections') as any;
      const ingestionStmt = this.db!.prepare('SELECT COUNT(DISTINCT batch_id) as count FROM ingestion_status') as any;

      // Calculate database size in bytes
      // PRAGMA page_size returns the page size (usually 4096)
      // PRAGMA page_count returns the number of pages
      const pageSizeStmt = this.db!.prepare('PRAGMA page_size') as any;
      const pageCountStmt = this.db!.prepare('PRAGMA page_count') as any;
      
      const pageSizeResult = pageSizeStmt.get() as any;
      const pageCountResult = pageCountStmt.get() as any;
      
      // PRAGMA results might use different key names, try common variations
      const pageSize = pageSizeResult?.page_size || pageSizeResult?.[0] || 4096;
      const pageCount = pageCountResult?.page_count || pageCountResult?.[0] || 0;
      const databaseSizeBytes = Math.max(pageSize * pageCount, 0);

      return {
        documentCount: (docStmt.get() as any)?.count || 0,
        chunkCount: (chunkStmt.get() as any)?.count || 0,
        vectorCount: (vectorStmt.get() as any)?.count || 0,
        tagCount: (tagStmt.get() as any)?.count || 0,
        collectionCount: (collectionStmt.get() as any)?.count || 0,
        ingestionBatchCount: (ingestionStmt.get() as any)?.count || 0,
        databaseSizeBytes,
      };
    } catch (error) {
      throw new DatabaseError(`Failed to get database stats: ${error}`);
    }
  }

  // ============================================================
  // PRIVATE HELPERS
  // ============================================================

  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new DatabaseError('StorageManager not initialized');
    }
  }

  private mapRowToDocument(row: any): Document {
    return {
      id: row.id,
      name: row.name,
      type: row.type,
      source_path: row.source_path,
      size_bytes: row.size_bytes,
      hash: row.hash,
      token_count: row.token_count,
      created_date: new Date(row.created_date),
      updated_date: new Date(row.updated_date),
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }

  private mapRowToChunk(row: any): Chunk {
    return {
      id: row.id,
      document_id: row.document_id,
      sequence: row.sequence,
      text: row.text,
      token_count: row.token_count,
      created_date: new Date(row.created_date),
    };
  }

  private mapRowToVector(row: any): Vector {
    return {
      id: row.id,
      chunk_id: row.chunk_id,
      embedding: JSON.parse(row.embedding),
      model_name: row.model_name,
      dimension: row.dimension,
      created_date: new Date(row.created_date),
    };
  }

  private mapRowToTag(row: any): Tag {
    return {
      id: row.id,
      name: row.name,
      color: row.color,
      description: row.description,
      created_date: new Date(row.created_date),
    };
  }

  private mapRowToCollection(row: any): Collection {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      color: row.color,
      created_date: new Date(row.created_date),
      updated_date: new Date(row.updated_date),
    };
  }

  private mapRowToIngestionStatus(row: any): IngestionStatus {
    return {
      id: row.id,
      batch_id: row.batch_id,
      status: row.status,
      total_documents: row.total_documents,
      processed_documents: row.processed_documents,
      failed_documents: row.failed_documents,
      error_message: row.error_message,
      started_at: new Date(row.started_at),
      completed_at: row.completed_at ? new Date(row.completed_at) : undefined,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
    };
  }
}
