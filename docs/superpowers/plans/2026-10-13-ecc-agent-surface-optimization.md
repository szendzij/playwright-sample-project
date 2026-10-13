# ECC Agent Surface & Workspace Optimization Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trim and optimize the repository's ECC environment (`.agents/`) from 109 rule files and 68 agents down to a lean, TypeScript-and-Playwright-focused daily set, archiving off-stack components into `.agents/library/` and introducing a searchable `skill-library` router.

**Architecture:** Split the monolithic full-install ECC bundle into two layers: an active `DAILY` layer loaded automatically into agent context, and an organized `.agents/library/` layer accessible on-demand. Update installation metadata and verify that linting, compilation, and test execution remain 100% operational.

**Tech Stack:** TypeScript 5.7, Node.js 22/24, Playwright Test 1.63, Everything Claude Code / Antigravity agent configuration.

**Spec:** Classification decisions and repo evidence established in `/agent-sort` inventory.

## Global Constraints

- **Preserve, don't delete:** Off-stack rules, agents, and workflows are relocated to `.agents/library/`, not permanently destroyed.
- **Zero test degradation:** `npm run lint`, `npx tsc --noEmit`, and `npm run test:*` must execute with zero regressions.
- **Keep Native ECC / Antigravity compatibility:** Maintain paths and configuration recognized by Antigravity and ECC without introducing proprietary custom loaders.
- **Respect Git rules:** Commits and staging are automated; never execute `git push`.

## Review Focus

1. **Context clutter elimination:** Ensure no non-TypeScript/non-Web rules (`python-*`, `rust-*`, `cpp-*`, etc.) remain in the active `.agents/rules/` directory.
2. **Subagent discovery:** Confirm that daily subagents (`e2e-runner`, `typescript-reviewer`, `build-error-resolver`, etc.) remain fully functional and reachable.
3. **Router accessibility:** Verify that `skill-library` properly indexes archived agents, skills, and workflows by keyword without duplicating entire file contents.
4. **Hook execution stability:** Ensure pre-tool hooks and dispatchers do not break automated command execution on Windows shells.
5. **Install state consistency:** Synchronize `.agents/ecc-install-state.json` to reflect active vs. library components.

---

### Task 1: Archive Off-Stack Rules to Library

**Files:**
- Create directory: `.agents/library/rules/`
- Move: 92 off-stack rule files from `.agents/rules/` to `.agents/library/rules/`
- Retain in `.agents/rules/`: 22 active files (`typescript-*.md`, `common-*.md`, `web-*.md`)

**Interfaces:**
- Consumes: Existing files in `.agents/rules/`
- Produces: Clean `.agents/rules/` containing only TypeScript, Web, and Common standards

- [x] **Step 1: Create target directory `.agents/library/rules`**
- [x] **Step 2: Move off-stack language rules (`angular-*`, `arkts-*`, `cpp-*`, `csharp-*`, `dart-*`, `fsharp-*`, `golang-*`, `java-*`, `kotlin-*`, `nuxt-*`, `perl-*`, `php-*`, `python-*`, `react-*`, `react-native-*`, `ruby-*`, `rust-*`, `swift-*`, `vue-*`) into `.agents/library/rules/`**
- [x] **Step 3: Verify `.agents/rules/` contains exactly 22 rule files + README.md**
- [x] **Step 4: Commit rule reorganization**
```bash
git add .agents/rules .agents/library/rules
git commit -m "chore(agents): relocate off-stack language rules to library"
```

---

### Task 2: Reorganize Agents & Archive Off-Stack Resolvers

**Files:**
- Create directory: `.agents/library/agents/`
- Move: 57 off-stack/niche agent specifications from `.agents/agents/` to `.agents/library/agents/`
- Retain in `.agents/agents/`: 11 daily agents (`e2e-runner`, `typescript-reviewer`, `build-error-resolver`, `code-reviewer`, `code-explorer`, `code-architect`, `pr-test-analyzer`, `tdd-guide`, `docs-lookup`, `silent-failure-hunter`, `agent-evaluator`)

**Interfaces:**
- Consumes: Files in `.agents/agents/`
- Produces: Focused `.agents/agents/` active set

- [x] **Step 1: Create target directory `.agents/library/agents`**
- [x] **Step 2: Move off-stack resolver & reviewer agents (Python, Rust, C++, Go, Java, Flutter, etc.) and niche domain agents (homelab, marketing, healthcare, etc.) to `.agents/library/agents/`**
- [x] **Step 3: Verify the remaining 11 daily agents in `.agents/agents/`**
- [x] **Step 4: Commit agent reorganization**
```bash
git add .agents/agents .agents/library/agents
git commit -m "chore(agents): trim active agents to daily Playwright and TypeScript stack"
```

---

### Task 3: Reorganize Workflows & Commands

**Files:**
- Create directory: `.agents/library/workflows/`
- Move: 81 off-stack/multi-epic workflow files from `.agents/workflows/` to `.agents/library/workflows/`
- Retain in `.agents/workflows/`: 10 daily testing and quality workflows (`build-fix`, `code-review`, `quality-gate`, `security-scan`, `test-coverage`, `update-docs`, `pr`, `checkpoint`, `review-pr`, `ecc-guide`)

**Interfaces:**
- Consumes: Files in `.agents/workflows/`
- Produces: Clean `.agents/workflows/` command palette

- [x] **Step 1: Create target directory `.agents/library/workflows`**
- [x] **Step 2: Relocate non-TypeScript/non-Playwright workflow files to `.agents/library/workflows/`**
- [x] **Step 3: Verify the remaining 10 daily workflows in `.agents/workflows/`**
- [x] **Step 4: Commit workflow reorganization**
```bash
git add .agents/workflows .agents/library/workflows
git commit -m "chore(agents): isolate daily test & quality workflows"
```

---

### Task 4: Create Searchable `skill-library` Router

**Files:**
- Create: `.agents/skills/skill-library/SKILL.md`

**Interfaces:**
- Consumes: Directory structure of `.agents/library/`
- Produces: Keyword-searchable index that allows agents and users to locate archived rules, agents, and workflows on demand without loading them continuously

- [x] **Step 1: Author `.agents/skills/skill-library/SKILL.md` with trigger mappings and directory cross-references**
- [x] **Step 2: Verify skill frontmatter and metadata syntax**
- [x] **Step 3: Commit skill library router**
```bash
git add .agents/skills/skill-library
git commit -m "feat(agents): add skill-library router for on-demand reference retrieval"
```

---

### Task 5: Synchronize Install State & Verification

**Files:**
- Modify: `.agents/ecc-install-state.json`

**Interfaces:**
- Consumes: Final file tree in `.agents/`
- Produces: Verified workspace state, green build, passing API smoke test

- [x] **Step 1: Update `.agents/ecc-install-state.json` to record the optimized profile**
- [x] **Step 2: Run linter: `npm run lint`**
- [x] **Step 3: Run TypeScript compiler check: `npx tsc --noEmit`**
- [x] **Step 4: Run API test suite: `npm run test:api` to verify zero regression**
- [x] **Step 5: Verify git status and commit install state update**
```bash
git add .agents/ecc-install-state.json
git commit -m "chore(agents): synchronize ECC install state with optimized surface"
```
