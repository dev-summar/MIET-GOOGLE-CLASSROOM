import express from 'express';
import cors from 'cors';
import { getEnv } from './config/env.js';
import syncRoutes from './routes/sync.js';
import statsRoutes from './routes/stats.js';
import coursesRoutes from './routes/courses.js';
import studentsRoutes from './routes/students.js';
import teachersRoutes from './routes/teachers.js';
import assignmentsRoutes from './routes/assignments.js';
import analyticsRoutes from './routes/analytics.js';
import debugRoutes from './routes/debug.js';
import tlcRoutes from './routes/tlcRoutes.js';

const app = express();
const frontendOrigin = getEnv('FRONTEND_ORIGIN', 'http://localhost:5173');

app.use(cors({
  origin: frontendOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Health check (no auth/DB required) — use in Postman to confirm server is up
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Classroom Insights API is running' });
});

// Mount all API routes under /api
app.use('/api', syncRoutes);
app.use('/api', statsRoutes);
app.use('/api', coursesRoutes);
app.use('/api', studentsRoutes);
app.use('/api', teachersRoutes);
app.use('/api', assignmentsRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', debugRoutes);
app.use('/api/tlc', tlcRoutes);

export default app;
