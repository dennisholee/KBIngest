# Agent Coordination Strategy for KBIngest

**Objective**: Identify and recommend agents that both *develop* the VS extension AND *coordinate* the recommended skills for maximum impact.

---

## 🎯 Recommended Core Agents for Development + Coordination

### Tier 1: Primary Orchestrators (Start Here)

#### 1. **Custom Agent Foundry** ⭐ PRIMARY
- **Purpose**: Create, manage, and orchestrate custom agents for your KB extension
- **For Development**: Design VS Code extension agents with optimal architecture
- **For Coordination**: Build a **KB Extension Coordinator Agent** that manages skill usage across development phases
- **Use When**: 
  - Planning overall agent strategy
  - Creating custom agents for specific KB operations
  - Need to orchestrate multiple skills in sequence
- **Workflow**:
  ```
  Day 1: Use to design main KB extension agent
  Day 3: Use to create MCP server coordination agent  
  Day 5: Use to create KB indexing coordinator agent
  ```
- **Link**: https://github.com/github/awesome-copilot/agents/custom-agent-foundry.agent.md

---

#### 2. **Implementation Plan** ⭐ PRIMARY  
- **Purpose**: Create detailed, phase-by-phase implementation roadmaps
- **For Development**: Break down extension development into sequential, actionable tasks
- **For Coordination**: Generate which skills to use in each phase (already in TECHNICAL_INTEGRATION_GUIDE.md)
- **Use When**:
  - Starting each development phase
  - Need to sequence tool usage
  - Creating milestone-based plans
- **Key Benefit**: Ensures skills are used in the RIGHT ORDER for maximum effectiveness
- **Workflow**:
  ```
  Phase 1: Use Implementation Plan → generates skill sequence
  Phase 2: Reference the plan → use skills in recommended order
  Phase 3: Update plan → adjust based on learnings
  ```
- **Link**: https://github.com/github/awesome-copilot/agents/implementation-plan.agent.md

---

#### 3. **Project Architecture Planner** ⭐ PRIMARY
- **Purpose**: Design and coordinate holistic system architecture
- **For Development**: Plan KB extension system (vector store + relational DB + MCP + UI)
- **For Coordination**: Identify WHICH skills are needed for each architectural component
- **Use When**:
  - Making tech stack decisions
  - Integrating multiple components (vector store, DB, MCP)
  - Need high-level orchestration
- **Workflow**:
  ```
  Input: "Design KB extension with vector + relational + MCP + UI"
  Output: Architecture diagram + skill recommendations for each layer
  ```
- **Link**: https://github.com/github/awesome-copilot/agents/project-architecture-planner.agent.md

---

### Tier 2: Supporting Orchestrators

#### 4. **Context Architect**
- **Purpose**: Analyze dependencies and map multi-file changes
- **For Development**: Understand how extension components interact
- **For Coordination**: Map skill interdependencies (which skills depend on which)
- **Use When**:
  - Multiple components need coordinated changes
  - Need to understand cross-system impacts
  - Planning refactorings
- **Example**: "How do MCP server changes affect Copilot Chat integration?"

---

#### 5. **Principal Software Engineer**
- **Purpose**: High-level technical leadership and best practices
- **For Development**: Make architectural trade-offs (TypeScript vs Python for MCP, etc.)
- **For Coordination**: Advise on optimal skill sequencing and resource allocation
- **Use When**:
  - Making major technical decisions
  - Evaluating multiple approaches
  - Need senior-level guidance
- **Example**: "Should we build MCP in TypeScript or Python for this KB extension?"

---

### Tier 3: Quality & Validation

#### 6. **SE: Security Reviewer**
- **Purpose**: Security-focused code review
- **For Development**: Validate KB extension security
- **For Coordination**: Ensure security skills are applied at correct phases
- **Use When**:
  - Before integrating MCP server
  - Before adding vector store access
  - Final security audit
- **Key Skill Integration**: Works with `mcp-security-audit` skill

---

#### 7. **QA Subagent**
- **Purpose**: Quality assurance and testing strategy
- **For Development**: Design test plans for KB operations
- **For Coordination**: Determine when/how to apply quality skills
- **Use When**:
  - Finishing each phase
  - Before moving to production
  - Setting up test automation
- **Key Skill Integration**: Works with `quality-playbook` and `eval-driven-dev` skills

---

#### 8. **Agentic Eval** (Skill, not Agent)
- **Purpose**: Evaluate agent outputs and iterate
- **For Development**: Test that custom KB agents work correctly
- **For Coordination**: Measure skill effectiveness and improve usage patterns
- **Use When**:
  - Validating custom agent outputs
  - Measuring search quality
  - Iterating on KB relevance

---

## 🔄 Recommended Agent Usage Workflow

### Phase 1: Architecture & Planning (Week 1)

