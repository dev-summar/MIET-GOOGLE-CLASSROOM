import { Router } from 'express';
import { enqueueSyncAllJob, getSyncJob, getLatestSyncJob } from '../services/syncService.js';

const router = Router();

router.post('/sync/all', async (req, res) => {
  console.info('[sync] POST /api/sync/all — job requested');
  try {
    const { jobId } = await enqueueSyncAllJob();
    res.json({ status: 'queued', jobId });
  } catch (err) {
    console.error('[sync] Failed to enqueue sync job:', err);
    res
      .status(500)
      .json({ status: 'failure', error: err.message || 'Failed to start sync.' });
  }
});

router.get('/sync/status', async (req, res) => {
  try {
    const { jobId } = req.query;
    const job = jobId ? await getSyncJob(jobId) : await getLatestSyncJob();
    if (!job) {
      return res.status(404).json({ error: 'No sync job found.' });
    }
    const { _id, ...rest } = job;
    res.json({ id: _id.toString(), ...rest });
  } catch (err) {
    console.error('[sync] Failed to fetch sync status:', err);
    res
      .status(500)
      .json({ error: err.message || 'Failed to fetch sync status.' });
  }
});

export default router;
