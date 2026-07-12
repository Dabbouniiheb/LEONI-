# Executive Summary

Scope audited: the official specification `cahier_de_charge (1).pdf` and all first-party implementation files under `leoni-planing/` including backend, frontend, routes, controllers, services, models, middleware, SQL schema/migrations, configuration, package manifests, and UI assets. Third-party `node_modules/` was not treated as authored implementation; it was covered through package manifests and `npm audit`.

Only one Cahier des Charges / official specification document was found: `cahier_de_charge (1).pdf` (6 pages, created June 22, 2026). No first-party README, Markdown requirements file, DOCX, or additional specification document was found outside vendor dependencies.

Overall conclusion: the project is a strong prototype / internal MVP, but it is not fully production-ready against the Cahier des Charges. Core user management, authentication, first-login password change, group-based planning generation, dashboard cards, export, RBAC, CSRF, sessions, and audit logging exist. The largest gaps are username login, Team Leader password reset, true monthly group selection/validation workflow, automatic notifications, persistent notification statuses, exact dashboard table/filter compliance, planning modification audit semantics, tests/documentation, and several security hardening issues.

Final compliance scores:

| Area | Score |
|---|---:|
| Functional Completeness | 78% |
| Technical Compliance | 82% |
| UI Compliance | 75% |
| Security Compliance | 80% |
| Database Compliance | 76% |
| Overall Compliance | 78/100 |

# Functional Comparison Table

