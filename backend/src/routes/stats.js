import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import { getSyncFromDateString } from '../lib/syncYear.js';

const router = Router();

router.get('/stats', async (req, res) => {
  const cached = cacheGet('stats');
  if (cached) return res.json(cached);

  const db = getDb();
  const syncFrom = getSyncFromDateString();
  const activeCourses = await db.collection('courses').find(
    { courseState: 'ACTIVE', creationTime: { $gte: syncFrom } },
    { projection: { id: 1 } }
  ).toArray();
  const activeIds = activeCourses.map((c) => c.id);

  if (activeIds.length === 0) {
    const stats = { courses: 0, students: 0, teachers: 0, assignments: 0, submissions: 0 };
    cacheSet('stats', stats);
    return res.json(stats);
  }

  const [uniqueStudentsCount, uniqueTeachersCount, assignmentsCount, submissionsCount] = await Promise.all([
    db.collection('students').distinct('userId', { courseId: { $in: activeIds } }).then((arr) => arr.length),
    db.collection('teachers').distinct('userId', { courseId: { $in: activeIds } }).then((arr) => arr.length),
    db.collection('coursework').countDocuments({ courseId: { $in: activeIds } }),
    db.collection('submissions').countDocuments({ courseId: { $in: activeIds } }),
  ]);

  const stats = {
    courses: activeIds.length,
    students: uniqueStudentsCount,
    teachers: uniqueTeachersCount,
    assignments: assignmentsCount,
    submissions: submissionsCount,
  };
  cacheSet('stats', stats);
  res.json(stats);
});

export default router;
