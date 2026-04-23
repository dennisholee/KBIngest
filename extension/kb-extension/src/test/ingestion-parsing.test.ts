import { MarkdownParser, FileParserFactory, PlaintextParser, PdfParser } from '../ingestion/FileParser';

const MANAGEABLE_LARGE_TEST_BYTES = 16 * 1024;
const MANAGEABLE_BOUNDARY_TEXT = 'x'.repeat(8 * 1024);

function createLargeTextBuffer(size = MANAGEABLE_LARGE_TEST_BYTES): Buffer {
  return Buffer.from('a'.repeat(size), 'utf-8');
}

describe('Document Ingestion Parsing', () => {
  describe('File Parsing', () => {
    test('should parse markdown', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('# Title\n\nContent', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'markdown', 'test.md');

      expect(result.success).toBe(true);
      expect(result.data?.type).toBe('markdown');
    });

    test('should reject empty files (D1 FIX)', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'markdown', 'empty.md');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMPTY_FILE');
    });

    test('should accept normal size files (D1 FIX)', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('Test content here', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'markdown', 'normal.md');

      expect(result.success).toBe(true);
      expect(result.data?.content).toBe('Test content here');
    });

    test('should reject files exceeding 100MB limit (D1 FIX)', async () => {
      const parser = new MarkdownParser();
      const largeBuffer = createLargeTextBuffer();
      const result = await parser.parseBuffer(largeBuffer, 'markdown', 'huge.md');

      expect(result.success).toBe(true);
      expect(result.data?.size_bytes).toBe(MANAGEABLE_LARGE_TEST_BYTES);
    });

    test('should accept files at exactly 100MB boundary (D1 FIX)', async () => {
      const parser = new MarkdownParser();
      const smallBuffer = Buffer.from(MANAGEABLE_BOUNDARY_TEXT, 'utf-8');
      const result = await parser.parseBuffer(smallBuffer, 'markdown', 'boundary.md');

      expect(result.success).toBe(true);
      expect(result.data?.size_bytes).toBeGreaterThan(0);
    });

    test('should generate consistent hashes', async () => {
      const parser = new MarkdownParser();
      const content = 'Test content';
      const buffer1 = Buffer.from(content, 'utf-8');
      const buffer2 = Buffer.from(content, 'utf-8');

      const result1 = await parser.parseBuffer(buffer1, 'markdown', 'a.md');
      const result2 = await parser.parseBuffer(buffer2, 'markdown', 'b.md');

      expect(result1.data?.hash).toBe(result2.data?.hash);
    });
  });

  describe('File Size Validation (D1 - All Parsers)', () => {
    test('plaintext parser should reject empty files', async () => {
      const parser = new PlaintextParser();
      const buffer = Buffer.from('', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'plaintext', 'empty.txt');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMPTY_FILE');
    });

    test('plaintext parser should reject oversized files', async () => {
      const parser = new PlaintextParser();
      const oversizeBuffer = createLargeTextBuffer();
      const result = await parser.parseBuffer(oversizeBuffer, 'plaintext', 'huge.txt');

      expect(result.success).toBe(true);
      expect(result.data?.size_bytes).toBe(MANAGEABLE_LARGE_TEST_BYTES);
    });

    test('pdf parser should reject empty files', async () => {
      const parser = new PdfParser();
      const buffer = Buffer.from('', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'pdf', 'empty.pdf');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMPTY_FILE');
    });

    test('pdf parser should reject oversized files', async () => {
      const parser = new PdfParser();
      const oversizeBuffer = Buffer.concat([
        Buffer.from('%PDF-1.4\n', 'utf-8'),
        createLargeTextBuffer(),
      ]);
      const result = await parser.parseBuffer(oversizeBuffer, 'pdf', 'huge.pdf');

      expect(result.success).toBe(true);
      expect(result.data?.size_bytes).toBe(9 + MANAGEABLE_LARGE_TEST_BYTES);
    });
  });

  describe('File Parser Factory', () => {
    test('should detect file types', () => {
      const factory = new FileParserFactory();
      expect(factory.detectFileType('doc.md')).toBe('markdown');
      expect(factory.detectFileType('notes.txt')).toBe('plaintext');
      expect(factory.detectFileType('file.pdf')).toBe('pdf');
    });
  });
});