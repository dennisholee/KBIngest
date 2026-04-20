/**
 * Document Ingestion Service
 * 
 * Orchestrates the complete document ingestion workflow:
 * Parse → Chunk → Generate Embeddings → Store in Database → Index for Search
 */

import { randomUUID } from 'crypto';
import type {
  ParsedFile,
  DocumentChunk,
  ChunkingConfig,
  IngestionJob,
  IngestionResult,
  IDocumentIngestion,
} from './types';
import { FileParserFactory } from './FileParser';
import { ChunkingStrategyFactory } from './ChunkingStrategy';
import type { IStorageManager } from '../types';
import type { QueryResult } from '../types';

/**
 * Default chunking configuration
 */
const DEFAULT_CHUNKING_CONFIG: ChunkingConfig = {
  strategy: 'fixed-size',
  chunkSize: 512, // tokens
  chunkOverlap: 50,
  minChunkSize: 50,
  maxChunkSize: 2048,
  preserveHeadings: true,
};

/**
 * Job cleanup configuration
 */
const JOB_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 hours
const JOB_CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // Cleanup every hour

/**
 * Helper to create error response
 */
function createErrorResult<T>(message: string, code: string = 'INGEST_ERROR'): QueryResult<T> {
  return {
    success: false,
    error: { code, message },
    data: undefined,
  };
}

/**
 * Document Ingestion Service Implementation
 */
export class DocumentIngestionService implements IDocumentIngestion {
  private storageManager: IStorageManager;
  private fileParserFactory: FileParserFactory;
  private chunkingStrategyFactory: ChunkingStrategyFactory;
  private jobs: Map<string, IngestionJob>;
  private cleanupInterval: NodeJS.Timeout | null;
  private embeddingService?: { generateEmbedding: (text: string) => Promise<number[]> };

  constructor(storageManager: IStorageManager, embeddingService?: any) {
    this.storageManager = storageManager;
    this.fileParserFactory = new FileParserFactory();
    this.chunkingStrategyFactory = new ChunkingStrategyFactory();
    this.jobs = new Map();
    this.cleanupInterval = null;
    this.embeddingService = embeddingService;
    this.startCleanupInterval();
  }

  /**
   * Start the job cleanup interval (D3 Fix)
   * Removes completed/failed jobs after TTL to prevent memory leaks
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    this.cleanupInterval = setInterval(() => {
      this.cleanupCompletedJobs();
    }, JOB_CLEANUP_INTERVAL_MS);

    // Prevent process from keeping alive if no other work
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Clean up old completed/failed jobs (D3 Fix)
   */
  private cleanupCompletedJobs(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [jobId, job] of this.jobs.entries()) {
      if (job.status === 'completed' || job.status === 'failed') {
        const jobAge = now - (job.completedAt?.getTime() ?? 0);
        if (jobAge > JOB_RETENTION_MS) {
          toDelete.push(jobId);
        }
      }
    }

