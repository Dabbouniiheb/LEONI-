# Redundancy and Deletion Review — LEONI Planning

**Review type:** evidence-based, review-only  
**Application root:** `leoni-planing/`  
**Review date:** 2026-07-16  
**Source of truth:** current source code only  
**Changes performed:** none, except creation of this report

This review distinguishes four different operations that must not be conflated:

- **deletion:** removing a file, symbol, declaration, asset reference, or unused style;
- **deduplication:** choosing one implementation and redirecting verified consumers to it;
- **behavioral correction:** changing an observable result, even when the existing result appears defective;
- **migration work:** changing database structure, compatibility, or persisted-data semantics.

No cleanup recommendation in this document was implemented.

## 1. Executive summary

The codebase is **reasonably structured at the feature level**: all routers are mounted, all controller exports are attached to routes, all validation exports are attached to routes, page-specific scripts are loaded by their corresponding HTML pages, and the main planning-window behavior has automated coverage. The project is not broadly full of duplicate files: no two first-party files have identical SHA-256 content.

The main maintainability problem is not file count. It is **parallel implementations of the same rules across layers**:

- target-month calculation exists in three places and two copies are timezone-incorrect;
- user data access exists both in a model and as direct controller SQL;
- planning reads have overlapping endpoints and query methods;
- date, month, password, and group validation are repeated with different semantics;
- navigation exists in an unused server configuration and in the live browser layout;
- error and permission handling mix typed errors, message matching, raw role checks, and middleware;
- current schema, historical migrations, and runtime compatibility DDL overlap without a migration ledger.

### Counted findings

| Metric | Count | Counting rule |
|---|---:|---|
| Strong deletion candidates | **14 groups** | High-confidence report rows; 1 whole file and multiple symbols/imports/assets |
| Manual-verification candidates | **10 groups** | Strong static suspicion with an external-consumer, deployment, performance, or compatibility question |
| Duplicate-code clusters | **20** | Clusters `DUP-01` through `DUP-20` in section 7 |
| Unused dependency candidates | **1** | `nodemon`; declared but not used by scripts or source |
| Exact duplicate files | **0** | SHA-256 comparison of first-party files |
| Mounted routes reviewed | **44** | 43 router declarations plus the inline CSRF-token endpoint |

### Highest-risk cleanup areas

1. **Startup/database compatibility:** `config/db.js` executes schema loading, compatibility DDL, data repairs, seeding, and credential-related logging during module initialization. It must not be mechanically split or removed without fresh-install and upgrade tests.
2. **Work sessions:** `services/WorkSessionService.js` contains transactions, state transitions, stale-session cleanup, audit events, and work-hour updates but has no direct automated tests.
3. **Planning generation:** date-window, group selection, duplicate prevention, and transactional insertion are covered by tests and should be changed only behind those tests.
4. **Browser planning controller:** `views/assets/js/planning.js` is 1,152 lines and coordinates DOM, API calls, timers, activity detection, and session state.
5. **Database migration history:** overlap between final schema and migrations is intentional history, not proof that migrations are deletable.

### Areas not to touch yet

Do not delete migrations, runtime schema loading, session-store setup, permission middleware, work-session cleanup, planning-window helpers, browser scripts loaded by HTML, audit logging, dynamic CSS status selectors, or compatibility columns merely because a local text search suggests overlap.

## 2. Baseline

### Commands and results

| Check | Command | Result |
|---|---|---|
| Automated tests | `node --test tests/*.test.js` | **19 passed, 0 failed, 0 skipped, 0 cancelled** |
| JavaScript syntax | `node --check <file>` for every first-party `.js` | **63/63 passed** |
| Runtime version | `node --version` | **v24.16.0** |
| npm version | `npm --version` | **11.13.0** |
| Standard npm test | Not run | `package.json:9` is a known failing placeholder, so it is not correctly configured |
| Application startup | Not run | Avoided any connection to an unknown database |

### First-party inventory

| Extension | Count |
|---|---:|
| `.js` | 63 |
| `.json` | 2 |
| `.sql` | 8 |
| `.html` | 11 |
| `.css` | 1 |
| `.svg` | 1 |
| `.env.example` template | 1 |
| **Total** | **87** |

The review excluded `node_modules/`, `.git/`, `.agents/`, `__MACOSX/`, `.DS_Store`, `rapport_stage/`, archives, generated reports, the historical PDF named in the instructions, and the historical gap report named in the instructions. No Git command was used. The real `.env` file was neither read nor printed.

### Reference-graph method

The table below combines:

- relative CommonJS `require(...)` resolution;
- route mounting from `server.js`;
- controller/validator attachment in routers;
- HTML `<script>` and `<link>` references;
- page delivery through `sendFile`;
- package scripts;
- test discovery;
- runtime loading of `sql/schema.sql`;
- historical migration status;
- known startup side effects.

A missing static import was **not** treated as sufficient deletion proof. Dynamic browser classes, runtime Bootstrap elements, public/mounted HTTP endpoints, migration history, and module initialization were checked separately.

