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

export interface AnkiParseResult {
  cards: ImportedCard[];
  noteTypes: string[];
  tagList: string[];
  deckName: string;
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

    return {
      cards,
      noteTypes,
      tagList: Array.from(allTags).sort(),
      deckName,
    };
  } finally {
    sqlDb.close();
  }
}
