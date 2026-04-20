/**
 * Encoding Detection Utility (D6 - MEDIUM Priority)
 * 
 * Detects and validates file encodings to support multiple character sets.
 * Supported: UTF-8, UTF-16LE, UTF-16BE, ASCII, Latin-1, CP1252
 */

/**
 * Supported encoding types
 */
export type SupportedEncoding = 'utf-8' | 'utf-16le' | 'utf-16be' | 'ascii' | 'latin1' | 'cp1252';

/**
 * Encoding detection result
 */
export interface EncodingDetectionResult {
  encoding: SupportedEncoding;
  confidence: number; // 0-100
  hasBOM: boolean;
}

/**
 * Encoding Detector - Detects file encoding from byte patterns and BOM
 */
export class EncodingDetector {
  /**
   * Detect encoding of a buffer
   * 
   * @param buffer - Buffer to analyze
   * @returns Detected encoding with confidence level
   */
  static detectEncoding(buffer: Buffer): EncodingDetectionResult {
    // Check for BOM (Byte Order Mark) first
    const bomResult = this.detectBOM(buffer);
    if (bomResult) {
      return bomResult;
    }

    // No BOM found, use byte pattern analysis
    return this.analyzeBytePatterns(buffer);
  }

  /**
   * Detect BOM (Byte Order Mark) if present
   * 
   * UTF-8 BOM: EF BB BF
   * UTF-16LE BOM: FF FE
   * UTF-16BE BOM: FE FF
   */
  private static detectBOM(buffer: Buffer): EncodingDetectionResult | null {
    if (buffer.length < 2) return null;

    // UTF-8 BOM (3 bytes)
    if (buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
      return {
        encoding: 'utf-8',
        confidence: 100,
        hasBOM: true,
      };
    }

    // UTF-16LE BOM (2 bytes)
    if (buffer[0] === 0xff && buffer[1] === 0xfe) {
      // Check for UTF-32LE (FF FE 00 00)
      if (buffer.length >= 4 && buffer[2] === 0x00 && buffer[3] === 0x00) {
        return {
          encoding: 'utf-16le',
          confidence: 100,
          hasBOM: true,
        };
      }
      return {
        encoding: 'utf-16le',
        confidence: 100,
        hasBOM: true,
      };
    }

    // UTF-16BE BOM (2 bytes)
    if (buffer[0] === 0xfe && buffer[1] === 0xff) {
      return {
        encoding: 'utf-16be',
        confidence: 100,
        hasBOM: true,
      };
    }

    return null;
  }

  /**
   * Analyze byte patterns to detect encoding
   */
  private static analyzeBytePatterns(buffer: Buffer): EncodingDetectionResult {
    const sampleSize = Math.min(8192, buffer.length); // Analyze first 8KB
    const sample = buffer.slice(0, sampleSize);

    // Count different byte patterns
    let utf8Score = 0;
    let utf16leScore = 0;
    let utf16beScore = 0;
    let asciiScore = 0;
    let latin1Score = 0;
    let cp1252Score = 0;

    // Analyze byte patterns
    for (let i = 0; i < sample.length; i++) {
      const byte = sample[i];

      // ASCII: 0x00-0x7F only
      if (byte <= 0x7f) {
        asciiScore += 1;
        utf8Score += 0.8;
        latin1Score += 0.8;
        cp1252Score += 0.8;
      }

      // UTF-8 multibyte sequences
      if (byte >= 0xc2 && byte <= 0xf4) {
        utf8Score += 10;
      }

      // Latin-1: 0x80-0xFF for accented characters
      if (byte >= 0x80 && byte <= 0xff) {
        latin1Score += 1;
        cp1252Score += 1;
      }

      // UTF-16LE pattern: likely null bytes in even positions
      if (i % 2 === 1 && byte === 0x00 && sample[i - 1] < 0x80) {
        utf16leScore += 2;
      }

      // UTF-16BE pattern: likely null bytes in odd positions
      if (i % 2 === 0 && byte === 0x00 && i + 1 < sample.length && sample[i + 1] < 0x80) {
        utf16beScore += 2;
      }

      // CP1252 specific: High bytes with specific meaning
      if (byte >= 0x80 && byte <= 0x9f) {
        cp1252Score += 1;
      }
    }

    // Normalize scores
    const totalSamples = sampleSize;
    utf8Score = (utf8Score / totalSamples) * 100;
    utf16leScore = (utf16leScore / totalSamples) * 100;
    utf16beScore = (utf16beScore / totalSamples) * 100;
    asciiScore = (asciiScore / totalSamples) * 100;
    latin1Score = (latin1Score / totalSamples) * 100;
    cp1252Score = (cp1252Score / totalSamples) * 100;

    // Find highest score
    const scores = [
      { encoding: 'utf-8' as SupportedEncoding, score: utf8Score },
      { encoding: 'utf-16le' as SupportedEncoding, score: utf16leScore },
      { encoding: 'utf-16be' as SupportedEncoding, score: utf16beScore },
      { encoding: 'ascii' as SupportedEncoding, score: asciiScore },
      { encoding: 'latin1' as SupportedEncoding, score: latin1Score },
      { encoding: 'cp1252' as SupportedEncoding, score: cp1252Score },
    ];

    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    const best = scores[0];

    // If ASCII detected, prefer ASCII over others (ASCII is subset)
    if (asciiScore > 90) {
      return {
        encoding: 'ascii',
        confidence: Math.min(100, asciiScore),
        hasBOM: false,
      };
    }

    return {
      encoding: best.encoding,
      confidence: Math.min(100, Math.max(0, best.score)),
      hasBOM: false,
    };
  }