| Requirement | Status | Evidence | Notes |
|---|---|---|---|
| R01 - Centralized web app for Home Office planning | Fully Implemented | `leoni-planing/server.js` mounts pages/API routes; `views/assets/js/*`; `sql/schema.sql` | Express app with frontend shell, APIs, MySQL schema. |
| R02 - Replace manual management with automated, secure platform | Partially Implemented | `PlanningService.generatePlanning`; `server.js` Helmet/session/CSRF/rate limits | Planning generation exists, but monthly selection/notifications are not fully automated or persisted. |
| R03 - Manage users and roles | Fully Implemented | `controllers/userController.js`; `routes/userRoutes.js`; `config/permissions.js`; `sql/schema.sql` `users.role` enum | CRUD with Team Leader-only permissions. |
| R04 - Account creation by Team Leader | Fully Implemented | `userRoutes.js` POST uses `USERS_CREATE`; `userController.createUser` hashes password and logs action | Creation includes required fields and default first-login flags. |
| R05 - Home Office groups A/B | Fully Implemented | `constants.js` groups 1/2; `users.group_id`; `select-group.html/js` | Groups exist and users can select or be assigned. |
| R06 - Group A days: Wednesday, Thursday, Friday quinzaine A | Partially Implemented | `PlanningService.calculateHomeOfficeDays` Wed/Thu and Friday indexes 1,3,5 | Spec states weeks 1 and 3 only; implementation also assigns a 5th Friday to A. |
| R07 - Group B days: Monday, Tuesday, Friday quinzaine B | Fully Implemented | `PlanningService.calculateHomeOfficeDays` Mon/Tue and Friday indexes 2,4 | Matches weeks 2 and 4. |
| R08 - Friday alternates: week 1/3 A, week 2/4 B | Incorrectly Implemented | `PlanningService.js` line logic includes Friday index 5 for A | Strict mismatch for months with five Fridays. |
| R09 - Team Leader can create users | Fully Implemented | `PERMISSIONS.USERS_CREATE`; `routes/userRoutes.js`; `users.js` create modal | Implemented backend and UI. |
| R10 - Team Leader can modify/delete accounts | Fully Implemented | `userController.updateUser/deleteUser`; `users.js` edit/delete buttons | Soft delete is used, which is acceptable and safer. |
| R11 - Team Leader can reset passwords | Missing | No route/controller/UI for reset password; search found only self change/create temporary password | Critical functional gap. |
| R12 - Team Leader can consult all plannings | Fully Implemented | `PlanningService.getPlanningByFilters/getAllPlanning`; `planning.js` TL filters | Data Cleansing is restricted to own planning. |
| R13 - Team Leader can export Excel | Fully Implemented | `exportRoutes.js`; `exportController.exportXlsx`; `export.js` XLSX button | Also supports CSV as extra. |
| R14 - Team Leader can view statistics | Fully Implemented | `dashboardController.getStats`; `dashboard.js` stat cards | Stats present, but route is also accessible to Data Cleansing. |
| R15 - Data Cleansing login required | Fully Implemented | `auth` middleware; `viewRoutes.js`; `auth.js` | Protected pages require session. |
| R16 - Data Cleansing first-login password change | Fully Implemented | `must_change_password`, `first_login`; `requireGroup`; `changePassword` flow | Access blocked until password changed. |
| R17 - Data Cleansing selects group A or B | Partially Implemented | `select-group.html/js`; `authController.selectGroup`; `users.group_id` | Implemented as one-time/global selection, not monthly selection for next month. |
| R18 - Data Cleansing consults personal planning | Fully Implemented | `PlanningService` restricts non-TL queries to own user_id | UI shows own planning. |
| R19 - Login via email + password | Fully Implemented | `authValidation.js`; `authController.login`; `login.html/js` | Email login works. |
| R20 - Login via username + password | Missing | `authValidation.js` requires email format; SQL query filters `WHERE email = ?`; login input is `type="email"` | Explicit Cahier requirement not met. |
| R21 - Temporary password provided by Team Leader | Fully Implemented | `users.js` Temporary Password field; `userController.createUser` stores hash and sets flags | Password is entered by TL at creation. |
| R22 - Redirect to password change page on first login | Fully Implemented | `authController.login` returns `/change-password`; `viewRoutes.js` and `auth.js` enforce redirect | Implemented server and client side. |
| R23 - Block access until password changed | Fully Implemented | `requireGroup` returns 403/redirect when flags set | Applies to protected APIs/pages. |
| R24 - User creation fields: Nom, Prénom, Email, Username, Matricule, Rôle, Département | Fully Implemented | `users.js` create modal; `userValidation.js`; `users` table columns | All fields present. |
| R25 - User chooses month and group, system generates days | Partially Implemented | `planning.js` month picker; `PlanningService.generatePlanning`; `select-group` stores group | Month is chosen at generation; group is stored globally and not chosen per monthly planning action. |
| R26 - Planning generation is monthly and automatic | Partially Implemented | `generatePlanning` endpoint; UI button | Requires manual click; no scheduler/auto-generation. |
| R27 - From 25th, next-month selection opens | Partially Implemented | `getTargetMonthKey`; `dashboard.js` and `planning.js` default target month after day 25 | UI defaults switch after 25th, but there is no enforced opening window or DB workflow. |
| R28 - Automatic notification to users | Partially Implemented | `dashboard.js` dashboard alert section | Only shown when a user opens dashboard; no backend notification, email, Teams, scheduler, or notification records. |
| R29 - Notification message: select next-month group before month end | Partially Implemented | `dashboard.js` orange alert has similar wording | Message asks to select group and generate planning, but not backed by monthly group selection. |
| R30 - Notification states Green/Orange/Red | Partially Implemented | `dashboard.js` green/orange/red alerts and TL tracker badges | UI-derived only; no persistent notification status table or audit trail. |
| R31 - Dashboard indicator: total users | Fully Implemented | `dashboardController.getStats`; `dashboard.js` `statTotalUsers` | Present. |
| R32 - Dashboard indicator: Group A / Group B | Fully Implemented | `dashboardController.getStats`; `dashboard.js` `statGroups` | Present. |
| R33 - Dashboard indicator: planning completed | Fully Implemented | `planningCompleted` query; `dashboard.js` `statCompleted` | Counts distinct Data Cleansing users with planning for month. |
| R34 - Dashboard indicator: validation rate | Fully Implemented | `validationRate` calculation; `dashboard.js` | Present. |
| R35 - Dashboard table: ID User, Matricule, Nom, Date Remote | Partially Implemented | `dashboard.js` tracker table: Matricule, Employee, Group, Department, Status; planning page has Date Remote | Required dashboard table shape is not matched exactly. |
| R36 - Dashboard filters: month, group, name | Partially Implemented | `planning.js` filters month/name/group; `dashboard.js` no visible dashboard filters | Filters exist on Planning page, not Team Leader dashboard. |
| R37 - Export Excel global | Fully Implemented | `/api/export/xlsx`; no filter exports all | Present. |
| R38 - Export Excel by group | Fully Implemented | `fetchExportRows` filters `group_id`; `export.js` group select | Present. |
| R39 - Export Excel by user | Fully Implemented | `fetchExportRows` filters `user_id`; `export.js` employee select | Present. |
| R40 - Export fields ID, User, Matricule, Name, DateRemote, WorkHour | Fully Implemented | `exportController.js` headers and query fields | Exact field names used. |
| R41 - Password hashing | Fully Implemented | `bcrypt.hash` in `userController` and `authController`; schema stores hash | Implemented. |
| R42 - Role-based access | Partially Implemented | `config/permissions.js`; `requirePermission`; routes | Strong for users/export/logs/leave. Dashboard/planning routes lack explicit permission middleware; dashboard stats exposed to Data Cleansing. |
| R43 - First-login blocking | Fully Implemented | `requireGroup`; `auth.js`; `viewRoutes.js` | Implemented. |
| R44 - Audit actions | Partially Implemented | `audit_logs`; `utils/logger.js`; action constants | Login/logout/create/export/generate logged. No true planning modification workflow/action. |
| R45 - Audit creation user | Fully Implemented | `userController.createUser` logs `CREATE_USER` | Present. |
| R46 - Audit modification planning | Partially Implemented | `planningController.generatePlanning` logs `GENERATE_PLANNING` | Regeneration is logged, but no edit/update planning action exists. |
| R47 - Audit export Excel | Fully Implemented | `exportController.exportXlsx` logs `EXPORT_XLSX` | Present. |
| R48 - Audit login/logout | Fully Implemented | `authController.login/logout` logs actions | Logout lacks IP, but action exists. |
| R49 - Future evolution: leave management | Extra Feature | `leave_requests` table/routes/service/UI | Implemented although listed as future. Adds value but is outside baseline. |
| R50 - Future evolution: absences | Missing / Future | No absence module beyond leave requests | Future item, not baseline requirement. |
| R51 - Future evolution: Email/Teams notifications | Missing / Future | No email/Teams integrations | Future item. |
| R52 - Future evolution: Power BI dashboard | Missing / Future | No Power BI export/integration | Future item. |
| R53 - Future evolution: mobile app | Missing / Future | Responsive web only | Future item. |
| R54 - Tests and documentation deliverable | Missing | `npm test` returns "no test specified"; no first-party README/docs found | Required by stage plan week 4; not delivered. |