```
┌─────────────────────────────────────────────────────┐
│ 1. Project Architecture Planner                     │
│    Input: "Design KB extension with vector+DB+MCP" │
│    Output: Architecture diagram + components       │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 2. Custom Agent Foundry                            │
│    Input: Architecture → Agent design               │
│    Output: KB Extension Coordinator Agent design    │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ 3. Implementation Plan                              │
│    Input: Architecture + agents → Phases            │
│    Output: 7-phase roadmap + skill sequencing       │
└──────────────┬──────────────────────────────────────┘
               ↓
         ✅ Ready for Phase 2
```

### Phase 2-3: Development (Weeks 2-4)

```
FOR EACH PHASE:
┌─────────────────────────────────────────────────────┐
│ Reference: Implementation Plan (from Phase 1)      │
│ Shows: Which skills to use in this phase            │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ Context Architect (if refactoring/changes)         │
│ Input: "Map changes needed for [feature]"          │
│ Output: Dependency analysis                         │
└──────────────┬──────────────────────────────────────┘
               ↓
         Use Listed Skills
      (from Implementation Plan)
               ↓
         Test & Validate
```

### Phase 4: Security & Quality (Week 5-6)

```
┌─────────────────────────────────────────────────────┐
│ SE: Security Reviewer                               │
│ Input: "Audit KB extension for security"           │
│ Output: Security findings + remediation             │
└──────────────┬──────────────────────────────────────┘
               ↓
┌─────────────────────────────────────────────────────┐
│ QA Subagent                                          │
│ Input: "Create test strategy for KB operations"    │
│ Output: Test plan + coverage analysis               │
└──────────────┬──────────────────────────────────────┘
               ↓
      ✅ Ready for launch
```

---

## 🚀 Agent + Skill Integration Matrix

| Agent | Best Skill Partners | When to Use | Output |
|-------|---------------------|------------|--------|
| **Project Architecture Planner** | `architecture-blueprint-generator`, `technology-stack-blueprint-generator` | Week 1, planning phase | Architecture diagrams + tech decisions |
| **Custom Agent Foundry** | `copilot-instructions-blueprint-generator`, `agent-governance` | Week 1-2, agent design | Custom agent definitions |
| **Implementation Plan** | ALL (coordinates them) | Week 1 + start of each phase | Phase-based skill roadmap |
| **Context Architect** | `architecture-blueprint-generator` | Mid-development, refactoring | Dependency analysis |
| **TypeScript MCP Expert** | `typescript-mcp-server-generator`, `mcp-security-audit` | Week 2-3 | MCP server code |
| **SE: Security Reviewer** | `agent-owasp-compliance`, `mcp-security-audit` | Week 5-6, pre-launch | Security audit report |
| **QA Subagent** | `quality-playbook`, `eval-driven-dev` | Week 5-6, ongoing | Test strategy + execution |

---

## 💡 Agent Coordination Workflow (How They Work Together)

### The "Orchestration" Pattern

1. **Project Architecture Planner** → defines WHAT to build
2. **Implementation Plan** → defines WHEN (phases) and WHICH SKILLS
3. **Custom Agent Foundry** → defines HOW (creates coordinator agent)
4. **Context Architect** → VALIDATES dependencies
5. **Principal Software Engineer** → REVIEWS and advises
6. **Phase-Specific Skills** → executes the work
7. **SE: Security Reviewer** → VALIDATES security
8. **QA Subagent** → VALIDATES quality

---

## 📋 Quick Start: First 3 Agents to Install

### Day 1: Foundation Agents
```bash
# Install these THREE agents first (in order)
1. copilot plugin install project-architecture-planner@awesome-copilot
2. copilot plugin install custom-agent-foundry@awesome-copilot
3. copilot plugin install implementation-plan@awesome-copilot
```

### Day 1-2: Run in This Order

**Command 1** (Project Architecture Planner):
```
@project-architecture-planner
"Design a VS Code extension that:
- Ingests documents to a Qdrant vector database (1536 dimensions)
- Stores metadata in PostgreSQL 
- Provides MCP server for Copilot Chat integration
- Shows KB UI in VS Code sidebar"
```

**Command 2** (Custom Agent Foundry):
```
@custom-agent-foundry
"Based on the KB extension architecture, design a 'KB Extension Coordinator Agent'
that manages the following capabilities:
- Document ingestion coordination
- Vector search orchestration
- MCP server status monitoring
- Copilot Chat integration handling"
```

**Command 3** (Implementation Plan):
```
@implementation-plan
"Create a 7-week implementation plan for building a KB VS Code extension with:
- Week 1: Foundation & architecture
- Week 2-3: MCP server development
- Week 3-4: Vector store integration
- Week 4: Database setup
- Week 5: Copilot Chat integration
- Week 6: Quality & security
- Week 7: Launch
For each week, recommend which awesome-copilot skills to use."
```

---

## 🎯 Success Criteria: How to Know Agents Are Working Well

