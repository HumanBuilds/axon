import type { Database } from 'sql.js';
import type { AnkiModel, AnkiDeck, AnkiNote, AnkiCard } from './types';

export function queryModels(db: Database): AnkiModel[] {
  const result = db.exec('SELECT models FROM col LIMIT 1');
  if (!result.length || !result[0].values.length) {
    throw new Error('No collection data found in database');
  }

  const modelsJson = JSON.parse(result[0].values[0][0] as string);
  return Object.values(modelsJson).map((m: any) => ({
    id: Number(m.id),
    name: m.name,
    type: m.type ?? 0,
    flds: (m.flds || []).map((f: any) => ({ name: f.name, ord: f.ord })),
    tmpls: (m.tmpls || []).map((t: any) => ({
      name: t.name,
      qfmt: t.qfmt,
      afmt: t.afmt,
      ord: t.ord,
    })),
  }));
}

export function queryDecks(db: Database): AnkiDeck[] {
  const result = db.exec('SELECT decks FROM col LIMIT 1');
  if (!result.length || !result[0].values.length) {
    throw new Error('No collection data found in database');
  }

  const decksJson = JSON.parse(result[0].values[0][0] as string);
  return Object.values(decksJson).map((d: any) => ({
    id: Number(d.id),
    name: d.name,
  }));
}

export function queryNotes(db: Database): AnkiNote[] {
  const result = db.exec('SELECT id, mid, flds, tags FROM notes');
  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: Number(row[0]),
    mid: Number(row[1]),
    flds: row[2] as string,
    tags: (row[3] as string).trim(),
  }));
}

export function queryCards(db: Database): AnkiCard[] {
  const result = db.exec('SELECT id, nid, did, ord FROM cards');
  if (!result.length) return [];

  return result[0].values.map((row) => ({
    id: Number(row[0]),
    nid: Number(row[1]),
    did: Number(row[2]),
    ord: Number(row[3]),
  }));
}