# Missing Features

| Feature | Priority | Complexity | Backend Work | Frontend Work | Database Changes | Security Considerations | Suggested Order |
|---|---|---|---|---|---|---|---|
| Username + password login | Critical | Low | Accept `login` identifier, query by email OR username with parameterized SQL | Change login label/input from email-only to email or username | None | Avoid account enumeration; generic error messages | Phase 1 |
| Team Leader password reset | Critical | Medium | Add TL-only reset endpoint, hash new temp password, set first_login/must_change_password | Add reset action/modal in user management | None | Audit reset, never display stored password, enforce temp password policy | Phase 1 |
| Monthly group selection workflow | Critical | Medium/High | Store group selection by user and month; enforce selection window | Let users select group for target month after 25th | Add `monthly_group_selections` or `planning_validations` table | Prevent TL/user privilege bypass; audit changes | Phase 1 |
| Persistent notification/status model | High | Medium | Add status calculation or table for validated/pending/expired; optional scheduled job | Show statuses from backend, not client date heuristics | Add `notifications` or `validation_statuses` | Avoid exposing global employee data to normal users | Phase 1 |
| Automatic notification delivery | High | Medium/High | Scheduler/job to create notifications from day 25; later email/Teams provider | Notification center/banner with unread state | Notification table | Rate limit and sanitize messages | Phase 2 |
| Exact Team Leader dashboard table | High | Medium | Endpoint returning ID, User, Matricule, Nom, DateRemote by month/group/name | Add dashboard filters and matching table | None if based on planning | Ensure TL-only access | Phase 2 |
| Planning modification workflow and audit | Medium | Medium | Add update/delete planning entry endpoints and `UPDATE_PLANNING` audit action | Add edit controls if required by business | Maybe no schema change | Preserve history or audit diffs | Phase 2 |
| Fix Friday week-5 rule | High | Low | Remove 5th Friday from Group A or clarify spec | None | None | Add unit tests around 5-Friday months | Phase 1 |
| Tests | High | Medium | Unit tests for planning rules, auth, permissions, export query | UI smoke tests for flows | Test database fixtures | Prevent regressions in security flows | Phase 1 |
| First-party documentation | Medium | Medium | API/setup docs, env docs, DB migration docs | User workflow guide | None | Do not document secrets/default passwords as production credentials | Phase 2 |

