import express from 'express';
import cors from 'cors';
import { getDb } from './db/database.js';
import employeesRouter from './routes/employees.js';
import insightsRouter from './routes/insights.js';

export function createApp(dbPath = null) {
  const app = express();

  // Initialize DB (supports custom path for tests)
  getDb(dbPath);

  app.use(cors());
  app.use(express.json());

  app.use('/api/employees', employeesRouter);
  app.use('/api/insights', insightsRouter);

  app.get('/api/health', (_, res) => res.json({ status: 'ok' }));

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

// Only listen when run directly
if (process.argv[1].includes('app.js')) {
  const app = createApp();
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
