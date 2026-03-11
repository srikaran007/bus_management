# Backend Production-Ready Checklist

## Auth and RBAC
- [x] JWT access token middleware: `middleware/authMiddleware.js`
- [x] Route-level role checks on all endpoints: `routes/*.js`
- [x] Refresh token flow: `controllers/authController.js`
- [x] Forgot/reset password flow: `controllers/authController.js`
- [ ] Add email provider integration for password reset delivery.

## Validation
- [x] Joi validation middleware: `middleware/validateMiddleware.js`
- [x] Schema validation for auth/bus/driver/student/route/attendance: `validation/*.js`
- [ ] Add query validation schemas for list endpoints.

## Errors and Observability
- [x] Global error middleware: `middleware/errorMiddleware.js`
- [x] Async handler abstraction: `utils/asyncHandler.js`
- [x] Request ID propagation: `middleware/requestContextMiddleware.js`
- [x] Audit logging model and middleware: `models/AuditLog.js`, `middleware/auditMiddleware.js`
- [x] Audit query endpoint: `routes/auditRoutes.js`
- [ ] Add centralized log shipping (ELK/Datadog/CloudWatch).

## Security
- [x] `helmet` enabled: `app.js`
- [x] Rate limiting enabled: `app.js`
- [x] CORS origin allowlist: `app.js`
- [ ] Use stricter per-route limits for auth endpoints.
- [ ] Rotate secrets using secret manager.

## API Consistency
- [x] Pagination/filter/sort response pattern for list APIs: `controllers/*Controller.js`
- [x] Standard list payload shape: `{ items, pagination }`
- [ ] Add API versioning (`/api/v1`).

## Test Coverage
- [x] Auth integration tests: `tests/auth.integration.test.js`
- [x] Module integration and RBAC tests: `tests/modules.integration.test.js`
- [ ] Add negative validation test matrix for all fields.
- [ ] Add performance/load smoke tests.

## Deployment
- [x] PM2 config: `ecosystem.config.js`
- [x] Dockerfile: `Dockerfile`
- [x] Docker Compose with MongoDB: `../docker-compose.yml`
- [x] GitHub Actions CI for backend tests: `../.github/workflows/backend-ci.yml`
- [ ] Add CD (staging/prod) workflow.
- [ ] Add backup/restore procedure for MongoDB.
