// frontend/src/utils/parseManual.test.js
import { describe, test, expect } from 'vitest';
import { parseManualSections, slugify } from './parseManual';

const SAMPLE = `# Manual

## Módulo 1: Autoconocimiento

Intro del modulo.

### ¿Qué es el módulo?

Respuesta de prueba.

## Módulo 2: LinkedIn® Pro

Otra sección.`;

describe('parseManual', () => {
  test('slugify quita acentos y simbolos', () => {
    expect(slugify('Módulo 3: CV vs Vacante')).toBe('modulo-3-cv-vs-vacante');
    expect(slugify('LinkedIn® Pro')).toBe('linkedin-pro');
    expect(slugify('1.1 Mi Perfil')).toBe('11-mi-perfil');
  });

  test('parseManualSections extrae H2 y H3 con anclas', () => {
    const sections = parseManualSections(SAMPLE);
    expect(sections).toHaveLength(3);
    expect(sections[0]).toMatchObject({
      level: 2,
      title: 'Módulo 1: Autoconocimiento',
      anchor: 'modulo-1-autoconocimiento'
    });
    expect(sections[1]).toMatchObject({
      level: 3,
      title: '¿Qué es el módulo?'
    });
    expect(sections[2]).toMatchObject({
      level: 2,
      title: 'Módulo 2: LinkedIn® Pro',
      anchor: 'modulo-2-linkedin-pro'
    });
  });

  test('retorna array vacío para markdown vacío', () => {
    expect(parseManualSections('')).toEqual([]);
    expect(parseManualSections(null)).toEqual([]);
  });
});
