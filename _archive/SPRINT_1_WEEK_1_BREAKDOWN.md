# Sprint 1 - Week 1: Foundation & Setup Breakdown

**Week**: 1 of 2 (Sprint 1 Total)  
**Duration**: 5 working days (40 hours)  
**Team**: 1 developer  
**Target Completion**: End of Week 1  

---

## Executive Summary

Week 1 focuses on **project scaffolding, infrastructure setup, and foundation work**. Success criteria: extension skeleton boots, TypeScript/testing configured, SQLite schema designed.

**Realistic Week 1 Scope**: S1.1 (Complete) + S1.2 (Design Phase) + S1.3 (Setup Phase)  
**Week 2 Scope**: S1.2 (Implementation) + S1.3 (Implementation & Testing)

---

## Detailed Task Breakdown with Time Estimates

### **S1.1: Project Initialization** (Complete Week 1)
**Total: 8 hours | Days 1-2**

#### S1.1.1: Create VS Code Extension Scaffold
- **Description**: Generate extension boilerplate using `yo code`
- **Time Estimate**: 1.5 hours
- **Dependencies**: None
- **Steps**:
  1. Install Yeoman & VS Code generator (15 min)
  2. Run `yo code kb-extension` and configure (20 min)
  3. Review generated files and directory structure (15 min)
  4. Commit initial scaffold to Git (10 min)
- **Risk**: Low - straightforward tooling
- **Owner**: Developer

#### S1.1.2: Setup TypeScript Compiler Config
- **Description**: Configure tsconfig.json for strict mode and optimize for VS Code extensions
- **Time Estimate**: 1 hour
- **Dependencies**: S1.1.1
- **Steps**:
  1. Create tsconfig.json with strict settings (20 min)
  2. Configure build output directories (10 min)
  3. Setup source maps for debugging (10 min)
  4. Test compilation: `npm run compile` (10 min)
  5. Verify no errors (10 min)
- **Risk**: Low - standard configuration
- **Considerations**: Ensure `module: "commonjs"` and `target: "ES2020"` for VS Code compatibility

#### S1.1.3: Setup Testing Framework
- **Description**: Install and configure Jest or Vitest with TypeScript support
- **Time Estimate**: 1.5 hours
- **Dependencies**: S1.1.2
- **Steps**:
  1. Install Jest + @types/jest (or Vitest) (15 min)
  2. Create jest.config.js with TypeScript preset (20 min)
  3. Create sample test file (10 min)
  4. Configure npm scripts (`test`, `test:watch`) (10 min)
  5. Run sample tests to verify setup (15 min)
- **Risk**: Low - standard setup
- **Recommendation**: Choose Vitest for faster feedback loops

#### S1.1.4: Initialize Git Repository
- **Description**: Setup Git with proper .gitignore for Node.js + VS Code extensions
- **Time Estimate**: 0.5 hours
- **Dependencies**: S1.1.1
- **Steps**:
  1. Initialize git repo: `git init` (2 min)
  2. Create .gitignore (node_modules, dist/, *.vsix, .env) (8 min)
  3. Create initial commit (5 min)
- **Risk**: Low
- **Note**: Confirm remote origin if using GitHub

#### S1.1.5: Development Environment Documentation
- **Description**: Create README for local development setup
- **Time Estimate**: 1.5 hours
- **Dependencies**: S1.1.1 - S1.1.4
- **Steps**:
  1. Document prerequisites (Node.js version, VS Code version) (15 min)
  2. Write setup instructions (clone, npm install, npm run compile) (20 min)
  3. Document npm scripts available (15 min)
  4. Write debugging instructions (VS Code launch.json) (15 min)
  5. Create troubleshooting section (15 min)
- **Risk**: Low - documentation only
- **Deliverable**: README.md with setup & debugging guide

