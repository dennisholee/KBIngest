---
goal: Phase 2 MEDIUM-Priority Defect Fixes for KB Extension (D5-D9)
version: 1.0
date_created: 2026-04-19
last_updated: 2026-04-19
owner: KB Extension Development Team
status: 'Planned'
tags: ['defects', 'medium-priority', 'ingestion', 'chunking', 'quality']
---

# Phase 2 MEDIUM-Priority Defect Fixes

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Comprehensive implementation plan for fixing 5 MEDIUM-priority defects in the KB Extension. Phase 2 builds on Phase 1's foundation (4 HIGH-priority defects completed) and focuses on data quality, duplicate handling, and chunking improvements. All changes maintain backward compatibility and existing test suite integrity.

## 1. Requirements & Constraints

### Functional Requirements
- **REQ-001**: Detect and validate file encodings (UTF-8, UTF-16, ASCII, Latin-1, CP1252)
- **REQ-002**: Implement content-based duplicate detection using SHA-256 hashing
- **REQ-003**: Preserve code block boundaries during chunking (no mid-block splits)
- **REQ-004**: Calculate token counts with ±5% accuracy (currently 1 token/4 chars = ±25%)
- **REQ-005**: Improve empty file validation with detailed error reporting

### Technical Constraints
- **CON-001**: All changes must pass TypeScript strict mode
- **CON-002**: Maintain 100% test pass rate (172+ tests must still pass)
- **CON-003**: No breaking changes to existing APIs (QueryResult<T> contract)
- **CON-004**: All implementations must use existing dependencies (no new npm packages except encoding libraries)
- **CON-005**: Database schema modifications require migration support

### Performance Constraints
- **PERF-001**: File encoding detection must complete in <100ms for 10MB files
- **PERF-002**: Duplicate detection (hashing) must complete in <50ms
- **PERF-003**: Token estimation calculation <5ms per chunk
- **PERF-004**: Code block boundary detection <20ms per 1000 lines

### Quality Constraints
- **QUAL-001**: All defect fixes must include unit tests (minimum 3 tests per defect)
- **QUAL-002**: Integration tests must cover cross-layer workflows
- **QUAL-003**: Error handling must include specific error codes and messages
- **QUAL-004**: All code must include JSDoc comments for public methods

## 2. Implementation Steps

### Implementation Phase 2.1: Empty File Validation Enhancement (D5)

**GOAL-D5-001**: Implement comprehensive empty file validation across all parsers with detailed error classification.

#### Tasks (Execution Time: ~45 minutes)

| Task ID | Title | File(s) | Specific Changes | Validation |
|---------|-------|---------|------------------|-----------|
| TASK-D5-001 | Add empty file error codes | `src/types.ts` | Add `EMPTY_FILE_CONTENT`, `EMPTY_METADATA`, `EMPTY_STRUCTURE` error codes | grep confirms 3 new codes exist |
| TASK-D5-002 | Enhance MarkdownParser validation | `src/ingestion/FileParser.ts` | Add checks: (1) file size 0, (2) empty after parsing, (3) no headings/content detected | 3 new unit tests pass |
| TASK-D5-003 | Enhance PlaintextParser validation | `src/ingestion/FileParser.ts` | Add checks: (1) file size 0, (2) empty after trim, (3) no visible characters | 2 new unit tests pass |
| TASK-D5-004 | Enhance PdfParser validation | `src/ingestion/FileParser.ts` | Add checks: (1) file size 0, (2) PDF parse fails, (3) extracted text is empty | 2 new unit tests pass |
| TASK-D5-005 | Add detailed error reporting | `src/ingestion/FileParser.ts` | Include file size, format detection, and reason in error.details field | Integration test validates error details |
| TASK-D5-006 | Write unit tests | `src/test/ingestion.test.ts` | Add 7 tests: empty markdown, plaintext, PDF; size 0; metadata missing; structure missing; detailed errors | All 7 tests pass |

