// Tests del módulo interview (service con mocks de DeepSeek y repository).
jest.mock('../../src/services/deepseekService', () => ({
  generarPreguntasEntrevista: jest.fn(async () => ['¿Cuál es tu mayor logro?']),
  evaluarEntrevista: jest.fn(async () => ({ puntuacion: 85, resumen: 'Buen desempeño' })),
}));
jest.mock('../../src/modules/interview/interview.repository');

const repo = require('../../src/modules/interview/interview.repository');
const svc = require('../../src/modules/interview/interview.service');

beforeEach(() => jest.clearAllMocks());

describe('interview.service.generarPreguntas', () => {
  test('lanza ValidationError sin cargo', async () => {
    await expect(svc.generarPreguntas({})).rejects.toMatchObject({ code: 'VALIDATION' });
  });

  test('genera preguntas con cargo válido', async () => {
    const out = await svc.generarPreguntas({ cargo: 'Backend Dev' });
    expect(out.preguntas).toHaveLength(1);
  });
});

describe('interview.service.evaluar', () => {
  test('lanza ValidationError sin preguntas/respuestas', async () => {
    await expect(svc.evaluar({}, 'u1', { preguntas: [], respuestas: [] }))
      .rejects.toMatchObject({ code: 'VALIDATION' });
  });

  test('evalúa y GUARDA reporte en evaluación final', async () => {
    const out = await svc.evaluar({}, 'u1', {
      cargo: 'Dev', preguntas: ['P1'], respuestas: ['R1'], feedbackPorPregunta: false,
    });
    expect(out.puntuacion).toBe(85);
    expect(repo.saveReport).toHaveBeenCalledTimes(1);
  });

  test('NO guarda reporte en feedback por pregunta', async () => {
    await svc.evaluar({}, 'u1', {
      cargo: 'Dev', preguntas: ['P1'], respuestas: ['R1'], feedbackPorPregunta: true,
    });
    expect(repo.saveReport).not.toHaveBeenCalled();
  });
});
