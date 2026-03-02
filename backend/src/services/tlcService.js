import axios from 'axios';
import { getEnv } from '../config/env.js';

const TLC_BASE_URL = getEnv('TLC_BASE_URL', 'https://pi360.net/site/api/endpoints');
const TLC_INSTITUTE_ID = getEnv('TLC_INSTITUTE_ID');
const TLC_API_KEY = getEnv('TLC_API_KEY');
const TLC_CACHE_TTL = parseInt(getEnv('TLC_CACHE_TTL', '300'), 10) || 300;

if (!TLC_INSTITUTE_ID || !TLC_API_KEY) {
  console.warn('[tlc] TLC_INSTITUTE_ID or TLC_API_KEY is not set. TLC endpoints will fail until configured.');
}

const http = axios.create({
  baseURL: TLC_BASE_URL.replace(/\/+$/, ''),
  timeout: 15000,
});

const cache = new Map();

function cacheGet(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

function cacheSet(key, value) {
  cache.set(key, {
    value,
    expiresAt: Date.now() + TLC_CACHE_TTL * 1000,
  });
}

export function clearTlcCache() {
  cache.clear();
  console.info('[tlc] Cache cleared');
}

function normalizeCourse(item) {
  const subjectId =
    item.subjectId ||
    item.subject_id ||
    item.course_id ||
    item.id;
  return {
    subjectId,
    program: item.program || item.programme || item.program_name || '',
    batch: item.batch || item.batch_name || '',
    subjectName: item.subjectName || item.subject_name || item.subject || item.title || '',
    subjectCode: item.subjectCode || item.subject_code || item.code || '',
    courseHandout: item.courseHandout || item.course_handout || item.handout_url || null,
    lessonPlan: item.lessonPlan || item.lesson_plan || item.lessonplan_url || null,
  };
}

function normalizeDetails(raw) {
  const courseInfoRaw = raw.courseInfo || raw.course_info || raw.course || raw;
  const instructorRaw = raw.instructor || raw.faculty || raw.teacher || {};
  const outcomesRaw = raw.outcomes || raw.courseOutcomes || raw.course_outcomes || [];
  const evalRaw = raw.evaluationScheme || raw.evaluation_scheme || raw.evaluation || {};
  const materialsRaw = raw.courseMaterials || raw.materials || raw.units || [];

  const courseInfo = {
    subjectName:
      courseInfoRaw.subjectName ||
      courseInfoRaw.subject_name ||
      courseInfoRaw.subject ||
      courseInfoRaw.title ||
      '',
    subjectCode:
      courseInfoRaw.subjectCode ||
      courseInfoRaw.subject_code ||
      courseInfoRaw.code ||
      '',
    program: courseInfoRaw.program || courseInfoRaw.programme || courseInfoRaw.program_name || '',
    batch: courseInfoRaw.batch || courseInfoRaw.batch_name || '',
    semester: courseInfoRaw.semester || courseInfoRaw.sem || '',
    credits: courseInfoRaw.credits || courseInfoRaw.credit || '',
    description: courseInfoRaw.description || courseInfoRaw.overview || courseInfoRaw.summary || '',
  };

  const instructor = {
    name: instructorRaw.name || instructorRaw.full_name || '',
    designation: instructorRaw.designation || instructorRaw.title || '',
    department: instructorRaw.department || instructorRaw.dept || '',
    photoUrl: instructorRaw.photo || instructorRaw.photo_url || instructorRaw.avatar || null,
  };

  const outcomes = Array.isArray(outcomesRaw)
    ? outcomesRaw
    : typeof outcomesRaw === 'string'
      ? outcomesRaw.split(/\r?\n/).filter(Boolean)
      : [];

  const evaluationScheme = {
    internal: evalRaw.internal || evalRaw.internal_marks || null,
    external: evalRaw.external || evalRaw.external_marks || null,
    breakdown: Array.isArray(evalRaw.breakdown) ? evalRaw.breakdown : [],
  };

  const courseMaterials = Array.isArray(materialsRaw)
    ? materialsRaw.map((unit) => ({
        unitTitle: unit.unitTitle || unit.unit_title || unit.unit || unit.name || '',
        chapters: Array.isArray(unit.chapters || unit.topics)
          ? (unit.chapters || unit.topics).map((ch) => ({
              title: ch.title || ch.chapter || ch.name || '',
              topics: Array.isArray(ch.topics) ? ch.topics : [],
              updatedAt: ch.updated_at || ch.updatedAt || null,
              updatedBy: ch.updated_by || ch.updatedBy || null,
              resources: Array.isArray(ch.resources)
                ? ch.resources.map((r) => ({
                    type: r.type || r.resource_type || '',
                    label: r.label || r.name || r.title || '',
                    url: r.url || r.link || r.href || null,
                  }))
                : [],
            }))
          : [],
      }))
    : [];

  const resources = Array.isArray(raw.resources) ? raw.resources : [];

  return {
    courseInfo,
    instructor,
    resources,
    outcomes,
    evaluationScheme,
    courseMaterials,
  };
}

export async function fetchTlcCourses() {
  const cacheKey = 'tlc_courses';
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const res = await http.get('/api_tlc_content.php', {
      params: {
        institute_id: TLC_INSTITUTE_ID,
        key: TLC_API_KEY,
      },
    });
    const raw = Array.isArray(res.data?.data) ? res.data.data : Array.isArray(res.data) ? res.data : [];
    const courses = raw.map(normalizeCourse).filter((c) => c.subjectId);
    cacheSet(cacheKey, courses);
    return courses;
  } catch (err) {
    console.error('[tlc] Failed to fetch TLC courses:', err.message);
    throw new Error('Unable to fetch TLC data. Please try again later.');
  }
}

export async function fetchTlcCourseDetails(subjectId) {
  if (!subjectId) throw new Error('subjectId is required');
  const cacheKey = `tlc_course_${subjectId}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const res = await http.get('/api_tlc_content_details.php', {
      params: {
        institute_id: TLC_INSTITUTE_ID,
        course_id: subjectId,
        key: TLC_API_KEY,
      },
    });
    if (!res.data) {
      return null;
    }
    const details = normalizeDetails(res.data);
    cacheSet(cacheKey, details);
    return details;
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return null;
    }
    console.error('[tlc] Failed to fetch TLC course details:', err.message);
    throw new Error('Unable to fetch TLC data. Please try again later.');
  }
}

