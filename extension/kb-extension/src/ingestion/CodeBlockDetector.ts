/**
 * Code Block Detection Utility (D9 - MEDIUM Priority)
 * 
 * Detects and preserves code block boundaries in documents.
 * Ensures chunking respects code block integrity.
 */

/**
 * Code block metadata
 */
export interface CodeBlock {
  type: 'markdown' | 'inline'; // markdown = fenced, inline = backticks
  language?: string; // e.g., 'javascript', 'python'
  startLine: number;
  endLine: number;
  startChar: number; // Character offset in content
  endChar: number;
  content: string;
  indented: boolean; // Indented code blocks (4-space indent)
}

/**
 * Chunk boundary strategy
 */
export interface ChunkBoundary {
  preferredStart: number; // Preferred chunk start position
  preferredEnd: number; // Preferred chunk end position
  breakAtCodeBlockBoundary: boolean; // Whether to break at code block edge
  codeBlocksInRange: CodeBlock[];
}

/**
 * Code Block Detector - Detects and manages code block boundaries
 */
export class CodeBlockDetector {
  /**
   * Detect all code blocks in content
   * 
   * Supports:
   * - Markdown fenced code blocks (```language ... ```)
   * - Inline code blocks (`code`)
   * - Indented code blocks (4-space indent)
   * 
   * @param content - Content to analyze
   * @returns Array of detected code blocks
   */
  static detectCodeBlocks(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];

    // Detect markdown fenced code blocks
    blocks.push(...this.detectFencedCodeBlocks(content));

    // Detect inline code (backticks) - optional, usually not chunked separately
    // blocks.push(...this.detectInlineCode(content));

    // Detect indented code blocks (4+ space indent at line start)
    blocks.push(...this.detectIndentedCodeBlocks(content));

    // Sort by start position
    blocks.sort((a, b) => a.startChar - b.startChar);