#### S1.1.6: Git Workflow Documentation
- **Description**: Document commit conventions and PR process
- **Time Estimate**: 1 hour
- **Dependencies**: S1.1.4
- **Steps**:
  1. Create CONTRIBUTING.md (20 min)
  2. Document commit message format (10 min)
  3. Create branch naming conventions (10 min)
  4. Add PR checklist template (15 min)
- **Risk**: Low
- **Deliverable**: CONTRIBUTING.md

#### S1.1.7: Project Structure Validation
- **Description**: Verify all generated files are correct and nothing is missing
- **Time Estimate**: 0.5 hours
- **Dependencies**: All S1.1 tasks
- **Steps**:
  1. Review directory structure (5 min)
  2. Verify package.json scripts (5 min)
  3. Test extension runs: `npm run watch` + F5 in VS Code (15 min)
- **Risk**: Medium - may require tweaks
- **Blocker Resolution**: Document any issues and fixes needed

---

### **S1.2: Storage Layer - SQLite** (Design Phase, Week 1 | Implementation Week 2)
**Week 1 Total: 6 hours | Days 2-3**

#### S1.2.1: Design Database Schema
- **Description**: Design SQLite schema for documents, chunks, vectors, collections, tags
- **Time Estimate**: 3 hours
- **Dependencies**: S1.1 complete
- **Steps**:
  1. Define entity-relationship diagram (ERD) (45 min)
     - Tables: documents, chunks, vectors, collections, tags, document_tags
  2. Design normalization strategy (45 min)
     - Determine primary/foreign keys, indexes
  3. Plan schema versioning approach (30 min)
     - Use migration system from v1 to future versions
  4. Document schema decisions (30 min)
     - Create schema.sql file with comments
  5. Code review/refinement (30 min)
- **Risk**: Medium - foundational; changes are costly later
- **Deliverable**: schema.sql, ERD diagram, schema design doc
- **Review**: Ensure no performance bottlenecks for 1M+ vectors

#### S1.2.2: Plan Migration System
- **Description**: Design database migration architecture (not implement)
- **Time Estimate**: 1.5 hours
- **Dependencies**: S1.2.1
- **Steps**:
  1. Research migration patterns (SQL migrations, versioning) (20 min)
  2. Design migration file structure (migrations/001_initial.sql) (20 min)
  3. Plan MigrationManager class interface (30 min)
  4. Document rollback strategy (15 min)
  5. Create migration template files (15 min)
- **Risk**: Low - planning only
- **Note**: Implementation deferred to Week 2
- **Deliverable**: migrations/ folder structure, migration.template.sql

#### S1.2.3: Plan StorageManager Architecture
- **Description**: Design class structure and API (not implement code)
- **Time Estimate**: 1.5 hours
- **Dependencies**: S1.2.1
- **Steps**:
  1. Define StorageManager interface (30 min)
     - create(doc), read(id), update(id, doc), delete(id), query(filter)
  2. Plan transaction support approach (20 min)
  3. Design connection pooling strategy (20 min)
  4. Plan error handling approach (15 min)
  5. Create interface TypeScript file (30 min)
- **Risk**: Low - design only
- **Deliverable**: src/storage/StorageManager.interface.ts, architecture doc

#### S1.2.4: Setup Database Dependencies
- **Description**: Install and configure SQLite driver and utilities
- **Time Estimate**: 1 hour
- **Dependencies**: S1.1 complete
- **Steps**:
  1. Install better-sqlite3 (or sql.js for pure JS) (10 min)
  2. Install @types/better-sqlite3 (5 min)
  3. Create database utility module (20 min)
  4. Test connection to in-memory SQLite (15 min)
  5. Commit package updates (10 min)
- **Risk**: Low
- **Consideration**: better-sqlite3 requires native build; use sql.js if issues arise

---

### **S1.3: Configuration & Secrets** (Setup Phase, Week 1)
**Week 1 Total: 5 hours | Days 3-5**