**Completion Criteria for D5**:
- ✅ All 7 tests passing
- ✅ Empty files rejected consistently across all parsers
- ✅ Error messages include specific reason for rejection
- ✅ No regression in existing 172 tests
- ✅ TypeScript compilation 0 errors

---

### Implementation Phase 2.2: Encoding Detection & Validation (D6)

**GOAL-D6-001**: Implement robust encoding detection with explicit validation for UTF-8, UTF-16, ASCII, Latin-1, and CP1252.

#### Tasks (Execution Time: ~1.5 hours)

| Task ID | Title | File(s) | Specific Changes | Validation |
|---------|-------|---------|------------------|-----------|
| TASK-D6-001 | Create EncodingDetector utility | `src/ingestion/EncodingDetector.ts` (NEW) | Implement static methods: `detectEncoding(buffer)`, `validateUtf8(buffer)`, `isSupportedEncoding(encoding)` | Unit tests validate detection accuracy |
| TASK-D6-002 | Implement encoding detection logic | `src/ingestion/EncodingDetector.ts` | Use BOM detection + byte pattern analysis to identify encoding | 5 test cases: UTF-8, UTF-16LE, UTF-16BE, ASCII, Latin-1 |
| TASK-D6-003 | Add encoding error codes | `src/types.ts` | Add `UNSUPPORTED_ENCODING`, `ENCODING_MISMATCH`, `ENCODING_CONVERSION_FAILED` error codes | grep confirms 3 codes exist |
| TASK-D6-004 | Update FileParser interface | `src/ingestion/FileParser.ts` | Add encoding field to ParsedFile type and detection in parseBuffer() | Type validation passes |
| TASK-D6-005 | Integrate detection in MarkdownParser | `src/ingestion/FileParser.ts` | Call EncodingDetector in MarkdownParser.parseBuffer() before parsing | Integration test validates detection |
| TASK-D6-006 | Integrate detection in PlaintextParser | `src/ingestion/FileParser.ts` | Call EncodingDetector in PlaintextParser.parseBuffer() before parsing | Integration test validates detection |
| TASK-D6-007 | Integrate detection in PdfParser | `src/ingestion/FileParser.ts` | Call EncodingDetector for extracted text after PDF parsing | Integration test validates detection |
| TASK-D6-008 | Write encoding validation tests | `src/test/ingestion.test.ts` | Add 12 tests: detect UTF-8, UTF-16, ASCII, Latin-1, CP1252; mismatch errors; conversion failures | All 12 tests pass |

**Completion Criteria for D6**:
- ✅ Encoding detection works for 5+ encodings
- ✅ 12 new tests passing
- ✅ ParsedFile includes detected encoding
- ✅ Unsupported encodings rejected with clear errors
- ✅ No regression in existing tests

---

### Implementation Phase 2.3: Token Estimation Accuracy (D7)

**GOAL-D7-001**: Improve token estimation accuracy from ±25% (1 token/4 chars) to ±5% using language-aware tokenization.

#### Tasks (Execution Time: ~1 hour)

| Task ID | Title | File(s) | Specific Changes | Validation |
|---------|-------|---------|------------------|-----------|
| TASK-D7-001 | Create TokenCounter utility | `src/ingestion/TokenCounter.ts` (NEW) | Implement methods: `estimateTokens(text)`, `countWordTokens(text)`, `countWordpieceTokens(text)`, `validateEstimate()` | Unit tests for accuracy within ±5% |
| TASK-D7-002 | Implement improved estimation | `src/ingestion/TokenCounter.ts` | Use word-based + subword tokenization for ±5% accuracy instead of 1/4 char ratio | Compare against known test cases |
| TASK-D7-003 | Handle special content types | `src/ingestion/TokenCounter.ts` | Special handling for code blocks (different ratio), numbers, punctuation, CJK characters | 6 specific test cases for edge cases |
| TASK-D7-004 | Add token count to metadata | `src/ingestion/FileParser.ts` | Include tokenCount in ParsedFile.metadata for each chunk | ParsedFile.metadata.tokenCount exists |
| TASK-D7-005 | Integrate in ChunkingStrategy | `src/ingestion/ChunkingStrategy.ts` | Use TokenCounter.estimateTokens() instead of length/4 for chunk size validation | Chunks respects token-based sizing |
| TASK-D7-006 | Write accuracy tests | `src/test/ingestion.test.ts` | Add 8 tests: English text, code blocks, numbers/punctuation, CJK, mixed content, edge cases (empty, very long) | All 8 tests pass with ±5% accuracy |

