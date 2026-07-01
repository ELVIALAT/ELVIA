// Tests del módulo linkedin (service con mocks del repository y router de IA).
jest.mock('../../src/platform/ai', () => ({
  analizarLinkedin: jest.fn(async () => ({ puntaje_global: 80, resumen_global: 'ok', top_acciones: [], secciones: {} })),
  extraerDatosLinkedin: jest.fn(async () => ({ titular: 'X' })),
}));
jest.mock('../../src/utils/pdfParser', () => ({
  extraerTextoPDF: jest.fn(async () => 'Juan Perez ingeniero de sistemas'),
}));
jest.mock('../../src/modules/linkedin/linkedin.repository');

const repo = require('../../src/modules/linkedin/linkedin.repository');
const svc = require('../../src/modules/linkedin/linkedin.service');

beforeEach(() => jest.clearAllMocks());

describe('linkedin.service.getUsoMes', () => {
  test('calcula restantes a partir de los usados', async () => {
    repo.countAnalysesThisMonth.mockResolvedValue(3);
    const uso = await svc.getUsoMes({}, 'u1');
    expect(uso).toMatchObject({ usados: 3, restantes: 7, limite: 10 });
  });
});

describe('linkedin.service.analizarPerfil', () => {
  test('lanza ValidationError si no hay ninguna sección', async () => {
    await expect(svc.analizarPerfil({}, 'u1', {})).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  test('lanza MonthlyLimitError al alcanzar el límite', async () => {
    repo.countAnalysesThisMonth.mockResolvedValue(10);
    await expect(svc.analizarPerfil({}, 'u1', { titular: 'Dev' }))
      .rejects.toMatchObject({ code: 'MONTHLY_LIMIT', usados: 10 });
  });

  test('analiza y persiste cuando hay capacidad', async () => {
    repo.countAnalysesThisMonth.mockResolvedValue(0);
    repo.getJobSearchProfile.mockResolvedValue({});
    repo.getRecentCvs.mockResolvedValue([]);
    const out = await svc.analizarPerfil({}, 'u1', { titular: 'Senior Dev' });
    expect(out.puntaje_global).toBe(80);
    expect(repo.insertAnalysis).toHaveBeenCalledTimes(1);
  });
});

describe('linkedin.service.extraerPerfilPDF', () => {
  test('rechaza si el nombre del PDF no coincide con el perfil', async () => {
    repo.getUserName.mockResolvedValue({ nombre1: 'Maria', apellido1: 'Lopez' });
    await expect(svc.extraerPerfilPDF({}, 'u1', Buffer.from('x')))
      .rejects.toMatchObject({ code: 'IDENTITY_MISMATCH' });
  });

  test('extrae datos si la identidad coincide', async () => {
    repo.getUserName.mockResolvedValue({ nombre1: 'Juan', apellido1: 'Perez' });
    const out = await svc.extraerPerfilPDF({}, 'u1', Buffer.from('x'));
    expect(out).toEqual({ titular: 'X' });
  });

  test('lanza ValidationError sin archivo', async () => {
    await expect(svc.extraerPerfilPDF({}, 'u1', null)).rejects.toMatchObject({ code: 'VALIDATION' });
  });
});

describe('linkedin.service.guardarReporte', () => {
  test('rechaza si falta analisis', async () => {
    await expect(svc.guardarReporte({}, 'u1', {})).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  test('guarda y devuelve id', async () => {
    repo.replaceReport.mockResolvedValue('report-1');
    const out = await svc.guardarReporte({}, 'u1', { analisis: { puntaje_global: 90 } });
    expect(out).toEqual({ id: 'report-1', ok: true });
  });
});