#### S1.3.1: Design Configuration Schema
- **Description**: Design package.json settings schema for VS Code extension
- **Time Estimate**: 1 hour
- **Dependencies**: S1.1 complete
- **Steps**:
  1. Review VS Code settings schema spec (15 min)
  2. Define KB settings (storageLocation, embeddingModel, chunkSize) (20 min)
  3. Create package.json contributes.configuration section (20 min)
  4. Document all settings with descriptions (5 min)
- **Risk**: Low
- **Deliverable**: Updated package.json with settings schema

#### S1.3.2: Implement ConfigManager Skeleton
- **Description**: Create ConfigManager class with interface
- **Time Estimate**: 1.5 hours
- **Dependencies**: S1.3.1
- **Steps**:
  1. Create ConfigManager interface (20 min)
  2. Implement get/set/watch methods (30 min)
  3. Load defaults from package.json schema (20 min)
  4. Add logging for config changes (15 min)
  5. Create unit tests (15 min)
- **Risk**: Low
- **Deliverable**: src/config/ConfigManager.ts

#### S1.3.3: Setup SecretStorage for API Keys
- **Description**: Use VS Code's SecretStorage API for sensitive config
- **Time Estimate**: 1 hour
- **Dependencies**: S1.1 complete, S1.3.2
- **Steps**:
  1. Review VS Code SecretStorage API docs (15 min)
  2. Create SecretManager wrapper class (25 min)
  3. Test storing/retrieving secrets (15 min)
  4. Add error handling (5 min)
- **Risk**: Low
- **Deliverable**: src/config/SecretManager.ts

#### S1.3.4: Environment-Based Config Loading
- **Description**: Support .env files for development, environment overrides
- **Time Estimate**: 1 hour
- **Dependencies**: S1.3.1, S1.3.2
- **Steps**:
  1. Install dotenv package (5 min)
  2. Create .env.example template (10 min)
  3. Implement environment loader (20 min)
  4. Merge env + VS Code settings hierarchy (15 min)
  5. Test with .env file (10 min)
- **Risk**: Low - standard pattern
- **Deliverable**: .env.example, environment loader code

#### S1.3.5: Placeholder Settings UI
- **Description**: Create minimal settings.json support (full UI deferred to Week 2)
- **Time Estimate**: 0.5 hours
- **Dependencies**: S1.3.1
- **Steps**:
  1. Verify VS Code settings view recognizes schema (10 min)
  2. Test read/write via API (10 min)
  3. Document for future UI enhancement (10 min)
- **Risk**: Low
- **Note**: Complex settings UI deferred to Week 2

---

## Daily Schedule (Week 1)

### **Day 1 (Monday) - 8 hours: Project Scaffolding**
- **09:00-10:30** (1.5h): S1.1.1 - Extension scaffold + initial Git setup
- **10:30-11:30** (1h): S1.1.2 - TypeScript config
- **11:30-12:30** (1h): Coffee/Documentation review
- **13:30-15:00** (1.5h): S1.1.3 - Testing framework setup
- **15:00-16:00** (1h): S1.1.4 - Git finalization + first commit
- **16:00-17:30** (1.5h): S1.1.5 - Development environment docs (Part 1)
- **EOD**: Commit & push working scaffold

### **Day 2 (Tuesday) - 8 hours: Documentation & Storage Design**
- **09:00-10:00** (1h): S1.1.5 - Dev docs (Part 2)
- **10:00-11:00** (1h): S1.1.6 - Contributing guidelines
- **11:00-12:00** (1h): S1.1.7 - Project validation & fixes
- **13:00-16:00** (3h): S1.2.1 - Database schema design (Core task)
- **16:00-17:00** (1h): S1.3.1 - Configuration schema design
- **17:00-18:00** (1h): Retrospective + commit
- **EOD**: Database schema doc complete, schema.sql drafted

