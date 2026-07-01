// Tests del módulo mentor (chat general + chat manual) vía supertest.
const request = require('supertest');
const express = require('express');

// Mock auth: 'Bearer valid-token' → usuario autenticado
jest.mock('../../src/middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === 'Bearer valid-token') {
    req.user = { id: 'test-user-id', email: 'test@example.com', company_id: 'comp-1' };
    return next();
  }
  return res.status(401).json({ error: 'No autorizado' });
});

// Mocks de los services de IA y middlewares con efectos externos
jest.mock('../../src/platform/ai', () => ({
  generateChatResponse: jest.fn().mockResolvedValue('Mocked AI response'),
}));
jest.mock('../../src/services/claudeManualService', () => ({
  responderConManual: jest.fn().mockResolvedValue({
    respuesta: 'Respuesta del manual', citas: ['§1'], requiere_escalamiento: false,
  }),
}));
jest.mock('../../src/middleware/dailyCap', () => ({ dailyCap: (req, res, next) => next() }));
jest.mock('../../src/middleware/chatRateLimit', () => (req, res, next) => next());
jest.mock('../../src/middleware/manualChatLimit', () => (req, res, next) => next());

const { chatRouter, manualChatRouter } = require('../../src/modules/mentor/mentor.routes');
const { responderConManual } = require('../../src/services/claudeManualService');

const app = express();
app.use(express.json());
app.use('/api/chat/manual', manualChatRouter);
app.use('/api/chat', chatRouter);

describe('POST /api/chat (chat general)', () => {
  test('401 sin token', async () => {
    const res = await request(app).post('/api/chat').send({ message: 'Hola' });
    expect(res.status).toBe(401);
  });

  test('400 si falta message', async () => {
    const res = await request(app).post('/api/chat').set('Authorization', 'Bearer valid-token').send({});
    expect(res.status).toBe(400);
  });

  test('200 con respuesta de IA', async () => {
    const res = await request(app).post('/api/chat')
      .set('Authorization', 'Bearer valid-token').send({ message: 'Hola', history: [] });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Mocked AI response');
  });
});

describe('POST /api/chat/manual (modo manual)', () => {
  test('400 si message vacío', async () => {
    const res = await request(app).post('/api/chat/manual')
      .set('Authorization', 'Bearer valid-token').send({ message: '' });
    expect(res.status).toBe(400);
  });

  test('pasa company_id al userContext y devuelve respuesta con citas', async () => {
    const res = await request(app).post('/api/chat/manual')
      .set('Authorization', 'Bearer valid-token').send({ message: '¿Cómo genero un CV?' });
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Respuesta del manual');
    expect(res.body.citas).toEqual(['§1']);
    // El controller debe haber pasado isB2B=true (company_id presente)
    expect(responderConManual).toHaveBeenCalledWith(
      expect.objectContaining({ userContext: expect.objectContaining({ isB2B: true }) })
    );
  });
});