✅ **Architecture Clarity**: After Project Architecture Planner, system components are clear
✅ **Agent Design**: After Custom Agent Foundry, KB Coordinator agent is well-defined  
✅ **Skill Sequencing**: After Implementation Plan, you know WHICH skills to use WHEN
✅ **Dependency Mapping**: After Context Architect (when needed), dependencies are clear
✅ **Security Validation**: After SE: Security Reviewer, no critical security issues
✅ **Quality Assurance**: After QA Subagent, test coverage is adequate
✅ **Timeline Met**: Development follows phases from Implementation Plan

---

## 🔗 Additional Agents Worth Knowing

| Agent | Use Case | Link |
|-------|----------|------|
| **TypeScript MCP Expert** | Building MCP server | [Link](https://github.com/github/awesome-copilot/agents/typescript-mcp-expert.agent.md) |
| **Python MCP Expert** | Python-based MCP | [Link](https://github.com/github/awesome-copilot/agents/python-mcp-expert.agent.md) |
| **High Level Big Picture Architect (HLBPA)** | System review & docs | [Link](https://github.com/github/awesome-copilot/agents/hlbpa.agent.md) |

---

## 📊 Agent Decision Tree

```
Start: "I need to coordinate skills for KB extension development"
│
├─ "I need to understand WHAT to build"
│  └─→ Project Architecture Planner
│
├─ "I need to design HOW agents work"
│  └─→ Custom Agent Foundry
│
├─ "I need to know WHEN/WHICH skills to use"
│  └─→ Implementation Plan
│
├─ "I need to understand DEPENDENCIES"
│  └─→ Context Architect
│
├─ "I need SECURITY validation"
│  └─→ SE: Security Reviewer
│
├─ "I need QUALITY assurance"
│  └─→ QA Subagent
│
└─ "I need high-level GUIDANCE"
   └─→ Principal Software Engineer
```

---

## 🎓 Learning Path

### For Beginners
1. Read this document (you're here!)
2. Install first 3 agents
3. Run Project Architecture Planner command
4. Read output
5. Run Custom Agent Foundry command
6. Run Implementation Plan command

### For Experienced Developers
1. Skim this document (sections 1-2)
2. Jump to "First 3 Agents" section
3. Understand the "Orchestration Pattern" (section on page 6)
4. Start with Implementation Plan → work backwards to understand phases
5. Customize based on your needs

### For Technical Leads
1. Review the "Integration Matrix" (above)
2. Understand "Orchestration Pattern"
3. Review "Success Criteria"
4. Meet with team to decide: Which agents will EACH team member use?
5. Create team-specific workflow doc

---

## 📝 Template: Custom Coordinator Agent (From Custom Agent Foundry)

Based on running Custom Agent Foundry, you might create:

```markdown
# KB Extension Coordinator Agent

**Purpose**: Orchestrate document ingestion, vector search, and Copilot Chat integration

**Tools**:
1. ingest-document(path, type) → queues document for processing
2. search-kb(query, top_k) → searches vector store + relational DB
3. sync-with-mcp() → ensures MCP server in sync
4. validate-copilot-integration() → checks Copilot Chat connection
5. report-status() → displays KB health metrics

**Workflow**:
1. User uploads document → ingest-document()
2. Document → processed by Python pipeline
3. Embeddings → stored in Qdrant
4. Metadata → stored in PostgreSQL
5. Result → confirmed to user

**When to Use**:
- Batch document ingestion
- Troubleshooting KB operations
- Monitoring system health
```

---

## 🔗 Key Resources

| Resource | Link |
|----------|------|
| Project Architecture Planner | https://github.com/github/awesome-copilot/agents/project-architecture-planner.agent.md |
| Custom Agent Foundry | https://github.com/github/awesome-copilot/agents/custom-agent-foundry.agent.md |
| Implementation Plan | https://github.com/github/awesome-copilot/agents/implementation-plan.agent.md |
| Context Architect | https://github.com/github/awesome-copilot/agents/context-architect.agent.md |
| Principal Software Engineer | https://github.com/github/awesome-copilot/agents/principal-software-engineer.agent.md |
| SE: Security Reviewer | https://github.com/github/awesome-copilot/agents/se-security-reviewer.agent.md |
| QA Subagent | https://github.com/github/awesome-copilot/agents/qa-subagent.agent.md |

---

## ✅ Next Actions

1. **Today**: Read this document completely
2. **Tomorrow**: Install 3 foundation agents
3. **Tomorrow Afternoon**: Run Project Architecture Planner
4. **Day 3**: Run Custom Agent Foundry + Implementation Plan
5. **Day 4+**: Follow Implementation Plan for skill sequencing

---

**Questions?** Reference [QUICK_REFERENCE.md](QUICK_REFERENCE.md) for agent usage patterns or [README_AWESOME_COPILOT.md](README_AWESOME_COPILOT.md) for master index.

---

*Created: April 18, 2026*
*For: KBIngest VS Code Extension Project*
*Based on: https://github.com/github/awesome-copilot (200+ agents)*
