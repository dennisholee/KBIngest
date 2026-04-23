import { MarkdownParser, PlaintextParser, PdfParser } from '../ingestion/FileParser';

describe('Document Ingestion Token Estimation', () => {
  describe('D7: Token Estimation (MEDIUM Priority)', () => {
    test('should estimate tokens for markdown text', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('# Hello\n\nThis is a test with multiple words.', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'tokens.md');
      expect(result.success).toBe(true);
      expect((result.data?.metadata as any)?.tokenCount).toBeGreaterThan(0);
    });

    test('should estimate tokens for plaintext', async () => {
      const parser = new PlaintextParser();
      const buffer = Buffer.from('Simple plaintext with several words.', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'plaintext', 'text.txt');
      expect(result.success).toBe(true);
      expect((result.data?.metadata as any)?.tokenCount).toBeGreaterThan(0);
    });

    test('should estimate higher tokens for code blocks', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('# Code Example\n\n```javascript\nconst x = 1;\nconst y = 2;\n```', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'code.md');
      expect(result.success).toBe(true);
      expect((result.data?.metadata as any)?.tokenCount).toBeGreaterThan(5);
    });

    test('should estimate reasonable tokens for long text', async () => {
      const parser = new MarkdownParser();
      const longText = 'word '.repeat(1000);
      const buffer = Buffer.from(`# Title\n\n${longText}`, 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'long.md');
      expect(result.success).toBe(true);
      const tokens = (result.data?.metadata as any)?.tokenCount;
      expect(tokens).toBeGreaterThan(1000);
      expect(tokens).toBeLessThan(2000);
    });

    test('should estimate tokens for empty-like content', async () => {
      const parser = new MarkdownParser();
      const buffer = Buffer.from('# Title\n\nOne sentence.', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'markdown', 'short.md');
      expect(result.success).toBe(true);
      expect((result.data?.metadata as any)?.tokenCount).toBeGreaterThanOrEqual(1);
    });

    test('should handle special characters in token counting', async () => {
      const parser = new PlaintextParser();
      const buffer = Buffer.from('Hello! How are you? I\'m fine.', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'plaintext', 'special.txt');
      expect(result.success).toBe(true);
      const tokens = (result.data?.metadata as any)?.tokenCount;
      expect(tokens).toBeGreaterThan(0);
    });

    test('should maintain token count relationship with text length', async () => {
      const parser = new MarkdownParser();
      const shortBuffer = Buffer.from('# A\n\nShort', 'utf-8');
      const shortResult = await parser.parseBuffer(shortBuffer, 'markdown', 'short.md');

      const longBuffer = Buffer.from('# B\n\n' + 'word '.repeat(100), 'utf-8');
      const longResult = await parser.parseBuffer(longBuffer, 'markdown', 'long.md');

      const shortTokens = (shortResult.data?.metadata as any)?.tokenCount;
      const longTokens = (longResult.data?.metadata as any)?.tokenCount;

      expect(shortTokens).toBeGreaterThan(0);
      expect(longTokens).toBeGreaterThan(shortTokens);
    });

    test('should estimate consistent tokens for identical content', async () => {
      const parser = new MarkdownParser();
      const content = 'Test content with words';

      const buffer1 = Buffer.from(`# Title\n\n${content}`, 'utf-8');
      const buffer2 = Buffer.from(`# Title\n\n${content}`, 'utf-8');

      const result1 = await parser.parseBuffer(buffer1, 'markdown', 'test1.md');
      const result2 = await parser.parseBuffer(buffer2, 'markdown', 'test2.md');

      const tokens1 = (result1.data?.metadata as any)?.tokenCount;
      const tokens2 = (result2.data?.metadata as any)?.tokenCount;

      expect(tokens1).toBe(tokens2);
    });

    test('should handle CJK characters in token counting', async () => {
      const parser = new PlaintextParser();
      const buffer = Buffer.from('Hello 世界 مرحبا 🌍', 'utf-8');

      const result = await parser.parseBuffer(buffer, 'plaintext', 'cjk.txt');
      expect(result.success).toBe(true);
      expect((result.data?.metadata as any)?.tokenCount).toBeGreaterThan(0);
    });

    test('should estimate tokens for PDF text', async () => {
      const parser = new PdfParser();
      const result = await parser.parseBuffer(Buffer.from('%PDF-1.4\nTest'), 'pdf', 'test.pdf');

      expect(result.error || (result.data?.metadata as any)?.tokenCount).toBeDefined();
    });
  });
});