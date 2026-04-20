/**
 * File Parser Implementation
 * 
 * Handles parsing of different file types (markdown, plaintext, PDF).
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import type { ParsedFile, SupportedFileType, IFileParser, QueryError } from './types';
import type { QueryResult } from '../types';
import { EncodingDetector } from './EncodingDetector';
import { TokenCounter } from './TokenCounter';

/**
 * Maximum file size: 100MB
 * Prevents DoS attacks and OOM crashes from oversized files
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB limit

/**
 * Helper to create error response with optional details
 */
function createErrorResult<T>(message: string, code: string = 'PARSE_ERROR', details?: Record<string, unknown>): QueryResult<T> {
  return {
    success: false,
    error: { code, message, details },
    data: undefined,
  };
}

/**
 * Base file parser with common utilities
 */
abstract class BaseFileParser implements IFileParser {
  protected supportedType: SupportedFileType;

  constructor(supportedType: SupportedFileType) {
    this.supportedType = supportedType;
  }

  abstract parse(filePath: string): Promise<QueryResult<ParsedFile>>;
  abstract parseBuffer(buffer: Buffer, fileType: SupportedFileType, fileName: string): Promise<QueryResult<ParsedFile>>;

  canParse(fileType: SupportedFileType): boolean {
    return fileType === this.supportedType;
  }

  protected generateHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex');
  }

  protected countWords(text: string): number {
    return text.split(/\s+/).filter(word => word.length > 0).length;
  }

  protected async readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf-8', (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }
}

/**
 * Markdown File Parser
 */
export class MarkdownParser extends BaseFileParser {
  constructor() {
    super('markdown');
  }

  async parse(filePath: string): Promise<QueryResult<ParsedFile>> {
    try {
      const content = await this.readFile(filePath);
      const fileName = path.basename(filePath);
      return this.parseBuffer(Buffer.from(content, 'utf-8'), 'markdown', fileName);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Failed to parse markdown file');
    }
  }

