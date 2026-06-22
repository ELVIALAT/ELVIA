// backend/tests/loadManual.test.js
const { loadManual, getManualText, getManualSections } = require('../src/lib/loadManual');

describe('loadManual', () => {
  test('carga el manual desde backend/data/manual-elvia.md', () => {
    loadManual({ force: true });
    const text = getManualText();
    expect(text).toContain('Manual de Uso');
    expect(text.length).toBeGreaterThan(5000);
  });

  test('expone las secciones principales con sus anclas', () => {
    loadManual({ force: true });
    const sections = getManualSections();
    const titles = sections.map(s => s.title);
    expect(titles).toContain('Módulo 1: Autoconocimiento');
    expect(titles).toContain('Módulo 3: CV vs Vacante');
    expect(titles).toContain('Módulo 9: Mis Métricas');
    const modulo1 = sections.find(s => s.title === 'Módulo 1: Autoconocimiento');
    expect(modulo1).toBeDefined();
    expect(modulo1.anchor).toBe('modulo-1-autoconocimiento');
  });

  test('lanza error claro si el archivo no existe', () => {
    const originalPath = process.env.MANUAL_PATH;
    process.env.MANUAL_PATH = '/tmp/no-existe-123.md';
    expect(() => loadManual({ force: true })).toThrow(/manual-elvia\.md/);
    process.env.MANUAL_PATH = originalPath;
  });
});