**Completion Criteria for D7**:
- ✅ Token estimation accuracy improved to ±5%
- ✅ 8 new accuracy tests passing
- ✅ Chunks sized correctly based on token count
- ✅ All edge cases handled
- ✅ No regression in existing tests

---

### Implementation Phase 2.4: Duplicate Detection by Content Hash (D8)

**GOAL-D8-001**: Implement content-based duplicate detection using SHA-256 hashing to prevent duplicate documents and chunks in the system.

#### Tasks (Execution Time: ~1.5 hours)

| Task ID | Title | File(s) | Specific Changes | Validation |
|---------|-------|---------|------------------|-----------|
| TASK-D8-001 | Create DuplicateDetector utility | `src/ingestion/DuplicateDetector.ts` (NEW) | Implement methods: `computeHash(content)`, `isDocumentDuplicate(docHash)`, `isChunkDuplicate(chunkHash)`, `recordHash(hash, type)` | Unit tests validate hash computation |
| TASK-D8-002 | Implement SHA-256 hashing | `src/ingestion/DuplicateDetector.ts` | Use Node.js crypto.createHash('sha256') for deterministic hashing | Same content = same hash always |
| TASK-D8-003 | Add hash storage to database schema | `src/storage/StorageManager.ts` | Add hash column to documents table: `documents(id, name, ..., contentHash UNIQUE)` and chunks table | Schema migration created |
| TASK-D8-004 | Implement duplicate checking logic | `src/ingestion/DocumentIngestionService.ts` | Before storing document: compute hash, check for existing hash, reject if duplicate | Integration test validates rejection |
| TASK-D8-005 | Add duplicate error codes | `src/types.ts` | Add `DUPLICATE_DOCUMENT`, `DUPLICATE_CHUNK`, `DUPLICATE_DETECTED` error codes | grep confirms codes exist |
| TASK-D8-006 | Integrate in ingestion workflow | `src/ingestion/DocumentIngestionService.ts` | Call DuplicateDetector in ingestParsedFile() before storing document | Workflow includes duplicate check |
| TASK-D8-007 | Add duplicate detection for chunks | `src/ingestion/ChunkingStrategy.ts` | Include chunk hashing in chunk metadata for future duplicate detection | Chunk metadata includes hash |
| TASK-D8-008 | Write duplicate detection tests | `src/test/ingestion.test.ts` | Add 10 tests: identical documents rejected, near-duplicates accepted, chunk deduplication, hash persistence, performance | All 10 tests pass |
| TASK-D8-009 | Add database migration | `src/storage/migrations/` | Create migration file for schema changes (hash column, unique constraints) | Migration applies cleanly |

**Completion Criteria for D8**:
- ✅ SHA-256 hashing working correctly
- ✅ Duplicate documents rejected before storage
- ✅ 10 new tests passing
- ✅ Database schema updated with hash storage
- ✅ No regression in existing tests

---

### Implementation Phase 2.5: Code Block Boundary Preservation (D9)

**GOAL-D9-001**: Preserve code block boundaries during chunking to prevent splitting code blocks across chunks, which damages code context and readability.

#### Tasks (Execution Time: ~1.5 hours)