| File | Type | Referenced by | Runtime role | Side effects | Candidate status |
|---|---|---|---|---|---|
| `.env.example` | .example | `deployment/setup template (manual consumer)` | environment variable template | No | Probably required |
| `config/constants.js` | .js | `config/db.js`<br>`config/permissions.js`<br>`controllers/authController.js`<br>`controllers/dashboardController.js`<br>`controllers/exportController.js`<br>`controllers/leaveRequestController.js`<br>`controllers/planningController.js`<br>`controllers/userController.js`<br>`server.js`<br>`services/LeaveRequestService.js`<br>`services/MonthlyGroupSelectionService.js`<br>`services/PlanningService.js`<br>`services/WorkSessionService.js`<br>`utils/errors.js`<br>`utils/helpers.js`<br>`utils/planningGenerationWindow.js`<br>`validations/leaveRequestValidation.js`<br>`validations/userValidation.js` | runtime configuration | No | Required |
| `config/db.js` | .js | `controllers/authController.js`<br>`controllers/dashboardController.js`<br>`controllers/exportController.js`<br>`controllers/logController.js`<br>`controllers/userController.js`<br>`models/LeaveRequest.js`<br>`models/MonthlyGroupSelection.js`<br>`models/Planning.js`<br>`models/User.js`<br>`models/WorkSession.js`<br>`services/MonthlyGroupSelectionService.js`<br>`services/PlanningService.js`<br>`services/WorkSessionService.js`<br>`utils/logger.js` | runtime configuration | Yes | Required |
| `config/permissions.js` | .js | `config/sidebar.js`<br>`controllers/authController.js`<br>`controllers/planningController.js`<br>`middlewares/auth.js`<br>`routes/exportRoutes.js`<br>`routes/leaveRequestRoutes.js`<br>`routes/logRoutes.js`<br>`routes/monthlyGroupSelectionRoutes.js`<br>`routes/planningRoutes.js`<br>`routes/userRoutes.js`<br>`routes/viewRoutes.js`<br>`routes/workSessionRoutes.js`<br>`services/LeaveRequestService.js` | runtime configuration | No | Required |
| `config/sidebar.js` | .js | None verified | runtime configuration | No | Strong deletion candidate |
| `controllers/authController.js` | .js | `routes/authRoutes.js` | HTTP controller | No | Required |
| `controllers/dashboardController.js` | .js | `routes/dashboardRoutes.js` | HTTP controller | No | Required |
| `controllers/exportController.js` | .js | `routes/exportRoutes.js` | HTTP controller | No | Required |
| `controllers/leaveRequestController.js` | .js | `routes/leaveRequestRoutes.js` | HTTP controller | No | Required |
| `controllers/logController.js` | .js | `routes/logRoutes.js` | HTTP controller | No | Required |
| `controllers/monthlyGroupSelectionController.js` | .js | `routes/monthlyGroupSelectionRoutes.js` | HTTP controller | No | Required |
| `controllers/planningController.js` | .js | `routes/planningRoutes.js` | HTTP controller | No | Required |
| `controllers/userController.js` | .js | `routes/userRoutes.js` | HTTP controller | No | Required |
| `controllers/workSessionController.js` | .js | `routes/workSessionRoutes.js` | HTTP controller | No | Required |
| `middlewares/auth.js` | .js | `routes/authRoutes.js`<br>`routes/dashboardRoutes.js`<br>`routes/exportRoutes.js`<br>`routes/leaveRequestRoutes.js`<br>`routes/logRoutes.js`<br>`routes/monthlyGroupSelectionRoutes.js`<br>`routes/planningRoutes.js`<br>`routes/userRoutes.js`<br>`routes/viewRoutes.js`<br>`routes/workSessionRoutes.js` | Express middleware | No | Required |
| `middlewares/validate.js` | .js | `routes/authRoutes.js`<br>`routes/leaveRequestRoutes.js`<br>`routes/monthlyGroupSelectionRoutes.js`<br>`routes/planningRoutes.js`<br>`routes/userRoutes.js`<br>`routes/workSessionRoutes.js` | Express middleware | No | Required |
| `models/LeaveRequest.js` | .js | `services/LeaveRequestService.js` | data access model | No | Required |
| `models/MonthlyGroupSelection.js` | .js | `services/MonthlyGroupSelectionService.js`<br>`services/PlanningService.js` | data access model | No | Required |
| `models/Planning.js` | .js | `services/PlanningGenerationWindowService.js`<br>`services/PlanningService.js` | data access model | No | Required |
| `models/User.js` | .js | `services/LeaveRequestService.js` | data access model | No | Required |
| `models/WorkSession.js` | .js | `services/WorkSessionService.js` | data access model | No | Required |
| `package-lock.json` | .json | `npm lockfile for package.json` | locked dependency graph | No | Required |
| `package.json` | .json | `Node/npm project manifest` | npm manifest and scripts | No | Required |
| `routes/authRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/dashboardRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/exportRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/leaveRequestRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/logRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/monthlyGroupSelectionRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/planningRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/userRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/viewRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `routes/workSessionRoutes.js` | .js | `server.js` | Express router mounted by server.js | No | Required |
| `server.js` | .js | `package.json#scripts.dev`<br>`package.json#scripts.start` | application entry point and startup side effects | Yes | Required |
| `services/LeaveRequestService.js` | .js | `controllers/leaveRequestController.js` | domain/service orchestration | No | Required |
| `services/MonthlyGroupSelectionService.js` | .js | `controllers/monthlyGroupSelectionController.js`<br>`tests/monthlyGroupSelectionWindowGuard.test.js` | domain/service orchestration | No | Required |
| `services/PlanningGenerationWindowService.js` | .js | `services/MonthlyGroupSelectionService.js`<br>`services/PlanningService.js` | domain/service orchestration | No | Required |
| `services/PlanningService.js` | .js | `controllers/planningController.js`<br>`tests/planningServiceGenerationGuard.test.js` | domain/service orchestration | No | Required |
| `services/WorkSessionService.js` | .js | `controllers/workSessionController.js`<br>`server.js` | domain/service orchestration | Yes | Required |
| `sql/migrations/001_add_enterprise_columns.sql` | .sql | `migration history` | historical database migration | No | Historical migration — keep |
| `sql/migrations/002_create_leave_requests.sql` | .sql | `migration history` | historical database migration | No | Historical migration — keep |
| `sql/migrations/003_add_horaire_to_planning.sql` | .sql | `migration history` | historical database migration | No | Historical migration — keep |
| `sql/migrations/004_create_work_sessions.sql` | .sql | `migration history` | historical database migration | No | Historical migration — keep |
| `sql/migrations/005_harden_work_sessions_and_work_hours.sql` | .sql | `migration history` | historical database migration | No | Historical migration — keep |
| `sql/migrations/006_add_updated_at_to_planning.sql` | .sql | `migration history` | historical database migration | No | Historical migration — keep |
| `sql/migrations/007_create_monthly_group_selections.sql` | .sql | `migration history` | historical database migration | No | Historical migration — keep |
| `sql/schema.sql` | .sql | `config/db.js` | fresh-install schema loaded by config/db.js | No | Required |
| `tests/monthlyGroupSelectionWindowGuard.test.js` | .js | `node --test tests/*.test.js` | automated node:test coverage | No | Required |
| `tests/planningGenerationWindow.test.js` | .js | `node --test tests/*.test.js` | automated node:test coverage | No | Required |
| `tests/planningServiceGenerationGuard.test.js` | .js | `node --test tests/*.test.js` | automated node:test coverage | No | Required |
| `utils/appLogger.js` | .js | `config/db.js`<br>`controllers/authController.js`<br>`controllers/dashboardController.js`<br>`controllers/exportController.js`<br>`controllers/userController.js`<br>`middlewares/auth.js`<br>`middlewares/validate.js`<br>`server.js`<br>`services/WorkSessionService.js`<br>`utils/logger.js` | shared utility/runtime support | No | Required |
| `utils/asyncHandler.js` | .js | `controllers/authController.js`<br>`controllers/dashboardController.js`<br>`controllers/exportController.js`<br>`controllers/leaveRequestController.js`<br>`controllers/logController.js`<br>`controllers/monthlyGroupSelectionController.js`<br>`controllers/planningController.js`<br>`controllers/userController.js`<br>`controllers/workSessionController.js` | shared utility/runtime support | No | Required |
| `utils/errors.js` | .js | `controllers/authController.js`<br>`services/LeaveRequestService.js`<br>`services/MonthlyGroupSelectionService.js`<br>`services/PlanningService.js`<br>`services/WorkSessionService.js`<br>`utils/planningGenerationWindow.js` | shared utility/runtime support | No | Required |
| `utils/helpers.js` | .js | `controllers/dashboardController.js`<br>`controllers/planningController.js`<br>`middlewares/auth.js` | shared utility/runtime support | No | Required |
| `utils/logger.js` | .js | `controllers/authController.js`<br>`controllers/exportController.js`<br>`controllers/leaveRequestController.js`<br>`controllers/planningController.js`<br>`controllers/userController.js`<br>`services/MonthlyGroupSelectionService.js`<br>`services/WorkSessionService.js` | shared utility/runtime support | Yes | Required |
| `utils/planningGenerationWindow.js` | .js | `services/PlanningGenerationWindowService.js`<br>`tests/monthlyGroupSelectionWindowGuard.test.js`<br>`tests/planningGenerationWindow.test.js`<br>`tests/planningServiceGenerationGuard.test.js` | shared utility/runtime support | No | Required |
| `validations/authValidation.js` | .js | `routes/authRoutes.js` | express-validator rules | No | Required |
| `validations/leaveRequestValidation.js` | .js | `routes/leaveRequestRoutes.js` | express-validator rules | No | Required |
| `validations/monthlyGroupSelectionValidation.js` | .js | `routes/monthlyGroupSelectionRoutes.js` | express-validator rules | No | Required |
| `validations/planningValidation.js` | .js | `routes/planningRoutes.js` | express-validator rules | No | Required |
| `validations/userValidation.js` | .js | `routes/userRoutes.js` | express-validator rules | No | Required |
| `validations/workSessionValidation.js` | .js | `routes/workSessionRoutes.js` | express-validator rules | No | Required |
| `views/403.html` | .html | `middlewares/auth.js` | server-rendered page shell | No | Required |
| `views/404.html` | .html | `server.js` | server-rendered page shell | No | Required |
| `views/assets/css/leoni.css` | .css | `views/403.html`<br>`views/404.html`<br>`views/calendar.html`<br>`views/change-password.html`<br>`views/dashboard.html`<br>`views/export.html`<br>`views/leave-requests.html`<br>`views/login.html`<br>`views/logs.html`<br>`views/planning.html`<br>`views/users.html` | shared application stylesheet | No | Required |
| `views/assets/favicon.svg` | .svg | `views/403.html`<br>`views/404.html`<br>`views/calendar.html`<br>`views/change-password.html`<br>`views/dashboard.html`<br>`views/export.html`<br>`views/leave-requests.html`<br>`views/login.html`<br>`views/logs.html`<br>`views/planning.html`<br>`views/users.html` | shared favicon | No | Required |
| `views/assets/js/api.js` | .js | `views/calendar.html`<br>`views/change-password.html`<br>`views/dashboard.html`<br>`views/export.html`<br>`views/leave-requests.html`<br>`views/login.html`<br>`views/logs.html`<br>`views/planning.html`<br>`views/users.html` | browser-side page/shared script | No | Required |
| `views/assets/js/auth.js` | .js | `views/calendar.html`<br>`views/change-password.html`<br>`views/dashboard.html`<br>`views/export.html`<br>`views/leave-requests.html`<br>`views/login.html`<br>`views/logs.html`<br>`views/planning.html`<br>`views/users.html` | browser-side page/shared script | No | Required |
| `views/assets/js/calendar.js` | .js | `views/calendar.html` | browser-side page/shared script | No | Required |
| `views/assets/js/change-password.js` | .js | `views/change-password.html` | browser-side page/shared script | No | Required |
| `views/assets/js/dashboard.js` | .js | `views/dashboard.html` | browser-side page/shared script | No | Required |
| `views/assets/js/export.js` | .js | `views/export.html` | browser-side page/shared script | No | Required |
| `views/assets/js/layout.js` | .js | `views/calendar.html`<br>`views/change-password.html`<br>`views/dashboard.html`<br>`views/export.html`<br>`views/leave-requests.html`<br>`views/logs.html`<br>`views/planning.html`<br>`views/users.html` | browser-side page/shared script | No | Required |
| `views/assets/js/leave-requests.js` | .js | `views/leave-requests.html` | browser-side page/shared script | No | Required |
| `views/assets/js/login.js` | .js | `views/login.html` | browser-side page/shared script | No | Required |
| `views/assets/js/logs.js` | .js | `views/logs.html` | browser-side page/shared script | No | Required |
| `views/assets/js/planning.js` | .js | `views/planning.html` | browser-side page/shared script | No | Required |
| `views/assets/js/users.js` | .js | `views/users.html` | browser-side page/shared script | No | Required |
| `views/calendar.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/change-password.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/dashboard.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/export.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/leave-requests.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/login.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/logs.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/planning.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |
| `views/users.html` | .html | `routes/viewRoutes.js` | server-rendered page shell | No | Required |

## 3. Safe deletion candidates

These candidates have no verified runtime, HTML, test, dynamic-string, migration, or side-effect requirement in the current repository. “Safe” means behavior-preserving for the current repository; it does not authorize deletion without review.

| ID | Path/symbol | Why removable | Evidence | Risk | Confidence |
|---|---|---|---|---|---|
| SD-01 | `config/sidebar.js` (whole file) | No importer, loader, test, or startup side effect. The live navigation is the browser `navItems` array. | `config/sidebar.js:11-70`; duplicate live configuration at `views/assets/js/layout.js:16-25`; repository-wide reference search found only the declaration. | Low; one final deployment search should confirm no external `require`. Severity: Low. | High |
| SD-02 | Unused imports: `authController.logger`, `authController.AppError`, `dashboardController.logger`, `exportController.logger`, `userController.logger` | Each binding appears only in its declaration or a historical comment. Requiring `appLogger` adds no needed side effect. | `controllers/authController.js:18,20`; `dashboardController.js:12`; `exportController.js:14`; `userController.js:17`. | Low. Severity: Informational. | High |
| SD-03 | `utils/helpers.js::sendSuccess` and `sendError` | Exported but never imported or called; current response contracts are built directly. | `utils/helpers.js:32-47,82-83`; zero references outside the file. | Low; do not replace existing responses while deleting them. Severity: Low. | High |
| SD-04 | `UnauthorizedError` and `ValidationError` | Never imported, instantiated, dynamically accessed, or tested. | `utils/errors.js:32-35,56-60,71,75`; repository-wide symbol search. | Low within this application; package is not functioning as a library because `main` points to a missing file. Severity: Low. | High |
| SD-05 | Unused `User` methods: `findAllActive`, `findByEmail`, `findConflicts`, `create`, `update`, `softDelete`, `updatePassword` | No internal caller; auth and user controllers execute parallel SQL directly. | `models/User.js:4-12,22-96`; only `User.findById` is called, at `services/LeaveRequestService.js:73`. | Low for runtime deletion, but choosing these methods as a future canonical data layer is an alternative. Severity: Low. | High |
| SD-06 | `MonthlyGroupSelection.findMissingForMonth` | Static method has no caller, string-based lookup, test stub, or startup role. | `models/MonthlyGroupSelection.js:75-88`; repository-wide symbol search. | Low. Severity: Informational. | High |
| SD-07 | Entire unused constants `ROLE_VALUES`, `GROUP_LABELS`, `GROUP_VALUES`, `VALIDATION_STATUS` | Defined and exported but never read by backend, browser code, tests, or SQL loaders. | `config/constants.js:11,18-23,45-49,126,128-129,133`. | Low; confirm no out-of-repository CommonJS consumer. Severity: Informational. | High |
| SD-08 | Five dead export entries only: `utils/errors.AppError`, `ROLE_PERMISSIONS`, `middlewares/auth.wantsJson`, `WINDOW_CLOSED_MESSAGE`, `INVALID_MONTH_MESSAGE` | The class/object/constants remain used internally, but these five public export entries have no consumer. | `utils/errors.js:10,26,38,44,50,68-76`; `config/permissions.js:93,104,109`; `middlewares/auth.js:12,103`; `utils/planningGenerationWindow.js:8-10,69,80,89-90`. | Low; remove export entries only—not the live `AppError` superclass, permission map, local helper, or messages. Severity: Informational. | High |
| SD-09 | `views/assets/js/export.js::loggedUser` | Assigned from `LeoniAuth.getUser()` and never read. | `views/assets/js/export.js:5`; lexical-use search. | None beyond syntax. Severity: Informational. | High |
| SD-10 | CSS custom property `--leoni-border-strong` | Declared but never referenced through `var(--leoni-border-strong)`. | `views/assets/css/leoni.css:22`; CSS/HTML/JS search. | Low; visual regression check still appropriate. Severity: Informational. | High |
| SD-11 | Standalone `.btn-leoni-ghost` rules plus only its selector in the shared small-button rule | No HTML, JavaScript template, dynamic class constructor, or Bootstrap runtime path produces the class. | Standalone rules at `views/assets/css/leoni.css:536-555`; selector at `:567` shares declarations at `:568-571` with three live button classes. | Low; delete the standalone ghost blocks and remove only the ghost selector from the shared rule—keep the shared declarations. Visual regression check required. Severity: Low. | High |
| SD-12 | Markup class token `work-session-panel` | The element remains, but this class has no CSS selector and no JS query. | `views/assets/js/planning.js:123`; repository-wide class search. | None if only the token is removed. Severity: Informational. | High |
| SD-13 | Bootstrap JavaScript bundle inclusion on `logs.html` | The page uses Bootstrap CSS classes but no `bootstrap.*`, `data-bs-*`, modal, tooltip, collapse, or dropdown behavior. | `views/logs.html:25`; `views/assets/js/logs.js:1-92`. | Low; open the logs page once after removal. Severity: Low. | High |
| SD-14 | Font Awesome stylesheet inclusion on `login.html` | No `fa-*` icon, icon pseudo-element, or page script uses Font Awesome on the login page. | `views/login.html:17-20`, `views/login.html:24-68`, `views/assets/js/login.js:1-40`. | Low; visual check login page. Severity: Low. | High |

## 4. Candidates requiring manual verification

| ID | Path/symbol | Suspicion | Missing proof | Verification step | Risk |
|---|---|---|---|---|---|
| MV-01 | `LeoniAPI.getAllPlanning`, `getWorkSessionSummary`, `endWorkSessionBeacon` | No checked-in page script calls these browser-global façade methods. | An externally injected script, browser automation, or undocumented consumer could call them. | Search deployment overlays and E2E suites; instrument calls in a test environment. | Low code risk, medium integration risk. Confidence: High statically. |
| MV-02 | `GET /api/planning/all` stack: route, controller, service, `Planning.findAll` | No current frontend call; overlaps `GET /api/planning`, differing mainly in sort order. | Mounted API may be consumed outside this repository. | Review access logs/API consumers and compare response order/contracts. | Medium public-contract risk. Confidence: High suspicion. |
| MV-03 | `GET /api/work-sessions/summary` stack | Mounted, permission-protected, but its browser façade is not called. | It may be an administrative or external-reporting API. | Check Team Leader workflows, access logs, and integration tests. | Medium authorization/reporting risk. Confidence: Medium-high. |
| MV-04 | `nodemon` | Declared in `devDependencies`, but no script or source references it; `dev` duplicates `start`. | Developers may invoke `npx nodemon server.js` manually. | Confirm the documented/local development workflow. | Low runtime risk, medium developer-experience risk. Confidence: High static / Medium workflow. |
| MV-05 | `cookie-parser` middleware/dependency | It is executed, but no checked-in code reads `req.cookies` or `req.signedCookies`; session and CSRF use other mechanisms. | Express/session middleware interactions and external middleware expectations were not integration-tested. | Remove only in an isolated branch and run login/session/CSRF tests. | Medium authentication risk. Confidence: Medium. |
| MV-06 | Permissions `DASHBOARD_STATISTICS`, `PLANNING_READ_ALL`, `SETTINGS_MANAGE` | Declared/granted but no route actually enforces them as their named operations. | Session payloads are a browser-visible contract and external consumers may inspect them. | Record permission payload use and define intended RBAC matrix before deletion. | Medium authorization drift risk. Confidence: Medium intent. |
| MV-07 | Individually unused domain constants: `PLANNING_STATUS.ONSITE`, `AUDIT_ACTIONS.RESTORE_USER`, several validation/HTTP keys | No direct JavaScript property access was found. | Some values mirror persisted SQL/domain states or document a planned contract. | Compare database values, audit history, and external API contracts. | Medium semantic risk; do not equate “no property access” with “invalid domain value.” Confidence: Medium. |
| MV-08 | CSS states `.work-session-badge-ended`, `.work-session-badge-expired`, `.toast-info`, and the unstyled `is-loading` token | Ended/expired/info variants are not reached in the normal checked flow; `is-loading` is produced at `planning.js:74,372` but has no matching CSS selector. | Edge states, externally added styles, or future page code may still depend on these tokens. | Exercise loading/ended/expired/info states in a browser and inspect computed classes before changing tokens or styles. | Low size benefit, medium UI-state risk. Confidence: Medium-high static / Low external. |
| MV-09 | Indexes `idx_monthly_group_month` and `idx_leave_user` | Each is a left-prefix of a wider index and may be redundant. | No production cardinality, slow-query log, or `EXPLAIN` plan was available. | Compare plans and write cost on representative data before any DDL. | High database-performance risk. Confidence: Medium without plans. |
| MV-10 | `getTargetMonthKey().isNextMonth` return property | Only `monthKey` is destructured by the current consumer. | The helper is exported and could be used outside the repository. | Search external callers; add a focused helper contract test. | Low code risk, medium contract risk. Confidence: High static / Medium external. |

## 5. Items that appear unused but must be kept

| Path/symbol | Why it appears unused | Why it must remain |
|---|---|---|
| `sql/migrations/001_...007_*.sql` | Final `schema.sql` already contains much of their end state. | They encode upgrade order, data repairs, semantic changes, and existing-install history. Migration 005 mutates work hours and session states; 006 remains valid history even though `updated_at` is in the final schema. |
| `sql/schema.sql` | Tables also appear in migrations and runtime guards. | `config/db.js:39-40` loads it synchronously at startup for fresh-schema initialization. |
| `models/User.js` | Seven of eight methods have no caller. | `User.findById` is used by `LeaveRequestService.js:73`; delete methods, not the file. |
| `utils/appLogger.js` and `utils/logger.js` | Similar names suggest duplicate logging modules. | Responsibilities differ: structured application output versus database audit records. `utils/logger.js` also has DB/audit side effects. |
| `PlanningGenerationWindowService.js` | It is a thin adapter around a pure utility. | It obtains the authoritative MySQL UTC clock through `Planning` and is used by planning and monthly-selection services; tests stub the boundary. |
| `utils/planningGenerationWindow.js` | Some messages are exported but unused. | Core timezone/window functions are directly covered by `tests/planningGenerationWindow.test.js` and protect planning writes. |
| `WorkSessionService.startStaleSessionCleanup` / `stopStaleSessionCleanup` | No controller invokes them. | `server.js:231,235` invokes them as lifecycle hooks. |
| `pauseWorkSessionBeacon` and CSRF beacon support | Beacon-specific code has few direct calls. | `planning.js:955-958` uses it during `pagehide`, when ordinary async fetch is unreliable. |
| Dynamic CSS families `.form-status-*`, `.leave-status-*`, `.toast-*`, `.work-session-badge-*` | Exact class strings are absent from HTML. | JavaScript constructs them at runtime in `planning.js:333,721`, `leave-requests.js:180`, and `layout.js:162`. |
| `.modal-backdrop` | No checked-in HTML creates this element. | Bootstrap creates it dynamically for the modals used by planning, users, and leave requests. |
| Bootstrap JS on planning/users/leave-requests | Most pages need only Bootstrap CSS. | These three scripts instantiate `bootstrap.Modal` at `planning.js:234`, `users.js:159-160`, and `leave-requests.js:165`. |
| `views/403.html` and `views/404.html` | No browser script imports them. | They are loaded through `sendFile` by permission middleware and the final 404 handler. |
| `package-lock.json` | It duplicates dependency information from `package.json`. | It is the reproducible dependency graph and records an expected direct/transitive `mysql2` version split. |
| `.env.example` | No runtime module imports it. | It is a manual setup contract. This review deliberately did not inspect the real `.env`. |
| `users.group_id` | Monthly group selections now exist in a dedicated table. | Work-session summary, leave-request reads, and session payloads still consume the legacy column; removal would change results. |
| `planning.horaire`, `planned_work_hour`, `work_sessions.active_slot` | Some fields have little direct UI behavior. | They are persisted compatibility/data-integrity contracts with migrations and queries; removal requires a database migration and integration tests. |
| Session-store table created by `express-mysql-session` | It is absent from `schema.sql`. | It is runtime infrastructure configured by `server.js:100-117`; deleting it invalidates sessions and triggers DDL recreation. |


## 6. Dead code

### 6.1 Backend

| ID | File | Line/symbol | Evidence | Risk | Recommendation | Confidence |
|---|---|---|---|---|---|---|
| DC-B01 | Four controllers | Unused `appLogger` imports | `authController.js:18`, `dashboardController.js:12`, `exportController.js:14`, `userController.js:17`; no code use after declaration. | Low | Remove imports and update historical comments claiming logger use. | High |
| DC-B02 | `controllers/authController.js` | Misnamed unused `AppError` binding | `authController.js:20` imports the whole exports object, not the class, and never reads it. | Low | Remove import; do not change global error handling. | High |
| DC-B03 | `utils/helpers.js` | `sendSuccess`, `sendError` | Definitions/exports at `:32-47,82-83`; no consumer. | Low | Delete functions and the inaccurate response-standardization comment. | High |
| DC-B04 | `utils/errors.js` | `UnauthorizedError`, `ValidationError` | Definitions/exports at `:32-35,56-60,71,75`; zero imports/instantiations. | Low | Delete subclasses/exports, or deliberately adopt them first. | High |
| DC-B05 | `models/User.js` | Seven static methods | `:4-12,22-96`; all user CRUD/auth SQL is currently direct in controllers. | Low runtime; medium architecture choice | Either remove dead methods or refactor controllers to use a tested model. | High |
| DC-B06 | `models/MonthlyGroupSelection.js` | `findMissingForMonth` | `:75-88`; no symbol/string reference. | Low | Delete method. | High |
| DC-B07 | `config/constants.js` | `ROLE_VALUES`, `GROUP_LABELS`, `GROUP_VALUES`, `VALIDATION_STATUS` | Only declaration/export references at `:11-23,45-49,126,128-129,133`. | Low | Delete whole constants after external-consumer confirmation. | High |
| DC-B08 | Several modules | Five-entry dead export surface | `AppError`, `ROLE_PERMISSIONS`, `auth.wantsJson`, and two planning message export entries have no consumers; their underlying internal definitions remain live. | Low | Remove only the five unnecessary export entries; keep the `AppError` superclass and other internal values. | High |
| DC-B09 | `config/constants.js` / permission map | Unconsumed individual keys | `RESTORE_USER`, password/heartbeat/inactivity/audit-limit constants, and three permission concepts lack their named consumers. | Medium semantic risk | Treat as manual review, not automatic deletion. | Medium-high |

All controller exports and all validator exports have verified route consumers. No whole controller, service, model, middleware, validator, or router—other than `config/sidebar.js`, which is configuration rather than a router—qualifies as an orphan file.

### 6.2 Frontend

| ID | File | Line/symbol | Evidence | Risk | Recommendation | Confidence |
|---|---|---|---|---|---|---|
| DC-F01 | `views/assets/js/export.js` | `loggedUser` | Assigned at `:5`, never read. | None | Remove declaration. | High |
| DC-F02 | `views/assets/js/api.js` | `getAllPlanning`, `getWorkSessionSummary`, `endWorkSessionBeacon` | Exposed at `:131,177-182`; no checked-in caller. | Medium external-consumer risk | Verify external browser consumers before deleting. | High static / Medium deletion |
| DC-F03 | `views/assets/css/leoni.css` | `--leoni-border-strong` | Declared at `:22`, no `var(...)` use. | Low | Remove custom property. | High |
| DC-F04 | Same CSS | `.btn-leoni-ghost` family | Standalone rules `:536-555`; unused selector at `:567` shares live declarations at `:568-571`. | Low | Delete standalone ghost rules; remove only the ghost selector from the shared rule; retain declarations for the three live selectors. | High |
| DC-F05 | `planning.js` | `work-session-panel` token | Markup at `:123`; neither CSS nor JS consumes it. | None | Remove class token, not element. | High |
| DC-F06 | `planning.js` / CSS | `is-loading`, ended/expired/info style states | `is-loading` appears at `planning.js:74` and is reassigned at `:372`, but has no matching style; CSS defines open/closed/error around `leoni.css:1044-1079`; other variants are not reached in current normal flow. | Medium dynamic-state risk | Browser-state verification before removal. | Medium-high |
| DC-F07 | `logs.html` | Bootstrap JS bundle | Loaded at `:25`; no Bootstrap JS API or `data-bs-*` consumer. | Low | Remove script tag after page smoke test. | High |
| DC-F08 | `login.html` | Font Awesome stylesheet | Loaded at `:17-20`; no login icon or applicable local pseudo-element. | Low | Remove link after visual smoke test. | High |

No named browser function or registered event handler was proven orphaned. All exact `getElementById(...)` targets exist either in static HTML or in page templates injected before lookup.

### 6.3 SQL and configuration

- No SQL migration is dead code. The migrations are historical state transitions and must remain.
- `config/sidebar.js` is the only whole first-party file with no verified reference or side effect.
- `package.json:5` names nonexistent `index.js` as `main`; this is obsolete metadata, not a deletable source file.
- `package.json:9` is an obsolete failing test placeholder despite three active `node:test` suites.
- `package.json:8` duplicates `start` and does not use declared `nodemon`.
- The session-store table is created dynamically by `express-mysql-session`; its absence from SQL files is not evidence that it is dead.

### 6.4 Comments and debug/log artifacts

| Location | Finding | Classification | Evidence |
|---|---|---|---|
| `controllers/authController.js:4-10`, `planningController.js:3-8`, `dashboardController.js:3-8`, `exportController.js:3-7`, `userController.js:3-10` | “Changes from original” history belongs in version history, and several bullets no longer match actual imports. | Safe to remove/update | Current code and unused logger imports |
| `utils/appLogger.js:5,10` | Comment says DEBUG is silenced in production, but default level remains DEBUG; comment names nonexistent `utils/auditLogger.js`. | Update | `appLogger.js:15-17`; actual audit module is `utils/logger.js` |
| `utils/logger.js:5` | “Now includes” is change-history wording. | Update | Current audit implementation at `:16-30` |
| `views/assets/js/api.js:5`, `layout.js:6-10` | “updated/added/replaces” history comments do not explain current contracts. | Update | Module headers |
| `views/assets/js/export.js:69` | Displayed endpoint documentation names old paths, while calls use `/api/export/csv` and `/api/export/xlsx`. | Update; user-visible documentation drift | `api.js:205-213` |
| `config/db.js:168-195` | Bootstrap seed logging includes fixed bootstrap-account credential information. Values are intentionally omitted from this report. | Remove/redact; security severity High | Static inspection only |
| Browser `console.error` calls | Four calls report genuine load/render failures; they are not temporary debug logs. | Keep | `api.js:20`, `dashboard.js:240`, `export.js:102`, `planning.js:1044` |

No TODO, FIXME, debugger statement, large commented-out code block, or exact duplicate file was found.

## 7. Duplicate code clusters

### DUP-01 — Sidebar/navigation configuration

- **Files/symbols:** `config/sidebar.js:11-68`; `views/assets/js/layout.js:16-25`.
- **Duplicate behavior:** the same eight IDs, URLs, icons, labels, and permission strings.
- **Meaningful differences:** only the browser array is loaded; the server array uses canonical permission constants but has no consumer.
- **Canonical candidate:** current browser `navItems`, unless a later server-rendered configuration API is intentionally introduced.
- **Recommended action:** delete the unused server file now, or create an explicit server-to-client contract in a separate feature—not both.
- **Risk:** Low for deletion; Medium for an architectural merge. **Severity: Low deletion / Medium refactor. Confidence: High.**
- **Tests needed:** page navigation/visibility for both roles and 403 enforcement.

### DUP-02 — HTML escaping copied four times

- **Files/symbols:** `layout.js:230-236`, `dashboard.js:251-257`, `logs.js:42-48`, `planning.js:250-256`.
- **Duplicate behavior:** exact replacement of `& < > "`.
- **Meaningful differences:** none; users and leave requests already alias `LeoniLayout.escapeHtml`.
- **Canonical candidate:** `LeoniLayout.escapeHtml`.
- **Recommended action:** replace three local copies with the shared function, then fix currently unescaped dashboard/planning insertions.
- **Risk:** Low refactor risk; High security value because `dashboard.js:60,196,201` and `planning.js:641` currently interpolate some values without escaping. **Severity: High output safety. Confidence: High.**
- **Tests needed:** XSS-oriented rendering cases, null handling, ampersands/quotes, and table snapshots.