  async parseBuffer(
    buffer: Buffer,
    fileType: SupportedFileType,
    fileName: string
  ): Promise<QueryResult<ParsedFile>> {
    try {
      // D5: Validate file size
      if (buffer.length === 0) {
        return createErrorResult(
          'File is empty (0 bytes)',
          'EMPTY_FILE',
          { fileSize: 0, reason: 'zero_size' }
        );
      }
      if (buffer.length > MAX_FILE_SIZE) {
        return createErrorResult(
          `File size ${buffer.length} bytes exceeds maximum ${MAX_FILE_SIZE} bytes`,
          'FILE_TOO_LARGE',
          { fileSize: buffer.length, maxSize: MAX_FILE_SIZE }
        );
      }

      if (fileType !== 'markdown') {
        return createErrorResult('MarkdownParser only supports markdown files');
      }

      // D6: Detect encoding
      const encodingResult = EncodingDetector.detectEncoding(buffer);
      if (!EncodingDetector.isSupportedEncoding(encodingResult.encoding)) {
        return createErrorResult(
          `Unsupported encoding detected: ${encodingResult.encoding}`,
          'UNSUPPORTED_ENCODING',
          { detectedEncoding: encodingResult.encoding, confidence: encodingResult.confidence }
        );
      }

      // D6: Convert to UTF-8 if needed
      let content: string;
      try {
        content = EncodingDetector.convertToUtf8(buffer, encodingResult.encoding);
      } catch (error) {
        return createErrorResult(
          `Failed to convert from ${encodingResult.encoding} to UTF-8`,
          'ENCODING_CONVERSION_FAILED',
          { sourceEncoding: encodingResult.encoding, error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
      
      // D5: Check for empty content after parsing
      if (content.trim().length === 0) {
        return createErrorResult(
          'File has no visible content after parsing',
          'EMPTY_FILE_CONTENT',
          { fileSize: buffer.length, contentLength: content.length, reason: 'empty_after_parse' }
        );
      }

      const hash = this.generateHash(content);
      const wordCount = this.countWords(content);
      
      // D5: Check for empty metadata (no headings/structure)
      if (wordCount === 0) {
        return createErrorResult(
          'File has no recognizable content structure',
          'EMPTY_FILE_CONTENT',
          { fileSize: buffer.length, wordCount: 0, reason: 'no_visible_words' }
        );
      }

      // D7: Estimate token count
      const tokenCount = TokenCounter.estimateTokens(content);

      const parsed: ParsedFile = {
        name: fileName,
        type: 'markdown',
        content,
        size_bytes: buffer.length,
        hash,
        metadata: {
          encoding: encodingResult.encoding,
          wordCount,
          language: this.detectLanguage(content),
          tokenCount,
        },
      };

      return {
        success: true,
        data: parsed,
      };
    } catch (error) {
      return createErrorResult(
        error instanceof Error ? error.message : 'Failed to parse markdown buffer',
        'PARSE_ERROR',
        { reason: 'parse_exception' }
      );
    }
  }

  private detectLanguage(content: string): string {
    // Simple language detection based on content patterns
    if (content.includes('```python') || content.includes('def ') || content.includes('import ')) {
      return 'mixed (python)';
    }
    if (
      content.includes('```javascript') ||
      content.includes('```typescript') ||
      content.includes('const ') ||
      content.includes('function ')
    ) {
      return 'mixed (javascript)';
    }
    if (content.includes('```java') || content.includes('public class') || content.includes('package ')) {
      return 'mixed (java)';
    }
    return 'english';
  }
}

/**
 * Plaintext File Parser
 */
export class PlaintextParser extends BaseFileParser {
  constructor() {
    super('plaintext');
  }

  async parse(filePath: string): Promise<QueryResult<ParsedFile>> {
    try {
      const content = await this.readFile(filePath);
      const fileName = path.basename(filePath);
      return this.parseBuffer(Buffer.from(content, 'utf-8'), 'plaintext', fileName);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Failed to parse plaintext file');
    }
  }

  async parseBuffer(
    buffer: Buffer,
    fileType: SupportedFileType,
    fileName: string
  ): Promise<QueryResult<ParsedFile>> {
    try {
      // D5: Validate file size
      if (buffer.length === 0) {
        return createErrorResult(
          'File is empty (0 bytes)',
          'EMPTY_FILE',
          { fileSize: 0, reason: 'zero_size' }
        );
      }
      if (buffer.length > MAX_FILE_SIZE) {
        return createErrorResult(
          `File size ${buffer.length} bytes exceeds maximum ${MAX_FILE_SIZE} bytes`,
          'FILE_TOO_LARGE',
          { fileSize: buffer.length, maxSize: MAX_FILE_SIZE }
        );
      }

      if (fileType !== 'plaintext') {
        return createErrorResult('PlaintextParser only supports plaintext files');
      }

      // D6: Detect encoding
      const encodingResult = EncodingDetector.detectEncoding(buffer);
      if (!EncodingDetector.isSupportedEncoding(encodingResult.encoding)) {
        return createErrorResult(
          `Unsupported encoding detected: ${encodingResult.encoding}`,
          'UNSUPPORTED_ENCODING',
          { detectedEncoding: encodingResult.encoding, confidence: encodingResult.confidence }
        );
      }

      // D6: Convert to UTF-8 if needed
      let content: string;
      try {
        content = EncodingDetector.convertToUtf8(buffer, encodingResult.encoding);
      } catch (error) {
        return createErrorResult(
          `Failed to convert from ${encodingResult.encoding} to UTF-8`,
          'ENCODING_CONVERSION_FAILED',
          { sourceEncoding: encodingResult.encoding, error: error instanceof Error ? error.message : 'Unknown error' }
        );
      }
      
      // D5: Check for empty content after parsing and trimming
      if (content.trim().length === 0) {
        return createErrorResult(
          'File has no visible content after parsing',
          'EMPTY_FILE_CONTENT',
          { fileSize: buffer.length, contentLength: content.length, reason: 'empty_after_trim' }
        );
      }
      
      const hash = this.generateHash(content);
      const wordCount = this.countWords(content);
      
      // D5: Check for empty metadata (no visible words)
      if (wordCount === 0) {
        return createErrorResult(
          'File has no recognizable content',
          'EMPTY_FILE_CONTENT',
          { fileSize: buffer.length, wordCount: 0, reason: 'no_visible_words' }
        );
      }

      // D7: Estimate token count
      const tokenCount = TokenCounter.estimateTokens(content);

      const parsed: ParsedFile = {
        name: fileName,
        type: 'plaintext',
        content,
        size_bytes: buffer.length,
        hash,
        metadata: {
          encoding: encodingResult.encoding,
          wordCount,
          language: 'english',
          tokenCount,
        },
      };

      return {
        success: true,
        data: parsed,
      };
    } catch (error) {
      return createErrorResult(
        error instanceof Error ? error.message : 'Failed to parse plaintext buffer',
        'PARSE_ERROR',
        { reason: 'parse_exception' }
      );
    }
  }
}

/**
 * PDF Parser (Basic - extracts text)
 * For full PDF support, would integrate pdfjs-dist or pdf2json
 */
export class PdfParser extends BaseFileParser {
  constructor() {
    super('pdf');
  }

  async parse(filePath: string): Promise<QueryResult<ParsedFile>> {
    try {
      const buffer = await this.readFileAsBuffer(filePath);
      const fileName = path.basename(filePath);
      return this.parseBuffer(buffer, 'pdf', fileName);
    } catch (error) {
      return createErrorResult(error instanceof Error ? error.message : 'Failed to parse PDF file');
    }
  }

  async parseBuffer(
    buffer: Buffer,
    fileType: SupportedFileType,
    fileName: string
  ): Promise<QueryResult<ParsedFile>> {
    try {
      // D5: Validate file size
      if (buffer.length === 0) {
        return createErrorResult(
          'File is empty (0 bytes)',
          'EMPTY_FILE',
          { fileSize: 0, reason: 'zero_size' }
        );
      }
      if (buffer.length > MAX_FILE_SIZE) {
        return createErrorResult(
          `File size ${buffer.length} bytes exceeds maximum ${MAX_FILE_SIZE} bytes`,
          'FILE_TOO_LARGE',
          { fileSize: buffer.length, maxSize: MAX_FILE_SIZE }
        );
      }

      if (fileType !== 'pdf') {
        return createErrorResult('PdfParser only supports PDF files');
      }

      // Use pdfjs-dist for reliable PDF text extraction
      const content = await this.extractTextFromPdf(buffer);
      
      // D5: Check for empty content after PDF extraction
      if (content.trim().length === 0) {
        return createErrorResult(
          'PDF has no extractable text content',
          'EMPTY_FILE_CONTENT',
          { fileSize: buffer.length, extractedLength: content.length, reason: 'no_extracted_text' }
        );
      }
      
      const hash = this.generateHash(content);
      const wordCount = this.countWords(content);
      const pageCount = await this.getPageCount(buffer);
      
      // D5: Check for PDF parse failure (fallback text)
      if (content.includes('[PDF Content: No extractable text]')) {
        return createErrorResult(
          'PDF could not be parsed or has no readable content',
          'EMPTY_FILE_CONTENT',
          { fileSize: buffer.length, pageCount, reason: 'pdf_parse_failed' }
        );
      }

      // D7: Estimate token count from extracted text
      const tokenCount = TokenCounter.estimateTokens(content);

      const parsed: ParsedFile = {
        name: fileName,
        type: 'pdf',
        content,
        size_bytes: buffer.length,
        hash,
        metadata: {
          encoding: 'binary',
          wordCount,
          pageCount,
          language: 'english',
          tokenCount,
        },
      };

      return {
        success: true,
        data: parsed,
      };
    } catch (error) {
      return createErrorResult(
        error instanceof Error ? error.message : 'Failed to parse PDF buffer',
        'PARSE_ERROR',
        { reason: 'parse_exception' }
      );
    }
  }

  private async readFileAsBuffer(filePath: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, (err, data) => {
        if (err) reject(err);
        else resolve(data);
      });
    });
  }

