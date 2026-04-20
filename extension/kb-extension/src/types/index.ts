/**
 * KB Extension Type Definitions
 * 
 * Defines all data models, interfaces, and type guards for the storage layer,
 * configuration system, and API contracts.
 */

import type { ExtensionContext } from 'vscode';

// ============================================================================
// DOMAIN MODELS (Mirror database schema)
// ============================================================================

/**
 * Document: A source file or content ingested by the user
 */
export interface Document {
  id: string; // UUID v4
  name: string;
  type: 'markdown' | 'plaintext' | 'pdf';
  source_path?: string;
  size_bytes: number;
  hash: string; // SHA-256
  token_count?: number;
  created_date: Date;
  updated_date: Date;
  metadata?: Record<string, unknown>; // JSON extensibility
}

/**
 * Chunk: A logical text segment within a document
 */
export interface Chunk {
  id: string; // UUID v4
  document_id: string;
  sequence: number; // Order within document
  text: string;
  token_count: number;
  created_date: Date;
}

/**
 * Vector: Embedding representation of a chunk (1:1 with Chunk)
 */
export interface Vector {
  id: string; // UUID v4
  chunk_id: string; // UNIQUE FK to chunks
  embedding: number[]; // e.g., 384 dims for MiniLM
  model_name: string; // e.g., "all-MiniLM-L6-v2"
  dimension: number;
  created_date: Date;
}

/**
 * Tag: User-defined label for organization
 */
export interface Tag {
  id: string; // UUID v4
  name: string; // UNIQUE
  color?: string; // Hex #RRGGBB
  description?: string;
  created_date: Date;
}

/**
 * Collection: Folder/grouping for documents
 */
export interface Collection {
  id: string; // UUID v4
  name: string; // UNIQUE
  description?: string;
  color?: string;
  created_date: Date;
  updated_date: Date;
}

/**
 * DocumentTag: M2M junction between Document and Tag
 */
export interface DocumentTag {
  document_id: string;
  tag_id: string;
  added_date: Date;
}

/**
 * DocumentCollection: M2M junction between Document and Collection
 */
export interface DocumentCollection {
  document_id: string;
  collection_id: string;
  added_date: Date;
}

/**
 * SchemaVersion: Track database schema migrations
 */
export interface SchemaVersion {
  version: number;
  description: string;
  applied_date: Date;
}

/**
 * IngestionStatus: Track batch document import operations
 */
export interface IngestionStatus {
  id: string; // UUID v4
  batch_id: string; // UNIQUE - groups related imports
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  total_documents: number; // Expected count
  processed_documents: number; // Actual count
  failed_documents: number; // Count of failures
  error_message?: string; // Error details if failed
  started_at: Date;
  completed_at?: Date; // Null if still in progress
  metadata?: Record<string, unknown>; // JSON for additional tracking
}

// ============================================================================
// STORAGE LAYER INTERFACES & TYPES
// ============================================================================

/**
 * QueryResult: Normalized response from database queries
 */
export interface QueryResult<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  metadata?: {
    rowsAffected?: number;
    executionTime?: number; // ms
  };
}

/**
 * SearchFilter: Combined filtering options for queries
 */
export interface SearchFilter {
  tags?: string[]; // Tag names to filter by
  collections?: string[]; // Collection names to filter by
  dateRange?: {
    from: Date;
    to: Date;
  };
  types?: Array<'markdown' | 'plaintext' | 'pdf'>;
  limit?: number;
  offset?: number;
}

/**
 * StorageManager: Main CRUD interface for all entities
 */
export interface IStorageManager {
  // Lifecycle
  initialize(): Promise<void>;
  isHealthy(): Promise<boolean>;
  close(): Promise<void>;

  // Schema management
  getCurrentSchemaVersion(): Promise<number>;
  migrateSchema(targetVersion: number): Promise<void>;

  // Document operations
  createDocument(doc: Omit<Document, 'id' | 'created_date' | 'updated_date'>): Promise<QueryResult<Document>>;
  getDocument(id: string): Promise<QueryResult<Document | null>>;
  listDocuments(filter?: SearchFilter): Promise<QueryResult<Document[]>>;
  updateDocument(id: string, updates: Partial<Document>): Promise<QueryResult<Document>>;
  deleteDocument(id: string): Promise<QueryResult<{ deletedCount: number }>>;

  // Chunk operations
  createChunk(chunk: Omit<Chunk, 'id' | 'created_date'>): Promise<QueryResult<Chunk>>;
  getChunk(id: string): Promise<QueryResult<Chunk | null>>;
  listChunksByDocument(documentId: string): Promise<QueryResult<Chunk[]>>;
  deleteChunk(id: string): Promise<QueryResult<{ deletedCount: number }>>;

