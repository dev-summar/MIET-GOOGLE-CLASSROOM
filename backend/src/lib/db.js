import { MongoClient } from 'mongodb';
import { getEnv } from '../config/env.js';

const DEFAULT_DB_NAME = 'classroom_insights';
let client = null;
let db = null;

export async function connectDb() {
  const uri = getEnv('MONGODB_URI');
  if (!uri) throw new Error('MONGODB_URI is required');
  const dbName = getEnv('MONGODB_DB_NAME', DEFAULT_DB_NAME);
  // Avoid TLS "tlsv1 alert internal error" on Windows (IPv6/IPv4 auto-selection)
  client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000, autoSelectFamily: false });
  await client.connect();
  await client.db('admin').command({ ping: 1 });
  db = client.db(dbName);
  await ensureIndexes();
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not connected');
  return db;
}

export function getClient() {
  if (!client) throw new Error('Database not connected');
  return client;
}

async function ensureIndexes() {
  const courses = db.collection('courses');
  const teachers = db.collection('teachers');
  const students = db.collection('students');
  const coursework = db.collection('coursework');
  const submissions = db.collection('submissions');

  await courses.createIndex({ id: 1 }, { unique: true });
  await courses.createIndex({ courseState: 1 });
  await courses.createIndex([{ courseState: 1 }, { name: 1 }]);
  await courses.createIndex([{ courseState: 1 }, { creationTime: 1 }]);

  await teachers.createIndex({ userId: 1 });
  await teachers.createIndex({ courseId: 1 });
  await teachers.createIndex([{ courseId: 1 }, { name: 1 }]);

  await students.createIndex({ userId: 1 });
  await students.createIndex({ courseId: 1 });
  await students.createIndex([{ courseId: 1 }, { name: 1 }]);

  await coursework.createIndex({ id: 1 }, { unique: true });
  await coursework.createIndex({ courseId: 1 });
  await coursework.createIndex([{ courseId: 1 }, { creationTime: 1 }]);

  await submissions.createIndex({ id: 1 }, { unique: true });
  await submissions.createIndex({ courseId: 1 });
  await submissions.createIndex({ courseWorkId: 1 });
  await submissions.createIndex([{ courseId: 1 }, { userId: 1 }]);
}

export async function closeDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
