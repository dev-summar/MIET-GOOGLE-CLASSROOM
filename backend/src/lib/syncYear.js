import { getEnv } from '../config/env.js';

const syncYear = parseInt(getEnv('SYNC_FROM_YEAR', '2025'), 10);

/** ISO string for MongoDB query (works for creationTime stored as string or Date) */
export function getSyncFromDateString() {
  return `${syncYear}-01-01T00:00:00.000Z`;
}

/** Date for JS comparison */
export function getSyncFromDate() {
  return new Date(getSyncFromDateString());
}
