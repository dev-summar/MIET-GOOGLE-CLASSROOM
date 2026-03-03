import { ObjectId } from 'mongodb';
import { getDb } from '../lib/db.js';
import { getClassroomClient } from '../lib/googleAuth.js';
import { cacheInvalidatePrefix } from '../lib/cache.js';
import { getEnv } from '../config/env.js';

const syncYear = parseInt(getEnv('SYNC_FROM_YEAR', '2025'), 10);
const SYNC_FROM_DATE = new Date(`${syncYear}-01-01T00:00:00Z`);
const JOB_COLLECTION = 'sync_jobs';

function isNetworkError(err) {
  const msg = err?.message ?? '';
  return (
    err?.code === 'EAI_AGAIN' ||
    err?.code === 'ENOTFOUND' ||
    err?.code === 'ETIMEDOUT' ||
    msg.includes('getaddrinfo')
  );
}

async function withNetworkRetry(fn, maxAttempts = 2) {
  let lastErr;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (isNetworkError(err) && attempt < maxAttempts) {
        console.warn(`[sync] Network error (attempt ${attempt}/${maxAttempts}), retrying in 2s:`, err.message);
        await new Promise((r) => setTimeout(r, 2000));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

async function mapWithConcurrency(items, limit, fn) {
  if (!Array.isArray(items) || items.length === 0) return;
  const queue = [...items];
  const workers = [];

  async function worker() {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const next = queue.shift();
      if (!next) break;
      // eslint-disable-next-line no-await-in-loop
      await fn(next);
    }
  }

  const workerCount = Math.min(limit, queue.length);
  for (let i = 0; i < workerCount; i += 1) {
    workers.push(worker());
  }
  await Promise.all(workers);
}

function parseCreationTime(val) {
  if (!val) return null;
  try {
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function isFromSyncYear(creationTime) {
  const d = parseCreationTime(creationTime);
  return d && d >= SYNC_FROM_DATE;
}

export async function syncCourses() {
  const db = getDb();
  const classroom = getClassroomClient();
  const coursesCol = db.collection('courses');
  const teachersCol = db.collection('teachers');
  const studentsCol = db.collection('students');

  let syncedCourses = 0;
  let syncedTeachers = 0;
  let syncedStudents = 0;

  let pageToken = null;
  do {
    const res = await classroom.courses.list({ pageSize: 100, pageToken: pageToken || undefined });
    const courses = res.data.courses || [];
    pageToken = res.data.nextPageToken || null;

    await mapWithConcurrency(courses, 3, async (course) => {
      if (!isFromSyncYear(course.creationTime)) return;

      const courseId = course.id;
      await coursesCol.updateOne(
        { id: courseId },
        { $set: { ...course, synced_at: new Date() } },
        { upsert: true }
      );
      syncedCourses += 1;

      try {
        const tRes = await classroom.courses.teachers.list({ courseId });
        const teachers = tRes.data.teachers || [];
        for (const t of teachers) {
          const profile = t.profile || {};
          const teacherData = {
            userId: t.userId,
            courseId,
            name: profile.name?.fullName,
            email: profile.emailAddress,
            photoUrl: profile.photoUrl,
          };
          await teachersCol.updateOne(
            { userId: teacherData.userId, courseId },
            { $set: teacherData },
            { upsert: true }
          );
          syncedTeachers += 1;
        }
      } catch (err) {
        console.warn(`Sync: Failed teachers for course ${courseId}:`, err.message);
      }

      try {
        const sRes = await classroom.courses.students.list({ courseId });
        const students = sRes.data.students || [];
        for (const s of students) {
          const profile = s.profile || {};
          const studentData = {
            userId: s.userId,
            courseId,
            name: profile.name?.fullName,
            email: profile.emailAddress,
            photoUrl: profile.photoUrl,
          };
          await studentsCol.updateOne(
            { userId: studentData.userId, courseId },
            { $set: studentData },
            { upsert: true }
          );
          syncedStudents += 1;
        }
      } catch (err) {
        console.warn(`Sync: Failed students for course ${courseId}:`, err.message);
      }
    });
  } while (pageToken);

  return {
    status: 'completed',
    summary: {
      courses_synced: syncedCourses,
      teachers_synced: syncedTeachers,
      students_synced: syncedStudents,
    },
  };
}

export async function syncCoursework() {
  const db = getDb();
  const classroom = getClassroomClient();
  const courseworkCol = db.collection('coursework');
  const submissionsCol = db.collection('submissions');

  const courses = await db.collection('courses').find({}, { projection: { id: 1 } }).toArray();
  if (courses.length === 0) {
    return {
      status: 'failure',
      summary: { coursework_synced: 0, submissions_synced: 0 },
      message: 'No courses in DB. Sync courses first.',
    };
  }

  let syncedCoursework = 0;
  let syncedSubmissions = 0;

  await mapWithConcurrency(courses, 2, async ({ id: courseId }) => {
    try {
      let pageToken = null;
      do {
        const res = await classroom.courses.courseWork.list({
          courseId,
          pageSize: 100,
          pageToken: pageToken || undefined,
        });
        const list = res.data.courseWork || [];
        pageToken = res.data.nextPageToken || null;

        for (const cw of list) {
          if (!isFromSyncYear(cw.creationTime)) continue;

          const cwId = cw.id;
          await courseworkCol.updateOne(
            { id: cwId },
            { $set: { ...cw, courseId } },
            { upsert: true }
          );
          syncedCoursework += 1;

          try {
            await withNetworkRetry(async () => {
              let subToken = null;
              do {
                const subRes = await classroom.courses.courseWork.studentSubmissions.list({
                  courseId,
                  courseWorkId: cwId,
                  pageToken: subToken || undefined,
                });
                const subs = subRes.data.studentSubmissions || [];
                subToken = subRes.data.nextPageToken || null;

                for (const sub of subs) {
                  const doc = { ...sub, courseId, courseWorkId: cwId };
                  delete doc.draftGrade;
                  await submissionsCol.updateOne(
                    { id: doc.id },
                    { $set: doc },
                    { upsert: true }
                  );
                  syncedSubmissions += 1;
                }
              } while (subToken);
            });
          } catch (err) {
            console.warn(`Sync: Failed submissions for coursework ${cwId}:`, err.message);
          }
        }
      } while (pageToken);
    } catch (err) {
      console.warn(`Sync: Failed coursework for course ${courseId}:`, err.message);
    }
  });

  return {
    status: 'completed',
    summary: {
      coursework_synced: syncedCoursework,
      submissions_synced: syncedSubmissions,
    },
  };
}

export async function syncAll() {
  cacheInvalidatePrefix('stats');
  cacheInvalidatePrefix('analytics');
  cacheInvalidatePrefix('active_course_ids');

  const coursesResult = await syncCourses();
  const courseworkResult = await syncCoursework();

  return {
    status: 'success',
    courses: coursesResult,
    coursework: courseworkResult,
  };
}

export async function enqueueSyncAllJob() {
  const db = getDb();
  const jobs = db.collection(JOB_COLLECTION);
  const now = new Date();
  const { insertedId } = await jobs.insertOne({
    type: 'full',
    status: 'queued',
    createdAt: now,
    updatedAt: now,
  });
  const jobId = insertedId.toString();

  // Fire-and-forget background execution
  setImmediate(() => {
    runSyncJob(jobId).catch((err) => {
      // eslint-disable-next-line no-console
      console.error('[sync] Background sync job failed:', jobId, err);
    });
  });

  return { jobId };
}

async function runSyncJob(jobId) {
  const db = getDb();
  const jobs = db.collection(JOB_COLLECTION);
  const _id = new ObjectId(jobId);

  await jobs.updateOne(
    { _id },
    {
      $set: {
        status: 'running',
        startedAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  try {
    const result = await syncAll();
    await jobs.updateOne(
      { _id },
      {
        $set: {
          status: result.status ?? 'success',
          finishedAt: new Date(),
          updatedAt: new Date(),
          result,
        },
      }
    );
  } catch (err) {
    await jobs.updateOne(
      { _id },
      {
        $set: {
          status: 'failed',
          finishedAt: new Date(),
          updatedAt: new Date(),
          error: err.message || 'Sync job failed',
        },
      }
    );
    throw err;
  }
}

export async function getSyncJob(jobId) {
  const db = getDb();
  const jobs = db.collection(JOB_COLLECTION);
  const _id = new ObjectId(jobId);
  return jobs.findOne({ _id });
}

export async function getLatestSyncJob() {
  const db = getDb();
  const jobs = db.collection(JOB_COLLECTION);
  return jobs.find().sort({ createdAt: -1 }).limit(1).next();
}
