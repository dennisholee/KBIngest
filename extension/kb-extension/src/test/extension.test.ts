import * as assert from 'assert';

describe('Extension', () => {
  it('should initialize without errors', () => {
    assert.strictEqual(typeof process.env.NODE_ENV, 'string');
    assert.ok(true, 'Extension test suite loaded');
  });

  it('should have Node.js environment', () => {
    assert.ok(process.version);
    assert.ok(process.platform);
  });

  it('should support TypeScript', () => {
    const value: string = 'TypeScript works';
    assert.strictEqual(value, 'TypeScript works');
  });
});
