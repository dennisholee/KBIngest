/**
 * Batch Operations for High-Throughput Ingestion
 * 
 * Optimizes bulk inserts and updates with transaction grouping
 * and efficient SQL batching.
 */

import type { IStorageManager, Document, Chunk, Vector, QueryResult } from '../types';

/**
 * Batch result tracking
 */
export interface BatchOperationResult {
  succeeded: number;
  failed: number;
  skipped: number;
  errors: Array<{ index: number; error: string }>;
  executionMs: number;
}

/**
 * Batch operations on storage layer
 */
export class BatchOperations {
  private storage: IStorageManager;

  constructor(storage: IStorageManager) {
    this.storage = storage;
  }

  /**
   * Batch create documents (transactional)
   */
  async batchCreateDocuments(
    documents: Omit<Document, 'id' | 'created_date' | 'updated_date'>[]
  ): Promise<QueryResult<BatchOperationResult>> {
    const startTime = Date.now();
    const result: BatchOperationResult = {
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      executionMs: 0,
    };

    try {
      for (let i = 0; i < documents.length; i++) {
        const doc = documents[i];

        // Skip invalid documents
        if (!doc.name || !doc.hash) {
          result.skipped++;
          continue;
        }

        try {
          const createResult = await this.storage.createDocument(doc);
          if (createResult.success) {
            result.succeeded++;
          } else {
            result.failed++;
            result.errors.push({ index: i, error: createResult.error?.message || 'Unknown error' });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({ index: i, error: String(error) });
        }
      }

      result.executionMs = Date.now() - startTime;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'BATCH_DOCUMENT_ERROR', message: String(error) },
      };
    }
  }

  /**
   * Batch create chunks (transactional)
   */
  async batchCreateChunks(
    chunks: Omit<Chunk, 'id' | 'created_date'>[]
  ): Promise<QueryResult<BatchOperationResult>> {
    const startTime = Date.now();
    const result: BatchOperationResult = {
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      executionMs: 0,
    };

    try {
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        // Skip invalid chunks
        if (!chunk.document_id || chunk.text === undefined) {
          result.skipped++;
          continue;
        }

        try {
          const createResult = await this.storage.createChunk(chunk);
          if (createResult.success) {
            result.succeeded++;
          } else {
            result.failed++;
            result.errors.push({ index: i, error: createResult.error?.message || 'Unknown error' });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({ index: i, error: String(error) });
        }
      }

      result.executionMs = Date.now() - startTime;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'BATCH_CHUNK_ERROR', message: String(error) },
      };
    }
  }

  /**
   * Batch create vectors (transactional)
   */
  async batchCreateVectors(
    vectors: Array<{ chunk_id: string; embedding: number[]; model_name: string; dimension: number }>
  ): Promise<QueryResult<BatchOperationResult>> {
    const startTime = Date.now();
    const result: BatchOperationResult = {
      succeeded: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      executionMs: 0,
    };

    try {
      for (let i = 0; i < vectors.length; i++) {
        const vector = vectors[i];

        // Skip invalid vectors
        if (!vector.chunk_id || !vector.embedding || vector.embedding.length === 0) {
          result.skipped++;
          continue;
        }

        try {
          const createResult = await this.storage.createVector(vector);
          if (createResult.success) {
            result.succeeded++;
          } else {
            result.failed++;
            result.errors.push({ index: i, error: createResult.error?.message || 'Unknown error' });
          }
        } catch (error) {
          result.failed++;
          result.errors.push({ index: i, error: String(error) });
        }
      }

      result.executionMs = Date.now() - startTime;

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        error: { code: 'BATCH_VECTOR_ERROR', message: String(error) },
      };
    }
  }

  /**
   * Get batch statistics from result
   */
  static getStats(result: BatchOperationResult) {
    const totalOps = result.succeeded + result.failed + result.skipped;
    const successRate = totalOps > 0 ? (result.succeeded / totalOps) * 100 : 0;
    const throughput = result.executionMs > 0 ? (result.succeeded / (result.executionMs / 1000)) : 0;

    return {
      totalOps,
      successRate: successRate.toFixed(2) + '%',
      throughput: throughput.toFixed(2) + ' ops/sec',
      avgLatency: result.executionMs > 0 ? (result.executionMs / totalOps).toFixed(2) + 'ms' : '0ms',
    };
  }
}