### DUP-03 — Session refresh performed twice on seven pages

- **Files/symbols:** `auth.js:54-69`; page starts in calendar, dashboard, export, leave requests, logs, planning, and users.
- **Duplicate behavior:** `ensureAccess()` already calls `refreshSession()`; each page calls it again after success.
- **Meaningful differences:** logs delays the second call until after defining its template, but still performs a second sequential request.
- **Canonical candidate:** `ensureAccess()` as the single initial refresh, followed by `LeoniAuth.getUser()`.
- **Recommended action:** remove redundant second refreshes after an integration test.
- **Risk:** Low behavior risk; repeated network/auth load on every navigation. **Severity: Low. Confidence: High.**
- **Tests needed:** authenticated, unauthenticated, forced-password-change, and expired-session navigation.

### DUP-04 — Target-month business rule with timezone divergence

- **Files/symbols:** `utils/helpers.js:67-77`; `dashboard.js:7-16`; authoritative `utils/planningGenerationWindow.js:48-63`.
- **Duplicate behavior:** determine whether day 25 shifts the target to the next month.
- **Meaningful differences:** helper/browser copies mix local date parts with UTC `toISOString`; authoritative code derives Africa/Tunis parts and numeric rollover.
- **Evidence of defect:** under `TZ=Africa/Tunis`, 2026-07-25 returns `monthKey: 2026-07` with `isNextMonth: true`, not August.
- **Canonical candidate:** server-authoritative generation-window result/pure timezone utility.
- **Recommended action:** make dashboard consume the authoritative month; do not merely share the defective helper.
- **Risk:** High business risk. **Severity: High. Confidence: High.**
- **Tests needed:** day 24/25, month end, February/leap year, December rollover, and UTC/Tunis midnight boundaries.

