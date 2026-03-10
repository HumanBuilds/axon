import Papa from "papaparse";

export interface CSVParseResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

export function parseCSV(content: string): CSVParseResult {
  const result = Papa.parse(content, {
    header: false,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  const rows = result.data as string[][];
  if (rows.length < 2) {
    return { headers: [], rows: [], delimiter: result.meta.delimiter };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1);

  return {
    headers,
    rows: dataRows,
    delimiter: result.meta.delimiter,
  };
}

export function autoDetectMapping(headers: string[]): {
  front: number;
  back: number;
  tags?: number;
} {
  const lower = headers.map((h) => h.toLowerCase().trim());

  const frontIdx = lower.findIndex((h) =>
    ["front", "question", "prompt", "term"].includes(h)
  );
  const backIdx = lower.findIndex((h) =>
    ["back", "answer", "response", "definition"].includes(h)
  );
  const tagsIdx = lower.findIndex((h) => ["tags", "tag", "labels"].includes(h));

  return {
    front: frontIdx >= 0 ? frontIdx : 0,
    back: backIdx >= 0 ? backIdx : Math.min(1, headers.length - 1),
    tags: tagsIdx >= 0 ? tagsIdx : undefined,
  };
}
