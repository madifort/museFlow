import React, { useEffect, useState } from "react";
import { getCache, clearCache } from "../storage/cache";

export default function DashboardView() {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    getCache().then((data) => {
      if (data && data.responses) setHistory(data.responses);
    });
  }, []);

  const handleClear = async () => {
    await clearCache();
    setHistory([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-white p-6">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">MuseFlow Dashboard</h1>
        <button
          onClick={handleClear}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-lg text-sm font-medium"
        >
          Clear History
        </button>
      </header>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {history.map((entry, idx) => (
          <div
            key={idx}
            className="p-4 rounded-xl bg-slate-800 border border-slate-700 shadow hover:shadow-xl transition-all"
          >
            <p className="text-sm text-slate-200 whitespace-pre-line">
              {entry}
            </p>
          </div>
        ))}
      </div>
      {history.length === 0 && (
        <p className="text-slate-400 text-center mt-20">
          No recent interactions yet.
        </p>
      )}
    </div>
  );
}
