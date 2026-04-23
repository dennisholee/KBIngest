import { CodeBlockDetector } from '../ingestion/CodeBlockDetector';

describe('Document Ingestion Code Block Preservation', () => {
  describe('D9: Code Block Preservation', () => {
    test('should detect markdown fenced code blocks', () => {
      const content = 'Text before\n```javascript\nconst x = 5;\n```\nText after';
      const blocks = CodeBlockDetector.detectCodeBlocks(content);

      expect(blocks.length).toBeGreaterThan(0);
      const jsBlock = blocks.find((block) => block.language === 'javascript');
      expect(jsBlock).toBeDefined();
      expect(jsBlock?.type).toBe('markdown');
      expect(jsBlock?.content).toContain('const x = 5');
    });

    test('should detect multiple code blocks', () => {
      const content = `
\`\`\`python
def hello():
    print("world")
\`\`\`

Some text

\`\`\`javascript
console.log("test");
\`\`\`
      `;
      const blocks = CodeBlockDetector.detectCodeBlocks(content);
      expect(blocks.length).toBeGreaterThanOrEqual(2);
    });

    test('should detect indented code blocks', () => {
      const content = 'Some text\n    const x = 5;\n    const y = 10;';
      const blocks = CodeBlockDetector.detectCodeBlocks(content);
      const indentedBlock = blocks.find((block) => block.indented);
      expect(indentedBlock).toBeDefined();
      expect(indentedBlock?.content).toContain('const x');
    });

    test('should find safe chunk boundaries', () => {
      const content = 'Text\n```javascript\ncode\n```\nMore text';
      const blocks = CodeBlockDetector.detectCodeBlocks(content);
      const boundary = CodeBlockDetector.findSafeBoundary(content, 20, blocks);

      expect(boundary.preferredEnd).toBeDefined();
      if (boundary.codeBlocksInRange.length > 0) {
        expect(boundary.breakAtCodeBlockBoundary).toBe(true);
      }
    });

    test('should check if position is inside code block', () => {
      const content = 'Before\n```code\nInside\n```\nAfter';
      const blocks = CodeBlockDetector.detectCodeBlocks(content);

      const insidePos = content.indexOf('Inside');
      const beforePos = content.indexOf('Before');

      expect(CodeBlockDetector.isInsideCodeBlock(insidePos, blocks)).toBe(true);
      expect(CodeBlockDetector.isInsideCodeBlock(beforePos, blocks)).toBe(false);
    });

    test('should split content at safe boundaries', () => {
      const content = `# Title
\`\`\`javascript
// Long code block here
const data = { key: 'value' };
console.log(data);
\`\`\`

More content after`;
      const chunks = CodeBlockDetector.splitAtSafeBoundaries(content, 50);

      expect(chunks.length).toBeGreaterThan(0);
      expect(chunks.join('').length).toBe(content.length);
    });

    test('should get code blocks in range', () => {
      const content = `First line
\`\`\`javascript
code block 1
\`\`\`
Middle text
\`\`\`python
code block 2
\`\`\`
Last line`;
      const blocks = CodeBlockDetector.detectCodeBlocks(content);

      const inRange = CodeBlockDetector.getCodeBlocksInRange(0, content.length / 2, blocks);
      expect(inRange.length).toBeGreaterThan(0);
      expect(inRange[0].language).toBeDefined();
    });

    test('should estimate code percentage', () => {
      const codeHeavy = 'Text\n```code\ncode content\n```\nMore code';
      const textHeavy = 'Lots of text content here without much code';

      const codePercent = CodeBlockDetector.estimateCodePercentage(codeHeavy);
      const textPercent = CodeBlockDetector.estimateCodePercentage(textHeavy);

      expect(codePercent).toBeGreaterThan(textPercent);
    });

    test('should get code block statistics', () => {
      const content = `
# Documentation
\`\`\`python
def func():
    pass
\`\`\`

\`\`\`javascript
const x = 1;
\`\`\`

Regular text.
      `;
      const stats = CodeBlockDetector.getCodeBlockStats(content);

      expect(stats.totalBlocks).toBeGreaterThanOrEqual(2);
      expect(stats.languages.length).toBeGreaterThan(0);
      expect(stats.codePercentage).toBeGreaterThan(0);
      expect(stats.avgBlockSize).toBeGreaterThan(0);
    });

    test('should preserve code block integrity across chunking', () => {
      const content = '```python\ndef my_function():\n    return True\n```';
      const codeBlock = CodeBlockDetector.detectCodeBlocks(content)[0];

      expect(codeBlock).toBeDefined();
      expect(codeBlock!.startChar).toBeLessThan(codeBlock!.endChar);
      expect(content.substring(codeBlock!.startChar, codeBlock!.endChar)).toContain('def my_function');
    });
  });
});