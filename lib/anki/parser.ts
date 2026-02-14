import type { ParseResult, ParsedCard, AnkiModel, AnkiNote } from './types';
import { queryModels, queryDecks, queryNotes, queryCards } from './sql-queries';
import { renderTemplate } from './template-renderer';
import { htmlToMarkdown } from './html-to-markdown';

/**
 * Parse an Anki .apkg file buffer into grouped cards by deck name.
 */
export async function parseApkg(buffer: ArrayBuffer): Promise<ParseResult> {
  const warnings: string[] = [];
  const decks = new Map<string, ParsedCard[]>();

  // 1. Unzip the .apkg file
  const JSZip = (await import('jszip')).default;
  const zip = await JSZip.loadAsync(buffer);

  // 2. Find the SQLite database
  const dbFile =
    zip.file('collection.anki21') ??
    zip.file('collection.anki2');

  if (!dbFile) {
    throw new Error('Invalid .apkg file: no collection database found');
  }

  const dbBuffer = await dbFile.async('arraybuffer');

  // 3. Initialize sql.js and open the database
  const initSqlJs = (await import('sql.js')).default;
  const SQL = await initSqlJs({
    locateFile: () => '/sql-wasm.wasm',
  });
  const db = new SQL.Database(new Uint8Array(dbBuffer));

  try {
    // 4. Query all tables
    const models = queryModels(db);
    const ankiDecks = queryDecks(db);
    const notes = queryNotes(db);
    const cards = queryCards(db);

    // Build lookup maps
    const modelMap = new Map<number, AnkiModel>();
    for (const model of models) {
      modelMap.set(model.id, model);
    }

    const deckNameMap = new Map<number, string>();
    for (const deck of ankiDecks) {
      // Flatten nested deck names: "Parent::Child" -> "Parent - Child"
      deckNameMap.set(deck.id, deck.name.replace(/::/g, ' - '));
    }

    const noteMap = new Map<number, AnkiNote>();
    for (const note of notes) {
      noteMap.set(note.id, note);
    }

    // 5. Process each card
    let skippedCount = 0;

    for (const card of cards) {
      const note = noteMap.get(card.nid);
      if (!note) {
        skippedCount++;
        continue;
      }

      const model = modelMap.get(note.mid);
      if (!model) {
        skippedCount++;
        continue;
      }

      const deckName = deckNameMap.get(card.did) ?? 'Unknown Deck';
      const fields = note.flds.split('\x1f');

      // Render template
      const rendered = renderTemplate(model, fields, card.ord);
      if (!rendered) {
        skippedCount++;
        continue;
      }

      // Convert HTML to Markdown
      const front = htmlToMarkdown(rendered.front);
      const back = htmlToMarkdown(rendered.back);

      if (!front.trim()) {
        skippedCount++;
        continue;
      }

      // Parse tags
      const tags = note.tags
        .split(/\s+/)
        .filter((t) => t.length > 0);

      const parsedCard: ParsedCard = { front, back, tags };

      if (!decks.has(deckName)) {
        decks.set(deckName, []);
      }
      decks.get(deckName)!.push(parsedCard);
    }

    if (skippedCount > 0) {
      warnings.push(`${skippedCount} card(s) were skipped (empty content or missing data)`);
    }

    // Warn about media
    const mediaFile = zip.file('media');
    if (mediaFile) {
      try {
        const mediaJson = JSON.parse(await mediaFile.async('string'));
        const mediaCount = Object.keys(mediaJson).length;
        if (mediaCount > 0) {
          warnings.push(
            `${mediaCount} media file(s) were not imported (images/audio not yet supported)`,
          );
        }
      } catch {
        // media file parsing failed, not critical
      }
    }
  } finally {
    db.close();
  }

  return { decks, warnings };
}