  // Vector operations
  createVector(vector: Omit<Vector, 'id' | 'created_date'>): Promise<QueryResult<Vector>>;
  getVector(chunkId: string): Promise<QueryResult<Vector | null>>;
  updateVector(chunkId: string, embedding: number[]): Promise<QueryResult<Vector>>;

  // Tag operations
  createTag(tag: Omit<Tag, 'id' | 'created_date'>): Promise<QueryResult<Tag>>;
  getTag(id: string): Promise<QueryResult<Tag | null>>;
  listTags(): Promise<QueryResult<Tag[]>>;
  updateTag(id: string, updates: Partial<Tag>): Promise<QueryResult<Tag>>;
  deleteTag(id: string): Promise<QueryResult<{ deletedCount: number }>>;

  // Document-Tag relationship
  addTagToDocument(documentId: string, tagId: string): Promise<QueryResult<DocumentTag>>;
  removeTagFromDocument(documentId: string, tagId: string): Promise<QueryResult<{ deletedCount: number }>>;
  getDocumentTags(documentId: string): Promise<QueryResult<Tag[]>>;

  // Collection operations
  createCollection(coll: Omit<Collection, 'id' | 'created_date' | 'updated_date'>): Promise<QueryResult<Collection>>;
  listCollections(): Promise<QueryResult<Collection[]>>;
  deleteCollection(id: string): Promise<QueryResult<{ deletedCount: number }>>;

  // Ingestion tracking
  createIngestionStatus(status: Omit<IngestionStatus, 'id' | 'started_at'>): Promise<QueryResult<IngestionStatus>>;
  getIngestionStatus(batchId: string): Promise<QueryResult<IngestionStatus | null>>;
  updateIngestionStatus(batchId: string, updates: Partial<IngestionStatus>): Promise<QueryResult<IngestionStatus>>;
  listIngestionStatuses(limit?: number): Promise<QueryResult<IngestionStatus[]>>;

  // Transactions
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;

  // Diagnostics
  getDatabaseStats(): Promise<{
    documentCount: number;
    chunkCount: number;
    vectorCount: number;
    tagCount: number;
    collectionCount: number;
    ingestionBatchCount: number;
    databaseSizeBytes: number;
  }>;
}

/**
 * Connection pool configuration
 */
export interface ConnectionPoolConfig {
  maxConnections: number;
  minConnections: number;
  idleTimeout: number; // ms
  connectionTimeout: number; // ms
}

// ============================================================================
// CONFIGURATION LAYER INTERFACES & TYPES
// ============================================================================

/**
 * ConfigManager: VS Code settings interface
 */
export interface IConfigManager {
  // Initialization
  initialize(context: ExtensionContext): Promise<void>;

  // Settings - Global (User-level)
  getGlobalSetting<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  setGlobalSetting<T>(key: string, value: T): Promise<void>;

  // Settings - Workspace (Project-level)
  getWorkspaceSetting<T>(key: string, defaultValue?: T): Promise<T | undefined>;
  setWorkspaceSetting<T>(key: string, value: T): Promise<void>;

  // Secrets (Encrypted storage via VS Code SecretStorage)
  getSecret(key: string): Promise<string | undefined>;
  setSecret(key: string, value: string): Promise<void>;
  deleteSecret(key: string): Promise<void>;

  // Environment variables
  getEnvVar(key: string, defaultValue?: string): string | undefined;

  // Validation & defaults
  validate(): Promise<boolean>;
  applyDefaults(): Promise<void>;

  // Diagnostics
  dumpConfig(): Promise<Record<string, unknown>>;
}

/**
 * KB Extension Configuration Schema
 */
export interface KBExtensionConfig {
  // Storage
  storage: {
    databasePath: string; // Path to SQLite .db file
    autoBackup: boolean; // Auto-backup on extension load
    backupRetention: number; // Days
  };

  // Embedding
  embedding: {
    provider: 'transformers' | 'ollama' | 'lm-studio'; // Local providers only
    model: string; // Model identifier
    dimension: number; // Vector dimension
    batchSize: number; // For embedding batch operations
    cacheEmbeddings: boolean; // Cache computed embeddings
  };

  // Search
  search: {
    semanticProvider: 'qdrant' | 'local'; // Where vectors stored
    fullTextEnabled: boolean;
    hybridSearchWeight: number; // 0-1 blend of semantic + FT
    topK: number; // Default number of results
  };

