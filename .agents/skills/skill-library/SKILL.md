---
name: skill-library
description: Search and route to archived ECC rules, agents, skills, and workflows stored in the project library
---

# Skill & Component Library Router

This repository uses a two-tier ECC setup:
- **DAILY (`.agents/rules/`, `.agents/agents/`, `.agents/workflows/`)**: Lean, high-frequency components tailored to **TypeScript 5.7**, **Playwright Test 1.63**, Page Object Model, and CI test pipelines.
- **LIBRARY (`.agents/library/`)**: Full reference catalog of off-stack languages, specialized domain reviewers, and multi-repo workflows kept accessible on-demand without bloating session context.

---

## 1. Directory Structure

```text
.agents/
├── rules/                  # Active DAILY rules (TypeScript, Common, Web)
├── agents/                 # Active DAILY agents (E2E runner, TS reviewer, etc.)
├── workflows/              # Active DAILY workflows (test coverage, build-fix, etc.)
├── skills/                 # Active skills
└── library/                # On-demand reference catalog
    ├── rules/              # 92 archived language rules (Python, Rust, C++, Go, etc.)
    ├── agents/             # 57 archived domain and off-stack agents
    └── workflows/          # 84 archived multi-repo and off-stack commands
```

---

## 2. Trigger Keyword Index

When a user or task touches an off-stack technology, consult the corresponding file in `.agents/library/`:

### Languages & Frameworks
- **Python / Django / FastAPI**:
  - Rules: `.agents/library/rules/python-*.md`
  - Agents: `.agents/library/agents/python-reviewer.md`, `django-reviewer.md`, `fastapi-reviewer.md`
  - Workflows: `.agents/library/workflows/python-review.md`
- **Rust**:
  - Rules: `.agents/library/rules/rust-*.md`
  - Agents: `.agents/library/agents/rust-reviewer.md`, `rust-build-resolver.md`
  - Workflows: `.agents/library/workflows/rust-test.md`, `rust-review.md`
- **Go**:
  - Rules: `.agents/library/rules/golang-*.md`
  - Agents: `.agents/library/agents/go-reviewer.md`, `go-build-resolver.md`
  - Workflows: `.agents/library/workflows/go-test.md`
- **C++ / C# / F#**:
  - Rules: `.agents/library/rules/cpp-*.md`, `csharp-*.md`, `fsharp-*.md`
  - Agents: `.agents/library/agents/cpp-reviewer.md`, `csharp-reviewer.md`, `fsharp-reviewer.md`
- **Java / Kotlin / Gradle**:
  - Rules: `.agents/library/rules/java-*.md`, `kotlin-*.md`
  - Agents: `.agents/library/agents/java-reviewer.md`, `kotlin-reviewer.md`
- **Mobile (Flutter / Swift / HarmonyOS / React Native)**:
  - Rules: `.agents/library/rules/dart-*.md`, `swift-*.md`, `react-native-*.md`
  - Agents: `.agents/library/agents/flutter-reviewer.md`, `swift-reviewer.md`, `harmonyos-app-resolver.md`

### Specialized Domain Agents
- **Network Architecture**: `.agents/library/agents/network-architect.md`, `network-troubleshooter.md`
- **Healthcare & PHI**: `.agents/library/agents/healthcare-reviewer.md`
- **Homelab**: `.agents/library/agents/homelab-architect.md`
- **Open-source packaging & sanitizing**: `.agents/library/agents/opensource-*.md`
- **Marketing & SEO**: `.agents/library/agents/marketing-agent.md`, `seo-specialist.md`

### Orchestration & Multi-Repo Workflows
- **Epic lifecycle**: `.agents/library/workflows/epic-*.md`
- **Orchestration patterns**: `.agents/library/workflows/orch-*.md`
- **GAN builder/reviewer pairs**: `.agents/library/workflows/gan-*.md`

---

## 3. How to Use Library Items

To load or apply any component from the library:
1. Locate the file in `.agents/library/<category>/<name>.md`.
2. Inspect or read its instructions with `view_file`.
3. If an archived agent is needed for delegation, invoke it via `invoke_subagent` referencing its system prompt from `.agents/library/agents/<agent-name>.md`.
