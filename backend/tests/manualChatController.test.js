// backend/tests/manualChatController.test.js
jest.mock('../src/services/claudeManualService', () => ({
  responderConManual: jest.fn(),
}));

const { responderConManual } = require('../src/services/claudeManualService');
const { handleManualChat } = require('../src/controllers/manualChatController');

function mockReqRes(body, user) {
  const req = { body, user };
  const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };
  const next = jest.fn();
  return { req, res, next };
}

describe('handleManualChat', () => {
  beforeEach(() => responderConManual.mockReset());

  test('400 si message vacio', async () => {
    const { req, res, next } = mockReqRes({}, { id: 'u1' });
    await handleManualChat(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('400 si message > 1000 chars', async () => {
    const long = 'a'.repeat(1001);
    const { req, res, next } = mockReqRes({ message: long }, { id: 'u1' });
    await handleManualChat(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('pasa company_id al userContext y devuelve respuesta del service', async () => {
    responderConManual.mockResolvedValue({
      respuesta: 'Test ok',
      citas: [{ seccion: 'Módulo 1', anchor: 'modulo-1' }],
      requiere_escalamiento: false,
    });
    const { req, res } = mockReqRes(
      { message: '¿dónde encuentro mi CV?' },
      { id: 'u1', company_id: 'tel-uuid', tenant_slug: 'telefonica' }
    );
    await handleManualChat(req, res, jest.fn());
    const args = responderConManual.mock.calls[0][0];
    expect(args.userContext.isB2B).toBe(true);
    expect(args.userContext.tenantSlug).toBe('telefonica');
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      reply: 'Test ok',
      citas: [{ seccion: 'Módulo 1', anchor: 'modulo-1' }],
      requiere_escalamiento: false,
    }));
  });
});
