import { Router } from 'express';
import { calculateStudentAnalytics } from '../services/analyticsService.js';
import { getSyncFromDateString } from '../lib/syncYear.js';
import { getDb } from '../lib/db.js';
import { ObjectId } from 'mongodb';

const router = Router();

function stringifyId(doc) {
  if (doc && doc._id && ObjectId.isValid(doc._id)) doc._id = String(doc._id);
  return doc;
}

router.get('/silent-students', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim().toLowerCase();

  const all = await calculateStudentAnalytics();
  let silent = all.filter((s) => s.isSilent);
  if (search) {
    silent = silent.filter((s) => (s.studentName || '').toLowerCase().includes(search));
  }
  silent.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));

  const total = silent.length;
  const skip = (page - 1) * limit;
  const students = silent.slice(skip, skip + limit);

  res.json({ count: total, students, page, limit });
});

router.get('/at-risk-students', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim().toLowerCase();

  const all = await calculateStudentAnalytics();
  let atRisk = all.filter((s) => s.isAtRisk);
  if (search) {
    atRisk = atRisk.filter((s) => (s.studentName || '').toLowerCase().includes(search));
  }
  atRisk.sort((a, b) => (a.studentName || '').localeCompare(b.studentName || ''));

  const total = atRisk.length;
  const skip = (page - 1) * limit;
  const students = atRisk.slice(skip, skip + limit);

  res.json({ count: total, students, page, limit });
});

router.get('/submissions-over-time', async (req, res) => {
  const db = getDb();
  const syncFrom = getSyncFromDateString();
  const activeCourses = await db.collection('courses').find(
    { courseState: 'ACTIVE', creationTime: { $gte: syncFrom } },
    { projection: { id: 1 } }
  ).toArray();
  const activeIds = activeCourses.map((c) => c.id);
  if (activeIds.length === 0) {
    return res.json({ data: [] });
  }
  const days = parseInt(req.query.days, 10) || 30;
  const start = new Date();
  start.setDate(start.getDate() - days);
  start.setUTCHours(0, 0, 0, 0);
  const pipeline = [
    { $match: { courseId: { $in: activeIds } } },
    { $addFields: { date: { $cond: [{ $eq: [{ $type: '$updateTime' }, 'string'] }, { $toDate: '$updateTime' }, '$updateTime'] } } },
    { $match: { date: { $ne: null, $gte: start } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ];
  const result = await db.collection('submissions').aggregate(pipeline).toArray();
  const data = result.map((r) => ({ date: r._id, count: r.count }));
  res.json({ data });
});

router.get('/at-risk-trend', async (req, res) => {
  const all = await calculateStudentAnalytics();
  const atRiskCount = all.filter((s) => s.isAtRisk).length;
  const days = Math.min(14, Math.max(7, parseInt(req.query.days, 10) || 7));
  const data = [];
  const d = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const x = new Date(d);
    x.setDate(x.getDate() - i);
    x.setUTCHours(0, 0, 0, 0);
    const dateStr = x.toISOString().slice(0, 10);
    data.push({ date: dateStr, count: atRiskCount });
  }
  res.json({ data });
});

export default router;
