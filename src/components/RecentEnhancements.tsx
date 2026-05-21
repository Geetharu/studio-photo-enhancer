import React from 'react';
import { Clock } from 'lucide-react';
import { HistoryEntry } from '../utils/enhancementHistory';

interface RecentEnhancementsProps {
  entries: HistoryEntry[];
  activeId: string | null;
  onSelect: (entry: HistoryEntry) => void;
}

export default function RecentEnhancements({
  entries,
  activeId,
  onSelect,
}: RecentEnhancementsProps) {
  if (entries.length === 0) return null;

  return (
    <section
      id="recent-enhancements"
      className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-3.5 h-3.5 text-amber-500" />
        <h3 className="text-[10px] font-mono tracking-widest uppercase font-bold text-zinc-400">
          Recent Enhancements
        </h3>
        <span className="text-[9px] font-mono text-zinc-600 ml-auto">
          {entries.length} saved locally
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-1">
        {entries.map((entry) => (
          <button
            key={entry.id}
            type="button"
            id={`history-thumb-${entry.id}`}
            onClick={() => onSelect(entry)}
            className={`group relative shrink-0 w-24 h-24 md:w-28 md:h-28 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
              activeId === entry.id
                ? 'border-amber-500 ring-2 ring-amber-500/30'
                : 'border-zinc-800 hover:border-zinc-600'
            }`}
            title={`Enhanced ${new Date(entry.savedAt).toLocaleString()}`}
          >
            <img
              src={entry.imageUrl}
              alt="Recent enhancement"
              className="w-full h-full object-cover"
            />
            <span className="absolute inset-0 bg-zinc-950/0 group-hover:bg-zinc-950/20 transition-colors" />
            <span className="absolute bottom-1 left-1 right-1 text-[8px] font-mono text-zinc-200 bg-zinc-950/70 rounded px-1 py-0.5 truncate opacity-0 group-hover:opacity-100 transition-opacity">
              {new Date(entry.savedAt).toLocaleDateString()}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
