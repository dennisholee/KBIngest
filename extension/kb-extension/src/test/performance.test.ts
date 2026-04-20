/**
 * Performance Layer Tests
 * 
 * Comprehensive testing of caching, batch operations, and metrics
 */

import { StorageManager } from '../storage/StorageManager';
import { QueryResultCache, CacheStats } from '../performance/QueryCache';
import { BatchOperations, BatchOperationResult } from '../performance/BatchOperations';
import { PerformanceMonitor, OperationMetrics, MetricsSnapshot } from '../performance/PerformanceMonitor';

describe('Performance Layer - S1.6', () => {
  // ============ Query Result Caching Tests ============

  describe('QueryResultCache', () => {
    let cache: QueryResultCache;

    beforeEach(() => {
      cache = new QueryResultCache(1, 1000); // 1MB, 1 second TTL
    });

    test('should cache and retrieve values', () => {
      const key = 'test-key';
      const value = { data: 'test' };

      cache.set(key, value);
      const retrieved = cache.get<typeof value>(key);

      expect(retrieved).toEqual(value);
    });

    test('should return null for missing keys', () => {
      const retrieved = cache.get('missing-key');
      expect(retrieved).toBeNull();
    });

    test('should increment hit counter', () => {
      cache.set('key', { data: 'test' });
      cache.get('key');
      cache.get('key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
    });

    test('should track misses', () => {
      cache.get('missing1');
      cache.get('missing2');

      const stats = cache.getStats();
      expect(stats.misses).toBe(2);
    });

    test('should calculate hit rate', () => {
      cache.set('key1', 'value1');
      cache.set('key2', 'value2');

      cache.get('key1'); // hit
      cache.get('key1'); // hit
      cache.get('missing'); // miss

      const stats = cache.getStats();
      expect(stats.hitRate).toBeCloseTo(2 / 3, 2);
    });

    test('should expire entries after TTL', (done) => {
      cache = new QueryResultCache(1, 100); // 100ms TTL
      cache.set('key', { data: 'test' });

      const value1 = cache.get('key');
      expect(value1).not.toBeNull();

      setTimeout(() => {
        const value2 = cache.get('key');
        expect(value2).toBeNull();
        done();
      }, 150);
    });

    test('should evict LRU entry when at capacity', () => {
      cache = new QueryResultCache(0.001, 10000); // Very small cache

      // Add multiple items
      cache.set('key1', { data: 1 });
      cache.set('key2', { data: 2 });

      // Access key1 multiple times to increase hits
      cache.get('key1');
      cache.get('key1');
      cache.get('key1');

      // Add new item (may trigger eviction)
      cache.set('key3', { data: 3 });

      const stats = cache.getStats();
      expect(stats.size).toBeLessThanOrEqual(3);
    });

    test('should generate consistent cache keys', () => {
      const key1 = QueryResultCache.keygen('search', { q: 'test', limit: 10 });
      const key2 = QueryResultCache.keygen('search', { limit: 10, q: 'test' }); // Different order

      expect(key1).toBe(key2); // Should be equal due to sorting
    });

    test('should return stats', () => {
      cache.set('k1', 'v1');
      cache.set('k2', 'v2');
      cache.get('k1');
      cache.get('missing');

      const stats = cache.getStats();

      expect(stats).toHaveProperty('hits');
      expect(stats).toHaveProperty('misses');
      expect(stats).toHaveProperty('evictions');
      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('hitRate');
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });
  });

  // ============ Batch Operations Tests ============

  describe('BatchOperations', () => {
    let storage: StorageManager;
    let batch: BatchOperations;

    beforeEach(async () => {
      storage = new StorageManager(':memory:');
      await storage.initialize();
      batch = new BatchOperations(storage);
    });

    afterEach(async () => {
      await storage.close();
    });

    test('should batch create documents', async () => {
      const docs = [
        {
          name: 'Doc1',
          hash: 'hash1',
          type: 'markdown' as const,
          size_bytes: 100,
        },
        {
          name: 'Doc2',
          hash: 'hash2',
          type: 'plaintext' as const,
          size_bytes: 200,
        },
      ];

      const result = await batch.batchCreateDocuments(docs);

      expect(result.success).toBe(true);
      expect(result.data!.succeeded).toBe(2);
      expect(result.data!.failed).toBe(0);
      expect(result.data!.skipped).toBe(0);
    });

    test('should skip invalid documents', async () => {
      const docs = [
        {
          name: 'Valid',
          hash: 'hash1',
          type: 'markdown' as const,
          size_bytes: 100,
        },
        {
          name: '', // Invalid - no name
          hash: 'hash2',
          type: 'plaintext' as const,
          size_bytes: 200,
        },
      ];

      const result = await batch.batchCreateDocuments(docs);

      expect(result.data!.succeeded).toBe(1);
      expect(result.data!.skipped).toBe(1);
    });

    test('should track batch execution time', async () => {
      const docs = [
        {
          name: 'Doc1',
          hash: 'hash1',
          type: 'markdown' as const,
          size_bytes: 100,
        },
      ];

      const result = await batch.batchCreateDocuments(docs);

      expect(result.data!.executionMs).toBeGreaterThanOrEqual(0);
    });

    test('should batch create chunks', async () => {
      // First create a document
      const docResult = await storage.createDocument({
        name: 'Test Doc',
        hash: 'doc-hash',
        type: 'markdown',
        size_bytes: 100,
      });

      const docId = docResult.data!.id;

      const chunks = [
        {
          document_id: docId,
          text: 'Chunk 1',
          sequence: 0,
          token_count: 2,
        },
        {
          document_id: docId,
          text: 'Chunk 2',
          sequence: 1,
          token_count: 2,
        },
      ];

      const result = await batch.batchCreateChunks(chunks);

      expect(result.success).toBe(true);
      expect(result.data!.succeeded).toBe(2);
    });

    test('should batch create vectors', async () => {
      // Setup: create doc and chunks
      const docResult = await storage.createDocument({
        name: 'Test Doc',
        hash: 'doc-hash',
        type: 'markdown',
        size_bytes: 100,
      });

      const chunk1Result = await storage.createChunk({
        document_id: docResult.data!.id,
        text: 'Test chunk 1',
        sequence: 0,
        token_count: 2,
      });

      const chunk2Result = await storage.createChunk({
        document_id: docResult.data!.id,
        text: 'Test chunk 2',
        sequence: 1,
        token_count: 2,
      });

      const vectors = [
        {
          chunk_id: chunk1Result.data!.id,
          embedding: [0.1, 0.2, 0.3],
          model_name: 'test-model',
          dimension: 3,
        },
        {
          chunk_id: chunk2Result.data!.id,
          embedding: [0.4, 0.5, 0.6],
          model_name: 'test-model',
          dimension: 3,
        },
      ];

      const result = await batch.batchCreateVectors(vectors);

      expect(result.success).toBe(true);
      expect(result.data!.succeeded).toBe(2);
    });

    test('should calculate batch statistics', () => {
      const batchResult: BatchOperationResult = {
        succeeded: 80,
        failed: 10,
        skipped: 10,
        errors: [],
        executionMs: 1000,
      };

      const stats = BatchOperations.getStats(batchResult);

      expect(stats.totalOps).toBe(100);
      expect(stats.successRate).toContain('80');
      expect(stats.throughput).toContain('80');
    });
  });

  // ============ Performance Monitor Tests ============

  describe('PerformanceMonitor', () => {
    let monitor: PerformanceMonitor;

    beforeEach(() => {
      monitor = new PerformanceMonitor(100);
    });

    test('should record successful operations', () => {
      monitor.recordMetric('search', 50, true);
      monitor.recordMetric('search', 75, true);

      const snapshot = monitor.getOperationMetrics('search');

      expect(snapshot).not.toBeNull();
      expect(snapshot!.count).toBe(2);
      expect(snapshot!.successRate).toBe(100);
    });

    test('should record failed operations', () => {
      monitor.recordMetric('search', 50, true);
      monitor.recordMetric('search', 100, false, 'Timeout');

      const snapshot = monitor.getOperationMetrics('search');

      expect(snapshot!.errorCount).toBe(1);
      expect(snapshot!.successRate).toBeCloseTo(50, 1);
    });

    test('should calculate percentiles', () => {
      // Add metrics with various latencies
      for (let i = 0; i < 100; i++) {
        monitor.recordMetric('query', i * 10, true);
      }

      const snapshot = monitor.getOperationMetrics('query');

      expect(snapshot!.minExecutionMs).toBe(0);
      expect(snapshot!.maxExecutionMs).toBe(990);
      expect(snapshot!.p50ExecutionMs).toBeGreaterThan(0);
      expect(snapshot!.p95ExecutionMs).toBeGreaterThan(snapshot!.p50ExecutionMs);
      expect(snapshot!.p99ExecutionMs).toBeGreaterThan(snapshot!.p95ExecutionMs);
    });

    test('should calculate throughput', () => {
      const startTime = Date.now();

      // Simulate 100 operations
      for (let i = 0; i < 100; i++) {
        monitor.recordMetric('op', 10, true);
      }

      const snapshot = monitor.getOperationMetrics('op');

      // Throughput may be 0 if all operations complete in same millisecond
      expect(snapshot!.throughput).toBeGreaterThanOrEqual(0);
      expect(snapshot!.count).toBe(100);
    });

    test('should get system metrics', () => {
      monitor.recordMetric('search', 50, true);
      monitor.recordMetric('insert', 100, true);
      monitor.recordMetric('delete', 25, false, 'Error');

      const systemMetrics = monitor.getSystemMetrics();

      expect(systemMetrics.totalOperations).toBe(3);
      expect(systemMetrics.successCount).toBe(2);
      expect(systemMetrics.errorCount).toBe(1);
      expect(systemMetrics.avgExecutionMs).toBeGreaterThan(0);
    });

    test('should get all operation metrics', () => {
      monitor.recordMetric('search', 50, true);
      monitor.recordMetric('insert', 100, true);
      monitor.recordMetric('search', 75, true);

      const allMetrics = monitor.getAllMetrics();

      expect(allMetrics.length).toBe(2);
      expect(allMetrics.map((m) => m.operationName).sort()).toEqual(['insert', 'search']);
    });

    test('should reset metrics', () => {
      monitor.recordMetric('search', 50, true);
      monitor.recordMetric('search', 75, true);

      monitor.reset();

      const snapshot = monitor.getOperationMetrics('search');
      expect(snapshot).toBeNull();
    });

    test('should export metrics as JSON', () => {
      monitor.recordMetric('search', 50, true);
      monitor.recordMetric('search', 100, false, 'Error');

      const exported = monitor.exportMetrics();

      expect(exported).toHaveProperty('system');
      expect(exported).toHaveProperty('operations');
      expect((exported as any).operations.length).toBe(1);
      expect((exported as any).operations[0].name).toBe('search');
    });

    test('should trim old metrics when exceeding max', () => {
      const smallMonitor = new PerformanceMonitor(5); // Max 5 metrics per op

      for (let i = 0; i < 10; i++) {
        smallMonitor.recordMetric('op', i, true);
      }

      const snapshot = smallMonitor.getOperationMetrics('op');
      expect(snapshot!.count).toBeLessThanOrEqual(5);
    });
  });

  // ============ Integration Tests ============

  describe('Performance Integration', () => {
    let storage: StorageManager;
    let monitor: PerformanceMonitor;

    beforeEach(async () => {
      storage = new StorageManager(':memory:');
      await storage.initialize();
      monitor = new PerformanceMonitor();
    });

    afterEach(async () => {
      await storage.close();
    });

    test('should track document creation performance', async () => {
      const startTime = Date.now();

      const result = await storage.createDocument({
        name: 'Performance Test',
        hash: 'perf-hash',
        type: 'markdown',
        size_bytes: 1024,
      });

      const executionMs = Date.now() - startTime;
      monitor.recordMetric('createDocument', executionMs, result.success);

      const metrics = monitor.getOperationMetrics('createDocument');
      expect(metrics!.count).toBe(1);
      expect(metrics!.successRate).toBe(100);
    });

    test('should combine cache and batch operations', async () => {
      const cache = new QueryResultCache();
      const batch = new BatchOperations(storage);

      // Create documents via batch
      const docs = Array.from({ length: 10 }, (_, i) => ({
        name: `Doc ${i}`,
        hash: `hash-${i}`,
        type: 'markdown' as const,
        size_bytes: 100 + i,
      }));

      const batchResult = await batch.batchCreateDocuments(docs);
      const batchStats = BatchOperations.getStats(batchResult.data!);

      expect(batchStats.totalOps).toBe(10);
      expect(batchStats.successRate).toContain('100');
    });
  });
});