### DUP-05 — Month-key validation

- **Files/symbols:** `config/constants.js:99`; monthly/planning/work-session validations; `MonthlyGroupSelectionService.js:18-23`; `PlanningService.js:70-73`; `planningGenerationWindow.js:74-78`.
- **Duplicate behavior:** validate `YYYY-MM` and month range.
- **Meaningful differences:** regex versus numeric parsing; optional versus required transport fields; typed versus generic errors.
- **Canonical candidate:** one pure predicate/regex for syntax, while domain/window authorization remains in services.
- **Recommended action:** share the pure syntax check only; keep transport and business layers.
- **Risk:** Medium because response messages/statuses are API contracts. **Severity: Medium. Confidence: High.**
- **Tests needed:** missing, malformed, month 00/13, valid 01/12, and generation-window mismatch.

### DUP-06 — Exact calendar-date validation

- **Files/symbols:** `leaveRequestValidation.js:4-13`; `workSessionValidation.js:3-12`; similar service predicate at `LeaveRequestService.js:20-29`.
- **Duplicate behavior:** strict `YYYY-MM-DD` plus UTC round-trip.
- **Meaningful differences:** route validators attach different messages; service layer throws typed errors.
- **Canonical candidate:** pure date predicate in a shared validation utility.
- **Recommended action:** share predicate, retain context-specific message and domain ordering checks.
- **Risk:** Low-medium. **Severity: Medium. Confidence: High.**
- **Tests needed:** leap day, invalid day/month, non-padded input, timezone independence, start/end ordering.

### DUP-07 — Password length and confirmation rules

- **Files/symbols:** `VALIDATION_RULES.PASSWORD_MIN_LENGTH` at `constants.js:98`; hardcoded 8 in `authValidation.js:20-22` and `userValidation.js:13`; confirmation in validator/controller/browser.
- **Duplicate behavior:** minimum 8, maximum 200, matching confirmation.
- **Meaningful differences:** creation does not need confirmation; change-password does; confirmation remains controller/HTTP logic, with no password service boundary.
- **Canonical candidate:** shared numeric constants; confirmation remains at the HTTP transport boundary unless a dedicated password service is introduced.
- **Recommended action:** use constants without removing defense-in-depth.
- **Risk:** Medium authentication contract risk. **Severity: Medium. Confidence: High.**
- **Tests needed:** 7/8/200/201 characters, mismatch, current-password failure, forced-change flags.

### DUP-08 — Group normalization with different acceptance sets

- **Files/symbols:** `helpers.normalizeGroupId:17-24`; `MonthlyGroupSelectionService.normalizeGroup:26-31`; `layout.formatGroup:215-221`; `planning.normalizeGroup:258-260`.
- **Duplicate behavior:** map A/B and numeric forms.
- **Meaningful differences:** backend helper accepts any integer; monthly service accepts only A/B/1/2; browser formatter returns unknown input unchanged; planning wrapper adds no logic.
- **Canonical candidate:** separate, explicitly named parse/validate/format functions sharing a small mapping.
- **Recommended action:** remove the no-op planning wrapper; do not blindly merge different contracts.
- **Risk:** Medium; unsafe consolidation could admit invalid groups or change display. **Severity: Medium. Confidence: High.**
- **Tests needed:** A/B, 1/2, strings, null, blank, 0/3, arbitrary text.

### DUP-09 — User data access split between model and direct SQL

- **Files/symbols:** `models/User.js`; `authController.js:45-47,102,112-115`; `userController.js:21-124`.
- **Duplicate behavior:** lookup, conflict detection, create/update/delete, password update.
- **Meaningful differences:** model updates include `AND is_deleted = 0`; controller update/delete performs a preliminary SELECT then a less guarded write, creating a race window.
- **Canonical candidate:** a tested User model/service boundary.
- **Recommended action:** choose and test a canonical data layer before deleting duplicate methods.
- **Risk:** Medium-high due authentication, soft deletion, uniqueness, and audit behavior. **Severity: High. Confidence: High.**
- **Tests needed:** CRUD, uniqueness, concurrent soft deletion/update, password flags, audit strings, response shapes.

### DUP-10 — Overlapping planning read endpoints and SQL

- **Files/symbols:** routes `planningRoutes.js:32-33`; services `PlanningService.js:154-180,190-197`; models `Planning.js:40-55,72-87`.
- **Duplicate behavior:** same projection, joins, role scoping, and nearly identical result set.
- **Meaningful differences:** `GET /` supports filters and orders by user/date; `GET /all` orders by descending planning ID.
- **Canonical candidate:** filtered endpoint/model with an explicit sort option if both contracts are needed.
- **Recommended action:** verify external consumers before removing `/all`; never silently change result order.
- **Risk:** Medium public API risk. **Severity: Medium. Confidence: High.**
- **Tests needed:** role scope, no filters, each filter, sort order, response-array contract.

### DUP-11 — Planning errors classified by message text

- **Files/symbols:** `PlanningService.js:70-72,87-89,183-186`; `planningController.js:54-61,85-92`; typed errors in `utils/errors.js`.
- **Duplicate behavior:** service creates semantic errors; controller re-identifies them by exact English message.
- **Meaningful differences:** other services already throw typed `BadRequestError`, `NotFoundError`, and `ForbiddenError`.
- **Canonical candidate:** typed errors plus the global error handler.
- **Recommended action:** migrate while preserving exact status codes, messages, and JSON shapes.
- **Risk:** Medium; a wrong migration turns expected 400/403/404 into 500 or changes logging. **Severity: Medium. Confidence: High.**
- **Tests needed:** all three expected errors, unknown 500, rollback/release, conflict error codes.

### DUP-12 — Response construction and error shapes

- **Files/symbols:** raw arrays in user/planning/leave/log controllers; `{success:true}` envelopes in monthly selection/work sessions; manual auth/user errors; unused helper functions; dual snake_case/camelCase totals at `WorkSessionService.js:385-392`.
- **Duplicate behavior:** success/error payload creation and duplicate field naming for the same work-session totals.
- **Meaningful differences:** arrays versus objects are intentional observable contracts; some responses include `code`, `details`, `redirect`, or downloads. The work-session browser deliberately accepts either casing at `planning.js:305-306,661,703,798-801`, so neither set is dead merely because the values are identical.
- **Canonical candidate:** documented response contracts and small helpers per contract family—not one spread-based helper.
- **Recommended action:** document first; do not retrofit `sendSuccess` because spreading an array changes its shape. Treat removal of either work-session casing as manual external-contract verification, not safe deletion.
- **Risk:** High frontend/API compatibility risk. **Severity: High. Confidence: High.**
- **Tests needed:** contract tests for every endpoint and error family, plus old/new work-session consumers asserting both casing conventions before any deprecation.

### DUP-13 — RBAC middleware, raw roles, and unused permissions

- **Files/symbols:** `config/permissions.js`; planning read routes `planningRoutes.js:31-34`; raw role gates in `PlanningService.js:158-207`; dashboard routes; work-session routes.
- **Duplicate behavior:** decide own/all access and page visibility.
- **Meaningful differences:** route middleware protects many writes; services protect object scope; frontend only hides actions. Some permission names are declared but not enforced.
- **Canonical candidate:** permission map for capability decisions plus service-level ownership checks.
- **Recommended action:** preserve defense-in-depth, replace raw role equivalence only after RBAC contract tests.
- **Risk:** High authorization risk. **Severity: High. Confidence: High evidence; Medium intent.**
- **Tests needed:** both roles across all routes, own/other IDs, 401/403, page/API differences, forged client permissions.

### DUP-14 — Repeated unauthenticated handling

- **Files/symbols:** `middlewares/auth.js:22-29,35-41,65-72`.
- **Duplicate behavior:** return JSON 401 or redirect to login.
- **Meaningful differences:** each middleware is defensive when used alone, even though current chains usually place `auth` first.
- **Canonical candidate:** a private response helper inside the middleware module.
- **Recommended action:** extract response construction if desired; do not remove checks from downstream middleware.
- **Risk:** Medium security risk if defense-in-depth is weakened. **Severity: High if weakened. Confidence: High.**
- **Tests needed:** each middleware both standalone and chained, API Accept header, page redirect.

### DUP-15 — Two sources of truth for employee group

- **Files/symbols:** `users.group_id`; `monthly_group_selections`; reads in `WorkSession.js:207`, `LeaveRequest.js:20`, `Planning.js:43-49`; migration 007.
- **Duplicate behavior:** associate an employee with Group A/B.
- **Meaningful differences:** one is legacy/current-user state; one is month-specific and authoritative for planning. New user writes no longer populate the legacy field.
- **Canonical candidate:** month-specific selection, with an explicit migration/fallback policy.
- **Recommended action:** do not delete either representation until every query is migrated and historical semantics are defined.
- **Risk:** High reporting/business-data risk. **Severity: High. Confidence: High.**
- **Tests needed:** new/existing users, multiple months, group filters in planning, leave, dashboard, export, and work-session summary.

### DUP-16 — Export fetch paths bypass the shared API client

- **Files/symbols:** `api.js:26-80` request wrapper versus raw fetch at `:205-213`.
- **Duplicate behavior:** credentials, network request, error handling.
- **Meaningful differences:** exports need a raw `Response` for blobs; the generic wrapper parses JSON or returns a response but throws structured errors.
- **Canonical candidate:** a download-specific wrapper sharing 401/403/credentials logic.
- **Recommended action:** consolidate behavior, not return type.
- **Risk:** Medium; blob downloads and filenames must remain intact. **Severity: Medium. Confidence: High.**
- **Tests needed:** CSV/XLSX success, JSON error, expired session, CSRF expectations, content disposition.

### DUP-17 — Loading, tables, and empty/error states

- **Files/symbols:** `LeoniLayout.showLoading`; repeated try/finally in page scripts; nested loading in `leave-requests.js:275-288,317-331`; table/empty-state templates across five pages.
- **Duplicate behavior:** toggle global overlay and render rows/empty/errors.
- **Meaningful differences:** table columns and action states differ; overlay is a global boolean, not a reference counter.
- **Canonical candidate:** request-counted loading helper; retain page-specific rendering.
- **Recommended action:** fix reentrancy and nested calls before extracting generic table components.
- **Risk:** Medium async/UI race risk. **Severity: Medium. Confidence: Medium-high.**
- **Tests needed:** concurrent requests, nested reload after mutation, failure and cancellation.

### DUP-18 — Date/time formatting is fragmented

- **Files/symbols:** dashboard UTC/local month calculation; calendar month labels; `leave-requests.js:167-175`; `logs.js:50-55`; `planning.js:262-273,347-352,632`.
- **Duplicate behavior:** parse and present SQL/ISO dates.
- **Meaningful differences:** date-only versus timestamp, short versus long format, locale implicit versus fixed key.
- **Canonical candidate:** separate date-only parser and timestamp formatter with explicit timezone/locale.
- **Recommended action:** define semantics before sharing code.
- **Risk:** Medium timezone/display risk. **Severity: Medium. Confidence: High.**
- **Tests needed:** Tunis midnight, date-only values, invalid dates, locale variations, DST-independent keys.

### DUP-19 — Repeated HTML dependency heads

