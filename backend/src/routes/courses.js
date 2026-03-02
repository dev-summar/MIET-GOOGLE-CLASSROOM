import { Router } from 'express';
import { getDb } from '../lib/db.js';
import { ObjectId } from 'mongodb';
import { getSyncFromDateString } from '../lib/syncYear.js';

const router = Router();

function stringifyId(doc) {
  if (doc && doc._id && ObjectId.isValid(doc._id)) doc._id = String(doc._id);
  return doc;
}

router.get('/courses', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim();
  const skip = (page - 1) * limit;

  const db = getDb();
  const syncFrom = getSyncFromDateString();
  const query = { courseState: 'ACTIVE', creationTime: { $gte: syncFrom } };
  if (search) query.name = { $regex: search, $options: 'i' };

  const [courses, total] = await Promise.all([
    db.collection('courses').find(query).skip(skip).limit(limit).toArray(),
    db.collection('courses').countDocuments(query),
  ]);

  if (courses.length === 0) {
    return res.json({ data: [], total, page, limit });
  }

  const courseIds = courses.map((c) => c.id);
  const [teacherCounts, studentCounts, assignmentCounts] = await Promise.all([
    db.collection('teachers').aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', userIds: { $addToSet: '$userId' } } },
      { $project: { count: { $size: '$userIds' } } },
    ]).toArray(),
    db.collection('students').aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', userIds: { $addToSet: '$userId' } } },
      { $project: { count: { $size: '$userIds' } } },
    ]).toArray(),
    db.collection('coursework').aggregate([
      { $match: { courseId: { $in: courseIds } } },
      { $group: { _id: '$courseId', count: { $sum: 1 } } },
    ]).toArray(),
  ]);

  const tMap = Object.fromEntries(teacherCounts.map((x) => [x._id, x.count]));
  const sMap = Object.fromEntries(studentCounts.map((x) => [x._id, x.count]));
  const aMap = Object.fromEntries(assignmentCounts.map((x) => [x._id, x.count]));

  for (const c of courses) {
    stringifyId(c);
    c.teacherCount = tMap[c.id] ?? 0;
    c.studentCount = sMap[c.id] ?? 0;
    c.assignmentCount = aMap[c.id] ?? 0;
  }

  res.json({ data: courses, total, page, limit });
});

router.get('/courses/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const db = getDb();

  const [course, teachers, students, assignments] = await Promise.all([
    db.collection('courses').findOne({ id: courseId, courseState: 'ACTIVE', creationTime: { $gte: getSyncFromDateString() } }),
    db.collection('teachers').find({ courseId }).toArray(),
    db.collection('students').find({ courseId }).toArray(),
    db.collection('coursework').find({ courseId, creationTime: { $gte: getSyncFromDateString() } }).toArray(),
  ]);

  if (!course) {
    return res.status(404).json({ detail: 'Course not found or is archived' });
  }

  [course, ...teachers, ...students, ...assignments].forEach(stringifyId);
  res.json({
    course,
    teachers,
    students,
    assignments,
  });
});

export default router;