  private async extractTextFromPdf(buffer: Buffer): Promise<string> {
    try {
      // Use dynamic require to load pdfjs-dist at runtime
      // This avoids TypeScript module resolution issues with .mjs files
      const pdfjsLib = require('pdfjs-dist/build/pdf.mjs') as any;
      
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      let fullText = '';

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => (item.str ? item.str : ''))
          .join(' ');
        fullText += pageText + '\n';
      }

      return fullText.trim() || '[PDF Content: No extractable text]';
    } catch (error) {
      // Fall back to basic text extraction if pdfjs fails
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PDF extraction failed: ${errorMsg}`);
    }
  }

  private async getPageCount(buffer: Buffer): Promise<number> {
    try {
      const pdfjsLib = require('pdfjs-dist/build/pdf.mjs') as any;
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
      return pdf.numPages;
    } catch {
      return 1; // Default to 1 page if extraction fails
    }
  }
}

/**
 * File Parser Factory
 */
export class FileParserFactory {
  private parsers: Map<SupportedFileType, IFileParser>;

  constructor() {
    this.parsers = new Map();
    this.registerParser(new MarkdownParser());
    this.registerParser(new PlaintextParser());
    this.registerParser(new PdfParser());
  }

  registerParser(parser: IFileParser): void {
    // Get the supported type by testing with each type
    const types: SupportedFileType[] = ['markdown', 'plaintext', 'pdf'];
    for (const type of types) {
      if (parser.canParse(type)) {
        this.parsers.set(type, parser);
        break;
      }
    }
  }

  getParser(fileType: SupportedFileType): IFileParser | null {
    return this.parsers.get(fileType) || null;
  }

  getSupportedTypes(): SupportedFileType[] {
    return Array.from(this.parsers.keys());
  }

  detectFileType(filePath: string): SupportedFileType | null {
    const ext = path.extname(filePath).toLowerCase();
    switch (ext) {
      case '.md':
        return 'markdown';
      case '.txt':
        return 'plaintext';
      case '.pdf':
        return 'pdf';
      default:
        return null;
    }
  }
}
