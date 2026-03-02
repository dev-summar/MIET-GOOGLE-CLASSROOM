import { Router } from 'express';
import { fetchTlcCourses, fetchTlcCourseDetails, clearTlcCache } from '../services/tlcService.js';

const router = Router();

router.get('/courses', async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  const search = (req.query.search || '').trim().toLowerCase();

  try {
    const allCourses = await fetchTlcCourses();
    let filtered = allCourses;
    if (search) {
      filtered = allCourses.filter((c) =>
        (c.subjectName || '').toLowerCase().includes(search)
      );
    }
    const total = filtered.length;
    const skip = (page - 1) * limit;
    const data = filtered.slice(skip, skip + limit);
    res.json({ data, total, page, limit });
  } catch (err) {
    console.error('[tlc] GET /api/tlc/courses failed:', err.message);
    res.status(500).json({
      error: 'Unable to fetch TLC data. Please try again later.',
    });
  }
});

router.get('/courses/:subjectId', async (req, res) => {
  const { subjectId } = req.params;
  try {
    const details = await fetchTlcCourseDetails(subjectId);
    if (!details) {
      return res.status(404).json({ error: 'TLC course not found.' });
    }
    res.json(details);
  } catch (err) {
    console.error('[tlc] GET /api/tlc/courses/%s failed:', subjectId, err.message);
    res.status(500).json({
      error: 'Unable to fetch TLC data. Please try again later.',
    });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    clearTlcCache();
    res.json({
      status: 'success',
      message: 'TLC cache cleared. Subsequent requests will fetch fresh data.',
    });
  } catch (err) {
    console.error('[tlc] POST /api/tlc/refresh failed:', err.message);
    res.status(500).json({
      error: 'Failed to clear TLC cache.',
    });
  }
});

export default router;