# Partially Implemented Features

1. Monthly planning/group selection: the implementation stores `users.group_id` globally and generates planning from that value. The Cahier's notification rule refers to selecting for the next month, so monthly selection state is missing.
2. Notifications: dashboard banners implement green/orange/red states visually, but no automatic backend notification is created, delivered, stored, or audited.
3. Dashboard filters/table: planning filters exist on `/planning-page`, but the Team Leader dashboard itself lacks the required month/group/name filters and exact table columns.
4. RBAC: core sensitive routes use permission middleware, but dashboard stats and planning routes do not consistently use explicit permission checks.
5. Audit planning modification: generation is audited, but modification of planning is not a first-class workflow.

# Incorrect Implementations

## Friday Alternation

Specification: Friday alternates between groups: week 1 and 3 for Group A, week 2 and 4 for Group B.

Current behavior: `PlanningService.calculateHomeOfficeDays` assigns Friday indexes 1, 3, and 5 to Group A.

Difference: A 5th Friday is generated for Group A even though the Cahier only names weeks 1 and 3.

Fix: Remove `fridayIndex === 5` or obtain written clarification that week 5 belongs to Group A. Add tests for months with 4 and 5 Fridays.

## Username Login

Specification: login via Email + password or Username + password.

Current behavior: validation requires `email` to be an email address, UI uses `type="email"`, API sends `{ email, password }`, and controller queries `WHERE email = ?`.

Fix: Rename request field to `identifier`, validate non-empty/max length, and query `WHERE (email = ? OR username = ?)`.

## Monthly Notification Workflow

Specification: starting on the 25th, next-month selection opens and users are automatically notified.

Current behavior: frontend changes target month after day 25 and shows dashboard alerts. There is no backend opening window, persistent notification, monthly group selection, or delivery channel.

Fix: Add monthly validation records and a scheduled notification workflow. Dashboard should read status from the backend.

# Extra Features

| Feature | Value | Recommendation |
|---|---|---|
| Leave request management | Adds value; aligns with future evolution "Gestion des congés" | Keep, but mark as future/out-of-scope module and secure/test it. |
| CSV export | Adds value beyond Excel | Keep. |
| Calendar visualization page | Adds value for planning readability | Keep. |
| Soft delete users | Adds value for audit/history | Keep. |
| Permission matrix abstraction | Adds value and improves maintainability | Keep; apply consistently to dashboard/planning routes. |
| Toasts/confirmation modal | Adds UX value | Keep. |
| Root `package.json` duplicate dependencies | Unnecessary/confusing | Remove or document root package purpose. |
| Committed `.env` | Harmful security risk | Remove from git and rotate secrets. |

# UI/UX Findings

Implemented UI strengths:

- Responsive sidebar/topbar shell exists in `layout.js` and `leoni.css`.
- Dashboard stat cards are present.
- User management includes create/edit/delete forms and modals.
- Planning page includes generation, table, filters, and reset.
- Calendar visualization exists.
- Export page supports filters and CSV/XLSX download.
- Audit log page exists.
- Dynamic values are mostly escaped before insertion.

UI gaps/inconsistencies:

- Login UI only accepts email, not username.
- Dashboard is not Team-Leader-specific; Data Cleansing users can reach global stat cards.
- Dashboard lacks visible filters for month, group, and name.
- Dashboard table does not match the required columns `ID User`, `Matricule`, `Nom`, `Date Remote`.
- Notification states are only dashboard banners; there is no notification inbox/history.
- Group selection page only appears when no group is set. It does not support monthly next-month selection after the 25th.
- Export details text references stale endpoints (`/export-planning`, `/export-xlsx`) while actual API routes are `/api/export/csv` and `/api/export/xlsx`.
- Accessibility is moderate: semantic tables and labels exist, but generated modals/toasts need stronger keyboard/focus management review.

# Database Findings

Implemented entities:

