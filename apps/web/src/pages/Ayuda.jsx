import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useLocation } from 'react-router-dom';
import { parseManualSections, slugify } from '../utils/parseManual';
import ManualSearch from '../components/help/ManualSearch';
import ManualToc from '../components/help/ManualToc';
import { useTrackEvent } from '../hooks/useTrackEvent';

export default function Ayuda() {
  const [markdown, setMarkdown] = useState('');
  const [activeAnchor, setActiveAnchor] = useState(null);
  const location = useLocation();
  const trackEvent = useTrackEvent();

  useEffect(() => {
    trackEvent('manual_open', 'ayuda', { hash: location.hash || null });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetch('/manual/manual-elvia.md', { cache: 'no-cache' })
      .then(r => r.ok ? r.text() : Promise.reject(new Error('No se pudo cargar el manual')))
      .then(setMarkdown)
      .catch(err => setMarkdown(`# Error\n\n${err.message}`));
  }, []);

  const sections = useMemo(() => parseManualSections(markdown), [markdown]);

  // Scroll a la sección indicada en el hash al cargar
  useEffect(() => {
    if (!markdown) return;
    const hash = location.hash.replace('#', '');
    if (hash) {
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setActiveAnchor(hash); }
      }, 100);
    }
  }, [markdown, location.hash]);

  // Scroll-spy: marca como activa la sección visible
  useEffect(() => {
    if (sections.length === 0) return;
    const handler = () => {
      let candidate = null;
      for (const s of sections) {
        const el = document.getElementById(s.anchor);
        if (el && el.getBoundingClientRect().top < 140) candidate = s.anchor;
      }
      if (candidate) setActiveAnchor(candidate);
    };
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, [sections]);

  const jumpTo = (anchor) => {
    const el = document.getElementById(anchor);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveAnchor(anchor);
      window.history.replaceState(null, '', `#${anchor}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <header className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-on-surface mb-2">Manual de Uso — ELVIA</h1>
        <p className="text-sm text-on-surface-variant">Aprende a sacar el máximo provecho de cada módulo. También puedes preguntarle a ELVIA en el chat.</p>
      </header>

      <div className="mb-6 max-w-2xl">
        <ManualSearch sections={sections} onJump={jumpTo} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8">
        <aside className="hidden lg:block">
          <ManualToc sections={sections} activeAnchor={activeAnchor} onJump={jumpTo} />
        </aside>

        <article className="manual-content prose prose-sm sm:prose lg:prose-lg max-w-none">
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 id={slugify(String(children))} className="text-3xl font-bold mt-6 mb-4 scroll-mt-24">{children}</h1>,
              h2: ({ children }) => <h2 id={slugify(String(children))} className="text-2xl font-bold mt-10 mb-3 scroll-mt-24 border-b border-outline-variant/30 pb-2">{children}</h2>,
              h3: ({ children }) => <h3 id={slugify(String(children))} className="text-lg font-semibold mt-6 mb-2 scroll-mt-24 text-primary">{children}</h3>,
              p: (props) => <p className="text-on-surface leading-relaxed mb-3" {...props} />,
              ul: (props) => <ul className="list-disc pl-6 mb-3 space-y-1" {...props} />,
              ol: (props) => <ol className="list-decimal pl-6 mb-3 space-y-1" {...props} />,
              a: ({ href, children, ...props }) => {
                const isExternal = href && (href.startsWith('http') || href.startsWith('//'));
                if (isExternal) {
                  return <a href={href} className="text-primary underline" target="_blank" rel="noreferrer" {...props}>{children}</a>;
                }
                const anchor = href?.replace(/^#/, '');
                return (
                  <button
                    type="button"
                    onClick={() => anchor && jumpTo(anchor)}
                    className="text-primary underline text-left"
                    {...props}
                  >{children}</button>
                );
              },
            }}
          >
            {markdown}
          </ReactMarkdown>
        </article>
      </div>
    </div>
  );
}
