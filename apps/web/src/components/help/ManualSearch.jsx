// frontend/src/components/help/ManualSearch.jsx
import { useMemo, useState, useEffect } from 'react';
import Fuse from 'fuse.js';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function ManualSearch({ sections, onJump }) {
  const [q, setQ] = useState('');
  const fuse = useMemo(() => new Fuse(sections, {
    keys: ['title', 'body'],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 3,
  }), [sections]);

  const [results, setResults] = useState([]);
  useEffect(() => {
    if (q.trim().length < 3) { setResults([]); return; }
    setResults(fuse.search(q).slice(0, 8).map(r => r.item));
  }, [q, fuse]);

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-white border border-outline-variant/40 rounded-full px-4 py-2 shadow-sm">
        <MagnifyingGlass size={18} className="text-on-surface-variant" />
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca en el manual (ej. cómo guardar CV)"
          className="flex-1 bg-transparent text-sm focus:outline-none"
        />
      </div>

      {results.length > 0 && (
        <ul className="absolute z-20 left-0 right-0 mt-2 bg-white border border-outline-variant/30 rounded-2xl shadow-lg max-h-80 overflow-y-auto">
          {results.map((r) => (
            <li key={r.anchor}>
              <button
                type="button"
                onClick={() => { onJump(r.anchor); setQ(''); setResults([]); }}
                className="w-full text-left px-4 py-3 hover:bg-primary/5 border-b border-outline-variant/10 last:border-none"
              >
                <p className="font-semibold text-sm text-on-surface">{r.title}</p>
                <p className="text-xs text-on-surface-variant line-clamp-2">{r.body ? r.body.slice(0, 140) + '…' : ''}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