- `users`: names, username, email, password, matricule, role, department, group, first-login flags, soft delete.
- `planning`: user, date, status, month_key, work_hour, horaire placeholder.
- `audit_logs`: user, action, details, IP address, created_at.
- `leave_requests`: extra/future feature.

Compliant schema elements:

- Unique constraints on username, email, matricule.
- Foreign keys from planning/audit/leave requests to users.
- Useful indexes on group, role, deletion flag, planning month, audit action/date.

Database gaps:

- No notification table.
- No monthly group-selection/validation table.
- No persistent validation status table.
- `users.group_id` models a global group, not a monthly group choice.
- Planning table has no modification history beyond audit logs.
- `horaire` is a placeholder; export uses `work_hour`, which is compliant, but planning UI displays empty `horaire`.

# Security Findings

Implemented security controls:

- Password hashing with bcrypt.
- MySQL parameterized queries in audited first-party controllers/models.
- Express sessions with MySQL store.
- Helmet security headers and CSP.
- CSRF middleware and token fetch for state-changing API calls.
- HTTP-only session cookie, secure in production, SameSite=Lax.
- API and login rate limiting.
- Server-side RBAC middleware for several sensitive route groups.
- Input validation with `express-validator`.
- Audit log table and action logging.

Security gaps/risks:

- `.env` is tracked in git despite `.env.example` saying never commit it.
- Default seeded admin account uses a known password (`admin1234`) and logs it in application logs.
- Login errors distinguish "User not found" from "Wrong password", enabling account enumeration.
- No Team Leader password reset flow despite requirement.
- Password policy is only minimum length 8; no complexity/history/reuse policy.
- Dashboard stats route lacks TL-only permission enforcement.
- `csurf` is deprecated in the ecosystem and audit reports low advisories via nested `cookie`.
- `npm audit` reports 4 advisories: 2 low (`csurf`/`cookie`) and 2 moderate (`exceljs`/`uuid`).
- No automated security tests.

# Recommended Improvements

1. Implement username/email login with generic failure responses.
2. Add Team Leader password reset with forced first-login change and audit logging.
3. Replace global-only group selection with monthly group selection records.
4. Implement persistent validation/notification statuses and backend-driven dashboard state.
5. Fix the 5th-Friday rule or clarify it formally.
6. Lock down dashboard stats to Team Leader, or create a separate personal dashboard for Data Cleansing.
7. Add dashboard filters and required table columns.
8. Remove committed `.env`, rotate secrets, and remove/log-suppress default credentials.
9. Add tests for planning rules, auth redirects, permissions, export filters, and audit logging.
10. Add first-party setup/API/user documentation.
11. Review and update vulnerable dependencies or replace `csurf` with maintained CSRF protection.

# Prioritized Roadmap

## Phase 1 (Critical)

- Implement username/email login.
- Add Team Leader password reset.
- Fix Friday week-5 behavior or document confirmed business rule.
- Add TL-only dashboard stats permission enforcement.
- Remove committed `.env`, rotate secrets, and remove default admin credential logging.
- Add automated tests for planning rule, login, first-login blocking, and role access.

## Phase 2 (Important)

- Add monthly group selection and validation tables.
- Add persistent notification/status model and backend status endpoint.
- Add dashboard filters and exact required TL dashboard table.
- Add planning modification audit semantics or explicitly remove "modification planning" from scope.
- Add first-party README/setup/API documentation.

## Phase 3 (Nice to Have)

- Add real email/Teams notification delivery.
- Expand leave requests into a formal future module with tests and documentation.
- Add Power BI export/integration if still required.
- Add mobile-specific UX or a mobile app if future scope is approved.
- Add richer accessibility testing and keyboard/focus handling for generated modals.

# Production Readiness Conclusion

The project is not yet production-ready for full Cahier des Charges compliance. It is suitable as an MVP demonstration of the main planning concept, but strict production acceptance should wait until the critical gaps are closed: username login, password reset, monthly group selection, true automatic/persistent notifications, corrected Friday alternation, dashboard filter/table compliance, security cleanup, tests, and documentation.

To reach 100% compliance, the project must move the remaining monthly workflow and notification logic from frontend heuristics into auditable backend/database workflows, complete the missing Team Leader account operations, correct the authentication mismatch, and add test/documentation evidence.
