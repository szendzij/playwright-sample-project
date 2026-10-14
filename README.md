# 🛠️ Practice Software Testing — Playwright Enterprise Automation Suite

[![Playwright](https://img.shields.io/badge/Playwright-v1.63+-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)](https://playwright.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.7+-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-v20+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![CI Workflow](https://img.shields.io/badge/CI-GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

> **Enterprise-grade End-to-End (E2E), API, Mocking, and Semantic Visual Regression testing framework** built with [Playwright](https://playwright.dev/) and [TypeScript](https://www.typescriptlang.org/) for the [Practice Software Testing (Toolshop)](https://practicesoftwaretesting.com/) platform.

---

## 📑 Table of Contents

- [Overview](#-overview)
- [Architecture & Key Design Patterns](#-architecture--key-design-patterns)
  - [Tri-Tier Test Runners](#1-tri-tier-test-runners)
  - [Concurrency Lockfile & Session State Management](#2-concurrency-lockfile--session-state-management)
  - [Page Component Object Model (PCOM)](#3-page-component-object-model-pcom)
  - [Semantic Visual Regression via ARIA Snapshots](#4-semantic-visual-regression-via-aria-snapshots)
  - [Hybrid API Seeding & Fixtures](#5-hybrid-api-seeding--fixtures)
  - [Modern Protocol Testing (GraphQL & RFC 10008 QUERY)](#6-modern-protocol-testing-graphql--rfc-10008-query)
  - [Synthetic Dynamic Data Generation](#7-synthetic-dynamic-data-generation)
  - [Network Route Mocking & Fault Injection](#8-network-route-mocking--fault-injection)
- [Repository Structure](#-repository-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Configuration](#environment-configuration)
- [Command Reference](#-command-reference)
- [Continuous Integration (CI/CD)](#-continuous-integration-cicd)
- [Test Suite Coverage Matrix](#-test-suite-coverage-matrix)
- [Best Practices & Antipattern Guardrails](#-best-practices--antipattern-guardrails)
- [License](#-license)

---

## 🎯 Overview

This repository demonstrates modern automated quality engineering principles for complex web applications. Testing against both the live production demo ([practicesoftwaretesting.com](https://practicesoftwaretesting.com)) and local Docker microservice stacks, the suite provides complete end-to-end validation with zero flaky tests, sub-second API execution, resilient locator strategies, deterministic parallelization, and advanced client-side network route mocking.

```
       ┌────────────────────────────────────────────────────────────────────────┐
       │                    Playwright Test Suite (28 Tests)                    │
       └───────────────────────────────────┬────────────────────────────────────┘
                                           │
         ┌─────────────────────────────────┼─────────────────────────────────┐
         ▼                                 ▼                                 ▼
┌─────────────────────────────────┐ ┌─────────────────────────────────┐ ┌─────────────────────────────────┐
│     toolshop-e2e Project        │ │     toolshop-api Project        │ │    toolshop-mock Project        │
│  - Browser UI Automation        │ │  - Pure HTTP Client (Headless)  │ │  - Route Mocking & Abort        │
│  - ARIA Visual Tree Regression  │ │  - REST, GraphQL & RFC 10008    │ │  - Response Enrichment (fetch)  │
│  - Lazy Session State Storage   │ │  - Sub-second Isolated Workers  │ │  - Artificial Latency & Errors  │
└─────────────────────────────────┘ └─────────────────────────────────┘ └─────────────────────────────────┘
```

---

## 🏛️ Architecture & Key Design Patterns

### 1. Tri-Tier Test Runners
The test suite utilizes a decoupled project architecture defined in [`playwright.config.ts`](playwright.config.ts):
- **`toolshop-e2e`**: Executes in real browser contexts (Chromium, 1920x1080) for full user journey and accessibility snapshot validation.
- **`toolshop-api`**: Pure HTTP API runner bypassing browser initialization overhead, executing REST, GraphQL, and experimental RFC tests in milliseconds.
- **`toolshop-mock`**: Specialized browser runner intercepting network requests to validate edge cases, empty states, artificial delays, and backend resilience without relying on mutable production data.

### 2. Concurrency Lockfile & Session State Management
Parallel workers authenticate without encountering race conditions or redundant login calls:
- Authentication sessions are cached to disk under `setup/session-storage/.auth/` as reusable storage states (`customer.json`, `admin.json`).
- When a session requires re-authentication, an atomic file lock (`setup/utils/lock-helper.ts`) coordinates worker access, ensuring only one worker logs in while other workers await the fresh session state.

### 3. Page Component Object Model (PCOM)

To prevent bloated, monolithic Page Objects, the UI architecture divides interfaces into reusable widgets and orchestrating pages, following the [Playwright Page Object Model](https://playwright.dev/docs/pom) pattern:
- **Base Primitives**: `BasePage` (navigation + load state; `goto()` is `protected`) and `BaseComponent` (`page` + scoped `root`).
- **Reusable Components**:
  - `HeaderComponent`: top navigation (`root` = `app-header`); children are intentionally not scoped because the navbar renders conditionally.
  - `FilterSidebarComponent`: catalog filter panel (`root` = `div[data-test="filters"]`) including the catalog search box.
  - `ProductCardComponent`: product card scoped to a single card; instantiated per rendered card by `HomePage.getProductCards()`.
- **Page Objects**: `HomePage`, `ProductDetailsPage`, `CheckoutPage`, `LoginPage`, `RegisterPage`, `AccountPage`, `ContactPage`, `AdminDashboardPage`.

**Conventions enforced in this repo:**
- One route = one page object. `CheckoutPage` owns `/checkout` (cart step included); there is no separate `CartPage`.
- `open()` is the only public navigation entry point; `BasePage.goto()` is `protected`.
- Locators are `readonly` class fields. Selector priority: test id (`data-test`) → role → text → CSS. CSS selectors carry a comment explaining why.
- Page objects expose locators and user actions, never assertions. Specs verify with web-first assertions (`await expect(locator).toBeVisible()`), never `expect(await locator.isVisible()).toBe(true)`.
- No swallowed waits: `waitFor(...).catch(() => {})` is forbidden; genuinely optional elements use `BasePage.tryWaitForVisible()`.
- Selectors live only in `tests/pages/**`. ESLint (`no-restricted-syntax`) rejects `page.locator(...)` / `page.getBy*(...)` inside `tests/spec/**`.

### 4. Semantic Visual Regression via ARIA Snapshots
Traditional pixel-comparison visual testing suffers from anti-aliasing variations, platform font differences, and rendering engine nuances. This suite uses **Playwright ARIA Snapshots** (`expect(locator).toMatchAriaSnapshot()`):
- Snapshots are stored as clean, human-readable YAML accessibility trees in `snapshots/aria/`.
- Tests verify semantic document structure, headings, landmarks, accessible names, and interactive states without false positives.

### 5. Hybrid API Seeding & Fixtures
Specs require isolated, predictable states. The suite implements typed domain helpers:
- `ProductHelper`: Fetching, querying, and filtering product entities.
- `CartHelper`: Server-side cart initialization and cart item addition.
- `InvoiceHelper`: Order invoice retrieval and verification.
- `AuthHelper`: Fast OAuth token acquisition and user profile lookups.
- Playwright's `apiAs(role)` fixture provides per-worker pre-authenticated `APIRequestContext` instances.

### 6. Modern Protocol Testing (GraphQL & RFC 10008 QUERY)
Beyond standard REST requests, the suite verifies modern protocol patterns:
- **GraphQL**: Query execution against `/graphql` validating schema resolution for product catalogs.
- **RFC 10008 HTTP `QUERY` Method**: Testing safe, idempotent query operations carrying request bodies via the new HTTP `QUERY` method, with automatic query parameter fallback.

### 7. Synthetic Dynamic Data Generation
All mutating operations (user registrations, checkout transactions, contact form submissions) use `@faker-js/faker` via `data/test-data.ts`. Tests remain completely independent, idempotent, and capable of executing concurrently across unlimited workers without database primary key or unique index collisions.

### 8. Network Route Mocking & Fault Injection
Using Playwright's route interception via `ApiMockHelper` (`tests/fixtures/mock/`):
- **Full Mocking (`route.fulfill`)**: Simulates custom product catalogs with special characters/diacritics or 0-product empty states.
- **Live Response Modification (`route.fetch`)**: Intercepts real backend responses and injects dynamic promotional items on-the-fly.
- **Selective GraphQL Mocking**: Inspects POST payloads to intercept specific queries by `operationName` while allowing other traffic to pass through.
- **Fault Injection & Chaos Engineering (`route.abort`)**: Simulates dropped connections (`failed`), HTTP 500 server crashes, and HTTP 401 unauthorized states to verify UI resilience and error states.
- **Artificial Latency**: Introduces deliberate network delay to ensure robust async loading handling.

---

## 📁 Repository Structure

```plaintext
practice-software-testing-playwright/
├── .github/
│   └── workflows/
│       └── playwright.yml            # Multi-job parallel CI pipeline with blob merge reporting
├── data/
│   ├── fixtures/
│   │   └── sample-attachment.txt     # Test attachment for contact form upload
│   ├── products.ts                   # Static reference product constants
│   ├── test-data.ts                  # Faker dynamic test data factories
│   └── users.ts                      # Role-based test users (admin, customer)
├── env/
│   ├── .env.local                    # Local Docker environment configuration
│   └── .env.prod                     # Live cloud production configuration
├── setup/
│   ├── api/
│   │   ├── helpers/                  # Domain API helpers (Auth, Cart, Invoices, Products)
│   │   ├── fixtures.ts               # Authenticated apiAs(role) test fixture
│   │   └── index.ts                  # Centralized API module exports
│   ├── session-storage/
│   │   └── .auth/                    # Cached Playwright storage states (.gitignore)
│   └── utils/
│       ├── auth-manager.ts           # Browser session generator
│       └── lock-helper.ts            # Concurrency-safe file lock mechanism
├── snapshots/
│   └── aria/                         # Git-tracked ARIA snapshot YAML baseline files
├── tests/
│   ├── fixtures/
│   │   └── mock/                     # Mock fixtures, ApiMockHelper & static mock JSON datasets
│   │       ├── data/                 # Custom products & empty state JSON fixtures
│   │       ├── mock-helper.ts        # Route interception, fetch modification & fault injection
│   │       └── mock-test.ts          # Extended test fixture providing mockHelper
│   ├── pages/
│   │   ├── components/               # Header, FilterSidebar, ProductCard (scoped to root)
│   │   ├── pom/                      # One page object per route (Home, ProductDetails, Checkout, Login, ...)
│   │   ├── base.ts                   # Extended test fixture with auto-initialized POMs
│   │   ├── base-component.ts         # Component base class
│   │   └── base-page.ts              # Page base class
│   └── spec/
│       ├── api/                      # Auth, Cart, Invoices, Products, GraphQL, QUERY
│       ├── e2e/                      # Auth, Catalog, Checkout, Contact, Admin
│       ├── mock/                     # Responses, empty states, route.fetch, delays, resilience, GraphQL
│       └── visual/                   # ARIA visual regression specs
├── .env.example                      # Template environment variables
├── .gitignore                        # Git ignore rules
├── package.json                      # Scripts and dependencies
├── playwright.config.ts              # Tri-project Playwright configuration
└── tsconfig.json                     # TypeScript strict configuration & path aliases
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `20.x` or newer recommended (`24.x` used in CI)
- **npm**: `10.x` or newer

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/practice-software-testing-playwright.git
   cd practice-software-testing-playwright
   ```

2. **Install dependencies**:
   ```bash
   npm ci
   ```

3. **Install Playwright browsers**:
   ```bash
   npx playwright install --with-deps chromium
   ```

### Environment Configuration
The framework supports switching environments via the `ENV` variable:

```bash
# Default: Live Cloud Demo (.env.prod)
npm run test:all

# Local Docker Microservices (.env.local)
cross-env ENV=local npm run test:all
```

| Environment | Base URL | API URL | Description |
| :--- | :--- | :--- | :--- |
| **`prod`** (default) | `https://practicesoftwaretesting.com` | `https://api.practicesoftwaretesting.com` | Hosted public demo environment |
| **`local`** | `http://localhost:4200` | `http://localhost:8091` | Local Docker compose toolshop stack |

---

## ⚡ Command Reference

| Command | Action / Scope |
| :--- | :--- |
| `npm run test:all` | Run all 28 tests across E2E, API, Visual, and Mock suites in parallel |
| `npm run test:e2e` | Run UI End-to-End tests (`toolshop-e2e` project) |
| `npm run test:api` | Run Headless API tests (`toolshop-api` project) |
| `npm run test:mock` | Run Mock API tests with network route interception (`toolshop-mock` project) |
| `npm run test:visual` | Run ARIA Snapshot visual regression tests (`@visual` tag) |
| `npm run test:visual:update_snapshot` | Update baseline ARIA YAML snapshot files |
| `npm run report` | Open the HTML Playwright execution report |
| `npm run lint` | Run ESLint static code analysis |
| `npx tsc --noEmit` | Validate TypeScript types with zero emissions |

### Useful CLI Flags
```bash
# Run a specific spec file
npx playwright test tests/spec/e2e/checkout/checkout.spec.ts

# Run tests matching a grep tag
npx playwright test --grep "@visual"

# Run tests in headed browser mode
npx playwright test --headed --project=toolshop-e2e

# Run with interactive Playwright UI mode
npx playwright test --ui
```

---

## 🔄 Continuous Integration (CI/CD)

The GitHub Actions CI pipeline ([`.github/workflows/playwright.yml`](.github/workflows/playwright.yml)) executes all test suites in parallel and consolidates blob reports into a single unified HTML dashboard:

```mermaid
flowchart TD
    A[Code Push / Pull Request] --> B[Job: Lint & Typecheck]
    B -->|Success| C[Job: API Tests Node 24]
    B -->|Success| D[Job: Mock Tests Docker]
    B -->|Success| E[Job: E2E Tests Docker]
    B -->|Success| F[Job: Visual Tests Docker]
    C --> G[Job: Merge Reports]
    D --> G
    E --> G
    F --> G
    G --> H[Upload Unified HTML Report]
    G --> I[Generate GitHub Step Summary]
```

- **Stage 1 (`lint-and-typecheck`)**: Fast TypeScript syntax & type verification (`npx tsc --noEmit`) on Node.js 24.
- **Stage 2 (Parallel Execution)**:
  - **`api-tests`**: Runs pure HTTP tests concurrently without browser initialization.
  - **`mock-tests`**: Runs mock API tests in official Playwright Docker container (`mcr.microsoft.com/playwright:v1.63.0-noble`).
  - **`e2e-tests`**: Runs full browser journeys in Playwright Docker, excluding visual regression.
  - **`visual-tests`**: Runs ARIA snapshot visual regression tests in Playwright Docker.
  - Each job uploads its respective lightweight `blob-report-*` artifact.
- **Stage 3 (`merge-reports`)**:
  - Automatically triggered upon completion of all test jobs (`if: always()`).
  - Merges blob reports with `npx playwright merge-reports -c playwright.config.ts`.
  - Publishes a single consolidated HTML report with 30-day retention.
  - Generates a consolidated markdown status table directly on the GitHub Actions workflow step summary.

---

## 🧪 Test Suite Coverage Matrix

| Suite | Category | Scenario / Description | Type | Tag |
| :--- | :--- | :--- | :--- | :--- |
| **E2E** | Authentication | Customer signs in with valid credentials | Browser | `@e2e` |
| **E2E** | Authentication | Login displays error on invalid password | Browser | `@e2e` |
| **E2E** | Authentication | New user registration using dynamic Faker profile | Browser | `@e2e` |
| **E2E** | Catalog | Search products by keyword | Browser | `@e2e` |
| **E2E** | Catalog | Filter product list by brand | Browser | `@e2e` |
| **E2E** | Checkout | Full purchase flow: Cart -> Sign-in -> Address -> Payment -> Invoice | Browser | `@e2e` |
| **E2E** | Contact | Contact form submission with sample file attachment | Browser | `@e2e` |
| **E2E** | Admin | Administrator login & product management navigation | Browser | `@e2e` |
| **Visual** | Catalog | ARIA snapshot tree of header & navigation bar | Accessibility | `@visual` |
| **Visual** | Catalog | ARIA snapshot tree of catalog filter sidebar | Accessibility | `@visual` |
| **Visual** | Product Details | ARIA snapshot tree of product details page | Accessibility | `@visual` |
| **API** | Authentication | User login via POST `/users/login` | HTTP REST | `@api` |
| **API** | Authentication | 401 Unauthorized check for bad credentials | HTTP REST | `@api` |
| **API** | Authentication | New customer registration via POST `/users/register` | HTTP REST | `@api` |
| **API** | Products | Paginated product retrieval via GET `/products` | HTTP REST | `@api` |
| **API** | Products | Product search by query phrase | HTTP REST | `@api` |
| **API** | Cart | Cart creation and item addition via `/carts` | HTTP REST | `@api` |
| **API** | Invoices | Authenticated user invoice list via GET `/invoices` | HTTP REST | `@api` |
| **API** | GraphQL | Catalog query resolution against `/graphql` endpoint | GraphQL | `@api` |
| **API** | RFC 10008 | Safe HTTP `QUERY` method with payload & fallback | RFC 10008 | `@api` |
| **Mock** | Basic Responses | Renders catalog with custom mocked products, special characters, and badges | Browser / Route Mock | - |
| **Mock** | Basic Responses | Displays empty state when catalog API returns 0 items | Browser / Route Mock | - |
| **Mock** | Response Interception | Intercepts live products response via `route.fetch()` and prepends promo product | Browser / Route Fetch | - |
| **Mock** | GraphQL | Selectively mocks GraphQL query based on `operationName` (`GetProducts`) | Browser / Route Mock | - |
| **Mock** | Artificial Latency | Delays product catalog API response and completes load gracefully | Browser / Route Delay | - |
| **Mock** | Network Resilience | Handles HTTP 500 Internal Server Error during login gracefully | Browser / Fault Injection | - |
| **Mock** | Network Resilience | Handles HTTP 401 Unauthorized with custom error payload | Browser / Fault Injection | - |
| **Mock** | Network Resilience | Handles dropped network connection via `route.abort(failed)` | Browser / Fault Injection | - |

---

## 🛡️ Best Practices & Antipattern Guardrails

This framework strictly enforces high-reliability testing standards:
- ❌ **No `page.waitForTimeout()` arbitrary sleeps** — uses Playwright auto-waiting and locator assertions (`toBeVisible()`, `toHaveText()`).
- ❌ **No brittle CSS/XPath selectors** — relies on `data-test` IDs and accessible roles (`getByRole`, `getByTestId`).
- ❌ **No `force: true` clicks** — ensures elements are genuinely actionable and interactable by real users.
- ❌ **No raw locators in test specs** — all locator logic is encapsulated inside Page Component Object Models.
- ❌ **No hardcoded credentials** — centralized in `data/users.ts` and managed via environment secrets.

---

## 📄 License

This project is licensed under the terms of the [MIT License](https://opensource.org/licenses/MIT).
