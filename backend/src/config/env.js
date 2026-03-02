/**
 * Startup validation: refuse to start if config is invalid.
 * - MONGODB_URI required; must NOT contain localhost or 127.0.0.1
 * - Credentials file must exist
 */
import { existsSync } from 'fs';
import { resolve } from 'path';

export function getEnv(name, defaultValue = undefined) {
  const v = process.env[name];
  if (v !== undefined && v !== '') return v;
  return defaultValue;
}

export function validateStartup() {
  const errors = [];

  const mongodbUri = getEnv('MONGODB_URI');
  if (!mongodbUri) {
    errors.push('MONGODB_URI is missing from environment/.env.');
  } else {
    const lower = mongodbUri.toLowerCase();
    if (lower.includes('localhost') || lower.includes('127.0.0.1')) {
      errors.push('MONGODB_URI must be MongoDB Atlas; localhost/127.0.0.1 is not allowed.');
    }
  }

  const credsPath = getEnv('GOOGLE_APPLICATION_CREDENTIALS', 'service-account.json');
  const absolutePath = resolve(process.cwd(), credsPath);
  if (!existsSync(absolutePath)) {
    errors.push(`Credentials file not found: ${absolutePath} (GOOGLE_APPLICATION_CREDENTIALS=${credsPath})`);
  }

  if (errors.length > 0) {
    console.error('❌ Configuration Error:');
    errors.forEach((e) => console.error('  ', e));
    if (!mongodbUri) console.error('👉 Set MONGODB_URI in .env (MongoDB Atlas connection string).');
    if (mongodbUri && (mongodbUri.toLowerCase().includes('localhost') || mongodbUri.toLowerCase().includes('127.0.0.1'))) {
      console.error('👉 Use a MongoDB Atlas URI (e.g. mongodb+srv://...mongodb.net/...).');
    }
    const cp = getEnv('GOOGLE_APPLICATION_CREDENTIALS', 'service-account.json');
    if (!existsSync(resolve(process.cwd(), cp))) {
      console.error('👉 Place service-account.json in backend root or set GOOGLE_APPLICATION_CREDENTIALS.');
    }
    process.exit(1);
  }
}