    toDelete.forEach(jobId => this.jobs.delete(jobId));
  }

  /**
   * Destroy the service and clean up resources (D3 Fix)
   */
  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.jobs.clear();
  }

  /**
   * Ingest a file from path
   */
  async ingestFile(filePath: string, config?: ChunkingConfig): Promise<QueryResult<IngestionResult>> {
    try {
      // Detect file type
      const fileType = this.fileParserFactory.detectFileType(filePath);
      if (!fileType) {
        return createErrorResult(`Unsupported file type: ${filePath}`);
      }

      // Get appropriate parser
      const parser = this.fileParserFactory.getParser(fileType);
      if (!parser) {
        return createErrorResult(`No parser available for file type: ${fileType}`);
      }

      // Parse file
      const parseResult = await parser.parse(filePath);
      if (!parseResult.success || !parseResult.data) {
        return createErrorResult(parseResult.error?.message || 'Failed to parse file');
      }

      // Proceed with ingestion
      return this.ingestParsedFile(parseResult.data, config);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'File ingestion failed');
    }
  }

  /**
   * Ingest from buffer
   */
  async ingestBuffer(
    buffer: Buffer,
    fileName: string,
    config?: ChunkingConfig
  ): Promise<QueryResult<IngestionResult>> {
    try {
      // Detect file type from name
      const fileType = this.fileParserFactory.detectFileType(fileName);
      if (!fileType) {
        return createErrorResult(`Unsupported file type: ${fileName}`);
      }

      // Get appropriate parser
      const parser = this.fileParserFactory.getParser(fileType);
      if (!parser) {
        return createErrorResult(`No parser available for file type: ${fileType}`);
      }

      // Parse buffer
      const parseResult = await parser.parseBuffer(buffer, fileType, fileName);
      if (!parseResult.success || !parseResult.data) {
        return createErrorResult(parseResult.error?.message || 'Failed to parse buffer');
      }

      // Proceed with ingestion
      return this.ingestParsedFile(parseResult.data, config);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Buffer ingestion failed');
    }
  }

  /**
   * Batch ingest multiple files
   */
  async batchIngest(filePaths: string[], config?: ChunkingConfig): Promise<QueryResult<IngestionResult[]>> {
    try {
      const results: IngestionResult[] = [];
      const errors: string[] = [];

      for (const filePath of filePaths) {
        const result = await this.ingestFile(filePath, config);
        if (result.success && result.data) {
          results.push(result.data);
        } else {
          errors.push(`${filePath}: ${result.error?.message}`);
        }
      }

      if (errors.length > 0) {
        console.warn('Batch ingestion completed with errors:', errors);
      }

      return {
        success: results.length > 0,
        error: errors.length === filePaths.length ? { code: 'BATCH_ERROR', message: errors[0] } : undefined,
        data: results,
      };
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Batch ingestion failed');
    }
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): IngestionJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * List jobs with optional filtering
   */
  listJobs(filter?: { status?: string; limit?: number }): IngestionJob[] {
    let jobs = Array.from(this.jobs.values());

    if (filter?.status) {
      jobs = jobs.filter(j => j.status === filter.status);
    }

    if (filter?.limit) {
      jobs = jobs.slice(0, filter.limit);
    }

    return jobs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status !== 'completed' && job.status !== 'failed') {
      job.status = 'failed';
      job.error = 'Job cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Private: Ingest parsed file
   */
  private async ingestParsedFile(file: ParsedFile, config?: ChunkingConfig): Promise<QueryResult<IngestionResult>> {
    const startTime = Date.now();
    const jobId = randomUUID();
    const chunkingConfig = config || DEFAULT_CHUNKING_CONFIG;

    // Create ingestion job
    const job: IngestionJob = {
      id: jobId,
      fileName: file.name,
      fileType: file.type,
      status: 'parsing',
      progress: 0,
      totalChunks: 0,
      processedChunks: 0,
      createdAt: new Date(),
      startedAt: new Date(),
      metadata: {
        fileHash: file.hash,
        fileSizeBytes: file.size_bytes,
      },
    };

    this.jobs.set(jobId, job);

    try {
      // Step 1: Chunk the document
      job.status = 'chunking';
      job.progress = 25;

      const strategy = this.chunkingStrategyFactory.getStrategy(chunkingConfig.strategy);
      if (!strategy) {
        throw new Error(`Unknown chunking strategy: ${chunkingConfig.strategy}`);
      }

      const chunkResult = await strategy.chunk(file, chunkingConfig);
      if (!chunkResult.success || !chunkResult.data) {
        throw new Error(chunkResult.error?.message || 'Chunking failed');
      }

      const chunks = chunkResult.data.chunks;
      job.totalChunks = chunks.length;
      job.progress = 50;

      // Step 2: Begin transaction for storage operations (D4 Fix)
      job.status = 'storing';
      await this.storageManager.beginTransaction();

      try {
        // Store document
        const docResult = await this.storageManager.createDocument({
          name: file.name,
          type: file.type,
          size_bytes: file.size_bytes,
          hash: file.hash,
          metadata: {
            word_count: file.metadata?.wordCount || 0,
            language: file.metadata?.language || 'english',
          },
        });

        if (!docResult.success) {
          throw new Error(`Failed to store document: ${docResult.error}`);
        }

        const documentId = docResult.data!.id;
        let chunksCreated = 0;
        let vectorsCreated = 0;

        // Step 3: Store chunks
        job.progress = 60;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const chunkResult = await this.storageManager.createChunk({
            document_id: documentId,
            sequence: chunk.sequence,
            text: chunk.text,
            token_count: chunk.token_count,
          });

          if (chunkResult.success) {
            chunksCreated++;
            job.processedChunks = i + 1;
          } else {
            throw new Error(`Failed to store chunk: ${chunkResult.error?.message}`);
          }
        }

        // Step 4: Generate embeddings (if service available)
        if (this.embeddingService && this.embeddingService.generateEmbedding) {
          job.status = 'embedding';
          job.progress = 75;

          // Get all stored chunks
          const chunksQueryResult = await this.storageManager.listChunksByDocument(documentId);
          if (chunksQueryResult.success && chunksQueryResult.data) {
            for (const storedChunk of chunksQueryResult.data) {
              try {
                const embedding = await this.embeddingService.generateEmbedding(storedChunk.text);
                const vectorResult = await this.storageManager.createVector({
                  chunk_id: storedChunk.id,
                  embedding,
                  model_name: 'default',
                  dimension: embedding.length,
                });

                if (vectorResult.success) {
                  vectorsCreated++;
                }
              } catch (err) {
                // Continue on embedding errors - vectors are optional
                console.warn(`Failed to generate embedding for chunk ${storedChunk.id}:`, err);
              }
            }
          }
        }

        // Commit transaction on success (D4 Fix)
        await this.storageManager.commit();

        job.status = 'completed';
        job.progress = 100;
        job.completedAt = new Date();

        const executionMs = Date.now() - startTime;

        const result: IngestionResult = {
          jobId,
          documentId,
          chunksCreated,
          vectorsCreated,
          executionMs,
          success: true,
        };

        return {
          success: true,
          data: result,
        };
      } catch (storageError) {
        // Rollback transaction on error (D4 Fix)
        await this.storageManager.rollback();
        throw storageError;
      }
    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : 'Ingestion failed';
      job.completedAt = new Date();

      return createErrorResult(job.error);
    }
  }
}

/**
 * Helper to register the ingestion service with extension context
 */
export function createDocumentIngestionService(
  storageManager: IStorageManager,
  embeddingService?: any
): DocumentIngestionService {
  return new DocumentIngestionService(storageManager, embeddingService);
}
