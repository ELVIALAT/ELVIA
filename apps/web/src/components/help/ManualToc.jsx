// frontend/src/components/help/ManualToc.jsx
export default function ManualToc({ sections, activeAnchor, onJump }) {
  const h2 = sections.filter(s => s.level === 2);
  return (
    <nav className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2">
      <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant mb-3">Contenido</p>
      <ul className="space-y-1">
        {h2.map((s) => {
          const subs = sections.filter(x => x.level === 3 && sectionsBelongTo(sections, x, s));
          const isActive = activeAnchor === s.anchor || subs.some(x => x.anchor === activeAnchor);
          return (
            <li key={s.anchor}>
              <button
                type="button"
                onClick={() => onJump(s.anchor)}
                className={`block w-full text-left text-sm py-1.5 px-2 rounded-lg transition-colors ${isActive ? 'bg-primary/10 text-primary font-semibold' : 'text-on-surface hover:bg-surface-container'}`}
              >
                {s.title}
              </button>
              {isActive && subs.length > 0 && (
                <ul className="ml-3 mt-1 mb-1 space-y-0.5 border-l border-outline-variant/40 pl-2">
                  {subs.slice(0, 8).map(sub => (
                    <li key={sub.anchor}>
                      <button
                        type="button"
                        onClick={() => onJump(sub.anchor)}
                        className={`block w-full text-left text-[12px] py-1 px-1 rounded transition-colors ${activeAnchor === sub.anchor ? 'text-primary font-semibold' : 'text-on-surface-variant hover:text-on-surface'}`}
                      >
                        {sub.title}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

// Returns true if sub appears AFTER parent and BEFORE the next H2
function sectionsBelongTo(all, sub, parent) {
  const parentIdx = all.findIndex(x => x.anchor === parent.anchor);
  const nextH2Idx = all.findIndex((x, i) => i > parentIdx && x.level === 2);
  const subIdx = all.findIndex(x => x.anchor === sub.anchor);
  if (subIdx <= parentIdx) return false;
  if (nextH2Idx === -1) return true;
  return subIdx < nextH2Idx;
}
