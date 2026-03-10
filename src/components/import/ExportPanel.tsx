"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/Toast";
import { exportDeckJSON, exportDeckCSV } from "@/lib/actions/export";
import { Download } from "react-feather";

function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportPanel({
  deckId,
  deckName,
}: {
  deckId: string;
  deckName: string;
}) {
  const { addToast } = useToast();
  const [exporting, setExporting] = useState(false);

  async function handleExport(format: "json" | "csv") {
    setExporting(true);
    try {
      if (format === "json") {
        const content = await exportDeckJSON(deckId);
        downloadFile(content, `${deckName}.json`, "application/json");
      } else {
        const content = await exportDeckCSV(deckId);
        downloadFile(content, `${deckName}.csv`, "text/csv");
      }
      addToast.success(`Exported as ${format.toUpperCase()}`);
    } catch {
      addToast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Choose an export format for &ldquo;{deckName}&rdquo;.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => handleExport("json")}
          disabled={exporting}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow disabled:opacity-50"
        >
          <Download size={20} className="text-indigo-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">JSON</p>
            <p className="text-xs text-gray-500">Re-importable format</p>
          </div>
        </button>
        <button
          onClick={() => handleExport("csv")}
          disabled={exporting}
          className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow disabled:opacity-50"
        >
          <Download size={20} className="text-indigo-600" />
          <div className="text-left">
            <p className="text-sm font-semibold text-gray-900">CSV</p>
            <p className="text-xs text-gray-500">Spreadsheet compatible</p>
          </div>
        </button>
      </div>
    </div>
  );
}
