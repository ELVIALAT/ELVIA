// frontend/src/utils/parseManual.js
// Parser ligero del manual ELVIA para alimentar TOC y buscador fuse.js.

export function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[®©™]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function parseManualSections(markdown) {
  if (!markdown) return [];
  const lines = markdown.replace(/\r/g, '').split('\n');
  const sections = [];
  let current = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      if (current) sections.push(current);
      current = {
        level: m[1].length,
        title: m[2].trim(),
        anchor: slugify(m[2].trim()),
        body: [],
      };
    } else if (current) {
      current.body.push(lines[i]);
    }
  }
  if (current) sections.push(current);
  return sections.map(s => ({ ...s, body: s.body.join('\n').trim() }));
}
