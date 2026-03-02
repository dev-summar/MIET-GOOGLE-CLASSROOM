import { getDb } from '../lib/db.js';
import { cacheGet, cacheSet } from '../lib/cache.js';
import { getSyncFromDateString } from '../lib/syncYear.js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function parseLastUpdated(val) {
  if (!val) return null;
  try {
    const d = new Date(val.replace('Z', '+00:00'));
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export async function calculateStudentAnalytics() {
  const cacheKey = 'analytics:student_analytics';
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const db = getDb();
  const syncFrom = getSyncFromDateString();
  const activeCourses = await db.collection('courses').find(
    { courseState: 'ACTIVE', creationTime: { $gte: syncFrom } },
    { projection: { id: 1 } }
  ).toArray();
  const activeIds = activeCourses.map((c) => c.id);
  if (activeIds.length === 0) {
    cacheSet(cacheKey, []);
    return [];
  }

  const [allCw, uniqueStudents, subResults] = await Promise.all([
    db.collection('coursework').find(
      { courseId: { $in: activeIds }, creationTime: { $gte: syncFrom } },
      { projection: { id: 1, courseId: 1, creationTime: 1 } }
    ).sort({ creationTime: 1 }).toArray(),
    db.collection('students').aggregate([
      { $match: { courseId: { $in: activeIds } } },
      { $group: { _id: '$userId', userId: { $first: '$userId' }, studentName: { $first: '$name' }, courseIds: { $push: '$courseId' } } },
    ]).toArray(),
    db.collection('submissions').aggregate([
      { $match: { courseId: { $in: activeIds } } },
      { $group: { _id: '$userId', subs: { $push: { courseWorkId: '$courseWorkId', state: '$state', lastUpdated: '$updateTime' } } } },
    ]).toArray(),
  ]);

  const courseCwMap = new Map();
  for (const cw of allCw) {
    const cid = cw.courseId;
    if (!courseCwMap.has(cid)) courseCwMap.set(cid, []);
    courseCwMap.get(cid).push(cw);
  }
  const userSubs = Object.fromEntries(subResults.map((s) => [s._id, s.subs]));

  const now = Date.now();
  const thirtyDaysAgo = new Date(now - THIRTY_DAYS_MS);

  const results = [];
  for (const s of uniqueStudents) {
    const uid = s.userId;
    const sCourses = s.courseIds;
    const sSubsList = userSubs[uid] || [];
    const subMap = Object.fromEntries(sSubsList.map((sub) => [sub.courseWorkId, sub]));

    const studentAssignments = [];
    for (const cid of sCourses) {
      studentAssignments.push(...(courseCwMap.get(cid) || []));
    }
    studentAssignments.sort((a, b) => (a.creationTime || '').localeCompare(b.creationTime || ''));

    const total = studentAssignments.length;
    if (total === 0) continue;

    let submitted = 0;
    let missing = 0;
    let consecutiveMissing = 0;
    let maxConsecutive = 0;
    let lastActivityDate = null;

    for (const cw of studentAssignments) {
      const sub = subMap[cw.id];
      const isSubmitted = sub && (sub.state === 'TURNED_IN' || sub.state === 'RETURNED');

      if (isSubmitted) {
        submitted += 1;
        consecutiveMissing = 0;
        const ut = sub.lastUpdated ? parseLastUpdated(sub.lastUpdated) : null;
        if (ut && (!lastActivityDate || ut > lastActivityDate)) lastActivityDate = ut;
      } else {
        missing += 1;
        consecutiveMissing += 1;
        if (consecutiveMissing > maxConsecutive) maxConsecutive = consecutiveMissing;
      }
    }

    const missedPct = total > 0 ? (missing / total) * 100 : 0;
    const isSilent = submitted === 0 || (lastActivityDate && lastActivityDate < thirtyDaysAgo);
    const isAtRisk = total > 0 && (missedPct >= 40 || maxConsecutive >= 2 || submitted / total < 0.6);

    results.push({
      userId: uid,
      studentName: s.studentName,
      lastActivity: lastActivityDate ? lastActivityDate.toISOString().slice(0, 10) : 'None',
      totalAssignments: total,
      submitted,
      missed: missing,
      missedPercentage: Math.round(missedPct),
      isSilent,
      isAtRisk,
    });
  }

  cacheSet(cacheKey, results);
  return results;
}
