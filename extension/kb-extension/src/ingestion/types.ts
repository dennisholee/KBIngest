/**
 * Document Ingestion Types and Interfaces
 * 
 * Defines contracts for file parsing, chunking, and ingestion workflows.
 */

import type { QueryResult } from '../types';

/**
 * Supported file types for ingestion
 */
export type SupportedFileType = 'markdown' | 'plaintext' | 'pdf';

/**
 * File metadata after parsing
 */
export interface ParsedFile {
  name: string;
  type: SupportedFileType;
  content: string;
  size_bytes: number;
  hash: string; // SHA-256 of content
  metadata?: {
    encoding?: string;
    language?: string;
    wordCount?: number;
    pageCount?: number; // For PDFs
    tokenCount?: number; // D7: Token estimation
  };
}

/**
 * A single chunk from a document
 */
export interface DocumentChunk {
  sequence: number;
  text: string;
  token_count: number;
  metadata?: {
    source?: string;
    page?: number; // For PDFs
    heading?: string; // For markdown
    language?: string;
  };
}

/**
 * Chunking strategy configuration
 */
export interface ChunkingConfig {
  strategy: 'fixed-size' | 'semantic' | 'hybrid';
  chunkSize?: number; // For fixed-size: bytes or tokens
  chunkOverlap?: number; // Overlap between chunks
  minChunkSize?: number; // Minimum chunk size
  maxChunkSize?: number; // Maximum chunk size
  preserveHeadings?: boolean; // For markdown
  languageHints?: string[]; // For semantic chunking
}

/**
 * Error object for QueryResult
 */
export interface QueryError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Result of chunking a document
 */
export interface ChunkingResult {
  chunks: DocumentChunk[];
  totalChunks: number;
  estimatedTokens: number;
  metadata: {
    strategy: string;
    language?: string;
    processedAt: Date;
  };
}

/**
 * Ingestion job
 */
export interface IngestionJob {
  id: string;
  fileName: string;
  fileType: SupportedFileType;
  status: 'pending' | 'parsing' | 'chunking' | 'embedding' | 'storing' | 'completed' | 'failed';
  progress: number; // 0-100
  totalChunks: number;
  processedChunks: number;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  metadata?: Record<string, unknown>;
}

/**
 * Ingestion result
 */
export interface IngestionResult {
  jobId: string;
  documentId: string;
  chunksCreated: number;
  vectorsCreated: number;
  executionMs: number;
  success: boolean;
  error?: string;
}

/**
 * File parser interface
 */
export interface IFileParser {
  canParse(fileType: SupportedFileType): boolean;
  parse(filePath: string): Promise<QueryResult<ParsedFile>>;
  parseBuffer(buffer: Buffer, fileType: SupportedFileType, fileName: string): Promise<QueryResult<ParsedFile>>;
}

/**
 * Chunking strategy interface
 */
export interface IChunkingStrategy {
  canChunk(fileType: SupportedFileType): boolean;
  chunk(file: ParsedFile, config: ChunkingConfig): Promise<QueryResult<ChunkingResult>>;
  name(): string;
}

/**
 * Document ingestion service interface
 */
export interface IDocumentIngestion {
  ingestFile(filePath: string, config?: ChunkingConfig): Promise<QueryResult<IngestionResult>>;
  ingestBuffer(buffer: Buffer, fileName: string, config?: ChunkingConfig): Promise<QueryResult<IngestionResult>>;
  batchIngest(filePaths: string[], config?: ChunkingConfig): Promise<QueryResult<IngestionResult[]>>;
  getJobStatus(jobId: string): IngestionJob | null;
  listJobs(filter?: { status?: string; limit?: number }): IngestionJob[];
  cancelJob(jobId: string): boolean;
}

/**
 * Token estimation helper
 */
export interface TokenEstimator {
  estimateTokens(text: string): number;
  estimateChunks(text: string, chunkSize: number): number;
}