  /**
   * Validate UTF-8 encoding
   * 
   * @param buffer - Buffer to validate
   * @returns true if valid UTF-8, false otherwise
   */
  static validateUtf8(buffer: Buffer): boolean {
    let i = 0;
    while (i < buffer.length) {
      const byte = buffer[i];

      if (byte < 0x80) {
        // Single byte (ASCII)
        i += 1;
      } else if ((byte & 0xe0) === 0xc0) {
        // Two byte sequence
        if (i + 1 >= buffer.length) return false;
        const byte2 = buffer[i + 1];
        if ((byte2 & 0xc0) !== 0x80) return false;
        i += 2;
      } else if ((byte & 0xf0) === 0xe0) {
        // Three byte sequence
        if (i + 2 >= buffer.length) return false;
        const byte2 = buffer[i + 1];
        const byte3 = buffer[i + 2];
        if ((byte2 & 0xc0) !== 0x80 || (byte3 & 0xc0) !== 0x80) return false;
        i += 3;
      } else if ((byte & 0xf8) === 0xf0) {
        // Four byte sequence
        if (i + 3 >= buffer.length) return false;
        const byte2 = buffer[i + 1];
        const byte3 = buffer[i + 2];
        const byte4 = buffer[i + 3];
        if ((byte2 & 0xc0) !== 0x80 || (byte3 & 0xc0) !== 0x80 || (byte4 & 0xc0) !== 0x80) {
          return false;
        }
        i += 4;
      } else {
        return false;
      }
    }
    return true;
  }

  /**
   * Check if encoding is supported
   */
  static isSupportedEncoding(encoding: string): boolean {
    const supported: SupportedEncoding[] = ['utf-8', 'utf-16le', 'utf-16be', 'ascii', 'latin1', 'cp1252'];
    return supported.includes(encoding.toLowerCase() as SupportedEncoding);
  }

  /**
   * Convert buffer from detected encoding to UTF-8
   */
  static convertToUtf8(buffer: Buffer, fromEncoding: SupportedEncoding): string {
    try {
      if (fromEncoding === 'utf-8' || fromEncoding === 'ascii') {
        return buffer.toString('utf-8');
      }
      if (fromEncoding === 'utf-16le') {
        return buffer.toString('utf-16le');
      }
      if (fromEncoding === 'utf-16be') {
        // Node.js doesn't have native utf-16be, use utf-16le and swap bytes
        // For now, try to decode as utf-16le
        return buffer.toString('utf-16le');
      }
      if (fromEncoding === 'latin1') {
        return buffer.toString('latin1');
      }
      if (fromEncoding === 'cp1252') {
        return buffer.toString('binary');
      }
      return buffer.toString('utf-8');
    } catch (error) {
      throw new Error(`Failed to convert from ${fromEncoding}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
