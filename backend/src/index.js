import 'dotenv/config';
import { validateStartup } from './config/env.js';
import { connectDb } from './lib/db.js';
import app from './app.js';

// Run from backend root: cd backend && npm start (so .env and service-account.json are in cwd)
validateStartup();

const port = parseInt(process.env.PORT, 10) || 8000;

connectDb()
  .then((db) => {
    console.info('✓ Connected to MongoDB Atlas:', db.databaseName);
    app.listen(port, '0.0.0.0', () => {
      console.info(`✓ Server listening on http://0.0.0.0:${port}`);
      console.info('  API base: http://localhost:' + port + '/api');
    });
  })
  .catch((err) => {
    console.error('❌ Failed to start:', err.message);
    process.exit(1);
  });
