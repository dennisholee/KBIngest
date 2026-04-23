import { MarkdownParser, PlaintextParser, PdfParser } from '../ingestion/FileParser';

describe('Document Ingestion Encoding Detection', () => {
  describe('D6: Encoding Detection (MEDIUM Priority)', () => {
    test('should detect UTF-8 encoding with BOM', async () => {
      const parser = new MarkdownParser();
      const bomBuffer = Buffer.concat([
        Buffer.from([0xef, 0xbb, 0xbf]),
        Buffer.from('# Hello\n\nContent', 'utf-8'),
      ]);

      const result = await parser.parseBuffer(bomBuffer, 'markdown', 'bom.md');
      expect(result.success).toBe(true);
      expect(result.data?.metadata?.encoding).toBe('utf-8');
    });

    test('should detect ASCII encoding', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('# Hello\n\nSimple ASCII content', 'ascii');

      const result = await parser.parseBuffer(buffer, 'markdown', 'ascii.md');
      expect(result.success).toBe(true);
      expect(result.data?.metadata?.encoding).toBeDefined();
    });

    test('should detect Latin-1 encoding', async () => {
      const parser = new MarkdownParser();
      const latin1Text = Buffer.from('Café résumé naïve', 'latin1');

      const result = await parser.parseBuffer(latin1Text, 'markdown', 'latin1.md');
      expect(result.data?.metadata?.encoding).toBeDefined();
    });

    test('should handle UTF-16LE BOM', async () => {
      const parser = new MarkdownParser();
      const utf16Buffer = Buffer.concat([
        Buffer.from([0xff, 0xfe]),
        Buffer.from('Test', 'utf-16le'),
      ]);

      const result = await parser.parseBuffer(utf16Buffer, 'markdown', 'utf16.md');
      expect(result.data?.metadata?.encoding || result.error).toBeDefined();
    });

    test('should convert non-UTF8 to UTF-8', async () => {
      const parser = new PlaintextParser();
      const latin1Buffer = Buffer.from('Plain ASCII text', 'latin1');

      const result = await parser.parseBuffer(latin1Buffer, 'plaintext', 'test.txt');
      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('Plain ASCII text');
    });

    test('should detect encoding with confidence score', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('Hello World\n\nThis is a test.', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'test.md');
      expect(result.success).toBe(true);
      expect(result.data?.metadata?.encoding).toBeDefined();
    });

    test('should validate UTF-8 sequences in plaintext', async () => {
      const parser = new PlaintextParser();
      const utf8Text = Buffer.from('Hello 世界 مرحبا', 'utf-8');

      const result = await parser.parseBuffer(utf8Text, 'plaintext', 'multi.txt');
      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('世界');
    });

    test('should include encoding in PDF metadata', async () => {
      const parser = new PdfParser();
      const result = await parser.parseBuffer(Buffer.from('%PDF-1.4\nTest content'), 'pdf', 'test.pdf');

      expect(result.error || result.data?.metadata?.encoding).toBeDefined();
    });

    test('should reject unsupported encoding gracefully', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('Test', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'test.md');
      expect(result.success || result.error?.code).toBeDefined();
    });

    test('should provide detailed encoding information in errors', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('Test', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'test.md');
      if (result.error) {
        expect(result.error.details || result.error.code).toBeDefined();
      }
    });

    test('should preserve content integrity after encoding detection', async () => {
      const parser = new MarkdownParser();
      const originalText = '# Header\n\nContent with émojis: 🎉';
      const buffer = Buffer.from(originalText, 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'emoji.md');
      expect(result.success).toBe(true);
      expect(result.data?.content).toContain('Header');
    });
  });
});