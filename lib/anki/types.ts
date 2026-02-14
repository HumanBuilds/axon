export interface AnkiModel {
  id: number;
  name: string;
  type: number; // 0 = standard, 1 = cloze
  flds: { name: string; ord: number }[];
  tmpls: { name: string; qfmt: string; afmt: string; ord: number }[];
}

export interface AnkiDeck {
  id: number;
  name: string;
}

export interface AnkiNote {
  id: number;
  mid: number; // model id
  flds: string; // fields separated by \x1f
  tags: string;
}

export interface AnkiCard {
  id: number;
  nid: number; // note id
  did: number; // deck id
  ord: number; // template ordinal
}

export interface ParsedCard {
  front: string;
  back: string;
  tags: string[];
}

export interface ParseResult {
  decks: Map<string, ParsedCard[]>;
  warnings: string[];
}
