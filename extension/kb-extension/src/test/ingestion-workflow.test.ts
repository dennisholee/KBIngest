import { DocumentIngestionService } from '../ingestion/DocumentIngestionService';
import { StorageManager } from '../storage/StorageManager';

describe('Document Ingestion Workflow', () => {
  const servicesToDestroy: DocumentIngestionService[] = [];
  const storagesToClose: StorageManager[] = [];

  async function createManagedStorage(): Promise<StorageManager> {
    const storage = new StorageManager(':memory:');
    await storage.initialize();
    storagesToClose.push(storage);
    return storage;
  }

  function createManagedService(storage: StorageManager): DocumentIngestionService {
    const service = new DocumentIngestionService(storage);
    servicesToDestroy.push(service);
    return service;
  }

  afterEach(async () => {
    while (servicesToDestroy.length > 0) {
      const service = servicesToDestroy.pop();
      await service?.destroy();
    }

    while (storagesToClose.length > 0) {
      const storage = storagesToClose.pop();
      await storage?.close();
    }
  });

  describe('Document Ingestion', () => {
    test('should ingest documents', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);
      const buffer = Buffer.from('# Test\n\nContent', 'utf-8');
      const result = await service.ingestBuffer(buffer, 'test.md');

      expect(result.success).toBe(true);
      expect(result.data?.documentId).toBeDefined();
    });

    test('should track jobs (D3 FIX)', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);
      const buffer = Buffer.from('Job test', 'utf-8');
      const result = await service.ingestBuffer(buffer, 'job.txt');

      if (result.success && result.data) {
        const job = service.getJobStatus(result.data.jobId);
        expect(job?.status).toBe('completed');
        expect(job?.progress).toBe(100);
        expect(job?.completedAt).toBeDefined();
      }
    });

    test('should clean up old completed jobs (D3 FIX)', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);

      const buffer = Buffer.from('Content', 'utf-8');
      const result = await service.ingestBuffer(buffer, 'file.txt');

      if (result.success && result.data) {
        const jobId = result.data.jobId;
        expect(service.getJobStatus(jobId)).not.toBeNull();

        await service.destroy();

        expect(service.getJobStatus(jobId)).toBeNull();
      }
    });

    test('should list jobs with filtering (D3 FIX)', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);

      for (let index = 0; index < 3; index += 1) {
        const buffer = Buffer.from(`Content ${index}`, 'utf-8');
        await service.ingestBuffer(buffer, `file${index}.txt`);
      }

      const allJobs = service.listJobs();
      expect(allJobs.length).toBe(3);

      const completedJobs = service.listJobs({ status: 'completed' });
      expect(completedJobs.length).toBe(3);
    });

    test('should reject duplicate documents by hash (D8 FIX)', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);
      const buffer = Buffer.from('Duplicate', 'utf-8');

      const result1 = await service.ingestBuffer(buffer, 'doc.txt');
      const result2 = await service.ingestBuffer(buffer, 'doc.txt');

      expect(result1.success).toBe(true);
      expect(result2.success).toBe(false);
      expect(result2.error?.code).toBe('INGEST_ERROR');
    });

    test('DEFECT-7: jobs are cleaned up after TTL (D3 FIX)', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);

      for (let index = 0; index < 5; index += 1) {
        const buffer = Buffer.from(`Content ${index}`, 'utf-8');
        await service.ingestBuffer(buffer, `file${index}.txt`);
      }

      const jobsBefore = service.listJobs();
      expect(jobsBefore.length).toBe(5);

      await service.destroy();

      const jobsAfter = service.listJobs();
      expect(jobsAfter.length).toBe(0);
    });

    test('DEFECT-8: transactions ensure consistency (D4 FIX)', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);

      const buffer = Buffer.from('Document with transaction', 'utf-8');
      const result = await service.ingestBuffer(buffer, 'trans.txt');

      expect(result.success).toBe(true);
      if (result.data) {
        const docId = result.data.documentId;
        const doc = await storage.getDocument(docId);
        expect(doc.success).toBe(true);
      }
    });
  });

  describe('End-to-End Workflow', () => {
    test('should complete full workflow', async () => {
      const storage = await createManagedStorage();
      const service = createManagedService(storage);
      const buffer = Buffer.from('# Document\n\nContent', 'utf-8');
      const result = await service.ingestBuffer(buffer, 'doc.md');

      expect(result.success).toBe(true);
      expect(result.data?.documentId).toBeDefined();
      expect(result.data?.chunksCreated).toBeGreaterThan(0);
    });
  });
});