| Task ID | Title | File(s) | Specific Changes | Validation |
|---------|-------|---------|------------------|-----------|
| TASK-D9-001 | Create CodeBlockDetector utility | `src/ingestion/CodeBlockDetector.ts` (NEW) | Implement methods: `findCodeBlocks(text)`, `isInCodeBlock(position, text)`, `getCodeBlockBoundaries(text)` | Unit tests detect markdown, fenced code, indented blocks |
| TASK-D9-002 | Detect code block syntax | `src/ingestion/CodeBlockDetector.ts` | Support markdown (```), indented (4+ spaces), and HTML code tags | 6 test cases for different code block types |
| TASK-D9-003 | Update ChunkingStrategy | `src/ingestion/ChunkingStrategy.ts` | Modify chunking algorithm to respect code block boundaries (never split code blocks) | Chunking respects boundaries |
| TASK-D9-004 | Implement boundary-aware splitting | `src/ingestion/ChunkingStrategy.ts` | When chunk size reached, find nearest code block boundary instead of hard cutoff | Algorithm logic updated |
| TASK-D9-005 | Add chunk boundary metadata | `src/ingestion/ChunkingStrategy.ts` | Include metadata: `inCodeBlock: boolean`, `codeBlockLanguage?: string`, `splitReason: 'size' \| 'boundary' \| 'semantic'` | Metadata fields present in chunks |
| TASK-D9-006 | Handle edge cases | `src/ingestion/ChunkingStrategy.ts` | Large code blocks (>chunk size), mixed code/text, nested blocks, escaped delimiters | Edge case handling logic added |
| TASK-D9-007 | Add code block preservation tests | `src/test/ingestion.test.ts` | Add 11 tests: simple markdown blocks, fenced code, indented code, mixed content, large blocks, nested, escaped delimiters, performance | All 11 tests pass |
| TASK-D9-008 | Validate chunk integrity | `src/test/ingestion.test.ts` | Add tests verifying code blocks remain intact after chunking, no mid-block splits | Integration test validates integrity |

**Completion Criteria for D9**:
- ✅ Code block boundaries detected accurately
- ✅ Chunks never split within code blocks
- ✅ 11 new tests passing
- ✅ Metadata correctly indicates code blocks
- ✅ Edge cases handled properly
- ✅ No regression in existing tests

---

## 3. Cross-Defect Dependencies

```
D5 (Empty File Validation)
  ├─ No external dependencies
  └─ Ready to start immediately

D6 (Encoding Detection)
  ├─ Requires: D5 completion (empty file checks should pass first)
  └─ Can start in parallel with D5

D7 (Token Estimation)
  ├─ Requires: D5 completion (empty content handling)
  ├─ Can start in parallel with D6
  └─ Dependencies: TokenCounter utility must be independent

D8 (Duplicate Detection)
  ├─ Requires: D5, D6 completion (input validation)
  ├─ Database schema changes needed
  └─ Can start after D6 + database migration

D9 (Code Block Preservation)
  ├─ Requires: D5, D7 completion (valid input, accurate tokens)
  ├─ Can start in parallel with D8
  └─ Dependencies: CodeBlockDetector independent utility
```

**Recommended Execution Order** (to minimize blocking):
1. **Parallel D5 + D6**: Run empty validation + encoding detection simultaneously
2. **Parallel D7 + D8**: After D5+D6, run token estimation + duplicate detection
3. **After D5+D7**: Run D9 (code block preservation)

**Sequential Execution** (conservative, 4-6 hours):
1. D5 → 2. D6 → 3. D7 → 4. D8 → 5. D9

---

## 4. Testing Strategy

### Unit Test Coverage (Defect-Level Tests)
- **D5**: 7 unit tests for empty file validation across all parsers
- **D6**: 12 unit tests for encoding detection (5 encodings + error cases)
- **D7**: 8 unit tests for token estimation accuracy
- **D8**: 10 unit tests for duplicate detection logic
- **D9**: 11 unit tests for code block boundary preservation
- **TOTAL**: 48 new unit tests

### Integration Test Coverage (Cross-Layer Tests)
- **Workflow 1**: Ingest file with unsupported encoding → proper error handling
- **Workflow 2**: Ingest duplicate document → rejected before storage
- **Workflow 3**: Ingest document with large code block → chunk boundaries preserved
- **Workflow 4**: Token estimation accuracy in search ranking
- **Workflow 5**: End-to-end ingestion with all D5-D9 validations

### Regression Testing
- Run existing 172 tests to ensure no breaking changes
- Verify QueryResult<T> contract maintained across all layers
- Validate error handling consistency

### Performance Testing
- Encoding detection: <100ms for 10MB file
- Duplicate detection: <50ms for hash computation
- Token counting: <5ms per chunk
- Code block detection: <20ms per 1000 lines

---

## 5. Error Handling & Error Codes

### New Error Codes (D5-D9)

| Error Code | HTTP Status | Description | Trigger Condition |
|-----------|------------|-------------|------------------|
| `EMPTY_FILE_CONTENT` | 400 | File content is empty after parsing | File size = 0 or parse result empty |
| `EMPTY_METADATA` | 400 | Required metadata missing | No title/heading found in document |
| `EMPTY_STRUCTURE` | 400 | Document structure unreadable | No recognizable sections/structure |
| `UNSUPPORTED_ENCODING` | 400 | File encoding not supported | Detected encoding not in [UTF-8, UTF-16, ASCII, Latin-1, CP1252] |
| `ENCODING_MISMATCH` | 400 | Declared encoding doesn't match detected | BOM or byte patterns don't match |
| `ENCODING_CONVERSION_FAILED` | 500 | Unable to convert text from detected encoding | Encoding conversion threw exception |
| `DUPLICATE_DOCUMENT` | 409 | Document with same content already exists | SHA-256 hash matches existing document |
| `DUPLICATE_CHUNK` | 409 | Chunk with same content already exists | SHA-256 chunk hash matches existing |
| `DUPLICATE_DETECTED` | 409 | Generic duplicate detected | Generic catch-all for duplicate scenarios |

### Error Response Format
```typescript
{
  success: false,
  error: {
    code: "ERROR_CODE",
    message: "Human-readable error message",
    details: {
      fileSize?: number,
      detectedEncoding?: string,
      expectedEncoding?: string,
      existingDocumentId?: string,
      contentHash?: string,
      reason?: "empty" | "encoding" | "duplicate" | "boundary"
    }
  },
  metadata: {
    timestamp: ISO8601,
    attemptId: UUID
  }
}
```

---

## 6. Database Changes

### Schema Modifications

#### documents table
```sql
ALTER TABLE documents ADD COLUMN contentHash VARCHAR(64) UNIQUE;
ALTER TABLE documents ADD COLUMN detectedEncoding VARCHAR(20);
ALTER TABLE documents ADD COLUMN metadata JSON;
```

#### chunks table
```sql
ALTER TABLE chunks ADD COLUMN contentHash VARCHAR(64);
ALTER TABLE chunks ADD COLUMN estimatedTokens INTEGER;
ALTER TABLE chunks ADD COLUMN inCodeBlock BOOLEAN DEFAULT 0;
ALTER TABLE chunks ADD COLUMN codeBlockLanguage VARCHAR(20);
```

### Migration File
- Location: `src/storage/migrations/002-add-phase2-support.ts`
- Includes: Schema changes, index creation, rollback support

---

## 7. Performance Baselines (Target)

| Operation | Target Time | Validation Method |
|-----------|------------|------------------|
| Encoding detection (10MB file) | <100ms | Benchmark with 5 sample files |
| Hash computation (SHA-256) | <50ms | Benchmark with various file sizes |
| Token estimation | <5ms per chunk | Profile TokenCounter.estimateTokens() |
| Code block detection | <20ms per 1000 lines | Benchmark with large markdown files |
| Full ingestion pipeline | <2s (small doc) | Integration test timing |

---

## 8. Validation & Acceptance Criteria

### Code Quality Validation
- ✅ TypeScript strict mode compilation (0 errors)
- ✅ All 48 new unit tests passing
- ✅ All 5 integration tests passing
- ✅ Existing 172 tests still passing (no regressions)
- ✅ 100% test pass rate maintained
- ✅ Code coverage >85% for new modules

### Functional Validation
- ✅ Empty files rejected with specific error codes
- ✅ 5+ encodings detected correctly
- ✅ Token estimation accuracy ±5%
- ✅ Duplicate documents prevented
- ✅ Code blocks never split by chunking

### Performance Validation
- ✅ All target timing baselines met
- ✅ No performance regression vs Phase 1

### Documentation Validation
- ✅ All new functions have JSDoc comments
- ✅ Error handling documented
- ✅ Database schema changes documented

---

## 9. Rollback & Rollforward Plan

### Rollback Procedure (If Phase 2 fails)
1. Revert git commits: `git reset --hard [Phase1-final-commit]`
2. Drop new database columns: `ALTER TABLE documents DROP COLUMN contentHash;`
3. Rebuild indexes: `npm run compile`
4. Run existing test suite: `npm test` (should show 172/172 passing)

### Rollforward Plan (After Phase 2)
1. Database migrations applied automatically on startup
2. New error codes available immediately
3. Existing ingestion workflows use new validations by default
4. Old code without hash storage still functional (hash = NULL)

---

## 10. Success Metrics

| Metric | Target | Validation |
|--------|--------|-----------|
| Tests Passing | 220/220 (172 existing + 48 new) | `npm test` output |
| Build Status | 0 errors | `npm run compile` output |
| Encoding Support | 5+ encodings | Test coverage |
| Duplicate Detection | 100% accurate | Unit test assertions |
| Token Accuracy | ±5% | Benchmark against known values |
| Code Block Integrity | 100% (no mid-block splits) | Integration tests |
| Performance | All targets met | Benchmark results |

---

## 11. Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| Database migration failure | HIGH | Test migration on staging first, include rollback |
| Breaking changes to API | MEDIUM | Maintain QueryResult<T> contract, add new fields only |
| Performance degradation | MEDIUM | Run baseline benchmarks before/after |
| Encoding edge cases | LOW | Test all encodings with real-world samples |
| Code block detection errors | LOW | Comprehensive test suite with edge cases |

---

## 12. Timeline & Resource Allocation

**Total Estimated Time**: 4-6 hours (Parallel execution: 2-3 hours)

| Phase | Defect | Est. Time | Status |
|-------|--------|-----------|--------|
| 2.1 | D5 (Empty File Validation) | 45 min | Planned |
| 2.2 | D6 (Encoding Detection) | 90 min | Planned |
| 2.3 | D7 (Token Estimation) | 60 min | Planned |
| 2.4 | D8 (Duplicate Detection) | 90 min | Planned |
| 2.5 | D9 (Code Block Preservation) | 90 min | Planned |
| Integration | Cross-layer testing & validation | 45 min | Planned |
| **TOTAL** | **All Phase 2 defects** | **~6 hours** | **Planned** |

---

## 13. Next Phase Recommendations (Phase 3)

After Phase 2 completion:
1. **Performance Optimization**: Implement caching for duplicate detection
2. **Stress Testing**: Test with 100+ documents, concurrent operations
3. **Monitoring**: Add metrics collection for encoding detection, duplicate rates
4. **Documentation**: Update user guides with new validation features
5. **Phase 3 Defects** (if identified): Continue with additional LOW-priority defects

---

## Execution Commands

```bash
# Install new dependencies (if needed)
npm install

# Run all tests
npm test

# Run specific defect test suite
npm test -- --testNamePattern="D5|D6|D7|D8|D9"

# Compile TypeScript
npm run compile

# Git workflow
git add -A
git commit -m "fix(S1.7-D#): [Defect description]"
git push origin main
```

---

**Plan Status**: Ready for execution  
**Last Updated**: 2026-04-19  
**Next Review**: After D5 completion (T+1 hour)