  // UI
  ui: {
    theme: 'auto' | 'light' | 'dark';
    sidebarPosition: 'left' | 'right';
    autoRefresh: boolean;
  };

  // Advanced
  advanced: {
    logLevel: 'error' | 'warn' | 'info' | 'debug';
    enableDiagnostics: boolean;
    connectionPoolSize: number;
  };

  // Secrets (never logged/dumped)
  secrets: {
    databaseEncryptionKey?: string; // Future: DB encryption
  };
}

/**
 * Environment variable names
 */
export const ENV_VARS = {
  KB_DB_PATH: 'KB_DB_PATH',
  KB_EMBEDDING_MODEL: 'KB_EMBEDDING_MODEL',
  KB_LOG_LEVEL: 'KB_LOG_LEVEL',
  KB_DEBUG: 'KB_DEBUG',
} as const;

/**
 * VS Code settings keys (package.json contributes.configuration)
 */
export const CONFIG_KEYS = {
  STORAGE_DB_PATH: 'kbExtension.storage.databasePath',
  STORAGE_AUTO_BACKUP: 'kbExtension.storage.autoBackup',
  EMBEDDING_PROVIDER: 'kbExtension.embedding.provider',
  EMBEDDING_MODEL: 'kbExtension.embedding.model',
  SEARCH_TOP_K: 'kbExtension.search.topK',
  UI_SIDEBAR_POSITION: 'kbExtension.ui.sidebarPosition',
  ADVANCED_LOG_LEVEL: 'kbExtension.advanced.logLevel',
} as const;

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG: KBExtensionConfig = {
  storage: {
    databasePath: '~/.kbextension/data.db',
    autoBackup: true,
    backupRetention: 7,
  },
  embedding: {
    provider: 'transformers',
    model: 'all-MiniLM-L6-v2',
    dimension: 384,
    batchSize: 32,
    cacheEmbeddings: true,
  },
  search: {
    semanticProvider: 'qdrant',
    fullTextEnabled: true,
    hybridSearchWeight: 0.5,
    topK: 10,
  },
  ui: {
    theme: 'auto',
    sidebarPosition: 'left',
    autoRefresh: true,
  },
  advanced: {
    logLevel: 'info',
    enableDiagnostics: false,
    connectionPoolSize: 5,
  },
  secrets: {},
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Type guard for Document
 */
export function isDocument(obj: unknown): obj is Document {
  const doc = obj as Document;
  return (
    typeof doc === 'object' &&
    doc !== null &&
    typeof doc.id === 'string' &&
    typeof doc.name === 'string' &&
    ['markdown', 'plaintext', 'pdf'].includes(doc.type) &&
    typeof doc.size_bytes === 'number' &&
    doc.created_date instanceof Date
  );
}

/**
 * Type guard for Chunk
 */
export function isChunk(obj: unknown): obj is Chunk {
  const chunk = obj as Chunk;
  return (
    typeof chunk === 'object' &&
    chunk !== null &&
    typeof chunk.id === 'string' &&
    typeof chunk.document_id === 'string' &&
    typeof chunk.sequence === 'number' &&
    typeof chunk.text === 'string' &&
    typeof chunk.token_count === 'number'
  );
}

/**
 * Type guard for Vector
 */
export function isVector(obj: unknown): obj is Vector {
  const vec = obj as Vector;
  return (
    typeof vec === 'object' &&
    vec !== null &&
    typeof vec.id === 'string' &&
    typeof vec.chunk_id === 'string' &&
    Array.isArray(vec.embedding) &&
    vec.embedding.every((v) => typeof v === 'number') &&
    typeof vec.model_name === 'string' &&
    typeof vec.dimension === 'number'
  );
}

// ============================================================================
// LOGGER INTERFACE (Structured logging)
// ============================================================================

export interface ILogger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, error?: Error, meta?: Record<string, unknown>): void;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export class KBExtensionError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'KBExtensionError';
  }
}

export class DatabaseError extends KBExtensionError {
  constructor(message: string, details?: unknown) {
    super('DATABASE_ERROR', message, details);
    this.name = 'DatabaseError';
  }
}

export class ConfigurationError extends KBExtensionError {
  constructor(message: string, details?: unknown) {
    super('CONFIG_ERROR', message, details);
    this.name = 'ConfigurationError';
  }
}

export class ValidationError extends KBExtensionError {
  constructor(message: string, details?: unknown) {
    super('VALIDATION_ERROR', message, details);
    this.name = 'ValidationError';
  }
}
