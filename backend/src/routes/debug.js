import { Router } from 'express';
import { getEnv } from '../config/env.js';
import { getDb, getClient } from '../lib/db.js';
import { getGoogleAuth, SCOPES } from '../lib/googleAuth.js';
import { getSyncFromDateString } from '../lib/syncYear.js';
import { cacheInvalidatePrefix } from '../lib/cache.js';

const router = Router();

function getMaskedUri(uri) {
  if (!uri) return 'None';
  try {
    if (uri.includes('@')) {
      const [prefix, rest] = uri.split('@');
      const protocol = prefix.split('://')[0] + '://';
      return `${protocol}****:****@${rest}`;
    }
    return uri;
  } catch {
    return 'Invalid URI format';
  }
}

router.get('/debug/auth-status', async (req, res) => {
  const impersonated = getEnv('GOOGLE_IMPERSONATED_USER');
  if (!impersonated) {
    return res.status(500).json({
      status: 'failure',
      message: 'GOOGLE_IMPERSONATED_USER not set in .env',
    });
  }
  try {
    getGoogleAuth();
    res.json({
      status: 'success',
      impersonated_email: impersonated,
      scopes: SCOPES,
      message: 'Authentication and impersonation initialized successfully',
    });
  } catch (err) {
    console.error('Auth check failed:', err);
    res.status(401).json({
      status: 'failure',
      impersonated_email: impersonated,
      error: err.message,
      detail: 'Likely Domain-Wide Delegation or Scope issue.',
    });
  }
});

router.get('/debug/db-status', async (req, res) => {
  try {
    const client = getClient();
    await client.db('admin').command({ ping: 1 });
    const db = getDb();
    res.json({
      status: 'success',
      database: db.databaseName,
      message: 'MongoDB connection is stable',
    });
  } catch (err) {
    console.error('DB status failed:', err);
    res.status(500).json({
      status: 'failure',
      message: 'MongoDB connection error',
      error: err.message,
    });
  }
});

router.get('/debug/db-source', async (req, res) => {
  const db = getDb();
  const syncFrom = getSyncFromDateString();
  const coursesCol = db.collection('courses');
  const activeCourses = await coursesCol.countDocuments({ courseState: 'ACTIVE' });
  const activeFromSyncYear = await coursesCol.countDocuments({ courseState: 'ACTIVE', creationTime: { $gte: syncFrom } });
  const totalCourses = await coursesCol.countDocuments({});

  const [teachers, students, coursework, submissions] = await Promise.all([
    db.collection('teachers').countDocuments({}),
    db.collection('students').countDocuments({}),
    db.collection('coursework').countDocuments({}),
    db.collection('submissions').countDocuments({}),
  ]);

  res.json({
    mongo_uri: getMaskedUri(getEnv('MONGODB_URI')),
    database: db.databaseName,
    sync_from_year: syncFrom.slice(0, 4),
    course_summary: {
      active: activeCourses,
      active_from_sync_year: activeFromSyncYear,
      archived: totalCourses - activeCourses,
      total: totalCourses,
    },
    collections: {
      courses: totalCourses,
      teachers,
      students,
      coursework,
      submissions,
    },
  });
});

router.post('/debug/clear-db', async (req, res) => {
  try {
    const db = getDb();
    const collections = ['courses', 'teachers', 'students', 'coursework', 'submissions'];
    const result = {};
    for (const name of collections) {
      const col = db.collection(name);
      const deleted = await col.deleteMany({});
      result[name] = deleted.deletedCount;
    }
    cacheInvalidatePrefix('stats');
    cacheInvalidatePrefix('analytics');
    cacheInvalidatePrefix('active_course_ids');
    res.json({
      status: 'success',
      message: 'All collections cleared. Run POST /api/sync/all to sync fresh.',
      deleted: result,
    });
  } catch (err) {
    console.error('Clear DB failed:', err);
    res.status(500).json({
      status: 'failure',
      message: 'Failed to clear database',
      error: err.message,
    });
  }
});

export default router;
