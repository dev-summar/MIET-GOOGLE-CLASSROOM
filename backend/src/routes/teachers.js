import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import { ObjectId } from 'mongodb';
import { getSyncFromDateString } from '../lib/syncYear.js';

const router = Router();

async function getActiveCourseIds(db) {
  const cached = cacheGet('active_course_ids');
  if (cached) return cached;
  const syncFrom = getSyncFromDateString();
  const list = await db.collection('courses').find(
    { courseState: 'ACTIVE', creationTime: { $gte: syncFrom } },
    { projection: { id: 1 } }
  ).toArray();
  const ids = list.map((c) => c.id);
  cacheSet('active_course_ids', ids);
  return ids;
}

function stringifyId(doc) {
  if (doc && doc._id && ObjectId.isValid(doc._id)) doc._id = String(doc._id);
  return doc;
}

router.get('/teachers', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim();
  const skip = (page - 1) * limit;

  const db = getDb();
  const activeIds = await getActiveCourseIds(db);
  if (activeIds.length === 0) {
    return res.json({ data: [], total: 0, page, limit });
  }

  const match = { courseId: { $in: activeIds } };
  if (search) match.name = { $regex: search, $options: 'i' };

  const result = await db.collection('teachers').aggregate([
    { $match: match },
    { $group: { _id: '$userId', name: { $first: '$name' }, email: { $first: '$email' }, userId: { $first: '$userId' }, photoUrl: { $first: '$photoUrl' }, courseCount: { $sum: 1 } } },
    { $sort: { name: 1 } },
    { $facet: { metadata: [{ $count: 'total' }], data: [{ $skip: skip }, { $limit: limit }] } },
  ]).toArray();

  const facet = result[0] || { metadata: [], data: [] };
  const total = facet.metadata[0]?.total ?? 0;
  const teachers = facet.data;
  teachers.forEach(stringifyId);

  res.json({ data: teachers, total, page, limit });
});

export default router;
