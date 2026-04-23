import { MarkdownParser, PlaintextParser, PdfParser } from '../ingestion/FileParser';

describe('Document Ingestion Empty Content Validation', () => {
  describe('D5: Empty File Content Validation (MEDIUM Priority)', () => {
    test('should reject markdown with empty content after parsing (D5 FIX)', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('   \n\n\t  ', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'markdown', 'empty.md');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMPTY_FILE_CONTENT');
      expect((result.error?.details as Record<string, unknown>)?.reason).toBe('empty_after_parse');
    });

    test('should reject plaintext with no visible content (D5 FIX)', async () => {
      const parser = new PlaintextParser();
      const buffer = Buffer.from('   \n\n  \t\t  ', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'plaintext', 'empty.txt');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('EMPTY_FILE_CONTENT');
      expect((result.error?.details as Record<string, unknown>)?.reason).toBe('empty_after_trim');
    });

    test('should reject PDF with no extracted text (D5 FIX)', async () => {
      const parser = new PdfParser();
      const buffer = Buffer.from('%PDF-1.4\n%Invalid PDF with no text', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'pdf', 'empty.pdf');

      expect(result.success).toBe(false);
      expect(['EMPTY_FILE_CONTENT', 'PARSE_ERROR']).toContain(result.error?.code);
    });

    test('should include detailed error information (D5 FIX)', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'markdown', 'empty.md');

      expect(result.error?.details).toBeDefined();
      const details = result.error?.details as Record<string, unknown>;
      expect(details?.fileSize).toBe(0);
      expect(details?.reason).toBeDefined();
    });

    test('should accept markdown with valid content (D5 FIX)', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('# Title\n\nSome content here', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'markdown', 'valid.md');

      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('Title');
    });

    test('should accept plaintext with valid words (D5 FIX)', async () => {
      const parser = new PlaintextParser();
      const buffer = Buffer.from('This is valid plaintext content', 'utf-8');
      const result = await parser.parseBuffer(buffer, 'plaintext', 'valid.txt');

      expect(result.success).toBe(true);
      expect(result.data?.metadata?.wordCount).toBeGreaterThan(0);
    });

    test('should provide error reason for different empty scenarios (D5 FIX)', async () => {
      const parser = new MarkdownParser();

      const zeroBuffer = Buffer.from('', 'utf-8');
      const result1 = await parser.parseBuffer(zeroBuffer, 'markdown', 'zero.md');
      expect((result1.error?.details as Record<string, unknown>)?.reason).toBe('zero_size');

      const wsBuffer = Buffer.from('   \n\n   ', 'utf-8');
      const result2 = await parser.parseBuffer(wsBuffer, 'markdown', 'ws.md');
      expect((result2.error?.details as Record<string, unknown>)?.reason).toBe('empty_after_parse');
    });
  });
});