"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/Toast";
import { Upload } from "react-feather";
import { importJSON, importCSV, importAnki } from "@/lib/actions/import";
import { parseCSV, autoDetectMapping } from "@/lib/import/csv-parser";
import { parseApkg } from "@/lib/import/anki-parser";

type ImportStep = "upload" | "preview" | "importing" | "done";

interface ImportResult {
  deckId: string;
  deckName: string;
  cardCount: number;
  errorCount: number;
}

export function ImportUpload() {
  const router = useRouter();
  const { addToast } = useToast();
  const [step, setStep] = useState<ImportStep>("upload");
  const [dragOver, setDragOver] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    const name = file.name.toLowerCase();

    try {
      if (name.endsWith(".json")) {
        setStep("importing");
        const text = await file.text();
        const res = await importJSON(text, file.name);
        setResult(res);
        setStep("done");
        addToast.success(`Imported ${res.cardCount} cards`);
      } else if (name.endsWith(".csv") || name.endsWith(".tsv")) {
        setStep("importing");
        const text = await file.text();
        const parsed = parseCSV(text);
        if (parsed.rows.length === 0) {
          setError("No data rows found in file");
          setStep("upload");
          return;
        }
        const mapping = autoDetectMapping(parsed.headers);
        const deckName = file.name.replace(/\.(csv|tsv)$/i, "");
        const res = await importCSV(parsed.rows, mapping, deckName, file.name);
        setResult(res);
        setStep("done");
        addToast.success(`Imported ${res.cardCount} cards`);
      } else if (name.endsWith(".apkg")) {
        setStep("importing");
        const buffer = await file.arrayBuffer();
        const parsed = await parseApkg(buffer);
        if (parsed.cards.length === 0) {
          setError("No cards found in .apkg file");
          setStep("upload");
          return;
        }
        const res = await importAnki(parsed.cards, parsed.deckName, file.name);
        setResult(res);
        setStep("done");
        addToast.success(`Imported ${res.cardCount} cards from Anki`);
      } else {
        setError("Unsupported file type. Use .json, .csv, .tsv, or .apkg");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
      setStep("upload");
      addToast.error("Import failed");
    }
  }, [addToast]);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }

  if (step === "importing") {
    return (
      <div className="text-center py-16">
        <div className="animate-spin h-8 w-8 border-2 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-gray-500">Importing cards...</p>
      </div>
    );
  }

  if (step === "done" && result) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-900">Import complete!</h2>
        <p className="mt-2 text-gray-500">
          {result.cardCount} cards imported to &ldquo;{result.deckName}&rdquo;
          {result.errorCount > 0 && ` (${result.errorCount} skipped)`}
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push(`/decks/${result.deckId}`)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700"
          >
            View deck
          </button>
          <button
            onClick={() => { setStep("upload"); setResult(null); }}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Import another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
          dragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300 bg-white"
        }`}
      >
        <Upload size={40} className="mx-auto text-gray-400 mb-4" />
        <p className="text-sm text-gray-600 mb-2">
          Drag and drop a file here, or click to browse
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Supports .json, .csv, .tsv, and .apkg (Anki)
        </p>
        <label className="inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm text-white font-medium hover:bg-indigo-700 cursor-pointer">
          Choose file
          <input
            type="file"
            accept=".json,.csv,.tsv,.apkg"
            onChange={handleFileInput}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Supported formats</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p><strong>JSON</strong> — {`{ "deck_name": "...", "cards": [{ "front": "...", "back": "..." }] }`}</p>
          <p><strong>CSV/TSV</strong> — First row as headers (front, back, tags columns)</p>
          <p><strong>Anki .apkg</strong> — Exported from Anki (File &gt; Export)</p>
        </div>
      </div>
    </div>
  );
}
