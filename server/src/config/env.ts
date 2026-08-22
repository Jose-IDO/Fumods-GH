import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

let initialized = false;

function loadEnvFile(filePath: string): boolean {
  if (!filePath || !fs.existsSync(filePath)) {
    return false;
  }

  dotenv.config({
    path: filePath,
    // Project configuration must take precedence over stale values inherited by
    // a long-running development server.
    override: true,
  });

  return true;
}

export function initEnv() {
  if (initialized) {
    return;
  }

  initialized = true;

  const candidates: string[] = [];

  // server/dist/config -> server/.env
  const serverRoot = path.resolve(__dirname, '../..');
  // server/dist/config -> projectRoot/.env
  const projectRoot = path.resolve(__dirname, '../../..');
  const cwd = process.cwd();

  const baseDirs = [serverRoot, projectRoot, cwd];
  const fileNames = ['.env.local', '.env'];

  for (const dir of baseDirs) {
    for (const file of fileNames) {
      candidates.push(path.join(dir, file));
    }
  }

  for (const candidate of candidates) {
    loadEnvFile(candidate);
  }
}

initEnv();

