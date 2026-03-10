import JSZip from "jszip";
import initSqlJsModule from "sql.js";
import type { ImportedCard } from "./schema";

async function getSqlJs() {
  return initSqlJsModule({ locateFile: () => "" });
}

function stripAnkiHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<div>/gi, "\n")
    .replace(/<\/div>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .trim();
}

export interface AnkiReviewLog {
  /** Anki card id (used to match reviews to cards) */
  cardId: number;
  /** Timestamp in milliseconds */
  timestamp: number;
  /** Anki ease: 1=Again, 2=Hard, 3=Good, 4=Easy */
  ease: number;
  /** Interval in days (negative = seconds for learning) */
  interval: number;
  /** Last interval */
  lastInterval: number;
  /** Type: 0=learn, 1=review, 2=relearn, 3=filtered */
  type: number;
}

export interface AnkiParseResult {
  cards: ImportedCard[];
  noteTypes: string[];
  tagList: string[];
  deckName: string;
  /** Maps Anki note index to card id for review history matching */
  cardNoteMap?: Map<number, number>;
  reviewLogs?: AnkiReviewLog[];
}

export async function parseApkg(
  buffer: ArrayBuffer
): Promise<AnkiParseResult> {
  const zip = await JSZip.loadAsync(buffer);

  // Find the SQLite database file
  let dbFile =
    zip.file("collection.anki21") ??
    zip.file("collection.anki2");

  if (!dbFile) {
    // Try to find any .anki2 or .anki21 file
    const files = Object.keys(zip.files);
    const dbFileName = files.find(
      (f) => f.endsWith(".anki21") || f.endsWith(".anki2")
    );
    if (dbFileName) dbFile = zip.file(dbFileName);
  }

  if (!dbFile) {
    throw new Error(
      "Could not find Anki database in .apkg file. Make sure this is a valid Anki export."
    );
  }

  const dbBuffer = await dbFile.async("arraybuffer");
  const SQL = await getSqlJs();
  const sqlDb = new SQL.Database(new Uint8Array(dbBuffer));

  try {
    // Get model/note type info from col table
    const colResult = sqlDb.exec("SELECT models FROM col LIMIT 1");
    const noteTypes: string[] = [];
    let models: Record<string, { name: string; flds: { name: string }[] }> = {};

    if (colResult.length > 0 && colResult[0].values.length > 0) {
      try {
        models = JSON.parse(colResult[0].values[0][0] as string);
        for (const model of Object.values(models)) {
          noteTypes.push(model.name);
        }
      } catch {
        // Ignore model parse errors — fallback to field index mapping
      }
    }

    // Get deck name
    let deckName = "Imported Deck";
    try {
      const decksResult = sqlDb.exec("SELECT decks FROM col LIMIT 1");
      if (decksResult.length > 0 && decksResult[0].values.length > 0) {
        const decks = JSON.parse(decksResult[0].values[0][0] as string);
        const deckValues = Object.values(decks) as { name: string }[];
        const nonDefault = deckValues.find(
          (d) => d.name !== "Default" && d.name !== ""
        );
        if (nonDefault) deckName = nonDefault.name;
      }
    } catch {
      // Use default deck name
    }

    // Extract notes
    const notesResult = sqlDb.exec(
      "SELECT flds, tags, mid FROM notes"
    );

    const cards: ImportedCard[] = [];
    const allTags = new Set<string>();

    if (notesResult.length > 0) {
      for (const row of notesResult[0].values) {
        const fields = (row[0] as string).split("\x1f");
        const tagStr = (row[1] as string).trim();
        const tags = tagStr
          ? tagStr.split(/\s+/).filter(Boolean)
          : [];

        tags.forEach((t) => allTags.add(t));

        if (fields.length >= 2) {
          const front = stripAnkiHtml(fields[0]);
          const back = stripAnkiHtml(fields[1]);
          if (front && back) {
            cards.push({ front, back, tags });
          }
        }
      }
    }

    // Extract review history from revlog table
    const reviewLogs: AnkiReviewLog[] = [];
    const cardNoteMap = new Map<number, number>();
    try {
      // Build card→note mapping from cards table
      const cardsResult = sqlDb.exec("SELECT id, nid FROM cards");
      if (cardsResult.length > 0) {
        for (const row of cardsResult[0].values) {
          cardNoteMap.set(row[0] as number, row[1] as number);
        }
      }

      const revlogResult = sqlDb.exec(
        "SELECT id, cid, ease, ivl, lastIvl, type FROM revlog ORDER BY id ASC"
      );
      if (revlogResult.length > 0) {
        for (const row of revlogResult[0].values) {
          reviewLogs.push({
            cardId: row[1] as number,
            timestamp: row[0] as number,
            ease: row[2] as number,
            interval: row[3] as number,
            lastInterval: row[4] as number,
            type: row[5] as number,
          });
        }
      }
    } catch {
      // revlog may not exist in all exports
    }

    return {
      cards,
      noteTypes,
      tagList: Array.from(allTags).sort(),
      deckName,
      cardNoteMap,
      reviewLogs,
    };
  } finally {
    sqlDb.close();
  }
}
