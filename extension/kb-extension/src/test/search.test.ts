/**
 * SearchService Tests
 * 
 * Test coverage for full-text search, vector search, and hybrid search
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { DatabaseConnection } from '../storage/DatabaseConnection';
import { StorageManager } from '../storage/StorageManager';
import { SearchService, createSearchService } from '../search/SearchService';
import type { SearchRequest, SearchResult } from '../search/types';

describe('SearchService', () => {
  let db: Database.Database;
  let storageManager: StorageManager;
  let searchService: SearchService;

  beforeAll(async () => {
    // Use in-memory database for testing
    storageManager = new StorageManager(':memory:');
    await storageManager.initialize();
    
    // Get the underlying database instance
    const dbConnection = (storageManager as any).db;
    db = dbConnection.getConnection();
    searchService = createSearchService(db);
  });

  afterAll(async () => {
    searchService = null as any;
    await storageManager.close();
  });

  // ============ Full-Text Search Tests ============

  describe('Full-Text Search (FTS5)', () => {
    let docId: string;
    let chunkId1: string;
    let chunkId2: string;

    beforeAll(async () => {
      // Create test document
      const docResult = await storageManager.createDocument({
        name: 'TypeScript Guide',
        hash: 'ts-guide-hash',
        type: 'markdown',
        source_path: '/guides/typescript.md',
        size_bytes: 256,
      });

      if (!docResult.success || !docResult.data) {
        throw new Error('Failed to create test document');
      }
      docId = docResult.data.id;

      // Create chunks
      const chunk1Result = await storageManager.createChunk({
        document_id: docId,
        text: 'TypeScript extends JavaScript with type safety features',
        sequence: 0,
        token_count: 10,
      });

      if (!chunk1Result.success || !chunk1Result.data) {
        throw new Error('Failed to create chunk 1');
      }
      chunkId1 = chunk1Result.data.id;

      const chunk2Result = await storageManager.createChunk({
        document_id: docId,
        text: 'Interfaces and types provide strong compile-time type checking',
        sequence: 1,
        token_count: 11,
      });

      if (!chunk2Result.success || !chunk2Result.data) {
        throw new Error('Failed to create chunk 2');
      }
      chunkId2 = chunk2Result.data.id;
    });

    test('should search full-text with exact term', async () => {
      const result = await searchService.searchFullText('TypeScript', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0].text).toContain('TypeScript');
    });

    test('should search full-text with phrase', async () => {
      const result = await searchService.searchFullText('type safety', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
    });

    test('should return normalized FTS scores', async () => {
      const result = await searchService.searchFullText('TypeScript', 10);

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        const score = result.data[0].score;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    test('should respect limit parameter', async () => {
      const result = await searchService.searchFullText('TypeScript', 1);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBeLessThanOrEqual(1);
    });

    test('should return empty results for non-matching query', async () => {
      const result = await searchService.searchFullText('NonexistentTerm12345', 10);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(0);
    });
  });

  // ============ Vector Search Tests ============

  describe('Vector Search', () => {
    let docId: string;
    let chunkId: string;
    const testEmbedding = [0.1, 0.2, 0.3, 0.4];

    beforeAll(async () => {
      // Create document
      const docResult = await storageManager.createDocument({
        name: 'Vector Test Doc',
        hash: 'vector-doc-hash',
        type: 'plaintext',
        source_path: '/test/vector.txt',
        size_bytes: 128,
      });

      if (!docResult.success || !docResult.data) {
        throw new Error('Failed to create vector test document');
      }
      docId = docResult.data.id;

      // Create chunk
      const chunkResult = await storageManager.createChunk({
        document_id: docId,
        text: 'This is a test chunk for vector search',
        sequence: 0,
        token_count: 7,
      });

      if (!chunkResult.success || !chunkResult.data) {
        throw new Error('Failed to create vector test chunk');
      }
      chunkId = chunkResult.data.id;

      // Create vector
      const vectorResult = await storageManager.createVector({
        chunk_id: chunkId,
        embedding: testEmbedding,
        model_name: 'test-model',
        dimension: testEmbedding.length,
      });

      if (!vectorResult.success) {
        throw new Error('Failed to create vector');
      }
    });

    test('should search by vector similarity', async () => {
      const result = await searchService.searchVector(testEmbedding, 'test-model', 10);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
    });

    test('should return normalized vector scores', async () => {
      const result = await searchService.searchVector(testEmbedding, 'test-model', 10);

      if (result.data && result.data.length > 0) {
        const score = result.data[0].vectorScore!;
        expect(score).toBeGreaterThanOrEqual(0);
        expect(score).toBeLessThanOrEqual(1);
      }
    });

    test('should find exact embedding match with high score', async () => {
      const result = await searchService.searchVector(testEmbedding, 'test-model', 10);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBeGreaterThan(0);
      expect(result.data![0].vectorScore).toBeCloseTo(1.0, 2); // Exact match (with floating-point tolerance)
    });

    test('should find different embedding with lower score', async () => {
      const differentEmbedding = [0.5, 0.5, 0.5, 0.5];
      const result = await searchService.searchVector(differentEmbedding, 'test-model', 10);

      expect(result.success).toBe(true);
      if (result.data && result.data.length > 0) {
        const score = result.data[0].vectorScore!;
        expect(score).toBeLessThan(1.0);
        expect(score).toBeGreaterThan(0);
      }
    });

    test('should handle non-existent model gracefully', async () => {
      const result = await searchService.searchVector(testEmbedding, 'nonexistent-model', 10);

      expect(result.success).toBe(true);
      expect(result.data!.length).toBe(0);
    });
  });

  // ============ Hybrid Search Tests ============

  describe('Hybrid Search (FTS + Vector)', () => {
    let docId: string;

    beforeAll(async () => {
      const docResult = await storageManager.createDocument({
        name: 'Hybrid Test Document',
        hash: 'hybrid-doc-hash',
        type: 'markdown',
        source_path: '/test/hybrid.md',
        size_bytes: 256,
      });

      if (!docResult.success || !docResult.data) {
        throw new Error('Failed to create hybrid test document');
      }
      docId = docResult.data.id;

      // Create chunks
      const chunk1Result = await storageManager.createChunk({
        document_id: docId,
        text: 'Machine learning is a subset of artificial intelligence',
        sequence: 0,
        token_count: 9,
      });

      if (!chunk1Result.success || !chunk1Result.data) {
        throw new Error('Failed to create hybrid chunk 1');
      }

      // Add vector to chunk 1
      await storageManager.createVector({
        chunk_id: chunk1Result.data.id,
        embedding: [0.1, 0.1, 0.1, 0.1],
        model_name: 'hybrid-model',
        dimension: 4,
      });

      const chunk2Result = await storageManager.createChunk({
        document_id: docId,
        text: 'Deep learning uses neural networks with multiple layers',
        sequence: 1,
        token_count: 9,
      });

      if (!chunk2Result.success || !chunk2Result.data) {
        throw new Error('Failed to create hybrid chunk 2');
      }

      // Add vector to chunk 2
      await storageManager.createVector({
        chunk_id: chunk2Result.data.id,
        embedding: [0.2, 0.2, 0.2, 0.2],
        model_name: 'hybrid-model',
        dimension: 4,
      });
    });

    test('should perform hybrid search with both query and embedding', async () => {
      const request: SearchRequest = {
        query: 'machine learning',
        embedding: [0.1, 0.1, 0.1, 0.1],
        embeddingModel: 'hybrid-model',
        enableFts: true,
        enableVector: true,
        limit: 10,
      };

      const result = await searchService.searchHybrid(request);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.results.length).toBeGreaterThan(0);
      expect(result.data!.strategy).toBe('hybrid');
    });

    test('should combine FTS and vector scores with hybrid weight', async () => {
      const request: SearchRequest = {
        query: 'learning',
        embedding: [0.1, 0.1, 0.1, 0.1],
        embeddingModel: 'hybrid-model',
        hybridWeight: 0.5,
        limit: 10,
      };

      const result = await searchService.searchHybrid(request);

      expect(result.success).toBe(true);
      if (result.data && result.data.results.length > 0) {
        const firstResult = result.data.results[0];
        expect(firstResult.score).toBeGreaterThan(0);
        expect(firstResult.score).toBeLessThanOrEqual(1);
      }
    });

    test('should respect hybrid weight parameter', async () => {
      const request1: SearchRequest = {
        query: 'learning',
        embedding: [0.1, 0.1, 0.1, 0.1],
        embeddingModel: 'hybrid-model',
        hybridWeight: 0.1, // Favor FTS
        limit: 5,
      };

      const request2: SearchRequest = {
        query: 'learning',
        embedding: [0.1, 0.1, 0.1, 0.1],
        embeddingModel: 'hybrid-model',
        hybridWeight: 0.9, // Favor vector
        limit: 5,
      };

      const result1 = await searchService.searchHybrid(request1);
      const result2 = await searchService.searchHybrid(request2);

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(true);
      // Results may differ based on weights
    });

    test('should return execution time in response', async () => {
      const request: SearchRequest = {
        query: 'neural',
        embedding: [0.2, 0.2, 0.2, 0.2],
        embeddingModel: 'hybrid-model',
        limit: 10,
      };

      const result = await searchService.searchHybrid(request);

      expect(result.success).toBe(true);
      expect(result.data!.executionMs).toBeGreaterThanOrEqual(0);
    });

    test('should support FTS-only search', async () => {
      const request: SearchRequest = {
        query: 'neural networks',
        enableFts: true,
        enableVector: false,
        limit: 10,
      };

      const result = await searchService.searchHybrid(request);

      expect(result.success).toBe(true);
      expect(result.data!.strategy).toBe('hybrid');
    });

    test('should support vector-only search', async () => {
      const request: SearchRequest = {
        embedding: [0.1, 0.1, 0.1, 0.1],
        embeddingModel: 'hybrid-model',
        enableFts: false,
        enableVector: true,
        limit: 10,
      };

      const result = await searchService.searchHybrid(request);

      expect(result.success).toBe(true);
      expect(result.data!.results.length).toBeGreaterThan(0);
    });
  });

  // ============ Reranking Tests ============

  describe('Result Reranking', () => {
    test('should boost exact phrase matches', async () => {
      const query = 'machine learning';
      const results: SearchResult[] = [
        {
          chunkId: '1',
          documentId: 'doc1',
          text: 'Machine learning is important',
          documentName: 'ML Guide',
          sequence: 0,
          score: 0.8,
        },
        {
          chunkId: '2',
          documentId: 'doc2',
          text: 'Deep learning techniques',
          documentName: 'DL Guide',
          sequence: 0,
          score: 0.7,
        },
      ];

      const reranked = await searchService.rerank(results, query);

      expect(reranked[0].score).toBeGreaterThanOrEqual(results[0].score);
    });

    test('should not exceed score of 1.0 after reranking', async () => {
      const results: SearchResult[] = [
        {
          chunkId: '1',
          documentId: 'doc1',
          text: 'Test content',
          documentName: 'Test',
          sequence: 0,
          score: 0.9,
        },
      ];

      const reranked = await searchService.rerank(results, 'test');

      expect(reranked[0].score).toBeLessThanOrEqual(1.0);
    });
  });

  // ============ Search Statistics Tests ============

  describe('Search Statistics', () => {
    test('should return search statistics', async () => {
      const stats = await searchService.getSearchStats();

      expect(stats).toBeDefined();
      expect(stats.totalDocuments).toBeGreaterThanOrEqual(0);
      expect(stats.totalChunks).toBeGreaterThanOrEqual(0);
      expect(stats.indexedChunks).toBeGreaterThanOrEqual(0);
      expect(stats.lastIndexUpdate).toBeInstanceOf(Date);
    });

    test('should track indexed chunk count', async () => {
      const stats = await searchService.getSearchStats();

      expect(stats.indexedChunks).toBeLessThanOrEqual(stats.totalChunks);
    });
  });

  // ============ Error Handling Tests ============

  describe('Error Handling', () => {
    test('should handle FTS search errors gracefully', async () => {
      // Empty query should return error or empty results
      const result = await searchService.searchFullText('');

      // Empty queries may fail in FTS5 or return no results
      if (!result.success) {
        expect(result.error).toBeDefined();
      } else {
        expect(result.data!.length).toBe(0);
      }
    });

    test('should handle vector search with mismatched dimensions', async () => {
      const result = await searchService.searchVector([0.1, 0.2], 'test-model', 10);

      // Should not throw, but may return empty results
      expect(result).toBeDefined();
    });

    test('should handle hybrid search with no results', async () => {
      const request: SearchRequest = {
        query: 'xyzabc12345nonexistent',
        embedding: [0.5, 0.5, 0.5, 0.5],
        embeddingModel: 'nonexistent-model',
        limit: 10,
      };

      const result = await searchService.searchHybrid(request);

      expect(result.success).toBe(true);
      expect(result.data!.results.length).toBe(0);
    });
  });
});
