# Salary Management Tool

Minimal end-to-end salary management software for an HR manager persona, built with:

- `backend`: Express + SQLite
- `frontend`: React + Ant Design + Recharts

## Features

- Manage employees via UI:
  - add
  - view
  - update
  - delete
- Search, sort, and filter employee records
- Salary insights via UI:
  - country-level min, max, and average salary
  - average salary by job title in a country
  - department salary trends
  - employment type breakdown
  - highest earners
- Seed script for `10,000` employees using `first_names.txt` and `last_names.txt`
- Backend tests for core CRUD and insights endpoints

## Run locally

### Backend

```bash
cd backend
npm install
npm run seed
npm run dev
```

Backend runs on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## Test

```bash
cd backend
npm test
```

## Notes

- The frontend uses `http://localhost:3001/api` during development.
- In production, the frontend uses `/api`.
- Additional assessment notes are in [docs/assessment-notes.md](/d:/practice/incubyte-salary-manager/docs/assessment-notes.md:1).
