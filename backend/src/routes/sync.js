import { Router } from 'express';
import { syncAll } from '../services/syncService.js';

const router = Router();

router.post('/sync/all', async (req, res) => {
  try {
    const result = await syncAll();
    res.json(result);
  } catch (err) {
    console.error('Sync failed:', err);
    res.status(500).json({ status: 'failure', error: err.message });
  }
});

export default router;
