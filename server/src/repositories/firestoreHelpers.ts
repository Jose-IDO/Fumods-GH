import { admin } from '../config/firebaseAdmin';

export function normalizeKeywords(...values: Array<string | undefined | null>): string[] {
  const terms = new Set<string>();

  values.forEach(value => {
    if (!value) return;
    value
      .toString()
      .trim()
      .toLowerCase()
      .split(/\s+/)
      .forEach(token => {
        if (token) terms.add(token);
      });
  });

  return Array.from(terms);
}

export function toDate(value: any): Date | undefined {
  if (value === undefined || value === null) return undefined;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }
  if (typeof value.toDate === 'function') return value.toDate();
  return undefined;
}

export function toTimestamp(value: string | Date): admin.firestore.Timestamp {
  if (value instanceof admin.firestore.Timestamp) return value;
  if (value instanceof Date) return admin.firestore.Timestamp.fromDate(value);
  return admin.firestore.Timestamp.fromDate(new Date(value));
}