- **Files/symbols:** all 11 HTML pages, especially lines 7-22.
- **Duplicate behavior:** Inter, Bootstrap CSS, Font Awesome, favicon, and `leoni.css`.
- **Meaningful differences:** page scripts differ; only three pages need Bootstrap JS; login does not use Font Awesome.
- **Canonical candidate:** build-time/static template or documented page-head fragment.
- **Recommended action:** remove proven page-specific excess now; template consolidation is a separate medium-risk change.
- **Risk:** Medium because CSP, CDN order, and local overrides depend on ordering. **Severity: Medium. Confidence: High.**
- **Tests needed:** all 11 pages, offline/CDN failure behavior, responsive layout, modal pages.

### DUP-20 — Schema, migration, and runtime compatibility overlap

- **Files/symbols:** `sql/schema.sql`; migrations 001-007; `config/db.js:32-198`.
- **Duplicate behavior:** create/alter columns/tables/indexes, repair hours/session slots, and seed data.
- **Meaningful differences:** schema targets fresh installs; migrations preserve ordered history; runtime checks are partial and execute every startup.
- **Canonical candidate:** versioned migration runner plus immutable fresh-install baseline, introduced through a dedicated migration project.
- **Recommended action:** do not delete history; inventory deployed schema versions and test fresh/each upgrade path first.
- **Risk:** Critical data/install risk. **Severity: Critical. Confidence: High.**
- **Tests needed:** empty server, missing database, schema at each migration version, idempotent rerun, rollback/backup, concurrent startup, data reconciliation.

## 8. Duplicate or overlapping files

No pair of first-party files has identical SHA-256 content. The overlaps below are responsibility or behavior overlaps; most call for consolidation analysis, not file deletion.

| Files | Overlap | Important difference | Recommendation | Risk / confidence |
|---|---|---|---|---|
| `config/sidebar.js` ↔ `views/assets/js/layout.js` | Both define navigation labels, routes, icons, and permissions. | Only `layout.js:16-25` is loaded by delivered pages; `config/sidebar.js:11-70` has no consumer or side effect. | Delete `config/sidebar.js` after one deployment-overlay search. | Low severity; High confidence. |
| `utils/appLogger.js` ↔ `utils/logger.js` | Both are named as loggers and emit operational information. | `appLogger` writes application logs; `logger.js` inserts audit events into `audit_logs` and therefore has persistence side effects. | Keep both; rename/document in a separate refactor rather than combining them. | High audit risk; High confidence they are distinct. |
| `services/PlanningGenerationWindowService.js` ↔ `utils/planningGenerationWindow.js` | Both participate in generation-window decisions. | The utility is pure and tested; the service reads the authoritative database clock through `Planning`. | Keep the adapter boundary; only remove dead message exports. | High planning risk; High confidence. |
| `models/User.js` ↔ direct SQL in `authController.js` and `userController.js` | They implement overlapping user reads and writes. | Controller SQL carries current response/audit behavior; the model methods are currently orphaned except `findById`. | Phase 1 may remove orphan methods; a later project can move controller SQL behind a tested repository. | Medium cross-layer risk; High confidence. |
| `utils/errors.js` ↔ `utils/helpers.js` response helpers ↔ direct controller responses | Three error/response conventions coexist. | Typed errors encode domain/status meaning; helpers return a different envelope; controllers preserve existing public JSON. | Delete only unused symbols now; standardize contracts only with HTTP contract tests. | Medium API risk; High confidence. |
| `Planning.findByFilters` ↔ `Planning.findAll` and corresponding service/controller methods | Both return planning rows with user/group data. | Filters, authorization decisions, and ordering differ; `/all` is mounted but has no checked-in frontend consumer. | Verify external use before choosing one canonical read path. | Medium contract risk; Medium-high confidence. |
| `sql/schema.sql` ↔ migrations 001-007 ↔ `config/db.js` compatibility SQL | All can create or alter overlapping schema state. | Fresh-install baseline, immutable upgrade history, and startup repair have different lifecycle purposes. | Keep all until a versioned migration runner is validated against every supported state. | Critical data risk; High confidence. |
| Eleven HTML page heads | Repeat fonts, Bootstrap CSS, Font Awesome, favicon, and global CSS. | Page scripts and interactive Bootstrap requirements differ; login has no Font Awesome use and logs has no Bootstrap-JS use. | Remove the two proven page-specific excess references; template consolidation is a later task. | Low-to-medium UI risk; High confidence on the two candidates. |
| `views/assets/js/api.js`, `auth.js`, `layout.js` | Shared browser globals form a small implicit module system. | Each has a separate responsibility and HTML load order is required: `LeoniAPI` → `LeoniAuth` → `LeoniLayout` → page script. | Keep files and order; document or test the global contract before bundling. | High page-startup risk; High confidence. |
| Consecutive migration files 004-007 | Later migrations touch tables/columns created earlier. | Each records a deployed transition and some include data repair, not just final DDL. | Never collapse or delete solely because the final schema contains the result. | Critical upgrade risk; High confidence. |

## 9. Unused or redundant dependencies

Every runtime dependency is directly referenced. `nodemon` is the only declared package without a package-script or source consumer. “Referenced” does not by itself prove a dependency is indispensable; the `cookie-parser` row records the one possible runtime redundancy.

| Package | Declaration | Verified evidence | Classification | Recommendation | Severity / confidence |
|---|---|---|---|---|---|
| `bcrypt` | dependency | Required by `authController.js` and `userController.js` for password comparison/hashing. | Used | Keep. | Critical auth; High. |
| `cookie-parser` | dependency | Required and installed in `server.js`; no checked-in code reads `req.cookies` or `req.signedCookies`. | Used middleware, possibly behaviorally redundant | Integration-test session, login, logout, and CSRF before considering removal. | Medium auth; Medium. |
| `csurf` | dependency | Configured in `server.js`; token endpoint at `/api/auth/csrf-token`; browser client sends the token. | Used | Keep. | Critical request integrity; High. |
| `dotenv` | dependency | Loaded by `config/db.js` / startup configuration. | Used | Keep; no real environment file was inspected in this review. | High configuration; High. |
| `exceljs` | dependency | Used by `exportController.exportXlsx`. | Used | Keep. | Medium feature; High. |
| `express` | dependency | Server, routers, middleware, and view delivery. | Used | Keep. | Critical runtime; High. |
| `express-mysql-session` | dependency | Creates the MySQL-backed session store in `server.js`. | Used | Keep; storage behavior needs integration coverage. | Critical auth/state; High. |
| `express-rate-limit` | dependency | Login and application limiters are configured in `server.js`. | Used | Keep. | High abuse control; High. |
| `express-session` | dependency | Creates authenticated session state used by middleware/controllers. | Used | Keep. | Critical auth; High. |
| `express-validator` | dependency | All six validation modules and `middlewares/validate.js` use it. | Used | Keep. | High input integrity; High. |
| `helmet` | dependency | Global security headers in `server.js`. | Used | Keep. | High security; High. |
| `morgan` | dependency | HTTP request logging in `server.js`. | Used | Keep unless replaced with an equivalent tested logger. | Low operations; High. |
| `mysql2` | dependency | Pool, direct controller SQL, models, services, audit logging, and session store configuration. The lock contains direct `mysql2` 3.22.5 (`package-lock.json:1841-1844`) and nested 3.10.2 pinned by `express-mysql-session` (`:930-938,975-978`). | Used; expected two-version resolution | Keep. Do not edit the lock manually; align versions only through tested dependency upgrades. | Critical data; High. |
| `nodemon` | devDependency | No source reference; `package.json#scripts.dev` runs `node server.js`, identical to `start`. | Unused candidate | Confirm manual developer workflow, then remove it or make `dev` use it; do not claim both changes are equivalent. | Low runtime / medium DX; High static confidence. |

Manifest inconsistencies are maintenance findings rather than dependency deletions: `package.json#main` points to absent `index.js`; `scripts.test` is a failing placeholder despite 19 `node:test` tests; and `scripts.dev` does not use installed `nodemon`. No root `engines` range documents the supported Node version even though locked bcrypt and Express require Node ≥18 (`package-lock.json:236-248,887-924`). CDN-loaded Inter, Bootstrap, and Font Awesome are not npm dependencies; their per-page use and missing SRI are covered in section 11.

## 10. Route/controller/service/model inconsistencies

### Mounted route inventory

The middleware column lists **route-local middleware in execution order**. Before it, all requests pass Helmet, request logging, cookie/body parsing, MySQL-backed session handling, and CSRF protection (`server.js:39-136`); every `/api` request also passes `apiLimiter` (`server.js:60-68`), and login additionally passes `loginLimiter` (`server.js:70-77,164-166`). Those global layers are not repeated in every row.