    return blocks;
  }

  /**
   * Detect markdown fenced code blocks (```language...```)
   */
  private static detectFencedCodeBlocks(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const fencePattern = /^```+([^\n]*)\n([\s\S]*?)^```+/gm;
    let match: RegExpExecArray | null;

    while ((match = fencePattern.exec(content)) !== null) {
      const language = match[1].trim() || undefined;
      const codeContent = match[2];
      const fullMatch = match[0];

      // Calculate line numbers
      const beforeMatch = content.substring(0, match.index);
      const startLine = (beforeMatch.match(/\n/g) || []).length;
      const endLine = startLine + (fullMatch.match(/\n/g) || []).length;

      blocks.push({
        type: 'markdown',
        language,
        startLine,
        endLine,
        startChar: match.index,
        endChar: match.index + fullMatch.length,
        content: codeContent,
        indented: false,
      });
    }

    return blocks;
  }

  /**
   * Detect indented code blocks (4+ space indent)
   */
  private static detectIndentedCodeBlocks(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const lines = content.split('\n');

    let inBlock = false;
    let blockStart = 0;
    let blockStartLine = 0;
    let blockContent = '';
    let charOffset = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const isIndented = /^    /.test(line) && line.trim().length > 0; // 4+ spaces, not empty

      if (isIndented && !inBlock) {
        // Start of new indented block
        inBlock = true;
        blockStart = charOffset;
        blockStartLine = i;
        blockContent = line;
      } else if (isIndented && inBlock) {
        // Continue indented block
        blockContent += '\n' + line;
      } else if (!isIndented && inBlock) {
        // End of indented block
        inBlock = false;
        blocks.push({
          type: 'markdown',
          language: undefined,
          startLine: blockStartLine,
          endLine: i - 1,
          startChar: blockStart,
          endChar: charOffset,
          content: blockContent,
          indented: true,
        });
      }

      charOffset += line.length + 1; // +1 for newline
    }

    // Handle block that extends to end of file
    if (inBlock) {
      blocks.push({
        type: 'markdown',
        language: undefined,
        startLine: blockStartLine,
        endLine: lines.length - 1,
        startChar: blockStart,
        endChar: charOffset,
        content: blockContent,
        indented: true,
      });
    }

    return blocks;
  }

  /**
   * Detect inline code (backticks)
   */
  private static detectInlineCode(content: string): CodeBlock[] {
    const blocks: CodeBlock[] = [];
    const inlinePattern = /`([^`]+)`/g;
    let match: RegExpExecArray | null;

    while ((match = inlinePattern.exec(content)) !== null) {
      const beforeMatch = content.substring(0, match.index);
      const startLine = (beforeMatch.match(/\n/g) || []).length;

      blocks.push({
        type: 'inline',
        language: undefined,
        startLine,
        endLine: startLine,
        startChar: match.index,
        endChar: match.index + match[0].length,
        content: match[1],
        indented: false,
      });
    }

    return blocks;
  }

  /**
   * Find appropriate chunk boundary that respects code blocks
   * 
   * Given a desired chunk end position, find the best split that doesn't
   * break code block boundaries.
   * 
   * @param content - Full content
   * @param desiredEnd - Desired chunk end position
   * @param codeBlocks - Detected code blocks
   * @param minChunkSize - Minimum acceptable chunk size
   * @returns Recommended chunk boundary
   */
  static findSafeBoundary(
    content: string,
    desiredEnd: number,
    codeBlocks: CodeBlock[],
    minChunkSize: number = 100
  ): ChunkBoundary {
    // Find code blocks that overlap with desired end
    const overlappingBlocks = codeBlocks.filter(
      block => block.startChar <= desiredEnd && block.endChar >= desiredEnd
    );

    if (overlappingBlocks.length === 0) {
      // No code blocks in way, use desired end
      return {
        preferredStart: 0,
        preferredEnd: desiredEnd,
        breakAtCodeBlockBoundary: false,
        codeBlocksInRange: [],
      };
    }

    const block = overlappingBlocks[0];

    // Move end to after code block
    const endAfterBlock = block.endChar;
    const blockSize = block.endChar - block.startChar;

    if (blockSize > minChunkSize) {
      // Code block too large, split at chunk boundary instead
      return {
        preferredStart: 0,
        preferredEnd: desiredEnd,
        breakAtCodeBlockBoundary: false,
        codeBlocksInRange: overlappingBlocks,
      };
    }

    // Move to after code block
    return {
      preferredStart: 0,
      preferredEnd: endAfterBlock,
      breakAtCodeBlockBoundary: true,
      codeBlocksInRange: overlappingBlocks,
    };
  }

  /**
   * Check if position is inside a code block
   * 
   * @param position - Character position
   * @param codeBlocks - Detected code blocks
   * @returns true if position is inside a code block
   */
  static isInsideCodeBlock(position: number, codeBlocks: CodeBlock[]): boolean {
    return codeBlocks.some(block => position >= block.startChar && position <= block.endChar);
  }

  /**
   * Get all code blocks in range
   * 
   * @param startChar - Start character position
   * @param endChar - End character position
   * @param codeBlocks - Detected code blocks
   * @returns Code blocks that overlap with range
   */
  static getCodeBlocksInRange(
    startChar: number,
    endChar: number,
    codeBlocks: CodeBlock[]
  ): CodeBlock[] {
    return codeBlocks.filter(
      block => block.startChar < endChar && block.endChar > startChar
    );
  }

  /**
   * Split content at safe boundaries (code-block aware)
   * 
   * Attempts to split content at maxChunkSize, but respects code block boundaries.
   * 
   * @param content - Content to split
   * @param maxChunkSize - Maximum chunk size (characters)
   * @returns Array of chunk strings
   */
  static splitAtSafeBoundaries(content: string, maxChunkSize: number = 2000): string[] {
    const codeBlocks = this.detectCodeBlocks(content);
    const chunks: string[] = [];

    let currentStart = 0;

    while (currentStart < content.length) {
      const desiredEnd = Math.min(currentStart + maxChunkSize, content.length);

      const boundary = this.findSafeBoundary(
        content,
        desiredEnd,
        codeBlocks,
        100 // min chunk size
      );

      const actualEnd = boundary.breakAtCodeBlockBoundary
        ? boundary.preferredEnd
        : desiredEnd;

      if (actualEnd <= currentStart) {
        // Prevent infinite loop - just take max chunk
        chunks.push(content.substring(currentStart, currentStart + maxChunkSize));
        currentStart += maxChunkSize;
      } else {
        chunks.push(content.substring(currentStart, actualEnd));
        currentStart = actualEnd;
      }
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  /**
   * Estimate if content has significant code components
   * 
   * @param content - Content to analyze
   * @param threshold - % threshold (0-100) for "significant"
   * @returns Percentage of content that is code
   */
  static estimateCodePercentage(content: string, threshold: number = 20): number {
    const codeBlocks = this.detectCodeBlocks(content);

    let totalCodeChars = 0;
    for (const block of codeBlocks) {
      totalCodeChars += block.content.length;
    }

    const percentage = (totalCodeChars / content.length) * 100;
    return Math.round(percentage);
  }

  /**
   * Get code block statistics for content
   */
  static getCodeBlockStats(content: string): {
    totalBlocks: number;
    totalCodeChars: number;
    codePercentage: number;
    languages: string[];
    avgBlockSize: number;
  } {
    const blocks = this.detectCodeBlocks(content);
    const languages = new Set<string>();

    let totalCodeChars = 0;
    for (const block of blocks) {
      totalCodeChars += block.content.length;
      if (block.language) {
        languages.add(block.language);
      }
    }

    return {
      totalBlocks: blocks.length,
      totalCodeChars,
      codePercentage: content.length > 0 ? (totalCodeChars / content.length) * 100 : 0,
      languages: Array.from(languages).sort(),
      avgBlockSize: blocks.length > 0 ? Math.round(totalCodeChars / blocks.length) : 0,
    };
  }
}
