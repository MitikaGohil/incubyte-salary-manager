# Assessment Notes

## Requirement Mapping

- Employee management via UI:
  implemented with create, list, update, and delete flows.
- Employee data:
  includes full name, email, job title, department, country, salary, employment type, and hire date.
- Salary insights via UI:
  includes country min/max/avg salary, job-title salary breakdown by country, and extra HR-friendly metrics.
- Backend + UI:
  implemented with Express, SQLite, React, Ant Design, and Recharts.
- Seeding:
  `backend/scripts/seed.js` generates `10,000` employees from provided name files using batched inserts.
- Tests:
  backend tests cover CRUD and insights endpoints with deterministic in-memory database setup.

## Trade-offs

- SQLite keeps setup simple and fast for local evaluation.
- Insights are pre-aggregated in SQL to keep the frontend lightweight.
- The frontend normalizes API payloads defensively so malformed or partial responses do not crash the UI.

## Performance Considerations

- The seed script uses transactions and batched inserts.
- Database indexes exist for country, department, and job-title queries.
- Employee listing is paginated and server-side filtered.

## AI Usage

- AI assistance was used for debugging, requirement-gap analysis, and implementation acceleration.
- All changes were verified against the local codebase and runtime assumptions before being kept.

## Remaining Delivery Items Outside This Repo

- A deployed URL is not produced from within this local workspace alone.
- A video demo is also not generated automatically here.
- Incremental git commit history cannot be reconstructed when the workspace is not attached to a git repository.
