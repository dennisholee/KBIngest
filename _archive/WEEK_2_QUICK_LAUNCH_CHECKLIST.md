# KB Extension - Quick Launch Checklist
**Days 3-5 Implementation Ready-To-Go**

Use this checklist to get started immediately. Detailed instructions in WEEK_2_DEVELOPMENT_STARTUP_GUIDE.md

---

## Pre-Flight (Before Day 3 Starts)

### Verify Days 1-2 Complete ✅

```bash
cd ~/Devs/KBIngest/extension

# Check compilation
npm run compile 2>&1 | grep -i error && echo "❌ Compilation has errors" || echo "✅ Compilation OK"

# Check tests
npm test 2>&1 | grep "Tests:" | grep passed && echo "✅ Tests passing" || echo "❌ Tests failing"

# Check git history
git log --oneline | head -3 && echo "✅ Git OK" || echo "❌ Git issue"

# Check structure
ls -d src/ test/ dist/ package.json .git/ && echo "✅ Structure OK" || echo "❌ Missing directories"
```

**All checks green?** → Proceed to Step 1

---

## Day 3: Morning (3 hours)

### Step 1: Install SQLite (15 min)

```bash
npm install better-sqlite3
npm install --save-dev @types/better-sqlite3
npm install uuid
npm install --save-dev @types/uuid
```

### Step 2: Create Type Files (30 min)

Create these 5 files in `src/storage/types/`:

1. `Document.ts` - [Copy from WEEK_2_DEVELOPMENT_STARTUP_GUIDE.md Step 2]
2. `Chunk.ts` - [Copy from guide]
3. `Vector.ts` - [Copy from guide]
4. `Tag.ts` - [Copy from guide]
5. `Collection.ts` - [Copy from guide]

### Step 3: Create Utilities (30 min)

1. Create `src/storage/errors/StorageError.ts` - [Copy from guide]
2. Create `src/utils/id-generator.ts` - [Copy from guide]
3. Create `src/storage/SqliteConnection.ts` - [Copy from guide]

### Step 4: Verify Compilation (15 min)

```bash
npm run compile
# Should complete with no errors

# Verify dist/ folder
ls -la dist/ | grep -E "\\.js$|\\.map$|\\.d\\.ts$" && echo "✅ All files" || echo "❌ Missing files"
```

---

## Day 3: Afternoon (3 hours)

### Step 5: Create Tests (45 min)

Create test files:

1. `src/test/storage/SqliteConnection.test.ts` - [Copy from guide]
2. `src/test/storage/StorageManager.test.ts` - [Copy from guide]

### Step 6: Create StorageManager (90 min)

Create `src/storage/StorageManager.ts` - [Copy from guide]

### Step 7: Run Tests (15 min)

```bash
npm test
# Should see ~10 tests passing

npm test -- --coverage
# Should see >50% coverage for storage
```

### Step 8: First Commit (15 min)

```bash
git add -A
git commit -m "feat(storage): initial StorageManager implementation

- SqliteConnection utility for DB lifecycle
- Type definitions for Document, Chunk, Vector, Tag, Collection
- StorageManager CRUD operations
- Unit tests for both classes
- All tests passing; 0 compilation errors

Closes #S1.2.1"

git log --oneline | head -3
```

---

## Day 3 End-of-Day Checklist ✅

```bash
[ ] npm run compile → 0 errors
[ ] npm test → ≥5 tests passing
[ ] npm test -- --coverage → >50% storage coverage
[ ] git log → shows 2+ new commits
[ ] All type files created
[ ] StorageManager CRUD methods working
```

**Expected time**: 6 hours (within 8-hour day)

---

## Day 4: Expand StorageManager

### Tasks (8 hours)

1. **Add transaction wrapper** (1h)
   - Implement connection pooling
   - Add transaction context manager

2. **Add database health checks** (1h)
   - Verify schema exists
   - Check all tables/indexes created
   - Add verification method

3. **Implement remaining CRUD** (2h)
   - Collection operations
   - Document-Tag relationships
   - Document-Collection relationships

4. **Write comprehensive tests** (3h)
   - Edge cases
   - Error scenarios
   - Transaction rollback
   - Aim for >80% coverage

5. **Commit** (1h)
   - Multiple commits (3-5 total)
   - Update test results

---

## Day 4 End-of-Day Checklist ✅

```bash
[ ] npm run compile → 0 errors
[ ] npm test → ≥20 tests passing
[ ] npm test -- --coverage → >80% storage coverage
[ ] git log → shows 5+ new commits
[ ] Transactions working (test with nested creates)
[ ] Database init + health checks verified
[ ] All CRUD operations complete
```