| Method | Path | Route-local middleware | Controller | Executed layer | Tables/state reachable on this path | Frontend consumer |
|---|---|---|---|---|---|---|
| GET | /api/auth/csrf-token | none (inline route after global stack) | inline `server.js:138` | CSRF token generation | session | `api.js` before state-changing requests |
| GET | /api/auth/session | none | `authController.getSession` | session read/update; no SQL or audit | session | `auth.js` / every interactive page |
| POST | /api/auth/login | `loginValidation` → `validate` | `authController.login` | direct SQL + password/session + audit | users; audit_logs; session | `login.js` |
| POST | /api/auth/logout | none | `authController.logout` | session destruction + conditional audit | session; audit_logs | `auth.js` / `layout.js` |
| POST | /api/auth/change-password | `auth` → `changePasswordValidation` → `validate` | `authController.changePassword` | direct SQL + password/session + audit | users; audit_logs; session | `change-password.js` |
| GET | /api/dashboard/stats | `auth` → `requireOnboardingComplete` | `dashboardController.getStats` | direct SQL | users; planning; monthly_group_selections | `dashboard.js` |
| GET | /api/export/csv | `auth` → `requireOnboardingComplete` → `requirePermission(EXPORT_CSV)` | `exportController.exportCsv` | direct SQL + audit | planning; users; monthly_group_selections; audit_logs | `export.js` |
| GET | /api/export/xlsx | `auth` → `requireOnboardingComplete` → `requirePermission(EXPORT_XLSX)` | `exportController.exportXlsx` | direct SQL + audit | planning; users; monthly_group_selections; audit_logs | `export.js` |
| GET | /api/leave-requests/mine | `auth` → `requireOnboardingComplete` → `requirePermission(LEAVE_REQUESTS_READ_OWN)` | `leaveRequestController.getOwnRequests` | `LeaveRequestService` | leave_requests; users | `leave-requests.js` |
| POST | /api/leave-requests/ | `auth` → `requireOnboardingComplete` → `requirePermission(LEAVE_REQUESTS_READ_OWN)` → `createLeaveRequestValidation` → `validate` | `leaveRequestController.createRequest` | `LeaveRequestService` + audit | leave_requests; users; audit_logs | `leave-requests.js` |
| PATCH | /api/leave-requests/:id/cancel | `auth` → `requireOnboardingComplete` → `requirePermission(LEAVE_REQUESTS_READ_OWN)` → `leaveRequestIdValidation` → `validate` | `leaveRequestController.cancelOwnRequest` | `LeaveRequestService` + audit | leave_requests; users; audit_logs | `leave-requests.js` dynamic URL |
| GET | /api/leave-requests/ | `auth` → `requireOnboardingComplete` → `requirePermission(LEAVE_REQUESTS_MANAGE)` | `leaveRequestController.getAllRequests` | `LeaveRequestService` | leave_requests; users | `leave-requests.js` |
| PATCH | /api/leave-requests/:id/approve | `auth` → `requireOnboardingComplete` → `requirePermission(LEAVE_REQUESTS_MANAGE)` → `leaveRequestIdValidation` → `reviewLeaveRequestValidation` → `validate` | `leaveRequestController.approveRequest` | `LeaveRequestService` + audit | leave_requests; users; audit_logs | `leave-requests.js` dynamic URL |
| PATCH | /api/leave-requests/:id/reject | `auth` → `requireOnboardingComplete` → `requirePermission(LEAVE_REQUESTS_MANAGE)` → `leaveRequestIdValidation` → `reviewLeaveRequestValidation` → `validate` | `leaveRequestController.rejectRequest` | `LeaveRequestService` + audit | leave_requests; users; audit_logs | `leave-requests.js` dynamic URL |
| GET | /api/logs/ | `auth` → `requireOnboardingComplete` → `requirePermission(AUDIT_READ)` | `logController.getLogs` | direct SQL | audit_logs; users | `logs.js` |
| GET | /api/monthly-group-selections/mine | `auth` → `requireOnboardingComplete` → `requirePermission(MONTHLY_GROUP_SELECTION_READ_OWN)` → `getMonthlySelectionValidation` → `validate` | `monthlyGroupSelectionController.getMine` | `MonthlyGroupSelectionService` | users; monthly_group_selections; planning | `planning.js` |
| PUT | /api/monthly-group-selections/mine | `auth` → `requireOnboardingComplete` → `requirePermission(MONTHLY_GROUP_SELECTION_WRITE_OWN)` → `saveMonthlySelectionValidation` → `validate` | `monthlyGroupSelectionController.saveMine` | `MonthlyGroupSelectionService` + transaction + conditional audit | users; monthly_group_selections; planning; audit_logs | `planning.js` |
| GET | /api/monthly-group-selections/ | `auth` → `requireOnboardingComplete` → `requirePermission(MONTHLY_GROUP_SELECTION_READ_ALL)` → `getMonthlySelectionValidation` → `validate` | `monthlyGroupSelectionController.getMonthStatus` | `MonthlyGroupSelectionService` | users; monthly_group_selections; planning | `planning.js`; `dashboard.js` |
| GET | /api/planning/generation-window | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_GENERATE_OWN)` | `planningController.getGenerationWindow` | `PlanningService` → database-clock adapter | database clock only | `planning.js` |
| POST | /api/planning/generate | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_GENERATE_OWN)` → `generatePlanningValidation` → `validate` | `planningController.generatePlanning` | `PlanningService` + transaction + audit | planning; users; monthly_group_selections; audit_logs | `planning.js` |
| GET | /api/planning/calendar | `auth` → `requireOnboardingComplete` | `planningController.getPlanningCalendars` | `PlanningService` | planning; users; monthly_group_selections | `calendar.js` |
| GET | /api/planning/ | `auth` → `requireOnboardingComplete` → `getPlanningValidation` → `validate` | `planningController.getPlanning` | `PlanningService` | planning; users; monthly_group_selections | `planning.js`; `dashboard.js` |
| GET | /api/planning/all | `auth` → `requireOnboardingComplete` | `planningController.getAllPlanning` | `PlanningService` | planning; users; monthly_group_selections | none verified; API façade unused |
| GET | /api/planning/:user_id | `auth` → `requireOnboardingComplete` | `planningController.getPlanningByUser` | `PlanningService` | planning; users; monthly_group_selections | `dashboard.js` dynamic URL |
| GET | /api/users/ | `auth` → `requireOnboardingComplete` → `requirePermission(USERS_READ)` | `userController.getUsers` | direct SQL | users | `users.js`; `planning.js`; `dashboard.js`; `export.js` |
| POST | /api/users/ | `auth` → `requireOnboardingComplete` → `requirePermission(USERS_CREATE)` → `createUserValidation` → `validate` | `userController.createUser` | direct SQL + audit | users; audit_logs | `users.js` |
| PUT | /api/users/:id | `auth` → `requireOnboardingComplete` → `requirePermission(USERS_UPDATE)` → `userIdValidation` → `updateUserValidation` → `validate` | `userController.updateUser` | direct SQL + audit | users; audit_logs | `users.js` dynamic URL |
| DELETE | /api/users/:id | `auth` → `requireOnboardingComplete` → `requirePermission(USERS_DELETE)` → `userIdValidation` → `validate` | `userController.deleteUser` | direct SQL + audit | users; audit_logs | `users.js` dynamic URL |
| GET | / | none | inline redirect | view handler | session | browser entry |
| GET | /login | none | inline sendFile/redirect | view handler | session; `login.html` | auth redirects / direct navigation |
| GET | /change-password | `auth` | inline sendFile | view handler | session; `change-password.html` | auth redirects / sidebar |
| GET | /dashboard | `auth` → `requireOnboardingComplete` | inline sendFile | view handler | session; `dashboard.html` | login/change-password redirects / sidebar |
| GET | /users-page | `auth` → `requireOnboardingComplete` → `requirePermission(USERS_READ)` | inline sendFile | view handler | session; `users.html` | `layout.js` / `dashboard.js` |
| GET | /planning-page | `auth` → `requireOnboardingComplete` | inline sendFile | view handler | session; `planning.html` | `layout.js` / `dashboard.js` |
| GET | /calendar-page | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_READ_OWN)` | inline sendFile | view handler | session; `calendar.html` | `layout.js` |
| GET | /leave-requests-page | `auth` → `requireOnboardingComplete` → `requirePermission(LEAVE_REQUESTS_READ_OWN)` | inline sendFile | view handler | session; `leave-requests.html` | `layout.js` |
| GET | /export-page | `auth` → `requireOnboardingComplete` → `requirePermission(EXPORT_CSV)` | inline sendFile | view handler | session; `export.html` | `layout.js` / `dashboard.js` |
| GET | /logs-page | `auth` → `requireOnboardingComplete` → `requirePermission(AUDIT_READ)` | inline sendFile | view handler | session; `logs.html` | `layout.js` / `dashboard.js` |
| POST | /api/work-sessions/auto-start | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_READ_OWN)` → `autoStartSessionValidation` → `validate` | `workSessionController.autoStartSession` | `WorkSessionService` + transaction/audit | work_sessions; planning; users; audit_logs | `planning.js` |
| POST | /api/work-sessions/heartbeat | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_READ_OWN)` → `heartbeatValidation` → `validate` | `workSessionController.heartbeat` | `WorkSessionService` + transaction/conditional audit | work_sessions; planning; users; audit_logs | `planning.js` |
| POST | /api/work-sessions/pause | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_READ_OWN)` → `sessionIdValidation` → `validate` | `workSessionController.pauseSession` | `WorkSessionService` + transaction/audit | work_sessions; planning; users; audit_logs | `planning.js` and pagehide beacon |
| POST | /api/work-sessions/end | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_READ_OWN)` → `sessionIdValidation` → `validate` | `workSessionController.endSession` | `WorkSessionService` + transaction/audit | work_sessions; planning; users; audit_logs | `planning.js` |
| GET | /api/work-sessions/mine | `auth` → `requireOnboardingComplete` → `requirePermission(PLANNING_READ_OWN)` → `mineValidation` → `validate` | `workSessionController.getMine` | `WorkSessionService` + stale cleanup | work_sessions; planning; users; audit_logs | `planning.js` |
| GET | /api/work-sessions/summary | `auth` → `requireOnboardingComplete` → `requirePermission(WORK_SESSIONS_READ_SUMMARY)` → `summaryValidation` → `validate` | `workSessionController.getSummary` | `WorkSessionService` + stale cleanup/audit | work_sessions; planning; users; audit_logs | none verified; API façade unused |

### Graph conclusions

| Check | Result | Evidence / implication | Severity / confidence |
|---|---|---|---|
| Orphan routers | None | All router modules are required and mounted by `server.js`. | Informational; High. |
| Orphan route handlers | None | Every exported controller method is attached to a route; every exported validation chain is attached to a route. | Informational; High. |
| Orphan service methods | None proven | Public service methods are reached from controllers/tests, except browser/API stacks separately listed for external verification. `PlanningGenerationWindowService` is a live adapter. | Informational; High. |
| Orphan model methods | Eight | Seven `User` methods and `MonthlyGroupSelection.findMissingForMonth`; see SD-05 and SD-06. | Low; High. |
| Mounted endpoints with no checked-in frontend consumer | Two | `GET /api/planning/all` and `GET /api/work-sessions/summary`; both remain public/mounted contracts until logs/integrations prove otherwise. | Medium; High static evidence. |
| Duplicate/overlapping endpoint | Planning reads | `GET /api/planning/` and `GET /api/planning/all` traverse different controller/service/model paths with overlapping rows but different filtering/order behavior. | Medium; Medium-high. |
| Direct SQL bypasses | Auth, dashboard, export, logs, users, audit logger | `authController.js`, `dashboardController.js`, `exportController.js`, `logController.js`, and `userController.js` query the pool directly; `utils/logger.js:23-25` also inserts into `audit_logs` directly. Planning/monthly selection/leave/work sessions otherwise use service/model layers. | Medium maintainability; High. |
| Stable dependencies passed from controller | Planning | `planningController` passes `ROLES` and `normalizeGroupId` into `PlanningService`, although these are stable application dependencies. | Low design drift; High. |
| Permission inconsistency | Planning/dashboard/work sessions | Some planning reads use authentication plus service role checks rather than named permission middleware; dashboard permission constants are not enforced; own work-session routes reuse `PLANNING_READ_OWN`. Service checks may be deliberate defense in depth and must not be deleted. | High authorization; High evidence, intent unverified. |
| Result-order contract | Planning reads | Consolidating `findByFilters` and `findAll` can change row ordering even when row sets match. | Medium client behavior; High. |

## 11. Frontend redundancy

### Page and asset graph

| Page(s) | Verified scripts, in order | Asset conclusion |
|---|---|---|
| `403.html`, `404.html` | None | Static error pages; shared CSS and favicon are live. Do not infer missing JS is an error. |
| `login.html` | `api.js` → `auth.js` → `login.js` | All scripts are live; Font Awesome is not used by markup or script and is SD-14. |
| `calendar.html`, `change-password.html`, `dashboard.html`, `export.html` | `api.js` → `auth.js` → `layout.js` → page script | All four browser globals/page scripts are referenced and order-dependent. |
| `leave-requests.html`, `planning.html`, `users.html` | Bootstrap bundle → `api.js` → `auth.js` → `layout.js` → page script | Bootstrap JS is required by `bootstrap.Modal` calls in each page script. |
| `logs.html` | Bootstrap bundle → `api.js` → `auth.js` → `layout.js` → `logs.js` | Application scripts are live; Bootstrap JS has no interactive consumer and is SD-13. |

All `getElementById(...)` targets in the page scripts have matching HTML IDs. No inline `<script>`, inline `<style>`, `style=` attribute, or inline event-handler attribute was found. This reduces hidden-reference risk but does not eliminate externally injected browser consumers.

### Repeated and redundant browser code

| Finding | Evidence | Classification | Recommended action | Severity / confidence |
|---|---|---|---|---|
| Four copies of `escapeHtml` | `layout.js:230`, `dashboard.js:251`, `logs.js:42`, `planning.js:250` | Exact/near-exact duplication | Expose one tested browser text-escaping helper or, preferably, render untrusted values with `textContent`. | High output-safety; High. |
| Seven duplicate session requests during page startup | Each of `calendar.js`, `dashboard.js`, `export.js`, `leave-requests.js`, `logs.js`, `planning.js`, and `users.js` calls `ensureAccess()` then immediately calls `refreshSession()`; `auth.js:54-69` already refreshes. | Exact redundant network behavior | Remove the second call only after startup/redirect tests prove cached-user behavior. | Low performance / medium auth-flow; High. |
| Target-month calculation copied in browser and backend helper | `dashboard.js:7-16`; `utils/helpers.js:67-77`; authoritative tested rule in `utils/planningGenerationWindow.js:48-63` | Near duplicate with behavioral drift | Derive browser display from the generation-window API or a shared contract, not local UTC conversion. | High business-date correctness; High. |
| Shared API client bypassed for exports | Raw fetches are in `api.js:205-213`; blob/error/download handling is in `export.js:117-138`, bypassing the shared JSON request path at `api.js:26-80`. | Deliberate duplication due to response type | Share only authentication/error plumbing; preserve blob and filename semantics. | Medium; High. |
| Loading overlay is global and non-reentrant | `layout.js:142` toggles one overlay; `leave-requests.js:275-288,317-331` can nest reloads after mutations. | Repeated async pattern with race potential | Add request counting before generalizing loading wrappers. | Medium UI-state; Medium-high. |
| Date formatting/parsing repeated | `leave-requests.js:167-175`; `logs.js:50-55`; `planning.js:262-273,347-352,632`; calendar/dashboard month logic. | Near duplicate with intentional display differences | Separate date-only and timestamp utilities with explicit timezone semantics. | Medium; High. |
| Three unused `LeoniAPI` façade methods | `api.js:131,177,181` (`getAllPlanning`, `getWorkSessionSummary`, `endWorkSessionBeacon`) have no checked-in caller. | Dead internal façade, external-global uncertainty | Verify external scripts/E2E tooling before deletion; do not use this as proof their HTTP routes are dead. | Medium integration; High static evidence. |
| Unused local `loggedUser` | `export.js:5` is written and never read. | Exact dead code | Safe deletion SD-09. | Informational; High. |
| Unused markup/CSS tokens and page assets | `planning.js:123` class `work-session-panel`; CSS `--leoni-border-strong` and `.btn-leoni-ghost`; Bootstrap JS on logs; Font Awesome on login. | Exact static redundancy | Safe deletion SD-10 through SD-14 with page visual checks. | Low; High. |
| User/group values interpolated into HTML inconsistently | Escaping helpers exist, but dynamic values are directly placed into templates in `dashboard.js:60,196,201` and `planning.js:641`. | Duplication-induced output-safety drift, not deletion | Audit every dynamic template and converge on text-node rendering/one escaping policy. | High potential XSS; Medium (source/sanitization contract not fully exercised). |
| Unauthenticated response handling is decentralized | `api.js:26-80` throws generic errors; page scripts and export download logic handle failures separately. | Cross-page drift | Define one tested 401/403 behavior while preserving login and blob exceptions. | High auth UX; Medium-high. |
| Header/CSRF configuration is fragile | In `api.js:30-45`, top-level `...options` can replace the already merged `headers` object and drop `CSRF-Token`; `api.js:51-55` clears the token after every 403, including ordinary authorization denial. No current call passes custom headers, so this is latent. | Option-merge/error-classification drift | Merge headers after other options and distinguish CSRF failures only behind request/403 contract tests. | High request integrity; High source confidence. |
| Dashboard ID comparison is type-sensitive | `dashboard.js:178,184` stores raw `row.user_id` values in a `Set` and tests raw `emp.id`, unlike other code that normalizes with `String(...)`. | Cross-page normalization drift | Normalize both sides before comparison; test numeric and string API IDs. | Medium status correctness; High. |
| Custom confirmation/toast accessibility is incomplete | `layout.js:150-181` creates toasts without an `aria-live` region; `layout.js:186-211` creates a dialog without `role="dialog"`, `aria-modal`, initial/focus trap/restore, Escape, or backdrop-close behavior. | Parallel UI behavior weaker than Bootstrap modals | Either harden the custom helper or standardize on an accessible tested dialog primitive. | Medium accessibility; High. |
| Planning generation refresh interval has no lifecycle handle | `planning.js:1147-1150` calls `setInterval` without retaining the ID or clearing it on `pagehide`; work-session cleanup code on that page does have lifecycle behavior. | Timer lifecycle drift | Store/clear the interval and test navigation/pagehide only as a dedicated behavior change. | Low resource / medium lifecycle; High. |
| CDN dependencies have no SRI | All 11 heads load Bootstrap/Font Awesome at lines 13-20 without `integrity`; four pages also load Bootstrap JS from CDN. | Repeated external-dependency configuration risk | Pin and verify SRI/CSP-compatible delivery consistently, preserving the three modal pages’ script order. | Medium supply-chain; High. |

### CSS conclusions

`views/assets/css/leoni.css` contains 1,969 lines, 167 unique class-name tokens, and 36 custom properties. No exact same-selector duplicate in the same cascade was found. Repeated selectors inside responsive media blocks are intentional overrides, not safe deletions. Dynamic families such as `.form-status-*`, `.leave-status-*`, `.toast-*`, `.work-session-badge-*`, and Bootstrap’s `.modal-backdrop` must remain because JavaScript or Bootstrap constructs them at runtime. Page-specific rules in the global file are an optimization opportunity, not dead-code proof.

The browser files intentionally depend on ordered globals (`LeoniAPI`, then `LeoniAuth`, then `LeoniLayout`). Reordering, adding `defer` inconsistently, or deleting a globally exposed method without an integration search can fail at page startup even when Node-side reference searches remain clean.

## 12. Validation, errors and permissions

| Area | Duplicate/drift evidence | Why some duplication is valid | Recommended boundary | Severity / confidence |
|---|---|---|---|---|
| Month keys | Regex and month checks appear in monthly-selection/planning validators and services; generation-window logic additionally constrains allowed months. | Transport validation gives immediate 400 responses; service validation protects non-HTTP callers. | Share a pure month-key parser/rule, call it from both layers, and retain both enforcement points. | High planning integrity; High. |
| Calendar dates | Leave and work-session validators check date form; services/models also compare dates and overlaps. | Shape validation, business eligibility, and database conflict checks are distinct defenses. | Share only the exact date-only parser; keep business and transaction checks at their layers. | High scheduling integrity; High. |
| Password policy | Minimum length is repeated as literal `8` in `authValidation.js:20-22` and `userValidation.js:13` despite `VALIDATION_RULES`; change-password confirmation is also checked in `authController.js:98-100`. | Both minimum-length checks are HTTP validators, and the confirmation check is still controller/HTTP logic—not a non-Express service defense. Hashing and persisted writes are distinct safeguards, but no password service boundary exists. | Source the minimum from one policy constant and preserve current validation/controller messages, fields, and statuses behind HTTP tests. | High auth consistency; High. |
| Group identifiers | `normalizeGroupId` variants accept different inputs in helpers, planning/monthly services, and browser flows. | A permissive database decoder and strict request validator do not necessarily have the same contract. | Document accepted values per boundary before consolidating; do not blindly replace one normalizer with another. | High business semantics; High. |
| Leave overlap | Validator checks request shape; `LeaveRequestService.js:78-83` performs `findOverlapping` then `create`, with the query at `LeaveRequest.js:73-84`. | Shape and business checks are both needed, but these two database calls have no transaction/lock/constraint between them, so concurrent requests can both pass. | Preserve defense in depth and add concurrent-request tests plus transactional/constraint design before data-layer changes. | High data integrity; High source evidence. |
| Planning errors | `PlanningService` throws generic errors whose exact messages are matched in `planningController` to select response status/message. | Controller mapping preserves the public response today. | Introduce typed codes/errors behind contract tests; retain user-facing messages and statuses. | High API drift; High. |
| Error types versus response helpers | `utils/errors.js` is partly live; `sendSuccess/sendError` are unused; controllers build several JSON shapes directly. | Authentication, validation, domain, and unexpected errors can legitimately differ. | Delete unused helpers/types now; separately inventory and test each existing response shape before standardization. | Medium API compatibility; High. |
| Authentication/session | Route middleware, service ownership checks, and browser page guards overlap. | Server authorization is authoritative; browser checks are UX; service checks protect internal/reused methods. | Keep all enforcement layers and remove only proven duplicate session fetches. | Critical authorization; High. |
| Planning permissions | Some routes use named permissions, while planning reads rely on auth/onboarding plus controller/service role logic. | Service ownership/role checks may be intentional defense in depth. | Define a route-to-permission matrix, then test own/all/team-leader/data-cleansing cases before alignment. | Critical authorization; High. |
| Declared permissions | `DASHBOARD_STATISTICS`, `PLANNING_READ_ALL`, and `SETTINGS_MANAGE` are granted/serialized but not enforced by a matching route. | Permissions in session JSON may be an external/browser contract or future capability. | Treat as MV-06, not safe deletion. | Medium contract; Medium. |

The safe deduplication principle is: **share predicates, not enforcement points**. Request validation, domain checks, ownership/permission checks, and database constraints should remain layered even when they call the same pure predicate. Defense-in-depth checks are not useless duplication.

## 13. SQL, migrations and startup compatibility code

### Responsibility inventory

| File / code | Current purpose | Overlap | Disposition | Severity / confidence |
|---|---|---|---|---|
| `sql/schema.sql` | Fresh-install end-state schema; loaded at `config/db.js:39-50`. | Contains structures also introduced by migrations and guarded at runtime. | Keep. It is an active runtime input. | Critical; High. |
| `001_add_enterprise_columns.sql` | Historical user/audit/planning enterprise-column transition. | Final schema contains the resulting columns. | Keep immutable migration history. | Critical; High. |
| `002_create_leave_requests.sql` | Historical leave-table creation. | Final schema contains the table. | Keep. | Critical; High. |
| `003_add_horaire_to_planning.sql` | Historical planning-column addition. | Runtime guard at `config/db.js:73-79`; final schema also contains it. | Keep until all deployed versions are migrated and a ledger exists. | Critical; High. |
| `004_create_work_sessions.sql` | Historical work-session creation. | Later migration/final schema harden the table. | Keep. | Critical; High. |
| `005_harden_work_sessions_and_work_hours.sql` | Adds/repairs work-session state and actual/planned hours. | Runtime DDL and data repair at `config/db.js:81-166`. | Keep; it contains historical data semantics. | Critical; High. |
| `006_add_updated_at_to_planning.sql` | Adds planning update timestamp. | Runtime guard at `config/db.js:101-107`; final schema contains it. | Keep. | Critical; High. |
| `007_create_monthly_group_selections.sql` | Introduces month-specific employee group selections. | Final schema contains it while legacy `users.group_id` remains. | Keep; dual-field retirement requires a data migration. | Critical; High. |
| `config/db.js:32-198` | Opens pool connection, runs schema statements, compatibility DDL, repairs data, seeds the empty database. | Repeats portions of final schema and migrations on every process start. | Keep now; isolate only through a tested migration/startup project. | Critical; High. |
| MySQL session-store initialization in `server.js` | Persists Express sessions and may manage its own table. | Not represented as an ordinary application model. | Keep and integration-test; lack of model references is expected. | Critical auth; High. |

### Current runtime redundancy and compatibility risks

1. `config/db.js:21-35` creates a pool already selecting `DB_NAME` before `schema.sql:8-12` can create/use its hard-coded database. A truly absent configured database can therefore fail before the schema’s `CREATE DATABASE` executes; a non-default `DB_NAME` can also diverge from the schema’s `USE` target.
2. `initializeDatabase()` is called without awaiting it at `config/db.js:201-202`, and its catch logs instead of propagating at `config/db.js:194-196`. The HTTP process can proceed while initialization is incomplete or failed.
3. DDL checks run on every startup, while `planning.work_hour` is recalculated for all planning rows and duplicate active sessions can be closed/reclassified at `config/db.js:109-166`. These are data-changing repairs, not deletable boilerplate.
4. Empty-database seeding at `config/db.js:168-193` embeds a bootstrap account credential and logs the credential pair. The value is intentionally omitted here. Remove credential logging and externalize bootstrap setup in a security-focused change; do not simply delete seeding without an installation plan.
5. There is no checked-in migration ledger showing which of migrations 001-007 ran. Runtime repair is concretely incomplete: `config/db.js:63-70` checks `deleted_at` only when `is_deleted` is absent, and it does not reproduce the `users.updated_at`, `audit_logs.details` widening, or several index repairs in `001_add_enterprise_columns.sql:20-98`. `CREATE TABLE IF NOT EXISTS` does not reconcile those existing-table differences, so ordered migration state remains necessary.
6. Employee group exists in both `users.group_id` and `monthly_group_selections.group_id`. The latter is month-specific; the former can still be read by legacy/direct SQL. Neither column is safe to delete until every read/write and existing row is migrated.
7. The unique active-session key includes nullable `planning_id`. MySQL’s `NULL` uniqueness semantics mean the key alone does not prove uniqueness for rows without a planning ID. Treat any constraint change as work-session redesign, not cleanup.
8. `idx_monthly_group_month` and `idx_leave_user` may be covered by wider left-prefix indexes, but index deletion requires representative `EXPLAIN` plans and write/read metrics (MV-09).

### Historical and data-repair disposition

No migration is a safe deletion candidate. The fact that `schema.sql` represents the latest shape is expected and does not erase upgrade history. Likewise, the startup repairs that recompute tracked hours, normalize active slots, and close duplicates can alter persisted facts; consolidating them requires backups, fixtures at every supported schema version, idempotency tests, concurrent-start testing, and explicit failure/rollback behavior. Leave-request overlap is a non-transactional check-then-insert sequence (`LeaveRequestService.js:78-83`; `LeaveRequest.js:73-84`), and work-session uniqueness has nullable-key behavior; both need concurrency tests before any apparent duplicate check or index is removed.

## 14. Prioritized cleanup roadmap

This roadmap distinguishes deletion from refactoring. It does not authorize the changes; none were implemented during this review.

### Phase 1 — Safe deletions

| Item | Expected benefit | Risk | Required tests / verification | Review complexity |
|---|---|---|---|---|
| SD-01: delete `config/sidebar.js` | Removes the only fully orphaned file and one stale navigation source. | Low external-loader risk. | Final deployment-overlay/global search; 63-file syntax check; open all sidebar pages. | Small |
| SD-02: remove five unused imports | Reduces misleading dependencies and comments. | Very low. | `node --check` affected controllers; controller unit/smoke paths. | Small |
| SD-03: remove `sendSuccess` / `sendError` | Removes a false “shared response standard.” | Low if no response call sites are changed. | Repository/export search; helper tests or syntax check. | Small |
| SD-04: remove unused `UnauthorizedError` / `ValidationError` | Narrows error vocabulary to live types. | Low external-import risk. | Import/export search; service/controller tests. | Small |
| SD-05: remove seven orphan `User` methods | Removes roughly parallel but inactive CRUD code. | Low current-runtime, medium future-canonical-choice risk. | Confirm `findById` remains; auth/user/leave integration tests. | Medium |
| SD-06: remove `findMissingForMonth` | Removes an unreachable query method. | Low. | Symbol search; monthly selection tests. | Small |
| SD-07: remove four entirely unused constant groups | Reduces misleading domain surface. | Low external-import risk. | Export search; all tests and syntax. | Small |
| SD-08: remove five dead export entries | Clarifies public module surfaces without deleting live internals. | Low external-import risk. | Export/import search; assert the `AppError` superclass remains; all tests. | Small |
| SD-09: remove `export.js` local `loggedUser` | Eliminates an unused assignment. | Negligible. | Browser syntax; export page smoke test. | Small |
| SD-10: remove `--leoni-border-strong` | Removes an unused custom property. | Very low visual risk. | CSS token search; visual pass. | Small |
| SD-11: remove standalone `.btn-leoni-ghost` rules and its selector only | Reduces dead global CSS without damaging the shared small-button rule. | Low hidden dynamic-class/cascade risk. | Runtime class search; preserve `:568-571` for live selectors; visual pass across 11 pages. | Small |
| SD-12: remove only `work-session-panel` class token | Removes misleading markup metadata while retaining the element. | Negligible. | Planning DOM/session smoke test. | Small |
| SD-13: remove Bootstrap JS from `logs.html` | Avoids an unused network/download/parse cost. | Low hidden interaction risk. | Logs loading, table rendering, empty state, error state, and responsive smoke tests. | Small |
| SD-14: remove Font Awesome from `login.html` | Avoids an unused stylesheet request. | Low visual risk. | Login states and responsive visual check. | Small |

### Phase 2 — Low-risk deduplication

| Item | Expected benefit | Risk | Required tests | Review complexity |
|---|---|---|---|---|
| Remove the second `refreshSession()` on seven pages | Eliminates seven duplicate startup requests and reduces auth traffic. | Redirect/cache sequencing. | Logged-in, logged-out, password-change, expired-session startup on each page. | Medium |
| Normalize dashboard planning IDs before `Set` comparison | Prevents false “not validated” states when one API field is numeric and the other is a string. | Low display-logic risk. | Numeric/string/mixed ID fixtures at `dashboard.js:178,184`. | Small |
| Harden API option/header merge and CSRF 403 classification | Prevents custom options from dropping the token and avoids treating authorization denial as a CSRF failure. | Request/authentication behavior. | Custom headers, state-changing calls, valid/invalid CSRF, and ordinary permission 403 tests. | Medium |
| Retain and clear the planning generation-window interval | Gives the timer an explicit page lifecycle. | Low timer/navigation risk. | Repeated navigation, `pagehide`, no post-unload calls, one active interval. | Small |
| Canonicalize browser HTML escaping/text insertion | Retains one canonical implementation, removes three local copies, and closes inconsistent-output gaps. | Rendering changes for intended markup. | DOM tests for text, entities, nulls, malicious strings; page visual tests. | Medium |
| Share exact month/date/password predicates while retaining layer checks | Reduces drift without removing defense in depth. | Error-message/status drift if wrappers change. | Validator and service unit tests asserting current fields/messages/statuses. | Medium |
| Correct package metadata/scripts (`main`, `test`, and confirmed `dev` policy) | Makes normal project commands truthful and discoverable. | Developer workflow change around `nodemon`; startup always performs DB initialization. | `npm test`; run `npm start` only with a disposable fixture database and asserted initialization mutations, or with the initialization boundary mocked; document the dev invocation. | Small |
| Remove or activate `nodemon` after workflow confirmation | Resolves the sole unused dependency candidate. | Developer convenience only. | Confirm team workflow; clean install and chosen dev command. | Small |
| Update historical/inaccurate comments and redact bootstrap credential logging | Removes false documentation and a sensitive operational log. | Startup visibility/account provisioning. | Fresh-database startup in isolated test environment; assert no credential material in logs. | Medium |
| Introduce request-counted loading overlay | Prevents nested/concurrent request flicker while sharing loading logic. | UI race behavior. | Concurrent/nested success and failure tests, especially leave mutations. | Medium |

### Phase 3 — Medium-risk consolidation

| Item | Expected benefit | Risk | Required tests | Review complexity |
|---|---|---|---|---|
| Consolidate user SQL behind one data-access boundary | Removes controller/model query drift and makes transactions testable. | Response shape, audit order, soft-delete semantics. | Full auth/user/leave integration suite with duplicate/conflict/deleted-user cases. | Large |
| Resolve `/api/planning` versus `/api/planning/all` | Reduces endpoint/query duplication. | External clients, authorization, ordering, JSON contract. | Access-log review; external consumer inventory; contract and ordering tests. | Large |
| Replace PlanningService message matching with typed error codes | Makes controller classification stable. | Status/message changes. | HTTP contract tests for closed window, invalid month, duplicate planning, authorization, and unexpected errors. | Medium |
| Define and enforce a route-to-permission matrix | Aligns declared permissions, middleware, role checks, and service ownership. | Authorization regression is security-critical. | Role/permission matrix tests for every route and own/all ownership case. | Large |
| Centralize 401/403/error plumbing, preserving export blobs/beacons | Makes browser expiry and denial behavior consistent after the header/CSRF fix. | Redirect loops, lost filenames, pagehide reliability. | JSON/blob/beacon tests; expired session; valid/invalid CSRF; ordinary permission 403; every page. | Large |
| Standardize date-only and timestamp presentation | Removes timezone/parser drift. | Day shifts and locale changes. | Tunis midnight, ISO/SQL date-only, timestamp, invalid values, locale tests. | Medium |
| Consolidate repeated HTML heads/layout delivery | Prevents CDN/version/SRI drift across 11 pages. | Script order, CSP/SRI, Bootstrap page differences. | Render/interaction regression across every page and error page, including CDN integrity failure. | Large |
| Harden or replace the custom confirmation/toast primitives | Aligns repeated interaction patterns with accessible dialog/announcement behavior. | Focus, keyboard, dismissal, and visual behavior across pages. | Screen-reader semantics, focus trap/restore, Escape/backdrop, toast live announcement, all callers. | Medium |
| Reconcile permission payload constants with actual features | Removes misleading capability names or wires intended enforcement. | External session-payload consumers. | Payload-contract and authorization tests; stakeholder confirmation. | Medium |

### Phase 4 — High-risk work to defer

| Item | Expected benefit | Risk | Required tests | Review complexity |
|---|---|---|---|---|
| Rework planning-generation boundaries/rules | Could unify month, group, eligibility, and duplicate logic. | Critical scheduling/business behavior. | Preserve all 19 tests; add timezone, concurrent generation, transaction rollback, and full calendar fixtures. | Large |
| Decompose `WorkSessionService.js` and its state machine | Could separate timing, persistence, audit, and cleanup concerns. | Critical time/accounting and concurrency behavior. | State-transition, heartbeat, inactivity, pagehide, stale cleanup, concurrent start, rollback, and work-hour tests. | Large |
| Replace runtime schema/repair work with a migration runner | Makes startup deterministic and versioned. | Critical installation and persisted-data risk. | Empty server, missing/custom database, every historical schema version, idempotency, concurrent startup, failure/rollback, backups. | Large |
| Split `views/assets/js/planning.js` | Improves maintainability of the 1,152-line browser controller. | Timers, DOM order, activity tracking, beacons, modals, and shared state. | End-to-end planning/group/session tests including pagehide and inactivity. | Large |
| Retire one employee-group source | Removes `users.group_id` versus monthly-selection ambiguity. | Historical/current-month semantics and existing rows. | Data inventory/migration, reconciliation, rollback, reporting and planning tests. | Large |
| Alter suspected indexes, active-session uniqueness, or leave overlap protection | May reduce write cost or improve constraints. | Critical performance/concurrency/data integrity. | Representative `EXPLAIN`, load tests, concurrency tests, data cleanup plan, rollback. | Large |

## 15. Exact “do not delete” list

| File/category | Why it must remain | Required proof before removal or replacement |
|---|---|---|
| `sql/migrations/001_...007_*.sql` | Immutable upgrade/data-repair history. | Inventory every deployed schema and complete a tested migration-baseline strategy. |
| `sql/schema.sql` | Active fresh-schema input loaded by `config/db.js`. | Replacement fresh-install path and custom-database tests. |
| `config/db.js::initializeDatabase` and compatibility/data-repair blocks | Current startup performs DDL, reconciliation, seeding, and index repair. | Versioned migration runner, tested startup ordering, backups and rollback. |
| MySQL session-store setup in `server.js` and `express-mysql-session` | Authentication sessions depend on persistent storage. | Login/session/expiry/concurrent-server integration tests with an equivalent store. |
| `middlewares/auth.js`, `requirePermission`, and service ownership/role checks | They enforce server authorization and defense in depth. | Complete RBAC matrix tests; never delete because browser UI hides an action. |
| `config/permissions.js` as a file | Live routes, controllers, browser session data, and services import it. | Replace every import and validate session payload/contracts. |
| Browser files referenced by HTML: `api.js`, `auth.js`, `layout.js`, and all page scripts | Classic-script globals are live and order-dependent. | Browser/E2E coverage and replacement script references on all pages. |
| `utils/logger.js` and `utils/appLogger.js` | Audit persistence and application diagnostics are distinct responsibilities. | Audit-event and operational-log equivalence tests. |
| `WorkSessionService.startStaleSessionCleanup` / `stopStaleSessionCleanup` | `server.js` lifecycle invokes both. | Equivalent lifecycle/cleanup integration tests. |
| `services/WorkSessionService.js`, `models/WorkSession.js`, work-session routes/controller/validation | Critical time tracking and state transitions. | Dedicated state-machine and database concurrency suite. |
| `tests/planningGenerationWindow.test.js`, `planningServiceGenerationGuard.test.js`, `monthlyGroupSelectionWindowGuard.test.js` | They are the current safety net for core planning-window rules. | Never remove without equal or stronger coverage. |
| `utils/planningGenerationWindow.js` and `PlanningGenerationWindowService.js` | Pure timezone rules plus authoritative database-clock adapter. | Equivalent tests including Tunis boundary dates and database clock. |
| `Planning`/monthly-selection services, models, routes, and validators | Core planning and group-selection workflows. | Full HTTP, transaction, and calendar result coverage. |
| `active_slot`, `planned_work_hour`, `work_hour`, `horaire`, and related indexes/repairs | Fields encode session uniqueness, planned-versus-actual time, and compatibility semantics. | Schema/data migration with reconciliation and rollback. |
| `users.group_id` and `monthly_group_selections.group_id` | Both can carry different legacy/month-specific meaning. | Complete read/write inventory and migrated data. |
| Dynamic CSS status families and `.modal-backdrop` | JavaScript/Bootstrap creates these classes at runtime. | Browser-state coverage showing no runtime producer. |
| Bootstrap JS on `planning.html`, `users.html`, `leave-requests.html` | Each corresponding script calls `bootstrap.Modal`. | Replace modal behavior and test all actions. |
| Mounted endpoints `/api/planning/all` and `/api/work-sessions/summary` | Public/mounted contracts may have consumers outside the repository. | Access logs, integration inventory, deprecation process and contract tests. |
| `models/User.js` as a file | `User.findById` is live in `LeaveRequestService`; only seven methods are orphaned. | Replace that call before considering file deletion. |
| `package-lock.json` | Reproducible direct/transitive dependency resolution. | Regenerate only through an intentional package change; never hand-delete as duplication. |
| `.env.example` | Deployment/setup contract without containing the live environment. | Confirm replacement setup documentation and variable list. |
| `views/assets/favicon.svg`, `leoni.css`, and delivered HTML pages | Each has verified HTML/view-route consumers. | Replace references and render/smoke-test all pages. |

## 16. Final verdict

**What can probably be deleted now:** one whole file (`config/sidebar.js`) plus the high-confidence imports, exported symbols, orphan methods, CSS declarations/classes, markup token, and two page-specific third-party asset references in SD-02 through SD-14. These are **14 review groups**, not 14 individual lines or files.

**What must first be tested or externally verified:** three unused browser façade methods; the two mounted but internally unconsumed APIs; `nodemon`; `cookie-parser`; three apparently unused permission names; unused-looking domain keys/CSS states; two possibly redundant indexes; and the unused `isNextMonth` return field. These are the **10 manual-verification groups**.

**What only looks redundant:** migrations versus the final schema, runtime compatibility/data-repair SQL, the two logger modules, browser globals, dynamic CSS state classes, Bootstrap-generated markup, planning-window service versus utility, and layered validation/permission checks. Their responsibilities or lifecycle positions differ.

**What should remain duplicated for safety:** request validation and domain/database checks should continue to enforce the same invariant at different trust boundaries; server authorization and service ownership checks should remain even when the UI also hides controls; fresh-install schema, historical migrations, and runtime compatibility logic should coexist until a versioned migration project proves a replacement.

**Overall assessment:** the project is **reasonably structured, with localized duplication rather than pervasive over-duplication**. All route/controller and HTML/script chains are connected. The strongest immediate gains come from removing the single orphan configuration file and small dead surfaces. The costly duplication is concentrated in business-date logic, planning reads/errors, direct user SQL, browser startup/rendering helpers, RBAC conventions, and database startup compatibility. Those are refactoring or migration projects—not deletion tasks.

### Review limitations

This was a static/read-only application review plus the repository’s Node test and syntax suites. The server and database were not started; no production access log, deployment overlay, external API client, browser automation suite, representative query plan, or live data set was available. The real `.env` was not read. Consequently, every mounted endpoint, database index, migration, exported browser global, and startup side effect with possible external/runtime use remains outside the safe-deletion set unless explicitly listed in section 3.