### **Day 3 (Wednesday) - 8 hours: Architecture Design & Tooling**
- **09:00-10:30** (1.5h): S1.2.2 - Migration system design
- **10:30-12:00** (1.5h): S1.2.3 - StorageManager architecture
- **13:00-14:00** (1h): S1.2.4 - Database dependencies install & test
- **14:00-15:00** (1h): S1.3.2 - ConfigManager skeleton (Part 1)
- **15:00-17:00** (2h): S1.3.2 - ConfigManager implementation (Part 2) + tests
- **EOD**: StorageManager interface defined, ConfigManager skeleton working

### **Day 4 (Thursday) - 8 hours: Configuration & Secrets**
- **09:00-10:00** (1h): S1.3.3 - SecretStorage setup
- **10:00-11:00** (1h): S1.3.4 - Environment config loading
- **11:00-12:00** (1h): S1.3.5 - Settings UI placeholder
- **13:00-16:00** (3h): Buffer + refinement / Additional design work
- **16:00-17:00** (1h): Code review & cleanup
- **17:00-18:00** (1h): Commit & documentation update
- **EOD**: All configuration infrastructure complete

### **Day 5 (Friday) - 8 hours: Integration & Week 1 Wrap-up**
- **09:00-10:00** (1h): Integration testing of all components
- **10:00-11:00** (1h): Extension boots & health checks
- **11:00-12:00** (1h): Documentation review & updates
- **13:00-14:00** (1h): Bug fixes & refinement
- **14:00-15:00** (1h): Create Week 1 completion checklist
- **15:00-16:00** (1h): Prepare Week 2 tasks list
- **16:00-17:00** (1h): Final commit & tag v0.1.0-alpha
- **EOD**: Week 1 complete; ready for Week 2 implementation

---

## Definition of Done (Week 1)

✅ **S1.1 - Project Initialization**: 100% Complete
- [ ] Extension scaffold created and commits working
- [ ] TypeScript compilation succeeds
- [ ] Testing framework runs sample tests
- [ ] Git initialized with .gitignore
- [ ] Development docs complete
- [ ] Extension launches in debug mode (F5)

✅ **S1.2 - Storage Layer**: Design Phase Complete
- [ ] schema.sql designed and documented
- [ ] Migration system architecture defined
- [ ] StorageManager interface defined
- [ ] SQLite dependencies installed
- [ ] Implementation tasks planned for Week 2

✅ **S1.3 - Configuration & Secrets**: Setup Complete
- [ ] Settings schema in package.json
- [ ] ConfigManager skeleton works
- [ ] SecretStorage integration done
- [ ] Environment config loading works
- [ ] Settings readable via API

---

## Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-----------|--------|-----------|
| TypeScript/Jest config issues | Medium | High | Schedule Day 1 buffer, test early |
| better-sqlite3 native build fails | Medium | High | Have sql.js fallback ready |
| Schema design issues | Low | High | Conduct design review Day 2 |
| Scope creep (adding features) | High | Medium | Strict scope: design only, no implementation |
| Time overrun on documentation | Medium | Low | Use templates, 2-hour max per doc |

---

## Success Metrics

- [ ] **Velocity**: All S1.1 tasks + S1.2/S1.3 design tasks completed on time
- [ ] **Quality**: 0 blocking issues at week end
- [ ] **Coverage**: Design documentation at 100%, code at 80%+
- [ ] **Team Health**: No scope creep beyond Week 1 definition

---

## Week 2 Preview

Week 2 will focus on **S1.2 & S1.3 implementation**:
- Implement StorageManager with CRUD operations
- Setup migration system
- Implement ConfigManager fully
- Add comprehensive unit tests (>80% coverage)
- Achieve Definition of Done for full Sprint 1

---

## Notes & Assumptions

- **1 developer**, 5 working days, 8 hours/day = 40 hours available
- **No external blockers** (API access, design reviews assumed quick)
- **Design-first approach**: Week 1 emphasizes planning; Week 2 executes
- **Realistic buffers**: 10-15% buffer built into estimates for unknowns
- **Learning curve**: First week assumes some setup friction; velocity increases Week 2+