---

## Day 5: ConfigManager

### Tasks (8 hours)

1. **Define settings schema** (1h)
   - Update `package.json` with VS Code settings
   - Create types for config

2. **Implement ConfigManager** (2h)
   - Read settings from VS Code
   - Write settings
   - Validate against schema

3. **Add SecretStorage** (1.5h)
   - Store API keys securely
   - Retrieve with fallback

4. **Write tests** (2.5h)
   - Config read/write
   - Validation
   - Secret storage
   - Aim for >80% coverage

5. **Commit & integration** (1h)
   - Wire to extension.ts
   - Final commits

---

## Day 5 End-of-Day Checklist ✅

```bash
[ ] npm run compile → 0 errors
[ ] npm test → ≥25 tests passing
[ ] npm test -- --coverage → >70% overall coverage
[ ] git log → shows 10+ new commits total for week
[ ] ConfigManager reads/writes settings
[ ] SecretStorage integration working
[ ] Environment-based loading working
[ ] Ready for Week 3 ingestion service
```

---

## Development Workflow (Every Day)

### Start of Day

```bash
cd ~/Devs/KBIngest/extension
npm install
npm run watch &     # Terminal 1: auto-compile
npm run test:watch &  # Terminal 2: auto-test
```

### Every 30-60 minutes

```bash
# When tests pass:
git add -A
git commit -m "descriptive message"
```

### If Issues

```bash
# Compilation error?
npm run compile

# Test error?
npm test -- --verbose

# Need to debug?
npm run test:debug
# Then open chrome://inspect
```

---

## File Structure to Create

```
extension/
├── src/
│   ├── storage/
│   │   ├── StorageManager.ts
│   │   ├── StorageManager.interface.ts (from Day 2)
│   │   ├── SqliteConnection.ts
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql (from Day 2)
│   │   │   └── README.md (from Day 2)
│   │   ├── errors/
│   │   │   ├── MigrationError.ts (from Day 2)
│   │   │   └── StorageError.ts
│   │   └── types/
│   │       ├── Document.ts
│   │       ├── Chunk.ts
│   │       ├── Vector.ts
│   │       ├── Tag.ts
│   │       └── Collection.ts
│   ├── config/
│   │   ├── ConfigManager.interface.ts (from Day 2)
│   │   └── [ConfigManager.ts + types - Day 5]
│   ├── utils/
│   │   ├── id-generator.ts
│   │   ├── logger.ts
│   │   └── retry.ts
│   └── test/
│       ├── storage/
│       │   ├── SqliteConnection.test.ts
│       │   └── StorageManager.test.ts
│       └── config/
│           └── ConfigManager.test.ts
├── docs/
│   ├── SCHEMA_DESIGN.md (from Day 2)
│   ├── SCHEMA_DECISIONS.md (from Day 2)
│   └── MIGRATIONS.md (from Day 2)
└── package.json
```

---

## Success Indicators

### Day 3
- ✅ StorageManager compiling
- ✅ 5+ tests passing
- ✅ 2+ commits

### Day 4  
- ✅ 20+ tests passing
- ✅ >80% storage coverage
- ✅ 5+ commits

### Day 5
- ✅ 25+ tests passing
- ✅ >70% overall coverage
- ✅ 10+ commits total
- ✅ Week 3 ready

---

## Detailed Instructions Reference

**See WEEK_2_DEVELOPMENT_STARTUP_GUIDE.md for**:
- Complete step-by-step code (copy-paste ready)
- Full test implementations
- Troubleshooting guide
- Development workflow details
- Success metrics definitions

---

## Quick Commands Reference

| Goal | Command |
|------|---------|
| Check code compiles | `npm run compile` |
| Run tests | `npm test` |
| Watch mode (auto-compile) | `npm run watch` |
| Watch tests (auto-test) | `npm run test:watch` |
| Debug tests | `npm run test:debug` |
| Coverage report | `npm test -- --coverage` |
| See git history | `git log --oneline` |
| Commit | `git commit -m "message"` |
| Push | `git push` |

---

## Immediate Next Action

1. Open `/Users/dennislee/Devs/KBIngest/WEEK_2_DEVELOPMENT_STARTUP_GUIDE.md`
2. Start at **Step 1: Install SQLite Package**
3. Follow each step exactly
4. Run verification after each step
5. Commit after Step 9

**Estimated time to first commit**: 6 hours

---

**Ready?** → Start Day 3! 🚀

Last updated: 2026-04-23
