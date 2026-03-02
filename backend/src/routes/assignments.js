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

router.get('/assignments', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim();
  const skip = (page - 1) * limit;

  const db = getDb();
  const activeIds = await getActiveCourseIds(db);
  if (activeIds.length === 0) {
    return res.json({ data: [], total: 0, page, limit });
  }

  const match = { courseId: { $in: activeIds }, creationTime: { $gte: getSyncFromDateString() } };
  if (search) match.title = { $regex: search, $options: 'i' };

  const result = await db.collection('coursework').aggregate([
    { $match: match },
    { $lookup: { from: 'courses', localField: 'courseId', foreignField: 'id', as: 'course' } },
    { $addFields: { courseName: { $arrayElemAt: ['$course.name', 0] } } },
    { $project: { course: 0 } },
    { $facet: { metadata: [{ $count: 'total' }], data: [{ $skip: skip }, { $limit: limit }] } },
  ]).toArray();

  const facet = result[0] || { metadata: [], data: [] };
  const total = facet.metadata[0]?.total ?? 0;
  const assignments = facet.data;
  assignments.forEach((a) => {
    stringifyId(a);
    if (!a.courseName) a.courseName = 'Unknown Course';
  });

  res.json({ data: assignments, total, page, limit });
});

router.get('/assignments/:id', async (req, res) => {
  const id = req.params.id;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const db = getDb();
  const assignment = await db.collection('coursework').findOne({ id });
  if (!assignment) {
    return res.status(404).json({ detail: 'Assignment not found' });
  }
  const syncFrom = getSyncFromDateString();
  if ((assignment.creationTime || '') < syncFrom) {
    return res.status(404).json({ detail: 'Assignment not found (pre–sync year)' });
  }

  const courseId = assignment.courseId;
  const [parentCourse, submissionsResult] = await Promise.all([
    db.collection('courses').findOne({ id: courseId, courseState: 'ACTIVE', creationTime: { $gte: syncFrom } }),
    db.collection('submissions').aggregate([
      { $match: { courseWorkId: id } },
      { $lookup: { from: 'students', localField: 'userId', foreignField: 'userId', as: 'student' } },
      { $addFields: { studentName: { $ifNull: [{ $arrayElemAt: ['$student.name', 0] }, 'Unknown Student'] } } },
      { $project: { student: 0 } },
      { $facet: { metadata: [{ $count: 'total' }], data: [{ $skip: skip }, { $limit: limit }] } },
    ]).toArray(),
  ]);

  if (!parentCourse) {
    return res.status(404).json({ detail: 'Assignment belongs to an archived course' });
  }

  stringifyId(assignment);
  assignment.courseName = parentCourse.name || 'Unknown Course';
  const subFacet = submissionsResult[0] || { metadata: [], data: [] };
  const totalSubs = subFacet.metadata[0]?.total ?? 0;
  const submissions = subFacet.data;
  submissions.forEach(stringifyId);

  res.json({
    assignment,
    submissions: { data: submissions, total: totalSubs, page, limit },
  });
});

export default router;
