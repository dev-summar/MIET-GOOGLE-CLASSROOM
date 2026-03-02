import { google } from 'googleapis';
import { resolve } from 'path';
import { getEnv } from '../config/env.js';

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly',
  'https://www.googleapis.com/auth/classroom.rosters.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
  'https://www.googleapis.com/auth/classroom.student-submissions.students.readonly',
];

let cachedAuth = null;

export function getGoogleAuth() {
  if (cachedAuth) return cachedAuth;
  const keyPath = resolve(process.cwd(), getEnv('GOOGLE_APPLICATION_CREDENTIALS', 'service-account.json'));
  const impersonated = getEnv('GOOGLE_IMPERSONATED_USER');
  if (!impersonated) throw new Error('GOOGLE_IMPERSONATED_USER not set');

  const jwt = new google.auth.JWT({
    keyFile: keyPath,
    scopes: SCOPES,
    subject: impersonated,
  });
  cachedAuth = jwt;
  return cachedAuth;
}

export function getClassroomClient() {
  const auth = getGoogleAuth();
  return google.classroom({ version: 'v1', auth });
}

export { SCOPES };
